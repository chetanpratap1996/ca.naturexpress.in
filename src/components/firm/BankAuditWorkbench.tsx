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
  DollarSign,
  Activity,
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  KeyRound,
  FileText,
  TrendingUp,
  Percent,
  Download
} from 'lucide-react';
import { 
  BankAdvanceAccount, 
  DrawingPowerComputation, 
  SAMPLE_BANK_ADVANCES, 
  SAMPLE_DP_COMPUTATION, 
  IracNpaEngine,
  AssetClassification 
} from '@/lib/bankAudit/iracNpaEngine';
import { 
  LfarMasterEngine, 
  LfarQuestionItem, 
  LfarAuditPackSummary 
} from '@/lib/bankAudit/lfarMasterEngine';
import { 
  ConcurrentAuditEngine, 
  SAMPLE_HIGH_VALUE_TRANSACTIONS, 
  SAMPLE_CASH_RETENTION_RECORDS, 
  SAMPLE_LOCKER_AUDIT_RECORDS,
  HighValueTransactionItem,
  CashRetentionAuditItem,
  LockerOperationAuditItem
} from '@/lib/bankAudit/concurrentAuditEngine';
import { 
  GhoshJilaniEwsEngine, 
  GhoshJilaniControlItem, 
  EarlyWarningSignalItem 
} from '@/lib/bankAudit/ghoshJilaniEwsEngine';
import { 
  RevenueLeakageEngine, 
  SAMPLE_PRICING_AUDIT_DATA, 
  LoanPricingAuditItem 
} from '@/lib/bankAudit/revenueLeakageEngine';
import { toast } from '@/components/shared/ToastNotification';

