"use client";

/**
 * ChunkErrorRecovery (Zero-FOUC & ChunkLoad-Safe)
 * ───────────────────────────────────────────────
 * This component has ZERO visible UI. It mounts once at the app root and
 * attaches three global listeners:
 *
 *  1. window 'error' (capture phase: true) — catches resource load errors
 *     specifically on <link rel="stylesheet"> and <script> tags when a stale
 *     build chunk (CSS or JS) is rejected by the browser (404 or MIME mismatch).
 *
 *  2. window 'error' (bubble phase) — catches runtime JS errors including
 *     ChunkLoadError thrown by webpack's chunk loader.
 *
 *  3. window 'unhandledrejection' — catches Promise rejections from dynamic
 *     import() calls (async chunk loading).
 *
 * When an asset failure or ChunkLoadError is detected, it purges all CacheStorage
 * caches and performs a throttled hard reload with a cache-buster parameter.
 */

import { useEffect } from "react";

const RELOAD_KEY = "bt_chunk_window_reload";
const MAX_RELOADS = 2;
const WINDOW_MS = 30_000;

function isChunkMessage(msg: string): boolean {
  if (!msg) return false;
  return (
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("_next/static/chunks") ||
    msg.includes("_next/static/css") ||
    msg.includes("ChunkLoadError") ||
    msg.includes("MIME type")
  );
}

function purgeCachesAndReload(reason: string): void {
  try {
    // 1. Purge all Service Worker / CacheStorage caches immediately
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).catch(() => {});
    }

    // 2. Check loop guard
    const raw = sessionStorage.getItem(RELOAD_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0, since: Date.now() };

    if (Date.now() - data.since > WINDOW_MS) {
      data.count = 0;
      data.since = Date.now();
    }

    if (data.count >= MAX_RELOADS) {
      console.warn(`[ChunkErrorRecovery] Max reloads (${MAX_RELOADS}) reached. Reason: ${reason}`);
      return;
    }

    data.count += 1;
    sessionStorage.setItem(RELOAD_KEY, JSON.stringify(data));

    // 3. Hard reload bypassing stale browser cache
    const url = new URL(window.location.href);
    url.searchParams.set("_v", String(Date.now()));
    console.warn(`[ChunkErrorRecovery] Recovering from ${reason}. Reloading (${data.count}/${MAX_RELOADS})...`);
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

export default function ChunkErrorRecovery() {
  useEffect(() => {
    // 1. Capture-phase resource error listener (<link rel="stylesheet"> & <script> load failures)
    const handleCaptureError = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName;
      if (tagName === "LINK") {
        const link = target as HTMLLinkElement;
        const href = link.href || "";
        if (link.rel === "stylesheet" && href.includes("/_next/static/")) {
          console.warn("[ChunkErrorRecovery] Stylesheet failed to load:", href);
          purgeCachesAndReload("CSS_LOAD_FAILURE");
        }
      } else if (tagName === "SCRIPT") {
        const script = target as HTMLScriptElement;
        const src = script.src || "";
        if (src.includes("/_next/static/")) {
          console.warn("[ChunkErrorRecovery] Script chunk failed to load:", src);
          purgeCachesAndReload("SCRIPT_CHUNK_FAILURE");
        }
      }
    };

    // 2. Runtime error listener (ChunkLoadError in execution)
    const handleRuntimeError = (event: ErrorEvent) => {
      const msg = event.message ?? event.error?.message ?? "";
      if (isChunkMessage(msg)) {
        event.preventDefault();
        purgeCachesAndReload("RUNTIME_CHUNK_ERROR");
      }
    };

    // 3. Unhandled promise rejection (dynamic import failure)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        typeof reason === "string"
          ? reason
          : reason?.message ?? reason?.toString() ?? "";
      if (isChunkMessage(msg)) {
        event.preventDefault();
        purgeCachesAndReload("UNHANDLED_PROMISE_CHUNK_REJECTION");
      }
    };

    // Attach listeners
    window.addEventListener("error", handleCaptureError, true); // true = capture phase for resource errors!
    window.addEventListener("error", handleRuntimeError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleCaptureError, true);
      window.removeEventListener("error", handleRuntimeError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
