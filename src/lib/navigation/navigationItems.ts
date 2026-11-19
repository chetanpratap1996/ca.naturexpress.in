import React from "react";
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
  Layers,
  Calculator,
  Video,
  FileCheck,
  FileSearch,
  ClipboardCheck,
  Scale,
  Building2,
  Users,
  Grid,
  Compass,
  LayoutDashboard
} from "lucide-react";

export interface NavCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  accentColor: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  categoryId: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  isDashboard?: boolean;
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "task-management",
    name: "1. Task Management",
    shortName: "Tasks",
    description: "Statutory due date master, article assignments & late fee countdowns (CADashboard killer)",
    accentColor: "from-red-600 to-rose-700",
    badgeColor: "bg-red-50 text-btred-logo border-red-200",
    icon: Calendar
  },
  {
    id: "gst-suite",
    name: "2. GST Suite",
    shortName: "GST Suite",
    description: "GSTR-1, 3B, 2B vs Books matcher, Ineligible ITC Sec 17(5) & DRC-01 notice triage",
    accentColor: "from-purple-600 to-purple-800",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: FileSpreadsheet
  },
  {
    id: "income-tax-tds",
    name: "3. Income Tax & TDS",
    shortName: "Tax & TDS",
    description: "AIS/26AS JSON auto-ingest, 115BAC optimizer & 143(1)/148 notice AI drafter",
    accentColor: "from-amber-600 to-amber-700",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calculator
  },
  {
    id: "audit-balancesheet",
    name: "4. Audit & Balance Sheet",
    shortName: "Audit & Accounts",
    description: "Bank OCR to Tally XML, Schedule III balance sheet, 11 CARO ratios & 3CD MSME 43B(h)",
    accentColor: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Layers
  },
  {
    id: "billing-fees",
    name: "5. Billing & Fees",
    shortName: "Billing & Fees",
    description: "Professional fee invoicing, unbilled WIP, Imprest ledger & Pay-to-Release file lock",
    accentColor: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: DollarSign
  },
  {
    id: "client-desk",
    name: "Client Desk & WhatsApp Autopilot",
    shortName: "Client Desk",
    description: "Universal Entity DNA master, WhatsApp bot, SA 580 sign-offs & UDIN 60-day clock",
    accentColor: "from-teal-600 to-cyan-700",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    icon: Users
  }
];

