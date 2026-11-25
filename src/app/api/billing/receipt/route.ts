import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const txnId = searchParams.get("txn") || `TXN-${Date.now().toString().slice(-6)}`;
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId || !UUID_REGEX.test(invoiceId)) {
      return NextResponse.json({ success: false, error: "Valid invoiceId is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const { rows } = await pool.query(
      `SELECT i.*, ce.entity_name, ce.group_id, f.firm_name, f.frn, f.head_office_address
       FROM public.invoices i
       JOIN public.client_entities ce ON ce.id = i.entity_id
       JOIN public.firms f ON f.id = i.firm_id
       WHERE i.id = $1 AND i.firm_id = $2
       LIMIT 1`,
      [invoiceId, firmId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
    }

    const inv = rows[0];
    if (auth.role === "CLIENT") {
      const ownsEntity = auth.clientEntityId && inv.entity_id === auth.clientEntityId;
      const ownsGroup = !auth.clientEntityId && auth.clientGroupId && inv.group_id === auth.clientGroupId;
      if (!ownsEntity && !ownsGroup) {
        return NextResponse.json({ success: false, error: "Unauthorized access to receipt." }, { status: 403 });
      }
    }

    if (inv.status !== "PAID") {
      return NextResponse.json(
        { success: false, error: "Official receipt is only available for partner-verified PAID invoices." },
        { status: 402 }
      );
    }

    const firmName = inv.firm_name || DEFAULT_FIRM_BRANDING.firmName;
    const frn = inv.frn || DEFAULT_FIRM_BRANDING.frn;
    const amount = Number(inv.total_amount || 0);
    const taxable = Number(inv.taxable_amount || Math.round(amount / 1.18));
    const cgst = Math.round((amount - taxable) / 2);
    const sgst = amount - taxable - cgst;
    const utr = inv.client_utr_number || "DIRECT_SETTLEMENT";
    const paymentDate = new Date(inv.reconciled_at || inv.client_payment_date || Date.now()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const receiptPdf = [
      "%PDF-1.4",
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
      "4 0 obj << /Length 720 >> stream",
      "BT",
      "/F1 16 Tf",
      "50 740 Td",
      `(${firmName} - Official Fee Receipt) Tj`,
      "/F1 10 Tf",
      "0 -22 Td",
      `(ICAI FRN: ${frn} | Authorized Receipt) Tj`,
      "0 -18 Td",
      `(${inv.head_office_address || DEFAULT_FIRM_BRANDING.headOffice}) Tj`,
      "0 -24 Td",
      `(Receipt Reference: ${txnId} | Invoice No: ${inv.invoice_no}) Tj`,
      "0 -18 Td",
      `(Assessee / Client Entity: ${inv.entity_name}) Tj`,
      "0 -18 Td",
      `(Payment Date: ${paymentDate} | Status: VERIFIED & SETTLED) Tj`,
      "0 -18 Td",
      `(Banking Settlement UTR / Ref: ${utr}) Tj`,
      "0 -24 Td",
      `(STATUTORY BILLING BREAKDOWN (SAC Code: ${inv.sac_code || "998231"}):) Tj`,
      "0 -18 Td",
      `(  Taxable Professional Fees: INR ${taxable.toLocaleString("en-IN")}) Tj`,
      "0 -16 Td",
      `(  Central GST (CGST @ 9%): INR ${cgst.toLocaleString("en-IN")}) Tj`,
      "0 -16 Td",
      `(  State GST (SGST @ 9%): INR ${sgst.toLocaleString("en-IN")}) Tj`,
      "0 -20 Td",
      `(  Total Fee Received & Cleared: INR ${amount.toLocaleString("en-IN")}) Tj`,
      "0 -30 Td",
      `(For ${firmName} (FRN: ${frn})) Tj`,
      "ET",
      "endstream",
      "endobj",
      "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      "xref",
      "0 6",
      "0000000000 65535 f ",
      "0000000010 00000 n ",
      "0000000069 00000 n ",
      "0000000128 00000 n ",
      "0000000253 00000 n ",
      "0000001025 00000 n ",
      "trailer << /Size 6 /Root 1 0 R >>",
      "startxref",
      "1094",
      "%%EOF",
    ].join("\n");

    const buffer = Buffer.from(receiptPdf, "utf-8");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Receipt_${inv.invoice_no.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Billing receipt API error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate receipt." }, { status: 500 });
  }
}
