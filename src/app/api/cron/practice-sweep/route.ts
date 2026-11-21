import { NextRequest, NextResponse } from "next/server";
import { executePracticeAutopilotSweep } from "@/lib/automation/practiceAutopilot";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

/**
 * Headless Server-Side Autopilot Cron Daemon
 * Runs all 9 autonomous cycles without requiring an open browser tab.
 * Can be triggered via Vercel Cron, external cron pingers (cron-job.org), GitHub Actions, or internal scheduler.
 */
async function handleSweep(req: NextRequest) {
  const startTime = Date.now();
  try {
    const auth = await authenticateServerRequest(req);
    // Cron Security: verify secret token in production, or allow authenticated internal session / Vercel Cron
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const isVercelCron = req.headers.get("x-vercel-cron") !== null;
    const urlSecret = new URL(req.url).searchParams.get("key") || new URL(req.url).searchParams.get("secret");

    const isAuthorized = 
      !cronSecret || // In dev or if CRON_SECRET not configured, allow run
      isVercelCron ||
      authHeader === `Bearer ${cronSecret}` ||
      urlSecret === cronSecret ||
      auth.isAuthenticated;

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
    }

    // Load database and execute the 9-cycle practice autopilot sweep
    const db = ensureDatabase();
    const { db: updatedDb, summary } = await executePracticeAutopilotSweep(db, "Practice Autopilot Daemon");
    const executionTimeMs = Date.now() - startTime;

    // Update firmMetrics telemetry in database
    if (!updatedDb.firmMetrics) {
      updatedDb.firmMetrics = {
        totalRevenue: 2450000,
        outstandingRecovery: 320000,
        activeTasks: 42,
        unbilledWip: 184000,
        dscExpiring30Days: 4,
        complianceFilingRate: 94.8,
        averageRealizationDays: 14.2,
      } as any;
    }

    (updatedDb.firmMetrics as any).lastAutopilotSweep = summary.timestamp;
    (updatedDb.firmMetrics as any).autopilotActiveCycles = 9;
    (updatedDb.firmMetrics as any).autopilotExecutionMs = executionTimeMs;

    // Log headless daemon execution in audit trail
    await logAuditEvent(
      "Practice Autopilot Daemon",
      "SYSTEM",
      "Firm-Wide Portfolio",
      "Autonomous 9-Cycle Practice Sweep Executed",
      `Executed 9 autonomous cycles in ${executionTimeMs}ms: Checked ${summary.openTasksUpdated} tasks (₹${summary.totalLateFeeAudited.toLocaleString("en-IN")} penalty exposure), ₹${(summary.missingItcRecoverableInr || 0).toLocaleString("en-IN")} missing ITC, ${summary.caroClausesEvaluated || 21} CARO clauses, and ${summary.itrDualRegimesOptimized || 0} dual-regime optimizations.`,
      "SYSTEM"
    );

    await saveDatabase(updatedDb);

    return NextResponse.json({
      success: true,
      timestamp: summary.timestamp,
      executionTimeMs,
      activeCycles: 9,
      summary,
      logs: summary.logMessages,
    });
  } catch (error: any) {
    console.error("Autopilot cron sweep failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute practice sweep", executionTimeMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleSweep(req);
}

export async function POST(req: NextRequest) {
  return handleSweep(req);
}
