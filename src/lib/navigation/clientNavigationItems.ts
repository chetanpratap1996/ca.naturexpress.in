import React from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  Lock, 
  FolderLock, 
  UploadCloud, 
  CreditCard, 
  KeyRound,
  ShieldCheck,
  Building2,
  FileText,
  DollarSign,
  FileCheck
} from "lucide-react";
import { ClientTabType } from "@/components/client/ClientPortalPwa";

export interface ClientNavCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  accentColor: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ClientNavItem {
  id: ClientTabType;
  label: string;
  shortLabel: string;
  categoryId: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge?: string;
  badgeVariant?: "red" | "emerald" | "amber" | "indigo" | "slate";
  isPrimaryHero?: boolean;
}

export const CLIENT_NAV_CATEGORIES: ClientNavCategory[] = [
  {
    id: "executive",
    name: "Executive Shield & Health",
    shortName: "Executive",
    description: "Director DIN vigilance, Section 164(2) shield & statutory health",
    accentColor: "from-red-600 to-rose-700",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    icon: ShieldCheck,
  },
  {
    id: "tax-compliance",
    name: "Filings & Statutory Tax",
    shortName: "Tax Filings",
    description: "GST returns, ITR receipts, challans & document uploads",
    accentColor: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: FileCheck,
  },
  {
    id: "banking-finance",
    name: "Capital & Bank Dockets",
    shortName: "Banking",
    description: "1-Click loan renewal packs, CMA data & audited financials",
    accentColor: "from-blue-600 to-indigo-700",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Briefcase,
  },
  {
    id: "working-capital",
    name: "Working Capital & Vendors",
    shortName: "Working Capital",
    description: "MSME 43B(h) timeline countdown & GSTR-2B ITC hold manager",
    accentColor: "from-amber-600 to-orange-700",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  {
    id: "vault-firm",
    name: "Vault & CA Engagement",
    shortName: "Vault & Fees",
    description: "KYC repository, DSC status, fee invoices & pay-to-release",
    accentColor: "from-slate-700 to-slate-900",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    icon: FolderLock,
  },
];

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  // 1. Executive Shield & Health
  {
    id: "director-risk",
    label: "Director Personal Risk & MCA Shield",
    shortLabel: "Risk Radar",
    categoryId: "executive",
    description: "DIN freezes, Sec 164(2) disqualifications & SFT transaction vigilance",
    icon: ShieldAlert,
    iconColor: "text-red-600",
    badge: "Shield Active",
    badgeVariant: "red",
    isPrimaryHero: true,
  },

  // 2. Filings & Statutory Tax
  {
    id: "progress",
    label: "Statutory Filings & Tax Receipts",
    shortLabel: "Filings & Receipts",
    categoryId: "tax-compliance",
    description: "Real-time GST, Income Tax & MCA e-filing progress and official challans",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    badge: "100% Filed",
    badgeVariant: "emerald",
  },
  {
    id: "upload",
    label: "Upload Documents to Firm Vault",
    shortLabel: "Upload Vault",
    categoryId: "tax-compliance",
    description: "Securely upload bank statements, vouchers and invoices to your CA team",
    icon: UploadCloud,
    iconColor: "text-emerald-700",
  },

  // 3. Capital & Bank Dockets
  {
    id: "banker-docket",
    label: "Bank Loan & Credit Renewal Pack",
    shortLabel: "Banker Docket",
    categoryId: "banking-finance",
    description: "1-Click export of 3-year audited financials, ITR-V and GST returns for bankers",
    icon: Briefcase,
    iconColor: "text-indigo-600",
    badge: "1-Tap Export",
    badgeVariant: "indigo",
  },
  {
    id: "cash-forecast",
    label: "Tax Planning & Advance Tax Forecast",
    shortLabel: "Tax Planning",
    categoryId: "banking-finance",
    description: "Quarterly advance tax obligations, corporate liquidity & cash projection",
    icon: TrendingUp,
    iconColor: "text-indigo-700",
  },

  // 4. Working Capital & Vendors
  {
    id: "msme-watchdog",
    label: "MSME Section 43B(h) Watchdog",
    shortLabel: "MSME 43B(h)",
    categoryId: "working-capital",
    description: "45-day payment countdown to avoid income tax disallowances and interest",
    icon: Clock,
    iconColor: "text-amber-600",
    badge: "45-Day Rule",
    badgeVariant: "amber",
  },
  {
    id: "vendor-hold",
    label: "Vendor ITC Hold & GST 2B Reconciliation",
    shortLabel: "Vendor ITC Hold",
    categoryId: "working-capital",
    description: "Identify non-filing vendors and prevent working capital loss under Sec 16(2)(aa)",
    icon: Lock,
    iconColor: "text-amber-700",
  },

  // 5. Vault & CA Engagement
  {
    id: "kyc-locker",
    label: "Company Documents & KYC Locker",
    shortLabel: "Company KYC",
    categoryId: "vault-firm",
    description: "Permanent vault for PAN, TAN, GSTIN, MOA, AOA, and Incorporation deeds",
    icon: FolderLock,
    iconColor: "text-slate-700",
  },
  {
    id: "billing",
    label: "CA Retainers & Pay-to-Release Invoices",
    shortLabel: "Invoices & Fees",
    categoryId: "vault-firm",
    description: "View firm invoices, instant UPI settlement & release signed audit deliverables",
    icon: CreditCard,
    iconColor: "text-slate-800",
    badge: "SA 210 Gated",
    badgeVariant: "slate",
  },
  {
    id: "profile",
    label: "Profile & Portal Security Keys",
    shortLabel: "Security & Keys",
    categoryId: "vault-firm",
    description: "Authorized signatory details, DSC token tracking & 1-tap PIN security",
    icon: KeyRound,
    iconColor: "text-slate-600",
  },
];

export function getClientNavItemById(id: string): ClientNavItem | undefined {
  return CLIENT_NAV_ITEMS.find((item) => item.id === id);
}
