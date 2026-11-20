/**
 * Bank Branch Concurrent Audit Daily / Monthly Compliance Tracker
 * 
 * Statutory Authority:
 * - RBI Master Direction on Concurrent Audit System in Commercial Banks (RBI/2019-20/64)
 * - Prevention of Money Laundering Act (PMLA) 2002: Cash Transaction Reports (CTR > ₹10 Lakhs)
 *   and Suspicious Transaction Reports (STR)
 * - RBI Master Direction - Know Your Customer (KYC) Direction, 2016 (Periodic Updation: High Risk 2 yrs, Med 8 yrs, Low 10 yrs)
 * - RBI Guidelines on Safe Deposit Locker / Safe Custody Operations (RBI/2021-2022/86)
 */

export interface HighValueTransactionItem {
  id: string;
  transactionDate: string;
  accountNumber: string;
  accountName: string;
  transactionType: 'CASH_DEPOSIT' | 'CASH_WITHDRAWAL' | 'RTGS_NEFT_TRANSFER' | 'CLEARING_CHEQUE';
  amount: number;
  purposeOrNarration: string;
  isPmlaFlagged: boolean; // Transactions > ₹10 Lakhs
  ctrFiledDate?: string;
  isSuspicious: boolean;
  strFilingReason?: string;
  auditVerificationStatus: 'VERIFIED_GENUINE' | 'PENDING_EXPLANATION' | 'ESCALATED_TO_COMPLIANCE';
}

export interface KycRiskAuditItem {
  accountNumber: string;
  customerName: string;
  riskCategory: 'HIGH' | 'MEDIUM' | 'LOW';
  lastKycDate: string;
  nextKycDueDate: string;
  isOverdueForReKyc: boolean;
  panAadhaarSeeded: boolean;
  camsKRAStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  actionTaken: 'ACTIVE' | 'PARTIAL_FREEZE_NOTICE' | 'TOTAL_FREEZE';
}

export interface CashRetentionAuditItem {
  date: string;
  openingCash: number;
  cashReceipts: number;
  cashPayments: number;
  closingCashInHand: number;
  sanctionedRetentionLimit: number;
  overnightExcess: number;
  isLimitBreached: boolean;
  insuranceCoverageLimit: number;
  isInsuranceExceeded: boolean;
  remarks: string;
}

export interface LockerOperationAuditItem {
  lockerNumber: string;
  customerName: string;
  lastOperatedDate: string;
  daysSinceLastOperation: number;
  isHighRiskInactive: boolean; // Over 3 years inoperative
  annualRent: number;
  rentOverdueYears: number;
  totalRentDue: number;
  breakOpenNoticeServed: boolean;
  dualKeyRegisterSigned: boolean;
}

export class ConcurrentAuditEngine {
  /**
   * Scans transactions for PMLA CTR (> ₹10 Lakhs cash) and suspicious patterns
   */
  public static auditHighValueTransactions(transactions: HighValueTransactionItem[]): {
    totalHighValueVolume: number;
    ctrExposureCount: number;
    strEscalatedCount: number;
    unverifiedCount: number;
  } {
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const ctrCount = transactions.filter(t => t.amount >= 1000000 && (t.transactionType === 'CASH_DEPOSIT' || t.transactionType === 'CASH_WITHDRAWAL')).length;
    const strCount = transactions.filter(t => t.isSuspicious).length;
    const unverified = transactions.filter(t => t.auditVerificationStatus !== 'VERIFIED_GENUINE').length;

    return {
      totalHighValueVolume: totalVolume,
      ctrExposureCount: ctrCount,
      strEscalatedCount: strCount,
      unverifiedCount: unverified
    };
  }

  /**
   * Audits daily cash balances against Zonal Retention Ceiling & Transit Insurance
   */
  public static auditCashRetention(records: CashRetentionAuditItem[]): {
    breachDaysCount: number;
    maxExcessCash: number;
    insuranceRiskDays: number;
    complianceScore: number;
  } {
    const breaches = records.filter(r => r.isLimitBreached);
    const maxExcess = records.reduce((max, r) => Math.max(max, r.overnightExcess), 0);
    const insuranceRisks = records.filter(r => r.isInsuranceExceeded).length;
    const score = Math.max(0, 100 - (breaches.length * 15) - (insuranceRisks * 25));

    return {
      breachDaysCount: breaches.length,
      maxExcessCash: maxExcess,
      insuranceRiskDays: insuranceRisks,
      complianceScore: score
    };
  }

