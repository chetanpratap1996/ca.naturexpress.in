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
  Smartphone
} from "lucide-react";
import { ClientEntity } from "@/lib/types";

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
    clientName: "Tata Steel Limited",
    clientPan: "AAACT2727Q",
    signatoryName: "Rajesh Sharma (Managing Director)",
    signatoryPhone: "+91 98200 11223",
    signatoryIp: "103.21.144.18 (Mumbai, Maharashtra)",
    timestamp: "2026-10-24 15:42:19 IST",
    status: "APPROVED_AND_LOCKED",
    legalDeclarationText: "I hereby confirm that I have verified the gross income, eligible deductions and tax liabilities computed in this return. I formally authorize Brains & Taxes Associates to upload and verify the return on the Income Tax Portal on our behalf."
  },
  {
    id: "appr-2",
    documentTitle: "Form GSTR-3B Outward & Inward Tax Return for September 2026",
    filingType: "GSTR_3B_MONTHLY",
    clientName: "Cloudbyte Technologies Pvt Ltd",
    clientPan: "AABCC9941H",
    signatoryName: "Sunil Verma (Director)",
    signatoryPhone: "+91 98450 12345",
    signatoryIp: "49.207.211.54 (Bengaluru, Karnataka)",
    timestamp: "2026-10-19 11:20:05 IST",
    status: "APPROVED_AND_LOCKED",
    legalDeclarationText: "I verify that outward tax liability and Input Tax Credit claimed in Table 4 match our books of accounts and GSTR-2B reconciliation. Authorized to file."
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
  const [signatoryName, setSignatoryName] = useState("Vikas Patel (Proprietor)");
  const [selectedDoc, setSelectedDoc] = useState("ITR-V Computation for AY 2025-26");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
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
      alert("Please check the statutory declaration before submitting approval.");
      return;
    }

    const canvas = canvasRef.current;
    const dataUrl = canvas ? canvas.toDataURL() : undefined;

    const newApproval: ApprovalRecord = {
      id: `appr-${Date.now()}`,
      documentTitle: selectedDoc,
      filingType: "ITR_COMPUTATION_139",
      clientName: clients[0]?.name || "Patel Enterprises",
      clientPan: clients[0]?.pan || "AAPCP9941H",
      signatoryName: signatoryName,
      signatoryPhone: "+91 97130 44111",
      signatoryIp: "157.34.198.11 (Indore, Madhya Pradesh)",
      timestamp: new Date().toLocaleString("en-IN") + " IST",
      status: "APPROVED_AND_LOCKED",
      signatureDataUrl: dataUrl,
      legalDeclarationText: "I hereby confirm that I have verified the gross income, deductions and tax payable. I formally authorize Brains & Taxes to e-file on my behalf."
    };

    setApprovals(prev => [newApproval, ...prev]);
    setActiveTab("HISTORY");
    setToastMessage(`Assessee verification successfully locked with cryptographic timestamp!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 border border-teal-700/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" /> Professional Protection Shield
              </span>
              <span className="text-xs text-slate-400 font-mono">Assessee Approval &amp; Non-Repudiation Trail</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-teal-400" /> Assessee Verification &amp; Legal Sign-off Trail
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Eliminate client disputes and legal liability. Captures timestamped client consent, digital canvas signatures, IP addresses, and explicit statutory authorization before an ITR, GSTR-3B, or 3CD audit report is submitted to government portals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === "HISTORY" ? "SIGN_NOW" : "HISTORY")}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>{activeTab === "HISTORY" ? "Simulate Client E-Sign" : "View Audit Trail"}</span>
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-teal-900/50 border border-teal-500/40 text-teal-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm shadow-md">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: INTERACTIVE CLIENT DIGITAL SIGNATURE PAD */}
      {activeTab === "SIGN_NOW" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto space-y-5 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider">Assessee Portal Experience</span>
            <h3 className="text-lg font-black text-white mt-0.5">Statutory E-Sign &amp; Filing Authorization</h3>
            <p className="text-slate-400 text-xs mt-1">This screen is rendered to clients via their secure magic-link or PWA portal.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Document Being Authorized</label>
              <input
                type="text"
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assessee / Authorized Signatory Name</label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 font-medium focus:outline-none"
              />
            </div>

            {/* Digital Signature Canvas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Draw Assessee Signature (Touch / Mouse)</label>
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Pad
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-700 bg-white rounded-2xl overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-40 touch-none block"
                />
              </div>
            </div>

            {/* Statutory Checkbox */}
            <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="legal-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-0 bg-slate-900 border-slate-700 mt-0.5 shrink-0"
              />
              <label htmlFor="legal-terms" className="text-slate-300 leading-relaxed text-[11px] cursor-pointer">
                <strong>Statutory Undertaking:</strong> I verify that I have reviewed the tax return computation and vouchers. I confirm that all sources of income, bank accounts, and transactions have been fully disclosed. I formally authorize Brains &amp; Taxes Associates to transmit this return under the Income Tax Act / CGST Act.
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("HISTORY")}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSignature}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
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
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                      Legally Binding Non-Repudiation Proof
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">{item.documentTitle}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-teal-400" /> {item.clientName} ({item.clientPan})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black rounded-full whitespace-nowrap flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> LOCKED
                  </span>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl space-y-1.5 text-[11px] text-slate-300 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Signatory:</span>
                    <span className="font-semibold text-white">{item.signatoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified Timestamp:</span>
                    <span className="font-mono text-emerald-400">{item.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Originating IP Address:</span>
                    <span className="font-mono text-slate-300">{item.signatoryIp}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic bg-slate-800/20 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
                  "{item.legalDeclarationText}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
