import { InvoiceItem, ClientEntity, ComplianceTask } from "@/lib/types";
import { generateNpciDynamicUpiUri, generateUpiQrDataUrl } from "./npciUpiEngine";

export type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type AgreementStatus = "ACTIVE" | "REVISION_RECOMMENDED" | "DRAFT";

export type ScopeCreepCategory = 
  | "GST_NOTICE_DEFENCE" 
  | "BANK_CMA_PROJECTIONS" 
  | "ROC_COMPLIANCE_ADDON" 
  | "TDS_REVISION_CORRECTION" 
  | "VOLUME_BRACKET_OVERAGE" 
  | "SCRUTINY_ASSESSMENT_DOCKET";

export type IncidentStatus = 
  | "DETECTED" 
  | "CONSENT_SENT" 
  | "CLIENT_APPROVED" 
  | "INVOICED" 
  | "WAIVED_BY_PARTNER";

export interface AgreementThresholds {
  maxMonthlyInvoices: number;
  maxAnnualTurnoverCr: number;
  maxBankAccounts: number;
}

export interface AgreementActuals {
  actualMonthlyInvoices: number;
  actualTurnoverCr: number;
  actualBankAccounts: number;
  overagePercentage: number;
}

export interface EngagementAgreement {
  id: string;
  entityId: string;
  clientName: string;
  billingCycle: BillingCycle;
  baseRetainerFee: number; // e.g. 4500
  includedServices: string[];
  thresholds: AgreementThresholds;
  actuals: AgreementActuals;
  status: AgreementStatus;
  startDate: string;
  renewalDate: string;
  suggestedFeeRevision?: number; // e.g. 7000 if volume jumped 200%
  revisionRationale?: string;
}

export interface ScopeCreepIncident {
  id: string;
  entityId: string;
  clientName: string;
  agreementId: string;
  serviceCategory: ScopeCreepCategory;
  detectedVia: "TASK_DISPATCH" | "PORTAL_SYNC_VOLUME" | "NOTICE_DOCKET_UPLOAD" | "WHATSAPP_REQUEST";
  title: string;
  description: string;
  detectedAt: string;
  estimatedHours: number;
  standardIcaiTariff: number; // e.g. 5000
  proposedMicroBillFee: number; // e.g. 3500
  status: IncidentStatus;
  clientApprovalToken: string;
  approvedAt?: string;
  invoicedAt?: string;
  invoiceId?: string;
  waivedReason?: string;
  partnerInCharge?: string;
}

export interface DynamicMicroBill {
  id: string;
  entityId: string;
  clientName: string;
  agreementId: string;
  incidentId: string;
  title: string;
  feeAmount: number;
  gstAmount: number; // 18%
  totalPayable: number;
  upiPaymentLink: string;
  qrDataUrl?: string;
  paymentStatus: "PENDING" | "PAID";
  createdAt: string;
}

/**
 * Computes Volume Overage and recommended retainer revision
 */
export function calculateVolumeOverageBilling(agreement: EngagementAgreement): {
  isOverCapacity: boolean;
  overagePercentage: number;
  recommendedAdjustment: number;
  rationale: string;
} {
  const { thresholds, actuals, baseRetainerFee } = agreement;
  const invoiceOverage = Math.max(0, (actuals.actualMonthlyInvoices - thresholds.maxMonthlyInvoices) / thresholds.maxMonthlyInvoices);
  const turnoverOverage = Math.max(0, (actuals.actualTurnoverCr - thresholds.maxAnnualTurnoverCr) / thresholds.maxAnnualTurnoverCr);
  
  const dominantOverage = Math.max(invoiceOverage, turnoverOverage);
  const overagePercentage = Math.round(dominantOverage * 100);

  if (overagePercentage > 25) {
    // Recommend fair incremental bracket (+30% to +100% depending on tier)
    const multiplier = 1 + Math.min(1.2, dominantOverage * 0.6);
    const recommendedAdjustment = Math.round((baseRetainerFee * multiplier) / 500) * 500;
    
    return {
      isOverCapacity: true,
      overagePercentage,
      recommendedAdjustment,
      rationale: `Actual transaction volume (${actuals.actualMonthlyInvoices} vouchers/mo) exceeds agreed contractual limit (${thresholds.maxMonthlyInvoices}) by ${overagePercentage}%. Retainer revision recommended from ₹${baseRetainerFee.toLocaleString("en-IN")} to ₹${recommendedAdjustment.toLocaleString("en-IN")}/mo.`
    };
  }

  return {
    isOverCapacity: false,
    overagePercentage: 0,
    recommendedAdjustment: baseRetainerFee,
    rationale: "Client volume is within contractual engagement thresholds."
  };
}

/**
 * Formats polite, transparent Hindi/English WhatsApp Micro-Approval card for Indian clients
 */
