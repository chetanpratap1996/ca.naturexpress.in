/**
 * Brains & Taxes — Autonomous GST Monthly Assembly Line Engine
 * Module 3.1 (Weeks 29 to 34) — 2035-Level Zero-Touch Autonomous Compliance
 * 
 * Statutory Authority:
 * - CGST Act Sec 16(2)(aa) & Sec 16(2)(c): Mandatory GSTR-2B matching & supplier tax payment verification
 * - CGST Act Sec 17(5): Blocked credits (motor vehicles, personal consumption, food/beverage)
 * - CGST Rules 42 & 43: Pro-rata reversals for exempt and non-business supplies
 * - CGST Rule 88A & Circular No. 98/17/2019-GST: Mandatory statutory order of ITC utilization
 * - CGST Act Sec 47 & 50: Late fees & interest computation on delayed tax payments
 */

export type GstAssemblyPipelineStage = 
  | "WHATSAPP_INGEST"
  | "BANK_OCR"
  | "GSTR2B_MATCH"
  | "GSTR3B_COMPUTATION"
  | "SIGN_OFF_DISPATCH"
  | "FILED";

export type GstAssemblyStatus = 
  | "CLEAN_AUTO_DISPATCHED" 
  | "NEEDS_PARTNER_TRIAGE" 
  | "CLIENT_SIGNED_OFF" 
  | "PENDING_INGESTION";

export type ExceptionCategory = 
  | "MISSING_IN_2B" 
  | "SECTION_17_5_BLOCKED" 
  | "VALUE_OR_RATE_MISMATCH" 
  | "INACTIVE_VENDOR" 
  | "UNMATCHED_BANK_DEBIT";

export interface GstExceptionItem {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorGstin: string;
  vendorName: string;
  taxableAmount: number;
  taxAmount: number;
  exceptionCategory: ExceptionCategory;
  riskScore: number; // 0 to 100
  suggestedAction: string;
  statutoryReference: string;
  status: "PENDING_JUDGMENT" | "RESOLVED_CLAIMED" | "RESOLVED_BLOCKED" | "RESOLVED_HELD" | "RESOLVED_ACCEPTED";
  partnerDecisionNote?: string;
  resolvedAt?: string;
}

export interface Rule88AOffsetResult {
  igstLiabilityRemaining: number;
  cgstLiabilityRemaining: number;
  sgstLiabilityRemaining: number;
  igstCreditRemaining: number;
  cgstCreditRemaining: number;
  sgstCreditRemaining: number;
  igstCreditUsedForIgst: number;
  igstCreditUsedForCgst: number;
  igstCreditUsedForSgst: number;
  cgstCreditUsedForCgst: number;
  cgstCreditUsedForIgst: number;
  sgstCreditUsedForSgst: number;
  sgstCreditUsedForIgst: number;
  netCashPayableIgst: number;
  netCashPayableCgst: number;
  netCashPayableSgst: number;
  totalCashPayable: number;
}

export interface Gstr3bTaxLiability {
  period: string;
  // Table 3.1: Outward supplies & Reverse Charge
  outwardTaxableSupplies: number;
  outwardIgst: number;
  outwardCgst: number;
  outwardSgst: number;
  rcmTaxableSupplies: number;
  rcmIgst: number;
  rcmCgst: number;
  rcmSgst: number;
  totalOutputTax: number;

  // Table 4: Eligible & Ineligible ITC
  totalGrossItcIgst: number;
  totalGrossItcCgst: number;
  totalGrossItcSgst: number;
  rule42ReversalIgst: number;
  rule42ReversalCgst: number;
  rule42ReversalSgst: number;
  ineligible17_5Igst: number;
  ineligible17_5Cgst: number;
  ineligible17_5Sgst: number;
  netEligibleItcIgst: number;
  netEligibleItcCgst: number;
  netEligibleItcSgst: number;

  // Table 6.1: Rule 88A Offset
  offset: Rule88AOffsetResult;

  // Table 5.1: Interest & Late Fees
  section47LateFee: number;
  section50Interest: number;
  totalChallanPayable: number;
}

