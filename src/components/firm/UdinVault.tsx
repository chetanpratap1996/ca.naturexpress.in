"use client";

import React, { useState } from "react";
import { 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Download, 
  Search, 
  Plus, 
  ShieldCheck, 
  ExternalLink,
  Copy,
  Check,
  Building2,
  FileCheck,
  X,
  Ban,
  Filter,
  ShieldAlert
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";
import { validateIcaUdin } from "@/lib/utils";

export interface UdinEntry {
  id: string;
  udin: string; // 18-digit unique code: e.g. 26518492BTA0192841
  documentTitle: string;
  documentType: "TAX_AUDIT_3CD" | "STATUTORY_AUDIT" | "NET_WORTH_CERTIFICATE" | "TURNOVER_CERTIFICATE" | "GST_RECON_9C";
  clientName: string;
  clientPan: string;
  signingDate: string;
  generatedDate?: string;
  financialFigures: string; // e.g. "Turnover: ₹14.2 Cr | Net Profit: ₹1.8 Cr"
  partnerName: string;
  membershipNo: string;
  status: "GENERATED_VALID" | "PENDING_GENERATION" | "EXPIRING_SOON" | "REVOKED";
  daysRemainingForGeneration: number; // ICAI gives 60 days from signing date to generate
  revocationReason?: string;
}

const DEFAULT_REALISTIC_UDIN_DATA: UdinEntry[] = [
  {
    id: "udin-1",
    udin: "26518492BTA0192841",
    documentTitle: "Tax Audit Report u/s 44AB in Form 3CB/3CD for FY 2024-25",
    documentType: "TAX_AUDIT_3CD",
    clientName: "Apex Laboratories Private Limited",
    clientPan: "AABCA9182K",
    signingDate: "2026-09-28",
    generatedDate: "2026-09-29",
    financialFigures: "Turnover: ₹48.20 Cr | Total Disallowances: ₹3.65 Lakh",
    partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
    membershipNo: "518492",
    status: "GENERATED_VALID",
    daysRemainingForGeneration: 60
  },
  {
    id: "udin-2",
    udin: "26518492BTA0881923",
    documentTitle: "Independent Statutory Auditor's Report under Companies Act 2013",
    documentType: "STATUTORY_AUDIT",
    clientName: "Pratwi Solutions Private Limited",
    clientPan: "AABCP8819E",
    signingDate: "2026-10-02",
    generatedDate: "2026-10-03",
    financialFigures: "Total Assets: ₹18.5 Cr | Net Profit: ₹2.1 Cr",
    partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
    membershipNo: "518492",
    status: "GENERATED_VALID",
    daysRemainingForGeneration: 60
  },
  {
    id: "udin-3",
    udin: "PENDING_GENERATION",
    documentTitle: "Banker Net Worth Certificate for Working Capital Loan Enhancement",
    documentType: "NET_WORTH_CERTIFICATE",
    clientName: "OmniRetail Supermarkets Private Limited",
    clientPan: "AABCO4412L",
    signingDate: "2026-10-18",
    financialFigures: "Net Worth: ₹14.80 Cr as on 30-Sep-2026",
    partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
    membershipNo: "518492",
    status: "EXPIRING_SOON",
    daysRemainingForGeneration: 11 // 11 days remaining out of 60 days
  },
  {
    id: "udin-4",
    udin: "PENDING_GENERATION",
    documentTitle: "GST Annual Return Certification Form GSTR-9C",
    documentType: "GST_RECON_9C",
    clientName: "Zenith Infra Projects Limited",
    clientPan: "AABCZ9941M",
    signingDate: "2026-10-22",
    financialFigures: "Taxable Turnover: ₹8.4 Cr | ITC Claimed: ₹42.1 Lakh",
    partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
    membershipNo: "518492",
    status: "PENDING_GENERATION",
    daysRemainingForGeneration: 55
  }
];

interface UdinVaultProps {
  clients?: ClientEntity[];
}

export const UdinVault: React.FC<UdinVaultProps> = ({ clients = [] }) => {
  const [entries, setEntries] = useState<UdinEntry[]>(DEFAULT_REALISTIC_UDIN_DATA);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [updatingEntry, setUpdatingEntry] = useState<UdinEntry | null>(null);
  const [enteredUdinInput, setEnteredUdinInput] = useState("");
  const [revokingEntry, setRevokingEntry] = useState<UdinEntry | null>(null);
  const [revocationReason, setRevocationReason] = useState("");

  // Form State for logging a new signed document
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState(clients[0]?.name || "Apex Laboratories Private Limited");
  const [newType, setNewType] = useState<UdinEntry["documentType"]>("TAX_AUDIT_3CD");
  const [newFigures, setNewFigures] = useState("");
  const [newUdinCode, setNewUdinCode] = useState("");

  const handleCopyUdin = (id: string, udinCode: string) => {
    navigator.clipboard.writeText(udinCode);
    setCopiedId(id);
    toast.success("UDIN Copied", `Copied ${udinCode} to clipboard.`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedClient = clients.find(c => c.name === newClient);
    const clientPan = matchedClient?.pan || "AABCA9182K";
    const cleanUdin = newUdinCode.trim().toUpperCase();

    if (cleanUdin) {
      const val = validateIcaUdin(cleanUdin);
      if (!val.isValid) {
        toast.error("Invalid UDIN Format", val.reason || "Please provide a valid 18-character ICAI UDIN.");
        return;
      }
    }

    const newRec: UdinEntry = {
      id: `udin-${Date.now()}`,
      udin: cleanUdin || "PENDING_GENERATION",
      documentTitle: newTitle,
      documentType: newType,
      clientName: newClient,
      clientPan,
      signingDate: new Date().toISOString().split("T")[0],
      generatedDate: cleanUdin ? new Date().toISOString().split("T")[0] : undefined,
      financialFigures: newFigures || "Audited Figures Documented",
      partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
      membershipNo: "518492",
      status: cleanUdin ? "GENERATED_VALID" : "PENDING_GENERATION",
      daysRemainingForGeneration: 60
    };

    setEntries(prev => [newRec, ...prev]);
    setIsAddOpen(false);
    setNewTitle("");
    setNewFigures("");
    setNewUdinCode("");
    toast.success("Signed Report Logged", `Started 60-day ICAI UDIN countdown for ${newTitle}.`);
  };

  const handleSaveUdin = () => {
    if (!updatingEntry) return;
    const clean = enteredUdinInput.trim().toUpperCase();
    const val = validateIcaUdin(clean);
    if (!val.isValid) {
      toast.error("ICAI UDIN Validation Failed", val.reason || "Invalid 18-digit UDIN format.");
      return;
    }

    setEntries(prev => prev.map(item => {
      if (item.id === updatingEntry.id) {
        return {
          ...item,
          udin: clean,
          status: "GENERATED_VALID",
          generatedDate: new Date().toISOString().split("T")[0],
          daysRemainingForGeneration: 60
        };
      }
      return item;
    }));

    toast.success("UDIN Verified & Linked", `Report linked to active UDIN ${clean}.`);
    setUpdatingEntry(null);
    setEnteredUdinInput("");
  };

  const handleConfirmRevocation = () => {
    if (!revokingEntry || !revocationReason.trim()) {
      toast.error("Reason Required", "Please specify the statutory ground for revocation.");
      return;
    }

    setEntries(prev => prev.map(item => {
      if (item.id === revokingEntry.id) {
        return {
          ...item,
          status: "REVOKED",
          revocationReason: revocationReason.trim()
        };
      }
      return item;
    }));

    toast.info("UDIN Revoked", `Marked UDIN ${revokingEntry.udin} as REVOKED on firm compliance register.`);
    setRevokingEntry(null);
    setRevocationReason("");
  };

  const filtered = entries.filter(e => {
    const matchesFilter = 
      filterType === "ALL" ||
      (filterType === "PENDING" && (e.status === "PENDING_GENERATION" || e.status === "EXPIRING_SOON")) ||
      (filterType === "VALID" && e.status === "GENERATED_VALID") ||
      (filterType === "REVOKED" && e.status === "REVOKED");

    const matchesSearch = 
      e.documentTitle.toLowerCase().includes(search.toLowerCase()) ||
      e.clientName.toLowerCase().includes(search.toLowerCase()) ||
      e.udin.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = entries.filter(e => e.status === "PENDING_GENERATION" || e.status === "EXPIRING_SOON").length;
  const validCount = entries.filter(e => e.status === "GENERATED_VALID").length;
  const revokedCount = entries.filter(e => e.status === "REVOKED").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50/70 via-white to-red-50/40 border border-red-200 rounded-2xl p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-red-50 text-btred-logo border border-red-200 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-btred-logo" /> Mandatory ICAI Council Directive
              </span>
              <span className="text-xs text-slate-500 font-mono">MRN: {DEFAULT_FIRM_BRANDING.managingPartner.split(" ")[1] || "518492"} &bull; 60-Day Clock</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-purple-700" /> UDIN Compliance &amp; Regulatory Vault
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Prevents professional misconduct proceedings under Clause 1 of Part II of Second Schedule. Tracks every signed certificate, audit report and 3CD with real-time 60-day expiry countdowns and direct ICAI verification links.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://udin.icai.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <span>ICAI Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-700" />
            </a>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 bg-btred-logo hover:bg-red-700 text-white shadow-sm font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Signed Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterType("VALID")}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-emerald-300 transition"
        >
          <div className="text-xs font-bold text-slate-500 uppercase">Valid Active UDINs</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{validCount} Verified</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Linked to Tax Audit &amp; ROC returns</div>
        </div>

        <div 
          onClick={() => setFilterType("PENDING")}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-amber-300 transition"
        >
          <div className="text-xs font-bold text-slate-500 uppercase">Pending Generation (Countdown)</div>
          <div className={`text-2xl font-black mt-1 ${pendingCount > 0 ? "text-amber-800" : "text-emerald-700"}`}>
            {pendingCount} Reports Pending
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Signed documents awaiting 18-digit code from icai.org</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Statutory Window</div>
          <div className="text-2xl font-black text-slate-900 mt-1">60 Calendar Days</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Permitted latency from date of signing certificate</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs text-slate-900">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "ALL", label: `All Reports (${entries.length})` },
            { id: "PENDING", label: `Pending / Expiring (${pendingCount})` },
            { id: "VALID", label: `Valid UDINs (${validCount})` },
            { id: "REVOKED", label: `Revoked (${revokedCount})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterType === f.id ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search report title, client or UDIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* UDIN Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] tracking-wider font-mono border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">Document Title &amp; Client</th>
                <th className="py-3 px-4">18-Digit UDIN</th>
                <th className="py-3 px-4">Signing Date</th>
                <th className="py-3 px-4">60-Day Status / Countdown</th>
                <th className="py-3 px-4">Key Financial Figures</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No UDIN records match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900">{item.documentTitle}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-purple-700" /> {item.clientName} ({item.clientPan})
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.status === "REVOKED" ? (
                        <div className="text-[11px] font-mono text-slate-500 line-through bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.udin} (REVOKED)
                        </div>
                      ) : item.udin !== "PENDING_GENERATION" ? (
                        <div className="flex items-center gap-1.5 font-mono text-btred-logo font-bold bg-red-50 px-2 py-1 rounded border border-red-200">
                          <span>{item.udin}</span>
                          <button
                            onClick={() => handleCopyUdin(item.id, item.udin)}
                            className="text-slate-600 hover:text-slate-900 transition"
                            title="Copy UDIN"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                          PENDING GENERATION
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-mono">
                      {item.signingDate}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.status === "GENERATED_VALID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Validated on Portal
                        </span>
                      ) : item.status === "REVOKED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200" title={item.revocationReason}>
                          <Ban className="w-3 h-3 text-rose-600" /> Revoked u/s ICAI
                        </span>
                      ) : item.status === "EXPIRING_SOON" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-btred-logo border border-red-200 animate-pulse">
                          <Clock className="w-3 h-3 text-btred-logo" /> Only {item.daysRemainingForGeneration} Days Left!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-800" /> {item.daysRemainingForGeneration} Days Remaining
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-700 max-w-xs truncate">
                      {item.financialFigures}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {(item.status === "PENDING_GENERATION" || item.status === "EXPIRING_SOON") && (
                        <button
                          onClick={() => {
                            setUpdatingEntry(item);
                            setEnteredUdinInput("");
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                          title="Enter 18-digit UDIN from ICAI Portal"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Enter UDIN</span>
                        </button>
                      )}

                      {item.status === "GENERATED_VALID" && (
                        <button
                          onClick={() => {
                            setRevokingEntry(item);
                            setRevocationReason("");
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg font-bold text-[10px] transition border border-slate-200"
                          title="Revoke UDIN on ICAI Portal"
                        >
                          Revoke
                        </button>
                      )}

                      <a
                        href="https://udin.icai.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1 border border-slate-200"
                      >
                        <span>Verify</span>
                        <ExternalLink className="w-3 h-3 text-purple-700" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ENTER / UPDATE UDIN */}
      {updatingEntry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-700" />
                Record 18-Digit ICAI UDIN
              </h3>
              <button onClick={() => setUpdatingEntry(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-900">{updatingEntry.documentTitle}</p>
              <p className="text-slate-600">Client: <strong>{updatingEntry.clientName}</strong> ({updatingEntry.clientPan})</p>
              <p className="text-slate-500 text-[11px]">Signing Date: {updatingEntry.signingDate}</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                18-Digit Unique Document Identification Number (UDIN) *
              </label>
              <input
                type="text"
                maxLength={18}
                placeholder="e.g. 26518492BKX9081294"
                value={enteredUdinInput}
                onChange={(e) => setEnteredUdinInput(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-mono text-slate-900 font-bold focus:outline-none focus:border-purple-600"
              />
              <span className="text-[10px] text-slate-500 block">
                Format: 26 (Year) + 518492 (MRN) + 10 Alphanumeric Portal Hash
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUpdatingEntry(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUdin}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Verify &amp; Link UDIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REVOKE UDIN */}
      {revokingEntry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Revoke UDIN on Firm Register
              </h3>
              <button onClick={() => setRevokingEntry(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are revoking UDIN <strong className="font-mono text-slate-900">{revokingEntry.udin}</strong> for {revokingEntry.clientName}. Under ICAI rules, revocation requires recording a valid statutory ground.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">ICAI Ground for Revocation *</label>
              <select
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Select Statutory Ground --</option>
                <option value="Typographical error in certified figures">Typographical error in certified figures</option>
                <option value="Client changed scope / revoked engagement letter">Client changed scope / revoked engagement letter</option>
                <option value="Duplicate UDIN generated erroneously">Duplicate UDIN generated erroneously</option>
                <option value="Revised audit report issued post board meeting">Revised audit report issued post board meeting</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRevokingEntry(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevocation}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG SIGNED DOCUMENT */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-700" /> Log Signed Certificate / Audit Report
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-600">
              Starts the mandatory 60-day ICAI UDIN generation clock from the date of physical or digital signing.
            </p>

            <form onSubmit={handleCreateEntry} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Net Worth Certificate for Working Capital Loan"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Category *</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:outline-none font-medium"
                >
                  <option value="TAX_AUDIT_3CD">Tax Audit Report Form 3CB/3CD (44AB)</option>
                  <option value="STATUTORY_AUDIT">Statutory Audit Report (Companies Act 2013)</option>
                  <option value="NET_WORTH_CERTIFICATE">Net Worth Certificate</option>
                  <option value="TURNOVER_CERTIFICATE">Turnover Certificate</option>
                  <option value="GST_RECON_9C">GST Reconciliation Form GSTR-9C</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Entity *</label>
                {clients.length > 0 ? (
                  <select
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:outline-none font-medium"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.pan})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:outline-none focus:border-red-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Key Certified Financial Figures</label>
                <input
                  type="text"
                  placeholder="e.g. Turnover: ₹12.5 Cr | Net Worth: ₹4.8 Cr"
                  value={newFigures}
                  onChange={(e) => setNewFigures(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">18-Digit UDIN (if already generated)</label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="Leave blank if pending generation"
                  value={newUdinCode}
                  onChange={(e) => setNewUdinCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:outline-none focus:border-red-500 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-btred-logo hover:bg-red-700 text-white font-black rounded-xl shadow-sm transition"
                >
                  Save &amp; Start Clock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
