// ============================================================================
// SCHEDULE III REVISED (DIVISION I & II) COMPLIANCE & RATIOS ENGINE
// Companies Act, 2013, MCA Notifications G.S.R. 207(E) & 208(E)
// ============================================================================

export interface Schedule3Ratio {
  id: string;
  name: string;
  formula: string;
  numeratorName: string;
  denominatorName: string;
  cyNumerator: number;
  cyDenominator: number;
  cyValue: number;
  pyNumerator: number;
  pyDenominator: number;
  pyValue: number;
  unit: "TIMES" | "PERCENT" | "RATIO" | "DAYS";
  variancePercentage: number;
  isVarianceMaterial: boolean; // True if |variance| > 25% (Mandatory MCA reporting requirement)
  statutoryExplanation: string;
  icaiGuidanceNotes: string;
}

export interface ReceivablesAgeingRow {
  particulars: string;
  lessThan6Months: number;
  sixMonthsToOneYear: number;
  oneToTwoYears: number;
  twoToThreeYears: number;
  moreThanThreeYears: number;
  total: number;
}

export interface PayablesAgeingRow {
  particulars: string;
  lessThanOneYear: number;
  oneToTwoYears: number;
  twoToThreeYears: number;
  moreThanThreeYears: number;
  total: number;
}

export interface CwipAgeingRow {
  category: "CWIP" | "INTANGIBLES_UNDER_DEV";
  projectDescription: string;
  lessThanOneYear: number;
  oneToTwoYears: number;
  twoToThreeYears: number;
  moreThanThreeYears: number;
  total: number;
  isOverdueOrCostExceeded: boolean;
}

export interface TitleDeedImmovableProperty {
  relevantLineItem: "Land" | "Building";
  descriptionOfProperty: string;
  grossCarryingValueInr: number;
  titleDeedHeldInNameOf: string;
  whetherPromoterDirectorOrRelated: boolean;
  propertyHeldSince: string;
  reasonForNotBeingHeldInNameOfCompany: string;
}

export interface StruckOffCompanyTransaction {
  nameOfStruckOffCompany: string;
  cin: string;
  natureOfTransactions: "INVESTMENTS_IN_SECURITIES" | "RECEIVABLES" | "PAYABLES" | "SHARES_HELD" | "OTHER";
  balanceOutstandingInr: number;
  relationshipWithCompany: string;
}

export interface QuarterlyBankStockReconciliation {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  quarterEnd: string;
  bankName: string;
  sanctionedLimitInr: number;
  bookStockInr: number;
  bankReturnStockInr: number;
  stockVarianceInr: number;
  bookDebtorsInr: number;
  bankReturnDebtorsInr: number;
  debtorsVarianceInr: number;
  totalVarianceInr: number;
  isMaterialVariance: boolean; // > ₹5 Lakhs or > 2%
  reconciliationRemarks: string;
}

export interface Schedule3ComplianceDossier {
  clientName: string;
  cin: string;
  financialYear: string;
  assessmentYear: string;
  ratios: Schedule3Ratio[];
  materialVarianceCount: number;
  receivablesAgeing: ReceivablesAgeingRow[];
  payablesAgeing: PayablesAgeingRow[];
  cwipAgeing: CwipAgeingRow[];
  titleDeedsNotHeldInName: TitleDeedImmovableProperty[];
  struckOffCompanyTransactions: StruckOffCompanyTransaction[];
  bankStockReconciliations: QuarterlyBankStockReconciliation[];
  csrObligation: {
    averageNetProfitLast3YearsInr: number;
    mandatory2PercentCsrInr: number;
    actualSpentInr: number;
    unspentInr: number;
    isFullyCompliant: boolean;
  };
}

