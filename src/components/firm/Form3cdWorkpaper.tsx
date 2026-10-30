"use client";

import React, { useState, useMemo } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { ClientEntity } from "@/lib/types";
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
  Sparkles, 
  Building2, 
  User, 
  Check, 
  X, 
  Eye, 
  Copy, 
  Send, 
  MessageSquare, 
  Plus, 
  Trash2, 
  ChevronDown, 
  Award, 
  Calendar, 
  Layers, 
  Edit, 
  CheckCheck, 
  RefreshCw, 
  Calculator, 
  Percent,
  SlidersHorizontal,
  Table
} from "lucide-react";

export interface Form3cdClause {
  clauseNo: string;
  title: string;
  category: "GENERAL" | "DISALLOWANCES" | "DEDUCTIONS" | "TDS_COMPLIANCE" | "GST_RATIO" | "LOANS_DEPOSITS" | "RATIOS_STOCKS";
  description: string;
  statutoryRef: string;
  status: "COMPLIANT" | "QUALIFIED_AUDIT_REPORT" | "NOT_APPLICABLE";
  disallowanceAmount: number;
  auditNotes: string;
  workpaperRef?: string;
  partnerSignedOff?: boolean;
}

export interface ClientAuditProfile {
  entityId: string;
  clientName: string;
  pan: string;
  cinOrLlp: string;
  auditType: "FORM_3CA_3CD" | "FORM_3CB_3CD";
  turnoverCr: number;
  assessmentYear: string;
  financialYear: string;
  primaryContact: {
    name: string;
    phone: string;
    designation: string;
  };
  clauses: Form3cdClause[];
}