export function generateMicroApprovalWhatsAppMessage(params: {
  incident: ScopeCreepIncident;
  agreement: EngagementAgreement;
  approvalUrl: string;
  partnerName?: string;
}): string {
  const { incident, agreement, approvalUrl, partnerName = "CA Gunjan Jain" } = params;

  return (
    `*M/s ${incident.clientName}* Ji, Pranam 🙏\n\n` +
    `We have received your request for: *${incident.title}*.\n\n` +
    `📋 *Scope Review (Agreement Ref: ${agreement.id}):*\n` +
    `Your regular monthly retainer (₹${agreement.baseRetainerFee.toLocaleString("en-IN")}/mo) covers recurring statutory filings (${agreement.includedServices.slice(0, 2).join(", ")}).\n\n` +
    `⚡ *Ad-Hoc Add-On Compilation:*\n` +
    `• Service: ${incident.title}\n` +
    `• Standard ICAI Tariff: ₹${incident.standardIcaiTariff.toLocaleString("en-IN")}\n` +
    `• Preferred Partner Fee: *₹${incident.proposedMicroBillFee.toLocaleString("en-IN")} + GST*\n\n` +
    `To authorize our audit desk to prioritize and execute this today, please give your 1-Tap confirmation here:\n` +
    `👉 *Confirm & Initiate:* ${approvalUrl}\n\n` +
    `GPA & Co., Chartered Accountants`
  );
}

/**
 * Sample Initial Engagement Agreements (Anchor Style) for Practice Clients
 */
export const SAMPLE_ENGAGEMENT_AGREEMENTS: EngagementAgreement[] = [
  {
    id: "AGR-PRATWI-2026",
    entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
    clientName: "Pratwi Solutions Private Limited",
    billingCycle: "MONTHLY",
    baseRetainerFee: 4500,
    includedServices: [
      "Monthly GSTR-1 & GSTR-3B Filing",
      "Quarterly Advance Tax Estimation",
      "Quarterly Form 24Q & 26Q TDS Return Filing",
      "Routine ITC Ledger Verification (up to 150 invoices/mo)"
    ],
    thresholds: {
      maxMonthlyInvoices: 150,
      maxAnnualTurnoverCr: 5.0,
      maxBankAccounts: 2
    },
    actuals: {
      actualMonthlyInvoices: 485,
      actualTurnoverCr: 8.6,
      actualBankAccounts: 3,
      overagePercentage: 223
    },
    status: "REVISION_RECOMMENDED",
    startDate: "2024-04-01",
    renewalDate: "2027-03-31",
    suggestedFeeRevision: 7500,
    revisionRationale: "Transaction volume surged by +223% (485 vouchers vs 150 limit). Recommended fee adjustment: ₹7,500/mo."
  },
  {
    id: "AGR-KUBER-2026",
    entityId: "CLI-KUBER-01",
    clientName: "Kuber Logistics Private Limited",
    billingCycle: "MONTHLY",
    baseRetainerFee: 6000,
    includedServices: [
      "GST E-Way Bill Reconciliation & 3B Filing",
      "RCM Inward Freight Verification",
      "Monthly Bank Book Reconciliation (up to 2 accounts)"
    ],
    thresholds: {
      maxMonthlyInvoices: 250,
      maxAnnualTurnoverCr: 8.0,
      maxBankAccounts: 2
    },
    actuals: {
      actualMonthlyInvoices: 260,
      actualTurnoverCr: 7.8,
      actualBankAccounts: 2,
      overagePercentage: 4
    },
    status: "ACTIVE",
    startDate: "2025-04-01",
    renewalDate: "2027-03-31"
  },
  {
    id: "AGR-MAHESH-2026",
    entityId: "CLI-MAHESH-01",
    clientName: "Maheshwari Textiles",
    billingCycle: "QUARTERLY",
    baseRetainerFee: 9000, // ₹3,000/mo equivalent
    includedServices: [
      "Quarterly QRMP Scheme GSTR-1 & 3B",
      "Annual Balance Sheet Compilation",
      "Advance Tax Computations"
    ],
    thresholds: {
      maxMonthlyInvoices: 80,
      maxAnnualTurnoverCr: 2.5,
      maxBankAccounts: 1
    },
    actuals: {
      actualMonthlyInvoices: 75,
      actualTurnoverCr: 2.1,
      actualBankAccounts: 1,
      overagePercentage: 0
    },
    status: "ACTIVE",
    startDate: "2023-04-01",
    renewalDate: "2027-03-31"
  },
  {
    id: "AGR-BT-2026",
    entityId: "CLI-BT-01",
    clientName: "Brains & Taxes Private Limited",
    billingCycle: "MONTHLY",
    baseRetainerFee: 5000,
    includedServices: [
      "Monthly GST Filing & ITC 2B Matching",
      "Monthly Payroll TDS & PT Compliance",
      "ROC Annual Returns MGT-7 & AOC-4"
    ],
    thresholds: {
      maxMonthlyInvoices: 100,
      maxAnnualTurnoverCr: 3.0,
      maxBankAccounts: 2
    },
    actuals: {
      actualMonthlyInvoices: 190,
      actualTurnoverCr: 4.2,
      actualBankAccounts: 2,
      overagePercentage: 90
    },
    status: "REVISION_RECOMMENDED",
    startDate: "2024-04-01",
    renewalDate: "2027-03-31",
    suggestedFeeRevision: 7500,
    revisionRationale: "Invoicing expanded by +90% due to enterprise subscription growth. Fee revision opportunity: ₹7,500/mo."
  }
];

