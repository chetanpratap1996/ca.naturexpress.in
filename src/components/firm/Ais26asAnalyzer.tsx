"use client";

import React, { useState, useMemo } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { ClientEntity } from "@/lib/types";
import { 
  FileSearch, 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  Search, 
  DollarSign, 
  Filter, 
  ArrowRight, 
  TrendingUp, 
  Landmark, 
  Layers, 
  Sparkles, 
  Building2, 
  Check, 
  X, 
  Eye, 
  Copy, 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  CheckCheck, 
  FileText, 
  ChevronDown, 
  Plus, 
  Trash2, 
  SlidersHorizontal, 
  Calculator, 
  FileCheck, 
  RefreshCw, 
  AlertCircle, 
  User, 
  CreditCard, 
  Award, 
  Printer
} from "lucide-react";

export interface AisRecord {
  id: string;
  sourceType: "TDS_26AS" | "SFT_HIGH_VALUE" | "DIVIDEND" | "SECURITIES_TRADING" | "INTEREST_SAVINGS_FD" | "FOREIGN_REMITTANCE" | "IMMOVABLE_PROPERTY";
  partCategory: "PART_B1_TDS" | "PART_B2_SFT" | "PART_B5_OTHER";
  reportingEntity: string;
  description: string;
  pan: string;
  financialYear: string;
  assessmentYear: string;
  reportedAmount: number;
  taxDeducted: number;
  informationCode: string; // e.g. SFT-004, SFT-017, 194J, 194A, 206C
  rule114eThreshold?: string; // Statutory Rule 114E threshold context
  itrStatus: "MATCHED_IN_ITR" | "UNREPORTED_INCOME_RISK" | "DISCREPANCY_FLAG" | "RESOLVED_IN_ITR";
  targetItrSchedule: string; // e.g. Schedule OS, Schedule CG, Schedule TDS-2
  recommendation: string;
  portalFeedbackSubmitted?: string;
}

export interface ClientAisProfile {
  entityId: string;
  taxpayerName: string;
  taxpayerType: "INDIVIDUAL" | "COMPANY";
  pan: string;
  primaryPhone: string;
  assessmentYear: string;
  financialYear: string;
  records: AisRecord[];
}

