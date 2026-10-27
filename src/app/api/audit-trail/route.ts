import { NextResponse } from "next/server";
import { ensureDatabase, logAuditEvent } from "@/lib/server/db";

export async function GET() {
  try {
    const db = await ensureDatabase();
    return NextResponse.json(
      { success: true, auditTrail: db.auditTrail },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ success: false, error: "Firm security activity is temporarily unavailable." }, { status: 503 });
  }
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
    return NextResponse.json({ success: false, error: "Request failed. Refresh the page and try again." }, { status: 500 });
  }
}
