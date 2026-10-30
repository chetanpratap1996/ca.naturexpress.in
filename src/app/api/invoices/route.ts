import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { InvoiceItem } from "@/lib/types";

export async function GET() {
  const db = ensureDatabase();
  return NextResponse.json({ success: true, invoices: db.invoices });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = ensureDatabase();

    const taxable = body.taxableAmount || Math.round(body.amount / 1.18);
    const gst = body.gstAmount || (body.amount - taxable);

    const newInvoice: InvoiceItem = {
      id: body.id || `INV-${Date.now().toString().slice(-4)}`,
      invoiceNo: body.invoiceNo || `GPA/2026-27/${(db.invoices.length + 430).toString()}`,
      entityId: body.entityId,
      entityName: body.entityName,
      groupId: body.groupId || "GRP-001",
      serviceDescription: body.serviceDescription,
      taxableAmount: taxable,
      gstRate: 18,
      gstAmount: gst,
      amount: body.amount,
      dueDate: body.dueDate,
      status: "PENDING",
      sacCode: body.sacCode || "998231",
    };

    db.invoices.unshift(newInvoice);
    await saveDatabase(db);

    // Bi-Directional Supabase Cloud Sync
    if (isSupabaseConfigured()) {
      try {
        const { data: firms } = await supabase.from("firms").select("id").limit(1);
        const firmId = firms?.[0]?.id;

        const { data: entityRow } = await supabase
          .from("client_entities")
          .select("id")
          .or(`id.eq.${newInvoice.entityId},entity_name.ilike.${newInvoice.entityName}`)
          .limit(1)
          .maybeSingle();

        if (firmId && entityRow?.id) {
          await supabase.from("invoices").insert({
            firm_id: firmId,
            entity_id: entityRow.id,
            invoice_no: newInvoice.invoiceNo,
            service_description: newInvoice.serviceDescription,
            sac_code: newInvoice.sacCode,
            taxable_amount: newInvoice.taxableAmount,
            gst_rate: newInvoice.gstRate,
            gst_amount: newInvoice.gstAmount,
            total_amount: newInvoice.amount,
            due_date: newInvoice.dueDate,
            status: "PENDING"
          });
        }
      } catch (sbErr) {
        console.warn("Supabase invoice insert warning:", sbErr);
      }
    }

    await logAuditEvent(
      body.actorName || "CA Gunjan Jain",
      "PARTNER",
      newInvoice.entityName,
      "Invoice Generated",
      `Generated Tax Invoice #${newInvoice.invoiceNo} for ₹${newInvoice.amount.toLocaleString("en-IN")}`,
      "INVOICE"
    );

    // Free In-App & Browser Push Notification
    await createNotification({
      title: `Invoice Generated: ${newInvoice.invoiceNo}`,
      message: `Tax invoice of ₹${newInvoice.amount.toLocaleString("en-IN")} generated for ${newInvoice.entityName} (${newInvoice.serviceDescription}).`,
      category: "BILLING",
      priority: "MEDIUM",
      targetRoles: ["SUPER_ADMIN", "PARTNER", "CLIENT"],
      groupId: newInvoice.groupId,
      entityId: newInvoice.entityId,
      link: "/admin",
      actionLabel: "View Billing",
      metadata: { invoiceId: newInvoice.id, amount: newInvoice.amount }
    });

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { 
      invoiceId, 
      action, // "SUBMIT_UTR" | "RECONCILE"
      clientUtrNumber, 
      clientPaymentMode, 
      clientPayerNote, 
      reconciledBy, 
      actorName 
    } = body;

    const db = ensureDatabase();
    const invIndex = db.invoices.findIndex((i) => i.id === invoiceId);
    if (invIndex === -1) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const currentInvoice = db.invoices[invIndex];

    if (action === "SUBMIT_UTR") {
      currentInvoice.status = "UTR_SUBMITTED";
      currentInvoice.clientUtrNumber = clientUtrNumber;
      currentInvoice.clientPaymentMode = clientPaymentMode || "NEFT_RTGS";
      currentInvoice.clientPaymentDate = new Date().toISOString().split("T")[0];
      currentInvoice.clientPayerNote = clientPayerNote;

      await logAuditEvent(
        actorName || "Client Accounts Desk",
        "CLIENT",
        currentInvoice.entityName,
        "UTR Payment Submitted",
        `Submitted UTR ${clientUtrNumber} (${currentInvoice.clientPaymentMode}) for ₹${currentInvoice.amount.toLocaleString("en-IN")} on Invoice #${currentInvoice.invoiceNo}`,
        "INVOICE"
      );

      // Notify Partners and Admins about UTR submission
      await createNotification({
        title: `UTR Submitted: ₹${currentInvoice.amount.toLocaleString("en-IN")}`,
        message: `${currentInvoice.entityName} submitted payment UTR ${clientUtrNumber} for Invoice #${currentInvoice.invoiceNo}. Verification pending.`,
        category: "BILLING",
        priority: "HIGH",
        targetRoles: ["SUPER_ADMIN", "PARTNER", "STAFF"],
        entityId: currentInvoice.entityId,
        groupId: currentInvoice.groupId,
        link: "/admin",
        actionLabel: "Reconcile",
        metadata: { invoiceId: currentInvoice.id, utr: clientUtrNumber }
      });
    } else if (action === "RECONCILE") {
      currentInvoice.status = "PAID";
      currentInvoice.reconciledBy = reconciledBy || "CA Gunjan Jain (Partner)";
      currentInvoice.reconciledAt = new Date().toISOString();

      await logAuditEvent(
        reconciledBy || "CA Gunjan Jain",
        "PARTNER",
        currentInvoice.entityName,
        "Payment Reconciled & Settled",
        `Verified bank settlement via UTR ${currentInvoice.clientUtrNumber || "Direct"} for Invoice #${currentInvoice.invoiceNo}`,
        "INVOICE"
      );

      // Notify Client and Partners of reconciliation
      await createNotification({
        title: `Payment Reconciled: ${currentInvoice.invoiceNo}`,
        message: `Payment of ₹${currentInvoice.amount.toLocaleString("en-IN")} for ${currentInvoice.entityName} reconciled by ${reconciledBy || "Partner"}.`,
        category: "BILLING",
        priority: "MEDIUM",
        targetRoles: ["SUPER_ADMIN", "PARTNER", "CLIENT"],
        entityId: currentInvoice.entityId,
        groupId: currentInvoice.groupId,
        link: "/client",
        actionLabel: "View Receipt",
        metadata: { invoiceId: currentInvoice.id }
      });
    }

    db.invoices[invIndex] = currentInvoice;
    await saveDatabase(db);

    // Bi-Directional Supabase update
    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, any> = {};
        if (action === "SUBMIT_UTR") {
          updatePayload.status = "UTR_SUBMITTED";
          updatePayload.client_utr_number = clientUtrNumber;
          updatePayload.client_payment_mode = clientPaymentMode || "NEFT_RTGS";
          updatePayload.client_payment_date = new Date().toISOString().split("T")[0];
          updatePayload.client_payer_note = clientPayerNote || "";
        } else if (action === "RECONCILE") {
          updatePayload.status = "PAID";
          updatePayload.reconciled_at = new Date().toISOString();
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from("invoices")
            .update(updatePayload)
            .or(`id.eq.${invoiceId},invoice_no.eq.${currentInvoice.invoiceNo}`);
        }
      } catch (sbErr) {
        console.warn("Supabase invoice update warning:", sbErr);
      }
    }

    return NextResponse.json({ success: true, invoice: currentInvoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
