'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Zap, Sparkles, Command } from 'lucide-react';
import { toast } from '@/components/shared/ToastNotification';

export interface GridRowItem {
  id: string;
  particulars: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  hsnOrSac: string;
  gstRate: number;
  narration: string;
}

const DEFAULT_ROWS: GridRowItem[] = [
  { id: '1', particulars: 'Purchase Account (Raw Material - Steel)', type: 'DEBIT', amount: 1850000, hsnOrSac: '7208', gstRate: 18, narration: 'Being steel sheets received vide inv 0491' },
  { id: '2', particulars: 'Input Tax Credit - IGST', type: 'DEBIT', amount: 333000, hsnOrSac: '9999', gstRate: 18, narration: 'IGST on raw material @ 18%' },
  { id: '3', particulars: 'M/s Tata Steel Processing Ltd', type: 'CREDIT', amount: 2183000, hsnOrSac: '', gstRate: 0, narration: 'Credited to supplier account' }
];

export function TallyDataGrid() {
  const [rows, setRows] = useState<GridRowItem[]>(DEFAULT_ROWS);
  const [activeCell, setActiveCell] = useState<{ rowIdx: number; colIdx: number }>({ rowIdx: 0, colIdx: 1 });
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState('');
  
  const cellRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[][]>([]);

  // Calculate Balances
  const totalDebit = rows.filter(r => r.type === 'DEBIT').reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalCredit = rows.filter(r => r.type === 'CREDIT').reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const diff = totalDebit - totalCredit;
  const isBalanced = Math.abs(diff) === 0;

  // Handle cell navigation with Enter, Shift+Enter, Arrows, Alt+C, Ctrl+A
  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    // Alt + C: Quick create ledger on the fly
    if (e.altKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      setIsQuickCreateOpen(true);
      return;
    }

    // Ctrl + A: Save & Accept voucher
    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      if (!isBalanced) {
        toast.error(`Voucher out of balance by ₹${Math.abs(diff).toLocaleString('en-IN')}. Total Debit must equal Total Credit.`);
        return;
      }
      toast.success('Voucher accepted & saved (Ctrl+A). Tally-Speed Parity achieved!');
      return;
    }

    // Alt + D: Delete current row
    if (e.altKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      if (rows.length > 1) {
        setRows(prev => prev.filter((_, idx) => idx !== rowIdx));
        toast.info('Row deleted (Alt+D)');
      }
      return;
    }

    // Enter: Move right or to next row
    if (e.key === 'Enter') {
      e.preventDefault();
      if (colIdx < 5) {
        // Move to next column in same row
        focusCell(rowIdx, colIdx + 1);
      } else {
        // Last column reached: If last row, auto-create a new row like Tally!
        if (rowIdx === rows.length - 1) {
          const newRow: GridRowItem = {
            id: String(Date.now()),
            particulars: '',
            type: diff > 0 ? 'CREDIT' : 'DEBIT',
            amount: Math.abs(diff),
            hsnOrSac: '',
            gstRate: 0,
            narration: ''
          };
          setRows(prev => [...prev, newRow]);
          setTimeout(() => focusCell(rowIdx + 1, 0), 20);
        } else {
          focusCell(rowIdx + 1, 0);
        }
      }
      return;
    }

    // Shift + Enter: Move left
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      if (colIdx > 0) {
        focusCell(rowIdx, colIdx - 1);
      } else if (rowIdx > 0) {
        focusCell(rowIdx - 1, 5);
      }
      return;
    }

    // Arrow Up / Down
    if (e.key === 'ArrowUp' && rowIdx > 0) {
      e.preventDefault();
      focusCell(rowIdx - 1, colIdx);
    } else if (e.key === 'ArrowDown' && rowIdx < rows.length - 1) {
      e.preventDefault();
      focusCell(rowIdx + 1, colIdx);
    }
  };

  const focusCell = (rowIdx: number, colIdx: number) => {
    setActiveCell({ rowIdx, colIdx });
    const el = cellRefs.current[rowIdx]?.[colIdx];
    if (el) {
      el.focus();
      if ('select' in el) (el as HTMLInputElement).select();
    }
  };

  const updateRowField = (rowIdx: number, field: keyof GridRowItem, value: any) => {
    setRows(prev => prev.map((r, idx) => {
      if (idx === rowIdx) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  return (
    <div className="space-y-4">
      {/* Grid Header & Shortcut HUD */}
      <div className="bg-white border-2 border-red-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold">
            <Zap className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 font-sans">
              <span>Tally-Speed Voucher Grid Engine</span>
              <span className="text-[10px] font-mono uppercase bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                100% Keyboard
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono">Enter</kbd> to move, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono">Alt+C</kbd> to create ledger, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-mono">Ctrl+A</kbd> to save.
            </p>
          </div>
        </div>

        {/* Live Balance Meter */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Debit (Dr)</span>
            <span className="font-bold text-slate-900">₹{totalDebit.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Credit (Cr)</span>
            <span className="font-bold text-slate-900">₹{totalCredit.toLocaleString('en-IN')}</span>
          </div>
          <div className="pl-3 border-l border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Divergence</span>
            <span className={`font-bold ${isBalanced ? 'text-emerald-700' : 'text-red-600'}`}>
              {isBalanced ? '₹0 (Balanced)' : `₹${Math.abs(diff).toLocaleString('en-IN')} Diff`}
            </span>
          </div>
        </div>
      </div>

      {/* The Rapid-Fire Keyboard Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden font-mono text-xs shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
              <th className="p-3 text-left w-12">#</th>
              <th className="p-3 text-left w-24">Dr / Cr</th>
              <th className="p-3 text-left">Particulars / Ledger (Alt+C to Create)</th>
              <th className="p-3 text-right w-40">Amount (₹)</th>
              <th className="p-3 text-left w-28">HSN/SAC</th>
              <th className="p-3 text-left">Narration</th>
              <th className="p-3 text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, rIdx) => {
              if (!cellRefs.current[rIdx]) cellRefs.current[rIdx] = [];

              return (
                <tr key={row.id} className="hover:bg-slate-50 focus-within:bg-red-50/20">
                  <td className="p-2.5 text-center text-slate-500 font-bold">{rIdx + 1}</td>
                  
                  {/* Col 0: Dr / Cr */}
                  <td className="p-2">
                    <select
                      ref={el => { cellRefs.current[rIdx][0] = el; }}
                      value={row.type}
                      onChange={e => updateRowField(rIdx, 'type', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, rIdx, 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-bold focus:border-red-500 focus:bg-white focus:outline-none"
                    >
                      <option value="DEBIT">Dr</option>
                      <option value="CREDIT">Cr</option>
                    </select>
                  </td>

                  {/* Col 1: Particulars */}
                  <td className="p-2">
                    <input
                      ref={el => { cellRefs.current[rIdx][1] = el; }}
                      type="text"
                      value={row.particulars}
                      onChange={e => updateRowField(rIdx, 'particulars', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, rIdx, 1)}
                      placeholder="Type ledger name or Alt+C..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none font-sans"
                    />
                  </td>

                  {/* Col 2: Amount */}
                  <td className="p-2">
                    <input
                      ref={el => { cellRefs.current[rIdx][2] = el; }}
                      type="number"
                      value={row.amount || ''}
                      onChange={e => updateRowField(rIdx, 'amount', Number(e.target.value))}
                      onKeyDown={e => handleKeyDown(e, rIdx, 2)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 text-right font-bold focus:border-red-500 focus:bg-white focus:outline-none"
                    />
                  </td>

                  {/* Col 3: HSN/SAC */}
                  <td className="p-2">
                    <input
                      ref={el => { cellRefs.current[rIdx][3] = el; }}
                      type="text"
                      value={row.hsnOrSac}
                      onChange={e => updateRowField(rIdx, 'hsnOrSac', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, rIdx, 3)}
                      placeholder="HSN"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-700 focus:border-red-500 focus:bg-white focus:outline-none"
                    />
                  </td>

                  {/* Col 4: Narration */}
                  <td className="p-2">
                    <input
                      ref={el => { cellRefs.current[rIdx][4] = el; }}
                      type="text"
                      value={row.narration}
                      onChange={e => updateRowField(rIdx, 'narration', e.target.value)}
                      onKeyDown={e => handleKeyDown(e, rIdx, 4)}
                      placeholder="Voucher narration..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:border-red-500 focus:bg-white focus:outline-none font-sans"
                    />
                  </td>

                  {/* Action Col */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => setRows(prev => prev.filter((_, idx) => idx !== rIdx))}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                      title="Delete row (Alt+D)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Bar */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              const newRow: GridRowItem = {
                id: String(Date.now()),
                particulars: '',
                type: diff > 0 ? 'CREDIT' : 'DEBIT',
                amount: Math.abs(diff),
                hsnOrSac: '',
                gstRate: 0,
                narration: ''
              };
              setRows(prev => [...prev, newRow]);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-red-600" />
            <span>Add Row (or press Enter on last cell)</span>
          </button>

          <button
            onClick={() => {
              if (!isBalanced) {
                toast.error(`Voucher out of balance by ₹${Math.abs(diff).toLocaleString('en-IN')}`);
                return;
              }
              toast.success('Voucher accepted & saved! (Ctrl+A)');
            }}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 flex items-center space-x-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept Voucher (Ctrl+A)</span>
          </button>
        </div>
      </div>

      {/* Alt+C Quick Create Ledger Modal */}
      {isQuickCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 font-sans text-slate-900">
            <div className="flex items-center space-x-2 text-slate-900">
              <Sparkles className="w-4 h-4 text-red-600" />
              <h3 className="text-base font-bold">Quick Ledger Creation (Alt+C)</h3>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Ledger Name</label>
              <input
                type="text"
                autoFocus
                value={newLedgerName}
                onChange={e => setNewLedgerName(e.target.value)}
                placeholder="e.g. Legal & Professional Fees"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Under Group</label>
              <select className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-red-500">
                <option>Indirect Expenses</option>
                <option>Sundry Creditors</option>
                <option>Sundry Debtors</option>
                <option>Bank Accounts</option>
                <option>Direct Expenses</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsQuickCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newLedgerName.trim()) {
                    updateRowField(activeCell.rowIdx, 'particulars', newLedgerName.trim());
                    toast.success(`Ledger "${newLedgerName}" created and assigned!`);
                    setNewLedgerName('');
                    setIsQuickCreateOpen(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                Create &amp; Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
