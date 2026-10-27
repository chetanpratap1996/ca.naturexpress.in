import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { createClient } from "@/utils/supabase/server";
import { ComplianceTask } from "@/lib/types";

const CATEGORIES: ComplianceTask["category"][] = ["GST", "INCOME_TAX", "TAX_AUDIT", "TDS", "ROC_MCA", "TRANSFER_PRICING"];
const STATUSES: ComplianceTask["status"][] = ["DOCUMENTS_AWAITED", "IN_PREPARATION", "MANAGER_REVIEW", "PARTNER_SIGN_OFF", "FILED_AND_COMPLETED"];
const PRIORITIES: ComplianceTask["priority"][] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET() {
  const db = await ensureDatabase();
  return NextResponse.json({ success: true, tasks: db.tasks });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await ensureDatabase();
    if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 180 || typeof body.period !== "string" || !body.period.trim() || !validDate(body.dueDate)) {
      return NextResponse.json({ success: false, error: "Enter a task title, period, and valid due date." }, { status: 400 });
    }
    const requestedEntityIds = Array.isArray(body.entityIds) ? body.entityIds : [body.entityId];
    if (!requestedEntityIds.length || requestedEntityIds.length > 100
      || requestedEntityIds.some((id: unknown) => typeof id !== "string" || !id.trim())
      || new Set(requestedEntityIds).size !== requestedEntityIds.length) {
      return NextResponse.json({ success: false, error: "Select between 1 and 100 distinct client entities." }, { status: 400 });
    }
    const requestedUsers = [body.assignedToId, body.reviewedById].filter((id: unknown): id is string => typeof id === "string" && !!id);
    if (requestedUsers.length) {
      const supabase = createClient(await cookies());
      const { data: profiles, error: profileError } = await supabase.from("users").select("id,role,is_active").in("id", requestedUsers);
      if (profileError) return NextResponse.json({ success: false, error: "Task ownership could not be verified." }, { status: 503 });
      const byId = new Map((profiles || []).map((profile) => [profile.id, profile]));
      const owner = body.assignedToId ? byId.get(body.assignedToId) : null;
      const reviewer = body.reviewedById ? byId.get(body.reviewedById) : null;
      if (body.assignedToId && (!owner?.is_active || !["PAID_CA_MANAGER", "ARTICLE_TRAINEE"].includes(owner.role))) {
        return NextResponse.json({ success: false, error: "Choose an active manager or article trainee from this firm as the task owner." }, { status: 400 });
      }
      if (body.reviewedById && (!reviewer?.is_active || !["SUPER_ADMIN", "PARTNER", "PAID_CA_MANAGER"].includes(reviewer.role))) {
        return NextResponse.json({ success: false, error: "Choose an active manager or partner from this firm as the task reviewer." }, { status: 400 });
      }
    }
    const entities = requestedEntityIds.map((id: string) => db.clients.find((client) => client.id === id));
    if (entities.some((entity: typeof db.clients[number] | undefined) => !entity)) {
      return NextResponse.json({ success: false, error: "One or more selected client entities are unavailable in this firm." }, { status: 400 });
    }
    const category = CATEGORIES.includes(body.category) ? body.category : null;
    const priority = PRIORITIES.includes(body.priority) ? body.priority : null;
    const penaltyRisk = body.penaltyRisk === undefined ? 0 : Number(body.penaltyRisk);
    const accruingDailyPenalty = body.accruingDailyPenalty === undefined ? 0 : Number(body.accruingDailyPenalty);
    const missingDocumentsList = body.missingDocumentsList === undefined ? [] : body.missingDocumentsList;
    const cleanedMissingDocuments = Array.isArray(missingDocumentsList)
      ? [...new Set(missingDocumentsList.map((value: unknown) => typeof value === "string" ? value.trim() : "").filter(Boolean))]
      : null;
    if (!category || !priority || !Number.isFinite(penaltyRisk) || penaltyRisk < 0 || penaltyRisk > 9999999999.99
      || !Number.isFinite(accruingDailyPenalty) || accruingDailyPenalty < 0 || accruingDailyPenalty > 99999999.99
      || typeof body.period !== "string" || body.period.trim().length > 50
      || (body.assignedTo !== undefined && (typeof body.assignedTo !== "string" || body.assignedTo.trim().length > 160))
      || (body.reviewedBy !== undefined && (typeof body.reviewedBy !== "string" || body.reviewedBy.trim().length > 160))
      || (body.assignedToId !== undefined && body.assignedToId !== "" && (typeof body.assignedToId !== "string" || !UUID.test(body.assignedToId)))
      || (body.reviewedById !== undefined && body.reviewedById !== "" && (typeof body.reviewedById !== "string" || !UUID.test(body.reviewedById)))
      || !cleanedMissingDocuments || cleanedMissingDocuments.length > 50 || cleanedMissingDocuments.some((value: string) => value.length > 180)) {
      return NextResponse.json({ success: false, error: "Choose a valid category and priority, and enter non-negative risk amounts." }, { status: 400 });
    }

    const typedEntities = entities as NonNullable<(typeof entities)[number]>[];
    const duplicates = typedEntities.filter((entity) => db.tasks.some((task) =>
      task.entityId === entity.id && task.category === category && task.title.toLowerCase() === body.title.trim().toLowerCase()
      && task.period.toLowerCase() === body.period.trim().toLowerCase() && task.status !== "FILED_AND_COMPLETED"
    ));
    if (duplicates.length) {
      return NextResponse.json({
        success: false,
        error: `An open ${body.title.trim()} engagement already exists for: ${duplicates.map((entity) => entity.name).join(", ")}. Complete or update it before creating another.`,
      }, { status: 409 });
    }

    const newTasks: ComplianceTask[] = typedEntities.map((entity) => ({
      id: randomUUID(),
      entityId: entity.id,
      entityName: entity.name,
      groupId: entity.groupId,
      category,
      title: body.title.trim(),
      period: body.period.trim(),
      dueDate: body.dueDate,
      status: "DOCUMENTS_AWAITED",
      assignedToId: typeof body.assignedToId === "string" && body.assignedToId ? body.assignedToId : undefined,
      assignedTo: typeof body.assignedTo === "string" ? body.assignedTo.trim() : "",
      reviewedById: typeof body.reviewedById === "string" && body.reviewedById ? body.reviewedById : undefined,
      reviewedBy: typeof body.reviewedBy === "string" ? body.reviewedBy.trim() : "",
      priority,
      penaltyRisk,
      accruingDailyPenalty,
      missingDocumentsCount: cleanedMissingDocuments.length,
      missingDocumentsList: cleanedMissingDocuments,
      chaseCount: 0,
    }));

    db.tasks.unshift(...newTasks);
    for (const newTask of newTasks) {
      await logAuditEvent(
        "Firm user",
        "PARTNER",
        newTask.entityName,
        "Engagement Created",
        `Created ${newTask.title} for ${newTask.period}${newTask.assignedTo ? ` assigned to ${newTask.assignedTo}` : ""}.`,
        "COMPLIANCE",
        db,
      );
    }
    await saveDatabase(db);

    return NextResponse.json({ success: true, task: newTasks[0], tasks: newTasks }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Request failed. Refresh the page and try again." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { taskId, status, officialUdin, arnNumber, chaseCount, actorName, missingDocumentsList, action } = body;

    const db = await ensureDatabase();
    const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const currentTask = db.tasks[taskIndex];
    if (action !== undefined) {
      if (action !== "PREPARE_WHATSAPP_DRAFT") {
        return NextResponse.json({ success: false, error: "Choose a supported task action." }, { status: 400 });
      }
      if (currentTask.status === "FILED_AND_COMPLETED" || !(currentTask.missingDocumentsList || []).length) {
        return NextResponse.json({ success: false, error: "This engagement has no outstanding client document request." }, { status: 409 });
      }
      currentTask.reminderDraftCount = (currentTask.reminderDraftCount || 0) + 1;
      currentTask.lastReminderDraftAt = new Date().toISOString();
      db.tasks[taskIndex] = currentTask;
      await logAuditEvent(
        "Firm user",
        "PARTNER",
        currentTask.entityName,
        "WhatsApp reminder draft prepared",
        `Opened a one-tap document reminder draft for ${currentTask.title} (${currentTask.period}). The user must review and send it in WhatsApp; no message was sent by the app.`,
        "WHATSAPP",
        db,
      );
      await saveDatabase(db);
      return NextResponse.json({ success: true, task: currentTask, sent: false });
    }
    const previousStatus = currentTask.status;

    if (status === "IN_PREPARATION" && (currentTask.missingDocumentsList || []).length > 0) {
      return NextResponse.json({ success: false, error: "Review the requested documents and clear the outstanding list before starting preparation." }, { status: 409 });
    }

    if (missingDocumentsList !== undefined) {
      if (!Array.isArray(missingDocumentsList) || missingDocumentsList.length > 50
        || missingDocumentsList.some((value: unknown) => typeof value !== "string" || !value.trim() || value.trim().length > 180)) {
        return NextResponse.json({ success: false, error: "Enter up to 50 document requests, each with 180 characters or fewer." }, { status: 400 });
      }
      currentTask.missingDocumentsList = [...new Set(missingDocumentsList.map((value: string) => value.trim()))];
      currentTask.missingDocumentsCount = currentTask.missingDocumentsList.length;
    }

    if (status !== undefined) {
      if (!STATUSES.includes(status)) return NextResponse.json({ success: false, error: "Choose a valid task status." }, { status: 400 });
      if (status === "FILED_AND_COMPLETED" && (typeof (arnNumber || currentTask.arnNumber) !== "string" || !(arnNumber || currentTask.arnNumber).trim())) {
        return NextResponse.json({ success: false, error: "Record the government acknowledgement reference before marking this task complete." }, { status: 400 });
      }
      currentTask.status = status;
    }
    if (arnNumber !== undefined) {
      if (typeof arnNumber !== "string" || !arnNumber.trim() || arnNumber.length > 80) {
        return NextResponse.json({ success: false, error: "Enter a valid acknowledgement reference." }, { status: 400 });
      }
      currentTask.arnNumber = arnNumber.trim();
    }
    if (officialUdin) {
      if (typeof officialUdin !== "string" || !/^[0-9]{8}[A-Z0-9]{10}$/i.test(officialUdin.trim())) {
        return NextResponse.json({ success: false, error: "Enter the 18-character UDIN issued by ICAI." }, { status: 400 });
      }
      currentTask.officialUdin = officialUdin.trim().toUpperCase();
      currentTask.udinGeneratedAt = new Date().toISOString();
      await logAuditEvent(
        actorName || "CA Gunjan Jain",
        "PARTNER",
        currentTask.entityName,
        "UDIN Recorded & Stamped",
        `Recorded ICAI UDIN ${officialUdin} on ${currentTask.title}`,
        "UDIN",
      db
      );
    }
    if (chaseCount !== undefined) {
      if (!Number.isInteger(chaseCount) || chaseCount < currentTask.chaseCount || chaseCount > 2147483647) {
        return NextResponse.json({ success: false, error: "Chase count must be a whole number and cannot decrease." }, { status: 400 });
      }
      currentTask.chaseCount = chaseCount;
      currentTask.lastChaseDate = new Date().toISOString().split("T")[0];
      await logAuditEvent(
        actorName || "Kriti Jain",
        "ARTICLE",
        currentTask.entityName,
        "WhatsApp Chase Dispatched",
        `Dispatched 1-tap WhatsApp reminder for ${currentTask.title}`,
        "WHATSAPP",
      db
      );
    }

    if (status !== undefined && status !== previousStatus) {
      await logAuditEvent(
        actorName || "Firm user",
        "PARTNER",
        currentTask.entityName,
        "Task Status Changed",
        `Changed ${currentTask.title} from ${previousStatus} to ${status}.`,
        "COMPLIANCE",
        db,
      );
    }
    if (missingDocumentsList !== undefined) {
      await logAuditEvent(
        actorName || "Firm user",
        "PARTNER",
        currentTask.entityName,
        "Client Document Request List Updated",
        `Updated ${currentTask.title} request list for ${currentTask.period}; ${currentTask.missingDocumentsCount} item(s) remain open.`,
        "COMPLIANCE",
        db,
      );
    }

    db.tasks[taskIndex] = currentTask;
    await saveDatabase(db);

    return NextResponse.json({ success: true, task: currentTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Request failed. Refresh the page and try again." }, { status: 500 });
  }
}
