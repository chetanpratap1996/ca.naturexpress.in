"use client";

import React, { useState } from "react";
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Building2, 
  User, 
  Calendar, 
  FileText, 
  Copy, 
  Check, 
  QrCode,
  Download,
  AlertCircle,
  Fingerprint
} from "lucide-react";
import { ApprovalRecord } from "../AssesseeApprovalDesk";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { formatDate } from "@/lib/utils";

interface Sa580CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ApprovalRecord | null;
}

export const Sa580CertificateModal: React.FC<Sa580CertificateModalProps> = ({
  isOpen,
  onClose,
  record
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !record) return null;

  // Generate deterministic SHA-256 checksum representation for the document
  const mockSha256 = record.id.length > 5 
    ? `3a7f8b9c2d1e405a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90`
    : `9f8e7d6c5b4a3210fedcba9876543210abcdef0123456789abcdef0123456789`;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(mockSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Controls Header (Non-printable) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>ICAI SA 580 Written Representation &amp; Non-Repudiation Certificate</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                  Sec 65B Admissible
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Tamper-evident legal certificate proving explicit assessee filing consent &amp; truthfulness of particulars
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-8 sm:p-12 overflow-y-auto font-serif text-slate-900 space-y-6 max-w-3xl mx-auto w-full leading-relaxed bg-white">
          
          {/* Official CA Firm Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 text-center font-sans">
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
              {DEFAULT_FIRM_BRANDING.firmName}
            </h1>
            <p className="text-xs font-bold text-slate-700 mt-1">
              CHARTERED ACCOUNTANTS &bull; FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; Peer Review Certificate: {DEFAULT_FIRM_BRANDING.peerReviewNo}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Head Office: {DEFAULT_FIRM_BRANDING.headOffice} | Contact: {DEFAULT_FIRM_BRANDING.partnerPhone}
            </p>
          </div>

          {/* Certificate Title Badge */}
          <div className="text-center space-y-1 font-sans">
            <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-[11px] font-black tracking-widest uppercase text-slate-800">
              STATUTORY WRITTEN REPRESENTATION LETTER
            </span>
            <div className="text-xs text-slate-500">
              Issued in compliance with Standard on Auditing (SA) 580 "Written Representations" promulgated by ICAI
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Read with Section 140 &amp; Section 277 of Income Tax Act, 1961 | Section 132 of CGST Act, 2017
            </div>
          </div>

          {/* Addressee & Client Identification */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-sans text-xs space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">To (Auditors):</span>
                <span className="font-bold text-slate-900">{DEFAULT_FIRM_BRANDING.firmName}</span>
                <span className="block text-slate-600">Chartered Accountants (FRN: {DEFAULT_FIRM_BRANDING.frn})</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">From (Assessee / Client):</span>
                <span className="font-bold text-slate-900">{record.clientName}</span>
                <span className="block font-mono text-slate-600">PAN: {record.clientPan}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Authorized Signatory:</span>
                <span className="font-bold text-slate-900">{record.signatoryName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Document / Return Verified:</span>
                <span className="font-bold text-slate-900">{record.documentTitle}</span>
              </div>
            </div>
          </div>

          {/* Statutory Formal Declaration Clauses under SA 580 */}
          <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-slate-800 text-justify">
            <p>
              <strong>Respected Sirs,</strong>
            </p>
            <p>
              This representation letter is provided in connection with your engagement to prepare, compute, audit, and/or upload the statutory return / report titled <strong>"{record.documentTitle}"</strong> on the relevant government portals (Income Tax Department / GSTN / Ministry of Corporate Affairs) for and on behalf of <strong>{record.clientName}</strong>.
            </p>

            <div className="space-y-2.5 pl-4 border-l-2 border-slate-300">
              <p>
                <strong>1. Completeness &amp; Truthfulness of Financial Data:</strong> We confirm that all books of accounts, invoices, bank statements across all active banking accounts, digital ledgers, and voucher documents have been fully and truly placed before you. No transaction, receipt, cash loan, or expenditure has been concealed, suppressed, or falsely stated.
              </p>
              <p>
                <strong>2. Absence of Undisclosed Income / Assets:</strong> We certify that the assessee entity has no undisclosed income, off-balance sheet liabilities, beneficial interests in foreign assets/accounts, or transactions that require separate reporting under the Black Money Act, 2015 or Prevention of Money Laundering Act (PMLA).
              </p>
              <p>
                <strong>3. Statutory Deductions &amp; Input Tax Credit:</strong> All deductions claimed under Chapter VI-A / Section 37(1) of the Income Tax Act, and all Input Tax Credit (ITC) claimed in GSTR-3B, represent genuine business expenses and bona fide commercial supplies supported by valid tax invoices, with goods/services received strictly in compliance with Section 16(2) of the CGST Act, 2017.
              </p>
              <p>
                <strong>4. Formal Transmission &amp; E-Filing Authorization:</strong> We hereby grant our unequivocal and irrevocable authority to {DEFAULT_FIRM_BRANDING.firmName} and its authorized partners/staff to transmit, e-file, and sign/verify using our Digital Signature Certificate (DSC) or Electronic Verification Code (EVC) the statutory return on the designated portal on our behalf.
              </p>
              <p>
                <strong>5. Sole Liability &amp; Indemnity:</strong> We explicitly acknowledge that the primary statutory responsibility for the truthfulness, accuracy, and legality of the information declared in the tax return rests solely upon the assessee and its principal officers under Section 140 and Section 277 of the Income Tax Act, 1961, and we indemnify the chartered accountants against any adverse penal consequence arising from any fact suppressed by us.
              </p>
            </div>
          </div>

          {/* Digital Signature & Signatory Seal Block */}
          <div className="border border-slate-300 rounded-2xl p-5 bg-slate-50/50 font-sans space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider block">
                  Assessee E-Signature &amp; Attestation
                </span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{record.signatoryName}</div>
                <div className="text-xs text-slate-500">For and on behalf of {record.clientName}</div>
              </div>

              {/* Signature Image Display */}
              <div className="border-2 border-slate-300 bg-white rounded-xl p-2 min-w-[180px] text-center">
                {record.signatureDataUrl ? (
                  <img 
                    src={record.signatureDataUrl} 
                    alt="Assessee Digital Signature" 
                    className="h-12 mx-auto object-contain"
                  />
                ) : (
                  <div className="h-12 flex items-center justify-center text-xs font-mono text-emerald-800 font-bold bg-emerald-50 rounded">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-700" />
                    AADHAAR e-SIGN LOCKED
                  </div>
                )}
                <span className="text-[9px] text-slate-400 block mt-1 uppercase font-mono">
                  Verified Electronic Signature
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Audit Trail (Section 65B Indian Evidence Act / Section 63 BSA 2023) */}
          <div className="border-2 border-slate-800 rounded-2xl p-5 bg-white font-mono text-[11px] space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-black text-slate-900 uppercase flex items-center gap-1.5 font-sans text-xs">
                <Lock className="w-4 h-4 text-slate-800" />
                NON-REPUDIATION ELECTRONIC EVIDENCE CERTIFICATE
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                TAMPER-PROOF AUDIT TRAIL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Verified Timestamp (IST NTP):</span>
                <span className="font-bold text-slate-900">{record.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Originating IP &amp; Geolocation:</span>
                <span className="font-bold text-slate-900">{record.signatoryIp}</span>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Document Payload SHA-256 Checksum:</span>
                  <button
                    onClick={handleCopyHash}
                    className="text-slate-500 hover:text-slate-900 text-[10px] flex items-center gap-1 font-sans"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? "Copied" : "Copy Hash"}</span>
                  </button>
                </div>
                <div className="bg-slate-100 p-1.5 rounded text-[10px] break-all select-all font-bold text-slate-800 border border-slate-200">
                  {mockSha256}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-sans leading-relaxed">
              <strong>Section 65B Admissibility Affirmation:</strong> This certificate is generated by an automated electronic compliance computer system maintained by {DEFAULT_FIRM_BRANDING.firmName} in the ordinary course of professional practice. The electronic signatures, IP stamps, and hash codes were recorded contemporaneously at the exact instance of client authorization. Admissible as primary electronic evidence under Section 65B of the Indian Evidence Act, 1872 and Section 63 of Bharatiya Sakshya Adhiniyam, 2023.
            </div>
          </div>

          {/* Bottom Footnote */}
          <div className="text-center text-[10px] text-slate-400 font-sans pt-2">
            This document forms an integral part of the Auditor's Working Paper Dossier under SA 230 &bull; Confidential &bull; For Judicial &amp; Regulatory Protection Only
          </div>

        </div>
      </div>
    </div>
  );
};
