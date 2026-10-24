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
  KeyRound
} from "lucide-react";

interface FloatingBottomNavProps {
  currentView: "partner" | "article" | "client-pwa";
  activeTab: string;
  onTabChange: (tab: string) => void;
  onViewChange?: (view: "partner" | "article" | "client-pwa") => void;
  onQuickAction?: () => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  currentView,
  activeTab,
  onTabChange,
  onQuickAction,
}) => {
  const isClient = currentView === "client-pwa";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-2 px-3 transition-all">
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around relative">
        
        {/* ===================== TAB 1 ===================== */}
        {isClient ? (
          <button
            onClick={() => onTabChange("progress")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 ${
              activeTab === "progress"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <FileCheck2 className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Filings</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange("calendar")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 ${
              activeTab === "calendar"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Deadlines</span>
          </button>
        )}

        {/* ===================== TAB 2 ===================== */}
        {isClient ? (
          <button
            onClick={() => onTabChange("cash-forecast")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 ${
              activeTab === "cash-forecast"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Tax Due</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange("notices")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 ${
              activeTab === "notices"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Notices</span>
          </button>
        )}

        {/* ===================== CENTER ELEVATED BUTTON ===================== */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => {
              if (onQuickAction) {
                onQuickAction();
              } else if (isClient) {
                onTabChange("upload");
              } else {
                onTabChange("calendar");
              }
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-btred-700 via-btred-logo to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 ring-4 ring-white hover:scale-105 active:scale-95 transition-all"
            title={isClient ? "Quick Actions" : "Firm Hub"}
          >
            {isClient ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Plus className="w-6 h-6" />}
          </button>
          <span className="text-[10px] font-black uppercase text-btblack tracking-wider mt-1">
            {isClient ? "Quick Action" : "Firm Hub"}
          </span>
        </div>

        {/* ===================== TAB 4 ===================== */}
        {isClient ? (
          <button
            onClick={() => onTabChange("vault")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 ${
              activeTab === "vault" || activeTab === "kyc-locker"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Vault</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange("billing")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 ${
              activeTab === "billing" || activeTab === "pay-to-release"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Billing</span>
          </button>
        )}

        {/* ===================== TAB 5 ===================== */}
        {isClient ? (
          <button
            onClick={() => onTabChange("billing")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 ${
              activeTab === "billing"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Invoices</span>
          </button>
        ) : (
          <button
            onClick={() => onTabChange("dsc")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors px-2 py-1 ${
              activeTab === "dsc"
                ? "text-btred-logo font-black"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <KeyRound className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">DSC Keys</span>
          </button>
        )}
      </div>
    </nav>
  );
};
