"use client";

/**
 * loading.tsx — Next.js 15 App Router Root Loading UI
 * ─────────────────────────────────────────────────────
 * Shown while the root page.tsx (or any child segment) is loading.
 * Prevents blank screen / layout shift during initial navigation.
 * This is CRITICAL for the OuterLayoutRouter to have something to render
 * during Suspense boundaries — prevents the "invariant expected layout router"
 * error class when routes are still loading their async data.
 */

import React from "react";

export default function RootLoading() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        {/* Logo mark */}
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 bg-red-600 rounded-xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 8h20M6 14h12M6 20h16M6 26h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Spinner */}
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700 tracking-wide">
            Loading Secure Portal...
          </span>
        </div>

        <p className="text-[10px] text-slate-400 font-medium">
          Brains &amp; Taxes • GPA &amp; Co., Chartered Accountants
        </p>
      </div>
    </div>
  );
}
