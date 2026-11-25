import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { Schedule3ComplianceEngine } from "@/lib/schedule3/schedule3ComplianceEngine";

export async function GET(req: NextRequest) {
  const { errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  try {
    const dossier = Schedule3ComplianceEngine.getDefaultDossier();
    return NextResponse.json({
      success: true,
      data: dossier
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Schedule III dossier" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  try {
    const body = await req.json();
    const { metrics } = body;

    if (!metrics) {
      return NextResponse.json(
        { success: false, error: "Financial metrics are required" },
        { status: 400 }
      );
    }

    const ratios = Schedule3ComplianceEngine.computeMandatoryRatios(metrics);
    const materialCount = ratios.filter(r => r.isVarianceMaterial).length;

    return NextResponse.json({
      success: true,
      data: {
        ratios,
        materialVarianceCount: materialCount
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate Schedule III ratios" },
      { status: 500 }
    );
  }
}
