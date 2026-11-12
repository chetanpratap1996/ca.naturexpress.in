"use client";

import React, { useState } from "react";
import { ClientEntity, PortalCredential, DscRecord, PortalType } from "@/lib/types";
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
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Edit3,
  Plus,
  Clock,
  MapPin,
  AlertTriangle,
  ArrowRightLeft,
  Trash2
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";
import { clearSession, normalizePhone10 } from "@/lib/auth/session";

interface ClientProfileSettingsProps {
  client: ClientEntity;
  credentials?: PortalCredential[];
  dscTokens?: DscRecord[];
  onUpdateCredential?: (cred: Partial<PortalCredential> & { id: string }) => Promise<any>;
  onCreateCredential?: (cred: Partial<PortalCredential>) => Promise<any>;
  onDeleteCredential?: (id: string) => Promise<any>;
  onLogout?: () => void;
}

const PORTAL_METADATA: Record<PortalType, { label: string; bg: string; text: string; border: string; defaultUrl: string }> = {
  GST: {
    label: "GST Portal",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    defaultUrl: "https://services.gst.gov.in/services/login",
  },
  INCOME_TAX: {
    label: "Income Tax (ITR)",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    defaultUrl: "https://eportal.incometax.gov.in/iec/foservices/#/login",
  },
  MCA_V3: {
    label: "MCA V3 Corporate",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    defaultUrl: "https://www.mca.gov.in/mcafoportal/login.html",
  },
  TRACES: {
    label: "TRACES (TDS CPC)",
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200",
    defaultUrl: "https://www.tdscpc.gov.in/app/login.xhtml",
  },
  EPFO: {
    label: "EPFO Unified",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    defaultUrl: "https://unifiedportal-emp.epfindia.gov.in/epfo/",
  },
  ESIC: {
    label: "ESIC Insurance",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    defaultUrl: "https://www.esic.in/EmployerPortal/ESICInsurancePortal/Portal_LoginNew.aspx",
  },
  ICEGATE: {
    label: "ICEGATE Customs",
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    defaultUrl: "https://www.icegate.gov.in/",
  },
  OTHER: {
    label: "Custom Portal",
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-300",
    defaultUrl: "",
  },
};

