"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  CheckCircle2, 
  RotateCcw, 
  Lock, 
  ShieldCheck, 
  Building2, 
  Fingerprint, 
  FileText, 
  Calendar, 
  DollarSign,
  Smartphone
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

export interface EngagementRecord {
  id: string;
  refNo: string;
  clientId: string;
  clientName: string;
  clientPan: string;
  clientGstin?: string;
  groupName?: string;
  scopeType: "TAX_AUDIT_44AB" | "STATUTORY_AUDIT_COMPANIES_ACT" | "GST_RETAINER" | "ITR_AND_TAX_PLANNING" | "TRANSFER_PRICING_92E" | "IFC_AUDIT";
  scopeTitle: string;
  financialYear: string;
  professionalFee: number;
  status: "COUNTERSIGNED_VALID" | "AWAITING_CLIENT_ACCEPTANCE" | "DRAFT";
  issueDate: string;
  acceptedDate?: string;
  signatoryName: string;
  signatoryDesignation: string;
  signatoryIp?: string;
  signatureDataUrl?: string;
}

interface ClientAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagement: EngagementRecord | null;
  onAccepted: (updated: EngagementRecord) => void;
}

export const ClientAcceptanceModal: React.FC<ClientAcceptanceModalProps> = ({
  isOpen,
  onClose,
  engagement,
  onAccepted
}) => {
  const [agreed, setAgreed] = useState(false);
  const [signatoryName, setSignatoryName] = useState(engagement?.signatoryName || "Authorized Director");
  const [designation, setDesignation] = useState(engagement?.signatoryDesignation || "Managing Director");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  if (!isOpen || !engagement) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirmAcceptance = () => {
    if (!agreed) {
      toast.error("Acceptance Required", "Please check the statutory confirmation box.");
      return;
    }
    if (!signatoryName.trim()) {
      toast.error("Name Required", "Please enter signatory name.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL() : undefined;

      const now = new Date();
      const updated: EngagementRecord = {
        ...engagement,
        status: "COUNTERSIGNED_VALID",
        acceptedDate: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} IST`,
        signatoryName: signatoryName.trim(),
        signatoryDesignation: designation.trim(),
        signatoryIp: "103.21.144.18 (Mumbai, Maharashtra - Client Device)",
        signatureDataUrl: signatureDataUrl
      };

      onAccepted(updated);
      onClose();
      toast.success("Engagement Countersigned", `Successfully accepted SA 210 terms for ${engagement.clientName}.`);
    }, 1000);
  };

  const gstAmount = Math.round(engagement.professionalFee * 0.18);
  const totalAmount = engagement.professionalFee + gstAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
              <ShieldCheck className="w-4 h-4 text-red-600" />
            </span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-red-600">
                Assessee Client Acceptance Portal &bull; ICAI SA 210
              </div>
              <div className="text-sm font-bold text-slate-900">
                {engagement.clientName}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-900">
          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Engagement Scope</span>
              <span className="text-[10px] font-mono text-slate-500">Ref: {engagement.refNo}</span>
            </div>
            <div className="text-sm font-black text-slate-900">{engagement.scopeTitle}</div>
            
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Auditor Firm:</span>
                <span className="font-bold text-slate-900">{DEFAULT_FIRM_BRANDING.firmName}</span>
                <span className="block text-[10px] text-slate-500">FRN: {DEFAULT_FIRM_BRANDING.frn}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Financial Period:</span>
                <span className="font-bold text-slate-900">{engagement.financialYear}</span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between mt-2">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold block">Agreed Professional Retainer</span>
                <span className="text-xs text-slate-600">Base Fee: ₹{engagement.professionalFee.toLocaleString("en-IN")} + 18% GST (₹{gstAmount.toLocaleString("en-IN")})</span>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-emerald-800">₹{totalAmount.toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-emerald-700 block font-semibold">Total Payable</span>
              </div>
            </div>
          </div>

          {/* Signatory Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Signatory Name *</label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2 font-bold focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Designation / Capacity</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2 font-medium focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Touch Signature Canvas Pad */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-bold flex items-center gap-1">
                <Fingerprint className="w-4 h-4 text-teal-700" />
                <span>Client Counter-Signature (Touch / Stylus / Mouse)</span>
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 rounded-2xl overflow-hidden cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={520}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-32 touch-none block bg-white"
              />
            </div>
          </div>

          {/* Statutory Affirmation */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="accept-terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-0 bg-white border-slate-300 mt-0.5 shrink-0"
            />
            <label htmlFor="accept-terms" className="text-slate-700 leading-relaxed text-[11px] cursor-pointer">
              <strong>Statutory Acceptance (SA 210):</strong> We acknowledge receipt of the Engagement Letter from {DEFAULT_FIRM_BRANDING.firmName}. We confirm our acceptance of the terms, management responsibilities, scope of audit, fee schedule, and unrestricted access to all books of accounts.
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmAcceptance}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4" />
            <span>{isSubmitting ? "Locking Countersignature..." : "Countersign & Accept Engagement"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
