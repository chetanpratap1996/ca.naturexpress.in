"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, FilePlus2, RefreshCw, Search } from "lucide-react";
import type { ClientEntity, NoticeRecord } from "@/lib/types";

const statuses: NoticeRecord["status"][] = ["PENDING_TRIAGE", "DRAFTING_RESPONSE", "PARTNER_REVIEW", "SUBMITTED", "CLOSED"];
const authorities: Array<{ value: NoticeRecord["authority"]; label: string }> = [
  { value: "INCOME_TAX", label: "Income Tax" }, { value: "GST_DEPT", label: "GST" },
  { value: "MCA_ROC", label: "MCA / ROC" }, { value: "DGGI", label: "DGGI" },
];
const pretty = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function NoticeRegister({ clients, onRefresh }: { clients: ClientEntity[]; onRefresh: () => Promise<void> }) {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ entityId: "", authority: "INCOME_TAX", section: "", dinNumber: "", issueDate: today(), statutoryDeadline: "", demandAmount: "0", riskLevel: "HIGH", assignedPartner: "", summary: "" });

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/notices", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Notice register unavailable.");
      setNotices(data.notices || []);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Notice register unavailable."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => ({ open: notices.filter((notice) => notice.status !== "CLOSED" && notice.status !== "SUBMITTED").length, overdue: notices.filter((notice) => notice.status !== "CLOSED" && notice.status !== "SUBMITTED" && notice.daysRemaining < 0).length }), [notices]);
  const filtered = useMemo(() => notices.filter((notice) => `${notice.entityName} ${notice.section} ${notice.dinNumber} ${notice.summary}`.toLowerCase().includes(query.toLowerCase())), [notices, query]);

  async function create(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, demandAmount: Number(form.demandAmount) }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Notice could not be saved.");
      setForm({ ...form, section: "", dinNumber: "", statutoryDeadline: "", demandAmount: "0", summary: "" });
      await load(); await onRefresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Notice could not be saved."); }
    finally { setSaving(false); }
  }

  async function updateStatus(notice: NoticeRecord, status: NoticeRecord["status"]) {
    setError("");
    try {
      const response = await fetch("/api/notices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ noticeId: notice.id, status }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Status could not be saved.");
      await load(); await onRefresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Status could not be saved."); }
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
  return <section className="space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[.14em] text-indigo-700">Phase 4 · Notice control</p><h1 className="mt-1 text-2xl font-black text-slate-950">Notice register</h1><p className="mt-1 max-w-2xl text-sm text-slate-600">A firm-maintained register for deadlines, ownership and response stages. Enter details from the notice received by your team.</p></div>
      <button onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"><RefreshCw className="h-4 w-4"/>Refresh</button>
    </header>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">Total recorded</p><p className="mt-1 text-2xl font-black">{notices.length}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">Open response work</p><p className="mt-1 text-2xl font-black">{counts.open}</p></div>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="inline-flex items-center gap-1 text-xs font-bold text-red-700"><AlertTriangle className="h-3.5 w-3.5"/>Past statutory deadline</p><p className="mt-1 text-2xl font-black text-red-800">{counts.overdue}</p></div>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}
    <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2"><FilePlus2 className="h-5 w-5 text-indigo-600"/><h2 className="font-black">Log a notice received</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-bold text-slate-600">Client entity<select required className={`${inputClass} mt-1`} value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })}><option value="">Select entity</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">Authority<select className={`${inputClass} mt-1`} value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })}>{authorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">Notice section / form<input required maxLength={80} className={`${inputClass} mt-1`} placeholder="e.g. Section 142(1), ASMT-10" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}/></label>
        <label className="text-xs font-bold text-slate-600">DIN / reference number<input maxLength={100} className={`${inputClass} mt-1`} value={form.dinNumber} onChange={(e) => setForm({ ...form, dinNumber: e.target.value })}/></label>
        <label className="text-xs font-bold text-slate-600">Issue date<input required type="date" className={`${inputClass} mt-1`} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })}/></label>
        <label className="text-xs font-bold text-slate-600">Statutory deadline<input required type="date" className={`${inputClass} mt-1`} value={form.statutoryDeadline} onChange={(e) => setForm({ ...form, statutoryDeadline: e.target.value })}/></label>
        <label className="text-xs font-bold text-slate-600">Demand amount (₹)<input type="number" min="0" step="0.01" className={`${inputClass} mt-1`} value={form.demandAmount} onChange={(e) => setForm({ ...form, demandAmount: e.target.value })}/></label>
        <label className="text-xs font-bold text-slate-600">Risk level<select className={`${inputClass} mt-1`} value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option></select></label>
        <label className="text-xs font-bold text-slate-600">Responsible partner<input required maxLength={100} className={`${inputClass} mt-1`} value={form.assignedPartner} onChange={(e) => setForm({ ...form, assignedPartner: e.target.value })}/></label>
        <label className="text-xs font-bold text-slate-600 sm:col-span-2 lg:col-span-3">Internal summary<textarea required maxLength={1500} rows={2} className={`${inputClass} mt-1`} placeholder="Short factual summary for the team. Avoid entering credentials or unnecessary sensitive data." value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}/></label>
      </div>
      <button disabled={saving || clients.length === 0} className="mt-4 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save notice"}</button>
      {clients.length === 0 && <p className="mt-2 text-xs text-amber-800">Add a client entity before logging a notice.</p>}
    </form>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-black">Response queue</h2><label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input aria-label="Search notices" className="min-h-10 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm sm:w-64" placeholder="Search client or notice" value={query} onChange={(e) => setQuery(e.target.value)}/></label></div>
      {loading ? <p className="p-6 text-sm text-slate-500">Loading register…</p> : filtered.length === 0 ? <p className="p-6 text-sm text-slate-500">{notices.length ? "No notices match your search." : "No notices recorded yet. Log one above to start the response queue."}</p> : <div className="divide-y divide-slate-100">{filtered.map((notice) => <article key={notice.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{notice.entityName} · {notice.section}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${notice.riskLevel === "CRITICAL" ? "bg-red-100 text-red-800" : notice.riskLevel === "HIGH" ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-700"}`}>{pretty(notice.riskLevel)}</span></div><p className="mt-1 text-sm text-slate-600">{authorities.find((item) => item.value === notice.authority)?.label} · Owner: {notice.assignedPartner}{notice.dinNumber ? ` · Ref: ${notice.dinNumber}` : ""}</p><p className="mt-1 line-clamp-2 text-sm text-slate-700">{notice.summary}</p><p className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${notice.daysRemaining < 0 && notice.status !== "CLOSED" && notice.status !== "SUBMITTED" ? "text-red-700" : "text-slate-500"}`}><CalendarClock className="h-3.5 w-3.5"/>Due {notice.statutoryDeadline} · {notice.daysRemaining < 0 ? `${Math.abs(notice.daysRemaining)} days overdue` : notice.daysRemaining === 0 ? "Due today" : `${notice.daysRemaining} days left`}</p></div>
        <label className="text-xs font-bold text-slate-500">Response stage<select aria-label={`Response stage for ${notice.entityName} ${notice.section}`} className={`${inputClass} mt-1`} value={notice.status} onChange={(e) => void updateStatus(notice, e.target.value as NoticeRecord["status"])}>{statuses.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select></label>
      </article>)}</div>}
    </div>
    <p className="text-xs leading-relaxed text-slate-500">Dates and details are entered by your firm and are not verified against government portals. This register does not prepare, sign or submit responses. Keep the original notice and independently confirm the applicable deadline.</p>
  </section>;
}