export const ALL_NAV_ITEMS: NavItem[] = [
  // --- SUITE 1: TASK MANAGEMENT (CADashboard killer) ---
  {
    id: "dashboard",
    label: "Executive Dashboard",
    shortLabel: "Dashboard",
    categoryId: "task-management",
    description: "Practice overview, compliance KPIs, upcoming deadlines and collections",
    icon: LayoutDashboard,
    iconColor: "text-btred-logo",
    badge: "Overview",
    badgeColor: "bg-red-50 text-btred-logo border-red-200",
    isDashboard: true
  },
  {
    id: "calendar",
    label: "Statutory Task Engine & Deadlines",
    shortLabel: "Task Engine",
    categoryId: "task-management",
    description: "75+ Indian statutory deadlines, 5-stage Kanban, Article workload heatmap & late fee exposure meters (CADashboard killer)",
    icon: Calendar,
    iconColor: "text-btred-logo",
    badge: "CADashboard Killer",
    badgeColor: "bg-red-50 text-btred-logo border-red-200"
  },
  {
    id: "workload-matrix",
    label: "Article Workload Balancer",
    shortLabel: "Workload Matrix",
    categoryId: "task-management",
    description: "Staff capacity monitoring, overdue bottleneck heatmaps & 1-click rebalancing",
    icon: Users,
    iconColor: "text-blue-500",
    badge: "Articles",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "inward-outward",
    label: "Inward & Outward Register",
    shortLabel: "Registers",
    categoryId: "task-management",
    description: "Physical and digital dispatch tracking with client acknowledgment receipts",
    icon: Package,
    iconColor: "text-amber-500",
    badge: "Records",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "batch-dispatch",
    label: "Batch Return Dispatcher",
    shortLabel: "Batch Dispatch",
    categoryId: "task-management",
    description: "Bulk automated dispatch of signed acknowledgments and filing summaries",
    icon: Sparkles,
    iconColor: "text-indigo-400",
    badge: "Automated",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },

  // --- SUITE 2: GST SUITE (KDK / Express GST Data Prep) ---
  {
    id: "gst-assembly",
    label: "Autonomous GST Assembly Line",
    shortLabel: "GST Assembly (2035)",
    categoryId: "gst-suite",
    description: "Zero-Touch WhatsApp -> Bank OCR -> 2B Match -> GSTR-3B Auto-Signoff & Partner Triage Desk",
    icon: Sparkles,
    iconColor: "text-indigo-600",
    badge: "2035 Auto",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: "gstr2b",
    label: "GST Matcher (2B vs 3B & Books)",
    shortLabel: "GST 2B Matcher",
    categoryId: "gst-suite",
    description: "Automated invoice-level ITC matching and ineligible Sec 17(5) reversal verification",
    icon: FileSpreadsheet,
    iconColor: "text-purple-600",
    badge: "ITC Defense",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "notices",
    label: "Tax & GST Scrutiny Notices",
    shortLabel: "Scrutiny Notices",
    categoryId: "gst-suite",
    description: "Faceless ITD (148, 143(2), 142(1)) and GST DRC-01 / ASMT-10 notice triage",
    icon: ShieldAlert,
    iconColor: "text-btred-logo",
    badge: "DRC-01 Triage",
    badgeColor: "bg-red-50 text-btred-logo border-red-200"
  },

  // --- SUITE 3: INCOME TAX & TDS (CompuTax / Winman Data Prep) ---
  {
    id: "tds-assembly",
    label: "Autonomous TDS & TRACES Pipeline",
    shortLabel: "TDS & TRACES (2035)",
    categoryId: "income-tax-tds",
    description: "Zero-Touch Form 24Q/26Q Assembly, Sec 206AB Scan & 1-Click TRACES Correction Desk",
    icon: Sparkles,
    iconColor: "text-amber-600",
    badge: "2035 Auto",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "itr-calc",
    label: "ITR Tax Engine (115BAC)",
    shortLabel: "ITR Calculator",
    categoryId: "income-tax-tds",
    description: "AY 25-26 & 26-27 dual-regime tax calculator with advisory dossier",
    icon: Calculator,
    iconColor: "text-amber-600",
    badge: "AY 25-26 & 26-27",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "ais-analyzer",
    label: "AIS / 26AS SFT Inspector",
    shortLabel: "AIS & 26AS",
    categoryId: "income-tax-tds",
    description: "Automated AIS/26AS JSON parser, SFT audit, and 194Q TDS cross-match",
    icon: FileSearch,
    iconColor: "text-teal-700",
    badge: "Direct Tax",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "notice-drafter",
    label: "Statutory Notice Reply Drafter",
    shortLabel: "Notice Drafter",
    categoryId: "income-tax-tds",
    description: "Legal brief builder with ITAT/CIT(A) citations and stay petitions",
    icon: Scale,
    iconColor: "text-btred-logo",
    badge: "AI Drafter",
    badgeColor: "bg-red-50 text-btred-logo border-red-200"
  },

  // --- SUITE 4: AUDIT & BALANCE SHEET (Blackhorse / Microvista Replacer) ---
  {
    id: "entity-dna",
    label: "Entity DNA & Taxonomy",
    shortLabel: "Entity DNA",
    categoryId: "audit-balancesheet",
    description: "Comprehensive statutory taxonomy, MCA directors, and filing history",
    icon: Building2,
    iconColor: "text-purple-600",
    badge: "Universal Spine",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "bank-parser",
    label: "Bank OCR to Tally XML",
    shortLabel: "Bank Parser",
    categoryId: "audit-balancesheet",
    description: "Auto-strips PDF passwords and exports native Tally XML vouchers",
    icon: FileSpreadsheet,
    iconColor: "text-emerald-600",
    badge: "Tally XML",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "schedule3-audit",
    label: "Schedule III & Audit Leads",
    shortLabel: "Schedule III Audit",
    categoryId: "audit-balancesheet",
    description: "Companies Act statutory balance sheet, P&L, CARO 2020 & 11 ratios",
    icon: Layers,
    iconColor: "text-blue-600",
    badge: "Companies Act",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "tax-audit-3cd",
    label: "Tax Audit 3CD Workpapers",
    shortLabel: "Form 3CD Audit",
    categoryId: "audit-balancesheet",
    description: "Clause 44 GST reconciliation and Clause 22 MSME Section 43B(h) interest calculation",
    icon: ClipboardCheck,
    iconColor: "text-amber-600",
    badge: "Sec 44AB & 43B(h)",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "vcfo",
    label: "vCFO Advisory & Ratios",
    shortLabel: "vCFO Advisory",
    categoryId: "audit-balancesheet",
    description: "Financial modeling, CMA ratios, working capital and debt service coverage",
    icon: TrendingUp,
    iconColor: "text-indigo-600",
    badge: "Advisory",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },

  // --- SUITE 5: BILLING & FEES (Vyapar / Busy Killer) ---
  {
    id: "billing",
    label: "Billing & Invoices",
    shortLabel: "Billing",
    categoryId: "billing-fees",
    description: "Retainer fee billing, unbilled WIP, and client payment realization",
    icon: DollarSign,
    iconColor: "text-emerald-600",
    badge: "Billing",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "pay-to-release",
    label: "Fee Release Gate",
    shortLabel: "Pay-to-Release",
    categoryId: "billing-fees",
    description: "Cryptographically locked delivery of signed reports upon fee settlement",
    icon: Lock,
    iconColor: "text-emerald-700",
    badge: "Zero Bad Debts",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "anti-poaching",
    label: "Firm Security & Access Logs",
    shortLabel: "Security",
    categoryId: "billing-fees",
    description: "Staff activity audit trail, document export logs, and access security",
    icon: Fingerprint,
    iconColor: "text-btred-logo",
    badge: "Security",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
  },

  // --- SUPPORTING DESK: CLIENT DESK & WHATSAPP AUTOPILOT ---
  {
    id: "client-master",
    label: "Client Master & Groups",
    shortLabel: "Client Master",
    categoryId: "client-desk",
    description: "Universal Entity DNA directory, promoter group relationships, and contact details",
    icon: Users,
    iconColor: "text-emerald-700",
    badge: "Entity Master",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "whatsapp-ai",
    label: "Client WhatsApp Communications",
    shortLabel: "WhatsApp Desk",
    categoryId: "client-desk",
    description: "Client reminders and document request messages for pending filings",
    icon: MessageSquare,
    iconColor: "text-teal-700",
    badge: "Direct Bot",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "assessee-approval",
    label: "Assessee Legal Sign-off",
    shortLabel: "Assessee Approval",
    categoryId: "client-desk",
    description: "Director/promoter digital sign-off on returns before final filing (SA 580)",
    icon: FileCheck,
    iconColor: "text-teal-700",
    badge: "SA 580",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "udin-vault",
    label: "UDIN 60-Day Tracking Vault",
    shortLabel: "UDIN Vault",
    categoryId: "client-desk",
    description: "Strict 60-day ICAI deadline tracker, verification slips, and revocation logs",
    icon: KeyRound,
    iconColor: "text-purple-800",
    badge: "ICAI Mandate",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "dsc",
    label: "Physical DSC & Keys Locker",
    shortLabel: "DSC & Vault",
    categoryId: "client-desk",
    description: "USB dongle custody (safe locker rack/slot) and encrypted portal logins",
    icon: KeyRound,
    iconColor: "text-btred-logo",
    badge: "Hardware Custody",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
  },
  {
    id: "engagement-letter",
    label: "Engagement Letters (SA 210)",
    shortLabel: "SA 210 Letters",
    categoryId: "client-desk",
    description: "Standard on Auditing 210 terms of audit contract and fee letters",
    icon: FileCheck,
    iconColor: "text-emerald-600",
    badge: "Mandate",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "peer-review",
    label: "ICAI Peer Review Desk",
    shortLabel: "Peer Review",
    categoryId: "client-desk",
    description: "SQC-1 quality control checklists, training logs, and review trails",
    icon: Award,
    iconColor: "text-indigo-400",
    badge: "SQC-1",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: "growth-engine",
    label: "Client Acquisition & Leads",
    shortLabel: "Lead Scraper",
    categoryId: "client-desk",
    description: "MCA & GSTN corporate lead scraper with automated statutory penalty risk scoring",
    icon: Compass,
    iconColor: "text-emerald-600",
    badge: "Leads",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "content-studio",
    label: "Tax Content Studio",
    shortLabel: "Content Studio",
    categoryId: "client-desk",
    description: "Tax update drafts, social media scripts, and client advisory bulletins",
    icon: Video,
    iconColor: "text-pink-500",
    badge: "Updates",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200"
  }
];

export const getNavItemById = (id: string): NavItem | undefined => {
  return ALL_NAV_ITEMS.find((item) => item.id === id);
};

export const getNavItemsByCategory = (categoryId: string): NavItem[] => {
  return ALL_NAV_ITEMS.filter((item) => item.categoryId === categoryId);
};