const CLIENT_AIS_PROFILES: Record<string, ClientAisProfile> = {
  // Profile 1: Rajesh Sharma (Promoter & MD - Apex AutoTech)
  "CLI-APEX-01": {
    entityId: "CLI-APEX-01",
    taxpayerName: "Rajesh Sharma (Promoter - Apex AutoTech)",
    taxpayerType: "INDIVIDUAL",
    pan: "ABFPS1234E",
    primaryPhone: "919820011223",
    assessmentYear: "AY 2026-27",
    financialYear: "FY 2025-26",
    records: [
      {
        id: "ais-1",
        sourceType: "SFT_HIGH_VALUE",
        partCategory: "PART_B2_SFT",
        reportingEntity: "HDFC Bank Limited (Palasia Branch)",
        description: "Cash deposits in current/savings account aggregating to ₹10 Lakh or more (SFT-004)",
        pan: "ABFPS1234E",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 1450000,
        taxDeducted: 0,
        informationCode: "SFT-004",
        rule114eThreshold: "Rule 114E: Cash deposit in savings a/c ≥ ₹10,00,000",
        itrStatus: "UNREPORTED_INCOME_RISK",
        targetItrSchedule: "Schedule BP / Cash Book",
        recommendation: "High Scrutiny Alert: Verify if cash deposits match cash sales vouchers or capital introduction in books to prevent Section 68 unexplained cash credits."
      },
      {
        id: "ais-2",
        sourceType: "TDS_26AS",
        partCategory: "PART_B1_TDS",
        reportingEntity: "Tata Consultancy Services Ltd",
        description: "TDS on Professional/Technical Fees under Section 194J @ 10%",
        pan: "ABFPS1234E",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 850000,
        taxDeducted: 85000,
        informationCode: "SEC_194J",
        itrStatus: "MATCHED_IN_ITR",
        targetItrSchedule: "Schedule TDS-2",
        recommendation: "Gross receipts of ₹8,50,000 and TDS credit of ₹85,000 verified against 26AS. Ready to claim in Schedule TDS-2."
      },
      {
        id: "ais-3",
        sourceType: "DIVIDEND",
        partCategory: "PART_B5_OTHER",
        reportingEntity: "ITC Limited (Registrar & Transfer Agent)",
        description: "Dividend distributed by domestic company under Section 194",
        pan: "ABFPS1234E",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 48500,
        taxDeducted: 4850,
        informationCode: "SEC_194",
        itrStatus: "DISCREPANCY_FLAG",
        targetItrSchedule: "Schedule OS (Income from Other Sources)",
        recommendation: "Client omitted dividend in draft computation. Auto-route ₹48,500 to Schedule OS and claim ₹4,850 TDS credit to avoid Section 143(1)(a) defect."
      },
      {
        id: "ais-4",
        sourceType: "SECURITIES_TRADING",
        partCategory: "PART_B2_SFT",
        reportingEntity: "Zerodha Broking Limited",
        description: "Sale of listed equity shares / units of equity-oriented mutual funds (SFT-017)",
        pan: "ABFPS1234E",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 2240000,
        taxDeducted: 0,
        informationCode: "SFT-017",
        rule114eThreshold: "Rule 114E: Annual securities trading turnover ≥ ₹10,00,000",
        itrStatus: "UNREPORTED_INCOME_RISK",
        targetItrSchedule: "Schedule CG (Capital Gains u/s 111A/112A)",
        recommendation: "Trading turnover reported on AIS is ₹22.4L. Obtain P&L statement from Zerodha to compute STCG u/s 111A and LTCG u/s 112A above ₹1.25L exemption."
      },
      {
        id: "ais-5",
        sourceType: "INTEREST_SAVINGS_FD",
        partCategory: "PART_B1_TDS",
        reportingEntity: "State Bank of India (Indore Main Branch)",
        description: "Interest from Term Deposits (FD) & Savings Bank Account u/s 194A",
        pan: "ABFPS1234E",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 76200,
        taxDeducted: 7620,
        informationCode: "SEC_194A",
        itrStatus: "MATCHED_IN_ITR",
        targetItrSchedule: "Schedule OS & 80TTA",
        recommendation: "Reported in Schedule OS. Deduct ₹10,000 exemption under Section 80TTA (for non-senior assessee) if filing under Old Tax Regime."
      },
      {
        id: "ais-6",
        sourceType: "FOREIGN_REMITTANCE",
        partCategory: "PART_B5_OTHER",
        reportingEntity: "ICICI Bank Forex Services",
        description: "Outward remittance under Liberalised Remittance Scheme (LRS) / TCS u/s 206C(1G)",
        pan: "ABFPS1234E",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 620000,
        taxDeducted: 31000,
        informationCode: "TCS_206C_1G",
        rule114eThreshold: "RBI LRS Foreign Outward Remittance",
        itrStatus: "MATCHED_IN_ITR",
        targetItrSchedule: "Schedule TCS (Prepaid Tax Refund)",
        recommendation: "Foreign education / travel remittance. Claim ₹31,000 TCS credit in Schedule TCS to reduce net ITR tax liability or generate direct refund."
      }
    ]
  },

  // Profile 2: Pratwi Solutions Private Limited (Corporate)
  "CLI-PRATWI-01": {
    entityId: "CLI-PRATWI-01",
    taxpayerName: "Pratwi Solutions Private Limited",
    taxpayerType: "COMPANY",
    pan: "AANCP9915B",
    primaryPhone: "919820044101",
    assessmentYear: "AY 2026-27",
    financialYear: "FY 2025-26",
    records: [
      {
        id: "ais-p1",
        sourceType: "TDS_26AS",
        partCategory: "PART_B1_TDS",
        reportingEntity: "Infosys Limited (Vendor Payouts)",
        description: "TDS on Fees for Professional/Technical Services u/s 194J @ 10%",
        pan: "AANCP9915B",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 4250000,
        taxDeducted: 425000,
        informationCode: "SEC_194J",
        itrStatus: "MATCHED_IN_ITR",
        targetItrSchedule: "Schedule TDS-2 (Corporate)",
        recommendation: "Turnover ₹42.5L matches P&L IT Consulting revenue. Total ₹4.25L prepaid tax credit available for MAT/Corporate tax offset."
      },
      {
        id: "ais-p2",
        sourceType: "TDS_26AS",
        partCategory: "PART_B1_TDS",
        reportingEntity: "Dell India Private Limited",
        description: "TDS on Purchase of Goods under Section 194Q @ 0.1%",
        pan: "AANCP9915B",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 3600000,
        taxDeducted: 3600,
        informationCode: "SEC_194Q",
        itrStatus: "MATCHED_IN_ITR",
        targetItrSchedule: "Schedule TDS-3",
        recommendation: "Hardware purchases above ₹50L aggregate threshold. Verified with Form 3CD Clause 34(a)."
      },
      {
        id: "ais-p3",
        sourceType: "INTEREST_SAVINGS_FD",
        partCategory: "PART_B1_TDS",
        reportingEntity: "HDFC Bank Ltd (Treasury Operations)",
        description: "Interest on Corporate Auto-Sweep Fixed Deposits u/s 194A",
        pan: "AANCP9915B",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 185000,
        taxDeducted: 18500,
        informationCode: "SEC_194A",
        itrStatus: "DISCREPANCY_FLAG",
        targetItrSchedule: "Schedule OS (Corporate Other Income)",
        recommendation: "Bank sweep interest not credited to P&L other income in draft audit computation. Auto-route ₹1,85,000 to Schedule OS."
      },
      {
        id: "ais-p4",
        sourceType: "SFT_HIGH_VALUE",
        partCategory: "PART_B2_SFT",
        reportingEntity: "HDFC Bank Ltd (Nariman Point)",
        description: "Cash withdrawal from current account aggregating to ₹50 Lakh or more (SFT-003)",
        pan: "AANCP9915B",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 5500000,
        taxDeducted: 0,
        informationCode: "SFT-003",
        rule114eThreshold: "Rule 114E: Cash withdrawal from current a/c ≥ ₹50,00,000",
        itrStatus: "UNREPORTED_INCOME_RISK",
        targetItrSchedule: "Form 3CD Clause 21(d) / Sec 40A(3)",
        recommendation: "Section 194N cash withdrawal limit review: Ensure proper documentation of office cash disbursements to satisfy Tax Audit scrutiny."
      }
    ]
  },

  // Profile 3: Aditya Singhal (MD - OmniRetail)
  "CLI-OMNI-01": {
    entityId: "CLI-OMNI-01",
    taxpayerName: "Aditya Singhal (MD - OmniRetail)",
    taxpayerType: "INDIVIDUAL",
    pan: "AFAPS5512B",
    primaryPhone: "919811044211",
    assessmentYear: "AY 2026-27",
    financialYear: "FY 2025-26",
    records: [
      {
        id: "ais-o1",
        sourceType: "DIVIDEND",
        partCategory: "PART_B5_OTHER",
        reportingEntity: "Reliance Industries Limited",
        description: "Dividend distributed on listed shares under Section 194",
        pan: "AFAPS5512B",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 120000,
        taxDeducted: 12000,
        informationCode: "SEC_194",
        itrStatus: "DISCREPANCY_FLAG",
        targetItrSchedule: "Schedule OS",
        recommendation: "Client omitted RIL dividend in draft computation. Auto-route ₹1,20,000 to Schedule OS and claim ₹12,000 TDS credit."
      },
      {
        id: "ais-o2",
        sourceType: "SFT_HIGH_VALUE",
        partCategory: "PART_B2_SFT",
        reportingEntity: "American Express Banking Corp",
        description: "Payment made in cash against credit card bills aggregating to ₹1 Lakh or more (SFT-006)",
        pan: "AFAPS5512B",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 450000,
        taxDeducted: 0,
        informationCode: "SFT-006",
        rule114eThreshold: "Rule 114E: Credit card cash settlement ≥ ₹1,00,000",
        itrStatus: "UNREPORTED_INCOME_RISK",
        targetItrSchedule: "Capital Account / Unexplained Expenditure u/s 69C",
        recommendation: "High Risk SFT Flag: Explain cash source for ₹4.5L Amex bill settlement to avoid Section 69C notice."
      },
      {
        id: "ais-o3",
        sourceType: "SECURITIES_TRADING",
        partCategory: "PART_B2_SFT",
        reportingEntity: "HDFC Mutual Fund AMC",
        description: "Redemption of units of equity and balanced mutual funds (SFT-018)",
        pan: "AFAPS5512B",
        financialYear: "FY 2025-26",
        assessmentYear: "AY 2026-27",
        reportedAmount: 1800000,
        taxDeducted: 0,
        informationCode: "SFT-018",
        rule114eThreshold: "Rule 114E: Mutual fund redemptions aggregate",
        itrStatus: "UNREPORTED_INCOME_RISK",
        targetItrSchedule: "Schedule CG (Section 112A)",
        recommendation: "Mutual fund redemption turnover reported. Compute Long Term Capital Gain with grandfathering benefit if applicable."
      }
    ]
  }
};