/**
 * Sample Scope Creep Incidents (Out-of-Scope Work Detected by Autonomous Sweep)
 */
export const SAMPLE_SCOPE_CREEP_INCIDENTS: ScopeCreepIncident[] = [
  {
    id: "SCP-2026-001",
    entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
    clientName: "Pratwi Solutions Private Limited",
    agreementId: "AGR-PRATWI-2026",
    serviceCategory: "GST_NOTICE_DEFENCE",
    detectedVia: "NOTICE_DOCKET_UPLOAD",
    title: "GST Form ASMT-10 Input Tax Credit Discrepancy Defense",
    description: "Departmental scrutiny notice u/s 61 alleging ₹3.82 Lakhs GSTR-2B vs 3B difference. Article prepared invoice-by-invoice reconciliation docket.",
    detectedAt: "2026-11-20T10:15:00Z",
    estimatedHours: 5.5,
    standardIcaiTariff: 5000,
    proposedMicroBillFee: 3500,
    status: "DETECTED",
    clientApprovalToken: "tok_pratwi_asmt10_9921",
    partnerInCharge: "CA Gunjan Jain"
  },
  {
    id: "SCP-2026-002",
    entityId: "CLI-KUBER-01",
    clientName: "Kuber Logistics Private Limited",
    agreementId: "AGR-KUBER-2026",
    serviceCategory: "BANK_CMA_PROJECTIONS",
    detectedVia: "TASK_DISPATCH",
    title: "Urgent Bank Stock Statement & Provisional Ratios (SBI CC Limit Renewal)",
    description: "Client requested urgent 48-hour provisional ratio certificate and stock verification sheet for State Bank of India ₹2.5 Cr credit line renewal.",
    detectedAt: "2026-11-21T14:30:00Z",
    estimatedHours: 6.0,
    standardIcaiTariff: 7500,
    proposedMicroBillFee: 5000,
    status: "CONSENT_SENT",
    clientApprovalToken: "tok_kuber_cma_1182",
    partnerInCharge: "CA Gunjan Jain"
  },
  {
    id: "SCP-2026-003",
    entityId: "CLI-MAHESH-01",
    clientName: "Maheshwari Textiles",
    agreementId: "AGR-MAHESH-2026",
    serviceCategory: "ROC_COMPLIANCE_ADDON",
    detectedVia: "TASK_DISPATCH",
    title: "Director Appointment (DIR-12) & Registered Office Change (INC-22)",
    description: "Induction of second partner in business entity and shifting of operational warehouse address with MCA portal filing.",
    detectedAt: "2026-11-19T16:00:00Z",
    estimatedHours: 4.0,
    standardIcaiTariff: 4500,
    proposedMicroBillFee: 3000,
    status: "CLIENT_APPROVED",
    clientApprovalToken: "tok_mahesh_roc_3311",
    approvedAt: "2026-11-20T11:00:00Z",
    partnerInCharge: "CA Gunjan Jain"
  },
  {
    id: "SCP-2026-004",
    entityId: "CLI-BT-01",
    clientName: "Brains & Taxes Private Limited",
    agreementId: "AGR-BT-2026",
    serviceCategory: "TDS_REVISION_CORRECTION",
    detectedVia: "TASK_DISPATCH",
    title: "Form 24Q Quarterly TDS Correction (Section 192 Salary Pan Mismatch)",
    description: "Correcting 3 PAN typographical errors for employees to eliminate TRACES justification report defaults.",
    detectedAt: "2026-11-18T09:30:00Z",
    estimatedHours: 2.5,
    standardIcaiTariff: 2500,
    proposedMicroBillFee: 1800,
    status: "WAIVED_BY_PARTNER",
    clientApprovalToken: "tok_bt_tds_4490",
    waivedReason: "Waived as Relationship Goodwill Courtesy (Logged in Paisa Bachaya Kitna ledger)",
    partnerInCharge: "CA Gunjan Jain"
  }
];

/**
 * Sample Generated Dynamic Micro-Bills
 */
export const SAMPLE_DYNAMIC_MICRO_BILLS: DynamicMicroBill[] = [
  {
    id: "MB-2026-001",
    entityId: "CLI-MAHESH-01",
    clientName: "Maheshwari Textiles",
    agreementId: "AGR-MAHESH-2026",
    incidentId: "SCP-2026-003",
    title: "Add-On: Director Appointment (DIR-12) & INC-22 Filing",
    feeAmount: 3000,
    gstAmount: 540,
    totalPayable: 3540,
    upiPaymentLink: "upi://pay?pa=BRAINSANDTAXES@icici&pn=GPA%20%26%20Co.&am=3540.00&cu=INR&tr=MB-2026-001&tn=AddOn%20ROC%20DIR12",
    paymentStatus: "PENDING",
    createdAt: "2026-11-20T11:05:00Z"
  }
];
