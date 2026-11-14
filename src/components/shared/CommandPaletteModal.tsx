"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { 
  Search, 
  Building2, 
  FileText, 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  X, 
  Sparkles,
  CheckCircle2,
  Lock,
  CreditCard,
  Layers,
  Scale,
  Calendar,
  AlertTriangle,
  FolderOpen,
  MessageSquare,
  FileCheck2,
  Calculator,
  UserCheck,
  TrendingUp,
  Award,
  Globe,
  Hash,
  ExternalLink,
  ChevronRight,
  LayoutDashboard,
  Video,
  Package,
  Fingerprint
} from "lucide-react";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

type FilterCategory = 
  | "ALL"
  | "CLIENTS"
  | "TASKS"
  | "NOTICES"
  | "DSC"
  | "KEYS"
  | "BILLING"
  | "DOCS"
  | "WORKSPACES";

interface WorkspaceTool {
  id: string;
  name: string;
  tabId: string;
  category: string;
  description: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const WORKSPACE_TOOLS: WorkspaceTool[] = [
  {
    id: "dashboard",
    name: "Master Executive Dashboard",
    tabId: "dashboard",
    category: "Cockpit",
    description: "4 Master KPI Cards, On-Time Filing Rate, Critical 72h alerts & firm radar",
    keywords: ["dashboard", "home", "cockpit", "kpi", "overview", "executive", "filing rate", "demands"],
    icon: LayoutDashboard,
    accentColor: "text-red-600 bg-red-50 border-red-200"
  },
  {
    id: "calendar",
    name: "Statutory Compliance Matrix",
    tabId: "calendar",
    category: "Compliance",
    description: "Statutory filing deadlines, ROC, GST, ITR & advance tax tracking",
    keywords: ["compliance", "statutory", "calendar", "due date", "filing", "deadlines", "mca", "roc"],
    icon: Calendar,
    accentColor: "text-btred-600 bg-red-50 border-red-200"
  },
  {
    id: "notices",
    name: "Notice & SCN Response Center",
    tabId: "notices",
    category: "Litigation",
    description: "Faceless Income Tax & GST DRC-01 notices, scrutiny triage",
    keywords: ["notice", "scrutiny", "148", "143(2)", "drc-01", "asmt-10", "reopening", "scn", "demand"],
    icon: ShieldAlert,
    accentColor: "text-amber-600 bg-amber-50 border-amber-200"
  },
  {
    id: "notice-drafter",
    name: "AI Notice Reply Drafter",
    tabId: "notice-drafter",
    category: "Litigation",
    description: "Legal briefs, appellate submissions u/s 148, 143(2), DRC-01 & stay petitions",
    keywords: ["draft", "reply", "drafter", "appeal", "legal brief", "cit(a)", "itat", "section 148"],
    icon: Scale,
    accentColor: "text-red-700 bg-red-50 border-red-200"
  },
  {
    id: "dsc",
    name: "Physical DSC Vault & Keys Locker",
    tabId: "dsc",
    category: "Vault",
    description: "Hardware USB DSC custody, safe locker slots & portal login credentials",
    keywords: ["dsc", "token", "usb", "vault", "locker", "slot", "keys", "password", "custody"],
    icon: KeyRound,
    accentColor: "text-blue-600 bg-blue-50 border-blue-200"
  },
  {
    id: "billing",
    name: "Fee Invoices & Direct Bank UTR",
    tabId: "billing",
    category: "Finance",
    description: "Professional fee invoices, client direct UTR receipts & WIP tracking",
    keywords: ["billing", "invoice", "fees", "utr", "payment", "receipt", "bank transfer", "wip"],
    icon: CreditCard,
    accentColor: "text-emerald-600 bg-emerald-50 border-emerald-200"
  },
  {
    id: "gstr2b",
    name: "GSTR-2B vs 3B Reconciler",
    tabId: "gstr2b",
    category: "GST",
    description: "Automated invoice-level ITC cross-matching & ineligible reversal sentinel",
    keywords: ["2b", "gstr-2b", "gstr-3b", "itc", "gst reco", "reconcile", "reversal", "clause 44"],
    icon: Layers,
    accentColor: "text-purple-600 bg-purple-50 border-purple-200"
  },
  {
    id: "bank-parser",
    name: "Bank Statement & PDF Decryptor",
    tabId: "bank-parser",
    category: "Audit",
    description: "Automated password removal & multi-bank transaction parser",
    keywords: ["bank", "statement", "decryptor", "password", "strip", "parser", "transactions", "pdf"],
    icon: Sparkles,
    accentColor: "text-amber-500 bg-amber-50 border-amber-200"
  },
  {
    id: "vcfo",
    name: "Virtual CFO Cockpit",
    tabId: "vcfo",
    category: "Advisory",
    description: "Cashflow runway, bank CMA ratios, DSCR & financial health scores",
    keywords: ["vcfo", "cfo", "cma", "ratios", "runway", "dscr", "cashflow", "working capital"],
    icon: TrendingUp,
    accentColor: "text-indigo-600 bg-indigo-50 border-indigo-200"
  },
  {
    id: "entity-dna",
    name: "Entity DNA & Taxonomy Matrix",
    tabId: "entity-dna",
    category: "Compliance",
    description: "Comprehensive statutory taxonomy, MCA directors & Schedule III ledgers",
    keywords: ["dna", "taxonomy", "schedule 3", "entity", "profile", "directors", "mca"],
    icon: Building2,
    accentColor: "text-cyan-600 bg-cyan-50 border-cyan-200"
  },
  {
    id: "pay-to-release",
    name: "Pay-To-Release Document Delivery",
    tabId: "pay-to-release",
    category: "Vault",
    description: "Cryptographically locked delivery of signed audit reports upon fee settlement",
    keywords: ["pay to release", "gated", "locked", "delivery", "release", "documents", "signed reports"],
    icon: Lock,
    accentColor: "text-rose-600 bg-rose-50 border-rose-200"
  },
  {
    id: "tax-audit-3cd",
    name: "Form 3CD Tax Audit Workpaper",
    tabId: "tax-audit-3cd",
    category: "Audit",
    description: "Clause 44 GST reconciliation & Section 43B(h) MSME payment compliance",
    keywords: ["3cd", "form 3cd", "tax audit", "clause 44", "43b(h)", "msme", "workpaper"],
    icon: FileCheck2,
    accentColor: "text-btred-600 bg-red-50 border-red-200"
  },
  {
    id: "schedule3-audit",
    name: "Schedule III Financial Audit Engine",
    tabId: "schedule3-audit",
    category: "Audit",
    description: "Companies Act statutory balance sheet, P&L & CARO 2020 reporting",
    keywords: ["schedule 3", "schedule iii", "caro", "balance sheet", "p&l", "companies act", "statutory audit"],
    icon: Calculator,
    accentColor: "text-blue-700 bg-blue-50 border-blue-200"
  },
  {
    id: "udin-vault",
    name: "ICAI UDIN Tracking Vault",
    tabId: "udin-vault",
    category: "Regulatory",
    description: "Strict 60-day ICAI UDIN generation monitoring & audit certification logs",
    keywords: ["udin", "icai", "certificate", "audit report", "frn", "generation"],
    icon: Award,
    accentColor: "text-amber-700 bg-amber-50 border-amber-200"
  },
  {
    id: "ais-analyzer",
    name: "AIS & 26AS Tax Credit Analyzer",
    tabId: "ais-analyzer",
    category: "Tax",
    description: "Section 194Q TDS cross-verification & high-value SFT transaction audit",
    keywords: ["ais", "26as", "tis", "tds", "194q", "sft", "tax credit", "annual information statement"],
    icon: FileText,
    accentColor: "text-teal-600 bg-teal-50 border-teal-200"
  },
  {
    id: "itr-calc",
    name: "ITR Computation Engine",
    tabId: "itr-calc",
    category: "Tax",
    description: "Corporate & individual income tax computation with chapter VI-A deductions",
    keywords: ["itr", "income tax", "computation", "tax calculation", "corporate tax", "advance tax"],
    icon: Calculator,
    accentColor: "text-emerald-700 bg-emerald-50 border-emerald-200"
  },
  {
    id: "whatsapp-ai",
    name: "WhatsApp AI Client Workbench",
    tabId: "whatsapp-ai",
    category: "Client Desk",
    description: "Client document intake, automated invoice extraction & direct dispatch",
    keywords: ["whatsapp", "ai", "chat", "intake", "dispatch", "mobile", "client messaging"],
    icon: MessageSquare,
    accentColor: "text-emerald-600 bg-emerald-50 border-emerald-200"
  },
  {
    id: "assessee-approval",
    name: "Assessee Direct Approval Desk",
    tabId: "assessee-approval",
    category: "Client Desk",
    description: "Promoter and Director electronic approvals on draft returns before filing",
    keywords: ["assessee", "approval", "sign-off", "director", "promoter", "e-sign"],
    icon: UserCheck,
    accentColor: "text-sky-600 bg-sky-50 border-sky-200"
  },
  {
    id: "engagement-letter",
    name: "SA 210 Engagement Letter Generator",
    tabId: "engagement-letter",
    category: "Compliance",
    description: "Standard on Auditing 210 terms of audit engagement contracts & fee letters",
    keywords: ["engagement", "letter", "sa 210", "contract", "terms", "scope"],
    icon: FileText,
    accentColor: "text-slate-700 bg-slate-100 border-slate-300"
  },
  {
    id: "peer-review",
    name: "ICAI Peer Review Compliance Manager",
    tabId: "peer-review",
    category: "Regulatory",
    description: "Quality review board checklists, documentation trails & ethics reviews",
    keywords: ["peer review", "icai", "quality review", "ethics", "frn: 022998c", "compliance"],
    icon: CheckCircle2,
    accentColor: "text-green-700 bg-green-50 border-green-200"
  },
  {
    id: "anti-poaching",
    name: "Firm Security & Poaching Sentinel",
    tabId: "anti-poaching",
    category: "Security",
    description: "Staff download velocity monitor, access logs, and realization scores",
    keywords: ["security", "poaching", "anti-poaching", "download logs", "audit trail", "staff"],
    icon: Fingerprint,
    accentColor: "text-red-700 bg-red-50 border-red-200"
  },
  {
    id: "content-studio",
    name: "CA Creator & Content Studio",
    tabId: "content-studio",
    category: "Media",
    description: "Viral tax reel scripts, teleprompter and ICAI Rule 7 compliance scanner",
    keywords: ["content", "studio", "creator", "social media", "reels", "teleprompter", "rule 7"],
    icon: Video,
    accentColor: "text-pink-600 bg-pink-50 border-pink-200"
  },
  {
    id: "inward-outward",
    name: "Inward & Outward Register",
    tabId: "inward-outward",
    category: "Operations",
    description: "ICAI mandatory inward/outward documentation and dispatch tracking",
    keywords: ["inward", "outward", "register", "letters", "dispatch", "physical docs"],
    icon: Package,
    accentColor: "text-amber-600 bg-amber-50 border-amber-200"
  },
  {
    id: "batch-dispatch",
    name: "Batch Outward Dispatcher",
    tabId: "batch-dispatch",
    category: "Operations",
    description: "Bulk automated distribution of filed tax returns and fee receipts",
    keywords: ["batch", "dispatch", "distribution", "bulk outward", "acknowledgments"],
    icon: Sparkles,
    accentColor: "text-indigo-600 bg-indigo-50 border-indigo-200"
  }
];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const { 
    clients = [], 
    groups = [], 
    tasks = [], 
    dscTokens = [], 
    notices = [], 
    invoices = [], 
    portalCredentials = [], 
    documents = [] 
  } = useTaxoData();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveCategory("ALL");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener: Escape, ArrowDown, ArrowUp, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const q = query.toLowerCase().trim();

