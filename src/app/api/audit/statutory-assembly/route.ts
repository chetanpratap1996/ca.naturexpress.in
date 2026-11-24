import { NextRequest, NextResponse } from "next/server";
import { 
  StatutoryAuditAssemblyLine, 
  Phase3AssemblyInput, 
  ClientAuditProfile, 
  FinancialAuditMetrics 
} from "@/lib/audit/statutoryAuditAssemblyLine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Default real production client profile if omitted
    const defaultProfile: ClientAuditProfile = {
      legalName: body.clientProfile?.legalName || "Pratwi Solutions Private Limited",
      pan: body.clientProfile?.pan || "AABCA8891D",
      gstin: body.clientProfile?.gstin || "23AABCA8891D1Z4",
      cin: body.clientProfile?.cin || "U74110MP2017PTC043716",
      assessmentYear: body.clientProfile?.assessmentYear || "2026-27",
      financialYear: body.clientProfile?.financialYear || "2025-26",
      partnerInCharge: body.clientProfile?.partnerInCharge || "CA Gunjan Jain, FCA",
      caMembershipNo: body.clientProfile?.caMembershipNo || "022998",
      caFirmRegNo: body.clientProfile?.caFirmRegNo || "022998C",
      signingDate: body.clientProfile?.signingDate || "2026-09-25",
      stateCode: body.clientProfile?.stateCode || "23" // Madhya Pradesh
    };

    // Default real financial metrics if omitted
    const defaultMetrics: FinancialAuditMetrics = {
      revenueFromOperations: body.financialMetrics?.revenueFromOperations || 485000000,
      totalExpenses: body.financialMetrics?.totalExpenses || 443150000,
      profitBeforeTax: body.financialMetrics?.profitBeforeTax || 41850000,
      depreciationCY: body.financialMetrics?.depreciationCY || 18500000,
      patCY: body.financialMetrics?.patCY || 31316355,
      patPY: body.financialMetrics?.patPY || 24500000,
      depreciationPY: body.financialMetrics?.depreciationPY || 16200000,
      shareCapital: body.financialMetrics?.shareCapital || 25000000,
      reservesAndSurplus: body.financialMetrics?.reservesAndSurplus || 118500000,
      netWorth: body.financialMetrics?.netWorth || 143500000,
      totalDebt: body.financialMetrics?.totalDebt || 100500000,
      currentAssets: body.financialMetrics?.currentAssets || 188950000,
      currentLiabilities: body.financialMetrics?.currentLiabilities || 86800000,
      sanctionedWorkingCapitalLimitInr: body.financialMetrics?.sanctionedWorkingCapitalLimitInr || 60000000, // 6 Cr (> 5 Cr)
      debtEquityRatio: body.financialMetrics?.debtEquityRatio || 0.70,
      currentRatio: body.financialMetrics?.currentRatio || 2.18,
      hasWilfulDefaulterRemark: false,
      undisputedStatutoryDuesOver6Months: 0
    };

    // Default realistic expense ledgers for Clause 44
    const defaultExpenseLedgers = body.expenseLedgers || [
      {
        id: "EXP-01",
        ledgerName: "Raw Steel & Metal Purchases",
        accountHead: "Raw Materials",
        totalExpenditureInr: 250000000,
        vendorGstin: "23AABCP1332L1ZX",
        vendorTradeName: "Precision Steel Works Pvt Ltd",
        gstRegistrationType: "REGISTERED_REGULAR"
      },
      {
        id: "EXP-02",
        ledgerName: "Factory Worker Wages",
        accountHead: "Salaries and Wages",
        totalExpenditureInr: 35000000,
        isSalaryOrStaffWelfare: true,
        gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION"
      },
      {
        id: "EXP-03",
        ledgerName: "Machinery Depreciation",
        accountHead: "Depreciation and Amortisation",
        totalExpenditureInr: 18500000,
        isDepreciationOrProvision: true,
        gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION"
      },
      {
        id: "EXP-04",
        ledgerName: "Local Courier & Packaging Supplies",
        accountHead: "Printing & Packaging",
        totalExpenditureInr: 4500000,
        gstRegistrationType: "UNREGISTERED"
      }
    ];

    // Default realistic MSME creditors for Clause 22 / 43B(h)
    const defaultMsmeCreditors = body.msmeCreditors || [
      {
        id: "CR-01",
        vendorName: "Shree Engineering Works",
        vendorPan: "AAACS8819D",
        udyamRegistrationNo: "UDYAM-MP-23-0091823",
        enterpriseCategory: "MICRO",
        hasWrittenAgreement: true, // 45 days
        invoiceNumber: "SEW/25-26/102",
        invoiceDate: "2026-01-15",
        deliveryOrAcceptanceDate: "2026-01-16",
        invoiceAmountInr: 250000,
        paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
      },
      {
        id: "CR-02",
        vendorName: "Malwa Industrial Fasteners",
        vendorPan: "AABCM4410K",
        udyamRegistrationNo: "UDYAM-MP-23-0012901",
        enterpriseCategory: "SMALL",
        hasWrittenAgreement: false, // 15 days
        invoiceNumber: "MIF/2026/881",
        invoiceDate: "2026-02-10",
        deliveryOrAcceptanceDate: "2026-02-10",
        invoiceAmountInr: 120000,
        paymentStatus: "PAID_ON_TIME",
        actualPaymentDate: "2026-02-22"
      }
    ];

    // Default realistic TDS transactions for Clause 34
    const defaultTdsTransactions = body.tdsTransactions || [
      {
        id: "TDS-01",
        tanOfAssessee: "BPLG02299C",
        sectionCode: "194C",
        natureOfPayment: "Factory Logistics & Freight",
        payeeName: "Pratwi Express Logistics",
        payeePan: "AAACX1029P",
        grossPaymentInr: 1500000,
        thresholdExemptionInr: 100000,
        amountLiableForTdsInr: 1500000,
        prescribedTdsRatePcnt: 2,
        actualTdsDeductedInr: 30000,
        actualRateAppliedPcnt: 2,
        isChallanDepositedOnTime: true
      },
      {
        id: "TDS-02",
        tanOfAssessee: "BPLG02299C",
        sectionCode: "194J_PROF",
        natureOfPayment: "Legal & Corporate Consultancy",
        payeeName: "Corporate Legal Advisors LLP",
        payeePan: "AAAFS9920L",
        grossPaymentInr: 500000,
        thresholdExemptionInr: 30000,
        amountLiableForTdsInr: 500000,
        prescribedTdsRatePcnt: 10,
        actualTdsDeductedInr: 0, // Default -> triggers 30% disallowance!
        actualRateAppliedPcnt: 0,
        isChallanDepositedOnTime: false
      }
    ];

    const input: Phase3AssemblyInput = {
      clientProfile: defaultProfile,
      financialMetrics: defaultMetrics,
      expenseLedgers: defaultExpenseLedgers,
      msmeCreditors: defaultMsmeCreditors,
      tdsTransactions: defaultTdsTransactions,
      firmUpiVpa: body.firmUpiVpa || "ca.gunjan@icici",
      agreedProfessionalFee: body.agreedProfessionalFee || 75000,
      pureAgentReimbursements: body.pureAgentReimbursements || 5000,
      isEqcrApproved: body.isEqcrApproved !== undefined ? body.isEqcrApproved : true
    };

    const result = StatutoryAuditAssemblyLine.executeAssembly(input);

    return NextResponse.json({
      success: true,
      message: "Phase 3 Statutory Audit & Realization Assembly executed successfully.",
      data: result
    });
  } catch (error: any) {
    console.error("Phase 3 Assembly Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute Phase 3 statutory assembly."
      },
      { status: 500 }
    );
  }
}
