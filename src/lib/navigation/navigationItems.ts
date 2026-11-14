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
    id: "operations",
    name: "Executive Cockpit & Operations",
    shortName: "Operations",
    description: "Firm overview, deadlines, WIP and daily registers",
    accentColor: "from-red-600 to-red-700",
    badgeColor: "bg-red-50 text-btred-logo border-red-200",
    icon: LayoutDashboard
  },
  {
    id: "direct-tax",
    name: "Direct Tax & Scrutiny",
    shortName: "Direct Tax",
    description: "ITR calculations, AIS/26AS, and faceless notice replies",
    accentColor: "from-amber-600 to-amber-700",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calculator
  },
  {
    id: "audit-accounts",
    name: "Corporate Audit & Financials",
    shortName: "Audit & Accounts",
    description: "Schedule III, CARO 2020, 3CD workpapers and Tally parser",
    accentColor: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Layers
  },
  {
    id: "gst-supply",
    name: "GST & Working Capital",
    shortName: "GST & Supply",
    description: "GSTR-2B vs 3B matcher and vendor credit sentinels",
    accentColor: "from-purple-600 to-purple-700",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: FileSpreadsheet
  },
  {
    id: "governance-vault",
    name: "Governance, Vault & Compliance",
    shortName: "Governance",
    description: "UDIN 60-day vault, physical DSCs, SA-210, and fee gates",
    accentColor: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: KeyRound
  },
  {
    id: "client-desk",
    name: "Client Desk & Growth",
    shortName: "Client Desk",
    description: "1-Tap WhatsApp, client master groups and creator studio",
    accentColor: "from-teal-600 to-emerald-700",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    icon: MessageSquare
  }
];

