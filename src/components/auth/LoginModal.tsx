"use client";

import React, { useState, useEffect } from "react";
import { BtLogo } from "@/components/shared/BtLogo";
import { 
  AuthUser, 
  setActiveSession,
  authenticateUser
} from "@/lib/auth/session";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { 
  Building2, 
  Users, 
  KeyRound, 
  Mail, 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  Lock,
  AlertCircle, 
  HelpCircle,
  MessageSquare,
  X,
  CheckCircle2
} from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
  onClose?: () => void;
  initialRole?: "partner" | "article" | "client";
  initialPhone?: string;
  clients?: ClientEntity[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  onLoginSuccess,
  onClose,
  initialRole,
  initialPhone = "",
  clients: initialClients = [],
}) => {
  const [clientRegistry, setClientRegistry] = useState<ClientEntity[]>(initialClients);

  const [portalMode, setPortalMode] = useState<"client" | "staff">(() => {
    if (initialRole === "client" || Boolean(initialPhone)) return "client";
    if (initialRole === "partner" || initialRole === "article") return "staff";
    return "client"; // Default to client portal
  });

  const [activeStaffTab, setActiveStaffTab] = useState<"partner" | "article">(() => {
    return initialRole === "article" ? "article" : "partner";
  });
  
  const [identifier, setIdentifier] = useState<string>(() => initialPhone || "");
  const [password, setPassword] = useState("");
  const [membershipNo, setMembershipNo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync clients if props change or fetch from API
  useEffect(() => {
    if (initialClients && initialClients.length > 0) {
      setClientRegistry(initialClients);
    } else {
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => {
          if (data?.clients && Array.isArray(data.clients) && data.clients.length > 0) {
            setClientRegistry(data.clients);
          }
        })
        .catch(() => {});
    }
  }, [initialClients]);

  useEffect(() => {
    if (initialPhone) {
      setIdentifier(initialPhone);
      setPortalMode("client");
    }
  }, [initialPhone]);

  // Handle keyboard Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalMode,
          identifier,
          secret: password,
          membershipNo: portalMode === "staff" ? membershipNo : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        const authenticatedUser: AuthUser = data.user;
        setActiveSession(authenticatedUser);
        setIsSubmitting(false);
        toast.success(
          "Authentication Verified",
          `Welcome, ${authenticatedUser.name} (${authenticatedUser.role === "PARTNER" ? "Managing Partner" : authenticatedUser.role === "ARTICLE" ? "Article Trainee" : "Client Portal"})`
        );
        onLoginSuccess(authenticatedUser);
        return;
      }

      setIsSubmitting(false);
      setErrorMessage(data.error || "Authentication failed. Please verify credentials.");
    } catch {
      // Offline / Local Resilience Fallback
      const result = authenticateUser(identifier, password, clientRegistry);
      setIsSubmitting(false);
      if (result.success && result.user) {
        setActiveSession(result.user);
        toast.info(
          "Local Resilient Session",
          `Logged in: ${result.user.name}`
        );
        onLoginSuccess(result.user);
        return;
      }
      setErrorMessage("Could not reach authentication service. Please verify your registered credentials.");
    }
  };

  // Match recognized client entity if valid phone/PAN entered
  const cleanId = (identifier || "").trim();
  const cleanDigits = cleanId.replace(/\D/g, "");
  const matchedClient = portalMode === "client" && cleanId.length >= 4 ? clientRegistry.find((c) => {
    const p = (c.primaryContact?.phone || "").replace(/\D/g, "");
    if (cleanDigits.length >= 10 && p.slice(-10) === cleanDigits.slice(-10)) return true;
    if (c.pan && c.pan.toUpperCase() === cleanId.toUpperCase()) return true;
    if (c.primaryContact?.email && c.primaryContact.email.toLowerCase() === cleanId.toLowerCase()) return true;
    return false;
  }) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-slate-50 text-slate-900 p-5 sm:p-6 pb-4 border-b border-slate-200 text-center relative shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs"
              title="Close"
              aria-label="Close Login Modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex justify-center mb-2.5">
            <BtLogo size="md" showTagline={false} />
          </div>

          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
            GPA &amp; Co., Chartered Accountants
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            ICAI FRN: 022998C &bull; Practice &amp; Client Compliance Portal
          </p>

          {/* Mode Switcher: Client vs CA Firm Staff */}
          <div className="mt-4 p-1 bg-slate-200/80 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPortalMode("client");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                portalMode === "client"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${portalMode === "client" ? "text-emerald-600" : ""}`} />
              <span>Client Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortalMode("staff");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                portalMode === "staff"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${portalMode === "staff" ? "text-btred-600" : ""}`} />
              <span>CA Practice Staff</span>
            </button>
          </div>

          {/* Staff Sub-Tabs: Partner vs Article */}
          {portalMode === "staff" && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveStaffTab("partner");
                  setErrorMessage(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  activeStaffTab === "partner"
                    ? "bg-btred-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Managing Partner (FCA)
              </button>
              <span className="text-slate-300">&bull;</span>
              <button
                type="button"
                onClick={() => {
                  setActiveStaffTab("article");
                  setErrorMessage(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  activeStaffTab === "article"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Staff / Article Desk
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-btred-600 p-3.5 rounded-2xl text-xs space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-btred-600" />
                <span className="font-bold leading-relaxed">{errorMessage}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-red-200/60 text-[11px]">
                <span className="text-slate-600">Need help with login?</span>
                <a
                  href="https://wa.me/919893723639?text=Hello%20GPA%20%26%20Co.%2C%20I%20need%20assistance%20logging%20into%20my%20compliance%20portal."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp Firm Helpdesk</span>
                </a>
              </div>
            </div>
          )}

          {/* Recognized Client Badge */}
          {portalMode === "client" && matchedClient && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{matchedClient.name}</span>
                </span>
                <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                  Verified Client
                </span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Primary Authorized Signatory: <strong>{matchedClient.primaryContact?.name || "Director"}</strong>
              </p>
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {portalMode === "client"
                  ? "Registered Mobile Number, PAN, or Official Email"
                  : activeStaffTab === "partner"
                  ? "Managing Partner Registered Email / Mobile"
                  : "Article Assistant Registered Email / Mobile"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {portalMode === "client" ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    portalMode === "client" 
                      ? "e.g. 9893723639 or PAN number" 
                      : activeStaffTab === "partner"
                      ? "partner@brainsandtaxes.com"
                      : "staff@brainsandtaxes.com"
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  {portalMode === "client" ? "4-Digit Security Access PIN" : "Staff Security Password"}
                </label>
                {portalMode === "client" && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    Issued by GPA &amp; Co.
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={portalMode === "client" ? "••••" : "••••••••••••"}
                  maxLength={portalMode === "client" ? 10 : 50}
                  inputMode={portalMode === "client" ? "numeric" : "text"}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition tracking-widest"
                  required
                />
              </div>
              {portalMode === "client" && (
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span>Enter the 4-digit PIN assigned to your company. Contact our desk if you need an instant PIN reset.</span>
                </p>
              )}
            </div>

            {portalMode === "staff" && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {activeStaffTab === "partner" ? "ICAI FRN / Fellow Membership No." : "ICAI Student Registration No. (CRO / WRO)"}
                </label>
                <input
                  type="text"
                  value={membershipNo}
                  onChange={(e) => setMembershipNo(e.target.value)}
                  placeholder={activeStaffTab === "partner" ? "022998C" : "CRO022998"}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition uppercase"
                  required
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-btred-600 hover:bg-btred-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-red-600/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating with Practice Registry...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Secure Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Secure Institutional Compliance Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit Encrypted Portal</span>
            </span>
            <a
              href="https://wa.me/919893723639?text=Hello%20GPA%20%26%20Co.%2C%20I%20need%20login%20assistance."
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-btred-600 hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Login Help</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};
