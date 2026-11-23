"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePracticeAutopilotHeartbeat } from "@/lib/hooks/usePracticeAutopilotHeartbeat";
import { formatCurrencyINR } from "@/lib/utils";
import {
  RotateCw,
  X,
  ChevronDown,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface AutopilotPulsePillProps {
  onRefreshData?: () => void;
}

export function AutopilotPulsePill({ onRefreshData }: AutopilotPulsePillProps) {
  const {
    isAutonomousActive,
    isSweeping,
    secondsToNextSweep,
    lastSweepSummary,
    triggerImmediateSweep,
    toggleAutonomousMode,
  } = usePracticeAutopilotHeartbeat(true, onRefreshData);

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Format seconds mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Close popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Living Pulse Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition shadow-xs ${
          isSweeping
            ? "bg-slate-100 text-slate-700 border-slate-300"
            : isAutonomousActive
            ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            : "bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200"
        }`}
        title="Practice Autopilot Status"
      >
        {isSweeping ? (
          <RotateCw className="w-3 h-3 text-slate-600 animate-spin" />
        ) : (
          <span className="relative flex h-2 w-2">
            {isAutonomousActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-emerald-400" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isAutonomousActive ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
          </span>
        )}

        <span className="font-semibold text-slate-800">
          {isSweeping ? "Syncing..." : "Autopilot"}
        </span>

        {isAutonomousActive && !isSweeping && (
          <span className="font-mono text-[11px] text-slate-400 font-medium hidden md:inline">
            {formatTime(secondsToNextSweep)}
          </span>
        )}

        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50 text-slate-900 space-y-3.5 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900">
                Practice Autopilot
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isAutonomousActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {isAutonomousActive ? "Active" : "Paused"}
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Autonomous Mode */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold block text-slate-900">
                Background Sync & Rebalance
              </span>
              <span className="text-[10px] text-slate-500 block">
                Runs automatically every 3 mins
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleAutonomousMode()}
              className={`w-10 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                isAutonomousActive ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* Status & Summary */}
          {lastSweepSummary ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Last run completed ({lastSweepSummary.executionDurationMs}ms)</span>
                <span className="font-mono">Next: {formatTime(secondsToNextSweep)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium pt-1 border-t border-slate-200/60">
                <div>• {lastSweepSummary.tasksSpawned} returns synced</div>
                <div>• {lastSweepSummary.vaultDocsAutoUnlocked} docs unlocked</div>
                <div>• {lastSweepSummary.autoInvoicesDrafted} invoices drafted</div>
                <div>• {formatCurrencyINR(lastSweepSummary.totalLateFeeAudited)} audited</div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" /> Next scheduled sync
              </span>
              <span className="font-mono font-bold text-slate-800">
                {formatTime(secondsToNextSweep)}
              </span>
            </div>
          )}

          {/* 1-Click Sync Button */}
          <button
            onClick={async () => {
              await triggerImmediateSweep();
            }}
            disabled={isSweeping}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSweeping ? "animate-spin" : ""}`} />
            {isSweeping ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      )}
    </div>
  );
}