  /**
   * Evaluates KYC risk categories and identifies overdue re-KYC accounts
   */
  public static auditKycCompliance(accounts: KycRiskAuditItem[], auditDate: string = '2026-11-20'): {
    totalAudited: number;
    highRiskOverdue: number;
    mediumRiskOverdue: number;
    unseededPanCount: number;
    frozenAccounts: number;
  } {
    const highOverdue = accounts.filter(a => a.riskCategory === 'HIGH' && a.isOverdueForReKyc).length;
    const medOverdue = accounts.filter(a => a.riskCategory === 'MEDIUM' && a.isOverdueForReKyc).length;
    const unseeded = accounts.filter(a => !a.panAadhaarSeeded).length;
    const frozen = accounts.filter(a => a.actionTaken !== 'ACTIVE').length;

    return {
      totalAudited: accounts.length,
      highRiskOverdue: highOverdue,
      mediumRiskOverdue: medOverdue,
      unseededPanCount: unseeded,
      frozenAccounts: frozen
    };
  }
}

export const SAMPLE_HIGH_VALUE_TRANSACTIONS: HighValueTransactionItem[] = [
  {
    id: 'TXN-901',
    transactionDate: '2026-11-18',
    accountNumber: '3819002100088123',
    accountName: 'Khandelwal Steel & Tube Mills',
    transactionType: 'CASH_WITHDRAWAL',
    amount: 1450000, // ₹14.50 Lakhs (CTR required)
    purposeOrNarration: 'Self cash withdrawal for labor payments',
    isPmlaFlagged: true,
    ctrFiledDate: '2026-11-19',
    isSuspicious: false,
    auditVerificationStatus: 'VERIFIED_GENUINE'
  },
  {
    id: 'TXN-902',
    transactionDate: '2026-11-17',
    accountNumber: '3819001100034189',
    accountName: 'Shree Sai Bullion & Diamonds',
    transactionType: 'CASH_DEPOSIT',
    amount: 2800000, // ₹28.00 Lakhs
    purposeOrNarration: 'Cash deposit across 3 tranches in one afternoon',
    isPmlaFlagged: true,
    isSuspicious: true,
    strFilingReason: 'Rapid structured cash deposits below ₹10 Lakhs by multiple runners in one day',
    auditVerificationStatus: 'ESCALATED_TO_COMPLIANCE'
  },
  {
    id: 'TXN-903',
    transactionDate: '2026-11-16',
    accountNumber: '3819002100049210',
    accountName: 'Malwa Agro Processing Industries Pvt Ltd',
    transactionType: 'RTGS_NEFT_TRANSFER',
    amount: 8500000, // ₹85 Lakhs
    purposeOrNarration: 'Transfer to director personal savings account',
    isPmlaFlagged: false,
    isSuspicious: true,
    strFilingReason: 'Diversion of Cash Credit working capital funds to director account',
    auditVerificationStatus: 'PENDING_EXPLANATION'
  }
];

export const SAMPLE_CASH_RETENTION_RECORDS: CashRetentionAuditItem[] = [
  {
    date: '2026-11-15',
    openingCash: 850000,
    cashReceipts: 1840000,
    cashPayments: 1120000,
    closingCashInHand: 1570000,
    sanctionedRetentionLimit: 1500000, // ₹15 Lakhs limit
    overnightExcess: 70000,
    isLimitBreached: true,
    insuranceCoverageLimit: 2000000,
    isInsuranceExceeded: false,
    remarks: 'Retention limit breached by ₹70,000 due to late evening remittance from local trader.'
  },
  {
    date: '2026-11-16',
    openingCash: 1570000,
    cashReceipts: 2900000,
    cashPayments: 2850000,
    closingCashInHand: 1620000,
    sanctionedRetentionLimit: 1500000,
    overnightExcess: 120000,
    isLimitBreached: true,
    insuranceCoverageLimit: 2000000,
    isInsuranceExceeded: false,
    remarks: 'Second consecutive day retention breach. Branch advised to remit excess to currency chest.'
  },
  {
    date: '2026-11-17',
    openingCash: 1620000,
    cashReceipts: 1200000,
    cashPayments: 1950000,
    closingCashInHand: 870000,
    sanctionedRetentionLimit: 1500000,
    overnightExcess: 0,
    isLimitBreached: false,
    insuranceCoverageLimit: 2000000,
    isInsuranceExceeded: false,
    remarks: 'Cash normalized within limit after currency chest remittance of ₹8.00 Lakhs.'
  }
];

export const SAMPLE_LOCKER_AUDIT_RECORDS: LockerOperationAuditItem[] = [
  {
    lockerNumber: 'LK-042',
    customerName: 'Smt. Shanti Devi Agrawal',
    lastOperatedDate: '2022-04-12',
    daysSinceLastOperation: 1683,
    isHighRiskInactive: true, // > 3 years
    annualRent: 2500,
    rentOverdueYears: 3,
    totalRentDue: 7500,
    breakOpenNoticeServed: true,
    dualKeyRegisterSigned: true
  },
  {
    lockerNumber: 'LK-118',
    customerName: 'Dr. Anand Kumar Verma',
    lastOperatedDate: '2026-09-24',
    daysSinceLastOperation: 57,
    isHighRiskInactive: false,
    annualRent: 4000,
    rentOverdueYears: 0,
    totalRentDue: 0,
    breakOpenNoticeServed: false,
    dualKeyRegisterSigned: true
  }
];
