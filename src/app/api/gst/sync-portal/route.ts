import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
  appendPgAuditLog,
} from "@/lib/server/pgHelpers";
import { lookupGstin, lookupGstReturns, fetchGstr2bFromApi } from "@/lib/gst/gstinApiClient";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { parseOfficialGstr2bJson } from "@/lib/parsers/gstr2bParser";
import { getPeriodsForFy } from "@/lib/gst/gstClientFetch";
import { reconcileGstinsWithPortal } from "@/lib/gst/gstReconcileServer";
import {
  buildGstTaskTitle,
  canonicalizeReturnKind,
  computeGstTaskPriority,
  computeSec47LateFee,
  getCurrentIndianFy,
  getExpectedReturnKindsForPeriod,
  getExpectedReturnPeriodsForFy,
  getGstr10DueDate,
  getStatutoryGstDueDate,
  periodSortKey,
  resolveActiveGstCycle,
  taskMatchesGstin,
} from "@/lib/gst/gstComplianceEngine";

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

    // 1. TWO-WAY LIVE GSTN RETURN STATUS SYNC -> UPDATE FILED + BACKFILL UNFILED
    if (action === "SYNC_FILING_STATUS") {
      const fy = String(body.fy || getCurrentIndianFy());
      const targetGstin = body.gstin ? String(body.gstin).trim().toUpperCase() : undefined;
      const entityId = body.entityId ? String(body.entityId).trim() : undefined;

      const result = await reconcileGstinsWithPortal({
        firmId,
        fy,
        entityId,
        targetGstin,
      });

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Practice Staff",
        actorRole: auth.role || "PARTNER",
        entityName: targetGstin || "Firm-Wide GSTINs",
        action: "GSTN_FILING_SYNC",
        details: `Synced ${result.syncedGstins} GSTIN(s) via GSTN API for FY ${fy}; auto-marked ${result.updatedTasks} filed, backfilled ${result.createdBacklogTasks} unfiled backlog task(s).`,
        category: "COMPLIANCE",
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // 1B. MANUAL BASELINE & PERIOD RETURN GENERATION (Works without paid GSTN API credits)
    if (action === "MANUAL_BASELINE_SYNC") {
      const entityId = String(body.entityId || "").trim();
      const fy = String(body.fy || getCurrentIndianFy());
      const targetGstin = body.gstin ? String(body.gstin).trim().toUpperCase() : "";
      const filedUpTo = body.filedUpTo ? String(body.filedUpTo).trim() : ""; // "" | "NONE" | "August 2026"
      const singlePeriod = body.singlePeriod ? String(body.singlePeriod).trim() : "";

      if (!entityId) {
        return NextResponse.json({ success: false, error: "entityId is required." }, { status: 400 });
      }

      const [{ rows: entRows }, { rows: taskRows }, gstProfileRecs, gstMetaRecs] = await Promise.all([
        pool.query("SELECT id, entity_name, gstin FROM public.client_entities WHERE firm_id = $1 AND id = $2", [firmId, entityId]),
        pool.query("SELECT * FROM public.compliance_tasks WHERE firm_id = $1 AND entity_id = $2 AND category = 'GST'", [firmId, entityId]),
        listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE"),
        listWorkspaceRecords<any>(firmId, "GST_FILING_METADATA"),
      ]);

      const ent = entRows[0];
      if (!ent) {
        return NextResponse.json({ success: false, error: "Client entity not found." }, { status: 404 });
      }

      const prof = gstProfileRecs.find((r) => (r.entity_id || r.payload?.entityId) === entityId)?.payload || {};
      const metaGstinByTask = new Map<string, string>();
      for (const r of gstMetaRecs) {
        if (r.payload?.taskId && r.payload?.gstin) {
          metaGstinByTask.set(r.payload.taskId, String(r.payload.gstin).trim().toUpperCase());
        }
      }

      const rawRecs: any[] =
        Array.isArray(prof?.gstinRecords) && prof.gstinRecords.length > 0
          ? prof.gstinRecords
          : ent.gstin
          ? [{ gstin: ent.gstin, registrationType: prof?.gstFilingFrequency === "COMPOSITION" ? "COMPOSITION" : "REGULAR", filingFrequency: prof?.gstFilingFrequency === "QRMP" ? "QRMP" : "MONTHLY", qrmpStateGroup: "22ND", status: "ACTIVE", registrationDate: prof?.gstRegistrationDate }]
          : [];

      const activeRecs = rawRecs.filter((r) => {
        if (r.status && r.status !== "ACTIVE") return false;
        const g = String(r.gstin || "").trim().toUpperCase();
        if (g.length !== 15) return false;
        return !targetGstin || g === targetGstin;
      });

      if (activeRecs.length === 0) {
        return NextResponse.json({ success: false, error: "No active GSTIN found." }, { status: 400 });
      }

      const now = new Date();
      const activeCycle = resolveActiveGstCycle(now);
      const filedUpToKey = filedUpTo && filedUpTo !== "NONE" && filedUpTo !== "CURRENT_ONLY" ? periodSortKey(filedUpTo) : 0;

      let createdTasks = 0;
      let markedFiledHistory = 0;
      const prevHist: any[] = Array.isArray(prof.gstHistory) ? prof.gstHistory : [];
      let mergedHist = [...prevHist];

      for (const rec of activeRecs) {
        const cleanG = String(rec.gstin).trim().toUpperCase();
        const isComposition = rec.registrationType === "COMPOSITION";
        const expectedPeriods =
          filedUpTo === "CURRENT_ONLY" && singlePeriod
            ? [singlePeriod]
            : getExpectedReturnPeriodsForFy(fy, now, rec.registrationDate, isComposition);

        if (filedUpToKey > 0) {
          mergedHist = mergedHist.filter((h) => (h.gstin || "").trim().toUpperCase() !== cleanG);
        }

        for (const periodLabel of expectedPeriods) {
          const pk = periodSortKey(periodLabel);
          const isFiledByBaseline = filedUpToKey > 0 && pk > 0 && pk <= filedUpToKey;
          const isPastPeriod = periodLabel.toLowerCase() !== activeCycle.periodLabel.toLowerCase();
          const kinds = getExpectedReturnKindsForPeriod(rec, periodLabel);

          for (const kind of kinds) {
            if (isFiledByBaseline) {
              if (kind !== "PMT06") {
                mergedHist.push({
                  gstin: cleanG,
                  period: periodLabel,
                  returnType: kind === "GSTR1" ? "GSTR_1" : kind === "GSTR3B" ? "GSTR_3B" : "CMP_08",
                  arn: "FILED_PRIOR_TAKEOVER",
                  filingDate: "",
                  taxLiabilityCash: 0,
                  itcClaimed: 0,
                  delayDays: 0,
                  lateFeePaid: 0,
                });
                markedFiledHistory++;
              }
              continue;
            }

            const exists = taskRows.some((t: any) => {
              if (!taskMatchesGstin({ gstin: metaGstinByTask.get(t.id), title: t.title }, cleanG, ent.gstin)) {
                return false;
              }
              if (canonicalizeReturnKind(t.title) !== kind) return false;
              return String(t.period || "").toLowerCase() === periodLabel.toLowerCase();
            });

            if (!exists) {
              const dueDate = getStatutoryGstDueDate(periodLabel, kind, rec);
              const fee = computeSec47LateFee(dueDate, now);
              const title = buildGstTaskTitle(kind, { gstin: cleanG, filingFrequency: rec.filingFrequency || "MONTHLY" }, isPastPeriod && fee.daysLate > 0);
              const priority = computeGstTaskPriority(dueDate, now);
              const missingDocs =
                kind === "GSTR1"
                  ? ["B2B Sales Invoices & E-way Bill Summary"]
                  : kind === "PMT06"
                  ? ["35% Fixed-Sum / Self-Assessment Challan Check"]
                  : kind === "CMP08"
                  ? ["Quarterly Turnover Summary & Exempt Sales Split"]
                  : [`Bank Statement (${periodLabel})`, "Purchase Register & GSTR-2B ITC Match"];

              const ins = await pool.query(
                `INSERT INTO public.compliance_tasks (
                  firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty, missing_docs_list, chase_count
                ) VALUES ($1, $2, 'GST'::compliance_category, $3, $4, $5, 'DOCUMENTS_AWAITED'::workflow_status, $6::task_priority, $7, $8, $9::jsonb, 0)
                RETURNING *`,
                [firmId, entityId, title, periodLabel, dueDate, priority, fee.lateFee, fee.dailyRate, JSON.stringify(missingDocs)]
              );
              const insertedRow = ins.rows[0];
              if (insertedRow) {
                await upsertWorkspaceRecord({
                  firmId,
                  entityId,
                  recordType: "GST_FILING_METADATA",
                  matchKey: "taskId",
                  matchValue: insertedRow.id,
                  payload: { taskId: insertedRow.id, gstin: cleanG },
                });
                taskRows.push(insertedRow);
                metaGstinByTask.set(insertedRow.id, cleanG);
                createdTasks++;
              }
            }
          }
        }
      }

      const cancelledRecs = rawRecs.filter(
        (r) => r.status === "CANCELLED" && String(r.gstin || "").trim().length === 15 && (!targetGstin || String(r.gstin).trim().toUpperCase() === targetGstin)
      );
      for (const crec of cancelledRecs) {
        const cleanCg = String(crec.gstin).trim().toUpperCase();
        const exists10 = taskRows.some(
          (t: any) =>
            canonicalizeReturnKind(t.title) === "GSTR10" &&
            taskMatchesGstin({ gstin: metaGstinByTask.get(t.id), title: t.title }, cleanCg, ent.gstin)
        );
        if (!exists10) {
          const g10Due = getGstr10DueDate(crec.cancellationDate, now);
          const fee10 = computeSec47LateFee(g10Due, now);
          const ins10 = await pool.query(
            `INSERT INTO public.compliance_tasks (
              firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty, missing_docs_list, chase_count
            ) VALUES ($1, $2, 'GST'::compliance_category, $3, $4, $5, 'DOCUMENTS_AWAITED'::workflow_status, $6::task_priority, $7, $8, $9::jsonb, 0)
            RETURNING *`,
            [
              firmId,
              entityId,
              buildGstTaskTitle("GSTR10", { gstin: cleanCg, filingFrequency: crec.filingFrequency || "MONTHLY" }),
              crec.cancellationDate ? `Cancelled ${crec.cancellationDate}` : "Final Return",
              g10Due,
              computeGstTaskPriority(g10Due, now),
              fee10.lateFee,
              fee10.dailyRate,
              JSON.stringify(["Closing Stock & Capital Goods ITC Reversal Schedule"]),
            ]
          );
          if (ins10.rows[0]) {
            await upsertWorkspaceRecord({
              firmId,
              entityId,
              recordType: "GST_FILING_METADATA",
              matchKey: "taskId",
              matchValue: ins10.rows[0].id,
              payload: { taskId: ins10.rows[0].id, gstin: cleanCg },
            });
            createdTasks++;
          }
        }
      }

      if (filedUpToKey > 0) {
        await upsertWorkspaceRecord({
          firmId,
          entityId,
          recordType: "GST_CLIENT_PROFILE",
          matchKey: "entityId",
          matchValue: entityId,
          payload: { ...prof, entityId, gstHistory: mergedHist },
        });
      }

      return NextResponse.json({
        success: true,
        createdTasks,
        markedFiledHistory,
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
      const fy = String(body.fy || getCurrentIndianFy());
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
              String(t.period || "").toLowerCase() === period.toLowerCase() &&
              canonicalizeReturnKind(String(t.title || "")) === "GSTR1" &&
              taskMatchesGstin({ gstin: metaByTask.get(t.id)?.gstin, title: t.title }, cleanG, ent.gstin)
          );
          const task3b = taskRows.find(
            (t: any) =>
              t.entity_id === ent.id &&
              String(t.period || "").toLowerCase() === period.toLowerCase() &&
              canonicalizeReturnKind(String(t.title || "")) === "GSTR3B" &&
              taskMatchesGstin({ gstin: metaByTask.get(t.id)?.gstin, title: t.title }, cleanG, ent.gstin)
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
