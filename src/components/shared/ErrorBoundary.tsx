"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ChunkLoadError Detection Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect if an error is a webpack ChunkLoadError (stale chunk after hot-reload
 * or new deployment). These are NEVER real application bugs — they are caused by
 * the browser holding a reference to an old chunk hash that no longer exists on
 * the server. The correct fix is a silent, automatic page reload.
 */
function isChunkLoadError(error: Error | undefined | null): boolean {
  if (!error) return false;
  const name = error.name ?? "";
  const msg = error.message ?? "";
  return (
    name === "ChunkLoadError" ||
    name === "webpack.ChunkLoadError" ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("_next/static/chunks")
  );
}

/**
 * Guard against infinite auto-reload loops (e.g. the chunk genuinely doesn't
 * exist). We allow at most MAX_AUTO_RELOADS within RELOAD_WINDOW_MS before we
 * fall back to showing the UI to the user.
 */
const MAX_AUTO_RELOADS = 3;
const RELOAD_WINDOW_MS = 30_000; // 30 seconds
const RELOAD_COUNTER_KEY = "bt_chunk_reload_count";
const RELOAD_WINDOW_KEY = "bt_chunk_reload_window";

function canAutoReload(): boolean {
  try {
    const now = Date.now();
    const windowStart = parseInt(sessionStorage.getItem(RELOAD_WINDOW_KEY) ?? "0", 10);
    const count = parseInt(sessionStorage.getItem(RELOAD_COUNTER_KEY) ?? "0", 10);

    // Reset window if more than RELOAD_WINDOW_MS has elapsed
    if (now - windowStart > RELOAD_WINDOW_MS) {
      sessionStorage.setItem(RELOAD_WINDOW_KEY, String(now));
      sessionStorage.setItem(RELOAD_COUNTER_KEY, "1");
      return true;
    }

    if (count < MAX_AUTO_RELOADS) {
      sessionStorage.setItem(RELOAD_COUNTER_KEY, String(count + 1));
      return true;
    }

    return false; // Too many reloads — show UI instead
  } catch {
    return true; // sessionStorage unavailable → allow reload
  }
}

function triggerSilentChunkReload(): void {
  if (typeof window === "undefined") return;
  try {
    if ("caches" in window) {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
    }
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("_v", String(Date.now()));
  window.location.replace(url.toString());
}

// ─────────────────────────────────────────────────────────────────────────────
// Props / State
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  autoReloading: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary — Enterprise-grade, ChunkLoadError-aware
// ─────────────────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isChunkError: false,
    autoReloading: false,
    showDetails: false,
  };

  /**
   * getDerivedStateFromError runs synchronously during rendering.
   * We detect ChunkLoadError here and flag it; componentDidCatch then acts.
   */
  public static getDerivedStateFromError(error: Error): Partial<State> {
    const chunkError = isChunkLoadError(error);
    return {
      hasError: true,
      isChunkError: chunkError,
      error,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isChunkLoadError(error)) {
      console.warn(
        "[ErrorBoundary] ChunkLoadError detected — this is a stale chunk hash after a dev " +
        "rebuild or new deployment. Auto-recovering silently.",
        error.message
      );

      if (canAutoReload()) {
        this.setState({ autoReloading: true });
        // Small delay so React has time to commit the state update before unloading
        setTimeout(triggerSilentChunkReload, 300);
      } else {
        // Too many reloads in short window — show UI
        console.error("[ErrorBoundary] ChunkLoadError auto-reload limit reached. Showing UI.", error);
        this.setState({ errorInfo, autoReloading: false });
      }
    } else {
      // Genuine application error — log fully and show recovery UI
      console.error("[ErrorBoundary] Unhandled application error:", error, errorInfo);
      this.setState({ errorInfo });
    }
  }

  public handleReload = () => {
    if (typeof window !== "undefined") {
      // Clear reload counters so a manual reload isn't counted against auto-reload budget
      try {
        sessionStorage.removeItem(RELOAD_COUNTER_KEY);
        sessionStorage.removeItem(RELOAD_WINDOW_KEY);
      } catch { /* ignore */ }
      window.location.reload();
    }
  };

  public handleFullReset = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
        // Unregister Service Worker so stale SW cache is wiped
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((regs) => {
            regs.forEach((reg) => reg.unregister());
          });
        }
        // Clear all caches (CacheStorage)
        if ("caches" in window) {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        }
      } catch (e) {
        console.warn("Storage/SW clear error:", e);
      }
      // Hard navigate to root with cache-bust param
      window.location.href = window.location.origin + "/?_reset=" + Date.now();
    }
  };

  public render() {
    const { hasError, isChunkError, autoReloading, error, errorInfo, showDetails } = this.state;

    if (!hasError) return this.props.children;

    // ── Auto-recovering from ChunkLoadError ───────────────────────────────────
    if (isChunkError && autoReloading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-btred-logo border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-slate-600 font-medium">Refreshing portal… please wait</p>
            <p className="text-xs text-slate-400">A new version is available. Reloading automatically.</p>
          </div>
        </div>
      );
    }

    // ── ChunkLoadError but auto-reload limit reached ──────────────────────────
    if (isChunkError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <RefreshCw className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">Portal Update Available</h2>
              <p className="text-xs text-slate-600">
                A new version of the portal has been deployed. Click below to load the latest version.
              </p>
            </div>
            <button
              onClick={this.handleFullReset}
              className="w-full bg-btred-logo hover:bg-red-700 text-white font-black text-sm px-5 py-3 rounded-xl shadow-md shadow-red-500/25 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Load Latest Version
            </button>
            <p className="text-[10px] text-slate-400">
              This will clear cached files and reload the portal fresh.
            </p>
          </div>
        </div>
      );
    }

    // ── Genuine application error ─────────────────────────────────────────────
    const errorMessage = error?.message || "An unexpected client-side error occurred";
    const errorStack = error?.stack || "";

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-btred-logo flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {this.props.fallbackTitle || "Portal Recovery Mode"}
            </h2>
            <p className="text-xs text-slate-600">
              A client session discrepancy was caught and isolated. You can reload or perform a clean storage reset below.
            </p>
          </div>

          {/* Error Message Box */}
          <div className="bg-red-50/60 border border-red-200 rounded-2xl p-3.5 text-left text-xs font-mono text-btred-logo break-words">
            <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
              Caught Error:
            </span>
            {errorMessage}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Quick Reload
            </button>

            <button
              onClick={this.handleFullReset}
              className="w-full sm:w-auto bg-btred-logo hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-red-500/25 transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Storage &amp; Reset
            </button>
          </div>

          {/* Expandable Technical Details */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => this.setState({ showDetails: !showDetails })}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 transition"
            >
              <span>{showDetails ? "Hide technical details" : "View technical details"}</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDetails && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left overflow-x-auto max-h-48 text-[10px] font-mono text-slate-700 space-y-2">
                <div>
                  <strong className="text-slate-900">Name:</strong> {error?.name}
                </div>
                <div>
                  <strong className="text-slate-900">Message:</strong> {errorMessage}
                </div>
                {errorStack && (
                  <div className="whitespace-pre-wrap text-slate-500">
                    {errorStack}
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div className="whitespace-pre-wrap text-slate-400 mt-2 border-t border-slate-200 pt-2">
                    {errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