export interface ClientAssemblyProfile {
  clientId: string;
  clientName: string;
  gstin: string;
  period: string;
  isCleanProfile: boolean;
  matchPercentage: number;
  totalInvoicesCount: number;
  matchedInvoicesCount: number;
  exceptionsCount: number;
  pipelineStage: GstAssemblyPipelineStage;
  status: GstAssemblyStatus;
  computation: Gstr3bTaxLiability;
  exceptions: GstExceptionItem[];
  auditLog: string[];
  autoDispatchedAt?: string;
  clientSignedOffAt?: string;
  whatsappSignOffPayload?: {
    recipientMobile: string;
    messageText: string;
    quickActionUrl: string;
  };
}

/**
 * Execute Circular No. 98/17/2019-GST (Rule 88A) Optimal Credit Offset Algorithm
 * 1. IGST Credit MUST be completely exhausted first against:
 *    a) IGST liability
 *    b) CGST and SGST liability in any order/proportion
 * 2. CGST Credit utilized against:
 *    a) CGST liability
 *    b) Remaining IGST liability (NEVER SGST)
 * 3. SGST Credit utilized against:
 *    a) SGST liability
 *    b) Remaining IGST liability (NEVER CGST)
 * 4. Balance liability must be discharged via Cash Challan (PMT-06).
 */
export function calculateGstr3bRule88AOffset(
  outputIgst: number,
  outputCgst: number,
  outputSgst: number,
  inputIgst: number,
  inputCgst: number,
  inputSgst: number
): Rule88AOffsetResult {
  let remIgstLiab = outputIgst;
  let remCgstLiab = outputCgst;
  let remSgstLiab = outputSgst;

  let remIgstCredit = inputIgst;
  let remCgstCredit = inputCgst;
  let remSgstCredit = inputSgst;

  // Step 1: IGST Credit against IGST Liability
  const igstForIgst = Math.min(remIgstCredit, remIgstLiab);
  remIgstCredit -= igstForIgst;
  remIgstLiab -= igstForIgst;

  // Step 1b: Remaining IGST Credit equally against CGST and SGST
  let igstForCgst = 0;
  let igstForSgst = 0;
  if (remIgstCredit > 0) {
    const halfCredit = remIgstCredit / 2;
    igstForCgst = Math.min(remCgstLiab, halfCredit);
    remIgstCredit -= igstForCgst;
    remCgstLiab -= igstForCgst;

    igstForSgst = Math.min(remSgstLiab, remIgstCredit);
    remIgstCredit -= igstForSgst;
    remSgstLiab -= igstForSgst;

    // If still IGST credit remains and CGST still has liability
    if (remIgstCredit > 0 && remCgstLiab > 0) {
      const extraCgst = Math.min(remCgstLiab, remIgstCredit);
      igstForCgst += extraCgst;
      remIgstCredit -= extraCgst;
      remCgstLiab -= extraCgst;
    }
  }

  // Step 2: CGST Credit against CGST Liability, then IGST
  const cgstForCgst = Math.min(remCgstCredit, remCgstLiab);
  remCgstCredit -= cgstForCgst;
  remCgstLiab -= cgstForCgst;

  const cgstForIgst = Math.min(remCgstCredit, remIgstLiab);
  remCgstCredit -= cgstForIgst;
  remIgstLiab -= cgstForIgst;

  // Step 3: SGST Credit against SGST Liability, then IGST
  const sgstForSgst = Math.min(remSgstCredit, remSgstLiab);
  remSgstCredit -= sgstForSgst;
  remSgstLiab -= sgstForSgst;

  const sgstForIgst = Math.min(remSgstCredit, remIgstLiab);
  remSgstCredit -= sgstForIgst;
  remIgstLiab -= sgstForIgst;

  // Remaining Liability = Net Cash Payable
  const netCashIgst = Math.max(0, remIgstLiab);
  const netCashCgst = Math.max(0, remCgstLiab);
  const netCashSgst = Math.max(0, remSgstLiab);

  return {
    igstLiabilityRemaining: remIgstLiab,
    cgstLiabilityRemaining: remCgstLiab,
    sgstLiabilityRemaining: remSgstLiab,
    igstCreditRemaining: remIgstCredit,
    cgstCreditRemaining: remCgstCredit,
    sgstCreditRemaining: remSgstCredit,
    igstCreditUsedForIgst: igstForIgst,
    igstCreditUsedForCgst: igstForCgst,
    igstCreditUsedForSgst: igstForSgst,
    cgstCreditUsedForCgst: cgstForCgst,
    cgstCreditUsedForIgst: cgstForIgst,
    sgstCreditUsedForSgst: sgstForSgst,
    sgstCreditUsedForIgst: sgstForIgst,
    netCashPayableIgst: netCashIgst,
    netCashPayableCgst: netCashCgst,
    netCashPayableSgst: netCashSgst,
    totalCashPayable: netCashIgst + netCashCgst + netCashSgst,
  };
}

