import { NextResponse } from "next/server";
import { ensureDatabase, logAuditEvent } from "@/lib/server/db";

export async function GET() {
  const db = ensureDatabase();
  return NextResponse.json({ success: true, auditTrail: db.auditTrail });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actorName, actorRole, entityName, action, details, category } = body;

    const newLog = await logAuditEvent(
      actorName,
      actorRole,
      entityName,
      action,
      details,
      category
    );

    return NextResponse.json({ success: true, log: newLog });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
