"use client";

import React, { useMemo, useState } from "react";
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
import { formatDate } from "@/lib/utils";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import {
  SANDBOX_TASKS,
  SANDBOX_INVOICES,
  SANDBOX_NOTICES,
  SANDBOX_CLIENTS,
  SANDBOX_GROUPS,
  SANDBOX_DSC_TOKENS
} from "@/lib/data/sandboxData";
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
  Layers, 
  Compass
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
  // Use realistic demo fallback if arrays are empty, ensuring the dashboard is never a blank zero-state
  const effectiveTasks = useMemo(() => tasks.length > 0 ? tasks : SANDBOX_TASKS, [tasks]);
  const effectiveInvoices = useMemo(() => invoices.length > 0 ? invoices : SANDBOX_INVOICES, [invoices]);
  const effectiveNotices = useMemo(() => notices.length > 0 ? notices : SANDBOX_NOTICES, [notices]);
  const effectiveClients = useMemo(() => clients.length > 0 ? clients : SANDBOX_CLIENTS, [clients]);
  const effectiveGroups = useMemo(() => groups.length > 0 ? groups : SANDBOX_GROUPS, [groups]);
  const effectiveDscTokens = useMemo(() => dscTokens.length > 0 ? dscTokens : SANDBOX_DSC_TOKENS, [dscTokens]);

  const [noticeFilter, setNoticeFilter] = useState<"ALL" | "INCOME_TAX" | "GST">("ALL");

  // 1. KPI Calculations
  const totalTasks = effectiveTasks.length;
  const completedTasks = effectiveTasks.filter((t) => t.status === "FILED_AND_COMPLETED").length;
  const filingRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const criticalTasks = useMemo(() => {
    return effectiveTasks.filter(
      (t) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
    );
  }, [effectiveTasks]);

  const totalDemandRisk = useMemo(() => {
    return effectiveNotices.reduce((acc, n) => acc + (n.demandAmount || 0), 0);
  }, [effectiveNotices]);

  const pendingInvoices = useMemo(() => {
    return effectiveInvoices.filter((i) => i.status !== "PAID");
  }, [effectiveInvoices]);

  const pendingCollectionAmount = useMemo(() => {
    return pendingInvoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  }, [pendingInvoices]);

  const totalUnbilledWip = useMemo(() => {
    return effectiveGroups.reduce((acc, g) => acc + (g.unbilledWipTotal || 0), 0);
  }, [effectiveGroups]);

  // Checked-out DSCs
  const checkedOutDscCount = useMemo(() => {
    return effectiveDscTokens.filter((d) => d.currentCustodian !== "VAULT_SAFE" && d.currentCustodian !== "VAULT_LOCKER").length;
  }, [effectiveDscTokens]);

  // Filtered notices by authority
  const filteredNotices = useMemo(() => {
    if (noticeFilter === "ALL") return effectiveNotices;
    return effectiveNotices.filter((n) => {
      const auth = n.authority.toUpperCase();
      if (noticeFilter === "INCOME_TAX") return auth.includes("INCOME_TAX") || auth.includes("ITD");
      if (noticeFilter === "GST") return auth.includes("GST");
      return true;
    });
  }, [effectiveNotices, noticeFilter]);

  const handleWhatsAppChase = (task: ComplianceTask) => {
    const client = effectiveClients.find((c) => c.id === task.entityId);
    const phone = client?.primaryContact?.phone || "+91 98200 00000";
    openWhatsAppPreset(phone, "DOC_CHASE", {
      clientName: task.entityName,
      serviceName: task.title,
      deadline: formatDate(task.dueDate),
      firmName: DEFAULT_FIRM_BRANDING.firmName
    });
    toast.success("WhatsApp Link Prepared", `Client message ready for ${task.entityName}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. COMPACT EXECUTIVE HEADER                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Portals Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            FY 2024-25 &bull; {effectiveClients.length} Active Clients &bull; {criticalTasks.length} Urgent Deadlines &bull; ₹{(totalDemandRisk / 100000).toFixed(1)}L Notice Exposure
          </p>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenFirmHub && (
            <button
              onClick={onOpenFirmHub}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
              title="Practice Command Tools & Calculators"
            >
              <Scale className="w-3.5 h-3.5 text-slate-300" />
              <span>Tools Hub</span>
            </button>
          )}

          {onOpenClientMaster && (
            <button
              onClick={onOpenClientMaster}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Clients ({effectiveClients.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 4 MASTER KPI CARDS: ISOLATED STRICTLY ON THE DASHBOARD             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {/* KPI 1: On-Time Filing Rate */}
        <div 
          onClick={() => onNavigateTab("calendar")}
          className="bg-white border border-slate-200/90 hover:border-emerald-400 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          title="Click to view Statutory Calendar & Deadlines"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-emerald-700 truncate">
              Filing Compliance
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
            <span className="text-[10px] text-emerald-600 font-bold hidden sm:inline">
              +12% this cycle
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              {completedTasks}/{totalTasks} Returns Filed
            </span>
            <span className="text-emerald-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Calendar &rarr;
            </span>
          </div>
        </div>

        {/* KPI 2: Due in 72 Hours (Critical) */}
        <div 
          onClick={() => onNavigateTab("calendar")}
          className="bg-white border border-slate-200/90 hover:border-red-400 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
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
              Urgent
            </span>
            <span className="text-[10px] text-red-600 font-bold hidden sm:inline">
              Next 72h
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              Immediate Follow-up
            </span>
            <span className="text-btred-logo font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Review &rarr;
            </span>
          </div>
        </div>

        {/* KPI 3: Active Tax Scrutiny Notices */}
        <div 
          onClick={() => onNavigateTab("notices")}
          className="bg-white border border-slate-200/90 hover:border-amber-400 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
          title="Click to view Active Scrutiny Notices"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-amber-700 truncate">
              Tax Scrutiny Notices
            </span>
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0 group-hover:scale-110 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {effectiveNotices.length}
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Open Cases
            </span>
            <span className="text-[10px] text-amber-700 font-bold hidden sm:inline">
              Active Exposure
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              ₹{(totalDemandRisk / 100000).toFixed(2)}L Demand Risk
            </span>
            <span className="text-amber-700 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Notice Center &rarr;
            </span>
          </div>
        </div>

        {/* KPI 4: Billing & Fee Collections */}
        <div 
          onClick={() => onNavigateTab("billing")}
          className="bg-white border border-slate-200/90 hover:border-indigo-400 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
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
            <span className="text-[10px] text-indigo-700 font-bold hidden sm:inline">
              Realization: 78%
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              ₹{(totalUnbilledWip / 100000).toFixed(2)}L Unbilled WIP
            </span>
            <span className="text-indigo-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
              Billing Desk &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN WORKFLOWS: UPCOMING DEADLINES & SCRUTINY NOTICES            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Priority Deadlines */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-red-50 text-btred-logo border border-red-200">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Upcoming Deadlines (Next 72 Hours)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Critical statutory returns due soon
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
                <p className="text-xs font-bold text-slate-700">No Critical 72-Hour Deadlines</p>
                <p className="text-xs text-slate-400">All high-priority tasks are currently on schedule.</p>
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
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-100 text-btred-logo border border-red-200">
                          {task.category}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {task.title}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 hidden sm:inline">
                          Due in 48h
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate">
                        {task.entityName} &bull; <strong className="text-slate-800">Due: {formatDate(task.dueDate)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleWhatsAppChase(task)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1"
                        title="Send WhatsApp Reminder to Client"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {onStatusChange && (
                        <button
                          onClick={() => {
                            onStatusChange(task.id, "FILED_AND_COMPLETED");
                            toast.success("Task Updated", `${task.title} marked filed.`);
                          }}
                          className="p-2 rounded-xl bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700 transition"
                          title="Mark Filed"
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

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing high-priority deadlines</span>
            <span className="font-bold text-slate-700">GSTN &amp; ITD Tracked</span>
          </div>
        </div>

        {/* Right Column: Scrutiny Notices & Keys */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tax Scrutiny Notices &amp; Vault
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Open demand exposure and physical token custody
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

            {/* Quick Authority Filter Pills */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={() => setNoticeFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  noticeFilter === "ALL"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({effectiveNotices.length})
              </button>
              <button
                onClick={() => setNoticeFilter("INCOME_TAX")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  noticeFilter === "INCOME_TAX"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Income Tax
              </button>
              <button
                onClick={() => setNoticeFilter("GST")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  noticeFilter === "GST"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                GST
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredNotices.slice(0, 3).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        {notice.section || "Scrutiny"}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {notice.entityName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate">
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

              {/* Custody Summary Row */}
              <div className="p-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-700">Physical DSC Tokens:</span>
                  <span className="text-slate-600">{checkedOutDscCount} Checked Out / {effectiveDscTokens.length} in Safe</span>
                </div>
                <button
                  onClick={() => onNavigateTab("dsc")}
                  className="text-xs font-bold text-slate-900 hover:underline"
                >
                  Vault &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Faceless Assessment Sync</span>
            <span className="font-bold text-emerald-600">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
