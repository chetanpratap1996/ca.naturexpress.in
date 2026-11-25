import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, listWorkspaceRecords } from "@/lib/server/pgHelpers";
import { UPLOADS_DIR } from "@/lib/server/db";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId") || "";
    const documentId = searchParams.get("documentId") || "";

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    if (documentId) {
      const { rows } = await pool.query(
        "SELECT id, entity_id, file_name, storage_path FROM public.documents WHERE id = $1 AND firm_id = $2 LIMIT 1",
        [documentId, firmId]
      );
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: "Document not found." }, { status: 404 });
      }
      const doc = rows[0];
      const blobs = await listWorkspaceRecords<any>(firmId, "DOCUMENT_BLOB", doc.entity_id);
      const blob = blobs.find((b) => b.payload?.documentId === documentId)?.payload;
      let base64 = blob?.base64 || "";

      if (!base64 && doc.storage_path) {
        const diskPath = path.join(UPLOADS_DIR, doc.storage_path);
        if (fs.existsSync(diskPath)) {
          base64 = fs.readFileSync(diskPath).toString("base64");
        }
      }

      if (!base64) {
        return NextResponse.json({ success: false, error: "Document binary content not available." }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        fileName: doc.file_name,
        base64,
      });
    }

    const { rows } = entityId
      ? await pool.query(
          `SELECT id, entity_id, category, file_name, financial_year, created_at
           FROM public.documents
           WHERE firm_id = $1 AND entity_id = $2
             AND (LOWER(file_name) LIKE '%.json' OR LOWER(file_name) LIKE '%.csv' OR LOWER(file_name) LIKE '%.xlsx' OR LOWER(file_name) LIKE '%.xls' OR LOWER(file_name) LIKE '%.xml' OR LOWER(file_name) LIKE '%.tsv')
           ORDER BY created_at DESC LIMIT 30`,
          [firmId, entityId]
        )
      : await pool.query(
          `SELECT id, entity_id, category, file_name, financial_year, created_at
           FROM public.documents
           WHERE firm_id = $1
             AND (LOWER(file_name) LIKE '%.json' OR LOWER(file_name) LIKE '%.csv' OR LOWER(file_name) LIKE '%.xlsx' OR LOWER(file_name) LIKE '%.xls' OR LOWER(file_name) LIKE '%.xml' OR LOWER(file_name) LIKE '%.tsv')
           ORDER BY created_at DESC LIMIT 30`,
          [firmId]
        );

    return NextResponse.json({ success: true, documents: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to list client GST docs" }, { status: 500 });
  }
}