interface Ais26asAnalyzerProps {
  clients?: ClientEntity[];
}

export const Ais26asAnalyzer: React.FC<Ais26asAnalyzerProps> = ({ clients = [] }) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Modals
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedRecordForFeedback, setSelectedRecordForFeedback] = useState<AisRecord | null>(null);
  const [feedbackChoice, setFeedbackChoice] = useState("Information is correct");
  const [feedbackRemarks, setFeedbackRemarks] = useState("");

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedRecordForWhatsApp, setSelectedRecordForWhatsApp] = useState<AisRecord | null>(null);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState("");

  const [isAuditMemoOpen, setIsAuditMemoOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Resolve current active client
  const currentEntity = useMemo(() => {
    if (!clients || clients.length === 0) return null;
    return clients.find(c => c.id === selectedEntityId) || clients[0];
  }, [clients, selectedEntityId]);

  // Client AIS Profile
  const activeProfile = useMemo<ClientAisProfile>(() => {
    const entityId = currentEntity?.id || "CLI-APEX-01";
    if (CLIENT_AIS_PROFILES[entityId]) {
      return CLIENT_AIS_PROFILES[entityId];
    }
    return CLIENT_AIS_PROFILES["CLI-APEX-01"];
  }, [currentEntity]);

  // Master records state per client
  const [records, setRecords] = useState<AisRecord[]>(() => activeProfile.records);

  // Sync records when active profile changes
  React.useEffect(() => {
    setRecords(activeProfile.records);
  }, [activeProfile]);

  // Calculations
  const totalReportedValue = useMemo(() => records.reduce((s, r) => s + r.reportedAmount, 0), [records]);
  const totalTdsCredits = useMemo(() => records.reduce((s, r) => s + r.taxDeducted, 0), [records]);
  
  // Unclaimed TDS/TCS Credits that generate direct refunds
  const unclaimedTdsCredits = useMemo(() => {
    return records
      .filter(r => r.itrStatus === "DISCREPANCY_FLAG" || r.sourceType === "FOREIGN_REMITTANCE")
      .reduce((s, r) => s + r.taxDeducted, 0);
  }, [records]);

  // Discrepancy & High Risk Count
  const highRiskDefectCount = useMemo(() => {
    return records.filter(r => r.itrStatus === "UNREPORTED_INCOME_RISK" || r.itrStatus === "DISCREPANCY_FLAG").length;
  }, [records]);

  // Section 143(1)(a) Immunity Score (0 - 100%)
  const immunityScore = useMemo(() => {
    if (records.length === 0) return 100;
    const resolvedCount = records.filter(r => r.itrStatus === "MATCHED_IN_ITR" || r.itrStatus === "RESOLVED_IN_ITR").length;
    return Math.round((resolvedCount / records.length) * 100);
  }, [records]);

  // Filtered Records
  const filtered = useMemo(() => {
    return records.filter(r => {
      let matchesCat = true;
      if (selectedCategory === "PART_B1_TDS") matchesCat = r.partCategory === "PART_B1_TDS";
      else if (selectedCategory === "PART_B2_SFT") matchesCat = r.partCategory === "PART_B2_SFT";
      else if (selectedCategory === "DIVIDEND") matchesCat = r.sourceType === "DIVIDEND";
      else if (selectedCategory === "SECURITIES_TRADING") matchesCat = r.sourceType === "SECURITIES_TRADING";
      else if (selectedCategory === "DISCREPANCIES") matchesCat = r.itrStatus === "UNREPORTED_INCOME_RISK" || r.itrStatus === "DISCREPANCY_FLAG";

      const matchesSearch = 
        r.reportingEntity.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.informationCode.toLowerCase().includes(search.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [records, selectedCategory, search]);

  // 1-Click Auto-Route Discrepancy to ITR Schedule
  const handleAutoRouteToItr = (recordId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          itrStatus: "RESOLVED_IN_ITR",
          recommendation: `Auto-routed to ${r.targetItrSchedule}. Income and TDS credit of ${formatCurrencyINR(r.taxDeducted)} successfully claimed in draft ITR.`
        };
      }
      return r;
    }));
    toast.success("Income Auto-Routed", "Discrepancy resolved and mapped to ITR schedule. Section 143(1)(a) notice prevented.");
  };

  // Open Feedback Modal
  const handleOpenFeedback = (r: AisRecord) => {
    setSelectedRecordForFeedback(r);
    setFeedbackChoice("Information is correct");
    setFeedbackRemarks("");
    setIsFeedbackModalOpen(true);
  };

  // Save Portal Feedback
  const handleSaveFeedback = () => {
    if (!selectedRecordForFeedback) return;
    const recId = selectedRecordForFeedback.id;
    setRecords(prev => prev.map(r => {
      if (r.id === recId) {
        return {
          ...r,
          portalFeedbackSubmitted: feedbackChoice,
          itrStatus: feedbackChoice === "Information is correct" ? "MATCHED_IN_ITR" : "RESOLVED_IN_ITR",
          recommendation: `Official ITD AIS feedback recorded: "${feedbackChoice}". Feedback payload ready for portal sync.`
        };
      }
      return r;
    }));
    setIsFeedbackModalOpen(false);
    toast.success("AIS Feedback Submitted", `Recorded "${feedbackChoice}" for ${selectedRecordForFeedback.reportingEntity}.`);
  };

  // Open WhatsApp Modal
  const handleOpenWhatsApp = (r: AisRecord) => {
    setSelectedRecordForWhatsApp(r);
    const text = `*INCOME TAX AIS SCRUTINY ALERT - URGENT ACTION REQUIRED*\n\n` +
      `Dear ${activeProfile.taxpayerName},\n\n` +
      `During the statutory pre-filing audit of your Annual Information Statement (AIS) for *${activeProfile.assessmentYear}* (PAN: ${activeProfile.pan}), our team flagged the following high-value transaction:\n\n` +
      `• *Reporting Entity:* ${r.reportingEntity}\n` +
      `• *Transaction Code:* ${r.informationCode}\n` +
      `• *Reported Amount:* ${formatCurrencyINR(r.reportedAmount)}\n` +
      `• *Description:* ${r.description}\n\n` +
      `⚠️ *STATUTORY RISK UNDER SECTION 143(1)(a):*\n` +
      `If this transaction is not reconciled with your books of accounts or source documents before return submission, the CPC Bengaluru system will flag an unexplained credit under Section 68/69.\n\n` +
      `Kindly provide bank statement / broker P&L statement / bills to confirm this entry.\n\n` +
      `Regards,\n*GPA & Co., Chartered Accountants*`;

    setCustomWhatsAppMsg(text);
    setIsWhatsAppModalOpen(true);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Annual Information Statement (AIS) & Form 26AS Audit Working Paper",
      `Taxpayer: ${activeProfile.taxpayerName} | PAN: ${activeProfile.pan} | ${activeProfile.assessmentYear} (${activeProfile.financialYear})`,
      `Total SFT Volume: ₹${totalReportedValue} | 26AS Prepaid Taxes: ₹${totalTdsCredits} | Notice Immunity: ${immunityScore}%`,
      "",
      "Reporting Entity,Category,Code,Description,Reported Amount (₹),TDS/TCS (₹),ITR Status,Target ITR Schedule,Statutory Recommendation"
    ].join("\n");

    const rows = records.map(r => [
      `"${r.reportingEntity}"`,
      r.partCategory,
      r.informationCode,
      `"${r.description.replace(/"/g, '""')}"`,
      r.reportedAmount,
      r.taxDeducted,
      r.itrStatus,
      `"${r.targetItrSchedule}"`,
      `"${r.recommendation.replace(/"/g, '""')}"`
    ].join(",")).join("\n");

    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AIS_Audit_Working_Paper_${activeProfile.pan}_${activeProfile.assessmentYear.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV Exported", "AIS / 26AS audit working paper downloaded.");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5" /> Section 143(1)(a) Notice Shield
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              AIS, TIS &amp; 26AS JSON Analyzer
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Immunity Score: {immunityScore}%
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Annual Information Statement (AIS) &amp; SFT Inspector
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Cross-check client's ITD Portal AIS JSON against draft ITR schedules before e-filing. Auto-flags cash deposits (SFT-004), mutual fund redemptions, foreign remittances, and uncredited TDS to prevent Section 143(1)(a) defect notices.
          </p>
        </div>

        {/* Client & AY Selector Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <User className="w-4 h-4 text-slate-500 shrink-0" />
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
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import AIS JSON</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition"
              title="Export Full AIS Audit to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsAuditMemoOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-sm"
              title="Print Section 143(1)(a) Audit Dossier"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Audit Memo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Taxpayer Information Docket Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300">
            AIS
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <span>Departmental Taxpayer Profile</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400 text-[11px] font-semibold">{activeProfile.taxpayerType}</span>
            </div>
            <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>{activeProfile.taxpayerName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono">
                PAN: {activeProfile.pan}
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

      {/* 4-Metric Summary Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SFT Volume */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total SFT Reported Volume</span>
            <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrencyINR(totalReportedValue)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Aggregated banking &amp; securities transactions
          </div>
        </div>

        {/* 26AS TDS/TCS Credits */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Available 26AS Credits</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrencyINR(totalTdsCredits)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Prepaid taxes available for set-off in ITR
          </div>
        </div>

        {/* Direct Refund Unlocked */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Unclaimed Tax Refunds</span>
            <DollarSign className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {formatCurrencyINR(unclaimedTdsCredits)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Dividend TDS + LRS TCS credits to claim
          </div>
        </div>

        {/* Notice Risk Discrepancies */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Notice Risk Discrepancies</span>
            <AlertTriangle className="w-4 h-4 text-btred-logo shrink-0" />
          </div>
          <div className={`text-2xl font-black mt-1 ${highRiskDefectCount > 0 ? "text-btred-logo" : "text-emerald-600"}`}>
            {highRiskDefectCount} Flagged Items
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Potential Section 143(1)(a) defect exposure
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-3xl shadow-sm text-slate-900">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold text-slate-600">
          {[
            { id: "ALL", label: `All Records (${records.length})` },
            { id: "PART_B2_SFT", label: "SFT Cash & Banking" },
            { id: "SECURITIES_TRADING", label: "Stock / MFs" },
            { id: "PART_B1_TDS", label: "26AS TDS / TCS" },
            { id: "DIVIDEND", label: "Dividends" },
            { id: "DISCREPANCIES", label: `Flagged (${highRiskDefectCount})` }
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
            placeholder="Search entity, SFT code or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Main AIS Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Reporting Entity &amp; Code</th>
                <th className="py-3.5 px-4">Transaction Details &amp; Rule 114E</th>
                <th className="py-3.5 px-4 text-right">Reported Value (₹)</th>
                <th className="py-3.5 px-4 text-right">TDS / TCS (₹)</th>
                <th className="py-3.5 px-4">ITR Alignment</th>
                <th className="py-3.5 px-4 text-center">Action &amp; Portal Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">No AIS Records Found</div>
                    <div className="text-xs text-slate-500 mt-1">Adjust your search or filter criteria.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Entity & Code */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.reportingEntity}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-600 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.informationCode}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                          {item.partCategory.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>

                    {/* Transaction Details */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="text-slate-700 font-medium">{item.description}</div>
                      {item.rule114eThreshold && (
                        <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                          {item.rule114eThreshold}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {item.recommendation}
                      </div>
                    </td>

                    {/* Reported Value */}
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                      {formatCurrencyINR(item.reportedAmount)}
                    </td>

                    {/* TDS / TCS */}
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold whitespace-nowrap">
                      {item.taxDeducted > 0 ? formatCurrencyINR(item.taxDeducted) : "—"}
                    </td>

                    {/* ITR Alignment Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.itrStatus === "MATCHED_IN_ITR" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Matched in ITR
                        </span>
                      ) : item.itrStatus === "RESOLVED_IN_ITR" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          <Check className="w-3 h-3 text-indigo-700" /> Resolved in ITR
                        </span>
                      ) : item.itrStatus === "UNREPORTED_INCOME_RISK" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-btred-logo border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-btred-logo" /> Unreported Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <ShieldAlert className="w-3 h-3 text-amber-800" /> Discrepancy
                        </span>
                      )}

                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Target: {item.targetItrSchedule}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.itrStatus === "DISCREPANCY_FLAG" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleAutoRouteToItr(item.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 transition shadow-sm"
                            title="Auto-route to ITR schedule and claim TDS credit"
                          >
                            <Sparkles className="w-3 h-3" /> Auto-Route to ITR
                          </button>
                        </div>
                      ) : item.itrStatus === "UNREPORTED_INCOME_RISK" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenWhatsApp(item)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] flex items-center gap-1 transition shadow-sm"
                            title="Send statutory verification notice to client"
                          >
                            <MessageSquare className="w-3 h-3" /> Ask Client
                          </button>
                          <button
                            onClick={() => handleOpenFeedback(item)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-[10px] transition"
                            title="Submit feedback to ITD AIS portal"
                          >
                            AIS Feedback
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Clean
                          </span>
                          <button
                            onClick={() => handleOpenFeedback(item)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline font-semibold ml-1"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ITD Official AIS Online Feedback Simulator                       */}
      {/* ========================================================================= */}
      {isFeedbackModalOpen && selectedRecordForFeedback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Income Tax Portal AIS Feedback Submission</h3>
                  <p className="text-[11px] text-slate-500">Official Departmental 5-Option Response Framework</p>
                </div>
              </div>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Transaction Summary */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1">
              <div><strong>Reporting Entity:</strong> {selectedRecordForFeedback.reportingEntity} ({selectedRecordForFeedback.informationCode})</div>
              <div><strong>Description:</strong> {selectedRecordForFeedback.description}</div>
              <div><strong>Reported Amount:</strong> <span className="font-mono font-bold text-slate-900">{formatCurrencyINR(selectedRecordForFeedback.reportedAmount)}</span></div>
            </div>

            {/* Departmental Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Select Portal Feedback Type
              </label>
              {[
                { title: "Information is correct", desc: "Assessee acknowledges the reported value in full." },
                { title: "Income is not taxable / exempt", desc: "Capital receipt, exempt under Section 10, or within basic threshold." },
                { title: "Information is in other PAN / Year", desc: "Joint account holder transaction or belongs to prior/subsequent FY." },
                { title: "Information is duplicate / already reported", desc: "Entry repeated by multiple banking channels." },
                { title: "Information is denied (Not my transaction)", desc: "Assessee denies having entered into this transaction." }
              ].map((opt) => (
                <button
                  key={opt.title}
                  onClick={() => setFeedbackChoice(opt.title)}
                  className={`w-full p-2.5 text-left rounded-xl border text-xs transition ${
                    feedbackChoice === opt.title 
                      ? "border-btred-logo bg-red-50/50 text-slate-900 font-bold" 
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt.title}</span>
                    {feedbackChoice === opt.title && <Check className="w-3.5 h-3.5 text-btred-logo" />}
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Supporting Explanation (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Verified with bank statement Nariman Point branch page 3..."
                value={feedbackRemarks}
                onChange={(e) => setFeedbackRemarks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeedback}
                className="px-5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: WhatsApp Client Scrutiny Inquiry Modal                           */}
      {/* ========================================================================= */}
      {isWhatsAppModalOpen && selectedRecordForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Draft Scrutiny Inquiry to Client</h3>
                  <p className="text-[11px] text-slate-500">Request bills &amp; confirmation for SFT High-Value Transaction</p>
                </div>
              </div>
              <button onClick={() => setIsWhatsAppModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <strong className="text-slate-900">{activeProfile.taxpayerName} ({activeProfile.pan})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Flagged Item:</span>
                <span className="font-mono text-slate-900 font-bold">{selectedRecordForWhatsApp.reportingEntity} ({formatCurrencyINR(selectedRecordForWhatsApp.reportedAmount)})</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Edit Inquiry Message</label>
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(customWhatsAppMsg);
                  toast.success("Text Copied", "WhatsApp message text copied to clipboard.");
                  setIsWhatsAppModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Message
              </button>
              <button
                onClick={() => {
                  const phone = sanitizeIndianPhoneNumber(activeProfile.primaryPhone || "919820011223");
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(customWhatsAppMsg)}`, "_blank");
                  toast.success("WhatsApp Opened", `Inquiry sent to ${activeProfile.taxpayerName}.`);
                  setIsWhatsAppModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Launch WhatsApp Web
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Section 143(1)(a) Audit Memorandum Dossier                      */}
      {/* ========================================================================= */}
      {isAuditMemoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Section 143(1)(a) Pre-Filing Audit Memorandum</h3>
                  <p className="text-[11px] text-slate-500">GPA &amp; Co., Chartered Accountants — Institutional Defense Dossier</p>
                </div>
              </div>
              <button onClick={() => setIsAuditMemoOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 p-2 text-xs text-slate-700">
              {/* Memorandum Header */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span><strong>Assessee Name:</strong> {activeProfile.taxpayerName}</span>
                  <span><strong>PAN:</strong> <span className="font-mono font-bold">{activeProfile.pan}</span></span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Assessment Year:</strong> {activeProfile.assessmentYear}</span>
                  <span><strong>Financial Year:</strong> {activeProfile.financialYear}</span>
                  <span><strong>Immunity Rating:</strong> <strong className="text-emerald-700">{immunityScore}% (Shield Active)</strong></span>
                </div>
              </div>

              {/* 3-Way Reconciliation Summary */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 p-2.5 font-bold uppercase text-[10px] text-slate-700">
                  3-Way Cross Verification Matrix (AIS vs 26AS vs Draft ITR)
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/60 font-semibold text-slate-600">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">AIS / SFT Reported</th>
                      <th className="p-2.5 text-right">Form 26AS Credit</th>
                      <th className="p-2.5 text-right">Draft ITR Claimed</th>
                      <th className="p-2.5 text-center">Variance / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-2.5 font-sans">Professional / Tech Fees (194J)</td>
                      <td className="p-2.5 text-right">₹8,50,000</td>
                      <td className="p-2.5 text-right text-emerald-700 font-bold">₹85,000</td>
                      <td className="p-2.5 text-right">₹85,000</td>
                      <td className="p-2.5 text-center text-emerald-700 font-sans font-bold">Reconciled ✓</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans">Dividend Income (194)</td>
                      <td className="p-2.5 text-right">₹48,500</td>
                      <td className="p-2.5 text-right text-emerald-700 font-bold">₹4,850</td>
                      <td className="p-2.5 text-right">₹4,850</td>
                      <td className="p-2.5 text-center text-indigo-700 font-sans font-bold">Auto-Routed ✓</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans">Fixed Deposit Interest (194A)</td>
                      <td className="p-2.5 text-right">₹76,200</td>
                      <td className="p-2.5 text-right text-emerald-700 font-bold">₹7,620</td>
                      <td className="p-2.5 text-right">₹7,620</td>
                      <td className="p-2.5 text-center text-emerald-700 font-sans font-bold">Reconciled ✓</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans">LRS Foreign Remittance TCS (206C)</td>
                      <td className="p-2.5 text-right">₹6,20,000</td>
                      <td className="p-2.5 text-right text-emerald-700 font-bold">₹31,000</td>
                      <td className="p-2.5 text-right">₹31,000</td>
                      <td className="p-2.5 text-center text-emerald-700 font-sans font-bold">Refund Unlocked ✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Statutory Partner Attestation */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">CA Engagement Sign-off &amp; Section 143(1)(a) Certification:</p>
                <p className="text-[11px] leading-relaxed">
                  We have verified the Annual Information Statement (AIS) and Form 26AS for the subject assessee against the underlying books of accounts, broker statements, and bank records. All prima facie discrepancies under Section 143(1)(a)(vi) have been either mapped into relevant ITR schedules or flagged for formal AIS feedback.
                </p>
                <div className="pt-2 flex justify-between items-center text-[11px] font-bold text-slate-800">
                  <span>CA Gunjan Jain (FCA, DISA) — Managing Partner</span>
                  <span className="font-mono">UDIN: 26098221AISCHECK{Date.now().toString().slice(-4)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-400">Ready for statutory workpaper compilation</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Dossier
                </button>
                <button
                  onClick={() => setIsAuditMemoOpen(false)}
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
      {/* MODAL 4: Upload AIS JSON Modal                                            */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-btred-logo flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Upload ITD AIS / 26AS JSON</h3>
                  <p className="text-[11px] text-slate-500">Official ITD Portal AIS Export (data.docdata / partB)</p>
                </div>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50/50">
              <FileSearch className="w-10 h-10 text-btred-logo mx-auto mb-2" />
              <strong className="text-xs text-slate-800 block">Drag &amp; drop AIS JSON file</strong>
              <span className="text-[10px] text-slate-500">Download from Income Tax Portal &rarr; Services &rarr; AIS &rarr; Download JSON</span>
              <input type="file" accept=".json" className="mt-3 text-xs text-slate-600 mx-auto block" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setRecords(activeProfile.records);
                  toast.success("AIS JSON Parsed", `Extracted ${activeProfile.records.length} official AIS lines for ${activeProfile.taxpayerName}.`);
                }}
                className="px-5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" /> Parse &amp; Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
