/**
 * ICAI SQC-1 Peer Review Workpaper Pack & Independence Shield
 * 
 * Statutory Authority:
 * - ICAI Standard on Quality Control 1 (SQC-1): Quality Control for Firms that Perform Audits and Reviews of Historical Financial Information
 * - ICAI Peer Review Board Guidelines (Mandatory for Level I, II, III practicing firms)
 * - Standards on Auditing (SA 210, SA 220, SA 230, SA 300, SA 315, SA 320, SA 500, SA 505, SA 580, SA 700)
 * - ICAI Code of Ethics (Form 3 & Form 4 Independence Declarations u/s 141(3) Companies Act 2013)
 */

export type WorkpaperCategory = 'PERMANENT_AUDIT_FILE' | 'CURRENT_AUDIT_FILE';

export interface AuditWorkpaperItem {
  id: string;
  code: string;
  title: string;
  category: WorkpaperCategory;
  standardReference: string; // e.g. "SA 210", "SA 320", "Sec 141"
  status: 'COMPLETED' | 'IN_REVIEW' | 'PENDING' | 'NOT_APPLICABLE';
  preparer: string;
  reviewer: string;
  eqcrSignOffRequired: boolean;
  eqcrSignOffStatus: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | 'NOT_REQUIRED';
  documentEvidenceRef?: string;
  lastUpdated: string;
  notes?: string;
}

export interface IndependenceDeclaration {
  id: string;
  partnerOrStaffName: string;
  membershipOrRegistrationNo: string;
  designation: 'PARTNER' | 'AUDIT_MANAGER' | 'ARTICLE_ASSISTANT';
  declarationType: 'FORM_3_ANNUAL_FIRM' | 'FORM_4_ENGAGEMENT_SPECIFIC';
  clientName?: string;
  financialYear: string;
  noFinancialInterestConfirmed: boolean; // Sec 141(3)(d)(i)
  noIndebtednessAboveThresholdConfirmed: boolean; // < ₹5 Lakhs u/s 141(3)(d)(ii)
  noBusinessRelationshipConfirmed: boolean; // Sec 141(3)(e)
  noRelativeInKeyManagerialPositionConfirmed: boolean; // Sec 141(3)(f)
  signedDate: string;
  status: 'SUBMITTED_AND_VERIFIED' | 'PENDING_SIGNATURE' | 'DEFICIENCY_FLAGGED';
}

export interface PeerReviewHealthScore {
  totalMandatoryWorkpapers: number;
  completedWorkpapers: number;
  completionPercentage: number;
  pafCompleteness: number; // %
  cafCompleteness: number; // %
  independenceDeclarationsVerified: boolean;
  eqcrCompleted: boolean;
  sqc1Compliant: boolean;
  deficiencies: string[];
}

export class Sqc1PeerReviewEngine {
  /**
   * Computes the SQC-1 Peer Review Compliance Health Score
   */
  public static evaluateEngagementCompliance(
    workpapers: AuditWorkpaperItem[],
    declarations: IndependenceDeclaration[],
    isPublicInterestEntity: boolean = false
  ): PeerReviewHealthScore {
    const total = workpapers.length;
    const completed = workpapers.filter(w => w.status === 'COMPLETED').length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const pafItems = workpapers.filter(w => w.category === 'PERMANENT_AUDIT_FILE');
    const pafCompleted = pafItems.filter(w => w.status === 'COMPLETED').length;
    const pafPct = pafItems.length > 0 ? Math.round((pafCompleted / pafItems.length) * 100) : 0;

    const cafItems = workpapers.filter(w => w.category === 'CURRENT_AUDIT_FILE');
    const cafCompleted = cafItems.filter(w => w.status === 'COMPLETED').length;
    const cafPct = cafItems.length > 0 ? Math.round((cafCompleted / cafItems.length) * 100) : 0;

    const unverifiedDeclarations = declarations.filter(d => d.status !== 'SUBMITTED_AND_VERIFIED');
    const independenceVerified = declarations.length > 0 && unverifiedDeclarations.length === 0;

    const eqcrItems = workpapers.filter(w => w.eqcrSignOffRequired);
    const eqcrPending = eqcrItems.filter(w => w.eqcrSignOffStatus !== 'APPROVED');
    const eqcrCompleted = !isPublicInterestEntity || (eqcrItems.length > 0 && eqcrPending.length === 0);

    const deficiencies: string[] = [];

    if (pafPct < 100) {
      deficiencies.push(`Permanent Audit File (PAF) incomplete: ${pafCompleted}/${pafItems.length} documents archived.`);
    }
    if (cafPct < 85) {
      deficiencies.push(`Current Audit File (CAF) below 85% readiness threshold (current: ${cafPct}%).`);
    }
    if (!independenceVerified) {
      deficiencies.push(`Pending Code of Ethics Form 3 / Form 4 independence sign-offs (${unverifiedDeclarations.length} outstanding).`);
    }
    if (isPublicInterestEntity && !eqcrCompleted) {
      deficiencies.push(`Engagement Quality Control Review (EQCR) sign-off mandatory for public interest client under SQC-1 Para 60.`);
    }

    const sqc1Compliant = deficiencies.length === 0 && completionPct >= 95;

    return {
      totalMandatoryWorkpapers: total,
      completedWorkpapers: completed,
      completionPercentage: completionPct,
      pafCompleteness: pafPct,
      cafCompleteness: cafPct,
      independenceDeclarationsVerified: independenceVerified,
      eqcrCompleted,
      sqc1Compliant,
      deficiencies
    };
  }
}

