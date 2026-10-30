/**
 * Zero-API 1-Tap WhatsApp Link Generator (wa.me)
 * 
 * Avoids expensive Meta WhatsApp Cloud API keys, Facebook Business verification,
 * and monthly per-conversation fees.
 * Opens the native WhatsApp Web or mobile app directly with context-aware,
 * professionally formatted Indian CA templates.
 */

export type WhatsAppTemplate = 
  | "DOC_CHASE"
  | "ADVANCE_TAX_REMINDER"
  | "FILING_ACKNOWLEDGEMENT"
  | "FEE_INVOICE_UTR"
  | "OTP_CALL_NOTICE"
  | "SCRUTINY_NOTICE_ALERT"
  | "DSC_EXPIRY_ALERT"
  | "CLIENT_CREDENTIALS"
  | "STAFF_CREDENTIALS"
  | "VENDOR_ITC_HOLD"
  | "MSME_43BH_ALERT";

export interface WhatsAppTemplateParams {
  clientName: string;
  firmName?: string;
  serviceName?: string;
  period?: string;
  deadline?: string;
  missingDocs?: string[];
  arnNumber?: string;
  invoiceNo?: string;
  invoiceAmount?: number;
  firmUpiVpa?: string;
  bankAccountDetails?: string;
  portalName?: string;
  callTime?: string;
  noticeSection?: string;
  portalUrl?: string;
  loginId?: string;
  loginPassword?: string;
  vendorName?: string;
  overdueAmount?: number;
  daysRemaining?: number;
}

/**
 * Clean phone number to E.164 format without '+' for wa.me
 * Example: "+91 98200 44101" -> "919820044101"
 * "9820044101" -> "919820044101"
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
 * Format currency in Indian numbering system
 */
function formatINR(val?: number): string {
  if (!val) return "0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
}

/**
 * Generate formatted template text according to professional CA communication standards
 */
