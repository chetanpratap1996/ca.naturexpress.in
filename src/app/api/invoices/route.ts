import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { InvoiceItem } from "@/lib/types";
import { authenticateServerRequest, createRequestSupabaseClient, writeServerAuditLog } from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  const auth = await authenticateServerRequest(request);
  if (!auth.isAuthenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production") {
    const client = createRequestSupabaseClient(request);
    if (!client || !auth.firmId) return NextResponse.json({ success: false, error: "Supabase session unavailable." }, { status: 503 });
    const [{ data: rows, error }, { data: entities }] = await Promise.all([
      client.from("invoices").select("*").eq("firm_id", auth.firmId),
      client.from("client_entities").select("id, entity_name, group_id").eq("firm_id", auth.firmId),
    ]);
    if (error) return NextResponse.json({ success: false, error: "Could not load invoices from Supabase." }, { status: 503 });
    const invoices: InvoiceItem[] = (rows || []).map((row: any) => {
      const entity = (entities || []).find((item: any) => item.id === row.entity_id);
      return {
        id: row.id, invoiceNo: row.invoice_no, entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity",
        groupId: entity?.group_id || "", serviceDescription: row.service_description,
        taxableAmount: Number(row.taxable_amount || 0), gstRate: Number(row.gst_rate || 18), gstAmount: Number(row.gst_amount || 0),
        amount: Number(row.total_amount || 0), dueDate: row.due_date, status: row.status, sacCode: row.sac_code || "998231",
        clientUtrNumber: row.client_utr_number || undefined, clientPaymentMode: row.client_payment_mode || undefined,
        clientPaymentDate: row.client_payment_date || undefined, clientPayerNote: row.client_payer_note || undefined,
        reconciledBy: row.reconciled_by_id || undefined, reconciledAt: row.reconciled_at || undefined,
      };
    });
    return NextResponse.json({ success: true, invoices });
  }
  const db = ensureDatabase();
  const invoices = auth.role === "CLIENT"
    ? db.invoices.filter((item) => auth.clientEntityId
      ? item.entityId === auth.clientEntityId
      : item.entityId === "" /* no implicit group-wide invoice access */)
    : db.invoices;
  return NextResponse.json({ success: true, invoices });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (process.env.NODE_ENV === "production") {
      const request = req as NextRequest;
      const auth = await authenticateServerRequest(request);
      const client = createRequestSupabaseClient(request);
      if (!auth.isAuthenticated || auth.role !== "PARTNER" || !auth.firmId || !client) return NextResponse.json({ success: false, error: "Partner access required." }, { status: 403 });
      const { data: entity } = await client.from("client_entities").select("id, entity_name").eq("id", body.entityId).eq("firm_id", auth.firmId).maybeSingle();
      if (!entity) return NextResponse.json({ success: false, error: "Entity is not accessible to this firm." }, { status: 404 });
      const amount = Number(body.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0 || !body.dueDate || !body.serviceDescription) {
        return NextResponse.json({ success: false, error: "A positive amount, service description, and due date are required." }, { status: 400 });
      }
      const taxable = Number(body.taxableAmount || Math.round(amount / 1.18));
      const gst = Number(body.gstAmount ?? (amount - taxable));
      const { data: row, error } = await client.from("invoices").insert({
        firm_id: auth.firmId, entity_id: entity.id, invoice_no: String(body.invoiceNo || `INV-${Date.now()}`).slice(0, 50),
        service_description: String(body.serviceDescription).slice(0, 2000), sac_code: String(body.sacCode || "998231").slice(0, 20),
        taxable_amount: taxable, gst_rate: Number(body.gstRate || 18), gst_amount: gst, total_amount: amount, due_date: body.dueDate,
      }).select("*").single();
      if (error || !row) return NextResponse.json({ success: false, error: "Invoice could not be saved to durable storage." }, { status: 400 });
      const audit = await writeServerAuditLog(request, auth, { entityId: entity.id, entityName: entity.entity_name, action: "Invoice Created", details: `Created invoice ${row.invoice_no}.`, category: "INVOICE" });
      if (audit.error) console.error("Audit log write failed for invoice creation.");
      const invoice: InvoiceItem = {
        id: row.id, invoiceNo: row.invoice_no, entityId: row.entity_id, entityName: entity.entity_name, groupId: "",
        serviceDescription: row.service_description, taxableAmount: Number(row.taxable_amount), gstRate: Number(row.gst_rate),
        gstAmount: Number(row.gst_amount), amount: Number(row.total_amount), dueDate: row.due_date, status: row.status, sacCode: row.sac_code,
      };
      return NextResponse.json({ success: true, invoice });
    }
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

