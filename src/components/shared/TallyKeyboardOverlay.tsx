'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Keyboard, Command, X, Zap, Search } from 'lucide-react';
import { useClientContext } from '@/lib/context/ClientContext';

interface TallyShortcut {
  key: string;
  label: string;
  group: 'Navigation' | 'GST Suite' | 'Practice & Tax';
  target: string;
  actionId: string;
}

const SHORTCUTS: TallyShortcut[] = [
  { key: 'Alt + G', label: 'Command Palette', group: 'Navigation', target: 'Jump to any client, GSTIN, or module', actionId: 'UNIVERSAL_SEARCH' },
  { key: 'Alt + C', label: 'Switch Client / GSTIN', group: 'Navigation', target: 'Filter Command Palette to clients', actionId: 'SWITCH_CLIENT' },
  { key: 'Ctrl + M', label: 'App Launcher', group: 'Navigation', target: 'Open 6-column module launcher', actionId: 'OPEN_LAUNCHER' },
  { key: 'Ctrl + H', label: 'Executive Dashboard', group: 'Navigation', target: 'Return to practice overview', actionId: 'OPEN_DASHBOARD' },
  { key: 'F2', label: 'Tasks & Deadlines', group: 'Navigation', target: 'Statutory calendar & due dates', actionId: 'CHANGE_PERIOD' },
  { key: 'Alt + H / ?', label: 'Shortcuts Sheet', group: 'Navigation', target: 'Toggle this overlay', actionId: 'TOGGLE_HELP' },

  { key: 'F4', label: 'Filing Desk', group: 'GST Suite', target: 'GSTR-3B, FY Matrix & Firm Pipeline', actionId: 'OPEN_FILING_DESK' },
  { key: 'F8', label: 'GSTR-1 Outward', group: 'GST Suite', target: 'Sales register, TallyPrime pull & JSON', actionId: 'OPEN_GSTR1' },
  { key: 'F9', label: '2B Matcher', group: 'GST Suite', target: 'GSTR-2B vs Books & Sec 17(5)', actionId: 'OPEN_GSTR2B' },
  { key: 'F5', label: 'IMS Desk', group: 'GST Suite', target: 'Invoice actions & Rule 37A reversals', actionId: 'OPEN_IMS' },
  { key: 'F6', label: 'Annual & Audit', group: 'GST Suite', target: 'GSTR-9 / 9C & DRC-01B / 01C', actionId: 'OPEN_ANNUAL_GST' },
  { key: 'Alt + M', label: 'GSTIN Master', group: 'GST Suite', target: 'Multi-state GSTINs & opening ITC', actionId: 'OPEN_GSTIN_MASTER' },

  { key: 'F7', label: 'Income Tax & 3CD', group: 'Practice & Tax', target: 'ITR & Tax Audit workbench', actionId: 'OPEN_TAX_AUDIT' },
  { key: 'Alt + N', label: 'Notices & UDIN', group: 'Practice & Tax', target: 'Litigation tracker & replies', actionId: 'OPEN_NOTICES' },
];

interface TallyKeyboardOverlayProps {
  onTriggerAction?: (actionId: string) => void;
}

export function TallyKeyboardOverlay({ onTriggerAction }: TallyKeyboardOverlayProps) {
  const { openCommandPalette } = useClientContext();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  const runAction = (sc: TallyShortcut) => {
    if (sc.actionId === 'UNIVERSAL_SEARCH') {
      openCommandPalette('ALL');
    } else if (sc.actionId === 'SWITCH_CLIENT') {
      openCommandPalette('CLIENTS');
    } else if (sc.actionId === 'TOGGLE_HELP') {
      setIsOpen((prev) => !prev);
      return;
    } else {
      onTriggerAction?.(sc.actionId);
    }
    setActiveNotification(`${sc.key} → ${sc.label}`);
  };

  const triggerByActionId = (actionId: string) => {
    const sc = SHORTCUTS.find((s) => s.actionId === actionId);
    if (sc) runAction(sc);
  };

  useEffect(() => {
    const onToggleEvent = () => setIsOpen((prev) => !prev);
    window.addEventListener('bt:toggle-shortcuts', onToggleEvent);
    return () => window.removeEventListener('bt:toggle-shortcuts', onToggleEvent);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag);

      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        triggerByActionId('UNIVERSAL_SEARCH');
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        triggerByActionId('SWITCH_CLIENT');
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        triggerByActionId('OPEN_GSTIN_MASTER');
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        triggerByActionId('OPEN_NOTICES');
        return;
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        return;
      }

      if (isTyping) return;

      const fKeyMap: Record<string, string> = {
        F2: 'CHANGE_PERIOD',
        F4: 'OPEN_FILING_DESK',
        F5: 'OPEN_IMS',
        F6: 'OPEN_ANNUAL_GST',
        F7: 'OPEN_TAX_AUDIT',
        F8: 'OPEN_GSTR1',
        F9: 'OPEN_GSTR2B',
      };
      const mappedAction = fKeyMap[e.key];
      if (mappedAction) {
        e.preventDefault();
        triggerByActionId(mappedAction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onTriggerAction, openCommandPalette]);

  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => setActiveNotification(null), 2200);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  const filteredShortcuts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SHORTCUTS;
    return SHORTCUTS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q) ||
        s.target.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q)
    );
  }, [filter]);

  const groups = ['Navigation', 'GST Suite', 'Practice & Tax'] as const;

  return (
    <>
      {/* Subtle Bottom-Right Trigger */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        {activeNotification && (
          <div className="bg-slate-900 text-white shadow-lg px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{activeNotification}</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition"
          title="Keyboard Shortcuts (Alt+H)"
        >
          <Keyboard className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Shortcuts</span>
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 border border-slate-200">
            Alt+H
          </kbd>
        </button>
      </div>

      {/* Clean Command & Shortcut Sheet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Command className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Filter */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter shortcuts or jump to module..."
                className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Grouped Rows */}
            <div className="p-3 overflow-y-auto max-h-[65vh] space-y-3">
              {groups.map((grp) => {
                const items = filteredShortcuts.filter((s) => s.group === grp);
                if (items.length === 0) return null;
                return (
                  <div key={grp}>
                    <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {grp}
                    </div>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {items.map((sc) => (
                        <button
                          key={sc.key}
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            runAction(sc);
                          }}
                          className="w-full px-3 py-2 bg-white hover:bg-slate-50 flex items-center justify-between text-left transition group"
                        >
                          <div className="min-w-0 pr-3">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">
                              {sc.label}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-2 hidden sm:inline">
                              {sc.target}
                            </span>
                          </div>
                          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-semibold text-slate-700 shrink-0">
                            {sc.key}
                          </kbd>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredShortcuts.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No shortcuts matching &ldquo;{filter}&rdquo;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>Click any row or press its key</span>
              <span>
                <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Esc</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
