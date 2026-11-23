'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  Filter, 
  RefreshCw, 
  ShieldAlert, 
  FileCheck2, 
  ArrowRight,
  TrendingDown,
  Layers,
  Search
} from 'lucide-react';
import { 
  ImsInvoiceItem, 
  Rule37ARecord, 
  SAMPLE_IMS_INVOICES, 
  SAMPLE_RULE_37A_RECORDS, 
  GstImsEngine,
  ImsActionType 
} from '@/lib/gst/imsEngine';
import { toast } from '@/components/shared/ToastNotification';

export function GstImsWorkbench() {
  const [activeTab, setActiveTab] = useState<'IMS_INVOICES' | 'RULE_37A'>('IMS_INVOICES');
  const [invoices, setInvoices] = useState<ImsInvoiceItem[]>(SAMPLE_IMS_INVOICES);
  const [rule37aList, setRule37aList] = useState<Rule37ARecord[]>(() => 
    GstImsEngine.evaluateRule37A(SAMPLE_RULE_37A_RECORDS)
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPT' | 'REJECT' | 'MISMATCH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = GstImsEngine.computeSummary(invoices, rule37aList);

  const handleActionChange = (id: string, action: ImsActionType) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          currentAction: action,
          actionTimestamp: new Date().toISOString(),
          actionBy: 'CA. Partner (Manual Override)'
        };
      }
      return inv;
    }));
    toast.success(`Invoice action updated to ${action}`);
  };

  const handleBatchAcceptClean = () => {
    let count = 0;
    setInvoices(prev => prev.map(inv => {
      if (inv.matchingStatus === 'EXACT_MATCH' && inv.currentAction !== 'ACCEPT') {
        count++;
        return {
          ...inv,
          currentAction: 'ACCEPT',
          actionTimestamp: new Date().toISOString(),
          actionBy: 'AI Auto-Recommender (Batch Approved)'
        };
      }
      return inv;
    }));
    toast.success(`Batch Accepted ${count} exact-matched invoices`);
  };

  const handleBatchRejectMismatches = () => {
    let count = 0;
    setInvoices(prev => prev.map(inv => {
      if (inv.matchingStatus === 'VALUE_MISMATCH' && inv.currentAction !== 'REJECT') {
        count++;
        return {
          ...inv,
          currentAction: 'REJECT',
          actionTimestamp: new Date().toISOString(),
          actionBy: 'AI Auto-Recommender (Variance Gate)'
        };
      }
      return inv;
    }));
    toast.success(`Batch Rejected ${count} mismatched invoices`);
  };

  const handleSendVendorReminder = (recordId: string, supplierName: string) => {
    setRule37aList(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          vendorNotified: true,
          vendorLastReminderDate: new Date().toISOString().split('T')[0]
        };
      }
      return r;
    }));
    toast.success(`Statutory Rule 37A notice dispatched via WhatsApp to ${supplierName}`);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === 'PENDING' && inv.currentAction !== 'PENDING') return false;
    if (statusFilter === 'ACCEPT' && inv.currentAction !== 'ACCEPT') return false;
    if (statusFilter === 'REJECT' && inv.currentAction !== 'REJECT') return false;
    if (statusFilter === 'MISMATCH' && inv.matchingStatus !== 'VALUE_MISMATCH') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.supplierTradeName.toLowerCase().includes(q) ||
        inv.supplierGstin.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner - Clean Professional Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Invoice Management System • 14th Cutoff Radar</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              GST IMS &amp; Rule 37A Action Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Recipient statutory actions (<strong>Accept</strong>, <strong>Reject</strong>, <strong>Keep Pending</strong>) before the 14th cutoff to dictate GSTR-2B generation. Track Rule 37A supplier GSTR-3B defaults to eliminate Section 50(1) interest liabilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={handleBatchAcceptClean}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Batch Accept Exact Matches</span>
            </button>

            <button
              onClick={handleBatchRejectMismatches}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Batch Reject Mismatches</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            IMS Accepted ITC (GSTR-2B)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700">
              ₹{(stats.acceptedItc / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-slate-500">({stats.acceptedCount} Invoices)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Flows to GSTR-3B Table 4(A)(5)</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            IMS Rejected / Variance
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-red-600">
              ₹{(stats.rejectedItc / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-slate-500">({stats.rejectedCount} Invoices)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Blocked from 2B; Supplier must amend</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            IMS Kept Pending
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-800">
              ₹{(stats.pendingItc / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-slate-500">({stats.pendingCount} Invoices)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rolls forward to next tax period</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Rule 37A At-Risk ITC
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-red-600">
              ₹{(stats.rule37aAtRiskAmount / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-red-600 font-bold">18% p.a.</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Supplier default in GSTR-3B</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('IMS_INVOICES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'IMS_INVOICES'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Active IMS Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RULE_37A')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'RULE_37A'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>Rule 37A 180-Day Reversal Tracker ({rule37aList.length})</span>
        </button>
      </div>

      {/* TAB 1: IMS Invoices Table */}
      {activeTab === 'IMS_INVOICES' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search supplier, GSTIN, invoice..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full sm:w-64"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {(['ALL', 'PENDING', 'ACCEPT', 'REJECT', 'MISMATCH'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    statusFilter === f
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending Action' : f === 'ACCEPT' ? 'Accepted' : f === 'REJECT' ? 'Rejected' : 'Mismatches'}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Grid */}
          <div className="space-y-3">
            {filteredInvoices.map(inv => (
              <div
                key={inv.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-red-300 transition space-y-3 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{inv.supplierTradeName}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {inv.invoiceType}
                      </span>
                      {inv.itcEligibility === 'INELIGIBLE_17_5' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
                          Sec 17(5) Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      GSTIN: {inv.supplierGstin} • Inv: {inv.invoiceNumber} • Date: {inv.invoiceDate}
                    </p>
                  </div>

                  {/* Recipient Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleActionChange(inv.id, 'ACCEPT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border ${
                        inv.currentAction === 'ACCEPT'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>

                    <button
                      onClick={() => handleActionChange(inv.id, 'REJECT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border ${
                        inv.currentAction === 'REJECT'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-red-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleActionChange(inv.id, 'PENDING')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border ${
                        inv.currentAction === 'PENDING'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-amber-800'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </button>
                  </div>
                </div>

                {/* Financial Values & AI Recommendation Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block mb-0.5">Portal Invoice Value</span>
                    <span className="font-mono text-slate-800">
                      Taxable: ₹{inv.taxableValue.toLocaleString('en-IN')} | Tax: <strong className="text-red-600">₹{inv.totalTax.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block mb-0.5">Books of Accounts Match</span>
                    <span className="font-mono text-slate-800">
                      {inv.bookTaxableValue ? (
                        <>Taxable: ₹{inv.bookTaxableValue.toLocaleString('en-IN')} | Diff: <span className={inv.varianceAmount === 0 ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>₹{inv.varianceAmount?.toLocaleString('en-IN')}</span></>
                      ) : (
                        <span className="text-amber-800 font-bold">Not Found in Purchase Register</span>
                      )}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">
                        AI Recommendation: {inv.recommendedAction}
                      </span>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        {inv.recommendationReason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Rule 37A 180-Day Reversal Tracker */}
      {activeTab === 'RULE_37A' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Rule 37A Statutory Reversal Ledger (FY 2024-25 / 2025-26)</span>
                  <span className="text-[10px] font-mono uppercase bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                    Statutory Guard
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  If vendor files GSTR-1 but does not file GSTR-3B by 30th November of subsequent FY, recipient MUST reverse ITC in Table 4(B)(2). Reclaimable without interest in Table 4(A)(5) when filed!
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-100 text-slate-700 text-[10px]">
                  <tr>
                    <th className="p-3">Supplier Name &amp; GSTIN</th>
                    <th className="p-3">Invoice &amp; FY</th>
                    <th className="p-3 text-right">ITC Claimed</th>
                    <th className="p-3 text-center">Supplier 3B</th>
                    <th className="p-3">Statutory Deadline</th>
                    <th className="p-3 text-right">Sec 50 Interest</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rule37aList.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-sans font-semibold text-slate-900 block">{rec.supplierName}</span>
                        <span className="text-[10px] text-slate-500">{rec.supplierGstin}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-800 block">{rec.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-500">{rec.financialYear}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        ₹{rec.itcClaimedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.supplierGstr3bStatus === 'FILED' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                        }`}>
                          {rec.supplierGstr3bStatus}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {rec.reversalDeadline}
                      </td>
                      <td className="p-3 text-right">
                        {rec.interestExposure > 0 ? (
                          <span className="font-bold text-red-600">₹{rec.interestExposure.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">₹0</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {rec.supplierGstr3bStatus === 'NOT_FILED' ? (
                          <button
                            onClick={() => handleSendVendorReminder(rec.id, rec.supplierName)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center space-x-1.5 shadow-sm mx-auto transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>{rec.vendorNotified ? 'Re-send WhatsApp' : 'Dispatch Notice'}</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-semibold flex items-center justify-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Re-claimed in 4A(5)</span>
                          </span>
                        )}
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
