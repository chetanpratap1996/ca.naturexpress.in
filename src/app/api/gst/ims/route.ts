import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
  appendPgAuditLog,
} from "@/lib/server/pgHelpers";
import { GstImsEngine, ImsInvoiceItem, Rule37ARecord } from "@/lib/gst/imsEngine";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const clientGstin = (searchParams.get("clientGstin") || "").trim().toUpperCase();
    const taxPeriod = (searchParams.get("taxPeriod") || "").trim();

    if (!clientGstin) {
      return NextResponse.json({
        success: true,
        found: false,
        invoices: [],
        rule37Records: [],
      });
    }

    const firmId = await resolveFirmUuid(auth);
    const recs = await listWorkspaceRecords<any>(firmId, "GST_IMS_DATA");
    const periodKey = `ims-${clientGstin}-${taxPeriod || "ALL"}`.replace(/\s+/g, "_");
    const matched =
      recs.find((r) => r.payload?.id === periodKey) ||
      (taxPeriod ? null : recs.find((r) => r.payload?.clientGstin === clientGstin));

    const invoices: ImsInvoiceItem[] = matched?.payload?.invoices || [];
    const rawRule37: Rule37ARecord[] = matched?.payload?.rule37Records || [];
    const evaluatedRule37 = GstImsEngine.evaluateRule37A(
      rawRule37,
      new Date().toISOString().split("T")[0]
    );

    return NextResponse.json({
      success: true,
      found: Boolean(matched),
      clientGstin,
      taxPeriod: matched?.payload?.taxPeriod || taxPeriod,
      updatedAt: matched?.payload?.updatedAt || null,
      invoices,
      rule37Records: evaluatedRule37,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load GST IMS records" },
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
    const taxPeriod = (body.taxPeriod || "").trim();

    if (!clientGstin || !taxPeriod) {
      return NextResponse.json(
        { success: false, error: "clientGstin and taxPeriod are required." },
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

    const periodKey = `ims-${clientGstin}-${taxPeriod}`.replace(/\s+/g, "_");
    const recs = await listWorkspaceRecords<any>(firmId, "GST_IMS_DATA");
    const existing = recs.find((r) => r.payload?.id === periodKey)?.payload || {};

    const invoices: ImsInvoiceItem[] = Array.isArray(body.invoices)
      ? body.invoices
      : existing.invoices || [];
    const rule37Records: Rule37ARecord[] = Array.isArray(body.rule37Records)
      ? GstImsEngine.evaluateRule37A(body.rule37Records, new Date().toISOString().split("T")[0])
      : existing.rule37Records || [];

    const payload = {
      id: periodKey,
      clientGstin,
      taxPeriod,
      invoices,
      rule37Records,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.userName || "Practice Staff",
    };

    await upsertWorkspaceRecord({
      firmId,
      entityId,
      recordType: "GST_IMS_DATA",
      matchKey: "id",
      matchValue: periodKey,
      payload,
    });

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Practice Staff",
      actorRole: auth.role || "PARTNER",
      entityId,
      entityName,
      action: "GST_IMS_UPDATED",
      details: `Saved ${invoices.length} IMS invoice actions and ${rule37Records.length} Rule 37/37A records for ${clientGstin} (${taxPeriod}).`,
      category: "COMPLIANCE",
    });

    return NextResponse.json({ success: true, ...payload });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save GST IMS records" },
      { status: 500 }
    );
  }
}
