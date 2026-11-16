"use client";

import React from "react";
import { 
  FileCheck2, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  ShieldAlert,
  Plus,
  KeyRound,
  Lock,
  LayoutDashboard,
  Grid,
  Scale,
  Award,
  Landmark
} from "lucide-react";

interface FloatingBottomNavProps {
  currentView: "partner" | "article" | "client-pwa";
  activeTab: string;
  onTabChange: (tab: string) => void;
  onViewChange?: (view: "partner" | "article" | "client-pwa") => void;
  onQuickAction?: () => void;
  onOpenAppLauncher?: () => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  currentView,
  activeTab,
  onTabChange,
  onQuickAction,
  onOpenAppLauncher,
}) => {
  const isClient = currentView === "client-pwa";

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 px-2 w-full max-w-full"
    >
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around relative">
        
        {/* ===================== TAB 1 ===================== */}
        {isClient ? (
          <button
            onClick={() => onTabChange("progress")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "progress"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <FileCheck2 className={`w-5 h-5 ${activeTab === "progress" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">Filings</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange("dashboard")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "dashboard"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === "dashboard" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">Dashboard</span>
          </button>
        )}

        {/* ===================== TAB 2 ===================== */}
        {isClient ? (
          <button
            onClick={() => onTabChange("vendor-hold")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "vendor-hold"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Lock className={`w-5 h-5 ${activeTab === "vendor-hold" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">Blocked ITC</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange("notices")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "notices"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <ShieldAlert className={`w-5 h-5 ${activeTab === "notices" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">Notices</span>
          </button>
        )}

        {/* ===================== CENTER CA PRACTICE DESK BUTTON ===================== */}
        <button
          onClick={() => {
            if (onQuickAction) {
              onQuickAction();
            } else if (isClient) {
              onTabChange("notifications");
            } else {
              onTabChange("calendar");
            }
          }}
          className="flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation group"
          title={isClient ? "Client Action Hub" : "CA Practice Command Hub"}
          aria-label={isClient ? "Client Action Hub" : "CA Practice Command Hub"}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#800000] to-btred-logo text-white flex items-center justify-center shadow-md shadow-red-900/25 group-hover:scale-105 group-active:scale-95 transition-transform border border-red-700/50">
            {isClient ? (
              <Sparkles className="w-4 h-4 text-amber-200" />
            ) : (
              <Scale className="w-4.5 h-4.5 text-amber-100" />
            )}
          </div>
          <span className="text-[10px] tracking-tight font-bold text-slate-800">
            {isClient ? "Client Hub" : "CA Desk"}
          </span>
        </button>

        {/* ===================== TAB 4 ===================== */}
        {isClient ? (
          <button
            onClick={() => onTabChange("vault")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "vault" || activeTab === "kyc-locker"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${activeTab === "vault" || activeTab === "kyc-locker" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">Vault</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange("billing")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "billing" || activeTab === "pay-to-release"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <CreditCard className={`w-5 h-5 ${activeTab === "billing" || activeTab === "pay-to-release" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">Billing</span>
          </button>
        )}

        {/* ===================== TAB 5 ===================== */}
        {isClient ? (
          <button
            onClick={() => onTabChange("billing")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "billing"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <CreditCard className={`w-5 h-5 ${activeTab === "billing" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">Invoices</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (onOpenAppLauncher) {
                onOpenAppLauncher();
              } else {
                onTabChange("dashboard");
              }
            }}
            className="flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation text-slate-600 hover:text-slate-900 font-medium"
            title="Open All 39 Workspaces"
          >
            <Grid className="w-5 h-5 text-btred-logo" />
            <span className="text-[10px] tracking-tight font-bold text-slate-800">All Tools</span>
          </button>
        )}
      </div>
    </nav>
  );
};
