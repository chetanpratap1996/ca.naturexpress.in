/**
 * RBI IRAC Norms, NPA Classification & Drawing Power (DP) Engine
 * 
 * Statutory Authority:
 * - RBI Master Circular on Prudential Norms on Income Recognition, 
 *   Asset Classification and Provisioning pertaining to Advances (IRAC Norms)
 * - Tandon & Nayak Committee guidelines for Working Capital Drawing Power calculation
 * - RBI LFAR (Long Form Audit Report) Format for Statutory Bank Branch Audits
 */

export type AssetClassification = 
  | 'STANDARD'
  | 'SMA_0'
  | 'SMA_1'
  | 'SMA_2'
  | 'SUB_STANDARD'
  | 'DOUBTFUL_1'
  | 'DOUBTFUL_2'
  | 'DOUBTFUL_3'
  | 'LOSS';

export interface BankAdvanceAccount {
  accountNumber: string;
  borrowerName: string;
  facilityType: 'CASH_CREDIT' | 'TERM_LOAN' | 'OVERDRAFT' | 'LETTER_OF_CREDIT';
  sanctionedLimit: number;
  outstandingBalance: number;
  drawingPower: number;
  daysOverdue: number;
  securityValuationSecured: number;
  unsecuredPortion: number;
  
  // Primary Security (Stock & Book Debts)
  stockStatementDate?: string;
  isStockStatementStale: boolean; // Over 3 months stale triggers automatic NPA u/s IRAC
  
  // Classification
  currentClassification: AssetClassification;
  recommendedClassification: AssetClassification;
  isMocRequired: boolean; // Memorandum of Changes
  
  // Provisioning
  branchProvision: number;
  statutoryRequiredProvision: number;
  differentialProvisionMoc: number;
  
  notes: string[];
}

export interface DrawingPowerComputation {
  accountNumber: string;
  borrowerName: string;
  statementDate: string;
  
  // Raw Stock Data
  rawMaterial: number;
  workInProgress: number;
  finishedGoods: number;
  storesAndSpares: number; // Ineligible for DP
  grossStock: number;
  
  // Deductions
  sundryCreditorsForPurchases: number; // Unpaid stock
  obsoleteOrNonMovingStock: number;
  netEligibleStock: number;
  stockMarginPercent: number; // e.g., 25%
  eligibleStockForDp: number;
  
  // Book Debts / Receivables
  totalDebtors: number;
  debtorsOver90Days: number; // Ineligible
  debtorsWithin90Days: number; // Eligible
  debtorsMarginPercent: number; // e.g., 40%
  eligibleDebtorsForDp: number;
  
  // Final DP Calculation
  totalCalculatedDrawingPower: number;
  sanctionedLimit: number;
  effectiveDrawingPower: number; // Min of DP or Sanction Limit
  currentOutstanding: number;
  excessDrawings: number; // Overdrawn amount
  isOverdrawn: boolean;
  penalInterestExposure: number; // 2% on excess drawing
}

