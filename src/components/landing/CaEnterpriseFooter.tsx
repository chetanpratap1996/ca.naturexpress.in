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
  MessageSquare
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaEnterpriseFooterProps {
  onOpenBooking: (serviceName?: string) => void;
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
}

export const CaEnterpriseFooter: React.FC<CaEnterpriseFooterProps> = ({
  onOpenBooking,
  onOpenLogin,
}) => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-700 font-sans">
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
                <a href="#practice-areas" className="hover:text-btred-600 transition-colors">
                  Corporate Statutory &amp; Tax Audit
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition-colors">
                  Income Tax Scrutiny &amp; CIT(A) Appeals
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition-colors">
                  GST Audit &amp; DRC-01 SCN Defense
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition-colors">
                  Virtual CFO &amp; Bank CMA Reports
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition-colors">
                  MSME Section 43B(h) Audit &amp; Compliance
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition-colors">
                  Form 15CA/CB &amp; Cross-Border FEMA
                </a>
              </li>
              <li>
                <a href="#practice-areas" className="hover:text-btred-600 transition-colors">
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
                  className="hover:text-btred-600 font-bold text-slate-800 transition-colors flex items-center gap-1.5 text-left"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Client Portal (24/7 Vault)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLogin("partner")}
                  className="hover:text-slate-900 transition-colors text-slate-600 text-left"
                >
                  Partner Cockpit
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLogin("article")}
                  className="hover:text-slate-900 transition-colors text-slate-600 text-left"
                >
                  Article Workbench
                </button>
              </li>
              <li>
                <a href="#tax-deadlines" className="hover:text-slate-900 transition-colors text-slate-600">
                  Tax Calendar
                </a>
              </li>
              <li>
                <a href="#health-check" className="hover:text-slate-900 transition-colors text-slate-600">
                  Audit Health Check
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Office Location (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900">
              Indore Practice Headquarters
            </div>
            
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-btred-600 shrink-0 mt-0.5" />
                <span>{DEFAULT_FIRM_BRANDING.headOffice}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
                  className="hover:text-btred-600 transition-colors font-bold text-slate-900"
                >
                  {DEFAULT_FIRM_BRANDING.partnerPhone}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <a
                  href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-700 transition-colors font-semibold text-emerald-800"
                >
                  WhatsApp: +91 {DEFAULT_FIRM_BRANDING.whatsappNumber}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${DEFAULT_FIRM_BRANDING.email}`}
                  className="hover:text-btred-600 transition-colors font-semibold text-slate-800"
                >
                  {DEFAULT_FIRM_BRANDING.email}
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onOpenBooking()}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Book In-Office Appointment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Regulatory Compliance & ICAI Legal Disclaimer Banner */}
        <div className="pt-8 border-t border-slate-200 text-[11px] text-slate-500 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">
                &copy; {new Date().getFullYear()} GPA &amp; Co., Chartered Accountants. All rights reserved.
              </span>
              <span className="text-slate-300 hidden md:inline">•</span>
              <span>Proprietary Software: Brains &amp; Taxes Practice OS</span>
            </div>

            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <a href="#practice-areas" className="hover:underline">Practice Areas</a>
              <span>•</span>
              <a href="#faqs" className="hover:underline">FAQs</a>
              <span>•</span>
              <a href="#tax-deadlines" className="hover:underline">Statutory Calendar</a>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            <strong>Regulatory Disclaimer:</strong> As per the Chartered Accountants Act, 1949 and regulations framed by the Institute of Chartered Accountants of India (ICAI), this portal is intended solely for informing clients and associates regarding the firm&apos;s capabilities, statutory compliance updates, and digital client services. It is not intended to solicit clients, advertise, or induce work. Access to client vaults is restricted to verified retainers of GPA &amp; Co.
          </p>
        </div>

      </div>
    </footer>
  );
};
