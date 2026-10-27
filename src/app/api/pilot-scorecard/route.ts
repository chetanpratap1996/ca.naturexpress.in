import { NextResponse } from "next/server";
import { ensureDatabase, logAuditEvent, saveDatabase } from "@/lib/server/db";
import type { PilotMeasureSet, PilotScorecard } from "@/lib/types";

const fields = ["weeklyChasingHours", "medianMinutesPerTask", "overdueTasks", "activePilotClients"] as const;
function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function validMeasure(value: unknown): value is PilotMeasureSet {
  if (!value || typeof value !== "object") return false;
  const item = value as PilotMeasureSet;
  if (!validDate(item.measuredOn) || typeof item.notes !== "string" || item.notes.length > 1000) return false;
  return fields.every((key) => item[key] === null || (typeof item[key] === "number" && Number.isFinite(item[key]) && item[key] >= 0 && item[key] <= 1_000_000 && (key === "weeklyChasingHours" || key === "medianMinutesPerTask" || Number.isInteger(item[key]))));
}
function error(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  try {
    const db = await ensureDatabase();
    const scorecard: PilotScorecard = db.pilotScorecard || { baseline: null, review: null, updatedAt: null };
    return NextResponse.json({ success: true, scorecard, setup: {
      clientEntities: db.clients.length,
      ownedTasks: db.tasks.filter((task) => Boolean(task.assignedToId || (task.assignedTo?.trim() && !["unassigned", "no owner", "none"].includes(task.assignedTo.trim().toLowerCase())))).length,
      tasks: db.tasks.length,
      uploadedDocuments: db.documents.length,
      linkedClientUploads: db.documents.filter((document) => document.uploadedBy === "CLIENT_PWA" && Boolean(document.taskId)).length,
      completedTasks: db.tasks.filter((task) => task.status === "FILED_AND_COMPLETED").length,
    } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return error("Pilot readiness data is temporarily unavailable.", 503);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!["baseline", "review"].includes(body.period) || !validMeasure(body.measure)) return error("Enter a date and valid, non-negative pilot measures.", 400);
    const db = await ensureDatabase();
    const scorecard = db.pilotScorecard || { baseline: null, review: null, updatedAt: null };
    scorecard[body.period as "baseline" | "review"] = {
      ...body.measure,
      notes: body.measure.notes.trim(),
    };
    scorecard.updatedAt = new Date().toISOString();
    db.pilotScorecard = scorecard;
    await logAuditEvent("Firm user", "PARTNER", "Firm pilot", `${body.period === "baseline" ? "Pilot baseline" : "Pilot review"} recorded`, `Manual pilot measures recorded for ${body.measure.measuredOn}.`, "SYSTEM", db);
    await saveDatabase(db);
    return NextResponse.json({ success: true, scorecard }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return error("The pilot scorecard could not be saved. Refresh and try again.", 503);
  }
}
