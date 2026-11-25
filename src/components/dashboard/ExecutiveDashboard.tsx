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
  SANDBOX_GROUPS
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
  Users, 
  MessageSquare
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
  onNavigateTab,
  onStatusChange,
  isSandbox = false
}) => {
  // Only use SANDBOX fallback data when explicitly in sandbox mode; live mode shows real counts
  const effectiveTasks = useMemo(() => (isSandbox && tasks.length === 0 ? SANDBOX_TASKS : tasks), [isSandbox, tasks]);
  const effectiveInvoices = useMemo(() => (isSandbox && invoices.length === 0 ? SANDBOX_INVOICES : invoices), [isSandbox, invoices]);
  const effectiveNotices = useMemo(() => (isSandbox && notices.length === 0 ? SANDBOX_NOTICES : notices), [isSandbox, notices]);
  const effectiveClients = useMemo(() => (isSandbox && clients.length === 0 ? SANDBOX_CLIENTS : clients), [isSandbox, clients]);
  const effectiveGroups = useMemo(() => (isSandbox && groups.length === 0 ? SANDBOX_GROUPS : groups), [isSandbox, groups]);

  // Filters for operational lists
  const [noticeFilter, setNoticeFilter] = useState<"ALL" | "INCOME_TAX" | "GST">("ALL");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<"ALL" | "GST" | "TAX_AUDIT" | "ROC_MCA">("ALL");

  // 1. KPI Calculations (Accurate dynamic data)
  const totalTasks = effectiveTasks.length;
  const completedTasks = effectiveTasks.filter((t) => t.status === "FILED_AND_COMPLETED").length;
  const filingRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  const criticalTasks = useMemo(() => {
    return effectiveTasks.filter(
      (t) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
    );
  }, [effectiveTasks]);

  // Overdue count
  const overdueTasksCount = useMemo(() => {
    const now = new Date().getTime();
    return criticalTasks.filter((t) => {
      try {
        return new Date(t.dueDate).getTime() < now;
      } catch {
        return false;
      }
    }).length;
  }, [criticalTasks]);

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

  // Filtered tasks by department
  const filteredCriticalTasks = useMemo(() => {
    if (taskCategoryFilter === "ALL") return criticalTasks;
    return criticalTasks.filter((t) => {
      if (taskCategoryFilter === "GST") return t.category === "GST";
      if (taskCategoryFilter === "TAX_AUDIT") return t.category === "TAX_AUDIT" || t.category === "INCOME_TAX" || t.category === "TDS";
      if (taskCategoryFilter === "ROC_MCA") return t.category === "ROC_MCA" || t.category === "TRANSFER_PRICING";
      return true;
    });
  }, [criticalTasks, taskCategoryFilter]);

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

  // Team Workload Breakdown for Managing Partner
  const teamWorkload = useMemo(() => {
    const staffList = [
      { name: "CA Gunjan Jain", shortName: "CA Gunjan", role: "Managing Partner (FCA)" },
      { name: "Kriti Jain", shortName: "Kriti", role: "Team Associate (Article Trainee)" }
    ];

    return staffList.map((member) => {
      const memberTasks = effectiveTasks.filter((t) => {
        const assigned = (t.assignedTo || "").toLowerCase();
        return assigned.includes(member.shortName.toLowerCase()) || assigned.includes(member.name.toLowerCase());
      });
      const critical = memberTasks.filter((t) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED").length;
      const done = memberTasks.filter((t) => t.status === "FILED_AND_COMPLETED").length;
      return {
        ...member,
        total: memberTasks.length,
        critical,
        done
      };
    });
  }, [effectiveTasks]);

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

  const getDeadlineBadge = (dueDateStr: string) => {
    try {
      const due = new Date(dueDateStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">Overdue</span>;
      }
      if (diffDays === 0) {
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">Due Today</span>;
      }
      if (diffDays <= 2) {
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Due in {diffDays}d</span>;
      }
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{formatDate(dueDateStr)}</span>;
    } catch {
      return null;
    }
  };

  const getWorkflowStageBadge = (status: WorkflowStatus) => {
    switch (status) {
      case "DOCUMENTS_AWAITED":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Docs Awaited</span>;
      case "IN_PREPARATION":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">In Prep</span>;
      case "MANAGER_REVIEW":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">In Review</span>;
      case "PARTNER_SIGN_OFF":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Ready to File</span>;
      case "FILED_AND_COMPLETED":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">Filed</span>;
      default:
        return null;
    }
  };

  const getNoticeUrgencyBadge = (deadlineStr: string) => {
    try {
      const due = new Date(deadlineStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">Time-Barred</span>;
      }
      if (diffDays <= 3) {
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">Reply in {diffDays}d</span>;
      }
      if (diffDays <= 7) {
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Reply in {diffDays}d</span>;
      }
      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{diffDays}d left</span>;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. CLEAN EXECUTIVE HEADER                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Firm compliance radar, urgent filing deadlines, and department scrutiny notices.
          </p>
        </div>

        {/* Quick Jump Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab("calendar")}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            title="View Statutory Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span>Statutory Calendar</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 4 MASTER KPI CARDS                                                 */}
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
              {completedTasks}/{totalTasks} Done
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              {totalTasks - completedTasks} returns in pipeline
            </span>
            <span className="text-emerald-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition shrink-0 ml-1">
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
              Urgent Deadlines
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
              Next 72 Hours
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              {overdueTasksCount > 0 ? (
                <span className="text-red-600 font-bold">{overdueTasksCount} overdue</span>
              ) : (
                "All on schedule"
              )}
            </span>
            <span className="text-btred-logo font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition shrink-0 ml-1">
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
              Notice Exposure
            </span>
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0 group-hover:scale-110 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              ₹{(totalDemandRisk / 100000).toFixed(2)}L
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {effectiveNotices.length} Notices
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              Income Tax &amp; GST risk
            </span>
            <span className="text-amber-700 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition shrink-0 ml-1">
              Notices &rarr;
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
              Pending Fees
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
              {pendingInvoices.length} Invoices
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              + ₹{(totalUnbilledWip / 100000).toFixed(2)}L WIP
            </span>
            <span className="text-indigo-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition shrink-0 ml-1">
              Billing &rarr;
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
                    Upcoming Statutory Deadlines
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Filings requiring immediate attention
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab("calendar")}
                className="text-xs font-bold text-btred-logo hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>All Deadlines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <button
                onClick={() => setTaskCategoryFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  taskCategoryFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({criticalTasks.length})
              </button>
              <button
                onClick={() => setTaskCategoryFilter("GST")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  taskCategoryFilter === "GST"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                GST
              </button>
              <button
                onClick={() => setTaskCategoryFilter("TAX_AUDIT")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  taskCategoryFilter === "TAX_AUDIT"
                    ? "bg-blue-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Income Tax &amp; Audit
              </button>
              <button
                onClick={() => setTaskCategoryFilter("ROC_MCA")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  taskCategoryFilter === "ROC_MCA"
                    ? "bg-amber-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                ROC / MCA
              </button>
            </div>

            {filteredCriticalTasks.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Critical Deadlines</p>
                <p className="text-xs text-slate-400">All high-priority tasks in this category are on schedule.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredCriticalTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-100 text-btred-logo border border-red-200">
                          {task.category}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {task.title}
                        </span>
                        {getDeadlineBadge(task.dueDate)}
                        {getWorkflowStageBadge(task.status)}
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate">
                        {task.entityName} &bull; <span className="text-slate-500 font-normal">Assigned:</span> <strong className="text-slate-800">{task.assignedTo || "Article Trainee"}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.status === "DOCUMENTS_AWAITED" && (
                        <button
                          onClick={() => handleWhatsAppChase(task)}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Send WhatsApp Reminder to Client"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      )}

                      {onStatusChange && (
                        <button
                          onClick={() => {
                            onStatusChange(task.id, "FILED_AND_COMPLETED");
                            toast.success("Task Updated", `${task.title} marked filed.`);
                          }}
                          className="p-2 rounded-xl bg-slate-200 hover:bg-emerald-600 hover:text-white text-slate-700 transition cursor-pointer"
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
        </div>

        {/* Right Column: Scrutiny Notices */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tax Scrutiny Notices &amp; Defense
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Department queries, demand risks &amp; reply deadlines
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab("notices")}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Notice Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Authority Filter Pills */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={() => setNoticeFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  noticeFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All ({effectiveNotices.length})
              </button>
              <button
                onClick={() => setNoticeFilter("INCOME_TAX")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  noticeFilter === "INCOME_TAX"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Income Tax
              </button>
              <button
                onClick={() => setNoticeFilter("GST")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  noticeFilter === "GST"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                GST
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredNotices.slice(0, 4).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        {notice.section || "Scrutiny"}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {notice.entityName}
                      </span>
                      {getNoticeUrgencyBadge(notice.statutoryDeadline)}
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate">
                      {notice.authority.replace("_", " ")} &bull; <strong className="text-btred-logo">Demand: ₹{(notice.demandAmount / 100000).toFixed(2)}L</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Reply Deadline: <strong>{formatDate(notice.statutoryDeadline)}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigateTab("notice-drafter")}
                    className="px-2.5 py-1.5 rounded-xl bg-btred-logo hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>Draft Reply</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TEAM CAPACITY & WORKLOAD (HIGH VALUE FOR CA MANAGING PARTNER)          */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Team Workload &amp; Capacity
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Active task distribution across staff and article trainees
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("tasks-matrix")}
            className="text-xs font-bold text-slate-700 hover:text-slate-950 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Task Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {teamWorkload.map((staff) => (
            <div 
              key={staff.name} 
              onClick={() => onNavigateTab("tasks-matrix")}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-2xl p-2.5 space-y-1.5 cursor-pointer transition"
              title={`${staff.name} (${staff.role}): ${staff.total} total tasks, ${staff.critical} critical, ${staff.done} completed`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 truncate">
                  {staff.shortName}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  staff.critical > 0 
                    ? "bg-red-100 text-red-700 border border-red-200" 
                    : "bg-slate-200/70 text-slate-700"
                }`}>
                  {staff.total} tasks
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Critical: <strong className={staff.critical > 0 ? "text-red-600 font-bold" : "text-slate-700"}>{staff.critical}</strong></span>
                <span>Done: <strong className="text-emerald-600 font-bold">{staff.done}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
