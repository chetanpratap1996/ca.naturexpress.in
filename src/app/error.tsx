"use client";

/**
 * error.tsx — Next.js 15 App Router Route Segment Error Boundary
 * ─────────────────────────────────────────────────────────────────
 * Triggered when a page or layout within the route segment throws.
 * Does NOT wrap root layout (that's global-error.tsx).
 * Layout and navigation remain functional — only the page content is replaced.
 *
 * Usage: Wrap individual route segment renders. Never call hooks like useRouter
 * here — keep it completely self-contained.
 */

import React, { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for dev visibility. In production, wire this to your error
    // tracking service (e.g. Sentry, LogRocket).
    console.error("[BT Portal] Route segment error:", error);
  }, [error]);

  const isChunkError =
    error?.message?.includes("Loading chunk") ||
    error?.message?.includes("ChunkLoadError") ||
    error?.name === "ChunkLoadError";

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl space-y-5">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <svg
            className="w-7 h-7 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01" />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-slate-900">
            {isChunkError ? "New Version Detected" : "Something Went Wrong"}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isChunkError
              ? "A new version of the portal was deployed. Click below to load the latest version."
              : "An error occurred loading this section. Your data is safe. Try reloading."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          <button
            onClick={() => {
              try {
                if ("caches" in window) {
                  caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
                }
              } catch {}
              const url = new URL(window.location.href);
              url.searchParams.set("_v", String(Date.now()));
              window.location.replace(url.toString());
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isChunkError ? "Load Latest" : "Reload Page"}
          </button>
        </div>

        {error?.digest && (
          <p className="text-[10px] text-slate-400 font-mono">
            Error Ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
