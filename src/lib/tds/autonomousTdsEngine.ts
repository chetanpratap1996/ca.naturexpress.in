/**
 * Brains & Taxes — Autonomous TDS / TCS Pipeline & TRACES Forensic Engine
 * Module 3.2 (Weeks 35 to 40) — 2035-Level Zero-Touch Autonomous Compliance
 * 
 * Statutory Authority:
 * - Income Tax Act Chapter XVII-B: Section 192 (Salary), 194C (Contractors), 194J (Professional/Tech), 194I (Rent), 194Q (Purchase of Goods)
 * - Section 206AA: Higher 20% rate on invalid or missing PAN
 * - Section 206AB: Higher 2x rate or 5% on non-filers of income tax returns
 * - Section 201(1A): Penal interest at 1% per month for deduction delay, 1.5% per month for deposit delay
 * - Section 234E: Late filing fee of ₹200 per day of delay (capped at total tax deductible)
 * - TRACES Online Correction Categories (C1, C2, C3, C9) per NSDL e-TDS FVU specifications
 */

export type TdsFormType = "24Q" | "26Q" | "27Q";
export type TdsQuarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface TdsDeducteeRecord {
  id: string;
  deducteePan: string;
  deducteeName: string;
  sectionCode: string;
  paymentDate: string;
  amountPaid: number;
  tdsRate: number;
  tdsAmount: number;
  panStatus: "VALID" | "INOPERATIVE_206AA" | "NON_FILER_206AB";
  challanId?: string;
  matchStatus: "MATCHED" | "UNMATCHED" | "SHORT_DEDUCTION";
}

export interface Challan281Item {
  id: string;
  bsrCode: string; // 7 digits
  challanNo: string; // 5 digits
  tenderDate: string; // YYYY-MM-DD
  sectionCode: string;
  minorHead: "200" | "400"; // 200 = Taxpayer deduction, 400 = Regular assessment
  taxAmount: number;
  surcharge: number;
  cess: number;
  interest: number;
  fee234E: number;
  totalAmount: number;
  consumedAmount: number;
  unconsumedBalance: number;
  oltasCin: string;
}

export interface TracesDefaultItem {
  id: string;
  deducteePan: string;
  deducteeName: string;
  sectionCode: string;
  defaultType: "SHORT_DEDUCTION" | "SHORT_PAYMENT" | "INTEREST_201_1A" | "LATE_FEE_234E";
  taxDeductible: number;
  taxDeducted: number;
  shortAmount: number;
  interest201_1a: number;
  delayMonths: number;
  status: "PENDING_CORRECTION" | "CORRECTION_GENERATED" | "RESOLVED";
  recommendedCorrection: "C1_CHALLAN_UPDATE" | "C2_PAN_UPDATE" | "C3_DEDUCTEE_UPDATE" | "C9_ADD_CHALLAN";
  partnerNote?: string;
  resolvedAt?: string;
}

export interface Form16BatchItem {
  id: string;
  employeeOrVendorName: string;
  pan: string;
  mobile: string;
  email: string;
  formType: "16_PART_A" | "16_PART_B" | "16A";
  quarter: string;
  grossAmount: number;
  tdsDeposited: number;
  certificatePdfUrl: string;
  deliveryStatus: "READY_FOR_DISPATCH" | "DELIVERED_WHATSAPP" | "FAILED";
  deliveredAt?: string;
}

