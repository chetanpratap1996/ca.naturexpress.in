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
  UserCheck,
  Briefcase,
  ShieldAlert,
  CreditCard,
  Layers,
  Zap,
  Check,
  ExternalLink,
  FileText,
  ChevronRight
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-btred-logo selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* 1. Top Enterprise Ticker Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 text-[11px] px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-200">GPA &amp; Co. Chartered Accountants Practice OS</span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">ICAI FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; Peer-Review Compliant</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400 font-semibold hidden md:inline flex items-center gap-1">
            <Check className="w-3 h-3" /> Zero-SMS OTP Cost &bull; Instant 4-Digit PIN Access
          </span>
          <button
            onClick={() => onOpenLogin()}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
          >
            <KeyRound className="w-3 h-3" />
            <span>Official Sign In &rarr;</span>
          </button>
        </div>
      </div>

      {/* 2. Main SaaS Header Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-3 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BtLogo size="sm" showTagline={false} />
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-3">
              <span className="text-xs bg-slate-900 text-slate-300 font-mono px-2 py-0.5 rounded-lg border border-slate-800">
                v2.6 Enterprise
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/50 hidden lg:inline">
                Supabase Live Cloud DB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onEnterSandbox("client")}
              className="text-xs text-slate-300 hover:text-white font-bold px-3 py-2 rounded-xl hover:bg-slate-900 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Client PWA</span>
            </button>

            <button
              onClick={() => onEnterSandbox("partner")}
              className="text-xs text-slate-300 hover:text-white font-bold px-3 py-2 rounded-xl hover:bg-slate-900 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-btred-logo" />
              <span>CA Cockpit</span>
            </button>

            <button
              onClick={() => onOpenLogin()}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => onEnterSandbox("partner")}
              className="bg-gradient-to-r from-red-600 via-btred-logo to-amber-600 hover:from-red-500 hover:to-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-lg shadow-red-600/20 active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-16">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-emerald-500/10 border border-slate-800 text-slate-300 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>Dual-Sided Operating System for Indian CA Practices &amp; SME Clients</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Stop Chasing Clients on WhatsApp. <br />
            <span className="bg-gradient-to-r from-btred-logo via-amber-400 to-emerald-400 bg-clip-text text-transparent">
              Lock Deliverables. Recover Fees via UPI.
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto font-normal">
            The all-in-one CA realization engine. Automatically lock audited balance sheets behind pending fee invoices, generate 3-year banker credit dossiers in 60 seconds, safeguard client ITC from defaulting vendors, and track physical USB DSC dongles.
          </p>

          {/* Quick Action Persona CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onEnterSandbox("partner")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-btred-logo hover:bg-btred-700 text-white px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition shadow-xl shadow-red-500/25 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Managing Partner Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEnterSandbox("client")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition shadow-xl shadow-emerald-500/25 active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Launch Client Portal PWA</span>
            </button>

            <button
              onClick={() => onOpenLogin()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Secure Sign In (PIN / Password)</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 100% Free Supabase PostgreSQL Database</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Zero SMS OTP Gateway Fees (4-Digit PIN)</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> ICAI Peer-Review Audit Trail Ready</span>
          </div>
        </div>

        {/* 4. Live Interactive CA Feature Tour (The WOW Factor) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Interactive Feature Showcase &bull; Click to Explore</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Engineered for the Exact Pain Points of Indian CA Firms
              </h2>
            </div>
            
            <button
              onClick={() => onEnterSandbox("partner")}
              className="self-start md:self-auto bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-700"
            >
              <span>Test Live in Cockpit</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 text-xs font-bold">
            {[
              { id: "pay-to-release", label: "Pay-to-Release UPI Lock", icon: Lock, color: "text-amber-400" },
              { id: "banker-docket", label: "3-Yr Bank Loan Dossier", icon: Briefcase, color: "text-indigo-400" },
              { id: "itc-guard", label: "GSTR-2B Vendor ITC Shield", icon: ShieldAlert, color: "text-rose-400" },
              { id: "msme-clock", label: "MSME 43B(h) 45-Day Watchdog", icon: Clock, color: "text-amber-400" },
              { id: "dsc-vault", label: "Physical DSC Token Safe", icon: KeyRound, color: "text-emerald-400" },
              { id: "tally-xml", label: "Bank PDF to Tally XML", icon: FileSpreadsheet, color: "text-blue-400" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700 shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Feature Display Screen */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-7 min-h-[300px]">
            {activeFeatureTab === "pay-to-release" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Fee Recovery Leverage</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Recover Stuck Audit Fees Automatically
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Clients often delay paying audit fees once signed balance sheets or 3CD reports are emailed. 
                    With <strong>Pay-to-Release</strong>, official files are placed in an encrypted vault. 
                    The client scans the firm&apos;s dynamic UPI QR, payment verifies automatically, and the signed PDF decrypts instantly.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Zero Follow-Up</span>
                      <strong className="text-white">NPCI Instant Webhook</strong>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Direct Bank Deposit</span>
                      <strong className="text-white">Firm HDFC / ICICI UPI</strong>
                    </div>
                  </div>
                </div>

                {/* Interactive Simulated UI */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Audited Financials FY 25-26</span>
                    {interactiveUpiPaid ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                        Unlocked ✓
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800 text-[10px]">
                        UPI Lock Active
                      </span>
                    )}
                  </div>

                  <div className="mx-auto w-32 h-32 bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-inner relative">
                    <div className="w-full h-full bg-slate-900 rounded-lg flex flex-col items-center justify-center p-2 text-white">
                      <QrCode className="w-16 h-16 text-indigo-400" />
                      <span className="text-[8px] font-mono mt-0.5 text-slate-400">7999995897@upi</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-0.5">
                    <span className="text-slate-400 text-[11px]">Outstanding CA Audit Fees:</span>
                    <div className="text-base font-black text-white">₹35,000</div>
                  </div>

                  <button
                    onClick={() => setInteractiveUpiPaid(!interactiveUpiPaid)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                      interactiveUpiPaid 
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950"
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
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Credit &amp; CC Limit Renewals</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    1-Click 3-Year Banker Credit Pack
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    When bank branch managers ask for CC limit renewal documents, clients call their CA in a panic. 
                    The <strong>Banker Loan Docket</strong> automatically binds:
                    3-Year Audited Balance Sheets, Profit &amp; Loss, ITR-V Ack, Computation of Total Income, and GST 3B Turnover Summary into a single watermarked PDF dossier.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">✓ Schedule III Compliant</span>
                    <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">✓ Official ICAI UDIN Embedded</span>
                    <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">✓ Watermarked for Bank Credit</span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="text-xs font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                    <span>Compiled Dossier Preview</span>
                    <span className="text-[10px] text-indigo-400 font-mono">18 Pages PDF</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span>1. Audited Balance Sheet (FY 24, 25, 26)</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span>2. Computation of Total Income</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span>3. ITR-V Filing Receipts</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span>4. Certified UDIN Verification Stamp</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>
                  <button
                    onClick={() => onEnterSandbox("client")}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl text-xs transition"
                  >
                    Open Banker Docket in Client Portal
                  </button>
                </div>
              </div>
            )}

            {activeFeatureTab === "itc-guard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>GST Law Section 16(2)(aa)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    GSTR-2B Vendor ITC Loss Protection
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Clients lose lakhs when suppliers collect GST but fail to upload invoices in GSTR-1. 
                    The <strong>ITC Shield</strong> auto-reconciles GSTR-2B against Purchase Registers and alerts the client&apos;s accounts team to withhold supplier payments until invoice reflects on the GST portal.
                  </p>
                  <div className="text-xs text-rose-400 font-semibold bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl">
                    ⚠️ Prevents 18% + 24% GST reversal interest penalties for your corporate clients.
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Defaulting Suppliers (Hold Payment)</span>
                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <strong className="text-white block">Apex Steel Traders</strong>
                        <span className="text-[10px] text-slate-400">Invoice #AST-901</span>
                      </div>
                      <span className="text-rose-400 font-bold bg-rose-950 px-2 py-1 rounded text-[11px]">Hold ₹42,500</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <strong className="text-white block">Metro Logistics Hub</strong>
                        <span className="text-[10px] text-slate-400">Invoice #ML-441</span>
                      </div>
                      <span className="text-rose-400 font-bold bg-rose-950 px-2 py-1 rounded text-[11px]">Hold ₹18,900</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onEnterSandbox("partner")}
                    className="w-full bg-btred-logo hover:bg-btred-700 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    View Vendor Reconciler in Practice Desk
                  </button>
                </div>
              </div>
            )}

            {activeFeatureTab === "msme-clock" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Income Tax Section 43B(h)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    MSME 45-Day Payment Watchdog
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Under Section 43B(h), any invoice payable to registered Micro/Small enterprises that exceeds 45 days is disallowed as an expense and added back to taxable income at 30% tax. 
                    Our automated watchdog tracks invoice dates, UDYAM certificates, and triggers proactive WhatsApp payment reminders.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">45-Day Expiry Countdown</span>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">Precision Tools Corp (Micro)</strong>
                      <span className="text-rose-400 font-bold">3 Days Left</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-rose-500 h-full rounded-full w-[92%]" />
                    </div>
                    <span className="text-[10px] text-slate-400">Due: Nov 2, 2026 &bull; Potential Disallowance: ₹3,12,000</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === "dsc-vault" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Physical Security Register</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Physical USB DSC Token Custody &amp; Expiry Locker
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Never lose track of physical cryptographic USB dongles. Log serial numbers, physical safe drawer slot numbers, checkout chains by Article Trainees, and receive 30-day proactive expiry notifications before tax filing dead-stops.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white">Vault Safe Locker Slot #14</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Token In Custody</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div>Signatory: <strong>Chetan Pratap Singh (Director)</strong></div>
                    <div>Entity: <strong>Pratwi Solutions Pvt Ltd</strong></div>
                    <div>Expiry: <strong>14-Dec-2027 (Active)</strong></div>
                    <div>Checked Out By: <strong>None (In Vault)</strong></div>
                  </div>
                  <button
                    onClick={() => onEnterSandbox("partner")}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition border border-slate-700"
                  >
                    Open DSC Vault Register
                  </button>
                </div>
              </div>
            )}

            {activeFeatureTab === "tally-xml" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Article Productivity Booster</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Bank PDF to Tally XML Native Vouchers
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Article trainees waste 20+ hours manually punching bank transactions into accounting software. 
                    Drop encrypted HDFC, ICICI, or SBI bank statement PDFs: our parser decrypts passwords automatically and exports ready-to-import Tally Prime XML vouchers with Narration and Ledger mapping.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center space-y-3">
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 space-y-1">
                    <FileSpreadsheet className="w-8 h-8 text-blue-400 mx-auto" />
                    <span className="text-xs font-bold text-white block">Drop Bank Statement PDF</span>
                    <span className="text-[10px] text-slate-400 block">Auto-decrypts with PAN/DOB</span>
                  </div>
                  <button
                    onClick={() => onEnterSandbox("article")}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    Test Bank Parser in Article Workbench
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Dual Sided SaaS Workspaces */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* Side 1: Client Portal PWA */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 hover:border-emerald-500/40 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/80">
                SME Client Experience &bull; Mobile PWA
              </span>
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Frictionless Client Portal
              </h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Designed for SME Directors, Traders, and CFOs who hate complex software and refuse to remember passwords.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Instant 4-Digit PIN:</strong> Last 4 digits of phone. Zero SMS OTP failure delays.</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Banker Loan Dossier:</strong> 1-Click compiled 3-year dockets for credit managers.</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Permanent Document Vault:</strong> Filed ITR receipts, GSTR-3B copies, &amp; audit reports.</span>
              </div>
            </div>

            <button
              onClick={() => onEnterSandbox("client")}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              <span>Test Client Portal (PWA View)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Side 2: CA Firm Workspace */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 hover:border-btred-logo/40 transition relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/80 px-3 py-1 rounded-full border border-red-800/80">
                CA Firm Workspace &bull; Admin Cockpit
              </span>
              <ShieldCheck className="w-5 h-5 text-red-400" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Practice Execution &amp; Fee Cockpit
              </h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Built for Managing Partners, Audit Managers, and Article Trainees to dispatch bulk filings and recover fees.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                <Check className="w-4 h-4 text-red-400 shrink-0" />
                <span><strong>Pay-to-Release Engine:</strong> Lock signed audit reports behind pending invoices.</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                <Check className="w-4 h-4 text-red-400 shrink-0" />
                <span><strong>1-Tap WhatsApp Broadcast:</strong> Batch dispatch credentials &amp; receipts in 2 mins.</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                <Check className="w-4 h-4 text-red-400 shrink-0" />
                <span><strong>DSC Token Custody:</strong> Safe locker slots, checkout chains, and 30-day alerts.</span>
              </div>
            </div>

            <button
              onClick={() => onEnterSandbox("partner")}
              className="w-full bg-btred-logo hover:bg-btred-700 text-white font-black py-3.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95"
            >
              <span>Test CA Partner Cockpit (GPA &amp; Co.)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6. Why TaxoBrain vs Legacy Incumbents */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">Why CA Firms Switch to TaxoBrain</h3>
            <p className="text-xs text-slate-400">Comparing modern realization software against legacy practice tools</p>
          </div>

          <div className="overflow-x-auto scrollbar-none touch-pan-x pb-2">
            <table className="w-full min-w-[640px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-4">Feature / Bottleneck</th>
                  <th className="py-3 px-4 text-emerald-400 bg-emerald-950/20 rounded-t-xl">TaxoBrain (GPA &amp; Co.)</th>
                  <th className="py-3 px-4">Legacy Practice Tools (Jamku / Aalekh)</th>
                  <th className="py-3 px-4">WhatsApp / Google Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Client Adoption</td>
                  <td className="py-3.5 px-4 text-emerald-300 font-bold bg-emerald-950/20">95%+ (4-Digit PIN &amp; 1-Tap WhatsApp)</td>
                  <td className="py-3.5 px-4 text-slate-400">&lt;10% (Clients refuse to register)</td>
                  <td className="py-3.5 px-4 text-slate-400">High, but zero structure or security</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Fee Realization (Pay-to-Release)</td>
                  <td className="py-3.5 px-4 text-emerald-300 font-bold bg-emerald-950/20">Automated UPI Lock on Certified Copies</td>
                  <td className="py-3.5 px-4 text-slate-400">Manual invoicing &amp; chasing</td>
                  <td className="py-3.5 px-4 text-slate-400">Zero leverage (files already sent)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Bank Loan Dossier Generation</td>
                  <td className="py-3.5 px-4 text-emerald-300 font-bold bg-emerald-950/20">1-Click 3-Year Compiled Dossier</td>
                  <td className="py-3.5 px-4 text-slate-400">None (Manual compilation)</td>
                  <td className="py-3.5 px-4 text-slate-400">45 minutes searching scattered folders</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">DSC Physical Token Register</td>
                  <td className="py-3.5 px-4 text-emerald-300 font-bold bg-emerald-950/20">Integrated Vault with Safe Locker Slots</td>
                  <td className="py-3.5 px-4 text-slate-400">Basic static list</td>
                  <td className="py-3.5 px-4 text-slate-400">Sticky notes on office desks</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Database &amp; Data Ownership</td>
                  <td className="py-3.5 px-4 text-emerald-300 font-bold bg-emerald-950/20">100% Free Supabase PostgreSQL Cloud</td>
                  <td className="py-3.5 px-4 text-slate-400">Vendor Locked-in Proprietary DB</td>
                  <td className="py-3.5 px-4 text-slate-400">Unencrypted Personal Google Drives</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 7. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-8 px-4 sm:px-8 mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-300">{DEFAULT_FIRM_BRANDING.firmName}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              ICAI FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; Peer-Review Certified &bull; AES-256 Cloud Storage &bull; Data Stored in India
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => onEnterSandbox("partner")} className="hover:text-white transition">Partner View</button>
            <button onClick={() => onEnterSandbox("client")} className="hover:text-white transition">Client View</button>
            <button onClick={() => onEnterSandbox("article")} className="hover:text-white transition">Staff View</button>
            <button onClick={() => onOpenLogin()} className="hover:text-amber-400 font-bold transition">Sign In</button>
          </div>
        </div>
      </footer>

      {/* 8. Mobile Sticky Quick-Action Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2.5 z-40 flex items-center justify-around gap-2 shadow-2xl pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => onEnterSandbox("partner")}
          className="flex-1 bg-btred-logo text-white py-2.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CA Cockpit</span>
        </button>

        <button
          onClick={() => onEnterSandbox("client")}
          className="flex-1 bg-emerald-600 text-white py-2.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Client PWA</span>
        </button>

        <button
          onClick={() => onOpenLogin()}
          className="bg-slate-800 border border-slate-700 text-amber-400 py-2.5 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Login</span>
        </button>
      </div>

    </div>
  );
};
