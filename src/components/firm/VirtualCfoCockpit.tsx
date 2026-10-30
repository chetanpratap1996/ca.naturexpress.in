"use client";

import React, { useState, useMemo } from "react";
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
  Users,
  FileText,
  Printer,
  X,
  Share2,
  Check,
  Percent,
  Coins,
  ShieldCheck
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";

interface VirtualCfoCockpitProps {
  onBack?: () => void;
}

interface ProductLineItem {
  name: string;
  marginPct: number;
  monthlyRevenue: number;
  cogs: number;
  commentary: string;
  badgeColor: string;
}

export const VirtualCfoCockpit: React.FC<VirtualCfoCockpitProps> = ({ onBack }) => {
  const { clients } = useTaxoData();
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [burnRateMultiplier, setBurnRateMultiplier] = useState<number>(1);
  const [revenueStressPct, setRevenueStressPct] = useState<number>(0);
  const [dsoReductionDays, setDsoReductionDays] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<"runway" | "working-capital" | "aging" | "margins">("runway");

  // Modals
  const [isBoardPackModalOpen, setIsBoardPackModalOpen] = useState(false);
  const [isDebtorNoticeModalOpen, setIsDebtorNoticeModalOpen] = useState(false);
  const [savedMemosCount, setSavedMemosCount] = useState<number>(0);

  const currentClient = (clients && clients.length > 0)
    ? (clients.find(c => c.id === selectedEntityId) || clients[0])
    : null;

  // Dynamic Financial Modeling per Client Entity
  const turnoverCr = currentClient?.turnoverCr || 10.0;
  const turnoverInr = turnoverCr * 10000000;
  const baseMonthlyInflow = turnoverInr / 12;
  const baseMonthlyOpex = baseMonthlyInflow * 0.72; // 72% base operational cost
  
  // Stressed Variables
  const monthlyInflow = baseMonthlyInflow * (1 - revenueStressPct / 100);
  const monthlyOpex = baseMonthlyOpex * burnRateMultiplier;
  const netMonthlyCashflow = monthlyInflow - monthlyOpex;
  const liquidCashBank = baseMonthlyOpex * 3.5; // ~3.5 months of cash reserves
  const grossCoverMonths = Math.round((liquidCashBank / monthlyOpex) * 10) / 10;

  // Real Runway Calculation (Statutory Financial Model)
  const isCashSurplus = netMonthlyCashflow >= 0;
  const calculatedRunwayMonths: number = isCashSurplus 
    ? 99 
    : Math.max(1, Math.round((liquidCashBank / Math.abs(netMonthlyCashflow)) * 10) / 10);

  // Dynamic Working Capital Metrics
  const receivablesTotal = Math.round(baseMonthlyInflow * 1.9); // ~57 days of sales
  const debtorsOver90Days = Math.round(receivablesTotal * 0.091);
  const cashUnlockedFromDso = Math.round((baseMonthlyInflow / 30) * dsoReductionDays);

  // Industry-Tailored Product Lines based on Client DNA
  const productLines: ProductLineItem[] = useMemo(() => {
    const name = (currentClient?.name || "").toLowerCase();
    if (name.includes("autotech") || name.includes("precision") || name.includes("alloy")) {
      return [
        {
          name: "OEM Castings & Machined Auto Heads",
          marginPct: 44.8,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.52),
          cogs: Math.round(baseMonthlyInflow * 0.52 * 0.552),
          commentary: "Supplied directly to Tier-1 OEMs under long-term contract. Consistent EBITDA margins.",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200"
        },
        {
          name: "Replacement Market Brake Discs & Drums",
          marginPct: 56.2,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.32),
          cogs: Math.round(baseMonthlyInflow * 0.32 * 0.438),
          commentary: "Higher retail distribution pricing power. Immediate distributor advances received.",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
        },
        {
          name: "Secondary Scrap & Ingot Recycling",
          marginPct: 18.5,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.16),
          cogs: Math.round(baseMonthlyInflow * 0.16 * 0.815),
          commentary: "Energy and raw scrap melting costs compressing gross yield. Recommend price escalation clause.",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
        }
      ];
    } else if (name.includes("zenith") || name.includes("saas") || name.includes("tech")) {
      return [
        {
          name: "Enterprise Annual SaaS Subscriptions (ARR)",
          marginPct: 84.5,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.65),
          cogs: Math.round(baseMonthlyInflow * 0.65 * 0.155),
          commentary: "AWS hosting & LLM token costs minimal relative to recurring revenue. High valuation multiple.",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200"
        },
        {
          name: "Implementation & Systems Consulting",
          marginPct: 46.2,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.22),
          cogs: Math.round(baseMonthlyInflow * 0.22 * 0.538),
          commentary: "Manpower-intensive delivery. Margins capped by senior developer salaries.",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
        },
        {
          name: "Custom Integration APIs & Dedicated SLA",
          marginPct: 62.8,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.13),
          cogs: Math.round(baseMonthlyInflow * 0.13 * 0.372),
          commentary: "High stickiness; 100% renewal rate observed in enterprise banking accounts.",
          badgeColor: "bg-purple-50 text-purple-800 border-purple-200"
        }
      ];
    } else if (name.includes("retail") || name.includes("hypermarket")) {
      return [
        {
          name: "Private Label Staples & Packaged Grocery",
          marginPct: 36.4,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.48),
          cogs: Math.round(baseMonthlyInflow * 0.48 * 0.636),
          commentary: "Direct farmer/mill sourcing yielding 12% higher margin than national brands.",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200"
        },
        {
          name: "Apparel, Footwear & Festive Lifestyle",
          marginPct: 52.1,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.34),
          cogs: Math.round(baseMonthlyInflow * 0.34 * 0.479),
          commentary: "High seasonal margin peak; strict inventory markdown required after 60 days.",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
        },
        {
          name: "Consumer Electronics & Appliances",
          marginPct: 14.8,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.18),
          cogs: Math.round(baseMonthlyInflow * 0.18 * 0.852),
          commentary: "Low margin brand footfall driver. Compensated by vendor volume schemes.",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200"
        }
      ];
    } else {
      // Default: Pratwi Solutions & IT Consulting
      return [
        {
          name: "Annual Enterprise Technology Retainers",
          marginPct: 68.4,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.55),
          cogs: Math.round(baseMonthlyInflow * 0.55 * 0.316),
          commentary: "Predictable recurring cash inflow with near-zero customer churn.",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200"
        },
        {
          name: "Custom Enterprise Software Architecture",
          marginPct: 51.5,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.30),
          cogs: Math.round(baseMonthlyInflow * 0.30 * 0.485),
          commentary: "Milestone-based billing. Ensure 30% advance before kickoff.",
          badgeColor: "bg-blue-50 text-blue-800 border-blue-200"
        },
        {
          name: "Managed Cloud Infrastructure & Security Support",
          marginPct: 41.2,
          monthlyRevenue: Math.round(baseMonthlyInflow * 0.15),
          cogs: Math.round(baseMonthlyInflow * 0.15 * 0.588),
          commentary: "Third-party vendor tools take 35% of gross fee; renegotiate partner discount.",
          badgeColor: "bg-purple-50 text-purple-800 border-purple-200"
        }
      ];
    }
  }, [currentClient, baseMonthlyInflow]);

  const handleSaveAdvisoryMemo = () => {
    setSavedMemosCount(prev => prev + 1);
    toast.success(
      "Scenario Saved to Advisory Dossier",
      `Capital runway simulation saved for ${currentClient?.name}. Attached to Q3 Board Memo.`
    );
  };

  const handleSendDebtorNoticeWhatsApp = (debtorName: string, amount: number) => {
    openWhatsAppPreset("919820011223", "FEE_INVOICE_UTR", {
      clientName: debtorName,
      firmName: "GPA & Co. (on behalf of " + (currentClient?.name || "Client") + ")",
      serviceName: "Outstanding Commercial Receivables > 90 Days",
      invoiceNo: "COMMERCIAL-OVERDUE",
      invoiceAmount: amount,
      portalUrl: "https://ca.naturexpress.in/"
    });
    toast.success("Legal Notice Dispatched", `Section 138 / Commercial demand sent to ${debtorName}.`);
    setIsDebtorNoticeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Entity Selector */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> High-Margin Advisory Engine
            </span>
            <span className="text-xs text-slate-500 font-semibold">Billed at ₹75,000 – ₹2,50,000/mo</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Virtual CFO Executive Cockpit
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Board-ready financial intelligence, capital runway forecasting, and working capital optimization for promoters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Entity Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedEntityId || currentClient?.id || ""}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 outline-none cursor-pointer max-w-[240px] truncate"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Export Board Pack Button (Opens Professional Modal) */}
          <button
            onClick={() => setIsBoardPackModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Board Pack (PDF)</span>
          </button>
        </div>
      </div>

      {/* Top 4 Core vCFO Financial Metrics (Mathematically Sound) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Cash Runway */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-indigo-400 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Runway</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isCashSurplus ? "∞ Safe" : `${calculatedRunwayMonths} Mo`}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isCashSurplus 
                ? "text-emerald-700 bg-emerald-50 border border-emerald-200" 
                : calculatedRunwayMonths < 6 
                ? "text-rose-700 bg-rose-50 border border-rose-200" 
                : "text-amber-700 bg-amber-50 border border-amber-200"
            }`}>
              {isCashSurplus ? "Cash Positive" : calculatedRunwayMonths < 6 ? "Critical Deficit" : "Stressed Buffer"}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
            <span>Liquid Reserves: <strong>{formatCurrencyINR(liquidCashBank)}</strong></span>
            <span>Monthly OPEX: <strong>{formatCurrencyINR(monthlyOpex)}</strong></span>
          </div>
        </div>

        {/* Metric 2: Working Capital Cycle */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-indigo-400 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Conversion Cycle</span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">50 Days</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              -6d vs Q1
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
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
            <span className="text-3xl font-black text-rose-600">{formatCurrencyINR(debtorsOver90Days)}</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              High Risk
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
            <span>Total Receivables: <strong>{formatCurrencyINR(receivablesTotal)}</strong></span>
            <span className="text-rose-600 font-bold">9.1% Overdue</span>
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
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              +2.1% YoY
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
            <span>Monthly Revenue: <strong>{formatCurrencyINR(monthlyInflow)}</strong></span>
            <span>COGS: <strong>{formatCurrencyINR(monthlyInflow * 0.616)}</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("runway")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "runway"
              ? "bg-btred-logo text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Runway Stress Simulator
        </button>
        <button
          onClick={() => setActiveTab("working-capital")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "working-capital"
              ? "bg-btred-logo text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Working Capital (DSO / DPO / DIO)
        </button>
        <button
          onClick={() => setActiveTab("aging")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "aging"
              ? "bg-btred-logo text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Debtor Aging &amp; Default Radar
        </button>
        <button
          onClick={() => setActiveTab("margins")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === "margins"
              ? "bg-btred-logo text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Unit Margins by Product Line
        </button>
      </div>

      {/* Tab 1: Live Capital Stress Testing Simulator */}
      {activeTab === "runway" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-btred-logo" />
                Live Capital Stress Testing Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Adjust sensitivity parameters to simulate macroeconomic downturns or cost spikes for the client board.
              </p>
            </div>
            <button
              onClick={() => {
                setBurnRateMultiplier(1);
                setRevenueStressPct(0);
              }}
              className="text-xs text-btred-logo hover:underline font-bold"
            >
              Reset to Base Model
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {/* Control 1: Revenue Drop Stress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Revenue Shock / Slowdown</span>
                <span className="text-rose-600 font-black">-{revenueStressPct}% Inflow</span>
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
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>0% (Base Plan)</span>
                <span>-25% (Mild Downturn)</span>
                <span>-50% (Severe Crisis)</span>
              </div>
            </div>

            {/* Control 2: Cost Inflation / Burn Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Monthly OPEX / Headcount Inflation</span>
                <span className="text-btred-logo font-black">+{Math.round((burnRateMultiplier - 1) * 100)}% Burn</span>
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
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Base (1.0x)</span>
                <span>+50% (1.5x Inflation)</span>
                <span>+100% (2.0x Double OPEX)</span>
              </div>
            </div>
          </div>

          {/* Dynamic Sensible Advisory Takeaway */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                CA Partner Advisory Takeaway
              </span>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {isCashSurplus ? (
                  <>
                    Under this scenario, the business continues to generate a monthly operating cash surplus of{" "}
                    <strong>{formatCurrencyINR(netMonthlyCashflow)}</strong>. Even under a 100% freeze in new collections, liquid reserves provide a{" "}
                    <strong>{grossCoverMonths}-month zero-revenue defense cover</strong>. Recommended Strategy: Direct excess surplus to early supplier payment discounts (yielding 18%+ annualized return) or capacity capex.
                  </>
                ) : calculatedRunwayMonths < 6 ? (
                  <>
                    <strong className="text-rose-600">CRITICAL RUNWAY ALERT:</strong> Under this stress test, net cash deficit widens to{" "}
                    <strong>{formatCurrencyINR(Math.abs(netMonthlyCashflow))}/month</strong>, exhausting liquid reserves in{" "}
                    <strong className="text-rose-600">{calculatedRunwayMonths} months</strong>. Recommended Strategy: Immediate freeze on non-essential headcount expansion, aggressive debtor recovery on 60+ day receivables, and short-term CC/OD limit activation.
                  </>
                ) : (
                  <>
                    Under this stress test, net cashflow contracts to a deficit of{" "}
                    <strong>{formatCurrencyINR(Math.abs(netMonthlyCashflow))}/month</strong> with an estimated runway buffer of{" "}
                    <strong>{calculatedRunwayMonths} months</strong>. Recommended Strategy: Enforce strict working capital controls and review vendor payment cycles.
                  </>
                )}
              </p>
            </div>
            <button 
              onClick={handleSaveAdvisoryMemo}
              className="px-4 py-2.5 bg-btred-logo text-white text-xs font-bold rounded-xl shrink-0 hover:bg-red-700 transition shadow-sm"
            >
              Save Scenario as Advisory Memo {savedMemosCount > 0 ? `(${savedMemosCount})` : ""}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Working Capital Breakdown & Unlocking Simulator */}
      {activeTab === "working-capital" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Working Capital &amp; Cash Conversion Cycle</h3>
              <p className="text-xs text-slate-500">
                Industry benchmark analysis and liquid cash release forecasting.
              </p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-200">
              CCC Formula: DSO (64d) + DIO (28d) - DPO (42d) = 50 Days
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase">DSO (Days Sales Outstanding)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">64 Days</div>
              <p className="text-xs text-rose-600 mt-1 font-bold">14 days slower than industry average (50d)</p>
              <div className="mt-3 text-[11px] text-slate-600 leading-relaxed">
                ₹38 Lakhs trapped in customer credit delays. Reducing DSO by {dsoReductionDays} days unlocks{" "}
                <strong className="text-emerald-700">{formatCurrencyINR(cashUnlockedFromDso)}</strong> in immediate liquid cash.
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase">DPO (Days Payable Outstanding)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">42 Days</div>
              <p className="text-xs text-emerald-600 mt-1 font-bold">Compliant with Section 43B(h) (within 45d)</p>
              <div className="mt-3 text-[11px] text-slate-600 leading-relaxed">
                Vendor payment turnaround avoids year-end IT disallowance risk while preserving trade credit reputation.
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
              <span className="text-xs font-bold text-slate-500 uppercase">DIO (Days Inventory Outstanding)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">28 Days</div>
              <p className="text-xs text-emerald-600 mt-1 font-bold">Lean inventory turnover</p>
              <div className="mt-3 text-[11px] text-slate-600 leading-relaxed">
                Stock replenishment cycles are well aligned with customer production and delivery schedules.
              </div>
            </div>
          </div>

          {/* Interactive Working Capital Cash Unlocking Simulator */}
          <div className="p-5 bg-gradient-to-r from-emerald-50/60 to-white border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                Working Capital Cash Release Calculator
              </span>
              <span className="text-xs font-bold text-emerald-700">
                Potential Cash Unlocked: <strong className="text-base font-black">{formatCurrencyINR(cashUnlockedFromDso)}</strong>
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Reduce Collection Cycle (DSO) by:</span>
                <span className="font-bold text-slate-900">{dsoReductionDays} Days</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={dsoReductionDays}
                onChange={(e) => setDsoReductionDays(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-600">
              By enforcing automated WhatsApp payment reminders and automated statement reconciliations, {currentClient?.name} can reduce DSO by {dsoReductionDays} days, releasing {formatCurrencyINR(cashUnlockedFromDso)} without taking bank debt.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Debtor Aging & Default Radar */}
      {activeTab === "aging" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Debtor Aging &amp; Default Recovery Radar</h3>
              <p className="text-xs text-slate-500">
                Identify stuck commercial receivables before they turn into bad debts requiring CARO write-offs.
              </p>
            </div>
            <button 
              onClick={() => setIsDebtorNoticeModalOpen(true)}
              className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100 flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" /> 1-Click Legal Notice to 90+ Day Debtors
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
              <div className="text-sm font-black text-slate-900">{formatCurrencyINR(Math.round(receivablesTotal * 0.53))}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-btred-logo" />
                <div>
                  <div className="text-xs font-bold text-slate-900">31 – 60 Days (Follow-up Window)</div>
                  <div className="text-[11px] text-slate-500">First automated reminder dispatched, typical enterprise credit cycle</div>
                </div>
              </div>
              <div className="text-sm font-black text-slate-900">{formatCurrencyINR(Math.round(receivablesTotal * 0.26))}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900">61 – 90 Days (Attention Required)</div>
                  <div className="text-[11px] text-slate-500">Escalated to CFO, weekly follow-up protocol initiated</div>
                </div>
              </div>
              <div className="text-sm font-black text-amber-700">{formatCurrencyINR(Math.round(receivablesTotal * 0.11))}</div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-2xl flex items-center justify-between border border-rose-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div>
                  <div className="text-xs font-bold text-rose-900">90+ Days (Critical Default / Impairment Risk)</div>
                  <div className="text-[11px] text-rose-700 font-medium">Provision for doubtful debts mandatory under CARO 2020</div>
                </div>
              </div>
              <div className="text-sm font-black text-rose-600">{formatCurrencyINR(debtorsOver90Days)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Unit Margins by Product Line (Dynamically Grounded in Client DNA) */}
      {activeTab === "margins" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900">Product Line Economics &amp; Gross Margins</h3>
              <p className="text-xs text-slate-500">
                Direct gross margin contribution after allocating direct labor, materials, and direct cloud/freight expenses for {currentClient?.name}.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
              Turnover: ₹{turnoverCr} Cr
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {productLines.map((line, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${line.badgeColor}`}>
                <div className="text-xs font-black uppercase tracking-wider">{line.name}</div>
                <div className="text-2xl font-black mt-1 text-slate-900">{line.marginPct}% Gross Margin</div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Monthly Revenue:</span>
                    <strong>{formatCurrencyINR(line.monthlyRevenue)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct COGS:</span>
                    <strong>{formatCurrencyINR(line.cogs)}</strong>
                  </div>
                  <p className="pt-2 text-[11px] text-slate-700 border-t border-slate-200/60 leading-relaxed font-medium">
                    {line.commentary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: EXECUTIVE BOARD PACK (PDF) PRESENTATION VIEW */}
      {isBoardPackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                  Virtual CFO Advisory Board Presentation
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {currentClient?.name} &bull; Q3 Financial Health Docket
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Prepared by: GPA &amp; Co., Chartered Accountants &bull; FRN: 022998C &bull; {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setIsBoardPackModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Executive Summary Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Annualized Turnover</span>
                <span className="font-black text-slate-900 text-sm">₹{turnoverCr} Cr</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Run-Rate</span>
                <span className="font-black text-slate-900 text-sm">{formatCurrencyINR(monthlyInflow)}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Liquid Cash Reserves</span>
                <span className="font-black text-emerald-700 text-sm">{formatCurrencyINR(liquidCashBank)}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Runway Assessment</span>
                <span className="font-black text-indigo-700 text-sm">{isCashSurplus ? "∞ Cash Positive" : `${calculatedRunwayMonths} Mo`}</span>
              </div>
            </div>

            {/* Working Capital Scorecard */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                <span>Working Capital Metric</span>
                <span>Current Performance</span>
                <span>Industry Benchmark</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Days Sales Outstanding (DSO)</span>
                <strong className="text-rose-600">64 Days</strong>
                <span>50 Days</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Days Payable Outstanding (DPO)</span>
                <strong className="text-emerald-700">42 Days</strong>
                <span>45 Days (Sec 43B-h Limit)</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Cash Conversion Cycle (CCC)</span>
                <strong className="text-slate-900">50 Days</strong>
                <span>42 Days</span>
              </div>
            </div>

            {/* Strategic Advisory Takeaway */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-1 text-xs text-indigo-950">
              <span className="font-black flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-indigo-700" /> Official CA Partner Advisory Opinion
              </span>
              <p className="text-[11px] leading-relaxed text-indigo-900">
                The entity maintains a resilient balance sheet with {grossCoverMonths} months of emergency OPEX reserves. To optimize return on capital, we advise the Board to implement stricter 30-day payment terms for distributor accounts, unlocking {formatCurrencyINR(cashUnlockedFromDso)} in non-debt working capital liquidity.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBoardPackModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success("Board Pack Dispatched", `Financial Advisory PDF sent to ${currentClient?.name} Board Members.`);
                    setIsBoardPackModalOpen(false);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Transmit to Promoter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LEGAL NOTICE TO 90+ DAY DEBTORS */}
      {isDebtorNoticeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider">
                  Commercial Recovery Notice
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  Overdue Commercial Receivables (&gt;90 Days)
                </h4>
                <p className="text-xs text-slate-500">Total Impaired Amount: {formatCurrencyINR(debtorsOver90Days)}</p>
              </div>
              <button
                onClick={() => setIsDebtorNoticeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Select Defaulting Account:</span>
              {[
                { name: "Tata Projects EPC Division", amount: 850000, days: 112 },
                { name: "Reliance Retail Hub Vendor Ledger", amount: 600000, days: 98 }
              ].map((debtor, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">{debtor.name}</strong>
                    <span className="text-[10px] text-rose-600 font-bold">{debtor.days} days overdue</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block">{formatCurrencyINR(debtor.amount)}</span>
                    <button
                      onClick={() => handleSendDebtorNoticeWhatsApp(debtor.name, debtor.amount)}
                      className="text-[10px] text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition mt-1 inline-flex items-center gap-1"
                    >
                      <Send className="w-2.5 h-2.5" /> WhatsApp Demand
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              Notices cite Section 138 NI Act and MSME Interest Act (compound interest at 3x RBI bank rate for delayed payments).
            </p>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsDebtorNoticeModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
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
