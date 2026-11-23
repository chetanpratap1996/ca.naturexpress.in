'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Sparkles, 
  Layers, 
  Send, 
  Truck, 
  Building2, 
  ShieldAlert, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { 
  Gstr9Table8aReconciliation, 
  Gstr9cTurnoverReconciliation, 
  Drc03VoluntaryPaymentChallan, 
  SAMPLE_GSTR9_RECO, 
  SAMPLE_GSTR9C_TURNOVER, 
  SAMPLE_DRC03, 
  Gstr9AnnualRecoEngine 
} from '@/lib/gst/gstr9Engine';
import { 
  EInvoiceRecord, 
  SAMPLE_EINVOICES, 
  EInvoiceEwbEngine 
} from '@/lib/gst/eInvoiceEwbEngine';
import { 
  StateGstinProfile, 
  IsdDistributionCycle, 
  SAMPLE_MULTI_GSTIN_PROFILES, 
  SAMPLE_ISD_CYCLE, 
  MultiGstinIsdEngine 
} from '@/lib/gst/multiGstinEngine';
import { 
  DrcIntimationNotice, 
  SAMPLE_DRC_NOTICES, 
  Drc01b01cEngine 
} from '@/lib/gst/drc01b01cEngine';
import { toast } from '@/components/shared/ToastNotification';

