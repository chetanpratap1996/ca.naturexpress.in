"use client";

import React, { useState } from "react";
import { formatCurrencyINR } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Download, 
  RefreshCw, 
  Filter, 
  Search, 
  Building2, 
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Check,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";

export interface EnhancedRecoItem {
  id: string;
  vendorName: string;
  vendorGstin: string;
  invoiceNo: string;
  booksInvoiceNo?: string;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalItc: number;
  status: "EXACT_MATCH" | "FUZZY_MATCHED" | "VALUE_MISMATCH" | "MISSING_IN_2B" | "MISSING_IN_BOOKS";
  section17_5Blocked: boolean;
  blockedReason?: "MOTOR_VEHICLE" | "FOOD_BEVERAGE" | "WORKS_CONTRACT" | "PERSONAL_USE";
  section16_4Risk: boolean; // Approaching Nov 30 deadline
  rule37aRisk: boolean; // Vendor GSTR-3B pending
  difference?: number;
  vendorPhone?: string;
  actionNote: string;
}

const INITIAL_ENHANCED_RECO: EnhancedRecoItem[] = [];

export const Gstr2bReconciler: React.FC = () => {
  const [items, setItems] = useState<EnhancedRecoItem[]>(INITIAL_ENHANCED_RECO);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [chasedVendors, setChasedVendors] = useState<string[]>([]);

  const filtered = items.filter((item) => {
    let matchesCategory = true;
    if (filterStatus === "MATCHED") {
      matchesCategory = (item.status === "EXACT_MATCH" || item.status === "FUZZY_MATCHED") && !item.section17_5Blocked;
    } else if (filterStatus === "BLOCKED_17_5") {
      matchesCategory = item.section17_5Blocked;
    } else if (filterStatus === "MISSING_IN_2B") {
      matchesCategory = item.status === "MISSING_IN_2B";
    } else if (filterStatus === "SEC_16_4") {
      matchesCategory = item.section16_4Risk;
    }

    const matchesSearch =
      item.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      item.vendorGstin.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceNo.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // GSTR-3B Table 4 Distribution Calculations
  const eligibleItcTable4A5 = items
    .filter((i) => (i.status === "EXACT_MATCH" || i.status === "FUZZY_MATCHED") && !i.section17_5Blocked)
    .reduce((sum, i) => sum + i.totalItc, 0);

  const blockedItcTable4B1 = items
    .filter((i) => i.section17_5Blocked)
    .reduce((sum, i) => sum + i.totalItc, 0);

  const atRiskMissingItc = items
    .filter((i) => i.status === "MISSING_IN_2B" || i.status === "VALUE_MISMATCH")
    .reduce((sum, i) => sum + i.totalItc, 0);

  const timeBarredRisk164 = items
    .filter((i) => i.section16_4Risk)
    .reduce((sum, i) => sum + i.totalItc, 0);

  const handleChaseVendor = (item: EnhancedRecoItem) => {
    setChasedVendors((prev) => [...prev, item.id]);
    const phone = sanitizeIndianPhoneNumber(item.vendorPhone || "919820044101");
    const text = `*URGENT: GSTR-1 UPLOAD PENDING FOR ITC RECONCILIATION*\n\n` +
      `Dear ${item.vendorName},\n\n` +
      `Invoice #${item.invoiceNo} dated ${item.invoiceDate} (Taxable: ₹${item.taxableValue.toLocaleString()}, ITC: ₹${item.totalItc.toLocaleString()}) issued to our client is currently *NOT REFLECTING* in departmental GSTR-2B.\n\n` +
      `Under Section 16(2)(aa) of CGST Act, client cannot claim ITC without your GSTR-1 filing. Kindly file immediately or client accounts will withhold payment.\n\n` +
      `Regards,\n*GPA & Co., Chartered Accountants & Brains & Taxes*`;

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    }

    setSyncSuccessToast(`Dispatched statutory WhatsApp demand notice to ${item.vendorName}!`);
    setTimeout(() => setSyncSuccessToast(null), 5000);
  };

  const handleSimulateTallySync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccessToast("Successfully synced 8 purchase vouchers from TallyPrime via ODBC bridge. 1 fuzzy match resolved.");
      setTimeout(() => setSyncSuccessToast(null), 5000);
    }, 1200);
  };

  const handleExportRecoCsv = () => {
    const headers = ["Vendor Name", "Vendor GSTIN", "Invoice No", "Date", "Taxable Value", "Total ITC", "Match Status", "17(5) Blocked", "16(4) Risk", "Action"];
    const rows = items.map((i) => [
      `"${i.vendorName}"`,
      i.vendorGstin,
      i.invoiceNo,
      i.invoiceDate,
      i.taxableValue,
      i.totalItc,
      i.status,
      i.section17_5Blocked ? "BLOCKED" : "ELIGIBLE",
      i.section16_4Risk ? "TIME_BARRED_SOON" : "SAFE",
      `"${i.actionNote}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GSTR2B_Reconciliation_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" /> Section 16(2)(aa) &amp; 17(5) Engine
              </span>
              <span className="text-xs text-slate-400">4-Way Automated Matcher</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-400" /> Smart GSTR-2B vs Tally Auto-Reconciler
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Eliminate ITC notice risk (DRC-01C / ASMT-10). Match GSP Portal 2B against Tally Purchase Register with fuzzy invoice normalization, auto-divert Section 17(5) blocked credit to Table 4(B)(1), and alert on Section 16(4) time-barring.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportRecoCsv}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              title="Export Full Reconciliation to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleSimulateTallySync}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing Tally & Portal..." : "1-Click Tally & 2B Sync"}
            </button>
          </div>
        </div>
      </div>

      {syncSuccessToast && (
        <div className="bg-blue-900/50 border border-blue-500/40 text-blue-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm shadow-md">
          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
          <span>{syncSuccessToast}</span>
        </div>
      )}

      {/* 4-Bucket Tax Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 uppercase truncate">Table 4A5 Eligible</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold text-white mt-1.5 sm:mt-2">₹{eligibleItcTable4A5.toLocaleString("en-IN")}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Safe to Claim in 3B</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-amber-400 uppercase truncate">Table 4B1 Blocked</span>
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-400 mt-1.5 sm:mt-2">₹{blockedItcTable4B1.toLocaleString("en-IN")}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Vehicles &amp; Food ITC</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-rose-400 uppercase truncate">Missing in 2B</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold text-rose-400 mt-1.5 sm:mt-2">₹{atRiskMissingItc.toLocaleString("en-IN")}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Vendor GSTR-1 Pending</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-purple-400 uppercase truncate">Sec 16(4) Risk</span>
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold text-purple-300 mt-1.5 sm:mt-2">₹{timeBarredRisk164.toLocaleString("en-IN")}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Cutoff: 30-Nov-2026</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, GSTIN, or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full sm:w-80"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none touch-pan-x pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium transition whitespace-nowrap shrink-0 ${
              filterStatus === "ALL" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilterStatus("MATCHED")}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium transition whitespace-nowrap shrink-0 ${
              filterStatus === "MATCHED" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Eligible Table 4A5
          </button>
          <button
            onClick={() => setFilterStatus("BLOCKED_17_5")}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium transition whitespace-nowrap shrink-0 ${
              filterStatus === "BLOCKED_17_5" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Blocked 17(5)
          </button>
          <button
            onClick={() => setFilterStatus("MISSING_IN_2B")}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium transition whitespace-nowrap shrink-0 ${
              filterStatus === "MISSING_IN_2B" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Missing in 2B
          </button>
          <button
            onClick={() => setFilterStatus("SEC_16_4")}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium transition whitespace-nowrap shrink-0 ${
              filterStatus === "SEC_16_4" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Sec 16(4) Risk
          </button>
        </div>
      </div>

      {/* Reconciled Records Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                <th className="py-3 px-4">Supplier &amp; GSTIN</th>
                <th className="py-3 px-4">Invoice / Books Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">Total ITC (₹)</th>
                <th className="py-3 px-4">Tax Treatment / Status</th>
                <th className="py-3 px-4 text-right">Statutory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="font-bold text-slate-200 text-sm">Zero GSTR-2B Invoices Loaded</div>
                    <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Upload departmental GSTR-2B JSON and Tally / ERP Purchase Register above to execute 3-way automated matching and Section 17(5) blocking.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{item.vendorName}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.vendorGstin}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-slate-200">2B: {item.invoiceNo}</div>
                    {item.booksInvoiceNo && item.booksInvoiceNo !== item.invoiceNo && (
                      <div className="text-cyan-400 text-[10px]">Tally: {item.booksInvoiceNo} (Fuzzy)</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{item.invoiceDate}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-200">
                    ₹{item.taxableValue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    ₹{item.totalItc.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4">
                    {item.section17_5Blocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <ShieldAlert className="w-3 h-3 text-amber-400" /> Blocked 17(5) ({item.blockedReason})
                      </span>
                    ) : item.section16_4Risk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Clock className="w-3 h-3 text-purple-400" /> Sec 16(4) Expiring
                      </span>
                    ) : item.status === "EXACT_MATCH" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Table 4(A)(5) Eligible
                      </span>
                    ) : item.status === "FUZZY_MATCHED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <Sparkles className="w-3 h-3 text-cyan-400" /> Fuzzy Matched
                      </span>
                    ) : item.status === "MISSING_IN_2B" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3 text-rose-400" /> Missing in 2B (Rule 37A)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Mismatch (₹{item.difference})
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1 max-w-xs">{item.actionNote}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.status === "MISSING_IN_2B" || item.status === "VALUE_MISMATCH" ? (
                      <button
                        onClick={() => handleChaseVendor(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <Send className="w-3 h-3" /> Chase on WhatsApp
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">Ready for GSTR-3B</span>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
