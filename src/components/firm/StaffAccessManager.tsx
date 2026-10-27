"use client";

import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, RefreshCw, UserPlus, UserRoundMinus } from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";

type StaffRole = "PAID_CA_MANAGER" | "ARTICLE_TRAINEE";
type StaffUser = { id: string; email: string; name: string; role: StaffRole; isActive: boolean; entities: Array<{ id: string; name: string }> };
type Option = { id: string; name: string };
export function StaffAccessManager() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("ARTICLE_TRAINEE"); const [entityIds, setEntityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { const r = await fetch("/api/staff-access", { cache: "no-store" }); const j = await r.json().catch(() => null); if (!r.ok || !j?.success) throw new Error(j?.error || "Employee access could not be loaded."); setUsers(j.users || []); setOptions(j.entities || []); }
    catch (e) { setError(e instanceof Error ? e.message : "Employee access could not be loaded."); setUsers([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const toggleEntity = (id: string) => setEntityIds(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (submitting || !entityIds.length) return; setSubmitting(true);
    try { const r = await fetch("/api/staff-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, role, entityIds }) }); const j = await r.json().catch(() => null); if (!r.ok || !j?.success) throw new Error(j?.error || "Employee access could not be saved."); toast.success(j.invitationSent ? "Invitation email sent" : "Entity access updated", j.message || `${email.trim()} can sign in after accepting the invitation.`); setName(""); setEmail(""); setPhone(""); setEntityIds([]); await refresh(); }
    catch (e) { toast.error("Employee access not saved", e instanceof Error ? e.message : "Refresh and try again."); }
    finally { setSubmitting(false); }
  };
  const revoke = async (user: StaffUser, entity: Option) => {
    if (!window.confirm(`Remove ${user.email} from ${entity.name}?`)) return;
    try { const r = await fetch("/api/staff-access", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, entityId: entity.id }) }); const j = await r.json().catch(() => null); if (!r.ok || !j?.success) throw new Error(j?.error || "Assignment could not be removed."); toast.success("Entity access revoked", `${entity.name} was removed from ${user.email}.`); await refresh(); }
    catch (e) { toast.error("Access not revoked", e instanceof Error ? e.message : "Refresh and try again."); }
  };
  return <section className="space-y-5">
    <header className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Employee access</h2><p className="mt-1 text-sm text-slate-600">Invite managers and article trainees, then assign only the client entities they work on.</p></div><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh</button></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2">
      <h3 className="flex items-center gap-2 font-bold sm:col-span-2"><UserPlus size={17}/> Invite an employee</h3>
      <label className="text-sm font-medium">Full name<input required maxLength={160} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"/></label>
      <label className="text-sm font-medium">Work email<input required type="email" maxLength={255} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"/></label>
      <label className="text-sm font-medium">Phone (optional)<input type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border p-2.5"/></label>
      <label className="text-sm font-medium">Role<select value={role} onChange={e => setRole(e.target.value as StaffRole)} className="mt-1 w-full rounded-lg border bg-white p-2.5"><option value="ARTICLE_TRAINEE">Article trainee</option><option value="PAID_CA_MANAGER">CA manager</option></select></label>
      <fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-semibold">Assigned client entities</legend>{options.length ? <div className="grid max-h-52 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2">{options.map(entity => <label key={entity.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={entityIds.includes(entity.id)} onChange={() => toggleEntity(entity.id)}/>{entity.name}</label>)}</div> : <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No assignable client entities are available yet.</p>}</fieldset>
      <div className="flex items-center justify-between gap-3 sm:col-span-2"><p className="text-xs text-slate-500">Employees can view tasks and documents for assigned entities. Other staff data stays private.</p><button disabled={submitting || !entityIds.length} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Saving…" : "Save and invite"}</button></div>
    </form>
    <section className="rounded-2xl border bg-white p-4"><h3 className="flex items-center gap-2 font-bold"><BriefcaseBusiness size={17}/> Existing employees</h3>{loading ? <p className="mt-3 text-sm text-slate-600">Loading employee access…</p> : users.length ? <div className="mt-3 divide-y">{users.map(user => <article key={user.id} className="py-3"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold">{user.name || user.email} <span className="ml-1 text-xs font-normal text-slate-500">{user.role === "PAID_CA_MANAGER" ? "CA manager" : "Article trainee"}{!user.isActive ? " · inactive" : ""}</span></p><p className="text-sm text-slate-600">{user.email}</p></div></div><div className="mt-2 flex flex-wrap gap-2">{user.entities.map(entity => <span key={entity.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs">{entity.name}<button aria-label={`Remove ${user.email} from ${entity.name}`} onClick={() => void revoke(user, entity)} className="text-red-700"><UserRoundMinus size={14}/></button></span>)}{!user.entities.length && <span className="text-xs text-amber-800">No assigned entities; no client records are accessible.</span>}</div></article>)}</div> : <p className="mt-3 text-sm text-slate-600">No employee accounts are set up for this firm yet.</p>}</section>
  </section>;
}