const CLIENT_AUDIT_PROFILES: Record<string, ClientAuditProfile> = {
  // Apex AutoTech (Manufacturing - Form 3CA/3CD)
  "CLI-APEX-01": {
    entityId: "CLI-APEX-01",
    clientName: "Apex AutoTech Private Limited",
    pan: "AABCA8891D",
    cinOrLlp: "U29100MP2015PTC034120",
    auditType: "FORM_3CA_3CD",
    turnoverCr: 48.5,
    assessmentYear: "AY 2026-27",
    financialYear: "FY 2025-26",
    primaryContact: {
      name: "Rajesh Sharma",
      phone: "+91 98200 11223",
      designation: "Managing Director"
    },
    clauses: [
      {
        clauseNo: "Clause 13",
        title: "Method of Accounting & ICDS Adjustments",
        category: "GENERAL",
        statutoryRef: "Section 145 & ICDS I to X",
        description: "Method of accounting employed in the previous year and details of deviation from Income Computation and Disclosure Standards (ICDS).",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Mercantile system of accounting followed consistently. ICDS adjustments examined: Net positive MTM adjustment of ₹3,40,000 on forex debtors disclosed in Schedule ICDS.",
        workpaperRef: "WP-13-ICDS-01",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 17",
        title: "Sale of Land/Building below Stamp Duty Value",
        category: "GENERAL",
        statutoryRef: "Section 43CA / 50C",
        description: "Whether any land or building has been transferred during the year for a consideration less than the State Stamp Valuation Authority circle rate.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "No immovable capital assets sold during the financial year. Factory shed lease registered at circle rate.",
        workpaperRef: "WP-17-PROPERTY-01",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 20(b)",
        title: "PF/ESIC Deposited after Statutory Due Date",
        category: "DEDUCTIONS",
        statutoryRef: "Section 36(1)(va) / SC Checkmate Ruling",
        description: "Amounts received from employees as contribution to PF/ESIC or superannuation fund and whether deposited on or before the respective fund due date (15th of next month).",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "All 12 monthly employee PF and ESIC challans verified against bank debits. All deposits cleared on or before the 15th of the succeeding month. Zero disallowance u/s 36(1)(va).",
        workpaperRef: "WP-20B-PF-CHLN",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 21(a)",
        title: "Expenditure of Personal Nature / Fines & Penalties",
        category: "DISALLOWANCES",
        statutoryRef: "Section 37(1) Explanations 1, 2 & 3",
        description: "Amounts debited to P&L by way of penalty, fine for violation of any law, compounding fees, or expenditure incurred for illegal purposes.",
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 45000,
        auditNotes: "₹45,000 late filing fees under Section 234E & GST late payment fees debited to Miscellaneous Expenses. Inadmissible under Section 37(1) - Disallowed and added back.",
        workpaperRef: "WP-21A-PENALTIES-01",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 21(d)",
        title: "Disallowance of Cash Payments exceeding ₹10,000",
        category: "DISALLOWANCES",
        statutoryRef: "Section 40A(3) & Rule 6DD",
        description: "Payment made to a person in a day exceeding ₹10,000 otherwise than by account payee cheque, draft or electronic clearing system.",
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 78000,
        auditNotes: "Identified 3 bearer cheques issued for factory transport freight payments aggregating to ₹78,000 without Rule 6DD exception certificate. Reported under Clause 21(d)(A).",
        workpaperRef: "WP-21D-CASH-40A3",
        partnerSignedOff: false
      },
      {
        clauseNo: "Clause 22",
        title: "Interest Inadmissible under MSMED Act, 2006",
        category: "DISALLOWANCES",
        statutoryRef: "Section 23 of MSMED Act",
        description: "Amount of interest payable / paid to Micro, Small and Medium Enterprises under the MSMED Act, which cannot be allowed as a tax deduction.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Management verified all supplier Udyam registrations. No penal interest paid under MSMED Act Section 16 during the financial year.",
        workpaperRef: "WP-22-MSME-INT",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 23",
        title: "Payments to Specified Persons (Related Parties)",
        category: "DISALLOWANCES",
        statutoryRef: "Section 40A(2)(b)",
        description: "Particulars of payments made to persons specified under Section 40A(2)(b) (directors, relatives, substantial shareholders).",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Director remuneration to Rajesh Sharma (₹24L) and plant rent to Neha Sharma (₹6L) benchmarked against market fair value. No excessive or unreasonable pricing observed.",
        workpaperRef: "WP-23-RELATED-40A2",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 26",
        title: "Deduction on Actual Payment Basis (Sec 43B & 43B(h))",
        category: "DEDUCTIONS",
        statutoryRef: "Section 43B(a) to 43B(h)",
        description: "Liability incurred in respect of statutory taxes, PF, gratuity and payments to Micro/Small enterprises remaining unpaid beyond statutory due dates.",
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 230000,
        auditNotes: "₹2,30,000 payable to micro-supplier ABC Packaging outstanding for 62 days (exceeding 45-day statutory limit). Added to income under Section 43B(h). Deduction available in year of payment.",
        workpaperRef: "WP-26-MSME-43BH",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 31",
        title: "Acceptance/Repayment of Loans & Deposits in Cash",
        category: "LOANS_DEPOSITS",
        statutoryRef: "Section 269SS & Section 269T",
        description: "Whether the assessee accepted or repaid any loan or deposit or specified sum of ₹20,000 or more in cash.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "All unsecured loans and director advances verified against banking statements. No cash receipts or repayments exceeding ₹20,000 observed. Fully compliant with 269SS/269T.",
        workpaperRef: "WP-31-LOANS-269SS",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 34(a)",
        title: "Compliance with TDS / TCS Provisions",
        category: "TDS_COMPLIANCE",
        statutoryRef: "Chapter XVII-B / Section 40(a)(ia)",
        description: "Whether the assessee was required to deduct or collect tax. Disallowance @ 30% for non-deduction or non-deposit.",
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 90000,
        auditNotes: "Contractual tooling payment of ₹3,00,000 made without deducting TDS u/s 194C. 30% statutory disallowance (₹90,000) attracted under Section 40(a)(ia).",
        workpaperRef: "WP-34A-TDS-40AIA",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 35",
        title: "Quantitative Stock Details & Yield Ratios",
        category: "RATIOS_STOCKS",
        statutoryRef: "Clause 35 of Form 3CD",
        description: "Quantitative details of principal items of raw materials, goods manufactured, finished goods, scrap, and normal yield percentages.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Raw steel consumption: 1,840 MT. Finished auto components manufactured: 1,720 MT. Normal machining scrap generation: 6.52% (within 7% industry tolerance).",
        workpaperRef: "WP-35-STOCK-YIELD",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 40",
        title: "Accounting & Profitability Ratios",
        category: "RATIOS_STOCKS",
        statutoryRef: "Clause 40 of Form 3CD",
        description: "Details of turnover, gross profit/turnover, net profit/turnover, stock-in-trade/turnover, and material consumed/turnover ratios compared with preceding year.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Gross Profit Ratio: 21.4% (Preceding Year: 20.8%). Net Profit Ratio: 7.82% (Preceding Year: 7.45%). Stock Turnover Ratio: 8.4 times. No material ratio distortions.",
        workpaperRef: "WP-40-RATIOS",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 44",
        title: "Break-up of Total Expenditure under GST",
        category: "GST_RATIO",
        statutoryRef: "Clause 44 of Form 3CD",
        description: "Mandatory reporting of total expenditure relating to entities registered under GST vs composition vs exempt vs unregistered entities.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Reconciled with Annual Return GSTR-9. Total Expenditure: ₹4.82 Cr (GST Registered: ₹3.91 Cr [81.1%], Composition: ₹14.5L, Exempt/Unregistered: ₹76.5L).",
        workpaperRef: "WP-44-GST-RECO",
        partnerSignedOff: true
      }
    ]
  },

  // OmniRetail Hypermarkets (Retail - Form 3CA/3CD)
  "CLI-OMNI-01": {
    entityId: "CLI-OMNI-01",
    clientName: "OmniRetail Hypermarkets Private Limited",
    pan: "AAFCO4492K",
    cinOrLlp: "U52100MP2019PTC048991",
    auditType: "FORM_3CA_3CD",
    turnoverCr: 24.0,
    assessmentYear: "AY 2026-27",
    financialYear: "FY 2025-26",
    primaryContact: {
      name: "Aditya Singhal",
      phone: "+91 98110 44211",
      designation: "Managing Director"
    },
    clauses: [
      {
        clauseNo: "Clause 20(b)",
        title: "PF/ESIC Deposited after Statutory Due Date",
        category: "DEDUCTIONS",
        statutoryRef: "Section 36(1)(va)",
        description: "Late deposit of employee PF/ESIC contributions after the 15th of the month.",
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 112000,
        auditNotes: "Employee PF contribution for July 2025 deposited on 19-Aug-2025 (4 days late). Permanently disallowed under Section 36(1)(va) per Supreme Court Checkmate judgment.",
        workpaperRef: "WP-OMNI-20B",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 21(a)",
        title: "Expenditure of Personal Nature / Fines & Penalties",
        category: "DISALLOWANCES",
        statutoryRef: "Section 37(1)",
        description: "Fines and penalties for statutory late filings.",
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 65000,
        auditNotes: "GST late filing penalty of ₹65,000 paid for delay in filing GSTR-3B. Disallowed under Section 37(1).",
        workpaperRef: "WP-OMNI-21A",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 26",
        title: "Deduction on Actual Payment Basis (Sec 43B & 43B(h))",
        category: "DEDUCTIONS",
        statutoryRef: "Section 43B(h)",
        description: "Payments to micro/small suppliers beyond 45 days.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "All FMCG and grocery suppliers paid within 30-day billing cycle. Zero outstanding beyond 45 days as on 31st March.",
        workpaperRef: "WP-OMNI-43BH",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 44",
        title: "Break-up of Total Expenditure under GST",
        category: "GST_RATIO",
        statutoryRef: "Clause 44 of Form 3CD",
        description: "Expenditure breakdown under GST.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Total expenditure: ₹18.2 Cr. GST registered suppliers: ₹16.4 Cr (90.1%). Unregistered: ₹1.8 Cr.",
        workpaperRef: "WP-OMNI-44",
        partnerSignedOff: true
      }
    ]
  },

  // Pratwi Solutions (IT Services - Form 3CA/3CD)
  "CLI-PRATWI-01": {
    entityId: "CLI-PRATWI-01",
    clientName: "Pratwi Solutions Private Limited",
    pan: "AANCP9915B",
    cinOrLlp: "U72200MH2021PTC358912",
    auditType: "FORM_3CA_3CD",
    turnoverCr: 10.0,
    assessmentYear: "AY 2026-27",
    financialYear: "FY 2025-26",
    primaryContact: {
      name: "Pratwi Shah",
      phone: "+91 98200 44101",
      designation: "Director"
    },
    clauses: [
      {
        clauseNo: "Clause 34(a)",
        title: "Compliance with TDS / TCS Provisions",
        category: "TDS_COMPLIANCE",
        statutoryRef: "Section 40(a)(ia)",
        description: "TDS defaults on software contractor payments.",
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 42500,
        auditNotes: "Technical consulting fees of ₹1,41,666 paid to offshore contractor without deducting TDS u/s 195. 30% disallowance (₹42,500) attracted under Section 40(a)(i).",
        workpaperRef: "WP-PRATWI-TDS",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 21(a)",
        title: "Expenditure of Personal Nature / Penalties",
        category: "DISALLOWANCES",
        statutoryRef: "Section 37(1)",
        description: "MCA late filing compounding fees.",
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 20000,
        auditNotes: "₹20,000 late filing fees paid to Ministry of Corporate Affairs for delay in filing Form AOC-4. Disallowed in computation.",
        workpaperRef: "WP-PRATWI-MCA",
        partnerSignedOff: true
      },
      {
        clauseNo: "Clause 44",
        title: "Break-up of Total Expenditure under GST",
        category: "GST_RATIO",
        statutoryRef: "Clause 44 of Form 3CD",
        description: "Expenditure breakdown under GST.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Total expenditure: ₹7.8 Cr. Cloud infra & tech salaries: ₹7.2 Cr registered. Miscellaneous unregistered: ₹60L.",
        workpaperRef: "WP-PRATWI-44",
        partnerSignedOff: true
      }
    ]
  }
};

