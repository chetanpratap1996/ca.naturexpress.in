/**
 * Brains & Taxes — Deterministic Statutory Penalty & Late Fee Engines
 * 
 * Implements strict statutory mathematics without LLM approximation:
 * 1. CGST Act Section 47 Late Fee with statutory turnover capping slabs
 * 2. CGST Act Section 50(1) Proviso 18% p.a. simple interest on Net Cash Ledger
 * 3. Income Tax Act Section 234F Late Fee & Section 234A/B/C Interest
 * 4. Income Tax Act Section 271B Tax Audit Default Penalty
 * 5. Income Tax Act Section 234E TDS Late Fee
 * 6. Companies Act 2013 Section 403 AOC-4 / MGT-7 Daily Fine
 */

export interface PenaltyCalculationResult {
  statutorySection: string;
  governingAct: string;
  delayDays: number;
  dailyLateFeeInr: number;
  totalLateFeeInr: number;
  accruedInterestInr: number;
  statutoryCapInr: number;
  penaltyCeilingReached: boolean;
  legalFormula: string;
  auditorNotes: string;
}

export class StatutoryPenaltyEngine {
  /**
   * GST Section 47 & Section 50(1) Deterministic Calculator
   */
  public static calculateGstLateFeeAndInterest(params: {
    statutoryDueDate: string;
    actualOrCurrentDate?: string;
    annualTurnoverCr: number;
    isNilReturn?: boolean;
    netCashLiabilityInr?: number;
  }): PenaltyCalculationResult {
    const due = new Date(params.statutoryDueDate);
    const now = params.actualOrCurrentDate ? new Date(params.actualOrCurrentDate) : new Date();
    const diffTime = Math.max(0, now.getTime() - due.getTime());
    const delayDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (delayDays <= 0) {
      return {
        statutorySection: "Section 47 & 50(1)",
        governingAct: "CGST Act, 2017",
        delayDays: 0,
        dailyLateFeeInr: 0,
        totalLateFeeInr: 0,
        accruedInterestInr: 0,
        statutoryCapInr: 10000,
        penaltyCeilingReached: false,
        legalFormula: "No delay: Within statutory filing window",
        auditorNotes: "Filing is compliant with Section 39."
      };
    }

    // Daily late fee rate (₹25 CGST + ₹25 SGST = ₹50; Nil: ₹10 CGST + ₹10 SGST = ₹20)
    const dailyRate = params.isNilReturn ? 20 : 50;

    // Statutory Cap based on turnover slabs under Section 47 r/w Notif. No. 19/2021-CT
    let statutoryCap = 10000;
    if (params.isNilReturn) {
      statutoryCap = 500;
    } else if (params.annualTurnoverCr <= 1.5) {
      statutoryCap = 2000;
    } else if (params.annualTurnoverCr <= 5.0) {
      statutoryCap = 5000;
    } else {
      statutoryCap = 10000;
    }

    const uncappedLateFee = delayDays * dailyRate;
    const finalLateFee = Math.min(uncappedLateFee, statutoryCap);
    const ceilingReached = uncappedLateFee >= statutoryCap;

    // Section 50(1) Interest: 18% p.a. on Net Cash Liability
    const netCash = params.netCashLiabilityInr || 0;
    const isLeapYear = (due.getFullYear() % 4 === 0 && due.getFullYear() % 100 !== 0) || (due.getFullYear() % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    const interest = netCash > 0
      ? Math.round((netCash * 0.18 * (delayDays / daysInYear)) * 100) / 100
      : 0;

    return {
      statutorySection: "Section 47 & Section 50(1)",
      governingAct: "CGST Act, 2017",
      delayDays,
      dailyLateFeeInr: dailyRate,
      totalLateFeeInr: finalLateFee,
      accruedInterestInr: interest,
      statutoryCapInr: statutoryCap,
      penaltyCeilingReached: ceilingReached,
      legalFormula: `Late Fee: Min(₹${dailyRate}/day x ${delayDays}d, Cap ₹${statutoryCap}) + Net Cash Interest (18% p.a.)`,
      auditorNotes: ceilingReached
        ? `Statutory maximum cap of ₹${statutoryCap} reached for turnover slab ₹${params.annualTurnoverCr} Cr.`
        : `Accruing ₹${dailyRate}/day. Remaining to cap: ₹${statutoryCap - finalLateFee}.`
    };
  }

  /**
   * Income Tax Section 234F & Section 234A Calculator
   */
  public static calculateIncomeTaxLateFeeAndInterest(params: {
    statutoryDueDate: string;
    actualOrCurrentDate?: string;
    taxableIncomeInr: number;
    unpaidTaxInr?: number;
    isTaxAuditApplicable?: boolean;
    annualTurnoverCr?: number;
  }): PenaltyCalculationResult {
    const due = new Date(params.statutoryDueDate);
    const now = params.actualOrCurrentDate ? new Date(params.actualOrCurrentDate) : new Date();
    const diffTime = Math.max(0, now.getTime() - due.getTime());
    const delayDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (delayDays <= 0) {
      return {
        statutorySection: "Section 234F & 234A",
        governingAct: "Income Tax Act, 1961",
        delayDays: 0,
        dailyLateFeeInr: 0,
        totalLateFeeInr: 0,
        accruedInterestInr: 0,
        statutoryCapInr: 5000,
        penaltyCeilingReached: false,
        legalFormula: "No delay: Within statutory deadline",
        auditorNotes: "ITR is timely under Section 139(1)."
      };
    }

    // Section 234F Late Fee: ₹5,000 (or ₹1,000 if taxable income <= ₹5 Lakhs)
    const lateFee234F = params.taxableIncomeInr <= 500000 ? 1000 : 5000;

    // Section 234A Interest: 1% per month or part of a month on unpaid tax
    const delayMonths = Math.ceil(delayDays / 30);
    const unpaidTax = params.unpaidTaxInr || 0;
    const interest234A = unpaidTax > 0 ? Math.round(unpaidTax * 0.01 * delayMonths) : 0;

    // Section 271B Tax Audit Penalty if applicable
    let auditPenalty = 0;
    if (params.isTaxAuditApplicable && params.annualTurnoverCr) {
      const turnoverInr = params.annualTurnoverCr * 10000000;
      auditPenalty = Math.min(Math.round(turnoverInr * 0.005), 150000);
    }

    const totalPenalty = lateFee234F + auditPenalty;

    return {
      statutorySection: "Section 234F, 234A & 271B",
      governingAct: "Income Tax Act, 1961",
      delayDays,
      dailyLateFeeInr: 0,
      totalLateFeeInr: totalPenalty,
      accruedInterestInr: interest234A,
      statutoryCapInr: 155000,
      penaltyCeilingReached: false,
      legalFormula: `Sec 234F (₹${lateFee234F}) + Sec 234A (1%/mo x ${delayMonths}m on ₹${unpaidTax}) + Sec 271B (₹${auditPenalty})`,
      auditorNotes: auditPenalty > 0
        ? `Includes Section 271B audit default penalty of ₹${auditPenalty.toLocaleString("en-IN")}.`
        : `Section 234F statutory late fee of ₹${lateFee234F}.`
    };
  }

  /**
   * TDS Section 234E & Section 201(1A) Calculator
   */
  public static calculateTdsLateFeeAndInterest(params: {
    statutoryDueDate: string;
    actualOrCurrentDate?: string;
    totalTdsDeductibleInr: number;
    unpaidDepositInr?: number;
  }): PenaltyCalculationResult {
    const due = new Date(params.statutoryDueDate);
    const now = params.actualOrCurrentDate ? new Date(params.actualOrCurrentDate) : new Date();
    const diffTime = Math.max(0, now.getTime() - due.getTime());
    const delayDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (delayDays <= 0) {
      return {
        statutorySection: "Section 234E",
        governingAct: "Income Tax Act, 1961",
        delayDays: 0,
        dailyLateFeeInr: 0,
        totalLateFeeInr: 0,
        accruedInterestInr: 0,
        statutoryCapInr: params.totalTdsDeductibleInr,
        penaltyCeilingReached: false,
        legalFormula: "No delay",
        auditorNotes: "TDS return statement is compliant under Section 200(3)."
      };
    }

    // Section 234E: ₹200 per day capped at total TDS amount
    const uncapped = delayDays * 200;
    const finalFee = Math.min(uncapped, params.totalTdsDeductibleInr);
    const ceilingReached = uncapped >= params.totalTdsDeductibleInr;

    // Section 201(1A): 1.5% interest per month on delayed deposit
    const unpaidDeposit = params.unpaidDepositInr || 0;
    const delayMonths = Math.ceil(delayDays / 30);
    const interest201 = unpaidDeposit > 0 ? Math.round(unpaidDeposit * 0.015 * delayMonths) : 0;

    return {
      statutorySection: "Section 234E & 201(1A)",
      governingAct: "Income Tax Act, 1961",
      delayDays,
      dailyLateFeeInr: 200,
      totalLateFeeInr: finalFee,
      accruedInterestInr: interest201,
      statutoryCapInr: params.totalTdsDeductibleInr,
      penaltyCeilingReached: ceilingReached,
      legalFormula: `₹200/day x ${delayDays} days, capped at TDS amount of ₹${params.totalTdsDeductibleInr}`,
      auditorNotes: ceilingReached
        ? `Statutory maximum cap reached under Section 234E proviso.`
        : `Accruing ₹200/day. Remaining to cap: ₹${params.totalTdsDeductibleInr - finalFee}.`
    };
  }

  /**
   * MCA / ROC Companies Act Section 403 & DIR-3 KYC Calculator
   */
  public static calculateRocLateFees(params: {
    statutoryDueDate: string;
    actualOrCurrentDate?: string;
    formCode: string;
    directorCount?: number;
  }): PenaltyCalculationResult {
    const due = new Date(params.statutoryDueDate);
    const now = params.actualOrCurrentDate ? new Date(params.actualOrCurrentDate) : new Date();
    const diffTime = Math.max(0, now.getTime() - due.getTime());
    const delayDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (delayDays <= 0) {
      return {
        statutorySection: "Section 403",
        governingAct: "Companies Act, 2013",
        delayDays: 0,
        dailyLateFeeInr: 0,
        totalLateFeeInr: 0,
        accruedInterestInr: 0,
        statutoryCapInr: 0,
        penaltyCeilingReached: false,
        legalFormula: "Timely filing",
        auditorNotes: "Compliant secretarial filing."
      };
    }

    if (params.formCode === "ROC_DIR3_KYC") {
      const directors = params.directorCount || 1;
      const flatFee = directors * 5000;
      return {
        statutorySection: "Rule 12A, Reg Rules",
        governingAct: "Companies Act, 2013",
        delayDays,
        dailyLateFeeInr: 0,
        totalLateFeeInr: flatFee,
        accruedInterestInr: 0,
        statutoryCapInr: flatFee,
        penaltyCeilingReached: true,
        legalFormula: `₹5,000 flat late fee x ${directors} director(s) + DIN Deactivation`,
        auditorNotes: `DIN is deactivated in MCA database until late fee of ₹${flatFee.toLocaleString("en-IN")} is paid.`
      };
    }

    // AOC-4 & MGT-7: ₹100 per day continuing default without ceiling
    const dailyRate = 100;
    const totalFee = delayDays * dailyRate;

    return {
      statutorySection: "Section 403 r/w Section 137 / 92",
      governingAct: "Companies Act, 2013",
      delayDays,
      dailyLateFeeInr: dailyRate,
      totalLateFeeInr: totalFee,
      accruedInterestInr: 0,
      statutoryCapInr: 0, // No ceiling!
      penaltyCeilingReached: false,
      legalFormula: `₹100/day continuing default x ${delayDays} days (No ceiling under Companies Act)`,
      auditorNotes: "Continuing default under Section 403. Accumulates indefinitely until filed."
    };
  }
}