export const ALL_NAV_ITEMS: NavItem[] = [
  // --- COLUMN 1: EXECUTIVE COCKPIT & OPERATIONS ---
  {
    id: "dashboard",
    label: "Executive Dashboard",
    shortLabel: "Dashboard",
    categoryId: "operations",
    description: "Master firm cockpit with 4 core KPIs, alerts and quick-actions",
    icon: LayoutDashboard,
    iconColor: "text-btred-logo",
    badge: "Master",
    badgeColor: "bg-red-50 text-btred-logo border-red-200",
    isDashboard: true
  },
  {
    id: "calendar",
    label: "Statutory Tax Deadlines",
    shortLabel: "Deadlines",
    categoryId: "operations",
    description: "100+ statutory due dates (GST, ITR, TDS, ROC) with assignment",
    icon: Calendar,
    iconColor: "text-btred-logo",
    badge: "Filing",
    badgeColor: "bg-red-50 text-btred-logo border-red-200"
  },
  {
    id: "vcfo",
    label: "vCFO Advisory Cockpit",
    shortLabel: "vCFO Cockpit",
    categoryId: "operations",
    description: "Runway stress simulator, bank CMA ratios, and DSCR metrics",
    icon: TrendingUp,
    iconColor: "text-indigo-600",
    badge: "High Margin",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: "billing",
    label: "Billing & Fee Invoices",
    shortLabel: "Billing & WIP",
    categoryId: "operations",
    description: "Professional fee invoices, unbilled WIP and client direct UTR receipts",
    icon: DollarSign,
    iconColor: "text-emerald-600",
    badge: "Finance",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "anti-poaching",
    label: "Firm Security & Poaching Sentinel",
    shortLabel: "Firm Security",
    categoryId: "operations",
    description: "Staff download velocity monitor, access logs, and realization scores",
    icon: Fingerprint,
    iconColor: "text-btred-logo",
    badge: "Sentinel",
    badgeColor: "bg-red-50 text-btred-logo border-red-200"
  },
  {
    id: "inward-outward",
    label: "Inward & Outward Register",
    shortLabel: "Registers",
    categoryId: "operations",
    description: "ICAI mandatory inward/outward documentation and dispatch tracking",
    icon: Package,
    iconColor: "text-amber-500",
    badge: "Mandate",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "batch-dispatch",
    label: "Batch Outward Dispatcher",
    shortLabel: "Batch Dispatch",
    categoryId: "operations",
    description: "Bulk automated distribution of filed tax returns and receipts",
    icon: Sparkles,
    iconColor: "text-indigo-400",
    badge: "Automated",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },

  // --- COLUMN 2: DIRECT TAX & SCRUTINY ---
  {
    id: "itr-calc",
    label: "ITR Tax Engine (115BAC)",
    shortLabel: "ITR Calculator",
    categoryId: "direct-tax",
    description: "AY 25-26 & 26-27 dual-regime tax calculator with advisory dossier",
    icon: Calculator,
    iconColor: "text-amber-600",
    badge: "AY 25-26",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "ais-analyzer",
    label: "AIS / 26AS SFT Inspector",
    shortLabel: "AIS & 26AS",
    categoryId: "direct-tax",
    description: "Automated AIS/26AS JSON parser, SFT audit, and 194Q TDS cross-match",
    icon: FileSearch,
    iconColor: "text-teal-700",
    badge: "Direct Tax",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "notices",
    label: "Tax Scrutiny Notices",
    shortLabel: "Scrutiny Notices",
    categoryId: "direct-tax",
    description: "Faceless ITD (148, 143(2), 142(1)) and GST DRC-01 notice triage",
    icon: ShieldAlert,
    iconColor: "text-btred-logo",
    badge: "Litigation",
    badgeColor: "bg-red-50 text-btred-logo border-red-200"
  },
  {
    id: "notice-drafter",
    label: "Statutory Notice Drafter",
    shortLabel: "Notice Drafter",
    categoryId: "direct-tax",
    description: "Legal brief builder with ITAT/CIT(A) citations and stay petitions",
    icon: Scale,
    iconColor: "text-btred-logo",
    badge: "AI Drafter",
    badgeColor: "bg-red-50 text-btred-logo border-red-200"
  },

  // --- COLUMN 3: CORPORATE AUDIT & FINANCIALS ---
  {
    id: "schedule3-audit",
    label: "Schedule III & Audit Leads",
    shortLabel: "Schedule III Audit",
    categoryId: "audit-accounts",
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
    categoryId: "audit-accounts",
    description: "Clause 44 GST reconciliation and Clause 22 MSME interest calculation",
    icon: ClipboardCheck,
    iconColor: "text-amber-600",
    badge: "Sec 44AB",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "bank-parser",
    label: "Bank OCR to Tally XML",
    shortLabel: "Bank Parser",
    categoryId: "audit-accounts",
    description: "Auto-strips PDF passwords and exports native Tally XML vouchers",
    icon: FileSpreadsheet,
    iconColor: "text-emerald-600",
    badge: "Tally XML",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "entity-dna",
    label: "Entity DNA & Taxonomy",
    shortLabel: "Entity DNA",
    categoryId: "audit-accounts",
    description: "Comprehensive statutory taxonomy, MCA directors, and filing history",
    icon: Building2,
    iconColor: "text-purple-600",
    badge: "Profile",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },

  // --- COLUMN 4: GST & WORKING CAPITAL ---
  {
    id: "gstr2b",
    label: "GST Matcher (2B vs 3B)",
    shortLabel: "GST 2B Matcher",
    categoryId: "gst-supply",
    description: "Automated invoice-level ITC matching and ineligible reversal sentinel",
    icon: FileSpreadsheet,
    iconColor: "text-purple-600",
    badge: "ITC Defense",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "pay-to-release",
    label: "Fee Release Gate",
    shortLabel: "Pay-to-Release",
    categoryId: "gst-supply",
    description: "Cryptographically locked delivery of signed reports upon fee settlement",
    icon: Lock,
    iconColor: "text-emerald-700",
    badge: "Zero Bad Debts",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },

  // --- COLUMN 5: PRACTICE GOVERNANCE & VAULT ---
  {
    id: "udin-vault",
    label: "UDIN 60-Day Tracking Vault",
    shortLabel: "UDIN Vault",
    categoryId: "governance-vault",
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
    categoryId: "governance-vault",
    description: "USB dongle custody (safe locker rack/slot) and encrypted portal logins",
    icon: KeyRound,
    iconColor: "text-btred-logo",
    badge: "Hardware Custody",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
  },
  {
    id: "assessee-approval",
    label: "Assessee Legal Sign-off",
    shortLabel: "Assessee Approval",
    categoryId: "governance-vault",
    description: "Director/promoter digital sign-off on returns before final filing",
    icon: FileCheck,
    iconColor: "text-teal-700",
    badge: "SA 580",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "engagement-letter",
    label: "Engagement Letters (SA 210)",
    shortLabel: "SA 210 Letters",
    categoryId: "governance-vault",
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
    categoryId: "governance-vault",
    description: "SQC-1 quality control checklists, training logs, and review trails",
    icon: Award,
    iconColor: "text-indigo-400",
    badge: "SQC-1",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },

  // --- COLUMN 6: CLIENT DESK & GROWTH ---
  {
    id: "whatsapp-ai",
    label: "1-Tap WhatsApp Desk",
    shortLabel: "WhatsApp AI",
    categoryId: "client-desk",
    description: "Zero-API WhatsApp client chase for missing bank statements & invoices",
    icon: MessageSquare,
    iconColor: "text-teal-700",
    badge: "Zero-API",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "content-studio",
    label: "CA Creator Studio",
    shortLabel: "Creator Studio",
    categoryId: "client-desk",
    description: "Viral tax reel scripts, teleprompter and ICAI Rule 7 compliance scanner",
    icon: Video,
    iconColor: "text-pink-500",
    badge: "Social Media",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    id: "client-master",
    label: "Client Master & Groups",
    shortLabel: "Client Master",
    categoryId: "client-desk",
    description: "Manage client directory, corporate entity groups, and 1-tap WhatsApp broadcast desk",
    icon: Users,
    iconColor: "text-emerald-700",
    badge: "Master Data",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
];

export const getNavItemById = (id: string): NavItem | undefined => {
  return ALL_NAV_ITEMS.find((item) => item.id === id);
};

export const getNavItemsByCategory = (categoryId: string): NavItem[] => {
  return ALL_NAV_ITEMS.filter((item) => item.categoryId === categoryId);
};
