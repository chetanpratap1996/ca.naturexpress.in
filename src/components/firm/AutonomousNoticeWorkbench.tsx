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
  Download,
  Copy,
  Video,
  Gavel
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import {
  NoticeDocketItem,
  getSampleNoticeDockets,
  approveNoticeDefense
} from "@/lib/litigation/autonomousNoticeEngine";

export const AutonomousNoticeWorkbench: React.FC = () => {
  const [dockets, setDockets] = useState<NoticeDocketItem[]>(() => getSampleNoticeDockets());
  const [selectedDocketId, setSelectedDocketId] = useState<string>("NOTICE-DOCKET-02");
  const [activeTab, setActiveTab] = useState<"dossier" | "sentinel" | "stay">("dossier");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const activeDocket = dockets.find((d) => d.id === selectedDocketId) || dockets[0];

  const handleApproveDefense = () => {
    setIsApproving(true);
    playSoftClick();

    setTimeout(() => {
      const updated = approveNoticeDefense(
        dockets,
        activeDocket.id,
        "Defense brief and interim stay petition vetted and approved by CA Partner."
      );
      setDockets(updated);
      setIsApproving(false);
      playSuccessChime();
      toast.success(
        "Defense Brief Approved for e-Filing",
        `Legal dossier for ${activeDocket.section} approved. Ready for direct upload to NFAC portal.`
      );
    }, 1000);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    playSoftClick();
    toast.success("Copied to Clipboard", `${label} copied to clipboard.`);
  };

  const totalDemandAtStake = dockets.reduce((acc, d) => acc + d.allegedDemandInr, 0);
  const fatalDinDefectsCount = dockets.filter((d) => d.dinStatus === "MISSING_DIN_FATAL").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. INSTITUTIONAL HEADER & DOCKET SWITCHER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5 text-rose-600" /> Module 3.4: Faceless Defense
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Circular 19/2019 DIN Sentinel
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                CBDT OM 2017 Stay Engine
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Autonomous Faceless Scrutiny &amp; Notice Defense Assembly Line
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Validates computer-generated DINs, enforces Section 149 limitation barriers, auto-cites Supreme Court precedents, and generates ready-to-file legal defense dossiers.
            </p>
          </div>

          {/* Docket Switcher & Reset Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
              <Building2 className="w-4 h-4 text-slate-500 ml-2" />
              <select
                value={selectedDocketId}
                onChange={(e) => {
                  setSelectedDocketId(e.target.value);
                  playSoftClick();
                }}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 pr-3 py-1 focus:outline-none cursor-pointer"
              >
                {dockets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.clientName} ({d.section.replace(/_/g, " ")} • {d.dinStatus === "MISSING_DIN_FATAL" ? "FATAL DEFECT" : "DIN Valid"})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setDockets(getSampleNoticeDockets());
                toast.info("Reset Dockets", "Notice dockets reset to institutional baseline.");
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
              <Gavel className="w-3.5 h-3.5 text-indigo-600" /> Active Notice Dockets
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
              {dockets.length} Dockets
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
              NFAC &amp; GSTN communications
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Fatal DIN Defects
            </div>
            <div className="text-lg sm:text-2xl font-black text-rose-600 mt-1">
              {fatalDinDefectsCount} Notice Void
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Void ab initio (Brandix Mauritius)
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Demand Under Shield
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-600 mt-1">
              {formatCurrencyINR(totalDemandAtStake)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Full stay &amp; waiver drafted
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" /> Limitation Expiry
            </div>
            <div className="text-lg sm:text-2xl font-black text-purple-700 mt-1">
              {activeDocket.daysRemaining} Days Left
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Due on {activeDocket.limitationDueDate}
            </div>
          </div>
        </div>
      </div>

      {/* 2. THREE-TAB WORKSPACE SWITCHER */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2">
        <button
          onClick={() => {
            setActiveTab("dossier");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "dossier"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Autonomous Legal Defense Dossier &amp; Citations
          {activeDocket.defenseStatus === "DRAFT_READY" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
              Ready for Review
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("sentinel");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "sentinel"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Notice Ingestion &amp; DIN Sentinel
          {activeDocket.dinStatus === "MISSING_DIN_FATAL" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
              FATAL DEFECT
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("stay");
            playSoftClick();
          }}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === "stay"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scale className="w-4 h-4" />
          Interim Stay Petition &amp; 20% Waiver Desk
        </button>
      </div>

      {/* 3. TAB 1: AUTONOMOUS LEGAL DEFENSE DOSSIER (DAY 236–245) */}
      {activeTab === "dossier" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  NFAC e-Filing Legal Response ({activeDocket.assessmentYearOrPeriod})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Section {activeDocket.section.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-formatted legal brief with preliminary jurisdictional objections, ledger annexures, and Supreme Court citations.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeDocket.defenseStatus === "DRAFT_READY" ? (
                <button
                  onClick={handleApproveDefense}
                  disabled={isApproving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm"
                >
                  {isApproving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Vetting Brief...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> 1-Click Partner Approval for e-Filing
                    </>
                  )}
                </button>
              ) : (
                <div className="px-4 py-2 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Approved by Partner for Portal Submission
                </div>
              )}

              <button
                onClick={() => {
                  toast.success("Legal Brief PDF Exported", "Institutional defense brief exported with table of authorities.");
                  playSoftClick();
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* Formatted Legal Submission Document */}
          <div className="border border-slate-200 rounded-2xl p-6 sm:p-8 bg-slate-50/50 space-y-6 font-serif text-slate-800 text-xs sm:text-sm leading-relaxed">
            {/* Header Address */}
            <div className="space-y-1 text-center font-sans border-b border-slate-200 pb-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                IN THE OFFICE OF THE NATIONAL FACELESS ASSESSMENT CENTRE (NFAC), DELHI
              </div>
              <div className="font-bold text-slate-900 text-sm">
                IN THE MATTER OF: {activeDocket.clientName} (PAN: {activeDocket.panOrGstin})
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Assessment Year: {activeDocket.assessmentYearOrPeriod} • Notice DIN: {activeDocket.dinOrNoticeNo}
              </div>
            </div>

            {/* PART I: PRELIMINARY JURISDICTIONAL OBJECTIONS */}
            <div className="space-y-3">
              <h4 className="font-sans font-black text-xs uppercase tracking-wider text-rose-700 border-b border-rose-200 pb-1 flex items-center gap-2">
                <Gavel className="w-4 h-4" /> Part I: Preliminary Jurisdictional Objections (Fatal Defects)
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-slate-800 pl-2">
                {activeDocket.defenseBrief.preliminaryObjections.map((obj, i) => (
                  <li key={i} className="pl-1">
                    <span className="font-sans font-bold text-slate-900">Ground {i + 1}:</span> {obj}
                  </li>
                ))}
              </ol>
            </div>

            {/* PART II: FACTUAL SUBMISSIONS & RECONCILIATIONS */}
            <div className="space-y-3">
              <h4 className="font-sans font-black text-xs uppercase tracking-wider text-indigo-700 border-b border-indigo-200 pb-1 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Part II: Factual Matrix &amp; Cross-Workpaper Verifications
              </h4>
              <ul className="list-disc list-inside space-y-2 text-slate-800 pl-2">
                {activeDocket.defenseBrief.factualSubmissions.map((sub, i) => (
                  <li key={i} className="pl-1">
                    {sub}
                  </li>
                ))}
              </ul>
            </div>

            {/* PART III: LANDMARK JUDICIAL PRECEDENTS */}
            <div className="space-y-3">
              <h4 className="font-sans font-black text-xs uppercase tracking-wider text-purple-700 border-b border-purple-200 pb-1 flex items-center gap-2">
                <Award className="w-4 h-4" /> Part III: Binding Judicial Precedents (Table of Authorities)
              </h4>
              <div className="space-y-2 font-sans">
                {activeDocket.defenseBrief.judicialPrecedents.map((prec, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{prec.caseTitle}</span>
                        {prec.isBindingArticle141 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                            Article 141 SC (Binding)
                          </span>
                        )}
                        {prec.precedenceWeight && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                            Precedence: {prec.precedenceWeight}x
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-purple-700 font-bold">{prec.citation}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold">{prec.court}</div>
                    <p className="text-xs text-slate-700 font-serif italic">"{prec.ratio}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* PART IV: PRAYER & VC PERSONAL HEARING REQUEST */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900">
                Part IV: Prayer &amp; Request for Video Conference Personal Hearing
              </h4>
              <p className="text-slate-800 italic">
                {activeDocket.defenseBrief.prayer}
              </p>
              <div className="flex items-center gap-2 pt-2 font-sans">
                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Video Conference (VC) Hearing Prayer Included
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: NOTICE INGESTION & DIN SENTINEL (DAY 226–235) */}
      {activeTab === "sentinel" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          {/* DIN Status Alert Banner */}
          {activeDocket.dinStatus === "MISSING_DIN_FATAL" ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600 shrink-0" />
                <h3 className="text-sm font-black text-rose-950 uppercase tracking-wider">
                  Fatal Jurisdictional Defect: Missing / Invalid DIN (Circular No. 19/2019)
                </h3>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                The impugned communication quotes no valid computer-generated Document Identification Number. Under the binding ruling of the Hon'ble Supreme Court in <span className="font-bold italic">CIT v. Brandix Mauritius Holdings (456 ITR 34)</span>, this notice is legally <span className="font-bold underline">deemed never to have been issued</span> and is non-est in the eyes of law.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950">DIN Verified Authentic</h4>
                <p className="text-[11px] text-emerald-800 font-mono">
                  {activeDocket.dinOrNoticeNo} • Validated on CBDT ITBA portal database.
                </p>
              </div>
            </div>
          )}

          {/* Alleged Demand & Statutory Breakdown */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Notice Allegations &amp; Cross-Workpaper Evidence Findings</span>
              <span className="text-xs font-bold text-rose-600">
                Alleged Demand: {formatCurrencyINR(activeDocket.allegedDemandInr)}
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Issues Raised by Assessing Officer:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                  {activeDocket.issuesIdentified.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Firm Verified Cross-Workpaper Evidence Found:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                  {activeDocket.crossWorkpaperEvidenceFound.map((ev, i) => (
                    <li key={i} className="text-emerald-900 font-medium">{ev}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Simulated WhatsApp Client Briefing Preview */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-rose-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">
                  Client Litigation Advisory
                </span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">
                  Automated WhatsApp Notice Risk Briefing
                </h4>
              </div>
              <button
                onClick={() => {
                  toast.success("WhatsApp Briefing Dispatched", "Notice summary, DIN assessment, and defense roadmap dispatched to client WhatsApp.");
                  playSoftClick();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch Client Briefing via WhatsApp
              </button>
            </div>

            <div className="max-w-lg bg-emerald-900 text-white rounded-2xl p-4 shadow-md font-sans text-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-emerald-200">
                <span className="font-bold">Brains &amp; Taxes Litigation Desk (Verified)</span>
                <span>Today, 10:17 AM</span>
              </div>
              <div className="bg-emerald-950/80 rounded-xl p-3 border border-emerald-700/50 space-y-2">
                <div className="font-bold text-sm text-emerald-100">
                  ⚖ Notice Received: Section {activeDocket.section.replace(/_/g, " ")} ({activeDocket.assessmentYearOrPeriod})
                </div>
                <p className="text-[11px] text-emerald-200 leading-relaxed">
                  Hi {activeDocket.clientName}, we have intercepted a tax notice from NFAC regarding {activeDocket.assessmentYearOrPeriod}.
                </p>
                <div className="bg-black/30 rounded-lg p-2 font-mono text-[11px] space-y-1">
                  <div>• Alleged Demand: {formatCurrencyINR(activeDocket.allegedDemandInr)}</div>
                  <div className="text-emerald-300 font-bold">• DIN Status: {activeDocket.dinStatus.replace(/_/g, " ")}</div>
                  <div>• Statutory Reply Due: {activeDocket.limitationDueDate} ({activeDocket.daysRemaining} days left)</div>
                </div>
                <div className="pt-1">
                  <div className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-center py-2 rounded-lg cursor-pointer">
                    Review Prepared Legal Defense Brief
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: INTERIM STAY PETITION & 20% WAIVER DESK */}
      {activeTab === "stay" && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm">
          {activeDocket.stayPetition ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" /> Interim Stay of Demand &amp; 20% Pre-Deposit Waiver Petition
                  </h3>
                  <p className="text-xs text-slate-500">
                    Application under Section 220(6) read with CBDT Instruction No. 1914 &amp; Office Memorandum dated 31.07.2017.
                  </p>
                </div>

                <button
                  onClick={() => {
                    toast.success("Stay Petition Exported", "Signed stay petition application ready for filing before Jurisdictional AO.");
                    playSoftClick();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export Stay Petition PDF
                </button>
              </div>

              {/* Hardship Grounds Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Disputed Demand
                  </span>
                  <span className="text-lg font-black text-rose-600 mt-1 block">
                    {formatCurrencyINR(activeDocket.stayPetition.disputedDemand)}
                  </span>
                  <span className="text-[11px] text-slate-500">Under appeal / objection</span>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Standard 20% Pre-Deposit
                  </span>
                  <span className="text-lg font-black text-amber-600 mt-1 block">
                    {formatCurrencyINR(activeDocket.stayPetition.disputedDemand * 0.2)}
                  </span>
                  <span className="text-[11px] text-slate-500">Per CBDT OM 2017 baseline</span>
                </div>

                <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/60">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Proposed Pre-Deposit
                  </span>
                  <span className="text-lg font-black text-emerald-700 mt-1 block">
                    ₹0 (100% Waiver Requested)
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold">Due to Fatal DIN Defect</span>
                </div>
              </div>

              {/* Hardship Grounds List */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Established Financial Hardship &amp; Jurisdictional Grounds:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5 pl-2">
                  {activeDocket.stayPetition.hardshipGrounds.map((ground, i) => (
                    <li key={i}>{ground}</li>
                  ))}
                </ul>
              </div>

              {/* Petition Formal Draft */}
              <div className="bg-slate-900 text-slate-200 p-5 rounded-xl font-mono text-xs leading-relaxed space-y-2">
                <div className="text-indigo-400 font-bold uppercase text-[11px]">
                  FORMAL STAY PETITION TEXT — SECTION 220(6)
                </div>
                <p className="text-slate-300">
                  {activeDocket.stayPetition.petitionText}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl">
              Zero active demand. No stay petition required for this docket.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
