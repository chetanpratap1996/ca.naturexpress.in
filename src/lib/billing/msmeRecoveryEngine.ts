import { InvoiceItem, ClientEntity } from "@/lib/types";

export type MsmeEscalationStage = 
  | "STAGE_1_COURTESY"       // 0 - 15 days
  | "STAGE_2_COUNTDOWN"      // 16 - 30 days
  | "STAGE_3_INTEREST_RISK"  // 31 - 44 days
  | "STAGE_4_STATUTORY_DEMAND"; // 45+ days overdue

export interface MsmeInvoiceEvaluation {
  invoiceId: string;
  invoiceNo: string;
  entityId: string;
  clientName: string;
  pan: string;
  amount: number;
  dueDate: string;
  daysPastInvoice: number;
  daysRemainingIn45DayWindow: number;
  stage: MsmeEscalationStage;
  rbiBankRatePct: number;
  msmeStatutoryInterestRatePct: number; // 3x RBI rate (e.g. 6.5% * 3 = 19.5%)
  accruedCompoundedInterestInr: number;
  potentialTaxDisallowanceLossInr: number; // 30% corporate tax + 4% cess = 31.2%
  form3cdClause22DisclosureRequired: boolean;
  status: "PENDING" | "OVERDUE" | "DISPUTED" | "PAID";
  udyamRegistrationNo: string;
  letterheadDemandNoticeAvailable: boolean;
}

export interface MsmePortfolioRiskSummary {
  totalOverdueAmountInr: number;
  totalAccruedInterestInr: number;
  totalClientTaxDisallowanceRiskInr: number;
  invoicesCountByStage: {
    stage1: number;
    stage2: number;
    stage3: number;
    stage4: number;
  };
  totalEvaluatedInvoices: number;
}

const DEFAULT_RBI_BANK_RATE = 6.50; // Current RBI repo / bank rate proxy (6.5%)
const FIRM_UDYAM_REGISTRATION = "UDYAM-MP-23-0098214";

/**
 * Computes MSME Section 16 Compound Interest (3x RBI rate compounded monthly)
 * Under Section 16 of MSMED Act, interest begins on the 46th day or after agreed credit period.
 */
export function computeMsmeStatutoryInterest(
  amount: number,
  daysOverdue: number,
  rbiBankRatePct: number = DEFAULT_RBI_BANK_RATE
): {
  statutoryRatePct: number;
  accruedInterestInr: number;
  monthsCompounded: number;
} {
  const statutoryRatePct = rbiBankRatePct * 3; // 19.5% p.a.
  if (daysOverdue <= 45) {
    return { statutoryRatePct, accruedInterestInr: 0, monthsCompounded: 0 };
  }

  // Days beyond 45 days
  const chargeableDays = daysOverdue - 45;
  const monthsCompounded = chargeableDays / 30;
  const monthlyRate = (statutoryRatePct / 100) / 12;

  // Compound Interest Formula: A = P * (1 + r)^n - P
  const totalAmountWithInterest = amount * Math.pow(1 + monthlyRate, monthsCompounded);
  const accruedInterestInr = Math.round(totalAmountWithInterest - amount);

  return {
    statutoryRatePct,
    accruedInterestInr,
    monthsCompounded: parseFloat(monthsCompounded.toFixed(2))
  };
}

/**
 * Evaluates Section 43B(h) Tax Disallowance Risk
 * Disallows deduction in client's computation if unpaid beyond 45 days.
 */
export function calculateSection43BhDisallowanceRisk(
  amount: number,
  daysPastInvoice: number
): {
  isDisallowanceTriggered: boolean;
  taxLossInr: number;
  effectiveTaxRatePct: number;
  clause22Mandatory: boolean;
} {
  const effectiveTaxRatePct = 31.2; // 30% corporate tax + 4% health & education cess
  const isDisallowanceTriggered = daysPastInvoice > 45;
  const taxLossInr = isDisallowanceTriggered ? Math.round(amount * (effectiveTaxRatePct / 100)) : 0;

  return {
    isDisallowanceTriggered,
    taxLossInr,
    effectiveTaxRatePct,
    clause22Mandatory: daysPastInvoice > 45
  };
}

