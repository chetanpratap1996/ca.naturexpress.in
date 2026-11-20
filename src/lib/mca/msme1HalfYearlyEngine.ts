/**
 * Form MSME-1 Half-Yearly Return of Outstanding Dues Engine
 * 
 * Statutory Authority:
 * - Section 405 of Companies Act, 2013 read with Specified Companies Order, 2019
 * - Section 15 of MSMED Act, 2006 (Mandatory payment within 45 days from date of acceptance)
 * - Section 16 of MSMED Act (Compound interest with monthly rests at 3x the RBI Bank Rate)
 * - Filing Frequency:
 *   - April to September (HY 1) -> Due Date: 31st October
 *   - October to March (HY 2) -> Due Date: 30th April
 * - Interlinkage: Simultaneously feeds Form 3CD Clause 22 and Section 43B(h) disallowances!
 */

export type MsmeHalfYear = 'HY1_APR_SEP' | 'HY2_OCT_MAR';

export interface Msme1SupplierDueRecord {
  id: string;
  supplierName: string;
  supplierPan: string;
  udyamRegistrationNumber: string;
  enterpriseCategory: 'MICRO' | 'SMALL';
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  statutoryDueDate: string; // Invoice date + 45 days
  actualPaymentDate?: string; // If paid belatedly
  amountDueInr: number;
  daysOfDelay: number; // Days past 45-day limit
  reasonForDelay: 
    | 'QUALITY_INSPECTION_PENDING' 
    | 'MATERIAL_DEFECT_DISPUTED' 
    | 'CLIENT_BILLING_CYCLE_ALIGNMENT' 
    | 'LIQUIDITY_CONSTRAINTS';
  msmeInterestExposureSec16: number; // 3x Bank Rate compound interest
  isReportableInMsme1: boolean;
  status: 'PENDING_PAYMENT' | 'PAID_BELATEDLY' | 'DISPUTED_IN_MSME_SAMADHAAN';
}

export interface Msme1FilingSummary {
  cin: string;
  companyName: string;
  halfYear: MsmeHalfYear;
  financialYear: string;
  totalDelayedSuppliersCount: number;
  totalOutstandingAmountInr: number;
  totalMsmeInterestPayableInr: number;
  averageDelayDays: number;
  maxDelayDays: number;
  isFilingMandatory: boolean; // Mandatory if any due > 45 days exists
  filingDueDate: string;
  sec405NonComplianceRisk: boolean;
}

export class Msme1HalfYearlyEngine {
  /**
   * Evaluates vendor ledger for MSMED Section 15 breaches (> 45 days delay)
   */
  public static compileMsme1Return(
    records: Msme1SupplierDueRecord[],
    meta: { cin: string; companyName: string; halfYear: MsmeHalfYear; financialYear: string; asOfDate?: string }
  ): Msme1FilingSummary {
    const rbiBankRate = 6.75; // 6.75%
    const msmeStatutoryRate = Number((rbiBankRate * 3).toFixed(2)); // 20.25% p.a. compound

    let totalDelayedAmt = 0;
    let totalInterest = 0;
    let totalDelayDaysSum = 0;
    let maxDelay = 0;

    records.forEach(r => {
      // Delay computation past 45 days
      if (r.daysOfDelay > 0) {
        r.isReportableInMsme1 = true;
        totalDelayedAmt += r.amountDueInr;
        totalDelayDaysSum += r.daysOfDelay;
        if (r.daysOfDelay > maxDelay) maxDelay = r.daysOfDelay;

        // Interest u/s 16 = P * (1 + R/1200)^months - P
        const delayMonths = r.daysOfDelay / 30;
        const interest = Math.round(r.amountDueInr * (Math.pow(1 + (msmeStatutoryRate / 1200), delayMonths) - 1));
        r.msmeInterestExposureSec16 = interest;
        totalInterest += interest;
      } else {
        r.isReportableInMsme1 = false;
        r.msmeInterestExposureSec16 = 0;
      }
    });

    const count = records.filter(r => r.isReportableInMsme1).length;
    const avgDelay = count > 0 ? Math.round(totalDelayDaysSum / count) : 0;
    const dueDate = meta.halfYear === 'HY1_APR_SEP' ? '31-Oct-2026' : '30-Apr-2027';

    return {
      cin: meta.cin,
      companyName: meta.companyName,
      halfYear: meta.halfYear,
      financialYear: meta.financialYear,
      totalDelayedSuppliersCount: count,
      totalOutstandingAmountInr: totalDelayedAmt,
      totalMsmeInterestPayableInr: totalInterest,
      averageDelayDays: avgDelay,
      maxDelayDays: maxDelay,
      isFilingMandatory: count > 0,
      filingDueDate: dueDate,
      sec405NonComplianceRisk: count > 0
    };
  }
}

export const SAMPLE_MSME1_RECORDS: Msme1SupplierDueRecord[] = [
  {
    id: 'MSME-01',
    supplierName: 'Indore Precision Toolings LLP',
    supplierPan: 'AABCI8912P',
    udyamRegistrationNumber: 'UDYAM-MP-23-0019284',
    enterpriseCategory: 'MICRO',
    invoiceNumber: 'INV/2026/0412',
    invoiceDate: '2026-06-10',
    statutoryDueDate: '2026-07-25', // +45 days
    amountDueInr: 450000,
    daysOfDelay: 118, // Overdue by 118 days!
    reasonForDelay: 'QUALITY_INSPECTION_PENDING',
    msmeInterestExposureSec16: 31200,
    isReportableInMsme1: true,
    status: 'PENDING_PAYMENT'
  },
  {
    id: 'MSME-02',
    supplierName: 'Malwa Corrugated Packaging Box Works',
    supplierPan: 'AACCM4129K',
    udyamRegistrationNumber: 'UDYAM-MP-23-0044192',
    enterpriseCategory: 'SMALL',
    invoiceNumber: 'INV-PKG-8812',
    invoiceDate: '2026-07-15',
    statutoryDueDate: '2026-08-29',
    amountDueInr: 280000,
    daysOfDelay: 83,
    reasonForDelay: 'CLIENT_BILLING_CYCLE_ALIGNMENT',
    msmeInterestExposureSec16: 13500,
    isReportableInMsme1: true,
    status: 'PENDING_PAYMENT'
  },
  {
    id: 'MSME-03',
    supplierName: 'Shree Balaji Polymers Private Limited',
    supplierPan: 'AALCB9912Q',
    udyamRegistrationNumber: 'UDYAM-MP-23-0091024',
    enterpriseCategory: 'SMALL',
    invoiceNumber: 'SBP/891',
    invoiceDate: '2026-09-01',
    statutoryDueDate: '2026-10-16',
    actualPaymentDate: '2026-09-28',
    amountDueInr: 650000,
    daysOfDelay: 0, // Paid within 28 days (< 45 days)
    reasonForDelay: 'QUALITY_INSPECTION_PENDING',
    msmeInterestExposureSec16: 0,
    isReportableInMsme1: false,
    status: 'PENDING_PAYMENT'
  }
];
