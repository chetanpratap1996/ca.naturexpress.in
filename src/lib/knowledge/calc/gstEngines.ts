/**
 * Brains & Taxes — Enterprise Deterministic Numerical Engines
 * 
 * Part 3: Indirect Tax (GST) Mathematical Engines
 * 
 * - Section 50(1) GST Interest strictly on Net Cash Ledger Liability
 * - Rule 42 CGST Rules Common Input Tax Credit Reversal Formula
 */

import { CalculationResult, CalculationScheduleItem } from './calcTypes';

export class GstCalculators {
  /**
   * Section 50(1) GST Interest Engine
   * Strictly enforces the retrospective proviso to Section 50(1):
   * Interest @ 18% per annum is payable exclusively on the NET CASH liability
   * debited to the Electronic Cash Ledger, not on the gross tax or credit ledger offset.
   */
  public static calculateSection50NetCashInterest(params: {
    grossTaxLiabilityInr: number;
    itcLedgerOffsetInr: number;
    cashLedgerDebitInr: number;
    statutoryDueDate: string;   // e.g. "2026-08-20"
    actualFilingDate: string;   // e.g. "2026-09-29"
    taxRatePcnt?: number;       // Default 18%
  }): CalculationResult {
    const due = new Date(params.statutoryDueDate);
    const filed = new Date(params.actualFilingDate);
    const schedule: CalculationScheduleItem[] = [];

    // Compute delay in calendar days
    const diffTime = Math.max(0, filed.getTime() - due.getTime());
    const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isLeapYear = (due.getFullYear() % 4 === 0 && due.getFullYear() % 100 !== 0) || (due.getFullYear() % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    const rate = params.taxRatePcnt || 18.0;

    // Strict Proviso Check: Base for interest is cashLedgerDebitInr
    const cashBase = params.cashLedgerDebitInr;
    const interestComputed = Math.round((cashBase * (rate / 100) * (delayDays / daysInYear)) * 100) / 100;

    schedule.push({
      stepNumber: 1,
      stepDescription: 'Isolate Net Tax Paid in Cash (Electronic Cash Ledger)',
      statutoryBasis: 'Proviso to Section 50(1) of CGST Act, 2017 (Retrospective w.e.f. 01.07.2017)',
      inputValue: `Gross: INR ${params.grossTaxLiabilityInr}, ITC: INR ${params.itcLedgerOffsetInr}, Cash: INR ${cashBase}`,
      appliedRateOrFormula: 'Net Cash = Gross Liability - Credit Ledger Offset',
      outputValue: cashBase,
      auditorNotes: 'ITC ledger balance protected by statutory proviso. Gross interest is legally barred.'
    });

    schedule.push({
      stepNumber: 2,
      stepDescription: 'Calendar Delay Days Computation',
      statutoryBasis: 'Section 50(1) r/w Section 39 of CGST Act',
      inputValue: `Due: ${params.statutoryDueDate}, Filed: ${params.actualFilingDate}`,
      appliedRateOrFormula: 'Calendar Days between Due Date and Filing Date',
      outputValue: delayDays,
      auditorNotes: `Delay: ${delayDays} days. Denominator used: ${daysInYear} days.`
    });

    schedule.push({
      stepNumber: 3,
      stepDescription: '18% Simple Interest Calculation on Net Cash Base',
      statutoryBasis: 'Notification No. 13/2017-CT r/w Section 50(1)',
      inputValue: `Cash Base: INR ${cashBase}, Days: ${delayDays}, Rate: 18% p.a.`,
      appliedRateOrFormula: `INR ${cashBase} x (18 / 100) x (${delayDays} / ${daysInYear})`,
      outputValue: interestComputed,
      auditorNotes: 'Accurate interest computed in paise.'
    });

    const unlawfulGrossInterest = Math.round((params.grossTaxLiabilityInr * (rate / 100) * (delayDays / daysInYear)) * 100) / 100;
    const taxSavedByProviso = Math.round((unlawfulGrossInterest - interestComputed) * 100) / 100;

    return {
      engineType: 'GST_SECTION_50_NET_CASH',
      calculationTitle: 'Section 50(1) GST Interest on Net Cash Liability',
      statutoryAuthority: 'Section 50(1) Proviso of CGST Act, 2017',
      inputParameters: params,
      primaryComputedAmountInr: interestComputed,
      statutoryRoundingApplied: 'Computed to exact paise; rounded to nearest Rupee in GSTR-3B Table 5.1.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Statutory Interest Payable: INR ${interestComputed.toLocaleString('en-IN')}. Taxpayer saved INR ${taxSavedByProviso.toLocaleString('en-IN')} by shielding the credit ledger offset under the Section 50(1) proviso.`
    };
  }

  /**
   * Rule 42 CGST Rules: Apportionment of Common Input Tax Credit
   */
  public static calculateRule42CommonCreditReversal(params: {
    totalInputTaxInr: number;        // T
    nonBusinessInputTaxInr: number;  // T1
    exemptSuppliesInputTaxInr: number; // T2
    blockedInputTaxInr: number;      // T3 (Section 17(5))
    taxableSuppliesInputTaxInr: number; // T4
    exemptTurnoverInr: number;       // E
    totalTurnoverInr: number;        // F
  }): CalculationResult {
    const T = params.totalInputTaxInr;
    const T1 = params.nonBusinessInputTaxInr;
    const T2 = params.exemptSuppliesInputTaxInr;
    const T3 = params.blockedInputTaxInr;
    const T4 = params.taxableSuppliesInputTaxInr;

    const schedule: CalculationScheduleItem[] = [];

    // Step 1: Credit credited to Electronic Credit Ledger: C1 = T - (T1 + T2 + T3)
    const C1 = T - (T1 + T2 + T3);
    schedule.push({
      stepNumber: 1,
      stepDescription: 'Credit Available in Credit Ledger (C1)',
      statutoryBasis: 'Rule 42(1)(g) of CGST Rules, 2017',
      inputValue: `T: ${T}, Ineligible (T1+T2+T3): ${T1 + T2 + T3}`,
      appliedRateOrFormula: 'C1 = T - (T1 + T2 + T3)',
      outputValue: C1,
      auditorNotes: 'Ineligible non-business, exempt and 17(5) credits excluded.'
    });

    // Step 2: Common Credit: C2 = C1 - T4
    const C2 = C1 - T4;
    schedule.push({
      stepNumber: 2,
      stepDescription: 'Common Input Tax Credit (C2)',
      statutoryBasis: 'Rule 42(1)(h) of CGST Rules, 2017',
      inputValue: `C1: ${C1}, Exclusively Taxable (T4): ${T4}`,
      appliedRateOrFormula: 'C2 = C1 - T4',
      outputValue: C2,
      auditorNotes: 'Common credit to be apportioned between taxable and exempt supplies.'
    });

    // Step 3: D1 = (E / F) * C2 (Credit attributable to exempt supplies)
    const turnoverRatio = params.totalTurnoverInr > 0 ? (params.exemptTurnoverInr / params.totalTurnoverInr) : 0;
    const D1 = Math.round((turnoverRatio * C2) * 100) / 100;
    schedule.push({
      stepNumber: 3,
      stepDescription: 'Credit Attributable to Exempt Supplies (D1)',
      statutoryBasis: 'Rule 42(1)(i) of CGST Rules, 2017',
      inputValue: `Exempt Turnover (E): ${params.exemptTurnoverInr}, Total Turnover (F): ${params.totalTurnoverInr}`,
      appliedRateOrFormula: 'D1 = (E / F) x C2',
      outputValue: D1,
      auditorNotes: `Exempt turnover proportion: ${(turnoverRatio * 100).toFixed(2)}%.`
    });

    // Step 4: D2 = 5% of C2 (Credit attributable to non-business purpose)
    const D2 = Math.round((0.05 * C2) * 100) / 100;
    schedule.push({
      stepNumber: 4,
      stepDescription: 'Credit Attributable to Non-Business Purpose (D2)',
      statutoryBasis: 'Rule 42(1)(j) of CGST Rules, 2017',
      inputValue: `Common Credit (C2): ${C2}`,
      appliedRateOrFormula: 'D2 = 5% of C2',
      outputValue: D2,
      auditorNotes: 'Mandatory 5% statutory attribution for non-business usage.'
    });

    const totalReversal = D1 + D2;

    return {
      engineType: 'RULE_42_COMMON_CREDIT_REVERSAL',
      calculationTitle: 'Rule 42 Common Input Tax Credit Monthly Reversal',
      statutoryAuthority: 'Rule 42 of Central Goods and Services Tax Rules, 2017',
      inputParameters: params,
      primaryComputedAmountInr: totalReversal,
      statutoryRoundingApplied: 'Paise rounded to 2 decimal places; reported in GSTR-3B Table 4(B)(1).',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Mandatory Monthly Reversal: INR ${totalReversal.toLocaleString('en-IN')} (Exempt D1: INR ${D1}, Non-Business D2: INR ${D2}).`
    };
  }
}