/**
 * Generate Sample Institutional Assembly Profiles
 * Client 1: Pratwi Solutions (100% clean profile -> Zero-Touch auto dispatched)
 * Client 2: Apex Heavy Engineering (Dirty profile -> 5 items routed to Partner Triage)
 */
export function getSampleAssemblyProfiles(): ClientAssemblyProfile[] {
  // 1. Pratwi Solutions Private Limited (Clean profile)
  const pratwiOffset = calculateGstr3bRule88AOffset(
    145000, 220000, 220000, // Outward: IGST 1.45L, CGST 2.20L, SGST 2.20L
    120000, 185000, 185000  // Inward ITC: IGST 1.20L, CGST 1.85L, SGST 1.85L
  );

  const pratwiProfile: ClientAssemblyProfile = {
    clientId: "client-pratwi",
    clientName: "Pratwi Solutions Private Limited",
    gstin: "27AABCP1234F1Z8",
    period: "October 2026",
    isCleanProfile: true,
    matchPercentage: 100,
    totalInvoicesCount: 68,
    matchedInvoicesCount: 68,
    exceptionsCount: 0,
    pipelineStage: "SIGN_OFF_DISPATCH",
    status: "CLEAN_AUTO_DISPATCHED",
    autoDispatchedAt: "2026-11-19T10:14:00Z",
    computation: {
      period: "October 2026",
      outwardTaxableSupplies: 3250000,
      outwardIgst: 145000,
      outwardCgst: 220000,
      outwardSgst: 220000,
      rcmTaxableSupplies: 0,
      rcmIgst: 0,
      rcmCgst: 0,
      rcmSgst: 0,
      totalOutputTax: 585000,
      totalGrossItcIgst: 120000,
      totalGrossItcCgst: 185000,
      totalGrossItcSgst: 185000,
      rule42ReversalIgst: 0,
      rule42ReversalCgst: 0,
      rule42ReversalSgst: 0,
      ineligible17_5Igst: 0,
      ineligible17_5Cgst: 0,
      ineligible17_5Sgst: 0,
      netEligibleItcIgst: 120000,
      netEligibleItcCgst: 185000,
      netEligibleItcSgst: 185000,
      offset: pratwiOffset,
      section47LateFee: 0,
      section50Interest: 0,
      totalChallanPayable: pratwiOffset.totalCashPayable,
    },
    exceptions: [],
    auditLog: [
      "[10:11:02] WhatsApp Ingestion Agent received 68 purchase bills & Oct bank statement.",
      "[10:11:45] Bank OCR engine validated 14 GST vendor payments matching books entries.",
      "[10:12:15] GSTR-2B Multi-Rule matcher ran: 68/68 exact matches (100% matched, ₹0 variance).",
      "[10:12:30] Section 17(5) and Rule 42 scanners reported zero blocked credits.",
      "[10:13:00] GSTR-3B liability generated via Rule 88A offset: Net cash payable ₹95,000.",
      "[10:14:00] Profile classified as 100% CLEAN. Automated Client WhatsApp Sign-off card dispatched.",
    ],
    whatsappSignOffPayload: {
      recipientMobile: "+91 98201 12345",
      messageText: "Hi Pratwi Solutions, your GSTR-3B for October 2026 has been autonomously audited and 100% reconciled against GSTR-2B. Net tax payable: ₹95,000. Review and sign off: https://firm.tax/sign/pratwi-oct-2026",
      quickActionUrl: "/client?tab=gst-approvals&doc=gstr3b-oct-2026",
    },
  };

  // 2. Apex Heavy Engineering Ltd (Dirty profile with 5 exceptions)
  const apexExceptions: GstExceptionItem[] = [
    {
      id: "exc-001",
      clientId: "client-apex",
      clientName: "Apex Heavy Engineering Ltd",
      invoiceNumber: "SC/26-27/0889",
      invoiceDate: "2026-10-14",
      vendorGstin: "27AAACS4412K1Z9",
      vendorName: "Steel Craft Fabricators Pvt Ltd",
      taxableAmount: 480000,
      taxAmount: 86400,
      exceptionCategory: "MISSING_IN_2B",
      riskScore: 92,
      suggestedAction: "Hold payment & issue Section 16(2)(c) WhatsApp recovery notice to vendor.",
      statutoryReference: "Section 16(2)(aa) of CGST Act, 2017",
      status: "PENDING_JUDGMENT",
    },
    {
      id: "exc-002",
      clientId: "client-apex",
      clientName: "Apex Heavy Engineering Ltd",
      invoiceNumber: "UBER/INV/99412",
      invoiceDate: "2026-10-21",
      vendorGstin: "27AABCU1844G1ZM",
      vendorName: "Uber India Technology Pvt Ltd",
      taxableAmount: 18500,
      taxAmount: 3330,
      exceptionCategory: "SECTION_17_5_BLOCKED",
      riskScore: 85,
      suggestedAction: "Block ITC u/s 17(5)(a) and shift to Table 4(D)(1) Ineligible.",
      statutoryReference: "Section 17(5)(b)(i) of CGST Act (Passenger Travel)",
      status: "PENDING_JUDGMENT",
    },
    {
      id: "exc-003",
      clientId: "client-apex",
      clientName: "Apex Heavy Engineering Ltd",
      invoiceNumber: "VK/OCT/112",
      invoiceDate: "2026-10-08",
      vendorGstin: "27AABCV8814F1Z1",
      vendorName: "VK Industrial Paints & Coatings",
      taxableAmount: 125000,
      taxAmount: 22500,
      exceptionCategory: "INACTIVE_VENDOR",
      riskScore: 95,
      suggestedAction: "Vendor GSTIN cancelled on 2026-09-30. Block credit and alert client management.",
      statutoryReference: "Section 16(2)(c) proviso — Cancelled Supplier",
      status: "PENDING_JUDGMENT",
    },
    {
      id: "exc-004",
      clientId: "client-apex",
      clientName: "Apex Heavy Engineering Ltd",
      invoiceNumber: "ELE/2026/512",
      invoiceDate: "2026-10-18",
      vendorGstin: "27AAACE5521L1Z0",
      vendorName: "ElectroTech Power Sub-assemblies",
      taxableAmount: 340000,
      taxAmount: 61200, // Books recorded 18% (₹61,200), 2B shows 12% (₹40,800)
      exceptionCategory: "VALUE_OR_RATE_MISMATCH",
      riskScore: 78,
      suggestedAction: "Rate mismatch: Books recorded 18% (₹61.2k), GSTR-2B shows 12% (₹40.8k).",
      statutoryReference: "Table 4(A)(5) rate divergence",
      status: "PENDING_JUDGMENT",
    },
    {
      id: "exc-005",
      clientId: "client-apex",
      clientName: "Apex Heavy Engineering Ltd",
      invoiceNumber: "BANK-DR-261019",
      invoiceDate: "2026-10-25",
      vendorGstin: "UNKNOWN_GSTIN",
      vendorName: "Unmatched Bank Debit — RTGS Outflow",
      taxableAmount: 150000,
      taxAmount: 27000,
      exceptionCategory: "UNMATCHED_BANK_DEBIT",
      riskScore: 65,
      suggestedAction: "Bank statement debit ₹1,77,000 without matching GST purchase bill.",
      statutoryReference: "Forensic Bank Statement Reconciler",
      status: "PENDING_JUDGMENT",
    },
  ];

  const apexOffset = calculateGstr3bRule88AOffset(
    480000, 310000, 310000, // Output: IGST 4.8L, CGST 3.1L, SGST 3.1L
    320000, 240000, 240000  // Input: IGST 3.2L, CGST 2.4L, SGST 2.4L (provisional before triage)
  );

  const apexProfile: ClientAssemblyProfile = {
    clientId: "client-apex",
    clientName: "Apex Heavy Engineering Ltd",
    gstin: "27AAACA9921E1Z4",
    period: "October 2026",
    isCleanProfile: false,
    matchPercentage: 86.4,
    totalInvoicesCount: 112,
    matchedInvoicesCount: 107,
    exceptionsCount: 5,
    pipelineStage: "GSTR2B_MATCH",
    status: "NEEDS_PARTNER_TRIAGE",
    computation: {
      period: "October 2026",
      outwardTaxableSupplies: 7800000,
      outwardIgst: 480000,
      outwardCgst: 310000,
      outwardSgst: 310000,
      rcmTaxableSupplies: 45000,
      rcmIgst: 8100,
      rcmCgst: 0,
      rcmSgst: 0,
      totalOutputTax: 1108100,
      totalGrossItcIgst: 320000,
      totalGrossItcCgst: 240000,
      totalGrossItcSgst: 240000,
      rule42ReversalIgst: 4200,
      rule42ReversalCgst: 3150,
      rule42ReversalSgst: 3150,
      ineligible17_5Igst: 0,
      ineligible17_5Cgst: 0,
      ineligible17_5Sgst: 0,
      netEligibleItcIgst: 315800,
      netEligibleItcCgst: 236850,
      netEligibleItcSgst: 236850,
      offset: apexOffset,
      section47LateFee: 0,
      section50Interest: 0,
      totalChallanPayable: apexOffset.totalCashPayable,
    },
    exceptions: apexExceptions,
    auditLog: [
      "[09:40:12] WhatsApp Ingestion Agent received 112 purchase bills & bank statements.",
      "[09:42:30] Bank OCR engine validated 48 vendor payments, but flagged 1 unmatched debit.",
      "[09:44:10] GSTR-2B Matcher ran: 107 matched, 5 high-risk exceptions quarantined.",
      "[09:44:35] Profile classified as DIRTY / EXCEPTION RISK. Auto-dispatch halted.",
      "[09:44:40] Routed to Exception-Only Partner Triage Desk for human judgment.",
    ],
  };

  return [pratwiProfile, apexProfile];
}

