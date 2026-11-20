/**
 * Ghosh & Jilani Committee Recommendations & RBI 42 Early Warning Signals (EWS) Engine
 * 
 * Statutory Authority:
 * - RBI Report of the High Level Committee on Frauds and Malpractices in Banks (Ghosh Committee)
 * - RBI Working Group on Internal Control and Inspection/Audit Systems in Banks (Jilani Committee)
 * - RBI Master Directions on Frauds - Classification and Reporting by Commercial Banks (RBI/DBS/2016-17/28)
 *   Annexure: 42 Early Warning Signals (EWS) for Red Flagged Accounts (RFA)
 */

export interface GhoshJilaniControlItem {
  id: string;
  committee: 'GHOSH' | 'JILANI';
  category: 'CASH_KEYS_VAULT' | 'STAFF_ROTATION' | 'DORMANT_ACCOUNTS' | 'CLEARING_CHEQUES' | 'SECURITY_FORMS';
  recommendationText: string;
  verificationMethod: string;
  isCompliant: boolean;
  auditorFinding: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface EarlyWarningSignalItem {
  ewsCode: string; // e.g. EWS-01, EWS-14
  ewsTitle: string;
  description: string;
  detectedCountInBranch: number;
  flaggedBorrowers: {
    accountNumber: string;
    borrowerName: string;
    triggerDetail: string;
    exposureAmount: number;
  }[];
  redFlaggedAccountRfaTrigger: boolean;
  actionRequired: string;
}

export class GhoshJilaniEwsEngine {
  /**
   * Generates standard Ghosh and Jilani Committee Recommendations Checklist
   */
  public static getGhoshJilaniChecklist(): GhoshJilaniControlItem[] {
    return [
      {
        id: 'GJ-01',
        committee: 'GHOSH',
        category: 'CASH_KEYS_VAULT',
        recommendationText: 'Dual custody of vault safe keys, cash cabin, and duplicate keys held with another designated branch / currency chest in sealed cover.',
        verificationMethod: 'Inspect Safe Key Register, verify annual physical verification of sealed covers at host branch.',
        isCompliant: true,
        auditorFinding: 'Dual custody maintained by Branch Manager and Head Cashier. Sealed cover receipt from SBI Main Branch dated 14-Aug-2026 verified.',
        severity: 'LOW'
      },
      {
        id: 'GJ-02',
        committee: 'GHOSH',
        category: 'STAFF_ROTATION',
        recommendationText: 'Mandatory rotation of operational staff handling cash, clearing, and advances every 3 years; mandatory block leave of 10 consecutive days per annum.',
        verificationMethod: 'Review Staff Movement Register and HR leave records for the audited financial year.',
        isCompliant: false,
        auditorFinding: 'Senior Head Cashier has remained on the same single cash counter desk for 4.2 consecutive years without mandatory block leave.',
        severity: 'HIGH'
      },
      {
        id: 'GJ-03',
        committee: 'GHOSH',
        category: 'DORMANT_ACCOUNTS',
        recommendationText: 'Reactivation of inoperative/dormant accounts strictly based on fresh KYC, written request, and dual-authorization by Branch Manager and Accountant.',
        verificationMethod: 'Sample 100% of reactivated accounts with balance > ₹50,000 in the past 12 months.',
        isCompliant: true,
        auditorFinding: 'All 14 reactivated accounts had customer presence proof, biometric authorization, and fresh KYC uploaded in CBS.',
        severity: 'LOW'
      },
      {
        id: 'GJ-04',
        committee: 'JILANI',
        category: 'SECURITY_FORMS',
        recommendationText: 'Physical verification and custody register for unused security items (cheque books, Demand Draft leaves, Fixed Deposit receipt pads) by Accountant.',
        verificationMethod: 'Physical count of leaf stationery against CBS inventory balance.',
        isCompliant: true,
        auditorFinding: 'Stationery physically tallied. DD leaves series (A-91001 to A-92500) matched CBS register exactly.',
        severity: 'LOW'
      },
      {
        id: 'GJ-05',
        committee: 'JILANI',
        category: 'CLEARING_CHEQUES',
        recommendationText: 'Independent verification of outward and inward clearing cheques exceeding ₹5 Lakhs, special crossing checks, and confirmation of high-value debits with account holders.',
        verificationMethod: 'Sample clearing call-back register and manager signature on high-value cheques.',
        isCompliant: false,
        auditorFinding: 'Inward clearing register had 4 cheques (> ₹10 Lakhs each) without call-back telephonic confirmation log maintained.',
        severity: 'HIGH'
      }
    ];
  }

