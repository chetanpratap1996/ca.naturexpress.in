import { NextRequest, NextResponse } from "next/server";
import { InvoiceItem, DocumentItem, PayToReleaseConfig } from "@/lib/types";
import { authenticateServerRequest, ServerAuthContext } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapDbInvoice(row: any, entityNameMap: Map<string, { name: string; groupId: string }>): InvoiceItem {
  const ent = entityNameMap.get(row.entity_id);
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    entityId: row.entity_id,
    entityName: ent?.name || "Practice Client",
    groupId: ent?.groupId || "",
    serviceDescription: row.service_description,
    taxableAmount: Number(row.taxable_amount || 0),
    gstRate: Number(row.gst_rate || 18),
    gstAmount: Number(row.gst_amount || 0),
    amount: Number(row.total_amount || 0),
    dueDate: row.due_date ? new Date(row.due_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    status: row.status,
    sacCode: row.sac_code || "998231",
    clientUtrNumber: row.client_utr_number || undefined,
    clientPaymentMode: row.client_payment_mode || undefined,
    clientPaymentDate: row.client_payment_date ? new Date(row.client_payment_date).toISOString().split("T")[0] : undefined,
    clientPayerNote: row.client_payer_note || undefined,
    reconciledAt: row.reconciled_at ? new Date(row.reconciled_at).toISOString() : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    const [{ rows: entRows }, { rows: invRows }] = await Promise.all([
      pool.query("SELECT id, entity_name, group_id FROM public.client_entities WHERE firm_id = $1", [firmId]),
      auth.role === "CLIENT" && auth.clientEntityId && UUID_REGEX.test(auth.clientEntityId)
        ? pool.query(
            "SELECT * FROM public.invoices WHERE firm_id = $1 AND entity_id = $2 ORDER BY created_at DESC",
            [firmId, auth.clientEntityId]
          )
        : pool.query("SELECT * FROM public.invoices WHERE firm_id = $1 ORDER BY created_at DESC", [firmId]),
    ]);

    const entityMap = new Map<string, { name: string; groupId: string }>();
    for (const e of entRows) {
      entityMap.set(e.id, { name: e.entity_name, groupId: e.group_id });
    }

    let invoices = invRows.map((r: any) => mapDbInvoice(r, entityMap));
    if (auth.role === "CLIENT") {
      invoices = invoices.filter(
        (i: InvoiceItem) =>
          (auth.clientEntityId && i.entityId === auth.clientEntityId) ||
          (!auth.clientEntityId && auth.clientGroupId && i.groupId === auth.clientGroupId)
      );
    }

    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ success: false, error: "Failed to load invoices." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "SUBMIT_UTR" || body.action === "RECONCILE") {
      return handleInvoiceSettlement(auth, body);
    }

    if (auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Only firm partners can generate new tax invoices." },
        { status: 403 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
    const amount = Number(body.amount);
    const serviceDescription = typeof body.serviceDescription === "string" ? body.serviceDescription.trim() : "";
    const dueDate = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];

    if (!entityId || !UUID_REGEX.test(entityId) || !serviceDescription || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid entityId, serviceDescription, and positive amount are required." },
        { status: 400 }
      );
    }

    const entRes = await pool.query(
      "SELECT id, entity_name, group_id FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
      [entityId, firmId]
    );
    if (entRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client entity not found in your firm." }, { status: 404 });
    }
    const entity = entRes.rows[0];

    const taxable = Number(body.taxableAmount) || Math.round(amount / 1.18);
    const gst = Number(body.gstAmount) || amount - taxable;
    const countRes = await pool.query("SELECT count(*)::int as cnt FROM public.invoices WHERE firm_id = $1", [firmId]);
    const invoiceNo =
      typeof body.invoiceNo === "string" && body.invoiceNo.trim()
        ? body.invoiceNo.trim()
        : `BT/2026-27/${String((countRes.rows[0]?.cnt || 0) + 101)}`;
    const sacCode = typeof body.sacCode === "string" && body.sacCode.trim() ? body.sacCode.trim() : "998231";

    const inserted = await pool.query(
      `INSERT INTO public.invoices (
        firm_id, entity_id, invoice_no, service_description, sac_code,
        taxable_amount, gst_rate, gst_amount, total_amount, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 18, $7, $8, $9, 'PENDING')
      RETURNING *`,
      [firmId, entity.id, invoiceNo, serviceDescription, sacCode, taxable, gst, amount, dueDate]
    );

    const row = inserted.rows[0];
    const newInvoice: InvoiceItem = {
      id: row.id,
      invoiceNo: row.invoice_no,
      entityId: entity.id,
      entityName: entity.entity_name,
      groupId: entity.group_id,
      serviceDescription: row.service_description,
      taxableAmount: Number(row.taxable_amount),
      gstRate: 18,
      gstAmount: Number(row.gst_amount),
      amount: Number(row.total_amount),
      dueDate: new Date(row.due_date).toISOString().split("T")[0],
      status: "PENDING",
      sacCode: row.sac_code,
    };

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Partner",
      actorRole: "PARTNER",
      entityId: entity.id,
      entityName: entity.entity_name,
      action: "Invoice Generated",
      details: `Generated Tax Invoice #${newInvoice.invoiceNo} for ₹${newInvoice.amount.toLocaleString("en-IN")}`,
      category: "INVOICE",
    });

    await upsertWorkspaceRecord({
      firmId,
      entityId: entity.id,
      recordType: "NOTIFICATION",
      payload: {
        id: `NOTIF-INV-${row.id}`,
        title: `Invoice Generated: ${newInvoice.invoiceNo}`,
        message: `Tax invoice of ₹${newInvoice.amount.toLocaleString("en-IN")} generated for ${entity.entity_name} (${newInvoice.serviceDescription}).`,
        category: "BILLING",
        priority: "MEDIUM",
        recipientRole: "CLIENT",
        recipientEntityId: entity.id,
        targetTab: "billing",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error: any) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate invoice." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    const body = await req.json();
    return handleInvoiceSettlement(auth, body);
  } catch (error: any) {
    console.error("PATCH /api/invoices error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process invoice action." }, { status: 500 });
  }
}

