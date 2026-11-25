import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, listWorkspaceRecords } from "@/lib/server/pgHelpers";
import { PayToReleaseConfig } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { UPLOADS_DIR } from "@/lib/server/db";
import fs from "fs";
import path from "path";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("id");
    const requestedName = searchParams.get("fileName");
    if (!docId && !requestedName) {
      return NextResponse.json({ success: false, error: "Document ID or filename required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    const docRes =
      docId && UUID_REGEX.test(docId)
        ? await pool.query(
            `SELECT d.*, ce.entity_name, ce.group_id, f.firm_name, f.frn, f.firm_upi_vpa, f.bank_name, f.bank_account_number, f.bank_ifsc
             FROM public.documents d
             JOIN public.client_entities ce ON ce.id = d.entity_id
             JOIN public.firms f ON f.id = d.firm_id
             WHERE d.id = $1 AND d.firm_id = $2
             LIMIT 1`,
            [docId, firmId]
          )
        : await pool.query(
            `SELECT d.*, ce.entity_name, ce.group_id, f.firm_name, f.frn, f.firm_upi_vpa, f.bank_name, f.bank_account_number, f.bank_ifsc
             FROM public.documents d
             JOIN public.client_entities ce ON ce.id = d.entity_id
             JOIN public.firms f ON f.id = d.firm_id
             WHERE d.file_name = $1 AND d.firm_id = $2
             ORDER BY d.created_at DESC
             LIMIT 1`,
            [requestedName, firmId]
          );

    if (docRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Document not found in practice repository." }, { status: 404 });
    }

    const doc = docRes.rows[0];

    // Strict tenant check for Client users
    if (auth.role === "CLIENT") {
      const ownsEntity = auth.clientEntityId && doc.entity_id === auth.clientEntityId;
      const ownsGroup = !auth.clientEntityId && auth.clientGroupId && doc.group_id === auth.clientGroupId;
      if (!ownsEntity && !ownsGroup) {
        return NextResponse.json({ success: false, error: "Unauthorized access to client deliverable." }, { status: 403 });
      }
    }

    // Hard server-side Pay-to-Release check for non-draft client downloads
    const isFirmStaff = ["PARTNER", "ARTICLE", "TEAM"].includes(auth.role);
    const isDraftRequest = searchParams.get("draft") === "true";

    if (!isFirmStaff && !isDraftRequest) {
      const cfgRecs = await listWorkspaceRecords<PayToReleaseConfig>(firmId, "PAY_TO_RELEASE_CONFIG", doc.entity_id);
      const payConfig = cfgRecs[0]?.payload;

      if (payConfig && payConfig.isLocked) {
        const overrideExpiry = payConfig.partnerOverrideUntil ? new Date(payConfig.partnerOverrideUntil).getTime() : 0;
        const isOverrideValid = overrideExpiry > Date.now();

        if (!isOverrideValid) {
          return NextResponse.json(
            {
              success: false,
              error: "PAYMENT_REQUIRED",
              code: "DELIVERABLE_LOCKED",
              isLocked: true,
              entityId: doc.entity_id,
              entityName: doc.entity_name,
              fileName: doc.file_name,
              totalOutstandingAmount: payConfig.totalOutstandingAmount,
              lockReason: payConfig.lockReason,
              firmUpiVpa: payConfig.instantUpiVpa || doc.firm_upi_vpa || DEFAULT_FIRM_BRANDING.firmUpiVpa,
              bankDetails: {
                accountName: DEFAULT_FIRM_BRANDING.companyName,
                bankName: doc.bank_name || DEFAULT_FIRM_BRANDING.bankDetails.bankName,
                accountNumber: doc.bank_account_number || DEFAULT_FIRM_BRANDING.bankDetails.accountNumber,
                ifsc: doc.bank_ifsc || DEFAULT_FIRM_BRANDING.bankDetails.ifsc,
              },
              message:
                "Official deliverable download is gated pending partner-verified settlement of professional fee invoice.",
            },
            { status: 402 }
          );
        }
      }
    }

    // 1. Check Postgres DOCUMENT_BLOB store
    const blobRecs = await listWorkspaceRecords<{ documentId: string; base64: string }>(
      firmId,
      "DOCUMENT_BLOB",
      doc.entity_id
    );
    const matchedBlob = blobRecs.find((b) => b.payload?.documentId === doc.id);
    if (matchedBlob?.payload?.base64) {
      const buf = Buffer.from(matchedBlob.payload.base64, "base64");
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
          "Content-Length": buf.length.toString(),
        },
      });
    }

    // 2. Check disk cache
    if (doc.storage_path) {
      const candidatePath = path.join(UPLOADS_DIR, firmId, doc.entity_id, path.basename(doc.storage_path));
      if (fs.existsSync(candidatePath)) {
        const fileBuffer = fs.readFileSync(candidatePath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
            "Content-Length": fileBuffer.length.toString(),
          },
        });
      }
    }

    // 3. Fallback generated statutory summary PDF (e.g. system-generated filing receipt)
    const firmLabel = doc.firm_name || DEFAULT_FIRM_BRANDING.firmName;
    const frnLabel = doc.frn || DEFAULT_FIRM_BRANDING.frn;
    const pdfTextContent = [
      "%PDF-1.4",
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
      "4 0 obj << /Length 580 >> stream",
      "BT",
      "/F1 16 Tf",
      "50 740 Td",
      `(${firmLabel} - Statutory Deliverable) Tj`,
      "/F1 10 Tf",
      "0 -24 Td",
      `(ICAI FRN: ${frnLabel} | Practice Management Vault) Tj`,
      "0 -20 Td",
      `(Entity Name: ${doc.entity_name}) Tj`,
      "0 -16 Td",
      `(Document Category: ${doc.category}) Tj`,
      "0 -16 Td",
      `(Document Title: ${doc.file_name}) Tj`,
      "0 -16 Td",
      `(Financial Year: ${doc.financial_year || "FY 2026-27"}) Tj`,
      "0 -16 Td",
      `(Uploaded Date: ${new Date(doc.created_at).toLocaleDateString("en-IN")}) Tj`,
      "0 -16 Td",
      `(Review Status: ${isDraftRequest ? "DRAFT_WATERMARKED" : doc.review_status}) Tj`,
      "0 -24 Td",
      isDraftRequest
        ? "(*** DRAFT WATERMARK - FOR DISCUSSION ONLY ***) Tj"
        : `(Verified in ${firmLabel} Compliance Vault.) Tj`,
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
      "0000000885 00000 n ",
      "trailer << /Size 6 /Root 1 0 R >>",
      "startxref",
      "954",
      "%%EOF",
    ].join("\n");

    const buffer = Buffer.from(pdfTextContent, "utf-8");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Document download API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
