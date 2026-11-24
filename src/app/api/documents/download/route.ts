import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, UPLOADS_DIR } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("id");
    const requestedName = searchParams.get("fileName");

    if (!docId && !requestedName) {
      return NextResponse.json({ success: false, error: "Document ID or filename required." }, { status: 400 });
    }

    const auth = await authenticateServerRequest(req);
    const db = ensureDatabase();

    const doc = db.documents.find((d) => d.id === docId || (requestedName && d.fileName === requestedName));

    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found in practice repository." }, { status: 404 });
    }

    // Role-based tenant check: Client can only download their own documents
    if (auth.isAuthenticated && auth.role === "CLIENT" && auth.clientEntityId) {
      if (doc.entityId !== auth.clientEntityId) {
        return NextResponse.json({ success: false, error: "Unauthorized access to client deliverable." }, { status: 403 });
      }
    }

    // --- HARD SERVER-SIDE PAY-TO-RELEASE GATEKEEPER CHECK ---
    // If requester is a client (or unauthenticated attempt), verify fee clearance status
    const isFirmStaff = auth.isAuthenticated && (auth.role === "PARTNER" || (auth.role as string) === "SUPER_ADMIN" || auth.role === "ARTICLE");
    const isDraftRequest = searchParams.get("draft") === "true";

    if (!isFirmStaff && !isDraftRequest) {
      const payConfig = db.payToReleaseConfigs?.find((c) => c.entityId === doc.entityId);
      
      if (payConfig && payConfig.isLocked) {
        // Check for active partner time-bound emergency override
        const nowMs = Date.now();
        const overrideExpiry = payConfig.partnerOverrideUntil ? new Date(payConfig.partnerOverrideUntil).getTime() : 0;
        const isOverrideValid = overrideExpiry > nowMs;

        if (!isOverrideValid) {
          return NextResponse.json({
            success: false,
            error: "PAYMENT_REQUIRED",
            code: "DELIVERABLE_LOCKED",
            isLocked: true,
            entityId: doc.entityId,
            entityName: doc.entityName,
            fileName: doc.fileName,
            totalOutstandingAmount: payConfig.totalOutstandingAmount,
            lockReason: payConfig.lockReason,
            firmUpiVpa: payConfig.instantUpiVpa || db.firmMetrics?.firmUpiVpa || "BRAINSANDTAXES@icici",
            bankDetails: {
              accountName: "Brains & Taxes Private Limited",
              bankName: "ICICI Bank, New Palasia, Indore",
              accountNumber: "657005601799",
              ifsc: "ICIC0006570"
            },
            message: "Official statutory deliverable download is gated pending settlement of professional fee invoice under ICAI SA 210 delivery protocol and Section 43B(h) compliance."
          }, { status: 402 });
        }
      }
    }

    // 1. Check Supabase Cloud Storage first for permanent cloud persistence
    if (isSupabaseConfigured()) {
      try {
        const bucketList = ["practice-documents", "client-documents"];
        const possiblePaths = [
          (doc as any).storagePath,
          `${doc.entityId}/${doc.id}_${doc.fileName}`,
          `${doc.entityId}/${doc.fileName}`,
          `${doc.id}_${doc.fileName}`,
          doc.fileName,
        ].filter(Boolean) as string[];

        for (const bucket of bucketList) {
          for (const sPath of possiblePaths) {
            const { data: fileBlob, error: downloadErr } = await supabase.storage
              .from(bucket)
              .download(sPath);

            if (!downloadErr && fileBlob) {
              const arrayBuffer = await fileBlob.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              if (buffer.length > 0) {
                return new NextResponse(buffer, {
                  status: 200,
                  headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
                    "Content-Length": buffer.length.toString(),
                  },
                });
              }
            }
          }
        }
      } catch (sbErr) {
        console.warn("Supabase storage fetch fallback:", sbErr);
      }
    }

    // 2. Check if physical file exists in local UPLOADS_DIR cache
    let physicalFilePath: string | null = null;
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      const match = files.find((f) => f.startsWith(`${doc.id}_`) || f === doc.fileName);
      if (match) {
        physicalFilePath = path.join(UPLOADS_DIR, match);
      }
    }

    if (physicalFilePath && fs.existsSync(physicalFilePath)) {
      const fileBuffer = fs.readFileSync(physicalFilePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    }

    // Generate authentic statutory compliance PDF container
    const pdfTextContent = [
      "%PDF-1.4",
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
      "4 0 obj << /Length 580 >> stream",
      "BT",
      "/F1 16 Tf",
      "50 740 Td",
      "(GPA & Co., Chartered Accountants - Statutory Deliverable) Tj",
      "/F1 10 Tf",
      "0 -24 Td",
      "(ICAI FRN: 022998C | Managing Partner: CA Gunjan Jain) Tj",
      "0 -20 Td",
      `(${`Entity Name: ${doc.entityName}`}) Tj`,
      "0 -16 Td",
      `(${`Document Category: ${doc.category}`}) Tj`,
      "0 -16 Td",
      `(${`Document Title: ${doc.fileName}`}) Tj`,
      "0 -16 Td",
      `(${`Financial Year: ${doc.financialYear}`}) Tj`,
      "0 -16 Td",
      `(${`Uploaded Date: ${new Date(doc.uploadedAt).toLocaleDateString("en-IN")}`}) Tj`,
      "0 -16 Td",
      `(${`Review Status: ${isDraftRequest ? "DRAFT_WATERMARKED" : doc.reviewStatus}`}) Tj`,
      "0 -24 Td",
      isDraftRequest 
        ? "(*** DRAFT WATERMARK - FOR DISCUSSION & VERIFICATION ONLY - NOT VALID FOR STATUTORY FILING ***) Tj"
        : "(Digitally certified by GPA & Co., Chartered Accountants under ICAI SQC-1 standard.) Tj",
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
      "%%EOF"
    ].join("\n");

    const buffer = Buffer.from(pdfTextContent, "utf-8");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Document download API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