async function handleInvoiceSettlement(auth: ServerAuthContext, body: any) {
  const {
    invoiceId,
    action,
    clientUtrNumber: rawClientUtr,
    utrNumber: rawUtr,
    clientPaymentMode: rawMode,
    paymentMode: rawPayMode,
    clientPayerNote: rawNote,
    payerNote: rawPayerNote,
  } = body;

  const clientUtrNumber = typeof (rawClientUtr || rawUtr) === "string" ? (rawClientUtr || rawUtr).trim() : "";
  const clientPaymentMode = rawMode || rawPayMode || "UPI";
  const clientPayerNote = typeof (rawNote || rawPayerNote) === "string" ? (rawNote || rawPayerNote).trim() : "";

  if (action !== "SUBMIT_UTR" && action !== "RECONCILE") {
    return NextResponse.json({ success: false, error: "Invalid invoice settlement action." }, { status: 400 });
  }

  const firmId = await resolveFirmUuid(auth);
  const pool = getPostgresPool();

  if (!invoiceId || !UUID_REGEX.test(String(invoiceId))) {
    return NextResponse.json({ success: false, error: "Valid invoiceId is required." }, { status: 400 });
  }

  const invRes = await pool.query(
    `SELECT i.*, ce.entity_name, ce.group_id
     FROM public.invoices i
     JOIN public.client_entities ce ON ce.id = i.entity_id
     WHERE i.id = $1 AND i.firm_id = $2
     LIMIT 1`,
    [invoiceId, firmId]
  );

  if (invRes.rows.length === 0) {
    return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
  }

  const row = invRes.rows[0];

  // Authorization checks
  if (auth.role === "CLIENT") {
    if (action !== "SUBMIT_UTR") {
      return NextResponse.json({ success: false, error: "Only a firm partner can reconcile invoices." }, { status: 403 });
    }
    const ownsEntity = auth.clientEntityId && row.entity_id === auth.clientEntityId;
    const ownsGroup = !auth.clientEntityId && auth.clientGroupId && row.group_id === auth.clientGroupId;
    if (!ownsEntity && !ownsGroup) {
      return NextResponse.json(
        { success: false, error: "You may submit payment details only for your assigned entity." },
        { status: 403 }
      );
    }
    if (row.status === "PAID") {
      return NextResponse.json({ success: false, error: "This invoice is already paid and reconciled." }, { status: 400 });
    }
    if (!/^[A-Za-z0-9-]{6,40}$/.test(clientUtrNumber)) {
      return NextResponse.json({ success: false, error: "A valid UTR reference (6-40 chars) is required." }, { status: 400 });
    }
    if (!["NEFT_RTGS", "IMPS", "UPI", "CHEQUE"].includes(clientPaymentMode) || clientPayerNote.length > 500) {
      return NextResponse.json({ success: false, error: "Payment mode or note is invalid." }, { status: 400 });
    }
  } else if (auth.role !== "PARTNER") {
    return NextResponse.json({ success: false, error: "Only a firm partner can reconcile invoices." }, { status: 403 });
  }

  let updatedRow = row;
  let payCfg: PayToReleaseConfig | undefined;
  let receiptDoc: DocumentItem | null = null;

  if (action === "SUBMIT_UTR") {
    // CRITICAL SECURITY RULE: Client UTR submission ALWAYS sets status to UTR_SUBMITTED (pending partner bank verification).
    // Clients can NEVER self-mark invoices PAID or unlock Pay-to-Release deliverables.
    const upd = await pool.query(
      `UPDATE public.invoices
       SET status = 'UTR_SUBMITTED',
           client_utr_number = $1,
           client_payment_mode = $2::payment_mode,
           client_payment_date = CURRENT_DATE,
           client_payer_note = $3
       WHERE id = $4 AND firm_id = $5 AND status IN ('PENDING', 'OVERDUE', 'UTR_SUBMITTED')
       RETURNING *`,
      [clientUtrNumber, clientPaymentMode, clientPayerNote || "UTR submitted by client; pending bank verification.", row.id, firmId]
    );
    updatedRow = upd.rows[0] || row;

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || row.entity_name,
      actorRole: auth.role,
      entityId: row.entity_id,
      entityName: row.entity_name,
      action: "Payment Reference Submitted",
      details: `Submitted UTR ${clientUtrNumber} (${clientPaymentMode}) for Invoice #${row.invoice_no}. Pending partner bank reconciliation.`,
      category: "INVOICE",
    });

    await upsertWorkspaceRecord({
      firmId,
      entityId: row.entity_id,
      recordType: "NOTIFICATION",
      payload: {
        id: `NOTIF-UTR-${Date.now()}`,
        title: `UTR Pending Bank Verification: ${row.entity_name}`,
        message: `${row.entity_name} submitted UTR ${clientUtrNumber} (${clientPaymentMode}) for Invoice #${row.invoice_no} (₹${Number(row.total_amount).toLocaleString("en-IN")}). Please verify bank credit before releasing deliverables.`,
        category: "BILLING",
        priority: "HIGH",
        recipientRole: "PARTNER",
        recipientEntityId: row.entity_id,
        targetTab: "pay-to-release",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });
  } else {
    // action === "RECONCILE" (Partner-verified bank settlement)
    const actorUuid = auth.user?.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;
    const upd = await pool.query(
      `UPDATE public.invoices
       SET status = 'PAID',
           reconciled_by_id = $1,
           reconciled_at = now()
       WHERE id = $2 AND firm_id = $3
       RETURNING *`,
      [actorUuid, row.id, firmId]
    );
    updatedRow = upd.rows[0] || row;

    const unpaidRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0)::numeric as remaining
       FROM public.invoices
       WHERE firm_id = $1 AND entity_id = $2 AND status <> 'PAID'`,
      [firmId, row.entity_id]
    );
    const remainingUnpaid = Number(unpaidRes.rows[0]?.remaining || 0);

    const existingCfgs = await listWorkspaceRecords<PayToReleaseConfig>(firmId, "PAY_TO_RELEASE_CONFIG", row.entity_id);
    const existingCfg = existingCfgs[0]?.payload;
    payCfg = {
      entityId: row.entity_id,
      isLocked: remainingUnpaid > 0 ? Boolean(existingCfg?.isLocked) : false,
      totalOutstandingAmount: remainingUnpaid,
      oldestInvoiceDays: existingCfg?.oldestInvoiceDays || 0,
      gracePeriodDays: existingCfg?.gracePeriodDays || 30,
      blockedDeliverables: existingCfg?.blockedDeliverables || ["FORM_3CD_PDF", "BALANCE_SHEET_SIGNED", "ITR_ACKNOWLEDGMENT"],
      instantUpiVpa: existingCfg?.instantUpiVpa || "BRAINSANDTAXES@icici",
      merchantName: existingCfg?.merchantName || "Brains & Taxes",
      lockReason:
        remainingUnpaid === 0
          ? `Cleared & verified by ${auth.userName || "Partner"}. Deliverables unlocked.`
          : `Remaining balance: ₹${remainingUnpaid.toLocaleString("en-IN")}`,
    };

    await upsertWorkspaceRecord({
      firmId,
      entityId: row.entity_id,
      recordType: "PAY_TO_RELEASE_CONFIG",
      matchKey: "entityId",
      matchValue: row.entity_id,
      payload: payCfg,
    });

    const receiptName = `Receipt_${String(row.invoice_no).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    const docIns = await pool.query(
      `INSERT INTO public.documents (
        firm_id, entity_id, category, file_name, file_size_bytes, financial_year, review_status, reviewed_by_id, reviewed_at
      ) VALUES ($1, $2, 'CHALLAN', $3, 189440, 'FY 2026-27', 'APPROVED', $4, now())
      RETURNING id, created_at`,
      [firmId, row.entity_id, receiptName, actorUuid]
    );
    receiptDoc = {
      id: docIns.rows[0].id,
      entityId: row.entity_id,
      entityName: row.entity_name,
      category: "CHALLAN",
      fileName: receiptName,
      fileSize: "185 KB",
      uploadedAt: new Date(docIns.rows[0].created_at).toISOString(),
      uploadedBy: "FIRM_STAFF",
      isPasswordProtected: false,
      isUnlocked: true,
      financialYear: "FY 2026-27",
      reviewStatus: "APPROVED",
      reviewedBy: auth.userName || "Firm Partner",
      reviewedAt: new Date().toISOString(),
    };

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Partner",
      actorRole: "PARTNER",
      entityId: row.entity_id,
      entityName: row.entity_name,
      action: "Payment Reconciled & Settled",
      details: `Partner verified settlement via UTR ${row.client_utr_number || "Direct"} for Invoice #${row.invoice_no}.`,
      category: "INVOICE",
    });

    await upsertWorkspaceRecord({
      firmId,
      entityId: row.entity_id,
      recordType: "NOTIFICATION",
      payload: {
        id: `NOTIF-PAID-${Date.now()}`,
        title: `Payment Verified & Deliverables Unlocked: #${row.invoice_no}`,
        message: `Payment of ₹${Number(row.total_amount).toLocaleString("en-IN")} for ${row.entity_name} has been verified. Certified deliverables are now unlocked in your Vault.`,
        category: "BILLING",
        priority: "HIGH",
        recipientRole: "CLIENT",
        recipientEntityId: row.entity_id,
        targetTab: "vault",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });
  }

  const entityMap = new Map([[row.entity_id, { name: row.entity_name, groupId: row.group_id }]]);
  const mappedInvoice = mapDbInvoice(updatedRow, entityMap);

  return NextResponse.json({
    success: true,
    invoice: mappedInvoice,
    deliverablesUnlocked: payCfg ? !payCfg.isLocked : false,
    deliverableDocument: receiptDoc,
  });
}
