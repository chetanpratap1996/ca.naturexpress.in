/**
 * Brains & Taxes — Rule 42 & Rule 43 Pro-Rata Input Tax Credit Reversal Engine
 * 
 * Statutory Authority:
 * - Rule 42 of CGST Rules, 2017: Apportionment of ITC on Inputs & Input Services (Common Credit Reversal)
 * - Rule 42(2) of CGST Rules, 2017: Annual Mandatory True-Up Reversal with Section 50(1) 18% Interest
 * - Rule 43 of CGST Rules, 2017: Apportionment of ITC on Capital Goods (60-Month Useful Life Pro-Rata Reversal)
 * - Notification No. 14/2022-CT & CBIC Circular No. 170/02/2022-GST: Reporting in Table 4(B)(2)
 */

export interface Rule42MonthlyInput {
  taxPeriod: string; // e.g. "September 2026"
  totalInputTaxInr: number;        // T (Total input tax on inputs & input services)
  nonBusinessInputTaxInr: number;  // T1 (Exclusively non-business)
  exemptSuppliesInputTaxInr: number; // T2 (Exclusively exempt)
  blockedInputTaxInr: number;      // T3 (Section 17(5) blocked)
  taxableSuppliesInputTaxInr: number; // T4 (Exclusively taxable & zero-rated)
  exemptTurnoverInr: number;       // E (Exempt turnover in state during period)
  totalTurnoverInr: number;        // F (Total turnover in state during period)
}

export interface Rule42CalculationResult {
  engine: "RULE_42_MONTHLY";
  taxPeriod: string;
  totalInputTax_T: number;
  ineligibleExclusive_T1_T2_T3: number;
  creditToLedger_C1: number;
  exclusivelyTaxable_T4: number;
  commonCredit_C2: number;
  turnoverRatio_E_by_F: number;
  exemptReversal_D1: number;
  nonBusinessReversal_D2: number;
  totalMonthlyReversal: number;
  eligibleCommonCredit_C3: number;
  totalEligibleItcForMonth: number; // T4 + C3
  gstr3bReporting: {
    table4A5_AllOtherItc: number; // C1
    table4B1_Sec17_5: number;     // T3
    table4B2_Rule42Reversal: number; // D1 + D2
    netItcClaimed: number;        // C1 - (D1 + D2)
  };
  auditSteps: {
    stepNo: number;
    title: string;
    statutoryRef: string;
    formula: string;
    valueInr: number;
    explanation: string;
  }[];
}

export interface Rule43CapitalGoodsItem {
  id: string;
  assetDescription: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  capitalCostInr: number;
  totalInputTaxInr: number; // A
  monthsElapsed: number;   // 1 to 60
}

export interface Rule43MonthlyResult {
  engine: "RULE_43_CAPITAL_GOODS";
  taxPeriod: string;
  totalCommonCapitalCredit_Tc: number;
  monthlyAttributedCredit_Tm: number; // Tc / 60
  aggregateMonthlyCredit_Tr: number;
  turnoverRatio_E_by_F: number;
  monthlyExemptReversal_Te: number;   // (E / F) * Tr
  gstr3bReportingTable: "4(B)(2)";
  capitalAssetsCount: number;
  auditTrail: string;
}

export interface Rule42AnnualTrueUpInput {
  financialYear: string; // e.g. "FY 2025-26"
  annualTotalCommonCredit_C2: number;
  annualExemptTurnover_E: number;
  annualTotalTurnover_F: number;
  totalMonthlyReversalsAlreadyPaid: number; // Sum of (D1 + D2) paid in 12 months
  trueUpFilingDate: string; // e.g. "2026-10-20"
}

export interface Rule42AnnualTrueUpResult {
  financialYear: string;
  annualCalculatedReversal_D1_D2: number;
  totalMonthlyReversalsAlreadyPaid: number;
  differentialAmountInr: number;
  isPayable: boolean; // True if under-reversed (differential > 0)
  interestPayableSec50: number; // 18% p.a. from 1st April till true-up filing date
  reportingAction: string;
}

