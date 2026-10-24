"use client";

import React, { useState } from "react";
import { 
  X, 
  Smartphone, 
  Share, 
  PlusSquare, 
  Download, 
  CheckCircle2, 
  Laptop, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { BtLogo } from "./BtLogo";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS?: boolean;
  isAndroid?: boolean;
  isInstalled?: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isIOS = false,
  isAndroid = false,
  isInstalled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div 
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 text-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <BtLogo size="sm" showTagline={false} />
            <div>
              <h3 className="text-base font-black text-slate-900">Download Brains &amp; Taxes App</h3>
              <p className="text-xs text-slate-500 font-medium">1-Tap Install for Clients &amp; Staff</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status or Success */}
        {isInstalled ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-black text-emerald-900">App Already Installed!</h4>
            <p className="text-xs text-emerald-700 font-medium">
              You can launch Brains &amp; Taxes directly from your home screen or apps menu.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              Continue Working
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Value Proposition */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-btred-logo" />
                <span>Why install the app on your phone?</span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1.5 pl-5 list-disc font-medium">
                <li>Instant 1-tap access to your document vault and receipts</li>
                <li>Live notifications when tax returns and GST are filed</li>
                <li>Upload bank statements and bills directly from your phone camera</li>
                <li>Zero download storage impact &bull; works fast even on slow connections</li>
              </ul>
            </div>

            {/* Platform-Specific Step-by-Step Instructions */}
            {isIOS ? (
              /* Apple iOS Safari Guide */
              <div className="border border-indigo-200 bg-indigo-50/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>How to install on iPhone / iPad:</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-indigo-100">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Tap the Share icon</span> in Safari&apos;s bottom toolbar (the square box with an arrow pointing up <Share className="w-3.5 h-3.5 inline text-indigo-600 -mt-0.5" />).
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-indigo-100">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Scroll down &amp; tap &quot;Add to Home Screen&quot;</span> (<PlusSquare className="w-3.5 h-3.5 inline text-indigo-600 -mt-0.5" />), then tap <strong>Add</strong> in the top right.
                    </div>
                  </div>
                </div>
              </div>
            ) : isAndroid ? (
              /* Android Guide */
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>How to install on Android phone:</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-emerald-100">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs shrink-0">
                      1
                    </div>
                    <div>
                      Tap the <strong>Chrome menu (three dots ⋮)</strong> in the top right corner of your browser.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-emerald-100">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs shrink-0">
                      2
                    </div>
                    <div>
                      Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>. The app icon will appear on your phone right away.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Chrome / Edge Guide */
              <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <Laptop className="w-4 h-4 text-slate-700" />
                  <span>How to install on Computer / Laptop:</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <p>
                    Look at the address bar at the top right of your browser and click the <strong>Install icon <Download className="w-3.5 h-3.5 inline text-btred-logo -mt-0.5" /></strong>, or click the browser menu (⋮) and choose <strong>&quot;Install Brains &amp; Taxes&quot;</strong>.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition shadow-sm"
            >
              Got It, Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
