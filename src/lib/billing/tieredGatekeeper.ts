import { ClientEntity, InvoiceItem, PayToReleaseConfig } from "@/lib/types";
import { generateNpciDynamicUpiUri, generateUpiQrDataUrl } from "./npciUpiEngine";

export type ClientRelationshipTier = "TIER_A_TRUSTED" | "TIER_B_ADHOC" | "TIER_C_DEFAULTER";
export type GatePolicyAction = "SOFT_NUDGE" | "HARD_LOCK" | "PRE_SERVICE_ADVANCE";

export type DeliverableType = 
  | "BANK_CMA_REPORT" 
  | "INCOME_TAX_SCRUTINY_REPLY" 
  | "FORM_3CD_TAX_AUDIT" 
  | "STATUTORY_BALANCE_SHEET" 
  | "GST_ANNUAL_GSTR9C" 
  | "COMPANY_INCORPORATION_PACK" 
  | "TRANSFER_PRICING_3CEB";

export interface GatekeeperDeliverable {
  id: string;
  entityId: string;
  clientName: string;
  deliverableType: DeliverableType;
  title: string;
  period: string;
  invoiceId: string;
  invoiceNo: string;
  feeAmount: number;
  tdsApplicable: boolean;
  appliedTdsRate: number; // e.g. 10 for 10% TDS u/s 194J
  netPayableAmount: number;
  realUdin: string;
  maskedUdin: string;
  watermarkText: string;
  isLocked: boolean;
  statutoryDeadline?: string;
  urgencyLevel: "CRITICAL" | "HIGH" | "STANDARD";
  summaryPreview: {
    heading: string;
    keyHighlights: string[];
    confidentialNotice: string;
  };
  clientTier: ClientRelationshipTier;
  gatePolicy: GatePolicyAction;
  partnerOverrideUntil?: string | null;
  partnerOverrideBy?: string | null;
  partnerOverrideReason?: string | null;
}

export interface TierEvaluationResult {
  entityId: string;
  clientName: string;
  tier: ClientRelationshipTier;
  recommendedPolicy: GatePolicyAction;
  trustScore: number; // 0 - 100
  relationshipYears: number;
  oldestOverdueDays: number;
  totalArrears: number;
  hasActiveRetainer: boolean;
  rationale: string;
  lihaazFactor: string; // Explains human/relationship dynamic for Tier-2 Indian context
}

/**
 * Evaluates Client Relationship Tier based on payment history, relationship tenure, and engagement nature.
 * Tier A: Trusted Retainers -> Soft-Nudge (Zero locks, honour system, preserve Lihaaz).
 * Tier B: Ad-Hoc / Scrutiny / CMA -> Hard-Lock (Watermarked preview, UDIN masked until UPI clearance).
 * Tier C: Chronic Defaulters (>60d overdue) -> Pre-Service Token Advance Gate.
 */
