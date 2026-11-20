/**
 * Multi-Asset Capital Gains Forensic Engine (Finance Act 2024 Updated)
 * 
 * Statutory Authority:
 * - Section 111A (STCG on equity shares/equity mutual funds @ 20% w.e.f. 23-Jul-2024)
 * - Section 112A (LTCG on equity shares @ 12.5% w.e.f. 23-Jul-2024 with Rs. 1,25,000 threshold exemption)
 * - Section 55(2)(ac) (Grandfathering of LTCG as of 31-Jan-2018)
 * - Section 112 (Long-term capital gains on unlisted shares, real estate @ 12.5% without indexation, or 20% with indexation for grandfathered pre-July-2024 real estate)
 * - Section 55(2)(b)(ii) (FMV as of 01-Apr-2001 capped at Stamp Duty Value)
 */

export interface CapitalGainAssetTransaction {
  id: string;
  assetType: 'LISTED_EQUITY' | 'EQUITY_ORIENTED_MF' | 'UNLISTED_EQUITY' | 'IMMOVABLE_PROPERTY' | 'GOLD_JEWELLERY';
  description: string;
  dateOfAcquisition: string;
  dateOfTransfer: string;
  costOfAcquisition: number;
  fmvAsOf31Jan2018?: number; // For grandfathering u/s 55(2)(ac)
  fullValueOfConsideration: number;
  transferExpenses: number;
  stampDutyValue?: number; // For Sec 50C real estate check
  
  // Computed Outputs
  periodOfHoldingMonths: number;
  isLongTerm: boolean;
  adjustedCostOfAcquisition: number;
  netConsideration: number;
  capitalGainOrLoss: number;
  applicableTaxRatePercent: number;
  taxLiabilityInr: number;
  statutorySection: '111A' | '112A' | '112' | 'Normal Slab';
  forensicNotes: string[];
}

export interface CapitalGainsAnnualSummary {
  assessmentYear: string;
  stcg111A_20Percent: number;
  stcgNormalSlab: number;
  ltcg112A_12_5Percent: number;
  ltcg112AExemptionClaimed: number; // Max ₹1,25,000
  taxableLtcg112A: number;
  ltcg112Other_12_5Percent: number;
  totalTaxPayableCapitalGains: number;
  transactions: CapitalGainAssetTransaction[];
}

export class CapitalGainsForensicEngine {
  /**
   * Evaluates single capital gains transaction under post-Budget 2024 law
   */
  public static computeTransaction(t: {
    id: string;
    assetType: 'LISTED_EQUITY' | 'EQUITY_ORIENTED_MF' | 'UNLISTED_EQUITY' | 'IMMOVABLE_PROPERTY' | 'GOLD_JEWELLERY';
    description: string;
    dateOfAcquisition: string;
    dateOfTransfer: string;
    costOfAcquisition: number;
    fmvAsOf31Jan2018?: number;
    fullValueOfConsideration: number;
    transferExpenses: number;
    stampDutyValue?: number;
  }): CapitalGainAssetTransaction {
    const acq = new Date(t.dateOfAcquisition);
    const trf = new Date(t.dateOfTransfer);
    const months = Math.floor((trf.getTime() - acq.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));

    // Holding period classification post Budget 2024:
    // Listed Securities: 12 months
    // All other assets (Real Estate, Gold, Unlisted): 24 months
    const thresholdMonths = ['LISTED_EQUITY', 'EQUITY_ORIENTED_MF'].includes(t.assetType) ? 12 : 24;
    const isLongTerm = months > thresholdMonths;

    let adjustedCost = t.costOfAcquisition;
    const notes: string[] = [];

    // Grandfathering u/s 55(2)(ac) for Listed Equity acquired prior to 01-Feb-2018
    if (isLongTerm && ['LISTED_EQUITY', 'EQUITY_ORIENTED_MF'].includes(t.assetType) && acq < new Date('2018-02-01')) {
      const fmv = t.fmvAsOf31Jan2018 || t.costOfAcquisition;
      const lowerOfFmvOrSale = Math.min(fmv, t.fullValueOfConsideration);
      adjustedCost = Math.max(t.costOfAcquisition, lowerOfFmvOrSale);
      notes.push(`Section 55(2)(ac) grandfathering applied. Cost stepped up to ₹${adjustedCost.toLocaleString('en-IN')} as of 31-Jan-2018.`);
    }

    // Section 50C Check for Immovable Property: If Stamp Duty Value > 110% of sale price
    let effectiveConsideration = t.fullValueOfConsideration;
    if (t.assetType === 'IMMOVABLE_PROPERTY' && t.stampDutyValue) {
      if (t.stampDutyValue > t.fullValueOfConsideration * 1.10) {
        effectiveConsideration = t.stampDutyValue;
        notes.push(`Section 50C invoked: Stamp Duty Value of ₹${t.stampDutyValue.toLocaleString('en-IN')} exceeds 110% of agreement value. Deemed consideration adopted.`);
      }
    }

    const netConsideration = effectiveConsideration - t.transferExpenses;
    const gainOrLoss = netConsideration - adjustedCost;

    let taxRate = 0;
    let section: '111A' | '112A' | '112' | 'Normal Slab' = 'Normal Slab';

    if (t.assetType === 'LISTED_EQUITY' || t.assetType === 'EQUITY_ORIENTED_MF') {
      if (isLongTerm) {
        taxRate = 12.5; // Post Budget 2024 LTCG u/s 112A
        section = '112A';
      } else {
        taxRate = 20.0; // Post Budget 2024 STCG u/s 111A
        section = '111A';
      }
    } else {
      if (isLongTerm) {
        taxRate = 12.5; // Section 112 without indexation
        section = '112';
      } else {
        taxRate = 30.0; // Normal slab rate
        section = 'Normal Slab';
      }
    }

    const taxLiability = gainOrLoss > 0 ? Math.round(gainOrLoss * (taxRate / 100)) : 0;

    return {
      ...t,
      periodOfHoldingMonths: months,
      isLongTerm,
      adjustedCostOfAcquisition: adjustedCost,
      netConsideration,
      capitalGainOrLoss: gainOrLoss,
      applicableTaxRatePercent: taxRate,
      taxLiabilityInr: taxLiability,
      statutorySection: section,
      forensicNotes: notes
    };
  }

