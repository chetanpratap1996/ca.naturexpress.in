import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_RECORD_TYPES = new Set(["UDIN_ENTRY", "ASSESSEE_APPROVAL"]);

async function verifyEntityScope(auth: any, firmId: string, entityId?: string | null) {
  if (!entityId || !UUID_REGEX.test(entityId)) return true;
  if (auth.role !== "CLIENT") return true;
  const pool = getPostgresPool();
  const { rows } = await pool.query(
    "SELECT id, group_id FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
    [entityId, firmId]
  );
  if (rows.length === 0) return false;
  const row = rows[0];
  return (
    (auth.clientEntityId && auth.clientEntityId === row.id) ||
    (auth.clientGroupId && row.group_id && auth.clientGroupId === row.group_id)
  );
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recordType = searchParams.get("recordType") || "";
    const entityId = searchParams.get("entityId");

    if (!ALLOWED_RECORD_TYPES.has(recordType)) {
      return NextResponse.json({ success: false, error: "Unsupported governance recordType." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const allowed = await verifyEntityScope(auth, firmId, entityId);
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Unauthorized entity access." }, { status: 403 });
    }

    const rows = await listWorkspaceRecords(firmId, recordType, entityId && UUID_REGEX.test(entityId) ? entityId : undefined);
    const records = rows.map((r) => r.payload);
    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    console.error("GET /api/governance/records error:", error);
    return NextResponse.json({ success: false, error: "Failed to load governance records." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const recordType = typeof body.recordType === "string" ? body.recordType : "";
    const entityId = typeof body.entityId === "string" ? body.entityId : null;
    const payload = body.payload;

    if (!ALLOWED_RECORD_TYPES.has(recordType) || !payload || typeof payload !== "object" || !payload.id) {
      return NextResponse.json({ success: false, error: "recordType and payload.id are required." }, { status: 400 });
    }

    if (auth.role === "CLIENT" && recordType !== "ASSESSEE_APPROVAL") {
      return NextResponse.json({ success: false, error: "Staff authorization required." }, { status: 403 });
    }

    const firmId = await resolveFirmUuid(auth);
    const allowed = await verifyEntityScope(auth, firmId, entityId);
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Unauthorized entity access." }, { status: 403 });
    }

    const savedId = await upsertWorkspaceRecord({
      firmId,
      entityId: entityId && UUID_REGEX.test(entityId) ? entityId : null,
      recordType,
      matchKey: "id",
      matchValue: String(payload.id),
      payload,
    });

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Practice Staff",
      actorRole: auth.role,
      entityId: entityId && UUID_REGEX.test(entityId) ? entityId : null,
      entityName: payload.clientName || "Client Entity",
      action: `${recordType} Saved`,
      details: `Saved ${recordType} record (${payload.id}) for ${payload.documentTitle || "compliance item"}.`,
      category: "SYSTEM",
    });

    return NextResponse.json({ success: true, id: savedId, record: payload });
  } catch (error: any) {
    console.error("POST /api/governance/records error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save record." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json({ success: false, error: "Staff authorization required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const recordType = searchParams.get("recordType") || "";
    const id = searchParams.get("id") || "";
    if (!ALLOWED_RECORD_TYPES.has(recordType) || !id) {
      return NextResponse.json({ success: false, error: "recordType and id are required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await pool.query(
      `DELETE FROM public.firm_workspace_records
       WHERE firm_id = $1 AND record_type = $2 AND payload->>'id' = $3`,
      [firmId, recordType, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/governance/records error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete governance record." }, { status: 500 });
  }
}
