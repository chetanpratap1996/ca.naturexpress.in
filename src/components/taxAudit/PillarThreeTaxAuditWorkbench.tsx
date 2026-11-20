'use client';

import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  Layers, 
  Printer, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { 
  IcdsClause13AuditReport, 
  SAMPLE_ICDS_REPORT 
} from '@/lib/taxAudit/icdsEngine';
import { 
  Clause21SummaryReport, 
  SAMPLE_CLAUSE_21_REPORT 
} from '@/lib/taxAudit/clause21DisallowanceEngine';
import { 
  Clause26AuditReport, 
  SAMPLE_CLAUSE_26_DATA 
} from '@/lib/taxAudit/clause26Sec43bEngine';
import { Form3cdClause31Workbench } from '@/components/taxAudit/Form3cdClause31Workbench';
import { 
  Clause32SummaryReport, 
  SAMPLE_CLAUSE_32_RECORDS 
} from '@/lib/taxAudit/clause32LossMatrixEngine';
import { 
  Clause40RatiosReport, 
  SAMPLE_CLAUSE_40_REPORT 
} from '@/lib/taxAudit/clause40RatiosEngine';
import { toast } from '@/components/shared/ToastNotification';

export function PillarThreeTaxAuditWorkbench() {
  const [activeTab, setActiveTab] = useState<'ICDS_CLAUSE13' | 'DISALLOWANCES_CLAUSE21' | 'STATUTORY_DUES_SEC43B' | 'CASH_LOANS_CLAUSE31' | 'LOSS_MATRIX_RATIOS'>('ICDS_CLAUSE13');

  // State
  const [icdsReport] = useState<IcdsClause13AuditReport>(SAMPLE_ICDS_REPORT);
  const [clause21Report] = useState<Clause21SummaryReport>(SAMPLE_CLAUSE_21_REPORT);
  const [clause26Report] = useState<Clause26AuditReport>(SAMPLE_CLAUSE_26_DATA);
  const [clause32Report] = useState<Clause32SummaryReport>(SAMPLE_CLAUSE_32_RECORDS);
  const [clause40Report] = useState<Clause40RatiosReport>(SAMPLE_CLAUSE_40_REPORT);

  return (
    <div className="space-y-6">
      {/* Pillar Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Pillar III: Form 3CD Institutional Tax Audit Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Section 44AB Tax Audit Workpapers & ICAI Standards
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Complete automated audit trails for Form 3CD: <strong>Clause 13(d) ICDS I to X adjustments</strong>, <strong>Clause 21(a) Section 40(a)(ia) & 40A(3) disallowances</strong>, <strong>Clause 26 Section 43B dues</strong>, <strong>Clause 31 Section 269SS/T cash loans</strong>, and <strong>Clause 32/40 loss carry-forwards & quantitative ratios</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold">
              Form 3CD JSON Export Ready
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ICDS_CLAUSE13')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'ICDS_CLAUSE13'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. Clause 13(d) ICDS Adjustments</span>
        </button>

        <button
          onClick={() => setActiveTab('DISALLOWANCES_CLAUSE21')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'DISALLOWANCES_CLAUSE21'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>2. Clause 21 Disallowances (40(a)(ia)/40A(3))</span>
        </button>

        <button
          onClick={() => setActiveTab('STATUTORY_DUES_SEC43B')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'STATUTORY_DUES_SEC43B'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>3. Clause 26 Sec 43B Dues (EPF/GST/Bonus)</span>
        </button>

        <button
          onClick={() => setActiveTab('CASH_LOANS_CLAUSE31')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'CASH_LOANS_CLAUSE31'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>4. Clause 31 (269SS/T Cash Loans)</span>
        </button>

        <button
          onClick={() => setActiveTab('LOSS_MATRIX_RATIOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'LOSS_MATRIX_RATIOS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>5. Clause 32 Losses &amp; Clause 40 Ratios</span>
        </button>
      </div>

      {/* TAB 1: Clause 13(d) ICDS Adjustments */}
      {activeTab === 'ICDS_CLAUSE13' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-mono">Gross Increase in Profit</span>
              <span className="text-2xl font-black text-rose-400 font-mono">
                +₹{(icdsReport.totalIncreaseInProfit / 100000).toFixed(2)}L
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Taxable additions to PGBP</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-mono">Gross Decrease in Profit</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                -₹{(icdsReport.totalDecreaseInProfit / 100000).toFixed(2)}L
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Deductions under ICDS</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-mono">Net PGBP Adjustment</span>
              <span className="text-2xl font-black text-blue-400 font-mono">
                +₹{(icdsReport.netAdjustmentToTaxableProfit / 100000).toFixed(2)}L
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Flows to ITR-6 Schedule BP</p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              ICAI &amp; CBDT Standards (ICDS I through X) Audit Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px]">
                  <tr>
                    <th className="p-3">Standard Code &amp; Name</th>
                    <th className="p-3">Accounting Standard</th>
                    <th className="p-3 text-right">Increase in Profit (₹)</th>
                    <th className="p-3 text-right">Decrease in Profit (₹)</th>
                    <th className="p-3">Statutory Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {icdsReport.standards.map(s => (
                    <tr key={s.icdsNumber} className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans font-semibold text-white">
                        {s.icdsNumber.replace('_', ' ')}: {s.standardName}
                      </td>
                      <td className="p-3 text-slate-400">{s.accountingStandardEquivalent}</td>
                      <td className="p-3 text-right font-bold text-rose-400">
                        {s.increaseInProfitInr > 0 ? `+₹${s.increaseInProfitInr.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {s.decreaseInProfitInr > 0 ? `-₹${s.decreaseInProfitInr.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3 font-sans text-slate-300 text-[11px] leading-relaxed">
                        {s.statutoryReason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Clause 21 Disallowances */}
      {activeTab === 'DISALLOWANCES_CLAUSE21' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Clause 21(a): Section 40(a)(ia) TDS &amp; Section 40A(3) Cash Disallowances
                </h3>
                <p className="text-xs text-slate-400">Auto-identifies expenditure requiring add-back to Net Profit before Tax</p>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">
                Total Additions to P&amp;L: ₹{(clause21Report.grandTotalDisallowances / 100000).toFixed(2)}L
              </span>
            </div>

            <div className="space-y-3">
              {clause21Report.items.map(it => (
                <div key={it.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold font-sans text-white text-sm block">{it.partyName}</span>
                      <span className="text-[11px] text-slate-400">{it.ledgerHead} • Voucher: {it.voucherNumber} ({it.paymentDate})</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                      {it.disallowancePercentage}% Disallowance
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Gross Expenditure: ₹{it.totalGrossAmountInr.toLocaleString('en-IN')}</span>
                    <span className="font-bold text-rose-400 text-sm">
                      Disallowed u/s: ₹{it.disallowanceAmountInr.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-[11px] font-sans text-slate-300 mt-1">{it.statutoryReason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Clause 26 Section 43B Dues */}
      {activeTab === 'STATUTORY_DUES_SEC43B' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Clause 26: Section 43B Statutory Liabilities Audit
              </h3>
              <p className="text-xs text-slate-400">Verifies taxes, duties, and employee dues paid on or before ITR due date (31-Oct-2026)</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              Disallowance u/s 43B: ₹{clause26Report.totalDisallowedUnderSec43B.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
              <thead className="bg-slate-950/80 text-slate-400 text-[10px]">
                <tr>
                  <th className="p-3">Statutory Liability Head</th>
                  <th className="p-3 text-right">Balance as on 31-Mar</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3 text-center">Paid on or Before 139(1)?</th>
                  <th className="p-3 text-right">Disallowance u/s 43B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clause26Report.dues.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-semibold text-white">
                      {d.liabilityDescription}
                    </td>
                    <td className="p-3 text-right text-slate-200">
                      ₹{d.balanceAsOf31stMarchInr.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-slate-300">
                      {d.actualDateOfPayment || 'Unpaid'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.paidOnOrBeforeDueDate
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {d.paidOnOrBeforeDueDate ? 'YES (Allowed)' : 'NO (Disallowed)'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-rose-400">
                      {d.disallowanceAmountInr > 0 ? `₹${d.disallowanceAmountInr.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Clause 31 (269SS/T Cash Loans) */}
      {activeTab === 'CASH_LOANS_CLAUSE31' && (
        <Form3cdClause31Workbench />
      )}

      {/* TAB 5: Clause 32 Losses & Clause 40 Ratios */}
      {activeTab === 'LOSS_MATRIX_RATIOS' && (
        <div className="space-y-6">
          {/* Clause 32 Loss Carry Forward */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Clause 32: Brought Forward Loss &amp; Unabsorbed Depreciation Expiry Tracker
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px]">
                  <tr>
                    <th className="p-3">Assessment Year</th>
                    <th className="p-3">Loss Nature</th>
                    <th className="p-3 text-right">Original Loss</th>
                    <th className="p-3 text-center">Years Elapsed</th>
                    <th className="p-3 text-center">Statutory Expiry</th>
                    <th className="p-3 text-right">Set-off This Year</th>
                    <th className="p-3 text-right">Balance Carried Forward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {clause32Report.records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{r.assessmentYear}</td>
                      <td className="p-3 text-slate-300 font-sans">{r.lossCategory}</td>
                      <td className="p-3 text-right text-slate-200">₹{r.originalLossAmountInr.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center text-slate-400">{r.yearsCarriedForward}</td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {r.maxStatutoryCarryYears > 100 ? 'Indefinite u/s 32(2)' : `${r.maxStatutoryCarryYears} Years Limit`}
                        </span>
                      </td>
                      <td className="p-3 text-right text-emerald-400 font-bold">₹{r.lossSetOffCurrentYear.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-black text-cyan-300">₹{r.balanceLossCarriedForward.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clause 40 Accounting Ratios */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Clause 40: Mandatory Accounting &amp; Quantitative Ratios
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px]">
                  <tr>
                    <th className="p-3">Ratio Name &amp; Formula</th>
                    <th className="p-3 text-right">{clause40Report.currentFinancialYear}</th>
                    <th className="p-3 text-right">{clause40Report.precedingFinancialYear}</th>
                    <th className="p-3 text-center">Variance (pp)</th>
                    <th className="p-3">Auditor Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {clause40Report.ratios.map(r => (
                    <tr key={r.ratioName} className="hover:bg-slate-800/40">
                      <td className="p-3">
                        <span className="font-sans font-semibold text-white block">{r.ratioName}</span>
                        <span className="text-[10px] text-slate-500">{r.formulaDescription}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-white text-sm">{r.currentYearRatioPercent}%</td>
                      <td className="p-3 text-right text-slate-400">{r.precedingYearRatioPercent}%</td>
                      <td className="p-3 text-center font-bold text-purple-300">
                        {r.variationPercentagePoints > 0 ? `+${r.variationPercentagePoints}` : r.variationPercentagePoints}%
                      </td>
                      <td className="p-3 font-sans text-slate-300 text-[11px] leading-relaxed">
                        {r.auditorExplanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
