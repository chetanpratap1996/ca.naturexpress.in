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
      {/* Clean Professional Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Direct Tax Schedules &amp; Computations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Capital Gains, Depreciation &amp; Statutory Tax Schedules
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>STCG @ 20% u/s 111A</strong>, <strong>LTCG @ 12.5% u/s 112A with ₹1.25L exemption</strong>, <strong>Section 32 Additional Depreciation (20%)</strong>, <strong>Form 10-IEA regime evaluation</strong>, <strong>Schedule FA &amp; Form 67</strong>, and <strong>Section 115BBH Crypto ledger</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold shadow-xs">
              Budget 2024 Regimes Active
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('CAPITAL_GAINS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'CAPITAL_GAINS'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Capital Gains (Sec 111A/112A)</span>
        </button>

        <button
          onClick={() => setActiveTab('DEPRECIATION_SEC32')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'DEPRECIATION_SEC32'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Section 32 Depreciation Blocks ({depnBlocks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FORM_10IEA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'FORM_10IEA'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Form 10-IEA Regime Opt-In</span>
        </button>

        <button
          onClick={() => setActiveTab('FOREIGN_ASSETS_FA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'FOREIGN_ASSETS_FA'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          <span>Schedule FA Foreign Assets</span>
        </button>

        <button
          onClick={() => setActiveTab('VDA_CRYPTO')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'VDA_CRYPTO'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Section 115BBH Crypto Ledger</span>
        </button>
      </div>

      {/* TAB 1: Capital Gains */}
      {activeTab === 'CAPITAL_GAINS' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                STCG u/s 111A (20%)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-red-600">
                  ₹{(cgSummary.stcg111A_20Percent / 100000).toFixed(2)}L
                </span>
                <span className="text-xs font-mono text-slate-500">Tax: ₹{(cgSummary.stcg111A_20Percent * 0.20 / 1000).toFixed(1)}k</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Post 23-Jul-2024 rate: 20%</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                LTCG u/s 112A (12.5%)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-emerald-700">
                  ₹{(cgSummary.ltcg112A_12_5Percent / 100000).toFixed(2)}L
                </span>
                <span className="text-xs font-mono text-emerald-700 font-bold">-₹1.25L Exempt</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Taxable: ₹{(cgSummary.taxableLtcg112A / 100000).toFixed(2)}L @ 12.5%</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                Real Estate LTCG (12.5%)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">
                  ₹{(cgSummary.ltcg112Other_12_5Percent / 100000).toFixed(2)}L
                </span>
                <span className="text-xs font-mono text-slate-500">Sec 50C</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Stamp Duty Value tested</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                Total Tax on Capital Gains
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">
                  ₹{cgSummary.totalTaxPayableCapitalGains.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Schedule CG computed</p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Capital Asset Transactions Scrutiny ({cgSummary.transactions.length})
            </h3>

            <div className="space-y-3">
              {cgSummary.transactions.map(tr => (
                <div key={tr.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{tr.description}</h4>
                      <p className="text-xs font-mono text-slate-500">
                        Acquired: {tr.dateOfAcquisition} | Sold: {tr.dateOfTransfer} ({tr.periodOfHoldingMonths} Months)
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                        {tr.isLongTerm ? 'LONG-TERM' : 'SHORT-TERM'}
                      </span>
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        Sec {tr.statutorySection} @ {tr.applicableTaxRatePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Adjusted Cost (Grandfathered)</span>
                      <span className="text-slate-800">₹{tr.adjustedCostOfAcquisition.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Net Consideration</span>
                      <span className="text-slate-800">₹{tr.netConsideration.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Capital Gain / (Loss)</span>
                      <span className="font-bold text-emerald-700">₹{tr.capitalGainOrLoss.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tax Payable</span>
                      <span className="font-bold text-slate-900">₹{tr.taxLiabilityInr.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {tr.forensicNotes.length > 0 && (
                    <div className="text-[11px] text-amber-800 font-mono bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Section 32 Block of Assets &amp; Additional Depreciation Matrix
              </h3>
              <p className="text-xs text-slate-500">Form 3CD Clause 18 Annexure ready with &lt; 180 days 50% pro-rata &amp; Sec 32(1)(iia) 20% manufacturing incentive</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form 3CD Annexure</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
              <thead className="bg-slate-100 text-slate-700 text-[10px]">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {depnBlocks.map(b => (
                  <tr key={b.blockId} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-semibold text-slate-900">{b.assetClass}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{b.ratePercent}%</td>
                    <td className="p-3 text-right text-slate-700">₹{b.openingWdv.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-700">₹{b.additionsMoreThan180Days.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-slate-700">₹{b.additionsLessThan180Days.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-emerald-700 font-bold">₹{b.normalDepreciationAllowed.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-red-600 font-bold">₹{b.additionalDepreciationAllowed.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-black text-slate-900">₹{b.closingWdv.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Form 10-IEA Lifetime Guardian */}
      {activeTab === 'FORM_10IEA' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Form 10-IEA Lifetime Regime Selection Guardian</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Rule 21AGA Compliant
                </span>
              </h3>
              <p className="text-xs text-slate-500">Assessee: {form10iea.assesseeName} ({form10iea.assesseePan})</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 text-sm block">Statutory Eligibility: Eligible to Opt Out to Old Regime</span>
                <p className="text-slate-600 mt-1 leading-relaxed">{form10iea.statutoryRuleSummary}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Assessment Year</span>
                <span className="font-bold text-slate-900">{form10iea.assessmentYear}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Has PGBP Income?</span>
                <span className="font-bold text-emerald-700">{form10iea.hasPgbpIncome ? 'YES (Business)' : 'NO'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Prior Opt-Outs</span>
                <span className="font-bold text-slate-700">{form10iea.historicalOptOutYears.length} times</span>
              </div>
              <div>
                <span className="text-slate-500 block">Permanent Lockout?</span>
                <span className="font-bold text-emerald-700">{form10iea.statutoryLockoutActive ? 'YES' : 'NO (Allowed)'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Schedule FA & Form 67 */}
      {activeTab === 'FOREIGN_ASSETS_FA' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Schedule FA: Foreign Assets Disclosure &amp; Form 67 DTAA Relief
                </h3>
                <p className="text-xs text-slate-500">Eliminates ₹10 Lakhs statutory penalty u/s 43 of Black Money Act for undisclosed foreign stock/RSUs</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">
                Black Money Penalty Risk: ₹{foreignAssetsData.blackMoneyPenaltyExposure.toLocaleString('en-IN')} (Clean)
              </span>
            </div>

            <div className="space-y-3">
              {foreignAssetsData.assets.map(a => (
                <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold font-sans text-slate-900 text-sm block">{a.foreignEntityName}</span>
                      <span className="text-[11px] text-slate-500">{a.assetCategory} • {a.countryName}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Reported in Schedule FA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Peak Value</span>
                      <span className="font-bold text-slate-900">₹{a.peakBalanceOrValueInr.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Foreign Income</span>
                      <span className="font-bold text-slate-700">₹{a.grossForeignIncomeInr.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Foreign Tax Paid (W-8BEN)</span>
                      <span className="font-bold text-red-600">₹{a.foreignTaxPaidInr.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Section 90 Relief (Form 67)</span>
                      <span className="font-bold text-emerald-700">₹{a.dtaaReliefClaimedSec90.toLocaleString('en-IN')}</span>
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Section 115BBH Crypto / Virtual Digital Asset Ring-Fenced Ledger</span>
                <span className="text-[10px] font-mono uppercase bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                  Zero Loss Set-Off
                </span>
              </h3>
              <p className="text-xs text-slate-500">Gains taxed at flat 30%; losses cannot be set off against other crypto gains or business income!</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Gross Crypto Gains</span>
              <span className="font-bold text-emerald-700 text-sm">₹{vdaSummary.totalGrossGains.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Gross Crypto Losses (Disallowed)</span>
              <span className="font-bold text-red-600 text-sm">₹{vdaSummary.totalGrossLosses.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Section 194S TDS Credit</span>
              <span className="font-bold text-slate-900 text-sm">₹{vdaSummary.totalTdsCreditSec194S.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-[10px] text-red-700 block font-semibold">Net 30% Tax Payable</span>
              <span className="font-bold text-red-700 text-sm">₹{vdaSummary.netTaxPayableOrRefund.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            <span className="font-bold block mb-1">Statutory Warning u/s 115BBH(2)(b):</span>
            <p>{vdaSummary.statutoryRuleWarning}</p>
          </div>
        </div>
      )}
    </div>
  );
}
