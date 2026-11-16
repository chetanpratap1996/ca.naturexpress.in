"use client";

/**
 * loading.tsx — Client Portal Route Loading
 * Shows while /client page is loading (Suspense fallback for Next.js App Router)
 */
import React from "react";

export default function ClientLoading() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700 tracking-wide">
            Loading Secure Client Portal...
          </span>
        </div>
        <p className="text-[10px] text-slate-400">
          Brains &amp; Taxes • GPA &amp; Co., Chartered Accountants • ICAI FRN: 022998C
        </p>
      </div>
    </div>
  );
}