  // 1. Matched Clients
  const matchedClients = useMemo(() => {
    if (!q) return clients.slice(0, 4);
    return clients.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q);
      const matchPan = c.pan?.toLowerCase().includes(q);
      const matchGstin = c.gstin?.toLowerCase().includes(q);
      const matchGroup = c.groupName?.toLowerCase().includes(q);
      const matchContact = c.primaryContact?.name?.toLowerCase().includes(q);
      const matchPhone = c.primaryContact?.phone?.includes(q);
      const matchEmail = c.primaryContact?.email?.toLowerCase().includes(q);
      const matchPartner = c.partnerInCharge?.toLowerCase().includes(q);
      const matchType = c.type?.toLowerCase().includes(q);
      return matchName || matchPan || matchGstin || matchGroup || matchContact || matchPhone || matchEmail || matchPartner || matchType;
    });
  }, [clients, q]);

  // 2. Matched Tasks / Statutory Filings
  const matchedTasks = useMemo(() => {
    if (!q) return tasks.slice(0, 4);
    return tasks.filter((t) => {
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchEntity = t.entityName?.toLowerCase().includes(q);
      const matchCategory = t.category?.toLowerCase().includes(q);
      const matchStatus = t.status?.toLowerCase().includes(q);
      const matchPeriod = t.period?.toLowerCase().includes(q);
      const matchDueDate = t.dueDate?.toLowerCase().includes(q);
      const matchUdin = t.officialUdin?.toLowerCase().includes(q);
      const matchArn = t.arnNumber?.toLowerCase().includes(q);
      return matchTitle || matchEntity || matchCategory || matchStatus || matchPeriod || matchDueDate || matchUdin || matchArn;
    });
  }, [tasks, q]);

  // 3. Matched Notices (IT / GST Scrutiny)
  const matchedNotices = useMemo(() => {
    if (!q) return notices.slice(0, 3);
    return notices.filter((n) => {
      const matchSection = n.section?.toLowerCase().includes(q);
      const matchEntity = n.entityName?.toLowerCase().includes(q);
      const matchAuth = n.authority?.toLowerCase().includes(q);
      const matchDin = n.dinNumber?.toLowerCase().includes(q);
      const matchSummary = n.summary?.toLowerCase().includes(q);
      const matchStatus = n.status?.toLowerCase().includes(q);
      const matchRisk = n.riskLevel?.toLowerCase().includes(q);
      const matchAY = n.assessmentYear?.toLowerCase().includes(q);
      return matchSection || matchEntity || matchAuth || matchDin || matchSummary || matchStatus || matchRisk || matchAY;
    });
  }, [notices, q]);

  // 4. Matched Physical DSC Tokens
  const matchedDscs = useMemo(() => {
    if (!q) return dscTokens.slice(0, 3);
    return dscTokens.filter((d) => {
      const matchHolder = d.holderName?.toLowerCase().includes(q);
      const matchEntity = d.entityName?.toLowerCase().includes(q);
      const matchSlot = d.vaultSlot?.toLowerCase().includes(q);
      const matchSerial = d.serialNumber?.toLowerCase().includes(q);
      const matchCustodian = d.currentCustodian?.toLowerCase().includes(q);
      const matchType = d.tokenType?.toLowerCase().includes(q);
      return matchHolder || matchEntity || matchSlot || matchSerial || matchCustodian || matchType;
    });
  }, [dscTokens, q]);

  // 5. Matched Government Portal Credentials
  const matchedKeys = useMemo(() => {
    if (!q) return portalCredentials.slice(0, 3);
    return portalCredentials.filter((k) => {
      const matchPortal = k.portalName?.toLowerCase().includes(q);
      const matchType = k.portalType?.toLowerCase().includes(q);
      const matchEntity = k.entityName?.toLowerCase().includes(q);
      const matchUser = k.username?.toLowerCase().includes(q);
      const matchSec = k.secondaryIdentifier?.toLowerCase().includes(q);
      return matchPortal || matchType || matchEntity || matchUser || matchSec;
    });
  }, [portalCredentials, q]);

  // 6. Matched Fee Invoices & Direct UTRs
  const matchedInvoices = useMemo(() => {
    if (!q) return invoices.slice(0, 3);
    return invoices.filter((inv) => {
      const matchInvNo = inv.invoiceNo?.toLowerCase().includes(q);
      const matchEntity = inv.entityName?.toLowerCase().includes(q);
      const matchDesc = inv.serviceDescription?.toLowerCase().includes(q);
      const matchUtr = inv.clientUtrNumber?.toLowerCase().includes(q);
      const matchStatus = inv.status?.toLowerCase().includes(q);
      const matchAmount = inv.amount?.toString().includes(q);
      return matchInvNo || matchEntity || matchDesc || matchUtr || matchStatus || matchAmount;
    });
  }, [invoices, q]);

  // 7. Matched Documents & Vault Files
  const matchedDocuments = useMemo(() => {
    if (!q) return documents.slice(0, 3);
    return documents.filter((doc) => {
      const matchFile = doc.fileName?.toLowerCase().includes(q);
      const matchEntity = doc.entityName?.toLowerCase().includes(q);
      const matchCategory = doc.category?.toLowerCase().includes(q);
      const matchFy = doc.financialYear?.toLowerCase().includes(q);
      return matchFile || matchEntity || matchCategory || matchFy;
    });
  }, [documents, q]);

  // 8. Matched Practice Workspaces & AI Tools
  const matchedWorkspaces = useMemo(() => {
    if (!q) return WORKSPACE_TOOLS.slice(0, 6);
    return WORKSPACE_TOOLS.filter((w) => {
      const matchName = w.name.toLowerCase().includes(q);
      const matchCat = w.category.toLowerCase().includes(q);
      const matchDesc = w.description.toLowerCase().includes(q);
      const matchKeywords = w.keywords.some((k) => k.toLowerCase().includes(q));
      return matchName || matchCat || matchDesc || matchKeywords;
    });
  }, [q]);

  // Aggregate visible actionable items based on activeCategory
  interface FlattenedResultItem {
    id: string;
    type: FilterCategory;
    title: string;
    subtitle: string;
    badge?: string;
    badgeStyle?: string;
    extra?: string;
    actionTab: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const flattenedResults = useMemo<FlattenedResultItem[]>(() => {
    const list: FlattenedResultItem[] = [];

    // Workspaces
    if (activeCategory === "ALL" || activeCategory === "WORKSPACES") {
      matchedWorkspaces.forEach((w) => {
        list.push({
          id: `ws-${w.id}`,
          type: "WORKSPACES",
          title: w.name,
          subtitle: w.description,
          badge: w.category,
          badgeStyle: "bg-red-50 text-btred-600 border border-red-200",
          actionTab: w.tabId,
          icon: w.icon
        });
      });
    }

    // Clients
    if (activeCategory === "ALL" || activeCategory === "CLIENTS") {
      matchedClients.forEach((c) => {
        list.push({
          id: `client-${c.id}`,
          type: "CLIENTS",
          title: c.name,
          subtitle: `${c.groupName || "Direct Client"} • Partner: ${c.partnerInCharge || "CA Gunjan Jain"} • Turnover: ₹${c.turnoverCr}Cr`,
          badge: c.pan,
          badgeStyle: "bg-slate-100 text-slate-800 font-mono border border-slate-200",
          extra: c.gstin ? `GST: ${c.gstin}` : undefined,
          actionTab: "calendar",
          icon: Building2
        });
      });
    }

    // Statutory Tasks
    if (activeCategory === "ALL" || activeCategory === "TASKS") {
      matchedTasks.forEach((t) => {
        list.push({
          id: `task-${t.id}`,
          type: "TASKS",
          title: t.title,
          subtitle: `${t.entityName} • Due: ${t.dueDate} • ${t.period || ""}`,
          badge: t.category,
          badgeStyle: "bg-red-50 text-btred-600 font-bold border border-red-200",
          extra: `Status: ${t.status}`,
          actionTab: "calendar",
          icon: Calendar
        });
      });
    }

    // Notices
    if (activeCategory === "ALL" || activeCategory === "NOTICES") {
      matchedNotices.forEach((n) => {
        list.push({
          id: `notice-${n.id}`,
          type: "NOTICES",
          title: `${n.authority?.replace("_", " ")} Notice: ${n.section}`,
          subtitle: `${n.entityName} • Deadline: ${n.statutoryDeadline} • Demand: ₹${(n.demandAmount || 0).toLocaleString("en-IN")}`,
          badge: n.riskLevel || "SCRUTINY",
          badgeStyle: n.riskLevel === "CRITICAL" ? "bg-red-600 text-white font-bold" : "bg-amber-100 text-amber-900 border border-amber-300 font-bold",
          extra: n.dinNumber ? `DIN: ${n.dinNumber}` : undefined,
          actionTab: "notices",
          icon: ShieldAlert
        });
      });
    }

    // Physical DSC
    if (activeCategory === "ALL" || activeCategory === "DSC") {
      matchedDscs.forEach((d) => {
        list.push({
          id: `dsc-${d.id}`,
          type: "DSC",
          title: `DSC Token: ${d.holderName}`,
          subtitle: `${d.entityName} • Custodian: ${d.currentCustodian || "Safe Locker"} • Valid till: ${d.validTill}`,
          badge: d.vaultSlot || "SAFE-SLOT",
          badgeStyle: "bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200",
          actionTab: "dsc",
          icon: KeyRound
        });
      });
    }

    // Portal Credentials
    if (activeCategory === "ALL" || activeCategory === "KEYS") {
      matchedKeys.forEach((k) => {
        list.push({
          id: `key-${k.id}`,
          type: "KEYS",
          title: `${k.portalName} (${k.portalType})`,
          subtitle: `${k.entityName} • User ID: ${k.username} • Verified`,
          badge: "PORTAL KEY",
          badgeStyle: "bg-purple-50 text-purple-700 font-bold border border-purple-200",
          actionTab: "dsc",
          icon: Lock
        });
      });
    }

    // Fee Invoices
    if (activeCategory === "ALL" || activeCategory === "BILLING") {
      matchedInvoices.forEach((inv) => {
        list.push({
          id: `inv-${inv.id}`,
          type: "BILLING",
          title: `Invoice ${inv.invoiceNo} — ₹${(inv.amount || 0).toLocaleString("en-IN")}`,
          subtitle: `${inv.entityName} • ${inv.serviceDescription} • Due: ${inv.dueDate}`,
          badge: inv.status,
          badgeStyle: inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900",
          extra: inv.clientUtrNumber ? `UTR: ${inv.clientUtrNumber}` : undefined,
          actionTab: "billing",
          icon: CreditCard
        });
      });
    }

    // Documents
    if (activeCategory === "ALL" || activeCategory === "DOCS") {
      matchedDocuments.forEach((doc) => {
        list.push({
          id: `doc-${doc.id}`,
          type: "DOCS",
          title: doc.fileName,
          subtitle: `${doc.entityName} • Category: ${doc.category} • FY: ${doc.financialYear || "FY25"}`,
          badge: doc.reviewStatus || "VAULT",
          badgeStyle: "bg-slate-100 text-slate-700 border border-slate-200",
          actionTab: "pay-to-release",
          icon: FolderOpen
        });
      });
    }

    return list;
  }, [
    activeCategory,
    matchedWorkspaces,
    matchedClients,
    matchedTasks,
    matchedNotices,
    matchedDscs,
    matchedKeys,
    matchedInvoices,
    matchedDocuments
  ]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [flattenedResults.length, activeCategory]);

  // Keyboard navigation for items
  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flattenedResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flattenedResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const currentItem = flattenedResults[selectedIndex];
      if (currentItem) {
        handleSelect(currentItem.actionTab);
      }
    }
  };

  const handleSelect = (tabId: string) => {
    onNavigate(tabId);
    onClose();
  };

  if (!isOpen) return null;

  // Counts for Category Tabs
  const counts = {
    ALL: matchedWorkspaces.length + matchedClients.length + matchedTasks.length + matchedNotices.length + matchedDscs.length + matchedKeys.length + matchedInvoices.length + matchedDocuments.length,
    CLIENTS: matchedClients.length,
    TASKS: matchedTasks.length,
    NOTICES: matchedNotices.length,
    DSC: matchedDscs.length,
    KEYS: matchedKeys.length,
    BILLING: matchedInvoices.length,
    DOCS: matchedDocuments.length,
    WORKSPACES: matchedWorkspaces.length,
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-2 sm:pt-14 p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleItemKeyDown}
      >
        {/* 1. Header Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/90 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 text-btred-600 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Search clients, PAN (AANCP...), GSTIN, statutory tasks, notices, DSC lockers, UTRs, or workspaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg font-bold">
              ESC
            </span>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/70 transition"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Category Filter Pills */}
        <div className="px-3.5 sm:px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs font-bold text-slate-600">
          {[
            { id: "ALL" as FilterCategory, label: "All Results", count: counts.ALL },
            { id: "CLIENTS" as FilterCategory, label: "Clients", count: counts.CLIENTS },
            { id: "TASKS" as FilterCategory, label: "Filings", count: counts.TASKS },
            { id: "NOTICES" as FilterCategory, label: "Notices", count: counts.NOTICES },
            { id: "DSC" as FilterCategory, label: "DSC Vault", count: counts.DSC },
            { id: "KEYS" as FilterCategory, label: "Portal Keys", count: counts.KEYS },
            { id: "BILLING" as FilterCategory, label: "Invoices", count: counts.BILLING },
            { id: "DOCS" as FilterCategory, label: "Documents", count: counts.DOCS },
            { id: "WORKSPACES" as FilterCategory, label: "Tools", count: counts.WORKSPACES },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 text-[11px] ${
                activeCategory === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 3. Actionable Results List */}
        <div 
          ref={listContainerRef}
          className="overflow-y-auto p-3 sm:p-4 space-y-1.5 flex-1 divide-y divide-slate-100"
        >
          {flattenedResults.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                No matching records found for &ldquo;{query}&rdquo;
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching by client legal name, PAN (e.g. AABCA...), GSTIN, notice section (148, DRC-01), or workspace name (2B, CFO, 3CD).
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                {["Pratwi", "AANCP9915B", "GSTR-3B", "148", "DSC", "CFO", "2B"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="text-[11px] font-bold text-btred-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition"
                  >
                    Try &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            flattenedResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.actionTab)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-between text-xs group ${
                    isSelected
                      ? "bg-red-50/70 border border-red-200 shadow-xs"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-btred-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${item.badgeStyle || "bg-slate-100 text-slate-700"}`}>
                            {item.badge}
                          </span>
                        )}
                        {item.extra && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.extra}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="hidden sm:inline text-[10px] font-bold text-slate-400 group-hover:text-btred-600 transition">
                      Jump to desk
                    </span>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      isSelected ? "text-btred-600" : "text-slate-400 group-hover:text-slate-700"
                    }`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Universal Search Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Brains &amp; Taxes Practice OS</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Showing {flattenedResults.length} indexed records
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">
              &uarr; &darr; Navigate
            </span>
            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">
              &crarr; Select
            </span>
            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">
              ESC Exit
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
