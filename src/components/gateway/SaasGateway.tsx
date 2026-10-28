"use client";

import React, { useState } from "react";
import { BtLogo } from "@/components/shared/BtLogo";
import { AuthUser, DEMO_USERS } from "@/lib/auth/session";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
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
  UserCheck
} from "lucide-react";

interface SaasGatewayProps {
  onEnterSandbox: (role: "partner" | "article" | "client") => void;
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
}

export const SaasGateway: React.FC<SaasGatewayProps> = ({
  onEnterSandbox,
  onOpenLogin,
}) => {
  const enterWorkspace = (role: "partner" | "article" | "client") => {
    if (process.env.NODE_ENV === "production") onOpenLogin(role);
    else onEnterSandbox(role);
  };
  const isProduction = process.env.NODE_ENV === "production";
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-btred-logo selection:text-white">
      {/* Top Utility Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 text-[11px] px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">NatureXpress TaxoBrain Platform</span>
          <span className="text-slate-600">&bull;</span>
          <span>B2B Multi-Tenant CA Practice &amp; Client Compliance Suite</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 hidden sm:inline">Made for Indian CAs, CSs &amp; SMEs</span>
          <button
            onClick={() => enterWorkspace("partner")}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProduction ? "Secure Sign In" : "Interactive Demo Sandbox"}</span>
          </button>
        </div>
      </div>

      {/* Main SaaS Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BtLogo size="sm" showTagline={false} />
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700 hidden sm:inline">
              v2.4 Enterprise
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => enterWorkspace("client")}
              className="text-xs text-slate-300 hover:text-white font-semibold hidden md:inline px-3 py-1.5 rounded-xl hover:bg-slate-800 transition"
            >
              Client Portal View
            </button>
            <button
              onClick={() => enterWorkspace("partner")}
              className="text-xs text-slate-300 hover:text-white font-semibold hidden md:inline px-3 py-1.5 rounded-xl hover:bg-slate-800 transition"
            >
              CA Practice Desk
            </button>
            <button
              onClick={() => enterWorkspace("partner")}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProduction ? "Secure Sign In" : "Launch Demo Sandbox"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-btred-logo/10 border border-btred-logo/30 text-btred-logo px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Dual-Sided CA Operating System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Stop Chasing WhatsApp. <br />
            <span className="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
              Automate Client Exchange &amp; Fees.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            The high-realization platform engineered for Indian Chartered Accountants and their corporate clients. 
            Deliver tax acknowledgments in batches, capture missing bank statements, generate 3-year banker dossiers, 
            and unlock fees with automated Pay-to-Release.
          </p>

          {/* Persona Launch Cluster */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => enterWorkspace("partner")}
              className="flex items-center gap-2 bg-btred-logo hover:bg-btred-700 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition shadow-xl shadow-red-500/25 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Explore CA Partner Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => enterWorkspace("client")}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition active:scale-95"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Explore Client Experience</span>
            </button>

            <button
              onClick={() => enterWorkspace("article")}
              className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Article Trainee Desk</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            {isProduction ? "Secure access for authorized firm users" : "Local evaluation sandbox · sample records only"}
          </p>
        </div>

        {/* Dual Sided SaaS Architectural Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          {/* Side 1: Client Portal */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 hover:border-emerald-500/40 transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/80">
                Client &amp; Customer Portal
              </span>
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Frictionless Client Hub
              </h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Built for business promoters, directors, and accounts teams who despise remembering passwords.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Headless WhatsApp &amp; OTP Access</strong>
                  <span className="text-slate-400 text-[11px]">Clients access tax filing acknowledgments and requests with 1-tap WhatsApp links without password headaches.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">1-Click 3-Year Banker Loan Dossier</strong>
                  <span className="text-slate-400 text-[11px]">Compiles certified ITRs, Computations, Audited Financials, and GSTR-3Bs into a single bank-ready credit pack.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Encrypted PDF Ingestion Dropzone</strong>
                  <span className="text-slate-400 text-[11px]">Captures missing bank statements and prompts for PDF passwords immediately, saving hours of staff back-and-forth.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Instant UPI Fee Settlement</strong>
                  <span className="text-slate-400 text-[11px]">Dynamic QR code allows prompt payment to unlock certified audit copies with automatic watermark removal.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => enterWorkspace("client")}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <span>Test Client Portal (PWA View)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Side 2: CA Firm Workspace */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 hover:border-btred-logo/40 transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition"></div>
            
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
                Built for Managing Partners, Managers, and Article Trainees to dispatch bulk filings and recover fees.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <TrendingUp className="w-4 h-4 text-btred-logo shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Pay-to-Release Fee Realization Engine</strong>
                  <span className="text-slate-400 text-[11px]">Lock certified audit balance sheets and CMA reports behind pending fee invoices. Recover months of stuck receivables.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-btred-logo shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Batch Inward &amp; Outward Auto-Dispatcher</strong>
                  <span className="text-slate-400 text-[11px]">Drop 100 GSTR-3B or ITR PDFs; auto-match via PAN/GSTIN and send branded WhatsApp delivery updates in 60 seconds.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <KeyRound className="w-4 h-4 text-btred-logo shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">DSC Token Custody &amp; Expiry Vault</strong>
                  <span className="text-slate-400 text-[11px]">Track physical USB crypto tokens, vault slots, checkout history, and receive 30-day proactive expiry alerts.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                <Users className="w-4 h-4 text-btred-logo shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Strict Role-Based Article Hierarchy</strong>
                  <span className="text-slate-400 text-[11px]">Articles handle their assigned client queue; Partners monitor WIP, overdue collections, and peer review workpapers.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => enterWorkspace("partner")}
              className="w-full bg-btred-logo hover:bg-btred-700 text-white font-bold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              <span>Test CA Partner Cockpit (GPA &amp; Co.)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Why NatureXpress TaxoBrain vs Incumbents */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-10 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-white">Why CA Firms Switch to TaxoBrain</h3>
            <p className="text-xs text-slate-400">Comparing modern realization software against legacy practice tools</p>
          </div>

          <div className="overflow-x-auto scrollbar-none touch-pan-x pb-2">
            <table className="w-full min-w-[600px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-4">Feature / Bottleneck</th>
                  <th className="py-3 px-4 text-emerald-400 bg-emerald-950/20 rounded-t-xl">TaxoBrain (Brains &amp; Taxes)</th>
                  <th className="py-3 px-4">Legacy Practice Tools (Jamku / Aalekh)</th>
                  <th className="py-3 px-4">WhatsApp / Google Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Client Adoption</td>
                  <td className="py-3.5 px-4 text-emerald-300 font-bold bg-emerald-950/20">95%+ (Headless WhatsApp &amp; 1-Tap Links)</td>
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
                  <td className="py-3.5 px-4 text-emerald-300 font-bold bg-emerald-950/20">Integrated Vault with Expiry Alarms</td>
                  <td className="py-3.5 px-4 text-slate-400">Basic static list</td>
                  <td className="py-3.5 px-4 text-slate-400">Sticky notes on office desks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-300">NatureXpress TaxoBrain &bull; Brains &amp; Taxes</p>
            <p className="text-[11px] text-slate-600 mt-0.5">ICAI Peer-Review Compliant Practice OS &bull; AES-256 Storage &bull; Data Stored in India</p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            {!isProduction && <>
              <button onClick={() => enterWorkspace("partner")} className="hover:text-white transition">Partner View</button>
              <button onClick={() => enterWorkspace("client")} className="hover:text-white transition">Client View</button>
              <button onClick={() => enterWorkspace("article")} className="hover:text-white transition">Staff View</button>
            </>}
          </div>
        </div>
      </footer>
    </div>
  );
};
