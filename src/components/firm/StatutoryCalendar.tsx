"use client";

import React, { useState, useMemo } from "react";
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
  Users,
  FileCheck2,
  FileText,
  KeyRound,
  Download,
  Share2,
  Lock,
  ExternalLink
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
  { key: "IN_PREPARATION", label: "In Prep (Article / Staff)", badgeColor: "bg-red-50 text-btred-logo border-red-200" },
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
    return { text: `Due in ${diffDays}d`, color: "bg-slate-100 text-slate-700 border-slate-200 font-medium" };
  }
};

export const StatutoryCalendar: React.FC<StatutoryCalendarProps> = ({ 
  tasks, 
  clients = [], 
  groups = [], 
  onStatusChange, 
  onAddTask 
}) => {
  // Dynamically compute effective business groups to prevent (0 Groups) bug in both Sandbox and Live CA Firm environments
  const effectiveGroups = useMemo(() => {
    if (groups && groups.length > 0) return groups;
    if (clients && clients.length > 0) {
      const groupMap = new Map<string, ClientGroup>();
      clients.forEach((c) => {
        const gId = c.groupId || "GRP-DIRECT";
        const gName = c.groupName || (c.groupId ? c.name : "Direct Practice Clients");
        if (!groupMap.has(gId)) {
          groupMap.set(gId, {
            id: gId,
            name: gName,
            promoterName: c.primaryContact?.name || "Authorized Signatory",
            promoterPhone: c.primaryContact?.phone || "+91 98000 00000",
            promoterEmail: c.primaryContact?.email || "signatory@practice.in",
            totalEntities: 0,
            totalTurnoverCr: 0,
            unbilledWipTotal: 0,
            overdueFeesTotal: 0,
            entityIds: []
          });
        }
        const g = groupMap.get(gId)!;
        g.totalEntities += 1;
        g.totalTurnoverCr = +(g.totalTurnoverCr + (c.turnoverCr || 0)).toFixed(1);
        g.entityIds.push(c.id);
      });
      return Array.from(groupMap.values());
    }
    return INITIAL_GROUPS;
  }, [groups, clients]);

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

  // Enterprise Workflow Modal States
  const [gatedTaskWarning, setGatedTaskWarning] = useState<ComplianceTask | null>(null);
  const [partnerSignOffModalTask, setPartnerSignOffModalTask] = useState<ComplianceTask | null>(null);
  const [viewAckModalTask, setViewAckModalTask] = useState<ComplianceTask | null>(null);
  const [signOffUdin, setSignOffUdin] = useState("");
  const [signOffDscPin, setSignOffDscPin] = useState("••••");

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
      penaltyRisk: newTaskCategory === "GST" ? 50 : 5000,
      accruingDailyPenalty: newTaskCategory === "GST" ? 50 : 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Statutory Vouchers & Invoices"],
      pan: matchedClient?.pan,
      gstin: matchedClient?.gstin,
      clientApprovalStatus: "PENDING"
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
      (t.pan && t.pan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.gstin && t.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.arnNumber && t.arnNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.challanCin && t.challanCin.toLowerCase().includes(searchQuery.toLowerCase()));
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

  // Safe Workflow Advance Handler with State-Machine Validation
  const handleAdvanceTask = (task: ComplianceTask) => {
    if (task.status === "DOCUMENTS_AWAITED" && task.missingDocumentsCount > 0) {
      setGatedTaskWarning(task);
      return;
    }

    if (task.status === "PARTNER_SIGN_OFF") {
      setPartnerSignOffModalTask(task);
      setSignOffUdin(task.officialUdin || (task.category === "TAX_AUDIT" ? "26022998BTA" + Math.floor(100000 + Math.random() * 900000) : ""));
      return;
    }

    const nextStatusMap: Record<WorkflowStatus, WorkflowStatus> = {
      DOCUMENTS_AWAITED: "IN_PREPARATION",
      IN_PREPARATION: "MANAGER_REVIEW",
      MANAGER_REVIEW: "PARTNER_SIGN_OFF",
      PARTNER_SIGN_OFF: "FILED_AND_COMPLETED",
      FILED_AND_COMPLETED: "FILED_AND_COMPLETED",
    };
    onStatusChange(task.id, nextStatusMap[task.status]);
  };

  const confirmPartnerSignOffFiling = () => {
    if (!partnerSignOffModalTask) return;
    onStatusChange(partnerSignOffModalTask.id, "FILED_AND_COMPLETED");
    toast.success(
      "Return Digitally Signed & Filed",
      `${partnerSignOffModalTask.title} for ${partnerSignOffModalTask.entityName} authenticated via DSC & synced with Govt Portal.`
    );
    setPartnerSignOffModalTask(null);
  };

  return (
    <div className="space-y-4">
      {/* Real-time Enterprise Penalty & Daily Accrual Radar (High-Contrast Theme) */}
      <div className="bg-gradient-to-r from-red-50/90 via-white to-amber-50/40 text-slate-900 p-5 rounded-3xl shadow-sm border border-red-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-100 text-btred-logo text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-btred-logo" />
              Real-Time Penalty Engine
            </span>
            <span className="text-xs text-slate-600 font-semibold">Monitoring {tasks.length} Active Obligations</span>
          </div>
          <h2 className="text-lg md:text-xl font-black mt-1 tracking-tight text-slate-900 flex items-center gap-2">
            Statutory Compliance Radar &amp; WhatsApp Chase Engine
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
            Auto-calculates statutory fines (₹50/day GST u/s 47, Sec 234F ITR cap, Sec 271B audit &amp; MCA late fees) with 1-click WhatsApp document chases.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-right shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Daily Accruing Risk</span>
            <span className="text-xl font-black text-btred-logo">₹{totalAccruingDaily.toLocaleString()}/day</span>
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
                <Check className="w-4 h-4 text-white" />
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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl shadow-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <p className="text-xs font-black text-emerald-950">
                WhatsApp Nudge Dispatched to {activeNudgeToast.entity}
              </p>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">
              Generated direct zero-password magic link for missing docs:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <code className="text-[10px] bg-white border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 font-mono select-all">
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
            className="text-xs text-emerald-700 hover:text-slate-900 font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Header Bar (Clean White Theme) */}
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
              <option value="ALL">All Business Groups ({effectiveGroups.length} Groups)</option>
              {effectiveGroups.map((grp) => (
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
                viewMode === "kanban" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Statutory Kanban ({filteredTasks.length})
            </button>
            <button
              onClick={() => setViewMode("family-groups")}
              className={`px-3 py-1 rounded-xl transition ${
                viewMode === "family-groups" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Promoter Group Rollup ({effectiveGroups.length})
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
                    ? "bg-btred-logo text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <div className="w-full md:w-64 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by PAN, Company, ARN, CIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-800 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-btred-logo font-medium"
              />
            </div>
            <button
              onClick={() => setIsAddTaskOpen(true)}
              className="bg-btred-logo hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <span>+ Engagement</span>
            </button>
          </div>
        </div>

        {/* Quarterly TDS 24Q/26Q/27Q & Challan 281 Deposit Radar (Crystal Clear Contrast) */}
        {(selectedCategory === "TDS" || selectedCategory === "ALL") && (
          <div className="bg-white text-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Quarterly TDS Radar (Forms 24Q, 26Q, 27Q &amp; Challan 281)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Section 200(3) &amp; Rule 31A &bull; Late filing fee: ₹200/day u/s 234E
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-900">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Q1 (Apr - Jun)</div>
                <div className="font-bold text-slate-900 mt-0.5">Due: 31st July</div>
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Form 24Q / 26Q</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-900">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Q2 (Jul - Sep)</div>
                <div className="font-bold text-slate-900 mt-0.5">Due: 31st October</div>
                <div className="text-[10px] text-amber-800 font-medium mt-0.5">Statutory Cutoff</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-900">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Q3 (Oct - Dec)</div>
                <div className="font-bold text-slate-900 mt-0.5">Due: 31st January</div>
                <div className="text-[10px] text-slate-600 font-medium mt-0.5">Regular Quarter</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-900">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Challan 281 Deposit</div>
                <div className="font-bold text-slate-900 mt-0.5">7th of Every Month</div>
                <div className="text-[10px] text-btred-logo font-medium mt-0.5">1.5% interest u/s 201(1A)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: FAMILY GROUP ROLLUP */}
      {viewMode === "family-groups" && (
        effectiveGroups.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Client Groups Enrolled Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your practice database is active. Use <strong>+ Engagement</strong> or <strong>Client Master</strong> to group multi-entity clients.
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
                      <strong className={groupMissingDocs > 0 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
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
                      className="text-xs font-black text-slate-900 hover:text-btred-logo flex items-center gap-1 transition"
                    >
                      View Group Tasks <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const sampleTask = groupTasks[0] || tasks[0];
                        if (sampleTask) triggerSingleWhatsAppChase(sampleTask);
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

      {/* VIEW MODE 2: STATUTORY KANBAN BOARD */}
      {viewMode === "kanban" && (
        <div className="space-y-3">
          {/* Mobile Kanban Stage Pill Selector */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 touch-pan-x">
            <button
              onClick={() => setMobileKanbanStage("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap shrink-0 ${
                mobileKanbanStage === "ALL" ? "bg-btred-logo text-white shadow-sm" : "bg-white text-slate-700 border border-slate-200"
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
                      ? "bg-btred-logo text-white shadow-sm"
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
                    className="bg-white border border-slate-200 rounded-3xl p-3.5 shadow-sm min-h-[320px] md:min-h-[520px] flex flex-col"
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
                        <div className="text-center py-12 text-xs text-slate-500 font-medium">
                          No active returns in this stage
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const matchedClient = clients.find(c => c.id === task.entityId || c.name === task.entityName);
                          const pan = task.pan || matchedClient?.pan;
                          const gstin = task.gstin || matchedClient?.gstin;
                          const tan = task.tan || matchedClient?.tan;

                          return (
                            <div
                              key={task.id}
                              className="bg-slate-50 border border-slate-200 hover:border-btred-logo p-3.5 rounded-2xl shadow-sm transition-all group hover:shadow-md"
                            >
                              {/* Priority & Tax Badges */}
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                                    {task.category.replace("_", " ")}
                                  </span>
                                  {pan && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                                      {pan}
                                    </span>
                                  )}
                                  {gstin && task.category === "GST" && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                      {gstin.slice(0, 2)}...{gstin.slice(-3)}
                                    </span>
                                  )}
                                  {tan && task.category === "TDS" && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                      TAN: {tan}
                                    </span>
                                  )}
                                </div>
                                {task.priority === "CRITICAL" && (
                                  <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-btred-logo border border-red-200 shrink-0">
                                    <AlertTriangle className="w-3 h-3" />
                                    CRITICAL
                                  </span>
                                )}
                              </div>

                              {/* Client Name & Return Title */}
                              <h4 className="text-xs font-black text-slate-900 group-hover:text-btred-logo transition line-clamp-1">
                                {task.entityName}
                              </h4>
                              <p className="text-[11px] text-slate-700 font-semibold mt-0.5 line-clamp-2">
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

                              {/* Net Cash Tax / Challan Payable & Section 50 Interest Indicator */}
                              {task.taxPayableAmount && task.taxPayableAmount > 0 && (
                                <div className="mt-2 bg-slate-100 border border-slate-200 px-2 py-1 rounded-xl flex items-center justify-between text-[10px]">
                                  <span className="text-slate-600 font-semibold">Tax Payable:</span>
                                  <div className="text-right">
                                    <strong className="text-slate-900 font-bold">{formatCurrencyINR(task.taxPayableAmount)}</strong>
                                    {task.section50Interest ? (
                                      <span className="block text-[9px] text-amber-800 font-bold">
                                        +₹{task.section50Interest.toLocaleString()} S.50 Int.
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              )}

                              {/* Assessee Approval Sign-off Status */}
                              {task.clientApprovalStatus && (
                                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500 font-medium">Assessee Sign-off:</span>
                                  <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                    task.clientApprovalStatus === "APPROVED" 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border border-amber-200"
                                  }`}>
                                    {task.clientApprovalStatus === "APPROVED" ? "✓ Draft Approved" : "Awaiting Client Sign-off"}
                                  </span>
                                </div>
                              )}

                              {/* Missing Documents Warning with 1-Click WhatsApp Trigger */}
                              {task.missingDocumentsCount > 0 && (
                                <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] p-2 rounded-xl space-y-1 font-medium">
                                  <div className="flex items-center justify-between font-bold">
                                    <span>{task.missingDocumentsCount} {task.missingDocumentsCount === 1 ? "doc" : "docs"} missing</span>
                                    <button
                                      onClick={() => triggerSingleWhatsAppChase(task)}
                                      className="text-btred-logo font-black hover:underline flex items-center gap-0.5"
                                    >
                                      <Send className="w-2.5 h-2.5" />
                                      WhatsApp Chase ({task.chaseCount})
                                    </button>
                                  </div>
                                  {task.missingDocumentsList && task.missingDocumentsList.length > 0 && (
                                    <p className="text-[10px] text-slate-700 truncate">
                                      &bull; {task.missingDocumentsList[0]}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Statutory Penalties Exposure */}
                              {task.penaltyRisk > 0 && task.status !== "FILED_AND_COMPLETED" && (
                                <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-btred-logo bg-red-50/70 p-1.5 rounded-lg border border-red-100">
                                  <span title={task.penaltyNote || "Statutory Risk Exposure"}>
                                    Risk: {formatCurrencyINR(task.penaltyRisk)}
                                  </span>
                                  {task.accruingDailyPenalty > 0 ? (
                                    <span className="text-[9px] text-slate-600 font-semibold">
                                      +₹{task.accruingDailyPenalty}/day late fee
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 font-normal truncate max-w-[110px]" title={task.penaltyNote}>
                                      {task.penaltyNote || "Flat statutory cap"}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Assignee & Action Buttons */}
                              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                                <span className="text-slate-600 flex items-center gap-1 text-[11px] font-semibold truncate max-w-[120px]">
                                  <UserCheck className="w-3 h-3 text-slate-500" />
                                  {task.assignedTo.split(" ")[0]}
                                </span>

                                {task.status !== "FILED_AND_COMPLETED" ? (
                                  <button
                                    onClick={() => handleAdvanceTask(task)}
                                    className="flex items-center gap-1 text-[11px] font-black text-white bg-btred-logo hover:bg-btred-700 px-2.5 py-1 rounded-lg transition shadow-sm"
                                  >
                                    {task.status === "PARTNER_SIGN_OFF" ? "Sign & File" : "Advance"}
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    {task.category === "INCOME_TAX" && (task.challanCin || task.title.toLowerCase().includes("challan") || task.title.toLowerCase().includes("advance tax")) ? (
                                      <button
                                        onClick={() => setViewAckModalTask(task)}
                                        className="flex items-center gap-1 text-[10px] text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md font-bold transition"
                                        title={task.challanCin || "Challan 280 CIN Verified"}
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                        CIN Matched
                                      </button>
                                    ) : task.officialUdin ? (
                                      <button
                                        onClick={() => setViewAckModalTask(task)}
                                        className="flex items-center gap-1 text-[10px] text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md font-bold transition"
                                        title={task.officialUdin}
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                        UDIN Synced
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setViewAckModalTask(task)}
                                        className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-bold transition"
                                        title={task.arnNumber ? `ARN: ${task.arnNumber}` : "Government ARN Verified"}
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        ARN Synced
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL 1: GATED MISSING DOCUMENTS ADVANCE WARNING */}
      {gatedTaskWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Missing Client Documents Alert</h4>
                <p className="text-xs text-slate-500">{gatedTaskWarning.entityName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              This filing has <strong>{gatedTaskWarning.missingDocumentsCount} uncollected documents</strong> from the client:
            </p>

            <ul className="text-xs bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1">
              {(gatedTaskWarning.missingDocumentsList || ["Statutory invoices and bank statements"]).map((doc, idx) => (
                <li key={idx} className="font-bold text-amber-900 flex items-center gap-1.5">
                  &bull; {doc}
                </li>
              ))}
            </ul>

            <p className="text-[11px] text-slate-500">
              Advancing without client records may lead to inaccurate preparation and ICAI Peer Review non-compliance.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setGatedTaskWarning(null)}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerSingleWhatsAppChase(gatedTaskWarning);
                  setGatedTaskWarning(null);
                }}
                className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                Chase WhatsApp First
              </button>
              <button
                onClick={() => {
                  onStatusChange(gatedTaskWarning.id, "IN_PREPARATION");
                  setGatedTaskWarning(null);
                  toast.warning("Task Advanced with Disclaimers", "Moved to In Preparation with uncollected client documents.");
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-btred-logo hover:bg-red-700 rounded-xl transition shadow-sm"
              >
                Bypass &amp; Advance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PARTNER FINAL SIGN-OFF & DIGITAL FILING AUTHORIZATION */}
      {partnerSignOffModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black text-btred-logo tracking-wider">
                  Partner Statutory Sign-off Desk
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  {partnerSignOffModalTask.title}
                </h4>
                <p className="text-xs text-slate-600">
                  {partnerSignOffModalTask.entityName} &bull; {partnerSignOffModalTask.period}
                </p>
              </div>
              <button
                onClick={() => setPartnerSignOffModalTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Responsible Partner</span>
                <span className="font-black text-slate-900">{partnerSignOffModalTask.reviewedBy || "CA Gunjan Jain (FCA)"}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Assessee Sign-off</span>
                <span className="font-black text-emerald-700">✓ Verified &amp; Approved</span>
              </div>
            </div>

            {partnerSignOffModalTask.category === "TAX_AUDIT" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">ICAI UDIN Generation *</label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-purple-700 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={signOffUdin}
                    onChange={(e) => setSignOffUdin(e.target.value)}
                    placeholder="e.g. 26022998BTA0192841"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-purple-950 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Sec 44AB requires mandatory UDIN within 60 days of tax audit report execution.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Class 3 DSC Token PIN / EVC Authorization</label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={signOffDscPin}
                  onChange={(e) => setSignOffDscPin(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono tracking-widest w-32 focus:outline-none"
                />
                <span className="text-xs text-slate-500">eMudhra / Capricorn Token Detected (USB-0)</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ready for Government Portal Dispatch</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Signing will upload JSON payload to {partnerSignOffModalTask.category === "GST" ? "GSTN Common Portal" : partnerSignOffModalTask.category === "ROC_MCA" ? "MCA V3 Portal" : "Income Tax e-Filing 2.0"} and generate official acknowledgment receipt.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPartnerSignOffModalTask(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPartnerSignOffFiling}
                className="bg-btred-logo hover:bg-btred-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Authorize &amp; Transmit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW OFFICIAL ACKNOWLEDGMENT / CHALLAN RECEIPT */}
      {viewAckModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Official Filing Acknowledgment</h4>
                  <p className="text-xs text-slate-500">{viewAckModalTask.entityName}</p>
                </div>
              </div>
              <button
                onClick={() => setViewAckModalTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Obligation:</span>
                <span className="font-bold text-slate-900 font-sans">{viewAckModalTask.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Period:</span>
                <span className="font-bold text-slate-900">{viewAckModalTask.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Filing Date:</span>
                <span className="font-bold text-slate-900">{viewAckModalTask.filingDate || "14-10-2026"}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-sans">
                  {viewAckModalTask.challanCin ? "CIN / BSR:" : viewAckModalTask.officialUdin ? "UDIN:" : "ARN:"}
                </span>
                <span className="font-extrabold text-btred-logo select-all">
                  {viewAckModalTask.challanCin || viewAckModalTask.officialUdin || viewAckModalTask.arnNumber || "AA2309260019281"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  toast.success("Receipt Downloaded", "Signed PDF acknowledgment saved to local files.");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  openWhatsAppPreset("919820044101", "DOC_CHASE", {
                    clientName: viewAckModalTask.entityName,
                    serviceName: viewAckModalTask.title,
                    period: viewAckModalTask.period,
                    deadline: formatDate(viewAckModalTask.dueDate),
                    missingDocs: [`Filing Acknowledgment Reference: ${viewAckModalTask.challanCin || viewAckModalTask.arnNumber || 'Verified'}`]
                  });
                  toast.success("WhatsApp Sent", "Official acknowledgment delivered to client.");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ZERO-PASSWORD CLIENT MAGIC LINK SIMULATOR */}
      <MagicLinkUploadModal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        entityName={simEntityName}
        taskTitle={simTaskTitle}
      />

      {/* MODAL 5: ADD NEW STATUTORY ENGAGEMENT */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95"
          >
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-800 p-1"
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
                <label className="font-bold text-slate-700 block mb-1">Statutory Due Date</label>
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
                className="bg-btred-logo hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
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
