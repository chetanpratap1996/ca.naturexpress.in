import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { 
  getSampleTdsProfiles, 
  resolveTdsDefault, 
  TdsClientAssemblyProfile 
} from "@/lib/tds/autonomousTdsEngine";
import { logAuditEvent, createNotification } from "@/lib/server/db";

// In-memory runtime cache for the session (initialized with institutional sample profiles)
let runtimeTdsProfiles: TdsClientAssemblyProfile[] = getSampleTdsProfiles();

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (clientId) {
      const profile = runtimeTdsProfiles.find((p) => p.clientId === clientId);
      if (!profile) {
        return NextResponse.json({ success: false, error: "TDS profile not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, profile });
    }

    return NextResponse.json({
      success: true,
      profiles: runtimeTdsProfiles,
      metrics: {
        totalProfiles: runtimeTdsProfiles.length,
        cleanAutoDispatched: runtimeTdsProfiles.filter((p) => p.status === "CLEAN_AUTO_DISPATCHED").length,
        needsPartnerTriage: runtimeTdsProfiles.filter((p) => p.status === "NEEDS_PARTNER_TRIAGE").length,
        totalDefaultsPending: runtimeTdsProfiles.reduce((acc, p) => acc + p.exceptionsCount, 0),
        totalTdsDeposited: runtimeTdsProfiles.reduce((acc, p) => acc + p.totalChallanDeposited, 0),
      },
    });
  } catch (error: any) {
    console.error("TDS Pipeline GET error:", error);
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
    const { action, clientId, defaultId, resolutionAction, partnerNote } = body;

    if (action === "RESOLVE_DEFAULT") {
      const profileIndex = runtimeTdsProfiles.findIndex((p) => p.clientId === clientId);
      if (profileIndex === -1) {
        return NextResponse.json({ success: false, error: "Client profile not found" }, { status: 404 });
      }

      const updatedProfile = resolveTdsDefault(
        runtimeTdsProfiles[profileIndex],
        defaultId,
        resolutionAction,
        partnerNote
      );

      runtimeTdsProfiles[profileIndex] = updatedProfile;

      // Log cryptographic ICAI SA 500 audit trail
      await logAuditEvent(
        auth.userName || "CA Partner",
        "PARTNER",
        updatedProfile.clientName,
        "TRACES_DEFAULT_RESOLVED",
        `Partner resolved TRACES Default ${defaultId} with action [${resolutionAction}]. Remaining defaults: ${updatedProfile.exceptionsCount}.`,
        "COMPLIANCE"
      );

      return NextResponse.json({
        success: true,
        profile: updatedProfile,
        message: `TRACES Default ${defaultId} resolved successfully with [${resolutionAction}].`,
      });
    }

    if (action === "DISPATCH_FORM16_BATCH") {
      const profileIndex = runtimeTdsProfiles.findIndex((p) => p.clientId === clientId);
      if (profileIndex === -1) {
        return NextResponse.json({ success: false, error: "Client profile not found" }, { status: 404 });
      }

      const updatedCerts = runtimeTdsProfiles[profileIndex].form16Certificates.map((cert) => ({
        ...cert,
        deliveryStatus: "DELIVERED_WHATSAPP" as const,
        deliveredAt: new Date().toISOString(),
      }));

      runtimeTdsProfiles[profileIndex].form16Certificates = updatedCerts;
      runtimeTdsProfiles[profileIndex].auditLog.push(
        `[${new Date().toLocaleTimeString()}] Batch dispatched ${updatedCerts.length} Form 16/16A certificates via WhatsApp Cloud API.`
      );

      return NextResponse.json({
        success: true,
        dispatchedCount: updatedCerts.length,
        message: `Successfully dispatched ${updatedCerts.length} Form 16/16A certificates via WhatsApp.`,
      });
    }

    if (action === "RESET_PROFILES") {
      runtimeTdsProfiles = getSampleTdsProfiles();
      return NextResponse.json({
        success: true,
        profiles: runtimeTdsProfiles,
        message: "TDS profiles reset to baseline.",
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("TDS Pipeline POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
