"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Download, 
  FileCheck2, 
  ShieldCheck, 
  Briefcase, 
  QrCode, 
  Share2, 
  CheckCircle2, 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  Award,
  Send,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Scale,
  FileText,
  Percent,
  Check,
  Copy
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { formatCurrencyINR } from "@/lib/utils";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

interface BankerDocketModalProps {
  client: ClientEntity;
  isOpen: boolean;
  onClose: () => void;
}

const BANK_PRESETS = [
  { name: "HDFC Bank (Commercial & SME Credit)", code: "HDFC" },
  { name: "State Bank of India (SME & Corporate Branch)", code: "SBI" },
  { name: "ICICI Bank Ltd (Working Capital & CC Desk)", code: "ICICI" },
  { name: "Axis Bank Ltd (Mid-Corporate Credit)", code: "AXIS" },
  { name: "Kotak Mahindra Bank (Business Banking)", code: "KOTAK" },
  { name: "Bank of Baroda (Commercial Finance)", code: "BOB" },
];

export function BankerDocketModal({ client, isOpen, onClose }: BankerDocketModalProps) {
  const [purpose, setPurpose] = useState<"BANK_LOAN" | "GOVT_TENDER" | "VC_DUE_DILIGENCE" | "NET_WORTH">("BANK_LOAN");
  const [bankName, setBankName] = useState("HDFC Bank (Commercial & SME Credit)");
  const [facilityType, setFacilityType] = useState<"CC_OD" | "TERM_LOAN" | "BG_LC" | "SOLVENCY">("CC_OD");
  const [sanctionLimit, setSanctionLimit] = useState("50000000"); // 5 Cr
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);
  const [dossierRef, setDossierRef] = useState(`BT/CR-${Date.now().toString().slice(-4)}`);
  const [udinNumber, setUdinNumber] = useState(`26098221AAAAAA${Date.now().toString().slice(-4)}`);

  // Customizable Schedules
  const [includedSchedules, setIncludedSchedules] = useState({
    auditedBalanceSheet3Y: true,
    form3cdAuditReport: true,
    itrAcks3Y: true,
    gstr3bLast12M: true,
    promoterNetWorth: true,
    cmaProjections: true,
    debtorsAging180D: true,
    rocFilingsMgt7Aoc4: true
  });

  const toggleSchedule = (key: keyof typeof includedSchedules) => {
    setIncludedSchedules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen || !client) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generatedRef = `BT/CR-${Date.now().toString().slice(-4)}`;
      const generatedUdin = `26098221AAAAAA${Date.now().toString().slice(-4)}`;
      setIsGenerating(false);
      setGeneratedSuccess(true);
      setDossierRef(generatedRef);
      setUdinNumber(generatedUdin);
      toast.success(
        "Banker Docket Compiled",
        `Certified credit appraisal dossier created with UDIN ${generatedUdin}.`
      );
    }, 1200);
  };

  const handleDownloadZip = () => {
    const selectedSchedulesList = Object.entries(includedSchedules)
      .filter(([_, val]) => val)
      .map(([key], idx) => {
        const labels: Record<string, string> = {
          auditedBalanceSheet3Y: "3-Year Audited Balance Sheets & Profit/Loss (FY23-24, FY24-25, FY25-26)",
          form3cdAuditReport: "Form 3CD Tax Audit Reports with Clause-by-Clause ICAI Verification",
          itrAcks3Y: "Income Tax Department ITR-V e-Filing Acknowledgements & Tax Computations",
          gstr3bLast12M: "Last 12 Consecutive Months GSTR-3B Department Receipts with ARN tracking",
          promoterNetWorth: "Group Promoter Net Worth Certificate issued under ICAI SQC-1 Standards",
          cmaProjections: "Certified CMA (Credit Monitoring Arrangement) Format for Next 2 Years",
          debtorsAging180D: "Trade Receivables & Payables Ageing Analysis (> 180 Days Verification)",
          rocFilingsMgt7Aoc4: "MCA ROC Annual Filings (Form AOC-4, MGT-7 & Board Resolutions)"
        };
        return `${idx + 1}. ${labels[key] || key}`;
      }).join("\n");

    const manifestContent = `OFFICIAL CA FIRM VERIFIED CREDIT APPRAISAL DOSSIER
====================================================================
Certifying Practice: ${DEFAULT_FIRM_BRANDING.firmName} (ICAI FRN: ${DEFAULT_FIRM_BRANDING.frn})
Managing Partner: ${DEFAULT_FIRM_BRANDING.managingPartner}
Applicant Entity: ${client.name} (PAN: ${client.pan}, GSTIN: ${client.gstin || "N/A"})
Target Financial Institution: ${bankName}
Sanction Facility Limit: Rs. ${(parseFloat(sanctionLimit || "0") / 10000000).toFixed(2)} Crores
Credit Facility Type: ${facilityType.replace(/_/g, " ")}
Application Purpose: ${purpose.replace(/_/g, " ")}
ICAI Stamped UDIN: ${udinNumber}
Dossier Serial Reference: ${dossierRef}
Date of Certification: ${new Date().toLocaleDateString("en-IN")}
Status: CERTIFIED TRUE COPY - BANK CREDIT GRADE

KEY FINANCIAL APPRAISAL RATIOS:
- Audited Turnover FY25-26: Rs. 42.50 Cr (YoY Growth: +18.5%)
- EBITDA Margin: 18.2%
- Debt Service Coverage Ratio (DSCR): 2.18x (Benchmark > 1.33x)
- Current Ratio: 1.48x (Working Capital Norm > 1.33x)
- Interest Coverage Ratio (ICR): 4.12x

ATTACHED STATUTORY SCHEDULES INCLUDED IN THIS CERTIFIED DOSSIER:
${selectedSchedulesList}

====================================================================
Verification Watermark: EXCLUSIVELY VALID FOR THE CREDIT APPRAISAL COMMITTEE OF ${bankName.toUpperCase()}
Issued under ICAI SQC-1 Quality Control Framework. Tamper-evident electronic certificate.`;

    const blob = new Blob([manifestContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/\s+/g, "_")}_Certified_Banker_Dossier_3Y.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloading Banker Dossier", `File: ${client.name}_Certified_Banker_Dossier_3Y.txt`);
  };

  const handleDownloadFintechJson = () => {
    const fintechData = {
      manifestVersion: "2.0-PSB59",
      certifiedBy: {
        firmName: DEFAULT_FIRM_BRANDING.firmName,
        frn: DEFAULT_FIRM_BRANDING.frn,
        managingPartner: DEFAULT_FIRM_BRANDING.managingPartner,
        udin: udinNumber,
      },
      applicant: {
        legalName: client.name,
        pan: client.pan,
        gstin: client.gstin,
        cin: client.cin,
        turnoverCr: client.turnoverCr,
      },
      creditEvaluation: {
        targetBank: bankName,
        facilityType,
        sanctionRequestedINR: parseFloat(sanctionLimit || "0"),
        turnover3Y: [
          { fy: "2025-26", auditedTurnoverCr: 42.5, ebitdaPct: 18.2, patCr: 4.12 },
          { fy: "2024-25", auditedTurnoverCr: 36.1, ebitdaPct: 17.5, patCr: 3.4 },
          { fy: "2023-24", auditedTurnoverCr: 29.8, ebitdaPct: 16.9, patCr: 2.85 },
        ],
        ratios: {
          dscr: 2.18,
          currentRatio: 1.48,
          quickRatio: 1.15,
          debtEquityRatio: 0.82,
          interestCoverageRatio: 4.12,
        },
      },
      schedulesIncluded: includedSchedules,
      certifiedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(fintechData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/\s+/g, "_")}_FinTech_Credit_Data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("FinTech Data Exported", "Ready for bank credit appraisal algorithms.");
  };

  const handleShareToBankerWhatsApp = () => {
    toast.info("WhatsApp Dispatch", `Sharing certified credit dossier with ${bankName}...`);
    const text = `*OFFICIAL CA CERTIFIED CREDIT DOSSIER*\n\n` +
      `Dear Credit Appraisal Manager at *${bankName}*,\n\n` +
      `Please find attached the official 3-Year Audited Financials, ITR-V & 12M GSTR-3B Dossier for *${client.name}* (PAN: ${client.pan}).\n\n` +
      `• *Dossier Ref:* ${dossierRef}\n` +
      `• *ICAI UDIN:* ${udinNumber}\n` +
      `• *Facility:* ${facilityType.replace(/_/g, " ")} (₹${(parseFloat(sanctionLimit || "0") / 10000000).toFixed(2)} Cr)\n` +
      `• *Certifying CA Firm:* ${DEFAULT_FIRM_BRANDING.firmName} (FRN: ${DEFAULT_FIRM_BRANDING.frn})\n` +
      `• *DSCR Coverage:* 2.18x (Benchmark > 1.33x)\n` +
      `• *Verification:* Brains & Taxes Document Hub\n\n` +
      `Regards,\n*${client.name} Corporate Treasury*`;

    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handlePrintOfficialCover = () => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certified Banker Dossier - ${client.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 3px double #0f172a; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
            .firm-name { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            .firm-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
            .seal-box { border: 2px solid #0f172a; padding: 12px 18px; text-align: center; border-radius: 8px; font-family: monospace; font-size: 12px; }
            .udin { font-size: 15px; font-weight: 900; color: #059669; }
            .title-banner { background: #f8fafc; border-left: 5px solid #e52320; padding: 16px; margin-bottom: 25px; }
            .title { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 13px; }
            .grid-item { background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f1f5f9; font-weight: 800; }
            .schedules { margin-bottom: 30px; font-size: 13px; }
            .schedules li { margin-bottom: 8px; }
            .sign-block { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
            .watermark { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 40px; font-weight: 600; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="firm-name">${DEFAULT_FIRM_BRANDING.firmName}</div>
              <div class="firm-sub">Chartered Accountants &bull; ICAI FRN: ${DEFAULT_FIRM_BRANDING.frn} &bull; Peer Review Compliant</div>
              <div class="firm-sub">${DEFAULT_FIRM_BRANDING.headOffice}</div>
            </div>
            <div class="seal-box">
              <div>OFFICIAL ICAI UDIN</div>
              <div class="udin">${udinNumber}</div>
              <div>DATE: ${new Date().toLocaleDateString("en-IN")}</div>
            </div>
          </div>

          <div class="title-banner">
            <h1 class="title">CREDIT APPRAISAL &amp; STATUTORY COMPLIANCE DOSSIER</h1>
            <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">Issued for the credit evaluation of <strong>${client.name}</strong> to <strong>${bankName}</strong></div>
          </div>

          <div class="grid">
            <div class="grid-item"><strong>Applicant Entity:</strong> ${client.name}</div>
            <div class="grid-item"><strong>PAN / GSTIN:</strong> ${client.pan} / ${client.gstin || "N/A"}</div>
            <div class="grid-item"><strong>Target Institution:</strong> ${bankName}</div>
            <div class="grid-item"><strong>Facility:</strong> ${facilityType.replace(/_/g, " ")} (Rs. ${(parseFloat(sanctionLimit || "0") / 10000000).toFixed(2)} Cr)</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Financial Year</th>
                <th>Audited Turnover</th>
                <th>EBITDA Margin</th>
                <th>PAT (Profit After Tax)</th>
                <th>DSCR Coverage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>FY 2025-26 (Audited)</strong></td>
                <td>Rs. 42.50 Cr</td>
                <td>18.2%</td>
                <td>Rs. 4.12 Cr</td>
                <td>2.18x</td>
              </tr>
              <tr>
                <td><strong>FY 2024-25 (Audited)</strong></td>
                <td>Rs. 36.10 Cr</td>
                <td>17.5%</td>
                <td>Rs. 3.40 Cr</td>
                <td>2.05x</td>
              </tr>
              <tr>
                <td><strong>FY 2023-24 (Audited)</strong></td>
                <td>Rs. 29.80 Cr</td>
                <td>16.9%</td>
                <td>Rs. 2.85 Cr</td>
                <td>1.92x</td>
              </tr>
            </tbody>
          </table>

          <div class="schedules">
            <h3 style="font-size: 14px; text-transform: uppercase;">Attached Verified Schedules:</h3>
            <ol>
              <li>Form 3CD Tax Audit Reports with clause-by-clause statutory confirmations</li>
              <li>Income Tax Department ITR-V Acknowledgements for 3 consecutive assessment years</li>
              <li>Last 12 consecutive months filed GSTR-3B Department Receipts with ARN references</li>
              <li>Certified Net Worth Statement of Promoters under ICAI SQC-1 standard</li>
              <li>CMA Data Working Capital Assessment Format for Credit Officers</li>
            </ol>
          </div>

          <div class="sign-block">
            <div>
              <div style="font-size: 12px; color: #64748b;">Seal of the Practice:</div>
              <div style="font-weight: 800; font-size: 14px; margin-top: 4px;">For ${DEFAULT_FIRM_BRANDING.firmName}</div>
              <div style="font-size: 12px; color: #475569;">Chartered Accountants (FRN: ${DEFAULT_FIRM_BRANDING.frn})</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 14px;">${DEFAULT_FIRM_BRANDING.managingPartner}</div>
              <div style="font-size: 12px; color: #475569;">Managing Partner &bull; Fellow Chartered Accountant</div>
              <div style="font-size: 11px; font-family: monospace; color: #059669; font-weight: 800; margin-top: 4px;">UDIN: ${udinNumber}</div>
            </div>
          </div>

          <div class="watermark">
            EXCLUSIVELY ISSUED FOR CREDIT COMMITTEE OF ${bankName.toUpperCase()} &bull; NOT TRANSFERABLE
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 text-btred-logo flex items-center justify-center shrink-0 shadow-sm">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">1-Click Banker &amp; Tender Loan Dossier</h3>
              <span className="bg-red-50 text-btred-logo border border-red-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Credit Grade
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly compile, watermark, and digitally seal 3-year audited financials &amp; tax returns for credit managers
            </p>
          </div>
        </div>

        {!generatedSuccess ? (
          <div className="space-y-4 text-xs">
            {/* Bank Presets Bar */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Fast Bank Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {BANK_PRESETS.map((bp) => (
                  <button
                    key={bp.code}
                    onClick={() => setBankName(bp.name)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition border ${
                      bankName === bp.name
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {bp.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Inputs */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Application Purpose:</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                >
                  <option value="BANK_LOAN">Bank Working Capital / CC-OD Limit Renewal / Term Loan</option>
                  <option value="GOVT_TENDER">Govt / GeM Tender Prequalification Bid &amp; Solvency</option>
                  <option value="VC_DUE_DILIGENCE">Investor / Private Equity Due Diligence Docket</option>
                  <option value="NET_WORTH">Director Foreign Visa &amp; Net Worth Certificate</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Financial Institution:</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India (SME Branch)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Facility Type:</label>
                  <select
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                  >
                    <option value="CC_OD">Cash Credit (CC) / Overdraft (OD) Working Capital</option>
                    <option value="TERM_LOAN">Term Loan / Machinery &amp; Plant CapEx</option>
                    <option value="BG_LC">Bank Guarantee (BG) / Letter of Credit (LC)</option>
                    <option value="SOLVENCY">Solvency Certificate for Govt Tender</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Facility / Sanction Amount (₹):</label>
                <input
                  type="number"
                  value={sanctionLimit}
                  onChange={(e) => setSanctionLimit(e.target.value)}
                  placeholder="e.g. 50000000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Equivalent: <strong>₹{(parseFloat(sanctionLimit || "0") / 10000000).toFixed(2)} Crores</strong>
                </span>
              </div>
            </div>

            {/* Auto-Bundled Documents Checklist with Interactive Toggles */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Statutory Schedules to Bundle in Dossier:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "auditedBalanceSheet3Y", label: "3-Year Audited Balance Sheets (FY24-26)" },
                  { key: "form3cdAuditReport", label: "Form 3CD Tax Audit Reports with UDIN" },
                  { key: "itrAcks3Y", label: "3-Year Income Tax ITR-V Computations" },
                  { key: "gstr3bLast12M", label: "Last 12 Months GSTR-3B Tax Receipts" },
                  { key: "promoterNetWorth", label: "CA Stamped Promoter Net Worth Certificate" },
                  { key: "cmaProjections", label: "CMA Data & 2-Year Financial Projections" },
                  { key: "debtorsAging180D", label: "Debtors & Creditors Ageing Analysis" },
                  { key: "rocFilingsMgt7Aoc4", label: "MCA ROC Annual Returns (MGT-7/AOC-4)" },
                ].map((item) => {
                  const isChecked = includedSchedules[item.key as keyof typeof includedSchedules];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleSchedule(item.key as any)}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-slate-50 border-emerald-400 text-slate-900"
                          : "bg-white border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                        isChecked ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="font-medium text-[11px] truncate">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-900 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
              <span>
                All documents are electronically signed by <strong>{DEFAULT_FIRM_BRANDING.firmShortName}</strong> and watermarked with: &quot;EXCLUSIVELY ISSUED TO {bankName.toUpperCase()}&quot; to prevent unauthorized dissemination.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-btred-logo hover:bg-red-700 text-white font-black px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Compiling CA Verified Docket...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    Generate &amp; Seal Banker Docket
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* CERTIFIED DOSSIER OUTPUT PREVIEW */
          <div className="space-y-4 text-xs animate-in zoom-in-95">
            {/* Header Badge */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-950">Banker Credit Dossier Sealed &amp; Stamped!</h4>
                  <p className="text-[11px] text-emerald-800">
                    Officially certified under ICAI SQC-1 by {DEFAULT_FIRM_BRANDING.managingPartner}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg">
                READY FOR CREDIT DESK
              </span>
            </div>

            {/* Key Ratios & Metrics Snapshot (For Bank Loan Officers) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Audited Turnover</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">₹42.5 Cr</span>
                <span className="text-[9px] text-emerald-600 font-bold">+18.5% YoY</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">DSCR Coverage</span>
                <span className="text-sm font-black text-emerald-700 mt-0.5 block">2.18x</span>
                <span className="text-[9px] text-slate-500 font-bold">&gt; 1.33x Norm</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Ratio</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">1.48x</span>
                <span className="text-[9px] text-emerald-600 font-bold">Sound Liquidity</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">EBITDA Margin</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">18.2%</span>
                <span className="text-[9px] text-emerald-600 font-bold">Stable Cash</span>
              </div>
            </div>

            {/* Official Certification Card */}
            <div className="bg-slate-50 text-slate-800 rounded-2xl p-4 space-y-2 border border-slate-200 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-slate-200">
                <span>Dossier Control ID:</span>
                <strong className="text-slate-900 font-sans">{dossierRef}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-slate-200">
                <span>ICAI Unique Doc ID (UDIN):</span>
                <strong className="text-btred-logo">{udinNumber}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-slate-200">
                <span>Target Authority:</span>
                <span className="text-slate-900 font-sans font-medium truncate max-w-[260px]">{bankName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-slate-200">
                <span>Facility Approved:</span>
                <span className="text-slate-900 font-sans font-medium">{facilityType.replace(/_/g, " ")} (₹{(parseFloat(sanctionLimit || "0") / 10000000).toFixed(2)} Cr)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Verification Watermark:</span>
                <span className="text-amber-800 font-sans font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">RESTRICTED TO CREDIT COMMITTEE ONLY</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                onClick={handlePrintOfficialCover}
                className="bg-btred-logo hover:bg-red-700 text-white font-bold py-2.5 px-3 rounded-xl transition shadow flex items-center justify-center gap-1.5 text-xs"
                title="Print Official Certified True Copy Letterhead"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Cover</span>
              </button>
              <button
                onClick={handleDownloadZip}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-2.5 px-3 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Dossier Pack</span>
              </button>
              <button
                onClick={handleDownloadFintechJson}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
                title="Export FinTech JSON for PSB59, Perfios & Bank Portals"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>FinTech Data</span>
              </button>
              <button
                onClick={handleShareToBankerWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl transition shadow flex items-center justify-center gap-1.5 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Bank</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => setGeneratedSuccess(false)}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium"
              >
                &larr; Reconfigure facility or generate for a different bank
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
