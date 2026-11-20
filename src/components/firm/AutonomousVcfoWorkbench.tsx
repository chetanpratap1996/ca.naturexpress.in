"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Download,
  Copy,
  Check,
  Building2,
  Users,
  Clock,
  Briefcase,
  Zap,
  Sliders,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  BadgeAlert
} from "lucide-react";
import { playSoftClick, playSuccessChime } from "@/lib/audio/soundEffects";
import { toast } from "@/components/shared/ToastNotification";
import {
  ClientVcfoProfile,
  PracticeIntelligenceSummary,
  getCorporateVcfoProfiles,
  getPracticeIntelligenceSummary,
  generateScopeExpansionNotice,
  compileVcfoBoardDossier,
  generateCmaDocket,
  WeeklyCashFlowBucket
} from "@/lib/vcfo/autonomousVcfoEngine";

export function AutonomousVcfoWorkbench() {
  const [activeTab, setActiveTab] = useState<"client-vcfo" | "practice-intelligence" | "stress-testing">("client-vcfo");
  const [vcfoProfiles, setVcfoProfiles] = useState<ClientVcfoProfile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("client-apex");
  const [practiceSummary, setPracticeSummary] = useState<PracticeIntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Drawer state for Scope Revision Notice
  const [previewNoticeText, setPreviewNoticeText] = useState<string | null>(null);
  const [selectedNoticeClient, setSelectedNoticeClient] = useState<string>("");

  // Modal / Drawer state for Board Dossier
  const [previewDossierText, setPreviewDossierText] = useState<string | null>(null);

  // Modal / Drawer state for Banker's Docket (CMA Pack)
  const [previewCmaDocket, setPreviewCmaDocket] = useState<any>(null);

  // Stress Testing Parameters
  const [revenueDrop, setRevenueDrop] = useState<number>(15);
  const [debtorDelay, setDebtorDelay] = useState<number>(20);
  const [opexInflation, setOpexInflation] = useState<number>(10);
  const [stressedBuckets, setStressedBuckets] = useState<WeeklyCashFlowBucket[]>([]);
  const [stressRiskLevel, setStressRiskLevel] = useState<string>("MODERATE");

  useEffect(() => {
    // Initial fetch from engine
    const profiles = getCorporateVcfoProfiles();
    const summary = getPracticeIntelligenceSummary();
    setVcfoProfiles(profiles);
    setPracticeSummary(summary);
    if (profiles.length > 0) {
      setSelectedClientId(profiles[0].clientId);
      setStressedBuckets(profiles[0].weeklyCashFlows);
    }
    setLoading(false);
  }, []);

  const selectedProfile = vcfoProfiles.find((p) => p.clientId === selectedClientId) || vcfoProfiles[0];

  const handleExportBoardDossier = (profile: ClientVcfoProfile) => {
    playSoftClick();
    const dossier = compileVcfoBoardDossier(profile);
    setPreviewDossierText(dossier);
    playSuccessChime();
    toast.success("Executive vCFO Board Dossier compiled successfully!");
  };

  const handleGenerateCma = (profile: ClientVcfoProfile) => {
    playSoftClick();
    const cma = generateCmaDocket(profile);
    setPreviewCmaDocket(cma);
    playSuccessChime();
    toast.success("1-Click Banker's Docket (CMA Pack) assembled under Tandon Method II!");
  };

  const handleGenerateScopeNotice = (client: any) => {
    playSoftClick();
    const notice = generateScopeExpansionNotice(client);
    setSelectedNoticeClient(client.clientName);
    setPreviewNoticeText(notice);
    playSuccessChime();
    toast.success(`Drafted SA 210 Scope Addendum for ${client.clientName}!`);
  };

  const handleRunStressTest = async () => {
    playSoftClick();
    try {
      const res = await fetch("/api/vcfo/autonomous-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RUN_STRESS_TEST",
          clientId: selectedClientId,
          stressParams: {
            revenueDropPercent: revenueDrop,
            debtorDelayDays: debtorDelay,
            opexInflationPercent: opexInflation,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStressedBuckets(data.data.stressedCashFlows);
        setStressRiskLevel(data.data.runwayRiskLevel);
        playSuccessChime();
        toast.success("Liquidity stress-test simulation complete!");
      }
    } catch {
      toast.error("Stress simulation failed. Retrying...");
    }
  };

  if (loading || !selectedProfile || !practiceSummary) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <Sparkles className="h-5 w-5 animate-spin text-amber-600" />
          <span>Synchronizing vCFO & Practice Intelligence Engines...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl border-2 border-red-500 bg-white p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200">
                <Sparkles className="h-3.5 w-3.5 text-red-600" />
                Phase 3: Weeks 49–52
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                Ind AS 7 Direct Method
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-300">
                RBI Tandon Norms CR ≥ 1.33:1
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              Autonomous Virtual CFO &amp; Practice Intelligence Engine
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              13-week rolling cash flow forecasting, Section 43B(h) MSME payment sequencing, bank covenant sentinel, and real-time firm realization rates with SA 210 scope creep addendums.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleGenerateCma(selectedProfile)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 transition-all active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4" />
              1-Click Banker&apos;s Docket (CMA)
            </button>
            <button
              onClick={() => handleExportBoardDossier(selectedProfile)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 border border-slate-300 shadow-sm hover:bg-slate-200 transition-all active:scale-95"
            >
              <Download className="h-4 w-4 text-red-600" />
              Export Board Dossier
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-200 pt-5">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 shadow-2xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Firm Realized Revenue
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900">
              ₹{(practiceSummary.totalRealizedRevenueInr / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Across {practiceSummary.firmWideTotalClients} Active Clients
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 shadow-2xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Average Effective Hourly Rate
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900">
              ₹{practiceSummary.averageFirmEhrInr.toLocaleString("en-IN")}/hr
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
              Target: ₹1,200/hr (Exceeded by +13%)
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 shadow-2xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Total Unbilled WIP &amp; Debtors
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="mt-1 text-xl font-bold text-red-600">
              ₹{((practiceSummary.unbilledWipPoolInr + practiceSummary.totalDebtorsPoolInr) / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              ₹{(practiceSummary.unbilledWipPoolInr / 100000).toFixed(2)}L Unbilled WIP
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 shadow-2xs">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Average Capital Lock-Up
              <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {practiceSummary.averageLockUpDays} Days
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
              WIP Days + Debtor Days
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("client-vcfo");
          }}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition-colors ${
            activeTab === "client-vcfo"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Corporate Client vCFO Sentinel
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 font-bold">13-Week</span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("practice-intelligence");
          }}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition-colors ${
            activeTab === "practice-intelligence"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Practice Margin & Client Tiering
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 font-bold">Tier A–D</span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("stress-testing");
          }}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition-colors ${
            activeTab === "stress-testing"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="h-4 w-4" />
          Liquidity Stress-Testing Lab
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800 font-bold">Scenario</span>
        </button>
      </div>

      {/* TAB 1: CORPORATE CLIENT VCFO SENTINEL */}
      {activeTab === "client-vcfo" && (
        <div className="space-y-6">
          {/* Client Selector & Quick Overview */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-indigo-600" />
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Corporate Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    playSoftClick();
                    setSelectedClientId(e.target.value);
                  }}
                  className="block mt-0.5 rounded-lg border border-slate-300 bg-slate-50 py-1.5 px-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {vcfoProfiles.map((p) => (
                    <option key={p.clientId} value={p.clientId}>
                      {p.clientName} ({p.industry})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="rounded-lg bg-slate-100 px-3 py-2 border border-slate-200">
                <span className="text-slate-500">Turnover:</span>{" "}
                <span className="font-bold text-slate-900">₹{(selectedProfile.annualTurnoverInr / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="rounded-lg bg-slate-100 px-3 py-2 border border-slate-200">
                <span className="text-slate-500">Monthly Burn:</span>{" "}
                <span className="font-bold text-slate-900">₹{(selectedProfile.monthlyBurnRateInr / 100000).toFixed(2)} Lakhs</span>
              </div>
              <div className="rounded-lg bg-amber-50 px-3 py-2 border border-amber-200">
                <span className="text-amber-700">Safety Floor:</span>{" "}
                <span className="font-bold text-amber-900">₹{(selectedProfile.safetyReserveFloorInr / 100000).toFixed(2)} Lakhs</span>
              </div>
            </div>
          </div>

          {/* Working Capital Diagnostics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Days Sales Outstanding (DSO)</span>
                <span className="font-semibold text-indigo-600">Benchmark: 45d</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {selectedProfile.workingCapital.dsoDays} Days
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Top 3 debtors account for {selectedProfile.workingCapital.topDebtorConcentrationPercent}% of total book.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Days Inventory (DIO)</span>
                <span className="font-semibold text-indigo-600">Benchmark: 55d</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {selectedProfile.workingCapital.dioDays} Days
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Raw material holding normalized across manufacturing batches.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Days Payable (DPO)</span>
                <span className="font-semibold text-emerald-600">Commercial Term</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {selectedProfile.workingCapital.dpoDays} Days
              </div>
              <p className="mt-1 text-xs text-slate-500">
                MSME Section 43B(h) statutory cliff guarded within 45 days.
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-amber-800">
                <span>Cash Conversion Cycle (CCC)</span>
                <span className="font-bold text-amber-900">{selectedProfile.workingCapital.cashConversionCycleDays} Days</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-950">
                ₹{(selectedProfile.workingCapital.trappedCapitalInr / 100000).toFixed(2)}L
              </div>
              <p className="mt-1 text-xs text-amber-700 font-medium">
                Trapped working capital in excess DSO & DIO.
              </p>
            </div>
          </div>

          {/* 13-Week Rolling Cash Flow Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  13-Week Rolling Direct Method Cash Flow Forecast (FY 2026-27)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Weekly Horizon • Statutory Outflows Prioritized
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Week</th>
                    <th className="py-2.5 px-3 font-semibold">Week Commencing</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Inflows (Collections)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Statutory Taxes</th>
                    <th className="py-2.5 px-3 font-semibold text-right">MSME Dues (43B(h))</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Non-MSME Vendor</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Payroll & OPEX</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Debt Service</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Net OCF</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Closing Liquidity</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedProfile.weeklyCashFlows.map((w) => (
                    <tr
                      key={w.weekNumber}
                      className={`hover:bg-slate-50 transition-colors ${
                        w.isDeficitAlert ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900">W{w.weekNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{w.weekStarting}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                        +₹{(w.projectedCollections / 100000).toFixed(2)}L
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-medium">
                        -₹{(w.statutoryTaxesOutflow / 100000).toFixed(2)}L
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700 font-medium">
                        -₹{(w.msmePayablesOutflow / 100000).toFixed(2)}L
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        -₹{(w.nonMsmePayablesOutflow / 100000).toFixed(2)}L
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        -₹{(w.payrollAndOpexOutflow / 100000).toFixed(2)}L
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-700 font-medium">
                        -₹{(w.debtServiceOutflow / 100000).toFixed(2)}L
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          w.netOperatingCashFlow >= 0 ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {w.netOperatingCashFlow >= 0 ? "+" : ""}₹{(w.netOperatingCashFlow / 100000).toFixed(2)}L
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 bg-slate-50/50">
                        ₹{(w.closingLiquidity / 100000).toFixed(2)}L
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {w.isDeficitAlert ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            <AlertTriangle className="h-3 w-3" /> Thin ({w.liquidityBufferDays}d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Safe ({w.liquidityBufferDays}d)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank Covenants Watchdog & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Banking Debt Covenants & Prudential Sentinel
                </h3>
              </div>
              <div className="space-y-3">
                {selectedProfile.bankCovenants.map((c) => (
                  <div key={c.name} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          c.varianceStatus === "SAFE"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.varianceStatus === "NEAR_BREACH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {c.varianceStatus}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-900">{c.currentValue}x</span>
                      <span className="text-xs text-slate-500 font-medium">
                        (Mandate: {c.covenantThreshold}x)
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{c.statutoryNote}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Strategic CFO Directives & Allocation Priorities
                </h3>
              </div>
              <div className="space-y-3">
                {selectedProfile.executiveRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-xs text-amber-950">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-bold text-amber-900">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIRM PRACTICE MARGIN & CLIENT TIERING */}
      {activeTab === "practice-intelligence" && (
        <div className="space-y-6">
          {/* Tier Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Tier A: Prime Champions</div>
              <div className="mt-1 text-2xl font-bold text-emerald-950">{practiceSummary.tierBreakdown.tierA} Clients</div>
              <p className="mt-1 text-xs text-emerald-700">Margin &gt;65%, EHR &gt;₹1,500/hr, zero lock-up.</p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
              <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Tier B: Solid Core</div>
              <div className="mt-1 text-2xl font-bold text-blue-950">{practiceSummary.tierBreakdown.tierB} Clients</div>
              <p className="mt-1 text-xs text-blue-700">Margin 45–65%, routine compliance.</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Tier C: Margin Drag</div>
              <div className="mt-1 text-2xl font-bold text-amber-950">{practiceSummary.tierBreakdown.tierC} Clients</div>
              <p className="mt-1 text-xs text-amber-700">Scope creep detected. +25% fee hike needed.</p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
              <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Tier D: Toxic / Loss-Making</div>
              <div className="mt-1 text-2xl font-bold text-rose-950">{practiceSummary.tierBreakdown.tierD} Clients</div>
              <p className="mt-1 text-xs text-rose-700">Negative margins, &gt;100 lock-up days.</p>
            </div>
          </div>

          {/* Client Profitability & EHR Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Client Realization & Hourly Yield Intelligence (SA 210 Audit)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Real-Time Article Hour & Retainer Audit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Client Name</th>
                    <th className="py-2.5 px-3 font-semibold">Entity</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Annual Retainer</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Realized Fee</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Unbilled WIP</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Billable Hours</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Effective Hourly Rate</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Gross Margin</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Lock-Up</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Tier</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {practiceSummary.clientProfitabilityList.map((c) => (
                    <tr key={c.clientId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {c.clientName}
                        {c.scopeCreepHours > 0 && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            +{c.scopeCreepHours} hrs scope creep
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{c.entityType}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-900">
                        ₹{(c.annualRetainerFeeInr / 100000).toFixed(2)}L
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-700">
                        ₹{(c.realizedFeeInr / 100000).toFixed(2)}L
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-amber-700">
                        {c.unbilledWipInr > 0 ? `₹${(c.unbilledWipInr / 1000).toFixed(0)}k` : "₹0"}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        {c.billableHoursSpent} hrs
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-700">
                        ₹{c.effectiveHourlyRateInr.toLocaleString("en-IN")}/hr
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span
                          className={`${
                            c.grossProfitMarginPercent >= 60
                              ? "text-emerald-700"
                              : c.grossProfitMarginPercent >= 40
                              ? "text-blue-700"
                              : c.grossProfitMarginPercent >= 0
                              ? "text-amber-700"
                              : "text-rose-700"
                          }`}
                        >
                          {c.grossProfitMarginPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-700">
                          {c.totalLockUpDays}d
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.tier === "TIER_A"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : c.tier === "TIER_B"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : c.tier === "TIER_C"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {c.tier.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {c.tier === "TIER_C" || c.tier === "TIER_D" ? (
                          <button
                            onClick={() => handleGenerateScopeNotice(c)}
                            className="inline-flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-500 shadow-sm transition-all active:scale-95"
                          >
                            <FileText className="h-3 w-3" />
                            SA 210 Addendum
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Optimal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCENARIO LIQUIDITY STRESS-TESTING LAB */}
      {activeTab === "stress-testing" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  What-If Liquidity Stress-Testing Lab: {selectedProfile.clientName}
                </h3>
                <p className="text-xs text-slate-500">
                  Simulate severe economic shocks to test runway depletion and calculate emergency working capital buffer requirements.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Revenue Shock / Topline Drop</span>
                  <span className="text-rose-600">-{revenueDrop}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={revenueDrop}
                  onChange={(e) => setRevenueDrop(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0%</span>
                  <span>-15%</span>
                  <span>-30%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Debtor Collection Delay</span>
                  <span className="text-amber-600">+{debtorDelay} Days</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  step="5"
                  value={debtorDelay}
                  onChange={(e) => setDebtorDelay(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0 Days</span>
                  <span>+20 Days</span>
                  <span>+45 Days</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Raw Material / OPEX Inflation</span>
                  <span className="text-indigo-600">+{opexInflation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="2"
                  value={opexInflation}
                  onChange={(e) => setOpexInflation(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0%</span>
                  <span>+10%</span>
                  <span>+20%</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Simulated Risk Horizon:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    stressRiskLevel === "CRITICAL"
                      ? "bg-rose-100 text-rose-800"
                      : stressRiskLevel === "ELEVATED"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {stressRiskLevel} RISK
                </span>
              </div>
              <button
                onClick={handleRunStressTest}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow transition-all active:scale-95"
              >
                <Zap className="h-3.5 w-3.5" />
                Recalculate Stress Matrix
              </button>
            </div>
          </div>

          {/* Stressed Cash Flows Visualization */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
              Simulated 13-Week Closing Liquidity Curve Under Stress
            </h4>
            <div className="grid grid-cols-13 gap-1.5 pt-2">
              {stressedBuckets.map((b) => (
                <div key={b.weekNumber} className="flex flex-col items-center">
                  <div className="h-28 w-full bg-slate-100 rounded flex flex-col justify-end p-0.5">
                    <div
                      style={{ height: `${Math.max(10, Math.min(100, (b.closingLiquidity / 6000000) * 100))}%` }}
                      className={`w-full rounded-sm transition-all ${
                        b.isDeficitAlert ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 mt-1">W{b.weekNumber}</span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    ₹{(b.closingLiquidity / 100000).toFixed(1)}L
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SA 210 SCOPE REVISION NOTICE */}
      {previewNoticeText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-slate-900">
                  SA 210 Scope Creep Addendum: {selectedNoticeClient}
                </h3>
              </div>
              <button
                onClick={() => setPreviewNoticeText(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 max-h-96 overflow-y-auto rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200">
              {previewNoticeText}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewNoticeText);
                  toast.success("Addendum copied to clipboard!");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Notice
              </button>
              <button
                onClick={() => {
                  toast.success("Dispatched via WhatsApp Assessee Approval Desk!");
                  setPreviewNoticeText(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow"
              >
                <Check className="h-3.5 w-3.5" />
                Dispatch to Assessee (SA 580)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BOARD ADVISORY DOSSIER */}
      {previewDossierText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-slate-900">
                  Executive Virtual CFO Board Advisory Dossier
                </h3>
              </div>
              <button
                onClick={() => setPreviewDossierText(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 max-h-[28rem] overflow-y-auto rounded-lg bg-slate-50 p-5 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200">
              {previewDossierText}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewDossierText);
                  toast.success("Dossier copied to clipboard!");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Markdown
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([previewDossierText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `vCFO_Board_Dossier_${selectedProfile.clientId}.txt`;
                  a.click();
                  toast.success("Downloaded Board Dossier file!");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow"
              >
                <Download className="h-3.5 w-3.5" />
                Download Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 1-CLICK BANKER'S DOCKET & CMA REPORT PACK */}
      {previewCmaDocket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    CMA Report &amp; Bank Loan Pack (Tandon Method II MPBF)
                  </h3>
                  <div className="text-xs text-slate-500">
                    {previewCmaDocket.clientName} • Requested Limit: ₹{(previewCmaDocket.sanctionLimitRequested / 10000000).toFixed(2)} Cr
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewCmaDocket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-[30rem] overflow-y-auto rounded-lg bg-slate-50 p-5 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200">
              {previewCmaDocket.docketText}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewCmaDocket.docketText);
                  toast.success("CMA Docket copied to clipboard!");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy CMA Data
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([previewCmaDocket.docketText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `CMA_Banker_Docket_${selectedProfile.clientId}.txt`;
                  a.click();
                  toast.success("Downloaded Certified Banker's Docket!");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow"
              >
                <Download className="h-3.5 w-3.5" />
                Download Loan Pack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
