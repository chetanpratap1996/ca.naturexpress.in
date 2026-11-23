import React from "react";
import { 
  Calendar, 
  ShieldAlert, 
  DollarSign, 
  KeyRound, 
  TrendingUp, 
  FileSpreadsheet,
  Package,
  Lock,
  MessageSquare,
  Award,
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
  Compass, 
  LayoutDashboard, 
  UserPlus
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
    id: "tasks",
    name: "1. Tasks & Deadlines",
    shortName: "Tasks",
    description: "Statutory due dates, staff task assignments, workload balancing & dispatch",
    accentColor: "from-red-600 to-rose-700",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    icon: Calendar
  },
  {
    id: "gst",
    name: "2. GST Suite",
    shortName: "GST Suite",
    description: "GSTR-1, GSTR-3B, 2B vs books matching, IMS desk & annual reconciliations",
    accentColor: "from-purple-600 to-purple-800",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: FileSpreadsheet
  },
  {
    id: "tax-audit",
    name: "3. Income Tax & Audit",
    shortName: "Tax & Audit",
    description: "ITR returns, AIS/26AS, Form 3CD tax audit, TDS & Schedule III accounts",
    accentColor: "from-amber-600 to-amber-700",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calculator
  },
  {
    id: "notices-udin",
    name: "4. Notices & UDIN",
    shortName: "Notices & UDIN",
    description: "ITD/GST scrutiny notices, reply builder, UDIN tracking & MCA compliance",
    accentColor: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: ShieldAlert
  },
  {
    id: "billing-wip",
    name: "5. Billing & WIP",
    shortName: "Billing & WIP",
    description: "Statutory fee invoicing, Pay-to-Release gate, bank parser & Tally vouchers",
    accentColor: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: DollarSign
  },
  {
    id: "client-master",
    name: "6. Client Master & Desk",
    shortName: "Client Master",
    description: "Entity DNA database, DSC vault, WhatsApp chaser & vCFO advisory",
    accentColor: "from-teal-600 to-cyan-700",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    icon: Users
  }
];