export function buildTemplateMessage(template: WhatsAppTemplate, params: WhatsAppTemplateParams): string {
  const firm = params.firmName || "GPA & Co., Chartered Accountants & Brains & Taxes";
  const portalLink = params.portalUrl || "https://ca.naturexpress.in/";

  switch (template) {
    case "DOC_CHASE": {
      const docsList = (params.missingDocs && params.missingDocs.length > 0)
        ? params.missingDocs.map((d, i) => `  ${i + 1}. ${d}`).join("\n")
        : "  • Pending statutory ledgers and statements";

      return `*URGENT: PENDING DOCUMENTS FOR ${params.serviceName?.toUpperCase() || "STATUTORY FILING"}*\n\n` +
        `Dear ${params.clientName},\n\n` +
        `Greetings from *${firm}*.\n\n` +
        `We are currently preparing your *${params.serviceName || "Compliance Filing"}* for the period *${params.period || "current period"}*.\n\n` +
        `The statutory filing deadline is *${params.deadline || "approaching shortly"}*. To avoid late filing fees and interest, kindly upload the following pending documents:\n\n` +
        `${docsList}\n\n` +
        `📱 *1-Tap Upload from your mobile:*\n${portalLink}\n\n` +
        `Kindly share these at the earliest so our audit team can complete the reconciliation on schedule.\n\n` +
        `Regards,\n*Taxation & Audit Team*\n${firm}`;
    }

    case "ADVANCE_TAX_REMINDER": {
      return `*STATUTORY REMINDER: ADVANCE TAX INSTALLMENT DUE*\n\n` +
        `Dear ${params.clientName},\n\n` +
        `This is a statutory advisory from *${firm}* regarding your Advance Tax liability for *${params.period || "Q2 FY 2026-27"}*.\n\n` +
        `Due Date: *${params.deadline || "15th of this month"}*\n` +
        `Estimated Installment: *${formatINR(params.invoiceAmount)}*\n\n` +
        `⚠️ *Important:* Failure to remit before the due date attracts mandatory interest @ 1% per month under *Section 234B & 234C* of the Income Tax Act.\n\n` +
        `If you have already paid the challan, please upload the BSR code & Challan receipt on the client portal:\n${portalLink}\n\n` +
        `Regards,\n${firm}`;
    }

    case "FILING_ACKNOWLEDGEMENT": {
      return `*COMPLIANCE COMPLETED: ${params.serviceName?.toUpperCase() || "RETURN FILED"}*\n\n` +
        `Dear ${params.clientName},\n\n` +
        `We are pleased to inform you that your *${params.serviceName || "statutory return"}* for *${params.period || "the period"}* has been successfully submitted to the department.\n\n` +
        `📋 *Filing Details:*\n` +
        `• Period: ${params.period || "N/A"}\n` +
        `• Ack / ARN No: *${params.arnNumber || "Verified"}*\n` +
        `• Timestamp: ${new Date().toLocaleDateString("en-IN")}\n\n` +
        `The official stamped departmental acknowledgement has been filed in your client vault:\n${portalLink}\n\n` +
        `Thank you for your timely document submissions!\n\n` +
        `Regards,\n*Compliance Team*\n${firm}`;
    }

    case "FEE_INVOICE_UTR": {
      return `*TAX INVOICE #${params.invoiceNo || "FEE"} & PAYMENT DETAILS*\n\n` +
        `Dear ${params.clientName},\n\n` +
        `Please find attached Invoice *#${params.invoiceNo || "N/A"}* for *${params.serviceName || "Professional Services"}* amounting to *${formatINR(params.invoiceAmount)}*.\n\n` +
        `🏦 *Direct Bank Transfer Details:*\n` +
      `• Beneficiary: Brains & Taxes Private Limited\n` +
      `• Bank & Branch: ICICI Bank, New Palasia, Indore\n` +
      `• A/C Type: Current Account\n` +
      `• A/C Number: 657005601799\n` +
      `• IFSC Code: ICIC0006570\n` +
      `• Direct UPI VPA: *${params.firmUpiVpa || "BRAINSANDTAXES@icici"}*\n\n` +
        `Once transferred via NEFT/RTGS/UPI, kindly reply with the *12-digit UTR reference number* or submit it here for instant receipt generation:\n${portalLink}\n\n` +
        `Thank you,\n*Accounts Desk*\n${firm}`;
    }

    case "OTP_CALL_NOTICE": {
      return `*FILING VERIFICATION: OTP COORDINATION CALL*\n\n` +
        `Dear ${params.clientName},\n\n` +
        `Our filing team is presently on the *${params.portalName || "Income Tax Portal (ITBA)"}* uploading the final approved *${params.serviceName || "return"}*.\n\n` +
        `Director / Signatory OTP is required to complete the submission. Our team member will initiate a quick verification call in *10 minutes* (*approx. ${params.callTime || "now"}*).\n\n` +
        `Kindly ensure the authorized signatory's Aadhaar-linked mobile is reachable to share the department OTP over the call.\n\n` +
        `Regards,\n*E-Filing Operations*\n${firm}`;
    }

    case "SCRUTINY_NOTICE_ALERT": {
      return `*CONFIDENTIAL: DEPARTMENT NOTICE RECEIVED*\n\n` +
        `Dear ${params.clientName},\n\n` +
        `An official departmental communication under *${params.noticeSection || "the Act"}* has been issued for your entity.\n\n` +
        `Statutory Compliance Deadline: *${params.deadline || "Within 15 days"}*\n\n` +
        `Our direct tax litigation team has already catalogued the notice and prepared a draft response framework. Please view the notice breakdown in your portal:\n${portalLink}\n\n` +
        `We will schedule a call with the Partner in-charge to finalize the submission.\n\n` +
        `Regards,\n*Litigation & Representation Practice*\n${firm}`;
    }

    case "DSC_EXPIRY_ALERT": {
      return `*URGENT: CLASS 3 DIGITAL SIGNATURE (DSC) EXPIRING*\n\n` +
        `Dear ${params.clientName},\n\n` +
        `The Class 3 USB Digital Signature Token for *${params.clientName}* will expire on *${params.deadline || "within 15 days"}*.\n\n` +
        `An active DSC is mandatory for signing GST returns, MCA filings, and Tax Audit reports. To avoid last-minute filing blocks, our team will initiate token re-validation.\n\n` +
        `Please confirm approval so we can initiate paperless KYC re-issuance.\n\n` +
        `Regards,\n${firm}`;
    }

    case "CLIENT_CREDENTIALS": {
      return `*OFFICIAL CLIENT PORTAL ACCESS — GPA & CO.*
(Chartered Accountants | ICAI FRN: 022998C)

Dear ${params.clientName},

Greetings from *GPA & Co., Chartered Accountants*.
Your corporate tax compliance & financial portal is now live for *${params.clientName}*.

🔐 *Your Secure Login Credentials:*
• *Portal URL:* ${params.portalUrl || "https://ca.naturexpress.in/"}
• *User ID (Mobile No or PAN):* ${params.loginId || params.clientName}
• *4-Digit Access PIN:* ${params.loginPassword || "Last 4 digits of your phone"}
*(Zero-SMS OTP delay — Instant 1-tap direct login. You can customize your PIN inside Profile anytime).*

📌 *Why you should log in today:*
1. 🏦 *Banker Loan Dockets:* 1-click audited balance sheets & ITR-V for bank credit renewals.
2. ⚠️ *Protect GST ITC Loss:* Live alerts for non-filing vendors so you hold defaulting payments.
3. ⏳ *MSME 43B(h) Clock:* 45-day vendor payment deadline countdown.
4. ✍️ *Paperless E-Sign:* Approve filed returns & financial statements right from mobile.

👉 *Log in now:* https://ca.naturexpress.in/
For direct assistance, reach our audit desk at +91 98937 23639.

Warm regards,
*Tax & Corporate Compliance Team*
*GPA & Co., Chartered Accountants*`;
    }

    case "STAFF_CREDENTIALS": {
      return `*PRACTICE MANAGEMENT ACCESS — GPA & CO.*
(Chartered Accountants | ICAI FRN: 022998C)

Dear ${params.clientName},

Your staff desk access is active on the GPA & Co. Practice Management System.

🔐 *Your Secure Login Details:*
• *Portal URL:* https://ca.naturexpress.in/
• *User ID (Email/Phone):* ${params.loginId || params.clientName}
• *Password:* ${params.loginPassword || "Staff@2026"}
• *Assigned Role:* ${params.serviceName || "Staff Member"}

📌 *Workbench Capabilities:*
• Track statutory tax calendars, GSTR-2B reconciliations & scrutiny notices
• Prepare compliance workpapers & route for partner sign-off
• Manage client digital vaults & automated document chases

👉 *Log in here:* https://ca.naturexpress.in/
*GPA & Co., Chartered Accountants*`;
    }

    case "VENDOR_ITC_HOLD": {
      return `*PAYMENT HOLD ADVISORY: GST ITC DEFAULT NOTIFICATION*\n\n` +
        `To,\n*Accounts Payable - ${params.vendorName || "Vendor"}*\n\n` +
        `This is a formal communication from *${params.clientName}* (represented by ${firm}).\n\n` +
        `During our monthly GST reconciliation for *${params.period || "current month"}*, it was noted that your invoices totaling *${formatINR(params.overdueAmount)}* have *not been reflected in our GSTR-2B*.\n\n` +
        `⚠️ Under *Section 16(2)(aa) of the CGST Act*, input tax credit cannot be availed by us until you upload and file your GSTR-1.\n\n` +
        `*Action Taken:* As per company policy, payment of GST component is temporarily placed on hold until your return filing reflects on the GST portal.\n\n` +
        `Kindly file your GSTR-1 and share the filing ARN at the earliest to release your payout.\n\n` +
        `Regards,\n*Finance & Accounts Department*\n${params.clientName}`;
    }

    case "MSME_43BH_ALERT": {
      return `*URGENT: SECTION 43B(h) MSME 45-DAY PAYMENT ALERT*\n\n` +
        `Dear ${params.clientName} (Accounts Team),\n\n` +
        `Statutory tax reminder from *${firm}*:\n\n` +
        `Invoice from *${params.vendorName || "Registered MSME Vendor"}* for *${formatINR(params.overdueAmount)}* has reached *Day ${45 - (params.daysRemaining || 4)} of the 45-day statutory window*.\n\n` +
        `⏳ *Days Remaining:* ${params.daysRemaining || 4} Days\n\n` +
        `⚠️ *Tax Consequence:* Under *Section 43B(h) of the Income Tax Act*, if this payment is not settled within 45 days, the full expense will be *disallowed and taxed at 31.2%* in the current financial year.\n\n` +
        `Please process this payment immediately via NetBanking/RTGS to protect business deduction.\n\n` +
        `Regards,\n*Audit & Compliance Team*\n${firm}`;
    }
  }
}

/**
 * Generate 1-tap wa.me link
 */
export function createWhatsAppWebLink(
  phone: string, 
  template: WhatsAppTemplate, 
  params: WhatsAppTemplateParams
): string {
  const sanitized = sanitizeIndianPhoneNumber(phone);
  const text = buildTemplateMessage(template, params);
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(text)}`;
}

/**
 * Trigger 1-tap WhatsApp preset in new browser tab / native app
 */
export function openWhatsAppPreset(
  phone: string, 
  template: WhatsAppTemplate, 
  params: WhatsAppTemplateParams
): void {
  const link = createWhatsAppWebLink(phone, template, params);
  if (typeof window !== "undefined") {
    window.open(link, "_blank", "noopener,noreferrer");
  }
}
