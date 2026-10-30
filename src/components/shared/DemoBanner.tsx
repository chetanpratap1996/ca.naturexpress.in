"use client";

import React from "react";
import { AuthUser, DEMO_USERS } from "@/lib/auth/session";
import { Sparkles, ShieldCheck, RefreshCw, LogOut, UserCheck, Building2, KeyRound } from "lucide-react";

interface DemoBannerProps {
  currentUser: AuthUser | null;
  onSwitchUser: (role: "partner" | "article" | "client") => void;
  onExitDemo: () => void;
  onResetData?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  currentUser,
  onSwitchUser,
  onExitDemo,
  onResetData,
}) => {
  const currentRole = currentUser?.role || "PARTNER";

  return (
    <div className="bg-white text-slate-900 text-xs py-2 border-b border-slate-200 shadow-xs relative z-40 w-full">
      <div className="w-full max-w-[1720px] mx-auto px-3.5 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left: Environment Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-btred-logo font-extrabold px-2.5 py-0.5 rounded-full border border-red-200 text-[10px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-btred-logo animate-pulse"></span>
            Cloud Live Active
          </span>
          <span className="text-[11px] text-slate-600 hidden md:inline">
            GPA &amp; Co. (FRN 022998C) &bull; Verified Production Database &bull; Zero-DLT Credentials
          </span>
        </div>

        {/* Center: 1-Click Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 px-2 hidden sm:inline">Active Persona:</span>
          
          <button
            onClick={() => onSwitchUser("partner")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              currentRole === "PARTNER"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Switch to CA Managing Partner Cockpit"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>CA Partner</span>
          </button>

          <button
            onClick={() => onSwitchUser("article")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              currentRole === "ARTICLE"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Switch to Article Assistant Task Desk"
          >
            <UserCheck className="w-3 h-3" />
            <span>Article Trainee</span>
          </button>

          <button
            onClick={() => onSwitchUser("client")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              currentRole === "CLIENT"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            title="Switch to Client CFO Experience"
          >
            <Building2 className="w-3 h-3" />
            <span>Client CFO</span>
          </button>
        </div>

        {/* Right: Exit / Reset Actions */}
        <div className="flex items-center gap-2">
          {onResetData && (
            <button
              onClick={onResetData}
              className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-btred-logo font-semibold px-2 py-1 rounded hover:bg-slate-100 transition"
              title="Resync live state from Cloud"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden lg:inline">Resync Cloud</span>
            </button>
          )}

          <button
            onClick={onExitDemo}
            className="flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition"
            title="Exit to Public Gateway"
          >
            <LogOut className="w-3 h-3" />
            <span>Switch Role / Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
