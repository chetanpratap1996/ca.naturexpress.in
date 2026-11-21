import { NextRequest, NextResponse } from "next/server";
import { VendorNoticeGenerator, VendorNoticeParams } from "@/lib/gst/vendorNoticeGenerator";
import { ensureDatabase, saveDatabase, createNotification, logAuditEvent } from "@/lib/server/db";
import { DocumentItem } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: VendorNoticeParams = await req.json();

    if (!body.buyerEntityName || !body.buyerGstin || !body.vendorTradeName || !body.vendorGstin || !Array.isArray(body.invoices)) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: buyerEntityName, buyerGstin, vendorTradeName, vendorGstin, invoices"
      }, { status: 400 });
    }

    const notice = VendorNoticeGenerator.generateNotice(body);

    // Autonomous Vault Deposit & Client Portal Notification
    try {
      const db = ensureDatabase();
      const matchedClient = db.clients.find(c => c.gstin?.toUpperCase() === body.buyerGstin.toUpperCase());
      const entityId = matchedClient?.id || "CLI-001";
      const totalDisputedItc = body.invoices.reduce((acc, inv) => acc + (inv.totalTax || 0), 0);

      const noticeDoc: DocumentItem = {
        id: `DOC-VN-${Date.now()}`,
        entityId,
        entityName: body.buyerEntityName,
        category: "AUDIT_REPORT",
        fileName: `Vendor_Notice_Sec16_Rule37A_${body.vendorTradeName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        fileSize: "210 KB",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "FIRM_STAFF",
        isPasswordProtected: false,
        isUnlocked: true,
        financialYear: "FY 2026-27",
        reviewStatus: "APPROVED",
      };
      db.documents = [noticeDoc, ...(db.documents || [])];

      await createNotification({
        title: `Vendor Notice Generated: ${body.vendorTradeName}`,
        message: `Recovery notice drafted under Section 16(2)(c) & Rule 37A for ₹${totalDisputedItc.toLocaleString("en-IN")} missing ITC. Workpaper archived in your Vault.`,
        category: "COMPLIANCE",
        priority: "HIGH",
        targetTab: "vendor-hold",
        recipientRole: "CLIENT",
        recipientEntityId: entityId,
      });

      await logAuditEvent(
        "Autonomous GST Engine",
        "SYSTEM",
        body.buyerEntityName,
        "GST_NOTICE_ISSUED",
        `Generated statutory vendor recovery notice for ${body.vendorTradeName} (${body.vendorGstin}) covering ${body.invoices.length} defaulting invoices (₹${totalDisputedItc.toLocaleString('en-IN')}).`,
        "COMPLIANCE"
      );

      await saveDatabase(db);
    } catch (e) {
      console.warn("Could not archive vendor notice:", e);
    }

    return NextResponse.json({
      success: true,
      notice
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to generate vendor notice"
    }, { status: 500 });
  }
}