interface Form3cdWorkpaperProps {
  clients?: ClientEntity[];
}

export const Form3cdWorkpaper: React.FC<Form3cdWorkpaperProps> = ({ clients = [] }) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  
  // Modals & Drawers
  const [selectedClauseDetail, setSelectedClauseDetail] = useState<Form3cdClause | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isClause44ModalOpen, setIsClause44ModalOpen] = useState(false);
  const [isForm3caModalOpen, setIsForm3caModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedClauseForWhatsApp, setSelectedClauseForWhatsApp] = useState<Form3cdClause | null>(null);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState("");

  // UDIN State for Audit Report
  const [udinNumber, setUdinNumber] = useState(`26098221TAXAUDIT${Date.now().toString().slice(-4)}`);

  // Active Client Entity
  const currentEntity = useMemo(() => {
    if (!clients || clients.length === 0) return null;
    return clients.find(c => c.id === selectedEntityId) || clients[0];
  }, [clients, selectedEntityId]);

  // Client Audit Profile
  const activeProfile = useMemo<ClientAuditProfile>(() => {
    const entityId = currentEntity?.id || "CLI-APEX-01";
    if (CLIENT_AUDIT_PROFILES[entityId]) {
      return CLIENT_AUDIT_PROFILES[entityId];
    }
    return CLIENT_AUDIT_PROFILES["CLI-APEX-01"];
  }, [currentEntity]);

  // Master clauses state initialized per profile
  const [clauses, setClauses] = useState<Form3cdClause[]>(() => activeProfile.clauses);

  // Sync clauses when active profile changes
  React.useEffect(() => {
    setClauses(activeProfile.clauses);
  }, [activeProfile]);

  // Calculations
  const totalDisallowances = useMemo(() => clauses.reduce((sum, c) => sum + c.disallowanceAmount, 0), [clauses]);
  const totalQualifiedClauses = useMemo(() => clauses.filter(c => c.status === "QUALIFIED_AUDIT_REPORT").length, [clauses]);
  const taxImpactAt30Percent = useMemo(() => Math.round(totalDisallowances * 0.312), [totalDisallowances]); // 30% tax + 4% cess

  // Filtered List
  const filtered = useMemo(() => {
    return clauses.filter(c => {
      let matchesCategory = true;
      if (selectedCategory === "DISALLOWANCES") matchesCategory = c.category === "DISALLOWANCES";
      else if (selectedCategory === "DEDUCTIONS") matchesCategory = c.category === "DEDUCTIONS";
      else if (selectedCategory === "TDS_COMPLIANCE") matchesCategory = c.category === "TDS_COMPLIANCE";
      else if (selectedCategory === "GST_RATIO") matchesCategory = c.category === "GST_RATIO";
      else if (selectedCategory === "QUALIFIED") matchesCategory = c.status === "QUALIFIED_AUDIT_REPORT";

      const matchesSearch = 
        c.clauseNo.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.statutoryRef.toLowerCase().includes(search.toLowerCase()) ||
        c.auditNotes.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [clauses, selectedCategory, search]);

  // Toggle Partner Sign-off on Clause
  const handleToggleSignOff = (clauseNo: string) => {
    setClauses(prev => prev.map(c => {
      if (c.clauseNo === clauseNo) {
        return { ...c, partnerSignedOff: !c.partnerSignedOff };
      }
      return c;
    }));
    toast.success("Audit Workpaper Signed", `Clause ${clauseNo} sign-off status updated.`);
  };

  // Open Clause Detail
  const handleOpenClauseDetail = (clause: Form3cdClause) => {
    setSelectedClauseDetail(clause);
    setIsDetailDrawerOpen(true);
  };

  // Save Clause Edits
  const handleSaveClauseEdits = (updatedClause: Form3cdClause) => {
    setClauses(prev => prev.map(c => c.clauseNo === updatedClause.clauseNo ? updatedClause : c));
    setIsDetailDrawerOpen(false);
    toast.success("Clause Workpaper Updated", `Saved audit adjustments for ${updatedClause.clauseNo}.`);
  };

  // Open WhatsApp Query Modal
  const handleOpenWhatsAppQuery = (clause: Form3cdClause) => {
    setSelectedClauseForWhatsApp(clause);
    const text = `*TAX AUDIT SECTION 44AB STATUTORY QUERY*\n\n` +
      `Dear ${activeProfile.primaryContact.name},\n\n` +
      `During our statutory tax audit of *${activeProfile.clientName}* for *${activeProfile.assessmentYear}* (PAN: ${activeProfile.pan}), our team flagged the following qualification under *${clause.clauseNo}* (${clause.statutoryRef}):\n\n` +
      `• *Subject Matter:* ${clause.title}\n` +
      `• *Statutory Disallowance:* ${formatCurrencyINR(clause.disallowanceAmount)}\n` +
      `• *Audit Note:* ${clause.auditNotes}\n\n` +
      `⚠️ *DISALLOWANCE IMPACT:*\n` +
      `This ₹${clause.disallowanceAmount.toLocaleString()} will be reported in Paragraph 3 of Form 3CA and added back to your taxable business income, attracting additional tax of ~${formatCurrencyINR(Math.round(clause.disallowanceAmount * 0.312))}.\n\n` +
      `Please provide management representation or payment receipts if settled.\n\n` +
      `Regards,\n*CA Gunjan Jain (FCA)*\nGPA & Co., Chartered Accountants`;

    setCustomWhatsAppMsg(text);
    setIsWhatsAppModalOpen(true);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Tax Audit Form 3CD Workpaper & Disallowance Docket - GPA & Co. Chartered Accountants",
      `Client: ${activeProfile.clientName} | PAN: ${activeProfile.pan} | CIN: ${activeProfile.cinOrLlp}`,
      `Assessment Year: ${activeProfile.assessmentYear} | Total Disallowances: ₹${totalDisallowances} | Qualified Clauses: ${totalQualifiedClauses}`,
      "",
      "Clause #,Subject Matter,Statutory Reference,Category,Audit Status,Disallowance (₹),Partner Signed Off,Workpaper Audit Notes"
    ].join("\n");

    const rows = clauses.map(c => [
      c.clauseNo,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.statutoryRef.replace(/"/g, '""')}"`,
      c.category,
      c.status,
      c.disallowanceAmount,
      c.partnerSignedOff ? "YES" : "NO",
      `"${c.auditNotes.replace(/"/g, '""')}"`
    ].join(",")).join("\n");

    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tax_Audit_Form_3CD_${activeProfile.pan}_${activeProfile.assessmentYear.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV Exported", "Form 3CD tax audit workpapers downloaded.");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" /> Section 44AB Tax Audit Engine
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              Form 3CD (44 Statutory Clauses)
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ICAI Peer Review Compliant
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Tax Audit Form 3CD Workpaper &amp; Disallowance Desk
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Conduct peer-review compliant Section 44AB tax audits. Real workpaper checklist for Clause 20(b) (PF/ESIC delays), Clause 21 (cash payments/penalties), Clause 26 &amp; 43B(h) (MSME dues), Clause 34 (TDS defaults u/s 40(a)(ia)), and Clause 44 GST expenditure reconciliation.
          </p>
        </div>

        {/* Client & Report Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedEntityId || currentEntity?.id || ""}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {clients.length === 0 ? (
                <option value="">No clients onboarded</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsClause44ModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition"
              title="Open 7-column GST Expenditure Breakdown Schedule"
            >
              <Table className="w-3.5 h-3.5 text-indigo-600" />
              <span>Clause 44 Matrix</span>
            </button>

            <button
              onClick={() => setIsForm3caModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-sm"
              title="Generate formal Form 3CA Audit Report with Paragraph 3 Qualifications"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Form 3CA/3CB Report</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-sm"
              title="Export Form 3CD Workpapers to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tax Audit Assessee Docket Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300">
            44AB
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <span>Section 44AB Audit Profile</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400 text-[11px] font-semibold">{activeProfile.auditType.replace(/_/g, " / ")}</span>
            </div>
            <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>{activeProfile.clientName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono">
                PAN: {activeProfile.pan}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono">
                Turnover: ₹{activeProfile.turnoverCr} Cr
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Assessment Year:</span> <strong className="text-white">{activeProfile.assessmentYear}</strong>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Financial Year:</span> <strong className="text-white">{activeProfile.financialYear}</strong>
          </div>
        </div>
      </div>

      {/* 4-Metric Audit Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disallowances */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disallowances</span>
            <AlertTriangle className="w-4 h-4 text-btred-logo shrink-0" />
          </div>
          <div className="text-2xl font-black text-btred-logo mt-1">
            {formatCurrencyINR(totalDisallowances)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Added back to Business Profits in Computation
          </div>
        </div>

        {/* Qualified Clauses */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Qualified Audit Clauses</span>
            <ClipboardCheck className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {totalQualifiedClauses} Clauses Flagged
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Mandatory disclosure in Form 3CA paragraph 3
          </div>
        </div>

        {/* Net Tax Impact */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Direct Tax Impact</span>
            <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            +{formatCurrencyINR(taxImpactAt30Percent)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Effective corporate tax outflow (31.2%)
          </div>
        </div>

        {/* Peer Review Readiness */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Peer Review Readiness</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            100% Documented
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Clauses backed by audit workpapers &amp; vouchers
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-3xl shadow-sm text-slate-900">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold text-slate-600">
          {[
            { id: "ALL", label: `All Clauses (${clauses.length})` },
            { id: "QUALIFIED", label: `Qualified (${totalQualifiedClauses})` },
            { id: "DISALLOWANCES", label: "Disallowances (21a, 21d)" },
            { id: "DEDUCTIONS", label: "Sec 43B / 43B(h)" },
            { id: "TDS_COMPLIANCE", label: "TDS 40(a)(ia)" },
            { id: "GST_RATIO", label: "Clause 44 GST" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                selectedCategory === cat.id 
                  ? "bg-btred-logo text-white shadow-sm" 
                  : "hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clause, section or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Form 3CD Clauses Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Clause # &amp; Reference</th>
                <th className="py-3.5 px-4">Subject Matter</th>
                <th className="py-3.5 px-4">Audit Finding Status</th>
                <th className="py-3.5 px-4 text-right">Disallowance (₹)</th>
                <th className="py-3.5 px-4">Workpaper Audit Notes (for 3CD)</th>
                <th className="py-3.5 px-4 text-center">Action &amp; Sign-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((item) => (
                <tr key={item.clauseNo} className="hover:bg-slate-50/80 transition-colors">
                  {/* Clause & Ref */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-extrabold text-btred-logo text-sm">{item.clauseNo}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.statutoryRef}</div>
                    {item.workpaperRef && (
                      <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                        {item.workpaperRef}
                      </span>
                    )}
                  </td>

                  {/* Title & Description */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.status === "COMPLIANT" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Compliant
                      </span>
                    ) : item.status === "QUALIFIED_AUDIT_REPORT" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-btred-logo border border-red-200">
                        <AlertTriangle className="w-3 h-3 text-btred-logo" /> Qualified (Add-back)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Not Applicable
                      </span>
                    )}
                  </td>

                  {/* Disallowance Amount */}
                  <td className="py-3 px-4 text-right font-mono font-black whitespace-nowrap">
                    {item.disallowanceAmount > 0 ? (
                      <span className="text-btred-logo text-sm">+{formatCurrencyINR(item.disallowanceAmount)}</span>
                    ) : (
                      <span className="text-slate-400 font-bold">Nil</span>
                    )}
                  </td>

                  {/* Workpaper Notes */}
                  <td className="py-3 px-4 text-[11px] text-slate-700 leading-relaxed max-w-sm">
                    {item.auditNotes}
                  </td>

                  {/* Action Column */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Drilldown Drawer */}
                      <button
                        onClick={() => handleOpenClauseDetail(item)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] transition"
                        title="Inspect workpaper vouchers and edit clause"
                      >
                        Inspect
                      </button>

                      {/* WhatsApp Inquiry if Qualified */}
                      {item.status === "QUALIFIED_AUDIT_REPORT" && (
                        <button
                          onClick={() => handleOpenWhatsAppQuery(item)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 transition shadow-sm"
                          title="Ask client for bills or payment proof via WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Ask Client</span>
                        </button>
                      )}

                      {/* Partner Sign-off Toggle */}
                      <button
                        onClick={() => handleToggleSignOff(item.clauseNo)}
                        className={`p-1.5 rounded-xl border transition ${
                          item.partnerSignedOff
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600"
                        }`}
                        title={item.partnerSignedOff ? "Partner Signed Off ✓" : "Click to Sign Off Clause"}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Clause 44 GST 7-Column Reconciliation Matrix                      */}
      {/* ========================================================================= */}
      {isClause44ModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Clause 44: Break-up of Total Expenditure under GST</h3>
                  <p className="text-[11px] text-slate-500">Official Departmental 7-Column Statutory Schedule for Form 3CD</p>
                </div>
              </div>
              <button onClick={() => setIsClause44ModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] font-sans">
                  <tr>
                    <th className="p-3">Sl No.</th>
                    <th className="p-3">Expenditure Head</th>
                    <th className="p-3 text-right">Total Expenditure (Col 2)</th>
                    <th className="p-3 text-right">Exempt Goods/Services (Col 3)</th>
                    <th className="p-3 text-right">Composition Entities (Col 4)</th>
                    <th className="p-3 text-right">Registered Entities (Col 5)</th>
                    <th className="p-3 text-right">Unregistered Entities (Col 7)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="p-3">1</td>
                    <td className="p-3 font-sans font-bold">Raw Material &amp; Manufacturing Purchases</td>
                    <td className="p-3 text-right font-black">₹3,45,00,000</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right text-emerald-700 font-bold">₹3,45,00,000</td>
                    <td className="p-3 text-right">₹0</td>
                  </tr>
                  <tr>
                    <td className="p-3">2</td>
                    <td className="p-3 font-sans font-bold">Freight, Logistics &amp; Transport</td>
                    <td className="p-3 text-right font-black">₹42,00,000</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right text-emerald-700 font-bold">₹34,20,000</td>
                    <td className="p-3 text-right text-rose-700 font-bold">₹7,80,000</td>
                  </tr>
                  <tr>
                    <td className="p-3">3</td>
                    <td className="p-3 font-sans font-bold">Power, Fuel &amp; Utilities</td>
                    <td className="p-3 text-right font-black">₹35,00,000</td>
                    <td className="p-3 text-right text-slate-600 font-bold">₹35,00,000</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                  </tr>
                  <tr>
                    <td className="p-3">4</td>
                    <td className="p-3 font-sans font-bold">Repairs, Maintenance &amp; Consumables</td>
                    <td className="p-3 text-right font-black">₹24,50,000</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right text-indigo-700 font-bold">₹14,50,000</td>
                    <td className="p-3 text-right text-emerald-700 font-bold">₹6,50,000</td>
                    <td className="p-3 text-right text-rose-700 font-bold">₹3,50,000</td>
                  </tr>
                  <tr>
                    <td className="p-3">5</td>
                    <td className="p-3 font-sans font-bold">Legal, Audit &amp; Professional Charges</td>
                    <td className="p-3 text-right font-black">₹35,50,000</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right text-emerald-700 font-bold">₹35,50,000</td>
                    <td className="p-3 text-right">₹0</td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="p-3">TOTAL</td>
                    <td className="p-3 font-sans">Grand Total Expenditure</td>
                    <td className="p-3 text-right text-emerald-400 font-black">₹4,82,00,000</td>
                    <td className="p-3 text-right">₹35,00,000</td>
                    <td className="p-3 text-right">₹14,50,000</td>
                    <td className="p-3 text-right text-emerald-400">₹4,21,20,000</td>
                    <td className="p-3 text-right text-rose-400">₹11,30,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                GST Registered Ratio: <strong>87.38%</strong> | Reconciled with Annual Return GSTR-9
              </span>
              <button
                onClick={() => setIsClause44ModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Form 3CA / 3CB Statutory Audit Report Generator                   */}
      {/* ========================================================================= */}
      {isForm3caModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[90vh] flex flex-col font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Form 3CA / Form 3CD Statutory Audit Report</h3>
                  <p className="text-[11px] text-slate-500">Report of audit under section 44AB of the Income-tax Act, 1961</p>
                </div>
              </div>
              <button onClick={() => setIsForm3caModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 p-2 text-xs text-slate-700 leading-relaxed font-serif">
              <div className="text-center border-b pb-3 font-sans">
                <h4 className="text-base font-black uppercase text-slate-900">FORM NO. 3CA</h4>
                <p className="text-[11px] text-slate-500">[See rule 6G(1)(a)]</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">Audit report under section 44AB of the Income-tax Act, 1961 in a case where the accounts of the business have been audited under any other law</p>
              </div>

              <p>
                1. We report that the statutory audit of <strong>{activeProfile.clientName}</strong> (PAN: <strong>{activeProfile.pan}</strong>, CIN: {activeProfile.cinOrLlp}) was conducted by us in accordance with the provisions of the Companies Act, 2013 for the year ended on 31st March 2026.
              </p>

              <p>
                2. The statement of particulars required to be furnished under section 44AB is given in <strong>Form No. 3CD</strong> annexed herewith.
              </p>

              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 text-slate-900 font-sans space-y-2">
                <strong className="block text-xs uppercase font-black text-amber-900">
                  3. In our opinion and to the best of our information and according to explanations given to us, the particulars given in Form 3CD are true and correct subject to the following observations / qualifications:
                </strong>
                <ol className="list-decimal pl-4 space-y-1 text-xs">
                  <li><strong>Clause 21(a):</strong> Fines and penalties aggregating to ₹45,000 paid for late filings under Section 234E &amp; GST have been disallowed under Section 37(1).</li>
                  <li><strong>Clause 21(d):</strong> Bearer cheque payments for freight aggregating to ₹78,000 have been reported for disallowance under Section 40A(3).</li>
                  <li><strong>Clause 26:</strong> Sum of ₹2,30,000 payable to micro-supplier ABC Packaging remaining unpaid beyond 45 days has been added back to income under Section 43B(h).</li>
                  <li><strong>Clause 34(a):</strong> Contractual tooling payment of ₹3,00,000 made without TDS u/s 194C attracts 30% statutory disallowance of ₹90,000 under Section 40(a)(ia).</li>
                </ol>
              </div>

              <div className="pt-3 border-t flex justify-between items-center font-sans">
                <div>
                  <p><strong>For GPA &amp; Co.</strong></p>
                  <p className="text-slate-500">Chartered Accountants (FRN: 022998C)</p>
                  <p className="mt-4 font-bold text-slate-900">CA Gunjan Jain (FCA, Partner)</p>
                  <p className="text-slate-500">Membership No: 098221</p>
                </div>
                <div className="text-right">
                  <p><strong>Place:</strong> Mumbai</p>
                  <p><strong>Date:</strong> 30th September 2026</p>
                  <p className="mt-4 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 inline-block">
                    UDIN: {udinNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-400">Total Statutory Disallowances Certified: <strong>{formatCurrencyINR(totalDisallowances)}</strong></span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Audit Report
                </button>
                <button
                  onClick={() => setIsForm3caModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Clause Detail & Workpaper Editing Drawer                         */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && selectedClauseDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-btred-logo uppercase">{selectedClauseDetail.clauseNo} &bull; {selectedClauseDetail.statutoryRef}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{selectedClauseDetail.title}</h3>
              </div>
              <button onClick={() => setIsDetailDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Audit Finding Status</label>
                <select
                  value={selectedClauseDetail.status}
                  onChange={(e) => setSelectedClauseDetail({ ...selectedClauseDetail, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900 outline-none"
                >
                  <option value="COMPLIANT">Compliant (No Disallowance)</option>
                  <option value="QUALIFIED_AUDIT_REPORT">Qualified Audit Report (Add-back to Income)</option>
                  <option value="NOT_APPLICABLE">Not Applicable</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Disallowance Amount (₹)</label>
                <input
                  type="number"
                  value={selectedClauseDetail.disallowanceAmount}
                  onChange={(e) => setSelectedClauseDetail({ ...selectedClauseDetail, disallowanceAmount: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold font-mono text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Workpaper Audit Notes (For Form 3CD Schedule)</label>
                <textarea
                  rows={4}
                  value={selectedClauseDetail.auditNotes}
                  onChange={(e) => setSelectedClauseDetail({ ...selectedClauseDetail, auditNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-semibold text-slate-700">CA Partner Audit Sign-off</span>
                <button
                  type="button"
                  onClick={() => setSelectedClauseDetail({ ...selectedClauseDetail, partnerSignedOff: !selectedClauseDetail.partnerSignedOff })}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    selectedClauseDetail.partnerSignedOff ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{selectedClauseDetail.partnerSignedOff ? "Signed Off ✓" : "Pending Sign-off"}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveClauseEdits(selectedClauseDetail)}
                className="px-5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Clause Workpaper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: WhatsApp Management Audit Query                                  */}
      {/* ========================================================================= */}
      {isWhatsAppModalOpen && selectedClauseForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Draft Tax Audit Query to Client</h3>
                  <p className="text-[11px] text-slate-500">Section 44AB Audit Qualification Representation Notice</p>
                </div>
              </div>
              <button onClick={() => setIsWhatsAppModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
              <div><strong>Client Contact:</strong> {activeProfile.primaryContact.name} ({activeProfile.primaryContact.designation})</div>
              <div><strong>Phone:</strong> {activeProfile.primaryContact.phone}</div>
              <div><strong>Clause:</strong> {selectedClauseForWhatsApp.clauseNo} — {selectedClauseForWhatsApp.title}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Edit Audit Query</label>
              <textarea
                rows={8}
                value={customWhatsAppMsg}
                onChange={(e) => setCustomWhatsAppMsg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(customWhatsAppMsg);
                  toast.success("Query Copied", "Message copied to clipboard.");
                  setIsWhatsAppModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Query
              </button>
              <button
                onClick={() => {
                  const phone = sanitizeIndianPhoneNumber(activeProfile.primaryContact.phone || "919820011223");
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(customWhatsAppMsg)}`, "_blank");
                  toast.success("WhatsApp Opened", `Audit query sent to ${activeProfile.primaryContact.name}.`);
                  setIsWhatsAppModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Launch WhatsApp Web
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
