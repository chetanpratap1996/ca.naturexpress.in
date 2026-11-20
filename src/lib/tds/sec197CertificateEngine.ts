/**
 * Section 197 / 197A Lower / Nil Deduction Certificate Tracker & Threshold Guardian
 * 
 * Statutory Authority:
 * - Section 197 of Income Tax Act (Certificate for deduction at lower rate)
 * - Rule 28AA of Income Tax Rules (Certificate for deduction of tax at lower rates)
 * - Section 197A (No deduction to be made in certain cases on declaration Form 15G/15H)
 * - TRACES Online Certificate Validation Utility
 */

export interface LowerTdsCertificateItem {
  id: string;
  certificateNumber: string; // 10-character alphanumeric
  beneficiaryPan: string;
  beneficiaryName: string;
  applicableSection: string; // e.g., '194C', '194J', '195'
  financialYear: string;
  validFromDate: string;
  validToDate: string;
  approvedLowerRatePercent: number; // e.g., 0.5% or 0%
  standardStatutoryRatePercent: number; // e.g., 2% or 10%
  sanctionedThresholdAmount: number; // Total approved cap, e.g. ₹50,00,000
  consumedAmount: number; // Cumulative payments processed
  remainingLimit: number;
  isThresholdExceeded: boolean;
  status: 'ACTIVE_VALID' | 'THRESHOLD_EXHAUSTED' | 'EXPIRED_DATE';
}

export class Sec197CertificateEngine {
  /**
   * Evaluates invoice payment against Section 197 certificate threshold
   * Automatically splits payment if it exceeds the remaining certificate limit
   */
  public static evaluatePaymentUnder197(
    cert: LowerTdsCertificateItem,
    paymentAmount: number,
    paymentDate: string
  ): {
    canApplyLowerRate: boolean;
    lowerRatePortion: number;
    lowerRateTdsAmount: number;
    standardRatePortion: number;
    standardRateTdsAmount: number;
    totalTdsToDeduct: number;
    updatedRemainingLimit: number;
    warningMessage?: string;
  } {
    // 1. Check Date Validity
    const pDate = new Date(paymentDate);
    const vFrom = new Date(cert.validFromDate);
    const vTo = new Date(cert.validToDate);

    if (pDate < vFrom || pDate > vTo) {
      // Certificate is date expired -> 100% at standard rate
      const stdTds = Math.round(paymentAmount * (cert.standardStatutoryRatePercent / 100));
      return {
        canApplyLowerRate: false,
        lowerRatePortion: 0,
        lowerRateTdsAmount: 0,
        standardRatePortion: paymentAmount,
        standardRateTdsAmount: stdTds,
        totalTdsToDeduct: stdTds,
        updatedRemainingLimit: cert.remainingLimit,
        warningMessage: `Certificate ${cert.certificateNumber} expired or not valid for payment date ${paymentDate}. 100% deducted at standard rate ${cert.standardStatutoryRatePercent}%.`
      };
    }

    // 2. Check Threshold Limits
    if (cert.remainingLimit <= 0) {
      // Threshold already exhausted -> 100% at standard rate
      const stdTds = Math.round(paymentAmount * (cert.standardStatutoryRatePercent / 100));
      return {
        canApplyLowerRate: false,
        lowerRatePortion: 0,
        lowerRateTdsAmount: 0,
        standardRatePortion: paymentAmount,
        standardRateTdsAmount: stdTds,
        totalTdsToDeduct: stdTds,
        updatedRemainingLimit: 0,
        warningMessage: `Approved threshold of ₹${cert.sanctionedThresholdAmount.toLocaleString('en-IN')} fully exhausted. 100% deducted at standard rate ${cert.standardStatutoryRatePercent}%.`
      };
    }

    if (paymentAmount <= cert.remainingLimit) {
      // Full payment covered by certificate
      const lowerTds = Math.round(paymentAmount * (cert.approvedLowerRatePercent / 100));
      const remaining = cert.remainingLimit - paymentAmount;
      return {
        canApplyLowerRate: true,
        lowerRatePortion: paymentAmount,
        lowerRateTdsAmount: lowerTds,
        standardRatePortion: 0,
        standardRateTdsAmount: 0,
        totalTdsToDeduct: lowerTds,
        updatedRemainingLimit: remaining
      };
    }

    // Payment partially exceeds certificate remaining balance!
    const lowerPortion = cert.remainingLimit;
    const standardPortion = paymentAmount - lowerPortion;
    const lowerTds = Math.round(lowerPortion * (cert.approvedLowerRatePercent / 100));
    const standardTds = Math.round(standardPortion * (cert.standardStatutoryRatePercent / 100));

    return {
      canApplyLowerRate: true,
      lowerRatePortion: lowerPortion,
      lowerRateTdsAmount: lowerTds,
      standardRatePortion: standardPortion,
      standardRateTdsAmount: standardTds,
      totalTdsToDeduct: lowerTds + standardTds,
      updatedRemainingLimit: 0,
      warningMessage: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} partially exceeded remaining certificate limit of ₹${cert.remainingLimit.toLocaleString('en-IN')}. Split applied: ₹${lowerPortion.toLocaleString('en-IN')} @ ${cert.approvedLowerRatePercent}% and ₹${standardPortion.toLocaleString('en-IN')} @ standard ${cert.standardStatutoryRatePercent}%.`
    };
  }
}

export const SAMPLE_197_CERTIFICATES: LowerTdsCertificateItem[] = [
  {
    id: 'CERT-197-01',
    certificateNumber: '2691AA4921',
    beneficiaryPan: 'AABCS9821K',
    beneficiaryName: 'Swift Logistics & Facilities Pvt Ltd',
    applicableSection: '194C',
    financialYear: '2026-27',
    validFromDate: '2026-04-01',
    validToDate: '2027-03-31',
    approvedLowerRatePercent: 0.5, // 0.5% instead of 2%
    standardStatutoryRatePercent: 2.0,
    sanctionedThresholdAmount: 5000000, // ₹50 Lakhs
    consumedAmount: 3800000,
    remainingLimit: 1200000,
    isThresholdExceeded: false,
    status: 'ACTIVE_VALID'
  },
  {
    id: 'CERT-197-02',
    certificateNumber: '2691AJ8810',
    beneficiaryPan: 'AAACB1234D',
    beneficiaryName: 'BluePeak Cloud Consulting LLP',
    applicableSection: '194J',
    financialYear: '2026-27',
    validFromDate: '2026-04-01',
    validToDate: '2027-03-31',
    approvedLowerRatePercent: 1.5, // 1.5% instead of 10%
    standardStatutoryRatePercent: 10.0,
    sanctionedThresholdAmount: 2500000, // ₹25 Lakhs
    consumedAmount: 2450000,
    remainingLimit: 50000,
    isThresholdExceeded: false,
    status: 'ACTIVE_VALID'
  }
];