export function evaluateClientRelationshipTier(
  client: { id: string; name: string; incorporationYear?: number; healthScore?: number },
  clientInvoices: InvoiceItem[] = [],
  config?: Partial<PayToReleaseConfig>
): TierEvaluationResult {
  const currentYear = new Date().getFullYear();
  const relationshipYears = client.incorporationYear ? Math.max(1, currentYear - client.incorporationYear) : 2;
  
  const pendingInvoices = clientInvoices.filter(i => i.status === "PENDING" || i.status === "OVERDUE" || i.status === "UTR_SUBMITTED");
  const totalArrears = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // Calculate oldest overdue days
  let oldestOverdueDays = 0;
  const now = Date.now();
  for (const inv of pendingInvoices) {
    if (inv.dueDate) {
      const dueTime = new Date(inv.dueDate).getTime();
      if (now > dueTime) {
        const days = Math.floor((now - dueTime) / (1000 * 60 * 60 * 24));
        if (days > oldestOverdueDays) oldestOverdueDays = days;
      }
    }
  }

  // Base Trust Score from client health score or computed metrics
  let trustScore = client.healthScore ?? 85;
  if (oldestOverdueDays > 60) trustScore -= 35;
  else if (oldestOverdueDays > 30) trustScore -= 15;
  if (relationshipYears >= 5) trustScore += 10;
  if (pendingInvoices.length === 0) trustScore = Math.max(trustScore, 95);
  trustScore = Math.min(100, Math.max(10, trustScore));

  // Determine Tier
  let tier: ClientRelationshipTier = "TIER_A_TRUSTED";
  let recommendedPolicy: GatePolicyAction = "SOFT_NUDGE";
  let rationale = "";
  let lihaazFactor = "";

  if (oldestOverdueDays > 60 || (totalArrears > 50000 && oldestOverdueDays > 45)) {
    tier = "TIER_C_DEFAULTER";
    recommendedPolicy = "PRE_SERVICE_ADVANCE";
    rationale = `Client has ₹${totalArrears.toLocaleString("en-IN")} unpaid past ${oldestOverdueDays} days. High default risk.`;
    lihaazFactor = "Firm has given repeated verbal grace; friendly requests ignored. Formal commitment advance required before executing new WIP.";
  } else if (
    relationshipYears < 2 || 
    pendingInvoices.some(i => 
      i.serviceCategory === "CMA_REPORT" || 
      i.serviceCategory === "SCRUTINY_REPLY" ||
      i.serviceDescription?.toLowerCase().includes("cma") ||
      i.serviceDescription?.toLowerCase().includes("scrutiny")
    )
  ) {
    tier = "TIER_B_ADHOC";
    recommendedPolicy = "HARD_LOCK";
    rationale = "Ad-hoc, high-stakes legal scrutiny or bank loan deliverable with elevated flight risk after report submission.";
    lihaazFactor = "Professional preview with watermarked executive ratios builds confidence. Final UDIN & statutory stamp unlocked immediately upon UPI clearance.";
  } else {
    tier = "TIER_A_TRUSTED";
    recommendedPolicy = "SOFT_NUDGE";
    rationale = `Established client (${relationshipYears}+ years). Consistent retainer compliance record.`;
    lihaazFactor = "Direct locking damages long-standing partnership ('Lihaaz'). Deliverables unlocked immediately with Courteous Value Statement.";
  }

  return {
    entityId: client.id,
    clientName: client.name,
    tier,
    recommendedPolicy,
    trustScore,
    relationshipYears,
    oldestOverdueDays,
    totalArrears,
    hasActiveRetainer: tier === "TIER_A_TRUSTED",
    rationale,
    lihaazFactor
  };
}

/**
 * Computes Section 194J TDS Settlement (10% standard professional or 2% technical)
 */
export function computeTds194jSettlement(grossAmount: number, tdsRatePct: number = 10): {
  grossAmount: number;
  tdsRatePct: number;
  tdsAmount: number;
  netPayableAmount: number;
  tdsRuleCitation: string;
} {
  const tdsAmount = Math.round(grossAmount * (tdsRatePct / 100));
  const netPayableAmount = Math.max(0, grossAmount - tdsAmount);
  return {
    grossAmount,
    tdsRatePct,
    tdsAmount,
    netPayableAmount,
    tdsRuleCitation: `Deduction u/s 194J of Income Tax Act @ ${tdsRatePct}% on professional technical services. Form 16A certificate to be furnished quarterly.`
  };
}

/**
 * Formats WhatsApp Dispatch for Pay-to-Release tailored to client tier
 */
