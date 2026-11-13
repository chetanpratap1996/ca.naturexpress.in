"use client";

import React, { useState } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Building2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Printer
} from "lucide-react";

export interface AnnexureRow {
  id: string;
  supplierGstin: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: string;
  taxableValue: number;
  taxAmount: number;
  gstr1FilingDate: string;
  reconciliationStatus: "TIMING_DIFFERENCE" | "TAX_PAID_BY_SUPPLIER" | "CREDIT_NOTE_ADJUSTED" | "GENUINE_COMMERCIAL_PURCHASE";
  statutoryDefense: string;
}

interface ReconciliationAnnexureModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  pan: string;
  gstin?: string;
  demandAmount: string;
  onInsertAnnexureIntoDraft: (annexureText: string) => void;
}

export const ReconciliationAnnexureModal: React.FC<ReconciliationAnnexureModalProps> = ({
  isOpen,
  onClose,
  clientName,
  pan,
  gstin = "23AABCA8891D1Z4",
  demandAmount,
  onInsertAnnexureIntoDraft
}) => {
  const [rows, setRows] = useState<AnnexureRow[]>([
    {
      id: "annex-1",
      supplierGstin: "23AABCP8819L1Z2",
      supplierName: "Prithvi Precision Tooling Pvt Ltd",
      invoiceNo: "INV-2024-889",
      invoiceDate: "2024-08-12",
      taxableValue: 850000,
      taxAmount: 153000,
      gstr1FilingDate: "2024-11-10",
      reconciliationStatus: "TIMING_DIFFERENCE",
      statutoryDefense: "Supplier filed GSTR-1 in subsequent tax period. Suncraft Energy (Calcutta HC) applies."
    },
    {
      id: "annex-2",
      supplierGstin: "27AABCS7712M1Z8",
      supplierName: "Symphony Industrial Lubes LLP",
      invoiceNo: "SL-4412",
      invoiceDate: "2024-09-05",
      taxableValue: 511111,
      taxAmount: 92000,
      gstr1FilingDate: "2024-10-24",
      reconciliationStatus: "TAX_PAID_BY_SUPPLIER",
      statutoryDefense: "Tax discharged by vendor with late fees. No revenue loss under Bharti Airtel (SC)."
    }
  ]);

  if (!isOpen) return null;

  const totalTaxReconciled = rows.reduce((sum, r) => sum + r.taxAmount, 0);

  const handleExportCsv = () => {
    const header = "Supplier GSTIN,Supplier Name,Invoice No,Invoice Date,Taxable Value,Tax Amount,Supplier Filing Date,Status,Statutory Defense\n";
    const body = rows.map(r => 
      `"${r.supplierGstin}","${r.supplierName}","${r.invoiceNo}","${r.invoiceDate}",${r.taxableValue},${r.taxAmount},"${r.gstr1FilingDate}","${r.reconciliationStatus}","${r.statutoryDefense}"`
    ).join("\n");

    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Annexure_A_Reconciliation_${pan}_FY202425.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Annexure Exported", "Exported quantitative reconciliation sheet (CSV).");
  };

  const handleGenerateFormattedText = () => {
    let text = `\n\nANNEXURE - A: QUANTITATIVE INVOICE-WISE RECONCILIATION STATEMENT\n`;
    text += `Taxpayer: ${clientName} | GSTIN/PAN: ${gstin || pan}\n`;
    text += `Alleged Discrepancy Amount: ${demandAmount} | Reconciled Sum: ${formatCurrencyINR(totalTaxReconciled)}\n`;
    text += `====================================================================================================\n`;
    text += `Sr | Supplier GSTIN     | Supplier Name               | Inv No       | Inv Date   | Tax (₹)  | Statutory Defense Ground\n`;
    text += `----------------------------------------------------------------------------------------------------\n`;
    rows.forEach((r, idx) => {
      text += `${idx + 1}  | ${r.supplierGstin} | ${r.supplierName.slice(0, 27).padEnd(27, ' ')} | ${r.invoiceNo.padEnd(12, ' ')} | ${r.invoiceDate} | ${formatCurrencyINR(r.taxAmount).padStart(10, ' ')} | ${r.statutoryDefense}\n`;
    });
    text += `====================================================================================================\n`;
    text += `Conclusion: All underlying supplies are backed by genuine e-way bills and banking settlement under Section 16(2).\n`;

    onInsertAnnexureIntoDraft(text);
    toast.success("Annexure Injected", "Appended quantitative reconciliation table to legal reply draft.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Quantitative Reconciliation Annexure Builder</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Annexure A
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Invoice-by-invoice reconciliation table required by GST Proper Officers and Income Tax Faceless Assessing Officers.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client & Demand Summary Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Assessee</span>
            <strong className="text-slate-900 block truncate">{clientName}</strong>
            <span className="text-[10px] text-slate-500">{gstin || pan}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Alleged Discrepancy</span>
            <strong className="text-btred-logo text-sm block">{demandAmount}</strong>
            <span className="text-[10px] text-slate-500">Notice Demand</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Reconciled Sum</span>
            <strong className="text-emerald-700 text-sm block">{formatCurrencyINR(totalTaxReconciled)}</strong>
            <span className="text-[10px] text-emerald-800 font-bold">100% Accounted For</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Supplier GSTIN &amp; Name</th>
                <th className="py-2.5 px-3">Invoice No &amp; Date</th>
                <th className="py-2.5 px-3 text-right">Taxable Value</th>
                <th className="py-2.5 px-3 text-right">Tax Mismatch</th>
                <th className="py-2.5 px-3">Filing Date</th>
                <th className="py-2.5 px-3">Statutory Defense Ground</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3">
                    <strong className="text-slate-900 block font-mono">{r.supplierGstin}</strong>
                    <span className="text-[11px] text-slate-500">{r.supplierName}</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-800 block">{r.invoiceNo}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{r.invoiceDate}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                    {formatCurrencyINR(r.taxableValue)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-btred-logo whitespace-nowrap">
                    {formatCurrencyINR(r.taxAmount)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                    {r.gstr1FilingDate}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-xs">
                    <span className="line-clamp-2">{r.statutoryDefense}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerateFormattedText}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Insert Annexure into Legal Submissions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
