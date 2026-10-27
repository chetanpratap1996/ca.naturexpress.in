"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, ClipboardCheck, RefreshCw } from "lucide-react";
import type { PilotMeasureSet, PilotScorecard } from "@/lib/types";

type SetupSignals = { clientEntities: number; ownedTasks: number; tasks: number; uploadedDocuments: number; linkedClientUploads: number; completedTasks: number };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const emptyMeasure = (): PilotMeasureSet => ({ measuredOn: today(), weeklyChasingHours: null, medianMinutesPerTask: null, overdueTasks: null, activePilotClients: null, notes: "" });
const metrics = [
  { key: "weeklyChasingHours", label: "Hours spent chasing clients each week", unit: "hours", decimal: true },
  { key: "medianMinutesPerTask", label: "Typical minutes per compliance task", unit: "minutes", decimal: true },
  { key: "overdueTasks", label: "Overdue open tasks", unit: "tasks", decimal: false },
  { key: "activePilotClients", label: "Clients included in this pilot", unit: "clients", decimal: false },
] as const;
const labels = (n: number, singular: string) => `${n} ${singular}${n === 1 ? "" : "s"}`;

export function PilotScorecard() {
  const [scorecard, setScorecard] = useState<PilotScorecard>({ baseline: null, review: null, updatedAt: null });
  const [setup, setSetup] = useState<SetupSignals>({ clientEntities: 0, ownedTasks: 0, tasks: 0, uploadedDocuments: 0, linkedClientUploads: 0, completedTasks: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"baseline" | "review" | null>(null);
  const [forms, setForms] = useState<{ baseline: PilotMeasureSet; review: PilotMeasureSet }>({ baseline: emptyMeasure(), review: emptyMeasure() });
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/pilot-scorecard", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Pilot data unavailable.");
      const loaded: PilotScorecard = data.scorecard || { baseline: null, review: null, updatedAt: null };
      setScorecard(loaded); setSetup(data.setup);
      setForms({ baseline: loaded.baseline || emptyMeasure(), review: loaded.review || emptyMeasure() });
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Pilot data unavailable."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const checklist = useMemo(() => [
    { label: "Client entities entered", done: setup.clientEntities > 0, value: labels(setup.clientEntities, "entity") },
    { label: "Compliance work entered", done: setup.tasks > 0, value: labels(setup.tasks, "task") },
    { label: "Tasks have an owner", done: setup.tasks > 0 && setup.ownedTasks === setup.tasks, value: `${setup.ownedTasks} of ${setup.tasks} tasks` },
    { label: "Client documents received", done: setup.uploadedDocuments > 0, value: labels(setup.uploadedDocuments, "document") },
    { label: "Client uploads linked to a task", done: setup.linkedClientUploads > 0, value: labels(setup.linkedClientUploads, "linked upload") },
    { label: "A task completed in the workspace", done: setup.completedTasks > 0, value: labels(setup.completedTasks, "completed task") },
  ], [setup]);

  async function save(period: "baseline" | "review") {
    setSaving(period); setMessage("");
    try {
      const response = await fetch("/api/pilot-scorecard", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period, measure: forms[period] }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Scorecard could not be saved.");
      setScorecard(data.scorecard); setMessage(`${period === "baseline" ? "Baseline" : "Review"} saved.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Scorecard could not be saved."); }
    finally { setSaving(null); }
  }

  function setField(period: "baseline" | "review", key: keyof PilotMeasureSet, value: string) {
    setForms((current) => ({ ...current, [period]: { ...current[period], [key]: key === "notes" || key === "measuredOn" ? value : value === "" ? null : Number(value) } }));
  }

  const input = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
  return <section className="space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-indigo-700">Phase 5 · Pilot proof</p><h1 className="mt-1 text-2xl font-black text-slate-950">Pilot readiness &amp; scorecard</h1><p className="mt-1 max-w-2xl text-sm text-slate-600">Check whether the workflow is set up, then record the firm’s own baseline and review measures. The app does not estimate savings or ROI.</p></div><button onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"><RefreshCw className="h-4 w-4"/>Refresh</button></header>
    {message && <div role="status" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}
    <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-indigo-600"/><h2 className="font-black">Live setup checklist</h2></div><p className="mt-1 text-xs text-slate-500">Signals are derived from data in this firm workspace.</p><ul className="mt-4 space-y-3">{checklist.map((item) => <li key={item.label} className="flex items-start gap-3"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${item.done ? "text-emerald-600" : "text-slate-300"}`}/><span className="flex-1 text-sm font-semibold text-slate-800">{item.label}</span><span className="text-right text-xs text-slate-500">{item.value}</span></li>)}</ul><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">Setup completion shows that records exist; it does not confirm that client access, staff training, deadlines or source documents are correct. Validate those with the pilot team.</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-indigo-600"/><h2 className="font-black">Measure actual operating change</h2></div><p className="mt-1 text-xs text-slate-500">Use the same clients, work types and measurement method for both periods.</p><div className="mt-4 grid gap-4 md:grid-cols-2">{(["baseline", "review"] as const).map((period) => <div key={period} className="rounded-xl border border-slate-200 p-3"><h3 className="font-black capitalize">{period === "baseline" ? "Before pilot" : "Pilot review"}</h3><label className="mt-3 block text-xs font-bold text-slate-600">Measured on<input required type="date" className={input} value={forms[period].measuredOn} onChange={(e) => setField(period, "measuredOn", e.target.value)}/></label>{metrics.map((metric) => <label key={metric.key} className="mt-3 block text-xs font-bold text-slate-600">{metric.label}<div className="relative"><input aria-label={`${period} ${metric.label}`} type="number" min="0" step={metric.decimal ? "0.1" : "1"} className={`${input} pr-16`} value={forms[period][metric.key] ?? ""} placeholder="Not measured" onChange={(e) => setField(period, metric.key, e.target.value)}/><span className="absolute right-3 top-3 text-xs font-medium text-slate-400">{metric.unit}</span></div></label>)}<label className="mt-3 block text-xs font-bold text-slate-600">Notes / measurement method<textarea rows={2} maxLength={1000} className={input} value={forms[period].notes} onChange={(e) => setField(period, "notes", e.target.value)}/></label><button disabled={saving !== null || loading} onClick={() => void save(period)} className="mt-4 min-h-10 w-full rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50">{saving === period ? "Saving…" : `Save ${period}`}</button></div>)}</div>
      </section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><h2 className="font-black">Observed comparison</h2>{scorecard.baseline && scorecard.review ? <><p className="mt-1 text-xs text-slate-500">Based on manually entered values dated {scorecard.baseline.measuredOn} and {scorecard.review.measuredOn}. A negative difference is lower than baseline.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => { const before = scorecard.baseline?.[metric.key]; const after = scorecard.review?.[metric.key]; const delta = before !== null && before !== undefined && after !== null && after !== undefined ? after - before : null; return <div key={metric.key} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">{metric.label}</p><p className="mt-2 text-sm font-semibold">{before ?? "—"} → {after ?? "—"} {metric.unit}</p><p className="mt-1 text-xs text-slate-500">{delta === null ? "Both periods need a value" : `Change: ${delta > 0 ? "+" : ""}${Number(delta.toFixed(1))} ${metric.unit}`}</p></div>; })}</div></> : <p className="mt-2 text-sm text-slate-500">Save both periods with values to see a direct comparison. Blank measures stay blank; no savings, adoption or ROI figures are inferred.</p>}</section>
    {loading && <p className="text-xs text-slate-500">Refreshing pilot data…</p>}
  </section>;
}
