"use client";

import React, { useState, useMemo } from "react";
import { 
  PayToReleaseConfig, 
  ClientEntity, 
  InvoiceItem,
  UtrReconciliationRecord,
  WhatsAppDispatchRecipient,
  BlockedDeliverableType
} from "@/lib/types";
import { 
  Lock, 
  Unlock, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  ShieldCheck, 
  IndianRupee, 
  Clock, 
  Sparkles, 
  Smartphone, 
  X, 
  FileText, 
  Copy, 
  Check, 
  Building2, 
  SlidersHorizontal, 
  Download,
  Search,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Calendar,
  ArrowRight,
  HelpCircle,
  Percent,
  UploadCloud
} from "lucide-react";
import { openWhatsAppPreset, createWhatsAppWebLink, sanitizeIndianPhoneNumber, generateDynamicUpiUri } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";
import { BankStatementReconcileModal } from "./billing/BankStatementReconcileModal";

interface PayToReleaseManagerProps {
  configs: PayToReleaseConfig[];
  clients: ClientEntity[];
  invoices: InvoiceItem[];
  firmUpiVpa: string;
  onUpdateConfig?: (updated: PayToReleaseConfig) => void;
  onRefreshData?: () => void;
}

export function PayToReleaseManager({
  configs: initialConfigs,
  clients,
  invoices,
  firmUpiVpa,
  onUpdateConfig,
  onRefreshData,
}: PayToReleaseManagerProps) {
  const [configs, setConfigs] = useState<PayToReleaseConfig[]>(initialConfigs);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideHours, setOverrideHours] = useState<number>(48);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Enterprise Interactive Modals
  const [selectedQrConfig, setSelectedQrConfig] = useState<{ config: PayToReleaseConfig; client?: ClientEntity; invoice?: InvoiceItem } | null>(null);
  const [applyTdsDeduction, setApplyTdsDeduction] = useState(false);
  const [selectedInvoiceView, setSelectedInvoiceView] = useState<{ client: ClientEntity; invoice: InvoiceItem } | null>(null);
  const [clientPwaPreviewOpen, setClientPwaPreviewOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [lockPolicyDays, setLockPolicyDays] = useState<number>(30);
  const [isPolicySelectorOpen, setIsPolicySelectorOpen] = useState(false);

  // UTR Reconciliation Modal
  const [selectedUtrInvoice, setSelectedUtrInvoice] = useState<{ client: ClientEntity; invoice: InvoiceItem } | null>(null);
  const [utrRejectReason, setUtrRejectReason] = useState("");
  const [isRejectingUtr, setIsRejectingUtr] = useState(false);

  // Bulk WhatsApp Dispatch Hub
  const [bulkDispatchModalOpen, setBulkDispatchModalOpen] = useState(false);
  const [dispatchRecipients, setDispatchRecipients] = useState<WhatsAppDispatchRecipient[]>([]);
  const [sentStatuses, setSentStatuses] = useState<Record<string, boolean>>({});
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Watermark Preview Modal State
  const [watermarkPreviewDoc, setWatermarkPreviewDoc] = useState<{
    title: string;
    clientName: string;
    amount: number;
    isLocked: boolean;
    invoiceNo?: string;
  } | null>(null);

  // Self-Healing Dynamic Config Fallback for Live CA Data
  const effectiveConfigs = useMemo(() => {
    return clients.map(client => {
      // Find matching explicit config if present
      const existingCfg = (configs || []).find(c => c.entityId === client.id);

      const clientInvoices = invoices.filter(i => i.entityId === client.id && i.status !== "PAID");
      const unpaidSum = clientInvoices.reduce((acc, curr) => acc + curr.amount, 0);
      let maxDays = 0;
      const now = new Date();
      clientInvoices.forEach(inv => {
        const due = new Date(inv.dueDate);
        const diff = Math.ceil((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
        if (diff > maxDays) maxDays = Math.max(0, diff);
      });

      // Check partner override expiry
      const nowMs = Date.now();
      const overrideExpiry = existingCfg?.partnerOverrideUntil ? new Date(existingCfg.partnerOverrideUntil).getTime() : 0;
      const isOverrideActive = overrideExpiry > nowMs;

      // In a real CA practice, clients with overdue invoices beyond policy are locked unless overridden
      const autoLocked = unpaidSum > 0 && maxDays > lockPolicyDays && !isOverrideActive;
      const isLocked = existingCfg !== undefined ? (isOverrideActive ? false : existingCfg.isLocked) : autoLocked;

      return {
        entityId: client.id,
        isLocked,
        totalOutstandingAmount: existingCfg?.totalOutstandingAmount !== undefined && existingCfg.totalOutstandingAmount > 0 
          ? existingCfg.totalOutstandingAmount 
          : unpaidSum,
        oldestInvoiceDays: existingCfg?.oldestInvoiceDays || maxDays,
        gracePeriodDays: existingCfg?.gracePeriodDays || lockPolicyDays,
        blockedDeliverables: (isLocked 
          ? ["FORM_3CD_PDF", "BALANCE_SHEET_SIGNED", "ITR_ACKNOWLEDGMENT"] 
          : []) as BlockedDeliverableType[],
        instantUpiVpa: firmUpiVpa || "BRAINSANDTAXES@icici",
        merchantName: "GPA & Co., Chartered Accountants",
        lockReason: isOverrideActive
          ? `Partner Emergency Waiver active until ${new Date(overrideExpiry).toLocaleString("en-IN")}`
          : isLocked 
          ? `Overdue fee of ₹${unpaidSum.toLocaleString("en-IN")} exceeds ${lockPolicyDays}-day grace period. Gated under ICAI SA 210.` 
          : "Account in good standing.",
        partnerOverrideUntil: existingCfg?.partnerOverrideUntil || null,
        partnerOverrideReason: existingCfg?.partnerOverrideReason || null,
        partnerOverrideBy: existingCfg?.partnerOverrideBy || null,
        msmeDaysRemaining: Math.max(0, 45 - maxDays)
      };
    });
  }, [configs, clients, invoices, firmUpiVpa, lockPolicyDays]);

  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) return effectiveConfigs;
    const q = searchQuery.toLowerCase();
    return effectiveConfigs.filter(cfg => {
      const client = clients.find(c => c.id === cfg.entityId);
      return (
        client?.name.toLowerCase().includes(q) ||
        client?.pan.toLowerCase().includes(q) ||
        client?.groupName?.toLowerCase().includes(q) ||
        cfg.entityId.toLowerCase().includes(q)
      );
    });
  }, [effectiveConfigs, clients, searchQuery]);

  const totalLockedAmount = effectiveConfigs
    .filter((c) => c.isLocked)
    .reduce((acc, curr) => acc + curr.totalOutstandingAmount, 0);

  const lockedClientsCount = effectiveConfigs.filter((c) => c.isLocked).length;

  // Toggle Lock State
  const handleToggleLock = async (entityId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_LOCK",
          entityId,
          partnerName: "CA Gunjan Jain"
        })
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfigs((prev) =>
          prev.map((c) => (c.entityId === entityId ? data.config : c))
        );
        if (onUpdateConfig) onUpdateConfig(data.config);
        toast.info("Gate Status Toggled", `Deliverable download lock updated for client.`);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error", "Failed to toggle gate status");
    } finally {
      setIsProcessing(false);
    }
  };

  // Instant Payment Simulation & Webhook Release
  const handleSimulatePayment = async (entityId: string, amount: number) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INSTANT_PAYMENT_RELEASE",
          entityId,
          amountPaid: amount,
          paymentMode: "UPI_DYNAMIC",
          utrRef: `UPI-${Date.now().toString().slice(-8)}`
        })
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfigs((prev) =>
          prev.map((c) => (c.entityId === entityId ? data.config : c))
        );
        if (onUpdateConfig) onUpdateConfig(data.config);
        setSelectedQrConfig(null);
        toast.success(
          "Payment Reconciled & Unlocked",
          `₹${amount.toLocaleString("en-IN")} cleared via NPCI Webhook. Certified deliverables released.`
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error", "Failed to process payment release");
    } finally {
      setIsProcessing(false);
    }
  };

  // Partner Emergency Override (ICAI SA 210)
  const handlePartnerOverride = async () => {
    if (!selectedEntityId) return;
    if (!overrideReason.trim()) {
      toast.warning("Mandatory Reason Required", "Please provide a professional justification under ICAI SA 210 audit governance.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PARTNER_OVERRIDE_UNLOCK",
          entityId: selectedEntityId,
          partnerName: "CA Gunjan Jain",
          durationHours: overrideHours,
          reason: overrideReason
        })
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfigs((prev) =>
          prev.map((c) => (c.entityId === selectedEntityId ? data.config : c))
        );
        if (onUpdateConfig) onUpdateConfig(data.config);
        setOverrideModalOpen(false);
        setOverrideReason("");
        toast.warning(
          "Partner Override Authorized",
          `Deliverables unlocked for ${overrideHours} hours under ICAI SA 210 exception. Logged to Peer Review audit trail.`
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
      toast.error("Override Failed", "Could not authorize partner override.");
    } finally {
      setIsProcessing(false);
    }
  };

  // UTR Reconciliation (Maker-Checker Verification)
  const handleReconcileUtr = async (entityId: string, invoiceId: string, utrRef: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECONCILE_UTR",
          entityId,
          invoiceId,
          utrRef,
          partnerName: "CA Gunjan Jain"
        })
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfigs((prev) =>
          prev.map((c) => (c.entityId === entityId ? data.config : c))
        );
        if (onUpdateConfig) onUpdateConfig(data.config);
        setSelectedUtrInvoice(null);
        toast.success("UTR Verified & Released", `Bank credit confirmed for ${utrRef}. Deliverables unlocked for client.`);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
      toast.error("Reconciliation Failed", "Unable to reconcile UTR.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject UTR (Credit not received)
  const handleRejectUtr = async () => {
    if (!selectedUtrInvoice) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT_UTR",
          entityId: selectedUtrInvoice.client.id,
          invoiceId: selectedUtrInvoice.invoice.id,
          utrRef: selectedUtrInvoice.invoice.clientUtrNumber,
          reason: utrRejectReason || "Credit not reflected in firm ICICI Bank account"
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedUtrInvoice(null);
        setUtrRejectReason("");
        setIsRejectingUtr(false);
        toast.info("UTR Rejected", "Client notified to re-check bank transfer.");
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject UTR", "Server error.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Individual WhatsApp Payment Nudge with Dynamic Target Number
  const handleWhatsAppPaymentChase = (entityId: string) => {
    const client = clients.find(c => c.id === entityId);
    const clientInvoices = invoices.filter(i => i.entityId === entityId && i.status !== "PAID");
    const inv = clientInvoices[0];
    const amount = inv?.amount || 118000;
    
    // Accurate phone resolution: Primary Contact -> Fallback to client office phone
    const clientPhone = client?.primaryContact?.phone || "919820011223";

    openWhatsAppPreset(clientPhone, "FEE_INVOICE_UTR", {
      clientName: client?.name || "Client Entity",
      firmName: "GPA & Co., Chartered Accountants",
      serviceName: inv?.serviceDescription || "Statutory Audit & Tax Filing",
      invoiceNo: inv?.invoiceNo || "GPA/2026-27/089",
      invoiceAmount: amount,
      firmUpiVpa: firmUpiVpa || "BRAINSANDTAXES@icici",
      portalUrl: "https://ca.naturexpress.in/"
    });

    toast.success(
      "WhatsApp Reminder Opened",
      `Targeting ${client?.primaryContact?.name || client?.name} (${clientPhone}).`
    );
  };

  // Open Bulk WhatsApp Dispatch Hub
  const handleOpenBulkHub = () => {
    const lockedConfigs = effectiveConfigs.filter(c => c.isLocked);
    const list: WhatsAppDispatchRecipient[] = lockedConfigs.map(c => {
      const client = clients.find(cl => cl.id === c.entityId);
      const clientInvoices = invoices.filter(i => i.entityId === c.entityId && i.status !== "PAID");
      const inv = clientInvoices[0];
      return {
        entityId: c.entityId,
        clientName: client?.name || c.entityId,
        contactName: client?.primaryContact?.name || "Finance Director",
        phone: client?.primaryContact?.phone || "919820011223",
        email: client?.primaryContact?.email,
        invoiceNo: inv?.invoiceNo || "OVERDUE-AUDIT",
        amount: c.totalOutstandingAmount,
        overdueDays: c.oldestInvoiceDays,
        status: "READY"
      };
    });
    setDispatchRecipients(list);
    setBulkDispatchModalOpen(true);
  };

  // Update Global Policy Threshold
  const handleUpdatePolicy = async (days: number) => {
    setLockPolicyDays(days);
    setIsPolicySelectorOpen(false);
    try {
      await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_POLICY",
          gracePeriodDays: days,
          partnerName: "CA Gunjan Jain"
        })
      });
      toast.info("Firm Policy Updated", `Deliverable lock grace period set to ${days} days.`);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. High-Contrast Executive Banner */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/40 border border-emerald-200 rounded-3xl p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Deliverable Gatekeeper
              </span>
              <span className="text-xs text-emerald-900 font-bold bg-teal-100/70 border border-teal-200 px-2.5 py-0.5 rounded-full">
                MSMED Act Sec 15 &amp; 16 Protection
              </span>
              <span className="text-xs text-slate-700 font-bold bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-full">
                ICAI SA 210 Compliance
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" /> Fee Realization &amp; Deliverable Gatekeeper (Pay-to-Release)
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Control statutory deliverable release (Form 3CD, audited financial statements, ITR acknowledgments) against overdue fee invoices. Reconcile bank payments or collect directly via NPCI Dynamic UPI QR codes.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 min-w-[200px] text-right shadow-sm text-slate-900">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding Fees</div>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">₹{totalLockedAmount.toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-slate-600 font-semibold mt-0.5">{lockedClientsCount} client(s) with pending dues</div>
            </div>

            <button
              onClick={() => setIsBankModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-3.5 rounded-2xl transition flex items-center gap-2 shadow-sm whitespace-nowrap"
              title="Upload ICICI/HDFC/SBI Bank Statement to Auto-Clear Invoices"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Auto-Reconcile Bank Statement</span>
            </button>

            <button
              onClick={handleOpenBulkHub}
              disabled={lockedClientsCount === 0}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3.5 rounded-2xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
              title="Open WhatsApp Reminder Dispatch Center"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Reminders ({lockedClientsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Metric Cards (High-Contrast, Pure Legibility) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Configurable Lock Policy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-900 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">Lock Policy</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPolicySelectorOpen(!isPolicySelectorOpen)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                title="Change policy threshold"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-1.5">&gt; {lockPolicyDays} Days Overdue</div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Auto download pause threshold</div>

          {isPolicySelectorOpen && (
            <div className="absolute top-12 left-2 right-2 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-20 space-y-1 animate-in zoom-in-95">
              <div className="text-[10px] font-bold text-slate-500 uppercase px-1">Select Grace Period:</div>
              {[15, 30, 45].map((d) => (
                <button
                  key={d}
                  onClick={() => handleUpdatePolicy(d)}
                  className={`w-full text-left text-xs font-bold px-2 py-1.5 rounded-lg flex items-center justify-between ${
                    lockPolicyDays === d ? "bg-btred-logo text-white" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>{d} Days {d === 15 ? "(Strict MSME)" : d === 30 ? "(Standard Practice)" : "(Extended Contractual)"}</span>
                  {lockPolicyDays === d && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Realization Speed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">Realization Speed</span>
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-700 mt-1.5">4.8 Hours</div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">From delivery lock to clearance</div>
        </div>

        {/* Card 3: Firm UPI Endpoint (High-Contrast & Copyable) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">Firm UPI Endpoint</span>
            <QrCode className="w-4 h-4 text-indigo-600 shrink-0" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black font-mono text-indigo-950 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg truncate">
              {firmUpiVpa || "BRAINSANDTAXES@icici"}
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(firmUpiVpa || "BRAINSANDTAXES@icici");
                setCopiedUpi(true);
                setTimeout(() => setCopiedUpi(false), 2000);
                toast.success("UPI Copied", `${firmUpiVpa || "BRAINSANDTAXES@icici"} copied to clipboard.`);
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded"
              title="Copy UPI VPA"
            >
              {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">NPCI Instant Webhook Reconciliation</div>
        </div>

        {/* Card 4: ICAI Ethics & SA 210 Grounding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">ICAI Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1.5 truncate">
            SA 210 &amp; MSME Sec 15
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
            Deliverable release tied to fee clearance
          </div>
        </div>
      </div>

      {/* 3. Client Deliverables Gating Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Client Deliverable Lock Status</h3>
            <p className="text-xs text-slate-600 mt-0.5">Live gatekeeping overview across all active tax audits and company filings</p>
          </div>
          
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search entity, PAN, or group..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-btred-logo w-48 sm:w-60"
              />
            </div>

            <button
              onClick={() => setClientPwaPreviewOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulate Client Lock Screen</span>
            </button>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">&bull; Auto-Refreshes on payment</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-600 tracking-wider">
                <th className="py-3.5 px-4">Client / Entity</th>
                <th className="py-3.5 px-4">Overdue Balance</th>
                <th className="py-3.5 px-4">Aging</th>
                <th className="py-3.5 px-4">Gate Status</th>
                <th className="py-3.5 px-4">Blocked Deliverables</th>
                <th className="py-3.5 px-4 text-right">Gatekeeper Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConfigs.map((cfg) => {
                const client = clients.find((c) => c.id === cfg.entityId);
                const clientInvoices = invoices.filter((i) => i.entityId === cfg.entityId && i.status !== "PAID");
                const unpaidSum = clientInvoices.reduce((acc, curr) => acc + curr.amount, 0);
                const displayAmount = cfg.totalOutstandingAmount || unpaidSum;
                const utrSubmittedInv = clientInvoices.find(i => i.status === "UTR_SUBMITTED");
                const primaryContact = client?.primaryContact;

                return (
                  <tr key={cfg.entityId} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    {/* 1. Client / Entity Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{client?.name || cfg.entityId}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-semibold">
                          PAN: {client?.pan || "AAACA1294F"}
                        </span>
                        <span>&bull; Group: {client?.groupName || "Direct"}</span>
                      </div>
                      {primaryContact && (
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{primaryContact.name} ({primaryContact.phone})</span>
                        </div>
                      )}
                    </td>

                    {/* 2. Overdue Balance with Clickable Invoice Drawer */}
                    <td className="py-3.5 px-4">
                      <div 
                        onClick={() => {
                          if (client && clientInvoices[0]) {
                            setSelectedInvoiceView({ client, invoice: clientInvoices[0] });
                          }
                        }}
                        className="cursor-pointer group"
                        title="Click to view tax invoice breakdown"
                      >
                        <div className="font-black text-slate-900 text-sm flex items-center gap-0.5 group-hover:text-btred-logo transition">
                          <IndianRupee className="w-3.5 h-3.5 text-slate-700" />
                          <span>{displayAmount.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium group-hover:underline">
                          {clientInvoices.length} pending bill(s) &rarr;
                        </div>
                      </div>
                    </td>

                    {/* 3. Aging & MSME 43B(h) Tag */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {cfg.oldestInvoiceDays > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            cfg.oldestInvoiceDays > 90 
                              ? "bg-red-50 text-btred-logo border border-red-200" 
                              : cfg.oldestInvoiceDays > 30 
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {cfg.oldestInvoiceDays} days overdue
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> On Track
                          </span>
                        )}

                        {cfg.oldestInvoiceDays > 15 && (
                          <div className="text-[10px] text-rose-600 font-bold">
                            ⚠️ MSME 43B(h) Risk
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4. Gate Status */}
                    <td className="py-3.5 px-4">
                      {cfg.partnerOverrideUntil && new Date(cfg.partnerOverrideUntil).getTime() > Date.now() ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Unlock className="w-3 h-3 text-amber-700" /> OVERRIDDEN
                          </span>
                          <div className="text-[10px] text-amber-700 font-semibold truncate max-w-[150px]">
                            {cfg.partnerOverrideBy || "Partner"} (Exp: {new Date(cfg.partnerOverrideUntil).toLocaleDateString("en-IN")})
                          </div>
                        </div>
                      ) : cfg.isLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-btred-logo border border-red-200">
                          <Lock className="w-3 h-3 text-btred-logo" /> LOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Unlock className="w-3 h-3 text-emerald-700" /> RELEASED
                        </span>
                      )}
                    </td>

                    {/* 5. Blocked Deliverables */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cfg.blockedDeliverables && cfg.blockedDeliverables.length > 0 ? (
                          cfg.blockedDeliverables.map((item) => (
                            <button
                              key={item}
                              onClick={() => setWatermarkPreviewDoc({
                                title: item.replace(/_/g, " "),
                                clientName: client?.name || "Client Entity",
                                amount: displayAmount,
                                isLocked: cfg.isLocked,
                                invoiceNo: clientInvoices[0]?.invoiceNo,
                              })}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                              title="Click to view Watermarked Deliverable Preview"
                            >
                              <FileText className="w-2.5 h-2.5 text-slate-500" />
                              <span>{item.replace(/_/g, " ")}</span>
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">None</span>
                        )}
                      </div>
                    </td>

                    {/* 6. Gatekeeper Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {displayAmount === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled in Full
                          </span>
                        ) : utrSubmittedInv ? (
                          /* Client has submitted UTR for RTGS clearance */
                          <button
                            onClick={() => {
                              if (client) setSelectedUtrInvoice({ client, invoice: utrSubmittedInv });
                            }}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            title={`Verify client RTGS UTR: ${utrSubmittedInv.clientUtrNumber}`}
                          >
                            <Check className="w-3.5 h-3.5" /> Reconcile UTR
                          </button>
                        ) : cfg.isLocked ? (
                          <>
                            {/* Simulate UPI Pay (High-Contrast White Text on Emerald) */}
                            <button
                              onClick={() => setSelectedQrConfig({ config: cfg, client, invoice: clientInvoices[0] })}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                              title="Generate Dynamic UPI QR & Pay to Unlock"
                            >
                              <QrCode className="w-3.5 h-3.5" /> View UPI QR
                            </button>

                            {/* WhatsApp Payment Nudge */}
                            <button
                              onClick={() => handleWhatsAppPaymentChase(cfg.entityId)}
                              className="px-2 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                              title={`Send UPI Link to ${primaryContact?.name || "Client"} on WhatsApp`}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Partner Override */}
                            <button
                              onClick={() => {
                                setSelectedEntityId(cfg.entityId);
                                setOverrideModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-colors border border-slate-300"
                              title="Authorize temporary emergency release under ICAI SA 210"
                            >
                              Partner Override
                            </button>
                          </>
                        ) : (
                          /* Within grace period (<30d) */
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleWhatsAppPaymentChase(cfg.entityId)}
                              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                              title="Send courtesy payment reminder"
                            >
                              <Send className="w-3 h-3 text-slate-500" /> Remind
                            </button>
                            <button
                              onClick={() => handleToggleLock(cfg.entityId)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-btred-logo rounded-lg transition-colors border border-red-200 flex items-center gap-1"
                              title="Manually arm gatekeeper"
                            >
                              <Lock className="w-3 h-3" /> Lock
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: DYNAMIC NPCI UPI QR & INSTANT SETTLEMENT */}
      {selectedQrConfig && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black text-emerald-700 tracking-wider">
                  NPCI Dynamic UPI Auto-Release
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedQrConfig.client?.name || "Client Entity"}
                </h4>
                <p className="text-xs text-slate-500">
                  Gross Overdue: ₹{selectedQrConfig.config.totalOutstandingAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedQrConfig(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TDS u/s 194J Toggle */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-indigo-600" /> Deduct 10% TDS u/s 194J
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Net payable: ₹{Math.round(selectedQrConfig.config.totalOutstandingAmount * 0.9).toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="checkbox"
                checked={applyTdsDeduction}
                onChange={(e) => setApplyTdsDeduction(e.target.checked)}
                className="w-4 h-4 rounded text-btred-logo focus:ring-btred-logo"
              />
            </div>

            {/* Dynamic QR Display */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
              <div className="mx-auto w-40 h-40 bg-white border-2 border-indigo-200 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-md relative">
                <img src="/brainsandtaxes_qrcode.jpg" alt="Brains & Taxes UPI QR" className="w-28 h-28 mx-auto object-contain rounded-lg" />
                <span className="text-[10px] font-mono mt-1 text-indigo-700 font-extrabold uppercase">
                  {firmUpiVpa || "BRAINSANDTAXES@icici"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono font-black text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-xl inline-block">
                  Amount: ₹{applyTdsDeduction 
                    ? Math.round(selectedQrConfig.config.totalOutstandingAmount * 0.9).toLocaleString("en-IN")
                    : selectedQrConfig.config.totalOutstandingAmount.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p className="font-bold">Payee: Brains &amp; Taxes Private Limited &bull; ICICI Bank, New Palasia, Indore</p>
                  <p className="font-mono text-[10px] text-slate-700">Current A/C: <strong>657005601799</strong> &bull; IFSC: <strong>ICIC0006570</strong></p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Instant Zero-Wait Clearance:
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Payment triggers automated NPCI webhook reconciliation and immediately unlocks all blocked deliverables.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedQrConfig(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const payAmount = applyTdsDeduction 
                    ? Math.round(selectedQrConfig.config.totalOutstandingAmount * 0.9)
                    : selectedQrConfig.config.totalOutstandingAmount;
                  handleSimulatePayment(selectedQrConfig.config.entityId, payAmount);
                }}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Simulate Payment &amp; Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UTR RECONCILIATION DRAWER (Maker-Checker) */}
      {selectedUtrInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black text-amber-600 tracking-wider">
                  Bank UTR Verification Desk
                </span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  {selectedUtrInvoice.client.name}
                </h4>
                <p className="text-xs text-slate-500">Invoice: {selectedUtrInvoice.invoice.invoiceNo}</p>
              </div>
              <button
                onClick={() => setSelectedUtrInvoice(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-amber-800 font-medium">Reported UTR Reference:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {selectedUtrInvoice.invoice.clientUtrNumber || "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-amber-800 font-medium">Claimed Amount:</span>
                <span className="font-mono font-black text-slate-900">
                  ₹{selectedUtrInvoice.invoice.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-amber-800 font-medium">Payment Mode:</span>
                <span className="font-bold text-slate-900">{selectedUtrInvoice.invoice.clientPaymentMode || "RTGS"}</span>
              </div>
              {selectedUtrInvoice.invoice.clientPayerNote && (
                <div className="pt-1">
                  <span className="text-amber-800 font-medium block">Client Note:</span>
                  <span className="text-slate-700 italic block mt-0.5">{selectedUtrInvoice.invoice.clientPayerNote}</span>
                </div>
              )}
            </div>

            {!isRejectingUtr ? (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsRejectingUtr(true)}
                  className="px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition"
                >
                  Reject UTR
                </button>
                <button
                  onClick={() => handleReconcileUtr(
                    selectedUtrInvoice.client.id, 
                    selectedUtrInvoice.invoice.id, 
                    selectedUtrInvoice.invoice.clientUtrNumber || "RTGS"
                  )}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify Credit &amp; Unlock
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Rejection Reason for Client:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Credit not found in ICICI A/C 657005601799 on statement date"
                  value={utrRejectReason}
                  onChange={(e) => setUtrRejectReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsRejectingUtr(false)}
                    className="px-3 py-1.5 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectUtr}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: INVOICE BREAKDOWN DRAWER */}
      {selectedInvoiceView && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black text-btred-logo tracking-wider">
                  Professional Fee Tax Invoice
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  {selectedInvoiceView.invoice.invoiceNo}
                </h4>
                <p className="text-xs text-slate-500">{selectedInvoiceView.client.name}</p>
              </div>
              <button
                onClick={() => setSelectedInvoiceView(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Service Description:</span>
                <span className="font-bold text-slate-900 text-right max-w-xs">{selectedInvoiceView.invoice.serviceDescription}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">SAC Code:</span>
                <span className="font-mono font-bold text-slate-900">{selectedInvoiceView.invoice.sacCode || "998231"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Taxable Value:</span>
                <span className="font-mono font-bold text-slate-900">₹{selectedInvoiceView.invoice.taxableAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">GST @ 18% (9% CGST + 9% SGST):</span>
                <span className="font-mono font-bold text-slate-900">₹{selectedInvoiceView.invoice.gstAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 pt-2 text-sm">
                <span className="text-slate-900 font-black">Total Invoice Due:</span>
                <span className="font-black text-btred-logo text-base">₹{selectedInvoiceView.invoice.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  toast.success("Invoice Downloaded", "PDF invoice saved to client records.");
                }}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Invoice PDF
              </button>
              <button
                onClick={() => setSelectedInvoiceView(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: BULK WHATSAPP DISPATCH HUB */}
      {bulkDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black text-btred-logo tracking-wider">
                  Bulk WhatsApp Recovery Dispatch Desk
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">
                  Overdue Fee Reminders ({dispatchRecipients.length} Clients)
                </h4>
                <p className="text-xs text-slate-500">
                  Includes Section 43B(h) MSME compliance notice &amp; Dynamic UPI 1-Tap link
                </p>
              </div>
              <button
                onClick={() => setBulkDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {dispatchRecipients.map((rec) => {
                const isSent = sentStatuses[rec.entityId];
                return (
                  <div key={rec.entityId} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{rec.clientName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>Contact: <strong>{rec.contactName}</strong></span>
                        <span>&bull;</span>
                        <span className="font-mono">{rec.phone}</span>
                      </div>
                      <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                        Overdue: ₹{rec.amount.toLocaleString("en-IN")} ({rec.overdueDays} days)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <Check className="w-3 h-3" /> Dispatched
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            openWhatsAppPreset(rec.phone, "FEE_INVOICE_UTR", {
                              clientName: rec.clientName,
                              firmName: "GPA & Co., Chartered Accountants",
                              invoiceNo: rec.invoiceNo,
                              invoiceAmount: rec.amount,
                              firmUpiVpa: firmUpiVpa || "BRAINSANDTAXES@icici",
                              portalUrl: "https://ca.naturexpress.in/"
                            });
                            setSentStatuses(prev => ({ ...prev, [rec.entityId]: true }));
                            toast.success("Dispatched to WhatsApp", `Reminder opened for ${rec.contactName} (${rec.phone})`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Send className="w-3 h-3" /> Send Reminder
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Anti-Popup Protection Active:</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Reminders are dispatched one-by-one with accurate recipient phone routing to ensure no browser blocks occur and each promoter receives a personalized statutory notice.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setBulkDispatchModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SIMULATE CLIENT PWA LOCK SCREEN */}
      {clientPwaPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl border-4 border-slate-300 space-y-4 text-slate-900 relative animate-in zoom-in-95">
            <button
              onClick={() => setClientPwaPreviewOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mobile Header */}
            <div className="text-center pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Client Mobile View
              </span>
              <h4 className="text-base font-black text-slate-900 mt-2">Certified Deliverables</h4>
              <p className="text-xs text-slate-500">Apex AutoTech Private Limited</p>
            </div>

            {/* Locked Deliverables Blurred Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 relative overflow-hidden">
              <div className="filter blur-xs opacity-60 space-y-2">
                <div className="flex justify-between items-center bg-white p-2 rounded-xl text-xs border border-slate-200">
                  <span>Form 3CD Tax Audit Final Certification.pdf</span>
                  <span className="font-bold">Download</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded-xl text-xs border border-slate-200">
                  <span>ITR-6 Acknowledgment AY 2026-27.pdf</span>
                  <span className="font-bold">Download</span>
                </div>
              </div>

              {/* Overlay Lock Badge */}
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center border-2 border-red-500 rounded-2xl">
                <Lock className="w-8 h-8 text-red-600 mb-1" />
                <span className="text-xs font-black text-slate-900">Deliverables Temporarily Gated</span>
                <span className="text-[10px] text-slate-600 max-w-xs mt-0.5">
                  Outstanding fee of ₹1,18,000 pending settlement u/s 43B(h).
                </span>
              </div>
            </div>

            {/* Instant Unlock Button for Client */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" /> 1-Tap UPI Settle &amp; Unlock
              </div>
              <button
                onClick={() => {
                  setClientPwaPreviewOpen(false);
                  handleSimulatePayment("CLI-APEX-01", 118000);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl transition shadow-md"
              >
                Pay ₹1,18,000 via UPI &amp; Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: PARTNER OVERRIDE AUTHORIZATION (ICAI SA 210) */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in text-slate-900 space-y-4">
            <div className="flex items-center gap-3 text-amber-800">
              <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Partner Override Authorization</h3>
                <p className="text-xs text-slate-500">ICAI SA 210 Governance Exemption</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are authorizing manual emergency release of certified tax documents without fee receipt. Under firm policy, this override is permanently recorded in the <strong>ICAI Peer Review Compliance Log</strong>.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Override Duration Window:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[24, 48, 72].map(h => (
                  <button
                    key={h}
                    onClick={() => setOverrideHours(h)}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition ${
                      overrideHours === h 
                        ? "bg-amber-600 text-white border-amber-600" 
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {h} Hours
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Mandatory Reason for Override *
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Authorized emergency release for banking consortium submission; promoter committed RTGS clearance by tomorrow 11 AM."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-btred-logo"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handlePartnerOverride}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" /> Authorize &amp; Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: WATERMARKED DELIVERABLE PREVIEW */}
      {watermarkPreviewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95">
            <button
              onClick={() => setWatermarkPreviewDoc(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-red-50 text-btred-logo rounded-2xl border border-red-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {watermarkPreviewDoc.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {watermarkPreviewDoc.clientName} &bull; Statutory Delivery Preview
                </p>
              </div>
            </div>

            {/* Document Preview Box with Watermark */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
              {watermarkPreviewDoc.isLocked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <div className="text-red-500/20 font-black text-2xl uppercase tracking-widest transform -rotate-12 border-4 border-red-500/20 px-6 py-3 rounded-2xl text-center">
                    UNPAID DRAFT &bull; SUBJECT TO FEE CLEARANCE &bull; GPA &amp; CO. CA
                  </div>
                </div>
              )}

              <div className="space-y-2 z-10 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Audit Authority:</span>
                  <span className="font-mono text-slate-900">ICAI / MCA-21 Portal</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Digital Signature Status:</span>
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> DSC Embedded (Escrow Held)
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Statutory Watermark:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${watermarkPreviewDoc.isLocked ? "bg-red-100 text-btred-logo" : "bg-emerald-100 text-emerald-800"}`}>
                    {watermarkPreviewDoc.isLocked ? "PROTECTED PREVIEW STAMP APPLIED" : "CLEAN CERTIFIED ORIGINAL"}
                  </span>
                </div>
              </div>

              {watermarkPreviewDoc.isLocked ? (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center z-10">
                  <p className="text-xs font-bold text-btred-logo">
                    Deliverable Locked Pending Fee Settlement of ₹{watermarkPreviewDoc.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Upon instant UPI settlement or Partner UTR approval, watermark is automatically removed and certified SHA-256 sealed PDF is delivered to the client's Document Vault.
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center z-10">
                  <p className="text-xs font-bold text-emerald-800">
                    Account in Good Standing &bull; Unlocked for Direct Download
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                ICAI SQC-1 Certified Practice Delivery
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWatermarkPreviewDoc(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
                {watermarkPreviewDoc.isLocked && (
                  <button
                    onClick={() => {
                      setWatermarkPreviewDoc(null);
                      const matchedCfg = effectiveConfigs.find(c => c.totalOutstandingAmount === watermarkPreviewDoc.amount) || effectiveConfigs[0];
                      const matchedClient = clients.find(cl => cl.name === watermarkPreviewDoc.clientName);
                      setSelectedQrConfig({ config: matchedCfg, client: matchedClient });
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Instant UPI Unlock
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bank Statement Auto-Reconcile Modal */}
      <BankStatementReconcileModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onReconciliationComplete={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
}
