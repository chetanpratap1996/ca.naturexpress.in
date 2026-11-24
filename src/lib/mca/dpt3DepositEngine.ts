/**
 * Form DPT-3 Annual Return of Deposits & Exempted Loans Engine
 * 
 * Statutory Authority:
 * - Section 73 of Companies Act 2013 read with Rule 16 of Companies (Acceptance of Deposits) Rules, 2014
 * - Rule 2(1)(c): Categorization of transactions not considered as deposits (exempted loans)
 *   - Clause (viii): Loans from Directors / relatives of directors with mandatory written declaration of non-borrowed funds
 *   - Clause (vii): Inter-corporate loans
 *   - Clause (xii): Customer advances held beyond 365 days become Deemed Deposits!
 *   - Clause (iii): Bank & Financial Institution borrowings
 * - Annual Filing Due Date: 30th June for the financial year ended 31st March
 * - Penalties u/r 21: Fine up to ₹5,000 and ₹500/day for continuing default
 */

export type Dpt3FilingPurpose = 
  | 'EXEMPTED_LOANS_ONLY' 
  | 'DEPOSITS_ONLY' 
  | 'BOTH_DEPOSITS_AND_EXEMPTED' 
  | 'NIL_RETURN';

export interface Dpt3LiabilityItem {
  id: string;
  category: 
    | 'DIRECTOR_LOAN_EXEMPT' 
    | 'BANK_BORROWING' 
    | 'INTER_CORPORATE_DEPOSIT' 
    | 'CUSTOMER_ADVANCE_BEYOND_365D' 
    | 'COMMERCIAL_PAPER' 
    | 'PUBLIC_DEPOSIT';
  partyName: string;
  panOrCin: string;
  openingBalance: number;
  amountReceivedDuringYear: number;
  amountRepaidDuringYear: number;
  closingBalance: number;
  isDeemedDeposit: boolean;
  directorDeclarationObtained: boolean; // Mandatory for Director loans u/r 2(1)(c)(viii)
  statutoryAuditVerificationStatus: 'VERIFIED_GENUINE' | 'DECLARATION_MISSING' | 'RECLASSIFIED_AS_DEPOSIT';
}

export interface Dpt3FilingSummary {
  cin: string;
  companyName: string;
  financialYear: string;
  purposeOfFiling: Dpt3FilingPurpose;
  totalExemptedLiabilities: number;
  totalDeemedDeposits: number;
  totalPublicDeposits: number;
  grandTotalLiabilities: number;
  netWorthOfCompany: number;
  depositToNetWorthRatioPercent: number;
  isWithinPermissibleLimits: boolean;
  auditorCertificateRequired: boolean; // Required if filing for Deposits or Both
}

export class Dpt3DepositEngine {
  /**
   * Reconciles liabilities and classifies into Exempted Loans vs Deemed Deposits
   */
  public static evaluateDpt3Liabilities(
    liabilities: Dpt3LiabilityItem[],
    companyDetails: { cin: string; companyName: string; financialYear: string; netWorth: number }
  ): Dpt3FilingSummary {
    let totalExempt = 0;
    let totalDeemed = 0;
    let totalPublic = 0;

    liabilities.forEach(l => {
      // Check customer advances held > 365 days
      if (l.category === 'CUSTOMER_ADVANCE_BEYOND_365D') {
        l.isDeemedDeposit = true;
        l.statutoryAuditVerificationStatus = 'RECLASSIFIED_AS_DEPOSIT';
        totalDeemed += l.closingBalance;
      } else if (l.category === 'DIRECTOR_LOAN_EXEMPT') {
        if (!l.directorDeclarationObtained) {
          // Failure to obtain non-borrowed funds declaration reclassifies loan as deposit!
          l.isDeemedDeposit = true;
          l.statutoryAuditVerificationStatus = 'DECLARATION_MISSING';
          totalDeemed += l.closingBalance;
        } else {
          totalExempt += l.closingBalance;
        }
      } else if (l.category === 'PUBLIC_DEPOSIT') {
        totalPublic += l.closingBalance;
      } else {
        totalExempt += l.closingBalance;
      }
    });

    const grandTotal = totalExempt + totalDeemed + totalPublic;
    const totalDeposits = totalDeemed + totalPublic;
    const ratio = companyDetails.netWorth > 0 
      ? Number(((totalDeposits / companyDetails.netWorth) * 100).toFixed(2)) 
      : 0;

    // A private company can accept deposits from members up to 100% of (Paid up Capital + Free Reserves + Securities Premium)
    const withinLimits = ratio <= 100;

    let purpose: Dpt3FilingPurpose = 'EXEMPTED_LOANS_ONLY';
    if (totalDeposits > 0 && totalExempt > 0) {
      purpose = 'BOTH_DEPOSITS_AND_EXEMPTED';
    } else if (totalDeposits > 0) {
      purpose = 'DEPOSITS_ONLY';
    } else if (totalExempt > 0) {
      purpose = 'EXEMPTED_LOANS_ONLY';
    } else {
      purpose = 'NIL_RETURN';
    }

    return {
      cin: companyDetails.cin,
      companyName: companyDetails.companyName,
      financialYear: companyDetails.financialYear,
      purposeOfFiling: purpose,
      totalExemptedLiabilities: totalExempt,
      totalDeemedDeposits: totalDeemed,
      totalPublicDeposits: totalPublic,
      grandTotalLiabilities: grandTotal,
      netWorthOfCompany: companyDetails.netWorth,
      depositToNetWorthRatioPercent: ratio,
      isWithinPermissibleLimits: withinLimits,
      auditorCertificateRequired: purpose === 'DEPOSITS_ONLY' || purpose === 'BOTH_DEPOSITS_AND_EXEMPTED'
    };
  }
}

export const SAMPLE_DPT3_LIABILITIES: Dpt3LiabilityItem[] = [
  {
    id: 'DPT-01',
    category: 'DIRECTOR_LOAN_EXEMPT',
    partyName: 'Chetan Pratap Singh (Managing Director)',
    panOrCin: 'AANCP9915B',
    openingBalance: 0,
    amountReceivedDuringYear: 0,
    amountRepaidDuringYear: 0,
    closingBalance: 0,
    isDeemedDeposit: false,
    directorDeclarationObtained: true, // Rule 2(1)(c)(viii) verified
    statutoryAuditVerificationStatus: 'VERIFIED_GENUINE'
  },
  {
    id: 'DPT-02',
    category: 'BANK_BORROWING',
    partyName: 'State Bank of India (Cash Credit & Term Loan)',
    panOrCin: 'SBIN0001234',
    openingBalance: 18000000,
    amountReceivedDuringYear: 5000000,
    amountRepaidDuringYear: 3200000,
    closingBalance: 19800000, // ₹1.98 Cr
    isDeemedDeposit: false,
    directorDeclarationObtained: true,
    statutoryAuditVerificationStatus: 'VERIFIED_GENUINE'
  },
  {
    id: 'DPT-03',
    category: 'CUSTOMER_ADVANCE_BEYOND_365D',
    partyName: 'Pratwi Solutions Private Limited',
    panOrCin: 'U29100MP2018PTC049210',
    openingBalance: 1200000,
    amountReceivedDuringYear: 0,
    amountRepaidDuringYear: 0,
    closingBalance: 1200000, // Advance > 365 days = Deemed Deposit!
    isDeemedDeposit: true,
    directorDeclarationObtained: false,
    statutoryAuditVerificationStatus: 'RECLASSIFIED_AS_DEPOSIT'
  }
];
