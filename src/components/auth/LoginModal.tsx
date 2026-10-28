"use client";

import React, { useState, useEffect } from "react";
import { BtLogo } from "@/components/shared/BtLogo";
import { 
  AuthUser, 
  DEMO_USERS, 
  setActiveSession,
} from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/client";
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

  const [portalMode, setPortalMode] = useState<"client" | "staff">(() => {
    if (initialRole === "client") return "client";
    if (initialRole === "partner" || initialRole === "article") return "staff";
    return "client";
  });

  const [activeStaffTab, setActiveStaffTab] = useState<"partner" | "article">("partner");
  
  const [identifier, setIdentifier] = useState(
    process.env.NODE_ENV === "production" ? "" : (portalMode === "client" ? DEMO_USERS.client.phone : DEMO_USERS.partner.email)
  );
  const [password, setPassword] = useState(process.env.NODE_ENV === "production" ? "" : "Partner@2026");
  const [membershipNo, setMembershipNo] = useState("022998C");
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

  // Update form inputs when switching between client and staff modes
  useEffect(() => {
    if (portalMode === "client") {
      const activeClient = clientRegistry[0];
      setIdentifier(process.env.NODE_ENV === "production" ? "" : (activeClient?.primaryContact?.phone || DEMO_USERS.client.phone));
      setPassword(process.env.NODE_ENV === "production" ? "" : "Client@2026");
      setMembershipNo("");
    } else {
      if (activeStaffTab === "partner") {
        setIdentifier(process.env.NODE_ENV === "production" ? "" : DEMO_USERS.partner.email);
        setPassword(process.env.NODE_ENV === "production" ? "" : "Partner@2026");
        setMembershipNo("022998C");
      } else {
        setIdentifier(process.env.NODE_ENV === "production" ? "" : DEMO_USERS.article.email);
        setPassword(process.env.NODE_ENV === "production" ? "" : "Article@2026");
        setMembershipNo("CRO022998");
      }
    }
    setErrorMessage(null);
  }, [portalMode, activeStaffTab, clientRegistry]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const credentials = identifier.includes("@")
        ? { email: identifier.trim(), password }
        : { phone: identifier.trim(), password };
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;

      const sessionResponse = await fetch("/api/session", { cache: "no-store" });
      const sessionPayload = await sessionResponse.json();
      if (!sessionResponse.ok || !sessionPayload?.success || !sessionPayload?.user) {
        await supabase.auth.signOut();
        throw new Error(sessionPayload?.error || "This account has no active CA practice profile. Contact your firm administrator.");
      }

      const authenticatedUser = sessionPayload.user as AuthUser;
      setActiveSession(authenticatedUser);
      toast.success("Signed In", `Welcome, ${authenticatedUser.name}`);
      onLoginSuccess(authenticatedUser);
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to sign in. Check your credentials or contact the firm administrator.");
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-4 selection:bg-red-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(#e52320_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 max-h-[96dvh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 pb-5 border-b border-slate-800 text-center relative">
          <div className="flex justify-center mb-2.5">
            <BtLogo size="md" showTagline={false} />
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight">
            GPA &amp; Co. Chartered Accountants
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            ICAI FRN: 022998C &bull; Practice &amp; Client Compliance Portal
          </p>

          {/* Mode Switcher */}
          <div className="mt-4 p-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPortalMode("client")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                portalMode === "client"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Client Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setPortalMode("staff")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                portalMode === "staff"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-white"
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
                onClick={() => setActiveStaffTab("partner")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                  activeStaffTab === "partner"
                    ? "bg-btred-logo text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Managing Partner
              </button>
              <span className="text-slate-700">&bull;</span>
              <button
                type="button"
                onClick={() => setActiveStaffTab("article")}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                  activeStaffTab === "article"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {portalMode === "client"
                  ? "Registered Mobile Number, PAN, or Email"
                  : activeStaffTab === "partner"
                  ? "Partner Registered Email"
                  : "Article Assistant Email"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {portalMode === "client" ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={portalMode === "client" ? "e.g. 9800000003 or PAN" : "partner@firm.com"}
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
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

          {/* 1-Click Sandbox Evaluation Access */}
          {process.env.NODE_ENV !== "production" && <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block text-center mb-2">
              Evaluation Sandbox &bull; 1-Click Persona Access
            </span>

            {portalMode === "client" ? (
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("client")}
                className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-left transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-emerald-950 block">
                    Apex Laboratories Private Limited (Client)
                  </span>
                  <span className="text-[10px] text-emerald-800 font-medium">
                    Authorized Director &bull; PAN: AABCA9182K
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                  Client Sandbox
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
                  <span className="text-[9px] text-slate-400 block font-mono">Article Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("partner")}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-300 text-left transition group"
                >
                  <span className="text-[10px] font-bold text-slate-800 block truncate group-hover:text-red-700">
                    CA Gunjan Jain (FCA)
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">Managing Partner</span>
                </button>
              </div>
            )}
          </div>}
        </form>
      </div>
    </div>
  );
};
