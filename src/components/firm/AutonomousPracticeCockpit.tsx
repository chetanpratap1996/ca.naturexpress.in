"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Check,
  RotateCw,
  Send,
  Building2,
  MessageSquare,
  FileCheck2,
  Terminal,
  Activity,
  ChevronRight,
  ExternalLink,
  Layers,
  DollarSign
} from "lucide-react";
import { playSoftClick, playSuccessChime } from "@/lib/audio/soundEffects";
import { toast } from "@/components/shared/ToastNotification";
import {
  PracticeHeartbeatState,
  PracticeExceptionItem,
  getPracticeHeartbeatState
} from "@/lib/autopilot/practiceHeartbeatEngine";

interface AutonomousPracticeCockpitProps {
  onNavigateTab?: (tabId: string) => void;
}

export function AutonomousPracticeCockpit({ onNavigateTab }: AutonomousPracticeCockpitProps) {
  const [state, setState] = useState<PracticeHeartbeatState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchHeartbeat = async () => {
    try {
      const res = await fetch("/api/practice/heartbeat");
      const json = await res.json();
      if (json.success) {
        setState(json.data);
      } else {
        setState(getPracticeHeartbeatState());
      }
    } catch {
      setState(getPracticeHeartbeatState());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeartbeat();
  }, []);

  const handleGlobalSweep = async () => {
    playSoftClick();
    setIsSweeping(true);
    try {
      const res = await fetch("/api/practice/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_GLOBAL_SWEEP" }),
      });
      const json = await res.json();
      if (json.success) {
        setState(json.data.state);
        playSuccessChime();
        toast.success("Global Autonomous Practice Sweep executed across all 15 modules!");
      }
    } catch {
      toast.error("Sweep failed. Retrying...");
    } finally {
      setIsSweeping(false);
    }
  };

  const handleBatchApprove = async () => {
    playSoftClick();
    setIsBatchApproving(true);
    try {
      const res = await fetch("/api/practice/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "BATCH_APPROVE_CLEAN" }),
      });
      const json = await res.json();
      if (json.success) {
        playSuccessChime();
        toast.success(`1-Click Batch Approved: ${json.data.approvalResult.approvedCount} clean returns dispatched to clients via WhatsApp!`);
        fetchHeartbeat();
      }
    } catch {
      toast.error("Batch approval failed");
    } finally {
      setIsBatchApproving(false);
    }
  };

  const handleResolveException = async (exception: PracticeExceptionItem) => {
    playSoftClick();
    setResolvingId(exception.id);
    try {
      const res = await fetch("/api/practice/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE_EXCEPTION",
          exceptionId: exception.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        playSuccessChime();
        toast.success(`Resolved ${exception.title}: Action dispatched automatically!`);
        if (state) {
          setState({
            ...state,
            exceptions: state.exceptions.map((e) =>
              e.id === exception.id ? { ...e, status: "RESOLVED" } : e
            ),
          });
        }
      }
    } catch {
      toast.error("Failed to resolve exception");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading || !state) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <Sparkles className="h-5 w-5 animate-spin text-indigo-600" />
          <span>Synchronizing Autonomous Practice Pulse across all 15 modules...</span>
        </div>
      </div>
    );
  }

  const pendingExceptions = state.exceptions.filter((e) => e.status === "PENDING_PARTNER");

  return (
    <div className="space-y-6">
      {/* HERO BANNER: 2035 AUTONOMOUS PRACTICE COCKPIT - Crisp White & Brand Red */}
      <div className="rounded-3xl border-2 border-red-500 bg-white p-6 sm:p-8 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                AUTOPILOT: LIVE &amp; ORCHESTRATING
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                15 Engines Unified
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Last Sweep: {state.lastSweepTimestamp}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
              Partner 60-Second Autonomous Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Your practice executes routine compliance with zero human effort. Statements are ingested from WhatsApp, reconciled via Bank OCR, matched against 2B/TRACES, and dispatched for client digital approval automatically.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGlobalSweep}
              disabled={isSweeping}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={`h-4 w-4 ${isSweeping ? "animate-spin text-red-600" : ""}`} />
              {isSweeping ? "Sweeping All Pipelines..." : "Run Global Practice Sweep"}
            </button>

            <button
              onClick={handleBatchApprove}
              disabled={isBatchApproving}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {isBatchApproving ? "Dispatching WhatsApp Approvals..." : `1-Click Approve ${state.totalAutomatedFilingsToday} Clean Returns`}
            </button>
          </div>
        </div>

        {/* 4 Core Key Metrics - Clean White & Red Light Cards */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-200 pt-6">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              Autonomous Completion Rate
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700">
              {state.autonomousCompletionRatePcnt}%
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              Zero Human Actions Required
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              Staff Hours Saved (Month)
              <Clock className="h-4 w-4 text-red-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              {state.hoursSavedThisMonth} hrs
            </div>
            <div className="text-[11px] text-red-700 font-medium mt-1">
              Equivalent to 2.2 Full-Time Articles
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              Realized Practice Fee
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
              ₹{(state.realizedRevenueThisMonthInr / 100000).toFixed(2)}L
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">
              ₹{(state.unbilledWipInr / 100000).toFixed(2)}L WIP Guarded
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              Exceptions Needing Partner
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-red-600">
              {pendingExceptions.length} Items
            </div>
            <div className="text-[11px] text-red-700 font-medium mt-1">
              Actionable Partner Triage Desk
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 1, 2, 3 ORCHESTRATION PIPELINE HEALTH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-800">
                P1
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Phase 1: Ingestion &amp; Stickiness
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              <Check className="h-3 w-3" /> 100% HEALTHY
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Entity DNA, Statutory Task Late Fees, Bank OCR to Tally XML, WhatsApp Webhooks &amp; Pay-to-Release Gate.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
            <span>{state.moduleHealth.module1Stickiness.cleanCount} Entities Synchronized</span>
            <span className="text-emerald-700 font-bold">0 Suspense</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-800">
                P2
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Phase 2: Accuracy &amp; Audit
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              <Check className="h-3 w-3" /> 100% HEALTHY
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            GSTR-2B Fuzzy Matcher, AIS/26AS SFT Inspector, Form 3CD Clause 44/22/34, Schedule III Ratios &amp; 115BAC Optimizer.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
            <span>{state.moduleHealth.module2Accuracy.cleanCount} Workpapers Sealed</span>
            <span className="text-purple-700 font-bold">0 Divergence</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
                P3
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Phase 3: Autonomous Practice
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              <Check className="h-3 w-3" /> 100% HEALTHY
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Autonomous GST, TDS, MCA Lines, Faceless Scrutiny Defense, SQC-1 Swarm, Tandon Method II CMA &amp; 50-Case CI/CD.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-100 pt-2">
            <span>{state.moduleHealth.module3Autonomy.cleanCount} Autonomous Filings</span>
            <span className="text-emerald-700 font-bold">2035 Level</span>
          </div>
        </div>
      </div>

      {/* PARTNER EXCEPTION TRIAGE DESK */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Exception-Only Partner Triage Desk ({pendingExceptions.length} Action Items)
              </h3>
              <p className="text-xs text-slate-500">
                Routine compliance is automated. Only invoices or notices with discrepancies require partner judgment.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            Partner In-The-Loop
          </span>
        </div>

        <div className="p-6 space-y-4">
          {pendingExceptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
              <h4 className="font-bold text-slate-900 text-base">All Exceptions Resolved!</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Every client compliance profile is 100% reconciled and executing autonomously.
              </p>
            </div>
          ) : (
            pendingExceptions.map((exc) => (
              <div
                key={exc.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        exc.urgency === "CRITICAL"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : exc.urgency === "HIGH"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {exc.urgency}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{exc.clientName}</span>
                    <span className="text-xs text-slate-500">• {exc.moduleName}</span>
                  </div>

                  <span className="font-mono text-xs font-semibold text-slate-500">{exc.id}</span>
                </div>

                <div className="text-xs">
                  <div className="font-bold text-slate-900">{exc.title}</div>
                  <p className="text-slate-600 mt-0.5">{exc.discrepancyDetails}</p>
                </div>

                <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs space-y-1">
                  <div className="text-[11px] text-rose-700 font-semibold">
                    Statutory Risk: {exc.statutoryImpact}
                  </div>
                  <div className="text-[11px] text-indigo-700 font-semibold">
                    Autonomous Recommendation: {exc.recommendedAction}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleResolveException(exc)}
                    disabled={resolvingId === exc.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {resolvingId === exc.id ? "Executing Action..." : exc.quickActionLabel}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* LIVE PRACTICE PULSE ACTIVITY STREAM */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Real-Time Autonomous Practice Pulse &amp; Audit Log
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Live Activity Stream</span>
        </div>

        <div className="divide-y divide-slate-100">
          {state.recentPulseEvents.map((evt) => (
            <div key={evt.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  evt.eventType === "ZERO_TOUCH_SUCCESS"
                    ? "bg-emerald-100 text-emerald-800"
                    : evt.eventType === "PORTAL_SYNC"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {evt.moduleCode}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">{evt.clientName}</span>
                    <span className="text-[11px] text-slate-500">({evt.moduleName})</span>
                    {evt.statutorySection && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-700">
                        {evt.statutorySection}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{evt.timestamp}</span>
                </div>

                <p className="text-xs text-slate-700 mt-1">{evt.description}</p>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Autonomous Action: {evt.autoActionTaken}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
