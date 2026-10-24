"use client";

import React, { useState } from "react";
import { 
  Smartphone, 
  UploadCloud, 
  Camera, 
  CheckCircle2, 
  Sparkles, 
  X, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Lock, 
  ArrowRight,
  Check
} from "lucide-react";

interface MagicLinkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  taskTitle: string;
}

export const MagicLinkUploadModal: React.FC<MagicLinkUploadModalProps> = ({
  isOpen,
  onClose,
  entityName,
  taskTitle,
}) => {
  const [stage, setStage] = useState<"ready" | "scanning" | "extracted" | "completed">("ready");
  const [extractedData, setExtractedData] = useState<{
    invoiceNo: string;
    date: string;
    gstin: string;
    amount: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSimulateCameraCapture = () => {
    setStage("scanning");
    setTimeout(() => {
      setExtractedData({
        invoiceNo: "HDFC/0029/SEP26/410",
        date: "2026-09-30",
        gstin: "27AAACH2702H1Z1",
        amount: "₹18,45,210.00",
      });
      setStage("extracted");
    }, 1500);
  };

  const handleConfirmUpload = () => {
    setStage("completed");
    setTimeout(() => {
      // Auto close after 3s or user clicks
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-700 space-y-4 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mobile Mockup Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-800">
            Zero-Password Client View
          </span>
          <h3 className="text-base font-black text-white mt-1">
            WhatsApp 1-Tap Document Ingestion
          </h3>
          <p className="text-xs text-slate-400">
            {entityName}
          </p>
        </div>

        {/* Client Request Context Box */}
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-xs space-y-1 text-slate-300">
          <span className="text-[10px] uppercase font-bold text-red-400 block">Requested by CA Firm</span>
          <p className="font-black text-white">{taskTitle}</p>
          <p className="text-[11px] text-slate-400">Need bank statement PDF or purchase bill photo to close Sept GSTR-3B.</p>
        </div>

        {/* Stage 1: Ready to Upload or Snap Camera */}
        {stage === "ready" && (
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleSimulateCameraCapture}
              className="w-full bg-btred-logo hover:bg-btred-700 text-white text-xs font-black py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              <Camera className="w-4 h-4" />
              Snap Photo with Phone Camera
            </button>

            <button
              onClick={handleSimulateCameraCapture}
              className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-black py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 border border-white/15"
            >
              <UploadCloud className="w-4 h-4" />
              Select PDF from WhatsApp / Files
            </button>
            <p className="text-[10px] text-slate-500 text-center font-medium">
              No account login or password required. End-to-end encrypted.
            </p>
          </div>
        )}

        {/* Stage 2: Camera Scanning with Optical Extraction */}
        {stage === "scanning" && (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="text-xs font-black text-white">Smart OCR Scanning Document...</p>
              <p className="text-[11px] text-slate-400">Detecting Invoice Number, GSTIN &amp; Statement Balances</p>
            </div>
          </div>
        )}

        {/* Stage 3: OCR Extracted Preview */}
        {stage === "extracted" && extractedData && (
          <div className="space-y-3 pt-1">
            <div className="bg-emerald-950/60 border border-emerald-700/60 p-3.5 rounded-2xl space-y-1.5 text-xs">
              <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> OCR Auto-Extraction Verified
              </span>
              <div className="text-[11px] space-y-1 text-slate-300">
                <p>Doc Ref: <strong className="text-white font-mono">{extractedData.invoiceNo}</strong></p>
                <p>Statement Period: <strong className="text-white">{extractedData.date}</strong></p>
                <p>Closing Turnover: <strong className="text-emerald-400 font-bold">{extractedData.amount}</strong></p>
              </div>
            </div>

            <button
              onClick={handleConfirmUpload}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-3 rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm &amp; Attach to CA File
            </button>
          </div>
        )}

        {/* Stage 4: Completed */}
        {stage === "completed" && (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Received &amp; Verified!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Document attached to your September 2026 GST Docket. Your article clerk Rohan Verma has been notified to resume filing.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 text-xs text-slate-400 hover:text-white underline font-bold"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
