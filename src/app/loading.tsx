"use client";

import React from "react";

/**
 * loading.tsx — Enterprise-Grade Instant App Shell Skeleton
 * ────────────────────────────────────────────────────────────
 * Replaces the full-screen blocking modal with an instant, non-blocking
 * App Shell skeleton matching the CA Practice Suite layout.
 *
 * Enterprise Pattern (Linear / Stripe / Vercel):
 * - Top loading progress accent bar.
 * - Instant TopNav outline + Sidebar rail outline.
 * - Smooth content card skeletons so the user never sees a blank screen
 *   or hanging spinner on page refresh.
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Top Enterprise Precision Progress Accent Line */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

      {/* 2. Top Navigation Bar Skeleton */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Firm Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-sm shadow-red-500/20">
            <svg
              width="20"
              height="20"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 8h20M6 14h12M6 20h16M6 26h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-2.5 w-48 bg-slate-100 rounded mt-1 animate-pulse" />
          </div>
        </div>

        {/* Center: Client Context Switcher Skeleton */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div className="h-3 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-2.5 w-16 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Right: Quick Action & Session Badge */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-slate-100 border border-slate-200 rounded-lg animate-pulse" />
          <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </header>

      {/* 3. Master Workspace Flex Layout */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto min-w-0">
        {/* Left Domain Rail Skeleton */}
        <aside className="w-16 md:w-56 bg-white border-r border-slate-200 p-3 flex flex-col gap-2 shrink-0">
          <div className="h-3 w-20 bg-slate-200 rounded mx-2 mb-2 hidden md:block animate-pulse" />
          {[
            { label: "Tasks & Practice", active: false },
            { label: "GST Suite", active: true },
            { label: "Income Tax & Audit", active: false },
            { label: "Notices & UDIN", active: false },
            { label: "Billing & WIP", active: false },
            { label: "Client Master", active: false },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`h-10 rounded-xl px-3 flex items-center gap-3 ${
                item.active
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <div
                className={`w-4 h-4 rounded ${
                  item.active ? "bg-red-500" : "bg-slate-300"
                } animate-pulse shrink-0`}
              />
              <div
                className={`h-3 rounded hidden md:block animate-pulse ${
                  item.active ? "w-24 bg-red-300" : "w-28 bg-slate-200"
                }`}
              />
            </div>
          ))}

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </aside>

        {/* Main Workspace Body Skeleton */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-5 space-y-5">
          {/* Sub-tab Navigation Pill Bar */}
          <div className="flex items-center gap-2 pb-1 overflow-x-hidden">
            <div className="h-8 w-28 bg-red-600 rounded-lg shadow-sm" />
            <div className="h-8 w-32 bg-white border border-slate-200 rounded-lg animate-pulse" />
            <div className="h-8 w-28 bg-white border border-slate-200 rounded-lg animate-pulse" />
            <div className="h-8 w-36 bg-white border border-slate-200 rounded-lg animate-pulse" />
          </div>

          {/* Workbench Header & Stat Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="h-5 w-56 bg-slate-200 rounded animate-pulse" />
                <div className="h-3.5 w-80 bg-slate-100 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-32 bg-slate-100 border border-slate-200 rounded-xl animate-pulse" />
                <div className="h-9 w-28 bg-slate-100 border border-slate-200 rounded-xl animate-pulse" />
              </div>
            </div>

            {/* KPI Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                  <div className="h-2.5 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="h-6 w-28 bg-slate-300 rounded animate-pulse" />
                  <div className="h-2 w-16 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Data Table / Matrix Grid Skeleton */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="h-4 w-44 bg-slate-200 rounded animate-pulse" />
              <div className="h-8 w-60 bg-slate-100 rounded-lg animate-pulse" />
            </div>

            {/* Table Rows Skeleton */}
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="h-14 bg-slate-50/70 border border-slate-100 rounded-xl px-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-40 bg-slate-200 rounded animate-pulse" />
                    <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>

                <div className="hidden sm:block h-3.5 w-28 bg-slate-200 rounded animate-pulse" />
                <div className="hidden md:block h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-7 w-24 bg-slate-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
