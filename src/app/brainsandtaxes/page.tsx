"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CaEnterpriseLandingView } from "@/components/landing/CaEnterpriseLandingView";
import { LoginModal } from "@/components/auth/LoginModal";
import { AuthUser, setActiveSession } from "@/lib/auth/session";
import { toast } from "@/components/shared/ToastNotification";
import { INITIAL_CLIENTS } from "@/lib/data/firmDefaults";

export default function BrainsAndTaxesPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [initialLoginRole, setInitialLoginRole] = useState<"partner" | "article" | "client">("client");

  const handleOpenLogin = (role: "partner" | "article" | "client" = "client") => {
    setInitialLoginRole(role);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setIsLoginModalOpen(false);
    setActiveSession(user);
    toast.success(
      "Signed In Successfully",
      `Welcome to Brains & Taxes Portal, ${user.name}`
    );
    if (user.role === "CLIENT") {
      router.push("/?view=client-pwa");
    } else if (user.role === "ARTICLE") {
      router.push("/?view=article");
    } else {
      router.push("/?view=partner");
    }
  };

  return (
    <>
      <CaEnterpriseLandingView
        onOpenLogin={handleOpenLogin}
      />

      {isLoginModalOpen && (
        <LoginModal
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setIsLoginModalOpen(false)}
          initialRole={initialLoginRole}
          clients={INITIAL_CLIENTS}
        />
      )}
    </>
  );
}
