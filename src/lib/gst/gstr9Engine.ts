/**
 * GSTR-9 & 9C Annual Reconciliation Matrix & Form GST DRC-03 Generator
 * 
 * Statutory Authority:
 * - Section 44 of CGST Act read with Rule 80 of CGST Rules
 * - Table 8A vs GSTR-2A/2B reconciliation
 * - Table 5 of GSTR-9C (Reconciliation of Gross Turnover as per Audited Financial Statements with Turnover as per GSTR-9)
 * - Section 73/74 voluntary tax payment via Form GST DRC-03 with Section 50 interest
 */

export interface Gstr9Table8aReconciliation {
  financialYear: string;
  table8aGstr2a2bItc: number; // Auto-populated from GSTN
  table6bItcClaimedGstr3b: number; // ITC availed in GSTR-3B during the FY
  table8bIneligibleItc17_5: number; // Ineligible ITC u/s 17(5)
  table8cItcClaimedNextFy: number; // ITC availed in subsequent FY up to 30th Nov
  table8dVariance: number; // 8A - [8B + 8C]
  table8dStatus: 'EXCESS_CLAIMED' | 'LAPSED_CREDIT' | 'RECONCILED';
  suggestedAction: string;
}

export interface Gstr9cTurnoverReconciliation {
  financialYear: string;
  auditedTurnoverPnl: number;
  unbilledRevenueOpening: number;
  unbilledRevenueClosing: number;
  advancesReceivedTaxable: number;
  tradeDiscountsCreditNotes: number;
  exemptSuppliesNilRated: number;
  adjustedTurnover: number;
  annualTurnoverGstr9: number;
  unreconciledTurnoverVariance: number;
  reasonForVariance: string[];
}

export interface Drc03VoluntaryPaymentChallan {
  challanDraftId: string;
  causeOfPayment: 'GSTR_9_RECONCILIATION' | 'SECTION_73_1_VOLUNTARY' | 'RULE_88C_DISCREPANCY';
  taxPeriod: string;
  financialYear: string;
  igstLiability: number;
  cgstLiability: number;
  sgstLiability: number;
  cessLiability: number;
  totalTaxLiability: number;
  interestSec50: number; // 18% p.a. from 20th of subsequent month
  penaltyApplicable: number; // ₹0 for voluntary payment u/s 73(5)
  totalPaymentAmount: number;
  accountingLedgerHead: string;
  statutoryDeclaration: string;
}

export class Gstr9AnnualRecoEngine {
  /**
   * Reconciles Table 8A (Portal ITC) with Table 6B (GSTR-3B availed ITC)
   */
  public static reconcileTable8A(params: {
    financialYear: string;
    table8aGstr2a2bItc: number;
    table6bItcClaimedGstr3b: number;
    table8bIneligibleItc17_5: number;
    table8cItcClaimedNextFy: number;
  }): Gstr9Table8aReconciliation {
    const totalAccounted = params.table6bItcClaimedGstr3b + params.table8bIneligibleItc17_5 + params.table8cItcClaimedNextFy;
    const variance = params.table8aGstr2a2bItc - totalAccounted;

    let status: 'EXCESS_CLAIMED' | 'LAPSED_CREDIT' | 'RECONCILED' = 'RECONCILED';
    let action = 'Books and portal ITC are in equilibrium.';

    if (variance < -5) {
      status = 'EXCESS_CLAIMED';
      action = `Excess ITC of ₹${Math.abs(variance).toLocaleString('en-IN')} claimed in GSTR-3B. Voluntary reversal via DRC-03 advised with interest u/s 50 to avoid Section 73 notice.`;
    } else if (variance > 5) {
      status = 'LAPSED_CREDIT';
      action = `Unavailed credit of ₹${variance.toLocaleString('en-IN')} in Table 8A has lapsed as the 30th November cutoff has passed.`;
    }

    return {
      financialYear: params.financialYear,
      table8aGstr2a2bItc: params.table8aGstr2a2bItc,
      table6bItcClaimedGstr3b: params.table6bItcClaimedGstr3b,
      table8bIneligibleItc17_5: params.table8bIneligibleItc17_5,
      table8cItcClaimedNextFy: params.table8cItcClaimedNextFy,
      table8dVariance: variance,
      table8dStatus: status,
      suggestedAction: action
    };
  }

