"use client";

import React, { useState } from "react";
import { 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  FileText,
  DollarSign,
  Calendar
} from "lucide-react";

interface CaCaseStudiesProps {
  onOpenBooking: (serviceName?: string) => void;
}

export const CaCaseStudies: React.FC<CaCaseStudiesProps> = ({
  onOpenBooking,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const cases = [
    {
      title: "CIT(Appeals) Defense: ₹48.5L Unexplained Cash Addition Quashed",
      clientType: "Auto Ancillary Manufacturer (Pithampur Industrial Area)",
      statutoryContext: "Section 148 Reopening & Section 68 Unexplained Credits",
      challenge: "The Assessing Officer reopened AY 2018-19 alleging ₹48.5 Lakhs in bogus share application money based on insight portal data and proposed maximum marginal tax plus 200% penalty.",
      solution: "Brains & Taxes reconstructed the complete 7-year banking audit trail, source of source of funds, ROC filings, and filed comprehensive written submissions citing landmark Supreme Court precedents on onus of proof.",
      result: "CIT(Appeals) deleted the entire ₹48.5 Lakh addition with zero penalty. Complete relief granted without High Court appeal.",
      keyMetric: "₹48.5 Lakh Tax & Penalty Saved",
      duration: "6 Months",
    },
    {
      title: "GST DRC-01 SCN: ₹72L Ineligible ITC Demand Completely Dropped",
      clientType: "Wholesale FMCG & Logistics Major (Indore & Bhopal)",
      statutoryContext: "Section 16(4) Ineligible ITC & GSTR-2B vs 3B Variance",
      challenge: "State GST department issued DRC-01 demand notice proposing recovery of ₹72 Lakhs ITC plus 24% interest and penalty, claiming supplies were reflected after statutory cutoff dates.",
      solution: "Our indirect tax team deployed automated invoice-matching algorithms to demonstrate timely supplier payment and successfully proved tax had reached the government treasury, utilizing recent constitutional court rulings.",
      result: "Adjudicating Authority accepted our factual reconciliation and dropped the ₹72 Lakh demand in full.",
      keyMetric: "₹72 Lakh ITC Fully Protected",
      duration: "4 Months",
    },
    {
      title: "Bank Consortium: ₹28 Cr Working Capital Enhancement Sanctioned",
      clientType: "Heavy Steel Fabrication & EPC Contractor",
      statutoryContext: "Bank CMA Data, Current Ratio Realignment & Internal Financial Controls",
      challenge: "Client's existing CC limit of ₹12 Cr was choked due to expanded order books. Nationalized bank consortium stalled the proposal citing erratic inventory turnover and unclear debtor aging.",
      solution: "Brains & Taxes restructured the financial statements under Schedule III, engineered realistic 5-year CMA projections, and presented comprehensive Debt Service Coverage Ratios (DSCR) directly to bank risk officers.",
      result: "Consortium sanctioned enhanced limits of ₹28 Crores at competitive interest rates within 45 days.",
      keyMetric: "₹28 Cr Liquidity Unlocked",
      duration: "45 Days",
    },
    {
      title: "Startup DPIIT & Angel Tax: 100% Tax Holiday for SaaS Exporter",
      clientType: "AI & Cloud Software Startup (Central India / Delaware)",
      statutoryContext: "Section 80-IAC Deduction, 56(2)(viib) & Form 15CB Foreign Remittance",
      challenge: "Rapidly growing tech exporter faced complex cross-border transfer pricing, investor equity premium tax questions, and needed urgent Section 80-IAC approval from the Inter-Ministerial Board.",
      solution: "Drafted the innovative business profile, filed DCF valuation report under Rule 11UA, and established streamlined Form 15CA/CB documentation for zero-delay foreign client billings.",
      result: "Secured DPIIT certification and cleared institutional due diligence for a ₹14 Cr funding round.",
      keyMetric: "3-Year 100% Tax Holiday",
      duration: "60 Days",
    },
  ];

  const current = cases[activeTab];

  return (
    <section id="case-studies" className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50 border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3">
            <Award className="w-3.5 h-3.5" />
            <span>Proven Track Record</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Measurable Results in High-Stakes Engagements
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Real case histories illustrating how our senior audit and taxation team defends client capital, eliminates statutory exposure, and unlocks corporate growth.
          </p>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-8">
          {cases.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`p-3.5 rounded-2xl border text-left transition ${
                activeTab === i
                  ? "bg-white text-slate-900 border-btred-600 shadow-md ring-2 ring-red-100"
                  : "bg-white/60 hover:bg-white text-slate-700 border-slate-200"
              }`}
            >
              <div className="text-[10px] font-bold text-btred-600 uppercase tracking-wider truncate">
                {c.keyMetric}
              </div>
              <div className="text-xs font-bold text-slate-900 line-clamp-1 mt-1">
                {c.statutoryContext.split("•")[0]}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Case Study Detail Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200">
                  {current.clientType}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Statutory Forum: {current.statutoryContext}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {current.title}
              </h3>

              <div className="space-y-3 pt-2 text-xs leading-relaxed text-slate-700">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-extrabold text-slate-900 block mb-1">The Challenge:</span>
                  <span className="text-slate-600">{current.challenge}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-extrabold text-slate-900 block mb-1">Our Strategic Intervention:</span>
                  <span className="text-slate-600">{current.solution}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => onOpenBooking(current.title)}
                  className="px-6 py-3 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Discuss a Similar Matter with Senior Partner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Metric Highlight */}
            <div className="lg:col-span-4 bg-gradient-to-br from-red-50/60 via-amber-50/30 to-white rounded-2xl p-6 sm:p-8 border border-red-200/70 text-center space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quantified Client Impact
              </div>

              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {current.keyMetric}
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium">
                {current.result}
              </div>

              <div className="text-[11px] text-slate-500">
                Resolution Timeline: <strong>{current.duration}</strong> • Handled in strict compliance with ICAI standards.
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
