import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { 
  getSampleAssemblyProfiles, 
  resolvePartnerException, 
  ClientAssemblyProfile 
} from "@/lib/gst/autonomousAssemblyLine";
import { logAuditEvent, createNotification } from "@/lib/server/db";

// In-memory runtime cache for the session (initialized with institutional sample profiles)
let runtimeProfiles: ClientAssemblyProfile[] = getSampleAssemblyProfiles();

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (clientId) {
      const profile = runtimeProfiles.find((p) => p.clientId === clientId);
      if (!profile) {
        return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, profile });
    }

    return NextResponse.json({
      success: true,
      profiles: runtimeProfiles,
      metrics: {
        totalProfiles: runtimeProfiles.length,
        cleanAutoDispatched: runtimeProfiles.filter((p) => p.status === "CLEAN_AUTO_DISPATCHED").length,
        needsPartnerTriage: runtimeProfiles.filter((p) => p.status === "NEEDS_PARTNER_TRIAGE").length,
        totalExceptionsPending: runtimeProfiles.reduce((acc, p) => acc + p.exceptionsCount, 0),
        totalTaxPayableInr: runtimeProfiles.reduce((acc, p) => acc + p.computation.offset.totalCashPayable, 0),
      },
    });
  } catch (error: any) {
    console.error("Assembly Line GET error:", error);
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
      const profileIndex = runtimeProfiles.findIndex((p) => p.clientId === clientId);
      if (profileIndex === -1) {
        return NextResponse.json({ success: false, error: "Client profile not found" }, { status: 404 });
      }

      const updatedProfile = resolvePartnerException(
        runtimeProfiles[profileIndex],
        exceptionId,
        resolutionAction,
        partnerNote
      );

      runtimeProfiles[profileIndex] = updatedProfile;

      // Log cryptographic ICAI SA 500 audit trail
      await logAuditEvent(
        auth.userName || "CA Partner",
        "PARTNER",
        updatedProfile.clientName,
        "GST_EXCEPTION_RESOLVED",
        `Partner resolved GST Exception ${exceptionId} with action [${resolutionAction}]. Remaining exceptions: ${updatedProfile.exceptionsCount}.`,
        "COMPLIANCE"
      );

      return NextResponse.json({
        success: true,
        profile: updatedProfile,
        message: `Exception ${exceptionId} resolved successfully with [${resolutionAction}].`,
      });
    }

    if (action === "RESET_PROFILES") {
      runtimeProfiles = getSampleAssemblyProfiles();
      return NextResponse.json({
        success: true,
        profiles: runtimeProfiles,
        message: "Assembly line profiles reset to institutional baseline.",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Assembly Line POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
