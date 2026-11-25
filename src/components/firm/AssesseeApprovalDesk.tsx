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
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
import { ClientGateEmptyState } from "@/components/shared/ClientGateEmptyState";
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
    documentTitle: "Form GSTR-3B Outward & Inward Tax Return for October 2026",
    filingType: "GSTR_3B_MONTHLY",
    clientName: "Pratwi Solutions Private Limited",
    clientPan: "AANCP9915B",
    signatoryName: "Chetan Pratap Singh (Director)",
    signatoryPhone: "+91 80771 70715",
    signatoryIp: "103.21.144.18 (Noida, Uttar Pradesh)",
    timestamp: "2026-11-18 11:20:05 IST",
    status: "APPROVED_AND_LOCKED",
    sha256Hash: "5e6f7a8b9c0d1e2f3a4b5c6d7e8f901234567890abcdef1234567890abcdef12",
    legalDeclarationText: "I verify that outward tax liability and Input Tax Credit claimed in Table 4 match our books of accounts and GSTR-2B reconciliation. Authorized to file."
  },
  {
    id: "appr-2",
    documentTitle: "ITR-V & Statement of Computation of Total Income for AY 2026-27",
    filingType: "ITR_COMPUTATION_139",
    clientName: "Pratwi Solutions Private Limited",
    clientPan: "AANCP9915B",
    signatoryName: "Chetan Pratap Singh (Director)",
    signatoryPhone: "+91 80771 70715",
    signatoryIp: "103.21.144.18 (Noida, Uttar Pradesh)",
    timestamp: "2026-10-24 15:42:19 IST",
    status: "APPROVED_AND_LOCKED",
    sha256Hash: "8f4a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4",
    legalDeclarationText: "I hereby confirm that I have verified the gross income, eligible deductions and tax liabilities computed in this return. I formally authorize GPA & Co., Chartered Accountants to upload and verify the return on the Income Tax Portal on our behalf."
  }
];

interface AssesseeApprovalDeskProps {
  clients?: ClientEntity[];
}

export const AssesseeApprovalDesk: React.FC<AssesseeApprovalDeskProps> = ({ clients = [] }) => {
  const { selectedClient, isFirmWideView } = useClientContext();
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  React.useEffect(() => {
    if (!selectedClient || isFirmWideView) { setApprovals([]); return; }
    try {
      const raw = localStorage.getItem(`bt_assessee_approvals_v1::${selectedClient.id}`);
      setApprovals(raw ? JSON.parse(raw) : []);
    } catch { setApprovals([]); }
  }, [selectedClient, isFirmWideView]);
  React.useEffect(() => {
    if (!selectedClient || isFirmWideView) return;
    try { localStorage.setItem(`bt_assessee_approvals_v1::${selectedClient.id}`, JSON.stringify(approvals)); } catch {}
  }, [approvals, selectedClient, isFirmWideView]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Modals
  const [certificateRecord, setCertificateRecord] = useState<ApprovalRecord | null>(null);
  const [isSendRequestOpen, setIsSendRequestOpen] = useState(false);
  const [signingRecord, setSigningRecord] = useState<ApprovalRecord | null>(null);

  // Client-context aware filtering
  const effectiveApprovals = React.useMemo(() => {
    if (selectedClient && !isFirmWideView) {
      const qName = (selectedClient.tradeName || selectedClient.name).toLowerCase();
      const qPan = (selectedClient.pan || "").toLowerCase();
      const matches = approvals.filter(a => 
        (a.clientPan && a.clientPan.toLowerCase() === qPan) ||
        (a.clientName && a.clientName.toLowerCase().includes(qName))
      );
      return matches;
    }
    return approvals;
  }, [approvals, selectedClient, isFirmWideView]);

  // Filtered Records
  const filteredRecords = effectiveApprovals.filter(item => {
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

  const lockedCount = effectiveApprovals.filter(a => a.status === "APPROVED_AND_LOCKED").length;
  const pendingCount = effectiveApprovals.filter(a => a.status === "AWAITING_CLIENT_SIGN").length;

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
    if (selectedClient && (signedRecord.filingType === "TAX_AUDIT_3CD" || signedRecord.filingType === "BALANCE_SHEET_AUDIT")) {
      try {
        const key = `bt_udin_vault_v1::${selectedClient.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const nextUdin = {
          id: `udin-${Date.now()}`,
          udin: "PENDING_GENERATION",
          documentTitle: signedRecord.documentTitle,
          documentType: signedRecord.filingType === "TAX_AUDIT_3CD" ? "TAX_AUDIT_3CD" : "STATUTORY_AUDIT",
          clientName: signedRecord.clientName,
          clientPan: signedRecord.clientPan,
          signingDate: new Date().toISOString().split("T")[0],
          financialFigures: "Approved via SA 580",
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: DEFAULT_FIRM_BRANDING.frn,
          status: "PENDING_GENERATION",
          daysRemainingForGeneration: 60
        };
        localStorage.setItem(key, JSON.stringify([nextUdin, ...existing]));
        toast.info("UDIN Tracker Updated", "Added 60-day pending UDIN entry for " + signedRecord.clientName);
      } catch {}
    }
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
      {/* Enterprise-Grade Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                ICAI SA 580 Compliance &bull; Client Representation &bull; Indian Evidence Act Sec 65B
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-700" />
              Assessee Verification &amp; Legal Sign-off Trail
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <UniversalClientSelector variant="compact" />

            <button
              onClick={handleExportRegister}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
              title="Export complete sign-off log for ICAI Peer Review"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Register</span>
            </button>

            <button
              onClick={() => setIsSendRequestOpen(true)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Issue E-Sign</span>
            </button>

            <button
              onClick={() => {
                const target = effectiveApprovals.find(a => a.status === "AWAITING_CLIENT_SIGN") || effectiveApprovals[0];
                setSigningRecord(target);
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs rounded-lg transition flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simulate Client Sign</span>
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${statusFilter === "ALL" ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"}`}
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
