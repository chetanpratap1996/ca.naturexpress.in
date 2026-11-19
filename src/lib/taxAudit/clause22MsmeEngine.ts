/**
 * Brains & Taxes — Enterprise Form 3CD Clause 22 & Section 43B(h) MSME Engine
 * 
 * Statutory Authority:
 * - Section 43B(h) of the Income-tax Act, 1961 (Inserted by Finance Act, 2023)
 * - Section 15 of Micro, Small and Medium Enterprises Development (MSMED) Act, 2006: Statutory payment windows (15 or 45 days)
 * - Section 16 of MSMED Act, 2006: Mandatory compound interest with monthly rests at 3x RBI Bank Rate (Current 20.25% p.a.)
 * - Section 23 of MSMED Act, 2006: Inadmissibility of Section 16 penal interest as a tax deduction
 * - Ministry of MSME OM No. 2/1/2021-MSME dated 02.07.2021: Exclusion of Wholesale & Retail Traders (NIC 45, 46, 47)
 */

export type EnterpriseCategory = "MICRO" | "SMALL" | "MEDIUM" | "TRADER_EXCLUDED";

export interface MsmeCreditorInvoiceItem {
  id: string;
  vendorName: string;
  vendorPan: string;
  udyamRegistrationNo?: string;
  enterpriseCategory: EnterpriseCategory;
  hasWrittenAgreement: boolean; // True -> 45 days max; False -> 15 days
  nicCode?: string; // 45, 46, 47 are traders
  
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  deliveryOrAcceptanceDate: string; // YYYY-MM-DD
  invoiceAmountInr: number;
  
  // Payment Status
  paymentStatus: "PAID_ON_TIME" | "PAID_AFTER_DUE_DATE_WITHIN_FY" | "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END";
  actualPaymentDate?: string; // YYYY-MM-DD (if paid)
}

export interface AuditedMsmeInvoiceResult {
  id: string;
  vendorName: string;
  udyamNo?: string;
  enterpriseCategory: EnterpriseCategory;
  isEligibleFor43Bh: boolean; // False for Medium or Traders
  statutoryLimitDays: number; // 15 or 45
  statutoryDueDate: string;
  daysDelayed: number;
  isDisallowedUnder43Bh: boolean;
  disallowanceAmountInr: number;
  rbiBankRateAppliedPcnt: number; // e.g. 6.75%
  penalInterestRateAppliedPcnt: number; // 3x = 20.25%
  penalInterestPayableSection16Inr: number;
  isInadmissibleUnderSection23: boolean;
  statutoryAuditTrail: string;
}

export interface Clause22Report {
  assesseeName: string;
  pan: string;
  financialYear: string;
  assessmentYear: string;
  
  summary: {
    totalCreditorsExaminedCount: number;
    microAndSmallVendorsCount: number;
    tradersAndMediumExcludedCount: number;
    
    totalInvoiceAmountInr: number;
    totalDisallowedUnder43BhInr: number; // Add back to income in Form 3CD
    totalAllowedOnPaymentInr: number;
    
    totalPenalInterestSection16Inr: number; // 3x RBI rate
    totalInadmissibleInterestSec23Inr: number;
  };

  clause22Disclosures: {
    principalUnpaidAtYearEnd_SubClauseI: number;
    interestDueRemainingUnpaidAtYearEnd_SubClauseI: number;
    interestPaidUnderSection16_SubClauseII: number;
    interestDueAndPayableForDelay_SubClauseIII: number;
    interestAccruedAndRemainingUnpaid_SubClauseIV: number;
    furtherInterestRemainingDueInSucceedingYears_SubClauseV: number;
  };

  auditedInvoices: AuditedMsmeInvoiceResult[];
}

export class Clause22MsmeEngine {
  public static readonly CURRENT_RBI_BANK_RATE = 6.75; // 6.75% p.a.
  public static readonly PENAL_INTEREST_RATE = 3 * Clause22MsmeEngine.CURRENT_RBI_BANK_RATE; // 20.25% p.a.

