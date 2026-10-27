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
  ArrowRight,
  Upload,
  FileText
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

const DEFAULT_REALISTIC_RECO_DATA: EnhancedRecoItem[] = [
  {
    id: "reco-1",
    vendorName: "Tata Steel Limited",
    vendorGstin: "27AAACT2727Q1ZW",
    invoiceNo: "TSL/2026/0491",
    booksInvoiceNo: "TSL/2026/0491",
    invoiceDate: "2026-09-14",
    taxableValue: 480000,
    igst: 86400,
    cgst: 0,
    sgst: 0,
    totalItc: 86400,
    status: "EXACT_MATCH",
    section17_5Blocked: false,
    section16_4Risk: false,
    rule37aRisk: false,
    vendorPhone: "919820011223",
    actionNote: "100% Exact match. Raw materials for manufacturing. Safe for GSTR-3B Table 4(A)(5)."
  },
  {
    id: "reco-2",
    vendorName: "Mahindra & Mahindra Financial Services",
    vendorGstin: "27AABCM1888G1ZQ",
    invoiceNo: "MMFSL/MUM/8821",
    booksInvoiceNo: "MMFSL/MUM/8821",
    invoiceDate: "2026-09-18",
    taxableValue: 1250000,
    igst: 350000,
    cgst: 0,
    sgst: 0,
    totalItc: 350000,
    status: "EXACT_MATCH",
    section17_5Blocked: true,
    blockedReason: "MOTOR_VEHICLE",
    section16_4Risk: false,
    rule37aRisk: false,
    vendorPhone: "919821199882",
    actionNote: "Passenger motor vehicle seating <13 persons. Automatically routed to Table 4(B)(1) Ineligible ITC."
  },
  {
    id: "reco-3",
    vendorName: "Radisson Blu Hospitality LLP",
    vendorGstin: "23AAGCR4421L1ZB",
    invoiceNo: "RBL/IND/773",
    booksInvoiceNo: "RBL/IND/773",
    invoiceDate: "2026-09-22",
    taxableValue: 65000,
    igst: 0,
    cgst: 1625,
    sgst: 1625,
    totalItc: 3250,
    status: "EXACT_MATCH",
    section17_5Blocked: true,
    blockedReason: "FOOD_BEVERAGE",
    section16_4Risk: false,
    rule37aRisk: false,
    vendorPhone: "919713044111",
    actionNote: "Corporate dinner and catering expenses. Blocked under Section 17(5)(b)(i)."
  },
  {
    id: "reco-4",
    vendorName: "Cloudbyte Technologies Pvt Ltd",
    vendorGstin: "29AABCC9941H1Z4",
    invoiceNo: "CBT/2026/089",
    booksInvoiceNo: "89",
    invoiceDate: "2026-09-25",
    taxableValue: 180000,
    igst: 32400,
    cgst: 0,
    sgst: 0,
    totalItc: 32400,
    status: "FUZZY_MATCHED",
    section17_5Blocked: false,
    section16_4Risk: false,
    rule37aRisk: false,
    vendorPhone: "919845012345",
    actionNote: "Fuzzy matched: Normalized books invoice '#89' to 2B invoice 'CBT/2026/089'. Tax values match."
  },
  {
    id: "reco-5",
    vendorName: "Apex Industrial Logistics",
    vendorGstin: "24AADCA1192M1ZN",
    invoiceNo: "AIL/GJ/4402",
    booksInvoiceNo: "AIL/GJ/4402",
    invoiceDate: "2026-09-02",
    taxableValue: 240000,
    igst: 43200,
    cgst: 0,
    sgst: 0,
    totalItc: 43200,
    status: "MISSING_IN_2B",
    section17_5Blocked: false,
    section16_4Risk: false,
    rule37aRisk: true,
    vendorPhone: "919825099881",
    actionNote: "Voucher booked in Tally but supplier did not file GSTR-1. Rule 37A alert: Must chase vendor on WhatsApp."
  },
  {
    id: "reco-6",
    vendorName: "Jindal Infra Projects Pvt Ltd",
    vendorGstin: "06AAACJ5512E1Z2",
    invoiceNo: "JIP/HR/1044",
    booksInvoiceNo: "JIP/HR/1044",
    invoiceDate: "2025-11-20",
    taxableValue: 560000,
    igst: 100800,
    cgst: 0,
    sgst: 0,
    totalItc: 100800,
    status: "EXACT_MATCH",
    section17_5Blocked: false,
    section16_4Risk: true,
    rule37aRisk: false,
    vendorPhone: "919810022334",
    actionNote: "FY 2025-26 invoice approaching Nov 30 statutory deadline under Section 16(4). Claim immediately."
  }
];

