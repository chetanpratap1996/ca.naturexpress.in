"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopNav } from "@/components/navigation/TopNav";
import { FloatingBottomNav } from "@/components/navigation/FloatingBottomNav";
import { StatutoryCalendar } from "@/components/firm/StatutoryCalendar";
import { FirmDocuments } from "@/components/firm/FirmDocuments";
import { ClientAccessManager } from "@/components/firm/ClientAccessManager";
import { StaffAccessManager } from "@/components/firm/StaffAccessManager";
import { StaffPortal } from "@/components/firm/StaffPortal";
import { ActivityLog } from "@/components/firm/ActivityLog";
import { NoticeRegister } from "@/components/firm/NoticeRegister";
import { PilotScorecard } from "@/components/firm/PilotScorecard";
import { BillingWip } from "@/components/firm/BillingWip";
import { DscVault } from "@/components/firm/DscVault";
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
import { VirtualCfoCockpit } from "@/components/firm/VirtualCfoCockpit";
import { BankStatementParser } from "@/components/firm/BankStatementParser";
import { EntityDnaMatrixViewer } from "@/components/firm/EntityDnaMatrixViewer";
import { LoginModal } from "@/components/auth/LoginModal";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { SaasGateway } from "@/components/gateway/SaasGateway";
import { toast } from "@/components/shared/ToastNotification";
import { loadAuthenticatedUser, signOutSupabaseUser } from "@/lib/auth/supabaseUser";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { 
  AuthUser, 
  getActiveSession, 
  clearSession, 
  setActiveSession, 
  DEMO_USERS
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
  FileText,
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
  Briefcase,
  ChevronDown,
  Layers,
  ClipboardCheck
} from "lucide-react";

