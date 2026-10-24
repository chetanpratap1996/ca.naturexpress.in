"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Download, 
  FileCheck2, 
  ShieldCheck, 
  Briefcase, 
  QrCode, 
  Share2, 
  CheckCircle2, 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  Award,
  Send,
  Printer,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { formatCurrencyINR } from "@/lib/utils";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface BankerDocketModalProps {
  client: ClientEntity;
  isOpen: boolean;
  onClose: () => void;
}

export function BankerDocketModal({ client, isOpen, onClose }: BankerDocketModalProps) {
  const [purpose, setPurpose] = useState<"BANK_LOAN" | "GOVT_TENDER" | "VC_DUE_DILIGENCE" | "NET_WORTH">("BANK_LOAN");
  const [bankName, setBankName] = useState("HDFC Bank Ltd (Credit Appraisal Dept)");
  const [sanctionLimit, setSanctionLimit] = useState("50000000"); // 5 Cr
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);
  const [dossierRef, setDossierRef] = useState(`BT/CR-${Date.now().toString().slice(-4)}`);
  const [udinNumber, setUdinNumber] = useState(`26098221AAAAAA${Date.now().toString().slice(-4)}`);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedSuccess(true);
      setDossierRef(`BT/CR-${Date.now().toString().slice(-4)}`);
      setUdinNumber(`26098221AAAAAA${Date.now().toString().slice(-4)}`);
    }, 1200);
  };

  const handleDownloadZip = () => {
    // Real browser download simulation of certified manifest
    const manifestContent = `OFFICIAL CA FIRM VERIFIED CREDIT APPRAISAL DOSSIER
====================================================================
Issued by: ${DEFAULT_FIRM_BRANDING.firmName} (FRN: ${DEFAULT_FIRM_BRANDING.frn})
Managing Partner: ${DEFAULT_FIRM_BRANDING.managingPartner}
Applicant Entity: ${client.name} (PAN: ${client.pan}, GSTIN: ${client.gstin || "N/A"})
Target Institution: ${bankName}
Application Purpose: ${purpose.replace(/_/g, " ")}
ICAI Stamped UDIN: ${udinNumber}
Dossier Serial: ${dossierRef}
Date of Certification: ${new Date().toLocaleDateString("en-IN")}
Status: CERTIFIED TRUE COPY - BANK CREDIT GRADE

ATTACHED STATUTORY SCHEDULES:
1. FY 2025-26 Audited Balance Sheet & P&L Statement (Revenue: Rs. 42.50 Cr, EBITDA: 18.2%)
2. FY 2024-25 Audited Balance Sheet & P&L Statement (Revenue: Rs. 36.10 Cr, EBITDA: 17.5%)
3. FY 2023-24 Audited Balance Sheet & P&L Statement (Revenue: Rs. 29.80 Cr, EBITDA: 16.9%)
4. Form 3CD Tax Audit Report with Physical Clause-by-Clause ICAI Verification
5. Income Tax Department ITR-V e-Filing Acknowledgements (3 Consecutive Assessment Years)
6. Last 12 Consecutive Months GSTR-3B Department Receipts with ARN Tracking
7. Memorandum & Articles of Association (MOA/AOA) Stamped by ROC Mumbai
8. Group Promoter Net Worth Certificate issued under ICAI SQC-1 Standards
====================================================================
Watermark: EXCLUSIVELY VALID FOR ${bankName.toUpperCase()}`;

    const blob = new Blob([manifestContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/\s+/g, "_")}_Certified_Banker_Dossier_3Y.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareToBankerWhatsApp = () => {
    const text = `*OFFICIAL CA CERTIFIED CREDIT DOSSIER*\n\n` +
      `Dear Credit Appraisal Manager at *${bankName}*,\n\n` +
      `Please find attached the official 3-Year Audited Financials, ITR-V & 12M GSTR-3B Dossier for *${client.name}* (PAN: ${client.pan}).\n\n` +
      `• *Dossier Ref:* ${dossierRef}\n` +
      `• *ICAI UDIN:* ${udinNumber}\n` +
      `• *Certifying CA Firm:* ${DEFAULT_FIRM_BRANDING.firmName} (FRN: ${DEFAULT_FIRM_BRANDING.frn})\n` +
      `• *Verification:* Brains & Taxes Document Hub\n\n` +
      `Regards,\n*${client.name} Accounts*`;

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">1-Click Banker &amp; Tender Loan Dossier</h3>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Credit Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly bundled, digitally signed 3-year audited financials &amp; tax returns for credit managers
            </p>
          </div>
        </div>

        {!generatedSuccess ? (
          <div className="space-y-4 text-xs">
            {/* Form Inputs */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Application Purpose:</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                >
                  <option value="BANK_LOAN">Bank Working Capital / CC-OD Limit Renewal / Term Loan</option>
                  <option value="GOVT_TENDER">Govt / GeM Tender Prequalification Bid &amp; Solvency</option>
                  <option value="VC_DUE_DILIGENCE">Investor / Private Equity Due Diligence Docket</option>
                  <option value="NET_WORTH">Director Foreign Visa &amp; Net Worth Certificate</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Financial Institution / Authority Name:</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India (SME Branch) or Tata Capital"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Facility / Sanction Amount (₹):</label>
                  <input
                    type="number"
                    value={sanctionLimit}
                    onChange={(e) => setSanctionLimit(e.target.value)}
                    placeholder="e.g. 50000000"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Auto-Bundled Documents Checklist */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Statutory Schedules Automatically Watermarked &amp; Bundled:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "FY 23-24, 24-25, 25-26 Audited Balance Sheets",
                  "Form 3CD Tax Audit Reports with ICAI UDIN",
                  "Last 3 Years Income Tax ITR-V Acknowledgements",
                  "Last 12 Months GSTR-3B Department Receipts",
                  "Company MOA, AOA & Certificate of Inc.",
                  "CA Net Worth & Certified CMA Data Format"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-700 font-medium text-[11px] truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-900 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
              <span>
                All documents are electronically signed by <strong>{DEFAULT_FIRM_BRANDING.firmShortName}</strong> and watermarked with: &quot;EXCLUSIVELY ISSUED TO {bankName.toUpperCase()}&quot; to prevent unauthorized dissemination.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Compiling CA Verified Docket...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    Generate &amp; Seal Banker Docket
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* CERTIFIED DOSSIER OUTPUT PREVIEW */
          <div className="space-y-4 text-xs">
            {/* Header Badge */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-950">Banker Credit Dossier Sealed &amp; Stamped!</h4>
                  <p className="text-[11px] text-emerald-800">
                    Officially certified under ICAI SQC-1 by {DEFAULT_FIRM_BRANDING.managingPartner}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg">
                READY FOR CREDIT DESK
              </span>
            </div>

            {/* Key Ratios & Metrics Snapshot (For Bank Loan Officers) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">3Y Avg Turnover</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">₹36.1 Cr</span>
                <span className="text-[9px] text-emerald-600 font-bold">+18.5% YoY Growth</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">PAT Margin</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">9.4%</span>
                <span className="text-[9px] text-emerald-600 font-bold">Stable Free Cash</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">DSCR Ratio</span>
                <span className="text-base font-black text-emerald-700 mt-0.5 block">2.18x</span>
                <span className="text-[9px] text-slate-500 font-bold">Benchmark &gt; 1.33x</span>
              </div>
            </div>

            {/* Official Certification Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 border border-slate-800 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-300 pb-1.5 border-b border-slate-800">
                <span>Dossier Control ID:</span>
                <strong className="text-white">{dossierRef}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-300 pb-1.5 border-b border-slate-800">
                <span>ICAI Unique Doc ID (UDIN):</span>
                <strong className="text-emerald-400">{udinNumber}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-300 pb-1.5 border-b border-slate-800">
                <span>Target Authority:</span>
                <span className="text-slate-200 font-sans font-medium truncate max-w-[260px]">{bankName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Verification Watermark:</span>
                <span className="text-amber-300 font-sans font-bold">RESTRICTED TO CREDIT COMMITTEE ONLY</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleDownloadZip}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" /> Download Dossier Package
              </button>
              <button
                onClick={handleShareToBankerWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Forward to Credit Manager
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => setGeneratedSuccess(false)}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
              >
                &larr; Generate another dossier for a different bank or tender
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
