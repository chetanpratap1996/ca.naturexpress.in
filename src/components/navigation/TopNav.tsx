"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BtLogo } from "@/components/shared/BtLogo";
import { AuthUser } from "@/lib/auth/session";
import { 
  Building2, 
  ShieldCheck, 
  PhoneCall, 
  Search, 
  Download,
  LogOut, 
  User, 
  Database, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Smartphone
} from "lucide-react";
import { CommandPaletteModal } from "@/components/shared/CommandPaletteModal";
import { InstallAppModal } from "@/components/shared/InstallAppModal";
import { usePwaInstall } from "@/components/shared/usePwaInstall";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface TopNavProps {
  currentView: "partner" | "article" | "client-pwa";
  onViewChange: (view: "partner" | "article" | "client-pwa") => void;
  onNavigateTab?: (tab: string) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onSwitchUser?: (role: "partner" | "article" | "client") => void;
}

export const TopNav: React.FC<TopNavProps> = ({ 
  currentView, 
  onViewChange, 
  onNavigateTab, 
  currentUser, 
  onLogout, 
  onSwitchUser 
}) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const {
    isInstalled,
    isIOS,
    isAndroid,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = usePwaInstall();

  const isClientMode = currentView === "client-pwa" || currentUser?.role === "CLIENT";

  const getInitials = (name?: string) => {
    if (!name) return "BT";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        {/* Top Utility Announcement Bar */}
        <div className="bg-slate-950 text-slate-200 text-[11px] px-3 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Brains &amp; Taxes &bull; Client &amp; Practice Desk
            </span>
            <span className="text-slate-500 hidden sm:inline">&bull;</span>
            <span className="text-slate-300 font-semibold hidden md:inline">
              Audit Firm: {DEFAULT_FIRM_BRANDING.firmName} (FRN: {DEFAULT_FIRM_BRANDING.frn})
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
            <button
              onClick={triggerInstall}
              className="flex items-center gap-1 bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full transition shadow-sm"
              title="1-Tap Download App"
            >
              <Download className="w-3 h-3" />
              <span>{isInstalled ? "App Installed" : "Download App (1-Tap)"}</span>
            </button>

            <span className="text-slate-300 hidden lg:inline">Help: {DEFAULT_FIRM_BRANDING.supportPhone}</span>
            <a
              href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] sm:text-xs"
            >
              <PhoneCall className="w-3 h-3" />
              <span>WhatsApp Desk</span>
            </a>
          </div>
        </div>

        {/* Main White Header */}
        <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 shadow-sm">
          {/* Brand Logo + Global Command Spotlight Trigger */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <BtLogo size="sm" showTagline={true} />

            {/* Quick Search (Staff / Partners) */}
            {!isClientMode && (
              <button
                onClick={() => setIsCommandOpen(true)}
                className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 px-3 py-1.5 rounded-2xl text-xs font-bold transition shadow-inner"
              >
                <Search className="w-3.5 h-3.5 text-btred-logo" />
                <span>Search clients &amp; files...</span>
                <kbd className="bg-white border border-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold text-slate-500 shadow-sm">
                  Ctrl K
                </kbd>
              </button>
            )}
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* 1-Tap App Install Button */}
            <button
              onClick={triggerInstall}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
              title="1-Tap Download Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download App</span>
              <span className="sm:hidden text-[11px]">Install</span>
            </button>

            {/* Active View Indicator */}
            <div className="bg-slate-50 border border-slate-200 px-2 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${isClientMode ? "bg-emerald-500" : "bg-indigo-500"}`}></span>
              <span className="font-bold text-slate-800 hidden md:inline">
                {currentUser?.role === "PARTNER" && "Partner Dashboard"}
                {currentUser?.role === "ARTICLE" && "Staff Workspace"}
                {currentUser?.role === "CLIENT" && "Client Portal"}
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 md:hidden">
                {currentUser?.role || (isClientMode ? "CLIENT" : "STAFF")}
              </span>
            </div>

            {/* User Profile & Account Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="text-left text-xs leading-none hidden lg:block">
                  <p className="font-extrabold text-slate-900">{currentUser?.name || "User"}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{currentUser?.designation}</p>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-3 space-y-2 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-800">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{currentUser?.name}</span>
                      <span className="text-[9px] font-black uppercase bg-btblack text-white px-2 py-0.5 rounded">
                        {currentUser?.role}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate">{currentUser?.email}</p>
                    <p className="text-slate-500 text-[11px]">{currentUser?.phone}</p>
                  </div>

                  <div className="px-3 py-2 text-[11px] text-slate-600 space-y-1.5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>CA Firm:</span>
                      <strong className="text-slate-900 font-bold">{DEFAULT_FIRM_BRANDING.firmName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ICAI FRN:</span>
                      <strong className="font-mono text-slate-900">{DEFAULT_FIRM_BRANDING.frn}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Company CIN:</span>
                      <strong className="font-mono text-slate-900 text-[10px]">{DEFAULT_FIRM_BRANDING.cin}</strong>
                    </div>
                    <div className="pt-1 text-[10px] text-slate-500">
                      {DEFAULT_FIRM_BRANDING.headOffice}
                    </div>
                  </div>

                  {/* 1-Tap App Install in Menu */}
                  <div className="border-t border-slate-100 pt-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        triggerInstall();
                      }}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isInstalled ? "App Ready on Device" : "Install App on Phone / PC"}</span>
                    </button>
                  </div>

                  {/* Role Switcher */}
                  {onSwitchUser && !isClientMode && (
                    <div className="border-t border-slate-100 pt-2 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-2 block">
                        Switch View
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            onSwitchUser("partner");
                            setIsProfileMenuOpen(false);
                          }}
                          className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[10px]"
                        >
                          Partner Dashboard
                        </button>
                        <button
                          onClick={() => {
                            onSwitchUser("article");
                            setIsProfileMenuOpen(false);
                          }}
                          className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[10px]"
                        >
                          Staff Workspace
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full p-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-btred-logo font-bold transition flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 1-Tap App Download Guidance Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstalled={isInstalled}
      />

      {/* Global Command Palette Spotlight Modal (Partners & Staff) */}
      {!isClientMode && (
        <CommandPaletteModal
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          onNavigate={(view, tab) => {
            onViewChange(view);
            if (tab && onNavigateTab) onNavigateTab(tab);
          }}
        />
      )}
    </>
  );
};
