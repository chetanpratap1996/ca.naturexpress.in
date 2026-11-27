"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CreditCard,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  PhoneCall,
  ArrowRight,
  Download,
  FileText,
  Printer,
  UploadCloud,
  Scale,
  Receipt,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  QrCode,
  BookOpen,
  Zap,
  FileCode,
} from "lucide-react";
import {
  InvoiceItem,
  InvoiceDocType,
  InvoiceLineItem,
  ClientEntity,
  PayToReleaseConfig,
  WipJobItem,
  BillingSummaryMetrics,
} from "@/lib/types";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import {
  CA_SAC_SERVICES,
  determinePlaceOfSupply,
  calculateTaxAndTds,
  generateNpciDynamicUpiUri,
} from "@/lib/billing/invoicingEngine";
import { BankStatementReconcileModal } from "@/components/firm/billing/BankStatementReconcileModal";
import { MsmeRecoveryDesk } from "@/components/firm/billing/MsmeRecoveryDesk";
import { ScopeCreepDesk } from "@/components/firm/billing/ScopeCreepDesk";
import { ImprestLedgerDesk } from "@/components/firm/billing/ImprestLedgerDesk";
import { PartyLedgerDesk } from "@/components/firm/billing/PartyLedgerDesk";
import { AutopilotRetainersDesk } from "@/components/firm/billing/AutopilotRetainersDesk";

type BillingSubView =
  | "INVOICES"
  | "UNBILLED_WIP"
  | "PARTY_LEDGER"
  | "AUTOPILOT"
  | "MSME_RECOVERY"
  | "SCOPE_CREEP"
  | "IMPREST";
type StatusFilter = "ALL" | "PENDING" | "UTR_SUBMITTED" | "PAID";

interface BillingWipMatrixProps {
  invoices: InvoiceItem[];
  clients: ClientEntity[];
  payConfigs?: PayToReleaseConfig[];
  onRefreshData?: () => void;
  onReconcileInvoice?: (
    invoiceId: string,
    options?: string | { utr?: string; mode?: InvoiceItem["clientPaymentMode"]; note?: string; reconciledBy?: string }
  ) => Promise<void>;
  onCreateInvoice?: (
    invoiceData: Partial<InvoiceItem>
  ) => Promise<{ success: boolean; invoice?: InvoiceItem; error?: string }>;
}

const PAGE_SIZE = 25;

