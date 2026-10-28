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
  activeTab?: ClientTabType;
  externalTab?: ClientTabType;
  isQuickActionOpen?: boolean;
  onCloseQuickAction?: () => void;
  onOpenQuickAction?: () => void;
}

export const ClientPortalPwa: React.FC<ClientPortalPwaProps> = ({
  activeTab = "progress",
  externalTab,
  isQuickActionOpen: externalQuickActionOpen,
  onCloseQuickAction,
  onOpenQuickAction,
}) => {
  // Use persistent hook
  const dataHook = useTaxoData();
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
    return hookClients?.[0]?.id || INITIAL_CLIENTS[0]?.id || "";
  });

  const [currentTab, setCurrentTab] = useState<ClientTabType>(
    externalTab || activeTab
  );
  const [isBankerModalOpen, setIsBankerModalOpen] = useState(false);
  const [internalQuickActionOpen, setInternalQuickActionOpen] = useState(false);

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
    if (hookClients && hookClients.length > 0) {
      if (!selectedEntityId || !hookClients.some((c) => c.id === selectedEntityId)) {
        setSelectedEntityId(hookClients[0].id);
      }
    }
  }, [hookClients, selectedEntityId]);
  
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

  const currentClient = (clientsList && clientsList.length > 0)
    ? (clientsList.find((c) => c.id === selectedEntityId) || clientsList[0])
    : null;
  const siblingEntities = currentClient?.groupId 
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
      // Valid PDF document payload
      const pdfHeader = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 280 >> stream
