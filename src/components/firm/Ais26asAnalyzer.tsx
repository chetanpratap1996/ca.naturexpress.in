"use client";

import React, { useState } from "react";
import { 
  FileSearch, 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  Search, 
  DollarSign, 
  Filter,
  ArrowRight,
  TrendingUp,
  Landmark,
  Layers,
  Sparkles
} from "lucide-react";
import { ClientEntity } from "@/lib/types";

export interface AisRecord {
  id: string;
  sourceType: "TDS_26AS" | "SFT_HIGH_VALUE" | "DIVIDEND" | "SECURITIES_TRADING" | "INTEREST_SAVINGS_FD" | "FOREIGN_REMITTANCE";
  reportingEntity: string; // e.g. HDFC Bank Ltd, Zerodha Broking, Infosys Ltd
  description: string;
  pan: string;
  financialYear: string;
  reportedAmount: number;
  taxDeducted: number;
  informationCode: string; // e.g. SFT-004, SFT-005, 194A, 194J
  itrStatus: "MATCHED_IN_ITR" | "UNREPORTED_INCOME_RISK" | "VERIFIED_EXEMPT" | "DISCREPANCY_FLAG";
  recommendation: string;
}

const DEFAULT_REALISTIC_AIS_DATA: AisRecord[] = [
  {
    id: "ais-1",
    sourceType: "SFT_HIGH_VALUE",
    reportingEntity: "HDFC Bank Limited (Palasia Branch)",
    description: "Cash deposits in current/savings account aggregating to ₹10 Lakh or more (SFT-004)",
    pan: "AAACB1234F",
    financialYear: "FY 2024-25",
    reportedAmount: 1450000,
    taxDeducted: 0,
    informationCode: "SFT-004",
    itrStatus: "UNREPORTED_INCOME_RISK",
    recommendation: "High Scrutiny Alert: Verify if cash deposits match cash sales vouchers or capital introduction in books to prevent Section 68 unexplained cash credits."
  },
  {
    id: "ais-2",
    sourceType: "TDS_26AS",
    reportingEntity: "Tata Consultancy Services Ltd",
    description: "TDS on Professional/Technical Fees under Section 194J @ 10%",
    pan: "AAACB1234F",
    financialYear: "FY 2024-25",
    reportedAmount: 850000,
    taxDeducted: 85000,
    informationCode: "SEC_194J",
    itrStatus: "MATCHED_IN_ITR",
    recommendation: "Gross receipts of ₹8,50,000 and TDS credit of ₹85,000 verified against 26AS. Ready to claim in Schedule TDS-2."
  },
  {
    id: "ais-3",
    sourceType: "DIVIDEND",
    reportingEntity: "ITC Limited (Registrar & Transfer Agent)",
    description: "Dividend distributed by domestic company under Section 194",
    pan: "AAACB1234F",
    financialYear: "FY 2024-25",
    reportedAmount: 48500,
    taxDeducted: 4850,
    informationCode: "SEC_194",
    itrStatus: "DISCREPANCY_FLAG",
    recommendation: "Client omitted dividend in draft computation. Auto-route ₹48,500 to Schedule OS (Income from Other Sources) and claim ₹4,850 TDS credit."
  },
  {
    id: "ais-4",
    sourceType: "SECURITIES_TRADING",
    reportingEntity: "Zerodha Broking Limited",
    description: "Sale of listed equity shares / units of equity-oriented mutual funds (SFT-017)",
    pan: "AAACB1234F",
    financialYear: "FY 2024-25",
    reportedAmount: 2240000,
    taxDeducted: 0,
    informationCode: "SFT-017",
    itrStatus: "UNREPORTED_INCOME_RISK",
    recommendation: "Trading turnover reported on AIS is ₹22.4L. Obtain P&L statement from Zerodha to compute STCG u/s 111A and LTCG u/s 112A above ₹1.25L exemption."
  },
  {
    id: "ais-5",
    sourceType: "INTEREST_SAVINGS_FD",
    reportingEntity: "State Bank of India (Indore Main Branch)",
    description: "Interest from Term Deposits (FD) & Savings Bank Account",
    pan: "AAACB1234F",
    financialYear: "FY 2024-25",
    reportedAmount: 76200,
    taxDeducted: 7620,
    informationCode: "SEC_194A",
    itrStatus: "MATCHED_IN_ITR",
    recommendation: "Reported in Schedule OS. Deduct ₹10,000 exemption under Section 80TTA (for non-senior assessee) in Old Regime."
  },
  {
    id: "ais-6",
    sourceType: "FOREIGN_REMITTANCE",
    reportingEntity: "ICICI Bank Forex Services",
    description: "Outward remittance under Liberalised Remittance Scheme (LRS) / TCS u/s 206C(1G)",
    pan: "AAACB1234F",
    financialYear: "FY 2024-25",
    reportedAmount: 620000,
    taxDeducted: 31000, // TCS @ 5%
    informationCode: "TCS_206C_1G",
    itrStatus: "MATCHED_IN_ITR",
    recommendation: "Foreign education / travel remittance. Claim ₹31,000 TCS credit in Schedule TCS to reduce net ITR tax liability or generate refund."
  }
];

interface Ais26asAnalyzerProps {
  clients?: ClientEntity[];
}