  /**
   * Reconciles Audited Balance Sheet / P&L Turnover with GSTR-9 Filed Turnover
   */
  public static reconcileGstr9cTurnover(params: {
    financialYear: string;
    auditedTurnoverPnl: number;
    unbilledRevenueOpening: number;
    unbilledRevenueClosing: number;
    advancesReceivedTaxable: number;
    tradeDiscountsCreditNotes: number;
    exemptSuppliesNilRated: number;
    annualTurnoverGstr9: number;
  }): Gstr9cTurnoverReconciliation {
    // Adjusted Turnover = P&L Turnover - Unbilled Revenue Closing + Unbilled Opening + Advances - Trade Discounts
    const adjusted = params.auditedTurnoverPnl - params.unbilledRevenueClosing + params.unbilledRevenueOpening + params.advancesReceivedTaxable - params.tradeDiscountsCreditNotes;
    const variance = adjusted - params.annualTurnoverGstr9;

    const reasons: string[] = [];
    if (params.advancesReceivedTaxable > 0) {
      reasons.push(`Taxable customer advances of ₹${params.advancesReceivedTaxable.toLocaleString('en-IN')} included for GST.`);
    }
    if (params.tradeDiscountsCreditNotes > 0) {
      reasons.push(`Post-supply discounts of ₹${params.tradeDiscountsCreditNotes.toLocaleString('en-IN')} compliant with Section 15(3)(b).`);
    }
    if (Math.abs(variance) > 5) {
      reasons.push(`Unexplained variance of ₹${variance.toLocaleString('en-IN')} requiring auditor qualification in Part B of 9C.`);
    } else {
      reasons.push('Turnover reconciled with zero material variance.');
    }

    return {
      financialYear: params.financialYear,
      auditedTurnoverPnl: params.auditedTurnoverPnl,
      unbilledRevenueOpening: params.unbilledRevenueOpening,
      unbilledRevenueClosing: params.unbilledRevenueClosing,
      advancesReceivedTaxable: params.advancesReceivedTaxable,
      tradeDiscountsCreditNotes: params.tradeDiscountsCreditNotes,
      exemptSuppliesNilRated: params.exemptSuppliesNilRated,
      adjustedTurnover: adjusted,
      annualTurnoverGstr9: params.annualTurnoverGstr9,
      unreconciledTurnoverVariance: variance,
      reasonForVariance: reasons
    };
  }

  /**
   * Generates Form GST DRC-03 Voluntary Payment Challan Draft
   */
  public static generateDrc03Challan(params: {
    financialYear: string;
    taxPeriod: string;
    cause: 'GSTR_9_RECONCILIATION' | 'SECTION_73_1_VOLUNTARY' | 'RULE_88C_DISCREPANCY';
    igst: number;
    cgst: number;
    sgst: number;
    monthsDelay: number;
  }): Drc03VoluntaryPaymentChallan {
    const totalTax = params.igst + params.cgst + params.sgst;
    // Section 50(1) interest @ 18% p.a.
    const interest = Math.round((totalTax * 0.18 * (params.monthsDelay / 12)));

    return {
      challanDraftId: `DRC03-VOL-${Date.now()}`,
      causeOfPayment: params.cause,
      taxPeriod: params.taxPeriod,
      financialYear: params.financialYear,
      igstLiability: params.igst,
      cgstLiability: params.cgst,
      sgstLiability: params.sgst,
      cessLiability: 0,
      totalTaxLiability: totalTax,
      interestSec50: interest,
      penaltyApplicable: 0, // Zero penalty if paid voluntarily u/s 73(5) before notice
      totalPaymentAmount: totalTax + interest,
      accountingLedgerHead: 'Electronic Cash Ledger / Tax & Interest u/s 50',
      statutoryDeclaration: 'Voluntary discharge of tax liability ascertained under GSTR-9/9C reconciliation prior to issuance of show cause notice under Section 73(1) of CGST Act.'
    };
  }
}

export const SAMPLE_GSTR9_RECO: Gstr9Table8aReconciliation = Gstr9AnnualRecoEngine.reconcileTable8A({
  financialYear: 'FY 2024-25',
  table8aGstr2a2bItc: 4850000,
  table6bItcClaimedGstr3b: 4620000,
  table8bIneligibleItc17_5: 180000,
  table8cItcClaimedNextFy: 95000
});

export const SAMPLE_GSTR9C_TURNOVER: Gstr9cTurnoverReconciliation = Gstr9AnnualRecoEngine.reconcileGstr9cTurnover({
  financialYear: 'FY 2024-25',
  auditedTurnoverPnl: 145000000,
  unbilledRevenueOpening: 2200000,
  unbilledRevenueClosing: 3500000,
  advancesReceivedTaxable: 1800000,
  tradeDiscountsCreditNotes: 850000,
  exemptSuppliesNilRated: 5400000,
  annualTurnoverGstr9: 144650000
});

export const SAMPLE_DRC03: Drc03VoluntaryPaymentChallan = Gstr9AnnualRecoEngine.generateDrc03Challan({
  financialYear: 'FY 2024-25',
  taxPeriod: 'Annual',
  cause: 'GSTR_9_RECONCILIATION',
  igst: 85000,
  cgst: 42500,
  sgst: 42500,
  monthsDelay: 8
});
