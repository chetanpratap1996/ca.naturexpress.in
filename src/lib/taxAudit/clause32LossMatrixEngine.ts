/**
 * Form 3CD Clause 32 Brought Forward Loss & Unabsorbed Depreciation Matrix
 * 
 * Statutory Authority:
 * - Section 71, 72, 73, 74 of Income Tax Act (Carry forward and set off of business losses & capital losses)
 * - Section 32(2) (Indefinite carry forward and set off of unabsorbed depreciation)
 * - Section 72(3) (Business loss carry-forward restricted to maximum 8 assessment years)
 * - Section 73(4) (Speculation business loss restricted to 4 assessment years)
 * - Section 80 (Return must be filed within due date u/s 139(1) for loss carry forward)
 */

export interface LossYearRecord {
  assessmentYear: string;
  lossCategory: 'BUSINESS_LOSS_SEC72' | 'SPECULATION_LOSS_SEC73' | 'UNABSORBED_DEPRECIATION_SEC32_2' | 'STCG_LOSS_SEC74' | 'LTCG_LOSS_SEC74';
  originalLossAmountInr: number;
  returnFilingDate: string;
  filedWithinDueSec139_1: boolean;
  yearsCarriedForward: number;
  maxStatutoryCarryYears: number; // 8 for business, 4 for speculation, Infinity for unabsorbed depn
  isLapsedByLimitation: boolean;
  lossSetOffCurrentYear: number;
  balanceLossCarriedForward: number;
}

export interface Clause32SummaryReport {
  currentAssessmentYear: string;
  totalBusinessLossCarriedForward: number;
  totalUnabsorbedDepreciationCarriedForward: number;
  totalCapitalLossesCarriedForward: number;
  totalLossLapsedThisYear: number;
  records: LossYearRecord[];
}

export class Clause32LossMatrixEngine {
  /**
   * Evaluates brought-forward losses and applies 8-year limitation and Section 80 rules
   */
  public static evaluateLossMatrix(records: Array<{
    assessmentYear: string;
    lossCategory: 'BUSINESS_LOSS_SEC72' | 'SPECULATION_LOSS_SEC73' | 'UNABSORBED_DEPRECIATION_SEC32_2' | 'STCG_LOSS_SEC74' | 'LTCG_LOSS_SEC74';
    originalLossAmountInr: number;
    returnFilingDate: string;
    filedWithinDueSec139_1: boolean;
    yearsElapsed: number;
    lossSetOffCurrentYear: number;
  }>): Clause32SummaryReport {
    let busLossSum = 0;
    let depnSum = 0;
    let capLossSum = 0;
    let lapsedSum = 0;

    const audited = records.map(r => {
      let maxYears = 8;
      if (r.lossCategory === 'SPECULATION_LOSS_SEC73') maxYears = 4;
      if (r.lossCategory === 'UNABSORBED_DEPRECIATION_SEC32_2') maxYears = 999; // Indefinite

      // Section 80: If return not filed on time, loss cannot be carried forward (except unabsorbed depn)
      const isDisallowedSec80 = !r.filedWithinDueSec139_1 && r.lossCategory !== 'UNABSORBED_DEPRECIATION_SEC32_2';
      const isLapsed = (r.yearsElapsed > maxYears) || isDisallowedSec80;

      const balance = isLapsed ? 0 : Math.max(0, r.originalLossAmountInr - r.lossSetOffCurrentYear);

      if (isLapsed) {
        lapsedSum += r.originalLossAmountInr;
      } else {
        if (r.lossCategory === 'BUSINESS_LOSS_SEC72') busLossSum += balance;
        else if (r.lossCategory === 'UNABSORBED_DEPRECIATION_SEC32_2') depnSum += balance;
        else capLossSum += balance;
      }

      return {
        ...r,
        yearsCarriedForward: r.yearsElapsed,
        maxStatutoryCarryYears: maxYears,
        isLapsedByLimitation: isLapsed,
        balanceLossCarriedForward: balance
      };
    });

    return {
      currentAssessmentYear: 'AY 2025-26',
      totalBusinessLossCarriedForward: busLossSum,
      totalUnabsorbedDepreciationCarriedForward: depnSum,
      totalCapitalLossesCarriedForward: capLossSum,
      totalLossLapsedThisYear: lapsedSum,
      records: audited
    };
  }
}

export const SAMPLE_CLAUSE_32_RECORDS = Clause32LossMatrixEngine.evaluateLossMatrix([
  {
    assessmentYear: 'AY 2017-18', // 8th Year!
    lossCategory: 'BUSINESS_LOSS_SEC72',
    originalLossAmountInr: 450000,
    returnFilingDate: '2017-09-28',
    filedWithinDueSec139_1: true,
    yearsElapsed: 8,
    lossSetOffCurrentYear: 200000
  },
  {
    assessmentYear: 'AY 2020-21',
    lossCategory: 'UNABSORBED_DEPRECIATION_SEC32_2',
    originalLossAmountInr: 1250000,
    returnFilingDate: '2021-02-14',
    filedWithinDueSec139_1: false, // Allowed even if belated u/s 32(2)!
    yearsElapsed: 5,
    lossSetOffCurrentYear: 0
  },
  {
    assessmentYear: 'AY 2023-24',
    lossCategory: 'STCG_LOSS_SEC74',
    originalLossAmountInr: 180000,
    returnFilingDate: '2023-07-25',
    filedWithinDueSec139_1: true,
    yearsElapsed: 2,
    lossSetOffCurrentYear: 80000
  }
]);
