"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopNav } from "@/components/navigation/TopNav";
import { FloatingBottomNav } from "@/components/navigation/FloatingBottomNav";
import { StatutoryCalendar } from "@/components/firm/StatutoryCalendar";
import { StatutoryTaskEngine } from "@/components/firm/tasks/StatutoryTaskEngine";
import { NoticeCenter } from "@/components/firm/NoticeCenter";
import { BillingWip } from "@/components/firm/BillingWip";
import { DscVault } from "@/components/firm/DscVault";
import { KeysVault } from "@/components/firm/KeysVault";
import { ArticleWorkbench } from "@/components/firm/ArticleWorkbench";
import { ClientPortalPwa } from "@/components/client/ClientPortalPwa";
import { Gstr2bReconciler } from "@/components/firm/Gstr2bReconciler";
import { InwardOutwardRegister } from "@/components/firm/InwardOutwardRegister";
import { PayToReleaseManager } from "@/components/firm/PayToReleaseManager";
import { WhatsAppAiWorkbench } from "@/components/firm/WhatsAppAiWorkbench";
import { PeerReviewManager } from "@/components/firm/PeerReviewManager";
import { EnterpriseSecurityAndRealization } from "@/components/firm/EnterpriseSecurityAndRealization";
import { BatchOutwardDispatcher } from "@/components/firm/BatchOutwardDispatcher";
import { ClientMasterModal } from "@/components/firm/ClientMasterModal";
import { FirmHubActionModal } from "@/components/firm/FirmHubActionModal";
import { ClientNotificationBroadcasterModal } from "@/components/notifications/ClientNotificationBroadcasterModal";
import { VirtualCfoCockpit } from "@/components/firm/VirtualCfoCockpit";
import { BankStatementParser } from "@/components/firm/BankStatementParser";
import { EntityDnaMaster } from "@/components/firm/EntityDnaMaster";
import { DiagnosticOnboardingModal } from "@/components/firm/DiagnosticOnboardingModal";
import { ItrComputationEngine } from "@/components/firm/ItrComputationEngine";
import { CaCreatorContentStudio } from "@/components/firm/CaCreatorContentStudio";
import { EngagementLetterGenerator } from "@/components/firm/EngagementLetterGenerator";
import { Ais26asAnalyzer } from "@/components/firm/Ais26asAnalyzer";
import { Form3cdWorkpaper } from "@/components/firm/Form3cdWorkpaper";
import { Schedule3AuditEngine } from "@/components/firm/Schedule3AuditEngine";
import { UdinVault } from "@/components/firm/UdinVault";
import { NoticeReplyDrafter } from "@/components/firm/NoticeReplyDrafter";
import { AssesseeApprovalDesk } from "@/components/firm/AssesseeApprovalDesk";
import { PracticeGrowthCockpit } from "@/components/growth/PracticeGrowthCockpit";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { AppLauncherMegaMenu } from "@/components/navigation/AppLauncherMegaMenu";
import { ActiveToolHeader } from "@/components/navigation/ActiveToolHeader";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { AutopilotPulseCockpit } from "@/components/firm/AutopilotPulseCockpit";
import { getNavItemById } from "@/lib/navigation/navigationItems";
import { LoginModal } from "@/components/auth/LoginModal";
import { SaasGateway } from "@/components/gateway/SaasGateway";
import { KeyboardShortcutsModal } from "@/components/shared/KeyboardShortcutsModal";
import { toast } from "@/components/shared/ToastNotification";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { 
  AuthUser, 
  getActiveSession, 
  clearSession, 
  setActiveSession, 
  DEMO_USERS,
  generateDeterministicPassword 
} from "@/lib/auth/session";
import { 
  SANDBOX_FIRM_METRICS,
  SANDBOX_PASSWORD_VAULTS,
  SANDBOX_PARSED_STATEMENTS,
  SANDBOX_MSME_43BH_RECORDS,
  SANDBOX_SECTION_40A2B_SAMPLES,
  SANDBOX_STAFF_SECURITY_LOGS,
  SANDBOX_PARTNER_METRICS
} from "@/lib/data/sandboxData";
import { 
  FIRM_METRICS, 
  INITIAL_TASKS, 
  INITIAL_NOTICES, 
  INITIAL_INVOICES, 
  INITIAL_DSC_TOKENS,
  INITIAL_CLIENTS,
  INITIAL_PAY_TO_RELEASE_CONFIGS,
  INITIAL_PASSWORD_VAULTS,
  INITIAL_PARSED_STATEMENTS,
  INITIAL_MSME_43BH_RECORDS,
  INITIAL_SECTION_40A2B_SAMPLES,
  INITIAL_STAFF_SECURITY_LOGS,
  INITIAL_PARTNER_METRICS
} from "@/lib/data/mockData";
import { ComplianceTask, WorkflowStatus } from "@/lib/types";
import { 
  Calendar, 
  ShieldAlert, 
  DollarSign, 
  KeyRound, 
  TrendingUp, 
  AlertTriangle, 
  FileSpreadsheet,
  Package,
  Lock,
  MessageSquare,
  Award,
  Fingerprint,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Users,
  ChevronDown,
  Layers,
  Calculator,
  Video,
  FileCheck,
  FileSearch,
  ClipboardCheck,
  Scale,
  Grid,
  Compass
} from "lucide-react";

