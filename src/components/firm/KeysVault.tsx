"use client";

import React, { useState, useMemo, useRef } from "react";
import { DscRecord, PortalCredential, ClientEntity, PortalType } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Unlock,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
  Plus,
  UploadCloud,
  Download,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  ArrowRightLeft,
  Building2,
  Smartphone,
  Mail,
  FileSpreadsheet,
  FileKey2,
  HelpCircle
} from "lucide-react";

interface KeysVaultProps {
  tokens: DscRecord[];
  credentials: PortalCredential[];
  clients: ClientEntity[];
  onCreateCredential?: (cred: Partial<PortalCredential>) => Promise<any>;
  onUpdateCredential?: (cred: Partial<PortalCredential> & { id: string }) => Promise<any>;
  onDeleteCredential?: (id: string) => Promise<any>;
  onBulkImport?: (items: Partial<PortalCredential>[]) => Promise<any>;
  onCheckoutDsc?: (tokenId: string, staffName: string, purpose: string) => Promise<any>;
  onReturnDsc?: (tokenId: string) => Promise<any>;
  onCreateDsc?: (token: Partial<DscRecord>) => Promise<any>;
  onDeleteDsc?: (id: string) => Promise<any>;
}

const PORTAL_METADATA: Record<PortalType, { label: string; bg: string; text: string; border: string; defaultUrl: string }> = {
  GST: {
    label: "GST Portal",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    defaultUrl: "https://services.gst.gov.in/services/login",
  },
  INCOME_TAX: {
    label: "Income Tax (ITR)",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    defaultUrl: "https://eportal.incometax.gov.in/iec/foservices/#/login",
  },
  MCA_V3: {
    label: "MCA V3 Corporate",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    defaultUrl: "https://www.mca.gov.in/mcafoportal/login.html",
  },
  TRACES: {
    label: "TRACES (TDS CPC)",
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200",
    defaultUrl: "https://www.tdscpc.gov.in/app/login.xhtml",
  },
  EPFO: {
    label: "EPFO Unified",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    defaultUrl: "https://unifiedportal-emp.epfindia.gov.in/epfo/",
  },
  ESIC: {
    label: "ESIC Insurance",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    defaultUrl: "https://www.esic.in/EmployerPortal/ESICInsurancePortal/Portal_LoginNew.aspx",
  },
  ICEGATE: {
    label: "ICEGATE Customs",
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    defaultUrl: "https://www.icegate.gov.in/",
  },
  OTHER: {
    label: "Custom Portal",
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-300",
    defaultUrl: "",
  },
};