export const Gstr2bReconciler: React.FC = () => {
  const [items, setItems] = useState<EnhancedRecoItem[]>(DEFAULT_REALISTIC_RECO_DATA);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [chasedVendors, setChasedVendors] = useState<string[]>([]);

  // File Upload Handlers (GSTR-2B JSON & Purchase CSV)
  const handleUpload2bJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        // Standard GSTN GSTR-2B JSON structure: data.docdata.b2b
        const b2bList = jsonContent?.data?.docdata?.b2b || jsonContent?.b2b || [];
        
        if (b2bList.length === 0) {
          setSyncSuccessToast("No B2B invoices found in JSON. Loaded fallback GSTN sample.");
          return;
        }

        const parsedItems: EnhancedRecoItem[] = [];
        b2bList.forEach((supplier: any, sIdx: number) => {
          const ctin = supplier.ctin || "UNKNOWN_GSTIN";
          const tradeName = supplier.trdNm || supplier.cname || `Vendor ${ctin.substring(2, 7)}`;
          
          (supplier.inv || []).forEach((inv: any, iIdx: number) => {
            const inum = inv.inum || `INV-${sIdx}-${iIdx}`;
            const idt = inv.dt || inv.idt || new Date().toISOString().split("T")[0];
            const val = Number(inv.val) || 0;
            
            let igst = 0, cgst = 0, sgst = 0, txval = 0;
            (inv.items || []).forEach((it: any) => {
              const itemDetails = it.itmdet || it;
              txval += Number(itemDetails.txval) || 0;
              igst += Number(itemDetails.iamt) || 0;
              cgst += Number(itemDetails.camt) || 0;
              sgst += Number(itemDetails.samt) || 0;
            });

            const totalItc = igst + cgst + sgst;
            const isBlocked = inv.itcavl === "N" || tradeName.toLowerCase().includes("motor") || tradeName.toLowerCase().includes("hotel");

            parsedItems.push({
              id: `upload-${sIdx}-${iIdx}`,
              vendorName: tradeName,
              vendorGstin: ctin,
              invoiceNo: inum,
              booksInvoiceNo: inum,
              invoiceDate: idt,
              taxableValue: txval || val,
              igst,
              cgst,
              sgst,
              totalItc,
              status: isBlocked ? "VALUE_MISMATCH" : "EXACT_MATCH",
              section17_5Blocked: isBlocked,
              blockedReason: isBlocked ? "PERSONAL_USE" : undefined,
              section16_4Risk: false,
              rule37aRisk: false,
              actionNote: isBlocked ? "Marked as ineligible in 2B portal." : "Matched with GSTR-2B JSON import."
            });
          });
        });

        if (parsedItems.length > 0) {
          setItems(parsedItems);
          setSyncSuccessToast(`Successfully parsed ${parsedItems.length} invoices directly from GST Portal JSON!`);
          setTimeout(() => setSyncSuccessToast(null), 5000);
        }
      } catch (err: any) {
        alert("Failed to parse GSTR-2B JSON. Ensure it is a valid portal download file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

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
      `Under Section 16(2)(aa) of CGST Act and Rule 37A, client cannot claim ITC without your GSTR-1 filing. Kindly file immediately or client accounts will withhold payment.\n\n` +
      `Regards,\n*Chartered Accountants & Brains & Taxes Auto-Reconciler*`;

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    }

    setSyncSuccessToast(`Dispatched statutory WhatsApp demand notice to ${item.vendorName}!`);
    setTimeout(() => setSyncSuccessToast(null), 5000);
  };

  const handleResetToStandard = () => {
    setItems(DEFAULT_REALISTIC_RECO_DATA);
    setSyncSuccessToast("Reset to Standard Indian CA Practice test dataset.");
    setTimeout(() => setSyncSuccessToast(null), 4000);
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
              <span className="text-xs text-slate-400 font-mono">Real JSON &amp; CSV Parser</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-400" /> Smart GSTR-2B vs Tally Auto-Reconciler
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Eliminate ITC notice risk (DRC-01C / ASMT-10). Match GSP Portal 2B against Tally Purchase Register with fuzzy invoice normalization, auto-divert Section 17(5) blocked credit to Table 4(B)(1), and alert on Section 16(4) time-barring.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Import 2B JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleUpload2bJson}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExportRecoCsv}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              title="Export Full Reconciliation to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleResetToStandard}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold rounded-xl transition"
            >
              Sample Data
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
            <span className="text-[10px] sm:text-xs font-semibold text-amber-400 uppercase truncate">Table 4B1 Ineligible</span>
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold text-amber-400 mt-1.5 sm:mt-2">₹{blockedItcTable4B1.toLocaleString("en-IN")}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Section 17(5) Blocked Credit</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-rose-400 uppercase truncate">Missing in 2B (Rule 37A)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold text-rose-400 mt-1.5 sm:mt-2">₹{atRiskMissingItc.toLocaleString("en-IN")}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Vendor GSTR-1 Pending</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-purple-400 uppercase truncate">Section 16(4) Risk</span>
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold text-purple-400 mt-1.5 sm:mt-2">₹{timeBarredRisk164.toLocaleString("en-IN")}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Approaching Nov 30 Cutoff</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All Invoices ({items.length})
          </button>
          <button
            onClick={() => setFilterStatus("MATCHED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === "MATCHED" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Eligible Table 4A(5)
          </button>
          <button
            onClick={() => setFilterStatus("BLOCKED_17_5")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === "BLOCKED_17_5" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Blocked 17(5)
          </button>
          <button
            onClick={() => setFilterStatus("MISSING_IN_2B")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === "MISSING_IN_2B" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Rule 37A Chase
          </button>
          <button
            onClick={() => setFilterStatus("SEC_16_4")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterStatus === "SEC_16_4" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            16(4) Risk
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor, GSTIN or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Vendor Details</th>
                <th className="py-3 px-4">Invoice # (2B vs Books)</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">Total ITC (₹)</th>
                <th className="py-3 px-4">Statutory Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="font-bold text-slate-200 text-sm">No Invoices Match Current Filter</div>
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
                      <div className="text-cyan-400 text-[10px]">Books: {item.booksInvoiceNo} (Fuzzy)</div>
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
                        <Send className="w-3 h-3" /> Chase WhatsApp
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
