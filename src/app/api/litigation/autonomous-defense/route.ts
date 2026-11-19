import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { 
  getSampleNoticeDockets, 
  approveNoticeDefense, 
  NoticeDocketItem 
} from "@/lib/litigation/autonomousNoticeEngine";
import { logAuditEvent, createNotification } from "@/lib/server/db";

// In-memory runtime cache for the session (initialized with institutional sample dockets)
let runtimeNoticeDockets: NoticeDocketItem[] = getSampleNoticeDockets();

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const docketId = searchParams.get("docketId");
    const clientId = searchParams.get("clientId");

    if (docketId) {
      const docket = runtimeNoticeDockets.find((d) => d.id === docketId);
      if (!docket) {
        return NextResponse.json({ success: false, error: "Docket not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, docket });
    }

    if (clientId) {
      const dockets = runtimeNoticeDockets.filter((d) => d.clientId === clientId);
      return NextResponse.json({ success: true, dockets });
    }

    return NextResponse.json({
      success: true,
      dockets: runtimeNoticeDockets,
      metrics: {
        totalDockets: runtimeNoticeDockets.length,
        readyForApproval: runtimeNoticeDockets.filter((d) => d.defenseStatus === "DRAFT_READY").length,
        fatalDinDefects: runtimeNoticeDockets.filter((d) => d.dinStatus === "MISSING_DIN_FATAL").length,
        totalDemandAtStakeInr: runtimeNoticeDockets.reduce((acc, d) => acc + d.allegedDemandInr, 0),
        urgentLimitationCount: runtimeNoticeDockets.filter((d) => d.daysRemaining <= 15).length,
      },
    });
  } catch (error: any) {
    console.error("Notice Defense GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action, docketId, partnerNote } = body;

    if (action === "APPROVE_DEFENSE") {
      const docketIndex = runtimeNoticeDockets.findIndex((d) => d.id === docketId);
      if (docketIndex === -1) {
        return NextResponse.json({ success: false, error: "Notice docket not found" }, { status: 404 });
      }

      runtimeNoticeDockets = approveNoticeDefense(runtimeNoticeDockets, docketId, partnerNote);
      const approvedDocket = runtimeNoticeDockets.find((d) => d.id === docketId)!;

      // Log cryptographic ICAI SA 500 audit trail
      await logAuditEvent(
        auth.userName || "CA Partner",
        "PARTNER",
        approvedDocket.clientName,
        "NOTICE_DEFENSE_APPROVED",
        `Partner approved legal defense brief for notice ${approvedDocket.section} (Demand: ₹${approvedDocket.allegedDemandInr.toLocaleString('en-IN')}). Ready for portal upload.`,
        "COMPLIANCE"
      );

      return NextResponse.json({
        success: true,
        docket: approvedDocket,
        message: `Defense brief for docket ${docketId} approved successfully by Partner.`,
      });
    }

    if (action === "RESET_DOCKETS") {
      runtimeNoticeDockets = getSampleNoticeDockets();
      return NextResponse.json({
        success: true,
        dockets: runtimeNoticeDockets,
        message: "Notice dockets reset to institutional baseline.",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Notice Defense POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
