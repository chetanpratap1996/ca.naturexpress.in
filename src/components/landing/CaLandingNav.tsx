"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BtLogo } from "@/components/shared/BtLogo";
import { 
  Phone, 
  KeyRound, 
  Calendar, 
  Menu, 
  X, 
  Star, 
  MessageSquare,
  ChevronDown,
  Lock,
  Building2,
  Users,
  ShieldCheck
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaLandingNavProps {
  onOpenBooking: (service?: string) => void;
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
}

export const CaLandingNav: React.FC<CaLandingNavProps> = ({
  onOpenBooking,
  onOpenLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* 1. Top Executive Regulatory Bar */}
      <div className="bg-slate-50 border-b border-slate-200 text-[11px] px-4 sm:px-8 py-2 text-slate-700">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
          {/* Left: Firm Credentials & ICAI Accreditation */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>{DEFAULT_FIRM_BRANDING.firmName}</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="font-semibold text-slate-600 hidden md:inline">
              ICAI FRN: <span className="text-slate-900 font-bold">{DEFAULT_FIRM_BRANDING.frn}</span>
            </span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="bg-amber-50 text-amber-900 border border-amber-200/90 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
              <span>4.9★ Google Verified Practice</span>
            </span>
          </div>

          {/* Right: Partner Desk Hotline & Direct Actions */}
          <div className="flex items-center gap-4 text-xs">
            <a
              href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
              className="hidden lg:inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-btred-600 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-btred-600 shrink-0" />
              <span>Partner Desk: {DEFAULT_FIRM_BRANDING.partnerPhone}</span>
            </a>

            <a
              href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I would like to inquire regarding corporate audit & tax advisory services for our firm.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Direct WhatsApp</span>
            </a>

            <button
              onClick={() => onOpenLogin("client")}
              className="text-btred-600 hover:text-btred-700 font-extrabold inline-flex items-center gap-1 border-l border-slate-200 pl-3 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Client Portal Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Executive Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 h-18 sm:h-20">
          
          {/* Logo & Brand Identity */}
          <Link href="/brainsandtaxes" className="flex items-center gap-3 group shrink-0 py-2">
            <BtLogo size="sm" showTagline={false} />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-btred-600 transition-colors">
                  Brains &amp; Taxes
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-btred-600 border border-red-200 shrink-0">
                  CA Firm
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate max-w-[200px] sm:max-w-none">
                GPA &amp; Co., Chartered Accountants &bull; Peer Review Certified
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Properly spaced, single line, no ugly line wraps) */}
          <nav className="hidden xl:flex items-center gap-4 2xl:gap-6 text-xs font-bold text-slate-700">
            <a 
              href="#practice-areas" 
              className="whitespace-nowrap hover:text-btred-600 transition-colors py-2"
            >
              Practice Areas
            </a>
            <a 
              href="#local-authority" 
              className="whitespace-nowrap hover:text-btred-600 transition-colors py-2"
            >
              Indore Office
            </a>
            <a 
              href="#health-check" 
              className="whitespace-nowrap hover:text-btred-600 transition-colors py-2"
            >
              Audit &amp; Risk Check
            </a>
            <a 
              href="#digital-advantage" 
              className="whitespace-nowrap hover:text-btred-600 transition-colors py-2"
            >
              24/7 Digital Vault
            </a>
            <a 
              href="#case-studies" 
              className="whitespace-nowrap hover:text-btred-600 transition-colors py-2"
            >
              Proven Case Wins
            </a>
            <a 
              href="#senior-partner" 
              className="whitespace-nowrap hover:text-btred-600 transition-colors py-2"
            >
              Managing Partner
            </a>
            <a 
              href="#tax-deadlines" 
              className="whitespace-nowrap hover:text-btred-600 transition-colors py-2"
            >
              Statutory Calendar
            </a>
            <a 
              href="#faqs" 
              className="whitespace-nowrap hover:text-btred-600 transition-colors py-2"
            >
              FAQs
            </a>
          </nav>

          {/* Action Buttons (Perfect height match: h-10, perfectly centered and balanced) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Consultation Booking Button */}
            <button
              onClick={() => onOpenBooking()}
              className="h-10 bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold px-3.5 sm:px-4 rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Book Strategic Consultation</span>
              <span className="sm:hidden">Consultation</span>
            </button>

            {/* Client Portal & Portal Switch Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                className="h-10 bg-slate-100 hover:bg-slate-200/90 text-slate-800 text-xs font-bold px-3 sm:px-4 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                aria-expanded={loginDropdownOpen}
                aria-haspopup="true"
              >
                <Lock className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span>Sign In</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${loginDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {loginDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn"
                >
                  <div className="px-4 py-1.5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Official Portals &bull; GPA &amp; Co.
                  </div>
                  
                  {/* Real Client Portal Option */}
                  <button
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onOpenLogin("client");
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>Client Portal</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase">24/7 Vault</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Audit reports, ITRs, 3CD &amp; 43B(h)
                      </div>
                    </div>
                  </button>

                  {/* Senior Partner Cockpit */}
                  <button
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onOpenLogin("partner");
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-btred-600 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        Senior Partner Cockpit
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        CA Gunjan Jain &amp; Partners
                      </div>
                    </div>
                  </button>

                  {/* Staff & Article Workbench */}
                  <button
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onOpenLogin("article");
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        Staff &amp; Article Desk
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Statutory audit workpapers &amp; filings
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-200 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
              <a
                href="#practice-areas"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Practice Areas
              </a>
              <a
                href="#local-authority"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Indore Office &amp; Map
              </a>
              <a
                href="#health-check"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Audit Health Check
              </a>
              <a
                href="#digital-advantage"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                24/7 Digital Vault
              </a>
              <a
                href="#case-studies"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Proven Case Wins
              </a>
              <a
                href="#senior-partner"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Managing Partner
              </a>
              <a
                href="#tax-deadlines"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Tax Deadlines
              </a>
              <a
                href="#faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Client FAQs
              </a>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full h-11 rounded-xl bg-btred-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>Book In-Office / Virtual Consultation</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
                  className="h-10 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 bg-white"
                >
                  <Phone className="w-3.5 h-3.5 text-btred-600" />
                  <span>Call Office</span>
                </a>
                <a
                  href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin("client");
                }}
                className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>Client Portal Login (Existing Clients)</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
