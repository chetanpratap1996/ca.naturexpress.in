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
  const [data] = useState<Clause31AuditSummary>(SAMPLE_CLAUSE_31_DATA);
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-rose-950 border border-amber-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Tax Audit Form 3CD Forensic Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Clause 31: Section 269SS & 269T Cash Loan Forensic Inspector
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Detects cash loan receipts & repayments $\ge ₹20,000$ attracting <strong>100% penalty u/s 271D and 271E</strong>. Auto-formats statutory reporting annexures for Clauses 31(a), (b), (ba), and (bb).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/25 flex items-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Form 3CD Annexure</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Scanned Transactions
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{data.totalTransactionsScanned}</span>
            <span className="text-xs font-mono text-slate-400">Ledger Vouchers</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unsecured Loans & Advances</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Section 269SS/T Violations
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-400">{data.totalViolationsFound}</span>
            <span className="text-xs font-mono text-rose-400 font-bold">100% Penalty</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cash / Bearer $\ge ₹20,000$</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Violation Exposure (₹)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-400">
              ₹{(data.totalViolationAmount / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-amber-300">Sum of Dues</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Section 271D & 271E risk</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Compliant Banking Sum
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">
              ₹{(data.compliantAmount / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-emerald-300">Clean RTGS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Clause 31(ba) & (bb) verified</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search party name, PAN, payment mode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none w-full sm:w-64"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            {(['ALL', 'VIOLATIONS', 'COMPLIANT'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filter === f
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'ALL' ? 'All Transactions' : f === 'VIOLATIONS' ? 'Violations Only' : 'Compliant'}
              </button>
            ))}
          </div>
        </div>

        {/* The Forensic Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
            <thead className="bg-slate-950/80 text-slate-400 text-[10px]">
              <tr>
                <th className="p-3">Party Name, PAN & Address</th>
                <th className="p-3">Nature of Transaction</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3">Reporting Clause</th>
                <th className="p-3">Auditor Observation / Penalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <span className="font-sans font-semibold text-white block">{rec.partyName}</span>
                    <span className="text-[10px] text-slate-400">{rec.partyPan || 'PAN Not Available'} • {rec.partyAddress}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.transactionType === 'TAKEN_269SS' 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}>
                      {rec.transactionType === 'TAKEN_269SS' ? 'Loan / Deposit Taken' : 'Loan Repayment'}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">{rec.transactionDate}</span>
                  </td>
                  <td className="p-3">
                    <span className={`font-bold ${rec.modeOfPayment === 'CASH' || rec.modeOfPayment === 'BEARER_CHEQUE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {rec.modeOfPayment}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-white text-sm">
                    ₹{rec.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 font-semibold text-amber-300">
                    {rec.statutoryClause}
                  </td>
                  <td className="p-3">
                    <span className={`text-[11px] block font-sans ${rec.isViolation ? 'text-rose-300 font-semibold' : 'text-slate-400'}`}>
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
