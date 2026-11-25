"use client";

import React, { useState } from "react";
import { useClientContext } from "@/lib/context/ClientContext";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import {
  Building2,
  Check,
  Copy,
  ChevronDown,
  X,
  Calendar,
} from "lucide-react";

interface UniversalClientSelectorProps {
  className?: string;
  variant?: "topbar" | "compact" | "full" | "floating";
  onClientSelected?: (client: ClientEntity) => void;
}

/**
 * Lightweight inline client/GSTIN/FY badge wired directly to the unified TopNav Command Switcher.
 * Eliminates duplicate modal state and keeps all workbenches synchronized with ClientContext.
 */
export const UniversalClientSelector: React.FC<UniversalClientSelectorProps> = ({
  className = "",
  variant = "compact",
}) => {
  const {
    selectedClient,
    selectedGstin,
    selectedFy,
    availableFys,
    isFirmWideView,
    selectGstin,
    selectFy,
    clearClientContext,
    availableGstins,
    openCommandPalette,
  } = useClientContext();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGstinDropdownOpen, setIsGstinDropdownOpen] = useState(false);
  const [isFyDropdownOpen, setIsFyDropdownOpen] = useState(false);

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success("Copied", `${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className={`relative flex items-center gap-1.5 flex-wrap ${className}`}>
      <div className="flex items-center bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1 shadow-2xs transition">
        <button
          type="button"
          onClick={() => openCommandPalette("CLIENTS")}
          className="flex items-center gap-2 text-left hover:opacity-85 transition group"
          title="Switch active client"
        >
          <Building2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-btred-logo transition shrink-0" />
          <span className="text-xs font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
            {selectedClient && !isFirmWideView ? selectedClient.tradeName || selectedClient.name : "All Clients"}
          </span>
          {selectedClient && !isFirmWideView && (selectedGstin || selectedClient.gstin) && (
            <>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                {selectedGstin || selectedClient.gstin}
              </span>
            </>
          )}
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
        </button>

        {selectedClient && !isFirmWideView && (selectedGstin || selectedClient.gstin) && (
          <button
            type="button"
            onClick={(e) => handleCopy(e, (selectedGstin || selectedClient.gstin)!, "GSTIN")}
            className="p-1 ml-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
            title="Copy GSTIN"
          >
            {copiedKey === "GSTIN" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        )}

        {availableGstins.length > 1 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsGstinDropdownOpen((o) => !o)}
              className="text-[10px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-lg ml-1 flex items-center gap-0.5"
            >
              <span>{availableGstins.length} States</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
            {isGstinDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50">
                {availableGstins.map((g) => (
                  <button
                    key={g.gstin}
                    type="button"
                    onClick={() => {
                      selectGstin(g.gstin);
                      setIsGstinDropdownOpen(false);
                      toast.success("GSTIN Switched", `${g.stateName} (${g.gstin})`);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${
                      selectedGstin === g.gstin ? "bg-blue-50 font-bold" : ""
                    }`}
                  >
                    <div>
                      <div className="font-mono text-slate-900">{g.gstin}</div>
                      <div className="text-[10px] text-slate-500">
                        {g.stateName} ({g.stateCode})
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

      {variant !== "compact" && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFyDropdownOpen((o) => !o)}
            className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700"
          >
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>FY {selectedFy}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {isFyDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50">
              {availableFys.map((fy) => (
                <button
                  key={fy}
                  type="button"
                  onClick={() => {
                    selectFy(fy);
                    setIsFyDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded-lg text-xs font-bold flex items-center justify-between ${
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
      )}

      {selectedClient && !isFirmWideView && (
        <button
          type="button"
          onClick={() => clearClientContext()}
          className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          title="Return to All Clients view"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
