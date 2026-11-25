import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { appendPgAuditLog, resolveFirmUuid } from "@/lib/server/pgHelpers";
import {
  executePostgresAutopilotSweep,
  getPostgresAutopilotPosture,
  saveAutopilotPolicy,
} from "@/lib/automation/postgresAutopilot";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const data = await getPostgresAutopilotPosture(firmId);

    return NextResponse.json({
      success: true,
      posture: data.posture,
      summary: data.summary,
      policy: data.policy,
    });
  } catch (error: any) {
    console.error("Autopilot GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const actorName = auth.userName || "Managing Partner (Autopilot Sweep)";
    const result = await executePostgresAutopilotSweep(firmId, actorName);

    return NextResponse.json({
      success: true,
      summary: result.summary,
      policy: result.policy,
      heartbeat: result.heartbeat,
    });
  } catch (error: any) {
    console.error("Autopilot POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner authorization required to configure Autopilot policy." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await request.json();
    const firmId = await resolveFirmUuid(auth);
    const actorName = auth.userName || "Managing Partner";
    const policy = await saveAutopilotPolicy(firmId, body, actorName);

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName,
      actorRole: "PARTNER",
      entityName: "Practice Autopilot Policy",
      action: "AUTOPILOT_POLICY_UPDATED",
      details: `Updated Autopilot guardrails (enabled=${policy.enabled}, autoSpawn=${policy.autoSpawnTasks}, autoAssign=${policy.autoAssignStaff}, autoAdvanceDocs=${policy.autoAdvanceDocs}, autoDraftInvoices=${policy.autoDraftInvoices}, grace=${policy.gracePeriodDays}d).`,
      category: "SYSTEM",
    });

    return NextResponse.json({ success: true, policy });
  } catch (error: any) {
    console.error("Autopilot PUT policy error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
