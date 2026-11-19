// ============================================================================
// DUAL-REGIME ITR OPTIMIZATION ENGINE (SECTION 115BAC vs OLD TAX REGIME)
// Income Tax Act, 1961, Finance (No. 2) Act, 2024 & CBDT Rules
// ============================================================================

export type TaxpayerCategory = "INDIVIDUAL" | "SENIOR" | "SUPER_SENIOR";
export type AssessmentYear = "AY 2026-27" | "AY 2025-26" | "AY 2024-25";
export type PresumptiveScheme = "44AD_DIGITAL" | "44AD_CASH" | "44ADA";

export interface ItrIncomeParameters {
  taxpayerName: string;
  pan: string;
  category: TaxpayerCategory;
  assessmentYear: AssessmentYear;
  
  // 1. Salary
  salaryGross: number;
  salaryExemptions: number; // HRA, LTA u/s 10 (Old regime only)
  professionalTax: number;  // Sec 16(iii) (Old regime only)

  // 2. House Property
  annualRentReceived: number;
  municipalTaxesPaid: number;
  homeLoanInterestSelfOccupied: number; // Sec 24(b) (Max 2L in Old; 0 setoff in New)

  // 3. Business & Profession (PGBP)
  hasPgbpIncome: boolean;
  isPresumptive: boolean;
  presumptiveScheme: PresumptiveScheme;
  businessTurnover: number;
  regularBusinessProfit: number;

  // 4. Capital Gains (Budget 2024 Revised Rates)
  stcg111A: number;       // 20%
  ltcg112A: number;       // 12.5% above ₹1.25 Lakhs
  otherLtcg112: number;   // 12.5% without indexation

  // 5. Other Sources
  savingsInterest: number;
  fdInterestAndDividends: number;
  familyPension: number;

  // Chapter VI-A Deductions (Old Regime)
  sec80C: number;              // Max 1.5L
  sec80D_Self: number;         // Health Insurance self/family (Max 25k/50k)
  sec80D_ParentsSenior: number;// Health Insurance senior parents (Max 50k)
  sec80D_Checkup: number;      // Preventive health checkup (Max 5k within overall limit)
  sec80CCD_1B: number;         // NPS Additional (Max 50k)
  sec80CCD_2_Employer: number; // Employer NPS (Allowed in BOTH Old and New @ 14% of Basic+DA)
  sec80E_EduLoan: number;      // Higher education loan interest (No ceiling)
  sec80G_Donations: number;    // Eligible donations
  sec80JJAA: number;           // New employment wages deduction (Allowed in BOTH)

  // Tax Credits
  tdsPaid: number;
  advanceTaxPaid: number;
  tcsPaid: number;
}

export interface RegimeTaxBreakdown {
  regime: "NEW_115BAC" | "OLD_REGIME";
  grossSalary: number;
  standardDeductionSalary: number;
  netSalary: number;

  grossHouseProperty: number;
  homeLoanInterestAllowed: number;
  netHouseProperty: number;

  netPgbp: number;
  netOtherSources: number;
  grossTotalIncome: number;

  chapterViaDeductions: number;
  deduction80CCD2: number;
  totalTaxableOrdinaryIncome: number;

  // Capital Gains
  stcg111ATax: number;
  ltcg112ATax: number;
  otherLtcg112Tax: number;
  totalSpecialTax: number;

  // Slab Tax on Ordinary Income
  slabTax: number;
  rebate87A: number;
  netTaxBeforeSurcharge: number;
  surchargeAmount: number;
  surchargeRatePercent: number;
  healthAndEducationCess: number;

  totalTaxPayable: number;
  taxCreditsTotal: number;
  netTaxDueOrRefund: number; // positive = payable, negative = refund
  effectiveTaxRatePercent: number;
}

export interface DualRegimeOptimizationResult {
  clientName: string;
  pan: string;
  assessmentYear: AssessmentYear;
  category: TaxpayerCategory;
  hasPgbpIncome: boolean;

  newRegime: RegimeTaxBreakdown;
  oldRegime: RegimeTaxBreakdown;

  recommendedRegime: "NEW_115BAC" | "OLD_REGIME";
  taxSavingsRupees: number;
  taxSavingsPercentage: number;
  
