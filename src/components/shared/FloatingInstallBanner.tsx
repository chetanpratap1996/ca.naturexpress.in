"use client";

import React, { useState } from "react";
import { Download, Smartphone, X, Sparkles, CheckCircle2 } from "lucide-react";
import { usePwaInstall } from "./usePwaInstall";
import { InstallAppModal } from "./InstallAppModal";
import { BtLogo } from "./BtLogo";

export const FloatingInstallBanner: React.FC = () => {
  const {
    isInstalled,
    isIOS,
    isAndroid,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = usePwaInstall();

  const [isDismissed, setIsDismissed] = useState(false);

  // If already running standalone or dismissed in current session, hide
  if (isInstalled || isDismissed) {
    return (
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstalled={isInstalled}
      />
    );
  }

  return (
    <>
      {/* Sticky High-Visibility Announcement Bar on Top of Screen */}
      <aside aria-label="App install promotion" className="w-full bg-gradient-to-r from-slate-950 via-btred-900 to-slate-950 text-white border-b-2 border-btred-logo py-2.5 px-3 sm:px-6 shadow-xl sticky top-0 z-50 animate-in slide-in-from-top-4 duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          {/* Left info cluster */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-center sm:text-left">
            <div className="relative shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0 -right-0" />
              <div className="p-1.5 rounded-xl bg-white/10 border border-white/20">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-xs">
              <span className="bg-btred-logo text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                1-Tap Install
              </span>
              <strong className="font-extrabold text-white text-xs sm:text-sm">
                Download Brains &amp; Taxes App
              </strong>
              <span className="text-slate-300 hidden md:inline text-xs">
                &bull; Instant mobile access to tax receipts, document vault &amp; filings
              </span>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={triggerInstall}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 via-btred-logo to-red-600 hover:from-red-500 hover:to-red-500 text-white text-xs font-black px-4 py-1.5 rounded-xl shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App Now</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              title="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Floating Action Button on Bottom Right for Mobile & Desktop */}
      <div className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6 animate-in fade-in zoom-in-95">
        <button
          onClick={triggerInstall}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-2xl border-2 border-btred-logo transition-all hover:scale-105 active:scale-95 text-xs font-black group"
          title="Install Brains & Taxes App in 1 Tap"
        >
          <div className="w-7 h-7 rounded-full bg-btred-logo flex items-center justify-center text-white shrink-0 shadow-md group-hover:rotate-12 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight hidden xs:block">
            <span className="text-[10px] text-emerald-400 block font-bold uppercase tracking-wider">1-Tap Install</span>
            <span className="text-white text-xs">Download App</span>
          </div>
        </button>
      </div>

      {/* Guidance Modal for iOS, Android, and Desktop */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInstalled={isInstalled}
      />
    </>
  );
};
