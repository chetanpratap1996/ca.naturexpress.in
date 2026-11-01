"use client";

import React, { useState, useMemo } from "react";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  ShieldAlert, 
  ArrowRight, 
  IndianRupee, 
  Building2, 
  Sparkles, 
  ExternalLink, 
  HelpCircle, 
  FileText,
  Download,
  Percent,
  Plus,
  Search,
  Filter,
  Printer,
  Calendar,
  X,
  Scale,
  BadgeAlert,
  Info
} from "lucide-react";
import { formatCurrencyINR, formatDate, calculateSection16MsmeInterest } from "@/lib/utils";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";

export interface MsmeInvoiceItem {
  id: string;
  vendorName: string;
  udyamNumber: string;
  category: "MICRO" | "SMALL" | "TRADER_EXEMPT";
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  daysElapsed: number;
  hasWrittenAgreement: boolean;
  maxDaysAllowed: number; // 45 or 15
  paymentStatus: "PENDING" | "PAID_ON_TIME" | "DISALLOWED_RISK" | "DISPUTED_HALTED";
  disputeNotes?: string;
  paymentRef?: string;
  paymentDate?: string;
}

const SAMPLE_MSME_INVOICES: MsmeInvoiceItem[] = [
  {
    id: "msme-1",
    vendorName: "Precision Castings & Tooling Tools",
    udyamNumber: "UDYAM-MP-08-0019284",
    category: "MICRO",
    invoiceNumber: "PCT/25-26/0412",
    invoiceDate: "2026-08-10",
    invoiceAmount: 685000,
    daysElapsed: 79,
    hasWrittenAgreement: true,
    maxDaysAllowed: 45,
    paymentStatus: "DISALLOWED_RISK"
  },
  {
    id: "msme-2",
    vendorName: "Shree Ganesh Packaging Cartons",
    udyamNumber: "UDYAM-MP-08-0044192",
    category: "SMALL",
    invoiceNumber: "SGP/26/8812",
    invoiceDate: "2026-08-14",
    invoiceAmount: 420000,
    daysElapsed: 75,
    hasWrittenAgreement: true,
    maxDaysAllowed: 45,
    paymentStatus: "DISALLOWED_RISK"
  },
  {
    id: "msme-3",
    vendorName: "Narmada Fasteners & Bolts",
    udyamNumber: "UDYAM-MP-08-0099120",
    category: "MICRO",
    invoiceNumber: "NFB/26-27/102",
    invoiceDate: "2026-09-22",
    invoiceAmount: 340000,
    daysElapsed: 36,
    hasWrittenAgreement: true,
    maxDaysAllowed: 45,
    paymentStatus: "PENDING"
  },
  {
    id: "msme-4",
    vendorName: "Vindhya Logistics & Industrial Spares",
    udyamNumber: "UDYAM-MP-08-0038819",
    category: "SMALL",
    invoiceNumber: "VL/26-27/551",
    invoiceDate: "2026-10-18",
    invoiceAmount: 195000,
    daysElapsed: 13,
    hasWrittenAgreement: false,
    maxDaysAllowed: 15,
    paymentStatus: "PENDING"
  },
  {
    id: "msme-5",
    vendorName: "Apex Hardware Distributors",
    udyamNumber: "UDYAM-MH-01-0048123",
    category: "TRADER_EXEMPT",
    invoiceNumber: "AHD/26/1029",
    invoiceDate: "2026-07-20",
    invoiceAmount: 510000,
    daysElapsed: 98,
    hasWrittenAgreement: true,
    maxDaysAllowed: 45,
    paymentStatus: "PENDING"
  }
];

export interface Msme43bhWatchdogProps {
  client?: ClientEntity | null;
}