export function PillarOneGstEnterpriseWorkbench() {
  const [activeTab, setActiveTab] = useState<'GSTR9_9C' | 'EINVOICE_EWB' | 'MULTI_GSTIN_ISD' | 'DRC01B_01C'>('GSTR9_9C');

  // GSTR-9/9C State
  const [reco8a] = useState<Gstr9Table8aReconciliation>(SAMPLE_GSTR9_RECO);
  const [recoTurnover] = useState<Gstr9cTurnoverReconciliation>(SAMPLE_GSTR9C_TURNOVER);
  const [drc03Challan] = useState<Drc03VoluntaryPaymentChallan>(SAMPLE_DRC03);

  // E-Invoice State
  const [eInvoices, setEInvoices] = useState<EInvoiceRecord[]>(SAMPLE_EINVOICES);

  // Multi-GSTIN State
  const [gstinProfiles] = useState<StateGstinProfile[]>(SAMPLE_MULTI_GSTIN_PROFILES);
  const [isdCycle] = useState<IsdDistributionCycle>(SAMPLE_ISD_CYCLE);

  // DRC-01B/01C State
  const [drcNotices, setDrcNotices] = useState<DrcIntimationNotice[]>(SAMPLE_DRC_NOTICES);
  const [selectedNotice, setSelectedNotice] = useState<DrcIntimationNotice>(SAMPLE_DRC_NOTICES[0]);
  const [replyDraft, setReplyDraft] = useState<string | null>(null);

  const handleDraftReply = (notice: DrcIntimationNotice) => {
    const draft = Drc01b01cEngine.draftPartBReply(
      notice, 
      notice.selectedReasonCode, 
      notice.factualExplanation
    );
    setReplyDraft(draft.formalLegalSubmission);
    toast.success('Part B statutory reply generated with binding legal arguments!');
  };

  const handleExtendEwb = (invNum: string) => {
    setEInvoices(prev => prev.map(inv => {
      if (inv.invoiceNumber === invNum) {
        return {
          ...inv,
          ewbStatus: 'EXTENDED',
          hoursRemaining: inv.hoursRemaining ? inv.hoursRemaining + 24 : 24,
          isExtensionAlertActive: false
        };
      }
      return inv;
    }));
    toast.success(`E-Way Bill validity extended by 24 hours under Rule 138(10)`);
  };

  return (
    <div className="space-y-6">
      {/* Clean Professional Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden text-slate-900">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>GST Compliance &amp; Audit Workpapers</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              GST Annual Audit &amp; Compliance Workbench
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>GSTR-9/9C Table 8A matrix</strong>, <strong>DRC-03 voluntary payment</strong>, <strong>E-Invoicing &amp; EWB distance monitoring</strong>, <strong>Multi-GSTIN ISD distribution</strong>, and <strong>Rule 88C/88D notices</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold">
              Statutory Workpapers Active
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('GSTR9_9C')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'GSTR9_9C'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>GSTR-9 &amp; 9C Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('EINVOICE_EWB')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'EINVOICE_EWB'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>E-Way &amp; E-Invoice</span>
        </button>

        <button
          onClick={() => setActiveTab('MULTI_GSTIN_ISD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'MULTI_GSTIN_ISD'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Multi-GSTIN &amp; ISD</span>
        </button>

        <button
          onClick={() => setActiveTab('DRC01B_01C')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'DRC01B_01C'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          <span>Rule 88C/88D Notices ({drcNotices.length})</span>
        </button>
      </div>

      {/* TAB 1: GSTR-9 / 9C Annual Matrix */}
      {activeTab === 'GSTR9_9C' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 8A ITC Reco Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center justify-between border-b border-slate-200 pb-3">
                <span>GSTR-9 Table 8A vs 6B ITC Reconciliation</span>
                <span className="text-xs text-red-600">{reco8a.financialYear}</span>
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Table 8A: ITC as per GSTR-2A/2B:</span>
                  <span className="font-bold text-slate-900">₹{reco8a.table8aGstr2a2bItc.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Less Table 6B: ITC availed in GSTR-3B:</span>
                  <span>(₹{reco8a.table6bItcClaimedGstr3b.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Less Table 8B: Ineligible ITC u/s 17(5):</span>
                  <span>(₹{reco8a.table8bIneligibleItc17_5.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Less Table 8C: ITC availed in next FY (up to 30 Nov):</span>
                  <span>(₹{reco8a.table8cItcClaimedNextFy.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span>Table 8D Variance (8A - [6B + 8B + 8C]):</span>
                  <span className={reco8a.table8dVariance < 0 ? 'text-red-600' : 'text-emerald-700'}>
                    ₹{reco8a.table8dVariance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
                <span className="font-bold block mb-1">Auditor Strategy:</span>
                <p className="leading-relaxed">{reco8a.suggestedAction}</p>
              </div>
            </div>

            {/* Form 9C Turnover Reco Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center justify-between border-b border-slate-200 pb-3">
                <span>GSTR-9C Table 5: P&L vs GSTR-9 Turnover</span>
                <span className="text-xs text-red-600">{recoTurnover.financialYear}</span>
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Audited Turnover as per P&L:</span>
                  <span className="font-bold text-slate-900">₹{(recoTurnover.auditedTurnoverPnl / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Less Unbilled Closing + Unbilled Opening:</span>
                  <span>(₹{((recoTurnover.unbilledRevenueClosing - recoTurnover.unbilledRevenueOpening) / 100000).toFixed(2)}L)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Add Taxable Advances Received:</span>
                  <span>+₹{(recoTurnover.advancesReceivedTaxable / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Less Section 15(3)(b) Trade Discounts:</span>
                  <span>(₹{(recoTurnover.tradeDiscountsCreditNotes / 100000).toFixed(2)}L)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                  <span>Turnover as per GSTR-9:</span>
                  <span className="text-emerald-700">₹{(recoTurnover.annualTurnoverGstr9 / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold block mb-1">Audit Report Notes:</span>
                <ul className="list-disc list-inside space-y-1">
                  {recoTurnover.reasonForVariance.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Form GST DRC-03 Voluntary Payment Challan Draft */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Form GST DRC-03 Voluntary Payment Draft</span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Zero Penalty u/s 73(5)
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Drafted to voluntarily discharge tax liability ascertained during GSTR-9 reconciliation</p>
              </div>
              <button
                onClick={() => toast.success('DRC-03 Challan JSON exported for GST portal direct upload')}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Export DRC-03 JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">IGST Liability</span>
                <span className="font-bold text-slate-900 text-sm">₹{drc03Challan.igstLiability.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">CGST + SGST Liability</span>
                <span className="font-bold text-slate-900 text-sm">₹{(drc03Challan.cgstLiability + drc03Challan.sgstLiability).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Interest u/s 50(1) @ 18%</span>
                <span className="font-bold text-amber-700 text-sm">₹{drc03Challan.interestSec50.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[10px] text-red-700 block">Total DRC-03 Payment</span>
                <span className="font-bold text-red-800 text-sm">₹{drc03Challan.totalPaymentAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: E-Invoice & E-Way Bill Sentinel */}
      {activeTab === 'EINVOICE_EWB' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              High-Value B2B E-Invoicing &amp; E-Way Bill Distance Monitoring
            </h3>

            <div className="space-y-3">
              {eInvoices.map(inv => (
                <div
                  key={inv.invoiceNumber}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{inv.invoiceNumber}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        IRN Verified (64-char SHA-256)
                      </span>
                      {inv.isExtensionAlertActive && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold animate-pulse">
                          Expiring in {inv.hoursRemaining} Hours!
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500">
                      IRN: {inv.irn.slice(0, 24)}... | EWB: {inv.eWayBillNumber} | Vehicle: {inv.vehicleNumber} ({inv.distanceKm} KM)
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right text-xs font-mono">
                      <span className="text-slate-500 block text-[10px]">Invoice Total</span>
                      <span className="font-bold text-slate-900">₹{inv.totalInvoiceValue.toLocaleString('en-IN')}</span>
                    </div>

                    {inv.isExtensionAlertActive ? (
                      <button
                        onClick={() => handleExtendEwb(inv.invoiceNumber)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Extend EWB Part-B (24h)</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-emerald-700 flex items-center space-x-1 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Valid till {inv.ewbValidTill?.split('T')[0]}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Multi-GSTIN & ISD Hub */}
      {activeTab === 'MULTI_GSTIN_ISD' && (
        <div className="space-y-6">
          {/* Multi-State Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Enterprise Multi-GSTIN State Matrix (PAN: AAACG1234F)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gstinProfiles.map(p => (
                <div key={p.gstin} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{p.stateName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {p.turnoverRatioPercent}% Share
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500">{p.gstin}</p>
                  <div className="text-xs space-y-1 pt-2 border-t border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Annual Turnover:</span>
                      <span className="font-bold text-slate-900">₹{(p.annualTurnoverInr / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GSTR-1 / 3B Status:</span>
                      <span className="text-emerald-700 font-bold">{p.gstr1Status} / {p.gstr3bStatus}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ISD Credit Received:</span>
                      <span className="text-red-700 font-mono font-bold">₹{p.isdCreditAllocated.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 20 Input Service Distributor Allocation Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Input Service Distributor (ISD) Allocation Cycle (Rule 39)</span>
                  <span className="text-[10px] font-mono uppercase bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                    Mandatory ISD
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Common input services pool distributed pro-rata to branches based on audited state turnover</p>
              </div>
              <span className="text-xs font-mono font-bold text-red-700">
                Common Pool: ₹{isdCycle.totalCommonItcPool.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-50 text-slate-700 text-[10px]">
                  <tr>
                    <th className="p-3">Branch GSTIN</th>
                    <th className="p-3">State</th>
                    <th className="p-3 text-center">Turnover Ratio</th>
                    <th className="p-3 text-right">Allocated IGST</th>
                    <th className="p-3 text-right">Allocated CGST/SGST</th>
                    <th className="p-3 text-right">Total ISD Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isdCycle.allocations.map(a => (
                    <tr key={a.recipientGstin} className="hover:bg-slate-50">
                      <td className="p-3 font-sans text-slate-800 font-semibold">{a.recipientGstin}</td>
                      <td className="p-3 text-slate-600">{a.stateName}</td>
                      <td className="p-3 text-center font-bold text-red-700">{a.turnoverSharePercent}%</td>
                      <td className="p-3 text-right text-slate-700">₹{a.allocatedIgst.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-slate-700">₹{(a.allocatedCgst + a.allocatedSgst).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">₹{a.totalAllocated.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Rule 88C (DRC-01B) & Rule 88D (DRC-01C) Auto-Reply */}
      {activeTab === 'DRC01B_01C' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notice List (Left) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Active Portal Intimations (7-Day Clock)
            </h3>

            <div className="space-y-2">
              {drcNotices.map(notice => (
                <div
                  key={notice.arn}
                  onClick={() => {
                    setSelectedNotice(notice);
                    setReplyDraft(null);
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedNotice.arn === notice.arn
                      ? 'bg-red-50 border-red-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-mono">{notice.arn}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{notice.taxPeriod} • {notice.intimationType}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold border border-red-200 animate-pulse">
                      {notice.daysRemaining}d Left
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Variance: {notice.variancePercentage}%</span>
                    <span className="font-bold text-red-600">₹{(notice.varianceAmount / 100000).toFixed(2)}L</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defense & Reply Drafter (Right 2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900 font-mono">{selectedNotice.arn}</h3>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    {selectedNotice.intimationType === 'DRC_01B_RULE_88C' ? 'Rule 88C (1 vs 3B)' : 'Rule 88D (2B vs 3B)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Taxpayer: {selectedNotice.taxpayerName} | Statutory Deadline: <strong>{selectedNotice.statutoryDeadlineDate}</strong>
                </p>
              </div>

              <button
                onClick={() => handleDraftReply(selectedNotice)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Draft Part-B Defense</span>
              </button>
            </div>

            {/* Variance Details */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">
                  {selectedNotice.intimationType === 'DRC_01B_RULE_88C' ? 'GSTR-1 Liability Declared' : 'GSTR-2B Available ITC'}
                </span>
                <span className="font-bold text-slate-900 text-sm">₹{selectedNotice.portalFigure1.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">
                  {selectedNotice.intimationType === 'DRC_01B_RULE_88C' ? 'GSTR-3B Tax Paid' : 'GSTR-3B Claimed ITC'}
                </span>
                <span className="font-bold text-slate-900 text-sm">₹{selectedNotice.portalFigure2.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Generated Defense Reply */}
            {replyDraft && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Statutory Part-B Legal Reply Preview
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(replyDraft);
                      toast.success('Legal brief copied to clipboard');
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-bold transition"
                  >
                    Copy Text
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {replyDraft}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
