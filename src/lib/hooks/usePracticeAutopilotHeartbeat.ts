"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AutopilotExecutionSummary } from "@/lib/automation/practiceAutopilot";
import { practiceSound } from "@/lib/audio/soundEffects";
import { toast } from "@/components/shared/ToastNotification";

const AUTOPILOT_CYCLE_INTERVAL_SECONDS = 180; // 3 minutes background heartbeat

export interface PracticeAutopilotHeartbeatState {
  isAutonomousActive: boolean;
  isSweeping: boolean;
  secondsToNextSweep: number;
  lastSweepSummary: AutopilotExecutionSummary | null;
  triggerImmediateSweep: () => Promise<void>;
  toggleAutonomousMode: () => boolean;
}

export function usePracticeAutopilotHeartbeat(
  enabled: boolean = true,
  onTasksOrInvoicesUpdated?: () => void
): PracticeAutopilotHeartbeatState {
  const [isAutonomousActive, setIsAutonomousActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bt_autopilot_active");
      return saved !== "false"; // Default to active
    }
    return true;
  });

  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [secondsToNextSweep, setSecondsToNextSweep] = useState<number>(AUTOPILOT_CYCLE_INTERVAL_SECONDS);
  const [lastSweepSummary, setLastSweepSummary] = useState<AutopilotExecutionSummary | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const runSweep = useCallback(async (isManual: boolean = false) => {
    if (isSweeping) return;
    setIsSweeping(true);

    try {
      const res = await fetch("/api/firm-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerSource: isManual ? "MANUAL_PULSE" : "BACKGROUND_HEARTBEAT" }),
      });
      const data = await res.json();

      if (data.success && data.summary) {
        setLastSweepSummary(data.summary);
        setSecondsToNextSweep(AUTOPILOT_CYCLE_INTERVAL_SECONDS);

        // If tasks spawned or documents unlocked, play audio chime and notify
        if (data.summary.tasksSpawned > 0 || data.summary.vaultDocsAutoUnlocked > 0) {
          practiceSound.playSuccessChime();
          toast.info(
            "Practice Autopilot Update",
            `Spawned ${data.summary.tasksSpawned} returns • Unlocked ${data.summary.vaultDocsAutoUnlocked} statements.`
          );
        }

        if (onTasksOrInvoicesUpdated) {
          onTasksOrInvoicesUpdated();
        }
      }
    } catch (e) {
      console.warn("Background autopilot heartbeat skipped:", e);
    } finally {
      setIsSweeping(false);
    }
  }, [isSweeping, onTasksOrInvoicesUpdated]);

  // Heartbeat Timer Setup
  useEffect(() => {
    if (!enabled || !isAutonomousActive) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setSecondsToNextSweep((prev) => {
        if (prev <= 1) {
          runSweep(false);
          return AUTOPILOT_CYCLE_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, isAutonomousActive, runSweep]);

  const toggleAutonomousMode = useCallback(() => {
    setIsAutonomousActive((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("bt_autopilot_active", next ? "true" : "false");
      }
      practiceSound.playSoftClick();
      toast.info(
        next ? "Autonomous Autopilot Resumed" : "Autopilot Paused",
        next ? "Background 3-minute self-driving sweeps active." : "System waiting for manual partner approval."
      );
      return next;
    });
    return !isAutonomousActive;
  }, [isAutonomousActive]);

  const triggerImmediateSweep = useCallback(async () => {
    practiceSound.playSoftClick();
    await runSweep(true);
  }, [runSweep]);

  return {
    isAutonomousActive,
    isSweeping,
    secondsToNextSweep,
    lastSweepSummary,
    triggerImmediateSweep,
    toggleAutonomousMode,
  };
}
