/**
 * Rule 88C (DRC-01B) & Rule 88D (DRC-01C) Reply Engine
 *
 * Statutory Authority:
 * - Rule 88C of CGST Rules (Form GST DRC-01B: GSTR-1 vs GSTR-3B liability difference)
 * - Rule 88D of CGST Rules (Form GST DRC-01C: GSTR-2B vs GSTR-3B ITC excess)
 * - 7-day statutory deadline to pay via DRC-03 or submit Part B explanation
 */

export type DrcIntimationType = "DRC_01B_RULE_88C" | "DRC_01C_RULE_88D";

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

  portalFigure1: number; // GSTR-1 liability (DRC-01B) or GSTR-2B available (DRC-01C)
  portalFigure2: number; // GSTR-3B paid (DRC-01B) or GSTR-3B claimed (DRC-01C)
  varianceAmount: number;
  variancePercentage: number;

  status: "PENDING_REPLY" | "REPLIED_PART_B" | "PAID_DRC_03";
  selectedReasonCode: string;
  factualExplanation: string;
  attachedSupportingDocs: string[];
}

export class Drc01b01cEngine {
  public static readonly DRC_01B_REASONS = [
    { code: "B_01", title: "Excess liability declared in GSTR-1 due to typographical error, amended in subsequent month." },
    { code: "B_02", title: "Excess tax paid in earlier tax periods adjusted in GSTR-3B." },
    { code: "B_03", title: "Supplies cancelled / Credit Note issued in books not reported in GSTR-1 in same period." },
    { code: "B_04", title: "Advance adjusted against invoice in GSTR-3B Table 3.1(d)." },
  ];

  public static readonly DRC_01C_REASONS = [
    { code: "C_01", title: "ITC not availed in earlier tax periods due to non-receipt of invoices/goods (Sec 16(4) compliant)." },
    { code: "C_02", title: "ITC on Import of Goods (ICEGATE Bill of Entry) not auto-populated in GSTR-2B." },
    { code: "C_03", title: "ITC reversed earlier under Rule 37 / 37A now re-claimed in Table 4(A)(5)." },
    { code: "C_04", title: "GSTR-2B cutoff excluded invoices uploaded by QRMP/IFF supplier after 14th." },
  ];

  public static evaluateNoticeUrgency(
    notice: DrcIntimationNotice,
    currentDateStr: string = new Date().toISOString()
  ): {
    daysRemaining: number;
    isUrgent: boolean;
    recoveryRisk: boolean;
  } {
    const deadline = new Date(notice.statutoryDeadlineDate);
    const curr = new Date(currentDateStr);
    if (isNaN(deadline.getTime())) {
      return { daysRemaining: 0, isUrgent: false, recoveryRisk: false };
    }
    const diffMs = deadline.getTime() - curr.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      daysRemaining,
      isUrgent: daysRemaining <= 2 && notice.status === "PENDING_REPLY",
      recoveryRisk: daysRemaining === 0 && notice.status === "PENDING_REPLY",
    };
  }

  public static draftPartBReply(
    notice: DrcIntimationNotice,
    reasonCode: string,
    additionalNotes: string
  ) {
    const reasonsMap =
      notice.intimationType === "DRC_01B_RULE_88C" ? this.DRC_01B_REASONS : this.DRC_01C_REASONS;
    const matched = reasonsMap.find((r) => r.code === reasonCode);
    const reasonText = matched ? matched.title : "Commercial Reconciliation Variance";

    const submission = `TO THE PROPER OFFICER / SUPERINTENDENT OF CENTRAL/STATE GST,
IN RE: FORM GST ${notice.intimationType === "DRC_01B_RULE_88C" ? "DRC-01B" : "DRC-01C"} (ARN: ${notice.arn})

Sir/Madam,
With reference to the intimation issued under ${notice.intimationType === "DRC_01B_RULE_88C" ? "Rule 88C" : "Rule 88D"} of the CGST Rules, 2017 for tax period ${notice.taxPeriod} (${notice.financialYear}), the registered person (${notice.taxpayerName}, GSTIN: ${notice.gstin}) submits as under:

1. STATUTORY GROUND:
${reasonText}

2. QUANTIFICATION:
Portal Figure 1: Rs. ${notice.portalFigure1.toLocaleString("en-IN")}
Portal Figure 2: Rs. ${notice.portalFigure2.toLocaleString("en-IN")}
Differential Variance: Rs. ${notice.varianceAmount.toLocaleString("en-IN")} (${notice.variancePercentage}%)

3. FACTUAL EXPLANATION:
${additionalNotes || "The variance is fully reconciled with audited Books of Accounts and supporting statutory documents."}

WHEREFORE, it is prayed that this Part B explanation may kindly be accepted and proceedings dropped without initiation of recovery u/s 75(12).`;

    return {
      referenceNumber: `PART-B-${notice.arn}`,
      filingTimestamp: new Date().toISOString(),
      reasonSelected: reasonText,
      formalLegalSubmission: submission,
    };
  }
}
