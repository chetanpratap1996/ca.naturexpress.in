"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Zap,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Info,
} from "lucide-react";

import { GstComplianceHistoryItem } from "@/lib/types";

type FilingStatus = "FILED_ON_TIME" | "FILED_LATE" | "NOT_FILED" | "FUTURE" | "NOT_APPLICABLE";

interface GstReturnMonth {
  period: string;
  periodKey: string;
  gstr1Status: FilingStatus;
  gstr3bStatus: FilingStatus;
  gstr1FilingDate?: string;
  gstr3bFilingDate?: string;
  delayDaysGstr1: number;
  delayDaysGstr3b: number;
  lateFeeRisk: "NIL" | "LOW" | "HIGH";
}

interface EntitySnapshot {
  legalName: string;
  tradeName: string;
  pan: string;
  gstin: string;
  cin: string;
  entityType: string;
  businessConstitution: string;
  taxpayerType: string;
  gstStatus: string;
  gstRegistrationDate: string;
  gstCancellationDate: string | null;
  registeredAddress: string;
  stateCode: string;
  stateName: string;
  city: string;
  pincode: string;
  incorporationYear: number | null;
  isListedCompany: boolean;
  rocJurisdiction: string;
  gstFilingFrequency: "MONTHLY" | "QRMP" | "COMPOSITION" | "UNREGISTERED";
  blockStatus: string;
  creditsRemaining?: number;
  dataFreshness: "LIVE" | "CACHED" | "OFFLINE";
  errors: string[];
  warnings: string[];
}

interface GstTimeline {
  timeline: GstReturnMonth[];
  filedOnTime: number;
  filedLate: number;
  notFiled: number;
  futureMonths: number;
  complianceScore: number;
  healthBand: "EXCELLENT" | "GOOD" | "MODERATE" | "POOR" | "CRITICAL";
  consecutiveDefaultMonths: number;
  lastFiledPeriod: string | null;
  estimatedLateFeeExposure: string;
  nextDueDates: Array<{ returnType: string; period: string; dueDate: string; daysLeft: number; isOverdue: boolean }>;
}

// ─── Auto-fill callback ───────────────────────────────────────────────────────

export interface EntityAutoFillPayload {
  entityName?: string;
  tradeName?: string;
  pan?: string;
  gstin?: string;
  cin?: string;
  entityType?: string;
  gstFilingFrequency?: string;
  registeredAddress?: string;
  stateName?: string;
  gstStatus?: string;
  taxpayerType?: string;
  gstRegistrationDate?: string;
  gstCancellationDate?: string | null;
  gstHistory?: GstReturnMonth[];
  normalizedHistory?: GstComplianceHistoryItem[];
  complianceScore?: number;
  lastFiledPeriod?: string;
}