export const SAMPLE_WORKPAPERS: AuditWorkpaperItem[] = [
  // Permanent Audit File (PAF)
  {
    id: 'WP-PAF-01',
    code: 'PAF-101',
    title: 'Certificate of Incorporation, MOA & AOA with Amendments',
    category: 'PERMANENT_AUDIT_FILE',
    standardReference: 'SA 230 / Sec 143',
    status: 'COMPLETED',
    preparer: 'Kriti Jain (Article Trainee)',
    reviewer: 'CA Anita Desai (Manager)',
    eqcrSignOffRequired: false,
    eqcrSignOffStatus: 'NOT_REQUIRED',
    documentEvidenceRef: 'DOC-MOA-2021-V2.pdf',
    lastUpdated: '2026-08-10',
    notes: 'Verified amended capital clause pursuant to rights issue in 2024.'
  },
  {
    id: 'WP-PAF-02',
    code: 'PAF-102',
    title: 'Statutory Registrations (PAN, GSTIN, TAN, IEC, Factory License)',
    category: 'PERMANENT_AUDIT_FILE',
    standardReference: 'SA 230',
    status: 'COMPLETED',
    preparer: 'Kriti Jain (Article Trainee)',
    reviewer: 'CA Anita Desai (Manager)',
    eqcrSignOffRequired: false,
    eqcrSignOffStatus: 'NOT_REQUIRED',
    documentEvidenceRef: 'DOC-REG-MASTER.pdf',
    lastUpdated: '2026-08-11',
    notes: 'Active GSTIN across Maharashtra and Gujarat branches verified.'
  },
  {
    id: 'WP-PAF-03',
    code: 'PAF-103',
    title: 'Long-term Borrowing Agreements & Debt Covenants',
    category: 'PERMANENT_AUDIT_FILE',
    standardReference: 'SA 500 / SA 505',
    status: 'COMPLETED',
    preparer: 'Vikram Joshi (Article)',
    reviewer: 'CA Gunjan Jain (Partner)',
    eqcrSignOffRequired: false,
    eqcrSignOffStatus: 'NOT_REQUIRED',
    documentEvidenceRef: 'LOAN-AGMT-HDFC-TERM-2023.pdf',
    lastUpdated: '2026-08-15',
    notes: 'Term loan covenants stipulate minimum DSCR of 1.25x.'
  },
  // Current Audit File (CAF)
  {
    id: 'WP-CAF-01',
    code: 'CAF-201',
    title: 'Engagement Letter duly acknowledged by Management',
    category: 'CURRENT_AUDIT_FILE',
    standardReference: 'SA 210',
    status: 'COMPLETED',
    preparer: 'CA Anita Desai (Manager)',
    reviewer: 'CA Gunjan Jain (Partner)',
    eqcrSignOffRequired: false,
    eqcrSignOffStatus: 'NOT_REQUIRED',
    documentEvidenceRef: 'ENG-LTR-FY2526-SIGNED.pdf',
    lastUpdated: '2026-09-01'
  },
  {
    id: 'WP-CAF-02',
    code: 'CAF-202',
    title: 'Overall Audit Strategy, Plan & Materiality Worksheet',
    category: 'CURRENT_AUDIT_FILE',
    standardReference: 'SA 300 / SA 320',
    status: 'COMPLETED',
    preparer: 'CA Anita Desai (Manager)',
    reviewer: 'CA Gunjan Jain (Partner)',
    eqcrSignOffRequired: true,
    eqcrSignOffStatus: 'APPROVED',
    documentEvidenceRef: 'AUDIT-PLAN-MAT-CALC.xlsx',
    lastUpdated: '2026-09-05',
    notes: 'Planning materiality established at 1% of Gross Turnover (₹48,50,000).'
  },
  {
    id: 'WP-CAF-03',
    code: 'CAF-203',
    title: 'Direct External Confirmations (Bank, Debtors, Creditors)',
    category: 'CURRENT_AUDIT_FILE',
    standardReference: 'SA 505',
    status: 'COMPLETED',
    preparer: 'Kriti Jain (Article Trainee)',
    reviewer: 'CA Anita Desai (Manager)',
    eqcrSignOffRequired: false,
    eqcrSignOffStatus: 'NOT_REQUIRED',
    documentEvidenceRef: 'CONF-SUMMARY-PACK.pdf',
    lastUpdated: '2026-09-20',
    notes: '100% of bank balances and 82% of trade debtor balances reconciled directly.'
  },
  {
    id: 'WP-CAF-04',
    code: 'CAF-204',
    title: 'Management Representation Letter (MRL)',
    category: 'CURRENT_AUDIT_FILE',
    standardReference: 'SA 580',
    status: 'COMPLETED',
    preparer: 'CA Anita Desai (Manager)',
    reviewer: 'CA Gunjan Jain (Partner)',
    eqcrSignOffRequired: true,
    eqcrSignOffStatus: 'APPROVED',
    documentEvidenceRef: 'MRL-EXECUTED-BOARD.pdf',
    lastUpdated: '2026-09-27',
    notes: 'Signed by Managing Director and CFO on audit report date.'
  },
  {
    id: 'WP-CAF-05',
    code: 'CAF-205',
    title: 'Going Concern & Subsequent Events Review',
    category: 'CURRENT_AUDIT_FILE',
    standardReference: 'SA 570 / SA 560',
    status: 'COMPLETED',
    preparer: 'CA Anita Desai (Manager)',
    reviewer: 'CA Gunjan Jain (Partner)',
    eqcrSignOffRequired: true,
    eqcrSignOffStatus: 'APPROVED',
    documentEvidenceRef: 'GOING-CONCERN-MEMO.pdf',
    lastUpdated: '2026-09-27',
    notes: 'No material uncertainty identified regarding going concern for next 12 months.'
  }
];

