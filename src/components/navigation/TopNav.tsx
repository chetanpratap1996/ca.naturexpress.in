"use client";

import React, { useState, useEffect } from "react";
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
  X,
  Bell
} from "lucide-react";
import { CommandPaletteModal } from "@/components/shared/CommandPaletteModal";
import { InstallAppModal } from "@/components/shared/InstallAppModal";
import { NotificationCenterModal } from "@/components/notifications/NotificationCenterModal";
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data?.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});

    const handler = () => {
      setUnreadCount((c) => c + 1);
    };
    window.addEventListener("bt_notification_received", handler);
    return () => window.removeEventListener("bt_notification_received", handler);
  }, []);

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
      <header className="sticky top-0 z-40 bg-white/95 text-slate-900 border-b border-slate-200 shadow-sm backdrop-blur-md pt-safe w-full">
        {/* Single Unified High-Density Responsive Header matching main container width & padding */}
        <div className="w-full max-w-[1720px] mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          
          {/* LEFT: Platform Brand & Firm Identity Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <BtLogo size="sm" showTagline={false} />
            </Link>

            {/* Tenant Firm Pill (Hidden on screens < xl to preserve toolbar space) */}
            <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-btred-logo shrink-0" />
              <div className="leading-tight">
                <span className="font-extrabold text-slate-900 block text-[11px] truncate max-w-[180px] 2xl:max-w-[240px]">
                  {DEFAULT_FIRM_BRANDING.firmName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; SQC-1
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: Role Specific Badge or Switcher */}
          {isClientMode ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-emerald-500/40 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-inner shrink-0">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-black text-slate-900 text-xs truncate max-w-[120px] sm:max-w-[200px] md:max-w-[260px]">
                {currentUser?.designation?.includes("(")
                  ? currentUser.designation.split("(")[1].replace(")", "")
                  : currentUser?.name || "Client Portal"}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 hidden sm:inline">
                Verified Portal
              </span>
            </div>
          ) : (
            <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-200 shadow-inner shrink-0">
              <button
                onClick={() => handleRoleSwitch("partner")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition ${
                  currentView === "partner"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
                title="CA Partner Cockpit (Realization, Risk & Sign-off)"
              >
                <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">Partner Cockpit</span>
                <span className="sm:hidden">Partner</span>
              </button>

              <button
                onClick={() => handleRoleSwitch("article")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black transition ${
                  currentView === "article"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
                title="Article Trainee Execution Desk (Daily tasks & chase)"
              >
                <Briefcase className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">Staff Desk</span>
                <span className="sm:hidden">Staff</span>
              </button>
            </div>
          )}

          {/* RIGHT: Quick Tools & Profile Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Client Master & WhatsApp Broadcast Fast Button */}
            {onOpenClientMaster && !isClientMode && (
              <button
                onClick={onOpenClientMaster}
                className="hidden xl:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
                title="Client Master & 1-Tap WhatsApp Broadcast"
              >
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden 2xl:inline">Clients &amp; WhatsApp Desk</span>
                <span className="2xl:hidden">Clients</span>
              </button>
            )}

            {/* Firm Hub Instant Launcher */}
            {onOpenFirmHub && !isClientMode && (
              <button
                onClick={onOpenFirmHub}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-btred-logo hover:text-red-700 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
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
                className="hidden lg:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5 text-btred-logo" />
                <span className="hidden xl:inline">Search...</span>
                <kbd className="bg-white border border-slate-200 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold text-slate-500">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Mobile Search Icon Button - Only for Staff/Partners */}
            {!isClientMode && (
              <button
                onClick={() => setIsCommandOpen(true)}
                className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200"
                title="Search"
              >
                <Search className="w-4 h-4 text-slate-600" />
              </button>
            )}

            {/* Direct WhatsApp Desk Link */}
            <a
              href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="hidden xl:flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
              title="Official Firm WhatsApp Desk"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden 2xl:inline">WhatsApp</span>
            </a>

            {/* 1-Tap PWA Install */}
            <button
              onClick={triggerInstall}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
              title="Install Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5 text-btred-logo" />
              <span className="hidden 2xl:inline">{isInstalled ? "App Installed" : "Download App"}</span>
            </button>

            {/* Notification Center Bell */}
            <button
              onClick={() => {
                setIsNotificationOpen(true);
                setUnreadCount(0);
              }}
              className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 shrink-0"
              title="Statutory Alerts & Notifications"
            >
              <Bell className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden xl:inline text-xs font-bold">Alerts</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static w-4 h-4 rounded-full bg-btred-logo text-white font-mono text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl sm:rounded-2xl hover:bg-slate-100 border border-slate-200 transition focus:outline-none bg-white"
                aria-label="User Profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-red-600 to-btred-logo text-white flex items-center justify-center font-black text-[11px] sm:text-xs shadow-sm shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="text-left text-xs leading-none hidden xl:block max-w-[130px] 2xl:max-w-[180px]">
                  <p className="font-extrabold text-slate-900 truncate">{currentUser?.name || "User"}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{currentUser?.designation}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block shrink-0" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-3 space-y-2.5 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-800">
                  <div className="flex items-center justify-between pb-1 sm:hidden">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Account Profile</span>
                    <button onClick={() => setIsProfileMenuOpen(false)} className="text-slate-600 hover:text-slate-700 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{currentUser?.name}</span>
                      <span className="text-[9px] font-black uppercase bg-red-50 text-btred-logo px-2 py-0.5 rounded border border-red-200">
                        {currentUser?.role}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] truncate">{currentUser?.email}</p>
                    <p className="text-slate-600 text-[11px] font-mono">{currentUser?.phone}</p>
                  </div>

                  <div className="px-3 py-2 text-[11px] text-slate-600 space-y-1.5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>CA Firm:</span>
                      <strong className="text-slate-900 truncate max-w-[170px]">{DEFAULT_FIRM_BRANDING.firmName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ICAI FRN:</span>
                      <strong className="font-mono text-btred-logo font-bold">{DEFAULT_FIRM_BRANDING.frn}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Peer Review:</span>
                      <span className="text-emerald-700 font-bold">Compliant (2028)</span>
                    </div>
                  </div>

                  {onOpenFirmHub && !isClientMode && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenFirmHub();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-red-50 flex items-center gap-2 text-btred-logo font-bold transition text-xs border border-transparent hover:border-red-200"
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
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-800 font-bold transition text-xs"
                    >
                      <Users className="w-4 h-4 text-slate-600" />
                      <span>Manage Client Master &amp; Groups</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between gap-2">
                    {onExitSandbox && isSandbox && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onExitSandbox();
                        }}
                        className="text-[11px] text-slate-600 hover:text-amber-700 font-bold transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Exit Sandbox Demo</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="text-[11px] text-red-600 hover:text-red-700 font-bold transition flex items-center gap-1 ml-auto"
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
        onNavigate={(tab) => {
          if (onNavigateTab) onNavigateTab(tab);
          setIsCommandOpen(false);
        }}
      />

      {/* PWA Install Guidance Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Realtime Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateTab={onNavigateTab}
        currentUserRole={currentUser?.role}
      />
    </>
  );
};
