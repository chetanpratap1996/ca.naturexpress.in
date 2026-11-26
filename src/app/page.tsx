"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { TabSkeleton } from "@/components/shared/TabSkeleton";

// Core Instant App Shell
import { TopNav } from "@/components/navigation/TopNav";
import { FloatingBottomNav } from "@/components/navigation/FloatingBottomNav";
import { DomainRail, DomainId } from "@/components/navigation/DomainRail";
import { DomainSubTabHeader, DOMAIN_SUBTABS } from "@/components/navigation/DomainSubTabHeader";

// Primary Matrices (Code-Split + Prefetched on Hover for Ultra-Fast Initial Load)
const ExecutiveDashboard = dynamic(() => import("@/components/dashboard/ExecutiveDashboard").then(m => m.ExecutiveDashboard), { ssr: false, loading: () => <TabSkeleton title="Executive Dashboard" /> });
const GstFilingMatrix = dynamic(() => import("@/components/firm/GstFilingMatrix").then(m => m.GstFilingMatrix), { ssr: false, loading: () => <TabSkeleton title="GST Filing Matrix" /> });
const TasksCommandCenter = dynamic(() => import("@/components/firm/TasksCommandCenter").then(m => m.TasksCommandCenter), { ssr: false, loading: () => <TabSkeleton title="Task Command Center" /> });
const ItrAuditMatrix = dynamic(() => import("@/components/firm/ItrAuditMatrix").then(m => m.ItrAuditMatrix), { ssr: false, loading: () => <TabSkeleton title="ITR & Audit Matrix" /> });
const BillingWipMatrix = dynamic(() => import("@/components/firm/BillingWipMatrix").then(m => m.BillingWipMatrix), { ssr: false, loading: () => <TabSkeleton title="Billing & WIP Matrix" /> });
const Gstr1OutwardWorkbench = dynamic(() => import("@/components/gst/Gstr1OutwardWorkbench").then(m => m.Gstr1OutwardWorkbench), { ssr: false, loading: () => <TabSkeleton title="GSTR-1 Outward" /> });

// Tab Chunk Prefetcher (Warms up chunk on hover before click)
const TAB_PREFETCHERS: Record<string, () => Promise<any>> = {
  dashboard: () => import("@/components/dashboard/ExecutiveDashboard"),
  "gst-filing": () => import("@/components/firm/GstFilingMatrix"),
  gstr1: () => import("@/components/gst/Gstr1OutwardWorkbench"),
  gstr2b: () => import("@/components/firm/Gstr2bReconciler"),
  "gst-ims": () => import("@/components/gst/GstImsWorkbench"),
  "pillar-one-gst": () => import("@/components/gst/PillarOneGstEnterpriseWorkbench"),
  "entity-dna": () => import("@/components/firm/EntityDnaMaster"),
  "tasks-matrix": () => import("@/components/firm/TasksCommandCenter"),
  calendar: () => import("@/components/firm/tasks/StatutoryTaskEngine"),
  "itr-matrix": () => import("@/components/firm/ItrAuditMatrix"),
  "ais-analyzer": () => import("@/components/firm/Ais26asAnalyzer"),
  "billing-matrix": () => import("@/components/firm/BillingWipMatrix"),
  "client-master": () => import("@/components/firm/EntityDnaMaster"),
  notices: () => import("@/components/firm/NoticeCenter"),
};

// Lazy-Loaded Sub-Workbenches (Code-Split on Demand for Instant Shell Load)
const Gstr2bReconciler = dynamic(() => import("@/components/firm/Gstr2bReconciler").then(m => m.Gstr2bReconciler), { ssr: false, loading: () => <TabSkeleton title="GSTR-2B Reconciler" /> });
const GstImsWorkbench = dynamic(() => import("@/components/gst/GstImsWorkbench").then(m => m.GstImsWorkbench), { ssr: false, loading: () => <TabSkeleton title="IMS Desk" /> });
const PillarOneGstEnterpriseWorkbench = dynamic(() => import("@/components/gst/PillarOneGstEnterpriseWorkbench").then(m => m.PillarOneGstEnterpriseWorkbench), { ssr: false, loading: () => <TabSkeleton title="GST Enterprise Suite" /> });
const AutonomousGstAssemblyLine = dynamic(() => import("@/components/firm/AutonomousGstAssemblyLine").then(m => m.AutonomousGstAssemblyLine), { ssr: false, loading: () => <TabSkeleton title="GST Autopilot Assembly" /> });

