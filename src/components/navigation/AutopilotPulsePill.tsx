"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePracticeAutopilotHeartbeat } from "@/lib/hooks/usePracticeAutopilotHeartbeat";
import { practiceSound } from "@/lib/audio/soundEffects";
import { formatCurrencyINR } from "@/lib/utils";
import {
  Zap,
  RotateCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Volume2,
  VolumeX,
  X,
  ShieldCheck,
  ChevronDown,
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
  const [isMuted, setIsMuted] = useState(() => practiceSound.getMuted());
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

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = practiceSound.toggleMuted();
    setIsMuted(muted);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Living Pulse Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition shadow-xs ${
          isSweeping
            ? "bg-red-50 text-red-700 border-red-300"
            : isAutonomousActive
            ? "bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 border-emerald-300/80"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
        }`}
        title="Practice Autopilot Engine Status"
      >
        <span className="relative flex h-2 w-2">
          {isAutonomousActive && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSweeping ? "bg-red-500" : "bg-emerald-500"}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isSweeping ? "bg-red-600" : isAutonomousActive ? "bg-emerald-600" : "bg-slate-400"}`} />
        </span>

        <span className="hidden sm:inline font-bold">
          {isSweeping ? "Sweeping Practice..." : isAutonomousActive ? "Autopilot" : "Autopilot Paused"}
        </span>

        <span className="font-mono text-[11px] text-slate-500 font-bold hidden md:inline">
          {isAutonomousActive && !isSweeping ? formatTime(secondsToNextSweep) : ""}
        </span>

        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50 text-slate-900 space-y-3.5 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-600" />
              <span className="font-black text-xs uppercase tracking-wide">
                Practice Autopilot Kernel
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleSound}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                title={isMuted ? "Unmute Sound Feedback" : "Mute Sound Feedback"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toggle Autonomous Mode */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <span className="text-xs font-bold block text-slate-900">Autonomous Background Sweeps</span>
              <span className="text-[10px] text-slate-500 block">Runs every 3 mins in background</span>
            </div>
            <button
              onClick={() => toggleAutonomousMode()}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                isAutonomousActive ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Sweep Summary Metrics */}
          {lastSweepSummary ? (
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Last Sweep Summary ({lastSweepSummary.executionDurationMs}ms)
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Tasks Created</span>
                  <span className="font-bold text-slate-900">+{lastSweepSummary.tasksSpawned}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 block">Docs Unlocked</span>
                  <span className="font-bold text-emerald-700">+{lastSweepSummary.vaultDocsAutoUnlocked}</span>
                </div>
                <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-slate-500 block">Penalty Exposure</span>
                  <span className="font-bold text-red-700">{formatCurrencyINR(lastSweepSummary.totalLateFeeAudited)}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Invoices Drafted</span>
                  <span className="font-bold text-slate-900">+{lastSweepSummary.autoInvoicesDrafted}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-2">
              Next scheduled background sweep in <strong>{formatTime(secondsToNextSweep)}</strong>.
            </div>
          )}

          {/* 1-Click Trigger */}
          <button
            onClick={async () => {
              await triggerImmediateSweep();
            }}
            disabled={isSweeping}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSweeping ? "animate-spin" : ""}`} />
            {isSweeping ? "Running Sweep..." : "Trigger Immediate Sweep"}
          </button>
        </div>
      )}
    </div>
  );
}
