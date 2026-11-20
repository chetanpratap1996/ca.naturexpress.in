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
  AlertTriangle, 
  Building2, 
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { Form3cdClause } from "./Form3cdWorkpaper";

interface Form3caReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  pan: string;
  cinOrLlp: string;
  turnoverCr: number;
  auditType: "FORM_3CA_3CD" | "FORM_3CB_3CD";
  assessmentYear: string;
  financialYear: string;
  clauses: Form3cdClause[];
  udinNumber: string;
  onPushToItr?: (disallowances: number) => void;
}

export const Form3caReportModal: React.FC<Form3caReportModalProps> = ({
  isOpen,
  onClose,
  clientName,
  pan,
  cinOrLlp,
  turnoverCr,
  auditType,
  assessmentYear,
  financialYear,
  clauses,
  udinNumber,
  onPushToItr
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [partnerSignatory] = useState("CA Gunjan Jain (FCA)");
  const [membershipNo] = useState("518492");

  if (!isOpen) return null;

  const firm = DEFAULT_FIRM_BRANDING;
  const qualifiedClauses = clauses.filter(c => c.status === "QUALIFIED_AUDIT_REPORT");
  const totalDisallowances = clauses.reduce((sum, c) => sum + c.disallowanceAmount, 0);
  const taxImpact = Math.round(totalDisallowances * 0.312); // 30% corporate tax + 4% cess

  // Copy formal audit certificate to clipboard
  const handleCopyCertificate = () => {
    const text = `========================================================================
FORM NO. ${auditType === "FORM_3CA_3CD" ? "3CA" : "3CB"} - AUDIT REPORT UNDER SECTION 44AB
${firm.firmName.toUpperCase()} | FRN: ${firm.frn} | UDIN: ${udinNumber}
========================================================================

Assessee: ${clientName} | PAN: ${pan} | CIN/LLPIN: ${cinOrLlp}
Assessment Year: ${assessmentYear} | Financial Year: ${financialYear}
Turnover: ₹${turnoverCr} Crores

PARAGRAPH 3 - STATUTORY QUALIFICATIONS & OBSERVATIONS:
${qualifiedClauses.length === 0 ? "NIL - No qualifications or adverse remarks noted." : qualifiedClauses.map((c, idx) => 
  `${idx + 1}. [${c.clauseNo}] ${c.title} (${c.statutoryRef}):\n   Disallowance: ${formatCurrencyINR(c.disallowanceAmount)}\n   Audit Observation: ${c.auditNotes}`
).join("\n\n")}

TOTAL STATUTORY DISALLOWANCES CERTIFIED: ${formatCurrencyINR(totalDisallowances)}
DIRECT TAX OUTFLOW IMPACT: +${formatCurrencyINR(taxImpact)}

For ${firm.firmName}
Chartered Accountants (FRN: ${firm.frn})
${partnerSignatory} | Membership No: ${membershipNo}
Date: 30th September, 2026 | UDIN: ${udinNumber}
`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("Report Copied", "Form 3CA/3CB audit certificate copied to clipboard.");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Download Standalone HTML Audit Report
  const handleDownloadHtml = () => {
    const element = document.getElementById("printable-form-3ca-report");
    if (!element) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Form 3CA Audit Report - ${clientName} (${pan}) - ${assessmentYear}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", serif; margin: 40px; color: #0f172a; line-height: 1.6; font-size: 13px; }
    .header { border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 900; margin: 0; text-align: center; text-transform: uppercase; }
    .subtitle { font-size: 11px; text-align: center; color: #475569; margin-top: 4px; }
    .qual-box { background: #fffbeb; border: 2px solid #b45309; border-radius: 8px; padding: 16px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; }
    .font-mono { font-family: monospace; }
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
    a.download = `Form_${auditType === "FORM_3CA_3CD" ? "3CA" : "3CB"}_Audit_Report_${pan}_${assessmentYear.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report Downloaded", "Saved standalone Form 3CA/3CB statutory audit report.");
  };

  const handlePushDisallowances = () => {
    if (onPushToItr) {
      onPushToItr(totalDisallowances);
    }
    toast.success(
      "Bridged to ITR Computation",
      `Transferred ₹${totalDisallowances.toLocaleString()} disallowances into Tax Computation & Advisory Dossier.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-300 my-8 overflow-hidden animate-scaleUp">
        {/* Top Control Bar */}
        <div className="bg-white text-slate-900 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-red-600" />
            <span className="text-xs font-black uppercase tracking-wider text-red-700">
              Form {auditType === "FORM_3CA_3CD" ? "3CA" : "3CB"} Statutory Tax Audit Report
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-mono text-slate-700">UDIN: {udinNumber}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePushDisallowances}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Push ₹4,43,000 disallowances into ITR Computation & Tax Advisory Dossier"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Push to ITR Computation</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-btred-logo hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Print letterhead report or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
              title="Download standalone HTML file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>

            <button
              onClick={handleCopyCertificate}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
              title="Copy audit certificate"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied!" : "Copy Memo"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-form-3ca-report" className="p-6 sm:p-10 space-y-6 text-slate-900 font-serif max-h-[82vh] overflow-y-auto">
          {/* Formal Header */}
          <div className="border-b-4 border-slate-900 pb-5 font-sans">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Section 44AB Statutory Audit Report
                </span>
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

              <div className="text-right shrink-0 border border-slate-200 bg-slate-50 p-3 rounded-2xl">
                <div className="flex items-center justify-end gap-1.5 text-emerald-700 text-xs font-black">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> ICAI UDIN CERTIFIED
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                  {udinNumber}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Certified: {formatDate(new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Title Banner */}
          <div className="text-center space-y-1 font-sans border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">
              FORM NO. {auditType === "FORM_3CA_3CD" ? "3CA" : "3CB"}
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold">
              [See rule 6G(1)({auditType === "FORM_3CA_3CD" ? "a" : "b"})]
            </p>
            <p className="text-xs font-medium text-slate-700 max-w-2xl mx-auto leading-relaxed">
              {auditType === "FORM_3CA_3CD"
                ? "Audit report under section 44AB of the Income-tax Act, 1961, in a case where the accounts of the business or profession of a person have been audited under any other law"
                : "Audit report under section 44AB of the Income-tax Act, 1961, in the case of a person referred to in clause (b) of sub-rule (1) of rule 6G"}
            </p>
          </div>

          {/* Paragraph 1: Scope */}
          <div className="text-xs text-slate-800 leading-relaxed space-y-3">
            <p>
              1. We report that the statutory audit of <strong>{clientName}</strong> (Permanent Account Number: <strong className="font-mono">{pan}</strong>, CIN/LLPIN: <span className="font-mono">{cinOrLlp}</span>) was conducted by us in accordance with the provisions of the {auditType === "FORM_3CA_3CD" ? "Companies Act, 2013" : "relevant governing statutes"} for the financial year ended on 31st March 2026.
            </p>

            <p>
              2. The statement of particulars required to be furnished under section 44AB is given in <strong>Form No. 3CD</strong> annexed herewith. We have conducted our audit in accordance with the Standards on Auditing (SAs) issued by the Institute of Chartered Accountants of India (ICAI).
            </p>
          </div>

          {/* Paragraph 3: Dynamic Qualifications & Observations */}
          <div className="bg-amber-50/90 border-2 border-amber-400 p-5 rounded-2xl space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-amber-300 pb-2">
              <strong className="text-xs uppercase font-black text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                3. Qualifications &amp; Adverse Audit Observations (Paragraph 3 of Form {auditType === "FORM_3CA_3CD" ? "3CA" : "3CB"})
              </strong>
              <span className="text-[11px] font-mono font-bold text-btred-logo bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                Total Disallowances: {formatCurrencyINR(totalDisallowances)}
              </span>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed">
              In our opinion and to the best of our information and according to explanations given to us, the particulars given in Form 3CD are true and correct subject to the following statutory qualifications and add-backs:
            </p>

            {qualifiedClauses.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold">
                ✓ NIL - No adverse qualifications or disallowances observed during the audit.
              </div>
            ) : (
              <ol className="list-decimal pl-4 space-y-2.5 text-xs text-slate-900">
                {qualifiedClauses.map((clause, idx) => (
                  <li key={clause.clauseNo} className="leading-relaxed">
                    <span className="font-black text-btred-logo">{clause.clauseNo}</span> ({clause.statutoryRef}):{" "}
                    <strong>{clause.title}</strong> —{" "}
                    <span className="font-mono font-bold text-slate-900">
                      Disallowance: {formatCurrencyINR(clause.disallowanceAmount)}
                    </span>.{" "}
                    <span className="text-slate-700">{clause.auditNotes}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-[11px] text-amber-900 font-semibold">
              <span>Direct Corporate Tax Impact (at effective 31.2% rate):</span>
              <span className="font-mono font-black text-sm text-btred-logo">
                +{formatCurrencyINR(taxImpact)}
              </span>
            </div>
          </div>

          {/* Paragraph 4: Final Certification */}
          <div className="text-xs text-slate-800 leading-relaxed space-y-2">
            <p>
              4. In our opinion and to the best of our information, and according to explanations given to us, the said accounts give a true and fair view:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>In the case of the Balance Sheet, of the state of affairs of the assessee as at 31st March 2026; and</li>
              <li>In the case of the Profit and Loss Account, of the profit of the assessee for the year ended on that date.</li>
            </ul>
          </div>

          {/* Signature & Seal Block */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
            <div>
              <p className="text-xs text-slate-500">For and on behalf of</p>
              <p className="text-sm font-black text-slate-900">{firm.firmName}</p>
              <p className="text-xs text-slate-600">Chartered Accountants (FRN: {firm.frn})</p>
              <p className="mt-6 text-sm font-bold text-slate-900">{partnerSignatory}</p>
              <p className="text-xs text-slate-600">Partner | Membership No: {membershipNo}</p>
            </div>

            <div className="text-right space-y-1">
              <p className="text-xs text-slate-500">Place: <strong>Indore / Mumbai</strong></p>
              <p className="text-xs text-slate-500">Date: <strong>30th September, 2026</strong></p>
              <div className="mt-6 inline-block text-left p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">ICAI UDIN Certification</span>
                <span className="text-xs font-mono font-black text-indigo-700">{udinNumber}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">Digitally Sealed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Close Bar */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center no-print">
          <span className="text-xs text-slate-500">
            Statutory Audit Report under Section 44AB r.w. Rule 6G. Compliant with ICAI Peer Review Guidelines.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
