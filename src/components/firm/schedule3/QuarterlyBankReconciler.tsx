"use client";

import React, { useState } from "react";
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Copy, 
  Sparkles, 
  Check, 
  Layers,
  ArrowRight
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSoftClick, playSuccessChime } from "@/lib/audio/soundEffects";
import { QuarterlyBankStockReconciliation, Schedule3ComplianceEngine } from "@/lib/schedule3/schedule3ComplianceEngine";

interface QuarterlyBankReconcilerProps {
  client: {
    id: string;
    name: string;
    pan: string;
    cin?: string;
  };
}

export const QuarterlyBankReconciler: React.FC<QuarterlyBankReconcilerProps> = ({ client }) => {
  const [reconciliations, setReconciliations] = useState<QuarterlyBankStockReconciliation[]>(() => {
    return Schedule3ComplianceEngine.getDefaultDossier().bankStockReconciliations;
  });

  const [isCopied, setIsCopied] = useState(false);

  const handleCopySchedule = () => {
    playSoftClick();
    const rows = reconciliations.map(r => 
      `${r.quarter} (${r.quarterEnd}) | Bank: ${r.bankName} | Limit: ₹${(r.sanctionedLimitInr/10000000).toFixed(2)} Cr | Book Stock: ₹${(r.bookStockInr/100000).toFixed(2)} L | Bank Return Stock: ₹${(r.bankReturnStockInr/100000).toFixed(2)} L | Stock Var: ₹${(r.stockVarianceInr/100000).toFixed(2)} L | Book Debtors: ₹${(r.bookDebtorsInr/100000).toFixed(2)} L | Bank Debtors: ₹${(r.bankReturnDebtorsInr/100000).toFixed(2)} L | Remarks: ${r.reconciliationRemarks}`
    ).join("\n");

    navigator.clipboard.writeText(`SCHEDULE III & CARO 2020 CLAUSE (ii)(b) - QUARTERLY BANK STATEMENT RECONCILIATION\nClient: ${client.name}\n\n${rows}`);
    setIsCopied(true);
    toast.success("Quarterly bank reconciliation schedule copied");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 border-2 border-red-500 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                CARO 2020 Cl (ii)(b) &amp; Schedule III
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sanction Limit &gt; ₹5.00 Crore
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Quarterly Bank Statements vs Books of Account Reconciliation
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Mandatory reconciliation of stock and book-debts statements filed with banks/financial institutions against general ledger balances. Discrepancies exceeding 10% or material variances must be qualified in the audit report.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopySchedule}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {isCopied ? "Copied" : "Copy Schedule"}
            </button>
          </div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Quarterly Reconciled Positions (FY 2025-26)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            HDFC Bank Consortium • Working Capital Limit: ₹12.50 Cr
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase font-semibold text-[11px] text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Quarter</th>
                <th className="py-3 px-4">Lending Bank</th>
                <th className="py-3 px-4 text-right">Book Stock</th>
                <th className="py-3 px-4 text-right">Bank Return Stock</th>
                <th className="py-3 px-4 text-right">Stock Variance</th>
                <th className="py-3 px-4 text-right">Book Debtors</th>
                <th className="py-3 px-4 text-right">Bank Return Debtors</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Auditor / Reconciliation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reconciliations.map((row) => (
                <tr key={row.quarter} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.quarter} <span className="font-normal text-[11px] text-slate-400">({row.quarterEnd})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.bankName}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrencyINR(row.bookStockInr)}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrencyINR(row.bankReturnStockInr)}</td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${row.stockVarianceInr === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    {row.stockVarianceInr === 0 ? "Nil" : formatCurrencyINR(row.stockVarianceInr)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrencyINR(row.bookDebtorsInr)}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrencyINR(row.bankReturnDebtorsInr)}</td>
                  <td className="py-3 px-4 text-center">
                    {row.isMaterialVariance ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                        Discrepancy
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Agreed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-600 italic">
                    {row.reconciliationRemarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
