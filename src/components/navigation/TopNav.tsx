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
  Bell,
  Grid,
  Menu,
  Send,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { UniversalCommandPalette } from "@/components/firm/UniversalCommandPalette";
import { InstallAppModal } from "@/components/shared/InstallAppModal";
import { NotificationCenterModal } from "@/components/notifications/NotificationCenterModal";
import { usePwaInstall } from "@/components/shared/usePwaInstall";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { UniversalClientSwitcher } from "@/components/navigation/UniversalClientSwitcher";
import { AutopilotPulsePill } from "@/components/navigation/AutopilotPulsePill";
import { ClientEntity, ClientGroup } from "@/lib/types";

interface TopNavProps {
  currentView: "partner" | "article" | "client-pwa";
  onViewChange: (view: "partner" | "article" | "client-pwa") => void;
  onNavigateTab?: (tab: string) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onSwitchUser?: (role: "partner" | "article" | "client") => void;
  onOpenClientMaster?: () => void;
  onOpenFirmHub?: () => void;
  onOpenClientBroadcaster?: () => void;
  onExitSandbox?: () => void;
  isSandbox?: boolean;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onOpenAppLauncher?: () => void;
  activeClientEntityId?: string;
  activeClientName?: string;
  isClientMode?: boolean;
  clients?: ClientEntity[];
  groups?: ClientGroup[];
  onSelectClient?: (clientId: string, selectedGstin?: string) => void;
  selectedGstin?: string;
  onOpenDiagnosticOnboarding?: () => void;
  onRefreshData?: () => void;
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
  onOpenClientBroadcaster,
  onExitSandbox,
  isSandbox = true,
  onToggleSidebar,
  isSidebarCollapsed = false,
  onOpenAppLauncher,
  activeClientEntityId,
  activeClientName,
  isClientMode: isClientModeProp,
  clients = [],
  groups = [],
  onSelectClient,
  selectedGstin,
  onOpenDiagnosticOnboarding,
  onRefreshData,
}) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const isClientView = Boolean(isClientModeProp) || currentView === "client-pwa" || (currentView as any) === "client";

  useEffect(() => {
    const params = new URLSearchParams();
    if (isClientView) {
      params.set("role", "CLIENT");
      if (activeClientEntityId) params.set("clientEntityId", activeClientEntityId);
    }
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const fetchUnread = () => {
      fetch(`/api/notifications${queryStr}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);

    const handler = () => {
      setUnreadCount((c) => c + 1);
      fetchUnread();
    };
    window.addEventListener("bt_notification_received", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("bt_notification_received", handler);
    };
  }, [isClientView, activeClientEntityId]);

  // Global keyboard shortcut to open Universal Search (Cmd+K / Ctrl+K / Alt+G for Tally mode)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.altKey && e.key.toLowerCase() === 'g')) {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const {
    isInstalled,
    isIOS,
    isAndroid,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = usePwaInstall();

  const isClientMode = Boolean(isClientModeProp) || currentView === "client-pwa" || currentUser?.role === "CLIENT";

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
          
          {/* LEFT: Platform Brand & Navigation Launchers */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            {/* Sidebar Collapse / Expand Toggle Button */}
            {onToggleSidebar && !isClientMode && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition flex items-center justify-center shrink-0 cursor-pointer"
                title={isSidebarCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
                aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-slate-700" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-700" />
                )}
              </button>
            )}

            <button
              onClick={() => onNavigateTab?.("dashboard")}
              className="flex items-center gap-2 shrink-0 hover:opacity-90 transition text-left cursor-pointer"
              title="Master Executive Dashboard"
            >
              <BtLogo size="sm" showTagline={false} />
            </button>

            {/* Tenant Firm Pill (Hidden on screens < lg to preserve space) */}
            <button
              onClick={() => onNavigateTab?.("dashboard")}
              className="hidden lg:flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl text-xs shrink-0 transition text-left cursor-pointer"
              title="Master Executive Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-btred-logo shrink-0" />
              <div className="leading-tight">
                <span className="font-bold text-slate-900 block text-[11px] truncate max-w-[150px] xl:max-w-[200px]">
                  {DEFAULT_FIRM_BRANDING.firmName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  FRN {DEFAULT_FIRM_BRANDING.frn}
                </span>
              </div>
            </button>
          </div>

          {/* CENTER: Role Switcher (Partner / Staff) */}
          <div className="flex items-center gap-2 shrink-0">
            {isClientMode ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-emerald-500/40 px-2.5 sm:px-3 py-1 rounded-xl shadow-xs shrink-0">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-900 text-xs truncate max-w-[120px] sm:max-w-[200px]">
                  {currentUser?.designation?.includes("(")
                    ? currentUser.designation.split("(")[1].replace(")", "")
                    : currentUser?.name || "Client Portal"}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200 hidden sm:inline">
                  Client
                </span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <button
                  onClick={() => handleRoleSwitch("partner")}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
                    currentView === "partner"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="CA Partner Cockpit"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-btred-logo shrink-0" />
                  <span>Partner</span>
                </button>

                <button
                  onClick={() => handleRoleSwitch("article")}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
                    currentView === "article"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Staff Trainee Desk"
                >
                  <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Staff</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Quick Tools & Profile Cluster (With Zero Horizontal Overflow) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Autonomous Practice Living Pulse Pill */}
            {!isClientMode && (
              <AutopilotPulsePill onRefreshData={onRefreshData} />
            )}

            {/* Quick Search Trigger */}
            {!isClientMode && (
              <button
                onClick={() => setIsCommandOpen(true)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl text-xs font-medium transition"
                title="Search (⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline text-slate-500">Search</span>
                <kbd className="hidden md:inline bg-white border border-slate-200 text-[10px] px-1 py-0.5 rounded font-mono font-bold text-slate-400">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Fullscreen Focus Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center shrink-0"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Focus Mode (F11)"}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Notification Center Bell */}
            <button
              onClick={() => {
                setIsNotificationOpen(true);
                setUnreadCount(0);
              }}
              className="relative p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center shrink-0"
              title="Statutory Alerts"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-btred-logo text-white font-mono text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Avatar & Dropdown - Guaranteed 100% Unclipped */}
            <div className="relative shrink-0 mr-1 sm:mr-2">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 p-1 pr-2 rounded-xl hover:bg-slate-100 border border-slate-200 transition focus:outline-none bg-white shrink-0"
                aria-label="User Profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-btred-logo text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="text-left leading-tight hidden lg:block max-w-[110px] xl:max-w-[140px]">
                  <p className="font-bold text-slate-900 text-xs truncate">{currentUser?.name || "CA Gunjan Jain"}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser?.designation || "Managing Partner"}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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

                  {onOpenClientBroadcaster && !isClientMode && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenClientBroadcaster();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 flex items-center gap-2 text-emerald-800 font-bold transition text-xs border border-transparent hover:border-emerald-200"
                    >
                      <Send className="w-4 h-4 text-emerald-600" />
                      <span>Broadcast Intimation to Clients (₹0)</span>
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

      {/* Global Linear / Superhuman Grade Command Palette (Ctrl+K) */}
      <UniversalCommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigateTab={(tab) => {
          if (onNavigateTab) onNavigateTab(tab);
          setIsCommandOpen(false);
        }}
        onTriggerAutopilot={async () => {
          try {
            await fetch("/api/firm-autopilot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ triggerSource: "COMMAND_PALETTE" }),
            });
            window.dispatchEvent(new CustomEvent("bt_autopilot_sweep_completed"));
          } catch (e) {
            console.error("Autopilot trigger failed:", e);
          }
        }}
        clients={clients.map(c => ({ id: c.id, name: c.name, pan: c.pan }))}
      />

      {/* PWA Install Guidance Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstalled={isInstalled}
      />

      {/* Realtime Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateTab={onNavigateTab}
        onOpenClientBroadcaster={isClientView ? undefined : onOpenClientBroadcaster}
        currentUserRole={isClientView ? "CLIENT" : (currentUser?.role || "PARTNER")}
        clientEntityId={activeClientEntityId}
        clientName={activeClientName}
      />
    </>
  );
};
