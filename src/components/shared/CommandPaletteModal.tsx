"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useClientContext, type CommandPaletteFilter } from "@/lib/context/ClientContext";
import type {
  ClientEntity,
  ComplianceTask,
  NoticeRecord,
  DscRecord,
  PortalCredential,
  InvoiceItem,
  DocumentItem,
} from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
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
  LayoutDashboard,
  List,
  Copy,
  Check,
  Briefcase,
  History,
  Loader2,
  ClipboardCheck,
  Package,
  Users,
} from "lucide-react";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  initialCategory?: CommandPaletteFilter;
  clients?: ClientEntity[];
  tasks?: ComplianceTask[];
  notices?: NoticeRecord[];
  dscTokens?: DscRecord[];
  portalCredentials?: PortalCredential[];
  invoices?: InvoiceItem[];
  documents?: DocumentItem[];
}

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

const WORKSPACE_TOOLS: WorkspaceTool[] = [
  { id: "dashboard", name: "Practice Dashboard", tabId: "dashboard", category: "Overview", description: "Firm overview, pending filings & KPIs", keywords: ["home", "overview", "summary"], icon: LayoutDashboard, accentColor: "text-slate-700", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "tasks-matrix", name: "Task Center", tabId: "tasks-matrix", category: "Compliance", description: "Filing assignments, staff workload & status", keywords: ["tasks", "matrix", "assign", "staff"], icon: ClipboardCheck, accentColor: "text-red-600", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  { id: "calendar", name: "Tax Deadlines", tabId: "calendar", category: "Compliance", description: "GST, ITR, TDS & ROC due dates", keywords: ["compliance", "calendar", "due date", "deadlines"], icon: Calendar, accentColor: "text-red-600", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  { id: "batch-dispatch", name: "Batch Dispatch", tabId: "batch-dispatch", category: "Compliance", description: "Bulk send filed returns & acknowledgments", keywords: ["batch", "outward", "dispatch", "acknowledgment"], icon: Sparkles, accentColor: "text-amber-600", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "inward-outward", name: "Inward / Outward Registers", tabId: "inward-outward", category: "Compliance", description: "Client document register tracking", keywords: ["register", "inward", "outward"], icon: Package, accentColor: "text-slate-600", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "autonomous-orchestrator", name: "Automation & Rules", tabId: "autonomous-orchestrator", category: "Compliance", description: "Autopilot cycles & statutory schedules", keywords: ["autopilot", "automation", "cron", "sweep"], icon: Sparkles, accentColor: "text-emerald-600", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "staff-master", name: "Team & Access Control", tabId: "staff-master", category: "Compliance", description: "Staff roster, tiers & module permissions", keywords: ["team", "staff", "article", "permissions", "directory"], icon: Users, accentColor: "text-indigo-600", badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "gst-filing", name: "GST Filing Desk", tabId: "gst-filing", category: "GST", description: "GSTR-1, GSTR-3B return status & ARN tracking", keywords: ["gst", "gstr-1", "gstr-3b", "filing"], icon: FileCheck2, accentColor: "text-purple-600", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "gstr1", name: "GSTR-1 Outward Workbench", tabId: "gstr1", category: "GST", description: "Sales register, B2B/B2CL/B2CS, HSN Table 12 & GSTN JSON", keywords: ["gstr-1", "gstr1", "outward", "sales", "hsn", "b2b"], icon: TrendingUp, accentColor: "text-purple-600", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "gstr2b", name: "GSTR-2B Reconciler", tabId: "gstr2b", category: "GST", description: "Match purchase register vs 2B, flag ITC gaps", keywords: ["2b", "gstr-2b", "itc", "reco", "reconcile"], icon: Layers, accentColor: "text-purple-600", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "gst-ims", name: "GST IMS Desk", tabId: "gst-ims", category: "GST", description: "Invoice Management System accept/reject actions", keywords: ["ims", "invoice management"], icon: ClipboardCheck, accentColor: "text-purple-700", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "pillar-one-gst", name: "GST Annual & Audit", tabId: "pillar-one-gst", category: "GST", description: "GSTR-9 / 9C annual reconciliation", keywords: ["gstr-9", "9c", "gst audit", "rule 42"], icon: Layers, accentColor: "text-purple-600", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "entity-dna", name: "GSTIN & Entity Profile", tabId: "entity-dna", category: "GST", description: "Client GSTINs, MCA directors & entity structure", keywords: ["dna", "gstin", "entity", "directors"], icon: Building2, accentColor: "text-cyan-600", badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "itr-matrix", name: "ITR Matrix", tabId: "itr-matrix", category: "Tax", description: "Income tax filing tracker across clients", keywords: ["itr", "income tax", "return"], icon: FileCheck2, accentColor: "text-emerald-700", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "ais-analyzer", name: "AIS / 26AS Analyzer", tabId: "ais-analyzer", category: "Tax", description: "TDS cross-check & high-value SFT items", keywords: ["ais", "26as", "tis", "sft", "tds"], icon: FileText, accentColor: "text-teal-600", badgeColor: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "pillar-five-tds", name: "TDS & TRACES", tabId: "pillar-five-tds", category: "Tax", description: "24Q/26Q returns, Challan 281 & defaults", keywords: ["tds", "26q", "24q", "traces", "281"], icon: Calculator, accentColor: "text-teal-700", badgeColor: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "pillar-three-audit", name: "Form 3CD Workpaper", tabId: "pillar-three-audit", category: "Audit", description: "Tax audit clauses, MSME 43B(h) & Clause 44", keywords: ["3cd", "form 3cd", "tax audit", "clause 44", "43b(h)", "msme"], icon: FileCheck2, accentColor: "text-red-600", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  { id: "schedule3-audit", name: "Schedule III & CARO", tabId: "schedule3-audit", category: "Audit", description: "Balance sheet mapping & CARO 2020 clauses", keywords: ["schedule 3", "caro", "balance sheet", "trial balance"], icon: Calculator, accentColor: "text-blue-700", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "engagement-letter", name: "Engagement Letters", tabId: "engagement-letter", category: "Audit", description: "SA 210 engagement letters & fee terms", keywords: ["engagement", "sa 210", "letter", "contract"], icon: FileText, accentColor: "text-slate-600", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "notices", name: "Notice Center", tabId: "notices", category: "Litigation", description: "IT & GST notices, DIN check & due dates", keywords: ["notice", "scrutiny", "148", "143(2)", "drc-01", "din"], icon: ShieldAlert, accentColor: "text-amber-600", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "notice-drafter", name: "Notice Reply Drafter", tabId: "notice-drafter", category: "Litigation", description: "Draft replies for Sec 148, 143(2) & DRC-01", keywords: ["draft", "reply", "appeal", "cit(a)", "itat"], icon: Scale, accentColor: "text-red-700", badgeColor: "bg-red-50 text-red-700 border-red-200" },
  { id: "udin-vault", name: "UDIN Tracker", tabId: "udin-vault", category: "Regulatory", description: "60-day ICAI UDIN register & audit logs", keywords: ["udin", "icai", "certificate"], icon: Award, accentColor: "text-amber-700", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "peer-review", name: "Peer Review", tabId: "peer-review", category: "Regulatory", description: "ICAI quality review checklists", keywords: ["peer review", "icai", "sqc-1"], icon: CheckCircle2, accentColor: "text-green-700", badgeColor: "bg-green-50 text-green-700 border-green-200" },
  { id: "billing-matrix", name: "Invoices & Billing", tabId: "billing-matrix", category: "Finance", description: "SAC 9982 invoices, UTR receipts & WIP", keywords: ["billing", "invoice", "fees", "utr", "receipt", "wip"], icon: CreditCard, accentColor: "text-emerald-600", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "pay-to-release", name: "Pay-to-Release", tabId: "pay-to-release", category: "Finance", description: "Gate deliverables behind UPI & verify UTR", keywords: ["pay to release", "lock", "upi", "utr", "release"], icon: Lock, accentColor: "text-rose-600", badgeColor: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "bank-parser", name: "Bank Statement Parser", tabId: "bank-parser", category: "Finance", description: "Parse bank PDFs to Tally XML & reconcile", keywords: ["bank", "statement", "parser", "tally", "pdf"], icon: Sparkles, accentColor: "text-amber-600", badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "client-master", name: "Client Master", tabId: "client-master", category: "Client Desk", description: "Add, edit, CSV import & share client PINs", keywords: ["client", "onboard", "csv", "pin", "master"], icon: Building2, accentColor: "text-blue-600", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "dsc", name: "DSC & Portal Keys", tabId: "dsc", category: "Vault", description: "USB DSC custody & government portal logins", keywords: ["dsc", "token", "usb", "keys", "password", "portal"], icon: KeyRound, accentColor: "text-blue-600", badgeColor: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "whatsapp-ai", name: "WhatsApp Desk", tabId: "whatsapp-ai", category: "Client Desk", description: "WhatsApp document intake & reminders", keywords: ["whatsapp", "chat", "intake", "message"], icon: MessageSquare, accentColor: "text-emerald-600", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "assessee-approval", name: "Client Sign-off", tabId: "assessee-approval", category: "Client Desk", description: "Director SA 580 approval on draft returns", keywords: ["assessee", "approval", "sign-off", "director"], icon: UserCheck, accentColor: "text-sky-600", badgeColor: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "vcfo", name: "Virtual CFO", tabId: "vcfo", category: "Advisory", description: "Cash flow, CMA ratios & working capital", keywords: ["vcfo", "cfo", "cma", "ratios", "cashflow"], icon: TrendingUp, accentColor: "text-indigo-600", badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

const CATEGORY_ORDER = [
  "Overview",
  "Compliance",
  "GST",
  "Tax",
  "Audit",
  "Litigation",
  "Finance",
  "Client Desk",
  "Regulatory",
  "Vault",
  "Advisory",
];

interface FlatResultItem {
  id: string;
  type: CommandPaletteFilter;
  title: string;
  subtitle: string;
  badge?: string;
  badgeStyle?: string;
  extra?: string;
  actionTab?: string;
  entityId?: string;
  client?: ClientEntity;
  icon: React.ComponentType<{ className?: string }>;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  initialCategory = "ALL",
  clients = [],
  tasks = [],
  notices = [],
  dscTokens = [],
  portalCredentials = [],
  invoices = [],
  documents = [],
}) => {
  const {
    selectedClient,
    isFirmWideView,
    recentClients,
    selectClient,
    clearClientContext,
  } = useClientContext();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CommandPaletteFilter>(initialCategory);
  const [clientTypeFilter, setClientTypeFilter] = useState("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Server-backed paginated client search for scale without upfront payload bloat
  const [serverClients, setServerClients] = useState<ClientEntity[] | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [serverTotal, setServerTotal] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveCategory(initialCategory || "ALL");
      setClientTypeFilter("ALL");
      setSelectedIndex(0);
      setPage(1);
      setViewMode("list");
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen, initialCategory]);

  const fetchServerClients = useCallback(async (qText: string, typeVal: string, targetPage: number) => {
    setIsSearchingServer(true);
    try {
      const params = new URLSearchParams({
        q: qText,
        type: typeVal,
        page: String(targetPage),
        limit: "12",
      });
      const res = await fetch(`/api/clients/search?${params.toString()}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.clients)) {
          setServerClients(data.clients);
          setServerTotal(typeof data.total === "number" ? data.total : data.clients.length);
          setTotalPages(data.totalPages || 1);
        }
      }
    } catch {
      setServerClients(null);
    } finally {
      setIsSearchingServer(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchServerClients(query, clientTypeFilter, page);
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen, query, clientTypeFilter, page, fetchServerClients]);

  const q = query.toLowerCase().trim();

  const matchedClients = useMemo(() => {
    const source = serverClients !== null ? serverClients : clients;
    const filteredByType =
      clientTypeFilter === "ALL" ? source : source.filter((c) => c.type === clientTypeFilter);
    if (!q) return filteredByType.slice(0, activeCategory === "CLIENTS" ? 12 : 6);
    if (serverClients !== null) return filteredByType;
    return filteredByType.filter((c) =>
      [c.name, c.pan, c.gstin, c.groupName, c.partnerInCharge, c.type, c.primaryContact?.name, c.primaryContact?.phone]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [serverClients, clients, clientTypeFilter, q, activeCategory]);

  const matchedTasks = useMemo(() => {
    if (!q) return tasks.slice(0, 5);
    return tasks.filter((t) =>
      [t.title, t.entityName, t.category, t.status, t.period, t.dueDate, t.officialUdin, t.arnNumber]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [tasks, q]);

  const matchedNotices = useMemo(() => {
    if (!q) return notices.slice(0, 4);
    return notices.filter((n) =>
      [n.section, n.entityName, n.authority, n.dinNumber, n.summary, n.status, n.riskLevel]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [notices, q]);

  const matchedDscs = useMemo(() => {
    if (!q) return dscTokens.slice(0, 4);
    return dscTokens.filter((d) =>
      [d.holderName, d.entityName, d.vaultSlot, d.serialNumber, d.currentCustodian]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [dscTokens, q]);

  const matchedKeys = useMemo(() => {
    if (!q) return portalCredentials.slice(0, 4);
    return portalCredentials.filter((k) =>
      [k.portalName, k.portalType, k.entityName, k.username, k.secondaryIdentifier]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [portalCredentials, q]);

  const matchedInvoices = useMemo(() => {
    if (!q) return invoices.slice(0, 4);
    return invoices.filter(
      (inv) =>
        [inv.invoiceNo, inv.entityName, inv.serviceDescription, inv.clientUtrNumber, inv.status]
          .some((v) => v?.toLowerCase().includes(q)) || inv.amount?.toString().includes(q)
    );
  }, [invoices, q]);

  const matchedDocuments = useMemo(() => {
    if (!q) return documents.slice(0, 4);
    return documents.filter((doc) =>
      [doc.fileName, doc.entityName, doc.category, doc.financialYear]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [documents, q]);

  const matchedWorkspaces = useMemo(() => {
    if (!q) return WORKSPACE_TOOLS;
    return WORKSPACE_TOOLS.filter((w) =>
      [w.name, w.category, w.description, ...w.keywords].some((v) => v.toLowerCase().includes(q))
    );
  }, [q]);

  // All hooks MUST run before any early return (`if (!isOpen) return null;`)
  const groupedTools = useMemo(() => {
    const grps: Record<string, WorkspaceTool[]> = {};
    const tools = q ? matchedWorkspaces : WORKSPACE_TOOLS;
    tools.forEach((t) => {
      if (!grps[t.category]) grps[t.category] = [];
      grps[t.category].push(t);
    });
    return CATEGORY_ORDER.filter((cat) => grps[cat]?.length > 0).map((cat) => ({
      category: cat,
      tools: grps[cat],
    }));
  }, [matchedWorkspaces, q]);

  const flattenedResults = useMemo<FlatResultItem[]>(() => {
    const list: FlatResultItem[] = [];

    if (activeCategory === "ALL" || activeCategory === "CLIENTS") {
      matchedClients.forEach((c) => {
        const contactStr = c.primaryContact?.name
          ? `${c.primaryContact.name}${c.primaryContact.phone ? ` (${c.primaryContact.phone})` : ""}`
          : "No primary contact";
        list.push({
          id: `client-${c.id}`,
          type: "CLIENTS",
          title: c.name,
          subtitle: `${c.groupName || "Direct Client"} · ${contactStr} · ₹${c.turnoverCr || 0} Cr`,
          badge: c.type.replace("_", " "),
          badgeStyle: "bg-slate-100 text-slate-700 border border-slate-200 text-[10px]",
          extra: `PAN ${c.pan}${c.gstin ? ` · ${c.gstin}` : ""}`,
          client: c,
          entityId: c.id,
          icon: Building2,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "WORKSPACES") {
      matchedWorkspaces.forEach((w) => {
        list.push({
          id: `ws-${w.id}`,
          type: "WORKSPACES",
          title: w.name,
          subtitle: w.description,
          badge: w.category,
          badgeStyle: `${w.badgeColor} border text-[10px] font-semibold`,
          actionTab: w.tabId,
          icon: w.icon,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "TASKS") {
      matchedTasks.forEach((t) => {
        list.push({
          id: `task-${t.id}`,
          type: "TASKS",
          title: t.title,
          subtitle: `${t.entityName} · Due ${t.dueDate}${t.period ? ` · ${t.period}` : ""}`,
          badge: t.category,
          badgeStyle: "bg-red-50 text-red-700 font-semibold border border-red-200 text-[10px]",
          extra: t.status,
          actionTab: "tasks-matrix",
          entityId: t.entityId,
          icon: Calendar,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "NOTICES") {
      matchedNotices.forEach((n) => {
        list.push({
          id: `notice-${n.id}`,
          type: "NOTICES",
          title: `${n.authority?.replace("_", " ")} – ${n.section}`,
          subtitle: `${n.entityName} · Deadline ${n.statutoryDeadline} · ₹${(n.demandAmount || 0).toLocaleString("en-IN")}`,
          badge: n.riskLevel || "SCRUTINY",
          badgeStyle:
            n.riskLevel === "CRITICAL"
              ? "bg-red-600 text-white font-bold text-[10px]"
              : "bg-amber-50 text-amber-800 border border-amber-300 font-semibold text-[10px]",
          extra: n.dinNumber ? `DIN: ${n.dinNumber}` : undefined,
          actionTab: "notices",
          entityId: n.entityId,
          icon: ShieldAlert,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "BILLING") {
      matchedInvoices.forEach((inv) => {
        list.push({
          id: `inv-${inv.id}`,
          type: "BILLING",
          title: `${inv.invoiceNo} · ₹${(inv.amount || 0).toLocaleString("en-IN")}`,
          subtitle: `${inv.entityName} · ${inv.serviceDescription}`,
          badge: inv.status,
          badgeStyle:
            inv.status === "PAID"
              ? "bg-emerald-100 text-emerald-800 font-semibold text-[10px]"
              : "bg-amber-100 text-amber-900 font-semibold text-[10px]",
          extra: inv.clientUtrNumber ? `UTR: ${inv.clientUtrNumber}` : undefined,
          actionTab: "billing-matrix",
          entityId: inv.entityId,
          icon: CreditCard,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "DSC") {
      matchedDscs.forEach((d) => {
        list.push({
          id: `dsc-${d.id}`,
          type: "DSC",
          title: `DSC – ${d.holderName}`,
          subtitle: `${d.entityName} · ${d.currentCustodian || "In Safe"} · Exp ${d.validTill}`,
          badge: d.vaultSlot || "Vault",
          badgeStyle: "bg-blue-50 text-blue-700 font-mono border border-blue-200 text-[10px]",
          actionTab: "dsc",
          entityId: d.entityId,
          icon: KeyRound,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "KEYS") {
      matchedKeys.forEach((k) => {
        list.push({
          id: `key-${k.id}`,
          type: "KEYS",
          title: k.portalName,
          subtitle: `${k.entityName} · ${k.portalType} · ${k.username}`,
          badge: "Portal Key",
          badgeStyle: "bg-purple-50 text-purple-700 font-semibold border border-purple-200 text-[10px]",
          actionTab: "dsc",
          entityId: k.entityId,
          icon: Lock,
        });
      });
    }

    if (activeCategory === "ALL" || activeCategory === "DOCS") {
      matchedDocuments.forEach((doc) => {
        list.push({
          id: `doc-${doc.id}`,
          type: "DOCS",
          title: doc.fileName,
          subtitle: `${doc.entityName} · ${doc.category} · ${doc.financialYear || "Active FY"}`,
          badge: doc.reviewStatus || "Vault",
          badgeStyle: "bg-slate-100 text-slate-600 border border-slate-200 text-[10px]",
          actionTab: "inward-outward",
          entityId: doc.entityId,
          icon: FolderOpen,
        });
      });
    }

    return list;
  }, [
    activeCategory,
    matchedClients,
    matchedWorkspaces,
    matchedTasks,
    matchedNotices,
    matchedInvoices,
    matchedDscs,
    matchedKeys,
    matchedDocuments,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [flattenedResults.length, activeCategory]);

  if (!isOpen) return null;

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(`${label}-${text}`);
    toast.success("Copied", `${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handlePickItem = (item: FlatResultItem, preferredGstin?: string) => {
    if (item.type === "CLIENTS" && item.client) {
      selectClient(item.client, preferredGstin);
      toast.success("Client Active", `${item.client.name}${preferredGstin ? ` (${preferredGstin})` : ""}`);
      onClose();
      return;
    }

    if (item.entityId) {
      const entityMatch =
        clients.find((c) => c.id === item.entityId) ||
        serverClients?.find((c) => c.id === item.entityId);
      if (entityMatch) {
        selectClient(entityMatch, preferredGstin);
      }
    }
    if (item.actionTab) {
      onNavigate(item.actionTab);
    }
    onClose();
  };

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown" && flattenedResults.length > 0) {
      e.preventDefault();
      setSelectedIndex((p) => (p < flattenedResults.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp" && flattenedResults.length > 0) {
      e.preventDefault();
      setSelectedIndex((p) => (p > 0 ? p - 1 : flattenedResults.length - 1));
    } else if (e.key === "Enter" && flattenedResults.length > 0) {
      e.preventDefault();
      const cur = flattenedResults[selectedIndex];
      if (cur) handlePickItem(cur);
    }
  };

  const counts = {
    ALL:
      matchedClients.length +
      matchedWorkspaces.length +
      matchedTasks.length +
      matchedNotices.length +
      matchedDscs.length +
      matchedKeys.length +
      matchedInvoices.length +
      matchedDocuments.length,
    CLIENTS: serverTotal !== null && activeCategory === "CLIENTS" ? serverTotal : matchedClients.length,
    WORKSPACES: matchedWorkspaces.length,
    TASKS: matchedTasks.length,
    NOTICES: matchedNotices.length,
    BILLING: matchedInvoices.length,
    DSC: matchedDscs.length,
    KEYS: matchedKeys.length,
    DOCS: matchedDocuments.length,
  };

  const showGrid = viewMode === "grid" && activeCategory === "WORKSPACES" && !q;
  const showRecentRow =
    activeCategory === "CLIENTS" &&
    !q &&
    recentClients.length > 1 &&
    (serverTotal || clients.length) > 4;

  const quickExamples = [
    clients[0]?.name?.split(" ")[0],
    clients[0]?.pan,
    "GSTR-2B",
    "148",
    "Pay-to-Release",
  ].filter(Boolean) as string[];

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-start justify-center pt-3 sm:pt-10 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[86vh] transition-all ${
          showGrid ? "max-w-4xl" : "max-w-2xl"
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleItemKeyDown}
      >
        {/* Top Search Input */}
        <div className="p-3 sm:p-3.5 border-b border-slate-100 flex items-center gap-2.5 shrink-0">
          {isSearchingServer ? (
            <Loader2 className="w-4 h-4 text-btred-logo animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder={
              activeCategory === "CLIENTS"
                ? "Search client by name, PAN, GSTIN, phone, or group..."
                : "Search clients, PAN, GSTIN, tools, filings, notices, invoices..."
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="flex-1 bg-transparent text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {selectedClient && !isFirmWideView && (
            <button
              onClick={() => {
                clearClientContext();
                toast.info("All Clients View", "Cleared client filter.");
                onClose();
              }}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg transition shrink-0"
              title="Switch back to Firm-Wide view"
            >
              <Briefcase className="w-3 h-3" />
              <span>All Clients</span>
            </button>
          )}

          {!q && activeCategory === "WORKSPACES" && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0 gap-0.5">
              <button
                onClick={() => setViewMode("list")}
                title="List view"
                className={`p-1 rounded-md transition ${
                  viewMode === "list" ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title="Directory view"
                className={`p-1 rounded-md transition ${
                  viewMode === "grid" ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 bg-slate-50/60">
          {(
            [
              { id: "ALL", label: "All", count: counts.ALL },
              { id: "CLIENTS", label: "Clients", count: counts.CLIENTS },
              { id: "WORKSPACES", label: "Tools", count: counts.WORKSPACES },
              { id: "TASKS", label: "Filings", count: counts.TASKS },
              { id: "NOTICES", label: "Notices", count: counts.NOTICES },
              { id: "BILLING", label: "Invoices", count: counts.BILLING },
              { id: "DSC", label: "DSC", count: counts.DSC },
              { id: "KEYS", label: "Keys", count: counts.KEYS },
              { id: "DOCS", label: "Docs", count: counts.DOCS },
            ] as Array<{ id: CommandPaletteFilter; label: string; count: number }>
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 text-[11px] font-semibold ${
                activeCategory === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1 rounded-full font-bold ${
                  activeCategory === tab.id ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Entity Type Sub-Filters when in Clients tab */}
        {activeCategory === "CLIENTS" && (
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0 bg-white">
            <div className="flex items-center gap-1">
              {["ALL", "PVT_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "INDIVIDUAL_HNI"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setClientTypeFilter(t);
                    setPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                    clientTypeFilter === t
                      ? "bg-red-50 text-btred-logo border border-red-200"
                      : "text-slate-500 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  {t === "ALL" ? "All Types" : t.replace("_", " ")}
                </button>
              ))}
            </div>
            {selectedClient && !isFirmWideView && (
              <button
                onClick={() => {
                  clearClientContext();
                  onClose();
                }}
                className="sm:hidden text-[10px] font-bold text-btred-logo whitespace-nowrap"
              >
                Show All Clients
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {showGrid ? (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {groupedTools.map(({ category, tools }) => (
                <div key={category} className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                    {category}
                  </div>
                  {tools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          onNavigate(tool.tabId);
                          onClose();
                        }}
                        className="w-full text-left p-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition group"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className={`w-3.5 h-3.5 ${tool.accentColor} shrink-0`} />
                          <span className="text-xs font-semibold text-slate-800">{tool.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 pl-5">
                          {tool.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {showRecentRow && (
                <div className="px-1 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    <History className="w-3 h-3" />
                    <span>Recent</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentClients.slice(0, 4).map((rc) => (
                      <button
                        key={rc.id}
                        onClick={() => {
                          selectClient(rc);
                          toast.success("Client Active", rc.name);
                          onClose();
                        }}
                        className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                          selectedClient?.id === rc.id
                            ? "bg-red-50 border-red-300 text-btred-logo"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="truncate max-w-[160px]">{rc.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{rc.pan}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {flattenedResults.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Search className="w-5 h-5 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">
                    {query ? `No results for "${query}"` : "No records found"}
                  </h4>
                  {quickExamples.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5">
                      {quickExamples.map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded-lg transition"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                flattenedResults.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  const isClientItem = item.type === "CLIENTS" && item.client;
                  const isActiveClient = isClientItem && selectedClient?.id === item.client?.id && !isFirmWideView;

                  if (isClientItem && item.client) {
                    const c = item.client;
                    const gstins =
                      c.gstinRecords && c.gstinRecords.length > 0
                        ? c.gstinRecords
                        : c.gstin
                        ? [{ gstin: c.gstin, stateCode: c.gstin.slice(0, 2), stateName: "" }]
                        : [];

                    return (
                      <div
                        key={item.id}
                        onClick={() => handlePickItem(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                          isActiveClient
                            ? "bg-red-50/50 border-red-300"
                            : isSelected
                            ? "bg-slate-50 border-slate-300"
                            : "bg-white hover:bg-slate-50 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className={`w-4 h-4 shrink-0 ${isActiveClient ? "text-btred-logo" : "text-slate-500"}`} />
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{c.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase shrink-0">
                              {c.type.replace("_", " ")}
                            </span>
                            {isActiveClient && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-btred-logo text-[10px] font-bold shrink-0">
                                Selected
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pl-6 text-[11px]">
                          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg font-mono text-slate-700">
                            PAN: <strong>{c.pan}</strong>
                            <button
                              onClick={(e) => handleCopy(e, c.pan, "PAN")}
                              className="p-0.5 text-slate-400 hover:text-slate-700"
                              title="Copy PAN"
                            >
                              {copiedKey === `PAN-${c.pan}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>

                          {gstins.map((g) => (
                            <span
                              key={g.gstin}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePickItem(item, g.gstin);
                              }}
                              className="inline-flex items-center gap-1 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg font-mono text-blue-900 transition"
                              title="Select this GSTIN"
                            >
                              {g.stateName ? `${g.stateCode} · ` : "GSTIN: "}
                              <strong>{g.gstin}</strong>
                              <button
                                onClick={(e) => handleCopy(e, g.gstin, "GSTIN")}
                                className="p-0.5 text-blue-500 hover:text-blue-800"
                                title="Copy GSTIN"
                              >
                                {copiedKey === `GSTIN-${g.gstin}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          ))}

                          {c.primaryContact?.name && (
                            <span className="text-slate-500">
                              {c.primaryContact.name}
                              {c.primaryContact.phone ? ` · ${c.primaryContact.phone}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handlePickItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? "bg-slate-100 border border-slate-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-px rounded text-[10px] font-semibold uppercase ${
                                item.badgeStyle || "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.extra && <span className="text-[10px] text-slate-400 font-mono">{item.extra}</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.subtitle}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span>{showGrid ? WORKSPACE_TOOLS.length : flattenedResults.length} shown</span>
            {activeCategory === "CLIENTS" && totalPages > 1 && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-0.5 rounded border border-slate-200 bg-white disabled:opacity-40 font-semibold"
                >
                  Prev
                </button>
                <span>
                  {page}/{totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-0.5 rounded border border-slate-200 bg-white disabled:opacity-40 font-semibold"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <kbd className="bg-white border border-slate-200 px-1.5 py-px rounded font-mono">↑↓</kbd>
            <kbd className="bg-white border border-slate-200 px-1.5 py-px rounded font-mono">↵</kbd>
            <kbd className="bg-white border border-slate-200 px-1.5 py-px rounded font-mono">Esc</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
