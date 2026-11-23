"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Filter,
  RefreshCw,
  PhoneCall,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronRight,
  Building2,
  FileCheck2,
  Check
} from "lucide-react";
import { ComplianceTask, ClientEntity, WorkflowStatus } from "@/lib/types";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";

interface TasksCommandCenterProps {
  tasks: ComplianceTask[];
  clients: ClientEntity[];
  onUpdateTask: (taskId: string, data: Partial<ComplianceTask>) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  onNavigateTab?: (tab: string) => void;
}

export const TasksCommandCenter: React.FC<TasksCommandCenterProps> = ({
  tasks,
  clients,
  onUpdateTask,
  onRefreshData,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "DOCS_AWAITED">("ALL");
  const [reassignModalTask, setReassignModalTask] = useState<ComplianceTask | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("Rahul Sharma (Article)");
  const [isAutoAssigning, setIsAutoAssigning] = useState<boolean>(false);
  const [dynamicStaffList, setDynamicStaffList] = useState<{ name: string; tier: number; role: string }[]>([]);

  // Load real staff list from API
  useEffect(() => {
    fetch("/api/staff")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.staff)) {
          const active = data.staff
            .filter((s: any) => s.status === "ACTIVE")
            .map((s: any) => ({
              name: `${s.fullName} (${s.role === "MANAGING_PARTNER" ? "Partner" : s.role === "PAID_CHARTERED_ACCOUNTANT" ? "CA" : "Article"})`,
              tier: s.competencyTier || 2,
              role: s.role,
            }));
          if (active.length > 0) {
            setDynamicStaffList(active);
            setSelectedStaff(active[0].name);
          }
        }
      })
      .catch((err) => console.warn("Staff fetch error:", err));
  }, []);

  const defaultStaffMembers = [
    { name: "Rahul Sharma (Article)", tier: 1, role: "ARTICLE_TRAINEE" },
    { name: "Kriti Jain (Article)", tier: 3, role: "ARTICLE_TRAINEE" },
    { name: "Aman Verma (Article)", tier: 2, role: "ARTICLE_TRAINEE" },
    { name: "Pooja Mehta (Article)", tier: 1, role: "ARTICLE_TRAINEE" },
    { name: "Priya Mehta (Senior Paid CA)", tier: 4, role: "PAID_CHARTERED_ACCOUNTANT" },
    { name: "CA Gunjan Jain (Partner)", tier: 4, role: "MANAGING_PARTNER" },
  ];

  const activeStaff = dynamicStaffList.length > 0 ? dynamicStaffList : defaultStaffMembers;

  const handleTriggerAutopilot = async () => {
    setIsAutoAssigning(true);
    try {
      const res = await fetch("/api/tasks/auto-assign", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(
          "Autopilot Workload Balanced",
          `Reassigned ${data.tasksReassigned} tasks across ${Object.keys(data.breakdownByStaff || {}).length} staff.`
        );
        if (onRefreshData) await onRefreshData();
      } else {
        toast.error("Auto-assign Failed", data.error || "Could not rebalance tasks.");
      }
    } catch {
      toast.error("Error", "Server error running autopilot rebalance.");
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Critical tasks due in 72 hours
  const criticalTasks = useMemo(() => {
    return tasks.filter((t) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED");
  }, [tasks]);

  // Clients with missing documents
  const documentChaserList = useMemo(() => {
    return tasks.filter((t) => (t.missingDocumentsCount || 0) > 0 && t.status !== "FILED_AND_COMPLETED");
  }, [tasks]);

  // Staff Workload Breakdown
  const staffWorkload = useMemo(() => {
    const map = new Map<string, { total: number; critical: number; completed: number; tier: number }>();
    activeStaff.forEach((s) => map.set(s.name, { total: 0, critical: 0, completed: 0, tier: s.tier }));

    tasks.forEach((t) => {
      const assigned = t.assignedTo || "Rahul Sharma (Article)";
      // Match by full name or first name
      let matchedKey = Array.from(map.keys()).find((k) => k === assigned || k.includes(assigned.split(" ")[0]));
      if (!matchedKey) {
        matchedKey = assigned;
        map.set(matchedKey, { total: 0, critical: 0, completed: 0, tier: 2 });
      }

      const current = map.get(matchedKey)!;
      current.total += 1;
      if (t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED") {
        current.critical += 1;
      }
      if (t.status === "FILED_AND_COMPLETED") {
        current.completed += 1;
      }
      map.set(matchedKey, current);
    });

    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [tasks, activeStaff]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesPriority = true;
      if (priorityFilter === "CRITICAL") {
        matchesPriority = t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED";
      } else if (priorityFilter === "HIGH") {
        matchesPriority = t.priority === "HIGH" && t.status !== "FILED_AND_COMPLETED";
      } else if (priorityFilter === "DOCS_AWAITED") {
        matchesPriority = (t.missingDocumentsCount || 0) > 0 && t.status !== "FILED_AND_COMPLETED";
      }

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const handleChaseWhatsApp = (task: ComplianceTask) => {
    const client = clients.find((c) => c.id === task.entityId);
    const phone = client?.primaryContact?.phone || "+91 98110 22345";
    
    openWhatsAppPreset(phone, "DOC_CHASE", {
      clientName: task.entityName,
      serviceName: task.title,
      period: task.period,
      deadline: task.dueDate,
      missingDocs: task.missingDocumentsList || ["Bank Statements", "Purchase Register Bills"],
    });
    toast.success("WhatsApp Chase Dispatched", `Sent missing documents alert to ${task.entityName}.`);
  };

  const handleConfirmReassign = async () => {
    if (!reassignModalTask) return;
    try {
      await onUpdateTask(reassignModalTask.id, {
        assignedTo: selectedStaff,
      });
      toast.success(
        "Task Reassigned",
        `Assigned ${reassignModalTask.title} (${reassignModalTask.entityName}) to ${selectedStaff}.`
      );
      setReassignModalTask(null);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      toast.error("Error", "Could not reassign task.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Ribbon */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-50 text-btred-logo">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Daily Statutory Task Center
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Statutory filing pipeline, article trainee allocation, and client document tracking.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshData && (
              <button
                onClick={() => onRefreshData()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Sync Live Tasks"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Task Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <div 
            onClick={() => setPriorityFilter("CRITICAL")}
            className="bg-red-50 hover:bg-red-100/70 border border-red-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-red-700 block">Due in 72h / Overdue</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-btred-logo">{criticalTasks.length}</span>
              <span className="text-[10px] text-red-600 font-bold">Sec 47 &bull; 234F Risk</span>
            </div>
          </div>

          <div 
            onClick={() => setPriorityFilter("DOCS_AWAITED")}
            className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Client Documents Awaited</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-800">{documentChaserList.length}</span>
              <span className="text-[10px] text-amber-600 font-bold">Needs Chase</span>
            </div>
          </div>

          <div 
            onClick={() => setPriorityFilter("ALL")}
            className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Active Tasks</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{tasks.length}</span>
              <span className="text-[10px] text-slate-500 font-bold">All Categories</span>
            </div>
          </div>

          <div 
            className="bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Filed &amp; Completed</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-800">
                {tasks.filter(t => t.status === "FILED_AND_COMPLETED").length}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold font-mono">This Cycle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Workload Allocation Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h3 className="font-black text-xs text-slate-900">Workload Allocation</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerAutopilot}
              disabled={isAutoAssigning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isAutoAssigning ? "animate-spin" : ""}`} />
              {isAutoAssigning ? "Balancing..." : "Rebalance Workload"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {staffWorkload.map((staff) => (
            <div key={staff.name} className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-800 truncate" title={staff.name}>
                  {staff.name.split(" ")[0]}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  staff.critical > 0 ? "bg-red-100 text-btred-logo animate-pulse" : "bg-slate-200 text-slate-700"
                }`}>
                  {staff.total} tasks
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Critical: <strong className={staff.critical > 0 ? "text-btred-logo" : ""}>{staff.critical}</strong></span>
                <span>Done: <strong className="text-emerald-700">{staff.completed}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Client, Task Title, Assigned Staff..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 shrink-0">
            <button
              onClick={() => setPriorityFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                priorityFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setPriorityFilter("CRITICAL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                priorityFilter === "CRITICAL" ? "bg-white text-btred-logo shadow-xs font-black" : "hover:text-slate-900"
              }`}
            >
              Due in 72h
            </button>
            <button
              onClick={() => setPriorityFilter("DOCS_AWAITED")}
              className={`px-2.5 py-1 rounded-lg transition ${
                priorityFilter === "DOCS_AWAITED" ? "bg-white text-amber-700 shadow-xs font-black" : "hover:text-slate-900"
              }`}
            >
              Docs Awaited
            </button>
          </div>
        </div>
      </div>

      {/* Main Task Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Client Entity</th>
                <th className="px-4 py-3">Statutory Obligation</th>
                <th className="px-4 py-3">Due Date &amp; Priority</th>
                <th className="px-4 py-3">Assigned Staff</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Fast Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-sm text-slate-800">Zero pending tasks under this filter</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const isCritical = t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED";
                  const isFiled = t.status === "FILED_AND_COMPLETED";
                  const hasMissingDocs = (t.missingDocumentsCount || 0) > 0;

                  return (
                    <tr key={t.id} className={`hover:bg-slate-50/80 transition ${isCritical ? "bg-red-50/20" : ""}`}>
                      {/* Col 1: Client Entity */}
                      <td className="px-4 py-3.5">
                        <span className="font-black text-slate-900 text-xs sm:text-[13px] block">
                          {t.entityName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {t.pan || t.gstin || "Statutory Assessee"}
                        </span>
                      </td>

                      {/* Col 2: Obligation */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            t.category === "GST"
                              ? "bg-blue-100 text-blue-800"
                              : t.category === "INCOME_TAX"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-purple-100 text-purple-800"
                          }`}>
                            {t.category}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{t.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{t.period}</span>
                      </td>

                      {/* Col 3: Due Date */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 block">{t.dueDate}</span>
                        <span className={`text-[10px] font-bold ${
                          isFiled ? "text-emerald-600" : isCritical ? "text-btred-logo animate-pulse" : "text-slate-500"
                        }`}>
                          {isFiled ? "Completed" : isCritical ? "Critical / 72h" : "Normal"}
                        </span>
                      </td>

                      {/* Col 4: Assigned Staff */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setReassignModalTask(t)}
                          className="text-left group flex items-center gap-1 hover:text-red-700 transition"
                          title="Click to reassign staff member"
                        >
                          <span className="font-bold text-slate-800 group-hover:underline block">
                            {t.assignedTo || "Rahul Sharma"}
                          </span>
                          <span className="text-[10px] text-slate-400">✎</span>
                        </button>
                      </td>

                      {/* Col 5: Status */}
                      <td className="px-4 py-3.5">
                        {isFiled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>FILED</span>
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-btred-logo border border-red-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-btred-logo" />
                            <span>DUE IN 72H</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>{t.status.replace(/_/g, " ")}</span>
                          </span>
                        )}
                      </td>

                      {/* Col 6: Fast Action */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isFiled ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                              Done
                            </span>
                          ) : hasMissingDocs ? (
                            <button
                              onClick={() => handleChaseWhatsApp(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                              title="Send WhatsApp document reminder to client"
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onUpdateTask(t.id, { status: "FILED_AND_COMPLETED" });
                                toast.success("Task Filed", `${t.title} marked completed.`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition cursor-pointer"
                              title="Mark Return / Task as Filed & Completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                              <span>Mark Filed</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Reassignment Modal */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div 
            onClick={() => setReassignModalTask(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">Reassign Task Responsibility</h3>
                <p className="text-[11px] text-slate-500">{reassignModalTask.entityName}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1">
              <span className="text-slate-500">Task Obligation:</span>
              <strong className="text-slate-900 block font-sans">{reassignModalTask.title}</strong>
              <span className="text-[10px] text-slate-400 font-mono">Due Date: {reassignModalTask.dueDate}</span>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-600 block">
                Select Article Trainee / Staff
              </label>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {activeStaff.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => setSelectedStaff(m.name)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                      selectedStaff === m.name
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700 font-mono">
                      Tier {m.tier}
                    </span>
                    {selectedStaff === m.name && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setReassignModalTask(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReassign}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-btred-logo text-white shadow-xs transition"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
