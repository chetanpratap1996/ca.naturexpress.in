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
  Lock
} from "lucide-react";

interface FloatingBottomNavProps {
  currentView: "partner" | "article" | "client-pwa";
  activeTab: string;
  onTabChange: (tab: string) => void;
  onViewChange?: (view: "partner" | "article" | "client-pwa") => void;
  onQuickAction?: () => void;
  restrictedPartnerMode?: boolean;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  currentView,
  activeTab,
  onTabChange,
  onQuickAction,
  restrictedPartnerMode = false,
}) => {
  const isClient = currentView === "client-pwa";

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-all pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 px-2 w-full max-w-full overflow-hidden"
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
            onClick={() => onTabChange("calendar")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "calendar"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === "calendar" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">Deadlines</span>
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
        ) : !restrictedPartnerMode ? (
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
        ) : null}

        {/* ===================== CENTER ELEVATED BUTTON ===================== */}
        <div className="relative -top-4 flex flex-col items-center shrink-0">
          <button
            onClick={() => {
              if (restrictedPartnerMode) {
                onTabChange("documents");
              } else if (onQuickAction) {
                onQuickAction();
              } else if (isClient) {
                onTabChange("upload");
              } else {
                onTabChange("calendar");
              }
            }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-btred-700 via-btred-logo to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 ring-4 ring-white hover:scale-105 active:scale-95 transition-all touch-manipulation"
            title={restrictedPartnerMode ? "Documents" : isClient ? "Quick Actions" : "Firm Hub"}
            aria-label={restrictedPartnerMode ? "Documents" : isClient ? "Quick Actions" : "Firm Hub"}
          >
            {restrictedPartnerMode ? <FileCheck2 className="w-6 h-6" /> : isClient ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Plus className="w-6 h-6" />}
          </button>
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-800 tracking-wider mt-0.5">
            {restrictedPartnerMode ? "Documents" : isClient ? "Quick Hub" : "Firm Hub"}
          </span>
        </div>

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
        ) : !restrictedPartnerMode ? (
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
        ) : null}

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
        ) : !restrictedPartnerMode ? (
          <button
            onClick={() => onTabChange("dsc")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 min-w-[56px] min-h-[44px] touch-manipulation ${
              activeTab === "dsc"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <KeyRound className={`w-5 h-5 ${activeTab === "dsc" ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] tracking-tight">DSC Keys</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
};
