import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { 
  getSampleMcaProfiles, 
  resolveMcaException, 
  McaClientAssemblyProfile 
} from "@/lib/mca/autonomousMcaEngine";
import { logAuditEvent, createNotification } from "@/lib/server/db";

// In-memory runtime cache for the session (initialized with institutional sample profiles)
let runtimeMcaProfiles: McaClientAssemblyProfile[] = getSampleMcaProfiles();

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (clientId) {
      const profile = runtimeMcaProfiles.find((p) => p.clientId === clientId);
      if (!profile) {
        return NextResponse.json({ success: false, error: "MCA profile not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, profile });
    }

    return NextResponse.json({
      success: true,
      profiles: runtimeMcaProfiles,
      metrics: {
        totalProfiles: runtimeMcaProfiles.length,
        cleanAutoDispatched: runtimeMcaProfiles.filter((p) => p.status === "CLEAN_AUTO_DISPATCHED").length,
        needsPartnerTriage: runtimeMcaProfiles.filter((p) => p.status === "NEEDS_PARTNER_TRIAGE").length,
        totalExceptionsPending: runtimeMcaProfiles.reduce((acc, p) => acc + p.exceptionsCount, 0),
        totalLateFeesAccrued: runtimeMcaProfiles.reduce((acc, p) => acc + p.sec403LateFeesAccrued, 0),
      },
    });
  } catch (error: any) {
    console.error("MCA Pipeline GET error:", error);
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
    const { action, clientId, exceptionId, resolutionAction, partnerNote } = body;

    if (action === "RESOLVE_EXCEPTION") {
      const profileIndex = runtimeMcaProfiles.findIndex((p) => p.clientId === clientId);
      if (profileIndex === -1) {
        return NextResponse.json({ success: false, error: "Client profile not found" }, { status: 404 });
      }

      const updatedProfile = resolveMcaException(
        runtimeMcaProfiles[profileIndex],
        exceptionId,
        resolutionAction,
        partnerNote
      );

      runtimeMcaProfiles[profileIndex] = updatedProfile;

      // Log cryptographic ICAI SA 500 audit trail
      await logAuditEvent(
        auth.userName || "CA Partner",
        "PARTNER",
        updatedProfile.clientName,
        "MCA_EXCEPTION_RESOLVED",
        `Partner resolved secretarial exception ${exceptionId} with action [${resolutionAction}]. Remaining exceptions: ${updatedProfile.exceptionsCount}.`,
        "COMPLIANCE"
      );

      return NextResponse.json({
        success: true,
        profile: updatedProfile,
        message: `Secretarial exception ${exceptionId} resolved successfully with [${resolutionAction}].`,
      });
    }

    if (action === "RESET_PROFILES") {
      runtimeMcaProfiles = getSampleMcaProfiles();
      return NextResponse.json({
        success: true,
        profiles: runtimeMcaProfiles,
        message: "MCA profiles reset to institutional baseline.",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("MCA Pipeline POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
