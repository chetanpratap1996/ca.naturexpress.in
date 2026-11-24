"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useClientContext } from "@/lib/context/ClientContext";
import { ClientEntity, GstinRecordItem } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import {
  Building2,
  Search,
  Check,
  Copy,
  ChevronDown,
  X,
  History,
  Layers,
  ArrowRight,
  ExternalLink,
  Filter,
  ShieldCheck,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  Calendar,
  Briefcase
} from "lucide-react";

interface UniversalClientSelectorProps {
  className?: string;
  variant?: "topbar" | "compact" | "full" | "floating";
  onClientSelected?: (client: ClientEntity) => void;
}

export const UniversalClientSelector: React.FC<UniversalClientSelectorProps> = ({
  className = "",
  variant = "topbar",
  onClientSelected,
}) => {
  const {
    selectedClient,
    selectedGstin,
    selectedGstinRecord,
    selectedFy,
    selectedPeriod,
    isFirmWideView,
    recentClients,
    selectClient,
    selectGstin,
    selectFy,
    selectPeriod,
    setFirmWideView,
    clearClientContext,
    availableGstins,
  } = useClientContext();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClientEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGstinDropdownOpen, setIsGstinDropdownOpen] = useState(false);
  const [isFyDropdownOpen, setIsFyDropdownOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const availableFys = ["2023-24", "2024-25", "2025-26", "2026-27"];

  // Debounced Server-Side Search
  const fetchClients = useCallback(async (query: string, filterType: string, targetPage: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        type: filterType,
        page: targetPage.toString(),
        limit: "12",
      });
      const res = await fetch(`/api/clients/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.clients || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setSelectedIndex(0);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch clients from server-side search:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchClients(searchQuery, typeFilter, page);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, typeFilter, page, isOpen, fetchClients]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setPage(1);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    const items = searchResults.length > 0 ? searchResults : recentClients;
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = items[selectedIndex];
      if (target) {
        handlePickClient(target);
      }
    }
  };

  const handlePickClient = (client: ClientEntity, gstin?: string) => {
    selectClient(client, gstin);
    setIsOpen(false);
    if (onClientSelected) {
      onClientSelected(client);
    }
    toast.success("Assessee Selected", `${client.name} is now the active practice context.`);
  };

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success("Copied to Clipboard", `${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSwitchToFirmWide = () => {
    clearClientContext();
    setIsOpen(false);
    toast.info("Firm-Wide View Active", "Viewing aggregated practice data across all clients.");
  };

  return (
    <div className={`relative ${className}`}>
      {/* TRIGGER BAR */}
      {variant === "compact" ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-2.5 py-1.5 shadow-2xs transition">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 text-left hover:opacity-85 transition group"
              title="Click to search and switch client assessee (Cmd+K)"
            >
              <Building2 className="w-4 h-4 text-slate-500 group-hover:text-btred-logo transition shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[130px] sm:max-w-[200px]">
                  {selectedClient && !isFirmWideView ? (selectedClient.tradeName || selectedClient.name) : "Select Client"}
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {selectedGstin || (selectedClient?.gstin) || "No GSTIN"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition shrink-0 ml-0.5" />
            </button>

            {/* Quick Copy GSTIN */}
            {(selectedGstin || selectedClient?.gstin) && (
              <button
                onClick={(e) => handleCopy(e, (selectedGstin || selectedClient?.gstin)!, "GSTIN")}
                className="p-1 ml-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                title="Copy Full 15-Digit GSTIN"
              >
                {copiedKey === "GSTIN" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}

            {/* Multi-GSTIN dropdown toggle if available */}
            {availableGstins.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setIsGstinDropdownOpen(!isGstinDropdownOpen)}
                  className="text-[9px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-lg ml-1 flex items-center gap-0.5"
                  title={`${availableGstins.length} state registrations`}
                >
                  <span>{availableGstins.length} States</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {isGstinDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                      Switch State Registration
                    </span>
                    {availableGstins.map((g) => (
                      <button
                        key={g.gstin}
                        onClick={() => {
                          selectGstin(g.gstin);
                          setIsGstinDropdownOpen(false);
                          toast.success("GSTIN Switched", `Switched to ${g.stateName} (${g.gstin})`);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                          selectedGstin === g.gstin ? "bg-blue-50/70 border border-blue-200 font-bold" : ""
                        }`}
                      >
                        <div>
                          <div className="font-mono text-slate-900 font-bold">{g.gstin}</div>
                          <div className="text-[10px] text-slate-500">
                            {g.stateName} ({g.stateCode}) &bull; {g.filingFrequency}
                          </div>
                        </div>
                        {selectedGstin === g.gstin && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
        {/* Main Client Indicator Button */}
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border text-xs transition shadow-2xs group ${
            selectedClient && !isFirmWideView
              ? "bg-white hover:bg-slate-50 border-slate-300 text-slate-900"
              : "bg-slate-100 hover:bg-slate-200/90 border-slate-300 text-slate-700"
          }`}
          title="Click to search and switch client (⌘K)"
        >
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
              selectedClient && !isFirmWideView
                ? "bg-red-50 text-btred-logo border border-red-200"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {selectedClient && !isFirmWideView ? selectedClient.name.charAt(0) : <Building2 className="w-3.5 h-3.5" />}
          </div>

          <div className="text-left flex items-center gap-2 min-w-0">
            {selectedClient && !isFirmWideView ? (
              <>
                <div className="min-w-0">
                  <span className="font-black text-slate-900 text-xs truncate block max-w-[160px] sm:max-w-[220px]">
                    {selectedClient.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <span>PAN: {selectedClient.pan}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="uppercase text-[9px] font-bold text-slate-600">
                      {selectedClient.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  All Clients (Firm-Wide)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Click to select client assessee</span>
              </div>
            )}
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition shrink-0 ml-1" />
        </button>

        {/* Selected GSTIN Pill (with Multi-GSTIN dropdown if client has >1) */}
        {selectedClient && !isFirmWideView && selectedGstin && (
          <div className="relative">
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-2xl text-[11px] font-mono shadow-2xs overflow-hidden">
              <span className="bg-slate-100 px-2 py-1 text-[10px] font-sans font-bold text-slate-600 border-r border-slate-200">
                {selectedGstin.substring(0, 2)}
              </span>

              {/* If client has multiple GSTINs, show a dropdown arrow */}
              {availableGstins.length > 1 ? (
                <button
                  onClick={() => setIsGstinDropdownOpen(!isGstinDropdownOpen)}
                  className="px-2 py-1 font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-1"
                  title="Switch GST Registration State"
                >
                  <span className="font-mono">{selectedGstin}</span>
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-sans">
                    {availableGstins.length} GSTINs
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              ) : (
                <span className="px-2 py-1 font-bold text-slate-800 font-mono">
                  {selectedGstin}
                </span>
              )}

              {/* Copy GSTIN Button */}
              <button
                onClick={(e) => handleCopy(e, selectedGstin, "GSTIN")}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border-l border-slate-200 transition"
                title="Copy Full 15-Digit GSTIN"
              >
                {copiedKey === "GSTIN" ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Multi-GSTIN Selector Menu */}
            {isGstinDropdownOpen && availableGstins.length > 1 && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  Select GST Registration ({availableGstins.length} States)
                </span>
                {availableGstins.map((reg) => (
                  <button
                    key={reg.gstin}
                    onClick={() => {
                      selectGstin(reg.gstin);
                      setIsGstinDropdownOpen(false);
                      toast.success("GSTIN Switched", `Active state registration: ${reg.stateName} (${reg.gstin})`);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                      reg.gstin === selectedGstin
                        ? "bg-red-50 text-btred-logo font-black"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-slate-800 font-sans">
                        {reg.stateName} ({reg.stateCode})
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">{reg.gstin}</span>
                    </div>
                    {reg.gstin === selectedGstin && <Check className="w-3.5 h-3.5 text-btred-logo" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Financial Year Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setIsFyDropdownOpen(!isFyDropdownOpen)}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs transition"
            title="Switch Statutory Financial Year"
          >
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>FY {selectedFy}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isFyDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Financial Year
              </span>
              {availableFys.map((fy) => (
                <button
                  key={fy}
                  onClick={() => {
                    selectFy(fy);
                    setIsFyDropdownOpen(false);
                    toast.info("Financial Year Updated", `Context set to FY ${fy}.`);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    fy === selectedFy ? "bg-red-50 text-btred-logo" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>FY {fy}</span>
                  {fy === selectedFy && <Check className="w-3 h-3 text-btred-logo" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Context Button (Return to Firm-Wide) */}
        {selectedClient && !isFirmWideView && (
          <button
            onClick={handleSwitchToFirmWide}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold transition"
            title="Clear client selection (Switch to Firm-Wide Practice View)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      )}

      {/* UNIVERSAL CLIENT SEARCH & SELECTION MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            ref={modalRef}
            onKeyDown={handleKeyDown}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-50 text-btred-logo border border-red-200">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 leading-tight">
                      Universal Assessee Selector
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Search across 10,000+ corporate clients, multi-state GSTINs, PANs, and promoter contacts
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by full client name, 15-digit GSTIN, PAN, phone number, client code..."
                  className="w-full bg-white border border-slate-300 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 shadow-2xs"
                />
                {isLoading && (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
                {!isLoading && searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter Pills & Firm-Wide Shortcut */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                  {["ALL", "PVT_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "INDIVIDUAL_HNI"].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTypeFilter(t);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-xl font-bold transition text-[11px] ${
                        typeFilter === t
                          ? "bg-slate-900 text-white"
                          : "bg-white hover:bg-slate-200 border border-slate-200 text-slate-600"
                      }`}
                    >
                      {t === "ALL" ? "All Types" : t.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {/* 1-Click Switch to Firm-Wide */}
                <button
                  onClick={handleSwitchToFirmWide}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl transition"
                >
                  <Briefcase className="w-3 h-3 text-indigo-600" />
                  <span>View All Clients (Firm-Wide)</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Results or Recent Clients */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* If no search query -> Show Recently Accessed Clients */}
              {!searchQuery && recentClients.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    <History className="w-3.5 h-3.5" />
                    <span>Recently Accessed Clients ({recentClients.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recentClients.map((client, idx) => (
                      <div
                        key={client.id}
                        onClick={() => handlePickClient(client)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                          selectedClient?.id === client.id
                            ? "bg-red-50/70 border-red-300"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-xs text-slate-900 line-clamp-1">
                            {client.name}
                          </span>
                          <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                            {client.type.replace("_", " ")}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span>PAN: {client.pan}</span>
                          {client.gstin && (
                            <span className="text-slate-700 font-bold">
                              {client.gstin.substring(0, 2)} State
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>
                    {searchQuery ? `Search Results (${totalCount})` : "Active Client Roster"}
                  </span>
                  {totalPages > 1 && (
                    <span>
                      Page {page} of {totalPages}
                    </span>
                  )}
                </div>

                {isLoading && searchResults.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-btred-logo animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Searching practice directory...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-12 text-center space-y-2 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No client matches found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No assessees matching &ldquo;{searchQuery}&rdquo;. Try searching by full PAN (e.g. AAACT2727Q) or 15-digit GSTIN.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((client, idx) => {
                      const isSelected = selectedIndex === idx;
                      const isCurrent = selectedClient?.id === client.id;
                      const hasMultiGstin = client.gstinRecords && client.gstinRecords.length > 1;

                      return (
                        <div
                          key={client.id}
                          onClick={() => handlePickClient(client)}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                            isCurrent
                              ? "bg-red-50/50 border-red-300 ring-1 ring-red-400"
                              : isSelected
                              ? "bg-slate-50 border-slate-300 shadow-xs"
                              : "bg-white hover:bg-slate-50/80 border-slate-200"
                          }`}
                        >
                          {/* Client Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-black text-slate-900 leading-tight">
                                  {client.name}
                                </h3>
                                {client.tradeName && client.tradeName !== client.name && (
                                  <span className="text-xs font-semibold text-slate-500">
                                    t/a {client.tradeName}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Client Code: <span className="font-mono font-bold text-slate-700">{client.id}</span>
                                {client.groupName && (
                                  <> &bull; Group: <span className="font-semibold text-slate-700">{client.groupName}</span></>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                {client.type.replace("_", " ")}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-red-100 text-btred-logo border border-red-200">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Identifiers Grid (PAN & All GSTINs) */}
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {/* PAN */}
                            <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                              <span className="text-[10px] text-slate-400 font-bold">PAN</span>
                              <span className="font-mono font-bold text-slate-800">{client.pan}</span>
                              <button
                                onClick={(e) => handleCopy(e, client.pan, "PAN")}
                                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
                                title="Copy PAN"
                              >
                                {copiedKey === "PAN" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            {/* GSTINs */}
                            {client.gstinRecords && client.gstinRecords.length > 0 ? (
                              client.gstinRecords.map((reg) => (
                                <div
                                  key={reg.gstin}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePickClient(client, reg.gstin);
                                  }}
                                  className="inline-flex items-center gap-1 bg-blue-50/60 border border-blue-200 px-2 py-1 rounded-xl hover:bg-blue-100/70 transition"
                                  title={`Click to select this ${reg.stateName} GSTIN`}
                                >
                                  <span className="text-[10px] text-blue-700 font-bold">{reg.stateCode} {reg.stateName}</span>
                                  <span className="font-mono font-bold text-slate-900">{reg.gstin}</span>
                                  <button
                                    onClick={(e) => handleCopy(e, reg.gstin, "GSTIN")}
                                    className="p-0.5 hover:bg-blue-200 rounded text-blue-500 hover:text-blue-800"
                                    title="Copy GSTIN"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ))
                            ) : client.gstin ? (
                              <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                                <span className="text-[10px] text-slate-400 font-bold">GSTIN</span>
                                <span className="font-mono font-bold text-slate-800">{client.gstin}</span>
                                <button
                                  onClick={(e) => handleCopy(e, client.gstin || "", "GSTIN")}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
                                  title="Copy GSTIN"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : null}

                            {/* Turnover */}
                            {client.turnoverCr && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                ₹{client.turnoverCr} Cr Turnover
                              </span>
                            )}
                          </div>

                          {/* Contact & In-Charge Footer */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <div>
                              <span>Contact: </span>
                              <span className="font-semibold text-slate-700">
                                {client.primaryContact?.name} ({client.primaryContact?.phone})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-indigo-700 font-semibold">
                              <span>Partner: {client.partnerInCharge}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer: Pagination & Keyboard Help */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <div className="hidden sm:flex items-center gap-2 text-[11px]">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono font-bold">↑↓</kbd>
                <span>Navigate</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono font-bold">Enter</kbd>
                <span>Select</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono font-bold">Esc</kbd>
                <span>Close</span>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-bold"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-slate-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-bold"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
