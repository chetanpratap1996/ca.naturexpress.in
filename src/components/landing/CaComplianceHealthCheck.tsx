"use client";

import React, { useState } from "react";
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
  RefreshCw
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaComplianceHealthCheckProps {
  onOpenBooking: (service?: string) => void;
}

export const CaComplianceHealthCheck: React.FC<CaComplianceHealthCheckProps> = ({
  onOpenBooking,
}) => {
  const [entityType, setEntityType] = useState<string>("pvt-ltd");
  const [turnover, setTurnover] = useState<string>("10cr-50cr");
  const [painPoint, setPainPoint] = useState<string>("tax-audit");
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);

  // Dynamic calculation logic
  const getDiagnosticResults = () => {
    let riskLevel: "Critical" | "High" | "Moderate" = "Moderate";
    let riskColor = "text-amber-600 bg-amber-50 border-amber-200";
    let priorityTitle = "Corporate Statutory Audit & Section 43B(h) Clearance";
    let mandatoryForms = ["Form 3CD Tax Audit", "MCA Form AOC-4", "MCA Form MGT-7", "GSTR-9 & 9C"];
    let estimatedExposure = "High (Interest u/s 234 + Sec 43B(h) Disallowances)";
    let recommendation = "Initiate pre-audit vendor classification and Schedule III ledger mapping immediately.";

    if (painPoint === "tax-notice") {
      riskLevel = "Critical";
      riskColor = "text-red-700 bg-red-50 border-red-300";
      priorityTitle = "Immediate Appellate Defense & Reassessment Stay";
      mandatoryForms = ["Section 148 Reply", "Cashflow SFT Re-audit", "Grounds of Appeal (CIT-A)", "Stay Petition u/s 220(6)"];
      estimatedExposure = "Demand + 100% to 200% Penalty u/s 270A";
      recommendation = "Statutory 15/30-day response window is legally binding. Review reasons recorded with Senior Partner within 48 hours.";
    } else if (painPoint === "gst-mismatch") {
      riskLevel = "Critical";
      riskColor = "text-red-700 bg-red-50 border-red-300";
      priorityTitle = "GSTR-2B vs 3B Reversal Defense & DRC-01 Representation";
      mandatoryForms = ["DRC-01A / DRC-01 Reply", "Rule 86A Ledger Re-credit", "Supplier GSTR-1 Verification", "Form GSTR-9C Reco"];
      estimatedExposure = "ITC Reversal + 18% or 24% Statutory Interest";
      recommendation = "Reconcile supplier-level filing compliance before issuing any admissions under GST DRC-03.";
    } else if (painPoint === "msme") {
      riskLevel = "High";
      riskColor = "text-amber-700 bg-amber-50 border-amber-300";
      priorityTitle = "Section 43B(h) Micro & Small Vendor Payment Audit";
      mandatoryForms = ["Udyam Category Verification", "15/45-Day Aging Ledger", "Tax Audit Clause 22 Statement", "Vendor Bilateral Agreements"];
      estimatedExposure = "30% Corporate Tax on Unpaid MSME Dues + Disallowance";
      recommendation = "Execute bilateral written credit agreements extending terms to statutory 45 days prior to financial year end.";
    } else if (painPoint === "bank-cc") {
      riskLevel = "Moderate";
      riskColor = "text-blue-700 bg-blue-50 border-blue-300";
      priorityTitle = "Bank CMA Data & Working Capital Enhancement";
      mandatoryForms = ["CMA Data Formats I to VI", "Audited Financials with IFC", "Projected Cashflows", "Stock & Debtors Audit"];
      estimatedExposure = "Loan Processing Rejection or Higher Penal Interest";
      recommendation = "Align Current Ratio (>1.33) and Debt Service Coverage Ratio (DSCR > 1.5) with institutional bank criteria.";
    } else if (painPoint === "switch-ca") {
      riskLevel = "Moderate";
      riskColor = "text-emerald-700 bg-emerald-50 border-emerald-300";
      priorityTitle = "Seamless ICAI No-Objection Transfer & Historical Audit Clean-up";
      mandatoryForms = ["ICAI Code of Ethics NOC Communication", "DSC Vault Handover", "Historical Trial Balance Re-audit", "MCA ADT-1 / ADT-3"];
      estimatedExposure = "Compliance vacuum and missed statutory filing dates";
      recommendation = "Our firm manages the entire ICAI protocol and digital document migration without business disruption.";
    }

    return {
      riskLevel,
      riskColor,
      priorityTitle,
      mandatoryForms,
      estimatedExposure,
      recommendation,
    };
  };

  const results = getDiagnosticResults();

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    setHasEvaluated(true);
  };

  const getWhatsAppQueryUrl = () => {
    const text = `*Compliance Diagnostic Request - Brains & Taxes*
🏢 *Entity Type:* ${entityType.toUpperCase()}
📊 *Turnover Bracket:* ${turnover}
⚠️ *Key Issue:* ${painPoint}
🚨 *Evaluated Risk:* ${results.riskLevel}
I would like to consult CA Gunjan Jain regarding: ${results.priorityTitle}`;

    return `https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="health-check" className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50 border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive Diagnostic Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Corporate Tax &amp; Audit Compliance Health Check
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Diagnose your statutory obligations, exposure risks, and mandatory filing schedules under the Income Tax Act, GST laws, and Companies Act in 3 clicks.
          </p>
        </div>

        {/* Diagnostic Form & Real-time Output Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>Step 1: Select Your Business Profile</span>
            </h3>

            {/* 1. Entity Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Legal Entity Structure
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { id: "pvt-ltd", label: "Private Limited" },
                  { id: "public-ltd", label: "Public Ltd / Sub" },
                  { id: "llp", label: "LLP Firm" },
                  { id: "proprietor", label: "Partnership / Prop" },
                  { id: "startup", label: "DPIIT Startup" },
                  { id: "nri", label: "NRI / Individual" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setEntityType(item.id);
                      setHasEvaluated(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                      entityType === item.id
                        ? "bg-btred-600 text-white border-btred-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Annual Turnover */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Annual Turnover / Volume
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "sub-1cr", label: "Below ₹1 Crore", desc: "Presumptive / Micro" },
                  { id: "1cr-10cr", label: "₹1 Crore – ₹10 Crore", desc: "Tax Audit Threshold" },
                  { id: "10cr-50cr", label: "₹10 Crore – ₹50 Crore", desc: "Mid-Market Corporate" },
                  { id: "50cr-plus", label: "₹50 Crore+", desc: "Enterprise & MSME Heavy" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTurnover(item.id);
                      setHasEvaluated(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      turnover === item.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-bold text-xs">{item.label}</div>
                    <div className={`text-[10px] ${turnover === item.id ? "text-slate-300" : "text-slate-500"}`}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Primary Concern */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Primary Compliance Urgency / Challenge
              </label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  { id: "tax-audit", label: "Annual Corporate Statutory & Tax Audit (Form 3CD + Schedule III)" },
                  { id: "tax-notice", label: "Received Income Tax Scrutiny Notice (Sec 148, 143(2), or 133(6))" },
                  { id: "gst-mismatch", label: "GST Notice DRC-01 / ITC Ineligibility / GSTR-2B vs 3B Dispute" },
                  { id: "msme", label: "Section 43B(h) 45-Day MSME Vendor Payment Disallowance Risk" },
                  { id: "bank-cc", label: "Bank Working Capital CC Limit Sanction / Renewal (CMA Data)" },
                  { id: "switch-ca", label: "Want to Switch from Slow / Unresponsive Previous CA Firm" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPainPoint(item.id);
                      setHasEvaluated(true);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      painPoint === item.id
                        ? "bg-red-50 text-btred-700 border-btred-600 ring-1 ring-btred-600 font-bold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <span>{item.label}</span>
                    {painPoint === item.id && <CheckCircle2 className="w-4 h-4 text-btred-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleEvaluate}
              className="w-full py-3 rounded-xl bg-btred-600 hover:bg-btred-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Recalculate Compliance Diagnostic</span>
            </button>
          </div>

          {/* Right Output Diagnostic Box (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Audit &amp; Risk Diagnostic
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Customized Statutory Roadmap
                </h3>
              </div>

              <div className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${results.riskColor}`}>
                {results.riskLevel} Priority
              </div>
            </div>

            {/* Strategic Directive */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Primary Engagement Directive
              </div>
              <div className="text-base font-extrabold text-slate-900">
                {results.priorityTitle}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {results.recommendation}
              </p>
            </div>

            {/* Mandatory Statutory Filings */}
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-btred-600" />
                <span>Mandatory Filings &amp; Workpapers Required</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.mandatoryForms.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimated Risk Exposure */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Regulatory / Financial Exposure if Delayed:</span>
              </div>
              <div className="font-semibold text-slate-800">
                {results.estimatedExposure}
              </div>
            </div>

            {/* Next Steps Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenBooking(results.priorityTitle)}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Strategic Partner Review</span>
              </button>

              <a
                href={getWhatsAppQueryUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Share with CA Gunjan Jain</span>
              </a>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              Confidential computation • Under ICAI Code of Ethics • Free of charge
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
