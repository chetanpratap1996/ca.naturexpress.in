"use client";

import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Fingerprint, 
  Download, 
  ArrowRight, 
  Building2, 
  Calendar, 
  Lock, 
  FileCheck,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface EsignApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName?: string;
  pan?: string;
  filingTitle?: string;
  onSignedSuccessfully?: () => void;
}

export const EsignApprovalModal: React.FC<EsignApprovalModalProps> = ({
  isOpen,
  onClose,
  entityName = "Corporate Client Entity",
  pan = "AAACS9182C",
  filingTitle = "Audited Financial Statements & Tax Audit Form 3CD (FY 2025-26)",
  onSignedSuccessfully
}) => {
  const [step, setStep] = useState<"SUMMARY" | "AADHAAR_OTP" | "COMPLETED">("SUMMARY");
  const [aadhaarNumber, setAadhaarNumber] = useState<string>("XXXX-XXXX-9182");
  const [otpInput, setOtpInput] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [signedDocId, setSignedDocId] = useState<string>("");

  if (!isOpen) return null;

  const handleRequestOtp = () => {
    setStep("AADHAAR_OTP");
  };

  const handleVerifyOtp = () => {
    if (otpInput.length < 4) {
      alert("Please enter the 6-digit Aadhaar OTP");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setSignedDocId(`ESIGN-IN-${Date.now().toString().slice(-6)}`);
      setStep("COMPLETED");
      if (onSignedSuccessfully) onSignedSuccessfully();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                1-Touch Aadhaar e-Sign &amp; Filing Approval
              </h3>
              <p className="text-xs text-slate-500">
                Official Signatory Consent under Information Technology Act 2000
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {step === "SUMMARY" && (
            <div className="space-y-5">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Filing Package for Approval
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5">{filingTitle}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Entity: <strong>{entityName}</strong> (PAN: {pan})
                </div>
              </div>

              {/* 1-Page Financial Executive Card */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Executive Financial Snapshot (Audited FY 2025-26)
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Revenue</span>
                    <span className="text-base font-black text-slate-900">{formatCurrencyINR(24500000)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">+18.2% vs FY25</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold">Net Profit (PAT)</span>
                    <span className="text-base font-black text-slate-900">{formatCurrencyINR(3240000)}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">Margin: 13.2%</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Tax Computed</span>
                    <span className="text-base font-black text-slate-900">{formatCurrencyINR(815000)}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">Sec 115BAA @ 25.17%</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold">Advance Tax &amp; TDS</span>
                    <span className="text-base font-black text-emerald-600">{formatCurrencyINR(815000)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">100% Fully Paid (Nil Due)</span>
                  </div>
                </div>
              </div>

              {/* Legal Signatory Affirmation */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Signatory Declaration:
                </div>
                <p className="text-[11px] leading-relaxed">
                  I, the Authorized Director, hereby confirm that the financial statements, ledgers, and CARO disclosures prepared by {DEFAULT_FIRM_BRANDING.firmName} have been examined and are true and complete.
                </p>
              </div>

              <button
                onClick={handleRequestOtp}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
              >
                Proceed to Aadhaar OTP e-Sign
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "AADHAAR_OTP" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Enter Aadhaar Verification OTP</h4>
                <p className="text-xs text-slate-500">
                  A 6-digit one-time password has been sent to the mobile linked with Aadhaar ending in <strong>...9182</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 6-digit OTP (e.g. 782190)"
                  className="w-full text-center tracking-widest text-xl font-mono font-bold py-3 bg-slate-50 border border-slate-300 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Valid for 10 minutes</span>
                  <button className="text-indigo-600 hover:underline font-semibold">Resend OTP</button>
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifying}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Affixing Digital e-Signature...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Authorize &amp; Affix Legal e-Sign
                  </>
                )}
              </button>
            </div>
          )}

          {step === "COMPLETED" && (
            <div className="space-y-5 text-center py-4 animate-fadeIn">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">e-Signature Affixed Successfully!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  The filing package has been legally signed and timestamped. Official transmission to the government portal is now unblocked.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-600">
                e-Sign Certificate ID: <strong className="text-slate-900">{signedDocId}</strong>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
                >
                  Done &amp; Return to Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
