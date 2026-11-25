import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { resolveFirmUuid, listWorkspaceRecords } from "@/lib/server/pgHelpers";

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
    const noticeRecs = await listWorkspaceRecords<any>(firmId, "NOTICE_RECORD");

    return NextResponse.json({
      success: true,
      profiles: [],
      notices: noticeRecs.map((r) => r.payload),
      daemonStatus: {
        configured: false,
        message: "Live government portal APIs (GSTN / ITBA / MCA V3) require external GSP/ERI credentials.",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: "PORTAL_GATEWAY_NOT_CONFIGURED",
        error:
          "Live GSTN / ITBA / MCA portal automation is disabled until authenticated department credentials and GSP/ERI integration are configured.",
      },
      { status: 503 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
