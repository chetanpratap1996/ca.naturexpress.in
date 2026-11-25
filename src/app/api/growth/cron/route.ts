import { NextRequest, NextResponse } from "next/server";
import { CadenceEngine } from "@/lib/intelligence/engine/cadenceEngine";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const providedSecret =
      searchParams.get("secret") || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);
    const expectedSecret = process.env.CRON_SECRET;

    const hasValidSecret = Boolean(expectedSecret) && providedSecret === expectedSecret;
    const isPartner = auth.isAuthenticated && auth.role === "PARTNER";

    if (process.env.NODE_ENV === "production" && !hasValidSecret && !isPartner) {
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
