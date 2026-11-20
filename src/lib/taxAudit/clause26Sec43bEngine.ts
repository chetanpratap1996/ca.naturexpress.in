/**
 * Form 3CD Clause 26 & Section 43B Statutory Dues Audit Engine
 * 
 * Statutory Authority:
 * - Section 43B of Income Tax Act (Certain deductions to be only on actual payment)
 * - Section 43B(a) Tax, duty, cess (GST, Customs, Property Tax)
 * - Section 43B(b) Employer contribution to Provident Fund, ESI, Gratuity
 * - Section 43B(c) Bonus or Commission to employees
 * - Section 43B(d)/(e) Interest on loan/borrowing to Scheduled Banks / NBFCs
 * - Section 43B(f) Leave Encashment to employees
 * - Proviso to Section 43B: Allowed if paid on or before the due date of filing ITR u/s 139(1)
 */

export interface Sec43bStatutoryDueItem {
  id: string;
  liabilityHead: 'GST_PAYABLE' | 'EPF_EMPLOYER_SHARE' | 'ESIC_EMPLOYER_SHARE' | 'BONUS_PAYABLE' | 'GRATUITY_FUND' | 'BANK_INTEREST_OVERDRAFT' | 'LEAVE_ENCASHMENT';
  liabilityDescription: string;
  balanceAsOf31stMarchInr: number;
  actualDateOfPayment?: string;
  itrFilingDueDateSec139_1: string; // e.g. 31st October 2026 for audit cases
  paidOnOrBeforeDueDate: boolean;
  disallowanceAmountInr: number;
  statutoryClauseRef: string;
}

export interface Clause26AuditReport {
  assessmentYear: string;
  totalStatutoryLiabilities31stMarch: number;
  totalPaidBeforeItrDueDate: number;
  totalDisallowedUnderSec43B: number;
  dues: Sec43bStatutoryDueItem[];
}

export class Clause26Sec43bEngine {
  /**
   * Audits Section 43B statutory liabilities against ITR filing due date
   */
  public static auditStatutoryDues(dues: Array<{
    id: string;
    liabilityHead: 'GST_PAYABLE' | 'EPF_EMPLOYER_SHARE' | 'ESIC_EMPLOYER_SHARE' | 'BONUS_PAYABLE' | 'GRATUITY_FUND' | 'BANK_INTEREST_OVERDRAFT' | 'LEAVE_ENCASHMENT';
    liabilityDescription: string;
    balanceAsOf31stMarchInr: number;
    actualDateOfPayment?: string;
    itrFilingDueDateSec139_1: string;
  }>): Clause26AuditReport {
    let totalBal = 0;
    let totalPaid = 0;
    let totalDisallowed = 0;

    const audited = dues.map(d => {
      totalBal += d.balanceAsOf31stMarchInr;
      const dueDate = new Date(d.itrFilingDueDateSec139_1);
      const payDate = d.actualDateOfPayment ? new Date(d.actualDateOfPayment) : null;

      const isPaidOnTime = payDate !== null && payDate <= dueDate;
      const disallowance = isPaidOnTime ? 0 : d.balanceAsOf31stMarchInr;

      if (isPaidOnTime) {
        totalPaid += d.balanceAsOf31stMarchInr;
      } else {
        totalDisallowed += disallowance;
      }

      return {
        ...d,
        paidOnOrBeforeDueDate: isPaidOnTime,
        disallowanceAmountInr: disallowance,
        statutoryClauseRef: `Clause 26(i)(B) / Section 43B`
      };
    });

    return {
      assessmentYear: 'AY 2025-26',
      totalStatutoryLiabilities31stMarch: totalBal,
      totalPaidBeforeItrDueDate: totalPaid,
      totalDisallowedUnderSec43B: totalDisallowed,
      dues: audited
    };
  }
}

export const SAMPLE_CLAUSE_26_DATA = Clause26Sec43bEngine.auditStatutoryDues([
  {
    id: '43B-01',
    liabilityHead: 'GST_PAYABLE',
    liabilityDescription: 'March 2026 GST Liability (GSTR-3B Table 6.1 Cash)',
    balanceAsOf31stMarchInr: 185000,
    actualDateOfPayment: '2026-04-18', // Paid on 18th April
    itrFilingDueDateSec139_1: '2026-10-31'
  },
  {
    id: '43B-02',
    liabilityHead: 'EPF_EMPLOYER_SHARE',
    liabilityDescription: 'Employer Provident Fund Contribution for March 2026',
    balanceAsOf31stMarchInr: 64000,
    actualDateOfPayment: '2026-04-14',
    itrFilingDueDateSec139_1: '2026-10-31'
  },
  {
    id: '43B-03',
    liabilityHead: 'BONUS_PAYABLE',
    liabilityDescription: 'Statutory Annual Bonus to Factory Workers (Payment of Bonus Act)',
    balanceAsOf31stMarchInr: 250000,
    actualDateOfPayment: '2026-11-15', // Paid AFTER due date of 31st Oct!
    itrFilingDueDateSec139_1: '2026-10-31'
  }
]);
