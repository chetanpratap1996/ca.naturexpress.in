"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BtLogo } from "@/components/shared/BtLogo";
import { 
  Phone, 
  MapPin, 
  KeyRound, 
  Calendar, 
  Menu, 
  X, 
  ShieldCheck, 
  Star, 
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Building2,
  Lock
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaLandingNavProps {
  onOpenBooking: (service?: string) => void;
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
  onEnterSandbox: (role: "partner" | "article" | "client") => void;
}

export const CaLandingNav: React.FC<CaLandingNavProps> = ({
  onOpenBooking,
  onOpenLogin,
  onEnterSandbox,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  return (
    <>
      {/* 1. Top Executive Regulatory Bar (Crisp Light Mode - Strict No Dark Blue/Black Background) */}
      <div className="bg-slate-50 border-b border-slate-200/90 text-[11px] px-3 sm:px-8 py-2 text-slate-700">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Firm Credentials & ICAI Seal */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {DEFAULT_FIRM_BRANDING.firmName}
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="font-semibold text-slate-600 hidden md:inline">
              ICAI FRN: <span className="text-slate-900 font-bold">{DEFAULT_FIRM_BRANDING.frn}</span>
            </span>
            <span className="text-slate-300 hidden md:inline">|</span>
            <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>4.9★ Google Verified Practice</span>
            </span>
          </div>

          {/* Right: Partner Direct Hotline & Quick Links */}
          <div className="flex items-center gap-4 text-xs">
            <a
              href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
              className="hidden lg:flex items-center gap-1.5 font-bold text-slate-800 hover:text-btred-600 transition"
            >
              <Phone className="w-3.5 h-3.5 text-btred-600" />
              <span>Partner Desk: {DEFAULT_FIRM_BRANDING.partnerPhone}</span>
            </a>

            <a
              href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I would like to inquire regarding corporate audit & tax advisory services for our firm.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct WhatsApp</span>
            </a>

            <button
              onClick={() => onOpenLogin("client")}
              className="text-btred-600 hover:text-btred-700 font-extrabold flex items-center gap-1 border-l border-slate-200 pl-3 transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Client Portal Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Executive Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <Link href="/brainsandtaxes" className="flex items-center gap-3 group">
            <BtLogo size="sm" showTagline={false} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-btred-600 transition">
                  Brains &amp; Taxes
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-btred-600 border border-red-200">
                  CA Firm
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold truncate max-w-[200px] sm:max-w-none">
                GPA &amp; Co., Chartered Accountants • Peer Review Certified
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-bold text-slate-700">
            <a href="#practice-areas" className="hover:text-btred-600 transition">
              Practice Areas
            </a>
            <a href="#local-authority" className="hover:text-btred-600 transition">
              Indore Office &amp; Map
            </a>
            <a href="#health-check" className="hover:text-btred-600 transition">
              Audit &amp; Risk Check
            </a>
            <a href="#digital-advantage" className="hover:text-btred-600 transition">
              24/7 Digital Vault
            </a>
            <a href="#case-studies" className="hover:text-btred-600 transition">
              Proven Case Wins
            </a>
            <a href="#senior-partner" className="hover:text-btred-600 transition">
              Managing Partner
            </a>
            <a href="#tax-deadlines" className="hover:text-btred-600 transition">
              Statutory Calendar
            </a>
            <a href="#faqs" className="hover:text-btred-600 transition">
              FAQs
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Consultation Booking Button */}
            <button
              onClick={() => onOpenBooking()}
              className="bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm hover:shadow transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Book Strategic Consultation</span>
              <span className="sm:hidden">Consultation</span>
            </button>

            {/* Client Portal & Portal Switch Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                className="bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">Sign In</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {loginDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn"
                  onMouseLeave={() => setLoginDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Secure Portals Access
                  </div>
                  <button
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onOpenLogin("client");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-red-50 hover:text-btred-600 transition flex items-center justify-between"
                  >
                    <span>Client Portal (24/7 Vault)</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-extrabold">Instant</span>
                  </button>
                  <button
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onOpenLogin("partner");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Senior Partner Cockpit
                  </button>
                  <button
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onOpenLogin("article");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Staff &amp; Article Workbench
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setLoginDropdownOpen(false);
                      onEnterSandbox("client");
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-btred-600 hover:bg-red-50 transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test-Drive Demo Portal</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 pt-3 border-t border-slate-200 space-y-2 animate-fadeIn pb-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
              <a
                href="#practice-areas"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                Practice Areas
              </a>
              <a
                href="#local-authority"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                Indore Office &amp; Map
              </a>
              <a
                href="#health-check"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                Audit Health Check
              </a>
              <a
                href="#digital-advantage"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                24/7 Digital Vault
              </a>
              <a
                href="#case-studies"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                Proven Case Wins
              </a>
              <a
                href="#senior-partner"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                Managing Partner
              </a>
              <a
                href="#tax-deadlines"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                Tax Deadlines
              </a>
              <a
                href="#faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
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
                className="w-full py-2.5 rounded-xl bg-btred-600 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book In-Office / Virtual Consultation</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
                  className="py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 bg-white"
                >
                  <Phone className="w-3.5 h-3.5 text-btred-600" />
                  <span>Call Office</span>
                </a>
                <a
                  href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5"
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
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Client Portal Login (Existing Clients)</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
