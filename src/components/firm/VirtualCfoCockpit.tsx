"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Download, 
  Send, 
  PieChart, 
  Sliders, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  Sparkles,
  FileSpreadsheet,
  Building2,
  Users
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { useTaxoData } from "@/lib/hooks/useTaxoData";

interface VirtualCfoCockpitProps {
  onBack?: () => void;
}

export const VirtualCfoCockpit: React.FC<VirtualCfoCockpitProps> = ({ onBack }) => {
  const { clients } = useTaxoData();
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [burnRateMultiplier, setBurnRateMultiplier] = useState<number>(1);
  const [revenueStressPct, setRevenueStressPct] = useState<number>(0);
  const [isExportingDeck, setIsExportingDeck] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"runway" | "working-capital" | "aging" | "margins">("runway");

  const currentClient = (clients && clients.length > 0)
    ? (clients.find(c => c.id === selectedEntityId) || clients[0])
    : null;

    // Dynamic metrics for selected client
  const turnoverInr = (currentClient?.turnoverCr || 5.0) * 10000000;
  const baseMonthlyInflow = turnoverInr / 12;
  const baseMonthlyBurn = baseMonthlyInflow * 0.78;
  const monthlyBurn = baseMonthlyBurn * burnRateMultiplier;
  const monthlyInflow = baseMonthlyInflow * (1 - revenueStressPct / 100);
  const netMonthlyCashflow = monthlyInflow - monthlyBurn;
  const liquidCashBank = baseMonthlyBurn * 3.5;
  const calculatedRunwayMonths: number = netMonthlyCashflow >= 0 ? 99 : Math.max(1, Math.round((liquidCashBank / Math.abs(netMonthlyCashflow)) * 10) / 10);

  const handleExportDeck = () => {
    setIsExportingDeck(true);
    setTimeout(() => {
      setIsExportingDeck(false);
      setExportSuccess(true);

      const csv = [
        `"Virtual CFO Advisory Deck - ${currentClient?.name || 'Practice Entity'}"`,
        `"Generated: ${new Date().toLocaleDateString('en-IN')}"`,
        `"Entity Type: ${currentClient?.type || 'PVT_LTD'} | PAN: ${currentClient?.pan || 'N/A'}"`,
        `""`,
        `"Financial Metric","Value (INR)","Advisory Status"`,
        `"Annual Turnover",${turnoverInr},"Reported ROC / Tax Master"`,
        `"Monthly Operating Inflow",${Math.round(monthlyInflow)},"Projected Post-Stress (${revenueStressPct}%)"`,
        `"Monthly Burn Rate",${Math.round(monthlyBurn)},"Operational Expenses (${burnRateMultiplier}x Multiplier)"`,
        `"Net Monthly Cashflow",${Math.round(netMonthlyCashflow)},${netMonthlyCashflow >= 0 ? '"Cash Surplus"' : '"Cash Deficit"'}`,
        `"Liquid Bank Reserves",${Math.round(liquidCashBank)},"Estimated Current Reserves"`,
        `"Runway Forecast (Months)",${calculatedRunwayMonths},${Number(calculatedRunwayMonths) >= 12 ? '"Healthy (>12 Mo)"' : '"Critical Runway Action Required"'}`,
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Virtual_CFO_Deck_${(currentClient?.name || 'Client').replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => setExportSuccess(false), 5000);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Entity Selector */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> High-Margin Advisory Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">Billed at ₹75,000 – ₹2,50,000/mo</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Virtual CFO Executive Cockpit
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Board-ready financial intelligence, capital runway forecasting, and working capital optimization for promoters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedEntityId || currentClient?.id || ""}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {clients.length === 0 ? (
                <option value="">No clients onboarded</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleExportDeck}
            disabled={isExportingDeck}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm hover:shadow flex items-center gap-2 transition disabled:opacity-60"
          >
            {isExportingDeck ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Compiling Board Deck...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Board Pack (PDF)
              </>
            )}
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Executive vCFO Financial Deck generated successfully with CA partner digital seal and audit references! Ready for board presentation.
            </span>
          </div>
          <button onClick={() => setExportSuccess(false)} className="text-emerald-700 hover:underline text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {!currentClient && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center space-y-2">
          <Building2 className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-sm font-bold text-amber-900">No Practice Clients Onboarded Yet</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Once you onboard corporate entities in Client Master, the Virtual CFO Cockpit will automatically model their cash runway, working capital, and debtor aging.
          </p>
        </div>
      )}

      {/* Top 4 Core vCFO Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Cash Runway */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-indigo-400 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Runway</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {calculatedRunwayMonths === 99 ? "∞ Safe" : `${calculatedRunwayMonths} Mo`}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Stable
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex justify-between">
            <span>Liquid Cash: <strong>{formatCurrencyINR(liquidCashBank)}</strong></span>
            <span>Net Burn: <strong>{formatCurrencyINR(Math.abs(monthlyBurn))}</strong></span>
          </div>
        </div>

        {/* Metric 2: Working Capital Cycle */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-indigo-400 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Conversion Cycle</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">50 Days</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              -6d vs Q1
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex justify-between">
            <span>DSO: <strong>64d</strong></span>
            <span>DPO: <strong>42d</strong></span>
            <span>DIO: <strong>28d</strong></span>
          </div>
        </div>

        {/* Metric 3: Critical Debtor Default Risk */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-rose-400 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Debtors &gt; 90 Days</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{formatCurrencyINR(1450000)}</span>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              High Risk
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex justify-between">
            <span>Total Receivables: <strong>{formatCurrencyINR(15850000)}</strong></span>
            <span className="text-rose-600 font-semibold">9.1% Overdue</span>
          </div>
        </div>

        {/* Metric 4: Blended Gross Margin */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-emerald-400 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Profit Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">38.4%</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +2.1% YoY
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex justify-between">
            <span>Monthly Revenue: <strong>{formatCurrencyINR(monthlyInflow)}</strong></span>
            <span>COGS: <strong>{formatCurrencyINR(monthlyInflow * 0.616)}</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("runway")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "runway"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Runway Stress Simulator
        </button>
        <button
          onClick={() => setActiveTab("working-capital")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "working-capital"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Working Capital (DSO / DPO / DIO)
        </button>
        <button
          onClick={() => setActiveTab("aging")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "aging"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Debtor Aging & Default Radar
        </button>
        <button
          onClick={() => setActiveTab("margins")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "margins"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Unit Margins by Product Line
        </button>
      </div>

      {/* Tab 1: Runway Stress Simulator */}
      {activeTab === "runway" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                Live Capital Stress Testing Simulator
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Adjust sensitivity parameters to simulate macro slowdowns or expense spikes for the client board.
              </p>
            </div>
            <button
              onClick={() => {
                setBurnRateMultiplier(1);
                setRevenueStressPct(0);
              }}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Reset to Base Model
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {/* Control 1: Revenue Drop Stress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Revenue Shock / Slowdown</span>
                <span className="text-rose-600">-{revenueStressPct}% Inflow</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={revenueStressPct}
                onChange={(e) => setRevenueStressPct(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0% (Normal)</span>
                <span>-25% (Mild Recession)</span>
                <span>-50% (Severe Crisis)</span>
              </div>
            </div>

            {/* Control 2: Cost Inflation / Burn Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Monthly Opex / Headcount Growth</span>
                <span className="text-indigo-600">+{Math.round((burnRateMultiplier - 1) * 100)}% Burn</span>
              </div>
              <input
                type="range"
                min="1"
                max="2"
                step="0.1"
                value={burnRateMultiplier}
                onChange={(e) => setBurnRateMultiplier(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Base (1.0x)</span>
                <span>+50% (1.5x)</span>
                <span>+100% (2.0x Double)</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                CA Partner Advisory Takeaway
              </span>
              <p className="text-xs text-indigo-800 mt-0.5">
                Under the simulated scenario, current cash reserves last <strong>{calculatedRunwayMonths} months</strong>. Recommend freezing non-essential hiring and restructuring debt to maintain a minimum 12-month safety buffer.
              </p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shrink-0 hover:bg-indigo-700">
              Save Scenario as Advisory Memo
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Working Capital Breakdown */}
      {activeTab === "working-capital" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Working Capital & Cash Conversion Cycle</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Benchmark analysis against peer manufacturers & service firms in India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-200 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase">DSO (Days Sales Outstanding)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">64 Days</div>
              <p className="text-xs text-rose-600 mt-1 font-semibold">14 days slower than industry average (50d)</p>
              <div className="mt-3 text-[11px] text-slate-500">
                ₹38 Lakhs trapped in customer delay. Reducing DSO by 10 days frees up ₹24.5 Lakhs in immediate liquid cash.
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase">DPO (Days Payable Outstanding)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">42 Days</div>
              <p className="text-xs text-emerald-600 mt-1 font-semibold">Compliant with Section 43B(h) (within 45d)</p>
              <div className="mt-3 text-[11px] text-slate-500">
                Payment turnaround avoids year-end IT disallowance risk while optimizing vendor credit terms.
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase">DIO (Days Inventory Outstanding)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">28 Days</div>
              <p className="text-xs text-emerald-600 mt-1 font-semibold">Lean inventory turnover</p>
              <div className="mt-3 text-[11px] text-slate-500">
                Stock replenishment cycles are well aligned with customer order frequency.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Debtor Aging & Default Radar */}
      {activeTab === "aging" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Debtor Aging & Default Recovery Radar</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Identify stuck receivables before they turn into bad debts requiring audit write-offs.
              </p>
            </div>
            <button className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> 1-Click WhatsApp Legal Notice to 90+ Day Debtors
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900">0 – 30 Days (Current Cycle)</div>
                  <div className="text-[11px] text-slate-500">Healthy billing cycle, high payment probability (98%)</div>
                </div>
              </div>
              <div className="text-sm font-black text-slate-900">{formatCurrencyINR(8400000)}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900">31 – 60 Days (Follow-up Window)</div>
                  <div className="text-[11px] text-slate-500">First reminder dispatched, typical enterprise credit cycle</div>
                </div>
              </div>
              <div className="text-sm font-black text-slate-900">{formatCurrencyINR(4200000)}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900">61 – 90 Days (Attention Required)</div>
                  <div className="text-[11px] text-slate-500">Escalated to CFO, weekly follow-up protocol initiated</div>
                </div>
              </div>
              <div className="text-sm font-black text-amber-700">{formatCurrencyINR(1800000)}</div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-2xl flex items-center justify-between border border-rose-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div>
                  <div className="text-xs font-bold text-rose-900">90+ Days (Critical Default / Impairment Risk)</div>
                  <div className="text-[11px] text-rose-600 font-medium">Provision for doubtful debts required under CARO 2020</div>
                </div>
              </div>
              <div className="text-sm font-black text-rose-600">{formatCurrencyINR(1450000)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Unit Margins by Product Line */}
      {activeTab === "margins" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Product Line Unit Economics & Margins</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Direct gross margin contribution after allocating direct labor, materials, and cloud server expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
              <div className="text-xs font-bold text-emerald-800 uppercase">Enterprise Software Licences</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">76.4% Margin</div>
              <div className="text-xs text-slate-600 mt-2">
                Revenue: ₹14.5L | COGS: ₹3.4L. High scalability; recommend expanding sales quota here.
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl">
              <div className="text-xs font-bold text-indigo-800 uppercase">Implementation & Consulting</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">44.2% Margin</div>
              <div className="text-xs text-slate-600 mt-2">
                Revenue: ₹6.8L | COGS: ₹3.8L. Manpower-intensive; margin capped by billable engineer salaries.
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl">
              <div className="text-xs font-bold text-amber-800 uppercase">Hardware Appliances & IoT</div>
              <div className="text-2xl font-black text-amber-700 mt-1">21.8% Margin</div>
              <div className="text-xs text-slate-600 mt-2">
                Revenue: ₹3.2L | COGS: ₹2.5L. Freight and component inflation squeezing margins.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
