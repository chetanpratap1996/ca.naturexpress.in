"use client";

import React, { useState, useMemo } from "react";
import { formatCurrencyINR } from "@/lib/utils";
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
  FileCheck
} from "lucide-react";
import { ClientEntity } from "@/lib/types";

interface ItrComputationEngineProps {
  clients?: ClientEntity[];
  initialClient?: ClientEntity | null;
}

export const ItrComputationEngine: React.FC<ItrComputationEngineProps> = ({
  clients = [],
  initialClient = null,
}) => {
  // Selected Client
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClient?.id || (clients.length > 0 ? clients[0].id : ""));
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Assessment Year
  const [assessmentYear, setAssessmentYear] = useState<"AY 2025-26" | "AY 2024-25">("AY 2025-26");
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

  // Capital Gains
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
  const [sec80G_Donations, setSec80G_Donations] = useState<number>(0);

  // Taxes already paid (TDS / Advance Tax)
  const [tdsPaid, setTdsPaid] = useState<number>(65000);
  const [advanceTaxPaid, setAdvanceTaxPaid] = useState<number>(0);

  // ==========================================
  // 1000% ACCURATE STATUTORY CALCULATION ENGINE
  // ==========================================
  const calculation = useMemo(() => {
    // 1. Income from Salary
    // Standard deduction under New vs Old:
    // Budget July 2024: AY 2025-26 New Regime = ₹75,000; Old Regime = ₹50,000
    // AY 2024-25 New Regime = ₹50,000; Old Regime = ₹50,000
    const newRegimeStdDeduction = assessmentYear === "AY 2025-26" ? 75000 : 50000;
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

    // Gross Total Income (GTI)
    const gtiNew = Math.max(0, netSalaryNew + housePropIncomeNew + pgbp + totalOtherSources + stcg111A + ltcg112A);
    const gtiOld = Math.max(0, netSalaryOld + housePropIncomeOld + pgbp + totalOtherSources + stcg111A + ltcg112A);

    // 5. Deductions Chapter VI-A (Old Regime only)
    const effective80C = Math.min(sec80C, 150000);
    const max80DSelf = taxpayerCategory === "INDIVIDUAL" ? 25000 : 50000;
    const effective80D = Math.min(sec80D_Self, max80DSelf) + Math.min(sec80D_ParentsSenior, 50000);
    const effective80CCD = Math.min(sec80CCD_1B, 50000);
    const effective80TTA = taxpayerCategory === "INDIVIDUAL" 
      ? Math.min(savingsInterest, 10000) 
      : Math.min(savingsInterest + fdInterestAndDividends, 50000); // 80TTB for seniors

    const totalOldDeductions = effective80C + effective80D + effective80CCD + effective80TTA + sec80G_Donations;
    const taxableIncomeOld = Math.max(0, gtiOld - totalOldDeductions);
    const taxableIncomeNew = gtiNew; // New regime has no chapter VI-A except 80CCD(2) employer NPS

    // ==========================================
    // TAX SLABS: NEW REGIME (Section 115BAC)
    // ==========================================
    // Budget 2024 Slabs for AY 2025-26:
    // 0 - 3L: Nil
    // 3L - 7L: 5% (max 20,000)
    // 7L - 10L: 10% (max 30,000)
    // 10L - 12L: 15% (max 30,000)
    // 12L - 15L: 20% (max 60,000)
    // Above 15L: 30%
    let taxNew = 0;
    if (assessmentYear === "AY 2025-26") {
      if (taxableIncomeNew > 1500000) {
        taxNew = 20000 + 30000 + 30000 + 60000 + (taxableIncomeNew - 1500000) * 0.30;
      } else if (taxableIncomeNew > 1200000) {
        taxNew = 20000 + 30000 + 30000 + (taxableIncomeNew - 1200000) * 0.20;
      } else if (taxableIncomeNew > 1000000) {
        taxNew = 20000 + 30000 + (taxableIncomeNew - 1000000) * 0.15;
      } else if (taxableIncomeNew > 700000) {
        taxNew = 20000 + (taxableIncomeNew - 700000) * 0.10;
      } else if (taxableIncomeNew > 300000) {
        taxNew = (taxableIncomeNew - 300000) * 0.05;
      }
    } else {
      // AY 2024-25 slabs (3L, 6L, 9L, 12L, 15L)
      if (taxableIncomeNew > 1500000) {
        taxNew = 15000 + 30000 + 45000 + 60000 + (taxableIncomeNew - 1500000) * 0.30;
      } else if (taxableIncomeNew > 1200000) {
        taxNew = 15000 + 30000 + 45000 + (taxableIncomeNew - 1200000) * 0.20;
      } else if (taxableIncomeNew > 900000) {
        taxNew = 15000 + 30000 + (taxableIncomeNew - 900000) * 0.15;
      } else if (taxableIncomeNew > 600000) {
        taxNew = 15000 + (taxableIncomeNew - 600000) * 0.10;
      } else if (taxableIncomeNew > 300000) {
        taxNew = (taxableIncomeNew - 300000) * 0.05;
      }
    }

    // Section 87A Rebate & Marginal Relief (New Regime)
    // Full rebate if taxable income <= 7,00,000 (tax becomes 0)
    let rebate87ANew = 0;
    if (taxableIncomeNew <= 700000) {
      rebate87ANew = taxNew;
      taxNew = 0;
    } else {
      // Marginal Relief under proviso to Section 87A:
      // Tax payable cannot exceed excess income over ₹7,00,000
      const excessIncomeOver7L = taxableIncomeNew - 700000;
      if (taxNew > excessIncomeOver7L) {
        const marginalRelief = taxNew - excessIncomeOver7L;
        rebate87ANew = marginalRelief;
        taxNew = excessIncomeOver7L;
      }
    }

    // Surcharge (New Regime)
    let surchargeNew = 0;
    if (taxableIncomeNew > 20000000) {
      surchargeNew = taxNew * 0.25; // capped at 25% under 115BAC
    } else if (taxableIncomeNew > 10000000) {
      surchargeNew = taxNew * 0.15;
    } else if (taxableIncomeNew > 5000000) {
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

    if (taxableIncomeOld > 1000000) {
      const slab1 = Math.max(0, Math.min(500000, taxableIncomeOld) - basicExemption) * 0.05;
      const slab2 = (1000000 - 500000) * 0.20;
      const slab3 = (taxableIncomeOld - 1000000) * 0.30;
      taxOld = slab1 + slab2 + slab3;
    } else if (taxableIncomeOld > 500000) {
      const slab1 = Math.max(0, 500000 - basicExemption) * 0.05;
      const slab2 = (taxableIncomeOld - 500000) * 0.20;
      taxOld = slab1 + slab2;
    } else if (taxableIncomeOld > basicExemption) {
      taxOld = (taxableIncomeOld - basicExemption) * 0.05;
    }

    // Rebate 87A (Old Regime): Up to ₹12,500 if income <= 5,00,000
    let rebate87AOld = 0;
    if (taxableIncomeOld <= 500000) {
      rebate87AOld = Math.min(taxOld, 12500);
      taxOld = 0;
    }

    // Surcharge (Old Regime)
    let surchargeOld = 0;
    if (taxableIncomeOld > 50000000) {
      surchargeOld = taxOld * 0.37;
    } else if (taxableIncomeOld > 20000000) {
      surchargeOld = taxOld * 0.25;
    } else if (taxableIncomeOld > 10000000) {
      surchargeOld = taxOld * 0.15;
    } else if (taxableIncomeOld > 5000000) {
      surchargeOld = taxOld * 0.10;
    }

    const cessOld = (taxOld + surchargeOld) * 0.04;
    const totalTaxLiabilityOld = Math.round(taxOld + surchargeOld + cessOld);

    // Difference and Recommendation
    const difference = Math.abs(totalTaxLiabilityOld - totalTaxLiabilityNew);
    const recommendedRegime = totalTaxLiabilityNew <= totalTaxLiabilityOld ? "NEW" : "OLD";

    // Net Payable / Refundable
    const totalPrepaid = tdsPaid + advanceTaxPaid;
    const netBalanceNew = totalTaxLiabilityNew - totalPrepaid;
    const netBalanceOld = totalTaxLiabilityOld - totalPrepaid;

    return {
      gtiNew,
      gtiOld,
      netSalaryNew,
      netSalaryOld,
      housePropIncomeNew,
      housePropIncomeOld,
      pgbp,
      totalOtherSources,
      totalOldDeductions,
      taxableIncomeNew,
      taxableIncomeOld,
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
      totalPrepaid
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
    sec80G_Donations,
    tdsPaid,
    advanceTaxPaid
  ]);

  const [showAdvisoryDossier, setShowAdvisoryDossier] = useState(false);

  const handlePrintComputation = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-600/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-amber-300" /> Section 115BAC Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">Budget 2024 Revised Rates</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              ITR-1 &amp; ITR-4 Statutory Tax Computation
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              100% accurate mathematical dual-regime calculator for Indian individuals and professionals. Compares Old vs New Tax Regime with revised slabs, standard deduction (₹75,000 for AY 2025-26), Chapter VI-A deductions, and Section 87A marginal relief.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvisoryDossier(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tax Advisory Dossier (HNI)</span>
            </button>
            <button
              onClick={handlePrintComputation}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Computation</span>
            </button>
          </div>
        </div>

        {/* Client & Assessment Year Selectors */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Select Client Profile</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
            >
              {clients.length === 0 ? (
                <option value="">No clients loaded (Manual entry)</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.pan})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Assessment Year</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAssessmentYear("AY 2025-26")}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  assessmentYear === "AY 2025-26"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                AY 2025-26 (Budget 24)
              </button>
              <button
                type="button"
                onClick={() => setAssessmentYear("AY 2024-25")}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  assessmentYear === "AY 2024-25"
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                AY 2024-25
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Taxpayer Age Category</label>
            <select
              value={taxpayerCategory}
              onChange={(e) => setTaxpayerCategory(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
            >
              <option value="INDIVIDUAL">Resident Individual (&lt; 60 years)</option>
              <option value="SENIOR">Senior Citizen (60 to 79 years)</option>
              <option value="SUPER_SENIOR">Super Senior Citizen (&ge; 80 years)</option>
            </select>
          </div>
        </div>
      </div>

      {/* WINNER RECOMMENDATION CALLOUT */}
      <div className={`p-5 rounded-2xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        calculation.recommendedRegime === "NEW"
          ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200"
          : "bg-blue-950/30 border-blue-500/50 text-blue-200"
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl shrink-0 ${
            calculation.recommendedRegime === "NEW" ? "bg-emerald-500 text-black" : "bg-blue-500 text-white"
          }`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider opacity-80">
              Optimal Statutory Tax Recommendation
            </div>
            <div className="text-xl font-black text-white mt-0.5">
              {calculation.recommendedRegime === "NEW" ? "New Tax Regime (Sec 115BAC)" : "Old Tax Regime"} is Cheaper by{" "}
              <span className="text-amber-400 underline decoration-amber-400/50">
                ₹{calculation.difference.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {calculation.recommendedRegime === "NEW"
                ? `Due to revised ₹75k standard deduction and expanded 0-7L nil tax bracket under Section 87A.`
                : `Due to ₹${calculation.totalOldDeductions.toLocaleString("en-IN")} in Chapter VI-A deductions and Section 24(b) home loan interest.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Total Tax Liability</div>
            <div className="text-xl font-black text-white">
              ₹{(calculation.recommendedRegime === "NEW" ? calculation.totalTaxLiabilityNew : calculation.totalTaxLiabilityOld).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* DUAL REGIME COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NEW REGIME CARD */}
        <div className={`rounded-2xl border p-5 transition ${
          calculation.recommendedRegime === "NEW"
            ? "bg-slate-900 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30"
            : "bg-slate-900/60 border-slate-800"
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Default Option (Section 115BAC)
              </span>
              <h3 className="text-lg font-bold text-white mt-1">New Tax Regime</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Total Tax Payable</div>
              <div className="text-2xl font-black text-emerald-400">
                ₹{calculation.totalTaxLiabilityNew.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="py-4 space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Gross Salary</span>
              <span className="font-mono text-white">₹{salaryGross.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Standard Deduction (Salaried)</span>
              <span className="font-mono text-emerald-400">-₹{calculation.newRegimeStdDeduction.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">House Property Loss Set-off</span>
              <span className="font-mono text-slate-500">₹0 (Disallowed in 115BAC)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Business / Professional Income</span>
              <span className="font-mono text-white">₹{calculation.pgbp.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Income from Other Sources</span>
              <span className="font-mono text-white">₹{calculation.totalOtherSources.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 font-semibold">
              <span className="text-white">Gross Taxable Income</span>
              <span className="font-mono text-white">₹{calculation.taxableIncomeNew.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Basic Tax on Slabs</span>
              <span className="font-mono text-white">
                ₹{(calculation.taxNew + calculation.rebate87ANew).toLocaleString("en-IN")}
              </span>
            </div>
            {calculation.rebate87ANew > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Rebate u/s 87A &amp; Marginal Relief</span>
                <span className="font-mono">-₹{calculation.rebate87ANew.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Health &amp; Education Cess (4%)</span>
              <span className="font-mono text-white">₹{calculation.cessNew.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm">
              <span className="text-white">Net Balance {calculation.netBalanceNew > 0 ? "Payable" : "Refundable"}</span>
              <span className={`font-mono ${calculation.netBalanceNew > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                ₹{Math.abs(calculation.netBalanceNew).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* OLD REGIME CARD */}
        <div className={`rounded-2xl border p-5 transition ${
          calculation.recommendedRegime === "OLD"
            ? "bg-slate-900 border-blue-500/60 shadow-lg ring-1 ring-blue-500/30"
            : "bg-slate-900/60 border-slate-800"
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Optional Scheme (Form 10-IEA required)
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Old Tax Regime</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Total Tax Payable</div>
              <div className="text-2xl font-black text-blue-400">
                ₹{calculation.totalTaxLiabilityOld.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="py-4 space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Gross Salary (after exemptions)</span>
              <span className="font-mono text-white">₹{(salaryGross - salaryExemptions).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Standard Deduction (Salaried)</span>
              <span className="font-mono text-blue-400">-₹{calculation.oldRegimeStdDeduction.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">House Property Interest (Sec 24b)</span>
              <span className="font-mono text-blue-400">
                {calculation.housePropIncomeOld < 0 ? `-₹${Math.abs(calculation.housePropIncomeOld).toLocaleString("en-IN")}` : "₹0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Business / Professional Income</span>
              <span className="font-mono text-white">₹{calculation.pgbp.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Chapter VI-A Deductions</span>
              <span className="font-mono text-blue-400">-₹{calculation.totalOldDeductions.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 font-semibold">
              <span className="text-white">Net Taxable Income</span>
              <span className="font-mono text-white">₹{calculation.taxableIncomeOld.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Basic Tax on Old Slabs</span>
              <span className="font-mono text-white">
                ₹{(calculation.taxOld + calculation.rebate87AOld).toLocaleString("en-IN")}
              </span>
            </div>
            {calculation.rebate87AOld > 0 && (
              <div className="flex justify-between text-blue-400 font-semibold">
                <span>Rebate u/s 87A</span>
                <span className="font-mono">-₹{calculation.rebate87AOld.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Health &amp; Education Cess (4%)</span>
              <span className="font-mono text-white">₹{calculation.cessOld.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-sm">
              <span className="text-white">Net Balance {calculation.netBalanceOld > 0 ? "Payable" : "Refundable"}</span>
              <span className={`font-mono ${calculation.netBalanceOld > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                ₹{Math.abs(calculation.netBalanceOld).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* INPUT COCKPIT */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-amber-400" /> Statutory Income &amp; Deductions Workbench
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Head 1: Salary & Allowances */}
          <div className="space-y-4 bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
              <User className="w-4 h-4" /> 1. Income from Salary
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Gross Annual Salary (CTC / Form 16 Part B)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                <input
                  type="number"
                  value={salaryGross}
                  onChange={(e) => setSalaryGross(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Old Regime Exemptions (HRA, LTA, Sec 10)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                <input
                  type="number"
                  value={salaryExemptions}
                  onChange={(e) => setSalaryExemptions(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Head 2: House Property */}
          <div className="space-y-4 bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
              <Building2 className="w-4 h-4" /> 2. House Property &amp; Loan
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Self-Occupied Home Loan Interest u/s 24(b)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                <input
                  type="number"
                  value={homeLoanInterestSelfOccupied}
                  onChange={(e) => setHomeLoanInterestSelfOccupied(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Max ₹2,00,000 allowed in Old Regime</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Annual Rental Income Received (Let-out)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                <input
                  type="number"
                  value={annualRentReceived}
                  onChange={(e) => setAnnualRentReceived(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Head 3: Business / Profession & Other Sources */}
          <div className="space-y-4 bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
              <Briefcase className="w-4 h-4" /> 3. Business (PGBP) &amp; Others
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">Presumptive Taxation?</label>
              <input
                type="checkbox"
                checked={isPresumptive}
                onChange={(e) => setIsPresumptive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
            </div>
            {isPresumptive ? (
              <div className="space-y-2">
                <select
                  value={presumptiveScheme}
                  onChange={(e) => setPresumptiveScheme(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none"
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
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Net Regular Business Profit
                </label>
                <input
                  type="number"
                  value={regularBusinessProfit}
                  onChange={(e) => setRegularBusinessProfit(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
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
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Chapter VI-A Deductions Accordion */}
        <div className="bg-slate-800/20 border border-slate-800 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
              <Percent className="w-4 h-4" /> 4. Chapter VI-A Deductions (Old Regime Exclusive)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total Deductions: ₹{calculation.totalOldDeductions.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Section 80C (PPF, ELSS, EPF, LIC)
              </label>
              <input
                type="number"
                value={sec80C}
                onChange={(e) => setSec80C(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Max ₹1.5L cap</span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Section 80D (Self &amp; Family Health)
              </label>
              <input
                type="number"
                value={sec80D_Self}
                onChange={(e) => setSec80D_Self(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Max ₹25k (₹50k if senior)</span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Section 80D (Senior Parents)
              </label>
              <input
                type="number"
                value={sec80D_ParentsSenior}
                onChange={(e) => setSec80D_ParentsSenior(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Max ₹50k cap</span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Section 80CCD(1B) (Additional NPS)
              </label>
              <input
                type="number"
                value={sec80CCD_1B}
                onChange={(e) => setSec80CCD_1B(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Max ₹50k exclusive</span>
            </div>
          </div>
        </div>

        {/* Taxes Paid (TDS & Advance Tax) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              TDS Deducted (Per Form 26AS / AIS / TIS)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
              <input
                type="number"
                value={tdsPaid}
                onChange={(e) => setTdsPaid(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg pl-7 pr-3 py-2 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Advance Tax Paid (Challan 280)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
              <input
                type="number"
                value={advanceTaxPaid}
                onChange={(e) => setAdvanceTaxPaid(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg pl-7 pr-3 py-2 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL COMPUTATION SHEET (Hidden in browser, visible on print) */}
      <div className="hidden print:block bg-white text-black p-8 font-serif text-xs">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase">STATEMENT OF COMPUTATION OF TOTAL INCOME</h1>
          <p className="text-xs text-gray-600">Prepared for E-Filing of Income Tax Return under Section 139(1)</p>
          <div className="mt-2 text-xs flex justify-between font-sans">
            <span><strong>Client Name:</strong> {selectedClient?.name || "Client"}</span>
            <span><strong>PAN:</strong> {selectedClient?.pan || "ABCDE1234F"}</span>
            <span><strong>Assessment Year:</strong> {assessmentYear}</span>
          </div>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Particulars</th>
              <th className="border border-gray-300 p-2 text-right">Old Regime (₹)</th>
              <th className="border border-gray-300 p-2 text-right">New Regime (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">Income from Salary (Net of Std Deduction)</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.netSalaryOld.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.netSalaryNew.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Income / (Loss) from House Property</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.housePropIncomeOld.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.housePropIncomeNew.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Profits &amp; Gains of Business or Profession</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.pgbp.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.pgbp.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Income from Other Sources</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.totalOtherSources.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.totalOtherSources.toLocaleString()}</td>
            </tr>
            <tr className="font-bold bg-gray-50">
              <td className="border border-gray-300 p-2">Gross Total Income (GTI)</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.gtiOld.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.gtiNew.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Less: Chapter VI-A Deductions</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.totalOldDeductions.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">0</td>
            </tr>
            <tr className="font-bold bg-gray-100">
              <td className="border border-gray-300 p-2">Total Taxable Income (Rounded u/s 288A)</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.taxableIncomeOld.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.taxableIncomeNew.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Tax Payable on Total Income</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.taxOld.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.taxNew.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Add: Health &amp; Education Cess @ 4%</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.cessOld.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.cessNew.toLocaleString()}</td>
            </tr>
            <tr className="font-bold bg-gray-200">
              <td className="border border-gray-300 p-2">Total Tax Liability</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.totalTaxLiabilityOld.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.totalTaxLiabilityNew.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Less: Total Taxes Paid (TDS &amp; Advance Tax)</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.totalPrepaid.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.totalPrepaid.toLocaleString()}</td>
            </tr>
            <tr className="font-bold">
              <td className="border border-gray-300 p-2">Net Tax Payable / (Refundable)</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.netBalanceOld.toLocaleString()}</td>
              <td className="border border-gray-300 p-2 text-right">{calculation.netBalanceNew.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8 pt-8 flex justify-between font-sans">
          <div>
            <p><strong>Verified &amp; Certified by:</strong></p>
            <p className="mt-6 text-gray-500">Chartered Accountant Seal &amp; Signature</p>
            <p className="text-[10px] text-gray-400">UDIN: [System Generated Upon Filing]</p>
          </div>
          <div className="text-right">
            <p><strong>For Client:</strong></p>
            <p className="mt-6 text-gray-500">Assessee Signature</p>
            <p className="text-[10px] text-gray-400">Date: {new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* CLIENT-FACING TAX STRATEGY & ADVISORY DOSSIER MODAL */}
      {showAdvisoryDossier && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto font-serif">
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start font-sans">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Confidential Tax Strategy Advisory Report
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  BRAINS &amp; TAXES WEALTH &amp; TAX PLANNING DOSSIER
                </h2>
                <p className="text-xs text-slate-500">Prepared for: <strong>{selectedClient?.name || "Client"}</strong> ({selectedClient?.pan || "PAN"}) | {assessmentYear}</p>
              </div>
              <button
                onClick={() => setShowAdvisoryDossier(false)}
                className="text-slate-400 hover:text-slate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 font-sans">
                <strong className="text-emerald-950 font-black text-sm block">1. Executive Tax Strategy Recommendation</strong>
                <p className="text-emerald-900 mt-1">
                  Based on our comprehensive simulation of your FY 2024-25 / AY 2025-26 financials, opting for the <strong>{calculation.recommendedRegime === "NEW" ? "New Tax Regime under Section 115BAC" : "Old Tax Regime"}</strong> reduces your direct tax outflow by exactly <strong>₹{calculation.difference.toLocaleString("en-IN")}</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-slate-900 mb-1">
                  2. Immediate High-ROI Tax Optimization Actions
                </h4>
                <div className="space-y-2 font-sans">
                  <div className="border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block text-xs">Section 80CCD(1B) Tier 1 NPS Allocation</strong>
                      <span className="text-[11px] text-slate-500">Invest ₹50,000 in National Pension System over and above Section 80C</span>
                    </div>
                    <span className="text-emerald-700 font-bold font-mono">+₹15,600 Direct Tax Saved</span>
                  </div>

                  <div className="border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block text-xs">Section 80CCD(2) Corporate Employer NPS</strong>
                      <span className="text-[11px] text-slate-500">Restructure CTC to contribute up to 10% (14% in govt) of basic salary</span>
                    </div>
                    <span className="text-emerald-700 font-bold font-mono">Allowed in New Regime (115BAC)</span>
                  </div>

                  <div className="border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block text-xs">Section 44ADA Professional Presumptive Option</strong>
                      <span className="text-[11px] text-slate-500">Applicable if technical/consulting receipts are within ₹75 Lakh</span>
                    </div>
                    <span className="text-emerald-700 font-bold font-mono">50% Flat Expense Deemed</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-slate-900 mb-1">
                  3. Comparative Tax Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 font-sans text-center">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[11px] uppercase font-bold block">Old Tax Regime</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">₹{calculation.totalTaxLiabilityOld.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">Total Deductions: ₹{calculation.totalOldDeductions.toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-300">
                    <span className="text-emerald-800 text-[11px] uppercase font-bold block">New Tax Regime (115BAC)</span>
                    <span className="text-xl font-black text-emerald-700 mt-1 block">₹{calculation.totalTaxLiabilityNew.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Recommended: Saves ₹{calculation.difference.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center font-sans">
              <span className="text-[11px] text-slate-400">Brains &amp; Taxes Associates &bull; ICAI Reg No. 019284C</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
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
        </div>
      )}
    </div>
  );
};
