import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";
import { executePostgresAutopilotSweep } from "@/lib/automation/postgresAutopilot";
import { runBillingAutopilotForFirm } from "@/lib/automation/billingAutopilotCron";

async function handleSweep(req: NextRequest) {
  const startTime = Date.now();
  try {
    const auth = await authenticateServerRequest(req);
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const urlSecret = new URL(req.url).searchParams.get("key") || new URL(req.url).searchParams.get("secret");

    if (process.env.NODE_ENV === "production" && !cronSecret && !auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "CRON_SECRET not configured." }, { status: 503 });
    }

    const hasValidCronSecret =
      Boolean(cronSecret) && (authHeader === `Bearer ${cronSecret}` || urlSecret === cronSecret);
    const isPartner = auth.isAuthenticated && auth.role === "PARTNER";

    if (!hasValidCronSecret && !isPartner) {
      return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: auth.isAuthenticated ? 403 : 401 });
    }

    const pool = getPostgresPool();
    let targetFirmIds: string[] = [];

    if (isPartner && !hasValidCronSecret) {
      targetFirmIds = [await resolveFirmUuid(auth)];
    } else {
      const { rows } = await pool.query("SELECT id FROM public.firms ORDER BY created_at ASC");
      targetFirmIds = rows.map((r: any) => r.id);
    }

    const triggeredBy = isPartner ? auth.userName || "Partner Manual Cron" : "Scheduled Practice Autopilot Cron";
    const results = [];
    for (const fId of targetFirmIds) {
      const [res, billingRes] = await Promise.all([
        executePostgresAutopilotSweep(fId, triggeredBy),
        runBillingAutopilotForFirm(pool, fId, triggeredBy),
      ]);
      results.push({ firmId: fId, summary: res.summary, billing: billingRes });
    }

    const executionTimeMs = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      executionTimeMs,
      firmsProcessed: results.length,
      summary: results[0]?.summary || null,
      results,
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
