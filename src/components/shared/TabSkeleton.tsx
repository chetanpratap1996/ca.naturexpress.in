"use client";

import React from "react";

/**
 * TabSkeleton.tsx
 * Lightweight placeholder displayed during dynamic on-demand chunk evaluation.
 */
export function TabSkeleton({ title = "Loading Workbench..." }: { title?: string }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-3.5 w-72 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-slate-100 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
              <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-slate-300 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
