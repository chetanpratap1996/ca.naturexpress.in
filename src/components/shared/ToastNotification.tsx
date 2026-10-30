"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Global Event-based API for dispatching toasts from anywhere
export const toast = {
  show: (type: ToastType, title: string, message?: string, duration = 4000) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("bt-toast-event", {
        detail: {
          id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type,
          title,
          message,
          duration,
        },
      });
      window.dispatchEvent(event);
    }
  },
  success: (title: string, message?: string, duration = 4000) => {
    toast.show("success", title, message, duration);
  },
  info: (title: string, message?: string, duration = 4000) => {
    toast.show("info", title, message, duration);
  },
  warning: (title: string, message?: string, duration = 4500) => {
    toast.show("warning", title, message, duration);
  },
  error: (title: string, message?: string, duration = 5000) => {
    toast.show("error", title, message, duration);
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep at most 5 toasts

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    };

    window.addEventListener("bt-toast-event", handleToastEvent);
    return () => {
      window.removeEventListener("bt-toast-event", handleToastEvent);
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((item) => {
        const isSuccess = item.type === "success";
        const isInfo = item.type === "info";
        const isWarning = item.type === "warning";
        const isError = item.type === "error";

        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in bg-white ${
              isSuccess
                ? "border-emerald-200 border-l-4 border-l-emerald-500 shadow-emerald-950/5"
                : isInfo
                ? "border-slate-200 border-l-4 border-l-btred-logo shadow-slate-950/5"
                : isWarning
                ? "border-amber-200 border-l-4 border-l-amber-500 shadow-amber-950/5"
                : "border-red-200 border-l-4 border-l-red-600 shadow-red-950/5"
            }`}
          >
            {/* Type Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && (
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {isInfo && (
                <div className="w-7 h-7 rounded-xl bg-red-50 text-btred-logo flex items-center justify-center border border-red-200">
                  <Info className="w-4 h-4" />
                </div>
              )}
              {isWarning && (
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {isError && (
                <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                  <XCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-black tracking-tight text-slate-900 line-clamp-1">
                  {item.title}
                </p>
                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider shrink-0">
                  Just now
                </span>
              </div>
              {item.message && (
                <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 leading-relaxed break-words">
                  {item.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-600 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition mt-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
