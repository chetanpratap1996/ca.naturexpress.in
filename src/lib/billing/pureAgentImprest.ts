/**
 * Brains & Taxes — Rule 33 CGST Pure Agent Imprest Ledger Engine
 * 1000% Statutory Precision under Rule 33 of CGST Rules, 2017
 *
 * Statutory Context:
 * Expenditure or costs incurred by a supplier as a "Pure Agent" of the recipient
 * are strictly EXCLUDED from the value of supply for GST calculation.
 *
 * This engine segregates client statutory advances (MCA fees, Income Tax Challans,
 * TDS deposits, GST payments, Stamp duty) from taxable CA professional fees (SAC 9982),
 * preventing illegal 18% GST exposure on government pass-through fees.
 */

export type ImprestTransactionType =
  | "ADVANCE_RECEIVED"
  | "STATUTORY_DISBURSEMENT"
  | "REFUND_TO_CLIENT";

export type ImprestDisbursementCategory =
  | "MCA_ROC_FEES"
  | "INCOME_TAX_CHALLAN_280"
  | "TDS_CHALLAN_281"
  | "GST_PMT_06_DRC_03"
  | "STAMP_DUTY_REGISTRATION"
  | "TRADEMARK_IP_FILING"
  | "GENERAL_GOVT_CHALLAN";

export interface ImprestTransactionItem {
  id: string;
  entityId: string;
  entityName: string;
  clientPan: string;
  transactionType: ImprestTransactionType;
  category: ImprestDisbursementCategory;
  amount: number;
  date: string;
  description: string;
  // Pure Agent Statutory Audit Proofs
  govtPortalRef?: string; // e.g. "SRN: AA9201948" or "CIN: 0002819"
  challanNumber?: string;
  bsrCode?: string;
  paymentMode: "NET_BANKING_FIRM_ESCROW" | "CORPORATE_CREDIT_CARD" | "NEFT_RTGS" | "CLIENT_DIRECT_DEBIT";
  status: "CONFIRMED" | "PENDING_VERIFICATION" | "CANCELLED";
  articlePreparedBy?: string;
  partnerApprovedBy?: string;
  pureAgentRule33Compliant: boolean;
  receiptAttachmentUrl?: string;
}

export interface ClientImprestSummary {
  entityId: string;
  entityName: string;
  totalAdvancesReceived: number;
  totalDisbursedToGovt: number;
  totalRefunded: number;
  currentAvailableBalance: number;
  isDeficit: boolean;
  requiresTopUp: boolean; // True if balance < ₹5,000 or deficit
  suggestedTopUpAmount: number;
  breakdownByCategory: Record<ImprestDisbursementCategory, number>;
  latestTransactionDate?: string;
  rule33CertificateEligible: boolean;
}

