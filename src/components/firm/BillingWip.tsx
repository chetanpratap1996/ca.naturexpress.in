"use client";

import React, { useState, useMemo } from "react";
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
  Plus,
  Printer,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Zap
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

export interface WipJobItem {
  id: string;
  entityName: string;
  clientPan: string;
  serviceTitle: string;
  assignedStaff: string;
  hoursSpent: number;
  estimatedFee: number;
  completionDate: string;
  status: "READY_FOR_BILLING" | "IN_PROGRESS";
}

export const DEFAULT_WIP_JOBS: WipJobItem[] = [
  {
    id: "WIP-01",
    entityName: "Apex AutoTech Private Limited",
    clientPan: "AABCA8891D",
    serviceTitle: "Tax Audit Form 3CD Clause 44 & 43B(h) Compilation",
    assignedStaff: "Kriti Jain (Article)",
    hoursSpent: 18.5,
    estimatedFee: 45000,
    completionDate: "2026-10-24",
    status: "READY_FOR_BILLING"
  },
  {
    id: "WIP-02",
    entityName: "Pratwi Solutions Private Limited",
    clientPan: "AAKCS8812K",
    serviceTitle: "Transfer Pricing Study & Form 3CEB Certification",
    assignedStaff: "CA Gunjan Jain (Partner)",
    hoursSpent: 24.0,
    estimatedFee: 65000,
    completionDate: "2026-10-22",
    status: "READY_FOR_BILLING"
  },
  {
    id: "WIP-03",
    entityName: "OmniRetail India Limited",
    clientPan: "AACO1234F",
    serviceTitle: "GSTR-9 & 9C Annual Reconciliation Statement",
    assignedStaff: "Kriti Jain (Article)",
    hoursSpent: 16.0,
    estimatedFee: 50000,
    completionDate: "2026-10-21",
    status: "READY_FOR_BILLING"
  },
  {
    id: "WIP-04",
    entityName: "Zenith SaaS Technologies Private Limited",
    clientPan: "AAACZ9921E",
    serviceTitle: "Section 142(1) Faceless Scrutiny Evidence Dossier",
    assignedStaff: "CA Gunjan Jain (Partner)",
    hoursSpent: 14.5,
    estimatedFee: 35000,
    completionDate: "2026-10-23",
    status: "READY_FOR_BILLING"
  }
];

interface BillingWipProps {
  invoices: InvoiceItem[];
  clients?: ClientEntity[];
  onRefresh?: () => void;
}

