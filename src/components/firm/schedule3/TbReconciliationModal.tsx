"use client";

import React, { useState } from "react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { 
  Calculator, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Check, 
  X, 
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  Building2,
  RefreshCw
} from "lucide-react";
import { MappedTbLedger } from "@/lib/parsers/tallyTbParser";
import { getSchedule3HeadById } from "@/lib/config/schedule3Taxonomy";

interface TbReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDebit: number;
  totalCredit: number;
  varianceAmount: number;
  ledgers: MappedTbLedger[];
  onApplyAdjustment: (newLedgers: MappedTbLedger[], reason: string) => void;
  clientName: string;
}

export const TbReconciliationModal: React.FC<TbReconciliationModalProps> = ({
  isOpen,
  onClose,
  totalDebit,
  totalCredit,
  varianceAmount,
  ledgers,
  onApplyAdjustment,
  clientName
}) => {
  const [selectedMethod, setSelectedMethod] = useState<"CLOSING_STOCK" | "RECTIFICATION_ENTRY" | "SUSPENSE">("CLOSING_STOCK");
  
  // Custom Rectification Form State
  const [customLedgerName, setCustomLedgerName] = useState("Auditor Inventory & WIP Adjustment");
  const [customAmount, setCustomAmount] = useState<number>(varianceAmount);
  const [customBalanceType, setCustomBalanceType] = useState<"DR" | "CR">(totalDebit > totalCredit ? "CR" : "DR");
  const [customTargetHeadId, setCustomTargetHeadId] = useState<string>("inventories");
  const [auditNote, setAuditNote] = useState("Incorporated physical inventory valuation as per AS-2 / IndAS-2 stock sheets.");

  if (!isOpen) return null;

  const isDebitHeavy = totalDebit > totalCredit;

  // 1-Click Closing Stock Double Entry Adjustment
  const handleAutoAdjustClosingStock = () => {
    const invHead = getSchedule3HeadById("inventories");
    const changeInInvHead = getSchedule3HeadById("changes_in_inventories");

    if (!invHead) return;

    // Create balanced adjustment
    const updated = [...ledgers];

    if (isDebitHeavy) {
      // Need a Credit to balance: Credit Change in Inventories in P&L
      const newLedger: MappedTbLedger = {
        id: `ADJ-INV-${Date.now()}`,
        ledgerName: "Change in Inventories (Audit Closing Stock Accrual)",
        tallyParent: "Direct Expenses",
        closingBalance: varianceAmount,
        balanceType: "CR",
        mappedHeadId: changeInInvHead?.id || "changes_in_inventories",
        mappedHeadTitle: changeInInvHead?.title || "Changes in Inventories",
        statement: "PROFIT_AND_LOSS",
        noteNumber: 23,
        confidence: 100,
        mappingMethod: "USER_OVERRIDE",
        anomalies: [],
        isUserModified: true
      };
      updated.push(newLedger);
    } else {
      // Need a Debit to balance: Debit Inventories in Balance Sheet
      const newLedger: MappedTbLedger = {
        id: `ADJ-INV-${Date.now()}`,
        ledgerName: "Closing Stock of Raw Materials & Finished Goods (AS-2 Valuation)",
        tallyParent: "Stock-in-hand",
        closingBalance: varianceAmount,
        balanceType: "DR",
        mappedHeadId: invHead.id,
        mappedHeadTitle: invHead.title,
        statement: "BALANCE_SHEET",
        noteNumber: 16,
        confidence: 100,
        mappingMethod: "USER_OVERRIDE",
        anomalies: [],
        isUserModified: true
      };
      updated.push(newLedger);
    }

    onApplyAdjustment(updated, `Auto-reconciled Trial Balance variance of ${formatCurrencyINR(varianceAmount)} via Closing Stock adjustment.`);
    toast.success("Trial Balance Balanced", `Applied double-entry inventory adjustment. TB variance is now ₹0.00.`);
    onClose();
  };

  // Custom Rectification Entry
  const handleApplyCustomRectification = () => {
    if (!customAmount || customAmount <= 0) {
      toast.error("Invalid Amount", "Please specify a valid positive adjustment amount.");
      return;
    }

    const targetHead = getSchedule3HeadById(customTargetHeadId) || getSchedule3HeadById("other_expenses");
    if (!targetHead) return;

    const newLedger: MappedTbLedger = {
      id: `RECT-AUDIT-${Date.now()}`,
      ledgerName: customLedgerName,
      tallyParent: "Auditor Adjusting Journal",
      closingBalance: customAmount,
      balanceType: customBalanceType,
      mappedHeadId: targetHead.id,
      mappedHeadTitle: targetHead.title,
      statement: targetHead.statement,
      noteNumber: targetHead.noteNumber,
      confidence: 100,
      mappingMethod: "USER_OVERRIDE",
      anomalies: [`Audit Rectification: ${auditNote}`],
      isUserModified: true
    };

    const updated = [...ledgers, newLedger];
    onApplyAdjustment(updated, `Auditor Adjusting Entry: ${customLedgerName} for ${formatCurrencyINR(customAmount)} (${customBalanceType})`);
    toast.success("Adjustment Posted", `Posted adjusting entry to "${targetHead.title}".`);
    onClose();
  };

  // Allocate to Suspense Account (Temporary Audit Qualification)
  const handleAllocateToSuspense = () => {
    const targetStatement = isDebitHeavy ? "BALANCE_SHEET" : "BALANCE_SHEET";
    const targetHead = isDebitHeavy 
      ? (getSchedule3HeadById("other_current_liabilities") || getSchedule3HeadById("share_capital"))
      : (getSchedule3HeadById("other_current_assets") || getSchedule3HeadById("cash_and_cash_equivalents"));

    const newLedger: MappedTbLedger = {
      id: `SUSPENSE-${Date.now()}`,
      ledgerName: "Difference in Trial Balance (Unreconciled Suspense A/c)",
      tallyParent: "Suspense Account",
      closingBalance: varianceAmount,
      balanceType: isDebitHeavy ? "CR" : "DR",
      mappedHeadId: targetHead?.id || "other_current_liabilities",
      mappedHeadTitle: targetHead?.title || "Other Current Liabilities",
      statement: targetStatement,
      noteNumber: 9,
      confidence: 100,
      mappingMethod: "USER_OVERRIDE",
      anomalies: ["CRITICAL: Unreconciled Trial Balance difference placed in Suspense. Requires qualification in Independent Auditor Report under CARO 2020."],
      isUserModified: true
    };

    const updated = [...ledgers, newLedger];
    onApplyAdjustment(updated, `Allocated ${formatCurrencyINR(varianceAmount)} to Suspense Account.`);
    toast.warning("Allocated to Suspense", `TB balanced via Suspense. This creates a statutory audit qualification.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Trial Balance Balancing &amp; Rectification Desk</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                  Variance Detected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Auditor diagnostic tools to eliminate Trial Balance discrepancies under ICAI SA 330 &amp; SA 450.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variance Diagnostic Card */}
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Mathematical Discrepancy Diagnostics ({clientName})
            </span>
            <span className="text-sm font-black text-rose-700 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200">
              Difference: {formatCurrencyINR(varianceAmount)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="bg-white p-2 rounded-xl border border-rose-100">
              <span className="text-[10px] text-slate-500 block">Total Debits (Dr)</span>
              <strong className="text-slate-900 text-sm">{formatCurrencyINR(totalDebit)}</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-rose-100">
              <span className="text-[10px] text-slate-500 block">Total Credits (Cr)</span>
              <strong className="text-slate-900 text-sm">{formatCurrencyINR(totalCredit)}</strong>
            </div>
            <div className="bg-white p-2 rounded-xl border border-rose-100">
              <span className="text-[10px] text-slate-500 block">Imbalance Side</span>
              <strong className="text-rose-700 text-sm">
                {isDebitHeavy ? `Need Credit (+${formatCurrencyINR(varianceAmount)})` : `Need Debit (+${formatCurrencyINR(varianceAmount)})`}
              </strong>
            </div>
          </div>

          <p className="text-[11px] text-rose-800 leading-relaxed pt-1">
            <strong>CA Audit Finding:</strong> In Tally ERP exports, the primary cause of an out-of-balance Trial Balance is <strong>Closing Stock omission</strong> (inventories valued in Stock Summary without ledger double-entry).
          </p>
        </div>

        {/* Resolution Options */}
        <div className="space-y-3 flex-1 overflow-auto pr-1">
          <span className="text-xs font-bold text-slate-700 block">Select Statutory Rectification Strategy:</span>

          {/* OPTION 1: CLOSING STOCK ADJUSTMENT */}
          <div 
            onClick={() => setSelectedMethod("CLOSING_STOCK")}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
              selectedMethod === "CLOSING_STOCK" ? "border-emerald-600 bg-emerald-50/40" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  1-Click Auto-Incorporate Closing Stock Double Entry (Recommended)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                AS-2 / IndAS-2
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically creates a balancing entry of <strong>{formatCurrencyINR(varianceAmount)}</strong> to 
              {isDebitHeavy ? ' "Change in Inventories" under P&L Expenses (Note 23)' : ' "Closing Inventories" under Current Assets (Note 16)'}.
              This brings the Trial Balance to a perfect mathematical zero (₹0.00 variance).
            </p>
          </div>

          {/* OPTION 2: AUDITOR RECTIFYING ENTRY */}
          <div 
            onClick={() => setSelectedMethod("RECTIFICATION_ENTRY")}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
              selectedMethod === "RECTIFICATION_ENTRY" ? "border-btred-logo bg-red-50/40" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-btred-logo" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Post Custom Auditor Rectification Journal Entry
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                SA 330
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Specify a custom ledger name, amount, and Schedule III target line item to correct specific bookkeeper omissions (e.g. unposted depreciation, GST reversal, or director loan adjustment).
            </p>

            {selectedMethod === "RECTIFICATION_ENTRY" && (
              <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ledger Name</label>
                    <input
                      type="text"
                      value={customLedgerName}
                      onChange={(e) => setCustomLedgerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Balance Type</label>
                    <select
                      value={customBalanceType}
                      onChange={(e) => setCustomBalanceType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-xs"
                    >
                      <option value="CR">Credit (CR) - Needed to offset Dr excess</option>
                      <option value="DR">Debit (DR) - Needed to offset Cr excess</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Schedule III Head</label>
                    <select
                      value={customTargetHeadId}
                      onChange={(e) => setCustomTargetHeadId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 text-xs"
                    >
                      <option value="inventories">[BS] Inventories (Note 16)</option>
                      <option value="changes_in_inventories">[PL] Changes in Inventories (Note 23)</option>
                      <option value="reserves_and_surplus">[BS] Reserves and Surplus (Note 2)</option>
                      <option value="other_expenses">[PL] Other Expenses (Note 27)</option>
                      <option value="other_current_liabilities">[BS] Other Current Liabilities (Note 9)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* OPTION 3: SUSPENSE ACCOUNT */}
          <div 
            onClick={() => setSelectedMethod("SUSPENSE")}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
              selectedMethod === "SUSPENSE" ? "border-amber-600 bg-amber-50/40" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Park Variance in Suspense Account (Audit Qualification)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                CARO 2020 Target
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Parks the unresolved {formatCurrencyINR(varianceAmount)} difference in a "Difference in Trial Balance (Suspense)" ledger. This allows financial statement compilation but flags a mandatory qualification in the Independent Auditor's Report under CARO 2020.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>

          {selectedMethod === "CLOSING_STOCK" && (
            <button
              onClick={handleAutoAdjustClosingStock}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Auto-Closing Stock &amp; Balance TB</span>
            </button>
          )}

          {selectedMethod === "RECTIFICATION_ENTRY" && (
            <button
              onClick={handleApplyCustomRectification}
              className="px-5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Post Rectification Entry</span>
            </button>
          )}

          {selectedMethod === "SUSPENSE" && (
            <button
              onClick={handleAllocateToSuspense}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Park in Suspense &amp; Continue</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
