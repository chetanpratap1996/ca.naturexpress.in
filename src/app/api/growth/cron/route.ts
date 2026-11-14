import { NextRequest, NextResponse } from "next/server";
import { CadenceEngine } from "@/lib/intelligence/engine/cadenceEngine";

export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const isVercelCron = req.headers.get("x-vercel-cron") !== null;
    const providedSecret = searchParams.get("secret") || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
    const expectedSecret = process.env.CRON_SECRET || "brains_and_taxes_cadence_secret_2026";

    // Allow execution if Vercel Cron, valid secret, or local development
    const isAuthorized = 
      isVercelCron || 
      providedSecret === expectedSecret || 
      process.env.NODE_ENV !== "production" || 
      searchParams.get("allowDev") === "true";

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized cron execution request." },
        { status: 401 }
      );
    }

    const stateOverride = searchParams.get("state") || undefined;
    const batchSize = searchParams.get("batch") ? parseInt(searchParams.get("batch")!, 10) : 3;

    const result = await CadenceEngine.executeScheduledCadence(stateOverride, batchSize);

    return NextResponse.json({
      success: true,
      message: "Cadence routine executed successfully",
      result,
    });
  } catch (error: any) {
    console.error("Cadence cron execution failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute cadence cycle" },
      { status: 500 }
    );
  }
}
