import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { authenticateServerRequest, createRequestSupabaseClient, writeServerAuditLog } from "@/lib/auth/serverAuth";
import { ensureDatabase, saveDatabase, logAuditEvent, UPLOADS_DIR } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { DocumentItem } from "@/lib/types";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const auth = await authenticateServerRequest(request);
  if (!auth.isAuthenticated || !auth.user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production") {
    const client = createRequestSupabaseClient(request);
    if (!client || !auth.firmId) return NextResponse.json({ success: false, error: "Supabase session unavailable." }, { status: 503 });
    const [{ data: rows, error }, { data: entities }] = await Promise.all([
      client.from("documents").select("*").eq("firm_id", auth.firmId),
      client.from("client_entities").select("id, entity_name").eq("firm_id", auth.firmId),
    ]);
    if (error) return NextResponse.json({ success: false, error: "Could not load documents from durable storage." }, { status: 503 });
    const documents: DocumentItem[] = (rows || []).map((row: any) => ({
      id: row.id, entityId: row.entity_id, entityName: entities?.find((entity: any) => entity.id === row.entity_id)?.entity_name || "Client Entity",
      category: row.category, fileName: row.file_name,
      fileSize: `${(Number(row.file_size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB`,
      uploadedAt: row.created_at, uploadedBy: row.uploaded_by_id === auth.user?.id ? (auth.role === "CLIENT" ? "CLIENT_PWA" : "FIRM_STAFF") : "FIRM_STAFF",
      isPasswordProtected: false, isUnlocked: true, financialYear: row.financial_year, taskId: row.task_id || undefined,
      reviewStatus: row.review_status, reviewNotes: row.review_notes || undefined,
      reviewedBy: row.reviewed_by_id || undefined, reviewedAt: row.reviewed_at || undefined,
    }));
    return NextResponse.json({ success: true, documents });
  }
  const db = ensureDatabase();
  const documents = auth.role === "CLIENT"
    ? db.documents.filter((item) => auth.clientEntityId
      ? item.entityId === auth.clientEntityId
      : item.entityId === "" /* no implicit group-wide document access */)
    : db.documents;
  return NextResponse.json({ success: true, documents });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (process.env.NODE_ENV === "production") {
      const auth = await authenticateServerRequest(req);
      const client = createRequestSupabaseClient(req);
      if (!auth.isAuthenticated || !auth.user || !auth.firmId || !client) return NextResponse.json({ success: false, error: "Authenticated Supabase session required." }, { status: 401 });
      if (body.batch && Array.isArray(body.batch)) {
        return NextResponse.json({ success: false, error: "Batch dispatch requires uploaded source files. Metadata-only records are disabled in production." }, { status: 400 });
      }
      const { entityId, category, fileName, financialYear, taskId, storagePath, fileContentBase64 } = body;
      if (!entityId || !fileName || !financialYear || (!storagePath && !fileContentBase64)) {
        return NextResponse.json({ success: false, error: "Entity, file, financial year, and file contents are required." }, { status: 400 });
      }
      const entityQuery = await client.from("client_entities").select("id, entity_name").eq("id", entityId).eq("firm_id", auth.firmId).maybeSingle();
      if (!entityQuery.data) return NextResponse.json({ success: false, error: "Entity is not accessible to this account." }, { status: 404 });
      if (auth.role === "CLIENT" && auth.clientEntityId !== entityId) return NextResponse.json({ success: false, error: "You can upload only to your assigned legal entity." }, { status: 403 });
      const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150);
      let fileSizeBytes = 0;
      let finalStoragePath = String(storagePath || "");
      if (storagePath) {
        if (!finalStoragePath.startsWith(`${auth.firmId}/${entityId}/`)) {
          return NextResponse.json({ success: false, error: "The document storage path is outside the assigned entity." }, { status: 403 });
        }
        const { data: objectInfo, error: infoError } = await client.storage.from("client-documents").info(finalStoragePath);
        fileSizeBytes = Number((objectInfo as any)?.metadata?.size || (objectInfo as any)?.size || 0);
        if (infoError || !fileSizeBytes || fileSizeBytes > 10 * 1024 * 1024) {
          return NextResponse.json({ success: false, error: "Uploaded object is missing or exceeds the 10 MB limit." }, { status: 400 });
        }
      } else {
        const base64 = String(fileContentBase64).replace(/^data:[^,]+,/, "");
        const buffer = Buffer.from(base64, "base64");
        if (!buffer.length || buffer.length > 3 * 1024 * 1024) return NextResponse.json({ success: false, error: "Server-mediated upload exceeds the 3 MB limit; use the private direct-upload flow." }, { status: 413 });
        const documentId = crypto.randomUUID();
        finalStoragePath = `${auth.firmId}/${entityId}/${documentId}_${safeName}`;
        const { error: uploadError } = await client.storage.from("client-documents").upload(finalStoragePath, buffer, {
          contentType: "application/octet-stream", upsert: false,
        });
        if (uploadError) return NextResponse.json({ success: false, error: "File could not be stored in the private document vault." }, { status: 400 });
        fileSizeBytes = buffer.length;
      }
      const documentId = crypto.randomUUID();
      const insert = await client.from("documents").insert({
        id: documentId, firm_id: auth.firmId, entity_id: entityId, task_id: taskId || null,
        category: category || "BANK_STATEMENT", file_name: safeName,
        storage_path: finalStoragePath, financial_year: String(financialYear).slice(0, 20),
        uploaded_by_id: auth.user.id, review_status: "PENDING_REVIEW", file_size_bytes: fileSizeBytes,
      }).select("*").single();
      if (insert.error || !insert.data) {
        await client.storage.from("client-documents").remove([finalStoragePath]);
        return NextResponse.json({ success: false, error: "Document record could not be saved; the uploaded file was rolled back." }, { status: 400 });
      }
      const audit = await writeServerAuditLog(req, auth, {
        entityId, entityName: entityQuery.data.entity_name, action: "Document Uploaded", details: `Uploaded ${safeName}.`, category: "DOCUMENT",
      });
      if (audit.error) console.error("Audit log write failed for document upload.");
      const document: DocumentItem = {
        id: insert.data.id, entityId, entityName: entityQuery.data.entity_name, category: insert.data.category,
        fileName: insert.data.file_name, fileSize: `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: insert.data.created_at, uploadedBy: auth.role === "CLIENT" ? "CLIENT_PWA" : "FIRM_STAFF",
        isPasswordProtected: false, isUnlocked: true, financialYear: insert.data.financial_year,
        taskId: insert.data.task_id || undefined, reviewStatus: insert.data.review_status,
      };
      return NextResponse.json({ success: true, document });
    }
    const db = ensureDatabase();

    // 1. Handle Batch Outward Dispatcher
    if (body.batch && Array.isArray(body.batch)) {
      const createdDocs: DocumentItem[] = [];

      for (let i = 0; i < body.batch.length; i++) {
        const item = body.batch[i];
        const docId = `DOC-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;

        const newDoc: DocumentItem = {
          id: item.id || docId,
          entityId: item.matchedEntityId || item.entityId || "CLI-001",
          entityName: item.matchedEntityName || item.entityName || "Client Entity",
          category: item.detectedCategory || item.category || "GST_INVOICES",
          fileName: item.fileName || `Deliverable_${i + 1}.pdf`,
          fileSize: item.fileSize || `${Math.round((item.fileSizeBytes || 250000) / 1024)} KB`,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "FIRM_STAFF",
          isPasswordProtected: false,
          isUnlocked: true,
          financialYear: item.detectedFy || item.financialYear || "FY 2026-27",
          reviewStatus: "APPROVED",
          reviewedBy: "CA Gunjan Jain (Partner)",
          reviewedAt: new Date().toISOString(),
        };

        db.documents.unshift(newDoc);
        createdDocs.push(newDoc);

        // Optionally persist to Supabase
        if (isSupabaseConfigured()) {
          try {
            await supabase.from("documents").insert({
              firm_id: (await supabase.from("firms").select("id").limit(1)).data?.[0]?.id,
              entity_id: newDoc.entityId,
              category: newDoc.category,
              file_name: newDoc.fileName,
              file_size: newDoc.fileSize,
              review_status: "APPROVED",
            });
          } catch (sbErr) {
            console.warn("Supabase batch document sync warning:", sbErr);
          }
        }
      }

      await saveDatabase(db);

      await logAuditEvent(
        body.actorName || "CA Gunjan Jain",
        "PARTNER",
        "Multiple Clients",
        "Batch Deliverable Dispatch",
        `Dispatched batch of ${createdDocs.length} signed statutory documents to clients via WhatsApp / Portal.`,
        "DOCUMENT"
      );

      return NextResponse.json({ success: true, count: createdDocs.length, documents: createdDocs });
    }

    // 2. Handle Single Document Upload
    const { 
      entityId, 
      entityName, 
      category, 
      fileName, 
      fileSize, 
      financialYear, 
      taskId, 
      uploadedBy, 
      fileContentBase64,
      actorName 
    } = body;

    const docId = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (fileContentBase64) {
      const sanitizedFileName = `${docId}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(UPLOADS_DIR, sanitizedFileName);
      const buffer = Buffer.from(fileContentBase64, "base64");
      fs.writeFileSync(filePath, buffer);
    }

    const newDoc: DocumentItem = {
      id: docId,
      entityId: entityId || "CLI-000",
      entityName: entityName || "Client Entity",
      category: category || "BANK_STATEMENT",
      fileName: fileName || "Uploaded_Document.pdf",
      fileSize: fileSize || "1.5 MB",
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploadedBy || "CLIENT_PWA",
      isPasswordProtected: false,
      isUnlocked: true,
      financialYear: financialYear || "FY 2026-27",
      taskId: taskId || undefined,
      reviewStatus: "PENDING_REVIEW",
    };

    db.documents.unshift(newDoc);

    if (taskId) {
      const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        if (db.tasks[taskIndex].missingDocumentsCount > 0) {
          db.tasks[taskIndex].missingDocumentsCount -= 1;
        }
        if (db.tasks[taskIndex].status === "DOCUMENTS_AWAITED") {
          db.tasks[taskIndex].status = "IN_PREPARATION";
        }
      }
    }

    await saveDatabase(db);

    await logAuditEvent(
      actorName || "Client Signatory",
      uploadedBy === "CLIENT_PWA" ? "CLIENT" : "ARTICLE",
      newDoc.entityName,
      "Document Uploaded",
      `Uploaded ${newDoc.fileName} (${newDoc.category}) via ${newDoc.uploadedBy}`,
      "DOCUMENT"
    );

    return NextResponse.json({ success: true, document: newDoc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { docId, reviewStatus, reviewNotes, reviewedBy } = body;

    if (process.env.NODE_ENV === "production") {
      const auth = await authenticateServerRequest(req);
      const client = createRequestSupabaseClient(req);
      if (!auth.isAuthenticated || !auth.user || !auth.firmId || !client || !["PARTNER", "ARTICLE"].includes(auth.role || "")) {
        return NextResponse.json({ success: false, error: "Staff access required." }, { status: 403 });
      }
      if (!["PENDING_REVIEW", "APPROVED", "CORRECTION_NEEDED"].includes(reviewStatus)) {
        return NextResponse.json({ success: false, error: "Invalid document review status." }, { status: 400 });
      }
      const { data: row, error } = await client.from("documents").update({
        review_status: reviewStatus, review_notes: String(reviewNotes || "").slice(0, 2000) || null,
        reviewed_by_id: auth.user.id, reviewed_at: new Date().toISOString(),
      }).eq("id", docId).eq("firm_id", auth.firmId).select("*").single();
      if (error || !row) return NextResponse.json({ success: false, error: "Document review update could not be saved." }, { status: 400 });
      const { data: entity } = await client.from("client_entities").select("entity_name").eq("id", row.entity_id).maybeSingle();
      const audit = await writeServerAuditLog(req, auth, {
        entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", action: "Document Reviewed", details: `Marked ${row.file_name} as ${row.review_status}.`, category: "DOCUMENT",
      });
      if (audit.error) console.error("Audit log write failed for document review.");
      const document: DocumentItem = {
        id: row.id, entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", category: row.category,
        fileName: row.file_name, fileSize: `${(Number(row.file_size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: row.created_at, uploadedBy: "CLIENT_PWA", isPasswordProtected: false, isUnlocked: true,
        financialYear: row.financial_year, taskId: row.task_id || undefined, reviewStatus: row.review_status,
        reviewNotes: row.review_notes || undefined, reviewedBy: auth.user.name, reviewedAt: row.reviewed_at,
      };
      return NextResponse.json({ success: true, document });
    }

    const db = ensureDatabase();
    const docIndex = db.documents.findIndex((d) => d.id === docId);
    if (docIndex === -1) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    db.documents[docIndex].reviewStatus = reviewStatus;
    db.documents[docIndex].reviewedBy = reviewedBy || "Kriti Jain (Article)";
    db.documents[docIndex].reviewedAt = new Date().toISOString();
    if (reviewNotes) db.documents[docIndex].reviewNotes = reviewNotes;

    await saveDatabase(db);

    await logAuditEvent(
      reviewedBy || "Kriti Jain",
      "ARTICLE",
      db.documents[docIndex].entityName,
      "Document Review",
      `Document ${db.documents[docIndex].fileName} marked as ${reviewStatus}`,
      "DOCUMENT"
    );

    return NextResponse.json({ success: true, document: db.documents[docIndex] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
