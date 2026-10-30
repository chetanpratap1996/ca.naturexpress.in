// ============================================================================
// ZERO-COST ENTERPRISE NOTIFICATION & CHIME ENGINE
// Native W3C Web Notifications API + Web Audio Synthesized Chime (0-byte assets)
// ============================================================================

import { NotificationItem, NotificationPreferences } from "./types";

const PREFS_STORAGE_KEY = "bt_notification_preferences";

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  browserPushEnabled: true,
  soundEnabled: true,
  notifyDeadlines: true,
  notifyPayments: true,
  notifyDocuments: true,
  notifyNotices: true,
};

export function getStoredPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: NotificationPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn("Failed to persist notification preferences:", e);
  }
}

/**
 * 100% Free Synthesized Audio Chime using Web Audio API
 * Generates an executive two-tone chime without loading external mp3 assets
 */
export function playNotificationChime(): void {
  if (typeof window === "undefined") return;
  const prefs = getStoredPreferences();
  if (!prefs.soundEnabled) return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Tone 1: 587.33 Hz (D5 note)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2: 880 Hz (A5 harmonic) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (err) {
    // Audio autoplay policy might require first user gesture
    console.debug("AudioContext chime suppressed by browser policy until user interacts.");
  }
}

/**
 * Request Browser Notification Permissions (Free W3C standard)
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Trigger native browser notification if granted
 */
export function showBrowserNotification(item: NotificationItem): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const prefs = getStoredPreferences();
  if (!prefs.browserPushEnabled) return;
  if (Notification.permission !== "granted") return;

  // Filter based on user preferences
  if (item.category === "COMPLIANCE" && !prefs.notifyDeadlines) return;
  if (item.category === "BILLING" && !prefs.notifyPayments) return;
  if (item.category === "DOCUMENT" && !prefs.notifyDocuments) return;
  if (item.category === "NOTICE" && !prefs.notifyNotices) return;

  try {
    const notif = new Notification(item.title, {
      body: item.message,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: item.id,
      data: {
        targetTab: item.targetTab,
        actionUrl: item.actionUrl,
      },
    });

    notif.onclick = () => {
      window.focus();
      if (item.targetTab) {
        window.dispatchEvent(
          new CustomEvent("bt_navigate_tab", { detail: { tab: item.targetTab } })
        );
      }
      notif.close();
    };
  } catch (e) {
    console.debug("Browser Notification constructor failed (expected on some mobile engines):", e);
  }
}

/**
 * Complete Client-Side Notification Dispatcher
 * Plays chime, shows native notification, and dispatches custom event
 */
export function dispatchClientNotification(item: NotificationItem): void {
  playNotificationChime();
  showBrowserNotification(item);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bt_notification_received", { detail: item }));
  }
}
