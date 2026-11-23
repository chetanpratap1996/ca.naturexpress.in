"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { 
  Search, 
  Building2, 
  FileText, 
  KeyRound, 
  ShieldAlert, 
  X, 
  Sparkles,
  CheckCircle2,
  Lock,
  CreditCard,
  Layers,
  Scale,
  Calendar,
  FolderOpen,
  MessageSquare,
  FileCheck2,
  Calculator,
  UserCheck,
  TrendingUp,
  Award,
  ChevronRight,
  LayoutGrid,
  List
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
  badgeColor: string;
}

// Clean, plain-English tool definitions — no jargon marketing badges
const WORKSPACE_TOOLS: WorkspaceTool[] = [
  {
    id: "calendar",
    name: "Tax Deadlines",
    tabId: "calendar",
    category: "Compliance",
    description: "GST, ITR, ROC & advance tax due dates",
    keywords: ["compliance", "statutory", "calendar", "due date", "filing", "deadlines", "mca", "roc"],
    icon: Calendar,
    accentColor: "text-red-600",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
  },
  {
    id: "entity-dna",
    name: "Entity Profile",
    tabId: "entity-dna",
    category: "Compliance",
    description: "MCA directors, promoter groups & Sch. III ledgers",
    keywords: ["dna", "taxonomy", "schedule 3", "entity", "profile", "directors", "mca"],
    icon: Building2,
    accentColor: "text-cyan-600",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    id: "engagement-letter",
    name: "Engagement Letter",
    tabId: "engagement-letter",
    category: "Compliance",
    description: "SA 210 audit engagement contracts & fee letters",
    keywords: ["engagement", "letter", "sa 210", "contract", "terms", "scope"],
    icon: FileText,
    accentColor: "text-slate-600",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    id: "gstr2b",
    name: "GSTR-2B Reconciler",
    tabId: "gstr2b",
    category: "GST",
    description: "Match purchase register vs 2B, flag ITC mismatches",
    keywords: ["2b", "gstr-2b", "gstr-3b", "itc", "gst reco", "reconcile", "reversal", "clause 44"],
    icon: Layers,
    accentColor: "text-purple-600",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "ais-analyzer",
    name: "AIS / 26AS Analyzer",
    tabId: "ais-analyzer",
    category: "Tax",
    description: "TDS cross-check & high-value SFT transaction audit",
    keywords: ["ais", "26as", "tis", "tds", "194q", "sft", "tax credit", "annual information statement"],
    icon: FileText,
    accentColor: "text-teal-600",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    id: "itr-calc",
    name: "ITR Calculator",
    tabId: "itr-calc",
    category: "Tax",
    description: "Income tax computation with Ch. VI-A deductions",
    keywords: ["itr", "income tax", "computation", "tax calculation", "corporate tax", "advance tax"],
    icon: Calculator,
    accentColor: "text-emerald-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "tax-audit-3cd",
    name: "Form 3CD Workpaper",
    tabId: "tax-audit-3cd",
    category: "Audit",
    description: "Clause 44 GST reco & Sec 43B(h) MSME compliance",
    keywords: ["3cd", "form 3cd", "tax audit", "clause 44", "43b(h)", "msme", "workpaper"],
    icon: FileCheck2,
    accentColor: "text-red-600",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
  },
  {
    id: "schedule3-audit",
    name: "Schedule III Engine",
    tabId: "schedule3-audit",
    category: "Audit",
    description: "Statutory balance sheet, P&L & CARO 2020 reporting",
    keywords: ["schedule 3", "schedule iii", "caro", "balance sheet", "p&l", "companies act", "statutory audit"],
    icon: Calculator,
    accentColor: "text-blue-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "bank-parser",
    name: "Bank Statement Parser",
    tabId: "bank-parser",
    category: "Audit",
    description: "Auto-decrypt bank PDFs → Tally XML vouchers",
    keywords: ["bank", "statement", "decryptor", "password", "strip", "parser", "transactions", "pdf"],
    icon: Sparkles,
    accentColor: "text-amber-600",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "notices",
    name: "Notice Center",
    tabId: "notices",
    category: "Litigation",
    description: "IT & GST notices, DRC-01 scrutiny triage",
    keywords: ["notice", "scrutiny", "148", "143(2)", "drc-01", "asmt-10", "reopening", "scn", "demand"],
    icon: ShieldAlert,
    accentColor: "text-amber-600",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "notice-drafter",
    name: "Notice Reply Drafter",
    tabId: "notice-drafter",
    category: "Litigation",
    description: "AI-drafted replies for Sec 148, 143(2), DRC-01",
    keywords: ["draft", "reply", "drafter", "appeal", "legal brief", "cit(a)", "itat", "section 148"],
    icon: Scale,
    accentColor: "text-red-700",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
  },
  {
    id: "pay-to-release",
    name: "Pay-to-Release",
    tabId: "pay-to-release",
    category: "Finance",
    description: "Lock deliverables behind UPI — auto-release on payment",
    keywords: ["pay to release", "gated", "locked", "delivery", "release", "documents", "signed reports"],
    icon: Lock,
    accentColor: "text-rose-600",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "billing",
    name: "Invoices & Fees",
    tabId: "billing",
    category: "Finance",
    description: "Fee invoices, UTR receipts & unbilled WIP",
    keywords: ["billing", "invoice", "fees", "utr", "payment", "receipt", "bank transfer", "wip"],
    icon: CreditCard,
    accentColor: "text-emerald-600",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "vcfo",
    name: "Virtual CFO",
    tabId: "vcfo",
    category: "Advisory",
    description: "Cash flow, CMA ratios & working capital health",
    keywords: ["vcfo", "cfo", "cma", "ratios", "runway", "dscr", "cashflow", "working capital"],
    icon: TrendingUp,
    accentColor: "text-indigo-600",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "whatsapp-ai",
    name: "WhatsApp Desk",
    tabId: "whatsapp-ai",
    category: "Client Desk",
    description: "Doc intake, invoice extraction & bulk dispatch",
    keywords: ["whatsapp", "ai", "chat", "intake", "dispatch", "mobile", "client messaging"],
    icon: MessageSquare,
    accentColor: "text-emerald-600",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "assessee-approval",
    name: "Client Sign-off",
    tabId: "assessee-approval",
    category: "Client Desk",
    description: "Director e-approval on draft returns before filing",
    keywords: ["assessee", "approval", "sign-off", "director", "promoter", "e-sign"],
    icon: UserCheck,
    accentColor: "text-sky-600",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    id: "udin-vault",
    name: "UDIN Tracker",
    tabId: "udin-vault",
    category: "Regulatory",
    description: "60-day ICAI UDIN generation & audit cert logs",
    keywords: ["udin", "icai", "certificate", "audit report", "frn", "generation"],
    icon: Award,
    accentColor: "text-amber-700",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "peer-review",
    name: "Peer Review",
    tabId: "peer-review",
    category: "Regulatory",
    description: "ICAI quality review checklists & ethics trail",
    keywords: ["peer review", "icai", "quality review", "ethics", "frn: 022998c", "compliance"],
    icon: CheckCircle2,
    accentColor: "text-green-700",
    badgeColor: "bg-green-50 text-green-700 border-green-200",
  },
  {
    id: "dsc",
    name: "DSC & Key Vault",
    tabId: "dsc",
    category: "Vault",
    description: "USB DSC custody, locker slots & portal passwords",
    keywords: ["dsc", "token", "usb", "vault", "locker", "slot", "keys", "password", "custody"],
    icon: KeyRound,
    accentColor: "text-blue-600",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
];

// Fixed category display order
const CATEGORY_ORDER = [
  "Compliance",
  "GST",
  "Tax",
  "Audit",
  "Litigation",
  "Finance",
  "Advisory",
  "Client Desk",
  "Regulatory",
  "Vault",
];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const { 
    clients = [], 
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
      setViewMode("list");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const q = query.toLowerCase().trim();

  const matchedClients = useMemo(() => {
    if (!q) return clients.slice(0, 5);
    return clients.filter((c) =>
      [c.name, c.pan, c.gstin, c.groupName, c.partnerInCharge, c.type,
       c.primaryContact?.name, c.primaryContact?.phone, c.primaryContact?.email]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [clients, q]);

  const matchedTasks = useMemo(() => {
    if (!q) return tasks.slice(0, 5);
    return tasks.filter((t) =>
      [t.title, t.entityName, t.category, t.status, t.period, t.dueDate, t.officialUdin, t.arnNumber]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [tasks, q]);

  const matchedNotices = useMemo(() => {
    if (!q) return notices.slice(0, 3);
    return notices.filter((n) =>
      [n.section, n.entityName, n.authority, n.dinNumber, n.summary, n.status, n.riskLevel, n.assessmentYear]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [notices, q]);

  const matchedDscs = useMemo(() => {
    if (!q) return dscTokens.slice(0, 3);
    return dscTokens.filter((d) =>
      [d.holderName, d.entityName, d.vaultSlot, d.serialNumber, d.currentCustodian, d.tokenType]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [dscTokens, q]);

  const matchedKeys = useMemo(() => {
    if (!q) return portalCredentials.slice(0, 3);
    return portalCredentials.filter((k) =>
      [k.portalName, k.portalType, k.entityName, k.username, k.secondaryIdentifier]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [portalCredentials, q]);

  const matchedInvoices = useMemo(() => {
    if (!q) return invoices.slice(0, 3);
    return invoices.filter((inv) =>
      [inv.invoiceNo, inv.entityName, inv.serviceDescription, inv.clientUtrNumber, inv.status]
        .some((v) => v?.toLowerCase().includes(q)) ||
      inv.amount?.toString().includes(q)
    );
  }, [invoices, q]);

  const matchedDocuments = useMemo(() => {
    if (!q) return documents.slice(0, 3);
    return documents.filter((doc) =>
      [doc.fileName, doc.entityName, doc.category, doc.financialYear]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [documents, q]);

  const matchedWorkspaces = useMemo(() => {
    if (!q) return WORKSPACE_TOOLS;
    return WORKSPACE_TOOLS.filter((w) =>
      [w.name, w.category, w.description, ...w.keywords]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [q]);

  interface FlatItem {
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

  const flattenedResults = useMemo<FlatItem[]>(() => {
    const list: FlatItem[] = [];

    if (activeCategory === "ALL" || activeCategory === "WORKSPACES") {
      matchedWorkspaces.forEach((w) => {
        list.push({
          id: `ws-${w.id}`, type: "WORKSPACES",
          title: w.name, subtitle: w.description,
          badge: w.category,
          badgeStyle: `${w.badgeColor} border text-[10px] font-semibold`,
          actionTab: w.tabId, icon: w.icon,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "CLIENTS") {
      matchedClients.forEach((c) => {
        list.push({
          id: `client-${c.id}`, type: "CLIENTS",
          title: c.name,
          subtitle: `${c.groupName || "Direct Client"} · ${c.partnerInCharge || "CA Gunjan Jain"} · ₹${c.turnoverCr}Cr`,
          badge: c.pan,
          badgeStyle: "bg-slate-100 text-slate-700 font-mono border border-slate-200 text-[10px]",
          extra: c.gstin ? `GST: ${c.gstin}` : undefined,
          actionTab: "calendar", icon: Building2,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "TASKS") {
      matchedTasks.forEach((t) => {
        list.push({
          id: `task-${t.id}`, type: "TASKS",
          title: t.title,
          subtitle: `${t.entityName} · Due ${t.dueDate}${t.period ? ` · ${t.period}` : ""}`,
          badge: t.category,
          badgeStyle: "bg-red-50 text-red-700 font-semibold border border-red-200 text-[10px]",
          extra: t.status,
          actionTab: "calendar", icon: Calendar,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "NOTICES") {
      matchedNotices.forEach((n) => {
        list.push({
          id: `notice-${n.id}`, type: "NOTICES",
          title: `${n.authority?.replace("_", " ")} – ${n.section}`,
          subtitle: `${n.entityName} · Deadline ${n.statutoryDeadline} · ₹${(n.demandAmount || 0).toLocaleString("en-IN")}`,
          badge: n.riskLevel || "SCRUTINY",
          badgeStyle: n.riskLevel === "CRITICAL"
            ? "bg-red-600 text-white font-bold text-[10px]"
            : "bg-amber-50 text-amber-800 border border-amber-300 font-semibold text-[10px]",
          extra: n.dinNumber ? `DIN: ${n.dinNumber}` : undefined,
          actionTab: "notices", icon: ShieldAlert,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "DSC") {
      matchedDscs.forEach((d) => {
        list.push({
          id: `dsc-${d.id}`, type: "DSC",
          title: `DSC – ${d.holderName}`,
          subtitle: `${d.entityName} · ${d.currentCustodian || "In Safe"} · Exp ${d.validTill}`,
          badge: d.vaultSlot || "Vault",
          badgeStyle: "bg-blue-50 text-blue-700 font-mono border border-blue-200 text-[10px]",
          actionTab: "dsc", icon: KeyRound,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "KEYS") {
      matchedKeys.forEach((k) => {
        list.push({
          id: `key-${k.id}`, type: "KEYS",
          title: k.portalName,
          subtitle: `${k.entityName} · ${k.portalType} · ${k.username}`,
          badge: "Portal Key",
          badgeStyle: "bg-purple-50 text-purple-700 font-semibold border border-purple-200 text-[10px]",
          actionTab: "dsc", icon: Lock,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "BILLING") {
      matchedInvoices.forEach((inv) => {
        list.push({
          id: `inv-${inv.id}`, type: "BILLING",
          title: `${inv.invoiceNo} · ₹${(inv.amount || 0).toLocaleString("en-IN")}`,
          subtitle: `${inv.entityName} · ${inv.serviceDescription}`,
          badge: inv.status,
          badgeStyle: inv.status === "PAID"
            ? "bg-emerald-100 text-emerald-800 font-semibold text-[10px]"
            : "bg-amber-100 text-amber-900 font-semibold text-[10px]",
          extra: inv.clientUtrNumber ? `UTR: ${inv.clientUtrNumber}` : undefined,
          actionTab: "billing", icon: CreditCard,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "DOCS") {
      matchedDocuments.forEach((doc) => {
        list.push({
          id: `doc-${doc.id}`, type: "DOCS",
          title: doc.fileName,
          subtitle: `${doc.entityName} · ${doc.category} · ${doc.financialYear || "FY25"}`,
          badge: doc.reviewStatus || "Vault",
          badgeStyle: "bg-slate-100 text-slate-600 border border-slate-200 text-[10px]",
          actionTab: "pay-to-release", icon: FolderOpen,
        });
      });
    }

    return list;
  }, [activeCategory, matchedWorkspaces, matchedClients, matchedTasks, matchedNotices, matchedDscs, matchedKeys, matchedInvoices, matchedDocuments]);

  useEffect(() => { setSelectedIndex(0); }, [flattenedResults.length, activeCategory]);

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((p) => (p < flattenedResults.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((p) => (p > 0 ? p - 1 : flattenedResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cur = flattenedResults[selectedIndex];
      if (cur) handleSelect(cur.actionTab);
    }
  };

  const handleSelect = (tabId: string) => { onNavigate(tabId); onClose(); };

  if (!isOpen) return null;

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

  // Group tools by category for grid/directory view
  const groupedTools = useMemo(() => {
    const grps: Record<string, WorkspaceTool[]> = {};
    const tools = q ? matchedWorkspaces : WORKSPACE_TOOLS;
    tools.forEach((t) => {
      if (!grps[t.category]) grps[t.category] = [];
      grps[t.category].push(t);
    });
    return CATEGORY_ORDER
      .filter((cat) => grps[cat]?.length > 0)
      .map((cat) => ({ category: cat, tools: grps[cat] }));
  }, [matchedWorkspaces, q]);

  // Grid view: show when explicitly toggled + tools-only context + no query
  const showGrid = viewMode === "grid"
    && (activeCategory === "ALL" || activeCategory === "WORKSPACES")
    && !q;

  // Wider modal for grid view
  const modalWidthClass = showGrid ? "max-w-4xl" : "max-w-2xl";

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-2 sm:pt-10 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] transition-all ${modalWidthClass}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleItemKeyDown}
      >
        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2.5 shrink-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools, clients, PAN, GSTIN, tasks, notices…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Grid / List toggle — only visible when browsing tools */}
          {!q && (activeCategory === "ALL" || activeCategory === "WORKSPACES") && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0 gap-0.5">
              <button
                onClick={() => setViewMode("list")}
                title="List view"
                className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title="Directory view"
                className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-700"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <kbd className="hidden sm:inline text-[10px] font-mono bg-slate-100 text-slate-400 px-1.5 py-px rounded border border-slate-200">ESC</kbd>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: "ALL" as FilterCategory,        label: "All",     count: counts.ALL },
            { id: "WORKSPACES" as FilterCategory,  label: "Tools",   count: counts.WORKSPACES },
            { id: "CLIENTS" as FilterCategory,     label: "Clients", count: counts.CLIENTS },
            { id: "TASKS" as FilterCategory,       label: "Filings", count: counts.TASKS },
            { id: "NOTICES" as FilterCategory,     label: "Notices", count: counts.NOTICES },
            { id: "DSC" as FilterCategory,         label: "DSC",     count: counts.DSC },
            { id: "KEYS" as FilterCategory,        label: "Keys",    count: counts.KEYS },
            { id: "BILLING" as FilterCategory,     label: "Invoices",count: counts.BILLING },
            { id: "DOCS" as FilterCategory,        label: "Docs",    count: counts.DOCS },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 text-[11px] font-semibold ${
                activeCategory === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1 rounded-full font-bold ${
                activeCategory === tab.id ? "bg-white/25 text-white" : "bg-slate-200 text-slate-500"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div ref={listContainerRef} className="overflow-y-auto flex-1">

          {/* ── GRID / DIRECTORY VIEW ── */}
          {showGrid ? (
            <div className="p-4 space-y-5">
              <p className="text-[11px] text-slate-400 font-medium">
                {WORKSPACE_TOOLS.length} practice workspaces · click any tool to open
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
                {groupedTools.map(({ category, tools }) => (
                  <div key={category} className="space-y-1.5">
                    {/* Column header */}
                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 pb-1 border-b border-slate-100">
                      {category}
                    </div>
                    {/* Tool cards */}
                    {tools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleSelect(tool.tabId)}
                          className="w-full text-left p-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition group"
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="w-5 h-5 rounded-md bg-slate-100 group-hover:bg-white border border-transparent group-hover:border-slate-200 flex items-center justify-center shrink-0 transition">
                              <Icon className={`w-3 h-3 ${tool.accentColor}`} />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 leading-tight">
                              {tool.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug pl-6 line-clamp-2">
                            {tool.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

          ) : (
            /* ── LIST VIEW ── */
            <div className="p-1.5 space-y-px">
              {flattenedResults.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No results for &ldquo;{query}&rdquo;</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Try a client name, PAN, GSTIN, notice section (148, DRC-01), or tool name.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5">
                    {["Pratwi", "AANCP9915B", "GSTR-3B", "148", "DSC", "CFO"].map((s) => (
                      <button key={s} onClick={() => setQuery(s)}
                        className="text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded-lg transition">
                        {s}
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
                      className={`px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-3 group ${
                        isSelected
                          ? "bg-slate-50 border border-slate-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
                          {item.badge && (
                            <span className={`px-1.5 py-px rounded text-[10px] font-semibold uppercase tracking-wide ${item.badgeStyle || "bg-slate-100 text-slate-600"}`}>
                              {item.badge}
                            </span>
                          )}
                          {item.extra && (
                            <span className="text-[10px] text-slate-400 font-mono">{item.extra}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? "text-slate-600" : "text-slate-300 group-hover:text-slate-500"
                      }`} />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-600 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              GPA & Co. Practice OS
            </span>
            <span className="hidden sm:inline">· {showGrid ? WORKSPACE_TOOLS.length : flattenedResults.length} results</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <kbd className="bg-white border border-slate-200 px-1.5 py-px rounded font-mono text-slate-500">↑↓</kbd>
            <kbd className="bg-white border border-slate-200 px-1.5 py-px rounded font-mono text-slate-500">↵ Open</kbd>
            <kbd className="bg-white border border-slate-200 px-1.5 py-px rounded font-mono text-slate-500">ESC</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
