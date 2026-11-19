import { NextRequest, NextResponse } from "next/server";
import { Clause34TdsEngine, TdsTransactionAuditItem, Clause34bQuarterlyReturnItem } from "@/lib/taxAudit/clause34TdsEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tan = searchParams.get("tan") || "BPLR01492E";
    const assesseeName = searchParams.get("name") || "Apex AutoTech Private Limited";
    const fy = searchParams.get("fy") || "FY 2025-26";
    const ay = searchParams.get("ay") || "AY 2026-27";

    const sampleTransactions: TdsTransactionAuditItem[] = [
      {
        id: "tx-1",
        tanOfAssessee: tan,
        sectionCode: "194C",
        natureOfPayment: "Contractual Tooling & Fabrication",
        payeeName: "Apex Engineering Works",
        payeePan: "AAACE9912M",
        grossPaymentInr: 300000,
        thresholdExemptionInr: 100000,
        amountLiableForTdsInr: 300000,
        prescribedTdsRatePcnt: 2,
        actualTdsDeductedInr: 0, // DEFAULT NON-DEDUCTION -> Sec 40(a)(ia) 30%
        actualRateAppliedPcnt: 0,
        statutoryDepositDueDate: "2025-10-07",
        isChallanDepositedOnTime: false
      },
      {
        id: "tx-2",
        tanOfAssessee: tan,
        sectionCode: "194J_PROF",
        natureOfPayment: "Legal & Corporate Advisory Fees",
        payeeName: "Singhania & Partners LLP",
        payeePan: "AAAFS1102P",
        grossPaymentInr: 450000,
        thresholdExemptionInr: 30000,
        amountLiableForTdsInr: 450000,
        prescribedTdsRatePcnt: 10,
        actualTdsDeductedInr: 45000,
        actualRateAppliedPcnt: 10,
        statutoryDepositDueDate: "2025-11-07",
        isChallanDepositedOnTime: true,
        bsrCode: "0210041",
        challanSerialNo: "00192"
      },
      {
        id: "tx-3",
        tanOfAssessee: tan,
        sectionCode: "194I_LAND",
        natureOfPayment: "Factory Premises Rent",
        payeeName: "Industrial Estates Indore Ltd",
        payeePan: "AAACI4401K",
        grossPaymentInr: 1200000,
        thresholdExemptionInr: 240000,
        amountLiableForTdsInr: 1200000,
        prescribedTdsRatePcnt: 10,
        actualTdsDeductedInr: 120000,
        actualRateAppliedPcnt: 10,
        statutoryDepositDueDate: "2025-12-07",
        isChallanDepositedOnTime: true,
        bsrCode: "0210041",
        challanSerialNo: "00244"
      },
      {
        id: "tx-4",
        tanOfAssessee: tan,
        sectionCode: "194Q",
        natureOfPayment: "Purchase of Raw Materials exceeding ₹50L",
        payeeName: "JSW Steel Coated Products Ltd",
        payeePan: "AAACJ4491D",
        grossPaymentInr: 8500000,
        thresholdExemptionInr: 5000000,
        amountLiableForTdsInr: 3500000,
        prescribedTdsRatePcnt: 0.1,
        actualTdsDeductedInr: 3500,
        actualRateAppliedPcnt: 0.1,
        statutoryDepositDueDate: "2026-01-07",
        isChallanDepositedOnTime: true,
        bsrCode: "0210041",
        challanSerialNo: "00310"
      }
    ];

    const report = Clause34TdsEngine.auditTdsCompliance({
      assesseeName,
      tan,
      financialYear: fy,
      assessmentYear: ay,
      transactions: sampleTransactions
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process Clause 34 TDS report"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assesseeName, tan, financialYear, assessmentYear, transactions, quarterlyReturns } = body;

    if (!tan || !Array.isArray(transactions)) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: tan, transactions"
      }, { status: 400 });
    }

    const report = Clause34TdsEngine.auditTdsCompliance({
      assesseeName: assesseeName || "Assessee",
      tan,
      financialYear: financialYear || "FY 2025-26",
      assessmentYear: assessmentYear || "AY 2026-27",
      transactions,
      quarterlyReturns
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to execute Clause 34 audit"
    }, { status: 500 });
  }
}
