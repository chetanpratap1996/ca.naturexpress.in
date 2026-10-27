"use client";

import React, { FormEvent, useState } from "react";
import { AuthUser, setActiveSession } from "@/lib/auth/session";
import { BtLogo } from "@/components/shared/BtLogo";
import { createClient } from "@/utils/supabase/client";
import { AlertCircle, ArrowRight, Building2, KeyRound, LoaderCircle, Mail } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
  initialRole?: "partner" | "article" | "client";
}

type LoginMode = "client" | "staff";

function roleForUi(role: string): AuthUser["role"] | null {
  if (["SUPER_ADMIN", "PARTNER"].includes(role)) return "PARTNER";
  if (role === "PAID_CA_MANAGER") return "MANAGER";
  if (role === "ARTICLE_TRAINEE") return "ARTICLE";
  if (["CLIENT_PROMOTER", "CLIENT_ACCOUNTANT"].includes(role)) return "CLIENT";
  return null;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, initialRole }) => {
  const [mode, setMode] = useState<LoginMode>(initialRole === "client" ? "client" : "staff");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const signIn = mode === "client"
        ? identifier.trim().includes("@")
          ? await supabase.auth.signInWithPassword({ email: identifier.trim().toLowerCase(), password })
          : await supabase.auth.signInWithPassword({ phone: identifier.trim(), password })
        : await supabase.auth.signInWithPassword({ email: identifier.trim(), password });

      if (signIn.error || !signIn.data.user) {
        throw new Error("Sign-in failed. Check your details or contact your firm administrator.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id,firm_id,email,phone,full_name,role,is_active,membership_number,articleship_reg_no")
        .eq("id", signIn.data.user.id)
        .maybeSingle();

      if (profileError || !profile || !profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("This account is not active in a CA firm workspace. Contact your firm administrator.");
      }

      const role = roleForUi(profile.role);
      if (!role) {
        await supabase.auth.signOut();
        throw new Error("This account does not have a supported workspace role.");
      }

      const { data: firm, error: firmError } = await supabase
        .from("firms")
        .select("firm_name,frn")
        .eq("id", profile.firm_id)
        .maybeSingle();

      if (firmError || !firm) {
        await supabase.auth.signOut();
        throw new Error("Your firm workspace is not available. Contact your firm administrator.");
      }

      let clientEntityId: string | undefined;
      let clientGroupId: string | undefined;
      if (role === "CLIENT") {
        const { data: entityAccess, error: entityAccessError } = await supabase
          .from("user_client_entities")
          .select("entity_id,client_entities(group_id)")
          .eq("user_id", profile.id)
          .limit(1)
          .maybeSingle();

        if (entityAccessError || !entityAccess) {
          await supabase.auth.signOut();
          throw new Error("No client entity is linked to this account. Contact your firm administrator.");
        }
        clientEntityId = entityAccess.entity_id;
        const entity = Array.isArray(entityAccess.client_entities)
          ? entityAccess.client_entities[0]
          : entityAccess.client_entities;
        clientGroupId = entity?.group_id;
      }

      const user: AuthUser = {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role,
        designation: role === "PARTNER" ? "Firm Partner" : role === "MANAGER" ? "Firm Manager" : role === "ARTICLE" ? "Article Trainee" : "Client Portal User",
        firmId: profile.firm_id,
        firmName: firm.firm_name,
        firmFrn: firm.frn,
        membershipNo: profile.membership_number || undefined,
        articleshipRegNo: profile.articleship_reg_no || undefined,
        clientGroupId,
        clientEntityId,
        expiresAt: new Date((signIn.data.session?.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000).toISOString(),
      };

      setActiveSession(user);
      onLoginSuccess(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in. Try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = identifier.trim().toLowerCase();
    setErrorMessage(null);
    setResetMessage(null);
    if (!email.includes("@")) {
      setErrorMessage("Enter the email address linked to your account to receive reset instructions.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      });
      if (error) throw error;
      setResetMessage("If an account uses this email, password reset instructions will arrive shortly.");
    } catch {
      setErrorMessage("Password reset could not be started. Try again or contact your firm administrator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-4 selection:bg-red-500 selection:text-white">
      <section className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94dvh] overflow-y-auto">
        <header className="bg-slate-950 text-white p-5 sm:p-6 text-center border-b border-slate-800">
          <div className="flex justify-center mb-3"><BtLogo size="md" showTagline={false} /></div>
          <div className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-[10px] text-slate-200 font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" /> Secure CA firm workspace
          </div>
          <h1 className="text-xl font-black tracking-tight">Sign in to your workspace</h1>
          <p className="text-xs text-slate-400 mt-1">Your access is assigned by your CA firm.</p>
        </header>

        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600">
          <button type="button" onClick={() => { setMode("client"); setIdentifier(""); setPassword(""); setErrorMessage(null); setResetMessage(null); }} aria-pressed={mode === "client"} className={`py-2 rounded-xl transition ${mode === "client" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}>Client portal</button>
          <button type="button" onClick={() => { setMode("staff"); setIdentifier(""); setPassword(""); setErrorMessage(null); setResetMessage(null); }} aria-pressed={mode === "staff"} className={`py-2 rounded-xl transition ${mode === "staff" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}>Firm staff</button>
        </div>

        <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-4">
          {errorMessage && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMessage}</div>}
          {resetMessage && <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">{resetMessage}</div>}
          <div>
            <label htmlFor="login-identifier" className="block text-xs font-bold text-slate-700 mb-1">{mode === "client" ? "Registered email or mobile number" : "Firm email address"}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail className="w-4 h-4" /></div>
              <input id="login-identifier" type={mode === "client" ? "text" : "email"} autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={mode === "client" ? "accounts@company.in or +91 98765 43210" : "name@firm.in"} className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-slate-800" required />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><KeyRound className="w-4 h-4" /></div>
              <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-slate-800" required />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-black text-white font-bold text-sm py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60">
            {isSubmitting ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
          </button>
          <button type="button" disabled={isSubmitting} onClick={() => void handlePasswordReset()} className="w-full text-xs font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950 disabled:opacity-50">Forgot password? Send reset instructions by email</button>
          <p className="text-center text-[11px] text-slate-500">Need access? Ask your firm administrator to invite you.</p>
        </form>
      </section>
    </main>
  );
};
