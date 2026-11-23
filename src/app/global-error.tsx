"use client";

/**
 * global-error.tsx — Next.js 15 App Router Global Error Boundary
 * ─────────────────────────────────────────────────────────────────
 * This file MUST be a "use client" component.
 * It wraps the entire app including the root layout.
 * Required to include <html> and <body> tags because the layout is unavailable.
 *
 * Triggered when: root layout.tsx itself throws an unrecoverable error.
 * This handles the "invariant expected layout router to be mounted" class of errors
 * at the top of the React tree so they never white-screen for users.
 */

import React from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error?.name === "ChunkLoadError" ||
    error?.message?.includes("Loading chunk") ||
    error?.message?.includes("ChunkLoadError") ||
    error?.message?.includes("_next/static/chunks");

  const handleRetry = () => {
    if (isChunkError) {
      try {
        if ("caches" in window) {
          caches.keys().then((keys) =>
            Promise.all(keys.map((k) => caches.delete(k)))
          );
        }
      } catch {}
      const url = new URL(window.location.href);
      url.searchParams.set("_v", Date.now().toString());
      window.location.replace(url.toString());
    } else {
      reset();
    }
  };
  return (
    <html lang="en">
      <head>
        <title>Portal Error — Brains &amp; Taxes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: #f8fafc;
            color: #0f172a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 1.5rem;
            padding: 2rem;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          }
          .icon-wrap {
            width: 56px; height: 56px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 1rem;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 1.25rem;
          }
          h1 { font-size: 1.125rem; font-weight: 900; margin-bottom: 0.5rem; }
          p { font-size: 0.75rem; color: #64748b; line-height: 1.6; margin-bottom: 1.5rem; }
          .btn {
            display: inline-flex; align-items: center; gap: 0.5rem;
            background: #e52320; color: #fff;
            border: none; border-radius: 0.75rem;
            padding: 0.75rem 1.5rem;
            font-size: 0.8125rem; font-weight: 700;
            cursor: pointer; transition: background 0.15s;
            width: 100%; justify-content: center;
          }
          .btn:hover { background: #b91c1c; }
          .btn-secondary {
            background: #f1f5f9; color: #334155;
            margin-top: 0.75rem;
          }
          .btn-secondary:hover { background: #e2e8f0; }
          .digest { font-size: 0.65rem; color: #94a3b8; margin-top: 1rem; font-family: monospace; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e52320" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
          </div>
          <h1>Portal Session Error</h1>
          <p>
            A critical error occurred in the portal framework. This is usually
            caused by a stale cache or network issue — not a data problem.
            Your compliance data is safe. Click below to reload.
          </p>
          <button className="btn" onClick={handleRetry}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
            {isChunkError ? "Reload Fresh Portal" : "Retry Portal"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              try {
                if ("caches" in window) {
                  caches.keys().then((keys) =>
                    Promise.all(keys.map((k) => caches.delete(k)))
                  );
                }
                localStorage.clear();
                sessionStorage.clear();
              } catch {}
              window.location.replace("/");
            }}
          >
            Clear Cache &amp; Go Home
          </button>
          {error?.digest && (
            <p className="digest">Error ID: {error.digest}</p>
          )}
          <p className="digest" style={{ marginTop: "0.5rem" }}>
            Brains &amp; Taxes Portal • ICAI FRN: 022998C
          </p>
        </div>
      </body>
    </html>
  );
}
