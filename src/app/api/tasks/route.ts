import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ComplianceTask } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

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

    // Bi-Directional Supabase Cloud Sync
    if (isSupabaseConfigured()) {
      try {
        const { data: firms } = await supabase.from("firms").select("id").limit(1);
        const firmId = firms?.[0]?.id;

        // Verify entity exists in Supabase
        const { data: entityRow } = await supabase
          .from("client_entities")
          .select("id")
          .or(`id.eq.${newTask.entityId},entity_name.ilike.${newTask.entityName}`)
          .limit(1)
          .maybeSingle();

        if (firmId && entityRow?.id) {
          await supabase.from("compliance_tasks").insert({
            firm_id: firmId,
            entity_id: entityRow.id,
            category: newTask.category,
            title: newTask.title,
            period: newTask.period,
            due_date: newTask.dueDate,
            status: newTask.status,
            priority: newTask.priority,
            penalty_risk: newTask.penaltyRisk,
            accruing_daily_penalty: newTask.accruingDailyPenalty,
            chase_count: 0
          });
        }
      } catch (sbErr) {
        console.warn("Supabase compliance task insert warning:", sbErr);
      }
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

    if (status) currentTask.status = status;
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

    // Bi-directional Supabase update
    if (isSupabaseConfigured()) {
      try {
        const updatePayload: Record<string, any> = {};
        if (status) updatePayload.status = status;
        if (officialUdin) {
          updatePayload.official_udin = officialUdin;
          updatePayload.udin_generated_at = new Date().toISOString();
        }
        if (chaseCount !== undefined) {
          updatePayload.chase_count = chaseCount;
          updatePayload.last_chase_at = new Date().toISOString();
        }

        if (Object.keys(updatePayload).length > 0) {
          // Attempt update by UUID or title match
          await supabase
            .from("compliance_tasks")
            .update(updatePayload)
            .or(`id.eq.${taskId},title.eq.${currentTask.title}`);
        }
      } catch (sbErr) {
        console.warn("Supabase compliance task update warning:", sbErr);
      }
    }

    return NextResponse.json({ success: true, task: currentTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