export const STATUTORY_CATEGORY_LABELS: Record<ImprestDisbursementCategory, { label: string; authority: string; badgeColor: string }> = {
  MCA_ROC_FEES: {
    label: "MCA-21 ROC Filing Fees (AOC-4, MGT-7, DIR-3)",
    authority: "Ministry of Corporate Affairs (MCA)",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
  },
  INCOME_TAX_CHALLAN_280: {
    label: "Income Tax Challan 280 (Advance / Self-Assessment)",
    authority: "Central Board of Direct Taxes (CBDT)",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
  },
  TDS_CHALLAN_281: {
    label: "TDS Challan 281 (Corporate Withholding Tax)",
    authority: "Income Tax Department / TRACES",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
  },
  GST_PMT_06_DRC_03: {
    label: "GST Payment PMT-06 / DRC-03 Voluntary Tax",
    authority: "GST Common Portal (GSTN)",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  STAMP_DUTY_REGISTRATION: {
    label: "E-Stamp Duty & ROC Share Capital Stamp",
    authority: "State Revenue Department / Stock Holding",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  TRADEMARK_IP_FILING: {
    label: "Trademark Registry Govt Fee (Form TM-A)",
    authority: "Controller General of Patents & Trademarks",
    badgeColor: "bg-pink-50 text-pink-800 border-pink-200",
  },
  GENERAL_GOVT_CHALLAN: {
    label: "Statutory Regulatory Disallowance Prevention Fee",
    authority: "Government Treasury",
    badgeColor: "bg-slate-50 text-slate-800 border-slate-200",
  },
};

/**
 * Calculates client-level pure agent imprest balance with 1000% accuracy
 */
export function calculateClientImprestSummary(
  entityId: string,
  entityName: string,
  transactions: ImprestTransactionItem[]
): ClientImprestSummary {
  const clientTxns = transactions.filter((t) => t.entityId === entityId && t.status === "CONFIRMED");

  let totalAdvances = 0;
  let totalDisbursed = 0;
  let totalRefunded = 0;

  const breakdown: Record<ImprestDisbursementCategory, number> = {
    MCA_ROC_FEES: 0,
    INCOME_TAX_CHALLAN_280: 0,
    TDS_CHALLAN_281: 0,
    GST_PMT_06_DRC_03: 0,
    STAMP_DUTY_REGISTRATION: 0,
    TRADEMARK_IP_FILING: 0,
    GENERAL_GOVT_CHALLAN: 0,
  };

  clientTxns.forEach((txn) => {
    if (txn.transactionType === "ADVANCE_RECEIVED") {
      totalAdvances += txn.amount;
    } else if (txn.transactionType === "STATUTORY_DISBURSEMENT") {
      totalDisbursed += txn.amount;
      breakdown[txn.category] = (breakdown[txn.category] || 0) + txn.amount;
    } else if (txn.transactionType === "REFUND_TO_CLIENT") {
      totalRefunded += txn.amount;
    }
  });

  const currentAvailableBalance = totalAdvances - totalDisbursed - totalRefunded;
  const isDeficit = currentAvailableBalance < 0;
  const requiresTopUp = currentAvailableBalance < 5000;
  const suggestedTopUpAmount = isDeficit ? Math.abs(currentAvailableBalance) + 25000 : requiresTopUp ? 25000 : 0;

  const latestDate = clientTxns.length > 0
    ? [...clientTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    : undefined;

  return {
    entityId,
    entityName,
    totalAdvancesReceived: totalAdvances,
    totalDisbursedToGovt: totalDisbursed,
    totalRefunded,
    currentAvailableBalance,
    isDeficit,
    requiresTopUp,
    suggestedTopUpAmount,
    breakdownByCategory: breakdown,
    latestTransactionDate: latestDate,
    rule33CertificateEligible: clientTxns.every((t) => t.pureAgentRule33Compliant),
  };
}

/**
 * Generates an ICAI & GST Rule 33 Compliant Pure Agent Statement
 */
export function generateRule33PureAgentCertificate(
  clientName: string,
  clientPan: string,
  summary: ClientImprestSummary,
  firmName: string = "GPA & Co., Chartered Accountants",
  firmGstin: string = "27AAACF2299R1ZG"
): string {
  return `
================================================================================
PURE AGENT COMPLIANCE CERTIFICATE UNDER RULE 33 OF CGST RULES, 2017
================================================================================

ISSUED BY:
${firmName}
Firm GSTIN: ${firmGstin} | Address: Nariman Point, Mumbai, Maharashtra 400021

CERTIFIED TO:
${clientName}
Client PAN: ${clientPan}

PERIOD: Financial Year 2026-27

This is to certify that all amounts recorded under the Statutory Imprest Account
have been disbursed strictly as a "Pure Agent" of ${clientName} in accordance with
Rule 33 of the Central Goods and Services Tax (CGST) Rules, 2017.

STATUTORY CRITERIA SATISFACTION:
1. Authorization: The firm made statutory payments to Government portals (MCA, CBDT,
   GSTN, Treasury) upon specific mandate and contractual authorization of the client.
2. Separate Identification: The disbursements represent actual government fees
   at cost, indicated separately and backed by official Government Challans / CIN numbers.
3. Pass-Through Character: The firm neither held nor intends to hold any title
   or ownership in the government services or registrations procured.
4. Additional Supply: The government disbursements are over and above the professional
   services rendered under SAC 9982.

ACCOUNT SUMMARY:
- Total Pure Agent Advances Received: ₹${summary.totalAdvancesReceived.toLocaleString("en-IN")}
- Total Statutory Disbursements to Govt: ₹${summary.totalDisbursedToGovt.toLocaleString("en-IN")}
- Net Available Imprest Escrow Balance: ₹${summary.currentAvailableBalance.toLocaleString("en-IN")}

CONCLUSION:
In terms of Rule 33 of CGST Rules, 2017, the disbursements of ₹${summary.totalDisbursedToGovt.toLocaleString("en-IN")}
are EXCLUDED from the taxable value of supply and attract 0% Goods and Services Tax.

For ${firmName}
Chartered Accountants (FRN: 024310C)

[Digital Verification Seal - ICAI SA 500 Audit Evidence]
================================================================================
`.trim();
}

/**
 * Prepares WhatsApp Statutory Imprest Top-up Request
 */
export function prepareImprestTopUpWhatsAppMessage(
  clientName: string,
  contactPerson: string,
  summary: ClientImprestSummary,
  firmVpa: string,
  firmName: string = "GPA & Co."
): { text: string; upiUri: string } {
  const amountToAsk = summary.suggestedTopUpAmount || 25000;
  const upiUri = `upi://pay?pa=${encodeURIComponent(firmVpa)}&pn=${encodeURIComponent(firmName)}&am=${amountToAsk.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Imprest Advance - ${clientName.substring(0, 15)}`)}`;

  const text =
    `🏛️ *STATUTORY IMPREST ADVANCE REQUISITION*\n` +
    `*${firmName}, Chartered Accountants*\n\n` +
    `Dear ${contactPerson || "Sir/Madam"},\n` +
    `Re: Pure Agent Statutory Account for *${clientName}*\n\n` +
    `This is regarding government filing fees and statutory taxes payable on your company's behalf.\n\n` +
    `📊 *Current Escrow Position:*\n` +
    `• Available Imprest Balance: *${summary.currentAvailableBalance < 0 ? "-₹" + Math.abs(summary.currentAvailableBalance).toLocaleString("en-IN") + " (DEFICIT)" : "₹" + summary.currentAvailableBalance.toLocaleString("en-IN")}*\n` +
    `• Total Govt Disbursements to Date: ₹${summary.totalDisbursedToGovt.toLocaleString("en-IN")}\n\n` +
    (summary.currentAvailableBalance < 0
      ? `⚠️ *IMMEDIATE ACTION REQUIRED:* The firm has disbursed statutory fees in excess of advances to prevent MCA/ROC late fees and GST penalty interest.\n\n`
      : `To ensure uninterrupted statutory filings (MCA Annual Returns / Advance Tax / GST Challans), kindly replenish your statutory imprest deposit.\n\n`) +
    `💳 *Requisition Amount:* *₹${amountToAsk.toLocaleString("en-IN")}*\n` +
    `*(Pure Agent pass-through under Rule 33 of CGST Rules — 0% GST applies)*\n\n` +
    `📲 *1-Tap Instant UPI Settlement:*\n` +
    `${upiUri}\n\n` +
    `UPI VPA: \`${firmVpa}\`\n\n` +
    `Please share the payment UTR upon transfer so our articles can proceed with the portal filings.\n\n` +
    `Regards,\n*Statutory Billing & Escrow Desk*\n${firmName}`;

  return { text, upiUri };
}

/**
 * Realistic default sandbox Imprest transactions
 */
export const DEFAULT_IMPREST_TRANSACTIONS: ImprestTransactionItem[] = [
  {
    id: "IMP-001",
    entityId: "CLI-001",
    entityName: "Pratwi Solutions Private Limited",
    clientPan: "AABCA8891D",
    transactionType: "ADVANCE_RECEIVED",
    category: "MCA_ROC_FEES",
    amount: 50000,
    date: "2026-10-01",
    description: "Statutory Imprest Advance received for FY 2026-27 MCA filings & Advance Tax",
    paymentMode: "NEFT_RTGS",
    status: "CONFIRMED",
    articlePreparedBy: "Kriti Jain (Article)",
    partnerApprovedBy: "CA Gautam Joshi (Partner)",
    pureAgentRule33Compliant: true,
  },
  {
    id: "IMP-002",
    entityId: "CLI-001",
    entityName: "Pratwi Solutions Private Limited",
    clientPan: "AABCA8891D",
    transactionType: "STATUTORY_DISBURSEMENT",
    category: "MCA_ROC_FEES",
    amount: 14400,
    date: "2026-10-18",
    description: "MCA-21 ROC Normal & Additional Filing Fees for Form AOC-4 & MGT-7",
    govtPortalRef: "SRN: AA92019488",
    challanNumber: "CH-MCA-88192",
    bsrCode: "0291048",
    paymentMode: "NET_BANKING_FIRM_ESCROW",
    status: "CONFIRMED",
    articlePreparedBy: "Kriti Jain (Article)",
    partnerApprovedBy: "CA Gautam Joshi (Partner)",
    pureAgentRule33Compliant: true,
  },
  {
    id: "IMP-003",
    entityId: "CLI-001",
    entityName: "Pratwi Solutions Private Limited",
    clientPan: "AABCA8891D",
    transactionType: "STATUTORY_DISBURSEMENT",
    category: "INCOME_TAX_CHALLAN_280",
    amount: 25000,
    date: "2026-10-22",
    description: "Advance Tax Q2 instalment payment under Challan ITNS 280 (Minor Head 100)",
    govtPortalRef: "CIN: 000281920261022",
    challanNumber: "ITNS-280-9941",
    bsrCode: "0210048",
    paymentMode: "NET_BANKING_FIRM_ESCROW",
    status: "CONFIRMED",
    articlePreparedBy: "Rohan Patel (Article)",
    partnerApprovedBy: "CA Gautam Joshi (Partner)",
    pureAgentRule33Compliant: true,
  },
  {
    id: "IMP-004",
    entityId: "CLI-002",
    entityName: "Pratwi Solutions Private Limited",
    clientPan: "AAKCS8812K",
    transactionType: "ADVANCE_RECEIVED",
    category: "GST_PMT_06_DRC_03",
    amount: 30000,
    date: "2026-09-15",
    description: "Imprest deposit for GST quarterly DRC-03 voluntary payment & DIR-3 KYC fees",
    paymentMode: "NET_BANKING_FIRM_ESCROW",
    status: "CONFIRMED",
    articlePreparedBy: "Kriti Jain (Article)",
    partnerApprovedBy: "CA Gautam Joshi (Partner)",
    pureAgentRule33Compliant: true,
  },
  {
    id: "IMP-005",
    entityId: "CLI-002",
    entityName: "Pratwi Solutions Private Limited",
    clientPan: "AAKCS8812K",
    transactionType: "STATUTORY_DISBURSEMENT",
    category: "MCA_ROC_FEES",
    amount: 15000,
    date: "2026-09-28",
    description: "DIR-3 KYC annual Director verification portal fees for 3 Directors",
    govtPortalRef: "SRN: DIR3-882194",
    challanNumber: "CH-ROC-3312",
    bsrCode: "0291048",
    paymentMode: "CORPORATE_CREDIT_CARD",
    status: "CONFIRMED",
    articlePreparedBy: "Rohan Patel (Article)",
    partnerApprovedBy: "CA Gautam Joshi (Partner)",
    pureAgentRule33Compliant: true,
  },
];