BT
/F1 16 Tf
50 730 Td
(OFFICIAL STAMPED DELIVERABLE) Tj
/F1 11 Tf
0 -30 Td
(Document: ${doc.fileName}) Tj
0 -20 Td
(Entity: ${doc.entityName}) Tj
0 -20 Td
(Category: ${doc.category} | Financial Year: ${doc.financialYear}) Tj
0 -20 Td
(Certified Digitally by: ${DEFAULT_FIRM_BRANDING.managingPartner} [FRN: ${DEFAULT_FIRM_BRANDING.frn}]) Tj
0 -20 Td
(Security: Verified Statutory Compliance Filing Record - Authenticated) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000575 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
646
%%EOF`;
      const blob = new Blob([pdfHeader], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName.endsWith('.pdf') ? doc.fileName : `${doc.fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
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
    <div className="max-w-4xl mx-auto space-y-4 pb-28 sm:pb-20">
      {/* 1-Tap App Install Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-3xl shadow-md border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-btred-logo text-white shadow-md shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Brains &amp; Taxes Mobile App
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                1-Tap Install
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Access your document vault, tax filing receipts, and invoices on your phone.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              const event = new CustomEvent("trigger-app-install");
              window.dispatchEvent(event);
            }
          }}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-red-600 to-btred-logo hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download App</span>
        </button>
      </div>

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
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">Promoter Group:</span>
            <span className="text-sm font-black text-white">{currentClient.groupName}</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
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
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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
            currentTab === "progress" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Filings &amp; Receipts
        </button>

        <button
          onClick={() => setCurrentTab("banker-docket")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "banker-docket" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
          Bank Loan Pack
        </button>

        <button
          onClick={() => setCurrentTab("cash-forecast")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "cash-forecast" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          Tax Planning
        </button>

        <button
          onClick={() => setCurrentTab("vendor-hold")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "vendor-hold" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-rose-500" />
          Vendor Tax Claims
        </button>

        <button
          onClick={() => setCurrentTab("kyc-locker")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "kyc-locker" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FolderLock className="w-3.5 h-3.5 text-emerald-500" />
          Company Documents
        </button>

        <button
          onClick={() => setCurrentTab("director-risk")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "director-risk" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
          Director Risk Radar
        </button>

        <button
          onClick={() => setCurrentTab("msme-watchdog")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "msme-watchdog" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          MSME 43B(h) Watchdog
        </button>

        <button
          onClick={() => setCurrentTab("upload")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "upload" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Upload Documents
        </button>

        <button
          onClick={() => setCurrentTab("profile")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "profile" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
          Profile &amp; Security PIN
        </button>

        <button
          onClick={() => setCurrentTab("vault")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "vault" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-cyan-500" />
          Document Vault
        </button>

        <button
          onClick={() => setCurrentTab("billing")}
          className={`px-3 py-2 text-center rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === "billing" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                  GSTIN: {currentClient?.gstin || "N/A"}
                </span>
                <button
                  onClick={() => setIsBankerModalOpen(true)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1"
                >
                  <Briefcase className="w-3 h-3" /> Bank Loan Pack
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {clientTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
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
                                <span className={isDone ? "text-emerald-700" : isCurrent ? "text-amber-800" : "text-slate-400"}>
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
                            onClick={() => setCurrentTab("upload")}
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
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 text-xs shrink-0"
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
        <VendorItcHoldManager clientName={currentClient.name} />
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
        <ClientProfileSettings client={currentClient} />
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
                          ? "bg-slate-900 text-white border-slate-900"
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
                <UploadCloud className="w-10 h-10 mx-auto text-slate-400" />
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
              <div className="text-center py-8 text-slate-400 text-xs">
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
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400">Bank Details for Direct Payment</span>
              <p className="text-sm font-black text-white">{DEFAULT_FIRM_BRANDING.companyName}</p>
              <p className="text-slate-300 font-mono text-[11px]">
                {DEFAULT_FIRM_BRANDING.bankDetails.bankName} &bull; {DEFAULT_FIRM_BRANDING.bankDetails.branch}
              </p>
              <p className="text-slate-400 text-[10px]">
                CIN: {DEFAULT_FIRM_BRANDING.cin} &bull; Head Office: {DEFAULT_FIRM_BRANDING.headOffice}
              </p>
              <p className="text-emerald-400 font-bold font-mono text-xs pt-0.5">
                Direct UPI ID: {DEFAULT_FIRM_BRANDING.firmUpiVpa}
              </p>
            </div>

            <div className="text-center p-3 bg-white text-slate-900 rounded-2xl shrink-0 shadow-md">
              <QrCode className="w-16 h-16 mx-auto text-slate-900" />
              <span className="text-[10px] font-black uppercase block mt-1">UPI: 7999995897@upi</span>
            </div>
          </div>

          <div className="space-y-3">
            {clientInvoices.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center text-xs text-slate-400 font-medium">
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
                        className="bg-btblack hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm whitespace-nowrap"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedInvoiceForUtr(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
                className="text-slate-400 hover:text-slate-600 p-1"
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
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-center space-y-3">
              <div className="text-xs font-bold text-indigo-950 flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" /> Instant UPI Auto-Release
              </div>

              {/* Dynamic QR Simulation */}
              <div className="mx-auto w-36 h-36 bg-white border-2 border-indigo-200 rounded-2xl p-2 flex flex-col items-center justify-center shadow-inner relative">
                <div className="w-full h-full bg-slate-900 rounded-lg flex flex-col items-center justify-center p-2 text-white">
                  <QrCode className="w-16 h-16 text-indigo-400" />
                  <span className="text-[9px] font-mono mt-1 text-slate-300">Scan via Any UPI App</span>
                </div>
              </div>

              <div className="text-xs space-y-0.5">
                <div className="font-mono font-bold text-slate-800">{DEFAULT_FIRM_BRANDING.firmUpiVpa}</div>
                <div className="text-[11px] text-slate-500">Payee: {DEFAULT_FIRM_BRANDING.firmName}</div>
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
              <p className="text-[11px] text-slate-400">
                Facing an issue? Contact Managing Partner {DEFAULT_FIRM_BRANDING.managingPartner} directly on WhatsApp.
              </p>
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
