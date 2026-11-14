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
    id: "operations",
    name: "Operations & Practice",
    shortName: "Operations",
    description: "Deadlines, calendars, billing and daily dispatch registers",
    accentColor: "from-red-600 to-red-700",
    badgeColor: "bg-red-50 text-btred-logo border-red-200",
    icon: LayoutDashboard
  },
  {
    id: "direct-tax",
    name: "Direct Tax & Scrutiny",
    shortName: "Direct Tax",
    description: "ITR calculations, AIS/26AS analysis, and notice drafting",
    accentColor: "from-amber-600 to-amber-700",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calculator
  },
  {
    id: "audit-accounts",
    name: "Audit & Financials",
    shortName: "Audit",
    description: "Schedule III, CARO 2020, 3CD workpapers and Bank OCR",
    accentColor: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Layers
  },
  {
    id: "gst-supply",
    name: "GST & Reconciliations",
    shortName: "GST",
    description: "GSTR-2B vs 3B matcher and ITC verification",
    accentColor: "from-purple-600 to-purple-700",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: FileSpreadsheet
  },
  {
    id: "governance-vault",
    name: "Governance & Vault",
    shortName: "Governance",
    description: "UDIN register, physical DSC tokens, and SA-210 letters",
    accentColor: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: KeyRound
  },
  {
    id: "client-desk",
    name: "Client Growth & Leads",
    shortName: "Growth",
    description: "Lead scraper, WhatsApp communications, and creator studio",
    accentColor: "from-teal-600 to-emerald-700",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    icon: MessageSquare
  }
];

export const ALL_NAV_ITEMS: NavItem[] = [
  // --- COLUMN 1: OPERATIONS & PRACTICE ---
  {
    id: "dashboard",
    label: "Executive Dashboard",
    shortLabel: "Dashboard",
    categoryId: "operations",
    description: "Practice overview, compliance KPIs, upcoming deadlines and collections",
    icon: LayoutDashboard,
    iconColor: "text-btred-logo",
    badge: "Overview",
    badgeColor: "bg-red-50 text-btred-logo border-red-200",
    isDashboard: true
  },
  {
    id: "calendar",
    label: "Tax Deadlines & Calendar",
    shortLabel: "Deadlines",
    categoryId: "operations",
    description: "Statutory due dates across GST, Income Tax, TDS, and MCA with staff assignments",
    icon: Calendar,
    iconColor: "text-btred-logo",
    badge: "Filing",
    badgeColor: "bg-red-50 text-btred-logo border-red-200"
  },
  {
    id: "vcfo",
    label: "vCFO Advisory & Ratios",
    shortLabel: "vCFO Advisory",
    categoryId: "operations",
    description: "Financial modeling, CMA ratios, working capital and debt service coverage",
    icon: TrendingUp,
    iconColor: "text-indigo-600",
    badge: "Advisory",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: "billing",
    label: "Billing & Invoices",
    shortLabel: "Billing",
    categoryId: "operations",
    description: "Retainer fee billing, unbilled WIP, and client payment realization",
    icon: DollarSign,
    iconColor: "text-emerald-600",
    badge: "Billing",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "anti-poaching",
    label: "Firm Security & Access Logs",
    shortLabel: "Security",
    categoryId: "operations",
    description: "Staff activity audit trail, document export logs, and access security",
    icon: Fingerprint,
    iconColor: "text-btred-logo",
    badge: "Security",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
  },
  {
    id: "inward-outward",
    label: "Inward & Outward Register",
    shortLabel: "Registers",
    categoryId: "operations",
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
    categoryId: "operations",
    description: "Bulk automated dispatch of signed acknowledgments and filing summaries",
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
    description: "Automated invoice-level ITC matching and ineligible reversal verification",
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

  // --- COLUMN 6: CLIENT GROWTH & LEADS ---
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
    id: "whatsapp-ai",
    label: "Client WhatsApp Communications",
    shortLabel: "WhatsApp Desk",
    categoryId: "client-desk",
    description: "Client reminders and document request messages for pending filings",
    icon: MessageSquare,
    iconColor: "text-teal-700",
    badge: "Direct",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
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
  },
  {
    id: "client-master",
    label: "Client Master & Groups",
    shortLabel: "Client Master",
    categoryId: "client-desk",
    description: "Client entity directory, promoter group relationships, and contact details",
    icon: Users,
    iconColor: "text-emerald-700",
    badge: "Master",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
];

export const getNavItemById = (id: string): NavItem | undefined => {
  return ALL_NAV_ITEMS.find((item) => item.id === id);
};

export const getNavItemsByCategory = (categoryId: string): NavItem[] => {
  return ALL_NAV_ITEMS.filter((item) => item.categoryId === categoryId);
};
