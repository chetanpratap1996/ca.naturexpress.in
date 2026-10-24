"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Module-level cache so all components share the same captured event
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed)
    const isStandalone = 
      typeof window !== "undefined" && (
        window.matchMedia("(display-mode: standalone)").matches || 
        (window.navigator as any).standalone === true
      );
    
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect OS
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      const isAndroidDevice = /android/.test(ua);
      setIsIOS(isIosDevice);
      setIsAndroid(isAndroidDevice);
    }

    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("ServiceWorker registration error:", err);
        });
      });
    }

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowInstallModal(false);
    };

    const handleExternalTrigger = () => {
      triggerInstall();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("trigger-app-install", handleExternalTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-app-install", handleExternalTrigger);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          setIsInstallable(false);
          setShowInstallModal(false);
          return;
        }
      } catch (err) {
        console.warn("PWA prompt error, falling back to modal:", err);
      }
    }
    // If prompt wasn't available or iOS or already dismissed, show guidance modal
    setShowInstallModal(true);
  }, [deferredPrompt]);

  return {
    isInstalled,
    isInstallable,
    isIOS,
    isAndroid,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  };
}
