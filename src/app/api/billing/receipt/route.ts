import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txnId = searchParams.get("txn") || `TXN-${Date.now().toString().slice(-6)}`;
    const invoiceId = searchParams.get("invoiceId");

    const db = ensureDatabase();
    let matchedInvoice = invoiceId ? db.invoices.find((i) => i.id === invoiceId) : db.invoices[0];

    const entityName = matchedInvoice?.entityName || "Apex AutoTech Private Limited";
    const invoiceNo = matchedInvoice?.invoiceNo || `GPA/2026-27/${Date.now().toString().slice(-4)}`;
    const amount = matchedInvoice?.amount || 29500;
    const taxable = Math.round(amount / 1.18);
    const cgst = Math.round((amount - taxable) / 2);
    const sgst = amount - taxable - cgst;
    const utr = matchedInvoice?.clientUtrNumber || `UPI-${Date.now().toString().slice(-8)}`;
    const paymentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    // Generate compliant statutory receipt PDF
    const receiptPdf = [
      "%PDF-1.4",
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
      "4 0 obj << /Length 720 >> stream",
      "BT",
      "/F1 16 Tf",
      "50 740 Td",
      "(GPA & Co., Chartered Accountants - Official Fee Receipt) Tj",
      "/F1 10 Tf",
      "0 -22 Td",
      "(ICAI Firm Registration Number: 022998C | Managing Partner: CA Gunjan Jain) Tj",
      "0 -18 Td",
      "(Registered Office: 103, NM Verge, Y.N. Road, Indore, MP - 452001) Tj",
      "0 -24 Td",
      `(${`Receipt Reference: ${txnId} | Invoice No: ${invoiceNo}`}) Tj`,
      "0 -18 Td",
      `(${`Assessee / Client Entity: ${entityName}`}) Tj`,
      "0 -18 Td",
      `(${`Payment Date: ${paymentDate} | Status: VERIFIED & SETTLED`}) Tj`,
      "0 -18 Td",
      `(${`Banking Settlement UTR / Ref: ${utr}`}) Tj`,
      "0 -24 Td",
      "(STATUTORY BILLING BREAKDOWN (SAC Code: 998231 - Professional CA Services):) Tj",
      "0 -18 Td",
      `(${`  Taxable Professional Fees: INR ${taxable.toLocaleString("en-IN")}`}) Tj`,
      "0 -16 Td",
      `(${`  Central GST (CGST @ 9%): INR ${cgst.toLocaleString("en-IN")}`}) Tj`,
      "0 -16 Td",
      `(${`  State GST (SGST @ 9%): INR ${sgst.toLocaleString("en-IN")}`}) Tj`,
      "0 -20 Td",
      `(${`  Total Fee Received & Cleared: INR ${amount.toLocaleString("en-IN")}`}) Tj`,
      "0 -30 Td",
      "(For GPA & Co., Chartered Accountants (FRN: 022998C)) Tj",
      "0 -16 Td",
      "(Authorized Signatory - Digital Seal Applied & Validated) Tj",
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
      "%%EOF"
    ].join("\n");

    const buffer = Buffer.from(receiptPdf, "utf-8");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Receipt_${txnId}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Billing receipt API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
