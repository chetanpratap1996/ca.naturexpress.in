import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
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
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNo: body.invoiceNo || `KCS/2026-27/${(db.invoices.length + 430).toString()}`,
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

    await logAuditEvent(
      body.actorName || "CA Gunjan Jain",
      "PARTNER",
      newInvoice.entityName,
      "Invoice Generated",
      `Generated Tax Invoice #${newInvoice.invoiceNo} for ₹${newInvoice.amount.toLocaleString()}`,
      "INVOICE"
    );

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
        `Submitted UTR ${clientUtrNumber} (${currentInvoice.clientPaymentMode}) for ₹${currentInvoice.amount.toLocaleString()} on Invoice #${currentInvoice.invoiceNo}`,
        "INVOICE"
      );
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
    }

    db.invoices[invIndex] = currentInvoice;
    await saveDatabase(db);

    return NextResponse.json({ success: true, invoice: currentInvoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
