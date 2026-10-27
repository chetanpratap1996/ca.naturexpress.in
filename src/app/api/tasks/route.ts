import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { ComplianceTask } from "@/lib/types";

export async function GET() {
  const db = ensureDatabase();
  return NextResponse.json({ success: true, tasks: db.tasks });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { taskId, status, officialUdin, chaseCount, actorName, actorRole } = body;

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
