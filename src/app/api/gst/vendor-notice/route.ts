import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { VendorNoticeGenerator, VendorNoticeParams } from "@/lib/gst/vendorNoticeGenerator";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, upsertWorkspaceRecord, appendPgAuditLog } from "@/lib/server/pgHelpers";

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const body: VendorNoticeParams = await req.json();

    if (!body.buyerEntityName || !body.buyerGstin || !body.vendorTradeName || !body.vendorGstin || !Array.isArray(body.invoices)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: buyerEntityName, buyerGstin, vendorTradeName, vendorGstin, invoices",
        },
        { status: 400 }
      );
    }

    const notice = VendorNoticeGenerator.generateNotice(body);

    try {
      const firmId = await resolveFirmUuid(auth);
      const pool = getPostgresPool();
      const { rows: entRows } = await pool.query(
        "SELECT id, entity_name FROM public.client_entities WHERE firm_id = $1 AND UPPER(gstin) = UPPER($2) LIMIT 1",
        [firmId, body.buyerGstin]
      );
      const entityId = entRows[0]?.id || null;
      const totalDisputedItc = body.invoices.reduce((acc, inv) => acc + (inv.totalTax || 0), 0);

      if (entityId) {
        await pool.query(
          `INSERT INTO public.documents (
            firm_id, entity_id, category, file_name, file_size_bytes, financial_year, review_status, reviewed_at
          ) VALUES ($1, $2, 'AUDIT_REPORT', $3, 215040, $4, 'APPROVED', now())`,
          [
            firmId,
            entityId,
            `Vendor_Notice_Sec16_Rule37A_${body.vendorTradeName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            body.taxPeriod || "FY 2026-27",
          ]
        );

        await upsertWorkspaceRecord({
          firmId,
          entityId,
          recordType: "NOTIFICATION",
          matchKey: "idKey",
          matchValue: `vn-${notice.noticeRef}`,
          payload: {
            id: `NOTIF-VN-${Date.now()}`,
            idKey: `vn-${notice.noticeRef}`,
            title: `Vendor Notice Generated: ${body.vendorTradeName}`,
            message: `Recovery notice drafted under Section 16(2)(aa) & Rule 37A for ₹${totalDisputedItc.toLocaleString("en-IN")} at-risk ITC.`,
            category: "COMPLIANCE",
            priority: "HIGH",
            targetTab: "vendor-hold",
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
        entityName: body.buyerEntityName,
        action: "GST_VENDOR_NOTICE_ISSUED",
        details: `Generated statutory vendor notice ${notice.noticeRef} for ${body.vendorTradeName} (${body.vendorGstin}) covering ${body.invoices.length} invoice(s) (₹${totalDisputedItc.toLocaleString("en-IN")}).`,
        category: "COMPLIANCE",
      });
    } catch (e) {
      console.warn("Could not archive vendor notice:", e);
    }

    return NextResponse.json({ success: true, notice });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate vendor notice" },
      { status: 500 }
    );
  }
}