export const BillingWip: React.FC<BillingWipProps> = ({ invoices, clients = [], onRefresh }) => {
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>(invoices);
  const [wipJobs, setWipJobs] = useState<WipJobItem[]>(DEFAULT_WIP_JOBS);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "utr_review" | "paid" | "wip_unbilled">("all");
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
  const [newEntityName, setNewEntityName] = useState(() => clients[0]?.name || "Apex AutoTech Private Limited");
  const [newServiceDesc, setNewServiceDesc] = useState("Statutory Tax Audit & GSTR-9C Annual Certification");
  const [newAmount, setNewAmount] = useState("75000");

  React.useEffect(() => {
    setInvoiceList(invoices);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoiceList
      .filter((inv) => inv.status !== "PAID")
      .reduce((acc, inv) => acc + inv.amount, 0);
  }, [invoiceList]);

  const pendingUtrReviews = useMemo(() => {
    return invoiceList.filter((inv) => inv.status === "UTR_SUBMITTED");
  }, [invoiceList]);

  const totalCollected = useMemo(() => {
    return invoiceList
      .filter((inv) => inv.status === "PAID")
      .reduce((acc, inv) => acc + inv.amount, 0);
  }, [invoiceList]);

  const totalUnbilledWip = useMemo(() => {
    return wipJobs.reduce((acc, job) => acc + job.estimatedFee, 0);
  }, [wipJobs]);

  const getMsmeAgingStatus = (inv: InvoiceItem) => {
    if (inv.status === "PAID") {
      return { badge: "PAID_SETTLED", text: "Settled u/s 43B(h)", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    }
    const due = new Date(inv.dueDate).getTime();
    const now = new Date("2026-10-30").getTime();
    const daysDiff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 0) {
      return { badge: "SAFE_15_DAYS", text: "15-Day MSME Safe", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    } else if (daysDiff <= 30) {
      return { badge: "AGREEMENT_45_DAYS", text: `${daysDiff}d overdue (45-Day Cap)`, color: "bg-amber-50 text-amber-800 border-amber-200" };
    } else {
      return { badge: "DISALLOWANCE_RISK", text: `${daysDiff}d overdue • Sec 43B(h) Risk`, color: "bg-red-50 text-btred-logo border-red-200" };
    }
  };

  const handleConvertWipToInvoice = (job: WipJobItem) => {
    setNewEntityName(job.entityName);
    setNewServiceDesc(job.serviceTitle);
    setNewAmount(job.estimatedFee.toString());
    setIsAddInvoiceOpen(true);
    toast.info("WIP Loaded", `Loaded ${job.serviceTitle} for ${job.entityName}. Ready to issue tax invoice.`);
  };

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
    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === inv.entityName.toLowerCase() || c.id === inv.entityId
    );
    const rawPhone = matchedClient?.primaryContact?.phone || "9820044101";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    openWhatsAppPreset(
      formattedPhone,
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

  const filteredWipJobs = useMemo(() => {
    return wipJobs.filter((job) =>
      job.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.assignedStaff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.clientPan.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [wipJobs, searchTerm]);

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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-black text-white">{toastMessage}</span>
          </div>
          <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded">BANK RECONCILED</span>
        </div>
      )}

      {/* Top Financial Health KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab("wip_unbilled")}
          className={`bg-white border p-5 rounded-3xl shadow-sm flex items-center gap-3.5 cursor-pointer transition ${
            activeTab === "wip_unbilled" ? "border-amber-400 bg-amber-50/20" : "border-slate-200 hover:border-amber-300"
          }`}
          title="Click to view Unbilled Work-in-Progress (WIP)"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Unbilled Work-in-Progress (WIP)</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{formatCurrencyINR(totalUnbilledWip)}</p>
            <p className="text-xs text-amber-700 font-bold">{wipJobs.length} active jobs ready for billing &rarr;</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("pending")}
          className={`bg-white border p-5 rounded-3xl shadow-sm flex items-center gap-3.5 cursor-pointer transition ${
            activeTab === "pending" ? "border-red-400 bg-red-50/20" : "border-slate-200 hover:border-red-300"
          }`}
          title="Click to view Outstanding Receivables"
        >
          <div className="p-3 bg-red-50 text-btred-logo rounded-2xl border border-red-200">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Outstanding Receivables</p>
            <p className="text-2xl font-black text-btred-logo mt-0.5">{formatCurrencyINR(totalOutstanding)}</p>
            <p className="text-xs text-slate-500 font-medium">Sec 43B(h) Protected &bull; 1-Tap WhatsApp</p>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("paid")}
          className={`bg-white border p-5 rounded-3xl shadow-sm flex items-center gap-3.5 cursor-pointer transition ${
            activeTab === "paid" ? "border-emerald-400 bg-emerald-50/20" : "border-slate-200 hover:border-emerald-300"
          }`}
          title="Click to view Reconciled Invoices"
        >
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
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search invoice or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === "all" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              All Invoices ({invoiceList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wip_unbilled")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition relative ${
                activeTab === "wip_unbilled" ? "bg-amber-600 text-white shadow-sm" : "text-amber-800 bg-amber-50 hover:bg-amber-100"
              }`}
            >
              Unbilled WIP ({wipJobs.length})
            </button>
            <button
              type="button"
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
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === "pending" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Unpaid
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paid")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTab === "paid" ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Reconciled ({invoiceList.filter(i => i.status === "PAID").length})
            </button>

            <button
              type="button"
              onClick={() => setIsAddInvoiceOpen(true)}
              className="bg-btred-logo hover:bg-red-700 text-white shadow-sm text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> New Tax Invoice
            </button>
          </div>
        </div>

        {/* When activeTab is wip_unbilled, show WIP Job Ledger */}
        {activeTab === "wip_unbilled" ? (
          <div className="p-4 space-y-4">
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Unbilled Work-in-Progress (WIP) Engagements
                </h4>
                <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                  Audit workpapers and advisory engagements completed by articles &amp; managers ready to be converted into GST Tax Invoices.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-700 uppercase font-black block">Total WIP Pool</span>
                <span className="text-lg font-black text-amber-950">{formatCurrencyINR(totalUnbilledWip)}</span>
              </div>
            </div>

            {/* Mobile WIP Cards */}
            <div className="block md:hidden space-y-3">
              {filteredWipJobs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No unbilled WIP engagements found.</div>
              ) : (
                filteredWipJobs.map((job) => (
                  <div key={job.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-800">{job.id}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        job.status === "READY_FOR_BILLING" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}>
                        {job.status === "READY_FOR_BILLING" ? "Ready to Bill" : "In Progress"}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">{job.entityName}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{job.serviceTitle}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Assigned: {job.assignedStaff} &bull; {job.hoursSpent} hrs</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Est. Fee</span>
                        <span className="text-sm font-black text-slate-900">{formatCurrencyINR(job.estimatedFee)}</span>
                      </div>
                      <button
                        onClick={() => handleConvertWipToInvoice(job)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Bill Job
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop WIP Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-extrabold">
                  <tr>
                    <th className="py-3 px-4">Job ID &amp; Completion</th>
                    <th className="py-3 px-4">Client Entity &amp; PAN</th>
                    <th className="py-3 px-4">Engagement Scope</th>
                    <th className="py-3 px-4">Hours &amp; Staff</th>
                    <th className="py-3 px-4">Est. Fee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredWipJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No WIP jobs match the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredWipJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-amber-50/30 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-black text-slate-900 block">{job.id}</span>
                          <span className="text-[10px] text-slate-500">Done: {job.completionDate}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{job.entityName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">PAN: {job.clientPan}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[240px]">
                          <span className="text-slate-800 font-semibold block truncate">{job.serviceTitle}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900">{job.hoursSpent} hrs</span>
                          <span className="block text-[10px] text-slate-500">{job.assignedStaff}</span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          {formatCurrencyINR(job.estimatedFee)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            job.status === "READY_FOR_BILLING" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}>
                            {job.status === "READY_FOR_BILLING" ? "Ready to Bill" : "In Progress"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleConvertWipToInvoice(job)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black px-3 py-1.5 rounded-xl transition text-[11px] inline-flex items-center gap-1 shadow-sm"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Bill This Job
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Invoice Card View (screens < 768px) */}
            <div className="block md:hidden p-3 space-y-3">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-xs">
                  No invoices match the filter criteria.
                </div>
              ) : (
                filteredInvoices.map((inv) => {
                  const msme = getMsmeAgingStatus(inv);
                  return (
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
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5">SAC: {inv.sacCode} &bull; Due: {formatDate(inv.dueDate)}</p>
                        {inv.status !== "PAID" && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border inline-block mt-1 ${msme.color}`}>
                            {msme.text}
                          </span>
                        )}
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
                              <Check className="w-3 h-3" /> Settle
                            </button>
                          )}

                          {inv.status !== "PAID" && inv.status !== "UTR_SUBMITTED" && (
                            <button
                              onClick={() => handleOpenReconcileModal(inv)}
                              className="px-2.5 py-1.5 bg-btred-logo hover:bg-red-700 text-white shadow-sm font-bold rounded-xl transition text-[11px]"
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
                  );
                })
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
                      <td colSpan={6} className="py-12 text-center text-slate-600 text-xs">
                        No billing records found. Click <strong>+ New Tax Invoice</strong> to generate your first professional invoice.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const msme = getMsmeAgingStatus(inv);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-slate-900 block">{inv.invoiceNo}</span>
                            <span className="text-[10px] text-slate-600 block">Due: {formatDate(inv.dueDate)}</span>
                            {inv.status !== "PAID" && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${msme.color}`}>
                                {msme.text}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-[260px]">
                            <span className="font-bold text-slate-900 block truncate">{inv.entityName}</span>
                            <span className="text-[11px] text-slate-500 block truncate">{inv.serviceDescription}</span>
                            <span className="text-[10px] text-slate-600 font-mono">SAC: {inv.sacCode}</span>
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
                              title="View &amp; Print Official Tax Invoice"
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
                                className="px-2.5 py-1.5 bg-btred-logo hover:bg-red-700 text-white shadow-sm font-bold rounded-xl transition text-[11px]"
                                title="Record Direct Bank Settlement"
                              >
                                Record UTR
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: OFFICIAL CA TAX INVOICE PREVIEW WITH FIRM BANK & DYNAMIC UPI QR */}
      {previewInvoice && (() => {
        const matchedClient = clients.find(
          (c) => c.name.toLowerCase() === previewInvoice.entityName.toLowerCase() || c.id === previewInvoice.entityId
        );
        const clientGstin = matchedClient?.gstin || "27AABCA9821F1ZX";
        const stateCode = clientGstin.substring(0, 2);
        const isInterState = stateCode !== "23"; // Firm is MP (23)
        const stateName = stateCode === "27" ? "Maharashtra (27)" : stateCode === "07" ? "Delhi (07)" : stateCode === "23" ? "Madhya Pradesh (23)" : `State Code ${stateCode}`;
        const upiUri = `upi://pay?pa=${DEFAULT_FIRM_BRANDING.firmUpiVpa}&pn=${encodeURIComponent(DEFAULT_FIRM_BRANDING.firmName)}&am=${previewInvoice.amount}&cu=INR&tn=${encodeURIComponent(`Tax Invoice ${previewInvoice.invoiceNo}`)}`;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <button
                onClick={() => setPreviewInvoice(null)}
                className="absolute right-4 top-4 text-slate-600 hover:text-slate-800 p-1"
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
                    <p className="text-[11px] font-mono text-slate-600 font-bold">Firm GSTIN: {DEFAULT_FIRM_BRANDING.gstin || "23AABCU9821F1ZX"} (Madhya Pradesh)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase font-black px-2.5 py-1 rounded bg-red-50 text-btred-logo border border-red-200 inline-block">
                      TAX INVOICE
                    </span>
                    <p className="font-mono font-black text-sm text-slate-900 mt-2">{previewInvoice.invoiceNo}</p>
                    <p className="text-[11px] text-slate-500">Date: {new Date().toLocaleDateString("en-IN")}</p>
                    <p className="text-[11px] text-slate-500">Due: {formatDate(previewInvoice.dueDate)}</p>
                    <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-1 inline-block">
                      Sec 43B(h) MSME Covered
                    </span>
                  </div>
                </div>

                {/* Billed To */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Billed To (Client Entity):</span>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{previewInvoice.entityName}</p>
                    <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                      GSTIN: <strong>{clientGstin}</strong> &bull; Place of Supply: {stateName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-200">
                      {isInterState ? "Inter-State (IGST 18%)" : "Intra-State (CGST + SGST)"}
                    </span>
                  </div>
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
                  {isInterState ? (
                    <div className="flex justify-between text-indigo-700 font-semibold">
                      <span>Integrated GST (IGST @ 18%)</span>
                      <span className="font-mono">{formatCurrencyINR(previewInvoice.gstAmount)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Central GST (CGST @ 9%)</span>
                        <span className="font-mono">{formatCurrencyINR(previewInvoice.gstAmount / 2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>State GST (SGST @ 9%)</span>
                        <span className="font-mono">{formatCurrencyINR(previewInvoice.gstAmount / 2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>Total Amount Due (INR)</span>
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
                    <p className="text-slate-500 pt-1">Direct Firm UPI: <strong className="font-mono text-slate-900">{DEFAULT_FIRM_BRANDING.firmUpiVpa}</strong></p>
                  </div>

                  <div className="text-center p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <QrCode className="w-16 h-16 mx-auto text-slate-900" />
                    <span className="text-[10px] font-black uppercase text-slate-700 block mt-1">Scan &amp; Pay via UPI</span>
                    <a
                      href={upiUri}
                      className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-black transition"
                    >
                      <ExternalLink className="w-3 h-3" /> Pay via App
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleWhatsAppChase(previewInvoice)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    Dispatch via WhatsApp
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-slate-300"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    Print / PDF
                  </button>
                </div>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black px-4 py-2.5 rounded-xl transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: CA RECONCILE / RECORD UTR MODAL */}
      {reconcileModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setReconcileModalInvoice(null)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-800 p-1"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewInvoice}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95"
          >
            <button
              type="button"
              onClick={() => setIsAddInvoiceOpen(false)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-800 p-1"
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
                className="bg-btred-logo hover:bg-red-700 text-white shadow-sm font-bold px-5 py-2.5 rounded-xl transition"
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
