import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
  appendPgAuditLog,
} from "@/lib/server/pgHelpers";
import { getPeriodsForFy } from "@/lib/gst/gstClientFetch";
import { canonicalizeReturnKind, taskMatchesGstin } from "@/lib/gst/gstComplianceEngine";
import { DrcIntimationNotice } from "@/lib/gst/drc01b01cEngine";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const clientGstin = (searchParams.get("clientGstin") || "").trim().toUpperCase();
    const fy = (searchParams.get("fy") || "").trim();
    const action = searchParams.get("action");

    if (!clientGstin || !fy) {
      return NextResponse.json({ success: true, found: false, data: null });
    }

    const firmId = await resolveFirmUuid(auth);

    // Compile full 12-month FY data from saved GSTR-1, 2B Reco, Rule 42/43 & Filing Metadata
    if (action === "compile") {
      const periods = getPeriodsForFy(fy);
      const periodSet = new Set(periods);

      const [g1Recs, recoRecs, r42Recs, metaRecs, gstProfileRecs, { rows: entRows }, { rows: taskRows }] = await Promise.all([
        listWorkspaceRecords<any>(firmId, "GST_GSTR1_DATA"),
        listWorkspaceRecords<any>(firmId, "GST_RECONCILIATION"),
        listWorkspaceRecords<any>(firmId, "GST_RULE42_43"),
        listWorkspaceRecords<any>(firmId, "GST_FILING_METADATA"),
        listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE"),
        getPostgresPool().query("SELECT id, gstin FROM public.client_entities WHERE firm_id = $1", [firmId]),
        getPostgresPool().query("SELECT id, entity_id, period, title FROM public.compliance_tasks WHERE firm_id = $1 AND category = 'GST'", [firmId]),
      ]);

      // Resolve which entity owns clientGstin to prevent cross-client or cross-GSTIN data leakage
      let ownerEntityId: string | null = null;
      let ownerPrimaryGstin: string | null = null;
      for (const ent of entRows) {
        if (String(ent.gstin || "").trim().toUpperCase() === clientGstin) {
          ownerEntityId = ent.id;
          ownerPrimaryGstin = clientGstin;
          break;
        }
        const prof = gstProfileRecs.find((r) => (r.entity_id || r.payload?.entityId) === ent.id)?.payload;
        if (Array.isArray(prof?.gstinRecords) && prof.gstinRecords.some((g: any) => String(g.gstin || "").trim().toUpperCase() === clientGstin)) {
          ownerEntityId = ent.id;
          ownerPrimaryGstin = ent.gstin ? String(ent.gstin).trim().toUpperCase() : null;
          break;
        }
      }

      const taskById = new Map(taskRows.map((t: any) => [t.id, t]));

      let outwardTaxable = 0;
      let outwardExports = 0;
      let outwardNilExempt = 0;
      let outIgst = 0;
      let outCgst = 0;
      let outSgst = 0;
      let outCess = 0;

      let table8aGstr2bItc = 0;
      let table6b3bItc = 0;
      let table7Sec17_5 = 0;
      let table7Rule42_43 = 0;
      let taxPaidCash = 0;
      let taxPaidItc = 0;
      let monthsWithData = 0;

      const rateBuckets = new Map<number, { taxable: number; igst: number; cgst: number; sgst: number; cess: number }>();
      const detected88C_88D: DrcIntimationNotice[] = [];

      for (const p of periods) {
        const g1Key = `gstr1-${clientGstin}-${p}`.replace(/\s+/g, "_");
        const recoKey = `reco-${clientGstin}-${p}`.replace(/\s+/g, "_");
        const r42Key = `r42-${clientGstin}-${p}`.replace(/\s+/g, "_");

        const g1 = g1Recs.find((r) => r.payload?.id === g1Key)?.payload;
        const reco = recoRecs.find((r) => r.payload?.id === recoKey)?.payload;
        const r42 = r42Recs.find((r) => r.payload?.id === r42Key)?.payload;

        if (g1 || reco) monthsWithData++;

        if (g1?.summary) {
          outwardTaxable += Number(g1.summary.totals?.taxableValue || 0);
          outwardNilExempt += Number(g1.summary.nilExemptTotal || 0);
          outIgst += Number(g1.summary.totals?.igst || 0);
          outCgst += Number(g1.summary.totals?.cgst || 0);
          outSgst += Number(g1.summary.totals?.sgst || 0);
          outCess += Number(g1.summary.totals?.cess || 0);

          for (const exp of g1.summary.exports || []) {
            outwardExports += Number(exp.taxableValue || 0);
          }
          for (const inv of g1.invoices || []) {
            if (inv.status === "CANCELLED") continue;
            const sign = inv.docType === "CRN" ? -1 : 1;
            const rt = Number(inv.taxRate || 0);
            const cur = rateBuckets.get(rt) || { taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 };
            cur.taxable += Number(inv.taxableValue || 0) * sign;
            cur.igst += Number(inv.igst || 0) * sign;
            cur.cgst += Number(inv.cgst || 0) * sign;
            cur.sgst += Number(inv.sgst || 0) * sign;
            cur.cess += Number(inv.cess || 0) * sign;
            rateBuckets.set(rt, cur);
          }
        }

        if (reco) {
          table8aGstr2bItc += Number(reco.totalTaxInr || 0);
          table7Sec17_5 += Number(reco.ineligible17_5ItcInr || 0);
        }

        if (r42?.rule42Result) {
          table7Rule42_43 += Number(r42.rule42Result.totalMonthlyReversal || 0);
        }
        if (r42?.rule43Result) {
          table7Rule42_43 += Number(r42.rule43Result.monthlyExemptReversal_Te || 0);
        }

        // Check 3B task metadata strictly scoped to ownerEntityId + clientGstin
        const meta3b = metaRecs.find((m) => {
          const t = taskById.get(m.payload?.taskId);
          return (
            t &&
            (!ownerEntityId || t.entity_id === ownerEntityId) &&
            String(t.period).toLowerCase() === p.toLowerCase() &&
            canonicalizeReturnKind(String(t.title || "")) === "GSTR3B" &&
            taskMatchesGstin({ gstin: m.payload?.gstin, title: t.title }, clientGstin, ownerPrimaryGstin)
          );
        })?.payload;

        if (meta3b) {
          const itcU = meta3b.itcUtilized || {};
          const itcSum = Number(itcU.igst || 0) + Number(itcU.cgst || 0) + Number(itcU.sgst || 0) + Number(itcU.cess || 0);
          table6b3bItc += itcSum;
          taxPaidItc += itcSum;
          taxPaidCash += Number(meta3b.cashPaid || 0);

          // Auto-detect Rule 88C (GSTR-1 vs 3B) variance > 10% or > 1,00,000
          const g1Tax = Number(g1?.summary?.totals?.totalTax || 0);
          const g3bTax = Number(meta3b.taxPayableAmount || 0);
          if (g1Tax > 0 && g1Tax - g3bTax > 10000) {
            const diff = Math.round((g1Tax - g3bTax) * 100) / 100;
            const pct = Number(((diff / g1Tax) * 100).toFixed(1));
            if (pct > 10 || diff > 100000) {
              detected88C_88D.push({
                arn: `PRE-88C-${p.replace(/\s+/g, "").toUpperCase()}`,
                intimationType: "DRC_01B_RULE_88C",
                financialYear: `FY ${fy}`,
                taxPeriod: p,
                gstin: clientGstin,
                taxpayerName: clientGstin,
                dateOfIntimation: new Date().toISOString().split("T")[0],
                statutoryDeadlineDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
                daysRemaining: 7,
                portalFigure1: g1Tax,
                portalFigure2: g3bTax,
                varianceAmount: diff,
                variancePercentage: pct,
                status: "PENDING_REPLY",
                selectedReasonCode: "B_01",
                factualExplanation: `Pre-notice detection: GSTR-1 tax (${g1Tax}) exceeds GSTR-3B tax (${g3bTax}) by ${pct}%.`,
                attachedSupportingDocs: [],
              });
            }
          }

          // Auto-detect Rule 88D (2B vs 3B ITC) variance
          const twoBNet = Number(reco?.netItc4C?.total || 0);
          if (itcSum > twoBNet && itcSum - twoBNet > 10000) {
            const diff = Math.round((itcSum - twoBNet) * 100) / 100;
            const pct = twoBNet > 0 ? Number(((diff / twoBNet) * 100).toFixed(1)) : 100;
            if (pct > 10 || diff > 100000) {
              detected88C_88D.push({
                arn: `PRE-88D-${p.replace(/\s+/g, "").toUpperCase()}`,
                intimationType: "DRC_01C_RULE_88D",
                financialYear: `FY ${fy}`,
                taxPeriod: p,
                gstin: clientGstin,
                taxpayerName: clientGstin,
                dateOfIntimation: new Date().toISOString().split("T")[0],
                statutoryDeadlineDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
                daysRemaining: 7,
                portalFigure1: twoBNet,
                portalFigure2: itcSum,
                varianceAmount: diff,
                variancePercentage: pct,
                status: "PENDING_REPLY",
                selectedReasonCode: "C_01",
                factualExplanation: `Pre-notice detection: GSTR-3B ITC claimed (${itcSum}) exceeds GSTR-2B Net ITC (${twoBNet}) by ${pct}%.`,
                attachedSupportingDocs: [],
              });
            }
          }
        }
      }

      const rateWiseTable9C = Array.from(rateBuckets.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([rt, v]) => ({
          rateLabel: `${rt}%`,
          taxableValue: Math.round(v.taxable * 100) / 100,
          igst: Math.round(v.igst * 100) / 100,
          cgst: Math.round(v.cgst * 100) / 100,
          sgst: Math.round(v.sgst * 100) / 100,
          cess: Math.round(v.cess * 100) / 100,
        }));

      void periodSet;

      return NextResponse.json({
        success: true,
        compiled: {
          monthsCompiled: monthsWithData,
          outwardTaxableSupplies: Math.round(outwardTaxable * 100) / 100,
          outwardZeroRatedExports: Math.round(outwardExports * 100) / 100,
          outwardExemptNil: Math.round(outwardNilExempt * 100) / 100,
          outwardTaxPayable: {
            igst: Math.round(outIgst * 100) / 100,
            cgst: Math.round(outCgst * 100) / 100,
            sgst: Math.round(outSgst * 100) / 100,
            cess: Math.round(outCess * 100) / 100,
          },
          table6bInputsItc: Math.round(table6b3bItc * 100) / 100,
          table6hReclaimedItc: 0,
          table7ReversalsRule42_43: Math.round(table7Rule42_43 * 100) / 100,
          table7ReversalsSec17_5: Math.round(table7Sec17_5 * 100) / 100,
          table8aGstr2bItc: Math.round(table8aGstr2bItc * 100) / 100,
          table9TaxPaidCash: Math.round(taxPaidCash * 100) / 100,
          table9TaxPaidItc: Math.round(taxPaidItc * 100) / 100,
          rateWiseTable9C,
        },
        detected88C_88D,
      });
    }

    const recs = await listWorkspaceRecords<any>(firmId, "GST_ANNUAL_AUDIT");
    const idKey = `annual-${clientGstin}-${fy}`.replace(/\s+/g, "_");
    const matched = recs.find((r) => r.payload?.id === idKey);

    return NextResponse.json({
      success: true,
      found: Boolean(matched),
      data: matched?.payload || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load Annual GST Audit record" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const body = await req.json();
    const clientGstin = (body.clientGstin || "").trim().toUpperCase();
    const fy = (body.fy || "").trim();

    if (!clientGstin || !fy) {
      return NextResponse.json(
        { success: false, error: "clientGstin and fy are required." },
        { status: 400 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const { rows: entRows } = await pool.query(
      "SELECT id, entity_name FROM public.client_entities WHERE firm_id = $1 AND UPPER(gstin) = UPPER($2) LIMIT 1",
      [firmId, clientGstin]
    );
    const entityId = entRows[0]?.id || null;
    const entityName = entRows[0]?.entity_name || `GSTIN ${clientGstin}`;

    const idKey = `annual-${clientGstin}-${fy}`.replace(/\s+/g, "_");
    const recs = await listWorkspaceRecords<any>(firmId, "GST_ANNUAL_AUDIT");
    const existing = recs.find((r) => r.payload?.id === idKey)?.payload || {};

    const payload = {
      ...existing,
      ...body,
      id: idKey,
      clientGstin,
      fy,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.userName || "Practice Staff",
    };

    await upsertWorkspaceRecord({
      firmId,
      entityId,
      recordType: "GST_ANNUAL_AUDIT",
      matchKey: "id",
      matchValue: idKey,
      payload,
    });

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Practice Staff",
      actorRole: auth.role || "PARTNER",
      entityId,
      entityName,
      action: "GST_ANNUAL_AUDIT_SAVED",
      details: `Updated Annual GST Audit / GSTR-9 / DRC / ISD workpapers for ${clientGstin} (FY ${fy}).`,
      category: "COMPLIANCE",
    });

    return NextResponse.json({ success: true, data: payload });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save Annual GST Audit record" },
      { status: 500 }
    );
  }
}