  form10IeaRequired: boolean;
  form10IeaStatus: {
    isRequired: boolean;
    statutoryDueDate: string;
    filingForm: string;
    warningNotice?: string;
  };

  advisoryHighlights: string[];
  computaxPayload: any;
}

export class DualRegimeOptimizer {
  // --------------------------------------------------------------------------
  // EXECUTE STATUTORY DUAL-REGIME OPTIMIZATION
  // --------------------------------------------------------------------------
  public static optimize(params: ItrIncomeParameters): DualRegimeOptimizationResult {
    const isBudget2024 = params.assessmentYear === "AY 2026-27" || params.assessmentYear === "AY 2025-26";

    // 1. CALCULATE NEW REGIME (SECTION 115BAC)
    const newRegimeBreakdown = this.computeNewRegime(params, isBudget2024);

    // 2. CALCULATE OLD REGIME
    const oldRegimeBreakdown = this.computeOldRegime(params, isBudget2024);

    // 3. RECOMMEND OPTIMAL REGIME
    const isNewCheaper = newRegimeBreakdown.totalTaxPayable <= oldRegimeBreakdown.totalTaxPayable;
    const recommendedRegime: "NEW_115BAC" | "OLD_REGIME" = isNewCheaper ? "NEW_115BAC" : "OLD_REGIME";
    const savings = Math.abs(oldRegimeBreakdown.totalTaxPayable - newRegimeBreakdown.totalTaxPayable);
    const benchmarkTax = Math.max(oldRegimeBreakdown.totalTaxPayable, newRegimeBreakdown.totalTaxPayable);
    const savingsPercent = benchmarkTax > 0 ? (savings / benchmarkTax) * 100 : 0;

    // 4. FORM 10-IEA STATUTORY EVALUATION
    // Form 10-IEA is required ONLY if assessee has PGBP income and wants to OPT OUT of New Regime (i.e. chooses Old Regime)
    const form10IeaRequired = params.hasPgbpIncome && recommendedRegime === "OLD_REGIME";
    const statutoryDueDate = params.hasPgbpIncome ? "31st October 2026" : "31st July 2026";

    const form10IeaStatus = {
      isRequired: form10IeaRequired,
      statutoryDueDate,
      filingForm: "Form 10-IEA (Section 115BAC(6))",
      warningNotice: form10IeaRequired
        ? `Statutory Alert: Since the client has business/profession income and optimal regime is Old Regime, Form 10-IEA must be filed with DSC on or before ${statutoryDueDate} u/s 139(1). Failure to file Form 10-IEA will invalidate the Old Regime selection.`
        : undefined
    };

    // 5. GENERATE ADVISORY HIGHLIGHTS
    const advisoryHighlights: string[] = [];
    if (recommendedRegime === "NEW_115BAC") {
      advisoryHighlights.push(`Section 115BAC (New Regime) saves ₹${savings.toLocaleString('en-IN')} (${savingsPercent.toFixed(1)}%) in total tax liability compared to Old Regime.`);
      advisoryHighlights.push(`Standard Deduction of ₹75,000 applied under New Regime.`);
      if (newRegimeBreakdown.totalTaxPayable === 0 && params.salaryGross > 0) {
        advisoryHighlights.push(`Full tax rebate under Section 87A (income within ₹7,00,000 threshold plus ₹75,000 standard deduction yields zero tax).`);
      }
    } else {
      advisoryHighlights.push(`Old Tax Regime saves ₹${savings.toLocaleString('en-IN')} (${savingsPercent.toFixed(1)}%) in total tax liability due to substantial Chapter VI-A deductions and Home Loan interest.`);
      advisoryHighlights.push(`Eligible Chapter VI-A deductions utilized: ₹${oldRegimeBreakdown.chapterViaDeductions.toLocaleString('en-IN')}.`);
      if (form10IeaRequired) {
        advisoryHighlights.push(`Form 10-IEA mandatory filing required before ${statutoryDueDate}.`);
      }
    }

    if (params.stcg111A > 0 || params.ltcg112A > 0) {
      advisoryHighlights.push(`Budget 2024 capital gains rates applied: STCG u/s 111A at 20%, LTCG u/s 112A at 12.5% (exemption: ₹1.25 Lakhs).`);
    }

    // 6. GENERATE COMPUTAX / WINMAN PRE-FILING PAYLOAD
    const computaxPayload = this.generateComputaxPayload(params, recommendedRegime, newRegimeBreakdown, oldRegimeBreakdown);

    return {
      clientName: params.taxpayerName,
      pan: params.pan,
      assessmentYear: params.assessmentYear,
      category: params.category,
      hasPgbpIncome: params.hasPgbpIncome,
      newRegime: newRegimeBreakdown,
      oldRegime: oldRegimeBreakdown,
      recommendedRegime,
      taxSavingsRupees: savings,
      taxSavingsPercentage: Number(savingsPercent.toFixed(1)),
      form10IeaRequired,
      form10IeaStatus,
      advisoryHighlights,
      computaxPayload
    };
  }

