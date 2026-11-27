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
  CalendarDays,
  ShieldAlert,
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
import {
  buildGstTaskTitle,
  canonicalizeReturnKind,
  computeGstTaskPriority,
  computeSec47LateFee,
  computeSequentialBlockers,
  extractGstinFromTitle,
  getStatutoryGstDueDate,
  periodSortKey,
  resolveActiveGstCycle,
  resolveActiveGstinsForClient,
  taskMatchesGstin,
} from "@/lib/gst/gstComplianceEngine";
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
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [baselineFiledUpTo, setBaselineFiledUpTo] = useState<string>("CURRENT_ONLY");
  const [viewMode, setViewMode] = useState<"TASKS" | "MATRIX" | "PIPELINE">("TASKS");
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
          entityId: !isFirmWideView && selectedClient ? selectedClient.id : undefined,
          gstin: !isFirmWideView && selectedGstin ? selectedGstin : undefined,
        }),
      });
      if (!ok || !data?.success) {
        toast.warning("GSTN Sync Warning", data?.error || "Could not fetch filing status from GSTN API.");
        return;
      }
      if (data.syncedGstins === 0 && Array.isArray(data.errors) && data.errors.length > 0) {
        toast.warning("GSTN API Notice", data.errors[0]);
        return;
      }
      const backfilled = data.createdBacklogTasks || 0;
      toast.success(
        "GSTN Status Reconciled",
        `Checked ${data.syncedGstins} GSTIN(s) • Marked ${data.updatedTasks} filed • Backfilled ${backfilled} unfiled backlog return(s).`
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
        if (selectedGstin && !taskMatchesGstin(t, selectedGstin, selectedClient.gstin)) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedClient, selectedGstin, isFirmWideView]);

  const sequentialBlockers = useMemo(
    () => computeSequentialBlockers(gstTasks, clients),
    [gstTasks, clients]
  );

  const availablePeriods = useMemo(() => {
    const set = new Set<string>(fyPeriods);
    gstTasks.forEach((t) => {
      if (t.period) set.add(t.period);
    });
    return Array.from(set);
  }, [gstTasks, fyPeriods]);

  const filteredTasks = useMemo(() => {
    return gstTasks
      .filter((t) => {
        const client = clients.find((c) => c.id === t.entityId);
        const gstin = extractGstinFromTitle(t.title) || t.gstin || client?.gstin || "";
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
      })
      .sort((a, b) => {
        const aFiled = a.status === "FILED_AND_COMPLETED" ? 1 : 0;
        const bFiled = b.status === "FILED_AND_COMPLETED" ? 1 : 0;
        if (aFiled !== bFiled) return aFiled - bFiled;
        const pkDiff = periodSortKey(a.period) - periodSortKey(b.period);
        if (pkDiff !== 0) return pkDiff;
        const kindOrder: Record<string, number> = { GSTR1: 1, GSTR3B: 2, CMP08: 3, GSTR9: 4, OTHER: 5 };
        return (kindOrder[canonicalizeReturnKind(a.title)] || 5) - (kindOrder[canonicalizeReturnKind(b.title)] || 5);
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
    const isFinalFiling = Boolean(arn && arn.trim());
    await onUpdateTask(taskId, {
      ...(isFinalFiling
        ? {
            status: "FILED_AND_COMPLETED" as WorkflowStatus,
            arnNumber: arn.trim(),
            filingDate: details?.filingDate || new Date().toISOString().split("T")[0],
          }
        : {}),
      ...(details || {}),
    });

    if (onRefreshData) {
      await onRefreshData();
    }
  };

  // Generate current cycle OR full backlog from "Filed Up To" baseline
  const handleGenerateReturnTasks = async (filedUpToMode: string = baselineFiledUpTo) => {
    if (!selectedClient || isFirmWideView) {
      toast.info("Select Client", "Select a specific client first to generate GST return tasks.");
      return;
    }
    const targetPeriod =
      filterPeriod !== "ALL"
        ? filterPeriod
        : selectedPeriod || resolveActiveGstCycle().periodLabel || fyPeriods[0];

    setIsGenerating(true);
    setShowCreateMenu(false);
    try {
      const { ok, data } = await gstFetchJson<any>("/api/gst/sync-portal", {
        method: "POST",
        body: JSON.stringify({
          action: "MANUAL_BASELINE_SYNC",
          entityId: selectedClient.id,
          fy: selectedFy,
          gstin: selectedGstin || undefined,
          filedUpTo: filedUpToMode,
          singlePeriod: targetPeriod,
        }),
      });
      if (!ok || !data?.success) {
        toast.error("Generation Failed", data?.error || "Could not create GST return tasks.");
        return;
      }
      if (data.createdTasks > 0 || data.markedFiledHistory > 0) {
        toast.success(
          "Returns Updated",
          `Created ${data.createdTasks} pending return(s)${data.markedFiledHistory > 0 ? ` • Marked ${data.markedFiledHistory} prior return(s) filed` : ""}.`
        );
        if (onRefreshData) await onRefreshData();
      } else {
        toast.info("Already Up to Date", "All selected GST return obligations already exist.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickMarkNil = async (task: ComplianceTask) => {
    await onUpdateTask(task.id, {
      isNilReturn: true,
      taxPayableAmount: 0,
      cashPaid: 0,
      section50Interest: 0,
      lateFeeAmount: 0,
      status: "MANAGER_REVIEW" as WorkflowStatus,
    });
    toast.success("Marked Nil Return", `${task.title} (${task.period}) marked as ₹0 Nil — ready for portal filing & ARN.`);
    if (onRefreshData) await onRefreshData();
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
                onClick={() => setViewMode("MATRIX")}
                className={`px-2.5 py-1 rounded-md transition inline-flex items-center gap-1 ${viewMode === "MATRIX" ? "bg-white text-blue-700 shadow-xs" : ""}`}
              >
                <CalendarDays className="w-3 h-3" /> FY Matrix Grid
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
              title="Two-way GSTN Sync: updates filed ARNs & backfills any unfiled past months"
            >
              <Globe className={`w-3.5 h-3.5 ${isSyncingPortal ? "animate-spin" : ""}`} />
              <span>{isSyncingPortal ? "Reconciling GSTN..." : "Sync GSTN Status"}</span>
            </button>

            {selectedClient && !isFirmWideView && (
              <div className="relative">
                <button
                  onClick={() => setShowCreateMenu((v) => !v)}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isGenerating ? "Generating..." : "Create Period Returns"}</span>
                </button>
                {showCreateMenu && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30 space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Client Filed Up To
                      </label>
                      <select
                        value={baselineFiledUpTo}
                        onChange={(e) => setBaselineFiledUpTo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800"
                      >
                        <option value="CURRENT_ONLY">Current Cycle Only</option>
                        <option value="NONE">None Filed in FY (Full Backlog)</option>
                        {fyPeriods
                          .filter((p) => periodSortKey(p) < periodSortKey(resolveActiveGstCycle().periodLabel))
                          .map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowCreateMenu(false)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateReturnTasks(baselineFiledUpTo)}
                        className="px-3 py-1 rounded-md text-xs font-bold bg-slate-900 text-white hover:bg-black"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {onRefreshData && (
              <button
                onClick={() => onRefreshData()}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Refresh local records"
              >
                <RefreshCw className="w-3.5 h-3.5" />
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

      {viewMode === "MATRIX" ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                FY {selectedFy} GSTIN-Level Return Matrix (Apr&ndash;Mar)
              </h2>
              <p className="text-[11px] text-slate-500">
                12-month compliance heatmap per GSTIN: Green = Filed (ARN), Red = Overdue, Amber = Active/Pending, Gray = Not Due.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 text-emerald-700"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Filed</span>
              <span className="inline-flex items-center gap-1 text-red-700"><span className="w-2.5 h-2.5 rounded-xs bg-red-500 inline-block" /> Overdue</span>
              <span className="inline-flex items-center gap-1 text-amber-700"><span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> Pending</span>
              <span className="inline-flex items-center gap-1 text-slate-500"><span className="w-2.5 h-2.5 rounded-xs bg-slate-200 inline-block" /> Future/N.A.</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 sticky left-0 bg-slate-50 z-10 min-w-[200px]">Client &amp; GSTIN</th>
                  {fyPeriods.map((p) => (
                    <th key={p} className="px-2 py-2.5 text-center whitespace-nowrap">
                      {p.split(" ")[0].slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const targetClients =
                    selectedClient && !isFirmWideView ? [selectedClient] : clients;
                  const activeCycleKey = periodSortKey(resolveActiveGstCycle().periodLabel);
                  const matrixRows: Array<{ client: ClientEntity; gstinRec: ReturnType<typeof resolveActiveGstinsForClient>[number] }> = [];
                  for (const c of targetClients) {
                    const recs = resolveActiveGstinsForClient(c);
                    for (const g of recs) {
                      if (!isFirmWideView && selectedGstin && g.gstin !== selectedGstin.toUpperCase()) continue;
                      matrixRows.push({ client: c, gstinRec: g });
                    }
                  }
                  if (matrixRows.length === 0) {
                    return (
                      <tr>
                        <td colSpan={13} className="py-10 text-center text-slate-500">
                          No active GSTINs found for the current selection.
                        </td>
                      </tr>
                    );
                  }
                  const now = new Date();
                  return matrixRows.map(({ client, gstinRec }) => {
                    const gTasks = tasks.filter(
                      (t) =>
                        t.category === "GST" &&
                        t.entityId === client.id &&
                        taskMatchesGstin(t, gstinRec.gstin, client.gstin)
                    );
                    const gHist = (client.gstHistory || []).filter((h: any) => {
                      const hg = (h.gstin || "").trim().toUpperCase();
                      return hg ? hg === gstinRec.gstin : gstinRec.gstin === (client.gstin || "").toUpperCase();
                    });
                    return (
                      <tr key={`${client.id}-${gstinRec.gstin}`} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2.5 sticky left-0 bg-white z-10 border-r border-slate-100">
                          <div className="font-bold text-slate-900 truncate max-w-[190px]">{client.name}</div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {gstinRec.gstin} &bull; {gstinRec.filingFrequency}
                          </div>
                        </td>
                        {fyPeriods.map((period) => {
                          const pk = periodSortKey(period);
                          const isFuture = pk > activeCycleKey;
                          const renderPill = (kind: "GSTR1" | "GSTR3B", shortLabel: string) => {
                            const task = gTasks.find(
                              (t) =>
                                canonicalizeReturnKind(t.title) === kind &&
                                t.period.toLowerCase() === period.toLowerCase()
                            );
                            const hist = gHist.find(
                              (h: any) =>
                                (kind === "GSTR1" ? h.returnType?.includes("1") : h.returnType?.includes("3B")) &&
                                String(h.period || "").toLowerCase() === period.toLowerCase()
                            );
                            const isFiled = task?.status === "FILED_AND_COMPLETED" || Boolean(hist?.arn);
                            const due = task?.dueDate || getStatutoryGstDueDate(period, kind, gstinRec);
                            const fee = computeSec47LateFee(due, now);
                            const hasKnownRecord = Boolean(task) || Boolean(hist);
                            const isOverdue = !isFiled && !isFuture && fee.daysLate > 0 && hasKnownRecord;

                            let cls = "bg-slate-100 text-slate-400";
                            let tip = `${period} ${kind}: Future / N.A.`;
                            if (isFiled) {
                              cls = "bg-emerald-100 text-emerald-800 border border-emerald-300";
                              tip = `${period} ${kind}: FILED${task?.arnNumber || hist?.arn ? ` (ARN: ${task?.arnNumber || hist?.arn})` : ""}`;
                            } else if (isOverdue) {
                              cls = "bg-red-100 text-red-800 border border-red-300";
                              tip = `${period} ${kind}: OVERDUE ${fee.daysLate}d (Est. Sec 47: ₹${fee.lateFee})`;
                            } else if (!isFuture && task) {
                              cls = "bg-amber-100 text-amber-800 border border-amber-300";
                              tip = `${period} ${kind}: PENDING (Due ${due})`;
                            } else if (!isFuture && !hasKnownRecord) {
                              cls = "bg-slate-50 text-slate-500 border border-dashed border-slate-300";
                              tip = `${period} ${kind}: Not synced from GSTN yet`;
                            }
                            return (
                              <button
                                key={kind}
                                type="button"
                                title={tip}
                                onClick={() => {
                                  if (task) handleOpenFiling(task);
                                }}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${cls} ${task ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                              >
                                {shortLabel}
                              </button>
                            );
                          };
                          return (
                            <td key={period} className="px-1.5 py-2 text-center">
                              <div className="inline-flex items-center gap-0.5">
                                {renderPill("GSTR1", "1")}
                                {renderPill("GSTR3B", "3B")}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "PIPELINE" ? (
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
                  const gstin = extractGstinFromTitle(t.title) || t.gstin || client?.gstin || "GSTIN Pending";
                  const hasComputedTax = t.taxPayableAmount !== undefined || t.cashPaid !== undefined || t.isNilReturn;
                  const blocker = !isFiled ? sequentialBlockers.get(t.id) : undefined;
                  const fee = !isFiled ? computeSec47LateFee(t.dueDate, new Date(), t.isNilReturn) : { daysLate: 0, lateFee: 0, dailyRate: 0 };

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
                        <span className={`text-[10px] font-semibold ${isFiled ? "text-emerald-600" : fee.daysLate > 0 ? "text-red-600" : isCritical ? "text-red-600" : "text-slate-500"}`}>
                          {isFiled
                            ? `Filed ${t.filingDate || ""}`
                            : fee.daysLate > 0
                            ? `${fee.daysLate}d overdue • +₹${fee.lateFee} Sec 47`
                            : isCritical
                            ? "Priority Window"
                            : "Scheduled"}
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
                        ) : (
                          <div className="space-y-1">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                                <AlertTriangle className="w-3 h-3" /> CRITICAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3" /> {t.status.replace(/_/g, " ")}
                              </span>
                            )}
                            {blocker && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-fit">
                                <ShieldAlert className="w-3 h-3 shrink-0" />
                                {blocker}
                              </span>
                            )}
                          </div>
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
                        <div className="inline-flex items-center gap-1.5">
                          {!isFiled && !t.isNilReturn && (
                            <button
                              onClick={() => handleQuickMarkNil(t)}
                              title="Mark as ₹0 Nil Return (ready for portal ARN)"
                              className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                            >
                              Nil
                            </button>
                          )}
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
