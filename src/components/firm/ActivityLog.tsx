"use client";

import React, { useMemo, useState } from "react";
import { Download, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { AuditTrailLog } from "@/lib/types";

const CATEGORIES: Array<"ALL" | AuditTrailLog["category"]> = [
  "ALL", "SECURITY", "DOCUMENT", "COMPLIANCE", "INVOICE", "UDIN", "WHATSAPP", "PEER_REVIEW", "PAY_RELEASE", "SYSTEM",
];

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function ActivityLog({
  entries,
  onRefresh,
}: {
  entries: AuditTrailLog[];
  onRefresh: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportWorkspace = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setRefreshError(null);
    try {
      const response = await fetch("/api/data/export", { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Export could not be downloaded.");
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition") || "";
      const filename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || "brains-taxes-workspace-export.json";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      await onRefresh();
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Export could not be downloaded. Try again shortly.");
    } finally {
      setIsExporting(false);
    }
  };

  const visibleEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (category !== "ALL" && entry.category !== category) return false;
      if (!needle) return true;
      return [entry.actorName, entry.actorRole, entry.entityName, entry.action, entry.details, entry.category]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [entries, search, category]);

  const refresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      await onRefresh();
    } catch {
      setRefreshError("Activity could not be refreshed. Try again shortly.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="activity-log-title">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <h2 id="activity-log-title" className="text-xl font-bold text-slate-900">Firm activity log</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">Recent workspace actions, client account changes, and document access events. Exports include core records and document metadata, not file contents or credentials.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void exportWorkspace()} disabled={isExporting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Download className="h-4 w-4" />{isExporting ? "Preparing export…" : "Export firm records"}
          </button>
          <button type="button" onClick={() => void refresh()} disabled={isRefreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Search firm activity</span>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search person, entity, action, or detail" className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])} className="rounded-xl border border-slate-300 bg-white px-3 py-2">
            {CATEGORIES.map((value) => <option key={value} value={value}>{value === "ALL" ? "All activity" : value.replace(/_/g, " ")}</option>)}
          </select>
        </label>
      </div>

      {refreshError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{refreshError}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          {visibleEntries.length} event{visibleEntries.length === 1 ? "" : "s"} shown from the most recent {entries.length} records
        </div>
        {visibleEntries.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{entries.length ? "No activity matches these filters." : "No firm activity has been recorded yet."}</p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {visibleEntries.map((entry) => (
              <li key={entry.id} className="grid gap-2 p-4 sm:grid-cols-[160px_1fr] sm:gap-4">
                <time dateTime={entry.timestamp} className="text-xs text-slate-500">{formatTimestamp(entry.timestamp)}</time>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{entry.action}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">{entry.category.replace(/_/g, " ")}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{entry.actorName} · {entry.actorRole} · {entry.entityName}</p>
                  <p className="mt-1 break-words text-sm text-slate-700">{entry.details}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
