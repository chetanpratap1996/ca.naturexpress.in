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
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-emerald-200 text-xs px-3 sm:px-6 py-2 border-b border-emerald-500/30 shadow-md relative z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left: Environment Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-[10px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Supabase Cloud Live Active
          </span>
          <span className="text-[11px] text-slate-300 hidden md:inline">
            GPA &amp; Co. (FRN 022998C) &bull; Verified Production Database &bull; Zero-DLT Credentials
          </span>
        </div>

        {/* Center: 1-Click Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 px-2 hidden sm:inline">Active Persona:</span>
          
          <button
            onClick={() => onSwitchUser("partner")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              currentRole === "PARTNER"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
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
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
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
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
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
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded hover:bg-slate-800 transition"
              title="Resync live state from Supabase Cloud"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden lg:inline">Resync Supabase</span>
            </button>
          )}

          <button
            onClick={onExitDemo}
            className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-2.5 py-1 rounded-lg border border-slate-700 transition"
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
