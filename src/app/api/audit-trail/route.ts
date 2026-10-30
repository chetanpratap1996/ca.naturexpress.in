import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, logAuditEvent } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function GET() {
  const db = ensureDatabase();
  return NextResponse.json({ success: true, auditTrail: db.auditTrail });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Authentication required to append to practice audit trail." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { actorName, actorRole, entityName, action, details, category } = body;

    const newLog = await logAuditEvent(
      actorName || auth.user?.name || "System Actor",
      actorRole || auth.role || "SYSTEM",
      entityName || "Practice Operation",
      action,
      details,
      category || "SYSTEM"
    );

    return NextResponse.json({ success: true, log: newLog });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
