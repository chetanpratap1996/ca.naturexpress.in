import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { DocumentItem } from "@/lib/types";
import { ALLOWED_DOCUMENT_MIME_TYPES, hasExpectedDocumentSignature, MAX_DOCUMENT_FILE_SIZE } from "@/lib/documents/fileValidation";

const BUCKET = "firm-documents";
const CLIENT_UPLOAD_CATEGORIES: DocumentItem["category"][] = ["BANK_STATEMENT", "GST_INVOICES", "TAX_COMPUTATION", "NOTICE_REPLY", "CHALLAN"];

function safeFileName(name: string) {
  return name.normalize("NFKC").replace(/[\\/\0\r\n]/g, "_").trim().slice(0, 180) || "document";
}

function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL;
  const expectedOrigin = configuredSite ? new URL(configuredSite).origin : new URL(request.url).origin;
  if (origin !== expectedOrigin) return NextResponse.json({ success: false, error: "Request origin could not be verified." }, { status: 403 });

  let supabase: ReturnType<typeof createClient> | undefined;
  let uploadedPath: string | undefined;
  let insertedDocumentId: string | undefined;
  try {
    supabase = createClient(await cookies());
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id,firm_id,role,is_active")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) return NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 });
    if (!profile?.is_active || !profile.firm_id || !["CLIENT_PROMOTER", "CLIENT_ACCOUNTANT"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Client portal access is required." }, { status: 403 });
    }

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
    if (!CLIENT_UPLOAD_CATEGORIES.includes(category as DocumentItem["category"])) {
      return NextResponse.json({ success: false, error: "Choose a document category available in the client portal." }, { status: 400 });
    }
    if (!financialYear.trim() || financialYear.trim().length > 20) {
      return NextResponse.json({ success: false, error: "Enter a valid financial year." }, { status: 400 });
    }
    if (taskId !== null && (typeof taskId !== "string" || !taskId.trim())) {
      return NextResponse.json({ success: false, error: "Choose a valid filing or request." }, { status: 400 });
    }

    const { data: entity, error: entityError } = await supabase
      .from("client_entities")
      .select("id")
      .eq("id", entityId)
      .eq("firm_id", profile.firm_id)
      .maybeSingle();
    if (entityError) return NextResponse.json({ success: false, error: "Client entity access could not be verified." }, { status: 503 });
    if (!entity) return NextResponse.json({ success: false, error: "This entity is not assigned to your client portal account." }, { status: 403 });

    if (typeof taskId === "string") {
      const { data: task, error: taskError } = await supabase
        .from("compliance_tasks")
        .select("id")
        .eq("id", taskId)
        .eq("entity_id", entity.id)
        .eq("firm_id", profile.firm_id)
        .maybeSingle();
      if (taskError) return NextResponse.json({ success: false, error: "The filing request could not be verified." }, { status: 503 });
      if (!task) return NextResponse.json({ success: false, error: "That filing is not available for this client entity." }, { status: 403 });
    }

    const documentId = randomUUID();
    const originalFileName = safeFileName(file.name);
    const storagePath = `${profile.firm_id}/${entity.id}/${profile.id}/${documentId}`;
    const { error: storageError } = await supabase.storage.from(BUCKET).upload(storagePath, fileBytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });
    if (storageError) throw new Error("Private document storage is unavailable.");
    uploadedPath = storagePath;

    const { error: insertError } = await supabase.from("documents").insert({
      id: documentId,
      firm_id: profile.firm_id,
      entity_id: entity.id,
      category,
      task_id: typeof taskId === "string" ? taskId : null,
      file_name: originalFileName,
      file_size_bytes: file.size,
      storage_path: storagePath,
      mime_type: file.type,
      financial_year: financialYear.trim(),
      uploaded_by_id: profile.id,
      review_status: "PENDING_REVIEW",
    });
    if (insertError) throw new Error("The document record could not be saved.");
    insertedDocumentId = documentId;

    const { error: auditError } = await supabase.rpc("record_client_document_upload", { p_document_id: documentId });
    if (auditError) throw new Error("The upload could not be recorded in the security audit trail.");

    const document: DocumentItem = {
      id: documentId,
      entityId: entity.id,
      entityName: "Assigned client entity",
      category: category as DocumentItem["category"],
      fileName: originalFileName,
      fileSize: fileSize(file.size),
      sizeBytes: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "CLIENT_PWA",
      financialYear: financialYear.trim(),
      taskId: typeof taskId === "string" ? taskId : undefined,
      reviewStatus: "PENDING_REVIEW",
    };
    return NextResponse.json({ success: true, document }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    if (insertedDocumentId && supabase) await supabase.from("documents").delete().eq("id", insertedDocumentId);
    if (uploadedPath && supabase) await supabase.storage.from(BUCKET).remove([uploadedPath]);
    return NextResponse.json({ success: false, error: "The document could not be stored. Refresh and try again." }, { status: 503 });
  }
}
