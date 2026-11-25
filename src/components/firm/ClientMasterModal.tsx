"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ClientEntity,
  ClientGroup,
  DscRecord,
  GstComplianceHistoryItem,
  GstFilingFrequency,
  NoticeRecord,
  OnboardingMode,
  PortalCredential,
  PortalType,
} from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { inferConstitutionFromPan } from "@/lib/config/entityDna";
import {
  CLIENT_ARCHETYPE_BLUEPRINTS,
  evaluateClientOnboardingReadiness,
  normalizeGstApiReturns,
  parseAndValidateBulkClientCsv,
  ParsedCsvClientPreviewRow,
} from "@/lib/config/clientOnboardingMatrix";
import { isValidPan, isValidGstin } from "@/lib/utils";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { normalizePhone10 } from "@/lib/auth/session";
import { buildTemplateMessage, sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import {
  Users,
  Building2,
  Search,
  Plus,
  X,
  Upload,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  ArrowRight,
  Send,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  MessageSquare,
  Edit2,
  Trash2,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCheck,
  ClipboardCheck,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
} from "lucide-react";

interface ClientMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientEntity[];
  groups?: ClientGroup[];
  portalCredentials?: PortalCredential[];
  dscTokens?: DscRecord[];
  notices?: NoticeRecord[];
  onRefreshData?: () => Promise<void> | void;
  onAddClient: (newClient: any) => Promise<any> | any;
  onBatchImported?: () => Promise<void> | void;
  onUpdateClient?: (clientId: string, data: Partial<ClientEntity>) => Promise<any> | any;
  onDeleteClient?: (clientId: string) => Promise<void> | void;
}

