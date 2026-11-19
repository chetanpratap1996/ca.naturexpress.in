"use client";

import React, { useState, useMemo } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { ClientEntity } from "@/lib/types";
import { Form3cdUploadModal, ExtractedTaxAuditData } from "./Form3cdUploadModal";
import { Form3caReportModal } from "./Form3caReportModal";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import { Clause44Engine, ExpenseLedgerItem, Clause44Report } from "@/lib/taxAudit/clause44Engine";
import { Clause22MsmeEngine, MsmeCreditorInvoiceItem, Clause22Report } from "@/lib/taxAudit/clause22MsmeEngine";
import { Clause34TdsEngine, TdsTransactionAuditItem, Clause34Report } from "@/lib/taxAudit/clause34TdsEngine";

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
  Table,
  Upload,
  Scale,
  CreditCard,
  AlertCircle,
  FileSpreadsheet
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
        status: "QUALIFIED_AUDIT_REPORT",
        disallowanceAmount: 37462,
        auditNotes: "Penal compound interest @ 20.25% (3x RBI Bank Rate) on delayed payments to micro-suppliers ABC Packaging and Precision CNC. Inadmissible under Section 23 of MSMED Act.",
        workpaperRef: "WP-22-MSME-INT",
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
        clauseNo: "Clause 44",
        title: "Break-up of Total Expenditure under GST",
        category: "GST_RATIO",
        statutoryRef: "Clause 44 of Form 3CD",
        description: "Mandatory reporting of total expenditure relating to entities registered under GST vs composition vs exempt vs unregistered entities.",
        status: "COMPLIANT",
        disallowanceAmount: 0,
        auditNotes: "Reconciled with Annual Return GSTR-9. Total Expenditure: ₹3.07 Cr (GST Registered: ₹3.01 Cr [97.9%], Composition: ₹3.2L, Exempt: ₹4.5L, Unregistered: ₹6.4L).",
        workpaperRef: "WP-44-GST-RECO",
        partnerSignedOff: true
      }
    ]
  }
};

// Seed Data for Clause 44
const INITIAL_CLAUSE44_LEDGERS: ExpenseLedgerItem[] = [
  {
    id: "l-1",
    ledgerName: "Raw Steel Ingot Procurement",
    accountHead: "Raw Material Consumption",
    totalExpenditureInr: 28500000,
    gstRegistrationType: "REGISTERED_REGULAR",
    vendorGstin: "27AAACJ4491D1Z8"
  },
  {
    id: "l-2",
    ledgerName: "Factory Shed Civil Maintenance",
    accountHead: "Repairs & Maintenance",
    totalExpenditureInr: 850000,
    gstRegistrationType: "REGISTERED_REGULAR",
    vendorGstin: "23AAGCR4421L1ZB"
  },
  {
    id: "l-3",
    ledgerName: "Local Staff Canteen Catering Supplies",
    accountHead: "Canteen Expenses",
    totalExpenditureInr: 320000,
    gstRegistrationType: "COMPOSITION",
    vendorGstin: "23AANCP9915B1Z9"
  },
  {
    id: "l-4",
    ledgerName: "Agricultural Packaging Material",
    accountHead: "Packaging Charges",
    totalExpenditureInr: 450000,
    gstRegistrationType: "EXEMPT_NIL_RATED",
    vendorGstin: "23AAGCA1102K1Z3"
  },
  {
    id: "l-5",
    ledgerName: "Daily Labour Wages (Loading/Unloading)",
    accountHead: "Freight & Loading Charges",
    totalExpenditureInr: 640000,
    gstRegistrationType: "UNREGISTERED"
  },
  {
    id: "l-6",
    ledgerName: "Factory Workers Salaries",
    accountHead: "Salaries and Wages",
    totalExpenditureInr: 12500000,
    gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION",
    isSalaryOrStaffWelfare: true
  },
  {
    id: "l-7",
    ledgerName: "Plant & Machinery Depreciation",
    accountHead: "Depreciation & Amortisation",
    totalExpenditureInr: 4200000,
    gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION",
    isDepreciationOrProvision: true
  }
];

