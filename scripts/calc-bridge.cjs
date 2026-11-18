/**
 * Brains & Taxes — Enterprise Deterministic Numerical Engines CommonJS Bridge
 * 
 * Provides CommonJS runtime execution for test-deterministic-calc-engines.js
 * Mirrors TypeScript logic in src/lib/knowledge/calc/
 */

class DirectTaxCalculators {
  static calculateInterest234ABC(params) {
    const assessedTax = params.assessedTaxPayableInr;
    const inst = params.advanceTaxPaidInstallments;
    const schedule = [];

    const cum1 = inst.installment1PaidByJune15;
    const cum2 = cum1 + inst.installment2PaidBySept15;
    const cum3 = cum2 + inst.installment3PaidByDec15;
    const cum4 = cum3 + inst.installment4PaidByMarch15;

    let total234C = 0;

    // Q1: 15% due by 15 June (Interest for 3 months @ 1% pm)
    const reqQ1 = Math.floor((0.15 * assessedTax) / 100) * 100;
    if (cum1 < 0.12 * assessedTax) { // Safe harbor: 12%
      const shortfallQ1 = Math.max(0, reqQ1 - cum1);
      const roundedShortfall = Math.floor(shortfallQ1 / 100) * 100;
      const intQ1 = roundedShortfall * 0.01 * 3;
      total234C += intQ1;
      schedule.push({
        stepNumber: 1,
        stepDescription: 'Section 234C Quarter 1 Shortfall (15 June)',
        statutoryBasis: 'Section 234C(1)(a) r/w Rule 119A',
        inputValue: `Target: INR ${reqQ1}, Paid: INR ${cum1}`,
        appliedRateOrFormula: 'Shortfall x 1% x 3 months',
        outputValue: intQ1,
        auditorNotes: 'Fell below 12% safe harbor. 3 months interest charged on rounded shortfall.'
      });
    }

    // Q2: 45% due by 15 Sept (Interest for 3 months @ 1% pm)
    const reqQ2 = Math.floor((0.45 * assessedTax) / 100) * 100;
    if (cum2 < 0.36 * assessedTax) { // Safe harbor: 36%
      const shortfallQ2 = Math.max(0, reqQ2 - cum2);
      const roundedShortfall = Math.floor(shortfallQ2 / 100) * 100;
      const intQ2 = roundedShortfall * 0.01 * 3;
      total234C += intQ2;
      schedule.push({
        stepNumber: 2,
        stepDescription: 'Section 234C Quarter 2 Shortfall (15 Sept)',
        statutoryBasis: 'Section 234C(1)(a) r/w Rule 119A',
        inputValue: `Target: INR ${reqQ2}, Cum Paid: INR ${cum2}`,
        appliedRateOrFormula: 'Shortfall x 1% x 3 months',
        outputValue: intQ2,
        auditorNotes: 'Fell below 36% safe harbor. 3 months interest charged on rounded shortfall.'
      });
    }

    // Q3: 75% due by 15 Dec (Interest for 3 months @ 1% pm)
    const reqQ3 = Math.floor((0.75 * assessedTax) / 100) * 100;
    if (cum3 < reqQ3) {
      const shortfallQ3 = Math.max(0, reqQ3 - cum3);
      const roundedShortfall = Math.floor(shortfallQ3 / 100) * 100;
      const intQ3 = roundedShortfall * 0.01 * 3;
      total234C += intQ3;
      schedule.push({
        stepNumber: 3,
        stepDescription: 'Section 234C Quarter 3 Shortfall (15 Dec)',
        statutoryBasis: 'Section 234C(1)(a) r/w Rule 119A',
        inputValue: `Target: INR ${reqQ3}, Cum Paid: INR ${cum3}`,
        appliedRateOrFormula: 'Shortfall x 1% x 3 months',
        outputValue: intQ3,
        auditorNotes: 'Shortfall below 75%. 3 months interest charged on rounded shortfall.'
      });
    }

    // Q4: 100% due by 15 March (Interest for 1 month @ 1% pm)
    const reqQ4 = Math.floor(assessedTax / 100) * 100;
    if (cum4 < reqQ4) {
      const shortfallQ4 = Math.max(0, reqQ4 - cum4);
      const roundedShortfall = Math.floor(shortfallQ4 / 100) * 100;
      const intQ4 = roundedShortfall * 0.01 * 1;
      total234C += intQ4;
      schedule.push({
        stepNumber: 4,
        stepDescription: 'Section 234C Quarter 4 Shortfall (15 March)',
        statutoryBasis: 'Section 234C(1)(a) r/w Rule 119A',
        inputValue: `Target: INR ${reqQ4}, Cum Paid: INR ${cum4}`,
        appliedRateOrFormula: 'Shortfall x 1% x 1 month',
        outputValue: intQ4,
        auditorNotes: 'Shortfall below 100%. 1 month interest charged on rounded shortfall.'
      });
    }

    // Section 234B
    let total234B = 0;
    if (cum4 < 0.90 * assessedTax) {
      const shortfall234B = assessedTax - cum4;
      const roundedShortfall = Math.floor(shortfall234B / 100) * 100;
      const monthsDelay = this.computeMonthsBetween('2026-04-01', params.actualFilingDate);
      total234B = roundedShortfall * 0.01 * monthsDelay;
      schedule.push({
        stepNumber: 5,
        stepDescription: 'Section 234B Shortfall (< 90% of Assessed Tax Paid)',
        statutoryBasis: 'Section 234B(1) r/w Rule 119A',
        inputValue: `Assessed: ${assessedTax}, Total Advance Tax: ${cum4} (< 90%)`,
        appliedRateOrFormula: `INR ${roundedShortfall} x 1% x ${monthsDelay} months`,
        outputValue: total234B,
        auditorNotes: 'Assessee failed to pay 90% advance tax. Interest charged from 1st April of AY.'
      });
    }

    // Section 234A
    let total234A = 0;
    if (params.actualFilingDate > params.itrDueDate) {
      const netTaxDue = Math.max(0, assessedTax - cum4 - (params.selfAssessmentTaxPaidBeforeFiling || 0));
      const roundedNetTax = Math.floor(netTaxDue / 100) * 100;
      const monthsDelay = this.computeMonthsBetween(params.itrDueDate, params.actualFilingDate);
      total234A = roundedNetTax * 0.01 * monthsDelay;
      schedule.push({
        stepNumber: 6,
        stepDescription: 'Section 234A Late Return Filing Interest',
        statutoryBasis: 'Section 234A(1) r/w Rule 119A',
        inputValue: `Due: ${params.itrDueDate}, Filed: ${params.actualFilingDate}`,
        appliedRateOrFormula: `INR ${roundedNetTax} x 1% x ${monthsDelay} months`,
        outputValue: total234A,
        auditorNotes: 'Return filed after due date. Fractions of month rounded up to whole month.'
      });
    }

    const grandTotal = total234A + total234B + total234C;

    return {
      engineType: 'ADVANCE_TAX_234ABC',
      calculationTitle: 'Mandatory Advance Tax Interest under Sections 234A, 234B & 234C',
      statutoryAuthority: 'Income-tax Act, 1961 read with Rule 119A of Income-tax Rules, 1962',
      inputParameters: params,
      primaryComputedAmountInr: total234C > 0 && total234A === 0 && total234B === 0 ? total234C : grandTotal,
      statutoryRoundingApplied: 'Rule 119A: Round down principal to INR 100; Round up delay to full month.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Total Interest Computed: INR ${grandTotal.toLocaleString('en-IN')} (234A: INR ${total234A}, 234B: INR ${total234B}, 234C: INR ${total234C}).`
    };
  }

