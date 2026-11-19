"use client";

import React, { useState } from "react";
import { AutopilotExecutionSummary } from "@/lib/automation/practiceAutopilot";
import { formatCurrencyINR } from "@/lib/utils";
import {
  Sparkles,
  Zap,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Lock,
  Receipt,
  Terminal,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";

interface PracticeAutopilotConsoleProps {
  onSweepCompleted?: () => void;
}

export function PracticeAutopilotConsole({ onSweepCompleted }: PracticeAutopilotConsoleProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<AutopilotExecutionSummary | null>(null);
  const [activeCycleTab, setActiveCycleTab] = useState<number>(1);

  const handleRunAutopilot = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/firm-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success && data.summary) {
        setSummary(data.summary);
        toast.success(
          "Practice Sweep Completed",
          `Autonomous sweep finished in ${data.summary.executionDurationMs}ms. Health score: ${data.summary.systemHealthScore}%.`
        );
        if (onSweepCompleted) onSweepCompleted();
      } else {
        toast.error("Sweep Error", data.error || "Unable to complete sweep.");
      }
    } catch (err: any) {
      toast.error("Execution Error", err.message || "Failed to trigger autopilot.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Autopilot Header Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              Practice Autopilot v2.0
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full border border-emerald-200">
              Autonomous Loop Active
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            Firm Self-Driving Operating System
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Eliminates 85% of manual staff chores. Automatically creates statutory returns from Entity DNA, tracks day-accurate CGST Section 47 late fees, auto-decrypts bank statements, enforces 45-day MSME locks, and auto-drafts SAC 9982 invoices.
          </p>
        </div>

        <button
          onClick={handleRunAutopilot}
          disabled={isRunning}
          className={`px-5 py-3 rounded-2xl font-black text-xs text-white shadow-lg transition-all flex items-center gap-2.5 shrink-0 ${
            isRunning
              ? "bg-slate-700 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 hover:scale-[1.02]"
          }`}
        >
          {isRunning ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-purple-200" />
              Executing 5-Cycle Sweep...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-300 fill-emerald-300" />
              Run Autonomous Practice Sweep
            </>
          )}
        </button>
      </div>

      {/* The 5 Autonomous Workflows Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">1. Task Auto-Spawner</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Creates GST, ITR, TDS, MCA returns from Entity DNA registrations with zero manual entry.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-btred-logo">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">2. Penalty Auditor</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Computes daily Section 47 late fees (₹50/day) and Section 50 18% p.a. interest.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">3. Vault Auto-Decrypt</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Unlocks password-protected bank PDFs and advances pipeline to In-Preparation.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">4. Pay-to-Release Gate</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Gates deliverables with "UNPAID DRAFT" and accrues 3x RBI MSMED Act interest.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">5. WIP Auto-Invoicing</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Pre-drafts SAC 9982 invoices with Place of Supply and Section 194J TDS deductions.
          </p>
        </div>
      </div>

      {/* Real-time Summary Card (When sweep executed) */}
      {summary && (
        <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-emerald-300">
                Autonomous Sweep Results
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({summary.executionDurationMs}ms &bull; Health: {summary.systemHealthScore}%)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Triggered by: {summary.triggeredBy}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Tasks Spawned</span>
              <span className="text-lg font-black text-purple-400 mt-1 block">+{summary.tasksSpawned}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Penalty Exposure</span>
              <span className="text-lg font-black text-red-400 mt-1 block">{formatCurrencyINR(summary.totalLateFeeAudited)}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Docs Unlocked</span>
              <span className="text-lg font-black text-emerald-400 mt-1 block">+{summary.vaultDocsAutoUnlocked}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Tasks Advanced</span>
              <span className="text-lg font-black text-emerald-300 mt-1 block">+{summary.tasksAutoAdvanced}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Deliverable Locks</span>
              <span className="text-lg font-black text-amber-400 mt-1 block">{summary.deliverableGatesActive} Clients</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Invoices Drafted</span>
              <span className="text-lg font-black text-blue-400 mt-1 block">+{summary.autoInvoicesDrafted}</span>
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="bg-slate-900 p-3.5 rounded-xl font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800 max-h-40 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
              <Terminal className="w-3.5 h-3.5 text-purple-400" /> Practice Autopilot Kernel Log:
            </div>
            {summary.logMessages.map((msg, idx) => (
              <div key={idx} className="text-slate-300">
                <span className="text-emerald-400 font-bold">&gt;</span> {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
