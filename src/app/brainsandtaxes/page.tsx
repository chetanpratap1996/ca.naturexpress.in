"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CaEnterpriseLandingView } from "@/components/landing/CaEnterpriseLandingView";
import { LoginModal } from "@/components/auth/LoginModal";
import { AuthUser, setActiveSession, DEMO_USERS } from "@/lib/auth/session";
import { toast } from "@/components/shared/ToastNotification";
import { INITIAL_CLIENTS } from "@/lib/data/mockData";

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

  const handleEnterSandbox = (role: "partner" | "article" | "client") => {
    const demoUser = role === "client" ? DEMO_USERS.client : role === "article" ? DEMO_USERS.article : DEMO_USERS.partner;
    setActiveSession(demoUser);
    toast.info(
      "Sandbox Demo Activated",
      `Exploring as ${demoUser.name} (${demoUser.designation})`
    );
    if (role === "client") {
      router.push("/?demo=true&view=client-pwa");
    } else if (role === "article") {
      router.push("/?demo=true&view=article");
    } else {
      router.push("/?demo=true&view=sandbox");
    }
  };

  return (
    <>
      <CaEnterpriseLandingView
        onOpenLogin={handleOpenLogin}
        onEnterSandbox={handleEnterSandbox}
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