/**
 * Evaluates single invoice against MSMED Act Section 15, 16 and Income Tax Section 43B(h)
 */
export function evaluateInvoiceUnderMsme(
  invoice: InvoiceItem,
  client?: Partial<ClientEntity>
): MsmeInvoiceEvaluation {
  const now = Date.now();
  const invoiceDateMs = invoice.dueDate ? new Date(invoice.dueDate).getTime() - (30 * 86400000) : now - (20 * 86400000);
  const daysPastInvoice = Math.max(1, Math.floor((now - invoiceDateMs) / 86400000));
  const daysRemainingIn45DayWindow = Math.max(0, 45 - daysPastInvoice);

  let stage: MsmeEscalationStage = "STAGE_1_COURTESY";
  if (daysPastInvoice > 45) stage = "STAGE_4_STATUTORY_DEMAND";
  else if (daysPastInvoice > 30) stage = "STAGE_3_INTEREST_RISK";
  else if (daysPastInvoice > 15) stage = "STAGE_2_COUNTDOWN";

  const interestCalc = computeMsmeStatutoryInterest(invoice.amount, daysPastInvoice);
  const disallowanceCalc = calculateSection43BhDisallowanceRisk(invoice.amount, daysPastInvoice);

  return {
    invoiceId: invoice.id,
    invoiceNo: invoice.invoiceNo,
    entityId: invoice.entityId,
    clientName: invoice.entityName,
    pan: client?.pan || "PAN_ON_FILE",
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    daysPastInvoice,
    daysRemainingIn45DayWindow,
    stage,
    rbiBankRatePct: DEFAULT_RBI_BANK_RATE,
    msmeStatutoryInterestRatePct: interestCalc.statutoryRatePct,
    accruedCompoundedInterestInr: interestCalc.accruedInterestInr,
    potentialTaxDisallowanceLossInr: disallowanceCalc.taxLossInr,
    form3cdClause22DisclosureRequired: disallowanceCalc.clause22Mandatory,
    status: invoice.status === "PAID" ? "PAID" : daysPastInvoice > 45 ? "OVERDUE" : "PENDING",
    udyamRegistrationNo: FIRM_UDYAM_REGISTRATION,
    letterheadDemandNoticeAvailable: daysPastInvoice > 30
  };
}

/**
 * Formats WhatsApp Advisory Message according to the 4-Stage Progressive Escalation Ladder
 */
