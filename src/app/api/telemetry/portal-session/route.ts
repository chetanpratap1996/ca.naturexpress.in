import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, gstinOrPan, portalType, durationMinutes = 0 } = body;

    const db = ensureDatabase();
    let updatedTask = false;

    if (taskId && db.tasks) {
      const task = db.tasks.find((t) => t.id === taskId);
      if (task) {
        task.portalSessionMinutes = (task.portalSessionMinutes || 0) + Math.round(Number(durationMinutes));
        updatedTask = true;
      }
    } else if (gstinOrPan && db.tasks) {
      // Find open task matching GSTIN or PAN
      const cleanTarget = String(gstinOrPan).toUpperCase().trim();
      const task = db.tasks.find(
        (t) =>
          t.status !== "FILED_AND_COMPLETED" &&
          (t.gstin?.toUpperCase() === cleanTarget || t.pan?.toUpperCase() === cleanTarget)
      );
      if (task) {
        task.portalSessionMinutes = (task.portalSessionMinutes || 0) + Math.round(Number(durationMinutes));
        updatedTask = true;
      }
    }

    if (updatedTask) {
      await saveDatabase(db);
    }

    return NextResponse.json({
      success: true,
      message: `Telemetry session recorded: ${durationMinutes} mins on ${portalType || "Govt Portal"}.`,
    });
  } catch (error: any) {
    console.error("POST /api/telemetry/portal-session error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