export async function PATCH(req: NextRequest) {
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

    if (process.env.NODE_ENV === "production") {
      const auth = await authenticateServerRequest(req);
      const client = createRequestSupabaseClient(req);
      if (!auth.isAuthenticated || !auth.firmId || !client) return NextResponse.json({ success: false, error: "Authenticated Supabase session required." }, { status: 401 });
      let row: any;
      let error: any;
      if (action === "SUBMIT_UTR" && auth.role === "CLIENT") {
        if (!String(clientUtrNumber || "").trim()) return NextResponse.json({ success: false, error: "A UTR/reference number is required." }, { status: 400 });
        const mode = ["NEFT_RTGS", "UPI", "IMPS", "CHEQUE"].includes(clientPaymentMode) ? clientPaymentMode : "NEFT_RTGS";
        const result = await client.rpc("submit_invoice_utr", {
          p_invoice_id: invoiceId, p_utr: String(clientUtrNumber).trim(), p_payment_mode: mode, p_note: clientPayerNote || null,
        });
        row = result.data;
        error = result.error;
      } else if (action === "RECONCILE" && auth.role === "PARTNER") {
        const { data: current } = await client.from("invoices").select("id").eq("id", invoiceId).eq("firm_id", auth.firmId).maybeSingle();
        if (!current) return NextResponse.json({ success: false, error: "Invoice not found or not accessible." }, { status: 404 });
        const result = await client.from("invoices").update({ status: "PAID", reconciled_by_id: auth.user?.id, reconciled_at: new Date().toISOString() })
          .eq("id", invoiceId).eq("firm_id", auth.firmId).select("*").single();
        row = result.data;
        error = result.error;
      } else {
        return NextResponse.json({ success: false, error: "This invoice action is not permitted." }, { status: 403 });
      }
      if (error || !row) return NextResponse.json({ success: false, error: "Invoice update was rejected by the database." }, { status: 400 });
      const { data: entity } = await client.from("client_entities").select("entity_name, group_id").eq("id", row.entity_id).maybeSingle();
      const audit = await writeServerAuditLog(req, auth, {
        entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", action: action === "SUBMIT_UTR" ? "Payment Reference Submitted" : "Invoice Reconciled",
        details: `Invoice ${row.invoice_no} status changed to ${row.status}.`, category: "INVOICE",
      });
      if (audit.error) console.error("Audit log write failed for invoice update.");
      const invoice: InvoiceItem = {
        id: row.id, invoiceNo: row.invoice_no, entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity",
        groupId: entity?.group_id || "", serviceDescription: row.service_description, taxableAmount: Number(row.taxable_amount),
        gstRate: Number(row.gst_rate), gstAmount: Number(row.gst_amount), amount: Number(row.total_amount), dueDate: row.due_date,
        status: row.status, sacCode: row.sac_code, clientUtrNumber: row.client_utr_number || undefined,
        clientPaymentMode: row.client_payment_mode || undefined, clientPaymentDate: row.client_payment_date || undefined,
        clientPayerNote: row.client_payer_note || undefined, reconciledBy: row.reconciled_by_id || undefined,
        reconciledAt: row.reconciled_at || undefined,
      };
      return NextResponse.json({ success: true, invoice });
    }

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
