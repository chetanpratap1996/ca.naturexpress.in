import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog } from "@/lib/server/pgHelpers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await req.json();
    const { taskId, portalType, durationMinutes = 0 } = body;

    if (taskId && UUID_REGEX.test(String(taskId))) {
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Staff",
        actorRole: auth.role,
        entityName: portalType || "Govt Portal",
        action: "Portal Telemetry Session",
        details: `Task ${taskId}: ${Math.round(Number(durationMinutes) || 0)} mins on ${portalType || "Govt Portal"}.`,
        category: "SYSTEM",
      });
    } else {
      await pool.query("SELECT 1");
    }

    return NextResponse.json({
      success: true,
      message: `Telemetry session recorded: ${Math.round(Number(durationMinutes) || 0)} mins on ${portalType || "Govt Portal"}.`,
    });
  } catch (error: any) {
    console.error("POST /api/telemetry/portal-session error:", error);
    return NextResponse.json({ success: false, error: "Failed to record portal telemetry." }, { status: 500 });
  }
}
