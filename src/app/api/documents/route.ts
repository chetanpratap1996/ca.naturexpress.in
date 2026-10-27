import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ensureDatabase, logAuditEvent, saveDatabase, UPLOADS_DIR } from "@/lib/server/db";
import { createClient } from "@/utils/supabase/server";
import { DocumentItem } from "@/lib/types";
import { ALLOWED_DOCUMENT_MIME_TYPES, hasExpectedDocumentSignature, MAX_DOCUMENT_FILE_SIZE } from "@/lib/documents/fileValidation";

const BUCKET = "firm-documents";
const DOCUMENT_CATEGORIES: DocumentItem["category"][] = [
  "BANK_STATEMENT", "GST_INVOICES", "TAX_COMPUTATION", "AUDIT_REPORT", "NOTICE_REPLY", "CHALLAN",
];

function safeFileName(name: string) {
  return name.normalize("NFKC").replace(/[\\/\0\r\n]/g, "_").trim().slice(0, 180) || "document";
}

function humanFileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function GET() {
  try {
    const db = await ensureDatabase();
    return NextResponse.json({ success: true, documents: db.documents });
  } catch {
    return NextResponse.json({ success: false, error: "Firm documents are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let uploadedPath: string | undefined;
  let localFilePath: string | undefined;
  let supabase: ReturnType<typeof createClient> | undefined;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const entityId = form.get("entityId");
    const category = form.get("category");
    const financialYear = form.get("financialYear");
    const taskId = form.get("taskId");

    if (!(file instanceof File) || typeof entityId !== "string" || typeof category !== "string" || typeof financialYear !== "string") {
      return NextResponse.json({ success: false, error: "Choose a file, client entity, category, and financial year." }, { status: 400 });
    }
    if (!file.size || file.size > MAX_DOCUMENT_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "Files must be between 1 byte and 20 MB." }, { status: 413 });
    }
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: "This file type is not supported. Upload a PDF, image, spreadsheet, document, CSV, or text file." }, { status: 415 });
    }
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedDocumentSignature(file.type, fileBytes)) {
      return NextResponse.json({ success: false, error: "The file content does not match its declared type, or it is not a supported UTF-8 document." }, { status: 415 });
    }
    if (!DOCUMENT_CATEGORIES.includes(category as DocumentItem["category"])) {
      return NextResponse.json({ success: false, error: "Choose a valid document category." }, { status: 400 });
    }
    if (!financialYear.trim() || financialYear.trim().length > 20) {
      return NextResponse.json({ success: false, error: "Enter a valid financial year." }, { status: 400 });
    }

    const db = await ensureDatabase();
    const entity = db.clients.find((client) => client.id === entityId);
    if (!entity) return NextResponse.json({ success: false, error: "The selected client entity was not found in this firm." }, { status: 404 });
    const linkedTask = typeof taskId === "string" && taskId ? db.tasks.find((task) => task.id === taskId) : undefined;
    if (taskId && (!linkedTask || linkedTask.entityId !== entity.id)) {
      return NextResponse.json({ success: false, error: "The selected task does not belong to this client entity." }, { status: 400 });
    }

    const docId = randomUUID();
    const fileName = safeFileName(file.name);
    let storagePath: string;
    if (process.env.NODE_ENV === "production") {
      const requestHeaders = await headers();
      const firmId = requestHeaders.get("x-workspace-firm-id");
      const userRole = requestHeaders.get("x-workspace-user-role");
      if (!firmId || !["SUPER_ADMIN", "PARTNER"].includes(userRole || "")) {
        return NextResponse.json({ success: false, error: "Partner authorization is required to store firm documents." }, { status: 403 });
      }
      storagePath = `${firmId}/${entity.id}/${docId}/${randomUUID()}`;
      supabase = createClient(await cookies());
      const { error: storageError } = await supabase.storage.from(BUCKET).upload(
        storagePath,
        fileBytes,
        { contentType: file.type, upsert: false, cacheControl: "3600" },
      );
      if (storageError) throw new Error("Document storage failed.");
      uploadedPath = storagePath;
    } else {
      await mkdir(UPLOADS_DIR, { recursive: true });
      const localFileName = `${docId}-${randomUUID()}`;
      localFilePath = path.join(UPLOADS_DIR, localFileName);
      await writeFile(localFilePath, fileBytes, { flag: "wx" });
      storagePath = `local:${localFileName}`;
    }

    const newDocument: DocumentItem = {
      id: docId,
      entityId: entity.id,
      entityName: entity.name,
      category: category as DocumentItem["category"],
      fileName,
      fileSize: humanFileSize(file.size),
      sizeBytes: file.size,
      mimeType: file.type,
      storagePath,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "FIRM_STAFF",
      financialYear: financialYear.trim(),
      taskId: linkedTask?.id,
      reviewStatus: "PENDING_REVIEW",
    };
    db.documents.unshift(newDocument);
    await logAuditEvent(
      "Firm user",
      "PARTNER",
      entity.name,
      "Document Uploaded",
      process.env.NODE_ENV === "production"
        ? `Stored ${fileName} (${category}) in the private firm document bucket.`
        : `Stored ${fileName} (${category}) in local development storage.`,
      "DOCUMENT",
      db,
    );
    await saveDatabase(db);
    return NextResponse.json({ success: true, document: newDocument }, { status: 201 });
  } catch {
    if (uploadedPath && supabase) {
      await supabase.storage.from(BUCKET).remove([uploadedPath]).catch(() => undefined);
    }
    if (localFilePath) await unlink(localFilePath).catch(() => undefined);
    return NextResponse.json({ success: false, error: "The document could not be stored. Refresh and try again." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const validReviewStatuses: DocumentItem["reviewStatus"][] = ["PENDING_REVIEW", "APPROVED", "CORRECTION_NEEDED"];
    if (typeof body.docId !== "string" || !validReviewStatuses.includes(body.reviewStatus)) {
      return NextResponse.json({ success: false, error: "Choose a document and a valid review status." }, { status: 400 });
    }
    if (body.reviewNotes !== undefined && (typeof body.reviewNotes !== "string" || body.reviewNotes.length > 4000)) {
      return NextResponse.json({ success: false, error: "Review notes must be 4,000 characters or fewer." }, { status: 400 });
    }

    const db = await ensureDatabase();
    const doc = db.documents.find((item) => item.id === body.docId);
    if (!doc) return NextResponse.json({ success: false, error: "Document not found." }, { status: 404 });
    doc.reviewStatus = body.reviewStatus;
    doc.reviewedBy = "Firm user";
    doc.reviewedAt = new Date().toISOString();
    if (body.reviewNotes !== undefined) doc.reviewNotes = body.reviewNotes.trim();

    await logAuditEvent(
      "Firm user",
      "PARTNER",
      doc.entityName,
      "Document Review",
      `Document ${doc.fileName} marked ${doc.reviewStatus}.`,
      "DOCUMENT",
      db,
    );
    await saveDatabase(db);
    return NextResponse.json({ success: true, document: doc });
  } catch {
    return NextResponse.json({ success: false, error: "Document review could not be saved. Refresh and try again." }, { status: 503 });
  }
}
