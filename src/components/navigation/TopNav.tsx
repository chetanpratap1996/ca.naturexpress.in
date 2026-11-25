"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BtLogo } from "@/components/shared/BtLogo";
import { AuthUser } from "@/lib/auth/session";
import { useClientContext } from "@/lib/context/ClientContext";
import type {
  ClientEntity,
  ComplianceTask,
  NoticeRecord,
  DscRecord,
  PortalCredential,
  InvoiceItem,
  DocumentItem,
} from "@/lib/types";
import { 
  Building2, 
  ShieldCheck, 
  Search, 
  LogOut, 
  Check,
  Sparkles, 
  Users, 
  Smartphone, 
  ChevronDown, 
  RefreshCw, 
  X,
  Bell,
  Calendar,
  Scale
} from "lucide-react";
const CommandPaletteModal = dynamic(() => import("@/components/shared/CommandPaletteModal").then(m => m.CommandPaletteModal), { ssr: false });
const InstallAppModal = dynamic(() => import("@/components/shared/InstallAppModal").then(m => m.InstallAppModal), { ssr: false });
const NotificationCenterModal = dynamic(() => import("@/components/notifications/NotificationCenterModal").then(m => m.NotificationCenterModal), { ssr: false });
import { usePwaInstall } from "@/components/shared/usePwaInstall";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface TopNavProps {
  currentView: "partner" | "team" | "article" | "client-pwa";
  onViewChange: (view: any) => void;
  onNavigateTab?: (tab: string) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onSwitchUser?: (role: "partner" | "team" | "article" | "client") => void;
  onOpenClientMaster?: () => void;
  onOpenFirmHub?: () => void;
  onOpenClientBroadcaster?: () => void;
  onRefreshData?: () => void;
  onExitSandbox?: () => void;
  isSandbox?: boolean;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onOpenAppLauncher?: () => void;
  activeClientEntityId?: string;
  activeClientName?: string;
  isClientMode?: boolean;
  clients?: ClientEntity[];
  tasks?: ComplianceTask[];
  notices?: NoticeRecord[];
  dscTokens?: DscRecord[];
  portalCredentials?: PortalCredential[];
  invoices?: InvoiceItem[];
  documents?: DocumentItem[];
  groups?: any[];
  onSelectClient?: (clientId: string) => void;
  selectedGstin?: string;
  onOpenDiagnosticOnboarding?: () => void;
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
  isSandbox = false,
  clients = [],
  tasks = [],
  notices = [],
  dscTokens = [],
  portalCredentials = [],
  invoices = [],
  documents = [],
}) => {
  const {
    selectedClient,
    selectedGstin,
    selectedFy,
    availableFys,
    isFirmWideView,
    availableGstins,
    selectGstin,
    selectFy,
    clearClientContext,
    isCommandOpen,
    commandInitialFilter,
    openCommandPalette,
    closeCommandPalette,
  } = useClientContext();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isFyMenuOpen, setIsFyMenuOpen] = useState(false);
  const [isGstinMenuOpen, setIsGstinMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch("/api/notifications", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
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
  }, [currentUser?.id]);

  // Single Global Keyboard Shortcut (⌘K / Ctrl+K) -> Opens Unified Command & Client Switcher
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isCommandOpen) closeCommandPalette();
        else openCommandPalette("ALL");
      } else if (e.key === "Escape" && isCommandOpen) {
        closeCommandPalette();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isCommandOpen, openCommandPalette, closeCommandPalette]);

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

  const handleRoleSwitch = (role: "partner" | "team" | "article" | "client") => {
    if (onSwitchUser) {
      onSwitchUser(role);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 text-slate-900 border-b border-slate-200 shadow-sm backdrop-blur-md pt-safe w-full">
        {/* Single Unified High-Density Responsive Header matching main container width & padding */}
        <div className="w-full max-w-[1920px] mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          
          {/* LEFT: Platform Brand & Firm Identity Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <BtLogo size="sm" showTagline={false} />
            </Link>

            {/* Tenant Firm Pill (Hidden on screens < xl to preserve toolbar space) */}
            <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200/90 h-9 px-3 rounded-xl text-xs shadow-2xs">
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

          {/* CENTER: Client Identity Badge (Only in Client Portal Mode) */}
          {isClientMode && (
            <div className="flex items-center gap-2 bg-slate-50 border border-emerald-500/40 h-9 px-3 rounded-xl shadow-inner shrink-0">
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
          )}

          {/* CENTER: Unified Client Context + FY + Search Bar (Only for Staff/Partners) */}
          {!isClientMode && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center max-w-3xl min-w-0">
              {/* Active Client Context Switcher Pill */}
              <div className="flex items-center h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 gap-1.5 min-w-0 transition shadow-2xs">
                <button
                  type="button"
                  onClick={() => openCommandPalette("CLIENTS")}
                  className="flex items-center gap-1.5 text-left min-w-0"
                  title="Select or switch active client"
                >
                  <Building2 className={`w-3.5 h-3.5 shrink-0 ${selectedClient && !isFirmWideView ? "text-btred-logo" : "text-slate-500"}`} />
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[170px] lg:max-w-[210px]">
                    {selectedClient && !isFirmWideView
                      ? selectedClient.tradeName || selectedClient.name
                      : "All Clients"}
                  </span>
                  {selectedClient && !isFirmWideView && (selectedGstin || selectedClient.gstin) && (
                    <span className="hidden 2xl:inline font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                      {selectedGstin || selectedClient.gstin}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {availableGstins.length > 1 && selectedClient && !isFirmWideView && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsGstinMenuOpen((o) => !o)}
                      className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md hidden sm:inline-flex items-center gap-0.5"
                    >
                      <span>{availableGstins.length} GSTINs</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    {isGstinMenuOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50">
                        {availableGstins.map((g) => (
                          <button
                            key={g.gstin}
                            type="button"
                            onClick={() => {
                              selectGstin(g.gstin);
                              setIsGstinMenuOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${
                              selectedGstin === g.gstin ? "bg-blue-50 font-bold" : ""
                            }`}
                          >
                            <div>
                              <div className="font-mono text-slate-900">{g.gstin}</div>
                              <div className="text-[10px] text-slate-500">{g.stateName}</div>
                            </div>
                            {selectedGstin === g.gstin && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedClient && !isFirmWideView && (
                  <button
                    type="button"
                    onClick={() => clearClientContext()}
                    className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 shrink-0"
                    title="Clear client filter (Show All Clients)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Financial Year Pill */}
              <div className="relative hidden sm:block shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFyMenuOpen((o) => !o)}
                  className="h-9 inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs"
                  title="Switch Financial Year"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>FY {selectedFy}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isFyMenuOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50">
                    {availableFys.map((fy) => (
                      <button
                        key={fy}
                        type="button"
                        onClick={() => {
                          selectFy(fy);
                          setIsFyMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between ${
                          fy === selectedFy ? "bg-red-50 text-btred-logo" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>FY {fy}</span>
                        {fy === selectedFy && <Check className="w-3 h-3 text-btred-logo" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Unified Search Trigger (Desktop) */}
              <button
                type="button"
                onClick={() => openCommandPalette("ALL")}
                className="hidden md:flex items-center justify-between h-9 w-44 lg:w-56 xl:w-64 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-500 hover:text-slate-800 text-xs transition-colors shadow-2xs shrink-0"
                title="Search clients, filings & tools (⌘K)"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400 font-medium truncate">Search...</span>
                </div>
                <kbd className="bg-white border border-slate-200 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold text-slate-400 shrink-0">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile Search Icon Button */}
              <button
                type="button"
                onClick={() => openCommandPalette("ALL")}
                className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs shrink-0"
                title="Search"
              >
                <Search className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          )}

          {/* RIGHT: Quick Tools & Profile Cluster (Consistent h-9 Enterprise Grid) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Client Master Quick Launcher (Icon only) */}
            {onOpenClientMaster && !isClientMode && (
              <button
                type="button"
                onClick={onOpenClientMaster}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center shrink-0 shadow-2xs"
                title="Client Master & Desk"
                aria-label="Client Master & Desk"
              >
                <Building2 className="w-4 h-4 text-slate-700" />
              </button>
            )}

            {/* Compact Quick Desk Launcher */}
            {onOpenFirmHub && !isClientMode && (
              <button
                type="button"
                onClick={onOpenFirmHub}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-btred-logo transition-colors flex items-center justify-center shrink-0 shadow-2xs"
                title="Quick Desk & Statutory Calculators"
                aria-label="Quick Desk & Calculators"
              >
                <Scale className="w-4 h-4 text-btred-logo" />
              </button>
            )}

            {/* 1-Tap PWA Install (Icon Only with Tooltip) */}
            <button
              type="button"
              onClick={triggerInstall}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center shrink-0 shadow-2xs"
              title={isInstalled ? "Mobile App Installed" : "Download & Install Mobile App"}
              aria-label="Download App"
            >
              <Smartphone className="w-4 h-4 text-slate-700" />
            </button>

            {/* Notification Center Bell */}
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen(true);
                setUnreadCount(0);
              }}
              className="h-9 w-9 relative rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center shrink-0 shadow-2xs"
              title="Statutory Alerts & Notifications"
              aria-label="Alerts"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-btred-logo text-white font-mono text-[9px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                id="profile-dropdown-btn"
                data-testid="profile-dropdown-btn"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="h-9 pl-1 pr-2.5 rounded-xl hover:bg-slate-50 border border-slate-200 bg-white flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                aria-label="User Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-btred-logo text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
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

                  {onSwitchUser && (
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Active Persona
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">Sandbox Switcher</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            handleRoleSwitch("partner");
                          }}
                          className={`px-2 py-1.5 rounded-xl text-xs font-black transition border text-center ${
                            currentUser?.role === "PARTNER"
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          CA Partner
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            handleRoleSwitch("team");
                          }}
                          className={`px-2 py-1.5 rounded-xl text-xs font-black transition border text-center ${
                            currentUser?.role === "TEAM" || currentUser?.role === "ARTICLE"
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          Team Member
                        </button>
                      </div>
                    </div>
                  )}

                  {onOpenFirmHub && !isClientMode && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenFirmHub();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-red-50 flex items-center gap-2 text-btred-logo font-bold transition text-xs border border-transparent hover:border-red-200"
                    >
                      <Scale className="w-4 h-4 text-btred-logo" />
                      <span>Open Quick Desk &amp; Calculators</span>
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

      {/* Global Command & Client Switcher Modal */}
      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={closeCommandPalette}
        initialCategory={commandInitialFilter}
        clients={clients}
        tasks={tasks}
        notices={notices}
        dscTokens={dscTokens}
        portalCredentials={portalCredentials}
        invoices={invoices}
        documents={documents}
        onNavigate={(tab) => {
          if (onNavigateTab) onNavigateTab(tab);
          closeCommandPalette();
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
        onOpenClientBroadcaster={onOpenClientBroadcaster}
        currentUserRole={currentUser?.role}
      />
    </>
  );
};
