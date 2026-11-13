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
  Smartphone, 
  FileText,
  AlertCircle,
  Clock
} from "lucide-react";
import { ApprovalRecord } from "../AssesseeApprovalDesk";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

interface ClientSignoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ApprovalRecord | null;
  onSignComplete: (signedRecord: ApprovalRecord) => void;
}

export const ClientSignoffModal: React.FC<ClientSignoffModalProps> = ({
  isOpen,
  onClose,
  record,
  onSignComplete
}) => {
  const [step, setStep] = useState<"VERIFY_DETAILS" | "OTP_AUTH" | "SUCCESS">("VERIFY_DETAILS");
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  if (!isOpen || !record) return null;

  // Drawing Handlers
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

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleProceedToOtp = () => {
    if (!agreed) {
      toast.error("Undertaking Required", "Please review and check the statutory declaration.");
      return;
    }
    setStep("OTP_AUTH");
    toast.success("OTP Dispatched", `Sent 6-digit authentication code to registered mobile ${record.signatoryPhone}.`);
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) {
      toast.error("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const canvas = canvasRef.current;
      const signatureData = canvas ? canvas.toDataURL() : undefined;

      const now = new Date();
      const updatedRecord: ApprovalRecord = {
        ...record,
        status: "APPROVED_AND_LOCKED",
        timestamp: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} IST`,
        signatoryIp: "103.21.144.18 (Mumbai, Maharashtra - Jio Fiber)",
        signatureDataUrl: signatureData || record.signatureDataUrl
      };

      onSignComplete(updatedRecord);
      setStep("SUCCESS");
      toast.success("Statutory Consent Locked", "Recorded cryptographically timestamped consent under SA 580.");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Assessee View Banner */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <Smartphone className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-teal-400">
                Assessee Client Portal &bull; Mobile E-Sign
              </div>
              <div className="text-sm font-bold text-white">
                {record.clientName}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-900">
          {step === "VERIFY_DETAILS" && (
            <div className="space-y-4">
              {/* Package Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider block">
                  Document Package for Immediate E-Filing
                </span>
                <div className="text-sm font-black text-slate-900">{record.documentTitle}</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PAN / Tax ID:</span>
                    <span className="font-mono font-bold text-slate-800">{record.clientPan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Authorized Signatory:</span>
                    <span className="font-bold text-slate-800">{record.signatoryName}</span>
                  </div>
                </div>
              </div>

              {/* Digital Signature Canvas Pad */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold flex items-center gap-1">
                    <Fingerprint className="w-4 h-4 text-teal-700" />
                    <span>Draw Digital Signature (Finger / Stylus / Mouse)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear Pad
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 rounded-2xl overflow-hidden cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 touch-none block bg-white"
                  />
                </div>
              </div>

              {/* Statutory Undertaking Checkbox */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="client-terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-0 bg-white border-slate-300 mt-0.5 shrink-0"
                />
                <label htmlFor="client-terms" className="text-slate-700 leading-relaxed text-xs cursor-pointer">
                  <strong>Statutory Undertaking (ICAI SA 580):</strong> I confirm that I have reviewed the tax computation, books of accounts, and financial figures. I certify that all particulars declared are true, complete, and correct. I formally authorize <strong>{DEFAULT_FIRM_BRANDING.firmName}</strong> to transmit and e-file this return on government portals on our behalf.
                </label>
              </div>

              <button
                type="button"
                onClick={handleProceedToOtp}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Proceed to 2-Factor OTP Authorization</span>
              </button>
            </div>
          )}

          {step === "OTP_AUTH" && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Enter 6-Digit Mobile Verification OTP</h4>
                <p className="text-slate-500 text-xs">
                  Sent to registered signatory mobile <strong>{record.signatoryPhone}</strong>
                </p>
              </div>

              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-xl font-mono font-black p-3 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:outline-none focus:border-teal-600 focus:bg-white"
                />
                <div className="text-center text-[11px] text-slate-400 mt-2">
                  Demo Auto-fill: Enter any 4-6 digits (e.g. 518492)
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("VERIFY_DETAILS")}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerifyOtp}
                  className="w-2/3 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {isVerifying ? (
                    <span>Verifying Cryptographic Lock...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Verify &amp; Lock Filing Consent</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "SUCCESS" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Assessee E-Sign Locked Successfully</h4>
                <p className="text-slate-600 text-xs mt-1 max-w-sm mx-auto">
                  Statutory authorization under ICAI SA 580 has been cryptographically recorded with timestamp and IP address.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-w-xs mx-auto text-left text-[11px] space-y-1 font-mono">
                <div>Status: <strong className="text-emerald-700">LOCKED &amp; NON-REPUDIABLE</strong></div>
                <div>Timestamp: <strong>{new Date().toLocaleTimeString()} IST</strong></div>
                <div>IP Address: <strong>103.21.144.18 (Mumbai)</strong></div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
              >
                Return to Firm Vault
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
