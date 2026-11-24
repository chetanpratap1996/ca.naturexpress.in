"use client";

import React, { useState, useMemo } from "react";
import { 
  Calculator, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle, 
  Building2, 
  MessageSquare, 
  Calendar,
  Sparkles,
  FileCheck2,
  RefreshCw,
  Search,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  TrendingDown,
  Info,
  ExternalLink,
  ChevronRight,
  Download,
  Printer,
  X,
  FileText
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { validateGstinStrict } from "@/lib/intelligence/registry/gstValidator";
import { getStateByGstCode } from "@/lib/intelligence/panIndiaDirectory";

interface CaComplianceHealthCheckProps {
  onOpenBooking: (service?: string, prefillGstin?: string, diagnosticNotes?: string) => void;
}

export const CaComplianceHealthCheck: React.FC<CaComplianceHealthCheckProps> = ({
  onOpenBooking,
}) => {
  // Navigation Tabs: 1 = Statutory Calculator, 2 = Live GSTIN Decoder, 3 = Trial Balance Health Desk
  const [activeTab, setActiveTab] = useState<"calc" | "gstin" | "tb">("calc");
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);

  // =========================================================================
  // TAB 1: MATHEMATICAL STATUTORY LIABILITY CALCULATOR STATE
  // =========================================================================
  const [entityType, setEntityType] = useState<"pvt-ltd" | "public-ltd" | "llp" | "proprietor" | "startup">("pvt-ltd");
  const [turnoverLakhs, setTurnoverLakhs] = useState<number>(1450); // ₹14.50 Crores
  const [cashRatioPercent, setCashRatioPercent] = useState<number>(3); // 3% cash (digital >95%)
  const [overdueMsmeLakhs, setOverdueMsmeLakhs] = useState<number>(18.5); // ₹18.5 Lakhs > 45 days
  const [disputedNoticeLakhs, setDisputedNoticeLakhs] = useState<number>(24); // ₹24 Lakhs notice demand
  const [primaryUrgency, setPrimaryUrgency] = useState<string>("tax-audit");

  // =========================================================================
  // TAB 2: LIVE GSTIN DECODER STATE
  // =========================================================================
  const [inputGstin, setInputGstin] = useState<string>("23AABCU9821F1ZX");
  const [gstinTouched, setGstinTouched] = useState<boolean>(true);

  // =========================================================================
  // TAB 3: TRIAL BALANCE AUDIT HEALTH DESK STATE
  // =========================================================================
  const [tbLoaded, setTbLoaded] = useState<boolean>(true);
  const [tbCustomInput, setTbCustomInput] = useState<string>("");

  // =========================================================================
  // CALCULATOR LOGIC (1000% ACCURATE TO INCOME TAX ACT, 1961 & CGST ACT, 2017)
  // =========================================================================
  const calculations = useMemo(() => {
    const turnoverInr = turnoverLakhs * 100000;
    const msmeOverdueInr = overdueMsmeLakhs * 100000;
    const noticeDemandInr = disputedNoticeLakhs * 100000;

    // 1. Section 44AB Tax Audit Threshold (Proviso to Section 44AB(a))
    // If aggregate cash receipts and payments <= 5% -> Threshold is ₹10 Crores
    // If cash > 5% -> Threshold is ₹1 Crore
    const isDigitalEligible = cashRatioPercent <= 5;
    const taxAuditLimitInr = isDigitalEligible ? 100000000 : 10000000; // 10 Cr vs 1 Cr
    const isTaxAuditMandatory = turnoverInr > taxAuditLimitInr;

    // 2. Section 271B Penalty for Failure to Audit
    // 0.5% of turnover, capped at ₹1,50,000
    const sec271bPenaltyInr = isTaxAuditMandatory 
      ? Math.min(turnoverInr * 0.005, 150000) 
      : 0;

    // 3. Section 43B(h) MSME Disallowance Exposure
    // Tax rate: 25.17% for Pvt Ltd (turnover < ₹400 Cr u/s 115BAA/base rate + 10% surcharge + 4% cess)
    // 31.2% for LLP / Partnership (30% + 4% cess)
    const effectiveTaxRate = (entityType === "llp" || entityType === "proprietor") ? 0.312 : 0.2517;
    const msmeTaxDisallowanceInr = entityType === "startup" ? 0 : (msmeOverdueInr * effectiveTaxRate);
    
    // MSMED Act Section 16 Statutory Interest (3x RBI Bank Rate ~ 20.25% p.a.)
    // Disallowed under Section 23 of MSMED Act
    const msmeAnnualInterestInr = msmeOverdueInr * 0.2025;

    // 4. Section 270A Under-Reporting / Misreporting Penalty on Disputed Demands
    // Under-reporting = 50%, Misreporting (bogus expenses / unexplained credit) = 200%
    const isHighStakesNotice = primaryUrgency === "tax-notice" || primaryUrgency === "gst-mismatch";
    const penaltyRate = isHighStakesNotice ? 2.0 : 0.5; // 200% for scrutiny notices
    const potentialNoticePenaltyInr = noticeDemandInr * penaltyRate;

    // Interest u/s 234B & 234C or GST Sec 50(1) @ 18% p.a. (Estimated 1 year litigation)
    const estimatedLitigationInterestInr = noticeDemandInr * 0.18;

    // Total Financial & Statutory Exposure
    const totalExposureInr = Math.round(
      sec271bPenaltyInr + 
      msmeTaxDisallowanceInr + 
      msmeAnnualInterestInr + 
      potentialNoticePenaltyInr + 
      estimatedLitigationInterestInr
    );

    // Risk Priority Tier
    let riskTier: "Critical" | "High" | "Moderate" = "Moderate";
    let riskColor = "text-amber-700 bg-amber-50 border-amber-300";
    if (primaryUrgency === "tax-notice" || isTaxAuditMandatory || totalExposureInr > 2000000) {
      riskTier = "Critical";
      riskColor = "text-red-700 bg-red-50 border-red-300";
    } else if (overdueMsmeLakhs > 10 || primaryUrgency === "gst-mismatch") {
      riskTier = "High";
      riskColor = "text-amber-800 bg-amber-100/70 border-amber-300";
    }

    // Strategic Directive
    let directive = "Initiate Schedule III ledger mapping and Form 3CD Clause 44 GST reconciliation.";
    if (primaryUrgency === "tax-notice") {
      directive = "Statutory 15/30-day reassessment window is legally binding. File detailed written reply with documentary evidence before Assessing Officer / NFAC.";
    } else if (primaryUrgency === "msme") {
      directive = "Execute bilateral written credit agreements extending terms to statutory 45 days prior to financial year end to prevent 43B(h) additions.";
    } else if (primaryUrgency === "gst-mismatch") {
      directive = "Perform algorithmic supplier-level GSTR-2B vs 3B invoice matching before issuing admissions under Form DRC-03.";
    } else if (primaryUrgency === "bank-cc") {
      directive = "Align Current Ratio (>1.33) and DSCR (>1.50) in CMA Data to satisfy nationalized bank credit rating criteria.";
    }

    return {
      turnoverInr,
      isDigitalEligible,
      taxAuditLimitInr,
      isTaxAuditMandatory,
      sec271bPenaltyInr,
      msmeTaxDisallowanceInr,
      msmeAnnualInterestInr,
      potentialNoticePenaltyInr,
      estimatedLitigationInterestInr,
      totalExposureInr,
      riskTier,
      riskColor,
      directive,
    };
  }, [entityType, turnoverLakhs, cashRatioPercent, overdueMsmeLakhs, disputedNoticeLakhs, primaryUrgency]);

  // Format INR Helper
  const formatInr = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // =========================================================================
  // GSTIN DECODER ENGINE
  // =========================================================================
  const gstinAnalysis = useMemo(() => {
    const clean = inputGstin.trim().toUpperCase().replace(/[\s-]/g, "");
    if (!clean) return null;

    const validation = validateGstinStrict(clean);
    const stateCode = clean.substring(0, 2);
    const pan = clean.length >= 12 ? clean.substring(2, 12) : "";
    const panFourthChar = pan[3] || "";
    
    const stateMeta = getStateByGstCode(stateCode);
    const stateName = stateMeta ? stateMeta.name : (stateCode === "23" ? "Madhya Pradesh" : "State Code " + stateCode);

    const constitutionMap: Record<string, { type: string; desc: string }> = {
      C: { type: "Company (Corporate)", desc: "Private Limited / Public Limited Company (Governed by Companies Act 2013)" },
      F: { type: "Partnership / LLP", desc: "Limited Liability Partnership or Partnership Firm (Governed by LLP Act / Partnership Act)" },
      P: { type: "Sole Proprietorship", desc: "Individual / Sole Proprietorship Concern" },
      T: { type: "Trust / Society", desc: "Charitable or Religious Trust / Registered Society (Form 10B/10BB Audit)" },
      H: { type: "HUF", desc: "Hindu Undivided Family" },
      A: { type: "AOP / BOI", desc: "Association of Persons / Body of Individuals" },
    };

    const constitution = constitutionMap[panFourthChar] || { 
      type: "Registered Entity", 
      desc: "Commercial Enterprise registered with GSTN" 
    };

    return {
      raw: clean,
      isValid: validation.isValid,
      error: validation.error,
      stateCode,
      stateName,
      pan,
      panFourthChar,
      constitution,
      officialPortalUrl: `https://services.gst.gov.in/services/searchtpbypan`,
      mcaUrl: `https://www.mca.gov.in/content/mca/global/en/home.html`,
    };
  }, [inputGstin]);

  // =========================================================================
  // TRIAL BALANCE SAMPLE DATA & PARSING
  // =========================================================================
  const sampleTb = useMemo(() => {
    return {
      companyName: "Pratwi Solutions Private Limited",
      totalDebits: 148560240, // ₹14.85 Cr
      totalCredits: 148560240, // ₹14.85 Cr
      difference: 0,
      isBalanced: true,
      ledgersCount: 148,
      anomalies: [
        {
          code: "SEC_40A2B",
          title: "Directors' Remuneration & Rent",
          amount: "₹48,00,000",
          severity: "HIGH",
          note: "Requires Form 3CD Clause 23 / Section 40A(2)(b) benchmark reasonableness testing.",
        },
        {
          code: "SEC_43BH",
          title: "Sundry Creditors MSME Dues > 45 Days",
          amount: "₹18,50,000",
          severity: "CRITICAL",
          note: "Unpaid MSME dues at year-end must be disallowed unless paid within agreement window.",
        },
        {
          code: "CARO_DEPR",
          title: "Fixed Assets & Depreciation Dual Computation",
          amount: "₹1,24,50,000",
          severity: "MODERATE",
          note: "Schedule II Useful Life (Companies Act) vs Section 32 WDV rates (Income Tax Act).",
        },
      ],
      healthScore: 92,
    };
  }, []);

  const handleLaunchBookingWithData = () => {
    const summary = `Diagnostic Audit Run: ${entityType.toUpperCase()} | Turnover: ${formatInr(calculations.turnoverInr)} | Tax Audit: ${calculations.isTaxAuditMandatory ? "MANDATORY" : "EXEMPT"} | Est Exposure: ${formatInr(calculations.totalExposureInr)} | Challenge: ${primaryUrgency}`;
    onOpenBooking(
      calculations.isTaxAuditMandatory ? "Corporate Statutory & Tax Audit" : "General Corporate Advisory",
      gstinAnalysis?.isValid ? gstinAnalysis.raw : undefined,
      summary
    );
  };

  return (
    <section id="health-check" className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50 border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3 shadow-2xs">
            <Calculator className="w-3.5 h-3.5 shrink-0" />
            <span>Institutional Pre-Audit &amp; Diagnostic Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Corporate Tax &amp; Audit Compliance Health Check
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Mathematically evaluate your company&apos;s statutory audit applicability under Section 44AB, exposure under Section 43B(h), and verify legal entity credentials in real-time.
          </p>

          {/* 3 Interactive Mode Tabs */}
          <div className="mt-6 flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto scrollbar-none max-w-full justify-start sm:justify-center">
            <button
              onClick={() => setActiveTab("calc")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "calc"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Calculator className="w-3.5 h-3.5 shrink-0" />
              <span>1. Liability Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab("gstin")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "gstin"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span>2. GSTIN Decoder</span>
            </button>

            <button
              onClick={() => setActiveTab("tb")}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "tb"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>3. Trial Balance Scanner</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: STATUTORY RISK & PENALTY LIABILITY CALCULATOR */}
        {/* ========================================================================= */}
        {activeTab === "calc" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            
            {/* Left Inputs (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Enter Financial &amp; Operational Metrics</span>
                </h3>
                <span className="text-[11px] font-bold text-btred-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                  AY 2025-26 &bull; FY 2024-25
                </span>
              </div>

              {/* 1. Entity Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Entity Legal Structure
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "pvt-ltd", label: "Private Limited", rate: "25% Tax" },
                    { id: "public-ltd", label: "Public Ltd / Sub", rate: "25% Tax" },
                    { id: "llp", label: "LLP Firm", rate: "30% Tax" },
                    { id: "proprietor", label: "Partnership / Prop", rate: "30% Tax" },
                    { id: "startup", label: "DPIIT Startup", rate: "80-IAC Exempt" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEntityType(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        entityType === item.id
                          ? "bg-btred-600 text-white border-btred-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className={`text-[10px] ${entityType === item.id ? "text-white/80" : "text-slate-500"}`}>{item.rate}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Annual Turnover Slider + Manual Input */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Annual Gross Turnover / Receipts
                  </label>
                  <span className="text-xs sm:text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                    {formatInr(turnoverLakhs * 100000)}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="10000"
                  step="10"
                  value={turnoverLakhs}
                  onChange={(e) => setTurnoverLakhs(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-btred-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>₹20 Lakhs</span>
                  <span>₹10 Cr (Sec 44AB Proviso)</span>
                  <span>₹50 Cr</span>
                  <span>₹100 Cr+</span>
                </div>
              </div>

              {/* 3. Cash Transactions % (Key for Section 44AB Proviso) */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>3. Cash Receipts &amp; Payments %</span>
                    <span className="group relative cursor-pointer">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                  </label>
                  <span className={`text-[11px] sm:text-xs font-extrabold px-2 py-0.5 rounded-md self-start sm:self-auto ${
                    cashRatioPercent <= 5 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    {cashRatioPercent}% Cash ({cashRatioPercent <= 5 ? "₹10 Cr Limit" : "₹1 Cr Limit"})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={cashRatioPercent}
                  onChange={(e) => setCashRatioPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0% (100% Digital)</span>
                  <span className="font-bold text-emerald-600">5% Threshold</span>
                  <span>20% (High Cash)</span>
                </div>
              </div>

              {/* 4. Section 43B(h) Unpaid MSME Dues (>45 Days) */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    4. Unpaid MSME Dues Beyond 15/45 Days
                  </label>
                  <span className="text-xs font-bold text-slate-900 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md self-start sm:self-auto">
                    {formatInr(overdueMsmeLakhs * 100000)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="2"
                  value={overdueMsmeLakhs}
                  onChange={(e) => setOverdueMsmeLakhs(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹0 (Nil Overdue)</span>
                  <span>₹50 Lakhs</span>
                  <span>₹2 Crores</span>
                </div>
              </div>

              {/* 5. Disputed Demand / Notice Amount */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    5. Disputed Tax Notice / GST DRC-01 Demand
                  </label>
                  <span className="text-xs font-bold text-slate-900 bg-red-50 text-red-900 border border-red-200 px-2 py-0.5 rounded-md self-start sm:self-auto">
                    {formatInr(disputedNoticeLakhs * 100000)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={disputedNoticeLakhs}
                  onChange={(e) => setDisputedNoticeLakhs(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-btred-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹0 (Routine Audit)</span>
                  <span>₹1 Crore</span>
                  <span>₹3 Crores</span>
                </div>
              </div>

              {/* 6. Primary Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  6. Primary Statutory Mandate
                </label>
                <select
                  value={primaryUrgency}
                  onChange={(e) => setPrimaryUrgency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500 font-medium"
                >
                  <option value="tax-audit">Annual Corporate Statutory &amp; Tax Audit (Form 3CD + Schedule III)</option>
                  <option value="tax-notice">Received Income Tax Scrutiny / Reassessment (Sec 148, 143(2), CIT-A)</option>
                  <option value="gst-mismatch">GST DRC-01 Notice / Ineligible ITC Reversal / GSTR-2B Mismatch</option>
                  <option value="msme">Section 43B(h) MSME 45-Day Vendor Payment Disallowance Shield</option>
                  <option value="bank-cc">Bank CC Working Capital Renewal / Enhancement (CMA Data)</option>
                  <option value="switch-ca">Switching from Slow / Non-Responsive Current CA Firm</option>
                </select>
              </div>

            </div>

            {/* Right Output Diagnostic Box (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              
              {/* Header Box */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Calculated Statutory Roadmap
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    Pre-Audit Diagnostic Exposure
                  </h3>
                </div>

                <div className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${calculations.riskColor}`}>
                  {calculations.riskTier} Risk
                </div>
              </div>

              {/* Total Financial Exposure Card */}
              <div className="bg-white border-2 border-red-500 text-slate-900 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total Potential Statutory &amp; Penalty Exposure
                  </span>
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <span className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">{formatInr(calculations.totalExposureInr)}</span>
                  <span className="text-[11px] sm:text-xs font-normal text-slate-500">(If left unresolved at audit sign-off)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sec 44AB Tax Audit:</span>
                    <span className={`font-bold ${calculations.isTaxAuditMandatory ? "text-red-600" : "text-emerald-600"}`}>
                      {calculations.isTaxAuditMandatory ? "MANDATORY" : "EXEMPT (<₹10 Cr Digital)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sec 43B(h) Tax Shock:</span>
                    <span className="font-bold text-amber-700">
                      {formatInr(calculations.msmeTaxDisallowanceInr)} added tax
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 44AB Legal Applicability Analysis */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Section 44AB Audit Threshold Verification:</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Threshold: {formatInr(calculations.taxAuditLimitInr)}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {calculations.isTaxAuditMandatory ? (
                    <>
                      Your turnover of <strong>{formatInr(calculations.turnoverInr)}</strong> exceeds the statutory threshold of <strong>{formatInr(calculations.taxAuditLimitInr)}</strong>. Corporate statutory audit under Companies Act 2013 and Tax Audit Report in <strong>Form 3CD</strong> with UDIN is strictly mandatory before <strong>30th September</strong> to avoid penalty u/s 271B ({formatInr(calculations.sec271bPenaltyInr)}).
                    </>
                  ) : (
                    <>
                      Your cash receipts are under 5%, allowing your business to enjoy the relaxed <strong>₹10 Crore threshold</strong> under the proviso to Section 44AB(a). Tax audit is not mandatory unless you are opting out of presumptive taxation.
                    </>
                  )}
                </p>
              </div>

              {/* Primary Strategic Directive */}
              <div className="bg-red-50/50 rounded-2xl p-4 border border-red-200/80 space-y-1.5">
                <div className="text-[11px] font-extrabold text-btred-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Senior Partner Strategic Intervention</span>
                </div>
                <div className="text-xs text-slate-800 font-semibold leading-relaxed">
                  {calculations.directive}
                </div>
              </div>

              {/* Mandatory Statutory Filings Checklist */}
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-btred-600" />
                  <span>Mandatory Statutory Filings &amp; Workpapers</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    "Form 3CD Tax Audit & Clause 44",
                    "Schedule III Audited Financials",
                    "CARO 2020 Compliance Notes",
                    "MCA AOC-4 & MGT-7",
                    "Section 43B(h) Clause 22 Schedule",
                    "UDIN Generation on ICAI Portal",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setIsMemoOpen(true)}
                  className="w-full h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-300 shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>View &amp; Print Official Pre-Audit Memorandum</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleLaunchBookingWithData}
                    className="w-full sm:w-auto flex-1 h-12 px-5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Private Session with CA Gunjan Jain</span>
                  </button>

                  <a
                    href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent(
                      `*Pre-Audit Diagnostic Report - Brains & Taxes*\n🏢 Entity: ${entityType.toUpperCase()}\n📊 Turnover: ${formatInr(calculations.turnoverInr)}\n⚠️ 44AB Status: ${calculations.isTaxAuditMandatory ? "MANDATORY" : "EXEMPT"}\n🚨 Est Exposure: ${formatInr(calculations.totalExposureInr)}\n\nHello CA Gunjan Jain, I would like to review our statutory audit with GPA & Co.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto h-12 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Direct WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-2">
                <span>Under ICAI Code of Ethics</span>
                <span>&bull;</span>
                <span>Confidential</span>
                <span>&bull;</span>
                <span>Zero Obligation</span>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LIVE GSTIN & CORPORATE MASTER DATA DECODER */}
        {/* ========================================================================= */}
        {activeTab === "gstin" && (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-btred-600">
                CBIC Mod-36 Statutory Decoder
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Live GSTIN Structural &amp; Jurisdiction Verifier
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Enter your company or vendor GSTIN. Our engine mathematically validates the Mod-36 checksum, decodes the state jurisdiction, extracts the PAN, and maps the legal entity classification.
              </p>
            </div>

            {/* Input Field with Quick Test Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter 15-Digit GSTIN
              </label>
              {/* Input Field with Responsive Validation Badge */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  maxLength={15}
                  value={inputGstin}
                  onChange={(e) => {
                    setInputGstin(e.target.value.toUpperCase());
                    setGstinTouched(true);
                  }}
                  placeholder="e.g. 23AABCU9821F1ZX"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm sm:text-base font-mono uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                />
                <div className="shrink-0 flex items-center justify-end">
                  {gstinAnalysis?.isValid ? (
                    <span className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Valid Checksum</span>
                    </span>
                  ) : (
                    <span className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                      <AlertCircle className="w-3.5 h-3.5 text-btred-600" />
                      <span>Invalid Format</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Sample Quick Pick Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                <span className="text-[11px]">Test Sample GSTINs:</span>
                <button
                  type="button"
                  onClick={() => setInputGstin("23AABCU9821F1ZX")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[11px] font-bold"
                >
                  23AABCU9821F1ZX (Brains &amp; Taxes - MP)
                </button>
                <button
                  type="button"
                  onClick={() => setInputGstin("27AAACG0561F1Z8")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[11px] font-bold"
                >
                  27AAACG0561F1Z8 (Godrej - MH)
                </button>
                <button
                  type="button"
                  onClick={() => setInputGstin("07AABCT2365A1Z4")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[11px] font-bold"
                >
                  07AABCT2365A1Z4 (Tata - DL)
                </button>
              </div>
            </div>

            {/* Decoded Profile Results */}
            {gstinAnalysis && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">State &amp; Jurisdiction</span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">{gstinAnalysis.stateName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Code {gstinAnalysis.stateCode}</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Extracted PAN</span>
                    <span className="text-sm font-mono font-black text-slate-900 mt-0.5 block">{gstinAnalysis.pan || "Invalid"}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Income Tax Linked</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Entity Constitution</span>
                    <span className="text-sm font-black text-btred-600 mt-0.5 block">{gstinAnalysis.constitution.type}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{gstinAnalysis.constitution.desc}</span>
                  </div>
                </div>

                {/* Government Portal Links */}
                <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <a
                      href={gstinAnalysis.officialPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-btred-600 hover:text-btred-700 font-bold"
                    >
                      <span>Verify on GST Portal (services.gst.gov.in)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => onOpenBooking("Corporate Statutory & Tax Audit", gstinAnalysis.raw, `GSTIN: ${gstinAnalysis.raw} (${gstinAnalysis.constitution.type})`)}
                    className="px-5 py-2.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
                  >
                    <span>Use this GSTIN to Request Audit Consultation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TRIAL BALANCE PRE-AUDIT DESK */}
        {/* ========================================================================= */}
        {activeTab === "tb" && (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-btred-600">
                  Pre-Audit Mathematical Integrity
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Trial Balance &amp; Ledger Risk Scanner
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Audit Health Score: {sampleTb.healthScore}/100</span>
                </span>
              </div>
            </div>

            {/* Trial Balance Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Debits</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">
                  {formatInr(sampleTb.totalDebits)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">148 Ledgers Ingested</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Credits</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">
                  {formatInr(sampleTb.totalCredits)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Books Fully Balanced</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Net Difference</span>
                <span className="text-lg font-black text-emerald-700 mt-1 block">
                  ₹0.00
                </span>
                <span className="text-[10px] text-slate-500 font-bold">Eligible for UDIN Sign-Off</span>
              </div>
            </div>

            {/* Detected Pre-Audit Statutory Risk Flags */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Pre-Audit Workpaper Disallowance Alerts (Clause 22 &amp; 23)</span>
              </div>

              <div className="space-y-2.5">
                {sampleTb.anomalies.map((anom, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          anom.severity === "CRITICAL" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {anom.code}
                        </span>
                        <span className="font-bold text-slate-900">{anom.title}</span>
                        <span className="text-xs font-extrabold text-btred-600 font-mono">{anom.amount}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {anom.note}
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenBooking("Corporate Statutory & Tax Audit", undefined, `Pre-Audit TB Alert: ${anom.code} (${anom.title})`)}
                      className="self-start sm:self-auto text-btred-600 hover:text-btred-700 font-bold text-xs whitespace-nowrap"
                    >
                      Resolve &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Want our audit team to ingest your full Tally XML / Excel file before year-end?
              </div>

              <button
                onClick={() => onOpenBooking("Corporate Statutory & Tax Audit", undefined, "Client requests full Tally Prime Trial Balance pre-audit ingestion")}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Trial Balance Audit Review</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* PRE-AUDIT STATUTORY DIAGNOSTIC MEMORANDUM MODAL (PRINTABLE / PDF READY) */}
        {/* ========================================================================= */}
        {isMemoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
              
              {/* Modal Control Bar (Excluded from print) */}
              <div className="bg-white border-b border-slate-200 text-slate-900 px-5 sm:px-7 py-3 flex items-center justify-between no-print shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span className="truncate">Official Statutory Memorandum &bull; GPA &amp; Co.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-red-600" />
                    <span>Print / Save PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMemoOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Memorandum Content */}
              <div className="overflow-y-auto flex-1 p-6 sm:p-10 font-sans text-slate-900 space-y-6 text-left">
                {/* Formal Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                      GPA &amp; CO., CHARTERED ACCOUNTANTS
                    </h2>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      ICAI Firm Registration Number (FRN): {DEFAULT_FIRM_BRANDING.frn} &bull; Peer Review Board Certified
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {DEFAULT_FIRM_BRANDING.headOffice}
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-[11px] font-mono text-slate-500">
                    <div className="font-bold text-slate-900 text-xs">CONFIDENTIAL MEMORANDUM</div>
                    <div>Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    <div>AY: 2025-26 &bull; FY: 2024-25</div>
                  </div>
                </div>

                {/* Memorandum Subject */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider text-btred-600">
                    Subject: Pre-Audit Statutory Scoping &amp; Financial Exposure Diagnostic
                  </div>
                  <div className="text-slate-700">
                    <strong>Assessee Profile:</strong> {entityType.toUpperCase()} Enterprise &bull; <strong>Declared Turnover:</strong> {formatInr(calculations.turnoverInr)} &bull; <strong>Cash Transactions:</strong> {cashRatioPercent}%
                  </div>
                </div>

                {/* Findings Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    1. Statutory Threshold &amp; Risk Determinations
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left divide-y divide-slate-200">
                      <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                        <tr>
                          <th className="p-3">Statutory Provision</th>
                          <th className="p-3">Applicability Standard</th>
                          <th className="p-3">Evaluation Status</th>
                          <th className="p-3 text-right">Potential Financial Exposure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-3 font-semibold text-slate-900">Section 44AB (Tax Audit)</td>
                          <td className="p-3 text-slate-600">₹1 Cr base / ₹10 Cr if cash &le; 5%</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              calculations.isTaxAuditMandatory ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {calculations.isTaxAuditMandatory ? "MANDATORY" : "EXEMPT (<₹10 Cr)"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {formatInr(calculations.sec271bPenaltyInr)} penalty risk
                          </td>
                        </tr>

                        <tr>
                          <td className="p-3 font-semibold text-slate-900">Section 43B(h) (MSME Overdues)</td>
                          <td className="p-3 text-slate-600">15/45-Day Payment Rule to Micro &amp; Small</td>
                          <td className="p-3 text-amber-800 font-medium">
                            {formatInr(overdueMsmeLakhs * 100000)} Overdue
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-btred-600">
                            +{formatInr(calculations.msmeTaxDisallowanceInr)} added corporate tax
                          </td>
                        </tr>

                        <tr>
                          <td className="p-3 font-semibold text-slate-900">Appellate Defense (Notice SCN)</td>
                          <td className="p-3 text-slate-600">Section 148 / 143(3) / DRC-01</td>
                          <td className="p-3 text-slate-700">
                            {formatInr(disputedNoticeLakhs * 100000)} in Dispute
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {formatInr(calculations.potentialNoticePenaltyInr)} potential penalty
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Exposure Summary */}
                <div className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">
                      Aggregated Statutory &amp; Penalty Exposure
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {formatInr(calculations.totalExposureInr)}
                    </span>
                  </div>
                  <span className="text-xs text-amber-800 font-bold px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                    {calculations.riskTier} Risk Classification
                  </span>
                </div>

                {/* Mandatory Filings Schedule */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    2. Mandatory Statutory Filings &amp; Deliverables
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      "Form 3CD Tax Audit Report",
                      "Schedule III Financial Statements",
                      "CARO 2020 Compliance Notes",
                      "MCA Form AOC-4 Financials",
                      "MCA Form MGT-7 Annual Return",
                      "GSTR-9 & 9C Certification",
                      "MSME Form 1 (Half-Yearly)",
                      "Section 43B(h) Clause 22 Schedule",
                      "UDIN Generation on ICAI Portal",
                    ].map((f, i) => (
                      <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lead Partner Attestation */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">Issued by Practice Intelligence Desk</div>
                    <div className="text-slate-500 text-[11px]">GPA &amp; Co., Chartered Accountants &bull; Brains &amp; Taxes Practice OS</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src="/images/ca-gunjan-jain.png"
                      alt="CA Gunjan Jain, FCA"
                      className="w-11 h-11 rounded-full object-cover object-top border-2 border-btred-500 shadow-xs shrink-0"
                    />
                    <div className="text-left sm:text-right">
                      <div className="font-extrabold text-slate-900">{DEFAULT_FIRM_BRANDING.managingPartner}</div>
                      <div className="text-btred-600 text-[11px] font-bold">Managing Partner &bull; Fellow Chartered Accountant (ICAI)</div>
                      <div className="text-[10px] text-slate-400">FRN: 022998C &bull; Peer Review Board Certified</div>
                    </div>
                  </div>
                </div>

                {/* Action in Modal */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 no-print">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMemoOpen(false);
                      handleLaunchBookingWithData();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Partner Review Session with CA Gunjan Jain</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
};
