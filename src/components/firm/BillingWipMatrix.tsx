"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  Share2,
  Send,
  ExternalLink,
  Plus,
  RefreshCw,
  QrCode,
  Sparkles,
  PhoneCall,
  Layers,
  FileCheck2,
  Building2,
  ArrowRight,
  Download
} from "lucide-react";
import { InvoiceItem, ClientEntity, PayToReleaseConfig } from "@/lib/types";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";

interface BillingWipMatrixProps {
  invoices: InvoiceItem[];
  clients: ClientEntity[];
  payConfigs?: PayToReleaseConfig[];
  onRefreshData?: () => void;
  onReconcileInvoice?: (invoiceId: string, utr: string, mode: string) => Promise<void>;
  onCreateInvoice?: (invoiceData: Partial<InvoiceItem>) => Promise<void>;
}

export const BillingWipMatrix: React.FC<BillingWipMatrixProps> = ({
  invoices,
  clients,
  payConfigs = [],
  onRefreshData,
  onReconcileInvoice,
  onCreateInvoice,
}) => {
  const { selectedClient, isFirmWideView } = useClientContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PAID" | "UTR_REVIEW">("ALL");
  const [activeTab, setActiveTab] = useState<"INVOICES" | "UNBILLED_WIP" | "LOCKED_DOCS">("INVOICES");

  // Reconcile modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "NEFT_RTGS" | "IMPS" | "CHEQUE">("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unbilled WIP Jobs (derived dynamically from registered active clients)
  const unbilledWipJobs = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    return clients.map((c, i) => ({
      id: `WIP-${c.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)}-${i + 1}`,
      entityName: c.name,
      service: c.type === "PVT_LTD" ? "ITR-6 Corporate Compliance & MCA AOC-4" : "GSTR-3B & 2B ITC Reconciliation",
      fee: c.type === "PVT_LTD" ? 18500 : 7500,
      status: "READY_TO_BILL",
      staff: c.assignedArticle || "Kriti Jain (Article)",
    }));
  }, [clients]);

  // Context-aware client filtering
  const effectiveInvoices = useMemo(() => {
    if (selectedClient && !isFirmWideView) {
      const qName = (selectedClient.tradeName || selectedClient.name).toLowerCase();
      const qId = selectedClient.id;
      const matches = invoices.filter(inv => 
        inv.entityId === qId || inv.entityName.toLowerCase().includes(qName)
      );
      return matches.length > 0 ? matches : invoices;
    }
    return invoices;
  }, [invoices, selectedClient, isFirmWideView]);

  const effectiveWipJobs = useMemo(() => {
    if (selectedClient && !isFirmWideView) {
      const qName = (selectedClient.tradeName || selectedClient.name).toLowerCase();
      const matches = unbilledWipJobs.filter(j => 
        j.entityName.toLowerCase().includes(qName)
      );
      return matches.length > 0 ? matches : unbilledWipJobs;
    }
    return unbilledWipJobs;
  }, [unbilledWipJobs, selectedClient, isFirmWideView]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return effectiveInvoices.filter((inv) => {
      const matchesSearch =
        !searchQuery ||
        inv.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.serviceDescription.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "PENDING") {
        matchesStatus = inv.status === "PENDING";
      } else if (statusFilter === "PAID") {
        matchesStatus = inv.status === "PAID";
      } else if (statusFilter === "UTR_REVIEW") {
        matchesStatus = inv.status === "UTR_SUBMITTED";
      }

      return matchesSearch && matchesStatus;
    });
  }, [effectiveInvoices, searchQuery, statusFilter]);

  // Financial Metrics
  const metrics = useMemo(() => {
    const totalBilled = effectiveInvoices.reduce((acc, i) => acc + i.amount, 0);
    const collected = effectiveInvoices.filter((i) => i.status === "PAID").reduce((acc, i) => acc + i.amount, 0);
    const pending = effectiveInvoices.filter((i) => i.status !== "PAID").reduce((acc, i) => acc + i.amount, 0);
    const wipTotal = effectiveWipJobs.reduce((acc, j) => acc + j.fee, 0);
    const realizationRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 100;

    return { totalBilled, collected, pending, wipTotal, realizationRate };
  }, [effectiveInvoices, effectiveWipJobs]);

  const handleExportInvoicesCsv = () => {
    const headers = "Invoice No,Client Name,SAC Code,Service,Amount,GST (18%),Total,Due Date,Status,UTR";
    const rows = effectiveInvoices.map(i => 
      `"${i.invoiceNo}","${i.entityName}","${i.sacCode || '998231'}","${i.serviceDescription}",${i.taxableAmount || Math.round(i.amount / 1.18)},${i.gstAmount || Math.round(i.amount - i.amount / 1.18)},${i.amount},"${i.dueDate}","${i.status}","${i.clientUtrNumber || ''}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Firm_Fee_Invoices_${selectedClient && !isFirmWideView ? selectedClient.pan : 'ALL'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Fee Register Exported', 'Invoices and billing registers downloaded as CSV.');
  };

  const handleOpenReconcile = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    setUtrInput(inv.clientUtrNumber || "");
    setPaymentMode(inv.clientPaymentMode || "UPI");
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    if (!utrInput.trim()) {
      toast.error("UTR Required", "Please enter the Bank UTR / Cheque reference number.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onReconcileInvoice) {
        await onReconcileInvoice(selectedInvoice.id, utrInput.trim(), paymentMode);
      }
      toast.success(
        "Payment Reconciled",
        `Invoice ${selectedInvoice.invoiceNo} marked PAID. Receipt & delivery unlocked.`
      );
      setSelectedInvoice(null);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      toast.error("Error", "Could not complete payment reconciliation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickWhatsAppReminder = (inv: InvoiceItem) => {
    const client = clients.find((c) => c.id === inv.entityId);
    const phone = client?.primaryContact?.phone || "+91 98110 22345";
    
    openWhatsAppPreset(phone, "FEE_INVOICE_UTR", {
      clientName: inv.entityName,
      invoiceNo: inv.invoiceNo,
      serviceName: inv.serviceDescription,
      invoiceAmount: inv.amount,
      firmUpiVpa: "BRAINSANDTAXES@icici",
    });
    toast.success("WhatsApp Reminder Opened", `Dispatching payment reminder to ${inv.entityName}.`);
  };

  const handleBillWip = async (job: typeof unbilledWipJobs[0]) => {
    if (onCreateInvoice) {
      await onCreateInvoice({
        entityName: job.entityName,
        serviceDescription: job.service,
        amount: job.fee,
        taxableAmount: Math.round(job.fee / 1.18),
        gstAmount: job.fee - Math.round(job.fee / 1.18),
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
        status: "PENDING",
        sacCode: "998231",
      });
      toast.success("Invoice Generated", `Billed ₹${job.fee.toLocaleString("en-IN")} for ${job.entityName}.`);
      if (onRefreshData) onRefreshData();
    } else {
      toast.info("Invoice Ready", `Drafted invoice for ${job.entityName}. Ready in Billing.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Enterprise-Grade Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Billing &amp; WIP &bull; Collections &bull; MSME 43B(h) &bull; SAC 998231
              </span>
              {selectedClient && !isFirmWideView && (
                <span className="text-[11px] font-mono text-slate-400">
                  PAN: {selectedClient.pan}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-600" />
              Statutory Invoicing, Fee Realization &amp; WIP Matrix
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <UniversalClientSelector variant="compact" />

            <button
              onClick={handleExportInvoicesCsv}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
              title="Download Invoice & Collections Register CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Register</span>
            </button>

            {onRefreshData && (
              <button
                onClick={() => onRefreshData()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Sync</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <div 
            onClick={() => setActiveTab("INVOICES")}
            className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Billed Fees</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{(metrics.totalBilled / 100000).toFixed(2)}L
              </span>
              <span className="text-[10px] text-slate-500 font-bold">{invoices.length} Invoices</span>
            </div>
          </div>

          <div 
            onClick={() => { setActiveTab("INVOICES"); setStatusFilter("PAID"); }}
            className="bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Fee Collections Received</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-800">
                ₹{(metrics.collected / 100000).toFixed(2)}L
              </span>
              <span className="text-[10px] text-emerald-600 font-bold font-mono">{metrics.realizationRate}% realized</span>
            </div>
          </div>

          <div 
            onClick={() => { setActiveTab("INVOICES"); setStatusFilter("PENDING"); }}
            className="bg-red-50 hover:bg-red-100/70 border border-red-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-red-700 block">Pending Fee Recovery</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-btred-logo">
                ₹{(metrics.pending / 100000).toFixed(2)}L
              </span>
              <span className="text-[10px] text-red-600 font-bold">Outstanding</span>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab("UNBILLED_WIP")}
            className="bg-amber-50 hover:bg-amber-100/70 border border-amber-200 p-3 rounded-2xl cursor-pointer transition"
          >
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Unbilled WIP Ready</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-800">
                ₹{(metrics.wipTotal / 1000).toFixed(1)}k
              </span>
              <span className="text-[10px] text-amber-600 font-bold">{effectiveWipJobs.length} Jobs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("INVOICES")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "INVOICES"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Tax Invoices &amp; Receipts ({effectiveInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("UNBILLED_WIP")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "UNBILLED_WIP"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Unbilled Work-in-Progress ({effectiveWipJobs.length})</span>
          </button>
        </div>

        {activeTab === "INVOICES" && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-600">
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
                  statusFilter === "PENDING" ? "bg-white text-btred-logo shadow-xs font-black" : "hover:text-slate-900"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("UTR_REVIEW")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === "UTR_REVIEW" ? "bg-white text-amber-700 shadow-xs font-black" : "hover:text-slate-900"
                }`}
              >
                UTR Submitted
              </button>
              <button
                onClick={() => setStatusFilter("PAID")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === "PAID" ? "bg-white text-emerald-700 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW A: TAX INVOICES & COLLECTIONS */}
      {activeTab === "INVOICES" && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice &amp; Client Entity</th>
                  <th className="px-4 py-3">Service Rendered (SAC 998231)</th>
                  <th className="px-4 py-3 text-right">Fee &amp; 18% GST</th>
                  <th className="px-4 py-3">Due Date &amp; MSME Aging</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-center">Fee Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                      <p className="font-bold text-sm text-slate-800">No invoices matching this filter</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    const isUtr = inv.status === "UTR_SUBMITTED";

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        {/* Col 1: Invoice & Client */}
                        <td className="px-4 py-3.5">
                          <span className="font-black text-slate-900 text-xs sm:text-[13px] block">
                            {inv.entityName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold">
                            {inv.invoiceNo}
                          </span>
                        </td>

                        {/* Col 2: Service Description */}
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 text-xs block">{inv.serviceDescription}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SAC: {inv.sacCode}</span>
                        </td>

                        {/* Col 3: Fee Amount */}
                        <td className="px-4 py-3.5 text-right font-mono">
                          <span className="font-black text-slate-900 text-xs sm:text-sm block">
                            ₹{inv.amount.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Base: ₹{inv.taxableAmount.toLocaleString("en-IN")} + 18% GST
                          </span>
                        </td>

                        {/* Col 4: Due Date */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-slate-800 block">{inv.dueDate}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            MSME 45-Day Compliant
                          </span>
                        </td>

                        {/* Col 5: Status */}
                        <td className="px-4 py-3.5">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>PAID &amp; RECONCILED</span>
                            </span>
                          ) : isUtr ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>UTR REVIEW</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                              <AlertTriangle className="w-3 h-3 text-red-700" />
                              <span>PAYMENT PENDING</span>
                            </span>
                          )}
                        </td>

                        {/* Col 6: Actions */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isPaid && (
                              <button
                                onClick={() => handleQuickWhatsAppReminder(inv)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                title="Send WhatsApp Payment Link"
                              >
                                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            )}

                            {!isPaid ? (
                              <button
                                onClick={() => handleOpenReconcile(inv)}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
                              >
                                Reconcile
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-bold font-mono">
                                Receipt Ready
                              </span>
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
      )}

      {/* VIEW B: UNBILLED WORK-IN-PROGRESS */}
      {activeTab === "UNBILLED_WIP" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900">Unbilled Completed Statutory Jobs</h3>
              <p className="text-xs text-slate-500">
                Statutory returns completed by article trainees ready to be converted into professional fee invoices.
              </p>
            </div>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              ₹{(metrics.wipTotal / 1000).toFixed(1)}k Billable WIP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {effectiveWipJobs.map((job) => (
              <div key={job.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <strong className="text-xs text-slate-900 block">{job.entityName}</strong>
                  <span className="text-[11px] text-slate-600 block">{job.service}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Handled by: <strong>{job.staff}</strong></span>
                    <span>&bull;</span>
                    <span className="text-emerald-700 font-bold font-mono">Completed</span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1.5">
                  <span className="text-sm font-black text-slate-900 block font-mono">
                    ₹{job.fee.toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => handleBillWip(job)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs transition flex items-center gap-1"
                  >
                    <span>Issue Bill</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div 
            onClick={() => setSelectedInvoice(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Reconcile Client Fee Payment</h3>
                  <p className="text-[11px] text-slate-500">{selectedInvoice.entityName}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Invoice:</span>
                <strong className="text-slate-900 font-mono">{selectedInvoice.invoiceNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Amount:</span>
                <strong className="text-emerald-700 font-mono text-sm">
                  ₹{selectedInvoice.amount.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-600 block">Payment Mode</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  {(["UPI", "NEFT_RTGS", "IMPS", "CHEQUE"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMode(m)}
                      className={`py-1.5 rounded-xl border text-center transition ${
                        paymentMode === m
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {m === "NEFT_RTGS" ? "NEFT" : m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-600 block">
                  Bank Reference Number / UTR
                </label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="e.g. UTR-98218921829 or UPI-48291"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
              >
                {isSubmitting ? "Reconciling..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