export function formatTieredGatekeeperWhatsAppMessage(params: {
  clientName: string;
  deliverableTitle: string;
  deliverableType: DeliverableType;
  invoiceNo: string;
  grossAmount: number;
  netAmount: number;
  tier: ClientRelationshipTier;
  upiPaymentLink: string;
  previewUrl: string;
  partnerName?: string;
}): string {
  const { clientName, deliverableTitle, invoiceNo, netAmount, tier, upiPaymentLink, previewUrl, partnerName = "CA Gunjan Jain" } = params;

  if (tier === "TIER_A_TRUSTED") {
    return (
      `*M/s ${clientName}* Ji, Pranam 🙏\n\n` +
      `Your *${deliverableTitle}* has been certified and finalized by ${partnerName}.\n\n` +
      `📁 *Certified Deliverable Status:* UNLOCKED & Ready for Download\n` +
      `📥 *Download Final Copy:* ${previewUrl}\n\n` +
      `📄 *Professional Fee Bill:* ${invoiceNo} (₹${netAmount.toLocaleString("en-IN")})\n` +
      `⚡ *1-Tap Settle via UPI:* ${upiPaymentLink}\n\n` +
      `Thank you for your valued partnership with GPA & Co., Chartered Accountants.`
    );
  }

  if (tier === "TIER_B_ADHOC") {
    return (
      `*M/s ${clientName}*,\n\n` +
      `Your *${deliverableTitle}* has been prepared and vetted by ${partnerName}.\n\n` +
      `🔍 *Draft Preview & Verification Link:*\n${previewUrl}\n` +
      `(Includes executive ratios, compilation summary & statutory verification points)\n\n` +
      `🔒 *Statutory UDIN & Certified Final Copy Release:*\n` +
      `As per firm professional protocol, the unwatermarked final copy with active ICAI UDIN will unlock instantly upon clearance of Invoice *${invoiceNo}* (₹${netAmount.toLocaleString("en-IN")}).\n\n` +
      `⚡ *Pay in 5 Seconds via UPI (Auto-Unlocks Instantly):*\n${upiPaymentLink}\n\n` +
      `GPA & Co., Chartered Accountants`
    );
  }

  // TIER_C_DEFAULTER
  return (
    `*M/s ${clientName}*,\n\n` +
    `Regarding your request for *${deliverableTitle}*:\n\n` +
    `⚠️ Our audit desk notes an outstanding balance of *₹${netAmount.toLocaleString("en-IN")}* past agreed credit terms.\n\n` +
    `To initiate final statutory filing and UDIN sign-off, kindly clear the pending balance or deposit a 50% commitment advance:\n` +
    `⚡ *Instant UPI Settlement Link:* ${upiPaymentLink}\n\n` +
    `For any emergency statutory deadline, please contact ${partnerName} directly.\n\n` +
    `GPA & Co., Chartered Accountants`
  );
}

/**
 * Sample realistic deliverables for Tier-2 Indian CA practice
 */