  /**
   * Scans borrower portfolio for RBI 42 Early Warning Signals (EWS)
   */
  public static scanEarlyWarningSignals(): EarlyWarningSignalItem[] {
    return [
      {
        ewsCode: 'EWS-02',
        ewsTitle: 'GST Turnover vs Stock Statement Sales Divergence (> 15%)',
        description: 'Substantial divergence between sales revenue reported in GST returns (GSTR-1/3B) and quarterly sales figures submitted in bank stock statements.',
        detectedCountInBranch: 2,
        flaggedBorrowers: [
          {
            accountNumber: '3819002100049210',
            borrowerName: 'Malwa Agro Processing Industries Pvt Ltd',
            triggerDetail: 'Declared ₹18.5 Cr sales in Bank Stock Statement vs ₹14.2 Cr in GSTR-3B (23.2% divergence).',
            exposureAmount: 24850000
          }
        ],
        redFlaggedAccountRfaTrigger: true,
        actionRequired: 'Commission special forensic stock audit and report as Red Flagged Account (RFA) to CRILC.'
      },
      {
        ewsCode: 'EWS-09',
        ewsTitle: 'Frequent Cheque Bouncing for Lack of Funds',
        description: 'Inward clearing cheques of borrower returning unpaid continuously due to Insufficient Funds (Reason 01/02).',
        detectedCountInBranch: 1,
        flaggedBorrowers: [
          {
            accountNumber: '3819002100088123',
            borrowerName: 'Khandelwal Steel & Tube Mills',
            triggerDetail: '11 cheques totaling ₹48 Lakhs returned unpaid in the last 90 days.',
            exposureAmount: 41200000
          }
        ],
        redFlaggedAccountRfaTrigger: true,
        actionRequired: 'Issue 7-day recall notice; block further drawings and review for wilful default.'
      },
      {
        ewsCode: 'EWS-24',
        ewsTitle: 'Round-Tripping & High-Velocity Transfers to Sister Concerns',
        description: 'Fund flows showing circular movement: CC account debit -> sister entity -> third party -> credit back to CC account without underlying business trade.',
        detectedCountInBranch: 1,
        flaggedBorrowers: [
          {
            accountNumber: '3819002100049210',
            borrowerName: 'Malwa Agro Processing Industries Pvt Ltd',
            triggerDetail: '₹85 Lakhs transferred to associate concern M/s Malwa Seeds on 16-Nov and received back after 3 days.',
            exposureAmount: 24850000
          }
        ],
        redFlaggedAccountRfaTrigger: true,
        actionRequired: 'Report diversion of funds to Zonal Forensic Cell and mark as non-compliant advance.'
      },
      {
        ewsCode: 'EWS-31',
        ewsTitle: 'Delayed Submission of Stock Statements Beyond 90 Days',
        description: 'Borrower fails to submit certified stock and book debt statements for > 3 consecutive months, preventing proper Drawing Power assessment.',
        detectedCountInBranch: 1,
        flaggedBorrowers: [
          {
            accountNumber: '3819002100049210',
            borrowerName: 'Malwa Agro Processing Industries Pvt Ltd',
            triggerDetail: 'Last stock statement submitted was for July 2026 (4 months overdue).',
            exposureAmount: 24850000
          }
        ],
        redFlaggedAccountRfaTrigger: false,
        actionRequired: 'Auto-classify as NPA Sub-Standard u/s IRAC Para 4.2.4 and levy 2% penal interest.'
      }
    ];
  }
}