export class IracNpaEngine {
  /**
   * Evaluates RBI IRAC Asset Classification & Provisioning
   */
  public static classifyAdvance(
    daysOverdue: number, 
    outstanding: number, 
    securedAmount: number, 
    isStockStale: boolean,
    existingClassification: AssetClassification
  ): { 
    classification: AssetClassification; 
    requiredProvision: number; 
    reason: string 
  } {
    // Over 90 days stale stock statement automatically classifies advance as Sub-standard/NPA
    if (isStockStale) {
      const prov = Math.round(outstanding * 0.15);
      return {
        classification: 'SUB_STANDARD',
        requiredProvision: prov,
        reason: 'Stock statement is overdue > 90 days. Per RBI IRAC Master Circular Para 4.2.4, advance is classified as NPA Sub-Standard regardless of record of recovery.'
      };
    }

    if (daysOverdue === 0) {
      const prov = Math.round(outstanding * 0.004); // Standard advance 0.40% provision
      return {
        classification: 'STANDARD',
        requiredProvision: prov,
        reason: 'Regular standard account. Standard asset provision @ 0.40% applicable.'
      };
    }

    if (daysOverdue <= 30) {
      const prov = Math.round(outstanding * 0.004);
      return {
        classification: 'SMA_0',
        requiredProvision: prov,
        reason: 'Overdue 1-30 days. Special Mention Account SMA-0.'
      };
    }

    if (daysOverdue <= 60) {
      const prov = Math.round(outstanding * 0.004);
      return {
        classification: 'SMA_1',
        requiredProvision: prov,
        reason: 'Overdue 31-60 days. Special Mention Account SMA-1.'
      };
    }

    if (daysOverdue <= 90) {
      const prov = Math.round(outstanding * 0.004);
      return {
        classification: 'SMA_2',
        requiredProvision: prov,
        reason: 'Overdue 61-90 days. Special Mention Account SMA-2. Immediate SMA report to CRILC.'
      };
    }

    // NPA Classification (> 90 days overdue)
    if (daysOverdue <= 455) { // Up to 1 year as NPA (90 + 365 days)
      const unsecured = Math.max(0, outstanding - securedAmount);
      const prov = Math.round((securedAmount * 0.15) + (unsecured * 0.25));
      return {
        classification: 'SUB_STANDARD',
        requiredProvision: prov,
        reason: 'NPA Sub-Standard. 15% provision on secured portion, 25% on unsecured portion.'
      };
    }

    if (daysOverdue <= 820) { // Doubtful 1 (Sub-standard for 1 year)
      const unsecured = Math.max(0, outstanding - securedAmount);
      const prov = Math.round((securedAmount * 0.25) + (unsecured * 1.0));
      return {
        classification: 'DOUBTFUL_1',
        requiredProvision: prov,
        reason: 'NPA Doubtful-1. 25% provision on secured portion + 100% on unsecured portion.'
      };
    }

    if (daysOverdue <= 1550) { // Doubtful 2 (Doubtful for 1 to 3 years)
      const unsecured = Math.max(0, outstanding - securedAmount);
      const prov = Math.round((securedAmount * 0.40) + (unsecured * 1.0));
      return {
        classification: 'DOUBTFUL_2',
        requiredProvision: prov,
        reason: 'NPA Doubtful-2. 40% provision on secured portion + 100% on unsecured portion.'
      };
    }

    // Doubtful 3 (> 3 years in Doubtful)
    return {
      classification: 'DOUBTFUL_3',
      requiredProvision: outstanding, // 100% provision
      reason: 'NPA Doubtful-3 (> 3 years doubtful). 100% provision required across full outstanding.'
    };
  }

  /**
   * Computes Accurate Drawing Power (DP) for Cash Credit Limits
   */
  public static computeDrawingPower(data: {
    accountNumber: string;
    borrowerName: string;
    statementDate: string;
    rawMaterial: number;
    workInProgress: number;
    finishedGoods: number;
    storesAndSpares: number;
    sundryCreditorsForPurchases: number;
    obsoleteStock: number;
    stockMarginPercent: number;
    totalDebtors: number;
    debtorsOver90Days: number;
    debtorsMarginPercent: number;
    sanctionedLimit: number;
    currentOutstanding: number;
  }): DrawingPowerComputation {
    const grossStock = data.rawMaterial + data.workInProgress + data.finishedGoods;
    const netEligibleStock = Math.max(0, grossStock - data.sundryCreditorsForPurchases - data.obsoleteStock);
    const eligibleStockForDp = Math.round(netEligibleStock * (1 - (data.stockMarginPercent / 100)));

    const debtorsWithin90Days = Math.max(0, data.totalDebtors - data.debtorsOver90Days);
    const eligibleDebtorsForDp = Math.round(debtorsWithin90Days * (1 - (data.debtorsMarginPercent / 100)));

    const totalCalculatedDrawingPower = eligibleStockForDp + eligibleDebtorsForDp;
    const effectiveDrawingPower = Math.min(totalCalculatedDrawingPower, data.sanctionedLimit);

    const excessDrawings = Math.max(0, data.currentOutstanding - effectiveDrawingPower);
    const isOverdrawn = excessDrawings > 0;
    const penalInterest = isOverdrawn ? Math.round((excessDrawings * 0.02) / 12) : 0; // 2% penal p.a. monthly

    return {
      accountNumber: data.accountNumber,
      borrowerName: data.borrowerName,
      statementDate: data.statementDate,
      rawMaterial: data.rawMaterial,
      workInProgress: data.workInProgress,
      finishedGoods: data.finishedGoods,
      storesAndSpares: data.storesAndSpares,
      grossStock,
      sundryCreditorsForPurchases: data.sundryCreditorsForPurchases,
      obsoleteOrNonMovingStock: data.obsoleteStock,
      netEligibleStock,
      stockMarginPercent: data.stockMarginPercent,
      eligibleStockForDp,
      totalDebtors: data.totalDebtors,
      debtorsOver90Days: data.debtorsOver90Days,
      debtorsWithin90Days,
      debtorsMarginPercent: data.debtorsMarginPercent,
      eligibleDebtorsForDp,
      totalCalculatedDrawingPower,
      sanctionedLimit: data.sanctionedLimit,
      effectiveDrawingPower,
      currentOutstanding: data.currentOutstanding,
      excessDrawings,
      isOverdrawn,
      penalInterestExposure: penalInterest
    };
  }
}

