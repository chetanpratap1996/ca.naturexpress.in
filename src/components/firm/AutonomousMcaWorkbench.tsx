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
  Share2,
  AlertCircle,
  Upload
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import {
  McaClientAssemblyProfile,
  getSampleMcaProfiles,
  resolveMcaException
} from "@/lib/mca/autonomousMcaEngine";
import { parseXbrlFinancials, XbrlParseResult } from "@/lib/parsers/xbrlParser";
import { parseCin, ParsedCinResult } from "@/lib/parsers/cinParser";

export const AutonomousMcaWorkbench: React.FC = () => {
  const [profiles, setProfiles] = useState<McaClientAssemblyProfile[]>(() => getSampleMcaProfiles());
  const [selectedClientId, setSelectedClientId] = useState<string>("client-apex");
  const [activeTab, setActiveTab] = useState<"pipeline" | "sentinel" | "dockets" | "xbrl">("sentinel");
  const [xbrlResult, setXbrlResult] = useState<XbrlParseResult | null>(null);
  const [isXbrlProcessing, setIsXbrlProcessing] = useState<boolean>(false);
  const [triageFilter, setTriageFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSimulatingSignOff, setIsSimulatingSignOff] = useState<boolean>(false);

  const activeProfile = profiles.find((p) => p.clientId === selectedClientId) || profiles[0];

  const handleResolveException = (
    exceptionId: string,
    action: "OBTAIN_DECLARATION" | "APPROVE_MSME1" | "TRIGGER_DIR3_KYC_OTP" | "OVERRIDE_DPT3"
  ) => {
    playSoftClick();
    const updated = resolveMcaException(activeProfile, exceptionId, action);

    setProfiles((prev) =>
      prev.map((p) => (p.clientId === updated.clientId ? updated : p))
    );

    if (action === "OBTAIN_DECLARATION") {
      toast.success("Section 73(2) Declaration Obtained", "Director loan classified as exempted borrowing under DPT-3 rules.");
    } else if (action === "TRIGGER_DIR3_KYC_OTP") {
      toast.success("DIR-3 Web-KYC Verified", "Director KYC completed. Disqualification risk neutralized.");
    } else if (action === "APPROVE_MSME1") {
      toast.info("MSME-1 Entry Approved", "Overdue supplier balances verified for half-yearly return.");
    }

    if (updated.isCleanProfile) {
      playSuccessChime();
      toast.success(
        "Profile Promoted to Clean!",
        "All secretarial exceptions cleared. Forms AOC-4 & MGT-7 released for Director DSC sign-off."
      );
    }
  };

  const handleSimulateDirectorSignOff = () => {
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
                `[${new Date().toLocaleTimeString()}] Director digitally authorized filing via WhatsApp OTP. Forms AOC-4 & MGT-7 filed to MCA v3. SRN generated: F99412088.`,
              ],
            };
          }
          return p;
        })
      );
      setIsSimulatingSignOff(false);
      playSuccessChime();
      toast.success("Forms AOC-4 & MGT-7 Filed to MCA v3", "Director signed off via WhatsApp. SRN generated: F99412088.");
    }, 1200);
  };

  const totalExceptionsPendingAll = profiles.reduce((acc, p) => acc + p.exceptionsCount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. INSTITUTIONAL HEADER & CLIENT PICKER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Module 3.3: MCA / ROC Assembly
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600" /> Zero-Touch AOC-4 &amp; MGT-7
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Sec 164(2) DIN Shield
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Autonomous Corporate MCA/ROC Assembly &amp; Secretarial Sentinel
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Clean corporate profiles compile and file annual ROC dockets automatically. Partners review only DPT-3 loan defaults, MSME-1 overdue dues, and DIN risks.
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
                    {p.clientName} ({p.status === "CLEAN_AUTO_DISPATCHED" ? "100% Clean" : `${p.exceptionsCount} Exceptions`})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setProfiles(getSampleMcaProfiles());
                toast.info("Reset MCA Profiles", "Corporate pipeline reset to institutional baseline.");
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
              AOC-4 &amp; MGT-7 auto-dispatched
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Secretarial Exceptions
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-600 mt-1">
              {totalExceptionsPendingAll} Pending
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              DPT-3 loans &amp; MSME-1 dues
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500" /> Sec 403 Late Fees Accrued
            </div>
            <div className="text-lg sm:text-2xl font-black text-rose-600 mt-1">
              {formatCurrencyINR(activeProfile.sec403LateFeesAccrued)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              ₹100/day accumulating fee
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Sec 164(2) Disqualification Risk
            </div>
            <div className="text-lg sm:text-2xl font-black text-purple-700 mt-1">
              {activeProfile.directors.some((d) => d.disqualificationRisk !== "CLEAN") ? "1 Warning" : "0 Risk"}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Cross-company DIN protected
            </div>
          </div>
        </div>
      </div>

      {/* 2. THREE-TAB WORKSPACE SWITCHER */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2">
        <button
          onClick={() => {
            setActiveTab("sentinel");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "sentinel"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Secretarial Sentinel &amp; Exception Desk
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
          Annual ROC Assembly Line (AOC-4 &amp; MGT-7)
          {activeProfile.isCleanProfile && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              Clean Auto-Dispatch
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("dockets");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "dockets"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          MCA v3 Docket Export &amp; DSC Matrix
        </button>

        <button
          onClick={() => {
            setActiveTab("xbrl");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "xbrl"
              ? "border-purple-600 text-purple-600 font-black"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          AOC-4 XBRL Ingest &amp; Financials
        </button>
      </div>

      {/* 3. TAB 1: SECRETARIAL SENTINEL & TRIAGE DESK (DAY 216–225) */}
      {activeTab === "sentinel" && (
        <div className="space-y-6">
          {/* All Cleared Banner if 0 exceptions pending */}
          {activeProfile.exceptionsCount === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-emerald-950">
                All Secretarial Exceptions Cleared — Profile Promoted to Clean!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-xl mx-auto">
                Director loans have Section 73(2) declarations, DIR-3 KYC is active, and MSME-1 dues are documented. Forms AOC-4 &amp; MGT-7 are released for Director sign-off.
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

          {/* Section A: Form DPT-3 Deposit vs Borrowing Auditor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-600" /> Form DPT-3 Loan &amp; Deposit Sentinel (Due 30th June)
                </h3>
                <p className="text-xs text-slate-500">
                  Rule 16 of Acceptance of Deposits Rules: Verifies whether director loans and inter-corporate deposits qualify as exempted borrowings.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                Rule 16 Audit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Lender / Party</th>
                    <th className="p-2.5">PAN / CIN</th>
                    <th className="p-2.5 text-right">Closing Balance</th>
                    <th className="p-2.5 text-center">Sec 73(2) Declaration</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeProfile.dpt3Items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5 font-sans font-bold text-slate-900">
                        {item.category.replace(/_/g, " ")}
                      </td>
                      <td className="p-2.5 font-sans">{item.lenderName}</td>
                      <td className="p-2.5 text-slate-600">{item.panOrCin}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatCurrencyINR(item.closingBalance)}
                      </td>
                      <td className="p-2.5 text-center font-sans">
                        {item.directorDeclarationObtained ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Obtained (Exempt)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                            Declaration Missing
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-sans">
                        {!item.directorDeclarationObtained ? (
                          <button
                            onClick={() => handleResolveException(item.id, "OBTAIN_DECLARATION")}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            Obtain Declaration
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs">✓ Validated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Form MSME-1 Half-Yearly Overdue Supplier Desk */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" /> Form MSME-1 Overdue Dues Tracker (&gt; 45 Days)
                </h3>
                <p className="text-xs text-slate-500">
                  Specified Companies Order 2019: Mandatory reporting of unpaid balances to Micro &amp; Small enterprises exceeding 45 days.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                Half-Yearly Return
              </span>
            </div>

            {activeProfile.msme1Items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Supplier Name</th>
                      <th className="p-2.5">Udyam No</th>
                      <th className="p-2.5">Invoice No &amp; Date</th>
                      <th className="p-2.5 text-right">Amount Due</th>
                      <th className="p-2.5 text-center">Days Overdue</th>
                      <th className="p-2.5">Reason for Delay</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {activeProfile.msme1Items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-sans font-bold text-slate-900">{item.supplierName}</td>
                        <td className="p-2.5 text-slate-600">{item.udyamNumber}</td>
                        <td className="p-2.5 text-slate-700">{item.invoiceNumber} • {item.invoiceDate}</td>
                        <td className="p-2.5 text-right font-bold text-rose-600">
                          {formatCurrencyINR(item.amountDue)}
                        </td>
                        <td className="p-2.5 text-center font-sans font-black text-amber-700">
                          {item.daysOverdue} Days
                        </td>
                        <td className="p-2.5 font-sans text-slate-600 max-w-xs">{item.reasonForDelay}</td>
                        <td className="p-2.5 text-right font-sans">
                          <button
                            onClick={() => handleResolveException(item.id, "APPROVE_MSME1")}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          >
                            Approve for MSME-1
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl">
                ✓ Zero overdue balances exceeding 45 days. MSME-1 nil disclosure validated.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 2: ANNUAL ROC ASSEMBLY LINE (AOC-4 & MGT-7) (DAY 201–215) */}
      {activeTab === "pipeline" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          {/* Visual 5-Stage Assembly Pipeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" /> End-to-End Annual ROC Assembly Status ({activeProfile.financialYear})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  stage: "1. Financials Ingestion",
                  desc: "Audited Schedule III mapped",
                  status: "COMPLETED",
                  time: "10:30 AM",
                },
                {
                  stage: "2. Secretarial Audit",
                  desc: "DPT-3 & MSME-1 checked",
                  status: activeProfile.exceptionsCount === 0 ? "COMPLETED" : "ATTENTION_REQUIRED",
                  time: "10:31 AM",
                },
                {
                  stage: "3. DIN & KYC Sentinel",
                  desc: `${activeProfile.directors.length} Directors validated`,
                  status: activeProfile.directors.some((d) => d.kycStatus !== "KYC_VERIFIED") ? "ATTENTION_REQUIRED" : "COMPLETED",
                  time: "10:32 AM",
                },
                {
                  stage: "4. AOC-4 & MGT-7 Compiler",
                  desc: "MCA v3 JSON dockets compiled",
                  status: "COMPLETED",
                  time: "10:33 AM",
                },
                {
                  stage: "5. Director Sign-Off",
                  desc: activeProfile.isCleanProfile ? "Dispatched to WhatsApp" : "Awaiting Secretarial Clearance",
                  status: activeProfile.pipelineStage === "FILED" ? "COMPLETED" : activeProfile.isCleanProfile ? "ACTIVE" : "PENDING",
                  time: activeProfile.isCleanProfile ? "10:34 AM" : "Paused",
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
                      ? "bg-purple-50/60 border-purple-200 ring-2 ring-purple-500/20"
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

          {/* Director Registry & Section 164(2) Disqualification Watchdog */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Director Board Registry &amp; DIR-3 KYC Status</span>
              <span className="text-xs font-bold text-purple-700">
                Section 164(2) Sentinel: Active
              </span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">DIN</th>
                    <th className="p-2.5">Director Name</th>
                    <th className="p-2.5">Designation</th>
                    <th className="p-2.5">Mobile &amp; Email</th>
                    <th className="p-2.5 text-center">DIR-3 KYC Status</th>
                    <th className="p-2.5 text-center">Sec 164(2) Risk</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeProfile.directors.map((d) => (
                    <tr key={d.din}>
                      <td className="p-2.5 font-bold text-slate-900">{d.din}</td>
                      <td className="p-2.5 font-sans font-bold text-slate-800">{d.name}</td>
                      <td className="p-2.5 font-sans">{d.designation}</td>
                      <td className="p-2.5 font-sans text-slate-600">{d.mobile} • {d.email}</td>
                      <td className="p-2.5 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.kycStatus === "KYC_VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800 animate-pulse"
                          }`}
                        >
                          {d.kycStatus === "KYC_VERIFIED" ? "KYC Active" : "Pending Web-KYC"}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.disqualificationRisk === "CLEAN"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.disqualificationRisk === "CLEAN" ? "Clean (0 Risk)" : "Warning"}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-sans">
                        {d.kycStatus !== "KYC_VERIFIED" ? (
                          <button
                            onClick={() => handleResolveException(d.din, "TRIGGER_DIR3_KYC_OTP")}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            Trigger Web-KYC OTP
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs">✓ Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WhatsApp Interactive Sign-off Card Preview (Clean Profile Zero-Touch) */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-purple-50/30">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Zero-Touch Secretarial Agent
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Automated Director WhatsApp Sign-Off Card
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Because this company’s accounts and secretarial disclosures match 100%, the ROC annual filing docket was compiled and queued for Director sign-off automatically.
                </p>
              </div>

              {activeProfile.status !== "CLIENT_SIGNED_OFF" ? (
                <button
                  onClick={handleSimulateDirectorSignOff}
                  disabled={isSimulatingSignOff || !activeProfile.isCleanProfile}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    activeProfile.isCleanProfile
                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isSimulatingSignOff ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing MCA v3 Filing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Simulate Director 1-Tap Sign-Off
                    </>
                  )}
                </button>
              ) : (
                <div className="px-4 py-2 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Forms AOC-4 &amp; MGT-7 Filed to MCA v3
                </div>
              )}
            </div>

            {/* Simulated WhatsApp Preview Bubble */}
            <div className="mt-4 max-w-lg bg-emerald-50 text-slate-900 border border-emerald-200 rounded-2xl p-4 shadow-sm font-sans text-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-emerald-800">
                <span className="font-bold">Brains &amp; Taxes ROC Desk (Verified)</span>
                <span>Today, 10:34 AM</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-emerald-200 space-y-2">
                <div className="font-bold text-sm text-emerald-950">
                  ⚡ Annual ROC Docket ({activeProfile.financialYear}) Sign-Off Required
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Hi {activeProfile.clientName}, your annual ROC filing docket (Forms AOC-4 &amp; MGT-7A) has been autonomously compiled and verified against audited financial statements.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] space-y-1 text-slate-800">
                  <div>• CIN: {activeProfile.cinOrLlp}</div>
                  <div>• Form AOC-4: Financial Statements &amp; Notes to Accounts</div>
                  <div>• Form MGT-7A: Annual Return of Company (Small Co)</div>
                  <div className="text-emerald-700 font-bold">• Section 403 Late Fee Exposure: ₹0 (On-time compliance)</div>
                </div>
                <div className="pt-1">
                  <div className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center py-2 rounded-lg cursor-pointer shadow-sm">
                    Click to Authorize Filing (DSC/OTP)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Execution Audit Log Stream */}
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

      {/* 5. TAB 3: MCA V3 DOCKET EXPORT & DSC MATRIX */}
      {activeTab === "dockets" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                MCA v3 Filing Dockets &amp; Digital Signature Mapping
              </h3>
              <p className="text-xs text-slate-500">
                Pre-scrutinized JSON and PDF packages ready for direct submission on the Ministry of Corporate Affairs (MCA v3) portal.
              </p>
            </div>

            <button
              onClick={() => {
                toast.success("MCA v3 Pre-Scrutiny JSON Exported", "Validated AOC-4 and MGT-7 schema payloads exported for portal upload.");
                playSoftClick();
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Export MCA v3 Pre-Scrutiny Payload (JSON)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Form AOC-4 (Financial Statements)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Pre-Scrutiny Passed
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Contains Balance Sheet, Statement of Profit &amp; Loss, Cash Flow Statement, Auditor's Report, and Directors' Report.
              </p>
              <div className="text-[11px] font-mono text-slate-500">
                Mandatory Signatories: 2 Directors (including Managing Director) + CA Statutory Auditor
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Form MGT-7 / MGT-7A (Annual Return)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Pre-Scrutiny Passed
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Contains Shareholding Pattern, Indebtedness, Director details, and Board Meeting count compliance (Sec 173).
              </p>
              <div className="text-[11px] font-mono text-slate-500">
                Mandatory Signatories: 1 Director (Small Co) or Director + Company Secretary in Practice
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: MCA AOC-4 XBRL INGEST & FINANCIAL RATIOS */}
      {activeTab === "xbrl" && (() => {
        const cinInfo = parseCin(activeProfile.cinOrLlp);

        const sampleXbrlXml = `<?xml version="1.0" encoding="utf-8"?>
<xbrl xmlns="http://www.xbrl.org/2003/instance" xmlns:in-gaap="http://www.mca.gov.in/in-gaap/2026-03-31">
  <in-gaap:CorporateIdentityNumber>${activeProfile.cinOrLlp}</in-gaap:CorporateIdentityNumber>
  <in-gaap:NameOfCompany>${activeProfile.clientName}</in-gaap:NameOfCompany>
  <in-gaap:ReportingPeriodEndDate>2026-03-31</in-gaap:ReportingPeriodEndDate>
  <in-gaap:RevenueFromOperations>485000000</in-gaap:RevenueFromOperations>
  <in-gaap:OtherIncome>1850000</in-gaap:OtherIncome>
  <in-gaap:CostOfMaterialsConsumed>312000000</in-gaap:CostOfMaterialsConsumed>
  <in-gaap:EmployeeBenefitExpense>48000000</in-gaap:EmployeeBenefitExpense>
  <in-gaap:FinanceCosts>14500000</in-gaap:FinanceCosts>
  <in-gaap:DepreciationDepletionAndAmortisationExpense>18500000</in-gaap:DepreciationDepletionAndAmortisationExpense>
  <in-gaap:OtherExpenses>52000000</in-gaap:OtherExpenses>
  <in-gaap:ProfitLossBeforeTax>41850000</in-gaap:ProfitLossBeforeTax>
  <in-gaap:TaxExpense>10533645</in-gaap:TaxExpense>
  <in-gaap:ProfitLoss>31316355</in-gaap:ProfitLoss>
  <in-gaap:ShareCapital>25000000</in-gaap:ShareCapital>
  <in-gaap:ReservesAndSurplus>118500000</in-gaap:ReservesAndSurplus>
  <in-gaap:Equity>143500000</in-gaap:Equity>
  <in-gaap:LongTermBorrowings>62000000</in-gaap:LongTermBorrowings>
  <in-gaap:ShortTermBorrowings>38500000</in-gaap:ShortTermBorrowings>
  <in-gaap:Borrowings>100500000</in-gaap:Borrowings>
  <in-gaap:TradePayables>42000000</in-gaap:TradePayables>
  <in-gaap:PropertyPlantAndEquipment>115000000</in-gaap:PropertyPlantAndEquipment>
  <in-gaap:Inventories>68000000</in-gaap:Inventories>
  <in-gaap:TradeReceivables>89000000</in-gaap:TradeReceivables>
  <in-gaap:CashAndCashEquivalents>24500000</in-gaap:CashAndCashEquivalents>
  <in-gaap:Assets>308500000</in-gaap:Assets>
</xbrl>`;

        const fin = xbrlResult?.financials || parseXbrlFinancials(sampleXbrlXml, activeProfile.cinOrLlp).financials;

        return (
          <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    MCA AOC-4 XBRL Ingestion &amp; Schedule III Analytics
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    IN-GAAP / Ind AS Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deconstructs official MCA21 XBRL instance documents. Auto-computes 11 mandatory Schedule III accounting ratios &amp; CARO 2020 cross-linkages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const parsed = parseXbrlFinancials(sampleXbrlXml, activeProfile.cinOrLlp);
                    setXbrlResult(parsed);
                    toast.success("Sample XBRL Ingested", `Loaded audited AOC-4 XBRL for ${activeProfile.clientName}`);
                    playSoftClick();
                  }}
                  className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Load Sample AOC-4 XBRL
                </button>

                <label className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" /> Upload XBRL (.xml)
                  <input
                    type="file"
                    accept=".xml,.xbrl,.txt"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsXbrlProcessing(true);
                      try {
                        const txt = await file.text();
                        const parsed = parseXbrlFinancials(txt, activeProfile.cinOrLlp);
                        setXbrlResult(parsed);
                        toast.success("XBRL Document Parsed", `Extracted financials for ${parsed.financials.companyName}`);
                      } catch (err: any) {
                        toast.error("Parsing Failed", err.message);
                      } finally {
                        setIsXbrlProcessing(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* 1. CIN DECODED INTELLIGENCE CARD */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" /> MCA Corporate Identity Number (CIN) Intelligence
                </span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {cinInfo.cin}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Entity Classification</div>
                  <div className="font-bold text-slate-800 mt-0.5">{cinInfo.categoryName}</div>
                  <div className="text-[10px] text-slate-500">{cinInfo.listingStatus} Entity</div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">NIC Economic Activity</div>
                  <div className="font-bold text-slate-800 mt-0.5 truncate" title={cinInfo.industryDescription}>
                    NIC {cinInfo.nicCode}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{cinInfo.industryDescription}</div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">ROC Jurisdiction</div>
                  <div className="font-bold text-slate-800 mt-0.5">{cinInfo.rocOffice}</div>
                  <div className="text-[10px] text-slate-500">State: {cinInfo.stateName}</div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Statutory Governance</div>
                  <div className="font-bold text-slate-800 mt-0.5">Min {cinInfo.governanceRequirements.minimumDirectors} Directors</div>
                  <div className="text-[10px] text-emerald-600 font-bold">Audit Mandatory: Sec 139</div>
                </div>
              </div>
            </div>

            {/* 2. FINANCIAL STATEMENT METRICS (P&L and Balance Sheet) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* P&L Snapshot */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-black text-xs text-slate-900 uppercase tracking-wider">
                    Profit &amp; Loss Highlights (FY {fin.fiscalYear})
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">{fin.taxonomyType} Taxonomy</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Revenue from Operations</span>
                    <span className="font-bold text-slate-900">{formatCurrencyINR(fin.revenueFromOperations)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Raw Material &amp; Direct Costs</span>
                    <span className="text-slate-800">{formatCurrencyINR(fin.costOfMaterialsConsumed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">EBITDA</span>
                    <span className="font-bold text-indigo-700">{formatCurrencyINR(fin.ebitda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Finance Costs (Interest)</span>
                    <span className="text-slate-800">{formatCurrencyINR(fin.financeCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Depreciation &amp; Amortization</span>
                    <span className="text-slate-800">{formatCurrencyINR(fin.depreciationAmortization)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                    <span className="text-slate-900">Profit After Tax (PAT)</span>
                    <span className="text-emerald-700">{formatCurrencyINR(fin.profitAfterTax)}</span>
                  </div>
                </div>
              </div>

              {/* Balance Sheet Snapshot */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-black text-xs text-slate-900 uppercase tracking-wider">
                    Balance Sheet &amp; Capital Structure
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Net Worth: {formatCurrencyINR(fin.netWorth)}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Paid-Up Share Capital</span>
                    <span className="font-bold text-slate-900">{formatCurrencyINR(fin.shareCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Reserves &amp; Surplus</span>
                    <span className="text-slate-800">{formatCurrencyINR(fin.reservesAndSurplus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Borrowings (Long + Short Term)</span>
                    <span className="font-bold text-amber-700">{formatCurrencyINR(fin.totalDebt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Property, Plant &amp; Equipment (PPE)</span>
                    <span className="text-slate-800">{formatCurrencyINR(fin.propertyPlantEquipment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Net Working Capital</span>
                    <span className="font-bold text-slate-800">{formatCurrencyINR(fin.workingCapital)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                    <span className="text-slate-900">Total Balance Sheet Footing</span>
                    <span className="text-slate-900">{formatCurrencyINR(fin.totalAssets)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SCHEDULE III MANDATORY 11 RATIOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" /> MCA Schedule III Mandatory 11 Accounting Ratios
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Companies Act, 2013 GSR 207(E)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">Current Ratio</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{fin.ratios.currentRatio}x</div>
                  <div className={`text-[10px] font-bold ${fin.ratios.currentRatio >= 1.33 ? "text-emerald-600" : "text-amber-600"}`}>
                    {fin.ratios.currentRatio >= 1.33 ? "Healthy (>1.33x)" : "Liquidity Watch"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">Debt-to-Equity Ratio</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{fin.ratios.debtEquityRatio}x</div>
                  <div className={`text-[10px] font-bold ${fin.ratios.debtEquityRatio <= 2.0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {fin.ratios.debtEquityRatio <= 2.0 ? "Prudential (<2.0x)" : "Leverage Risk"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">Debt Service Coverage (DSCR)</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{fin.ratios.debtServiceCoverageRatio}x</div>
                  <div className="text-[10px] font-bold text-emerald-600">Solvency Safe</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">Return on Equity (ROE)</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{fin.ratios.returnOnEquityPercentage}%</div>
                  <div className="text-[10px] font-bold text-indigo-600">Net Profit / Equity</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">Inventory Turnover</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{fin.ratios.inventoryTurnoverRatio}x</div>
                  <div className="text-[10px] text-slate-500">COGS / Inventory</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">Debtors Turnover</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{fin.ratios.tradeReceivablesTurnoverRatio}x</div>
                  <div className="text-[10px] text-slate-500">Turnover / Debtors</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">Creditors Turnover</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{fin.ratios.tradePayablesTurnoverRatio}x</div>
                  <div className="text-[10px] text-slate-500">Purchases / Payables</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold">Net Profit Margin</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{fin.ratios.netProfitPercentage}%</div>
                  <div className="text-[10px] font-bold text-emerald-600">PAT / Turnover</div>
                </div>
              </div>
            </div>

            {/* 4. AUDIT OBSERVATIONS BANNER */}
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" /> Statutory Audit Observations (ICAI SA 700 / CARO 2020)
                </span>
                <span>{fin.auditObservations.length} Note(s)</span>
              </div>
              <ul className="text-xs text-purple-900 space-y-1 list-disc list-inside">
                {fin.auditObservations.map((obs, idx) => (
                  <li key={idx} className="font-medium">{obs}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
