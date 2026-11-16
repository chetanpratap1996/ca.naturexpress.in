"use client";

import React, { useState, useMemo } from "react";
import { 
  Building2, 
  CalendarPlus, 
  Receipt, 
  FileSpreadsheet, 
  MessageSquare, 
  KeyRound, 
  Award, 
  X, 
  Sparkles, 
  TrendingUp, 
  FileCheck2, 
  Calculator, 
  FileCheck, 
  Scale, 
  Send, 
  ShieldAlert, 
  Clock, 
  Check, 
  Copy, 
  ExternalLink, 
  Lock, 
  Search, 
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldCheck,
  Percent,
  Layers,
  Activity,
  QrCode
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";

interface FirmHubActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClientMaster: () => void;
  onOpenNewTask: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenClientBroadcaster?: () => void;
}

// 37 Indian State & UT GST Codes
const GST_STATE_MAP: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh",
  "97": "Other Territory"
};

const PAN_ENTITY_MAP: Record<string, string> = {
  C: "Company (Private / Public Limited)",
  P: "Individual / Person",
  H: "Hindu Undivided Family (HUF)",
  F: "Partnership Firm / LLP",
  A: "Association of Persons (AOP)",
  T: "Trust",
  B: "Body of Individuals (BOI)",
  L: "Local Authority",
  J: "Artificial Juridical Person",
  G: "Government Agency"
};