export const BillingWipMatrix: React.FC<BillingWipMatrixProps> = ({
  invoices: propInvoices,
  clients,
  onRefreshData,
  onReconcileInvoice,
  onCreateInvoice,
}) => {
  const { selectedClient, isFirmWideView, selectedFy } = useClientContext();
  const activeEntityId = selectedClient && !isFirmWideView ? selectedClient.id : "";

  const [activeTab, setActiveTab] = useState<BillingSubView>("INVOICES");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Server-backed paginated invoices & summary
  const [serverInvoices, setServerInvoices] = useState<InvoiceItem[] | null>(null);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [serverSummary, setServerSummary] = useState<BillingSummaryMetrics | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Server-backed WIP jobs
  const [wipJobs, setWipJobs] = useState<WipJobItem[]>([]);
  const [wipSummary, setWipSummary] = useState({ unbilledTotal: 0, unbilledCount: 0 });
  const [selectedWipIds, setSelectedWipIds] = useState<Record<string, boolean>>({});
  const [isLoadingWip, setIsLoadingWip] = useState(false);

  // Modals
  const [reconcileInvoiceTarget, setReconcileInvoiceTarget] = useState<InvoiceItem | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "NEFT_RTGS" | "IMPS" | "CHEQUE">("NEFT_RTGS");
  const [payerNote, setPayerNote] = useState("");
  const [isPartialMode, setIsPartialMode] = useState(false);
  const [partialCash, setPartialCash] = useState("");
  const [partialTds, setPartialTds] = useState("");
  const [isSubmittingReconcile, setIsSubmittingReconcile] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDocType, setNewDocType] = useState<InvoiceDocType>("TAX_INVOICE");
  const [newEntityId, setNewEntityId] = useState("");
  const [newSacCode, setNewSacCode] = useState("998221");
  const [newServiceDesc, setNewServiceDesc] = useState("Statutory & Tax Audit (Sec 44AB / Companies Act)");
  const [newTaxableAmount, setNewTaxableAmount] = useState("25000");
  const [newDueDate, setNewDueDate] = useState(() => new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]);
  const [applyTds, setApplyTds] = useState(true);
  const [tdsRate, setTdsRate] = useState<10 | 2>(10);
  const [extraLines, setExtraLines] = useState<Array<{ description: string; sacCode: string; amount: string; isPureAgent: boolean }>>([]);
  const [linkedWipId, setLinkedWipId] = useState<string | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const [isLogWipOpen, setIsLogWipOpen] = useState(false);
  const [wipEntityId, setWipEntityId] = useState("");
  const [wipTitle, setWipTitle] = useState("");
  const [wipSac, setWipSac] = useState("998231");
  const [wipHours, setWipHours] = useState("4");
  const [wipFee, setWipFee] = useState("5000");

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Record<string, boolean>>({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [smartView, setSmartView] = useState<"ALL" | "MSME_RISK" | "HIGH_VALUE" | "PROFORMA" | "CREDIT_NOTE">("ALL");
  const [sortBy, setSortBy] = useState<"DATE_DESC" | "AMOUNT_DESC" | "DUE_ASC">("DATE_DESC");

  const [previewInvoice, setPreviewInvoice] = useState<InvoiceItem | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page on context change
  useEffect(() => {
    setPage(1);
  }, [activeEntityId, selectedFy, statusFilter]);

  const fetchInvoices = useCallback(async () => {
    setIsLoadingInvoices(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        fy: selectedFy,
        status: statusFilter,
      });
      if (activeEntityId) qs.set("entityId", activeEntityId);
      if (debouncedSearch) qs.set("search", debouncedSearch);

      const res = await fetch(`/api/invoices?${qs.toString()}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setServerInvoices(data.invoices || []);
        setTotalFiltered(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.summary) setServerSummary(data.summary);
      }
    } catch {
      // Fallback to propInvoices in sandbox/offline mode
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [page, selectedFy, statusFilter, activeEntityId, debouncedSearch]);

  const fetchWipJobs = useCallback(async () => {
    setIsLoadingWip(true);
    try {
      const qs = new URLSearchParams({
        fy: selectedFy,
        status: "READY_FOR_BILLING",
        limit: "100",
      });
      if (activeEntityId) qs.set("entityId", activeEntityId);
      const res = await fetch(`/api/billing/wip?${qs.toString()}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setWipJobs(data.jobs || []);
        if (data.summary) setWipSummary(data.summary);
      }
    } catch {
      // Silent fallback
    } finally {
      setIsLoadingWip(false);
    }
  }, [selectedFy, activeEntityId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchWipJobs();
  }, [fetchWipJobs]);

  const handleSyncAll = async () => {
    await Promise.all([fetchInvoices(), fetchWipJobs()]);
    if (onRefreshData) onRefreshData();
    toast.success("Synced", `Billing & WIP refreshed for FY ${selectedFy}.`);
  };

  // Client lookup map O(C)
  const clientMap = useMemo(() => {
    const map = new Map<string, ClientEntity>();
    for (const c of clients) map.set(c.id, c);
    return map;
  }, [clients]);

  // Unified Smart View & Sorting over active invoice dataset
  const displayedInvoices = useMemo(() => {
    const base =
      serverInvoices !== null
        ? serverInvoices
        : propInvoices.filter((inv) => {
            if (activeEntityId && inv.entityId !== activeEntityId) return false;
            if (statusFilter === "PENDING" && !["PENDING", "OVERDUE"].includes(inv.status)) return false;
            if (statusFilter === "UTR_SUBMITTED" && inv.status !== "UTR_SUBMITTED") return false;
            if (statusFilter === "PAID" && inv.status !== "PAID") return false;
            if (debouncedSearch) {
              const q = debouncedSearch.toLowerCase();
              if (
                !inv.entityName.toLowerCase().includes(q) &&
                !inv.invoiceNo.toLowerCase().includes(q) &&
                !inv.serviceDescription.toLowerCase().includes(q)
              ) {
                return false;
              }
            }
            return true;
          });

    const filtered = base.filter((inv) => {
      if (smartView === "MSME_RISK") {
        if (inv.status === "PAID") return false;
        const days = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000);
        return days > 30;
      }
      if (smartView === "HIGH_VALUE") return inv.amount >= 50000;
      if (smartView === "PROFORMA") return inv.documentType === "PROFORMA";
      if (smartView === "CREDIT_NOTE") return inv.documentType === "CREDIT_NOTE";
      return true;
    });

    if (sortBy === "AMOUNT_DESC") return [...filtered].sort((a, b) => b.amount - a.amount);
    if (sortBy === "DUE_ASC") return [...filtered].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return filtered;
  }, [serverInvoices, propInvoices, activeEntityId, statusFilter, debouncedSearch, smartView, sortBy]);

  const metrics = useMemo(() => {
    if (serverSummary) {
      return {
        ...serverSummary,
        wipTotal: wipSummary.unbilledTotal,
        wipCount: wipSummary.unbilledCount,
      };
    }
    const scoped = activeEntityId ? propInvoices.filter((i) => i.entityId === activeEntityId) : propInvoices;
    const totalBilled = scoped.reduce((acc, i) => acc + i.amount, 0);
    const collected = scoped.filter((i) => i.status === "PAID").reduce((acc, i) => acc + i.amount, 0);
    const pending = scoped.filter((i) => i.status !== "PAID").reduce((acc, i) => acc + i.amount, 0);
    const utrReviewCount = scoped.filter((i) => i.status === "UTR_SUBMITTED").length;
    return {
      totalBilled,
      totalInvoicesCount: scoped.length,
      collected,
      pending,
      utrReviewCount,
      overdue45Count: 0,
      realizationRate: totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0,
      wipTotal: wipSummary.unbilledTotal,
      wipCount: wipSummary.unbilledCount,
    };
  }, [serverSummary, wipSummary, propInvoices, activeEntityId]);

  const getMsmeAgingBadge = (inv: InvoiceItem) => {
    if (inv.status === "PAID") {
      return { text: "Settled u/s 43B(h)", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    const dueMs = new Date(inv.dueDate).getTime();
    const daysOverdue = Math.floor((Date.now() - dueMs) / 86400000);
    if (daysOverdue <= 0) {
      return { text: "15-Day Safe", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (daysOverdue <= 30) {
      return { text: `${daysOverdue}d overdue (45d Cap)`, cls: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { text: `${daysOverdue}d overdue • 43B(h) Risk`, cls: "bg-red-50 text-red-700 border-red-200" };
  };

  // Create Invoice PoS & Tax Breakdown
  const selectedCreateClient = useMemo(() => {
    return clientMap.get(newEntityId) || selectedClient || clients[0] || null;
  }, [newEntityId, clientMap, selectedClient, clients]);

  const posResult = useMemo(() => {
    return determinePlaceOfSupply(selectedCreateClient?.gstin, DEFAULT_FIRM_BRANDING.gstin || "27AAACF2299R1ZG");
  }, [selectedCreateClient]);

  const extraTaxableSum = useMemo(
    () => extraLines.filter((l) => !l.isPureAgent).reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [extraLines]
  );
  const pureAgentSum = useMemo(
    () => extraLines.filter((l) => l.isPureAgent).reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [extraLines]
  );

  const taxBreakdown = useMemo(() => {
    const base = calculateTaxAndTds((Number(newTaxableAmount) || 0) + extraTaxableSum, posResult.isInterState, applyTds, tdsRate);
    return {
      ...base,
      pureAgentAmount: Math.round(pureAgentSum),
      grossInvoiceAmount: base.grossInvoiceAmount + Math.round(pureAgentSum),
      netAmountPayable: base.netAmountPayable + Math.round(pureAgentSum),
    };
  }, [newTaxableAmount, extraTaxableSum, pureAgentSum, posResult.isInterState, applyTds, tdsRate]);

  const openCreateModal = (prefillWip?: WipJobItem) => {
    setExtraLines([]);
    if (prefillWip) {
      setNewEntityId(prefillWip.entityId);
      setNewSacCode(prefillWip.sacCode || "998231");
      setNewServiceDesc(prefillWip.serviceTitle);
      setNewTaxableAmount(String(prefillWip.estimatedFee || 5000));
      setLinkedWipId(prefillWip.id);
    } else {
      setNewEntityId(activeEntityId || clients[0]?.id || "");
      setLinkedWipId(null);
    }
    setIsCreateOpen(true);
  };

  const handleSubmitCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = selectedCreateClient;
    if (!targetClient) {
      toast.error("Client Required", "Select a client entity before raising a tax invoice.");
      return;
    }
    if (taxBreakdown.taxableAmount <= 0 && taxBreakdown.pureAgentAmount <= 0) {
      toast.error("Invalid Amount", "Enter a positive fee or pure-agent amount.");
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const builtLines: InvoiceLineItem[] = [
        {
          id: "L-0",
          description: newServiceDesc.trim(),
          sacCode: newSacCode,
          quantity: 1,
          unitRate: Number(newTaxableAmount) || 0,
          discount: 0,
          isPureAgent: false,
          taxableValue: Number(newTaxableAmount) || 0,
          gstRate: 18,
          gstAmount: Math.round((Number(newTaxableAmount) || 0) * 0.18),
          lineTotal: Math.round((Number(newTaxableAmount) || 0) * 1.18),
        },
        ...extraLines.map((l, idx) => {
          const amt = Number(l.amount) || 0;
          const gst = l.isPureAgent ? 0 : Math.round(amt * 0.18);
          return {
            id: `L-${idx + 1}`,
            description: l.description,
            sacCode: l.sacCode || newSacCode,
            quantity: 1,
            unitRate: amt,
            discount: 0,
            isPureAgent: l.isPureAgent,
            taxableValue: amt,
            gstRate: l.isPureAgent ? 0 : 18,
            gstAmount: gst,
            lineTotal: amt + gst,
          };
        }),
      ];

      const payload: Partial<InvoiceItem> = {
        documentType: newDocType,
        entityId: targetClient.id,
        entityName: targetClient.name,
        groupId: targetClient.groupId,
        serviceDescription: newServiceDesc.trim(),
        sacCode: newSacCode,
        lineItems: builtLines,
        pureAgentAmount: taxBreakdown.pureAgentAmount,
        taxableAmount: taxBreakdown.taxableAmount,
        gstRate: 18,
        gstAmount: taxBreakdown.totalGstAmount,
        amount: taxBreakdown.grossInvoiceAmount,
        dueDate: newDueDate,
        financialYear: selectedFy,
        tdsRate: applyTds ? tdsRate : 0,
        tdsAmount: taxBreakdown.tdsAmountDeducted,
        isInterState: posResult.isInterState,
        placeOfSupply: posResult.taxType === "INTER_STATE" ? `Inter-State (${posResult.clientStateCode})` : `Intra-State (${posResult.firmStateCode})`,
        wipJobId: linkedWipId || undefined,
      };

      if (onCreateInvoice) {
        const res = await onCreateInvoice(payload);
        if (!res.success) {
          toast.error("Invoice Failed", res.error || "Could not create invoice.");
          return;
        }
      } else {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error("Invoice Failed", json.error || "Could not create invoice.");
          return;
        }
      }

      toast.success("Tax Invoice Issued", `Billed ₹${taxBreakdown.grossInvoiceAmount.toLocaleString("en-IN")} to ${targetClient.name}.`);
      setIsCreateOpen(false);
      setLinkedWipId(null);
      await Promise.all([fetchInvoices(), fetchWipJobs()]);
      if (onRefreshData) onRefreshData();
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleBulkConvertWip = async () => {
    const ids = Object.keys(selectedWipIds).filter((id) => selectedWipIds[id]);
    if (ids.length === 0) return;
    try {
      const res = await fetch("/api/billing/wip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "CONVERT_TO_INVOICE", wipIds: ids }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Bulk Billing Failed", json.error || "Could not convert selected WIP jobs.");
        return;
      }
      toast.success("WIP Billed", `Generated ${json.invoices?.length || ids.length} tax invoice(s).`);
      setSelectedWipIds({});
      await Promise.all([fetchInvoices(), fetchWipJobs()]);
      if (onRefreshData) onRefreshData();
    } catch {
      toast.error("Error", "Network error converting WIP.");
    }
  };

  const handleLogManualWip = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = wipEntityId || activeEntityId || clients[0]?.id;
    if (!targetId || !wipTitle.trim()) {
      toast.error("Required", "Client and service title are required.");
      return;
    }
    try {
      const res = await fetch("/api/billing/wip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          entityId: targetId,
          serviceTitle: wipTitle.trim(),
          sacCode: wipSac,
          hoursSpent: Number(wipHours) || 0,
          estimatedFee: Number(wipFee) || 0,
          financialYear: selectedFy,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Failed", json.error || "Could not log WIP.");
        return;
      }
      toast.success("WIP Logged", "Added to Unbilled Work-in-Progress.");
      setIsLogWipOpen(false);
      setWipTitle("");
      await fetchWipJobs();
    } catch {
      toast.error("Error", "Network error logging WIP.");
    }
  };

  const handleConfirmReconcile = async () => {
    if (!reconcileInvoiceTarget) return;
    if (!utrInput.trim()) {
      toast.error("UTR Required", "Enter the Bank UTR / Cheque reference number.");
      return;
    }
    setIsSubmittingReconcile(true);
    try {
      if (onReconcileInvoice) {
        await onReconcileInvoice(reconcileInvoiceTarget.id, {
          utr: utrInput.trim(),
          mode: paymentMode,
          note: payerNote.trim() || undefined,
        });
      }
      toast.success("Payment Reconciled", `Invoice ${reconcileInvoiceTarget.invoiceNo} settled. Deliverables unlocked.`);
      setReconcileInvoiceTarget(null);
      await fetchInvoices();
      if (onRefreshData) onRefreshData();
    } finally {
      setIsSubmittingReconcile(false);
    }
  };

  const handleQuickWhatsAppReminder = (inv: InvoiceItem) => {
    const client = clientMap.get(inv.entityId);
    const phone = client?.primaryContact?.phone || "";
    if (!phone) {
      toast.error("Phone Missing", `Add a primary contact phone for ${inv.entityName} in Client Master.`);
      return;
    }
    openWhatsAppPreset(phone, "FEE_INVOICE_UTR", {
      clientName: inv.entityName,
      invoiceNo: inv.invoiceNo,
      serviceName: inv.serviceDescription,
      invoiceAmount: inv.amount,
      firmUpiVpa: DEFAULT_FIRM_BRANDING.firmUpiVpa,
    });
    toast.success("WhatsApp Opened", `Reminder ready for ${inv.entityName}.`);
  };

  const handleExportCsv = () => {
    const headers = "Invoice No,Client Name,FY,SAC Code,Service,Taxable,GST,Total,Due Date,Status,UTR";
    const rows = displayedInvoices.map(
      (i) =>
        `"${i.invoiceNo}","${i.entityName}","${i.financialYear || selectedFy}","${i.sacCode || "998231"}","${i.serviceDescription}",${i.taxableAmount},${i.gstAmount},${i.amount},"${i.dueDate}","${i.status}","${i.clientUtrNumber || ""}"`
    );
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fee_Register_${selectedFy}_${selectedClient && !isFirmWideView ? selectedClient.pan : "FIRM"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-600" />
              Billing &amp; WIP
            </h1>
            {selectedClient && !isFirmWideView && (
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {selectedClient.name} &bull; PAN: {selectedClient.pan} &bull; FY {selectedFy}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openCreateModal()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>

            <button
              onClick={() => setIsBankModalOpen(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bank Reconcile</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen((v) => !v)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export / Import</span>
              </button>
              {isExportMenuOpen && (
                <div
                  onMouseLeave={() => setIsExportMenuOpen(false)}
                  className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 text-xs"
                >
                  <button
                    onClick={() => { setIsExportMenuOpen(false); handleExportCsv(); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" /> Fee Register CSV
                  </button>
                  <a
                    href={`/api/billing/exports?type=gstr1&fy=${encodeURIComponent(selectedFy)}`}
                    onClick={() => setIsExportMenuOpen(false)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-600" /> Firm GSTR-1 JSON
                  </a>
                  <a
                    href={`/api/billing/exports?type=tally3&fy=${encodeURIComponent(selectedFy)}`}
                    onClick={() => setIsExportMenuOpen(false)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-600" /> Tally 3-Voucher XML
                  </a>
                  <button
                    onClick={() => { setIsExportMenuOpen(false); setIsImportOpen(true); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" /> Import Vyapar / Tally CSV
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSyncAll}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInvoices ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Live KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => { setActiveTab("INVOICES"); setStatusFilter("ALL"); }}
          className="text-left bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-2xl transition shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Billed (FY {selectedFy})</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{(metrics.totalBilled / 100000).toFixed(2)}L
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">{metrics.totalInvoicesCount} Invoices</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("INVOICES"); setStatusFilter("PAID"); }}
          className="text-left bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 p-4 rounded-2xl transition shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Fee Collections Received</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              ₹{(metrics.collected / 100000).toFixed(2)}L
            </span>
            <span className="text-[11px] text-emerald-700 font-bold font-mono">{metrics.realizationRate}% realized</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("INVOICES");
            setStatusFilter(metrics.utrReviewCount > 0 ? "UTR_SUBMITTED" : "PENDING");
          }}
          className="text-left bg-red-50/70 hover:bg-red-50 border border-red-200 p-4 rounded-2xl transition shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-red-700 block">Pending Recovery</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-red-700">
              ₹{(metrics.pending / 100000).toFixed(2)}L
            </span>
            <span className="text-[11px] text-red-600 font-semibold">
              {metrics.utrReviewCount > 0 ? `${metrics.utrReviewCount} UTR Review` : "Outstanding"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("UNBILLED_WIP")}
          className="text-left bg-amber-50/70 hover:bg-amber-50 border border-amber-200 p-4 rounded-2xl transition shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Unbilled WIP Ready</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-amber-800">
              ₹{(metrics.wipTotal / 1000).toFixed(1)}k
            </span>
            <span className="text-[11px] text-amber-700 font-semibold">{metrics.wipCount} Jobs</span>
          </div>
        </button>
      </div>

      {/* Navigation & Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "INVOICES" as const, label: `Invoices & Receipts (${metrics.totalInvoicesCount})`, icon: DollarSign },
            { id: "UNBILLED_WIP" as const, label: `Unbilled WIP (${metrics.wipCount})`, icon: Clock },
            { id: "PARTY_LEDGER" as const, label: "Party Ledger", icon: BookOpen },
            { id: "AUTOPILOT" as const, label: "Autopilot & Retainers", icon: Zap },
            { id: "MSME_RECOVERY" as const, label: "MSME 43B(h)", icon: Scale },
            { id: "SCOPE_CREEP" as const, label: "Scope Creep", icon: Layers },
            { id: "IMPREST" as const, label: "Imprest (Rule 33)", icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  active ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "INVOICES" && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search client, invoice #..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 w-48"
              />
            </div>

            <select
              value={smartView}
              onChange={(e) => setSmartView(e.target.value as any)}
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-slate-50 text-slate-700"
            >
              <option value="ALL">View: All</option>
              <option value="MSME_RISK">43B(h) &gt;30d Risk</option>
              <option value="HIGH_VALUE">High Value (&gt;₹50k)</option>
              <option value="PROFORMA">Proforma Only</option>
              <option value="CREDIT_NOTE">Credit Notes</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-slate-50 text-slate-700"
            >
              <option value="DATE_DESC">Sort: Latest</option>
              <option value="AMOUNT_DESC">Amount: High-Low</option>
              <option value="DUE_ASC">Due Date: Earliest</option>
            </select>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-600">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "PENDING", label: "Pending" },
                  { id: "UTR_SUBMITTED", label: "UTR Review" },
                  { id: "PAID", label: "Paid" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === f.id ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: TAX INVOICES & RECEIPTS */}
      {activeTab === "INVOICES" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {Object.values(selectedInvoiceIds).some(Boolean) && (
            <div className="px-4 py-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                <strong>{Object.values(selectedInvoiceIds).filter(Boolean).length}</strong> invoice(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const ids = Object.keys(selectedInvoiceIds).filter((id) => selectedInvoiceIds[id]);
                    for (const id of ids) {
                      await fetch("/api/invoices", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ invoiceId: id, action: "TOGGLE_DUNNING_PAUSE" }),
                      });
                    }
                    toast.success("Dunning Updated", `Toggled dunning pause on ${ids.length} invoice(s).`);
                    setSelectedInvoiceIds({});
                    fetchInvoices();
                  }}
                  className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 font-semibold"
                >
                  Pause/Resume Reminders
                </button>
                <button
                  onClick={() => setSelectedInvoiceIds({})}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const next: Record<string, boolean> = {};
                        if (checked) displayedInvoices.forEach((i) => { next[i.id] = true; });
                        setSelectedInvoiceIds(next);
                      }}
                    />
                  </th>
                  <th className="px-4 py-3">Invoice &amp; Client</th>
                  <th className="px-4 py-3">Service &amp; SAC</th>
                  <th className="px-4 py-3 text-right">Fee &amp; GST</th>
                  <th className="px-4 py-3">Due Date &amp; 43B(h)</th>
                  <th className="px-4 py-3">Status / UTR</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-sm text-slate-800">No invoices matching this filter</p>
                      <button
                        onClick={() => openCreateModal()}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                      >
                        + Create Tax Invoice
                      </button>
                    </td>
                  </tr>
                ) : (
                  displayedInvoices.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    const isUtr = inv.status === "UTR_SUBMITTED";
                    const isProforma = inv.documentType === "PROFORMA";
                    const msme = getMsmeAgingBadge(inv);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedInvoiceIds[inv.id])}
                            onChange={(e) =>
                              setSelectedInvoiceIds((prev) => ({ ...prev, [inv.id]: e.target.checked }))
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{inv.entityName}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {inv.invoiceNo}
                            {inv.documentType && inv.documentType !== "TAX_INVOICE" && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold">
                                {inv.documentType}
                              </span>
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          <span className="font-semibold text-slate-800 block truncate">{inv.serviceDescription}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SAC {inv.sacCode || "998231"}</span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono">
                          <span className="font-bold text-slate-900 block">₹{inv.amount.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] text-slate-400">
                            ₹{inv.taxableAmount.toLocaleString("en-IN")} + 18% GST
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-slate-800 block">{inv.dueDate}</span>
                          <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${msme.cls}`}>
                            {msme.text}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {isPaid ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                PAID
                              </span>
                              {inv.clientUtrNumber && (
                                <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                                  UTR: {inv.clientUtrNumber}
                                </span>
                              )}
                            </div>
                          ) : isUtr ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3" />
                                UTR REVIEW
                              </span>
                              {inv.clientUtrNumber && (
                                <span className="block text-[10px] font-mono text-amber-700 mt-0.5">
                                  {inv.clientUtrNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3" />
                              PENDING
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewInvoice(inv)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Preview GST Tax Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {isProforma && (
                              <button
                                onClick={async () => {
                                  const res = await fetch("/api/invoices", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ invoiceId: inv.id, action: "CONVERT_PROFORMA" }),
                                  });
                                  if (res.ok) {
                                    toast.success("Converted", "Proforma converted to GST Tax Invoice.");
                                    fetchInvoices();
                                  }
                                }}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition"
                                title="Convert Proforma to Tax Invoice"
                              >
                                Convert
                              </button>
                            )}

                            {!isPaid && (
                              <button
                                onClick={() => handleQuickWhatsAppReminder(inv)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                title="WhatsApp Payment Link"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!isPaid ? (
                              <button
                                onClick={() => {
                                  setReconcileInvoiceTarget(inv);
                                  setUtrInput(inv.clientUtrNumber || "");
                                  setPaymentMode(inv.clientPaymentMode || "NEFT_RTGS");
                                  setPayerNote(inv.clientPayerNote || "");
                                  setIsPartialMode(false);
                                  setPartialCash(String(Math.max(0, inv.amount - Number(inv.paidAmount || 0))));
                                  setPartialTds("0");
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition"
                              >
                                {isUtr ? "Verify UTR" : "Reconcile"}
                              </button>
                            ) : (
                              <a
                                href={`/api/billing/receipt?invoiceId=${inv.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Receipt
                              </a>
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
              <span>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalFiltered} records)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: UNBILLED WORK-IN-PROGRESS */}
      {activeTab === "UNBILLED_WIP" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Unbilled Work-in-Progress</h3>
              <p className="text-xs text-slate-500">
                Completed statutory filings and logged advisory hours ready to convert into GST tax invoices.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {Object.values(selectedWipIds).some(Boolean) && (
                <button
                  onClick={handleBulkConvertWip}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
                >
                  Bill Selected ({Object.values(selectedWipIds).filter(Boolean).length})
                </button>
              )}
              <button
                onClick={() => {
                  setWipEntityId(activeEntityId || clients[0]?.id || "");
                  setIsLogWipOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Log WIP
              </button>
            </div>
          </div>

          {isLoadingWip ? (
            <div className="py-10 text-center text-xs text-slate-500">Loading unbilled WIP...</div>
          ) : wipJobs.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No unbilled WIP jobs for FY {selectedFy}. Completed tasks from Tasks &amp; Deadlines appear here automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wipJobs.map((job) => {
                const ageDays = Math.floor((Date.now() - new Date(job.completionDate).getTime()) / 86400000);
                return (
                <div
                  key={job.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedWipIds[job.id])}
                      onChange={(e) =>
                        setSelectedWipIds((prev) => ({ ...prev, [job.id]: e.target.checked }))
                      }
                      className="mt-1 rounded border-slate-300"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-xs text-slate-900 truncate">{job.entityName}</strong>
                        {ageDays > 30 ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                            {ageDays}d • Leakage
                          </span>
                        ) : ageDays > 15 ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {ageDays}d unbilled
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-slate-600 block truncate">{job.serviceTitle}</span>
                      <span className="text-[10px] text-slate-500">
                        {job.assignedStaff} &bull; {job.hoursSpent}h &bull; {job.completionDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1.5">
                    <span className="text-sm font-bold text-slate-900 block font-mono">
                      ₹{job.estimatedFee.toLocaleString("en-IN")}
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/billing/wip", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ id: job.id, status: "WRITTEN_OFF" }),
                          });
                          if (res.ok) {
                            toast.info("WIP Written Off", `${job.serviceTitle} marked written off.`);
                            fetchWipJobs();
                          }
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Write Off
                      </button>
                      <button
                        onClick={() => openCreateModal(job)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition inline-flex items-center gap-1"
                      >
                        <span>Issue Bill</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: PARTY LEDGER (VYAPAR-STYLE STATEMENT OF ACCOUNT + 26AS + SUSPENSE) */}
      {activeTab === "PARTY_LEDGER" && (
        <PartyLedgerDesk
          clients={clients}
          invoices={displayedInvoices}
          onRefresh={() => {
            fetchInvoices();
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* VIEW 4: AUTOPILOT & RETAINERS */}
      {activeTab === "AUTOPILOT" && (
        <AutopilotRetainersDesk
          clients={clients}
          onRefresh={() => {
            fetchInvoices();
            fetchWipJobs();
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* VIEW 5: MSME 43B(h) RECOVERY */}
      {activeTab === "MSME_RECOVERY" && <MsmeRecoveryDesk />}

      {/* VIEW 6: SCOPE CREEP */}
      {activeTab === "SCOPE_CREEP" && <ScopeCreepDesk />}

      {/* VIEW 7: IMPREST ESCROW (RULE 33) */}
      {activeTab === "IMPREST" && <ImprestLedgerDesk clients={clients} />}

      {/* CREATE TAX INVOICE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Issue Statutory Tax Invoice (SAC 9982)</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Document Type</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as InvoiceDocType)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 font-bold"
                  >
                    <option value="TAX_INVOICE">Tax Invoice</option>
                    <option value="PROFORMA">Proforma Invoice</option>
                    <option value="CREDIT_NOTE">Credit Note</option>
                    <option value="ADVANCE_RECEIPT">Advance Receipt</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Client Entity</label>
                  <select
                    value={selectedCreateClient?.id || ""}
                    onChange={(e) => setNewEntityId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-semibold"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.pan})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">SAC Code</label>
                  <select
                    value={newSacCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setNewSacCode(code);
                      const found = CA_SAC_SERVICES.find((s) => s.sacCode === code);
                      if (found) setNewServiceDesc(found.description);
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                  >
                    {CA_SAC_SERVICES.map((s) => (
                      <option key={s.sacCode} value={s.sacCode}>
                        {s.sacCode} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Service Description</label>
                <input
                  type="text"
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Taxable Fee (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={newTaxableAmount}
                    onChange={(e) => setNewTaxableAmount(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">TDS u/s 194J</label>
                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      type="checkbox"
                      checked={applyTds}
                      onChange={(e) => setApplyTds(e.target.checked)}
                    />
                    <span>Deduct</span>
                    {applyTds && (
                      <select
                        value={tdsRate}
                        onChange={(e) => setTdsRate(Number(e.target.value) as 10 | 2)}
                        className="border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50"
                      >
                        <option value={10}>10% (194J)</option>
                        <option value={2}>2% (194J Tech)</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Line Items / Rule 33 Pure Agent Reimbursements */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Additional Lines / Rule 33 Challans</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExtraLines((prev) => [
                        ...prev,
                        { description: "MCA / Statutory Challan (Pure Agent)", sacCode: "998235", amount: "1000", isPureAgent: true },
                      ])
                    }
                    className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Line
                  </button>
                </div>
                {extraLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => {
                        const v = e.target.value;
                        setExtraLines((prev) => prev.map((l, i) => (i === idx ? { ...l, description: v } : l)));
                      }}
                      className="col-span-5 border border-slate-200 rounded px-2 py-1 bg-white"
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      value={line.amount}
                      onChange={(e) => {
                        const v = e.target.value;
                        setExtraLines((prev) => prev.map((l, i) => (i === idx ? { ...l, amount: v } : l)));
                      }}
                      className="col-span-3 border border-slate-200 rounded px-2 py-1 bg-white font-mono"
                    />
                    <label className="col-span-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                      <input
                        type="checkbox"
                        checked={line.isPureAgent}
                        onChange={(e) => {
                          const c = e.target.checked;
                          setExtraLines((prev) => prev.map((l, i) => (i === idx ? { ...l, isPureAgent: c } : l)));
                        }}
                      />
                      Rule 33 (0%)
                    </label>
                    <button
                      type="button"
                      onClick={() => setExtraLines((prev) => prev.filter((_, i) => i !== idx))}
                      className="col-span-1 text-slate-400 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Place of Supply:</span>
                  <span>{posResult.taxType === "INTER_STATE" ? `Inter-State (State ${posResult.clientStateCode})` : `Intra-State (State ${posResult.firmStateCode})`}</span>
                </div>
                <div className="flex justify-between">
                  <span>{posResult.isInterState ? "IGST (18%):" : "CGST (9%) + SGST (9%):"}</span>
                  <span>₹{taxBreakdown.totalGstAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Total Invoice Value:</span>
                  <span>₹{taxBreakdown.grossInvoiceAmount.toLocaleString("en-IN")}</span>
                </div>
                {applyTds && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Net Receivable (post {tdsRate}% TDS):</span>
                    <span>₹{taxBreakdown.netAmountPayable.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingInvoice}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  {isCreatingInvoice ? "Issuing..." : "Issue Tax Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG MANUAL WIP MODAL */}
      {isLogWipOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Log Unbilled WIP</h3>
              <button onClick={() => setIsLogWipOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleLogManualWip} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Client Entity</label>
                <select
                  value={wipEntityId}
                  onChange={(e) => setWipEntityId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-semibold"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Service / Engagement</label>
                <input
                  type="text"
                  value={wipTitle}
                  onChange={(e) => setWipTitle(e.target.value)}
                  placeholder="e.g. GST Scrutiny Reply u/s 73"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">SAC</label>
                  <input
                    type="text"
                    value={wipSac}
                    onChange={(e) => setWipSac(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={wipHours}
                    onChange={(e) => setWipHours(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Est. Fee (₹)</label>
                  <input
                    type="number"
                    value={wipFee}
                    onChange={(e) => setWipFee(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsLogWipOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold">
                  Save WIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECONCILE PAYMENT MODAL */}
      {reconcileInvoiceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Reconcile Fee Payment</h3>
                <p className="text-[11px] text-slate-500">{reconcileInvoiceTarget.entityName}</p>
              </div>
              <button onClick={() => setReconcileInvoiceTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <strong className="font-mono">{reconcileInvoiceTarget.invoiceNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <strong className="text-emerald-700 font-mono">
                  ₹{reconcileInvoiceTarget.amount.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Payment Mode</label>
                <div className="grid grid-cols-4 gap-1.5 font-bold">
                  {(["UPI", "NEFT_RTGS", "IMPS", "CHEQUE"] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMode(m)}
                      className={`py-1.5 rounded-lg border transition ${
                        paymentMode === m
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {m === "NEFT_RTGS" ? "NEFT" : m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Bank UTR / Ref No</label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. HDFCR5202611270091"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Payer Note (Optional)</label>
                <input
                  type="text"
                  value={payerNote}
                  onChange={(e) => setPayerNote(e.target.value)}
                  placeholder="e.g. Settled net of 10% TDS u/s 194J"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPartialMode}
                  onChange={(e) => setIsPartialMode(e.target.checked)}
                />
                <span>Record Partial Payment / TDS u/s 194J Split</span>
              </label>

              {isPartialMode && (
                <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Cash Received (₹)</label>
                    <input
                      type="number"
                      value={partialCash}
                      onChange={(e) => setPartialCash(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">TDS Deducted (₹)</label>
                    <input
                      type="number"
                      value={partialTds}
                      onChange={(e) => setPartialTds(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-bold bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReconcileInvoiceTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (isPartialMode && reconcileInvoiceTarget) {
                    setIsSubmittingReconcile(true);
                    try {
                      const res = await fetch("/api/invoices", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          invoiceId: reconcileInvoiceTarget.id,
                          action: "ALLOCATE_PAYMENT",
                          cashAmount: Number(partialCash || 0),
                          tdsAmount: Number(partialTds || 0),
                          clientUtrNumber: utrInput.trim(),
                          clientPaymentMode: paymentMode,
                          clientPayerNote: payerNote.trim() || undefined,
                        }),
                      });
                      if (res.ok) {
                        toast.success("Allocation Recorded", "Payment & TDS split applied to party ledger.");
                        setReconcileInvoiceTarget(null);
                        await fetchInvoices();
                        if (onRefreshData) onRefreshData();
                      } else {
                        toast.error("Failed", "Could not apply partial/TDS allocation.");
                      }
                    } finally {
                      setIsSubmittingReconcile(false);
                    }
                    return;
                  }
                  await handleConfirmReconcile();
                }}
                disabled={isSubmittingReconcile}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmittingReconcile ? "Reconciling..." : isPartialMode ? "Apply Allocation" : "Confirm & Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAX INVOICE PREVIEW MODAL */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tax Invoice</span>
                <h3 className="font-bold text-base text-slate-900">{DEFAULT_FIRM_BRANDING.firmName}</h3>
                <p className="text-[11px] text-slate-500">FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; GSTIN: {DEFAULT_FIRM_BRANDING.gstin}</p>
              </div>
              <button onClick={() => setPreviewInvoice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Billed To</span>
                <strong className="text-slate-900">{previewInvoice.entityName}</strong>
              </div>
              <div className="text-right font-mono">
                <span className="block font-bold text-slate-900">{previewInvoice.invoiceNo}</span>
                <span className="text-[11px] text-slate-500">Due: {previewInvoice.dueDate}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="flex justify-between px-4 py-2.5 bg-slate-50 font-bold text-slate-500 text-[10px] uppercase">
                <span>Particulars (SAC {previewInvoice.sacCode || "998231"})</span>
                <span>Amount</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">{previewInvoice.serviceDescription}</span>
                  <span className="font-mono">₹{previewInvoice.taxableAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{previewInvoice.isInterState ? "IGST (18%)" : "CGST (9%) + SGST (9%)"}</span>
                  <span className="font-mono">₹{previewInvoice.gstAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                  <span>Total Invoice Value</span>
                  <span className="font-mono">₹{previewInvoice.amount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={generateNpciDynamicUpiUri(
                  DEFAULT_FIRM_BRANDING.firmUpiVpa,
                  DEFAULT_FIRM_BRANDING.firmName,
                  previewInvoice.amount,
                  previewInvoice.invoiceNo,
                  previewInvoice.entityName
                )}
                className="text-xs font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                UPI Pay Link ({DEFAULT_FIRM_BRANDING.firmUpiVpa})
              </a>

              <div className="flex items-center gap-2">
                {previewInvoice.status === "PAID" && (
                  <a
                    href={`/api/billing/receipt?invoiceId=${previewInvoice.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Official Receipt PDF
                  </a>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK IMPORT RECEIVABLES MODAL (VYAPAR / TALLY / ZOHO CSV) */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Import Opening Receivables / Invoices</h3>
                <p className="text-[11px] text-slate-500">Paste CSV rows: Client Name or PAN, Invoice No, Amount, Due Date (YYYY-MM-DD), Service</p>
              </div>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={7}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              placeholder={"Pratwi Solutions Private Limited,BT/25-26/099,29500,2026-03-15,Audit Fee\nAANCP9915B,BT/25-26/100,11800,2026-03-20,GST Retainer"}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsImportOpen(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={async () => {
                  const lines = importCsvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
                  const rows = lines.map((line) => {
                    const [c1, invoiceNo, amt, dueDate, serviceDescription] = line.split(",").map((s) => s?.trim() || "");
                    const isPan = /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(c1);
                    return {
                      pan: isPan ? c1 : undefined,
                      clientName: isPan ? undefined : c1,
                      invoiceNo: invoiceNo || undefined,
                      amount: Number(amt || 0),
                      dueDate: dueDate || undefined,
                      serviceDescription: serviceDescription || undefined,
                    };
                  });
                  const res = await fetch("/api/billing/exports", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ rows }),
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    toast.success("Import Complete", `Imported ${data.imported} invoice(s) (${data.skipped} skipped).`);
                    setIsImportOpen(false);
                    setImportCsvText("");
                    fetchInvoices();
                    if (onRefreshData) onRefreshData();
                  } else {
                    toast.error("Import Failed", data.error || "Check CSV format.");
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
              >
                Import Invoices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANK STATEMENT AUTO-RECONCILE MODAL */}
      <BankStatementReconcileModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onReconciliationComplete={() => {
          fetchInvoices();
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
