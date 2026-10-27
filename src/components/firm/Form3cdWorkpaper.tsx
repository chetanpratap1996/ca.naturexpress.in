"use client";

import React, { useState } from "react";
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { ClientEntity } from "@/lib/types";

export interface Form3cdClause {
  clauseNo: string;
  title: string;
  category: "GENERAL" | "DISALLOWANCES" | "DEDUCTIONS" | "TDS_COMPLIANCE" | "GST_RATIO" | "LOANS_DEPOSITS";
  description: string;
  statutoryRef: string;
  status: "COMPLIANT" | "QUALIFIED_AUDIT_REPORT" | "NOT_APPLICABLE" | "AUDIT_IN_PROGRESS";
  disallowanceAmount: number;
  auditNotes: string;
}

const DEFAULT_REALISTIC_3CD_CLAUSES: Form3cdClause[] = [
  {
    clauseNo: "Clause 17",
    title: "Sale of Land/Building below Stamp Duty Value",
    category: "GENERAL",
    statutoryRef: "Section 43CA / 50C",
    description: "Whether any land or building has been transferred during the year for a consideration less than the value adopted by State Stamp Valuation Authority (Circle Rate).",
    status: "COMPLIANT",
    disallowanceAmount: 0,
    auditNotes: "All property transfers examined against registered sale deeds. Consideration conforms to stamp value within 10% tolerance band of Sec 43CA(1)."
  },
  {
    clauseNo: "Clause 21(a)",
    title: "Expenditure of Personal Nature / Fines & Penalties",
    category: "DISALLOWANCES",
    statutoryRef: "Section 37(1) Explanations 1, 2 & 3",
    description: "Amounts debited to P&L by way of penalty, fine for violation of any law, compounding fees, or freebies to medical practitioners.",
    status: "QUALIFIED_AUDIT_REPORT",
    disallowanceAmount: 45000,
    auditNotes: "₹45,000 late filing fees under Section 234E & GST late fees debited to Miscellaneous Expenses. Inadmissible under Section 37(1) - Disallowed in computation."
  },
  {
    clauseNo: "Clause 21(d)",
    title: "Disallowance of Cash Payments exceeding ₹10,000",
    category: "DISALLOWANCES",
    statutoryRef: "Section 40A(3) & Rule 6DD",
    description: "Payment made to a person in a day exceeding ₹10,000 otherwise than by account payee cheque, draft or electronic clearing system.",
    status: "QUALIFIED_AUDIT_REPORT",
    disallowanceAmount: 78000,
    auditNotes: "Identified 3 bearer cheques issued for freight payments aggregating to ₹78,000 without Rule 6DD exception certificate. Reported under Clause 21(d)(A)."
  },
  {
    clauseNo: "Clause 22",
    title: "Interest Inadmissible under MSMED Act, 2006",
    category: "DISALLOWANCES",
    statutoryRef: "Section 23 of MSMED Act",
    description: "Amount of interest payable / paid to Micro, Small and Medium Enterprises under the MSMED Act, which cannot be allowed as a tax deduction.",
    status: "COMPLIANT",
    disallowanceAmount: 0,
    auditNotes: "Management verified all supplier Udyam registrations. No penal interest paid under MSMED Act Section 16 during the financial year."
  },
  {
    clauseNo: "Clause 26",
    title: "Deduction on Actual Payment Basis (Sec 43B & 43B(h))",
    category: "DEDUCTIONS",
    statutoryRef: "Section 43B(a) to 43B(h)",
    description: "Liability incurred in respect of statutory taxes, PF, gratuity and payments to Micro/Small enterprises remaining unpaid before due date.",
    status: "QUALIFIED_AUDIT_REPORT",
    disallowanceAmount: 230000,
    auditNotes: "₹2,30,000 payable to micro-supplier ABC Packaging outstanding for 62 days (exceeding 45-day statutory limit). Added to income under Section 43B(h)."
  },
  {
    clauseNo: "Clause 31",
    title: "Acceptance/Repayment of Loans & Deposits in Cash",
    category: "LOANS_DEPOSITS",
    statutoryRef: "Section 269SS & Section 269T",
    description: "Whether the assessee accepted or repaid any loan or deposit or specified sum of ₹20,000 or more in cash.",
    status: "COMPLIANT",
    disallowanceAmount: 0,
    auditNotes: "All unsecured loans and director advances verified against banking statements. No cash receipts or repayments exceeding ₹20,000 observed."
  },
  {
    clauseNo: "Clause 34(a)",
    title: "Compliance with TDS / TCS Provisions",
    category: "TDS_COMPLIANCE",
    statutoryRef: "Chapter XVII-B / Section 40(a)(ia)",
    description: "Whether the assessee was required to deduct or collect tax. Disallowance @ 30% for non-deduction or non-deposit.",
    status: "QUALIFIED_AUDIT_REPORT",
    disallowanceAmount: 90000, // 30% of 3,00,000
    auditNotes: "Contractual payment of ₹3,00,000 made without deducting TDS u/s 194C. 30% disallowance (₹90,000) attracted under Section 40(a)(ia)."
  },
  {
    clauseNo: "Clause 44",
    title: "Break-up of Total Expenditure of Entities Registered / Unregistered under GST",
    category: "GST_RATIO",
    statutoryRef: "Clause 44 of Form 3CD",
    description: "Mandatory reporting of total expenditure relating to entities registered under GST vs composition vs exempt vs unregistered entities.",
    status: "COMPLIANT",
    disallowanceAmount: 0,
    auditNotes: "Reconciled with Annual Return GSTR-9. Total Expenditure: ₹4.82 Cr (GST Registered: ₹3.91 Cr, Composition: ₹14.5L, Unregistered: ₹76.5L)."
  }
];

