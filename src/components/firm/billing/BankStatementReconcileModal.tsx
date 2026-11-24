"use client";

import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Check, 
  ArrowRight,
  TrendingDown,
  Building2,
  RefreshCw,
  QrCode
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { BankReconciliationReport } from "@/lib/billing/bankReceiptReconciler";

interface BankStatementReconcileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReconciliationComplete?: (report: BankReconciliationReport) => void;
}

export const BankStatementReconcileModal: React.FC<BankStatementReconcileModalProps> = ({
  isOpen,
  onClose,
  onReconciliationComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedCsv, setPastedCsv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<BankReconciliationReport | null>(null);
  const [activeTab, setActiveTab] = useState<"UPLOAD" | "SAMPLE_PRESETS" | "PASTE">("UPLOAD");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Realistic Indian Bank Statement Presets
  const samplePresets = [
    {
      id: "icici_current",
      bankName: "ICICI Bank — Smart Business Current A/c",
      description: "Direct client UPI and NEFT settlements for Pratwi Solutions Private Limited",
      csv: `Transaction Date,Value Date,Cheque Number,Transaction Remarks,Withdrawal Amount (INR ),Deposit Amount (INR ),Balance (INR )
24/10/2026,24/10/2026,,UPI/412389123012/DR/Pratwi Solutions/ICIC/GPA-2026-27-089,,118000.00,529500.00
25/10/2026,25/10/2026,,NEFT-N10293847561-PRATWI SOLUTIONS-FEE INV 090,,76700.00,594500.00
26/10/2026,26/10/2026,,IMPS/429182019283/DR/Pratwi Solutions/SBIN/INV-091,,59000.00,644500.00`
    },
    {
      id: "hdfc_corporate",
      bankName: "HDFC Bank — Corporate CA Retainer A/c",
      description: "NEFT & RTGS bulk client settlements for statutory audit fees",
      csv: `Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
24/10/2026,NEFT CR-HDFCN26102938475-PRATWI SOLUTIONS-INV GPA 2026 27 092,HDFCN26102938475,24/10/2026,,41300.00,835000.00
25/10/2026,RTGS CR-AXIR2026102500129-BHARAT AGRO-GPA/2026-27/093,AXIR2026102500129,25/10/2026,,97350.00,917500.00`
    },
    {
      id: "sbi_current",
      bankName: "State Bank of India — Current Account",
      description: "UPI receipts from corporate directors and SME clients",
      csv: `Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
24/10/2026,24/10/2026,TRANSFER FROM 501002391029 UPI/CR/519283746501/PRATWI SOLUTIONS/SBIN/FEE-AUDIT,,0.00,45000.00,345000.00
25/10/2026,25/10/2026,UPI/CR/519283746502/KAPOOR TEXTILE/BARB/TAX CONSULT,,0.00,25000.00,370000.00`
    }
  ];

  const handleProcessCsv = async (fileOrCsv: File | string) => {
    setIsProcessing(true);
    try {
      let res;
      if (typeof fileOrCsv === "string") {
        res = await fetch("/api/billing/reconcile-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            csvContent: fileOrCsv,
            autoApply: true,
            actorName: "CA Gunjan Jain (Partner)"
          })
        });
      } else {
        const formData = new FormData();
        formData.append("file", fileOrCsv);
        formData.append("autoApply", "true");
        formData.append("actorName", "CA Gunjan Jain (Partner)");
        res = await fetch("/api/billing/reconcile-bank", {
          method: "POST",
          body: formData
        });
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Reconciliation failed");
      }

      setReport(data.report);
      toast.success(
        "Bank Reconciliation Executed",
        `Cleared ${data.clearedCount} invoice(s) totalling ${formatCurrencyINR(data.realizedInr)}. Saved ${formatCurrencyINR(data.gatewayFeesSavedInr)} in gateway commissions.`
      );

      if (onReconciliationComplete) {
        onReconciliationComplete(data.report);
      }

      // Notify parent / window to refresh data
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bt_autopilot_sweep_completed"));
      }
    } catch (err: any) {
      toast.error("Reconciliation Error", err.message || "Failed to process bank statement");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    handleProcessCsv(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col font-sans animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Autonomous Bank Statement Reconciler
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  0% Gateway Fee
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Upload your firm&apos;s bank statement (ICICI, HDFC, SBI, Axis, Kotak CSV) to auto-clear outstanding fee bills via UTR matching.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        {!report && (
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveTab("UPLOAD")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "UPLOAD"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" /> Upload Statement (PDF / CSV)
            </button>
            <button
              onClick={() => setActiveTab("SAMPLE_PRESETS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "SAMPLE_PRESETS"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Bank Presets (ICICI/HDFC/SBI)
            </button>
            <button
              onClick={() => setActiveTab("PASTE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "PASTE"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Paste Raw CSV
            </button>
          </div>
        )}

        {/* Tab Content */}
        {!report && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {activeTab === "UPLOAD" && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">
                    Drop your Bank Statement CSV here, or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports ICICI, HDFC, SBI, Axis, Kotak, PNB, and standard NetBanking exports
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    .CSV
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    .TXT
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    .TSV
                  </span>
                </div>
              </div>
            )}

            {activeTab === "SAMPLE_PRESETS" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  Test autonomous reconciliation with real bank statement lines from leading Indian banks:
                </p>
                {samplePresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {preset.bankName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{preset.description}</p>
                    </div>
                    <button
                      onClick={() => handleProcessCsv(preset.csv)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition shrink-0 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Matching...
                        </>
                      ) : (
                        <>
                          Reconcile Now <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "PASTE" && (
              <div className="space-y-3">
                <textarea
                  value={pastedCsv}
                  onChange={(e) => setPastedCsv(e.target.value)}
                  placeholder="Paste bank statement rows here (Date, Narration, Credit, Ref)..."
                  rows={6}
                  className="w-full text-xs font-mono p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  onClick={() => handleProcessCsv(pastedCsv)}
                  disabled={!pastedCsv.trim() || isProcessing}
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                >
                  {isProcessing ? "Reconciling..." : "Process Pasted Bank Records"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Screen */}
        {report && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full inline-block mb-1">
                  Reconciliation Complete
                </span>
                <h4 className="text-sm font-black text-emerald-950">
                  {report.reconciledInvoices.length} Invoices Auto-Cleared &amp; Stamped
                </h4>
                <p className="text-xs text-emerald-900/80 mt-0.5">
                  Total Fee Realized: <strong className="text-emerald-950">{formatCurrencyINR(report.totalRealizedInr)}</strong> &bull; Bank Credits: {report.totalCreditsProcessed}
                </p>
              </div>

              <div className="bg-white border border-emerald-300 rounded-xl p-3 text-right shadow-xs shrink-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Gateway Fee Saved</div>
                <div className="text-base font-black text-emerald-700">
                  {formatCurrencyINR(report.totalGatewayFeesSavedInr)}
                </div>
                <div className="text-[10px] text-slate-500">2.36% (2% + GST) vs Razorpay</div>
              </div>
            </div>

            {/* Reconciled List */}
            <div className="space-y-2">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Cleared Statutory Invoices
              </h5>
              {report.reconciledInvoices.map((inv) => (
                <div
                  key={inv.invoiceId}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900">{inv.invoiceNo}</span>
                      <span className="px-2 py-0.2 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                        {inv.confidenceScore}% Match
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 mt-0.5">{inv.entityName}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      UTR: {inv.utrNumber} &bull; Mode: {inv.paymentMode} &bull; Date: {inv.settlementDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-700 block">
                      {formatCurrencyINR(inv.matchedAmount)}
                    </span>
                    {inv.isTdsDeducted && (
                      <span className="text-[10px] text-amber-700 font-semibold block">
                        (Net of 10% TDS: {formatCurrencyINR(inv.tdsAmount)})
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">Auto-Stamped</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Unmatched if any */}
            {report.unmatchedCredits.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <h5 className="text-xs font-black text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Unmatched Bank Credits ({report.unmatchedCredits.length})
                </h5>
                {report.unmatchedCredits.map((un, idx) => (
                  <div
                    key={idx}
                    className="bg-amber-50/50 border border-amber-200 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="truncate pr-2">
                      <p className="font-mono text-[11px] text-slate-800 truncate">{un.narration}</p>
                      <p className="text-[10px] text-amber-800 mt-0.5">{un.possibleReason}</p>
                    </div>
                    <span className="font-black text-slate-900 shrink-0">
                      {formatCurrencyINR(un.creditAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setReport(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Upload Another Statement
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Done &amp; View Ledger
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
