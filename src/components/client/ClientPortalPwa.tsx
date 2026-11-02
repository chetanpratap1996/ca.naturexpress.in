"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  INITIAL_CLIENTS, 
  INITIAL_TASKS, 
  INITIAL_DOCUMENTS, 
  INITIAL_INVOICES,
  INITIAL_PAY_TO_RELEASE_CONFIGS,
  FIRM_METRICS 
} from "@/lib/data/mockData";
import { DocumentItem, InvoiceItem, PayToReleaseConfig, ComplianceTask, ClientEntity } from "@/lib/types";
import { AuthUser } from "@/lib/auth/session";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { toast } from "@/components/shared/ToastNotification";
import { 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  FileText, 
  Download, 
  QrCode, 
  Building2, 
  Layers, 
  Send, 
  Check, 
  CreditCard, 
  X, 
  FileCheck, 
  ShieldCheck, 
  ShieldAlert,
  ExternalLink,
  Lock,
  Unlock,
  AlertTriangle,
  Sparkles,
  IndianRupee,
  Briefcase,
  TrendingUp,
  FolderLock,
  Award,
  ArrowRight,
  Smartphone,
  UserCheck,
  Search,
  Filter,
  Printer,
  Eye,
  Copy,
  RotateCcw,
  Receipt,
  KeyRound
} from "lucide-react";
import { BankerDocketModal } from "./BankerDocketModal";
import { VendorItcHoldManager } from "./VendorItcHoldManager";
import { TaxCashflowForecaster } from "./TaxCashflowForecaster";
import { CompanyKycLocker } from "./CompanyKycLocker";
import { ClientQuickActionModal } from "./ClientQuickActionModal";
import { DirectorRiskRadar } from "./DirectorRiskRadar";
import { Msme43bhWatchdog } from "./Msme43bhWatchdog";
import { ClientProfileSettings } from "./ClientProfileSettings";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export type ClientTabType = 
  | "progress" 
  | "banker-docket" 
  | "cash-forecast" 
  | "vendor-hold" 
  | "kyc-locker" 
  | "director-risk"
  | "msme-watchdog"
  | "upload" 
  | "vault" 
  | "billing"
  | "profile";

interface ClientPortalPwaProps {
  currentUser?: AuthUser | null;
  activeTab?: ClientTabType;
  externalTab?: ClientTabType;
  isQuickActionOpen?: boolean;
  onCloseQuickAction?: () => void;
  onOpenQuickAction?: () => void;
  isSandbox?: boolean;
}

