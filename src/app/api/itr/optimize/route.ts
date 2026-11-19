import { NextRequest, NextResponse } from "next/server";
import { DualRegimeOptimizer, ItrIncomeParameters } from "@/lib/itr/dualRegimeOptimizer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salary = Number(searchParams.get("salary") || "1250000");
    const sec80C = Number(searchParams.get("sec80C") || "150000");
    const sec80D = Number(searchParams.get("sec80D") || "25000");
    const homeLoan = Number(searchParams.get("homeLoan") || "150000");

    const defaultParams: ItrIncomeParameters = {
      taxpayerName: "Rajesh Sharma",
      pan: "ABFPS1234E",
      category: "INDIVIDUAL",
      assessmentYear: "AY 2026-27",
      salaryGross: salary,
      salaryExemptions: 0,
      professionalTax: 2500,
      annualRentReceived: 0,
      municipalTaxesPaid: 0,
      homeLoanInterestSelfOccupied: homeLoan,
      hasPgbpIncome: false,
      isPresumptive: false,
      presumptiveScheme: "44ADA",
      businessTurnover: 0,
      regularBusinessProfit: 0,
      stcg111A: 0,
      ltcg112A: 0,
      otherLtcg112: 0,
      savingsInterest: 18000,
      fdInterestAndDividends: 32000,
      familyPension: 0,
      sec80C,
      sec80D_Self: sec80D,
      sec80D_ParentsSenior: 50000,
      sec80D_Checkup: 5000,
      sec80CCD_1B: 50000,
      sec80CCD_2_Employer: 0,
      sec80E_EduLoan: 0,
      sec80G_Donations: 0,
      sec80JJAA: 0,
      tdsPaid: 65000,
      advanceTaxPaid: 0,
      tcsPaid: 0
    };

    const result = DualRegimeOptimizer.optimize(defaultParams);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute ITR optimization" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params: ItrIncomeParameters = body;

    if (!params.taxpayerName || !params.pan) {
      return NextResponse.json(
        { success: false, error: "Taxpayer Name and PAN are required." },
        { status: 400 }
      );
    }

    const result = DualRegimeOptimizer.optimize(params);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process ITR optimization" },
      { status: 500 }
    );
  }
}