/**
 * High-Value Bank Audit Mock Data for Testing
 */
export const SAMPLE_BANK_ADVANCES: BankAdvanceAccount[] = [
  {
    accountNumber: '3819002100049210',
    borrowerName: 'Malwa Agro Processing Industries Pvt Ltd',
    facilityType: 'CASH_CREDIT',
    sanctionedLimit: 25000000, // ₹2.5 Cr
    outstandingBalance: 24850000,
    drawingPower: 21500000,
    daysOverdue: 98,
    securityValuationSecured: 22000000,
    unsecuredPortion: 2850000,
    stockStatementDate: '2026-07-15',
    isStockStatementStale: true, // Overdue > 3 months!
    currentClassification: 'STANDARD',
    recommendedClassification: 'SUB_STANDARD',
    isMocRequired: true,
    branchProvision: 99400, // 0.40%
    statutoryRequiredProvision: 3727500, // 15% secured + 25% unsecured
    differentialProvisionMoc: 3628100,
    notes: [
      'Branch improperly classified account as Standard despite stock statement being 4 months old.',
      'Mandatory MOC No. 01 passed to downgrade asset to Sub-Standard and debit P&L by ₹36.28 Lakhs.'
    ]
  },
  {
    accountNumber: '3819003500010945',
    borrowerName: 'Rajdhani Logistics & Transport Corp',
    facilityType: 'TERM_LOAN',
    sanctionedLimit: 12000000,
    outstandingBalance: 9400000,
    drawingPower: 9400000,
    daysOverdue: 52,
    securityValuationSecured: 11000000,
    unsecuredPortion: 0,
    isStockStatementStale: false,
    currentClassification: 'STANDARD',
    recommendedClassification: 'SMA_1',
    isMocRequired: false,
    branchProvision: 37600,
    statutoryRequiredProvision: 37600,
    differentialProvisionMoc: 0,
    notes: [
      'Account in SMA-1 bucket (31-60 days). Branch reported to CRILC. Standard provisioning maintained.'
    ]
  },
  {
    accountNumber: '3819002100088123',
    borrowerName: 'Khandelwal Steel & Tube Mills',
    facilityType: 'CASH_CREDIT',
    sanctionedLimit: 40000000, // ₹4.0 Cr
    outstandingBalance: 41200000, // Overdrawn!
    drawingPower: 38500000,
    daysOverdue: 104,
    securityValuationSecured: 35000000,
    unsecuredPortion: 6200000,
    stockStatementDate: '2026-10-31',
    isStockStatementStale: false,
    currentClassification: 'STANDARD',
    recommendedClassification: 'SUB_STANDARD',
    isMocRequired: true,
    branchProvision: 164800,
    statutoryRequiredProvision: 6800000,
    differentialProvisionMoc: 6635200,
    notes: [
      'Continuous overdrawing exceeding Drawing Power by ₹27 Lakhs for over 90 days.',
      'Mandatory MOC No. 02 passed: Downgrade to NPA Sub-Standard, reverse uncollected interest.'
    ]
  }
];

export const SAMPLE_DP_COMPUTATION = IracNpaEngine.computeDrawingPower({
  accountNumber: '3819002100049210',
  borrowerName: 'Malwa Agro Processing Industries Pvt Ltd',
  statementDate: '2026-10-31',
  rawMaterial: 14500000,
  workInProgress: 3200000,
  finishedGoods: 8900000,
  storesAndSpares: 1200000, // Excluded
  sundryCreditorsForPurchases: 4500000, // Deducted
  obsoleteStock: 600000, // Deducted
  stockMarginPercent: 25,
  totalDebtors: 11200000,
  debtorsOver90Days: 2400000, // Excluded
  debtorsMarginPercent: 40,
  sanctionedLimit: 25000000,
  currentOutstanding: 24850000
});
