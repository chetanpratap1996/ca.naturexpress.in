"use client";

import React, { useState } from "react";
import { ClientEntity } from "@/lib/types";
import { 
  ShieldCheck, 
  KeyRound, 
  Building2, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  User,
  LogOut,
  HelpCircle,
  FileText
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";
import { clearSession, normalizePhone10 } from "@/lib/auth/session";

interface ClientProfileSettingsProps {
  client: ClientEntity;
  onLogout?: () => void;
}

export const ClientProfileSettings: React.FC<ClientProfileSettingsProps> = ({ 
  client,
  onLogout 
}) => {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phone = client.primaryContact?.phone || "";
  const phone10 = normalizePhone10(phone);
  const defaultHintPin = phone10.length >= 4 ? phone10.slice(-4) : "0715";

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!currentPin || currentPin.length !== 4) {
      setErrorMsg("Please enter your current 4-digit PIN.");
      return;
    }

    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorMsg("New PIN must be exactly 4 digits (0000 - 9999).");
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg("New PIN and Confirm PIN do not match.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: client.id,
          currentPin,
          newPin,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg("Security PIN updated successfully! Use your new PIN for future logins.");
        toast.success("Security PIN Updated", "Your new 4-digit PIN is active.");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        setErrorMsg(data.error || "Failed to update PIN. Please verify your current PIN.");
      }
    } catch (err) {
      setErrorMsg("Network error while updating PIN. Please check your connection.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = () => {
    clearSession();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. Entity & Promoter Identity Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-sm shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {client.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Type: {client.type} &bull; Incorporation: {client.incorporationYear || 2024}
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Active Practice Client
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Permanent Account Number (PAN)
            </span>
            <span className="font-mono font-extrabold text-slate-800 text-sm">
              {client.pan}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              GSTIN Identification
            </span>
            <span className="font-mono font-extrabold text-slate-800 text-sm">
              {client.gstin || "Not Applicable / Unregistered"}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <User className="w-3 h-3" />
              <span>Authorized Contact Person</span>
            </div>
            <span className="font-bold text-slate-800 block text-xs">
              {client.primaryContact?.name || "Authorized Director"}
            </span>
            <span className="text-[11px] text-slate-500">
              {client.primaryContact?.designation || "Director"}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Smartphone className="w-3 h-3" />
              <span>Registered Mobile for Portal</span>
            </div>
            <span className="font-mono font-bold text-slate-800 block text-xs">
              {client.primaryContact?.phone || "8077170715"}
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              {client.primaryContact?.email || "director@company.in"}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>Assigned CA: <strong>{client.partnerInCharge || "CA Gunjan Jain"}</strong></span>
          <span>Article In-Charge: <strong>{client.assignedArticle || "Kriti Jain"}</strong></span>
        </div>
      </div>

      {/* 2. Security & 4-Digit Access PIN Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Security &amp; 4-Digit Access PIN
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Zero-SMS OTP friction &bull; Instant 1-tap sign-in from your phone
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Active
          </span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-2xl text-xs space-y-1 text-emerald-950">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Why 4-Digit PIN instead of SMS OTP?</span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed">
            SMS OTPs often face mobile network delays and DND blocks. Your private 4-digit PIN gives you instant, tamper-proof access anytime you or your bankers need audited balance sheets or filed ITRs.
          </p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Change PIN Form */}
        <form onSubmit={handleUpdatePin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                placeholder={`e.g. ${defaultHintPin}`}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono tracking-widest text-slate-900 focus:outline-none focus:border-slate-800 transition"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default: {defaultHintPin} (last 4 digits)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4 digits"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono tracking-widest text-slate-900 focus:outline-none focus:border-slate-800 transition"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Any 4 numeric digits
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm New PIN
              </label>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Repeat 4 digits"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono tracking-widest text-slate-900 focus:outline-none focus:border-slate-800 transition"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Must match new PIN
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Forgot PIN? Contact GPA &amp; Co. to reset in 1 click.
            </span>
            <button
              type="submit"
              disabled={isUpdating}
              className="bg-slate-900 hover:bg-black text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              {isUpdating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Security PIN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Session & Sign Out Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800">
            Active Session Security
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Your login token is cryptographically protected with 30-day persistence.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