export const ClientProfileSettings: React.FC<ClientProfileSettingsProps> = ({ 
  client,
  credentials = [],
  dscTokens = [],
  onUpdateCredential,
  onCreateCredential,
  onDeleteCredential,
  onLogout 
}) => {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Credentials visibility and copy states
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Client Credential Modal State
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<PortalCredential | null>(null);
  const [credPortalType, setCredPortalType] = useState<PortalType>("GST");
  const [credUsername, setCredUsername] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credLoginUrl, setCredLoginUrl] = useState("");
  const [credMobile, setCredMobile] = useState("");
  const [credTokenPin, setCredTokenPin] = useState("");
  const [credNotes, setCredNotes] = useState("");
  const [isSavingCred, setIsSavingCred] = useState(false);

  const phone = client.primaryContact?.phone || "";
  const phone10 = normalizePhone10(phone);
  const defaultHintPin = phone10.length >= 4 ? phone10.slice(-4) : "0715";

  const handleCopy = (text: string, label: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to Clipboard", `${label} copied successfully.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddCredModal = () => {
    setEditingCred(null);
    setCredPortalType("GST");
    setCredLoginUrl(PORTAL_METADATA.GST.defaultUrl);
    setCredUsername(client.gstin || client.pan || "");
    setCredPassword("");
    setCredMobile(client.primaryContact?.phone || "");
    setCredTokenPin("");
    setCredNotes("");
    setIsCredModalOpen(true);
  };

  const openEditCredModal = (cred: PortalCredential) => {
    setEditingCred(cred);
    setCredPortalType(cred.portalType);
    setCredLoginUrl(cred.loginUrl || PORTAL_METADATA[cred.portalType]?.defaultUrl || "");
    setCredUsername(cred.username);
    setCredPassword(cred.password);
    setCredMobile(cred.registeredMobile || "");
    setCredTokenPin(cred.tokenPin || "");
    setCredNotes(cred.notes || "");
    setIsCredModalOpen(true);
  };

  const handleSaveClientCred = async () => {
    if (!credUsername || !credPassword) {
      toast.error("Required Fields", "Please enter both User ID and Password.");
      return;
    }
    setIsSavingCred(true);
    try {
      const payload: Partial<PortalCredential> = {
        entityId: client.id,
        entityName: client.name,
        portalType: credPortalType,
        portalName: PORTAL_METADATA[credPortalType]?.label || `${credPortalType} Portal`,
        loginUrl: credLoginUrl,
        username: credUsername.trim(),
        password: credPassword.trim(),
        registeredMobile: credMobile.trim() || undefined,
        registeredEmail: client.primaryContact?.email || undefined,
        tokenPin: credTokenPin.trim() || undefined,
        notes: credNotes.trim() || "Updated by Client via Portal",
      };

      if (editingCred) {
        if (onUpdateCredential) {
          await onUpdateCredential({ ...payload, id: editingCred.id });
        } else {
          await fetch("/api/credentials", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, id: editingCred.id, actorName: client.primaryContact?.name || "Client", actorRole: "CLIENT" }),
          });
        }
        toast.success("Password Updated", `Saved and synchronized with GPA & Co. engagement team.`);
      } else {
        if (onCreateCredential) {
          await onCreateCredential(payload);
        } else {
          await fetch("/api/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, actorName: client.primaryContact?.name || "Client", actorRole: "CLIENT" }),
          });
        }
        toast.success("Credential Added", `Securely saved and shared with your CA firm.`);
      }
      setIsCredModalOpen(false);
      setEditingCred(null);
    } catch (err: any) {
      toast.error("Save Failed", err.message || "Failed to save credential.");
    } finally {
      setIsSavingCred(false);
    }
  };

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Entity & Promoter Identity Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-50 text-btred-logo border border-red-200 shadow-sm shrink-0">
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
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              Permanent Account Number (PAN)
            </span>
            <span className="font-mono font-extrabold text-slate-800 text-sm">
              {client.pan}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              GSTIN Identification
            </span>
            <span className="font-mono font-extrabold text-slate-800 text-sm">
              {client.gstin || "Not Applicable / Unregistered"}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
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
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
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

      {/* 2. GOVERNMENT PORTALS & HARDWARE DSC KEYS VAULT (NEW 2-WAY SYNC SECTION) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-btred-logo rounded-2xl border border-red-200 shadow-sm shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                Company Tax Portals &amp; Keys Vault
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Live 2-Way CA Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Instant access to your GST, ITR, and MCA logins + physical DSC token safe locker tracker.
              </p>
            </div>
          </div>

          <button
            onClick={openAddCredModal}
            className="self-start sm:self-auto bg-btred-logo hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Portal Login
          </button>
        </div>

        {/* 2A: Physical DSC USB Dongle Status (If enrolled) */}
        {dscTokens.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-btred-logo" />
              Director Physical DSC USB Tokens ({dscTokens.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dscTokens.map((tok) => {
                const isInSafe = tok.currentCustodian === "Firm Master Safe";
                const isExpiring = tok.daysToExpiry <= 30;
                const isExpired = tok.daysToExpiry <= 0;
                const isRevealed = revealedIds[tok.id];

                return (
                  <div
                    key={tok.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800">
                        {tok.tokenType} &bull; {tok.serialNumber}
                      </span>
                      {isExpired ? (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          Expired
                        </span>
                      ) : isExpiring ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                          Expires in {tok.daysToExpiry}d
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid ({tok.daysToExpiry}d)
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Signatory Director:</span>
                      <strong className="text-xs text-slate-900">{tok.holderName}</strong>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-btred-logo" />
                          Physical Location:
                        </span>
                        <span className={`font-bold px-1.5 py-0.5 rounded ${
                          isInSafe ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                        }`}>
                          {isInSafe ? `Safe Locker: ${tok.vaultSlot}` : `Checked Out (${tok.currentCustodian})`}
                        </span>
                      </div>

                      {tok.tokenPin && (
                        <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-500" />
                            Token User PIN:
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-slate-900">
                              {isRevealed ? tok.tokenPin : "••••••••"}
                            </span>
                            <button
                              onClick={() => toggleReveal(tok.id)}
                              className="p-0.5 hover:bg-slate-100 rounded text-slate-500"
                              title="Show PIN"
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleCopy(tok.tokenPin!, "Token PIN", tok.id + "-cpin")}
                              className="p-0.5 hover:bg-slate-100 rounded text-slate-500"
                              title="Copy PIN"
                            >
                              {copiedId === tok.id + "-cpin" ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2B: Digital Tax Portals Logins */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Tax &amp; Compliance Portal Logins ({credentials.length})
            </span>
            <span className="text-[10px] text-slate-500 normal-case font-medium">1-Click Copy &bull; Never Forgot</span>
          </h4>

          {credentials.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
              <KeyRound className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No Portal Credentials Saved</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Save your company's GST, Income Tax (ITR), MCA, or TRACES logins here. Both you and your CA engagement team will have seamless, secure access.
              </p>
              <button
                onClick={openAddCredModal}
                className="mt-2 bg-btred-logo text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-700"
              >
                + Add Your First Login
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {credentials.map((cred) => {
                const meta = PORTAL_METADATA[cred.portalType] || PORTAL_METADATA.OTHER;
                const isRevealed = revealedIds[cred.id];

                return (
                  <div
                    key={cred.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
                        {meta.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {cred.loginUrl && (
                          <a
                            href={cred.loginUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition"
                            title="Open Portal in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => openEditCredModal(cred)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition"
                          title="Update Password"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      {/* User ID */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Login ID / PAN:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{cred.username}</span>
                          <button
                            onClick={() => handleCopy(cred.username, "Login ID", cred.id + "-usr")}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            title="Copy User ID"
                          >
                            {copiedId === cred.id + "-usr" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                        <span className="text-[11px] text-slate-500">Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {isRevealed ? cred.password : "••••••••••••"}
                          </span>
                          <button
                            onClick={() => toggleReveal(cred.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            title={isRevealed ? "Hide Password" : "Show Password"}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(cred.password, "Password", cred.id + "-pwd")}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            title="Copy Password"
                          >
                            {copiedId === cred.id + "-pwd" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Token PIN if present */}
                      {cred.tokenPin && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                          <span className="text-[11px] text-slate-500">DSC PIN:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">
                              {isRevealed ? cred.tokenPin : "••••••"}
                            </span>
                            <button
                              onClick={() => handleCopy(cred.tokenPin!, "DSC PIN", cred.id + "-cpin2")}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500"
                              title="Copy PIN"
                            >
                              {copiedId === cred.id + "-cpin2" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      {cred.registeredMobile ? (
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          OTP: {cred.registeredMobile}
                        </span>
                      ) : (
                        <span>Updated: {cred.lastChangedDate || "Active"}</span>
                      )}

                      {cred.loginUrl && (
                        <a
                          href={cred.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-btred-logo hover:underline flex items-center gap-0.5"
                        >
                          Launch Portal <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2C: 2-Way Real-time Sync Security Notice */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1 text-emerald-950">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Encrypted 2-Way Practice Sync</span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed">
            Whenever you or your CA firm updates a portal password, it syncs instantly between this client app and GPA &amp; Co.'s master cockpit. No more password resets or filing late fees.
          </p>
        </div>
      </div>

      {/* 3. Security & 4-Digit Access PIN Card */}
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
              <span className="text-[10px] text-slate-600 mt-1 block">
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
              <span className="text-[10px] text-slate-600 mt-1 block">
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
              <span className="text-[10px] text-slate-600 mt-1 block">
                Must match new PIN
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-600">
              Forgot PIN? Contact GPA &amp; Co. to reset in 1 click.
            </span>
            <button
              type="submit"
              disabled={isUpdating}
              className="bg-btred-logo hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-60"
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

      {/* 4. Session & Sign Out Card */}
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

      {/* MODAL: CLIENT ADD / EDIT CREDENTIAL */}
      {isCredModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-btred-logo" />
                {editingCred ? "Update Portal Password" : "Add Portal Login"}
              </h3>
              <button
                onClick={() => setIsCredModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Save or update your portal credentials. Automatically synchronizes with your CA firm.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Portal Type:</label>
                <select
                  value={credPortalType}
                  onChange={(e) => {
                    const t = e.target.value as PortalType;
                    setCredPortalType(t);
                    setCredLoginUrl(PORTAL_METADATA[t]?.defaultUrl || "");
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                >
                  <option value="GST">GST Common Portal</option>
                  <option value="INCOME_TAX">Income Tax e-Filing (ITR)</option>
                  <option value="MCA_V3">MCA V3 Corporate</option>
                  <option value="TRACES">TRACES (TDS CPC)</option>
                  <option value="EPFO">EPFO Unified</option>
                  <option value="ESIC">ESIC Insurance</option>
                  <option value="OTHER">Other Custom Portal</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Username / User ID:</label>
                <input
                  type="text"
                  value={credUsername}
                  onChange={(e) => setCredUsername(e.target.value)}
                  placeholder="e.g. 09AANCP9915B1Z4"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password:</label>
                <input
                  type="text"
                  value={credPassword}
                  onChange={(e) => setCredPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registered OTP Phone:</label>
                  <input
                    type="text"
                    value={credMobile}
                    onChange={(e) => setCredMobile(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">DSC Token PIN:</label>
                  <input
                    type="text"
                    value={credTokenPin}
                    onChange={(e) => setCredTokenPin(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks / Notes:</label>
                <input
                  type="text"
                  value={credNotes}
                  onChange={(e) => setCredNotes(e.target.value)}
                  placeholder="e.g. Reset by Director on Oct 30"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsCredModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                disabled={isSavingCred}
                onClick={handleSaveClientCred}
                className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-5 py-2 rounded-xl transition shadow-sm"
              >
                {isSavingCred ? "Syncing..." : editingCred ? "Update Password" : "Save & Sync"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
