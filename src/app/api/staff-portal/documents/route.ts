import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ALLOWED_DOCUMENT_MIME_TYPES, hasExpectedDocumentSignature, MAX_DOCUMENT_FILE_SIZE } from "@/lib/documents/fileValidation";

const BUCKET = "firm-documents";
const CATEGORIES = ["BANK_STATEMENT", "GST_INVOICES", "TAX_COMPUTATION", "AUDIT_REPORT", "NOTICE_REPLY", "CHALLAN"] as const;
function safeFileName(name: string) { return name.normalize("NFKC").replace(/[\\/\0\r\n]/g, "_").trim().slice(0, 180) || "document"; }

export async function POST(request: Request) {
  let supabase: ReturnType<typeof createClient> | undefined;
  let storagePath: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const entityId = form.get("entityId");
    const category = form.get("category");
    const financialYear = form.get("financialYear");
    const taskId = form.get("taskId");
    if (!(file instanceof File) || typeof entityId !== "string" || typeof category !== "string" || typeof financialYear !== "string") {
      return NextResponse.json({ success: false, error: "Choose a file, assigned entity, category, and financial year." }, { status: 400 });
    }
    if (taskId !== null && typeof taskId !== "string") return NextResponse.json({ success: false, error: "Choose a valid task or leave it unlinked." }, { status: 400 });
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityId)
      || (typeof taskId === "string" && taskId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId))) {
      return NextResponse.json({ success: false, error: "Choose a valid assigned entity and task." }, { status: 400 });
    }
    if (!file.size || file.size > MAX_DOCUMENT_FILE_SIZE) return NextResponse.json({ success: false, error: "Files must be between 1 byte and 20 MB." }, { status: 413 });
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) return NextResponse.json({ success: false, error: "This file type is not supported." }, { status: 415 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedDocumentSignature(file.type, bytes)) return NextResponse.json({ success: false, error: "The file content does not match its declared type." }, { status: 415 });
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return NextResponse.json({ success: false, error: "Choose a valid document category." }, { status: 400 });
    if (!financialYear.trim() || financialYear.trim().length > 20) return NextResponse.json({ success: false, error: "Enter a valid financial year." }, { status: 400 });

    supabase = createClient(await cookies());
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase.from("users").select("id,firm_id,role,is_active").eq("id", auth.user.id).maybeSingle();
    if (profileError) return NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 });
    if (!profile?.is_active || !profile.firm_id || !["PAID_CA_MANAGER", "ARTICLE_TRAINEE"].includes(profile.role)) return NextResponse.json({ success: false, error: "Active staff access is required." }, { status: 403 });
    const documentId = randomUUID();
    const fileName = safeFileName(file.name);
    storagePath = `${profile.firm_id}/${entityId}/${auth.user.id}/${documentId}/${randomUUID()}`;
    const { error: storageError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, { contentType: file.type, upsert: false, cacheControl: "3600" });
    if (storageError) return NextResponse.json({ success: false, error: "The private file could not be stored." }, { status: 503 });
    const { error: recordError } = await supabase.rpc("record_staff_document_upload", {
      p_document_id: documentId,
      p_entity_id: entityId,
      p_task_id: typeof taskId === "string" && taskId ? taskId : null,
      p_category: category,
      p_file_name: fileName,
      p_file_size_bytes: file.size,
      p_storage_path: storagePath,
      p_mime_type: file.type,
      p_financial_year: financialYear.trim(),
    });
    if (recordError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ success: false, error: "The file could not be attached to this assigned entity. No document record was saved." }, { status: 403 });
    }
    return NextResponse.json({ success: true, documentId }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    if (storagePath && supabase) await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => undefined);
    return NextResponse.json({ success: false, error: "The document could not be stored. Refresh and try again." }, { status: 503 });
  }
}