export class Rule42And43Engine {
  /**
   * Calculates monthly Rule 42 pro-rata reversal for inputs & input services
   */
  public static calculateMonthlyRule42(input: Rule42MonthlyInput): Rule42CalculationResult {
    const T = Math.round(input.totalInputTaxInr * 100) / 100;
    const T1 = Math.round(input.nonBusinessInputTaxInr * 100) / 100;
    const T2 = Math.round(input.exemptSuppliesInputTaxInr * 100) / 100;
    const T3 = Math.round(input.blockedInputTaxInr * 100) / 100;
    const T4 = Math.round(input.taxableSuppliesInputTaxInr * 100) / 100;
    const E = Math.max(0, input.exemptTurnoverInr);
    const F = Math.max(0, input.totalTurnoverInr);

    // Step 1: C1 = T - (T1 + T2 + T3)
    const sumIneligible = Math.round((T1 + T2 + T3) * 100) / 100;
    const C1 = Math.max(0, Math.round((T - sumIneligible) * 100) / 100);

    // Step 2: C2 = C1 - T4 (Common Credit)
    const C2 = Math.max(0, Math.round((C1 - T4) * 100) / 100);

    // Step 3: D1 = (E / F) * C2
    const ratio = F > 0 ? (E / F) : 0;
    const D1 = Math.round((ratio * C2) * 100) / 100;

    // Step 4: D2 = 5% of C2 (Non-business portion)
    const D2 = Math.round((0.05 * C2) * 100) / 100;

    const totalReversal = Math.round((D1 + D2) * 100) / 100;
    const C3 = Math.max(0, Math.round((C2 - totalReversal) * 100) / 100);
    const totalEligible = Math.round((T4 + C3) * 100) / 100;

    const auditSteps = [
      {
        stepNo: 1,
        title: "Credit Credited to Electronic Credit Ledger (C1)",
        statutoryRef: "Rule 42(1)(g) of CGST Rules, 2017",
        formula: "C1 = T - (T1 + T2 + T3)",
        valueInr: C1,
        explanation: `Gross input tax INR ${T} reduced by non-business (INR ${T1}), exempt (INR ${T2}), and Sec 17(5) blocked credit (INR ${T3}).`
      },
      {
        stepNo: 2,
        title: "Common Input Tax Credit (C2)",
        statutoryRef: "Rule 42(1)(h) of CGST Rules, 2017",
        formula: "C2 = C1 - T4",
        valueInr: C2,
        explanation: `Credit ledger amount INR ${C1} reduced by exclusively taxable supplies ITC (INR ${T4}).`
      },
      {
        stepNo: 3,
        title: "Credit Attributable to Exempt Supplies (D1)",
        statutoryRef: "Rule 42(1)(i) of CGST Rules, 2017",
        formula: "D1 = (E / F) x C2",
        valueInr: D1,
        explanation: `Exempt turnover ratio ${(ratio * 100).toFixed(4)}% (INR ${E} / INR ${F}) applied to Common Credit INR ${C2}.`
      },
      {
        stepNo: 4,
        title: "Credit Attributable to Non-Business Purpose (D2)",
        statutoryRef: "Rule 42(1)(j) of CGST Rules, 2017",
        formula: "D2 = 5% x C2",
        valueInr: D2,
        explanation: `Statutory 5% non-business attribution on common credit INR ${C2}.`
      },
      {
        stepNo: 5,
        title: "Eligible Common Credit (C3)",
        statutoryRef: "Rule 42(1)(k) of CGST Rules, 2017",
        formula: "C3 = C2 - (D1 + D2)",
        valueInr: C3,
        explanation: `Net allowable common credit remaining after statutory monthly reversal of INR ${totalReversal}.`
      }
    ];

    return {
      engine: "RULE_42_MONTHLY",
      taxPeriod: input.taxPeriod,
      totalInputTax_T: T,
      ineligibleExclusive_T1_T2_T3: sumIneligible,
      creditToLedger_C1: C1,
      exclusivelyTaxable_T4: T4,
      commonCredit_C2: C2,
      turnoverRatio_E_by_F: Math.round(ratio * 10000) / 10000,
      exemptReversal_D1: D1,
      nonBusinessReversal_D2: D2,
      totalMonthlyReversal: totalReversal,
      eligibleCommonCredit_C3: C3,
      totalEligibleItcForMonth: totalEligible,
      gstr3bReporting: {
        table4A5_AllOtherItc: C1,
        table4B1_Sec17_5: T3,
        table4B2_Rule42Reversal: totalReversal,
        netItcClaimed: Math.round((C1 - totalReversal) * 100) / 100
      },
      auditSteps
    };
  }

