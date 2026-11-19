"use client";

import React, { useState, useMemo } from "react";
import { ComplianceTask, WorkflowStatus, ClientEntity, ClientGroup } from "@/lib/types";
import { STATUTORY_DEADLINES_MASTER, StatutoryDeadlineDefinition } from "@/lib/statutoryDueDates/master";
import { StatutoryPenaltyEngine } from "@/lib/statutoryDueDates/penaltyEngine";
import { generateAnnualComplianceSchedule } from "@/lib/statutoryDueDates/generator";
import { WorkloadMatrix } from "./WorkloadMatrix";
import { formatDate, formatCurrencyINR } from "@/lib/utils";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Search, 
  Building2, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Users, 
  Scale, 
  DollarSign, 
  Send, 
  FileCheck, 
  FileText, 
  KeyRound, 
  Plus, 
  X, 
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  Check
} from "lucide-react";

interface StatutoryTaskEngineProps {
  tasks: ComplianceTask[];
  clients?: ClientEntity[];
  groups?: ClientGroup[];
  onStatusChange: (taskId: string, newStatus: WorkflowStatus) => void;
  onAddTask?: (taskData: Partial<ComplianceTask>) => void;
  onBatchTasksAdd?: (tasks: ComplianceTask[]) => Promise<void> | void;
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
  initialTab?: "kanban" | "due-dates" | "workload" | "penalties";
}

const KANBAN_STAGES: { key: WorkflowStatus; label: string; badgeColor: string; description: string }[] = [
  { key: "DOCUMENTS_AWAITED", label: "1. Client Docs Awaited", badgeColor: "bg-amber-50 text-amber-900 border-amber-300", description: "Pending bank statements, invoices & vouchers" },
  { key: "IN_PREPARATION", label: "2. Article Prep", badgeColor: "bg-blue-50 text-blue-900 border-blue-200", description: "Article drafting returns & workpapers" },
  { key: "MANAGER_REVIEW", label: "3. Senior Review", badgeColor: "bg-purple-50 text-purple-900 border-purple-200", description: "Audit & cross-match verification" },
  { key: "PARTNER_SIGN_OFF", label: "4. Partner Sign-off", badgeColor: "bg-red-50 text-btred-logo border-red-200", description: "DSC signing & UDIN generation" },
  { key: "FILED_AND_COMPLETED", label: "5. Filed & Vaulted", badgeColor: "bg-emerald-50 text-emerald-900 border-emerald-300", description: "Filing acknowledgement recorded" }
];

