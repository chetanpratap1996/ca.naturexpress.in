"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Copy,
  Eye,
  RefreshCw,
  Zap,
  ArrowRight,
  Send,
  HelpCircle,
  FileCheck,
  AlertOctagon,
  Percent,
  X
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import {
  GatekeeperDeliverable,
  ClientRelationshipTier,
  computeTds194jSettlement,
  formatTieredGatekeeperWhatsAppMessage
} from "@/lib/billing/tieredGatekeeper";
import { generateNpciDynamicUpiUri, generateUpiQrDataUrl } from "@/lib/billing/npciUpiEngine";

export function TieredGatekeeperDesk() {
  const [deliverables, setDeliverables] = useState<GatekeeperDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTierFilter, setSelectedTierFilter] = useState<"ALL" | ClientRelationshipTier>("ALL");
  const [inspectDeliverable, setInspectDeliverable] = useState<GatekeeperDeliverable | null>(null);
  const [overrideModalDeliverable, setOverrideModalDeliverable] = useState<GatekeeperDeliverable | null>(null);
  const [overrideReason, setOverrideReason] = useState("Bank CC limit renewal deadline today - sanctioning committee meeting");
  const [overrideHours, setOverrideHours] = useState(48);
  const [isOverriding, setIsOverriding] = useState(false);
  const [qrModalDeliverable, setQrModalDeliverable] = useState<GatekeeperDeliverable | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [upiUri, setUpiUri] = useState<string>("");
  const [isTdsApplied, setIsTdsApplied] = useState(true);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  const fetchDeliverables = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pay-to-release");
      const data = await res.json();
      if (data?.success && data?.deliverables) {
        setDeliverables(data.deliverables);
      }
    } catch (err) {
      console.error("Failed to load gatekeeper deliverables:", err);
      toast.error("Network Error", "Could not load deliverables list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverables();
  }, []);

  // Filtered deliverables
  const filtered = deliverables.filter((d) => {
    if (selectedTierFilter === "ALL") return true;
    return d.clientTier === selectedTierFilter;
  });

  // Aggregated Metrics
  const totalGatedValue = deliverables.filter((d) => d.isLocked).reduce((sum, d) => sum + d.feeAmount, 0);
  const totalProtectedCount = deliverables.filter((d) => d.isLocked).length;
  const activeOverridesCount = deliverables.filter(
    (d) => d.partnerOverrideUntil && new Date(d.partnerOverrideUntil).getTime() > Date.now()
  ).length;
  const unlockedDeliverablesCount = deliverables.filter((d) => !d.isLocked).length;

  // Open QR Drawer
  const handleOpenQr = async (d: GatekeeperDeliverable) => {
    setQrModalDeliverable(d);
    setIsTdsApplied(d.appliedTdsRate > 0);
    const amountToCharge = d.appliedTdsRate > 0 ? d.netPayableAmount : d.feeAmount;

    const uri = generateNpciDynamicUpiUri({
      vpa: "BRAINSANDTAXES@icici",
      payeeName: "GPA & Co., Chartered Accountants",
      amount: amountToCharge,
      invoiceNo: d.invoiceNo,
      note: `Fee for ${d.title.slice(0, 30)}`
    });
    setUpiUri(uri);

    try {
      const qr = await generateUpiQrDataUrl(uri);
      setQrDataUrl(qr);
    } catch (e) {
      console.error("QR generation failed", e);
    }
  };

  // Toggle TDS in QR modal
  const handleToggleTds = async (apply: boolean) => {
    if (!qrModalDeliverable) return;
    setIsTdsApplied(apply);
    const effectiveAmount = apply
      ? computeTds194jSettlement(qrModalDeliverable.feeAmount, 10).netPayableAmount
      : qrModalDeliverable.feeAmount;

    const uri = generateNpciDynamicUpiUri({
      vpa: "BRAINSANDTAXES@icici",
      payeeName: "GPA & Co., Chartered Accountants",
      amount: effectiveAmount,
      invoiceNo: qrModalDeliverable.invoiceNo,
      note: `Fee for ${qrModalDeliverable.title.slice(0, 30)}`
    });
    setUpiUri(uri);
    try {
      const qr = await generateUpiQrDataUrl(uri);
      setQrDataUrl(qr);
    } catch (e) {
      console.error("QR update failed", e);
    }
  };

  // Instant Settle / Unlock Simulation
  const handleInstantSettle = async (deliverable: GatekeeperDeliverable) => {
    setIsSimulatingPayment(true);
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INSTANT_PAYMENT_RELEASE",
          entityId: deliverable.entityId,
          amountPaid: isTdsApplied ? deliverable.netPayableAmount : deliverable.feeAmount,
          paymentMode: "UPI_DYNAMIC",
          utrRef: `UPI-${Date.now().toString().slice(-8)}`
        })
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(
          "Payment Verified (0.8s)",
          `Deliverable ${deliverable.title.slice(0, 30)} unlocked! Watermark stripped and UDIN revealed.`
        );
        setQrModalDeliverable(null);
        await fetchDeliverables();
      } else {
        toast.error("Settlement Failed", data?.error || "Error processing release");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to trigger unlock");
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  // Partner Emergency 48h Override Execution
  const handleExecutePartnerOverride = async () => {
    if (!overrideModalDeliverable) return;
    setIsOverriding(true);
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PARTNER_OVERRIDE_UNLOCK",
          entityId: overrideModalDeliverable.entityId,
          partnerName: "CA Gunjan Jain",
          reason: overrideReason,
          durationHours: overrideHours
        })
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(
          "Partner Emergency Override Active",
          `Access unlocked for ${overrideHours} hours under ICAI SA 210 protocol.`
        );
        setOverrideModalDeliverable(null);
        await fetchDeliverables();
      } else {
        toast.error("Override Failed", data?.error || "Could not apply override");
      }
    } catch (err: any) {
      toast.error("Override Error", err.message);
    } finally {
      setIsOverriding(false);
    }
  };

  // Direct WhatsApp Dispatch
  const handleSendWhatsApp = (d: GatekeeperDeliverable) => {
    const paymentLink = `https://brains-and-taxes.in/pay/${d.invoiceNo}?amount=${d.netPayableAmount}`;
    const previewUrl = `https://brains-and-taxes.in/client/preview/${d.id}`;
    const msg = formatTieredGatekeeperWhatsAppMessage({
      clientName: d.clientName,
      deliverableTitle: d.title,
      deliverableType: d.deliverableType,
      invoiceNo: d.invoiceNo,
      grossAmount: d.feeAmount,
      netAmount: d.netPayableAmount,
      tier: d.clientTier,
      upiPaymentLink: paymentLink,
      previewUrl
    });

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    toast.success("WhatsApp Draft Generated", `Prepared tiered dispatch for ${d.clientName}`);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION (Clean White Palette, No Dark Backgrounds) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 text-btred-logo rounded-xl border border-red-200">
                <ShieldCheck className="w-5 h-5 text-btred-logo" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Relationship-Tiered Pay-to-Release Gatekeeper
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Tier-2 CA Practice Gatekeeper: Balances long-standing relationship trust (<strong>Lihaaz</strong>) with
              watertight fee protection. Multi-year retainers receive immediate soft-nudges, while high-risk ad-hoc work
              (CMA Reports, Scrutiny Replies, Form 3CD) is gated behind confidential watermarked previews that auto-unlock
              in <strong>0.8 seconds</strong> upon NPCI UPI clearance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDeliverables}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-btred-logo" : "text-slate-500"}`} />
              Refresh Status
            </button>
          </div>
        </div>

        {/* 2. SUMMARY METRICS (Clean White surfaces with crisp colored accents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gated Fee Value</span>
            <div className="text-xl font-black text-slate-900 mt-1">{formatCurrencyINR(totalGatedValue)}</div>
            <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3 text-amber-600" /> Across {totalProtectedCount} high-stakes deliverables
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unlocked Deliverables</span>
            <div className="text-xl font-black text-emerald-700 mt-1">{unlockedDeliverablesCount} Documents</div>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tier A Honour &amp; Cleared Invoices
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Partner 48h Overrides</span>
            <div className="text-xl font-black text-slate-900 mt-1">{activeOverridesCount} Active</div>
            <span className="text-[11px] text-indigo-700 font-medium flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-indigo-600" /> ICAI SA 210 Emergency Grace Active
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">UPI Release Speed</span>
            <div className="text-xl font-black text-btred-logo mt-1">&lt; 0.8 Seconds</div>
            <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-btred-logo" /> Auto watermark strip + UDIN unlock
            </span>
          </div>
        </div>
      </div>

      {/* 3. TIER FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedTierFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              selectedTierFilter === "ALL"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Deliverables ({deliverables.length})
          </button>

          <button
            onClick={() => setSelectedTierFilter("TIER_A_TRUSTED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              selectedTierFilter === "TIER_A_TRUSTED"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            🟢 Tier A - Trusted Retainers (Soft-Nudge)
          </button>

          <button
            onClick={() => setSelectedTierFilter("TIER_B_ADHOC")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              selectedTierFilter === "TIER_B_ADHOC"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            🟡 Tier B - Ad-Hoc / Notices / CMA (Hard-Lock)
          </button>

          <button
            onClick={() => setSelectedTierFilter("TIER_C_DEFAULTER")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              selectedTierFilter === "TIER_C_DEFAULTER"
                ? "bg-rose-700 text-white shadow-sm"
                : "text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            🔴 Tier C - Chronic Defaulters (Token Advance Gate)
          </button>
        </div>

        <div className="text-xs text-slate-500 px-2 font-medium">
          Showing {filtered.length} deliverables
        </div>
      </div>

      {/* 4. DELIVERABLES LISTING */}
      <div className="space-y-4">
        {filtered.map((d) => {
          const isOverrideActive =
            d.partnerOverrideUntil && new Date(d.partnerOverrideUntil).getTime() > Date.now();

          return (
            <div
              key={d.id}
              className={`bg-white border rounded-3xl p-6 shadow-sm transition-all hover:shadow-md ${
                d.isLocked
                  ? d.clientTier === "TIER_C_DEFAULTER"
                    ? "border-rose-300"
                    : "border-amber-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Side: Client & Deliverable Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{d.clientName}</span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {d.entityId}
                    </span>

                    {/* Tier Badge */}
                    {d.clientTier === "TIER_A_TRUSTED" && (
                      <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tier A &bull; Trusted Retainer (Soft-Nudge)
                      </span>
                    )}
                    {d.clientTier === "TIER_B_ADHOC" && (
                      <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" /> Tier B &bull; High-Stakes Ad-Hoc (Hard-Lock)
                      </span>
                    )}
                    {d.clientTier === "TIER_C_DEFAULTER" && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-rose-600" /> Tier C &bull; Sticky Debtor (Token Gate)
                      </span>
                    )}

                    {/* Override Active Badge */}
                    {isOverrideActive && (
                      <span className="text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-600" /> Partner 48h Override Active
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-btred-logo shrink-0" />
                      {d.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>Period: <strong className="text-slate-700">{d.period}</strong></span>
                      <span>&bull;</span>
                      <span>Invoice: <strong className="text-slate-700">{d.invoiceNo}</strong></span>
                      {d.statutoryDeadline && (
                        <>
                          <span>&bull;</span>
                          <span className="text-rose-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Due Date: {d.statutoryDeadline}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* UDIN and Watermark Status Bar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">ICAI UDIN:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        d.isLocked ? "bg-amber-100/70 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-900"
                      }`}>
                        {d.isLocked ? d.maskedUdin : d.realUdin}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Deliverable Watermark:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        d.isLocked ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {d.isLocked ? d.watermarkText : "Clean Unwatermarked Certified Final Copy"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Financial Settle Box & Actions */}
                <div className="lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0 space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-semibold">Professional Fee:</span>
                      <span className="text-base font-black text-slate-900">{formatCurrencyINR(d.feeAmount)}</span>
                    </div>

                    {d.appliedTdsRate > 0 && (
                      <div className="flex justify-between items-baseline text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3 text-slate-400" /> Less 10% TDS u/s 194J:
                        </span>
                        <span className="text-slate-700 font-bold">
                          - {formatCurrencyINR(d.feeAmount - d.netPayableAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline text-xs font-black pt-1 border-t border-slate-100 mt-1">
                      <span className="text-slate-700">Net Receivable:</span>
                      <span className="text-emerald-700 text-sm font-extrabold">{formatCurrencyINR(d.netPayableAmount)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectDeliverable(d)}
                        className="w-full px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                        title="Compare Watermarked Draft vs Final Certified Copy"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        Preview Draft
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(d)}
                        className="w-full px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                        title="Send Tier-Appropriate WhatsApp Notice"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-700" />
                        WhatsApp
                      </button>
                    </div>

                    {d.isLocked ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenQr(d)}
                          className="w-full px-2.5 py-2.5 bg-btred-logo hover:bg-red-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          UPI Settle
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOverrideModalDeliverable(d);
                            setOverrideHours(48);
                          }}
                          className="w-full px-2.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          48h Override
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Deliverable Unlocked</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. MODAL: WATERMARKED DRAFT VS UNLOCKED FINAL PREVIEW */}
      {inspectDeliverable && (
        <div className="fixed inset-0 z-50 bg-slate-700/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Dual-State Deliverable Inspector
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    See exactly what the client sees before payment vs after payment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectDeliverable(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Header */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
              <span className="text-xs font-extrabold text-btred-logo uppercase tracking-wider">
                {inspectDeliverable.deliverableType.replace(/_/g, " ")}
              </span>
              <h4 className="text-sm font-black text-slate-900">{inspectDeliverable.title}</h4>
              <p className="text-xs text-slate-600">
                Prepared for: <strong>{inspectDeliverable.clientName}</strong> &bull; Period: {inspectDeliverable.period}
              </p>
            </div>

            {/* Side-by-side or stacked states */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* STATE 1: Gated Client View (Watermarked) */}
              <div className="bg-amber-50/40 border-2 border-dashed border-amber-300 rounded-2xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-3">
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                    Pre-Payment Watermarked Draft
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Client Portal View
                  </span>
                </div>

                {/* Diagonal Watermark Overlay Effect */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none rotate-[-25deg] opacity-20">
                  <span className="text-2xl font-black text-red-600 tracking-widest text-center uppercase">
                    CONFIDENTIAL DRAFT
                    <br />
                    PENDING CLEARANCE
                  </span>
                </div>

                <div className="space-y-2 text-xs relative z-10">
                  <div className="font-bold text-slate-800">{inspectDeliverable.summaryPreview.heading}</div>
                  <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc pl-4">
                    {inspectDeliverable.summaryPreview.keyHighlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-amber-200 mt-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">ICAI UDIN Status:</span>
                    <span className="font-mono text-xs font-bold text-amber-800">
                      {inspectDeliverable.maskedUdin}
                    </span>
                  </div>

                  <div className="p-2 bg-amber-100/60 rounded-xl text-[10px] text-amber-900">
                    {inspectDeliverable.summaryPreview.confidentialNotice}
                  </div>
                </div>
              </div>

              {/* STATE 2: Unlocked Final View (Clean & Certified) */}
              <div className="bg-emerald-50/40 border border-emerald-300 rounded-2xl p-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200 mb-3">
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Post-Payment Certified Final Copy
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Instant 0.8s Release
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-800">{inspectDeliverable.summaryPreview.heading}</div>
                  <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc pl-4">
                    {inspectDeliverable.summaryPreview.keyHighlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-emerald-200 mt-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Verified ICAI UDIN:</span>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded inline-block">
                      {inspectDeliverable.realUdin}
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-100/70 rounded-xl text-[10px] text-emerald-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Cryptographically certified by CA Gunjan Jain. Clean PDF with zero watermark ready for Bank &amp; ITD portal submission.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectDeliverable(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: PARTNER EMERGENCY OVERRIDE (ICAI SA 210) */}
      {overrideModalDeliverable && (
        <div className="fixed inset-0 z-50 bg-slate-700/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Partner Emergency Override (ICAI SA 210)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Authorize temporary time-bound unlock for critical statutory deadlines
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOverrideModalDeliverable(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1">
              <div className="text-slate-500">Client: <strong className="text-slate-800">{overrideModalDeliverable.clientName}</strong></div>
              <div className="text-slate-500">Deliverable: <strong className="text-slate-800">{overrideModalDeliverable.title}</strong></div>
              <div className="text-slate-500">Pending Invoice: <strong className="text-slate-800">{overrideModalDeliverable.invoiceNo} ({formatCurrencyINR(overrideModalDeliverable.feeAmount)})</strong></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Emergency Duration:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[24, 48, 72].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setOverrideHours(hours)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        overrideHours === hours
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {hours} Hours
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Audit Justification Reason:</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter partner audit justification..."
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                <strong>ICAI Compliance Note:</strong> Authorizing this override generates an indelible audit log entry under ICAI SA 210 and issues a polite time-bound promissory notice to the client's registered WhatsApp.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOverrideModalDeliverable(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecutePartnerOverride}
                disabled={isOverriding}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                {isOverriding ? "Authorizing..." : `Authorize ${overrideHours}h Grace`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: NPCI DYNAMIC UPI QR & SECTION 194J TDS TOGGLER */}
      {qrModalDeliverable && (
        <div className="fixed inset-0 z-50 bg-slate-700/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-btred-logo">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Zero-Cost Dynamic UPI Settle</h3>
                  <p className="text-[11px] text-slate-500">Auto-release in 0.8s upon payment</p>
                </div>
              </div>
              <button
                onClick={() => setQrModalDeliverable(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TDS 194J Toggler */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Deduct 10% TDS u/s 194J?</span>
                <span className="text-[10px] text-slate-500">Applicable for Corporate/Tax-Audit clients</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleTds(true)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    isTdsApplied ? "bg-emerald-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Yes (Net)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTds(false)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    !isTdsApplied ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Gross
                </button>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-44 h-44 mx-auto p-2 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="NPCI Dynamic UPI QR" className="w-40 h-40 object-contain" />
                ) : (
                  <div className="animate-spin w-8 h-8 border-2 border-btred-logo border-t-transparent rounded-full" />
                )}
              </div>

              <div className="text-xs">
                <span className="text-slate-500">Payable Amount:</span>
                <div className="text-xl font-black text-slate-900">
                  {formatCurrencyINR(
                    isTdsApplied ? qrModalDeliverable.netPayableAmount : qrModalDeliverable.feeAmount
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                  VPA: BRAINSANDTAXES@icici
                </div>
              </div>
            </div>

            {/* 1-Tap Mobile UPI Intent Launcher */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={upiUri}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open PhonePe / GPay
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(upiUri);
                  toast.success("UPI Link Copied", "Paste in any payment app");
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy UPI URI
              </button>
            </div>

            {/* Simulation / Verification Button */}
            <button
              type="button"
              onClick={() => handleInstantSettle(qrModalDeliverable)}
              disabled={isSimulatingPayment}
              className="w-full py-3 bg-btred-logo hover:bg-red-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <Zap className="w-4 h-4" />
              {isSimulatingPayment ? "Reconciling Bank & Stripping Watermark..." : "Simulate Instant NPCI Clearance (0.8s)"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
