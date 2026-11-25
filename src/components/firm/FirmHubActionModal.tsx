"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  CalendarPlus,
  Receipt,
  FileSpreadsheet,
  KeyRound,
  X,
  FileCheck,
  Scale,
  Send,
  ShieldAlert,
  Clock,
  Check,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Calculator,
  Percent,
  Sparkles,
  RotateCw,
  Award,
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { formatCurrencyINR } from "@/lib/utils";
import { useClientContext } from "@/lib/context/ClientContext";
import { toast } from "@/components/shared/ToastNotification";
import type {
  ClientEntity,
  ComplianceTask,
  DscRecord,
  InvoiceItem,
  NoticeRecord,
} from "@/lib/types";

interface FirmHubActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClientMaster: () => void;
  onOpenNewTask: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenClientBroadcaster?: () => void;
  onRefreshData?: () => Promise<void> | void;
  clients?: ClientEntity[];
  tasks?: ComplianceTask[];
  invoices?: InvoiceItem[];
  notices?: NoticeRecord[];
  dscTokens?: DscRecord[];
  isPartner?: boolean;
}

const GST_STATE_MAP: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh",
  "97": "Other Territory",
};

const PAN_ENTITY_MAP: Record<string, string> = {
  C: "Company (Private / Public Limited)",
  P: "Individual / Person",
  H: "Hindu Undivided Family (HUF)",
  F: "Partnership Firm / LLP",
  A: "Association of Persons (AOP)",
  T: "Trust",
  B: "Body of Individuals (BOI)",
  L: "Local Authority",
  J: "Artificial Juridical Person",
  G: "Government Agency",
};

