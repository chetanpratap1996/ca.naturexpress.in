"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ClientEntity, ClientGroup, GstinRecordItem } from "@/lib/types";
import { 
  Building2, 
  ChevronDown, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Plus, 
  X, 
  Layers, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Building,
  Hash
} from "lucide-react";
import { inferConstitutionFromPan } from "@/lib/config/entityDna";

interface UniversalClientSwitcherProps {
  clients: ClientEntity[];
  groups?: ClientGroup[];
  selectedClientId: string;
  onSelectClient: (clientId: string, selectedGstin?: string) => void;
  onOpenDiagnosticOnboarding?: () => void;
  selectedGstin?: string;
  compact?: boolean;
}

export const UniversalClientSwitcher: React.FC<UniversalClientSwitcherProps> = ({
  clients = [],
  groups = [],
  selectedClientId,
  onSelectClient,
  onOpenDiagnosticOnboarding,
  selectedGstin,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active Client
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Active GSTIN
  const activeGstin = useMemo(() => {
    if (selectedGstin) return selectedGstin;
    if (activeClient?.gstin) return activeClient.gstin;
    if (activeClient?.gstinRecords && activeClient.gstinRecords.length > 0) {
      return activeClient.gstinRecords[0].gstin;
    }
    return undefined;
  }, [selectedGstin, activeClient]);

  // Constitution label
  const constitutionInfo = useMemo(() => {
    if (!activeClient?.pan) return { entityType: activeClient?.type || "PVT_LTD", legalConstitution: "Corporate" };
    return inferConstitutionFromPan(activeClient.pan);
  }, [activeClient]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase().trim();
    return clients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPan = c.pan.toLowerCase().includes(q);
      const matchGstin = c.gstin?.toLowerCase().includes(q);
      const matchGroup = c.groupName?.toLowerCase().includes(q);
      const matchTrade = c.tradeName?.toLowerCase().includes(q);
      const matchState = c.gstinRecords?.some((g) => g.stateName.toLowerCase().includes(q) || g.gstin.toLowerCase().includes(q));
      return matchName || matchPan || matchGstin || matchGroup || matchTrade || matchState;
    });
  }, [clients, searchQuery]);

  // Grouped clients
  const groupedClients = useMemo(() => {
    const map = new Map<string, { groupName: string; items: ClientEntity[] }>();
    filteredClients.forEach((client) => {
      const gId = client.groupId || "OTHER";
      const gName = client.groupName || "Individual Assessees";
      if (!map.has(gId)) {
        map.set(gId, { groupName: gName, items: [] });
      }
      map.get(gId)!.items.push(client);
    });
    return Array.from(map.entries());
  }, [filteredClients]);

  if (!activeClient) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button in TopNav */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition text-left shadow-2xs group focus:outline-none focus:ring-2 focus:ring-red-500/20"
        title="Switch Client Entity & State GSTIN"
        aria-label="Universal Client Switcher"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
          <Building2 className="w-4 h-4" />
        </div>

        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-slate-900 text-xs truncate max-w-[140px] sm:max-w-[200px] lg:max-w-[240px]">
              {activeClient.tradeName || activeClient.name}
            </span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 hidden sm:inline">
              {activeClient.type}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span className="font-bold text-slate-700">{activeClient.pan}</span>
            {activeGstin && (
              <>
                <span className="text-slate-300">•</span>
                <span className="truncate max-w-[110px] text-slate-600 hidden md:inline">
                  {activeGstin}
                </span>
              </>
            )}
            {activeClient.healthScore !== undefined && (
              <span className="text-[9px] font-bold px-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hidden lg:inline">
                {activeClient.healthScore}% Health
              </span>
            )}
          </div>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Modal Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[340px] sm:w-[440px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Search */}
          <div className="pb-2.5 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Universal Client Spine
                </span>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                  {clients.length} Entities
                </span>
              </div>

              {onOpenDiagnosticOnboarding && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenDiagnosticOnboarding();
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-btred-logo text-[11px] font-bold border border-red-200 transition"
                  title="1-Tap PAN Diagnostic Onboarding"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>+ 1-Tap Onboard</span>
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by legal name, PAN, GSTIN, or group..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Client Entities List Grouped by Promoter Group */}
          <div className="max-h-[320px] overflow-y-auto space-y-3 pt-2 scrollbar-thin">
            {groupedClients.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching client entity found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              groupedClients.map(([groupId, group]) => (
                <div key={groupId} className="space-y-1">
                  {/* Group Header */}
                  <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <span className="truncate">{group.groupName}</span>
                    <span className="font-mono">{group.items.length}</span>
                  </div>

                  {/* Entities in this group */}
                  <div className="space-y-1">
                    {group.items.map((client) => {
                      const isSelected = client.id === activeClient.id;
                      return (
                        <div
                          key={client.id}
                          className={`rounded-xl border transition p-2 cursor-pointer ${
                            isSelected
                              ? "bg-purple-50/70 border-purple-300 text-purple-950"
                              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                          onClick={() => {
                            onSelectClient(client.id);
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs truncate text-slate-900">
                                  {client.name}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {client.type}
                                </span>
                                {client.healthScore !== undefined && (
                                  <span className="text-[9px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">
                                    {client.healthScore}%
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                                <span>PAN: <strong className="text-slate-800">{client.pan}</strong></span>
                                {client.turnoverCr && (
                                  <>
                                    <span>•</span>
                                    <span>₹{client.turnoverCr} Cr Turnover</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Multi-State GSTINs sub-picker if available */}
                          {client.gstinRecords && client.gstinRecords.length > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                              <span className="text-[9px] font-bold uppercase text-slate-400 mr-1">
                                GSTINs:
                              </span>
                              {client.gstinRecords.map((g) => {
                                const isGstinActive = activeGstin === g.gstin && isSelected;
                                return (
                                  <button
                                    key={g.gstin}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectClient(client.id, g.gstin);
                                      setIsOpen(false);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition border flex items-center gap-1 ${
                                      isGstinActive
                                        ? "bg-purple-700 text-white border-purple-800 font-bold"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                    }`}
                                    title={`${g.stateName} - ${g.tradeName}`}
                                  >
                                    <span>{g.stateCode} ({g.stateName.slice(0, 2).toUpperCase()})</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Diagnostic Bar */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 1000% Statutory Spine
            </span>
            <span className="font-semibold text-slate-600">
              Auto-cascades to all 5 Suites
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