export function formatMsmeWhatsAppEscalationMessage(params: {
  evaluation: MsmeInvoiceEvaluation;
  upiPaymentLink: string;
  partnerName?: string;
}): string {
  const { evaluation, upiPaymentLink, partnerName = "CA Gunjan Jain" } = params;

  if (evaluation.stage === "STAGE_1_COURTESY") {
    return (
      `*M/s ${evaluation.clientName}* Ji, Pranam 🙏\n\n` +
      `This is a courteous reminder from GPA & Co., Chartered Accountants regarding Invoice *${evaluation.invoiceNo}* (₹${evaluation.amount.toLocaleString("en-IN")}).\n\n` +
      `📁 *Statutory Window:* Within agreed 15-day credit period.\n` +
      `⚡ *1-Tap Settle via UPI:* ${upiPaymentLink}\n\n` +
      `Thank you for your continued partnership.`
    );
  }

  if (evaluation.stage === "STAGE_2_COUNTDOWN") {
    return (
      `*M/s ${evaluation.clientName}*,\n\n` +
      `*Statutory Compliance Alert: MSME Section 43B(h) Window Closing*\n\n` +
      `Invoice *${evaluation.invoiceNo}* (₹${evaluation.amount.toLocaleString("en-IN")}) has been outstanding for *${evaluation.daysPastInvoice} days*.\n\n` +
      `⏳ *${evaluation.daysRemainingIn45DayWindow} Days Remaining* before statutory 45-day deadline under Section 15 of the MSMED Act, 2006.\n\n` +
      `To ensure uninterrupted expense deduction in your FY 2025-26 Tax Audit, kindly settle before Day 45:\n` +
      `⚡ *1-Tap Settle via UPI:* ${upiPaymentLink}\n\n` +
      `GPA & Co., Chartered Accountants`
    );
  }

  if (evaluation.stage === "STAGE_3_INTEREST_RISK") {
    return (
      `*URGENT: STATUTORY TAX AUDIT ALERT*\n` +
      `*To: Board of Directors / Partners, ${evaluation.clientName}*\n\n` +
      `Professional Invoice *${evaluation.invoiceNo}* (₹${evaluation.amount.toLocaleString("en-IN")}) is now *${evaluation.daysPastInvoice} days overdue*.\n\n` +
      `⚠️ *Statutory Tax Penalties Triggering in ${evaluation.daysRemainingIn45DayWindow} Days:*\n` +
      `1. *Section 43B(h) Disallowance:* ₹${evaluation.amount.toLocaleString("en-IN")} will be added back to your taxable income (Loss of ₹${Math.round(evaluation.amount * 0.312).toLocaleString("en-IN")} tax benefit).\n` +
      `2. *Section 16 Compound Interest:* 3x RBI Bank Rate (19.5% p.a. compounded monthly) activates automatically.\n\n` +
      `Kindly clear immediately via zero-fee dynamic UPI to protect your deduction:\n` +
      `⚡ *Direct Settlement Link:* ${upiPaymentLink}\n\n` +
      `${partnerName}, Managing Partner\nGPA & Co., Chartered Accountants (Udyam: ${evaluation.udyamRegistrationNo})`
    );
  }

  // STAGE_4_STATUTORY_DEMAND (45+ Days)
  return (
    `*FORMAL STATUTORY NOTICE UNDER MSMED ACT, 2006 (Section 18)*\n` +
    `*To: The Management, ${evaluation.clientName}*\n\n` +
    `Invoice: *${evaluation.invoiceNo}* | Age: *${evaluation.daysPastInvoice} Days Overdue*\n` +
    `Principal Outstanding: *₹${evaluation.amount.toLocaleString("en-IN")}*\n` +
    `Accrued Statutory Interest u/s 16 (19.5% p.a.): *₹${evaluation.accruedCompoundedInterestInr.toLocaleString("en-IN")}*\n` +
    `*Total Statutory Claim: ₹${(evaluation.amount + evaluation.accruedCompoundedInterestInr).toLocaleString("en-IN")}*\n\n` +
    `Notice is hereby served that as per Section 43B(h) of the Income Tax Act, this expenditure stands disallowed for your Tax Audit. Further, mandatory reporting under Form 3CD Clause 22 has been queued.\n\n` +
    `To avoid escalation before the MSME Micro & Small Enterprises Facilitation Council (MSEFC Samadhaan), clear the outstanding dues within 48 hours:\n` +
    `⚡ *Instant Clearance Link:* ${upiPaymentLink}\n\n` +
    `GPA & Co., Chartered Accountants (Udyam: ${evaluation.udyamRegistrationNo})`
  );
}

/**
 * Generates Full Formal Legal Demand Letter on Firm Letterhead
 */
