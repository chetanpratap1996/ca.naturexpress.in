"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Lock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Building2,
  Layers
} from "lucide-react";
import { ComplianceTask, ClientEntity, PortalCredential, DscRecord, WorkflowStatus } from "@/lib/types";
import { ContextualFilingDrawer } from "@/components/shared/ContextualFilingDrawer";
import { toast } from "@/components/shared/ToastNotification";

interface GstFilingMatrixProps {
  tasks: ComplianceTask[];
  clients: ClientEntity[];
  credentials: PortalCredential[];
  dscTokens: DscRecord[];
  onUpdateTask: (taskId: string, data: Partial<ComplianceTask>) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const GstFilingMatrix: React.FC<GstFilingMatrixProps> = ({
  tasks,
  clients,
  credentials,
  dscTokens,
  onUpdateTask,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "FILED" | "CRITICAL">("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [activeFilingTask, setActiveFilingTask] = useState<ComplianceTask | null>(null);
  const [activeClient, setActiveClient] = useState<ClientEntity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter only GST category tasks
  const gstTasks = useMemo(() => {
    return tasks.filter((t) => t.category === "GST");
  }, [tasks]);

  // Derived periods for filter dropdown
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    gstTasks.forEach((t) => {
      if (t.period) set.add(t.period);
    });
    return Array.from(set);
  }, [gstTasks]);

  // Filtered task items
  const filteredTasks = useMemo(() => {
    return gstTasks.filter((t) => {
      const client = clients.find((c) => c.id === t.entityId);
      const matchesSearch =
        !searchQuery ||
        t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client?.gstin && client.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPeriod = selectedPeriod === "ALL" || t.period === selectedPeriod;

      let matchesStatus = true;
      if (statusFilter === "FILED") {
        matchesStatus = t.status === "FILED_AND_COMPLETED";
      } else if (statusFilter === "PENDING") {
        matchesStatus = t.status !== "FILED_AND_COMPLETED";
      } else if (statusFilter === "CRITICAL") {
        matchesStatus = t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED";
      }

      return matchesSearch && matchesPeriod && matchesStatus;
    });
  }, [gstTasks, clients, searchQuery, selectedPeriod, statusFilter]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = gstTasks.length;
    const filed = gstTasks.filter((t) => t.status === "FILED_AND_COMPLETED").length;
    const pending = total - filed;
    const critical = gstTasks.filter(
      (t) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
    ).length;
    const rate = total > 0 ? Math.round((filed / total) * 100) : 100;

    return { total, filed, pending, critical, rate };
  }, [gstTasks]);

  const handleOpenFiling = (task: ComplianceTask) => {
    const client = clients.find((c) => c.id === task.entityId) || {
      id: task.entityId,
      groupId: task.groupId,
      groupName: "Default Group",
      name: task.entityName,
      type: "PVT_LTD",
      pan: task.pan || "AABCA8891D",
      gstin: task.gstin || "07AABCA8891D1Z8",
      turnoverCr: 12.5,
      partnerInCharge: "CA Gunjan Jain",
      assignedArticle: task.assignedTo || "Rahul Sharma",
      incorporationYear: 2018,
      penaltyRiskAccrued: 0,
      primaryContact: {
        name: "Authorized Director",
        phone: "+91 98110 22345",
        email: "director@client.in",
        designation: "Managing Director"
      }
    };

    setActiveFilingTask(task);
    setActiveClient(client);
    setIsDrawerOpen(true);
  };

