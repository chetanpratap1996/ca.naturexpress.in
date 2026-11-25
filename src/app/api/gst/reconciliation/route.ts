import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import {
  RecoMatcher,
  Gstr2bInvoice,
  BooksPurchaseInvoice,
  RecoManualOverride,
  ReconciliationReport,
} from "@/lib/gst/recoMatcher";
import { ItcClassifier } from "@/lib/gst/itcClassifier";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";
import { executePostgresAutopilotSweep } from "@/lib/automation/postgresAutopilot";

function runFullClassificationAndSummary(
  report: ReconciliationReport,
  overrides?: Record<string, RecoManualOverride>
): ReconciliationReport {
  for (const record of report.records) {
    if (overrides && overrides[record.id]) {
      record.manualOverride = overrides[record.id];
    }
    const cls = ItcClassifier.classify({
      hsnOrSacCode: record.hsnCode,
      itemDescription: record.itemDescription,
      vendorTradeName: record.vendorName,
    });
    if (cls.isBlocked) {
      record.section17_5Blocked = true;
      record.blockedCategory = cls.categoryTitle;
      if (!record.statutoryAuditTrail.includes("[BLOCKED:")) {
        record.statutoryAuditTrail = `${record.statutoryAuditTrail} [BLOCKED: ${cls.reason}]`;
      }
      if (record.manualOverride !== "ALLOW_EXCEPTION") {
        record.recommendedAction = cls.auditRecommendation;
      }
    }
  }
  return RecoMatcher.recomputeSummary(report);
}

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const clientGstin = (searchParams.get("clientGstin") || "").trim().toUpperCase();
    const taxPeriod = (searchParams.get("taxPeriod") || "").trim();
    const tolerance = parseFloat(searchParams.get("tolerance") || "5.0");

    if (!clientGstin) {
      return NextResponse.json({
        success: true,
        found: false,
        report: null,
        availablePeriods: [],
      });
    }

    const firmId = await resolveFirmUuid(auth);
    const recs = await listWorkspaceRecords<any>(firmId, "GST_RECONCILIATION");
    const gstinRecs = recs.filter(
      (r) => String(r.payload?.clientGstin || "").toUpperCase() === clientGstin
    );
    const availablePeriods = gstinRecs
      .map((r) => r.payload?.period)
      .filter(Boolean);

    const idKey = `reco-${clientGstin}-${taxPeriod}`.replace(/\s+/g, "_");
    const matched = taxPeriod
      ? gstinRecs.find((r) => r.payload?.id === idKey)
      : gstinRecs[0];

    if (!matched) {
      return NextResponse.json({
        success: true,
        found: false,
        report: null,
        availablePeriods,
      });
    }

    const p = matched.payload;
    const gstr2bInvoices: Gstr2bInvoice[] = Array.isArray(p.gstr2bInvoices) ? p.gstr2bInvoices : [];
    const booksInvoices: BooksPurchaseInvoice[] = Array.isArray(p.booksInvoices) ? p.booksInvoices : [];
    const overrides: Record<string, RecoManualOverride> = p.overrides || {};

    const rawReport = RecoMatcher.reconcile({
      taxPeriod: p.period || taxPeriod,
      clientGstin,
      gstr2bInvoices,
      booksInvoices,
      toleranceInr: p.toleranceInr ?? tolerance,
      overrides,
    });
    const report = runFullClassificationAndSummary(rawReport, overrides);

    return NextResponse.json({
      success: true,
      found: true,
      report,
      gstr2bInvoices,
      booksInvoices,
      overrides,
      availablePeriods,
      updatedAt: p.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load GSTR-2B reconciliation" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const body = await req.json();
    const { taxPeriod, clientGstin, gstr2bInvoices, booksInvoices, toleranceInr, overrides } = body;

    if (!taxPeriod || !clientGstin || !Array.isArray(gstr2bInvoices) || !Array.isArray(booksInvoices)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing mandatory fields: taxPeriod, clientGstin, gstr2bInvoices, booksInvoices",
        },
        { status: 400 }
      );
    }

    const cleanGstin = String(clientGstin).trim().toUpperCase();
    const rawReport = RecoMatcher.reconcile({
      taxPeriod,
      clientGstin: cleanGstin,
      gstr2bInvoices,
      booksInvoices,
      toleranceInr: toleranceInr ?? 5.0,
      overrides,
    });
    const report = runFullClassificationAndSummary(rawReport, overrides);

    try {
      const firmId = await resolveFirmUuid(auth);
      const pool = getPostgresPool();
      const { rows: entRows } = await pool.query(
        "SELECT id, entity_name FROM public.client_entities WHERE firm_id = $1 AND UPPER(gstin) = UPPER($2) LIMIT 1",
        [firmId, cleanGstin]
      );
      const entity = entRows[0];
      const entityId = entity?.id || null;
      const clientName = entity?.entity_name || `GSTIN ${cleanGstin}`;

      const item = {
        id: `reco-${cleanGstin}-${taxPeriod}`.replace(/\s+/g, "_"),
        clientId: entityId || `CLI-${cleanGstin}`,
        clientName,
        clientGstin: cleanGstin,
        period: taxPeriod,
        toleranceInr: toleranceInr ?? 5.0,
        updatedAt: new Date().toISOString(),
        invoicesAudited: report.summary.totalRecords,
        totalTaxableInr: gstr2bInvoices.reduce((acc: number, i: any) => acc + (i.taxableValue || 0), 0),
        totalTaxInr: report.summary.total2bItc,
        missingItcInr: report.summary.provisionalMissing2bItc || 0,
        eligibleItcInr: report.summary.matchedEligibleItc,
        ineligible17_5ItcInr: report.summary.ineligibleSec17_5Itc,
        netItc4C: report.summary.netItc4C,
        table4Summary: {
          table4A1: report.summary.table4A1_ImportGoods,
          table4A3: report.summary.table4A3_Rcm,
          table4A4: report.summary.table4A4_Isd,
          table4A5: report.summary.table4A5_AllOtherGross,
          table4B1: report.summary.table4B1_PermanentReversal,
          table4B2: report.summary.table4B2_TemporaryReversal,
          netItc4C: report.summary.netItc4C,
        },
        rule37aRiskCount: report.records.filter((r) => r.rule37aRisk).length,
        vendorNoticeCount: report.records.filter((r) => r.matchStatus === "MISSING_IN_2B").length,
        gstr2bInvoices,
        booksInvoices,
        overrides: overrides || {},
      };

      await upsertWorkspaceRecord({
        firmId,
        entityId,
        recordType: "GST_RECONCILIATION",
        matchKey: "id",
        matchValue: item.id,
        payload: item,
      });

      if (entityId) {
        await upsertWorkspaceRecord({
          firmId,
          entityId,
          recordType: "NOTIFICATION",
          matchKey: "idKey",
          matchValue: `gst-reco-${item.id}-${new Date().toISOString().split("T")[0]}`,
          payload: {
            id: `NOTIF-GST-${Date.now()}`,
            idKey: `gst-reco-${item.id}-${new Date().toISOString().split("T")[0]}`,
            title: `GSTR-2B Reco: ₹${report.summary.netItc4C.total.toLocaleString("en-IN")} Net Eligible ITC`,
            message:
              report.summary.provisionalMissing2bItc > 0
                ? `Reconciliation complete for ${taxPeriod}. Identified ₹${report.summary.provisionalMissing2bItc.toLocaleString("en-IN")} missing in GSTR-2B.`
                : `Reconciliation complete for ${taxPeriod}. Books ITC matched with GSTR-2B portal data.`,
            category: "COMPLIANCE",
            priority: report.summary.provisionalMissing2bItc > 0 ? "HIGH" : "NORMAL",
            targetTab: report.summary.provisionalMissing2bItc > 0 ? "vendor-hold" : "vault",
            recipientRole: "CLIENT",
            recipientEntityId: entityId,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        });
      }

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Practice Staff",
        actorRole: auth.role || "PARTNER",
        entityId,
        entityName: clientName,
        action: "GST_RECONCILIATION_COMPLETED",
        details: `GSTR-2B reconciliation saved for ${taxPeriod} (${cleanGstin}). Net ITC 4(C): ₹${report.summary.netItc4C.total.toLocaleString("en-IN")}, Sec 17(5) Blocked: ₹${report.summary.ineligibleSec17_5Itc.toLocaleString("en-IN")}.`,
        category: "COMPLIANCE",
      });

      executePostgresAutopilotSweep(firmId, "GSTR-2B Reconciliation").catch(() => null);
    } catch (saveErr) {
      console.warn("Could not persist GST reconciliation to Postgres:", saveErr);
    }

    return NextResponse.json({
      success: true,
      report,
      overrides: overrides || {},
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process GSTR-2B reconciliation request" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const body = await req.json();
    const cleanGstin = String(body.clientGstin || "").trim().toUpperCase();
    const taxPeriod = String(body.taxPeriod || "").trim();
    const overrides: Record<string, RecoManualOverride> = body.overrides || {};

    if (!cleanGstin || !taxPeriod) {
      return NextResponse.json({ success: false, error: "clientGstin and taxPeriod are required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const idKey = `reco-${cleanGstin}-${taxPeriod}`.replace(/\s+/g, "_");
    const recs = await listWorkspaceRecords<any>(firmId, "GST_RECONCILIATION");
    const existing = recs.find((r) => r.payload?.id === idKey);

    if (!existing) {
      return NextResponse.json({ success: false, error: "No saved reconciliation found for this GSTIN & period." }, { status: 404 });
    }

    const p = existing.payload;
    const rawReport = RecoMatcher.reconcile({
      taxPeriod,
      clientGstin: cleanGstin,
      gstr2bInvoices: p.gstr2bInvoices || [],
      booksInvoices: p.booksInvoices || [],
      toleranceInr: p.toleranceInr ?? 5.0,
      overrides,
    });
    const report = runFullClassificationAndSummary(rawReport, overrides);

    await upsertWorkspaceRecord({
      firmId,
      entityId: existing.entity_id,
      recordType: "GST_RECONCILIATION",
      matchKey: "id",
      matchValue: idKey,
      payload: {
        ...p,
        overrides,
        eligibleItcInr: report.summary.matchedEligibleItc,
        ineligible17_5ItcInr: report.summary.ineligibleSec17_5Itc,
        netItc4C: report.summary.netItc4C,
        table4Summary: {
          table4A1: report.summary.table4A1_ImportGoods,
          table4A3: report.summary.table4A3_Rcm,
          table4A4: report.summary.table4A4_Isd,
          table4A5: report.summary.table4A5_AllOtherGross,
          table4B1: report.summary.table4B1_PermanentReversal,
          table4B2: report.summary.table4B2_TemporaryReversal,
          netItc4C: report.summary.netItc4C,
        },
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, report, overrides });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update overrides" }, { status: 500 });
  }
}
