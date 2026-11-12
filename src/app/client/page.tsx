"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientPortalPwa } from "@/components/client/ClientPortalPwa";
import { LoginModal } from "@/components/auth/LoginModal";
import { AuthUser, getActiveSession, clearSession } from "@/lib/auth/session";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { toast } from "@/components/shared/ToastNotification";

export default function ClientPortalDedicatedPage() {
  const router = useRouter();
  const { clients } = useTaxoData(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isClientQuickActionOpen, setIsClientQuickActionOpen] = useState(false);
  const [initialPhone, setInitialPhone] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const phoneParam = params.get("phone") || "";
      const pinParam = params.get("pin") || "";
      const cleanPhone = phoneParam.replace(/\D/g, "");

      if (cleanPhone) {
        setInitialPhone(cleanPhone);
      }

      const existing = getActiveSession();

      // If already logged in as CLIENT
      if (existing && existing.role === "CLIENT") {
        // If phoneParam matches existing session or no phoneParam provided
        if (!cleanPhone || existing.phone?.replace(/\D/g, "").slice(-10) === cleanPhone.slice(-10)) {
          setCurrentUser(existing);
          setIsReady(true);
          return;
        }
      }

      // If existing session is PARTNER or ARTICLE, clear it because user visited dedicated /client URL!
      if (existing && existing.role !== "CLIENT") {
        clearSession();
      }

      // If 1-Tap login credentials are in query string (phone + pin)
      if (cleanPhone && pinParam) {
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portalMode: "client",
            identifier: cleanPhone,
            secret: pinParam.trim(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.success && data?.user) {
              setCurrentUser(data.user);
              toast.success("Signed In Successfully", `Welcome, ${data.user.name}`);
            }
            setIsReady(true);
          })
          .catch(() => {
            setIsReady(true);
          });
        return;
      }

      setIsReady(true);
    } catch {
      setIsReady(true);
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    toast.success("Signed In Successfully", `Welcome to Client Portal, ${user.name}`);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    router.push("/");
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700">Loading Secure Client Portal...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated as CLIENT
  if (currentUser && currentUser.role === "CLIENT") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <ClientPortalPwa
          currentUser={currentUser}
          isSandbox={false}
          externalTab="progress"
          isQuickActionOpen={isClientQuickActionOpen}
          onCloseQuickAction={() => setIsClientQuickActionOpen(false)}
          onOpenQuickAction={() => setIsClientQuickActionOpen(true)}
        />
      </div>
    );
  }

  // Otherwise, present dedicated Client Login Modal
  return (
    <LoginModal
      onLoginSuccess={handleLoginSuccess}
      onClose={() => router.push("/")}
      initialRole="client"
      initialPhone={initialPhone}
      clients={clients}
    />
  );
}
