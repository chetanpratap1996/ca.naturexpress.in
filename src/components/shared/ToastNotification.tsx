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
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
              isSuccess
                ? "bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/20"
                : isInfo
                ? "bg-slate-900/95 text-white border-indigo-500/40 shadow-indigo-950/20"
                : isWarning
                ? "bg-amber-950/95 text-amber-50 border-amber-500/50 shadow-amber-950/30"
                : "bg-rose-950/95 text-rose-50 border-rose-500/50 shadow-rose-950/30"
            }`}
          >
            {/* Type Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && (
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {isInfo && (
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Info className="w-4 h-4" />
                </div>
              )}
              {isWarning && (
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {isError && (
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <XCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-black tracking-tight text-white line-clamp-1">
                  {item.title}
                </p>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">
                  Just now
                </span>
              </div>
              {item.message && (
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5 leading-relaxed break-words">
                  {item.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition mt-0.5"
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
