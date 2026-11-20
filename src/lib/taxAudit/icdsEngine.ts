/**
 * Form 3CD Clause 13(d) & ICDS (Income Computation and Disclosure Standards I to X) Engine
 * 
 * Statutory Authority:
 * - Section 145(2) of Income Tax Act
 * - Notification No. 87/2016 [F.No.133/23/2015-TPL] (ICAI & CBDT ICDS Standards I through X)
 * - Form 3CD Clause 13(d) (Increase/Decrease in Profit with respect to each ICDS)
 * - Form 3CD Clause 13(e) (Disclosures as per ICDS)
 */

export interface IcdsAdjustmentItem {
  icdsNumber: 'ICDS_I' | 'ICDS_II' | 'ICDS_III' | 'ICDS_IV' | 'ICDS_V' | 'ICDS_VII' | 'ICDS_IX' | 'ICDS_X';
  standardName: string;
  accountingStandardEquivalent: string;
  increaseInProfitInr: number;
  decreaseInProfitInr: number;
  netImpactInr: number;
  statutoryReason: string;
  mandatoryDisclosureNotes: string[];
}

export interface IcdsClause13AuditReport {
  assessmentYear: string;
  totalIncreaseInProfit: number;
  totalDecreaseInProfit: number;
  netAdjustmentToTaxableProfit: number; // Net addition to P&L for PGBP computation
  standards: IcdsAdjustmentItem[];
}

export class IcdsClause13Engine {
  /**
   * Evaluates ICDS I to X adjustments and computes net PGBP adjustment
   */
  public static computeIcdsAdjustments(adjustments: IcdsAdjustmentItem[]): IcdsClause13AuditReport {
    let totalInc = 0;
    let totalDec = 0;

    for (const a of adjustments) {
      totalInc += a.increaseInProfitInr;
      totalDec += a.decreaseInProfitInr;
    }

    const netImpact = totalInc - totalDec;

    return {
      assessmentYear: 'AY 2025-26',
      totalIncreaseInProfit: totalInc,
      totalDecreaseInProfit: totalDec,
      netAdjustmentToTaxableProfit: netImpact,
      standards: adjustments
    };
  }
}

export const SAMPLE_ICDS_ADJUSTMENTS: IcdsAdjustmentItem[] = [
  {
    icdsNumber: 'ICDS_I',
    standardName: 'Accounting Policies',
    accountingStandardEquivalent: 'AS 1 / Ind AS 1',
    increaseInProfitInr: 0,
    decreaseInProfitInr: 0,
    netImpactInr: 0,
    statutoryReason: 'Mark-to-market losses not recognized per ICDS I Para 4 unless specifically permitted.',
    mandatoryDisclosureNotes: ['No change in significant accounting policies having tax impact.']
  },
  {
    icdsNumber: 'ICDS_II',
    standardName: 'Valuation of Inventories',
    accountingStandardEquivalent: 'AS 2 / Ind AS 2',
    increaseInProfitInr: 450000,
    decreaseInProfitInr: 0,
    netImpactInr: 450000,
    statutoryReason: 'Section 145A requires inclusive method of inventory valuation: GST on opening and closing stock added back.',
    mandatoryDisclosureNotes: ['Inventories valued at lower of actual cost or net realizable value using FIFO.']
  },
  {
    icdsNumber: 'ICDS_III',
    standardName: 'Construction Contracts',
    accountingStandardEquivalent: 'AS 7 / Ind AS 115',
    increaseInProfitInr: 280000,
    decreaseInProfitInr: 0,
    netImpactInr: 280000,
    statutoryReason: 'Percentage of Completion Method (POCM) recognized up to reporting date; early-stage margin recognized.',
    mandatoryDisclosureNotes: ['Contract revenue recognized based on percentage of completion method.']
  },
  {
    icdsNumber: 'ICDS_IV',
    standardName: 'Revenue Recognition',
    accountingStandardEquivalent: 'AS 9 / Ind AS 115',
    increaseInProfitInr: 0,
    decreaseInProfitInr: 120000,
    netImpactInr: -120000,
    statutoryReason: 'Service revenue deferred as significant uncertainty in ultimate collection exists.',
    mandatoryDisclosureNotes: ['Revenue from services recognized on proportionate completion method.']
  },
  {
    icdsNumber: 'ICDS_VII',
    standardName: 'Government Grants',
    accountingStandardEquivalent: 'AS 12 / Ind AS 20',
    increaseInProfitInr: 500000,
    decreaseInProfitInr: 0,
    netImpactInr: 500000,
    statutoryReason: 'State industrial capital subsidy treated as revenue receipt u/s 2(24)(xviii) per ICDS VII.',
    mandatoryDisclosureNotes: ['Government grant of ₹5.00 Lakhs received from MPIDC credited to P&L.']
  }
];

export const SAMPLE_ICDS_REPORT = IcdsClause13Engine.computeIcdsAdjustments(SAMPLE_ICDS_ADJUSTMENTS);
