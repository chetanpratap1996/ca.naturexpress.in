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
  DollarSign,
  Download
} from 'lucide-react';
import { useClientContext } from '@/lib/context/ClientContext';
import { UniversalClientSelector } from '@/components/shared/UniversalClientSelector';
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
  const { selectedClient, selectedAy, isFirmWideView } = useClientContext();
  const [activeTab, setActiveTab] = useState<'ICDS_CLAUSE13' | 'DISALLOWANCES_CLAUSE21' | 'STATUTORY_DUES_SEC43B' | 'CASH_LOANS_CLAUSE31' | 'LOSS_MATRIX_RATIOS'>('ICDS_CLAUSE13');

  // State
  const [icdsReport] = useState<IcdsClause13AuditReport>(SAMPLE_ICDS_REPORT);
  const [clause21Report] = useState<Clause21SummaryReport>(SAMPLE_CLAUSE_21_REPORT);
  const [clause26Report] = useState<Clause26AuditReport>(SAMPLE_CLAUSE_26_DATA);
  const [clause32Report] = useState<Clause32SummaryReport>(SAMPLE_CLAUSE_32_RECORDS);
  const [clause40Report] = useState<Clause40RatiosReport>(SAMPLE_CLAUSE_40_REPORT);

  const handleExportForm3CdJson = () => {
    const pan = selectedClient?.pan || "AANCP9915B";
    const name = selectedClient?.name || "Client Assessee";
    const ay = selectedAy || "2026-27";
    const payload = {
      form: "3CD",
      assessmentYear: ay,
      pan,
      assesseeName: name,
      section44AB: true,
      clause13d: {
        totalIncrease: icdsReport.totalIncreaseInProfit,
        totalDecrease: icdsReport.totalDecreaseInProfit,
        netAdjustment: icdsReport.netAdjustmentToTaxableProfit,
        standards: icdsReport.standards
      },
      clause21: {
        totalDisallowances: clause21Report.grandTotalDisallowances,
        breakdown: clause21Report.items
      },
      clause26: {
        sec43bSummary: clause26Report
      },
      auditCertification: {
        auditorName: "CA Gunjan Jain (FCA)",
        frn: "022998C",
        timestamp: new Date().toISOString()
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `Form3CD_${pan}_AY_${ay}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast.success("Form 3CD Exported", `Downloaded Form3CD_${pan}_AY_${ay}.json ready for Income Tax portal.`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Enterprise Simplicity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Tax Audit &bull; Section 44AB</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Form 3CD Tax Audit Workpapers &amp; Reporting
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <UniversalClientSelector variant="compact" />
            <button
              onClick={handleExportForm3CdJson}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Form 3CD JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ICDS_CLAUSE13')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'ICDS_CLAUSE13'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Clause 13(d) ICDS Adjustments</span>
        </button>

        <button
          onClick={() => setActiveTab('DISALLOWANCES_CLAUSE21')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'DISALLOWANCES_CLAUSE21'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>Clause 21 Disallowances (40(a)(ia)/40A(3))</span>
        </button>

        <button
          onClick={() => setActiveTab('STATUTORY_DUES_SEC43B')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'STATUTORY_DUES_SEC43B'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Clause 26 Sec 43B Dues (EPF/GST/Bonus)</span>
        </button>

        <button
          onClick={() => setActiveTab('CASH_LOANS_CLAUSE31')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'CASH_LOANS_CLAUSE31'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>Clause 31 (269SS/T Cash Loans)</span>
        </button>

        <button
          onClick={() => setActiveTab('LOSS_MATRIX_RATIOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'LOSS_MATRIX_RATIOS'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Clause 32 Losses &amp; Clause 40 Ratios</span>
        </button>
      </div>

      {/* TAB 1: Clause 13(d) ICDS Adjustments */}
      {activeTab === 'ICDS_CLAUSE13' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 block font-mono">Gross Increase in Profit</span>
              <span className="text-2xl font-black text-red-600 font-mono">
                +₹{(icdsReport.totalIncreaseInProfit / 100000).toFixed(2)}L
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Taxable additions to PGBP</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 block font-mono">Gross Decrease in Profit</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                -₹{(icdsReport.totalDecreaseInProfit / 100000).toFixed(2)}L
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Deductions under ICDS</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-500 block font-mono">Net PGBP Adjustment</span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                +₹{(icdsReport.netAdjustmentToTaxableProfit / 100000).toFixed(2)}L
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Flows to ITR-6 Schedule BP</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              ICAI &amp; CBDT Standards (ICDS I through X) Audit Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-100 text-slate-700 text-[10px]">
                  <tr>
                    <th className="p-3">Standard Code &amp; Name</th>
                    <th className="p-3">Accounting Standard</th>
                    <th className="p-3 text-right">Increase in Profit (₹)</th>
                    <th className="p-3 text-right">Decrease in Profit (₹)</th>
                    <th className="p-3">Statutory Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {icdsReport.standards.map(s => (
                    <tr key={s.icdsNumber} className="hover:bg-slate-50">
                      <td className="p-3 font-sans font-semibold text-slate-900">
                        {s.icdsNumber.replace('_', ' ')}: {s.standardName}
                      </td>
                      <td className="p-3 text-slate-500">{s.accountingStandardEquivalent}</td>
                      <td className="p-3 text-right font-bold text-red-600">
                        {s.increaseInProfitInr > 0 ? `+₹${s.increaseInProfitInr.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {s.decreaseInProfitInr > 0 ? `-₹${s.decreaseInProfitInr.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3 font-sans text-slate-600 text-[11px] leading-relaxed">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Clause 21(a): Section 40(a)(ia) TDS &amp; Section 40A(3) Cash Disallowances
                </h3>
                <p className="text-xs text-slate-500">Auto-identifies expenditure requiring add-back to Net Profit before Tax</p>
              </div>
              <span className="text-xs font-mono font-bold text-red-600">
                Total Additions to P&amp;L: ₹{(clause21Report.grandTotalDisallowances / 100000).toFixed(2)}L
              </span>
            </div>

            <div className="space-y-3">
              {clause21Report.items.map(it => (
                <div key={it.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold font-sans text-slate-900 text-sm block">{it.partyName}</span>
                      <span className="text-[11px] text-slate-500">{it.ledgerHead} • Voucher: {it.voucherNumber} ({it.paymentDate})</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold">
                      {it.disallowancePercentage}% Disallowance
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Gross Expenditure: ₹{it.totalGrossAmountInr.toLocaleString('en-IN')}</span>
                    <span className="font-bold text-red-600 text-sm">
                      Disallowed u/s: ₹{it.disallowanceAmountInr.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-[11px] font-sans text-slate-600 mt-1">{it.statutoryReason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Clause 26 Section 43B Dues */}
      {activeTab === 'STATUTORY_DUES_SEC43B' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Clause 26: Section 43B Statutory Liabilities Audit
              </h3>
              <p className="text-xs text-slate-500">Verifies taxes, duties, and employee dues paid on or before ITR due date (31-Oct-2026)</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-800">
              Disallowance u/s 43B: ₹{clause26Report.totalDisallowedUnderSec43B.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
              <thead className="bg-slate-100 text-slate-700 text-[10px]">
                <tr>
                  <th className="p-3">Statutory Liability Head</th>
                  <th className="p-3 text-right">Balance as on 31-Mar</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3 text-center">Paid on or Before 139(1)?</th>
                  <th className="p-3 text-right">Disallowance u/s 43B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {clause26Report.dues.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-semibold text-slate-900">
                      {d.liabilityDescription}
                    </td>
                    <td className="p-3 text-right text-slate-800">
                      ₹{d.balanceAsOf31stMarchInr.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-slate-600">
                      {d.actualDateOfPayment || 'Unpaid'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.paidOnOrBeforeDueDate
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {d.paidOnOrBeforeDueDate ? 'YES (Allowed)' : 'NO (Disallowed)'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-red-600">
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Clause 32: Brought Forward Loss &amp; Unabsorbed Depreciation Expiry Tracker
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-100 text-slate-700 text-[10px]">
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
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {clause32Report.records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{r.assessmentYear}</td>
                      <td className="p-3 text-slate-600 font-sans">{r.lossCategory}</td>
                      <td className="p-3 text-right text-slate-800">₹{r.originalLossAmountInr.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center text-slate-500">{r.yearsCarriedForward}</td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {r.maxStatutoryCarryYears > 100 ? 'Indefinite u/s 32(2)' : `${r.maxStatutoryCarryYears} Years Limit`}
                        </span>
                      </td>
                      <td className="p-3 text-right text-emerald-700 font-bold">₹{r.lossSetOffCurrentYear.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-black text-slate-900">₹{r.balanceLossCarriedForward.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clause 40 Accounting Ratios */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Clause 40: Mandatory Accounting &amp; Quantitative Ratios
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-100 text-slate-700 text-[10px]">
                  <tr>
                    <th className="p-3">Ratio Name &amp; Formula</th>
                    <th className="p-3 text-right">{clause40Report.currentFinancialYear}</th>
                    <th className="p-3 text-right">{clause40Report.precedingFinancialYear}</th>
                    <th className="p-3 text-center">Variance (pp)</th>
                    <th className="p-3">Auditor Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {clause40Report.ratios.map(r => (
                    <tr key={r.ratioName} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-sans font-semibold text-slate-900 block">{r.ratioName}</span>
                        <span className="text-[10px] text-slate-500">{r.formulaDescription}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 text-sm">{r.currentYearRatioPercent}%</td>
                      <td className="p-3 text-right text-slate-500">{r.precedingYearRatioPercent}%</td>
                      <td className="p-3 text-center font-bold text-red-600">
                        {r.variationPercentagePoints > 0 ? `+${r.variationPercentagePoints}` : r.variationPercentagePoints}%
                      </td>
                      <td className="p-3 font-sans text-slate-600 text-[11px] leading-relaxed">
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