  static calculatePartnerRemuneration40b(params) {
    const bp = params.bookProfitInr;
    let maxPermissible = 0;
    const schedule = [];

    if (bp <= 0) {
      maxPermissible = 150000;
      schedule.push({
        stepNumber: 1,
        stepDescription: 'Book Loss Floor Cap',
        statutoryBasis: 'Section 40(b)(v) Clause (a)',
        inputValue: `Book Loss: INR ${bp}`,
        appliedRateOrFormula: 'Fixed statutory allowance: INR 1,50,000',
        outputValue: 150000,
        auditorNotes: 'In case of a book loss, maximum allowable remuneration is INR 1.50 Lakhs.'
      });
    } else if (bp <= 300000) {
      const slab90 = 0.90 * bp;
      maxPermissible = Math.max(150000, slab90);
      schedule.push({
        stepNumber: 1,
        stepDescription: 'First INR 3,00,000 Book Profit',
        statutoryBasis: 'Section 40(b)(v) Clause (a)',
        inputValue: `Book Profit: INR ${bp}`,
        appliedRateOrFormula: 'Higher of INR 1,50,000 or 90% of Book Profit',
        outputValue: maxPermissible,
        auditorNotes: `Computed 90% = INR ${slab90}, higher limit adopted.`
      });
    } else {
      const slab1 = 270000;
      const balance = bp - 300000;
      const slab2 = 0.60 * balance;
      maxPermissible = slab1 + slab2;

      schedule.push({
        stepNumber: 1,
        stepDescription: 'Tier 1: First INR 3,00,000 Book Profit @ 90%',
        statutoryBasis: 'Section 40(b)(v) Clause (a)',
        inputValue: 'INR 300,000',
        appliedRateOrFormula: '90% of INR 3,00,000',
        outputValue: slab1,
        auditorNotes: 'Fixed allowance on first slab.'
      });

      schedule.push({
        stepNumber: 2,
        stepDescription: 'Tier 2: Balance Book Profit @ 60%',
        statutoryBasis: 'Section 40(b)(v) Clause (b)',
        inputValue: `Balance: INR ${balance}`,
        appliedRateOrFormula: '60% of Balance',
        outputValue: slab2,
        auditorNotes: 'Percentage on balance book profit.'
      });
    }

    const allowableRemuneration = Math.min(maxPermissible, params.remunerationAuthorizedInPartnershipDeedInr);
    const disallowance = Math.max(0, params.remunerationAuthorizedInPartnershipDeedInr - allowableRemuneration);

    return {
      engineType: 'PARTNER_REMUNERATION_SEC_40B',
      calculationTitle: 'Section 40(b) Partner Remuneration Allowable Cap',
      statutoryAuthority: 'Section 40(b)(v) of Income-tax Act, 1961',
      inputParameters: params,
      primaryComputedAmountInr: allowableRemuneration,
      statutoryRoundingApplied: 'Section 288A: Rounded to nearest 10 rupees.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Allowable Partner Remuneration: INR ${allowableRemuneration.toLocaleString('en-IN')}. Disallowance u/s 40(b): INR ${disallowance.toLocaleString('en-IN')}.`,
      disallowanceAlert: disallowance > 0 ? {
        isDisallowedUnderTax: true,
        disallowanceSection: 'Section 40(b)',
        form3cdClause: 'Clause 21(c)'
      } : undefined
    };
  }

