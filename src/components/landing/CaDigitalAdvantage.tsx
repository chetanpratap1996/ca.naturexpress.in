"use client";

import React from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  ArrowRight,
  Zap,
  KeyRound,
  ShieldCheck,
  FileCheck2,
  Lock
} from "lucide-react";

interface CaDigitalAdvantageProps {
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
  onOpenBooking?: (service?: string) => void;
}

export const CaDigitalAdvantage: React.FC<CaDigitalAdvantageProps> = ({
  onOpenLogin,
  onOpenBooking,
}) => {
  const comparisonItems = [
    {
      feature: "Client Document Vault Access",
      traditional: "Manual email requests; waiting 24 to 72 hours for signed copies.",
      brainsTaxes: "Instant 24/7 Secure Cloud Vault. Download signed ITRs, 3CD, and Balance Sheets anytime.",
    },
    {
      feature: "Bank Loan / CC Limit Dockets",
      traditional: "Cluttered PDFs sent piece-meal; bank credit managers reject incomplete packs.",
      brainsTaxes: "1-Click 'Banker Docket' Generator compiling 3 years' audited financials & CMA data instantly.",
    },
    {
      feature: "Filing Deadline Transparency",
      traditional: "Zero visibility. Promoters stressed about whether returns were filed on time.",
      brainsTaxes: "Live Real-Time Filing Pipeline. Track Drafted → Partner Approved → Filed with Challan.",
    },
    {
      feature: "Portal Authentication",
      traditional: "Insecure password sharing over WhatsApp or forgotten OTP delays.",
      brainsTaxes: "Direct 4-Digit Security PIN or verified credential access without SMS delays.",
    },
    {
      feature: "Statutory 43B(h) & GST Vigilance",
      traditional: "Discovered during year-end audit after disallowance has already crystallized.",
      brainsTaxes: "Continuous monthly surveillance of 45-day MSME dues & 2B invoice reversals.",
    },
    {
      feature: "Digital Signature (DSC) Security",
      traditional: "Physical USB token kept in drawer; risk of misuse or loss.",
      brainsTaxes: "Enterprise DSC Vault with expiry tracking and strict dual-custody audit logs.",
    },
  ];

  return (
    <section id="digital-advantage" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-slate-200 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 w-full min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>The Brains &amp; Taxes Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Why Forward-Thinking CFOs &amp; Founders Switch to Us
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Chartered Accountancy combined with enterprise-grade software. Experience total control over your audited financials, tax computations, and compliance deadlines.
          </p>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-xs mb-12 w-full max-w-full min-w-0">
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 bg-slate-100/90 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">
            <div className="md:col-span-4 p-4 sm:p-5">Capability / Service Experience</div>
            <div className="md:col-span-4 p-4 sm:p-5 border-t md:border-t-0 md:border-l border-slate-200 text-slate-500">
              Traditional CA Practice
            </div>
            <div className="md:col-span-4 p-4 sm:p-5 border-t md:border-t-0 md:border-l border-slate-200 text-btred-600 bg-red-50/50">
              Brains &amp; Taxes Practice
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-200">
            {comparisonItems.map((item, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 text-xs">
                {/* Feature Name */}
                <div className="md:col-span-4 p-4 sm:p-5 font-bold text-slate-900 flex items-center gap-2 bg-white md:bg-transparent">
                  <span className="w-1.5 h-1.5 rounded-full bg-btred-600 shrink-0"></span>
                  <span>{item.feature}</span>
                </div>

                {/* Traditional */}
                <div className="md:col-span-4 p-4 sm:p-5 border-t md:border-t-0 md:border-l border-slate-200 text-slate-600 flex items-start gap-2 bg-slate-50/40">
                  <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{item.traditional}</span>
                </div>

                {/* Brains & Taxes */}
                <div className="md:col-span-4 p-4 sm:p-5 border-t md:border-t-0 md:border-l border-slate-200 text-slate-800 font-medium flex items-start gap-2 bg-red-50/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item.brainsTaxes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Client Portal Vault Access Card (No dummy / fake sandbox buttons) */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-btred-600/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-bold border border-white/10">
                <Smartphone className="w-3.5 h-3.5" />
                <span>24/7 Digital Client Vault &bull; Included For Every Retained Client</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Secure 24/7 Client Compliance Vault
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Every retained client of GPA &amp; Co. receives authenticated access to their statutory audit workpapers, filed ITR acknowledgments, Form 3CD, banker CMA dockets, and MSME Section 43B(h) compliance records.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant Banker Docket Export</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live 43B(h) Vendor Countdown</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tax Notice Reply Tracking</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
              <button
                onClick={() => onOpenLogin("client")}
                className="w-full h-12 px-6 rounded-xl bg-btred-600 hover:bg-btred-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Access Client Portal Login</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              {onOpenBooking && (
                <button
                  onClick={() => onOpenBooking("Client Portal Onboarding")}
                  className="w-full h-11 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>Request Portal Access / Retainer</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
