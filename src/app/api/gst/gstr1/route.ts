import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
  appendPgAuditLog,
} from "@/lib/server/pgHelpers";
import { Gstr1Engine, OutwardSalesInvoice } from "@/lib/gst/gstr1Engine";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const clientGstin = (searchParams.get("clientGstin") || "").trim().toUpperCase();
    const taxPeriod = (searchParams.get("taxPeriod") || "").trim();

    if (!clientGstin || !taxPeriod) {
      return NextResponse.json({ success: true, found: false, invoices: [], summary: null });
    }

    const firmId = await resolveFirmUuid(auth);
    const recs = await listWorkspaceRecords<any>(firmId, "GST_GSTR1_DATA");
    const idKey = `gstr1-${clientGstin}-${taxPeriod}`.replace(/\s+/g, "_");
    const matched = recs.find((r) => r.payload?.id === idKey);

    if (!matched) {
      return NextResponse.json({ success: true, found: false, invoices: [], summary: null });
    }

    return NextResponse.json({
      success: true,
      found: true,
      ...matched.payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load GSTR-1 data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const body = await req.json();
    const clientGstin = String(body.clientGstin || "").trim().toUpperCase();
    const taxPeriod = String(body.taxPeriod || "").trim();
    const turnoverCr = Number(body.turnoverCr || 0);
    const b2clThresholdInr = Number(body.b2clThresholdInr || 100000);
    const invoices: OutwardSalesInvoice[] = Array.isArray(body.invoices) ? body.invoices : [];

    if (!clientGstin || !taxPeriod) {
      return NextResponse.json({ success: false, error: "clientGstin and taxPeriod are required." }, { status: 400 });
    }

    const summary = Gstr1Engine.compileSummary({
      gstin: clientGstin,
      returnPeriod: taxPeriod,
      turnoverCr,
      invoices,
      b2clThresholdInr,
    });

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const { rows: entRows } = await pool.query(
      "SELECT id, entity_name FROM public.client_entities WHERE firm_id = $1 AND UPPER(gstin) = UPPER($2) LIMIT 1",
      [firmId, clientGstin]
    );
    const entityId = entRows[0]?.id || null;
    const entityName = entRows[0]?.entity_name || `GSTIN ${clientGstin}`;

    const idKey = `gstr1-${clientGstin}-${taxPeriod}`.replace(/\s+/g, "_");
    const payload = {
      id: idKey,
      clientGstin,
      taxPeriod,
      turnoverCr,
      b2clThresholdInr,
      invoices,
      summary,
      totals: summary.totals,
      issuesErrorCount: summary.issues.filter((i) => i.severity === "ERROR").length,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.userName || "Practice Staff",
    };

    await upsertWorkspaceRecord({
      firmId,
      entityId,
      recordType: "GST_GSTR1_DATA",
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
      action: "GST_GSTR1_SAVED",
      details: `Compiled GSTR-1 for ${clientGstin} (${taxPeriod}): ${invoices.length} invoices, Taxable ₹${summary.totals.taxableValue.toLocaleString("en-IN")}, Tax ₹${summary.totals.totalTax.toLocaleString("en-IN")}.`,
      category: "COMPLIANCE",
    });

    return NextResponse.json({ success: true, ...payload });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save GSTR-1 data" },
      { status: 500 }
    );
  }
}
