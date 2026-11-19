"use client";

import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  Search, 
  Sparkles, 
  Building2, 
  UserCheck, 
  Award,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  Calendar
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import { 
  CaroClauseReport, 
  CaroClauseStatus, 
  CaroClauseCategory,
  DEFAULT_CARO_2020_CLAUSES,
  Caro2020Engine 
} from "@/lib/schedule3/caro2020Engine";

interface Caro2020CockpitProps {
  client: {
    id: string;
    name: string;
    pan: string;
    cin?: string;
  };
}

export const Caro2020Cockpit: React.FC<Caro2020CockpitProps> = ({ client }) => {
  const [clauses, setClauses] = useState<CaroClauseReport[]>(() => JSON.parse(JSON.stringify(DEFAULT_CARO_2020_CLAUSES)));
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClauseNo, setExpandedClauseNo] = useState<string | null>("Clause (ii)");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    let compliant = 0;
    let qualified = 0;
    let adverse = 0;
    let na = 0;
    let signedOff = 0;

    clauses.forEach(c => {
      if (c.status === "COMPLIANT_UNQUALIFIED") compliant++;
      else if (c.status === "QUALIFIED_ATTENTION_REQUIRED") qualified++;
      else if (c.status === "ADVERSE_REMARK") adverse++;
      else if (c.status === "NOT_APPLICABLE") na++;

      if (c.partnerSignedOff) signedOff++;
    });

    return {
      total: clauses.length,
      compliant,
      qualified,
      adverse,
      na,
      signedOff,
      progress: Math.round((signedOff / clauses.length) * 100)
    };
  }, [clauses]);

  // Filtered Clauses
  const filteredClauses = useMemo(() => {
    return clauses.filter(c => {
      const matchCategory = selectedCategory === "ALL" || c.category === selectedCategory;
      const matchStatus = selectedStatus === "ALL" || c.status === selectedStatus;
      const matchSearch = searchQuery === "" || 
        c.clauseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.primaryRequirement.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchStatus && matchSearch;
    });
  }, [clauses, selectedCategory, selectedStatus, searchQuery]);

  // Toggle Partner Sign-Off
  const handleToggleSignOff = (clauseNo: string) => {
    playSoftClick();
    setClauses(prev => prev.map(c => {
      if (c.clauseNumber === clauseNo) {
        const nextState = !c.partnerSignedOff;
        return {
          ...c,
          partnerSignedOff: nextState,
          signedOffBy: nextState ? "CA Rajesh Aggarwal (M.No 054891)" : undefined,
          signedOffAt: nextState ? new Date().toISOString().split("T")[0] : undefined
        };
      }
      return c;
    }));
    toast.success(`Partner sign-off updated for ${clauseNo}`);
  };

  // Sign off all compliant
  const handleSignOffAllCompliant = () => {
    playSuccessChime();
    setClauses(prev => prev.map(c => {
      if (c.status === "COMPLIANT_UNQUALIFIED" || c.status === "NOT_APPLICABLE") {
        return {
          ...c,
          partnerSignedOff: true,
          signedOffBy: "CA Rajesh Aggarwal (M.No 054891)",
          signedOffAt: new Date().toISOString().split("T")[0]
        };
      }
      return c;
    }));
    toast.success("All compliant & N/A CARO clauses signed off by Partner!");
  };

  // Generate Report Markdown
  const reportMarkdown = useMemo(() => {
    return Caro2020Engine.generateAnnexureDraftMarkdown({
      clientName: client.name,
      cin: client.cin || "U29100MP2015PTC034120",
      financialYear: "FY 2025-26",
      assessmentYear: "AY 2026-27",
      clauses
    });
  }, [client, clauses]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopiedDraft(true);
    toast.success("CARO 2020 Annexure copied to clipboard!");
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* HEADER / EXECUTIVE BANNER                                             */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
                Companies Act, 2013 • Sec 143(11)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wider border border-emerald-500/30">
                CARO 2020 Audit Suite
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              CARO 2020: 21-Clause Automated Verification Engine
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl">
              Autonomous statutory audit evaluation with automated rules for Cash Losses u/s Clause (xvii), Bank Statement Reconciliations u/s Clause (ii)(b), Undisputed Statutory Dues u/s Clause (vii)(a), and SA 570 Going Concern evaluation u/s Clause (xix).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSignOffAllCompliant}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Award className="w-4 h-4" />
              Batch Partner Sign-Off
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              Generate ICAI Annexure Report
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-indigo-900/50">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium uppercase">Total Clauses</div>
            <div className="text-xl font-bold text-white mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">ICAI CARO 2020</div>
          </div>
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-700/40">
            <div className="text-[11px] text-emerald-300 font-medium uppercase">Compliant</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{stats.compliant}</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Unqualified clean</div>
          </div>
          <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-700/40">
            <div className="text-[11px] text-amber-300 font-medium uppercase">Attention Req.</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats.qualified}</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Review items</div>
          </div>
          <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-700/40">
            <div className="text-[11px] text-rose-300 font-medium uppercase">Adverse Remarks</div>
            <div className="text-xl font-bold text-rose-400 mt-1">{stats.adverse}</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">Statutory red flags</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-[11px] text-slate-400 font-medium uppercase">Not Applicable</div>
            <div className="text-xl font-bold text-slate-300 mt-1">{stats.na}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Commercial entity</div>
          </div>
          <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-700/40">
            <div className="text-[11px] text-indigo-300 font-medium uppercase">Partner Sign-Off</div>
            <div className="text-xl font-bold text-indigo-400 mt-1">{stats.progress}%</div>
            <div className="text-[10px] text-indigo-300/80 mt-0.5">{stats.signedOff} of {stats.total} clauses</div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FILTERS & SEARCH CONTROLS                                             */}
      {/* ===================================================================== */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {[
              { id: "ALL", label: "All Clauses" },
              { id: "COMPLIANT_UNQUALIFIED", label: "Compliant" },
              { id: "QUALIFIED_ATTENTION_REQUIRED", label: "Qualified" },
              { id: "NOT_APPLICABLE", label: "N/A" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  selectedStatus === tab.id
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories (21 Clauses)</option>
            <option value="PPE_AND_ASSETS">PPE & Assets (Cl i)</option>
            <option value="INVENTORIES_AND_WORKING_CAPITAL">Inventories & Bank Returns (Cl ii)</option>
            <option value="LOANS_AND_INVESTMENTS">Loans & Investments (Cl iii)</option>
            <option value="REGULATORY_COMPLIANCE">Regulatory: Sec 185, 186, Deposits (Cl iv, v, vi, viii, x, xii, xv, xvi, xx)</option>
            <option value="STATUTORY_DUES">Statutory Dues & Disputes (Cl vii)</option>
            <option value="BORROWINGS_AND_DEFAULT">Borrowings & Defaults (Cl ix)</option>
            <option value="FRAUD_AND_GOVERNANCE">Fraud, Whistle-Blower & RPT (Cl xi, xiii, xiv, xviii)</option>
            <option value="FINANCIAL_HEALTH_AND_GOING_CONCERN">Going Concern & Cash Losses (Cl xvii, xix)</option>
            <option value="GROUP_AND_CFS">Group & CFS (Cl xxi)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search clause, keyword, statutory ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CLAUSES ACCORDION LIST                                                */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        {filteredClauses.map((clause) => {
          const isExpanded = expandedClauseNo === clause.clauseNumber;
          const statusBadge = 
            clause.status === "COMPLIANT_UNQUALIFIED" ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Compliant
              </span>
            ) : clause.status === "QUALIFIED_ATTENTION_REQUIRED" ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Attention Required
              </span>
            ) : clause.status === "ADVERSE_REMARK" ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/50 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Adverse Remark
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                Not Applicable
              </span>
            );

          return (
            <div
              key={clause.clauseNumber}
              className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
                isExpanded 
                  ? "border-indigo-500/50 dark:border-indigo-500/40 ring-1 ring-indigo-500/20" 
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Header Bar */}
              <div 
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                onClick={() => setExpandedClauseNo(isExpanded ? null : clause.clauseNumber)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    clause.status === "COMPLIANT_UNQUALIFIED" 
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : clause.status === "QUALIFIED_ATTENTION_REQUIRED"
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    {clause.clauseNumber.replace("Clause (", "").replace(")", "")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {clause.clauseNumber}: {clause.title}
                      </span>
                      {statusBadge}
                      {clause.partnerSignedOff && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <Award className="w-2.5 h-2.5" /> Partner Signed Off
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {clause.primaryRequirement}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSignOff(clause.clauseNumber);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      clause.partnerSignedOff
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-rose-100 hover:text-rose-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700"
                    }`}
                  >
                    {clause.partnerSignedOff ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Signed Off
                      </>
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5" /> Sign Off
                      </>
                    )}
                  </button>

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Body */}
              {isExpanded && (
                <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 space-y-5 bg-white dark:bg-slate-900">
                  {/* Statutory Reference Strip */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Statutory Reference:</span>
                      <span>{clause.statutoryRef}</span>
                    </div>
                    {clause.signedOffBy && (
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                        Signed off by {clause.signedOffBy} on {clause.signedOffAt}
                      </div>
                    )}
                  </div>

                  {/* Sub-Clauses Detailed Breakdown */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Sub-Clause Inquiries & Evidence ({clause.subItems.length})
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {clause.subItems.map((sub) => (
                        <div
                          key={sub.subClauseKey}
                          className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  ({sub.subClauseKey})
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {sub.subClauseTitle}
                                </span>
                                {sub.workpaperRef && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {sub.workpaperRef}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {sub.requirement}
                              </p>
                            </div>

                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              sub.status === "COMPLIANT_UNQUALIFIED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : sub.status === "QUALIFIED_ATTENTION_REQUIRED"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {sub.status === "COMPLIANT_UNQUALIFIED" ? "Compliant" : sub.status === "NOT_APPLICABLE" ? "N/A" : "Attention Required"}
                            </span>
                          </div>

                          {/* Audit Findings */}
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Audit Verification Finding</div>
                            <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{sub.findingDetails}</div>
                          </div>

                          {/* Statutory Draft Remarks */}
                          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/40">
                            <div className="text-[10px] uppercase font-bold text-indigo-500">ICAI Recommended Reporting Formulation</div>
                            <div className="text-xs text-indigo-950 dark:text-indigo-200 italic mt-0.5 font-serif">
                              "{sub.auditorRemarks}"
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Synthesized Annexure Draft */}
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <span>Synthesized Clause Reporting Draft (for Independent Auditor's Annexure)</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(clause.synthesizedReportingText);
                          toast.success("Clause remarks copied");
                        }}
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] normal-case"
                      >
                        <Copy className="w-3 h-3" /> Copy Clause
                      </button>
                    </div>
                    <p className="text-xs font-serif leading-relaxed text-slate-200 italic">
                      "{clause.synthesizedReportingText}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: FULL ICAI CARO 2020 AUDITOR'S REPORT ANNEXURE                  */}
      {/* ===================================================================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    CARO 2020: Independent Auditor's Report Annexure
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Annexure "A" pursuant to Section 143(11) of the Companies Act, 2013
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReport}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {copiedDraft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDraft ? "Copied!" : "Copy Annexure"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Document Content */}
            <div className="p-6 overflow-y-auto space-y-4 font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50/40 dark:bg-slate-950/40">
              <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="text-center border-b pb-4 border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold tracking-wide uppercase text-slate-900 dark:text-white">
                    ANNEXURE "A" TO THE INDEPENDENT AUDITOR'S REPORT
                  </h2>
                  <p className="text-xs italic text-slate-500 mt-1">
                    (Referred to in paragraph 1 under 'Report on Other Legal and Regulatory Requirements' section of our report of even date)
                  </p>
                  <div className="text-xs font-sans font-bold text-slate-700 dark:text-slate-300 mt-3">
                    {client.name} | CIN: {client.cin || "U29100MP2015PTC034120"}
                  </div>
                </div>

                <div className="space-y-5 text-xs text-justify">
                  <p>
                    To the best of our information and according to the explanations provided to us by the Company and the books of account and records examined by us in the normal course of audit, we state that:
                  </p>

                  {clauses.map(clause => (
                    <div key={clause.clauseNumber} className="space-y-1.5">
                      <div className="font-bold font-sans text-slate-900 dark:text-white">
                        {clause.clauseNumber}: {clause.title}
                      </div>
                      <div className="pl-3 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-800">
                        {clause.subItems.map(sub => (
                          <div key={sub.subClauseKey} className="text-slate-700 dark:text-slate-300">
                            <strong>({sub.subClauseKey})</strong> {sub.auditorRemarks}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 font-sans space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">For and on behalf of</div>
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">M/s AGGARWAL SHUKLA & CO.</div>
                    <div className="text-slate-600 dark:text-slate-400">Chartered Accountants (FRN: 014285C)</div>
                    <div className="mt-4 font-bold text-slate-800 dark:text-slate-200">CA Rajesh Aggarwal, FCA</div>
                    <div className="text-slate-500">Partner | Membership No. 054891</div>
                    <div className="font-mono text-[11px] text-slate-500">UDIN: 26054891BGTA8829</div>
                    <div className="text-slate-400 text-[11px]">Date: 15th September 2026 | Place: Indore</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
