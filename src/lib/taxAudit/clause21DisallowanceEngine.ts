/**
 * Form 3CD Clause 21(a), (b), (d) Statutory Disallowances Matrix
 * 
 * Statutory Authority:
 * - Section 40(a)(ia) (30% disallowance on sum payable to resident without TDS deduction/deposit)
 * - Section 40A(3) read with Rule 6DD (Disallowance of cash payment exceeding Rs. 10,000)
 * - Section 40A(2)(b) (Excessive or unreasonable payments to persons specified u/s 40A(2)(b))
 * - Section 37(1) Explanation 1 & 2 (Disallowance of penalty, fines, and CSR expenditure)
 */

export interface DisallowanceItem {
  id: string;
  category: 'SEC_40_A_IA_TDS' | 'SEC_40A_3_CASH' | 'SEC_40A_2_B_RELATED' | 'SEC_37_1_PENALTY_CSR';
  partyName: string;
  pan?: string;
  ledgerHead: string;
  voucherNumber: string;
  paymentDate: string;
  totalGrossAmountInr: number;
  disallowancePercentage: number;
  disallowanceAmountInr: number;
  statutoryReason: string;
  isContestable: boolean;
}

export interface Clause21SummaryReport {
  assessmentYear: string;
  totalSec40aIaDisallowance: number; // 30% TDS
  totalSec40A3CashDisallowance: number; // 100% Cash > ₹10,000
  totalSec40A2bRelatedPartyExcess: number;
  totalPenaltiesAndCsrDisallowance: number;
  grandTotalDisallowances: number;
  items: DisallowanceItem[];
}

export class Clause21DisallowanceEngine {
  /**
   * Computes statutory Clause 21 additions to P&L
   */
  public static computeDisallowances(items: DisallowanceItem[]): Clause21SummaryReport {
    let tds40aIa = 0;
    let cash40A3 = 0;
    let related40A2b = 0;
    let penalties37 = 0;

    for (const it of items) {
      if (it.category === 'SEC_40_A_IA_TDS') tds40aIa += it.disallowanceAmountInr;
      else if (it.category === 'SEC_40A_3_CASH') cash40A3 += it.disallowanceAmountInr;
      else if (it.category === 'SEC_40A_2_B_RELATED') related40A2b += it.disallowanceAmountInr;
      else penalties37 += it.disallowanceAmountInr;
    }

    return {
      assessmentYear: 'AY 2025-26',
      totalSec40aIaDisallowance: tds40aIa,
      totalSec40A3CashDisallowance: cash40A3,
      totalSec40A2bRelatedPartyExcess: related40A2b,
      totalPenaltiesAndCsrDisallowance: penalties37,
      grandTotalDisallowances: tds40aIa + cash40A3 + related40A2b + penalties37,
      items
    };
  }
}

export const SAMPLE_CLAUSE_21_ITEMS: DisallowanceItem[] = [
  {
    id: 'D-01',
    category: 'SEC_40_A_IA_TDS',
    partyName: 'M/s Creative Media & Ad Solutions',
    pan: 'AABFC8891P',
    ledgerHead: 'Advertisement & Publicity Expenses',
    voucherNumber: 'PV/26/104',
    paymentDate: '2026-08-14',
    totalGrossAmountInr: 450000,
    disallowancePercentage: 30,
    disallowanceAmountInr: 135000,
    statutoryReason: 'TDS u/s 194C of ₹9,000 not deducted at the time of credit/payment. 30% of expenditure disallowed u/s 40(a)(ia).',
    isContestable: false
  },
  {
    id: 'D-02',
    category: 'SEC_40A_3_CASH',
    partyName: 'Shri Ramdev Transporters',
    ledgerHead: 'Freight Inward & Unloading Charges',
    voucherNumber: 'CP/26/892',
    paymentDate: '2026-09-02',
    totalGrossAmountInr: 48000,
    disallowancePercentage: 100,
    disallowanceAmountInr: 48000,
    statutoryReason: 'Cash payment to transporter exceeded statutory threshold of ₹35,000 (actual ₹48,000 paid). Disallowed 100% u/s 40A(3).',
    isContestable: false
  },
  {
    id: 'D-03',
    category: 'SEC_37_1_PENALTY_CSR',
    partyName: 'State Goods & Services Tax Department',
    ledgerHead: 'Statutory Penalties & Interest',
    voucherNumber: 'JV/26/410',
    paymentDate: '2026-07-20',
    totalGrossAmountInr: 25000,
    disallowancePercentage: 100,
    disallowanceAmountInr: 25000,
    statutoryReason: 'Penalty imposed for violation of E-Way Bill rules u/s 129 of CGST Act. Incurred for infringement of law; disallowed u/s 37(1) Explanation 1.',
    isContestable: false
  }
];

export const SAMPLE_CLAUSE_21_REPORT = Clause21DisallowanceEngine.computeDisallowances(SAMPLE_CLAUSE_21_ITEMS);
