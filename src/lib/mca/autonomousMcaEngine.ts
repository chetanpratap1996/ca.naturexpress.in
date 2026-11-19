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
 * Client 2: Apex Heavy Engineering Ltd (Public Limited, 4 Secretarial Exceptions: DPT-3 loan declaration missing, MSME-1 overdue dues, DIR-3 KYC pending)
 */
export function getSampleMcaProfiles(): McaClientAssemblyProfile[] {
  // 1. Pratwi Solutions Private Limited (Clean Private Limited Company)
  const pratwiDirectors: DirectorKycRecord[] = [
    {
      din: "08412490",
      name: "Chetan Sharma",
      designation: "Managing Director",
      mobile: "+91 98201 12345",
      email: "chetan@pratwi.com",
      kycStatus: "KYC_VERIFIED",
      disqualificationRisk: "CLEAN",
      crossDirectorshipCount: 2,
    },
    {
      din: "09124482",
      name: "Pooja Sharma",
      designation: "Director",
      mobile: "+91 98201 54321",
      email: "pooja@pratwi.com",
      kycStatus: "KYC_VERIFIED",
      disqualificationRisk: "CLEAN",
      crossDirectorshipCount: 1,
    },
  ];

  const pratwiDpt3: Dpt3DepositItem[] = [
    {
      id: "DPT3-PRATWI-01",
      category: "BANK_BORROWING",
      lenderName: "HDFC Bank Ltd — Cash Credit Facility",
      panOrCin: "AAACH1244K",
      openingBalance: 1200000,
      amountReceivedDuringYear: 500000,
      amountRepaidDuringYear: 300000,
      closingBalance: 1400000,
      isExempted: true,
      directorDeclarationObtained: true,
      resolutionStatus: "RESOLVED",
    },
  ];

  const pratwiProfile: McaClientAssemblyProfile = {
    clientId: "client-pratwi",
    clientName: "Pratwi Solutions Private Limited",
    cinOrLlp: "U72900MH2021PTC354128",
    financialYear: "2025-26",
    entityType: "PRIVATE_LIMITED",
    isCleanProfile: true,
    isSmallCompany: true, // Turnover < 40 Cr, Capital < 4 Cr
    annualTurnoverInr: 32500000,
    paidUpCapitalInr: 1000000,
    pipelineStage: "SIGN_OFF_DISPATCH",
    status: "CLEAN_AUTO_DISPATCHED",
    directors: pratwiDirectors,
    dpt3Items: pratwiDpt3,
    msme1Items: [],
    sec403LateFeesAccrued: 0,
    exceptionsCount: 0,
    auditLog: [
      "[10:30:10] Ingested Audited Schedule III Balance Sheet & P&L from Module 2.4.",
      "[10:31:00] Classified as 'Small Company' u/s 2(85) of Companies Act, 2013.",
      "[10:31:30] Validated 2/2 DINs: DIR-3 KYC active, Section 164(2) disqualification risk 0%.",
      "[10:32:00] Form AOC-4 and Form MGT-7A compiled with zero balance discrepancies.",
      "[10:32:30] Form DPT-3 loan verification: HDFC Bank CC limit categorized as exempted borrowing.",
      "[10:33:00] Clean Profile detected. Dispatched automated Director sign-off card on WhatsApp.",
    ],
    whatsappSignOffPayload: {
      recipientMobile: "+91 98201 12345",
      messageText: "Hi Pratwi Solutions, your Annual ROC Filing Docket (Forms AOC-4 & MGT-7A) for FY 2025-26 has been autonomously compiled and verified against audited financial statements. Review and digitally sign off: https://firm.tax/mca/sign/pratwi-2026",
      quickActionUrl: "/client?tab=roc-approvals&doc=aoc4-mgt7a-2026",
    },
  };

  // 2. Apex Heavy Engineering Ltd (Public Limited, 4 Exceptions in Triage Desk)
  const apexDirectors: DirectorKycRecord[] = [
    {
      din: "02199412",
      name: "Rajendra Mittal",
      designation: "Managing Director",
      mobile: "+91 98200 44124",
      email: "rmittal@apexheavy.com",
      kycStatus: "KYC_VERIFIED",
      disqualificationRisk: "CLEAN",
      crossDirectorshipCount: 5,
    },
    {
      din: "03144890",
      name: "Vikramaditya Roy",
      designation: "Independent Director",
      mobile: "+91 98200 88912",
      email: "vroy@apexheavy.com",
      kycStatus: "PENDING_WEB_KYC", // Pending Web KYC!
      disqualificationRisk: "WARNING",
      crossDirectorshipCount: 3,
    },
  ];

  const apexDpt3: Dpt3DepositItem[] = [
    {
      id: "DPT3-APEX-01",
      category: "DIRECTOR_LOAN_EXEMPT",
      lenderName: "Rajendra Mittal (Director Loan)",
      panOrCin: "AAAPM1244R",
      openingBalance: 4500000,
      amountReceivedDuringYear: 2000000,
      amountRepaidDuringYear: 1000000,
      closingBalance: 5500000,
      isExempted: true,
      directorDeclarationObtained: false, // Declaration pending!
      resolutionStatus: "DECLARATION_PENDING",
    },
    {
      id: "DPT3-APEX-02",
      category: "INTER_CORPORATE_DEPOSIT",
      lenderName: "Apex Infra Holdings Pvt Ltd",
      panOrCin: "U65990MH2018PTC312480",
      openingBalance: 12000000,
      amountReceivedDuringYear: 3000000,
      amountRepaidDuringYear: 0,
      closingBalance: 15000000,
      isExempted: true,
      directorDeclarationObtained: true,
      resolutionStatus: "RESOLVED",
    },
  ];

  const apexMsme1: Msme1OverdueItem[] = [
    {
      id: "MSME1-APEX-01",
      supplierName: "Steel Craft Fabricators Pvt Ltd",
      udyamNumber: "UDYAM-MH-03-0012489",
      invoiceNumber: "SC/26-27/0889",
      invoiceDate: "2026-06-14",
      amountDue: 480000,
      daysOverdue: 78, // Overdue by 78 days (> 45 days)
      reasonForDelay: "Awaiting final quality certification of hydraulic components.",
      status: "REPORTED_MSME1",
    },
    {
      id: "MSME1-APEX-02",
      supplierName: "VK Industrial Paints & Coatings",
      udyamNumber: "UDYAM-MH-03-0044120",
      invoiceNumber: "VK/OCT/112",
      invoiceDate: "2026-07-08",
      amountDue: 125000,
      daysOverdue: 54, // Overdue by 54 days (> 45 days)
      reasonForDelay: "Pending reconciliation of defective batch discount.",
      status: "REPORTED_MSME1",
    },
  ];

  const apexProfile: McaClientAssemblyProfile = {
    clientId: "client-apex",
    clientName: "Apex Heavy Engineering Ltd",
    cinOrLlp: "L28920MH2014PLC258901",
    financialYear: "2025-26",
    entityType: "PUBLIC_LIMITED",
    isCleanProfile: false,
    isSmallCompany: false, // Large Public Company
    annualTurnoverInr: 450000000,
    paidUpCapitalInr: 25000000,
    pipelineStage: "SECRETARIAL_AUDIT",
    status: "NEEDS_PARTNER_TRIAGE",
    directors: apexDirectors,
    dpt3Items: apexDpt3,
    msme1Items: apexMsme1,
    sec403LateFeesAccrued: 2400, // 12 days * ₹100 * 2 forms
    exceptionsCount: 3,
    auditLog: [
      "[09:20:10] Ingested Schedule III Division I audited accounts (Turnover: ₹45 Cr).",
      "[09:21:40] Form DPT-3 loan audit: Flagged ₹55L Director Loan missing Section 73(2) declaration.",
      "[09:22:15] Form MSME-1 scanner: Flagged 2 suppliers with overdue balances exceeding 45 days (₹6.05L).",
      "[09:22:50] DIN Sentinel: Director Vikramaditya Roy DIR-3 Web KYC pending for current fiscal.",
      "[09:23:30] Routed to Secretarial Sentinel & MCA v3 Triage Desk for partner action.",
    ],
  };

  return [pratwiProfile, apexProfile];
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
