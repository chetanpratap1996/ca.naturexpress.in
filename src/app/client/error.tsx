"use client";

/**
 * error.tsx — Client Portal Route Error Boundary
 * Handles errors within /client route segment specifically
 */
import React, { useEffect } from "react";

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[BT Client Portal] Route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full text-center shadow-xl space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-1.5">Client Portal Error</h2>
          <p className="text-xs text-slate-600">
            An error occurred loading the client portal. Your data is safe. Try reloading.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-200 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => { window.location.href = "/client"; }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition"
          >
            Reload Portal
          </button>
        </div>
      </div>
    </div>
  );
}