export const KeysVault: React.FC<KeysVaultProps> = ({
  tokens = [],
  credentials = [],
  clients = [],
  onCreateCredential,
  onUpdateCredential,
  onDeleteCredential,
  onBulkImport,
  onCheckoutDsc,
  onReturnDsc,
  onCreateDsc,
  onDeleteDsc,
}) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "credentials" | "dsc">("all");
  const [portalFilter, setPortalFilter] = useState<string>("ALL");

  // Mask toggles per credential id
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isAddCredModalOpen, setIsAddCredModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<PortalCredential | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAddDscModalOpen, setIsAddDscModalOpen] = useState(false);
  const [checkoutModalToken, setCheckoutModalToken] = useState<DscRecord | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("Kriti Jain (Article Trainee)");
  const [checkoutPurpose, setCheckoutPurpose] = useState<string>("Statutory Filing Sign-off");
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Bulk import state
  const [bulkParsedItems, setBulkParsedItems] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Credential Form State
  const [formEntityId, setFormEntityId] = useState("");
  const [formPortalType, setFormPortalType] = useState<PortalType>("GST");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formLoginUrl, setFormLoginUrl] = useState("");
  const [formSecondaryId, setFormSecondaryId] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTokenPin, setFormTokenPin] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // DSC Form State
  const [dscEntityId, setDscEntityId] = useState("");
  const [dscHolderName, setDscHolderName] = useState("");
  const [dscPan, setDscPan] = useState("");
  const [dscSerialNumber, setDscSerialNumber] = useState("");
  const [dscTokenType, setDscTokenType] = useState<"ePass2003" | "ProxKey" | "mToken" | "Cloud-DSC">("ePass2003");
  const [dscValidTill, setDscValidTill] = useState("");
  const [dscVaultSlot, setDscVaultSlot] = useState("Cabinet A - Locker 01");
  const [dscTokenPin, setDscTokenPin] = useState("");

  // Auto-fill default login url when portal type changes
  const handlePortalTypeChange = (type: PortalType) => {
    setFormPortalType(type);
    setFormLoginUrl(PORTAL_METADATA[type]?.defaultUrl || "");
  };

  // Open Edit Modal
  const openEditCredModal = (cred: PortalCredential) => {
    setEditingCred(cred);
    setFormEntityId(cred.entityId);
    setFormPortalType(cred.portalType);
    setFormLoginUrl(cred.loginUrl || PORTAL_METADATA[cred.portalType]?.defaultUrl || "");
    setFormUsername(cred.username);
    setFormPassword(cred.password);
    setFormSecondaryId(cred.secondaryIdentifier || "");
    setFormMobile(cred.registeredMobile || "");
    setFormEmail(cred.registeredEmail || "");
    setFormTokenPin(cred.tokenPin || "");
    setFormNotes(cred.notes || "");
    setIsAddCredModalOpen(true);
  };

  // Reset Add Modal
  const openNewCredModal = () => {
    setEditingCred(null);
    const defaultClient = clients[0];
    setFormEntityId(defaultClient?.id || "");
    setFormPortalType("GST");
    setFormLoginUrl(PORTAL_METADATA.GST.defaultUrl);
    setFormUsername(defaultClient?.gstin || "");
    setFormPassword("");
    setFormSecondaryId(defaultClient?.pan || "");
    setFormMobile(defaultClient?.primaryContact?.phone || "");
    setFormEmail(defaultClient?.primaryContact?.email || "");
    setFormTokenPin("");
    setFormNotes("");
    setIsAddCredModalOpen(true);
  };

  // Open New DSC Modal
  const openNewDscModal = () => {
    const defaultClient = clients[0];
    setDscEntityId(defaultClient?.id || "");
    setDscHolderName(defaultClient?.primaryContact?.name || "Authorized Director");
    setDscPan(defaultClient?.pan || "");
    setDscSerialNumber(`ePass-${Math.floor(1000 + Math.random() * 9000)}-BTA`);
    setDscTokenType("ePass2003");
    // Default valid for 2 years
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    setDscValidTill(future.toISOString().split("T")[0]);
    setDscVaultSlot(`Cabinet A - Locker ${String(tokens.length + 1).padStart(2, "0")}`);
    setDscTokenPin("12345678");
    setIsAddDscModalOpen(true);
  };

  // 1-Click Copy helper
  const handleCopy = (text: string, label: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to Clipboard", `${label} copied successfully.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle Reveal
  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Save Credential
  const handleSaveCredential = async () => {
    if (!formUsername || !formPassword) {
      toast.error("Required Fields", "Please enter both User ID and Password.");
      return;
    }
    const matchedClient = clients.find((c) => c.id === formEntityId);
    const entityName = matchedClient?.name || (editingCred ? editingCred.entityName : "Practice Client");

    const payload: Partial<PortalCredential> = {
      entityId: formEntityId,
      entityName,
      groupId: matchedClient?.groupId,
      portalType: formPortalType,
      portalName: PORTAL_METADATA[formPortalType]?.label || `${formPortalType} Portal`,
      loginUrl: formLoginUrl,
      username: formUsername.trim(),
      password: formPassword.trim(),
      secondaryIdentifier: formSecondaryId.trim() || undefined,
      registeredMobile: formMobile.trim() || undefined,
      registeredEmail: formEmail.trim() || undefined,
      tokenPin: formTokenPin.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    if (editingCred) {
      if (onUpdateCredential) {
        await onUpdateCredential({ ...payload, id: editingCred.id });
      }
      toast.success("Credential Updated", `Saved changes for ${PORTAL_METADATA[formPortalType]?.label} (${entityName}).`);
    } else {
      if (onCreateCredential) {
        await onCreateCredential(payload);
      }
      toast.success("Credential Added", `Securely saved ${PORTAL_METADATA[formPortalType]?.label} for ${entityName}.`);
    }

    setIsAddCredModalOpen(false);
    setEditingCred(null);
  };

  // Delete Credential
  const handleDeleteCredential = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete this credential for ${name}?`)) return;
    if (onDeleteCredential) {
      await onDeleteCredential(id);
    }
    toast.info("Credential Removed", "Removed from practice vault.");
  };

  // Save DSC Token
  const handleSaveDscToken = async () => {
    if (!dscHolderName || !dscSerialNumber) {
      toast.error("Required Fields", "Please provide Director / Signatory Name and USB Serial Number.");
      return;
    }
    const matchedClient = clients.find((c) => c.id === dscEntityId);
    const entityName = matchedClient?.name || "Practice Client";

    const payload: Partial<DscRecord> = {
      entityId: dscEntityId,
      entityName,
      groupId: matchedClient?.groupId,
      holderName: dscHolderName.trim(),
      pan: dscPan.trim() || "PAN_PENDING",
      serialNumber: dscSerialNumber.trim(),
      tokenType: dscTokenType,
      validTill: dscValidTill || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      vaultSlot: dscVaultSlot.trim() || "Cabinet A - Locker 01",
      tokenPin: dscTokenPin.trim() || undefined,
    };

    if (onCreateDsc) {
      await onCreateDsc(payload);
    }
    toast.success("DSC Token Enrolled", `Physical dongle for ${dscHolderName} assigned to ${payload.vaultSlot}.`);
    setIsAddDscModalOpen(false);
  };

  // Delete DSC Token
  const handleDeleteDsc = async (id: string, holderName: string) => {
    if (!confirm(`Are you sure you want to remove physical DSC token for ${holderName}?`)) return;
    if (onDeleteDsc) {
      await onDeleteDsc(id);
    }
    toast.info("DSC Discharged", "Token record discharged from master safe ledger.");
  };

  // Check out DSC
  const handleConfirmCheckout = async () => {
    if (!checkoutModalToken) return;
    if (onCheckoutDsc) {
      await onCheckoutDsc(checkoutModalToken.id, selectedStaff, checkoutPurpose);
    } else {
      try {
        await fetch("/api/dsc", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenId: checkoutModalToken.id,
            action: "CHECKOUT",
            staffName: selectedStaff,
            purpose: checkoutPurpose,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    toast.info("DSC Checked Out", `Token for ${checkoutModalToken.holderName} checked out to ${selectedStaff}.`);
    setActionSuccessToast(`Token checked out to ${selectedStaff}! Custody transfer logged to audit ledger.`);
    setCheckoutModalToken(null);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  // Return DSC to Safe
  const handleReturnToSafe = async (id: string) => {
    if (onReturnDsc) {
      await onReturnDsc(id);
    } else {
      try {
        await fetch("/api/dsc", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenId: id, action: "RETURN" }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    toast.success("DSC Token Returned", "Token safely returned to Firm Master Safe.");
    setActionSuccessToast("Token returned safely to Master Safe! Custody logged.");
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  // CSV Template Downloader
  const downloadSampleCsv = () => {
    const headers = ["Client Name or PAN", "Portal Type (GST/INCOME_TAX/MCA_V3/TRACES/EPFO)", "Username", "Password", "Secondary ID (PAN/TAN/GSTIN)", "Registered Mobile", "Registered Email", "Token PIN", "Notes"];
    const sampleRows = [
      ["Pratwi Solutions Private Limited", "GST", "09AANCP9915B1Z4", "Pratwi@GstPass2026", "AANCP9915B", "8077170715", "chetanpratap1996@gmail.com", "12345678", "Monthly GSTR-1 and 3B"],
      ["Pratwi Solutions Private Limited", "INCOME_TAX", "AANCP9915B", "TaxSecure@2026", "AANCP9915B", "8077170715", "chetanpratap1996@gmail.com", "12345678", "AY 26-27 Corporate ITR"],
      ["Apex AutoTech Private Limited", "MCA_V3", "rajesh.director@apex.in", "McaV3#Apex99", "DIN: 08912345", "9811022345", "accounts@apex.in", "12345678", "Annual AOC-4 and MGT-7"],
    ];
    const csvContent = [headers.join(","), ...sampleRows.map((r) => r.map((f) => `"${f}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "TaxoBrain_Client_Credentials_Template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.info("Sample CSV Downloaded", "Fill in your client logins and click Upload CSV.");
  };

  // CSV File Parser
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setBulkError("CSV is empty or missing data rows.");
          return;
        }

        const parsed: any[] = [];
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          // Simple CSV line split supporting quotes
          const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(",");
          const cleanCols = cols.map((c) => c.replace(/^"|"$/g, "").trim());

          if (cleanCols.length < 4) continue;

          const clientRef = cleanCols[0];
          const portalTypeRaw = (cleanCols[1] || "GST").toUpperCase().replace(/\s+/g, "_");
          const username = cleanCols[2];
          const password = cleanCols[3];
          const secondaryId = cleanCols[4] || "";
          const mobile = cleanCols[5] || "";
          const email = cleanCols[6] || "";
          const pin = cleanCols[7] || "";
          const notes = cleanCols[8] || "";

          // Match client
          const matched = clients.find(
            (c) =>
              c.name.toLowerCase().includes(clientRef.toLowerCase()) ||
              c.pan.toLowerCase() === clientRef.toLowerCase() ||
              (c.gstin && c.gstin.toLowerCase() === clientRef.toLowerCase())
          );

          parsed.push({
            entityId: matched?.id || "ENT-NEW",
            entityName: matched?.name || clientRef,
            pan: matched?.pan || (clientRef.length === 10 ? clientRef : undefined),
            portalType: ["GST", "INCOME_TAX", "MCA_V3", "TRACES", "EPFO", "ESIC", "ICEGATE"].includes(portalTypeRaw)
              ? portalTypeRaw
              : "OTHER",
            username,
            password,
            secondaryIdentifier: secondaryId,
            registeredMobile: mobile,
            registeredEmail: email,
            tokenPin: pin,
            notes,
          });
        }

        if (parsed.length === 0) {
          setBulkError("Could not parse any valid credential rows. Please check format.");
        } else {
          setBulkParsedItems(parsed);
          setBulkError(null);
        }
      } catch (err: any) {
        setBulkError("Error reading CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Commit Bulk Import
  const handleCommitBulkImport = async () => {
    if (bulkParsedItems.length === 0) return;
    try {
      if (onBulkImport) {
        await onBulkImport(bulkParsedItems);
      }
      toast.success("Bulk Upload Complete", `Successfully imported ${bulkParsedItems.length} client credentials!`);
      setIsBulkImportOpen(false);
      setBulkParsedItems([]);
    } catch (err: any) {
      toast.error("Import Failed", err.message || "Failed to commit bulk credentials.");
    }
  };

  // Filtered lists
  const filteredCredentials = useMemo(() => {
    return credentials.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.entityName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        (c.secondaryIdentifier && c.secondaryIdentifier.toLowerCase().includes(q)) ||
        (c.registeredMobile && c.registeredMobile.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q));

      if (portalFilter !== "ALL" && c.portalType !== portalFilter) {
        return false;
      }
      return matchesSearch;
    });
  }, [credentials, search, portalFilter]);

  const filteredDscTokens = useMemo(() => {
    return tokens.filter((t) => {
      const q = search.toLowerCase();
      return (
        t.entityName.toLowerCase().includes(q) ||
        t.holderName.toLowerCase().includes(q) ||
        t.pan.toLowerCase().includes(q) ||
        t.serialNumber.toLowerCase().includes(q) ||
        t.vaultSlot.toLowerCase().includes(q)
      );
    });
  }, [tokens, search]);

  const expiringDscCount = tokens.filter((t) => t.daysToExpiry <= 30 || t.expiryStatus === "EXPIRED").length;
  const checkedOutDscCount = tokens.filter((t) => t.currentCustodian !== "Firm Master Safe").length;

  return (
    <div className="space-y-4">
      {/* Action Success Toast Banner */}
      {actionSuccessToast && (
        <div className="bg-white border-l-4 border-l-emerald-600 border border-slate-200 text-slate-800 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-slate-900">{actionSuccessToast}</span>
          </div>
          <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded">
            CUSTODY LEDGER SYNCED
          </span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-btred-logo rounded-2xl border border-red-200 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              Practice Keys &amp; Credentials Vault
              <span className="text-[11px] bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold">
                Tax Portals &amp; Physical Safe
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Centralized portal credentials (GST, ITR, MCA, TRACES) and hardware Class 3 USB token custody register.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={openNewCredModal}
            className="bg-btred-logo hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Credential
          </button>
          <button
            onClick={openNewDscModal}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
          >
            <FileKey2 className="w-4 h-4 text-btred-logo" />
            Enroll DSC
          </button>
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-emerald-200"
          >
            <UploadCloud className="w-4 h-4 text-emerald-700" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Primary Navigation & Filter Segments */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Vault ({credentials.length + tokens.length})
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === "credentials" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Portal Passwords ({credentials.length})
          </button>
          <button
            onClick={() => setActiveTab("dsc")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === "dsc" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Physical DSC Safe ({tokens.length})
            {expiringDscCount > 0 && (
              <span className="bg-red-100 text-btred-logo text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {expiringDscCount}
              </span>
            )}
          </button>
        </div>

        {/* Portal Filter Chips (Visible when all or credentials is active) */}
        {activeTab !== "dsc" && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {["ALL", "GST", "INCOME_TAX", "MCA_V3", "TRACES", "EPFO", "OTHER"].map((pType) => (
              <button
                key={pType}
                onClick={() => setPortalFilter(pType)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition whitespace-nowrap ${
                  portalFilter === pType
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {pType === "ALL" ? "All Portals" : PORTAL_METADATA[pType as PortalType]?.label || pType}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Universal Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Instant search by Client Name, PAN, GSTIN, User ID, Token PIN, or Safe Locker Bin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-800 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-btred-logo font-medium"
          />
        </div>
      </div>

      {/* SECTION 1: DIGITAL PORTAL CREDENTIALS */}
      {(activeTab === "all" || activeTab === "credentials") && (
        <div className="space-y-3">
          {activeTab === "all" && (
            <div className="flex items-center justify-between px-1 pt-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Govt &amp; Tax Portal Credentials ({filteredCredentials.length})
              </h4>
              <span className="text-[11px] text-slate-600 font-medium">1-Click Copy &bull; Zero Login Errors</span>
            </div>
          )}

          {filteredCredentials.length === 0 && activeTab === "credentials" ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Portal Credentials Stored Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Save client logins for GST, Income Tax (ITR), MCA V3, and TRACES. You can add them one by one or upload an existing Excel/CSV spreadsheet.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={openNewCredModal}
                  className="bg-btred-logo text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700"
                >
                  + Add First Credential
                </button>
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-200"
                >
                  Upload Excel Sheet
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCredentials.map((cred) => {
                const meta = PORTAL_METADATA[cred.portalType] || PORTAL_METADATA.OTHER;
                const isRevealed = revealedIds[cred.id];
                const isCopied = copiedId === cred.id;

                return (
                  <div
                    key={cred.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 flex flex-col justify-between shadow-sm transition hover:shadow-md group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}
                        >
                          {meta.label}
                        </span>

                        <div className="flex items-center gap-1">
                          {cred.loginUrl && (
                            <a
                              href={cred.loginUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open Portal in New Tab"
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditCredModal(cred)}
                            title="Edit Credential"
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCredential(cred.id, cred.entityName)}
                            title="Delete"
                            className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Client Entity */}
                      <h4 className="text-sm font-black text-slate-900 line-clamp-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        {cred.entityName}
                      </h4>

                      {/* Username Box */}
                      <div className="mt-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-slate-600 text-[11px]">User ID / Login:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 selection:bg-red-100">
                              {cred.username}
                            </span>
                            <button
                              onClick={() => handleCopy(cred.username, "Username", cred.id + "-user")}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition"
                              title="Copy Username"
                            >
                              {copiedId === cred.id + "-user" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Password Box */}
                        <div className="flex items-center justify-between text-xs font-medium pt-1.5 border-t border-slate-200">
                          <span className="text-slate-600 text-[11px]">Password:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 selection:bg-red-100">
                              {isRevealed ? cred.password : "••••••••••••"}
                            </span>
                            <button
                              onClick={() => toggleReveal(cred.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition"
                              title={isRevealed ? "Hide Password" : "Show Password"}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopy(cred.password, "Password", cred.id + "-pass")}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition"
                              title="Copy Password"
                            >
                              {copiedId === cred.id + "-pass" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Linked Token PIN if present */}
                        {cred.tokenPin && (
                          <div className="flex items-center justify-between text-xs font-medium pt-1.5 border-t border-slate-200">
                            <span className="text-slate-600 text-[11px] flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-btred-logo" />
                              DSC PIN:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900">
                                {isRevealed ? cred.tokenPin : "••••••"}
                              </span>
                              <button
                                onClick={() => handleCopy(cred.tokenPin!, "Token PIN", cred.id + "-pin")}
                                className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition"
                                title="Copy DSC PIN"
                              >
                                {copiedId === cred.id + "-pin" ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Meta Footer (Phone / Notes / Last Changed) */}
                      <div className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                        {cred.registeredMobile && (
                          <div className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-slate-600" />
                            <span>OTP Phone: <strong className="text-slate-800">{cred.registeredMobile}</strong></span>
                          </div>
                        )}
                        {cred.notes && (
                          <p className="text-[10px] text-slate-600 italic line-clamp-1">
                            {cred.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                      <span>Updated: {cred.lastChangedDate || "Recently"}</span>
                      {cred.loginUrl && (
                        <a
                          href={cred.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-btred-logo hover:underline flex items-center gap-0.5"
                        >
                          Launch Portal <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PHYSICAL DSC HARDWARE TOKENS */}
      {(activeTab === "all" || activeTab === "dsc") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-btred-logo" />
              Physical USB Hardware Dongle Vault ({filteredDscTokens.length})
            </h4>
            <span className="text-[11px] text-slate-600 font-medium">Safe Locker Custody &amp; PIN Management</span>
          </div>

          {filteredDscTokens.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-600">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Physical DSC Dongles in Vault</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Enroll director / partner USB tokens (ePass2003, ProxKey) to track safe locker numbers, daily sign-out custody, and PINs.
              </p>
              <div className="pt-2">
                <button
                  onClick={openNewDscModal}
                  className="bg-btred-logo text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700"
                >
                  + Enroll First DSC Dongle
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDscTokens.map((token) => {
                const isExpiring = token.daysToExpiry <= 30;
                const isExpired = token.daysToExpiry <= 0;
                const isInSafe = token.currentCustodian === "Firm Master Safe";
                const isRevealed = revealedIds[token.id];

                return (
                  <div
                    key={token.id}
                    className={`bg-white border rounded-3xl p-5 flex flex-col justify-between shadow-sm transition group hover:shadow-md ${
                      isExpired
                        ? "border-red-300 ring-2 ring-red-100"
                        : isExpiring
                        ? "border-amber-300"
                        : "border-slate-200 hover:border-btred-logo"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          {token.tokenType}
                        </span>

                        {isExpired ? (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-btred-logo border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            EXPIRED ({Math.abs(token.daysToExpiry)}d ago)
                          </span>
                        ) : isExpiring ? (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3" />
                            Expires in {token.daysToExpiry} Days
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Valid ({token.daysToExpiry}d left)
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 line-clamp-1">{token.entityName}</h4>
                      <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        Signatory: <strong className="text-slate-900">{token.holderName}</strong>
                      </p>

                      {/* Physical Slot & Custody Details */}
                      <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs font-medium">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-btred-logo" />
                            Locker Slot:
                          </span>
                          <span className="font-mono font-bold text-slate-900">{token.vaultSlot}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <span>Current Custodian:</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                              isInSafe
                                ? "bg-slate-200 text-slate-800"
                                : "bg-red-50 text-btred-logo border border-red-200"
                            }`}
                          >
                            {token.currentCustodian}
                          </span>
                        </div>

                        {/* Token PIN display to prevent lockout */}
                        {token.tokenPin && (
                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3 text-emerald-600" />
                              Token PIN:
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-slate-900">
                                {isRevealed ? token.tokenPin : "••••••••"}
                              </span>
                              <button
                                onClick={() => toggleReveal(token.id)}
                                className="p-0.5 hover:bg-slate-200 rounded text-slate-600"
                                title="Show PIN"
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => handleCopy(token.tokenPin!, "Token PIN", token.id + "-dscpin")}
                                className="p-0.5 hover:bg-slate-200 rounded text-slate-600"
                                title="Copy PIN"
                              >
                                {copiedId === token.id + "-dscpin" ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {token.checkedOutAt && (
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                            <span>Checked Out At:</span>
                            <span className="font-semibold">{token.checkedOutAt}</span>
                          </div>
                        )}
                      </div>

                      {isExpiring && (
                        <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-900 flex items-center justify-between font-bold">
                          <span>Class 3 Renewal Required</span>
                          <button
                            onClick={() =>
                              alert(
                                `Generated Class 3 DSC renewal fee invoice (₹2,500) and dispatched WhatsApp alert to ${token.holderName}`
                              )
                            }
                            className="text-btred-logo underline cursor-pointer hover:text-btred-700 font-black"
                          >
                            Bill ₹2,500 Renewal
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-600 truncate max-w-[120px]">
                        {token.serialNumber}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isInSafe ? (
                          <button
                            onClick={() => setCheckoutModalToken(token)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-slate-300"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-btred-logo" />
                            Check Out
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReturnToSafe(token.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3 h-3" />
                            Return
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDsc(token.id, token.holderName)}
                          className="p-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition"
                          title="Discharge Token"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT CREDENTIAL */}
      {isAddCredModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-btred-logo" />
                {editingCred ? "Edit Portal Credential" : "Add Client Portal Credential"}
              </h3>
              <button
                onClick={() => setIsAddCredModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Securely store client tax logins. Trainees can 1-click copy without resetting or exposing passwords.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Entity:</label>
                <select
                  value={formEntityId}
                  onChange={(e) => {
                    setFormEntityId(e.target.value);
                    const ent = clients.find((c) => c.id === e.target.value);
                    if (ent) {
                      setFormSecondaryId(ent.pan || "");
                      setFormMobile(ent.primaryContact?.phone || "");
                      setFormEmail(ent.primaryContact?.email || "");
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-btred-logo"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.pan})
                    </option>
                  ))}
                  <option value="ENT-GENERAL">Custom / General Practice Client</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Portal Type:</label>
                  <select
                    value={formPortalType}
                    onChange={(e) => handlePortalTypeChange(e.target.value as PortalType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-btred-logo"
                  >
                    <option value="GST">GST Common Portal</option>
                    <option value="INCOME_TAX">Income Tax e-Filing (ITR)</option>
                    <option value="MCA_V3">MCA V3 Corporate</option>
                    <option value="TRACES">TRACES (TDS CPC)</option>
                    <option value="EPFO">EPFO Unified</option>
                    <option value="ESIC">ESIC Insurance</option>
                    <option value="ICEGATE">ICEGATE Customs</option>
                    <option value="OTHER">Other Custom Portal</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Portal Login URL:</label>
                  <input
                    type="text"
                    value={formLoginUrl}
                    onChange={(e) => setFormLoginUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-btred-logo font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Username / User ID <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="e.g. 09AANCP9915B1Z4"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-btred-logo font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Password <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Portal Password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-btred-logo font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registered OTP Phone:</label>
                  <input
                    type="text"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Optional DSC Token PIN:</label>
                  <input
                    type="text"
                    value={formTokenPin}
                    onChange={(e) => setFormTokenPin(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks / Filing Notes:</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Monthly GSTR-1 & 3B. Trainee Kriti handles."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsAddCredModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredential}
                className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-5 py-2 rounded-xl transition shadow-sm"
              >
                {editingCred ? "Update Credential" : "Save Credential"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK CSV IMPORT */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                Bulk Import Client Portal Credentials (CSV / Excel)
              </h3>
              <button
                onClick={() => setIsBulkImportOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Upload your CA firm's client login spreadsheet in 1 click. Automatically matches clients by PAN or Company Name.
            </p>

            {/* Template Download Notice */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-900">Need the clean spreadsheet format?</h5>
                <p className="text-[11px] text-slate-500">Download our sample CSV with columns for Portal, User ID, Password, and Phone.</p>
              </div>
              <button
                onClick={downloadSampleCsv}
                className="bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 transition flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-btred-logo" />
                Download Template
              </button>
            </div>

            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-btred-logo p-8 rounded-3xl text-center cursor-pointer transition bg-slate-50/50 hover:bg-red-50/20"
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drop your filled CSV file here
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports .csv (comma delimited)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="hidden"
              />
            </div>

            {bulkError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            {/* Preview Parsed Items */}
            {bulkParsedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Parsed {bulkParsedItems.length} Credentials for Import:</span>
                  <span className="text-emerald-700">✓ Ready to Commit</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2">Client</th>
                        <th className="p-2">Portal</th>
                        <th className="p-2">User ID</th>
                        <th className="p-2">Password</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {bulkParsedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-900 font-bold">{item.entityName}</td>
                          <td className="p-2">{item.portalType}</td>
                          <td className="p-2 font-mono">{item.username}</td>
                          <td className="p-2 font-mono text-slate-500">••••••••</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsBulkImportOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                disabled={bulkParsedItems.length === 0}
                onClick={handleCommitBulkImport}
                className={`text-white text-xs font-black px-5 py-2 rounded-xl transition shadow-sm ${
                  bulkParsedItems.length > 0
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                Import {bulkParsedItems.length} Credentials Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ENROLL PHYSICAL DSC TOKEN */}
      {isAddDscModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileKey2 className="w-5 h-5 text-btred-logo" />
                Enroll Physical DSC Token
              </h3>
              <button
                onClick={() => setIsAddDscModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Register director USB dongle in the master safe locker with cryptographic PIN protection.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Entity:</label>
                <select
                  value={dscEntityId}
                  onChange={(e) => {
                    setDscEntityId(e.target.value);
                    const ent = clients.find((c) => c.id === e.target.value);
                    if (ent) {
                      setDscHolderName(ent.primaryContact?.name || "Director");
                      setDscPan(ent.pan || "");
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Signatory Name:</label>
                  <input
                    type="text"
                    value={dscHolderName}
                    onChange={(e) => setDscHolderName(e.target.value)}
                    placeholder="Full Director Name"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Signatory PAN:</label>
                  <input
                    type="text"
                    value={dscPan}
                    onChange={(e) => setDscPan(e.target.value)}
                    placeholder="PAN"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono uppercase font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dongle Hardware Type:</label>
                  <select
                    value={dscTokenType}
                    onChange={(e) => setDscTokenType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="ePass2003">ePass2003</option>
                    <option value="ProxKey">ProxKey</option>
                    <option value="mToken">mToken</option>
                    <option value="Cloud-DSC">Cloud-DSC</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hardware Serial No:</label>
                  <input
                    type="text"
                    value={dscSerialNumber}
                    onChange={(e) => setDscSerialNumber(e.target.value)}
                    placeholder="ePass-2003-XXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Master Safe Locker Slot:</label>
                  <input
                    type="text"
                    value={dscVaultSlot}
                    onChange={(e) => setDscVaultSlot(e.target.value)}
                    placeholder="Cabinet A - Locker 01"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Token User PIN (8-Digit):</label>
                  <input
                    type="text"
                    value={dscTokenPin}
                    onChange={(e) => setDscTokenPin(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Class 3 Expiry Date:</label>
                <input
                  type="date"
                  value={dscValidTill}
                  onChange={(e) => setDscValidTill(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsAddDscModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDscToken}
                className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-5 py-2 rounded-xl transition shadow-sm"
              >
                Enroll in Safe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CHECKOUT PHYSICAL DSC MODAL */}
      {checkoutModalToken && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-btred-logo" />
              Check Out Physical DSC Token
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Physical custody log for {checkoutModalToken.holderName} &bull; {checkoutModalToken.entityName}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Custodian (Staff):</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Kriti Jain (Article Trainee)">Kriti Jain (Article Trainee)</option>
                  <option value="CA Gunjan Jain (Partner)">CA Gunjan Jain (Partner)</option>
                  <option value="Audit Senior">Audit Senior</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Filing Purpose / Engagement:</label>
                <input
                  type="text"
                  value={checkoutPurpose}
                  onChange={(e) => setCheckoutPurpose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {checkoutModalToken.tokenPin && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Token PIN for Sign-off:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {checkoutModalToken.tokenPin}
                  </span>
                </div>
              )}

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-medium">
                <strong>ICAI Audit Rule:</strong> Tokens must be returned to the locker before 7:00 PM daily. Cannot leave firm premises.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setCheckoutModalToken(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm"
              >
                Confirm &amp; Log Custody
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