// Seed Data for Clause 22 & MSME
const INITIAL_MSME_INVOICES: MsmeCreditorInvoiceItem[] = [
  {
    id: "msme-1",
    vendorName: "ABC Corrugated Packaging LLP",
    vendorPan: "AANFA1120K",
    udyamRegistrationNo: "UDYAM-MP-08-0012941",
    enterpriseCategory: "MICRO",
    hasWrittenAgreement: true,
    nicCode: "1702",
    invoiceNumber: "ABC/25-26/0491",
    invoiceDate: "2026-01-14",
    deliveryOrAcceptanceDate: "2026-01-16",
    invoiceAmountInr: 230000,
    paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
  },
  {
    id: "msme-2",
    vendorName: "Precision CNC Toolings Pvt Ltd",
    vendorPan: "AABCP4412H",
    udyamRegistrationNo: "UDYAM-MH-12-0044910",
    enterpriseCategory: "SMALL",
    hasWrittenAgreement: false, // 15 days window
    nicCode: "2593",
    invoiceNumber: "PCT/2026/881",
    invoiceDate: "2026-02-10",
    deliveryOrAcceptanceDate: "2026-02-12",
    invoiceAmountInr: 185000,
    paymentStatus: "PAID_AFTER_DUE_DATE_WITHIN_FY",
    actualPaymentDate: "2026-03-24"
  },
  {
    id: "msme-3",
    vendorName: "Shree Ganesh Industrial Hardware (Trader)",
    vendorPan: "AAHFS9912M",
    udyamRegistrationNo: "UDYAM-MP-08-0099412",
    enterpriseCategory: "TRADER_EXCLUDED",
    hasWrittenAgreement: true,
    nicCode: "4659", // Retail/Wholesale trader excluded
    invoiceNumber: "SGH/0921",
    invoiceDate: "2026-01-20",
    deliveryOrAcceptanceDate: "2026-01-22",
    invoiceAmountInr: 340000,
    paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
  },
  {
    id: "msme-4",
    vendorName: "Kalyani Forgings & Castings Ltd",
    vendorPan: "AAACK9910D",
    udyamRegistrationNo: "UDYAM-MH-12-0088120",
    enterpriseCategory: "MEDIUM",
    hasWrittenAgreement: true,
    nicCode: "2410",
    invoiceNumber: "KFC/MUM/1102",
    invoiceDate: "2026-01-10",
    deliveryOrAcceptanceDate: "2026-01-12",
    invoiceAmountInr: 1200000,
    paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
  }
];

// Seed Data for Clause 34
const INITIAL_TDS_TRANSACTIONS: TdsTransactionAuditItem[] = [
  {
    id: "tx-1",
    tanOfAssessee: "BPLR01492E",
    sectionCode: "194C",
    natureOfPayment: "Contractual Tooling & Fabrication",
    payeeName: "Apex Engineering Works",
    payeePan: "AAACE9912M",
    grossPaymentInr: 300000,
    thresholdExemptionInr: 100000,
    amountLiableForTdsInr: 300000,
    prescribedTdsRatePcnt: 2,
    actualTdsDeductedInr: 0, // DEFAULT NON-DEDUCTION -> Sec 40(a)(ia) 30%
    actualRateAppliedPcnt: 0,
    statutoryDepositDueDate: "2025-10-07",
    isChallanDepositedOnTime: false
  },
  {
    id: "tx-2",
    tanOfAssessee: "BPLR01492E",
    sectionCode: "194J_PROF",
    natureOfPayment: "Legal & Corporate Advisory Fees",
    payeeName: "Singhania & Partners LLP",
    payeePan: "AAAFS1102P",
    grossPaymentInr: 450000,
    thresholdExemptionInr: 30000,
    amountLiableForTdsInr: 450000,
    prescribedTdsRatePcnt: 10,
    actualTdsDeductedInr: 45000,
    actualRateAppliedPcnt: 10,
    statutoryDepositDueDate: "2025-11-07",
    isChallanDepositedOnTime: true,
    bsrCode: "0210041",
    challanSerialNo: "00192"
  },
  {
    id: "tx-3",
    tanOfAssessee: "BPLR01492E",
    sectionCode: "194I_LAND",
    natureOfPayment: "Factory Premises Rent",
    payeeName: "Industrial Estates Indore Ltd",
    payeePan: "AAACI4401K",
    grossPaymentInr: 1200000,
    thresholdExemptionInr: 240000,
    amountLiableForTdsInr: 1200000,
    prescribedTdsRatePcnt: 10,
    actualTdsDeductedInr: 120000,
    actualRateAppliedPcnt: 10,
    statutoryDepositDueDate: "2025-12-07",
    isChallanDepositedOnTime: true,
    bsrCode: "0210041",
    challanSerialNo: "00244"
  },
  {
    id: "tx-4",
    tanOfAssessee: "BPLR01492E",
    sectionCode: "194Q",
    natureOfPayment: "Purchase of Raw Materials exceeding ₹50L",
    payeeName: "JSW Steel Coated Products Ltd",
    payeePan: "AAACJ4491D",
    grossPaymentInr: 8500000,
    thresholdExemptionInr: 5000000,
    amountLiableForTdsInr: 3500000,
    prescribedTdsRatePcnt: 0.1,
    actualTdsDeductedInr: 3500,
    actualRateAppliedPcnt: 0.1,
    statutoryDepositDueDate: "2026-01-07",
    isChallanDepositedOnTime: true,
    bsrCode: "0210041",
    challanSerialNo: "00310"
  }
];

