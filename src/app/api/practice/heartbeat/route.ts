import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";
import {
  getPostgresHeartbeatState,
  executePostgresHeartbeatSweep,
  batchApproveCleanFilingsPg,
  resolvePartnerExceptionPg,
} from "@/lib/autopilot/practiceHeartbeatEngine";

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
    const state = await getPostgresHeartbeatState(firmId);
    return NextResponse.json({ success: true, data: state });
  } catch (error: any) {
    console.error("[API_HEARTBEAT_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch practice heartbeat state" },
      { status: 500 }
    );
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
    const body = await request.json();
    const { action, exceptionId } = body;
    const actorName = auth.userName || "Managing Partner";

    if (action === "RUN_GLOBAL_SWEEP") {
      const updatedState = await executePostgresHeartbeatSweep(firmId, actorName);
      return NextResponse.json({
        success: true,
        data: {
          state: updatedState,
          message: "PostgreSQL autonomous practice sweep executed across all linked modules.",
        },
      });
    }

    if (action === "BATCH_APPROVE_CLEAN") {
      const approvalResult = await batchApproveCleanFilingsPg(firmId, auth.user?.id, actorName);
      const updatedState = await getPostgresHeartbeatState(firmId);
      return NextResponse.json({
        success: true,
        data: {
          approvalResult,
          state: updatedState,
          message:
            approvalResult.approvedCount > 0
              ? `Batch filed ${approvalResult.approvedCount} clean return(s) and drafted ${approvalResult.invoicesDrafted} invoice(s).`
              : "No tasks currently in Manager Review / Partner Sign-Off eligible for batch approval.",
        },
      });
    }

    if (action === "RESOLVE_EXCEPTION" && typeof exceptionId === "string" && exceptionId.trim()) {
      const res = await resolvePartnerExceptionPg({
        firmId,
        exceptionId: exceptionId.trim(),
        actorId: auth.user?.id,
        actorName,
      });
      return NextResponse.json({
        success: true,
        data: {
          state: res.state,
          exceptions: res.state.exceptions,
          message: res.actionMessage,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API_HEARTBEAT_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Heartbeat action failed" },
      { status: 500 }
    );
  }
}
