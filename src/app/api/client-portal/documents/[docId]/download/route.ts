import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const BUCKET = "firm-documents";

export async function GET(_request: Request, context: { params: Promise<{ docId: string }> }) {
  try {
    const { docId } = await context.params;
    const supabase = createClient(await cookies());
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role,is_active")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) return NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 });
    if (!profile?.is_active || !["CLIENT_PROMOTER", "CLIENT_ACCOUNTANT"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Client portal access is required." }, { status: 403 });
    }

    // The document query is protected by documents_scoped_read, which checks
    // the authenticated user's explicit entity assignment.
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("storage_path,file_name")
      .eq("id", docId)
      .maybeSingle();
    if (documentError) return NextResponse.json({ success: false, error: "The document could not be retrieved." }, { status: 503 });
    if (!document) return NextResponse.json({ success: false, error: "The document was not found for an entity assigned to this account." }, { status: 404 });

    const { error: auditError } = await supabase.rpc("record_client_document_download", { p_document_id: docId });
    if (auditError) {
      return NextResponse.json({ success: false, error: "Document access could not be recorded. Try again shortly." }, { status: 503 });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(document.storage_path, 60, { download: document.file_name });
    if (error || !data?.signedUrl) {
      return NextResponse.json({ success: false, error: "The file could not be prepared for secure download." }, { status: 503 });
    }
    return NextResponse.json(
      { success: true, url: data.signedUrl, expiresInSeconds: 60 },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ success: false, error: "The file could not be prepared for secure download." }, { status: 503 });
  }
}
