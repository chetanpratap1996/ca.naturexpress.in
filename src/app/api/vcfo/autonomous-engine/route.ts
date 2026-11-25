import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import {
  getCorporateVcfoProfiles,
  getPracticeIntelligenceSummary,
  compileVcfoBoardDossier,
  generateScopeExpansionNotice,
  generate13WeekCashFlow,
  generateCmaDocket,
  WeeklyCashFlowBucket
} from "@/lib/vcfo/autonomousVcfoEngine";

export async function GET(request: NextRequest) {
  const { errorResponse } = await enforceApiRole(request, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  try {
    const vcfoProfiles = getCorporateVcfoProfiles();
    const practiceSummary = getPracticeIntelligenceSummary();

    return NextResponse.json({
      success: true,
      data: {
        vcfoProfiles,
        practiceSummary,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[API_VCFO_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch vCFO intelligence data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { errorResponse } = await enforceApiRole(request, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  try {
    const body = await request.json();
    const { action, clientId, stressParams } = body;

    const vcfoProfiles = getCorporateVcfoProfiles();
    const practiceSummary = getPracticeIntelligenceSummary();

    if (action === "EXPORT_BOARD_DOSSIER") {
      const profile = vcfoProfiles.find((p) => p.clientId === clientId) || vcfoProfiles[0];
      const dossierText = compileVcfoBoardDossier(profile);
      return NextResponse.json({
        success: true,
        data: {
          clientId: profile.clientId,
          clientName: profile.clientName,
          dossierText,
          exportedAt: new Date().toISOString(),
        },
      });
    }

    if (action === "EXPORT_CMA_DOCKET") {
      const profile = vcfoProfiles.find((p) => p.clientId === clientId) || vcfoProfiles[0];
      const cmaDocket = generateCmaDocket(profile);
      return NextResponse.json({
        success: true,
        data: {
          clientId: profile.clientId,
          clientName: profile.clientName,
          cmaDocket,
          exportedAt: new Date().toISOString(),
        },
      });
    }

    if (action === "GENERATE_SCOPE_NOTICE") {
      const client = practiceSummary.clientProfitabilityList.find((c) => c.clientId === clientId);
      if (!client) {
        return NextResponse.json({ success: false, error: "Client not found in practice directory" }, { status: 404 });
      }
      const noticeText = generateScopeExpansionNotice(client);
      return NextResponse.json({
        success: true,
        data: {
          clientId: client.clientId,
          clientName: client.clientName,
          noticeText,
          suggestedHikePercent: 28,
        },
      });
    }

    if (action === "RUN_STRESS_TEST") {
      const { revenueDropPercent = 15, debtorDelayDays = 20, opexInflationPercent = 10 } = stressParams || {};
      const baseProfile = vcfoProfiles.find((p) => p.clientId === clientId) || vcfoProfiles[0];

      const adjustedWeeklyBilling = (baseProfile.annualTurnoverInr / 52) * (1 - revenueDropPercent / 100);
      const adjustedDso = baseProfile.workingCapital.dsoDays + debtorDelayDays;
      const adjustedOpex = baseProfile.monthlyBurnRateInr * (1 + opexInflationPercent / 100);

      const stressedCashFlows: WeeklyCashFlowBucket[] = generate13WeekCashFlow(
        baseProfile.weeklyCashFlows[0]?.closingLiquidity || 3000000,
        adjustedWeeklyBilling,
        adjustedDso,
        adjustedOpex,
        baseProfile.weeklyCashFlows[0]?.debtServiceOutflow * 4.33 || 1000000
      );

      const minLiquidity = Math.min(...stressedCashFlows.map((w) => w.closingLiquidity));
      const deficitWeeksCount = stressedCashFlows.filter((w) => w.isDeficitAlert).length;

      return NextResponse.json({
        success: true,
        data: {
          stressedCashFlows,
          minLiquidity,
          deficitWeeksCount,
          runwayRiskLevel: deficitWeeksCount > 4 ? "CRITICAL" : deficitWeeksCount > 0 ? "ELEVATED" : "MODERATE",
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("[API_VCFO_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process vCFO request" },
      { status: 500 }
    );
  }
}