export const SAMPLE_DECLARATIONS: IndependenceDeclaration[] = [
  {
    id: 'DEC-01',
    partnerOrStaffName: 'CA Gunjan Jain',
    membershipOrRegistrationNo: '049210',
    designation: 'PARTNER',
    declarationType: 'FORM_4_ENGAGEMENT_SPECIFIC',
    clientName: 'Pratwi Solutions Private Limited',
    financialYear: '2025-26',
    noFinancialInterestConfirmed: true,
    noIndebtednessAboveThresholdConfirmed: true,
    noBusinessRelationshipConfirmed: true,
    noRelativeInKeyManagerialPositionConfirmed: true,
    signedDate: '2026-09-02',
    status: 'SUBMITTED_AND_VERIFIED'
  },
  {
    id: 'DEC-02',
    partnerOrStaffName: 'CA Anita Desai',
    membershipOrRegistrationNo: '512901',
    designation: 'AUDIT_MANAGER',
    declarationType: 'FORM_4_ENGAGEMENT_SPECIFIC',
    clientName: 'Pratwi Solutions Private Limited',
    financialYear: '2025-26',
    noFinancialInterestConfirmed: true,
    noIndebtednessAboveThresholdConfirmed: true,
    noBusinessRelationshipConfirmed: true,
    noRelativeInKeyManagerialPositionConfirmed: true,
    signedDate: '2026-09-02',
    status: 'SUBMITTED_AND_VERIFIED'
  },
  {
    id: 'DEC-03',
    partnerOrStaffName: 'Kriti Jain',
    membershipOrRegistrationNo: 'WRO-0612991',
    designation: 'ARTICLE_ASSISTANT',
    declarationType: 'FORM_3_ANNUAL_FIRM',
    financialYear: '2025-26',
    noFinancialInterestConfirmed: true,
    noIndebtednessAboveThresholdConfirmed: true,
    noBusinessRelationshipConfirmed: true,
    noRelativeInKeyManagerialPositionConfirmed: true,
    signedDate: '2026-04-10',
    status: 'SUBMITTED_AND_VERIFIED'
  }
];
