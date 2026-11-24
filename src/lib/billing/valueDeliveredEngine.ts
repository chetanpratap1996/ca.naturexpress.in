/**
 * Brains & Taxes — "Paisa Bachaya Kitna" Client Value Realization Engine
 * 
 * Specifically designed for Tier-2 Indian SME, Trade, and Manufacturing mindset:
 * Demonstrates mathematically verified tax savings, reconciled ITC, and statutory penalties avoided
 * BEFORE presenting the professional CA fee invoice.
 * 
 * Solves the "CA ne bas 2 min me portal pe button dabaya" invisible labor perception!
 */

import { formatCurrencyINR } from "@/lib/utils";
import { generateNpciUpiDeepLinks, UpiDeepLinks } from "./npciUpiEngine";

export type ValueCategory = 
  | "ITC_RECONCILED" 
  | "PENALTY_SAVED" 
  | "INTEREST_SHIELDED" 
  | "TAX_OPTIMIZATION" 
  | "AUDIT_DEFENSE";

export interface ValueBenefitItem {
  id: string;
  category: ValueCategory;
  title: string;
  description: string;
  statutoryReference: string; // e.g. "Section 16(2) CGST Act", "Section 43B(h)", "Section 50(1)"
  financialBenefitInr: number;
  badgeLabel: string;
}

export interface ClientValueDeliveredSummary {
  id: string;
  clientId: string;
  clientName: string;
  clientPan: string;
  clientGstin?: string;
  clientPhone?: string;
  billingPeriod: string;
  invoiceNo: string;
  invoiceDate: string;
  benefitsList: ValueBenefitItem[];
  
  // Value Calculations
  totalItcReconciledInr: number;
  totalPenaltiesAvoidedInr: number;
  totalInterestShieldedInr: number;
  totalValueDeliveredInr: number; // Sum of all financial protections
  
  // Dual-Ledger Financial Breakup (Sarkari vs CA Fee)
  pureAgentGovtFeesInr: number;     // MCA / GST Challans at cost (Rule 33 Pure Agent: 0% CA Margin, 0% GST, 0% TDS)
  caProfessionalFeeInr: number;     // SAC 9982 Professional Fee
  gstOnProfessionalFeeInr: number;  // 18% GST on CA fee only
  totalCaBillInr: number;           // Professional Fee + GST
  netTotalPayableInr: number;       // Govt Challans + CA Bill
  
  // Realization Metrics
  netClientSavingsInr: number;      // Value Delivered - Total Bill
  roiMultiplier: number;            // Value Delivered / CA Fee
  statutoryNoticeDisclaimer: string;
}

export function computeValueDeliveredSummary(input: {
  clientId: string;
  clientName: string;
  clientPan: string;
  clientGstin?: string;
  clientPhone?: string;
  billingPeriod: string;
  invoiceNo: string;
  invoiceDate: string;
  benefits: ValueBenefitItem[];
  pureAgentGovtFeesInr: number;
  caProfessionalFeeInr: number;
  isInterState?: boolean;
}): ClientValueDeliveredSummary {
  const totalItc = input.benefits
    .filter((b) => b.category === "ITC_RECONCILED")
    .reduce((sum, b) => sum + b.financialBenefitInr, 0);

  const totalPenalties = input.benefits
    .filter((b) => b.category === "PENALTY_SAVED")
    .reduce((sum, b) => sum + b.financialBenefitInr, 0);

  const totalInterest = input.benefits
    .filter((b) => b.category === "INTEREST_SHIELDED" || b.category === "TAX_OPTIMIZATION" || b.category === "AUDIT_DEFENSE")
    .reduce((sum, b) => sum + b.financialBenefitInr, 0);

  const totalValueDelivered = input.benefits.reduce((sum, b) => sum + b.financialBenefitInr, 0);

  // GST 18% on professional fee only (CBDT Circular 23/2017 & GST Rule 33)
  const gstOnFee = Math.round((input.caProfessionalFeeInr * 18) / 100);
  const totalCaBill = input.caProfessionalFeeInr + gstOnFee;
  const netTotalPayable = Math.round(input.pureAgentGovtFeesInr + totalCaBill);
  const netSavings = Math.max(0, totalValueDelivered - netTotalPayable);
  const roiMultiplier = input.caProfessionalFeeInr > 0 
    ? Math.round((totalValueDelivered / input.caProfessionalFeeInr) * 10) / 10 
    : 1.0;

  return {
    id: `VAL-${input.clientId}-${Date.now().toString().slice(-4)}`,
    clientId: input.clientId,
    clientName: input.clientName,
    clientPan: input.clientPan,
    clientGstin: input.clientGstin,
    clientPhone: input.clientPhone,
    billingPeriod: input.billingPeriod,
    invoiceNo: input.invoiceNo,
    invoiceDate: input.invoiceDate,
    benefitsList: input.benefits,
    totalItcReconciledInr: totalItc,
    totalPenaltiesAvoidedInr: totalPenalties,
    totalInterestShieldedInr: totalInterest,
    totalValueDeliveredInr: totalValueDelivered,
    pureAgentGovtFeesInr: input.pureAgentGovtFeesInr,
    caProfessionalFeeInr: input.caProfessionalFeeInr,
    gstOnProfessionalFeeInr: gstOnFee,
    totalCaBillInr: totalCaBill,
    netTotalPayableInr: netTotalPayable,
    netClientSavingsInr: netSavings,
    roiMultiplier,
    statutoryNoticeDisclaimer: "Statutory Pure Agent Note: Out-of-pocket Government portal challans are billed at actuals under GST Rule 33 with zero markup and are exempt from GST and Section 194J TDS deductions. Professional advisory is billed under SAC 9982 with 18% GST."
  };
}

