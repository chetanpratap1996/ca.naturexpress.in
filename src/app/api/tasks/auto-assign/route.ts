import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { executeAutonomousWorkDispatcher } from "@/lib/tasks/autonomousDispatcher";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Managing Partner privileges required to trigger autonomous dispatch." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const result = await executeAutonomousWorkDispatcher(firmId, auth.user?.id, auth.userName || "Managing Partner");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/tasks/auto-assign error:", error);
    return NextResponse.json({ success: false, error: error.message || "Auto-assign failed." }, { status: 500 });
  }
}