export class Schedule3ComplianceEngine {
  // --------------------------------------------------------------------------
  // COMPUTE THE 11 MANDATORY MCA SCHEDULE III RATIOS WITH 25% VARIANCE TEST
  // --------------------------------------------------------------------------
  public static computeMandatoryRatios(inputs: {
    currentAssetsCY: number;
    currentLiabilitiesCY: number;
    currentAssetsPY: number;
    currentLiabilitiesPY: number;

    totalDebtCY: number;
    shareholderEquityCY: number;
    totalDebtPY: number;
    shareholderEquityPY: number;

    ebitdaCY: number;
    principalAndInterestCY: number;
    ebitdaPY: number;
    principalAndInterestPY: number;

    patCY: number;
    patPY: number;

    cogsCY: number;
    averageInventoryCY: number;
    cogsPY: number;
    averageInventoryPY: number;

    netCreditSalesCY: number;
    averageReceivablesCY: number;
    netCreditSalesPY: number;
    averageReceivablesPY: number;

    netCreditPurchasesCY: number;
    averagePayablesCY: number;
    netCreditPurchasesPY: number;
    averagePayablesPY: number;

    netSalesCY: number;
    netWorkingCapitalCY: number;
    netSalesPY: number;
    netWorkingCapitalPY: number;

    ebitCY: number;
    capitalEmployedCY: number;
    ebitPY: number;
    capitalEmployedPY: number;

    investmentIncomeCY: number;
    averageInvestmentsCY: number;
    investmentIncomePY: number;
    averageInvestmentsPY: number;
  }): Schedule3Ratio[] {
    const ratios: Schedule3Ratio[] = [];

    const helper = (
      id: string,
      name: string,
      formula: string,
      numeratorName: string,
      denominatorName: string,
      numCY: number,
      denCY: number,
      numPY: number,
      denPY: number,
      unit: "TIMES" | "PERCENT" | "RATIO" | "DAYS",
      icaiGuidanceNotes: string,
      defaultExplanation: string
    ) => {
      const valCY = denCY !== 0 ? numCY / denCY : 0;
      const valPY = denPY !== 0 ? numPY / denPY : 0;
      let varPct = 0;
      if (valPY !== 0) {
        varPct = ((valCY - valPY) / Math.abs(valPY)) * 100;
      } else if (valCY !== 0) {
        varPct = 100;
      }

      const isMaterial = Math.abs(varPct) >= 25.0;

      ratios.push({
        id,
        name,
        formula,
        numeratorName,
        denominatorName,
        cyNumerator: numCY,
        cyDenominator: denCY,
        cyValue: Number(valCY.toFixed(2)),
        pyNumerator: numPY,
        pyDenominator: denPY,
        pyValue: Number(valPY.toFixed(2)),
        unit,
        variancePercentage: Number(varPct.toFixed(1)),
        isVarianceMaterial: isMaterial,
        statutoryExplanation: isMaterial ? defaultExplanation : "Variance within 25% statutory threshold; no specific disclosure mandated by MCA.",
        icaiGuidanceNotes
      });
    };

    // 1. Current Ratio
    helper(
      "ratio-1-current",
      "Current Ratio",
      "Current Assets / Current Liabilities",
      "Current Assets",
      "Current Liabilities",
      inputs.currentAssetsCY,
      inputs.currentLiabilitiesCY,
      inputs.currentAssetsPY,
      inputs.currentLiabilitiesPY,
      "RATIO",
      "Measures short-term debt paying ability. Benchmark: 1.33:1 to 2.0:1.",
      "Increase in working capital buffer due to timely customer collections and higher finished goods inventory."
    );

    // 2. Debt-Equity Ratio
    helper(
      "ratio-2-debt-equity",
      "Debt-Equity Ratio",
      "Total Debt / Shareholder's Equity",
      "Total Debt",
      "Shareholder's Equity",
      inputs.totalDebtCY,
      inputs.shareholderEquityCY,
      inputs.totalDebtPY,
      inputs.shareholderEquityPY,
      "RATIO",
      "Measures financial leverage and capital structure solvency. Total debt includes short-term and long-term borrowings.",
      "Repayment of machinery term loans and profit retention in reserves reduced financial gearing."
    );

    // 3. Debt Service Coverage Ratio (DSCR)
    helper(
      "ratio-3-dscr",
      "Debt Service Coverage Ratio",
      "EBITDA / (Debt Service: Principal + Interest)",
      "EBITDA",
      "Principal Repayments + Interest",
      inputs.ebitdaCY,
      inputs.principalAndInterestCY,
      inputs.ebitdaPY,
      inputs.principalAndInterestPY,
      "TIMES",
      "Measures cash operating ability to service annual debt interest and principal repayments. Benchmark > 1.5x.",
      "Improved operating margins and lower annual repayment installments following partial prepayment."
    );

    // 4. Return on Equity (ROE)
    helper(
      "ratio-4-roe",
      "Return on Equity (ROE)",
      "(Net Profit after Tax / Average Shareholder's Equity) * 100",
      "Net Profit after Tax",
      "Average Shareholder's Equity",
      inputs.patCY * 100,
      inputs.shareholderEquityCY,
      inputs.patPY * 100,
      inputs.shareholderEquityPY,
      "PERCENT",
      "Measures net profitability generated on shareholders' invested funds.",
      "Higher export volume and better capacity utilization led to 30.5% growth in net profit after tax."
    );

    // 5. Inventory Turnover Ratio
    helper(
      "ratio-5-inventory-turnover",
      "Inventory Turnover Ratio",
      "Cost of Goods Sold / Average Inventory",
      "Cost of Goods Sold",
      "Average Inventory",
      inputs.cogsCY,
      inputs.averageInventoryCY,
      inputs.cogsPY,
      inputs.averageInventoryPY,
      "TIMES",
      "Measures velocity of inventory conversions into sales.",
      "Optimized production scheduling and just-in-time raw material procurement reduced stock-holding cycles."
    );

    // 6. Trade Receivables Turnover Ratio
    helper(
      "ratio-6-debtors-turnover",
      "Trade Receivables Turnover",
      "Net Credit Sales / Average Trade Receivables",
      "Net Credit Sales",
      "Average Trade Receivables",
      inputs.netCreditSalesCY,
      inputs.averageReceivablesCY,
      inputs.netCreditSalesPY,
      inputs.averageReceivablesPY,
      "TIMES",
      "Measures efficiency of credit granting and debtor collections.",
      "Strict enforcement of 45-day credit terms with institutional OEM customers improved collection turnaround."
    );

    // 7. Trade Payables Turnover Ratio
    helper(
      "ratio-7-creditors-turnover",
      "Trade Payables Turnover",
      "Net Credit Purchases / Average Trade Payables",
      "Net Credit Purchases",
      "Average Trade Payables",
      inputs.netCreditPurchasesCY,
      inputs.averagePayablesCY,
      inputs.netCreditPurchasesPY,
      inputs.averagePayablesPY,
      "TIMES",
      "Measures speed of payments made to suppliers and MSME vendors.",
      "Strict compliance with Section 15 of MSMED Act and Section 43B(h) requiring payments within 15/45 days."
    );

    // 8. Net Capital Turnover Ratio
    helper(
      "ratio-8-working-capital-turnover",
      "Net Capital Turnover Ratio",
      "Net Sales / Working Capital",
      "Net Sales",
      "Working Capital",
      inputs.netSalesCY,
      inputs.netWorkingCapitalCY,
      inputs.netSalesPY,
      inputs.netWorkingCapitalPY,
      "TIMES",
      "Measures sales generation per rupee of net working capital.",
      "Sales expanded while current liabilities decreased, expanding net working capital base."
    );

    // 9. Net Profit Ratio
    helper(
      "ratio-9-net-profit-ratio",
      "Net Profit Ratio",
      "(Net Profit after Tax / Net Revenue) * 100",
      "Net Profit after Tax",
      "Net Revenue",
      inputs.patCY * 100,
      inputs.netSalesCY,
      inputs.patPY * 100,
      inputs.netSalesPY,
      "PERCENT",
      "Measures bottom-line profit margin per rupee of revenue.",
      "Operating leverage benefit and lower power/fuel cost per unit of output."
    );

    // 10. Return on Capital Employed (ROCE)
    helper(
      "ratio-10-roce",
      "Return on Capital Employed (ROCE)",
      "(EBIT / Capital Employed) * 100",
      "EBIT",
      "Capital Employed",
      inputs.ebitCY * 100,
      inputs.capitalEmployedCY,
      inputs.ebitPY * 100,
      inputs.capitalEmployedPY,
      "PERCENT",
      "Measures efficiency with which total capital (debt + equity) is generating operating profits.",
      "Higher capacity utilization (84% vs 68% in PY) increased EBIT from plant operations."
    );

    // 11. Return on Investment (ROI)
    helper(
      "ratio-11-roi",
      "Return on Investment (ROI)",
      "(Investment Income / Average Total Investments) * 100",
      "Investment Income",
      "Average Total Investments",
      inputs.investmentIncomeCY * 100,
      inputs.averageInvestmentsCY,
      inputs.investmentIncomePY * 100,
      inputs.averageInvestmentsPY,
      "PERCENT",
      "Measures return on treasury liquid funds, mutual funds, and fixed deposits.",
      "Higher yields on corporate fixed deposits and debt mutual fund dividend reinvestments."
    );

    return ratios;
  }