export const ClientMasterModal: React.FC<ClientMasterModalProps> = ({
  isOpen,
  onClose,
  clients,
  groups = [],
  portalCredentials = [],
  dscTokens = [],
  notices = [],
  onRefreshData,
  onAddClient,
  onBatchImported,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [activeTab, setActiveTab] = useState<"directory" | "credentials" | "bulk" | "add">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedHealthFilter, setSelectedHealthFilter] = useState("ALL");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Live firm staff loaded from /api/staff
  const [staffDirectory, setStaffDirectory] = useState<Array<{ id: string; fullName: string; role: string; icaiRegNo?: string }>>([]);

  // Broadcast Queue Modal State
  const [isBroadcastQueueOpen, setIsBroadcastQueueOpen] = useState(false);
  const [broadcastIndex, setBroadcastIndex] = useState(0);
  const [dispatchedIds, setDispatchedIds] = useState<Set<string>>(new Set());
  const [whatsappMode, setWhatsappMode] = useState<"HANDOVER_KIT" | "LOGIN_ONLY">("HANDOVER_KIT");

  // Edit Client Modal State
  const [editingClient, setEditingClient] = useState<ClientEntity | null>(null);
  const [editEntityName, setEditEntityName] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editGstin, setEditGstin] = useState("");
  const [editCin, setEditCin] = useState("");
  const [editTan, setEditTan] = useState("");
  const [editGstFreq, setEditGstFreq] = useState<GstFilingFrequency>("MONTHLY");
  const [editOnboardingMode, setEditOnboardingMode] = useState<OnboardingMode>("CA_TAKEOVER");
  const [editType, setEditType] = useState<ClientEntity["type"]>("PVT_LTD");
  const [editContactName, setEditContactName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editTurnoverCr, setEditTurnoverCr] = useState("10.0");
  const [editAssignedArticle, setEditAssignedArticle] = useState("");
  const [editAssignedPartner, setEditAssignedPartner] = useState(DEFAULT_FIRM_BRANDING.managingPartner);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);

  // Baseline & Past Data Drawer State
  const [baselineClientId, setBaselineClientId] = useState<string | null>(null);
  const [syncingGstClientId, setSyncingGstClientId] = useState<string | null>(null);
  const [savingChecklistId, setSavingChecklistId] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Form State for Single Client
  const [entityName, setEntityName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [cin, setCin] = useState("");
  const [tan, setTan] = useState("");
  const [type, setType] = useState<ClientEntity["type"]>("PVT_LTD");
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>("CA_TAKEOVER");
  const [gstFilingFrequency, setGstFilingFrequency] = useState<GstFilingFrequency>("MONTHLY");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [assignedArticle, setAssignedArticle] = useState("");
  const [assignedPartner, setAssignedPartner] = useState(DEFAULT_FIRM_BRANDING.managingPartner);
  const [turnoverCr, setTurnoverCr] = useState("10.0");
  const [showDay1KeysSection, setShowDay1KeysSection] = useState(false);
  const [credItUser, setCredItUser] = useState("");
  const [credItPass, setCredItPass] = useState("");
  const [credGstUser, setCredGstUser] = useState("");
  const [credGstPass, setCredGstPass] = useState("");
  const [credMcaUser, setCredMcaUser] = useState("");
  const [credMcaPass, setCredMcaPass] = useState("");
  const [credTracesUser, setCredTracesUser] = useState("");
  const [credTracesPass, setCredTracesPass] = useState("");
  const [dscHolderName, setDscHolderName] = useState("");
  const [dscSerialNumber, setDscSerialNumber] = useState("");
  const [dscTokenType, setDscTokenType] = useState("ePass2003");
  const [dscValidTill, setDscValidTill] = useState("");
  const [dscVaultSlot, setDscVaultSlot] = useState("Cabinet A - Onboarding Safe");

  const [successToast, setSuccessToast] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState<ParsedCsvClientPreviewRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/staff", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.staff)) {
          const active = data.staff.filter((s: any) => s.status === "ACTIVE");
          setStaffDirectory(active);
          const firstPartner = active.find((s: any) => s.role === "MANAGING_PARTNER" || s.role === "PAID_CHARTERED_ACCOUNTANT");
          const firstAssociate = active.find((s: any) => s.role !== "MANAGING_PARTNER");
          if (firstPartner) setAssignedPartner((prev) => prev || firstPartner.fullName);
          if (firstAssociate) setAssignedArticle((prev) => prev || firstAssociate.fullName);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Live GSTIN Lookup & Mod-36 State
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [gstAutoData, setGstAutoData] = useState<{
    legalName?: string;
    tradeName?: string;
    status?: string;
    stateName?: string;
    taxpayerType?: string;
    address?: string;
    creditsRemaining?: number;
    filingHistory?: Array<{ returnType: string; returnPeriod: string; filingStatus: string; filingDate: string; arn: string }>;
    normalizedHistory?: GstComplianceHistoryItem[];
  } | null>(null);

  const handlePanChangeWithDecode = (rawVal: string) => {
    const clean = rawVal.toUpperCase();
    setPan(clean);
    if (clean.length === 10 && isValidPan(clean)) {
      const decoded = inferConstitutionFromPan(clean);
      if (decoded.isValid) setType(decoded.entityType);
    }
  };

  // 1-Click Live GSTIN Auto-fetch handler
  const handleFetchGstDetails = async (targetGstin?: string) => {
    const raw = targetGstin || gstin;
    const clean = raw.trim().toUpperCase();
    if (!clean) {
      toast.error("GSTIN Required", "Please enter a 15-character GSTIN first.");
      return;
    }

    const validation = validateGstinDetailed(clean);
    if (!validation.isValid) {
      toast.error("Invalid GSTIN Checksum", validation.error || "Please verify typos before calling GST portal.");
      return;
    }

    setIsFetchingGst(true);
    try {
      const res = await fetch(`/api/gst/lookup?gstin=${encodeURIComponent(clean)}&returns=true`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error("GST Portal Lookup Failed", data.error || "Unable to fetch taxpayer details.");
        return;
      }

      const p = data.data;
      const returns = data.returnsData?.returns || [];
      const normalizedHistory = normalizeGstApiReturns(returns);
      setGstAutoData({
        legalName: p.legalName,
        tradeName: p.tradeName,
        status: p.status,
        stateName: p.stateName,
        taxpayerType: p.taxpayerType,
        address: p.address,
        creditsRemaining: data.creditsRemaining,
        filingHistory: returns,
        normalizedHistory,
      });

      if (p.legalName) setEntityName(p.legalName);
      if (p.tradeName) setTradeName(p.tradeName);
      if (p.pan) handlePanChangeWithDecode(p.pan);
      if (p.taxpayerType && String(p.taxpayerType).toLowerCase().includes("comp")) {
        setGstFilingFrequency("COMPOSITION");
      }

      toast.success(
        "GSTIN Verified Live",
        `${p.legalName} (${p.status}) | ${p.stateName}. Legal details & return history captured!`
      );
    } catch (err: any) {
      toast.error("Network Error", err.message || "Failed to reach GST verification service.");
    } finally {
      setIsFetchingGst(false);
    }
  };

  const portalBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://ca.naturexpress.in";

  // Directory per-client live GST return history sync
  const handleSyncClientGstBaseline = async (client: ClientEntity) => {
    if (!client.gstin || !isValidGstin(client.gstin)) {
      toast.warning("GSTIN Required", `Add a valid 15-digit GSTIN for ${client.name} before syncing.`);
      return;
    }
    setSyncingGstClientId(client.id);
    try {
      const res = await fetch(`/api/gst/lookup?gstin=${encodeURIComponent(client.gstin)}&returns=true`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error("GST Sync Failed", data.error || "Unable to reach GST portal API.");
        return;
      }
      const returns = data.returnsData?.returns || [];
      const normalizedHistory = normalizeGstApiReturns(returns);
      const nextChecklist = {
        completedPortals: client.onboardingChecklist?.completedPortals || [],
        takeoverChecklistDone: client.onboardingChecklist?.takeoverChecklistDone || [],
        lastBaselineSyncAt: new Date().toISOString(),
      };
      const patchPayload: Partial<ClientEntity> = {
        tradeName: data.data?.tradeName || client.tradeName,
        gstHistory: normalizedHistory,
        onboardingChecklist: nextChecklist,
      };
      if (onUpdateClient) {
        await onUpdateClient(client.id, patchPayload);
      } else {
        await fetch("/api/clients", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: client.id, ...patchPayload }),
        });
      }
      if (onRefreshData) await onRefreshData();
      const unfiledCount = normalizedHistory.filter((h) => !h.arn || h.delayDays > 0).length;
      toast.success(
        "GST Baseline Synced",
        `${client.name}: ${normalizedHistory.length} return periods loaded (${unfiledCount} unfiled).`
      );
    } catch (err: any) {
      toast.error("GST Sync Error", err.message || "Network error during GST baseline sync.");
    } finally {
      setSyncingGstClientId(null);
    }
  };

  const handleToggleChecklistItem = async (client: ClientEntity, itemId: string) => {
    setSavingChecklistId(itemId);
    try {
      const currentDone = client.onboardingChecklist?.takeoverChecklistDone || [];
      const exists = currentDone.includes(itemId);
      const nextDone = exists ? currentDone.filter((x) => x !== itemId) : [...currentDone, itemId];
      const patchPayload: Partial<ClientEntity> = {
        onboardingChecklist: {
          completedPortals: client.onboardingChecklist?.completedPortals || [],
          takeoverChecklistDone: nextDone,
          lastBaselineSyncAt: client.onboardingChecklist?.lastBaselineSyncAt,
        },
      };
      if (onUpdateClient) {
        await onUpdateClient(client.id, patchPayload);
      } else {
        await fetch("/api/clients", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: client.id, ...patchPayload }),
        });
      }
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      toast.error("Checklist Update Failed", err.message || "Could not update checklist item.");
    } finally {
      setSavingChecklistId(null);
    }
  };

  const getClientWhatsAppMessage = (client: ClientEntity, forceMode?: "HANDOVER_KIT" | "LOGIN_ONLY") => {
    const phone = client.primaryContact?.phone || "";
    const phone10 = normalizePhone10(phone);
    const pin = phone10.length >= 4 ? phone10.slice(-4) : "—";
    const mode = forceMode || whatsappMode;

    if (mode === "HANDOVER_KIT") {
      const bp = CLIENT_ARCHETYPE_BLUEPRINTS[client.type] || CLIENT_ARCHETYPE_BLUEPRINTS.PVT_LTD;
      const readiness = evaluateClientOnboardingReadiness({
        client,
        credentials: portalCredentials,
        dscTokens,
        noticesCount: notices.filter((n) => n.entityId === client.id).length,
      });
      const isTakeover = (client.onboardingMode || "CA_TAKEOVER") === "CA_TAKEOVER";
      const missingDocs = bp.documentChecklist
        .filter((d) => (!d.takeoverOnly || isTakeover) && (!d.gstOnly || readiness.hasGst))
        .filter((d) => !(client.onboardingChecklist?.takeoverChecklistDone || []).includes(d.id))
        .slice(0, 5)
        .map((d) => d.label);

      return buildTemplateMessage("ONBOARDING_HANDOVER_KIT", {
        clientName: client.name,
        loginId: `${phone10 || client.pan}`,
        loginPassword: pin,
        portalUrl: `${portalBaseUrl}/?portal=client${phone10 ? `&phone=${phone10}` : ""}`,
        firmName: DEFAULT_FIRM_BRANDING.firmName,
        entityTypeLabel: bp.label,
        isTakeover,
        missingDocs,
        missingPortals: readiness.missingPortals.map((p) => p.replace(/_/g, " ")),
      });
    }

    return buildTemplateMessage("CLIENT_CREDENTIALS", {
      clientName: client.name,
      loginId: `${phone10 || client.pan}`,
      loginPassword: pin,
      portalUrl: `${portalBaseUrl}/?portal=client${phone10 ? `&phone=${phone10}` : ""}`,
      firmName: DEFAULT_FIRM_BRANDING.firmName,
    });
  };

  // Generate 1-Tap WhatsApp Link for a client with 4-Digit Access PIN
  const generateClientWhatsAppUrl = (client: ClientEntity, forceMode?: "HANDOVER_KIT" | "LOGIN_ONLY") => {
    const phone = client.primaryContact?.phone || "";
    const cleanPhone = sanitizeIndianPhoneNumber(phone);
    const message = getClientWhatsAppMessage(client, forceMode);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyMessage = (client: ClientEntity) => {
    const message = getClientWhatsAppMessage(client);
    const phone = client.primaryContact?.phone || "";
    const phone10 = normalizePhone10(phone);
    const pin = phone10.length >= 4 ? phone10.slice(-4) : "—";

    navigator.clipboard.writeText(message);
    setCopiedId(client.id);
    toast.info("Onboarding Message Copied", `Copied credentials message (PIN: ${pin}) for ${client.name}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyPin = (client: ClientEntity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const phone = client.primaryContact?.phone || "";
    const phone10 = normalizePhone10(phone);
    if (phone10.length < 4) {
      toast.warning("Mobile Number Required", `Add a contact phone for ${client.name} to derive its 4-digit PIN.`);
      return;
    }
    const pin = phone10.slice(-4);

    navigator.clipboard.writeText(pin);
    setCopiedPinId(client.id);
    toast.success("PIN Copied", `4-Digit PIN (${pin}) copied to clipboard.`);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  // Download Master Credentials CSV for all clients
  const handleExportAllCredentialsCsv = () => {
    if (clients.length === 0) {
      toast.warning("No Clients Registered", "Please enroll or import clients first.");
      return;
    }

    const headers = [
      "Entity Name", 
      "Entity Type", 
      "PAN", 
      "GSTIN", 
      "Director / Signatory", 
      "Mobile Number", 
      "Email", 
      "4-Digit Access PIN", 
      "Direct Portal Link", 
      "1-Tap WhatsApp Link"
    ];
    const rows = clients.map((c) => {
      const director = c.primaryContact?.name || "Director";
      const phone = c.primaryContact?.phone || "";
      const phone10 = normalizePhone10(phone);
      const pin = phone10.length >= 4 ? phone10.slice(-4) : "—";
      const portalLink = `${portalBaseUrl}/?portal=client${phone10 ? `&phone=${phone10}` : ""}`;
      const waLink = generateClientWhatsAppUrl(c);
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        c.type,
        c.pan,
        c.gstin || "",
        `"${director.replace(/"/g, '""')}"`,
        `"${phone10}"`,
        `"${c.primaryContact?.email || ""}"`,
        `"${pin}"`,
        `"${portalLink}"`,
        `"${waLink}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GPA_Clients_Credentials_Master_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export Complete", `Exported credentials sheet for ${clients.length} clients.`);
  };

  // HIGH-THROUGHPUT 100+ CLIENT CSV PARSER & VALIDATION PREVIEW
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = (evt.target?.result as string) || "";
        const parsed = parseAndValidateBulkClientCsv(text, clients, assignedArticle || "Practice Team");
        if (parsed.length === 0) {
          toast.error("Empty CSV", "CSV appears empty or contains no parseable data rows.");
          return;
        }
        setCsvPreviewRows(parsed);
        const validCount = parsed.filter((r) => r.isValid).length;
        const errCount = parsed.length - validCount;
        toast.info(
          "CSV Validated Locally",
          `${parsed.length} rows parsed: ${validCount} valid, ${errCount} blocked. Review & confirm import.`
        );
      } catch (err: any) {
        toast.error("CSV Parse Error", err.message || "Failed to parse CSV file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = async () => {
    const validRows = csvPreviewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No Valid Rows", "Fix PAN or missing Legal Name errors in your CSV before importing.");
      return;
    }

    setIsImporting(true);
    try {
      const batchPayload = validRows.map((r) => ({
        name: r.name,
        type: r.type,
        pan: r.pan,
        gstin: r.gstin,
        tan: r.tan,
        cin: r.cin,
        gstFilingFrequency: r.gstFilingFrequency,
        onboardingMode: r.onboardingMode || "CA_TAKEOVER",
        turnoverCr: r.turnoverCr,
        incorporationYear: 2024,
        partnerInCharge: assignedPartner || DEFAULT_FIRM_BRANDING.managingPartner,
        assignedArticle: r.assignedArticle,
        primaryContact: {
          name: r.contactName,
          phone: r.contactPhone,
          email: r.contactEmail,
          designation: "Director / Authorized Signatory",
        },
      }));

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ batch: batchPayload }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        toast.success(
          "Bulk Import Successful",
          `Successfully onboarded ${resData.count || batchPayload.length} clients!`
        );
        setSuccessToast(`✓ Onboarded ${resData.count || batchPayload.length} clients! Switching to 1-Tap Broadcast Desk...`);
        setCsvPreviewRows([]);
        setCsvFileName("");

        if (onBatchImported) {
          await onBatchImported();
        } else if (onRefreshData) {
          await onRefreshData();
        }

        setTimeout(() => {
          setSuccessToast("");
          setActiveTab("credentials");
        }, 1200);
      } else {
        toast.error("Import Error", resData.error || "Failed to persist batch");
      }
    } catch (err: any) {
      toast.error("Import Failed", "Failed to upload CSV batch: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = `entity_name,legal_type,pan,gstin,contact_name,contact_phone,contact_email,turnover_cr,assigned_article,tan,cin_llpin,gst_frequency,onboarding_mode
"Pratwi Solutions Private Limited","PVT_LTD","AANCP9915B","09AANCP9915B1Z4","Chetan Pratap Singh","+91 80771 70715","chetanpratap1996@gmail.com",1.0,"Kriti Jain","DELP12345A","U72900DL2020PTC123456","MONTHLY","CA_TAKEOVER"`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "GPA_100_Client_Master_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.primaryContact?.name && c.primaryContact.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.primaryContact?.phone && c.primaryContact.phone.includes(searchQuery));
    
    const matchesGroup = selectedGroupFilter === "ALL" || c.groupId === selectedGroupFilter;
    const matchesType = selectedTypeFilter === "ALL" || c.type === selectedTypeFilter;

    let matchesHealth = true;
    const penaltyDeduction = Math.min(30, (c.penaltyRiskAccrued || 0) > 0 ? 25 : 0);
    const baseScore = 100 - penaltyDeduction;
    if (selectedHealthFilter === "STABLE") {
      matchesHealth = baseScore >= 80;
    } else if (selectedHealthFilter === "AT_RISK") {
      matchesHealth = baseScore < 80;
    }

    return matchesSearch && matchesGroup && matchesType && matchesHealth;
  });

  // Aggregate Metrics for Practice Overview
  const totalTurnover = clients.reduce((sum, c) => sum + (c.turnoverCr || 0), 0).toFixed(1);
  const stableCount = clients.filter((c) => (c.penaltyRiskAccrued || 0) === 0).length;
  const atRiskCount = clients.length - stableCount;

  // Handle single client creation
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim() || !pan.trim() || isSubmittingForm) return;

    const panClean = pan.trim().toUpperCase();
    if (!isValidPan(panClean)) {
      toast.error("Invalid PAN Format", "Permanent Account Number must be 10 characters with valid entity code (e.g. AABCM1234A).");
      return;
    }
    const gstinClean = gstin.trim().toUpperCase();
    if (gstinClean && !isValidGstin(gstinClean)) {
      toast.error("Invalid GSTIN", "Please enter a valid 15-character GSTIN with valid state code.");
      return;
    }

    setIsSubmittingForm(true);
    const savedName = entityName.trim();
    const initialCredentials: Array<{ portalType: PortalType; username: string; password: string }> = [];
    if (credItUser.trim() && credItPass.trim()) {
      initialCredentials.push({ portalType: "INCOME_TAX", username: credItUser.trim(), password: credItPass.trim() });
    }
    if (credGstUser.trim() && credGstPass.trim()) {
      initialCredentials.push({ portalType: "GST", username: credGstUser.trim(), password: credGstPass.trim() });
    }
    if (credMcaUser.trim() && credMcaPass.trim()) {
      initialCredentials.push({ portalType: "MCA_V3", username: credMcaUser.trim(), password: credMcaPass.trim() });
    }
    if (credTracesUser.trim() && credTracesPass.trim()) {
      initialCredentials.push({ portalType: "TRACES", username: credTracesUser.trim(), password: credTracesPass.trim() });
    }

    const newClientPayload: any = {
      id: `CLI-${Date.now().toString().slice(-4)}`,
      groupId: groups?.[0]?.id || "GRP-DIRECT",
      groupName: groups?.[0]?.name || "Direct Practice Clients",
      name: savedName,
      tradeName: tradeName.trim() || gstAutoData?.tradeName || undefined,
      type,
      pan: panClean,
      gstin: gstinClean || undefined,
      gstFilingFrequency: gstinClean ? gstFilingFrequency : "UNREGISTERED",
      onboardingMode,
      cin: cin.trim().toUpperCase() || undefined,
      tan: tan.trim().toUpperCase() || undefined,
      gstHistory: gstAutoData?.normalizedHistory,
      onboardingChecklist: gstAutoData?.normalizedHistory
        ? {
            completedPortals: initialCredentials.map((c) => c.portalType),
            takeoverChecklistDone: [],
            lastBaselineSyncAt: new Date().toISOString(),
          }
        : initialCredentials.length > 0
          ? { completedPortals: initialCredentials.map((c) => c.portalType), takeoverChecklistDone: [] }
          : undefined,
      turnoverCr: parseFloat(turnoverCr) || 5.0,
      incorporationYear: 2024,
      penaltyRiskAccrued: 0,
      partnerInCharge: assignedPartner,
      assignedArticle,
      primaryContact: {
        name: contactName.trim() || "Promoter",
        phone: contactPhone.trim(),
        email: contactEmail.trim(),
        designation: "Director / Authorized Signatory",
      },
      initialCredentials: initialCredentials.length > 0 ? initialCredentials : undefined,
      initialDsc:
        dscHolderName.trim() && dscSerialNumber.trim()
          ? {
              holderName: dscHolderName.trim(),
              pan: panClean,
              serialNumber: dscSerialNumber.trim(),
              tokenType: dscTokenType,
              validTill: dscValidTill || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
              vaultSlot: dscVaultSlot,
            }
          : undefined,
    };

    try {
      await onAddClient(newClientPayload);
      toast.success(
        "Client Successfully Onboarded",
        `"${savedName}" (${panClean}) is now active. Tailored handover kit ready to share.`
      );
      setSuccessToast(`✓ Client "${savedName}" registered! Switching to 1-Tap Broadcast Desk...`);

      setEntityName("");
      setTradeName("");
      setPan("");
      setGstin("");
      setCin("");
      setTan("");
      setGstAutoData(null);
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setCredItUser("");
      setCredItPass("");
      setCredGstUser("");
      setCredGstPass("");
      setCredMcaUser("");
      setCredMcaPass("");
      setCredTracesUser("");
      setCredTracesPass("");
      setDscHolderName("");
      setDscSerialNumber("");
      setDscValidTill("");
      setShowDay1KeysSection(false);

      setTimeout(() => {
        setSuccessToast("");
        setActiveTab("credentials");
      }, 900);
    } catch (err: any) {
      toast.error("Onboarding Failed", err.message || "Failed to onboard client");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Open Edit Client Modal
  const handleOpenEdit = (client: ClientEntity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingClient(client);
    setEditEntityName(client.name);
    setEditPan(client.pan);
    setEditGstin(client.gstin || "");
    setEditCin(client.cin || "");
    setEditTan(client.tan || "");
    setEditGstFreq(client.gstFilingFrequency || (client.gstin ? "MONTHLY" : "UNREGISTERED"));
    setEditOnboardingMode(client.onboardingMode || "CA_TAKEOVER");
    setEditType(client.type);
    setEditContactName(client.primaryContact?.name || "");
    setEditContactPhone(client.primaryContact?.phone || "");
    setEditContactEmail(client.primaryContact?.email || "");
    setEditTurnoverCr(String(client.turnoverCr || "10.0"));
    setEditAssignedArticle(client.assignedArticle || "");
    setEditAssignedPartner(client.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner);
  };

  // Save Edit Client Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || isUpdatingClient) return;

    const cleanEditPan = editPan.trim().toUpperCase();
    if (!isValidPan(cleanEditPan)) {
      toast.error("Invalid PAN Format", "Please provide a valid 10-character PAN with legal entity code.");
      return;
    }
    const cleanEditGstin = editGstin.trim().toUpperCase();
    if (cleanEditGstin && !isValidGstin(cleanEditGstin)) {
      toast.error("Invalid GSTIN", "Please provide a valid 15-character GSTIN.");
      return;
    }

    setIsUpdatingClient(true);
    const updatedData: Partial<ClientEntity> = {
      name: editEntityName.trim(),
      pan: cleanEditPan,
      gstin: cleanEditGstin || undefined,
      cin: editCin.trim().toUpperCase() || undefined,
      tan: editTan.trim().toUpperCase() || undefined,
      gstFilingFrequency: cleanEditGstin ? editGstFreq : "UNREGISTERED",
      onboardingMode: editOnboardingMode,
      type: editType,
      turnoverCr: parseFloat(editTurnoverCr) || 5.0,
      assignedArticle: editAssignedArticle,
      partnerInCharge: editAssignedPartner,
      primaryContact: {
        name: editContactName.trim() || "Promoter",
        phone: editContactPhone.trim(),
        email: editContactEmail.trim(),
        designation: editingClient.primaryContact?.designation || "Director",
      },
    };

    try {
      if (onUpdateClient) {
        await onUpdateClient(editingClient.id, updatedData);
      } else {
        const res = await fetch("/api/clients", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id: editingClient.id, ...updatedData }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
      }
      toast.success("Client Updated", `Profile for "${editEntityName}" saved successfully.`);
      setEditingClient(null);
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Could not update client");
    } finally {
      setIsUpdatingClient(false);
    }
  };

  // Delete Client
  const handleConfirmDelete = async () => {
    if (!deletingClientId) return;
    try {
      if (onDeleteClient) {
        await onDeleteClient(deletingClientId);
      } else {
        const res = await fetch(`/api/clients?id=${deletingClientId}`, {
          method: "DELETE",
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
      }
      toast.success("Client Archived", "Client entity removed from active directory.");
      setDeletingClientId(null);
    } catch (e: any) {
      toast.error("Delete Failed", e.message);
    }
  };

  // Live 4-digit PIN preview for single add form
  const rawCleanPhone = contactPhone.replace(/\D/g, "");
  const dynamicPinPreview = rawCleanPhone.length >= 4 ? rawCleanPhone.slice(-4) : "—";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 selection:bg-red-500 selection:text-white">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        
        {/* Top Close Button (Cleanly isolated) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-2 rounded-2xl hover:bg-slate-100 transition z-20"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3 pr-12 lg:pr-14">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-red-50 border border-red-200 text-btred-logo flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Client Master &amp; WhatsApp Onboarding Desk
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200">
                  {clients.length} Clients Registered
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {DEFAULT_FIRM_BRANDING.firmName} &bull; Portal: <strong className="font-mono text-slate-700">{portalBaseUrl}/</strong>
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Clean, no truncate, no double plus */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold overflow-x-auto scrollbar-none w-full lg:w-auto shrink-0">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap shrink-0 ${
                activeTab === "directory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Directory ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab("credentials")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "credentials" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1-Tap WhatsApp Desk</span>
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "bulk" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload 100+ CSV</span>
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "add" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* Global Confirmation Banner */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-300 p-3 sm:p-3.5 rounded-2xl text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs block text-emerald-900">{successToast}</span>
                <span className="text-[11px] text-emerald-700">Client profile and Zero-DLT credentials successfully initialized.</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: DIRECTORY
           ========================================================================= */}
        {activeTab === "directory" && (
          <div className="space-y-3.5 text-xs">
            {/* Search, Filter Bar, and Practice Metrics Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
              <div className="flex flex-col md:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by company name, PAN, GSTIN, mobile, or director..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-btred-logo shrink-0"
                  >
                    <option value="ALL">All Groups</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-btred-logo shrink-0"
                  >
                    <option value="ALL">All Entity Types</option>
                    <option value="PVT_LTD">Private Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="PROPRIETORSHIP">Proprietorship</option>
                    <option value="INDIVIDUAL_HNI">Individual / HNI</option>
                    <option value="TRUST_NGO">Trust / NGO</option>
                  </select>

                  <select
                    value={selectedHealthFilter}
                    onChange={(e) => setSelectedHealthFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-btred-logo shrink-0"
                  >
                    <option value="ALL">All Health</option>
                    <option value="STABLE">Stable (80-100)</option>
                    <option value="AT_RISK">At Risk (&lt;80)</option>
                  </select>
                </div>
              </div>

              {/* Fast Stats Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 pt-1 border-t border-slate-200/80 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span>Showing: <strong className="text-slate-900">{filteredClients.length}</strong> of {clients.length} Entities</span>
                  <span>&bull;</span>
                  <span>Stable: <strong className="text-emerald-700">{stableCount}</strong></span>
                  <span>&bull;</span>
                  <span>At Risk: <strong className="text-amber-700">{atRiskCount}</strong></span>
                </div>
                <div>
                  Practice Managed Turnover: <strong className="text-slate-900 font-mono">₹{totalTurnover} Cr</strong>
                </div>
              </div>
            </div>

            {/* Client Cards List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[460px] overflow-y-auto bg-white">
              {filteredClients.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-3">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No client entities match your filter</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Try clearing your search query or click <strong>Upload 100+ CSV</strong> to populate realistic client entities.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedGroupFilter("ALL"); setSelectedTypeFilter("ALL"); setSelectedHealthFilter("ALL"); }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const director = client.primaryContact?.name || "Director";
                  const phone = client.primaryContact?.phone || "";
                  const phone10 = normalizePhone10(phone);
                  const pin = phone10.length >= 4 ? phone10.slice(-4) : "—";
                  const isCopiedPin = copiedPinId === client.id;

                  // Health & Churn Risk Algorithm
                  const penaltyDeduction = Math.min(30, (client.penaltyRiskAccrued || 0) > 0 ? 25 : 0);
                  const baseScore = 100 - penaltyDeduction;
                  const isHealthy = baseScore >= 80;

                  const clientNotices = notices.filter((n) => n.entityId === client.id);
                  const readiness = evaluateClientOnboardingReadiness({
                    client,
                    credentials: portalCredentials,
                    dscTokens,
                    noticesCount: clientNotices.length,
                  });
                  const isSyncingGst = syncingGstClientId === client.id;

                  return (
                    <div key={client.id} className="p-3.5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      {/* Left: Entity Info & Identifiers */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-extrabold text-slate-900 text-sm truncate">{client.name}</strong>

                          <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {client.type.replace(/_/g, " ")}
                          </span>

                          {client.onboardingMode === "NEW_BUSINESS" && (
                            <span className="text-[10px] font-black uppercase bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">
                              New Setup
                            </span>
                          )}

                          <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            PAN: {client.pan}
                          </span>

                          {client.gstin ? (
                            <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                              GST: {client.gstin}
                              {client.gstFilingFrequency && client.gstFilingFrequency !== "MONTHLY"
                                ? ` (${client.gstFilingFrequency})`
                                : ""}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              GST: Unregistered
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setBaselineClientId(client.id)}
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border transition cursor-pointer ${
                              readiness.pct >= 85
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                : readiness.pct >= 60
                                  ? "bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100"
                                  : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                            }`}
                            title={readiness.missingItems.length > 0 ? `Missing: ${readiness.missingItems.join(", ")}` : "All Day-1 baseline checks complete"}
                          >
                            <ClipboardCheck className="w-3 h-3" />
                            Ready: {readiness.pct}%
                          </button>

                          {readiness.unfiledGstCount > 0 && (
                            <span className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-300 px-1.5 py-0.5 rounded">
                              {readiness.unfiledGstCount} Unfiled GST
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                              isHealthy
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                            title={`Health Score: ${baseScore}/100 based on statutory compliance and penalty exposure.`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />
                            Health: {baseScore}/100 {isHealthy ? "(Stable)" : "(At Risk)"}
                          </span>
                        </div>

                        {/* Signatory, PIN, and Assigned In-Charge Strip */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>
                            Signatory: <strong className="text-slate-800">{director}</strong> ({phone})
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            PIN:{" "}
                            <strong className="font-mono text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              {pin}
                            </strong>
                            <button
                              onClick={(e) => handleCopyPin(client, e)}
                              className="text-slate-400 hover:text-emerald-700 p-0.5 transition"
                              title="Copy 4-Digit PIN"
                            >
                              {isCopiedPin ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </span>
                          <span>&bull;</span>
                          <span>Turnover: <strong className="text-slate-800">₹{client.turnoverCr} Cr</strong></span>
                          <span>&bull;</span>
                          <span className="text-slate-500">
                            Partner: <strong className="text-slate-700">{client.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {client.gstin && (
                          <button
                            type="button"
                            onClick={() => handleSyncClientGstBaseline(client)}
                            disabled={isSyncingGst}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1 disabled:opacity-50"
                            title="Sync live GST return filing history & detect unfiled periods"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncingGst ? "animate-spin" : ""}`} />
                            <span>{isSyncingGst ? "Syncing..." : "Sync GST"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setBaselineClientId(client.id)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1"
                          title="View Day-1 Readiness, Past Returns & Document Checklist"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Baseline</span>
                        </button>

                        {/* 1-Tap WhatsApp */}
                        <a
                          href={generateClientWhatsAppUrl(client)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1"
                          title="Send Onboarding Kit via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Open Portal */}
                        <a
                          href={`/?view=client&id=${client.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1"
                          title="Open Client View Portal"
                        >
                          <span>Open Portal</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>

                        {/* Edit Button */}
                        <button
                          onClick={(e) => handleOpenEdit(client, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                          title="Edit Client Information"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeletingClientId(client.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Archive Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: 1-TAP WHATSAPP ONBOARDING BROADCAST DESK
           ========================================================================= */}
        {activeTab === "credentials" && (
          <div className="space-y-4 text-xs">
            {/* Top Action Utility Banner */}
            <div className="bg-slate-50 text-slate-800 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span className="font-black text-sm text-slate-900">1-Tap WhatsApp Client Onboarding Hub</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Send tailored onboarding kits with portal link, 4-digit PIN &amp; archetype-specific document checklist.
                </p>
                <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setWhatsappMode("HANDOVER_KIT")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      whatsappMode === "HANDOVER_KIT" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tailored Handover Kit (PIN + Docs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappMode("LOGIN_ONLY")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      whatsappMode === "LOGIN_ONLY" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Login PIN Only
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastIndex(0);
                    setIsBroadcastQueueOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-black flex items-center gap-1.5 transition text-[11px] shadow-sm active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start 1-Tap Broadcast Queue ({clients.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAllCredentialsCsv}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px]"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download Credentials Sheet</span>
                </button>
              </div>
            </div>

            {/* Staff Credentials Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-btred-logo shrink-0" />
                <span>Staff credentials and role permissions are managed securely via the <strong>Team</strong> tab with PBKDF2-hashed passwords.</span>
              </div>
            </div>

            {/* Clients Credentials List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[380px] overflow-y-auto bg-white">
              {filteredClients.length === 0 ? (
                <div className="py-12 text-center text-slate-600 space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-600">No client entities found</p>
                  <p className="text-[11px] text-slate-500">Upload a CSV of 100+ clients using the CSV Import tab.</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const director = client.primaryContact?.name || "Director";
                  const phone = client.primaryContact?.phone || "";
                  const phone10 = normalizePhone10(phone);
                  const pin = phone10.length >= 4 ? phone10.slice(-4) : "—";
                  const isCopied = copiedId === client.id;
                  const isDispatched = dispatchedIds.has(client.id);

                  return (
                    <div key={client.id} className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-bold text-slate-900 text-xs truncate max-w-[200px] sm:max-w-xs">{client.name}</strong>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">PAN: {client.pan}</span>
                          <span className="text-[10px] text-btred-logo font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">{director}</span>
                          {isDispatched && (
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                              <CheckCheck className="w-3 h-3 text-emerald-600" /> Dispatched
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>User ID: <strong className="text-slate-800">{normalizePhone10(phone) || client.pan}</strong></span>
                          <span>&bull;</span>
                          <span>PIN: <strong className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">{pin}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Copy Text Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(client)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition"
                          title="Copy Ready-to-Paste WhatsApp Message"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy Msg"}</span>
                        </button>

                        {/* 1-Tap WhatsApp Link */}
                        <a
                          href={generateClientWhatsAppUrl(client)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setDispatchedIds((prev) => new Set([...prev, client.id]));
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 transition shadow-sm active:scale-95"
                          title="1-Tap Direct WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>1-Tap WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CSV BULK IMPORT FOR 100+ CLIENTS & VALIDATION PREVIEW
           ========================================================================= */}
        {activeTab === "bulk" && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Bulk 100+ Client Onboarding Pipeline (RFC-4180 + Mod-36)</h4>
                  <p className="text-slate-500 mt-0.5 text-xs">
                    Upload a CSV to preview PAN/GSTIN checksums, infer constitutions automatically, and flag duplicate PANs before saving.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-btred-logo" />
                    <span>Download CSV Template</span>
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,text/csv"
                className="hidden"
              />

              {csvPreviewRows.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-white rounded-2xl p-8 text-center space-y-2.5 cursor-pointer transition group"
                >
                  <Upload className="w-9 h-9 text-indigo-500 group-hover:scale-110 transition mx-auto" />
                  <p className="font-black text-slate-900 text-sm group-hover:text-btred-logo transition">
                    Click to Select &amp; Validate Client CSV File
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
                    Columns supported: <strong className="font-mono text-slate-700">entity_name, legal_type, pan, gstin, contact_name, contact_phone, contact_email, turnover_cr, assigned_article, tan, cin_llpin, gst_frequency, onboarding_mode</strong>
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-xs">{csvFileName || "Uploaded CSV"}</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {csvPreviewRows.filter((r) => r.isValid).length} Valid
                      </span>
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {csvPreviewRows.filter((r) => r.warnings.length > 0).length} Warnings
                      </span>
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {csvPreviewRows.filter((r) => !r.isValid).length} Errors
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCsvPreviewRows([]);
                          setCsvFileName("");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmBulkImport}
                        disabled={isImporting || csvPreviewRows.filter((r) => r.isValid).length === 0}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isImporting ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>
                          {isImporting
                            ? "Importing Batch..."
                            : `Import ${csvPreviewRows.filter((r) => r.isValid).length} Valid Clients`}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {csvPreviewRows.slice(0, 100).map((r) => (
                      <div key={r.rowNumber} className="py-2 flex items-start justify-between gap-2 text-[11px]">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400 font-mono">#{r.rowNumber}</span>
                            <strong className="text-slate-900 font-bold truncate">{r.name || "(Missing Name)"}</strong>
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{r.pan || "NO PAN"}</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{r.type}</span>
                            {r.gstin && <span className="font-mono text-[10px] text-slate-600">GST: {r.gstin}</span>}
                            {r.isDuplicatePan && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Duplicate PAN</span>
                            )}
                          </div>
                          {(r.errors.length > 0 || r.warnings.length > 0) && (
                            <p className={`text-[10px] ${r.errors.length > 0 ? "text-rose-600 font-bold" : "text-amber-700"}`}>
                              {[...r.errors, ...r.warnings].join(" • ")}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          r.isValid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {r.isValid ? "READY" : "SKIP"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guidance Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] space-y-1 text-slate-800">
                <span className="font-extrabold flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-btred-logo" />
                  What happens when you upload 100 clients?
                </span>
                <p className="text-slate-600 leading-relaxed">
                  1. Quoted CSV cells &amp; empty columns are parsed cleanly, and constitution is auto-inferred from the PAN 4th letter when omitted.<br/>
                  2. A 4-digit PIN is generated from the last 4 digits of the promoter mobile number.<br/>
                  3. Switch to the <strong className="text-indigo-900">1-Tap WhatsApp Desk</strong> tab immediately after import to share Tailored Handover Kits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: ADD SINGLE CLIENT (ARCHETYPE-AWARE ONBOARDING)
           ========================================================================= */}
        {activeTab === "add" && (
          <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
            {/* 0. Onboarding Scenario & Entity Blueprint */}
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                    0. Acquisition Mode &amp; Constitution Blueprint
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Tailors required statutory portals, tax calendar rules, and client handover checklist.
                  </p>
                </div>
                <div className="inline-flex bg-white border border-indigo-200 rounded-xl p-0.5 text-[11px] font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setOnboardingMode("CA_TAKEOVER")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      onboardingMode === "CA_TAKEOVER" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Switch from Previous CA
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingMode("NEW_BUSINESS")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      onboardingMode === "NEW_BUSINESS" ? "bg-sky-600 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    New Incorporation / Fresh
                  </button>
                </div>
              </div>

              {(() => {
                const bp = CLIENT_ARCHETYPE_BLUEPRINTS[type] || CLIENT_ARCHETYPE_BLUEPRINTS.PVT_LTD;
                return (
                  <div className="bg-white border border-indigo-100 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="font-extrabold text-emerald-800 block mb-1">
                        Usually Available on Day 1 ({bp.shortLabel}):
                      </span>
                      <p className="text-slate-600 leading-relaxed">{bp.typicalAssetsOnDay1.slice(0, 3).join(" • ")}</p>
                    </div>
                    <div>
                      <span className="font-extrabold text-amber-800 block mb-1">
                        Missing / Collect via Handover Kit:
                      </span>
                      <p className="text-slate-600 leading-relaxed">{bp.usuallyMissingOnDay1.slice(0, 3).join(" • ")}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                1. Legal Entity Identification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Entity Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder="e.g. Acme Tech Solutions Private Limited"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Entity Constitution / Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  >
                    <option value="PVT_LTD">Private Limited Company</option>
                    <option value="PUBLIC_LTD">Public Limited Company</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="PARTNERSHIP">Partnership Firm</option>
                    <option value="PROPRIETORSHIP">Proprietorship Concern</option>
                    <option value="INDIVIDUAL_HNI">Individual / HNI Taxpayer</option>
                    <option value="TRUST_NGO">Trust / Section 8 NGO</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Permanent Account Number (PAN) *</label>
                    {pan.length === 10 && isValidPan(pan) && (
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                        {inferConstitutionFromPan(pan).legalConstitution}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={pan}
                    onChange={(e) => handlePanChangeWithDecode(e.target.value)}
                    placeholder="e.g. AABCM1234A"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">GSTIN (Optional)</label>
                    {gstin && gstin.trim().length === 15 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        validateGstinDetailed(gstin).isValid
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {validateGstinDetailed(gstin).isValid
                          ? `✓ Checksum Valid (${validateGstinDetailed(gstin).stateName})`
                          : "⚠ Invalid Checksum"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setGstin(val);
                        if (val.length >= 12 && !pan) {
                          handlePanChangeWithDecode(val.substring(2, 12));
                        }
                      }}
                      placeholder="e.g. 33AAACC1206D1ZN"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                    {gstin && gstin.trim().length === 15 && validateGstinDetailed(gstin).isValid && (
                      <button
                        type="button"
                        onClick={() => handleFetchGstDetails()}
                        disabled={isFetchingGst}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl whitespace-nowrap flex items-center gap-1.5 text-xs transition shadow-sm disabled:opacity-50"
                        title="Fetch Legal Name, PAN, Status & Return History from Live GST Portal"
                      >
                        {isFetchingGst ? (
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Auto-Fill
                      </button>
                    )}
                  </div>
                  {gstin && gstin.trim().length === 15 && !validateGstinDetailed(gstin).isValid && (
                    <p className="text-[10px] text-rose-600 font-medium mt-1">
                      {validateGstinDetailed(gstin).error}
                    </p>
                  )}
                </div>

                {/* GST Return Scheme + CIN/LLPIN + TAN */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Return Scheme</label>
                  <select
                    value={gstin.trim() ? gstFilingFrequency : "UNREGISTERED"}
                    onChange={(e) => setGstFilingFrequency(e.target.value as GstFilingFrequency)}
                    disabled={!gstin.trim()}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="MONTHLY">Regular Monthly (GSTR-1 &amp; 3B)</option>
                    <option value="QRMP">QRMP Quarterly (IFF + PMT-06)</option>
                    <option value="COMPOSITION">Composition Scheme (CMP-08)</option>
                    <option value="UNREGISTERED">Not GST Registered</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {type === "LLP" ? "LLPIN (Optional)" : "CIN (For Companies)"}
                    </label>
                    <input
                      type="text"
                      maxLength={21}
                      value={cin}
                      onChange={(e) => setCin(e.target.value.toUpperCase())}
                      placeholder={type === "LLP" ? "AAA-1234" : "U72900DL2020PTC..."}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">TAN (For TDS/26Q)</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={tan}
                      onChange={(e) => setTan(e.target.value.toUpperCase())}
                      placeholder="DELP12345A"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>
              </div>

              {/* Live GST Verified Details Card */}
              {gstAutoData && (
                <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Live GST Portal Verified
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Status: {gstAutoData.status} | {gstAutoData.taxpayerType}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-emerald-200/60">
                    <div><strong>Legal:</strong> {gstAutoData.legalName}</div>
                    <div><strong>Trade:</strong> {gstAutoData.tradeName}</div>
                    {gstAutoData.address && (
                      <div className="sm:col-span-2"><strong>Address:</strong> {gstAutoData.address}</div>
                    )}
                  </div>
                  {gstAutoData.filingHistory && gstAutoData.filingHistory.length > 0 && (
                    <div className="pt-1.5 mt-1 border-t border-emerald-200/60">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Recent Returns (GSTR-1 &amp; GSTR-3B):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {gstAutoData.filingHistory.slice(0, 6).map((ret, idx) => (
                          <span key={idx} className="text-[10px] bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-slate-700 font-mono">
                            {ret.returnType} ({ret.returnPeriod}): <strong className="text-emerald-700">{ret.filingStatus}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                2. Primary Signatory &amp; WhatsApp Contact
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Mukesh Parekh"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp / Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 98230 11928"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email ID</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. accounts@acmetech.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                </div>
              </div>

              {/* Dynamic PIN & Onboarding Preview Chip */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] text-slate-600 font-medium">
                    Automated 4-Digit Access PIN:{" "}
                    <strong className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      {dynamicPinPreview}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Login Link: <span className="font-mono">{portalBaseUrl}/{rawCleanPhone.length >= 10 ? `?phone=${rawCleanPhone.slice(-10)}` : ""}</span>
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                3. Firm Assignment &amp; Financials
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Turnover (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={turnoverCr}
                    onChange={(e) => setTurnoverCr(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Article Assistant</label>
                  <select
                    value={assignedArticle}
                    onChange={(e) => setAssignedArticle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  >
                    {staffDirectory
                      .filter((s) => s.role !== "MANAGING_PARTNER")
                      .map((s) => (
                        <option key={s.id} value={s.fullName}>
                          {s.fullName}{s.icaiRegNo ? ` (${s.icaiRegNo})` : ""}
                        </option>
                      ))}
                    {staffDirectory.filter((s) => s.role !== "MANAGING_PARTNER").length === 0 && (
                      <option value={assignedArticle || ""}>
                        {assignedArticle || "Unassigned (Add staff in Practice Team)"}
                      </option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Managing Partner in Charge</label>
                  <select
                    value={assignedPartner}
                    onChange={(e) => setAssignedPartner(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  >
                    {staffDirectory
                      .filter((s) => s.role === "MANAGING_PARTNER" || s.role === "PAID_CHARTERED_ACCOUNTANT")
                      .map((s) => (
                        <option key={s.id} value={s.fullName}>
                          {s.fullName} ({s.role === "MANAGING_PARTNER" ? "Managing Partner" : "CA"})
                        </option>
                      ))}
                    {staffDirectory.filter((s) => s.role === "MANAGING_PARTNER" || s.role === "PAID_CHARTERED_ACCOUNTANT").length === 0 && (
                      <option value={DEFAULT_FIRM_BRANDING.managingPartner}>
                        {DEFAULT_FIRM_BRANDING.managingPartner} (Managing Partner)
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Collapsible Optional Day-1 Portal Credentials & Physical USB DSC */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDay1KeysSection((v) => !v)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                    4. Optional Day-1 Portal Credentials &amp; Physical USB DSC (If Handed Over Now)
                  </span>
                </div>
                {showDay1KeysSection ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showDay1KeysSection && (
                <div className="p-4 pt-1 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-extrabold text-slate-800 block text-[11px]">Income Tax Portal (e-Filing)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={credItUser}
                          onChange={(e) => setCredItUser(e.target.value)}
                          placeholder="User ID (PAN)"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="password"
                          value={credItPass}
                          onChange={(e) => setCredItPass(e.target.value)}
                          placeholder="Password"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-extrabold text-slate-800 block text-[11px]">GST Common Portal</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={credGstUser}
                          onChange={(e) => setCredGstUser(e.target.value)}
                          placeholder="GST Username"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="password"
                          value={credGstPass}
                          onChange={(e) => setCredGstPass(e.target.value)}
                          placeholder="Password"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-extrabold text-slate-800 block text-[11px]">MCA V3 Portal (Company / LLP)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={credMcaUser}
                          onChange={(e) => setCredMcaUser(e.target.value)}
                          placeholder="MCA Email / User ID"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="password"
                          value={credMcaPass}
                          onChange={(e) => setCredMcaPass(e.target.value)}
                          placeholder="Password"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-extrabold text-slate-800 block text-[11px]">TRACES TDS Portal</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={credTracesUser}
                          onChange={(e) => setCredTracesUser(e.target.value)}
                          placeholder="TRACES User ID"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="password"
                          value={credTracesPass}
                          onChange={(e) => setCredTracesPass(e.target.value)}
                          placeholder="Password"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-extrabold text-slate-800 block text-[11px]">Physical Class-3 USB DSC Custody (Optional)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={dscHolderName}
                        onChange={(e) => setDscHolderName(e.target.value)}
                        placeholder="Holder / Director Name"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                      />
                      <input
                        type="text"
                        value={dscSerialNumber}
                        onChange={(e) => setDscSerialNumber(e.target.value)}
                        placeholder="Token Serial No."
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono"
                      />
                      <select
                        value={dscTokenType}
                        onChange={(e) => setDscTokenType(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                      >
                        <option value="ePass2003">ePass2003</option>
                        <option value="ProxKey">WatchData ProxKey</option>
                        <option value="mToken">CryptoID mToken</option>
                      </select>
                      <input
                        type="date"
                        value={dscValidTill}
                        onChange={(e) => setDscValidTill(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        title="DSC Valid Till Date"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("directory")}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingForm}
                className="bg-btred-logo hover:bg-red-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isSubmittingForm ? "Saving..." : "Save Client & Generate Handover Kit"}
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            MODAL 1: 1-TAP BROADCAST TO ALL INTERACTIVE CONSOLE
           ========================================================================= */}
        {isBroadcastQueueOpen && clients.length > 0 && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95">
              <button
                onClick={() => setIsBroadcastQueueOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Broadcast Progress Header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Client {broadcastIndex + 1} of {clients.length} in Queue
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {dispatchedIds.size} / {clients.length} Dispatched
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${((broadcastIndex + 1) / clients.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Active Client in Queue */}
              {(() => {
                const current = clients[broadcastIndex];
                if (!current) return null;
                const phone = current.primaryContact?.phone || "";
                const phone10 = normalizePhone10(phone);
                const pin = phone10.length >= 4 ? phone10.slice(-4) : "—";
                const waUrl = generateClientWhatsAppUrl(current);
                const messageText = getClientWhatsAppMessage(current);
                const isDispatched = dispatchedIds.has(current.id);

                return (
                  <div className="space-y-3.5">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{current.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                          <span>Signatory: <strong className="text-slate-800">{current.primaryContact?.name}</strong></span>
                          <span>&bull;</span>
                          <span>Mobile: <strong className="font-mono text-slate-800">{phone10}</strong></span>
                          <span>&bull;</span>
                          <span>PIN: <strong className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1 rounded">{pin}</strong></span>
                        </div>
                      </div>
                      {isDispatched ? (
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shrink-0">
                          <CheckCheck className="w-3 h-3 text-emerald-600" /> Sent
                        </span>
                      ) : (
                        <span className="bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* WhatsApp Message Preview Box */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px] block">
                        Prepared WhatsApp Broadcast Message:
                      </label>
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 text-[11px] font-sans text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                        {messageText}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (broadcastIndex > 0) setBroadcastIndex(broadcastIndex - 1);
                          }}
                          disabled={broadcastIndex === 0}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40"
                        >
                          &larr; Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (broadcastIndex < clients.length - 1) setBroadcastIndex(broadcastIndex + 1);
                          }}
                          disabled={broadcastIndex >= clients.length - 1}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40"
                        >
                          Skip &rarr;
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(current)}
                          className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </button>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setDispatchedIds((prev) => new Set([...prev, current.id]));
                            if (broadcastIndex < clients.length - 1) {
                              setBroadcastIndex(broadcastIndex + 1);
                            } else {
                              toast.success("Broadcast Finished", "All clients in the queue reviewed!");
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Open WhatsApp &amp; Send</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: EDIT CLIENT DETAILS DRAWER/MODAL
           ========================================================================= */}
        {editingClient && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95">
              <button
                onClick={() => setEditingClient(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Client Entity</h3>
                  <p className="text-xs text-slate-500">Update PAN, GSTIN, Signatory and Contact numbers.</p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Entity Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={editEntityName}
                    onChange={(e) => setEditEntityName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Permanent Account Number (PAN) *</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={editPan}
                      onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GSTIN</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={editGstin}
                      onChange={(e) => setEditGstin(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Constitution</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo"
                    >
                      <option value="PVT_LTD">Private Limited</option>
                      <option value="PUBLIC_LTD">Public Limited</option>
                      <option value="LLP">LLP</option>
                      <option value="PARTNERSHIP">Partnership</option>
                      <option value="PROPRIETORSHIP">Proprietorship</option>
                      <option value="INDIVIDUAL_HNI">Individual / HNI</option>
                      <option value="TRUST_NGO">Trust / NGO</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Turnover (₹ Cr)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editTurnoverCr}
                      onChange={(e) => setEditTurnoverCr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">CIN / LLPIN</label>
                    <input
                      type="text"
                      maxLength={21}
                      value={editCin}
                      onChange={(e) => setEditCin(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">TAN</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editTan}
                      onChange={(e) => setEditTan(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GST Return Scheme</label>
                    <select
                      value={editGstin.trim() ? editGstFreq : "UNREGISTERED"}
                      onChange={(e) => setEditGstFreq(e.target.value as GstFilingFrequency)}
                      disabled={!editGstin.trim()}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo disabled:opacity-50"
                    >
                      <option value="MONTHLY">Monthly (GSTR-1 &amp; 3B)</option>
                      <option value="QRMP">QRMP Quarterly</option>
                      <option value="COMPOSITION">Composition (CMP-08)</option>
                      <option value="UNREGISTERED">Unregistered</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Onboarding Mode</label>
                    <select
                      value={editOnboardingMode}
                      onChange={(e) => setEditOnboardingMode(e.target.value as OnboardingMode)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo"
                    >
                      <option value="CA_TAKEOVER">Switch from Previous CA</option>
                      <option value="NEW_BUSINESS">New Incorporation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Signatory / Director Name</label>
                    <input
                      type="text"
                      value={editContactName}
                      onChange={(e) => setEditContactName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingClient}
                    className="bg-btred-logo hover:bg-red-700 text-white font-black px-5 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {isUpdatingClient ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 4: CLIENT BASELINE, PAST DATA & READINESS DRAWER
           ========================================================================= */}
        {baselineClientId && (() => {
          const bClient = clients.find((c) => c.id === baselineClientId);
          if (!bClient) return null;
          const bp = CLIENT_ARCHETYPE_BLUEPRINTS[bClient.type] || CLIENT_ARCHETYPE_BLUEPRINTS.PVT_LTD;
          const clientNotices = notices.filter((n) => n.entityId === bClient.id);
          const readiness = evaluateClientOnboardingReadiness({
            client: bClient,
            credentials: portalCredentials,
            dscTokens,
            noticesCount: clientNotices.length,
          });
          const isTakeover = (bClient.onboardingMode || "CA_TAKEOVER") === "CA_TAKEOVER";
          const checklistItems = bp.documentChecklist.filter(
            (d) => (!d.takeoverOnly || isTakeover) && (!d.gstOnly || readiness.hasGst)
          );
          const doneSet = new Set(bClient.onboardingChecklist?.takeoverChecklistDone || []);
          const clientCreds = portalCredentials.filter(
            (cr) =>
              cr.entityId === bClient.id ||
              cr.entityName.toLowerCase() === bClient.name.toLowerCase() ||
              (bClient.pan && cr.secondaryIdentifier?.toUpperCase() === bClient.pan.toUpperCase())
          );

          return (
            <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[88vh] overflow-y-auto animate-in zoom-in-95 text-xs">
                <button
                  onClick={() => setBaselineClientId(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="pr-10 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900">{bClient.name}</h3>
                    <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                      {bp.label}
                    </span>
                    <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Day-1 Readiness: {readiness.pct}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    PAN: <strong className="font-mono text-slate-700">{bClient.pan}</strong>
                    {bClient.gstin ? <> &bull; GSTIN: <strong className="font-mono text-slate-700">{bClient.gstin}</strong></> : null}
                    {bClient.cin ? <> &bull; CIN/LLPIN: <strong className="font-mono text-slate-700">{bClient.cin}</strong></> : null}
                    {bClient.tan ? <> &bull; TAN: <strong className="font-mono text-slate-700">{bClient.tan}</strong></> : null}
                  </p>
                </div>

                {/* Portal Keys + DSC + Notices Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Govt Portals Linked</span>
                    <strong className="text-sm font-black text-slate-900 block mt-0.5">
                      {readiness.savedPortalsCount} / {readiness.requiredPortalsCount || 1}
                    </strong>
                    {readiness.missingPortals.length > 0 ? (
                      <span className="text-[10px] text-amber-700 font-bold">Missing: {readiness.missingPortals.join(", ")}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold">All required keys stored</span>
                    )}
                    {clientCreds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {clientCreds.map((c) => (
                          <span key={c.id} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                            {c.portalType}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 block">USB DSC Tokens</span>
                    <strong className="text-sm font-black text-slate-900 block mt-0.5">
                      {readiness.dscCount} Token{readiness.dscCount === 1 ? "" : "s"}
                    </strong>
                    <span className="text-[10px] text-slate-600">
                      {bp.requiresDsc ? "Mandatory for MCA / 3CD" : "Optional unless tax audit applies"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Past Notices &amp; GST Gap</span>
                    <strong className="text-sm font-black text-slate-900 block mt-0.5">
                      {clientNotices.length} Notice{clientNotices.length === 1 ? "" : "s"} &bull; {readiness.unfiledGstCount} Unfiled
                    </strong>
                    <span className="text-[10px] text-slate-600">
                      {bClient.gstHistory?.length ? `${bClient.gstHistory.length} GST periods synced` : "Click Sync GST to check returns"}
                    </span>
                  </div>
                </div>

                {/* Live GST Return Filing History */}
                {bClient.gstin && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-slate-900 text-xs">Past GST Return Filing History ({bClient.gstin})</span>
                      <button
                        type="button"
                        onClick={() => handleSyncClientGstBaseline(bClient)}
                        disabled={syncingGstClientId === bClient.id}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingGstClientId === bClient.id ? "animate-spin" : ""}`} />
                        <span>{syncingGstClientId === bClient.id ? "Syncing..." : "Sync Live GSTN"}</span>
                      </button>
                    </div>
                    {bClient.gstHistory && bClient.gstHistory.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {bClient.gstHistory.slice(0, 12).map((h, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-mono px-2 py-1 rounded border ${
                              h.arn && h.delayDays === 0
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800 font-bold"
                            }`}
                          >
                            {h.returnType.replace("_", "-")} ({h.period}): {h.arn ? `Filed ${h.filingDate || ""}` : "UNFILED / OVERDUE"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        No live GST filing history fetched yet. Click <strong>Sync Live GSTN</strong> to pull recent GSTR-1 &amp; GSTR-3B status.
                      </p>
                    )}
                  </div>
                )}

                {/* Archetype Day-1 Handover Document Checklist */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <span className="font-black text-slate-900 text-xs block">
                    {isTakeover ? "CA Takeover & Historical Handover Checklist" : "New Business Startup Checklist"}
                  </span>
                  <div className="divide-y divide-slate-200/70 bg-white border border-slate-200 rounded-xl">
                    {checklistItems.map((item) => {
                      const checked = doneSet.has(item.id);
                      const isSaving = savingChecklistId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleToggleChecklistItem(bClient, item.id)}
                          className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {checked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={`text-[11px] ${checked ? "line-through text-slate-400" : "text-slate-800 font-semibold"}`}>
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                            {item.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <a
                    href={generateClientWhatsAppUrl(bClient, "HANDOVER_KIT")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Request Missing Items on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setBaselineClientId(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* =========================================================================
            MODAL 3: DELETE CONFIRMATION
           ========================================================================= */}
        {deletingClientId && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3 relative text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Archive Client Entity?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will remove the client from active practice tracking. Historical invoices and audit papers remain intact in statutory archives.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setDeletingClientId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm"
                >
                  Yes, Archive Client
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
