import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { executeAutonomousWorkDispatcher } from "@/lib/tasks/autonomousDispatcher";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Managing Partner privileges required to trigger autonomous dispatch." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const result = await executeAutonomousWorkDispatcher(auth.user?.firmId || "FRM-024310C");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/tasks/auto-assign error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
