"use client";

import React, { useState, useMemo, useRef } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { ClientEntity } from "@/lib/types";
import { SANDBOX_CLIENTS } from "@/lib/data/sandboxData";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import { SftEngine, RULE_114E_THRESHOLDS, SftTransactionCode, CategorizedSftItem } from "@/lib/ais/sftEngine";
import { parseOfficialAisJson } from "@/lib/parsers/aisParser";
import { AisCrossReconciler, BooksIncomeSourceItem, CrossReconciliationReport, CrossReconciliationItem } from "@/lib/ais/aisCrossReconciler";
import { InsightNoticeForecaster, ScrutinyForecastResult, AisPortalFeedbackPayload, AisFeedbackOption } from "@/lib/ais/insightNoticeForecaster";

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
  Printer,
  Scale,
  Zap,
  Radio,
  FileCode,
  FileSpreadsheet
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
  rule114eThreshold?: string;
  itrStatus: "MATCHED_IN_ITR" | "UNREPORTED_INCOME_RISK" | "DISCREPANCY_FLAG" | "RESOLVED_IN_ITR";
  targetItrSchedule: string;
  recommendation: string;
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
  booksLedgers: BooksIncomeSourceItem[];
  annualTurnoverInr?: number;
}

const CLIENT_AIS_PROFILES: Record<string, ClientAisProfile> = {
  // Profile 1: Rajesh Sharma (Promoter - Apex AutoTech)
  "CLI-APEX-01": {
    entityId: "CLI-APEX-01",
    taxpayerName: "Rajesh Sharma (Promoter - Apex AutoTech)",
    taxpayerType: "INDIVIDUAL",
    pan: "ABFPS1234E",
    primaryPhone: "919820011223",
    assessmentYear: "AY 2026-27",
    financialYear: "FY 2025-26",
    annualTurnoverInr: 14500000,
    booksLedgers: [
      {
        id: "bk-1",
        category: "BUSINESS_PROFESSION",
        ledgerName: "Tata Consultancy Services Ltd",
        financialYear: "FY 2025-26",
        grossAmountInr: 850000,
        tdsOrTcsInr: 85000,
        sectionCode: "194J"
      },
      {
        id: "bk-2",
        category: "OTHER_SOURCES",
        ledgerName: "State Bank of India Interest",
        financialYear: "FY 2025-26",
        grossAmountInr: 76200,
        tdsOrTcsInr: 7620,
        sectionCode: "194A"
      },
      {
        id: "bk-3",
        category: "TDS_TCS_CREDIT",
        ledgerName: "ICICI Bank Foreign Outward TCS",
        financialYear: "FY 2025-26",
        grossAmountInr: 620000,
        tdsOrTcsInr: 31000,
        sectionCode: "206C(1G)"
      }
    ],
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
        recommendation: "Reported in Schedule OS. Deduct ₹10,000 exemption under Section 80TTA if filing under Old Tax Regime."
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
        recommendation: "Foreign education / travel remittance. Claim ₹31,000 TCS credit in Schedule TCS."
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
    annualTurnoverInr: 125000000, // > 10 Cr for Sec 194Q
    booksLedgers: [
      {
        id: "bk-p1",
        category: "BUSINESS_PROFESSION",
        ledgerName: "Infosys Limited Consulting",
        financialYear: "FY 2025-26",
        grossAmountInr: 4250000,
        tdsOrTcsInr: 425000,
        sectionCode: "194J"
      },
      {
        id: "bk-p2",
        category: "BUSINESS_PROFESSION",
        ledgerName: "Dell India Hardware Purchase",
        financialYear: "FY 2025-26",
        grossAmountInr: 3600000,
        tdsOrTcsInr: 3600,
        sectionCode: "194Q"
      }
    ],
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
        recommendation: "Turnover ₹42.5L matches P&L consulting revenue. ₹4.25L prepaid tax credit available for Corporate tax offset."
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
      }
    ]
  }
};

interface Ais26asAnalyzerProps {
  clients?: ClientEntity[];
}

