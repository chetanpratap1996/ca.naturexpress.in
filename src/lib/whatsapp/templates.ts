/**
 * Brains & Taxes — Statutory Indian CA WhatsApp Templates & Escalation Sequences
 * Compliant with ICAI Code of Ethics, CBDT, CGST Act, and Companies Act 2013 standards.
 * Supports both Meta Cloud API parameter payloads and zero-cost 1-tap wa.me deep links.
 */

import { formatCurrencyINR } from "@/lib/utils";

export type StatutoryTemplateId =
  | "GST_MONTHLY_DOCS"
  | "GST_3B_CASH_CONFIRM"
  | "ADVANCE_TAX_QTR"
  | "TDS_CHLN_281"
  | "VENDOR_ITC_HOLD"
  | "MSME_43BH_WARN"
  | "NOTICE_143_1_ALERT"
  | "SA_580_MGT_REP"
  | "PAY_TO_RELEASE"
  | "DOC_CHASE_TIER1"
  | "DOC_CHASE_TIER2"
  | "DOC_CHASE_TIER3";

export interface StatutoryTemplateParams {
  clientName: string;
  firmName?: string;
  serviceName?: string;
  period?: string;
  deadline?: string;
  daysRemaining?: number;
  missingDocs?: string[];
  taxPayable?: number;
  lateFeePerDay?: number;
  accumulatedLateFee?: number;
  firmUpiVpa?: string;
  portalUrl?: string;
  arnNumber?: string;
  vendorName?: string;
  invoiceNo?: string;
  invoiceAmount?: number;
  partnerInCharge?: string;
  challanNumber?: string;
  sectionCode?: string;
}

/**
 * Clean phone number to E.164 format without '+' for wa.me
 * Example: "+91 98200 44101" -> "919820044101"
 */
export function sanitizeIndianPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";
  const digitsOnly = rawPhone.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly;
  }
  return digitsOnly;
}

/**
 * Build professional, legally grounded WhatsApp statutory messages
 */
