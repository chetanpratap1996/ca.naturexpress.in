import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { reconcileFirmBankStatement } from "@/lib/billing/bankReceiptReconciler";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || (auth.role !== "PARTNER" && auth.role !== "ARTICLE")) {
      return NextResponse.json({ success: false, error: "Access denied. Partner or staff authentication required." }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    let csvContent = "";
    let autoApply = true;
    let actorName = auth.user?.name || "CA Gunjan Jain (Partner)";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null || formData.get("statement") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No bank statement file uploaded." }, { status: 400 });
      }
      csvContent = await file.text();
      const autoApplyVal = formData.get("autoApply");
      if (autoApplyVal !== null) {
        autoApply = autoApplyVal === "true";
      }
      const actorVal = formData.get("actorName");
      if (actorVal) actorName = String(actorVal);
    } else {
      const body = await req.json();
      csvContent = body.csvContent || body.content || "";
      if (body.autoApply !== undefined) autoApply = Boolean(body.autoApply);
      if (body.actorName) actorName = body.actorName;
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Empty bank statement content." }, { status: 400 });
    }

    const db = ensureDatabase();
    const report = reconcileFirmBankStatement(csvContent, db.invoices, db.clients);

    if (autoApply && report.reconciledInvoices.length > 0) {
      for (const match of report.reconciledInvoices) {
        const invIndex = db.invoices.findIndex((i) => i.id === match.invoiceId || i.invoiceNo === match.invoiceNo);
        if (invIndex !== -1) {
          const inv = db.invoices[invIndex];
          inv.status = "PAID";
          inv.clientUtrNumber = match.utrNumber;
          inv.clientPaymentMode = match.paymentMode as any;
          inv.clientPaymentDate = match.settlementDate;
          inv.reconciledBy = `${actorName} (Auto-Bank Statement)`;
          inv.reconciledAt = new Date().toISOString();
          db.invoices[invIndex] = inv;

          // Audit trail log
          await logAuditEvent(
            actorName,
            auth.role,
            match.entityName,
            "Bank UTR Auto-Reconciled",
            `Auto-cleared invoice #${match.invoiceNo} against bank credit of ₹${match.matchedAmount.toLocaleString("en-IN")}. UTR: ${match.utrNumber}. Score: ${match.confidenceScore}%.`,
            "INVOICE"
          );

          // Real-time in-app notification
          await createNotification({
            title: `Fee Realized: ${match.invoiceNo}`,
            message: `Bank credit of ₹${match.matchedAmount.toLocaleString("en-IN")} matched with ${match.entityName} (UTR: ${match.utrNumber}). 0% Gateway commission.`,
            category: "BILLING",
            priority: "HIGH",
            targetRoles: ["SUPER_ADMIN", "PARTNER", "STAFF", "CLIENT"],
            entityId: match.entityId,
            link: "/admin",
            actionLabel: "View Receipt",
            metadata: { invoiceId: match.invoiceId, utr: match.utrNumber, amount: match.matchedAmount }
          });

          // Bi-directional Supabase cloud sync if configured
          if (isSupabaseConfigured()) {
            try {
              await supabase
                .from("invoices")
                .update({
                  status: "PAID",
                  client_utr_number: match.utrNumber,
                  reconciled_at: new Date().toISOString()
                })
                .or(`id.eq.${match.invoiceId},invoice_no.eq.${match.invoiceNo}`);
            } catch (sbErr) {
              console.warn("Supabase auto-reconcile update warning:", sbErr);
            }
          }
        }
      }

      await saveDatabase(db);
    }

    return NextResponse.json({
      success: true,
      report,
      clearedCount: report.reconciledInvoices.length,
      realizedInr: report.totalRealizedInr,
      gatewayFeesSavedInr: report.totalGatewayFeesSavedInr
    });
  } catch (error: any) {
    console.error("Bank statement reconciliation API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process bank statement" }, { status: 500 });
  }
}