export const Msme43bhWatchdog: React.FC<Msme43bhWatchdogProps> = ({ client }) => {
  const [invoices, setInvoices] = useState<MsmeInvoiceItem[]>(SAMPLE_MSME_INVOICES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CRITICAL" | "OVERDUE" | "COMPLIANT" | "DISPUTED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "MICRO" | "SMALL" | "TRADER_EXEMPT">("ALL");
  const [taxRegimeRate, setTaxRegimeRate] = useState<number>(0.2517); // Sec 115BAA 25.17%
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoiceForInterest, setSelectedInvoiceForInterest] = useState<MsmeInvoiceItem | null>(null);
  const [selectedInvoiceForDispute, setSelectedInvoiceForDispute] = useState<MsmeInvoiceItem | null>(null);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<MsmeInvoiceItem | null>(null);

  // New Invoice Form State
  const [newVendor, setNewVendor] = useState("");
  const [newUdyam, setNewUdyam] = useState("");
  const [newCategory, setNewCategory] = useState<"MICRO" | "SMALL" | "TRADER_EXEMPT">("MICRO");
  const [newInvNum, setNewInvNum] = useState("");
  const [newInvDate, setNewInvDate] = useState(new Date().toISOString().split("T")[0]);
  const [newAmount, setNewAmount] = useState<number>(100000);
  const [newHasContract, setNewHasContract] = useState(true);

  // Dispute Form State
  const [disputeReason, setDisputeReason] = useState("Formal notice issued regarding rejection of damaged goods received against PO batch #4401 under MSMED Act Sec 2(b) proviso.");

  // Payment Form State
  const [payReference, setPayReference] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);

  // Calculations
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.udyamNumber.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (categoryFilter !== "ALL" && inv.category !== categoryFilter) return false;

      const daysRemaining = inv.maxDaysAllowed - inv.daysElapsed;
      if (statusFilter === "CRITICAL") {
        return daysRemaining <= 5 && daysRemaining >= 0 && inv.paymentStatus === "PENDING";
      }
      if (statusFilter === "OVERDUE") {
        return (inv.paymentStatus === "DISALLOWED_RISK" || (daysRemaining < 0 && inv.paymentStatus === "PENDING")) && inv.category !== "TRADER_EXEMPT";
      }
      if (statusFilter === "COMPLIANT") {
        return inv.paymentStatus === "PAID_ON_TIME";
      }
      if (statusFilter === "DISPUTED") {
        return inv.paymentStatus === "DISPUTED_HALTED";
      }
      return true;
    });
  }, [invoices, searchQuery, statusFilter, categoryFilter]);

  // Aggregate stats across applicable invoices (excluding Trader Exempt)
  const nonTraderInvoices = invoices.filter(i => i.category !== "TRADER_EXEMPT");
  
  const totalUnpaidNonTrader = nonTraderInvoices
    .filter(i => i.paymentStatus !== "PAID_ON_TIME" && i.paymentStatus !== "DISPUTED_HALTED")
    .reduce((sum, i) => sum + i.invoiceAmount, 0);

  const totalDisallowedRisk = nonTraderInvoices
    .filter(i => (i.paymentStatus === "DISALLOWED_RISK" || i.daysElapsed > i.maxDaysAllowed) && i.paymentStatus !== "PAID_ON_TIME" && i.paymentStatus !== "DISPUTED_HALTED")
    .reduce((sum, i) => sum + i.invoiceAmount, 0);

  const potentialTaxHit = Math.round(totalDisallowedRisk * taxRegimeRate);

  const totalSec16Interest = nonTraderInvoices
    .filter(i => i.paymentStatus !== "PAID_ON_TIME" && i.daysElapsed > i.maxDaysAllowed && i.paymentStatus !== "DISPUTED_HALTED")
    .reduce((sum, i) => {
      const overdue = i.daysElapsed - i.maxDaysAllowed;
      const res = calculateSection16MsmeInterest(i.invoiceAmount, overdue);
      return sum + res.interestAmount;
    }, 0);

  // Handlers
  const handleMarkPaid = (inv: MsmeInvoiceItem) => {
    setShowPayModal(inv);
    setPayReference(`NEFT-${Date.now().toString().slice(-6)}`);
  };

  const confirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;
    setInvoices(prev => prev.map(inv => inv.id === showPayModal.id ? {
      ...inv,
      paymentStatus: "PAID_ON_TIME",
      paymentRef: payReference,
      paymentDate: payDate
    } : inv));
    toast.success("Payment Recorded", `Invoice ${showPayModal.invoiceNumber} marked as paid. Tax disallowance averted.`);
    setShowPayModal(null);
  };

  const handleApplyDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForDispute) return;
    setInvoices(prev => prev.map(inv => inv.id === selectedInvoiceForDispute.id ? {
      ...inv,
      paymentStatus: "DISPUTED_HALTED",
      disputeNotes: disputeReason
    } : inv));
    toast.success("Dispute Registered", "45-day clock halted u/s 2(b) MSMED Act until formal vendor resolution.");
    setSelectedInvoiceForDispute(null);
  };

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor || !newInvNum || newAmount <= 0) {
      alert("Please fill all mandatory fields");
      return;
    }
    const maxDays = newCategory === "TRADER_EXEMPT" ? 45 : (newHasContract ? 45 : 15);
    const newInv: MsmeInvoiceItem = {
      id: `msme-${Date.now()}`,
      vendorName: newVendor,
      udyamNumber: newUdyam.toUpperCase() || "UDYAM-UNREGISTERED",
      category: newCategory,
      invoiceNumber: newInvNum,
      invoiceDate: newInvDate,
      invoiceAmount: Number(newAmount),
      daysElapsed: 1,
      hasWrittenAgreement: newHasContract,
      maxDaysAllowed: maxDays,
      paymentStatus: "PENDING"
    };
    setInvoices([newInv, ...invoices]);
    toast.success("MSME Invoice Added", `${newVendor} added to 43B(h) watchdog radar.`);
    setShowAddModal(false);
    // Reset Form
    setNewVendor("");
    setNewUdyam("");
    setNewInvNum("");
    setNewAmount(100000);
  };

  const handleExportForm3cdSchedule = () => {
    const headers = [
      "Vendor Legal Name",
      "Udyam Registration Number",
      "Enterprise Category",
      "Written Contract Present",
      "Invoice Number",
      "Invoice Date",
      "Principal Invoice Amount (INR)",
      "Days Elapsed",
      "Statutory Term (15/45 Days)",
      "Current Status",
      "Disallowance Amount u/s 43B(h)",
      "Sec 16 MSMED Interest Payable @ 19.5% p.a.",
      "Sec 23 Non-Deductible Warning"
    ];

    const rows = invoices.map(i => {
      const isExempt = i.category === "TRADER_EXEMPT" || i.paymentStatus === "DISPUTED_HALTED";
      const overdueDays = Math.max(0, i.daysElapsed - i.maxDaysAllowed);
      const interestCalc = calculateSection16MsmeInterest(i.invoiceAmount, overdueDays);
      const isDisallowed = !isExempt && i.paymentStatus !== "PAID_ON_TIME" && i.daysElapsed > i.maxDaysAllowed;

      return [
        `"${i.vendorName}"`,
        `"${i.udyamNumber}"`,
        i.category,
        i.hasWrittenAgreement ? "YES (45 Days)" : "NO (15 Days Strict)",
        `"${i.invoiceNumber}"`,
        i.invoiceDate,
        i.invoiceAmount,
        i.daysElapsed,
        i.maxDaysAllowed,
        i.paymentStatus,
        isDisallowed ? i.invoiceAmount : 0,
        isDisallowed ? interestCalc.interestAmount : 0,
        isDisallowed ? "Yes - Inadmissible under Income Tax" : "N/A"
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Form3CD_Clause22_MSME_Schedule_${(client?.name || "Client").replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Schedule Exported", "Form 3CD Clause 22 MSME Workpaper exported as CSV.");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Section 43B(h) Statutory Defense
            </span>
            <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-md">
              MSMED Act, 2006 (Sec 15, 16 &amp; 23)
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Assessment Year 2026-27
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            MSME 45-Day Payment Watchdog &amp; Clause 22 Audit Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Payments to registered Micro &amp; Small suppliers beyond statutory limits (15 days without contract, 45 days with contract) are <strong>disallowed as business deduction</strong> in the year of invoice, taxed at corporate rates, plus <strong>3x RBI repo rate compound interest</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAdvisoryModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-300"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Treasury Advisory</span>
          </button>
          <button
            onClick={handleExportForm3cdSchedule}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export 3CD CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-btred-logo hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add MSME Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Statutory Regime & Sensitivity Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-2xl">
            <Scale className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assessee Corporate Tax Bracket</span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={taxRegimeRate}
                onChange={(e) => setTaxRegimeRate(Number(e.target.value))}
                className="bg-slate-800 border border-slate-600 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-400"
              >
                <option value={0.2517}>Section 115BAA Domestic Co (25.17% incl. Surcharge &amp; Cess)</option>
                <option value={0.3120}>Regular Corporate / LLP Tax Rate (31.20% incl. Cess)</option>
                <option value={0.34944}>Corporate with High Surcharge (&gt;₹10 Cr Turnover: 34.94%)</option>
                <option value={0.1500}>Section 115BAB New Manufacturing Co (17.16%)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 max-w-md">
          <span className="font-bold text-emerald-400">Statutory Defense Active:</span> Retail &amp; Wholesale Traders registered under Udyam (NIC 45/46/47) are <strong>exempt</strong> from 43B(h) disallowance as per MSME Ministry Office Memorandum No. 16/1/2021-P&amp;G/Policy.
        </div>
      </div>

      {/* 3. Financial Exposure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending MSME Dues</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrencyINR(totalUnpaidNonTrader)}</div>
          <p className="text-xs text-slate-500 mt-2">
            Across registered Micro &amp; Small suppliers
          </p>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Disallowance Tax Hit</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{formatCurrencyINR(potentialTaxHit)}</div>
          <p className="text-xs text-rose-700 mt-2 font-medium">
            Direct cash tax payout at {(taxRegimeRate * 100).toFixed(2)}% if unpaid
          </p>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sec 16 Compound Penal Interest</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{formatCurrencyINR(totalSec16Interest)}</div>
          <p className="text-xs text-amber-800 mt-2 font-medium">
            @ 19.5% p.a. (3x RBI Repo Rate) &bull; <strong>Non-Deductible u/s 23</strong>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Cash Outflow Risk</span>
            <IndianRupee className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrencyINR(potentialTaxHit + totalSec16Interest)}</div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Tax Disallowance + Penal Interest Burden
          </p>
        </div>
      </div>

      {/* 4. Filters & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: "ALL", label: "All Invoices", count: invoices.length },
              { id: "CRITICAL", label: "Critical (<5d)", count: invoices.filter(i => (i.maxDaysAllowed - i.daysElapsed) <= 5 && (i.maxDaysAllowed - i.daysElapsed) >= 0 && i.paymentStatus === "PENDING").length },
              { id: "OVERDUE", label: "Disallowed / Overdue", count: invoices.filter(i => (i.paymentStatus === "DISALLOWED_RISK" || i.daysElapsed > i.maxDaysAllowed) && i.paymentStatus !== "PAID_ON_TIME" && i.category !== "TRADER_EXEMPT").length },
              { id: "COMPLIANT", label: "Paid on Time", count: invoices.filter(i => i.paymentStatus === "PAID_ON_TIME").length },
              { id: "DISPUTED", label: "Dispute Halted", count: invoices.filter(i => i.paymentStatus === "DISPUTED_HALTED").length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor, udyam, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 font-medium"
            />
          </div>
        </div>

        {/* Category Filter Badges */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Classification:
          </span>
          {[
            { id: "ALL", label: "All Categories" },
            { id: "MICRO", label: "Micro Enterprises" },
            { id: "SMALL", label: "Small Enterprises" },
            { id: "TRADER_EXEMPT", label: "Traders (OM 43B(h) Exempt)" }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                categoryFilter === c.id
                  ? "bg-btred-logo text-white font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Invoices Interactive Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            Vendor Invoice Ledger &amp; Countdown Radar ({filteredInvoices.length} Records)
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Statutory Term: 15 Days (No Contract) | 45 Days (Written Agreement)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70">
                <th className="p-3">Vendor &amp; Udyam Reg</th>
                <th className="p-3">Enterprise Category</th>
                <th className="p-3">Invoice &amp; Agreement</th>
                <th className="p-3 text-right">Principal Amount</th>
                <th className="p-3">Days &amp; Countdown</th>
                <th className="p-3">Compliance Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">Zero MSME Disallowance Risks in Filter</div>
                    <div className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      No supplier invoices matching your filter criteria are at risk under Section 43B(h).
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const daysRemaining = inv.maxDaysAllowed - inv.daysElapsed;
                  const isCritical = daysRemaining <= 5 && daysRemaining >= 0 && inv.paymentStatus === "PENDING";
                  const isOverdue = inv.daysElapsed > inv.maxDaysAllowed && inv.paymentStatus !== "PAID_ON_TIME" && inv.paymentStatus !== "DISPUTED_HALTED";
                  const isTrader = inv.category === "TRADER_EXEMPT";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      {/* Vendor & Udyam */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{inv.vendorName}</div>
                        <div className="text-[11px] text-indigo-700 font-mono flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {inv.udyamNumber}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        {isTrader ? (
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-300">
                            Trader (Exempt)
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            inv.category === "MICRO" 
                              ? "bg-purple-50 text-purple-700 border border-purple-200" 
                              : "bg-red-50 text-btred-logo border border-red-200"
                          }`}>
                            {inv.category} Enterprise
                          </span>
                        )}
                        <span className="block text-[10px] text-slate-500 mt-0.5 font-medium">
                          {inv.hasWrittenAgreement ? "Contract (45d)" : "No Contract (15d)"}
                        </span>
                      </td>

                      {/* Invoice Details */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-500">Dated: {formatDate(inv.invoiceDate)}</div>
                      </td>

                      {/* Amount */}
                      <td className="p-3 text-right font-black text-slate-900 text-sm">
                        {formatCurrencyINR(inv.invoiceAmount)}
                      </td>

                      {/* Days Elapsed & Countdown Bar */}
                      <td className="p-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                            <span className="text-slate-700">{inv.daysElapsed}d elapsed</span>
                            <span className={daysRemaining < 0 ? "text-rose-600 font-black" : "text-slate-500"}>
                              Limit: {inv.maxDaysAllowed}d
                            </span>
                          </div>
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${
                                inv.paymentStatus === "PAID_ON_TIME" ? "bg-emerald-500" :
                                isTrader ? "bg-slate-400" :
                                isOverdue ? "bg-rose-600" :
                                isCritical ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, (inv.daysElapsed / inv.maxDaysAllowed) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Compliance Status */}
                      <td className="p-3">
                        {inv.paymentStatus === "PAID_ON_TIME" ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid on Time
                            </span>
                            {inv.paymentRef && (
                              <span className="text-[9px] font-mono text-slate-500 block">Ref: {inv.paymentRef}</span>
                            )}
                          </div>
                        ) : inv.paymentStatus === "DISPUTED_HALTED" ? (
                          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit">
                            <Scale className="w-3 h-3 text-blue-600" /> Clock Halted u/s 2(b)
                          </span>
                        ) : isTrader ? (
                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit">
                            <Info className="w-3 h-3 text-slate-500" /> Trader (No Tax Hit)
                          </span>
                        ) : isOverdue ? (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Disallowed ({inv.daysElapsed - inv.maxDaysAllowed}d late)
                            </span>
                            <button
                              onClick={() => setSelectedInvoiceForInterest(inv)}
                              className="text-[10px] text-amber-700 hover:underline font-bold flex items-center gap-1"
                            >
                              <Percent className="w-3 h-3" /> View 19.5% Interest
                            </button>
                          </div>
                        ) : isCritical ? (
                          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" /> Critical: {daysRemaining}d Left!
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-emerald-600" /> {daysRemaining}d remaining
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {inv.paymentStatus !== "PAID_ON_TIME" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                openWhatsAppPreset("919823011928", "MSME_43BH_ALERT", {
                                  clientName: client?.name || "Client Accounts Department",
                                  vendorName: inv.vendorName,
                                  overdueAmount: inv.invoiceAmount,
                                  daysRemaining: daysRemaining
                                });
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 transition flex items-center gap-1"
                              title="Send WhatsApp Alert to Accounts"
                            >
                              <Send className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              onClick={() => handleMarkPaid(inv)}
                              className="px-2.5 py-1.5 bg-btred-logo hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition shadow-sm"
                            >
                              Mark Paid
                            </button>

                            {inv.paymentStatus !== "DISPUTED_HALTED" && (
                              <button
                                onClick={() => setSelectedInvoiceForDispute(inv)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-300 transition"
                                title="Halt Clock on Grounds of Dispute"
                              >
                                Dispute
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold font-mono">Compliant</span>
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

      {/* 6. Section 16 Interest Calculation Breakdown Modal */}
      {selectedInvoiceForInterest && (() => {
        const overdueDays = Math.max(0, selectedInvoiceForInterest.daysElapsed - selectedInvoiceForInterest.maxDaysAllowed);
        const interestResult = calculateSection16MsmeInterest(selectedInvoiceForInterest.invoiceAmount, overdueDays);

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Section 16 MSMED Interest Ledger</h3>
                    <p className="text-xs text-slate-500 font-medium">Statutory compound interest at 3x RBI Repo Rate (19.5% p.a.)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInvoiceForInterest(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Vendor Name:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForInterest.vendorName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Invoice No &amp; Date:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedInvoiceForInterest.invoiceNumber} ({formatDate(selectedInvoiceForInterest.invoiceDate)})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Principal Invoice Amount:</span>
                  <span className="font-black text-slate-900">{formatCurrencyINR(selectedInvoiceForInterest.invoiceAmount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Statutory Term Limit:</span>
                  <span className="font-bold text-slate-800">{selectedInvoiceForInterest.maxDaysAllowed} Days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Days Overdue:</span>
                  <span className="font-bold text-rose-600 font-mono">{overdueDays} Days Late</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Mandatory Interest Rate:</span>
                  <span className="font-bold text-amber-700">19.5% p.a. (compounded monthly)</span>
                </div>
                <div className="flex justify-between py-1.5 bg-amber-50 rounded-xl px-3 border border-amber-200">
                  <span className="text-amber-900 font-black">Compound Interest Payable:</span>
                  <span className="text-amber-900 font-black text-sm">{formatCurrencyINR(interestResult.interestAmount)}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
                <BadgeAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block">Section 23 Non-Deductibility Mandate:</span>
                  Interest payable under Section 16 of the MSMED Act is <strong>expressly inadmissible</strong> as a deduction under the Income Tax Act, 1961. Assessee cannot claim this as an expense.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedInvoiceForInterest(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 7. Dispute / Halt 45-Day Clock Modal */}
      {selectedInvoiceForDispute && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Halt 45-Day Clock u/s 2(b) MSMED</h3>
                  <p className="text-xs text-slate-500 font-medium">Statutory defense against automatic 43B(h) disallowance</p>
                </div>
              </div>
              <button onClick={() => setSelectedInvoiceForDispute(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyDispute} className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900">
                <span className="font-bold block mb-1">Proviso to Section 2(b) of MSMED Act:</span>
                &quot;Where any objection is made in writing by the buyer regarding acceptance of goods or services within fifteen days of delivery, the day of acceptance shall be the day on which such objection is removed by the supplier.&quot;
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor &amp; Invoice:</label>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800">
                  {selectedInvoiceForDispute.vendorName} &bull; Inv #{selectedInvoiceForDispute.invoiceNumber} ({formatCurrencyINR(selectedInvoiceForDispute.invoiceAmount)})
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Written Objection Reference / Defect Reason *</label>
                <textarea
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 font-medium"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForDispute(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Halt Clock &amp; File Objection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Mark Paid Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Record Vendor Settlement</h3>
                  <p className="text-xs text-slate-500 font-medium">Mark invoice paid on time to avert tax disallowance</p>
                </div>
              </div>
              <button onClick={() => setShowPayModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={confirmPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor:</label>
                <p className="font-bold text-slate-900 text-sm">{showPayModal.vendorName}</p>
                <p className="text-slate-500 text-[11px]">Invoice #{showPayModal.invoiceNumber} &bull; {formatCurrencyINR(showPayModal.invoiceAmount)}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Payment UTR / Transaction Reference *</label>
                <input
                  type="text"
                  placeholder="e.g. CMS-9918230 or NEFT-881920"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Settlement Date *</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-btred-logo hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Add MSME Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 text-btred-logo rounded-xl border border-red-200">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add MSME Vendor Invoice</h3>
                  <p className="text-xs text-slate-500 font-medium">Enroll into Section 43B(h) compliance watchdog</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Precision Tools Private Limited"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Udyam Number</label>
                  <input
                    type="text"
                    placeholder="UDYAM-MP-08-0012345"
                    value={newUdyam}
                    onChange={(e) => setNewUdyam(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Enterprise Type *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-800 font-bold"
                  >
                    <option value="MICRO">Micro Enterprise</option>
                    <option value="SMALL">Small Enterprise</option>
                    <option value="TRADER_EXEMPT">Trader (43B(h) Exempt)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-081"
                    value={newInvNum}
                    onChange={(e) => setNewInvNum(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    value={newInvDate}
                    onChange={(e) => setNewInvDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Principal Amount (INR) *</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs focus:outline-none focus:border-slate-800"
                  min={1}
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Written Agreement Present?</span>
                  <span className="text-[11px] text-slate-500">
                    {newHasContract ? "45-day statutory limit applies u/s 15" : "Strict 15-day limit applies (no written contract)"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newHasContract}
                  onChange={(e) => setNewHasContract(e.target.checked)}
                  className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-btred-logo hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Enroll Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Printable Treasury Advisory Report Modal */}
      {showAdvisoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Treasury Advisory &bull; MSME Section 43B(h)</h3>
                <p className="text-xs text-slate-500 font-medium">Prepared for: {client?.name || "Client Enterprise"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowAdvisoryModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-800 leading-relaxed font-sans">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                <p><strong>To:</strong> Board of Directors &amp; Chief Financial Officer</p>
                <p><strong>Entity:</strong> {client?.name || "Client Private Limited"}</p>
                <p><strong>Date:</strong> {formatDate(new Date().toISOString())}</p>
                <p><strong>Subject:</strong> Immediate Cashflow &amp; Statutory Action Plan u/s 43B(h) and MSMED Act, 2006</p>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">1. Executive Summary &amp; Exposure Analysis</h4>
                <p>
                  As of today, the total outstanding payment to registered Micro and Small suppliers stands at <strong>{formatCurrencyINR(totalUnpaidNonTrader)}</strong>. Out of this, invoices totaling <strong>{formatCurrencyINR(totalDisallowedRisk)}</strong> have breached statutory credit limits.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-rose-700 block">Disallowance Tax Hit</span>
                  <span className="text-lg font-black text-rose-900">{formatCurrencyINR(potentialTaxHit)}</span>
                  <span className="text-[10px] text-rose-800 block mt-0.5">Taxable profit addback @ {(taxRegimeRate*100).toFixed(2)}%</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">MSMED Penal Interest</span>
                  <span className="text-lg font-black text-amber-900">{formatCurrencyINR(totalSec16Interest)}</span>
                  <span className="text-[10px] text-amber-800 block mt-0.5">19.5% p.a. compounded monthly (Non-Deductible)</span>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">2. Recommended Treasury Next Steps</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>Authorize immediate RTGS/NEFT disbursements for invoices in the Critical &amp; Overdue queue before the close of current fiscal period.</li>
                  <li>Verify all supplier Udyam certificates against the MSME portal to ensure no medium enterprises or traders are inadvertently flagged.</li>
                  <li>In instances of defective consignments or price disputes, formally issue written notices within 15 days to halt statutory clocks u/s 2(b).</li>
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex justify-between items-center">
                <span>GPA &amp; Co., Chartered Accountants &bull; FRN: 022998C</span>
                <span className="font-mono">STRICTLY CONFIDENTIAL</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
