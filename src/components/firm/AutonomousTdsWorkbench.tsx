"use client";

import React, { useState } from "react";
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
  UserCheck,
  Download,
  Share2
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import {
  TdsClientAssemblyProfile,
  TracesDefaultItem,
  getSampleTdsProfiles,
  resolveTdsDefault
} from "@/lib/tds/autonomousTdsEngine";

export const AutonomousTdsWorkbench: React.FC = () => {
  const [profiles, setProfiles] = useState<TdsClientAssemblyProfile[]>(() => getSampleTdsProfiles());
  const [selectedClientId, setSelectedClientId] = useState<string>("client-apex");
  const [activeTab, setActiveTab] = useState<"pipeline" | "triage" | "certificates">("triage");
  const [triageFilter, setTriageFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDispatchingCertificates, setIsDispatchingCertificates] = useState<boolean>(false);
  const [isSimulatingSignOff, setIsSimulatingSignOff] = useState<boolean>(false);

  const activeProfile = profiles.find((p) => p.clientId === selectedClientId) || profiles[0];

  const handleResolveDefault = (
    defaultId: string,
    action: "GENERATE_C1" | "GENERATE_C2" | "GENERATE_C3" | "GENERATE_C9" | "WAIVE_OR_PAY"
  ) => {
    playSoftClick();
    const updated = resolveTdsDefault(activeProfile, defaultId, action);

    setProfiles((prev) =>
      prev.map((p) => (p.clientId === updated.clientId ? updated : p))
    );

    if (action === "GENERATE_C1") {
      toast.success("Category C1 Correction Built", "Challan details updated in TRACES online correction matrix.");
    } else if (action === "GENERATE_C2") {
      toast.success("Category C2 PAN Correction Built", "Deductee PAN rectified. Sec 206AA penal rate reversed.");
    } else if (action === "GENERATE_C9") {
      toast.success("Category C9 New Challan Mapped", "Mapped unconsumed Challan 281 balance to offset short payment.");
    } else {
      toast.info("Correction Statement Generated", "Resolution attached to NSDL online correction docket.");
    }

    if (updated.isCleanProfile) {
      playSuccessChime();
      toast.success(
        "All TRACES Defaults Rectified!",
        "Profile promoted to Clean. Form 26Q online correction payload ready for portal submission."
      );
    }
  };

  const handleBatchDispatchCertificates = () => {
    setIsDispatchingCertificates(true);
    playSoftClick();

    setTimeout(() => {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.clientId === activeProfile.clientId) {
            const updatedCerts = p.form16Certificates.map((cert) => ({
              ...cert,
              deliveryStatus: "DELIVERED_WHATSAPP" as const,
              deliveredAt: new Date().toISOString(),
            }));
            return {
              ...p,
              form16Certificates: updatedCerts,
              auditLog: [
                ...p.auditLog,
                `[${new Date().toLocaleTimeString()}] Batch dispatched ${updatedCerts.length} Form 16/16A certificates via WhatsApp Cloud API.`,
              ],
            };
          }
          return p;
        })
      );
      setIsDispatchingCertificates(false);
      playSuccessChime();
      toast.success(
        "Form 16/16A Batch Dispatched",
        `Sent ${activeProfile.form16Certificates.length} digitally signed TDS certificates directly to vendor WhatsApp numbers.`
      );
    }, 1200);
  };

  const handleSimulateClientSignOff = () => {
    setIsSimulatingSignOff(true);
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
                `[${new Date().toLocaleTimeString()}] Client authorized filing via WhatsApp OTP. Form 26Q FVU generated and uploaded to NSDL portal.`,
              ],
            };
          }
          return p;
        })
      );
      setIsSimulatingSignOff(false);
      playSuccessChime();
      toast.success("Form 26Q Filed to TIN-NSDL", "Client authorized via WhatsApp. Token Number generated: 04221089941.");
    }, 1200);
  };

  const filteredDefaults = activeProfile.tracesDefaults.filter((def) => {
    const matchesCategory =
      triageFilter === "ALL" ||
      def.defaultType === triageFilter ||
      (triageFilter === "PENDING" && def.status === "PENDING_CORRECTION");
    const matchesSearch =
      def.deducteeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.deducteePan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.sectionCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalDefaultsPendingAll = profiles.reduce((acc, p) => acc + p.exceptionsCount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. INSTITUTIONAL HEADER & CLIENT PICKER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Module 3.2: TDS &amp; TRACES Pipeline
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600" /> Zero-Touch Form 24Q/26Q
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                TRACES C1/C2/C3/C9 Generator
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Autonomous TDS/TCS Pipeline &amp; TRACES Forensic Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Clean profiles compile and file Form 24Q/26Q automatically. Partners review only TRACES short deductions and 201(1A) interest defaults.
            </p>
          </div>

          {/* Client Selector & Quick Action Buttons */}
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
                    {p.clientName} ({p.status === "CLEAN_AUTO_DISPATCHED" ? "100% Clean" : `${p.exceptionsCount} TRACES Defaults`})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setProfiles(getSampleTdsProfiles());
                toast.info("Reset TDS Profiles", "TDS pipeline reset to institutional baseline.");
                playSoftClick();
              }}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              title="Reset Baseline"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 INSTITUTIONAL METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clean Profiles (Zero-Touch)
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
              {profiles.filter((p) => p.status === "CLEAN_AUTO_DISPATCHED" || p.status === "CLIENT_SIGNED_OFF").length} / {profiles.length}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Challan 281 &amp; BSR 100% matched
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> TRACES Defaults Pending
            </div>
            <div className="text-lg sm:text-2xl font-black text-rose-600 mt-1">
              {totalDefaultsPendingAll} Defaults
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across all deductee records
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Statutory Exposure Tracked
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-600 mt-1">
              {formatCurrencyINR(
                activeProfile.tracesDefaults
                  .filter((d) => d.status === "PENDING_CORRECTION")
                  .reduce((acc, curr) => acc + curr.shortAmount + curr.interest201_1a, 0)
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Short deduction + 201(1A) interest
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Total Challans Deposited
            </div>
            <div className="text-lg sm:text-2xl font-black text-indigo-700 mt-1">
              {formatCurrencyINR(activeProfile.totalChallanDeposited)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Verified against OLTAS records
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
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          TRACES Justification &amp; Default Triage Desk
          {activeProfile.exceptionsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
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
          Quarterly TDS Assembly Pipeline
          {activeProfile.isCleanProfile && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              Clean Auto-Dispatch
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("certificates");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "certificates"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Share2 className="w-4 h-4" />
          Form 16 / 16A Batch Delivery Desk
        </button>
      </div>

      {/* 3. TAB 1: TRACES JUSTIFICATION & DEFAULT TRIAGE DESK (DAY 186–200) */}
      {activeTab === "triage" && (
        <div className="space-y-4">
          {/* Header Action & Filter Bar */}
          <div className="bg-white p-4 rounded-b-2xl border-x border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Filter Defaults:
              </span>
              {[
                { id: "ALL", label: `All (${activeProfile.tracesDefaults.length})` },
                { id: "PENDING", label: `Pending Rectification (${activeProfile.exceptionsCount})` },
                { id: "SHORT_DEDUCTION", label: "Short Deduction" },
                { id: "INTEREST_201_1A", label: "Sec 201(1A) Interest" },
                { id: "SHORT_PAYMENT", label: "Short Payment" },
                { id: "LATE_FEE_234E", label: "Sec 234E Late Fee" },
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
                placeholder="Search deductee, PAN, section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* All Cleared Banner if 0 defaults pending */}
          {activeProfile.exceptionsCount === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-emerald-950">
                All TRACES Defaults Rectified — Profile Promoted to 100% Clean!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-xl mx-auto">
                No short deductions or delayed payment interest remain. The assembly line has compiled the final Form 26Q payload and released it for client sign-off.
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

          {/* TRACES Default Items Feed */}
          <div className="space-y-3">
            {filteredDefaults.map((def) => {
              const isResolved = def.status !== "PENDING_CORRECTION";

              return (
                <div
                  key={def.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition shadow-sm ${
                    isResolved
                      ? "border-emerald-200/80 bg-emerald-50/20"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Deductee & Default Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            def.defaultType === "SHORT_DEDUCTION"
                              ? "bg-rose-100 text-rose-800"
                              : def.defaultType === "INTEREST_201_1A"
                              ? "bg-amber-100 text-amber-800"
                              : def.defaultType === "SHORT_PAYMENT"
                              ? "bg-red-100 text-red-900"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {def.defaultType.replace(/_/g, " ")}
                        </span>

                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Section {def.sectionCode}
                        </span>

                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          PAN: {def.deducteePan}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Recommended: {def.recommendedCorrection.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="text-sm font-black text-slate-900">
                        {def.deducteeName}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Tax Deductible:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrencyINR(def.taxDeductible)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Actual Deducted:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrencyINR(def.taxDeducted)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Short Deduction:</span>
                          <span className="font-mono font-bold text-rose-600">
                            {formatCurrencyINR(def.shortAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Sec 201(1A) Interest:</span>
                          <span className="font-mono font-bold text-amber-600">
                            {formatCurrencyINR(def.interest201_1a)} ({def.delayMonths} mo)
                          </span>
                        </div>
                      </div>

                      {def.partnerNote && (
                        <div className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200 inline-block">
                          ✓ {def.partnerNote}
                        </div>
                      )}
                    </div>

                    {/* Right: 1-Click Online Correction Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {!isResolved ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleResolveDefault(def.id, "GENERATE_C2")}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                            title="Generate Category C2 Deductee PAN Correction"
                          >
                            Build C2 PAN Fix
                          </button>

                          <button
                            onClick={() => handleResolveDefault(def.id, "GENERATE_C1")}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                            title="Generate Category C1 Challan Detail Correction"
                          >
                            Build C1 Challan Fix
                          </button>

                          <button
                            onClick={() => handleResolveDefault(def.id, "GENERATE_C9")}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition"
                            title="Generate Category C9 Add Challan Correction"
                          >
                            Build C9 Add Challan
                          </button>

                          <button
                            onClick={() => handleResolveDefault(def.id, "WAIVE_OR_PAY")}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                            title="Record Minor Head 400 Challan Receipt"
                          >
                            Offset Challan
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                          <Check className="w-3.5 h-3.5" /> Correction Ready
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

      {/* 4. TAB 2: QUARTERLY TDS ASSEMBLY PIPELINE (DAY 171–185) */}
      {activeTab === "pipeline" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          {/* Visual 5-Stage Assembly Line */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" /> End-to-End Autonomous Pipeline Status ({activeProfile.quarter} {activeProfile.financialYear})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  stage: "1. Payroll & Vendor Ingest",
                  desc: `${activeProfile.totalDeducteesCount} records ingested`,
                  status: "COMPLETED",
                  time: "09:15 AM",
                },
                {
                  stage: "2. PAN & 206AB Scan",
                  desc: "Non-filer & Inoperative PANs checked",
                  status: activeProfile.exceptionsCount === 0 ? "COMPLETED" : "ATTENTION_REQUIRED",
                  time: "09:16 AM",
                },
                {
                  stage: "3. Challan 281 Matcher",
                  desc: `${activeProfile.challans.length} Challan receipts matched`,
                  status: "COMPLETED",
                  time: "09:17 AM",
                },
                {
                  stage: "4. NSDL FVU Compilation",
                  desc: "Form 26Q data validated",
                  status: "COMPLETED",
                  time: "09:18 AM",
                },
                {
                  stage: "5. Client Sign-Off Dispatch",
                  desc: activeProfile.isCleanProfile ? "Dispatched to WhatsApp" : "Awaiting Partner Triage",
                  status: activeProfile.pipelineStage === "FILED" ? "COMPLETED" : activeProfile.isCleanProfile ? "ACTIVE" : "PENDING",
                  time: activeProfile.isCleanProfile ? "09:19 AM" : "Paused",
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

          {/* Challan 281 Reconciled Table */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Challan 281 Reconciled Records (BSR Code &amp; CIN)</span>
              <span className="text-xs font-bold text-emerald-600">
                Total Deposited: {formatCurrencyINR(activeProfile.totalChallanDeposited)}
              </span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">BSR Code</th>
                    <th className="p-2.5">Challan No</th>
                    <th className="p-2.5">Tender Date</th>
                    <th className="p-2.5">Section</th>
                    <th className="p-2.5">Minor Head</th>
                    <th className="p-2.5 text-right">Tax Amount</th>
                    <th className="p-2.5 text-right">Unconsumed Balance</th>
                    <th className="p-2.5 text-center">OLTAS Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeProfile.challans.map((ch) => (
                    <tr key={ch.id}>
                      <td className="p-2.5 font-bold text-slate-900">{ch.bsrCode}</td>
                      <td className="p-2.5">{ch.challanNo}</td>
                      <td className="p-2.5">{ch.tenderDate}</td>
                      <td className="p-2.5 font-sans font-bold text-indigo-700">{ch.sectionCode}</td>
                      <td className="p-2.5">{ch.minorHead === "200" ? "200 (Taxpayer)" : "400 (Assmt)"}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatCurrencyINR(ch.totalAmount)}
                      </td>
                      <td className="p-2.5 text-right text-emerald-600 font-bold">
                        {formatCurrencyINR(ch.unconsumedBalance)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Matched
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WhatsApp Interactive Sign-off Card Preview (Clean Profile Zero-Touch) */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-amber-50/30">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Zero-Touch TDS Agent
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Automated Client WhatsApp Sign-Off Card
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Because this profile is 100% matched, Form 26Q was compiled and queued for client OTP sign-off without staff intervention.
                </p>
              </div>

              {activeProfile.status !== "CLIENT_SIGNED_OFF" ? (
                <button
                  onClick={handleSimulateClientSignOff}
                  disabled={isSimulatingSignOff || !activeProfile.isCleanProfile}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    activeProfile.isCleanProfile
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isSimulatingSignOff ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing TIN-NSDL Upload...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Simulate Client 1-Tap Sign-Off
                    </>
                  )}
                </button>
              ) : (
                <div className="px-4 py-2 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Form 26Q Successfully Filed to TIN-NSDL
                </div>
              )}
            </div>

            {/* Simulated WhatsApp Preview Bubble */}
            <div className="mt-4 max-w-lg bg-emerald-50 text-slate-900 border border-emerald-200 rounded-2xl p-4 shadow-sm font-sans text-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-emerald-800">
                <span className="font-bold">Brains &amp; Taxes TDS Desk (Verified)</span>
                <span>Today, 09:19 AM</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-2">
                <div className="font-bold text-sm text-emerald-950">
                  ⚡ Form 26Q ({activeProfile.quarter} FY {activeProfile.financialYear}) Sign-Off Required
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Hi {activeProfile.clientName}, your quarterly TDS return has been autonomously audited and 100% reconciled against Challan 281 receipts.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] space-y-1 text-slate-800">
                  <div>• Deductees Count: {activeProfile.totalDeducteesCount} records</div>
                  <div>• Total TDS Deducted: {formatCurrencyINR(activeProfile.totalTdsDeducted)}</div>
                  <div className="text-emerald-700 font-bold">• Total Deposited (Challan 281): {formatCurrencyINR(activeProfile.totalChallanDeposited)}</div>
                </div>
                <div className="pt-1">
                  <div className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center py-2 rounded-lg cursor-pointer shadow-sm">
                    Click to Authorize Filing (OTP)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Audit Trail Log Stream */}
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

      {/* 5. TAB 3: FORM 16 / 16A BATCH CERTIFICATE DISTRIBUTION */}
      {activeTab === "certificates" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Automated Form 16 / 16A Certificate Delivery Desk
              </h3>
              <p className="text-xs text-slate-500">
                1-Click batch delivery of digitally signed Form 16 (Part A &amp; B) and Form 16A PDF certificates to deductors and vendors via WhatsApp.
              </p>
            </div>

            <button
              onClick={handleBatchDispatchCertificates}
              disabled={isDispatchingCertificates}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              {isDispatchingCertificates ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching via WhatsApp Cloud API...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Batch Dispatch All via WhatsApp ({activeProfile.form16Certificates.length})
                </>
              )}
            </button>
          </div>

          {/* Certificates Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Deductee / Vendor</th>
                  <th className="p-3">PAN</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">WhatsApp Mobile</th>
                  <th className="p-3 text-right">Gross Amount</th>
                  <th className="p-3 text-right">TDS Deposited</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {activeProfile.form16Certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-sans font-bold text-slate-900">{cert.employeeOrVendorName}</td>
                    <td className="p-3 font-bold text-slate-700">{cert.pan}</td>
                    <td className="p-3 font-sans font-bold text-indigo-700">Form {cert.formType}</td>
                    <td className="p-3 text-slate-600">{cert.mobile}</td>
                    <td className="p-3 text-right">{formatCurrencyINR(cert.grossAmount)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {formatCurrencyINR(cert.tdsDeposited)}
                    </td>
                    <td className="p-3 text-center font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cert.deliveryStatus === "DELIVERED_WHATSAPP"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {cert.deliveryStatus === "DELIVERED_WHATSAPP" ? "Delivered (WhatsApp)" : "Ready"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          toast.success("Certificate Downloaded", `Downloaded signed Form ${cert.formType} for ${cert.pan}.`);
                          playSoftClick();
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 font-sans"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
