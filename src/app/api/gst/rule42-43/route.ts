import { NextRequest, NextResponse } from "next/server";
import { Rule42And43Engine, Rule42MonthlyInput, Rule43CapitalGoodsItem, Rule42AnnualTrueUpInput } from "@/lib/gst/rule42And43Engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode || "RULE_42_MONTHLY";

    if (mode === "RULE_42_MONTHLY") {
      const input: Rule42MonthlyInput = {
        taxPeriod: body.taxPeriod || "September 2026",
        totalInputTaxInr: Number(body.totalInputTaxInr || 0),
        nonBusinessInputTaxInr: Number(body.nonBusinessInputTaxInr || 0),
        exemptSuppliesInputTaxInr: Number(body.exemptSuppliesInputTaxInr || 0),
        blockedInputTaxInr: Number(body.blockedInputTaxInr || 0),
        taxableSuppliesInputTaxInr: Number(body.taxableSuppliesInputTaxInr || 0),
        exemptTurnoverInr: Number(body.exemptTurnoverInr || 0),
        totalTurnoverInr: Number(body.totalTurnoverInr || 0)
      };
      const result = Rule42And43Engine.calculateMonthlyRule42(input);
      return NextResponse.json({ success: true, result });
    }

    if (mode === "RULE_43_CAPITAL_GOODS") {
      const capitalAssets: Rule43CapitalGoodsItem[] = body.capitalAssets || [];
      const result = Rule42And43Engine.calculateMonthlyRule43({
        taxPeriod: body.taxPeriod || "September 2026",
        capitalAssets,
        exemptTurnoverInr: Number(body.exemptTurnoverInr || 0),
        totalTurnoverInr: Number(body.totalTurnoverInr || 0)
      });
      return NextResponse.json({ success: true, result });
    }

    if (mode === "RULE_42_ANNUAL_TRUE_UP") {
      const input: Rule42AnnualTrueUpInput = {
        financialYear: body.financialYear || "FY 2025-26",
        annualTotalCommonCredit_C2: Number(body.annualTotalCommonCredit_C2 || 0),
        annualExemptTurnover_E: Number(body.annualExemptTurnover_E || 0),
        annualTotalTurnover_F: Number(body.annualTotalTurnover_F || 0),
        totalMonthlyReversalsAlreadyPaid: Number(body.totalMonthlyReversalsAlreadyPaid || 0),
        trueUpFilingDate: body.trueUpFilingDate || new Date().toISOString().split("T")[0]
      };
      const result = Rule42And43Engine.calculateAnnualTrueUpRule42(input);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({
      success: false,
      error: `Unsupported mode: ${mode}`
    }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to execute Rule 42/43 calculation"
    }, { status: 500 });
  }
}