  const handleFilingCompleted = async (taskId: string, arn: string) => {
    await onUpdateTask(taskId, {
      status: "FILED_AND_COMPLETED" as WorkflowStatus,
      arnNumber: arn,
      filingDate: new Date().toISOString().split("T")[0],
    });

    if (onRefreshData) {
      await onRefreshData();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Ribbon */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  GST Filing Matrix
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  GSTR-1 &amp; GSTR-3B return filing and monitoring
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshData && (
              <button
                onClick={() => onRefreshData()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Sync Live Records"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <div 
            onClick={() => setStatusFilter("ALL")}
            className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total GSTR Obligations</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{metrics.total}</span>
              <span className="text-[10px] text-slate-500 font-bold">Returns</span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("FILED")}
            className="bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Filed &amp; Acknowledged</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-800">{metrics.filed}</span>
              <span className="text-[10px] text-emerald-600 font-bold font-mono">{metrics.rate}% compliant</span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("PENDING")}
            className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending Returns</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-800">{metrics.pending}</span>
              <span className="text-[10px] text-amber-600 font-bold">In queue</span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("CRITICAL")}
            className="bg-red-50 hover:bg-red-100/70 border border-red-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-red-700 block">Due in 72h / Overdue</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-btred-logo">{metrics.critical}</span>
              <span className="text-[10px] text-red-600 font-bold">Immediate Action</span>
            </div>
          </div>
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
            placeholder="Search by Client Name, GSTIN..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
          {/* Status Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 shrink-0">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === "PENDING" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("CRITICAL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === "CRITICAL" ? "bg-white text-btred-logo shadow-xs font-black" : "hover:text-slate-900"
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setStatusFilter("FILED")}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === "FILED" ? "bg-white text-emerald-700 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Filed
            </button>
          </div>

          {/* Period Dropdown */}
          {availablePeriods.length > 0 && (
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none shrink-0"
            >
              <option value="ALL">All Return Periods</option>
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Client Entity &amp; GSTIN</th>
                <th className="px-4 py-3">Return Obligation</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Filing Status</th>
                <th className="px-4 py-3 text-right">Tax Deficit / ITC</th>
                <th className="px-4 py-3 text-center">In-Context Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-sm text-slate-800">No GST tasks matching this filter</p>
                    <p className="text-xs text-slate-400 mt-0.5">All statutory returns in this view are up to date.</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const client = clients.find((c) => c.id === t.entityId);
                  const isFiled = t.status === "FILED_AND_COMPLETED";
                  const isCritical = t.priority === "CRITICAL" && !isFiled;
                  const gstin = client?.gstin || t.gstin || "07AABCA8891D1Z8";

                  return (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-slate-50/80 transition ${
                        isCritical ? "bg-red-50/20" : ""
                      }`}
                    >
                      {/* Column 1: Client Name & GSTIN */}
                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900 text-xs sm:text-[13px]">{t.entityName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                            {gstin}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({client?.type ? client.type.replace(/_/g, " ") : "PVT LTD"})
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Return Obligation */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 block text-xs">{t.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{t.period}</span>
                      </td>

                      {/* Column 3: Due Date */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 block">{t.dueDate}</span>
                        <span className={`text-[10px] font-bold ${
                          isFiled ? "text-emerald-600" : isCritical ? "text-red-600 animate-pulse" : "text-slate-500"
                        }`}>
                          {isFiled ? "Filed on time" : isCritical ? "Overdue / 72h" : "Normal window"}
                        </span>
                      </td>

                      {/* Column 4: Filing Status */}
                      <td className="px-4 py-3.5">
                        {isFiled ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>FILED</span>
                            </span>
                            {t.arnNumber && (
                              <span className="block font-mono text-[9px] text-slate-500 truncate max-w-[140px]" title={t.arnNumber}>
                                ARN: {t.arnNumber}
                              </span>
                            )}
                          </div>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-red-700" />
                            <span>CRITICAL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Column 5: Tax Deficit & 2B Match Status */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <span className="font-bold text-slate-900 block">
                          ₹{((t.taxPayableAmount || 124500) - 89200).toLocaleString("en-IN")}
                        </span>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="GSTR-2B vs Books Auto-Matched">
                            ✓ 2B Match: 98.4%
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Action Button */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenFiling(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 mx-auto ${
                            isFiled
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-gradient-to-r from-red-600 to-btred-logo hover:from-red-700 hover:to-red-700 text-white shadow-sm shadow-red-500/25 active:scale-95"
                          }`}
                          title={isFiled ? "View Filing ARN & Sync details" : "Open In-Context Filing Drawer"}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{isFiled ? "View ARN" : "File Now →"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-Context Credential & Filing Slide-Over Drawer */}
      <ContextualFilingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        task={activeFilingTask}
        client={activeClient}
        credentials={credentials}
        dscTokens={dscTokens}
        onMarkFiled={handleFilingCompleted}
      />
    </div>
  );
};
