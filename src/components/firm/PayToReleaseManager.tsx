"use client";

import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";

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

  const totalLockedAmount = configs
    .filter((c) => c.isLocked)
    .reduce((acc, curr) => acc + curr.totalOutstandingAmount, 0);

  const lockedClientsCount = configs.filter((c) => c.isLocked).length;

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
        setActionSuccessMsg(`Status updated for client.`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
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
        setActionSuccessMsg(`Payment of ₹${amount.toLocaleString("en-IN")} reconciled! Deliverables unlocked.`);
        setTimeout(() => setActionSuccessMsg(null), 5000);
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
        setActionSuccessMsg(`Partner override successfully authorized.`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-800/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> High-Value Recovery Module
              </span>
              <span className="text-xs text-slate-400">Section 43B / MSME Protection</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-400" /> &quot;Pay-to-Release&quot; Fee Gatekeeper
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Eliminate uncollected CA fees. Automatically lock Form 3CD, ITR-V, and signed balance sheet downloads until outstanding invoices are settled via Dynamic UPI QR or instant UTR verification.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 min-w-[240px] text-right">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Locked Outstanding Recovery</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">₹{totalLockedAmount.toLocaleString("en-IN")}</div>
            <div className="text-xs text-slate-400 mt-1">{lockedClientsCount} client(s) currently gated</div>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase truncate">Lock Policy</span>
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-bold text-white mt-1.5 sm:mt-2">&gt; 30 Days Overdue</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Auto download pause</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase truncate">Realization Speed</span>
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 mt-1.5 sm:mt-2">4.8 Hours</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">From filing to clearance</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase truncate">Firm UPI Endpoint</span>
            <QrCode className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
          <div className="text-xs sm:text-sm font-bold font-mono text-indigo-300 mt-1.5 sm:mt-2 truncate">{firmUpiVpa}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Instant webhook match</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase truncate">ICAI Ethics</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1.5 sm:mt-2 truncate">Lien under Common Law</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Audit paper retention</div>
        </div>
      </div>

      {/* Client Gating Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Client Deliverable Lock Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">Live gatekeeping overview across all active tax audits and company filings</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Auto-Refreshes on payment</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Client / Entity</th>
                <th className="py-3 px-4">Overdue Balance</th>
                <th className="py-3 px-4">Aging</th>
                <th className="py-3 px-4">Gate Status</th>
                <th className="py-3 px-4">Blocked Deliverables</th>
                <th className="py-3 px-4 text-right">Gatekeeper Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {configs.map((cfg) => {
                const client = clients.find((c) => c.id === cfg.entityId);
                const clientInvoices = invoices.filter((i) => i.entityId === cfg.entityId && i.status !== "PAID");
                const unpaidSum = clientInvoices.reduce((acc, curr) => acc + curr.amount, 0);
                const displayAmount = cfg.totalOutstandingAmount || unpaidSum;

                return (
                  <tr key={cfg.entityId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{client?.name || cfg.entityId}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">PAN: {client?.pan || "AAACA1294F"} • Group: {client?.groupName || "Main"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                        {displayAmount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-slate-400">{clientInvoices.length} pending bill(s)</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {cfg.oldestInvoiceDays > 0 ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          cfg.oldestInvoiceDays > 90 
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                            : cfg.oldestInvoiceDays > 30 
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}>
                          {cfg.oldestInvoiceDays} days overdue
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium">On Track</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {cfg.isLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <Lock className="w-3 h-3 text-rose-400" /> LOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Unlock className="w-3 h-3 text-emerald-400" /> RELEASED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cfg.blockedDeliverables && cfg.blockedDeliverables.length > 0 ? (
                          cfg.blockedDeliverables.map((item) => (
                            <span key={item} className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                              {item.replace(/_/g, " ")}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {cfg.isLocked ? (
                          <>
                            <button
                              onClick={() => handleSimulatePayment(cfg.entityId, displayAmount)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                              title="Simulate Instant Client UPI Payment & Auto-Unlock"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Simulate UPI Pay
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEntityId(cfg.entityId);
                                setOverrideModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                            >
                              Partner Override
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleLock(cfg.entityId)}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg transition-colors border border-slate-700 flex items-center gap-1"
                          >
                            <Lock className="w-3 h-3" /> Re-Lock
                          </button>
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

      {/* Partner Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Partner Override Authorization</h3>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              You are manually releasing signed tax deliverables without receiving fee clearance. Under firm policy, this will be permanently logged in the ICAI Peer Review Audit Trail.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Authorization Reason</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Authorized partner emergency release for filing deadline; client promised RTGS clearance tomorrow."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePartnerOverride}
                disabled={isProcessing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-colors flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Authorize & Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
