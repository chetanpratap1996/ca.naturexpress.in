import { NextResponse } from "next/server";
import { ensureDatabase, logAuditEvent, saveDatabase } from "@/lib/server/db";
import type { NoticeRecord } from "@/lib/types";

const authorities: NoticeRecord["authority"][] = ["INCOME_TAX", "GST_DEPT", "MCA_ROC", "DGGI"];
const statuses: NoticeRecord["status"][] = ["PENDING_TRIAGE", "DRAFTING_RESPONSE", "PARTNER_REVIEW", "SUBMITTED", "CLOSED"];
const risks: NoticeRecord["riskLevel"][] = ["HIGH", "CRITICAL", "MEDIUM"];
const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const validDate = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const firmToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const daysUntil = (value: string) => Math.ceil((new Date(`${value}T00:00:00Z`).getTime() - new Date(`${firmToday()}T00:00:00Z`).getTime()) / 86400000);

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  try {
    const db = await ensureDatabase();
    const notices = (db.notices || []).map((notice) => ({ ...notice, daysRemaining: daysUntil(notice.statutoryDeadline) }))
      .sort((a, b) => a.statutoryDeadline.localeCompare(b.statutoryDeadline));
    return NextResponse.json({ success: true, notices }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return jsonError("The notice register is temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await ensureDatabase();
    const entity = db.clients.find((client) => client.id === body.entityId);
    const authority = body.authority as NoticeRecord["authority"];
    const riskLevel = body.riskLevel as NoticeRecord["riskLevel"];
    const issueDate = body.issueDate;
    const statutoryDeadline = body.statutoryDeadline;
    const section = cleanText(body.section, 80);
    const dinNumber = cleanText(body.dinNumber, 100);
    const summary = cleanText(body.summary, 1500);
    const assignedPartner = cleanText(body.assignedPartner, 100);
    const demandAmount = Number(body.demandAmount ?? 0);
    if (!entity || !authorities.includes(authority) || !risks.includes(riskLevel) || !section || !summary || !assignedPartner ||
      !validDate(issueDate) || !validDate(statutoryDeadline) || statutoryDeadline < issueDate ||
      !Number.isFinite(demandAmount) || demandAmount < 0 || demandAmount > 1_000_000_000_000) {
      return jsonError("Enter a valid client, authority, section, dates, owner, summary, risk and non-negative amount.", 400);
    }
    if (dinNumber && (db.notices || []).some((notice) => notice.entityId === entity.id && notice.dinNumber.trim().toLowerCase() === dinNumber.toLowerCase())) {
      return jsonError("A notice with this reference is already recorded for the selected client.", 409);
    }
    const notice: NoticeRecord = {
      id: `NOTICE-${crypto.randomUUID()}`,
      entityId: entity.id,
      entityName: entity.name,
      groupId: entity.groupId,
      authority,
      section,
      dinNumber,
      demandAmount,
      issueDate,
      statutoryDeadline,
      daysRemaining: daysUntil(statutoryDeadline),
      status: "PENDING_TRIAGE",
      riskLevel,
      assignedPartner,
      summary,
    };
    db.notices = [notice, ...(db.notices || [])];
    await logAuditEvent("Firm user", "PARTNER", entity.name, "Manual notice logged", `${authority} ${section}; due ${statutoryDeadline}.`, "COMPLIANCE", db);
    await saveDatabase(db);
    return NextResponse.json({ success: true, notice }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return jsonError("The notice could not be saved. Refresh and try again.", 503);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const db = await ensureDatabase();
    const notice = db.notices.find((item) => item.id === body.noticeId);
    if (!notice) return jsonError("Notice not found. Refresh the register and try again.", 404);
    if (!statuses.includes(body.status)) return jsonError("Choose a valid notice status.", 400);
    const previousStatus = notice.status;
    notice.status = body.status;
    await logAuditEvent("Firm user", "PARTNER", notice.entityName, "Notice status updated", `${previousStatus} → ${notice.status} for ${notice.section}.`, "COMPLIANCE", db);
    await saveDatabase(db);
    return NextResponse.json({ success: true, notice }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return jsonError("The notice update could not be saved. Refresh and try again.", 503);
  }
}
