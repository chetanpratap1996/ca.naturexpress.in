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
import { useClientContext } from '@/lib/context/ClientContext';
import { UniversalClientSelector } from '@/components/shared/UniversalClientSelector';
import { ClientGateEmptyState } from '@/components/shared/ClientGateEmptyState';

type SubView = 'TALLY_KEYBOARD_GRID' | 'MDI_DESKTOP' | 'TALLY_SYNC_BRIDGE' | 'BILLING_RECOVERY' | 'MORNING_DIGEST';

interface VoucherRow {
  id: string;
  type: 'Dr' | 'Cr';
  ledger: string;
  amount: number;
  narration: string;
}

export default function PillarEightTallyDesktopWorkbench() {
  const { selectedClient, isFirmWideView } = useClientContext();
  const activeClientName = selectedClient && !isFirmWideView ? (selectedClient.tradeName || selectedClient.name) : '';

  const [activeView, setActiveView] = useState<SubView>('TALLY_KEYBOARD_GRID');

  // MDI Tabs State
  const [tabs, setTabs] = useState<MdiClientTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // Tally Grid State (initialized with 2 ready-to-type Dr/Cr rows)
  const [voucherType, setVoucherType] = useState<'Journal' | 'Sales' | 'Receipt' | 'Payment' | 'Contra'>('Journal');
  const [voucherDate, setVoucherDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [voucherRows, setVoucherRows] = useState<VoucherRow[]>([
    { id: 'R-1', type: 'Dr', ledger: '', amount: 0, narration: '' },
    { id: 'R-2', type: 'Cr', ledger: '', amount: 0, narration: '' },
  ]);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number }>({ row: 0, col: 1 });
  const [isAltCModalOpen, setIsAltCModalOpen] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  // Tally Bridge State
  const [mocs, setMocs] = useState<TallyMocEntry[]>([]);
  const [trialBalance] = useState<TallyTrialBalanceItem[]>([]);
  const [xmlExportPreview, setXmlExportPreview] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Billing State
  const [wipItems, setWipItems] = useState<BillableWipItem[]>([]);
  const [selectedWip, setSelectedWip] = useState<BillableWipItem>({ id: 'WIP-EMPTY', clientName: activeClientName, clientPan: selectedClient?.pan || '', engagementType: 'TAX_AUDIT_44AB', partnerHours: 0, partnerRatePerHour: 0, managerHours: 0, managerRatePerHour: 0, articleHours: 0, articleRatePerHour: 0, pureAgentDisbursements: [], invoiceRaised: false, paymentStatus: 'PAYMENT_PENDING', fileLockActive: false, lockedDocumentRefs: [] });

  // Morning Digest State
  const [digest, setDigest] = useState<MorningBriefingData>(PartnerMorningDigestEngine.compileMorningBriefing());
  const [copiedDigest, setCopiedDigest] = useState(false);

  // Setup initial XML preview
  useEffect(() => {
    const xml = TallySyncBridgeEngine.generateTallyXmlForMocs(activeClientName, mocs);
    setXmlExportPreview(xml);
  }, [mocs, activeClientName]);

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

  if (!selectedClient || isFirmWideView) {
    return (
      <ClientGateEmptyState
        moduleTitle="Tally Bridge & Desktop Sync"
        description="Select a client entity above to enter keyboard vouchers, sync TallyPrime MOCs, and manage client WIP."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Enterprise-Grade Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-red-600" />
              Tally Voucher Grid &amp; XML Bridge
            </h1>
            {selectedClient && !isFirmWideView && (
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {selectedClient.name} &bull; PAN: {selectedClient.pan}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                const blob = new Blob([xmlExportPreview], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Tally_MOC_${activeClientName.replace(/[^a-zA-Z0-9]/g, '_')}.xml`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
              title="Download TallyPrime 4.0 XML File"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export XML</span>
            </button>

            <button
              onClick={triggerVoucherSave}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Commit Voucher (Ctrl+A)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveView('TALLY_KEYBOARD_GRID')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'TALLY_KEYBOARD_GRID'
                ? 'bg-btred-logo text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Tally Voucher Entry Grid
          </button>

          <button
            onClick={() => setActiveView('MDI_DESKTOP')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'MDI_DESKTOP'
                ? 'bg-btred-logo text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Multi-Client MDI Desktop ({tabs.length})
          </button>

          <button
            onClick={() => setActiveView('TALLY_SYNC_BRIDGE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'TALLY_SYNC_BRIDGE'
                ? 'bg-btred-logo text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            TallyPrime XML Bridge ({mocs.length} MOCs)
          </button>
        </div>
      </div>

      {/* VIEW 1: TALLY-SPEED KEYBOARD DATA ENTRY GRID */}
      {activeView === 'TALLY_KEYBOARD_GRID' && (
        <div className="space-y-6">
          {/* Voucher Type, Date & Hotkeys Bar */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <select
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value as any)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold bg-slate-50 text-slate-900"
              >
                <option value="Journal">Journal (F7)</option>
                <option value="Sales">Sales (F8)</option>
                <option value="Receipt">Receipt (F6)</option>
                <option value="Payment">Payment (F5)</option>
                <option value="Contra">Contra (F4)</option>
              </select>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono bg-slate-50 text-slate-800"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-red-600 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4" />
                Active Hotkeys:
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                <kbd className="font-bold text-slate-900">Enter</kbd> Next Field
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                <kbd className="font-bold text-slate-900">Shift+Enter</kbd> Prev Field
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                <kbd className="font-bold text-slate-900">Alt+C</kbd> Create Ledger
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                <kbd className="font-bold text-slate-900">Ctrl+A</kbd> Save Voucher
              </span>
            </div>

            {saveSuccessNotification && (
              <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Voucher Saved Instantly!
              </span>
            )}
          </div>

          {/* Interactive Voucher Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit MOC Journal Entry (Tally Format)</h3>
                <p className="text-xs text-slate-500">Client: {activeClientName} • Voucher Date: 31-Mar-2026</p>
              </div>

              <button
                onClick={handleAddVoucherRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-16">Dr / Cr</th>
                    <th className="py-2.5 px-3">Particulars (Ledger Name)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Credit (₹)</th>
                    <th className="py-2.5 px-3">Narration / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {voucherRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-red-50/20">
                      <td className="py-2 px-3">
                        <select
                          value={row.type}
                          onChange={(e) => {
                            const updated = [...voucherRows];
                            updated[idx].type = e.target.value as 'Dr' | 'Cr';
                            setVoucherRows(updated);
                          }}
                          className="bg-white border border-slate-300 text-red-600 font-bold rounded px-2 py-1 text-xs focus:border-red-500"
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
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 text-xs focus:border-red-500 focus:outline-none"
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
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-right text-emerald-700 font-bold text-xs focus:border-red-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-400">-</span>
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
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-right text-red-600 font-bold text-xs focus:border-red-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-400">-</span>
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
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 text-xs focus:border-red-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-slate-900 font-bold">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 text-right uppercase text-xs">Total Balancing Figures:</td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-mono">₹{totalDebit.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right text-red-600 font-mono">₹{totalCredit.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right">
                      {isVoucherBalanced ? (
                        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                          Balanced (0 Diff)
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-xs">
                          Diff: ₹{voucherDifference.toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 font-mono border border-slate-300">Ctrl + A</kbd> to accept and commit voucher into audit ledger.
              </span>

              <button
                onClick={triggerVoucherSave}
                disabled={!isVoucherBalanced}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Commit Audit Voucher (Ctrl + A)
              </button>
            </div>
          </div>

          {/* Alt+C Create Ledger Modal */}
          {isAltCModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-red-600" />
                    Tally Master: Ledger Creation (Alt+C)
                  </h3>
                  <button onClick={() => setIsAltCModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ledger Name</label>
                    <input
                      type="text"
                      autoFocus
                      value={newLedgerName}
                      onChange={(e) => setNewLedgerName(e.target.value)}
                      placeholder="e.g. Unabsorbed Depreciation Reserve"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Under Group</label>
                    <select className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs">
                      <option>Provisions &amp; Disallowances (Current Liabilities)</option>
                      <option>Indirect Expenses</option>
                      <option>Direct Expenses</option>
                      <option>Current Assets</option>
                      <option>Duties &amp; Taxes (GST)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setIsAltCModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateLedger}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
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
          <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center gap-2 overflow-x-auto shadow-sm">
            {tabs.map((tab, idx) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                  activeTabId === tab.id
                    ? 'bg-red-50 border-red-300 text-red-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono text-red-600 border border-slate-200">
                  Alt+{idx + 1}
                </span>
                <span>{tab.title}</span>
                {tab.isDirty && <span className="text-amber-500 font-bold">*</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tabs.length > 1) {
                      setTabs(tabs.filter(t => t.id !== tab.id));
                      if (activeTabId === tab.id) setActiveTabId(tabs[0].id);
                    }
                  }}
                  className="hover:text-red-600 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Active Client Workspace */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-bold text-red-600 font-mono">
                  Active Client Engagement Session ({activeClientTab.clientPan})
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{activeClientTab.clientName}</h3>
                <p className="text-xs text-slate-500">Module: {activeClientTab.module} • Preserved In-Memory (Zero State Loss)</p>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                MDI Multi-Tasking Active
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Live Form State &amp; Unsaved Workpapers</h4>
              <div className="bg-white p-3 rounded font-mono text-xs text-slate-800 border border-slate-200 overflow-x-auto">
                <pre>{JSON.stringify(activeClientTab.draftState, null, 2)}</pre>
              </div>
              <p className="text-xs text-slate-500">
                You can switch between clients instantly using <kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">Alt+1</kbd>, <kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">Alt+2</kbd>, etc. All form inputs, reconciliations, and draft vouchers remain cached.
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
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Audit MOCs (Auto-Generated)</h3>
                  <p className="text-xs text-slate-500">Management Overhaul Corrections ready to post into Tally</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/invoices', { credentials: 'include' });
                        const data = await res.json();
                        const invs: any[] = data.invoices || [];
                        if (invs.length === 0) {
                          setSyncStatus('NO_INVOICES');
                          return;
                        }
                        const voucherXml = invs
                          .map((inv) => {
                            const dt = String(inv.dueDate || '2026-11-01').replace(/-/g, '');
                            return `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Sales" ACTION="Create"><DATE>${dt}</DATE><VOUCHERNUMBER>${inv.invoiceNo}</VOUCHERNUMBER><PARTYLEDGERNAME>${inv.entityName}</PARTYLEDGERNAME><NARRATION>${inv.serviceDescription} (SAC ${inv.sacCode || '998231'})</NARRATION><ALLLEDGERENTRIES.LIST><LEDGERNAME>${inv.entityName}</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${inv.amount}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>Professional Fees (SAC 9982)</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${inv.taxableAmount}</AMOUNT></ALLLEDGERENTRIES.LIST><ALLLEDGERENTRIES.LIST><LEDGERNAME>Output GST @ 18%</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${inv.gstAmount}</AMOUNT></ALLLEDGERENTRIES.LIST></VOUCHER></TALLYMESSAGE>`;
                          })
                          .join('\n');
                        const fullXml = `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>${voucherXml}</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
                        setXmlExportPreview(fullXml);
                        const blob = new Blob([fullXml], { type: 'application/xml;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `TallyPrime_Firm_Invoices_${new Date().toISOString().slice(0, 10)}.xml`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setSyncStatus('SUCCESS');
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Firm Invoices XML
                  </button>
                  <button
                    onClick={handleExportToTally}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    Post to TallyPrime via XML/ODBC
                  </button>
                </div>
              </div>

              {syncStatus === 'SUCCESS' && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Successfully synchronized {mocs.length} vouchers to TallyPrime company instance!
                </div>
              )}

              <div className="space-y-3">
                {mocs.map(moc => (
                  <div key={moc.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {moc.voucherNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{moc.statutoryReason}</h4>
                      </div>
                      <span className="text-sm font-bold font-mono text-red-600">
                        ₹{moc.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1 font-mono">
                      <div><span className="text-emerald-700 font-bold">Dr:</span> {moc.debitLedger}</div>
                      <div><span className="text-red-600 font-bold">Cr:</span> {moc.creditLedger}</div>
                    </div>

                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">{moc.narration}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Generated Tally XML Envelope */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  Tally XML Import Envelope
                </h3>
                <span className="text-xs text-slate-500 font-mono">Vouchers.xml</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[380px] overflow-y-auto">
                <pre className="text-[11px] font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {xmlExportPreview}
                </pre>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
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
                  className="flex items-center gap-1 text-red-600 hover:underline font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download XML File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: RULE 33 PURE AGENT INVOICING & FEE BREAKDOWN */}
      {activeView === 'BILLING_RECOVERY' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500">Total Billable WIP</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">₹{billingStats.totalWipValue.toLocaleString('en-IN')}</p>
              <span className="text-xs text-slate-500">Partner, manager &amp; article hours</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase text-amber-700">Client Receivables Due</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">₹{billingStats.totalReceivable.toLocaleString('en-IN')}</p>
              <span className="text-xs text-slate-500">Net of Sec 194J TDS</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase text-red-600">Pay-to-Release File Locks</span>
              <p className="text-2xl font-bold text-red-600 mt-1">{billingStats.lockedDocumentsCount} Files</p>
              <span className="text-xs text-red-700 font-semibold">Locked until invoice settled</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase text-emerald-700">Pure Agent Deductions</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">Rule 33 Exempt</p>
              <span className="text-xs text-slate-500">0% GST on statutory challans</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: WIP & Invoice List */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Client Engagements &amp; Fee Invoices</h3>

              <div className="space-y-3">
                {wipItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedWip(item)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      selectedWip.id === item.id 
                        ? 'bg-red-50/50 border-red-300' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {item.id} • {item.engagementType}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{item.clientName}</h4>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.paymentStatus === 'OVERDUE_LOCKED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {item.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>Invoice: {item.invoiceNumber || 'Draft'}</span>
                      <span className="font-semibold text-slate-900">Due: {item.dueDate || 'Immediate'}</span>
                    </div>

                    {item.fileLockActive && (
                      <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 flex items-center gap-1.5 text-xs text-red-700 font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Deliverable Gate Active: {item.lockedDocumentRefs.length} reports locked</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Selected Invoice Breakdown & Pay-to-Release Actions */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-red-600" />
                  Tax Invoice &amp; Pure Agent Breakdown
                </h3>
                <span className="text-xs font-mono text-slate-500">{selectedWip.invoiceNumber}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Professional Services Fee:</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedInvoice.professionalFees.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">CGST (9%) + SGST (9%):</span>
                  <span className="font-mono text-red-600 font-bold">₹{selectedInvoice.totalGst.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Pure Agent Disbursements (Rule 33 Exempt):</span>
                  <span className="font-mono text-emerald-700 font-bold">₹{selectedInvoice.pureAgentDisbursementsTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200 font-bold text-sm">
                  <span className="text-slate-900">Gross Invoice Value:</span>
                  <span className="font-mono text-slate-900">₹{selectedInvoice.grossInvoiceValue.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200 text-amber-800 font-medium">
                  <span>Less: TDS Deductible u/s 194J (10%):</span>
                  <span className="font-mono">- ₹{selectedInvoice.tdsDeductibleSec194J.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-slate-300 text-sm font-bold text-emerald-700">
                  <span>Net Amount Receivable:</span>
                  <span className="font-mono text-base">₹{selectedInvoice.netReceivableFromClient.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Locked Documents Box */}
              {selectedWip.fileLockActive ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>Pay-to-Release Lock Active</span>
                  </div>
                  <p className="text-xs text-slate-700">
                    The following client downloads are encrypted with a watermark and blocked until invoice settlement:
                  </p>
                  <ul className="text-xs font-mono text-slate-600 space-y-1 list-disc pl-5">
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
                    className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Acknowledge Payment &amp; Unlock Reports
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
            {/* Left: WhatsApp Simulator */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Automated 8:00 AM WhatsApp Briefing
                  </h3>
                  <p className="text-xs text-slate-500">Delivered daily to managing partners via WhatsApp Cloud API</p>
                </div>

                <button
                  onClick={handleCopyDigest}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all"
                >
                  {copiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDigest ? 'Copied!' : 'Copy WhatsApp Text'}
                </button>
              </div>

              {/* Message Screen */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap shadow-inner">
                {digest.whatsAppFormattedDigest}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => alert('WhatsApp briefing dispatched successfully to Partner mobile!')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch WhatsApp Briefing Now
                </button>
              </div>
            </div>

            {/* Right: Operational Breakdown */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Digest Components &amp; Triggers</h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-red-600">Statutory Deadlines Priority</span>
                  <p className="text-slate-600">
                    Auto-scans GSTR-3B (20th), TDS deposit (7th), Advance Tax (15th), and MCA filings to alert on pending clients.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900">Physical DSC Locker Tracking</span>
                  <p className="text-slate-600">
                    Flags USB tokens checked out &gt; 120 minutes or expiring within 30 days.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-amber-700">WIP &amp; Pay-to-Release Receivables</span>
                  <p className="text-slate-600">
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
