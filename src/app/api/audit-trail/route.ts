import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, logAuditEvent } from "@/lib/server/db";
import { authenticateServerRequest, createRequestSupabaseClient, writeServerAuditLog } from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  const auth = await authenticateServerRequest(request);
  if (!auth.isAuthenticated || auth.role !== "PARTNER" || !auth.firmId) return NextResponse.json({ success: false, error: "Partner access required." }, { status: 403 });
  if (process.env.NODE_ENV === "production") {
    const client = createRequestSupabaseClient(request);
    if (!client) return NextResponse.json({ success: false, error: "Supabase session unavailable." }, { status: 503 });
    const { data, error } = await client.from("audit_logs").select("*").eq("firm_id", auth.firmId).order("created_at", { ascending: false }).limit(500);
    if (error) return NextResponse.json({ success: false, error: "Could not load the audit trail." }, { status: 503 });
    const auditTrail = (data || []).map((row: any) => ({
      id: row.id, timestamp: row.created_at, actorName: row.actor_name,
      actorRole: row.actor_role === "PARTNER" || row.actor_role === "SUPER_ADMIN" ? "PARTNER"
        : row.actor_role === "ARTICLE" || row.actor_role === "ARTICLE_TRAINEE" || row.actor_role === "PAID_CA_MANAGER" ? "ARTICLE"
          : row.actor_role === "CLIENT" || row.actor_role?.startsWith("CLIENT_") ? "CLIENT" : "SYSTEM",
      entityName: row.entity_name, action: row.action, details: row.details, category: row.category,
    }));
    return NextResponse.json({ success: true, auditTrail });
  }
  const db = ensureDatabase();
  return NextResponse.json({ success: true, auditTrail: db.auditTrail });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actorName, actorRole, entityName, action, details, category } = body;

    if (process.env.NODE_ENV === "production") {
      const auth = await authenticateServerRequest(req);
      if (!auth.isAuthenticated || auth.role !== "PARTNER" || !auth.firmId || !auth.user) {
        return NextResponse.json({ success: false, error: "Partner access required." }, { status: 403 });
      }
      if (!entityName || !action || !details || !category) return NextResponse.json({ success: false, error: "Audit event fields are required." }, { status: 400 });
      const { data, error } = await writeServerAuditLog(req, auth, {
        entityId: body.entityId, entityName: String(entityName), action: String(action), details: String(details), category: String(category),
      });
      if (error || !data) return NextResponse.json({ success: false, error: "Audit event could not be saved." }, { status: 400 });
      return NextResponse.json({ success: true, log: {
        id: data.id, timestamp: data.created_at, actorName: data.actor_name, actorRole: auth.role,
        entityName: data.entity_name, action: data.action, details: data.details, category: data.category,
      } });
    }

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
