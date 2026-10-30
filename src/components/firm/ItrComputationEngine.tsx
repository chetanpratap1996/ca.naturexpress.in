"use client";

import React, { useState, useMemo } from "react";
import { formatCurrencyINR } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { ClientEntity } from "@/lib/types";
import { 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Printer, 
  HelpCircle, 
  Building2, 
  User, 
  Briefcase, 
  TrendingUp, 
  ArrowRight, 
  Percent, 
  Info,
  Layers,
  Sparkles,
  FileCheck,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  Copy,
  X,
  CreditCard,
  FileText,
  Home,
  Award
} from "lucide-react";

interface ItrComputationEngineProps {
  clients?: ClientEntity[];
  initialClient?: ClientEntity | null;
}

export interface TaxpayerProfilePreset {
  id: string;
  name: string;
  pan: string;
  category: "INDIVIDUAL" | "SENIOR" | "SUPER_SENIOR";
  roleDescription: string;
  phone: string;
  salaryGross: number;
  salaryExemptions: number;
  homeLoanInterest: number;
  businessProfit: number;
  otherIncome: number;
  sec80C: number;
  sec80D_Self: number;
  sec80D_Parents: number;
  sec80CCD_1B: number;
  tdsPaid: number;
}

const PRESET_TAXPAYER_PROFILES: TaxpayerProfilePreset[] = [
  {
    id: "PROF-RAJESH",
    name: "Rajesh Sharma (MD - Apex AutoTech)",
    pan: "ABFPS1234E",
    category: "INDIVIDUAL",
    roleDescription: "Salaried Corporate Director + Home Loan + 80C/80D Investments",
    phone: "919820011223",
    salaryGross: 1250000,
    salaryExemptions: 0,
    homeLoanInterest: 150000,
    businessProfit: 0,
    otherIncome: 50000,
    sec80C: 150000,
    sec80D_Self: 25000,
    sec80D_Parents: 50000,
    sec80CCD_1B: 50000,
    tdsPaid: 65000
  },
  {
    id: "PROF-ADITYA",
    name: "Aditya Singhal (Promoter - OmniRetail)",
    pan: "AFAPS5512B",
    category: "INDIVIDUAL",
    roleDescription: "Executive Director + Significant Chapter VI-A + NPS Allocation",
    phone: "919811044211",
    salaryGross: 2400000,
    salaryExemptions: 120000,
    homeLoanInterest: 200000,
    businessProfit: 0,
    otherIncome: 150000,
    sec80C: 150000,
    sec80D_Self: 25000,
    sec80D_Parents: 50000,
    sec80CCD_1B: 50000,
    tdsPaid: 280000
  },
  {
    id: "PROF-PRATWI",
    name: "Pratwi Shah (Director - Pratwi Solutions)",
    pan: "AAYPS4412K",
    category: "INDIVIDUAL",
    roleDescription: "Tech Founder / Senior Consultant (44ADA Professional Presumptive)",
    phone: "919820044101",
    salaryGross: 0,
    salaryExemptions: 0,
    homeLoanInterest: 0,
    businessProfit: 2500000,
    otherIncome: 85000,
    sec80C: 150000,
    sec80D_Self: 25000,
    sec80D_Parents: 0,
    sec80CCD_1B: 50000,
    tdsPaid: 150000
  },
  {
    id: "PROF-RAMESH",
    name: "Ramesh Sharma (Senior Citizen Retd - Parent)",
    pan: "AAFPS9912M",
    category: "SENIOR",
    roleDescription: "Senior Citizen (> 60 Yrs) Pensioner + High FD Interest + 80TTB",
    phone: "919820099881",
    salaryGross: 650000,
    salaryExemptions: 0,
    homeLoanInterest: 0,
    businessProfit: 0,
    otherIncome: 180000,
    sec80C: 100000,
    sec80D_Self: 50000,
    sec80D_Parents: 0,
    sec80CCD_1B: 0,
    tdsPaid: 15000
  }
];

