import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { ComplianceTask } from "@/lib/types";
import { authenticateServerRequest, createRequestSupabaseClient, writeServerAuditLog } from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const auth = await authenticateServerRequest(request);
    const client = createRequestSupabaseClient(request);
    if (!auth.isAuthenticated || !auth.firmId || !client) return NextResponse.json({ success: false, error: "Authenticated Supabase session required." }, { status: 401 });
    const [{ data: rows, error }, { data: entities }] = await Promise.all([
      client.from("compliance_tasks").select("*").eq("firm_id", auth.firmId),
      client.from("client_entities").select("id, entity_name, group_id").eq("firm_id", auth.firmId),
    ]);
    if (error) return NextResponse.json({ success: false, error: "Could not load compliance tasks from Supabase." }, { status: 503 });
    const tasks: ComplianceTask[] = (rows || []).map((row: any) => {
      const entity = (entities || []).find((item: any) => item.id === row.entity_id);
      const missingDocumentsList = Array.isArray(row.missing_docs_list) ? row.missing_docs_list : [];
      return {
        id: row.id, entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", groupId: entity?.group_id || "",
        category: row.category, title: row.title, period: row.period, dueDate: row.due_date, status: row.status,
        assignedTo: "Assigned Staff", reviewedBy: "Assigned Partner", priority: row.priority,
        penaltyRisk: Number(row.penalty_risk || 0), accruingDailyPenalty: Number(row.accruing_daily_penalty || 0),
        missingDocumentsCount: missingDocumentsList.length, missingDocumentsList, chaseCount: row.chase_count || 0,
        arnNumber: row.arn_number || undefined, officialUdin: row.official_udin || undefined,
        udinGeneratedAt: row.udin_generated_at || undefined, filingDate: row.filing_date || undefined,
      };
    });
    return NextResponse.json({ success: true, tasks });
  }
  const db = ensureDatabase();
  return NextResponse.json({ success: true, tasks: db.tasks });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (process.env.NODE_ENV === "production") {
      const auth = await authenticateServerRequest(req);
      const client = createRequestSupabaseClient(req);
      if (!auth.isAuthenticated || !auth.firmId || !client) return NextResponse.json({ success: false, error: "Authenticated Supabase session required." }, { status: 401 });
      const { data: entity } = await client.from("client_entities").select("id, entity_name, group_id").eq("id", body.entityId).eq("firm_id", auth.firmId).maybeSingle();
      if (!entity) return NextResponse.json({ success: false, error: "Entity is not accessible to this firm." }, { status: 404 });
      const missingDocumentsList = Array.isArray(body.missingDocumentsList) ? body.missingDocumentsList : [];
      const insert = {
        firm_id: auth.firmId, entity_id: entity.id, category: body.category || "GST", title: String(body.title || "").slice(0, 255),
        period: String(body.period || "Current period").slice(0, 50), due_date: body.dueDate, status: body.status || "DOCUMENTS_AWAITED",
        priority: body.priority || "HIGH", penalty_risk: Number(body.penaltyRisk || 0), accruing_daily_penalty: Number(body.accruingDailyPenalty || 0),
        missing_docs_list: missingDocumentsList, chase_count: 0,
      };
      if (!insert.title || !insert.due_date) return NextResponse.json({ success: false, error: "Task title and due date are required." }, { status: 400 });
      const { data: row, error } = await client.from("compliance_tasks").insert(insert).select("*").single();
      if (error || !row) return NextResponse.json({ success: false, error: "Task could not be saved to durable storage." }, { status: 400 });
      const audit = await writeServerAuditLog(req, auth, { entityId: entity.id, entityName: entity.entity_name, action: "Task Created", details: `Created ${row.title} for ${row.period}.`, category: "COMPLIANCE" });
      if (audit.error) console.error("Audit log write failed for task creation.");
      const task: ComplianceTask = {
        id: row.id, entityId: row.entity_id, entityName: entity.entity_name, groupId: entity.group_id, category: row.category,
        title: row.title, period: row.period, dueDate: row.due_date, status: row.status, assignedTo: "Assigned Staff",
        reviewedBy: "Assigned Partner", priority: row.priority, penaltyRisk: Number(row.penalty_risk || 0),
        accruingDailyPenalty: Number(row.accruing_daily_penalty || 0), missingDocumentsCount: missingDocumentsList.length,
        missingDocumentsList, chaseCount: row.chase_count || 0,
      };
      return NextResponse.json({ success: true, task });
    }
    const db = ensureDatabase();

    const newTask: ComplianceTask = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
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

    await logAuditEvent(
      body.actorName || "CA Gunjan Jain",
      "PARTNER",
      body.entityName,
      "Task Created",
      `Created engagement ${newTask.title} for ${newTask.period} assigned to ${newTask.assignedTo}`,
      "COMPLIANCE"
    );

    return NextResponse.json({ success: true, task: newTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, status, officialUdin, chaseCount, actorName, actorRole } = body;

    if (process.env.NODE_ENV === "production") {
      const auth = await authenticateServerRequest(req);
      const client = createRequestSupabaseClient(req);
      if (!auth.isAuthenticated || !auth.firmId || !client) return NextResponse.json({ success: false, error: "Authenticated Supabase session required." }, { status: 401 });
      const { data: current } = await client.from("compliance_tasks").select("*").eq("id", taskId).eq("firm_id", auth.firmId).maybeSingle();
      if (!current) return NextResponse.json({ success: false, error: "Task not found or not accessible." }, { status: 404 });
      const update: Record<string, unknown> = {};
      if (status) {
        const validStatuses = ["DOCUMENTS_AWAITED", "IN_PREPARATION", "MANAGER_REVIEW", "PARTNER_SIGN_OFF", "FILED_AND_COMPLETED"];
        if (!validStatuses.includes(status)) return NextResponse.json({ success: false, error: "Invalid workflow status." }, { status: 400 });
        if (auth.role === "ARTICLE" && ["PARTNER_SIGN_OFF", "FILED_AND_COMPLETED"].includes(status)) {
          return NextResponse.json({ success: false, error: "Only a partner can sign off or mark a filing complete." }, { status: 403 });
        }
        update.status = status;
      }
      if (officialUdin) {
        if (auth.role !== "PARTNER" || !/^\d{8}[A-Z0-9]{10}$/.test(officialUdin)) return NextResponse.json({ success: false, error: "A valid UDIN can only be recorded by a partner." }, { status: 403 });
        update.official_udin = officialUdin;
        update.udin_generated_at = new Date().toISOString();
      }
      if (chaseCount !== undefined) {
        update.chase_count = Math.max(0, Math.min(1000, Number(chaseCount) || 0));
        update.last_chase_at = new Date().toISOString();
      }
      const { data: row, error } = await client.from("compliance_tasks").update(update).eq("id", taskId).eq("firm_id", auth.firmId).select("*").single();
      if (error || !row) return NextResponse.json({ success: false, error: "Task update could not be saved." }, { status: 400 });
      const { data: entity } = await client.from("client_entities").select("entity_name, group_id").eq("id", row.entity_id).maybeSingle();
      const audit = await writeServerAuditLog(req, auth, { entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", action: "Task Updated", details: `Updated ${row.title}.`, category: officialUdin ? "UDIN" : "COMPLIANCE" });
      if (audit.error) console.error("Audit log write failed for task update.");
      const missingDocumentsList = Array.isArray(row.missing_docs_list) ? row.missing_docs_list : [];
      return NextResponse.json({ success: true, task: {
        id: row.id, entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", groupId: entity?.group_id || "",
        category: row.category, title: row.title, period: row.period, dueDate: row.due_date, status: row.status,
        assignedTo: "Assigned Staff", reviewedBy: "Assigned Partner", priority: row.priority,
        penaltyRisk: Number(row.penalty_risk || 0), accruingDailyPenalty: Number(row.accruing_daily_penalty || 0),
        missingDocumentsCount: missingDocumentsList.length, missingDocumentsList, chaseCount: row.chase_count || 0,
        arnNumber: row.arn_number || undefined, officialUdin: row.official_udin || undefined,
        udinGeneratedAt: row.udin_generated_at || undefined,
      }});
    }

    const db = ensureDatabase();
    const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const currentTask = db.tasks[taskIndex];

    if (status) currentTask.status = status;
    if (officialUdin) {
      currentTask.officialUdin = officialUdin;
      currentTask.udinGeneratedAt = new Date().toISOString();
      await logAuditEvent(
        actorName || "CA Gunjan Jain",
        "PARTNER",
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
        actorName || "Kriti Jain",
        "ARTICLE",
        currentTask.entityName,
        "WhatsApp Chase Dispatched",
        `Dispatched 1-tap WhatsApp reminder for ${currentTask.title}`,
        "WHATSAPP"
      );
    }

    db.tasks[taskIndex] = currentTask;
    await saveDatabase(db);

    return NextResponse.json({ success: true, task: currentTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