export const ALL_NAV_ITEMS: NavItem[] = [
  // --- DOMAIN 1: TASKS & DEADLINES ---
  {
    id: "dashboard",
    label: "Executive Dashboard",
    shortLabel: "Dashboard",
    categoryId: "tasks",
    description: "Practice overview, compliance KPIs, upcoming deadlines and collections",
    icon: LayoutDashboard,
    iconColor: "text-red-600",
    badge: "Overview",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    isDashboard: true
  },
  {
    id: "tasks-matrix",
    label: "Task Command Center",
    shortLabel: "Task Center",
    categoryId: "tasks",
    description: "Daily statutory task allocation, 72h radar & overdue penalty tracking",
    icon: Calendar,
    iconColor: "text-red-600",
    badge: "Tasks",
    badgeColor: "bg-red-50 text-red-700 border-red-200"
  },
  {
    id: "calendar",
    label: "Statutory Deadlines Calendar",
    shortLabel: "Deadlines",
    categoryId: "tasks",
    description: "Statutory compliance calendar covering GST, ITR, TDS & ROC due dates",
    icon: Calendar,
    iconColor: "text-red-600",
    badge: "Calendar",
    badgeColor: "bg-red-50 text-red-700 border-red-200"
  },
  {
    id: "workload-matrix",
    label: "Workload Balancer",
    shortLabel: "Workload",
    categoryId: "tasks",
    description: "Staff capacity monitoring, bottleneck identification & load rebalancing",
    icon: Users,
    iconColor: "text-blue-600",
    badge: "Articles",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "batch-dispatch",
    label: "Batch Return Dispatcher",
    shortLabel: "Batch Dispatch",
    categoryId: "tasks",
    description: "Bulk automated dispatch of signed acknowledgments and filing summaries",
    icon: Sparkles,
    iconColor: "text-indigo-600",
    badge: "Dispatch",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: "inward-outward",
    label: "Inward & Outward Register",
    shortLabel: "Registers",
    categoryId: "tasks",
    description: "Physical and digital dispatch tracking with client acknowledgment receipts",
    icon: Package,
    iconColor: "text-amber-600",
    badge: "Registers",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "staff-master",
    label: "Staff & Article Trainees",
    shortLabel: "Employees",
    categoryId: "tasks",
    description: "Staff roster, competency tiers (1-4), and workload allocations",
    icon: UserPlus,
    iconColor: "text-emerald-600",
    badge: "Team",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },

  // --- DOMAIN 2: GST SUITE ---
  {
    id: "gst-filing",
    label: "GST Filing Matrix",
    shortLabel: "Filing Desk",
    categoryId: "gst",
    description: "GSTR-1 & GSTR-3B return monitoring, status & acknowledgement tracking",
    icon: FileSpreadsheet,
    iconColor: "text-purple-600",
    badge: "GST",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "gstr2b",
    label: "GSTR-2B vs Books Matcher",
    shortLabel: "2B Matcher",
    categoryId: "gst",
    description: "Invoice-level ITC matching, ineligible credit under Sec 17(5) & Rule 37A",
    icon: FileSpreadsheet,
    iconColor: "text-purple-600",
    badge: "ITC Reconciler",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "gst-ims",
    label: "GST IMS Desk",
    shortLabel: "IMS Desk",
    categoryId: "gst",
    description: "Invoice Management System accept/reject action & monthly cutoffs",
    icon: ClipboardCheck,
    iconColor: "text-purple-700",
    badge: "IMS",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "pillar-one-gst",
    label: "Annual Return & Audit (9/9C)",
    shortLabel: "GSTR-9 / 9C",
    categoryId: "gst",
    description: "GSTR-9/9C reconciliation, turnover verification & DRC-03 adjustment",
    icon: Layers,
    iconColor: "text-purple-600",
    badge: "Annual Audit",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "entity-dna",
    label: "GSTIN Master Directory",
    shortLabel: "GSTIN Master",
    categoryId: "gst",
    description: "Multi-state GSTIN registry, portal credentials and return tracker",
    icon: Building2,
    iconColor: "text-purple-700",
    badge: "Master",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },

  // --- DOMAIN 3: INCOME TAX & AUDIT ---
  {
    id: "itr-matrix",
    label: "ITR Filing Matrix",
    shortLabel: "ITR Matrix",
    categoryId: "tax-audit",
    description: "Corporate & individual ITR preparation with 115BAC dual-regime comparison",
    icon: FileCheck,
    iconColor: "text-amber-600",
    badge: "Direct Tax",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "ais-analyzer",
    label: "AIS / 26AS Inspector",
    shortLabel: "AIS & 26AS",
    categoryId: "tax-audit",
    description: "Automated AIS/26AS JSON parser, SFT cross-match and discrepancy audit",
    icon: FileSearch,
    iconColor: "text-teal-700",
    badge: "Tax Credit",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "pillar-five-tds",
    label: "TDS & TRACES Pipeline",
    shortLabel: "TDS & TRACES",
    categoryId: "tax-audit",
    description: "Form 24Q/26Q generation, TRACES correction desk & Section 206AB check",
    icon: FileSpreadsheet,
    iconColor: "text-amber-600",
    badge: "TDS",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "pillar-three-audit",
    label: "Form 3CD Tax Audit",
    shortLabel: "Form 3CD Audit",
    categoryId: "tax-audit",
    description: "ICDS adjustments, Clause 21/26/31 & Section 43B(h) MSME audit workpapers",
    icon: ClipboardCheck,
    iconColor: "text-blue-600",
    badge: "Tax Audit",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "schedule3-audit",
    label: "Schedule III Accounts",
    shortLabel: "Schedule III",
    categoryId: "tax-audit",
    description: "Companies Act statutory balance sheet, P&L, CARO 2020 & 11 ratios",
    icon: Layers,
    iconColor: "text-blue-600",
    badge: "Companies Act",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "pillar-two-tax",
    label: "Capital Gains & Schedules",
    shortLabel: "Capital Gains",
    categoryId: "tax-audit",
    description: "STCG/LTCG forensic computation, depreciation & 115BAC advisory",
    icon: Calculator,
    iconColor: "text-amber-600",
    badge: "Tax",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "engagement-letter",
    label: "Engagement Letters (SA 210)",
    shortLabel: "Engagement Letters",
    categoryId: "tax-audit",
    description: "Standard on Auditing 210 terms of audit contract and fee letters",
    icon: FileCheck,
    iconColor: "text-emerald-600",
    badge: "SA 210",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },

  // --- DOMAIN 4: NOTICES & UDIN ---
  {
    id: "notices",
    label: "Notice Docket",
    shortLabel: "Notice Docket",
    categoryId: "notices-udin",
    description: "Scrutiny notice docket, DIN verification & statutory limitation tracker",
    icon: ShieldAlert,
    iconColor: "text-red-600",
    badge: "Scrutiny",
    badgeColor: "bg-red-50 text-red-700 border-red-200"
  },
  {
    id: "notice-drafter",
    label: "Statutory Reply Drafter",
    shortLabel: "Reply Drafter",
    categoryId: "notices-udin",
    description: "Section 148, 143(1)(a) & DRC-01 statutory legal reply drafter",
    icon: Scale,
    iconColor: "text-red-600",
    badge: "Litigation",
    badgeColor: "bg-red-50 text-red-700 border-red-200"
  },
  {
    id: "udin-vault",
    label: "UDIN 60-Day Tracking Vault",
    shortLabel: "UDIN Vault",
    categoryId: "notices-udin",
    description: "ICAI 60-day UDIN countdown, QR watermark slips & revocation logs",
    icon: KeyRound,
    iconColor: "text-purple-700",
    badge: "UDIN",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "assessee-approval",
    label: "Assessee Sign-off (SA 580)",
    shortLabel: "Assessee Sign-off",
    categoryId: "notices-udin",
    description: "Director/promoter digital sign-off on returns before final submission",
    icon: FileCheck,
    iconColor: "text-teal-700",
    badge: "SA 580",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "pillar-six-mca",
    label: "MCA V3 & Secretarial",
    shortLabel: "MCA Secretarial",
    categoryId: "notices-udin",
    description: "Form AOC-4, MGT-7, DIR-3 KYC, DPT-3 loan audit & company law compliance",
    icon: Building2,
    iconColor: "text-purple-600",
    badge: "ROC",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "peer-review",
    label: "ICAI Peer Review Desk",
    shortLabel: "Peer Review",
    categoryId: "notices-udin",
    description: "SQC-1 quality control checklists, training logs & review trails",
    icon: Award,
    iconColor: "text-indigo-600",
    badge: "Peer Review",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },

  // --- DOMAIN 5: BILLING & WIP ---
  {
    id: "billing-matrix",
    label: "Billing Matrix & WIP",
    shortLabel: "Billing Matrix",
    categoryId: "billing-wip",
    description: "Statutory fee invoicing, unbilled WIP & MSME 45-day payment tracking",
    icon: DollarSign,
    iconColor: "text-emerald-600",
    badge: "Billing",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "pay-to-release",
    label: "Pay-to-Release Gate",
    shortLabel: "Pay-to-Release",
    categoryId: "billing-wip",
    description: "Payment-locked delivery of signed audit reports, financials & ITRs",
    icon: Lock,
    iconColor: "text-rose-600",
    badge: "Fee Release",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
  },
  {
    id: "bank-parser",
    label: "Bank Statement Parser",
    shortLabel: "Bank Parser",
    categoryId: "billing-wip",
    description: "Multi-bank PDF parser, password strip & accounting ledger mapping",
    icon: FileSpreadsheet,
    iconColor: "text-amber-600",
    badge: "Tally XML",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "pillar-eight-desktop",
    label: "Tally Bridge & Sync",
    shortLabel: "Tally Bridge",
    categoryId: "billing-wip",
    description: "Bidirectional TallyPrime XML voucher sync & accounting ledger bridge",
    icon: Sparkles,
    iconColor: "text-sky-600",
    badge: "TallyPrime",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200"
  },
  {
    id: "bank-audit",
    label: "Statutory Bank Audit",
    shortLabel: "Bank Audit",
    categoryId: "billing-wip",
    description: "IRAC 90-day NPA classification, drawing power & LFAR master pack",
    icon: Layers,
    iconColor: "text-cyan-600",
    badge: "Bank Audit",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  {
    id: "anti-poaching",
    label: "Partner Insights & Realization",
    shortLabel: "Partner Insights",
    categoryId: "billing-wip",
    description: "Staff activity audit trail, realization metrics & client profitability",
    icon: TrendingUp,
    iconColor: "text-red-600",
    badge: "Insights",
    badgeColor: "bg-red-50 text-red-700 border-red-200"
  },

  // --- DOMAIN 6: CLIENT MASTER & DESK ---
  {
    id: "client-master",
    label: "Client Master Database",
    shortLabel: "Client Master",
    categoryId: "client-master",
    description: "Centralized client database, PAN, GSTINs, directors & bank accounts",
    icon: Layers,
    iconColor: "text-emerald-700",
    badge: "Master Data",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "dsc",
    label: "DSC & Keys Vault",
    shortLabel: "DSC Vault",
    categoryId: "client-master",
    description: "Class 3 USB token custody register & centralized tax portal logins",
    icon: KeyRound,
    iconColor: "text-blue-600",
    badge: "Hardware Safe",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "whatsapp-ai",
    label: "WhatsApp Desk",
    shortLabel: "WhatsApp Desk",
    categoryId: "client-master",
    description: "Statutory document chaser, bank statement intake & client alerts",
    icon: MessageSquare,
    iconColor: "text-teal-700",
    badge: "WhatsApp",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200"
  },
  {
    id: "vcfo",
    label: "Virtual CFO Advisory",
    shortLabel: "vCFO Advisory",
    categoryId: "client-master",
    description: "Capital runway modeling, working capital (DSO/DPO) & board packs",
    icon: TrendingUp,
    iconColor: "text-indigo-600",
    badge: "Advisory",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: "pillar-seven-governance",
    label: "SQC-1 Governance",
    shortLabel: "SQC-1 Dossier",
    categoryId: "client-master",
    description: "Permanent audit workpapers, quality control & independence declarations",
    icon: Award,
    iconColor: "text-indigo-600",
    badge: "Governance",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: "growth-engine",
    label: "Practice Growth Radar",
    shortLabel: "Growth Radar",
    categoryId: "client-master",
    description: "MCA ROC incorporation tracker & corporate intelligence radar",
    icon: Compass,
    iconColor: "text-emerald-600",
    badge: "Growth",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "content-studio",
    label: "Tax Content Studio",
    shortLabel: "Content Studio",
    categoryId: "client-master",
    description: "Client tax circulars, bulletins & ICAI Rule 7 ethical compliance",
    icon: Video,
    iconColor: "text-pink-600",
    badge: "Bulletins",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200"
  }
];

export const getNavItemById = (id: string): NavItem | undefined => {
  return ALL_NAV_ITEMS.find((item) => item.id === id);
};

export const getNavItemsByCategory = (categoryId: string): NavItem[] => {
  return ALL_NAV_ITEMS.filter((item) => item.categoryId === categoryId);
};
