"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ClientEntity, RetainerScheduleItem, ClientRateCardItem } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { Play, Plus, Zap, Send, Layers } from "lucide-react";

interface AutopilotRetainersDeskProps {
  clients: ClientEntity[];
  onRefresh?: () => void;
}

export const AutopilotRetainersDesk: React.FC<AutopilotRetainersDeskProps> = ({ clients, onRefresh }) => {
  const [retainers, setRetainers] = useState<RetainerScheduleItem[]>([]);
  const [rateCards, setRateCards] = useState<ClientRateCardItem[]>([]);
  const [runningBatch, setRunningBatch] = useState(false);
  const [runningDunning, setRunningDunning] = useState(false);

  // New retainer form
  const [retEntityId, setRetEntityId] = useState(clients[0]?.id || "");
  const [retTitle, setRetTitle] = useState("Monthly GST & TDS Retainership");
  const [retCycle, setRetCycle] = useState<"MONTHLY" | "QUARTERLY" | "ANNUAL">("MONTHLY");
  const [retFee, setRetFee] = useState("5000");

  // New rate card form
  const [rcCategory, setRcCategory] = useState("GST");
  const [rcEntityType, setRcEntityType] = useState("PVT_LTD");
  const [rcFee, setRcFee] = useState("5000");

  // Consolidate WIP client
  const [consolidateEntityId, setConsolidateEntityId] = useState(clients[0]?.id || "");

  const loadRules = useCallback(async () => {
    const res = await fetch("/api/billing/autopilot", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      setRetainers(data.retainers || []);
      setRateCards(data.rateCards || []);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleSaveRetainer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/billing/autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "SAVE_RETAINER",
        entityId: retEntityId || clients[0]?.id,
        title: retTitle,
        billingCycle: retCycle,
        baseFee: Number(retFee),
      }),
    });
    if (res.ok) {
      toast.success("Retainer Saved", "Scheduled for autopilot billing.");
      await loadRules();
    }
  };

  const handleSaveRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/billing/autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "SAVE_RATE_CARD",
        entityType: rcEntityType,
        serviceCategory: rcCategory,
        standardFee: Number(rcFee),
      }),
    });
    if (res.ok) {
      toast.success("Rate Card Saved", "Auto-applied when tasks complete.");
      await loadRules();
    }
  };

  const handleRunRetainerBatch = async () => {
    setRunningBatch(true);
    try {
      const res = await fetch("/api/billing/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "RUN_RETAINER_BATCH" }),
      });
      const data = await res.json();
      toast.success("Retainer Batch Complete", `Generated ${data.generatedCount || 0} recurring invoice(s).`);
      await loadRules();
      if (onRefresh) onRefresh();
    } finally {
      setRunningBatch(false);
    }
  };

  const handleRunDunning = async () => {
    setRunningDunning(true);
    try {
      const res = await fetch("/api/billing/dunning", { method: "POST", credentials: "include" });
      const data = await res.json();
      toast.success("Dunning Sweep Complete", `Queued ${data.dispatchedCount || 0} WhatsApp/Email escalation(s).`);
      if (onRefresh) onRefresh();
    } finally {
      setRunningDunning(false);
    }
  };

  const handleConsolidateWip = async () => {
    if (!consolidateEntityId) return;
    const res = await fetch("/api/billing/autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "CONSOLIDATE_WIP", entityId: consolidateEntityId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      toast.error("Nothing to Consolidate", data.error || "No unbilled WIP for this client.");
      return;
    }
    toast.success("Consolidated Invoice Issued", `Bundled ${data.consolidatedCount} WIP jobs into 1 Tax Invoice.`);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Autopilot Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> Billing &amp; Collections Autopilot
          </h3>
          <p className="text-xs text-slate-500">
            Recurring retainers, rate-card pricing, consolidated monthly bills, and dunning escalation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunRetainerBatch}
            disabled={runningBatch}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            {runningBatch ? "Running..." : "Run Due Retainers Now"}
          </button>
          <button
            onClick={handleRunDunning}
            disabled={runningDunning}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {runningDunning ? "Sweeping..." : "Run Dunning Sweep"}
          </button>
        </div>
      </div>

      {/* Consolidated Monthly Statement */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-600" />
          <span className="font-bold text-slate-900">One-Click Consolidated Client Bill:</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={consolidateEntityId}
            onChange={(e) => setConsolidateEntityId(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-semibold"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={handleConsolidateWip}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold"
          >
            Bundle Open WIP into 1 Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Retainer Schedules */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-500">Recurring Retainer Schedules ({retainers.length})</h4>
          <form onSubmit={handleSaveRetainer} className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={retEntityId}
              onChange={(e) => setRetEntityId(e.target.value)}
              className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-semibold"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={retTitle}
              onChange={(e) => setRetTitle(e.target.value)}
              className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50"
              required
            />
            <select
              value={retCycle}
              onChange={(e) => setRetCycle(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </select>
            <input
              type="number"
              value={retFee}
              onChange={(e) => setRetFee(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-mono font-bold"
              required
            />
            <button type="submit" className="col-span-2 py-1.5 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Retainer Schedule
            </button>
          </form>

          <div className="divide-y divide-slate-100 text-xs max-h-56 overflow-y-auto">
            {retainers.map((r) => (
              <div key={r.id} className="py-2 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block">{r.entityName}</strong>
                  <span className="text-slate-500">{r.title} &bull; {r.billingCycle} &bull; Next: {r.nextRunDate}</span>
                </div>
                <strong className="font-mono text-slate-900">₹{r.baseFee.toLocaleString("en-IN")}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Cards */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-500">Auto-Pricing Rate Cards ({rateCards.length})</h4>
          <form onSubmit={handleSaveRateCard} className="grid grid-cols-3 gap-2 text-xs">
            <select
              value={rcEntityType}
              onChange={(e) => setRcEntityType(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
            >
              <option value="PVT_LTD">Pvt Ltd</option>
              <option value="LLP">LLP</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="PROPRIETORSHIP">Proprietorship</option>
            </select>
            <select
              value={rcCategory}
              onChange={(e) => setRcCategory(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50"
            >
              <option value="GST">GST</option>
              <option value="INCOME_TAX">Income Tax</option>
              <option value="TAX_AUDIT">Tax Audit</option>
              <option value="TDS">TDS</option>
              <option value="ROC_MCA">ROC / MCA</option>
            </select>
            <input
              type="number"
              value={rcFee}
              onChange={(e) => setRcFee(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-mono font-bold"
              required
            />
            <button type="submit" className="col-span-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Save Rate Card Rule
            </button>
          </form>

          <div className="divide-y divide-slate-100 text-xs max-h-56 overflow-y-auto">
            {rateCards.map((rc) => (
              <div key={rc.id} className="py-2 flex items-center justify-between">
                <span>
                  <strong>{rc.entityName || rc.entityType || "All"}</strong> &bull; {rc.serviceCategory} (SAC {rc.sacCode})
                </span>
                <strong className="font-mono">₹{rc.standardFee.toLocaleString("en-IN")}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
