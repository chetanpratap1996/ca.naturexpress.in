"use client";

import React, { useState } from "react";
import { AuthUser, DEMO_USERS, setActiveSession } from "@/lib/auth/session";
import { BtLogo } from "@/components/shared/BtLogo";
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
  Download
} from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<"partner" | "article" | "client">("partner");
  const [emailOrPhone, setEmailOrPhone] = useState("brainsandtaxes@gmail.com");
  const [password, setPassword] = useState("••••••••••••");
  const [membershipNo, setMembershipNo] = useState("022998C");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTabSwitch = (tab: "partner" | "article" | "client") => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === "partner") {
      setEmailOrPhone("brainsandtaxes@gmail.com");
      setMembershipNo("022998C");
    } else if (tab === "article") {
      setEmailOrPhone("desk@brainsandtaxes.com");
      setMembershipNo("CRO022998");
    } else {
      setEmailOrPhone("+91 98230 11928");
      setMembershipNo("");
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    setTimeout(() => {
      let user: AuthUser;
      if (activeTab === "partner") {
        user = DEMO_USERS.partner;
      } else if (activeTab === "article") {
        user = DEMO_USERS.article;
      } else {
        user = DEMO_USERS.client;
      }

      setActiveSession(user);
      setIsSubmitting(false);
      onLoginSuccess(user);
    }, 600);
  };

  const handleQuickDemoLogin = (role: "partner" | "article" | "client") => {
    handleTabSwitch(role);
    setIsSubmitting(true);
    setTimeout(() => {
      const user = DEMO_USERS[role];
      setActiveSession(user);
      setIsSubmitting(false);
      onLoginSuccess(user);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-red-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#e52320_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="bg-slate-950 text-white p-6 pb-5 border-b border-slate-800 text-center relative">
          <div className="flex justify-center mb-3">
            <BtLogo size="md" showTagline={false} />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Brains &amp; Taxes
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Tax, Filings &amp; Document Management Platform
          </p>

          <div className="mt-3.5 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-[10px] text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GPA &amp; Co., Chartered Accountants &bull; FRN: 022998C</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("trigger-app-install"));
                }
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-btred-logo hover:from-red-500 hover:to-red-600 text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-md transition hover:scale-105 active:scale-95"
            >
              <Download className="w-3 h-3" />
              <span>Download App (1-Tap Install)</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="p-4 pb-0 bg-slate-50 border-b border-slate-200">
          <div className="flex bg-slate-200 p-1 rounded-2xl text-xs font-black">
            <button
              type="button"
              onClick={() => handleTabSwitch("partner")}
              className={`flex-1 py-2 text-center rounded-xl transition ${
                activeTab === "partner" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Partner
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch("article")}
              className={`flex-1 py-2 text-center rounded-xl transition ${
                activeTab === "article" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Article Desk
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch("client")}
              className={`flex-1 py-2 text-center rounded-xl transition ${
                activeTab === "client" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Client PWA
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-btred-logo p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            {activeTab === "partner" && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ICAI Member Email / Login ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                    placeholder="partner@kcs.in"
                    required
                  />
                </div>
              </div>
            )}

            {activeTab === "article" && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Article Trainee Official Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                    placeholder="rohan.verma@kcs.in"
                    required
                  />
                </div>
              </div>
            )}

            {activeTab === "client" && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Promoter / CFO Registered Mobile or Email
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-slate-800 font-mono"
                    placeholder="+91 98230 11928"
                    required
                  />
                </div>
              </div>
            )}

            {activeTab !== "client" && (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {activeTab === "partner" ? "ICAI Membership No." : "Student Reg. No. (WRO/CRO)"}
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={membershipNo}
                      onChange={(e) => setMembershipNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-slate-800 font-mono"
                      placeholder={activeTab === "partner" ? "049281" : "WRO0641209"}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 pl-9 pr-3 py-2.5 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "client" && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-800 font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero-Password Magic Link Authentication
                </p>
                <p>
                  Promoters and CXOs authenticate securely without passwords. Links are signed and tied to your multi-entity family group.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-btred-logo hover:bg-btred-700 text-white font-black text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating Session...
              </>
            ) : (
              <>
                <span>
                  {activeTab === "client" ? "Enter Client Mobile Portal" : "Sign In to Firm Workspace"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Instant 1-Click Role Switchers for Testing */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block text-center mb-2">
              Instant 1-Click Test Personas
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("partner")}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center border border-slate-200 transition"
              >
                CA Partner
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("article")}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center border border-slate-200 transition"
              >
                Article
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("client")}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center border border-slate-200 transition"
              >
                Client CFO
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