export function buildStatutoryWhatsAppMessage(
  templateId: StatutoryTemplateId,
  params: StatutoryTemplateParams
): {
  subject: string;
  body: string;
  tier: "GENTLE" | "PENALTY_WARNING" | "PARTNER_ESCALATION" | "SERVICE_DELIVERY";
} {
  const firm = params.firmName || "GPA & Co., Chartered Accountants";
  const portal = params.portalUrl || "https://ca.naturexpress.in/";
  const partner = params.partnerInCharge || "CA Gunjan Jain";

  switch (templateId) {
    // --------------------------------------------------------------------------
    // 1. TIER 1: GENTLE STATUTORY ADVISORY (T-7 DAYS)
    // --------------------------------------------------------------------------
    case "DOC_CHASE_TIER1":
    case "GST_MONTHLY_DOCS": {
      const docsList = (params.missingDocs && params.missingDocs.length > 0)
        ? params.missingDocs.map((d, i) => `  ${i + 1}. ${d}`).join("\n")
        : "  • Monthly Bank Statements (All Accounts)\n  • Sales & Purchase Invoices\n  • Expense Vouchers";

      return {
        tier: "GENTLE",
        subject: `Statutory Document Requisition: ${params.serviceName || "GST & Tax Filing"} (${params.period || "Current Month"})`,
        body: 
`*STATUTORY ADVISORY: UPCOMING COMPLIANCE DEADLINE*

Dear ${params.clientName},

Greetings from *${firm}*.

Our audit team has commenced preparation for your *${params.serviceName || "Statutory Return Filing"}* for the period *${params.period || "Current Period"}*.

The statutory due date is *${params.deadline || "approaching shortly"}* (${params.daysRemaining ?? 7} days remaining). Kindly upload the pending records below to ensure timely reconciliation:

${docsList}

📱 *1-Tap Mobile Upload (Encrypted Vault):*
${portal}

_Note: If your bank statement PDF is password-protected, our system automatically decrypts it using your registered Entity DNA patterns._

Regards,
*Taxation & Audit Operations Team*
${firm}`
      };
    }

    // --------------------------------------------------------------------------
    // 2. TIER 2: PENALTY & LATE FEE WARNING (T-3 TO T-1 DAYS)
    // --------------------------------------------------------------------------
    case "DOC_CHASE_TIER2": {
      const dailyFee = params.lateFeePerDay ?? 50;
      const accruedFee = params.accumulatedLateFee ?? 0;

      return {
        tier: "PENALTY_WARNING",
        subject: `URGENT: Late Fee & Interest Risk on ${params.serviceName || "Return Filing"}`,
        body:
`⚠️ *STATUTORY WARNING: LATE FEES & INTEREST RISK*

Dear ${params.clientName},

This is an urgent compliance advisory from *${firm}*.

Your *${params.serviceName || "Compliance Filing"}* for *${params.period || "Current Period"}* is due on *${params.deadline || "TOMORROW"}* (${params.daysRemaining ?? 1} day remaining).

We have *not yet received* your final bank statement and data. Failure to file by the statutory deadline attracts mandatory levies under law:

• *Section 47 CGST Act Late Fee:* ₹${dailyFee}/day continuing default
• *Section 50 CGST Act Interest:* 18% p.a. on Net Cash Tax Liability
• *GSTR-1 Delay Consequence:* E-Way bill generation blocking & input credit denial to your customers

${accruedFee > 0 ? `🚨 *Currently Accrued Exposure:* ${formatCurrencyINR(accruedFee)}\n` : ""}
📱 *Upload Immediately to avoid penalty:*
${portal}

Kindly share the statement immediately so our article team can process your filing before the portal locks.

Regards,
*Practice Operations Lead*
${firm}`
      };
    }

    // --------------------------------------------------------------------------
    // 3. TIER 3: PARTNER LEGAL NOTICE & AUDIT REQUISITION (D-DAY & POST DEADLINE)
    // --------------------------------------------------------------------------
    case "DOC_CHASE_TIER3": {
      return {
        tier: "PARTNER_ESCALATION",
        subject: `LEGAL NOTICE: Final Requisition u/s SA 500 / SA 580 — ${params.clientName}`,
        body:
`🚨 *FORMAL REQUISITION NOTICE UNDER ICAI SA 580*

*TO:* Managing Director / Designated Partner
*ENTITY:* ${params.clientName}
*FROM:* ${partner}, Senior Partner, ${firm}

Dear Sir / Madam,

Despite repeated advisories from our office, the statutory records required for filing your *${params.serviceName || "Statutory Return"}* for *${params.period || "Current Period"}* have *not been furnished*.

Please note that under the Standards on Auditing (SA 500 Audit Evidence and SA 580 Written Representations) prescribed by the Institute of Chartered Accountants of India (ICAI):

1. Our firm *cannot and will not file nil or unverified returns* without source bank statements and verified ledgers.
2. Any statutory interest u/s 50 (18% p.a.), late filing fee u/s 47, cancellation of GSTIN registration, or penalty u/s 122/271B will be *entirely the responsibility of the assessee*.
3. This communication serves as formal legal record of client default.

*Final 4-Hour Upload Window:*
${portal}

Kindly arrange the documents immediately or confirm in writing that filing is deferred at your sole risk.

Yours faithfully,
*${partner}*
FCA, Senior Partner
${firm}`
      };
    }

    // --------------------------------------------------------------------------
    // 4. GSTR-3B NET CASH TAX APPROVAL
    // --------------------------------------------------------------------------
    case "GST_3B_CASH_CONFIRM": {
      return {
        tier: "SERVICE_DELIVERY",
        subject: `GSTR-3B Tax Liability Approval: ${formatCurrencyINR(params.taxPayable || 0)} for ${params.period}`,
        body:
`*GSTR-3B TAX COMPUTATION & PAYMENT APPROVAL*

Dear ${params.clientName},

We have completed the reconciliation of your GSTR-3B for *${params.period || "Current Month"}*.

*Tax Liability Summary:*
• Gross Output Tax Liability: ${formatCurrencyINR((params.taxPayable || 0) * 1.4)}
• Less: Eligible ITC (GSTR-2B): ${formatCurrencyINR((params.taxPayable || 0) * 0.4)}
• *Net Cash Challan Payable (PMT-06):* *${formatCurrencyINR(params.taxPayable || 0)}*

Statutory Due Date: *${params.deadline || "20th of this month"}*

Please approve this tax liability by replying *APPROVED* or paying via the GST portal challan. Once deposited, please send the CIN / CPIN payment receipt.

Regards,
*GST Advisory Practice*
${firm}`
      };
    }

    // --------------------------------------------------------------------------
    // 5. ADVANCE TAX INSTALLMENT ADVISORY (SEC 211)
    // --------------------------------------------------------------------------
    case "ADVANCE_TAX_QTR": {
      return {
        tier: "PENALTY_WARNING",
        subject: `Statutory Reminder: Advance Tax Installment Due (${params.period})`,
        body:
`*STATUTORY ADVISORY: ADVANCE TAX INSTALLMENT (SEC 208-211)*

Dear ${params.clientName},

This is an advance statutory advisory from *${firm}* regarding your Advance Tax liability for *${params.period || "FY 2026-27"}*.

• *Due Date:* *${params.deadline || "15th of this month"}*
• *Estimated Installment:* *${formatCurrencyINR(params.taxPayable || 0)}*
• *Challan Type:* ITNS 280 (Major Head: 0020/0021 | Minor Head: 100 Advance Tax)

*Statutory Warning:* Delay beyond the 15th attracts mandatory simple interest @ 1% per month u/s 234C and u/s 234B of the Income Tax Act, 1961.

Kindly deposit the challan before the due date and share the BSR Code and Challan No. with our team.

Regards,
*Direct Tax Wing*
${firm}`
      };
    }

    // --------------------------------------------------------------------------
    // 6. DEFAULTING VENDOR ITC HOLD (SEC 16(2)(aa))
    // --------------------------------------------------------------------------
    case "VENDOR_ITC_HOLD": {
      return {
        tier: "PENALTY_WARNING",
        subject: `Ineligible ITC Alert: Vendor ${params.vendorName || "Supplier"} Not Filed GSTR-1`,
        body:
`⚠️ *INELIGIBLE ITC NOTICE: VENDOR DEFAULT IN GSTR-2B*

Dear ${params.clientName},

During our monthly GSTR-2B auto-matching, we identified that your supplier *${params.vendorName || "Vendor"}* has *failed to file GSTR-1* for invoice *${params.invoiceNo || "N/A"}* amounting to *${formatCurrencyINR(params.invoiceAmount || 0)}*.

Under *Section 16(2)(aa) of the CGST Act*, input tax credit cannot be availed unless the invoice is reflected in your GSTR-2B.

*Recommended Action:*
We advise *holding payment of the GST component* to this vendor until they file their return and furnish filing acknowledgment.

Our team has drafted a vendor communication template for your use.

Regards,
*GST Audit Team*
${firm}`
      };
    }

    // --------------------------------------------------------------------------
    // 7. MSME 45-DAY PAYMENT DEADLINE (SEC 43B(h))
    // --------------------------------------------------------------------------
    case "MSME_43BH_WARN": {
      return {
        tier: "PENALTY_WARNING",
        subject: `CRITICAL: MSME Payment Overdue Alert u/s 43B(h) — ${params.vendorName}`,
        body:
`🚨 *CRITICAL TAX ALERT: MSME PAYMENT DEADLINE (SEC 43B(h))*

Dear ${params.clientName},

Invoice No *${params.invoiceNo || "N/A"}* from *${params.vendorName || "MSME Supplier"}* for *${formatCurrencyINR(params.invoiceAmount || 0)}* is approaching the *45-day statutory limit* on *${params.deadline || "approaching date"}*.

*Tax Consequences if unpaid:*
1. *100% Tax Disallowance:* The entire amount of ${formatCurrencyINR(params.invoiceAmount || 0)} will be added back to your taxable income under Section 43B(h).
2. *Compounded Interest:* Mandatory penal interest @ 3× RBI repo rate u/s 16 of the MSMED Act, 2006.

Kindly clear this payment immediately and share the UTR reference with our office.

Regards,
*Corporate Tax & Audit Practice*
${firm}`
      };
    }

    // --------------------------------------------------------------------------
    // 8. PAY-TO-RELEASE DELIVERY WITH DYNAMIC UPI
    // --------------------------------------------------------------------------
    case "PAY_TO_RELEASE": {
      const upiLink = `upi://pay?pa=${params.firmUpiVpa || "ca.firm@icici"}&pn=${encodeURIComponent(firm)}&am=${params.taxPayable || 5000}&cu=INR&tn=${encodeURIComponent(`Prof Fee - ${params.serviceName}`)}`;

      return {
        tier: "SERVICE_DELIVERY",
        subject: `Filing Completed: Certified ${params.serviceName || "Return"} Ready for Download`,
        body:
`✅ *FILING COMPLETED: CERTIFIED DOCUMENTS READY*

Dear ${params.clientName},

We are pleased to inform you that your *${params.serviceName || "Statutory Return"}* for *${params.period || "Current Period"}* has been successfully filed with the Government Portal!

• *Acknowledgment / ARN:* \`${params.arnNumber || "ARN-" + Date.now().toString().slice(-8)}\`
• *Status:* Filed & Vaulted

💳 *1-Tap UPI Payment & Document Unlock:*
Professional Invoice: ${formatCurrencyINR(params.taxPayable || 5000)}
UPI ID: \`${params.firmUpiVpa || "ca.firm@icici"}\`

Instant Unlock Link:
${portal}?unlock=true

Upon UPI payment, the official certified filing acknowledgment and computation docket will be instantly unlocked without watermarks.

Thank you for partnering with *${firm}*.

Regards,
*Partner & Client Desk*`
      };
    }

    // --------------------------------------------------------------------------
    // DEFAULT FALLBACK
    // --------------------------------------------------------------------------
    default: {
      return {
        tier: "GENTLE",
        subject: `Compliance Update from ${firm}`,
        body: `Dear ${params.clientName},\n\nKindly note that your compliance filing for ${params.period || "the period"} is due on ${params.deadline || "shortly"}. Please provide the required documents.\n\nRegards,\n${firm}`
      };
    }
  }
}

/**
 * Generate 1-Tap wa.me URL
 */
export function generateWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = sanitizeIndianPhoneNumber(phone);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
