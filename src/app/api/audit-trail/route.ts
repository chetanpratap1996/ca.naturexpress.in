import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog } from "@/lib/server/pgHelpers";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner authorization required to view audit trail." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const { rows } = await pool.query(
      `SELECT id, created_at as timestamp, actor_name, actor_role, entity_name, action, details, category
       FROM public.audit_logs
       WHERE firm_id = $1
       ORDER BY created_at DESC
       LIMIT 250`,
      [firmId]
    );

    const auditTrail = rows.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      actorName: r.actor_name,
      actorRole: r.actor_role,
      entityName: r.entity_name,
      action: r.action,
      details: r.details,
      category: r.category,
    }));

    return NextResponse.json({ success: true, auditTrail });
  } catch (error: any) {
    console.error("GET /api/audit-trail error:", error);
    return NextResponse.json({ success: false, error: "Failed to load audit trail." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.user || !auth.role) {
      return NextResponse.json(
        { success: false, error: "Authentication required to append to practice audit trail." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const details = typeof body.details === "string" ? body.details.trim() : "";
    const entityName = typeof body.entityName === "string" ? body.entityName.trim() : "Practice Operation";
    const category = typeof body.category === "string" ? body.category.trim() : "SYSTEM";

    if (!action || action.length > 100) {
      return NextResponse.json({ success: false, error: "Valid action is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);

    // Server-derived actor identity — never trust client-supplied actorName/actorRole
    await appendPgAuditLog({
      firmId,
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: auth.role,
      entityId: auth.role === "CLIENT" ? auth.clientEntityId : body.entityId,
      entityName: auth.role === "CLIENT" ? auth.user.name : entityName,
      action,
      details,
      category,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/audit-trail error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to append audit log." }, { status: 500 });
  }
}
