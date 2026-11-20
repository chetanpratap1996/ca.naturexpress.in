"use client";

import React, { useEffect } from "react";
import {
  Keyboard,
  X,
  Command,
  Search,
  LayoutDashboard,
  Calendar,
  DollarSign,
  MessageSquare,
  FileSpreadsheet,
  Users,
  Zap,
} from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

interface ShortcutItem {
  key: string;
  desc: string;
  tab?: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

export function KeyboardShortcutsModal({ isOpen, onClose, onNavigate }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: "Global Commands",
      shortcuts: [
        { key: "⌘ K", desc: "Universal Search & Command Palette" },
        { key: "⌘ M", desc: "6-Column Mega Menu & App Launcher" },
        { key: "⌘ H", desc: "Jump to Executive Dashboard" },
        { key: "?", desc: "Show this Keyboard Shortcuts Sheet" },
        { key: "Esc", desc: "Close any modal or drawer" },
      ],
    },
    {
      title: "Navigation Jumps",
      shortcuts: [
        { key: "G then D", desc: "Go to Executive Dashboard", tab: "dashboard" },
        { key: "G then T", desc: "Go to Statutory Tasks & Calendar", tab: "calendar" },
        { key: "G then B", desc: "Go to Billing, Invoices & Imprest", tab: "billing" },
        { key: "G then W", desc: "Go to WhatsApp Automation Desk", tab: "whatsapp-ai" },
        { key: "G then P", desc: "Go to Bank OCR & Tally XML Parser", tab: "bank-parser" },
        { key: "G then C", desc: "Go to Entity DNA & Client Master", tab: "entity-dna" },
      ],
    },
    {
      title: "Practice Autopilot",
      shortcuts: [
        { key: "Auto", desc: "Autonomous 3-minute background sweeps" },
        { key: "Pill", desc: "Click top-right Autopilot Pulse Pill for immediate sweep" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-500">Superhuman speed for Chartered Accountants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto text-xs pr-1">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                {group.title}
              </div>
              <div className="bg-slate-50 rounded-2xl p-2.5 space-y-1.5 border border-slate-200">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.key}
                    onClick={() => {
                      if (s.tab && onNavigate) {
                        onNavigate(s.tab);
                        onClose();
                      }
                    }}
                    className={`flex items-center justify-between p-1.5 rounded-xl transition ${
                      s.tab ? "hover:bg-white cursor-pointer" : ""
                    }`}
                  >
                    <span className="text-slate-700 font-medium">
                      {s.desc}
                    </span>
                    <kbd className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-mono font-bold text-slate-800 shadow-xs">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
          <span>Press <strong>?</strong> anywhere to open this sheet</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
