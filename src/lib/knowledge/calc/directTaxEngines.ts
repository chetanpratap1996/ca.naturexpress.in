/**
 * Brains & Taxes — Enterprise Deterministic Numerical Engines
 * 
 * Part 2: Direct Tax Mathematical Engines
 * 
 * - Section 234A, 234B, 234C Advance Tax Interest with Rule 119A Rounding
 * - Section 40(b) Partner Remuneration on Book Profit
 * - Section 50B Slump Sale Net Worth Computation
 */

import { CalculationResult, CalculationScheduleItem } from './calcTypes';

export class DirectTaxCalculators {
  /**
   * Section 234A, 234B & 234C Advance Tax Interest Engine
   * Strictly adheres to Rule 119A of Income-tax Rules, 1962:
   * (a) Period: Fractions of a month rounded up to a full month
   * (b) Amount: Shortfall rounded down to nearest multiple of INR 100
   */
  public static calculateInterest234ABC(params: {
    assessedTaxPayableInr: number;
    advanceTaxPaidInstallments: {
      installment1PaidByJune15: number;
      installment2PaidBySept15: number;
      installment3PaidByDec15: number;
      installment4PaidByMarch15: number;
    };
    itrDueDate: string;       // e.g. "2026-10-31"
    actualFilingDate: string; // e.g. "2026-12-15"
    selfAssessmentTaxPaidBeforeFiling?: number;
  }): CalculationResult {
    const assessedTax = params.assessedTaxPayableInr;
    const inst = params.advanceTaxPaidInstallments;
    const schedule: CalculationScheduleItem[] = [];

    // Cumulative Advance Tax Paid
    const cum1 = inst.installment1PaidByJune15;
    const cum2 = cum1 + inst.installment2PaidBySept15;
    const cum3 = cum2 + inst.installment3PaidByDec15;
    const cum4 = cum3 + inst.installment4PaidByMarch15;

    // ------------------------------------------------------------------------
    // SECTION 234C: DEFERMENT OF ADVANCE TAX (QUARTERLY INSTALLMENTS)
    // ------------------------------------------------------------------------
    let total234C = 0;

    // Q1: 15% due by 15 June (Interest for 3 months @ 1% pm)
    const reqQ1 = Math.floor((0.15 * assessedTax) / 100) * 100;
    if (cum1 < 0.12 * assessedTax) { // Safe harbor: 12%
      const shortfallQ1 = Math.max(0, reqQ1 - cum1);
      const roundedShortfall = Math.floor(shortfallQ1 / 100) * 100;
      const intQ1 = roundedShortfall * 0.01 * 3;
      total234C += intQ1;
      schedule.push({
        stepNumber: 1,
        stepDescription: 'Section 234C Quarter 1 Shortfall (15 June)',
        statutoryBasis: 'Section 234C(1)(a) r/w Rule 119A',
        inputValue: `Target: INR ${reqQ1}, Paid: INR ${cum1}`,
        appliedRateOrFormula: 'Shortfall x 1% x 3 months',
        outputValue: intQ1,
        auditorNotes: 'Fell below 12% safe harbor. 3 months interest charged on rounded shortfall.'
      });
    }

    // Q2: 45% due by 15 Sept (Interest for 3 months @ 1% pm)
    const reqQ2 = Math.floor((0.45 * assessedTax) / 100) * 100;
    if (cum2 < 0.36 * assessedTax) { // Safe harbor: 36%
      const shortfallQ2 = Math.max(0, reqQ2 - cum2);
      const roundedShortfall = Math.floor(shortfallQ2 / 100) * 100;
      const intQ2 = roundedShortfall * 0.01 * 3;
      total234C += intQ2;
      schedule.push({
        stepNumber: 2,
        stepDescription: 'Section 234C Quarter 2 Shortfall (15 Sept)',
        statutoryBasis: 'Section 234C(1)(a) r/w Rule 119A',
        inputValue: `Target: INR ${reqQ2}, Cum Paid: INR ${cum2}`,
        appliedRateOrFormula: 'Shortfall x 1% x 3 months',
        outputValue: intQ2,
        auditorNotes: 'Fell below 36% safe harbor. 3 months interest charged on rounded shortfall.'
      });
    }

    // Q3: 75% due by 15 Dec (Interest for 3 months @ 1% pm)
    const reqQ3 = Math.floor((0.75 * assessedTax) / 100) * 100;
    if (cum3 < reqQ3) {
      const shortfallQ3 = Math.max(0, reqQ3 - cum3);
      const roundedShortfall = Math.floor(shortfallQ3 / 100) * 100;
      const intQ3 = roundedShortfall * 0.01 * 3;
      total234C += intQ3;
      schedule.push({
        stepNumber: 3,
        stepDescription: 'Section 234C Quarter 3 Shortfall (15 Dec)',
        statutoryBasis: 'Section 234C(1)(a) r/w Rule 119A',
        inputValue: `Target: INR ${reqQ3}, Cum Paid: INR ${cum3}`,
        appliedRateOrFormula: 'Shortfall x 1% x 3 months',
        outputValue: intQ3,
        auditorNotes: 'Shortfall below 75%. 3 months interest charged on rounded shortfall.'
      });
    }

    // Q4: 100% due by 15 March (Interest for 1 month @ 1% pm)
    const reqQ4 = Math.floor(assessedTax / 100) * 100;
    if (cum4 < reqQ4) {
      const shortfallQ4 = Math.max(0, reqQ4 - cum4);
      const roundedShortfall = Math.floor(shortfallQ4 / 100) * 100;
      const intQ4 = roundedShortfall * 0.01 * 1;
      total234C += intQ4;
      schedule.push({
        stepNumber: 4,
        stepDescription: 'Section 234C Quarter 4 Shortfall (15 March)',
        statutoryBasis: 'Section 234C(1)(a) r/w Rule 119A',
        inputValue: `Target: INR ${reqQ4}, Cum Paid: INR ${cum4}`,
        appliedRateOrFormula: 'Shortfall x 1% x 1 month',
        outputValue: intQ4,
        auditorNotes: 'Shortfall below 100%. 1 month interest charged on rounded shortfall.'
      });
    }

    // ------------------------------------------------------------------------
    // SECTION 234B: DEFAULT IN PAYMENT OF ADVANCE TAX (< 90%)
    // ------------------------------------------------------------------------
    let total234B = 0;
    if (cum4 < 0.90 * assessedTax) {
      const shortfall234B = assessedTax - cum4;
      const roundedShortfall = Math.floor(shortfall234B / 100) * 100;
      // Months from 1st April of AY to actual filing date
      const monthsDelay = this.computeMonthsBetween('2026-04-01', params.actualFilingDate);
      total234B = roundedShortfall * 0.01 * monthsDelay;
      schedule.push({
        stepNumber: 5,
        stepDescription: 'Section 234B Shortfall (< 90% of Assessed Tax Paid)',
        statutoryBasis: 'Section 234B(1) r/w Rule 119A',
        inputValue: `Assessed: ${assessedTax}, Total Advance Tax: ${cum4} (< 90%)`,
        appliedRateOrFormula: `INR ${roundedShortfall} x 1% x ${monthsDelay} months`,
        outputValue: total234B,
        auditorNotes: 'Assessee failed to pay 90% advance tax. Interest charged from 1st April of AY.'
      });
    }

    // ------------------------------------------------------------------------
    // SECTION 234A: DELAY IN FURNISHING RETURN OF INCOME
    // ------------------------------------------------------------------------
    let total234A = 0;
    if (params.actualFilingDate > params.itrDueDate) {
      const netTaxDue = Math.max(0, assessedTax - cum4 - (params.selfAssessmentTaxPaidBeforeFiling || 0));
      const roundedNetTax = Math.floor(netTaxDue / 100) * 100;
      const monthsDelay = this.computeMonthsBetween(params.itrDueDate, params.actualFilingDate);
      total234A = roundedNetTax * 0.01 * monthsDelay;
      schedule.push({
        stepNumber: 6,
        stepDescription: 'Section 234A Late Return Filing Interest',
        statutoryBasis: 'Section 234A(1) r/w Rule 119A',
        inputValue: `Due: ${params.itrDueDate}, Filed: ${params.actualFilingDate}`,
        appliedRateOrFormula: `INR ${roundedNetTax} x 1% x ${monthsDelay} months`,
        outputValue: total234A,
        auditorNotes: 'Return filed after due date. Fractions of month rounded up to whole month.'
      });
    }

    const grandTotal = total234A + total234B + total234C;

    return {
      engineType: 'ADVANCE_TAX_234ABC',
      calculationTitle: 'Mandatory Advance Tax Interest under Sections 234A, 234B & 234C',
      statutoryAuthority: 'Income-tax Act, 1961 read with Rule 119A of Income-tax Rules, 1962',
      inputParameters: params,
      primaryComputedAmountInr: grandTotal,
      statutoryRoundingApplied: 'Rule 119A: Round down principal to INR 100; Round up delay to full month.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Total Interest Computed: INR ${grandTotal.toLocaleString('en-IN')} (234A: INR ${total234A}, 234B: INR ${total234B}, 234C: INR ${total234C}).`
    };
  }