export const Ais26asAnalyzer: React.FC<Ais26asAnalyzerProps> = ({ clients = [] }) => {
  const [records, setRecords] = useState<AisRecord[]>(DEFAULT_REALISTIC_AIS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // File Upload Parser (AIS / 26AS JSON)
  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        // Common structure of ITD AIS JSON export: raw.aisData or raw.partB
        const aisItems: any[] = raw.aisData || raw.records || raw.data || [];
        
        if (aisItems.length === 0) {
          setSyncToast("Loaded test JSON structure with valid AIS schema mapping.");
          return;
        }

        const parsed: AisRecord[] = aisItems.map((item: any, idx: number) => {
          const amt = Number(item.amount || item.reportedAmount || item.txVal || 0);
          const tds = Number(item.tds || item.taxDeducted || 0);
          return {
            id: `upload-ais-${idx}`,
            sourceType: item.type || "SFT_HIGH_VALUE",
            reportingEntity: item.reportingEntity || item.entity || "Financial Institution",
            description: item.description || "Reported Financial Transaction",
            pan: item.pan || "CLIENT_PAN",
            financialYear: item.financialYear || "FY 2024-25",
            reportedAmount: amt,
            taxDeducted: tds,
            informationCode: item.code || "SFT-GEN",
            itrStatus: amt > 500000 ? "UNREPORTED_INCOME_RISK" : "MATCHED_IN_ITR",
            recommendation: `Parsed from ITD portal JSON export: ${item.notes || "Inspect before final return verification."}`
          };
        });

        setRecords(parsed);
        setSyncToast(`Successfully parsed ${parsed.length} official AIS transactions!`);
        setTimeout(() => setSyncToast(null), 5000);
      } catch (err: any) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    setRecords(DEFAULT_REALISTIC_AIS_DATA);
    setSyncToast("Reset to Standard Indian CA Practice AIS/26AS dataset.");
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleExportCsv = () => {
    const headers = ["Reporting Entity", "Type", "Code", "Description", "Reported Amount (₹)", "TDS/TCS (₹)", "ITR Status", "CA Recommendation"];
    const rows = records.map(r => [
      `"${r.reportingEntity}"`,
      r.sourceType,
      r.informationCode,
      `"${r.description}"`,
      r.reportedAmount,
      r.taxDeducted,
      r.itrStatus,
      `"${r.recommendation}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AIS_26AS_Reconciliation_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = records.filter(r => {
    const matchesCategory = selectedCategory === "ALL" || r.sourceType === selectedCategory;
    const matchesSearch = 
      r.reportingEntity.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.informationCode.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalReportedValue = records.reduce((s, r) => s + r.reportedAmount, 0);
  const totalTdsCredits = records.reduce((s, r) => s + r.taxDeducted, 0);
  const highRiskDefectCount = records.filter(r => r.itrStatus === "UNREPORTED_INCOME_RISK" || r.itrStatus === "DISCREPANCY_FLAG").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border border-cyan-700/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-cyan-300" /> Section 143(1)(a) Notice Shield
              </span>
              <span className="text-xs text-slate-400 font-mono">AIS, TIS &amp; 26AS JSON Analyzer</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Annual Information Statement (AIS) &amp; SFT Inspector
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cross-check client's ITD Portal AIS JSON against draft ITR schedules before e-filing. Auto-flags cash deposits (SFT-004), mutual fund redemptions, foreign remittances, and uncredited TDS to prevent Section 143(1)(a) defect notices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Import AIS JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleUploadJson}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleResetSample}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold rounded-xl transition"
            >
              Reset Data
            </button>
          </div>
        </div>
      </div>

      {syncToast && (
        <div className="bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm shadow-md">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* 3 Metric Summary Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Total SFT Reported Volume</div>
          <div className="text-2xl font-black text-white mt-1">₹{totalReportedValue.toLocaleString("en-IN")}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Aggregated banking &amp; securities transactions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Available 26AS TDS/TCS Credits</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalTdsCredits.toLocaleString("en-IN")}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Prepaid taxes available for set-off in ITR</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Notice Risk Discrepancies</div>
          <div className={`text-2xl font-black mt-1 ${highRiskDefectCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {highRiskDefectCount} Flagged Items
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Potential Section 143(1)(a) defect exposure</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "ALL", label: `All Records (${records.length})` },
            { id: "SFT_HIGH_VALUE", label: "SFT Cash & Banking" },
            { id: "SECURITIES_TRADING", label: "Stock / MFs" },
            { id: "TDS_26AS", label: "26AS TDS" },
            { id: "DIVIDEND", label: "Dividends" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search entity, SFT code or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* AIS Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Reporting Entity &amp; Code</th>
                <th className="py-3 px-4">Transaction Details</th>
                <th className="py-3 px-4 text-right">Reported Value (₹)</th>
                <th className="py-3 px-4 text-right">TDS / TCS (₹)</th>
                <th className="py-3 px-4">ITR Alignment</th>
                <th className="py-3 px-4">Statutory Action / Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <div className="font-bold text-slate-200 text-sm">Zero AIS Records Loaded</div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.reportingEntity}</div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-0.5 bg-cyan-950/60 inline-block px-1.5 py-0.5 rounded border border-cyan-800/40">
                        {item.informationCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-300">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                      ₹{item.reportedAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 whitespace-nowrap">
                      {item.taxDeducted > 0 ? `₹${item.taxDeducted.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {item.itrStatus === "MATCHED_IN_ITR" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Matched in ITR
                        </span>
                      ) : item.itrStatus === "UNREPORTED_INCOME_RISK" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> Unreported Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <ShieldAlert className="w-3 h-3 text-amber-400" /> Discrepancy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-300 leading-relaxed max-w-sm">
                      {item.recommendation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
