"use client";

import React, { useState, useEffect } from "react";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { 
  Search, 
  Building2, 
  FileText, 
  KeyRound, 
  ShieldAlert, 
  Send, 
  ArrowRight, 
  X, 
  Sparkles,
  Command,
  CheckCircle2,
  Lock,
  CreditCard,
  Layers
} from "lucide-react";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: "partner" | "article" | "client-pwa", tab?: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");

  // Keyboard shortcut listener for Escape & Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Toggle or open handled by parent or here
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const { clients, groups, tasks, dscTokens } = useTaxoData();

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Matched Clients
  const matchedClients = (clients || []).filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.pan.toLowerCase().includes(q) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      (c.groupName && c.groupName.toLowerCase().includes(q))
  );

  // Matched Groups
  const matchedGroups = (groups || []).filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      (g.promoterName && g.promoterName.toLowerCase().includes(q))
  );

  // Matched Tasks
  const matchedTasks = (tasks || []).filter(
    (t) =>
      t.entityName.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
  );

  // Matched DSCs
  const matchedDscs = (dscTokens || []).filter(
    (d) =>
      d.entityName.toLowerCase().includes(q) ||
      d.holderName.toLowerCase().includes(q) ||
      (d.vaultSlot && d.vaultSlot.toLowerCase().includes(q))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center pt-3 sm:pt-20 p-2.5 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[88dvh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-btred-logo flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type client name, PAN (AABCA...), GSTIN, task, DSC locker, or notice..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
              ESC to exit
            </span>
            <button onClick={onClose} className="text-slate-600 hover:text-slate-700 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-4 divide-y divide-slate-100 flex-1">
          {/* Quick Shortcuts if query is empty */}
          {!q && (
            <div className="space-y-2 pb-2">
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                Quick Navigation &amp; Workspaces
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    onNavigate("partner", "calendar");
                    onClose();
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-2.5 transition"
                >
                  <Building2 className="w-4 h-4 text-btred-logo" />
                  <div>
                    <p className="font-black text-slate-900">Statutory Matrix</p>
                    <p className="text-[10px] text-slate-500">Entity DNA &amp; Compliance Profiles</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigate("partner", "billing");
                    onClose();
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-2.5 transition"
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-black text-slate-900">Fee Invoices &amp; Direct UTR</p>
                    <p className="text-[10px] text-slate-500">Zero gateway fee bank ledger</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigate("article", "bank-decryptor");
                    onClose();
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-2.5 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="font-black text-slate-900">Bank PDF Decryptor</p>
                    <p className="text-[10px] text-slate-500">Auto-strips statement passwords</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigate("partner", "dsc");
                    onClose();
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-2.5 transition"
                >
                  <KeyRound className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="font-black text-slate-900">Physical DSC Vault</p>
                    <p className="text-[10px] text-slate-500">Hardware USB tokens &amp; Safe lockers</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Matched Clients */}
          {matchedClients.length > 0 && (
            <div className="space-y-1.5 pt-3">
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                Client Entities ({matchedClients.length})
              </span>
              {matchedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => {
                    onNavigate("partner", "calendar");
                    onClose();
                  }}
                  className="p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{client.name}</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">
                        {client.pan}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {client.groupName} &bull; Turnover ₹{client.turnoverCr}Cr &bull; Partner: {client.partnerInCharge}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          )}

          {/* Matched Tasks */}
          {matchedTasks.length > 0 && (
            <div className="space-y-1.5 pt-3">
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                Active Statutory Filings ({matchedTasks.length})
              </span>
              {matchedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    onNavigate("partner", "calendar");
                    onClose();
                  }}
                  className="p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{task.title}</span>
                      <span className="text-[10px] bg-red-50 text-btred-logo border border-red-200 px-1.5 py-0.2 rounded font-black">
                        {task.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {task.entityName} &bull; Due: {task.dueDate} &bull; Status: {task.status}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          )}

          {/* Matched DSCs */}
          {matchedDscs.length > 0 && (
            <div className="space-y-1.5 pt-3">
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                DSC USB Tokens &amp; Physical Vault Slots ({matchedDscs.length})
              </span>
              {matchedDscs.map((dsc) => (
                <div
                  key={dsc.id}
                  onClick={() => {
                    onNavigate("partner", "dsc");
                    onClose();
                  }}
                  className="p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{dsc.holderName}</span>
                      <span className="text-[10px] bg-red-50 text-btred-logo border border-red-200 px-1.5 py-0.2 rounded font-mono font-bold">
                        {dsc.vaultSlot}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {dsc.entityName} &bull; Custodian: {dsc.currentCustodian} &bull; Valid till: {dsc.validTill}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          Brains &amp; Taxes Universal Search &bull; Fast lookup for clients, tasks, and files
        </div>
      </div>
    </div>
  );
};
