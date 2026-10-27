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
  FileCheck
} from "lucide-react";
import { ClientEntity } from "@/lib/types";

export interface UdinEntry {
  id: string;
  udin: string; // 18-digit unique code: e.g. 24514289BTA0192841
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
}

const DEFAULT_REALISTIC_UDIN_DATA: UdinEntry[] = [
  {
    id: "udin-1",
    udin: "24514289BTA0192841",
    documentTitle: "Tax Audit Report u/s 44AB in Form 3CB/3CD for FY 2024-25",
    documentType: "TAX_AUDIT_3CD",
    clientName: "Tata Steel Limited",
    clientPan: "AAACT2727Q",
    signingDate: "2026-09-28",
    generatedDate: "2026-09-29",
    financialFigures: "Turnover: ₹48.20 Cr | Total Disallowances: ₹3.65 Lakh",
    partnerName: "CA Sahil Jain",
    membershipNo: "514289",
    status: "GENERATED_VALID",
    daysRemainingForGeneration: 60
  },
  {
    id: "udin-2",
    udin: "24514289BTA0881923",
    documentTitle: "Independent Statutory Auditor's Report under Companies Act 2013",
    documentType: "STATUTORY_AUDIT",
    clientName: "Cloudbyte Technologies Pvt Ltd",
    clientPan: "AABCC9941H",
    signingDate: "2026-10-02",
    generatedDate: "2026-10-03",
    financialFigures: "Total Assets: ₹18.5 Cr | Net Profit: ₹2.1 Cr",
    partnerName: "CA Sahil Jain",
    membershipNo: "514289",
    status: "GENERATED_VALID",
    daysRemainingForGeneration: 60
  },
  {
    id: "udin-3",
    udin: "PENDING_GENERATION",
    documentTitle: "Banker Net Worth Certificate for Working Capital Loan Enhancement",
    documentType: "NET_WORTH_CERTIFICATE",
    clientName: "Jindal Infra Projects Pvt Ltd",
    clientPan: "AAACJ5512E",
    signingDate: "2026-10-18",
    financialFigures: "Net Worth: ₹14.80 Cr as on 30-Sep-2026",
    partnerName: "CA Sahil Jain",
    membershipNo: "514289",
    status: "EXPIRING_SOON",
    daysRemainingForGeneration: 11 // 11 days remaining out of 60 days
  },
  {
    id: "udin-4",
    udin: "PENDING_GENERATION",
    documentTitle: "GST Annual Return Certification Form GSTR-9C",
    documentType: "GST_RECON_9C",
    clientName: "Radisson Blu Hospitality LLP",
    clientPan: "AAGCR4421L",
    signingDate: "2026-10-22",
    financialFigures: "Taxable Turnover: ₹8.4 Cr | ITC Claimed: ₹42.1 Lakh",
    partnerName: "CA Sahil Jain",
    membershipNo: "514289",
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
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State for logging a new signed document
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState(clients[0]?.name || "Client Entity");
  const [newType, setNewType] = useState<UdinEntry["documentType"]>("TAX_AUDIT_3CD");
  const [newFigures, setNewFigures] = useState("");
  const [newUdinCode, setNewUdinCode] = useState("");

  const handleCopyUdin = (id: string, udinCode: string) => {
    navigator.clipboard.writeText(udinCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRec: UdinEntry = {
      id: `udin-${Date.now()}`,
      udin: newUdinCode.trim() || "PENDING_GENERATION",
      documentTitle: newTitle,
      documentType: newType,
      clientName: newClient,
      clientPan: "PAN123456F",
      signingDate: new Date().toISOString().split("T")[0],
      generatedDate: newUdinCode.trim() ? new Date().toISOString().split("T")[0] : undefined,
      financialFigures: newFigures || "Audited Figures Documented",
      partnerName: "CA Sahil Jain",
      membershipNo: "514289",
      status: newUdinCode.trim() ? "GENERATED_VALID" : "PENDING_GENERATION",
      daysRemainingForGeneration: 60
    };

    setEntries(prev => [newRec, ...prev]);
    setIsAddOpen(false);
    setNewTitle("");
    setNewFigures("");
    setNewUdinCode("");
  };

  const filtered = entries.filter(e => {
    const matchesFilter = 
      filterType === "ALL" ||
      (filterType === "PENDING" && (e.status === "PENDING_GENERATION" || e.status === "EXPIRING_SOON")) ||
      (filterType === "VALID" && e.status === "GENERATED_VALID");

    const matchesSearch = 
      e.documentTitle.toLowerCase().includes(search.toLowerCase()) ||
      e.clientName.toLowerCase().includes(search.toLowerCase()) ||
      e.udin.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = entries.filter(e => e.status === "PENDING_GENERATION" || e.status === "EXPIRING_SOON").length;
  const validCount = entries.filter(e => e.status === "GENERATED_VALID").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-700/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" /> Mandatory ICAI Council Directive
              </span>
              <span className="text-xs text-slate-400 font-mono">18-Digit UDIN 60-Day Countdown Vault</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-purple-400" /> UDIN Compliance &amp; Regulatory Vault
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Prevent professional misconduct proceedings under Clause 1 of Part II of Second Schedule. Tracks every signed certificate, audit report and 3CD with real-time 60-day expiry countdowns and direct ICAI verification links.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Signed Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Valid Active UDINs</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{validCount} Verified</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Linked to Tax Audit &amp; ROC returns</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Pending Generation (Countdown)</div>
          <div className={`text-2xl font-black mt-1 ${pendingCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {pendingCount} Reports Pending
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Signed documents awaiting 18-digit code from icai.org</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Statutory Window</div>
          <div className="text-2xl font-black text-white mt-1">60 Calendar Days</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Permitted latency from date of signing certificate</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "ALL", label: `All Reports (${entries.length})` },
            { id: "PENDING", label: `Pending / Expiring (${pendingCount})` },
            { id: "VALID", label: `Valid UDINs (${validCount})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterType === f.id ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
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
            className="w-full sm:w-64 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* UDIN Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Document Title &amp; Client</th>
                <th className="py-3 px-4">18-Digit UDIN</th>
                <th className="py-3 px-4">Signing Date</th>
                <th className="py-3 px-4">60-Day Status / Countdown</th>
                <th className="py-3 px-4">Key Financial Figures Certified</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-white">{item.documentTitle}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-purple-400" /> {item.clientName} ({item.clientPan})
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.udin !== "PENDING_GENERATION" ? (
                      <div className="flex items-center gap-1.5 font-mono text-purple-300 font-bold bg-purple-950/60 px-2 py-1 rounded border border-purple-800/40">
                        <span>{item.udin}</span>
                        <button
                          onClick={() => handleCopyUdin(item.id, item.udin)}
                          className="text-slate-400 hover:text-white transition"
                          title="Copy UDIN"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                        PENDING GENERATION
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono">
                    {item.signingDate}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.status === "GENERATED_VALID" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Validated on Portal
                      </span>
                    ) : item.status === "EXPIRING_SOON" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                        <Clock className="w-3 h-3 text-rose-400" /> Only {item.daysRemainingForGeneration} Days Left!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3 text-amber-400" /> {item.daysRemainingForGeneration} Days Remaining
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-300 max-w-xs truncate">
                    {item.financialFigures}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href="https://udin.icai.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1 border border-slate-700"
                    >
                      <span>udin.icai.org</span>
                      <ExternalLink className="w-3 h-3 text-purple-400" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Logging a Signed Document */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-400" /> Log Signed Certificate / Audit Report
            </h3>
            <p className="text-xs text-slate-400">
              Starts the mandatory 60-day ICAI UDIN generation clock from the date of physical or digital signing.
            </p>

            <form onSubmit={handleCreateEntry} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Net Worth Certificate for SBI Loan"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Client Entity</label>
                <input
                  type="text"
                  placeholder="Client Name"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Key Certified Financial Figures</label>
                <input
                  type="text"
                  placeholder="e.g. Turnover: ₹12.5 Cr | Net Worth: ₹4.8 Cr"
                  value={newFigures}
                  onChange={(e) => setNewFigures(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">18-Digit UDIN (if already generated)</label>
                <input
                  type="text"
                  placeholder="Leave blank if pending generation"
                  value={newUdinCode}
                  onChange={(e) => setNewUdinCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow"
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
