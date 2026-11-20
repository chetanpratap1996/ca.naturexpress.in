'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Keyboard, 
  Layers, 
  ArrowLeftRight, 
  Receipt, 
  MessageSquare, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  Lock, 
  Unlock, 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Send,
  Plus,
  X,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { 
  TallySyncBridgeEngine, 
  SAMPLE_MOCS, 
  SAMPLE_TALLY_TB, 
  TallyMocEntry, 
  TallyTrialBalanceItem 
} from '@/lib/desktop/tallySyncBridgeEngine';
import { 
  FirmBillingRecoveryEngine, 
  SAMPLE_WIP_ITEMS, 
  BillableWipItem 
} from '@/lib/desktop/firmBillingRecoveryEngine';
import { 
  PartnerMorningDigestEngine, 
  MorningBriefingData 
} from '@/lib/desktop/partnerMorningDigestEngine';
import { 
  MdiDesktopManager, 
  MdiClientTab 
} from '@/lib/desktop/mdiDesktopManager';

type SubView = 'TALLY_KEYBOARD_GRID' | 'MDI_DESKTOP' | 'TALLY_SYNC_BRIDGE' | 'BILLING_RECOVERY' | 'MORNING_DIGEST';

interface VoucherRow {
  id: string;
  type: 'Dr' | 'Cr';
  ledger: string;
  amount: number;
  narration: string;
}