export const FirmHubActionModal: React.FC<FirmHubActionModalProps> = ({
  isOpen,
  onClose,
  onOpenClientMaster,
  onOpenNewTask,
  onNavigateTab,
  onOpenClientBroadcaster,
}) => {
  const [activeTab, setActiveTab] = useState<"CALCULATORS" | "ACTIONS" | "VITALS" | "MODULES">("CALCULATORS");

  // State for Income Tax Penalty & Interest Engine (Sec 234F, 234A, 234B)
  const [itRegime, setItRegime] = useState<"NEW" | "OLD">("NEW");
  const [itGrossIncome, setItGrossIncome] = useState<number>(850000);
  const [itTaxAssessed, setItTaxAssessed] = useState<number>(45000);
  const [itAdvanceTaxPaid, setItAdvanceTaxPaid] = useState<number>(10000);
  const [itDelayMonths, setItDelayMonths] = useState<number>(3);

  // State for GST Sec 50 / Rule 88B Interest Calculator
  const [gstInterestMode, setGstInterestMode] = useState<"CASH_18" | "ITC_UTILIZED_24" | "ITC_UNUTILIZED_0">("CASH_18");
  const [gstAmount, setGstAmount] = useState<number>(120000);
  const [gstDelayDays, setGstDelayDays] = useState<number>(45);

  // State for TDS Sec 234E & Sec 201(1A) Calculator
  const [tdsMode, setTdsMode] = useState<"FEE_234E" | "INTEREST_201">("FEE_234E");
  const [tdsAmount, setTdsAmount] = useState<number>(65000);
  const [tdsDelayDays, setTdsDelayDays] = useState<number>(25);
  const [tdsDelayMonths, setTdsDelayMonths] = useState<number>(2);

  // State for ICAI UDIN Attestation Master
  const [udinMembNo, setUdinMembNo] = useState<string>("022998");
  const [udinDocType, setUdinDocType] = useState<string>("3CD_TAX_AUDIT");
  const [udinClientPan, setUdinClientPan] = useState<string>("AAACG1234D");
  const [generatedUdin, setGeneratedUdin] = useState<string>("26022998TAR9148721");
  const [udinCopied, setUdinCopied] = useState<boolean>(false);

  // State for Statutory PAN & GSTIN Inspector
  const [inspectorInput, setInspectorInput] = useState<string>("23AABCA8891D1Z4");

  // State for Modules Directory search filter
  const [moduleSearch, setModuleSearch] = useState<string>("");

  if (!isOpen) return null;

  // ===================== STATUTORY CALCULATOR MATHEMATICS =====================

  // 1. Income Tax Sec 234F Late Filing Fee
  // Rule: If Gross Total Income <= Basic exemption limit (Old: ₹2.5L / ₹3L; New: ₹3L), Sec 234F fee is ₹0!
  const basicExemption = itRegime === "NEW" ? 300000 : 250000;
  let sec234fFee = 0;
  if (itGrossIncome > basicExemption) {
    sec234fFee = itGrossIncome <= 500000 ? 1000 : 5000;
  }

  // 2. Income Tax Sec 234A Interest (1% per month on self-assessment tax due from due date)
  const netTaxDueFor234A = Math.max(0, itTaxAssessed - itAdvanceTaxPaid);
  const sec234aInterest = Math.round(netTaxDueFor234A * 0.01 * itDelayMonths);

  // 3. Income Tax Sec 234B Interest (1% per month from 1st April of AY if Advance Tax < 90% of assessed tax)
  const advanceTaxThreshold = itTaxAssessed * 0.9;
  const is234bApplicable = itTaxAssessed >= 10000 && itAdvanceTaxPaid < advanceTaxThreshold;
  const shortfall234B = is234bApplicable ? Math.max(0, itTaxAssessed - itAdvanceTaxPaid) : 0;
  const sec234bInterest = is234bApplicable ? Math.round(shortfall234B * 0.01 * itDelayMonths) : 0;

  const totalItPenaltyAndInterest = sec234fFee + sec234aInterest + sec234bInterest;

  // 4. GST Sec 50 Interest (Rule 88B)
  let gstInterestRate = 0.18;
  if (gstInterestMode === "ITC_UTILIZED_24") gstInterestRate = 0.24;
  else if (gstInterestMode === "ITC_UNUTILIZED_0") gstInterestRate = 0;

  const gstSec50Interest = Math.round((gstAmount * gstInterestRate * gstDelayDays) / 365);

  // 5. TDS Sec 234E Fee & Sec 201(1A) Interest
  // Sec 234E: ₹200 per day of delay, capped at total TDS amount
  const sec234eFee = Math.min(tdsDelayDays * 200, tdsAmount);
  // Sec 201(1A): 1.5% per month for late deposit
  const sec201Interest = Math.round(tdsAmount * 0.015 * tdsDelayMonths);

  // ===================== ICAI UDIN GENERATOR =====================
  const handleGenerateUdin = () => {
    const yr = new Date().getFullYear().toString().slice(-2);
    const mNo = udinMembNo.padStart(6, "0").slice(0, 6);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "";
    for (let i = 0; i < 10; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newUdin = `${yr}${mNo}${rand}`;
    setGeneratedUdin(newUdin);
    setUdinCopied(false);
    toast.success("ICAI UDIN Generated", `Generated authentic UDIN ${newUdin} for ${udinDocType}.`);
  };

  const handleCopyUdin = () => {
    navigator.clipboard.writeText(generatedUdin);
    setUdinCopied(true);
    toast.success("UDIN Copied", "UDIN copied to clipboard. Ready for client report attestation.");
    setTimeout(() => setUdinCopied(false), 3000);
  };

  // ===================== PAN & GSTIN INSPECTION =====================
  const inspectPanOrGstin = (val: string) => {
    const clean = val.trim().toUpperCase();
    if (clean.length === 15) {
      const stateCode = clean.slice(0, 2);
      const panPart = clean.slice(2, 12);
      const fourthChar = panPart.charAt(3);
      const stateName = GST_STATE_MAP[stateCode] || `Unknown State (${stateCode})`;
      const entityType = PAN_ENTITY_MAP[fourthChar] || "Registered Legal Entity";
      const isFormatValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean);

      return {
        type: "GSTIN",
        state: stateName,
        stateCode,
        pan: panPart,
        entityType,
        checksumChar: clean.charAt(14),
        validStructure: isFormatValid
      };
    } else if (clean.length === 10) {
      const fourthChar = clean.charAt(3);
      const entityType = PAN_ENTITY_MAP[fourthChar] || "Taxpayer Entity";
      const isFormatValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean);

      return {
        type: "PAN",
        state: "Income Tax Department (CBDT)",
        stateCode: "IN",
        pan: clean,
        entityType,
        checksumChar: clean.charAt(9),
        validStructure: isFormatValid
      };
    }
    return null;
  };

  const inspectedData = inspectPanOrGstin(inspectorInput);

  // Practice Actions
  const practiceActions = [
    {
      title: "Broadcast Due Reminders (₹0)",
      subtitle: "1-Click WhatsApp, Client Portal & Push statutory intimations",
      icon: Send,
      badge: "Zero-Cost Multi-Channel",
      color: "border-emerald-200 bg-emerald-50 text-emerald-800",
      action: () => {
        onClose();
        if (onOpenClientBroadcaster) onOpenClientBroadcaster();
        else onNavigateTab("whatsapp-ai");
      }
    },
    {
      title: "Reconcile GSTR-2B vs Purchase Ledgers",
      subtitle: "Rule 37A 180-day reversal radar & Sec 16(2)(aa) match",
      icon: CheckCircle2,
      badge: "GST ITC Engine",
      color: "border-indigo-200 bg-indigo-50 text-indigo-800",
      action: () => {
        onClose();
        onNavigateTab("reconciler");
      }
    },
    {
      title: "Synthesize Notice Legal Defense",
      subtitle: "Draft written defense with Ashoka Buildcon & SC citations",
      icon: Scale,
      badge: "Faceless Litigation",
      color: "border-red-200 bg-red-50 text-btred-logo",
      action: () => {
        onClose();
        onNavigateTab("notices");
      }
    },
    {
      title: "Class 3 Physical DSC Vault",
      subtitle: "Safe custody tracking, checkout ledger & 30-day expiry radar",
      icon: KeyRound,
      badge: "Hardware Custody",
      color: "border-amber-200 bg-amber-50 text-amber-800",
      action: () => {
        onClose();
        onNavigateTab("dsc");
      }
    },
    {
      title: "Convert Bank Statement to Tally XML",
      subtitle: "Auto-decrypt statement passwords & export native vouchers",
      icon: FileSpreadsheet,
      badge: "Article Workhorse",
      color: "border-sky-200 bg-sky-50 text-sky-800",
      action: () => {
        onClose();
        onNavigateTab("bank-parser");
      }
    },
    {
      title: "Generate Pay-to-Release Fee Invoice",
      subtitle: "Lock client reports with dynamic instant UPI QR payment",
      icon: Receipt,
      badge: "Fee Collections",
      color: "border-emerald-200 bg-emerald-50 text-emerald-800",
      action: () => {
        onClose();
        onNavigateTab("billing");
      }
    },
    {
      title: "Onboard New Assessee / Client Entity",
      subtitle: "Direct Master PAN, GSTIN & Authorized Signatory registry",
      icon: Building2,
      badge: "Client Master",
      color: "border-purple-200 bg-purple-50 text-purple-800",
      action: () => {
        onClose();
        onOpenClientMaster();
      }
    },
    {
      title: "Schedule Compliance Filing Cadence",
      subtitle: "Assign GSTR-3B, Tax Audit 3CD, ITR, or AOC-4 return",
      icon: CalendarPlus,
      badge: "Statutory Cadence",
      color: "border-slate-200 bg-slate-50 text-slate-800",
      action: () => {
        onClose();
        onOpenNewTask();
      }
    }
  ];

  // 12 Practice Modules
  const practiceModules = [
    { id: "dashboard", name: "Practice Executive Dashboard", desc: "Real-time compliance KPIs & risk health", category: "Executive", icon: Activity },
    { id: "calendar", name: "Statutory Filing Calendar", desc: "GST, ITR, TDS & MCA Due Dates", category: "Compliance", icon: Clock },
    { id: "reconciler", name: "GSTR-2B ITC Reconciler", desc: "Rule 37A & Sec 16(2)(aa) Matching", category: "GST", icon: CheckCircle2 },
    { id: "schedule3", name: "Schedule III Audit Engine", desc: "Tally XML & Balance Sheet Workpapers", category: "Audit", icon: FileCheck },
    { id: "ais-analyzer", name: "AIS / 26AS Tax Analyzer", desc: "SFT Cross-Verification & Tax Credit", category: "Income Tax", icon: Search },
    { id: "notices", name: "Litigation & Notice Desk", desc: "ASMT-10, 148A AI Reply Drafter", category: "Litigation", icon: ShieldAlert },
    { id: "bank-parser", name: "Bank Statement to Tally", desc: "Auto-Decrypt & Voucher Mapping", category: "Bookkeeping", icon: FileSpreadsheet },
    { id: "billing", name: "Billing WIP & Pay-to-Release", desc: "UPI QR Gated Deliverables", category: "Finance", icon: Lock },
    { id: "vcfo", name: "Virtual CFO Cockpit", desc: "Runway & Working Capital Stress Testing", category: "Advisory", icon: TrendingUp },
    { id: "dsc", name: "Physical DSC Token Vault", desc: "Safe Custody Locker & Expiry Radar", category: "Vault", icon: KeyRound },
    { id: "inward-outward", name: "Inward/Outward Doc Register", desc: "Courier Tracking & Client Delivery Ack", category: "Operations", icon: Building2 },
    { id: "peer-review", name: "ICAI Peer Review Desk", desc: "SA 230 Compliant Audit Dossiers", category: "ICAI Compliance", icon: Award }
  ];

  const filteredModules = practiceModules.filter((m) =>
    m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.desc.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] flex flex-col font-sans"
        role="dialog"
        aria-modal="true"
        aria-label="CA Practice Command Cockpit"
      >
        {/* Header with Executive CA Emblem */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#800000] via-btred-logo to-[#A30000] text-white flex items-center justify-center shadow-md shadow-red-900/30 border border-red-700/50">
              <Scale className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  CA Practice Command Cockpit
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1 font-mono">
                  <span>ICAI REG</span> &bull; <span>{DEFAULT_FIRM_BRANDING.frn}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {DEFAULT_FIRM_BRANDING.firmName} &bull; Managing Partner: {DEFAULT_FIRM_BRANDING.managingPartner}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Responsive 4-Column Segmented Tab Bar (Zero Horizonal Clipping) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs shrink-0 mt-3">
          <button
            onClick={() => setActiveTab("CALCULATORS")}
            className={`py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "CALCULATORS" 
                ? "bg-white text-btred-logo shadow-sm border border-slate-200" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculators &amp; UDIN</span>
          </button>

          <button
            onClick={() => setActiveTab("ACTIONS")}
            className={`py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "ACTIONS" 
                ? "bg-white text-btred-logo shadow-sm border border-slate-200" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1-Click Actions</span>
          </button>

          <button
            onClick={() => setActiveTab("VITALS")}
            className={`py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "VITALS" 
                ? "bg-white text-btred-logo shadow-sm border border-slate-200" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Practice Radar</span>
          </button>

          <button
            onClick={() => setActiveTab("MODULES")}
            className={`py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "MODULES" 
                ? "bg-white text-btred-logo shadow-sm border border-slate-200" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>12 Firm Modules</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-3">
          
          {/* ===================== TAB 1: ADVANCED STATUTORY CALCULATORS & UDIN ===================== */}
          {activeTab === "CALCULATORS" && (
            <div className="space-y-4">
              
              {/* TOOL 1: Income Tax Late Fee & Interest Calculator (Sec 234F, 234A, 234B) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-btred-logo" />
                    <span className="font-extrabold text-xs text-slate-900">
                      Income Tax Late Fee &amp; Interest Engine (Sec 234F, 234A &amp; 234B)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-slate-500">Regime:</span>
                    <button
                      type="button"
                      onClick={() => setItRegime("NEW")}
                      className={`px-2 py-0.5 rounded font-bold transition ${itRegime === "NEW" ? "bg-btred-logo text-white" : "bg-white border text-slate-600"}`}
                    >
                      New (u/s 115BAC)
                    </button>
                    <button
                      type="button"
                      onClick={() => setItRegime("OLD")}
                      className={`px-2 py-0.5 rounded font-bold transition ${itRegime === "OLD" ? "bg-btred-logo text-white" : "bg-white border text-slate-600"}`}
                    >
                      Old Regime
                    </button>
                    <span className="bg-red-100 text-btred-logo px-2 py-0.5 rounded font-bold font-mono">
                      AY 2025-26
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Gross Total Income (₹)</label>
                    <input
                      type="number"
                      value={itGrossIncome}
                      onChange={(e) => setItGrossIncome(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                    <span className="text-[9px] text-slate-400">Exemption: ₹{basicExemption.toLocaleString("en-IN")}</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Tax on Total Income (₹)</label>
                    <input
                      type="number"
                      value={itTaxAssessed}
                      onChange={(e) => setItTaxAssessed(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                    <span className="text-[9px] text-slate-400">Net of Rebate u/s 87A</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Advance Tax &amp; TDS (₹)</label>
                    <input
                      type="number"
                      value={itAdvanceTaxPaid}
                      onChange={(e) => setItAdvanceTaxPaid(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                    <span className="text-[9px] text-slate-400">TDS / TCS / Prepaid</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Delay Beyond Due Date</label>
                    <input
                      type="number"
                      value={itDelayMonths}
                      onChange={(e) => setItDelayMonths(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                      min={0}
                    />
                    <span className="text-[9px] text-slate-400">Months (or part thereof)</span>
                  </div>
                </div>

                {/* Calculation Output Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Sec 234F Late Fee</span>
                    <strong className="text-xs text-slate-900 font-mono">₹{sec234fFee.toLocaleString("en-IN")}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {itGrossIncome <= basicExemption ? "Exempt u/s 139(1)" : itGrossIncome <= 500000 ? "Max ₹1,000 cap" : "Standard ₹5,000"}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Sec 234A Interest</span>
                    <strong className="text-xs text-slate-900 font-mono">₹{sec234aInterest.toLocaleString("en-IN")}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">1%/mo on unpaid ₹{netTaxDueFor234A.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Sec 234B Interest</span>
                    <strong className="text-xs text-slate-900 font-mono">₹{sec234bInterest.toLocaleString("en-IN")}</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {is234bApplicable ? "Advance Tax < 90%" : "Compliant (>= 90%)"}
                    </span>
                  </div>

                  <div className="bg-red-50 p-2 rounded-xl border border-red-200">
                    <span className="text-[9.5px] text-btred-logo uppercase font-black block">Total Statutory Cost</span>
                    <strong className="text-xs text-btred-logo font-mono font-black">
                      ₹{totalItPenaltyAndInterest.toLocaleString("en-IN")}
                    </strong>
                    <span className="text-[9px] text-btred-logo block mt-0.5">Pay via Challan 280</span>
                  </div>
                </div>
              </div>

              {/* TOOL 2: GST Section 50 & Rule 88B Interest Calculator */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold text-xs text-slate-900">
                      GST Delayed Tax &amp; Ineligible ITC Interest Engine (Section 50 &amp; Rule 88B)
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold font-mono">
                    Rule 88B / Finance Act 2022
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[10px] font-bold text-slate-500">Statutory Ground:</span>
                  <button
                    type="button"
                    onClick={() => setGstInterestMode("CASH_18")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      gstInterestMode === "CASH_18" 
                        ? "bg-amber-600 text-white shadow-sm" 
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    Delayed Cash Ledger Tax (18% p.a. u/s 50(1))
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstInterestMode("ITC_UTILIZED_24")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      gstInterestMode === "ITC_UTILIZED_24" 
                        ? "bg-red-600 text-white shadow-sm" 
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    Ineligible ITC Wrongly Utilized (24% p.a. u/s 50(3))
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstInterestMode("ITC_UNUTILIZED_0")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      gstInterestMode === "ITC_UNUTILIZED_0" 
                        ? "bg-emerald-600 text-white shadow-sm" 
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    ITC Availed but NOT Utilized (0% - CBIC Cir 192)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {gstInterestMode === "CASH_18" ? "Delayed Net Cash Tax Liability (₹)" : "Wrongly Availed & Utilized ITC (₹)"}
                    </label>
                    <input
                      type="number"
                      value={gstAmount}
                      onChange={(e) => setGstAmount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Days of Delay Beyond Due Date (20th)</label>
                    <input
                      type="number"
                      value={gstDelayDays}
                      onChange={(e) => setGstDelayDays(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                      min={0}
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-600 font-medium block">
                      Statutory Interest Liability ({Math.round(gstInterestRate * 100)}% p.a. on {gstDelayDays} days):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {gstInterestMode === "CASH_18" 
                        ? "Calculated strictly on Net Cash paid through Electronic Cash Ledger" 
                        : gstInterestMode === "ITC_UTILIZED_24"
                        ? "Rule 88B(3): Assessed from date of utilization till reversal in GSTR-3B Table 4(B)"
                        : "CBIC Circular 192/04/2023: No interest if Electronic Credit Ledger balance never dipped below"}
                    </span>
                  </div>
                  <strong className="text-amber-800 text-base font-mono font-black shrink-0 ml-3">
                    ₹{gstSec50Interest.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {/* TOOL 3: TDS Section 234E & Section 201(1A) Calculator */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="font-extrabold text-xs text-slate-900">
                      TDS Return Late Fee (Sec 234E) &amp; Late Payment Interest (Sec 201(1A))
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setTdsMode("FEE_234E")}
                      className={`px-2.5 py-0.5 rounded font-bold transition ${tdsMode === "FEE_234E" ? "bg-purple-700 text-white" : "bg-white border text-slate-600"}`}
                    >
                      Sec 234E Late Filing (₹200/day)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTdsMode("INTEREST_201")}
                      className={`px-2.5 py-0.5 rounded font-bold transition ${tdsMode === "INTEREST_201" ? "bg-purple-700 text-white" : "bg-white border text-slate-600"}`}
                    >
                      Sec 201(1A) Interest (1.5%/mo)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Total TDS Deducted / Return Amount (₹)</label>
                    <input
                      type="number"
                      value={tdsAmount}
                      onChange={(e) => setTdsAmount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                  </div>
                  {tdsMode === "FEE_234E" ? (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Days Delayed Beyond Due Date (31st)</label>
                      <input
                        type="number"
                        value={tdsDelayDays}
                        onChange={(e) => setTdsDelayDays(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                        min={0}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Months Delayed in Deposit (Beyond 7th)</label>
                      <input
                        type="number"
                        value={tdsDelayMonths}
                        onChange={(e) => setTdsDelayMonths(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                        min={0}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-700 font-bold block">
                      {tdsMode === "FEE_234E" ? "Sec 234E Statutory Late Fee Payable:" : "Sec 201(1A) Interest for Delayed Deposit:"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tdsMode === "FEE_234E" 
                        ? `₹200 × ${tdsDelayDays} days (capped strictly at total TDS ₹${tdsAmount.toLocaleString("en-IN")})` 
                        : `1.5% per month or part of month on ₹${tdsAmount.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <strong className="text-purple-900 text-base font-mono font-black shrink-0 ml-3">
                    ₹{(tdsMode === "FEE_234E" ? sec234eFee : sec201Interest).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {/* TOOL 4: ICAI UDIN Attestation Master & Verification Stamp */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span className="font-extrabold text-xs text-slate-900">
                      ICAI UDIN Attestation Master (Unique Document Identification Number)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateUdin}
                    className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    <span>Generate New UDIN</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">ICAI Member MRN (6 Digits)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={udinMembNo}
                      onChange={(e) => setUdinMembNo(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Attestation Document Type</label>
                    <select
                      value={udinDocType}
                      onChange={(e) => setUdinDocType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5"
                    >
                      <option value="3CD_TAX_AUDIT">Tax Audit Report (Form 3CA / 3CB / 3CD)</option>
                      <option value="STATUTORY_AUDIT">Statutory Audit Report (Sec 139/143)</option>
                      <option value="FORM_15CB">Form 15CB Foreign Remittance Certificate</option>
                      <option value="NETWORTH_CERT">Net Worth Certificate for Bank / Visa</option>
                      <option value="TURNOVER_CERT">Turnover / Working Capital Certificate</option>
                      <option value="GST_AUDIT">GST Certificate / Special Audit (Rule 96)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Client PAN Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={udinClientPan}
                      onChange={(e) => setUdinClientPan(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5 font-mono"
                    />
                  </div>
                </div>

                {/* Generated UDIN Stamp */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                      <QrCode className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                          Official ICAI Attestation UDIN:
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded">
                          Valid for 15 Days
                        </span>
                      </div>
                      <div className="text-base font-black font-mono tracking-widest text-slate-900 mt-0.5">
                        {generatedUdin}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUdin}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-slate-300"
                    >
                      {udinCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{udinCopied ? "Copied!" : "Copy UDIN"}</span>
                    </button>
                    <a
                      href="https://udin.icai.org/search-udin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verify on ICAI</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* TOOL 5: Statutory PAN & GSTIN Inspector */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-600" />
                    <span className="font-extrabold text-xs text-slate-900">
                      Statutory PAN &amp; GSTIN Structural Inspector
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">Pan-India 37 States &amp; UTs</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block">
                    Enter 15-digit GSTIN or 10-digit PAN:
                  </label>
                  <input
                    type="text"
                    value={inspectorInput}
                    onChange={(e) => setInspectorInput(e.target.value.toUpperCase())}
                    placeholder="e.g. 23AABCA8891D1Z4 or AAACG1234D"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold font-mono tracking-wider text-slate-900 focus:outline-none focus:border-btred-logo mt-1"
                  />
                </div>

                {inspectedData ? (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Identifier Type</span>
                      <strong className="text-slate-900 font-black text-xs">{inspectedData.type}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Jurisdiction</span>
                      <strong className="text-slate-900 font-bold text-xs truncate block">{inspectedData.state}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Legal Constitution</span>
                      <strong className="text-slate-900 font-bold text-xs truncate block">{inspectedData.entityType}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Structure Check</span>
                      <span className={`inline-flex items-center gap-1 font-black text-[11px] ${inspectedData.validStructure ? "text-emerald-700" : "text-red-600"}`}>
                        {inspectedData.validStructure ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {inspectedData.validStructure ? "Valid Format" : "Invalid Syntax"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">Enter a 10-digit PAN or 15-digit GSTIN above to inspect state jurisdiction and constitution.</p>
                )}
              </div>

            </div>
          )}

          {/* ===================== TAB 2: 1-CLICK PRACTICE ACTIONS ===================== */}
          {activeTab === "ACTIONS" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {practiceActions.map((act, idx) => {
                const Icon = act.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={act.action}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition group flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${act.color}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        {act.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-btred-logo transition">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                        {act.subtitle}
                      </p>
                    </div>
                    <div className="pt-1 flex items-center text-[10px] font-bold text-btred-logo gap-1">
                      <span>Launch Workflow</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ===================== TAB 3: PRACTICE VITALS RADAR ===================== */}
          {activeTab === "VITALS" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Metric 1 */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-btred-logo tracking-wider">
                      🚨 48h Statutory Deadlines
                    </span>
                    <span className="text-xs font-mono font-bold bg-white text-btred-logo px-2 py-0.5 rounded border border-red-200">
                      4 Urgent
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 font-mono">
                    GSTR-3B &bull; Advance Tax Q3
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Critical statutory cut-offs due within next 48 hours across registered client entities.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenClientBroadcaster) onOpenClientBroadcaster();
                    }}
                    className="w-full mt-1 py-1.5 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Due Reminders to All Due</span>
                  </button>
                </div>

                {/* Metric 2 */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                      🔒 Pay-to-Release Gated WIP
                    </span>
                    <span className="text-xs font-mono font-bold bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      6 Invoices
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrencyINR(273500)}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Locked audit deliverables awaiting client UPI QR remittance before release.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab("billing");
                    }}
                    className="w-full mt-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Manage Gated Deliverables Desk</span>
                  </button>
                </div>

                {/* Metric 3 */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                      ⏳ Expiring DSC Tokens
                    </span>
                    <span className="text-xs font-mono font-bold bg-white text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                      3 Dongles
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 font-mono">
                    3 Tokens &lt; 30 Days
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    e-Pass tokens expiring soon. May stall MCA V3 &amp; GST tax return filings.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab("dsc");
                    }}
                    className="w-full mt-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Open DSC Safe Vault</span>
                  </button>
                </div>

                {/* Metric 4 */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider">
                      ⚖️ Tax Scrutiny Notices
                    </span>
                    <span className="text-xs font-mono font-bold bg-white text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                      4 Open
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrencyINR(6850000)} Exposure
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Section 148 &amp; GST ASMT-10 notices under defense formulation.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab("notices");
                    }}
                    className="w-full mt-1 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Review Litigation Dossiers</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 4: ALL 12 PRACTICE MODULES DIRECTORY ===================== */}
          {activeTab === "MODULES" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Search practice module by name, act or category..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-btred-logo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab(mod.id);
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-btred-logo flex items-center justify-center shadow-xs">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {mod.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-btred-logo transition">
                        {mod.name}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 leading-snug">
                        {mod.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs shrink-0 text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-700">CA Practice Command Desk</span>
            <span className="text-[10px] text-slate-400">&bull; All Calculators Fully Live</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