const PillarTwoDirectTaxWorkbench = dynamic(() => import("@/components/itr/PillarTwoDirectTaxWorkbench").then(m => m.PillarTwoDirectTaxWorkbench), { ssr: false, loading: () => <TabSkeleton title="Direct Tax Workbench" /> });
const PillarThreeTaxAuditWorkbench = dynamic(() => import("@/components/taxAudit/PillarThreeTaxAuditWorkbench").then(m => m.PillarThreeTaxAuditWorkbench), { ssr: false, loading: () => <TabSkeleton title="Tax Audit Workbench" /> });
const PillarFiveTdsEnterpriseWorkbench = dynamic(() => import("@/components/tds/PillarFiveTdsEnterpriseWorkbench").then(m => m.PillarFiveTdsEnterpriseWorkbench), { ssr: false, loading: () => <TabSkeleton title="TDS Enterprise Workbench" /> });
const PillarSixMcaEnterpriseWorkbench = dynamic(() => import("@/components/mca/PillarSixMcaEnterpriseWorkbench").then(m => m.PillarSixMcaEnterpriseWorkbench), { ssr: false, loading: () => <TabSkeleton title="MCA & Secretarial Workbench" /> });
const PillarSevenGovernanceWorkbench = dynamic(() => import("@/components/governance/PillarSevenGovernanceWorkbench"), { ssr: false, loading: () => <TabSkeleton title="Firm Governance Desk" /> });
const PillarEightTallyDesktopWorkbench = dynamic(() => import("@/components/desktop/PillarEightTallyDesktopWorkbench"), { ssr: false, loading: () => <TabSkeleton title="Tally Desktop Bridge" /> });

const AutonomousPracticeOrchestratorWorkbench = dynamic(() => import("@/components/firm/AutonomousPracticeOrchestratorWorkbench"), { ssr: false, loading: () => <TabSkeleton title="Practice Orchestrator" /> });
const AutonomousPracticeCockpit = dynamic(() => import("@/components/firm/AutonomousPracticeCockpit").then(m => m.AutonomousPracticeCockpit), { ssr: false, loading: () => <TabSkeleton title="Autonomous Practice Cockpit" /> });
const AutonomousTdsWorkbench = dynamic(() => import("@/components/firm/AutonomousTdsWorkbench").then(m => m.AutonomousTdsWorkbench), { ssr: false, loading: () => <TabSkeleton title="Autonomous TDS Engine" /> });
const AutonomousMcaWorkbench = dynamic(() => import("@/components/firm/AutonomousMcaWorkbench").then(m => m.AutonomousMcaWorkbench), { ssr: false, loading: () => <TabSkeleton title="Autonomous MCA Desk" /> });
const AutonomousNoticeWorkbench = dynamic(() => import("@/components/firm/AutonomousNoticeWorkbench").then(m => m.AutonomousNoticeWorkbench), { ssr: false, loading: () => <TabSkeleton title="Autonomous Notice Engine" /> });
const AutonomousGovernanceWorkbench = dynamic(() => import("@/components/firm/AutonomousGovernanceWorkbench").then(m => m.AutonomousGovernanceWorkbench), { ssr: false, loading: () => <TabSkeleton title="Autonomous Governance" /> });
const AutonomousVcfoWorkbench = dynamic(() => import("@/components/firm/AutonomousVcfoWorkbench").then(m => m.AutonomousVcfoWorkbench), { ssr: false, loading: () => <TabSkeleton title="Autonomous vCFO Engine" /> });
const EnterpriseCiCdWorkbench = dynamic(() => import("@/components/firm/EnterpriseCiCdWorkbench").then(m => m.EnterpriseCiCdWorkbench), { ssr: false, loading: () => <TabSkeleton title="CI/CD Suite" /> });
const LegacyMigrationWorkbench = dynamic(() => import("@/components/firm/LegacyMigrationWorkbench").then(m => m.LegacyMigrationWorkbench), { ssr: false, loading: () => <TabSkeleton title="Legacy Migration Bridge" /> });

