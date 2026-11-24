/**
 * Form 3CD Clause 31 & Section 269SS / 269T Forensic Engine
 * 
 * Statutory Authority:
 * - Section 269SS of Income Tax Act (Mode of taking or accepting certain loans, deposits and specified sums >= Rs. 20,000)
 * - Section 269T of Income Tax Act (Mode of repayment of certain loans or deposits >= Rs. 20,000)
 * - Section 271D & 271E (100% penalty equal to the amount of loan/repayment)
 * - Form 3CD Clause 31(a), 31(b), 31(ba), 31(bb), 31(bc), 31(bd)
 */

export interface CashLoanRecord {
  id: string;
  partyName: string;
  partyPan?: string;
  partyAddress: string;
  transactionType: 'TAKEN_269SS' | 'REPAID_269T';
  modeOfPayment: 'CASH' | 'BEARER_CHEQUE' | 'ACCOUNT_PAYEE_CHEQUE' | 'ELECTRONIC_NEFT_RTGS';
  transactionDate: string;
  amount: number;
  isViolation: boolean;
  statutoryClause: 'Clause 31(a)' | 'Clause 31(b)' | 'Clause 31(ba)' | 'Clause 31(bb)';
  penaltyExposure271D_E: number; // 100% of amount
  auditorRemarks: string;
}

export interface Clause31AuditSummary {
  totalTransactionsScanned: number;
  totalViolationsFound: number;
  totalViolationAmount: number;
  potentialPenalty271D_E: number;
  compliantAmount: number;
  records: CashLoanRecord[];
}

export class Clause31CashLoanEngine {
  /**
   * Scans ledger entries and flags Section 269SS & 269T violations
   */
  public static analyzeCashTransactions(records: Array<{
    id: string;
    partyName: string;
    partyPan?: string;
    partyAddress: string;
    transactionType: 'TAKEN_269SS' | 'REPAID_269T';
    modeOfPayment: 'CASH' | 'BEARER_CHEQUE' | 'ACCOUNT_PAYEE_CHEQUE' | 'ELECTRONIC_NEFT_RTGS';
    transactionDate: string;
    amount: number;
  }>): Clause31AuditSummary {
    let violationCount = 0;
    let violationAmount = 0;
    let compliantAmount = 0;

    const auditedRecords: CashLoanRecord[] = records.map(rec => {
      // Violation occurs if loan/deposit >= ₹20,000 taken/repaid in CASH or BEARER CHEQUE
      const isIllegalMode = rec.modeOfPayment === 'CASH' || rec.modeOfPayment === 'BEARER_CHEQUE';
      const isViolation = isIllegalMode && rec.amount >= 20000;

      let clause: 'Clause 31(a)' | 'Clause 31(b)' | 'Clause 31(ba)' | 'Clause 31(bb)';
      if (rec.transactionType === 'TAKEN_269SS') {
        clause = isIllegalMode ? 'Clause 31(a)' : 'Clause 31(ba)';
      } else {
        clause = isIllegalMode ? 'Clause 31(b)' : 'Clause 31(bb)';
      }

      let remarks = '';
      if (isViolation) {
        violationCount++;
        violationAmount += rec.amount;
        remarks = `Violation of Section ${rec.transactionType === 'TAKEN_269SS' ? '269SS' : '269T'}. Sum >= ₹20,000 in ${rec.modeOfPayment}. Attracts 100% penalty u/s ${rec.transactionType === 'TAKEN_269SS' ? '271D' : '271E'}.`;
      } else {
        compliantAmount += rec.amount;
        remarks = `Compliant with Section 269SS/269T. Cleared via banking channel.`;
      }

      return {
        ...rec,
        isViolation,
        statutoryClause: clause,
        penaltyExposure271D_E: isViolation ? rec.amount : 0,
        auditorRemarks: remarks
      };
    });

    return {
      totalTransactionsScanned: records.length,
      totalViolationsFound: violationCount,
      totalViolationAmount: violationAmount,
      potentialPenalty271D_E: violationAmount,
      compliantAmount,
      records: auditedRecords
    };
  }
}

/**
 * High-Value Production Mock Data for Testing Form 3CD Clause 31
 */
export const SAMPLE_CLAUSE_31_DATA = Clause31CashLoanEngine.analyzeCashTransactions([
  {
    id: '31-01',
    partyName: 'HDFC Bank Ltd — Cash Credit Facility',
    partyPan: 'AAACH1244K',
    partyAddress: 'Corporate Banking Branch, Noida',
    transactionType: 'REPAID_269T',
    modeOfPayment: 'ELECTRONIC_NEFT_RTGS',
    transactionDate: '2026-10-05',
    amount: 500000
  }
]);
