"use client";

import React from "react";
import { 
  Award, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Calendar, 
  Building2,
  FileText
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaPartnerLeadershipProps {
  onOpenBooking: () => void;
}

export const CaPartnerLeadership: React.FC<CaPartnerLeadershipProps> = ({
  onOpenBooking,
}) => {
  return (
    <section id="senior-partner" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-50 via-white to-red-50/20 rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left 4 Columns: Partner Identity & Avatar Card */}
            <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                {/* Executive Avatar Crest */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex flex-col items-center justify-center shadow-xl border-4 border-white">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                    GJ
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-btred-400 mt-1">
                    FCA • Partner
                  </span>
                </div>

                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2 rounded-xl shadow-md border-2 border-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {DEFAULT_FIRM_BRANDING.managingPartner}
                </h3>
                <p className="text-xs font-bold text-btred-600 uppercase tracking-wider mt-0.5">
                  Managing Partner &amp; Lead Auditor
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  GPA &amp; Co., Chartered Accountants (FRN: {DEFAULT_FIRM_BRANDING.frn})
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200">
                  FCA (ICAI)
                </span>
                <span className="text-[11px] font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                  Peer Review Board
                </span>
              </div>
            </div>

            {/* Right 8 Columns: Biography, Philosophy & Direct Line */}
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>Senior Leadership &amp; Practice Governance</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Two Decades of Corporate Audit Integrity &amp; Litigation Defense
              </h2>

              <blockquote className="border-l-4 border-btred-600 pl-4 text-xs sm:text-sm text-slate-700 italic font-medium leading-relaxed bg-slate-50/70 p-3 rounded-r-xl">
                &ldquo;An audit is not a stressful bureaucratic rubber-stamp. When conducted with rigor and foresight, it is the promoter’s strongest armor against tax harassment, the company’s passport to institutional bank capital, and the foundation of enterprise value.&rdquo;
              </blockquote>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                As Managing Partner of <strong>GPA &amp; Co.</strong> and founder of <strong>Brains &amp; Taxes</strong>, CA Gunjan Jain has represented Indian corporate leaders, industrial manufacturing units, and prominent family offices across Central India, Mumbai, and New Delhi. His practice focuses on high-stakes Income Tax faceless appeals, statutory audit under the Companies Act 2013, GST litigation before appellate authorities, and corporate financial structuring.
              </p>

              {/* Direct Partner Action Hub */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={onOpenBooking}
                    className="px-5 py-2.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Private Session with CA Gunjan Jain</span>
                  </button>

                  <a
                    href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I would like to schedule a confidential discussion regarding our company accounts and audit.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct WhatsApp</span>
                  </a>
                </div>

                <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{DEFAULT_FIRM_BRANDING.partnerPhone}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
