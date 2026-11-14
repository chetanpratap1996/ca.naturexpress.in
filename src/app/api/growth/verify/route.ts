import { NextRequest, NextResponse } from "next/server";
import { parseCinStrict } from "@/lib/intelligence/registry/mcaEngine";
import { validateGstinStrict } from "@/lib/intelligence/registry/gstValidator";
import { StatutoryPenaltyCalculator } from "@/lib/intelligence/engine/penaltyEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      cin, 
      gstin, 
      incorporationDate, 
      companyType,
      unfiledAoc4Years,
      unfiledMgt7Years,
      unfiledGstr3bPeriods,
      msmeOverduePayablesInr,
      activeBankChargesInr,
      hasDir3KycPending
    } = body;

    if (!cin && !gstin) {
      return NextResponse.json(
        { success: false, error: "Please provide either a CIN or a GSTIN to verify." },
        { status: 400 }
      );
    }

    let cinMeta = null;
    let gstMeta = null;

    if (cin) {
      cinMeta = parseCinStrict(cin);
      if (!cinMeta.isValid) {
        return NextResponse.json(
          { success: false, error: cinMeta.error || "Invalid CIN format" },
          { status: 400 }
        );
      }
    }

    if (gstin) {
      gstMeta = validateGstinStrict(gstin);
      if (!gstMeta.isValid) {
        return NextResponse.json(
          { success: false, error: gstMeta.error || "Invalid GSTIN format" },
          { status: 400 }
        );
      }
    }

    const incDate = incorporationDate || (cinMeta ? `${cinMeta.incorporationYear}-01-15` : new Date().toISOString().split("T")[0]);
    const compType = companyType || (cinMeta ? cinMeta.companyType : "PVT_LTD");

    const calculation = StatutoryPenaltyCalculator.calculate({
      companyType: compType,
      incorporationDate: incDate,
      authorizedCapitalInr: 1000000,
      paidUpCapitalInr: 100000,
      unfiledAoc4Years,
      unfiledMgt7Years,
      unfiledGstr3bPeriods,
      msmeOverduePayablesInr,
      activeBankChargesInr,
      hasDir3KycPending,
      gstStatus: gstMeta && gstMeta.isValid ? "Active" : undefined,
    });

    return NextResponse.json({
      success: true,
      accuracyScore: 1000,
      cinMeta,
      gstMeta,
      calculation,
    });
  } catch (error: any) {
    console.error("Verification endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process verification" },
      { status: 500 }
    );
  }
}
