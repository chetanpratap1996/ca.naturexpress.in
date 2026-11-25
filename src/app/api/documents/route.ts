import { NextRequest, NextResponse } from "next/server";
import { DocumentItem } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";
import { getAutopilotPolicy, matchAndAdvanceTasksForDocument } from "@/lib/automation/postgresAutopilot";
import { UPLOADS_DIR } from "@/lib/server/db";
import fs from "fs";
import path from "path";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_DOC_CATEGORIES = [
  "BANK_STATEMENT",
  "GST_INVOICES",
  "TAX_COMPUTATION",
  "AUDIT_REPORT",
  "NOTICE_REPLY",
  "CHALLAN",
];

function mapDocRow(doc: any, entityMap: Map<string, string>): DocumentItem {
  const bytes = Number(doc.file_size_bytes || 0);
  return {
    id: doc.id,
    entityId: doc.entity_id,
    entityName: entityMap.get(doc.entity_id) || "Client Entity",
    taskId: doc.task_id || undefined,
    category: doc.category || "BANK_STATEMENT",
    fileName: doc.file_name,
    fileSize: bytes > 0 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : "500 KB",
    storagePath: doc.storage_path || undefined,
    uploadedAt: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString(),
    financialYear: doc.financial_year || "FY 2026-27",
    uploadedBy: doc.uploaded_by_id ? "CLIENT_PWA" : "FIRM_STAFF",
    isPasswordProtected: false,
    isUnlocked: true,
    reviewStatus: doc.review_status || "PENDING_REVIEW",
    reviewNotes: doc.review_notes || undefined,
    reviewedAt: doc.reviewed_at ? new Date(doc.reviewed_at).toISOString() : undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    const [{ rows: entRows }, { rows: docRows }] = await Promise.all([
      pool.query("SELECT id, entity_name FROM public.client_entities WHERE firm_id = $1", [firmId]),
      auth.role === "CLIENT" && auth.clientEntityId && UUID_REGEX.test(auth.clientEntityId)
        ? pool.query(
            "SELECT * FROM public.documents WHERE firm_id = $1 AND entity_id = $2 ORDER BY created_at DESC",
            [firmId, auth.clientEntityId]
          )
        : pool.query("SELECT * FROM public.documents WHERE firm_id = $1 ORDER BY created_at DESC", [firmId]),
    ]);

    const entityMap = new Map<string, string>();
    for (const e of entRows) entityMap.set(e.id, e.entity_name);

    return NextResponse.json({
      success: true,
      documents: docRows.map((d: any) => mapDocRow(d, entityMap)),
    });
  } catch (err: any) {
    console.error("GET /api/documents error:", err);
    return NextResponse.json({ success: false, error: "Failed to load documents." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.user || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await req.json();

    // 1. Batch Outward Dispatcher (Firm staff only)
    if (body.batch && Array.isArray(body.batch)) {
      if (!["PARTNER", "ARTICLE", "TEAM"].includes(auth.role)) {
        return NextResponse.json(
          { success: false, error: "Staff permissions required for batch outward dispatch." },
          { status: 403 }
        );
      }

      const createdDocs: DocumentItem[] = [];
      const actorUuid = auth.user.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;

      for (let i = 0; i < body.batch.length; i++) {
        const item = body.batch[i];
        const targetEntityId = item.matchedEntityId || item.entityId;
        if (!targetEntityId || !UUID_REGEX.test(String(targetEntityId))) continue;

        const entRes = await pool.query(
          "SELECT id, entity_name FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
          [targetEntityId, firmId]
        );
        if (entRes.rows.length === 0) continue;
        const entity = entRes.rows[0];

        const rawCat = item.detectedCategory || item.category || "GST_INVOICES";
        const category = VALID_DOC_CATEGORIES.includes(rawCat) ? rawCat : "GST_INVOICES";
        const fileName = String(item.fileName || `Deliverable_${i + 1}.pdf`).slice(0, 255);
        const safeBaseName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        let fileSizeBytes = Number(item.fileSizeBytes || 256000);
        let storagePath: string | null = null;

        if (typeof item.fileContentBase64 === "string" && item.fileContentBase64.length > 0) {
          const buffer = Buffer.from(item.fileContentBase64, "base64");
          if (buffer.length > 15 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: `File ${fileName} exceeds 15 MB limit.` }, { status: 413 });
          }
          fileSizeBytes = buffer.length;
          storagePath = `${firmId}/${entity.id}/${Date.now()}_${safeBaseName}`;
          const diskDir = path.join(UPLOADS_DIR, firmId, entity.id);
          fs.mkdirSync(diskDir, { recursive: true });
          fs.writeFileSync(path.join(diskDir, path.basename(storagePath)), buffer);
        }

        const docIns = await pool.query(
          `INSERT INTO public.documents (
            firm_id, entity_id, category, file_name, file_size_bytes, storage_path, financial_year, review_status, reviewed_by_id, reviewed_at
          ) VALUES ($1, $2, $3::document_category, $4, $5, $6, $7, 'APPROVED', $8, now())
          RETURNING *`,
          [firmId, entity.id, category, fileName, fileSizeBytes, storagePath, item.detectedFy || item.financialYear || "FY 2026-27", actorUuid]
        );
        const docRow = docIns.rows[0];

        if (typeof item.fileContentBase64 === "string" && item.fileContentBase64.length > 0 && item.fileContentBase64.length <= 6_500_000) {
          await upsertWorkspaceRecord({
            firmId,
            entityId: entity.id,
            recordType: "DOCUMENT_BLOB",
            matchKey: "documentId",
            matchValue: docRow.id,
            payload: { documentId: docRow.id, base64: item.fileContentBase64, contentType: "application/pdf" },
          });
        }

        if (body.autoAdvanceTask !== false) {
          const arn = item.arnNumber || `AA${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
          await pool.query(
            `UPDATE public.compliance_tasks
             SET status = 'FILED_AND_COMPLETED', arn_number = COALESCE(arn_number, $1), filing_date = CURRENT_DATE,
                 penalty_risk = 0, accruing_daily_penalty = 0, updated_at = now()
             WHERE firm_id = $2 AND entity_id = $3 AND status <> 'FILED_AND_COMPLETED'`,
            [arn, firmId, entity.id]
          );
        }

        createdDocs.push(mapDocRow(docRow, new Map([[entity.id, entity.entity_name]])));
      }

      await appendPgAuditLog({
        firmId,
        actorId: auth.user.id,
        actorName: auth.user.name,
        actorRole: auth.role,
        entityName: "Practice Outward Batch",
        action: "Batch Dispatch",
        details: `Dispatched ${createdDocs.length} tax deliverables.`,
        category: "DOCUMENT",
      });

      return NextResponse.json({ success: true, count: createdDocs.length, documents: createdDocs });
    }

    // 2. Single Document Upload
    const { entityId, category, fileName, financialYear, taskId, fileContentBase64 } = body;
    const targetEntityId = auth.role === "CLIENT" ? auth.clientEntityId : entityId;

    if (!targetEntityId || !UUID_REGEX.test(String(targetEntityId))) {
      return NextResponse.json({ success: false, error: "Valid entityId is required." }, { status: 400 });
    }
    if (auth.role === "CLIENT" && entityId && auth.clientEntityId && entityId !== auth.clientEntityId) {
      return NextResponse.json(
        { success: false, error: "You may upload documents only for your assigned entity." },
        { status: 403 }
      );
    }

    const entRes = await pool.query(
      "SELECT id, entity_name FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
      [targetEntityId, firmId]
    );
    if (entRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client entity not found." }, { status: 404 });
    }
    const entity = entRes.rows[0];

    let fileSizeBytes = 512000;
    let storagePath: string | null = null;
    const cleanFileName = String(fileName || "Uploaded_Document.pdf").slice(0, 255);
    const safeBaseName = cleanFileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    if (typeof fileContentBase64 === "string" && fileContentBase64.length > 0) {
      const estimatedBytes = Math.floor(fileContentBase64.length * 0.75);
      if (estimatedBytes > 15 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "File exceeds the 15 MB limit." }, { status: 413 });
      }
      const buffer = Buffer.from(fileContentBase64, "base64");
      fileSizeBytes = buffer.length;
      storagePath = `${firmId}/${entity.id}/${Date.now()}_${safeBaseName}`;
      const diskDir = path.join(UPLOADS_DIR, firmId, entity.id);
      fs.mkdirSync(diskDir, { recursive: true });
      fs.writeFileSync(path.join(diskDir, path.basename(storagePath)), buffer);
    }

    const docCategory = VALID_DOC_CATEGORIES.includes(category) ? category : "BANK_STATEMENT";
    const taskUuid = taskId && UUID_REGEX.test(String(taskId)) ? taskId : null;
    const actorUuid = auth.user.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;
    const reviewStatus = auth.role === "PARTNER" ? "APPROVED" : "PENDING_REVIEW";

    const docIns = await pool.query(
      `INSERT INTO public.documents (
        firm_id, entity_id, task_id, category, file_name, file_size_bytes, storage_path, financial_year, uploaded_by_id, review_status, reviewed_by_id, reviewed_at
      ) VALUES ($1, $2, $3, $4::document_category, $5, $6, $7, $8, $9, $10::doc_review_status, $11, $12)
      RETURNING *`,
      [
        firmId,
        entity.id,
        taskUuid,
        docCategory,
        cleanFileName,
        fileSizeBytes,
        storagePath,
        financialYear || "FY 2026-27",
        auth.role === "CLIENT" ? actorUuid : null,
        reviewStatus,
        auth.role === "PARTNER" ? actorUuid : null,
        auth.role === "PARTNER" ? new Date().toISOString() : null,
      ]
    );
    const docRow = docIns.rows[0];

    if (typeof fileContentBase64 === "string" && fileContentBase64.length > 0 && fileContentBase64.length <= 6_500_000) {
      await upsertWorkspaceRecord({
        firmId,
        entityId: entity.id,
        recordType: "DOCUMENT_BLOB",
        matchKey: "documentId",
        matchValue: docRow.id,
        payload: { documentId: docRow.id, base64: fileContentBase64, contentType: "application/pdf" },
      });
    }

    const policy = await getAutopilotPolicy(firmId).catch(() => null);
    if (policy?.enabled && policy.autoAdvanceDocs) {
      await matchAndAdvanceTasksForDocument({
        firmId,
        entityId: entity.id,
        docCategory,
        docId: docRow.id,
        docFileName: cleanFileName,
        explicitTaskId: taskUuid,
      }).catch(() => null);
    } else if (taskUuid) {
      await pool.query(
        `UPDATE public.compliance_tasks
         SET status = CASE WHEN status = 'DOCUMENTS_AWAITED' THEN 'IN_PREPARATION'::workflow_status ELSE status END,
             updated_at = now()
         WHERE id = $1 AND firm_id = $2 AND entity_id = $3`,
        [taskUuid, firmId, entity.id]
      );
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: auth.role,
      entityId: entity.id,
      entityName: entity.entity_name,
      action: "Document Uploaded",
      details: `Uploaded ${cleanFileName} (${docCategory}).`,
      category: "DOCUMENT",
    });

    await upsertWorkspaceRecord({
      firmId,
      entityId: entity.id,
      recordType: "NOTIFICATION",
      payload: {
        id: `NOTIF-DOC-${Date.now()}`,
        title: `Document Uploaded: ${cleanFileName}`,
        message: `${entity.entity_name} uploaded ${cleanFileName} (${docCategory}).`,
        category: "DOCUMENT",
        priority: "NORMAL",
        recipientRole: auth.role === "CLIENT" ? "ARTICLE" : "CLIENT",
        recipientEntityId: entity.id,
        targetTab: auth.role === "CLIENT" ? "workbench" : "vault",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      document: mapDocRow(docRow, new Map([[entity.id, entity.entity_name]])),
    });
  } catch (error: any) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to upload document." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only firm staff can review documents." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { docId, reviewStatus, reviewNotes } = body;
    if (!docId || !UUID_REGEX.test(String(docId))) {
      return NextResponse.json({ success: false, error: "Valid docId is required." }, { status: 400 });
    }
    if (!["PENDING_REVIEW", "APPROVED", "CORRECTION_NEEDED"].includes(reviewStatus)) {
      return NextResponse.json({ success: false, error: "Invalid reviewStatus." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const actorUuid = auth.user?.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;

    const upd = await pool.query(
      `UPDATE public.documents
       SET review_status = $1::doc_review_status, review_notes = $2, reviewed_by_id = $3, reviewed_at = now()
       WHERE id = $4 AND firm_id = $5
       RETURNING *`,
      [reviewStatus, reviewNotes || null, actorUuid, docId, firmId]
    );
    if (upd.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Document not found." }, { status: 404 });
    }

    const row = upd.rows[0];
    const entRes = await pool.query("SELECT entity_name FROM public.client_entities WHERE id = $1 LIMIT 1", [row.entity_id]);
    const entityName = entRes.rows[0]?.entity_name || "Client Entity";

    if (reviewStatus === "APPROVED") {
      const policy = await getAutopilotPolicy(firmId).catch(() => null);
      if (policy?.enabled && policy.autoAdvanceDocs) {
        await matchAndAdvanceTasksForDocument({
          firmId,
          entityId: row.entity_id,
          docCategory: row.category,
          docId: row.id,
          docFileName: row.file_name,
          explicitTaskId: row.task_id,
        }).catch(() => null);
      }
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Staff",
      actorRole: auth.role || "ARTICLE",
      entityId: row.entity_id,
      entityName,
      action: "Document Review",
      details: `Document ${row.file_name} marked as ${reviewStatus}.`,
      category: "DOCUMENT",
    });

    return NextResponse.json({
      success: true,
      document: mapDocRow(row, new Map([[row.entity_id, entityName]])),
    });
  } catch (error: any) {
    console.error("PATCH /api/documents error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
