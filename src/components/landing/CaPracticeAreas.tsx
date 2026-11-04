"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Scale, 
  FileSpreadsheet, 
  TrendingUp, 
  ShieldCheck, 
  FileCheck2, 
  Globe2, 
  Rocket, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Calendar,
  Lock,
  Calculator,
  ChevronRight
} from "lucide-react";

interface CaPracticeAreasProps {
  onOpenBooking: (serviceName?: string) => void;
}

export const CaPracticeAreas: React.FC<CaPracticeAreasProps> = ({
  onOpenBooking,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  const practices = [
    {
      id: "corporate-audit",
      icon: Building2,
      title: "Corporate Statutory & Tax Audit",
      tagline: "Companies Act 2013 • Form 3CD • Schedule III • CARO 2020",
      description: "Rigorous statutory, internal, and tax audits designed to fortify corporate governance, satisfy institutional lenders, and withstand regulatory scrutiny.",
      deliverables: [
        "Schedule III compliant Balance Sheet & P&L with all mandatory notes",
        "Form 3CD Tax Audit with rigorous Clause 44 GST reconciliation",
        "CARO 2020 comprehensive reporting & Internal Financial Controls (IFC)",
        "UDIN generation within mandatory 60-day ICAI compliance window",
        "Board Presentation on key control deficiencies & tax leakages",
      ],
      targetAudience: "Private Limited Companies, Public Unlisted Corporates, LLPs with turnover > ₹1 Cr / ₹10 Cr",
      statutoryStat: "100% Peer-Reviewed Audit Methodology",
    },
    {
      id: "tax-litigation",
      icon: Scale,
      title: "Direct Tax Scrutiny & Faceless Appeals",
      tagline: "Section 148 Reopening • 143(3) Scrutiny • CIT(A) • ITAT",
      description: "Aggressive, high-stakes legal defense for complex reassessment notices, unexplained cash credits (Sec 68), bogus billing allegations, and faceless appellate hearings.",
      deliverables: [
        "Comprehensive reply drafting to Section 148, 148A(b), and 143(2) notices",
        "Cashflow and documentary trail reconstruction for high-value SFT inquiries",
        "Filing Grounds of Appeal and Statement of Facts before CIT(Appeals)",
        "ITAT Appellate Briefs & legal citations on settled Supreme Court precedents",
        "Stay of Demand petitions & Section 220(6) recovery suspension",
      ],
      targetAudience: "Corporates, Promoters, HNIs facing income tax department scrutiny",
      statutoryStat: "99.8% Notice Settlement & Penalty Mitigation",
    },
    {
      id: "gst-defense",
      icon: FileSpreadsheet,
      title: "GST Defense, Audits & ITC Protection",
      tagline: "DRC-01 SCN Defense • GSTR-9/9C • Section 16(4) ITC Recovery",
      description: "Shielding your business against GST audit demands, supplier non-compliance penalties, and aggressive ITC reversals through empirical 2B reconciliations.",
      deliverables: [
        "Representation against DRC-01, DRC-01A, and ASMT-10 notices",
        "Algorithmic GSTR-2B vs 3B invoice-level automated cross-matching",
        "Annual Return GSTR-9 and Reconciliation Statement GSTR-9C certification",
        "Defense against Section 16(4) and Rule 86B credit blockages",
        "Export GST refund sanction (LUT & IGST with payment)",
      ],
      targetAudience: "Manufacturing units, Wholesale Distributors, EPC Contractors, Exporters",
      statutoryStat: "Saved ₹12+ Cr in Disputed GST Demands",
    },
    {
      id: "virtual-cfo",
      icon: TrendingUp,
      title: "Virtual CFO & Working Capital Engineering",
      tagline: "CMA Data for Banks • CC Limits • Monthly MIS • Cashflow",
      description: "Senior strategic financial leadership without full-time executive overhead. We optimize working capital, prepare bankable CMA reports, and steer profitability.",
      deliverables: [
        "Bank CMA Data preparation for CC limit sanction, enhancement & renewal",
        "Monthly Director MIS (Gross Margins, Working Capital Cycle, EBITDA)",
        "13-Week Dynamic Cashflow forecasting to eliminate liquidity crunches",
        "Financial modeling for debt syndication & institutional term loans",
        "Cost-center optimization and product-wise contribution analysis",
      ],
      targetAudience: "Growing enterprises (₹10 Cr to ₹250 Cr turnover) seeking strategic scale",
      statutoryStat: "Over ₹450 Cr in Working Capital Limits Facilitated",
    },
    {
      id: "msme-43bh",
      icon: ShieldCheck,
      title: "MSME 43B(h) Sentinel & Payment Shield",
      tagline: "15/45-Day Payment Rule • Disallowance Shield • MSME Samadhaan",
      description: "Prevent catastrophic income tax additions under Section 43B(h). We categorize supplier micro/small registrations and ensure 100% tax deduction eligibility.",
      deliverables: [
        "Automated vendor Udyam classification (Micro vs Small vs Medium)",
        "15-Day (No Agreement) & 45-Day (Written Agreement) aging audit",
        "Identification of year-end disallowances under Section 43B(h)",
        "Drafting compliant Bilateral Supplier Payment Agreements",
        "Recovery assistance under MSME Samadhaan statutory forum",
      ],
      targetAudience: "Manufacturers, Traders, and Corporates purchasing from MSME suppliers",
      statutoryStat: "Zero 43B(h) Disallowances for Retained Clients",
    },
    {
      id: "company-law",
      icon: FileCheck2,
      title: "Company Law, ROC & Corporate Governance",
      tagline: "Pvt Ltd / LLP • Annual ROC Filings • Director KYC • Board Governance",
      description: "Flawless secretarial hygiene under MCA V3 portal. We ensure complete compliance with the Companies Act 2013 and protect directors from disqualification.",
      deliverables: [
        "Fast-track Private Limited, Public Limited & LLP incorporation (SPICe+)",
        "Annual MCA ROC Filings: AOC-4 (Financials) and MGT-7 (Annual Return)",
        "Director KYC (DIR-3 KYC) and DPT-3 (Return of Deposits) annual compliance",
        "Board Minutes, Special Resolutions & Statutory Registers maintenance",
        "Allotment of Shares, Rights Issues, Private Placements (PAS-3)",
      ],
      targetAudience: "All registered Companies and LLPs in India",
      statutoryStat: "100% On-Time MCA V3 Filing Success",
    },
    {
      id: "cross-border-fema",
      icon: Globe2,
      title: "Cross-Border, FEMA & NRI Taxation Desk",
      tagline: "Form 15CA & 15CB • DTAA Relief • Section 195 TDS • Inward FDI",
      description: "Navigating international tax treaties, outward foreign remittances, RBI FEMA reporting, and specialized non-resident Indian property/capital gains structuring.",
      deliverables: [
        "Issuance of Form 15CB Chartered Accountant certificates & Form 15CA filing",
        "DTAA Double Taxation Avoidance Agreement relief & Foreign Tax Credit (FTC)",
        "Section 195 Lower/Nil TDS deduction certificates before Income Tax Officers",
        "Inward Foreign Direct Investment (FC-GPR) & Outward FDI reporting with RBI",
        "NRI Real Estate Capital Gains repatriation (NRO to NRE account transfer)",
      ],
      targetAudience: "Exporters, Software/SaaS companies, NRIs selling Indian property, Importers",
      statutoryStat: "Turnaround within 4 Hours for Urgent 15CBs",
    },
    {
      id: "startup-desk",
      icon: Rocket,
      title: "Startup Desk, 80-IAC & Angel Tax Desk",
      tagline: "DPIIT Recognition • 80-IAC Tax Holiday • Sec 56(2) Valuation • ESOPs",
      description: "Full-stack institutional advisory for early and growth-stage startups. We handle startup tax holidays, cap table compliance, and investor due diligence.",
      deliverables: [
        "DPIIT Startup Recognition & Section 80-IAC 3-year 100% Tax Holiday filing",
        "Section 56(2)(viib) Angel Tax Exemption & Rule 11UA DCF Valuation Reports",
        "Convertible Notes, Compulsorily Convertible Debentures (CCDs) structuring",
        "ESOP Scheme design, vesting schedules, and fair market value computations",
        "Vendor & Financial Due Diligence preparation for Angel/Seed/Series-A rounds",
      ],
      targetAudience: "Tech Startups, D2C Brands, DeepTech & SaaS Founders",
      statutoryStat: "Guided 65+ Startups through Institutional Due Diligence",
    },
  ];

  const active = practices[selectedCategory];

  return (
    <section id="practice-areas" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3">
            <span>Specialized Practice Verticals</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Institutional Audit, Taxation &amp; CFO Counsel
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Every business lifecycle phase demands uncompromising technical precision. Select a practice area to review our statutory scope and client deliverables.
          </p>
        </div>

        {/* Practice Selection Grid / Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-8">
          {practices.map((p, idx) => {
            const Icon = p.icon;
            const isSelected = selectedCategory === idx;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedCategory(idx)}
                className={`p-3 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-red-500/20"
                    : "bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200/90"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-btred-600 text-white" : "bg-white text-btred-600 border border-slate-200"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold line-clamp-1 ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {p.title}
                  </div>
                  <div className={`text-[10px] mt-0.5 truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {p.tagline.split("•")[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Practice Detailed Showcase Card */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-red-50/20 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 7 Columns: Details, Deliverables & Scope */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold">
                <span>{active.tagline}</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {active.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {active.description}
                </p>
              </div>

              {/* Deliverables List */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Key Engagement Deliverables:
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {active.deliverables.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Profile & Statutory Assurance */}
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Primary Audience: </span>
                  <span className="text-slate-800 font-bold">{active.targetAudience}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenBooking(active.title)}
                  className="px-6 py-3 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Consult Partner on {active.title.split(" ")[0]} {active.title.split(" ")[1]}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/917999995897?text=${encodeURIComponent(`Hello CA Gunjan Jain, I would like to inquire about your services for: ${active.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Quick WhatsApp Query</span>
                </a>
              </div>
            </div>

            {/* Right 5 Columns: Visual Assurance Box */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-btred-600 flex items-center justify-center font-bold">
                  {React.createElement(active.icon, { className: "w-5 h-5" })}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Practice Performance Metric</div>
                  <div className="text-sm font-extrabold text-btred-600">{active.statutoryStat}</div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ICAI Audit Trail &amp; Peer-Review</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Every working paper, lead schedule, and UDIN is archived in adherence with SA 230 (Audit Documentation) and peer-review mandates.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-btred-600" />
                    <span>24/7 Digital Docket Delivery</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Audited signed statements, tax computation sheets, and acknowledgments are immediately dispatched to your secure Client Portal.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/70 text-[11px] text-amber-900">
                <strong>Statutory Note:</strong> Compliance with Chartered Accountants Act, 1949 and relevant ICAI ethical standards maintained across all engagements.
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