export default function Home() {
  // Production clients use the entity-scoped portal API inside ClientPortalPwa.
  // Do not even request the whole-firm JSON endpoint for their parent page.
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(process.env.NODE_ENV === "production" ? null : DEMO_USERS.partner);
  // Use persistent hook
  const {
    tasks,
    documents,
    invoices,
    auditTrail,
    notices,
    dscTokens,
    clients,
    groups,
    payConfigs,
    refreshData,
    dataError,
    createClient,
    updateTask,
    recordReminderDraft,
    createTask,
    reconcileInvoice,
    uploadDocument,
    reviewDocument
  } = useTaxoData({ enabled: process.env.NODE_ENV !== "production" || currentUser?.role === "PARTNER" });
  const now = Date.now();
  const next72Hours = now + 72 * 60 * 60 * 1000;
  const criticalDueWithin72Hours = tasks.filter((task) => {
    if (task.priority !== "CRITICAL" || task.status === "FILED_AND_COMPLETED") return false;
    const dueAtEndOfDay = new Date(`${task.dueDate}T23:59:59`).getTime();
    return Number.isFinite(dueAtEndOfDay) && dueAtEndOfDay >= now && dueAtEndOfDay <= next72Hours;
  }).length;

  // Default to Managing Partner Cockpit for fresh setup
  const [currentView, setCurrentView] = useState<"partner" | "article" | "client-pwa">("partner");
  const [activePartnerTab, setActivePartnerTab] = useState<string>("calendar");
  const [activeClientTab, setActiveClientTab] = useState<string>("progress");
  const [isClientQuickActionOpen, setIsClientQuickActionOpen] = useState(false);
  const [isDemoSandbox, setIsDemoSandbox] = useState<boolean>(process.env.NODE_ENV !== "production");
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(process.env.NODE_ENV === "production");
  const [isClientMasterOpen, setIsClientMasterOpen] = useState(false);
  const [isFirmHubOpen, setIsFirmHubOpen] = useState(false);

  // Safe Session Synchronization
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      setIsDemoSandbox(false);
      void loadAuthenticatedUser().then((user) => {
        setCurrentUser(user);
        if (user?.role === "ARTICLE" || user?.role === "MANAGER") setCurrentView("article");
        else if (user?.role === "CLIENT") setCurrentView("client-pwa");
        else if (user) setCurrentView("partner");
      }).finally(() => setIsCheckingAuth(false));
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      const landingParam = params.get("landing");

      if (landingParam === "true") {
        setIsDemoSandbox(false);
        setCurrentUser(null);
        return;
      }

      if (viewParam === "admin" || viewParam === "partner") {
        setCurrentUser(DEMO_USERS.partner);
        setCurrentView("partner");
        setIsDemoSandbox(true);
        return;
      } else if (viewParam === "article") {
        setCurrentUser(DEMO_USERS.article);
        setCurrentView("article");
        setIsDemoSandbox(true);
        return;
      } else if (viewParam === "client") {
        setCurrentUser(DEMO_USERS.client);
        setCurrentView("client-pwa");
        setIsDemoSandbox(true);
        return;
      }

      const existing = getActiveSession();
      if (existing) {
        setCurrentUser(existing);
        if (existing.role === "ARTICLE") setCurrentView("article");
        else if (existing.role === "CLIENT") setCurrentView("client-pwa");
        else setCurrentView("partner");
      }
    } catch (e) {
      console.warn("Storage session read bypassed:", e);
    }
  }, []);

  const handleTaskStatusChange = async (taskId: string, newStatus: WorkflowStatus, arnNumber?: string) => {
    try {
      await updateTask(taskId, { status: newStatus, ...(arnNumber ? { arnNumber } : {}) });
    } catch (error) {
      toast.error("Task update failed", error instanceof Error ? error.message : "The change could not be saved.");
      throw error;
    }
  };

  const handleTabChange = (tab: string) => {
    if (currentView === "client-pwa") {
      setActiveClientTab(tab as any);
    } else {
      setActivePartnerTab(process.env.NODE_ENV === "production" && !["calendar", "documents", "client-access", "staff-access", "activity", "notices", "pilot"].includes(tab) ? "calendar" : tab);
    }
  };

  const navigatePartnerTab = (tab: string) => {
    setActivePartnerTab(process.env.NODE_ENV === "production" && !["calendar", "documents", "client-access", "staff-access", "activity", "notices", "pilot"].includes(tab) ? "calendar" : tab);
  };

  const handleLoginSuccess = (user: AuthUser | null) => {
    if (!user) return;
    setCurrentUser(user);
    setIsDemoSandbox(false);
    toast.success(
      "Signed In Successfully",
      `Welcome, ${user.name} (${user.role === "PARTNER" ? "Partner" : user.role === "MANAGER" ? "Firm Manager" : user.role === "ARTICLE" ? "Article Trainee" : "Client Portal"})`
    );
    if (user.role === "ARTICLE" || user.role === "MANAGER") setCurrentView("article");
    else if (user.role === "CLIENT") setCurrentView("client-pwa");
    else setCurrentView("partner");
  };

  if (isCheckingAuth) {
    return <main className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">Checking your secure firm session…</main>;
  }

  const handleLogout = () => {
    clearSession();
    void signOutSupabaseUser();
    setCurrentUser(null);
    setIsDemoSandbox(false);
    toast.info("Signed Out", "Your session has been securely closed.");
  };

  const handleSwitchUserRole = (role: "partner" | "article" | "client") => {
    if (process.env.NODE_ENV === "production") return;
    let targetUser: AuthUser | null = null;
    if (role === "client") {
      const activeClient = clients.length > 0 ? clients[0] : null;
      if (activeClient) {
        targetUser = {
          id: `USR-${activeClient.id}`,
          name: activeClient.primaryContact?.name || "Sample Client Contact",
          email: activeClient.primaryContact?.email || "client@example.invalid",
          phone: activeClient.primaryContact?.phone || "+91 00000 00002",
          role: "CLIENT",
          designation: `${activeClient.primaryContact?.designation || "Director"} (${activeClient.name})`,
          firmId: "FRM-022998C",
          firmName: "GPA & Co., Chartered Accountants",
          firmFrn: "022998C",
          clientGroupId: activeClient.groupId,
          clientEntityId: activeClient.id,
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
      setIsDemoSandbox(false);
      setCurrentView("client-pwa");
    }
  };

  // If user exits demo and has no active session -> Show Enterprise SaaS Gateway
  if (!currentUser && !isDemoSandbox) {
    if (process.env.NODE_ENV === "production") {
      return <LoginModal onLoginSuccess={handleLoginSuccess} initialRole="partner" />;
    }
    return (
      <SaasGateway 
        onEnterSandbox={(role) => handleSwitchUserRole(role)}
        onOpenLogin={(role) => {
          if (role) handleSwitchUserRole(role);
          else setCurrentUser(null);
        }}
      />
    );
  }

  // If user explicitly logs out without landing
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} initialRole={currentView === "client-pwa" ? "client" : "partner"} />;
  }

  if (process.env.NODE_ENV === "production" && (currentUser.role === "MANAGER" || currentUser.role === "ARTICLE")) {
    return <StaffPortal user={currentUser} onLogout={handleLogout} />;
  }

  const partnerTabs = [
    { id: "calendar", label: `Tax Deadlines (${tasks.length})`, icon: Calendar, iconColor: "text-btred-logo" },
    { id: "documents", label: `Documents (${documents.length})`, icon: FileText, iconColor: "text-indigo-500" },
    { id: "client-access", label: "Client Access", icon: Users, iconColor: "text-emerald-600" },
    { id: "staff-access", label: "Employee Access", icon: Briefcase, iconColor: "text-indigo-600" },
    { id: "activity", label: "Activity Log", icon: ShieldCheck, iconColor: "text-slate-700" },
    { id: "pay-to-release", label: "Fee Release Gate", icon: Lock, iconColor: "text-emerald-400" },
    { id: "notices", label: "Tax Scrutiny Notices", icon: ShieldAlert, iconColor: "text-btred-logo" },
    { id: "pilot", label: "Pilot Scorecard", icon: ClipboardCheck, iconColor: "text-indigo-600" },
    { id: "vcfo", label: "vCFO Cockpit", icon: TrendingUp, iconColor: "text-indigo-600" },
    { id: "bank-parser", label: "Bank OCR to Tally", icon: FileSpreadsheet, iconColor: "text-emerald-500" },
    { id: "gstr2b", label: "GST Matcher (2B)", icon: FileSpreadsheet, iconColor: "text-blue-500" },
    { id: "billing", label: "Billing & Invoices", icon: DollarSign, iconColor: "text-btred-logo" },
    { id: "whatsapp-ai", label: "1-Tap WhatsApp Desk", icon: MessageSquare, iconColor: "text-teal-400" },
    { id: "entity-dna", label: "Entity DNA Engine", icon: Layers, iconColor: "text-purple-600" },
    { id: "dsc", label: "DSC Keys", icon: KeyRound, iconColor: "text-btred-logo" },
    { id: "peer-review", label: "Audit Quality", icon: Award, iconColor: "text-indigo-400" },
    { id: "anti-poaching", label: "Firm Insights", icon: Fingerprint, iconColor: "text-rose-400" },
    { id: "inward-outward", label: "Dispatches & Letters", icon: Package, iconColor: "text-amber-500" },
    { id: "batch-dispatch", label: "Batch Dispatcher", icon: Sparkles, iconColor: "text-indigo-300" },
  ];
  const enabledPartnerTabs = process.env.NODE_ENV === "production"
    ? partnerTabs.filter((tab) => ["calendar", "documents", "client-access", "staff-access", "activity", "notices", "pilot"].includes(tab.id))
    : partnerTabs;

  return (
    <ErrorBoundary fallbackTitle="Client Application Recovered">
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
        {/* Unified Master Navigation Cockpit */}
        <TopNav 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onNavigateTab={navigatePartnerTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUserRole}
          onOpenClientMaster={() => setIsClientMasterOpen(true)}
          onOpenFirmHub={() => setIsFirmHubOpen(true)}
          onExitSandbox={() => {
            clearSession();
            setCurrentUser(null);
            setIsDemoSandbox(false);
          }}
          isSandbox={isDemoSandbox}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 pb-28 md:pb-20">
          {process.env.NODE_ENV === "production" && currentUser.role === "PARTNER" && (
            <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong>Limited production workspace.</strong> Enabled workflows are deadlines, private firm documents, client and employee account assignments, assigned-entity task progress/document intake, recent firm activity, manual notice tracking, and the pilot scorecard. Payment verification and government portal connections are not enabled. Apply all workspace migrations and configure the server-only Supabase secret plus the allowed invitation redirect before using access actions.
            </div>
          )}
          {dataError && !isDemoSandbox && (
            <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong>Live data is unavailable.</strong> {dataError} Refresh the page or contact your firm administrator.
            </div>
          )}
          {/* VIEW 1: CLIENT PWA PORTAL (PRIMARY CLIENT-CENTRIC EXPERIENCE) */}
          {currentView === "client-pwa" && (
            <ClientPortalPwa 
              externalTab={activeClientTab as any}
              isQuickActionOpen={isClientQuickActionOpen}
              onCloseQuickAction={() => setIsClientQuickActionOpen(false)}
              onOpenQuickAction={() => setIsClientQuickActionOpen(true)}
            />
          )}

          {/* VIEW 2: PARTNER COCKPIT (FOR CA PARTNERS & MANAGERS) */}
          {currentView === "partner" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Top KPI Metrics with Drill-Down Navigation */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div 
                  onClick={() => setActivePartnerTab("calendar")}
                  className="bg-white border border-slate-200 hover:border-emerald-400 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm cursor-pointer transition group"
                  title="Click to view Statutory Calendar drill-down"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-emerald-700 truncate">
                      Engagement Completion Rate
                    </span>
                    <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                      <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">
                      {tasks.length > 0 ? `${Math.round((tasks.filter(t => t.status === "FILED_AND_COMPLETED").length / tasks.length) * 100)}%` : "—"}
                    </span>
                    <span className="text-[10px] sm:text-xs text-emerald-600 font-bold">{tasks.length > 0 ? "Completed" : "No task data"}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium truncate">
                    {clients.length} Clients &bull; {clients.length} Active
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1.5 inline-flex items-center gap-1 group-hover:underline">
                    Inspect Calendar &rarr;
                  </span>
                </div>

                <div 
                  onClick={() => setActivePartnerTab("calendar")}
                  className="bg-white border border-slate-200 hover:border-red-400 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm cursor-pointer transition group"
                  title="Click to view 72-Hour Critical Deadlines"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-red-700 truncate">
                      Due in 72 Hours
                    </span>
                    <div className="p-1.5 sm:p-2 rounded-xl bg-red-50 text-btred-logo border border-red-200 shrink-0">
                      <AlertTriangle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-btred-logo">
                      {tasks.length > 0 ? criticalDueWithin72Hours : "—"}
                    </span>
                    <span className="text-[10px] sm:text-xs text-btred-logo font-bold">{tasks.length > 0 ? "Critical" : "No task data"}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium truncate">
                    {tasks.length === 0 ? "Create engagements to see deadlines" : "Critical statutory tasks"}
                  </p>
                  <span className="text-[10px] text-btred-logo font-bold mt-1.5 inline-flex items-center gap-1 group-hover:underline">
                    View Critical &rarr;
                  </span>
                </div>

                <div 
                  onClick={() => navigatePartnerTab("notices")}
                  className="bg-white border border-slate-200 hover:border-amber-400 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm cursor-pointer transition group"
                  title="Click to view Active Scrutiny Notices"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-amber-700 truncate">
                      Active Tax Notices
                    </span>
                    <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                      <ShieldAlert className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">{notices.length}</span>
                    <span className="text-[10px] sm:text-xs text-amber-700 font-bold">Cases</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium truncate">
                    ₹{(notices.reduce((acc, n) => acc + (n.demandAmount || 0), 0) / 100000).toFixed(2)}L demand risk
                  </p>
                  <span className="text-[10px] text-amber-700 font-bold mt-1.5 inline-flex items-center gap-1 group-hover:underline">
                    Drill down &rarr;
                  </span>
                </div>

                <div 
                  onClick={() => navigatePartnerTab("billing")}
                  className="bg-white border border-slate-200 hover:border-indigo-400 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm cursor-pointer transition group"
                  title="Click to view Fee Realization & Unbilled WIP"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-bold group-hover:text-indigo-700 truncate">
                      Billing &amp; Collections
                    </span>
                    <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                      <DollarSign className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-btred-logo" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">
                      ₹{(invoices.filter(i => i.status !== "PAID").reduce((acc, i) => acc + (i.amount || 0), 0) / 100000).toFixed(2)} L
                    </span>
                    <span className="text-[10px] sm:text-xs text-emerald-600 font-bold">Pending Collections</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium truncate">
                    ₹{(groups.reduce((acc, g) => acc + (g.unbilledWipTotal || 0), 0) / 100000).toFixed(2)}L Unbilled WIP
                  </p>
                  <span className="text-[10px] text-indigo-600 font-bold mt-1.5 inline-flex items-center gap-1 group-hover:underline">
                    Inspect WIP &rarr;
                  </span>
                </div>
              </div>

              {/* Mobile Partner Tab Select Bar (dropdown on mobile for fast navigation) */}
              <div className="block sm:hidden bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">Active Module:</span>
                  <select
                    value={activePartnerTab}
                    onChange={(e) => setActivePartnerTab(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 rounded-xl px-2.5 py-1.5 focus:outline-none"
                  >
                    {enabledPartnerTabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Desktop & Tablet Tabs Header with horizontal touch scroll */}
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none touch-pan-x">
                {enabledPartnerTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activePartnerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigatePartnerTab(tab.id)}
                      className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        isActive
                          ? tab.id === "batch-dispatch"
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-btblack text-white shadow-md"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${tab.iconColor}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Content */}
              {activePartnerTab === "batch-dispatch" && (
                <BatchOutwardDispatcher 
                  clients={clients.length > 0 ? clients : isDemoSandbox ? INITIAL_CLIENTS : []}
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
                  onTaskUpdate={updateTask}
                  onReminderDraft={recordReminderDraft}
                />
              )}

              {activePartnerTab === "documents" && (
                <FirmDocuments
                  clients={clients}
                  documents={documents}
                  onUpload={uploadDocument}
                  onReview={reviewDocument}
                />
              )}
          {activePartnerTab === "client-access" && <ClientAccessManager clients={clients} />}
          {activePartnerTab === "staff-access" && <StaffAccessManager />}
              {activePartnerTab === "activity" && <ActivityLog entries={auditTrail} onRefresh={refreshData} />}

              {activePartnerTab === "vcfo" && (
                <VirtualCfoCockpit />
              )}

              {activePartnerTab === "bank-parser" && (
                <BankStatementParser />
              )}

              {activePartnerTab === "entity-dna" && (
                <EntityDnaMatrixViewer />
              )}

              {activePartnerTab === "pay-to-release" && (
                <PayToReleaseManager
                  configs={(payConfigs.length > 0 ? payConfigs : isDemoSandbox ? INITIAL_PAY_TO_RELEASE_CONFIGS : []) as any}
                  clients={clients.length > 0 ? clients : isDemoSandbox ? INITIAL_CLIENTS : []}
                  invoices={invoices.length > 0 ? invoices : isDemoSandbox ? INITIAL_INVOICES : []}
                  firmUpiVpa={DEFAULT_FIRM_BRANDING.firmUpiVpa}
                  onRefreshData={refreshData}
                />
              )}

              {activePartnerTab === "whatsapp-ai" && (
                <WhatsAppAiWorkbench
                  clients={clients}
                  initialStatements={(isDemoSandbox ? INITIAL_PARSED_STATEMENTS : []) as any}
                  initialVaults={(isDemoSandbox ? INITIAL_PASSWORD_VAULTS : []) as any}
                  onTaskUpdated={refreshData}
                />
              )}

              {activePartnerTab === "gstr2b" && (
                <Gstr2bReconciler />
              )}

              {activePartnerTab === "notices" && <NoticeRegister clients={clients} onRefresh={refreshData} />}
              {activePartnerTab === "pilot" && <PilotScorecard />}

              {activePartnerTab === "peer-review" && (
                <PeerReviewManager
                  clients={clients}
                  initialMsmeRecords={(isDemoSandbox ? INITIAL_MSME_43BH_RECORDS : []) as any}
                  initialSection40a={(isDemoSandbox ? INITIAL_SECTION_40A2B_SAMPLES : []) as any}
                />
              )}

              {activePartnerTab === "anti-poaching" && (
                <EnterpriseSecurityAndRealization
                  partnerMetrics={(isDemoSandbox ? INITIAL_PARTNER_METRICS : []) as any}
                  securityLogs={(isDemoSandbox ? INITIAL_STAFF_SECURITY_LOGS : []) as any}
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

          {/* VIEW 3: ARTICLE WORKBENCH (FOR ARTICLE TRAINEES) */}
          {currentView === "article" && <ArticleWorkbench />}
        </main>

        {/* Floating Bottom Navigation */}
        <FloatingBottomNav
          currentView={currentView}
          activeTab={currentView === "client-pwa" ? activeClientTab : activePartnerTab}
          onTabChange={handleTabChange}
          onQuickAction={() => {
            if (currentView === "client-pwa") {
              setIsClientQuickActionOpen(true);
            } else {
              setIsFirmHubOpen(true);
            }
          }}
          restrictedPartnerMode={process.env.NODE_ENV === "production" && currentUser.role === "PARTNER"}
        />

        {/* Firm Action Hub Modal */}
        <FirmHubActionModal
          isOpen={isFirmHubOpen}
          onClose={() => setIsFirmHubOpen(false)}
          onOpenClientMaster={() => setIsClientMasterOpen(true)}
          onOpenNewTask={() => navigatePartnerTab("calendar")}
          onNavigateTab={navigatePartnerTab}
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
        />
      </div>
    </ErrorBoundary>
  );
}
