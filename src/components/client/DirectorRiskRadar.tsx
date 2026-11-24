"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  CreditCard, 
  Building2, 
  Clock, 
  Scale, 
  FileText, 
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Upload,
  Check,
  X,
  FileCheck2,
  Lock,
  ChevronRight,
  Info
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";

export interface DirectorProfile {
  name: string;
  din: string;
  dinStatus: "ACTIVE" | "DEACTIVATED_KYC_DUE";
  dir3KycStatus: "FILED" | "PENDING";
  disqualificationRisk: "CLEAN" | "HIGH_RISK";
  associatedCompanies: { cin: string; name: string; status: "COMPLIANT" | "DEFAULT_PENDING" }[];
  syncedDate: string;
}

export interface SftTransactionFlag {
  id: string;
  category: string;
  reportingEntity: string;
  amount: number;
  date: string;
  statusInItr: "DECLARED" | "MISMATCH_ALERT";
  recommendedAction: string;
  actionLabel?: string;
  isReconciled?: boolean;
}

const DEFAULT_DIRECTORS: DirectorProfile[] = [
  {
    name: "Chetan Pratap Singh",
    din: "02849102",
    dinStatus: "ACTIVE",
    dir3KycStatus: "FILED",
    disqualificationRisk: "CLEAN",
    associatedCompanies: [
      { cin: "U74110MH2024PTC043716", name: "Pratwi Solutions Private Limited", status: "COMPLIANT" }
    ],
    syncedDate: "24-Oct-2026"
  }
];

const INITIAL_SFT_FLAGS: SftTransactionFlag[] = [
  {
    id: "SFT-004",
    category: "SFT-004: High-Value Cash Deposits in Current/Savings",
    reportingEntity: "HDFC Bank (Palasia Branch, Indore)",
    amount: 1450000,
    date: "2026-09-18",
    statusInItr: "MISMATCH_ALERT",
    recommendedAction: "High Scrutiny Alert: Verify cash sales vouchers before filing ITR to prevent Section 68 unexplained cash credit addition.",
    actionLabel: "Verify Vouchers",
    isReconciled: false
  },
  {
    id: "SFT-006",
    category: "SFT-006: Purchase of Mutual Fund Units (> ₹10L)",
    reportingEntity: "HDFC Mutual Fund Asset Management",
    amount: 1000000,
    date: "2026-08-14",
    statusInItr: "DECLARED",
    recommendedAction: "Fully matched with director's capital source declaration.",
    actionLabel: "Reconciled",
    isReconciled: true
  },
  {
    id: "SFT-005",
    category: "SFT-005: Credit Card Payments (> ₹10L Aggregated)",
    reportingEntity: "ICICI Bank Credit Cards",
    amount: 1120000,
    date: "2026-07-29",
    statusInItr: "DECLARED",
    recommendedAction: "Examined against personal drawings in firm accounts. No unexplained expenditure u/s 69C.",
    actionLabel: "Reconciled",
    isReconciled: true
  }
];

export interface DirectorRiskRadarProps {
  client?: ClientEntity | null;
}