/**
 * Execute 1-Click Partner Resolution for an Exception Item
 */
export function resolvePartnerException(
  profile: ClientAssemblyProfile,
  exceptionId: string,
  action: "CLAIM" | "BLOCK" | "HOLD" | "ACCEPT",
  partnerNote?: string
): ClientAssemblyProfile {
  const updatedExceptions = profile.exceptions.map((exc) => {
    if (exc.id === exceptionId) {
      let newStatus: GstExceptionItem["status"] = "PENDING_JUDGMENT";
      if (action === "CLAIM") newStatus = "RESOLVED_CLAIMED";
      if (action === "BLOCK") newStatus = "RESOLVED_BLOCKED";
      if (action === "HOLD") newStatus = "RESOLVED_HELD";
      if (action === "ACCEPT") newStatus = "RESOLVED_ACCEPTED";

      return {
        ...exc,
        status: newStatus,
        partnerDecisionNote: partnerNote || `Partner resolution: ${action} applied.`,
        resolvedAt: new Date().toISOString(),
      };
    }
    return exc;
  });

  const remainingPending = updatedExceptions.filter((e) => e.status === "PENDING_JUDGMENT").length;
  const isNowClean = remainingPending === 0;

  const updatedLog = [
    ...profile.auditLog,
    `[${new Date().toLocaleTimeString()}] Partner resolved exception ${exceptionId} with action [${action}]. Remaining pending: ${remainingPending}.`,
  ];

  if (isNowClean) {
    updatedLog.push(`[${new Date().toLocaleTimeString()}] All exceptions resolved by Partner. Assembly line advancing to SIGN_OFF_DISPATCH.`);
  }

  return {
    ...profile,
    exceptions: updatedExceptions,
    exceptionsCount: remainingPending,
    isCleanProfile: isNowClean,
    status: isNowClean ? "CLEAN_AUTO_DISPATCHED" : "NEEDS_PARTNER_TRIAGE",
    pipelineStage: isNowClean ? "SIGN_OFF_DISPATCH" : profile.pipelineStage,
    autoDispatchedAt: isNowClean ? new Date().toISOString() : profile.autoDispatchedAt,
    auditLog: updatedLog,
    whatsappSignOffPayload: isNowClean ? {
      recipientMobile: "+91 98200 88765",
      messageText: `Hi ${profile.clientName}, your GSTR-3B for ${profile.period} has been reviewed and cleared by the Partner. Net tax payable: ₹${profile.computation.offset.totalCashPayable.toLocaleString('en-IN')}. Review and sign off: https://firm.tax/sign/${profile.clientId}`,
      quickActionUrl: `/client?tab=gst-approvals&doc=gstr3b-${profile.clientId}`,
    } : undefined,
  };
}
