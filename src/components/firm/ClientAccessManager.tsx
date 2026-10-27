"use client";

import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { UserPlus, UserRoundMinus, RefreshCw, ShieldCheck } from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";

type ClientAccessUser = {
  id: string;
  email: string;
  name: string;
  role: "CLIENT_PROMOTER" | "CLIENT_ACCOUNTANT";
  isActive: boolean;
  entities: Array<{ id: string; name: string }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ClientAccessManager({ clients }: { clients: ClientEntity[] }) {
  const assignableClients = clients.filter((client) => UUID.test(client.id) && UUID.test(client.groupId));
  const legacyClientCount = clients.length - assignableClients.length;
  const [users, setUsers] = useState<ClientAccessUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<ClientAccessUser["role"]>("CLIENT_PROMOTER");
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/client-access", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Client access records could not be loaded.");
      setUsers(result.users || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Client access records could not be loaded.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !entityIds.length) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/client-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, role, entityIds }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Client access could not be saved.");
      toast.success(result.invitationSent ? "Invitation email sent" : "Entity access updated", result.message || `${email.trim()} can sign in after accepting the invitation.`);
      setName(""); setEmail(""); setPhone(""); setEntityIds([]); setRole("CLIENT_PROMOTER");
      await refresh();
    } catch (error) {
      toast.error("Client access not saved", error instanceof Error ? error.message : "Refresh and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const revoke = async (user: ClientAccessUser, entity: { id: string; name: string }) => {
    if (!window.confirm(`Remove ${user.email} from ${entity.name}?`)) return;
    try {
      const response = await fetch("/api/client-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, entityId: entity.id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Entity access could not be revoked.");
      toast.success(result.accountDeactivated ? "Client account deactivated" : "Entity access revoked", result.accountDeactivated ? "The account has no remaining entity assignments and can no longer access this workspace." : `${entity.name} was removed from this account.`);
      await refresh();
    } catch (error) {
      toast.error("Access not revoked", error instanceof Error ? error.message : "Refresh and try again.");
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Client account access</h2>
          <p className="mt-1 text-sm text-slate-600">Invite client users by email and grant access only to selected legal entities.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      <div role="status" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Client accounts can view assigned filing progress and firm-shared documents, and upload source records for review. Payment-reference submission is not enabled yet.
      </div>
      {errorMessage && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{errorMessage}</div>}

      <form onSubmit={(event) => void submit(event)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Client user name
          <input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Invitation email
          <input required type="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Phone (optional)
          <input type="tel" maxLength={24} value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Client role
          <select value={role} onChange={(event) => setRole(event.target.value as ClientAccessUser["role"])} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2">
            <option value="CLIENT_PROMOTER">Promoter / authorized signatory</option>
            <option value="CLIENT_ACCOUNTANT">Client accountant</option>
          </select>
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-semibold text-slate-700">Entity access</legend>
          {legacyClientCount > 0 && <p className="mt-2 text-sm text-amber-800">{legacyClientCount} legacy entity record(s) have identifiers that are not ready for secure portal assignment. Migrate those records before granting access.</p>}
          {assignableClients.length === 0 ? <p className="mt-2 text-sm text-amber-800">Create a new client entity before assigning portal access.</p> : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {assignableClients.map((client) => <label key={client.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                <input type="checkbox" checked={entityIds.includes(client.id)} onChange={(event) => setEntityIds((current) => event.target.checked ? [...current, client.id] : current.filter((id) => id !== client.id))} />
                <span>{client.name}<span className="ml-2 text-xs text-slate-500">{client.pan}</span></span>
              </label>)}
            </div>
          )}
        </fieldset>
        <div className="md:col-span-2">
          <button type="submit" disabled={!assignableClients.length || !entityIds.length || isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <UserPlus className="h-4 w-4" />{isSubmitting ? "Sending invitation…" : "Invite and assign access"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 font-bold text-slate-800">Client accounts ({users.length})</div>
        {isLoading ? <p className="p-5 text-sm text-slate-500">Loading access assignments…</p> : users.length === 0 ? <p className="p-5 text-sm text-slate-500">No client portal accounts have been assigned yet.</p> : users.map((user) => (
          <article key={user.id} className="border-b border-slate-100 p-4 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{user.name} <span className="text-xs font-normal text-slate-500">· {user.email}</span></p>
                <p className="mt-1 text-xs text-slate-500">{user.role === "CLIENT_PROMOTER" ? "Promoter / authorized signatory" : "Client accountant"} · {user.isActive ? "Active" : "Inactive"}</p>
              </div>
              <ShieldCheck className={`h-5 w-5 ${user.isActive ? "text-emerald-600" : "text-slate-400"}`} aria-label={user.isActive ? "Active" : "Inactive"} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.entities.length === 0 ? <span className="text-xs text-rose-700">No active entity assignments</span> : user.entities.map((entity) => <span key={entity.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-xs text-slate-700">
                {entity.name}
                <button type="button" aria-label={`Revoke ${entity.name} access from ${user.email}`} onClick={() => void revoke(user, entity)} className="rounded-full p-1 text-slate-500 hover:bg-rose-100 hover:text-rose-700"><UserRoundMinus className="h-3.5 w-3.5" /></button>
              </span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
