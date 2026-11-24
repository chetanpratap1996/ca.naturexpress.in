"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  DollarSign,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  MessageSquare,
  Building2,
  ExternalLink,
  Ban,
  Scale,
  Award,
  Layers,
  Check,
  ChevronDown
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import {
  ClientAssemblyProfile,
  GstExceptionItem,
  getSampleAssemblyProfiles,
  resolvePartnerException
} from "@/lib/gst/autonomousAssemblyLine";

export const AutonomousGstAssemblyLine: React.FC = () => {
  const [profiles, setProfiles] = useState<ClientAssemblyProfile[]>(() => getSampleAssemblyProfiles());
  const [selectedClientId, setSelectedClientId] = useState<string>("client-pratwi");
  const [activeTab, setActiveTab] = useState<"pipeline" | "triage" | "computation">("triage");
  const [triageFilter, setTriageFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState<boolean>(false);

  const activeProfile = profiles.find((p) => p.clientId === selectedClientId) || profiles[0];

  const handleResolveException = (
    exceptionId: string,
    action: "CLAIM" | "BLOCK" | "HOLD" | "ACCEPT"
  ) => {
    playSoftClick();
    const updated = resolvePartnerException(activeProfile, exceptionId, action);
    
    setProfiles((prev) =>
      prev.map((p) => (p.clientId === updated.clientId ? updated : p))
    );

    if (action === "CLAIM") {
      toast.success("ITC Claimed with Indemnity", "Section 16(2)(c) supplier indemnity tag attached. Return table updated.");
    } else if (action === "BLOCK") {
      toast.warning("ITC Quarantined u/s 17(5)", "Shifted to Table 4(D)(1) Ineligible to prevent scrutiny interest.");
    } else if (action === "HOLD") {
      toast.info("Vendor Payment Held", "1-click WhatsApp demand notice queued to defaulting vendor.");
    } else if (action === "ACCEPT") {
      toast.success("Rounding Variance Accepted", "Accepted within statutory threshold limits.");
    }

    if (updated.isCleanProfile) {
      playSuccessChime();
      toast.success(
        "Profile Promoted to Clean!",
        "All exceptions resolved! GSTR-3B draft autonomously released for client sign-off."
      );
    }
  };

  const handleSimulateClientSignOff = () => {
    setIsSimulatingDispatch(true);
    playSoftClick();

    setTimeout(() => {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.clientId === activeProfile.clientId) {
            return {
              ...p,
              status: "CLIENT_SIGNED_OFF",
              pipelineStage: "FILED",
              clientSignedOffAt: new Date().toISOString(),
              auditLog: [
                ...p.auditLog,
                `[${new Date().toLocaleTimeString()}] Client digitally signed off via WhatsApp OTP. GSTR-3B filed to GSTN.`,
              ],
            };
          }
          return p;
        })
      );
      setIsSimulatingDispatch(false);
      playSuccessChime();
      toast.success("GSTR-3B Filed Successfully", "Client signed off via WhatsApp. ARN generated: AA271026009941M.");
    }, 1200);
  };

  const filteredExceptions = activeProfile.exceptions.filter((exc) => {
    const matchesCategory =
      triageFilter === "ALL" ||
      exc.exceptionCategory === triageFilter ||
      (triageFilter === "PENDING" && exc.status === "PENDING_JUDGMENT");
    const matchesSearch =
      exc.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exc.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exc.vendorGstin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalExceptionsPendingAll = profiles.reduce((acc, p) => acc + p.exceptionsCount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. INSTITUTIONAL HEADER & PROFILE PICKER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Module 3.1: Assembly Line
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600" /> 2035-Level Zero-Touch Autonomy
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Rule 88A Optimization
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Autonomous GST Monthly Assembly Line
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Clean profiles execute end-to-end with zero human touch. Partners review only discrepancies and unverified ITC.
            </p>
          </div>

          {/* Client Selector & Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
              <Building2 className="w-4 h-4 text-slate-500 ml-2" />
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  playSoftClick();
                }}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 pr-3 py-1 focus:outline-none cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.clientId} value={p.clientId}>
                    {p.clientName} ({p.status === "CLEAN_AUTO_DISPATCHED" ? "100% Clean" : `${p.exceptionsCount} Exceptions`})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setProfiles(getSampleAssemblyProfiles());
                toast.info("Reset Profiles", "Assembly line reset to institutional baseline.");
                playSoftClick();
              }}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              title="Reset Baseline"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 INSTITUTIONAL TELEMETRY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean Profiles (Zero-Touch)
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
              {profiles.filter((p) => p.status === "CLEAN_AUTO_DISPATCHED" || p.status === "CLIENT_SIGNED_OFF").length} / {profiles.length}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Auto-dispatched to client WhatsApp
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Exception Triage Queue
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-600 mt-1">
              {totalExceptionsPendingAll} Items
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Hides 95% clean records
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> ITC at Risk (Sec 16/17)
            </div>
            <div className="text-lg sm:text-2xl font-black text-rose-600 mt-1">
              {formatCurrencyINR(
                activeProfile.exceptions
                  .filter((e) => e.status === "PENDING_JUDGMENT")
                  .reduce((acc, curr) => acc + curr.taxAmount, 0)
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Quarantined from draft 3B
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Net Cash Liability
            </div>
            <div className="text-lg sm:text-2xl font-black text-indigo-700 mt-1">
              {formatCurrencyINR(activeProfile.computation.offset.totalCashPayable)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Rule 88A optimal offset
            </div>
          </div>
        </div>
      </div>

      {/* 2. THREE-TAB WORKSPACE SWITCHER */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2">
        <button
          onClick={() => {
            setActiveTab("triage");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "triage"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Exception-Only Partner Triage Desk
          {activeProfile.exceptionsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
              {activeProfile.exceptionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("pipeline");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "pipeline"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          Assembly Line Pipeline Monitor
          {activeProfile.isCleanProfile && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              Clean Auto-Dispatch
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("computation");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "computation"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scale className="w-4 h-4" />
          GSTR-3B &amp; Rule 88A Offset Matrix
        </button>
      </div>

      {/* 3. TAB 1: EXCEPTION-ONLY PARTNER TRIAGE DESK (DAY 156–170) */}
      {activeTab === "triage" && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="bg-white p-4 rounded-b-2xl border-x border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Filter Exceptions:
              </span>
              {[
                { id: "ALL", label: `All (${activeProfile.exceptions.length})` },
                { id: "PENDING", label: `Pending Judgment (${activeProfile.exceptionsCount})` },
                { id: "MISSING_IN_2B", label: "Missing in 2B" },
                { id: "SECTION_17_5_BLOCKED", label: "Sec 17(5) Blocked" },
                { id: "INACTIVE_VENDOR", label: "Inactive Vendor" },
                { id: "VALUE_OR_RATE_MISMATCH", label: "Rate Mismatch" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTriageFilter(tab.id);
                    playSoftClick();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    triageFilter === tab.id
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search vendor, invoice, GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* All Cleared Banner if 0 exceptions pending */}
          {activeProfile.exceptionsCount === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-emerald-950">
                All Exceptions Cleared — Profile Promoted to 100% Clean!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-xl mx-auto">
                No human judgment required. The assembly line has automatically compiled the final GSTR-3B return and released it for client sign-off.
              </p>
              <button
                onClick={() => {
                  setActiveTab("pipeline");
                  playSoftClick();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition inline-flex items-center gap-2"
              >
                View Dispatch Card in Pipeline Monitor <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Exception Cards Feed */}
          <div className="space-y-3">
            {filteredExceptions.map((exc) => {
              const isResolved = exc.status !== "PENDING_JUDGMENT";

              return (
                <div
                  key={exc.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition shadow-sm ${
                    isResolved
                      ? "border-emerald-200/80 bg-emerald-50/20"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Vendor & Invoice Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            exc.exceptionCategory === "MISSING_IN_2B"
                              ? "bg-rose-100 text-rose-800"
                              : exc.exceptionCategory === "SECTION_17_5_BLOCKED"
                              ? "bg-amber-100 text-amber-800"
                              : exc.exceptionCategory === "INACTIVE_VENDOR"
                              ? "bg-red-100 text-red-900"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {exc.exceptionCategory.replace(/_/g, " ")}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-500">
                          {exc.invoiceNumber} • {exc.invoiceDate}
                        </span>

                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {exc.vendorGstin}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          Risk: {exc.riskScore}/100
                        </span>
                      </div>

                      <div className="text-sm font-black text-slate-900">
                        {exc.vendorName}
                      </div>

                      <p className="text-xs text-slate-600 font-medium">
                        <span className="font-bold text-slate-700">AI Suggested Action:</span>{" "}
                        {exc.suggestedAction}
                      </p>

                      <div className="text-[11px] text-slate-400 font-mono">
                        Statutory Rule: {exc.statutoryReference}
                      </div>

                      {exc.partnerDecisionNote && (
                        <div className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200 inline-block">
                          ✓ {exc.partnerDecisionNote}
                        </div>
                      )}
                    </div>

                    {/* Right: Amounts & 1-Click Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Taxable Value</div>
                        <div className="text-sm font-bold text-slate-900">
                          {formatCurrencyINR(exc.taxableAmount)}
                        </div>
                        <div className="text-xs font-black text-rose-600">
                          ITC: {formatCurrencyINR(exc.taxAmount)}
                        </div>
                      </div>

                      {/* 1-Click Partner Resolution Actions */}
                      {!isResolved ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleResolveException(exc.id, "CLAIM")}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                            title="Claim ITC with Section 16(2)(c) Supplier Indemnity"
                          >
                            Claim with Indemnity
                          </button>

                          <button
                            onClick={() => handleResolveException(exc.id, "BLOCK")}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition"
                            title="Block ITC u/s 17(5) and Shift to Table 4(D)(1)"
                          >
                            Block u/s 17(5)
                          </button>

                          <button
                            onClick={() => handleResolveException(exc.id, "HOLD")}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition"
                            title="Hold Payment & Chase Vendor on WhatsApp"
                          >
                            Hold &amp; Chase
                          </button>

                          <button
                            onClick={() => handleResolveException(exc.id, "ACCEPT")}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                            title="Accept Rounding Difference"
                          >
                            Accept Tol.
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5" /> Resolved by Partner
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: ASSEMBLY LINE PIPELINE MONITOR (DAY 141–155) */}
      {activeTab === "pipeline" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          {/* Visual 5-Stage Assembly Line */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> End-to-End Autonomous Pipeline Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  stage: "1. WhatsApp Ingestion",
                  desc: "Bills & Bank Statement parsed",
                  status: "COMPLETED",
                  time: "10:11 AM",
                },
                {
                  stage: "2. Bank OCR Reconciler",
                  desc: "Bank debits matched to books",
                  status: "COMPLETED",
                  time: "10:11 AM",
                },
                {
                  stage: "3. GSTR-2B Multi-Matcher",
                  desc: `${activeProfile.matchedInvoicesCount}/${activeProfile.totalInvoicesCount} invoices matched`,
                  status: activeProfile.exceptionsCount === 0 ? "COMPLETED" : "ATTENTION_REQUIRED",
                  time: "10:12 AM",
                },
                {
                  stage: "4. GSTR-3B Computation",
                  desc: "Rule 88A credit offset calculated",
                  status: "COMPLETED",
                  time: "10:13 AM",
                },
                {
                  stage: "5. Client Sign-Off Dispatch",
                  desc: activeProfile.isCleanProfile ? "Dispatched to WhatsApp" : "Awaiting Partner Triage",
                  status: activeProfile.pipelineStage === "FILED" ? "COMPLETED" : activeProfile.isCleanProfile ? "ACTIVE" : "PENDING",
                  time: activeProfile.isCleanProfile ? "10:14 AM" : "Paused",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-3.5 border transition ${
                    step.status === "COMPLETED"
                      ? "bg-emerald-50/60 border-emerald-200"
                      : step.status === "ATTENTION_REQUIRED"
                      ? "bg-amber-50/60 border-amber-200"
                      : step.status === "ACTIVE"
                      ? "bg-indigo-50/60 border-indigo-200 ring-2 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>{step.time}</span>
                    {step.status === "COMPLETED" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {step.status === "ATTENTION_REQUIRED" && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>
                  <div className="text-xs font-black text-slate-900 mt-1">{step.stage}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Interactive Sign-off Card Preview (Clean Profile Zero-Touch) */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Zero-Touch Client Agent
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Automated Client WhatsApp Sign-Off Card
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Because this profile is 100% matched, the draft GSTR-3B was packaged and dispatched without staff intervention.
                </p>
              </div>

              {activeProfile.status !== "CLIENT_SIGNED_OFF" ? (
                <button
                  onClick={handleSimulateClientSignOff}
                  disabled={isSimulatingDispatch || !activeProfile.isCleanProfile}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    activeProfile.isCleanProfile
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isSimulatingDispatch ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Simulating OTP Sign-Off...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Simulate Client 1-Tap Sign-Off
                    </>
                  )}
                </button>
              ) : (
                <div className="px-4 py-2 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Digitally Signed Off &amp; Filed to GSTN
                </div>
              )}
            </div>

            {/* Simulated WhatsApp Preview Bubble */}
            <div className="mt-4 max-w-lg bg-emerald-900 text-white rounded-2xl p-4 shadow-md font-sans text-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-emerald-200">
                <span className="font-bold">Brains &amp; Taxes Client Desk (Verified)</span>
                <span>Today, 10:14 AM</span>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 space-y-2">
                <div className="font-bold text-sm text-emerald-900">
                  ⚡ GSTR-3B Sign-Off Required ({activeProfile.period})
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Hi {activeProfile.clientName}, your monthly GST return has been autonomously audited and 100% verified against GSTR-2B.
                </p>
                <div className="bg-white/90 border border-emerald-200 rounded-lg p-2 font-mono text-[11px] space-y-1 text-slate-800">
                  <div>• Gross Output Tax: {formatCurrencyINR(activeProfile.computation.totalOutputTax)}</div>
                  <div>• Verified Eligible ITC: {formatCurrencyINR(activeProfile.computation.netEligibleItcIgst + activeProfile.computation.netEligibleItcCgst + activeProfile.computation.netEligibleItcSgst)}</div>
                  <div className="text-emerald-700 font-bold">• Net Cash Payable (PMT-06): {formatCurrencyINR(activeProfile.computation.offset.totalCashPayable)}</div>
                </div>
                <div className="pt-1">
                  <div className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center py-2 rounded-lg cursor-pointer shadow-sm">
                    Click to Review &amp; Sign Off (OTP)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Audit Log Stream */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Cryptographic Execution Audit Log (ICAI SA 500)
            </h4>
            <div className="bg-slate-50 text-slate-800 font-mono text-[11px] p-4 rounded-xl space-y-1 max-h-48 overflow-y-auto border border-slate-200">
              {activeProfile.auditLog.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-red-600 font-bold">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: GSTR-3B COMPUTATION & RULE 88A OFFSET MATRIX */}
      {activeTab === "computation" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          {/* Table 3.1 & Table 4 Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 3.1: Output Supplies */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Table 3.1: Outward Supplies &amp; RCM</span>
                <span className="text-[11px] font-mono text-slate-500 font-normal">
                  Turnover: {formatCurrencyINR(activeProfile.computation.outwardTaxableSupplies)}
                </span>
              </h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Integrated Tax (IGST)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyINR(activeProfile.computation.outwardIgst)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Central Tax (CGST)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyINR(activeProfile.computation.outwardCgst)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">State Tax (SGST)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyINR(activeProfile.computation.outwardSgst)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-slate-900">
                  <span>Total Output Tax Liability</span>
                  <span className="font-mono text-indigo-700">
                    {formatCurrencyINR(activeProfile.computation.totalOutputTax)}
                  </span>
                </div>
              </div>
            </div>

            {/* Table 4: Eligible ITC */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Table 4: Eligible &amp; Reversible ITC</span>
                <span className="text-[11px] font-mono text-emerald-600 font-bold">
                  2B Verified
                </span>
              </h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Table 4(A)(5) All Other ITC (Gross)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyINR(
                      activeProfile.computation.totalGrossItcIgst +
                        activeProfile.computation.totalGrossItcCgst +
                        activeProfile.computation.totalGrossItcSgst
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Table 4(B)(2) Rule 42/43 Reversals</span>
                  <span className="font-mono font-bold text-amber-600">
                    - {formatCurrencyINR(
                      activeProfile.computation.rule42ReversalIgst +
                        activeProfile.computation.rule42ReversalCgst +
                        activeProfile.computation.rule42ReversalSgst
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Table 4(D)(1) Section 17(5) Ineligible</span>
                  <span className="font-mono font-bold text-rose-600">
                    Quarantined
                  </span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-slate-900">
                  <span>Net Eligible ITC Available</span>
                  <span className="font-mono text-emerald-700">
                    {formatCurrencyINR(
                      activeProfile.computation.netEligibleItcIgst +
                        activeProfile.computation.netEligibleItcCgst +
                        activeProfile.computation.netEligibleItcSgst
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table 6.1: Rule 88A Optimal Credit Offset Matrix */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Table 6.1: Rule 88A Tax Payment &amp; Credit Offset Matrix
                </h4>
                <p className="text-[11px] text-slate-500">
                  Mandatory Circular 98/17/2019-GST order: IGST credit exhausted first before touching CGST/SGST.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                Rule 88A Enforced
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Head</th>
                    <th className="p-2.5 text-right">Output Tax</th>
                    <th className="p-2.5 text-right">Paid via IGST Credit</th>
                    <th className="p-2.5 text-right">Paid via CGST Credit</th>
                    <th className="p-2.5 text-right">Paid via SGST Credit</th>
                    <th className="p-2.5 text-right text-rose-600 font-black">Net Cash Payable (PMT-06)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-2.5 font-sans font-bold text-slate-800">Integrated Tax (IGST)</td>
                    <td className="p-2.5 text-right">{formatCurrencyINR(activeProfile.computation.outwardIgst)}</td>
                    <td className="p-2.5 text-right text-emerald-600">
                      {formatCurrencyINR(activeProfile.computation.offset.igstCreditUsedForIgst)}
                    </td>
                    <td className="p-2.5 text-right text-emerald-600">
                      {formatCurrencyINR(activeProfile.computation.offset.cgstCreditUsedForIgst)}
                    </td>
                    <td className="p-2.5 text-right text-emerald-600">
                      {formatCurrencyINR(activeProfile.computation.offset.sgstCreditUsedForIgst)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatCurrencyINR(activeProfile.computation.offset.netCashPayableIgst)}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-sans font-bold text-slate-800">Central Tax (CGST)</td>
                    <td className="p-2.5 text-right">{formatCurrencyINR(activeProfile.computation.outwardCgst)}</td>
                    <td className="p-2.5 text-right text-emerald-600">
                      {formatCurrencyINR(activeProfile.computation.offset.igstCreditUsedForCgst)}
                    </td>
                    <td className="p-2.5 text-right text-emerald-600">
                      {formatCurrencyINR(activeProfile.computation.offset.cgstCreditUsedForCgst)}
                    </td>
                    <td className="p-2.5 text-right text-slate-400">—</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatCurrencyINR(activeProfile.computation.offset.netCashPayableCgst)}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-sans font-bold text-slate-800">State Tax (SGST)</td>
                    <td className="p-2.5 text-right">{formatCurrencyINR(activeProfile.computation.outwardSgst)}</td>
                    <td className="p-2.5 text-right text-emerald-600">
                      {formatCurrencyINR(activeProfile.computation.offset.igstCreditUsedForSgst)}
                    </td>
                    <td className="p-2.5 text-right text-slate-400">—</td>
                    <td className="p-2.5 text-right text-emerald-600">
                      {formatCurrencyINR(activeProfile.computation.offset.sgstCreditUsedForSgst)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatCurrencyINR(activeProfile.computation.offset.netCashPayableSgst)}
                    </td>
                  </tr>

                  <tr className="bg-slate-50 font-black text-slate-900">
                    <td className="p-2.5 font-sans">TOTAL CASH CHALLAN PAYABLE</td>
                    <td className="p-2.5 text-right">
                      {formatCurrencyINR(activeProfile.computation.totalOutputTax)}
                    </td>
                    <td className="p-2.5 text-right text-emerald-700" colSpan={3}>
                      Credit Offset Applied
                    </td>
                    <td className="p-2.5 text-right text-sm text-indigo-700">
                      {formatCurrencyINR(activeProfile.computation.offset.totalCashPayable)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  toast.success("JSON Export Ready", "Validated GSTR-3B payload exported for GSTN offline utility.");
                  playSoftClick();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" /> Export GSTR-3B Computation JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
