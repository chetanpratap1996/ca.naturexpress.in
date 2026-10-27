"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Check, 
  ArrowRight, 
  UserCheck, 
  Clock, 
  Layers, 
  Building2, 
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronRight,
  FolderDown,
  Sparkles
} from "lucide-react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { MappedTbLedger } from "@/lib/parsers/tallyTbParser";
import { toast } from "@/components/shared/ToastNotification";

export interface AuditLeadSheetItem {
  code: string; // e.g. "LS-A"
  sheetName: string;
  leadTitle: string;
  schedule3Ref: string;
  noteRef: string;
  auditStandardRef: string; // e.g. "SA 230 / SA 500"
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  materialityThreshold: number; // SA 320 threshold in INR
  preparedBy: { name: string; designation: string; timestamp: string };
  reviewedBy: { name: string; designation: string; timestamp: string };
  approvedBy: { name: string; designation: string; timestamp: string };
  auditProcedures: string[];
  auditTickMarks: { symbol: string; label: string; meaning: string }[];
  constituentLedgerIds: string[];
  auditConclusion: string;
}

interface AuditLeadSchedulesProps {
  client: {
    id: string;
    name: string;
    pan: string;
    cin?: string;
  };
  ledgers: MappedTbLedger[];
}

export const AuditLeadSchedules: React.FC<AuditLeadSchedulesProps> = ({ client, ledgers }) => {
  const [selectedSheetCode, setSelectedSheetCode] = useState<string>("LS-A");
  const [leadSheets, setLeadSheets] = useState<AuditLeadSheetItem[]>([
    {
      code: "LS-A",
      sheetName: "Lead Sheet A",
      leadTitle: "Share Capital & Reserves and Surplus",
      schedule3Ref: "I. Equity & Liabilities (1. Shareholders' Funds)",
      noteRef: "Note 1 & Note 2",
      auditStandardRef: "SA 230 / SA 500 (Audit Evidence)",
      riskLevel: "LOW",
      materialityThreshold: 500000,
      preparedBy: { name: "Kriti Jain", designation: "Article Assistant (Reg: CRO-068192)", timestamp: "2026-10-24 14:30" },
      reviewedBy: { name: "Rohit Sharma", designation: "Audit Manager (ACA)", timestamp: "2026-10-25 17:15" },
      approvedBy: { name: "CA Gunjan Jain", designation: "Managing Partner (FCA)", timestamp: "2026-10-26 11:00" },
      auditProcedures: [
        "Vouched opening balances with preceding year signed audited financial statements.",
        "Verified MCA master data for authorized share capital against Memorandum of Association (MOA Clause V).",
        "Confirmed no fresh allotment of equity shares took place during FY 2025-26 (Form PAS-3 verification nil).",
        "Inspected register of members under Section 88 of Companies Act, 2013."
      ],
      auditTickMarks: [
        { symbol: "µ", label: "Tally GL Match", meaning: "Agrees with Tally General Ledger closing balance" },
        { symbol: "^", label: "Audited PY Match", meaning: "Vouched with signed FY 24-25 Peer Review workpapers" },
        { symbol: "§", label: "ROC Verification", meaning: "Cross-checked with MCA V3 Company Master Data" }
      ],
      constituentLedgerIds: ["share_capital", "reserves_and_surplus"],
      auditConclusion: "Share Capital and Reserves are fairly stated in accordance with Schedule III. No undisclosed share warrant or call arrears exist."
    },
    {
      code: "LS-B",
      sheetName: "Lead Sheet B",
      leadTitle: "Borrowings & Banking Covenants",
      schedule3Ref: "I. Equity & Liabilities (Non-Current & Current Borrowings)",
      noteRef: "Note 3 & Note 7",
      auditStandardRef: "SA 505 (External Confirmations) / SA 500",
      riskLevel: "LOW",
      materialityThreshold: 500000,
      preparedBy: { name: "Kriti Jain", designation: "Article Assistant", timestamp: "2026-10-24 15:45" },
      reviewedBy: { name: "Rohit Sharma", designation: "Audit Manager (ACA)", timestamp: "2026-10-25 18:00" },
      approvedBy: { name: "CA Gunjan Jain", designation: "Managing Partner (FCA)", timestamp: "2026-10-26 11:30" },
      auditProcedures: [
        "Obtained direct bank loan balance confirmation certificate from HDFC Bank SME Branch.",
        "Verified sanction letter terms, penal interest rates, and quarterly stock statement submission covenants.",
        "Recomputed interest expense on HDFC Cash Credit and Term Loan against monthly bank statements.",
        "Verified creation and registration of charge with ROC on MCA portal (CHG-1 filed within 30 days)."
      ],
      auditTickMarks: [
        { symbol: "©", label: "Bank Confirmation", meaning: "Direct bank confirmation certificate obtained under SA 505" },
        { symbol: "∑", label: "Interest Recalculation", meaning: "Independent interest recalculation matches bank debit advice" },
        { symbol: "§", label: "ROC Charge Index", meaning: "Charge registered in ROC Index of Charges (MCA V3)" }
      ],
      constituentLedgerIds: ["long_term_borrowings", "short_term_borrowings"],
      auditConclusion: "Borrowings are properly segregated into Long-Term and Current Maturities. All bank financial covenants are fully compliant."
    },
    {
      code: "LS-C",
      sheetName: "Lead Sheet C",
      leadTitle: "Trade Payables & Section 43B(h) MSME Register",
      schedule3Ref: "I. Equity & Liabilities (4. Current Liabilities - Trade Payables)",
      noteRef: "Note 8",
      auditStandardRef: "SA 500 / MSMED Act 2006 / Sec 43B(h)",
      riskLevel: "HIGH",
      materialityThreshold: 200000,
      preparedBy: { name: "Kriti Jain", designation: "Article Assistant", timestamp: "2026-10-25 11:20" },
      reviewedBy: { name: "Rohit Sharma", designation: "Audit Manager (ACA)", timestamp: "2026-10-26 10:15" },
      approvedBy: { name: "CA Gunjan Jain", designation: "Managing Partner (FCA)", timestamp: "2026-10-26 12:00" },
      auditProcedures: [
        "Vouched trade creditor balances against vendor statements and purchase inward register.",
        "Audited 100% of MSME supplier Udyam registration certificates to confirm Micro/Small enterprise status.",
        "Performed cut-off testing for purchases recorded in March 2026 against GSTR-2B inward supplies.",
        "Verified that all MSME dues outstanding as on 31st March 2026 have been cleared within 45 days statutory limit (Section 43B(h))."
      ],
      auditTickMarks: [
        { symbol: "µ", label: "GSTR-2B Verified", meaning: "Cross-verified with GST electronic inward credit register" },
        { symbol: "§", label: "Udyam Certificate", meaning: "Supplier MSME Udyam certificate verified on official portal" },
        { symbol: "✓", label: "Cut-off Tested", meaning: "Goods receipt notes tested for proper accounting period cut-off" }
      ],
      constituentLedgerIds: ["trade_payables_msme", "trade_payables_others"],
      auditConclusion: "Trade Payables are properly classified between MSME and Others. Zero disallowance warranted under Section 43B(h)."
    },
    {
      code: "LS-D",
      sheetName: "Lead Sheet D",
      leadTitle: "Property, Plant & Equipment (PPE) & Schedule II",
      schedule3Ref: "II. Assets (1. Non-Current Assets - PPE)",
      noteRef: "Note 11",
      auditStandardRef: "SA 230 / Schedule II Companies Act / Section 32 IT Act",
      riskLevel: "MEDIUM",
      materialityThreshold: 500000,
      preparedBy: { name: "Kriti Jain", designation: "Article Assistant", timestamp: "2026-10-24 16:30" },
      reviewedBy: { name: "Rohit Sharma", designation: "Audit Manager (ACA)", timestamp: "2026-10-25 19:00" },
      approvedBy: { name: "CA Gunjan Jain", designation: "Managing Partner (FCA)", timestamp: "2026-10-26 12:30" },
      auditProcedures: [
        "Inspected physical asset verification report signed by management for Pithampur factory assets.",
        "Vouched capital additions during the year (HPLC Equipment & Injectable Line) against vendor invoices and custom clearance documents.",
        "Recomputed depreciation in accordance with useful lives prescribed under Schedule II of Companies Act, 2013.",
        "Prepared tax depreciation computation under Section 32 of Income Tax Act for Tax Audit Form 3CD Clause 18."
      ],
      auditTickMarks: [
        { symbol: "^", label: "Invoice Vouched", meaning: "Capital purchase invoice and installation certificate vouched" },
        { symbol: "∑", label: "Schedule II Recalc", meaning: "Straight-line depreciation recomputed as per statutory useful life" },
        { symbol: "§", label: "Physical Verification", meaning: "Management physical verification certificate verified" }
      ],
      constituentLedgerIds: ["ppe_tangible_assets", "capital_wip", "intangible_assets"],
      auditConclusion: "PPE additions are properly capitalized. Depreciation complies with Schedule II; deferred tax difference correctly recognized."
    },
    {
      code: "LS-E",
      sheetName: "Lead Sheet E",
      leadTitle: "Trade Receivables & External Confirmations",
      schedule3Ref: "II. Assets (2. Current Assets - Trade Receivables)",
      noteRef: "Note 19",
      auditStandardRef: "SA 505 (External Confirmations) / SA 520",
      riskLevel: "MEDIUM",
      materialityThreshold: 300000,
      preparedBy: { name: "Kriti Jain", designation: "Article Assistant", timestamp: "2026-10-25 12:00" },
      reviewedBy: { name: "Rohit Sharma", designation: "Audit Manager (ACA)", timestamp: "2026-10-26 11:00" },
      approvedBy: { name: "CA Gunjan Jain", designation: "Managing Partner (FCA)", timestamp: "2026-10-26 13:00" },
      auditProcedures: [
        "Dispatched direct balance confirmation requests (SA 505) to top 10 hospital & institutional buyers.",
        "Audited debtor ageing report; verified that 86.5% of total book debts are within 90 days credit cycle.",
        "Tested subsequent bank realizations in April 2026 for balances outstanding at balance sheet date.",
        "Evaluated provision for expected credit loss / doubtful debts under prudent accounting standards."
      ],
      auditTickMarks: [
        { symbol: "©", label: "External Confirmation", meaning: "Positive confirmation received directly from debtor under SA 505" },
        { symbol: "µ", label: "Subsequent Realization", meaning: "Subsequent recovery verified in bank statement in subsequent month" },
        { symbol: "^", label: "E-Way Bill Verified", meaning: "Sales invoices matched with GST E-way bills and delivery challans" }
      ],
      constituentLedgerIds: ["trade_receivables"],
      auditConclusion: "Trade receivables are considered good and recoverable. No provision for doubtful debts is warranted at present."
    },
    {
      code: "LS-F",
      sheetName: "Lead Sheet F",
      leadTitle: "Cash and Bank Balances & BRS Reconciliation",
      schedule3Ref: "II. Assets (2. Current Assets - Cash and Cash Equivalents)",
      noteRef: "Note 20",
      auditStandardRef: "SA 500 / SA 505 / ICAI Guidance Note on Cash Audit",
      riskLevel: "LOW",
      materialityThreshold: 100000,
      preparedBy: { name: "Kriti Jain", designation: "Article Assistant", timestamp: "2026-10-24 17:00" },
      reviewedBy: { name: "Rohit Sharma", designation: "Audit Manager (ACA)", timestamp: "2026-10-25 19:30" },
      approvedBy: { name: "CA Gunjan Jain", designation: "Managing Partner (FCA)", timestamp: "2026-10-26 13:30" },
      auditProcedures: [
        "Obtained bank confirmation certificates and year-end bank statements directly for HDFC and SBI accounts.",
        "Audited monthly Bank Reconciliation Statements (BRS) as on 31st March 2026; unpresented cheques cleared in April.",
        "Performed surprise physical cash count verification at factory and head office on 31st March closing.",
        "Confirmed that cash-in-hand carries a positive debit balance and adheres to Rule 6DD limits."
      ],
      auditTickMarks: [
        { symbol: "©", label: "Bank Certificate", meaning: "Bank confirmation letter inspected directly" },
        { symbol: "∑", label: "BRS Verified", meaning: "Bank reconciliation mathematically casted and outstanding entries cleared" },
        { symbol: "✓", label: "Cash Memo", meaning: "Physical cash count certificate signed on 31 March" }
      ],
      constituentLedgerIds: ["cash_and_bank_balances"],
      auditConclusion: "Cash and bank balances reflect true and fair view. No negative cash in hand or unadjusted BRS entries identified."
    },
    {
      code: "LS-G",
      sheetName: "Lead Sheet G",
      leadTitle: "Analytical Review of Expenses & Sec 37(1) Scrutiny",
      schedule3Ref: "Part II. Profit & Loss (IV. Expenses - Notes 26 to 29)",
      noteRef: "Notes 26, 27, 28 & 29",
      auditStandardRef: "SA 520 (Analytical Procedures) / Section 37(1)",
      riskLevel: "HIGH",
      materialityThreshold: 250000,
      preparedBy: { name: "Kriti Jain", designation: "Article Assistant", timestamp: "2026-10-25 15:00" },
      reviewedBy: { name: "Rohit Sharma", designation: "Audit Manager (ACA)", timestamp: "2026-10-26 11:30" },
      approvedBy: { name: "CA Gunjan Jain", designation: "Managing Partner (FCA)", timestamp: "2026-10-26 14:00" },
      auditProcedures: [
        "Performed substantive analytical review comparing Current Year vs Previous Year expense heads (>20% variance tested).",
        "Scrutinized legal, statutory penalty, and miscellaneous accounts for expenses inadmissible under Section 37(1).",
        "Cross-verified TDS deductions on professional fees (194J), contract payments (194C), and rent (194I).",
        "Extracted ₹45,000 late filing fees under Section 234E for mandatory reporting under Tax Audit Clause 21(a)."
      ],
      auditTickMarks: [
        { symbol: "∑", label: "YoY Variance Tested", meaning: "Analytical variance exceeding 20% investigated with vouchers" },
        { symbol: "§", label: "TDS Compliance Checked", meaning: "TDS deductions cross-verified with TRACES Form 26AS/3CD" },
        { symbol: "^", label: "Tax Disallowance Target", meaning: "Flagged for Section 37(1) disallowance in ITR computation" }
      ],
      constituentLedgerIds: ["employee_benefits_expense", "finance_costs", "depreciation_and_amortization", "other_expenses"],
      auditConclusion: "Expense accounts analyzed. ₹45,000 late filing fees transferred to Form 3CD Clause 21(a) disallowance register."
    }
  ]);

  const activeSheet = leadSheets.find((s) => s.code === selectedSheetCode) || leadSheets[0];

  // Filter mapped ledgers for active lead sheet
  const constituentLedgers = ledgers.filter((l) =>
    activeSheet.constituentLedgerIds.includes(l.mappedHeadId)
  );

  const totalLeadAmount = constituentLedgers.reduce((acc, l) => acc + l.closingBalance, 0);

  const handleExportFullDossier = () => {
    toast.success(
      "ICAI Peer Review Dossier Generated",
      `Compiled Schedule III Financials, 11 Ratios, and Lead Sheets (A-G) for ${client.name}. Ready for peer review inspection.`
    );
  };

  return (
    <div className="space-y-4">
      {/* -------------------------------------------------------------------- */}
      {/* 1. PEER REVIEW DOSSIER HEADER                                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              ICAI Peer Review Board (SQC 1)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
              Standard on Auditing SA 230 &bull; Audit Documentation
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
              SA 520 &bull; Analytical Procedures
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Audit Lead Schedules &amp; Working Papers Dossier &bull; {client.name}
          </h3>

          <p className="text-xs text-slate-500 font-medium">
            Permanent working paper dossier indexed for ICAI Peer Reviewers and QRB (Quality Review Board) inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFullDossier}
            className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5"
          >
            <FolderDown className="w-4 h-4" />
            <span>Export Peer Review Dossier Pack</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-black transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Lead Sheet</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. LEAD SHEET INDEX SELECTOR BAR                                     */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2">
        {leadSheets.map((s) => {
          const isSelected = selectedSheetCode === s.code;

          return (
            <button
              key={s.code}
              onClick={() => setSelectedSheetCode(s.code)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isSelected
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                s.riskLevel === "HIGH" ? "bg-red-400" : s.riskLevel === "MEDIUM" ? "bg-amber-400" : "bg-emerald-400"
              }`} />
              <span>{s.sheetName}</span>
              <span className="text-[10px] opacity-70">({s.noteRef})</span>
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. ACTIVE LEAD SHEET WORKPAPER DETAILS                               */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Workpaper Header & Metadata */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 text-indigo-900 font-mono">
                {activeSheet.code}
              </span>
              <h4 className="text-base font-black text-slate-900">
                {activeSheet.leadTitle}
              </h4>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
              <span>Schedule III Line: <strong className="text-slate-800">{activeSheet.schedule3Ref}</strong></span>
              <span>&bull;</span>
              <span>ICAI Auditing Standard: <strong className="text-indigo-700">{activeSheet.auditStandardRef}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Lead Amount
              </span>
              <span className="text-lg font-black text-slate-900">
                {formatCurrencyINR(totalLeadAmount)}
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
              activeSheet.riskLevel === "HIGH" 
                ? "bg-red-50 text-red-800 border border-red-200" 
                : activeSheet.riskLevel === "MEDIUM"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}>
              {activeSheet.riskLevel} Risk
            </span>
          </div>
        </div>

        {/* Audit Sign-Off Chain (SA 230 Requirement) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-indigo-600" /> Prepared By (Article)
            </span>
            <p className="text-xs font-black text-slate-900">{activeSheet.preparedBy.name}</p>
            <p className="text-[10px] text-slate-500">{activeSheet.preparedBy.designation}</p>
            <p className="text-[10px] text-slate-400 font-mono">{activeSheet.preparedBy.timestamp}</p>
          </div>

          <div className="space-y-0.5 border-t md:border-t-0 md:border-l border-slate-200 md:pl-3 pt-2 md:pt-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-indigo-600" /> Reviewed By (Manager)
            </span>
            <p className="text-xs font-black text-slate-900">{activeSheet.reviewedBy.name}</p>
            <p className="text-[10px] text-slate-500">{activeSheet.reviewedBy.designation}</p>
            <p className="text-[10px] text-slate-400 font-mono">{activeSheet.reviewedBy.timestamp}</p>
          </div>

          <div className="space-y-0.5 border-t md:border-t-0 md:border-l border-slate-200 md:pl-3 pt-2 md:pt-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Approved By (Partner)
            </span>
            <p className="text-xs font-black text-slate-900">{activeSheet.approvedBy.name}</p>
            <p className="text-[10px] text-slate-500">{activeSheet.approvedBy.designation}</p>
            <p className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Signed &amp; Sealed
            </p>
          </div>
        </div>

        {/* Constituent Ledgers Table with Auditor Tick-Marks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              1. Constituent Trial Balance Ledgers &amp; Auditor Verification
            </h5>
            <div className="flex items-center gap-2">
              {activeSheet.auditTickMarks.map((tm, i) => (
                <span key={i} className="text-[10px] text-slate-600 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded" title={tm.meaning}>
                  <strong className="text-indigo-700 font-mono">{tm.symbol}</strong> {tm.label}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <th className="py-2.5 px-3">Tally Ledger Name</th>
                  <th className="py-2.5 px-3">Tally Group</th>
                  <th className="py-2.5 px-3 text-right">Closing Balance</th>
                  <th className="py-2.5 px-3 text-center">Tick-Mark</th>
                  <th className="py-2.5 px-3">Audit Cross-Reference / Source Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {constituentLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No ledgers currently mapped to this lead schedule head.
                    </td>
                  </tr>
                ) : (
                  constituentLedgers.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{l.ledgerName}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{l.tallyParent}</td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">
                        {formatCurrencyINR(l.closingBalance)} {l.balanceType}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-xs">
                          {activeSheet.auditTickMarks[0]?.symbol || "µ"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        Agrees with Tally TB &bull; Vouched with Bank Advice / Inward Register
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Procedures Executed */}
        <div className="space-y-2">
          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            2. Standard Auditing Procedures Executed (SA 500 / SA 520)
          </h5>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            {activeSheet.auditProcedures.map((proc, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{proc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auditor Conclusion */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block">
            3. Engagement Partner Audit Conclusion (SA 700 / SA 230)
          </span>
          <p className="text-xs font-bold text-emerald-950">
            {activeSheet.auditConclusion}
          </p>
        </div>
      </div>
    </div>
  );
};
