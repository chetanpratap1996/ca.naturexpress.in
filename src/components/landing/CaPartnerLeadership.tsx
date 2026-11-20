"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Award, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Calendar, 
  Building2,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Landmark,
  Scale,
  Briefcase,
  Copy,
  Check
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaPartnerLeadershipProps {
  onOpenBooking: () => void;
}

export const CaPartnerLeadership: React.FC<CaPartnerLeadershipProps> = ({
  onOpenBooking,
}) => {
  const [activeTab, setActiveTab] = useState<"philosophy" | "credentials" | "track_record">("philosophy");
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(DEFAULT_FIRM_BRANDING.partnerPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <section id="senior-partner" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-slate-200/90 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3 shadow-2xs">
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>Senior Leadership &bull; Practice Governance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Two Decades of Corporate Audit Integrity &amp; Litigation Defense
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Directly steered by Senior Managing Partner <strong>CA Gunjan Jain (FCA)</strong>, anchoring boardroom fiduciary advisory, high-stakes tax defense, and multi-state statutory audits.
          </p>
        </div>

        {/* Master Executive Card */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-red-50/20 rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200 shadow-xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left 4 Columns: Executive Portrait & Live Status Badge */}
            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-5">
              
              {/* Photo Showcase with Motion & Prestige Glow */}
              <div className="relative group">
                
                {/* Ambient Shimmer / Glow Ring */}
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-btred-600 via-amber-500 to-red-500 rounded-[2.5rem] blur-sm opacity-60 group-hover:opacity-100 transition duration-700 animate-glow" />

                {/* Portrait Container */}
                <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-[2.25rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 transition-all duration-500 group-hover:scale-[1.02]">
                  <Image
                    src="/images/ca-gunjan-jain.png"
                    alt="CA Gunjan Jain, FCA - Managing Partner GPA & Co. / Brains & Taxes"
                    fill
                    sizes="(max-width: 768px) 208px, 240px"
                    priority
                    className="object-cover object-top filter brightness-[1.02] contrast-[1.03] transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Subtle Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-500/20 via-transparent to-transparent opacity-40" />

                  {/* Overlaid Title on Image Bottom */}
                  <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 drop-shadow-sm bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200">
                      CA Gunjan Jain, FCA
                    </span>
                  </div>
                </div>

                {/* Floating ICAI Verified Shield (Top Left) */}
                <div className="absolute -top-2 -left-2 bg-white text-amber-600 p-2.5 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-1.5 animate-float">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-900 pr-1">FCA &bull; ICAI</span>
                </div>

                {/* Floating Live Status Pill (Bottom Right) */}
                <div className="absolute -bottom-2 -right-2 bg-white text-slate-800 px-3 py-1.5 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black tracking-tight text-slate-900">In Office &bull; Indore</span>
                </div>
              </div>

              {/* Partner Name & Titles */}
              <div className="pt-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {DEFAULT_FIRM_BRANDING.managingPartner}
                </h3>
                <p className="text-xs font-black text-btred-600 uppercase tracking-widest mt-1">
                  Senior Managing Partner &bull; Lead Auditor
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  GPA &amp; Co., Chartered Accountants &bull; FRN: {DEFAULT_FIRM_BRANDING.frn}
                </p>
              </div>

              {/* Verified Credential Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                  Fellow CA (ICAI)
                </span>
                <span className="text-[11px] font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-200/80 shadow-2xs">
                  Peer Review Board Certified
                </span>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200/80 shadow-2xs">
                  20+ Yrs Practice
                </span>
              </div>

              {/* Quick Contact Micro-Card */}
              <div className="w-full bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-medium">Direct Telephone:</span>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
                      className="font-bold text-slate-900 hover:text-btred-600 transition"
                    >
                      {DEFAULT_FIRM_BRANDING.partnerPhone}
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      title="Copy Phone Number"
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                    >
                      {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500 text-[11px] font-medium">Head Office Suite:</span>
                  <span className="font-bold text-slate-800 text-[11px]">NM Verge, Y.N. Road, Indore</span>
                </div>
              </div>

            </div>

            {/* Right 8 Columns: Interactive Tabbed Dossier */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Tab Selector Buttons */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("philosophy")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === "philosophy"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${activeTab === "philosophy" ? "text-btred-600" : "text-slate-400"}`} />
                  <span>Advisory Philosophy &amp; Vision</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("credentials")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === "credentials"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === "credentials" ? "text-btred-600" : "text-slate-400"}`} />
                  <span>ICAI Credentials &amp; Standing</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("track_record")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === "track_record"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Scale className={`w-3.5 h-3.5 ${activeTab === "track_record" ? "text-btred-600" : "text-slate-400"}`} />
                  <span>Landmark Appellate Outcomes</span>
                </button>
              </div>

              {/* Tab 1: Philosophy & Vision */}
              {activeTab === "philosophy" && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Executive Quote Card */}
                  <blockquote className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-red-50/80 via-white to-amber-50/40 border border-red-200/80 shadow-xs">
                    <span className="text-4xl text-btred-300 font-serif absolute top-2 left-3 leading-none select-none">
                      &ldquo;
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 italic font-medium leading-relaxed pl-5">
                      An audit is not a stressful bureaucratic rubber-stamp. When conducted with rigor and foresight, it is the promoter’s strongest armor against tax harassment, the company’s passport to institutional bank capital, and the foundation of enterprise value.
                    </p>
                    <div className="mt-3 text-right">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                        &mdash; CA Gunjan Jain, FCA
                      </span>
                    </div>
                  </blockquote>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    As Managing Partner of <strong>GPA &amp; Co.</strong> and founder of <strong>Brains &amp; Taxes</strong>, CA Gunjan Jain has represented Indian corporate leaders, industrial manufacturing units, and prominent family offices across Central India, Mumbai, and New Delhi. His practice focuses on high-stakes Income Tax faceless appeals, statutory audit under the Companies Act 2013, GST litigation before appellate authorities, and corporate financial structuring.
                  </p>

                  {/* 4 Pillars of Leadership */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 mb-1">
                        <Scale className="w-4 h-4 text-btred-600 shrink-0" />
                        <span>Faceless Appellate Defense</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Factual paper-books and rigorous legal precedent submissions before NFAC, CIT(A), and ITAT benches.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 mb-1">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>CARO 2020 Statutory Audits</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Institutional-grade financial reporting certified under Ind AS and Companies Act 2013.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Section 43B(h) MSME Safeguards</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Vendor ledger categorization systems to prevent unexpected corporate tax shocks and 20.25% penal interest.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 mb-1">
                        <Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Cross-Border Tax &amp; Form 15CB</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        International outbound remittances, Double Taxation Avoidance Agreements (DTAA), and transfer pricing defense.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 2: Credentials & Standing */}
              {activeTab === "credentials" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                      <div className="text-2xl font-black text-slate-900">20+</div>
                      <div className="text-[11px] font-bold text-slate-600 uppercase mt-0.5">Years Experience</div>
                      <span className="text-[10px] text-slate-400">Post-FCA Qualification</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                      <div className="text-2xl font-black text-btred-600">₹1,400+ Cr</div>
                      <div className="text-[11px] font-bold text-slate-600 uppercase mt-0.5">Audited Portfolio</div>
                      <span className="text-[10px] text-slate-400">Mid-Market &amp; Corporate</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-center col-span-2 sm:col-span-1">
                      <div className="text-2xl font-black text-emerald-600">99.8%</div>
                      <div className="text-[11px] font-bold text-slate-600 uppercase mt-0.5">Appellate Track Record</div>
                      <span className="text-[10px] text-slate-400">Direct &amp; Indirect Tax</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-btred-600" />
                      <span>ICAI Professional Certifications &amp; Institutional Compliance</span>
                    </h4>
                    
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Fellow Chartered Accountant (FCA):</strong> Conferred by The Institute of Chartered Accountants of India.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Peer Review Board Certified:</strong> GPA &amp; Co. maintains active unconditional Peer Review Certificate under ICAI guidelines.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Unique Document Identification Number (UDIN):</strong> 100% statutory certifications cryptographically authenticated on ICAI portal.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Code of Ethics (2020 Edition):</strong> Strict adherence to Council Guidelines on objectivity, confidentiality, and professional competence.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 3: Landmark Scrutiny Outcomes */}
              {activeTab === "track_record" && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-btred-600 bg-red-50 px-2 py-0.5 rounded">
                        GST Appellate Authority
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">₹36.00 Lakhs Relief</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Industrial Engineering DRC-01 Show-Cause Notice Defense
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Reconciled GSTR-2B vs GSTR-3B supplier defaults with Section 16(2) proof-of-delivery workpapers. Successfully prevented proposed cancellation of GST registration and penalty.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Income Tax Section 148 Reopening
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">Full Notice Dismissal</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Corporate Real Estate Developer Reopening Defense
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Defended corporate assessee against arbitrary reopening notices by demonstrating tangible lack of escapement of income and complete audit disclosure in original return.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Consortium Debt Syndication
                      </span>
                      <span className="text-[11px] font-bold text-slate-900">₹120.00 Cr Sanctioned</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Public Sector &amp; Private Bank Working Capital Renewal
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Formulated audited financial models, DSCR assessments, and stock audit substantiations, enabling rapid bank credit approval without collateral discounts.
                    </p>
                  </div>
                </div>
              )}

              {/* Direct Partner Action Hub */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 group"
                  >
                    <Calendar className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
                    <span>Book Private Session with CA Gunjan Jain</span>
                  </button>

                  <a
                    href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I would like to schedule a confidential discussion regarding our company accounts and audit.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct WhatsApp</span>
                  </a>
                </div>

                <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Immediate response for corporate directors</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
