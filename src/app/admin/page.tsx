"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopNav } from "@/components/navigation/TopNav";
import { FloatingBottomNav } from "@/components/navigation/FloatingBottomNav";
import { StatutoryCalendar } from "@/components/firm/StatutoryCalendar";
import { NoticeCenter } from "@/components/firm/NoticeCenter";
import { BillingWip } from "@/components/firm/BillingWip";
import { DscVault } from "@/components/firm/DscVault";
import { ArticleWorkbench } from "@/components/firm/ArticleWorkbench";
import { Gstr2bReconciler } from "@/components/firm/Gstr2bReconciler";
import { InwardOutwardRegister } from "@/components/firm/InwardOutwardRegister";
import { PayToReleaseManager } from "@/components/firm/PayToReleaseManager";
import { WhatsAppAiWorkbench } from "@/components/firm/WhatsAppAiWorkbench";
import { PeerReviewManager } from "@/components/firm/PeerReviewManager";
import { EnterpriseSecurityAndRealization } from "@/components/firm/EnterpriseSecurityAndRealization";
import { BatchOutwardDispatcher } from "@/components/firm/BatchOutwardDispatcher";
import { ClientMasterModal } from "@/components/firm/ClientMasterModal";
import { FirmHubActionModal } from "@/components/firm/FirmHubActionModal";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { AppLauncherMegaMenu } from "@/components/navigation/AppLauncherMegaMenu";
import { ActiveToolHeader } from "@/components/navigation/ActiveToolHeader";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { getNavItemById } from "@/lib/navigation/navigationItems";
import { LoginModal } from "@/components/auth/LoginModal";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { toast } from "@/components/shared/ToastNotification";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { 
  AuthUser, 
  DEMO_USERS,
  getActiveSession,
  setActiveSession,
  clearSession
} from "@/lib/auth/session";
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
  ArrowLeft,
  UserCheck,
  Users,
  Sparkles,
  Grid
} from "lucide-react";