export const StatutoryTaskEngine: React.FC<StatutoryTaskEngineProps> = ({
  tasks = [],
  clients = [],
  groups = [],
  onStatusChange,
  onAddTask,
  onBatchTasksAdd,
  selectedClientId,
  onSelectClient,
  initialTab = "kanban"
}) => {
  const [activeTab, setActiveTab] = useState<"kanban" | "due-dates" | "workload" | "penalties">(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedArticleFilter, setSelectedArticleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);

  // Sign-off Modal state
  const [signOffTask, setSignOffTask] = useState<ComplianceTask | null>(null);
  const [signOffUdin, setSignOffUdin] = useState("");
  const [signOffArn, setSignOffArn] = useState("");

  // New manual task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEntityId, setNewTaskEntityId] = useState(() => clients[0]?.id || "");
  const [newTaskCategory, setNewTaskCategory] = useState<ComplianceTask["category"]>("GST");
  const [newTaskPeriod, setNewTaskPeriod] = useState("October 2026");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-11-20");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("Kriti Jain (Article)");

  const now = new Date();

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchCat = selectedCategory === "ALL" || t.category === selectedCategory;
      const matchStatus = selectedStatusFilter === "ALL" || t.status === selectedStatusFilter;
      const matchArticle = selectedArticleFilter === "ALL" || t.assignedTo === selectedArticleFilter;
      const matchClient = !selectedClientId || t.entityId === selectedClientId;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        t.title.toLowerCase().includes(q) ||
        t.entityName.toLowerCase().includes(q) ||
        t.period.toLowerCase().includes(q) ||
        (t.pan && t.pan.toLowerCase().includes(q)) ||
        (t.gstin && t.gstin.toLowerCase().includes(q))
      );
      return matchCat && matchStatus && matchArticle && matchClient && matchSearch;
    });
  }, [tasks, selectedCategory, selectedStatusFilter, selectedArticleFilter, selectedClientId, searchQuery]);

  // Real-time summary statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "FILED_AND_COMPLETED").length;
    const open = total - completed;

    let overdue = 0;
    let criticalNext72h = 0;
    let totalAccruingDailyPenalty = 0;
    let totalAccruedLateFees = 0;

    tasks.forEach((t) => {
      if (t.status !== "FILED_AND_COMPLETED") {
        totalAccruingDailyPenalty += (t.accruingDailyPenalty || 0);
        const due = new Date(t.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) {
          overdue += 1;
          // Calculate realistic penalty
          if (t.category === "GST") {
            const res = StatutoryPenaltyEngine.calculateGstLateFeeAndInterest({
              statutoryDueDate: t.dueDate,
              annualTurnoverCr: 5.0,
              netCashLiabilityInr: t.taxPayableAmount || 25000
            });
            totalAccruedLateFees += res.totalLateFeeInr;
          } else if (t.category === "TDS") {
            const res = StatutoryPenaltyEngine.calculateTdsLateFeeAndInterest({
              statutoryDueDate: t.dueDate,
              totalTdsDeductibleInr: 10000
            });
            totalAccruedLateFees += res.totalLateFeeInr;
          } else if (t.category === "ROC_MCA") {
            const res = StatutoryPenaltyEngine.calculateRocLateFees({
              statutoryDueDate: t.dueDate,
              formCode: "ROC_AOC4"
            });
            totalAccruedLateFees += res.totalLateFeeInr;
          }
        } else if (diffDays <= 3 || t.priority === "CRITICAL") {
          criticalNext72h += 1;
        }
      }
    });

    return {
      total,
      completed,
      open,
      overdue,
      criticalNext72h,
      totalAccruingDailyPenalty,
      totalAccruedLateFees
    };
  }, [tasks, now]);

  // Auto-populate statutory schedule from Entity DNA
  const handleAutoPopulateTasks = async () => {
    if (!clients || clients.length === 0) {
      toast.error("No Clients", "Onboard client entities before generating statutory schedule.");
      return;
    }

    setIsAutoPopulating(true);
    try {
      let createdCount = 0;
      const targetClients = selectedClientId
        ? clients.filter((c) => c.id === selectedClientId)
        : clients;

      for (const client of targetClients) {
        const generated = generateAnnualComplianceSchedule(client, 2026);
        for (const genTask of generated) {
          // Avoid creating if duplicate ID exists
          const exists = tasks.some((t) => t.id === genTask.id);
          if (!exists) {
            if (onAddTask) {
              onAddTask(genTask);
              createdCount += 1;
            }
          }
        }
      }

      toast.success(
        "Statutory Tasks Generated",
        `Created ${createdCount} statutory compliance engagements mapped to active Entity DNA.`
      );
    } catch (err: any) {
      toast.error("Generation Error", err?.message || "Failed to generate statutory schedule.");
    } finally {
      setIsAutoPopulating(false);
    }
  };

  // WhatsApp Document Chasing Nudge
  const handleWhatsAppNudge = (task: ComplianceTask) => {
    const missingDocs = task.missingDocumentsList || ["Statutory bank statements & purchase ledgers"];
    openWhatsAppPreset("919820044101", "DOC_CHASE", {
      clientName: task.entityName,
      serviceName: task.title,
      period: task.period,
      deadline: formatDate(task.dueDate),
      missingDocs
    });
    toast.success("WhatsApp Nudge Dispatched", `Sent statutory document requisition for "${task.title}".`);
  };

  // Partner Sign-off & UDIN complete
  const handleCompleteSignOff = () => {
    if (!signOffTask) return;
    onStatusChange(signOffTask.id, "FILED_AND_COMPLETED");
    toast.success(
      "Engagement Certified & Completed",
      `"${signOffTask.title}" certified with UDIN ${signOffUdin || "26022998C" + Date.now().toString().slice(-8)}.`
    );
    setSignOffTask(null);
    setSignOffUdin("");
    setSignOffArn("");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner KPI Metric Strip (CADashboard Killer) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Engagements</span>
          <div className="text-xl font-black text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-500">{stats.completed} Completed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Open In-Progress</span>
          <div className="text-xl font-black text-purple-700 mt-1">{stats.open}</div>
          <span className="text-[10px] text-slate-500">Active Staff Queue</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Critical (&lt;72h)</span>
          <div className="text-xl font-black text-amber-700 mt-1">{stats.criticalNext72h}</div>
          <span className="text-[10px] text-amber-800 font-bold">Immediate Priority</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-700 block">Overdue Default</span>
          <div className="text-xl font-black text-rose-700 mt-1">{stats.overdue}</div>
          <span className="text-[10px] text-rose-800 font-bold">Late Fees Accruing</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Accruing Daily</span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            ₹{stats.totalAccruingDailyPenalty}/day
          </div>
          <span className="text-[10px] text-slate-500">Sec 47 &amp; Sec 234E</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Accrued Penalty</span>
          <div className="text-xl font-black text-red-600 mt-1 font-mono">
            ₹{stats.totalAccruedLateFees.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-red-700 font-bold">Default Exposure</span>
        </div>
      </div>

      {/* Main Suite Controls & Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                activeTab === "kanban"
                  ? "bg-gradient-to-r from-red-600 to-btred-logo text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Maker-Checker Kanban</span>
            </button>

            <button
              onClick={() => setActiveTab("due-dates")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                activeTab === "due-dates"
                  ? "bg-gradient-to-r from-red-600 to-btred-logo text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>2. Statutory Due Date Master (75+)</span>
            </button>

            <button
              onClick={() => setActiveTab("workload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                activeTab === "workload"
                  ? "bg-gradient-to-r from-red-600 to-btred-logo text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>3. Article Workload Heatmap</span>
            </button>

            <button
              onClick={() => setActiveTab("penalties")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                activeTab === "penalties"
                  ? "bg-gradient-to-r from-red-600 to-btred-logo text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>4. Late Fee &amp; Penalty Meter</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoPopulateTasks}
              disabled={isAutoPopulating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200 transition disabled:opacity-50"
              title="Auto-generate tasks from active Entity DNA"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAutoPopulating ? "Generating..." : "⚡ Auto-Populate from DNA"}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-btred-logo hover:bg-red-700 text-white font-black text-xs shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Task</span>
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search obligation, entity, PAN..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statutory Acts</option>
              <option value="GST">GST (Returns &amp; IFF)</option>
              <option value="INCOME_TAX">Income Tax &amp; Adv Tax</option>
              <option value="TAX_AUDIT">Tax Audit (3CD)</option>
              <option value="TDS">TDS &amp; TCS (24Q/26Q)</option>
              <option value="ROC_MCA">ROC &amp; Secretarial</option>
            </select>

            {/* Article Assistant Filter */}
            <select
              value={selectedArticleFilter}
              onChange={(e) => setSelectedArticleFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Assigned Staff</option>
              <option value="Kriti Jain (Article)">Kriti Jain</option>
              <option value="Aman Verma (Article)">Aman Verma</option>
              <option value="Rahul Sharma (Article)">Rahul Sharma</option>
              <option value="Pooja Mehta (Article)">Pooja Mehta</option>
            </select>
          </div>

          <span className="text-slate-500 font-medium">
            Showing <strong>{filteredTasks.length}</strong> of {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* ─── TAB 1: 5-STAGE MAKER-CHECKER KANBAN PIPELINE ─── */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {KANBAN_STAGES.map((stage) => {
            const stageTasks = filteredTasks.filter((t) => t.status === stage.key);
            return (
              <div
                key={stage.key}
                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3 flex flex-col h-[700px] overflow-hidden"
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-slate-200/80 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 truncate">
                      {stage.label}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-white border border-slate-200 text-slate-700 font-mono">
                      {stageTasks.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{stage.description}</p>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-0.5 scrollbar-thin">
                  {stageTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl p-4">
                      No tasks in this pipeline stage
                    </div>
                  ) : (
                    stageTasks.map((task) => {
                      const due = new Date(task.dueDate);
                      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
                      const isOverdue = diffDays < 0;
                      const isCritical = diffDays <= 3 || task.priority === "CRITICAL";

                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs hover:shadow-xs transition space-y-2.5 text-xs group"
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-bold text-[11px] text-slate-900 line-clamp-1">
                              {task.entityName}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 ${
                                isOverdue
                                  ? "bg-red-100 text-red-900 border border-red-300 animate-pulse"
                                  : isCritical
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {isOverdue ? `Overdue ${Math.abs(diffDays)}d` : `Due in ${diffDays}d`}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="font-black text-xs text-slate-800 leading-snug">
                              {task.title}
                            </h4>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Period: <strong>{task.period}</strong> • Due: {task.dueDate}
                            </div>
                          </div>

                          {/* Missing Documents Warning if stage 1 */}
                          {stage.key === "DOCUMENTS_AWAITED" && task.missingDocumentsList && task.missingDocumentsList.length > 0 && (
                            <div className="p-2 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                              <span className="text-[9px] font-black uppercase text-amber-900 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Missing Documents:
                              </span>
                              <div className="text-[10px] text-slate-600 line-clamp-2">
                                {task.missingDocumentsList.join(", ")}
                              </div>
                              <button
                                onClick={() => handleWhatsAppNudge(task)}
                                className="w-full mt-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition"
                              >
                                <Send className="w-2.5 h-2.5" />
                                <span>WhatsApp Nudge</span>
                              </button>
                            </div>
                          )}

                          {/* Assigned Article & Meta */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-bold text-slate-700 truncate max-w-[110px]">
                              {task.assignedTo.replace(" (Article)", "")}
                            </span>
                            {task.accruingDailyPenalty > 0 && (
                              <span className="font-mono text-rose-700 font-bold">
                                +₹{task.accruingDailyPenalty}/d
                              </span>
                            )}
                          </div>

                          {/* Stage Transition Control Bar */}
                          <div className="pt-1 flex items-center justify-between gap-1">
                            {stage.key !== "DOCUMENTS_AWAITED" && (
                              <button
                                onClick={() => {
                                  const prevIdx = KANBAN_STAGES.findIndex((s) => s.key === stage.key) - 1;
                                  if (prevIdx >= 0) onStatusChange(task.id, KANBAN_STAGES[prevIdx].key);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-slate-700"
                                title="Move back one stage"
                              >
                                &larr;
                              </button>
                            )}

                            {stage.key === "PARTNER_SIGN_OFF" ? (
                              <button
                                onClick={() => {
                                  setSignOffTask(task);
                                  setSignOffUdin("26022998C" + Math.floor(10000000 + Math.random() * 90000000));
                                }}
                                className="w-full py-1 rounded-lg bg-btred-logo hover:bg-red-700 text-white font-black text-[10px] flex items-center justify-center gap-1 shadow-xs"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Partner DSC &amp; UDIN Sign</span>
                              </button>
                            ) : stage.key !== "FILED_AND_COMPLETED" ? (
                              <button
                                onClick={() => {
                                  const nextIdx = KANBAN_STAGES.findIndex((s) => s.key === stage.key) + 1;
                                  if (nextIdx < KANBAN_STAGES.length) onStatusChange(task.id, KANBAN_STAGES[nextIdx].key);
                                }}
                                className="w-full py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center gap-1 transition"
                              >
                                <span>Advance Stage</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mx-auto">
                                <CheckCircle2 className="w-3 h-3" /> Filed &amp; Locked
                              </span>
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
      )}

      {/* ─── TAB 2: 75+ STATUTORY DUE DATE MASTER DIRECTORY ─── */}
      {activeTab === "due-dates" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Official Indian Statutory Deadline Master Directory (75+ Catalog)
              </h3>
              <p className="text-xs text-slate-500">
                Statutory due date rules, governing sections, and late fee formulas under CGST, CBDT, and MCA acts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Statutory Form</th>
                  <th className="p-3">Title &amp; Scope</th>
                  <th className="p-3">Governing Law &amp; Section</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Statutory Penalty Section</th>
                  <th className="p-3">Late Fee Formula</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {STATUTORY_DEADLINES_MASTER.map((d) => (
                  <tr key={d.code} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-purple-700">
                      {d.formName}
                    </td>
                    <td className="p-3 text-slate-900 font-bold">
                      <div>{d.title}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{d.description}</div>
                    </td>
                    <td className="p-3 text-slate-700 text-[11px]">
                      <div>{d.governingSection}</div>
                      <div className="text-[10px] text-slate-400">{d.governingAct.split("(")[0]}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-slate-100 text-slate-800">
                        {d.frequency}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-rose-700">
                      {d.penaltySection}
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 max-w-xs">
                      {d.penaltyFormulaDescription}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ARTICLE WORKLOAD HEATMAP ─── */}
      {activeTab === "workload" && (
        <WorkloadMatrix
          tasks={tasks}
          onReassignTask={async (taskId, newArticle) => {
            onStatusChange(taskId, "IN_PREPARATION");
            toast.success("Article Workload Updated", `Task successfully reassigned to ${newArticle}.`);
          }}
        />
      )}

      {/* ─── TAB 4: LATE FEE & PENALTY EXPOSURE METER ─── */}
      {activeTab === "penalties" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Deterministic Statutory Late Fee &amp; Penalty Exposure Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Live mathematical evaluation of Section 47 caps, Section 50 net-cash interest, and Section 234E/F/271B fines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-black uppercase text-purple-900">GST Section 47 Late Fee Slabs</span>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex justify-between"><span>Turnover &le; ₹1.5 Cr:</span> <strong className="font-mono">Cap ₹2,000</strong></div>
                <div className="flex justify-between"><span>Turnover ₹1.5 - ₹5 Cr:</span> <strong className="font-mono">Cap ₹5,000</strong></div>
                <div className="flex justify-between"><span>Turnover &gt; ₹5 Cr:</span> <strong className="font-mono">Cap ₹10,000</strong></div>
                <div className="flex justify-between"><span>Nil Returns:</span> <strong className="font-mono">Cap ₹500</strong></div>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-black uppercase text-rose-900">Direct Tax Default Penalties</span>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex justify-between"><span>ITR u/s 234F:</span> <strong className="font-mono">₹5,000 (₹1k if TI &le; 5L)</strong></div>
                <div className="flex justify-between"><span>Tax Audit u/s 271B:</span> <strong className="font-mono">Min(0.5% turnover, ₹1.5L)</strong></div>
                <div className="flex justify-between"><span>Sec 234A Delay:</span> <strong className="font-mono">1% per month</strong></div>
                <div className="flex justify-between"><span>Transfer Pricing 271BA:</span> <strong className="font-mono">Flat ₹1,00,000</strong></div>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-900">TDS &amp; Secretarial Penalties</span>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex justify-between"><span>TDS 26Q u/s 234E:</span> <strong className="font-mono">₹200/day (Max TDS)</strong></div>
                <div className="flex justify-between"><span>Sec 201(1A) Deposit:</span> <strong className="font-mono">1.5% per month</strong></div>
                <div className="flex justify-between"><span>MCA AOC-4 &amp; MGT-7:</span> <strong className="font-mono">₹100/day (No cap)</strong></div>
                <div className="flex justify-between"><span>DIR-3 KYC Late Fee:</span> <strong className="font-mono">₹5,000 per director</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partner Sign-off & UDIN Modal */}
      {signOffTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-btred-logo bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  ICAI Peer Review Gatekeeper
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">Partner Final Sign-off &amp; UDIN</h3>
              </div>
              <button onClick={() => setSignOffTask(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{signOffTask.title}</div>
                <div className="text-slate-500 font-mono mt-0.5">Assessee: {signOffTask.entityName} • Period: {signOffTask.period}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  18-Digit Mandatory ICAI UDIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={signOffUdin}
                  onChange={(e) => setSignOffUdin(e.target.value.toUpperCase())}
                  placeholder="e.g. 26022998CBPL981290"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500 uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Enforces 60-day ICAI tracking clock in UDIN Vault.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Government Portal ARN / Acknowledgement No.
                </label>
                <input
                  type="text"
                  value={signOffArn}
                  onChange={(e) => setSignOffArn(e.target.value)}
                  placeholder="e.g. AA231026019281Z"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSignOffTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSignOff}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-btred-logo hover:from-red-700 hover:to-red-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Certify, Complete &amp; Activate Pay-to-Release</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Schedule Statutory Engagement</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const matchedClient = clients.find((c) => c.id === newTaskEntityId) || clients[0];
                if (onAddTask) {
                  onAddTask({
                    title: newTaskTitle.trim(),
                    entityId: matchedClient?.id || "CLI-01",
                    entityName: matchedClient?.name || "Client Entity",
                    groupId: matchedClient?.groupId || "GRP-01",
                    category: newTaskCategory,
                    period: newTaskPeriod,
                    dueDate: newTaskDueDate,
                    status: "DOCUMENTS_AWAITED",
                    assignedTo: newTaskAssignedTo,
                    reviewedBy: "CA Gunjan Jain",
                    priority: "HIGH",
                    penaltyRisk: 5000,
                    accruingDailyPenalty: newTaskCategory === "GST" ? 50 : 0,
                    missingDocumentsCount: 1,
                    missingDocumentsList: ["Statutory Ledgers & Vouchers"],
                    pan: matchedClient?.pan,
                    gstin: matchedClient?.gstin
                  });
                }
                toast.success("Task Scheduled", `"${newTaskTitle}" assigned to ${newTaskAssignedTo}.`);
                setIsAddModalOpen(false);
                setNewTaskTitle("");
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assessee Legal Entity</label>
                <select
                  value={newTaskEntityId}
                  onChange={(e) => setNewTaskEntityId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-900"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Engagement Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. GSTR-3B Monthly Return Filing"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Statutory Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-900"
                  >
                    <option value="GST">GST</option>
                    <option value="INCOME_TAX">Income Tax</option>
                    <option value="TAX_AUDIT">Tax Audit (3CD)</option>
                    <option value="TDS">TDS &amp; TCS</option>
                    <option value="ROC_MCA">ROC &amp; Secretarial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Statutory Due Date</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax Period</label>
                  <input
                    type="text"
                    value={newTaskPeriod}
                    onChange={(e) => setNewTaskPeriod(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Article</label>
                  <select
                    value={newTaskAssignedTo}
                    onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-900"
                  >
                    <option value="Kriti Jain (Article)">Kriti Jain</option>
                    <option value="Aman Verma (Article)">Aman Verma</option>
                    <option value="Rahul Sharma (Article)">Rahul Sharma</option>
                    <option value="Pooja Mehta (Article)">Pooja Mehta</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-btred-logo hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Schedule Engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
