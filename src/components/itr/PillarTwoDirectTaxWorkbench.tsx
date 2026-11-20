'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  Building2, 
  Globe2, 
  Coins, 
  FileCheck2, 
  ShieldAlert, 
  AlertTriangle,
  Layers,
  Printer,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { 
  CapitalGainAssetTransaction, 
  CapitalGainsAnnualSummary, 
  SAMPLE_CAPITAL_GAINS_SUMMARY 
} from '@/lib/itr/capitalGainsForensicEngine';
import { 
  AssetBlockItem, 
  SAMPLE_DEPRECIATION_BLOCKS 
} from '@/lib/itr/depreciationBlockEngine';
import { 
  Form10IeaRecord, 
  SAMPLE_FORM_10IEA 
} from '@/lib/itr/form10ieaEngine';
import { 
  ForeignAssetItem, 
  SAMPLE_FOREIGN_ASSETS, 
  ForeignAssetFsiEngine 
} from '@/lib/itr/foreignAssetFsiEngine';
import { 
  VdaAnnualAuditReport, 
  SAMPLE_VDA_SUMMARY 
} from '@/lib/itr/vdaCryptoEngine';
import { toast } from '@/components/shared/ToastNotification';

export function PillarTwoDirectTaxWorkbench() {
  const [activeTab, setActiveTab] = useState<'CAPITAL_GAINS' | 'DEPRECIATION_SEC32' | 'FORM_10IEA' | 'FOREIGN_ASSETS_FA' | 'VDA_CRYPTO'>('CAPITAL_GAINS');

  // State
  const [cgSummary] = useState<CapitalGainsAnnualSummary>(SAMPLE_CAPITAL_GAINS_SUMMARY);
  const [depnBlocks] = useState<AssetBlockItem[]>(SAMPLE_DEPRECIATION_BLOCKS);
  const [form10iea] = useState<Form10IeaRecord>(SAMPLE_FORM_10IEA);
  const [foreignAssetsData] = useState(() => ForeignAssetFsiEngine.evaluateScheduleFaCompliance(SAMPLE_FOREIGN_ASSETS));
  const [vdaSummary] = useState<VdaAnnualAuditReport>(SAMPLE_VDA_SUMMARY);

  return (
    <div className="space-y-6">
      {/* Pillar Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border border-amber-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Pillar II: Advanced Direct Tax & Capital Gains Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Finance Act 2024 Capital Gains, Depreciation & Schedule FA
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Institutional precision under latest tax laws: <strong>STCG @ 20% u/s 111A</strong>, <strong>LTCG @ 12.5% u/s 112A with ₹1.25L exemption</strong>, <strong>Section 32 Additional Depreciation (20%)</strong>, <strong>Form 10-IEA lifetime lockout guard</strong>, <strong>Schedule FA & Form 67</strong>, and <strong>Section 115BBH Crypto ring-fenced ledger</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
              Budget 2024 Regimes Active
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('CAPITAL_GAINS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'CAPITAL_GAINS'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>1. Capital Gains (Budget 2024 Rates)</span>
        </button>

        <button
          onClick={() => setActiveTab('DEPRECIATION_SEC32')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'DEPRECIATION_SEC32'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>2. Section 32 Depreciation Blocks ({depnBlocks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FORM_10IEA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'FORM_10IEA'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>3. Form 10-IEA Lifetime Guardian</span>
        </button>

        <button
          onClick={() => setActiveTab('FOREIGN_ASSETS_FA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'FOREIGN_ASSETS_FA'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>4. Schedule FA & Form 67 (US Stocks)</span>
        </button>

        <button
          onClick={() => setActiveTab('VDA_CRYPTO')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'VDA_CRYPTO'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>5. Section 115BBH Crypto Ledger</span>
        </button>
      </div>

      {/* TAB 1: Capital Gains */}
      {activeTab === 'CAPITAL_GAINS' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                STCG u/s 111A (20%)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-amber-400">
                  ₹{(cgSummary.stcg111A_20Percent / 100000).toFixed(2)}L
                </span>
                <span className="text-xs font-mono text-slate-400">Tax: ₹{(cgSummary.stcg111A_20Percent * 0.20 / 1000).toFixed(1)}k</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Post 23-Jul-2024 rate: 20%</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                LTCG u/s 112A (12.5%)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-emerald-400">
                  ₹{(cgSummary.ltcg112A_12_5Percent / 100000).toFixed(2)}L
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">-₹1.25L Exempt</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Taxable: ₹{(cgSummary.taxableLtcg112A / 100000).toFixed(2)}L @ 12.5%</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Real Estate LTCG (12.5%)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-blue-400">
                  ₹{(cgSummary.ltcg112Other_12_5Percent / 100000).toFixed(2)}L
                </span>
                <span className="text-xs font-mono text-slate-400">Sec 50C</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Stamp Duty Value tested</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Total Tax on Capital Gains
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">
                  ₹{cgSummary.totalTaxPayableCapitalGains.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Schedule CG computed</p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Capital Asset Transactions Scrutiny ({cgSummary.transactions.length})
            </h3>

            <div className="space-y-3">
              {cgSummary.transactions.map(tr => (
                <div key={tr.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{tr.description}</h4>
                      <p className="text-xs font-mono text-slate-400">
                        Acquired: {tr.dateOfAcquisition} | Sold: {tr.dateOfTransfer} ({tr.periodOfHoldingMonths} Months)
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {tr.isLongTerm ? 'LONG-TERM' : 'SHORT-TERM'}
                      </span>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Sec {tr.statutorySection} @ {tr.applicableTaxRatePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Adjusted Cost (Grandfathered)</span>
                      <span className="text-slate-200">₹{tr.adjustedCostOfAcquisition.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Net Consideration</span>
                      <span className="text-slate-200">₹{tr.netConsideration.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Capital Gain / (Loss)</span>
                      <span className="font-bold text-emerald-400">₹{tr.capitalGainOrLoss.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tax Payable</span>
                      <span className="font-bold text-white">₹{tr.taxLiabilityInr.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {tr.forensicNotes.length > 0 && (
                    <div className="text-[11px] text-amber-300/90 font-mono bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-lg">
                      {tr.forensicNotes.join(' • ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Section 32 Depreciation Blocks */}
      {activeTab === 'DEPRECIATION_SEC32' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Section 32 Block of Assets & Additional Depreciation Matrix
              </h3>
              <p className="text-xs text-slate-400">Form 3CD Clause 18 Annexure ready with &lt; 180 days 50% pro-rata &amp; Sec 32(1)(iia) 20% manufacturing incentive</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form 3CD Annexure</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
              <thead className="bg-slate-950/80 text-slate-400 text-[10px]">
                <tr>
                  <th className="p-3">Asset Block</th>
                  <th className="p-3 text-center">Rate</th>
                  <th className="p-3 text-right">Opening WDV</th>
                  <th className="p-3 text-right">Additions &gt;180d</th>
                  <th className="p-3 text-right">Additions &lt;180d (50%)</th>
                  <th className="p-3 text-right">Normal Depn</th>
                  <th className="p-3 text-right">Additional Depn (20%)</th>
                  <th className="p-3 text-right">Closing WDV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {depnBlocks.map(b => (
                  <tr key={b.blockId} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-semibold text-white">{b.assetClass}</td>
                    <td className="p-3 text-center font-bold text-slate-300">{b.ratePercent}%</td>
                    <td className="p-3 text-right text-slate-300">₹{b.openingWdv.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-300">₹{b.additionsMoreThan180Days.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-300">₹{b.additionsLessThan180Days.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-emerald-400">₹{b.normalDepreciationAllowed.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-amber-300 font-bold">₹{b.additionalDepreciationAllowed.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-black text-cyan-300">₹{b.closingWdv.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Form 10-IEA Lifetime Guardian */}
      {activeTab === 'FORM_10IEA' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Form 10-IEA Lifetime Regime Selection Guardian</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Rule 21AGA Compliant
                </span>
              </h3>
              <p className="text-xs text-slate-400">Assessee: {form10iea.assesseeName} ({form10iea.assesseePan})</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white text-sm block">Statutory Eligibility: Eligible to Opt Out to Old Regime</span>
                <p className="text-slate-300 mt-1 leading-relaxed">{form10iea.statutoryRuleSummary}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Assessment Year</span>
                <span className="font-bold text-white">{form10iea.assessmentYear}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Has PGBP Income?</span>
                <span className="font-bold text-emerald-400">{form10iea.hasPgbpIncome ? 'YES (Business)' : 'NO'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Prior Opt-Outs</span>
                <span className="font-bold text-slate-200">{form10iea.historicalOptOutYears.length} times</span>
              </div>
              <div>
                <span className="text-slate-500 block">Permanent Lockout?</span>
                <span className="font-bold text-emerald-400">{form10iea.statutoryLockoutActive ? 'YES' : 'NO (Allowed)'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Schedule FA & Form 67 */}
      {activeTab === 'FOREIGN_ASSETS_FA' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Schedule FA: Foreign Assets Disclosure &amp; Form 67 DTAA Relief
                </h3>
                <p className="text-xs text-slate-400">Eliminates ₹10 Lakhs statutory penalty u/s 43 of Black Money Act for undisclosed foreign stock/RSUs</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Black Money Penalty Risk: ₹{foreignAssetsData.blackMoneyPenaltyExposure.toLocaleString('en-IN')} (Clean)
              </span>
            </div>

            <div className="space-y-3">
              {foreignAssetsData.assets.map(a => (
                <div key={a.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold font-sans text-white text-sm block">{a.foreignEntityName}</span>
                      <span className="text-[11px] text-slate-400">{a.assetCategory} • {a.countryName}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      Reported in Schedule FA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Peak Value</span>
                      <span className="font-bold text-white">₹{a.peakBalanceOrValueInr.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Foreign Income</span>
                      <span className="font-bold text-slate-200">₹{a.grossForeignIncomeInr.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Foreign Tax Paid (W-8BEN)</span>
                      <span className="font-bold text-rose-300">₹{a.foreignTaxPaidInr.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Section 90 Relief (Form 67)</span>
                      <span className="font-bold text-emerald-400">₹{a.dtaaReliefClaimedSec90.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VDA Crypto Ledger */}
      {activeTab === 'VDA_CRYPTO' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Section 115BBH Crypto / Virtual Digital Asset Ring-Fenced Ledger</span>
                <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  Zero Loss Set-Off
                </span>
              </h3>
              <p className="text-xs text-slate-400">Gains taxed at flat 30%; losses cannot be set off against other crypto gains or business income!</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Gross Crypto Gains</span>
              <span className="font-bold text-emerald-400 text-sm">₹{vdaSummary.totalGrossGains.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Gross Crypto Losses (Disallowed)</span>
              <span className="font-bold text-rose-400 text-sm">₹{vdaSummary.totalGrossLosses.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Section 194S TDS Credit</span>
              <span className="font-bold text-white text-sm">₹{vdaSummary.totalTdsCreditSec194S.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40">
              <span className="text-[10px] text-amber-300 block">Net 30% Tax Payable</span>
              <span className="font-bold text-amber-200 text-sm">₹{vdaSummary.netTaxPayableOrRefund.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-xs text-rose-300">
            <span className="font-bold block mb-1">Statutory Warning u/s 115BBH(2)(b):</span>
            <p>{vdaSummary.statutoryRuleWarning}</p>
          </div>
        </div>
      )}
    </div>
  );
}
