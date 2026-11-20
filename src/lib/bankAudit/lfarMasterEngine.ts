/**
 * RBI Long Form Audit Report (LFAR) Master Pack Engine
 * 
 * Statutory Authority:
 * - RBI Master Circular on Long Form Audit Report (LFAR) for Statutory Bank Branch Audits
 *   (Revised LFAR Formats issued via RBI/2020-21/33 Ref. No. DOS.CO.PPG./SEC.01/11.01.005/2020-21)
 * - ICAI Guidance Note on Audit of Banks (2024 / 2025 Edition)
 * - Coverage: Advances, Deposits, Cash & Bank Balances, Foreign Exchange, Other Assets/Liabilities, Frauds & Internal Controls
 */

export type LfarSectionCategory = 
  | 'ADVANCES_APPRAISAL_SANCTION'
  | 'ADVANCES_DOCUMENTATION'
  | 'ADVANCES_MONITORING_RECOVERY'
  | 'ADVANCES_ASSET_CLASSIFICATION'
  | 'DEPOSITS_KYC_DORMANT'
  | 'CASH_BALANCES_CLEARING'
  | 'FOREIGN_EXCHANGE_NOSTRO'
  | 'FRAUD_INTERNAL_CONTROLS';

export type LfarObservationStatus = 'SATISFACTORY' | 'DEFICIENCY_NOTED' | 'ADVERSE_QUALIFICATION' | 'NOT_APPLICABLE';

