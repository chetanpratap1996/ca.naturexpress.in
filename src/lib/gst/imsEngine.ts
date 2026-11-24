/**
 * GST IMS (Invoice Management System) & Rule 37A Reversal Engine
 * 
 * Statutory Authority:
 * - GSTN Advisory on Invoice Management System (IMS) w.e.f. October 2024 / 2025
 * - Section 16(2)(c) read with Rule 37A of CGST Rules (ITC reversal for vendor GSTR-3B non-filing)
 * - Section 50(1) interest exemption upon statutory Rule 37A re-claim
 */

export type ImsActionType = 'ACCEPT' | 'REJECT' | 'PENDING' | 'NO_ACTION';
export type InvoiceType = 'B2B' | 'B2BA' | 'CDNR' | 'CDNRA';

export interface ImsInvoiceItem {
  id: string;
  supplierGstin: string;
  supplierTradeName: string;
  invoiceNumber: string;
  originalInvoiceNumber?: string; // For amendment (B2BA / CDNRA)
  invoiceType: InvoiceType;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  posStateCode: string;
  itcEligibility: 'ELIGIBLE' | 'INELIGIBLE_17_5' | 'POS_MISMATCH';
  
  // Purchase Register Cross-Match Status
  matchingStatus: 'EXACT_MATCH' | 'VALUE_MISMATCH' | 'NOT_IN_BOOKS' | 'DUPLICATE_IN_PORTAL';
  bookInvoiceNumber?: string;
  bookTaxableValue?: number;
  bookTotalTax?: number;
  varianceAmount?: number;

  // IMS State
  currentAction: ImsActionType;
  recommendedAction: ImsActionType;
  recommendationReason: string;
  actionTimestamp?: string;
  actionBy?: string;
}

export interface Rule37ARecord {
  id: string;
  supplierGstin: string;
  supplierName: string;
  invoiceNumber: string;
  financialYear: string;
  invoiceDate: string;
  itcClaimedAmount: number;
  supplierGstr1FiledDate: string;
  supplierGstr3bStatus: 'FILED' | 'NOT_FILED';
  reversalDeadline: string; // 30th November of subsequent FY
  reversalStatus: 'PENDING_REVERSAL' | 'REVERSED_TABLE_4B2' | 'RE_CLAIMED_TABLE_4A5';
  reversalDate?: string;
  reClaimDate?: string;
  interestExposure: number; // ₹0 if reversed on or before 30th Nov; 18% p.a. u/s 50 if delayed
  vendorNotified: boolean;
  vendorLastReminderDate?: string;
}

export interface ImsSummaryStats {
  totalInvoices: number;
  acceptedCount: number;
  acceptedItc: number;
  rejectedCount: number;
  rejectedItc: number;
  pendingCount: number;
  pendingItc: number;
  noActionCount: number;
  rule37aAtRiskCount: number;
  rule37aAtRiskAmount: number;
}

export class GstImsEngine {
  /**
   * Evaluates IMS recommended action based on purchase register comparison
   */
  public static evaluateRecommendation(inv: Partial<ImsInvoiceItem>): { action: ImsActionType; reason: string } {
    if (inv.matchingStatus === 'EXACT_MATCH' && inv.itcEligibility === 'ELIGIBLE') {
      return {
        action: 'ACCEPT',
        reason: 'Exact match with Books of Accounts and verified supplier status. Safe to accept for GSTR-2B ITC inclusion.'
      };
    }

    if (inv.matchingStatus === 'NOT_IN_BOOKS') {
      return {
        action: 'PENDING',
        reason: 'Invoice not found in Purchase Register. Keep PENDING until verified by store/procurement team to prevent undue liability.'
      };
    }

    if (inv.matchingStatus === 'VALUE_MISMATCH' && Math.abs(inv.varianceAmount || 0) > 5) {
      return {
        action: 'REJECT',
        reason: `Value variance of ₹${Math.abs(inv.varianceAmount || 0).toFixed(2)} exceeds threshold. Reject so supplier issues amendment in GSTR-1.`
      };
    }

    if (inv.itcEligibility === 'INELIGIBLE_17_5') {
      return {
        action: 'ACCEPT',
        reason: 'Invoice is valid but blocked u/s 17(5). Accept to account in 3B, then reverse in Table 4(B)(1) to maintain audit trail.'
      };
    }

    return {
      action: 'PENDING',
      reason: 'Under review by tax article.'
    };
  }