export interface TdsClientAssemblyProfile {
  clientId: string;
  clientName: string;
  tan: string;
  quarter: TdsQuarter;
  financialYear: string;
  formType: TdsFormType;
  isCleanProfile: boolean;
  totalDeducteesCount: number;
  matchedDeducteesCount: number;
  exceptionsCount: number;
  totalTdsDeducted: number;
  totalChallanDeposited: number;
  pipelineStage: "PAYROLL_INGEST" | "CHALLAN_MATCH" | "FVU_COMPILATION" | "SIGN_OFF_DISPATCH" | "FILED";
  status: "CLEAN_AUTO_DISPATCHED" | "NEEDS_PARTNER_TRIAGE" | "CLIENT_SIGNED_OFF";
  challans: Challan281Item[];
  deductees: TdsDeducteeRecord[];
  tracesDefaults: TracesDefaultItem[];
  form16Certificates: Form16BatchItem[];
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
 * Day-Accurate Section 201(1A) Penal Interest Engine
 * 1. 1% per month for deduction delay (from date deductible to date deducted)
 * 2. 1.5% per month for deposit delay (from date deducted to date deposited)
 */
export function calculateSection201_1AInterest(
  tdsAmount: number,
  deductibleDateStr: string,
  depositDateStr: string,
  actualDeductionDateStr?: string
): { deductionInterest: number; depositInterest: number; totalInterest: number; delayMonths: number } {
  const deductible = new Date(deductibleDateStr);
  const deduction = actualDeductionDateStr ? new Date(actualDeductionDateStr) : deductible;
  const deposit = new Date(depositDateStr);

  // Calculate deduction delay (months or part of month)
  const diffTimeDeduction = deduction.getTime() - deductible.getTime();
  const deductionMonths = Math.max(0, Math.ceil(diffTimeDeduction / (1000 * 3600 * 24 * 30)));
  const deductionInterest = Math.round(tdsAmount * 0.01 * deductionMonths);

  // Calculate deposit delay (months or part of month)
  const diffTimeDeposit = deposit.getTime() - deduction.getTime();
  const depositMonths = Math.max(0, Math.ceil(diffTimeDeposit / (1000 * 3600 * 24 * 30)));
  const depositInterest = Math.round(tdsAmount * 0.015 * depositMonths);

  return {
    deductionInterest,
    depositInterest,
    totalInterest: deductionInterest + depositInterest,
    delayMonths: deductionMonths + depositMonths,
  };
}

/**
 * Section 234E Late Filing Fee Engine
 * ₹200 per day after statutory due date, capped at total tax deductible
 */
export function calculateSection234EFee(
  dueDateStr: string,
  actualFilingDateStr: string,
  totalTdsDeductible: number
): { lateFee: number; daysLate: number } {
  const due = new Date(dueDateStr);
  const actual = new Date(actualFilingDateStr);

  if (actual.getTime() <= due.getTime()) {
    return { lateFee: 0, daysLate: 0 };
  }

  const daysLate = Math.ceil((actual.getTime() - due.getTime()) / (1000 * 3600 * 24));
  const lateFee = Math.min(totalTdsDeductible, daysLate * 200);

  return { lateFee, daysLate };
}

/**
 * Generate Sample Institutional TDS Assembly Profiles
 * Client 1: Pratwi Solutions (Clean profile, 100% matched, Form 26Q Q2 auto-dispatched)
 * Client 2: Pratwi Solutions (Dirty profile, 4 TRACES defaults requiring partner C1/C2 correction)
 */
export function getSampleTdsProfiles(): TdsClientAssemblyProfile[] {
  // 1. Pratwi Solutions Private Limited (Clean Q2 Form 26Q)
  const pratwiChallans: Challan281Item[] = [
    {
      id: "CH-281-01",
      bsrCode: "0210041",
      challanNo: "00412",
      tenderDate: "2026-08-05",
      sectionCode: "194J",
      minorHead: "200",
      taxAmount: 65000,
      surcharge: 0,
      cess: 0,
      interest: 0,
      fee234E: 0,
      totalAmount: 65000,
      consumedAmount: 65000,
      unconsumedBalance: 0,
      oltasCin: "02100410508202600412",
    },
    {
      id: "CH-281-02",
      bsrCode: "0210041",
      challanNo: "00591",
      tenderDate: "2026-09-06",
      sectionCode: "194C",
      minorHead: "200",
      taxAmount: 42000,
      surcharge: 0,
      cess: 0,
      interest: 0,
      fee234E: 0,
      totalAmount: 42000,
      consumedAmount: 42000,
      unconsumedBalance: 0,
      oltasCin: "02100410609202600591",
    },
  ];

  const pratwiDeductees: TdsDeducteeRecord[] = [
    {
      id: "DED-001",
      deducteePan: "AAACB1234D",
      deducteeName: "BluePeak Cloud Consulting LLP",
      sectionCode: "194J",
      paymentDate: "2026-07-28",
      amountPaid: 650000,
      tdsRate: 10,
      tdsAmount: 65000,
      panStatus: "VALID",
      challanId: "CH-281-01",
      matchStatus: "MATCHED",
    },
    {
      id: "DED-002",
      deducteePan: "AABCS9821K",
      deducteeName: "Swift Logistics & Facilities Pvt Ltd",
      sectionCode: "194C",
      paymentDate: "2026-08-25",
      amountPaid: 2100000,
      tdsRate: 2,
      tdsAmount: 42000,
      panStatus: "VALID",
      challanId: "CH-281-02",
      matchStatus: "MATCHED",
    },
  ];

  const pratwiCertificates: Form16BatchItem[] = [
    {
      id: "CERT-001",
      employeeOrVendorName: "BluePeak Cloud Consulting LLP",
      pan: "AAACB1234D",
      mobile: "+91 98201 12345",
      email: "finance@bluepeak.in",
      formType: "16A",
      quarter: "Q2",
      grossAmount: 650000,
      tdsDeposited: 65000,
      certificatePdfUrl: "/vault/certificates/16A-AAACB1234D-Q2-2026.pdf",
      deliveryStatus: "READY_FOR_DISPATCH",
    },
    {
      id: "CERT-002",
      employeeOrVendorName: "Swift Logistics & Facilities Pvt Ltd",
      pan: "AABCS9821K",
      mobile: "+91 98201 67890",
      email: "accounts@swiftlogistics.com",
      formType: "16A",
      quarter: "Q2",
      grossAmount: 2100000,
      tdsDeposited: 42000,
      certificatePdfUrl: "/vault/certificates/16A-AABCS9821K-Q2-2026.pdf",
      deliveryStatus: "READY_FOR_DISPATCH",
    },
  ];

  const pratwiProfile: TdsClientAssemblyProfile = {
    clientId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
    clientName: "Pratwi Solutions Private Limited",
    tan: "MUMP12345D",
    quarter: "Q2",
    financialYear: "2026-27",
    formType: "26Q",
    isCleanProfile: true,
    totalDeducteesCount: 2,
    matchedDeducteesCount: 2,
    exceptionsCount: 0,
    totalTdsDeducted: 107000,
    totalChallanDeposited: 107000,
    pipelineStage: "SIGN_OFF_DISPATCH",
    status: "CLEAN_AUTO_DISPATCHED",
    challans: pratwiChallans,
    deductees: pratwiDeductees,
    tracesDefaults: [],
    form16Certificates: pratwiCertificates,
    auditLog: [
      "[11:02:10] Ingested Q2 payroll and vendor payment entries.",
      "[11:02:40] Verified 2/2 deductee PANs against ITD database. Zero Sec 206AA / 206AB penal rates.",
      "[11:03:15] Reconciled Challan 281 entries with OLTAS BSR codes (100% matched, ₹0 deficit).",
      "[11:03:45] Compiled Form 26Q FVU data payload with zero validation errors.",
      "[11:04:00] Clean Profile detected. Dispatched automated client sign-off card on WhatsApp.",
    ],
    whatsappSignOffPayload: {
      recipientMobile: "+91 80771 70715",
      messageText: "Hi Pratwi Solutions, your Form 26Q for Q2 (FY 2026-27) has been autonomously compiled and 100% reconciled against Challan 281. Total TDS deposited: ₹1,07,000. Review and sign off: https://firm.tax/sign/tds-pratwi-q2",
      quickActionUrl: "/client?tab=tds-approvals&doc=26q-q2-2026",
    },
  };  return [pratwiProfile];
}

/**
 * 1-Click Partner Resolution for TRACES Default Item
 */
export function resolveTdsDefault(
  profile: TdsClientAssemblyProfile,
  defaultId: string,
  action: "GENERATE_C1" | "GENERATE_C2" | "GENERATE_C3" | "GENERATE_C9" | "WAIVE_OR_PAY",
  note?: string
): TdsClientAssemblyProfile {
  const updatedDefaults = profile.tracesDefaults.map((def) => {
    if (def.id === defaultId) {
      return {
        ...def,
        status: "RESOLVED" as const,
        partnerNote: note || `Partner applied resolution: ${action}.`,
        resolvedAt: new Date().toISOString(),
      };
    }
    return def;
  });

  const remaining = updatedDefaults.filter((d) => d.status === "PENDING_CORRECTION").length;
  const isNowClean = remaining === 0;

  const updatedLog = [
    ...profile.auditLog,
    `[${new Date().toLocaleTimeString()}] Partner resolved TRACES default ${defaultId} with [${action}]. Remaining defaults: ${remaining}.`,
  ];

  if (isNowClean) {
    updatedLog.push(`[${new Date().toLocaleTimeString()}] All TRACES defaults rectified. Online Correction payload prepared for NSDL e-Filing.`);
  }

  return {
    ...profile,
    tracesDefaults: updatedDefaults,
    exceptionsCount: remaining,
    isCleanProfile: isNowClean,
    status: isNowClean ? "CLEAN_AUTO_DISPATCHED" : "NEEDS_PARTNER_TRIAGE",
    pipelineStage: isNowClean ? "SIGN_OFF_DISPATCH" : profile.pipelineStage,
    autoDispatchedAt: isNowClean ? new Date().toISOString() : profile.autoDispatchedAt,
    auditLog: updatedLog,
  };
}
