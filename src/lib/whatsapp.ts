/**
 * Zero-API 1-Tap WhatsApp Link Generator (wa.me)
 * 
 * Avoids expensive Meta WhatsApp Cloud API keys, Facebook Business verification,
 * and monthly per-conversation fees.
 * Opens the native WhatsApp Web or mobile app directly with context-aware,
 * professionally formatted Indian CA templates.
 */

import { DEFAULT_FIRM_BRANDING, getPortalBaseUrl } from "@/lib/config/branding";
import { OnboardingMode } from "@/lib/types";

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
  | "MSME_43BH_ALERT"
  | "ONBOARDING_HANDOVER_KIT";

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
  entityTypeLabel?: string;
  isTakeover?: boolean;
  onboardingMode?: OnboardingMode;
  missingPortals?: string[];
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
  const firm = params.firmName || `${DEFAULT_FIRM_BRANDING.firmName}`;
  const basePortalUrl = getPortalBaseUrl();
  const portalLink = params.portalUrl || `${basePortalUrl}/`;

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
      const upiVpa = params.firmUpiVpa || "BRAINSANDTAXES@icici";
      const invNum = params.invoiceNo || "FEE-INV";
      const amt = params.invoiceAmount || 0;
      const dynamicUpiUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent("Brains and Taxes")}&am=${amt}&cu=INR&tn=${encodeURIComponent(`Settlement-${invNum}`)}`;

      return `*TAX INVOICE #${invNum} & STATUTORY DELIVERABLE RELEASE*\n\n` +
        `Dear ${params.clientName},\n\n` +
        `Greetings from *${firm}*.\n` +
        `This is a formal communication regarding your professional fee invoice *#${invNum}* for *${params.serviceName || "Statutory Audit & Tax Compliances"}* amounting to *${formatINR(amt)}*.\n\n` +
        `🔒 *STATUTORY DELIVERABLE GATE STATUS:*\n` +
        `In accordance with ICAI Standard on Auditing (SA 210) and firm delivery protocol, final certified deliverables (*Form 3CD, Digitally Signed Balance Sheet, and ITR-V Acknowledgment*) are held in your secure portal vault pending fee settlement.\n\n` +
        `⚠️ *STATUTORY MSME COMPLIANCE u/s 43B(h):*\n` +
        `As a registered MSME entity, delays beyond 15/45 days attract mandatory business expense disallowance under *Section 43B(h) of the Income Tax Act*, resulting in 31.2% additional tax liability on your company.\n\n` +
        `🏦 *DIRECT SETTLEMENT OPTIONS:*\n` +
        `• *Instant Dynamic UPI:* ${upiVpa}\n` +
        `• *Beneficiary:* Brains & Taxes Private Limited\n` +
        `• *Bank & Branch:* ICICI Bank, New Palasia, Indore\n` +
        `• *Current A/C:* 657005601799\n` +
        `• *IFSC Code:* ICIC0006570\n\n` +
        `⚡ *1-Tap Instant Unlock Portal:*\n` +
        `${portalLink}\n\n` +
        `Once paid via RTGS/NEFT, please upload your 12-digit UTR on the portal link above for immediate zero-wait release of your certified documents.\n\n` +
        `Warm regards,\n*Practice Management & Billing Desk*\n${firm}`;
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
      const basePortalUrl = getPortalBaseUrl();
      const clientPortalUrl = params.portalUrl || `${basePortalUrl}/?portal=client`;
      const pinHint = params.loginPassword
        ? `${params.loginPassword} _(for security, never embedded in the link — change inside Profile anytime)_`
        : "Last 4 digits of your registered mobile number";

      return `*OFFICIAL CLIENT PORTAL ACCESS — ${firm.toUpperCase()}*
(Chartered Accountants | ICAI FRN: ${DEFAULT_FIRM_BRANDING.frn})

Dear ${params.clientName},

Greetings from *${firm}*.
Your corporate tax compliance & financial portal is now live for *${params.clientName}*.

🔐 *Your Secure Login Details:*
• *Portal URL:* ${clientPortalUrl}
• *User ID (Mobile No or PAN):* ${params.loginId || params.clientName}
• *4-Digit Access PIN:* ${pinHint}

📌 *Inside Your Portal:*
1. 🏦 *Banker Loan Dockets:* 1-click audited financials & ITR-V pack for credit renewals.
2. ⚠️ *Protect GST ITC Loss:* Live alerts for non-filing vendors before releasing payment.
3. ⏳ *MSME 43B(h) Watchdog:* 45-day vendor payment deadline tracker.
4. ✍️ *Document Vault & Handover:* Upload bank statements, COI, and approve filings securely.

👉 *Open Client Portal:* ${clientPortalUrl}

Warm regards,
*Tax & Corporate Compliance Team*
*${firm}*`;
    }

    case "STAFF_CREDENTIALS": {
      const basePortalUrl = getPortalBaseUrl();
      const staffPortalUrl = `${basePortalUrl}/`;
      return `*PRACTICE MANAGEMENT ACCESS — ${firm.toUpperCase()}*
(Chartered Accountants | ICAI FRN: ${DEFAULT_FIRM_BRANDING.frn})

Dear ${params.clientName},

Your staff desk access is active on the ${firm} Practice Management System.

🔐 *Your Login Details:*
• *Portal URL:* ${staffPortalUrl}
• *User ID (Email/Phone):* ${params.loginId || params.clientName}
• *Temporary Password:* ${params.loginPassword || "Set on first login"}
• *Assigned Role:* ${params.serviceName || "Staff Member"}

📌 *Workbench Capabilities:*
• Track statutory tax calendars, GSTR-2B reconciliations & scrutiny notices
• Prepare compliance workpapers & route for partner sign-off
• Manage client digital vaults & automated document chases

👉 *Log in here:* ${staffPortalUrl}
*${firm}*`;
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

    case "ONBOARDING_HANDOVER_KIT": {
      const basePortalUrl = getPortalBaseUrl();
      const clientPortalUrl = params.portalUrl || `${basePortalUrl}/?portal=client`;
      const pin = params.loginPassword || "Last 4 digits of your mobile";
      const onboardingTrack = params.onboardingMode || (params.isTakeover ? "CA_TAKEOVER" : "EXISTING_CLIENT");
      const checklistLines =
        params.missingDocs && params.missingDocs.length > 0
          ? params.missingDocs.map((d, i) => `  ${i + 1}. ${d}`).join("\n")
          : "  1. Current Year Bank Statements (with PDF Password if any)\n  2. Sales / Purchase Bills or Tally Data\n  3. Any Pending Tax / GST Notices";
      const portalAccessLine =
        params.missingPortals && params.missingPortals.length > 0
          ? `\n🔑 *Portal Access Needed (Submit securely inside Portal):*\n  • ${params.missingPortals.join(", ")}\n`
          : "";
      const trackNote =
        onboardingTrack === "CA_TAKEOVER"
          ? `\n📂 *Smooth Previous-CA Transition:*\nPlease upload your last filed ITR/Audit JSONs & any open notices inside the Handover Dropzone so we can audit past compliance health on Day 1.\n`
          : onboardingTrack === "NEW_BUSINESS"
            ? `\n🚀 *New Entity Setup:*\nUpload your Incorporation Certificate / COI & Current Account details inside your portal so we can track your statutory milestones.\n`
            : `\n📂 *Digital Compliance Desk Active:*\nWe have activated your digital compliance portal for ongoing monthly filings, vault storage, and status tracking.\n`;

      return `*WELCOME TO YOUR CLIENT PORTAL — ${firm.toUpperCase()}*\n` +
        `_(${params.entityTypeLabel || "Corporate & Tax Compliance Desk"})_\n\n` +
        `Dear ${params.clientName},\n\n` +
        `Your Compliance & Document Vault is now active.\n\n` +
        `🔐 *Client Portal Access:*\n` +
        `• *Portal Link:* ${clientPortalUrl}\n` +
        `• *User ID:* ${params.loginId || params.clientName}\n` +
        `• *First-Login 4-Digit PIN:* ${pin}\n` +
        portalAccessLine +
        `\n📋 *Pending Items (Upload directly in Portal):*\n${checklistLines}\n` +
        trackNote +
        `\n👉 *Sign In & Upload:* ${clientPortalUrl}\n\n` +
        `Warm regards,\n*${firm}*`;
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
 * Generate standardized NPCI compliant UPI Intent URI
 */
export function generateDynamicUpiUri(
  vpa: string,
  payeeName: string,
  amount: number,
  invoiceNo?: string
): string {
  const cleanVpa = vpa || "BRAINSANDTAXES@icici";
  const name = payeeName || "Brains and Taxes Private Limited";
  const note = invoiceNo ? `Settlement of ${invoiceNo}` : "Professional CA Fee Settlement";
  return `upi://pay?pa=${encodeURIComponent(cleanVpa)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
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
