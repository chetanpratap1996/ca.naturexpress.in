"use client";

import React, { useState, useEffect } from "react";
import { BtLogo } from "@/components/shared/BtLogo";
import { 
  AuthUser, 
  DEMO_USERS, 
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
  Sparkles,
  Lock,
  AlertCircle,
  HelpCircle,
  Check,
  Copy,
  MessageSquare,
  X,
  Zap
} from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
  onClose?: () => void;
  initialRole?: "partner" | "article" | "client";
  clients?: ClientEntity[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  onLoginSuccess,
  onClose,
  initialRole,
  clients: initialClients = [],
}) => {
  const [clientRegistry, setClientRegistry] = useState<ClientEntity[]>(initialClients);

  const [portalMode, setPortalMode] = useState<"client" | "staff">(() => {
    if (initialRole === "client") return "client";
    if (initialRole === "partner" || initialRole === "article") return "staff";
    return "client";
  });

  const [activeStaffTab, setActiveStaffTab] = useState<"partner" | "article">("partner");
  
  const [identifier, setIdentifier] = useState("");
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

  const handleFillDemoCredentials = () => {
    if (portalMode === "client") {
      const activeClient = clientRegistry[0];
      const phone = activeClient?.primaryContact?.phone || "8077170715";
      const digits = phone.replace(/\D/g, "");
      const defaultPin = digits.length >= 4 ? digits.slice(-4) : "0715";
      setIdentifier(phone);
      setPassword(defaultPin);
      setMembershipNo("");
    } else {
      if (activeStaffTab === "partner") {
        setIdentifier(DEMO_USERS.partner.email);
        setPassword("Partner@2026");
        setMembershipNo("022998C");
      } else {
        setIdentifier(DEMO_USERS.article.email);
        setPassword("Article@2026");
        setMembershipNo("CRO022998");
      }
    }
    setErrorMessage(null);
    toast.info("Demo Credentials Filled", "You can now click 'Secure Sign In' or modify credentials.");
  };

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
    } catch (netErr) {
      // Offline / Local Resilience Fallback
      const result = authenticateUser(identifier, password, clientRegistry);
      setIsSubmitting(false);
      if (result.success && result.user) {
        setActiveSession(result.user);
        toast.info(
          "Local Resilient Session",
          `Logged in via local credentials: ${result.user.name}`
        );
        onLoginSuccess(result.user);
        return;
      }
      setErrorMessage("Could not reach authentication service. Please verify your credentials.");
    }
  };

  const handleQuickDemoLogin = (role: "partner" | "article" | "client") => {
    setIsSubmitting(true);
    setTimeout(() => {
      const targetUser = DEMO_USERS[role];

      if (!targetUser) {
        setIsSubmitting(false);
        setErrorMessage("User profile not found.");
        return;
      }

      setActiveSession(targetUser);
      setIsSubmitting(false);
      toast.success(
        "Sandbox Session Initialized",
        `Welcome, ${targetUser.name} (${role === "partner" ? "Partner Cockpit" : role === "article" ? "Article Assistant" : "Client Portal"})`
      );
      onLoginSuccess(targetUser);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4 selection:bg-red-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(#e52320_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 max-h-[96dvh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="bg-white text-slate-900 p-5 sm:p-6 pb-5 border-b border-slate-200 text-center relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
              title="Return to Home"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-center mb-2.5">
            <BtLogo size="md" showTagline={false} />
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight">
            GPA &amp; Co. Chartered Accountants
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            ICAI FRN: 022998C &bull; Practice &amp; Client Compliance Portal
          </p>

          {/* Mode Switcher */}
          <div className="mt-4 p-1 bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPortalMode("client");
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                portalMode === "client"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Client Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode("staff");
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                portalMode === "staff"
                  ? "bg-btred-logo text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>CA Practice Staff</span>
            </button>
          </div>

          {/* Staff Sub-Tabs */}
          {portalMode === "staff" && (
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveStaffTab("partner");
                  setErrorMessage(null);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                  activeStaffTab === "partner"
                    ? "bg-btred-logo text-white"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Managing Partner
              </button>
              <span className="text-slate-600">&bull;</span>
              <button
                type="button"
                onClick={() => {
                  setActiveStaffTab("article");
                  setErrorMessage(null);
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                  activeStaffTab === "article"
                    ? "bg-btred-logo text-white"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Article Trainee
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-btred-logo p-3.5 rounded-2xl text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-bold leading-relaxed">{errorMessage}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-red-200/60 text-[11px]">
                <span className="text-slate-600">Need help with login?</span>
                <a
                  href="https://wa.me/917999995897?text=Hello%20GPA%20%26%20Co.%2C%20I%20need%20assistance%20logging%20into%20my%20compliance%20portal."
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

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {portalMode === "client"
                    ? "Registered Mobile Number, PAN, or Email"
                    : activeStaffTab === "partner"
                    ? "Partner Registered Email"
                    : "Article Assistant Email"}
                </label>
                <button
                  type="button"
                  onClick={handleFillDemoCredentials}
                  className="text-[10px] text-btred-logo hover:underline font-bold flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>Fill Demo</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
                  {portalMode === "client" ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={portalMode === "client" ? "e.g. 8077170715 or PAN" : "partner@firm.com"}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {portalMode === "client" ? "4-Digit Security Access PIN" : "Staff Security Password"}
                </label>
                {portalMode === "client" && (
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Zero-SMS Direct Access
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={portalMode === "client" ? "e.g. 0715" : "••••••••••••"}
                  maxLength={portalMode === "client" ? 4 : 50}
                  inputMode={portalMode === "client" ? "numeric" : "text"}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition tracking-widest"
                  required
                />
              </div>
              {portalMode === "client" && (
                <p className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                  <span className="text-emerald-600 font-bold">💡 Tip:</span>
                  <span>Default PIN is the last 4 digits of your registered phone.</span>
                </p>
              )}
            </div>

            {portalMode === "staff" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activeStaffTab === "partner" ? "ICAI FRN / Membership No." : "ICAI Student Registration No."}
                </label>
                <input
                  type="text"
                  value={membershipNo}
                  onChange={(e) => setMembershipNo(e.target.value)}
                  placeholder={activeStaffTab === "partner" ? "022998C" : "CRO022998"}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-800 transition uppercase"
                  required
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-btred-logo hover:bg-red-700 text-white font-black text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating with Practice Registry...</span>
              </>
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* 1-Click Sandbox Evaluation Access */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600 block text-center mb-2">
              Evaluation Sandbox &bull; 1-Click Persona Access
            </span>

            {portalMode === "client" ? (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("client")}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enter as Apex AutoTech Director (Live Client PWA)</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("partner")}
                  className="py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-btred-logo rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Partner Cockpit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("article")}
                  className="py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Article Desk</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