  /**
   * Evaluates MSME creditor invoices for Section 43B(h) and Clause 22 disclosures
   */
  public static evaluateMsmeCreditors(params: {
    assesseeName: string;
    pan: string;
    financialYear: string;
    assessmentYear: string;
    invoices: MsmeCreditorInvoiceItem[];
    rbiBankRatePcnt?: number;
  }): Clause22Report {
    const bankRate = params.rbiBankRatePcnt || this.CURRENT_RBI_BANK_RATE;
    const penalRate = 3 * bankRate; // 20.25%

    const auditedInvoices: AuditedMsmeInvoiceResult[] = [];
    let totalInvAmount = 0;
    let totalDisallowed43Bh = 0;
    let totalAllowed = 0;
    let totalPenalInterest = 0;

    let microSmallCount = 0;
    let excludedCount = 0;

    let subClauseI_Principal = 0;
    let subClauseI_Interest = 0;
    let subClauseII_InterestPaid = 0;
    let subClauseIII_InterestDue = 0;
    let subClauseIV_InterestAccrued = 0;
    let subClauseV_FurtherInterest = 0;

    for (const inv of params.invoices) {
      totalInvAmount += inv.invoiceAmountInr;

      // 1. Check Eligibility: Micro or Small only, exclude Medium and Traders
      const isTrader = inv.nicCode?.startsWith("45") || inv.nicCode?.startsWith("46") || inv.nicCode?.startsWith("47") || inv.enterpriseCategory === "TRADER_EXCLUDED";
      const isEligible = (inv.enterpriseCategory === "MICRO" || inv.enterpriseCategory === "SMALL") && !isTrader;

      if (isEligible) microSmallCount++;
      else excludedCount++;

      // 2. Compute Statutory Due Date: 15 or 45 days from acceptance
      const limitDays = inv.hasWrittenAgreement ? 45 : 15;
      const baseDate = new Date(inv.deliveryOrAcceptanceDate || inv.invoiceDate);
      const dueDate = new Date(baseDate.getTime() + limitDays * 24 * 3600 * 1000);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      // 3. Evaluate Delay and Section 43B(h) Disallowance
      let daysDelayed = 0;
      let isDisallowed = false;
      let disallowanceAmt = 0;
      let penalInterest = 0;

      if (inv.paymentStatus === "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END") {
        // Disallowed under Section 43B(h) as on 31st March
        const fyEnd = new Date("2026-03-31");
        daysDelayed = Math.max(0, Math.ceil((fyEnd.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));

        if (isEligible) {
          isDisallowed = true;
          disallowanceAmt = inv.invoiceAmountInr;
          totalDisallowed43Bh += disallowanceAmt;
          subClauseI_Principal += inv.invoiceAmountInr;
        }

        // Compute compound interest with monthly rests at 3x RBI rate
        if (daysDelayed > 0) {
          const months = daysDelayed / 30.416;
          // Compound interest formula: A = P(1 + r/12)^n - P
          const r = penalRate / 100;
          penalInterest = Math.round((inv.invoiceAmountInr * (Math.pow(1 + r / 12, months) - 1)) * 100) / 100;
          totalPenalInterest += penalInterest;
          subClauseI_Interest += penalInterest;
          subClauseIII_InterestDue += penalInterest;
          subClauseIV_InterestAccrued += penalInterest;
          subClauseV_FurtherInterest += penalInterest;
        }
      } else if (inv.paymentStatus === "PAID_AFTER_DUE_DATE_WITHIN_FY") {
        // Paid within FY, so allowed in current FY, but interest is payable under Section 16
        const paidDate = inv.actualPaymentDate ? new Date(inv.actualPaymentDate) : new Date();
        daysDelayed = Math.max(0, Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
        totalAllowed += inv.invoiceAmountInr;

        if (daysDelayed > 0) {
          const months = daysDelayed / 30.416;
          const r = penalRate / 100;
          penalInterest = Math.round((inv.invoiceAmountInr * (Math.pow(1 + r / 12, months) - 1)) * 100) / 100;
          totalPenalInterest += penalInterest;
          subClauseII_InterestPaid += penalInterest;
        }
      } else {
        // Paid on time
        totalAllowed += inv.invoiceAmountInr;
      }

      let auditTrail = "";
      if (!isEligible) {
        auditTrail = isTrader 
          ? "Wholesale/Retail Trader (NIC 45/46/47): Excluded from Section 43B(h) benefit per OM 2/1/2021-MSME."
          : "Medium Enterprise: Section 43B(h) applies exclusively to Micro and Small enterprises.";
      } else if (isDisallowed) {
        auditTrail = `DISALLOWED U/S 43B(h): Unpaid as on 31st March beyond ${limitDays} days (${daysDelayed} days delay). Added back to taxable income. Penal compound interest @ ${penalRate}%: INR ${penalInterest.toLocaleString('en-IN')}.`;
      } else if (inv.paymentStatus === "PAID_AFTER_DUE_DATE_WITHIN_FY") {
        auditTrail = `Allowed in FY (paid before 31st March), but attracted Section 16 penal interest of INR ${penalInterest.toLocaleString('en-IN')} (delayed by ${daysDelayed} days). Inadmissible u/s 23 of MSMED Act.`;
      } else {
        auditTrail = `Paid on time within statutory window of ${limitDays} days. Fully compliant.`;
      }

      auditedInvoices.push({
        id: inv.id,
        vendorName: inv.vendorName,
        udyamNo: inv.udyamRegistrationNo,
        enterpriseCategory: inv.enterpriseCategory,
        isEligibleFor43Bh: isEligible,
        statutoryLimitDays: limitDays,
        statutoryDueDate: dueDateStr,
        daysDelayed,
        isDisallowedUnder43Bh: isDisallowed,
        disallowanceAmountInr: disallowanceAmt,
        rbiBankRateAppliedPcnt: bankRate,
        penalInterestRateAppliedPcnt: penalRate,
        penalInterestPayableSection16Inr: penalInterest,
        isInadmissibleUnderSection23: penalInterest > 0,
        statutoryAuditTrail: auditTrail
      });
    }

    return {
      assesseeName: params.assesseeName,
      pan: params.pan,
      financialYear: params.financialYear,
      assessmentYear: params.assessmentYear,
      summary: {
        totalCreditorsExaminedCount: params.invoices.length,
        microAndSmallVendorsCount: microSmallCount,
        tradersAndMediumExcludedCount: excludedCount,
        totalInvoiceAmountInr: Math.round(totalInvAmount * 100) / 100,
        totalDisallowedUnder43BhInr: Math.round(totalDisallowed43Bh * 100) / 100,
        totalAllowedOnPaymentInr: Math.round(totalAllowed * 100) / 100,
        totalPenalInterestSection16Inr: Math.round(totalPenalInterest * 100) / 100,
        totalInadmissibleInterestSec23Inr: Math.round(totalPenalInterest * 100) / 100
      },
      clause22Disclosures: {
        principalUnpaidAtYearEnd_SubClauseI: Math.round(subClauseI_Principal * 100) / 100,
        interestDueRemainingUnpaidAtYearEnd_SubClauseI: Math.round(subClauseI_Interest * 100) / 100,
        interestPaidUnderSection16_SubClauseII: Math.round(subClauseII_InterestPaid * 100) / 100,
        interestDueAndPayableForDelay_SubClauseIII: Math.round(subClauseIII_InterestDue * 100) / 100,
        interestAccruedAndRemainingUnpaid_SubClauseIV: Math.round(subClauseIV_InterestAccrued * 100) / 100,
        furtherInterestRemainingDueInSucceedingYears_SubClauseV: Math.round(subClauseV_FurtherInterest * 100) / 100
      },
      auditedInvoices
    };
  }
}
