import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import {
  Rule42And43Engine,
  Rule42MonthlyInput,
  Rule43CapitalGoodsItem,
  Rule42AnnualTrueUpInput,
} from "@/lib/gst/rule42And43Engine";
import { resolveFirmUuid, listWorkspaceRecords, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const clientGstin = (searchParams.get("clientGstin") || "").trim().toUpperCase();
    const taxPeriod = (searchParams.get("taxPeriod") || "").trim();

    if (!clientGstin) {
      return NextResponse.json({ success: true, found: false, record: null });
    }

    const firmId = await resolveFirmUuid(auth);
    const recs = await listWorkspaceRecords<any>(firmId, "GST_RULE42_43");
    const idKey = `r42-${clientGstin}-${taxPeriod}`.replace(/\s+/g, "_");
    const matched = recs.find((r) => r.payload?.id === idKey) ||
      recs.find((r) => r.payload?.clientGstin === clientGstin);

    return NextResponse.json({
      success: true,
      found: Boolean(matched),
      record: matched?.payload || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load Rule 42/43 workpaper" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse || !auth) return errorResponse!;

  try {
    const body = await req.json();
    const mode = body.mode || "RULE_42_MONTHLY";
    const clientGstin = (body.clientGstin || "").trim().toUpperCase();
    const taxPeriod = body.taxPeriod || "Current Period";

    let result: any = null;

    if (mode === "RULE_42_MONTHLY") {
      const input: Rule42MonthlyInput = {
        taxPeriod,
        totalInputTaxInr: Number(body.totalInputTaxInr || 0),
        nonBusinessInputTaxInr: Number(body.nonBusinessInputTaxInr || 0),
        exemptSuppliesInputTaxInr: Number(body.exemptSuppliesInputTaxInr || 0),
        blockedInputTaxInr: Number(body.blockedInputTaxInr || 0),
        taxableSuppliesInputTaxInr: Number(body.taxableSuppliesInputTaxInr || 0),
        exemptTurnoverInr: Number(body.exemptTurnoverInr || 0),
        totalTurnoverInr: Number(body.totalTurnoverInr || 0),
      };
      result = Rule42And43Engine.calculateMonthlyRule42(input);
    } else if (mode === "RULE_43_CAPITAL_GOODS") {
      const capitalAssets: Rule43CapitalGoodsItem[] = Array.isArray(body.capitalAssets) ? body.capitalAssets : [];
      result = Rule42And43Engine.calculateMonthlyRule43({
        taxPeriod,
        capitalAssets,
        exemptTurnoverInr: Number(body.exemptTurnoverInr || 0),
        totalTurnoverInr: Number(body.totalTurnoverInr || 0),
      });
    } else if (mode === "RULE_42_ANNUAL_TRUE_UP") {
      const input: Rule42AnnualTrueUpInput = {
        financialYear: body.financialYear || "FY 2025-26",
        annualTotalCommonCredit_C2: Number(body.annualTotalCommonCredit_C2 || 0),
        annualExemptTurnover_E: Number(body.annualExemptTurnover_E || 0),
        annualTotalTurnover_F: Number(body.annualTotalTurnover_F || 0),
        totalMonthlyReversalsAlreadyPaid: Number(body.totalMonthlyReversalsAlreadyPaid || 0),
        trueUpFilingDate: body.trueUpFilingDate || new Date().toISOString().split("T")[0],
      };
      result = Rule42And43Engine.calculateAnnualTrueUpRule42(input);
    } else {
      return NextResponse.json({ success: false, error: `Unsupported mode: ${mode}` }, { status: 400 });
    }

    if (clientGstin && body.persist !== false) {
      try {
        const firmId = await resolveFirmUuid(auth);
        const idKey = `r42-${clientGstin}-${taxPeriod}`.replace(/\s+/g, "_");
        const existingRecs = await listWorkspaceRecords<any>(firmId, "GST_RULE42_43");
        const prev = existingRecs.find((r) => r.payload?.id === idKey)?.payload || {};
        await upsertWorkspaceRecord({
          firmId,
          recordType: "GST_RULE42_43",
          matchKey: "id",
          matchValue: idKey,
          payload: {
            ...prev,
            id: idKey,
            clientGstin,
            taxPeriod,
            ...(mode === "RULE_42_MONTHLY" ? { rule42Inputs: body, rule42Result: result } : {}),
            ...(mode === "RULE_43_CAPITAL_GOODS" ? { capitalAssets: body.capitalAssets || [], rule43Result: result } : {}),
            ...(mode === "RULE_42_ANNUAL_TRUE_UP" ? { annualTrueUpInputs: body, annualTrueUpResult: result } : {}),
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn("Could not persist Rule 42/43 workpaper:", err);
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute Rule 42/43 calculation" },
      { status: 500 }
    );
  }
}
