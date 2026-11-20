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
      <div className="bg-white border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden text-slate-900">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>Pillar IV: Statutory Bank Audit, Concurrent &amp; Stock Audit Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              RBI IRAC Norms, LFAR Master Pack &amp; Revenue Leakage Sentinel
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automates Statutory Bank Branch Audits, Concurrent Audits, and Stock Audits. Covers <strong>90-day IRAC NPAs</strong>, <strong>Drawing Power calculations</strong>, <strong>RBI 2020 LFAR checklists</strong>, <strong>Ghosh &amp; Jilani fraud EWS</strong>, and <strong>MCLR/EBLR revenue leakages</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handlePrintMoc}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official MOC &amp; LFAR Pack</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Total Audited Advances
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{(totalAdvances / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-xs font-mono text-slate-500">({advances.length} Borrowers)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cash Credit &amp; Term Loans</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Detected NPA Exposure
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-red-600">
              ₹{(totalNpa / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-xs font-mono text-red-600 font-bold">
              {((totalNpa / totalAdvances) * 100).toFixed(1)}% GNPA
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Downgrades &amp; Overdues &gt; 90d</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Total MOC P&amp;L Impact
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-700">
              ₹{(totalMocProvision / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-amber-800 font-bold">Debit P&amp;L</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Additional Required Provision</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Detected Revenue Leakage
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700">
              ₹{(leakageSummary.totalLeakageAmount / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-emerald-800 font-bold">Recoverable</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Interest Undercharge &amp; 2% Penal</p>
        </div>
      </div>

      {/* 6 Institutional Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('IRAC_MOC')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'IRAC_MOC'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>1. IRAC &amp; MOC Generator ({advances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DRAWING_POWER')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'DRAWING_POWER'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>2. Drawing Power &amp; Stock Sentinel</span>
        </button>

        <button
          onClick={() => setActiveTab('LFAR_MASTER')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'LFAR_MASTER'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>3. LFAR Master Pack (RBI 2020)</span>
        </button>

        <button
          onClick={() => setActiveTab('CONCURRENT_AUDIT')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'CONCURRENT_AUDIT'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>4. Concurrent Audit Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('GHOSH_JILANI_EWS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'GHOSH_JILANI_EWS'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>5. Ghosh / Jilani &amp; 42 EWS</span>
        </button>

        <button
          onClick={() => setActiveTab('REVENUE_LEAKAGE')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'REVENUE_LEAKAGE'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>6. Revenue Leakage Inspector</span>
        </button>
      </div>

      {/* TAB 1: IRAC Classification & MOC Generator */}
      {activeTab === 'IRAC_MOC' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts List (Left) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Audited Advance Accounts ({advances.length})
            </h3>

            <div className="space-y-2">
              {advances.map((acc) => (
                <div
                  key={acc.accountNumber}
                  onClick={() => setSelectedMocAccount(acc)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                    selectedMocAccount?.accountNumber === acc.accountNumber
                      ? 'bg-red-50 border-red-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate max-w-[180px]">
                      {acc.borrowerName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        acc.recommendedClassification === 'STANDARD'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : acc.recommendedClassification.startsWith('SMA')
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {acc.recommendedClassification}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>O/S: ₹{(acc.outstandingBalance / 100000).toFixed(2)}L</span>
                    <span className={acc.daysOverdue > 90 ? 'text-red-600 font-bold' : ''}>
                      {acc.daysOverdue} Days O/D
                    </span>
                  </div>

                  {acc.isMocRequired && (
                    <div className="flex items-center space-x-1.5 text-[10px] text-amber-700 pt-1 border-t border-slate-200 font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
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
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <span>{selectedMocAccount.borrowerName}</span>
                      <span className="text-xs font-mono text-red-600 font-normal">
                        ({selectedMocAccount.facilityType})
                      </span>
                    </h2>
                    <span className="text-xs font-mono text-slate-500">
                      A/c: {selectedMocAccount.accountNumber}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Branch: {selectedMocAccount.currentClassification}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                      Audit: {selectedMocAccount.recommendedClassification}
                    </span>
                  </div>
                </div>

                {/* Audit Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Sanctioned Limit</span>
                    <span className="text-sm font-bold text-slate-900">₹{(selectedMocAccount.sanctionedLimit / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Current Outstanding</span>
                    <span className="text-sm font-bold text-slate-900">₹{(selectedMocAccount.outstandingBalance / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Drawing Power</span>
                    <span className="text-sm font-bold text-red-600">₹{(selectedMocAccount.drawingPower / 100000).toFixed(2)}L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Days Overdue</span>
                    <span className={`text-sm font-bold ${selectedMocAccount.daysOverdue > 90 ? 'text-red-600' : 'text-slate-700'}`}>
                      {selectedMocAccount.daysOverdue} Days
                    </span>
                  </div>
                </div>

                {/* Auditor Observations */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Statutory Auditor Findings &amp; IRAC Classification Basis
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                    {selectedMocAccount.notes.map((note, idx) => (
                      <p key={idx} className="flex items-start space-x-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>{note}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Memorandum of Changes (MOC) Box */}
                {selectedMocAccount.isMocRequired ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
                          Formal Memorandum of Changes (MOC) Passed
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-amber-800 font-semibold">
                        ICAI SA-700 Bank Audit Format
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1 p-3 rounded-lg bg-white border border-amber-200">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Accounting Entry (Debit P&amp;L)</span>
                        <p className="font-bold text-red-700">Dr. Provision for NPA (Advances):</p>
                        <p className="text-sm font-mono font-bold text-slate-900">
                          ₹{selectedMocAccount.differentialProvisionMoc.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          (Branch Prov: ₹{selectedMocAccount.branchProvision.toLocaleString('en-IN')} vs Required: ₹{selectedMocAccount.statutoryRequiredProvision.toLocaleString('en-IN')})
                        </span>
                      </div>

                      <div className="space-y-1 p-3 rounded-lg bg-white border border-amber-200">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">Balance Sheet Impact</span>
                        <p className="font-bold text-amber-800">Cr. Reserve for Bad &amp; Doubtful Debts:</p>
                        <p className="text-sm font-mono font-bold text-slate-900">
                          ₹{selectedMocAccount.differentialProvisionMoc.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          Asset downgraded from Standard to {selectedMocAccount.recommendedClassification}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No Memorandum of Changes (MOC) required. Branch provisioning is fully compliant with RBI IRAC norms.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                Select an account from the left list to review asset classification and MOC impact.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Drawing Power & Stock Sentinel */}
      {activeTab === 'DRAWING_POWER' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Working Capital Drawing Power (DP) Audit</span>
                <span className="text-xs font-mono text-red-600 font-semibold">
                  (Tandon &amp; Nayak Committee MPBF)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Borrower: <strong className="text-slate-900">{dpData.borrowerName}</strong> | Statement Date: {dpData.statementDate}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600">Sanctioned Limit:</span>
              <span className="text-xs font-mono font-bold text-slate-900 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                ₹{(dpData.sanctionedLimit / 100000).toFixed(2)} Lakhs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* Stock Valuation */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans border-b border-slate-200 pb-2">
                Part A: Paid Stock Valuation
              </h4>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>Raw Materials:</span>
                  <span>₹{dpData.rawMaterial.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Work In Progress (WIP):</span>
                  <span>₹{dpData.workInProgress.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Finished Goods:</span>
                  <span>₹{dpData.finishedGoods.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Stores &amp; Spares (Ineligible):</span>
                  <span>(₹{dpData.storesAndSpares.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-1 border-t border-slate-200 font-bold">
                  <span>Gross Eligible Stock:</span>
                  <span className="text-slate-900">₹{dpData.grossStock.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Less: Creditors for Purchases:</span>
                  <span>(₹{dpData.sundryCreditorsForPurchases.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Less: Obsolete / Non-Moving:</span>
                  <span>(₹{dpData.obsoleteOrNonMovingStock.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-1 border-t border-slate-200 font-bold">
                  <span>Net Eligible Paid Stock:</span>
                  <span>₹{dpData.netEligibleStock.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-red-700 pt-1 border-t border-red-200 font-bold">
                  <span>Eligible Stock DP (Less {dpData.stockMarginPercent}% Margin):</span>
                  <span className="text-sm">₹{dpData.eligibleStockForDp.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Debtors / Receivables */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans border-b border-slate-200 pb-2">
                Part B: Book Debts / Receivables Valuation
              </h4>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>Total Sundry Debtors:</span>
                  <span>₹{dpData.totalDebtors.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Less: Ineligible Debtors (&gt; 90 Days):</span>
                  <span>(₹{dpData.debtorsOver90Days.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-1 border-t border-slate-200 font-bold">
                  <span>Eligible Debtors (Within 90 Days):</span>
                  <span>₹{dpData.debtorsWithin90Days.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-red-700 pt-1 border-t border-red-200 font-bold">
                  <span>Eligible Debtors DP (Less {dpData.debtorsMarginPercent}% Margin):</span>
                  <span className="text-sm">₹{dpData.eligibleDebtorsForDp.toLocaleString('en-IN')}</span>
                </div>

                {/* Final DP Summary Box */}
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 mt-4 space-y-1.5">
                  <div className="flex justify-between text-slate-900 font-bold">
                    <span>Total Calculated DP (Stock + Debtors):</span>
                    <span>₹{dpData.totalCalculatedDrawingPower.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-red-700 font-bold">
                    <span>Effective DP Allowed:</span>
                    <span className="text-sm">₹{dpData.effectiveDrawingPower.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Actual Bank Outstanding:</span>
                    <span className="font-semibold text-slate-900">₹{dpData.currentOutstanding.toLocaleString('en-IN')}</span>
                  </div>
                  {dpData.isOverdrawn && (
                    <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-rose-200">
                      <span>Excess Drawing (Overdrawn):</span>
                      <span>₹{dpData.excessDrawings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {dpData.penalInterestExposure > 0 && (
                    <div className="flex justify-between text-amber-800 text-[11px] pt-1">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Long Form Audit Report (LFAR) - RBI 2020 Revised Master Format</span>
              </h3>
              <p className="text-xs text-slate-500">
                {lfarSummary.bankName} - {lfarSummary.branchName} | FY: {lfarSummary.financialYear}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-700 font-mono bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                Completion: <strong>{lfarSummary.completionPercentage}%</strong> ({lfarSummary.totalQuestions} Questions)
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
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
                      ? 'bg-rose-50 border-rose-200'
                      : q.status === 'DEFICIENCY_NOTED'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-mono font-bold text-[10px] border border-slate-200">
                        {q.questionNumber}
                      </span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {q.questionText}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <select
                        value={q.status}
                        onChange={(e) => handleUpdateLfarStatus(q.id, e.target.value as any)}
                        className={`text-[11px] font-mono font-bold rounded-lg px-2.5 py-1 border bg-white ${
                          q.status === 'ADVERSE_QUALIFICATION'
                            ? 'text-rose-700 border-rose-300'
                            : q.status === 'DEFICIENCY_NOTED'
                            ? 'text-amber-700 border-amber-300'
                            : 'text-emerald-700 border-emerald-300'
                        }`}
                      >
                        <option value="SATISFACTORY">SATISFACTORY</option>
                        <option value="DEFICIENCY_NOTED">DEFICIENCY NOTED</option>
                        <option value="ADVERSE_QUALIFICATION">ADVERSE QUALIFICATION</option>
                        <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-slate-600 text-[11px] italic">
                    Guidance: {q.guidanceText}
                  </p>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono text-red-600 uppercase font-bold block">
                      Statutory Auditor Remarks:
                    </span>
                    <p className="text-slate-800">
                      {q.auditorRemarks}
                    </p>
                  </div>

                  {q.borrowerAccountImpacted && q.borrowerAccountImpacted.length > 0 && (
                    <div className="flex items-center space-x-2 text-[11px] text-rose-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Impacted Loan A/c: {q.borrowerAccountImpacted.join(', ')}</span>
                      {q.requiresMoc && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  High-Value Transactions &amp; PMLA Reporting (&gt; ₹10 Lakhs)
                </h3>
                <span className="text-xs text-slate-500">
                  Total Volume Audited: ₹{(concurrentSummary.totalHighValueVolume / 100000).toFixed(2)} Lakhs | CTRs: {concurrentSummary.ctrExposureCount} | STRs: {concurrentSummary.strEscalatedCount}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-200">
                  {highValueTxns.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-700">{t.transactionDate}</td>
                      <td className="p-3">
                        <span className="text-slate-900 font-bold block">{t.accountName}</span>
                        <span className="text-[10px] text-slate-500">{t.accountNumber}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.transactionType.includes('CASH') ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-900 font-bold">
                        ₹{t.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-slate-700 max-w-xs truncate" title={t.purposeOrNarration}>
                        {t.purposeOrNarration}
                      </td>
                      <td className="p-3">
                        {t.isSuspicious ? (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            STR TRIGGERED
                          </span>
                        ) : t.isPmlaFlagged ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                            CTR FILED
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">REGULAR</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.auditVerificationStatus === 'VERIFIED_GENUINE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.auditVerificationStatus === 'ESCALATED_TO_COMPLIANCE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
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
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans border-b border-slate-200 pb-2">
                Daily Closing Cash vs Branch Retention Limit
              </h4>
              <div className="space-y-2 text-xs font-mono">
                {cashRetention.map(c => (
                  <div key={c.date} className={`p-3 rounded-xl border ${c.isLimitBreached ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between font-bold text-slate-900 mb-1">
                      <span>Date: {c.date}</span>
                      <span className={c.isLimitBreached ? 'text-rose-600' : 'text-emerald-700'}>
                        Closing: ₹{c.closingCashInHand.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Sanctioned Ceiling: ₹{c.sanctionedRetentionLimit.toLocaleString('en-IN')}</span>
                      {c.isLimitBreached && (
                        <span className="text-rose-600 font-bold">Excess: +₹{c.overnightExcess.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{c.remarks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Locker Audit */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans border-b border-slate-200 pb-2">
                Locker Operations &amp; Overdue Rent Inspection
              </h4>
              <div className="space-y-2 text-xs font-mono">
                {lockerRecords.map(l => (
                  <div key={l.lockerNumber} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Locker #{l.lockerNumber} - {l.customerName}</span>
                      <span className={l.isHighRiskInactive ? 'text-rose-600' : 'text-emerald-700'}>
                        {l.daysSinceLastOperation}d Inactive
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Ghosh &amp; Jilani Committee Internal Control Directives
            </h3>

            <div className="space-y-3 text-xs">
              {ghoshJilaniItems.map(g => (
                <div key={g.id} className={`p-4 rounded-xl border ${g.isCompliant ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-bold text-slate-900">
                      [{g.committee} COMMITTEE] {g.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.isCompliant ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {g.isCompliant ? 'COMPLIANT' : 'DEFICIENT'}
                    </span>
                  </div>
                  <p className="text-slate-700 mb-2">{g.recommendationText}</p>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600">
                    <strong className="text-red-600">Auditor Finding:</strong> {g.auditorFinding}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RBI 42 Early Warning Signals (EWS) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider font-mono flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>RBI 42 Early Warning Signals (EWS) - Fraud Risk Scanner</span>
            </h3>

            <div className="space-y-3 text-xs">
              {ewsItems.map(ews => (
                <div key={ews.ewsCode} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">
                      {ews.ewsCode}: {ews.ewsTitle}
                    </span>
                    {ews.redFlaggedAccountRfaTrigger && (
                      <span className="px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-bold">
                        RFA TRIGGERED
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px]">{ews.description}</p>
                  
                  {ews.flaggedBorrowers.map(fb => (
                    <div key={fb.accountNumber} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 font-mono">
                      <div className="flex justify-between text-slate-900 font-bold">
                        <span>{fb.borrowerName}</span>
                        <span className="text-rose-600">Exposure: ₹{(fb.exposureAmount / 100000).toFixed(2)}L</span>
                      </div>
                      <p className="text-[11px] text-amber-800">{fb.triggerDetail}</p>
                      <p className="text-[10px] text-slate-600"><strong className="text-slate-900">Action:</strong> {ews.actionRequired}</p>
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Bank Revenue Leakage &amp; Loan Pricing Inspector</span>
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  (MCLR / EBLR &amp; 2% Penal Audit)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Audits sanction terms vs CBS charging, delayed stock statements, and unrecovered commitment charges.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Recoverable Leakage</span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                ₹{leakageSummary.totalLeakageAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {pricingAuditRecords.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">{r.borrowerName}</span>
                    <span className="text-[10px] text-slate-500">A/c: {r.accountNumber} ({r.facilityType})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Auditor Detected Leakage</span>
                    <span className="text-sm font-bold text-rose-600">
                      ₹{r.totalAuditorDetectedLeakage.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Sanctioned Rate</span>
                    <span className="text-slate-900 font-bold">{r.sanctionedEffectiveRatePercent}%</span>
                    <span className="text-[10px] text-slate-500 block">({r.sanctionedBenchmark} + {r.sanctionedSpreadPercent}%)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">CBS Applied Rate</span>
                    <span className="text-amber-700 font-bold">{r.cbsAppliedRatePercent}%</span>
                    {r.isInterestUndercharged && (
                      <span className="text-[10px] text-rose-600 block">Undercharge: {r.rateDifferentialPercent}%</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Delayed Stock Statement</span>
                    <span className={r.isStockStatementDelayed ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      {r.isStockStatementDelayed ? `${r.stockDelayMonths} Months Delayed` : 'Up-to-date'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Penal: ₹{r.penalInterestUnrecovered.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Commitment Charges</span>
                    <span className="text-slate-900 font-bold">₹{r.commitmentChargesUnderrecovered.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-500 block">Unutilized limit audit</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">
                    MOC Reference: MOC Annexure 4 (Revenue Leakage Recovery)
                  </span>

                  <button
                    onClick={() => handleGenerateRecoveryNotice(r.accountNumber)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center space-x-1.5 shadow-sm"
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
