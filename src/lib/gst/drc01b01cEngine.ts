/**
 * Rule 88C (DRC-01B) & Rule 88D (DRC-01C) Auto-Defense & Reply Engine
 * 
 * Statutory Authority:
 * - Rule 88C of CGST Rules (System-generated intimation in Form GST DRC-01B for GSTR-1 vs GSTR-3B liability difference)
 * - Rule 88D of CGST Rules (System-generated intimation in Form GST DRC-01C for GSTR-2B vs GSTR-3B ITC excess)
 * - Mandatory 7-day statutory deadline to pay via DRC-03 or submit Part B explanation
 * - Section 75(12) recovery proceedings if no response is filed within 7 days
 */

export type DrcIntimationType = 'DRC_01B_RULE_88C' | 'DRC_01C_RULE_88D';

export interface DrcIntimationNotice {
  arn: string;
  intimationType: DrcIntimationType;
  financialYear: string;
  taxPeriod: string;
  gstin: string;
  taxpayerName: string;
  dateOfIntimation: string;
  statutoryDeadlineDate: string; // 7 days from intimation
  daysRemaining: number;
  
  // Financial Variance
  portalFigure1: number; // GSTR-1 liability (DRC-01B) or GSTR-2B available (DRC-01C)
  portalFigure2: number; // GSTR-3B paid (DRC-01B) or GSTR-3B claimed (DRC-01C)
  varianceAmount: number;
  variancePercentage: number;
  
  status: 'PENDING_REPLY' | 'REPLIED_PART_B' | 'PAID_DRC_03';
  selectedReasonCode: string;
  factualExplanation: string;
  attachedSupportingDocs: string[];
}

export class Drc01b01cEngine {
  /**
   * Predefined Statutory Reason Codes for DRC-01B Part B Reply
   */
  public static readonly DRC_01B_REASONS = [
    { code: 'B_01', title: 'Excess liability declared in GSTR-1 due to typographical error, amended in subsequent month.' },
    { code: 'B_02', title: 'GSTR-1 filed with correct liability, but excess tax paid in previous tax periods adjusted in GSTR-3B.' },
    { code: 'B_03', title: 'Supplies cancelled / Credit Note issued in books not reported in GSTR-1 in same period.' },
    { code: 'B_04', title: 'Advance adjusted against invoice in GSTR-3B Table 3.1(d).' }
  ];

  /**
   * Predefined Statutory Reason Codes for DRC-01C Part B Reply
   */
  public static readonly DRC_01C_REASONS = [
    { code: 'C_01', title: 'Input tax credit not availed in earlier tax periods due to non-receipt of invoices (Section 16(4) compliant).' },
    { code: 'C_02', title: 'ITC on Import of Goods (Bill of Entry via ICEGATE) not auto-populated in GSTR-2B.' },
    { code: 'C_03', title: 'ITC reversed under Rule 37A in earlier period now re-claimed in Table 4(A)(5) as supplier filed GSTR-3B.' },
    { code: 'C_04', title: 'GSTR-2B generated on 14th did not include invoices filed by supplier in quarterly GSTR-1/IFF.' }
  ];

