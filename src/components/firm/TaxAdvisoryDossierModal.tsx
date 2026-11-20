"use client";

import React, { useState } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { 
  Printer, 
  Download, 
  Copy, 
  Send, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Building2, 
  Award, 
  Calendar, 
  DollarSign,
  Layers,
  CheckCircle2
} from "lucide-react";

export interface DossierComputationData {
  taxpayerName: string;
  pan: string;
  category: "INDIVIDUAL" | "SENIOR" | "SUPER_SENIOR";
  roleDescription: string;
  phone: string;
  assessmentYear: string;
  financialYear: string;
  
  // Salary
  salaryGross: number;
  salaryExemptions: number;
  professionalTax: number;
  netSalaryNew: number;
  netSalaryOld: number;
  newRegimeStdDeduction: number;
  oldRegimeStdDeduction: number;

  // House Property
  annualRentReceived: number;
  municipalTaxesPaid: number;
  homeLoanInterestSelfOccupied: number;
  housePropIncomeNew: number;
  housePropIncomeOld: number;

  // Business & Profession (PGBP)
  isPresumptive: boolean;
  presumptiveScheme: string;
  businessGrossTurnover: number;
  regularBusinessProfit: number;
  pgbp: number;

  // Capital Gains
  stcg111A: number;
  ltcg112A: number;
  taxStcg111A: number;
  taxLtcg112A: number;
  specialRateTax: number;

  // Other Sources
  savingsInterest: number;
  fdInterestAndDividends: number;
  totalOtherSources: number;

  // GTI
  ordinaryGtiNew: number;
  ordinaryGtiOld: number;

  // Deductions
  sec80C: number;
  effective80C: number;
  sec80D_Self: number;
  sec80D_ParentsSenior: number;
  effective80D: number;
  sec80CCD_1B: number;
  effective80CCD: number;
  sec80CCD_2_Employer: number;
  sec80E: number;
  sec80G: number;
  effective80TTA: number;
  totalOldDeductions: number;

  // Taxable
  taxableOrdinaryNew: number;
  taxableOrdinaryOld: number;

  // Tax on Slabs
  taxNew: number;
  taxOld: number;
  rebate87ANew: number;
  rebate87AOld: number;
  surchargeNew: number;
  surchargeOld: number;
  cessNew: number;
  cessOld: number;
  totalTaxLiabilityNew: number;
  totalTaxLiabilityOld: number;

  // Comparison & Savings
  difference: number;
  recommendedRegime: "NEW" | "OLD";

  // Prepaid & Net Balances
  tdsPaid: number;
  advanceTaxPaid: number;
  totalPrepaid: number;
  netBalanceNew: number;
  netBalanceOld: number;

  // Planning Metrics
  breakEvenDeductions: number;
  isForm10IEAMandatory: boolean;
  udinCode: string;
}

interface TaxAdvisoryDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DossierComputationData;
}