export const FirmHubActionModal: React.FC<FirmHubActionModalProps> = ({
  isOpen,
  onClose,
  onOpenClientMaster,
  onOpenNewTask,
  onNavigateTab,
  onOpenClientBroadcaster,
  onRefreshData,
  tasks = [],
  invoices = [],
  notices = [],
  dscTokens = [],
  isPartner = false,
}) => {
  const { selectedClient, selectedGstin, selectedAy, isFirmWideView } = useClientContext();
  const [activeTab, setActiveTab] = useState<"ACTIONS" | "CALCULATORS">("ACTIONS");
  const [isRunningSweep, setIsRunningSweep] = useState(false);

  // Statutory calculator states
  const [itRegime, setItRegime] = useState<"NEW" | "OLD">("NEW");
  const [itGrossIncome, setItGrossIncome] = useState<number>(850000);
  const [itTaxAssessed, setItTaxAssessed] = useState<number>(45000);
  const [itAdvanceTaxPaid, setItAdvanceTaxPaid] = useState<number>(10000);
  const [itDelayMonths, setItDelayMonths] = useState<number>(0);

  const [gstInterestMode, setGstInterestMode] = useState<"CASH_18" | "ITC_UTILIZED_24" | "ITC_UNUTILIZED_0">("CASH_18");
  const [gstAmount, setGstAmount] = useState<number>(100000);
  const [gstDelayDays, setGstDelayDays] = useState<number>(0);

  const [tdsMode, setTdsMode] = useState<"FEE_234E" | "INTEREST_201">("FEE_234E");
  const [tdsAmount, setTdsAmount] = useState<number>(50000);
  const [tdsDelayDays, setTdsDelayDays] = useState<number>(0);
  const [tdsDelayMonths, setTdsDelayMonths] = useState<number>(0);

  const [inspectorInput, setInspectorInput] = useState<string>("");
  const [udinCheckInput, setUdinCheckInput] = useState<string>("");

  // Sync inspector default cleanly with active selected client when modal opens
  useEffect(() => {
    if (isOpen && selectedClient && !isFirmWideView) {
      setInspectorInput(selectedGstin || selectedClient.gstin || selectedClient.pan || "");
    }
  }, [isOpen, selectedClient, selectedGstin, isFirmWideView]);

  // Scoped real metrics (0 when empty — zero fake numbers)
  const liveStats = useMemo(() => {
    const scopeId = selectedClient && !isFirmWideView ? selectedClient.id : null;
    const scopedTasks = scopeId ? tasks.filter((t) => t.entityId === scopeId) : tasks;
    const scopedInvoices = scopeId ? invoices.filter((i) => i.entityId === scopeId) : invoices;
    const scopedNotices = scopeId ? notices.filter((n) => n.entityId === scopeId) : notices;
    const scopedDscs = scopeId ? dscTokens.filter((d) => d.entityId === scopeId) : dscTokens;

    const nowMs = Date.now();
    const urgentTasks = scopedTasks.filter((t) => {
      if (t.status === "FILED_AND_COMPLETED") return false;
      const dueMs = t.dueDate ? new Date(t.dueDate).getTime() : Infinity;
      return t.priority === "CRITICAL" || dueMs <= nowMs + 7 * 86400000;
    });

    const unpaidInvoices = scopedInvoices.filter((i) => i.status !== "PAID");
    const unpaidAmount = unpaidInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const pendingUtrCount = unpaidInvoices.filter((i) => i.status === "UTR_SUBMITTED").length;

    const expiringDscs = scopedDscs.filter(
      (d) => d.expiryStatus === "EXPIRED" || d.expiryStatus === "EXPIRING_SOON" || d.daysToExpiry <= 30
    );

    const openNotices = scopedNotices.filter((n) => n.status !== "CLOSED");
    const noticeExposure = openNotices.reduce((sum, n) => sum + Number(n.demandAmount || 0), 0);

    return {
      urgentCount: urgentTasks.length,
      unpaidCount: unpaidInvoices.length,
      pendingUtrCount,
      unpaidAmount,
      expiringDscCount: expiringDscs.length,
      openNoticeCount: openNotices.length,
      noticeExposure,
    };
  }, [selectedClient, isFirmWideView, tasks, invoices, notices, dscTokens]);

  if (!isOpen) return null;

  // Statutory math
  const basicExemption = itRegime === "NEW" ? 300000 : 250000;
  let sec234fFee = 0;
  if (itDelayMonths > 0 && itGrossIncome > basicExemption) {
    sec234fFee = itGrossIncome <= 500000 ? 1000 : 5000;
  }
  const netTaxDueFor234A = Math.max(0, itTaxAssessed - itAdvanceTaxPaid);
  const sec234aInterest = Math.round(netTaxDueFor234A * 0.01 * itDelayMonths);
  const is234bApplicable = itTaxAssessed >= 10000 && itAdvanceTaxPaid < itTaxAssessed * 0.9;
  const sec234bInterest = is234bApplicable
    ? Math.round(Math.max(0, itTaxAssessed - itAdvanceTaxPaid) * 0.01 * itDelayMonths)
    : 0;
  const totalItCost = sec234fFee + sec234aInterest + sec234bInterest;

  const gstInterestRate =
    gstInterestMode === "ITC_UTILIZED_24" ? 0.24 : gstInterestMode === "ITC_UNUTILIZED_0" ? 0 : 0.18;
  const gstSec50Interest = Math.round((gstAmount * gstInterestRate * gstDelayDays) / 365);

  const sec234eFee = Math.min(tdsDelayDays * 200, tdsAmount);
  const sec201Interest = Math.round(tdsAmount * 0.015 * tdsDelayMonths);

  const inspectPanOrGstin = (val: string) => {
    const clean = val.trim().toUpperCase();
    if (clean.length === 15) {
      const stateCode = clean.slice(0, 2);
      const panPart = clean.slice(2, 12);
      return {
        type: "GSTIN",
        state: GST_STATE_MAP[stateCode] || `Code ${stateCode}`,
        entityType: PAN_ENTITY_MAP[panPart.charAt(3)] || "Registered Taxpayer",
        validStructure: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean),
      };
    }
    if (clean.length === 10) {
      return {
        type: "PAN",
        state: "Income Tax Dept (CBDT)",
        entityType: PAN_ENTITY_MAP[clean.charAt(3)] || "Taxpayer Entity",
        validStructure: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean),
      };
    }
    return null;
  };
  const inspectedData = inspectPanOrGstin(inspectorInput);

  const cleanUdin = udinCheckInput.trim().toUpperCase();
  const isValidUdinSyntax = /^[0-9]{8}[A-Z0-9]{10}$/.test(cleanUdin);

  const handleRunAutopilotSweep = async () => {
    if (isRunningSweep) return;
    setIsRunningSweep(true);
    try {
      const res = await fetch("/api/firm-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.summary) {
        toast.success(
          "Autopilot Sweep Completed",
          `Spawned ${json.summary.tasksSpawned} tasks, routed ${json.summary.tasksAutoAssigned || 0}, drafted ${json.summary.autoInvoicesDrafted} invoices.`
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bt_autopilot_sweep_completed"));
        }
        await onRefreshData?.();
      } else {
        toast.error("Sweep Denied", json.error || `HTTP ${res.status}`);
      }
    } catch {
      toast.error("Sweep Failed", "Could not reach Autopilot endpoint.");
    } finally {
      setIsRunningSweep(false);
    }
  };

  const quickActions = [
    {
      title: "Onboard Client",
      subtitle: "Add client PAN, GSTIN & portal PIN",
      icon: Building2,
      tone: "border-purple-200 bg-purple-50 text-purple-800",
      onClick: () => {
        onClose();
        onOpenClientMaster();
      },
    },
    {
      title: "New Filing Task",
      subtitle: "Assign GST, ITR, TDS or ROC due date",
      icon: CalendarPlus,
      tone: "border-slate-200 bg-slate-100 text-slate-800",
      onClick: () => {
        onClose();
        onOpenNewTask();
      },
    },
    {
      title: "Create Invoice / Collect",
      subtitle: "Generate SAC 9982 bill or check UTR",
      icon: Receipt,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      onClick: () => {
        onClose();
        onNavigateTab("billing-matrix");
      },
    },
    {
      title: "Send Due Reminders",
      subtitle: "WhatsApp & client portal intimations",
      icon: Send,
      tone: "border-blue-200 bg-blue-50 text-blue-800",
      onClick: () => {
        onClose();
        if (onOpenClientBroadcaster) onOpenClientBroadcaster();
        else onNavigateTab("whatsapp-ai");
      },
    },
  ];

  const toolShortcuts = [
    { label: "GSTR-2B Reconciler", tab: "gstr2b", icon: CheckCircle2 },
    { label: "Schedule III & CARO", tab: "schedule3-audit", icon: FileCheck },
    { label: "Bank PDF to Tally XML", tab: "bank-parser", icon: FileSpreadsheet },
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col font-sans"
        role="dialog"
        aria-modal="true"
        aria-label="Quick Desk"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#800000] to-btred-logo text-white flex items-center justify-center shadow-xs shrink-0">
              <Scale className="w-4.5 h-4.5 text-amber-100" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Quick Desk &amp; Calculators
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {selectedClient && !isFirmWideView
                  ? `${selectedClient.name} (${selectedClient.pan})`
                  : `${DEFAULT_FIRM_BRANDING.firmName} · All Clients`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Clean Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs shrink-0 mt-3">
          <button
            type="button"
            onClick={() => setActiveTab("ACTIONS")}
            className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "ACTIONS"
                ? "bg-white text-btred-logo shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Actions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CALCULATORS")}
            className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "CALCULATORS"
                ? "bg-white text-btred-logo shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Statutory Calculators</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 mt-3">
          {activeTab === "ACTIONS" && (
            <div className="space-y-4">
              {/* Primary Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.title}
                      type="button"
                      onClick={act.onClick}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition group flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${act.tone}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-slate-900 group-hover:text-btred-logo truncate">
                            {act.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{act.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-btred-logo shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Live Practice Queues (100% Real Data) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Live Queue
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab("tasks-matrix");
                    }}
                    className="p-3 rounded-2xl border border-red-200 bg-red-50/70 hover:bg-red-50 text-left transition"
                  >
                    <div className="text-[10px] font-bold text-btred-logo uppercase">Urgent Filings</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5 font-mono">
                      {liveStats.urgentCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Due &le; 7d / Critical</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab("pay-to-release");
                    }}
                    className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50 text-left transition"
                  >
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Receivables</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5 font-mono">
                      {formatCurrencyINR(liveStats.unpaidAmount)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {liveStats.pendingUtrCount > 0
                        ? `${liveStats.pendingUtrCount} UTR to verify`
                        : `${liveStats.unpaidCount} unpaid`}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab("dsc");
                    }}
                    className="p-3 rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-50 text-left transition"
                  >
                    <div className="text-[10px] font-bold text-amber-800 uppercase">DSC Expiring</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5 font-mono">
                      {liveStats.expiringDscCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Tokens &le; 30 days</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab("notices");
                    }}
                    className="p-3 rounded-2xl border border-purple-200 bg-purple-50/70 hover:bg-purple-50 text-left transition"
                  >
                    <div className="text-[10px] font-bold text-purple-800 uppercase">Open Notices</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5 font-mono">
                      {liveStats.openNoticeCount}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {liveStats.noticeExposure > 0
                        ? formatCurrencyINR(liveStats.noticeExposure)
                        : "0 demand pending"}
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Workbench Links + Partner Autopilot Sweep */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  {toolShortcuts.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.tab}
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateTab(s.tab);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                      >
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {isPartner && (
                  <button
                    type="button"
                    disabled={isRunningSweep}
                    onClick={handleRunAutopilotSweep}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isRunningSweep ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{isRunningSweep ? "Running Sweep..." : "Run Autopilot Sweep"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "CALCULATORS" && (
            <div className="space-y-3.5">
              {/* 1. Income Tax Sec 234F, 234A, 234B */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-btred-logo" />
                    Income Tax Sec 234F / 234A / 234B
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setItRegime("NEW")}
                      className={`px-2 py-0.5 rounded font-bold ${
                        itRegime === "NEW" ? "bg-btred-logo text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      115BAC (New)
                    </button>
                    <button
                      type="button"
                      onClick={() => setItRegime("OLD")}
                      className={`px-2 py-0.5 rounded font-bold ${
                        itRegime === "OLD" ? "bg-btred-logo text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      Old Regime
                    </button>
                    <span className="bg-red-100 text-btred-logo px-2 py-0.5 rounded font-bold font-mono">
                      AY {selectedAy}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Gross Income (₹)</label>
                    <input
                      type="number"
                      value={itGrossIncome}
                      onChange={(e) => setItGrossIncome(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Assessed Tax (₹)</label>
                    <input
                      type="number"
                      value={itTaxAssessed}
                      onChange={(e) => setItTaxAssessed(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Advance Tax &amp; TDS (₹)</label>
                    <input
                      type="number"
                      value={itAdvanceTaxPaid}
                      onChange={(e) => setItAdvanceTaxPaid(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Delay (Months)</label>
                    <input
                      type="number"
                      min={0}
                      value={itDelayMonths}
                      onChange={(e) => setItDelayMonths(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Sec 234F Fee</span>
                    <strong className="text-xs font-mono">₹{sec234fFee.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Sec 234A (1%/m)</span>
                    <strong className="text-xs font-mono">₹{sec234aInterest.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Sec 234B</span>
                    <strong className="text-xs font-mono">₹{sec234bInterest.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="bg-red-50 p-2 rounded-xl border border-red-200">
                    <span className="text-[9.5px] text-btred-logo uppercase font-black block">Total</span>
                    <strong className="text-xs text-btred-logo font-mono font-black">
                      ₹{totalItCost.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. GST Sec 50 & Rule 88B + TDS 234E */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-600" />
                    <span>GST Sec 50 / Rule 88B Interest</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {(
                      [
                        ["CASH_18", "Cash 18%"],
                        ["ITC_UTILIZED_24", "ITC 24%"],
                        ["ITC_UNUTILIZED_0", "Unutilized 0%"],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setGstInterestMode(mode)}
                        className={`px-2 py-0.5 rounded font-bold ${
                          gstInterestMode === mode ? "bg-amber-600 text-white" : "bg-white border text-slate-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Tax / ITC (₹)</label>
                      <input
                        type="number"
                        value={gstAmount}
                        onChange={(e) => setGstAmount(Number(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Delay (Days)</label>
                      <input
                        type="number"
                        min={0}
                        value={gstDelayDays}
                        onChange={(e) => setGstDelayDays(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                      />
                    </div>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Interest ({Math.round(gstInterestRate * 100)}% p.a.)</span>
                    <strong className="font-mono font-black text-amber-800">₹{gstSec50Interest.toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>TDS Sec 234E / 201(1A)</span>
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setTdsMode("FEE_234E")}
                      className={`px-2 py-0.5 rounded font-bold ${
                        tdsMode === "FEE_234E" ? "bg-purple-700 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      234E (₹200/d)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTdsMode("INTEREST_201")}
                      className={`px-2 py-0.5 rounded font-bold ${
                        tdsMode === "INTEREST_201" ? "bg-purple-700 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      201(1A) (1.5%/m)
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">TDS Amount (₹)</label>
                      <input
                        type="number"
                        value={tdsAmount}
                        onChange={(e) => setTdsAmount(Number(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">
                        {tdsMode === "FEE_234E" ? "Delay (Days)" : "Delay (Months)"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={tdsMode === "FEE_234E" ? tdsDelayDays : tdsDelayMonths}
                        onChange={(e) =>
                          tdsMode === "FEE_234E"
                            ? setTdsDelayDays(Math.max(0, Number(e.target.value) || 0))
                            : setTdsDelayMonths(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                      />
                    </div>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Payable</span>
                    <strong className="font-mono font-black text-purple-900">
                      ₹{(tdsMode === "FEE_234E" ? sec234eFee : sec201Interest).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. PAN / GSTIN Inspector + Official UDIN Verifier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-sky-600" />
                      PAN / GSTIN Checker
                    </span>
                    {selectedClient && !isFirmWideView && (
                      <button
                        type="button"
                        onClick={() => setInspectorInput(selectedGstin || selectedClient.gstin || selectedClient.pan)}
                        className="text-[10px] font-bold text-sky-700 hover:underline"
                      >
                        Use Active Client
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={inspectorInput}
                    onChange={(e) => setInspectorInput(e.target.value.toUpperCase())}
                    placeholder="Enter 10-char PAN or 15-char GSTIN"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                  />
                  {inspectedData && (
                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">
                          {inspectedData.type} · {inspectedData.state}
                        </span>
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            inspectedData.validStructure ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {inspectedData.validStructure ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          {inspectedData.validStructure ? "Valid" : "Invalid"}
                        </span>
                      </div>
                      <div className="text-slate-500">{inspectedData.entityType}</div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-700" />
                      ICAI UDIN Check &amp; Portal
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab("udin-vault");
                      }}
                      className="text-[10px] font-bold text-btred-logo hover:underline"
                    >
                      Open UDIN Tracker
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={18}
                    value={udinCheckInput}
                    onChange={(e) => setUdinCheckInput(e.target.value.toUpperCase())}
                    placeholder="Enter 18-char UDIN (YYMMMMMMXXXXXXXXXX)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                  />
                  <div className="flex items-center justify-between text-[11px]">
                    {cleanUdin ? (
                      <span className={`font-bold flex items-center gap-1 ${isValidUdinSyntax ? "text-emerald-700" : "text-red-600"}`}>
                        {isValidUdinSyntax ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {isValidUdinSyntax ? "Valid 18-char ICAI syntax" : "Expected 8 digits + 10 alphanumeric"}
                      </span>
                    ) : (
                      <span className="text-slate-500">Must be generated on ICAI within 60 days</span>
                    )}
                    <a
                      href="https://udin.icai.org/search-udin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline shrink-0"
                    >
                      <span>ICAI Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