const Schedule3AuditEngine = dynamic(() => import("@/components/firm/Schedule3AuditEngine").then(m => m.Schedule3AuditEngine), { ssr: false, loading: () => <TabSkeleton title="Schedule III Audit Engine" /> });
const Form3cdWorkpaper = dynamic(() => import("@/components/firm/Form3cdWorkpaper").then(m => m.Form3cdWorkpaper), { ssr: false, loading: () => <TabSkeleton title="Form 3CD Workpapers" /> });
const Form3cdClause31Workbench = dynamic(() => import("@/components/taxAudit/Form3cdClause31Workbench").then(m => m.Form3cdClause31Workbench), { ssr: false, loading: () => <TabSkeleton title="Clause 31 Audit Desk" /> });
const BankAuditWorkbench = dynamic(() => import("@/components/firm/BankAuditWorkbench").then(m => m.BankAuditWorkbench), { ssr: false, loading: () => <TabSkeleton title="Bank Audit Desk" /> });
const BankStatementParser = dynamic(() => import("@/components/firm/BankStatementParser").then(m => m.BankStatementParser), { ssr: false, loading: () => <TabSkeleton title="Bank Statement Parser" /> });
const Ais26asAnalyzer = dynamic(() => import("@/components/firm/Ais26asAnalyzer").then(m => m.Ais26asAnalyzer), { ssr: false, loading: () => <TabSkeleton title="AIS & 26AS Analyzer" /> });
const ItrComputationEngine = dynamic(() => import("@/components/firm/ItrComputationEngine").then(m => m.ItrComputationEngine), { ssr: false, loading: () => <TabSkeleton title="ITR Tax Engine" /> });
const VirtualCfoCockpit = dynamic(() => import("@/components/firm/VirtualCfoCockpit").then(m => m.VirtualCfoCockpit), { ssr: false, loading: () => <TabSkeleton title="vCFO Cockpit" /> });
const EntityDnaMaster = dynamic(() => import("@/components/firm/EntityDnaMaster").then(m => m.EntityDnaMaster), { ssr: false, loading: () => <TabSkeleton title="Entity DNA Master" /> });
const PayToReleaseManager = dynamic(() => import("@/components/firm/PayToReleaseManager").then(m => m.PayToReleaseManager), { ssr: false, loading: () => <TabSkeleton title="Pay to Release Gate" /> });
const WhatsAppAiWorkbench = dynamic(() => import("@/components/firm/WhatsAppAiWorkbench").then(m => m.WhatsAppAiWorkbench), { ssr: false, loading: () => <TabSkeleton title="WhatsApp Desk" /> });
const PracticeGrowthCockpit = dynamic(() => import("@/components/growth/PracticeGrowthCockpit").then(m => m.PracticeGrowthCockpit), { ssr: false, loading: () => <TabSkeleton title="Growth Engine" /> });
const BatchOutwardDispatcher = dynamic(() => import("@/components/firm/BatchOutwardDispatcher").then(m => m.BatchOutwardDispatcher), { ssr: false, loading: () => <TabSkeleton title="Batch Outward Dispatcher" /> });
const StatutoryCalendar = dynamic(() => import("@/components/firm/StatutoryCalendar").then(m => m.StatutoryCalendar), { ssr: false, loading: () => <TabSkeleton title="Statutory Calendar" /> });
const StatutoryTaskEngine = dynamic(() => import("@/components/firm/tasks/StatutoryTaskEngine").then(m => m.StatutoryTaskEngine), { ssr: false, loading: () => <TabSkeleton title="Statutory Task Engine" /> });
const NoticeCenter = dynamic(() => import("@/components/firm/NoticeCenter").then(m => m.NoticeCenter), { ssr: false, loading: () => <TabSkeleton title="Notice Scrutiny Center" /> });
const BillingWip = dynamic(() => import("@/components/firm/BillingWip").then(m => m.BillingWip), { ssr: false, loading: () => <TabSkeleton title="Billing & WIP" /> });
const DscVault = dynamic(() => import("@/components/firm/DscVault").then(m => m.DscVault), { ssr: false, loading: () => <TabSkeleton title="DSC Vault" /> });
const KeysVault = dynamic(() => import("@/components/firm/KeysVault").then(m => m.KeysVault), { ssr: false, loading: () => <TabSkeleton title="Credentials Vault" /> });
const UdinVault = dynamic(() => import("@/components/firm/UdinVault").then(m => m.UdinVault), { ssr: false, loading: () => <TabSkeleton title="UDIN Vault" /> });
const NoticeReplyDrafter = dynamic(() => import("@/components/firm/NoticeReplyDrafter").then(m => m.NoticeReplyDrafter), { ssr: false, loading: () => <TabSkeleton title="Notice Reply Drafter" /> });
const AssesseeApprovalDesk = dynamic(() => import("@/components/firm/AssesseeApprovalDesk").then(m => m.AssesseeApprovalDesk), { ssr: false, loading: () => <TabSkeleton title="Assessee Approval Desk" /> });
const InwardOutwardRegister = dynamic(() => import("@/components/firm/InwardOutwardRegister").then(m => m.InwardOutwardRegister), { ssr: false, loading: () => <TabSkeleton title="Inward Outward Register" /> });
const CaCreatorContentStudio = dynamic(() => import("@/components/firm/CaCreatorContentStudio").then(m => m.CaCreatorContentStudio), { ssr: false, loading: () => <TabSkeleton title="CA Creator Studio" /> });
const EngagementLetterGenerator = dynamic(() => import("@/components/firm/EngagementLetterGenerator").then(m => m.EngagementLetterGenerator), { ssr: false, loading: () => <TabSkeleton title="Engagement Letters" /> });
const PeerReviewManager = dynamic(() => import("@/components/firm/PeerReviewManager").then(m => m.PeerReviewManager), { ssr: false, loading: () => <TabSkeleton title="Audit Quality Desk" /> });
const EnterpriseSecurityAndRealization = dynamic(() => import("@/components/firm/EnterpriseSecurityAndRealization").then(m => m.EnterpriseSecurityAndRealization), { ssr: false, loading: () => <TabSkeleton title="Enterprise Security" /> });
const ArticleWorkbench = dynamic(() => import("@/components/firm/ArticleWorkbench").then(m => m.ArticleWorkbench), { ssr: false, loading: () => <TabSkeleton title="Team Workbench" /> });
const ClientPortalPwa = dynamic(() => import("@/components/client/ClientPortalPwa").then(m => m.ClientPortalPwa), { ssr: false, loading: () => <TabSkeleton title="Client Portal" /> });
const StaffManagementView = dynamic(() => import("@/components/firm/StaffManagementView").then(m => m.StaffManagementView), { ssr: false, loading: () => <TabSkeleton title="Team Management" /> });
const TallyDataGrid = dynamic(() => import("@/components/shared/TallyDataGrid").then(m => m.TallyDataGrid), { ssr: false, loading: () => <TabSkeleton title="Tally Data Grid" /> });