interface EntityIntelligenceBoxProps {
  /** Pre-seed values from parent form */
  initialGstin?: string;
  initialCin?: string;
  initialPan?: string;
  /** Called when user confirms auto-fill */
  onAutoFill: (payload: EntityAutoFillPayload) => void;
  /** Optional class override */
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HEALTH_CONFIG = {
  EXCELLENT: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", bar: "bg-emerald-500", label: "Excellent" },
  GOOD:      { color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-300",    bar: "bg-blue-500",    label: "Good" },
  MODERATE:  { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-300",   bar: "bg-amber-500",   label: "Moderate" },
  POOR:      { color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-300",  bar: "bg-orange-500",  label: "Poor" },
  CRITICAL:  { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-300",    bar: "bg-rose-500",    label: "Critical" },
};

function getStatusDot(status: FilingStatus): string {
  switch (status) {
    case "FILED_ON_TIME": return "bg-emerald-500";
    case "FILED_LATE":    return "bg-amber-400";
    case "NOT_FILED":     return "bg-rose-500";
    case "FUTURE":        return "bg-slate-200";
    default:              return "bg-slate-300";
  }
}

function getStatusLabel(status: FilingStatus): string {
  switch (status) {
    case "FILED_ON_TIME": return "On-Time";
    case "FILED_LATE":    return "Late";
    case "NOT_FILED":     return "Missing";
    case "FUTURE":        return "Upcoming";
    default:              return "N/A";
  }
}

function mapApiEntityType(apiType: string): string {
  const map: Record<string, string> = {
    PVT_LTD: "Private Limited Company",
    PUBLIC_LTD: "Public Limited Company",
    LLP: "Limited Liability Partnership",
    PARTNERSHIP: "Partnership Firm",
    PROPRIETORSHIP: "Proprietorship",
    INDIVIDUAL_HNI: "Individual / HNI",
    TRUST_NGO: "Trust / NGO",
  };
  return map[apiType] || apiType;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const EntityIntelligenceBox: React.FC<EntityIntelligenceBoxProps> = ({
  initialGstin = "",
  initialCin = "",
  initialPan = "",
  onAutoFill,
  className = "",
}) => {
  const [inputGstin, setInputGstin] = useState(initialGstin);
  const [inputCin, setInputCin]     = useState(initialCin);
  const [inputPan, setInputPan]     = useState(initialPan);

  const [isDetecting, setIsDetecting]         = useState(false);
  const [isFetchingTimeline, setIsFetchingTimeline] = useState(false);
  const [snapshot, setSnapshot]               = useState<EntitySnapshot | null>(null);
  const [timeline, setTimeline]               = useState<GstTimeline | null>(null);
  const [isConfirmed, setIsConfirmed]         = useState(false);
  const [showTimeline, setShowTimeline]       = useState(true);
  const [showNextDues, setShowNextDues]       = useState(false);
  const [detectionError, setDetectionError]   = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleDetect = useCallback(async () => {
    if (!inputGstin.trim() && !inputCin.trim() && !inputPan.trim()) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsDetecting(true);
    setDetectionError(null);
    setSnapshot(null);
    setTimeline(null);
    setIsConfirmed(false);

    try {
      const res = await fetch("/api/entity/auto-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gstin: inputGstin.trim().toUpperCase() || undefined,
          cin:   inputCin.trim().toUpperCase()   || undefined,
          pan:   inputPan.trim().toUpperCase()   || undefined,
        }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDetectionError(data.error || "Auto-detect failed. Check the GSTIN/CIN/PAN and retry.");
        return;
      }

      setSnapshot(data.data as EntitySnapshot);

      // Immediately kick off GST timeline if GSTIN provided
      if (inputGstin.trim().length === 15) {
        setIsFetchingTimeline(true);
        try {
          const tRes = await fetch("/api/entity/gst-timeline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ gstin: inputGstin.trim().toUpperCase(), months: 24 }),
          });
          const tData = await tRes.json();
          if (tRes.ok && tData.success) {
            setTimeline(tData as GstTimeline);
          }
        } catch {
          // Timeline is optional — don't block on it
        } finally {
          setIsFetchingTimeline(false);
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setDetectionError(err.message || "Network error. Please retry.");
      }
    } finally {
      setIsDetecting(false);
    }
  }, [inputGstin, inputCin, inputPan]);

  const handleConfirmAndFill = useCallback(() => {
    if (!snapshot) return;
    const normalizedHistory: GstComplianceHistoryItem[] = (timeline?.timeline || [])
      .filter((m) => m.gstr3bStatus !== "FUTURE")
      .slice(-12)
      .reverse()
      .map((m) => ({
        period: m.period,
        returnType: "GSTR_3B",
        arn: m.gstr3bStatus === "NOT_FILED" ? "" : "FILED",
        filingDate: m.gstr3bFilingDate || "",
        taxLiabilityCash: 0,
        itcClaimed: 0,
        delayDays: m.gstr3bStatus === "NOT_FILED" ? 1 : m.delayDaysGstr3b,
        lateFeePaid: 0,
      }));
    const payload: EntityAutoFillPayload = {
      entityName:           snapshot.legalName || undefined,
      tradeName:            snapshot.tradeName || undefined,
      pan:                  snapshot.pan || undefined,
      gstin:                snapshot.gstin || undefined,
      cin:                  snapshot.cin || undefined,
      entityType:           snapshot.entityType || undefined,
      gstFilingFrequency:   snapshot.gstFilingFrequency || undefined,
      registeredAddress:    snapshot.registeredAddress || undefined,
      stateName:            snapshot.stateName || undefined,
      gstStatus:            snapshot.gstStatus || undefined,
      taxpayerType:         snapshot.taxpayerType || undefined,
      gstRegistrationDate:  snapshot.gstRegistrationDate || undefined,
      gstCancellationDate:  snapshot.gstCancellationDate || null,
      gstHistory:           timeline?.timeline,
      normalizedHistory:    normalizedHistory.length > 0 ? normalizedHistory : undefined,
      complianceScore:      timeline?.complianceScore,
      lastFiledPeriod:      timeline?.lastFiledPeriod || undefined,
    };
    setIsConfirmed(true);
    onAutoFill(payload);
  }, [snapshot, timeline, onAutoFill]);

  const handleReset = () => {
    setSnapshot(null);
    setTimeline(null);
    setIsConfirmed(false);
    setDetectionError(null);
  };

  const hc = timeline ? HEALTH_CONFIG[timeline.healthBand] : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-slate-50 overflow-hidden shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5 border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600">
        <Zap className="w-4 h-4 text-yellow-300 shrink-0" />
        <div>
          <h4 className="text-white font-black text-[11px] tracking-wider uppercase">
            Entity Intelligence Engine
          </h4>
          <p className="text-indigo-200 text-[10px]">
            Enter GSTIN / CIN / PAN → Auto-fetch identity, past GST filings & forward plan
          </p>
        </div>
        {snapshot && (
          <button onClick={handleReset} className="ml-auto text-indigo-200 hover:text-white transition" title="Reset">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input Row */}
      <div className="px-4 py-3 flex flex-wrap gap-2 items-end border-b border-indigo-100 bg-white/60">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-black text-indigo-800 mb-1 uppercase tracking-wider">GSTIN</label>
          <input
            type="text"
            maxLength={15}
            value={inputGstin}
            onChange={(e) => setInputGstin(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") handleDetect(); }}
            placeholder="27AABCU9603R1ZX"
            className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[10px] font-black text-indigo-800 mb-1 uppercase tracking-wider">CIN / LLPIN</label>
          <input
            type="text"
            maxLength={21}
            value={inputCin}
            onChange={(e) => setInputCin(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") handleDetect(); }}
            placeholder="U72900DL2020PTC..."
            className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
          />
        </div>
        <div className="flex-1 min-w-[100px]">
          <label className="block text-[10px] font-black text-indigo-800 mb-1 uppercase tracking-wider">PAN</label>
          <input
            type="text"
            maxLength={10}
            value={inputPan}
            onChange={(e) => setInputPan(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") handleDetect(); }}
            placeholder="AABCU9603R"
            className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={handleDetect}
          disabled={isDetecting || (!inputGstin.trim() && !inputCin.trim() && !inputPan.trim())}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wide transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isDetecting ? (
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          {isDetecting ? "Analysing…" : "Fetch & Analyse"}
        </button>
      </div>

      {/* Error */}
      {detectionError && (
        <div className="mx-4 my-3 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-[11px]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{detectionError}</span>
        </div>
      )}

      {/* Loading shimmer */}
      {isDetecting && !snapshot && (
        <div className="px-4 py-6 flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-indigo-700 font-bold text-[11px]">Querying GST Portal & MCA Registry…</p>
            <p className="text-slate-400 text-[10px] mt-0.5">Fetching legal name, constitution, filing history</p>
          </div>
        </div>
      )}

      {/* Result Panel */}
      {snapshot && (
        <div className="px-4 py-3 space-y-3">
          {/* Entity Identity Card */}
          <div className="bg-white rounded-xl border border-indigo-100 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-[13px] leading-tight">
                    {snapshot.legalName || "—"}
                  </h3>
                  {snapshot.tradeName && snapshot.tradeName !== snapshot.legalName && (
                    <p className="text-[10px] text-slate-500 font-medium">Trade: {snapshot.tradeName}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                      {mapApiEntityType(snapshot.entityType)}
                    </span>
                    {snapshot.taxpayerType && (
                      <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                        GST: {snapshot.taxpayerType}
                      </span>
                    )}
                    {snapshot.gstStatus && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg border ${
                        snapshot.gstStatus === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {snapshot.gstStatus}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${
                      snapshot.dataFreshness === "LIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : snapshot.dataFreshness === "CACHED"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {snapshot.dataFreshness === "LIVE" ? "⚡ Live" : snapshot.dataFreshness === "CACHED" ? "♻ Cached" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Compliance score badge (shown if timeline loaded) */}
              {timeline && hc && (
                <div className={`shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl border ${hc.border} ${hc.bg}`}>
                  <span className={`text-[18px] font-black ${hc.color}`}>{timeline.complianceScore}</span>
                  <span className={`text-[9px] font-black uppercase ${hc.color}`}>{hc.label}</span>
                  <span className="text-[9px] text-slate-400">Score</span>
                </div>
              )}
            </div>

            {/* Meta row */}
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
              {snapshot.pan && (
                <div className="flex items-center gap-1 text-slate-600">
                  <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="font-bold">PAN:</span>
                  <span className="font-mono">{snapshot.pan}</span>
                </div>
              )}
              {snapshot.gstRegistrationDate && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="font-bold">GST Since:</span>
                  <span>{snapshot.gstRegistrationDate}</span>
                </div>
              )}
              {snapshot.incorporationYear && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="font-bold">Incorp:</span>
                  <span>{snapshot.incorporationYear}</span>
                </div>
              )}
              {snapshot.stateName && (
                <div className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="font-bold">State:</span>
                  <span>{snapshot.stateName}{snapshot.stateCode ? ` (${snapshot.stateCode})` : ""}</span>
                </div>
              )}
              {snapshot.gstFilingFrequency && snapshot.gstFilingFrequency !== "UNREGISTERED" && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="font-bold">Scheme:</span>
                  <span>{snapshot.gstFilingFrequency}</span>
                </div>
              )}
              {snapshot.creditsRemaining !== undefined && (
                <div className="flex items-center gap-1 text-slate-500">
                  <Info className="w-3 h-3 text-slate-300 shrink-0" />
                  <span>{snapshot.creditsRemaining} API credits left</span>
                </div>
              )}
            </div>

            {/* Registered address */}
            {snapshot.registeredAddress && (
              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{snapshot.registeredAddress}</span>
              </div>
            )}

            {/* Warnings */}
            {snapshot.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {snapshot.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GST Filing Timeline */}
          {(isFetchingTimeline || timeline) && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowTimeline((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition text-[11px] font-black text-slate-700 uppercase tracking-wide"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                  GST Filing History (Last 24 Months)
                  {isFetchingTimeline && (
                    <RotateCcw className="w-3 h-3 animate-spin text-indigo-400" />
                  )}
                </div>
                {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTimeline && timeline && (
                <div className="p-3 space-y-3">
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "On-Time", value: timeline.filedOnTime, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
                      { label: "Late", value: timeline.filedLate, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
                      { label: "Missing", value: timeline.notFiled, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
                      { label: "Consec. Default", value: timeline.consecutiveDefaultMonths, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
                    ].map((s) => (
                      <div key={s.label} className={`text-center rounded-xl px-2 py-2 border ${s.bg} ${s.border}`}>
                        <div className={`text-[16px] font-black ${s.color}`}>{s.value}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Score bar */}
                  {hc && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-bold text-slate-600">Compliance Health</span>
                        <span className={`font-black ${hc.color}`}>{timeline.complianceScore}% — {hc.label}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${hc.bar}`}
                          style={{ width: `${timeline.complianceScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Late fee exposure */}
                  {timeline.estimatedLateFeeExposure !== "NIL" && (
                    <div className="flex items-center gap-1.5 text-[10px] text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
                      <TrendingDown className="w-3 h-3 shrink-0" />
                      <span>Est. late fee exposure: <strong>{timeline.estimatedLateFeeExposure}</strong></span>
                    </div>
                  )}

                  {/* Calendar Grid — 24 months as 2-row grid */}
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1.5">GSTR-3B Filing Calendar</p>
                    <div className="grid grid-cols-12 gap-1">
                      {timeline.timeline.slice(-24).map((m) => (
                        <div
                          key={m.periodKey}
                          title={`${m.period}\nGSTR-1: ${getStatusLabel(m.gstr1Status)}\nGSTR-3B: ${getStatusLabel(m.gstr3bStatus)}${m.delayDaysGstr3b > 0 ? `\nDelay: ${m.delayDaysGstr3b}d` : ""}`}
                          className="flex flex-col items-center gap-0.5 cursor-default group"
                        >
                          <div className={`w-full h-5 rounded-md ${getStatusDot(m.gstr3bStatus)} opacity-90 group-hover:opacity-100 transition relative`}>
                            {m.lateFeeRisk === "HIGH" && m.gstr3bStatus !== "FUTURE" && (
                              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-600 rounded-full border border-white" />
                            )}
                          </div>
                          <span className="text-[7px] text-slate-400 font-mono leading-none">
                            {m.period.split(" ")[0].substring(0, 3)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[9px] text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />On-Time</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />Late</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" />Missing</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-200 inline-block" />Upcoming</span>
                    </div>
                  </div>

                  {/* Last filed */}
                  {timeline.lastFiledPeriod && (
                    <p className="text-[10px] text-slate-500">
                      Last GSTR-3B filed: <strong className="text-slate-700">{timeline.lastFiledPeriod}</strong>
                    </p>
                  )}

                  {/* Next Due Dates */}
                  {timeline.nextDueDates.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowNextDues((v) => !v)}
                        className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold hover:underline"
                      >
                        <Calendar className="w-3 h-3" />
                        {showNextDues ? "Hide" : "Show"} Upcoming Due Dates
                        {showNextDues ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {showNextDues && (
                        <div className="mt-2 space-y-1">
                          {timeline.nextDueDates.map((nd, i) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between text-[10px] rounded-lg px-2.5 py-1.5 border ${
                                nd.isOverdue
                                  ? "bg-rose-50 border-rose-200 text-rose-700"
                                  : nd.daysLeft <= 7
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <span className="font-bold">{nd.returnType} — {nd.period}</span>
                              <span className="font-mono">
                                {nd.isOverdue
                                  ? `⚠ Overdue by ${Math.abs(nd.daysLeft)}d`
                                  : nd.daysLeft === 0
                                  ? "⚡ Due Today!"
                                  : `${nd.daysLeft}d left (${nd.dueDate})`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Confirm & Auto-Fill Button */}
          {!isConfirmed ? (
            <button
              type="button"
              onClick={handleConfirmAndFill}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-[12px] uppercase tracking-wider transition shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Auto-Fill Form
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 text-emerald-700 font-bold text-[11px]">
              <CheckCircle2 className="w-4 h-4" />
              Form auto-filled! Verify details below and save.
            </div>
          )}
        </div>
      )}

      {/* Empty state hint */}
      {!snapshot && !isDetecting && !detectionError && (
        <div className="px-4 py-4 flex items-center gap-2 text-[10px] text-slate-400">
          <Zap className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
          Enter GSTIN to auto-fetch legal name, constitution, address, filing frequency &amp; 24-month GST compliance history.
        </div>
      )}
    </div>
  );
};
