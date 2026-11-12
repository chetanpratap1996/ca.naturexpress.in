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
  Download
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

interface TaxCashflowForecasterProps {
  clientName?: string;
}

export function TaxCashflowForecaster({ clientName = "Client Entity" }: TaxCashflowForecasterProps) {
  // GSTR-3B Interactive State
  const [estimatedSalesTax, setEstimatedSalesTax] = useState<number>(580000);
  const [eligible2bItc, setEligible2bItc] = useState<number>(395000);
  const [existingCashBalance, setExistingCashBalance] = useState<number>(0);

  // Advance Tax Interactive State (Q3 - 75% cumulative cutoff due 15-Dec)
  const [estimatedFullYearProfit, setEstimatedFullYearProfit] = useState<number>(8500000); // 85 Lakhs
  const [corporateTaxRate, setCorporateTaxRate] = useState<number>(25); // 25% for domestic manufacturing
  const [tdsCreditedSoFar, setTdsCreditedSoFar] = useState<number>(750000);
  const [advanceTaxPaidQ1Q2, setAdvanceTaxPaidQ1Q2] = useState<number>(800000);

  // Derived GSTR-3B
  const netGstCashRequired = Math.max(0, estimatedSalesTax - eligible2bItc - existingCashBalance);

  // Derived Advance Tax:
  // Total Estimated Tax = Profit * Rate
  // 75% Cumulative Cutoff = Total Tax * 0.75
  // Remaining to pay in Q3 = 75% Cutoff - TDS - (Q1+Q2 paid)
  const totalEstimatedAnnualTax = Math.round(estimatedFullYearProfit * (corporateTaxRate / 100));
  const cumulative75PercentTarget = Math.round(totalEstimatedAnnualTax * 0.75);
  const netAdvanceTaxDueQ3 = Math.max(
    0, 
    cumulative75PercentTarget - tdsCreditedSoFar - advanceTaxPaidQ1Q2
  );

  const handleShareForecastWhatsApp = () => {
    const text = `*STATUTORY TAX CASH OUTFLOW FORECAST*\n\n` +
      `Entity: *${clientName}*\n\n` +
      `1️⃣ *Monthly GSTR-3B (Due 20-Oct)*\n` +
      `• Gross GST Output: ₹${estimatedSalesTax.toLocaleString("en-IN")}\n` +
      `• GSTR-2B Input Tax Credit: -₹${eligible2bItc.toLocaleString("en-IN")}\n` +
      `👉 *Net Cash GST Required:* ₹${netGstCashRequired.toLocaleString("en-IN")}\n\n` +
      `2️⃣ *Q3 Advance Tax Installment (Due 15-Dec - 75% Cutoff)*\n` +
      `• Projected Annual Profit: ₹${estimatedFullYearProfit.toLocaleString("en-IN")}\n` +
      `• 75% Cumulative Tax Target: ₹${cumulative75PercentTarget.toLocaleString("en-IN")}\n` +
      `• Less TDS Deducted: -₹${tdsCreditedSoFar.toLocaleString("en-IN")}\n` +
      `• Less Q1/Q2 Already Paid: -₹${advanceTaxPaidQ1Q2.toLocaleString("en-IN")}\n` +
      `👉 *Net Advance Tax Due for Q3:* ₹${netAdvanceTaxDueQ3.toLocaleString("en-IN")}\n\n` +
      `Prepared by Brains & Taxes Advisory. Please reserve bank treasury funds.`;

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-btred-logo border border-red-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-btred-logo" /> Early Cash Flow Radar
            </span>
            <span className="text-xs text-slate-600 font-semibold">Zero 11th-Hour Cash Surprises</span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-1">
            Advance Tax &amp; GST Outflow Forecaster
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Projects statutory tax cash outflows 7–10 days in advance so your treasury team can allocate bank working capital smoothly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareForecastWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" /> Share Forecast with CFO
          </button>
        </div>
      </div>

      {/* Two Column Grid: Upcoming GST 3B (20th) + Next Advance Tax (15th Dec) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Monthly GSTR-3B Cash Ledger Forecast */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-btred-logo" />
                <span className="text-xs font-black text-slate-900 uppercase">GSTR-3B Cash Outflow (Sept 2026)</span>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Due: 20-Oct
              </span>
            </div>

            <div className="space-y-3 text-xs pt-1">
              <div>
                <div className="flex justify-between items-center text-slate-600 mb-1">
                  <span>Gross Outward Tax Liability (Sales):</span>
                  <span className="font-bold text-slate-900 font-mono">₹{estimatedSalesTax.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="2000000"
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

              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>Existing Electronic Cash Ledger Balance:</span>
                <span className="font-mono">₹0</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-extrabold text-slate-900">Net Cash Required to Deposit:</span>
                <span className="text-lg font-black text-rose-600 font-mono">
                  ₹{netGstCashRequired.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Matches GSTR-2B portal sync. If any supplier delays filing, cash outflow may increase by unfiled ITC.
            </span>
          </div>
        </div>

        {/* Card 2: Q3 Advance Tax Cutoff (15th December) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-btred-logo" />
                <span className="text-xs font-black text-slate-900 uppercase">Advance Tax Q3 (75% Cutoff)</span>
              </div>
              <span className="text-[11px] font-bold text-btred-logo bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                Due: 15-Dec
              </span>
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
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center text-slate-600 text-[11px]">
                <span>Total Annual Corporate Tax (@{corporateTaxRate}%):</span>
                <span className="font-mono font-bold">₹{totalEstimatedAnnualTax.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-700 text-[11px]">
                <span>Less: Form 26AS TDS Deducted by Customers:</span>
                <span className="font-mono font-bold">-₹{tdsCreditedSoFar.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center text-blue-700 text-[11px]">
                <span>Less: Q1 &amp; Q2 Advance Tax Already Deposited:</span>
                <span className="font-mono font-bold">-₹{advanceTaxPaidQ1Q2.toLocaleString("en-IN")}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-slate-900 block">Q3 Installment Payable:</span>
                  <span className="text-[10px] text-slate-600">Section 234C Interest Safe</span>
                </div>
                <span className="text-lg font-black text-indigo-700 font-mono">
                  ₹{netAdvanceTaxDueQ3.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Pre-paying this installment avoids mandatory 1% per month interest penalty under Section 234C of the Income Tax Act.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
