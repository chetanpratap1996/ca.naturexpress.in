"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ClientEntity,
  ClientGroup,
  DscRecord,
  GstComplianceHistoryItem,
  GstFilingFrequency,
  GstinRecordItem,
  LastFiledPeriods,
  NoticeRecord,
  OnboardingMode,
  PortalCredential,
  PortalType,
  ServiceScopeKey,
} from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING, getPortalBaseUrl } from "@/lib/config/branding";
import { evaluateEntityThresholds, inferConstitutionFromPan } from "@/lib/config/entityDna";
import {
  buildGstinRecordFromLookup,
  CLIENT_ARCHETYPE_BLUEPRINTS,
  deriveDefaultServiceScope,
  evaluateClientOnboardingReadiness,
  normalizeGstApiReturns,
  parseAndValidateBulkClientCsv,
  ParsedCsvClientPreviewRow,
  SERVICE_SCOPE_OPTIONS,
} from "@/lib/config/clientOnboardingMatrix";
import { parseCinStrict } from "@/lib/intelligence/registry/mcaEngine";
import { EntityIntelligenceBox, EntityAutoFillPayload } from "@/components/firm/onboarding/EntityIntelligenceBox";
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
  initialTab?: "directory" | "credentials" | "bulk" | "add";
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
  onSelectClient?: (client: ClientEntity) => void;
}

