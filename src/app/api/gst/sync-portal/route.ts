import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  listWorkspaceRecords,
  appendPgAuditLog,
} from "@/lib/server/pgHelpers";
import { lookupGstin, lookupGstReturns, fetchGstr2bFromApi } from "@/lib/gst/gstinApiClient";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { parseOfficialGstr2bJson } from "@/lib/parsers/gstr2bParser";
import { getPeriodsForFy } from "@/lib/gst/gstClientFetch";

const MONTH_MAP: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December",
};

function normalizeGstnPeriodToLabel(rawPeriod: string): string {
  const s = (rawPeriod || "").trim();
  const mmyyyy = s.match(/^(\d{2})(\d{4})$/);
  if (mmyyyy && MONTH_MAP[mmyyyy[1]]) {
    return `${MONTH_MAP[mmyyyy[1]]} ${mmyyyy[2]}`;
  }
  return s;
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const body = await req.json();
    const action = body.action as string;
    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    // 1. LIVE GSTN RETURN STATUS SYNC -> AUTO-UPDATE FILING DESK TASKS
    if (action === "SYNC_FILING_STATUS") {
      const fy = String(body.fy || "2025-26");
      const targetGstin = body.gstin ? String(body.gstin).trim().toUpperCase() : "";

      const [{ rows: entRows }, { rows: taskRows }, gstProfileRecs] = await Promise.all([
        pool.query("SELECT id, entity_name, gstin, primary_contact_phone FROM public.client_entities WHERE firm_id = $1", [firmId]),
        pool.query("SELECT * FROM public.compliance_tasks WHERE firm_id = $1 AND category = 'GST'", [firmId]),
        listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE"),
      ]);

      const profileMap = new Map<string, any>();
      for (const r of gstProfileRecs) {
        const eid = r.entity_id || r.payload?.entityId;
        if (eid) profileMap.set(eid, r.payload);
      }

      const gstinTargets: Array<{ entityId: string; entityName: string; gstin: string }> = [];
      for (const ent of entRows) {
        const prof = profileMap.get(ent.id);
        const recs: any[] = Array.isArray(prof?.gstinRecords) && prof.gstinRecords.length > 0
          ? prof.gstinRecords
          : ent.gstin
          ? [{ gstin: ent.gstin, status: "ACTIVE" }]
          : [];
        for (const r of recs) {
          const g = String(r.gstin || "").trim().toUpperCase();
          if (!g) continue;
          if (targetGstin && g !== targetGstin) continue;
          gstinTargets.push({ entityId: ent.id, entityName: ent.entity_name, gstin: g });
        }
      }

      let syncedCount = 0;
      let updatedTasks = 0;
      const errors: string[] = [];

      for (const tgt of gstinTargets.slice(0, 30)) {
        const retRes = await lookupGstReturns(tgt.gstin, fy);
        if (!retRes?.success) {
          errors.push(`${tgt.gstin}: ${retRes?.error || "Lookup failed"}`);
          continue;
        }
        syncedCount++;
        const returnsList: any[] = retRes.returns || retRes.data?.returns || retRes.EFiledlist || [];

        for (const r of returnsList) {
          const rType = String(r.returnType || r.rtntype || "").toUpperCase();
          const rStatus = String(r.filingStatus || r.status || "").toUpperCase();
          if (!rStatus.includes("FILED")) continue;

          const periodRaw = String(r.returnPeriod || r.ret_prd || "");
          const periodLabel = normalizeGstnPeriodToLabel(periodRaw);
          const arn = String(r.arn || "").trim();
          const dof = String(r.filingDate || r.dof || "").trim();

          const matchedTask = taskRows.find((t: any) => {
            if (t.entity_id !== tgt.entityId) return false;
            if (t.status === "FILED_AND_COMPLETED") return false;
            const titleUpper = String(t.title || "").toUpperCase();
            const is1 = rType.includes("1") && (titleUpper.includes("GSTR-1") || titleUpper.includes("GSTR1") || titleUpper.includes("IFF"));
            const is3b = rType.includes("3B") && (titleUpper.includes("GSTR-3B") || titleUpper.includes("GSTR3B"));
            const is9 = rType.includes("9") && titleUpper.includes("GSTR-9");
            if (!is1 && !is3b && !is9) return false;
            const pMatch =
              String(t.period || "").toLowerCase() === periodLabel.toLowerCase() ||
              String(t.period || "").includes(periodRaw);
            return pMatch;
          });

          if (matchedTask) {
            await pool.query(
              `UPDATE public.compliance_tasks
               SET status = 'FILED_AND_COMPLETED',
                   arn_number = COALESCE(NULLIF($1, ''), arn_number),
                   filing_date = COALESCE(NULLIF($2, '')::date, filing_date, CURRENT_DATE),
                   penalty_risk = 0,
                   accruing_daily_penalty = 0,
                   updated_at = now()
               WHERE id = $3 AND firm_id = $4`,
              [arn, dof, matchedTask.id, firmId]
            );
            updatedTasks++;
          }
        }
      }

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Practice Staff",
        actorRole: auth.role || "PARTNER",
        entityName: targetGstin || "Firm-Wide GSTINs",
        action: "GSTN_FILING_SYNC",
        details: `Synced ${syncedCount} GSTIN(s) via GSTN API for FY ${fy}; auto-marked ${updatedTasks} filed return task(s).`,
        category: "COMPLIANCE",
      });

      return NextResponse.json({
        success: true,
        syncedGstins: syncedCount,
        updatedTasks,
        errors,
      });
    }

    // 2. LIVE GSTR-2B API FETCH (gstinapi.in GSP)
    if (action === "FETCH_2B") {
      const gstin = String(body.gstin || "").trim().toUpperCase();
      const returnPeriod = String(body.returnPeriod || "").trim(); // MMYYYY
      if (!gstin || !returnPeriod) {
        return NextResponse.json({ success: false, error: "gstin and returnPeriod (MMYYYY) required." }, { status: 400 });
      }
      const apiRes = await fetchGstr2bFromApi({ gstin, returnPeriod });
      if (!apiRes?.success) {
        return NextResponse.json(
          {
            success: false,
            error: apiRes?.error || apiRes?.message || "GSTR-2B GSP API requires taxpayer OTP authorization on GST Portal.",
            raw: apiRes,
          },
          { status: 400 }
        );
      }
      const parsed = parseOfficialGstr2bJson(apiRes.data || apiRes);
      return NextResponse.json({
        success: parsed.success,
        invoices: parsed.invoices,
        totalInvoices: parsed.totalInvoices,
        totalTax: parsed.totalTax,
        errors: parsed.errors,
      });
    }

    // 3. BULK VENDOR GSTN VERIFICATION
    if (action === "BATCH_VENDOR_VERIFY") {
      const gstins: string[] = Array.isArray(body.gstins) ? body.gstins.slice(0, 40) : [];
      const fy = String(body.fy || "2025-26");
      const results: Record<string, any> = {};

      for (const rawG of gstins) {
        const check = validateGstinDetailed(rawG);
        if (!check.isValid) {
          results[rawG] = { status: "INVALID", error: check.error };
          continue;
        }
        const res = await lookupGstin(check.cleanGstin);
        if (!res.success || !res.data) {
          results[check.cleanGstin] = { status: "UNVERIFIED", error: res.error };
          continue;
        }
        const retRes = await lookupGstReturns(check.cleanGstin, fy);
        const retList: any[] = retRes?.returns || retRes?.data?.returns || [];
        const r1 = retList.filter((r) => String(r.returnType || "").includes("1"));
        const r3b = retList.filter((r) => String(r.returnType || "").includes("3B"));

        const stRaw = String(res.data.status || "").toUpperCase();
        const normStatus = stRaw.includes("CANCEL")
          ? "CANCELLED"
          : stRaw.includes("SUSPEND")
          ? "SUSPENDED"
          : "ACTIVE";

        results[check.cleanGstin] = {
          status: normStatus,
          legalName: res.data.legalName,
          regDate: res.data.registrationDate,
          gstr1Filed: r1.filter((r) => String(r.filingStatus || "").toUpperCase().includes("FILED")).length,
          gstr1Total: r1.length || undefined,
          gstr3bFiled: r3b.filter((r) => String(r.filingStatus || "").toUpperCase().includes("FILED")).length,
          gstr3bTotal: r3b.length || undefined,
        };
      }

      return NextResponse.json({ success: true, results });
    }

    // 4. FIRM-WIDE BATCH GST PIPELINE SUMMARY
    if (action === "FIRM_PIPELINE") {
      const fy = String(body.fy || "2025-26");
      const period = String(body.period || getPeriodsForFy(fy)[0] || "");

      const [{ rows: entRows }, { rows: taskRows }, gstProfileRecs, recoRecs, gstr1Recs, metaRecs] =
        await Promise.all([
          pool.query("SELECT id, entity_name, pan, gstin, turnover_cr, primary_contact_name, primary_contact_phone FROM public.client_entities WHERE firm_id = $1 ORDER BY entity_name ASC", [firmId]),
          pool.query("SELECT * FROM public.compliance_tasks WHERE firm_id = $1 AND category = 'GST'", [firmId]),
          listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE"),
          listWorkspaceRecords<any>(firmId, "GST_RECONCILIATION"),
          listWorkspaceRecords<any>(firmId, "GST_GSTR1_DATA"),
          listWorkspaceRecords<any>(firmId, "GST_FILING_METADATA"),
        ]);

      const profileByEntity = new Map<string, any>();
      for (const r of gstProfileRecs) {
        const eid = r.entity_id || r.payload?.entityId;
        if (eid) profileByEntity.set(eid, r.payload);
      }

      const metaByTask = new Map<string, any>();
      for (const r of metaRecs) {
        if (r.payload?.taskId) metaByTask.set(r.payload.taskId, r.payload);
      }

      const rows: any[] = [];
      for (const ent of entRows) {
        const prof = profileByEntity.get(ent.id);
        const gstins: any[] =
          Array.isArray(prof?.gstinRecords) && prof.gstinRecords.length > 0
            ? prof.gstinRecords
            : ent.gstin
            ? [{ gstin: ent.gstin, stateName: "", filingFrequency: "MONTHLY", status: "ACTIVE" }]
            : [];

        for (const g of gstins) {
          const cleanG = String(g.gstin || "").trim().toUpperCase();
          if (!cleanG) continue;

          const recoKey = `reco-${cleanG}-${period}`.replace(/\s+/g, "_");
          const g1Key = `gstr1-${cleanG}-${period}`.replace(/\s+/g, "_");
          const reco = recoRecs.find((r) => r.payload?.id === recoKey)?.payload;
          const g1 = gstr1Recs.find((r) => r.payload?.id === g1Key)?.payload;

          const task1 = taskRows.find(
            (t: any) =>
              t.entity_id === ent.id &&
              String(t.period || "") === period &&
              /gstr-?1|iff/i.test(String(t.title || ""))
          );
          const task3b = taskRows.find(
            (t: any) =>
              t.entity_id === ent.id &&
              String(t.period || "") === period &&
              /gstr-?3b/i.test(String(t.title || ""))
          );
          const meta3b = task3b ? metaByTask.get(task3b.id) : null;

          const exceptionsCount =
            (reco?.vendorNoticeCount || 0) + (reco?.rule37aRiskCount || 0) + (g1?.issuesErrorCount || 0);

          rows.push({
            entityId: ent.id,
            entityName: ent.entity_name,
            contactName: ent.primary_contact_name || "",
            contactPhone: ent.primary_contact_phone || "",
            gstin: cleanG,
            stateName: g.stateName || "",
            filingFrequency: g.filingFrequency || "MONTHLY",
            gstr1Prepared: Boolean(g1),
            gstr1OutwardTax: g1?.totals?.totalTax || 0,
            gstr1Status: task1?.status || "NOT_CREATED",
            gstr1Arn: task1?.arn_number || null,
            recoDone: Boolean(reco),
            eligibleItc: reco?.netItc4C?.total ?? reco?.eligibleItcInr ?? 0,
            missing2bItc: reco?.missingItcInr || 0,
            exceptionsCount,
            gstr3bStatus: task3b?.status || "NOT_CREATED",
            gstr3bArn: task3b?.arn_number || null,
            cashPayable: meta3b?.cashPaid ?? null,
            isCleanProfile: Boolean(g1) && Boolean(reco) && exceptionsCount === 0,
          });
        }
      }

      return NextResponse.json({ success: true, period, fy, rows });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "GST portal sync failed" },
      { status: 500 }
    );
  }
}
