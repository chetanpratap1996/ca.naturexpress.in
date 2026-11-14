"use client";

import React, { useMemo } from "react";
import { 
  ComplianceTask, 
  InvoiceItem, 
  NoticeRecord, 
  ClientEntity, 
  ClientGroup, 
  DscRecord,
  WorkflowStatus
} from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  DollarSign, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  FileSpreadsheet, 
  Calculator, 
  Scale, 
  KeyRound, 
  Users, 
  MessageSquare, 
  Zap, 
  Layers, 
  PhoneCall, 
  ExternalLink 
} from "lucide-react";

interface ExecutiveDashboardProps {
  tasks: ComplianceTask[];
  invoices: InvoiceItem[];
  notices: NoticeRecord[];
  clients: ClientEntity[];
  groups: ClientGroup[];
  dscTokens?: DscRecord[];
  onNavigateTab: (tabId: string) => void;
  onOpenClientMaster?: () => void;
  onOpenFirmHub?: () => void;
  onStatusChange?: (taskId: string, newStatus: WorkflowStatus) => void;
  isSandbox?: boolean;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  tasks = [],
  invoices = [],
  notices = [],
  clients = [],
  groups = [],
  dscTokens = [],
  onNavigateTab,
  onOpenClientMaster,
  onOpenFirmHub,
  onStatusChange,
  isSandbox = false
}) => {
  // 1. KPI Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "FILED_AND_COMPLETED").length;
  const filingRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const criticalTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
    );
  }, [tasks]);

  const totalDemandRisk = useMemo(() => {
    return notices.reduce((acc, n) => acc + (n.demandAmount || 0), 0);
  }, [notices]);

  const pendingInvoices = useMemo(() => {
    return invoices.filter((i) => i.status !== "PAID");
  }, [invoices]);

  const pendingCollectionAmount = useMemo(() => {
    return pendingInvoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  }, [pendingInvoices]);

  const totalUnbilledWip = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.unbilledWipTotal || 0), 0);
  }, [groups]);

  // Checked-out DSCs
  const checkedOutDscCount = useMemo(() => {
    return dscTokens.filter((d) => d.currentCustodian !== "VAULT_SAFE" && d.currentCustodian !== "VAULT_LOCKER").length;
  }, [dscTokens]);

  const handleWhatsAppChase = (task: ComplianceTask) => {
    const client = clients.find((c) => c.id === task.entityId);
    const phone = client?.primaryContact?.phone || "+91 98200 00000";
    openWhatsAppPreset(phone, "DOC_CHASE", {
      clientName: task.entityName,
      serviceName: task.title,
      deadline: formatDate(task.dueDate),
      firmName: DEFAULT_FIRM_BRANDING.firmName
    });
    toast.success("WhatsApp Desk Opened", `Chase message prepared for ${task.entityName}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HERO BANNER: LAKHS-WORTHY ENTERPRISE GREETING & FIRM BADGE    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xl border border-slate-700/60">
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-btred-logo/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Managing Partner Cockpit
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-300 bg-white/10 border border-white/15">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; SQC-1 Peer Reviewed
              </span>

              {isSandbox && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Demo Sandbox Mode
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              {DEFAULT_FIRM_BRANDING.firmName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Real-time statutory governance, fee realization tracking, and active litigation risk radar.
            </p>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
            {onOpenFirmHub && (
              <button
                onClick={onOpenFirmHub}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-btred-logo hover:from-red-500 hover:to-red-600 text-white px-3.5 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-red-600/30 transition transform active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Firm Action Hub</span>
              </button>
            )}

            {onOpenClientMaster && (
              <button
                onClick={onOpenClientMaster}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition backdrop-blur-md transform active:scale-95"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Client Master ({clients.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 4 MASTER KPI CARDS: ISOLATED STRICTLY ON THE DASHBOARD             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {/* KPI 1: On-Time Filing Rate */}
        <div 
          onClick={() => onNavigateTab("calendar")}
          className="bg-white border border-slate-200/90 hover:border-emerald-400 p-4 sm:p-5 rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          title="Click to view Statutory Calendar & Deadlines"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-emerald-700 truncate">
              On-Time Filing Rate
            </span>
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {filingRate}%
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Compliant
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              {completedTasks}/{totalTasks} Returns Filed
            </span>
            <span className="text-emerald-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Inspect &rarr;
            </span>
          </div>
        </div>

        {/* KPI 2: Due in 72 Hours (Critical) */}
        <div 
          onClick={() => onNavigateTab("calendar")}
          className="bg-white border border-slate-200/90 hover:border-red-400 p-4 sm:p-5 rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          title="Click to view 72-Hour Critical Deadlines"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-red-700 truncate">
              Due in 72 Hours
            </span>
            <div className="p-2 rounded-2xl bg-red-50 text-btred-logo border border-red-200 shrink-0 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-btred-logo tracking-tight">
              {criticalTasks.length}
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-btred-logo border border-red-200">
              Critical Urgency
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              Immediate Client Chase
            </span>
            <span className="text-btred-logo font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
              View List &rarr;
            </span>
          </div>
        </div>

        {/* KPI 3: Active Tax Scrutiny Notices */}
        <div 
          onClick={() => onNavigateTab("notices")}
          className="bg-white border border-slate-200/90 hover:border-amber-400 p-4 sm:p-5 rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          title="Click to view Active Scrutiny Notices & DRC-01"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-amber-700 truncate">
              Active Tax Notices
            </span>
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0 group-hover:scale-110 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {notices.length}
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Cases Open
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              ₹{(totalDemandRisk / 100000).toFixed(2)}L Demand Risk
            </span>
            <span className="text-amber-700 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Triage &rarr;
            </span>
          </div>
        </div>

        {/* KPI 4: Billing & Fee Collections */}
        <div 
          onClick={() => onNavigateTab("billing")}
          className="bg-white border border-slate-200/90 hover:border-indigo-400 p-4 sm:p-5 rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          title="Click to view Fee Realization & Collections"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-indigo-700 truncate">
              Fee Collections
            </span>
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0 group-hover:scale-110 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              ₹{(pendingCollectionAmount / 100000).toFixed(2)}L
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Pending
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              ₹{(totalUnbilledWip / 100000).toFixed(2)}L Unbilled WIP
            </span>
            <span className="text-indigo-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Inspect &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 1-TAP FAST-LAUNCH HIGHWAY (ENTERPRISE ACTION DOCK)                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-btred-logo" />
            <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
              High-Frequency Daily Workflows
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Direct shortcuts to key audit &amp; tax engines
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          <button
            onClick={() => onNavigateTab("calendar")}
            className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-slate-200 hover:border-red-300 hover:bg-red-50/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 text-btred-logo border border-red-200 flex items-center justify-center group-hover:scale-110 transition mb-1.5">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">Tax Deadlines</span>
            <span className="text-[10px] text-slate-500 font-medium">{tasks.length} filings</span>
          </button>

          <button
            onClick={() => onNavigateTab("bank-parser")}
            className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition mb-1.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">Bank to Tally</span>
            <span className="text-[10px] text-slate-500 font-medium">Auto-OCR XML</span>
          </button>

          <button
            onClick={() => onNavigateTab("itr-calc")}
            className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center group-hover:scale-110 transition mb-1.5">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">ITR 115BAC</span>
            <span className="text-[10px] text-slate-500 font-medium">AY 2025-26</span>
          </button>

          <button
            onClick={() => onNavigateTab("schedule3-audit")}
            className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-110 transition mb-1.5">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">Schedule III</span>
            <span className="text-[10px] text-slate-500 font-medium">CARO &amp; 11 Ratios</span>
          </button>

          <button
            onClick={() => onNavigateTab("notice-drafter")}
            className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-slate-200 hover:border-red-300 hover:bg-red-50/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-red-50 text-btred-logo border border-red-200 flex items-center justify-center group-hover:scale-110 transition mb-1.5">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">Notice Drafter</span>
            <span className="text-[10px] text-slate-500 font-medium">ITAT Case Laws</span>
          </button>

          <button
            onClick={() => onNavigateTab("udin-vault")}
            className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center group-hover:scale-110 transition mb-1.5">
              <KeyRound className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-900">UDIN Vault</span>
            <span className="text-[10px] text-slate-500 font-medium">60-Day Countdown</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TWO-COLUMN OPERATIONAL RADAR: 72H ACTION & SCRUTINY WATCHDOG            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: 72-Hour Critical Action Feed */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-red-50 text-btred-logo border border-red-200">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    72-Hour Critical Filings Action Radar
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Immediate statutory return deadlines with 1-tap client reminders
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab("calendar")}
                className="text-xs font-bold text-btred-logo hover:underline flex items-center gap-1"
              >
                <span>All Deadlines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {criticalTasks.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Zero Critical 72h Deficits</p>
                <p className="text-[11px] text-slate-400">All high-priority statutory tasks are filed or in order.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {criticalTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-red-100 text-btred-logo border border-red-200">
                          {task.category}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {task.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium truncate">
                        {task.entityName} &bull; <strong className="text-slate-800">Due: {formatDate(task.dueDate)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleWhatsAppChase(task)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1"
                        title="1-Tap WhatsApp Chase to Client"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {onStatusChange && (
                        <button
                          onClick={() => {
                            onStatusChange(task.id, "FILED_AND_COMPLETED");
                            toast.success("Task Completed", `${task.title} marked filed.`);
                          }}
                          className="p-2 rounded-xl bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700 transition"
                          title="Mark Filed & Completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing top critical statutory deadlines</span>
            <span className="font-bold text-slate-700">ICAI &amp; GSTN Compliant</span>
          </div>
        </div>

        {/* Right Column: High-Risk Notice Triage & Financial Sentinel */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    High-Risk Scrutiny &amp; Vault Sentinel
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Active demand risk, custody of physical tokens, and portal notices
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab("notices")}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>Notice Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {notices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        {notice.section || "Scrutiny"}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {notice.entityName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium truncate">
                      Authority: {notice.authority} &bull; <strong className="text-btred-logo">Demand: ₹{(notice.demandAmount / 100000).toFixed(2)}L</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigateTab("notice-drafter")}
                    className="px-2.5 py-1.5 rounded-xl bg-btred-logo hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs"
                  >
                    <span>Draft Reply</span>
                  </button>
                </div>
              ))}

              {/* Custody Sentinel Summary Row */}
              <div className="p-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-700">Physical DSC Tokens:</span>
                  <span className="text-slate-600">{checkedOutDscCount} Checked Out / {dscTokens.length} In Vault</span>
                </div>
                <button
                  onClick={() => onNavigateTab("dsc")}
                  className="text-xs font-bold text-slate-900 hover:underline"
                >
                  Keys Locker &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>DIN Scraper &bull; Realtime Sync</span>
            <span className="font-bold text-emerald-600">Faceless Portal Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
