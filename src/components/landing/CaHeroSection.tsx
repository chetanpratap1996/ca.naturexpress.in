"use client";

import React from "react";
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Award, 
  Building2, 
  TrendingUp, 
  FileCheck2, 
  Calendar,
  CheckCircle2,
  Lock,
  Scale,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaHeroSectionProps {
  onOpenBooking: (service?: string) => void;
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
  onEnterSandbox: (role: "partner" | "article" | "client") => void;
}

export const CaHeroSection: React.FC<CaHeroSectionProps> = ({
  onOpenBooking,
  onOpenLogin,
  onEnterSandbox,
}) => {
  return (
    <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 px-4 sm:px-8 bg-gradient-to-b from-white via-slate-50/70 to-white overflow-hidden border-b border-slate-200/80">
      {/* Decorative Warm Light Glowing Highlights (No dark blue/black) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-br from-red-100/35 via-amber-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* 1. Regulatory Authority Kicker */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-800 text-[11px] sm:text-xs font-bold shadow-sm mb-6 flex-wrap justify-center">
            <span className="flex items-center gap-1 text-btred-600 font-extrabold">
              <Award className="w-3.5 h-3.5" />
              <span>GPA &amp; CO.</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700">ICAI FRN: {DEFAULT_FIRM_BRANDING.frn}</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-extrabold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Peer Review Certified</span>
            </span>
          </div>

          {/* 2. Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            Precision Chartered Accountancy,{" "}
            <span className="text-btred-600 relative inline-block">
              Corporate Audit
              <svg 
                className="absolute -bottom-2 left-0 w-full h-2.5 text-btred-300/60" 
                viewBox="0 0 100 20" 
                preserveAspectRatio="none"
              >
                <path d="M0,15 Q50,0 100,15" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span>{" "}
            &amp; High-Stakes Tax Defense
          </h1>

          {/* 3. Sub-headline targeted at business promoters, founders, and CFOs */}
          <p className="mt-6 text-sm sm:text-lg text-slate-600 font-normal leading-relaxed max-w-3xl">
            Empowering corporate boards, manufacturing enterprises, high-growth startups, and family offices across India with bulletproof statutory compliance, faceless litigation defense, and proactive CFO counsel. Zero compliance anxiety, 100% audit-grade governance.
          </p>

          {/* 4. Primary & Secondary Conversion Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onOpenBooking()}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-sm font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Strategy Call with Senior Partner</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenLogin("client")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold border border-slate-300 shadow-sm transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Access 24/7 Client Vault &amp; Portal</span>
            </button>
          </div>

          {/* Micro trust assurances */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] sm:text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strict Non-Disclosure &amp; Client Privilege</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Senior Partner Direct Oversight</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Indore Head Office &amp; Pan-India Digital Desk</span>
            </span>
          </div>
        </div>

        {/* 5. Metrics & Proven Authority Ribbon */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              <span>₹1,400+</span>
              <span className="text-base sm:text-lg font-bold text-btred-600">Cr</span>
            </div>
            <div className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800">
              Audited &amp; Certified Volume
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Statutory, Tax &amp; Internal Audits under Companies Act &amp; IT Act.
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              <span>4,200+</span>
              <span className="text-base sm:text-lg font-bold text-emerald-600">Clients</span>
            </div>
            <div className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800">
              Active Corporate Assessees
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Pvt Ltd, Public Enterprises, LLPs, Promoters &amp; Family Offices.
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              <span>99.8%</span>
              <span className="text-base sm:text-lg font-bold text-amber-600">Success</span>
            </div>
            <div className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800">
              Notice &amp; Scrutiny Defense
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Faceless Assessments, Section 148 Reopenings, GST DRC-01 Replies.
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <div className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              <span>35+</span>
              <span className="text-base sm:text-lg font-bold text-btred-600">Years</span>
            </div>
            <div className="mt-1.5 text-xs sm:text-sm font-bold text-slate-800">
              Institutional Heritage
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Steered by CA Gunjan Jain (FCA) with multi-generational legacy.
            </div>
          </div>
        </div>

        {/* 6. Live Interactive Statutory Vigilance Card */}
        <div className="mt-6 bg-gradient-to-r from-red-50/70 via-amber-50/40 to-slate-50 rounded-2xl p-4 sm:p-5 border border-red-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-red-200 flex items-center justify-center text-btred-600 flex-shrink-0 shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Active Statutory Advisory Alert</span>
                <span className="w-2 h-2 rounded-full bg-btred-600 animate-ping"></span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Section 43B(h) MSME 45-day payment audits, Form 3CD Clause 44 GST reconciliation, and Advance Tax Q4 preparation now active for FY 2024-25 / AY 2025-26.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <a
              href="#health-check"
              className="text-xs font-bold text-btred-600 hover:text-btred-700 bg-white px-3.5 py-2 rounded-lg border border-red-200 shadow-sm transition flex items-center gap-1.5"
            >
              <span>Run Instant Tax Risk Check</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