export const ClientMasterModal: React.FC<ClientMasterModalProps> = ({
  isOpen,
  onClose,
  initialTab,
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
  onSelectClient,
}) => {
  const [activeTab, setActiveTab] = useState<"directory" | "credentials" | "bulk" | "add">(initialTab || "directory");
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
  const [editOnboardingMode, setEditOnboardingMode] = useState<OnboardingMode>("EXISTING_CLIENT");
  const [editType, setEditType] = useState<ClientEntity["type"]>("PVT_LTD");
  const [editContactName, setEditContactName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editTurnoverCr, setEditTurnoverCr] = useState("");
  const [editAssignedArticle, setEditAssignedArticle] = useState("");
  const [editAssignedPartner, setEditAssignedPartner] = useState(DEFAULT_FIRM_BRANDING.managingPartner);
  const [editServiceScope, setEditServiceScope] = useState<ServiceScopeKey[]>([]);
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);

  // Baseline & Past Data Drawer State
  const [baselineClientId, setBaselineClientId] = useState<string | null>(null);
  const [syncingGstClientId, setSyncingGstClientId] = useState<string | null>(null);
  const [savingChecklistId, setSavingChecklistId] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Form State for Single Client (Zero-Dummy Defaults)
  const [entityName, setEntityName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [secondaryGstin, setSecondaryGstin] = useState("");
  const [showSecondaryGstin, setShowSecondaryGstin] = useState(false);
  const [cin, setCin] = useState("");
  const [tan, setTan] = useState("");
  const [type, setType] = useState<ClientEntity["type"]>("PVT_LTD");
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>("EXISTING_CLIENT");
  const [gstFilingFrequency, setGstFilingFrequency] = useState<GstFilingFrequency>("MONTHLY");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [customGroupName, setCustomGroupName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [assignedArticle, setAssignedArticle] = useState("");
  const [assignedArticleId, setAssignedArticleId] = useState("");
  const [assignedPartner, setAssignedPartner] = useState(DEFAULT_FIRM_BRANDING.managingPartner);
  const [assignedPartnerId, setAssignedPartnerId] = useState("");
  const [turnoverCr, setTurnoverCr] = useState("");
  const [digitalTxnPct, setDigitalTxnPct] = useState("95");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [serviceScope, setServiceScope] = useState<ServiceScopeKey[]>(["GST", "INCOME_TAX", "TDS", "ROC_MCA"]);
  const [serviceScopeTouched, setServiceScopeTouched] = useState(false);
  const [lastFiledGst, setLastFiledGst] = useState("");
  const [lastFiledItrAy, setLastFiledItrAy] = useState("");
  const [lastFiledRocFy, setLastFiledRocFy] = useState("");
  const [monthlyRetainerFee, setMonthlyRetainerFee] = useState("");
  const [lastCreatedClient, setLastCreatedClient] = useState<ClientEntity | null>(null);
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
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(50);
  const [csvPreviewRows, setCsvPreviewRows] = useState<ParsedCsvClientPreviewRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const noticesCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const n of notices) {
      map.set(n.entityId, (map.get(n.entityId) || 0) + 1);
    }
    return map;
  }, [notices]);

  useEffect(() => {
    setVisibleLimit(50);
  }, [searchQuery, selectedGroupFilter, selectedTypeFilter, selectedHealthFilter, activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTab) {
      setActiveTab(initialTab);
    }
    fetch("/api/staff", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.staff)) {
          const active = data.staff.filter((s: any) => s.status === "ACTIVE");
          setStaffDirectory(active);
          const firstPartner = active.find((s: any) => s.role === "MANAGING_PARTNER" || s.role === "PAID_CHARTERED_ACCOUNTANT");
          const firstAssociate = active.find((s: any) => s.role !== "MANAGING_PARTNER");
          if (firstPartner) {
            setAssignedPartner((prev) => prev || firstPartner.fullName);
            setAssignedPartnerId((prev) => prev || firstPartner.id);
          }
          if (firstAssociate) {
            setAssignedArticle((prev) => prev || firstAssociate.fullName);
            setAssignedArticleId((prev) => prev || firstAssociate.id);
          }
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
    registrationDate?: string;
    cancellationDate?: string | null;
    address?: string;
    creditsRemaining?: number;
    filingHistory?: Array<{ returnType: string; returnPeriod: string; filingStatus: string; filingDate: string; arn: string }>;
    normalizedHistory?: GstComplianceHistoryItem[];
  } | null>(null);

  const syncDefaultScope = (
    nextType: ClientEntity["type"],
    hasGstFlag: boolean,
    nextTurnover: number,
    hasTanFlag: boolean,
    nextDigitalPct: number
  ) => {
    if (serviceScopeTouched) return;
    setServiceScope(
      deriveDefaultServiceScope({
        type: nextType,
        hasGst: hasGstFlag,
        turnoverCr: nextTurnover,
        hasTan: hasTanFlag,
        digitalTxnPct: nextDigitalPct,
      })
    );
  };

  const handlePanChangeWithDecode = (rawVal: string) => {
    const clean = rawVal.toUpperCase();
    setPan(clean);
    if (clean.length === 10 && isValidPan(clean)) {
      const decoded = inferConstitutionFromPan(clean);
      if (decoded.isValid) {
        setType(decoded.entityType);
        syncDefaultScope(
          decoded.entityType,
          Boolean(gstin.trim()),
          parseFloat(turnoverCr) || 0,
          Boolean(tan.trim()),
          parseFloat(digitalTxnPct) || 95
        );
      }
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
        registrationDate: p.registrationDate,
        cancellationDate: p.cancellationDate,
        address: p.address,
        creditsRemaining: data.creditsRemaining,
        filingHistory: returns,
        normalizedHistory,
      });

      if (p.legalName) setEntityName(p.legalName);
      if (p.tradeName) setTradeName(p.tradeName);
      if (p.address) setRegisteredAddress(p.address);
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

  const portalBaseUrl = getPortalBaseUrl();

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
      const isTakeover = client.onboardingMode === "CA_TAKEOVER";
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
        onboardingMode: client.onboardingMode || "EXISTING_CLIENT",
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
    setImportProgress({ done: 0, total: validRows.length });
    try {
      const batchPayload = validRows.map((r) => {
        const cinParsed = r.cin ? parseCinStrict(r.cin) : null;
        const gstRec = r.gstin
          ? buildGstinRecordFromLookup({
              gstin: r.gstin,
              legalName: r.name,
              filingFrequency: r.gstFilingFrequency,
              turnoverCr: r.turnoverCr,
              authorizedSignatory: r.contactName,
              otpMobile: r.contactPhone,
            })
          : null;
        return {
          name: r.name,
          type: r.type,
          pan: r.pan,
          gstin: r.gstin,
          gstinRecords: gstRec ? [gstRec] : undefined,
          tan: r.tan,
          cin: r.cin,
          gstFilingFrequency: r.gstFilingFrequency,
          onboardingMode: r.onboardingMode || "EXISTING_CLIENT",
          serviceScope: r.serviceScope,
          groupName: r.groupName,
          turnoverCr: r.turnoverCr,
          incorporationYear: cinParsed?.isValid ? cinParsed.incorporationYear : new Date().getFullYear(),
          partnerInCharge: assignedPartner || DEFAULT_FIRM_BRANDING.managingPartner,
          partnerInChargeId: assignedPartnerId || undefined,
          assignedArticle: r.assignedArticle,
          primaryContact: {
            name: r.contactName,
            phone: r.contactPhone,
            email: r.contactEmail,
            designation: "Director / Authorized Signatory",
          },
        };
      });

      const CHUNK_SIZE = 200;
      let totalImported = 0;
      for (let i = 0; i < batchPayload.length; i += CHUNK_SIZE) {
        const chunk = batchPayload.slice(i, i + CHUNK_SIZE);
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ batch: chunk }),
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.error || `Chunk failed at row ${i + 1}`);
        }
        totalImported += Number(resData.count || chunk.length);
        setImportProgress({ done: Math.min(batchPayload.length, i + chunk.length), total: batchPayload.length });
      }

      toast.success(
        "Bulk Import Successful",
        `Successfully onboarded ${totalImported} clients to PostgreSQL!`
      );
      setSuccessToast(`✓ Onboarded ${totalImported} clients! Switching to WhatsApp Invite Desk...`);
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
    } catch (err: any) {
      toast.error("Import Failed", "Failed to upload CSV batch: " + err.message);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = `entity_name,legal_type,pan,gstin,contact_name,contact_phone,contact_email,turnover_cr,assigned_article,tan,cin_llpin,gst_frequency,onboarding_mode,services,group_name
"Acme Manufacturing Private Limited","PVT_LTD","AABCA1234C","23AABCA1234C1Z5","Rajesh Sharma","+91 98260 11223","accounts@acmemfg.in",4.5,"Kriti Jain","BPLA01234B","U28900MP2018PTC045123","MONTHLY","EXISTING_CLIENT","GST|INCOME_TAX|TDS|ROC_MCA","Sharma Family Group"`;

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
    const secGstinClean = showSecondaryGstin ? secondaryGstin.trim().toUpperCase() : "";
    if (secGstinClean && !isValidGstin(secGstinClean)) {
      toast.error("Invalid Secondary GSTIN", "Please enter a valid 15-character secondary GSTIN.");
      return;
    }

    setIsSubmittingForm(true);
    const savedName = entityName.trim();
    const cleanCinVal = cin.trim().toUpperCase() || undefined;
    const cinParsed = cleanCinVal ? parseCinStrict(cleanCinVal) : null;
    const parsedTurnover = parseFloat(turnoverCr);
    const resolvedTurnover = Number.isFinite(parsedTurnover) && parsedTurnover >= 0 ? parsedTurnover : 0;
    const resolvedDigitalPct = Math.min(100, Math.max(0, parseFloat(digitalTxnPct) || 95));

    const builtGstins: GstinRecordItem[] = [];
    if (gstinClean) {
      const primaryRec = buildGstinRecordFromLookup({
        gstin: gstinClean,
        legalName: gstAutoData?.legalName || savedName,
        tradeName: tradeName.trim() || gstAutoData?.tradeName || savedName,
        status: gstAutoData?.status || "ACTIVE",
        taxpayerType: gstAutoData?.taxpayerType || (gstFilingFrequency === "COMPOSITION" ? "Composition" : "Regular"),
        registrationDate: gstAutoData?.registrationDate,
        cancellationDate: gstAutoData?.cancellationDate,
        address: gstAutoData?.address || registeredAddress.trim() || undefined,
        filingFrequency: gstFilingFrequency,
        turnoverCr: resolvedTurnover,
        authorizedSignatory: contactName.trim() || undefined,
        otpMobile: contactPhone.trim() || undefined,
      });
      if (primaryRec) builtGstins.push(primaryRec);
    }
    if (secGstinClean && secGstinClean !== gstinClean) {
      const secRec = buildGstinRecordFromLookup({
        gstin: secGstinClean,
        legalName: savedName,
        tradeName: tradeName.trim() || savedName,
        filingFrequency: gstFilingFrequency,
        turnoverCr: resolvedTurnover,
        authorizedSignatory: contactName.trim() || undefined,
        otpMobile: contactPhone.trim() || undefined,
      });
      if (secRec) builtGstins.push(secRec);
    }

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

    const lastFiledPeriods: LastFiledPeriods | undefined =
      onboardingMode !== "NEW_BUSINESS" && (lastFiledGst.trim() || lastFiledItrAy.trim() || lastFiledRocFy.trim())
        ? {
            gst: lastFiledGst.trim() || undefined,
            itrAy: lastFiledItrAy.trim() || undefined,
            rocFy: lastFiledRocFy.trim() || undefined,
          }
        : undefined;

    const retainerAmount = parseFloat(monthlyRetainerFee);

    const newClientPayload: any = {
      groupId: selectedGroupId && selectedGroupId !== "__NEW__" ? selectedGroupId : undefined,
      groupName:
        selectedGroupId && selectedGroupId !== "__NEW__"
          ? groups.find((g) => g.id === selectedGroupId)?.name
          : customGroupName.trim() || `${savedName} Group`,
      name: savedName,
      tradeName: tradeName.trim() || gstAutoData?.tradeName || undefined,
      type,
      pan: panClean,
      gstin: gstinClean || undefined,
      gstinRecords: builtGstins.length > 0 ? builtGstins : undefined,
      gstFilingFrequency: gstinClean ? gstFilingFrequency : "UNREGISTERED",
      onboardingMode,
      serviceScope,
      cutoverDate: new Date().toISOString().split("T")[0],
      lastFiledPeriods,
      digitalTxnPct: resolvedDigitalPct,
      registeredAddress: registeredAddress.trim() || gstAutoData?.address || undefined,
      cin: cleanCinVal,
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
      turnoverCr: resolvedTurnover,
      incorporationYear: cinParsed?.isValid ? cinParsed.incorporationYear : new Date().getFullYear(),
      penaltyRiskAccrued: 0,
      partnerInCharge: assignedPartner,
      partnerInChargeId: assignedPartnerId || undefined,
      assignedArticle,
      assignedArticleId: assignedArticleId || undefined,
      primaryContact: {
        name: contactName.trim() || "Authorized Signatory",
        phone: contactPhone.trim(),
        email: contactEmail.trim(),
        designation: type === "LLP" ? "Designated Partner" : type === "PROPRIETORSHIP" ? "Proprietor" : "Director / Authorized Signatory",
      },
      initialCredentials: initialCredentials.length > 0 ? initialCredentials : undefined,
      initialAgreement:
        Number.isFinite(retainerAmount) && retainerAmount > 0
          ? { baseRetainerFee: retainerAmount, billingCycle: "MONTHLY" }
          : undefined,
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
      const created = await onAddClient(newClientPayload);
      setLastCreatedClient(created || newClientPayload);
      toast.success(
        "Client Enrolled",
        `"${savedName}" (${panClean}) saved with scoped compliance tasks.`
      );
      setSuccessToast(`Saved "${savedName}". Choose your next step below or continue adding clients.`);

      setEntityName("");
      setTradeName("");
      setPan("");
      setGstin("");
      setSecondaryGstin("");
      setShowSecondaryGstin(false);
      setCin("");
      setTan("");
      setTurnoverCr("");
      setRegisteredAddress("");
      setSelectedGroupId("");
      setCustomGroupName("");
      setLastFiledGst("");
      setLastFiledItrAy("");
      setLastFiledRocFy("");
      setMonthlyRetainerFee("");
      setServiceScopeTouched(false);
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
    setEditOnboardingMode(client.onboardingMode || "EXISTING_CLIENT");
    setEditType(client.type);
    setEditContactName(client.primaryContact?.name || "");
    setEditContactPhone(client.primaryContact?.phone || "");
    setEditContactEmail(client.primaryContact?.email || "");
    setEditTurnoverCr(client.turnoverCr ? String(client.turnoverCr) : "");
    setEditAssignedArticle(client.assignedArticle || "");
    setEditAssignedPartner(client.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner);
    setEditServiceScope(
      Array.isArray(client.serviceScope) && client.serviceScope.length > 0
        ? client.serviceScope
        : deriveDefaultServiceScope({
            type: client.type,
            hasGst: Boolean(client.gstin),
            turnoverCr: client.turnoverCr || 0,
            hasTan: Boolean(client.tan),
          })
    );
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

    const parsedEditTurnover = parseFloat(editTurnoverCr);
    setIsUpdatingClient(true);
    const updatedData: Partial<ClientEntity> = {
      name: editEntityName.trim(),
      pan: cleanEditPan,
      gstin: cleanEditGstin || undefined,
      cin: editCin.trim().toUpperCase() || undefined,
      tan: editTan.trim().toUpperCase() || undefined,
      gstFilingFrequency: cleanEditGstin ? editGstFreq : "UNREGISTERED",
      onboardingMode: editOnboardingMode,
      serviceScope: editServiceScope,
      type: editType,
      turnoverCr: Number.isFinite(parsedEditTurnover) && parsedEditTurnover >= 0 ? parsedEditTurnover : 0,
      assignedArticle: editAssignedArticle,
      partnerInCharge: editAssignedPartner,
      primaryContact: {
        name: editContactName.trim() || "Authorized Signatory",
        phone: editContactPhone.trim(),
        email: editContactEmail.trim(),
        designation: editingClient.primaryContact?.designation || "Director / Authorized Signatory",
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

        {/* Modal Header - Clean & Minimal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3 pr-12 lg:pr-14">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-btred-logo flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Client Master
            </h3>
          </div>

          {/* Navigation Tabs */}
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
              <span>WhatsApp Invite</span>
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "bulk" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
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

        {/* Post-Save Confirmation & Next-Action Card */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-300 p-3 sm:p-3.5 rounded-2xl text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs block text-emerald-900">{successToast}</span>
                <span className="text-[11px] text-emerald-700">Statutory calendar and portal access are active.</span>
              </div>
            </div>
            {lastCreatedClient && (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <a
                  href={generateClientWhatsAppUrl(lastCreatedClient)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Portal Invite</span>
                </a>
                {onSelectClient && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectClient(lastCreatedClient);
                      setSuccessToast("");
                      setLastCreatedClient(null);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition active:scale-95"
                  >
                    Open in Workspace
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSuccessToast("");
                    setLastCreatedClient(null);
                    setActiveTab("directory");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px]"
                >
                  View Directory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessToast("");
                    setLastCreatedClient(null);
                  }}
                  className="p-1 text-emerald-700 hover:text-emerald-950"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
                filteredClients.slice(0, visibleLimit).map((client) => {
                  const director = client.primaryContact?.name || "Director";
                  const phone = client.primaryContact?.phone || "";
                  const phone10 = normalizePhone10(phone);
                  const pin = phone10.length >= 4 ? phone10.slice(-4) : "—";
                  const isCopiedPin = copiedPinId === client.id;

                  // Health & Churn Risk Algorithm
                  const penaltyDeduction = Math.min(30, (client.penaltyRiskAccrued || 0) > 0 ? 25 : 0);
                  const baseScore = 100 - penaltyDeduction;
                  const isHealthy = baseScore >= 80;

                  const clientNoticesCount = noticesCountMap.get(client.id) || 0;
                  const readiness = evaluateClientOnboardingReadiness({
                    client,
                    credentials: portalCredentials,
                    dscTokens,
                    noticesCount: clientNoticesCount,
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

                          {client.onboardingMode === "NEW_BUSINESS" ? (
                            <span className="text-[10px] font-black uppercase bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200">
                              New Setup
                            </span>
                          ) : client.onboardingMode === "CA_TAKEOVER" ? (
                            <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                              CA Takeover
                            </span>
                          ) : null}

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

                          {client.gstHistory && client.gstHistory.length > 0 && (
                            <div
                              className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 px-1.5 py-1 rounded"
                              title={`Last ${Math.min(6, client.gstHistory.length)} GST filing periods (Green=On-Time, Amber=Delayed, Red=Unfiled)`}
                            >
                              {client.gstHistory.slice(0, 6).map((h, idx) => (
                                <span
                                  key={`${h.period}-${idx}`}
                                  title={`${h.period} (${h.returnType}): ${!h.arn ? "Missing" : h.delayDays > 0 ? `Late ${h.delayDays}d` : "On-Time"}`}
                                  className={`w-2 h-2 rounded-full ${
                                    !h.arn
                                      ? "bg-rose-500"
                                      : h.delayDays > 0
                                      ? "bg-amber-400"
                                      : "bg-emerald-500"
                                  }`}
                                />
                              ))}
                            </div>
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
                        {onSelectClient && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectClient(client);
                              onClose();
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1"
                            title="Switch Active Workspace to this Client"
                          >
                            <span>Activate</span>
                          </button>
                        )}
                        <a
                          href={`/?portal=client${phone10 ? `&phone=${phone10}` : ""}`}
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
              {filteredClients.length > visibleLimit && (
                <div className="p-3 bg-slate-50 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 font-medium">
                    Showing {visibleLimit} of {filteredClients.length} clients
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((v) => v + 100)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-800"
                    >
                      Load 100 More
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleLimit(filteredClients.length)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold"
                    >
                      Show All ({filteredClients.length})
                    </button>
                  </div>
                </div>
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
                filteredClients.slice(0, visibleLimit).map((client) => {
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
              {filteredClients.length > visibleLimit && (
                <div className="p-3 bg-slate-50 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 font-medium">
                    Showing {visibleLimit} of {filteredClients.length} clients
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((v) => v + 100)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-800"
                    >
                      Load 100 More
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleLimit(filteredClients.length)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold"
                    >
                      Show All ({filteredClients.length})
                    </button>
                  </div>
                </div>
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
                          {isImporting && importProgress
                            ? `Importing ${importProgress.done} / ${importProgress.total}...`
                            : isImporting
                              ? "Importing Batch..."
                              : `Import ${csvPreviewRows.filter((r) => r.isValid).length} Valid Clients`}
                        </span>
                      </button>
                    </div>
                  </div>

                  {isImporting && importProgress && (
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${Math.round((importProgress.done / Math.max(1, importProgress.total)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block text-right">
                        {importProgress.done} / {importProgress.total} persisted to PostgreSQL
                      </span>
                    </div>
                  )}

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
            TAB 4: ADD SINGLE CLIENT (3-TRACK PRACTICE-GRADE ONBOARDING)
           ========================================================================= */}
        {activeTab === "add" && (
          <form onSubmit={handleCreateClient} autoComplete="off" className="space-y-4 text-xs animate-in fade-in duration-200">
            {/* Enterprise Entity Intelligence Engine */}
            <EntityIntelligenceBox
              initialGstin={gstin}
              initialCin={cin}
              initialPan={pan}
              onAutoFill={(payload: EntityAutoFillPayload) => {
                if (payload.entityName) setEntityName(payload.entityName);
                if (payload.tradeName) setTradeName(payload.tradeName);
                if (payload.gstin) setGstin(payload.gstin);
                if (payload.cin) setCin(payload.cin);
                if (payload.registeredAddress) setRegisteredAddress(payload.registeredAddress);
                if (payload.lastFiledPeriod) setLastFiledGst(payload.lastFiledPeriod);
                if (payload.gstFilingFrequency) {
                  setGstFilingFrequency(payload.gstFilingFrequency as GstFilingFrequency);
                }
                const nextType = (payload.entityType as ClientEntity["type"]) || type;
                if (payload.entityType) {
                  setType(nextType);
                }
                if (payload.pan) {
                  setPan(payload.pan);
                }
                syncDefaultScope(
                  nextType,
                  Boolean(payload.gstin || gstin.trim()),
                  parseFloat(turnoverCr) || 0,
                  Boolean(tan.trim()),
                  parseFloat(digitalTxnPct) || 95
                );
                setGstAutoData({
                  legalName: payload.entityName,
                  tradeName: payload.tradeName,
                  status: payload.gstStatus,
                  stateName: payload.stateName,
                  taxpayerType: payload.taxpayerType,
                  registrationDate: payload.gstRegistrationDate,
                  cancellationDate: payload.gstCancellationDate,
                  address: payload.registeredAddress,
                  normalizedHistory: payload.normalizedHistory,
                });
                toast.success(
                  "Entity Intelligence Applied",
                  `${payload.entityName || payload.gstin || payload.pan} auto-filled${
                    payload.complianceScore !== undefined ? ` • Compliance Score: ${payload.complianceScore}/100` : ""
                  }`
                );
              }}
            />

            {/* Live Smart Onboarding Step & Readiness Strip */}
            {(() => {
              const idReady = Boolean(entityName.trim()) && isValidPan(pan);
              const contactReady = rawCleanPhone.length >= 10;
              const scopeReady = serviceScope.length > 0;
              const keysReady = Boolean(credItUser || credGstUser || credMcaUser || credTracesUser || dscSerialNumber);
              const stepsDone = [idReady, contactReady, scopeReady, keysReady].filter(Boolean).length;
              return (
                <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-lg font-bold transition ${idReady ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-slate-300"}`}>
                      {idReady ? "✓" : "1."} Legal ID
                    </span>
                    <span className="text-slate-500">&rarr;</span>
                    <span className={`px-2 py-0.5 rounded-lg font-bold transition ${contactReady ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-slate-300"}`}>
                      {contactReady ? "✓" : "2."} Signatory
                    </span>
                    <span className="text-slate-500">&rarr;</span>
                    <span className={`px-2 py-0.5 rounded-lg font-bold transition ${scopeReady ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-slate-300"}`}>
                      {scopeReady ? "✓" : "3."} Services
                    </span>
                    <span className="text-slate-500">&rarr;</span>
                    <span className={`px-2 py-0.5 rounded-lg font-bold transition ${keysReady ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-slate-400"}`}>
                      {keysReady ? "✓" : "4."} Day-1 Keys
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-300">
                    {stepsDone}/4 Ready
                  </span>
                </div>
              );
            })()}
            {/* 0. Onboarding Track & Cutover Context */}
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                    0. Onboarding Track
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Sets statutory task rules, cutover periods, and client portal checklist.
                  </p>
                </div>
                <div className="inline-flex flex-wrap bg-white border border-indigo-200 rounded-xl p-0.5 text-[11px] font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setOnboardingMode("EXISTING_CLIENT")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      onboardingMode === "EXISTING_CLIENT" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Existing Firm Client
                  </button>
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
                    New Incorporation
                  </button>
                </div>
              </div>

              {/* Actionable Track Panel */}
              {onboardingMode === "EXISTING_CLIENT" && (
                <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2.5 text-[11px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-extrabold text-emerald-900">
                      Last Filed Cutover (Skips already-filed cycles in Calendar)
                    </span>
                    <span className="text-[10px] text-slate-500">Leave blank to auto-detect from GSTN / current FY</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Last Filed GST Period</label>
                      <input
                        type="text"
                        value={lastFiledGst}
                        onChange={(e) => setLastFiledGst(e.target.value)}
                        placeholder="e.g. Oct 2026 or Q2 FY26"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Last Filed ITR (AY)</label>
                      <input
                        type="text"
                        value={lastFiledItrAy}
                        onChange={(e) => setLastFiledItrAy(e.target.value)}
                        placeholder="e.g. AY 2026-27"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Last ROC Annual Filing (FY)</label>
                      <input
                        type="text"
                        value={lastFiledRocFy}
                        onChange={(e) => setLastFiledRocFy(e.target.value)}
                        placeholder="e.g. FY 2025-26 (AOC-4/MGT-7)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {onboardingMode === "CA_TAKEOVER" && (
                <div className="bg-white border border-indigo-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="font-extrabold text-indigo-900 block mb-1">
                      Takeover Handover Queue ({(CLIENT_ARCHETYPE_BLUEPRINTS[type] || CLIENT_ARCHETYPE_BLUEPRINTS.PVT_LTD).shortLabel}):
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {(CLIENT_ARCHETYPE_BLUEPRINTS[type] || CLIENT_ARCHETYPE_BLUEPRINTS.PVT_LTD).usuallyMissingOnDay1.slice(0, 3).join(" • ")}
                    </p>
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-800 block mb-1">
                      Day-1 Statutory Checks Scheduled:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      NOC &amp; previous CA handover verification, GSTN filing-gap scan, TRACES/26AS notice check &amp; prior AY ITR/3CD retrieval.
                    </p>
                  </div>
                </div>
              )}

              {onboardingMode === "NEW_BUSINESS" && (
                <div className="bg-white border border-sky-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="font-extrabold text-sky-900 block mb-1">
                      Startup Post-Incorporation Milestones:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {(type === "PVT_LTD" || type === "PUBLIC_LTD")
                        ? "INC-20A Commencement (180d) • ADT-1 First Auditor (30d) • Bank Current Account & GST/TAN"
                        : "Current Account Opening • Deed / COI Archive • Optional GST & Shop Act Registration"}
                    </p>
                  </div>
                  <div>
                    <span className="font-extrabold text-emerald-800 block mb-1">
                      Smart Calendar Behavior:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      Prior-year ITR, Tax Audit (3CD) &amp; old ROC annual catch-up tasks are automatically omitted.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 1. Legal Entity Identification */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                  1. Legal Entity Identification
                </h4>
                {(() => {
                  const parsedCin = cin.trim().length === 21 ? parseCinStrict(cin) : null;
                  const parsedTurnover = parseFloat(turnoverCr) || 0;
                  const parsedDigital = parseFloat(digitalTxnPct) || 95;
                  const thresholdPreview = evaluateEntityThresholds(
                    parsedTurnover,
                    Math.max(0, 100 - parsedDigital),
                    false,
                    type
                  );
                  return (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      {parsedCin?.isValid && parsedCin.incorporationYear && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                          Inc. {parsedCin.incorporationYear} • {parsedCin.stateName}
                        </span>
                      )}
                      {thresholdPreview.taxAuditApplicable && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">
                          44AB Audit Applicable
                        </span>
                      )}
                      {thresholdPreview.eInvoicingMandatory && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                          e-Invoice (&ge;5 Cr)
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Entity Legal Name *</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
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
                    onChange={(e) => {
                      const nextType = e.target.value as ClientEntity["type"];
                      setType(nextType);
                      syncDefaultScope(nextType, Boolean(gstin.trim()), parseFloat(turnoverCr) || 0, Boolean(tan.trim()), parseFloat(digitalTxnPct) || 95);
                    }}
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
                    autoComplete="off"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => handlePanChangeWithDecode(e.target.value)}
                    placeholder="e.g. AABCM1234A"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Primary GSTIN (Optional)</label>
                    <div className="flex items-center gap-1.5">
                      {gstin && gstin.trim().length === 15 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          validateGstinDetailed(gstin).isValid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {validateGstinDetailed(gstin).isValid
                            ? `✓ ${validateGstinDetailed(gstin).stateName}`
                            : "⚠ Invalid"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSecondaryGstin((v) => !v)}
                        className="text-[10px] font-bold text-indigo-700 hover:underline"
                      >
                        {showSecondaryGstin ? "Hide 2nd GSTIN" : "+ Add 2nd State GSTIN"}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoComplete="off"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setGstin(val);
                        if (val.length >= 12 && !pan) {
                          handlePanChangeWithDecode(val.substring(2, 12));
                        }
                        syncDefaultScope(type, Boolean(val.trim()), parseFloat(turnoverCr) || 0, Boolean(tan.trim()), parseFloat(digitalTxnPct) || 95);
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
                        title="Fetch Legal Name, PAN, Address & Return History from Live GST Portal"
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
                  {showSecondaryGstin && (
                    <div className="mt-2">
                      <input
                        type="text"
                        autoComplete="off"
                        maxLength={15}
                        value={secondaryGstin}
                        onChange={(e) => setSecondaryGstin(e.target.value.toUpperCase())}
                        placeholder="Additional Branch / State GSTIN (15 chars)"
                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-slate-900 font-mono font-bold text-[11px] focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

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
                      autoComplete="off"
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
                      autoComplete="off"
                      maxLength={10}
                      value={tan}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setTan(val);
                        syncDefaultScope(type, Boolean(gstin.trim()), parseFloat(turnoverCr) || 0, Boolean(val.trim()), parseFloat(digitalTxnPct) || 95);
                      }}
                      placeholder="DELP12345A"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Principal Place / Registered Address (Auto-filled on GST Lookup)</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  placeholder="Registered office / business premises address"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                />
              </div>

              {/* Live GST Verified Details & Day-1 Exposure Card */}
              {gstAutoData && (
                <div className="mt-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Live GST Portal Verified &amp; Exposure Scan
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Status: {gstAutoData.status} | {gstAutoData.taxpayerType}
                      {gstAutoData.registrationDate ? ` | Reg: ${gstAutoData.registrationDate}` : ""}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-emerald-200/60">
                    <div><strong>Legal:</strong> {gstAutoData.legalName}</div>
                    <div><strong>Trade:</strong> {gstAutoData.tradeName}</div>
                  </div>
                  {gstAutoData.normalizedHistory && gstAutoData.normalizedHistory.length > 0 && (
                    <div className="pt-1.5 mt-1 border-t border-emerald-200/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-emerald-800 uppercase tracking-wider">
                          Day-1 Filing History ({gstAutoData.normalizedHistory.filter((r) => !r.arn).length} gaps / {gstAutoData.normalizedHistory.filter((r) => r.delayDays > 0).length} late):
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {gstAutoData.normalizedHistory.slice(0, 6).map((ret, idx) => (
                          <span key={idx} className={`text-[10px] border rounded px-1.5 py-0.5 font-mono ${
                            ret.arn && ret.delayDays === 0
                              ? "bg-white border-emerald-200 text-slate-700"
                              : "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                          }`}>
                            {ret.returnType.replace("_", "-")} ({ret.period}): {ret.arn ? `Filed ${ret.filingDate || ""}` : "Pending"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Primary Signatory & Promoter Group */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                  2. Primary Signatory &amp; Family / Promoter Group
                </h4>
                {(() => {
                  const p10 = rawCleanPhone.slice(-10);
                  if (p10.length !== 10 || selectedGroupId) return null;
                  const matchingClient = clients.find((c) => normalizePhone10(c.primaryContact?.phone || "") === p10);
                  if (!matchingClient) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (matchingClient.groupId) {
                          setSelectedGroupId(matchingClient.groupId);
                        } else {
                          setCustomGroupName(`${matchingClient.name.split(" ")[0]} Group`);
                        }
                      }}
                      className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg hover:bg-indigo-100"
                    >
                      Matches {matchingClient.name} mobile &bull; Link Group
                    </button>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    autoComplete="off"
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
                    autoComplete="off"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 98230 11928"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client Signatory Email ID</label>
                  <input
                    type="email"
                    name="client_signatory_email"
                    autoComplete="new-password"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. accounts@clientdomain.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Link to Promoter / Family Group (Optional)</label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  >
                    <option value="">Auto-group by promoter mobile / Standalone</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.promoterName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Or Create New Group Label</label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={customGroupName}
                    onChange={(e) => {
                      setCustomGroupName(e.target.value);
                      if (e.target.value.trim()) setSelectedGroupId("");
                    }}
                    placeholder="e.g. Parekh Family Group"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                </div>
              </div>

              {/* Portal Access Preview Chip */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] text-slate-600 font-medium">
                    Default Client PIN (last 4 of mobile):{" "}
                    <strong className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      {dynamicPinPreview}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Client Portal:{" "}
                  <span className="font-mono">
                    {portalBaseUrl}/?portal=client{rawCleanPhone.length >= 10 ? `&phone=${rawCleanPhone.slice(-10)}` : ""}
                  </span>
                </span>
              </div>
            </div>

            {/* 3. Retained Services, Thresholds & Practice Assignment */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                  3. Retained Services &amp; Practice Assignment
                </h4>
                <span className="text-[10px] text-slate-500">
                  Only checked services spawn tasks &amp; portal checklists
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SERVICE_SCOPE_OPTIONS.map((opt) => {
                  const checked = serviceScope.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setServiceScopeTouched(true);
                        setServiceScope((prev) =>
                          prev.includes(opt.key) ? prev.filter((k) => k !== opt.key) : [...prev, opt.key]
                        );
                      }}
                      className={`p-2 rounded-xl border text-left transition flex items-start gap-2 ${
                        checked
                          ? "bg-white border-indigo-400 text-slate-900 shadow-sm"
                          : "bg-slate-100/60 border-slate-200 text-slate-500 hover:bg-white"
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-[11px] block leading-tight">{opt.label}</span>
                        <span className="text-[9px] text-slate-500 block truncate">{opt.shortLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Turnover (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={turnoverCr}
                    onChange={(e) => {
                      setTurnoverCr(e.target.value);
                      syncDefaultScope(
                        type,
                        Boolean(gstin.trim()),
                        parseFloat(e.target.value) || 0,
                        Boolean(tan.trim()),
                        parseFloat(digitalTxnPct) || 95
                      );
                    }}
                    placeholder="Enter Cr (optional)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Digital Txn % (44AB)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={digitalTxnPct}
                    onChange={(e) => setDigitalTxnPct(e.target.value)}
                    placeholder="95"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Retainer (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={monthlyRetainerFee}
                    onChange={(e) => setMonthlyRetainerFee(e.target.value)}
                    placeholder="Optional e.g. 15000"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Article</label>
                  <select
                    value={assignedArticle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignedArticle(val);
                      const matched = staffDirectory.find((s) => s.fullName === val);
                      setAssignedArticleId(matched?.id || "");
                    }}
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
                  <label className="font-bold text-slate-700 block mb-1">Partner in Charge</label>
                  <select
                    value={assignedPartner}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignedPartner(val);
                      const matched = staffDirectory.find((s) => s.fullName === val);
                      setAssignedPartnerId(matched?.id || "");
                    }}
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
                    4. Optional Day-1 Portal Credentials &amp; Physical USB DSC (If Available Now)
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
                          autoComplete="off"
                          value={credItUser}
                          onChange={(e) => setCredItUser(e.target.value)}
                          placeholder="User ID (PAN)"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="password"
                          autoComplete="new-password"
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
                          autoComplete="off"
                          value={credGstUser}
                          onChange={(e) => setCredGstUser(e.target.value)}
                          placeholder="GST Username"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="password"
                          autoComplete="new-password"
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
                          autoComplete="off"
                          value={credMcaUser}
                          onChange={(e) => setCredMcaUser(e.target.value)}
                          placeholder="MCA Email / User ID"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="password"
                          autoComplete="new-password"
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
                          autoComplete="off"
                          value={credTracesUser}
                          onChange={(e) => setCredTracesUser(e.target.value)}
                          placeholder="TRACES User ID"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="password"
                          autoComplete="new-password"
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
                        autoComplete="off"
                        value={dscHolderName}
                        onChange={(e) => setDscHolderName(e.target.value)}
                        placeholder="Holder / Director Name"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px]"
                      />
                      <input
                        type="text"
                        autoComplete="off"
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
                {isSubmittingForm ? "Saving..." : "Save Client"}
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
            <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
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
                  <p className="text-xs text-slate-500">Update legal identifiers, contact, service scope &amp; practice owners.</p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} autoComplete="off" className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Entity Legal Name *</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
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
                      autoComplete="off"
                      maxLength={10}
                      value={editPan}
                      onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Primary GSTIN</label>
                    <input
                      type="text"
                      autoComplete="off"
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
                      step="0.01"
                      min="0"
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
                      autoComplete="off"
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
                      autoComplete="off"
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
                    <label className="font-bold text-slate-700 block mb-1">Onboarding Track</label>
                    <select
                      value={editOnboardingMode}
                      onChange={(e) => setEditOnboardingMode(e.target.value as OnboardingMode)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo"
                    >
                      <option value="EXISTING_CLIENT">Existing Firm Client</option>
                      <option value="CA_TAKEOVER">Switch from Previous CA</option>
                      <option value="NEW_BUSINESS">New Incorporation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Signatory Name</label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={editContactName}
                      onChange={(e) => setEditContactName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp / Phone *</label>
                    <input
                      type="tel"
                      required
                      autoComplete="off"
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Signatory Email</label>
                    <input
                      type="email"
                      autoComplete="new-password"
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assigned Article</label>
                    <select
                      value={editAssignedArticle}
                      onChange={(e) => setEditAssignedArticle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    >
                      {staffDirectory
                        .filter((s) => s.role !== "MANAGING_PARTNER")
                        .map((s) => (
                          <option key={s.id} value={s.fullName}>
                            {s.fullName}
                          </option>
                        ))}
                      {staffDirectory.filter((s) => s.role !== "MANAGING_PARTNER").length === 0 && (
                        <option value={editAssignedArticle || ""}>{editAssignedArticle || "Unassigned"}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Partner in Charge</label>
                    <select
                      value={editAssignedPartner}
                      onChange={(e) => setEditAssignedPartner(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    >
                      {staffDirectory
                        .filter((s) => s.role === "MANAGING_PARTNER" || s.role === "PAID_CHARTERED_ACCOUNTANT")
                        .map((s) => (
                          <option key={s.id} value={s.fullName}>
                            {s.fullName}
                          </option>
                        ))}
                      {staffDirectory.filter((s) => s.role === "MANAGING_PARTNER" || s.role === "PAID_CHARTERED_ACCOUNTANT").length === 0 && (
                        <option value={editAssignedPartner}>{editAssignedPartner}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Retained Services</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SERVICE_SCOPE_OPTIONS.map((opt) => {
                      const active = editServiceScope.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            setEditServiceScope((prev) =>
                              prev.includes(opt.key) ? prev.filter((k) => k !== opt.key) : [...prev, opt.key]
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                            active
                              ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          {active ? "✓ " : ""}{opt.label}
                        </button>
                      );
                    })}
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
          const onboardingTrack = bClient.onboardingMode || "EXISTING_CLIENT";
          const isTakeover = onboardingTrack === "CA_TAKEOVER";
          const isExisting = onboardingTrack === "EXISTING_CLIENT";
          const checklistItems = bp.documentChecklist.filter(
            (d) => (!d.takeoverOnly || isTakeover || isExisting) && (!d.gstOnly || readiness.hasGst)
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
                    {isTakeover
                      ? "CA Takeover & Historical Handover Checklist"
                      : isExisting
                        ? "Existing Client Baseline & Historical Vault Checklist"
                        : "New Incorporation Startup Checklist"}
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