export function generateMsmeLegalDemandNoticeText(params: {
  evaluation: MsmeInvoiceEvaluation;
  firmName?: string;
  firmAddress?: string;
  partnerName?: string;
}): string {
  const {
    evaluation,
    firmName = "GPA & Co., Chartered Accountants",
    firmAddress = "Office No. 103, NM Verge, Y.N. Road, Indore, Madhya Pradesh - 452001",
    partnerName = "CA Gunjan Jain, FCA, DISA"
  } = params;

  const totalClaim = evaluation.amount + evaluation.accruedCompoundedInterestInr;
  const todayFormatted = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  return `
================================================================================
                    ${firmName.toUpperCase()}
                  CHARTERED ACCOUNTANTS | TAX & AUDIT ADVISORY
              ${firmAddress}
          Udyam Registration No.: ${evaluation.udyamRegistrationNo} | ICAI FRN: 022998C
================================================================================

REF: GPA/MSME-RECOV/${evaluation.invoiceNo}/${new Date().getFullYear()}
DATE: ${todayFormatted}

BY REGISTERED EMAIL & SPEED POST / WHATSAPP DELIVERY
WITHOUT PREJUDICE TO STATUTORY RIGHTS

TO:
The Board of Directors / Authorized Signatory
${evaluation.clientName}
PAN: ${evaluation.pan}

SUBJECT: STATUTORY DEMAND NOTICE UNDER SECTIONS 15, 16 & 18 OF THE MICRO, SMALL 
         AND MEDIUM ENTERPRISES DEVELOPMENT (MSMED) ACT, 2006 READ WITH SECTION 
         43B(h) OF THE INCOME TAX ACT, 1961 FOR SETTLEMENT OF PROFESSIONAL TAX AUDIT FEE.

DEAR SIRS,

UNDER INSTRUCTIONS FROM AND ON BEHALF OF OUR PRACTICE FIRM, GPA & CO., CHARTERED 
ACCOUNTANTS, REGISTERED UNDER THE MSMED ACT, 2006 BEARING UDYAM REGISTRATION NO. 
${evaluation.udyamRegistrationNo}, WE HEREBY SERVE THIS FORMAL LEGAL DEMAND NOTICE:

1. STATUTORY RETAINER & PROFESSIONAL SERVICES RENDERED:
   Our firm was formally engaged by your enterprise for statutory taxation, tax audit 
   certifications, and corporate compliance services. Upon completion of certified work, 
   Tax Invoice No. ${evaluation.invoiceNo} dated for ₹${evaluation.amount.toLocaleString("en-IN")} was duly 
   served and received by your accounts department without dispute.

2. CONTRAVENTION OF SECTION 15 OF MSMED ACT, 2006:
   Under Section 15 of the MSMED Act, 2006, the buyer is mandatorily obligated to make 
   payment for goods supplied or services rendered within the agreed period, not exceeding 
   45 days from the date of acceptance. As of today, the said invoice has remained UNPAID 
   for ${evaluation.daysPastInvoice} days, constituting a direct contravention of the Act.

3. LIABILITY FOR COMPOUNDED INTEREST UNDER SECTION 16:
   Section 16 of the MSMED Act mandates that where a buyer fails to make payment within 
   the period specified under Section 15, the buyer SHALL BE LIABLE to pay compound interest 
   with monthly rests at three times the RBI Bank Rate (currently ${evaluation.msmeStatutoryInterestRatePct}% per annum).
   
   • Principal Professional Fee Outstanding: ₹${evaluation.amount.toLocaleString("en-IN")}
   • Accrued Compound Interest u/s 16 (${evaluation.msmeStatutoryInterestRatePct}% p.a.): ₹${evaluation.accruedCompoundedInterestInr.toLocaleString("en-IN")}
   ---------------------------------------------------------------------------------
   • TOTAL LEGALLY RECOVERABLE STATUTORY CLAIM: ₹${totalClaim.toLocaleString("en-IN")}

4. MANDATORY AUDIT DISALLOWANCE UNDER SECTION 43B(h) & CLAUSE 22 REPORTING:
   Please take note that pursuant to Section 43B(h) of the Income Tax Act, 1961, any sum 
   payable to an MSME enterprise beyond the time limit specified in Section 15 of the MSMED 
   Act CANNOT be claimed as an expenditure in your computation of income and stands 
   DISALLOWED, resulting in an immediate direct tax penalty of ₹${evaluation.potentialTaxDisallowanceLossInr.toLocaleString("en-IN")} 
   (tax @ 31.2%). Furthermore, your statutory auditors are legally bound to disclose this 
   overdue interest in Clause 22 of Form 3CD.

5. PEREMPTORY REQUISITION:
   You are hereby called upon to remit the total sum of ₹${totalClaim.toLocaleString("en-IN")} within seven (7) 
   days of receipt of this notice, failing which our firm shall initiate recovery proceedings 
   before the Micro and Small Enterprises Facilitation Council (MSEFC Samadhaan) under 
   Section 18 of the MSMED Act, and/or file appropriate execution claims before the competent 
   Court of Jurisdiction at Indore, at your sole risk and costs.

FOR GPA & CO.,
CHARTERED ACCOUNTANTS

_____________________________
${partnerName}
Managing Partner | Fellow Chartered Accountant
Enrollment No.: 034912 | ICAI FRN: 022998C
`.trim();
}