  /**
   * Evaluates DRC notice urgency and 7-day countdown
   */
  public static evaluateNoticeUrgency(notice: DrcIntimationNotice, currentDateStr: string = new Date().toISOString()): {
    daysRemaining: number;
    isUrgent: boolean;
    recoveryRisk: boolean;
  } {
    const deadline = new Date(notice.statutoryDeadlineDate);
    const curr = new Date(currentDateStr);
    const diffMs = deadline.getTime() - curr.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      daysRemaining,
      isUrgent: daysRemaining <= 2 && notice.status === 'PENDING_REPLY',
      recoveryRisk: daysRemaining === 0 && notice.status === 'PENDING_REPLY'
    };
  }

  /**
   * Drafts Official Part-B Reply to Intimation
   */
  public static draftPartBReply(notice: DrcIntimationNotice, reasonCode: string, additionalNotes: string): {
    referenceNumber: string;
    filingTimestamp: string;
    reasonSelected: string;
    formalLegalSubmission: string;
  } {
    const reasonsMap = notice.intimationType === 'DRC_01B_RULE_88C' 
      ? this.DRC_01B_REASONS 
      : this.DRC_01C_REASONS;
    
    const matched = reasonsMap.find(r => r.code === reasonCode);
    const reasonText = matched ? matched.title : 'Commercial Reconciliation Variance';

    const submission = `TO THE PROPER OFFICER / SUPERINTENDENT OF CENTRAL/STATE GST,
IN RE: FORM GST ${notice.intimationType === 'DRC_01B_RULE_88C' ? 'DRC-01B' : 'DRC-01C'} (ARN: ${notice.arn})

Sir/Madam,
With reference to the intimation issued under ${notice.intimationType === 'DRC_01B_RULE_88C' ? 'Rule 88C' : 'Rule 88D'} of the CGST Rules, 2017 for tax period ${notice.taxPeriod} of FY ${notice.financialYear}, the registered taxpayer (${notice.taxpayerName}, GSTIN: ${notice.gstin}) submits as under:

1. STATUTORY GROUND:
${reasonText}

2. FACTUAL VERIFICATION:
The differential amount of Rs. ${notice.varianceAmount.toLocaleString('en-IN')} has been thoroughly cross-verified against our audited Books of Accounts, purchase registers, and customs ICEGATE entries. 

3. DETAILED SUBMISSION:
${additionalNotes || 'The variance does not represent any short payment of tax or ineligible credit. All conditions stipulated under Section 16 of the CGST Act have been fully satisfied. The entire transaction is backed by genuine invoices and banking payment proofs.'}

WHEREFORE, it is respectfully prayed that the explanation submitted in Part B may kindly be accepted and proceedings dropped without initiation of recovery under Section 75(12).`;

    return {
      referenceNumber: `PART-B-${notice.arn}`,
      filingTimestamp: new Date().toISOString(),
      reasonSelected: reasonText,
      formalLegalSubmission: submission
    };
  }
}

export const SAMPLE_DRC_NOTICES: DrcIntimationNotice[] = [
  {
    arn: 'ZD231126001928K',
    intimationType: 'DRC_01B_RULE_88C',
    financialYear: 'FY 2025-26',
    taxPeriod: 'September 2026',
    gstin: '23AAACG1234F1Z5',
    taxpayerName: 'Apex Precision Tools Private Limited',
    dateOfIntimation: '2026-11-15',
    statutoryDeadlineDate: '2026-11-22',
    daysRemaining: 2, // 2 days left!
    portalFigure1: 1850000, // GSTR-1
    portalFigure2: 1450000, // GSTR-3B paid
    varianceAmount: 400000,
    variancePercentage: 27.5,
    status: 'PENDING_REPLY',
    selectedReasonCode: 'B_01',
    factualExplanation: 'Typographical error in B2B Table 4A in GSTR-1: Invoice INV/041 entered as ₹8,50,000 instead of ₹4,50,000. Amended in October 2026 GSTR-1 Table 9.',
    attachedSupportingDocs: ['Oct_GSTR1_Table9_Amendment.pdf', 'Tax_Invoice_INV041.pdf']
  },
  {
    arn: 'ZD231126004512P',
    intimationType: 'DRC_01C_RULE_88D',
    financialYear: 'FY 2025-26',
    taxPeriod: 'October 2026',
    gstin: '23AAACG1234F1Z5',
    taxpayerName: 'Apex Precision Tools Private Limited',
    dateOfIntimation: '2026-11-16',
    statutoryDeadlineDate: '2026-11-23',
    daysRemaining: 3,
    portalFigure1: 850000, // GSTR-2B
    portalFigure2: 1200000, // GSTR-3B claimed
    varianceAmount: 350000,
    variancePercentage: 41.1,
    status: 'PENDING_REPLY',
    selectedReasonCode: 'C_02',
    factualExplanation: 'IGST on Import of CNC Machine from Germany paid via Customs ICEGATE Bill of Entry No. 8910241 dated 28-Sep-2026 of ₹3,50,000 not populated in GSTR-2B.',
    attachedSupportingDocs: ['Bill_Of_Entry_8910241.pdf', 'Customs_Challan_Payment.pdf']
  }
];