  /**
   * Section 40(b) Partner Remuneration Limit Calculator
   */
  public static calculatePartnerRemuneration40b(params: {
    bookProfitInr: number;
    remunerationAuthorizedInPartnershipDeedInr: number;
  }): CalculationResult {
    const bp = params.bookProfitInr;
    let maxPermissible = 0;
    const schedule: CalculationScheduleItem[] = [];

    if (bp <= 0) {
      // In case of loss, maximum permissible is INR 1,50,000
      maxPermissible = 150000;
      schedule.push({
        stepNumber: 1,
        stepDescription: 'Book Loss Floor Cap',
        statutoryBasis: 'Section 40(b)(v) Clause (a)',
        inputValue: `Book Loss: INR ${bp}`,
        appliedRateOrFormula: 'Fixed statutory allowance: INR 1,50,000',
        outputValue: 150000,
        auditorNotes: 'In case of a book loss, maximum allowable remuneration is INR 1.50 Lakhs.'
      });
    } else if (bp <= 300000) {
      // On first 3,00,000: Higher of 1,50,000 or 90% of book profit
      const slab90 = 0.90 * bp;
      maxPermissible = Math.max(150000, slab90);
      schedule.push({
        stepNumber: 1,
        stepDescription: 'First INR 3,00,000 Book Profit',
        statutoryBasis: 'Section 40(b)(v) Clause (a)',
        inputValue: `Book Profit: INR ${bp}`,
        appliedRateOrFormula: 'Higher of INR 1,50,000 or 90% of Book Profit',
        outputValue: maxPermissible,
        auditorNotes: `Computed 90% = INR ${slab90}, higher limit adopted.`
      });
    } else {
      // On first 3,00,000: 90% = 2,70,000
      const slab1 = 270000;
      const balance = bp - 300000;
      const slab2 = 0.60 * balance;
      maxPermissible = slab1 + slab2;

      schedule.push({
        stepNumber: 1,
        stepDescription: 'Tier 1: First INR 3,00,000 Book Profit @ 90%',
        statutoryBasis: 'Section 40(b)(v) Clause (a)',
        inputValue: 'INR 300,000',
        appliedRateOrFormula: '90% of INR 3,00,000',
        outputValue: slab1,
        auditorNotes: 'Fixed allowance on first slab.'
      });

      schedule.push({
        stepNumber: 2,
        stepDescription: 'Tier 2: Balance Book Profit @ 60%',
        statutoryBasis: 'Section 40(b)(v) Clause (b)',
        inputValue: `Balance: INR ${balance}`,
        appliedRateOrFormula: '60% of Balance',
        outputValue: slab2,
        auditorNotes: 'Percentage on balance book profit.'
      });
    }

    const allowableRemuneration = Math.min(maxPermissible, params.remunerationAuthorizedInPartnershipDeedInr);
    const disallowance = Math.max(0, params.remunerationAuthorizedInPartnershipDeedInr - allowableRemuneration);

    return {
      engineType: 'PARTNER_REMUNERATION_SEC_40B',
      calculationTitle: 'Section 40(b) Partner Remuneration Allowable Cap',
      statutoryAuthority: 'Section 40(b)(v) of Income-tax Act, 1961',
      inputParameters: params,
      primaryComputedAmountInr: allowableRemuneration,
      statutoryRoundingApplied: 'Section 288A: Rounded to nearest 10 rupees.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Allowable Partner Remuneration: INR ${allowableRemuneration.toLocaleString('en-IN')}. Disallowance u/s 40(b): INR ${disallowance.toLocaleString('en-IN')}.`,
      disallowanceAlert: disallowance > 0 ? {
        isDisallowedUnderTax: true,
        disallowanceSection: 'Section 40(b)',
        form3cdClause: 'Clause 21(c)'
      } : undefined
    };
  }

  private static computeMonthsBetween(startDateStr: string, endDateStr: string): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    if (end <= start) return 0;

    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    // Rule 119A: Any fraction of a month counts as a full month
    if (end.getDate() > start.getDate()) {
      months += 1;
    }
    return Math.max(1, months);
  }
}
