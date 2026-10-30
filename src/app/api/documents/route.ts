import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification, UPLOADS_DIR } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { DocumentItem } from "@/lib/types";
import fs from "fs";
import path from "path";

export async function GET() {
  const db = ensureDatabase();
  return NextResponse.json({ success: true, documents: db.documents });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

    await createNotification(
      `New Document Uploaded: ${newDoc.fileName}`,
      `${newDoc.entityName} uploaded ${newDoc.fileName} (${newDoc.category}). Pending audit verification.`,
      "DOCUMENT",
      "NORMAL",
      "workbench",
      uploadedBy === "CLIENT_PWA" ? "ARTICLE" : "PARTNER",
      newDoc.entityId
    );

    return NextResponse.json({ success: true, document: newDoc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { docId, reviewStatus, reviewNotes, reviewedBy } = body;

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
