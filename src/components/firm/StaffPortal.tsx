"use client";

import React, { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AuthUser } from "@/lib/auth/session";
import { LogOut, RefreshCw, Download, Briefcase, CalendarDays, FileText } from "lucide-react";

type Entity = { id: string; name: string; groupName: string; type: string };
type Task = { id: string; entityId: string; entityName: string; title: string; category: string; period: string; dueDate: string; status: string; assignedTo?: string; reviewedBy?: string; missingDocumentsList?: string[] };
type DocumentRow = { id: string; entityId: string; entityName: string; category: string; fileName: string; sizeBytes: number; uploadedAt: string; financialYear: string; reviewStatus: string };
type PortalData = { clients: Entity[]; tasks: Task[]; documents: DocumentRow[] };
const CATEGORIES = ["BANK_STATEMENT", "GST_INVOICES", "TAX_COMPUTATION", "AUDIT_REPORT", "NOTICE_REPLY", "CHALLAN"];

export function StaffPortal({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [data, setData] = useState<PortalData>({ clients: [], tasks: [], documents: [] });
  const [selectedEntity, setSelectedEntity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [downloading, setDownloading] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadEntityId, setUploadEntityId] = useState("");
  const [uploadTaskId, setUploadTaskId] = useState("");
  const [uploadCategory, setUploadCategory] = useState("GST_INVOICES");
  const [financialYear, setFinancialYear] = useState("");
  const [advancingTask, setAdvancingTask] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/staff-portal", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Your assigned work could not be loaded.");
      setData(result.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Your assigned work could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const entities = data.clients;
  const tasks = useMemo(() => data.tasks.filter((t) => selectedEntity === "all" || t.entityId === selectedEntity), [data.tasks, selectedEntity]);
  const documents = useMemo(() => data.documents.filter((d) => selectedEntity === "all" || d.entityId === selectedEntity), [data.documents, selectedEntity]);
  const uploadTasks = useMemo(() => data.tasks.filter((t) => t.entityId === uploadEntityId), [data.tasks, uploadEntityId]);
  const taskChoicesFor = (task: Task) => user.role === "MANAGER"
    ? task.status === "DOCUMENTS_AWAITED" ? [{ status: "IN_PREPARATION", label: "Start preparation" }] : task.status === "IN_PREPARATION" ? [{ status: "MANAGER_REVIEW", label: "Send to manager review" }] : []
    : task.status === "DOCUMENTS_AWAITED" ? [{ status: "IN_PREPARATION", label: "Start preparation" }] : [];
  const advanceTask = async (task: Task, status: string) => {
    setAdvancingTask(task.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/staff-portal/tasks/${encodeURIComponent(task.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Task progress could not be saved.");
      setNotice("Task progress saved and recorded in the firm activity log.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Task progress could not be saved."); }
    finally { setAdvancingTask(""); }
  };
  const submitUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!uploadFile || !uploadEntityId || !financialYear.trim() || uploading) return;
    setUploading(true); setError(""); setNotice("");
    try {
      const form = new FormData(); form.set("file", uploadFile); form.set("entityId", uploadEntityId); form.set("category", uploadCategory); form.set("financialYear", financialYear.trim()); if (uploadTaskId) form.set("taskId", uploadTaskId);
      const response = await fetch("/api/staff-portal/documents", { method: "POST", body: form });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "The document could not be uploaded.");
      setNotice("Document uploaded successfully and sent to the partner review queue.");
      setUploadFile(null); setUploadTaskId(""); setFinancialYear("");
      const input = document.getElementById("staff-document-file") as HTMLInputElement | null; if (input) input.value = "";
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "The document could not be uploaded."); }
    finally { setUploading(false); }
  };
  const download = async (doc: DocumentRow) => {
    setDownloading(doc.id);
    try {
      const response = await fetch(`/api/staff-portal/documents/${encodeURIComponent(doc.id)}/download`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || typeof result.url !== "string") throw new Error(result?.error || "Download link could not be created.");
      window.location.assign(result.url);
    } catch (e) { setError(e instanceof Error ? e.message : "Document download failed."); }
    finally { setDownloading(""); }
  };
  const logout = () => onLogout();
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="sticky top-0 z-10 border-b bg-slate-950 px-4 py-3 text-white"><div className="mx-auto flex max-w-5xl items-center justify-between"><div><p className="font-bold">{user.firmName}</p><p className="text-xs text-slate-300">Assigned employee workspace · {user.role === "MANAGER" ? "Manager" : "Article trainee"}</p></div><button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm"><LogOut size={16}/> Sign out</button></div></header>
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">My assigned work</h1><p className="mt-1 text-sm text-slate-600">Only client entities assigned to your account appear here.</p></div><button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh</button></div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
      {loading ? <p role="status" className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Loading your assigned entities…</p> : entities.length === 0 ? <section className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">No entities assigned</h2><p className="mt-1 text-sm text-slate-600">Ask a firm partner to assign the client entities you work on.</p></section> : <>
        <label className="block text-sm font-semibold">Client entity<select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-3 sm:max-w-md"><option value="all">All assigned entities ({entities.length})</option>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
        <div className="grid gap-4 md:grid-cols-2"><section className="rounded-2xl border bg-white p-4"><h2 className="flex items-center gap-2 font-bold"><CalendarDays size={18}/> Assigned tasks <span className="ml-auto text-sm text-slate-500">{tasks.length}</span></h2>{tasks.length ? <ul className="mt-3 divide-y">{tasks.map(t => <li key={t.id} className="py-3"><p className="font-semibold">{t.title}</p><p className="text-xs text-slate-600">{t.entityName} · {t.period} · Due {t.dueDate || "Not set"}</p>{(t.assignedTo || t.reviewedBy) && <p className="mt-1 text-xs text-slate-600">{t.assignedTo ? `Owner: ${t.assignedTo}` : ""}{t.assignedTo && t.reviewedBy ? " · " : ""}{t.reviewedBy ? `Reviewer: ${t.reviewedBy}` : ""}</p>}<p className="mt-1 text-xs">{t.status.replaceAll("_", " ")}</p>{t.status === "DOCUMENTS_AWAITED" && (t.missingDocumentsList?.length || 0) > 0 && <p className="mt-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Waiting for firm review of: {t.missingDocumentsList?.join(", ")}</p>}{taskChoicesFor(t).map(action => <button key={action.status} onClick={() => void advanceTask(t, action.status)} disabled={advancingTask === t.id || (action.status === "IN_PREPARATION" && (t.missingDocumentsList?.length || 0) > 0)} className="mt-2 rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{advancingTask === t.id ? "Saving…" : action.label}</button>)}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No tasks for this selection.</p>}</section>
          <section className="rounded-2xl border bg-white p-4"><h2 className="flex items-center gap-2 font-bold"><FileText size={18}/> Available documents <span className="ml-auto text-sm text-slate-500">{documents.length}</span></h2><form onSubmit={submitUpload} className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3"><p className="text-sm font-semibold">Upload source documents</p><label className="block text-xs font-medium">Entity<select required value={uploadEntityId} onChange={e => { setUploadEntityId(e.target.value); setUploadTaskId(""); }} className="mt-1 w-full rounded-lg border bg-white p-2"><option value="">Choose entity</option>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label className="block text-xs font-medium">Link to task (optional)<select value={uploadTaskId} onChange={e => setUploadTaskId(e.target.value)} disabled={!uploadEntityId} className="mt-1 w-full rounded-lg border bg-white p-2"><option value="">No task link</option>{uploadTasks.map(t => <option key={t.id} value={t.id}>{t.title} · {t.period}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><label className="block text-xs font-medium">Category<select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2">{CATEGORIES.map(c => <option key={c} value={c}>{c.replaceAll("_", " ")}</option>)}</select></label><label className="block text-xs font-medium">Financial year<input required maxLength={20} placeholder="FY 2025-26" value={financialYear} onChange={e => setFinancialYear(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2"/></label></div><label className="block text-xs font-medium">File (up to 20 MB)<input id="staff-document-file" required type="file" accept=".pdf,.jpg,.jpeg,.png,.txt,.csv,.xls,.xlsx,.doc,.docx" onChange={(e: ChangeEvent<HTMLInputElement>) => setUploadFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs"/></label><button disabled={uploading || !uploadFile || !uploadEntityId} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{uploading ? "Uploading…" : "Upload for partner review"}</button></form>{documents.length ? <ul className="mt-3 divide-y">{documents.map(d => <li key={d.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{d.fileName}</p><p className="text-xs text-slate-600">{d.entityName} · {d.category} · {d.financialYear || "—"} · {d.reviewStatus.replaceAll("_", " ")}</p></div><button onClick={() => void download(d)} disabled={downloading === d.id} aria-label={`Download ${d.fileName}`} className="rounded-lg border p-2 disabled:opacity-50"><Download size={16}/></button></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No documents for this selection.</p>}</section></div>
      </>}
      <p className="flex items-center gap-2 text-xs text-slate-500"><Briefcase size={14}/> Staff can prepare assigned work and submit source documents. Partner sign-off and filing remain partner workflows.</p>
    </div>
  </main>;
}
