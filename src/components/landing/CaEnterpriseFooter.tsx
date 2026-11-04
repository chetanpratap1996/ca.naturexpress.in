"use client";

import React from "react";
import Link from "next/link";
import { BtLogo } from "@/components/shared/BtLogo";
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Lock, 
  ExternalLink, 
  Award,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaEnterpriseFooterProps {
  onOpenBooking: () => void;
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
  onEnterSandbox: (role: "partner" | "article" | "client") => void;
}

export const CaEnterpriseFooter: React.FC<CaEnterpriseFooterProps> = ({
  onOpenBooking,
  onOpenLogin,
  onEnterSandbox,
}) => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/90 text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Column 1: Firm Identity & Accreditation (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/brainsandtaxes" className="flex items-center gap-3">
              <BtLogo size="sm" showTagline={false} />
              <div>
                <span className="text-base font-black text-slate-900 tracking-tight">
                  Brains &amp; Taxes
                </span>
                <span className="block text-[11px] text-slate-500 font-semibold">
                  {DEFAULT_FIRM_BRANDING.firmName}
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-600 leading-relaxed">
              Chartered Accountancy and corporate tax advisory practice serving Indian businesses, promoters, and high-growth enterprises with institutional statutory integrity.
            </p>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 font-medium">ICAI FRN: </span>
                <span className="text-slate-900 font-bold">{DEFAULT_FIRM_BRANDING.frn}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Peer Review Cert: </span>
                <span className="text-slate-900 font-bold">{DEFAULT_FIRM_BRANDING.peerReviewNo}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Corporate CIN: </span>
                <span className="text-slate-900 font-bold">{DEFAULT_FIRM_BRANDING.cin}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Practice Verticals (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900">
              Practice Disciplines
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition">
                  Corporate Statutory &amp; Tax Audit
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition">
                  Income Tax Scrutiny &amp; CIT(A) Appeals
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition">
                  GST Audit &amp; DRC-01 SCN Defense
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition">
                  Virtual CFO &amp; Bank CMA Reports
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition">
                  MSME Section 43B(h) Audit Sentinel
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition">
                  Form 15CA/CB &amp; Cross-Border FEMA
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition">
                  Startup 80-IAC &amp; Angel Tax Valuation
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Secure Portals & Access (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900">
              Client &amp; Staff Desk
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenLogin("client")}
                  className="hover:text-btred-600 font-bold text-slate-800 transition flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-btred-600" />
                  <span>Client Portal</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLogin("partner")}
                  className="hover:text-slate-900 transition text-slate-600"
                >
                  Partner Cockpit
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLogin("article")}
                  className="hover:text-slate-900 transition text-slate-600"
                >
                  Article Workbench
                </button>
              </li>
              <li>
                <button
                  onClick={() => onEnterSandbox("client")}
                  className="hover:text-btred-600 text-btred-600 font-bold transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Demo Sandbox</span>
                </button>
              </li>
              <li>
                <a href="#tax-deadlines" className="hover:text-slate-900 transition text-slate-600">
                  Tax Calendar
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Head Office & Contact (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900">
              Indore Practice Office
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-btred-600 flex-shrink-0 mt-0.5" />
                <span>{DEFAULT_FIRM_BRANDING.headOffice}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <a
                  href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
                  className="hover:text-btred-600 font-semibold transition"
                >
                  {DEFAULT_FIRM_BRANDING.partnerPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <a
                  href={`mailto:${DEFAULT_FIRM_BRANDING.email}`}
                  className="hover:text-btred-600 transition"
                >
                  {DEFAULT_FIRM_BRANDING.email}
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenBooking}
                className="w-full py-2.5 px-4 rounded-xl bg-btred-600 hover:bg-btred-700 text-white font-bold text-xs shadow-sm transition"
              >
                Schedule Consultation
              </button>
            </div>
          </div>

        </div>

        {/* Regulatory Statutory ICAI Disclaimer */}
        <div className="border-t border-slate-200 pt-8 pb-6 text-[11px] text-slate-500 leading-relaxed space-y-2">
          <div className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ICAI Regulatory Compliance Disclaimer</span>
          </div>
          <p>
            As per the rules and guidelines laid down by the Institute of Chartered Accountants of India (ICAI) and the Chartered Accountants Act, 1949, Chartered Accountants and audit firms are not permitted to solicit work or advertise in any form. This website is purely intended to provide public information regarding the professional credentials, practice areas, and technological infrastructure of GPA &amp; Co., Chartered Accountants and Brains &amp; Taxes.
          </p>
          <p>
            Any visitor accessing this platform does so voluntarily for their personal information and knowledge. The material contained herein does not constitute legal or professional advice. Transmission, receipt, or use of this portal does not create any client-auditor relationship.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Brand */}
        <div className="border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {DEFAULT_FIRM_BRANDING.firmName} &bull; Brains &amp; Taxes. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-slate-400">Head Office: Indore, MP</span>
            <span>&bull;</span>
            <span className="text-slate-400">ICAI FRN: {DEFAULT_FIRM_BRANDING.frn}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