export default function Home() {
  // Check if entering sandbox directly or via practice tab deep link
  const [isDemoSandbox, setIsDemoSandbox] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get("demo") === "true" || params.get("view") === "sandbox" || !!params.get("tab");
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  // Use persistent hook - receives sandbox flag
  const {
    tasks,
    invoices,
    notices,
    dscTokens,
    portalCredentials,
    clients,
    groups,
    payConfigs,
    refreshData,
    createClient,
    updateClient,
    deleteClient,
    updateTask,
    createTask,
    reconcileInvoice,
    createPortalCredential,
    updatePortalCredential,
    deletePortalCredential,
    bulkImportCredentials,
    checkoutDscToken,
    returnDscToken,
    createDscToken,
    deleteDscToken,
  } = useTaxoData(isDemoSandbox);

  // Default to unauthenticated session (require explicit login or sandbox entry)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentView, setCurrentView] = useState<"partner" | "article" | "client-pwa">("client-pwa");
  const [activePartnerTab, setActivePartnerTab] = useState<string>("dashboard");
  const [bridgedAuditDisallowances, setBridgedAuditDisallowances] = useState<number | null>(null);
  const [activeClientTab, setActiveClientTab] = useState<string>("progress");
  const [isClientQuickActionOpen, setIsClientQuickActionOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginInitialRole, setLoginInitialRole] = useState<"partner" | "article" | "client">("partner");
  const [loginInitialPhone, setLoginInitialPhone] = useState<string>("");
  const [isClientMasterOpen, setIsClientMasterOpen] = useState(false);
  const [isFirmHubOpen, setIsFirmHubOpen] = useState(false);
  const [isClientBroadcasterOpen, setIsClientBroadcasterOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [selectedGstin, setSelectedGstin] = useState<string>("");
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Universal Client Switcher Handler
  const handleSelectClient = (clientId: string, gstin?: string) => {
    setSelectedEntityId(clientId);
    if (gstin) {
      setSelectedGstin(gstin);
    } else {
      const match = clients.find((c) => c.id === clientId);
      setSelectedGstin(match?.gstin || (match?.gstinRecords && match.gstinRecords[0]?.gstin) || "");
    }
  };

  // Safe Session Synchronization & Query Parameter Handler
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      const demoParam = params.get("demo");
      const portalParam = params.get("portal");
      const phoneParam = params.get("phone");
      const pinParam = params.get("pin");
      const roleParam = params.get("role");

      const tabParam = params.get("tab");
      if (tabParam) {
        setActivePartnerTab(tabParam);
      }

      const existing = getActiveSession();

      // CASE 1: Client Portal link clicked (?portal=client OR ?phone=... OR ?role=client OR ?view=client-pwa)
      if (portalParam === "client" || phoneParam || roleParam === "client" || viewParam === "client-pwa") {
        const cleanPhone = phoneParam ? phoneParam.replace(/\D/g, "") : "";
        const cleanPin = pinParam ? pinParam.trim() : "";

        // If previous session is NOT a client (e.g. CA tested on their own browser), CLEAR IT so client view opens!
        if (existing && existing.role !== "CLIENT") {
          clearSession();
        } else if (existing && existing.role === "CLIENT") {
          // If already signed in as client and phone matches (or no phone specified)
          if (!cleanPhone || existing.phone?.replace(/\D/g, "").slice(-10) === cleanPhone.slice(-10)) {
            setCurrentUser(existing);
            setIsDemoSandbox(false);
            setCurrentView("client-pwa");
            return;
          }
        }

        // If 1-Tap Login with Phone & PIN in URL
        if (cleanPhone && cleanPin) {
          fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              portalMode: "client",
              identifier: cleanPhone,
              secret: cleanPin
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data?.success && data?.user) {
              handleLoginSuccess(data.user);
            } else {
              setLoginInitialRole("client");
              setLoginInitialPhone(cleanPhone);
              setIsLoginModalOpen(true);
            }
          })
          .catch(() => {
            setLoginInitialRole("client");
            setLoginInitialPhone(cleanPhone);
            setIsLoginModalOpen(true);
          });
          return;
        }

        // Pre-fill phone and open client login
        setLoginInitialRole("client");
        if (cleanPhone) setLoginInitialPhone(cleanPhone);
        setIsLoginModalOpen(true);
        return;
      }

      // CASE 2: Staff login explicitly requested (?portal=staff OR ?role=partner OR ?role=article)
      if (portalParam === "staff" || roleParam === "partner" || roleParam === "article") {
        setLoginInitialRole(roleParam === "article" ? "article" : "partner");
        setIsLoginModalOpen(true);
        return;
      }

      // CASE 3: Standard Existing Authenticated Session
      if (existing) {
        setCurrentUser(existing);
        setIsDemoSandbox(false);
        if (existing.role === "ARTICLE") setCurrentView("article");
        else if (existing.role === "CLIENT") setCurrentView("client-pwa");
        else setCurrentView("partner");
        return;
      }

      // CASE 4: Explicit Sandbox Evaluation Flag or Direct Practice Tab Deep Link
      if (demoParam === "true" || viewParam === "sandbox" || tabParam) {
        setCurrentUser(DEMO_USERS.partner);
        setCurrentView("partner");
        setIsDemoSandbox(true);
        if (tabParam) {
          setActivePartnerTab(tabParam);
        }
        return;
      }
    } catch (e) {
      console.warn("Storage session read bypassed:", e);
    }
  }, []);

  const handleTaskStatusChange = async (taskId: string, newStatus: WorkflowStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  // Synchronized Tab Navigation with Browser History & Deep Linking
  const handleTabChange = (tab: string) => {
    if (tab === "client-master") {
      setIsClientMasterOpen(true);
      return;
    }
    if (currentView === "client-pwa") {
      setActiveClientTab(tab as any);
    } else {
      setActivePartnerTab(tab);
      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("tab", tab);
          window.history.pushState({ tab }, "", url.toString());
        } catch (e) {}
      }
    }
  };

  // Browser Back/Forward navigation listener
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActivePartnerTab(e.state.tab);
      } else {
        try {
          const params = new URLSearchParams(window.location.search);
          const tab = params.get("tab");
          if (tab) {
            setActivePartnerTab(tab);
          } else {
            setActivePartnerTab("dashboard");
          }
        } catch (e) {}
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Global Keyboard Shortcuts Suite (Cmd/Ctrl + M for Mega Menu, Cmd/Ctrl + H for Dashboard)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Cmd/Ctrl + M -> Toggle 6-Column Mega Menu App Launcher
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setIsAppLauncherOpen((prev) => !prev);
      }
      // Cmd/Ctrl + H -> Return to Executive Dashboard
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        handleTabChange("dashboard");
      }
      // ? (Shift + /) -> Show Keyboard Shortcuts Sheet (when not typing in an input)
      if (e.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [currentView]);

  const handleLoginSuccess = (user: AuthUser | null) => {
    if (!user) return;
    setCurrentUser(user);
    setIsDemoSandbox(false);
    toast.success(
      "Signed In Successfully",
      `Welcome, ${user.name} (${user.role === "PARTNER" ? "Managing Partner" : user.role === "ARTICLE" ? "Article Trainee" : "Client Portal"})`
    );
    if (user.role === "ARTICLE") setCurrentView("article");
    else if (user.role === "CLIENT") setCurrentView("client-pwa");
    else setCurrentView("partner");
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setIsDemoSandbox(false);
    setIsLoginModalOpen(false);
    toast.info("Signed Out", "Your session has been securely closed.");
  };

  const handleSwitchUserRole = (role: "partner" | "article" | "client") => {
    let targetUser: AuthUser | null = null;
    if (role === "client") {
      const activeClient = clients.length > 0 ? clients[0] : null;
      if (activeClient) {
        targetUser = {
          id: `USR-${activeClient.id}`,
          name: activeClient.primaryContact?.name || "Authorized Director",
          email: activeClient.primaryContact?.email || "director@client-portal.in",
          phone: activeClient.primaryContact?.phone || "+91 98000 00003",
          role: "CLIENT",
          designation: `${activeClient.primaryContact?.designation || "Director"} (${activeClient.name})`,
          firmId: "FRM-022998C",
          firmName: "GPA & Co., Chartered Accountants",
          firmFrn: "022998C",
          clientGroupId: activeClient.groupId,
          clientEntityId: activeClient.id,
          token: `tok_client_${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };
      } else {
        targetUser = DEMO_USERS.client;
      }
    } else {
      targetUser = DEMO_USERS[role];
    }

    if (targetUser) {
      setActiveSession(targetUser);
      toast.info(
        "Switched Profile",
        `Active view: ${targetUser.name} (${role === "partner" ? "Partner Cockpit" : role === "article" ? "Article Assistant" : "Client Portal"})`
      );
    }
    setCurrentUser(targetUser);
    if (role === "partner") {
      setIsDemoSandbox(true);
      setCurrentView("partner");
    } else if (role === "article") {
      setIsDemoSandbox(true);
      setCurrentView("article");
    } else {
      setIsDemoSandbox(true);
      setCurrentView("client-pwa");
    }
  };

  // 1. Explicit Login Modal View (Directly opened via Sign In button)
  if (isLoginModalOpen && !currentUser) {
    return (
      <LoginModal 
        onLoginSuccess={(user) => {
          setIsLoginModalOpen(false);
          handleLoginSuccess(user);
        }}
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={loginInitialRole}
        initialPhone={loginInitialPhone} 
        clients={clients}
      />
    );
  }

  // 2. If user has no active session and is not in pitch demo -> Show Enterprise SaaS Gateway
  if (!currentUser && !isDemoSandbox) {
    return (
      <SaasGateway 
        onEnterSandbox={(role) => handleSwitchUserRole(role)}
        onOpenLogin={(role) => {
          setLoginInitialRole(role || "partner");
          setIsLoginModalOpen(true);
        }}
        onPracticeRegistered={(user) => {
          handleLoginSuccess(user);
        }}
      />
    );
  }

  // 3. Fallback: If user is logged out without gateway
  if (!currentUser) {
    return (
      <LoginModal 
        onLoginSuccess={handleLoginSuccess} 
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={loginInitialRole}
        initialPhone={loginInitialPhone} 
        clients={clients}
      />
    );
  }

  const partnerTabs = [
    { id: "growth-engine", label: "Client Acquisition & Leads", icon: Compass, iconColor: "text-emerald-600" },
    { id: "calendar", label: `Tax Deadlines (${tasks.length})`, icon: Calendar, iconColor: "text-btred-logo" },
    { id: "pay-to-release", label: "Fee Release Gate", icon: Lock, iconColor: "text-emerald-700" },
    { id: "notices", label: "Tax Scrutiny Notices", icon: ShieldAlert, iconColor: "text-btred-logo" },
    { id: "vcfo", label: "vCFO Cockpit", icon: TrendingUp, iconColor: "text-indigo-600" },
    { id: "bank-parser", label: "Bank OCR to Tally", icon: FileSpreadsheet, iconColor: "text-emerald-500" },
    { id: "gstr2b", label: "GST Matcher (2B)", icon: FileSpreadsheet, iconColor: "text-blue-500" },
    { id: "ais-analyzer", label: "AIS / 26AS SFT Inspector", icon: FileSearch, iconColor: "text-teal-700" },
    { id: "itr-calc", label: "ITR Tax Engine (115BAC)", icon: Calculator, iconColor: "text-amber-500" },
    { id: "tax-audit-3cd", label: "Tax Audit 3CD Workpapers", icon: ClipboardCheck, iconColor: "text-amber-600" },
    { id: "schedule3-audit", label: "Schedule III & Audit Leads", icon: Layers, iconColor: "text-indigo-400" },
    { id: "udin-vault", label: "UDIN 60-Day Vault", icon: KeyRound, iconColor: "text-purple-800" },
    { id: "notice-drafter", label: "Statutory Notice Drafter", icon: Scale, iconColor: "text-btred-logo" },
    { id: "assessee-approval", label: "Assessee Legal Sign-off", icon: FileCheck, iconColor: "text-teal-700" },
    { id: "content-studio", label: "CA Creator Studio", icon: Video, iconColor: "text-pink-500" },
    { id: "engagement-letter", label: "Engagement Letters (SA 210)", icon: FileCheck, iconColor: "text-emerald-500" },
    { id: "billing", label: "Billing & Invoices", icon: DollarSign, iconColor: "text-btred-logo" },
    { id: "whatsapp-ai", label: "1-Tap WhatsApp Desk", icon: MessageSquare, iconColor: "text-teal-700" },
    { id: "entity-dna", label: "Entity DNA Engine", icon: Layers, iconColor: "text-purple-600" },
    { id: "dsc", label: "Keys & Vault", icon: KeyRound, iconColor: "text-btred-logo" },
    { id: "peer-review", label: "Audit Quality", icon: Award, iconColor: "text-indigo-400" },
    { id: "anti-poaching", label: "Firm Insights", icon: Fingerprint, iconColor: "text-btred-logo" },
    { id: "inward-outward", label: "Dispatches & Letters", icon: Package, iconColor: "text-amber-500" },
    { id: "batch-dispatch", label: "Batch Dispatcher", icon: Sparkles, iconColor: "text-indigo-300" },
  ];

  const activeNavItem = getNavItemById(activePartnerTab);
  const ActiveToolIcon = activeNavItem?.icon;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
        {/* Unified Master Navigation Cockpit */}
        <TopNav 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onNavigateTab={(tab) => handleTabChange(tab)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUserRole}
          onOpenClientMaster={() => setIsClientMasterOpen(true)}
          onOpenFirmHub={() => setIsFirmHubOpen(true)}
          onOpenClientBroadcaster={() => setIsClientBroadcasterOpen(true)}
          onExitSandbox={() => {
            clearSession();
            setCurrentUser(null);
            setIsDemoSandbox(false);
            setIsLoginModalOpen(false);
          }}
          isSandbox={isDemoSandbox}
          onToggleSidebar={() => setIsMobileDrawerOpen((prev) => !prev)}
          onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
          activeClientEntityId={selectedEntityId || currentUser?.clientEntityId || clients[0]?.id || "client-pratwi"}
          activeClientName={clients.find(c => c.id === (selectedEntityId || currentUser?.clientEntityId || clients[0]?.id))?.name || "Pratwi Solutions Private Limited"}
          isClientMode={currentView === "client-pwa" || (currentView as any) === "client"}
          clients={clients}
          groups={groups}
          onSelectClient={handleSelectClient}
          selectedGstin={selectedGstin}
          onOpenDiagnosticOnboarding={() => setIsDiagnosticModalOpen(true)}
        />

        {/* Master Flex Layout with Left Sidebar */}
        <div className="flex-1 flex w-full max-w-[1920px] mx-auto min-w-0">
          {/* Collapsible Left Sidebar (Only in Partner View) */}
          {currentView === "partner" && (
            <SidebarNav
              activeTab={activePartnerTab}
              onNavigateTab={(tab) => handleTabChange(tab)}
              isMobileDrawerOpen={isMobileDrawerOpen}
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
              onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
              onOpenClientMaster={() => setIsClientMasterOpen(true)}
              clientCount={clients.length}
            />
          )}

          {/* Main Content Area */}
          <main className="flex-1 w-full min-w-0 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-28 md:pb-12 overflow-x-hidden">
          {/* VIEW 1: CLIENT PWA PORTAL (PRIMARY CLIENT-CENTRIC EXPERIENCE) */}
          {currentView === "client-pwa" && (
            <ClientPortalPwa 
              currentUser={currentUser}
              isSandbox={isDemoSandbox}
              externalTab={activeClientTab as any}
              isQuickActionOpen={isClientQuickActionOpen}
              onCloseQuickAction={() => setIsClientQuickActionOpen(false)}
              onOpenQuickAction={() => setIsClientQuickActionOpen(true)}
              hasTopNav={true}
            />
          )}

          {/* VIEW 2: PARTNER COCKPIT (FOR CA PARTNERS & MANAGERS) */}
          {currentView === "partner" && (
            <div className="space-y-4 sm:space-y-6">
              {/* INSTITUTIONAL AUTOPILOT AI TELEMETRY COCKPIT */}
              <AutopilotPulseCockpit 
                onTriggerSweep={async () => {
                  try {
                    const res = await fetch("/api/firm-autopilot", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ triggerSource: "MANUAL_PULSE" }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      await refreshData();
                      return data.summary;
                    }
                  } catch (err) {
                    console.error("Autopilot sweep failed:", err);
                  }
                }}
              />

              {/* 1. EXECUTIVE DASHBOARD (PRIMARY FIRST PAGE WITH 4 MASTER KPI CARDS) */}
              {activePartnerTab === "dashboard" && (
                <ExecutiveDashboard
                  tasks={tasks}
                  invoices={invoices}
                  notices={notices}
                  clients={clients}
                  groups={groups}
                  dscTokens={dscTokens}
                  onNavigateTab={(tab) => handleTabChange(tab)}
                  onOpenClientMaster={() => setIsClientMasterOpen(true)}
                  onOpenFirmHub={() => setIsFirmHubOpen(true)}
                  onStatusChange={handleTaskStatusChange}
                  isSandbox={isDemoSandbox}
                />
              )}

              {/* 2. TOP ACTIVE TOOL HEADER (SHOWN ONLY ON NON-DASHBOARD WORKSPACES) */}
              {activePartnerTab !== "dashboard" && (
                <ActiveToolHeader
                  activeTab={activePartnerTab}
                  onNavigateTab={(tab) => handleTabChange(tab)}
                  onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
                  clients={clients}
                  selectedClientId={selectedEntityId || clients[0]?.id}
                  onSelectClient={handleSelectClient}
                />
              )}

              {/* Active Content */}
              {activePartnerTab === "growth-engine" && (
                <PracticeGrowthCockpit onClientConverted={() => refreshData()} />
              )}
              {activePartnerTab === "batch-dispatch" && (
                <BatchOutwardDispatcher 
                  clients={clients.length > 0 ? clients : INITIAL_CLIENTS}
                  onBatchDispatched={() => refreshData()}
                  onTasksUpdated={() => refreshData()}
                />
              )}
              {(activePartnerTab === "calendar" || activePartnerTab === "tasks") && (
                <StatutoryTaskEngine 
                  tasks={tasks} 
                  clients={clients}
                  groups={groups}
                  onStatusChange={handleTaskStatusChange} 
                  onAddTask={createTask}
                  onBatchTasksAdd={async (newTasks) => {
                    for (const t of newTasks) {
                      await createTask(t);
                    }
                  }}
                  selectedClientId={selectedEntityId || clients[0]?.id}
                  onSelectClient={handleSelectClient}
                  initialTab="kanban"
                />
              )}

              {activePartnerTab === "workload-matrix" && (
                <StatutoryTaskEngine 
                  tasks={tasks} 
                  clients={clients}
                  groups={groups}
                  onStatusChange={handleTaskStatusChange} 
                  onAddTask={createTask}
                  onBatchTasksAdd={async (newTasks) => {
                    for (const t of newTasks) {
                      await createTask(t);
                    }
                  }}
                  selectedClientId={selectedEntityId || clients[0]?.id}
                  onSelectClient={handleSelectClient}
                  initialTab="workload"
                />
              )}

              {activePartnerTab === "vcfo" && (
                <VirtualCfoCockpit />
              )}

              {activePartnerTab === "bank-parser" && (
                <BankStatementParser />
              )}

              {(activePartnerTab === "entity-dna" || activePartnerTab === "client-master") && (
                <EntityDnaMaster
                  clients={clients}
                  groups={groups}
                  selectedClientId={selectedEntityId || clients[0]?.id || ""}
                  onSelectClient={handleSelectClient}
                  onUpdateClient={updateClient}
                  onOpenDiagnosticModal={() => setIsDiagnosticModalOpen(true)}
                />
              )}

              {activePartnerTab === "pay-to-release" && (
                <PayToReleaseManager
                  configs={(payConfigs.length > 0 ? payConfigs : INITIAL_PAY_TO_RELEASE_CONFIGS) as any}
                  clients={clients.length > 0 ? clients : INITIAL_CLIENTS}
                  invoices={invoices.length > 0 ? invoices : INITIAL_INVOICES}
                  firmUpiVpa={DEFAULT_FIRM_BRANDING.firmUpiVpa}
                  onRefreshData={refreshData}
                />
              )}

              {activePartnerTab === "whatsapp-ai" && (
                <WhatsAppAiWorkbench
                  clients={clients}
                  initialStatements={(isDemoSandbox ? SANDBOX_PARSED_STATEMENTS : INITIAL_PARSED_STATEMENTS) as any}
                  initialVaults={(isDemoSandbox ? SANDBOX_PASSWORD_VAULTS : INITIAL_PASSWORD_VAULTS) as any}
                  onTaskUpdated={refreshData}
                />
              )}

              {activePartnerTab === "gstr2b" && (
                <Gstr2bReconciler />
              )}

              {activePartnerTab === "ais-analyzer" && (
                <Ais26asAnalyzer clients={clients} />
              )}

              {activePartnerTab === "itr-calc" && (
                <ItrComputationEngine 
                  clients={clients} 
                  initialDisallowances={bridgedAuditDisallowances}
                />
              )}

              {activePartnerTab === "tax-audit-3cd" && (
                <Form3cdWorkpaper 
                  clients={clients} 
                  onPushToItr={(disallowanceAmount) => {
                    setBridgedAuditDisallowances(disallowanceAmount);
                    setActivePartnerTab("itr-calc");
                  }}
                />
              )}

              {activePartnerTab === "schedule3-audit" && (
                <Schedule3AuditEngine clients={clients} />
              )}

              {activePartnerTab === "udin-vault" && (
                <UdinVault clients={clients} />
              )}

              {activePartnerTab === "notice-drafter" && (
                <NoticeReplyDrafter clients={clients} />
              )}

              {activePartnerTab === "assessee-approval" && (
                <AssesseeApprovalDesk clients={clients} />
              )}

              {activePartnerTab === "content-studio" && (
                <CaCreatorContentStudio />
              )}

              {activePartnerTab === "engagement-letter" && (
                <EngagementLetterGenerator clients={clients} />
              )}

              {activePartnerTab === "notices" && (
                <NoticeCenter 
                  notices={notices} 
                  onNoticeUpdated={refreshData}
                  onNavigateToDrafter={() => handleTabChange("notice-drafter")}
                />
              )}

              {activePartnerTab === "peer-review" && (
                <PeerReviewManager
                  clients={clients}
                  initialMsmeRecords={(isDemoSandbox ? SANDBOX_MSME_43BH_RECORDS : INITIAL_MSME_43BH_RECORDS) as any}
                  initialSection40a={(isDemoSandbox ? SANDBOX_SECTION_40A2B_SAMPLES : INITIAL_SECTION_40A2B_SAMPLES) as any}
                />
              )}

              {activePartnerTab === "anti-poaching" && (
                <EnterpriseSecurityAndRealization
                  partnerMetrics={(isDemoSandbox ? SANDBOX_PARTNER_METRICS : INITIAL_PARTNER_METRICS) as any}
                  securityLogs={(isDemoSandbox ? SANDBOX_STAFF_SECURITY_LOGS : INITIAL_STAFF_SECURITY_LOGS) as any}
                />
              )}

              {activePartnerTab === "billing" && (
                <BillingWip 
                  invoices={invoices} 
                  clients={clients}
                  onRefresh={refreshData}
                />
              )}

              {activePartnerTab === "dsc" && (
                <KeysVault
                  tokens={dscTokens}
                  credentials={portalCredentials}
                  clients={clients}
                  onCreateCredential={createPortalCredential}
                  onUpdateCredential={updatePortalCredential}
                  onDeleteCredential={deletePortalCredential}
                  onBulkImport={bulkImportCredentials}
                  onCheckoutDsc={checkoutDscToken}
                  onReturnDsc={returnDscToken}
                  onCreateDsc={createDscToken}
                  onDeleteDsc={deleteDscToken}
                />
              )}

              {activePartnerTab === "inward-outward" && (
                <InwardOutwardRegister />
              )}
            </div>
          )}

          {/* VIEW 3: ARTICLE WORKBENCH (FOR ARTICLE TRAINEES) */}
          {currentView === "article" && <ArticleWorkbench isSandbox={isDemoSandbox} />}
        </main>
      </div>

      {/* Floating Bottom Navigation */}
      <FloatingBottomNav
        currentView={currentView}
        activeTab={currentView === "client-pwa" ? activeClientTab : activePartnerTab}
        onTabChange={handleTabChange}
        onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
        onQuickAction={() => {
          if (currentView === "client-pwa") {
            setIsClientQuickActionOpen(true);
          } else {
            setIsFirmHubOpen(true);
          }
        }}
      />

      {/* 6-Column Panoramic App Launcher Mega Menu */}
      <AppLauncherMegaMenu
        isOpen={isAppLauncherOpen}
        onClose={() => setIsAppLauncherOpen(false)}
        activeTab={activePartnerTab}
        onSelectTab={(tab) => handleTabChange(tab)}
      />

      {/* Firm Action Hub Modal */}
      <FirmHubActionModal
        isOpen={isFirmHubOpen}
        onClose={() => setIsFirmHubOpen(false)}
        onOpenClientMaster={() => setIsClientMasterOpen(true)}
        onOpenNewTask={() => handleTabChange("calendar")}
        onNavigateTab={(tab) => handleTabChange(tab)}
        onOpenClientBroadcaster={() => {
          setIsFirmHubOpen(false);
          setIsClientBroadcasterOpen(true);
        }}
      />

      {/* Enterprise Zero-Cost Client Notification Broadcaster */}
      <ClientNotificationBroadcasterModal
        isOpen={isClientBroadcasterOpen}
        onClose={() => setIsClientBroadcasterOpen(false)}
        clients={clients}
        currentUser={currentUser}
      />

      {/* Client Master Modal */}
      <ClientMasterModal
        isOpen={isClientMasterOpen}
        onClose={() => setIsClientMasterOpen(false)}
        clients={clients}
        groups={groups}
        onAddClient={async (newClient) => {
          await createClient(newClient);
          await refreshData();
        }}
        onUpdateClient={async (id, data) => {
          await updateClient(id, data);
          await refreshData();
        }}
        onDeleteClient={async (id) => {
          await deleteClient(id);
          await refreshData();
        }}
      />

      {/* 1-Tap Corporate Diagnostic Onboarding Modal */}
      <DiagnosticOnboardingModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        groups={groups}
        onAddClient={async (newClient) => {
          await createClient(newClient);
          await refreshData();
          setSelectedEntityId(newClient.id);
          if (newClient.gstin) setSelectedGstin(newClient.gstin);
        }}
      />

      {/* Superhuman / Linear Style Keyboard Shortcuts Modal (Triggered by '?') */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onNavigate={(tab) => handleTabChange(tab)}
      />
    </div>
);
}
