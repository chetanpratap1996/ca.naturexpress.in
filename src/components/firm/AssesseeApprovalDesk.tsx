"use client";

import React, { useState, useRef } from "react";
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
  FileText
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

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
    legalDeclarationText: "We confirm that particulars furnished in Form 3CD have been verified against statutory records, bank accounts, and GST returns. We certify that all related party transactions u/s 40A(2)(b) and Section 269SS/T cash loans have been truly disclosed."
  }
];

interface AssesseeApprovalDeskProps {
  clients?: ClientEntity[];
}

export const AssesseeApprovalDesk: React.FC<AssesseeApprovalDeskProps> = ({ clients = [] }) => {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>(DEFAULT_REALISTIC_APPROVALS);
  const [activeTab, setActiveTab] = useState<"HISTORY" | "SIGN_NOW">("HISTORY");
  
  // Interactive Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [signatoryName, setSignatoryName] = useState("Rajesh Sharma (Managing Director)");
  const [selectedDoc, setSelectedDoc] = useState("ITR-V Computation & Return Verification for AY 2025-26");
  const [filingType, setFilingType] = useState<ApprovalRecord["filingType"]>("ITR_COMPUTATION_139");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0] || {
    id: "CL-01",
    name: "Apex Laboratories Private Limited",
    pan: "AABCA9182K"
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmitSignature = () => {
    if (!agreedToTerms) {
      toast.error("Declaration Required", "Please check the statutory undertaking before locking approval.");
      return;
    }

    const canvas = canvasRef.current;
    const dataUrl = canvas ? canvas.toDataURL() : undefined;

    const newApproval: ApprovalRecord = {
      id: `appr-${Date.now()}`,
      documentTitle: selectedDoc,
      filingType: filingType,
      clientName: selectedClient.name,
      clientPan: selectedClient.pan,
      signatoryName: signatoryName,
      signatoryPhone: "+91 98200 44101",
      signatoryIp: "157.34.198.11 (Indore, Madhya Pradesh)",
      timestamp: new Date().toLocaleString("en-IN") + " IST",
      status: "APPROVED_AND_LOCKED",
      signatureDataUrl: dataUrl,
      legalDeclarationText: `I hereby confirm that I have verified the particulars in ${selectedDoc}. I formally authorize ${DEFAULT_FIRM_BRANDING.firmName} to e-file on our behalf under the Income Tax / GST Acts.`
    };

    setApprovals(prev => [newApproval, ...prev]);
    setActiveTab("HISTORY");
    toast.success("Assessee Verification Locked", `Recorded cryptographically timestamped consent for ${selectedClient.name}.`);
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === "HISTORY" ? "SIGN_NOW" : "HISTORY")}
              className="px-4 py-2.5 bg-btred-logo hover:bg-red-700 text-white font-bold text-xs shadow-sm rounded-xl transition flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>{activeTab === "HISTORY" ? "Simulate Client E-Sign" : "View Audit Trail"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE CLIENT DIGITAL SIGNATURE PAD */}
      {activeTab === "SIGN_NOW" ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-2xl mx-auto space-y-5 text-xs text-slate-900">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider">Assessee Portal Experience</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">Statutory E-Sign &amp; Filing Authorization</h3>
            <p className="text-slate-600 text-xs mt-1">This screen is rendered to clients via their secure magic-link or client portal.</p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Client Entity</label>
              {clients.length > 0 ? (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold focus:outline-none"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.pan})</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedClient.name}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Document Category</label>
              <select
                value={filingType}
                onChange={(e) => setFilingType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-medium focus:outline-none"
              >
                <option value="ITR_COMPUTATION_139">ITR-V &amp; Statement of Computation of Income</option>
                <option value="GSTR_3B_MONTHLY">Form GSTR-3B Monthly / Quarterly Return</option>
                <option value="TAX_AUDIT_3CD">Form 3CD Tax Audit Report Disallowances</option>
                <option value="BALANCE_SHEET_AUDIT">Schedule III Audited Financial Statements</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Document Title Being Authorized</label>
              <input
                type="text"
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-red-500 rounded-xl p-2.5 font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Assessee / Authorized Signatory Name &amp; Designation</label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-red-500 rounded-xl p-2.5 font-medium focus:outline-none"
              />
            </div>

            {/* Digital Signature Canvas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold">Draw Assessee Signature (Touch / Stylus / Mouse)</label>
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Pad
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 rounded-2xl overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-40 touch-none block bg-white"
                />
              </div>
            </div>

            {/* Statutory Undertaking Checkbox */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3 text-slate-800">
              <input
                type="checkbox"
                id="legal-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-0 bg-white border-slate-300 mt-0.5 shrink-0"
              />
              <label htmlFor="legal-terms" className="text-slate-700 leading-relaxed text-xs cursor-pointer font-medium">
                <strong>Statutory Undertaking (SA 580):</strong> I verify that I have reviewed the tax return computation, bank statements, and vouchers. I confirm that all sources of income, bank accounts, and transactions have been truly disclosed. I formally authorize {DEFAULT_FIRM_BRANDING.firmName} to transmit this return under the Income Tax Act / CGST Act.
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("HISTORY")}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSignature}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-md flex items-center gap-2 transition"
              >
                <Lock className="w-4 h-4" />
                <span>Confirm &amp; Lock Authorization</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: NON-REPUDIATION AUDIT TRAIL LOGS */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvals.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 text-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      Legally Binding Non-Repudiation Proof
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{item.documentTitle}</h4>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-teal-700" /> {item.clientName} ({item.clientPan})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[10px] rounded-full whitespace-nowrap flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> LOCKED
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Authorized Signatory:</span>
                    <span className="font-bold text-slate-900">{item.signatoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Timestamp:</span>
                    <span className="font-mono text-emerald-700 font-bold">{item.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Originating IP Address:</span>
                    <span className="font-mono text-slate-700 font-semibold">{item.signatoryIp}</span>
                  </div>
                </div>

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

                <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                  "{item.legalDeclarationText}"
                </p>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-slate-200"
                  >
                    <Printer className="w-3 h-3 text-slate-600" />
                    <span>Print SA 580 Certificate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
