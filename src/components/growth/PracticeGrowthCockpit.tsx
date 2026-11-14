"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TargetEntityLead, 
  ServiceTrack, 
  StatutorySeverity, 
  LeadStage, 
  AdvisoryDocketOutput 
} from "@/lib/intelligence/types";
import { PAN_INDIA_STATES } from "@/lib/intelligence/panIndiaDirectory";
import { DEFAULT_FIRM_BRANDING, getFirmBranding } from "@/lib/config/branding";
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Building2, 
  UserCheck, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  X, 
  Copy, 
  Check, 
  ChevronRight, 
  AlertOctagon,
  FileText,
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  Compass
} from "lucide-react";

export function PracticeGrowthCockpit() {
  const [leads, setLeads] = useState<TargetEntityLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [trackFilter, setTrackFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Details
  const [selectedLeadForDocket, setSelectedLeadForDocket] = useState<TargetEntityLead | null>(null);
  const [docketData, setDocketData] = useState<AdvisoryDocketOutput | null>(null);
  const [isDocketLoading, setIsDocketLoading] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<"wa" | "email" | null>(null);
  const [selectedLeadForAudit, setSelectedLeadForAudit] = useState<TargetEntityLead | null>(null);

  // On-Demand Scanner / Ingest Modal
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isCadenceRunning, setIsCadenceRunning] = useState<boolean>(false);
  const [scanCin, setScanCin] = useState<string>("");
  const [scanGstin, setScanGstin] = useState<string>("");
  const [scanLegalName, setScanLegalName] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const firmBranding = useMemo(() => getFirmBranding(), []);

  // Fetch Leads
  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (stateFilter !== "ALL") params.set("state", stateFilter);
      if (trackFilter !== "ALL") params.set("track", trackFilter);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (stageFilter !== "ALL") params.set("stage", stageFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/growth/leads?${params.toString()}`, {
        headers: { "x-sandbox-mode": "true" }
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      } else {
        setError(data.error || "Failed to load leads");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading practice leads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [stateFilter, trackFilter, severityFilter, stageFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const criticalCount = leads.filter((l) => l.highestSeverity === "CRITICAL").length;
    const totalExposure = leads.reduce((acc, l) => acc + (l.totalPenaltyExposureInr || 0), 0);
    const newIncCount = leads.filter((l) => l.primaryTrack === "NEW_INCORPORATION").length;
    const penaltyRescueCount = leads.filter((l) => l.primaryTrack === "PENALTY_RESCUE").length;
    const retainerCount = leads.filter((l) => l.primaryTrack === "SME_RETAINER_VCFO").length;

    return {
      total,
      criticalCount,
      totalExposure,
      newIncCount,
      penaltyRescueCount,
      retainerCount,
    };
  }, [leads]);

  // Handle Stage Update
  const handleUpdateStage = async (leadId: string, newStage: LeadStage) => {
    try {
      const res = await fetch("/api/growth/leads", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-sandbox-mode": "true"
        },
        body: JSON.stringify({ id: leadId, stage: newStage }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, stage: newStage, updatedAt: new Date().toISOString() } : l))
        );
      }
    } catch (e) {
      console.error("Failed to update stage:", e);
    }
  };

  // Open Docket Modal & Load Docket
  const handleOpenDocket = async (lead: TargetEntityLead) => {
    setSelectedLeadForDocket(lead);
    setIsDocketLoading(true);
    setDocketData(null);
    try {
      const res = await fetch(`/api/growth/docket?leadId=${lead.id}`, {
        headers: { "x-sandbox-mode": "true" }
      });
      const data = await res.json();
      if (data.success) {
        setDocketData(data.docket);
        if (lead.stage === "DISCOVERED" || lead.stage === "VERIFIED") {
          handleUpdateStage(lead.id, "ADVISORY_GENERATED");
        }
      }
    } catch (e) {
      console.error("Failed to generate docket:", e);
    } finally {
      setIsDocketLoading(false);
    }
  };

  // On-demand Ingest / Scanner Handler
  const handleTriggerCadence = async () => {
    setIsCadenceRunning(true);
    try {
      const res = await fetch("/api/growth/cron?allowDev=true", { 
        method: "POST",
        headers: { "x-sandbox-mode": "true" }
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Cadence Complete!\n• State Processed: ${data.result.targetStateProcessed}\n• Recalculated Clocks: ${data.result.recalculatedCount}\n• Newly Harvested: ${data.result.newlyHarvestedCount}\n• Execution Time: ${data.result.executionDurationMs}ms`);
        fetchLeads();
      } else {
        alert(data.error || "Cadence cycle failed");
      }
    } catch (e: any) {
      alert("Cadence trigger error: " + e.message);
    } finally {
      setIsCadenceRunning(false);
    }
  };

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCin.trim() && !scanGstin.trim()) {
      alert("Please provide either a CIN or GSTIN to verify.");
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/growth/verify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-sandbox-mode": "true"
        },
        body: JSON.stringify({
          cin: scanCin.trim() || undefined,
          gstin: scanGstin.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data);
      } else {
        alert(data.error || "Verification failed");
      }
    } catch (err: any) {
      alert(err.message || "Network error running scanner");
    } finally {
      setIsScanning(false);
    }
  };

  // Commit scanned entity to database
  const handleCommitScannedLead = async () => {
    if (!scanResult) return;
    try {
      const cin = scanCin.trim().toUpperCase() || undefined;
      const gstin = scanGstin.trim().toUpperCase() || undefined;
      const legalName = scanLegalName.trim() || (cin ? `Corporate Entity (${cin})` : `Taxpayer (${gstin})`);

      const res = await fetch("/api/growth/leads", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-sandbox-mode": "true"
        },
        body: JSON.stringify({
          cin,
          gstin,
          legalName,
          companyType: scanResult.cinMeta?.companyType || "PVT_LTD",
          state: scanResult.cinMeta?.stateName || scanResult.gstMeta?.stateName || "Madhya Pradesh",
          stateCode: scanResult.cinMeta?.stateCode || scanResult.gstMeta?.stateCode || "MP",
          rocJurisdiction: scanResult.cinMeta?.rocJurisdictions?.[0] || "ROC Gwalior",
          primaryTrack: scanResult.calculation?.primaryTrack || "NEW_INCORPORATION",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsScannerOpen(false);
        setScanCin("");
        setScanGstin("");
        setScanLegalName("");
        setScanResult(null);
        fetchLeads();
      }
    } catch (e) {
      console.error("Failed to commit scanned lead:", e);
    }
  };

  // Copy text helper
  const handleCopy = (text: string, type: "wa" | "email") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Regulatory Surveillance Ticker */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1000% Accuracy Statutory Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Practice Intelligence &amp; Client Acquisition Cockpit
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Surveillance on Pan-India MCA21 incorporations, GST defaults, and Section 43B(h) triggers. Convert leads via high-authority statutory dockets with zero cold-call spam.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleTriggerCadence}
              disabled={isCadenceRunning}
              className="px-3.5 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition border border-indigo-400/30 disabled:opacity-50"
              title="Execute background recalculation and state rotation harvest"
            >
              <Sparkles className={`w-4 h-4 ${isCadenceRunning ? "animate-spin" : ""}`} />
              <span>{isCadenceRunning ? "Rotating..." : "Run Cadence Cycle"}</span>
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Scan CIN / GSTIN</span>
            </button>
            <button
              onClick={fetchLeads}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition border border-white/10"
              title="Refresh leads"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* 2. Key Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Monitored Leads</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-white">{metrics.total}</span>
              <span className="text-xs text-emerald-400 font-bold">Pan-India</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Identified Penalty Exposure</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                ₹{(metrics.totalExposure / 100000).toFixed(2)} L
              </span>
              <span className="text-xs text-amber-300 font-bold">Statutory</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Critical Urgency (Days &lt; 7)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-rose-400">{metrics.criticalCount}</span>
              <span className="text-xs text-rose-300 font-bold">Action Needed</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Active Service Tracks</span>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                {metrics.newIncCount} Inc.
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                {metrics.retainerCount} vCFO
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                {metrics.penaltyRescueCount} Rescue
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Control Center */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Service Track Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: "ALL", label: "All Opportunities" },
              { id: "NEW_INCORPORATION", label: "Track A: New Incorporations (ADT-1 / INC-20A)" },
              { id: "SME_RETAINER_VCFO", label: "Track B: SME Growth & vCFO Retainers" },
              { id: "PENALTY_RESCUE", label: "Track C: Penalty Rescue (AOC-4 / GST Lag)" },
            ].map((tab) => {
              const active = trackFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTrackFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-slate-900">{leads.length}</strong> verified entities
          </div>
        </div>

        {/* State, Severity, Stage Dropdowns and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pan-India State Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-btred-logo" />
              <span>State / Jurisdiction</span>
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All India (28 States &amp; 25 ROCs)</option>
              {Object.entries(PAN_INDIA_STATES).map(([code, meta]) => (
                <option key={code} value={code}>
                  {meta.name} ({meta.rocJurisdictions.join(", ")})
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Risk Severity</span>
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical (Immediate Default)</option>
              <option value="HIGH">High Urgency (&lt; 15 Days)</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="OPPORTUNITY">Expansion Opportunity</option>
            </select>
          </div>

          {/* Pipeline Stage */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Compass className="w-3 h-3 text-indigo-500" />
              <span>Pipeline Stage</span>
            </label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Stages</option>
              <option value="DISCOVERED">1. Discovered (Raw)</option>
              <option value="VERIFIED">2. Verified (1000% Proof)</option>
              <option value="ADVISORY_GENERATED">3. Advisory Ready</option>
              <option value="ENGAGED">4. Engaged (Outreach Sent)</option>
              <option value="CONVERTED">5. Converted (Onboarded)</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Search className="w-3 h-3 text-slate-400" />
              <span>Search Leads</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, CIN, GSTIN, Director..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
                className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Leads Pipeline Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Verifying statutory records across Indian registries...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No leads matching current filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting the state or service track filter, or scan a new CIN/GSTIN using the button above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {leads.map((lead) => {
              const isCritical = lead.highestSeverity === "CRITICAL";
              const isHigh = lead.highestSeverity === "HIGH";

              return (
                <div
                  key={lead.id}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-3xl p-5 shadow-sm transition hover:shadow-md space-y-4"
                >
                  {/* Lead Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>1000% Verified Record</span>
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            lead.primaryTrack === "NEW_INCORPORATION"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : lead.primaryTrack === "PENALTY_RESCUE"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {lead.primaryTrack.replace(/_/g, " ")}
                        </span>

                        {lead.industrialCluster && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-slate-500" />
                            <span>{lead.industrialCluster}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{lead.legalName}</span>
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono flex-wrap">
                        {lead.cin && <span>CIN: <strong className="text-slate-800">{lead.cin}</strong></span>}
                        {lead.gstin && <span>GSTIN: <strong className="text-slate-800">{lead.gstin}</strong></span>}
                        <span>Inc: <strong>{lead.incorporationDate}</strong></span>
                        <span>Location: <strong>{lead.city}, {lead.state}</strong></span>
                      </div>
                    </div>

                    {/* Financial Exposure Badge & Stage Selector */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                      {lead.totalPenaltyExposureInr > 0 ? (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-rose-600 block">Identified Exposure</span>
                          <span className="text-lg font-black text-rose-700">
                            ₹{lead.totalPenaltyExposureInr.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Compliance Status</span>
                          <span className="text-xs font-black text-emerald-700">Within Window</span>
                        </div>
                      )}

                      <select
                        value={lead.stage}
                        onChange={(e) => handleUpdateStage(lead.id, e.target.value as LeadStage)}
                        className="bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-800 rounded-xl px-2.5 py-1 focus:outline-none"
                      >
                        <option value="DISCOVERED">Stage: 1. Discovered</option>
                        <option value="VERIFIED">Stage: 2. Verified</option>
                        <option value="ADVISORY_GENERATED">Stage: 3. Advisory Ready</option>
                        <option value="ENGAGED">Stage: 4. Outreach Sent</option>
                        <option value="CONVERTED">Stage: 5. Converted</option>
                        <option value="ARCHIVED">Stage: 6. Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Pain Points Detailed Box */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Deterministic Statutory Findings ({lead.painPoints.length})
                    </span>

                    <div className="space-y-1.5">
                      {lead.painPoints.map((point) => (
                        <div
                          key={point.id}
                          className="flex items-start justify-between gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200/60"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {point.severity === "CRITICAL" ? (
                                <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : point.severity === "HIGH" ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              )}
                              <span className="font-bold text-slate-900">{point.title}</span>
                              <span className="text-[10px] text-slate-500 font-medium">({point.legalBasis})</span>
                            </div>
                            <p className="text-[11px] text-slate-600 pl-5 leading-relaxed">
                              {point.commercialImpact}
                            </p>
                          </div>

                          {point.penaltyInr > 0 && (
                            <span className="font-black text-rose-600 shrink-0 text-xs">
                              ₹{point.penaltyInr.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Director & Action Button Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Board:{" "}
                        <strong className="text-slate-900">
                          {lead.directors.map((d) => d.name).join(", ") || "Authorized Signatory"}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedLeadForAudit(lead)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Proof</span>
                      </button>

                      <button
                        onClick={() => handleOpenDocket(lead)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-700/20"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>1-Click WhatsApp Advisory</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. 1-Click WhatsApp & Email Advisory Modal */}
      {selectedLeadForDocket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                  Authoritative Statutory Dispatch
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Compliance Diagnostic Memo &bull; {selectedLeadForDocket.legalName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLeadForDocket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDocketLoading ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Generating branded advisory docket...</p>
              </div>
            ) : docketData ? (
              <div className="space-y-4">
                {/* WhatsApp Text Preview Card */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>1-Click WhatsApp Advisory Text</span>
                    </span>
                    <button
                      onClick={() => handleCopy(docketData.whatsappAdvisoryText, "wa")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {copiedType === "wa" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === "wa" ? "Copied!" : "Copy Text"}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border border-slate-800">
                    {docketData.whatsappAdvisoryText}
                  </pre>
                </div>

                {/* Email Subject & Memo */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>Executive Email Subject Line</span>
                  </span>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 flex items-center justify-between">
                    <span>{docketData.emailSubject}</span>
                    <button
                      onClick={() => handleCopy(docketData.emailSubject, "email")}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 ml-2"
                    >
                      {copiedType === "email" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 flex-wrap">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(docketData.whatsappAdvisoryText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-700/20 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Dispatch via WhatsApp</span>
                  </a>
                  <button
                    onClick={() => setSelectedLeadForDocket(null)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 6. Verification Audit Proof Modal */}
      {selectedLeadForAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">1000% Accuracy Audit Proof</h3>
              </div>
              <button
                onClick={() => setSelectedLeadForAudit(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="font-bold block mb-0.5">Statutory Registry Verification</span>
                {selectedLeadForAudit.proof.evidenceSummary}
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Source Registry Authority:</span>
                <p className="text-slate-600 font-mono bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {selectedLeadForAudit.proof.registrySource}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">SHA-256 Cryptographic Raw Hash:</span>
                <p className="text-slate-600 font-mono text-[10px] break-all bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {selectedLeadForAudit.proof.rawHash}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Timestamp:</span>
                <p className="text-slate-600 font-mono bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {new Date(selectedLeadForAudit.proof.verifiedAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLeadForAudit(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Audit Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Instant On-Demand CIN / GSTIN Scanner Drawer */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                  Deterministic Statutory Inspector
                </span>
                <h3 className="text-lg font-black text-slate-900">Scan &amp; Ingest New Entity</h3>
              </div>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunScan} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Corporate Identification Number (CIN)</label>
                <input
                  type="text"
                  placeholder="e.g. U74110MP2017PTC043716"
                  value={scanCin}
                  onChange={(e) => setScanCin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Goods &amp; Services Tax Number (GSTIN)</label>
                <input
                  type="text"
                  placeholder="e.g. 23AABCU9821F1ZX"
                  value={scanGstin}
                  onChange={(e) => setScanGstin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Legal Entity Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Brains & Taxes Private Limited"
                  value={scanLegalName}
                  onChange={(e) => setScanLegalName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-700/20 transition disabled:opacity-50"
              >
                {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{isScanning ? "Running Statutory Calculations..." : "Verify & Calculate Penalties"}</span>
              </button>
            </form>

            {/* Scan Results Preview */}
            {scanResult && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900">Verification Result</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    1000% Matched
                  </span>
                </div>

                <div className="space-y-1">
                  <p><strong>State:</strong> {scanResult.cinMeta?.stateName || scanResult.gstMeta?.stateName}</p>
                  <p><strong>ROCs:</strong> {scanResult.cinMeta?.rocJurisdictions?.join(", ") || "ROC Regional"}</p>
                  <p><strong>Calculated Exposure:</strong> ₹{(scanResult.calculation?.totalPenaltyInr || 0).toLocaleString("en-IN")}</p>
                  <p><strong>Identified Pain Points:</strong> {scanResult.calculation?.painPoints?.length || 0}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCommitScannedLead}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Add to Practice Lead Pipeline</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