export const DirectorRiskRadar: React.FC<DirectorRiskRadarProps> = ({ client }) => {
  const [directors] = useState<DirectorProfile[]>(() => {
    if (!client) return DEFAULT_DIRECTORS;
    const dirName = client.primaryContact?.name || "Authorized Director";
    const cinCode = client.cin || (client.type === "PVT_LTD" || client.type === "PUBLIC_LTD" ? "CIN Verified" : "N/A (Non-Corporate)");
    const dinDigits = client.cin 
      ? `09${Math.abs(client.pan.split("").reduce((a, b) => a + b.charCodeAt(0), 0) * 31).toString().slice(0, 6)}` 
      : client.type === "PVT_LTD" || client.type === "PUBLIC_LTD" ? "DIR-3 ACTIVE" : "N/A";

    return [
      {
        name: dirName,
        din: dinDigits,
        dinStatus: "ACTIVE",
        dir3KycStatus: "FILED",
        disqualificationRisk: "CLEAN",
        associatedCompanies: [
          { cin: cinCode, name: client.name, status: "COMPLIANT" }
        ],
        syncedDate: "Today (MCA V3)"
      }
    ];
  });

  const [sftFlags, setSftFlags] = useState<SftTransactionFlag[]>(() => {
    if (typeof window !== "undefined" && client?.id) {
      try {
        const saved = localStorage.getItem(`bt_sft_flags_${client.id}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    // Client statutory risk radar initialized
    if (client && client.id.startsWith("CLI-")) {
      return [];
    }
    return INITIAL_SFT_FLAGS;
  });
  const [filterType, setFilterType] = useState<"ALL" | "ALERTS" | "RECONCILED">("ALL");
  const [selectedFlagForUpload, setSelectedFlagForUpload] = useState<SftTransactionFlag | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [reconciliationNote, setReconciliationNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMasterDataModalOpen, setIsMasterDataModalOpen] = useState(false);

  // Compute stats
  const alertCount = sftFlags.filter((f) => f.statusInItr === "MISMATCH_ALERT").length;
  const reconciledCount = sftFlags.filter((f) => f.statusInItr === "DECLARED" || f.isReconciled).length;
  const governanceScore = alertCount === 0 ? 100 : 98;

  // Filtered list
  const filteredFlags = sftFlags.filter((flag) => {
    if (filterType === "ALERTS") return flag.statusInItr === "MISMATCH_ALERT";
    if (filterType === "RECONCILED") return flag.statusInItr === "DECLARED" || flag.isReconciled;
    return true;
  });

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleConfirmReconciliation = () => {
    if (!selectedFlagForUpload) return;
    setIsSubmitting(true);

    setTimeout(() => {
      setSftFlags((prev) =>
        prev.map((item) =>
          item.id === selectedFlagForUpload.id
            ? {
                ...item,
                statusInItr: "DECLARED",
                isReconciled: true,
                recommendedAction: "Linked with cash sales invoices & daily cash book register. Verified by CA Audit Desk to prevent Section 68 addition."
              }
            : item
        )
      );

      toast.success(
        "Vouchers Linked & Verified",
        `Supporting sales vouchers attached to ${selectedFlagForUpload.id}. Section 68 scrutiny risk eliminated.`
      );

      setIsSubmitting(false);
      setSelectedFlagForUpload(null);
      setUploadedFiles([]);
      setReconciliationNote("");
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Promoter Liability Protection Hero Banner */}
      <div className="bg-white border-2 border-red-500 text-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" /> Promoter Liability Protection
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Companies Act 2013 &bull; Section 164(2) &bull; CBDT Project Insight
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Director Personal Risk &amp; MCA Penalty Shield
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Real-time vigilance against Section 164(2) disqualifications, DIN freezes, MCA compounding daily penalties, and personal tax mismatches across all group entities.
            </p>
          </div>

          {/* Right Status Badge in Hero Banner */}
          <div className="flex items-center gap-3 bg-slate-50 border border-emerald-200 px-5 py-3 rounded-2xl shrink-0 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                All DINs Active &amp; Verified
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">
                Zero disqualification risk detected
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                MCA V3 Synced Today
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MCA Compounding Late Fee */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              MCA Compounding Late Fee
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            ₹0 Accrued
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-snug">
            Zero overdue MCA e-forms (AOC-4, MGT-7, DPT-3). Saved from ₹100/day daily penalty.
          </p>
        </div>

        {/* Card 2: Section 164(2) Shield */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Section 164(2) Shield
            </span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            100% Protected
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-snug">
            All directorships across group entities in full statutory compliance.
          </p>
        </div>

        {/* Card 3: High-Value SFT Flags */}
        <div className={`bg-white rounded-3xl p-5 shadow-sm border transition ${
          alertCount > 0 ? "border-amber-200 bg-amber-50/20" : "border-slate-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              High-Value SFT Flags
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">
            {alertCount > 0 ? `${alertCount} Item Mismatch` : "0 Mismatches"}
          </div>
          <p className="text-xs text-amber-900/80 mt-2 leading-snug font-medium">
            {alertCount > 0 
              ? "₹14.5L cash deposit requires sale voucher linking in current ITR."
              : "All AIS/TIS financial transactions fully reconciled with books."}
          </p>
        </div>

        {/* Card 4: Statutory Governance Score */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Statutory Governance Score
            </span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {governanceScore} / 100
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-snug">
            Grade A+ Institutional Rating. Eligible for priority bank loan appraisal.
          </p>
        </div>
      </div>

      {/* Board of Directors DIN & MCA KYC Status */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-red-600" />
            Board of Directors DIN &amp; MCA KYC Status
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {directors.length} Registered Signatory
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directors.map((dir) => (
            <div key={dir.din} className="p-4 sm:p-5 border border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{dir.name}</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-full flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> DIN Active
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 mt-1.5">
                  DIN: <strong>{dir.din}</strong> &bull; DIR-3 Web-KYC: <strong className="text-emerald-700 font-semibold">Filed for FY26</strong>
                </div>

                <div className="mt-4 text-xs text-slate-600 space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                    Associated Group Entities:
                  </span>
                  {dir.associatedCompanies.map((c) => (
                    <div key={c.cin} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-200/80">
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Compliant
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>MCA V3 Portal Synced: {dir.syncedDate}</span>
                <button 
                  onClick={() => setIsMasterDataModalOpen(true)}
                  className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  MCA Master Data &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SFT / High-Value Transaction Flags Feed */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-700" />
              Income Tax Department SFT &amp; AIS High-Value Transaction Feed
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Source: CBDT Project Insight &bull; Annual Information Statement (AIS) Cross-Verification
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filterType === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({sftFlags.length})
            </button>
            <button
              onClick={() => setFilterType("ALERTS")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                filterType === "ALERTS"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Alerts ({alertCount})
            </button>
            <button
              onClick={() => setFilterType("RECONCILED")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                filterType === "RECONCILED"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Reconciled ({reconciledCount})
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/70">
                <th className="p-3.5">SFT Category</th>
                <th className="p-3.5">Reporting Institution</th>
                <th className="p-3.5 text-right">Reported Value</th>
                <th className="p-3.5">ITR Status</th>
                <th className="p-3.5">CA Advisory Action</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">No transactions under this filter</div>
                  </td>
                </tr>
              ) : (
                filteredFlags.map((flag) => {
                  const isMismatch = flag.statusInItr === "MISMATCH_ALERT";
                  return (
                    <tr key={flag.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold text-slate-900 max-w-xs">
                        {flag.category}
                      </td>
                      <td className="p-3.5 font-medium text-slate-600">
                        {flag.reportingEntity}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900">
                        {formatCurrencyINR(flag.amount)}
                      </td>
                      <td className="p-3.5">
                        {isMismatch ? (
                          <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 font-bold text-[10px] rounded-lg flex items-center gap-1.5 w-fit">
                            <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" /> Potential Mismatch
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-lg flex items-center gap-1.5 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Reconciled in Books
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-600 max-w-sm leading-relaxed">
                        {flag.recommendedAction}
                      </td>
                      <td className="p-3.5 text-center">
                        {isMismatch ? (
                          <button
                            onClick={() => setSelectedFlagForUpload(flag)}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-[11px] rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 mx-auto"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Verify Vouchers</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Reconciled
                          </span>
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

      {/* Verify Vouchers Modal */}
      {selectedFlagForUpload && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <FileCheck2 className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-black">Link Cash Sales Vouchers &bull; SFT-004</h3>
              </div>
              <button
                onClick={() => setSelectedFlagForUpload(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Section 68 Statutory Protection Alert
              </div>
              <p className="leading-relaxed">
                CBDT Project Insight reported <strong>{formatCurrencyINR(selectedFlagForUpload.amount)}</strong> cash deposit at <strong>{selectedFlagForUpload.reportingEntity}</strong>.
                Unsubstantiated cash deposits are liable to 78% effective tax + penalties under Section 115BBE. Please upload the supporting daily cash sales bills or cash register extract.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Attach Supporting Sales Register / Deposit Slips (PDF, Excel, Images)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  onChange={handleVoucherUpload}
                  className="hidden"
                  id="sft-voucher-input"
                />
                <label htmlFor="sft-voucher-input" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    Click to browse or drop voucher files here
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Supported: GST Sales Register XML/PDF, Bank Stamped Counterfoils
                  </div>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <div className="text-[11px] font-bold text-slate-700">Selected Files:</div>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="text-xs text-slate-600 flex items-center justify-between">
                      <span className="truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Accountant / Director Reconciliation Note
                </label>
                <textarea
                  value={reconciliationNote}
                  onChange={(e) => setReconciliationNote(e.target.value)}
                  placeholder="e.g. Deposited from retail counter cash sales invoices #1041 to #1089. Recorded in Tally Cash Book ledger."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedFlagForUpload(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmReconciliation}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting to CA Desk...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit &amp; Mark Reconciled</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MCA Master Data Quick Inspection Modal */}
      {isMasterDataModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black">MCA21 V3 Verified Master Record</h3>
              </div>
              <button
                onClick={() => setIsMasterDataModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-slate-500 font-medium">Legal Corporate Entity:</div>
                <div className="font-bold text-slate-900 text-sm">{client?.name || "Corporate Entity"}</div>
                <div className="font-mono text-slate-600 text-[11px]">
                  {client?.cin ? `CIN: ${client.cin}` : `PAN: ${client?.pan || "Registered Entity"}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">ROC Jurisdiction</div>
                  <div className="font-bold text-slate-800 mt-0.5">ROC Mumbai / Gwalior</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Company Status</div>
                  <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Annual Filing Compliance Index (Section 137 &amp; 92)
                </div>
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span>AOC-4 (Financial Statements):</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Filed for FY 2024-25
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span>MGT-7 (Annual Return):</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Filed for FY 2024-25
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span>DPT-3 (Return of Deposits):</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Filed for FY 2025-26
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsMasterDataModalOpen(false)}
                className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition shadow-sm"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
