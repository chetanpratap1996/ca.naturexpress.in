"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { BtLogo } from "@/components/shared/BtLogo";
import { AlertCircle, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";

export default function SetPasswordPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    void createClient().auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      setIsAuthorized(!error && Boolean(data.user));
      setIsChecking(false);
    }).catch(() => {
      if (mounted) {
        setIsAuthorized(false);
        setIsChecking(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (password.length < 12) {
      setErrorMessage("Use at least 12 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw new Error("The password could not be set. Request a new invitation from your firm.");
      setSuccess(true);
      window.setTimeout(() => window.location.replace("/"), 900);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The password could not be set. Request a new invitation from your firm.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-900 p-4">
      <section className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex justify-center"><BtLogo size="md" showTagline={false} /></div>
        <div className="text-center">
          <h1 className="text-xl font-black text-slate-900">Set a new password</h1>
          <p className="mt-2 text-sm text-slate-600">Choose a strong password to activate your invitation or finish account recovery.</p>
        </div>
        {isChecking ? <p role="status" className="flex items-center justify-center gap-2 py-4 text-sm text-slate-600"><LoaderCircle className="h-4 w-4 animate-spin" />Checking secure link…</p> : !isAuthorized ? (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This secure link is invalid or expired. Request a fresh invitation or password reset from your CA firm sign-in page.</div>
        ) : success ? (
          <div role="status" className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" />Password saved. Opening your portal…</div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            {errorMessage && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{errorMessage}</div>}
            <label className="block text-sm font-semibold text-slate-700">New password
              <span className="relative mt-1 block"><KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required autoComplete="new-password" type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3" /></span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">Confirm password
              <input required autoComplete="new-password" type="password" minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </label>
            <p className="text-xs text-slate-500">Use 12 or more characters. Do not reuse your email or another service password.</p>
          <button type="submit" disabled={isSaving} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-50">{isSaving ? "Saving password…" : "Save new password"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
