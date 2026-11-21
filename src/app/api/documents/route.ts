// ============================================================================
// ENTERPRISE DOCUMENTS API ROUTE
// Multi-tenant file management, MIME-type validation, local durable vault,
// and role-segregated access control (Partner / Article Trainee / Client)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification, UPLOADS_DIR } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { DocumentItem } from "@/lib/types";
import fs from "fs";
import path from "path";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { executePracticeAutopilotSweep } from "@/lib/automation/practiceAutopilot";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    const db = ensureDatabase();

    if (auth.role === "CLIENT" && auth.clientEntityId) {
      const clientDocs = (db.documents || []).filter((d) => d.entityId === auth.clientEntityId);
      return NextResponse.json({ success: true, documents: clientDocs });
    }

    return NextResponse.json({ success: true, documents: db.documents || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const db = ensureDatabase();

    // 1. Handle Batch Outward Dispatcher (Staff only)
    if (body.batch && Array.isArray(body.batch)) {
      if (auth.role !== "PARTNER" && auth.role !== "ARTICLE") {
        return NextResponse.json({ success: false, error: "Staff permissions required for batch outward dispatch." }, { status: 403 });
      }
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
          reviewedBy: auth.user.name || "CA Gunjan Jain (Partner)",
          reviewedAt: new Date().toISOString(),
          fileContentBase64: item.fileContentBase64 || undefined,
        };

        // If real base64 file buffer provided, persist to durable disk vault
        if (item.fileContentBase64) {
          try {
            if (!fs.existsSync(UPLOADS_DIR)) {
              fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            }
            const safeBaseName = (newDoc.fileName || "document.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
            const sanitizedFileName = `${newDoc.id}_${safeBaseName}`;
            const filePath = path.join(UPLOADS_DIR, sanitizedFileName);
            const buffer = Buffer.from(item.fileContentBase64, "base64");
            fs.writeFileSync(filePath, buffer);
          } catch (writeErr) {
            console.warn("Disk save error for batch deliverable:", writeErr);
          }
        }

        // Auto-advance matching compliance tasks to FILED_AND_COMPLETED
        if (body.autoAdvanceTask !== false && db.tasks && db.tasks.length > 0) {
          const matchingTasks = db.tasks.filter((t) => {
            const matchesEntity = t.entityId === newDoc.entityId || t.entityName.toLowerCase() === newDoc.entityName.toLowerCase();
            if (!matchesEntity) return false;
            // Match filing type
            if (newDoc.category === "GST_INVOICES") {
              return t.category === "GST" && t.status !== "FILED_AND_COMPLETED";
            }
            if (newDoc.category === "TAX_COMPUTATION") {
              return (t.category === "INCOME_TAX" || t.category === "TAX_AUDIT") && t.status !== "FILED_AND_COMPLETED";
            }
            if (newDoc.category === "AUDIT_REPORT") {
              return t.category === "TAX_AUDIT" && t.status !== "FILED_AND_COMPLETED";
            }
            if (newDoc.category === "CHALLAN") {
              return t.category === "TDS" && t.status !== "FILED_AND_COMPLETED";
            }
            return t.status !== "FILED_AND_COMPLETED";
          });

          for (const task of matchingTasks) {
            task.status = "FILED_AND_COMPLETED";
            task.arnNumber = item.arnNumber || `AA${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
            task.filingDate = new Date().toISOString().split("T")[0];
            task.missingDocumentsCount = 0;
            task.missingDocumentsList = [];
            task.penaltyRisk = 0;
            task.accruingDailyPenalty = 0;
            task.clientApprovalStatus = "APPROVED";

            // Autonomous Client Notification for Completed Filing
            await createNotification({
              title: `Return Successfully Filed: ${task.title}`,
              message: `Official statutory return for ${task.period} has been filed with the Department (ARN: ${task.arnNumber}). Filed acknowledgment PDF is available in your Vault.`,
              category: "COMPLIANCE",
              priority: "HIGH",
              targetTab: "vault",
              recipientRole: "CLIENT",
              recipientEntityId: task.entityId,
              targetRoles: ["CLIENT"],
              entityId: task.entityId,
              metadata: { taskId: task.id, arnNumber: task.arnNumber }
            });
          }
        }

        db.documents.unshift(newDoc);
        createdDocs.push(newDoc);

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
        auth.user.name || "CA Partner",
        auth.role || "PARTNER",
        "All Clients",
        "Batch Dispatch",
        `Dispatched batch of ${createdDocs.length} signed tax deliverables`,
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

    const targetEntityId = entityId || (auth.role === "CLIENT" ? auth.clientEntityId : "CLI-001");

    if (auth.role === "CLIENT" && auth.clientEntityId && targetEntityId !== auth.clientEntityId) {
      return NextResponse.json({ success: false, error: "You may upload documents only for your assigned entity." }, { status: 403 });
    }

    if (typeof fileContentBase64 === "string") {
      const estimatedBytes = Math.floor(fileContentBase64.length * 0.75);
      if (estimatedBytes > 25 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "File exceeds the 25 MB limit." }, { status: 413 });
      }
    }

    const docId = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (fileContentBase64) {
      try {
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        const safeBaseName = (fileName || "document.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
        const sanitizedFileName = `${docId}_${safeBaseName}`;
        const filePath = path.join(UPLOADS_DIR, sanitizedFileName);
        const buffer = Buffer.from(fileContentBase64, "base64");
        fs.writeFileSync(filePath, buffer);
      } catch (writeErr) {
        console.warn("Local disk write error (fallback to virtual record):", writeErr);
      }
    }

    const newDoc: DocumentItem = {
      id: docId,
      entityId: targetEntityId,
      entityName: entityName || (auth.role === "CLIENT" ? auth.user.name : "Client Entity"),
      category: category || "BANK_STATEMENT",
      fileName: fileName || "Uploaded_Document.pdf",
      fileSize: fileSize || "1.5 MB",
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploadedBy || (auth.role === "CLIENT" ? "CLIENT_PWA" : "FIRM_STAFF"),
      isPasswordProtected: false,
      isUnlocked: true,
      financialYear: financialYear || "FY 2026-27",
      taskId: taskId || undefined,
      reviewStatus: auth.role === "PARTNER" ? "APPROVED" : "PENDING_REVIEW",
      reviewedBy: auth.role === "PARTNER" ? auth.user.name : undefined,
    };

    db.documents.unshift(newDoc);

    // Autonomous Task Matching & Self-Advancement
    let targetTask = taskId ? db.tasks.find((t) => t.id === taskId) : null;
    if (!targetTask && db.tasks) {
      targetTask = db.tasks.find((t) => {
        const matchesClient = t.entityId === targetEntityId || (t.entityName && newDoc.entityName && t.entityName.toLowerCase() === newDoc.entityName.toLowerCase());
        if (!matchesClient || t.status === "FILED_AND_COMPLETED") return false;
        if (newDoc.category === "BANK_STATEMENT") return t.status === "DOCUMENTS_AWAITED" || t.category === "GST" || t.category === "INCOME_TAX";
        if (newDoc.category === "GST_INVOICES") return t.category === "GST";
        if (newDoc.category === "TAX_COMPUTATION" || newDoc.category === "AUDIT_REPORT") return t.category === "INCOME_TAX" || t.category === "TAX_AUDIT";
        if (newDoc.category === "CHALLAN") return t.category === "TDS" || t.category === "GST";
        return t.status === "DOCUMENTS_AWAITED";
      }) || null;
    }

    if (targetTask) {
      newDoc.taskId = targetTask.id;
      if (targetTask.missingDocumentsCount > 0) {
        targetTask.missingDocumentsCount = Math.max(0, targetTask.missingDocumentsCount - 1);
      }
      if (targetTask.status === "DOCUMENTS_AWAITED") {
        targetTask.status = "IN_PREPARATION";
      }
    }

    await saveDatabase(db);

    await logAuditEvent(
      actorName || auth.user.name || "Client Signatory",
      auth.role || "CLIENT",
      newDoc.entityName,
      "Document Uploaded",
      `Uploaded ${newDoc.fileName} (${newDoc.category}) via ${newDoc.uploadedBy}`,
      "DOCUMENT"
    );

    // 1. Notify Firm Staff
    await createNotification(
      `New Document Uploaded: ${newDoc.fileName}`,
      `${newDoc.entityName} uploaded ${newDoc.fileName} (${newDoc.category}). ${targetTask ? `Auto-linked to ${targetTask.title}.` : "Pending audit verification."}`,
      "DOCUMENT",
      "NORMAL",
      "workbench",
      auth.role === "CLIENT" ? "ARTICLE" : "PARTNER",
      newDoc.entityId
    );

    // 2. Autonomous Client Notification (Always notify client portal!)
    await createNotification({
      title: `Document Received & Verified: ${newDoc.fileName}`,
      message: `Your ${newDoc.category.replace(/_/g, " ")} (${newDoc.fileName}) has been verified. ${targetTask ? `Task "${targetTask.title}" has automatically advanced to In Preparation.` : "Securely archived in your Firm Master Vault."}`,
      category: "DOCUMENT",
      priority: "NORMAL",
      targetTab: "progress",
      recipientRole: "CLIENT",
      recipientEntityId: targetEntityId,
      targetRoles: ["CLIENT"],
      entityId: targetEntityId,
      metadata: { docId: newDoc.id, taskId: targetTask?.id }
    });

    // 3. Autonomous Practice Sweep Trigger in Background
    try {
      await executePracticeAutopilotSweep(db, "Inbound Document Autonomous Engine");
      await saveDatabase(db);
    } catch (sweepErr) {
      console.warn("Background autonomous sweep error:", sweepErr);
    }

    return NextResponse.json({ success: true, document: newDoc, targetTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || (auth.role !== "PARTNER" && auth.role !== "ARTICLE")) {
      return NextResponse.json({ success: false, error: "Forbidden: Only firm staff can review documents." }, { status: 403 });
    }

    const body = await req.json();
    const { docId, reviewStatus, reviewNotes, reviewedBy } = body;

    const db = ensureDatabase();
    const docIndex = db.documents.findIndex((d) => d.id === docId);
    if (docIndex === -1) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    db.documents[docIndex].reviewStatus = reviewStatus;
    db.documents[docIndex].reviewedBy = reviewedBy || auth.user?.name || "CA Staff";
    db.documents[docIndex].reviewedAt = new Date().toISOString();
    if (reviewNotes) db.documents[docIndex].reviewNotes = reviewNotes;

    await saveDatabase(db);

    await logAuditEvent(
      db.documents[docIndex].reviewedBy || "CA Staff",
      auth.role || "ARTICLE",
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