export default function AdminPage() {
  const {
    tasks,
    invoices,
    notices,
    dscTokens,
    clients,
    groups,
    payConfigs,
    refreshData,
    createClient,
    updateClient,
    deleteClient,
    updateTask,
    createTask,
    reconcileInvoice
  } = useTaxoData();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentView, setCurrentView] = useState<"partner" | "article" | "client-pwa">("partner");
  const [activePartnerTab, setActivePartnerTab] = useState<string>("dashboard");
  const [isClientMasterOpen, setIsClientMasterOpen] = useState(false);
  const [isFirmHubOpen, setIsFirmHubOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);

  useEffect(() => {
    const session = getActiveSession();
    if (session) {
      setCurrentUser(session);
    } else {
      window.location.href = "/?auth_required=admin";
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setActivePartnerTab(tab);
    } catch (e) {}

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActivePartnerTab(e.state.tab);
      } else {
        try {
          const params = new URLSearchParams(window.location.search);
          const tab = params.get("tab");
          setActivePartnerTab(tab || "dashboard");
        } catch (e) {}
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Global Keyboard Shortcuts (Cmd/Ctrl + M for Mega Menu, Cmd/Ctrl + H for Dashboard)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setIsAppLauncherOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        handleTabChange("dashboard");
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  const handleTaskStatusChange = async (taskId: string, newStatus: WorkflowStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleTabChange = (tab: string) => {
    if (tab === "client-master") {
      setIsClientMasterOpen(true);
      return;
    }
    setActivePartnerTab(tab);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.pushState({ tab }, "", url.toString());
      } catch (e) {}
    }
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    toast.info("Signed Out", "Admin session ended securely.");
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
    if (role === "partner") setCurrentView("partner");
    else if (role === "article") setCurrentView("article");
    else setCurrentView("client-pwa");
  };

  const partnerTabs = [
    { id: "calendar", label: `Tax Deadlines (${tasks.length})`, icon: Calendar, iconColor: "text-btred-logo" },
    { id: "pay-to-release", label: "Fee Release", icon: Lock, iconColor: "text-emerald-700" },
    { id: "whatsapp-ai", label: "WhatsApp Helpdesk", icon: MessageSquare, iconColor: "text-teal-700" },
    { id: "gstr2b", label: "GST Matcher (2B)", icon: FileSpreadsheet, iconColor: "text-blue-500" },
    { id: "notices", label: "Tax Notices", icon: ShieldAlert, iconColor: "text-btred-logo" },
    { id: "peer-review", label: "Audit Quality", icon: Award, iconColor: "text-indigo-400" },
    { id: "anti-poaching", label: "Firm Insights", icon: Fingerprint, iconColor: "text-btred-logo" },
    { id: "billing", label: "Billing & Invoices", icon: DollarSign, iconColor: "text-btred-logo" },
    { id: "dsc", label: "DSC Keys", icon: KeyRound, iconColor: "text-btred-logo" },
    { id: "inward-outward", label: "Dispatches & Letters", icon: Package, iconColor: "text-amber-500" },
    { id: "batch-dispatch", label: "Batch Dispatcher", icon: Sparkles, iconColor: "text-indigo-300" },
  ];

  if (!currentUser) {
    return (
      <LoginModal 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === "ARTICLE") setCurrentView("article");
          else if (user.role === "CLIENT") setCurrentView("client-pwa");
          else setCurrentView("partner");
        }} 
        initialRole="partner" 
        clients={clients}
      />
    );
  }

  return (
    <ErrorBoundary fallbackTitle="CA Firm Administration Cockpit">
      <div className="min-h-screen min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
        {/* Master Navigation Cockpit */}
        <TopNav 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onNavigateTab={(tab) => handleTabChange(tab)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUserRole}
          onOpenClientMaster={() => setIsClientMasterOpen(true)}
          onOpenFirmHub={() => setIsFirmHubOpen(true)}
          onExitSandbox={() => {
            clearSession();
            window.location.href = "/?landing=true";
          }}
          isSandbox={true}
          onToggleSidebar={() => setIsMobileDrawerOpen((prev) => !prev)}
          onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
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
            {currentView === "partner" && (
              <div className="space-y-4 sm:space-y-6">
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
                    isSandbox={true}
                  />
                )}

                {/* 2. TOP ACTIVE TOOL HEADER (SHOWN ONLY ON NON-DASHBOARD WORKSPACES) */}
                {activePartnerTab !== "dashboard" && (
                  <ActiveToolHeader
                    activeTab={activePartnerTab}
                    onNavigateTab={(tab) => handleTabChange(tab)}
                    onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
                    clients={clients}
                  />
                )}

                {/* Active Content */}
                {activePartnerTab === "batch-dispatch" && (
                <BatchOutwardDispatcher 
                  clients={clients.length > 0 ? clients : INITIAL_CLIENTS}
                  onBatchDispatched={() => refreshData()}
                  onTasksUpdated={() => refreshData()}
                />
              )}
              {activePartnerTab === "calendar" && (
                <StatutoryCalendar 
                  tasks={tasks} 
                  clients={clients}
                  onStatusChange={handleTaskStatusChange}
                  onAddTask={createTask}
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
                  clients={clients.length > 0 ? clients : INITIAL_CLIENTS}
                  initialStatements={INITIAL_PARSED_STATEMENTS as any}
                  initialVaults={INITIAL_PASSWORD_VAULTS as any}
                  onTaskUpdated={refreshData}
                />
              )}

              {activePartnerTab === "gstr2b" && (
                <Gstr2bReconciler />
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
                  initialMsmeRecords={INITIAL_MSME_43BH_RECORDS as any}
                  initialSection40a={INITIAL_SECTION_40A2B_SAMPLES as any}
                />
              )}

              {activePartnerTab === "anti-poaching" && (
                <EnterpriseSecurityAndRealization
                  partnerMetrics={INITIAL_PARTNER_METRICS as any}
                  securityLogs={INITIAL_STAFF_SECURITY_LOGS as any}
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
                <DscVault tokens={dscTokens} />
              )}

              {activePartnerTab === "inward-outward" && (
                <InwardOutwardRegister />
              )}
            </div>
          )}

          {/* VIEW 2: ARTICLE WORKBENCH */}
          {currentView === "article" && <ArticleWorkbench />}
        </main>
      </div>

      {/* Floating Bottom Navigation */}
      <FloatingBottomNav
        currentView={currentView}
        activeTab={activePartnerTab}
        onTabChange={handleTabChange}
        onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
        onQuickAction={() => setIsFirmHubOpen(true)}
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
      </div>
    </ErrorBoundary>
  );
}
