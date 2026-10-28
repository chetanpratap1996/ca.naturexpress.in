"use client";

import React, { useState } from "react";
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
import { LoginModal } from "@/components/auth/LoginModal";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { toast } from "@/components/shared/ToastNotification";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { 
  AuthUser, 
  DEMO_USERS,
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
  Sparkles
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
    updateTask,
    createTask,
    reconcileInvoice
  } = useTaxoData();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(DEMO_USERS.partner);
  const [currentView, setCurrentView] = useState<"partner" | "article" | "client-pwa">("partner");
  const [activePartnerTab, setActivePartnerTab] = useState<string>("calendar");
  const [isClientMasterOpen, setIsClientMasterOpen] = useState(false);
  const [isFirmHubOpen, setIsFirmHubOpen] = useState(false);

  const handleTaskStatusChange = async (taskId: string, newStatus: WorkflowStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleTabChange = (tab: string) => {
    setActivePartnerTab(tab);
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
    { id: "pay-to-release", label: "Fee Release", icon: Lock, iconColor: "text-emerald-400" },
    { id: "whatsapp-ai", label: "WhatsApp Helpdesk", icon: MessageSquare, iconColor: "text-teal-400" },
    { id: "gstr2b", label: "GST Matcher (2B)", icon: FileSpreadsheet, iconColor: "text-blue-500" },
    { id: "notices", label: "Tax Notices", icon: ShieldAlert, iconColor: "text-btred-logo" },
    { id: "peer-review", label: "Audit Quality", icon: Award, iconColor: "text-indigo-400" },
    { id: "anti-poaching", label: "Firm Insights", icon: Fingerprint, iconColor: "text-rose-400" },
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
        {/* Master Navigation Cockpit */}
        <TopNav 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onNavigateTab={(tab) => setActivePartnerTab(tab)}
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
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 pb-28 md:pb-20">
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
                      On-Time Filing Rate
                    </span>
                    <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                      <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">
                      {tasks.length > 0 ? `${Math.round((tasks.filter(t => t.status === 'FILED_AND_COMPLETED').length / tasks.length) * 100)}%` : "100%"}
                    </span>
                    <span className="text-[10px] sm:text-xs text-emerald-600 font-bold">Compliant</span>
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
                      {tasks.filter(t => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED").length}
                    </span>
                    <span className="text-[10px] sm:text-xs text-btred-logo font-bold">Critical</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium truncate">
                    {tasks.length === 0 ? "No pending returns" : "Statutory Returns"}
                  </p>
                  <span className="text-[10px] text-btred-logo font-bold mt-1.5 inline-flex items-center gap-1 group-hover:underline">
                    View Critical &rarr;
                  </span>
                </div>

                <div 
                  onClick={() => setActivePartnerTab("notices")}
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
                  onClick={() => setActivePartnerTab("billing")}
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

              {/* Mobile Partner Tab Select Bar (dropdown on mobile) */}
              <div className="block sm:hidden bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">Active Module:</span>
                  <select
                    value={activePartnerTab}
                    onChange={(e) => setActivePartnerTab(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 rounded-xl px-2.5 py-1.5 focus:outline-none"
                  >
                    {partnerTabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Desktop Tabs Header */}
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none touch-pan-x">
                {partnerTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activePartnerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePartnerTab(tab.id)}
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

        {/* Floating Bottom Navigation */}
        <FloatingBottomNav
          currentView={currentView}
          activeTab={activePartnerTab}
          onTabChange={handleTabChange}
          onQuickAction={() => setIsFirmHubOpen(true)}
        />

        {/* Firm Action Hub Modal */}
        <FirmHubActionModal
          isOpen={isFirmHubOpen}
          onClose={() => setIsFirmHubOpen(false)}
          onOpenClientMaster={() => setIsClientMasterOpen(true)}
          onOpenNewTask={() => setActivePartnerTab("calendar")}
          onNavigateTab={(tab) => setActivePartnerTab(tab)}
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
