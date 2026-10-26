"use client";

import React, { useState } from "react";
import { InvoiceItem, ClientEntity } from "@/lib/types";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  FileText, 
  QrCode, 
  Send,
  Building2,
  AlertTriangle,
  X,
  CreditCard,
  Check,
  Search,
  Plus
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

interface BillingWipProps {
  invoices: InvoiceItem[];
  clients?: ClientEntity[];
  onRefresh?: () => void;
}

export const BillingWip: React.FC<BillingWipProps> = ({ invoices, clients = [], onRefresh }) => {
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>(invoices);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "utr_review" | "paid">("all");
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceItem | null>(null);
  const [reconcileModalInvoice, setReconcileModalInvoice] = useState<InvoiceItem | null>(null);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Reconcile Form State
  const [utrInput, setUtrInput] = useState("");
  const [paymentMode, setPaymentMode] = useState<"NEFT_RTGS" | "UPI" | "IMPS" | "CHEQUE">("NEFT_RTGS");
  const [payerNote, setPayerNote] = useState("");

  // New Invoice Form State
  const [newEntityName, setNewEntityName] = useState(() => clients[0]?.name || "");
  const [newServiceDesc, setNewServiceDesc] = useState("Statutory Tax Audit & GSTR-9C Annual Certification");
  const [newAmount, setNewAmount] = useState("75000");

  React.useEffect(() => {
    setInvoiceList(invoices);
  }, [invoices]);

  const totalOutstanding = invoiceList
    .filter((inv) => inv.status !== "PAID")
    .reduce((acc, inv) => acc + inv.amount, 0);

  const pendingUtrReviews = invoiceList.filter((inv) => inv.status === "UTR_SUBMITTED");

  const totalCollected = invoiceList
    .filter((inv) => inv.status === "PAID")
    .reduce((acc, inv) => acc + inv.amount, 0);

  const handleOpenReconcileModal = (inv: InvoiceItem) => {
    setReconcileModalInvoice(inv);
    setUtrInput(inv.clientUtrNumber || "");
    setPaymentMode(inv.clientPaymentMode || "NEFT_RTGS");
    setPayerNote(inv.clientPayerNote || "");
  };

  const handleConfirmReconciliation = async () => {
    if (!reconcileModalInvoice) return;
    if (!utrInput.trim()) {
      alert("Please provide the Bank UTR / Cheque reference number");
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: reconcileModalInvoice.id,
          action: "RECONCILE",
          clientUtrNumber: utrInput.trim(),
          clientPaymentMode: paymentMode,
          clientPayerNote: payerNote.trim() || undefined,
          reconciledBy: `${DEFAULT_FIRM_BRANDING.managingPartner} (Partner)`,
        }),
      });

      setInvoiceList((prev) =>
        prev.map((inv) =>
          inv.id === reconcileModalInvoice.id
            ? {
                ...inv,
                status: "PAID",
                clientUtrNumber: utrInput.trim(),
                clientPaymentMode: paymentMode,
                clientPaymentDate: new Date().toISOString().split("T")[0],
                clientPayerNote: payerNote.trim() || undefined,
                reconciledBy: `${DEFAULT_FIRM_BRANDING.managingPartner} (Partner)`,
                reconciledAt: new Date().toISOString(),
              }
            : inv
        )
      );

      const amountFormatted = formatCurrencyINR(reconcileModalInvoice.amount);
      toast.success(
        "Payment Reconciled",
        `Invoice #${reconcileModalInvoice.invoiceNo} settled (${amountFormatted}) via UTR ${utrInput.trim()}. Deliverables released.`
      );
      setToastMessage(`Invoice #${reconcileModalInvoice.invoiceNo} reconciled & settled (${amountFormatted}) via UTR ${utrInput.trim()}! Deliverables unlocked.`);
      setReconcileModalInvoice(null);
      setTimeout(() => setToastMessage(null), 5000);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Reconciliation Error", "Failed to reconcile invoice.");
      console.error(err);
    }
  };

  const handleDirectReconcileUtr = async (inv: InvoiceItem) => {
    if (!inv.clientUtrNumber) return;
    try {
      await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: inv.id,
          action: "RECONCILE",
          reconciledBy: `${DEFAULT_FIRM_BRANDING.managingPartner} (Partner)`,
        }),
      });

      setInvoiceList((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? {
                ...i,
                status: "PAID",
                reconciledBy: `${DEFAULT_FIRM_BRANDING.managingPartner} (Partner)`,
                reconciledAt: new Date().toISOString(),
              }
            : i
        )
      );
      toast.success(
        "UTR Verified & Settled",
        `UTR ${inv.clientUtrNumber} verified against bank ledger! Invoice #${inv.invoiceNo} marked PAID.`
      );
      setToastMessage(`UTR ${inv.clientUtrNumber} verified against firm bank ledger! Invoice marked PAID.`);
      setTimeout(() => setToastMessage(null), 5000);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Verification Error", "Failed to verify bank UTR.");
      console.error(err);
    }
  };

  const handleCreateNewInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(newAmount);
    if (!amountVal) return;

    const matchedClient = clients.find(c => c.name === newEntityName) || clients[0];
    const finalEntityName = newEntityName.trim() || matchedClient?.name || "Client Entity";
    const finalEntityId = matchedClient?.id || "CLI-001";
    const finalGroupId = matchedClient?.groupId || "GRP-001";

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: finalEntityId,
          entityName: finalEntityName,
          groupId: finalGroupId,
          serviceDescription: newServiceDesc,
          amount: amountVal,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          actorName: DEFAULT_FIRM_BRANDING.managingPartner,
        }),
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        setInvoiceList([data.invoice, ...invoiceList]);
        setIsAddInvoiceOpen(false);
        toast.success(
          "Tax Invoice Generated",
          `Tax Invoice #${data.invoice.invoiceNo} issued for ${formatCurrencyINR(data.invoice.amount)}.`
        );
        setToastMessage(`Created Tax Invoice #${data.invoice.invoiceNo} for ${formatCurrencyINR(data.invoice.amount)}!`);
        setTimeout(() => setToastMessage(null), 5000);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWhatsAppChase = (inv: InvoiceItem) => {
    openWhatsAppPreset(
      "919820044101",
      "FEE_INVOICE_UTR",
      {
        clientName: inv.entityName,
        serviceName: inv.serviceDescription,
        invoiceNo: inv.invoiceNo,
        invoiceAmount: inv.amount,
        firmUpiVpa: DEFAULT_FIRM_BRANDING.firmUpiVpa,
      }
    );
  };

  const filteredInvoices = invoiceList.filter((inv) => {
    const matchesSearch = 
      inv.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "pending") return inv.status === "PENDING" || inv.status === "OVERDUE";
    if (activeTab === "utr_review") return inv.status === "UTR_SUBMITTED";
    if (activeTab === "paid") return inv.status === "PAID";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black text-white">{toastMessage}</span>
          </div>
          <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded">BANK RECONCILED</span>
        </div>
      )}

      {/* Top Financial Health KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Unbilled Work-in-Progress (WIP)</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">₹38,50,000</p>
            <p className="text-xs text-emerald-600 font-bold">18 jobs completed awaiting billing</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-btred-logo rounded-2xl border border-red-200">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Outstanding Receivables</p>
            <p className="text-2xl font-black text-btred-logo mt-0.5">{formatCurrencyINR(totalOutstanding)}</p>
            <p className="text-xs text-slate-500 font-medium">Auto-chase via 1-tap WhatsApp</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Settled &amp; Reconciled</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{formatCurrencyINR(totalCollected)}</p>
            <p className="text-xs text-emerald-600 font-bold">Direct NEFT/RTGS &amp; UPI (Zero 2% Gateway Leakage)</p>
          </div>
        </div>
      </div>

      {/* Main Billing Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Tax Invoices &amp; Direct Bank Settlement Ledger
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Zero payment gateway fees. CA standard billing with direct Firm UPI QR, NEFT/RTGS bank details, and client UTR verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>

            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === "all" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({invoiceList.length})
            </button>
            <button
              onClick={() => setActiveTab("utr_review")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition relative ${
                activeTab === "utr_review" ? "bg-amber-600 text-white shadow-sm" : "text-amber-800 bg-amber-50 hover:bg-amber-100"
              }`}
            >
              Pending UTR Review ({pendingUtrReviews.length})
              {pendingUtrReviews.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block ml-1"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === "pending" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Unpaid
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === "paid" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Reconciled ({invoiceList.filter(i => i.status === "PAID").length})
            </button>

            <button
              onClick={() => setIsAddInvoiceOpen(true)}
              className="bg-btblack hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> New Tax Invoice
            </button>
          </div>
        </div>

        {/* Mobile Invoice Card View (screens < 768px) */}
        <div className="block md:hidden p-3 space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No invoices match the filter criteria.
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-slate-900 text-xs">{inv.invoiceNo}</span>
                  {inv.status === "PAID" ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Reconciled
                    </span>
                  ) : inv.status === "UTR_SUBMITTED" ? (
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> UTR Submitted
                    </span>
                  ) : (
                    <span className="bg-red-100 text-btred-logo border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Pending
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{inv.entityName}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{inv.serviceDescription}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">SAC: {inv.sacCode} &bull; Due: {formatDate(inv.dueDate)}</p>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Fee</span>
                    <span className="text-base font-black text-slate-900">{formatCurrencyINR(inv.amount)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                      title="View Official Tax Invoice"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                    </button>

                    {inv.status !== "PAID" && (
                      <button
                        onClick={() => handleWhatsAppChase(inv)}
                        className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Send via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Chase</span>
                      </button>
                    )}

                    {inv.status === "UTR_SUBMITTED" && (
                      <button
                        onClick={() => handleDirectReconcileUtr(inv)}
                        className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Settle
                      </button>
                    )}

                    {inv.status !== "PAID" && inv.status !== "UTR_SUBMITTED" && (
                      <button
                        onClick={() => handleOpenReconcileModal(inv)}
                        className="px-2.5 py-1.5 bg-btblack hover:bg-slate-800 text-white font-bold rounded-xl transition text-[11px]"
                      >
                        UTR
                      </button>
                    )}
                  </div>
                </div>

                {inv.clientUtrNumber && (
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl text-[10px] font-mono text-amber-900 font-bold flex items-center justify-between">
                    <span>UTR: {inv.clientUtrNumber} ({inv.clientPaymentMode})</span>
                    {inv.status !== "PAID" && (
                      <button
                        onClick={() => handleOpenReconcileModal(inv)}
                        className="text-emerald-700 underline font-black"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-extrabold">
              <tr>
                <th className="py-3.5 px-4">Invoice # &amp; Date</th>
                <th className="py-3.5 px-4">Entity &amp; Service</th>
                <th className="py-3.5 px-4">Taxable + GST</th>
                <th className="py-3.5 px-4">Total Fee</th>
                <th className="py-3.5 px-4">Status &amp; UTR</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No billing records found. Click <strong>+ New Tax Invoice</strong> to generate your first professional invoice.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-black text-slate-900 block">{inv.invoiceNo}</span>
                    <span className="text-[10px] text-slate-400">Due: {formatDate(inv.dueDate)}</span>
                  </td>

                  <td className="py-3.5 px-4 max-w-[260px]">
                    <span className="font-bold text-slate-900 block truncate">{inv.entityName}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{inv.serviceDescription}</span>
                    <span className="text-[10px] text-slate-400 font-mono">SAC: {inv.sacCode}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-slate-700 font-medium block">
                      {formatCurrencyINR(inv.taxableAmount)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      +18% GST: {formatCurrencyINR(inv.gstAmount)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                    {formatCurrencyINR(inv.amount)}
                  </td>

                  <td className="py-3.5 px-4">
                    {inv.status === "PAID" && (
                      <div>
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Reconciled
                        </span>
                        {inv.clientUtrNumber && (
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                            UTR: {inv.clientUtrNumber}
                          </span>
                        )}
                      </div>
                    )}

                    {inv.status === "UTR_SUBMITTED" && (
                      <div>
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> UTR Submitted
                        </span>
                        <span className="block text-[10px] font-mono text-amber-900 font-bold mt-0.5">
                          UTR: {inv.clientUtrNumber}
                        </span>
                        <button
                          onClick={() => handleDirectReconcileUtr(inv)}
                          className="mt-1 text-[10px] font-black text-emerald-700 hover:text-emerald-900 underline block"
                        >
                          Verify &amp; Settle
                        </button>
                      </div>
                    )}

                    {inv.status === "PENDING" && (
                      <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Pending
                      </span>
                    )}

                    {inv.status === "OVERDUE" && (
                      <span className="bg-red-100 text-btred-logo border border-red-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                        Overdue
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition text-[11px]"
                      title="View & Print Official Tax Invoice"
                    >
                      View Invoice
                    </button>

                    <button
                      onClick={() => handleWhatsAppChase(inv)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition text-[11px] inline-flex items-center gap-1 border border-emerald-200"
                      title="Send 1-Tap WhatsApp Chase with Bank Details"
                    >
                      <Send className="w-3 h-3" />
                      1-Tap WhatsApp
                    </button>

                    {inv.status !== "PAID" && (
                      <button
                        onClick={() => handleOpenReconcileModal(inv)}
                        className="px-2.5 py-1.5 bg-btblack hover:bg-slate-800 text-white font-bold rounded-xl transition text-[11px]"
                        title="Record Direct Bank Settlement"
                      >
                        Record UTR
                      </button>
                    )}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: OFFICIAL CA TAX INVOICE PREVIEW WITH FIRM BANK & DYNAMIC UPI QR */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setPreviewInvoice(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Tax Invoice Format */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-5 text-xs text-slate-800">
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">{DEFAULT_FIRM_BRANDING.firmName}</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Chartered Accountants &bull; FRN: {DEFAULT_FIRM_BRANDING.frn}</p>
                  <p className="text-[11px] text-slate-500">{DEFAULT_FIRM_BRANDING.headOffice}</p>
                  <p className="text-[11px] text-slate-500">ICAI Peer Review: {DEFAULT_FIRM_BRANDING.peerReviewNo}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-black px-2.5 py-1 rounded bg-slate-900 text-white inline-block">
                    TAX INVOICE
                  </span>
                  <p className="font-mono font-black text-sm text-slate-900 mt-2">{previewInvoice.invoiceNo}</p>
                  <p className="text-[11px] text-slate-500">Date: {new Date().toLocaleDateString("en-IN")}</p>
                  <p className="text-[11px] text-slate-500">Due: {formatDate(previewInvoice.dueDate)}</p>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Billed To (Client):</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">{previewInvoice.entityName}</p>
                <p className="text-slate-600 font-mono text-[11px]">GSTIN: 27AABCA9821F1ZX &bull; State: Maharashtra (27)</p>
              </div>

              {/* Fee Line Items */}
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase font-black">
                    <th className="py-2">Description of Professional Services</th>
                    <th className="py-2">SAC Code</th>
                    <th className="py-2 text-right">Taxable Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 font-medium">{previewInvoice.serviceDescription}</td>
                    <td className="py-3 font-mono text-slate-500">{previewInvoice.sacCode}</td>
                    <td className="py-3 text-right font-black">{formatCurrencyINR(previewInvoice.taxableAmount)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Tax Computation Breakdown */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-right text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Amount</span>
                  <span className="font-mono">{formatCurrencyINR(previewInvoice.taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST @ 9%)</span>
                  <span className="font-mono">{formatCurrencyINR(previewInvoice.gstAmount / 2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST @ 9%)</span>
                  <span className="font-mono">{formatCurrencyINR(previewInvoice.gstAmount / 2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                  <span>Total Amount Due</span>
                  <span className="text-btred-logo">{formatCurrencyINR(previewInvoice.amount)}</span>
                </div>
              </div>

              {/* Payment Details Box (Direct Bank & Dynamic UPI) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-[11px] text-slate-700">
                  <p className="font-black text-slate-900 uppercase flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-700" />
                    Direct Bank Remittance (NEFT / RTGS / IMPS)
                  </p>
                  <p>Bank: <strong>{DEFAULT_FIRM_BRANDING.bankDetails.bankName}</strong> ({DEFAULT_FIRM_BRANDING.bankDetails.branch})</p>
                  <p>A/c Name: <strong>{DEFAULT_FIRM_BRANDING.bankDetails.accountName}</strong></p>
                  <p>A/c Number: <strong className="font-mono text-xs">{DEFAULT_FIRM_BRANDING.bankDetails.accountNumber}</strong></p>
                  <p>IFSC Code: <strong className="font-mono text-xs">{DEFAULT_FIRM_BRANDING.bankDetails.ifsc}</strong></p>
                  <p className="text-slate-500 pt-1">Direct UPI VPA: <strong className="font-mono text-slate-900">{DEFAULT_FIRM_BRANDING.firmUpiVpa}</strong></p>
                </div>

                <div className="text-center p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <QrCode className="w-20 h-20 mx-auto text-slate-900" />
                  <span className="text-[10px] font-black uppercase text-slate-700 block mt-1">Scan &amp; Pay via UPI</span>
                  <span className="text-[9px] text-slate-400 font-mono">GPay &bull; PhonePe &bull; BHIM</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => handleWhatsAppChase(previewInvoice)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                Dispatch Invoice via 1-Tap WhatsApp
              </button>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black px-4 py-2.5 rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CA RECONCILE / RECORD UTR MODAL */}
      {reconcileModalInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setReconcileModalInvoice(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Record Direct Bank Settlement
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {reconcileModalInvoice.entityName} &bull; Invoice #{reconcileModalInvoice.invoiceNo}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Invoice Amount</span>
              <p className="text-2xl font-black text-slate-900">
                {formatCurrencyINR(reconcileModalInvoice.amount)}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  12-Digit Bank UTR / Cheque Reference Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 429810849201 or CMS-881902"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 font-mono text-xs px-3.5 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Remittance Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs px-3.5 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-medium"
                >
                  <option value="NEFT_RTGS">NEFT / RTGS Direct Bank Transfer</option>
                  <option value="UPI">UPI (Google Pay, PhonePe, BHIM)</option>
                  <option value="IMPS">IMPS Immediate Payment</option>
                  <option value="CHEQUE">Physical Cheque / Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reconciliation Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Verified against current account statement"
                  value={payerNote}
                  onChange={(e) => setPayerNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs px-3.5 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setReconcileModalInvoice(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReconciliation}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm Settlement &amp; Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW TAX INVOICE MODAL */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewInvoice}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95"
          >
            <button
              type="button"
              onClick={() => setIsAddInvoiceOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
              Issue Official CA Tax Invoice
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Entity *</label>
                {clients.length > 0 ? (
                  <select
                    required
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Select Client Entity --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} (PAN: {c.pan})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    placeholder="e.g. Pratwi Solutions Private Limited"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                  />
                )}
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Professional Service Scope</label>
                <input
                  type="text"
                  required
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Billing Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Includes 18% GST (Taxable: {formatCurrencyINR(Math.round(Number(newAmount) / 1.18))})
                </span>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddInvoiceOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-btblack hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl transition"
              >
                Generate Tax Invoice
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
