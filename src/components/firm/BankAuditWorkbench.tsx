'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  FileCheck2, 
  Calculator, 
  AlertTriangle, 
  TrendingDown, 
  Sparkles, 
  Printer, 
  Layers, 
  CheckCircle2, 
  Search,
  DollarSign
} from 'lucide-react';
import { 
  BankAdvanceAccount, 
  DrawingPowerComputation, 
  SAMPLE_BANK_ADVANCES, 
  SAMPLE_DP_COMPUTATION, 
  IracNpaEngine,
  AssetClassification 
} from '@/lib/bankAudit/iracNpaEngine';
import { toast } from '@/components/shared/ToastNotification';

export function BankAuditWorkbench() {
  const [activeTab, setActiveTab] = useState<'IRAC_MOC' | 'DRAWING_POWER' | 'LFAR_QUESTIONNAIRE'>('IRAC_MOC');
  const [advances, setAdvances] = useState<BankAdvanceAccount[]>(SAMPLE_BANK_ADVANCES);
  const [dpData, setDpData] = useState<DrawingPowerComputation>(SAMPLE_DP_COMPUTATION);
  const [selectedMocAccount, setSelectedMocAccount] = useState<BankAdvanceAccount | null>(SAMPLE_BANK_ADVANCES[0]);

  // Telemetry Calculations
  const totalAdvances = advances.reduce((sum, a) => sum + a.outstandingBalance, 0);
  const npaAccounts = advances.filter(a => ['SUB_STANDARD', 'DOUBTFUL_1', 'DOUBTFUL_2', 'DOUBTFUL_3', 'LOSS'].includes(a.recommendedClassification));
  const totalNpa = npaAccounts.reduce((sum, a) => sum + a.outstandingBalance, 0);
  const totalMocProvision = advances.reduce((sum, a) => sum + a.differentialProvisionMoc, 0);

  const handlePrintMoc = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border border-blue-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Statutory Bank Branch Audit Suite (RBI Mandate)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              RBI IRAC Norms, NPA Provisioning & Drawing Power Sentinel
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Auto-detects 90-day NPAs and stale stock statements. Computes required provisioning, drafts <strong>Memorandum of Changes (MOC)</strong>, verifies working capital Drawing Power (DP), and populates RBI LFAR packs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handlePrintMoc}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official MOC Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Total Audited Advances
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">
              ₹{(totalAdvances / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-xs font-mono text-slate-400">({advances.length} Borrowers)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cash Credit & Term Loans</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Detected NPA Exposure
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-400">
              ₹{(totalNpa / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-xs font-mono text-rose-400 font-bold">
              {((totalNpa / totalAdvances) * 100).toFixed(1)}% GNPA
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Downgrades &amp; Overdues &gt; 90d</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Total MOC P&L Impact
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-400">
              ₹{(totalMocProvision / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">Debit P&L</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Short Provisioning in Branch</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Drawing Power Deficit
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-orange-400">
              ₹{(dpData.excessDrawings / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-orange-300 font-bold">Penal 2%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Outstanding &gt; Drawing Power</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('IRAC_MOC')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'IRAC_MOC'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>IRAC Classification & MOC Generator ({advances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DRAWING_POWER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'DRAWING_POWER'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          <span>Drawing Power (DP) & Stock Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('LFAR_QUESTIONNAIRE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'LFAR_QUESTIONNAIRE'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>RBI LFAR Master Questionnaire</span>
        </button>
      </div>

      {/* TAB 1: IRAC Classification & MOC Generator */}
      {activeTab === 'IRAC_MOC' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts List (Left) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              Advance Accounts Scrutiny
            </h3>

            <div className="space-y-2">
              {advances.map(acc => (
                <div
                  key={acc.accountNumber}
                  onClick={() => setSelectedMocAccount(acc)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedMocAccount?.accountNumber === acc.accountNumber
                      ? 'bg-blue-950/40 border-blue-500/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{acc.borrowerName}</h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">A/c: {acc.accountNumber}</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      acc.recommendedClassification === 'STANDARD' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {acc.recommendedClassification}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Overdue: {acc.daysOverdue} Days</span>
                    <span className="font-mono font-semibold text-rose-400">
                      MOC: +₹{(acc.differentialProvisionMoc / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MOC Workpaper & Classification Details (Right 2 cols) */}
          {selectedMocAccount && (
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-white">{selectedMocAccount.borrowerName}</h3>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedMocAccount.facilityType}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Account: {selectedMocAccount.accountNumber} • Sanction Limit: ₹{(selectedMocAccount.sanctionedLimit / 10000000).toFixed(2)} Cr
                  </p>
                </div>

                {selectedMocAccount.isMocRequired && (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    MOC Required
                  </span>
                )}
              </div>

              {/* Classification Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Branch Books (Pre-Audit)
                  </span>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Classification:</span>
                      <span className="font-bold text-slate-200">{selectedMocAccount.currentClassification}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Branch Provision:</span>
                      <span className="font-mono font-bold text-slate-300">₹{selectedMocAccount.branchProvision.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Stock Statement:</span>
                      <span className={selectedMocAccount.isStockStatementStale ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {selectedMocAccount.stockStatementDate || 'Not on Record'} {selectedMocAccount.isStockStatementStale && '(>3M STALE)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 space-y-2">
                  <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block font-bold">
                    Statutory Auditor Recommended (Post-Audit)
                  </span>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Classification:</span>
                      <span className="font-bold text-rose-300">{selectedMocAccount.recommendedClassification}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Statutory Provision:</span>
                      <span className="font-mono font-bold text-rose-400">₹{selectedMocAccount.statutoryRequiredProvision.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-rose-500/20">
                      <span className="text-slate-300 font-bold">MOC Debit to P&L:</span>
                      <span className="font-mono font-black text-rose-300 text-sm">
                        +₹{selectedMocAccount.differentialProvisionMoc.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auditor Notes & Regulatory Justification */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Auditor Findings & Mandatory MOC Annexure
                </span>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {selectedMocAccount.notes.map((note, i) => (
                    <li key={i} className="leading-relaxed">{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Drawing Power (DP) & Stock Calculator */}
      {activeTab === 'DRAWING_POWER' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Working Capital Drawing Power (DP) Audit Calculator</span>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                  Tandon Formula
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Borrower: <strong>{dpData.borrowerName}</strong> | Account: {dpData.accountNumber} | Statement As On: {dpData.statementDate}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Sanctioned Limit</span>
              <span className="text-lg font-black text-white font-mono">
                ₹{(dpData.sanctionedLimit / 10000000).toFixed(2)} Cr
              </span>
            </div>
          </div>

          {/* Two-Column Calculation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-mono">
            {/* Stock Valuation */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-sans border-b border-slate-800 pb-2">
                Part A: Paid Stock Valuation
              </h4>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Raw Materials:</span>
                  <span>₹{dpData.rawMaterial.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Work In Progress (WIP):</span>
                  <span>₹{dpData.workInProgress.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Finished Goods:</span>
                  <span>₹{dpData.finishedGoods.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Gross Stock Total:</span>
                  <span className="font-bold text-white">₹{dpData.grossStock.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Less: Creditors for Purchases:</span>
                  <span>(₹{dpData.sundryCreditorsForPurchases.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Less: Obsolete / Non-Moving:</span>
                  <span>(₹{dpData.obsoleteOrNonMovingStock.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-bold">
                  <span>Net Eligible Paid Stock:</span>
                  <span>₹{dpData.netEligibleStock.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-cyan-300 pt-1 border-t border-cyan-800/40 font-bold">
                  <span>Eligible Stock DP (Less {dpData.stockMarginPercent}% Margin):</span>
                  <span className="text-sm">₹{dpData.eligibleStockForDp.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Debtors / Receivables */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-sans border-b border-slate-800 pb-2">
                Part B: Book Debts / Receivables Valuation
              </h4>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Total Sundry Debtors:</span>
                  <span>₹{dpData.totalDebtors.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Less: Ineligible Debtors (&gt; 90 Days):</span>
                  <span>(₹{dpData.debtorsOver90Days.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-bold">
                  <span>Eligible Debtors (Within 90 Days):</span>
                  <span>₹{dpData.debtorsWithin90Days.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-cyan-300 pt-1 border-t border-cyan-800/40 font-bold">
                  <span>Eligible Debtors DP (Less {dpData.debtorsMarginPercent}% Margin):</span>
                  <span className="text-sm">₹{dpData.eligibleDebtorsForDp.toLocaleString('en-IN')}</span>
                </div>

                {/* Final DP Summary Box */}
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 mt-4 space-y-1.5">
                  <div className="flex justify-between text-white font-bold">
                    <span>Total Calculated DP (Stock + Debtors):</span>
                    <span>₹{dpData.totalCalculatedDrawingPower.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-cyan-300 font-bold">
                    <span>Effective DP Allowed:</span>
                    <span className="text-sm">₹{dpData.effectiveDrawingPower.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Actual Bank Outstanding:</span>
                    <span>₹{dpData.currentOutstanding.toLocaleString('en-IN')}</span>
                  </div>
                  {dpData.isOverdrawn && (
                    <div className="flex justify-between text-rose-400 font-bold pt-1 border-t border-rose-500/30">
                      <span>Excess Drawing (Overdrawn):</span>
                      <span>₹{dpData.excessDrawings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBI LFAR Questionnaire */}
      {activeTab === 'LFAR_QUESTIONNAIRE' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Long Form Audit Report (LFAR) - Branch Audit Questions
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">
                1. (Advances) Does the branch obtain quarterly / monthly stock statements within prescribed time limit?
              </span>
              <p className="text-slate-400">
                <span className="text-rose-400 font-bold">[Adverse Observation]</span> In 2 out of 10 sampled CC accounts, stock statements were found to be more than 3 months overdue. Account of M/s Malwa Agro was improperly maintained in Standard category. Mandatory MOC passed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">
                2. (Advances) Are Drawing Powers calculated strictly after deducting unpaid stock (creditors) and ineligible debtors?
              </span>
              <p className="text-slate-400">
                <span className="text-rose-400 font-bold">[Adverse Observation]</span> In 1 account (Khandelwal Steel & Tube Mills), branch failed to deduct Sundry Creditors of ₹45 Lakhs, leading to inflated Drawing Power and overdrawing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold text-white block">
                3. (Cash) Was physical cash verified by auditors on 31st March / date of commencement?
              </span>
              <p className="text-slate-400">
                <span className="text-emerald-400 font-bold">[Satisfactory]</span> Physical cash was counted and matched exactly with clean general ledger balance of ₹14,28,450 as of 31st March closing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