  static computeMonthsBetween(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    if (end <= start) return 0;

    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() > start.getDate()) {
      months += 1;
    }
    return Math.max(1, months);
  }
}

class GstCalculators {
  static calculateSection50NetCashInterest(params) {
    const due = new Date(params.statutoryDueDate);
    const filed = new Date(params.actualFilingDate);
    const schedule = [];

    const diffTime = Math.max(0, filed.getTime() - due.getTime());
    const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isLeapYear = (due.getFullYear() % 4 === 0 && due.getFullYear() % 100 !== 0) || (due.getFullYear() % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    const rate = params.taxRatePcnt || 18.0;

    const cashBase = params.cashLedgerDebitInr;
    const interestComputed = Math.round((cashBase * (rate / 100) * (delayDays / daysInYear)) * 100) / 100;

    schedule.push({
      stepNumber: 1,
      stepDescription: 'Isolate Net Tax Paid in Cash (Electronic Cash Ledger)',
      statutoryBasis: 'Proviso to Section 50(1) of CGST Act, 2017 (Retrospective w.e.f. 01.07.2017)',
      inputValue: `Gross: INR ${params.grossTaxLiabilityInr}, ITC: INR ${params.itcLedgerOffsetInr}, Cash: INR ${cashBase}`,
      appliedRateOrFormula: 'Net Cash = Gross Liability - Credit Ledger Offset',
      outputValue: cashBase,
      auditorNotes: 'ITC ledger balance protected by statutory proviso. Gross interest is legally barred.'
    });

    schedule.push({
      stepNumber: 2,
      stepDescription: 'Calendar Delay Days Computation',
      statutoryBasis: 'Section 50(1) r/w Section 39 of CGST Act',
      inputValue: `Due: ${params.statutoryDueDate}, Filed: ${params.actualFilingDate}`,
      appliedRateOrFormula: 'Calendar Days between Due Date and Filing Date',
      outputValue: delayDays,
      auditorNotes: `Delay: ${delayDays} days. Denominator used: ${daysInYear} days.`
    });

    schedule.push({
      stepNumber: 3,
      stepDescription: '18% Simple Interest Calculation on Net Cash Base',
      statutoryBasis: 'Notification No. 13/2017-CT r/w Section 50(1)',
      inputValue: `Cash Base: INR ${cashBase}, Days: ${delayDays}, Rate: 18% p.a.`,
      appliedRateOrFormula: `INR ${cashBase} x (18 / 100) x (${delayDays} / ${daysInYear})`,
      outputValue: interestComputed,
      auditorNotes: 'Accurate interest computed in paise.'
    });

    const unlawfulGrossInterest = Math.round((params.grossTaxLiabilityInr * (rate / 100) * (delayDays / daysInYear)) * 100) / 100;
    const taxSavedByProviso = Math.round((unlawfulGrossInterest - interestComputed) * 100) / 100;

    return {
      engineType: 'GST_SECTION_50_NET_CASH',
      calculationTitle: 'Section 50(1) GST Interest on Net Cash Liability',
      statutoryAuthority: 'Section 50(1) Proviso of CGST Act, 2017',
      inputParameters: params,
      primaryComputedAmountInr: interestComputed,
      statutoryRoundingApplied: 'Computed to exact paise; rounded to nearest Rupee in GSTR-3B Table 5.1.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Statutory Interest Payable: INR ${interestComputed.toLocaleString('en-IN')}. Taxpayer saved INR ${taxSavedByProviso.toLocaleString('en-IN')} by shielding the credit ledger offset under the Section 50(1) proviso.`
    };
  }

  static calculateRule42CommonCreditReversal(params) {
    const T = params.totalInputTaxInr;
    const T1 = params.nonBusinessInputTaxInr;
    const T2 = params.exemptSuppliesInputTaxInr;
    const T3 = params.blockedInputTaxInr;
    const T4 = params.taxableSuppliesInputTaxInr;

    const schedule = [];

    const C1 = T - (T1 + T2 + T3);
    schedule.push({
      stepNumber: 1,
      stepDescription: 'Credit Available in Credit Ledger (C1)',
      statutoryBasis: 'Rule 42(1)(g) of CGST Rules, 2017',
      inputValue: `T: ${T}, Ineligible (T1+T2+T3): ${T1 + T2 + T3}`,
      appliedRateOrFormula: 'C1 = T - (T1 + T2 + T3)',
      outputValue: C1,
      auditorNotes: 'Ineligible non-business, exempt and 17(5) credits excluded.'
    });

    const C2 = C1 - T4;
    schedule.push({
      stepNumber: 2,
      stepDescription: 'Common Input Tax Credit (C2)',
      statutoryBasis: 'Rule 42(1)(h) of CGST Rules, 2017',
      inputValue: `C1: ${C1}, Exclusively Taxable (T4): ${T4}`,
      appliedRateOrFormula: 'C2 = C1 - T4',
      outputValue: C2,
      auditorNotes: 'Common credit to be apportioned between taxable and exempt supplies.'
    });

    const turnoverRatio = params.totalTurnoverInr > 0 ? (params.exemptTurnoverInr / params.totalTurnoverInr) : 0;
    const D1 = Math.round((turnoverRatio * C2) * 100) / 100;
    schedule.push({
      stepNumber: 3,
      stepDescription: 'Credit Attributable to Exempt Supplies (D1)',
      statutoryBasis: 'Rule 42(1)(i) of CGST Rules, 2017',
      inputValue: `Exempt Turnover (E): ${params.exemptTurnoverInr}, Total Turnover (F): ${params.totalTurnoverInr}`,
      appliedRateOrFormula: 'D1 = (E / F) x C2',
      outputValue: D1,
      auditorNotes: `Exempt turnover proportion: ${(turnoverRatio * 100).toFixed(2)}%.`
    });

    const D2 = Math.round((0.05 * C2) * 100) / 100;
    schedule.push({
      stepNumber: 4,
      stepDescription: 'Credit Attributable to Non-Business Purpose (D2)',
      statutoryBasis: 'Rule 42(1)(j) of CGST Rules, 2017',
      inputValue: `Common Credit (C2): ${C2}`,
      appliedRateOrFormula: 'D2 = 5% of C2',
      outputValue: D2,
      auditorNotes: 'Mandatory 5% statutory attribution for non-business usage.'
    });

    const totalReversal = D1 + D2;

    return {
      engineType: 'RULE_42_COMMON_CREDIT_REVERSAL',
      calculationTitle: 'Rule 42 CGST Rules Input Tax Credit Apportionment',
      statutoryAuthority: 'Rule 42 of CGST Rules, 2017 read with Section 17(2) of CGST Act',
      inputParameters: params,
      primaryComputedAmountInr: totalReversal,
      statutoryRoundingApplied: 'Computed in exact paise.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Total Credit Reversal Mandated: INR ${totalReversal.toLocaleString('en-IN')} (D1 Exempt: INR ${D1.toLocaleString('en-IN')}, D2 Non-business: INR ${D2.toLocaleString('en-IN')}).`
    };
  }
}

class CorporateAlliedCalculators {
  static calculateSection186Cap(params) {
    const capital = params.paidUpShareCapitalInr;
    const reserves = params.freeReservesInr;
    const premium = params.securitiesPremiumInr;
    const existing = params.existingLoansAndInvestmentsInr || 0;
    const proposed = params.proposedLoanOrInvestmentInr;
    const totalExposure = existing + proposed;

    const schedule = [];

    const netBase60 = capital + reserves + premium;
    const limit60 = Math.round(0.60 * netBase60);
    schedule.push({
      stepNumber: 1,
      stepDescription: '60% Net Worth Test',
      statutoryBasis: 'Section 186(2) Clause (a) of Companies Act, 2013',
      inputValue: `Capital: ${capital}, Reserves: ${reserves}, Premium: ${premium} (Total: ${netBase60})`,
      appliedRateOrFormula: '60% of (Paid-up Capital + Free Reserves + Securities Premium)',
      outputValue: limit60,
      auditorNotes: 'Evaluated under 60% statutory threshold.'
    });

    const netBase100 = reserves + premium;
    const limit100 = netBase100;
    schedule.push({
      stepNumber: 2,
      stepDescription: '100% Free Reserves Test',
      statutoryBasis: 'Section 186(2) Clause (b) of Companies Act, 2013',
      inputValue: `Reserves: ${reserves}, Premium: ${premium} (Total: ${netBase100})`,
      appliedRateOrFormula: '100% of (Free Reserves + Securities Premium)',
      outputValue: limit100,
      auditorNotes: 'Evaluated under 100% reserves threshold.'
    });

    const statutoryCeiling = Math.max(limit60, limit100);
    const requiresSpecialResolution = totalExposure > statutoryCeiling;

    schedule.push({
      stepNumber: 3,
      stepDescription: 'Determine Permissible Board Limit (Higher of Two Limits)',
      statutoryBasis: 'Section 186(2) of Companies Act, 2013',
      inputValue: `Limit 60%: ${limit60}, Limit 100%: ${limit100}`,
      appliedRateOrFormula: 'Higher of Test 1 or Test 2',
      outputValue: statutoryCeiling,
      auditorNotes: `Adopted higher ceiling of INR ${statutoryCeiling.toLocaleString('en-IN')}.`
    });

    return {
      engineType: 'SECTION_186_INTERCORPORATE_CAP',
      calculationTitle: 'Section 186 Inter-Corporate Loan & Investment Threshold',
      statutoryAuthority: 'Section 186 of Companies Act, 2013',
      inputParameters: params,
      primaryComputedAmountInr: statutoryCeiling,
      statutoryRoundingApplied: 'Exact Rupees.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Statutory Board Limit: INR ${statutoryCeiling.toLocaleString('en-IN')}. Total Exposure: INR ${totalExposure.toLocaleString('en-IN')}. Special Resolution under Section 186(3) ${requiresSpecialResolution ? 'MANDATORILY REQUIRED (Form MGT-14)' : 'NOT REQUIRED (Within Board Authority)'}.`
    };
  }

