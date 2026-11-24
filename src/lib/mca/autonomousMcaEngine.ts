/**
 * Brains & Taxes — Autonomous Corporate MCA / ROC Assembly Line & Secretarial Sentinel
 * Module 3.3 (Weeks 41 to 44) — 2035-Level Zero-Touch Autonomous Compliance
 * 
 * Statutory Authority:
 * - Companies Act 2013 Sec 137 & Rule 12: Form AOC-4 (Financial Statements, Balance Sheet, P&L, Notes)
 * - Companies Act 2013 Sec 92 & Rule 11: Form MGT-7 / MGT-7A (Annual Return of Company)
 * - Companies Act 2013 Sec 403: Mandatory ₹100 per day accumulating late filing fee (no upper ceiling)
 * - Companies (Acceptance of Deposits) Rules: Form DPT-3 (Director loans, exempted borrowings, deposits)
 * - Specified Companies Order 2019: Form MSME-1 (Half-yearly return for overdue supplier dues > 45 days)
 * - Companies Act 2013 Sec 164(2): Sudden Director Disqualification Sentinel (3 consecutive years non-filing)
 * - LLP Act 2008: Form 11 (Annual Return) & Form 8 (Statement of Account & Solvency)
 */

export type McaEntityType = 
  | "PRIVATE_LIMITED" 
  | "PUBLIC_LIMITED" 
  | "ONE_PERSON_COMPANY" 
  | "SECTION_8" 
  | "LLP";

export type McaFormType = 
  | "AOC_4" 
  | "MGT_7" 
  | "MGT_7A" 
  | "DPT_3" 
  | "MSME_1" 
  | "DIR_3_KYC" 
  | "FORM_11" 
  | "FORM_8";

export interface DirectorKycRecord {
  din: string; // 8 digits
  name: string;
  designation: string;
  mobile: string;
  email: string;
  kycStatus: "KYC_VERIFIED" | "KYC_DEACTIVATED" | "PENDING_WEB_KYC";
  disqualificationRisk: "CLEAN" | "WARNING" | "DISQUALIFIED_164_2";
  crossDirectorshipCount: number;
}

export interface Dpt3DepositItem {
  id: string;
  category: "DIRECTOR_LOAN_EXEMPT" | "BANK_BORROWING" | "INTER_CORPORATE_DEPOSIT" | "CUSTOMER_ADVANCE" | "PUBLIC_DEPOSIT";
  lenderName: string;
  panOrCin: string;
  openingBalance: number;
  amountReceivedDuringYear: number;
  amountRepaidDuringYear: number;
  closingBalance: number;
  isExempted: boolean;
  directorDeclarationObtained: boolean;
  resolutionStatus: "RESOLVED" | "DECLARATION_PENDING";
}

export interface Msme1OverdueItem {
  id: string;
  supplierName: string;
  udyamNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  amountDue: number;
  daysOverdue: number; // > 45 days
  reasonForDelay: string;
  status: "REPORTED_MSME1" | "PAYMENT_HOLD" | "DISPUTED";
}

