/**
 * Brains & Taxes — Enterprise Deterministic Numerical Engines
 * 
 * Part 4: Corporate Law & Allied Mathematical Engines
 * 
 * - Section 186 Companies Act Inter-Corporate Loans & Investments Cap
 * - Section 16 MSMED Act Compound Interest with Monthly Rests (3x Bank Rate)
 */

import { CalculationResult, CalculationScheduleItem } from './calcTypes';

export class CorporateAlliedCalculators {
  /**
   * Section 186 Companies Act Limit Calculator
   * Permissible Board Limit = Higher of:
   * (a) 60% of (Paid-up Capital + Free Reserves + Securities Premium) OR
   * (b) 100% of (Free Reserves + Securities Premium)
   */
  public static calculateSection186Cap(params: {
    paidUpShareCapitalInr: number;
    freeReservesInr: number;
    securitiesPremiumInr: number;
    proposedLoanOrInvestmentInr: number;
    existingLoansAndInvestmentsInr?: number;
  }): CalculationResult {
    const capital = params.paidUpShareCapitalInr;
    const reserves = params.freeReservesInr;
    const premium = params.securitiesPremiumInr;
    const existing = params.existingLoansAndInvestmentsInr || 0;
    const proposed = params.proposedLoanOrInvestmentInr;
    const totalExposure = existing + proposed;

    const schedule: CalculationScheduleItem[] = [];

    // Test 1: 60% of (Capital + Free Reserves + Securities Premium)
    const netBase60 = capital + reserves + premium;
    const limit60 = Math.round(0.60 * netBase60);
    schedule.push({
      stepNumber: 1,
      stepDescription: '60% Net Worth Test',
      statutoryBasis: 'Section 186(2) Clause (a) of Companies Act, 2013',
      inputValue: `Capital: ${capital}, Reserves: ${reserves}, Premium: ${premium} (Total: ${netBase60})`,
      appliedRateOrFormula: '60% of (Paid-up Capital + Free Reserves + Securities Premium)',
      outputValue: limit60,
      auditorNotes: 'Evaluated under 60% statutory threshold.'
    });

    // Test 2: 100% of (Free Reserves + Securities Premium)
    const netBase100 = reserves + premium;
    const limit100 = netBase100;
    schedule.push({
      stepNumber: 2,
      stepDescription: '100% Free Reserves Test',
      statutoryBasis: 'Section 186(2) Clause (b) of Companies Act, 2013',
      inputValue: `Reserves: ${reserves}, Premium: ${premium} (Total: ${netBase100})`,
      appliedRateOrFormula: '100% of (Free Reserves + Securities Premium)',
      outputValue: limit100,
      auditorNotes: 'Evaluated under 100% reserves threshold.'
    });

    const statutoryCeiling = Math.max(limit60, limit100);
    const requiresSpecialResolution = totalExposure > statutoryCeiling;

    schedule.push({
      stepNumber: 3,
      stepDescription: 'Determine Permissible Board Limit (Higher of Two Limits)',
      statutoryBasis: 'Section 186(2) of Companies Act, 2013',
      inputValue: `Limit 60%: ${limit60}, Limit 100%: ${limit100}`,
      appliedRateOrFormula: 'Higher of Test 1 or Test 2',
      outputValue: statutoryCeiling,
      auditorNotes: `Adopted higher ceiling of INR ${statutoryCeiling.toLocaleString('en-IN')}.`
    });

    return {
      engineType: 'SECTION_186_INTERCORPORATE_CAP',
      calculationTitle: 'Section 186 Inter-Corporate Loan & Investment Threshold',
      statutoryAuthority: 'Section 186 of Companies Act, 2013',
      inputParameters: params,
      primaryComputedAmountInr: statutoryCeiling,
      statutoryRoundingApplied: 'Exact Rupees.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Statutory Board Limit: INR ${statutoryCeiling.toLocaleString('en-IN')}. Total Exposure: INR ${totalExposure.toLocaleString('en-IN')}. Special Resolution under Section 186(3) ${requiresSpecialResolution ? 'MANDATORILY REQUIRED (Form MGT-14)' : 'NOT REQUIRED (Within Board Authority)'}.`
    };
  }

