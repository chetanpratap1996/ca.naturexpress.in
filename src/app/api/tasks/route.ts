import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { getPostgresPool } from "@/lib/server/postgres";
import { ComplianceTask, DocumentItem } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { executePracticeAutopilotSweep } from "@/lib/automation/practiceAutopilot";

export async function GET(request: NextRequest) {
  const auth = await authenticateServerRequest(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }
  const db = ensureDatabase();

  if (auth.role === "CLIENT" && auth.clientEntityId) {
    const clientTasks = (db.tasks || []).filter(
      (t) => t.entityId === auth.clientEntityId || (auth.clientGroupId && t.groupId === auth.clientGroupId)
    );
    return NextResponse.json({ success: true, tasks: clientTasks });
  }

  return NextResponse.json({ success: true, tasks: db.tasks || [] });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json({ success: false, error: "Partner access required." }, { status: auth.isAuthenticated ? 403 : 401 });
    }
    const body = await req.json();
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || typeof body.entityId !== "string") {
      return NextResponse.json({ success: false, error: "A valid task title and entity are required." }, { status: 400 });
    }
    const db = ensureDatabase();

    const newTask: ComplianceTask = {
      id: body.id || `TSK-${Date.now().toString().slice(-4)}`,
      entityId: body.entityId,
      entityName: body.entityName,
      groupId: body.groupId || "GRP-001",
      category: body.category || "GST",
      title: body.title,
      period: body.period,
      dueDate: body.dueDate,
      status: body.status || "DOCUMENTS_AWAITED",
      assignedTo: body.assignedTo || "Kriti Jain (Article)",
      reviewedBy: body.reviewedBy || "CA Gunjan Jain",
      priority: body.priority || "HIGH",
      penaltyRisk: body.penaltyRisk || 10000,
      accruingDailyPenalty: body.accruingDailyPenalty || 50,
      missingDocumentsCount: body.missingDocumentsList?.length || 0,
      missingDocumentsList: body.missingDocumentsList || [],
      chaseCount: 0,
    };

    db.tasks.unshift(newTask);
    await saveDatabase(db);

    // Direct PostgreSQL Superuser Task Insert
    try {
      const pool = getPostgresPool();
      const firmRes = await pool.query("SELECT id FROM firms LIMIT 1");
      const firmId = firmRes.rows[0]?.id;

      // Verify entity exists in Supabase
      const entityRes = await pool.query(
        "SELECT id FROM client_entities WHERE id::text = $1 OR LOWER(entity_name) = LOWER($2) LIMIT 1",
        [newTask.entityId, newTask.entityName]
      );
      const targetEntityId = entityRes.rows[0]?.id;

      if (firmId && targetEntityId) {
        await pool.query(
          `INSERT INTO compliance_tasks (
             firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty, chase_count
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)`,
          [
            firmId,
            targetEntityId,
            newTask.category,
            newTask.title,
            newTask.period,
            newTask.dueDate,
            newTask.status,
            newTask.priority,
            newTask.penaltyRisk,
            newTask.accruingDailyPenalty,
          ]
        );
      }
    } catch (pgErr) {
      console.warn("Postgres compliance task insert warning:", pgErr);
    }

    await logAuditEvent(
      auth.user?.name || "Firm Partner",
      auth.role,
      body.entityName,
      "Task Created",
      `Created engagement ${newTask.title} for ${newTask.period} assigned to ${newTask.assignedTo}`,
      "COMPLIANCE"
    );

    await createNotification(
      `New Statutory Assignment: ${newTask.title}`,
      `Assigned to ${newTask.assignedTo} for ${newTask.entityName}. Due Date: ${newTask.dueDate}. Statutory penalty risk: ₹${newTask.penaltyRisk.toLocaleString("en-IN")}.`,
      "COMPLIANCE",
      newTask.priority === "CRITICAL" ? "URGENT" : "NORMAL",
      "calendar",
      "ALL",
      newTask.entityId
    );

    return NextResponse.json({ success: true, task: newTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE"].includes(auth.role || "")) {
      return NextResponse.json({ success: false, error: "Firm staff access required." }, { status: auth.isAuthenticated ? 403 : 401 });
    }
    const body = await req.json();
    const { taskId, status, officialUdin, chaseCount } = body;

    const db = ensureDatabase();
    const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const currentTask = db.tasks[taskIndex];

    if (officialUdin && (auth.role !== "PARTNER" || !/^\d{18}$/.test(String(officialUdin)))) {
      return NextResponse.json({ success: false, error: "Only a partner can record an 18-digit UDIN." }, { status: 403 });
    }
    if (chaseCount !== undefined && (!Number.isInteger(chaseCount) || chaseCount < currentTask.chaseCount)) {
      return NextResponse.json({ success: false, error: "Chase count must be a non-decreasing integer." }, { status: 400 });
    }
    if (status !== undefined && (typeof status !== "string" || status.length > 50)) {
      return NextResponse.json({ success: false, error: "Task status is invalid." }, { status: 400 });
    }

    if (status === "FILED_AND_COMPLETED") {
      currentTask.status = "FILED_AND_COMPLETED";
      currentTask.filingDate = new Date().toISOString().split("T")[0];
      if (!currentTask.arnNumber) {
        currentTask.arnNumber = `AA${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
      }
      currentTask.missingDocumentsCount = 0;
      currentTask.penaltyRisk = 0;
      currentTask.accruingDailyPenalty = 0;
      currentTask.clientApprovalStatus = "APPROVED";

      // Auto-deposit official filed deliverable in documents
      if (!db.documents) db.documents = [];
      const filingDoc: DocumentItem = {
        id: `DOC-ARN-${Date.now()}`,
        entityId: currentTask.entityId,
        entityName: currentTask.entityName,
        category: currentTask.category === "GST" ? "GST_INVOICES" : currentTask.category === "TDS" ? "CHALLAN" : "TAX_COMPUTATION",
        fileName: `${currentTask.title.replace(/\s+/g, "_")}_Acknowledgment_${currentTask.arnNumber}.pdf`,
        fileSize: "245 KB",
        uploadedAt: new Date().toISOString(),
        uploadedBy: "FIRM_STAFF",
        isPasswordProtected: false,
        isUnlocked: true,
        financialYear: currentTask.period || "FY 2026-27",
        reviewStatus: "APPROVED",
        reviewedBy: auth.user?.name || "CA Gunjan Jain",
        reviewedAt: new Date().toISOString()
      };
      db.documents.unshift(filingDoc);

      // Autonomous Client Notification: Filing Complete & Acknowledgment Ready
      await createNotification({
        title: `Return Successfully Filed: ${currentTask.title}`,
        message: `Official return for ${currentTask.period} has been filed with Department (ARN: ${currentTask.arnNumber}). Filed acknowledgment PDF is available in your Vault.`,
        category: "COMPLIANCE",
        priority: "HIGH",
        targetTab: "vault",
        recipientRole: "CLIENT",
        recipientEntityId: currentTask.entityId,
        targetRoles: ["CLIENT"],
        entityId: currentTask.entityId,
        metadata: { taskId: currentTask.id, arnNumber: currentTask.arnNumber }
      });
    } else if (status) {
      currentTask.status = status;
    }

    if (officialUdin) {
      currentTask.officialUdin = officialUdin;
      currentTask.udinGeneratedAt = new Date().toISOString();
      await logAuditEvent(
        auth.user?.name || "Firm Partner",
        auth.role!,
        currentTask.entityName,
        "UDIN Recorded & Stamped",
        `Recorded ICAI UDIN ${officialUdin} on ${currentTask.title}`,
        "UDIN"
      );

      // Autonomous Client Notification: UDIN Stamped
      await createNotification({
        title: `ICAI UDIN Generated: ${officialUdin}`,
        message: `ICAI Unique Document Identification Number ${officialUdin} generated and sealed on ${currentTask.title}.`,
        category: "UDIN",
        priority: "HIGH",
        targetTab: "vault",
        recipientRole: "CLIENT",
        recipientEntityId: currentTask.entityId,
        targetRoles: ["CLIENT"],
        entityId: currentTask.entityId,
        metadata: { taskId: currentTask.id, udin: officialUdin }
      });
    }
    if (chaseCount !== undefined) {
      currentTask.chaseCount = chaseCount;
      currentTask.lastChaseDate = new Date().toISOString().split("T")[0];
      await logAuditEvent(
        auth.user?.name || "Firm Staff",
        auth.role!,
        currentTask.entityName,
        "WhatsApp Chase Dispatched",
        `Dispatched 1-tap WhatsApp reminder for ${currentTask.title}`,
        "WHATSAPP"
      );
    }

    db.tasks[taskIndex] = currentTask;
    await saveDatabase(db);

    // Autonomous Practice Sweep Trigger in Background
    try {
      await executePracticeAutopilotSweep(db, "Task Status Autonomous Trigger");
      await saveDatabase(db);
    } catch (e) {
      console.warn("Autopilot sweep error:", e);
    }

    // Direct PostgreSQL Superuser Task Update
    try {
      const pool = getPostgresPool();
      await pool.query(
        `UPDATE compliance_tasks SET
           status = COALESCE($1, status),
           official_udin = COALESCE($2, official_udin),
           udin_generated_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE udin_generated_at END,
           chase_count = COALESCE($3, chase_count),
           last_chase_at = CASE WHEN $3 IS NOT NULL THEN NOW() ELSE last_chase_at END
         WHERE id::text = $4 OR title = $5`,
        [status || null, officialUdin || null, chaseCount !== undefined ? chaseCount : null, taskId, currentTask.title]
      );
    } catch (pgErr) {
      console.warn("Postgres compliance task update warning:", pgErr);
    }

    return NextResponse.json({ success: true, task: currentTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
