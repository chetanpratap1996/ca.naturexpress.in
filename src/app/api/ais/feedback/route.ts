import { NextRequest, NextResponse } from "next/server";
import { InsightNoticeForecaster, AisPortalFeedbackPayload } from "@/lib/ais/insightNoticeForecaster";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pan, taxpayerName, financialYear, assessmentYear, discrepantItems, unexplainedCashAmountInr, totalUnreportedIncomeInr } = body;

    if (!pan || !taxpayerName || !Array.isArray(discrepantItems)) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: pan, taxpayerName, discrepantItems"
      }, { status: 400 });
    }

    const forecast = InsightNoticeForecaster.forecastNoticeExposure({
      pan,
      taxpayerName,
      financialYear: financialYear || "FY 2025-26",
      assessmentYear: assessmentYear || "AY 2026-27",
      totalUnreportedIncomeInr: Number(totalUnreportedIncomeInr || 0),
      totalDiscrepancyAmountInr: 0,
      hasUnexplainedCashSft: Number(unexplainedCashAmountInr || 0) > 0,
      unexplainedCashAmountInr: Number(unexplainedCashAmountInr || 0),
      unclaimedTdsInr: 0,
      discrepantItems
    });

    return NextResponse.json({
      success: true,
      forecast
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to generate AIS feedback"
    }, { status: 500 });
  }
}
