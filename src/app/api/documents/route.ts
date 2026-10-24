import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, UPLOADS_DIR } from "@/lib/server/db";
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

    const db = ensureDatabase();
    const docId = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // If file content is provided, save it physically to disk
    if (fileContentBase64) {
      const sanitizedFileName = `${docId}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(UPLOADS_DIR, sanitizedFileName);
      const buffer = Buffer.from(fileContentBase64, "base64");
      fs.writeFileSync(filePath, buffer);
    }

    const newDoc: DocumentItem = {
      id: docId,
      entityId: entityId || "CLI-001",
      entityName: entityName || "Apex Precision Technologies Pvt Ltd",
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

    // If linked to a task, update the task's missing documents count
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
    db.documents[docIndex].reviewedBy = reviewedBy || "Rohan Verma (Article)";
    db.documents[docIndex].reviewedAt = new Date().toISOString();
    if (reviewNotes) db.documents[docIndex].reviewNotes = reviewNotes;

    await saveDatabase(db);

    await logAuditEvent(
      reviewedBy || "Rohan Verma",
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
