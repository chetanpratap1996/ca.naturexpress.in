"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Lock,
  RefreshCw,
  Plus,
  Globe,
  Layers,
  Send,
  Download,
} from "lucide-react";
import {
  ComplianceTask,
  ClientEntity,
  PortalCredential,
  DscRecord,
  WorkflowStatus,
} from "@/lib/types";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
const ContextualFilingDrawer = dynamic(() => import("@/components/shared/ContextualFilingDrawer").then((m) => m.ContextualFilingDrawer), { ssr: false });
import { formatCurrencyINR } from "@/lib/utils";
import { getPeriodsForFy, gstFetchJson } from "@/lib/gst/gstClientFetch";
import { toast } from "@/components/shared/ToastNotification";

interface GstFilingMatrixProps {
  tasks: ComplianceTask[];
  clients: ClientEntity[];
  credentials: PortalCredential[];
  dscTokens: DscRecord[];
  onUpdateTask: (taskId: string, data: Partial<ComplianceTask>) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  onNavigateTab?: (tabId: string) => void;
}

const MONTH_INDEX: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function computeStatutoryDueDate(periodLabel: string, dayOfMonth: number): string {
  const parts = (periodLabel || "").trim().split(/\s+/);
  if (parts.length !== 2) return new Date().toISOString().split("T")[0];
  const mIdx = MONTH_INDEX[parts[0].toLowerCase()];
  const yr = parseInt(parts[1], 10);
  if (mIdx === undefined || isNaN(yr)) return new Date().toISOString().split("T")[0];
  const next = new Date(yr, mIdx + 1, dayOfMonth);
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${mm}-${dd}`;
}

export const GstFilingMatrix: React.FC<GstFilingMatrixProps> = ({
  tasks,
  clients,
  credentials,
  dscTokens,
  onUpdateTask,
  onRefreshData,
  onNavigateTab,
}) => {
  const {
    selectedClient,
    selectedGstin,
    selectedFy,
    selectedPeriod,
    isFirmWideView,
  } = useClientContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "FILED" | "CRITICAL">("ALL");
  const [returnTypeFilter, setReturnTypeFilter] = useState<
    "ALL" | "GSTR-1" | "GSTR-3B" | "CMP-08" | "GSTR-9"
  >("ALL");
  const [filterPeriod, setFilterPeriod] = useState<string>("ALL");
  const [activeFilingTask, setActiveFilingTask] = useState<ComplianceTask | null>(null);
  const [activeClient, setActiveClient] = useState<ClientEntity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"TASKS" | "PIPELINE">("TASKS");
  const [isSyncingPortal, setIsSyncingPortal] = useState(false);
  const [pipelinePeriod, setPipelinePeriod] = useState<string>(selectedPeriod || "");
  const [pipelineRows, setPipelineRows] = useState<any[]>([]);
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(false);

  const fyPeriods = useMemo(() => getPeriodsForFy(selectedFy), [selectedFy]);
  const effectivePipelinePeriod = pipelinePeriod || selectedPeriod || fyPeriods[0] || "";

  const loadFirmPipeline = useCallback(async () => {
    if (!effectivePipelinePeriod) return;
    setIsLoadingPipeline(true);
    try {
      const { ok, data } = await gstFetchJson<any>("/api/gst/sync-portal", {
        method: "POST",
        body: JSON.stringify({
          action: "FIRM_PIPELINE",
          fy: selectedFy,
          period: effectivePipelinePeriod,
        }),
      });
      if (ok && data?.success) {
        setPipelineRows(data.rows || []);
      }
    } finally {
      setIsLoadingPipeline(false);
    }
  }, [selectedFy, effectivePipelinePeriod]);

  const handleExportPipelineExcel = async () => {
    if (pipelineRows.length === 0) {
      toast.info("No Rows to Export", "No pipeline data to download.");
      return;
    }
    const { downloadWorkbookXlsx } = await import("@/lib/parsers/excelGstParser");
    downloadWorkbookXlsx(
      `Firm_GST_Pipeline_${effectivePipelinePeriod.replace(/\s+/g, "_")}.xlsx`,
      [
        {
          name: "GST_Pipeline",
          rows: pipelineRows.map((r) => ({
            EntityName: r.entityName,
            GSTIN: r.gstin,
            Frequency: r.filingFrequency,
            GSTR1_Status: r.gstr1Status,
            GSTR1_Tax: r.gstr1OutwardTax || 0,
            Eligible_2B_ITC: r.eligibleItc || 0,
            ExceptionsCount: r.exceptionsCount || 0,
            CashDue: r.cashPayable || 0,
            GSTR3B_Status: r.gstr3bStatus,
            GSTR3B_ARN: r.gstr3bArn || "",
            ContactPhone: r.contactPhone || "",
            ContactName: r.contactName || "",
          })),
        },
      ]
    );
    toast.success("Pipeline Exported", "Firm-wide GST filing tracker Excel generated.");
  };

  useEffect(() => {
    if (viewMode === "PIPELINE") {
      loadFirmPipeline();
    }
  }, [viewMode, loadFirmPipeline]);

  const handleSyncGstnPortal = async () => {
    setIsSyncingPortal(true);
    try {
      const { ok, data } = await gstFetchJson<any>("/api/gst/sync-portal", {
        method: "POST",
        body: JSON.stringify({
          action: "SYNC_FILING_STATUS",
          fy: selectedFy,
          gstin: !isFirmWideView && selectedGstin ? selectedGstin : undefined,
        }),
      });
      if (!ok || !data?.success) {
        toast.warning("GSTN Sync Warning", data?.error || "Could not fetch filing status from GSTN API.");
        return;
      }
      toast.success(
        "GSTN Status Synced",
        `Checked ${data.syncedGstins} GSTIN(s), auto-updated ${data.updatedTasks} task ARN(s).`
      );
      if (onRefreshData) await onRefreshData();
      if (viewMode === "PIPELINE") await loadFirmPipeline();
    } catch (err: any) {
      toast.error("Sync Error", err?.message || "Failed to sync from GSTN.");
    } finally {
      setIsSyncingPortal(false);
    }
  };

  // Filter GST tasks scoped to active client / GSTIN
  const gstTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.category !== "GST") return false;
      if (selectedClient && !isFirmWideView) {
        if (t.entityId !== selectedClient.id) return false;
        if (selectedGstin && t.gstin && t.gstin.toUpperCase() !== selectedGstin.toUpperCase()) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedClient, selectedGstin, isFirmWideView]);

  const availablePeriods = useMemo(() => {
    const set = new Set<string>(fyPeriods);
    gstTasks.forEach((t) => {
      if (t.period) set.add(t.period);
    });
    return Array.from(set);
  }, [gstTasks, fyPeriods]);

  const filteredTasks = useMemo(() => {
    return gstTasks.filter((t) => {
      const client = clients.find((c) => c.id === t.entityId);
      const gstin = t.gstin || client?.gstin || "";
      const matchesSearch =
        !searchQuery ||
        t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gstin.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPeriod = filterPeriod === "ALL" || t.period === filterPeriod;

      let matchesType = true;
      if (returnTypeFilter === "GSTR-1") matchesType = /gstr-?1|iff/i.test(t.title);
      else if (returnTypeFilter === "GSTR-3B") matchesType = /gstr-?3b/i.test(t.title);
      else if (returnTypeFilter === "CMP-08") matchesType = /cmp-?08/i.test(t.title);
      else if (returnTypeFilter === "GSTR-9") matchesType = /gstr-?9/i.test(t.title);

      let matchesStatus = true;
      if (statusFilter === "FILED") matchesStatus = t.status === "FILED_AND_COMPLETED";
      else if (statusFilter === "PENDING") matchesStatus = t.status !== "FILED_AND_COMPLETED";
      else if (statusFilter === "CRITICAL") {
        matchesStatus = t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED";
      }

      return matchesSearch && matchesPeriod && matchesType && matchesStatus;
    });
  }, [gstTasks, clients, searchQuery, filterPeriod, returnTypeFilter, statusFilter]);

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
    const matchedClient = clients.find((c) => c.id === task.entityId) || null;
    if (!matchedClient) {
      toast.error("Client Not Found", "Unable to locate client entity record for this task.");
      return;
    }
    setActiveFilingTask(task);
    setActiveClient(matchedClient);
    setIsDrawerOpen(true);
  };

  const handleFilingCompleted = async (
    taskId: string,
    arn: string,
    details?: Partial<ComplianceTask>
  ) => {
    await onUpdateTask(taskId, {
      status: "FILED_AND_COMPLETED" as WorkflowStatus,
      arnNumber: arn,
      filingDate: details?.filingDate || new Date().toISOString().split("T")[0],
      ...(details || {}),
    });

    if (onRefreshData) {
      await onRefreshData();
    }
  };

  // Generate monthly / QRMP GST tasks for active client's GSTINs for selectedPeriod
  const handleGenerateReturnTasks = async () => {
    if (!selectedClient || isFirmWideView) {
      toast.info("Select Client", "Select a specific client first to generate GST return tasks.");
      return;
    }
    const targetPeriod = filterPeriod !== "ALL" ? filterPeriod : selectedPeriod || fyPeriods[0];
    const gstins =
      selectedClient.gstinRecords && selectedClient.gstinRecords.length > 0
        ? selectedClient.gstinRecords.filter((g) => g.status === "ACTIVE")
        : selectedClient.gstin
        ? [
            {
              gstin: selectedClient.gstin,
              stateCode: selectedClient.gstin.substring(0, 2),
              stateName: "",
              tradeName: selectedClient.tradeName || selectedClient.name,
              registrationType: "REGULAR" as const,
              filingFrequency: "MONTHLY" as const,
              qrmpStateGroup: "22ND" as const,
              status: "ACTIVE" as const,
            },
          ]
        : [];

    if (gstins.length === 0) {
      toast.warning("No Active GSTIN", "Add an active GSTIN in GSTIN Master first.");
      return;
    }

    setIsGenerating(true);
    let created = 0;
    try {
      for (const g of gstins) {
        if (g.registrationType === "COMPOSITION") {
          const exists = gstTasks.some(
            (t) => t.period === targetPeriod && t.title.includes("CMP-08") && (t.gstin === g.gstin || !t.gstin)
          );
          if (!exists) {
            const { ok } = await gstFetchJson("/api/tasks", {
              method: "POST",
              body: JSON.stringify({
                entityId: selectedClient.id,
                entityName: selectedClient.name,
                category: "GST",
                title: `CMP-08 Quarterly Statement (${g.gstin})`,
                period: targetPeriod,
                dueDate: computeStatutoryDueDate(targetPeriod, 18),
                priority: "HIGH",
              }),
            });
            if (ok) created++;
          }
          continue;
        }

        const isQrmp = g.filingFrequency === "QRMP";
        const gstr1Title = isQrmp
          ? `IFF / GSTR-1 (QRMP - ${g.gstin})`
          : `GSTR-1 Monthly Outward (${g.gstin})`;
        const gstr3bTitle = isQrmp
          ? `GSTR-3B Quarterly (${g.gstin})`
          : `GSTR-3B Monthly Return (${g.gstin})`;

        const has1 = gstTasks.some(
          (t) => t.period === targetPeriod && /gstr-?1|iff/i.test(t.title) && (!t.gstin || t.gstin === g.gstin)
        );
        if (!has1) {
          const { ok } = await gstFetchJson("/api/tasks", {
            method: "POST",
            body: JSON.stringify({
              entityId: selectedClient.id,
              entityName: selectedClient.name,
              category: "GST",
              title: gstr1Title,
              period: targetPeriod,
              dueDate: computeStatutoryDueDate(targetPeriod, isQrmp ? 13 : 11),
              priority: "HIGH",
            }),
          });
          if (ok) created++;
        }

        const has3b = gstTasks.some(
          (t) => t.period === targetPeriod && /gstr-?3b/i.test(t.title) && (!t.gstin || t.gstin === g.gstin)
        );
        if (!has3b) {
          const dueDay = isQrmp ? (g.qrmpStateGroup === "24TH" ? 24 : 22) : 20;
          const { ok } = await gstFetchJson("/api/tasks", {
            method: "POST",
            body: JSON.stringify({
              entityId: selectedClient.id,
              entityName: selectedClient.name,
              category: "GST",
              title: gstr3bTitle,
              period: targetPeriod,
              dueDate: computeStatutoryDueDate(targetPeriod, dueDay),
              priority: "CRITICAL",
            }),
          });
          if (ok) created++;
        }
      }

      if (created > 0) {
        toast.success("Tasks Generated", `Created ${created} GST return obligation(s) for ${targetPeriod}.`);
        if (onRefreshData) await onRefreshData();
      } else {
        toast.info("Already Up to Date", `GST obligations for ${targetPeriod} already exist.`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & KPI Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                GST Filing Operations Matrix
              </h1>
              <p className="text-xs text-slate-500">
                GSTR-1, GSTR-3B Sec 49B set-off, PMT-06 challan tracking &amp; ARN acknowledgements.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <UniversalClientSelector variant="full" />

            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-bold text-slate-600">
              <button
                onClick={() => setViewMode("TASKS")}
                className={`px-2.5 py-1 rounded-md transition ${viewMode === "TASKS" ? "bg-white text-slate-900 shadow-xs" : ""}`}
              >
                Task Queue
              </button>
              <button
                onClick={() => setViewMode("PIPELINE")}
                className={`px-2.5 py-1 rounded-md transition inline-flex items-center gap-1 ${viewMode === "PIPELINE" ? "bg-white text-purple-700 shadow-xs" : ""}`}
              >
                <Layers className="w-3 h-3" /> Firm Batch Pipeline
              </button>
            </div>

            <button
              onClick={handleSyncGstnPortal}
              disabled={isSyncingPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 transition"
              title="Sync Live GSTR-1, 3B & 9 Filing Status from GSTN API"
            >
              <Globe className={`w-3.5 h-3.5 ${isSyncingPortal ? "animate-spin" : ""}`} />
              <span>{isSyncingPortal ? "Syncing GSTN..." : "Sync GSTN Status"}</span>
            </button>

            {selectedClient && !isFirmWideView && (
              <button
                onClick={handleGenerateReturnTasks}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isGenerating ? "Generating..." : "Create Period Returns"}</span>
              </button>
            )}

            {onRefreshData && (
              <button
                onClick={() => onRefreshData()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Refresh Live Records"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={() => setStatusFilter("ALL")}
            className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total GST Obligations</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">{metrics.total}</span>
              <span className="text-[10px] text-slate-500 font-bold">Returns</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("FILED")}
            className="bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 p-3 rounded-xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Filed &amp; Acknowledged</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-800">{metrics.filed}</span>
              <span className="text-[10px] text-emerald-600 font-bold font-mono">{metrics.rate}%</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("PENDING")}
            className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200 p-3 rounded-xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Pending Returns</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-amber-800">{metrics.pending}</span>
              <span className="text-[10px] text-amber-700 font-bold">In queue</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("CRITICAL")}
            className="bg-red-50 hover:bg-red-100/70 border border-red-200 p-3 rounded-xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-red-700 block">Critical / Overdue</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-btred-logo">{metrics.critical}</span>
              <span className="text-[10px] text-red-600 font-bold">Immediate Action</span>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "PIPELINE" ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Firm-Wide Monthly GST Automation Pipeline — {effectivePipelinePeriod}
              </h2>
              <p className="text-[11px] text-slate-500">
                Cross-client live tracker: GSTR-1 Preparation &rarr; 2B Reco &rarr; Exceptions &rarr; 3B Cash &amp; Filing ARN
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={effectivePipelinePeriod}
                onChange={(e) => setPipelinePeriod(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5"
              >
                {fyPeriods.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={loadFirmPipeline}
                disabled={isLoadingPipeline}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                {isLoadingPipeline ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={handleExportPipelineExcel}
                disabled={pipelineRows.length === 0}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 inline-flex items-center gap-1"
                title="Download firm-wide GST filing tracker in Excel"
              >
                <Download className="w-3 h-3 text-emerald-600" /> Export Excel
              </button>
              <button
                onClick={() => {
                  const pending = pipelineRows.filter((r) => r.gstr3bStatus !== "FILED" && r.contactPhone);
                  if (pending.length === 0) {
                    toast.info("No Pending Contacts", "No pending GSTINs with phone numbers found.");
                    return;
                  }
                  const lines = pending.map(
                    (r) =>
                      `${r.entityName} (${r.gstin}) - Due Cash: ${formatCurrencyINR(r.cashPayable || 0)} - Tel: ${r.contactPhone}`
                  );
                  navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
                  toast.success("Pending Queue Copied", `Copied ${pending.length} pending client GST alerts.`);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> Copy Pending Alerts
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Client &amp; GSTIN</th>
                  <th className="px-4 py-3">GSTR-1</th>
                  <th className="px-4 py-3">2B Reco</th>
                  <th className="px-4 py-3">Exceptions</th>
                  <th className="px-4 py-3 text-right">3B Cash Due</th>
                  <th className="px-4 py-3">GSTR-3B Status</th>
                  <th className="px-4 py-3 text-center">Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingPipeline ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">Loading firm-wide GST pipeline...</td>
                  </tr>
                ) : pipelineRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">No active client GSTINs registered yet.</td>
                  </tr>
                ) : (
                  pipelineRows.map((row) => {
                    const phone = String(row.contactPhone || "").replace(/\D/g, "");
                    const waText = encodeURIComponent(
                      `Dear ${row.contactName || row.entityName}, GST compliance update for ${effectivePipelinePeriod} (${row.gstin}): 3B Cash Due ₹${row.cashPayable || 0}. Kindly review/remit.`
                    );
                    return (
                      <tr key={row.gstin} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{row.entityName}</div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {row.gstin} • {row.filingFrequency}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.gstr1Status === "FILED" ? "bg-emerald-100 text-emerald-800" : row.gstr1Prepared ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"}`}>
                            {row.gstr1Status === "FILED" ? "FILED" : row.gstr1Prepared ? "READY" : "NOT PREP"}
                          </span>
                          {row.gstr1OutwardTax > 0 && (
                            <div className="font-mono text-[10px] text-slate-600 mt-0.5">
                              {formatCurrencyINR(row.gstr1OutwardTax)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.recoDone ? (
                            <span className="font-mono font-bold text-emerald-700">
                              {formatCurrencyINR(row.eligibleItc || 0)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Pending Upload</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.exceptionsCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              {row.exceptionsCount} Issues
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold">Clean</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrencyINR(row.cashPayable || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.gstr3bStatus === "FILED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {row.gstr3bStatus}
                          </span>
                          {row.gstr3bArn && (
                            <div className="font-mono text-[10px] text-slate-500 mt-0.5">{row.gstr3bArn}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.gstr3bStatus !== "FILED" && phone ? (
                            <a
                              href={`https://wa.me/${phone.startsWith("91") ? phone : `91${phone}`}?text=${waText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100"
                            >
                              <Send className="w-3 h-3" /> WhatsApp
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">{row.gstr3bStatus === "FILED" ? "Done" : "No Phone"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Client Name, GSTIN, Return..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-bold text-slate-600">
            {(["ALL", "PENDING", "CRITICAL", "FILED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md transition ${
                  statusFilter === s ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                {s === "ALL" ? "All" : s === "PENDING" ? "Pending" : s === "CRITICAL" ? "Critical" : "Filed"}
              </button>
            ))}
          </div>

          <select
            value={returnTypeFilter}
            onChange={(e) => setReturnTypeFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5"
          >
            <option value="ALL">All Return Types</option>
            <option value="GSTR-1">GSTR-1 / IFF</option>
            <option value="GSTR-3B">GSTR-3B</option>
            <option value="CMP-08">CMP-08</option>
            <option value="GSTR-9">GSTR-9 / 9C</option>
          </select>

          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5"
          >
            <option value="ALL">All Periods</option>
            {availablePeriods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Client &amp; GSTIN</th>
                <th className="px-4 py-3">Return &amp; Period</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Filing Status</th>
                <th className="px-4 py-3 text-right">Computed Tax / Cash</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-sm text-slate-800">No GST obligations matching this filter</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select a client to create return obligations or adjust filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const client = clients.find((c) => c.id === t.entityId);
                  const isFiled = t.status === "FILED_AND_COMPLETED";
                  const isCritical = t.priority === "CRITICAL" && !isFiled;
                  const gstin = t.gstin || client?.gstin || "GSTIN Pending";
                  const hasComputedTax = t.taxPayableAmount !== undefined || t.cashPaid !== undefined || t.isNilReturn;

                  return (
                    <tr key={t.id} className={`hover:bg-slate-50/80 transition ${isCritical ? "bg-red-50/20" : ""}`}>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{t.entityName}</div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {gstin}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 block">{t.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{t.period}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 block">{t.dueDate}</span>
                        <span className={`text-[10px] font-semibold ${isFiled ? "text-emerald-600" : isCritical ? "text-red-600" : "text-slate-500"}`}>
                          {isFiled ? `Filed ${t.filingDate || ""}` : isCritical ? "Priority Window" : "Scheduled"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isFiled ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> FILED {t.isNilReturn ? "(NIL)" : ""}
                            </span>
                            {t.arnNumber && (
                              <span className="block font-mono text-[10px] text-slate-500">ARN: {t.arnNumber}</span>
                            )}
                          </div>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            <AlertTriangle className="w-3 h-3" /> CRITICAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" /> {t.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono">
                        {t.isNilReturn ? (
                          <span className="text-[11px] font-bold text-slate-600">₹0 (Nil Return)</span>
                        ) : hasComputedTax ? (
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {formatCurrencyINR(t.cashPaid ?? t.taxPayableAmount ?? 0)}
                            </span>
                            {t.challanCin && (
                              <span className="text-[10px] text-emerald-700 block">CPIN: {t.challanCin}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-sans">Not computed yet</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleOpenFiling(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 ${
                            isFiled
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                          }`}
                        >
                          {isFiled ? <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{isFiled ? "View ARN" : "Prepare & File"}</span>
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
        </>
      )}

      <ContextualFilingDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        task={activeFilingTask}
        client={activeClient}
        credentials={credentials}
        dscTokens={dscTokens}
        allTasks={gstTasks}
        onNavigateTab={onNavigateTab}
        onMarkFiled={handleFilingCompleted}
      />
    </div>
  );
};
