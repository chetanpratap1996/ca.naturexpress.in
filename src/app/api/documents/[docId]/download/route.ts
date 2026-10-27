import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureDatabase, logAuditEvent, saveDatabase, UPLOADS_DIR } from "@/lib/server/db";
import { createClient } from "@/utils/supabase/server";

const BUCKET = "firm-documents";

export async function GET(_request: Request, context: { params: Promise<{ docId: string }> }) {
  try {
    const { docId } = await context.params;
    const db = await ensureDatabase();
    const document = db.documents.find((item) => item.id === docId);
    if (!document?.storagePath) {
      return NextResponse.json({ success: false, error: "The original file is not available in secure storage." }, { status: 404 });
    }

    if (process.env.NODE_ENV !== "production" && document.storagePath.startsWith("local:")) {
      const localFileName = document.storagePath.slice("local:".length);
      if (!/^[a-f0-9-]{73}$/i.test(localFileName)) {
        return NextResponse.json({ success: false, error: "The local file reference is invalid." }, { status: 404 });
      }
      const root = path.resolve(UPLOADS_DIR);
      const filePath = path.resolve(root, localFileName);
      if (!filePath.startsWith(`${root}${path.sep}`)) {
        return NextResponse.json({ success: false, error: "The local file reference is invalid." }, { status: 404 });
      }
      try {
        const bytes = await readFile(filePath);
        await logAuditEvent("Firm user", "PARTNER", document.entityName, "Document Downloaded", `Downloaded ${document.fileName} in local development.`, "DOCUMENT", db);
        await saveDatabase(db);
        return new Response(bytes, {
          headers: {
            "Content-Type": document.mimeType || "application/octet-stream",
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch {
        return NextResponse.json({ success: false, error: "The local file is not available." }, { status: 404 });
      }
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(document.storagePath, 60, { download: document.fileName });
    if (error || !data?.signedUrl) {
      return NextResponse.json({ success: false, error: "The file could not be prepared for secure download." }, { status: 503 });
    }
    await logAuditEvent(
      "Firm user",
      "PARTNER",
      document.entityName,
      "Document Download Link Issued",
      `Issued a private, 60-second download link for ${document.fileName}.`,
      "DOCUMENT",
      db,
    );
    await saveDatabase(db);
    return NextResponse.json(
      { success: true, url: data.signedUrl, expiresInSeconds: 60 },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ success: false, error: "The file could not be prepared for secure download." }, { status: 503 });
  }
}