  /**
   * Section 16 MSMED Act: Mandatory Compound Interest with Monthly Rests
   * Rate: 3 times the Bank Rate notified by RBI.
   * Section 23 MSMED Act: Inadmissible as deduction under Income-tax Act.
   */
  public static calculateMsmedSection16Interest(params: {
    unpaidPrincipalInr: number;
    statutoryAppointedDay: string;  // e.g. "2024-05-15" (15 or 45 days from invoice)
    actualPaymentDate: string;      // e.g. "2024-08-30"
    rbiRepoRatePcnt?: number;        // Default 6.50%
  }): CalculationResult {
    const P = params.unpaidPrincipalInr;
    const appointed = new Date(params.statutoryAppointedDay);
    const paid = new Date(params.actualPaymentDate);
    const schedule: CalculationScheduleItem[] = [];

    // Bank Rate = Repo Rate + 200 bps per RBI convention (e.g. 6.50 + 2.00 = 8.50%)
    const repoRate = params.rbiRepoRatePcnt || 6.50;
    const bankRate = repoRate + 2.00;
    const msmeRate = 3 * bankRate; // 3 times Bank Rate (e.g. 25.50%)

    schedule.push({
      stepNumber: 1,
      stepDescription: 'Statutory MSME Interest Rate Determination (3x Bank Rate)',
      statutoryBasis: 'Section 16 of MSMED Act, 2006 r/w RBI Master Directions',
      inputValue: `RBI Repo Rate: ${repoRate.toFixed(2)}%, Bank Rate: ${bankRate.toFixed(2)}%`,
      appliedRateOrFormula: 'MSME Rate = 3 x Bank Rate',
      outputValue: msmeRate,
      auditorNotes: `Applicable penal rate: ${msmeRate.toFixed(2)}% per annum.`
    });

    // Compute monthly compounding
    const diffTime = Math.max(0, paid.getTime() - appointed.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = totalDays / 30.4167; // Average month length

    // Compound Interest with Monthly Rests: A = P * (1 + r/12)^n
    const monthlyRate = (msmeRate / 100) / 12;
    const compoundAmount = P * Math.pow(1 + monthlyRate, months);
    const interestAccrued = Math.round((compoundAmount - P) * 100) / 100;

    schedule.push({
      stepNumber: 2,
      stepDescription: 'Compound Interest Calculation with Monthly Rests',
      statutoryBasis: 'Section 16, Micro, Small and Medium Enterprises Development Act, 2006',
      inputValue: `Principal: INR ${P}, Overdue Days: ${totalDays} (~${months.toFixed(1)} months)`,
      appliedRateOrFormula: 'Interest = P x [(1 + r/12)^n - 1] (Monthly Compounding)',
      outputValue: interestAccrued,
      auditorNotes: 'Compounded with monthly rests strictly as mandated by Section 16.'
    });

    return {
      engineType: 'MSME_COMPOUND_INTEREST_SEC16',
      calculationTitle: 'Section 16 MSMED Act Compound Interest on Delayed Payments',
      statutoryAuthority: 'Section 16 read with Section 23 of MSMED Act, 2006',
      inputParameters: params,
      primaryComputedAmountInr: interestAccrued,
      statutoryRoundingApplied: 'Computed in paise; rounded to nearest Rupee in financial statements.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Statutory MSME Compound Interest Accrued: INR ${interestAccrued.toLocaleString('en-IN')} (Applicable rate: ${msmeRate.toFixed(2)}% p.a. with monthly rests).`,
      disallowanceAlert: {
        isDisallowedUnderTax: true,
        disallowanceSection: 'Section 23 of MSMED Act, 2006',
        form3cdClause: 'Clause 22'
      }
    };
  }
}
