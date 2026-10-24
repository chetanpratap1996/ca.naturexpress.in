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
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { FloatingInstallBanner } from "@/components/shared/FloatingInstallBanner";
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
  UserCheck
} from "lucide-react";

export default function AdminPage() {
  const {
    tasks,
    invoices,
    notices,
    dscTokens,
    clients,
    payConfigs,
    refreshData,
    updateTask,
    createTask,
    reconcileInvoice
  } = useTaxoData();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(DEMO_USERS.partner);
  const [currentView, setCurrentView] = useState<"partner" | "article" | "client-pwa">("partner");
  const [activePartnerTab, setActivePartnerTab] = useState<string>("calendar");

  const handleTaskStatusChange = async (taskId: string, newStatus: WorkflowStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleTabChange = (tab: string) => {
    setActivePartnerTab(tab);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  const handleSwitchUserRole = (role: "partner" | "article" | "client") => {
    const targetUser = DEMO_USERS[role];
    setActiveSession(targetUser);
    setCurrentUser(targetUser);
    if (role === "partner") setCurrentView("partner");
    else if (role === "article") setCurrentView("article");
    else setCurrentView("client-pwa");
  };

  return (
    <ErrorBoundary fallbackTitle="CA Firm Administration Cockpit">
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
        {/* Unmissable Global 1-Tap App Install Banner */}
        <FloatingInstallBanner />

        {/* Admin Header Strip */}
        <div className="bg-slate-950 text-slate-200 text-xs px-4 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-bold text-white tracking-wide">
              {DEFAULT_FIRM_BRANDING.firmName} &bull; Practice Desk
            </span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400 font-mono text-[11px]">FRN: {DEFAULT_FIRM_BRANDING.frn}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* View switcher between Partner and Article desk */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setCurrentView("partner")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  currentView === "partner" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Partner Dashboard
              </button>
              <button
                onClick={() => setCurrentView("article")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  currentView === "article" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Staff Workspace
              </button>
            </div>

            <Link
              href="/"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Client Portal</span>
            </Link>
          </div>
        </div>

        {/* Top Navigation */}
        <TopNav 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onNavigateTab={(tab) => setActivePartnerTab(tab)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUserRole}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-6 pb-28 md:pb-20">
          {currentView === "partner" && (
            <div className="space-y-6">
              {/* Top KPI Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      On-Time Filing Rate
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{FIRM_METRICS.complianceHealthScore}%</span>
                    <span className="text-xs text-emerald-600 font-bold">+2.4% vs last month</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">{FIRM_METRICS.totalClients} Clients &bull; {FIRM_METRICS.activeEntities} Active Entities</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      Due in 72 Hours
                    </span>
                    <div className="p-2 rounded-xl bg-red-50 text-btred-logo border border-red-200">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-btred-logo">{FIRM_METRICS.criticalDeadlinesNext72h}</span>
                    <span className="text-xs text-btred-logo font-bold">Due Soon</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">GSTR-3B &amp; Form 3CD Tax Audits</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      Active Tax Notices
                    </span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{FIRM_METRICS.openScrutinyNotices}</span>
                    <span className="text-xs text-amber-700 font-bold">Active Cases</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">₹48.9L tax demand risk under defense</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      Billing &amp; Collections
                    </span>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                      <DollarSign className="w-4 h-4 text-btred-logo" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">₹63.0 L</span>
                    <span className="text-xs text-emerald-600 font-bold">Direct NEFT/UPI</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Direct Bank &amp; UPI Transfer</p>
                </div>
              </div>

              {/* Desktop Tabs Header */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActivePartnerTab("calendar")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "calendar"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-btred-logo" />
                  Tax Deadlines ({tasks.length})
                </button>

                <button
                  onClick={() => setActivePartnerTab("pay-to-release")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "pay-to-release"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Fee Release
                </button>

                <button
                  onClick={() => setActivePartnerTab("whatsapp-ai")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "whatsapp-ai"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  WhatsApp Helpdesk
                </button>

                <button
                  onClick={() => setActivePartnerTab("gstr2b")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "gstr2b"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                  GST Matcher (2B)
                </button>

                <button
                  onClick={() => setActivePartnerTab("notices")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "notices"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-btred-logo" />
                  Tax Notices
                </button>

                <button
                  onClick={() => setActivePartnerTab("peer-review")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "peer-review"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  Audit Quality
                </button>

                <button
                  onClick={() => setActivePartnerTab("anti-poaching")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "anti-poaching"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5 text-rose-400" />
                  Firm Insights
                </button>

                <button
                  onClick={() => setActivePartnerTab("billing")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "billing"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-btred-logo" />
                  Billing &amp; Invoices
                </button>

                <button
                  onClick={() => setActivePartnerTab("dsc")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "dsc"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-btred-logo" />
                  Digital Signatures (DSC)
                </button>

                <button
                  onClick={() => setActivePartnerTab("inward-outward")}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                    activePartnerTab === "inward-outward"
                      ? "bg-btblack text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  Dispatches &amp; Letters
                </button>
              </div>

              {/* Active Content */}
              {activePartnerTab === "calendar" && (
                <StatutoryCalendar 
                  tasks={tasks} 
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
                  notices={notices.length > 0 ? notices : INITIAL_NOTICES} 
                  onNoticeUpdated={refreshData}
                />
              )}

              {activePartnerTab === "peer-review" && (
                <PeerReviewManager
                  clients={clients.length > 0 ? clients : INITIAL_CLIENTS}
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
                  invoices={invoices.length > 0 ? invoices : INITIAL_INVOICES} 
                  onRefresh={refreshData}
                />
              )}

              {activePartnerTab === "dsc" && (
                <DscVault tokens={dscTokens.length > 0 ? dscTokens : INITIAL_DSC_TOKENS} />
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
          onQuickAction={() => setActivePartnerTab("calendar")}
        />
      </div>
    </ErrorBoundary>
  );
}
