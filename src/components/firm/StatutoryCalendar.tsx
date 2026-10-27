"use client";

import React, { useState } from "react";
import { ComplianceTask, WorkflowStatus, ClientGroup, ClientEntity } from "@/lib/types";
import { INITIAL_GROUPS } from "@/lib/data/mockData";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  ArrowRight, 
  UserCheck, 
  Search, 
  Building2, 
  Send, 
  Zap, 
  ShieldAlert, 
  Clock, 
  Check, 
  Layers,
  Sparkles,
  Smartphone,
  X,
  Users
} from "lucide-react";
import { MagicLinkUploadModal } from "@/components/client/MagicLinkUploadModal";

interface StatutoryCalendarProps {
  tasks: ComplianceTask[];
  clients?: ClientEntity[];
  groups?: ClientGroup[];
  onStatusChange: (taskId: string, newStatus: WorkflowStatus) => void;
  onAddTask?: (taskData: Partial<ComplianceTask>) => void;
}

const STATUS_COLUMNS: { key: WorkflowStatus; label: string; badgeColor: string }[] = [
  { key: "DOCUMENTS_AWAITED", label: "Client Docs Awaited", badgeColor: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "IN_PREPARATION", label: "In Prep (Article / Staff)", badgeColor: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "MANAGER_REVIEW", label: "Senior / Manager Review", badgeColor: "bg-purple-100 text-purple-800 border-purple-300" },
  { key: "PARTNER_SIGN_OFF", label: "Partner Final Sign-off", badgeColor: "bg-red-100 text-btred-logo border-red-300" },
  { key: "FILED_AND_COMPLETED", label: "Filed & Acknowledged", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300" },
];

export const getDueStatus = (dueDateStr: string, status: WorkflowStatus) => {
  if (status === "FILED_AND_COMPLETED") {
    return { text: "Filed", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) {
    return { text: `Overdue ${Math.abs(diffDays)}d`, color: "bg-red-100 text-red-800 border-red-300 font-extrabold" };
  } else if (diffDays === 0) {
    return { text: "Due Today", color: "bg-red-600 text-white font-extrabold animate-pulse" };
  } else if (diffDays <= 3) {
    return { text: `Due in ${diffDays}d`, color: "bg-amber-100 text-amber-900 border-amber-300 font-bold" };
  } else {
    return { text: `Due in ${diffDays}d`, color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

export const StatutoryCalendar: React.FC<StatutoryCalendarProps> = ({ tasks, clients = [], groups = [], onStatusChange, onAddTask }) => {
  const effectiveGroups = (groups && groups.length > 0) ? groups : INITIAL_GROUPS;
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"kanban" | "family-groups">("kanban");
  const [mobileKanbanStage, setMobileKanbanStage] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNudgeToast, setActiveNudgeToast] = useState<{ entity: string; task: string; link: string } | null>(null);
  const [bulkChaseProgress, setBulkChaseProgress] = useState(false);
  const [bulkChaseSuccess, setBulkChaseSuccess] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simEntityName, setSimEntityName] = useState("");
  const [simTaskTitle, setSimTaskTitle] = useState("");

  // New Engagement Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEntity, setNewTaskEntity] = useState(() => clients[0]?.name || "");
  const [newTaskCategory, setNewTaskCategory] = useState<ComplianceTask["category"]>("GST");
  const [newTaskPeriod, setNewTaskPeriod] = useState("October 2026");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-11-20");

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const matchedClient = clients.find(c => c.name === newTaskEntity) || clients[0];
    const finalEntityName = newTaskEntity.trim() || matchedClient?.name || "Client Entity";
    const finalEntityId = matchedClient?.id || "CLI-001";
    const finalGroupId = matchedClient?.groupId || "GRP-001";

    const payload: Partial<ComplianceTask> = {
      title: newTaskTitle.trim(),
      entityId: finalEntityId,
      entityName: finalEntityName,
      groupId: finalGroupId,
      category: newTaskCategory,
      period: newTaskPeriod,
      dueDate: newTaskDueDate,
      status: "DOCUMENTS_AWAITED",
      assignedTo: "Kriti Jain (Article)",
      reviewedBy: "CA Gunjan Jain",
      priority: "HIGH",
      penaltyRisk: 10000,
      accruingDailyPenalty: 50,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Statutory Vouchers & Invoices"],
    };

    if (onAddTask) {
      onAddTask(payload);
    } else {
      try {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error(err);
      }
    }

    toast.success(
      "Compliance Task Scheduled",
      `"${payload.title}" created for ${payload.entityName}. Assigned to Kriti Jain.`
    );

    setIsAddTaskOpen(false);
    setNewTaskTitle("");
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
    const matchesGroup = selectedGroupId === "ALL" || t.groupId === selectedGroupId;
    const matchesSearch =
      t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.arnNumber && t.arnNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesGroup && matchesSearch;
  });

  const totalMissingDocs = tasks.reduce((sum, t) => sum + (t.missingDocumentsCount || 0), 0);
  const totalAccruingDaily = tasks
    .filter((t) => t.status !== "FILED_AND_COMPLETED")
    .reduce((sum, t) => sum + (t.accruingDailyPenalty || 0), 0);
  const totalPenaltyExposure = tasks
    .filter((t) => t.status !== "FILED_AND_COMPLETED")
    .reduce((sum, t) => sum + t.penaltyRisk, 0);

  const triggerSingleWhatsAppChase = (task: ComplianceTask) => {
    if (!task) return;
    openWhatsAppPreset("919820044101", "DOC_CHASE", {
      clientName: task.entityName,
      serviceName: task.title,
      period: task.period,
      deadline: formatDate(task.dueDate),
      missingDocs: task.missingDocumentsList || ["Pending financial statements and vouchers"],
    });

    setActiveNudgeToast({
      entity: task.entityName,
      task: task.title,
      link: "https://ca.naturexpress.in/",
    });
    toast.info(
      "WhatsApp Reminder Dispatched",
      `Document chase sent to ${task.entityName} authorized signatory.`
    );
    setTimeout(() => {
      setActiveNudgeToast(null);
    }, 6000);
  };

  const handleBulkChase = () => {
    setBulkChaseProgress(true);
    setTimeout(() => {
      setBulkChaseProgress(false);
      setBulkChaseSuccess(true);
      setTimeout(() => setBulkChaseSuccess(false), 5000);
    }, 1800);
  };

  return (
    <div className="space-y-4">
      {/* Real-time Enterprise Penalty & Daily Accrual Radar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-black text-white p-5 rounded-3xl shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-500/20 text-red-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-red-500/40 flex items-center gap-1">
              <Zap className="w-3 h-3 text-red-400" />
              Real-Time Penalty Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">Monitoring {tasks.length} Active Obligations</span>
          </div>
          <h2 className="text-lg md:text-xl font-black mt-1 tracking-tight text-white flex items-center gap-2">
            Statutory Compliance Radar &amp; WhatsApp Chase Engine
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Auto-calculates daily accruing statutory fines (₹50/day GST, 234F &amp; 271B audit exposure) and triggers zero-password WhatsApp magic links.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-2xl text-right">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Daily Accruing Risk</span>
            <span className="text-xl font-black text-red-400">₹{totalAccruingDaily.toLocaleString()}/day</span>
          </div>
          <button
            onClick={handleBulkChase}
            disabled={bulkChaseProgress || totalMissingDocs === 0}
            className="flex-1 md:flex-initial bg-btred-logo hover:bg-btred-700 text-white text-xs font-black px-4 py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {bulkChaseProgress ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Chasing {tasks.filter(t => t.missingDocumentsCount > 0).length} Clients...
              </>
            ) : bulkChaseSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Dispatched WhatsApp Nudges!
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Auto-Chase Missing Docs ({totalMissingDocs})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification for WhatsApp Magic Link Dispatch */}
      {activeNudgeToast && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <p className="text-xs font-black text-white">
                WhatsApp Nudge Dispatched to {activeNudgeToast.entity}
              </p>
            </div>
            <p className="text-[11px] text-emerald-300">
              Generated direct zero-password magic link for missing docs:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <code className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-emerald-400 font-mono select-all">
                {activeNudgeToast.link}
              </code>
              <button
                onClick={() => {
                  setSimEntityName(activeNudgeToast.entity);
                  setSimTaskTitle(activeNudgeToast.task);
                  setSimModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-sm"
              >
                <Smartphone className="w-3 h-3" />
                Simulate Client Mobile Screen
              </button>
            </div>
          </div>
          <button
            onClick={() => setActiveNudgeToast(null)}
            className="text-xs text-emerald-400 hover:text-white font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Header Bar (White Theme) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3 overflow-hidden max-w-full min-w-0">
        {/* Top Control Bar: Group Switcher & View Mode */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Family Group Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto min-w-0 max-w-full">
            <Building2 className="w-4 h-4 text-btred-logo shrink-0" />
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap shrink-0">Business Group:</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-btred-logo flex-1 min-w-0 max-w-full truncate"
            >
              <option value="ALL">All Business Groups ({INITIAL_GROUPS.length} Groups)</option>
              {INITIAL_GROUPS.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name} ({grp.totalEntities} entities &bull; ₹{grp.totalTurnoverCr}Cr)
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Kanban Matrix vs Family Groups Rollup */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 rounded-xl transition ${
                viewMode === "kanban" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Statutory Kanban ({filteredTasks.length})
            </button>
            <button
              onClick={() => setViewMode("family-groups")}
              className={`px-3 py-1 rounded-xl transition ${
                viewMode === "family-groups" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Promoter Group Rollup ({INITIAL_GROUPS.length})
            </button>
          </div>
        </div>

        {/* Category Pills & Instant Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 max-w-full min-w-0">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none min-w-0 max-w-full touch-pan-x">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-btred-logo" />
              Category:
            </span>
            {["ALL", "GST", "INCOME_TAX", "TAX_AUDIT", "TDS", "ROC_MCA"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-btblack text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <div className="w-full md:w-64 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by PAN, Company, ARN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-800 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-btred-logo font-medium"
              />
            </div>
            <button
              onClick={() => setIsAddTaskOpen(true)}
              className="bg-btblack hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <span>+ Engagement</span>
            </button>
          </div>
        </div>

        {/* Quarterly TDS 24Q/26Q/27Q & Challan 281 Deposit Radar */}
        {(selectedCategory === "TDS" || selectedCategory === "ALL") && (
          <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Quarterly TDS Radar (Forms 24Q, 26Q, 27Q &amp; Challan 281)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Section 200(3) &amp; Rule 31A &bull; Late filing fee: ₹200/day u/s 234E
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Q1 (Apr - Jun)</div>
                <div className="font-bold text-white mt-0.5">Due: 31st July</div>
                <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Form 24Q / 26Q</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Q2 (Jul - Sep)</div>
                <div className="font-bold text-white mt-0.5">Due: 31st October</div>
                <div className="text-[10px] text-amber-400 font-medium mt-0.5">Statutory Cutoff</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Q3 (Oct - Dec)</div>
                <div className="font-bold text-white mt-0.5">Due: 31st January</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Regular Quarter</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Challan 281 Deposit</div>
                <div className="font-bold text-white mt-0.5">7th of Every Month</div>
                <div className="text-[10px] text-blue-400 font-medium mt-0.5">1.5% interest u/s 201(1A)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: FAMILY GROUP ROLLUP */}
      {viewMode === "family-groups" && (
        effectiveGroups.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Client Groups Enrolled Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your practice database has been initialized clean with 0 dummy records. Use <strong>+ New Engagement</strong> or <strong>Client Master</strong> to onboard your clients.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {effectiveGroups.map((grp) => {
            const groupTasks = tasks.filter((t) => t.groupId === grp.id);
            const groupMissingDocs = groupTasks.reduce((s, t) => s + (t.missingDocumentsCount || 0), 0);
            const groupExposure = groupTasks
              .filter((t) => t.status !== "FILED_AND_COMPLETED")
              .reduce((s, t) => s + t.penaltyRisk, 0);

            return (
              <div
                key={grp.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 hover:border-slate-400 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Promoter Family Group
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">{grp.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">Promoter: {grp.promoterName}</p>
                  </div>
                  <span className="bg-slate-100 text-slate-800 text-xs font-black px-2.5 py-1 rounded-xl">
                    {grp.totalEntities} Entities
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Combined Turnover</span>
                    <span className="font-black text-slate-900 text-sm">₹{grp.totalTurnoverCr} Cr</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Retainers</span>
                    <span className="font-black text-btred-logo text-sm">{formatCurrencyINR(grp.overdueFeesTotal)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Active Compliance Filings:</span>
                    <strong className="text-slate-900">{groupTasks.length} Filings</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Missing Documents:</span>
                    <strong className={groupMissingDocs > 0 ? "text-amber-600" : "text-emerald-600"}>
                      {groupMissingDocs} Pending
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Penalty Exposure:</span>
                    <strong className="text-btred-logo">{formatCurrencyINR(groupExposure)}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedGroupId(grp.id);
                      setViewMode("kanban");
                    }}
                    className="text-xs font-black text-btblack hover:text-btred-logo flex items-center gap-1 transition"
                  >
                    View Group Tasks <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const sampleTask = groupTasks[0] || tasks[0];
                      triggerSingleWhatsAppChase(sampleTask);
                    }}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    WhatsApp Promoter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* VIEW MODE 2: KANBAN BOARD */}
      {viewMode === "kanban" && (
        <div className="space-y-3">
          {/* Mobile Kanban Stage Pill Selector (Visible on mobile, hidden on md+) */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 touch-pan-x">
            <button
              onClick={() => setMobileKanbanStage("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap shrink-0 ${
                mobileKanbanStage === "ALL" ? "bg-btblack text-white shadow-sm" : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              All Stages ({filteredTasks.length})
            </button>
            {STATUS_COLUMNS.map((col) => {
              const count = filteredTasks.filter((t) => t.status === col.key).length;
              return (
                <button
                  key={col.key}
                  onClick={() => setMobileKanbanStage(col.key)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    mobileKanbanStage === col.key
                      ? "bg-btblack text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  <span>{col.label.split(" ")[0]}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
            {STATUS_COLUMNS
              .filter((col) => mobileKanbanStage === "ALL" || col.key === mobileKanbanStage)
              .map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.key);

                return (
                  <div
                    key={col.key}
                    className="bg-white border border-slate-200 rounded-3xl p-3.5 shadow-sm min-h-[300px] md:min-h-[500px] flex flex-col"
                  >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${col.badgeColor}`}>
                    {col.label}
                  </span>
                  <span className="bg-slate-100 text-slate-800 text-xs font-extrabold px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 font-medium">
                      No active returns in this stage
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-slate-50 border border-slate-200 hover:border-btred-logo p-3.5 rounded-2xl shadow-sm transition-all group hover:shadow-md"
                      >
                        {/* Priority & Category Badge */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                            {task.category}
                          </span>
                          {task.priority === "CRITICAL" && (
                            <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-btred-logo border border-red-200">
                              <AlertTriangle className="w-3 h-3" />
                              CRITICAL
                            </span>
                          )}
                        </div>

                        {/* Client Name & Return Title */}
                        <h4 className="text-xs font-black text-slate-900 group-hover:text-btred-logo transition line-clamp-1">
                          {task.entityName}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium mt-1 line-clamp-2">
                          {task.title}
                        </p>

                        {/* Period, Due Date & Dynamic Relative Countdown Badge */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-1">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3 h-3 text-btred-logo" />
                            Due: <strong className="text-slate-900">{formatDate(task.dueDate)}</strong>
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {(() => {
                              const badge = getDueStatus(task.dueDate, task.status);
                              return (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.color}`}>
                                  {badge.text}
                                </span>
                              );
                            })()}
                            <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-700">
                              {task.period}
                            </span>
                          </div>
                        </div>

                        {/* Missing Documents Warning with 1-Click WhatsApp Trigger */}
                        {task.missingDocumentsCount > 0 && (
                          <div className="mt-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] p-2 rounded-xl space-y-1 font-medium">
                            <div className="flex items-center justify-between font-bold">
                              <span>{task.missingDocumentsCount} docs missing</span>
                              <button
                                onClick={() => triggerSingleWhatsAppChase(task)}
                                className="text-btred-logo font-black hover:underline flex items-center gap-0.5"
                              >
                                <Send className="w-2.5 h-2.5" />
                                WhatsApp Chase ({task.chaseCount})
                              </button>
                            </div>
                            {task.missingDocumentsList && task.missingDocumentsList.length > 0 && (
                              <p className="text-[10px] text-slate-600 truncate">
                                &bull; {task.missingDocumentsList[0]}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Daily Penalties Exposure */}
                        {task.penaltyRisk > 0 && task.status !== "FILED_AND_COMPLETED" && (
                          <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-btred-logo bg-red-50/70 p-1.5 rounded-lg border border-red-100">
                            <span>Risk: {formatCurrencyINR(task.penaltyRisk)}</span>
                            {task.accruingDailyPenalty > 0 && (
                              <span className="text-[9px] text-slate-600 font-semibold">
                                +₹{task.accruingDailyPenalty}/day late fee
                              </span>
                            )}
                          </div>
                        )}

                        {/* Assignee & Action */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 flex items-center gap-1 text-[11px] font-semibold truncate max-w-[120px]">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            {task.assignedTo.split(" ")[0]}
                          </span>

                          {task.status !== "FILED_AND_COMPLETED" ? (
                            <button
                              onClick={() => {
                                const nextStatusMap: Record<WorkflowStatus, WorkflowStatus> = {
                                  DOCUMENTS_AWAITED: "IN_PREPARATION",
                                  IN_PREPARATION: "MANAGER_REVIEW",
                                  MANAGER_REVIEW: "PARTNER_SIGN_OFF",
                                  PARTNER_SIGN_OFF: "FILED_AND_COMPLETED",
                                  FILED_AND_COMPLETED: "FILED_AND_COMPLETED",
                                };
                                onStatusChange(task.id, nextStatusMap[task.status]);
                              }}
                              className="flex items-center gap-1 text-[11px] font-black text-white bg-btred-logo hover:bg-btred-700 px-2.5 py-1 rounded-lg transition shadow-sm"
                            >
                              Advance
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ARN Synced
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

      {/* Zero-Password Client Magic Link Simulator Modal */}
      <MagicLinkUploadModal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        entityName={simEntityName}
        taskTitle={simTaskTitle}
      />

      {/* Add New Engagement Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95"
          >
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
              New Statutory Compliance Engagement
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Engagement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October 2026 GSTR-3B & 1 Filing"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Entity *</label>
                {clients.length > 0 ? (
                  <select
                    required
                    value={newTaskEntity}
                    onChange={(e) => setNewTaskEntity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Select Client Entity --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} (PAN: {c.pan})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={newTaskEntity}
                    onChange={(e) => setNewTaskEntity(e.target.value)}
                    placeholder="e.g. Pratwi Solutions Private Limited"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
                  >
                    <option value="GST">GST</option>
                    <option value="INCOME_TAX">Income Tax</option>
                    <option value="TAX_AUDIT">Tax Audit (3CD)</option>
                    <option value="TDS">TDS & TCS</option>
                    <option value="ROC_MCA">ROC & MCA</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Statutory Period</label>
                  <input
                    type="text"
                    value={newTaskPeriod}
                    onChange={(e) => setNewTaskPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-btblack hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl transition"
              >
                Create Engagement
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