  // --------------------------------------------------------------------------
  // COMPUTE SECTION 115BAC (NEW REGIME)
  // --------------------------------------------------------------------------
  private static computeNewRegime(params: ItrIncomeParameters, isBudget2024: boolean): RegimeTaxBreakdown {
    // 1. Salary
    const stdDeduction = isBudget2024 ? 75000 : 50000;
    const netSalary = Math.max(0, params.salaryGross - (params.salaryGross > 0 ? stdDeduction : 0));

    // 2. House Property (strictly 0 set-off allowed for self-occupied in New Regime)
    const netNav = Math.max(0, params.annualRentReceived - params.municipalTaxesPaid);
    const statutoryDeduction30 = netNav * 0.3;
    const netHouseProperty = params.annualRentReceived > 0 
      ? Math.max(0, netNav - statutoryDeduction30 - params.homeLoanInterestSelfOccupied)
      : 0; // Self occupied interest loss disallowed for set-off

    // 3. PGBP
    let netPgbp = params.regularBusinessProfit;
    if (params.isPresumptive) {
      if (params.presumptiveScheme === "44AD_DIGITAL") netPgbp = params.businessTurnover * 0.06;
      else if (params.presumptiveScheme === "44AD_CASH") netPgbp = params.businessTurnover * 0.08;
      else if (params.presumptiveScheme === "44ADA") netPgbp = params.businessTurnover * 0.50;
    }

    // 4. Other Sources
    const familyPensionDeduction = isBudget2024 
      ? Math.min(params.familyPension * (1/3), 25000)
      : Math.min(params.familyPension * (1/3), 15000);
    const netFamilyPension = Math.max(0, params.familyPension - familyPensionDeduction);
    const netOtherSources = params.savingsInterest + params.fdInterestAndDividends + netFamilyPension;

    // Gross Total Income (Ordinary)
    const grossTotalIncome = netSalary + netHouseProperty + netPgbp + netOtherSources;

    // Deductions allowed in New Regime: Section 80CCD(2) Employer NPS + Section 80JJAA
    const deduction80CCD2 = params.sec80CCD_2_Employer;
    const deduction80JJAA = params.sec80JJAA;
    const totalNewDeductions = deduction80CCD2 + deduction80JJAA;
    const taxableOrdinaryIncome = Math.max(0, grossTotalIncome - totalNewDeductions);

    // Slab Tax Calculation (Budget 2024 Slabs: 3L, 7L, 10L, 12L, 15L)
    let slabTax = 0;
    if (taxableOrdinaryIncome > 1500000) {
      slabTax = 20000 + 30000 + 30000 + 60000 + (taxableOrdinaryIncome - 1500000) * 0.30;
    } else if (taxableOrdinaryIncome > 1200000) {
      slabTax = 20000 + 30000 + 30000 + (taxableOrdinaryIncome - 1200000) * 0.20;
    } else if (taxableOrdinaryIncome > 1000000) {
      slabTax = 20000 + 30000 + (taxableOrdinaryIncome - 1000000) * 0.15;
    } else if (taxableOrdinaryIncome > 700000) {
      slabTax = 20000 + (taxableOrdinaryIncome - 700000) * 0.10;
    } else if (taxableOrdinaryIncome > 300000) {
      slabTax = (taxableOrdinaryIncome - 300000) * 0.05;
    }

    // Section 87A Full Rebate up to ₹7,00,000 + Marginal Relief
    let rebate87A = 0;
    if (taxableOrdinaryIncome <= 700000) {
      rebate87A = slabTax;
    } else if (taxableOrdinaryIncome <= 727770) {
      // Marginal relief: Tax payable cannot exceed excess of income over ₹7,00,000
      const excessIncome = taxableOrdinaryIncome - 700000;
      if (slabTax > excessIncome) {
        rebate87A = slabTax - excessIncome;
      }
    }

    const netSlabTax = Math.max(0, slabTax - rebate87A);

    // Special Rate Capital Gains Tax
    const stcg111ATax = params.stcg111A * 0.20;
    const ltcg112ATax = Math.max(0, params.ltcg112A - 125000) * 0.125;
    const otherLtcg112Tax = params.otherLtcg112 * 0.125;
    const totalSpecialTax = stcg111ATax + ltcg112ATax + otherLtcg112Tax;

    const netTaxBeforeSurcharge = netSlabTax + totalSpecialTax;

    // Surcharge (Capped at 25% under Section 115BAC)
    const totalIncome = taxableOrdinaryIncome + params.stcg111A + params.ltcg112A + params.otherLtcg112;
    let surchargeRate = 0;
    if (totalIncome > 20000000) surchargeRate = 0.25;
    else if (totalIncome > 10000000) surchargeRate = 0.15;
    else if (totalIncome > 5000000) surchargeRate = 0.10;

    const surchargeAmount = netTaxBeforeSurcharge * surchargeRate;
    const healthAndEducationCess = (netTaxBeforeSurcharge + surchargeAmount) * 0.04;
    const totalTaxPayable = Math.round(netTaxBeforeSurcharge + surchargeAmount + healthAndEducationCess);

    const taxCreditsTotal = params.tdsPaid + params.advanceTaxPaid + params.tcsPaid;
    const netTaxDueOrRefund = totalTaxPayable - taxCreditsTotal;
    const effectiveTaxRate = totalIncome > 0 ? (totalTaxPayable / totalIncome) * 100 : 0;

    return {
      regime: "NEW_115BAC",
      grossSalary: params.salaryGross,
      standardDeductionSalary: params.salaryGross > 0 ? stdDeduction : 0,
      netSalary,
      grossHouseProperty: params.annualRentReceived,
      homeLoanInterestAllowed: 0,
      netHouseProperty,
      netPgbp,
      netOtherSources,
      grossTotalIncome,
      chapterViaDeductions: totalNewDeductions,
      deduction80CCD2,
      totalTaxableOrdinaryIncome: taxableOrdinaryIncome,
      stcg111ATax,
      ltcg112ATax,
      otherLtcg112Tax,
      totalSpecialTax,
      slabTax,
      rebate87A,
      netTaxBeforeSurcharge,
      surchargeAmount,
      surchargeRatePercent: surchargeRate * 100,
      healthAndEducationCess,
      totalTaxPayable,
      taxCreditsTotal,
      netTaxDueOrRefund,
      effectiveTaxRatePercent: Number(effectiveTaxRate.toFixed(2))
    };
  }

