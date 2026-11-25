"use client";

import React, { useState } from "react";
import { BtLogo } from "@/components/shared/BtLogo";
import type { AuthUser } from "@/lib/auth/session";
import { toast } from "@/components/shared/ToastNotification";
import { 
  Building2, 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  MapPin, 
  ArrowRight, 
  X, 
  Sparkles,
  Lock,
  CheckCircle2
} from "lucide-react";

interface PracticeRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (user: AuthUser) => void;
}

export const PracticeRegistrationModal: React.FC<PracticeRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const [firmName, setFirmName] = useState("");
  const [frn, setFrn] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Indore");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName || !partnerName || !email || !phone) {
      toast.warning("Missing Fields", "Please fill in all mandatory practice details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/growth/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: partnerName.trim(),
          companyName: `${firmName.trim()} (FRN: ${frn.trim() || "Pending"})`,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          service: "CA Practice Workspace Provisioning",
          notes: `City: ${city.trim() || "India"} | FRN: ${frn.trim() || "N/A"}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error("Request Failed", data.error || "Could not submit practice provisioning request.");
        return;
      }
      toast.success(
        "Practice Onboarding Request Submitted",
        `Thank you, ${partnerName}. Our enterprise provisioning desk will activate ${firmName} and send verified login credentials.`
      );
      onClose();
    } catch {
      toast.error("Network Error", "Could not reach onboarding server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 selection:bg-red-500 selection:text-white">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 max-h-[94dvh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-200 relative text-center bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex justify-center mb-2">
            <BtLogo size="sm" showTagline={false} />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>14-Day Full Access Practice Trial</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-950">
            Register Your CA Practice
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Empower your firm with UPI fee recovery, banker loan dockets, and 1-tap client onboarding.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="font-bold text-slate-700">Practice Details</span>
          </div>

          {/* Firm Name & FRN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Firm Name *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g. GPA & Co., Chartered Accountants"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">ICAI FRN</label>
              <input
                type="text"
                value={frn}
                onChange={(e) => setFrn(e.target.value)}
                placeholder="022998C"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition uppercase"
              />
            </div>
          </div>

          {/* Partner Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Managing Partner Name *</label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. CA Gunjan Jain, FCA"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                required
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Official Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@firm.in"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Mobile Number (WhatsApp) *</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98937 23639"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* City */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Practice Headquarter City</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Indore"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
              />
            </div>
          </div>

          {/* Assurance bullet points */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-emerald-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant Setup &bull; Zero credit card required</span>
            </div>
            <p className="text-emerald-800 text-[10px] pl-6 leading-relaxed">
              Your practice workspace will be provisioned immediately. You can upload existing client masters via Excel or add clients one-by-one.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-btred-logo hover:bg-red-700 text-white font-black text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-60 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Provisioning Practice Cockpit...</span>
              </>
            ) : (
              <>
                <span>Initialize Firm Workspace &amp; Enter Cockpit</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