  /**
   * Rule 37A Checker
   * Validates if ITC claimed in FY 2024-25 needs reversal due to supplier not filing GSTR-3B by 30th Nov 2025
   */
  public static evaluateRule37A(records: Rule37ARecord[], currentDate: string = '2026-11-20'): Rule37ARecord[] {
    const curr = new Date(currentDate);

    return records.map(rec => {
      const deadline = new Date(rec.reversalDeadline);
      let interest = 0;

      if (rec.supplierGstr3bStatus === 'NOT_FILED') {
        if (curr > deadline && rec.reversalStatus === 'PENDING_REVERSAL') {
          // Delayed beyond 30th November: interest @ 18% p.a. runs from 1st December until reversal
          const daysLate = Math.floor((curr.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
          interest = Math.round((rec.itcClaimedAmount * 0.18 * daysLate) / 365);
        }
      }

      return {
        ...rec,
        interestExposure: interest
      };
    });
  }

  /**
   * Computes IMS Summary Statistics
   */
  public static computeSummary(invoices: ImsInvoiceItem[], rule37aRecords: Rule37ARecord[]): ImsSummaryStats {
    let acceptedItc = 0;
    let rejectedItc = 0;
    let pendingItc = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;
    let noActionCount = 0;

    for (const inv of invoices) {
      if (inv.currentAction === 'ACCEPT') {
        acceptedCount++;
        acceptedItc += inv.totalTax;
      } else if (inv.currentAction === 'REJECT') {
        rejectedCount++;
        rejectedItc += inv.totalTax;
      } else if (inv.currentAction === 'PENDING') {
        pendingCount++;
        pendingItc += inv.totalTax;
      } else {
        noActionCount++;
      }
    }

    const atRisk37a = rule37aRecords.filter(r => r.supplierGstr3bStatus === 'NOT_FILED');
    const atRiskAmount = atRisk37a.reduce((sum, r) => sum + r.itcClaimedAmount, 0);

    return {
      totalInvoices: invoices.length,
      acceptedCount,
      acceptedItc,
      rejectedCount,
      rejectedItc,
      pendingCount,
      pendingItc,
      noActionCount,
      rule37aAtRiskCount: atRisk37a.length,
      rule37aAtRiskAmount: atRiskAmount
    };
  }
}

/**
 * High-Value Production Mock Data for Institutional Testing
 */
export const SAMPLE_IMS_INVOICES: ImsInvoiceItem[] = [
  {
    id: 'IMS-2026-001',
    supplierGstin: '27AABCT1234D1Z8',
    supplierTradeName: 'Tata Steel Processing & Distribution Ltd',
    invoiceNumber: 'TSP/2026/OCT/0491',
    invoiceType: 'B2B',
    invoiceDate: '2026-10-14',
    taxableValue: 1850000,
    igst: 333000,
    cgst: 0,
    sgst: 0,
    cess: 0,
    totalTax: 333000,
    posStateCode: '23',
    itcEligibility: 'ELIGIBLE',
    matchingStatus: 'EXACT_MATCH',
    bookInvoiceNumber: 'TSP/2026/OCT/0491',
    bookTaxableValue: 1850000,
    bookTotalTax: 333000,
    varianceAmount: 0,
    currentAction: 'ACCEPT',
    recommendedAction: 'ACCEPT',
    recommendationReason: 'Exact match with Books of Accounts and verified supplier status. Safe to accept for GSTR-2B ITC inclusion.',
    actionTimestamp: '2026-11-10T11:42:00Z',
    actionBy: 'CA Gunjan Jain (Partner)'
  },
  {
    id: 'IMS-2026-002',
    supplierGstin: '23AAACL8892K1Z3',
    supplierTradeName: 'Larsen & Toubro Electrical Solutions',
    invoiceNumber: 'LT/IND/24-25/892',
    invoiceType: 'B2B',
    invoiceDate: '2026-10-22',
    taxableValue: 620000,
    igst: 0,
    cgst: 55800,
    sgst: 55800,
    cess: 0,
    totalTax: 111600,
    posStateCode: '23',
    itcEligibility: 'ELIGIBLE',
    matchingStatus: 'VALUE_MISMATCH',
    bookInvoiceNumber: 'LT/IND/24-25/892',
    bookTaxableValue: 580000,
    bookTotalTax: 104400,
    varianceAmount: 40000,
    currentAction: 'REJECT',
    recommendedAction: 'REJECT',
    recommendationReason: 'Value variance of ₹40,000.00 exceeds threshold. Supplier billed extra freight not in PO. Reject for credit note.',
    actionTimestamp: '2026-11-11T15:10:00Z',
    actionBy: 'Kriti Jain (Article Trainee)'
  },
  {
    id: 'IMS-2026-003',
    supplierGstin: '29AABCS9912M1Z0',
    supplierTradeName: 'Schneider Electric IT Business India',
    invoiceNumber: 'SE/BLR/26/1029',
    invoiceType: 'B2B',
    invoiceDate: '2026-10-28',
    taxableValue: 940000,
    igst: 169200,
    cgst: 0,
    sgst: 0,
    cess: 0,
    totalTax: 169200,
    posStateCode: '23',
    itcEligibility: 'ELIGIBLE',
    matchingStatus: 'NOT_IN_BOOKS',
    varianceAmount: 940000,
    currentAction: 'PENDING',
    recommendedAction: 'PENDING',
    recommendationReason: 'Invoice not found in Purchase Register. Goods may be in transit. Keep PENDING so ITC is not claimed prematurely.',
    actionTimestamp: '2026-11-12T09:30:00Z',
    actionBy: 'Amit Joshi (Senior Article)'
  },
  {
    id: 'IMS-2026-004',
    supplierGstin: '23AABCM4512J1Z6',
    supplierTradeName: 'Maruti Suzuki Commercial Vehicles',
    invoiceNumber: 'MSIL/IND/9901',
    invoiceType: 'B2B',
    invoiceDate: '2026-10-18',
    taxableValue: 1250000,
    igst: 0,
    cgst: 175000,
    sgst: 175000,
    cess: 0,
    totalTax: 350000,
    posStateCode: '23',
    itcEligibility: 'INELIGIBLE_17_5',
    matchingStatus: 'EXACT_MATCH',
    bookInvoiceNumber: 'MSIL/IND/9901',
    bookTaxableValue: 1250000,
    bookTotalTax: 350000,
    varianceAmount: 0,
    currentAction: 'ACCEPT',
    recommendedAction: 'ACCEPT',
    recommendationReason: 'Staff transport car > 13 seater exempt, but passenger car is blocked u/s 17(5)(a). Accept and flag for auto-reversal in 4(B)(1).',
    actionTimestamp: '2026-11-10T14:20:00Z',
    actionBy: 'CA Gunjan Jain (Partner)'
  }
];

export const SAMPLE_RULE_37A_RECORDS: Rule37ARecord[] = [
  {
    id: 'R37A-01',
    supplierGstin: '27AAACS4512P1ZL',
    supplierName: 'Shree Balaji Polymers Ltd',
    invoiceNumber: 'SBP/23-24/1109',
    financialYear: 'FY 2024-25',
    invoiceDate: '2024-11-15',
    itcClaimedAmount: 245000,
    supplierGstr1FiledDate: '2024-12-10',
    supplierGstr3bStatus: 'NOT_FILED',
    reversalDeadline: '2025-11-30',
    reversalStatus: 'PENDING_REVERSAL',
    interestExposure: 42350,
    vendorNotified: true,
    vendorLastReminderDate: '2026-11-05'
  },
  {
    id: 'R37A-02',
    supplierGstin: '23AABCG1234N1ZT',
    supplierName: 'Gujarat Infotech Components',
    invoiceNumber: 'GIC/24/099',
    financialYear: 'FY 2024-25',
    invoiceDate: '2025-01-20',
    itcClaimedAmount: 180000,
    supplierGstr1FiledDate: '2025-02-11',
    supplierGstr3bStatus: 'FILED',
    reversalDeadline: '2025-11-30',
    reversalStatus: 'RE_CLAIMED_TABLE_4A5',
    reversalDate: '2025-11-20',
    reClaimDate: '2026-03-20',
    interestExposure: 0,
    vendorNotified: false
  }
];