export const ClientPortalPwa: React.FC<ClientPortalPwaProps> = ({
  currentUser,
  activeTab = "progress",
  externalTab,
  isQuickActionOpen: externalQuickActionOpen,
  onCloseQuickAction,
  onOpenQuickAction,
  isSandbox = false,
}) => {
  // Use persistent hook
  const dataHook = useTaxoData(isSandbox);
  const { 
    tasks: hookTasks, 
    documents: hookDocs, 
    invoices: hookInvoices, 
    payConfigs: hookPayConfigs,
    clients: hookClients,
    submitClientUtr,
    uploadDocument,
    instantUpiUnlock
  } = dataHook;

  const clientsList = (hookClients && hookClients.length > 0) ? hookClients : INITIAL_CLIENTS;

  const [selectedEntityId, setSelectedEntityId] = useState<string>(() => {
    if (currentUser?.clientEntityId) return currentUser.clientEntityId;
    return hookClients?.[0]?.id || INITIAL_CLIENTS[0]?.id || "";
  });

  const [currentTab, setCurrentTab] = useState<ClientTabType>(
    externalTab || activeTab
  );
  const [isBankerModalOpen, setIsBankerModalOpen] = useState(false);
  const [internalQuickActionOpen, setInternalQuickActionOpen] = useState(false);
  const [isPwaBannerDismissed, setIsPwaBannerDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDismissed = localStorage.getItem("bt_pwa_banner_dismissed") === "true";
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      setIsPwaBannerDismissed(isDismissed || isStandalone);
    }
  }, []);

  const handleDismissPwaBanner = () => {
    setIsPwaBannerDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("bt_pwa_banner_dismissed", "true");
    }
  };

  const isQuickModalActive = externalQuickActionOpen !== undefined 
    ? externalQuickActionOpen 
    : internalQuickActionOpen;

  const handleCloseQuickModal = () => {
    if (onCloseQuickAction) onCloseQuickAction();
    setInternalQuickActionOpen(false);
  };

  React.useEffect(() => {
    if (externalTab) {
      setCurrentTab(externalTab);
    }
  }, [externalTab]);

  // Keep selectedEntityId properly synchronized to live clients with user isolation
  React.useEffect(() => {
    if (currentUser?.clientEntityId) {
      if (selectedEntityId !== currentUser.clientEntityId && hookClients?.some(c => c.id === currentUser.clientEntityId)) {
        setSelectedEntityId(currentUser.clientEntityId);
      }
    } else if (hookClients && hookClients.length > 0) {
      if (!selectedEntityId || !hookClients.some((c) => c.id === selectedEntityId)) {
        setSelectedEntityId(hookClients[0].id);
      }
    }
  }, [currentUser?.clientEntityId, hookClients, selectedEntityId]);
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentItem["category"]>("BANK_STATEMENT");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");

  const [payLockModalDoc, setPayLockModalDoc] = useState<DocumentItem | null>(null);
  const [isInstantPaying, setIsInstantPaying] = useState(false);
  const [unlockSuccessMsg, setUnlockSuccessMsg] = useState("");

  // Payment / UTR Submission Modal State
  const [selectedInvoiceForUtr, setSelectedInvoiceForUtr] = useState<InvoiceItem | null>(null);
  const [clientUtrInput, setClientUtrInput] = useState("");
  const [clientPaymentMode, setClientPaymentMode] = useState<"UPI" | "NEFT_RTGS" | "IMPS" | "CHEQUE">("UPI");
  const [clientPayerNote, setClientPayerNote] = useState("");
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  // Enterprise Progress Filter & State
  const [progressSearchQuery, setProgressSearchQuery] = useState("");
  const [progressStatusFilter, setProgressStatusFilter] = useState<"ALL" | "FILED" | "IN_PROGRESS" | "DOCS_AWAITED">("ALL");
  const [progressCategoryFilter, setProgressCategoryFilter] = useState<"ALL" | "GST" | "INCOME_TAX" | "TDS" | "ROC">("ALL");
  const [showComplianceCertModal, setShowComplianceCertModal] = useState(false);

  // Enterprise Upload Desk State
  const [pdfPasswordInput, setPdfPasswordInput] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");

  // Enterprise Document Vault State
  const [vaultSearchQuery, setVaultSearchQuery] = useState("");
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState<"ALL" | "ITR" | "GST" | "AUDIT" | "ROC" | "KYC">("ALL");
  const [watermarkPreviewDoc, setWatermarkPreviewDoc] = useState<DocumentItem | null>(null);

  // Enterprise Billing State
  const [billingFilter, setBillingFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<InvoiceItem | null>(null);
  const [tdsDeductionRate, setTdsDeductionRate] = useState<number>(0);

  const matchedClient = (currentUser?.clientEntityId && clientsList.find((c) => c.id === currentUser.clientEntityId))
    || (selectedEntityId && clientsList.find((c) => c.id === selectedEntityId))
    || (clientsList && clientsList.length > 0 ? clientsList[0] : null);

  const currentClient = matchedClient || (currentUser
    ? {
        id: currentUser.clientEntityId || "CLI-PRATWI-01",
        groupId: currentUser.clientGroupId || "GRP-PRATWI-01",
        groupName: currentUser.designation?.includes("(")
          ? `${currentUser.designation.split("(")[1].replace(")", "").trim()} Group`
          : "Practice Client Group",
        name: currentUser.designation?.includes("(")
          ? currentUser.designation.split("(")[1].replace(")", "").trim()
          : currentUser.name || "Pratwi Solutions Private Limited",
        type: "PVT_LTD" as const,
        pan: "AANCP9915B",
        gstin: "09AANCP9915B1Z4",
        turnoverCr: 10.0,
        incorporationYear: 2024,
        penaltyRiskAccrued: 0,
        partnerInCharge: "CA Gunjan Jain (FCA)",
        assignedArticle: "Kriti Jain (Article)",
        primaryContact: {
          name: currentUser.name || "Promoter",
          phone: currentUser.phone || "+91 98000 00000",
          email: currentUser.email || "accounts@client.com",
          designation: currentUser.designation || "Director / Authorized Signatory",
        },
      }
    : INITIAL_CLIENTS[0]);
  const siblingEntities = currentUser?.clientGroupId
    ? clientsList.filter((c) => c.groupId === currentUser.clientGroupId || c.id === currentUser.clientEntityId)
    : currentClient?.groupId 
    ? clientsList.filter((c) => c.groupId === currentClient.groupId)
    : clientsList;

  const currentPayConfig = (hookPayConfigs || []).find((c) => c.entityId === (currentClient?.id || selectedEntityId)) || {
    entityId: currentClient?.id || selectedEntityId,
    isLocked: false,
    totalOutstandingAmount: 0,
    oldestInvoiceDays: 0,
    gracePeriodDays: 30,
    blockedDeliverables: [],
    instantUpiVpa: DEFAULT_FIRM_BRANDING.firmUpiVpa,
    merchantName: DEFAULT_FIRM_BRANDING.firmName,
    lockReason: "Account in good standing."
  };

  // Robust data filtering matching both entityId and entityName for 1000% accuracy
  const clientTasks = (hookTasks || []).filter((t) => 
    t.entityId === currentClient?.id || 
    (currentClient?.name && t.entityName.toLowerCase() === currentClient.name.toLowerCase())
  );

  const clientDocs = (hookDocs || []).filter((d) => 
    d.entityId === currentClient?.id || 
    (currentClient?.name && d.entityName.toLowerCase() === currentClient.name.toLowerCase())
  );

  const clientInvoices = (hookInvoices || []).filter((i) => 
    i.entityId === currentClient?.id || 
    (currentClient?.groupId && i.groupId === currentClient.groupId) ||
    (currentClient?.name && i.entityName.toLowerCase() === currentClient.name.toLowerCase())
  );

  const handleDocumentDownload = (doc: DocumentItem) => {
        if (currentPayConfig.isLocked) {
      setPayLockModalDoc(doc);
    } else {
      const downloadUrl = `/api/documents/download?id=${encodeURIComponent(doc.id)}`;
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Downloading Deliverable", `Downloading ${doc.fileName}`);
      return;
    }
  };

  const handleInstantUpiUnlock = async () => {
    setIsInstantPaying(true);
    try {
      await instantUpiUnlock(selectedEntityId, currentPayConfig.totalOutstandingAmount);
      toast.success(
        "Deliverables Unlocked",
        "Payment verified! Official statutory documents released and available for download."
      );
      setUnlockSuccessMsg("Payment verified! Official deliverable unlocked and released.");
      setTimeout(() => {
        setPayLockModalDoc(null);
        setUnlockSuccessMsg("");
      }, 1500);
    } catch (e) {
      toast.error("Unlock Failed", "Failed to process release payment.");
      console.error(e);
    } finally {
      setIsInstantPaying(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentClient) return;

    setIsUploading(true);
    try {
      await uploadDocument({
        entityId: currentClient.id,
        entityName: currentClient.name,
        category: selectedCategory,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        financialYear: "FY 2026-27",
        uploadedBy: "CLIENT_PWA",
        actorName: currentClient.primaryContact?.name || "Authorized Signatory",
      });
      toast.success(
        "Document Uploaded Successfully",
        `"${file.name}" uploaded to firm vault. Assigned article Kriti Jain notified.`
      );
      setUploadSuccessMessage(`Successfully uploaded "${file.name}" to Firm Master File!`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadSuccessMessage(""), 5000);
    } catch (err) {
      toast.error("Upload Failed", "Could not complete upload to firm vault.");
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitClientUtr = async () => {
    if (!selectedInvoiceForUtr || !currentClient) return;
    if (!clientUtrInput.trim()) {
      alert("Please enter the 12-digit UTR or Bank transaction reference number");
      return;
    }

    setIsSubmittingUtr(true);
    const enteredUtr = clientUtrInput.trim();
    try {
      await submitClientUtr(
        selectedInvoiceForUtr.id,
        enteredUtr,
        clientPaymentMode,
        clientPayerNote.trim() || undefined,
        currentClient.primaryContact.name
      );
      setSelectedInvoiceForUtr(null);
      toast.success(
        "Payment UTR Submitted",
        `UTR ${enteredUtr} received. Firm accounts team notified for bank reconciliation.`
      );
      setUploadSuccessMessage(`Payment reference UTR ${enteredUtr} submitted to CA firm! Receipt will be issued upon bank verification.`);
      setClientUtrInput("");
      setClientPayerNote("");
      setTimeout(() => setUploadSuccessMessage(""), 6000);
    } catch (err) {
      toast.error("Submission Failed", "Could not record UTR reference.");
      console.error(err);
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleOpenFirmWhatsApp = () => {
    toast.info("WhatsApp Connected", "Opening firm compliance chat line...");
    openWhatsAppPreset(
      DEFAULT_FIRM_BRANDING.whatsappNumber,
      "DOC_CHASE",
      {
        clientName: currentClient?.name || "Practice Client",
        serviceName: "Compliance Desk",
        period: "Current Statutory Period",
      }
    );
  };

  if (!currentClient) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-3xl flex items-center justify-center mx-auto text-btred-logo shadow-sm">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900">Client Compliance Desk</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Please log in with your registered entity mobile number or PAN and 4-digit PIN to access your real-time statutory desk and document vault.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.delete("view");
                url.searchParams.delete("demo");
                window.location.href = url.pathname;
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Go to Portal Login</span>
          </button>
          <a
            href="https://wa.me/917999995897?text=Hello%20CA%20Gunjan%20Jain%2C%20please%20activate%20our%20entity%20compliance%20desk."
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-200"
          >
            <span>Contact CA Helpdesk</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-28 sm:pb-20">
      {/* PITCH SANDBOX BANNER (Only when explicitly in sandbox demo mode) */}
      {isSandbox && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 text-amber-950 p-3.5 sm:p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500 text-white shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  🎭 Pitch Sandbox (Client Demo Mode)
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  Simulated Corporate Data
                </span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                Demonstrating 5-Stage Filings, Banker Loan Pack, UPI Pay-to-Release &amp; Vendor ITC Hold for pitches. Real DB remains untouched.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("demo");
                  url.searchParams.delete("view");
                  window.location.href = url.pathname;
                }
              }}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap"
            >
              Exit Demo Mode
            </button>
          </div>
        </div>
      )}

      {/* 1-Tap App Install Hero Banner (Dismissible) */}
      {!isPwaBannerDismissed && (
        <div className="bg-white text-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative animate-in fade-in">
          <div className="flex items-center gap-3 pr-8 sm:pr-0">
            <div className="p-2.5 rounded-2xl bg-btred-logo text-white shadow-md shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                Brains &amp; Taxes Mobile App
                <span className="text-[10px] bg-red-50 text-btred-logo font-bold px-2 py-0.5 rounded-full border border-red-200">
                  1-Tap Install
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Access your document vault, tax filing receipts, and invoices on your phone.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  const event = new CustomEvent("trigger-app-install");
                  window.dispatchEvent(event);
                }
              }}
              className="w-full sm:w-auto px-4 py-2 bg-btred-logo hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download App</span>
            </button>
            <button
              onClick={handleDismissPwaBanner}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition absolute top-3 right-3 sm:static"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Indicator */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-800">
            <strong>Client Portal:</strong> {currentClient.name}
          </span>
        </div>
        <button
          onClick={() => setInternalQuickActionOpen(true)}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition"
        >
          <Sparkles className="w-3 h-3 text-emerald-600" />
          Quick Actions
        </button>
      </div>

      {/* Multi-Entity Family Group Bar */}
      <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-slate-700">Promoter Group:</span>
            <span className="text-sm font-black text-slate-900">{currentClient.groupName}</span>
          </div>
          <span className="text-xs text-slate-600 font-medium">
            {siblingEntities.length} Registered Legal Entities
          </span>
        </div>

        {/* 1-Tap Entity Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {siblingEntities.map((ent) => {
            const isSelected = ent.id === selectedEntityId;
            return (
              <button
                key={ent.id}
                onClick={() => setSelectedEntityId(ent.id)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-btred-logo text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{ent.name}</span>
                <span className="text-[10px] opacity-70 font-mono font-normal">
                  ({ent.pan})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Client Application Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => setCurrentTab("progress")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "progress" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          Filings &amp; Receipts
        </button>

        <button
          onClick={() => setCurrentTab("banker-docket")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "banker-docket" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
          Bank Loan Pack
        </button>

        <button
          onClick={() => setCurrentTab("cash-forecast")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "cash-forecast" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          Tax Planning
        </button>

        <button
          onClick={() => setCurrentTab("vendor-hold")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "vendor-hold" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-rose-500" />
          Vendor Tax Claims
        </button>

        <button
          onClick={() => setCurrentTab("kyc-locker")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "kyc-locker" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FolderLock className="w-3.5 h-3.5 text-emerald-500" />
          Company Documents
        </button>

        <button
          onClick={() => setCurrentTab("director-risk")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "director-risk" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
          Director Risk Radar
        </button>

        <button
          onClick={() => setCurrentTab("msme-watchdog")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "msme-watchdog" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          MSME 43B(h) Watchdog
        </button>

        <button
          onClick={() => setCurrentTab("upload")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "upload" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Upload Documents
        </button>

        <button
          onClick={() => setCurrentTab("profile")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "profile" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
          Profile &amp; Security PIN
        </button>

        <button
          onClick={() => setCurrentTab("vault")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "vault" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-cyan-500" />
          Document Vault
        </button>

        <button
          onClick={() => setCurrentTab("billing")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "billing" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-btred-logo" />
          Invoices &amp; Payments ({clientInvoices.filter(i => i.status !== "PAID").length})
        </button>
      </div>

      {/* Success Notification Banner */}
      {uploadSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl shadow-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold">{uploadSuccessMessage}</p>
        </div>
      )}

      {/* TAB 1: PROGRESS RADAR WITH 5-STAGE DEPARTMENT FILING PIPELINE */}
      {currentTab === "progress" && (() => {
        const filteredTasks = clientTasks.filter((t) => {
          const matchSearch = t.title.toLowerCase().includes(progressSearchQuery.toLowerCase()) ||
                              t.period.toLowerCase().includes(progressSearchQuery.toLowerCase()) ||
                              (t.arnNumber && t.arnNumber.toLowerCase().includes(progressSearchQuery.toLowerCase()));
          if (!matchSearch) return false;

          if (progressStatusFilter === "FILED" && t.status !== "FILED_AND_COMPLETED") return false;
          if (progressStatusFilter === "IN_PROGRESS" && (t.status === "FILED_AND_COMPLETED" || t.status === "DOCUMENTS_AWAITED")) return false;
          if (progressStatusFilter === "DOCS_AWAITED" && t.status !== "DOCUMENTS_AWAITED") return false;

          if (progressCategoryFilter === "GST" && !t.title.toUpperCase().includes("GSTR") && !t.title.toUpperCase().includes("GST")) return false;
          if (progressCategoryFilter === "INCOME_TAX" && !t.title.toUpperCase().includes("ITR") && !t.title.toUpperCase().includes("ADVANCE TAX")) return false;
          if (progressCategoryFilter === "TDS" && !t.title.toUpperCase().includes("TDS") && !t.title.toUpperCase().includes("26Q")) return false;
          if (progressCategoryFilter === "ROC" && !t.title.toUpperCase().includes("ROC") && !t.title.toUpperCase().includes("AOC") && !t.title.toUpperCase().includes("MGT")) return false;

          return true;
        });

        const completedCount = clientTasks.filter(t => t.status === "FILED_AND_COMPLETED").length;
        const totalCount = clientTasks.length || 1;
        const completionRate = Math.round((completedCount / totalCount) * 100);

        const handleExportComplianceCsv = () => {
          const headers = ["Task Title", "Return Period", "Statutory Due Date", "Compliance Status", "ARN / ACK Number", "Assigned CA / Article"];
          const rows = clientTasks.map(t => [
            `"${t.title}"`,
            `"${t.period}"`,
            t.dueDate,
            t.status,
            `"${t.arnNumber || "N/A"}"`,
            `"${t.assignedTo || "Kriti Jain"}"`
          ].join(","));
          const csv = [headers.join(","), ...rows].join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Statutory_Compliance_Ledger_${(currentClient?.name || "Client").replace(/\s+/g, "_")}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("Compliance Ledger Exported", "Filing history downloaded as CSV.");
        };

        return (
          <div className="space-y-5 animate-fadeIn pb-8">
            {/* 1. Header & Controls */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Department Synchronized
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-md">
                    AY 2026-27 &bull; FY 2025-26
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    GSTIN: {currentClient?.gstin || "23AABCP9918K1Z5"}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Tax Filings &amp; Statutory Progress Radar
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Real-time tracking of GST returns, Advance Tax, TDS returns, and MCA ROC compliances with government acknowledgment receipts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowComplianceCertModal(true)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-300"
                >
                  <Printer className="w-4 h-4 text-slate-700" />
                  <span>Compliance Certificate</span>
                </button>
                <button
                  onClick={handleExportComplianceCsv}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export History CSV</span>
                </button>
                <button
                  onClick={() => setIsBankerModalOpen(true)}
                  className="px-4 py-2.5 bg-btred-logo hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Bank Loan Pack</span>
                </button>
              </div>
            </div>

            {/* 2. Statutory Completion Progress Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 w-full md:w-2/3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold uppercase tracking-wider">Statutory Filing Completion Rate</span>
                  <span className="font-mono text-emerald-400 font-black text-sm">{completionRate}% Filed</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-600">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{completedCount} of {totalCount} Compliances Filed on Time</span>
                  <span>Assigned Partner: {currentClient?.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-700/60">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Late Penalty Averted</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">₹25,000+</span>
                  <span className="text-[10px] text-slate-300 block">Sec 234F &amp; Sec 47 Guard</span>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>
            </div>

            {/* 3. Search & Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {[
                    { id: "ALL", label: "All Returns", count: clientTasks.length },
                    { id: "FILED", label: "Filed & Completed", count: clientTasks.filter(t => t.status === "FILED_AND_COMPLETED").length },
                    { id: "IN_PROGRESS", label: "Under Preparation", count: clientTasks.filter(t => t.status !== "FILED_AND_COMPLETED" && t.status !== "DOCUMENTS_AWAITED").length },
                    { id: "DOCS_AWAITED", label: "Docs Awaited", count: clientTasks.filter(t => t.status === "DOCUMENTS_AWAITED").length },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setProgressStatusFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        progressStatusFilter === tab.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        progressStatusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search filing, ARN, period..."
                    value={progressSearchQuery}
                    onChange={(e) => setProgressSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Category Badges */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Department:
                </span>
                {[
                  { id: "ALL", label: "All Depts" },
                  { id: "GST", label: "GST Returns" },
                  { id: "INCOME_TAX", label: "Income Tax / Advance Tax" },
                  { id: "TDS", label: "TDS Statements" },
                  { id: "ROC", label: "MCA ROC Compliances" }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setProgressCategoryFilter(c.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      progressCategoryFilter === c.id
                        ? "bg-btred-logo text-white font-bold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Task Cards with 5-Stage Pipeline */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="font-bold text-slate-800 text-sm">No Filings in Selected Filter</div>
                  <div className="text-xs text-slate-600 mt-1">All compliances under this category are up to date.</div>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const getStepNumber = (status: string) => {
                    switch (status) {
                      case "DOCUMENTS_AWAITED": return 1;
                      case "IN_PREPARATION": return 2;
                      case "MANAGER_REVIEW": return 3;
                      case "PARTNER_SIGN_OFF": return 4;
                      case "FILED_AND_COMPLETED": return 5;
                      default: return 1;
                    }
                  };
                  const currentStep = getStepNumber(task.status);
                  const isFiled = task.status === "FILED_AND_COMPLETED";

                  return (
                    <div
                      key={task.id}
                      className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl space-y-4 hover:border-slate-300 transition shadow-sm"
                    >
                      {/* Task Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-slate-900 text-base">{task.title}</span>
                            <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-700">
                              {task.period}
                            </span>
                            {isFiled && (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Filed on Time
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                            <span>Statutory Cutoff: <strong className="text-btred-logo">{formatDate(task.dueDate)}</strong></span>
                            <span>Assigned: <strong className="text-slate-700">{task.assignedTo || "Kriti Jain (Article)"}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isFiled ? (
                            <div className="text-right">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Department Acknowledged
                              </span>
                              {task.arnNumber && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(task.arnNumber || "");
                                    toast.success("ARN Copied", `ARN ${task.arnNumber} copied to clipboard.`);
                                  }}
                                  className="text-[11px] font-mono text-indigo-700 font-bold mt-1 hover:underline flex items-center gap-1 justify-end"
                                  title="Click to copy ARN"
                                >
                                  <Copy className="w-3 h-3" /> ARN: {task.arnNumber}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> {task.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 5-Stage Visual Progress Bar */}
                      <div className="pt-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
                          {[
                            { step: 1, label: "1. Intake" },
                            { step: 2, label: "2. Reconcile" },
                            { step: 3, label: "3. Tax Computation" },
                            { step: 4, label: "4. CA Sign-off" },
                            { step: 5, label: "5. Dept Filed" }
                          ].map((s) => {
                            const isDone = currentStep >= s.step;
                            const isCurrent = currentStep === s.step;

                            return (
                              <div key={s.step} className="space-y-1">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    isDone
                                      ? "bg-emerald-500 shadow-sm"
                                      : isCurrent
                                      ? "bg-amber-400 animate-pulse"
                                      : "bg-slate-200"
                                  }`}
                                />
                                <span className={isDone ? "text-emerald-700" : isCurrent ? "text-amber-800" : "text-slate-500"}>
                                  {s.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions & Receipt Dispatches */}
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs">
                        {task.status === "DOCUMENTS_AWAITED" ? (
                          <div className="w-full bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-900">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                <strong>Pending Documents:</strong> {task.missingDocumentsList?.join(", ") || "Bank statement & purchase register required to proceed."}
                              </span>
                            </div>
                            <button
                              onClick={() => setCurrentTab("upload")}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 transition shadow-sm"
                            >
                              Upload Now
                            </button>
                          </div>
                        ) : isFiled ? (
                          <div className="w-full bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-emerald-950">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                Formally verified under Class 3 DSC by <strong>CA Gunjan Jain, FCA</strong> &bull; ARN: <strong>{task.arnNumber || "AA2709260194821"}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  openWhatsAppPreset("919823011928", "FILING_ACKNOWLEDGEMENT", {
                                    clientName: currentClient?.name || "Client",
                                    serviceName: task.title,
                                    arnNumber: task.arnNumber || "AA2709260194821"
                                  });
                                }}
                                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
                              >
                                <Send className="w-3 h-3 text-emerald-700" /> WhatsApp Receipt
                              </button>
                              <button
                                onClick={() => {
                                  const content = `=======================================================\nGOVERNMENT OF INDIA - STATUTORY FILING ACKNOWLEDGEMENT\n=======================================================\nAssessee: ${task.entityName || currentClient?.name}\nPAN: ${currentClient?.pan || "AANCP9915B"}\nGSTIN: ${currentClient?.gstin || "23AABCP9918K1Z5"}\nFiling Form: ${task.title}\nPeriod: ${task.period}\nStatutory ARN: ${task.arnNumber || "AA2709260194821"}\nTender Date: ${task.dueDate}\nCertifying Firm: GPA & Co., Chartered Accountants (FRN: 022998C)\nStatus: VALIDATED & ACCEPTED BY REVENUE PORTAL\n=======================================================`;
                                  const blob = new Blob([content], { type: "text/plain" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `Filing_Receipt_${task.title.replace(/\s+/g, "_")}.txt`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  toast.success("Receipt Downloaded", "Statutory ACK receipt downloaded.");
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" /> Download Dept Receipt
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between text-slate-500 text-xs">
                            <span>Target Completion: <strong>{formatDate(task.dueDate)}</strong></span>
                            <span className="font-medium text-slate-600">Computation in progress by audit team</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB 2: BANKER & TENDER LOAN DOCKET */}
      {currentTab === "banker-docket" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-btred-logo border border-red-200">
                Credit Appraisal Tool
              </span>
              <h3 className="text-lg font-black text-slate-900">
                1-Click Banker &amp; Tender Loan Dossier
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Standing in front of the Bank Credit Manager? Generate a bundled, digitally signed 3-year dossier containing Audited Balance Sheets, ITR-V, 3CD with UDIN, and 12-month GSTR-3B department receipts in 1 tap.
              </p>
            </div>
            <button
              onClick={() => setIsBankerModalOpen(true)}
              className="bg-btred-logo hover:bg-red-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 text-xs shrink-0"
            >
              <Briefcase className="w-4 h-4" /> Open Banker Docket Generator
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ADVANCE TAX & GST CASH OUTFLOW FORECASTER */}
      {currentTab === "cash-forecast" && (
        <TaxCashflowForecaster clientName={currentClient.name} />
      )}

      {/* TAB 4: SUPPLIER ITC HOLD & RECOVERY REGISTER */}
      {currentTab === "vendor-hold" && (
        <VendorItcHoldManager clientName={currentClient.name} isSandbox={isSandbox} />
      )}

      {/* TAB 5: PERMANENT LEGAL & KYC LOCKER */}
      {currentTab === "kyc-locker" && (
        <CompanyKycLocker client={currentClient} />
      )}

      {/* TAB: DIRECTOR RISK & MCA SHIELD */}
      {currentTab === "director-risk" && (
        <DirectorRiskRadar client={currentClient} isSandbox={isSandbox} />
      )}

      {/* TAB: MSME 43B(H) 45-DAY PAYMENT WATCHDOG */}
      {currentTab === "msme-watchdog" && (
        <Msme43bhWatchdog client={currentClient} isSandbox={isSandbox} />
      )}

      {/* TAB: PROFILE & SECURITY PIN */}
      {currentTab === "profile" && (
        <ClientProfileSettings 
          client={currentClient} 
          onSwitchEntity={(id) => setSelectedEntityId(id)}
          availableEntities={siblingEntities}
        />
      )}

      {/* TAB 6: UPLOAD DOCS */}
      {currentTab === "upload" && (
        <div className="space-y-6 animate-fadeIn pb-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" /> Statutory Intake Register
                </span>
                <span className="text-xs text-slate-500 font-medium">End-to-End Encrypted &bull; Direct Firm Inward Vault</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Secure Document Intake &amp; Statement Upload Desk
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Upload bank statements, sales registers, or tax challans directly from your phone or desktop. Files are securely ingested into the CA firm master file with automated OCR extraction.
              </p>
            </div>

            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Statutory Document Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "BANK_STATEMENT", label: "Bank Statement (All Banks)" },
                    { id: "GST_INVOICES", label: "Sales & Purchase Register" },
                    { id: "CHALLAN", label: "Tax Paid Challan (ITNS 280/281)" },
                    { id: "NOTICE_REPLY", label: "Income Tax / GST Notice" },
                    { id: "AUDITED_FINANCIALS", label: "Trial Balance / Ledgers" },
                    { id: "BOARD_RESOLUTION", label: "Board Resolution / ROC" },
                    { id: "TDS_CHALLAN", label: "TDS Payment Proof" },
                    { id: "KYC_LEGAL", label: "Director KYC / PAN / Aadhaar" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`text-xs p-2.5 rounded-xl font-bold border transition text-center ${
                        selectedCategory === cat.id
                          ? "bg-btred-logo text-white border-btred-logo shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password for protected statement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Statement Password (If PDF is Password Protected)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PAN in capitals or Customer ID"
                    value={pdfPasswordInput}
                    onChange={(e) => setPdfPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Optional: Enables automated AI bank statement parsing</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Upload Notes / Period Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Current A/c Q2 Statement July-Sept 2026"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800 font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Optional note for the assigned article trainee</span>
                </div>
              </div>

              {/* Real File Input Trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-3xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition space-y-2 group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto group-hover:scale-105 transition">
                  <UploadCloud className="w-6 h-6 text-btred-logo" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block">
                    Tap to Choose Statement or Document
                  </span>
                  <span className="text-xs text-slate-500">
                    Supports PDF, Excel (.xlsx/.xls), CSV, Scanned Receipts (Up to 50 MB)
                  </span>
                </div>
                {isUploading && (
                  <p className="text-xs text-btred-logo font-bold animate-pulse pt-2">
                    Encrypting and uploading file to firm master vault...
                  </p>
                )}
              </div>

              {/* OCR Intake Simulation Preview */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Automated Intake Active:</strong> Bank statement PDF transactions are extracted and cross-checked against GSTR-2B automatically.
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full shrink-0">
                  AI OCR Engine
                </span>
              </div>

              {/* 1-Tap WhatsApp Forward Option */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-emerald-950">Prefer dispatching via WhatsApp?</p>
                  <p className="text-emerald-800 text-[11px]">
                    Forward your statement or tax notice to our firm official WhatsApp line directly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenFirmWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Forward on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: OFFICIAL VAULT */}
      {currentTab === "vault" && (() => {
        const filteredDocs = clientDocs.filter((d) => {
          const matchSearch = d.fileName.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
                              d.category.toLowerCase().includes(vaultSearchQuery.toLowerCase());
          if (!matchSearch) return false;

          if (vaultCategoryFilter === "ITR" && !d.category.includes("ITR") && !d.fileName.toUpperCase().includes("ITR")) return false;
          if (vaultCategoryFilter === "GST" && !d.category.includes("GST") && !d.fileName.toUpperCase().includes("GSTR")) return false;
          if (vaultCategoryFilter === "AUDIT" && !d.category.includes("AUDIT") && !d.fileName.toUpperCase().includes("BALANCE")) return false;
          if (vaultCategoryFilter === "ROC" && !d.category.includes("ROC") && !d.fileName.toUpperCase().includes("MCA")) return false;
          if (vaultCategoryFilter === "KYC" && !d.category.includes("KYC") && !d.fileName.toUpperCase().includes("PAN")) return false;

          return true;
        });

        return (
          <div className="space-y-5 animate-fadeIn pb-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
                      <FolderLock className="w-3.5 h-3.5" /> Certified Master Locker
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Companies Act Sec 129 Compliant</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Official Document Vault &amp; Certified Deliverables
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Filed ITR acknowledgments, signed balance sheets with UDIN, GST returns, and official tax computation sheets.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {currentPayConfig.isLocked ? (
                    <span className="text-xs text-rose-700 font-bold flex items-center gap-1 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                      <Lock className="w-3.5 h-3.5" /> Pay-to-Release Active
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified by GPA &amp; Co.
                    </span>
                  )}
                </div>
              </div>

              {/* Pay to release banner if gated */}
              {currentPayConfig.isLocked && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-900 block">Deliverables Locked Pending Fee Settlement</span>
                      <span className="text-amber-800 text-[11px]">
                        Outstanding professional fees of ₹{currentPayConfig.totalOutstandingAmount.toLocaleString("en-IN")} pending. Settle via instant UPI to download digitally signed copies.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPayLockModalDoc(clientDocs[0] || null)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Settle &amp; Unlock Deliverables
                  </button>
                </div>
              )}

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {[
                    { id: "ALL", label: "All Vault Files" },
                    { id: "ITR", label: "Income Tax" },
                    { id: "GST", label: "GST Returns" },
                    { id: "AUDIT", label: "Audit & Balance Sheets" },
                    { id: "ROC", label: "ROC Forms" },
                    { id: "KYC", label: "Legal & KYC" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setVaultCategoryFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        vaultCategoryFilter === tab.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={vaultSearchQuery}
                    onChange={(e) => setVaultSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Document List */}
              <div className="space-y-3 pt-2">
                {filteredDocs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No official deliverables matching your criteria.
                  </div>
                ) : (
                  filteredDocs.map((doc) => {
                    const isGated = currentPayConfig.isLocked;

                    return (
                      <div
                        key={doc.id}
                        className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm shrink-0">
                            <FileText className="w-5 h-5 text-btred-logo" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{doc.fileName}</span>
                            <span className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                              <span>{doc.category.replace(/_/g, " ")}</span>
                              <span>&bull;</span>
                              <span>{doc.fileSize}</span>
                              <span>&bull;</span>
                              <span>{doc.financialYear}</span>
                              <span>&bull;</span>
                              <span className="text-emerald-700 font-mono font-semibold">UDIN: 26022998AAAAAA{doc.id.slice(-4)}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button
                            onClick={() => setWatermarkPreviewDoc(doc)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold transition flex items-center gap-1 shadow-sm"
                            title="Preview with watermark"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Preview</span>
                          </button>

                          {isGated ? (
                            <button
                              onClick={() => handleDocumentDownload(doc)}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                            >
                              <Lock className="w-3.5 h-3.5" /> Pay to Download
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDocumentDownload(doc)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                              title="Download Official PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 8: FEE INVOICES & PAYMENTS */}
      {currentTab === "billing" && (() => {
        const filteredInvoices = clientInvoices.filter((inv) => {
          if (billingFilter === "PENDING" && inv.status === "PAID") return false;
          if (billingFilter === "PAID" && inv.status !== "PAID") return false;
          return true;
        });

        const totalPending = clientInvoices.filter(i => i.status !== "PAID").reduce((sum, i) => sum + i.amount, 0);

        return (
          <div className="space-y-6 animate-fadeIn pb-8">
            {/* Master Bank Card & QR */}
            <div className="bg-slate-50 text-slate-800 p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-2 text-xs text-center md:text-left w-full">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Statutory CA Practice Bank Registry</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">GST Registered</span>
                </div>
                <h3 className="text-base font-black text-slate-900">{DEFAULT_FIRM_BRANDING.companyName}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 font-mono text-[11px] bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p>Bank: <strong className="text-slate-900">{DEFAULT_FIRM_BRANDING.bankDetails.bankName}</strong></p>
                  <p>Branch: <strong className="text-slate-900">{DEFAULT_FIRM_BRANDING.bankDetails.branch}</strong></p>
                  <p>A/c Type: <strong className="text-slate-900">{DEFAULT_FIRM_BRANDING.bankDetails.accountType || "Current Account"}</strong></p>
                  <p>A/c No: <strong className="text-slate-900 text-xs font-black">{DEFAULT_FIRM_BRANDING.bankDetails.accountNumber}</strong></p>
                  <p className="sm:col-span-2">IFSC Code: <strong className="text-slate-900 text-xs font-black">{DEFAULT_FIRM_BRANDING.bankDetails.ifsc}</strong></p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <p className="text-emerald-700 font-bold font-mono text-xs">
                    Direct UPI VPA: {DEFAULT_FIRM_BRANDING.firmUpiVpa}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(DEFAULT_FIRM_BRANDING.firmUpiVpa);
                      toast.success("UPI ID Copied", "BRAINSANDTAXES@icici copied to clipboard.");
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy VPA
                  </button>
                </div>
              </div>

              <div className="text-center p-4 bg-white text-slate-900 rounded-3xl shrink-0 shadow-md border border-slate-200 w-full sm:w-auto">
                <img src="/brainsandtaxes_qrcode.jpg" alt="Brains & Taxes UPI QR" className="w-28 h-28 mx-auto object-contain rounded-xl border border-slate-100" />
                <span className="text-[11px] font-black uppercase block mt-2 font-mono tracking-tight text-slate-900">BRAINSANDTAXES@icici</span>
                <span className="text-[10px] text-slate-500 block">Scan with GPay, PhonePe, Paytm</span>
              </div>
            </div>

            {/* Filter & TDS Sensitivity Tool */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-slate-700" />
                  <h4 className="text-base font-black text-slate-900">Tax Invoices &amp; Retainer Ledger</h4>
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { id: "ALL", label: "All Invoices" },
                    { id: "PENDING", label: "Pending Dues" },
                    { id: "PAID", label: "Settled Receipts" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setBillingFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        billingFilter === tab.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TDS Section 194J Selector */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">TDS Deduction Advice (Section 194J):</span>
                  <span className="text-[11px] text-slate-500">Corporate clients may deduct TDS before releasing payment.</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={tdsDeductionRate}
                    onChange={(e) => setTdsDeductionRate(Number(e.target.value))}
                    className="p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    <option value={0}>0% TDS (Full Payment / Non-Audit Client)</option>
                    <option value={0.02}>2% TDS u/s 194J(1) (Technical Services)</option>
                    <option value={0.10}>10% TDS u/s 194J(1)(h) (Professional CA Fees)</option>
                  </select>
                </div>
              </div>

              {/* Invoice List */}
              <div className="space-y-3 pt-1">
                {filteredInvoices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-medium">
                    No invoices found matching selected filter.
                  </div>
                ) : (
                  filteredInvoices.map((inv) => {
                    const taxable = inv.taxableAmount || Math.round(inv.amount / 1.18);
                    const calculatedTds = Math.round(taxable * tdsDeductionRate);
                    const netPayable = inv.amount - calculatedTds;

                    return (
                      <div
                        key={inv.id}
                        className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-slate-900">{inv.invoiceNo}</span>
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                inv.status === "PAID"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : inv.status === "UTR_SUBMITTED"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-red-100 text-btred-logo border-red-200"
                              }`}
                            >
                              {inv.status === "UTR_SUBMITTED" ? "UTR Submitted (Reconciliation In Progress)" : inv.status}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900">{inv.serviceDescription}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Due Date: {formatDate(inv.dueDate)} &bull; Taxable: {formatCurrencyINR(taxable)} + 18% GST ({formatCurrencyINR(inv.amount - taxable)})
                          </p>

                          {tdsDeductionRate > 0 && inv.status !== "PAID" && (
                            <p className="text-[11px] font-mono text-indigo-700 font-bold">
                              Less: {(tdsDeductionRate * 100).toFixed(0)}% TDS ({formatCurrencyINR(calculatedTds)}) &rarr; Net Payable: {formatCurrencyINR(netPayable)}
                            </p>
                          )}

                          {inv.clientUtrNumber && (
                            <p className="text-[10px] font-mono text-emerald-800 font-bold mt-1">
                              Submitted UTR: {inv.clientUtrNumber} ({inv.clientPaymentMode})
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full md:w-auto gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">Invoice Total</span>
                            <span className="text-xl font-black text-slate-900">{formatCurrencyINR(inv.amount)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedInvoiceForReceipt(inv)}
                              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>

                            {inv.status !== "PAID" && (
                              <button
                                onClick={() => setSelectedInvoiceForUtr(inv)}
                                className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm whitespace-nowrap"
                              >
                                Submit UTR Ref
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CLIENT UTR SUBMISSION MODAL */}
      {selectedInvoiceForUtr && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedInvoiceForUtr(null)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Submit Payment Reference / UTR
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Invoice #{selectedInvoiceForUtr.invoiceNo} &bull; {formatCurrencyINR(selectedInvoiceForUtr.amount)}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  12-Digit Bank UTR / Transaction ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 429810849201 or UPI-Ref-0091"
                  value={clientUtrInput}
                  onChange={(e) => setClientUtrInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 font-mono text-xs px-3.5 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Mode
                </label>
                <select
                  value={clientPaymentMode}
                  onChange={(e) => setClientPaymentMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs px-3.5 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-medium"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, BHIM)</option>
                  <option value="NEFT_RTGS">NEFT / RTGS Bank Transfer</option>
                  <option value="IMPS">IMPS Immediate Payment</option>
                  <option value="CHEQUE">Cheque Deposited in Bank</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Notes / Remitter Account Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sent from Suresh Kulkarni HDFC A/c"
                  value={clientPayerNote}
                  onChange={(e) => setClientPayerNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs px-3.5 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedInvoiceForUtr(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitClientUtr}
                disabled={isSubmittingUtr}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                {isSubmittingUtr ? "Submitting..." : "Submit UTR to CA Firm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAY-TO-RELEASE GATEKEEPER MODAL */}
      {payLockModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Document Download Gated</h3>
                  <p className="text-[11px] text-slate-500">Firm Statutory Delivery Protocol</p>
                </div>
              </div>
              <button
                onClick={() => setPayLockModalDoc(null)}
                className="text-slate-600 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between items-center text-slate-600">
                <span>Requested Document:</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">{payLockModalDoc.fileName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Outstanding Balance:</span>
                <span className="font-extrabold text-rose-600 text-sm">₹{currentPayConfig.totalOutstandingAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                {currentPayConfig.lockReason}
              </div>
            </div>

            {/* Dynamic UPI Payment Options */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3">
              <div className="text-xs font-bold text-indigo-950 flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" /> Instant UPI Auto-Release
              </div>

              {/* Dynamic QR Simulation */}
              <div className="mx-auto w-36 h-36 bg-white border-2 border-slate-200 rounded-2xl p-2 flex flex-col items-center justify-center shadow-inner relative">
                <div className="w-full h-full bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-2 text-slate-800">
                  <img src="/brainsandtaxes_qrcode.jpg" alt="Brains & Taxes UPI QR" className="w-24 h-24 mx-auto object-contain rounded-lg" />
                  <span className="text-[9px] font-mono mt-1 text-slate-600 font-bold">BRAINSANDTAXES@icici</span>
                </div>
              </div>

              <div className="text-xs space-y-0.5">
                <div className="font-mono font-bold text-slate-800">{DEFAULT_FIRM_BRANDING.firmUpiVpa}</div>
                <div className="text-[11px] text-slate-500">Payee: {DEFAULT_FIRM_BRANDING.companyName} &bull; ICICI Bank, New Palasia, Indore (A/C: {DEFAULT_FIRM_BRANDING.bankDetails.accountNumber})</div>
              </div>

              <button
                onClick={handleInstantUpiUnlock}
                disabled={isInstantPaying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition text-xs shadow-md flex items-center justify-center gap-2"
              >
                {isInstantPaying ? (
                  <span>Verifying Payment with NPCI...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Settle ₹{currentPayConfig.totalOutstandingAmount.toLocaleString("en-IN")} &amp; Download Instantly
                  </>
                )}
              </button>
            </div>

            {unlockSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{unlockSuccessMsg}</span>
              </div>
            )}

            <div className="text-center">
              <p className="text-[11px] text-slate-600">
                Facing an issue? Contact Managing Partner {DEFAULT_FIRM_BRANDING.managingPartner} directly on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STATUTORY COMPLIANCE CERTIFICATE MODAL */}
      {showComplianceCertModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Certificate of Statutory Compliance</h3>
                <p className="text-xs text-slate-500 font-medium">Issued for Bankers, Auditors &amp; Tenders</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Certificate
                </button>
                <button onClick={() => setShowComplianceCertModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-800 font-sans leading-relaxed">
              <div className="text-center pb-2 border-b border-slate-200 space-y-0.5">
                <p className="font-serif font-black text-slate-900 text-sm tracking-wide">GPA &amp; CO., CHARTERED ACCOUNTANTS</p>
                <p className="text-[11px] text-slate-500">Firm Registration No: 022998C &bull; Peer Review Certificate: 014928</p>
                <p className="text-[11px] text-slate-500">Address: 204, Shekhar Central, Palasia Square, Indore - 452001 (M.P.)</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <p><strong>To Whom It May Concern / The Branch Credit Committee:</strong></p>
                <p>This is to certify that we have verified the statutory tax records of <strong>{currentClient?.name}</strong> (PAN: <strong>{currentClient?.pan}</strong>, GSTIN: <strong>{currentClient?.gstin}</strong>) for the Assessment Year 2026-27 and Financial Year 2025-26.</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 block">Summary of Compliance Status:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li><strong>Goods and Services Tax:</strong> All monthly GSTR-1 and GSTR-3B returns are filed up to the preceding month with zero overdue liabilities.</li>
                  <li><strong>Advance Tax &amp; Income Tax:</strong> The company is compliant with quarterly installments under Section 208/211 of the Income Tax Act, 1961.</li>
                  <li><strong>MSME Section 43B(h):</strong> Supplier payments are tracked under MSMED Act 2006 with no adverse statutory disallowance reported.</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[11px]">
                <div>
                  <p className="font-bold text-slate-900">Date: {formatDate(new Date().toISOString())}</p>
                  <p className="text-slate-500">Place: Indore</p>
                  <p className="font-mono text-emerald-700 font-bold mt-1">UDIN: 26022998COMP202601</p>
                </div>
                <div className="text-right">
                  <div className="w-28 border-b border-slate-400 mb-1"></div>
                  <p className="font-bold text-slate-900">CA Gunjan Jain</p>
                  <p className="text-slate-500">Partner &bull; M.No. 408912</p>
                  <p className="text-slate-400">For GPA &amp; Co., Chartered Accountants</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WATERMARK PREVIEW MODAL */}
      {watermarkPreviewDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Deliverable Certified Preview</h3>
                  <p className="text-xs text-slate-500">{watermarkPreviewDoc.fileName}</p>
                </div>
              </div>
              <button onClick={() => setWatermarkPreviewDoc(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-slate-100 border border-slate-300 rounded-2xl p-6 text-center min-h-[220px] flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none">
                <span className="text-3xl font-black rotate-[-30deg] tracking-widest text-slate-900 uppercase">
                  CONFIDENTIAL &bull; GPA &amp; CO. CERTIFIED
                </span>
              </div>
              <FileText className="w-16 h-16 text-slate-400 mb-2 relative z-10" />
              <p className="text-sm font-black text-slate-800 relative z-10">{watermarkPreviewDoc.fileName}</p>
              <p className="text-xs text-slate-500 relative z-10 mt-1">
                {watermarkPreviewDoc.category} &bull; {watermarkPreviewDoc.fileSize} &bull; {watermarkPreviewDoc.financialYear}
              </p>
              <div className="mt-3 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-mono text-emerald-700 font-bold relative z-10 shadow-sm">
                UDIN: 26022998AAAAAA{watermarkPreviewDoc.id.slice(-4)} &bull; Digitally Signed
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setWatermarkPreviewDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDocumentDownload(watermarkPreviewDoc);
                  setWatermarkPreviewDoc(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Official Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE / RECEIPT MODAL */}
      {selectedInvoiceForReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Tax Invoice &amp; Official Fee Receipt</h3>
                <p className="text-xs text-slate-500 font-mono">Invoice #{selectedInvoiceForReceipt.invoiceNo}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setSelectedInvoiceForReceipt(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-800">
              <div className="text-center pb-2 border-b border-slate-100">
                <p className="font-black text-slate-900 text-sm">{DEFAULT_FIRM_BRANDING.companyName}</p>
                <p className="text-[11px] text-slate-500 font-mono">GSTIN: {DEFAULT_FIRM_BRANDING.gstin || "23AABCG1234M1Z1"} &bull; SAC Code: {selectedInvoiceForReceipt.sacCode || "998231"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Billed To:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForReceipt.entityName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Due Date:</span>
                  <span className="font-bold text-slate-900">{formatDate(selectedInvoiceForReceipt.dueDate)}</span>
                </div>
              </div>

              <div className="space-y-1.5 py-1">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Professional Services:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForReceipt.serviceDescription}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-bold">{formatCurrencyINR(selectedInvoiceForReceipt.taxableAmount || Math.round(selectedInvoiceForReceipt.amount / 1.18))}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>CGST (9%):</span>
                  <span className="font-mono">{formatCurrencyINR(Math.round(((selectedInvoiceForReceipt.amount - (selectedInvoiceForReceipt.taxableAmount || Math.round(selectedInvoiceForReceipt.amount / 1.18)))) / 2))}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>SGST (9%):</span>
                  <span className="font-mono">{formatCurrencyINR(Math.round(((selectedInvoiceForReceipt.amount - (selectedInvoiceForReceipt.taxableAmount || Math.round(selectedInvoiceForReceipt.amount / 1.18)))) / 2))}</span>
                </div>
                <div className="flex justify-between py-2 bg-slate-100 px-3 rounded-xl font-black text-sm text-slate-900">
                  <span>Total Payable:</span>
                  <span>{formatCurrencyINR(selectedInvoiceForReceipt.amount)}</span>
                </div>
              </div>

              {selectedInvoiceForReceipt.clientUtrNumber && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-0.5">
                  <span className="font-bold block">Payment Reference Recorded:</span>
                  <p className="font-mono text-[11px]">UTR: {selectedInvoiceForReceipt.clientUtrNumber} ({selectedInvoiceForReceipt.clientPaymentMode})</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BANKER & TENDER LOAN DOCKET MODAL */}
      <BankerDocketModal
        client={currentClient}
        isOpen={isBankerModalOpen}
        onClose={() => setIsBankerModalOpen(false)}
      />

      {/* CLIENT QUICK ACTION HUB MODAL */}
      <ClientQuickActionModal
        isOpen={isQuickModalActive}
        onClose={handleCloseQuickModal}
        clientName={currentClient.name}
        onNavigateTab={(tab) => setCurrentTab(tab as any)}
        onOpenBankerDocket={() => setIsBankerModalOpen(true)}
        onOpenUpload={() => setCurrentTab("upload")}
        onOpenWhatsApp={handleOpenFirmWhatsApp}
      />
    </div>
  );
};