export const SAMPLE_GATEKEEPER_DELIVERABLES: GatekeeperDeliverable[] = [
  {
    id: "DELIV-CMA-01",
    entityId: "CLI-KUBER-01",
    clientName: "Kuber Logistics Private Limited",
    deliverableType: "BANK_CMA_REPORT",
    title: "Bank CMA Data & Financial Projections (₹2.50 Cr Working Capital CC Limit)",
    period: "FY 2026-27 to FY 2028-29",
    invoiceId: "INV-2026-104",
    invoiceNo: "INV-2026-104",
    feeAmount: 35000,
    tdsApplicable: true,
    appliedTdsRate: 10,
    netPayableAmount: 31500,
    realUdin: "26034912AAAAAA9812",
    maskedUdin: "26034912XXXXXXX (Unlocks on UPI Clearance)",
    watermarkText: "CONFIDENTIAL DRAFT - PENDING PROFESSIONAL CLEARANCE",
    isLocked: true,
    statutoryDeadline: "2026-11-28",
    urgencyLevel: "CRITICAL",
    summaryPreview: {
      heading: "State Bank of India CC Limit Renewal Dossier",
      keyHighlights: [
        "Current Ratio projected at 1.42 (Compliant with Tandon/Chore Committee norms)",
        "DSCR (Debt Service Coverage Ratio) established at 2.15x for term loan tranches",
        "Operating Cycle optimized to 48 days; MPBF (Maximum Permissible Bank Finance) computed at ₹2.48 Cr",
        "Sensitivity analysis under 10% raw material cost inflation tested"
      ],
      confidentialNotice: "This preview document contains proprietary financial modelling. ICAI Certified CMA Report with partner digital signature and UDIN will unlock immediately upon professional fee clearance."
    },
    clientTier: "TIER_B_ADHOC",
    gatePolicy: "HARD_LOCK"
  },
  {
    id: "DELIV-SCRUTINY-01",
    entityId: "CLI-MAHESH-01",
    clientName: "Maheshwari Textiles",
    deliverableType: "INCOME_TAX_SCRUTINY_REPLY",
    title: "Written Legal Submission u/s 142(1) - Unexplained Cash Credit u/s 68 Defence",
    period: "AY 2024-25",
    invoiceId: "INV-2026-108",
    invoiceNo: "INV-2026-108",
    feeAmount: 25000,
    tdsApplicable: false,
    appliedTdsRate: 0,
    netPayableAmount: 25000,
    realUdin: "26034912BBBBBB7711",
    maskedUdin: "26034912XXXXXXX (Unlocks on UPI Clearance)",
    watermarkText: "LEGAL DRAFT - ADVANCE COPY FOR CLIENT REVIEW ONLY",
    isLocked: true,
    statutoryDeadline: "2026-11-26",
    urgencyLevel: "CRITICAL",
    summaryPreview: {
      heading: "Faceless Assessment Unit Defence Dossier",
      keyHighlights: [
        "Nexus established between partner capital additions and agricultural income documentation",
        "Supreme Court citations in Lovely Exports and Steller Investment cited against Section 68 additions",
        "Complete 3-tier bank confirmation vouchers and PAN KYC of depositors indexed in Annexure A-D",
        "Statutory penalty bar invoked citing bona fide commercial explanation"
      ],
      confidentialNotice: "Portal submission draft. Final signed e-filing response ready for ITD upload upon fee clearance."
    },
    clientTier: "TIER_B_ADHOC",
    gatePolicy: "HARD_LOCK"
  },
  {
    id: "DELIV-AUDIT-01",
    entityId: "CLI-APEX-01",
    clientName: "Apex AutoTech Private Limited",
    deliverableType: "FORM_3CD_TAX_AUDIT",
    title: "Tax Audit Report Form 3CA/3CD with Clause 44 & 43B(h) Verification",
    period: "FY 2025-26",
    invoiceId: "INV-2026-089",
    invoiceNo: "INV-2026-089",
    feeAmount: 118000,
    tdsApplicable: true,
    appliedTdsRate: 10,
    netPayableAmount: 106200,
    realUdin: "26034912CCCCCC4422",
    maskedUdin: "26034912CCCCCC4422", // Unlocked for Tier A
    watermarkText: "", // Clean for Tier A
    isLocked: false,
    statutoryDeadline: "2026-10-31",
    urgencyLevel: "STANDARD",
    summaryPreview: {
      heading: "ICAI Compliant Form 3CD Certified Package",
      keyHighlights: [
        "Clause 44 GST expenditure reconciliation signed with 0 unverified variances",
        "Clause 43B(h) MSME verification confirms ₹18.4L payments cleared within 45-day statutory window",
        "Section 40A(2)(b) related party remuneration validated against fair market benchmark",
        "Schedule III Balance Sheet & Profit & Loss audited and certified"
      ],
      confidentialNotice: "Certified final deliverable. Available for immediate download under Tier-A Honour Protocol."
    },
    clientTier: "TIER_A_TRUSTED",
    gatePolicy: "SOFT_NUDGE"
  },
  {
    id: "DELIV-GSTR9C-01",
    entityId: "CLI-BT-01",
    clientName: "Brains & Taxes Private Limited",
    deliverableType: "GST_ANNUAL_GSTR9C",
    title: "GSTR-9 & GSTR-9C Annual GST Reconciliation Statement",
    period: "FY 2024-25",
    invoiceId: "INV-2026-094",
    invoiceNo: "INV-2026-094",
    feeAmount: 45000,
    tdsApplicable: true,
    appliedTdsRate: 10,
    netPayableAmount: 40500,
    realUdin: "26034912DDDDDD1100",
    maskedUdin: "26034912XXXXXXX (Pending Clearance)",
    watermarkText: "PRE-FILING DRAFT - PENDING TOKEN ADVANCE",
    isLocked: true,
    statutoryDeadline: "2026-12-31",
    urgencyLevel: "HIGH",
    summaryPreview: {
      heading: "Table 5 to Table 14 Reconciliation Summary",
      keyHighlights: [
        "ITC claimed in 3B reconciled against GSTR-2B; difference restricted to ₹0",
        "Export turnover under LUT reconciled against ICEGATE shipping bills",
        "RCM liability on director remuneration verified against MCA Form MGT-7",
        "Table 14 additional liability computed at ₹0"
      ],
      confidentialNotice: "Pre-service advance gate active due to previous arrears. Partner override available."
    },
    clientTier: "TIER_C_DEFAULTER",
    gatePolicy: "PRE_SERVICE_ADVANCE"
  }
];