export const Ais26asAnalyzer: React.FC<Ais26asAnalyzerProps> = ({ clients = [] }) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("CLI-APEX-01");
  const [activeSuite, setActiveSuite] = useState<"reconciliation" | "sft_radar" | "gatekeeper" | "notice_forecaster">("reconciliation");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Modals & Upload State
  const [isNoticeLetterModalOpen, setIsNoticeLetterModalOpen] = useState(false);
  const [isFeedbackPayloadModalOpen, setIsFeedbackPayloadModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [aisFile, setAisFile] = useState<File | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [customAisRecords, setCustomAisRecords] = useState<AisRecord[] | null>(null);

  // Active Client Entity
  const activeClients = useMemo(() => {
    return (clients && clients.length > 0) ? clients : SANDBOX_CLIENTS;
  }, [clients]);

  const currentEntity = useMemo(() => {
    return activeClients.find(c => c.id === selectedEntityId) || activeClients[0];
  }, [activeClients, selectedEntityId]);

  // Client Profile
  const activeProfile = useMemo<ClientAisProfile>(() => {
    const id = currentEntity?.id || "CLI-APEX-01";
    const base = CLIENT_AIS_PROFILES[id] || CLIENT_AIS_PROFILES["CLI-APEX-01"];
    if (customAisRecords) {
      return {
        ...base,
        pan: currentEntity?.pan || base.pan,
        records: customAisRecords
      };
    }
    return base;
  }, [currentEntity, customAisRecords]);

  const handleProcessAisFile = async () => {
    if (!aisFile) {
      toast.error("File Required", "Please select an official AIS JSON file.");
      return;
    }
    setIsProcessingUpload(true);
    try {
      const text = await aisFile.text();
      const res = parseOfficialAisJson(text);
      if (res.success && res.records.length > 0) {
        setCustomAisRecords(res.records);
        playSuccessChime();
        toast.success("AIS Ingested", `Loaded ${res.totalRecords} records (SFT: ${res.sftCount}, TDS: ${res.tdsCount})`);

        // Persist to Server Database
        await fetch("/api/ais/reconciliation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pan: res.pan || currentEntity?.pan || "ABFPS1234E",
            assessmentYear: res.assessmentYear || "AY 2026-27",
            financialYear: res.financialYear || "FY 2025-26",
            isSeniorCitizen: false,
            aisRecords: res.records,
            booksItems: activeProfile.booksLedgers,
            clientAnnualTurnoverInr: activeProfile.annualTurnoverInr
          })
        });

        setIsUploadModalOpen(false);
        setAisFile(null);
        window.dispatchEvent(new CustomEvent("bt_autopilot_sweep_completed"));
      } else {
        toast.error("AIS Parse Error", res.errors[0] || "Could not parse JSON format");
      }
    } catch (e: any) {
      toast.error("Upload Error", e.message || "Failed to process AIS file");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Execute Books vs AIS Cross-Reconciliation
  const crossRecoReport = useMemo<CrossReconciliationReport>(() => {
    const aisInputs = activeProfile.records.map(r => ({
      id: r.id,
      informationCode: r.informationCode,
      reportingEntity: r.reportingEntity,
      description: r.description,
      pan: activeProfile.pan,
      reportedAmount: r.reportedAmount,
      taxDeducted: r.taxDeducted,
      sourceType: r.sourceType
    }));

    return AisCrossReconciler.reconcile({
      pan: activeProfile.pan,
      assessmentYear: activeProfile.assessmentYear,
      financialYear: activeProfile.financialYear,
      isSeniorCitizen: false,
      aisRecords: aisInputs,
      booksItems: activeProfile.booksLedgers,
      clientAnnualTurnoverInr: activeProfile.annualTurnoverInr
    });
  }, [activeProfile]);

  // SFT Intelligence Categorization
  const categorizedSftItems = useMemo<CategorizedSftItem[]>(() => {
    return activeProfile.records.map(r => {
      return SftEngine.categorizeTransaction({
        id: r.id,
        pan: activeProfile.pan,
        informationCode: r.informationCode,
        reportingEntity: r.reportingEntity,
        sourceDescription: r.description,
        reportedAmount: r.reportedAmount,
        taxDeductedOrCollected: r.taxDeducted,
        financialYear: activeProfile.financialYear,
        assessmentYear: activeProfile.assessmentYear
      });
    });
  }, [activeProfile]);

  // CBDT Insight RMS Scrutiny Notice Forecaster
  const noticeForecast = useMemo<ScrutinyForecastResult>(() => {
    const cashSft = categorizedSftItems.find(s => s.sftCode === "SFT-001" || s.sftCode === "SFT-004");
    const discrepant = crossRecoReport.reconciledItems
      .filter(i => i.recoStatus !== "MATCHED_IN_ITR")
      .map(i => ({
        code: i.informationCode,
        entity: i.reportingEntity,
        reportedAmount: i.aisReportedAmount,
        description: i.sourceDescription
      }));

    return InsightNoticeForecaster.forecastNoticeExposure({
      pan: activeProfile.pan,
      taxpayerName: activeProfile.taxpayerName,
      financialYear: activeProfile.financialYear,
      assessmentYear: activeProfile.assessmentYear,
      totalUnreportedIncomeInr: crossRecoReport.summary.totalUnreportedIncomeExposureInr,
      totalDiscrepancyAmountInr: crossRecoReport.summary.potentialAdditionRiskSec143_1_Inr,
      hasUnexplainedCashSft: !!cashSft,
      unexplainedCashAmountInr: cashSft ? cashSft.reportedAmount : 0,
      unclaimedTdsInr: crossRecoReport.summary.unclaimedTdsCreditInr,
      discrepantItems: discrepant
    });
  }, [activeProfile, crossRecoReport, categorizedSftItems]);

  // Filtered Cross Reco Items
  const filteredItems = useMemo(() => {
    return crossRecoReport.reconciledItems.filter(item => {
      let matches = true;
      if (filterCategory === "MATCHED") matches = item.recoStatus === "MATCHED_IN_ITR";
      else if (filterCategory === "UNREPORTED") matches = item.recoStatus === "UNREPORTED_INCOME_RISK";
      else if (filterCategory === "DISCREPANCY") matches = item.recoStatus === "DISCREPANCY_FLAG";

      const q = search.toLowerCase();
      const matchSearch =
        item.reportingEntity.toLowerCase().includes(q) ||
        item.informationCode.toLowerCase().includes(q) ||
        item.sourceDescription.toLowerCase().includes(q);

      return matches && matchSearch;
    });
  }, [crossRecoReport.reconciledItems, filterCategory, search]);

  // Export 1-Click CBDT Feedback JSON
  const handleExportFeedbackJson = () => {
    playSuccessChime();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(noticeForecast.feedbackPayloads, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AIS_Feedback_${activeProfile.pan}_${activeProfile.assessmentYear.replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Feedback JSON Exported", `Saved official CBDT AIS feedback file for PAN ${activeProfile.pan}.`);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* HEADER: Forensic Context & Client Switcher                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-rose-200">
                CBDT Information Reconciliation • Form 26AS &amp; AIS
              </span>
              <span className="text-xs text-slate-400 font-medium font-mono">Sec 285BA, Rule 114E &amp; Sec 143(1)(a)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AIS &amp; Form 26AS SFT Reconciler
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              High-value SFT transaction categorization, books cross-reconciliation, and CBDT Insight notice risk forecasting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Entity Switcher */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
              <User className="w-4 h-4 text-slate-500" />
              <select
                value={selectedEntityId}
                onChange={(e) => {
                  playSoftClick();
                  setSelectedEntityId(e.target.value);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>{c.tradeName} ({c.pan})</option>
                ))}
              </select>
            </div>

            {/* RMS Scrutiny Badge */}
            <div className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 ${
              noticeForecast.scrutinyRiskTier === "CRITICAL"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : noticeForecast.scrutinyRiskTier === "HIGH"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              RMS Risk: {noticeForecast.rmsScrutinyScore}/100 ({noticeForecast.scrutinyRiskTier})
            </div>

            {/* Real File Upload Trigger */}
            <button
              onClick={() => {
                playSoftClick();
                setIsUploadModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm transition"
            >
              <Upload className="w-4 h-4 text-rose-400" />
              Upload AIS JSON
            </button>

            {/* Legal Notice Action Button */}
            <button
              onClick={() => {
                playSoftClick();
                setIsNoticeLetterModalOpen(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm transition"
            >
              <FileText className="w-4 h-4 text-white" />
              CBDT Response Drafter
            </button>
          </div>
        </div>

        {/* Real-Time Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AIS Gross Volume</span>
            <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">{formatCurrencyINR(crossRecoReport.summary.totalAisGrossReportedInr)}</span>
            <span className="text-[10px] text-slate-500 font-medium">{crossRecoReport.summary.totalAisItems} Records</span>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Matched in ITR</span>
            <span className="text-sm font-black text-emerald-900 font-mono mt-0.5 block">{crossRecoReport.summary.matchedCount} Items</span>
            <span className="text-[10px] text-emerald-600 font-bold">100% Reconciled</span>
          </div>

          <div className="bg-rose-50/60 rounded-2xl p-3 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Unreported Income</span>
            <span className="text-sm font-black text-rose-900 font-mono mt-0.5 block">{formatCurrencyINR(crossRecoReport.summary.totalUnreportedIncomeExposureInr)}</span>
            <span className="text-[10px] text-rose-600 font-bold">Sec 68/69 Risk</span>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Sec 143(1)(a) Risk</span>
            <span className="text-sm font-black text-amber-900 font-mono mt-0.5 block">{formatCurrencyINR(crossRecoReport.summary.potentialAdditionRiskSec143_1_Inr)}</span>
            <span className="text-[10px] text-amber-600 font-bold">Prima Facie Defect</span>
          </div>

          <div className="bg-blue-50/60 rounded-2xl p-3 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Total 26AS TDS</span>
            <span className="text-sm font-black text-blue-900 font-mono mt-0.5 block">{formatCurrencyINR(crossRecoReport.summary.totalAisTdsInr)}</span>
            <span className="text-[10px] text-blue-600 font-medium">Prepaid Tax</span>
          </div>

          <div className="bg-indigo-50/60 rounded-2xl p-3 border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Unclaimed TDS</span>
            <span className="text-sm font-black text-indigo-900 font-mono mt-0.5 block">{formatCurrencyINR(crossRecoReport.summary.unclaimedTdsCreditInr)}</span>
            <span className="text-[10px] text-indigo-600 font-bold">Refund Potential</span>
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
            setActiveSuite("reconciliation");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSuite === "reconciliation"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          Cross-Reconciliation Matrix
          <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
            {crossRecoReport.reconciledItems.length}
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveSuite("sft_radar");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSuite === "sft_radar"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-500" />
          SFT High-Value Cash Radar
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 text-[10px] rounded-full font-bold">
            Rule 114E
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveSuite("gatekeeper");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSuite === "gatekeeper"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
          }`}
        >
          <Scale className="w-4 h-4 text-slate-600" />
          TDS 194Q / TCS 206C Turnover Check
          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded-full font-bold">
            Turnover
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveSuite("notice_forecaster");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSuite === "notice_forecaster"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          CBDT Insight Risk Forecaster
          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-700 text-[10px] rounded-full font-bold">
            Sec 143(1) / 148
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUITE 1: CROSS-RECONCILIATION MATRIX                                      */}
      {/* ========================================================================= */}
      {activeSuite === "reconciliation" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Records", count: crossRecoReport.reconciledItems.length },
                { id: "MATCHED", label: "Matched in ITR", count: crossRecoReport.summary.matchedCount },
                { id: "UNREPORTED", label: "Unreported Income", count: crossRecoReport.summary.unreportedIncomeCount },
                { id: "DISCREPANCY", label: "Discrepancy Flags", count: crossRecoReport.summary.discrepancyCount }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    playSoftClick();
                    setFilterCategory(f.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    filterCategory === f.id
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                  }`}
                >
                  {f.label}
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                    filterCategory === f.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reporting entity, SFT code..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-rose-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Code &amp; Source</th>
                    <th className="p-3.5">Reporting Entity</th>
                    <th className="p-3.5 text-right">AIS Reported (₹)</th>
                    <th className="p-3.5 text-right">Books / ITR (₹)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5">Statutory Audit Finding</th>
                    <th className="p-3.5 text-right">Target ITR Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-slate-900 block">{item.informationCode}</span>
                        <span className="text-[11px] text-slate-500">{item.sourceDescription}</span>
                      </td>

                      <td className="p-3.5">
                        <strong className="text-slate-800 font-bold block">{item.reportingEntity}</strong>
                        {item.aisTaxDeducted > 0 && (
                          <span className="text-[10px] text-blue-600 font-medium font-mono">
                            TDS: ₹{item.aisTaxDeducted.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrencyINR(item.aisReportedAmount)}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                        {item.booksReportedAmount > 0 ? formatCurrencyINR(item.booksReportedAmount) : (
                          <span className="text-rose-500 italic">Not Booked</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {item.recoStatus === "MATCHED_IN_ITR" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Matched
                          </span>
                        )}
                        {item.recoStatus === "UNREPORTED_INCOME_RISK" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Unreported
                          </span>
                        )}
                        {item.recoStatus === "DISCREPANCY_FLAG" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                            <AlertCircle className="w-3 h-3" /> Discrepancy
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <p className="text-[11px] text-slate-600 font-medium leading-tight max-w-sm">
                          {item.remedialAction}
                        </p>
                      </td>

                      <td className="p-3.5 text-right">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-800 text-[10px] font-bold font-mono rounded-lg border border-slate-200">
                          {item.targetItrSchedule}
                        </span>
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
      {/* SUITE 2: RULE 114E SFT THREAT RADAR                                       */}
      {/* ========================================================================= */}
      {activeSuite === "sft_radar" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Rule 114E High-Value SFT Surveillance &amp; Section 68/69 Threat Detector
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                  Banks, registrars, and AMCs report transactions exceeding statutory thresholds directly to the CBDT. Unsubstantiated cash credits trigger special tax additions @ 78% under Section 115BBE, while cash receipts over ₹2,00,000 attract 100% penalty under Section 271DA.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorizedSftItems.map(sft => (
              <div key={sft.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4 hover:border-slate-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {sft.sftCode || "TDS/TCS"}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{sft.nature}</h4>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                    sft.riskSeverity === "CRITICAL"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : sft.riskSeverity === "HIGH"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {sft.riskSeverity} Risk
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reported Volume:</span>
                    <strong className="font-mono text-slate-900 font-black text-sm">{formatCurrencyINR(sft.reportedAmount)}</strong>
                  </div>
                  {sft.thresholdLimitInr > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Rule 114E Threshold:</span>
                      <span className="font-mono text-slate-600">{formatCurrencyINR(sft.thresholdLimitInr)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Reporting Entity:</span>
                    <span className="text-slate-700 font-medium truncate max-w-[170px]">{sft.reportingEntity}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Statutory Audit Guidance</span>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {sft.auditActionRecommendation}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">{sft.statutoryRuleCitation}</span>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {sft.targetItrSchedule}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUITE 3: SECTION 194Q vs 206C(1H) & 80TTA GATEKEEPER                      */}
      {/* ========================================================================= */}
      {activeSuite === "gatekeeper" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Section 194Q vs 206C(1H) Turnover Gatekeeper &amp; Interest Deductions
              </h3>
              <p className="text-xs text-slate-500">
                Automated statutory priority checks for high-turnover businesses and interest deduction optimization.
              </p>
            </div>

            {/* Sec 194Q Card */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Section 194Q Statutory Dominance Check</h4>
                    <span className="text-[11px] text-slate-500">Turnover &gt; ₹10 Crore r/w Proviso to Section 206C(1H)</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border ${
                  crossRecoReport.sec194qVs206cStatus.is194qTurnoverCompliant
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {crossRecoReport.sec194qVs206cStatus.is194qTurnoverCompliant ? "COMPLIANT" : "AUDIT FLAG"}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {crossRecoReport.sec194qVs206cStatus.turnoverCrossCheckNote}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Buyer TDS u/s 194Q</span>
                  <strong className="text-slate-800">Rate: 0.1% on purchase &gt; ₹50 Lakhs</strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Has precedence over seller TCS.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Seller TCS u/s 206C(1H)</span>
                  <strong className="text-slate-800">Barred if buyer has deducted u/s 194Q</strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Prevents duplicate tax collection.</span>
                </div>
              </div>
            </div>

            {/* 80TTA / 80TTB Deduction Card */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Section {crossRecoReport.deduction80TtaTtb.applicableSection} Interest Deduction</h4>
                    <span className="text-[11px] text-slate-500">Savings &amp; Deposit Interest Optimizer</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-black text-purple-900 block">
                    {formatCurrencyINR(crossRecoReport.deduction80TtaTtb.claimedAmountInr)} Allowed
                  </span>
                  <span className="text-[10px] text-slate-400">Max Cap: {formatCurrencyINR(crossRecoReport.deduction80TtaTtb.maxLimitInr)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {crossRecoReport.deduction80TtaTtb.auditAdvice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUITE 4: CBDT RMS SCRUTINY FORECASTER & FEEDBACK DESK                     */}
      {/* ========================================================================= */}
      {activeSuite === "notice_forecaster" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  CBDT Insight Risk Management System (RMS) Scrutiny Forecaster
                </h3>
                <p className="text-xs text-slate-500">
                  Simulates algorithmic notice generation under Section 143(1)(a) and Section 148 reopening exposure.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportFeedbackJson}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition"
                >
                  <FileCode className="w-4 h-4 text-slate-600" />
                  Export Feedback JSON
                </button>
                <button
                  onClick={() => setIsNoticeLetterModalOpen(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer className="w-4 h-4 text-white" />
                  Print Reply Letter
                </button>
              </div>
            </div>

            {/* Exposure Meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Sec 143(1)(a) Defect Risk</span>
                <span className="text-xl font-black text-rose-950 font-mono block">
                  {formatCurrencyINR(noticeForecast.sec143_1_PotentialDemandInr)}
                </span>
                <span className="text-[11px] text-rose-800 font-medium">Estimated Prima Facie Demand</span>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Sec 148 Reassessment Risk</span>
                <span className="text-xl font-black text-amber-950 font-mono block">
                  {noticeForecast.sec148_ReopeningRisk ? "HIGH (>= ₹50L)" : "LOW (< ₹50L)"}
                </span>
                <span className="text-[11px] text-amber-800 font-medium">Escaped Income: {formatCurrencyINR(noticeForecast.sec148_EscapedIncomeEstimateInr)}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pre-Filled Feedbacks</span>
                <span className="text-xl font-black text-slate-900 font-mono block">
                  {noticeForecast.feedbackPayloads.length} Responses
                </span>
                <span className="text-[11px] text-slate-600 font-medium">Ready for Insight Portal</span>
              </div>
            </div>

            {/* Risk Drivers Schedule */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Identified CBDT RMS Audit Triggers</h4>
              <div className="space-y-2">
                {noticeForecast.primaryRiskDrivers.map((driver, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="text-slate-800 font-medium leading-relaxed">{driver}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL ITD AIS JSON DROPZONE                                      */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Official ITD AIS / TIS JSON Ingestion</h3>
                  <p className="text-[11px] text-slate-500">Government AIS Download for PAN: {activeProfile.pan}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-rose-200 bg-rose-50/40 rounded-2xl p-6 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 cursor-pointer hover:underline block">
                    {aisFile ? (
                      <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" /> {aisFile.name} ({(aisFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      "Select or Drop Official AIS JSON File"
                    )}
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setAisFile(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1">Direct download from Income Tax Portal (e-Filing 2.0 &gt; Services &gt; AIS)</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Deterministic Rule 114E SFT Parser
                </div>
                <p>Categorizes SFT-001 (Cash &ge; ₹10L), SFT-004 (Time deposits), SFT-017 (Securities), and Sec 194J/194A TDS credits without external API calls.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={isProcessingUpload || !aisFile}
                onClick={handleProcessAisFile}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                {isProcessingUpload ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting &amp; Classifying...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" /> Parse &amp; Categorize AIS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STATUTORY CBDT REPLY LETTER                                        */}
      {/* ========================================================================= */}
      {isNoticeLetterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">CBDT Insight e-Verification Statutory Response</h3>
                  <p className="text-[11px] text-slate-500">Certified legal workpaper for PAN {activeProfile.pan}</p>
                </div>
              </div>
              <button onClick={() => setIsNoticeLetterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {noticeForecast.statutoryReplyLetterText}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setIsNoticeLetterModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  playSuccessChime();
                  navigator.clipboard.writeText(noticeForecast.statutoryReplyLetterText);
                  toast.success("Letter Copied", "Statutory reply text copied to clipboard.");
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </button>
              <button
                onClick={() => {
                  playSuccessChime();
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(noticeForecast.statutoryReplyLetterHtml);
                    printWindow.document.close();
                    printWindow.print();
                  }
                  toast.success("Ready to Print", "Opened print-ready statutory explanation letter.");
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Certified Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