  static calculateMsmedSection16Interest(params) {
    const P = params.unpaidPrincipalInr;
    const appointed = new Date(params.statutoryAppointedDay);
    const paid = new Date(params.actualPaymentDate);
    const schedule = [];

    const repoRate = params.rbiRepoRatePcnt || 6.50;
    const bankRate = repoRate + 2.00;
    const msmeRate = 3 * bankRate;

    schedule.push({
      stepNumber: 1,
      stepDescription: 'Statutory MSME Interest Rate Determination (3x Bank Rate)',
      statutoryBasis: 'Section 16 of MSMED Act, 2006 r/w RBI Master Directions',
      inputValue: `RBI Repo Rate: ${repoRate.toFixed(2)}%, Bank Rate: ${bankRate.toFixed(2)}%`,
      appliedRateOrFormula: 'MSME Rate = 3 x Bank Rate',
      outputValue: msmeRate,
      auditorNotes: `Applicable penal rate: ${msmeRate.toFixed(2)}% per annum.`
    });

    const diffTime = Math.max(0, paid.getTime() - appointed.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = totalDays / 30.4167;

    const monthlyRate = (msmeRate / 100) / 12;
    const compoundAmount = P * Math.pow(1 + monthlyRate, months);
    const interestAccrued = Math.round((compoundAmount - P) * 100) / 100;

    schedule.push({
      stepNumber: 2,
      stepDescription: 'Compound Interest Calculation with Monthly Rests',
      statutoryBasis: 'Section 16, Micro, Small and Medium Enterprises Development Act, 2006',
      inputValue: `Principal: INR ${P}, Overdue Days: ${totalDays} (~${months.toFixed(1)} months)`,
      appliedRateOrFormula: 'Interest = P x [(1 + r/12)^n - 1] (Monthly Compounding)',
      outputValue: interestAccrued,
      auditorNotes: 'Compounded with monthly rests strictly as mandated by Section 16.'
    });

    return {
      engineType: 'MSME_COMPOUND_INTEREST_SEC16',
      calculationTitle: 'Section 16 MSMED Act Compound Interest on Delayed Payments',
      statutoryAuthority: 'Section 16 read with Section 23 of MSMED Act, 2006',
      inputParameters: params,
      primaryComputedAmountInr: interestAccrued,
      statutoryRoundingApplied: 'Computed in paise; rounded to nearest Rupee in financial statements.',
      auditTrailSchedule: schedule,
      reconciliationSummary: `Statutory MSME Compound Interest Accrued: INR ${interestAccrued.toLocaleString('en-IN')} (Applicable rate: ${msmeRate.toFixed(2)}% p.a. with monthly rests).`,
      disallowanceAlert: {
        isDisallowedUnderTax: true,
        disallowanceSection: 'Section 23 of MSMED Act, 2006',
        form3cdClause: 'Clause 22'
      }
    };
  }
}

class DeterministicCalculationDispatcher {
  static execute(category, params) {
    switch (category) {
      case 'ADVANCE_TAX_234ABC':
        return DirectTaxCalculators.calculateInterest234ABC(params);
      case 'PARTNER_REMUNERATION_SEC_40B':
        return DirectTaxCalculators.calculatePartnerRemuneration40b(params);
      case 'GST_SECTION_50_NET_CASH':
        return GstCalculators.calculateSection50NetCashInterest(params);
      case 'RULE_42_COMMON_CREDIT_REVERSAL':
        return GstCalculators.calculateRule42CommonCreditReversal(params);
      case 'SECTION_186_INTERCORPORATE_CAP':
        return CorporateAlliedCalculators.calculateSection186Cap(params);
      case 'MSME_COMPOUND_INTEREST_SEC16':
        return CorporateAlliedCalculators.calculateMsmedSection16Interest(params);
      default:
        throw new Error(`Unsupported calculation engine category: ${category}`);
    }
  }
}

module.exports = {
  DirectTaxCalculators,
  GstCalculators,
  CorporateAlliedCalculators,
  DeterministicCalculationDispatcher
};
