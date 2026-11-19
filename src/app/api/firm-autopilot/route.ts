import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { executePracticeAutopilotSweep } from "@/lib/automation/practiceAutopilot";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const db = ensureDatabase();

    // Summarize current autonomous posture
    const openTasks = (db.tasks || []).filter((t) => t.status !== "FILED_AND_COMPLETED");
    const overdueTasks = openTasks.filter((t) => new Date(t.dueDate).getTime() < Date.now());
    const totalLateFee = overdueTasks.reduce((acc, t) => acc + (t.penaltyRisk || 0), 0);
    const lockedDeliverableCount = (db.payToReleaseConfigs || []).filter((c) => c.isLocked).length;
    const unpaidInvoices = (db.invoices || []).filter((i) => i.status !== "PAID");
    const totalReceivables = unpaidInvoices.reduce((acc, i) => acc + i.amount, 0);

    const latestAutopilotLog = (db.auditTrail || []).find((l) => l.action === "AUTOPILOT_SWEEP_EXECUTED");

    return NextResponse.json({
      success: true,
      posture: {
        totalClients: db.clients?.length || 0,
        activeTasks: openTasks.length,
        overdueTasks: overdueTasks.length,
        totalLateFeeTracked: totalLateFee,
        lockedDeliverablesCount: lockedDeliverableCount,
        unpaidInvoicesCount: unpaidInvoices.length,
        totalReceivables,
        lastSweepAt: latestAutopilotLog?.timestamp || null,
        lastSweepSummary: latestAutopilotLog?.details || "No sweep executed yet.",
      },
    });
  } catch (error: any) {
    console.error("Autopilot GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    // Allow cron invocations with bearer token or authenticated partner
    const isCronHeader = request.headers.get("x-vercel-cron") || request.headers.get("authorization")?.includes("Bearer");

    if (!isCronHeader && (!auth.isAuthenticated || auth.role !== "PARTNER")) {
      return NextResponse.json({ success: false, error: "Only CA Partners or Autonomous Schedulers can trigger Autopilot" }, { status: 403 });
    }

    const db = ensureDatabase();
    const actorName = auth.userName || "Managing Partner (Manual Sweep)";

    const { db: updatedDb, summary } = await executePracticeAutopilotSweep(db, actorName);
    await saveDatabase(updatedDb);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("Autopilot POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
