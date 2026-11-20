"use client";

import React, { useState } from "react";
import { ClientEntity, ClientGroup, DscRecord } from "@/lib/types";
import { 
  Building2, 
  Copy, 
  Check, 
  ChevronDown, 
  ShieldCheck, 
  KeyRound, 
  FileCheck2, 
  Clock, 
  AlertTriangle,
  Search,
  ExternalLink,
  DollarSign,
  UserCheck
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";

interface AmbientClientContextBarProps {
  clients: ClientEntity[];
  groups?: ClientGroup[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  dscTokens?: DscRecord[];
  onNavigateTab?: (tab: string) => void;
}

export const AmbientClientContextBar: React.FC<AmbientClientContextBarProps> = ({
  clients,
  groups = [],
  selectedClientId,
  onSelectClient,
  dscTokens = [],
  onNavigateTab
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0] || null;

  if (!activeClient) return null;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success("Copied to Clipboard", `${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const clientDsc = dscTokens.find(
    (d) => d.entityId === activeClient.id || d.entityName.toLowerCase() === activeClient.name.toLowerCase()
  );

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.pan.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="relative z-30 bg-white border-y border-slate-200/80 shadow-xs px-3.5 sm:px-6 lg:px-8 py-2">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs">
        {/* Left: Active Entity Identification & Switcher */}
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          {/* Client Selector Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 font-extrabold px-3 py-1.5 rounded-xl transition text-left"
              title="Switch Active Client Entity"
            >
              <div className="w-5 h-5 rounded-md bg-btred-logo/10 text-btred-logo flex items-center justify-center font-black text-[10px]">
                {activeClient.name.charAt(0)}
              </div>
              <span className="truncate max-w-[180px] sm:max-w-[240px] font-black text-slate-900 text-xs">
                {activeClient.name}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 uppercase">
                {activeClient.type.replace("_", " ")}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 space-y-2 z-50 animate-in fade-in zoom-in-95">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by client name, PAN or GSTIN..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-btred-logo font-medium"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        onSelectClient(client.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                        client.id === activeClient.id ? "bg-red-50 text-btred-logo font-black" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="font-bold block truncate">{client.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">PAN: {client.pan}</span>
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                        {client.type.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Statutory Identifiers (PAN & GSTIN) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* PAN */}
            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <span className="text-[10px] text-slate-400 font-bold">PAN</span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">{activeClient.pan}</span>
              <button
                onClick={() => handleCopy(activeClient.pan, "PAN")}
                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition"
                title="Copy PAN"
              >
                {copiedKey === "PAN" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {/* GSTIN */}
            {activeClient.gstin && (
              <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold">GSTIN</span>
                <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[120px] sm:max-w-none">
                  {activeClient.gstin}
                </span>
                <button
                  onClick={() => handleCopy(activeClient.gstin || "", "GSTIN")}
                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition"
                  title="Copy GSTIN"
                >
                  {copiedKey === "GSTIN" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}

            {/* CIN */}
            {activeClient.cin && (
              <div className="hidden md:inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold">CIN</span>
                <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[130px] sm:max-w-none">
                  {activeClient.cin}
                </span>
                <button
                  onClick={() => handleCopy(activeClient.cin || "", "CIN")}
                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition"
                  title="Copy CIN"
                >
                  {copiedKey === "CIN" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}

            {/* Turnover */}
            {activeClient.turnoverCr && (
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-black">
                ₹{activeClient.turnoverCr} Cr Turnover
              </span>
            )}
          </div>
        </div>

        {/* Right: Live Statutory & Practice Health Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Partner & Article in Charge */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-600">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-bold">{activeClient.partnerInCharge}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-500 font-medium">{activeClient.assignedArticle}</span>
          </div>

          {/* DSC Token Custodian Badge */}
          {clientDsc ? (
            <div 
              onClick={() => onNavigateTab?.("dsc")}
              className="inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition"
              title={`Class-3 DSC Token: ${clientDsc.serialNumber} (Slot: ${clientDsc.vaultSlot}, Holder: ${clientDsc.currentCustodian})`}
            >
              <KeyRound className="w-3 h-3 text-purple-700" />
              <span>DSC: {clientDsc.vaultSlot} ({clientDsc.currentCustodian})</span>
            </div>
          ) : (
            <div 
              onClick={() => onNavigateTab?.("dsc")}
              className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] font-medium cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>No DSC Linked</span>
            </div>
          )}

          {/* Entity DNA Profile Shortcut */}
          <button
            onClick={() => onNavigateTab?.("client-master")}
            className="text-[10px] text-btred-logo hover:text-red-700 font-bold inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg border border-red-200 transition"
          >
            <span>Full Entity DNA</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