  /**
   * Computes Annual Capital Gains Summary with Section 112A ₹1.25L Exemption
   */
  public static computeAnnualSummary(transactions: CapitalGainAssetTransaction[]): CapitalGainsAnnualSummary {
    let stcg111A = 0;
    let stcgNormal = 0;
    let rawLtcg112A = 0;
    let ltcg112Other = 0;

    for (const tr of transactions) {
      if (tr.statutorySection === '111A') {
        stcg111A += Math.max(0, tr.capitalGainOrLoss);
      } else if (tr.statutorySection === '112A') {
        rawLtcg112A += Math.max(0, tr.capitalGainOrLoss);
      } else if (tr.statutorySection === '112') {
        ltcg112Other += Math.max(0, tr.capitalGainOrLoss);
      } else {
        stcgNormal += Math.max(0, tr.capitalGainOrLoss);
      }
    }

    // Section 112A ₹1,25,000 threshold exemption (Budget 2024)
    const exemptionClaimed = Math.min(rawLtcg112A, 125000);
    const taxableLtcg112A = Math.max(0, rawLtcg112A - exemptionClaimed);

    const tax111A = Math.round(stcg111A * 0.20);
    const tax112A = Math.round(taxableLtcg112A * 0.125);
    const tax112Other = Math.round(ltcg112Other * 0.125);
    const totalTax = tax111A + tax112A + tax112Other;

    return {
      assessmentYear: 'AY 2025-26 (Budget 2024 Regimes)',
      stcg111A_20Percent: stcg111A,
      stcgNormalSlab: stcgNormal,
      ltcg112A_12_5Percent: rawLtcg112A,
      ltcg112AExemptionClaimed: exemptionClaimed,
      taxableLtcg112A: taxableLtcg112A,
      ltcg112Other_12_5Percent: ltcg112Other,
      totalTaxPayableCapitalGains: totalTax,
      transactions
    };
  }
}

export const SAMPLE_CAPITAL_GAINS_TRANSACTIONS: CapitalGainAssetTransaction[] = [
  CapitalGainsForensicEngine.computeTransaction({
    id: 'CG-01',
    assetType: 'LISTED_EQUITY',
    description: '1,000 shares of Reliance Industries Ltd (Grandfathered)',
    dateOfAcquisition: '2016-05-12',
    dateOfTransfer: '2026-08-15',
    costOfAcquisition: 520000,
    fmvAsOf31Jan2018: 980000,
    fullValueOfConsideration: 2850000,
    transferExpenses: 2500
  }),
  CapitalGainsForensicEngine.computeTransaction({
    id: 'CG-02',
    assetType: 'LISTED_EQUITY',
    description: '500 shares of Tata Motors Ltd (Short-Term)',
    dateOfAcquisition: '2026-02-10',
    dateOfTransfer: '2026-09-20',
    costOfAcquisition: 420000,
    fullValueOfConsideration: 650000,
    transferExpenses: 800
  }),
  CapitalGainsForensicEngine.computeTransaction({
    id: 'CG-03',
    assetType: 'IMMOVABLE_PROPERTY',
    description: 'Commercial Office Space, Apollo Tower, MG Road, Indore',
    dateOfAcquisition: '2019-11-20',
    dateOfTransfer: '2026-10-12',
    costOfAcquisition: 4500000,
    fullValueOfConsideration: 8200000,
    stampDutyValue: 8800000, // Section 50C applies
    transferExpenses: 50000
  })
];

export const SAMPLE_CAPITAL_GAINS_SUMMARY = CapitalGainsForensicEngine.computeAnnualSummary(SAMPLE_CAPITAL_GAINS_TRANSACTIONS);
