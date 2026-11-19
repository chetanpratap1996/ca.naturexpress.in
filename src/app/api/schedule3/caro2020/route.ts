import { NextRequest, NextResponse } from "next/server";
import { Caro2020Engine, DEFAULT_CARO_2020_CLAUSES } from "@/lib/schedule3/caro2020Engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientName = searchParams.get("clientName") || "Apex AutoTech Private Limited";
    const cin = searchParams.get("cin") || "U29100MP2015PTC034120";
    const fy = searchParams.get("fy") || "FY 2025-26";
    const ay = searchParams.get("ay") || "AY 2026-27";

    const result = Caro2020Engine.evaluateTrialBalance(
      clientName,
      cin,
      fy,
      ay,
      {
        patCY: 28450000,
        depreciationCY: 4820000,
        patPY: 21800000,
        depreciationPY: 4450000,
        sanctionedWorkingCapitalLimitInr: 125000000,
        currentAssetsCY: 152000000,
        currentLiabilitiesCY: 90500000,
        debtEquityRatio: 0.58,
        undisputedStatutoryDuesOver6Months: 0
      }
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process CARO 2020 request" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName = "Apex AutoTech Private Limited",
      cin = "U29100MP2015PTC034120",
      fy = "FY 2025-26",
      ay = "AY 2026-27",
      financialMetrics
    } = body;

    const result = Caro2020Engine.evaluateTrialBalance(
      clientName,
      cin,
      fy,
      ay,
      financialMetrics || {
        patCY: 28450000,
        depreciationCY: 4820000,
        patPY: 21800000,
        depreciationPY: 4450000,
        sanctionedWorkingCapitalLimitInr: 125000000,
        currentAssetsCY: 152000000,
        currentLiabilitiesCY: 90500000,
        debtEquityRatio: 0.58
      }
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute CARO 2020 audit" },
      { status: 500 }
    );
  }
}
