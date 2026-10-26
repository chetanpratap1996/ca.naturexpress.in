"use client";

import React, { useState, useEffect } from "react";
import { AuthUser, DEMO_USERS, setActiveSession, generateDeterministicPassword } from "@/lib/auth/session";
import { BtLogo } from "@/components/shared/BtLogo";
import { toast } from "@/components/shared/ToastNotification";
import { 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  Building2, 
  ArrowRight, 
  Smartphone, 
  Mail, 
  Lock, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Briefcase
} from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
  initialRole?: "partner" | "article" | "client";
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  onLoginSuccess,
  initialRole
}) => {
  // Determine if this is client portal login or staff practice login
  const [portalMode, setPortalMode] = useState<"client" | "staff">(() => {
    if (initialRole === "client") return "client";
    if (initialRole === "partner" || initialRole === "article") return "staff";
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("view");
      if (p === "client") return "client";
      if (p === "partner" || p === "article" || p === "admin") return "staff";
    }
    return "client";
  });

  const [activeStaffTab, setActiveStaffTab] = useState<"partner" | "article">("partner");
  const [emailOrPhone, setEmailOrPhone] = useState(
    portalMode === "client" ? DEMO_USERS.client.phone : DEMO_USERS.partner.email
  );
  const [password, setPassword] = useState(
    portalMode === "client" ? (DEMO_USERS.client.defaultPassword || "Chetan@0715") : "Gunjan@3639"
  );
  const [membershipNo, setMembershipNo] = useState(
    portalMode === "client" ? "" : "022998C"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHint, setCopiedHint] = useState(false);

  useEffect(() => {
    if (portalMode === "client") {
      setEmailOrPhone(DEMO_USERS.client.phone);
      setPassword(DEMO_USERS.client.defaultPassword || "Chetan@0715");
      setMembershipNo("");
    } else {
      if (activeStaffTab === "partner") {
        setEmailOrPhone(DEMO_USERS.partner.email);
        setPassword("Gunjan@3639");
        setMembershipNo("022998C");
      } else {
        setEmailOrPhone(DEMO_USERS.article.email);
        setPassword("Kriti@5897");
        setMembershipNo("CRO022998");
      }
    }
    setErrorMessage(null);
  }, [portalMode, activeStaffTab]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    setTimeout(() => {
      let user: AuthUser;

      if (portalMode === "client") {
        const clientDemo = DEMO_USERS.client;
        const cleanInputPhone = emailOrPhone.trim();
        const cleanInputPass = password.trim();

        user = {
          ...clientDemo,
          phone: cleanInputPhone || clientDemo.phone,
          defaultPassword: cleanInputPass || clientDemo.defaultPassword,
          token: `tok_client_${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };

        const expectedPassword = clientDemo.defaultPassword || "Chetan@0715";
        if (cleanInputPass !== expectedPassword && !cleanInputPass.includes("@")) {
          setIsSubmitting(false);
          setErrorMessage(
            `Invalid Password. Zero-DLT format is [FirstName or Company]@[Last 4 digits of Phone]. Example: ${expectedPassword}`
          );
          return;
        }
      } else {
        if (activeStaffTab === "partner") {
          user = DEMO_USERS.partner;
        } else {
          user = DEMO_USERS.article;
        }

        const expectedPassword = user.defaultPassword || "Gunjan@3639";
        const cleanInputPassword = password.trim();

        if (cleanInputPassword !== expectedPassword && !cleanInputPassword.includes("@")) {
          setIsSubmitting(false);
          setErrorMessage(
            `Invalid Password. Practice format is [FirstName]@[Last 4 digits of Phone]. Example: ${expectedPassword}`
          );
          return;
        }
      }

      setActiveSession(user);
      setIsSubmitting(false);
      toast.success(
        "Authentication Verified",
        `Welcome, ${user.name} (${user.designation || user.role})`
      );
      onLoginSuccess(user);
    }, 400);
  };

  const handleQuickDemoLogin = (role: "partner" | "article" | "client") => {
    setIsSubmitting(true);
    setTimeout(() => {
      const user = DEMO_USERS[role];
      if (!user) {
        setIsSubmitting(false);
        setErrorMessage("User configuration not found. Please log in with credentials.");
        return;
      }
      setActiveSession(user);
      setIsSubmitting(false);
      toast.success(
        "Instant Sign In",
        `Welcome back, ${user.name} (${role === "partner" ? "Managing Partner" : role === "article" ? "Article Trainee" : "Client Portal"})`
      );
      onLoginSuccess(user);
    }, 250);
  };

  const copyCreds = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHint(true);
    toast.info("Copied to Clipboard", text);
    setTimeout(() => setCopiedHint(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-4 selection:bg-red-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#e52320_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 max-h-[94dvh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 pb-5 border-b border-slate-800 text-center relative">
          <div className="flex justify-center mb-3">
            <BtLogo size="md" showTagline={false} />
          </div>

          {portalMode === "client" ? (
            <>
              <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-[10px] text-emerald-300 font-bold mb-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Client Financial Collaboration Portal</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Pratwi Solutions Private Limited
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Managed by GPA &amp; Co., Chartered Accountants
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 bg-red-950/80 border border-red-500/40 px-3 py-1 rounded-full text-[10px] text-red-300 font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-btred-logo" />
                <span>CA Firm Practice &amp; Staff Desk</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                GPA &amp; Co. Chartered Accountants
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ICAI FRN: 022998C &bull; Practice Management System
              </p>
            </>
          )}
        </div>

        {/* Staff Switcher - ONLY shown in Staff Mode */}
        {portalMode === "staff" && (
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveStaffTab("partner")}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeStaffTab === "partner" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-btred-logo" />
              CA Partner
            </button>
            <button
              type="button"
              onClick={() => setActiveStaffTab("article")}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeStaffTab === "article" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              Kriti Jain (Article)
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-btred-logo p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Zero-DLT Password Explanation Card */}
          <div className="bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-2xl text-[11px] space-y-1">
            <div className="font-bold flex items-center justify-between text-slate-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Zero-SMS Deterministic Credential:
              </span>
              <button
                type="button"
                onClick={() =>
                  copyCreds(
                    portalMode === "client"
                      ? (DEMO_USERS.client.defaultPassword || "Chetan@0715")
                      : activeStaffTab === "article"
                      ? "Kriti@5897"
                      : "Gunjan@3639"
                  )
                }
                className="text-indigo-600 hover:underline flex items-center gap-1 text-[10px] font-bold"
              >
                {copiedHint ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedHint ? "Copied" : "Copy Password"}
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed text-[10px]">
              Password standard: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-900">[FirstName/Company]@[Last 4 Phone]</strong>.
              {portalMode === "client" ? " (e.g., Chetan@0715)" : activeStaffTab === "article" ? " (Kriti@5897)" : " (Gunjan@3639)"}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {portalMode === "client"
                  ? "Registered Mobile Number or Entity PAN"
                  : "Partner / Staff Email Address"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {portalMode === "client" ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder={portalMode === "client" ? "+91 80771 70715 or AANCP9915B" : "partner@firm.com"}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Zero-DLT Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={portalMode === "client" ? "Chetan@0715" : "Gunjan@3639"}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition font-mono"
                  required
                />
              </div>
            </div>

            {portalMode === "staff" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activeStaffTab === "partner" ? "ICAI Membership Number" : "ICAI Student Registration (CRO)"}
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
            className="w-full bg-slate-900 hover:bg-black text-white font-black text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Dedicated Fast-Track Login - STRICTLY SEPARATE */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block text-center mb-2">
              1-Click Verified Login
            </span>

            {portalMode === "client" ? (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("client")}
                className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-emerald-950 block">
                    Chetan Pratap Singh (Director)
                  </span>
                  <span className="text-[10px] text-emerald-800 font-medium">
                    Pratwi Solutions Private Limited &bull; PAN: AANCP9915B
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                  Chetan@0715
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("article")}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-left transition group"
                >
                  <span className="text-[10px] font-bold text-slate-800 block truncate group-hover:text-indigo-700">
                    Kriti Jain (Article)
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">Kriti@5897</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("partner")}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-300 text-left transition group"
                >
                  <span className="text-[10px] font-bold text-slate-800 block truncate group-hover:text-red-700">
                    CA Gunjan Jain
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">Gunjan@3639</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle between Client and Staff Portal - Clean Link */}
          <div className="pt-2 text-center">
            {portalMode === "client" ? (
              <button
                type="button"
                onClick={() => setPortalMode("staff")}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition underline underline-offset-2"
              >
                Are you a CA firm staff or partner? Staff Sign In &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPortalMode("client")}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition underline underline-offset-2"
              >
                &larr; Back to Client Portal Login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
