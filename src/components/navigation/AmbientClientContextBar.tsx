"use client";

import React from "react";
import { ClientEntity, ClientGroup, DscRecord } from "@/lib/types";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
import { useClientContext } from "@/lib/context/ClientContext";
import { 
  Building2, 
  KeyRound, 
  ExternalLink,
  UserCheck,
  Briefcase
} from "lucide-react";

interface AmbientClientContextBarProps {
  clients?: ClientEntity[];
  groups?: ClientGroup[];
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
  dscTokens?: DscRecord[];
  onNavigateTab?: (tab: string) => void;
}

export const AmbientClientContextBar: React.FC<AmbientClientContextBarProps> = ({
  clients = [],
  groups = [],
  dscTokens = [],
  onNavigateTab
}) => {
  const { selectedClient, isFirmWideView } = useClientContext();

  const clientDsc = selectedClient
    ? dscTokens.find(
        (d) =>
          d.entityId === selectedClient.id ||
          d.entityName.toLowerCase() === selectedClient.name.toLowerCase()
      )
    : null;

  return (
    <div className="relative z-30 bg-white border-y border-slate-200/90 shadow-2xs px-3.5 sm:px-6 lg:px-8 py-2">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs">
        {/* Left: Universal Client Selector & Context Controller */}
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <UniversalClientSelector variant="topbar" />
        </div>

        {/* Right: Live Statutory & Practice Health Indicators */}
        {selectedClient && !isFirmWideView ? (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Partner & Article in Charge */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-600">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-bold">{selectedClient.partnerInCharge}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-500 font-medium">{selectedClient.assignedArticle}</span>
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
        ) : (
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>Firm-Wide Mode: Aggregated tasks, filings, and receivables for all clients</span>
          </div>
        )}
      </div>
    </div>
  );
};