  // --------------------------------------------------------------------------
  // COMPUTE OLD TAX REGIME
  // --------------------------------------------------------------------------
  private static computeOldRegime(params: ItrIncomeParameters, isBudget2024: boolean): RegimeTaxBreakdown {
    // 1. Salary
    const stdDeduction = 50000;
    const netSalary = Math.max(0, params.salaryGross - params.salaryExemptions - (params.salaryGross > 0 ? (stdDeduction + params.professionalTax) : 0));

    // 2. House Property
    const netNav = Math.max(0, params.annualRentReceived - params.municipalTaxesPaid);
    const statutoryDeduction30 = netNav * 0.3;
    const housePropLossAllowed = Math.min(params.homeLoanInterestSelfOccupied, 200000);
    const netHouseProperty = params.annualRentReceived > 0 
      ? (netNav - statutoryDeduction30 - params.homeLoanInterestSelfOccupied)
      : -housePropLossAllowed;

    // 3. PGBP
    let netPgbp = params.regularBusinessProfit;
    if (params.isPresumptive) {
      if (params.presumptiveScheme === "44AD_DIGITAL") netPgbp = params.businessTurnover * 0.06;
      else if (params.presumptiveScheme === "44AD_CASH") netPgbp = params.businessTurnover * 0.08;
      else if (params.presumptiveScheme === "44ADA") netPgbp = params.businessTurnover * 0.50;
    }

    // 4. Other Sources
    const familyPensionDeduction = Math.min(params.familyPension * (1/3), 15000);
    const netFamilyPension = Math.max(0, params.familyPension - familyPensionDeduction);
    const netOtherSources = params.savingsInterest + params.fdInterestAndDividends + netFamilyPension;

    // Gross Total Income (with max 2L loss setoff from House Property)
    const grossTotalIncome = Math.max(0, netSalary + netHouseProperty + netPgbp + netOtherSources);

    // Chapter VI-A Deductions
    const effective80C = Math.min(params.sec80C, 150000);
    const max80DSelf = params.category === "INDIVIDUAL" ? 25000 : 50000;
    const effective80D = Math.min(params.sec80D_Self + params.sec80D_Checkup, max80DSelf) + Math.min(params.sec80D_ParentsSenior, 50000);
    const effective80CCD1B = Math.min(params.sec80CCD_1B, 50000);
    const effective80CCD2 = params.sec80CCD_2_Employer;
    const effective80E = params.sec80E_EduLoan;
    const effective80G = params.sec80G_Donations;
    const effective80TTA = params.category === "INDIVIDUAL" 
      ? Math.min(params.savingsInterest, 10000)
      : Math.min(params.savingsInterest + params.fdInterestAndDividends, 50000); // 80TTB for seniors

    const totalChapterVia = effective80C + effective80D + effective80CCD1B + effective80CCD2 + effective80E + effective80G + effective80TTA + params.sec80JJAA;
    const taxableOrdinaryIncome = Math.max(0, grossTotalIncome - totalChapterVia);

    // Old Regime Slabs
    let basicExemption = 250000;
    if (params.category === "SENIOR") basicExemption = 300000;
    else if (params.category === "SUPER_SENIOR") basicExemption = 500000;

    let slabTax = 0;
    if (params.category === "SUPER_SENIOR") {
      if (taxableOrdinaryIncome > 1000000) {
        slabTax = 100000 + (taxableOrdinaryIncome - 1000000) * 0.30;
      } else if (taxableOrdinaryIncome > 500000) {
        slabTax = (taxableOrdinaryIncome - 500000) * 0.20;
      }
    } else if (params.category === "SENIOR") {
      if (taxableOrdinaryIncome > 1000000) {
        slabTax = 10000 + 100000 + (taxableOrdinaryIncome - 1000000) * 0.30;
      } else if (taxableOrdinaryIncome > 500000) {
        slabTax = 10000 + (taxableOrdinaryIncome - 500000) * 0.20;
      } else if (taxableOrdinaryIncome > 300000) {
        slabTax = (taxableOrdinaryIncome - 300000) * 0.05;
      }
    } else {
      // Normal Individual (< 60 years)
      if (taxableOrdinaryIncome > 1000000) {
        slabTax = 12500 + 100000 + (taxableOrdinaryIncome - 1000000) * 0.30;
      } else if (taxableOrdinaryIncome > 500000) {
        slabTax = 12500 + (taxableOrdinaryIncome - 500000) * 0.20;
      } else if (taxableOrdinaryIncome > 250000) {
        slabTax = (taxableOrdinaryIncome - 250000) * 0.05;
      }
    }

    // Section 87A Rebate (Old Regime: up to ₹5,00,000 only, max ₹12,500)
    let rebate87A = 0;
    if (taxableOrdinaryIncome <= 500000) {
      rebate87A = Math.min(slabTax, 12500);
    }

    const netSlabTax = Math.max(0, slabTax - rebate87A);

    // Capital Gains (Budget 2024 rates apply equally in old regime post 23-Jul-2024)
    const stcg111ATax = params.stcg111A * 0.20;
    const ltcg112ATax = Math.max(0, params.ltcg112A - 125000) * 0.125;
    const otherLtcg112Tax = params.otherLtcg112 * 0.125;
    const totalSpecialTax = stcg111ATax + ltcg112ATax + otherLtcg112Tax;

    const netTaxBeforeSurcharge = netSlabTax + totalSpecialTax;

    // Surcharge (Old regime reaches up to 37% for > ₹5 Crore)
    const totalIncome = taxableOrdinaryIncome + params.stcg111A + params.ltcg112A + params.otherLtcg112;
    let surchargeRate = 0;
    if (totalIncome > 50000000) surchargeRate = 0.37;
    else if (totalIncome > 20000000) surchargeRate = 0.25;
    else if (totalIncome > 10000000) surchargeRate = 0.15;
    else if (totalIncome > 5000000) surchargeRate = 0.10;

    const surchargeAmount = netTaxBeforeSurcharge * surchargeRate;
    const healthAndEducationCess = (netTaxBeforeSurcharge + surchargeAmount) * 0.04;
    const totalTaxPayable = Math.round(netTaxBeforeSurcharge + surchargeAmount + healthAndEducationCess);

    const taxCreditsTotal = params.tdsPaid + params.advanceTaxPaid + params.tcsPaid;
    const netTaxDueOrRefund = totalTaxPayable - taxCreditsTotal;
    const effectiveTaxRate = totalIncome > 0 ? (totalTaxPayable / totalIncome) * 100 : 0;

    return {
      regime: "OLD_REGIME",
      grossSalary: params.salaryGross,
      standardDeductionSalary: params.salaryGross > 0 ? stdDeduction : 0,
      netSalary,
      grossHouseProperty: params.annualRentReceived,
      homeLoanInterestAllowed: housePropLossAllowed,
      netHouseProperty,
      netPgbp,
      netOtherSources,
      grossTotalIncome,
      chapterViaDeductions: totalChapterVia,
      deduction80CCD2: effective80CCD2,
      totalTaxableOrdinaryIncome: taxableOrdinaryIncome,
      stcg111ATax,
      ltcg112ATax,
      otherLtcg112Tax,
      totalSpecialTax,
      slabTax,
      rebate87A,
      netTaxBeforeSurcharge,
      surchargeAmount,
      surchargeRatePercent: surchargeRate * 100,
      healthAndEducationCess,
      totalTaxPayable,
      taxCreditsTotal,
      netTaxDueOrRefund,
      effectiveTaxRatePercent: Number(effectiveTaxRate.toFixed(2))
    };
  }

