"use client";

import React, { useEffect, useState } from "react";
import { ComplianceTask, WorkflowStatus, ClientGroup, ClientEntity } from "@/lib/types";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { createWhatsAppWebLink, openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { COMPLIANCE_WORKFLOW_TEMPLATES, getWorkflowTemplate } from "@/lib/compliance/workflowTemplates";
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
  onStatusChange: (taskId: string, newStatus: WorkflowStatus, arnNumber?: string) => Promise<unknown> | void;
  onAddTask?: (taskData: Partial<ComplianceTask>) => Promise<unknown> | void;
  onTaskUpdate?: (taskId: string, updates: Partial<ComplianceTask>) => Promise<unknown> | void;
  onReminderDraft?: (taskId: string) => Promise<unknown> | void;
}

const STATUS_COLUMNS: { key: WorkflowStatus; label: string; badgeColor: string }[] = [
  { key: "DOCUMENTS_AWAITED", label: "Client Docs Awaited", badgeColor: "bg-amber-100 text-amber-800 border-amber-300" },
  { key: "IN_PREPARATION", label: "In Prep (Article / Staff)", badgeColor: "bg-blue-100 text-blue-800 border-blue-300" },
  { key: "MANAGER_REVIEW", label: "Senior / Manager Review", badgeColor: "bg-purple-100 text-purple-800 border-purple-300" },
  { key: "PARTNER_SIGN_OFF", label: "Partner Final Sign-off", badgeColor: "bg-red-100 text-btred-logo border-red-300" },
  { key: "FILED_AND_COMPLETED", label: "Filed & Acknowledged", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300" },
];

type QueueFilter = "ALL" | "DUE_SOON" | "WAITING_CLIENT" | "READY_REVIEW" | "UNASSIGNED";

function localDateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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

export const StatutoryCalendar: React.FC<StatutoryCalendarProps> = ({ tasks, clients = [], onStatusChange, onAddTask, onTaskUpdate, onReminderDraft }) => {
  const [firmUsers, setFirmUsers] = useState<Array<{ id: string; name: string; role: string; isActive: boolean }>>([]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let mounted = true;
    void fetch("/api/staff-access", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) throw new Error("Team members could not be loaded.");
        if (mounted) setFirmUsers((result.users || []).filter((user: { isActive: boolean }) => user.isActive));
      })
      .catch(() => { if (mounted) setFirmUsers([]); });
    return () => { mounted = false; };
  }, []);
  const groups = Array.from(
    clients.reduce((map, client) => {
      const current = map.get(client.groupId) || {
        id: client.groupId,
        name: client.groupName,
        totalEntities: 0,
        totalTurnoverCr: 0,
        promoterName: client.primaryContact?.name || "",
        overdueFeesTotal: undefined as number | undefined,
      };
      current.totalEntities += 1;
      current.totalTurnoverCr += client.turnoverCr || 0;
      map.set(client.groupId, current);
      return map;
    }, new Map<string, { id: string; name: string; totalEntities: number; totalTurnoverCr: number; promoterName: string; overdueFeesTotal?: number }>()).values()
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("ALL");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"kanban" | "family-groups">("kanban");
  const [mobileKanbanStage, setMobileKanbanStage] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNudgeToast, setActiveNudgeToast] = useState<{ entity: string; task: string; link: string } | null>(null);
  const [filingReferenceTask, setFilingReferenceTask] = useState<string | null>(null);
  const [filingReferenceInput, setFilingReferenceInput] = useState("");
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simEntityName, setSimEntityName] = useState("");
  const [simTaskTitle, setSimTaskTitle] = useState("");

  // New Engagement Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEntityIds, setNewTaskEntityIds] = useState<string[]>([]);
  const [entitySearch, setEntitySearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [newTaskMissingDocuments, setNewTaskMissingDocuments] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<ComplianceTask["category"] | "">("");
  const [newTaskPriority, setNewTaskPriority] = useState<ComplianceTask["priority"] | "">("");
  const [newTaskOwnerId, setNewTaskOwnerId] = useState("");
  const [newTaskReviewerId, setNewTaskReviewerId] = useState("");
  const [newTaskPeriod, setNewTaskPeriod] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [editingRequestsTaskId, setEditingRequestsTaskId] = useState<string | null>(null);
  const [editedRequests, setEditedRequests] = useState("");
  const [isSavingRequests, setIsSavingRequests] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskEntityIds.length || !newTaskCategory || !newTaskPriority || !newTaskPeriod.trim() || !newTaskDueDate) return;

    const matchedClients = clients.filter(c => newTaskEntityIds.includes(c.id));
    if (matchedClients.length !== newTaskEntityIds.length) {
      toast.error("Select a client", "Create or select a client entity before opening an engagement.");
      return;
    }

    const payload: Partial<ComplianceTask> = {
      title: newTaskTitle.trim(),
      entityId: matchedClients[0].id,
      entityIds: newTaskEntityIds,
      entityName: matchedClients.map((client) => client.name).join(", "),
      groupId: matchedClients[0].groupId,
      category: newTaskCategory,
      period: newTaskPeriod.trim(),
      dueDate: newTaskDueDate,
      status: "DOCUMENTS_AWAITED",
      assignedToId: newTaskOwnerId || undefined,
      assignedTo: firmUsers.find((user) => user.id === newTaskOwnerId)?.name || "",
      reviewedById: newTaskReviewerId || undefined,
      reviewedBy: firmUsers.find((user) => user.id === newTaskReviewerId)?.name || "",
      priority: newTaskPriority,
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: newTaskMissingDocuments.split("\n").filter((item) => item.trim()).length,
      missingDocumentsList: [...new Set(newTaskMissingDocuments.split("\n").map((item) => item.trim()).filter(Boolean))],
    } as Partial<ComplianceTask> & { entityIds: string[] };

    try {
      if (onAddTask) {
        await onAddTask(payload);
      } else {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) throw new Error(result?.error || "Engagement could not be saved.");
      }
      toast.success("Engagements created", `${matchedClients.length} ${matchedClients.length === 1 ? "entity is" : "entities are"} now on the ${payload.title} workflow.`);
      setIsAddTaskOpen(false);
      setNewTaskTitle("");
      setNewTaskEntityIds([]);
      setSelectedTemplateId("");
      setNewTaskMissingDocuments("");
      setNewTaskCategory("");
      setNewTaskPriority("");
      setNewTaskOwnerId("");
      setNewTaskReviewerId("");
      setNewTaskPeriod("");
      setNewTaskDueDate("");
    } catch (error) {
      toast.error("Engagement not saved", error instanceof Error ? error.message : "Refresh and try again.");
    }
  };

  const saveDocumentRequests = async (task: ComplianceTask) => {
    if (!onTaskUpdate) return;
    const items = [...new Set(editedRequests.split("\n").map((item) => item.trim()).filter(Boolean))];
    setIsSavingRequests(true);
    try {
      await onTaskUpdate(task.id, { missingDocumentsList: items, missingDocumentsCount: items.length });
      setEditingRequestsTaskId(null);
      toast.success("Request list updated", `${items.length} document request${items.length === 1 ? "" : "s"} saved for ${task.entityName}.`);
    } catch (error) {
      toast.error("Request list not saved", error instanceof Error ? error.message : "Refresh and try again.");
    } finally {
      setIsSavingRequests(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
    const matchesGroup = selectedGroupId === "ALL" || t.groupId === selectedGroupId;
    const matchesQueue = queueFilter === "ALL"
      || (queueFilter === "DUE_SOON" && t.status !== "FILED_AND_COMPLETED" && t.dueDate <= localDateOffset(7))
      || (queueFilter === "WAITING_CLIENT" && t.status === "DOCUMENTS_AWAITED")
      || (queueFilter === "READY_REVIEW" && ["MANAGER_REVIEW", "PARTNER_SIGN_OFF"].includes(t.status))
      || (queueFilter === "UNASSIGNED" && t.status !== "FILED_AND_COMPLETED" && !(t.assignedTo || "").trim());
    const matchesSearch =
      t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.arnNumber && t.arnNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesQueue && matchesCategory && matchesGroup && matchesSearch;
  });

  const activeTasks = tasks.filter((task) => task.status !== "FILED_AND_COMPLETED");
  const dueSoonCount = activeTasks.filter((task) => task.dueDate <= localDateOffset(7)).length;
  const waitingClientCount = activeTasks.filter((task) => task.status === "DOCUMENTS_AWAITED").length;
  const readyReviewCount = tasks.filter((task) => ["MANAGER_REVIEW", "PARTNER_SIGN_OFF"].includes(task.status)).length;
  const unassignedCount = activeTasks.filter((task) => !(task.assignedTo || "").trim()).length;

  const totalAccruingDaily = tasks
    .filter((t) => t.status !== "FILED_AND_COMPLETED")
    .reduce((sum, t) => sum + (t.accruingDailyPenalty || 0), 0);
  const totalPenaltyExposure = tasks
    .filter((t) => t.status !== "FILED_AND_COMPLETED")
    .reduce((sum, t) => sum + t.penaltyRisk, 0);

  const triggerSingleWhatsAppChase = (task: ComplianceTask) => {
    if (!task) return;
    const entity = clients.find((client) => client.id === task.entityId);
    const phone = entity?.primaryContact?.phone;
    if (!phone) {
      toast.error("Reminder not prepared", "Add an authorized contact phone number to this client first.");
      return;
    }
    const params = {
      clientName: task.entityName,
      firmName: DEFAULT_FIRM_BRANDING.firmName || undefined,
      serviceName: task.title,
      period: task.period,
      deadline: formatDate(task.dueDate),
      missingDocs: task.missingDocumentsList || ["Pending financial statements and vouchers"],
    };
    openWhatsAppPreset(phone, "DOC_CHASE", params);
    const link = createWhatsAppWebLink(phone, "DOC_CHASE", params);
    if (onReminderDraft) {
      void Promise.resolve(onReminderDraft(task.id)).catch((error) => {
        toast.error("Draft opened but not recorded", error instanceof Error ? error.message : "The WhatsApp draft opened, but the activity record could not be saved.");
      });
    }

    setActiveNudgeToast({
      entity: task.entityName,
      task: task.title,
      link,
    });
    toast.info("WhatsApp draft opened", `Review and send the document reminder to ${task.entityName}. The app does not send messages.`);
    setTimeout(() => {
      setActiveNudgeToast(null);
    }, 6000);
  };

  return (
    <div className="space-y-4">
      {/* Firm-entered task risk summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-black text-white p-5 rounded-3xl shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-500/20 text-red-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-red-500/40 flex items-center gap-1">
              <Zap className="w-3 h-3 text-red-400" />
              Task Tracking
            </span>
            <span className="text-xs text-slate-400 font-medium">Monitoring {tasks.filter((task) => task.status !== "FILED_AND_COMPLETED").length} open engagements</span>
          </div>
          <h2 className="text-lg md:text-xl font-black mt-1 tracking-tight text-white flex items-center gap-2">
            Statutory Task Calendar
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Tracks dates, priorities, and acknowledgement references entered by your firm. Risk values are estimates only when recorded. WhatsApp reminders open as drafts for a person to review and send.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-2xl text-right">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Daily Accruing Risk</span>
            <span className="text-xl font-black text-red-400">{totalAccruingDaily > 0 ? `₹${totalAccruingDaily.toLocaleString()}/day` : "Not assessed"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" aria-label="Daily work queues">
        {([
          { id: "ALL", label: "All engagements", count: tasks.length },
          { id: "DUE_SOON", label: "Due or overdue · 7 days", count: dueSoonCount },
          { id: "WAITING_CLIENT", label: "Waiting on client", count: waitingClientCount },
          { id: "READY_REVIEW", label: "Ready for review", count: readyReviewCount },
          { id: "UNASSIGNED", label: "Owner needed", count: unassignedCount },
        ] as const).map((queue) => (
          <button
            key={queue.id}
            type="button"
            aria-pressed={queueFilter === queue.id}
            onClick={() => setQueueFilter(queue.id)}
            className={`rounded-2xl border p-3 text-left transition ${queueFilter === queue.id ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"}`}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wide opacity-75">{queue.label}</span>
            <span className="mt-1 block text-xl font-black">{queue.count}</span>
          </button>
        ))}
      </div>

      {/* Toast Notification for WhatsApp Magic Link Dispatch */}
      {activeNudgeToast && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <p className="text-xs font-black text-white">
                WhatsApp reminder draft for {activeNudgeToast.entity}
              </p>
            </div>
            <p className="text-[11px] text-emerald-300">
              WhatsApp opened with a draft. Review and send it manually:
            </p>
            {process.env.NODE_ENV !== "production" && <div className="flex flex-wrap items-center gap-2 pt-0.5">
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
            </div>}
            {process.env.NODE_ENV === "production" && <p className="text-[11px] text-emerald-300">Clients can upload source records for their assigned entities through the client portal.</p>}
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
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        {/* Top Control Bar: Group Switcher & View Mode */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Family Group Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Building2 className="w-4 h-4 text-btred-logo flex-shrink-0" />
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Business Group:</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-btred-logo"
            >
              <option value="ALL">All Business Groups ({groups.length} Groups)</option>
              {groups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name} ({grp.totalEntities} entities &bull; ₹{grp.totalTurnoverCr}Cr)
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle: Kanban Matrix vs Family Groups Rollup */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
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
              Promoter Group Rollup ({groups.length})
            </button>
          </div>
        </div>

        {/* Category Pills & Instant Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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
      </div>

      {/* VIEW MODE 1: FAMILY GROUP ROLLUP */}
      {viewMode === "family-groups" && (
        groups.length === 0 ? (
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
          {groups.map((grp) => {
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
                    <span className="font-black text-btred-logo text-sm">{grp.overdueFeesTotal === undefined ? "—" : formatCurrencyINR(grp.overdueFeesTotal)}</span>
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
                        {(task.missingDocumentsCount > 0 || onTaskUpdate) && (
                          <div className="mt-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] p-2 rounded-xl space-y-1 font-medium">
                            <div className="flex items-center justify-between font-bold">
                              <span>{task.missingDocumentsCount > 0 ? `${task.missingDocumentsCount} docs requested` : "No open document requests"}</span>
                              {task.missingDocumentsCount > 0 && <button
                                onClick={() => triggerSingleWhatsAppChase(task)}
                                className="text-btred-logo font-black hover:underline flex items-center gap-0.5"
                              >
                                <Send className="w-2.5 h-2.5" />
                                Prepare draft ({task.reminderDraftCount || 0} prepared)
                              </button>}
                            </div>
                            {task.missingDocumentsList && task.missingDocumentsList.length > 0 && (
                              <p className="text-[10px] text-slate-600 truncate">
                                &bull; {task.missingDocumentsList[0]}
                              </p>
                            )}
                            {onTaskUpdate && <button
                              type="button"
                              onClick={() => {
                                setEditingRequestsTaskId(task.id);
                                setEditedRequests((task.missingDocumentsList || []).join("\n"));
                              }}
                              className="text-[10px] font-black text-amber-900 underline underline-offset-2"
                            >
                              Update document request list
                            </button>}
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
                            task.status === "PARTNER_SIGN_OFF" && filingReferenceTask === task.id ? (
                              <form
                                className="flex min-w-0 gap-1"
                                onSubmit={async (event) => {
                                  event.preventDefault();
                                  const reference = filingReferenceInput.trim();
                                  if (!reference) return;
                                  try {
                                    await onStatusChange(task.id, "FILED_AND_COMPLETED", reference);
                                    setFilingReferenceTask(null);
                                    setFilingReferenceInput("");
                                  } catch (error) {
                                    toast.error("Filing status not saved", error instanceof Error ? error.message : "The government reference could not be saved.");
                                  }
                                }}
                              >
                                <input
                                  aria-label="Government acknowledgement reference"
                                  value={filingReferenceInput}
                                  onChange={(event) => setFilingReferenceInput(event.target.value)}
                                  maxLength={80}
                                  required
                                  placeholder="ARN / acknowledgement"
                                  className="min-w-0 w-36 rounded-lg border border-slate-300 px-2 py-1 text-[10px]"
                                />
                                <button type="submit" className="rounded-lg bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white">Save</button>
                              </form>
                            ) : (
                            <button
                              disabled={task.status === "DOCUMENTS_AWAITED" && task.missingDocumentsCount > 0}
                              title={task.status === "DOCUMENTS_AWAITED" && task.missingDocumentsCount > 0 ? "Clear the client document request list before starting preparation." : undefined}
                              onClick={() => {
                                if (task.status === "PARTNER_SIGN_OFF") {
                                  setFilingReferenceTask(task.id);
                                  setFilingReferenceInput("");
                                  return;
                                }
                                const nextStatusMap: Record<WorkflowStatus, WorkflowStatus> = {
                                  DOCUMENTS_AWAITED: "IN_PREPARATION",
                                  IN_PREPARATION: "MANAGER_REVIEW",
                                  MANAGER_REVIEW: "PARTNER_SIGN_OFF",
                                  PARTNER_SIGN_OFF: "FILED_AND_COMPLETED",
                                  FILED_AND_COMPLETED: "FILED_AND_COMPLETED",
                                };
                                void Promise.resolve(onStatusChange(task.id, nextStatusMap[task.status])).catch((error) => {
                                  toast.error("Task status not saved", error instanceof Error ? error.message : "Refresh and try again.");
                                });
                              }}
                              className="flex items-center gap-1 text-[11px] font-black text-white bg-btred-logo hover:bg-btred-700 px-2.5 py-1 rounded-lg transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {task.status === "PARTNER_SIGN_OFF" ? "Record ARN" : "Advance"}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            )
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Acknowledgement recorded
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
                <label className="font-bold text-slate-700 block mb-1">Start from a workflow</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    const template = getWorkflowTemplate(templateId);
                    setSelectedTemplateId(templateId);
                    if (template) {
                      setNewTaskTitle(template.title);
                      setNewTaskCategory(template.category);
                      setNewTaskMissingDocuments(template.requestedDocuments.join("\n"));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="">Blank engagement</option>
                  {COMPLIANCE_WORKFLOW_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">Starter checklists are editable. Confirm the document list and statutory due date for this engagement.</p>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Engagement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTR-3B filing"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Entity *</label>
                {clients.length > 0 ? (
                  <div className="space-y-2">
                    <input
                      type="search"
                      value={entitySearch}
                      onChange={(e) => setEntitySearch(e.target.value)}
                      placeholder="Find a client entity"
                      aria-label="Find a client entity"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                    />
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                      {clients.filter((client) => `${client.name} ${client.pan}`.toLowerCase().includes(entitySearch.toLowerCase())).map((client) => (
                        <label key={client.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newTaskEntityIds.includes(client.id)}
                            onChange={(event) => setNewTaskEntityIds((current) => event.target.checked ? [...current, client.id] : current.filter((id) => id !== client.id))}
                            className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                          />
                          <span className="min-w-0"><span className="block truncate text-slate-900 font-bold">{client.name}</span><span className="block text-[10px] text-slate-500">PAN: {client.pan}</span></span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500">{newTaskEntityIds.length} selected for this service period.</p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">Add a client entity to the firm workspace before creating an engagement.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    required
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as ComplianceTask["category"] | "")}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none font-medium"
                  >
                    <option value="">-- Select category --</option>
                    <option value="GST">GST</option>
                    <option value="INCOME_TAX">Income Tax</option>
                    <option value="TAX_AUDIT">Tax Audit (3CD)</option>
                    <option value="TDS">TDS & TCS</option>
                    <option value="ROC_MCA">ROC & MCA</option>
                    <option value="TRANSFER_PRICING">Transfer Pricing</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Statutory Period *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FY 2025-26 or October 2026"
                    value={newTaskPeriod}
                    onChange={(e) => setNewTaskPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Priority *</label>
                <select
                  required
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as ComplianceTask["priority"] | "")}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
                >
                  <option value="">-- Select priority --</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="font-bold text-slate-700">Owner
                  <select value={newTaskOwnerId} onChange={(e) => setNewTaskOwnerId(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none">
                    <option value="">Unassigned</option>
                    {firmUsers.filter((user) => ["PAID_CA_MANAGER", "ARTICLE_TRAINEE"].includes(user.role)).map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role === "PAID_CA_MANAGER" ? "Manager" : "Article"}</option>)}
                  </select>
                </label>
                <label className="font-bold text-slate-700">Reviewer
                  <select value={newTaskReviewerId} onChange={(e) => setNewTaskReviewerId(e.target.value)} className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none">
                    <option value="">Unassigned</option>
                    {firmUsers.filter((user) => ["SUPER_ADMIN", "PARTNER", "PAID_CA_MANAGER"].includes(user.role)).map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role === "PAID_CA_MANAGER" ? "Manager" : "Partner"}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-slate-500">Enter the due date verified by the firm. Starter workflows do not calculate statutory deadlines.</p>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Documents requested from client</label>
                <textarea
                  rows={4}
                  value={newTaskMissingDocuments}
                  onChange={(e) => setNewTaskMissingDocuments(e.target.value)}
                  placeholder="One document request per line"
                  className="w-full resize-y bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
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
                disabled={clients.length === 0 || newTaskEntityIds.length === 0}
                className="bg-btblack hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create {newTaskEntityIds.length || ""} Engagement{newTaskEntityIds.length === 1 ? "" : "s"}
              </button>
            </div>
          </form>
        </div>
      )}
      {editingRequestsTaskId && (() => {
        const task = tasks.find((item) => item.id === editingRequestsTaskId);
        if (!task) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="document-requests-title" className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="document-requests-title" className="text-base font-black text-slate-900">Client document requests</h3>
                  <p className="text-xs text-slate-500 mt-1">{task.entityName} · {task.title} · {task.period}</p>
                </div>
                <button type="button" aria-label="Close" onClick={() => setEditingRequestsTaskId(null)} className="text-slate-400 hover:text-slate-800 p-1"><X className="w-5 h-5" /></button>
              </div>
              <label className="block text-xs font-bold text-slate-700" htmlFor="document-request-list">One request per line</label>
              <textarea id="document-request-list" rows={7} maxLength={9000} value={editedRequests} onChange={(event) => setEditedRequests(event.target.value)} placeholder="Remove all lines when the firm confirms the required documents are complete." className="w-full resize-y bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400" />
              <p className="text-[11px] text-slate-500">A client upload does not automatically close a request. Review the file first, then remove the satisfied request here.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingRequestsTaskId(null)} className="px-4 py-2 text-sm font-bold text-slate-600">Cancel</button>
                <button type="button" disabled={isSavingRequests} onClick={() => void saveDocumentRequests(task)} className="px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl disabled:opacity-50">{isSavingRequests ? "Saving…" : "Save request list"}</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
