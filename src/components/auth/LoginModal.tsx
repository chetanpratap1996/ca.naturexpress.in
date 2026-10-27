"use client";

import React, { useState, useEffect } from "react";
import { AuthUser, DEMO_USERS, setActiveSession, authenticateUser, generateDeterministicPassword, normalizePhone10 } from "@/lib/auth/session";
import { ClientEntity } from "@/lib/types";
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
  Briefcase,
  ExternalLink,
  MessageSquare
} from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
  initialRole?: "partner" | "article" | "client";
  clients?: ClientEntity[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  onLoginSuccess,
  initialRole,
  clients: initialClients = [],
}) => {
  const [clientRegistry, setClientRegistry] = useState<ClientEntity[]>(initialClients);

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
  
  // Default values
  const [identifier, setIdentifier] = useState(
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
  const [expectedHint, setExpectedHint] = useState<string | null>(null);
  const [copiedHint, setCopiedHint] = useState(false);

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

  // Update form inputs when switching between client and staff modes
  useEffect(() => {
    if (portalMode === "client") {
      const activeClient = clientRegistry[0];
      if (activeClient) {
        setIdentifier(activeClient.primaryContact?.phone || activeClient.pan);
        const pass = generateDeterministicPassword(
          activeClient.primaryContact?.name || activeClient.name,
          activeClient.primaryContact?.phone || "0715"
        );
        setPassword(pass);
      } else {
        setIdentifier(DEMO_USERS.client.phone);
        setPassword(DEMO_USERS.client.defaultPassword || "Chetan@0715");
      }
      setMembershipNo("");
    } else {
      if (activeStaffTab === "partner") {
        setIdentifier(DEMO_USERS.partner.email);
        setPassword("Gunjan@3639");
        setMembershipNo("022998C");
      } else {
        setIdentifier(DEMO_USERS.article.email);
        setPassword("Kriti@5897");
        setMembershipNo("CRO022998");
      }
    }
    setErrorMessage(null);
    setExpectedHint(null);
  }, [portalMode, activeStaffTab, clientRegistry]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setExpectedHint(null);

    setTimeout(() => {
      const result = authenticateUser(identifier, password, clientRegistry);

      if (!result.success || !result.user) {
        setIsSubmitting(false);
        setErrorMessage(result.error || "Authentication failed. Check your details or contact GPA & Co.");
        if (result.expectedHint) setExpectedHint(result.expectedHint);
        return;
      }

      const authenticatedUser = result.user;
      setActiveSession(authenticatedUser);
      setIsSubmitting(false);
      toast.success(
        "Authentication Verified",
        `Welcome, ${authenticatedUser.name} (${authenticatedUser.role === "PARTNER" ? "Managing Partner" : authenticatedUser.role === "ARTICLE" ? "Article Trainee" : "Client Portal"})`
      );
      onLoginSuccess(authenticatedUser);
    }, 250);
  };

  const handleQuickDemoLogin = (role: "partner" | "article" | "client") => {
    setIsSubmitting(true);
    setTimeout(() => {
      let targetUser: AuthUser | null = null;
      if (role === "client") {
        const first = clientRegistry[0];
        if (first) {
          const pass = generateDeterministicPassword(
            first.primaryContact?.name || first.name,
            first.primaryContact?.phone || "0715"
          );
          targetUser = {
            id: `USR-${first.id}`,
            name: first.primaryContact?.name || "Chetan Pratap Singh",
            email: first.primaryContact?.email || "director@client.com",
            phone: first.primaryContact?.phone || "+91 80771 70715",
            role: "CLIENT",
            designation: `${first.primaryContact?.designation || "Director"} (${first.name})`,
            firmId: "FRM-022998C",
            firmName: "GPA & Co., Chartered Accountants",
            firmFrn: "022998C",
            defaultPassword: pass,
            clientGroupId: first.groupId,
            clientEntityId: first.id,
            token: `tok_client_${Date.now()}`,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          };
        } else {
          targetUser = DEMO_USERS.client;
        }
      } else {
        targetUser = DEMO_USERS[role];
      }

      if (!targetUser) {
        setIsSubmitting(false);
        setErrorMessage("User configuration not found. Please log in with credentials.");
        return;
      }

      setActiveSession(targetUser);
      setIsSubmitting(false);
      toast.success(
        "Instant Sign In",
        `Welcome back, ${targetUser.name} (${role === "partner" ? "Managing Partner" : role === "article" ? "Article Trainee" : "Client Portal"})`
      );
      onLoginSuccess(targetUser);
    }, 200);
  };

  const copyCreds = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHint(true);
    toast.info("Copied to Clipboard", text);
    setTimeout(() => setCopiedHint(false), 2000);
  };

  // Compute active preview password for hint
  const currentHintPassword = portalMode === "client" 
    ? (clientRegistry[0] 
        ? generateDeterministicPassword(clientRegistry[0].primaryContact?.name || clientRegistry[0].name, clientRegistry[0].primaryContact?.phone || "0715")
        : "Chetan@0715")
    : activeStaffTab === "article" ? "Kriti@5897" : "Gunjan@3639";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-4 selection:bg-red-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#e52320_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 max-h-[96dvh] overflow-y-auto">
        
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
                GPA &amp; Co. Client Desk
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Official Compliance &amp; Banking Collaboration Suite
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 bg-red-950/80 border border-red-500/40 px-3 py-1 rounded-full text-[10px] text-red-300 font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-btred-logo" />
                <span>CA Firm Practice &amp; Staff Desk</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                GPA &amp; Co., Chartered Accountants
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ICAI FRN: 022998C &bull; Practice Management System
              </p>
            </>
          )}

          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            <span>https://ca.naturexpress.in/</span>
          </div>
        </div>

        {/* Portal Mode Tabs (Client vs Staff) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setPortalMode("client")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              portalMode === "client" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            Client Portal
          </button>
          <button
            type="button"
            onClick={() => setPortalMode("staff")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              portalMode === "staff" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-btred-logo" />
            CA Firm / Staff
          </button>
        </div>

        {/* Staff Switcher - ONLY shown in Staff Mode */}
        {portalMode === "staff" && (
          <div className="grid grid-cols-2 p-1 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
            <button
              type="button"
              onClick={() => setActiveStaffTab("partner")}
              className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                activeStaffTab === "partner" ? "bg-red-50 text-btred-logo font-black" : "hover:text-slate-900"
              }`}
            >
              <span>Managing Partner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStaffTab("article")}
              className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                activeStaffTab === "article" ? "bg-indigo-50 text-indigo-700 font-black" : "hover:text-slate-900"
              }`}
            >
              <span>Article Assistant</span>
            </button>
          </div>
        )}

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
                  href="https://wa.me/919893723639?text=Hello%20GPA%20%26%20Co.%2C%20I%20need%20assistance%20logging%20into%20my%20client%20portal%20at%20ca.naturexpress.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp Firm Support</span>
                </a>
              </div>
            </div>
          )}

          {/* Zero-DLT Password Explanation Card */}
          <div className="bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-2xl text-[11px] space-y-1">
            <div className="font-bold flex items-center justify-between text-slate-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Zero-SMS Deterministic Password:
              </span>
              <button
                type="button"
                onClick={() => copyCreds(currentHintPassword)}
                className="text-indigo-600 hover:underline flex items-center gap-1 text-[10px] font-bold"
              >
                {copiedHint ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedHint ? "Copied" : "Copy Sample"}
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed text-[10px]">
              Password standard: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-900">[FirstName/Company]@[Last 4 Phone]</strong>.
              {" "}(e.g. <strong className="font-mono text-indigo-700">{currentHintPassword}</strong>)
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {portalMode === "client"
                  ? "Registered Mobile Number, PAN, or Email"
                  : activeStaffTab === "partner"
                  ? "Partner Email / Mobile (+91 98937 23639)"
                  : "Article Assistant Email / Mobile"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {portalMode === "client" ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={portalMode === "client" ? "e.g. 8077170715 or AANCP9915B" : "partner@firm.com"}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={currentHintPassword}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition font-mono"
                  required
                />
              </div>
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
            className="w-full bg-slate-900 hover:bg-black text-white font-black text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
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

          {/* 1-Click Fast Track Testing Login */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block text-center mb-2">
              1-Click Verified Instant Access
            </span>

            {portalMode === "client" ? (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("client")}
                className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-emerald-950 block">
                    {clientRegistry[0]?.primaryContact?.name || "Chetan Pratap Singh (Director)"}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-medium">
                    {clientRegistry[0]?.name || "Pratwi Solutions Private Limited"} &bull; PAN: {clientRegistry[0]?.pan || "AANCP9915B"}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                  {currentHintPassword}
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
        </form>
      </div>
    </div>
  );
};
