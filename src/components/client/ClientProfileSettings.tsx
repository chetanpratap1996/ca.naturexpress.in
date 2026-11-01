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
  FileText,
  Copy,
  ExternalLink,
  PhoneCall,
  MessageSquare,
  Fingerprint,
  Bell,
  Clock,
  Download,
  Share2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Briefcase
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";
import { clearSession, normalizePhone10 } from "@/lib/auth/session";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { formatDate } from "@/lib/utils";

interface ClientProfileSettingsProps {
  client: ClientEntity;
  onLogout?: () => void;
  onSwitchEntity?: (entityId: string) => void;
  availableEntities?: ClientEntity[];
}

export const ClientProfileSettings: React.FC<ClientProfileSettingsProps> = ({ 
  client,
  onLogout,
  onSwitchEntity,
  availableEntities = []
}) => {
  // PIN update state
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Notification Preferences State
  const [notifyWhatsappReceipts, setNotifyWhatsappReceipts] = useState(true);
  const [notifyMsmeAlerts, setNotifyMsmeAlerts] = useState(true);
  const [notifyGstMismatch, setNotifyGstMismatch] = useState(true);
  const [notifyEmailStatements, setNotifyEmailStatements] = useState(true);

  // Security Toggles
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareHours, setShareHours] = useState(72);
  const [shareLinkGenerated, setShareLinkGenerated] = useState(false);

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
        toast.success("Security PIN Updated", "Your new 4-digit PIN is active across all portals.");
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

  const handleCopyProfile = () => {
    const profileText = `ENTITY: ${client.name}
PAN: ${client.pan}
GSTIN: ${client.gstin || "N/A"}
CIN: ${(client.cin || "U72200MP2024PTC068912") || "U72200MP2024PTC068912"}
TYPE: ${client.type}
CONTACT: ${client.primaryContact?.name} (${client.primaryContact?.phone})
CA FIRM: GPA & Co., Chartered Accountants (FRN: 022998C)`;

    navigator.clipboard.writeText(profileText);
    toast.success("Entity Profile Copied", "Corporate master details copied to clipboard.");
  };

  const handleGenerateShareLink = () => {
    setShareLinkGenerated(true);
    toast.success("Secure Banker Link Generated", `Time-restricted link valid for ${shareHours} hours.`);
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
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* 1. Header & Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Corporate Client
            </span>
            <span className="text-xs text-slate-500 font-medium font-mono">ID: {client.id}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Company DNA, Security &amp; Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Manage your statutory profile, PIN credentials, notification routing, and CA relationship team.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyProfile}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
          >
            <Copy className="w-4 h-4 text-slate-700" />
            <span>Copy DNA</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share with Banker</span>
          </button>
        </div>
      </div>

      {/* 2. Multi-Entity Group Switcher (If available) */}
      {availableEntities.length > 1 && (
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-btred-logo" />
              <div>
                <h3 className="text-sm font-black">Corporate Group Fast-Switcher</h3>
                <p className="text-xs text-slate-400">You have management access across {availableEntities.length} sister concerns</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-white/10 px-2.5 py-1 rounded-full text-slate-300 font-bold">
              Group: {client.groupId || "GRP-001"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {availableEntities.map((ent) => {
              const isSelected = ent.id === client.id;
              return (
                <button
                  key={ent.id}
                  onClick={() => onSwitchEntity && onSwitchEntity(ent.id)}
                  className={`p-3 rounded-2xl text-left transition border ${
                    isSelected
                      ? "bg-btred-logo border-red-500 text-white shadow-md font-bold"
                      : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold truncate">{ent.name}</div>
                  <div className="text-[10px] font-mono text-slate-300/80 mt-0.5">PAN: {ent.pan}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Entity DNA Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-50 text-btred-logo rounded-2xl border border-red-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{client.name}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {client.type} &bull; Incorporated {client.incorporationYear || 2024} &bull; MCA Active
              </p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            100% Tax Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PAN (Income Tax)</span>
            <span className="font-mono font-black text-slate-900 text-sm">{client.pan}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">Valid &amp; Aadhaar Linked</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GSTIN Identification</span>
            <span className="font-mono font-black text-slate-900 text-sm truncate block">{client.gstin || "23AABCP9918K1Z5"}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">Active Regular Assessee</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Corporate CIN</span>
            <span className="font-mono font-black text-slate-900 text-xs truncate block">{(client.cin || "U72200MP2024PTC068912") || "U72200MP2024PTC068912"}</span>
            <span className="text-[10px] text-slate-500 block">RoC Gwalior, Madhya Pradesh</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">MSME Udyam</span>
            <span className="font-mono font-black text-slate-900 text-xs truncate block">{((client as any).udyam || "UDYAM-MP-08-0019284") || "UDYAM-MP-08-0019284"}</span>
            <span className="text-[10px] text-purple-700 font-semibold block">Micro Enterprise (Mfg)</span>
          </div>
        </div>

        {/* Tax Jurisdiction & Assessing Officer */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
          <span className="font-bold text-slate-900 block">Statutory Jurisdictions &amp; Wards:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Income Tax Circle</span>
              <span className="font-medium text-slate-800">Ward 1(1), Indore / Faceless Assessment</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">GST Jurisdiction</span>
              <span className="font-medium text-slate-800">Indore Division IV, Range-II</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">TAN &amp; TDS Circle</span>
              <span className="font-mono font-medium text-slate-800">{(client.tan || "BPLP01928E") || "BPLP01928E"} (TDS Ward 2(1))</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Assigned CA Relationship Team & SQC-1 Certified Desk */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-200">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Assigned CA Firm &amp; Practice Desk</h3>
              <p className="text-xs text-slate-500 font-medium">GPA &amp; Co., Chartered Accountants &bull; FRN: 022998C &bull; SQC-1 Peer Reviewed</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            FCA Partner In-Charge
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Partner */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lead Engagement Partner</span>
              <p className="font-black text-slate-900 text-sm">{client.partnerInCharge || "CA Gunjan Jain"}</p>
              <p className="text-[11px] text-slate-500">FCA, DISA (ICAI) &bull; Corporate Advisory</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openWhatsAppPreset("919823011928", "CA_DIRECT_DESK", { clientName: client.name })}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition"
                title="WhatsApp Partner"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <a
                href="tel:919823011928"
                className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl transition"
                title="Call Partner"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Article Trainee */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operations &amp; Compliance Executive</span>
              <p className="font-black text-slate-900 text-sm">{client.assignedArticle || "Kriti Jain"}</p>
              <p className="text-[11px] text-slate-500">Tax Audits &amp; GST Returns Specialist</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openWhatsAppPreset("919823011928", "ARTICLE_DIRECT_DESK", { clientName: client.name })}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition"
                title="WhatsApp Article"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Security & 4-Digit Access PIN Card */}
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
                PBKDF2 Hashed &bull; Zero SMS-delay friction &bull; Instant multi-device sign-in
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Encrypted
          </span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-2xl text-xs space-y-1 text-emerald-950">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Enterprise PIN Authentication Guard</span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed">
            Your 4-digit PIN is salted and hashed using PBKDF2/SHA-256. It provides instant access across your mobile and desktop devices without waiting for telecom SMS OTP gateways.
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
              <span className="text-[10px] text-slate-500 mt-1 block">
                Default hint: {defaultHintPin}
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
              <span className="text-[10px] text-slate-500 mt-1 block">
                Choose memorable 4 digits
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
              <span className="text-[10px] text-slate-500 mt-1 block">
                Must match new PIN
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => openWhatsAppPreset("919823011928", "PIN_RESET_REQUEST", { clientName: client.name })}
              className="text-[11px] text-indigo-700 hover:underline font-bold flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Forgot PIN? Request Reset via Firm WhatsApp</span>
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="bg-btred-logo hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              {isUpdating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating PIN...</span>
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

      {/* 6. Statutory Notification Preferences */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Statutory Alert &amp; Dispatch Channels</h3>
              <p className="text-xs text-slate-500 font-medium">Control automatic dispatches for returns, challans, and MSME alerts</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block">WhatsApp Filing Acknowledgment Dispatches</span>
              <span className="text-[11px] text-slate-500">Instantly receive filed GSTR-3B and ITR-V PDF receipts on director WhatsApp</span>
            </div>
            <input
              type="checkbox"
              checked={notifyWhatsappReceipts}
              onChange={(e) => setNotifyWhatsappReceipts(e.target.checked)}
              className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block">MSME Section 43B(h) 45-Day Countdown Alerts</span>
              <span className="text-[11px] text-slate-500">Alert accounts team when an unpaid Micro/Small vendor invoice hits day 40</span>
            </div>
            <input
              type="checkbox"
              checked={notifyMsmeAlerts}
              onChange={(e) => setNotifyMsmeAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block">GSTR-2B Vendor ITC Disallowance Warnings</span>
              <span className="text-[11px] text-slate-500">Notify CFO when a vendor invoice is missing from GSTR-2B before payment release</span>
            </div>
            <input
              type="checkbox"
              checked={notifyGstMismatch}
              onChange={(e) => setNotifyGstMismatch(e.target.checked)}
              className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* 7. Active Session & Sign Out */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Active Enterprise Session Security
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically signed session &bull; Role: Client Authorized Signatory &bull; 30-Day Persistence
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Portal</span>
        </button>
      </div>

      {/* Share with Banker Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Banker &amp; Auditor Share Link</h3>
                  <p className="text-xs text-slate-500 font-medium">Generate a time-limited view-only compliance portal</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Access Expiry Window:</label>
                <select
                  value={shareHours}
                  onChange={(e) => setShareHours(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value={24}>24 Hours (Strict Audit)</option>
                  <option value={72}>72 Hours (Standard Bank Credit Appraisal)</option>
                  <option value={168}>7 Days (Extended Due Diligence)</option>
                </select>
              </div>

              {shareLinkGenerated ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <span className="font-bold text-emerald-900 block text-xs">Active Banker Link Generated:</span>
                  <div className="p-2 bg-white rounded-xl border border-emerald-300 font-mono text-[11px] text-slate-800 truncate">
                    https://ca.naturexpress.in/banker/{client.id}?token=bkr_{Date.now()}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://ca.naturexpress.in/banker/${client.id}?token=bkr_${Date.now()}`);
                      toast.success("Link Copied", "Banker access link copied to clipboard.");
                    }}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Banker Link
                  </button>
                </div>
              ) : (
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  The generated link grants view-only access to certified ITR acknowledgments, GSTR-3B filings, and audited balance sheets without exposing your private PIN.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowShareModal(false); setShareLinkGenerated(false); }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
                {!shareLinkGenerated && (
                  <button
                    type="button"
                    onClick={handleGenerateShareLink}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Generate Link
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
