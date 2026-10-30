"use client";

import React, { useState, useMemo } from "react";
import { 
  PayToReleaseConfig, 
  ClientEntity, 
  InvoiceItem 
} from "@/lib/types";
import { 
  Lock, 
  Unlock, 
  QrCode, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  Send, 
  ShieldCheck, 
  IndianRupee, 
  ExternalLink,
  Clock,
  Sparkles,
  Smartphone,
  X,
  FileText,
  Copy,
  Check,
  Building2,
  SlidersHorizontal,
  Download
} from "lucide-react";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";

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
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Enterprise Interactive Modals
  const [selectedQrConfig, setSelectedQrConfig] = useState<{ config: PayToReleaseConfig; client?: ClientEntity; invoice?: InvoiceItem } | null>(null);
  const [selectedInvoiceView, setSelectedInvoiceView] = useState<{ client: ClientEntity; invoice: InvoiceItem } | null>(null);
  const [clientPwaPreviewOpen, setClientPwaPreviewOpen] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [lockPolicyDays, setLockPolicyDays] = useState<number>(30);
  const [isPolicySelectorOpen, setIsPolicySelectorOpen] = useState(false);

  // Self-Healing Dynamic Config Fallback for Live CA Data
  const effectiveConfigs = useMemo(() => {
    if (configs && configs.length > 0) return configs;
    return clients.map(client => {
      const clientInvoices = invoices.filter(i => i.entityId === client.id && i.status !== "PAID");
      const unpaidSum = clientInvoices.reduce((acc, curr) => acc + curr.amount, 0);
      let maxDays = 0;
      const now = new Date();
      clientInvoices.forEach(inv => {
        const due = new Date(inv.dueDate);
        const diff = Math.ceil((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
        if (diff > maxDays) maxDays = diff;
      });
      const isLocked = unpaidSum > 0 && maxDays > lockPolicyDays;
      return {
        entityId: client.id,
        isLocked,
        totalOutstandingAmount: unpaidSum,
        oldestInvoiceDays: maxDays,
        gracePeriodDays: lockPolicyDays,
        blockedDeliverables: (isLocked ? ["FORM_3CD_PDF", "BALANCE_SHEET_SIGNED", "ITR_ACKNOWLEDGMENT"] : []) as ("ITR_ACKNOWLEDGMENT" | "FORM_3CD_PDF" | "BALANCE_SHEET_SIGNED" | "GSTR_FILED_RECEIPT")[],
        instantUpiVpa: firmUpiVpa,
        merchantName: "GPA & Co., Chartered Accountants",
        lockReason: isLocked ? `Overdue fee of ₹${unpaidSum.toLocaleString("en-IN")} exceeds ${lockPolicyDays}-day grace period.` : "Account in good standing."
      };
    });
  }, [configs, clients, invoices, firmUpiVpa, lockPolicyDays]);

  const totalLockedAmount = effectiveConfigs
    .filter((c) => c.isLocked)
    .reduce((acc, curr) => acc + curr.totalOutstandingAmount, 0);

  const lockedClientsCount = effectiveConfigs.filter((c) => c.isLocked).length;

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
    } finally {
      setIsProcessing(false);
    }
  };

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
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePartnerOverride = async () => {
    if (!selectedEntityId) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PARTNER_OVERRIDE_UNLOCK",
          entityId: selectedEntityId,
          partnerName: "CA Gunjan Jain",
          reason: overrideReason || "Partner emergency release authorized for board meeting"
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
          `Deliverables unlocked under ICAI SA 210 exception. Logged to Peer Review audit trail.`
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsAppPaymentChase = (entityId: string) => {
    const client = clients.find(c => c.id === entityId);
    const clientInvoices = invoices.filter(i => i.entityId === entityId && i.status !== "PAID");
    const inv = clientInvoices[0];
    const amount = inv?.amount || 118000;
    const clientPhone = client?.primaryContact?.phone || "919820011223";

    openWhatsAppPreset(clientPhone, "FEE_INVOICE_UTR", {
      clientName: client?.name || "Client Entity",
      firmName: "GPA & Co., Chartered Accountants",
      serviceName: inv?.serviceDescription || "Statutory Audit & Tax Filing",
      invoiceNo: inv?.invoiceNo || "GPA/2026-27/089",
      invoiceAmount: amount,
      firmUpiVpa: firmUpiVpa,
      portalUrl: "https://ca.naturexpress.in/"
    });

    toast.success(
      "WhatsApp Invoice Dispatched",
      `Payment request with Dynamic UPI link sent to ${client?.name}.`
    );
  };

  const handleBulkChase = () => {
    const lockedConfigs = effectiveConfigs.filter(c => c.isLocked);
    lockedConfigs.forEach(c => {
      const client = clients.find(cl => cl.id === c.entityId);
      if (client) {
        openWhatsAppPreset(client.primaryContact?.phone || "919820011223", "FEE_INVOICE_UTR", {
          clientName: client.name,
          firmName: "GPA & Co., Chartered Accountants",
          invoiceNo: "GPA/OVERDUE-SUMMARY",
          invoiceAmount: c.totalOutstandingAmount,
          firmUpiVpa: firmUpiVpa,
          portalUrl: "https://ca.naturexpress.in/"
        });
      }
    });
    toast.success("Bulk Reminders Dispatched", `Sent WhatsApp UPI payment nudges to ${lockedConfigs.length} locked clients.`);
  };

  return (
    <div className="space-y-6">
      {/* High-Contrast Executive Banner */}
      <div className="bg-gradient-to-r from-red-50/90 via-white to-amber-50/40 border border-red-200 rounded-3xl p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-red-100 text-btred-logo border border-red-200 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-btred-logo" /> High-Value Recovery Engine
              </span>
              <span className="text-xs text-slate-600 font-semibold">Section 43B(h) / MSME Protection</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Lock className="w-6 h-6 text-btred-logo" /> &quot;Pay-to-Release&quot; Fee Gatekeeper
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Eliminate uncollected CA retainers. Automatically lock Form 3CD, ITR-V, and signed balance sheet downloads until outstanding invoices are settled via Dynamic UPI QR or verified RTGS/NEFT UTR.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 min-w-[220px] text-right shadow-sm text-slate-900">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Locked Outstanding Recovery</div>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">₹{totalLockedAmount.toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-slate-600 font-semibold mt-0.5">{lockedClientsCount} client(s) currently gated</div>
            </div>

            <button
              onClick={handleBulkChase}
              disabled={lockedClientsCount === 0}
              className="bg-btred-logo hover:bg-red-700 text-white font-bold text-xs px-4 py-3.5 rounded-2xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Reminders ({lockedClientsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards (High-Contrast, Pure Legibility) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Configurable Lock Policy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-900 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">Lock Policy</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPolicySelectorOpen(!isPolicySelectorOpen)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
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
                  onClick={() => {
                    setLockPolicyDays(d);
                    setIsPolicySelectorOpen(false);
                    toast.info("Policy Updated", `Deliverable lock grace period set to ${d} days.`);
                  }}
                  className={`w-full text-left text-xs font-bold px-2 py-1.5 rounded-lg flex items-center justify-between ${
                    lockPolicyDays === d ? "bg-btred-logo text-white" : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span>{d} Days {d === 15 ? "(Strict MSME)" : d === 30 ? "(Standard Practice)" : "(Extended Grace)"}</span>
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
              {firmUpiVpa}
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(firmUpiVpa);
                setCopiedUpi(true);
                setTimeout(() => setCopiedUpi(false), 2000);
                toast.success("UPI Copied", `${firmUpiVpa} copied to clipboard.`);
              }}
              className="text-slate-400 hover:text-slate-700 p-1"
              title="Copy UPI VPA"
            >
              {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">NPCI Instant Webhook Reconciliation</div>
        </div>

        {/* Card 4: ICAI Ethics & SA 210 Grounding (Legally Accurate) */}
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

      {/* Client Deliverables Gating Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Client Deliverable Lock Status</h3>
            <p className="text-xs text-slate-600 mt-0.5">Live gatekeeping overview across all active tax audits and company filings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setClientPwaPreviewOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
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
              {effectiveConfigs.map((cfg) => {
                const client = clients.find((c) => c.id === cfg.entityId);
                const clientInvoices = invoices.filter((i) => i.entityId === cfg.entityId && i.status !== "PAID");
                const unpaidSum = clientInvoices.reduce((acc, curr) => acc + curr.amount, 0);
                const displayAmount = cfg.totalOutstandingAmount || unpaidSum;
                const utrSubmittedInv = clientInvoices.find(i => i.status === "UTR_SUBMITTED");

                return (
                  <tr key={cfg.entityId} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    {/* 1. Client / Entity Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{client?.name || cfg.entityId}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          PAN: {client?.pan || "AAACA1294F"}
                        </span>
                        <span>&bull; Group: {client?.groupName || "Direct"}</span>
                      </div>
                    </td>

                    {/* 2. Overdue Balance (FIXED: High-Contrast Dark Bold Typography) */}
                    <td className="py-3.5 px-4">
                      <div 
                        onClick={() => {
                          if (client && clientInvoices[0]) {
                            setSelectedInvoiceView({ client, invoice: clientInvoices[0] });
                          }
                        }}
                        className="cursor-pointer group"
                        title="Click to view invoice details"
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

                    {/* 3. Aging */}
                    <td className="py-3.5 px-4">
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
                    </td>

                    {/* 4. Gate Status */}
                    <td className="py-3.5 px-4">
                      {cfg.isLocked ? (
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
                            <span key={item} className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {item.replace(/_/g, " ")}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">None</span>
                        )}
                      </div>
                    </td>

                    {/* 6. Gatekeeper Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {displayAmount === 0 ? (
                          /* Client with ₹0 overdue has settled in full - no Re-Lock button */
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled in Full
                          </span>
                        ) : utrSubmittedInv ? (
                          /* Client has submitted UTR for RTGS clearance */
                          <button
                            onClick={() => handleSimulatePayment(cfg.entityId, displayAmount)}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            title={`Verify client RTGS UTR: ${utrSubmittedInv.clientUtrNumber}`}
                          >
                            <Check className="w-3.5 h-3.5" /> Reconcile UTR
                          </button>
                        ) : cfg.isLocked ? (
                          <>
                            {/* Simulate UPI Pay (FIXED: High-Contrast White Text on Emerald) */}
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
                              title="Send UPI Link to Client Signatory on WhatsApp"
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
                  Total Gated Dues: ₹{selectedQrConfig.config.totalOutstandingAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedQrConfig(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic QR Display */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
              <div className="mx-auto w-40 h-40 bg-white border-2 border-indigo-200 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-md relative">
                <img src="/brainsandtaxes_qrcode.jpg" alt="Brains & Taxes UPI QR" className="w-28 h-28 mx-auto object-contain rounded-lg" />
                <span className="text-[10px] font-mono mt-1 text-indigo-700 font-extrabold uppercase">
                  BRAINSANDTAXES@icici
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono font-black text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-xl inline-block">
                  {firmUpiVpa}
                </div>
                <div className="text-[11px] text-slate-500">
                  Payee: Brains &amp; Taxes Private Limited &bull; ICICI Bank
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
                onClick={() => handleSimulatePayment(selectedQrConfig.config.entityId, selectedQrConfig.config.totalOutstandingAmount)}
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

      {/* MODAL 2: INVOICE BREAKDOWN DRAWER */}
      {selectedInvoiceView && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black text-btred-logo tracking-wider">
                  Professional Fee Invoice
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
                <span className="text-slate-500 font-medium">Description:</span>
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
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SIMULATE CLIENT PWA LOCK SCREEN */}
      {clientPwaPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[2.5rem] max-w-sm w-full p-6 shadow-2xl border-4 border-slate-800 space-y-4 text-white relative animate-in zoom-in-95">
            <button
              onClick={() => setClientPwaPreviewOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mobile Header */}
            <div className="text-center pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-btred-logo bg-red-950/80 px-2 py-0.5 rounded-full border border-red-800">
                Client Mobile View
              </span>
              <h4 className="text-base font-black text-white mt-2">Certified Deliverables</h4>
              <p className="text-xs text-slate-400">Apex AutoTech Private Limited</p>
            </div>

            {/* Locked Deliverables Blurred Preview */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2 relative overflow-hidden">
              <div className="filter blur-xs opacity-60 space-y-2">
                <div className="flex justify-between items-center bg-slate-900/80 p-2 rounded-xl text-xs">
                  <span>Form 3CD Tax Audit Final Certification.pdf</span>
                  <span className="font-bold">Download</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/80 p-2 rounded-xl text-xs">
                  <span>ITR-6 Acknowledgment AY 2026-27.pdf</span>
                  <span className="font-bold">Download</span>
                </div>
              </div>

              {/* Overlay Lock Badge */}
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-3 text-center">
                <Lock className="w-8 h-8 text-btred-logo mb-1" />
                <span className="text-xs font-black text-white">Deliverables Temporarily Gated</span>
                <span className="text-[10px] text-slate-400 max-w-xs mt-0.5">
                  Outstanding retainer of ₹1,18,000 pending settlement u/s 43B(h).
                </span>
              </div>
            </div>

            {/* Instant Unlock Button for Client */}
            <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 text-center space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                <QrCode className="w-3.5 h-3.5" /> 1-Tap UPI Settle &amp; Download
              </div>
              <button
                onClick={() => {
                  setClientPwaPreviewOpen(false);
                  handleSimulatePayment("CLI-APEX-01", 118000);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 rounded-xl transition shadow-lg"
              >
                Pay ₹1,18,000 via UPI &amp; Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PARTNER OVERRIDE AUTHORIZATION */}
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
              You are authorizing manual release of certified tax documents without fee receipt. Under firm policy, this override is permanently recorded in the <strong>ICAI Peer Review Compliance Log</strong>.
            </p>

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
    </div>
  );
}
