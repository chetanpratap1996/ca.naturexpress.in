import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";
import { ensureBillingSchema } from "@/lib/server/billingSchema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await ensureBillingSchema(pool);

    const entityId = auth.role === "CLIENT" ? auth.clientEntityId : request.nextUrl.searchParams.get("entityId");
    const suspenseRes =
      auth.role !== "CLIENT"
        ? await pool.query(
            `SELECT * FROM public.payment_allocations WHERE firm_id = $1 AND status = 'SUSPENSE' ORDER BY created_at DESC LIMIT 50`,
            [firmId]
          )
        : { rows: [] };

    if (!entityId || !UUID_REGEX.test(entityId)) {
      return NextResponse.json({
        success: true,
        entries: [],
        closingBalance: 0,
        dsoDays: 0,
        paymentGrade: "A",
        suspenseCredits: suspenseRes.rows.map((r: any) => ({
          id: r.id,
          receiptRef: r.receipt_ref,
          cashAmount: Number(r.cash_amount || 0),
          allocationDate: r.allocation_date ? new Date(r.allocation_date).toISOString().split("T")[0] : "",
          notes: r.notes || "",
        })),
      });
    }

    const [invRes, allocRes] = await Promise.all([
      pool.query(
        `SELECT id, invoice_no, document_type, service_description, total_amount, due_date, status, reconciled_at, tds_claimed_amount, tds_26as_verified, created_at
         FROM public.invoices
         WHERE firm_id = $1 AND entity_id = $2
         ORDER BY created_at ASC`,
        [firmId, entityId]
      ),
      pool.query(
        `SELECT pa.*, i.invoice_no
         FROM public.payment_allocations pa
         LEFT JOIN public.invoices i ON i.id = pa.invoice_id
         WHERE pa.firm_id = $1 AND pa.entity_id = $2 AND pa.status = 'APPLIED'
         ORDER BY pa.allocation_date ASC, pa.created_at ASC`,
        [firmId, entityId]
      ),
    ]);

    type LedgerRow = {
      id: string;
      date: string;
      refNo: string;
      type: "INVOICE" | "CREDIT_NOTE" | "RECEIPT" | "TDS_194J";
      particulars: string;
      debit: number;
      credit: number;
      balance: number;
    };

    const rawEvents: Array<Omit<LedgerRow, "balance">> = [];
    let totalSettlementDays = 0;
    let settledCount = 0;

    for (const inv of invRes.rows) {
      const dateStr = (inv.created_at ? new Date(inv.created_at) : new Date()).toISOString().split("T")[0];
      const isCn = inv.document_type === "CREDIT_NOTE";
      const amt = Number(inv.total_amount || 0);
      rawEvents.push({
        id: `INV-${inv.id}`,
        date: dateStr,
        refNo: inv.invoice_no,
        type: isCn ? "CREDIT_NOTE" : "INVOICE",
        particulars: inv.service_description,
        debit: isCn ? 0 : amt,
        credit: isCn ? amt : 0,
      });

      if (inv.status === "PAID" && inv.reconciled_at) {
        const diffDays = Math.max(
          0,
          Math.round((new Date(inv.reconciled_at).getTime() - new Date(inv.created_at).getTime()) / 86400000)
        );
        totalSettlementDays += diffDays;
        settledCount += 1;
      }
    }

    for (const al of allocRes.rows) {
      const dateStr = al.allocation_date
        ? new Date(al.allocation_date).toISOString().split("T")[0]
        : new Date(al.created_at).toISOString().split("T")[0];
      const cash = Number(al.cash_amount || 0);
      const tds = Number(al.tds_amount || 0);
      if (cash > 0) {
        rawEvents.push({
          id: `RCPT-${al.id}`,
          date: dateStr,
          refNo: al.receipt_ref,
          type: "RECEIPT",
          particulars: `Receipt (${al.payment_mode})${al.invoice_no ? ` agst ${al.invoice_no}` : ""}`,
          debit: 0,
          credit: cash,
        });
      }
      if (tds > 0) {
        rawEvents.push({
          id: `TDS-${al.id}`,
          date: dateStr,
          refNo: al.receipt_ref,
          type: "TDS_194J",
          particulars: `TDS u/s 194J${al.invoice_no ? ` agst ${al.invoice_no}` : ""}`,
          debit: 0,
          credit: tds,
        });
      }
    }

    rawEvents.sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    const entries: LedgerRow[] = rawEvents.map((ev) => {
      running = running + ev.debit - ev.credit;
      return { ...ev, balance: running };
    });

    const dsoDays = settledCount > 0 ? Math.round(totalSettlementDays / settledCount) : 0;
    const paymentGrade = dsoDays <= 10 ? "A" : dsoDays <= 25 ? "B" : dsoDays <= 45 ? "C" : "D";

    return NextResponse.json({
      success: true,
      entries,
      closingBalance: running,
      dsoDays,
      paymentGrade,
      suspenseCredits: suspenseRes.rows.map((r: any) => ({
        id: r.id,
        receiptRef: r.receipt_ref,
        cashAmount: Number(r.cash_amount || 0),
        allocationDate: r.allocation_date ? new Date(r.allocation_date).toISOString().split("T")[0] : "",
        notes: r.notes || "",
      })),
    });
  } catch (error: any) {
    console.error("GET /api/billing/ledger error:", error);
    return NextResponse.json({ success: false, error: "Failed to load party ledger." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json({ success: false, error: "Partner authorization required." }, { status: 403 });
    }
    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await ensureBillingSchema(pool);

    const { allocationId, invoiceId } = await request.json();
    if (!UUID_REGEX.test(String(allocationId)) || !UUID_REGEX.test(String(invoiceId))) {
      return NextResponse.json({ success: false, error: "Valid allocationId and invoiceId required." }, { status: 400 });
    }

    const invRes = await pool.query("SELECT * FROM public.invoices WHERE id = $1 AND firm_id = $2 LIMIT 1", [invoiceId, firmId]);
    const allocRes = await pool.query("SELECT * FROM public.payment_allocations WHERE id = $1 AND firm_id = $2 LIMIT 1", [allocationId, firmId]);
    if (!invRes.rows[0] || !allocRes.rows[0]) {
      return NextResponse.json({ success: false, error: "Record not found." }, { status: 404 });
    }
    const inv = invRes.rows[0];
    const alloc = allocRes.rows[0];

    await pool.query(
      `UPDATE public.payment_allocations SET entity_id = $1, invoice_id = $2, status = 'APPLIED' WHERE id = $3`,
      [inv.entity_id, inv.id, alloc.id]
    );
    const nextPaid = Number(inv.paid_amount || 0) + Number(alloc.cash_amount || 0);
    const settled = nextPaid + Number(inv.tds_claimed_amount || 0) >= Number(inv.total_amount || 0) - 1;
    await pool.query(
      `UPDATE public.invoices SET paid_amount = $1, status = CASE WHEN $2 THEN 'PAID'::invoice_status ELSE status END, client_utr_number = COALESCE(client_utr_number, $3) WHERE id = $4`,
      [nextPaid, settled, alloc.receipt_ref, inv.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/billing/ledger error:", error);
    return NextResponse.json({ success: false, error: "Failed to assign suspense credit." }, { status: 500 });
  }
}