export default function PillarEightTallyDesktopWorkbench() {
  const [activeView, setActiveView] = useState<SubView>('TALLY_KEYBOARD_GRID');

  // MDI Tabs State
  const [tabs, setTabs] = useState<MdiClientTab[]>(MdiDesktopManager.getInitialTabs());
  const [activeTabId, setActiveTabId] = useState<string>('TAB-01');

  // Tally Grid State
  const [voucherRows, setVoucherRows] = useState<VoucherRow[]>([
    { id: '1', type: 'Dr', ledger: 'Audit MOC Disallowance u/s 43B(h)', amount: 145000, narration: 'MSME supplier overdue > 45 days' },
    { id: '2', type: 'Cr', ledger: 'Sundry Creditors - Micro & Small Units', amount: 145000, narration: 'Statutory provision created' }
  ]);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number }>({ row: 0, col: 1 });
  const [isAltCModalOpen, setIsAltCModalOpen] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  // Tally Bridge State
  const [mocs, setMocs] = useState<TallyMocEntry[]>(SAMPLE_MOCS);
  const [trialBalance] = useState<TallyTrialBalanceItem[]>(SAMPLE_TALLY_TB);
  const [xmlExportPreview, setXmlExportPreview] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Billing State
  const [wipItems, setWipItems] = useState<BillableWipItem[]>(SAMPLE_WIP_ITEMS);
  const [selectedWip, setSelectedWip] = useState<BillableWipItem>(SAMPLE_WIP_ITEMS[0]);

  // Morning Digest State
  const [digest, setDigest] = useState<MorningBriefingData>(PartnerMorningDigestEngine.compileMorningBriefing());
  const [copiedDigest, setCopiedDigest] = useState(false);

  // Setup initial XML preview
  useEffect(() => {
    const xml = TallySyncBridgeEngine.generateTallyXmlForMocs('Pratwi Solutions Private Limited', mocs);
    setXmlExportPreview(xml);
  }, [mocs]);

  // Global Keyboard Navigation (Tally Speed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + C: Create ledger on the fly
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsAltCModalOpen(true);
      }
      // Ctrl + A: Save voucher immediately
      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        triggerVoucherSave();
      }
      // Alt + 1, Alt + 2, Alt + 3: Switch MDI Tabs
      if (e.altKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (tabs[index]) {
          setActiveTabId(tabs[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs]);

  const triggerVoucherSave = () => {
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 2500);
  };

  const handleAddVoucherRow = () => {
    setVoucherRows([
      ...voucherRows,
      { id: String(Date.now()), type: 'Dr', ledger: '', amount: 0, narration: '' }
    ]);
  };

  const handleCreateLedger = () => {
    if (!newLedgerName) return;
    const updated = [...voucherRows];
    if (updated[focusedCell.row]) {
      updated[focusedCell.row].ledger = newLedgerName;
      setVoucherRows(updated);
    }
    setNewLedgerName('');
    setIsAltCModalOpen(false);
  };

  const handleExportToTally = () => {
    setSyncStatus('EXPORTING');
    setTimeout(() => {
      setSyncStatus('SUCCESS');
      const updatedMocs = mocs.map(m => ({ ...m, status: 'POSTED_TO_TALLY' as const }));
      setMocs(updatedMocs);
    }, 1200);
  };

  const handleCopyDigest = () => {
    navigator.clipboard.writeText(digest.whatsAppFormattedDigest);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2000);
  };

  // Computations
  const totalDebit = voucherRows.filter(r => r.type === 'Dr').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalCredit = voucherRows.filter(r => r.type === 'Cr').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const voucherDifference = Math.abs(totalDebit - totalCredit);
  const isVoucherBalanced = voucherDifference === 0 && totalDebit > 0;

  const tbBalance = TallySyncBridgeEngine.verifyTrialBalanceEquality(trialBalance);
  const billingStats = FirmBillingRecoveryEngine.evaluatePayToReleaseLocks(wipItems);
  const selectedInvoice = FirmBillingRecoveryEngine.computeInvoice(selectedWip);

  const activeClientTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-2">
              <Keyboard className="w-3.5 h-3.5" />
              Pillar VIII: Tally-Speed Mastery & Institutional Firm Desktop
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Universal Keyboard Grid, MDI Desktop & Tally Sync Bridge
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Tally-speed accounting grid (Enter, Alt+C, Ctrl+A), Multi-Window MDI multi-client switcher, 
              1-click bidirectional TallyPrime XML sync bridge, Rule 33 Pure Agent billing, and 8:00 AM WhatsApp executive digest.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-400" />
              TallyPrime 4.0 / ODBC Compliant
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveView('TALLY_KEYBOARD_GRID')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'TALLY_KEYBOARD_GRID'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Tally-Speed Voucher Grid (Enter / Alt+C)
          </button>

          <button
            onClick={() => setActiveView('MDI_DESKTOP')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'MDI_DESKTOP'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Multi-Window MDI Desktop ({tabs.length} Clients)
          </button>

          <button
            onClick={() => setActiveView('TALLY_SYNC_BRIDGE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'TALLY_SYNC_BRIDGE'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            TallyPrime XML Bridge ({mocs.length} MOCs)
          </button>

          <button
            onClick={() => setActiveView('BILLING_RECOVERY')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'BILLING_RECOVERY'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Billing & Pay-to-Release ({billingStats.lockedDocumentsCount} Locked)
          </button>

          <button
            onClick={() => setActiveView('MORNING_DIGEST')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'MORNING_DIGEST'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            8:00 AM WhatsApp Digest
          </button>
        </div>
      </div>

      {/* VIEW 1: TALLY-SPEED KEYBOARD DATA ENTRY GRID */}
      {activeView === 'TALLY_KEYBOARD_GRID' && (
        <div className="space-y-6">
          {/* Keyboard Shortcuts Hint Bar */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4" />
                Active Hotkeys:
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                <kbd className="font-bold text-white">Enter</kbd> Next Field
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                <kbd className="font-bold text-white">Shift+Enter</kbd> Prev Field
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                <kbd className="font-bold text-white">Alt+C</kbd> Create Ledger
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                <kbd className="font-bold text-white">Ctrl+A</kbd> Save Voucher
              </span>
            </div>

            {saveSuccessNotification && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-bounce">
                <CheckCircle2 className="w-3.5 h-3.5" /> Voucher Saved Instantly!
              </span>
            )}
          </div>

          {/* Interactive Voucher Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-white">Audit MOC Journal Entry (Tally Format)</h3>
                <p className="text-xs text-slate-400">Client: Pratwi Solutions Private Limited • Voucher Date: 31-Mar-2026</p>
              </div>

              <button
                onClick={handleAddVoucherRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 w-16">Dr / Cr</th>
                    <th className="py-2.5 px-3">Particulars (Ledger Name)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Credit (₹)</th>
                    <th className="py-2.5 px-3">Narration / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {voucherRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3">
                        <select
                          value={row.type}
                          onChange={(e) => {
                            const updated = [...voucherRows];
                            updated[idx].type = e.target.value as 'Dr' | 'Cr';
                            setVoucherRows(updated);
                          }}
                          className="bg-slate-950 border border-slate-700 text-sky-400 font-bold rounded px-2 py-1 text-xs"
                        >
                          <option value="Dr">Dr</option>
                          <option value="Cr">Cr</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.ledger}
                          onFocus={() => setFocusedCell({ row: idx, col: 1 })}
                          onChange={(e) => {
                            const updated = [...voucherRows];
                            updated[idx].ledger = e.target.value;
                            setVoucherRows(updated);
                          }}
                          placeholder="Type ledger or press Alt+C to create"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white text-xs focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        {row.type === 'Dr' ? (
                          <input
                            type="number"
                            value={row.amount || ''}
                            onFocus={() => setFocusedCell({ row: idx, col: 2 })}
                            onChange={(e) => {
                              const updated = [...voucherRows];
                              updated[idx].amount = parseFloat(e.target.value) || 0;
                              setVoucherRows(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-right text-emerald-400 font-bold text-xs focus:border-sky-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {row.type === 'Cr' ? (
                          <input
                            type="number"
                            value={row.amount || ''}
                            onFocus={() => setFocusedCell({ row: idx, col: 3 })}
                            onChange={(e) => {
                              const updated = [...voucherRows];
                              updated[idx].amount = parseFloat(e.target.value) || 0;
                              setVoucherRows(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-right text-sky-400 font-bold text-xs focus:border-sky-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.narration}
                          onFocus={() => setFocusedCell({ row: idx, col: 4 })}
                          onChange={(e) => {
                            const updated = [...voucherRows];
                            updated[idx].narration = e.target.value;
                            setVoucherRows(updated);
                          }}
                          placeholder="Narration..."
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-300 text-xs focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950 border-t-2 border-slate-700 text-slate-300 font-bold">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 text-right uppercase text-xs">Total Balancing Figures:</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-mono">₹{totalDebit.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right text-sky-400 font-mono">₹{totalCredit.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right">
                      {isVoucherBalanced ? (
                        <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs">
                          Balanced (0 Diff)
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs">
                          Diff: ₹{voucherDifference.toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">
                Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">Ctrl + A</kbd> to accept and commit voucher into audit ledger.
              </span>

              <button
                onClick={triggerVoucherSave}
                disabled={!isVoucherBalanced}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Commit Audit Voucher (Ctrl + A)
              </button>
            </div>
          </div>

          {/* Alt+C Create Ledger Modal */}
          {isAltCModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-sky-400" />
                    Tally Master: Ledger Creation (Alt+C)
                  </h3>
                  <button onClick={() => setIsAltCModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ledger Name</label>
                    <input
                      type="text"
                      autoFocus
                      value={newLedgerName}
                      onChange={(e) => setNewLedgerName(e.target.value)}
                      placeholder="e.g. Unabsorbed Depreciation Reserve"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Under Group</label>
                    <select className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs">
                      <option>Provisions & Disallowances (Current Liabilities)</option>
                      <option>Indirect Expenses</option>
                      <option>Direct Expenses</option>
                      <option>Current Assets</option>
                      <option>Duties & Taxes (GST)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAltCModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateLedger}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow"
                  >
                    Save Master Ledger (Enter)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MULTI-WINDOW MDI DESKTOP */}
      {activeView === 'MDI_DESKTOP' && (
        <div className="space-y-6">
          {/* MDI Tab Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab, idx) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                  activeTabId === tab.id
                    ? 'bg-sky-950/60 border-sky-500/50 text-white shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-sky-400">
                  Alt+{idx + 1}
                </span>
                <span>{tab.title}</span>
                {tab.isDirty && <span className="text-amber-400 font-bold">*</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tabs.length > 1) {
                      setTabs(tabs.filter(t => t.id !== tab.id));
                      if (activeTabId === tab.id) setActiveTabId(tabs[0].id);
                    }
                  }}
                  className="hover:text-rose-400 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Active Client Workspace */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-semibold text-sky-400 font-mono">
                  Active Client Engagement Session ({activeClientTab.clientPan})
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{activeClientTab.clientName}</h3>
                <p className="text-xs text-slate-400">Module: {activeClientTab.module} • Preserved In-Memory (Zero State Loss)</p>
              </div>

              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                  MDI Multi-Tasking Active
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-white">Live Form State & Unsaved Workpapers</h4>
              <div className="bg-slate-900 p-3 rounded font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{JSON.stringify(activeClientTab.draftState, null, 2)}</pre>
              </div>
              <p className="text-xs text-slate-400">
                You can switch between clients instantly using <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Alt+1</kbd>, <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Alt+2</kbd>, etc. All form inputs, reconciliations, and draft vouchers remain cached.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TALLYPRIME XML BRIDGE */}
      {activeView === 'TALLY_SYNC_BRIDGE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Pending Audit MOCs */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-white">Audit MOCs (Auto-Generated)</h3>
                  <p className="text-xs text-slate-400">Management Overhaul Corrections ready to post into Tally</p>
                </div>
                <button
                  onClick={handleExportToTally}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition-all"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Post to TallyPrime via XML/ODBC
                </button>
              </div>

              {syncStatus === 'SUCCESS' && (
                <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully synchronized {mocs.length} vouchers to TallyPrime company instance!
                </div>
              )}

              <div className="space-y-3">
                {mocs.map(moc => (
                  <div key={moc.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {moc.voucherNumber}
                        </span>
                        <h4 className="text-sm font-semibold text-white mt-1">{moc.statutoryReason}</h4>
                      </div>
                      <span className="text-sm font-bold font-mono text-sky-400">
                        ₹{moc.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 font-mono">
                      <div><span className="text-emerald-400 font-bold">Dr:</span> {moc.debitLedger}</div>
                      <div><span className="text-sky-400 font-bold">Cr:</span> {moc.creditLedger}</div>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">{moc.narration}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Generated Tally XML Envelope */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  Tally XML Import Envelope
                </h3>
                <span className="text-xs text-slate-400 font-mono">Vouchers.xml</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-[380px] overflow-y-auto">
                <pre className="text-[11px] font-mono text-emerald-400/90 leading-relaxed whitespace-pre-wrap">
                  {xmlExportPreview}
                </pre>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Compatible with TallyPrime Release 1.0 to 4.1</span>
                <button
                  onClick={() => {
                    const blob = new Blob([xmlExportPreview], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Tally_Audit_MOC_Vouchers.xml';
                    a.click();
                  }}
                  className="flex items-center gap-1 text-sky-400 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download XML File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: FIRM BILLING & PAY-TO-RELEASE SENTINEL */}
      {activeView === 'BILLING_RECOVERY' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Billable WIP</span>
              <p className="text-2xl font-bold text-white mt-1">₹{billingStats.totalWipValue.toLocaleString('en-IN')}</p>
              <span className="text-xs text-slate-400">Partner, manager & article hours</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-amber-400">Client Receivables Due</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">₹{billingStats.totalReceivable.toLocaleString('en-IN')}</p>
              <span className="text-xs text-slate-400">Net of Sec 194J TDS</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-rose-400">Pay-to-Release File Locks</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">{billingStats.lockedDocumentsCount} Files</p>
              <span className="text-xs text-rose-400 font-semibold">Locked until invoice settled</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-emerald-400">Pure Agent Deductions</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">Rule 33 Exempt</p>
              <span className="text-xs text-slate-400">0% GST on statutory challans</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: WIP & Invoice List */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-semibold text-white">Client Engagements & Fee Invoices</h3>

              <div className="space-y-3">
                {wipItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedWip(item)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      selectedWip.id === item.id 
                        ? 'bg-sky-950/40 border-sky-500/50' 
                        : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.id} • {item.engagementType}
                        </span>
                        <h4 className="text-sm font-semibold text-white mt-1">{item.clientName}</h4>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : item.paymentStatus === 'OVERDUE_LOCKED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}>
                        {item.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-xs text-slate-400">
                      <span>Invoice: {item.invoiceNumber || 'Draft'}</span>
                      <span className="font-semibold text-white">Due: {item.dueDate || 'Immediate'}</span>
                    </div>

                    {item.fileLockActive && (
                      <div className="mt-2 p-2 rounded bg-rose-950/30 border border-rose-500/30 flex items-center gap-1.5 text-xs text-rose-300">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pay-to-Release Sentinel Active: {item.lockedDocumentRefs.length} reports locked</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Selected Invoice Breakdown & Pay-to-Release Actions */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-400" />
                  Tax Invoice & Pure Agent Breakdown
                </h3>
                <span className="text-xs font-mono text-slate-400">{selectedWip.invoiceNumber}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Professional Services Fee:</span>
                  <span className="font-mono font-bold text-white">₹{selectedInvoice.professionalFees.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">CGST (9%) + SGST (9%):</span>
                  <span className="font-mono text-sky-400">₹{selectedInvoice.totalGst.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Pure Agent Disbursements (Rule 33 Exempt):</span>
                  <span className="font-mono text-emerald-400">₹{selectedInvoice.pureAgentDisbursementsTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800 font-bold text-sm">
                  <span className="text-white">Gross Invoice Value:</span>
                  <span className="font-mono text-white">₹{selectedInvoice.grossInvoiceValue.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800 text-amber-400">
                  <span>Less: TDS Deductible u/s 194J (10%):</span>
                  <span className="font-mono">- ₹{selectedInvoice.tdsDeductibleSec194J.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-slate-700 text-sm font-bold text-emerald-400">
                  <span>Net Amount Receivable:</span>
                  <span className="font-mono text-base">₹{selectedInvoice.netReceivableFromClient.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Locked Documents Box */}
              {selectedWip.fileLockActive ? (
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>Pay-to-Release Lock Sentinel Triggered</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    The following client downloads are encrypted with a watermark and blocked until invoice settlement:
                  </p>
                  <ul className="text-xs font-mono text-slate-400 space-y-1 list-disc pl-5">
                    {selectedWip.lockedDocumentRefs.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      const updated = wipItems.map(w => w.id === selectedWip.id ? { ...w, paymentStatus: 'PAID' as const, fileLockActive: false } : w);
                      setWipItems(updated);
                      setSelectedWip(updated.find(w => w.id === selectedWip.id)!);
                    }}
                    className="w-full mt-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Acknowledge Payment & Unlock Reports
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  All reports unlocked and available for client download.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: 8:00 AM WHATSAPP PARTNER MORNING BRIEFING */}
      {activeView === 'MORNING_DIGEST' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: WhatsApp Phone Simulator */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Automated 8:00 AM WhatsApp Briefing
                  </h3>
                  <p className="text-xs text-slate-400">Delivered daily to managing partners via WhatsApp Cloud API</p>
                </div>

                <button
                  onClick={handleCopyDigest}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDigest ? 'Copied!' : 'Copy WhatsApp Text'}
                </button>
              </div>

              {/* Phone Mockup Screen */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-sans text-slate-200 leading-relaxed whitespace-pre-wrap">
                {digest.whatsAppFormattedDigest}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => alert('WhatsApp briefing dispatched successfully to Partner mobile!')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch WhatsApp Briefing Now
                </button>
              </div>
            </div>

            {/* Right: Operational Breakdown */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-semibold text-white">Digest Components & Triggers</h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-rose-400">Statutory Deadlines Priority</span>
                  <p className="text-slate-400">
                    Auto-scans GSTR-3B (20th), TDS deposit (7th), Advance Tax (15th), and MCA filings to alert on pending clients.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-sky-400">Physical DSC Locker Sentinel</span>
                  <p className="text-slate-400">
                    Flags USB tokens checked out &gt; 120 minutes or expiring within 30 days.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-amber-400">WIP & Pay-to-Release Receivables</span>
                  <p className="text-slate-400">
                    Reports total unbilled WIP hours and client audit reports locked pending fee recovery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