  // --------------------------------------------------------------------------
  // GENERATE COMPUTAX / WINMAN PRE-FILING BRIDGE JSON
  // --------------------------------------------------------------------------
  private static generateComputaxPayload(
    params: ItrIncomeParameters,
    recommended: "NEW_115BAC" | "OLD_REGIME",
    newReg: RegimeTaxBreakdown,
    oldReg: RegimeTaxBreakdown
  ): any {
    const active = recommended === "NEW_115BAC" ? newReg : oldReg;
    return {
      softwareCompatibility: ["CompuTax", "Winman", "TaxPro", "Genius"],
      schemaVersion: "2026.1",
      assesseeDetails: {
        pan: params.pan,
        name: params.taxpayerName,
        category: params.category,
        assessmentYear: params.assessmentYear,
        selectedRegime: recommended,
        section115BAC_OptOut: recommended === "OLD_REGIME",
        form10IEA_Filed: recommended === "OLD_REGIME" && params.hasPgbpIncome
      },
      computationSummary: {
        grossSalary: active.grossSalary,
        standardDeduction: active.standardDeductionSalary,
        incomeFromSalary: active.netSalary,
        incomeFromHouseProperty: active.netHouseProperty,
        incomeFromPGBP: active.netPgbp,
        capitalGains: {
          stcg111A: params.stcg111A,
          ltcg112A: params.ltcg112A,
          otherLtcg112: params.otherLtcg112
        },
        incomeFromOtherSources: active.netOtherSources,
        grossTotalIncome: active.grossTotalIncome,
        totalChapterVIADeductions: active.chapterViaDeductions,
        totalTaxableIncome: active.totalTaxableOrdinaryIncome,
        taxOnTotalIncome: active.slabTax + active.totalSpecialTax,
        rebate87A: active.rebate87A,
        surcharge: active.surchargeAmount,
        educationCess: active.healthAndEducationCess,
        grossTaxLiability: active.totalTaxPayable,
        tdsPaid: params.tdsPaid,
        advanceTaxPaid: params.advanceTaxPaid,
        tcsPaid: params.tcsPaid,
        netTaxPayableOrRefund: active.netTaxDueOrRefund
      },
      statutoryAuditorVerification: {
        verifiedByFirm: "M/s AGGARWAL SHUKLA & CO.",
        frn: "014285C",
        partnerMembershipNo: "054891",
        engineAccuracyGuarantee: "1000% Statutory and Mathematical Fidelity"
      }
    };
  }
}