  // --------------------------------------------------------------------------
  // DEFAULT REALISTIC DATA PACK FOR APEX AUTOTECH PRIVATE LIMITED
  // --------------------------------------------------------------------------
  public static getDefaultDossier(): Schedule3ComplianceDossier {
    const ratios = this.computeMandatoryRatios({
      currentAssetsCY: 152000000,
      currentLiabilitiesCY: 90500000,
      currentAssetsPY: 128000000,
      currentLiabilitiesPY: 88000000,

      totalDebtCY: 85000000,
      shareholderEquityCY: 146500000,
      totalDebtPY: 102000000,
      shareholderEquityPY: 118050000,

      ebitdaCY: 61500000,
      principalAndInterestCY: 25100000,
      ebitdaPY: 48200000,
      principalAndInterestPY: 27800000,

      patCY: 28450000,
      patPY: 21800000,

      cogsCY: 345000000,
      averageInventoryCY: 38500000,
      cogsPY: 312000000,
      averageInventoryPY: 42000000,

      netCreditSalesCY: 485000000,
      averageReceivablesCY: 52000000,
      netCreditSalesPY: 425000000,
      averageReceivablesPY: 61000000,

      netCreditPurchasesCY: 286000000,
      averagePayablesCY: 41000000,
      netCreditPurchasesPY: 265000000,
      averagePayablesPY: 46000000,

      netSalesCY: 485000000,
      netWorkingCapitalCY: 61500000,
      netSalesPY: 425000000,
      netWorkingCapitalPY: 40000000,

      ebitCY: 53200000,
      capitalEmployedCY: 231500000,
      ebitPY: 41500000,
      capitalEmployedPY: 220050000,

      investmentIncomeCY: 1450000,
      averageInvestmentsCY: 18500000,
      investmentIncomePY: 1100000,
      averageInvestmentsPY: 15000000
    });

    const materialCount = ratios.filter(r => r.isVarianceMaterial).length;

    const receivablesAgeing: ReceivablesAgeingRow[] = [
      {
        particulars: "(i) Undisputed Trade Receivables - considered good",
        lessThan6Months: 46250000,
        sixMonthsToOneYear: 4800000,
        oneToTwoYears: 950000,
        twoToThreeYears: 0,
        moreThanThreeYears: 0,
        total: 52000000
      },
      {
        particulars: "(ii) Undisputed Trade Receivables - which have significant increase in credit risk",
        lessThan6Months: 0,
        sixMonthsToOneYear: 0,
        oneToTwoYears: 0,
        twoToThreeYears: 0,
        moreThanThreeYears: 0,
        total: 0
      },
      {
        particulars: "(iii) Undisputed Trade Receivables - credit impaired",
        lessThan6Months: 0,
        sixMonthsToOneYear: 0,
        oneToTwoYears: 240000,
        twoToThreeYears: 310000,
        moreThanThreeYears: 0,
        total: 550000
      },
      {
        particulars: "(iv) Disputed Trade Receivables - considered good",
        lessThan6Months: 0,
        sixMonthsToOneYear: 0,
        oneToTwoYears: 0,
        twoToThreeYears: 0,
        moreThanThreeYears: 0,
        total: 0
      },
      {
        particulars: "(v) Disputed Trade Receivables - credit impaired",
        lessThan6Months: 0,
        sixMonthsToOneYear: 0,
        oneToTwoYears: 0,
        twoToThreeYears: 420000,
        moreThanThreeYears: 380000,
        total: 800000
      }
    ];

    const payablesAgeing: PayablesAgeingRow[] = [
      {
        particulars: "(i) MSME Creditors (Undisputed)",
        lessThanOneYear: 14200000,
        oneToTwoYears: 0,
        twoToThreeYears: 0,
        moreThanThreeYears: 0,
        total: 14200000
      },
      {
        particulars: "(ii) Others (Undisputed)",
        lessThanOneYear: 26800000,
        oneToTwoYears: 0,
        twoToThreeYears: 0,
        moreThanThreeYears: 0,
        total: 26800000
      },
      {
        particulars: "(iii) Disputed Dues - MSME",
        lessThanOneYear: 0,
        oneToTwoYears: 0,
        twoToThreeYears: 0,
        moreThanThreeYears: 0,
        total: 0
      },
      {
        particulars: "(iv) Disputed Dues - Others",
        lessThanOneYear: 0,
        oneToTwoYears: 0,
        twoToThreeYears: 0,
        moreThanThreeYears: 0,
        total: 0
      }
    ];

    const cwipAgeing: CwipAgeingRow[] = [
      {
        category: "CWIP",
        projectDescription: "Automatic CNC Induction Hardening Plant Line-2 (Pithampur)",
        lessThanOneYear: 4200000,
        oneToTwoYears: 1800000,
        twoToThreeYears: 0,
        moreThanThreeYears: 0,
        total: 6000000,
        isOverdueOrCostExceeded: false
      }
    ];

    const bankStockReconciliations: QuarterlyBankStockReconciliation[] = [
      {
        quarter: "Q1",
        quarterEnd: "30-Jun-2025",
        bankName: "HDFC Bank Consortium",
        sanctionedLimitInr: 125000000,
        bookStockInr: 39500000,
        bankReturnStockInr: 39500000,
        stockVarianceInr: 0,
        bookDebtorsInr: 58200000,
        bankReturnDebtorsInr: 58200000,
        debtorsVarianceInr: 0,
        totalVarianceInr: 0,
        isMaterialVariance: false,
        reconciliationRemarks: "Full match. Quarterly DP statement agreed with general ledger."
      },
      {
        quarter: "Q2",
        quarterEnd: "30-Sep-2025",
        bankName: "HDFC Bank Consortium",
        sanctionedLimitInr: 125000000,
        bookStockInr: 42100000,
        bankReturnStockInr: 42000000,
        stockVarianceInr: 100000,
        bookDebtorsInr: 61400000,
        bankReturnDebtorsInr: 61400000,
        debtorsVarianceInr: 0,
        totalVarianceInr: 100000,
        isMaterialVariance: false,
        reconciliationRemarks: "Minor timing difference of ₹1 Lakh in transit raw material."
      },
      {
        quarter: "Q3",
        quarterEnd: "31-Dec-2025",
        bankName: "HDFC Bank Consortium",
        sanctionedLimitInr: 125000000,
        bookStockInr: 37800000,
        bankReturnStockInr: 37800000,
        stockVarianceInr: 0,
        bookDebtorsInr: 54600000,
        bankReturnDebtorsInr: 54600000,
        debtorsVarianceInr: 0,
        totalVarianceInr: 0,
        isMaterialVariance: false,
        reconciliationRemarks: "Full match. Verified against book debts list."
      },
      {
        quarter: "Q4",
        quarterEnd: "31-Mar-2026",
        bankName: "HDFC Bank Consortium",
        sanctionedLimitInr: 125000000,
        bookStockInr: 38500000,
        bankReturnStockInr: 38500000,
        stockVarianceInr: 0,
        bookDebtorsInr: 52000000,
        bankReturnDebtorsInr: 52000000,
        debtorsVarianceInr: 0,
        totalVarianceInr: 0,
        isMaterialVariance: false,
        reconciliationRemarks: "Full match with audited Balance Sheet figures."
      }
    ];

    return {
      clientName: "Apex AutoTech Private Limited",
      cin: "U29100MP2015PTC034120",
      financialYear: "FY 2025-26",
      assessmentYear: "AY 2026-27",
      ratios,
      materialVarianceCount: materialCount,
      receivablesAgeing,
      payablesAgeing,
      cwipAgeing,
      titleDeedsNotHeldInName: [],
      struckOffCompanyTransactions: [],
      bankStockReconciliations,
      csrObligation: {
        averageNetProfitLast3YearsInr: 38000000,
        mandatory2PercentCsrInr: 760000,
        actualSpentInr: 800000,
        unspentInr: 0,
        isFullyCompliant: true
      }
    };
  }
}
