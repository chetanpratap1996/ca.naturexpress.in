/**
 * Form 10-IEA & Section 115BAC Opt-Out / Opt-In Engine
 * 
 * Statutory Authority:
 * - Sub-section (6) of Section 115BAC of Income Tax Act read with Rule 21AGA
 * - Form 10-IEA (Application for exercise of option u/s 115BAC(6) by Person having Income from Business and Profession)
 * - Assessees having PGBP can opt out of New Regime into Old Regime only ONCE in a lifetime,
 *   and can re-enter New Regime once, after which they can NEVER opt out again!
 */

export interface Form10IeaRecord {
  ackNumber: string;
  assesseePan: string;
  assesseeName: string;
  assessmentYear: string;
  filingDate: string;
  hasPgbpIncome: boolean;
  actionType: 'OPT_OUT_TO_OLD' | 'RE_ENTER_NEW' | 'WITHDRAWAL';
  historicalOptOutYears: string[];
  isEligibleToOptOut: boolean;
  statutoryLockoutActive: boolean;
  statutoryRuleSummary: string;
}

export class Form10IeaEngine {
  /**
   * Validates if an assessee with PGBP can file Form 10-IEA for the current AY
   */
  public static evaluateEligibility(params: {
    assesseePan: string;
    assesseeName: string;
    assessmentYear: string;
    hasPgbpIncome: boolean;
    historicalOptOutYears: string[];
    hasReEnteredNewRegimeInPast: boolean;
  }): Form10IeaRecord {
    // If assessee does NOT have PGBP income, Section 115BAC choice is made annually in ITR without Form 10-IEA
    if (!params.hasPgbpIncome) {
      return {
        ackNumber: `NOT-REQ-${Date.now()}`,
        assesseePan: params.assesseePan,
        assesseeName: params.assesseeName,
        assessmentYear: params.assessmentYear,
        filingDate: new Date().toISOString().split('T')[0],
        hasPgbpIncome: false,
        actionType: 'OPT_OUT_TO_OLD',
        historicalOptOutYears: params.historicalOptOutYears,
        isEligibleToOptOut: true,
        statutoryLockoutActive: false,
        statutoryRuleSummary: 'Non-business assessee (Salaried / House Property). Form 10-IEA is NOT required; regime choice can be toggled every year directly inside ITR-1/2 before due date u/s 139(1).'
      };
    }

    // Assessee has PGBP income: Check lifetime limit
    if (params.hasReEnteredNewRegimeInPast) {
      // Once re-entered New Regime, permanently barred from opting out again per Section 115BAC(6) Proviso!
      return {
        ackNumber: `REJECTED-LOCKOUT-${Date.now()}`,
        assesseePan: params.assesseePan,
        assesseeName: params.assesseeName,
        assessmentYear: params.assessmentYear,
        filingDate: new Date().toISOString().split('T')[0],
        hasPgbpIncome: true,
        actionType: 'OPT_OUT_TO_OLD',
        historicalOptOutYears: params.historicalOptOutYears,
        isEligibleToOptOut: false,
        statutoryLockoutActive: true,
        statutoryRuleSummary: 'STATUTORY LOCKOUT ACTIVE: Assessee previously exercised option to re-enter Section 115BAC New Regime. Per Section 115BAC(6) proviso, person having business income cannot opt out again in any subsequent year.'
      };
    }

    const isFirstTimeOptOut = params.historicalOptOutYears.length === 0;

    return {
      ackNumber: `10IEA-${params.assessmentYear.replace(/\s+/g, '')}-${Date.now()}`,
      assesseePan: params.assesseePan,
      assesseeName: params.assesseeName,
      assessmentYear: params.assessmentYear,
      filingDate: new Date().toISOString().split('T')[0],
      hasPgbpIncome: true,
      actionType: isFirstTimeOptOut ? 'OPT_OUT_TO_OLD' : 'RE_ENTER_NEW',
      historicalOptOutYears: params.historicalOptOutYears,
      isEligibleToOptOut: true,
      statutoryLockoutActive: false,
      statutoryRuleSummary: isFirstTimeOptOut 
        ? 'Eligible for Form 10-IEA. First-time exercise of option to opt out of Section 115BAC and claim Chapter VI-A & Section 32 deductions under Old Regime. Must be filed on or before due date specified u/s 139(1).'
        : 'Eligible to re-enter New Regime. Note: Upon re-entering, option to choose Old Regime will be permanently closed for future years.'
    };
  }
}

export const SAMPLE_FORM_10IEA: Form10IeaRecord = Form10IeaEngine.evaluateEligibility({
  assesseePan: 'AAACG1234F',
  assesseeName: 'Pratwi Solutions Private Limited',
  assessmentYear: 'AY 2025-26',
  hasPgbpIncome: true,
  historicalOptOutYears: [],
  hasReEnteredNewRegimeInPast: false
});
