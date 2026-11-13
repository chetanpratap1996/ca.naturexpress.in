"use client";

import React, { useState } from "react";
import { 
  FileCheck, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  RotateCcw, 
  Lock, 
  Clock, 
  Building2, 
  User, 
  Sparkles,
  Smartphone,
  Printer,
  FileText,
  Search,
  Copy,
  Check,
  Send,
  AlertCircle,
  ExternalLink,
  Plus,
  ShieldAlert,
  Fingerprint
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";
import { Sa580CertificateModal } from "./signoff/Sa580CertificateModal";
import { SendSignRequestModal } from "./signoff/SendSignRequestModal";
import { ClientSignoffModal } from "./signoff/ClientSignoffModal";

export interface ApprovalRecord {
  id: string;
  documentTitle: string;
  filingType: "ITR_COMPUTATION_139" | "GSTR_3B_MONTHLY" | "BALANCE_SHEET_AUDIT" | "TAX_AUDIT_3CD";
  clientName: string;
  clientPan: string;
  signatoryName: string;
  signatoryPhone: string;
  signatoryIp: string;
  timestamp: string;
  status: "APPROVED_AND_LOCKED" | "AWAITING_CLIENT_SIGN";
  signatureDataUrl?: string;
  legalDeclarationText: string;
  sha256Hash?: string;
}

const DEFAULT_REALISTIC_APPROVALS: ApprovalRecord[] = [
  {
    id: "appr-1",
    documentTitle: "ITR-V & Statement of Computation of Total Income for AY 2025-26",
    filingType: "ITR_COMPUTATION_139",
    clientName: "Apex Laboratories Private Limited",
    clientPan: "AABCA9182K",
    signatoryName: "Rajesh Sharma (Managing Director)",
    signatoryPhone: "+91 98200 11223",
    signatoryIp: "103.21.144.18 (Mumbai, Maharashtra)",
    timestamp: "2026-10-24 15:42:19 IST",
    status: "APPROVED_AND_LOCKED",
    sha256Hash: "8f4a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4",
    legalDeclarationText: "I hereby confirm that I have verified the gross income, eligible deductions and tax liabilities computed in this return. I formally authorize GPA & Co., Chartered Accountants to upload and verify the return on the Income Tax Portal on our behalf."
  },
  {
    id: "appr-2",
    documentTitle: "Form GSTR-3B Outward & Inward Tax Return for September 2026",
    filingType: "GSTR_3B_MONTHLY",
    clientName: "Pratwi Solutions Private Limited",
    clientPan: "AABCP8819E",
    signatoryName: "Sunil Verma (Director)",
    signatoryPhone: "+91 98450 12345",
    signatoryIp: "49.207.211.54 (Indore, Madhya Pradesh)",
    timestamp: "2026-10-19 11:20:05 IST",
    status: "APPROVED_AND_LOCKED",
    sha256Hash: "5e6f7a8b9c0d1e2f3a4b5c6d7e8f901234567890abcdef1234567890abcdef12",
    legalDeclarationText: "I verify that outward tax liability and Input Tax Credit claimed in Table 4 match our books of accounts and GSTR-2B reconciliation. Authorized to file."
  },
  {
    id: "appr-3",
    documentTitle: "Tax Audit Report Form 3CB/3CD & Annexures for FY 2024-25",
    filingType: "TAX_AUDIT_3CD",
    clientName: "Zenith Infra Projects Limited",
    clientPan: "AABCZ9941M",
    signatoryName: "Kailash Zenith (Director)",
    signatoryPhone: "+91 99200 44882",
    signatoryIp: "157.34.198.11 (Bhopal, Madhya Pradesh)",
    timestamp: "2026-09-29 18:04:12 IST",
    status: "APPROVED_AND_LOCKED",
    sha256Hash: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
    legalDeclarationText: "We confirm that particulars furnished in Form 3CD have been verified against statutory records, bank accounts, and GST returns. We certify that all related party transactions u/s 40A(2)(b) and Section 269SS/T cash loans have been truly disclosed."
  },
  {
    id: "appr-4",
    documentTitle: "Income Tax Return Form ITR-6 for AY 2026-27 (Corporate Tax)",
    filingType: "ITR_COMPUTATION_139",
    clientName: "OmniRetail Supermarkets Private Limited",
    clientPan: "AABCO4412L",
    signatoryName: "Mahesh Agrawal (Finance Director)",
    signatoryPhone: "+91 97110 55902",
    signatoryIp: "Pending Assessee Mobile Connection",
    timestamp: "Awaiting Client Sign (Due Today)",
    status: "AWAITING_CLIENT_SIGN",
    sha256Hash: "7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
    legalDeclarationText: "I hereby confirm that I have verified the corporate computation and MAT adjustments under Section 115JB. Formally authorized to file."
  }
];

interface AssesseeApprovalDeskProps {
  clients?: ClientEntity[];
}

export const AssesseeApprovalDesk: React.FC<AssesseeApprovalDeskProps> = ({ clients = [] }) => {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(DEFAULT_REALISTIC_APPROVALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Modals
  const [certificateRecord, setCertificateRecord] = useState<ApprovalRecord | null>(null);
  const [isSendRequestOpen, setIsSendRequestOpen] = useState(false);
  const [signingRecord, setSigningRecord] = useState<ApprovalRecord | null>(null);

  // Filtered Records
  const filteredRecords = approvals.filter(item => {
    const matchesSearch = 
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientPan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.signatoryName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === "APPROVED") return item.status === "APPROVED_AND_LOCKED";
    if (statusFilter === "PENDING") return item.status === "AWAITING_CLIENT_SIGN";
    return true;
  });

  const lockedCount = approvals.filter(a => a.status === "APPROVED_AND_LOCKED").length;
  const pendingCount = approvals.filter(a => a.status === "AWAITING_CLIENT_SIGN").length;

  const handleCopyHash = (id: string, hash?: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    toast.success("SHA-256 Hash Copied", "Cryptographic document checksum copied.");
    setTimeout(() => setCopiedHashId(null), 2500);
  };

  const handleCreateRequest = (newRecord: ApprovalRecord, openWhatsApp: boolean) => {
    setApprovals(prev => [newRecord, ...prev]);
    toast.success("E-Sign Request Issued", `Generated authorization link for ${newRecord.clientName}.`);
  };

  const handleSignComplete = (signedRecord: ApprovalRecord) => {
    setApprovals(prev => prev.map(a => a.id === signedRecord.id ? signedRecord : a));
  };

  const handleExportRegister = () => {
    const headers = "ID,Document Title,Filing Type,Client Name,Client PAN,Signatory Name,Signatory Phone,Timestamp,Status,SHA256 Hash\n";
    const rows = approvals.map(a => 
      `"${a.id}","${a.documentTitle}","${a.filingType}","${a.clientName}","${a.clientPan}","${a.signatoryName}","${a.signatoryPhone}","${a.timestamp}","${a.status}","${a.sha256Hash || ''}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ICAI_SA580_Client_Signoff_Register_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SA 580 Register Exported", "Downloaded CSV audit register for ICAI Peer Review.");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50/70 via-white to-red-50/40 border border-red-200 rounded-2xl p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-red-50 text-btred-logo border border-red-200 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-800" /> Professional Protection Shield
              </span>
              <span className="text-xs text-slate-500 font-mono">ICAI SA 580 Written Representation Trail</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-teal-700" /> Assessee Verification &amp; Legal Sign-off Trail
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Eliminate client disputes and malpractice allegations. Captures timestamped client consent, digital canvas signatures, IP addresses, and explicit statutory authorization before an ITR, GSTR-3B, or 3CD audit report is submitted to government portals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportRegister}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
              title="Export complete sign-off log for ICAI Peer Review"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export SA 580 Register</span>
            </button>
            <button
              onClick={() => setIsSendRequestOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Issue E-Sign Request</span>
            </button>
            <button
              onClick={() => {
                const target = approvals.find(a => a.status === "AWAITING_CLIENT_SIGN") || approvals[0];
                setSigningRecord(target);
              }}
              className="px-4 py-2 bg-btred-logo hover:bg-red-700 text-white font-bold text-xs shadow-sm rounded-xl transition flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Simulate Client E-Sign</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics & Regulatory Assurance Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Verified &amp; Non-Repudiable
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 flex items-baseline gap-2">
            <span>{lockedCount}</span>
            <span className="text-xs font-semibold text-emerald-800">100% Locked</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Backed by IP &amp; SHA-256 seal</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Pending Client Consent
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1 flex items-baseline gap-2">
            <span>{pendingCount}</span>
            <span className="text-xs font-semibold text-amber-700">Awaiting Sign</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Direct filing blocked until e-signed</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            ICAI SA 580 Standard
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">
            Mandatory Evidence
          </div>
          <div className="text-[11px] text-teal-700 font-semibold mt-1">Zero CA malpractice exposure</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Indian Evidence Act
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">
            Sec 65B / BSA 63
          </div>
          <div className="text-[11px] text-slate-600 font-semibold mt-1">Court-admissible electronic log</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client, PAN, signatory, or doc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:bg-white focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${statusFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All Records ({approvals.length})
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${statusFilter === "APPROVED" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Locked ({lockedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${statusFilter === "PENDING" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100"}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>
        </div>
      </div>

      {/* NON-REPUDIATION AUDIT TRAIL LOG CARDS */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-xs">
            No legal sign-off records match the selected filter or search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white border rounded-3xl p-5 shadow-sm space-y-3.5 text-slate-900 transition-all ${item.status === "AWAITING_CLIENT_SIGN" ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200 hover:border-slate-300"}`}
              >
                {/* Header status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {item.status === "APPROVED_AND_LOCKED" ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-teal-600" />
                        Legally Binding Non-Repudiation Proof
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending Assessee Consent (Due for Filing)
                      </span>
                    )}

                    <h4 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">{item.documentTitle}</h4>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-teal-700" /> {item.clientName} ({item.clientPan})
                    </p>
                  </div>

                  {item.status === "APPROVED_AND_LOCKED" ? (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[10px] rounded-full whitespace-nowrap flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" /> LOCKED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-black text-[10px] rounded-full whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-amber-600" /> AWAITING SIGN
                    </span>
                  )}
                </div>

                {/* Audit metadata block */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Authorized Signatory:</span>
                    <span className="font-bold text-slate-900">{item.signatoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Timestamp:</span>
                    <span className={`font-mono font-bold ${item.status === 'APPROVED_AND_LOCKED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {item.timestamp}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Originating IP Address:</span>
                    <span className="font-mono text-slate-700 font-semibold">{item.signatoryIp}</span>
                  </div>

                  {/* SHA-256 Checksum */}
                  {item.sha256Hash && (
                    <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-sans">SHA-256 Checksum:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-600 truncate max-w-[170px]" title={item.sha256Hash}>
                          {item.sha256Hash.slice(0, 16)}...{item.sha256Hash.slice(-8)}
                        </span>
                        <button
                          onClick={() => handleCopyHash(item.id, item.sha256Hash)}
                          className="text-slate-500 hover:text-slate-800"
                          title="Copy Full SHA-256 Hash"
                        >
                          {copiedHashId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Digital Signature Canvas Thumbnail */}
                {item.signatureDataUrl && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Digital Signature:</span>
                    <img 
                      src={item.signatureDataUrl} 
                      alt="Assessee Digital Signature" 
                      className="h-10 object-contain max-w-[140px] bg-white border border-slate-200 rounded px-1"
                    />
                  </div>
                )}

                {/* Statutory Representation Quote */}
                <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                  "{item.legalDeclarationText}"
                </p>

                {/* Footer Action Buttons */}
                <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
                  <div className="text-[10px] font-mono text-slate-400">
                    ID: {item.id}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "AWAITING_CLIENT_SIGN" ? (
                      <>
                        <button
                          onClick={() => {
                            const waText = `*Reminder: Statutory E-Sign Pending (GPA & Co.)*%0A%0ADear *${item.signatoryName}*,%0A%0APlease authorize filing for *"${item.documentTitle}"* to ensure timely transmission before portal deadline.%0A%0AAuthorize here: https://portal.gpa-firm.in/sign/${item.id}`;
                            const cleanPhone = item.signatoryPhone.replace(/[^0-9]/g, "");
                            window.open(`https://wa.me/${cleanPhone}?text=${waText}`, "_blank");
                          }}
                          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-emerald-200"
                          title="Send WhatsApp Chaser"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>WhatsApp Chaser</span>
                        </button>
                        <button
                          onClick={() => setSigningRecord(item)}
                          className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
                          title="Open Client E-Sign Screen"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>E-Sign Now</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCopyHash(item.id, item.sha256Hash)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 border border-slate-200"
                          title="Copy Non-Repudiation Proof Hash"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Hash</span>
                        </button>
                        <button
                          onClick={() => setCertificateRecord(item)}
                          className="text-xs font-bold text-slate-800 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-slate-300 shadow-xs"
                          title="Generate Letterhead SA 580 Written Representation Certificate"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-700" />
                          <span>Print SA 580 Certificate</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: STATUTORY SA 580 CERTIFICATE & REPRESENTATION LETTER */}
      <Sa580CertificateModal
        isOpen={!!certificateRecord}
        onClose={() => setCertificateRecord(null)}
        record={certificateRecord}
      />

      {/* MODAL 2: ISSUE ASSESSEE E-SIGN REQUEST */}
      <SendSignRequestModal
        isOpen={isSendRequestOpen}
        onClose={() => setIsSendRequestOpen(false)}
        clients={clients}
        onCreateRequest={handleCreateRequest}
      />

      {/* MODAL 3: ASSESSEE CLIENT PORTAL E-SIGN SIMULATOR */}
      <ClientSignoffModal
        isOpen={!!signingRecord}
        onClose={() => setSigningRecord(null)}
        record={signingRecord}
        onSignComplete={handleSignComplete}
      />
    </div>
  );
};
