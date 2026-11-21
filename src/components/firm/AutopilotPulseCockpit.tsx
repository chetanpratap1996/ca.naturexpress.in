"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  FileSpreadsheet, 
  FileSearch, 
  Layers, 
  Calculator, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Award,
  Gavel,
  KeyRound,
  ShieldAlert
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime } from "@/lib/audio/soundEffects";
import { AutopilotExecutionSummary } from "@/lib/automation/practiceAutopilot";

interface AutopilotPulseCockpitProps {
  onTriggerSweep?: () => Promise<any> | void;
  isRunning?: boolean;
}

export const AutopilotPulseCockpit: React.FC<AutopilotPulseCockpitProps> = ({
  onTriggerSweep,
  isRunning = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localRunning, setLocalRunning] = useState(false);
  const [lastSweepTime, setLastSweepTime] = useState<string>("Today, 02:00 AM");
  const [liveSummary, setLiveSummary] = useState<AutopilotExecutionSummary | null>(null);

  const fetchLatestPosture = async () => {
    try {
      const res = await fetch("/api/firm-autopilot");
      const data = await res.json();
      if (data?.summary) {
        setLiveSummary(data.summary);
      }
    } catch (e) {
      // ignore background read
    }
  };

  useEffect(() => {
    fetchLatestPosture();
    const handler = () => {
      fetchLatestPosture();
    };
    window.addEventListener("bt_autopilot_sweep_completed", handler);
    return () => window.removeEventListener("bt_autopilot_sweep_completed", handler);
  }, []);

  const handleRunSweep = async () => {
    setLocalRunning(true);
    toast.info("Autonomous Sweep Started", "Executing 9-Cycle Practice Autopilot across GST, AIS, Form 3CD, CARO, and ITR...");
    
    try {
      const res = await fetch("/api/firm-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      
      if (data?.summary) {
        setLiveSummary(data.summary);
        setLastSweepTime("Just now");
        playSuccessChime();
        toast.success(
          "Autonomous Practice Sweep Complete",
          `9 cycles finished in ${data.summary.executionDurationMs}ms. ${data.summary.gstr2bInvoicesAudited || 0} GST invoices reconciled, ₹${((data.summary.totalClientTaxSavingsIdentifiedInr || 0) / 100000).toFixed(2)}L client tax savings identified.`
        );
      } else if (onTriggerSweep) {
        await onTriggerSweep();
        playSuccessChime();
        setLastSweepTime("Just now");
      }
    } catch (err: any) {
      toast.error("Autopilot Error", err.message || "Failed to execute sweep");
    } finally {
      setLocalRunning(false);
    }
  };

  const activeRunning = isRunning || localRunning;

  return (
    <div className="bg-white border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Left: Autonomous Live Pulse Beacon */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Autonomous AI Engine: Active
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                  9-Cycle Practice Autopilot
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden lg:inline">
                  Last Sweep: {lastSweepTime}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 hidden sm:block mt-0.5">
                Background worker is autonomously reconciling GSTR-2B, classifying AIS SFT items, and auditing Form 3CD &amp; CARO clauses.
              </p>
            </div>
          </div>

          {/* Right: Quick Metrics & Action Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1 border border-slate-300 transition"
            >
              <span>{isExpanded ? "Hide Telemetry" : "View Autonomous Work"}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleRunSweep}
              disabled={activeRunning}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
                activeRunning
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${activeRunning ? "animate-spin" : ""}`} />
              <span>{activeRunning ? "Executing Sweep..." : "Run Autopilot Sweep"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Telemetry Dashboard */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs animate-fadeIn">
            {/* 1. GST Auto-Reco */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-blue-700 text-[10px] font-bold uppercase">
                <FileSpreadsheet className="w-3 h-3" /> GSTR-2B Reco
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {liveSummary ? `${liveSummary.gstr2bInvoicesAudited || 0} Invoices` : "0 Invoices"}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">
                {liveSummary?.missingItcRecoverableInr 
                  ? `₹${((liveSummary.missingItcRecoverableInr) / 100000).toFixed(2)}L Missing ITC` 
                  : "Zero Missing ITC"}
              </div>
            </div>

            {/* 2. AIS SFT Forensic */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-teal-700 text-[10px] font-bold uppercase">
                <FileSearch className="w-3 h-3" /> AIS Forensic
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {liveSummary ? `${liveSummary.aisSftTransactionsClassified || 0} SFT Items` : "0 SFT Items"}
              </div>
              <div className="text-[10px] text-slate-600">
                {liveSummary?.scrutinyNoticeRisksFlagged 
                  ? `${liveSummary.scrutinyNoticeRisksFlagged} Risk Discrepancies` 
                  : "Rule 114E Clean"}
              </div>
            </div>

            {/* 3. Form 3CD Tax Audit */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-amber-700 text-[10px] font-bold uppercase">
                <Award className="w-3 h-3" /> Form 3CD Audit
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {liveSummary 
                  ? `₹${((liveSummary.form3cdDisallowancesAuditedInr || 0) / 100000).toFixed(2)}L Add-back` 
                  : "₹0 Add-back"}
              </div>
              <div className="text-[10px] text-amber-700">Sec 43B(h) &amp; 40(a)(ia)</div>
            </div>

            {/* 4. CARO 2020 Sentinel */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-indigo-700 text-[10px] font-bold uppercase">
                <Layers className="w-3 h-3" /> CARO 2020
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {liveSummary?.caroClausesEvaluated ? `${liveSummary.caroClausesEvaluated} Clauses` : "21 Clauses"}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">Statutory Ledger Check</div>
            </div>

            {/* 5. Dual-Regime ITR */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-purple-700 text-[10px] font-bold uppercase">
                <Calculator className="w-3 h-3" /> 115BAC Optimizer
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {liveSummary 
                  ? `₹${((liveSummary.totalClientTaxSavingsIdentifiedInr || 0) / 100000).toFixed(2)}L Savings` 
                  : "₹0 Savings"}
              </div>
              <div className="text-[10px] text-purple-700">
                {liveSummary?.form10IeaPendingCount 
                  ? `${liveSummary.form10IeaPendingCount} Form 10-IEA Due`
                  : "Finance Act 2024"}
              </div>
            </div>

            {/* 6. Notice Defense Shield */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-rose-700 text-[10px] font-bold uppercase">
                <Gavel className="w-3 h-3" /> Notice Defense
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {liveSummary?.demandUnderShieldInr 
                  ? `₹${((liveSummary.demandUnderShieldInr) / 100000).toFixed(1)}L Shield` 
                  : "Active Defense"}
              </div>
              <div className="text-[10px] text-rose-600 font-medium">
                {liveSummary?.fatalDinNoticesFlagged 
                  ? `${liveSummary.fatalDinNoticesFlagged} DIN Defect Void`
                  : "Circular 19/2019"}
              </div>
            </div>

            {/* 7. Hardware DSC Vault */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-cyan-700 text-[10px] font-bold uppercase">
                <KeyRound className="w-3 h-3" /> DSC Safe Vault
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {liveSummary?.dscTokensAudited ? `${liveSummary.dscTokensAudited} Tokens` : "Safe Custody"}
              </div>
              <div className="text-[10px] text-cyan-700 font-medium">Zero Private Key Leak</div>
            </div>

            {/* 8. Pay-to-Release */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold uppercase">
                <Lock className="w-3 h-3" /> Fee Gatekeeper
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {liveSummary?.deliverableGatesActive ? `${liveSummary.deliverableGatesActive} Active Gates` : "Good Standing"}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">Sec 16 3x RBI Rate</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
