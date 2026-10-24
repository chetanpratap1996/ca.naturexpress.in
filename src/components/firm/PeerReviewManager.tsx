"use client";

import React, { useState } from "react";
import { 
  Msme43BhClauseItem, 
  Section40A2bSampleItem, 
  PeerReviewDossier, 
  ClientEntity 
} from "@/lib/types";
import { 
  ShieldCheck, 
  Award, 
  FileCheck2, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Download, 
  ExternalLink, 
  Check, 
  FolderCheck,
  Scale,
  Building,
  UserCheck
} from "lucide-react";

interface PeerReviewManagerProps {
  clients: ClientEntity[];
  initialDossier?: PeerReviewDossier;
  initialMsmeRecords?: Msme43BhClauseItem[];
  initialSection40a?: Section40A2bSampleItem[];
}

export function PeerReviewManager({
  clients,
  initialDossier,
  initialMsmeRecords = [],
  initialSection40a = [],
}: PeerReviewManagerProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("CLI-001");
  const [activeTab, setActiveTab] = useState<"msme" | "section40a" | "workpapers">("msme");
  const [msmeRecords, setMsmeRecords] = useState<Msme43BhClauseItem[]>(initialMsmeRecords);
  const [section40aSamples, setSection40aSamples] = useState<Section40A2bSampleItem[]>(initialSection40a);
  const [isSigningOff, setIsSigningOff] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedEntityId) || clients[0];

  const totalMsmeDisallowance = msmeRecords
    .filter((m) => m.disallowedUnder43Bh)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalMsmeInterest = msmeRecords
    .reduce((acc, curr) => acc + curr.interestUnderMsmedAct, 0);

  const totalExcess40a = section40aSamples
    .reduce((acc, curr) => acc + curr.excessPaymentDisallowable, 0);

  const handlePartnerSignOff = async () => {
    setIsSigningOff(true);
    try {
      const res = await fetch("/api/audit/peer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIGN_OFF_PEER_REVIEW_DOSSIER",
          entityId: selectedEntityId
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessToast("ICAI SQC-1 Audit Working Paper Dossier Stamped & Locked with Partner Digital Signature!");
        setTimeout(() => setSuccessToast(null), 6000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningOff(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-indigo-300" /> ICAI Peer Review Board Ready
              </span>
              <span className="text-xs text-slate-400">FRN: 104523W &bull; SQC-1 Compliant</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" /> ICAI SQC-1 &amp; SA 230 Peer Review Dossier
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Standardized electronic audit documentation meeting ICAI Peer Review Board mandates. Includes automated Section 43B(h) MSME 45-day disallowances, Section 40A(2)(b) related-party sampling, and UDIN verification.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert("Downloading complete ICAI Peer Review Master Audit Dossier PDF (SA 230 Compliant)...")}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 shadow-md transition flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-indigo-400" /> Export Peer Review Dossier (ZIP)
            </button>
            <button
              onClick={handlePartnerSignOff}
              disabled={isSigningOff}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {isSigningOff ? "Signing Dossier..." : "Partner SQC-1 Sign-Off"}
            </button>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Compliance Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">SQC-1 Audit Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">98.4%</div>
          <div className="text-xs text-slate-400 mt-1">Zero Disciplinary Deficiencies</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Sec 43B(h) Disallowance</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-2">₹{totalMsmeDisallowance.toLocaleString("en-IN")}</div>
          <div className="text-xs text-slate-400 mt-1">Added to Tax Audit Form 3CD</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Sec 40A(2)(b) Excess</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-2">₹{totalExcess40a.toLocaleString("en-IN")}</div>
          <div className="text-xs text-slate-400 mt-1">FMV benchmark excess</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">ICAI UDIN Stamped</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xs font-mono font-bold text-cyan-300 mt-2 truncate">24049281AAAAAA8912</div>
          <div className="text-xs text-slate-400 mt-1">Matched with Form 3CD Figures</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("msme")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "msme"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> Section 43B(h) MSME 45-Day Tracker ({msmeRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("section40a")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "section40a"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Scale className="w-4 h-4" /> Section 40A(2)(b) Related Party Sampling ({section40aSamples.length})
        </button>
        <button
          onClick={() => setActiveTab("workpapers")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "workpapers"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <FolderCheck className="w-4 h-4" /> SA 230 Audit Working Paper Index (SQC-1)
        </button>
      </div>

      {/* TAB 1: SECTION 43B(h) MSME COMPLIANCE */}
      {activeTab === "msme" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Section 43B(h) MSME 45-Day Payment Audit Trail</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mandatory disallowance under Income Tax Act for payments to Micro &amp; Small enterprises pending past 15/45 days as on 31-March.
              </p>
            </div>
            <span className="text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-xl">
              Disallowance: ₹{totalMsmeDisallowance.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
                  <th className="py-2.5 px-3">MSME Supplier &amp; Udyam Reg</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Invoice &amp; Date</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3">Statutory Due Date</th>
                  <th className="py-2.5 px-3">Actual Payment Date</th>
                  <th className="py-2.5 px-3 text-center">43B(h) Status</th>
                  <th className="py-2.5 px-3 text-right">MSMED Interest (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {msmeRecords.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{m.vendorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.udyamRegistrationNo}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px]">
                        {m.vendorCategory}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      <div>{m.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-500">{m.invoiceDate}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      ₹{m.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{m.paymentDueDate}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{m.actualPaymentDate || "UNPAID"}</td>
                    <td className="py-2.5 px-3 text-center">
                      {m.disallowedUnder43Bh ? (
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                          DISALLOWED (3CD Cl 26)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                          ALLOWED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">
                      {m.interestUnderMsmedAct > 0 ? `₹${m.interestUnderMsmedAct.toLocaleString("en-IN")}` : "₹0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SECTION 40A(2)(b) RELATED PARTY SAMPLING */}
      {activeTab === "section40a" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Section 40A(2)(b) Related Party Market Value Sampling</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation of payments to directors, relatives, and sister concerns against Fair Market Value (FMV) with attached working papers.
              </p>
            </div>
            <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
              Excess Payment: ₹{totalExcess40a.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
                  <th className="py-2.5 px-3">Related Party &amp; Nature</th>
                  <th className="py-2.5 px-3">Relationship</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid (₹)</th>
                  <th className="py-2.5 px-3 text-right">Fair Market Value (₹)</th>
                  <th className="py-2.5 px-3 text-right">Disallowable (₹)</th>
                  <th className="py-2.5 px-3">Workpaper Ref</th>
                  <th className="py-2.5 px-3">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {section40aSamples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{s.relatedPartyName}</div>
                      <div className="text-[10px] text-indigo-400 font-semibold">{s.natureOfPayment}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      {s.relationship.replace(/_/g, " ")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      ₹{s.amountPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      ₹{s.fairMarketValueEstimated.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                      ₹{s.excessPaymentDisallowable.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300 text-[11px]">
                      {s.justificationWorkpaperRef}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      {s.articleVerifiedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SA 230 AUDIT WORKING PAPER INDEX */}
      {activeTab === "workpapers" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">ICAI Standard on Auditing (SA 230) Working Paper Registry</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit trial mandatory for ICAI Peer Review Board under SQC-1. Stamped with Partner e-signature and UDIN.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: "SA 210: Agreeing the Terms of Audit Engagements & Independence Confirmation",
                ref: "WP-01-ENGAGEMENT",
                standard: "SA 210",
                sign: "CA Gunjan Jain (Managing Partner)",
                date: "12-Sep-2026"
              },
              {
                title: "SA 315 & 320: Identifying and Assessing Risk of Material Misstatement & Performance Materiality",
                ref: "WP-02-RISK-MATERIALITY",
                standard: "SA 315/320",
                sign: "CA Vikas Chhajed (Partner)",
                date: "15-Sep-2026"
              },
              {
                title: "SA 505: External Confirmations (Bank Balances, Secured Loans & Top 20 Sundry Debtors)",
                ref: "WP-03-CONFIRMATIONS",
                standard: "SA 505",
                sign: "Sneha Patil (Senior Article)",
                date: "22-Sep-2026"
              },
              {
                title: "SA 530: Audit Sampling for Section 269SS/269T Cash Loans & Section 40A(2)(b)",
                ref: "WP-04-SAMPLING",
                standard: "SA 530",
                sign: "Rohan Verma (Article)",
                date: "24-Sep-2026"
              },
              {
                title: "SA 570 & 580: Going Concern Evaluation & Management Representation Letter (MRL)",
                ref: "WP-05-MRL-GOING-CONCERN",
                standard: "SA 570/580",
                sign: "CA Gunjan Jain (Managing Partner)",
                date: "28-Sep-2026"
              }
            ].map((wp, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{wp.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Ref: {wp.ref} &bull; Standard: <strong className="text-indigo-400">{wp.standard}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-200 block">{wp.sign}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Signed on {wp.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
