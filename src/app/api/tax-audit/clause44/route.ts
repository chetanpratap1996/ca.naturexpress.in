import { NextRequest, NextResponse } from "next/server";
import { Clause44Engine, ExpenseLedgerItem } from "@/lib/taxAudit/clause44Engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pan = searchParams.get("pan") || "AABCA8891D";
    const assesseeName = searchParams.get("name") || "Pratwi Solutions Private Limited";
    const fy = searchParams.get("fy") || "FY 2025-26";
    const ay = searchParams.get("ay") || "AY 2026-27";

    const sampleLedgers: ExpenseLedgerItem[] = [
      {
        id: "l-1",
        ledgerName: "Raw Steel Ingot Procurement",
        accountHead: "Raw Material Consumption",
        totalExpenditureInr: 28500000,
        gstRegistrationType: "REGISTERED_REGULAR",
        vendorGstin: "27AAACJ4491D1Z8"
      },
      {
        id: "l-2",
        ledgerName: "Factory Shed Civil Maintenance",
        accountHead: "Repairs & Maintenance",
        totalExpenditureInr: 850000,
        gstRegistrationType: "REGISTERED_REGULAR",
        vendorGstin: "23AAGCR4421L1ZB"
      },
      {
        id: "l-3",
        ledgerName: "Local Staff Canteen Catering Supplies",
        accountHead: "Canteen Expenses",
        totalExpenditureInr: 320000,
        gstRegistrationType: "COMPOSITION",
        vendorGstin: "23AANCP9915B1Z9"
      },
      {
        id: "l-4",
        ledgerName: "Agricultural Packaging Material",
        accountHead: "Packaging Charges",
        totalExpenditureInr: 450000,
        gstRegistrationType: "EXEMPT_NIL_RATED",
        vendorGstin: "23AAGCA1102K1Z3"
      },
      {
        id: "l-5",
        ledgerName: "Daily Labour Wages (Loading/Unloading)",
        accountHead: "Freight & Loading Charges",
        totalExpenditureInr: 640000,
        gstRegistrationType: "UNREGISTERED"
      },
      {
        id: "l-6",
        ledgerName: "Factory Workers Salaries",
        accountHead: "Salaries and Wages",
        totalExpenditureInr: 12500000,
        gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION",
        isSalaryOrStaffWelfare: true
      },
      {
        id: "l-7",
        ledgerName: "Plant & Machinery Depreciation",
        accountHead: "Depreciation & Amortisation",
        totalExpenditureInr: 4200000,
        gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION",
        isDepreciationOrProvision: true
      }
    ];

    const report = Clause44Engine.generateClause44({
      assesseeName,
      pan,
      financialYear: fy,
      assessmentYear: ay,
      ledgers: sampleLedgers
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to generate Clause 44 report"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assesseeName, pan, financialYear, assessmentYear, ledgers } = body;

    if (!pan || !Array.isArray(ledgers)) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: pan, ledgers"
      }, { status: 400 });
    }

    const report = Clause44Engine.generateClause44({
      assesseeName: assesseeName || "Assessee",
      pan,
      financialYear: financialYear || "FY 2025-26",
      assessmentYear: assessmentYear || "AY 2026-27",
      ledgers
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process Clause 44 computation"
    }, { status: 500 });
  }
}
