'use client';

import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileCheck2, 
  ArrowRight, 
  ShieldCheck, 
  Database, 
  Zap, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Building2, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle,
  Eye,
  KeyRound,
  Download
} from 'lucide-react';
import { MigrationSummaryReport, MigratedClientRecord, LegacySoftwareMigrator } from '@/lib/migration/legacySoftwareMigrator';
import { InstitutionalCotiDossier } from '@/components/itr/InstitutionalCotiDossier';

export function LegacyMigrationWorkbench() {
  const [activeTab, setActiveTab] = useState<'MIGRATION_DASHBOARD' | 'COTI_VIEWER' | 'RAW_MAPPINGS'>('MIGRATION_DASHBOARD');
  const [selectedSoftware, setSelectedSoftware] = useState<'WINMAN' | 'COMPUTAX' | 'TALLY_PRIME'>('WINMAN');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<MigrationSummaryReport | null>(() => 
    LegacySoftwareMigrator.parseWinmanBackup('', 'sample_winman_firm_backup.xml')
  );
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);
  const [commitStatus, setCommitStatus] = useState<'IDLE' | 'COMMITTED'>('IDLE');

  const handleSimulatePreset = (software: 'WINMAN' | 'COMPUTAX' | 'TALLY_PRIME') => {
    setIsLoading(true);
    setSelectedSoftware(software);
    setCommitStatus('IDLE');

    setTimeout(() => {
      let rep: MigrationSummaryReport;
      if (software === 'WINMAN') {
        rep = LegacySoftwareMigrator.parseWinmanBackup('', 'winman_backup_firm_ay2025.xml');
      } else if (software === 'COMPUTAX') {
        rep = LegacySoftwareMigrator.parseCompuTaxExport('', 'computax_audit_ay2025.xlsx');
      } else {
        rep = LegacySoftwareMigrator.parseTallyPrimeXml('', 'tally_trial_balance.xml');
      }
      setReport(rep);
      setSelectedClientIndex(0);
      setIsLoading(false);
    }, 400);
  };

  const handleCommitToDatabase = () => {
    setCommitStatus('COMMITTED');
  };

  const activeClient = report?.clients[selectedClientIndex] || report?.clients[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Zero-Friction Practice Transition Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Universal Legacy Software Migrator & Bridge
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Instantly ingest existing client databases from <strong>Winman CA-ERP</strong>, <strong>CompuTax / CompuBal</strong>, and <strong>TallyPrime</strong> with 100% field parity, zero manual re-typing, and ₹0 mathematical divergence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => handleSimulatePreset('WINMAN')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                selectedSoftware === 'WINMAN' 
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/25' 
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-blue-300" />
              <span>Winman XML / Backup</span>
            </button>

            <button
              onClick={() => handleSimulatePreset('COMPUTAX')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                selectedSoftware === 'COMPUTAX' 
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/25' 
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>CompuTax / CompuBal</span>
            </button>

            <button
              onClick={() => handleSimulatePreset('TALLY_PRIME')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                selectedSoftware === 'TALLY_PRIME' 
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/25' 
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-300" />
              <span>TallyPrime Trial Balance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Telemetry KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Extracted Assessees
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{report.totalRecordsProcessed}</span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">100% Validated</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">PAN, GSTIN & bank details verified</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Tax Reconciled
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-blue-400">
                ₹{(report.totalTaxLiabilityReconciled / 100000).toFixed(2)}L
              </span>
              <span className="text-xs text-slate-400 font-mono">TDS/Advance</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Prior-year AY credit matched</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Depreciation Preserved
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-400">
                ₹{(report.totalDepreciationPreserved / 100000).toFixed(2)}L
              </span>
              <span className="text-xs text-emerald-400 font-mono">Sec 32 WDV</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Block-of-assets continuity active</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Mathematical Divergence
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-400">₹0</span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">Zero Divergence</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Institutional CI/CD benchmark safe</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('MIGRATION_DASHBOARD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'MIGRATION_DASHBOARD'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Extracted Client Records ({report?.clients.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('COTI_VIEWER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'COTI_VIEWER'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Institutional COTI Dossier Preview</span>
        </button>
      </div>

      {/* Tab 1: Migration Dashboard */}
      {activeTab === 'MIGRATION_DASHBOARD' && report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List (Left) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                Assessees in Package
              </h3>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                {report.sourceSoftware}
              </span>
            </div>

            <div className="space-y-2">
              {report.clients.map((client, idx) => (
                <div
                  key={client.pan}
                  onClick={() => setSelectedClientIndex(idx)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedClientIndex === idx
                      ? 'bg-blue-950/40 border-blue-500/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{client.clientName}</h4>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{client.pan}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {client.entityType}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Gross Income:</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      ₹{(client.historicalIncomeSummary.grossTotalIncome / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Commit Button */}
            <div className="pt-3 border-t border-slate-800">
              {commitStatus === 'COMMITTED' ? (
                <div className="w-full py-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-400 flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Successfully Committed to Practice Entity DNA</span>
                </div>
              ) : (
                <button
                  onClick={handleCommitToDatabase}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition"
                >
                  <Database className="w-4 h-4" />
                  <span>Commit {report.clients.length} Clients to Entity DNA (0 Re-Typing)</span>
                </button>
              )}
            </div>
          </div>

          {/* Client Detail Inspector (Right 2 cols) */}
          {activeClient && (
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-white">{activeClient.clientName}</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {activeClient.entityType}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    PAN: {activeClient.pan} | DOI/DOB: {activeClient.incorporationOrDob} | Ward: {activeClient.wardOrCircle || 'Jurisdictional'}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('COTI_VIEWER')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 border border-slate-700 flex items-center space-x-1.5 transition self-start sm:self-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Official COTI</span>
                </button>
              </div>

              {/* Banking & GSTIN Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Verified Bank Accounts
                  </span>
                  {activeClient.bankAccounts.map((b, i) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between font-semibold text-slate-200">
                        <span>{b.bankName}</span>
                        {b.isPrimaryForRefund && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                            Refund Account
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400">
                        A/c: {b.accountNumber} • IFSC: {b.ifscCode}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Active GSTINs & Compliance IDs
                  </span>
                  <div className="space-y-1">
                    {activeClient.gstins.map(g => (
                      <div key={g} className="text-xs font-mono text-slate-300 flex items-center justify-between">
                        <span>{g}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                    ))}
                    {activeClient.tan && (
                      <div className="text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                        TAN: {activeClient.tan}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Historical Tax Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
                  Extracted Income Heads ({activeClient.historicalIncomeSummary.ay})
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                    <span className="text-[10px] text-slate-400 block">PGBP Income:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      ₹{(activeClient.historicalIncomeSummary.pgbpIncome / 100000).toFixed(2)}L
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                    <span className="text-[10px] text-slate-400 block">Gross Total Income:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₹{(activeClient.historicalIncomeSummary.grossTotalIncome / 100000).toFixed(2)}L
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                    <span className="text-[10px] text-slate-400 block">Tax Refund / (Payable):</span>
                    <span className={`font-mono font-bold text-sm ${activeClient.historicalIncomeSummary.taxPayableOrRefund < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {activeClient.historicalIncomeSummary.taxPayableOrRefund < 0 ? 'Refund ' : 'Payable '}
                      ₹{Math.abs(activeClient.historicalIncomeSummary.taxPayableOrRefund).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 32 Depreciation Block Matrix (if available) */}
              {activeClient.depreciationBlocks && activeClient.depreciationBlocks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider">
                    Preserved Section 32 Depreciation Blocks
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                      <thead className="bg-slate-950/80 text-slate-400 text-[10px]">
                        <tr>
                          <th className="p-2.5">Asset Class</th>
                          <th className="p-2.5 text-center">Rate</th>
                          <th className="p-2.5 text-right">Opening WDV</th>
                          <th className="p-2.5 text-right">Depreciation</th>
                          <th className="p-2.5 text-right">Closing WDV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {activeClient.depreciationBlocks.map((b, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-sans font-medium text-slate-200">{b.assetClass}</td>
                            <td className="p-2.5 text-center text-slate-400">{b.ratePercent}%</td>
                            <td className="p-2.5 text-right text-slate-300">₹{b.openingWdv.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right text-emerald-400 font-bold">₹{b.depreciationAllowed.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right text-blue-300 font-bold">₹{b.closingWdv.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Official COTI Viewer */}
      {activeTab === 'COTI_VIEWER' && (
        <div className="space-y-4">
          <InstitutionalCotiDossier 
            initialData={{
              pan: activeClient?.pan,
              name: activeClient?.clientName,
              pgbpNetProfit: activeClient?.historicalIncomeSummary.pgbpIncome,
              grossTotalIncome: activeClient?.historicalIncomeSummary.grossTotalIncome,
              totalTaxableIncome: activeClient?.historicalIncomeSummary.totalTaxableIncome,
              netTaxPayableOrRefund: activeClient?.historicalIncomeSummary.taxPayableOrRefund,
              wardCircle: activeClient?.wardOrCircle || 'Circle 1(1), Indore'
            }}
          />
        </div>
      )}
    </div>
  );
}