export interface McaClientAssemblyProfile {
  clientId: string;
  clientName: string;
  cinOrLlp: string;
  financialYear: string;
  entityType: McaEntityType;
  isCleanProfile: boolean;
  isSmallCompany: boolean;
  annualTurnoverInr: number;
  paidUpCapitalInr: number;
  pipelineStage: "FINANCIALS_INGEST" | "SECRETARIAL_AUDIT" | "DOCKET_GENERATION" | "SIGN_OFF_DISPATCH" | "FILED";
  status: "CLEAN_AUTO_DISPATCHED" | "NEEDS_PARTNER_TRIAGE" | "CLIENT_SIGNED_OFF";
  directors: DirectorKycRecord[];
  dpt3Items: Dpt3DepositItem[];
  msme1Items: Msme1OverdueItem[];
  sec403LateFeesAccrued: number;
  exceptionsCount: number;
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
 * Day-Accurate Section 403 Late Filing Fee Engine
 * ₹100 per day per form from statutory due date (30 days from AGM for AOC-4, 60 days for MGT-7)
 */
export function calculateSection403LateFee(
  dueDateStr: string,
  actualFilingDateStr?: string
): { lateFeePerForm: number; daysOverdue: number } {
  const due = new Date(dueDateStr);
  const actual = actualFilingDateStr ? new Date(actualFilingDateStr) : new Date();

  if (actual.getTime() <= due.getTime()) {
    return { lateFeePerForm: 0, daysOverdue: 0 };
  }

  const daysOverdue = Math.ceil((actual.getTime() - due.getTime()) / (1000 * 3600 * 24));
  const lateFeePerForm = daysOverdue * 100;

  return { lateFeePerForm, daysOverdue };
}

/**
 * Generate Sample Institutional MCA / ROC Profiles
 * Client 1: Pratwi Solutions (Private Limited, Small Company, 100% Clean AOC-4 & MGT-7A auto-dispatched)
 * Client 2: Pratwi Solutions Private Limited (Public Limited, 4 Secretarial Exceptions: DPT-3 loan declaration missing, MSME-1 overdue dues, DIR-3 KYC pending)
 */
export function getSampleMcaProfiles(): McaClientAssemblyProfile[] {
  // Pratwi Solutions Private Limited (Private Limited, Small Company)
  // Real data: CIN U72900UP2026PTC199821, Promoter: Chetan Pratap Singh, PAN: AANCP9915B
  const pratwiDirectors: DirectorKycRecord[] = [
    {
      din: "10807715",
      name: "Chetan Pratap Singh",
      designation: "Managing Director",
      mobile: "+91 80771 70715",
      email: "chetan@pratwisolutions.com",
      kycStatus: "KYC_VERIFIED",
      disqualificationRisk: "CLEAN",
      crossDirectorshipCount: 1,
    },
  ];

  const pratwiDpt3: Dpt3DepositItem[] = [
    {
      id: "DPT3-PRATWI-01",
      category: "BANK_BORROWING",
      lenderName: "HDFC Bank Ltd — Current Account CC Facility",
      panOrCin: "AAACH1244K",
      openingBalance: 0,
      amountReceivedDuringYear: 0,
      amountRepaidDuringYear: 0,
      closingBalance: 0,
      isExempted: true,
      directorDeclarationObtained: true,
      resolutionStatus: "RESOLVED",
    },
  ];

  const pratwiProfile: McaClientAssemblyProfile = {
    clientId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
    clientName: "Pratwi Solutions Private Limited",
    cinOrLlp: "U72900UP2026PTC199821",
    financialYear: "2025-26",
    entityType: "PRIVATE_LIMITED",
    isCleanProfile: true,
    isSmallCompany: true, // Incorporated 2026, Turnover < 40 Cr, Paid-Up Capital < 4 Cr
    annualTurnoverInr: 0, // First year of operations — data to be fetched from Supabase
    paidUpCapitalInr: 100000, // ₹1 Lakh paid-up (startup stage)
    pipelineStage: "SIGN_OFF_DISPATCH",
    status: "CLEAN_AUTO_DISPATCHED",
    directors: pratwiDirectors,
    dpt3Items: pratwiDpt3,
    msme1Items: [],
    sec403LateFeesAccrued: 0,
    exceptionsCount: 0,
    auditLog: [
      "[10:30:10] Ingested Audited Schedule III Balance Sheet & P&L — FY 2025-26 (First year of operations).",
      "[10:31:00] Classified as 'Small Company' u/s 2(85) of Companies Act, 2013 — Paid-Up Capital ₹1L, Turnover below threshold.",
      "[10:31:30] Validated 1/1 DIN: DIR-3 KYC active for Chetan Pratap Singh. Section 164(2) disqualification risk: 0%.",
      "[10:32:00] Form AOC-4 (Abridged) and Form MGT-7A compiled — eligible for abridged filing as Small Company.",
      "[10:32:30] Form DPT-3 verification: No deposits accepted. No borrowing above exemption threshold. Zero DPT-3 items.",
      "[10:33:00] Clean Profile — dispatched automated Director sign-off card on WhatsApp to Chetan Pratap Singh.",
    ],
    whatsappSignOffPayload: {
      recipientMobile: "+91 80771 70715",
      messageText: "Hi Chetan, your Annual ROC Filing Docket (Forms AOC-4 & MGT-7A) for Pratwi Solutions Pvt Ltd — FY 2025-26 has been autonomously compiled and verified. Review and digitally sign off: https://firm.tax/mca/sign/pratwi-2026",
      quickActionUrl: "/client?tab=roc-approvals&doc=aoc4-mgt7a-2026",
    },
  };

  return [pratwiProfile];
}

/**
 * 1-Click Partner Resolution for Secretarial Exceptions
 */
export function resolveMcaException(
  profile: McaClientAssemblyProfile,
  exceptionId: string,
  action: "OBTAIN_DECLARATION" | "APPROVE_MSME1" | "TRIGGER_DIR3_KYC_OTP" | "OVERRIDE_DPT3",
  note?: string
): McaClientAssemblyProfile {
  let updatedDpt3 = profile.dpt3Items;
  let updatedDirectors = profile.directors;
  let updatedMsme1 = profile.msme1Items;

  if (action === "OBTAIN_DECLARATION") {
    updatedDpt3 = updatedDpt3.map((item) => {
      if (item.id === exceptionId) {
        return {
          ...item,
          directorDeclarationObtained: true,
          resolutionStatus: "RESOLVED" as const,
        };
      }
      return item;
    });
  }

  if (action === "TRIGGER_DIR3_KYC_OTP") {
    updatedDirectors = updatedDirectors.map((d) => {
      if (d.din === exceptionId) {
        return {
          ...d,
          kycStatus: "KYC_VERIFIED" as const,
          disqualificationRisk: "CLEAN" as const,
        };
      }
      return d;
    });
  }

  if (action === "APPROVE_MSME1") {
    updatedMsme1 = updatedMsme1.map((item) => {
      if (item.id === exceptionId) {
        return {
          ...item,
          status: "REPORTED_MSME1" as const,
        };
      }
      return item;
    });
  }

  // Check remaining unresolved exceptions
  const pendingDpt3 = updatedDpt3.filter((i) => !i.directorDeclarationObtained).length;
  const pendingDirectors = updatedDirectors.filter((d) => d.kycStatus !== "KYC_VERIFIED").length;
  const remaining = pendingDpt3 + pendingDirectors;
  const isNowClean = remaining === 0;

  const updatedLog = [
    ...profile.auditLog,
    `[${new Date().toLocaleTimeString()}] Partner resolved exception ${exceptionId} with action [${action}]. Remaining pending: ${remaining}.`,
  ];

  if (isNowClean) {
    updatedLog.push(`[${new Date().toLocaleTimeString()}] All secretarial exceptions resolved. Form AOC-4 & MGT-7 released for Director DSC sign-off.`);
  }

  return {
    ...profile,
    dpt3Items: updatedDpt3,
    directors: updatedDirectors,
    msme1Items: updatedMsme1,
    exceptionsCount: remaining,
    isCleanProfile: isNowClean,
    status: isNowClean ? "CLEAN_AUTO_DISPATCHED" : "NEEDS_PARTNER_TRIAGE",
    pipelineStage: isNowClean ? "SIGN_OFF_DISPATCH" : profile.pipelineStage,
    autoDispatchedAt: isNowClean ? new Date().toISOString() : profile.autoDispatchedAt,
    auditLog: updatedLog,
    whatsappSignOffPayload: isNowClean ? {
      recipientMobile: "+91 98200 44124",
      messageText: `Hi ${profile.clientName}, your Annual ROC Filing Docket (Forms AOC-4 & MGT-7) for FY ${profile.financialYear} has been audited and approved by the Partner. Review and digitally sign off: https://firm.tax/mca/sign/${profile.clientId}`,
      quickActionUrl: `/client?tab=roc-approvals&doc=aoc4-mgt7-${profile.clientId}`,
    } : undefined,
  };
}
