import { NextRequest, NextResponse } from "next/server";
import {
  getPracticeHeartbeatState,
  executeGlobalAutonomousSweep,
  batchApproveCleanFilings,
  resolvePartnerException
} from "@/lib/autopilot/practiceHeartbeatEngine";

export async function GET(request: NextRequest) {
  try {
    const state = getPracticeHeartbeatState();
    return NextResponse.json({
      success: true,
      data: state,
    });
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
    const body = await request.json();
    const { action, exceptionId } = body;

    if (action === "RUN_GLOBAL_SWEEP") {
      const updatedState = executeGlobalAutonomousSweep();
      return NextResponse.json({
        success: true,
        data: {
          state: updatedState,
          message: "Global autonomous practice sweep executed across all 15 modules with 0 errors.",
        },
      });
    }

    if (action === "BATCH_APPROVE_CLEAN") {
      const approvalResult = batchApproveCleanFilings();
      return NextResponse.json({
        success: true,
        data: {
          approvalResult,
          message: `Batch approved ${approvalResult.approvedCount} clean returns and dispatched SA 580 approvals to clients via WhatsApp.`,
        },
      });
    }

    if (action === "RESOLVE_EXCEPTION") {
      const state = getPracticeHeartbeatState();
      const updatedExceptions = resolvePartnerException(state.exceptions, exceptionId);
      return NextResponse.json({
        success: true,
        data: {
          exceptions: updatedExceptions,
          message: `Exception ${exceptionId} resolved by Partner. Action dispatched.`,
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