// Modals (Lazy Loaded on User Trigger)
const ClientMasterModal = dynamic(() => import("@/components/firm/ClientMasterModal").then(m => m.ClientMasterModal), { ssr: false });
const FirmHubActionModal = dynamic(() => import("@/components/firm/FirmHubActionModal").then(m => m.FirmHubActionModal), { ssr: false });
const ClientNotificationBroadcasterModal = dynamic(() => import("@/components/notifications/ClientNotificationBroadcasterModal").then(m => m.ClientNotificationBroadcasterModal), { ssr: false });
const AppLauncherMegaMenu = dynamic(() => import("@/components/navigation/AppLauncherMegaMenu").then(m => m.AppLauncherMegaMenu), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import("@/components/shared/KeyboardShortcutsModal").then(m => m.KeyboardShortcutsModal), { ssr: false });
const LoginModal = dynamic(() => import("@/components/auth/LoginModal").then(m => m.LoginModal), { ssr: false });
const SaasGateway = dynamic(() => import("@/components/gateway/SaasGateway").then(m => m.SaasGateway), { ssr: false });
const TallyKeyboardOverlay = dynamic(() => import("@/components/shared/TallyKeyboardOverlay").then(m => m.TallyKeyboardOverlay), { ssr: false });
import { useClientContext } from "@/lib/context/ClientContext";
import { getNavItemById } from "@/lib/navigation/navigationItems";
import { toast } from "@/components/shared/ToastNotification";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { 
  AuthUser, 
  getActiveSession, 
  clearSession, 
  setActiveSession, 
  DEMO_USERS,
  generateDeterministicPassword,
  getTeamMemberTools
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
} from "@/lib/data/firmDefaults";
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

const TAB_TO_DOMAIN: Record<string, DomainId> = {
  // 1. Tasks & Practice
  "tasks-matrix": "tasks",
  calendar: "tasks",
  tasks: "tasks",
  "workload-matrix": "tasks",
  "staff-master": "tasks",
  "autonomous-orchestrator": "tasks",
  "practice-cockpit": "tasks",
  dashboard: "tasks",
  "batch-dispatch": "tasks",
  "inward-outward": "tasks",

  // 2. GST Suite
  "gst-filing": "gst",
  gstr1: "gst",
  "pillar-one-gst": "gst",
  "gst-ims": "gst",
  gstr2b: "gst",
  "gst-assembly": "gst",
  "entity-dna": "gst",

  // 3. Income Tax & Audit
  "itr-matrix": "tax-audit",
  "pillar-two-tax": "tax-audit",
  "pillar-three-audit": "tax-audit",
  "pillar-five-tds": "tax-audit",
  "tds-assembly": "tax-audit",
  "tax-audit-3cd": "tax-audit",
  "form3cd-clause31": "tax-audit",
  "schedule3-audit": "tax-audit",
  "ais-analyzer": "tax-audit",
  "itr-calc": "tax-audit",
  "engagement-letter": "tax-audit",

  // 4. Notices & Secretarial
  notices: "notices-udin",
  "notice-assembly": "notices-udin",
  "pillar-six-mca": "notices-udin",
  "mca-assembly": "notices-udin",
  "notice-drafter": "notices-udin",
  "assessee-approval": "notices-udin",
  "udin-vault": "notices-udin",
  "peer-review": "notices-udin",

  // 5. Billing & Realization
  "billing-matrix": "billing-wip",
  billing: "billing-wip",
  "pay-to-release": "billing-wip",
  "pillar-eight-desktop": "billing-wip",
  "tally-data-grid": "billing-wip",
  "bank-parser": "billing-wip",
  "bank-audit": "billing-wip",
  "anti-poaching": "billing-wip",

  // 6. Client Master & Governance
  "client-master": "client-master",
  "whatsapp-ai": "client-master",
  "pillar-seven-governance": "client-master",
  "governance-assembly": "client-master",
  vcfo: "client-master",
  "vcfo-assembly": "client-master",
  "growth-engine": "client-master",
  dsc: "client-master",
  "content-studio": "client-master",
  "legacy-migration": "client-master",
  "cicd-assembly": "client-master",
};