interface Form3cdWorkpaperProps {
  clients?: ClientEntity[];
}

export const Form3cdWorkpaper: React.FC<Form3cdWorkpaperProps> = ({ clients = [] }) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("CLI-APEX-01");
  const [activeSuite, setActiveSuite] = useState<"clauses_master" | "clause44_engine" | "clause22_msme" | "clause34_tds">("clauses_master");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Modals & Drawers
  const [selectedClauseDetail, setSelectedClauseDetail] = useState<Form3cdClause | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isForm3caModalOpen, setIsForm3caModalOpen] = useState(false);

  // Active Client Entity
  const activeClients = useMemo(() => {
    return (clients && clients.length > 0) ? clients : [];
  }, [clients]);

  const currentEntity = useMemo(() => {
    if (!activeClients || activeClients.length === 0) return null;
    return activeClients.find(c => c.id === selectedEntityId) || activeClients[0];
  }, [activeClients, selectedEntityId]);

  const activeProfile = useMemo<ClientAuditProfile>(() => {
    const entityId = currentEntity?.id || "CLI-APEX-01";
    if (CLIENT_AUDIT_PROFILES[entityId]) {
      return CLIENT_AUDIT_PROFILES[entityId];
    }
    return CLIENT_AUDIT_PROFILES["CLI-APEX-01"];
  }, [currentEntity]);

  const [clauses, setClauses] = useState<Form3cdClause[]>(() => activeProfile.clauses);

  // Generate Real Clause 44 Report
  const clause44Report = useMemo<Clause44Report>(() => {
    return Clause44Engine.generateClause44({
      assesseeName: activeProfile.clientName,
      pan: activeProfile.pan,
      financialYear: activeProfile.financialYear,
      assessmentYear: activeProfile.assessmentYear,
      ledgers: INITIAL_CLAUSE44_LEDGERS
    });
  }, [activeProfile]);

  // Generate Real Clause 22 MSME Report
  const clause22Report = useMemo<Clause22Report>(() => {
    return Clause22MsmeEngine.evaluateMsmeCreditors({
      assesseeName: activeProfile.clientName,
      pan: activeProfile.pan,
      financialYear: activeProfile.financialYear,
      assessmentYear: activeProfile.assessmentYear,
      invoices: INITIAL_MSME_INVOICES
    });
  }, [activeProfile]);

  // Generate Real Clause 34 TDS Report
  const clause34Report = useMemo<Clause34Report>(() => {
    return Clause34TdsEngine.auditTdsCompliance({
      assesseeName: activeProfile.clientName,
      tan: "BPLR01492E",
      financialYear: activeProfile.financialYear,
      assessmentYear: activeProfile.assessmentYear,
      transactions: INITIAL_TDS_TRANSACTIONS
    });
  }, [activeProfile]);

  // Filtered Clauses
  const filteredClauses = useMemo(() => {
    return clauses.filter(c => {
      let matchCat = true;
      if (selectedCategory === "DISALLOWANCES") matchCat = c.category === "DISALLOWANCES";
      else if (selectedCategory === "TDS_COMPLIANCE") matchCat = c.category === "TDS_COMPLIANCE";
      else if (selectedCategory === "GST_RATIO") matchCat = c.category === "GST_RATIO";
      else if (selectedCategory === "QUALIFIED") matchCat = c.status === "QUALIFIED_AUDIT_REPORT";

      const q = search.toLowerCase();
      const matchSearch =
        c.clauseNo.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.statutoryRef.toLowerCase().includes(q) ||
        c.auditNotes.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [clauses, selectedCategory, search]);

  const totalDisallowances = useMemo(() => {
    return clauses.reduce((sum, c) => sum + (c.disallowanceAmount || 0), 0);
  }, [clauses]);

  const handleBatchSignOff = () => {
    playSuccessChime();
    setClauses(prev => prev.map(c => {
      if (c.status === "COMPLIANT") {
        return { ...c, partnerSignedOff: true };
      }
      return c;
    }));
    toast.success("Batch Sign-Off Complete", "All compliant clauses signed off by Partner.");
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* HEADER: Tax Audit Engagement Context                                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-purple-200">
                Module 2.3 • Section 44AB Tax Audit Workpapers
              </span>
              <span className="text-xs text-slate-400 font-medium">ICAI Guidance Note &amp; Form 3CA/3CD</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tax Audit Form 3CD Automated Workpapers
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Clause 44 GST expenditure break-up, Clause 22 Section 43B(h) MSME overdue interest engine, and Clause 34 TDS audit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <select
                value={selectedEntityId}
                onChange={(e) => {
                  playSoftClick();
                  setSelectedEntityId(e.target.value);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="CLI-APEX-01">Apex AutoTech Private Limited (AABCA8891D)</option>
                <option value="CLI-PRATWI-01">Pratwi Solutions Private Limited (AANCP9915B)</option>
              </select>
            </div>

            <button
              onClick={() => {
                playSoftClick();
                setIsForm3caModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm transition"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              Form 3CA/3CB Audit Report
            </button>
          </div>
        </div>

        {/* Audit Metric Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audited Turnover</span>
            <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">₹{activeProfile.turnoverCr} Crore</span>
            <span className="text-[10px] text-slate-500 font-medium">{activeProfile.auditType}</span>
          </div>

          <div className="bg-rose-50/60 rounded-2xl p-3 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Total Disallowances</span>
            <span className="text-sm font-black text-rose-900 font-mono mt-0.5 block">{formatCurrencyINR(totalDisallowances)}</span>
            <span className="text-[10px] text-rose-600 font-bold">Add Back in Computation</span>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Sec 43B(h) MSME</span>
            <span className="text-sm font-black text-amber-900 font-mono mt-0.5 block">{formatCurrencyINR(clause22Report.summary.totalDisallowedUnder43BhInr)}</span>
            <span className="text-[10px] text-amber-600 font-bold">Clause 22 / 26</span>
          </div>

          <div className="bg-purple-50/60 rounded-2xl p-3 border border-purple-100">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Sec 40(a)(ia) TDS (30%)</span>
            <span className="text-sm font-black text-purple-900 font-mono mt-0.5 block">{formatCurrencyINR(clause34Report.summary.totalDisallowanceSection40a_ia_Inr)}</span>
            <span className="text-[10px] text-purple-600 font-bold">Clause 34(a)</span>
          </div>

          <div className="bg-blue-50/60 rounded-2xl p-3 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Clause 44 Registered</span>
            <span className="text-sm font-black text-blue-900 font-mono mt-0.5 block">{clause44Report.summary.percentageGstRegistered}%</span>
            <span className="text-[10px] text-blue-600 font-medium">GST Compliant Procurements</span>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Partner Sign-off</span>
            <span className="text-sm font-black text-emerald-900 font-mono mt-0.5 block">
              {clauses.filter(c => c.partnerSignedOff).length}/{clauses.length}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">ICAI SQC-1 Verified</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 SUITE TABS NAVIGATION                                                   */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            playSoftClick();
            setActiveSuite("clauses_master");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSuite === "clauses_master"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Master 3CD Clauses &amp; Sign-Offs
          <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
            {clauses.length}
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveSuite("clause44_engine");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSuite === "clause44_engine"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Table className="w-4 h-4 text-blue-400" />
          Clause 44 GST Expenditure Engine
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-700 text-[10px] rounded-full font-bold">
            Col 2 to 7
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveSuite("clause22_msme");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSuite === "clause22_msme"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" />
          Clause 22 &amp; Sec 43B(h) MSME Engine
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 text-[10px] rounded-full font-bold">
            3x RBI Rate
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveSuite("clause34_tds");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSuite === "clause34_tds"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4 text-purple-400" />
          Clause 34 Chapter XVII-B TDS Audit
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-700 text-[10px] rounded-full font-bold">
            30% Sec 40(a)(ia)
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUITE 1: MASTER 3CD CLAUSES & SIGN-OFFS                                   */}
      {/* ========================================================================= */}
      {activeSuite === "clauses_master" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Clauses" },
                { id: "DISALLOWANCES", label: "Disallowances" },
                { id: "TDS_COMPLIANCE", label: "TDS Compliance" },
                { id: "GST_RATIO", label: "GST Ratio (Cl. 44)" },
                { id: "QUALIFIED", label: "Audit Qualifications" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    playSoftClick();
                    setSelectedCategory(f.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === f.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clause, section, notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleBatchSignOff}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Batch Sign-Off
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Clause No &amp; Title</th>
                    <th className="p-3.5">Statutory Authority</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Disallowance (₹)</th>
                    <th className="p-3.5">Auditor Finding &amp; Notes</th>
                    <th className="p-3.5 text-center">Sign-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClauses.map(c => (
                    <tr key={c.clauseNo} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5">
                        <strong className="text-slate-900 font-bold block">{c.clauseNo}: {c.title}</strong>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{c.description}</span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-700 font-medium">
                        {c.statutoryRef}
                      </td>

                      <td className="p-3.5 text-center">
                        {c.status === "COMPLIANT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Compliant
                          </span>
                        )}
                        {c.status === "QUALIFIED_AUDIT_REPORT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Qualified
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold">
                        {c.disallowanceAmount > 0 ? (
                          <span className="text-rose-600 font-black">{formatCurrencyINR(c.disallowanceAmount)}</span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <p className="text-[11px] text-slate-600 leading-tight max-w-sm">
                          {c.auditNotes}
                        </p>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            playSoftClick();
                            setClauses(prev => prev.map(item => item.clauseNo === c.clauseNo ? { ...item, partnerSignedOff: !item.partnerSignedOff } : item));
                            toast.info("Sign-Off Updated", `${c.clauseNo} approval toggled.`);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1 mx-auto ${
                            c.partnerSignedOff
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {c.partnerSignedOff ? "Approved" : "Pending"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUITE 2: CLAUSE 44 GST EXPENDITURE ENGINE                                 */}
      {/* ========================================================================= */}
      {activeSuite === "clause44_engine" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Clause 44: Break-up of Total Expenditure under GST
                </h3>
                <p className="text-xs text-slate-500">
                  Adheres strictly to ICAI Tax Audit Guidance Note: Filters out salaries (Schedule III non-supplies), depreciation, and bad debts.
                </p>
              </div>

              <span className={`px-3 py-1 text-xs font-bold rounded-xl border ${
                clause44Report.summary.isMathematicallyBalanced
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {clause44Report.summary.isMathematicallyBalanced ? "✓ Col 6 + Col 7 = Col 2 Balanced" : "Math Mismatch"}
              </span>
            </div>

            {/* ICAI Guidance Note Exclusions Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salaries (Sch III Non-Supply)</span>
                <strong className="text-slate-900 font-mono text-sm block">
                  {formatCurrencyINR(clause44Report.icaiExclusionBreakdown.salariesAndWagesScheduleIIIInr)}
                </strong>
                <span className="text-[10px] text-slate-500">Excluded from Col 2</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Depreciation (Book Entry)</span>
                <strong className="text-slate-900 font-mono text-sm block">
                  {formatCurrencyINR(clause44Report.icaiExclusionBreakdown.depreciationAndAmortizationInr)}
                </strong>
                <span className="text-[10px] text-slate-500">Non-expenditure entry</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total ICAI Exclusions</span>
                <strong className="text-purple-700 font-mono text-sm block">
                  {formatCurrencyINR(clause44Report.summary.totalIcaiGuidanceExclusionsInr)}
                </strong>
                <span className="text-[10px] text-purple-600">Guidance Note Compliant</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qualifying Operating Exp (Col 2)</span>
                <strong className="text-blue-900 font-mono text-sm block">
                  {formatCurrencyINR(clause44Report.summary.totalQualifyingOperatingExpenditure_Col2)}
                </strong>
                <span className="text-[10px] text-blue-600">Base for Col 3 to Col 7</span>
              </div>
            </div>

            {/* Official Form 3CD Clause 44 Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3 border-r border-slate-200">#</th>
                    <th className="p-3 border-r border-slate-200">Nature of Expenditure</th>
                    <th className="p-3 text-right border-r border-slate-200">Total Exp (Col 2)</th>
                    <th className="p-3 text-right border-r border-slate-200">Exempt (Col 3)</th>
                    <th className="p-3 text-right border-r border-slate-200">Composition (Col 4)</th>
                    <th className="p-3 text-right border-r border-slate-200">Standard GST (Col 5)</th>
                    <th className="p-3 text-right border-r border-slate-200 bg-blue-50/50">Total Reg (Col 6)</th>
                    <th className="p-3 text-right bg-rose-50/50">Unregistered (Col 7)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {clause44Report.rows.map(r => (
                    <tr key={r.sNo} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-sans border-r border-slate-100">{r.sNo}</td>
                      <td className="p-3 font-sans font-bold text-slate-800 border-r border-slate-100">{r.natureOfExpenditure}</td>
                      <td className="p-3 text-right font-bold text-slate-900 border-r border-slate-100">{formatCurrencyINR(r.totalExpenditureInr_Col2)}</td>
                      <td className="p-3 text-right text-slate-600 border-r border-slate-100">{formatCurrencyINR(r.exemptSuppliesInr_Col3)}</td>
                      <td className="p-3 text-right text-slate-600 border-r border-slate-100">{formatCurrencyINR(r.compositionEntitiesInr_Col4)}</td>
                      <td className="p-3 text-right text-emerald-700 font-bold border-r border-slate-100">{formatCurrencyINR(r.otherRegisteredEntitiesInr_Col5)}</td>
                      <td className="p-3 text-right font-black text-blue-900 bg-blue-50/30 border-r border-slate-100">{formatCurrencyINR(r.totalRegisteredEntitiesInr_Col6)}</td>
                      <td className="p-3 text-right text-rose-700 font-bold bg-rose-50/30">{formatCurrencyINR(r.unregisteredEntitiesInr_Col7)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td colSpan={2} className="p-3 font-sans">Total Form 3CD Clause 44 Figures</td>
                    <td className="p-3 text-right">{formatCurrencyINR(clause44Report.summary.totalQualifyingOperatingExpenditure_Col2)}</td>
                    <td className="p-3 text-right">{formatCurrencyINR(clause44Report.summary.totalExemptSupplies_Col3)}</td>
                    <td className="p-3 text-right">{formatCurrencyINR(clause44Report.summary.totalComposition_Col4)}</td>
                    <td className="p-3 text-right">{formatCurrencyINR(clause44Report.summary.totalStandardRegistered_Col5)}</td>
                    <td className="p-3 text-right text-emerald-400 font-black">{formatCurrencyINR(clause44Report.summary.totalRegisteredEntities_Col6)}</td>
                    <td className="p-3 text-right text-rose-300 font-black">{formatCurrencyINR(clause44Report.summary.totalUnregisteredEntities_Col7)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUITE 3: CLAUSE 22 & SECTION 43B(h) MSME ENGINE                           */}
      {/* ========================================================================= */}
      {activeSuite === "clause22_msme" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Clause 22 &amp; Section 43B(h) MSME Overdue Disallowance Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Tracks 15-day (no agreement) and 45-day (written agreement) payment windows under Section 15 of MSMED Act.
                </p>
              </div>

              <div className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200">
                Penal Interest Rate: 3x RBI Rate = 20.25% p.a.
              </div>
            </div>

            {/* Official Clause 22 Sub-Table Disclosures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-600">(i) Principal amount unpaid at year-end:</span>
                  <strong className="font-mono text-rose-700">{formatCurrencyINR(clause22Report.clause22Disclosures.principalUnpaidAtYearEnd_SubClauseI)}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-600">(i) Interest due remaining unpaid at year-end:</span>
                  <strong className="font-mono text-rose-700">{formatCurrencyINR(clause22Report.clause22Disclosures.interestDueRemainingUnpaidAtYearEnd_SubClauseI)}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-600">(ii) Interest paid under Section 16 during the year:</span>
                  <strong className="font-mono text-slate-800">{formatCurrencyINR(clause22Report.clause22Disclosures.interestPaidUnderSection16_SubClauseII)}</strong>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-600">(iii) Interest due and payable for delay without payment:</span>
                  <strong className="font-mono text-amber-700">{formatCurrencyINR(clause22Report.clause22Disclosures.interestDueAndPayableForDelay_SubClauseIII)}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-600">(iv) Interest accrued and remaining unpaid at year-end:</span>
                  <strong className="font-mono text-amber-700">{formatCurrencyINR(clause22Report.clause22Disclosures.interestAccruedAndRemainingUnpaid_SubClauseIV)}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200/70 pb-1.5">
                  <span className="text-slate-600">(v) Further interest remaining due in succeeding years:</span>
                  <strong className="font-mono text-slate-800">{formatCurrencyINR(clause22Report.clause22Disclosures.furtherInterestRemainingDueInSucceedingYears_SubClauseV)}</strong>
                </div>
              </div>
            </div>

            {/* Audited Creditor Invoices Schedule */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Vendor &amp; Udyam No</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Due Date (Window)</th>
                    <th className="p-3 text-right">Invoice (₹)</th>
                    <th className="p-3 text-right">Sec 43B(h) Disallowed</th>
                    <th className="p-3 text-right">Sec 16 Interest (20.25%)</th>
                    <th className="p-3">Audit Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clause22Report.auditedInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{inv.vendorName}</strong>
                        <span className="font-mono text-[10px] text-slate-400">{inv.udyamNo || "No Udyam"}</span>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-700">
                        {inv.enterpriseCategory}
                      </td>

                      <td className="p-3 font-mono text-slate-600">
                        {inv.statutoryDueDate} ({inv.statutoryLimitDays}d)
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrencyINR(INITIAL_MSME_INVOICES.find(i => i.id === inv.id)?.invoiceAmountInr || 0)}
                      </td>

                      <td className="p-3 text-right font-mono font-black">
                        {inv.isDisallowedUnder43Bh ? (
                          <span className="text-rose-600">{formatCurrencyINR(inv.disallowanceAmountInr)}</span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-amber-700">
                        {formatCurrencyINR(inv.penalInterestPayableSection16Inr)}
                      </td>

                      <td className="p-3 text-[11px] text-slate-600 leading-tight max-w-xs">
                        {inv.statutoryAuditTrail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUITE 4: CLAUSE 34 CHAPTER XVII-B TDS AUDIT ENGINE                        */}
      {/* ========================================================================= */}
      {activeSuite === "clause34_tds" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Clause 34: Audit of Compliance with Chapter XVII-B TDS/TCS
                </h3>
                <p className="text-xs text-slate-500">
                  Verifies deduction across all sections, Section 40(a)(ia) 30% disallowances, Section 234E late fees, and Section 201(1A) penal interest.
                </p>
              </div>

              <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-xl border border-purple-200">
                TAN: {clause34Report.tan}
              </div>
            </div>

            {/* Clause 34(a) Section-wise Summary Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Section</th>
                    <th className="p-3">Nature of Payment</th>
                    <th className="p-3 text-right">Total Payments (₹)</th>
                    <th className="p-3 text-right">Liable for TDS (₹)</th>
                    <th className="p-3 text-right">Deducted (₹)</th>
                    <th className="p-3 text-right">Not Deducted (₹)</th>
                    <th className="p-3 text-right bg-rose-50/50">Sec 40(a)(ia) Disallowed (30%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {clause34Report.clause34aSectionTable.map(s => (
                    <tr key={s.sectionCode} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-900">{s.sectionCode}</td>
                      <td className="p-3 font-sans text-slate-700">{s.natureOfPayment}</td>
                      <td className="p-3 text-right font-bold">{formatCurrencyINR(s.totalGrossPaymentsInr)}</td>
                      <td className="p-3 text-right">{formatCurrencyINR(s.totalAmountLiableForDeductionInr)}</td>
                      <td className="p-3 text-right text-emerald-700 font-bold">{formatCurrencyINR(s.amountDeductedAtSpecifiedRateInr)}</td>
                      <td className="p-3 text-right text-rose-600 font-bold">{formatCurrencyINR(s.amountNotDeductedAtAllInr)}</td>
                      <td className="p-3 text-right font-black text-rose-700 bg-rose-50/30">
                        {formatCurrencyINR(s.disallowanceSection40a_ia_Inr)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td colSpan={2} className="p-3 font-sans">Total Clause 34(a) Summary</td>
                    <td className="p-3 text-right">{formatCurrencyINR(clause34Report.summary.totalGrossDisbursementsAuditedInr)}</td>
                    <td className="p-3 text-right">{formatCurrencyINR(clause34Report.summary.totalTdsPayableInr)}</td>
                    <td className="p-3 text-right text-emerald-400">{formatCurrencyINR(clause34Report.summary.totalTdsDeductedInr)}</td>
                    <td className="p-3 text-right text-rose-400">{formatCurrencyINR(clause34Report.summary.totalDefaultNonDeductionInr)}</td>
                    <td className="p-3 text-right text-rose-300 font-black">{formatCurrencyINR(clause34Report.summary.totalDisallowanceSection40a_ia_Inr)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Clause 34(b) Quarterly Returns Timeliness */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Clause 34(b): Quarterly Statements Timeliness (Form 24Q/26Q)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {clause34Report.clause34bQuarterlyReturns.map(q => (
                  <div key={q.quarter} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900 font-mono">{q.formNo} - {q.quarter}</strong>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        q.isFiledOnTime ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {q.isFiledOnTime ? "On Time" : `${q.delayInDays}d Delayed`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Filed: {q.actualFilingDate} (Due: {q.statutoryDueDate})</div>
                    {q.lateFeePayableSection234EInr > 0 && (
                      <div className="text-[11px] font-bold text-rose-600 font-mono">
                        Sec 234E Late Fee: {formatCurrencyINR(q.lateFeePayableSection234EInr)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM 3CA / 3CB AUDIT REPORT                                        */}
      {/* ========================================================================= */}
      {isForm3caModalOpen && (
        <Form3caReportModal
          isOpen={isForm3caModalOpen}
          onClose={() => setIsForm3caModalOpen(false)}
          clientName={activeProfile.clientName}
          pan={activeProfile.pan}
          cinOrLlp={activeProfile.cinOrLlp}
          turnoverCr={activeProfile.turnoverCr}
          auditType={activeProfile.auditType}
          assessmentYear={activeProfile.assessmentYear}
          financialYear={activeProfile.financialYear}
          clauses={clauses}
          udinNumber={`26${activeProfile.pan.substring(5, 9)}BGTA${activeProfile.entityId.slice(-4).replace(/[^0-9]/g, '1')}`}
        />
      )}
    </div>
  );
};
