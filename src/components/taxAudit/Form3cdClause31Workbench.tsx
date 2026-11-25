'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Sparkles, 
  Search, 
  Filter,
  DollarSign
} from 'lucide-react';
import { 
  Clause31AuditSummary, 
  CashLoanRecord, 
  SAMPLE_CLAUSE_31_DATA 
} from '@/lib/taxAudit/clause31CashLoanEngine';

export function Form3cdClause31Workbench() {
  const [data] = useState<Clause31AuditSummary>({ totalTransactionsScanned: 0, totalViolationsFound: 0, totalViolationAmount: 0, potentialPenalty271D_E: 0, compliantAmount: 0, records: [] });
  const [filter, setFilter] = useState<'ALL' | 'VIOLATIONS' | 'COMPLIANT'>('ALL');
  const [search, setSearch] = useState('');

  const filteredRecords = data.records.filter(r => {
    if (filter === 'VIOLATIONS' && !r.isViolation) return false;
    if (filter === 'COMPLIANT' && r.isViolation) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.partyName.toLowerCase().includes(q) ||
        (r.partyPan && r.partyPan.toLowerCase().includes(q)) ||
        r.modeOfPayment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner - White & Brand Red */}
      <div className="bg-white border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>Tax Audit Form 3CD Forensic Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Clause 31: Section 269SS &amp; 269T Cash Loan Forensic Inspector
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Detects cash loan receipts &amp; repayments &ge; ₹20,000 attracting <strong>100% penalty u/s 271D and 271E</strong>. Auto-formats statutory reporting annexures for Clauses 31(a), (b), (ba), and (bb).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Form 3CD Annexure</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Scanned Transactions
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{data.totalTransactionsScanned}</span>
            <span className="text-xs font-mono text-slate-500">Ledger Vouchers</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unsecured Loans &amp; Advances</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Section 269SS/T Violations
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-red-600">{data.totalViolationsFound}</span>
            <span className="text-xs font-mono text-red-600 font-bold">100% Penalty</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cash / Bearer &ge; ₹20,000</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Violation Exposure (₹)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-800">
              ₹{(data.totalViolationAmount / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-amber-700">Sum of Dues</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Section 271D &amp; 271E risk</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Compliant Banking Sum
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700">
              ₹{(data.compliantAmount / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-emerald-700">Clean RTGS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Clause 31(ba) &amp; (bb) verified</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search party name, PAN, payment mode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full sm:w-64"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            {(['ALL', 'VIOLATIONS', 'COMPLIANT'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filter === f
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f === 'ALL' ? 'All Transactions' : f === 'VIOLATIONS' ? 'Violations Only' : 'Compliant'}
              </button>
            ))}
          </div>
        </div>

        {/* The Forensic Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
            <thead className="bg-slate-100 text-slate-700 text-[10px]">
              <tr>
                <th className="p-3">Party Name, PAN &amp; Address</th>
                <th className="p-3">Nature of Transaction</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3">Reporting Clause</th>
                <th className="p-3">Auditor Observation / Penalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <span className="font-sans font-semibold text-slate-900 block">{rec.partyName}</span>
                    <span className="text-[10px] text-slate-500">{rec.partyPan || 'PAN Not Available'} • {rec.partyAddress}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.transactionType === 'TAKEN_269SS' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {rec.transactionType === 'TAKEN_269SS' ? 'Loan / Deposit Taken' : 'Loan Repayment'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">{rec.transactionDate}</span>
                  </td>
                  <td className="p-3">
                    <span className={`font-bold ${rec.modeOfPayment === 'CASH' || rec.modeOfPayment === 'BEARER_CHEQUE' ? 'text-red-600' : 'text-emerald-700'}`}>
                      {rec.modeOfPayment}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 text-sm">
                    ₹{rec.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 font-semibold text-red-600">
                    {rec.statutoryClause}
                  </td>
                  <td className="p-3">
                    <span className={`text-[11px] block font-sans ${rec.isViolation ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                      {rec.auditorRemarks}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
