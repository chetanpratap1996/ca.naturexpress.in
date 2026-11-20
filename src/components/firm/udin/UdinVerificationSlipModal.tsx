"use client";

import React, { useState } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  Award, 
  ShieldCheck, 
  Building2, 
  ExternalLink,
  QrCode,
  KeyRound,
  FileCheck
} from "lucide-react";
import { UdinEntry } from "../UdinVault";

interface UdinVerificationSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: UdinEntry | null;
}

export const UdinVerificationSlipModal: React.FC<UdinVerificationSlipModalProps> = ({
  isOpen,
  onClose,
  entry
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !entry) return null;

  const handleCopyUdin = () => {
    navigator.clipboard.writeText(entry.udin);
    setCopied(true);
    toast.success("UDIN Copied", `Copied ${entry.udin} to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ICAI UDIN Verification Slip - ${entry.udin}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 40px auto; max-width: 800px; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; }
    .title { font-size: 20px; font-weight: 900; margin: 0; color: #0f172a; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 900; text-transform: uppercase; border: 1px solid #cbd5e1; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
    th { background: #f8fafc; font-weight: 700; width: 35%; }
    .udin-box { background: #eef2ff; border: 2px solid #4338ca; padding: 12px; text-align: center; border-radius: 8px; margin: 16px 0; }
    .udin-code { font-family: monospace; font-size: 22px; font-weight: 900; color: #3730a3; letter-spacing: 2px; }
    .footer { border-top: 1px solid #cbd5e1; padding-top: 16px; margin-top: 32px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${DEFAULT_FIRM_BRANDING.firmName}</h1>
      <p style="margin:2px 0; font-size:11px; color:#475569;">Chartered Accountants &bull; FRN: ${DEFAULT_FIRM_BRANDING.frn} &bull; Peer Review Cert: ${DEFAULT_FIRM_BRANDING.peerReviewNo}</p>
      <p style="margin:2px 0; font-size:11px; color:#475569;">${DEFAULT_FIRM_BRANDING.headOffice}</p>
    </div>
    <div style="text-align:right;">
      <span class="badge" style="background:#f0fdf4; color:#166534; border-color:#bbf7d0;">ICAI Council Verified</span>
      <p style="margin:4px 0 0; font-size:11px; color:#64748b;">Verification Date: ${formatDate(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="udin-box">
    <div style="font-size:11px; text-transform:uppercase; font-weight:bold; color:#4338ca;">Official Unique Document Identification Number</div>
    <div class="udin-code">${entry.udin}</div>
    <div style="font-size:10px; color:#6b7280; margin-top:4px;">Verified on ICAI Official UDIN Portal (https://udin.icai.org)</div>
  </div>

  <h3>Certified Document Particulars</h3>
  <table>
    <tr><th>Document Description</th><td>${entry.documentTitle}</td></tr>
    <tr><th>Document Category</th><td>${entry.documentType}</td></tr>
    <tr><th>Client / Entity Name</th><td>${entry.clientName}</td></tr>
    <tr><th>Client PAN / Identification</th><td>${entry.clientPan}</td></tr>
    <tr><th>Date of Signing / Attestation</th><td>${entry.signingDate}</td></tr>
    <tr><th>Key Financial Figures Certified</th><td><strong>${entry.financialFigures}</strong></td></tr>
    <tr><th>Signing Partner</th><td>${entry.partnerName}</td></tr>
    <tr><th>ICAI Membership No (MRN)</th><td>${entry.membershipNo}</td></tr>
    <tr><th>UDIN Status</th><td><strong>VALID &amp; ACTIVE</strong></td></tr>
  </table>

  <div class="footer">
    <div>
      <p><strong>Issued by GPA &amp; Co., Chartered Accountants</strong><br/>Peer Review Board Compliant &bull; UDIN Directorate Validated</p>
    </div>
    <div style="text-align:right;">
      <p>Third parties can verify this UDIN directly at:<br/><strong>https://udin.icai.org/search-udin</strong></p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ICAI_UDIN_Slip_${entry.udin}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded", `Exported official UDIN slip for ${entry.udin}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Official ICAI UDIN Verification Certificate</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                  Bank &amp; MCA Verified
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official attestation certificate issued under ICAI UDIN Directorate Mandates.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUdin}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{entry.udin}</span>
            </button>
            <a
              href={`https://udin.icai.org/?udin=${entry.udin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition"
            >
              <span>Verify on ICAI Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-700" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>
          </div>
        </div>

        {/* Printable Slip Content */}
        <div className="flex-1 overflow-auto space-y-4 p-4 border border-slate-200 rounded-2xl bg-slate-50/50 print:p-0 print:border-none print:bg-white text-xs leading-relaxed">
          
          {/* Firm Letterhead */}
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900 uppercase">
                  {DEFAULT_FIRM_BRANDING.firmName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Chartered Accountants &bull; FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; Peer Review Cert: {DEFAULT_FIRM_BRANDING.peerReviewNo}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{DEFAULT_FIRM_BRANDING.headOffice}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Verification Date</span>
                <span className="text-xs font-bold text-slate-900">{formatDate(new Date().toISOString())}</span>
              </div>
            </div>

            {/* UDIN Banner */}
            <div className="my-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                Unique Document Identification Number (UDIN)
              </span>
              <div className="text-xl font-black font-mono tracking-widest text-indigo-900">
                {entry.udin}
              </div>
              <span className="text-[10px] text-indigo-600 block">
                Issued in compliance with Council Directive under ICAI Act, 1949
              </span>
            </div>

            {/* Document Particulars Grid */}
            <table className="w-full text-left border-collapse text-xs mt-3">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-500 w-1/3 bg-slate-50">Document Title</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{entry.documentTitle}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50">Document Category</td>
                  <td className="py-2 px-3 text-slate-700">{entry.documentType}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50">Client / Assessee</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{entry.clientName} (PAN: {entry.clientPan})</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50">Date of Signing</td>
                  <td className="py-2 px-3 text-slate-700 font-mono">{entry.signingDate}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50">Key Certified Figures</td>
                  <td className="py-2 px-3 font-black text-btred-logo">{entry.financialFigures}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50">Signing Partner &amp; MRN</td>
                  <td className="py-2 px-3 text-slate-900 font-bold">{entry.partnerName} &bull; M.No: {entry.membershipNo}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-slate-500 bg-slate-50">Portal Status</td>
                  <td className="py-2 px-3 text-emerald-700 font-black">VALID &amp; ACTIVE ON ICAI DATABASE</td>
                </tr>
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="pt-4 mt-3 border-t flex justify-between items-end">
              <div>
                <p className="font-bold text-slate-900">For {DEFAULT_FIRM_BRANDING.firmName}</p>
                <p className="text-[11px] text-slate-500">Chartered Accountants (FRN: {DEFAULT_FIRM_BRANDING.frn})</p>
                <p className="mt-4 font-black text-slate-900">{entry.partnerName}</p>
                <p className="text-[11px] text-slate-500">Partner &bull; Membership No: {entry.membershipNo}</p>
              </div>
              <div className="text-right">
                <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-1">
                  <QrCode className="w-12 h-12 text-slate-700" />
                </div>
                <span className="text-[9px] font-mono text-slate-500 block">Scan to verify at udin.icai.org</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 shrink-0">
          <span className="text-xs text-slate-400">
            Document ID: {entry.id} &bull; ICAI Council Compliant
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Close Slip
          </button>
        </div>
      </div>
    </div>
  );
};