/**
 * Sample Invoices Evaluated for MSME Section 43B(h) Suite
 */
export const SAMPLE_MSME_OVERDUE_INVOICES: MsmeInvoiceEvaluation[] = [
  {
    invoiceId: "INV-2026-089",
    invoiceNo: "INV-2026-089",
    entityId: "CLI-APEX-01",
    clientName: "Apex AutoTech Private Limited",
    pan: "AABCA8891D",
    amount: 118000,
    dueDate: "2026-09-30",
    daysPastInvoice: 82,
    daysRemainingIn45DayWindow: 0,
    stage: "STAGE_4_STATUTORY_DEMAND",
    rbiBankRatePct: 6.5,
    msmeStatutoryInterestRatePct: 19.5,
    accruedCompoundedInterestInr: 7120,
    potentialTaxDisallowanceLossInr: 36816,
    form3cdClause22DisclosureRequired: true,
    status: "OVERDUE",
    udyamRegistrationNo: FIRM_UDYAM_REGISTRATION,
    letterheadDemandNoticeAvailable: true
  },
  {
    invoiceId: "INV-2026-094",
    invoiceNo: "INV-2026-094",
    entityId: "CLI-BT-01",
    clientName: "Brains & Taxes Private Limited",
    pan: "AABCU9821F",
    amount: 45000,
    dueDate: "2026-10-15",
    daysPastInvoice: 38,
    daysRemainingIn45DayWindow: 7,
    stage: "STAGE_3_INTEREST_RISK",
    rbiBankRatePct: 6.5,
    msmeStatutoryInterestRatePct: 19.5,
    accruedCompoundedInterestInr: 0,
    potentialTaxDisallowanceLossInr: 0,
    form3cdClause22DisclosureRequired: false,
    status: "PENDING",
    udyamRegistrationNo: FIRM_UDYAM_REGISTRATION,
    letterheadDemandNoticeAvailable: true
  },
  {
    invoiceId: "INV-2026-104",
    invoiceNo: "INV-2026-104",
    entityId: "CLI-KUBER-01",
    clientName: "Kuber Logistics Private Limited",
    pan: "AAKCS8812K",
    amount: 35000,
    dueDate: "2026-11-05",
    daysPastInvoice: 17,
    daysRemainingIn45DayWindow: 28,
    stage: "STAGE_2_COUNTDOWN",
    rbiBankRatePct: 6.5,
    msmeStatutoryInterestRatePct: 19.5,
    accruedCompoundedInterestInr: 0,
    potentialTaxDisallowanceLossInr: 0,
    form3cdClause22DisclosureRequired: false,
    status: "PENDING",
    udyamRegistrationNo: FIRM_UDYAM_REGISTRATION,
    letterheadDemandNoticeAvailable: false
  },
  {
    invoiceId: "INV-2026-108",
    invoiceNo: "INV-2026-108",
    entityId: "CLI-MAHESH-01",
    clientName: "Maheshwari Textiles",
    pan: "AABFM4421E",
    amount: 25000,
    dueDate: "2026-11-18",
    daysPastInvoice: 4,
    daysRemainingIn45DayWindow: 41,
    stage: "STAGE_1_COURTESY",
    rbiBankRatePct: 6.5,
    msmeStatutoryInterestRatePct: 19.5,
    accruedCompoundedInterestInr: 0,
    potentialTaxDisallowanceLossInr: 0,
    form3cdClause22DisclosureRequired: false,
    status: "PENDING",
    udyamRegistrationNo: FIRM_UDYAM_REGISTRATION,
    letterheadDemandNoticeAvailable: false
  }
];
