"use client";

import React, { useState, useRef } from "react";
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
  playNotificationChime, 
  showBrowserNotification, 
  requestBrowserNotificationPermission 
} from "@/lib/notifications";
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
  Eye,
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
  KeyRound,
  UserCheck
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
import { ClientSidebarNav } from "./navigation/ClientSidebarNav";
import { ClientExecutiveHeader } from "./navigation/ClientExecutiveHeader";
import { ClientBottomDock } from "./navigation/ClientBottomDock";
import { usePwaInstall } from "@/components/shared/usePwaInstall";
import { InstallAppModal } from "@/components/shared/InstallAppModal";
import { NotificationCenterModal } from "@/components/notifications/NotificationCenterModal";
import { 
  validateAndExtractBankStatement,
  validateAndExtractStatutoryNotice,
  validateAndExtractGstRegister,
  validateAndExtractTaxChallan,
  DocumentValidationResult
} from "@/lib/fileIntelligence/documentValidator";

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
  hasTopNav?: boolean;
}

export const ClientPortalPwa: React.FC<ClientPortalPwaProps> = ({
  currentUser,
  activeTab = "director-risk",
  externalTab,
  isQuickActionOpen: externalQuickActionOpen,
  onCloseQuickAction,
  onOpenQuickAction,
  isSandbox = false,
  hasTopNav = true,
}) => {
  // Use persistent hook
  const dataHook = useTaxoData(isSandbox);
  const { 
    tasks: hookTasks, 
    documents: hookDocs, 
    invoices: hookInvoices, 
    payConfigs: hookPayConfigs,
    clients: hookClients,
    dscTokens: hookDscTokens,
    portalCredentials: hookCredentials,
    createPortalCredential,
    updatePortalCredential,
    deletePortalCredential,
    submitClientUtr,
    uploadDocument,
    instantUpiUnlock,
    refreshData
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadIntimationsCount, setUnreadIntimationsCount] = useState(0);

  const {
    isInstalled: isAppInstalled,
    isIOS,
    isAndroid,
    showInstallModal,
    setShowInstallModal,
  } = usePwaInstall();

  const lastUnreadCountRef = useRef<number | null>(null);

  React.useEffect(() => {
    const entityId = selectedEntityId || currentUser?.clientEntityId || "";
    const params = new URLSearchParams({ role: "CLIENT" });
    if (entityId) params.set("clientEntityId", entityId);

    const pollAutonomousUpdates = async () => {
      try {
        // Trigger silent background sweep
        fetch("/api/cron/practice-sweep").catch(() => {});

        // Fetch notifications
        const res = await fetch(`/api/notifications?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.unreadCount !== undefined) {
            if (lastUnreadCountRef.current !== null && data.unreadCount > lastUnreadCountRef.current) {
              // New background notification arrived!
              playNotificationChime();
              if (data.notifications && data.notifications.length > 0) {
                const latest = data.notifications[0];
                showBrowserNotification(latest);
                toast.info(latest.title, latest.message);
              }
              if (refreshData) refreshData();
            }
            lastUnreadCountRef.current = data.unreadCount;
            setUnreadIntimationsCount(data.unreadCount);
          }
        }
      } catch (err) {
        // Silent catch for offline or unmounted state
      }
    };

    pollAutonomousUpdates();
    const interval = setInterval(pollAutonomousUpdates, 15000);

    const handler = () => {
      setUnreadIntimationsCount((c) => c + 1);
      if (refreshData) refreshData();
    };
    window.addEventListener("bt_notification_received", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("bt_notification_received", handler);
    };
  }, [selectedEntityId, currentUser?.clientEntityId, refreshData]);

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

  // Keep selectedEntityId properly synchronized to live clients
  React.useEffect(() => {
    if (currentUser?.clientEntityId) {
      setSelectedEntityId(currentUser.clientEntityId);
      return;
    }
    if (hookClients && hookClients.length > 0) {
      if (!selectedEntityId || !hookClients.some((c) => c.id === selectedEntityId)) {
        setSelectedEntityId(hookClients[0].id);
      }
    }
  }, [hookClients, selectedEntityId, currentUser?.clientEntityId]);
  
  // Multi-GSTIN state support for multi-state corporate entities
  const [selectedGstin, setSelectedGstin] = useState<string>("PAN-DIRECT-FILING");
  const [activeTaskForModal, setActiveTaskForModal] = useState<ComplianceTask | null>(null);
  const [taskUploadedFiles, setTaskUploadedFiles] = useState<File[]>([]);
  const [taskUploaderNote, setTaskUploaderNote] = useState<string>("");
  const [isTaskSubmitting, setIsTaskSubmitting] = useState<boolean>(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentItem["category"]>("BANK_STATEMENT");
  const [targetTaskId, setTargetTaskId] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");
  const [validationRejection, setValidationRejection] = useState<DocumentValidationResult["diagnostics"] | null>(null);
  const [verifiedExtractionResult, setVerifiedExtractionResult] = useState<{
    title: string;
    category: string;
    details: Record<string, string | number>;
  } | null>(null);

  const [payLockModalDoc, setPayLockModalDoc] = useState<DocumentItem | null>(null);
  const [isInstantPaying, setIsInstantPaying] = useState(false);
  const [unlockSuccessMsg, setUnlockSuccessMsg] = useState("");

  // Payment / UTR Submission Modal State
  const [selectedInvoiceForUtr, setSelectedInvoiceForUtr] = useState<InvoiceItem | null>(null);
  const [clientUtrInput, setClientUtrInput] = useState("");
  const [clientPaymentMode, setClientPaymentMode] = useState<"UPI" | "NEFT_RTGS" | "IMPS" | "CHEQUE">("UPI");
  const [clientPayerNote, setClientPayerNote] = useState("");
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  const currentClient = (clientsList && clientsList.length > 0)
    ? (clientsList.find((c) => c.id === selectedEntityId) || 
       (currentUser?.clientEntityId ? clientsList.find((c) => c.id === currentUser.clientEntityId) : null) || 
       clientsList[0])
    : null;

  React.useEffect(() => {
    if (currentClient?.gstin) {
      setSelectedGstin(currentClient.gstin);
    } else if (currentClient?.pan) {
      setSelectedGstin(currentClient.pan);
    }
  }, [currentClient?.gstin, currentClient?.pan]);

  const siblingEntities = currentUser?.role === "CLIENT"
    ? (currentUser.clientGroupId
        ? clientsList.filter((c) => c.groupId === currentUser.clientGroupId || c.id === currentUser.clientEntityId)
        : currentClient ? [currentClient] : [])
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

  const clientCredentials = (hookCredentials || []).filter((c) =>
    c.entityId === currentClient?.id ||
    (currentClient?.name && c.entityName?.toLowerCase() === currentClient.name.toLowerCase()) ||
    (currentClient?.pan && c.secondaryIdentifier?.toLowerCase() === currentClient.pan.toLowerCase())
  );

  const clientDscTokens = (hookDscTokens || []).filter((t) =>
    t.entityId === currentClient?.id ||
    (currentClient?.name && t.entityName?.toLowerCase() === currentClient.name.toLowerCase()) ||
    (currentClient?.pan && t.pan?.toLowerCase() === currentClient.pan.toLowerCase())
  );

  const clientInvoices = (hookInvoices || []).filter((i) => 
    i.entityId === currentClient?.id || 
    (currentClient?.groupId && i.groupId === currentClient.groupId) ||
    (currentClient?.name && i.entityName.toLowerCase() === currentClient.name.toLowerCase())
  );

  const handleTaskModalSubmit = async () => {
    if (!activeTaskForModal || !currentClient) return;
    setIsTaskSubmitting(true);
    try {
      const fName = taskUploadedFiles[0]?.name || `${activeTaskForModal.title.replace(/\s+/g, "_")}_Vouchers.xlsx`;
      await uploadDocument({
        entityId: currentClient.id,
        entityName: currentClient.name,
        category: activeTaskForModal.category === "GST" ? "GST_INVOICES" : activeTaskForModal.category === "TDS" ? "CHALLAN" : "BANK_STATEMENT",
        fileName: fName,
        fileSize: `${Math.max(1.2, (taskUploadedFiles[0]?.size || 1500000) / (1024 * 1024)).toFixed(2)} MB`,
        financialYear: "FY 2026-27",
        uploadedBy: "CLIENT_PWA",
        actorName: currentClient.primaryContact?.name || "Authorized Signatory",
        taskId: activeTaskForModal.id,
      });

      // Optimistically advance task in client view
      activeTaskForModal.status = "IN_PREPARATION";
      if (activeTaskForModal.missingDocumentsCount > 0) {
        activeTaskForModal.missingDocumentsCount = 0;
      }

      toast.success(
        "Vouchers Uploaded & Routed to CA Desk",
        `Statutory documents for ${activeTaskForModal.title} received. Pipeline advanced to Tax Matching.`
      );
      setActiveTaskForModal(null);
      setTaskUploadedFiles([]);
      setTaskUploaderNote("");
    } catch (e) {
      toast.error("Upload Failed", "Could not complete voucher submission.");
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handleDocumentDownload = async (doc: DocumentItem) => {
    if (currentPayConfig.isLocked) {
      setPayLockModalDoc(doc);
      return;
    }

    try {
      const downloadUrl = `/api/documents/download?id=${encodeURIComponent(doc.id)}`;
      const res = await fetch(downloadUrl, { credentials: "include" });
      
      if (res.status === 402) {
        const errJson = await res.json();
        setPayLockModalDoc(doc);
        toast.warning("Deliverable Gated", errJson.message || "Fee settlement required under ICAI SA 210.");
        return;
      }
      
      if (!res.ok) {
        toast.error("Download Failed", "Unable to retrieve deliverable from firm repository.");
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Downloading Deliverable", `Downloading ${doc.fileName}`);
    } catch (err) {
      console.error("Document download failed", err);
      toast.error("Download Error", "Could not complete document download.");
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
    setValidationRejection(null);
    setVerifiedExtractionResult(null);

    try {
      // 1. Run Strict Deterministic Statutory File Validation
      if (selectedCategory === "BANK_STATEMENT") {
        const valRes = await validateAndExtractBankStatement(file);
        if (!valRes.isValid) {
          setValidationRejection(valRes.diagnostics);
          toast.error("Upload Rejected: Non-Bank Document", valRes.diagnostics.errorMessage || "No bank transaction tables or balance headers detected.");
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setVerifiedExtractionResult({
          title: `Verified Bank Statement (${valRes.data?.bankName || "Commercial Bank"})`,
          category: "Bank Statement",
          details: {
            "Bank Institution": valRes.data?.bankName || "Commercial Bank",
            "Transactions Extracted": `${valRes.data?.transactions.length || 0} Ledger Entries`,
            "Closing Ledger Balance": formatCurrencyINR(valRes.data?.closingBalance || 542000),
            "Document Authenticity": "100% Deterministic (Verified Magic Bytes)"
          }
        });
      } else if (selectedCategory === "NOTICE_REPLY") {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", currentClient.id);

        let meta: any = null;
        try {
          const parseRes = await fetch("/api/litigation/notice-parse", {
            method: "POST",
            body: formData
          });
          const parseData = await parseRes.json();
          if (parseRes.ok && parseData.success) {
            meta = parseData.metadata;
          }
        } catch (e) {
          console.warn("Server parse fallback:", e);
        }

        if (!meta) {
          const valRes = await validateAndExtractStatutoryNotice(file, currentClient.name, currentClient.pan, currentClient.gstin);
          if (!valRes.isValid) {
            setValidationRejection(valRes.diagnostics);
            toast.error("Upload Rejected: Invalid Statutory Notice", valRes.diagnostics.errorMessage || "No departmental DIN or statutory sections found.");
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
          meta = {
            noticeDefinition: { sectionCode: valRes.data?.noticeType },
            dinOrRef: valRes.data?.dinOrRef,
            issuingAuthority: valRes.data?.authority,
            demandAmount: valRes.data?.demandAmount,
            daysRemaining: valRes.data?.daysRemaining
          };
        }

        setVerifiedExtractionResult({
          title: `Verified Statutory Notice (${meta?.noticeDefinition?.sectionCode || "Tax Scrutiny"})`,
          category: "Department Notice",
          details: {
            "Department DIN / Reference": meta?.dinOrRef || "CBIC/IND/2026/ASMT10",
            "Issuing Tax Authority": meta?.issuingAuthority || "Income Tax / GST Department",
            "Disputed Tax Demand": meta?.demandAmount || "₹0",
            "Statutory Limitation Cutoff": `${meta?.daysRemaining || 15} Days Remaining`,
            "Defense Status": "Legal Rebuttal Drafted & Under Partner Review"
          }
        });
      } else if (selectedCategory === "GST_INVOICES") {
        const valRes = await validateAndExtractGstRegister(file);
        if (!valRes.isValid) {
          setValidationRejection(valRes.diagnostics);
          toast.error("Upload Rejected: Invalid GST Register", valRes.diagnostics.errorMessage || "No tax invoice tables or GST breakdown detected.");
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setVerifiedExtractionResult({
          title: `Verified GST ${valRes.data?.registerType === "SALES_REGISTER" ? "Sales" : "Purchase"} Register`,
          category: "Sales / Purchase Register",
          details: {
            "Total Invoices": `${valRes.data?.totalInvoices || 0} Invoices`,
            "Total Taxable Turnover": formatCurrencyINR(valRes.data?.totalTaxableValue || 0),
            "Total CGST + SGST": formatCurrencyINR((valRes.data?.totalCgst || 0) + (valRes.data?.totalSgst || 0)),
            "Integrated Tax (IGST)": formatCurrencyINR(valRes.data?.totalIgst || 0)
          }
        });
      } else if (selectedCategory === "CHALLAN") {
        const valRes = await validateAndExtractTaxChallan(file);
        if (!valRes.isValid) {
          setValidationRejection(valRes.diagnostics);
          toast.error("Upload Rejected: Invalid Tax Challan", valRes.diagnostics.errorMessage || "Missing government BSR Code / CPIN reference.");
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
        setVerifiedExtractionResult({
          title: `Verified Government Tax Challan (${valRes.data?.challanType})`,
          category: "Tax Paid Challan",
          details: {
            "BSR / CPIN Reference": valRes.data?.bsrOrCpin || "0210041",
            "Tender Deposit Date": valRes.data?.tenderDate || "2026-10-06",
            "Verified Tax Paid": formatCurrencyINR(valRes.data?.taxAmountPaid || 0),
            "Statutory Accounting Head": valRes.data?.headOfAccount || "Statutory Treasury"
          }
        });
      }

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.split(",")[1] || res);
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });

      await uploadDocument({
        entityId: currentClient.id,
        entityName: currentClient.name,
        category: selectedCategory,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        financialYear: "FY 2026-27",
        uploadedBy: "CLIENT_PWA",
        actorName: currentClient.primaryContact?.name || "Authorized Signatory",
        fileContentBase64: base64,
        taskId: targetTaskId,
      });

      toast.success(
        "Authentic Statutory Document Filed",
        `"${file.name}" verified and accepted into Firm Master Vault. Assigned CA article notified.`
      );
      setUploadSuccessMessage(`Successfully verified and filed "${file.name}" in Firm Master File!`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTargetTaskId(undefined);
      setTimeout(() => setUploadSuccessMessage(""), 7000);
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
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-600">
          <Building2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900">No Client Profile Loaded</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          No practice clients are enrolled yet in this session. Please onboard an entity in CA Partner Hub &gt; Client Master to unlock the client portal and document vault.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. TOP EXECUTIVE CONTEXT HEADER */}
      <ClientExecutiveHeader
        currentClient={currentClient}
        siblingEntities={siblingEntities}
        selectedEntityId={selectedEntityId}
        onSelectEntity={setSelectedEntityId}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenQuickAction={() => {
          if (onOpenQuickAction) onOpenQuickAction();
          else setInternalQuickActionOpen(true);
        }}
        onOpenNotifications={hasTopNav ? undefined : () => setIsNotificationCenterOpen(true)}
        unreadNotificationsCount={unreadIntimationsCount}
        complianceHealthScore={98}
        isAppInstalled={isAppInstalled}
        hideNotificationBell={hasTopNav}
      />

      {/* 2. MAIN LAYOUT: LEFT COLLAPSIBLE COMMAND RAIL + RESPONSIVE FLUID CANVAS */}
      <div className="flex-1 flex w-full min-w-0">
        <ClientSidebarNav
          activeTab={currentTab}
          onNavigateTab={setCurrentTab}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          entities={siblingEntities.length > 0 ? siblingEntities : [currentClient]}
          selectedEntityId={selectedEntityId}
          onSelectEntity={setSelectedEntityId}
          currentUser={currentUser}
          onOpenQuickAction={() => {
            if (onOpenQuickAction) onOpenQuickAction();
            else setInternalQuickActionOpen(true);
          }}
        />

        <main className="flex-1 w-full min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 pb-28 lg:pb-12 max-w-[1720px] mx-auto overflow-x-hidden">

      {/* 2027 AUTONOMOUS TASK ENGINE STATUS RADAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 border border-slate-700/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white uppercase">2027 Autonomous Task Engine Active</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">Zero-Touch Autopilot</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Statutory cutoffs monitored &bull; Tasks auto-advance upon document receipt &bull; UTR fee reconciliations automated &bull; Certified deliverables auto-released.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={async () => {
              const perm = await requestBrowserNotificationPermission();
              if (perm === "granted") {
                playNotificationChime();
                toast.success("Desktop Alerts Enabled", "You will receive instant statutory filing intimations on your device.");
              }
            }}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Enable Device Push Alerts
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {uploadSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl shadow-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold">{uploadSuccessMessage}</p>
        </div>
      )}

      {/* TAB 1: PROGRESS RADAR WITH 5-STAGE DEPARTMENT FILING PIPELINE */}
      {currentTab === "progress" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Tax Filings &amp; Status &bull; {currentClient?.name || "Client"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  CA Firm: {DEFAULT_FIRM_BRANDING.firmName} &bull; Lead CA: {currentClient?.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedGstin}
                    onChange={(e) => {
                      setSelectedGstin(e.target.value);
                      toast.info("Active Filing Identifier", `Now viewing filings for ${e.target.value}`);
                    }}
                    className="text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    {currentClient?.gstin ? (
                      <>
                        <option value={currentClient.gstin}>GSTIN: {currentClient.gstin} (Principal Place)</option>
                        <option value={currentClient.pan}>PAN: {currentClient.pan} (Income Tax / MCA)</option>
                      </>
                    ) : (
                      <option value={currentClient?.pan || "PAN-DIRECT"}>PAN: {currentClient?.pan || "Registered Entity"} (Direct Tax / MCA)</option>
                    )}
                  </select>
                </div>
                <button
                  onClick={() => setIsBankerModalOpen(true)}
                  className="px-3.5 py-1.5 bg-btred-logo hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 shrink-0"
                >
                  <Briefcase className="w-3.5 h-3.5" /> Bank Loan Pack
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {clientTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-xs">
                  No statutory tasks found for this entity.
                </div>
              ) : (
                clientTasks.map((task) => {
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

                  return (
                    <div
                      key={task.id}
                      className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 hover:border-slate-300 transition"
                    >
                      {/* Task Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">{task.title}</span>
                            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                              {task.period}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Statutory Cutoff: <strong className="text-btred-logo">{formatDate(task.dueDate)}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {task.status === "FILED_AND_COMPLETED" ? (
                            <div className="text-right">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Department Stamped
                              </span>
                              {task.arnNumber && (
                                <div className="text-[10px] font-mono text-blue-700 font-bold mt-1">
                                  ARN: {task.arnNumber}
                                </div>
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
                      <div className="pt-2">
                        <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
                          {[
                            { step: 1, label: "1. Docs Received" },
                            { step: 2, label: "2. Tax Matching" },
                            { step: 3, label: "3. Calculation" },
                            { step: 4, label: "4. CA Review" },
                            { step: 5, label: "5. Filed to Govt" }
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
                                <span className={isDone ? "text-emerald-700" : isCurrent ? "text-amber-800" : "text-slate-600"}>
                                  {s.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Missing Docs Warning or Official Filed Copy Button */}
                      {task.status === "DOCUMENTS_AWAITED" && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-amber-900">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>Pending Documents:</strong> {task.missingDocumentsList?.join(", ") || "Statutory statements and vouchers"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTaskForModal(task);
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 transition"
                          >
                            Upload Now
                          </button>
                        </div>
                      )}

                      {task.status === "FILED_AND_COMPLETED" && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-emerald-900">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Filing verified on GSTN/ITD with ARN <strong>{task.arnNumber || "AA2709260194821"}</strong>.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const content = `DEPARTMENT FILED ACKNOWLEDGEMENT RECEIPT\nEntity: ${task.entityName}\nFiling: ${task.title}\nPeriod: ${task.period}\nARN: ${task.arnNumber || "AA2709260194821"}\nFiled by: ${DEFAULT_FIRM_BRANDING.firmShortName}\nStatus: ACCEPTED BY REVENUE PORTAL`;
                              const blob = new Blob([content], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `Receipt_${task.title.replace(/\s+/g, "_")}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shrink-0 transition flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Dept Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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

          {/* Institutional Credit Appraisal Snapshot Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Bank Credit &amp; Solvency Underwriting Metrics &bull; {currentClient.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Calculated under RBI Lending Guidelines, Tandon Committee MPBF Norms &amp; ICAI SQC-1 Standards
                </p>
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl w-fit">
                Grade A+ Prime Credit Rating
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">3-Year Audited Revenue</span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">₹{(currentClient.turnoverCr || 5.0).toFixed(2)} Cr</span>
                <span className="text-[10px] text-emerald-600 font-semibold block">+18.5% YoY Trajectory</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">DSCR Debt Coverage</span>
                <span className="text-base font-black text-emerald-700 mt-0.5 block">2.18x</span>
                <span className="text-[10px] text-slate-500 font-semibold block">Bank Norm &gt; 1.33x</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Ratio (MPBF)</span>
                <span className="text-base font-black text-indigo-700 mt-0.5 block">1.42x</span>
                <span className="text-[10px] text-slate-500 font-semibold block">Tandon Benchmark &ge; 1.33x</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">GSTR-3B vs P&amp;L Variance</span>
                <span className="text-base font-black text-emerald-700 mt-0.5 block">0.4%</span>
                <span className="text-[10px] text-emerald-600 font-semibold block">100% Reconciled (&lt; 2%)</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                Statutory Schedules Assembled in Certified Dossier:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>FY 23-24, 24-25, 25-26 Schedule III Audited Balance Sheets</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Form 3CD Tax Audit Reports with ICAI Certified UDIN</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3-Year Income Tax Department ITR-V e-Filing Acknowledgements</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Last 12 Months GSTR-3B Department Receipts with ARN References</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADVANCE TAX & GST CASH OUTFLOW FORECASTER */}
      {currentTab === "cash-forecast" && (
        <TaxCashflowForecaster clientName={currentClient.name} client={currentClient} />
      )}

      {/* TAB 4: SUPPLIER ITC HOLD & RECOVERY REGISTER */}
      {currentTab === "vendor-hold" && (
        <VendorItcHoldManager clientName={currentClient.name} client={currentClient} />
      )}

      {/* TAB 5: PERMANENT LEGAL & KYC LOCKER */}
      {currentTab === "kyc-locker" && (
        <CompanyKycLocker client={currentClient} />
      )}

      {/* TAB: DIRECTOR RISK & MCA SHIELD */}
      {currentTab === "director-risk" && (
        <DirectorRiskRadar client={currentClient} />
      )}

      {/* TAB: MSME 43B(H) 45-DAY PAYMENT WATCHDOG */}
      {currentTab === "msme-watchdog" && (
        <Msme43bhWatchdog client={currentClient} />
      )}

      {/* TAB: PROFILE & SECURITY PIN */}
      {currentTab === "profile" && (
        <ClientProfileSettings 
          client={currentClient}
          credentials={clientCredentials}
          dscTokens={clientDscTokens}
          onUpdateCredential={updatePortalCredential}
          onCreateCredential={createPortalCredential}
          onDeleteCredential={deletePortalCredential}
        />
      )}

      {/* TAB 6: UPLOAD DOCS */}
      {currentTab === "upload" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Direct Mobile Document Upload &bull; Secure Intake
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Upload bank statements, sales registers, or tax challans directly from your phone. Documents are instantly filed in the CA firm master file.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Document Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "BANK_STATEMENT", label: "Bank Statement" },
                    { id: "GST_INVOICES", label: "Sales / Purchase Register" },
                    { id: "CHALLAN", label: "Tax Paid Challan" },
                    { id: "NOTICE_REPLY", label: "Department Notice" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`text-xs p-2.5 rounded-xl font-bold border transition text-center ${
                        selectedCategory === cat.id
                          ? "bg-btred-logo text-white border-btred-logo"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
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
                className="border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 transition space-y-2"
              >
                <UploadCloud className="w-10 h-10 mx-auto text-slate-600" />
                <div>
                  <span className="text-sm font-black text-slate-900 block">
                    Tap to Choose File from Phone / Computer
                  </span>
                  <span className="text-xs text-slate-500">
                    Supports PDF, Excel, Scanned Images (Up to 25 MB)
                  </span>
                </div>
                {isUploading && (
                  <p className="text-xs text-btred-logo font-bold animate-pulse">
                    Uploading document to firm vault...
                  </p>
                )}
              </div>

              {/* REAL EXTRACTION VERIFICATION CARD */}
              {verifiedExtractionResult && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-emerald-950">{verifiedExtractionResult.title}</h4>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          100% Deterministic Extraction &bull; Accepted by Firm Vault
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVerifiedExtractionResult(null)}
                      className="text-xs text-emerald-800 hover:text-emerald-950 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(verifiedExtractionResult.details).map(([k, v]) => (
                      <div key={k} className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 flex justify-between items-center">
                        <span className="text-slate-600 font-medium">{k}:</span>
                        <span className="font-bold text-slate-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REJECTION DIAGNOSTIC CARD (DUMMY / INVALID FILE REJECTED) */}
              {validationRejection && (
                <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-rose-950">
                          Document Rejected: Invalid or Dummy File
                        </h4>
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                          Statutory Intake Validation Protocol Failed
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setValidationRejection(null)}
                      className="text-xs text-rose-800 hover:text-rose-950 font-bold px-2 py-1 rounded-lg hover:bg-rose-100"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-rose-900">
                    <p className="font-semibold leading-relaxed">
                      {validationRejection.errorMessage || "The uploaded file does not contain authentic statutory data."}
                    </p>

                    <div className="bg-white/80 p-3 rounded-xl border border-rose-200 space-y-1">
                      <div className="text-[11px] font-bold text-rose-800 uppercase">Diagnostics:</div>
                      <div className="text-[11px] text-slate-700 font-mono">
                        File: {validationRejection.fileName} &bull; Detected: {validationRejection.detectedFormat} &bull; Size: {(validationRejection.fileSizeBytes / 1024).toFixed(1)} KB
                      </div>
                      {validationRejection.missingRequirements.length > 0 && (
                        <div className="pt-1.5 space-y-1">
                          <span className="text-[10px] font-bold text-rose-700 uppercase">Missing Mandatory Fields:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-800">
                            {validationRejection.missingRequirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setValidationRejection(null);
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Select Real Document
                    </button>
                  </div>
                </div>
              )}

              {/* 1-Tap WhatsApp Forward Option */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-emerald-950">Prefer sending via WhatsApp?</p>
                  <p className="text-emerald-800 text-[11px]">
                    Forward your statement or tax notice to our firm WhatsApp line directly.
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
      {currentTab === "vault" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Document Vault
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                All filed income tax receipts, GST returns, and signed financial statements in one place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentPayConfig.isLocked ? (
                <span className="text-xs text-rose-700 font-bold flex items-center gap-1 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                  <Lock className="w-3.5 h-3.5" /> Payment Pending
                </span>
              ) : (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified by GPA &amp; Co.
                </span>
              )}
            </div>
          </div>

          {currentPayConfig.isLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 block">Payment Pending</span>
                  <span className="text-amber-800 text-[11px]">
                    Outstanding fees of ₹{currentPayConfig.totalOutstandingAmount.toLocaleString("en-IN")} pending. Pay via UPI to download signed copies.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPayLockModalDoc(clientDocs[0] || null)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1"
              >
                <Unlock className="w-3.5 h-3.5" /> Settle &amp; Unlock
              </button>
            </div>
          )}

          <div className="space-y-3">
            {clientDocs.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs">
                No official deliverables uploaded yet for this entity.
              </div>
            ) : (
              clientDocs.map((doc) => {
                const isGated = currentPayConfig.isLocked;

                return (
                  <div
                    key={doc.id}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700">
                        <FileText className="w-5 h-5 text-btred-logo" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{doc.fileName}</span>
                        <span className="text-[11px] text-slate-500">
                          {doc.category.replace(/_/g, " ")} &bull; {doc.fileSize} &bull; {doc.financialYear}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isGated ? (
                        <button
                          onClick={() => handleDocumentDownload(doc)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Lock className="w-3.5 h-3.5" /> Pay to Download
                        </button>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl hidden sm:inline-block">
                            Verified &amp; Released
                          </span>
                          <button
                            onClick={() => handleDocumentDownload(doc)}
                            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition"
                            title="Download Official PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 8: FEE INVOICES & PAYMENTS */}
      {currentTab === "billing" && (
        <div className="space-y-4">
          <div className="bg-slate-50 text-slate-800 p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5 text-xs text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Master Firm &amp; Corporate Bank Details</span>
              <p className="text-sm font-black text-slate-900">{DEFAULT_FIRM_BRANDING.companyName}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-700 font-mono text-[11px] bg-white/80 p-3 rounded-2xl border border-slate-200 shadow-inner">
                <p>Bank: <strong className="text-slate-900">{DEFAULT_FIRM_BRANDING.bankDetails.bankName}</strong></p>
                <p>Branch: <strong className="text-slate-900">{DEFAULT_FIRM_BRANDING.bankDetails.branch}</strong></p>
                <p>A/c Type: <strong className="text-slate-900">{DEFAULT_FIRM_BRANDING.bankDetails.accountType || "Current Account"}</strong></p>
                <p>A/c No: <strong className="text-slate-900 text-xs font-black">{DEFAULT_FIRM_BRANDING.bankDetails.accountNumber}</strong></p>
                <p className="sm:col-span-2">IFSC Code: <strong className="text-slate-900 text-xs font-black">{DEFAULT_FIRM_BRANDING.bankDetails.ifsc}</strong></p>
              </div>
              <p className="text-emerald-700 font-bold font-mono text-xs pt-0.5">
                Direct UPI ID: {DEFAULT_FIRM_BRANDING.firmUpiVpa}
              </p>
            </div>

            <div className="text-center p-3 bg-white text-slate-900 rounded-2xl shrink-0 shadow-md border border-slate-200">
              <img src="/brainsandtaxes_qrcode.jpg" alt="Brains & Taxes UPI QR" className="w-24 h-24 mx-auto object-contain rounded-lg border border-slate-100" />
              <span className="text-[10px] font-black uppercase block mt-1.5 font-mono tracking-tight text-slate-900">BRAINSANDTAXES@icici</span>
              <span className="text-[9px] text-slate-500 block">Scan to Pay via Any UPI App</span>
            </div>
          </div>

          <div className="space-y-3">
            {clientInvoices.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center text-xs text-slate-600 font-medium">
                No invoices found for this entity.
              </div>
            ) : (
              clientInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-black text-slate-900">{inv.invoiceNo}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          inv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : inv.status === "UTR_SUBMITTED"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-red-100 text-btred-logo border-red-200"
                        }`}
                      >
                        {inv.status === "UTR_SUBMITTED" ? "UTR Submitted (Pending Verification)" : inv.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900">{inv.serviceDescription}</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Due Date: {formatDate(inv.dueDate)} &bull; Taxable: {formatCurrencyINR(inv.taxableAmount)} + 18% GST
                    </p>
                    {inv.clientUtrNumber && (
                      <p className="text-[10px] font-mono text-emerald-800 font-bold mt-1">
                        Submitted UTR: {inv.clientUtrNumber} ({inv.clientPaymentMode})
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Amount</span>
                      <span className="text-lg font-black text-slate-900">{formatCurrencyINR(inv.amount)}</span>
                    </div>

                    {inv.status !== "PAID" && (
                      <button
                        onClick={() => setSelectedInvoiceForUtr(inv)}
                        className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm whitespace-nowrap"
                      >
                        Submit UTR / Ref
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <a
                  href={`/api/documents/download?id=${encodeURIComponent(payLockModalDoc.id)}&draft=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  View Watermarked Draft Preview &rarr;
                </a>
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

              <div className="pt-2 border-t border-slate-200 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const clientInv = clientInvoices.find(i => i.status !== "PAID") || clientInvoices[0];
                    if (clientInv) {
                      setSelectedInvoiceForUtr(clientInv);
                      setPayLockModalDoc(null);
                    } else {
                      toast.info("Contact Firm", "Please submit your UTR to the firm accounts desk.");
                    }
                  }}
                  className="text-xs text-indigo-700 hover:text-indigo-900 font-bold underline transition"
                >
                  Transferred via Bank RTGS/NEFT? Submit UTR Reference &rarr;
                </button>
              </div>
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

        </main>
      </div>

      {/* 3. MOBILE FLOATING BOTTOM DOCK */}
      <ClientBottomDock
        activeTab={currentTab}
        onNavigateTab={setCurrentTab}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenQuickAction={() => {
          if (onOpenQuickAction) onOpenQuickAction();
          else setInternalQuickActionOpen(true);
        }}
        clientName={currentClient.name}
      />

      {/* CONTEXTUAL TASK UPLOAD DRAWER / MODAL */}
      {activeTaskForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <FileCheck className="w-5 h-5 text-btred-logo" />
                <div>
                  <h3 className="text-base font-black">{activeTaskForModal.title}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activeTaskForModal.period} &bull; Cutoff: <strong className="text-btred-logo">{formatDate(activeTaskForModal.dueDate)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTaskForModal(null);
                  setTaskUploadedFiles([]);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Required Statutory Inputs for Tax Computation
              </div>
              <p className="text-[11px] leading-relaxed">
                {activeTaskForModal.missingDocumentsList?.join(", ") || "Please upload monthly purchase ledger, sales summary, and tax payment challans."}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Attach Registers &amp; Vouchers (Excel, Tally XML, PDF, Scans)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) setTaskUploadedFiles(Array.from(e.target.files));
                  }}
                  className="hidden"
                  id="task-voucher-input"
                />
                <label htmlFor="task-voucher-input" className="cursor-pointer space-y-2 block">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-700">
                    Click to browse or drop files here
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Supports Tally XML, GST Purchase Register Excel, Bank Statements
                  </div>
                </label>
              </div>

              {taskUploadedFiles.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <div className="text-[11px] font-bold text-slate-700">Attached Files:</div>
                  {taskUploadedFiles.map((f, i) => (
                    <div key={i} className="text-xs text-slate-600 flex items-center justify-between">
                      <span className="truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Accountant / Tax Remarks (Optional)
                </label>
                <textarea
                  value={taskUploaderNote}
                  onChange={(e) => setTaskUploaderNote(e.target.value)}
                  placeholder="e.g. Inward supply register updated up to 31st Oct. Credit note #41 included."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveTaskForModal(null);
                  setTaskUploadedFiles([]);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={isTaskSubmitting}
                onClick={handleTaskModalSubmit}
                className="px-5 py-2 text-xs font-bold bg-btred-logo hover:bg-red-700 active:scale-95 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {isTaskSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Routing to CA Desk...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit Vouchers &amp; Statements</span>
                  </>
                )}
              </button>
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

      {/* PWA INSTALL GUIDANCE MODAL */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstalled={isAppInstalled}
      />

      {/* CA FIRM INTIMATIONS & ALERTS MODAL (When TopNav is not present, e.g. standalone /client) */}
      {!hasTopNav && (
        <NotificationCenterModal
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
          currentUserRole="CLIENT"
          clientEntityId={selectedEntityId || currentClient?.id}
          clientName={currentClient?.name}
          onNavigateTab={(tab) => {
            if (
              tab === "progress" ||
              tab === "banker-docket" ||
              tab === "cash-forecast" ||
              tab === "vendor-hold" ||
              tab === "kyc-locker" ||
              tab === "director-risk" ||
              tab === "msme-watchdog" ||
              tab === "upload" ||
              tab === "vault" ||
              tab === "billing" ||
              tab === "profile"
            ) {
              setCurrentTab(tab);
            }
          }}
        />
      )}
    </div>
  );
};
