import { NextRequest, NextResponse } from "next/server";
import { InvoiceItem, DocumentItem, PayToReleaseConfig } from "@/lib/types";
import { authenticateServerRequest, ServerAuthContext } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog, listWorkspaceRecords, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";
import { ensureBillingSchema, getIndianFyFromDate, allocateNextDocumentNumber } from "@/lib/server/billingSchema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapDbInvoice(row: any, entityNameMap: Map<string, { name: string; groupId: string }>): InvoiceItem {
  const ent = entityNameMap.get(row.entity_id);
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    documentType: row.document_type || "TAX_INVOICE",
    parentInvoiceId: row.parent_invoice_id || undefined,
    entityId: row.entity_id,
    entityName: row.entity_name || ent?.name || "Practice Client",
    groupId: row.group_id || ent?.groupId || "",
    serviceDescription: row.service_description,
    lineItems: Array.isArray(row.line_items) ? row.line_items : [],
    pureAgentAmount: Number(row.pure_agent_amount || 0),
    taxableAmount: Number(row.taxable_amount || 0),
    gstRate: Number(row.gst_rate || 18),
    gstAmount: Number(row.gst_amount || 0),
    roundOff: Number(row.round_off || 0),
    amount: Number(row.total_amount || 0),
    paidAmount: Number(row.paid_amount || (row.status === "PAID" ? row.total_amount : 0)),
    tdsClaimedAmount: Number(row.tds_claimed_amount || 0),
    tds26asVerified: Boolean(row.tds_26as_verified),
    dueDate: row.due_date ? new Date(row.due_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    status: row.status,
    sacCode: row.sac_code || "998231",
    financialYear: row.financial_year || getIndianFyFromDate(row.due_date || row.created_at),
    tdsRate: Number(row.tds_rate || 0),
    tdsAmount: Number(row.tds_amount || 0),
    isInterState: Boolean(row.is_inter_state),
    placeOfSupply: row.place_of_supply || undefined,
    firmGstin: row.firm_gstin || undefined,
    irn: row.irn || undefined,
    irnAckNo: row.irn_ack_no || undefined,
    wipJobId: row.wip_job_id || undefined,
    promissoryDate: row.promissory_date ? new Date(row.promissory_date).toISOString().split("T")[0] : undefined,
    dunningPaused: Boolean(row.dunning_paused),
    lastDunningStage: row.last_dunning_stage || undefined,
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
    await ensureBillingSchema(pool);

    const sp = request.nextUrl.searchParams;
    const fy = sp.get("fy");
    const status = sp.get("status");
    const search = (sp.get("search") || "").trim();
    const requestedEntityId = sp.get("entityId");
    const pageParam = sp.get("page");
    const limitParam = sp.get("limit");

    const where: string[] = ["i.firm_id = $1"];
    const params: any[] = [firmId];
    let idx = 2;

    if (auth.role === "CLIENT") {
      if (auth.clientEntityId && UUID_REGEX.test(auth.clientEntityId)) {
        where.push(`i.entity_id = $${idx++}`);
        params.push(auth.clientEntityId);
      } else if (auth.clientGroupId && UUID_REGEX.test(auth.clientGroupId)) {
        where.push(`ce.group_id = $${idx++}`);
        params.push(auth.clientGroupId);
      }
    } else if (requestedEntityId && UUID_REGEX.test(requestedEntityId)) {
      where.push(`i.entity_id = $${idx++}`);
      params.push(requestedEntityId);
    }

    if (fy && /^\d{4}-\d{2}$/.test(fy)) {
      where.push(`i.financial_year = $${idx++}`);
      params.push(fy);
    }

    // Summary KPIs across the scoped entity/FY (before status/search filter)
    const baseWhereSql = where.join(" AND ");
    const summaryParams = [...params];

    if (status && status !== "ALL") {
      if (status === "PENDING") {
        where.push(`i.status IN ('PENDING', 'OVERDUE')`);
      } else {
        where.push(`i.status = $${idx++}`);
        params.push(status);
      }
    }

    if (search) {
      where.push(`(ce.entity_name ILIKE $${idx} OR i.invoice_no ILIKE $${idx} OR i.service_description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const fullWhereSql = where.join(" AND ");
    const usePagination = Boolean(pageParam || limitParam);
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(limitParam || "50", 10) || 50));
    const offset = (page - 1) * limit;

    const listQuery = usePagination
      ? pool.query(
          `SELECT i.*, ce.entity_name, ce.group_id
           FROM public.invoices i
           JOIN public.client_entities ce ON ce.id = i.entity_id
           WHERE ${fullWhereSql}
           ORDER BY i.created_at DESC
           LIMIT $${idx++} OFFSET $${idx++}`,
          [...params, limit, offset]
        )
      : pool.query(
          `SELECT i.*, ce.entity_name, ce.group_id
           FROM public.invoices i
           JOIN public.client_entities ce ON ce.id = i.entity_id
           WHERE ${fullWhereSql}
           ORDER BY i.created_at DESC`,
          params
        );

    const [invRes, summaryRes, filteredCountRes] = await Promise.all([
      listQuery,
      pool.query(
        `SELECT
           COUNT(*)::int AS total_count,
           COALESCE(SUM(i.total_amount), 0)::numeric AS total_billed,
           COALESCE(SUM(CASE WHEN i.status = 'PAID' THEN i.total_amount ELSE 0 END), 0)::numeric AS collected,
           COALESCE(SUM(CASE WHEN i.status <> 'PAID' THEN i.total_amount ELSE 0 END), 0)::numeric AS pending,
           COUNT(*) FILTER (WHERE i.status = 'UTR_SUBMITTED')::int AS utr_review_count,
           COUNT(*) FILTER (WHERE i.status <> 'PAID' AND i.due_date < CURRENT_DATE - INTERVAL '30 days')::int AS overdue_45_count
         FROM public.invoices i
         JOIN public.client_entities ce ON ce.id = i.entity_id
         WHERE ${baseWhereSql}`,
        summaryParams
      ),
      usePagination
        ? pool.query(
            `SELECT COUNT(*)::int AS cnt
             FROM public.invoices i
             JOIN public.client_entities ce ON ce.id = i.entity_id
             WHERE ${fullWhereSql}`,
            params
          )
        : Promise.resolve({ rows: [{ cnt: 0 }] }),
    ]);

    const emptyMap = new Map<string, { name: string; groupId: string }>();
    const invoices = invRes.rows.map((r: any) => mapDbInvoice(r, emptyMap));
    const s = summaryRes.rows[0] || {};
    const totalBilled = Number(s.total_billed || 0);
    const collected = Number(s.collected || 0);
    const totalFiltered = usePagination ? Number(filteredCountRes.rows[0]?.cnt || 0) : invoices.length;

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        page,
        limit: usePagination ? limit : invoices.length || 50,
        total: totalFiltered,
        totalPages: usePagination ? Math.max(1, Math.ceil(totalFiltered / limit)) : 1,
      },
      summary: {
        totalBilled,
        totalInvoicesCount: Number(s.total_count || 0),
        collected,
        pending: Number(s.pending || 0),
        utrReviewCount: Number(s.utr_review_count || 0),
        overdue45Count: Number(s.overdue_45_count || 0),
        realizationRate: totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0,
      },
    });
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
    await ensureBillingSchema(pool);

    const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
    const amount = Number(body.amount);
    const serviceDescription = typeof body.serviceDescription === "string" ? body.serviceDescription.trim() : "";
    const dueDate = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];
    const financialYear = typeof body.financialYear === "string" && /^\d{4}-\d{2}$/.test(body.financialYear)
      ? body.financialYear
      : getIndianFyFromDate(dueDate);
    const tdsRate = Number(body.tdsRate || 0);
    const tdsAmount = Number(body.tdsAmount || 0);
    const isInterState = Boolean(body.isInterState);
    const placeOfSupply = typeof body.placeOfSupply === "string" ? body.placeOfSupply.trim() : null;
    const wipJobId = typeof body.wipJobId === "string" && UUID_REGEX.test(body.wipJobId) ? body.wipJobId : null;

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

    const documentType = ["TAX_INVOICE", "PROFORMA", "CREDIT_NOTE", "ADVANCE_RECEIPT"].includes(body.documentType)
      ? body.documentType
      : "TAX_INVOICE";
    const lineItems = Array.isArray(body.lineItems) ? body.lineItems : [];
    const pureAgentAmount = Number(body.pureAgentAmount || 0);
    const roundOff = Number(body.roundOff || 0);
    const firmGstin = typeof body.firmGstin === "string" && body.firmGstin.trim() ? body.firmGstin.trim() : null;
    const parentInvoiceId = typeof body.parentInvoiceId === "string" && UUID_REGEX.test(body.parentInvoiceId) ? body.parentInvoiceId : null;

    const taxable = Number(body.taxableAmount) || Math.round((amount - pureAgentAmount) / 1.18);
    const gst = Number(body.gstAmount) ?? Math.max(0, amount - pureAgentAmount - taxable);
    const invoiceNo =
      typeof body.invoiceNo === "string" && body.invoiceNo.trim()
        ? body.invoiceNo.trim()
        : await allocateNextDocumentNumber(pool, firmId, documentType, financialYear);
    const sacCode = typeof body.sacCode === "string" && body.sacCode.trim() ? body.sacCode.trim() : "998231";

    const inserted = await pool.query(
      `INSERT INTO public.invoices (
        firm_id, entity_id, invoice_no, document_type, parent_invoice_id,
        service_description, sac_code, line_items, pure_agent_amount,
        taxable_amount, gst_rate, gst_amount, round_off, total_amount, due_date, status,
        financial_year, tds_rate, tds_amount, is_inter_state, place_of_supply, firm_gstin, wip_job_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, 18, $11, $12, $13, $14, 'PENDING', $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        firmId,
        entity.id,
        invoiceNo,
        documentType,
        parentInvoiceId,
        serviceDescription,
        sacCode,
        JSON.stringify(lineItems),
        pureAgentAmount,
        taxable,
        gst,
        roundOff,
        amount,
        dueDate,
        financialYear,
        tdsRate,
        tdsAmount,
        isInterState,
        placeOfSupply,
        firmGstin,
        wipJobId,
      ]
    );

    const row = inserted.rows[0];
    if (wipJobId) {
      await pool.query(
        `UPDATE public.wip_jobs SET status = 'BILLED', invoice_id = $1, updated_at = now() WHERE id = $2 AND firm_id = $3`,
        [row.id, wipJobId, firmId]
      );
    }

    const emptyMap = new Map<string, { name: string; groupId: string }>();
    const newInvoice: InvoiceItem = mapDbInvoice(
      { ...row, entity_name: entity.entity_name, group_id: entity.group_id },
      emptyMap
    );

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

  const ALLOWED_ACTIONS = [
    "SUBMIT_UTR",
    "RECONCILE",
    "CONVERT_PROFORMA",
    "ALLOCATE_PAYMENT",
    "VERIFY_26AS_TDS",
    "BOUNCE_PAYMENT",
    "SET_PROMISSORY",
    "TOGGLE_DUNNING_PAUSE",
  ];
  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ success: false, error: "Invalid invoice settlement action." }, { status: 400 });
  }

  const firmId = await resolveFirmUuid(auth);
  const pool = getPostgresPool();
  await ensureBillingSchema(pool);

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
  } else if (action === "CONVERT_PROFORMA") {
    const fy = row.financial_year || getIndianFyFromDate();
    const newInvNo = await allocateNextDocumentNumber(pool, firmId, "TAX_INVOICE", fy);
    const upd = await pool.query(
      `UPDATE public.invoices
       SET document_type = 'TAX_INVOICE', invoice_no = $1, due_date = GREATEST(due_date, CURRENT_DATE)
       WHERE id = $2 AND firm_id = $3
       RETURNING *`,
      [newInvNo, row.id, firmId]
    );
    updatedRow = upd.rows[0] || row;
  } else if (action === "VERIFY_26AS_TDS") {
    const upd = await pool.query(
      `UPDATE public.invoices SET tds_26as_verified = TRUE WHERE id = $1 AND firm_id = $2 RETURNING *`,
      [row.id, firmId]
    );
    updatedRow = upd.rows[0] || row;
  } else if (action === "SET_PROMISSORY") {
    const upd = await pool.query(
      `UPDATE public.invoices SET promissory_date = $1::date, dunning_paused = TRUE WHERE id = $2 AND firm_id = $3 RETURNING *`,
      [body.promissoryDate || null, row.id, firmId]
    );
    updatedRow = upd.rows[0] || row;
  } else if (action === "TOGGLE_DUNNING_PAUSE") {
    const upd = await pool.query(
      `UPDATE public.invoices SET dunning_paused = NOT COALESCE(dunning_paused, FALSE) WHERE id = $1 AND firm_id = $2 RETURNING *`,
      [row.id, firmId]
    );
    updatedRow = upd.rows[0] || row;
  } else if (action === "BOUNCE_PAYMENT") {
    await pool.query(
      `UPDATE public.payment_allocations SET status = 'BOUNCED' WHERE invoice_id = $1 AND firm_id = $2 AND status = 'APPLIED'`,
      [row.id, firmId]
    );
    const upd = await pool.query(
      `UPDATE public.invoices SET status = 'PENDING', paid_amount = 0, tds_claimed_amount = 0, client_payer_note = COALESCE($1, 'Cheque/Instrument bounced - re-opened') WHERE id = $2 AND firm_id = $3 RETURNING *`,
      [clientPayerNote || null, row.id, firmId]
    );
    updatedRow = upd.rows[0] || row;
  } else if (action === "ALLOCATE_PAYMENT") {
    const cashAmount = Math.max(0, Number(body.cashAmount || 0));
    const tdsAmount = Math.max(0, Number(body.tdsAmount || 0));
    const validMode = ["NEFT_RTGS", "IMPS", "UPI", "CHEQUE"].includes(clientPaymentMode) ? clientPaymentMode : "NEFT_RTGS";
    await pool.query(
      `INSERT INTO public.payment_allocations (
        firm_id, entity_id, invoice_id, receipt_ref, payment_mode, cash_amount, tds_amount, status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'APPLIED', $8, $9)`,
      [firmId, row.entity_id, row.id, clientUtrNumber || `RCPT-${Date.now().toString().slice(-6)}`, validMode, cashAmount, tdsAmount, clientPayerNote || null, auth.userName || "Partner"]
    );
    const nextPaid = Number(row.paid_amount || 0) + cashAmount;
    const nextTds = Number(row.tds_claimed_amount || 0) + tdsAmount;
    const settled = nextPaid + nextTds >= Number(row.total_amount || 0) - 1;
    const upd = await pool.query(
      `UPDATE public.invoices
       SET paid_amount = $1,
           tds_claimed_amount = $2,
           status = CASE WHEN $3 THEN 'PAID'::invoice_status ELSE status END,
           client_utr_number = COALESCE(NULLIF($4, ''), client_utr_number),
           client_payment_mode = COALESCE($5::payment_mode, client_payment_mode),
           reconciled_at = CASE WHEN $3 THEN now() ELSE reconciled_at END
       WHERE id = $6 AND firm_id = $7
       RETURNING *`,
      [nextPaid, nextTds, settled, clientUtrNumber, validMode, row.id, firmId]
    );
    updatedRow = upd.rows[0] || row;
  } else {
    // action === "RECONCILE" (Partner-verified bank settlement)
    const actorUuid = auth.user?.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;
    const validMode = ["NEFT_RTGS", "IMPS", "UPI", "CHEQUE"].includes(clientPaymentMode) ? clientPaymentMode : null;
    const upd = await pool.query(
      `UPDATE public.invoices
       SET status = 'PAID',
           paid_amount = GREATEST(paid_amount, total_amount - COALESCE(tds_claimed_amount, 0)),
           client_utr_number = COALESCE(NULLIF($2, ''), client_utr_number),
           client_payment_mode = COALESCE($3::payment_mode, client_payment_mode),
           client_payment_date = COALESCE(client_payment_date, CURRENT_DATE),
           client_payer_note = COALESCE(NULLIF($4, ''), client_payer_note),
           reconciled_by_id = $1,
           reconciled_at = now()
       WHERE id = $5 AND firm_id = $6
       RETURNING *`,
      [actorUuid, clientUtrNumber, validMode, clientPayerNote, row.id, firmId]
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
