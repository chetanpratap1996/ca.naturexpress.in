"use client";

import React, { useState, useMemo } from "react";
import { ComplianceTask, WorkflowStatus } from "@/lib/types";
import { 
  Users, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle, 
  UserCheck, 
  Sparkles,
  TrendingUp,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";

interface WorkloadMatrixProps {
  tasks: ComplianceTask[];
  onReassignTask?: (taskId: string, newArticle: string) => Promise<void> | void;
}

export interface StaffWorkloadSummary {
  name: string;
  role: string;
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  criticalTasksCount: number;
  overdueTasksCount: number;
  dailyPenaltyUnderCustody: number;
  capacityScore: number; // 0-100%
  status: "OPTIMAL" | "HEAVY" | "OVERLOADED" | "AVAILABLE";
}

const DEFAULT_STAFF_MEMBERS = [
  { name: "Kriti Jain (Article)", role: "Senior Article Trainee (Corporate Audit & Direct Tax)" },
  { name: "Aman Verma (Article)", role: "Article Trainee (GST & TDS Reconciliations)" },
  { name: "Rahul Sharma (Article)", role: "Article Trainee (Bookkeeping & Bank OCR)" },
  { name: "Pooja Mehta (Article)", role: "Junior Article Trainee (Secretarial & MCA Filings)" }
];

export const WorkloadMatrix: React.FC<WorkloadMatrixProps> = ({
  tasks = [],
  onReassignTask
}) => {
  const [selectedStaff, setSelectedStaff] = useState<string>("ALL");
  const [reassignModalTask, setReassignModalTask] = useState<ComplianceTask | null>(null);
  const [targetArticle, setTargetArticle] = useState<string>("Aman Verma (Article)");
  const [isReassigning, setIsReassigning] = useState(false);
  const [dynamicStaffList, setDynamicStaffList] = useState<{ name: string; role: string }[]>([]);

  React.useEffect(() => {
    fetch("/api/staff")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.staff)) {
          const active = data.staff
            .filter((s: any) => s.status === "ACTIVE")
            .map((s: any) => ({
              name: `${s.fullName} (${s.role === "MANAGING_PARTNER" ? "Partner" : s.role === "PAID_CHARTERED_ACCOUNTANT" ? "CA" : "Article"})`,
              role: s.role === "MANAGING_PARTNER" ? "Managing Partner (FCA)" : s.role === "PAID_CHARTERED_ACCOUNTANT" ? "Senior Paid CA" : `Article Trainee (Tier ${s.competencyTier})`,
            }));
          if (active.length > 0) setDynamicStaffList(active);
        }
      })
      .catch((err) => console.warn("Workload staff fetch error:", err));
  }, []);

  // Compute workload summaries
  const staffSummaries = useMemo<StaffWorkloadSummary[]>(() => {
    const map = new Map<string, StaffWorkloadSummary>();

    const seedList = dynamicStaffList.length > 0 ? dynamicStaffList : DEFAULT_STAFF_MEMBERS;

    // Seed default staff
    seedList.forEach((s) => {
      map.set(s.name, {
        name: s.name,
        role: s.role,
        totalTasks: 0,
        completedTasks: 0,
        openTasks: 0,
        criticalTasksCount: 0,
        overdueTasksCount: 0,
        dailyPenaltyUnderCustody: 0,
        capacityScore: 0,
        status: "AVAILABLE"
      });
    });

    const now = new Date();

    tasks.forEach((t) => {
      const staffName = t.assignedTo || "Kriti Jain (Article)";
      if (!map.has(staffName)) {
        map.set(staffName, {
          name: staffName,
          role: "Practice Trainee",
          totalTasks: 0,
          completedTasks: 0,
          openTasks: 0,
          criticalTasksCount: 0,
          overdueTasksCount: 0,
          dailyPenaltyUnderCustody: 0,
          capacityScore: 0,
          status: "AVAILABLE"
        });
      }

      const item = map.get(staffName)!;
      item.totalTasks += 1;
      if (t.status === "FILED_AND_COMPLETED") {
        item.completedTasks += 1;
      } else {
        item.openTasks += 1;
        item.dailyPenaltyUnderCustody += (t.accruingDailyPenalty || 0);

        const due = new Date(t.dueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 0) {
          item.overdueTasksCount += 1;
        } else if (diffDays <= 3 || t.priority === "CRITICAL") {
          item.criticalTasksCount += 1;
        }
      }
    });

    // Compute capacity scores
    return Array.from(map.values()).map((s) => {
      // 1 open task = 10% capacity, critical = 20%, overdue = 25%
      const rawScore = (s.openTasks * 10) + (s.criticalTasksCount * 10) + (s.overdueTasksCount * 15);
      const capacityScore = Math.min(100, Math.max(10, rawScore));
      let status: StaffWorkloadSummary["status"] = "OPTIMAL";
      if (capacityScore >= 85) status = "OVERLOADED";
      else if (capacityScore >= 60) status = "HEAVY";
      else if (capacityScore <= 25) status = "AVAILABLE";

      return {
        ...s,
        capacityScore,
        status
      };
    });
  }, [tasks]);

  const handleReassign = async () => {
    if (!reassignModalTask || !onReassignTask) return;
    setIsReassigning(true);
    try {
      await onReassignTask(reassignModalTask.id, targetArticle);
      toast.success(
        "Task Reassigned",
        `"${reassignModalTask.title}" transferred to ${targetArticle}.`
      );
      setReassignModalTask(null);
    } catch (err: any) {
      toast.error("Reassignment Error", err?.message || "Failed to reassign task.");
    } finally {
      setIsReassigning(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (selectedStaff === "ALL") return tasks.filter(t => t.status !== "FILED_AND_COMPLETED");
    return tasks.filter(t => t.assignedTo === selectedStaff && t.status !== "FILED_AND_COMPLETED");
  }, [tasks, selectedStaff]);

  return (
    <div className="space-y-6">
      {/* Top Staff Heatmap Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffSummaries.map((staff) => {
          const isSelected = selectedStaff === staff.name;
          const statusBadge = {
            OVERLOADED: "bg-red-100 text-red-900 border-red-300 font-black",
            HEAVY: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
            OPTIMAL: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
            AVAILABLE: "bg-blue-100 text-blue-900 border-blue-300 font-bold"
          }[staff.status];

          return (
            <div
              key={staff.name}
              onClick={() => setSelectedStaff(isSelected ? "ALL" : staff.name)}
              className={`rounded-2xl sm:rounded-3xl border p-4 sm:p-5 transition cursor-pointer relative ${
                isSelected
                  ? "bg-purple-50/80 border-purple-400 shadow-md ring-2 ring-purple-400/20"
                  : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs text-slate-900 truncate">
                      {staff.name.replace(" (Article)", "")}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border ${statusBadge}`}>
                      {staff.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{staff.role.split("(")[1]?.replace(")", "") || staff.role}</p>
                </div>

                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Capacity Load</span>
                  <span className={staff.capacityScore >= 80 ? "text-red-600 font-black" : "text-slate-700"}>
                    {staff.capacityScore}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      staff.capacityScore >= 80
                        ? "bg-red-500"
                        : staff.capacityScore >= 50
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${staff.capacityScore}%` }}
                  />
                </div>
              </div>

              {/* Task Counts Summary */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Open</span>
                  <span className="font-black text-slate-900">{staff.openTasks}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">&lt;72h</span>
                  <span className="font-black text-amber-700">{staff.criticalTasksCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Overdue</span>
                  <span className="font-black text-red-600">{staff.overdueTasksCount}</span>
                </div>
              </div>

              {staff.dailyPenaltyUnderCustody > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-rose-700 font-mono font-bold flex items-center justify-between">
                  <span>Accruing Penalty:</span>
                  <span>₹{staff.dailyPenaltyUnderCustody}/day</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Staff Active Tasks Table with 1-Click Reassignment */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-700" />
              <span>Active Compliance Workload Queue</span>
              {selectedStaff !== "ALL" && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                  Filtered: {selectedStaff}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Assigned tasks in progress. Click &ldquo;Reassign&rdquo; to re-balance from overloaded articles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredTasks.length} open statutory engagements
            </span>
            {selectedStaff !== "ALL" && (
              <button
                onClick={() => setSelectedStaff("ALL")}
                className="text-xs font-bold text-btred-logo hover:underline ml-2"
              >
                Show All Articles
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Assessee Legal Entity</th>
                <th className="p-3">Statutory Obligation / Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Assigned Staff</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Re-balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-xs text-slate-500">
                    No active tasks assigned in this filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{t.entityName}</div>
                      {t.pan && <div className="text-[10px] text-slate-400 font-mono font-normal">PAN: {t.pan}</div>}
                    </td>
                    <td className="p-3 text-slate-800">
                      <div className="font-bold">{t.title}</div>
                      <div className="text-[10px] text-slate-500">{t.period}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[9px] font-bold bg-slate-100 text-slate-700">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {t.dueDate}
                    </td>
                    <td className="p-3 font-bold text-purple-900">
                      {t.assignedTo}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setReassignModalTask(t)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 font-bold text-[11px] border border-slate-200 transition"
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1-Click Reassignment Modal */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Staff Workload Balancer
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">Reassign Statutory Engagement</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transfer &ldquo;{reassignModalTask.title}&rdquo; for {reassignModalTask.entityName} to another article trainee.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Assigned Staff</label>
                <div className="px-3 py-2 rounded-xl bg-slate-100 font-bold text-xs text-slate-800 font-mono">
                  {reassignModalTask.assignedTo}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Assignment To</label>
                <select
                  value={targetArticle}
                  onChange={(e) => setTargetArticle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {DEFAULT_STAFF_MEMBERS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} — {s.role.split("(")[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignModalTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReassigning}
                onClick={handleReassign}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                {isReassigning ? "Transferring..." : "Confirm Reassignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