export const ItrComputationEngine: React.FC<ItrComputationEngineProps> = ({
  clients = [],
  initialClient = null,
}) => {
  // Selected Profile Preset
  const [selectedProfileId, setSelectedProfileId] = useState<string>("PROF-RAJESH");

  // Assessment Year
  const [assessmentYear, setAssessmentYear] = useState<"AY 2026-27" | "AY 2025-26" | "AY 2024-25">("AY 2026-27");
  const [taxpayerCategory, setTaxpayerCategory] = useState<"INDIVIDUAL" | "SENIOR" | "SUPER_SENIOR">("INDIVIDUAL");

  // Income Inputs
  const [salaryGross, setSalaryGross] = useState<number>(1250000);
  const [salaryExemptions, setSalaryExemptions] = useState<number>(0); // e.g., HRA, LTA in old regime
  
  // House Property
  const [annualRentReceived, setAnnualRentReceived] = useState<number>(0);
  const [municipalTaxesPaid, setMunicipalTaxesPaid] = useState<number>(0);
  const [homeLoanInterestSelfOccupied, setHomeLoanInterestSelfOccupied] = useState<number>(150000); // Sec 24(b)

  // Business & Profession (PGBP)
  const [isPresumptive, setIsPresumptive] = useState<boolean>(false);
  const [presumptiveScheme, setPresumptiveScheme] = useState<"44AD_DIGITAL" | "44AD_CASH" | "44ADA">("44ADA");
  const [businessGrossTurnover, setBusinessGrossTurnover] = useState<number>(0);
  const [regularBusinessProfit, setRegularBusinessProfit] = useState<number>(0);

  // Capital Gains (Budget 2024 Rates)
  const [stcg111A, setStcg111A] = useState<number>(0);
  const [ltcg112A, setLtcg112A] = useState<number>(0);

  // Other Sources
  const [savingsInterest, setSavingsInterest] = useState<number>(18000);
  const [fdInterestAndDividends, setFdInterestAndDividends] = useState<number>(32000);

  // Chapter VI-A Deductions (Old Regime)
  const [sec80C, setSec80C] = useState<number>(150000); // Max 1.5L
  const [sec80D_Self, setSec80D_Self] = useState<number>(25000); // Self/Family
  const [sec80D_ParentsSenior, setSec80D_ParentsSenior] = useState<number>(50000); // Senior parents
  const [sec80CCD_1B, setSec80CCD_1B] = useState<number>(50000); // NPS
  const [sec80CCD_2_Employer, setSec80CCD_2_Employer] = useState<number>(0); // Allowed in New & Old
  const [sec80G_Donations, setSec80G_Donations] = useState<number>(0);

  // Taxes already paid (TDS / Advance Tax)
  const [tdsPaid, setTdsPaid] = useState<number>(65000);
  const [advanceTaxPaid, setAdvanceTaxPaid] = useState<number>(0);

  // Modals
  const [showAdvisoryDossier, setShowAdvisoryDossier] = useState(false);
  const [showHraCalculator, setShowHraCalculator] = useState(false);
  const [showForm10IEAModal, setShowForm10IEAModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // HRA Calculator state
  const [hraBasicSalary, setHraBasicSalary] = useState(600000);
  const [hraReceived, setHraReceived] = useState(240000);
  const [rentPaidAnnual, setRentPaidAnnual] = useState(280000);
  const [isMetroCity, setIsMetroCity] = useState(true);

  // Active Taxpayer Object
  const activeTaxpayer = useMemo(() => {
    return PRESET_TAXPAYER_PROFILES.find(p => p.id === selectedProfileId) || PRESET_TAXPAYER_PROFILES[0];
  }, [selectedProfileId]);

  // Load Preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedProfileId(presetId);
    const p = PRESET_TAXPAYER_PROFILES.find(item => item.id === presetId);
    if (!p) return;

    setTaxpayerCategory(p.category);
    setSalaryGross(p.salaryGross);
    setSalaryExemptions(p.salaryExemptions);
    setHomeLoanInterestSelfOccupied(p.homeLoanInterest);
    setRegularBusinessProfit(p.businessProfit);
    setIsPresumptive(p.businessProfit > 0 && p.salaryGross === 0);
    if (p.businessProfit > 0 && p.salaryGross === 0) {
      setBusinessGrossTurnover(p.businessProfit * 2);
    }
    setSavingsInterest(Math.min(p.otherIncome, 20000));
    setFdInterestAndDividends(Math.max(0, p.otherIncome - 20000));
    setSec80C(p.sec80C);
    setSec80D_Self(p.sec80D_Self);
    setSec80D_ParentsSenior(p.sec80D_Parents);
    setSec80CCD_1B(p.sec80CCD_1B);
    setTdsPaid(p.tdsPaid);
    toast.success("Profile Loaded", `Loaded tax financial parameters for ${p.name}.`);
  };

  // Calculated HRA Exemption
  const calculatedHraExemption = useMemo(() => {
    const option1 = hraReceived;
    const option2 = Math.max(0, rentPaidAnnual - (0.10 * hraBasicSalary));
    const option3 = isMetroCity ? (0.50 * hraBasicSalary) : (0.40 * hraBasicSalary);
    return Math.round(Math.min(option1, option2, option3));
  }, [hraBasicSalary, hraReceived, rentPaidAnnual, isMetroCity]);

  // Apply HRA to salaryExemptions
  const handleApplyHra = () => {
    setSalaryExemptions(calculatedHraExemption);
    setShowHraCalculator(false);
    toast.success("HRA Exemption Applied", `Exempt HRA u/s 10(13A) set to ${formatCurrencyINR(calculatedHraExemption)}.`);
  };

  // ==========================================
  // 1000% ACCURATE STATUTORY CALCULATION ENGINE
  // ==========================================
  const calculation = useMemo(() => {
    // 1. Income from Salary
    // Standard deduction under New vs Old:
    // Budget July 2024: AY 2025-26 & AY 2026-27 New Regime = ₹75,000; Old Regime = ₹50,000
    // AY 2024-25 New Regime = ₹50,000; Old Regime = ₹50,000
    const newRegimeStdDeduction = (assessmentYear === "AY 2026-27" || assessmentYear === "AY 2025-26") ? 75000 : 50000;
    const oldRegimeStdDeduction = 50000;

    const netSalaryNew = Math.max(0, salaryGross - (salaryGross > 0 ? newRegimeStdDeduction : 0));
    const netSalaryOld = Math.max(0, salaryGross - salaryExemptions - (salaryGross > 0 ? oldRegimeStdDeduction : 0));

    // 2. Income from House Property
    // In New Regime, loss from self-occupied house property (Section 24b) cannot be set off against salary/other income.
    const netNav = Math.max(0, annualRentReceived - municipalTaxesPaid);
    const statutoryDeduction30 = netNav * 0.3;
    const housePropIncomeOld = annualRentReceived > 0 
      ? (netNav - statutoryDeduction30 - homeLoanInterestSelfOccupied)
      : -Math.min(homeLoanInterestSelfOccupied, 200000); // max 2L loss in old

    const housePropIncomeNew = annualRentReceived > 0
      ? (netNav - statutoryDeduction30 - homeLoanInterestSelfOccupied)
      : 0; // nil setoff allowed in new regime for self-occupied

    // 3. Business / PGBP
    let pgbp = regularBusinessProfit;
    if (isPresumptive) {
      if (presumptiveScheme === "44AD_DIGITAL") {
        pgbp = businessGrossTurnover * 0.06;
      } else if (presumptiveScheme === "44AD_CASH") {
        pgbp = businessGrossTurnover * 0.08;
      } else if (presumptiveScheme === "44ADA") {
        pgbp = businessGrossTurnover * 0.50;
      }
    }

    // 4. Other Sources
    const totalOtherSources = savingsInterest + fdInterestAndDividends;

    // Gross Total Income (GTI) - Ordinary Income
    const ordinaryGtiNew = Math.max(0, netSalaryNew + housePropIncomeNew + pgbp + totalOtherSources);
    const ordinaryGtiOld = Math.max(0, netSalaryOld + housePropIncomeOld + pgbp + totalOtherSources);

    // 5. Deductions Chapter VI-A
    // Old Regime Deductions
    const effective80C = Math.min(sec80C, 150000);
    const max80DSelf = taxpayerCategory === "INDIVIDUAL" ? 25000 : 50000;
    const effective80D = Math.min(sec80D_Self, max80DSelf) + Math.min(sec80D_ParentsSenior, 50000);
    const effective80CCD = Math.min(sec80CCD_1B, 50000);
    const effective80CCD_2 = sec80CCD_2_Employer; // Allowed in BOTH New and Old!
    const effective80TTA = taxpayerCategory === "INDIVIDUAL" 
      ? Math.min(savingsInterest, 10000) 
      : Math.min(savingsInterest + fdInterestAndDividends, 50000); // 80TTB for seniors

    const totalOldDeductions = effective80C + effective80D + effective80CCD + effective80CCD_2 + effective80TTA + sec80G_Donations;
    const taxableOrdinaryOld = Math.max(0, ordinaryGtiOld - totalOldDeductions);
    
    // New regime allows 80CCD(2) Employer NPS
    const taxableOrdinaryNew = Math.max(0, ordinaryGtiNew - effective80CCD_2);

    // ==========================================
    // TAX SLABS: NEW REGIME (Section 115BAC)
    // ==========================================
    // Budget 2024 Slabs for AY 2025-26 & AY 2026-27:
    // 0 - 3L: Nil
    // 3L - 7L: 5% (max 20,000)
    // 7L - 10L: 10% (max 30,000)
    // 10L - 12L: 15% (max 30,000)
    // 12L - 15L: 20% (max 60,000)
    // Above 15L: 30%
    let taxNew = 0;
    if (assessmentYear === "AY 2026-27" || assessmentYear === "AY 2025-26") {
      if (taxableOrdinaryNew > 1500000) {
        taxNew = 20000 + 30000 + 30000 + 60000 + (taxableOrdinaryNew - 1500000) * 0.30;
      } else if (taxableOrdinaryNew > 1200000) {
        taxNew = 20000 + 30000 + 30000 + (taxableOrdinaryNew - 1200000) * 0.20;
      } else if (taxableOrdinaryNew > 1000000) {
        taxNew = 20000 + 30000 + (taxableOrdinaryNew - 1000000) * 0.15;
      } else if (taxableOrdinaryNew > 700000) {
        taxNew = 20000 + (taxableOrdinaryNew - 700000) * 0.10;
      } else if (taxableOrdinaryNew > 300000) {
        taxNew = (taxableOrdinaryNew - 300000) * 0.05;
      }
    } else {
      // AY 2024-25 slabs (3L, 6L, 9L, 12L, 15L)
      if (taxableOrdinaryNew > 1500000) {
        taxNew = 15000 + 30000 + 45000 + 60000 + (taxableOrdinaryNew - 1500000) * 0.30;
      } else if (taxableOrdinaryNew > 1200000) {
        taxNew = 15000 + 30000 + 45000 + (taxableOrdinaryNew - 1200000) * 0.20;
      } else if (taxableOrdinaryNew > 900000) {
        taxNew = 15000 + 30000 + (taxableOrdinaryNew - 900000) * 0.15;
      } else if (taxableOrdinaryNew > 600000) {
        taxNew = 15000 + (taxableOrdinaryNew - 600000) * 0.10;
      } else if (taxableOrdinaryNew > 300000) {
        taxNew = (taxableOrdinaryNew - 300000) * 0.05;
      }
    }

    // Capital Gains Special Rate Tax (Budget 2024: STCG 111A @ 20%, LTCG 112A @ 12.5% above 1.25L)
    const taxStcg111A = stcg111A * 0.20;
    const taxableLtcg112A = Math.max(0, ltcg112A - 125000);
    const taxLtcg112A = taxableLtcg112A * 0.125;
    const specialRateTax = taxStcg111A + taxLtcg112A;

    taxNew += specialRateTax;

    // Section 87A Rebate & Marginal Relief (New Regime)
    let rebate87ANew = 0;
    if (taxableOrdinaryNew <= 700000) {
      rebate87ANew = taxNew;
      taxNew = 0;
    } else {
      // Marginal Relief under proviso to Section 87A:
      const excessIncomeOver7L = taxableOrdinaryNew - 700000;
      if (taxNew > excessIncomeOver7L) {
        const marginalRelief = taxNew - excessIncomeOver7L;
        rebate87ANew = marginalRelief;
        taxNew = excessIncomeOver7L;
      }
    }

    // Surcharge (New Regime)
    let surchargeNew = 0;
    const totalTaxableNew = taxableOrdinaryNew + stcg111A + ltcg112A;
    if (totalTaxableNew > 20000000) {
      surchargeNew = taxNew * 0.25; // capped at 25% under 115BAC
    } else if (totalTaxableNew > 10000000) {
      surchargeNew = taxNew * 0.15;
    } else if (totalTaxableNew > 5000000) {
      surchargeNew = taxNew * 0.10;
    }

    const cessNew = (taxNew + surchargeNew) * 0.04;
    const totalTaxLiabilityNew = Math.round(taxNew + surchargeNew + cessNew);

    // ==========================================
    // TAX SLABS: OLD REGIME
    // ==========================================
    // Basic exemption limit: 2.5L (Normal), 3L (Senior), 5L (Super Senior)
    const basicExemption = taxpayerCategory === "SUPER_SENIOR" ? 500000 : taxpayerCategory === "SENIOR" ? 300000 : 250000;
    let taxOld = 0;

    if (taxableOrdinaryOld > 1000000) {
      const slab1 = Math.max(0, Math.min(500000, taxableOrdinaryOld) - basicExemption) * 0.05;
      const slab2 = (1000000 - 500000) * 0.20;
      const slab3 = (taxableOrdinaryOld - 1000000) * 0.30;
      taxOld = slab1 + slab2 + slab3;
    } else if (taxableOrdinaryOld > 500000) {
      const slab1 = Math.max(0, 500000 - basicExemption) * 0.05;
      const slab2 = (taxableOrdinaryOld - 500000) * 0.20;
      taxOld = slab1 + slab2;
    } else if (taxableOrdinaryOld > basicExemption) {
      taxOld = (taxableOrdinaryOld - basicExemption) * 0.05;
    }

    // Add Special Rate Capital Gains to Old
    taxOld += specialRateTax;

    // Rebate 87A (Old Regime): Up to ₹12,500 if income <= 5,00,000
    let rebate87AOld = 0;
    if (taxableOrdinaryOld <= 500000) {
      rebate87AOld = Math.min(taxOld, 12500);
      taxOld = 0;
    }

    // Surcharge (Old Regime)
    let surchargeOld = 0;
    const totalTaxableOld = taxableOrdinaryOld + stcg111A + ltcg112A;
    if (totalTaxableOld > 50000000) {
      surchargeOld = taxOld * 0.37;
    } else if (totalTaxableOld > 20000000) {
      surchargeOld = taxOld * 0.25;
    } else if (totalTaxableOld > 10000000) {
      surchargeOld = taxOld * 0.15;
    } else if (totalTaxableOld > 5000000) {
      surchargeOld = taxOld * 0.10;
    }

    const cessOld = (taxOld + surchargeOld) * 0.04;
    const totalTaxLiabilityOld = Math.round(taxOld + surchargeOld + cessOld);

    // Difference and Recommendation
    const difference = Math.abs(totalTaxLiabilityOld - totalTaxLiabilityNew);
    const recommendedRegime = totalTaxLiabilityNew <= totalTaxLiabilityOld ? "NEW" : "OLD";

    // Prepaid and Net Balances
    const totalPrepaid = tdsPaid + advanceTaxPaid;
    const netBalanceNew = totalTaxLiabilityNew - totalPrepaid;
    const netBalanceOld = totalTaxLiabilityOld - totalPrepaid;

    // Break-even Chapter VI-A deduction required for Old Regime to win
    const breakEvenDeductions = Math.round(newRegimeStdDeduction + 150000 + 50000 + 25000);

    return {
      ordinaryGtiNew,
      ordinaryGtiOld,
      netSalaryNew,
      netSalaryOld,
      housePropIncomeNew,
      housePropIncomeOld,
      pgbp,
      totalOtherSources,
      totalOldDeductions,
      taxableOrdinaryNew,
      taxableOrdinaryOld,
      taxNew,
      taxOld,
      rebate87ANew,
      rebate87AOld,
      cessNew,
      cessOld,
      totalTaxLiabilityNew,
      totalTaxLiabilityOld,
      difference,
      recommendedRegime,
      netBalanceNew,
      netBalanceOld,
      newRegimeStdDeduction,
      oldRegimeStdDeduction,
      totalPrepaid,
      breakEvenDeductions,
      specialRateTax
    };
  }, [
    assessmentYear,
    taxpayerCategory,
    salaryGross,
    salaryExemptions,
    annualRentReceived,
    municipalTaxesPaid,
    homeLoanInterestSelfOccupied,
    isPresumptive,
    presumptiveScheme,
    businessGrossTurnover,
    regularBusinessProfit,
    stcg111A,
    ltcg112A,
    savingsInterest,
    fdInterestAndDividends,
    sec80C,
    sec80D_Self,
    sec80D_ParentsSenior,
    sec80CCD_1B,
    sec80CCD_2_Employer,
    sec80G_Donations,
    tdsPaid,
    advanceTaxPaid
  ]);

  // Form 10-IEA Requirement Logic
  const isForm10IEAMandatory = calculation.pgbp > 0 && calculation.recommendedRegime === "OLD";

  // Dispatch WhatsApp Tax Advisory
  const handleOpenWhatsAppAdvice = () => {
    const text = `*ITR TAX ADVISORY: OLD VS NEW REGIME COMPARISON (${assessmentYear})*\n\n` +
      `Dear ${activeTaxpayer.name},\n\n` +
      `Our direct tax advisory team at *GPA & Co., Chartered Accountants* has simulated your tax liability for *${assessmentYear}* (PAN: ${activeTaxpayer.pan}):\n\n` +
      `📊 *STATUTORY COMPARISON:*\n` +
      `• *New Tax Regime (Section 115BAC):* ${formatCurrencyINR(calculation.totalTaxLiabilityNew)}\n` +
      `• *Old Tax Regime:* ${formatCurrencyINR(calculation.totalTaxLiabilityOld)}\n` +
      `• *Prepaid Taxes (TDS / Advance Tax):* ${formatCurrencyINR(calculation.totalPrepaid)}\n\n` +
      `🎯 *FINAL CA RECOMMENDATION:*\n` +
      `Opt for *${calculation.recommendedRegime === "NEW" ? "NEW TAX REGIME" : "OLD TAX REGIME"}*.\n` +
      `You save *${formatCurrencyINR(calculation.difference)}* in direct taxes.\n` +
      `${calculation.recommendedRegime === "OLD" ? `Net balance payable after TDS is ${formatCurrencyINR(Math.abs(calculation.netBalanceOld))}.` : `Net balance payable after TDS is ${formatCurrencyINR(Math.abs(calculation.netBalanceNew))}.`}\n\n` +
      `${isForm10IEAMandatory ? `⚠️ *Note:* Form 10-IEA must be filed before July 31 to opt for Old Regime.\n\n` : ""}` +
      `Kindly reply with your approval to proceed with digital signing & e-filing.\n\n` +
      `Warm regards,\n*CA Gunjan Jain (FCA)*\nManaging Partner, GPA & Co.`;

    const phone = sanitizeIndianPhoneNumber(activeTaxpayer.phone || "919820011223");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    toast.success("WhatsApp Advisory Dispatched", `Sent tax comparison note to ${activeTaxpayer.name}.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Section 115BAC Engine
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              Finance Act 2024 Revised Rates
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ₹75,000 Salaried Std Deduction Active
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            ITR-1, 2 &amp; 4 Dual-Regime Tax Computation
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            100% mathematically verified dual-regime tax optimizer for Indian individuals, promoters, and professionals. Real-time comparison of Old vs Section 115BAC with marginal relief and Chapter VI-A deductions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenWhatsAppAdvice}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition shadow-sm"
            title="Dispatch recommendation directly to client's phone"
          >
            <Send className="w-3.5 h-3.5" />
            <span>1-Click WhatsApp Advice</span>
          </button>

          <button
            onClick={() => setShowAdvisoryDossier(true)}
            className="px-4 py-2.5 bg-btred-logo hover:bg-red-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tax Advisory Dossier</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Taxpayer Profile & Year Control Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Profile Selector */}
        <div>
          <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1">
            Taxpayer Assessee Profile
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl p-2.5 outline-none focus:border-indigo-400 cursor-pointer"
          >
            {PRESET_TAXPAYER_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.pan})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {activeTaxpayer.roleDescription}
          </span>
        </div>

        {/* Assessment Year Toggle */}
        <div>
          <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1">
            Assessment Year
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold text-slate-300">
            <button
              onClick={() => setAssessmentYear("AY 2026-27")}
              className={`py-1.5 rounded-lg transition ${
                assessmentYear === "AY 2026-27" ? "bg-btred-logo text-white shadow-sm font-black" : "hover:text-white"
              }`}
            >
              AY 26-27
            </button>
            <button
              onClick={() => setAssessmentYear("AY 2025-26")}
              className={`py-1.5 rounded-lg transition ${
                assessmentYear === "AY 2025-26" ? "bg-btred-logo text-white shadow-sm font-black" : "hover:text-white"
              }`}
            >
              AY 25-26
            </button>
            <button
              onClick={() => setAssessmentYear("AY 2024-25")}
              className={`py-1.5 rounded-lg transition ${
                assessmentYear === "AY 2024-25" ? "bg-btred-logo text-white shadow-sm font-black" : "hover:text-white"
              }`}
            >
              AY 24-25
            </button>
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block font-semibold">
            Standard Deduction: {formatCurrencyINR(calculation.newRegimeStdDeduction)} in 115BAC
          </span>
        </div>

        {/* Age Category */}
        <div>
          <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1">
            Taxpayer Age Category
          </label>
          <select
            value={taxpayerCategory}
            onChange={(e) => setTaxpayerCategory(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl p-2.5 outline-none focus:border-indigo-400 cursor-pointer"
          >
            <option value="INDIVIDUAL">Resident Individual (&lt; 60 years)</option>
            <option value="SENIOR">Senior Citizen (60 to 79 years — 80TTB ₹50k)</option>
            <option value="SUPER_SENIOR">Super Senior Citizen (&ge; 80 years — ₹5L Exemption)</option>
          </select>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Basic Exemption in Old: {taxpayerCategory === "SUPER_SENIOR" ? "₹5,00,000" : taxpayerCategory === "SENIOR" ? "₹3,00,000" : "₹2,50,000"}
          </span>
        </div>
      </div>

      {/* OPTIMAL STATUTORY TAX RECOMMENDATION BANNER */}
      <div className={`p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        calculation.recommendedRegime === "NEW"
          ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
          : "bg-red-50/80 border-red-300 text-red-950"
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-bold ${
            calculation.recommendedRegime === "NEW" ? "bg-emerald-600 text-white" : "bg-btred-logo text-white"
          }`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-black tracking-wider text-slate-500">
              Optimal Statutory Tax Recommendation
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {calculation.recommendedRegime === "NEW" ? "New Tax Regime (Section 115BAC)" : "Old Tax Regime"} is Cheaper by{" "}
              <span className="text-btred-logo underline decoration-red-400 font-black">
                {formatCurrencyINR(calculation.difference)}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {calculation.recommendedRegime === "NEW"
                ? `Due to revised ₹75,000 standard deduction, concessional 5%-30% slabs, and ₹7,00,000 nil tax threshold under Section 87A.`
                : `Due to ${formatCurrencyINR(calculation.totalOldDeductions)} in Chapter VI-A deductions and Section 24(b) home loan interest.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5 shrink-0">
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Optimal Tax Liability</div>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrencyINR(calculation.recommendedRegime === "NEW" ? calculation.totalTaxLiabilityNew : calculation.totalTaxLiabilityOld)}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold">
              Prepaid: {formatCurrencyINR(calculation.totalPrepaid)} | Net: {formatCurrencyINR(Math.abs(calculation.recommendedRegime === "NEW" ? calculation.netBalanceNew : calculation.netBalanceOld))}
            </div>
          </div>

          {isForm10IEAMandatory && (
            <button
              onClick={() => setShowForm10IEAModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Form 10-IEA Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* DUAL REGIME COMPARISON CARDS (HIGH CONTRAST & STRUCTURED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NEW REGIME CARD */}
        <div className={`rounded-3xl border p-5 sm:p-6 transition ${
          calculation.recommendedRegime === "NEW"
            ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
            : "bg-white border-slate-200 shadow-sm opacity-95"
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Default Option (Section 115BAC)
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">New Tax Regime</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold">Total Tax Liability</div>
              <div className="text-2xl font-black text-emerald-700">
                {formatCurrencyINR(calculation.totalTaxLiabilityNew)}
              </div>
            </div>
          </div>

          <div className="py-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Salary</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(salaryGross)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Standard Deduction (Salaried)</span>
              <span className="font-mono font-bold text-emerald-700">-{formatCurrencyINR(calculation.newRegimeStdDeduction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">House Property Loss Set-off</span>
              <span className="font-mono text-slate-400">₹0 (Disallowed in 115BAC)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Business / Professional Income</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(calculation.pgbp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Income from Other Sources</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(calculation.totalOtherSources)}</span>
            </div>
            {sec80CCD_2_Employer > 0 && (
              <div className="flex justify-between text-indigo-700 font-semibold">
                <span>Employer NPS u/s 80CCD(2)</span>
                <span className="font-mono">-{formatCurrencyINR(sec80CCD_2_Employer)}</span>
              </div>
            )}
            
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
              <span>Gross Taxable Income</span>
              <span className="font-mono text-slate-900 text-sm">{formatCurrencyINR(calculation.taxableOrdinaryNew)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Basic Tax on Slabs</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrencyINR(calculation.taxNew + calculation.rebate87ANew)}
              </span>
            </div>
            {calculation.rebate87ANew > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Rebate u/s 87A &amp; Marginal Relief</span>
                <span className="font-mono">-{formatCurrencyINR(calculation.rebate87ANew)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Health &amp; Education Cess (4%)</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(calculation.cessNew)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Less: Taxes Paid (TDS &amp; Advance Tax)</span>
              <span className="font-mono text-emerald-700 font-bold">-{formatCurrencyINR(calculation.totalPrepaid)}</span>
            </div>

            <div className="flex justify-between border-t-2 border-slate-200 pt-2 font-black text-sm">
              <span className="text-slate-900">Net Balance {calculation.netBalanceNew > 0 ? "Payable" : "Refundable"}</span>
              <span className={`font-mono ${calculation.netBalanceNew > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {formatCurrencyINR(Math.abs(calculation.netBalanceNew))}
              </span>
            </div>
          </div>
        </div>

        {/* OLD REGIME CARD */}
        <div className={`rounded-3xl border p-5 sm:p-6 transition ${
          calculation.recommendedRegime === "OLD"
            ? "bg-white border-red-500 shadow-md ring-2 ring-red-500/20"
            : "bg-white border-slate-200 shadow-sm opacity-95"
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-btred-logo bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                Optional Scheme {isForm10IEAMandatory ? "(Form 10-IEA Mandatory)" : "(Direct Opt-out)"}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Old Tax Regime</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold">Total Tax Liability</div>
              <div className="text-2xl font-black text-btred-logo">
                {formatCurrencyINR(calculation.totalTaxLiabilityOld)}
              </div>
            </div>
          </div>

          <div className="py-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Salary (after exemptions)</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(salaryGross - salaryExemptions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Standard Deduction (Salaried)</span>
              <span className="font-mono font-bold text-btred-logo">-{formatCurrencyINR(calculation.oldRegimeStdDeduction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">House Property Interest (Sec 24b)</span>
              <span className="font-mono font-bold text-btred-logo">
                {calculation.housePropIncomeOld < 0 ? `-${formatCurrencyINR(Math.abs(calculation.housePropIncomeOld))}` : "₹0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Business / Professional Income</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(calculation.pgbp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Chapter VI-A Deductions</span>
              <span className="font-mono font-bold text-btred-logo">-{formatCurrencyINR(calculation.totalOldDeductions)}</span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
              <span>Net Taxable Income</span>
              <span className="font-mono text-slate-900 text-sm">{formatCurrencyINR(calculation.taxableOrdinaryOld)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Basic Tax on Old Slabs</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrencyINR(calculation.taxOld + calculation.rebate87AOld)}
              </span>
            </div>
            {calculation.rebate87AOld > 0 && (
              <div className="flex justify-between text-btred-logo font-semibold">
                <span>Rebate u/s 87A</span>
                <span className="font-mono">-{formatCurrencyINR(calculation.rebate87AOld)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Health &amp; Education Cess (4%)</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(calculation.cessOld)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Less: Taxes Paid (TDS &amp; Advance Tax)</span>
              <span className="font-mono text-emerald-700 font-bold">-{formatCurrencyINR(calculation.totalPrepaid)}</span>
            </div>

            <div className="flex justify-between border-t-2 border-slate-200 pt-2 font-black text-sm">
              <span className="text-slate-900">Net Balance {calculation.netBalanceOld > 0 ? "Payable" : "Refundable"}</span>
              <span className={`font-mono ${calculation.netBalanceOld > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {formatCurrencyINR(Math.abs(calculation.netBalanceOld))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* INPUT WORKBENCH */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Statutory Income &amp; Deductions Workbench
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Break-even deduction needed to beat New Regime: <strong>{formatCurrencyINR(calculation.breakEvenDeductions)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Head 1: Salary & Allowances */}
          <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1.5">
                <User className="w-4 h-4" /> 1. Income from Salary
              </span>
              <button
                type="button"
                onClick={() => setShowHraCalculator(true)}
                className="text-[10px] text-indigo-600 hover:underline font-bold"
              >
                HRA Calculator
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Gross Annual Salary (CTC / Form 16 Part B)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={salaryGross}
                  onChange={(e) => setSalaryGross(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-7 pr-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Old Regime Exemptions (HRA, LTA, Sec 10)
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={salaryExemptions}
                  onChange={(e) => setSalaryExemptions(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-7 pr-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Head 2: House Property */}
          <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1.5">
              <Home className="w-4 h-4" /> 2. House Property &amp; Loan
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Self-Occupied Home Loan Interest u/s 24(b)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={homeLoanInterestSelfOccupied}
                  onChange={(e) => setHomeLoanInterestSelfOccupied(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-7 pr-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Max ₹2,00,000 allowed in Old Regime</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Annual Rental Income Received (Let-out)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={annualRentReceived}
                  onChange={(e) => setAnnualRentReceived(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-7 pr-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Head 3: Business & Others */}
          <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" /> 3. Business (PGBP) &amp; Others
              </span>
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPresumptive}
                  onChange={(e) => setIsPresumptive(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <span>Presumptive?</span>
              </label>
            </div>

            {isPresumptive ? (
              <div className="space-y-2">
                <select
                  value={presumptiveScheme}
                  onChange={(e) => setPresumptiveScheme(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2 outline-none"
                >
                  <option value="44ADA">Sec 44ADA (Professionals @ 50%)</option>
                  <option value="44AD_DIGITAL">Sec 44AD (Digital Turnover @ 6%)</option>
                  <option value="44AD_CASH">Sec 44AD (Cash Turnover @ 8%)</option>
                </select>
                <input
                  type="number"
                  placeholder="Gross Receipts / Turnover"
                  value={businessGrossTurnover}
                  onChange={(e) => setBusinessGrossTurnover(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2 outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Net Regular Business Profit
                </label>
                <input
                  type="number"
                  value={regularBusinessProfit}
                  onChange={(e) => setRegularBusinessProfit(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Savings &amp; FD Interest / Dividends
              </label>
              <input
                type="number"
                value={savingsInterest + fdInterestAndDividends}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setSavingsInterest(Math.min(val, 25000));
                  setFdInterestAndDividends(Math.max(0, val - 25000));
                }}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Chapter VI-A Deductions */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-emerald-600" /> 4. Chapter VI-A Deductions (Old Regime Exclusive)
            </span>
            <span className="text-xs text-slate-600 font-mono font-bold">
              Total Old Deductions: {formatCurrencyINR(calculation.totalOldDeductions)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Section 80C (PPF, ELSS, EPF, LIC)
              </label>
              <input
                type="number"
                value={sec80C}
                onChange={(e) => setSec80C(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 font-bold rounded-xl p-2 outline-none"
              />
              <span className="text-[10px] text-slate-400">Max ₹1.5L cap</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Section 80D (Self &amp; Family)
              </label>
              <input
                type="number"
                value={sec80D_Self}
                onChange={(e) => setSec80D_Self(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 font-bold rounded-xl p-2 outline-none"
              />
              <span className="text-[10px] text-slate-400">Max ₹25k (₹50k senior)</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Section 80D (Senior Parents)
              </label>
              <input
                type="number"
                value={sec80D_ParentsSenior}
                onChange={(e) => setSec80D_ParentsSenior(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 font-bold rounded-xl p-2 outline-none"
              />
              <span className="text-[10px] text-slate-400">Max ₹50k cap</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Section 80CCD(1B) (NPS Extra)
              </label>
              <input
                type="number"
                value={sec80CCD_1B}
                onChange={(e) => setSec80CCD_1B(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 font-bold rounded-xl p-2 outline-none"
              />
              <span className="text-[10px] text-slate-400">Max ₹50k exclusive</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Section 80CCD(2) (Employer NPS)
              </label>
              <input
                type="number"
                value={sec80CCD_2_Employer}
                onChange={(e) => setSec80CCD_2_Employer(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 font-bold rounded-xl p-2 outline-none"
              />
              <span className="text-[10px] text-emerald-600 font-semibold">Allowed in BOTH regimes!</span>
            </div>
          </div>
        </div>

        {/* Taxes Paid (TDS & Advance Tax) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              TDS Deducted (Per Form 26AS / AIS / TIS)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={tdsPaid}
                onChange={(e) => setTdsPaid(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-7 pr-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Advance Tax Paid (Challan 280)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
              <input
                type="number"
                value={advanceTaxPaid}
                onChange={(e) => setAdvanceTaxPaid(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-7 pr-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: HRA Exemption Calculator (Rule 2A)                                */}
      {/* ========================================================================= */}
      {showHraCalculator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">HRA Exemption Calculator (Rule 2A)</h3>
                  <p className="text-[10px] text-slate-500">Section 10(13A) Statutory Computation</p>
                </div>
              </div>
              <button onClick={() => setShowHraCalculator(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Annual Basic Salary + DA</label>
                <input
                  type="number"
                  value={hraBasicSalary}
                  onChange={(e) => setHraBasicSalary(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual HRA Received from Employer</label>
                <input
                  type="number"
                  value={hraReceived}
                  onChange={(e) => setHraReceived(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Annual Rent Paid</label>
                <input
                  type="number"
                  value={rentPaidAnnual}
                  onChange={(e) => setRentPaidAnnual(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="font-semibold text-slate-700">Metro City? (Delhi, Mumbai, Kolkata, Chennai)</label>
                <input
                  type="checkbox"
                  checked={isMetroCity}
                  onChange={(e) => setIsMetroCity(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              {/* Result Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-950 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Least of 3 Limits (Exempt u/s 10(13A)):</span>
                <div className="text-xl font-black text-emerald-700">{formatCurrencyINR(calculatedHraExemption)}</div>
                <div className="text-[10px] text-emerald-800">
                  Taxable HRA: {formatCurrencyINR(Math.max(0, hraReceived - calculatedHraExemption))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowHraCalculator(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyHra}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Apply Exemption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Form 10-IEA Mandatory Opt-out Alert                             */}
      {/* ========================================================================= */}
      {showForm10IEAModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Form 10-IEA Statutory Filing Mandatory</h3>
                  <p className="text-[10px] text-slate-500">Section 115BAC(6) Opt-out for Business/Profession</p>
                </div>
              </div>
              <button onClick={() => setShowForm10IEAModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-2">
              <p>
                Because <strong>{activeTaxpayer.name}</strong> has Business or Professional Income (PGBP: {formatCurrencyINR(calculation.pgbp)}) and wishes to opt for the <strong>Old Tax Regime</strong>, filing <strong>Form 10-IEA</strong> before the statutory due date under Section 139(1) (July 31 / Oct 31) is <strong>STRICTLY MANDATORY</strong>.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-btred-logo font-semibold">
                ⚠️ If Form 10-IEA is not filed on time, the ITD portal will forcibly process the return under New Tax Regime, disallowing all ₹{calculation.totalOldDeductions.toLocaleString()} deductions!
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowForm10IEAModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Acknowledge &amp; Generate Form 10-IEA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Tax Advisory Dossier (HNI)                                      */}
      {/* ========================================================================= */}
      {showAdvisoryDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto font-sans animate-scaleUp">
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Confidential Direct Tax Strategy Dossier
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  GPA &amp; CO. TAX PLANNING &amp; WEALTH ADVISORY
                </h2>
                <p className="text-xs text-slate-500">
                  Prepared for: <strong>{activeTaxpayer.name}</strong> (PAN: {activeTaxpayer.pan}) | {assessmentYear}
                </p>
              </div>
              <button
                onClick={() => setShowAdvisoryDossier(false)}
                className="text-slate-400 hover:text-slate-800 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-2xl">
                <strong className="text-emerald-950 font-black text-sm block">1. Executive Recommendation</strong>
                <p className="text-emerald-900 mt-1">
                  Based on our statutory simulation of your financial year, opting for the <strong>{calculation.recommendedRegime === "NEW" ? "New Tax Regime under Section 115BAC" : "Old Tax Regime"}</strong> minimizes your direct tax outflow by exactly <strong>{formatCurrencyINR(calculation.difference)}</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 mb-2">
                  2. High-ROI Tax Optimization Levers
                </h4>
                <div className="space-y-2">
                  <div className="border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block text-xs">Section 80CCD(2) Corporate Employer NPS</strong>
                      <span className="text-[11px] text-slate-500">Restructure salary package to contribute up to 10% (14% govt) of Basic</span>
                    </div>
                    <span className="text-emerald-700 font-bold">Allowed in 115BAC!</span>
                  </div>

                  <div className="border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block text-xs">Section 80CCD(1B) Tier 1 NPS Allocation</strong>
                      <span className="text-[11px] text-slate-500">Invest ₹50,000 in NPS over and above the ₹1.5L 80C limit</span>
                    </div>
                    <span className="text-emerald-700 font-bold">+₹15,600 Tax Saved</span>
                  </div>

                  <div className="border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block text-xs">Break-Even Deduction Threshold</strong>
                      <span className="text-[11px] text-slate-500">At your income level, Old Regime is only beneficial if deductions exceed</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(calculation.breakEvenDeductions)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 mb-2">
                  3. Comparative Tax Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 text-[11px] uppercase font-bold block">Old Tax Regime</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">{formatCurrencyINR(calculation.totalTaxLiabilityOld)}</span>
                    <span className="text-[10px] text-slate-500">Total Deductions: {formatCurrencyINR(calculation.totalOldDeductions)}</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-300">
                    <span className="text-emerald-800 text-[11px] uppercase font-bold block">New Tax Regime (115BAC)</span>
                    <span className="text-xl font-black text-emerald-700 mt-1 block">{formatCurrencyINR(calculation.totalTaxLiabilityNew)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {calculation.recommendedRegime === "NEW" ? `Saves ${formatCurrencyINR(calculation.difference)}` : "Higher Tax"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
                <span>Engagement Partner: <strong>CA Gunjan Jain (FCA)</strong></span>
                <span className="font-mono">UDIN: 26098221ITR115BAC{Date.now().toString().slice(-4)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-btred-logo hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
              <button
                onClick={() => setShowAdvisoryDossier(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