  /**
   * Calculates monthly Rule 43 pro-rata reversal for capital goods
   */
  public static calculateMonthlyRule43(params: {
    taxPeriod: string;
    capitalAssets: Rule43CapitalGoodsItem[];
    exemptTurnoverInr: number;
    totalTurnoverInr: number;
  }): Rule43MonthlyResult {
    let Tc = 0;

    for (const asset of params.capitalAssets) {
      if (asset.monthsElapsed <= 60) {
        Tc += asset.totalInputTaxInr;
      }
    }

    // Monthly attributed credit Tm = Tc / 60
    const Tm = Math.round((Tc / 60) * 100) / 100;
    const Tr = Tm; // Sum of Tm for all common capital assets

    const ratio = params.totalTurnoverInr > 0 ? (params.exemptTurnoverInr / params.totalTurnoverInr) : 0;
    const Te = Math.round((ratio * Tr) * 100) / 100;

    return {
      engine: "RULE_43_CAPITAL_GOODS",
      taxPeriod: params.taxPeriod,
      totalCommonCapitalCredit_Tc: Math.round(Tc * 100) / 100,
      monthlyAttributedCredit_Tm: Tm,
      aggregateMonthlyCredit_Tr: Tr,
      turnoverRatio_E_by_F: Math.round(ratio * 10000) / 10000,
      monthlyExemptReversal_Te: Te,
      gstr3bReportingTable: "4(B)(2)",
      capitalAssetsCount: params.capitalAssets.length,
      auditTrail: `Capital goods common credit INR ${Tc.toLocaleString('en-IN')} apportioned over 60 months. Monthly credit Tm = INR ${Tm}. Exempt proportion (${(ratio * 100).toFixed(2)}%) reversal Te = INR ${Te.toLocaleString('en-IN')}. Mandatory reversal in GSTR-3B Table 4(B)(2).`
    };
  }

  /**
   * Annual True-Up Reconciliation under Rule 42(2)
   */
  public static calculateAnnualTrueUpRule42(input: Rule42AnnualTrueUpInput): Rule42AnnualTrueUpResult {
    const C2 = input.annualTotalCommonCredit_C2;
    const ratio = input.annualTotalTurnover_F > 0 ? (input.annualExemptTurnover_E / input.annualTotalTurnover_F) : 0;
    
    // Annual D1 = (E / F) * C2
    const annualD1 = Math.round((ratio * C2) * 100) / 100;
    // Annual D2 = 5% of C2
    const annualD2 = Math.round((0.05 * C2) * 100) / 100;
    const annualTotalReversal = Math.round((annualD1 + annualD2) * 100) / 100;

    const differential = Math.round((annualTotalReversal - input.totalMonthlyReversalsAlreadyPaid) * 100) / 100;
    const isPayable = differential > 0;

    let interestPayable = 0;
    if (isPayable) {
      // Interest @ 18% p.a. u/s 50(1) starting from 1st April of succeeding FY
      const april1 = new Date("2026-04-01");
      const filing = new Date(input.trueUpFilingDate);
      const days = Math.max(0, Math.ceil((filing.getTime() - april1.getTime()) / (1000 * 3600 * 24)));
      interestPayable = Math.round((differential * 0.18 * (days / 365)) * 100) / 100;
    }

    return {
      financialYear: input.financialYear,
      annualCalculatedReversal_D1_D2: annualTotalReversal,
      totalMonthlyReversalsAlreadyPaid: input.totalMonthlyReversalsAlreadyPaid,
      differentialAmountInr: differential,
      isPayable,
      interestPayableSec50: interestPayable,
      reportingAction: isPayable
        ? `UNDER-REVERSAL DETECTED: Taxpayer must pay INR ${differential.toLocaleString('en-IN')} in GSTR-3B Table 4(B)(2) along with 18% interest of INR ${interestPayable.toLocaleString('en-IN')} u/s 50(1).`
        : `EXCESS REVERSAL: Taxpayer is eligible to re-claim differential ITC of INR ${Math.abs(differential).toLocaleString('en-IN')} in GSTR-3B Table 4(A)(5) before statutory November deadline.`
    };
  }
}
