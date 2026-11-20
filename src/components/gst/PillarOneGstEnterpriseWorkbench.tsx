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
import { GstImsWorkbench } from '@/components/gst/GstImsWorkbench';
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
  const [activeTab, setActiveTab] = useState<'IMS_AND_37A' | 'GSTR9_9C' | 'EINVOICE_EWB' | 'MULTI_GSTIN_ISD' | 'DRC01B_01C'>('IMS_AND_37A');

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
      {/* Pillar Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Pillar I: Institutional GST 2.0 Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              GST 2.0 Real-World GSTN, IMS & Litigation Sentinel
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Complete end-to-end statutory orchestration: <strong>IMS (Invoice Management System)</strong>, <strong>Rule 37A 180-day reversal</strong>, <strong>GSTR-9/9C Table 8A matrix</strong>, <strong>E-Invoicing & EWB distance alert</strong>, <strong>Multi-GSTIN ISD distribution</strong>, and <strong>Rule 88C/88D auto-reply</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              100% Statutory Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('IMS_AND_37A')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'IMS_AND_37A'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1. IMS & Rule 37A Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('GSTR9_9C')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'GSTR9_9C'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>2. GSTR-9/9C & DRC-03 Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('EINVOICE_EWB')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'EINVOICE_EWB'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>3. E-Invoice & E-Way Bill Sentinel</span>
        </button>

        <button
          onClick={() => setActiveTab('MULTI_GSTIN_ISD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'MULTI_GSTIN_ISD'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>4. Multi-GSTIN & ISD Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('DRC01B_01C')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 ${
            activeTab === 'DRC01B_01C'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>5. Rule 88C/88D Auto-Reply ({drcNotices.length})</span>
        </button>
      </div>

      {/* TAB 1: IMS & Rule 37A */}
      {activeTab === 'IMS_AND_37A' && (
        <GstImsWorkbench />
      )}

      {/* TAB 2: GSTR-9 / 9C Annual Matrix */}
      {activeTab === 'GSTR9_9C' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 8A ITC Reco Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between border-b border-slate-800 pb-3">
                <span>GSTR-9 Table 8A vs 6B ITC Reconciliation</span>
                <span className="text-xs text-purple-400">{reco8a.financialYear}</span>
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Table 8A: ITC as per GSTR-2A/2B:</span>
                  <span className="font-bold text-white">₹{reco8a.table8aGstr2a2bItc.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Less Table 6B: ITC availed in GSTR-3B:</span>
                  <span>(₹{reco8a.table6bItcClaimedGstr3b.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Less Table 8B: Ineligible ITC u/s 17(5):</span>
                  <span>(₹{reco8a.table8bIneligibleItc17_5.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Less Table 8C: ITC availed in next FY (up to 30 Nov):</span>
                  <span>(₹{reco8a.table8cItcClaimedNextFy.toLocaleString('en-IN')})</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
                  <span>Table 8D Variance (8A - [6B + 8B + 8C]):</span>
                  <span className={reco8a.table8dVariance < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    ₹{reco8a.table8dVariance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200">
                <span className="font-bold block mb-1">Auditor Strategy:</span>
                <p className="leading-relaxed">{reco8a.suggestedAction}</p>
              </div>
            </div>

            {/* Form 9C Turnover Reco Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between border-b border-slate-800 pb-3">
                <span>GSTR-9C Table 5: P&L vs GSTR-9 Turnover</span>
                <span className="text-xs text-purple-400">{recoTurnover.financialYear}</span>
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Audited Turnover as per P&L:</span>
                  <span className="font-bold text-white">₹{(recoTurnover.auditedTurnoverPnl / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Less Unbilled Closing + Unbilled Opening:</span>
                  <span>(₹{((recoTurnover.unbilledRevenueClosing - recoTurnover.unbilledRevenueOpening) / 100000).toFixed(2)}L)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Add Taxable Advances Received:</span>
                  <span>+₹{(recoTurnover.advancesReceivedTaxable / 100000).toFixed(2)}L</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Less Section 15(3)(b) Trade Discounts:</span>
                  <span>(₹{(recoTurnover.tradeDiscountsCreditNotes / 100000).toFixed(2)}L)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm">
                  <span>Turnover as per GSTR-9:</span>
                  <span className="text-emerald-400">₹{(recoTurnover.annualTurnoverGstr9 / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Form GST DRC-03 Voluntary Payment Draft</span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Zero Penalty u/s 73(5)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Drafted to voluntarily discharge tax liability ascertained during GSTR-9 reconciliation</p>
              </div>
              <button
                onClick={() => toast.success('DRC-03 Challan JSON exported for GST portal direct upload')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-purple-600/25 transition"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Export DRC-03 JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">IGST Liability</span>
                <span className="font-bold text-white text-sm">₹{drc03Challan.igstLiability.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">CGST + SGST Liability</span>
                <span className="font-bold text-white text-sm">₹{(drc03Challan.cgstLiability + drc03Challan.sgstLiability).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Interest u/s 50(1) @ 18%</span>
                <span className="font-bold text-amber-400 text-sm">₹{drc03Challan.interestSec50.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40">
                <span className="text-[10px] text-purple-300 block">Total DRC-03 Payment</span>
                <span className="font-bold text-purple-200 text-sm">₹{drc03Challan.totalPaymentAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: E-Invoice & E-Way Bill Sentinel */}
      {activeTab === 'EINVOICE_EWB' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              High-Value B2B E-Invoicing & E-Way Bill Distance Monitoring
            </h3>

            <div className="space-y-3">
              {eInvoices.map(inv => (
                <div
                  key={inv.invoiceNumber}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{inv.invoiceNumber}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        IRN Verified (64-char SHA-256)
                      </span>
                      {inv.isExtensionAlertActive && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold animate-pulse">
                          Expiring in {inv.hoursRemaining} Hours!
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400">
                      IRN: {inv.irn.slice(0, 24)}... | EWB: {inv.eWayBillNumber} | Vehicle: {inv.vehicleNumber} ({inv.distanceKm} KM)
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right text-xs font-mono">
                      <span className="text-slate-400 block text-[10px]">Invoice Total</span>
                      <span className="font-bold text-white">₹{inv.totalInvoiceValue.toLocaleString('en-IN')}</span>
                    </div>

                    {inv.isExtensionAlertActive ? (
                      <button
                        onClick={() => handleExtendEwb(inv.invoiceNumber)}
                        className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 flex items-center space-x-1.5 transition"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Extend EWB Part-B (24h)</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Enterprise Multi-GSTIN State Matrix (PAN: AAACG1234F)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gstinProfiles.map(p => (
                <div key={p.gstin} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{p.stateName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {p.turnoverRatioPercent}% Share
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">{p.gstin}</p>
                  <div className="text-xs space-y-1 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-slate-300">
                      <span>Annual Turnover:</span>
                      <span className="font-bold">₹{(p.annualTurnoverInr / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>GSTR-1 / 3B Status:</span>
                      <span className="text-emerald-400 font-bold">{p.gstr1Status} / {p.gstr3bStatus}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>ISD Credit Received:</span>
                      <span className="text-purple-300 font-mono font-bold">₹{p.isdCreditAllocated.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 20 Input Service Distributor Allocation Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Input Service Distributor (ISD) Allocation Cycle (Rule 39)</span>
                  <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    Mandatory ISD
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Common input services pool distributed pro-rata to branches based on audited state turnover</p>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300">
                Common Pool: ₹{isdCycle.totalCommonItcPool.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px]">
                  <tr>
                    <th className="p-3">Branch GSTIN</th>
                    <th className="p-3">State</th>
                    <th className="p-3 text-center">Turnover Ratio</th>
                    <th className="p-3 text-right">Allocated IGST</th>
                    <th className="p-3 text-right">Allocated CGST/SGST</th>
                    <th className="p-3 text-right">Total ISD Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isdCycle.allocations.map(a => (
                    <tr key={a.recipientGstin} className="hover:bg-slate-800/40">
                      <td className="p-3 font-sans text-slate-300 font-semibold">{a.recipientGstin}</td>
                      <td className="p-3 text-slate-400">{a.stateName}</td>
                      <td className="p-3 text-center font-bold text-purple-300">{a.turnoverSharePercent}%</td>
                      <td className="p-3 text-right text-slate-200">₹{a.allocatedIgst.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-slate-200">₹{(a.allocatedCgst + a.allocatedSgst).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">₹{a.totalAllocated.toLocaleString('en-IN')}</td>
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
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
                      ? 'bg-purple-950/40 border-purple-500/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{notice.arn}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{notice.taxPeriod} • {notice.intimationType}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold animate-pulse">
                      {notice.daysRemaining}d Left
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Variance: {notice.variancePercentage}%</span>
                    <span className="font-bold text-rose-400">₹{(notice.varianceAmount / 100000).toFixed(2)}L</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defense & Reply Drafter (Right 2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white font-mono">{selectedNotice.arn}</h3>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {selectedNotice.intimationType === 'DRC_01B_RULE_88C' ? 'Rule 88C (1 vs 3B)' : 'Rule 88D (2B vs 3B)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Taxpayer: {selectedNotice.taxpayerName} | Statutory Deadline: <strong>{selectedNotice.statutoryDeadlineDate}</strong>
                </p>
              </div>

              <button
                onClick={() => handleDraftReply(selectedNotice)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-purple-600/30 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Draft Part-B Defense</span>
              </button>
            </div>

            {/* Variance Details */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">
                  {selectedNotice.intimationType === 'DRC_01B_RULE_88C' ? 'GSTR-1 Liability Declared' : 'GSTR-2B Available ITC'}
                </span>
                <span className="font-bold text-white text-sm">₹{selectedNotice.portalFigure1.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">
                  {selectedNotice.intimationType === 'DRC_01B_RULE_88C' ? 'GSTR-3B Tax Paid' : 'GSTR-3B Claimed ITC'}
                </span>
                <span className="font-bold text-white text-sm">₹{selectedNotice.portalFigure2.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Generated Defense Reply */}
            {replyDraft && (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">
                    Statutory Part-B Legal Reply Preview
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(replyDraft);
                      toast.success('Legal brief copied to clipboard');
                    }}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    Copy Text
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
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
