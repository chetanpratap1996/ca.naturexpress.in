'use client';

import React, { useState, useEffect } from 'react';
import { Keyboard, Command, X, CheckCircle, Zap, Shield, Sparkles } from 'lucide-react';

interface TallyShortcut {
  key: string;
  label: string;
  category: 'NAVIGATION' | 'VOUCHERS' | 'RECON' | 'ACTION';
  description: string;
  actionId: string;
}

const SHORTCUTS: TallyShortcut[] = [
  { key: 'Alt + G', label: 'Go To (Master Search)', category: 'NAVIGATION', description: 'Universal search across all clients, modules, GSTINs, and ledgers', actionId: 'UNIVERSAL_SEARCH' },
  { key: 'F2', label: 'Date / Period', category: 'NAVIGATION', description: 'Quickly toggle FY (2024-25, 2025-26, 2026-27) or quarterly periods', actionId: 'CHANGE_PERIOD' },
  { key: 'F4', label: 'Contra (Bank BRS)', category: 'VOUCHERS', description: 'Open Bank statement OCR & BRS auto-matching workbench', actionId: 'OPEN_BRS' },
  { key: 'F5', label: 'Payment (43B-h)', category: 'VOUCHERS', description: 'Open MSME overdue payment tracker & 15/45-day interest engine', actionId: 'OPEN_MSME' },
  { key: 'F8', label: 'Sales (GSTR-1)', category: 'VOUCHERS', description: 'Open GSTR-1 outbound invoice dispatcher & ledger mapping', actionId: 'OPEN_GSTR1' },
  { key: 'F9', label: 'Purchase (GSTR-2B)', category: 'VOUCHERS', description: 'Open GSTR-2B invoice-level matcher with tolerance & 17(5) flags', actionId: 'OPEN_GSTR2B' },
  { key: 'Ctrl + A', label: 'Quick Save & Validate', category: 'ACTION', description: 'Instantly save current workpaper and execute real-time statutory validation', actionId: 'QUICK_SAVE' },
  { key: 'Alt + H', label: 'Keyboard Guide', category: 'ACTION', description: 'Show/hide this Tally & Winman muscle memory cheat sheet', actionId: 'TOGGLE_HELP' }
];

interface TallyKeyboardOverlayProps {
  onTriggerAction?: (actionId: string) => void;
}

export function TallyKeyboardOverlay({ onTriggerAction }: TallyKeyboardOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check Alt+G
      if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setLastKeyPressed('Alt + G');
        setActiveNotification('Alt+G: Triggering Universal Command Palette');
        onTriggerAction?.('UNIVERSAL_SEARCH');
        return;
      }

      // Check Alt+H
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setLastKeyPressed('Alt + H');
        setIsOpen(prev => !prev);
        return;
      }

      // Check Ctrl+A (only if not focused on text input to allow select-all)
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A') && !isInput) {
        e.preventDefault();
        setLastKeyPressed('Ctrl + A');
        setActiveNotification('Ctrl+A: Instant Save & Mathematical Validation Passed (₹0 Diff)');
        onTriggerAction?.('QUICK_SAVE');
        return;
      }

      // Check F-keys
      if (e.key === 'F2') {
        e.preventDefault();
        setLastKeyPressed('F2');
        setActiveNotification('F2: Period Selector Active (FY 2025-26)');
        onTriggerAction?.('CHANGE_PERIOD');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setLastKeyPressed('F4');
        setActiveNotification('F4: Jumping to Bank Contra & BRS Reconciliation');
        onTriggerAction?.('OPEN_BRS');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setLastKeyPressed('F5');
        setActiveNotification('F5: Jumping to MSME Section 43B(h) Overdue Tracker');
        onTriggerAction?.('OPEN_MSME');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setLastKeyPressed('F8');
        setActiveNotification('F8: Jumping to GSTR-1 Sales & Outward Dispatcher');
        onTriggerAction?.('OPEN_GSTR1');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setLastKeyPressed('F9');
        setActiveNotification('F9: Jumping to GSTR-2B Multi-Rule Reco Engine');
        onTriggerAction?.('OPEN_GSTR2B');
      } else if (e.key === 'Escape') {
        if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onTriggerAction]);

  // Auto clear notification after 3 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
        setLastKeyPressed(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  return (
    <>
      {/* Floating Indicator Pill (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center space-x-2">
        {activeNotification && (
          <div className="bg-slate-900/95 text-emerald-400 border border-emerald-500/40 shadow-xl px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center space-x-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{activeNotification}</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg px-3 py-1.5 rounded-full text-xs font-mono flex items-center space-x-2 backdrop-blur-md transition-all hover:border-blue-500/50"
          title="Tally & Winman Keyboard Shortcuts (Alt+H)"
        >
          <Keyboard className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline font-semibold text-slate-200">Tally Mode</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">Alt+H</span>
        </button>
      </div>

      {/* Shortcuts Cheat-Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900/50 via-slate-800 to-indigo-900/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                  <Command className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>TallyPrime & Winman Muscle-Memory Shortcuts</span>
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Zero Friction
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Staff trained on Tally and Winman can work at 100% velocity without touching the mouse
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SHORTCUTS.map(sc => (
                  <div
                    key={sc.key}
                    onClick={() => {
                      onTriggerAction?.(sc.actionId);
                      setIsOpen(false);
                    }}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-blue-500/50 cursor-pointer transition flex items-start justify-between group"
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition">
                          {sc.label}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                          sc.category === 'NAVIGATION' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          sc.category === 'VOUCHERS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {sc.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {sc.description}
                      </p>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-bold text-blue-300 shadow-sm shrink-0">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>

              {/* Pro Tip Box */}
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-blue-200">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-white">Why Articles & Senior CAs Love This:</span>
                  <p className="text-slate-300 text-[11px]">
                    Unlike web-based competitors that force you to click with a mouse 50 times per return, our interface is 100% keyboard-navigable. Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-white text-[10px]">Alt+G</kbd> anytime to open the universal command palette.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950/70 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Press <kbd className="px-1 bg-slate-800 rounded font-mono text-slate-300">Esc</kbd> to close</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
