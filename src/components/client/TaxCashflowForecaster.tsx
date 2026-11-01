"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  Calendar, 
  IndianRupee, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Send,
  Calculator,
  Download,
  Percent,
  Sliders,
  FileText,
  Printer,
  Scale,
  Building2,
  AlertTriangle
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

interface TaxCashflowForecasterProps {
  clientName?: string;
}

type TaxRegime = "115BAA" | "REGULAR_25" | "REGULAR_30" | "115BAB" | "LLP_FIRM";

export function TaxCashflowForecaster({ clientName = "Client Entity" }: TaxCashflowForecasterProps) {
  // GSTR-3B Monthly Interactive State
  const [estimatedSalesTax, setEstimatedSalesTax] = useState<number>(580000);
  const [eligible2bItc, setEligible2bItc] = useState<number>(395000);
  const [rcmLiability, setRcmLiability] = useState<number>(35000); // RCM on GTA Freight / Legal Fees
  const [existingCashBalance, setExistingCashBalance] = useState<number>(20000);

  // Advance Tax Interactive State
  const [estimatedFullYearProfit, setEstimatedFullYearProfit] = useState<number>(8500000); // 85 Lakhs
  const [taxRegime, setTaxRegime] = useState<TaxRegime>("115BAA");
  const [activeQuarter, setActiveQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q3");
  const [tdsCreditedSoFar, setTdsCreditedSoFar] = useState<number>(750000);
  const [advanceTaxPaidQ1Q2, setAdvanceTaxPaidQ1Q2] = useState<number>(800000);

  // Corporate Tax Effective Rates
  const getEffectiveTaxRate = (regime: TaxRegime): { base: number; effective: number; label: string } => {
    switch (regime) {
      case "115BAA": return { base: 22, effective: 25.17, label: "Section 115BAA (22% + 10% Surcharge + 4% Cess)" };
      case "REGULAR_25": return { base: 25, effective: 26.0, label: "Domestic Co < ₹400 Cr (25% + 4% Cess)" };
      case "REGULAR_30": return { base: 30, effective: 31.2, label: "Standard Corporate (30% + 4% Cess)" };
      case "115BAB": return { base: 15, effective: 17.16, label: "New Manufacturing 115BAB (15% + 10% SC + Cess)" };
      case "LLP_FIRM": return { base: 30, effective: 31.2, label: "Partnership / LLP Firm (30% + 4% Cess)" };
    }
  };

  const currentRegimeInfo = getEffectiveTaxRate(taxRegime);

  // Derived GSTR-3B Outflow
  // Net GST = (Gross Output - Eligible ITC) + RCM (which must be paid in cash u/s 9(3)) - Cash Ledger
  const netGstCashRequired = Math.max(0, estimatedSalesTax - eligible2bItc) + rcmLiability - existingCashBalance;

  // Derived Advance Tax
  const totalEstimatedAnnualTax = Math.round(estimatedFullYearProfit * (currentRegimeInfo.effective / 100));
  
  const getQuarterTargetPct = (q: "Q1" | "Q2" | "Q3" | "Q4") => {
    switch (q) {
      case "Q1": return 0.15; // 15% by 15-June
      case "Q2": return 0.45; // 45% by 15-Sept
      case "Q3": return 0.75; // 75% by 15-Dec
      case "Q4": return 1.00; // 100% by 15-March
    }
  };

  const cumulativeQuarterTarget = Math.round(totalEstimatedAnnualTax * getQuarterTargetPct(activeQuarter));
  const netAdvanceTaxDue = Math.max(
    0, 
    cumulativeQuarterTarget - tdsCreditedSoFar - (activeQuarter === "Q1" ? 0 : advanceTaxPaidQ1Q2)
  );

  // Section 234C Interest Risk Calculation (1% per month for 3 months if shortfall > 10%)
  const hasSection234cRisk = netAdvanceTaxDue > 10000;
  const potential234cInterest = hasSection234cRisk ? Math.round(netAdvanceTaxDue * 0.01 * 3) : 0;

  const handleShareForecastWhatsApp = () => {
    const text = `*STATUTORY TAX CASH OUTFLOW ADVISORY*\n\n` +
      `Entity: *${clientName}*\n` +
      `Tax Regime: *${currentRegimeInfo.label}*\n\n` +
      `1️⃣ *Monthly GSTR-3B (Due 20th)*\n` +
      `• Gross GST Output: ₹${estimatedSalesTax.toLocaleString("en-IN")}\n` +
      `• GSTR-2B Input Tax Credit: -₹${eligible2bItc.toLocaleString("en-IN")}\n` +
      `• RCM Cash Liability (Sec 9(3)): +₹${rcmLiability.toLocaleString("en-IN")}\n` +
      `• Electronic Cash Ledger: -₹${existingCashBalance.toLocaleString("en-IN")}\n` +
      `👉 *Net Cash GST Required:* ₹${netGstCashRequired.toLocaleString("en-IN")}\n\n` +
      `2️⃣ *Advance Tax ${activeQuarter} (Due 15th)*\n` +
      `• Projected Annual Profit: ₹${estimatedFullYearProfit.toLocaleString("en-IN")}\n` +
      `• Effective Tax Rate: ${currentRegimeInfo.effective}%\n` +
      `• Cumulative Cutoff Target (${getQuarterTargetPct(activeQuarter) * 100}%): ₹${cumulativeQuarterTarget.toLocaleString("en-IN")}\n` +
      `• Less TDS Deducted: -₹${tdsCreditedSoFar.toLocaleString("en-IN")}\n` +
      `• Less Prior Taxes Paid: -₹${advanceTaxPaidQ1Q2.toLocaleString("en-IN")}\n` +
      `👉 *Net Advance Tax Due:* ₹${netAdvanceTaxDue.toLocaleString("en-IN")}\n` +
      `⚠️ *Section 234C Interest Shielded:* ₹${potential234cInterest.toLocaleString("en-IN")}\n\n` +
      `Issued by ${DEFAULT_FIRM_BRANDING.firmName} Corporate Advisory Desk. Please reserve bank treasury liquidity.`;

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handlePrintAdvisory = () => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Statutory Tax Outflow Advisory - ${clientName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 2px solid #e52320; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .firm-name { font-size: 20px; font-weight: 900; color: #0f172a; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
            .title { font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background: #f1f5f9; }
            .highlight { font-weight: 800; color: #e52320; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="firm-name">${DEFAULT_FIRM_BRANDING.firmName}</div>
              <div style="font-size: 12px; color: #64748b;">Chartered Accountants &bull; Corporate Tax Advisory &bull; FRN: ${DEFAULT_FIRM_BRANDING.frn}</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              <div>DATE: ${new Date().toLocaleDateString("en-IN")}</div>
              <div>CLIENT: <strong>${clientName}</strong></div>
            </div>
          </div>

          <h2 style="font-size: 18px; text-transform: uppercase; margin-bottom: 15px;">Statutory Tax Cash Outflow &amp; Treasury Plan</h2>

          <div class="box">
            <div class="title">1. Monthly GSTR-3B GST Outflow Projection</div>
            <table>
              <tr><td>Gross Outward Tax Liability (Sales)</td><td>Rs. ${estimatedSalesTax.toLocaleString("en-IN")}</td></tr>
              <tr><td>Eligible GSTR-2B Input Tax Credit (ITC)</td><td>-Rs. ${eligible2bItc.toLocaleString("en-IN")}</td></tr>
              <tr><td>Reverse Charge Liability (GTA/Legal Sec 9(3))</td><td>+Rs. ${rcmLiability.toLocaleString("en-IN")}</td></tr>
              <tr><td>Existing Cash Ledger Balance</td><td>-Rs. ${existingCashBalance.toLocaleString("en-IN")}</td></tr>
              <tr style="background: #fef2f2;"><td class="highlight">Net Cash Required for GST Deposit</td><td class="highlight">Rs. ${netGstCashRequired.toLocaleString("en-IN")}</td></tr>
            </table>
          </div>

          <div class="box">
            <div class="title">2. Advance Tax ${activeQuarter} Outflow Projection</div>
            <table>
              <tr><td>Estimated Full-Year Net Profit Before Tax</td><td>Rs. ${estimatedFullYearProfit.toLocaleString("en-IN")}</td></tr>
              <tr><td>Applicable Regime &amp; Effective Rate</td><td>${currentRegimeInfo.label} (${currentRegimeInfo.effective}%)</td></tr>
              <tr><td>Total Estimated Annual Tax</td><td>Rs. ${totalEstimatedAnnualTax.toLocaleString("en-IN")}</td></tr>
              <tr><td>Cumulative Target Threshold (${getQuarterTargetPct(activeQuarter) * 100}%)</td><td>Rs. ${cumulativeQuarterTarget.toLocaleString("en-IN")}</td></tr>
              <tr><td>Less Form 26AS TDS Credit</td><td>-Rs. ${tdsCreditedSoFar.toLocaleString("en-IN")}</td></tr>
              <tr><td>Less Advance Tax Already Paid</td><td>-Rs. ${advanceTaxPaidQ1Q2.toLocaleString("en-IN")}</td></tr>
              <tr style="background: #fef2f2;"><td class="highlight">Net Advance Tax Installment Due</td><td class="highlight">Rs. ${netAdvanceTaxDue.toLocaleString("en-IN")}</td></tr>
            </table>
          </div>

          <div style="font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Note: Prepared under Income Tax Act 1961 (Sections 208, 209, 211, 234C) and CGST Act 2017. Please ensure fund disbursement 48 hours prior to statutory deadline.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-btred-logo border border-red-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-btred-logo" /> Corporate Treasury Cockpit
            </span>
            <span className="text-xs text-slate-500 font-semibold">Zero 11th-Hour Working Capital Shock</span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-1">
            Advance Tax &amp; GST Outflow Forecaster &bull; {clientName}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Projects statutory tax cash outflows 10–14 days in advance to optimize bank overdraft lines and treasury reserves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintAdvisory}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            title="Print Official Treasury Advisory"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Advisory</span>
          </button>
          <button
            onClick={handleShareForecastWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" /> Share with CFO
          </button>
        </div>
      </div>

      {/* Tax Regime Selector Pill Bar */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-600" /> Applicable Corporate Tax Regime:
          </span>
          <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
            Effective Rate: {currentRegimeInfo.effective}%
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
          {[
            { id: "115BAA", label: "Sec 115BAA (22%)", desc: "Domestic Corporate" },
            { id: "REGULAR_25", label: "Regular (25%)", desc: "Turnover < ₹400 Cr" },
            { id: "REGULAR_30", label: "Regular (30%)", desc: "Standard Rate" },
            { id: "115BAB", label: "Sec 115BAB (15%)", desc: "New Manufacturing" },
            { id: "LLP_FIRM", label: "LLP / Firm (30%)", desc: "Partnership Tax" },
          ].map((reg) => (
            <button
              key={reg.id}
              onClick={() => setTaxRegime(reg.id as any)}
              className={`p-2 rounded-xl text-left border transition ${
                taxRegime === reg.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="font-black text-[11px] block truncate">{reg.label}</span>
              <span className={`text-[9px] block truncate ${taxRegime === reg.id ? "text-slate-300" : "text-slate-400"}`}>
                {reg.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Upcoming GST 3B (20th) + Advance Tax Quarterly Ladder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Monthly GSTR-3B Cash Ledger Forecast */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-btred-logo" />
                <span className="text-xs font-black text-slate-900 uppercase">Monthly GSTR-3B Outflow Forecast</span>
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Due: 20th of Month
              </span>
            </div>

            <div className="space-y-3 text-xs pt-1">
              <div>
                <div className="flex justify-between items-center text-slate-600 mb-1">
                  <span>Gross Output Tax Liability (Sales):</span>
                  <span className="font-bold text-slate-900 font-mono">₹{estimatedSalesTax.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="3000000"
                  step="10000"
                  value={estimatedSalesTax}
                  onChange={(e) => setEstimatedSalesTax(Number(e.target.value))}
                  className="w-full accent-btred-logo h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-emerald-700 mb-1">
                  <span>Eligible GSTR-2B Input Tax Credit (ITC):</span>
                  <span className="font-bold font-mono">-₹{eligible2bItc.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={estimatedSalesTax}
                  step="5000"
                  value={eligible2bItc}
                  onChange={(e) => setEligible2bItc(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-amber-800 mb-1">
                  <span>Reverse Charge Liability (GTA / Legal Sec 9(3)):</span>
                  <span className="font-bold font-mono">+₹{rcmLiability.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150000"
                  step="2500"
                  value={rcmLiability}
                  onChange={(e) => setRcmLiability(Number(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                <span>Existing Electronic Cash Ledger Credit:</span>
                <span className="font-mono text-slate-700">-₹{existingCashBalance.toLocaleString("en-IN")}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 block text-xs">Net Cash Required for Challan:</span>
                  <span className="text-[10px] text-slate-500">CPIN Generation 48h prior</span>
                </div>
                <span className="text-xl font-black text-rose-600 font-mono">
                  ₹{netGstCashRequired.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Synced with live GSTR-2B. RCM on transport and legal services must be settled strictly via cash ledger as per Section 49(4) of the CGST Act.
            </span>
          </div>
        </div>

        {/* Card 2: Advance Tax Quarterly Ladder Simulator */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-btred-logo" />
                <span className="text-xs font-black text-slate-900 uppercase">Advance Tax Threshold Simulator</span>
              </div>
              <div className="flex items-center gap-1">
                {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setActiveQuarter(q)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition ${
                      activeQuarter === q
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {q} ({getQuarterTargetPct(q) * 100}%)
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs pt-1">
              <div>
                <div className="flex justify-between items-center text-slate-600 mb-1">
                  <span>Projected Annual Net Profit Before Tax:</span>
                  <span className="font-bold text-slate-900 font-mono">₹{estimatedFullYearProfit.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="50000000"
                  step="500000"
                  value={estimatedFullYearProfit}
                  onChange={(e) => setEstimatedFullYearProfit(Number(e.target.value))}
                  className="w-full accent-red-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span>Total Estimated Annual Tax (@{currentRegimeInfo.effective}%):</span>
                <span className="font-mono font-bold">₹{totalEstimatedAnnualTax.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center text-slate-700 text-[11px]">
                <span>{activeQuarter} Cumulative Target Threshold ({getQuarterTargetPct(activeQuarter) * 100}%):</span>
                <span className="font-mono font-bold text-indigo-700">₹{cumulativeQuarterTarget.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-700 text-[11px]">
                <span>Less: Form 26AS TDS Deducted by Clients:</span>
                <span className="font-mono font-bold">-₹{tdsCreditedSoFar.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center text-blue-700 text-[11px]">
                <span>Less: Prior Advance Taxes Deposited:</span>
                <span className="font-mono font-bold">-₹{advanceTaxPaidQ1Q2.toLocaleString("en-IN")}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">{activeQuarter} Installment Payable:</span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    Section 234C Interest Safe
                  </span>
                </div>
                <span className="text-xl font-black text-indigo-700 font-mono">
                  ₹{netAdvanceTaxDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Section 234C Interest Warning */}
          {hasSection234cRisk ? (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Depositing this installment before the 15th protects against <strong>1% per month simple interest penalty (₹{potential234cInterest.toLocaleString("en-IN")})</strong> under Section 234C of the Income Tax Act.
              </span>
            </div>
          ) : (
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Account fully compliant with Section 208/211 advance tax milestones. No interest penalty accruing.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
