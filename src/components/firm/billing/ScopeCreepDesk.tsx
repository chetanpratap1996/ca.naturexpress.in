"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  ShieldAlert,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Copy,
  TrendingUp,
  RefreshCw,
  Send,
  HelpCircle,
  Percent,
  Plus,
  ArrowRight,
  Gift,
  X,
  Building2,
  FilePlus,
  Scale
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import {
  EngagementAgreement,
  ScopeCreepIncident,
  DynamicMicroBill,
  calculateVolumeOverageBilling
} from "@/lib/billing/scopeCreepEngine";

export function ScopeCreepDesk() {
  const [agreements, setAgreements] = useState<EngagementAgreement[]>([]);
  const [incidents, setIncidents] = useState<ScopeCreepIncident[]>([]);
  const [microBills, setMicroBills] = useState<DynamicMicroBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"incidents" | "agreements" | "micro_bills" | "goodwill">("incidents");
  const [selectedIncidentForQr, setSelectedIncidentForQr] = useState<ScopeCreepIncident | null>(null);
  const [activeQrDataUrl, setActiveQrDataUrl] = useState<string>("");
  const [activeUpiUri, setActiveUpiUri] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [waiveModalIncident, setWaiveModalIncident] = useState<ScopeCreepIncident | null>(null);
  const [waiveReason, setWaiveReason] = useState("Long-standing client partnership goodwill courtesy (Recorded in Value Delivered Ledger)");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/agreements");
      const data = await res.json();
      if (data?.success) {
        setAgreements(data.agreements || []);
        setIncidents(data.incidents || []);
        setMicroBills(data.microBills || []);
      }
    } catch (err) {
      console.error("Failed to load agreements data:", err);
      toast.error("Network Error", "Could not load scope creep records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Aggregated Metrics
  const recoverableUnbilled = incidents
    .filter((i) => i.status === "DETECTED" || i.status === "CONSENT_SENT")
    .reduce((sum, i) => sum + i.proposedMicroBillFee, 0);

  const approvedReadyToBill = incidents
    .filter((i) => i.status === "CLIENT_APPROVED")
    .reduce((sum, i) => sum + i.proposedMicroBillFee, 0);

  const goodwillGiftedValue = incidents
    .filter((i) => i.status === "WAIVED_BY_PARTNER")
    .reduce((sum, i) => sum + i.proposedMicroBillFee, 0);

  const volumeAlertsCount = agreements.filter(
    (a) => calculateVolumeOverageBilling(a).isOverCapacity
  ).length;

  // Action: Send WhatsApp Consent
  const handleSendConsent = async (incident: ScopeCreepIncident) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/billing/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_CONSENT_REQUEST",
          incidentId: incident.id,
          partnerName: "CA Gunjan Jain"
        })
      });
      const data = await res.json();
      if (data?.success && data?.whatsappText) {
        const encoded = encodeURIComponent(data.whatsappText);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
        toast.success("Consent Draft Opened", `WhatsApp approval card ready for ${incident.clientName}`);
        await fetchData();
      } else {
        toast.error("Error", data?.error || "Could not dispatch consent");
      }
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Convert to Micro-Bill
  const handleConvertToMicroBill = async (incident: ScopeCreepIncident) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/billing/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONVERT_TO_MICRO_BILL",
          incidentId: incident.id,
          partnerName: "CA Gunjan Jain"
        })
      });
      const data = await res.json();
      if (data?.success && data?.microBill) {
        toast.success(
          "Micro-Bill Generated",
          `Invoice ${data.microBill.id} generated with dynamic NPCI UPI QR for ₹${data.microBill.totalPayable.toLocaleString("en-IN")}`
        );
        setSelectedIncidentForQr(incident);
        setActiveQrDataUrl(data.microBill.qrDataUrl || "");
        setActiveUpiUri(data.microBill.upiPaymentLink || "");
        await fetchData();
      } else {
        toast.error("Error", data?.error || "Failed to generate micro-bill");
      }
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Waive as Goodwill
  const handleWaiveGoodwill = async () => {
    if (!waiveModalIncident) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/billing/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "WAIVE_AS_GOODWILL",
          incidentId: waiveModalIncident.id,
          partnerName: "CA Gunjan Jain",
          reason: waiveReason
        })
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(
          "Credited to Value Ledger",
          `₹${waiveModalIncident.proposedMicroBillFee.toLocaleString("en-IN")} logged as partner goodwill gift in Paisa Bachaya Kitna.`
        );
        setWaiveModalIncident(null);
        await fetchData();
      } else {
        toast.error("Error", data?.error || "Could not waive fee");
      }
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Upgrade Retainer Volume Tier
  const handleUpgradeTier = async (agr: EngagementAgreement) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/billing/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_VOLUME_TIER",
          agreementId: agr.id,
          entityId: agr.entityId,
          newMonthlyFee: agr.suggestedFeeRevision,
          partnerName: "CA Gunjan Jain"
        })
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(
          "Contractual Tier Upgraded",
          `Monthly retainer updated to ₹${agr.suggestedFeeRevision?.toLocaleString("en-IN")}/mo.`
        );
        await fetchData();
      } else {
        toast.error("Error", data?.error || "Could not upgrade tier");
      }
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER (Strictly Clean White & Light Surfaces, Zero Dark Blue/Black) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 text-btred-logo rounded-xl border border-red-200">
                <Zap className="w-5 h-5 text-btred-logo" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Autonomous Scope-Creep &amp; Live Agreements Engine
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Inspired by Anchor (<strong>sayanchor.com</strong>) &amp; Ignition, tailored for Indian CA firms. Automatically
              catches unbilled ad-hoc work (ASMT-10 notice replies, Bank CMA projections, ROC filings, and +200% voucher volume surges),
              requests 1-tap transparent client consent on WhatsApp, or logs it as a goodwill gift in the <strong>Paisa Bachaya Kitna</strong> ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-btred-logo" : "text-slate-500"}`} />
              Sync Agreements
            </button>
          </div>
        </div>

        {/* 2. SUMMARY METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Recoverable Scope Creep</span>
            <div className="text-xl font-black text-slate-900 mt-1">{formatCurrencyINR(recoverableUnbilled)}</div>
            <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" /> Across {incidents.filter(i => i.status === "DETECTED" || i.status === "CONSENT_SENT").length} pending add-ons
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Volume Overages Detected</span>
            <div className="text-xl font-black text-btred-logo mt-1">{volumeAlertsCount} Clients</div>
            <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-btred-logo" /> Exceeded contract vouchers by &gt;25%
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Approved Ready to Bill</span>
            <div className="text-xl font-black text-emerald-700 mt-1">{formatCurrencyINR(approvedReadyToBill)}</div>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Client consented via 1-tap WhatsApp
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Goodwill Value Gifted</span>
            <div className="text-xl font-black text-slate-700 mt-1">{formatCurrencyINR(goodwillGiftedValue)}</div>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              <Gift className="w-3 h-3 text-slate-500" /> Preserving Lihaaz in Value Ledger
            </span>
          </div>
        </div>
      </div>

      {/* 3. TABS SWITCHER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("incidents")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "incidents"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            🔍 Detected Scope Creep ({incidents.length})
          </button>

          <button
            onClick={() => setActiveTab("agreements")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "agreements"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            📜 Live Agreements &amp; Capacity ({agreements.length})
          </button>

          <button
            onClick={() => setActiveTab("micro_bills")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "micro_bills"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            ⚡ Dynamic Micro-Bills ({microBills.length})
          </button>

          <button
            onClick={() => setActiveTab("goodwill")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "goodwill"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            🎁 Goodwill Waiver Log ({incidents.filter(i => i.status === "WAIVED_BY_PARTNER").length})
          </button>
        </div>

        <div className="text-xs text-slate-500 px-2 font-medium">
          Anchor Autonomous Billing Protocol active
        </div>
      </div>

      {/* 4. TAB CONTENT: DETECTED SCOPE CREEP INCIDENTS */}
      {activeTab === "incidents" && (
        <div className="space-y-4">
          {incidents.map((inc) => {
            const agreement = agreements.find((a) => a.id === inc.agreementId);

            return (
              <div
                key={inc.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Incident Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{inc.clientName}</span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {inc.entityId}
                      </span>

                      {/* Status Badges */}
                      {inc.status === "DETECTED" && (
                        <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Out-of-Scope Work Detected
                        </span>
                      )}
                      {inc.status === "CONSENT_SENT" && (
                        <span className="text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-600" /> Awaiting Client WhatsApp Confirmation
                        </span>
                      )}
                      {inc.status === "CLIENT_APPROVED" && (
                        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Client Approved &bull; Ready to Invoice
                        </span>
                      )}
                      {inc.status === "INVOICED" && (
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-600" /> Micro-Bill Invoiced ({inc.invoiceId})
                        </span>
                      )}
                      {inc.status === "WAIVED_BY_PARTNER" && (
                        <span className="text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Gift className="w-3 h-3 text-teal-600" /> Waived as Goodwill (Credited in Value Ledger)
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <FilePlus className="w-4 h-4 text-btred-logo shrink-0" />
                        {inc.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{inc.description}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Base Contract: </span>
                        <strong className="text-slate-700">{inc.agreementId} ({formatCurrencyINR(agreement?.baseRetainerFee || 0)}/mo)</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Estimated Labor: </span>
                        <strong className="text-slate-700">{inc.estimatedHours} Hours Article/Partner Time</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">ICAI Recommended Tariff: </span>
                        <span className="line-through text-slate-400 font-semibold">{formatCurrencyINR(inc.standardIcaiTariff)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pricing Box & Action Buttons */}
                  <div className="lg:w-72 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0 space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Proposed Micro-Bill Fee:</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">
                        {formatCurrencyINR(inc.proposedMicroBillFee)}
                        <span className="text-xs font-normal text-slate-500 ml-1">+ 18% GST</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        Saves client {formatCurrencyINR(inc.standardIcaiTariff - inc.proposedMicroBillFee)} off ICAI standard
                      </span>
                    </div>

                    <div className="space-y-2">
                      {inc.status === "DETECTED" && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendConsent(inc)}
                            disabled={isProcessing}
                            className="px-2.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            WhatsApp
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setWaiveModalIncident(inc);
                            }}
                            className="px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                          >
                            <Gift className="w-3.5 h-3.5 text-slate-500" />
                            Waive (Goodwill)
                          </button>
                        </div>
                      )}

                      {inc.status === "CONSENT_SENT" && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleConvertToMicroBill(inc)}
                            disabled={isProcessing}
                            className="px-2.5 py-2.5 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            Create Micro-Bill
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendConsent(inc)}
                            className="px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Re-send
                          </button>
                        </div>
                      )}

                      {inc.status === "CLIENT_APPROVED" && (
                        <button
                          type="button"
                          onClick={() => handleConvertToMicroBill(inc)}
                          disabled={isProcessing}
                          className="w-full py-2.5 bg-btred-logo hover:bg-red-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-4 h-4" />
                          Issue Instant NPCI UPI Micro-Bill
                        </button>
                      )}

                      {inc.status === "INVOICED" && (
                        <div className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Invoiced in {inc.invoiceId}</span>
                        </div>
                      )}

                      {inc.status === "WAIVED_BY_PARTNER" && (
                        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5">
                          <Gift className="w-4 h-4 text-teal-600" />
                          <span>Credited to Value Statement</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. TAB CONTENT: LIVE ENGAGEMENT AGREEMENTS & VOLUME CAPACITY */}
      {activeTab === "agreements" && (
        <div className="space-y-4">
          {agreements.map((agr) => {
            const overage = calculateVolumeOverageBilling(agr);

            return (
              <div
                key={agr.id}
                className={`bg-white border rounded-3xl p-6 shadow-sm transition hover:shadow-md ${
                  overage.isOverCapacity ? "border-amber-300" : "border-slate-200"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Agreement Specifications */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{agr.clientName}</span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {agr.id}
                      </span>

                      {overage.isOverCapacity ? (
                        <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-amber-600" /> Capacity Surge: +{overage.overagePercentage}% Overage
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Retainer Compliant
                        </span>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-700">Contractual Inclusions:</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600 text-[11px] list-disc pl-4">
                        {agr.includedServices.map((srv, idx) => (
                          <li key={idx}>{srv}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Capacity vs Actual Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Monthly Invoices:</span>
                        <div className="font-black text-slate-900 mt-0.5">
                          {agr.actuals.actualMonthlyInvoices} / <span className="text-slate-500 font-normal">{agr.thresholds.maxMonthlyInvoices} agreed</span>
                        </div>
                        {agr.actuals.actualMonthlyInvoices > agr.thresholds.maxMonthlyInvoices && (
                          <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                            +{Math.round(((agr.actuals.actualMonthlyInvoices - agr.thresholds.maxMonthlyInvoices) / agr.thresholds.maxMonthlyInvoices) * 100)}% over threshold
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-500 block">Annual Turnover:</span>
                        <div className="font-black text-slate-900 mt-0.5">
                          ₹{agr.actuals.actualTurnoverCr} Cr / <span className="text-slate-500 font-normal">₹{agr.thresholds.maxAnnualTurnoverCr} Cr agreed</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 block">Bank Accounts:</span>
                        <div className="font-black text-slate-900 mt-0.5">
                          {agr.actuals.actualBankAccounts} / <span className="text-slate-500 font-normal">{agr.thresholds.maxBankAccounts} agreed</span>
                        </div>
                      </div>
                    </div>

                    {overage.isOverCapacity && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                        <strong>Anchor Dynamic Adjustment Notice:</strong> {overage.rationale}
                      </div>
                    )}
                  </div>

                  {/* Right: Fee Box & Action */}
                  <div className="lg:w-72 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0 space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Current Retainer:</span>
                      <div className="text-2xl font-black text-slate-900 mt-0.5">
                        {formatCurrencyINR(agr.baseRetainerFee)}
                        <span className="text-xs font-normal text-slate-500 ml-1">/{agr.billingCycle.toLowerCase()}</span>
                      </div>
                    </div>

                    {overage.isOverCapacity ? (
                      <div className="space-y-2">
                        <div className="bg-amber-100/50 p-2.5 rounded-xl border border-amber-200 text-xs">
                          <span className="text-amber-800 font-semibold block">Recommended Volume Tier:</span>
                          <span className="text-base font-black text-amber-950">
                            {formatCurrencyINR(overage.recommendedAdjustment)}/mo
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpgradeTier(agr)}
                          disabled={isProcessing}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Apply Contractual Revision
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Retainer Capacity Optimal</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. TAB CONTENT: DYNAMIC MICRO-BILLS */}
      {activeTab === "micro_bills" && (
        <div className="space-y-4">
          {microBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base">{bill.clientName}</span>
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {bill.id}
                  </span>
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" /> Payment Pending
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-800">{bill.title}</h4>
                <div className="text-xs text-slate-500">
                  Agreement: <strong>{bill.agreementId}</strong> &bull; Generated: {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-500">Total Micro-Bill:</span>
                  <div className="text-xl font-black text-slate-900">{formatCurrencyINR(bill.totalPayable)}</div>
                  <span className="text-[10px] text-slate-500">Fee {formatCurrencyINR(bill.feeAmount)} + 18% GST</span>
                </div>

                <a
                  href={bill.upiPaymentLink}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Pay via UPI
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7. TAB CONTENT: GOODWILL WAIVER LOG (PAISA BACHAYA KITNA) */}
      {activeTab === "goodwill" && (
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-900 leading-relaxed">
            <strong>The "Lihaaz" Retention Principle:</strong> When a CA waives a nominal fee (e.g. ₹2,500 for a PAN correction or ₹3,000 for a registered office shift) as a goodwill courtesy, ordinary firms lose the money and get zero credit. In our engine, every waived fee is recorded indelibly and showcased prominently on the client's <strong>Paisa Bachaya Kitna</strong> value statement, turning a billing concession into maximum client loyalty.
          </div>

          {incidents.filter(i => i.status === "WAIVED_BY_PARTNER").map((inc) => (
            <div
              key={inc.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base">{inc.clientName}</span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {inc.id}
                  </span>
                  <span className="text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Gift className="w-3 h-3 text-teal-600" /> Waived as Goodwill
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-800">{inc.title}</h4>
                <p className="text-xs text-slate-600">{inc.waivedReason}</p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500">Value Gifted to Client:</span>
                <div className="text-xl font-black text-teal-700">{formatCurrencyINR(inc.proposedMicroBillFee)}</div>
                <span className="text-[10px] text-slate-500">Logged in Value Ledger</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 8. MODAL: DYNAMIC NPCI UPI QR FOR MICRO-BILL */}
      {selectedIncidentForQr && activeQrDataUrl && (
        <div className="fixed inset-0 z-50 bg-slate-700/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-btred-logo">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Dynamic Micro-Bill Settle</h3>
                  <p className="text-[11px] text-slate-500">Anchor Instant UPI Auto-Release</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncidentForQr(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs space-y-1">
              <div className="text-slate-500">Client: <strong className="text-slate-800">{selectedIncidentForQr.clientName}</strong></div>
              <div className="text-slate-500">Add-On: <strong className="text-slate-800">{selectedIncidentForQr.title}</strong></div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-44 h-44 mx-auto p-2 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                <img src={activeQrDataUrl} alt="NPCI Dynamic UPI QR" className="w-40 h-40 object-contain" />
              </div>

              <div className="text-xs">
                <span className="text-slate-500">Total Micro-Bill Payable:</span>
                <div className="text-xl font-black text-slate-900">
                  {formatCurrencyINR(Math.round(selectedIncidentForQr.proposedMicroBillFee * 1.18))}
                </div>
                <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                  VPA: BRAINSANDTAXES@icici
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={activeUpiUri}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open PhonePe / GPay
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeUpiUri);
                  toast.success("UPI Link Copied", "Paste in any payment app");
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy UPI URI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: WAIVE AS GOODWILL */}
      {waiveModalIncident && (
        <div className="fixed inset-0 z-50 bg-slate-700/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Waive as Partnership Goodwill</h3>
                  <p className="text-[11px] text-slate-500">Log to Paisa Bachaya Kitna ledger</p>
                </div>
              </div>
              <button
                onClick={() => setWaiveModalIncident(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1">
              <div className="text-slate-500">Client: <strong className="text-slate-800">{waiveModalIncident.clientName}</strong></div>
              <div className="text-slate-500">Add-On: <strong className="text-slate-800">{waiveModalIncident.title}</strong></div>
              <div className="text-slate-500">Waived Fee: <strong className="text-emerald-700">{formatCurrencyINR(waiveModalIncident.proposedMicroBillFee)}</strong></div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-700 font-bold mb-1">Goodwill Reason / Note:</label>
              <textarea
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWaiveModalIncident(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleWaiveGoodwill}
                disabled={isProcessing}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Gift className="w-4 h-4" />
                {isProcessing ? "Logging..." : "Confirm Goodwill Waiver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
