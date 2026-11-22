"use client";

import React, { useState, useEffect } from "react";
import { 
  ClientValueDeliveredSummary, 
  SAMPLE_VALUE_SUMMARIES,
  ValueBenefitItem
} from "@/lib/billing/valueDeliveredEngine";
import { generateNpciUpiDeepLinks, generateUpiQrDataUrl, UpiDeepLinks } from "@/lib/billing/npciUpiEngine";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  QrCode,
  Send,
  Printer,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileText,
  DollarSign,
  ChevronRight,
  Info,
  Smartphone,
  Layers,
  Award
} from "lucide-react";

interface EnrichedSummary extends ClientValueDeliveredSummary {
  upiLinks: UpiDeepLinks;
  qrDataUrl: string;
}

export function ValueDeliveredDesk() {
  const [summaries, setSummaries] = useState<EnrichedSummary[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("CLI-001");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);

  // Initialize with enriched sample data
  useEffect(() => {
    async function initData() {
      try {
        const enriched = await Promise.all(
          SAMPLE_VALUE_SUMMARIES.map(async (item) => {
            const upiLinks = generateNpciUpiDeepLinks({
              firmVpa: DEFAULT_FIRM_BRANDING.firmUpiVpa || "ca.gunjan@icici",
              merchantName: DEFAULT_FIRM_BRANDING.firmName || "Brains & Taxes (GPA & Co., CAs)",
              amount: item.netTotalPayableInr,
              invoiceNo: item.invoiceNo,
              clientName: item.clientName
            });
            const qrDataUrl = await generateUpiQrDataUrl(upiLinks.universalUri, { width: 220 });
            return {
              ...item,
              upiLinks,
              qrDataUrl
            };
          })
        );
        setSummaries(enriched);
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to enrich value summaries:", e);
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  const currentSummary = summaries.find((s) => s.clientId === selectedClientId) || summaries[0];

  const handleCopyUpi = () => {
    if (!currentSummary) return;
    navigator.clipboard.writeText(currentSummary.upiLinks.universalUri);
    setIsCopied(true);
    toast.success("UPI Link Copied", "Standard NPCI UPI payment link copied to clipboard.");
    playSoftClick();
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleCopyWhatsApp = () => {
    if (!currentSummary) return;
    const text = [
      `🙏 *Namaste ${currentSummary.clientName} ji,*`,
      ``,
      `Your accounts reconciliation & filing for *${currentSummary.billingPeriod}* is completed.`,
      `📊 *PAISA BACHAYA KITNA — VALUE DELIVERED SUMMARY*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ *ITC Reconciled & Claimed:* ₹${currentSummary.totalItcReconciledInr.toLocaleString("en-IN")}`,
      `✅ *Statutory Penalties Avoided:* ₹${currentSummary.totalPenaltiesAvoidedInr.toLocaleString("en-IN")}`,
      `✅ *Interest & Disallowance Shielded:* ₹${currentSummary.totalInterestShieldedInr.toLocaleString("en-IN")}`,
      `💎 *Total Financial Protection:* ₹${currentSummary.totalValueDeliveredInr.toLocaleString("en-IN")}`,
      `🚀 *Your Net Value ROI:* ${currentSummary.roiMultiplier}x of professional fee`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• 🏛️ *Govt Challan (At Cost, 0% CA Margin):* ₹${currentSummary.pureAgentGovtFeesInr.toLocaleString("en-IN")}`,
      `• ⚖️ *CA Professional Fee (SAC 9982):* ₹${currentSummary.caProfessionalFeeInr.toLocaleString("en-IN")}`,
      `• 📝 *GST (18% on CA Fee Only):* ₹${currentSummary.gstOnProfessionalFeeInr.toLocaleString("en-IN")}`,
      `💰 *Total Net Amount Payable:* *₹${currentSummary.netTotalPayableInr.toLocaleString("en-IN")}*`,
      ``,
      `📲 *1-TAP UPI PAYMENT LINK:*`,
      `${currentSummary.upiLinks.universalUri}`,
      ``,
      `_Thank you for your partnership!_`
    ].join("\n");

    navigator.clipboard.writeText(text);
    toast.success("WhatsApp Statement Copied", "Ready to paste in client chat.");
    playSoftClick();
  };

  const handleOpenWhatsApp = () => {
    if (!currentSummary) return;
    const phone = currentSummary.clientPhone || "919826012345";
    const text = encodeURIComponent(
      `Namaste ${currentSummary.clientName} ji,\n\nYour accounts reconciliation for ${currentSummary.billingPeriod} is completed.\n\nTotal Tax & Penalties Protected: ₹${currentSummary.totalValueDeliveredInr.toLocaleString("en-IN")} (${currentSummary.roiMultiplier}x ROI)\nTotal Amount Payable: ₹${currentSummary.netTotalPayableInr.toLocaleString("en-IN")}\n\nPay via 1-Tap UPI:\n${currentSummary.upiLinks.universalUri}`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
    playSoftClick();
  };

  const handlePrint = () => {
    window.print();
    playSoftClick();
  };

  if (isLoading || !currentSummary) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-btred-logo border-t-transparent rounded-full" />
        <p className="text-slate-600 text-sm font-semibold">Generating Real-Time Value Realization Matrices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white font-sans text-slate-800">
      {/* 1. Header Banner (Clean White, crisp border, system btred accents) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-logo text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Tier-2 India Value Realization Engine
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            💎 Paisa Bachaya Kitna — Client Value Ledger & 1-Tap UPI
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Demonstrates mathematically verified tax savings, reconciled ITC, and statutory penalties avoided 
            <strong> before</strong> presenting the professional CA fee. Solves invisible labor friction and eliminates collection delays.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Statement
          </button>
          <button
            onClick={handleOpenWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            WhatsApp Value Card
          </button>
        </div>
      </div>

      {/* 2. Client Switcher (Clean White Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {summaries.map((s) => {
          const isSelected = s.clientId === selectedClientId;
          return (
            <button
              key={s.clientId}
              onClick={() => {
                setSelectedClientId(s.clientId);
                playSoftClick();
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${
                isSelected
                  ? "bg-red-50 border-btred-logo text-btred-logo shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${isSelected ? "text-btred-logo" : "text-slate-400"}`} />
              <span>{s.clientName}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                isSelected ? "bg-btred-logo text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {s.roiMultiplier}x ROI
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Top 4 Executive Value Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Value Protected */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>Value Protected / Saved</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{currentSummary.totalValueDeliveredInr.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ITC reconciled + Penalties avoided + Interest shielded
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Mathematically Verified
          </div>
        </div>

        {/* Card 2: CA Professional Fee */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>CA Professional Fee</span>
            <Award className="w-4 h-4 text-btred-logo" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{currentSummary.caProfessionalFeeInr.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            SAC 9982 Tax & Accounting Advisory (+18% GST)
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            Invoice: {currentSummary.invoiceNo}
          </div>
        </div>

        {/* Card 3: Value ROI Multiplier */}
        <div className="p-5 rounded-2xl bg-white border border-red-200 shadow-sm">
          <div className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center justify-between">
            <span>Client Value ROI</span>
            <TrendingUp className="w-4 h-4 text-btred-logo" />
          </div>
          <div className="text-2xl font-black text-btred-logo mt-2">
            {currentSummary.roiMultiplier}x Multiplier
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Client recovers ₹{currentSummary.roiMultiplier} for every ₹1 of fee
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-btred-logo bg-red-50 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
            Net Savings: ₹{currentSummary.netClientSavingsInr.toLocaleString("en-IN")}
          </div>
        </div>

        {/* Card 4: Pure Agent Govt Challans */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Sarkari Portal Challan</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            ₹{currentSummary.pureAgentGovtFeesInr.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            MCA / Tax Portal actuals (0% CA Margin, 0% GST)
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
            <Info className="w-3.5 h-3.5" />
            GST Rule 33 Pure Agent
          </div>
        </div>
      </div>

      {/* 4. Main Workspace: Split Dual-Ledger & 1-Tap UPI Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Value Delivered Breakdown & Dual-Ledger (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. Dual-Ledger Transparency Card (Sarkari vs CA Fee) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  📑 Transparent Dual-Ledger Breakup
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Eliminates confusion by separating Government challan costs from Professional CA fees.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">
                Period: {currentSummary.billingPeriod}
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {/* Part 1: Govt Challans */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    1. Government Statutory Portal Challans
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                    MCA filing fees / Advance tax (GST Rule 33 Pure Agent: 0% Markup, 0% GST, 0% TDS)
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900">
                  ₹{currentSummary.pureAgentGovtFeesInr.toLocaleString("en-IN")}
                </div>
              </div>

              {/* Part 2: CA Professional Fee */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-btred-logo" />
                    2. CA Professional Advisory & Review Fee
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                    SAC Code 9982 (Statutory Compliance, BRS, Tax Audit Compilation)
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900">
                  ₹{currentSummary.caProfessionalFeeInr.toLocaleString("en-IN")}
                </div>
              </div>

              {/* Part 3: GST on CA Fee */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    3. Goods & Services Tax (18% on CA Fee Only)
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                    Per CBDT Circular 23/2017: CGST 9% + SGST 9% (TDS u/s 194J excluded from GST)
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900">
                  ₹{currentSummary.gstOnProfessionalFeeInr.toLocaleString("en-IN")}
                </div>
              </div>

              {/* Net Payable Highlight Card */}
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between text-slate-900 font-sans">
                <div>
                  <div className="text-xs font-bold text-red-900 uppercase tracking-wider">
                    Total Net Amount Payable
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Includes all government challans, professional advisory, and taxes.
                  </div>
                </div>
                <div className="text-2xl font-black text-btred-logo font-mono">
                  ₹{currentSummary.netTotalPayableInr.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* B. Specific Value Delivered Ledger (Itemized Value Proof) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  💡 Itemized Tax Protection & Savings Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed statutory justification proving tangible financial benefit provided to {currentSummary.clientName}.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {currentSummary.benefitsList.length} Interventions
              </span>
            </div>

            <div className="space-y-3">
              {currentSummary.benefitsList.map((ben) => (
                <div 
                  key={ben.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ben.badgeLabel}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {ben.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {ben.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400 font-bold uppercase">Benefit</div>
                      <div className="text-sm font-black text-emerald-700 font-mono">
                        +₹{ben.financialBenefitInr.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg inline-block border border-slate-100">
                    Statute: {ben.statutoryReference}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                {currentSummary.statutoryNoticeDisclaimer}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 1-Tap NPCI UPI Drawer & WhatsApp Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* A. 1-Tap NPCI UPI Payment Card (Pure White Surface, Crisp Borders) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                Zero-Cost NPCI UPI Rails
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Scan or Tap to Pay
              </h3>
              <p className="text-xs text-slate-500">
                Works with any UPI App (PhonePe, Google Pay, Paytm, BHIM, Cred)
              </p>
            </div>

            {/* Offline Pure QR Code Image */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
              {currentSummary.qrDataUrl ? (
                <img 
                  src={currentSummary.qrDataUrl} 
                  alt="NPCI Dynamic UPI QR"
                  className="w-48 h-48 rounded-xl shadow-sm border border-slate-200 bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 bg-white flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
              <div className="mt-2 text-center">
                <div className="text-xs font-black text-slate-900 font-mono">
                  ₹{currentSummary.netTotalPayableInr.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  VPA: {DEFAULT_FIRM_BRANDING.firmUpiVpa || "ca.gunjan@icici"}
                </div>
              </div>
            </div>

            {/* 1-Tap Mobile App Direct Launchers */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
                Instant 1-Tap Launch on Mobile
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={currentSummary.upiLinks.phonePeUri}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5 text-purple-700" />
                  PhonePe
                </a>

                <a
                  href={currentSummary.upiLinks.gPayUri}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-700" />
                  Google Pay
                </a>

                <a
                  href={currentSummary.upiLinks.paytmUri}
                  className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5 text-sky-700" />
                  Paytm UPI
                </a>

                <a
                  href={currentSummary.upiLinks.universalUri}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                  Any UPI App
                </a>
              </div>

              <button
                onClick={handleCopyUpi}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm mt-1"
              >
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? "NPCI UPI URI Copied!" : "Copy Universal UPI Payment Link"}
              </button>
            </div>
          </div>

          {/* B. WhatsApp Value Notice Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Client WhatsApp Dispatch Card
                </h4>
              </div>
              <button
                onClick={handleCopyWhatsApp}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line">
              {`🙏 Namaste ${currentSummary.clientName} ji,

Your compliance for ${currentSummary.billingPeriod} has been successfully completed.

📊 PAISA BACHAYA KITNA — VALUE SUMMARY:
✅ ITC Reconciled: ₹${currentSummary.totalItcReconciledInr.toLocaleString("en-IN")}
✅ Statutory Penalties Avoided: ₹${currentSummary.totalPenaltiesAvoidedInr.toLocaleString("en-IN")}
✅ Interest Shielded: ₹${currentSummary.totalInterestShieldedInr.toLocaleString("en-IN")}
💎 Total Value Delivered: ₹${currentSummary.totalValueDeliveredInr.toLocaleString("en-IN")}
🚀 Your Net Value ROI: ${currentSummary.roiMultiplier}x

📑 BILLING & SARKARI CHALLAN BREAKUP:
• Govt Challan (At Cost): ₹${currentSummary.pureAgentGovtFeesInr.toLocaleString("en-IN")}
• CA Professional Fee: ₹${currentSummary.caProfessionalFeeInr.toLocaleString("en-IN")}
• GST (18% on CA Fee): ₹${currentSummary.gstOnProfessionalFeeInr.toLocaleString("en-IN")}
💰 Total Amount Payable: ₹${currentSummary.netTotalPayableInr.toLocaleString("en-IN")}

📲 1-Tap UPI Payment:
${currentSummary.upiLinks.universalUri}`}
            </div>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              Open in WhatsApp Web / App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