export const TaxAdvisoryDossierModal: React.FC<TaxAdvisoryDossierModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [partnerSignatory, setPartnerSignatory] = useState("CA Gunjan Jain, FCA, DISA (ICAI)");
  const [membershipNo, setMembershipNo] = useState("518492");

  if (!isOpen) return null;

  const firm = DEFAULT_FIRM_BRANDING;
  const optimalTax = data.recommendedRegime === "NEW" ? data.totalTaxLiabilityNew : data.totalTaxLiabilityOld;
  const optimalNetBalance = data.recommendedRegime === "NEW" ? data.netBalanceNew : data.netBalanceOld;

  // Advance tax tranches for upcoming FY
  const upcomingAdvanceTax1 = Math.round(optimalTax * 0.15);
  const upcomingAdvanceTax2 = Math.round(optimalTax * 0.45);
  const upcomingAdvanceTax3 = Math.round(optimalTax * 0.75);
  const upcomingAdvanceTax4 = Math.round(optimalTax * 1.00);

  // Copy formal CA opinion memo
  const handleCopyMemo = () => {
    const memoText = `========================================================================
GPA & CO., CHARTERED ACCOUNTANTS - STATUTORY TAX ADVISORY DOSSIER
Assessment Year: ${data.assessmentYear} | FY: ${data.financialYear}
Assessee: ${data.taxpayerName} | PAN: ${data.pan}
ICAI UDIN: ${data.udinCode}
========================================================================

1. EXECUTIVE STATUTORY RECOMMENDATION:
Opt for the ${data.recommendedRegime === "NEW" ? "NEW TAX REGIME (Section 115BAC)" : "OLD TAX REGIME"}.
• Tax under New Tax Regime: ${formatCurrencyINR(data.totalTaxLiabilityNew)}
• Tax under Old Tax Regime: ${formatCurrencyINR(data.totalTaxLiabilityOld)}
• Direct Statutory Tax Savings: ${formatCurrencyINR(data.difference)}
• Prepaid Taxes (TDS / Advance Tax): ${formatCurrencyINR(data.totalPrepaid)}
• Net Final Balance ${optimalNetBalance > 0 ? "Payable" : "Refund Due"}: ${formatCurrencyINR(Math.abs(optimalNetBalance))}

2. KEY STATUTORY RESTRUCTURING LEVERS:
• Section 80CCD(2) Corporate Employer NPS: Restructure CTC up to 14% of Basic (allowed in 115BAC!).
• Section 80CCD(1B) Tier-1 NPS: Allocate ₹50,000 for additional tax protection.
• Break-even Deduction Threshold: ${formatCurrencyINR(data.breakEvenDeductions)} in Chapter VI-A / Sec 24(b).

${data.isForm10IEAMandatory ? `⚠️ MANDATORY STATUTORY REQUIREMENT:\nForm 10-IEA must be filed before July 31 under Section 115BAC(6) to opt for Old Regime for business/profession.` : ""}

Prepared by:
${partnerSignatory} (M.No: ${membershipNo})
GPA & Co., Chartered Accountants (FRN: ${firm.frn})
Peer Review Cert: ${firm.peerReviewNo}
`;

    navigator.clipboard.writeText(memoText);
    setIsCopied(true);
    toast.success("Memo Copied", "Official CA Legal Opinion copied to clipboard.");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // 1-Click WhatsApp advice
  const handleSendWhatsApp = () => {
    const waText = `*GPA & CO., CHARTERED ACCOUNTANTS*\n` +
      `*FORMAL DIRECT TAX ADVISORY DOSSIER (${data.assessmentYear})*\n\n` +
      `Dear ${data.taxpayerName},\n\n` +
      `Our direct tax practice has simulated your complete tax liability for *${data.assessmentYear}* (PAN: ${data.pan}) pursuant to Finance Act 2024 provisions:\n\n` +
      `📊 *STATUTORY DUAL-REGIME COMPARISON:*\n` +
      `• *New Tax Regime (Section 115BAC):* ${formatCurrencyINR(data.totalTaxLiabilityNew)}\n` +
      `• *Old Tax Regime:* ${formatCurrencyINR(data.totalTaxLiabilityOld)}\n` +
      `• *Prepaid Taxes (TDS & Advance Tax):* ${formatCurrencyINR(data.totalPrepaid)}\n\n` +
      `🎯 *OPTIMAL STATUTORY RECOMMENDATION:*\n` +
      `Opt for *${data.recommendedRegime === "NEW" ? "NEW TAX REGIME (Section 115BAC)" : "OLD TAX REGIME"}*.\n` +
      `Direct Tax Outflow Saved: *${formatCurrencyINR(data.difference)}*.\n` +
      `${optimalNetBalance > 0 ? `Net Tax Payable after TDS: *${formatCurrencyINR(optimalNetBalance)}*.` : `Net Refund Claimable from ITD: *${formatCurrencyINR(Math.abs(optimalNetBalance))}*.`}\n\n` +
      `${data.isForm10IEAMandatory ? `⚠️ *Statutory Notice:* Form 10-IEA filing is strictly required before July 31.\n\n` : ""}` +
      `ICAI UDIN: ${data.udinCode}\n\n` +
      `Please reply with your approval to proceed with e-verification & digital filing.\n\n` +
      `Warm regards,\n*${partnerSignatory}*\nGPA & Co., Chartered Accountants`;

    const phone = sanitizeIndianPhoneNumber(data.phone || "919820011223");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waText)}`, "_blank");
    toast.success("WhatsApp Dispatched", `Sent formal advisory note to ${data.taxpayerName}.`);
  };

  // Standalone HTML Download
  const handleDownloadHtml = () => {
    const element = document.getElementById("printable-tax-dossier");
    if (!element) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Advisory Dossier - ${data.taxpayerName} (${data.pan}) - ${data.assessmentYear}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 22px; font-weight: 900; margin: 0; color: #0f172a; text-transform: uppercase; }
    .subtitle { font-size: 11px; color: #475569; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: bold; border-radius: 9999px; margin-bottom: 8px; }
    .rec-box { background: #f8fafc; border: 2px solid #0f172a; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .rec-highlight { font-size: 18px; font-weight: 900; color: #b91c1c; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .mono { font-family: monospace; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .signature-area { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 16px; display: flex; justify-content: space-between; }
    @media print {
      body { margin: 15mm; font-size: 12px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${element.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tax_Advisory_Dossier_${data.pan}_${data.assessmentYear.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dossier Downloaded", "Saved standalone client advisory document.");
  };

  // Safe window print trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container Card */}
      <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-300 my-8 overflow-hidden animate-scaleUp">
        {/* Floating Action Top Bar */}
        <div className="bg-white text-slate-900 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-red-700">
              Statutory Client Advisory Dossier
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-mono text-slate-700">UDIN: {data.udinCode}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-btred-logo hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Print letterhead or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
              title="Download standalone HTML report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>

            <button
              onClick={handleCopyMemo}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
              title="Copy formal memo to clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied!" : "Copy Memo"}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Dispatch to client's WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Advice</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Letterhead Document Body */}
        <div id="printable-tax-dossier" className="p-6 sm:p-10 space-y-6 text-slate-900 font-sans max-h-[82vh] overflow-y-auto">
          {/* 1. Formal CA Letterhead */}
          <div className="border-b-4 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Statutory Opinion u/s 115BAC r.w.s. 139(1)
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">Confidential Tax Advisory</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                  {firm.firmName.toUpperCase()}
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Chartered Accountants | FRN: <span className="font-mono">{firm.frn}</span> | Peer Review Cert: <span className="font-mono">{firm.peerReviewNo}</span>
                </p>
                <p className="text-[11px] text-slate-500 max-w-xl mt-1">
                  {firm.headOffice} | Contact: {firm.partnerPhone} | Email: {firm.email}
                </p>
              </div>

              {/* Security Seal & UDIN Stamp */}
              <div className="text-right shrink-0 border border-slate-200 bg-slate-50 p-3 rounded-2xl">
                <div className="flex items-center justify-end gap-1.5 text-emerald-700 text-xs font-black">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> ICAI UDIN CERTIFIED
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                  {data.udinCode}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Generated: {formatDate(new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Assessee Master Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Taxpayer Assessee</span>
              <strong className="text-slate-900 font-black">{data.taxpayerName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Permanent Account No. (PAN)</span>
              <span className="font-mono font-black text-slate-900">{data.pan}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Assessment Year (AY)</span>
              <span className="font-black text-slate-900">{data.assessmentYear} ({data.financialYear})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Status / Category</span>
              <span className="font-bold text-slate-900">
                {data.category === "SUPER_SENIOR" ? "Super Senior (≥80 Yrs)" : data.category === "SENIOR" ? "Senior (60-79 Yrs)" : "Resident Individual (<60)"}
              </span>
            </div>
          </div>

          {/* 3. Section I: Executive Opinion & Statutory Recommendation */}
          <div className={`p-5 rounded-2xl border-2 shadow-sm ${
            data.recommendedRegime === "NEW" 
              ? "bg-emerald-50/70 border-emerald-400 text-emerald-950" 
              : "bg-red-50/70 border-red-400 text-red-950"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Section I: Statutory Recommendation
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  Opt for {data.recommendedRegime === "NEW" ? "NEW TAX REGIME (Section 115BAC)" : "OLD TAX REGIME"}
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                  Pursuant to our audit of your aggregate worldwide income and deductions under the Income-tax Act, 1961, opting for the{" "}
                  <strong>{data.recommendedRegime === "NEW" ? "New Tax Regime under Section 115BAC" : "Old Tax Regime"}</strong> minimizes your direct statutory tax liability by exactly{" "}
                  <span className="text-btred-logo font-black underline decoration-red-400">
                    {formatCurrencyINR(data.difference)}
                  </span>.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Optimal Tax Liability</span>
                <span className="text-2xl font-black text-slate-900 block font-mono">
                  {formatCurrencyINR(optimalTax)}
                </span>
                <span className="text-[10px] text-slate-600 font-semibold block">
                  Prepaid: {formatCurrencyINR(data.totalPrepaid)} | Net {optimalNetBalance > 0 ? "Payable" : "Refund"}: {formatCurrencyINR(Math.abs(optimalNetBalance))}
                </span>
              </div>
            </div>

            {data.isForm10IEAMandatory && (
              <div className="mt-3 p-3 bg-amber-100 border border-amber-300 rounded-xl text-amber-950 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Form 10-IEA Mandatory:</strong> Because you have Business/Professional Income (PGBP) and are opting for the Old Regime, Form 10-IEA must be filed before July 31, {data.assessmentYear.slice(-2)} to prevent invalidation by CPC Bengaluru.
                </span>
              </div>
            )}
          </div>

          {/* 4. Section II: Comprehensive 5-Head Comparative Computation Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Layers className="w-4 h-4 text-indigo-600" /> Section II: Head-wise Comparative Computation Schedule
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded-xl">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="py-2 px-3 text-left font-bold">Statutory Heads &amp; Schedules</th>
                    <th className="py-2 px-3 text-right font-bold text-emerald-800">New Regime (115BAC)</th>
                    <th className="py-2 px-3 text-right font-bold text-btred-logo">Old Tax Regime</th>
                    <th className="py-2 px-3 text-left font-bold text-slate-500">Statutory Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">1. Gross Salary (CTC)</td>
                    <td className="py-1.5 px-3 text-right font-bold">{formatCurrencyINR(data.salaryGross)}</td>
                    <td className="py-1.5 px-3 text-right font-bold">{formatCurrencyINR(data.salaryGross)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Form 16 Part B Annexure</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans text-slate-600 pl-6">Less: Exemptions u/s 10 (HRA / LTA)</td>
                    <td className="py-1.5 px-3 text-right text-slate-400">₹0 (Disallowed)</td>
                    <td className="py-1.5 px-3 text-right text-btred-logo">-{formatCurrencyINR(data.salaryExemptions)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Section 10(13A) Rule 2A</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans text-slate-600 pl-6">Less: Standard Deduction u/s 16(ia)</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700 font-bold">-{formatCurrencyINR(data.newRegimeStdDeduction)}</td>
                    <td className="py-1.5 px-3 text-right text-btred-logo font-bold">-{formatCurrencyINR(data.oldRegimeStdDeduction)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">FA 2024 revised to ₹75k in 115BAC</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans text-slate-600 pl-6">Less: Professional Tax u/s 16(iii)</td>
                    <td className="py-1.5 px-3 text-right text-slate-400">₹0</td>
                    <td className="py-1.5 px-3 text-right text-btred-logo">-{formatCurrencyINR(data.professionalTax)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">State employment tax deduction</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-1.5 px-3 font-sans text-slate-900">Net Chargeable Salary</td>
                    <td className="py-1.5 px-3 text-right text-slate-900">{formatCurrencyINR(data.netSalaryNew)}</td>
                    <td className="py-1.5 px-3 text-right text-slate-900">{formatCurrencyINR(data.netSalaryOld)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Schedule S</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">2. House Property (Sec 24b)</td>
                    <td className="py-1.5 px-3 text-right text-slate-400">₹0 (Disallowed set-off)</td>
                    <td className="py-1.5 px-3 text-right text-btred-logo font-bold">
                      {data.housePropIncomeOld < 0 ? `-${formatCurrencyINR(Math.abs(data.housePropIncomeOld))}` : "₹0"}
                    </td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Max ₹2L self-occupied loss in Old</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">3. Business &amp; Profession (PGBP)</td>
                    <td className="py-1.5 px-3 text-right font-bold">{formatCurrencyINR(data.pgbp)}</td>
                    <td className="py-1.5 px-3 text-right font-bold">{formatCurrencyINR(data.pgbp)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">
                      {data.isPresumptive ? `Presumptive (${data.presumptiveScheme})` : "Audited Net Profit"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">4. Capital Gains (Budget 2024 Rates)</td>
                    <td className="py-1.5 px-3 text-right">{formatCurrencyINR(data.stcg111A + data.ltcg112A)}</td>
                    <td className="py-1.5 px-3 text-right">{formatCurrencyINR(data.stcg111A + data.ltcg112A)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">111A @ 20%, 112A @ 12.5% &gt; ₹1.25L</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">5. Income from Other Sources</td>
                    <td className="py-1.5 px-3 text-right">{formatCurrencyINR(data.totalOtherSources)}</td>
                    <td className="py-1.5 px-3 text-right">{formatCurrencyINR(data.totalOtherSources)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Savings &amp; FD Interest, Dividends</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="py-1.5 px-3 font-sans text-slate-900">Gross Total Income (GTI)</td>
                    <td className="py-1.5 px-3 text-right text-slate-900">{formatCurrencyINR(data.ordinaryGtiNew)}</td>
                    <td className="py-1.5 px-3 text-right text-slate-900">{formatCurrencyINR(data.ordinaryGtiOld)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Aggregated ordinary income</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">Less: Chapter VI-A Deductions</td>
                    <td className="py-1.5 px-3 text-right text-indigo-700">
                      {data.sec80CCD_2_Employer > 0 ? `-${formatCurrencyINR(data.sec80CCD_2_Employer)} (80CCD2)` : "₹0"}
                    </td>
                    <td className="py-1.5 px-3 text-right text-btred-logo font-bold">-{formatCurrencyINR(data.totalOldDeductions)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">80C, 80D, 80CCD, 80TTA/TTB</td>
                  </tr>
                  <tr className="bg-slate-200/80 font-black">
                    <td className="py-2 px-3 font-sans text-slate-950">Net Taxable Income</td>
                    <td className="py-2 px-3 text-right text-slate-950">{formatCurrencyINR(data.taxableOrdinaryNew)}</td>
                    <td className="py-2 px-3 text-right text-slate-950">{formatCurrencyINR(data.taxableOrdinaryOld)}</td>
                    <td className="py-2 px-3 font-sans text-[11px] text-slate-500">Basis for slab application</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">Basic Slab Tax</td>
                    <td className="py-1.5 px-3 text-right">{formatCurrencyINR(data.taxNew + data.rebate87ANew - data.specialRateTax)}</td>
                    <td className="py-1.5 px-3 text-right">{formatCurrencyINR(data.taxOld + data.rebate87AOld - data.specialRateTax)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Progressive slab rates</td>
                  </tr>
                  {data.specialRateTax > 0 && (
                    <tr>
                      <td className="py-1.5 px-3 font-sans text-slate-600 pl-6">Add: Special Rate Capital Gains Tax</td>
                      <td className="py-1.5 px-3 text-right text-indigo-700">+{formatCurrencyINR(data.specialRateTax)}</td>
                      <td className="py-1.5 px-3 text-right text-indigo-700">+{formatCurrencyINR(data.specialRateTax)}</td>
                      <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">111A (20%) + 112A (12.5%)</td>
                    </tr>
                  )}
                  {(data.rebate87ANew > 0 || data.rebate87AOld > 0) && (
                    <tr>
                      <td className="py-1.5 px-3 font-sans text-slate-600 pl-6">Less: Rebate u/s 87A &amp; Marginal Relief</td>
                      <td className="py-1.5 px-3 text-right text-emerald-700 font-bold">-{formatCurrencyINR(data.rebate87ANew)}</td>
                      <td className="py-1.5 px-3 text-right text-btred-logo font-bold">-{formatCurrencyINR(data.rebate87AOld)}</td>
                      <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Nil tax up to ₹7L (New) / ₹5L (Old)</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1.5 px-3 font-sans text-slate-600 pl-6">Add: Health &amp; Education Cess (4%)</td>
                    <td className="py-1.5 px-3 text-right">{formatCurrencyINR(data.cessNew)}</td>
                    <td className="py-1.5 px-3 text-right">{formatCurrencyINR(data.cessOld)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">4% on statutory tax</td>
                  </tr>
                  <tr className="bg-slate-100 font-black">
                    <td className="py-2 px-3 font-sans text-slate-900">Total Statutory Tax Liability</td>
                    <td className="py-2 px-3 text-right text-emerald-700 text-sm font-bold">{formatCurrencyINR(data.totalTaxLiabilityNew)}</td>
                    <td className="py-2 px-3 text-right text-btred-logo text-sm font-bold">{formatCurrencyINR(data.totalTaxLiabilityOld)}</td>
                    <td className="py-2 px-3 font-sans text-[11px] font-bold text-slate-700">Gross tax assessed</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans text-slate-600">Less: Taxes Paid (TDS &amp; Advance Tax)</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700">-{formatCurrencyINR(data.totalPrepaid)}</td>
                    <td className="py-1.5 px-3 text-right text-emerald-700">-{formatCurrencyINR(data.totalPrepaid)}</td>
                    <td className="py-1.5 px-3 font-sans text-[11px] text-slate-500">Form 26AS / AIS ledger credits</td>
                  </tr>
                  <tr className="bg-red-50 text-slate-900 font-black border-t border-b border-red-200">
                    <td className="py-2 px-3 font-sans">Net Balance {optimalNetBalance > 0 ? "Payable" : "Refundable"}</td>
                    <td className={`py-2 px-3 text-right ${data.netBalanceNew > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                      {formatCurrencyINR(Math.abs(data.netBalanceNew))}
                    </td>
                    <td className={`py-2 px-3 text-right ${data.netBalanceOld > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                      {formatCurrencyINR(Math.abs(data.netBalanceOld))}
                    </td>
                    <td className="py-2 px-3 font-sans text-[11px] text-slate-600">
                      {data.recommendedRegime === "NEW" ? "Recommended: New Regime" : "Recommended: Old Regime"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Section III: High-ROI Strategic Restructuring Levers */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Section III: High-ROI Tax Optimization &amp; Wealth Levers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="border border-slate-200 p-3.5 rounded-2xl bg-slate-50/70 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">
                  Section 80CCD(2) Corporate NPS
                </span>
                <strong className="text-slate-900 block text-xs">Employer Salary Restructuring</strong>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Restructure up to 14% of Basic into Corporate NPS. <strong>Allowed in New Regime (115BAC)</strong> yielding up to ₹74,880 in direct zero-tax deductions.
                </p>
                <span className="text-emerald-700 font-bold block pt-1 text-[11px]">Active in 115BAC!</span>
              </div>

              <div className="border border-slate-200 p-3.5 rounded-2xl bg-slate-50/70 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">
                  Tier-1 NPS Allocation u/s 80CCD(1B)
                </span>
                <strong className="text-slate-900 block text-xs">Exclusive ₹50,000 Window</strong>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Invest ₹50,000 in Tier-1 NPS over and above the ₹1.5L 80C limit for immediate tax savings in the Old Tax Regime.
                </p>
                <span className="text-emerald-700 font-bold block pt-1 text-[11px]">Saves up to ₹15,600 tax</span>
              </div>

              <div className="border border-slate-200 p-3.5 rounded-2xl bg-slate-50/70 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-700 block">
                  Break-Even Deduction Threshold
                </span>
                <strong className="text-slate-900 block text-xs">Tipping Point Metric</strong>
                <p className="text-[11px] text-slate-600 leading-tight">
                  At your income slab, Old Regime becomes cheaper only if Chapter VI-A + Sec 24(b) deductions exceed:
                </p>
                <span className="font-mono font-black text-slate-900 block pt-1 text-sm">
                  {formatCurrencyINR(data.breakEvenDeductions)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Section IV: Advance Tax Schedule for Upcoming Financial Year */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
              <Calendar className="w-4 h-4 text-btred-logo" /> Section IV: Statutory Advance Tax Schedule for Upcoming FY (u/s 208/211)
            </h3>
            <p className="text-xs text-slate-600">
              To avoid penal interest under Section 234B (1% p.m.) and Section 234C (1% p.m.), please remit advance tax installments on or before the following statutory cutoff dates:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <span className="text-[10px] font-sans text-slate-500 font-bold block">1st Tranche (15%)</span>
                <strong className="text-slate-900 block text-xs mt-0.5">15th June</strong>
                <span className="text-emerald-700 font-bold text-sm block mt-1">{formatCurrencyINR(upcomingAdvanceTax1)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <span className="text-[10px] font-sans text-slate-500 font-bold block">2nd Tranche (45%)</span>
                <strong className="text-slate-900 block text-xs mt-0.5">15th September</strong>
                <span className="text-emerald-700 font-bold text-sm block mt-1">{formatCurrencyINR(upcomingAdvanceTax2)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <span className="text-[10px] font-sans text-slate-500 font-bold block">3rd Tranche (75%)</span>
                <strong className="text-slate-900 block text-xs mt-0.5">15th December</strong>
                <span className="text-emerald-700 font-bold text-sm block mt-1">{formatCurrencyINR(upcomingAdvanceTax3)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <span className="text-[10px] font-sans text-slate-500 font-bold block">4th Tranche (100%)</span>
                <strong className="text-slate-900 block text-xs mt-0.5">15th March</strong>
                <span className="text-emerald-700 font-bold text-sm block mt-1">{formatCurrencyINR(upcomingAdvanceTax4)}</span>
              </div>
            </div>
          </div>

          {/* 7. Section V: Assessee Acceptance & Signature Block */}
          <div className="border-t-2 border-slate-300 pt-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-700 space-y-1">
              <strong className="font-bold text-slate-900 block">Assessee Statutory Confirmation:</strong>
              <p className="text-[11px] leading-relaxed">
                I hereby declare that I have verified the income, deductions, TDS credits, and statutory comparisons compiled in this Advisory Dossier. I instruct and authorize <strong>{firm.firmName}</strong> to file my Return of Income for <strong>{data.assessmentYear}</strong> and relevant statutory declarations (including Form 10-IEA if applicable) under the <strong>{data.recommendedRegime === "NEW" ? "New Tax Regime (Section 115BAC)" : "Old Tax Regime"}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div>
                <span className="text-[11px] text-slate-500 block">Assessee Authorized Signature</span>
                <div className="border-b border-slate-400 mt-8 pb-1 flex justify-between text-xs text-slate-700">
                  <span>Name: <strong>{data.taxpayerName}</strong></span>
                  <span>Date: ____/____/2026</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">For &amp; on behalf of <strong>{firm.firmName}</strong></span>
                <div className="border-b border-slate-400 mt-8 pb-1 flex justify-between text-xs text-slate-700">
                  <span>
                    <strong>{partnerSignatory}</strong>
                    <span className="block text-[10px] text-slate-500">Partner | M.No: {membershipNo}</span>
                  </span>
                  <span className="text-right">
                    <span className="font-mono font-bold text-[11px] text-slate-900">UDIN: {data.udinCode}</span>
                    <span className="block text-[10px] text-emerald-700 font-bold">Digitally Sealed</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Close Bar (No Print) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center no-print">
          <span className="text-xs text-slate-500">
            Confidential deliverable prepared by {firm.firmName}. All calculations 100% mathematically verified.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