/**
 * Formats an ultra-respectful, value-driven WhatsApp notification tailored for Tier-2 India business owners.
 * Leads with financial peace of mind and exact savings, followed by a 1-tap UPI deep link.
 */
export function generateWhatsAppValueCard(
  summary: ClientValueDeliveredSummary, 
  upiLinks: UpiDeepLinks,
  firmName: string = "Brains & Taxes (GPA & Co., CAs)"
): string {
  const lines: string[] = [
    `🙏 *Namaste ${summary.clientName} ji,*`,
    ``,
    `Your compliance and accounts reconciliation for *${summary.billingPeriod}* has been successfully completed by *${firmName}*.`,
    ``,
    `📊 *PAISA BACHAYA KITNA — VALUE DELIVERED SUMMARY*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ *Input Tax Credit Reconciled:* ₹${summary.totalItcReconciledInr.toLocaleString("en-IN")}`,
    `✅ *Statutory Penalties Avoided:* ₹${summary.totalPenaltiesAvoidedInr.toLocaleString("en-IN")}`,
    `✅ *Interest & Disallowance Shielded:* ₹${summary.totalInterestShieldedInr.toLocaleString("en-IN")}`,
    `💎 *Total Financial Protection:* *₹${summary.totalValueDeliveredInr.toLocaleString("en-IN")}*`,
    `🚀 *Your Net Value ROI:* *${summary.roiMultiplier}x* of professional fee`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📑 *BILLING & SARKARI CHALLAN BREAKUP*`,
    `• 🏛️ *Govt Challan (At Cost, 0% CA Margin):* ₹${summary.pureAgentGovtFeesInr.toLocaleString("en-IN")}`,
    `• ⚖️ *CA Professional Advisory (SAC 9982):* ₹${summary.caProfessionalFeeInr.toLocaleString("en-IN")}`,
    `• 📝 *GST (18% on CA Fee Only):* ₹${summary.gstOnProfessionalFeeInr.toLocaleString("en-IN")}`,
    `💰 *Total Net Amount Payable:* *₹${summary.netTotalPayableInr.toLocaleString("en-IN")}*`,
    ``,
    `📲 *1-TAP INSTANT UPI PAYMENT:*`,
    `Click below to pay directly via PhonePe, GPay, or Paytm:`,
    `${upiLinks.universalUri}`,
    ``,
    `_Or scan the Dynamic QR attached in the client portal. Thank you for your continued trust and partnership!_`
  ];

  return lines.join("\n");
}

/**
 * 4 Production Sample Clients Representing Real Tier-2 Indian Businesses
 */
export const SAMPLE_VALUE_SUMMARIES: ClientValueDeliveredSummary[] = [
  computeValueDeliveredSummary({
    clientId: "CLI-001",
    clientName: "Pratwi Solutions Private Limited",
    clientPan: "AABCA8891D",
    clientGstin: "23AABCA8891D1Z4",
    clientPhone: "9826012345",
    billingPeriod: "October 2026",
    invoiceNo: "INV/2026-27/1024",
    invoiceDate: "2026-11-20",
    pureAgentGovtFeesInr: 3500, // Advance tax challan / MCA filing fee
    caProfessionalFeeInr: 5000,
    benefits: [
      {
        id: "BEN-01",
        category: "ITC_RECONCILED",
        title: "GSTR-2B vs 3B Ineligible ITC Mismatch Rectification",
        description: "Identified and claimed ₹1,42,800 of capital goods ITC omitted in supplier GSTR-1, preventing DRC-01C notice under Rule 88D.",
        statutoryReference: "Section 16(2) CGST Act & Rule 88D",
        financialBenefitInr: 142800,
        badgeLabel: "ITC Protected"
      },
      {
        id: "BEN-02",
        category: "PENALTY_SAVED",
        title: "Statutory Midnight Deadline Protection",
        description: "Filed GSTR-3B 2 days prior to 20th statutory deadline, eliminating late fee liability under Section 47.",
        statutoryReference: "Section 47 of CGST Act",
        financialBenefitInr: 5000,
        badgeLabel: "Late Fee Saved"
      },
      {
        id: "BEN-03",
        category: "TAX_OPTIMIZATION",
        title: "Section 43B(h) MSME Vendor Payment Realignment",
        description: "Audited 14 MSME vendor ledgers and advised timely settlement before 45-day window, preventing permanent income tax disallowance.",
        statutoryReference: "Section 43B(h) Income-tax Act, 1961",
        financialBenefitInr: 45000,
        badgeLabel: "Disallowance Shield"
      }
    ]
  }),

  computeValueDeliveredSummary({
    clientId: "CLI-002",
    clientName: "Pratwi Solutions Private Limited",
    clientPan: "AAKCS8812K",
    clientGstin: "23AAKCS8812K1Z9",
    clientPhone: "9425098765",
    billingPeriod: "Q2 FY 2026-27",
    invoiceNo: "INV/2026-27/1025",
    invoiceDate: "2026-11-18",
    pureAgentGovtFeesInr: 5000, // MCA Director KYC & Annual AOC-4 Challan
    caProfessionalFeeInr: 8500,
    benefits: [
      {
        id: "BEN-04",
        category: "AUDIT_DEFENSE",
        title: "Form 10-IEA Business Dual-Regime Tax Restructuring",
        description: "Modeled corporate tax liability under Section 115BAA vs normal provisions, optimizing MAT credit utilization.",
        statutoryReference: "Section 115BAA / Section 115JB",
        financialBenefitInr: 185000,
        badgeLabel: "Tax Optimization"
      },
      {
        id: "BEN-05",
        category: "PENALTY_SAVED",
        title: "ROC AOC-4 & MGT-7 Timely Pre-Scrutiny Filing",
        description: "Filed annual MCA returns prior to 30-day cutoff, avoiding ₹100/day per-day late fees on corporate directors.",
        statutoryReference: "Section 137 & 403 Companies Act, 2013",
        financialBenefitInr: 12000,
        badgeLabel: "MCA Penalty Saved"
      }
    ]
  }),

  computeValueDeliveredSummary({
    clientId: "CLI-003",
    clientName: "Kuber Logistics & Heavy Transport",
    clientPan: "AABCK4490L",
    clientGstin: "23AABCK4490L1ZO",
    clientPhone: "9893054321",
    billingPeriod: "October 2026",
    invoiceNo: "INV/2026-27/1026",
    invoiceDate: "2026-11-15",
    pureAgentGovtFeesInr: 1000,
    caProfessionalFeeInr: 3500,
    benefits: [
      {
        id: "BEN-06",
        category: "INTEREST_SHIELDED",
        title: "Section 194C Sub-Contractor Declaration Audit",
        description: "Verified 28 truck-owner Form 194C(6) PAN declarations, shielding client from 30% tax disallowance under Section 40(a)(ia).",
        statutoryReference: "Section 194C(6) & Section 40(a)(ia)",
        financialBenefitInr: 96000,
        badgeLabel: "TDS Shield"
      },
      {
        id: "BEN-07",
        category: "PENALTY_SAVED",
        title: "Timely TDS Challan 281 & Return 26Q Deposit",
        description: "Deposited monthly withholding tax by 7th statutory date, avoiding mandatory ₹200/day fee under Section 234E.",
        statutoryReference: "Section 234E Income-tax Act",
        financialBenefitInr: 4000,
        badgeLabel: "234E Fee Avoided"
      }
    ]
  }),

  computeValueDeliveredSummary({
    clientId: "CLI-004",
    clientName: "Maheshwari Textiles Wholesale",
    clientPan: "AAEFM7710R",
    clientGstin: "23AAEFM7710R1Z2",
    clientPhone: "9827011223",
    billingPeriod: "October 2026",
    invoiceNo: "INV/2026-27/1027",
    invoiceDate: "2026-11-19",
    pureAgentGovtFeesInr: 0,
    caProfessionalFeeInr: 2500,
    benefits: [
      {
        id: "BEN-08",
        category: "ITC_RECONCILED",
        title: "Textile Inverted Duty Structure ITC Reconciliation",
        description: "Reconciled fabric purchase invoices against GSTR-2B, ensuring ₹84,500 of inverted duty input tax was correctly captured.",
        statutoryReference: "Section 54(3) Inverted Duty Structure",
        financialBenefitInr: 84500,
        badgeLabel: "ITC Recovered"
      },
      {
        id: "BEN-09",
        category: "PENALTY_SAVED",
        title: "E-Way Bill Expiry & Penalty Mitigation",
        description: "Reconciled transit invoices and verified Part B compliance, eliminating potential 200% penalty under Section 129.",
        statutoryReference: "Section 129 CGST Act",
        financialBenefitInr: 25000,
        badgeLabel: "Sec 129 Shield"
      }
    ]
  })
];