export function BankAuditWorkbench() {
  const [activeTab, setActiveTab] = useState<
    'IRAC_MOC' | 'DRAWING_POWER' | 'LFAR_MASTER' | 'CONCURRENT_AUDIT' | 'GHOSH_JILANI_EWS' | 'REVENUE_LEAKAGE'
  >('IRAC_MOC');

  // Sub-Engine States
  const [advances, setAdvances] = useState<BankAdvanceAccount[]>(SAMPLE_BANK_ADVANCES);
  const [dpData, setDpData] = useState<DrawingPowerComputation>(SAMPLE_DP_COMPUTATION);
  const [selectedMocAccount, setSelectedMocAccount] = useState<BankAdvanceAccount | null>(SAMPLE_BANK_ADVANCES[0]);
  
  // LFAR State
  const [lfarQuestions, setLfarQuestions] = useState<LfarQuestionItem[]>(LfarMasterEngine.getMandatedLfarQuestions());
  const [lfarCategoryFilter, setLfarCategoryFilter] = useState<string>('ALL');

  // Concurrent State
  const [highValueTxns, setHighValueTxns] = useState<HighValueTransactionItem[]>(SAMPLE_HIGH_VALUE_TRANSACTIONS);
  const [cashRetention, setCashRetention] = useState<CashRetentionAuditItem[]>(SAMPLE_CASH_RETENTION_RECORDS);
  const [lockerRecords, setLockerRecords] = useState<LockerOperationAuditItem[]>(SAMPLE_LOCKER_AUDIT_RECORDS);

  // Ghosh / Jilani / EWS State
  const [ghoshJilaniItems, setGhoshJilaniItems] = useState<GhoshJilaniControlItem[]>(GhoshJilaniEwsEngine.getGhoshJilaniChecklist());
  const [ewsItems, setEwsItems] = useState<EarlyWarningSignalItem[]>(GhoshJilaniEwsEngine.scanEarlyWarningSignals());

  // Revenue Leakage State
  const [pricingAuditRecords, setPricingAuditRecords] = useState<LoanPricingAuditItem[]>(SAMPLE_PRICING_AUDIT_DATA);

  // Telemetry Calculations
  const totalAdvances = advances.reduce((sum, a) => sum + a.outstandingBalance, 0);
  const npaAccounts = advances.filter(a => ['SUB_STANDARD', 'DOUBTFUL_1', 'DOUBTFUL_2', 'DOUBTFUL_3', 'LOSS'].includes(a.recommendedClassification));
  const totalNpa = npaAccounts.reduce((sum, a) => sum + a.outstandingBalance, 0);
  const totalMocProvision = advances.reduce((sum, a) => sum + a.differentialProvisionMoc, 0);

  const lfarSummary: LfarAuditPackSummary = LfarMasterEngine.summarizeLfar(lfarQuestions, {
    branchName: 'Indore Main Commercial Branch (0319)',
    branchCode: 'BOI-0319',
    bankName: 'Bank of India',
    financialYear: '2026-27'
  });

  const concurrentSummary = ConcurrentAuditEngine.auditHighValueTransactions(highValueTxns);
  const cashSummary = ConcurrentAuditEngine.auditCashRetention(cashRetention);
  const leakageSummary = RevenueLeakageEngine.summarizeLeakage(pricingAuditRecords);

  const handlePrintMoc = () => {
    window.print();
  };

  const handleUpdateLfarStatus = (id: string, status: LfarQuestionItem['status']) => {
    setLfarQuestions(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    toast.success('LFAR observation updated');
  };

  const handleGenerateRecoveryNotice = (accountNumber: string) => {
    toast.success(`Statutory Recovery Notice drafted for A/c ${accountNumber}. Revenue recovery logged in MOC Annexure.`);
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
              <span>Pillar IV: Statutory Bank Audit, Concurrent &amp; Stock Audit Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              RBI IRAC Norms, LFAR Master Pack &amp; Revenue Leakage Sentinel
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Automates Statutory Bank Branch Audits, Concurrent Audits, and Stock Audits. Covers <strong>90-day IRAC NPAs</strong>, <strong>Drawing Power calculations</strong>, <strong>RBI 2020 LFAR checklists</strong>, <strong>Ghosh &amp; Jilani fraud EWS</strong>, and <strong>MCLR/EBLR revenue leakages</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handlePrintMoc}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official MOC &amp; LFAR Pack</span>
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
          <p className="text-[11px] text-slate-500 mt-1">Cash Credit &amp; Term Loans</p>
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
            Total MOC P&amp;L Impact
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-400">
              ₹{(totalMocProvision / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">Debit P&amp;L</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Additional Required Provision</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Detected Revenue Leakage
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">
              ₹{(leakageSummary.totalLeakageAmount / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-emerald-300 font-bold">Recoverable</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Interest Undercharge &amp; 2% Penal</p>
        </div>
      </div>

      {/* 6 Institutional Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('IRAC_MOC')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'IRAC_MOC'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>1. IRAC &amp; MOC Generator ({advances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DRAWING_POWER')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'DRAWING_POWER'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          <span>2. Drawing Power &amp; Stock Sentinel</span>
        </button>

        <button
          onClick={() => setActiveTab('LFAR_MASTER')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'LFAR_MASTER'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>3. LFAR Master Pack (RBI 2020)</span>
        </button>

        <button
          onClick={() => setActiveTab('CONCURRENT_AUDIT')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'CONCURRENT_AUDIT'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span>4. Concurrent Audit Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('GHOSH_JILANI_EWS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'GHOSH_JILANI_EWS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          <span>5. Ghosh / Jilani &amp; 42 EWS</span>
        </button>

        <button
          onClick={() => setActiveTab('REVENUE_LEAKAGE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'REVENUE_LEAKAGE'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-emerald-400" />
          <span>6. Revenue Leakage Inspector</span>
        </button>
      </div>

      {/* TAB 1: IRAC Classification & MOC Generator */}
      {activeTab === 'IRAC_MOC' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts List (Left) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              Audited Advance Accounts ({advances.length})
            </h3>

            <div className="space-y-2">
              {advances.map((acc) => (
                <div
                  key={acc.accountNumber}
                  onClick={() => setSelectedMocAccount(acc)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                    selectedMocAccount?.accountNumber === acc.accountNumber
                      ? 'bg-blue-950/40 border-cyan-500/50 shadow-md'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[180px]">
                      {acc.borrowerName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        acc.recommendedClassification === 'STANDARD'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : acc.recommendedClassification.startsWith('SMA')
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {acc.recommendedClassification}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>O/S: ₹{(acc.outstandingBalance / 100000).toFixed(2)}L</span>
                    <span className={acc.daysOverdue > 90 ? 'text-rose-400 font-bold' : ''}>
                      {acc.daysOverdue} Days O/D
                    </span>
                  </div>

                  {acc.isMocRequired && (
                    <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 pt-1 border-t border-slate-800/60">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>MOC Required: +₹{(acc.differentialProvisionMoc / 100000).toFixed(2)}L</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account Detail & MOC Voucher (Right 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedMocAccount ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>{selectedMocAccount.borrowerName}</span>
                      <span className="text-xs font-mono text-cyan-400 font-normal">
                        ({selectedMocAccount.facilityType})
                      </span>
                    </h2>
                    <span className="text-xs font-mono text-slate-400">
                      A/c: {selectedMocAccount.accountNumber}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Status:</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-200">
                      Branch: {selectedMocAccount.currentClassification}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Audit: {selectedMocAccount.recommendedClassification}
                    </span>
                  </div>
                </div>

                {/* Audit Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Sanctioned Limit</span>
                    <span className="text-sm font-bold text-white">₹{(selectedMocAccount.sanctionedLimit / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Current Outstanding</span>
                    <span className="text-sm font-bold text-white">₹{(selectedMocAccount.outstandingBalance / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Drawing Power</span>
                    <span className="text-sm font-bold text-cyan-400">₹{(selectedMocAccount.drawingPower / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Days Overdue</span>
                    <span className={`text-sm font-bold ${selectedMocAccount.daysOverdue > 90 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {selectedMocAccount.daysOverdue} Days
                    </span>
                  </div>
                </div>

                {/* Auditor Observations */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Statutory Auditor Findings &amp; IRAC Classification Basis
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                    {selectedMocAccount.notes.map((note, idx) => (
                      <p key={idx} className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{note}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Memorandum of Changes (MOC) Box */}
                {selectedMocAccount.isMocRequired ? (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                          Formal Memorandum of Changes (MOC) Passed
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400">
                        ICAI SA-700 Bank Audit Format
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1 p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Accounting Entry (Debit P&amp;L)</span>
                        <p className="font-bold text-rose-300">Dr. Provision for NPA (Advances):</p>
                        <p className="text-sm font-mono font-bold text-white">
                          ₹{selectedMocAccount.differentialProvisionMoc.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          (Branch Prov: ₹{selectedMocAccount.branchProvision.toLocaleString('en-IN')} vs Required: ₹{selectedMocAccount.statutoryRequiredProvision.toLocaleString('en-IN')})
                        </span>
                      </div>

                      <div className="space-y-1 p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Balance Sheet Impact</span>
                        <p className="font-bold text-amber-300">Cr. Reserve for Bad &amp; Doubtful Debts:</p>
                        <p className="text-sm font-mono font-bold text-white">
                          ₹{selectedMocAccount.differentialProvisionMoc.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          Asset downgraded from Standard to {selectedMocAccount.recommendedClassification}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center space-x-3 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No Memorandum of Changes (MOC) required. Branch provisioning is fully compliant with RBI IRAC norms.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
                Select an account from the left list to review asset classification and MOC impact.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Drawing Power & Stock Sentinel */}
      {activeTab === 'DRAWING_POWER' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Working Capital Drawing Power (DP) Audit</span>
                <span className="text-xs font-mono text-cyan-400 font-normal">
                  (Tandon &amp; Nayak Committee MPBF)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Borrower: <strong>{dpData.borrowerName}</strong> | Statement Date: {dpData.statementDate}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Sanctioned Limit:</span>
              <span className="text-xs font-mono font-bold text-white px-2.5 py-1 bg-slate-800 rounded-lg">
                ₹{(dpData.sanctionedLimit / 100000).toFixed(2)} Lakhs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
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
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Stores &amp; Spares (Ineligible):</span>
                  <span>(₹{dpData.storesAndSpares.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-200 pt-1 border-t border-slate-800 font-bold">
                  <span>Gross Eligible Stock:</span>
                  <span className="text-white">₹{dpData.grossStock.toLocaleString('en-IN')}</span>
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
                  {dpData.penalInterestExposure > 0 && (
                    <div className="flex justify-between text-amber-400 text-[11px] pt-1">
                      <span>Penal Interest Exposure (2% p.a.):</span>
                      <span>₹{dpData.penalInterestExposure.toLocaleString('en-IN')}/mo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LFAR Master Pack */}
      {activeTab === 'LFAR_MASTER' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Long Form Audit Report (LFAR) - RBI 2020 Revised Master Format</span>
              </h3>
              <p className="text-xs text-slate-400">
                {lfarSummary.bankName} - {lfarSummary.branchName} | FY: {lfarSummary.financialYear}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">
                Completion: {lfarSummary.completionPercentage}% ({lfarSummary.totalQuestions} Questions)
              </span>
            </div>
          </div>

          {/* LFAR Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {[
              { id: 'ALL', label: 'All Sections' },
              { id: 'ADVANCES_APPRAISAL_SANCTION', label: 'Appraisal & Sanction' },
              { id: 'ADVANCES_DOCUMENTATION', label: 'Documentation' },
              { id: 'ADVANCES_MONITORING_RECOVERY', label: 'Monitoring & Stock' },
              { id: 'ADVANCES_ASSET_CLASSIFICATION', label: 'IRAC & MOC' },
              { id: 'FRAUD_INTERNAL_CONTROLS', label: 'Frauds & Controls' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLfarCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  lfarCategoryFilter === tab.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* LFAR Question Items */}
          <div className="space-y-3">
            {lfarQuestions
              .filter(q => lfarCategoryFilter === 'ALL' || q.category === lfarCategoryFilter)
              .map(q => (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition text-xs space-y-3 ${
                    q.status === 'ADVERSE_QUALIFICATION'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : q.status === 'DEFICIENCY_NOTED'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold text-[10px]">
                        {q.questionNumber}
                      </span>
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {q.questionText}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <select
                        value={q.status}
                        onChange={(e) => handleUpdateLfarStatus(q.id, e.target.value as any)}
                        className={`text-[11px] font-mono font-bold rounded-lg px-2.5 py-1 border bg-slate-900 ${
                          q.status === 'ADVERSE_QUALIFICATION'
                            ? 'text-rose-400 border-rose-500/50'
                            : q.status === 'DEFICIENCY_NOTED'
                            ? 'text-amber-400 border-amber-500/50'
                            : 'text-emerald-400 border-emerald-500/50'
                        }`}
                      >
                        <option value="SATISFACTORY">SATISFACTORY</option>
                        <option value="DEFICIENCY_NOTED">DEFICIENCY NOTED</option>
                        <option value="ADVERSE_QUALIFICATION">ADVERSE QUALIFICATION</option>
                        <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-slate-400 text-[11px] italic">
                    Guidance: {q.guidanceText}
                  </p>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">
                      Statutory Auditor Remarks:
                    </span>
                    <p className="text-slate-200">
                      {q.auditorRemarks}
                    </p>
                  </div>

                  {q.borrowerAccountImpacted && q.borrowerAccountImpacted.length > 0 && (
                    <div className="flex items-center space-x-2 text-[11px] text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Impacted Loan A/c: {q.borrowerAccountImpacted.join(', ')}</span>
                      {q.requiresMoc && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                          MOC PASSED
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: Concurrent Audit Daily / Monthly Tracker */}
      {activeTab === 'CONCURRENT_AUDIT' && (
        <div className="space-y-6">
          {/* High-Value Transactions Audit */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  High-Value Transactions &amp; PMLA Reporting (&gt; ₹10 Lakhs)
                </h3>
                <span className="text-xs text-slate-400">
                  Total Volume Audited: ₹{(concurrentSummary.totalHighValueVolume / 100000).toFixed(2)} Lakhs | CTRs: {concurrentSummary.ctrExposureCount} | STRs: {concurrentSummary.strEscalatedCount}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Txn Date</th>
                    <th className="p-3">Account No &amp; Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3">Narration / Trigger</th>
                    <th className="p-3">PMLA Status</th>
                    <th className="p-3">Audit Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {highValueTxns.map(t => (
                    <tr key={t.id} className="hover:bg-slate-850">
                      <td className="p-3 text-slate-300">{t.transactionDate}</td>
                      <td className="p-3">
                        <span className="text-white font-bold block">{t.accountName}</span>
                        <span className="text-[10px] text-slate-500">{t.accountNumber}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.transactionType.includes('CASH') ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="p-3 text-right text-white font-bold">
                        ₹{t.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={t.purposeOrNarration}>
                        {t.purposeOrNarration}
                      </td>
                      <td className="p-3">
                        {t.isSuspicious ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                            STR TRIGGERED
                          </span>
                        ) : t.isPmlaFlagged ? (
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                            CTR FILED
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">REGULAR</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.auditVerificationStatus === 'VERIFIED_GENUINE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : t.auditVerificationStatus === 'ESCALATED_TO_COMPLIANCE'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {t.auditVerificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cash Retention & Locker Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Cash Retention */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-sans border-b border-slate-800 pb-2">
                Daily Closing Cash vs Branch Retention Limit
              </h4>
              <div className="space-y-2 text-xs font-mono">
                {cashRetention.map(c => (
                  <div key={c.date} className={`p-3 rounded-xl border ${c.isLimitBreached ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-950/50 border-slate-800'}`}>
                    <div className="flex justify-between font-bold text-white mb-1">
                      <span>Date: {c.date}</span>
                      <span className={c.isLimitBreached ? 'text-rose-400' : 'text-emerald-400'}>
                        Closing: ₹{c.closingCashInHand.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Sanctioned Ceiling: ₹{c.sanctionedRetentionLimit.toLocaleString('en-IN')}</span>
                      {c.isLimitBreached && (
                        <span className="text-rose-400 font-bold">Excess: +₹{c.overnightExcess.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{c.remarks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Locker Audit */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-sans border-b border-slate-800 pb-2">
                Locker Operations &amp; Overdue Rent Inspection
              </h4>
              <div className="space-y-2 text-xs font-mono">
                {lockerRecords.map(l => (
                  <div key={l.lockerNumber} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>Locker #{l.lockerNumber} - {l.customerName}</span>
                      <span className={l.isHighRiskInactive ? 'text-rose-400' : 'text-emerald-400'}>
                        {l.daysSinceLastOperation}d Inactive
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Rent Due: ₹{l.totalRentDue.toLocaleString('en-IN')} ({l.rentOverdueYears} yrs)</span>
                      <span>Break-Open Notice: {l.breakOpenNoticeServed ? 'SERVED' : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Ghosh & Jilani Committee & 42 EWS */}
      {activeTab === 'GHOSH_JILANI_EWS' && (
        <div className="space-y-6">
          {/* Ghosh & Jilani Internal Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Ghosh &amp; Jilani Committee Internal Control Directives
            </h3>

            <div className="space-y-3 text-xs">
              {ghoshJilaniItems.map(g => (
                <div key={g.id} className={`p-4 rounded-xl border ${g.isCompliant ? 'bg-slate-950/50 border-slate-800' : 'bg-amber-950/20 border-amber-500/40'}`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-bold text-white">
                      [{g.committee} COMMITTEE] {g.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.isCompliant ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {g.isCompliant ? 'COMPLIANT' : 'DEFICIENT'}
                    </span>
                  </div>
                  <p className="text-slate-300 mb-2">{g.recommendationText}</p>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-cyan-400">Auditor Finding:</strong> {g.auditorFinding}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RBI 42 Early Warning Signals (EWS) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-rose-400 flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4" />
              <span>RBI 42 Early Warning Signals (EWS) - Fraud Risk Scanner</span>
            </h3>

            <div className="space-y-3 text-xs">
              {ewsItems.map(ews => (
                <div key={ews.ewsCode} className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">
                      {ews.ewsCode}: {ews.ewsTitle}
                    </span>
                    {ews.redFlaggedAccountRfaTrigger && (
                      <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono text-[10px] font-bold">
                        RFA TRIGGERED
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px]">{ews.description}</p>
                  
                  {ews.flaggedBorrowers.map(fb => (
                    <div key={fb.accountNumber} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono">
                      <div className="flex justify-between text-slate-300 font-bold">
                        <span>{fb.borrowerName}</span>
                        <span className="text-rose-400">Exposure: ₹{(fb.exposureAmount / 100000).toFixed(2)}L</span>
                      </div>
                      <p className="text-[11px] text-amber-300">{fb.triggerDetail}</p>
                      <p className="text-[10px] text-slate-400"><strong className="text-white">Action:</strong> {ews.actionRequired}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Revenue Leakage Inspector */}
      {activeTab === 'REVENUE_LEAKAGE' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Bank Revenue Leakage &amp; Loan Pricing Inspector</span>
                <span className="text-xs font-mono text-emerald-400 font-normal">
                  (MCLR / EBLR &amp; 2% Penal Audit)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Audits sanction terms vs CBS charging, delayed stock statements, and unrecovered commitment charges.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Recoverable Leakage</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                ₹{leakageSummary.totalLeakageAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {pricingAuditRecords.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="text-sm font-bold text-white block">{r.borrowerName}</span>
                    <span className="text-[10px] text-slate-500">A/c: {r.accountNumber} ({r.facilityType})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Auditor Detected Leakage</span>
                    <span className="text-sm font-bold text-rose-400">
                      ₹{r.totalAuditorDetectedLeakage.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Sanctioned Rate</span>
                    <span className="text-white font-bold">{r.sanctionedEffectiveRatePercent}%</span>
                    <span className="text-[10px] text-slate-400 block">({r.sanctionedBenchmark} + {r.sanctionedSpreadPercent}%)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">CBS Applied Rate</span>
                    <span className="text-amber-400 font-bold">{r.cbsAppliedRatePercent}%</span>
                    {r.isInterestUndercharged && (
                      <span className="text-[10px] text-rose-400 block">Undercharge: {r.rateDifferentialPercent}%</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Delayed Stock Statement</span>
                    <span className={r.isStockStatementDelayed ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {r.isStockStatementDelayed ? `${r.stockDelayMonths} Months Delayed` : 'Up-to-date'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Penal: ₹{r.penalInterestUnrecovered.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Commitment Charges</span>
                    <span className="text-white font-bold">₹{r.commitmentChargesUnderrecovered.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block">Unutilized limit audit</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    MOC Reference: MOC Annexure 4 (Revenue Leakage Recovery)
                  </span>

                  <button
                    onClick={() => handleGenerateRecoveryNotice(r.accountNumber)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-600/25"
                  >
                    <Download className="w-3 h-3" />
                    <span>Draft 1-Click Recovery Notice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
