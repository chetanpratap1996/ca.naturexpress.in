"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Lock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Building2,
  Layers,
  Scale,
  Award
} from "lucide-react";
import { ComplianceTask, ClientEntity, PortalCredential, DscRecord, WorkflowStatus } from "@/lib/types";
import { ContextualFilingDrawer } from "@/components/shared/ContextualFilingDrawer";
import { toast } from "@/components/shared/ToastNotification";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";

interface ItrAuditMatrixProps {
  tasks: ComplianceTask[];
  clients: ClientEntity[];
  credentials: PortalCredential[];
  dscTokens: DscRecord[];
  onUpdateTask: (taskId: string, data: Partial<ComplianceTask>) => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const ItrAuditMatrix: React.FC<ItrAuditMatrixProps> = ({
  tasks,
  clients,
  credentials,
  dscTokens,
  onUpdateTask,
  onRefreshData,
}) => {
  const { selectedClient, isFirmWideView } = useClientContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "FILED" | "CRITICAL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "INCOME_TAX" | "TAX_AUDIT">("ALL");
  const [selectedAy, setSelectedAy] = useState<string>("ALL");
  const [activeFilingTask, setActiveFilingTask] = useState<ComplianceTask | null>(null);
  const [activeClient, setActiveClient] = useState<ClientEntity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter only Direct Tax & Audit tasks, scoped to client if selected
  const itTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isTaxCategory = t.category === "INCOME_TAX" || t.category === "TAX_AUDIT";
      if (!isTaxCategory) return false;
      if (selectedClient && !isFirmWideView) {
        return (
          t.entityId === selectedClient.id ||
          t.entityName.toLowerCase() === selectedClient.name.toLowerCase() ||
          t.groupId === selectedClient.groupId
        );
      }
      return true;
    });
  }, [tasks, selectedClient, isFirmWideView]);

  // Derived periods for filter dropdown
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    itTasks.forEach((t) => {
      if (t.period) set.add(t.period);
    });
    return Array.from(set);
  }, [itTasks]);

  // Filtered task items
  const filteredTasks = useMemo(() => {
    return itTasks.filter((t) => {
      const client = clients.find((c) => c.id === t.entityId);
      const matchesSearch =
        !searchQuery ||
        t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client?.pan && client.pan.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === "ALL" || t.category === categoryFilter;

      const matchesPeriod = selectedAy === "ALL" || t.period === selectedAy;

      let matchesStatus = true;
      if (statusFilter === "FILED") {
        matchesStatus = t.status === "FILED_AND_COMPLETED";
      } else if (statusFilter === "PENDING") {
        matchesStatus = t.status !== "FILED_AND_COMPLETED";
      } else if (statusFilter === "CRITICAL") {
        matchesStatus = t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED";
      }

      return matchesSearch && matchesCategory && matchesPeriod && matchesStatus;
    });
  }, [itTasks, clients, searchQuery, categoryFilter, selectedAy, statusFilter]);

  // Direct Tax Metrics computation
  const metrics = useMemo(() => {
    const total = itTasks.length;
    const filed = itTasks.filter((t) => t.status === "FILED_AND_COMPLETED").length;
    const pending = total - filed;
    const audits = itTasks.filter((t) => t.category === "TAX_AUDIT").length;
    const critical = itTasks.filter(
      (t) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
    ).length;
    const rate = total > 0 ? Math.round((filed / total) * 100) : 100;

    return { total, filed, pending, audits, critical, rate };
  }, [itTasks]);

  const handleOpenFiling = (task: ComplianceTask) => {
    const client = clients.find((c) => c.id === task.entityId) || {
      id: task.entityId,
      groupId: task.groupId,
      groupName: "Default Group",
      name: task.entityName,
      type: "PVT_LTD",
      pan: task.pan || "AABCA8891D",
      gstin: task.gstin || "07AABCA8891D1Z8",
      turnoverCr: 15.0,
      partnerInCharge: "CA Gunjan Jain",
      assignedArticle: task.assignedTo || "Kriti Jain",
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

  const handleFilingCompleted = async (taskId: string, arnOrAck: string) => {
    await onUpdateTask(taskId, {
      status: "FILED_AND_COMPLETED" as WorkflowStatus,
      arnNumber: arnOrAck,
      filingDate: new Date().toISOString().split("T")[0],
    });

    if (onRefreshData) {
      await onRefreshData();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Direct Tax &bull; AY 2026-27 &bull; Section 44AB
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-5 h-5 text-red-600" />
              Income Tax &amp; Audit Operations Matrix
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <UniversalClientSelector variant="compact" />
            {onRefreshData && (
              <button
                onClick={() => onRefreshData()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs transition"
                title="Sync Live Records"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div 
            onClick={() => setStatusFilter("ALL")}
            className="bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-lg cursor-pointer transition shadow-xs"
          >
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Obligations</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">{metrics.total}</span>
              <span className="text-[10px] text-slate-500 font-medium">Assessees</span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("FILED")}
            className="bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-200 p-3 rounded-lg cursor-pointer transition shadow-xs"
          >
            <span className="text-[10px] uppercase font-semibold text-emerald-700 block">ITR &amp; 3CD Filed</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-800">{metrics.filed}</span>
              <span className="text-[10px] text-emerald-600 font-semibold font-mono">{metrics.rate}% compliant</span>
            </div>
          </div>

          <div 
            onClick={() => setCategoryFilter("TAX_AUDIT")}
            className="bg-purple-50/50 hover:bg-purple-100/60 border border-purple-200 p-3 rounded-lg cursor-pointer transition shadow-xs"
          >
            <span className="text-[10px] uppercase font-semibold text-purple-700 block">Sec 44AB Audits</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-purple-800">{metrics.audits}</span>
              <span className="text-[10px] text-purple-600 font-semibold">Form 3CD</span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("CRITICAL")}
            className="bg-red-50/50 hover:bg-red-100/60 border border-red-200 p-3 rounded-lg cursor-pointer transition shadow-xs"
          >
            <span className="text-[10px] uppercase font-semibold text-red-700 block">Critical Deadlines</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-red-700">{metrics.critical}</span>
              <span className="text-[10px] text-red-600 font-semibold">Sec 234F / 271B</span>
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
            placeholder="Search by Client Name, PAN..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
          {/* Category Toggle: All / Income Tax / Tax Audit */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 shrink-0">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                categoryFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              All Direct Tax
            </button>
            <button
              onClick={() => setCategoryFilter("INCOME_TAX")}
              className={`px-2.5 py-1 rounded-lg transition ${
                categoryFilter === "INCOME_TAX" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              ITR Returns
            </button>
            <button
              onClick={() => setCategoryFilter("TAX_AUDIT")}
              className={`px-2.5 py-1 rounded-lg transition ${
                categoryFilter === "TAX_AUDIT" ? "bg-white text-purple-700 shadow-xs font-black" : "hover:text-slate-900"
              }`}
            >
              Form 3CD Audits
            </button>
          </div>

          {/* Period Dropdown */}
          {availablePeriods.length > 0 && (
            <select
              value={selectedAy}
              onChange={(e) => setSelectedAy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none shrink-0"
            >
              <option value="ALL">All AY Periods</option>
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
                <th className="px-4 py-3">Assessee Entity &amp; PAN</th>
                <th className="px-4 py-3">Statutory Obligation &amp; Form</th>
                <th className="px-4 py-3">Statutory Due Date</th>
                <th className="px-4 py-3">115BAC Regime Insight</th>
                <th className="px-4 py-3">Status &amp; Ack</th>
                <th className="px-4 py-3 text-center">In-Context Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-sm text-slate-800">No Direct Tax tasks matching this filter</p>
                    <p className="text-xs text-slate-400 mt-0.5">All income tax and audit filings in this view are up to date.</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const client = clients.find((c) => c.id === t.entityId);
                  const isFiled = t.status === "FILED_AND_COMPLETED";
                  const isCritical = t.priority === "CRITICAL" && !isFiled;
                  const isAudit = t.category === "TAX_AUDIT";
                  const pan = client?.pan || t.pan || "AABCA8891D";

                  return (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-slate-50/80 transition ${
                        isCritical ? "bg-red-50/20" : ""
                      }`}
                    >
                      {/* Column 1: Client Name & PAN */}
                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900 text-xs sm:text-[13px]">{t.entityName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                            {pan}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({client?.type ? client.type.replace(/_/g, " ") : "PVT LTD"})
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Return Obligation & Form */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isAudit ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {isAudit ? "Form 3CD" : "ITR"}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{t.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{t.period}</span>
                      </td>

                      {/* Column 3: Due Date */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 block">{t.dueDate}</span>
                        <span className={`text-[10px] font-bold ${
                          isFiled ? "text-emerald-600" : isCritical ? "text-red-600 animate-pulse" : "text-slate-500"
                        }`}>
                          {isFiled ? "Filed on time" : isCritical ? "Overdue / Sec 234F" : "Sec 139(1) window"}
                        </span>
                      </td>

                      {/* Column 4: 115BAC Insight */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                          New Regime Opted
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                          Saves ₹34,200 vs Old
                        </span>
                      </td>

                      {/* Column 5: Status & Ack */}
                      <td className="px-4 py-3.5">
                        {isFiled ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>FILED</span>
                            </span>
                            {t.arnNumber && (
                              <span className="block font-mono text-[9px] text-slate-500 truncate max-w-[140px]" title={t.arnNumber}>
                                Ack: {t.arnNumber}
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
                            <span>IN PREPARATION</span>
                          </span>
                        )}
                      </td>

                      {/* Column 6: Action Button */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenFiling(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 mx-auto ${
                            isFiled
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : isAudit
                              ? "bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-sm shadow-purple-600/25 active:scale-95"
                              : "bg-gradient-to-r from-red-600 to-btred-logo hover:from-red-700 hover:to-red-700 text-white shadow-sm shadow-red-500/25 active:scale-95"
                          }`}
                          title={isFiled ? "View ITR-V Acknowledgment & Sync details" : "Open In-Context Direct Tax Filing Drawer"}
                        >
                          {isFiled ? (
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                          <span>{isFiled ? "View Ack" : isAudit ? "Audit 3CD →" : "File ITR →"}</span>
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