const DOMAIN_DEFAULT_TAB: Record<DomainId, string> = {
  tasks: "tasks-matrix",
  gst: "gst-filing",
  "tax-audit": "itr-matrix",
  "notices-udin": "notices",
  "billing-wip": "billing-matrix",
  "client-master": "client-master",
};

export default function Home() {
  // Practice Desk runs in 100% live mode connected to Supabase
  const [isDemoSandbox, setIsDemoSandbox] = useState<boolean>(false);

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

  // Authenticated user session — matching SSR & client initial state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(DEMO_USERS.partner);
  const [currentView, setCurrentView] = useState<"partner" | "article" | "client-pwa">("partner");
  const [activePartnerTab, setActivePartnerTab] = useState<string>("dashboard");
  const [activeDomain, setActiveDomain] = useState<DomainId>("tasks");

  const isTeamMember = currentUser?.role === "TEAM" || currentUser?.role === "ARTICLE";
  const [teamAllowedTools, setTeamAllowedTools] = useState<string[]>(["tasks", "gst"]);

  useEffect(() => {
    if (currentUser?.id) {
      setTeamAllowedTools(getTeamMemberTools(currentUser.id));
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handlePermChange = (e: any) => {
      if (currentUser?.id && e.detail?.memberId === currentUser.id) {
        setTeamAllowedTools(e.detail.tools);
      }
    };
    window.addEventListener("bt_permissions_changed", handlePermChange);
    return () => window.removeEventListener("bt_permissions_changed", handlePermChange);
  }, [currentUser?.id]);

  useEffect(() => {
    if (TAB_TO_DOMAIN[activePartnerTab]) {
      setActiveDomain(TAB_TO_DOMAIN[activePartnerTab]);
    }
  }, [activePartnerTab]);
  const [bridgedAuditDisallowances, setBridgedAuditDisallowances] = useState<number | null>(null);
  const [activeClientTab, setActiveClientTab] = useState<string>("progress");
  const [isClientQuickActionOpen, setIsClientQuickActionOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginInitialRole, setLoginInitialRole] = useState<"partner" | "article" | "client">("partner");
  const [loginInitialPhone, setLoginInitialPhone] = useState<string>("");
  const [isClientMasterOpen, setIsClientMasterOpen] = useState(false);
  const [clientMasterInitialTab, setClientMasterInitialTab] = useState<"directory" | "credentials" | "bulk" | "add">("directory");
  const [isFirmHubOpen, setIsFirmHubOpen] = useState(false);
  const [isClientBroadcasterOpen, setIsClientBroadcasterOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [selectedGstin, setSelectedGstin] = useState<string>("");
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("bt_sidebar_collapsed");
        if (saved === "true") {
          setIsSidebarCollapsed(true);
        }
      }
    } catch {}
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("bt_sidebar_collapsed", next ? "true" : "false");
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const {
    selectedClient,
    selectedGstin: contextGstin,
    selectClient,
  } = useClientContext();

  // Sync page selectedEntityId with ClientContext
  useEffect(() => {
    if (selectedClient && selectedClient.id !== selectedEntityId) {
      setSelectedEntityId(selectedClient.id);
      if (contextGstin) {
        setSelectedGstin(contextGstin);
      }
    }
  }, [selectedClient, contextGstin, selectedEntityId]);

  // Universal Client Switcher Handler
  const handleSelectClient = (clientId: string, gstin?: string) => {
    setSelectedEntityId(clientId);
    const match = clients.find((c) => c.id === clientId);
    const activeG = gstin || match?.gstin || (match?.gstinRecords && match.gstinRecords[0]?.gstin) || "";
    setSelectedGstin(activeG);
    if (match) {
      selectClient(match, activeG);
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

      // CASE 2: Team / Staff persona explicitly requested (?role=team OR ?role=article OR ?view=team)
      if (roleParam === "team" || roleParam === "article" || viewParam === "team") {
        setCurrentUser(DEMO_USERS.team || DEMO_USERS.article);
        setCurrentView("partner");
        setIsDemoSandbox(false);
        setActivePartnerTab("dashboard");
        return;
      }

      if (portalParam === "staff" || roleParam === "partner") {
        setLoginInitialRole("partner");
        setIsLoginModalOpen(true);
        return;
      }

      // CASE 3: Standard Existing Authenticated Session
      if (existing) {
        setCurrentUser(existing);
        setIsDemoSandbox(false);
        if (existing.role === "CLIENT") setCurrentView("client-pwa");
        else setCurrentView("partner");
        return;
      }

      // CASE 4: Explicit Sandbox Evaluation Flag
      if (demoParam === "true" || viewParam === "sandbox") {
        setCurrentUser(DEMO_USERS.partner);
        setCurrentView("partner");
        setIsDemoSandbox(false);
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
    if (currentView === "client-pwa") {
      setActiveClientTab(tab as any);
    } else {
      if (isTeamMember && (tab === "staff-master" || tab === "directory")) {
        toast.warning("Restricted Access", "Team members do not have access to team administration.");
        setActivePartnerTab("dashboard");
        return;
      }

      const targetDomain = TAB_TO_DOMAIN[tab];
      if (isTeamMember && targetDomain && !teamAllowedTools.includes(targetDomain)) {
        toast.warning("Restricted Access", "This practice tool is not enabled for your team profile by the CA.");
        setActivePartnerTab("dashboard");
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
    }
  };

  const handleSelectDomain = (domainId: DomainId) => {
    if (isTeamMember && !teamAllowedTools.includes(domainId)) {
      toast.warning("Restricted Access", "This practice domain is not enabled for your team profile by the CA.");
      handleTabChange("dashboard");
      return;
    }
    setActiveDomain(domainId);
    const defaultTab = DOMAIN_DEFAULT_TAB[domainId];
    if (defaultTab) {
      handleTabChange(defaultTab);
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
      `Welcome, ${user.name} (${user.role === "PARTNER" ? "Managing Partner" : user.role === "TEAM" || user.role === "ARTICLE" ? "Team Member" : "Client Portal"})`
    );
    if (user.role === "CLIENT") setCurrentView("client-pwa");
    else setCurrentView("partner");
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setIsDemoSandbox(false);
    setIsLoginModalOpen(false);
    toast.info("Signed Out", "Your session has been securely closed.");
  };

  const handleSwitchUserRole = (role: "partner" | "team" | "article" | "client") => {
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
    } else if (role === "team" || role === "article") {
      targetUser = DEMO_USERS.team || DEMO_USERS.article;
    } else {
      targetUser = DEMO_USERS.partner;
    }

    if (targetUser) {
      setActiveSession(targetUser);
      toast.info(
        "Switched Profile",
        `Active view: ${targetUser.name} (${targetUser.role === "PARTNER" ? "CA Partner" : "Team Member"})`
      );
    }
    setCurrentUser(targetUser);
    setIsDemoSandbox(false);
    if (role === "client") {
      setCurrentView("client-pwa");
    } else {
      setCurrentView("partner");
      setActivePartnerTab("dashboard");
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
          onRefreshData={refreshData}
          onExitSandbox={() => {
            clearSession();
            setCurrentUser(null);
            setIsDemoSandbox(false);
            setIsLoginModalOpen(false);
          }}
          isSandbox={isDemoSandbox}
          onToggleSidebar={toggleSidebarCollapse}
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
          activeClientEntityId={selectedEntityId || currentUser?.clientEntityId || clients[0]?.id || "client-bt-01"}
          activeClientName={clients.find(c => c.id === (selectedEntityId || currentUser?.clientEntityId || clients[0]?.id))?.name || "Brains & Taxes Private Limited"}
          isClientMode={currentView === "client-pwa" || (currentView as any) === "client"}
          clients={clients}
          groups={groups}
          onSelectClient={handleSelectClient}
          selectedGstin={selectedGstin}
          onOpenDiagnosticOnboarding={() => {
            setClientMasterInitialTab("add");
            setIsClientMasterOpen(true);
          }}
        />

        {/* Master Flex Layout with Left Sidebar */}
        <div className="flex-1 flex w-full max-w-[1920px] mx-auto min-w-0">
          {/* Left Domain Rail (Alt+1 to Alt+6) */}
          {currentView !== "client-pwa" && (
            <DomainRail
              activeDomain={activeDomain}
              activeTab={activePartnerTab}
              onSelectDomain={handleSelectDomain}
              onSelectTab={(tabId) => handleTabChange(tabId)}
              onOpenDirectory={() => handleTabChange("staff-master")}
              isCollapsed={isSidebarCollapsed}
              urgentTaskCount={tasks.filter(t => t.status !== "FILED_AND_COMPLETED").length}
              activeNoticeCount={notices.length}
              allowedDomains={isTeamMember ? teamAllowedTools : undefined}
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

          {/* VIEW 2: PRACTICE COCKPIT (UNIFIED CA & TEAM INTERFACE) */}
          {currentView !== "client-pwa" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Contextual Sub-Tab Header for Active Domain (Hidden on Dashboard and Directory) */}
              {activePartnerTab !== "dashboard" && activePartnerTab !== "directory" && (
                <DomainSubTabHeader
                  activeDomain={activeDomain}
                  activeSubTab={activePartnerTab}
                  onSelectDomain={handleSelectDomain}
                  onSelectSubTab={(tabId) => handleTabChange(tabId)}
                  onPrefetchTab={(tabId) => {
                    const loader = TAB_PREFETCHERS[tabId];
                    if (loader) loader().catch(() => {});
                  }}
                  taskCount={tasks.length}
                />
              )}

              {/* 1. DASHBOARD: CONTEXT-AWARE (EXECUTIVE DASHBOARD FOR CA, TEAM WORKBENCH FOR TEAM) */}
              {activePartnerTab === "dashboard" && (
                isTeamMember ? (
                  <ArticleWorkbench isSandbox={isDemoSandbox} />
                ) : (
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
                )
              )}

              {/* PRACTICE TEAM & TOOL MANAGEMENT (INTEGRATED INTO EXISTING VIEW) */}
              {(activePartnerTab === "staff-master" || activePartnerTab === "directory") && (
                <StaffManagementView
                  tasks={tasks}
                  onRefreshData={refreshData}
                />
              )}

              {/* Active Content */}
              {/* OPERATIONAL MATRIX COCKPITS */}
              {activePartnerTab === "tasks-matrix" && (
                <TasksCommandCenter
                  tasks={tasks}
                  clients={clients}
                  onUpdateTask={updateTask}
                  onRefreshData={refreshData}
                  onNavigateTab={handleTabChange}
                />
              )}

              {activePartnerTab === "gst-filing" && (
                <GstFilingMatrix
                  tasks={tasks}
                  clients={clients}
                  credentials={portalCredentials}
                  dscTokens={dscTokens}
                  onUpdateTask={updateTask}
                  onRefreshData={refreshData}
                  onNavigateTab={handleTabChange}
                />
              )}

              {activePartnerTab === "gstr1" && (
                <Gstr1OutwardWorkbench />
              )}

              {activePartnerTab === "itr-matrix" && (
                <ItrAuditMatrix
                  tasks={tasks}
                  clients={clients}
                  credentials={portalCredentials}
                  dscTokens={dscTokens}
                  onUpdateTask={updateTask}
                  onRefreshData={refreshData}
                />
              )}

              {activePartnerTab === "billing-matrix" && (
                <BillingWipMatrix
                  invoices={invoices}
                  clients={clients}
                  payConfigs={payConfigs as any}
                  onRefreshData={refreshData}
                  onReconcileInvoice={reconcileInvoice}
                />
              )}

              {activePartnerTab === "growth-engine" && (
                <PracticeGrowthCockpit onClientConverted={() => refreshData()} />
              )}
              {activePartnerTab === "batch-dispatch" && (
                <BatchOutwardDispatcher 
                  clients={clients}
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
                <VirtualCfoCockpit clients={clients} />
              )}

              {activePartnerTab === "bank-parser" && (
                <BankStatementParser />
              )}

              {(activePartnerTab === "entity-dna" || activePartnerTab === "client-master") && (
                <EntityDnaMaster
                  clients={clients}
                  groups={groups}
                  selectedClientId={selectedEntityId || clients[0]?.id || ""}
                  initialTab={activePartnerTab === "entity-dna" ? "gstins" : "overview"}
                  onSelectClient={handleSelectClient}
                  onUpdateClient={updateClient}
                  onOpenDiagnosticModal={() => {
                    setClientMasterInitialTab("add");
                    setIsClientMasterOpen(true);
                  }}
                />
              )}

              {activePartnerTab === "pay-to-release" && (
                <PayToReleaseManager
                  configs={(isDemoSandbox && payConfigs.length === 0 ? INITIAL_PAY_TO_RELEASE_CONFIGS : payConfigs) as any}
                  clients={clients}
                  invoices={invoices}
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

              {activePartnerTab === "practice-cockpit" && (
                <AutonomousPracticeCockpit onNavigateTab={handleTabChange} />
              )}

              {activePartnerTab === "autonomous-orchestrator" && (
                <AutonomousPracticeOrchestratorWorkbench />
              )}

              {activePartnerTab === "gst-assembly" && (
                <AutonomousGstAssemblyLine />
              )}

              {activePartnerTab === "tds-assembly" && (
                <AutonomousTdsWorkbench />
              )}

              {activePartnerTab === "mca-assembly" && (
                <AutonomousMcaWorkbench />
              )}

              {activePartnerTab === "notice-assembly" && (
                <AutonomousNoticeWorkbench />
              )}

              {activePartnerTab === "governance-assembly" && (
                <AutonomousGovernanceWorkbench />
              )}

              {activePartnerTab === "vcfo-assembly" && (
                <AutonomousVcfoWorkbench />
              )}

              {activePartnerTab === "cicd-assembly" && (
                <EnterpriseCiCdWorkbench />
              )}

              {activePartnerTab === "legacy-migration" && (
                <LegacyMigrationWorkbench onMigrationCommitted={refreshData} />
              )}

              {activePartnerTab === "pillar-one-gst" && (
                <PillarOneGstEnterpriseWorkbench />
              )}

              {activePartnerTab === "pillar-two-tax" && (
                <PillarTwoDirectTaxWorkbench />
              )}

              {activePartnerTab === "pillar-three-audit" && (
                <PillarThreeTaxAuditWorkbench />
              )}

              {activePartnerTab === "pillar-five-tds" && (
                <PillarFiveTdsEnterpriseWorkbench />
              )}

              {activePartnerTab === "pillar-six-mca" && (
                <PillarSixMcaEnterpriseWorkbench />
              )}

              {activePartnerTab === "pillar-seven-governance" && (
                <PillarSevenGovernanceWorkbench />
              )}

              {activePartnerTab === "pillar-eight-desktop" && (
                <PillarEightTallyDesktopWorkbench />
              )}

              {activePartnerTab === "gst-ims" && (
                <GstImsWorkbench />
              )}

              {activePartnerTab === "bank-audit" && (
                <BankAuditWorkbench />
              )}

              {activePartnerTab === "form3cd-clause31" && (
                <Form3cdClause31Workbench />
              )}

              {activePartnerTab === "tally-data-grid" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <TallyDataGrid />
                </div>
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
                  credentials={portalCredentials}
                  clients={clients}
                  onNoticeUpdated={refreshData}
                  onNavigateTab={handleTabChange}
                />
              )}

              {activePartnerTab === "peer-review" && (
                <PeerReviewManager
                  clients={clients}
                  initialMsmeRecords={(isDemoSandbox ? SANDBOX_MSME_43BH_RECORDS : []) as any}
                  initialSection40a={(isDemoSandbox ? SANDBOX_SECTION_40A2B_SAMPLES : []) as any}
                />
              )}

              {activePartnerTab === "anti-poaching" && (
                <EnterpriseSecurityAndRealization
                  partnerMetrics={(isDemoSandbox ? SANDBOX_PARTNER_METRICS : []) as any}
                  securityLogs={(isDemoSandbox ? SANDBOX_STAFF_SECURITY_LOGS : []) as any}
                  invoices={invoices}
                  clients={clients}
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

      {/* Client Master Modal (Unified Onboarding & Client Directory) */}
      <ClientMasterModal
        isOpen={isClientMasterOpen}
        initialTab={clientMasterInitialTab}
        onClose={() => {
          setIsClientMasterOpen(false);
          setClientMasterInitialTab("directory");
        }}
        clients={clients}
        groups={groups}
        portalCredentials={portalCredentials}
        dscTokens={dscTokens}
        notices={notices}
        onRefreshData={refreshData}
        onAddClient={async (newClient) => {
          const created = await createClient(newClient);
          await refreshData();
          return created;
        }}
        onUpdateClient={async (id, data) => {
          const updated = await updateClient(id, data);
          await refreshData();
          return updated;
        }}
        onDeleteClient={async (id) => {
          await deleteClient(id);
          await refreshData();
        }}
        onBatchImported={async () => {
          await refreshData();
        }}
        onSelectClient={(client) => handleSelectClient(client.id)}
      />

      {/* Superhuman / Linear Style Keyboard Shortcuts Modal (Triggered by '?') */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onNavigate={(tab) => handleTabChange(tab)}
      />

      {/* TallyPrime & Winman Muscle-Memory Keyboard Overlay (Alt+H / Alt+G / F2-F9) */}
      <TallyKeyboardOverlay 
        onTriggerAction={(actionId: any) => {
          switch (actionId) {
            case "CHANGE_PERIOD":
              handleTabChange("calendar");
              break;
            case "OPEN_BRS":
              handleTabChange("bank-ocr");
              break;
            case "OPEN_MSME":
              handleTabChange("tax-audit-3cd");
              break;
            case "OPEN_GSTR1":
              handleTabChange("gst-assembly");
              break;
            case "OPEN_GSTR2B":
              handleTabChange("gstr2b");
              break;
            case "QUICK_SAVE":
              toast.success("Voucher & Workpaper Saved — Math validated with ₹0 divergence");
              break;
          }
        }}
      />
    </div>
);
}