export interface LfarQuestionItem {
  id: string;
  category: LfarSectionCategory;
  questionNumber: string;
  questionText: string;
  guidanceText: string;
  status: LfarObservationStatus;
  auditorRemarks: string;
  managementResponse?: string;
  borrowerAccountImpacted?: string[];
  requiresMoc: boolean;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface LfarAuditPackSummary {
  branchName: string;
  branchCode: string;
  bankName: string;
  financialYear: string;
  totalQuestions: number;
  satisfactoryCount: number;
  deficiencyCount: number;
  adverseQualificationCount: number;
  highRiskObservations: number;
  mocCount: number;
  completionPercentage: number;
}

export class LfarMasterEngine {
  /**
   * Generates standard RBI-mandated LFAR questions with institutional pre-fills
   */
  public static getMandatedLfarQuestions(): LfarQuestionItem[] {
    return [
      // 1. ADVANCES - APPRAISAL & SANCTION
      {
        id: 'LFAR-ADV-01',
        category: 'ADVANCES_APPRAISAL_SANCTION',
        questionNumber: 'Adv-1(a)',
        questionText: 'Have all credit proposals been appraised in accordance with the lending policy and credit delegation powers approved by the Board?',
        guidanceText: 'Verify if credit scoring, TEV (Techno-Economic Viability) study, and sanctioned limits were within the discretionary lending powers of the Branch Head.',
        status: 'SATISFACTORY',
        auditorRemarks: 'Appraisal norms verified for all 18 large sanction files (> ₹1 Crore). Sanctions were within the approved Zonal/Branch discretionary lending powers.',
        requiresMoc: false,
        riskRating: 'LOW'
      },
      {
        id: 'LFAR-ADV-02',
        category: 'ADVANCES_APPRAISAL_SANCTION',
        questionNumber: 'Adv-1(b)',
        questionText: 'Were quick mortalities observed in advances sanctioned during the year (i.e. accounts slipping to NPA within 12 months of sanction)?',
        guidanceText: 'Check for deficiencies in pre-sanction inspection or due diligence leading to early defaults.',
        status: 'DEFICIENCY_NOTED',
        auditorRemarks: 'One CC account (M/s Apex Granites, Limit ₹1.20 Cr, sanctioned Aug-2025) slipped to SMA-2 within 7 months due to non-verification of GST turnover mismatch.',
        borrowerAccountImpacted: ['3819002100099412'],
        requiresMoc: false,
        riskRating: 'HIGH'
      },

      // 2. ADVANCES - DOCUMENTATION & SECURITY CREATION
      {
        id: 'LFAR-ADV-03',
        category: 'ADVANCES_DOCUMENTATION',
        questionNumber: 'Adv-2(a)',
        questionText: 'Are all loan agreements, deeds of hypothecation, guarantees, and DP Notes properly executed, valid, and legally enforceable?',
        guidanceText: 'Verify stamping adequacy, CERSAI registration within 30 days, and valid title deeds search reports for equitable mortgages.',
        status: 'DEFICIENCY_NOTED',
        auditorRemarks: 'In 3 sample accounts, CERSAI registration was delayed beyond the 30-day statutory window. Remedial filings advised.',
        borrowerAccountImpacted: ['3819002100049210', '3819003500010945'],
        requiresMoc: false,
        riskRating: 'MEDIUM'
      },
      {
        id: 'LFAR-ADV-04',
        category: 'ADVANCES_DOCUMENTATION',
        questionNumber: 'Adv-2(b)',
        questionText: 'Is the hypothecated stock and mortgaged property comprehensively insured against fire, flood, and earthquake with bank clause included?',
        guidanceText: 'Check transit insurance, expired policies, and adequacy of insured value against sanctioned limits.',
        status: 'ADVERSE_QUALIFICATION',
        auditorRemarks: 'Stock insurance policy of M/s Khandelwal Steel expired on 15-Sep-2026 and remained un-renewed for 45 days. Branch failed to debit premium or track renewal.',
        borrowerAccountImpacted: ['3819002100088123'],
        requiresMoc: false,
        riskRating: 'HIGH'
      },

      // 3. ADVANCES - MONITORING, STOCK AUDIT & RECOVERY
      {
        id: 'LFAR-ADV-05',
        category: 'ADVANCES_MONITORING_RECOVERY',
        questionNumber: 'Adv-3(a)',
        questionText: 'Does the branch receive monthly/quarterly stock statements within 20 days of the close of the month, and are Drawing Powers (DP) calculated accurately?',
        guidanceText: 'Verify deduction of sundry creditors (unpaid stock), non-moving inventory, and debts > 90 days.',
        status: 'ADVERSE_QUALIFICATION',
        auditorRemarks: 'In 2 out of 10 sampled CC accounts, stock statements were > 3 months overdue. Furthermore, branch failed to deduct Sundry Creditors of ₹45 Lakhs in M/s Khandelwal Steel.',
        borrowerAccountImpacted: ['3819002100049210', '3819002100088123'],
        requiresMoc: true,
        riskRating: 'CRITICAL'
      },
      {
        id: 'LFAR-ADV-06',
        category: 'ADVANCES_MONITORING_RECOVERY',
        questionNumber: 'Adv-3(b)',
        questionText: 'Have annual credit reviews / renewal of working capital limits been completed before expiry, or have limits expired beyond 180 days?',
        guidanceText: 'Accounts where limits are not renewed within 180 days from the original due date are classified as NPA u/s IRAC Para 4.2.3.',
        status: 'DEFICIENCY_NOTED',
        auditorRemarks: 'Two CC limits are operating on ad-hoc extensions exceeding 90 days. Formal renewal files are pending at Regional Credit Committee.',
        borrowerAccountImpacted: ['3819003500010945'],
        requiresMoc: false,
        riskRating: 'MEDIUM'
      },

      // 4. ADVANCES - ASSET CLASSIFICATION & PROVISIONING (IRAC)
      {
        id: 'LFAR-ADV-07',
        category: 'ADVANCES_ASSET_CLASSIFICATION',
        questionNumber: 'Adv-4(a)',
        questionText: 'Has the branch correctly classified advances as per RBI IRAC Master Circular (Standard, SMA-0/1/2, Sub-Standard, Doubtful, Loss)?',
        guidanceText: 'Check borrower-wise NPA classification across all facilities (facility-level classification is strictly prohibited under IRAC).',
        status: 'ADVERSE_QUALIFICATION',
        auditorRemarks: 'M/s Malwa Agro was kept in Standard category despite stock statement being 4 months old (Para 4.2.4). Downgraded to Sub-Standard via MOC No. 01 with ₹36.28 Lakhs provision.',
        borrowerAccountImpacted: ['3819002100049210'],
        requiresMoc: true,
        riskRating: 'CRITICAL'
      },
      {
        id: 'LFAR-ADV-08',
        category: 'ADVANCES_ASSET_CLASSIFICATION',
        questionNumber: 'Adv-4(b)',
        questionText: 'Has uncollected interest on accounts classified as NPA been reversed from Interest Income and credited to Interest Suspense u/s IRAC norms?',
        guidanceText: 'Accrual of interest on NPA accounts is statutorily prohibited. Ensure 100% reversal.',
        status: 'ADVERSE_QUALIFICATION',
        auditorRemarks: 'Unrealized interest of ₹14.85 Lakhs recognized in P&L for accounts downgraded to NPA by auditors was reversed via MOC No. 02.',
        borrowerAccountImpacted: ['3819002100049210', '3819002100088123'],
        requiresMoc: true,
        riskRating: 'CRITICAL'
      },

      // 5. DEPOSITS, KYC & DORMANT ACCOUNTS
      {
        id: 'LFAR-ADV-09',
        category: 'DEPOSITS_KYC_DORMANT',
        questionNumber: 'Dep-1',
        questionText: 'Are inoperative / dormant accounts periodically reviewed, and are operations allowed only with proper manager authorization and re-KYC?',
        guidanceText: 'Examine reactivation audit trails to prevent unauthorized debits from dormant balances.',
        status: 'SATISFACTORY',
        auditorRemarks: 'Reactivation of 14 inoperative accounts during the year was backed by fresh KYC documents and Branch Manager biometric authorization.',
        requiresMoc: false,
        riskRating: 'LOW'
      },

      // 6. CASH, BALANCES & CLEARING
      {
        id: 'LFAR-ADV-10',
        category: 'CASH_BALANCES_CLEARING',
        questionNumber: 'Cash-1',
        questionText: 'Was physical cash counted and verified by auditors at the close of 31st March, and did it match the General Ledger without retention limit violations?',
        guidanceText: 'Compare overnight closing cash balances with the branch cash retention ceiling approved by the Controller.',
        status: 'SATISFACTORY',
        auditorRemarks: 'Physical cash of ₹14,28,450 verified and reconciled with clean GL balance. No overnight cash retention limit breaches observed.',
        requiresMoc: false,
        riskRating: 'LOW'
      },

      // 7. FOREIGN EXCHANGE & NOSTRO
      {
        id: 'LFAR-ADV-11',
        category: 'FOREIGN_EXCHANGE_NOSTRO',
        questionNumber: 'Forex-1',
        questionText: 'Are forward exchange contracts, letters of credit (LC), and bank guarantees (BG) properly recorded in off-balance sheet contingent liability registers?',
        guidanceText: 'Verify margin money liens, commission recovery, and invocation handling.',
        status: 'SATISFACTORY',
        auditorRemarks: 'All 8 outstanding Foreign LCs (USD 1.4M) and 12 BGs reconciled with 100% margin lien in CBS.',
        requiresMoc: false,
        riskRating: 'LOW'
      },

      // 8. FRAUD, JILANI & INTERNAL CONTROLS
      {
        id: 'LFAR-ADV-12',
        category: 'FRAUD_INTERNAL_CONTROLS',
        questionNumber: 'Fraud-1',
        questionText: 'Were any suspected frauds, malpractices, or early warning signals (EWS) detected, and has the branch implemented Ghosh & Jilani Committee recommendations?',
        guidanceText: 'Review dual custody of safe keys, password sharing prevention, and sudden spikes in turnover in newly opened accounts.',
        status: 'DEFICIENCY_NOTED',
        auditorRemarks: 'Dual custody of vault keys maintained. However, 2 staff terminals were found logged in without biometric auto-lock after 5 minutes of inactivity.',
        requiresMoc: false,
        riskRating: 'MEDIUM'
      }
    ];
  }

  /**
   * Summarizes LFAR Audit Progress & Risk Score
   */
  public static summarizeLfar(questions: LfarQuestionItem[], branchDetails: {
    branchName: string;
    branchCode: string;
    bankName: string;
    financialYear: string;
  }): LfarAuditPackSummary {
    const total = questions.length;
    const sat = questions.filter(q => q.status === 'SATISFACTORY').length;
    const def = questions.filter(q => q.status === 'DEFICIENCY_NOTED').length;
    const adv = questions.filter(q => q.status === 'ADVERSE_QUALIFICATION').length;
    const high = questions.filter(q => q.riskRating === 'HIGH' || q.riskRating === 'CRITICAL').length;
    const moc = questions.filter(q => q.requiresMoc).length;

    return {
      branchName: branchDetails.branchName,
      branchCode: branchDetails.branchCode,
      bankName: branchDetails.bankName,
      financialYear: branchDetails.financialYear,
      totalQuestions: total,
      satisfactoryCount: sat,
      deficiencyCount: def,
      adverseQualificationCount: adv,
      highRiskObservations: high,
      mocCount: moc,
      completionPercentage: Math.round(((sat + def + adv) / total) * 100)
    };
  }
}
