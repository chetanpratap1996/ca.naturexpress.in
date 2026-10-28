"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BtLogo } from "@/components/shared/BtLogo";
import { AuthUser, DEMO_USERS } from "@/lib/auth/session";
import { 
  Building2, 
  ShieldCheck, 
  PhoneCall, 
  Search, 
  Download,
  LogOut, 
  User, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Smartphone,
  Sparkles,
  Users,
  Briefcase,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  RefreshCw,
  X
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
  onOpenClientMaster?: () => void;
  onOpenFirmHub?: () => void;
  onExitSandbox?: () => void;
  isSandbox?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({ 
  currentView, 
  onViewChange, 
  onNavigateTab, 
  currentUser, 
  onLogout, 
  onSwitchUser,
  onOpenClientMaster,
  onOpenFirmHub,
  onExitSandbox,
  isSandbox = true,
}) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const {
    isInstalled,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = usePwaInstall();

  const isClientMode = currentView === "client-pwa" || currentUser?.role === "CLIENT";

  const getInitials = (name?: string) => {
    if (!name) return "BT";
    return name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const handleRoleSwitch = (role: "partner" | "article" | "client") => {
    if (onSwitchUser) {
      onSwitchUser(role);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/95 text-white border-b border-slate-800/80 shadow-xl backdrop-blur-md pt-safe w-full max-w-full overflow-hidden">
        {/* Single Unified High-Density Responsive Header */}
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          
          {/* LEFT: Platform Brand & Firm Identity Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <BtLogo size="sm" showTagline={false} />
            </Link>

            {/* Tenant Firm Pill (Hidden on small screens, visible on lg+) */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="leading-tight">
                <span className="font-extrabold text-slate-200 block text-[11px] truncate max-w-[180px] xl:max-w-[240px]">
                  {DEFAULT_FIRM_BRANDING.firmName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; SQC-1
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: Role Specific Badge or Switcher */}
          {isClientMode ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/40 px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-inner">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-black text-white text-xs truncate max-w-[150px] sm:max-w-[240px]">
                {currentUser?.designation?.includes("(")
                  ? currentUser.designation.split("(")[1].replace(")", "")
                  : currentUser?.name || "Client Portal"}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 hidden sm:inline">
                Verified Portal
              </span>
            </div>
          ) : (
            <div className="flex items-center bg-slate-900/95 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-800 shadow-inner shrink-0">
              <button
                onClick={() => handleRoleSwitch("partner")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition ${
                  currentView === "partner"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
                title="CA Partner Cockpit (Realization, Risk &amp; Sign-off)"
              >
                <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                <span className="hidden md:inline">Partner Cockpit</span>
                <span className="md:hidden">Partner</span>
              </button>

              <button
                onClick={() => handleRoleSwitch("article")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition ${
                  currentView === "article"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
                title="Article Trainee Execution Desk (Daily tasks &amp; chase)"
              >
                <Briefcase className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-300 shrink-0" />
                <span className="hidden md:inline">Staff Desk</span>
                <span className="md:hidden">Staff</span>
              </button>
            </div>
          )}

          {/* RIGHT: Quick Tools & Profile Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Client Master & WhatsApp Broadcast Fast Button */}
            {onOpenClientMaster && !isClientMode && (
              <button
                onClick={onOpenClientMaster}
                className="hidden lg:flex items-center gap-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                title="Client Master & 1-Tap WhatsApp Broadcast"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clients &amp; WhatsApp Desk</span>
              </button>
            )}

            {/* Firm Hub Instant Launcher */}
            {onOpenFirmHub && !isClientMode && (
              <button
                onClick={onOpenFirmHub}
                className="flex items-center gap-1.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-red-400 hover:text-red-300 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                title="Open CA Firm Action Hub"
              >
                <Sparkles className="w-3.5 h-3.5 text-btred-logo" />
                <span className="hidden sm:inline">Firm Hub</span>
              </button>
            )}

            {/* Quick Search Spotlight (Desktop) - Only for Staff/Partners */}
            {!isClientMode && (
              <button
                onClick={() => setIsCommandOpen(true)}
                className="hidden lg:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
              >
                <Search className="w-3.5 h-3.5 text-red-500" />
                <span>Search...</span>
                <kbd className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold text-slate-400">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Mobile Search Icon Button - Only for Staff/Partners */}
            {!isClientMode && (
              <button
                onClick={() => setIsCommandOpen(true)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-xl transition"
                title="Search"
              >
                <Search className="w-4 h-4 text-slate-300" />
              </button>
            )}

            {/* Direct WhatsApp Desk Link (hidden on xs, shown on sm+) */}
            <a
              href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-950 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
              title="Official Firm WhatsApp Desk"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>

            {/* 1-Tap PWA Install */}
            <button
              onClick={triggerInstall}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition"
              title="Install Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">{isInstalled ? "App Installed" : "Download App"}</span>
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl sm:rounded-2xl hover:bg-slate-900 border border-slate-800 transition focus:outline-none"
                aria-label="User Profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-red-600 to-indigo-600 text-white flex items-center justify-center font-black text-[11px] sm:text-xs shadow-md shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="text-left text-xs leading-none hidden xl:block">
                  <p className="font-extrabold text-slate-200">{currentUser?.name || "User"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{currentUser?.designation}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-3 space-y-2.5 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-200">
                  <div className="flex items-center justify-between pb-1 sm:hidden">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Account Profile</span>
                    <button onClick={() => setIsProfileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{currentUser?.name}</span>
                      <span className="text-[9px] font-black uppercase bg-red-600/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                        {currentUser?.role}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate">{currentUser?.email}</p>
                    <p className="text-slate-400 text-[11px] font-mono">{currentUser?.phone}</p>
                  </div>

                  <div className="px-3 py-2 text-[11px] text-slate-400 space-y-1.5 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span>CA Firm:</span>
                      <strong className="text-slate-200 truncate max-w-[170px]">{DEFAULT_FIRM_BRANDING.firmName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ICAI FRN:</span>
                      <strong className="font-mono text-emerald-400">{DEFAULT_FIRM_BRANDING.frn}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Peer Review:</span>
                      <span className="text-emerald-400 font-bold">Compliant (2028)</span>
                    </div>
                  </div>

                  {onOpenFirmHub && !isClientMode && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenFirmHub();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-2 text-red-300 font-bold transition text-xs"
                    >
                      <Sparkles className="w-4 h-4 text-btred-logo" />
                      <span>Launch CA Firm Action Hub</span>
                    </button>
                  )}

                  {onOpenClientMaster && !isClientMode && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenClientMaster();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-2 text-slate-200 font-bold transition text-xs"
                    >
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>Manage Client Master &amp; Groups</span>
                    </button>
                  )}

                  {isClientMode && onNavigateTab && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onNavigateTab("profile");
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 flex items-center gap-2 text-indigo-300 font-bold transition text-xs border border-indigo-500/20"
                    >
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Account Profile &amp; Password Settings</span>
                    </button>
                  )}

                  <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
                    {onExitSandbox && !isClientMode && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onExitSandbox();
                        }}
                        className="text-[11px] text-slate-400 hover:text-amber-300 font-bold transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset Sandbox</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="text-[11px] text-red-400 hover:text-red-300 font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette Trigger */}
      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={(view, tab) => {
          if (tab && onNavigateTab) onNavigateTab(tab);
          else onViewChange(view);
          setIsCommandOpen(false);
        }}
      />

      {/* PWA Install Guidance Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </>
  );
};
