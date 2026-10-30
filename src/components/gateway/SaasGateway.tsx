"use client";

import React, { useState } from "react";
import { BtLogo } from "@/components/shared/BtLogo";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Unlock,
  Smartphone, 
  CheckCircle2, 
  Building2, 
  FileCheck2, 
  QrCode, 
  Users, 
  Clock, 
  KeyRound,
  FileSpreadsheet, 
  TrendingUp, 
  Download, 
  AlertTriangle, 
  Send, 
  Briefcase,
  ShieldAlert,
  CreditCard,
  Layers,
  Zap,
  Check,
  ExternalLink,
  FileText,
  ChevronRight,
  Award,
  Phone
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface SaasGatewayProps {
  onEnterSandbox: (role: "partner" | "article" | "client") => void;
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
}

export const SaasGateway: React.FC<SaasGatewayProps> = ({
  onEnterSandbox,
  onOpenLogin,
}) => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<
    "pay-to-release" | "banker-docket" | "itc-guard" | "msme-clock" | "dsc-vault" | "tally-xml"
  >("pay-to-release");

  const [interactiveUpiPaid, setInteractiveUpiPaid] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-red-500 selection:text-white">
      
      {/* 1. Top Enterprise Ticker Bar (Crisp Light Mode) */}
      <div className="bg-slate-50 border-b border-slate-200/80 text-[11px] px-3 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-slate-600">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="font-extrabold text-slate-800">GPA &amp; Co., Chartered Accountants</span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline font-medium">ICAI FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; Peer-Review Certified Practice</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-emerald-700 font-semibold hidden md:flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure account sign-in</span>
          </span>
          <button
            onClick={() => onOpenLogin()}
            className="text-btred-logo hover:text-red-700 font-bold flex items-center gap-1 transition text-xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Portal Login &rarr;</span>
          </button>
        </div>
      </div>

      {/* 2. Main SaaS Header Navbar (Clean White with Subtle Shadow) */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BtLogo size="sm" showTagline={false} />
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-xs font-bold text-slate-800">
                GPA &amp; Co. CA Operating System
              </span>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hidden lg:inline">
                Supabase Live Cloud DB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Subtle Pitch / Sandbox Button */}
            <button
              onClick={() => onEnterSandbox("partner")}
              className="text-xs text-slate-600 hover:text-slate-900 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pitch Preview</span>
            </button>

            {/* The Main High-Contrast Sign In Button */}
            <button
              onClick={() => onOpenLogin()}
              className="bg-btred-logo hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-800" />
              <span>Sign In to Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Crisp White with High-Trust Typography) */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-16">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Official ICAI Practice Badge */}
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-btred-logo" />
            <span>Official Client &amp; Practice Compliance Portal &bull; ICAI FRN: 022998C</span>
          </div>

          {/* Punchy Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
            Stop Chasing Clients on WhatsApp. <br />
            <span className="text-btred-logo">
              Lock Deliverables. Recover Fees via UPI.
            </span>
          </h1>

          {/* Direct, Honest Value Description */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal">
            The dual-sided practice execution platform built for Indian Chartered Accountants, CSs, and their corporate clients. 
            Automate fee realization with UPI Pay-to-Release, compile 3-year banker credit dossiers in 60 seconds, safeguard client ITC from defaulting vendors, and track physical USB DSC tokens.
          </p>

          {/* ONLY 2 Clear CTA Buttons (Eliminating all clutter and confusion) */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* Primary Action: Sign In */}
            <button
              onClick={() => onOpenLogin()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-btred-logo hover:bg-btred-700 text-white px-8 py-4 rounded-2xl text-sm font-black transition shadow-lg shadow-red-500/20 active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>Sign In to Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Action: Pitch Sandbox */}
            <button
              onClick={() => onEnterSandbox("partner")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 px-6 py-4 rounded-2xl text-sm font-bold transition active:scale-95 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Explore Live Interactive Preview</span>
            </button>
          </div>

          {/* Simple Login Hint */}
          <p className="text-xs text-slate-500 font-medium">
            💡 <strong>All users:</strong> Sign in with the email or phone and password registered to your account.
          </p>

          {/* 4 Trust Highlights Strip */}
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">Zero Follow-Up</span>
              <strong className="text-xs text-slate-900 block font-bold">Pay-to-Release Realization</strong>
              <span className="text-[11px] text-slate-500">Auto-lock signed copies behind pending UPI fees.</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">Bank Credit Pack</span>
              <strong className="text-xs text-slate-900 block font-bold">1-Click 3-Year Dossiers</strong>
              <span className="text-[11px] text-slate-500">Binds Balance Sheet, P&amp;L, &amp; ITR-V for loans.</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">GST Compliance</span>
              <strong className="text-xs text-slate-900 block font-bold">GSTR-2B Vendor ITC Shield</strong>
              <span className="text-[11px] text-slate-500">Hold payment to non-filing vendors under Sec 16(2)(aa).</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">Zero SMS Cost</span>
              <strong className="text-xs text-slate-900 block font-bold">4-Digit Access PIN &amp; WhatsApp</strong>
              <span className="text-[11px] text-slate-500">Instant login without DND blocks or SMS fees.</span>
            </div>
          </div>
        </div>

        {/* 4. Interactive Feature Showcase (Clean White & Slate Design) */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-4 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-btred-logo tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Interactive Practice Capabilities</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Explore How GPA &amp; Co. Delivers Maximum Value
              </h2>
            </div>
            
            <button
              onClick={() => onEnterSandbox("partner")}
              className="self-start md:self-auto bg-white hover:bg-slate-100 text-slate-800 font-bold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-200 shadow-sm"
            >
              <span>Open in Sandbox</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* Interactive Feature Tabs (Crisp White Buttons) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 text-xs font-bold">
            {[
              { id: "pay-to-release", label: "Pay-to-Release UPI Lock", icon: Lock, color: "text-amber-600" },
              { id: "banker-docket", label: "3-Yr Bank Loan Dossier", icon: Briefcase, color: "text-indigo-600" },
              { id: "itc-guard", label: "GSTR-2B Vendor ITC Shield", icon: ShieldAlert, color: "text-rose-600" },
              { id: "msme-clock", label: "MSME 43B(h) 45-Day Watchdog", icon: Clock, color: "text-amber-600" },
              { id: "dsc-vault", label: "Physical DSC Token Safe", icon: KeyRound, color: "text-emerald-600" },
              { id: "tally-xml", label: "Bank PDF to Tally XML", icon: FileSpreadsheet, color: "text-blue-600" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? "bg-white text-slate-900 border border-slate-300 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Feature Display Screen (Crisp White Card) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 min-h-[300px] shadow-sm">
            {activeFeatureTab === "pay-to-release" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Fee Recovery Leverage</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Recover Stuck Audit Fees Automatically
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Clients often delay paying audit fees once signed balance sheets or 3CD reports are emailed. 
                    With <strong>Pay-to-Release</strong>, official deliverables are stored in an encrypted vault. 
                    The client scans the firm&apos;s dynamic UPI QR, payment verifies automatically, and the signed PDF unlocks instantly.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-600 uppercase font-bold block">Zero Follow-Up Chases</span>
                      <strong className="text-slate-900 font-bold">NPCI Instant Webhook</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-600 uppercase font-bold block">Direct Bank Deposit</span>
                      <strong className="text-slate-900 font-bold">Firm HDFC / ICICI Account</strong>
                    </div>
                  </div>
                </div>

                {/* Interactive Simulated UI in Light Mode */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Audited Financials FY 25-26</span>
                    {interactiveUpiPaid ? (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        Unlocked ✓
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                        UPI Lock Active
                      </span>
                    )}
                  </div>

                  <div className="mx-auto w-32 h-32 bg-white rounded-xl p-2 flex flex-col items-center justify-center border-2 border-slate-200 shadow-sm relative">
                    <div className="w-full h-full bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-1 text-slate-800">
                      <img src="/brainsandtaxes_qrcode.jpg" alt="Brains & Taxes UPI QR" className="w-20 h-20 mx-auto object-contain rounded-lg" />
                      <span className="text-[8px] font-mono mt-0.5 text-slate-600 font-bold">BRAINSANDTAXES@icici</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-0.5">
                    <span className="text-slate-500 text-[11px]">Outstanding CA Audit Fees:</span>
                    <div className="text-base font-black text-slate-900">₹35,000</div>
                  </div>

                  <button
                    onClick={() => setInteractiveUpiPaid(!interactiveUpiPaid)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm ${
                      interactiveUpiPaid 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                    }`}
                  >
                    {interactiveUpiPaid ? (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Signed Audit Report</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Simulate 1-Tap Client UPI Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeFeatureTab === "banker-docket" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 bg-red-50 text-btred-logo px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Credit &amp; CC Limit Renewals</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    1-Click 3-Year Banker Credit Pack
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    When bank branch managers ask for CC limit renewal documents, clients call their CA in a panic. 
                    The <strong>Banker Loan Docket</strong> automatically binds:
                    3-Year Audited Balance Sheets, Profit &amp; Loss, ITR-V Ack, Computation of Total Income, and GST 3B Turnover Summary into a single watermarked PDF dossier.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium">✓ Schedule III Compliant</span>
                    <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium">✓ Official ICAI UDIN Embedded</span>
                    <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium">✓ Watermarked for Bank Credit</span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
                    <span>Compiled Dossier Preview</span>
                    <span className="text-[10px] text-indigo-700 font-mono font-bold">18 Pages PDF</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <span>1. Audited Balance Sheet (FY 24, 25, 26)</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <span>2. Computation of Total Income</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <span>3. ITR-V Filing Receipts</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <span>4. Certified UDIN Verification Stamp</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenLogin()}
                    className="w-full bg-btred-logo hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                  >
                    Access Banker Docket in Portal
                  </button>
                </div>
              </div>
            )}

            {activeFeatureTab === "itc-guard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>GST Law Section 16(2)(aa)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    GSTR-2B Vendor ITC Loss Protection
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Clients lose lakhs when suppliers collect GST but fail to upload invoices in GSTR-1. 
                    The <strong>ITC Shield</strong> auto-reconciles GSTR-2B against Purchase Registers and alerts the client&apos;s accounts team to withhold supplier payments until invoice reflects on the GST portal.
                  </p>
                  <div className="text-xs text-rose-800 font-medium bg-rose-50 border border-rose-200 p-3 rounded-xl">
                    ⚠️ Prevents 18% + 24% GST reversal interest penalties for your corporate clients.
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Defaulting Suppliers (Hold Payment)</span>
                  <div className="space-y-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                        <strong className="text-slate-900 block font-bold">Apex Steel Traders</strong>
                        <span className="text-[10px] text-slate-500">Invoice #AST-901</span>
                      </div>
                      <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-1 rounded text-[11px]">Hold ₹42,500</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                        <strong className="text-slate-900 block font-bold">Metro Logistics Hub</strong>
                        <span className="text-[10px] text-slate-500">Invoice #ML-441</span>
                      </div>
                      <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-1 rounded text-[11px]">Hold ₹18,900</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenLogin()}
                    className="w-full bg-btred-logo hover:bg-btred-700 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    View Vendor Reconciler in Practice Desk
                  </button>
                </div>
              </div>
            )}

            {activeFeatureTab === "msme-clock" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Income Tax Section 43B(h)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    MSME 45-Day Payment Watchdog
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Under Section 43B(h), any invoice payable to registered Micro/Small enterprises that exceeds 45 days is disallowed as an expense and added back to taxable income at 30% tax. 
                    Our automated watchdog tracks invoice dates, UDYAM certificates, and triggers proactive WhatsApp payment reminders.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">45-Day Expiry Countdown</span>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-xs shadow-sm">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold">Precision Tools Corp (Micro)</strong>
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">3 Days Left</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 my-2">
                      <div className="bg-rose-500 h-full rounded-full w-[92%]" />
                    </div>
                    <span className="text-[10px] text-slate-500">Due: Nov 2, 2026 &bull; Potential Disallowance: ₹3,12,000</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "dsc-vault" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Physical Security Register</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Physical USB DSC Token Custody &amp; Expiry Locker
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Never lose track of physical cryptographic USB dongles. Log serial numbers, physical safe drawer slot numbers, checkout chains by Article Trainees, and receive 30-day proactive expiry notifications before tax filing dead-stops.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900">Vault Safe Locker Slot #14</span>
                    <span className="text-emerald-700 font-mono font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">Token In Custody</span>
                  </div>
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <div>Signatory: <strong className="text-slate-900">Chetan Pratap Singh (Director)</strong></div>
                    <div>Entity: <strong className="text-slate-900">Pratwi Solutions Pvt Ltd</strong></div>
                    <div>Expiry: <strong className="text-slate-900">14-Dec-2027 (Active)</strong></div>
                    <div>Checked Out By: <strong className="text-slate-900">None (In Vault)</strong></div>
                  </div>
                  <button
                    onClick={() => onOpenLogin()}
                    className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-2 rounded-xl text-xs transition border border-slate-200 shadow-sm"
                  >
                    Open DSC Vault Register
                  </button>
                </div>
              </div>
            )}

            {activeFeatureTab === "tally-xml" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-1.5 bg-red-50 text-btred-logo px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                    <span>Article Productivity Booster</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Bank PDF to Tally XML Native Vouchers
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Article trainees waste 20+ hours manually punching bank transactions into accounting software. 
                    Drop encrypted HDFC, ICICI, or SBI bank statement PDFs: our parser decrypts passwords automatically and exports ready-to-import Tally Prime XML vouchers with Narration and Ledger mapping.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-white space-y-1 shadow-sm">
                    <FileSpreadsheet className="w-8 h-8 text-btred-logo mx-auto" />
                    <span className="text-xs font-bold text-slate-900 block">Drop Bank Statement PDF</span>
                    <span className="text-[10px] text-slate-500 block">Auto-decrypts with PAN/DOB</span>
                  </div>
                  <button
                    onClick={() => onOpenLogin()}
                    className="w-full bg-btred-logo hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                  >
                    Convert Bank Statement in Article Desk
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Dual Sided Workspaces (Crisp Light Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 text-left">
          {/* Side 1: Client Portal PWA */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 hover:border-emerald-500/50 transition relative overflow-hidden group shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                SME Client Experience &bull; Mobile PWA
              </span>
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Frictionless Client Portal
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Designed for SME Directors, Traders, and CFOs who hate complex software and refuse to remember passwords.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Instant 4-Digit PIN:</strong> Last 4 digits of phone. Zero SMS OTP failure delays.</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Banker Loan Dossier:</strong> 1-Click compiled 3-year dockets for credit managers.</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Permanent Document Vault:</strong> Filed ITR receipts, GSTR-3B copies, &amp; audit reports.</span>
              </div>
            </div>

            <button
              onClick={() => onOpenLogin()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <span>Sign In to Client Portal (PWA View)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Side 2: CA Firm Workspace */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 hover:border-red-500/50 transition relative overflow-hidden group shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-800 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                CA Firm Workspace &bull; Admin Cockpit
              </span>
              <ShieldCheck className="w-5 h-5 text-btred-logo" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Practice Execution &amp; Fee Cockpit
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Built for Managing Partners, Audit Managers, and Article Trainees to dispatch bulk filings and recover fees.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Check className="w-4 h-4 text-red-600 shrink-0" />
                <span><strong>Pay-to-Release Engine:</strong> Lock signed audit reports behind pending invoices.</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Check className="w-4 h-4 text-red-600 shrink-0" />
                <span><strong>1-Tap WhatsApp Broadcast:</strong> Batch dispatch credentials &amp; receipts in 2 mins.</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <Check className="w-4 h-4 text-red-600 shrink-0" />
                <span><strong>DSC Token Custody:</strong> Safe locker slots, checkout chains, and 30-day alerts.</span>
              </div>
            </div>

            <button
              onClick={() => onOpenLogin()}
              className="w-full bg-btred-logo hover:bg-btred-700 text-white font-black py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <span>Sign In to CA Partner Cockpit (GPA &amp; Co.)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6. Why TaxoBrain vs Legacy Incumbents (Crisp White Table) */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">Why CA Practices Choose TaxoBrain</h3>
            <p className="text-xs text-slate-500">Comparing modern fee-realization software against legacy tools</p>
          </div>

          <div className="overflow-x-auto scrollbar-none touch-pan-x pb-2">
            <table className="w-full min-w-[640px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-white">
                  <th className="py-3 px-4">Feature / Bottleneck</th>
                  <th className="py-3 px-4 text-emerald-800 bg-emerald-50 rounded-t-xl font-extrabold">TaxoBrain (GPA &amp; Co.)</th>
                  <th className="py-3 px-4">Legacy Practice Tools (Jamku / Aalekh)</th>
                  <th className="py-3 px-4">WhatsApp / Google Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Client Adoption</td>
                  <td className="py-3.5 px-4 text-emerald-900 font-extrabold bg-emerald-50/60">95%+ (4-Digit PIN &amp; 1-Tap WhatsApp)</td>
                  <td className="py-3.5 px-4 text-slate-500">&lt;10% (Clients refuse to register)</td>
                  <td className="py-3.5 px-4 text-slate-500">High, but zero structure or security</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Fee Realization (Pay-to-Release)</td>
                  <td className="py-3.5 px-4 text-emerald-900 font-extrabold bg-emerald-50/60">Automated UPI Lock on Certified Copies</td>
                  <td className="py-3.5 px-4 text-slate-500">Manual invoicing &amp; chasing</td>
                  <td className="py-3.5 px-4 text-slate-500">Zero leverage (files already sent)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Bank Loan Dossier Generation</td>
                  <td className="py-3.5 px-4 text-emerald-900 font-extrabold bg-emerald-50/60">1-Click 3-Year Compiled Dossier</td>
                  <td className="py-3.5 px-4 text-slate-500">None (Manual compilation)</td>
                  <td className="py-3.5 px-4 text-slate-500">45 minutes searching scattered folders</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">DSC Physical Token Register</td>
                  <td className="py-3.5 px-4 text-emerald-900 font-extrabold bg-emerald-50/60">Integrated Vault with Safe Locker Slots</td>
                  <td className="py-3.5 px-4 text-slate-500">Basic static list</td>
                  <td className="py-3.5 px-4 text-slate-500">Sticky notes on office desks</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Database &amp; Data Ownership</td>
                  <td className="py-3.5 px-4 text-emerald-900 font-extrabold bg-emerald-50/60">100% Free Supabase PostgreSQL Cloud</td>
                  <td className="py-3.5 px-4 text-slate-500">Vendor Locked-in Proprietary DB</td>
                  <td className="py-3.5 px-4 text-slate-500">Unencrypted Personal Google Drives</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 7. Footer (Clean Light Slate) */}
      <footer className="border-t border-slate-200 bg-slate-50 text-slate-600 text-xs py-8 px-4 sm:px-8 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-extrabold text-slate-900">{DEFAULT_FIRM_BRANDING.firmName}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ICAI FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; Peer-Review Certified &bull; AES-256 Cloud Storage &bull; Data Stored in India
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <button onClick={() => onOpenLogin()} className="hover:text-btred-logo font-bold transition">Sign In</button>
            <button onClick={() => onEnterSandbox("partner")} className="hover:text-slate-900 transition">Pitch Preview</button>
          </div>
        </div>
      </footer>

      {/* 8. Mobile Sticky Quick-Action Bar (Clean White Glassmorphism) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 z-40 flex items-center justify-between gap-2 shadow-lg pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => onOpenLogin()}
          className="flex-1 bg-btred-logo text-white py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Sign In to Portal</span>
        </button>

        <button
          onClick={() => onEnterSandbox("partner")}
          className="bg-slate-100 border border-slate-200 text-slate-700 py-3 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Pitch Preview</span>
        </button>
      </div>

    </div>
  );
};