interface Form3cdWorkpaperProps {
  clients?: ClientEntity[];
}

export const Form3cdWorkpaper: React.FC<Form3cdWorkpaperProps> = ({ clients = [] }) => {
  const [clauses, setClauses] = useState<Form3cdClause[]>(DEFAULT_REALISTIC_3CD_CLAUSES);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = clauses.filter(c => {
    const matchesCategory = selectedCategory === "ALL" || c.category === selectedCategory;
    const matchesSearch = 
      c.clauseNo.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.statutoryRef.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalDisallowances = clauses.reduce((sum, c) => sum + c.disallowanceAmount, 0);
  const totalQualifiedClauses = clauses.filter(c => c.status === "QUALIFIED_AUDIT_REPORT").length;

  const handleExportCsv = () => {
    const headers = ["Clause #", "Title", "Statutory Reference", "Category", "Audit Status", "Disallowance (₹)", "Workpaper Audit Notes"];
    const rows = clauses.map(c => [
      c.clauseNo,
      `"${c.title}"`,
      `"${c.statutoryRef}"`,
      c.category,
      c.status,
      c.disallowanceAmount,
      `"${c.auditNotes}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Form_3CD_Tax_Audit_Workpapers_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 border border-amber-600/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-300" /> Section 44AB Tax Audit Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">Form 3CD (44 Statutory Clauses)</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Tax Audit Form 3CD Workpaper &amp; Disallowance Desk
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Conduct peer-review compliant Section 44AB tax audits. Real workpaper checklist for Clause 21 (cash payments/penalties), Clause 26 &amp; 43B(h) (MSME dues), Clause 34 (TDS defaults u/s 40(a)(ia)), and Clause 44 GST expenditure reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit Docket</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Statutory Disallowances</div>
          <div className="text-2xl font-black text-rose-400 mt-1">₹{totalDisallowances.toLocaleString("en-IN")}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Added back to Business Profits in Computation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Qualified Audit Clauses</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{totalQualifiedClauses} Clauses Flagged</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Mandatory disclosure in Form 3CA/3CB paragraph 3</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase">ICAI Peer Review Readiness</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">100% Documented</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Clauses backed by audit workpapers &amp; vouchers</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "ALL", label: `All Clauses (${clauses.length})` },
            { id: "DISALLOWANCES", label: "Disallowances (21a, 21d)" },
            { id: "DEDUCTIONS", label: "Sec 43B / 43B(h)" },
            { id: "TDS_COMPLIANCE", label: "TDS 40(a)(ia)" },
            { id: "GST_RATIO", label: "Clause 44 GST" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search clause, section or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Form 3CD Clauses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Clause # &amp; Reference</th>
                <th className="py-3 px-4">Subject Matter</th>
                <th className="py-3 px-4">Audit Finding Status</th>
                <th className="py-3 px-4 text-right">Disallowance (₹)</th>
                <th className="py-3 px-4">Workpaper Audit Notes (for 3CD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((item) => (
                <tr key={item.clauseNo} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-extrabold text-amber-400">{item.clauseNo}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.statutoryRef}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.status === "COMPLIANT" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Compliant
                      </span>
                    ) : item.status === "QUALIFIED_AUDIT_REPORT" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3 text-rose-400" /> Qualified (Add-back)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Not Applicable
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                    {item.disallowanceAmount > 0 ? (
                      <span className="text-rose-400">+₹{item.disallowanceAmount.toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-slate-500">Nil</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-300 leading-relaxed max-w-sm">
                    {item.auditNotes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
