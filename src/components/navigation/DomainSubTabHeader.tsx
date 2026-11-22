"use client";

import React from "react";
import { DomainId, DOMAINS } from "./DomainRail";
import {
  Calendar,
  Lock,
  ShieldAlert,
  TrendingUp,
  FileSpreadsheet,
  FileSearch,
  Calculator,
  ClipboardCheck,
  Layers,
  KeyRound,
  Scale,
  FileCheck,
  Video,
  DollarSign,
  MessageSquare,
  Award,
  Fingerprint,
  Package,
  Sparkles,
  Users
} from "lucide-react";

export interface SubTabItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const DOMAIN_SUBTABS: Record<DomainId, SubTabItem[]> = {
  tasks: [
    { id: "tasks-matrix", label: "Tasks & Deadlines Command Center", shortLabel: "Task Center", icon: ClipboardCheck },
    { id: "staff-master", label: "Team & Article Trainee Master", shortLabel: "Team & Ranking", icon: Users },
    { id: "calendar", label: "Statutory Tax Deadlines", shortLabel: "Deadlines", icon: Calendar },
    { id: "autonomous-orchestrator", label: "8-Pillar Universal Orchestrator", shortLabel: "8-Pillar Mesh", icon: Sparkles },
    { id: "batch-dispatch", label: "Batch Return Dispatcher", shortLabel: "Batch Dispatch", icon: Sparkles },
    { id: "inward-outward", label: "Dispatches & Letters Register", shortLabel: "Inward/Outward", icon: Package }
  ],
  gst: [
    { id: "gst-filing", label: "GST Operations & In-Flow Filing Desk", shortLabel: "Filing Desk", icon: FileCheck },
    { id: "pillar-one-gst", label: "Pillar 1 GST Enterprise Workbench", shortLabel: "Pillar 1 GST", icon: Layers },
    { id: "gst-ims", label: "GST Invoice Management System (IMS)", shortLabel: "IMS Desk", icon: ClipboardCheck },
    { id: "gstr2b", label: "GSTR-2B Auto-Reconciler", shortLabel: "2B Matcher", icon: FileSpreadsheet },
    { id: "entity-dna", label: "GSTIN & Entity DNA Matrix", shortLabel: "Entity DNA", icon: Layers }
  ],
  "tax-audit": [
    { id: "itr-matrix", label: "ITR & Audit Operations Matrix", shortLabel: "ITR Operations", icon: FileCheck },
    { id: "pillar-two-tax", label: "Pillar 2 Direct Tax & 115BAC Workbench", shortLabel: "Pillar 2 Tax", icon: Calculator },
    { id: "pillar-three-audit", label: "Pillar 3 Form 3CD & Cl. 31 Audit", shortLabel: "Pillar 3 Audit", icon: ClipboardCheck },
    { id: "pillar-five-tds", label: "Pillar 5 TDS / TRACES & 15CA/CB", shortLabel: "Pillar 5 TDS", icon: FileCheck },
    { id: "schedule3-audit", label: "Schedule III Audit & Financials", shortLabel: "Schedule III", icon: Layers },
    { id: "ais-analyzer", label: "AIS / 26AS SFT Inspector", shortLabel: "AIS / 26AS", icon: FileSearch },
    { id: "engagement-letter", label: "Engagement Letters (SA 210)", shortLabel: "SA 210 Letter", icon: FileCheck }
  ],
  "notices-udin": [
    { id: "notices", label: "Active Scrutiny Notices & Case Docket", shortLabel: "Notice Docket", icon: ShieldAlert },
    { id: "pillar-six-mca", label: "Pillar 6 MCA V3, DPT-3 & Secretarial Desk", shortLabel: "Pillar 6 MCA", icon: Scale },
    { id: "notice-drafter", label: "Statutory Notice Reply Drafter", shortLabel: "Reply Drafter", icon: Scale },
    { id: "assessee-approval", label: "Assessee Legal Sign-off Desk", shortLabel: "Assessee Sign", icon: FileCheck },
    { id: "udin-vault", label: "UDIN 60-Day Compliance Vault", shortLabel: "UDIN Vault", icon: KeyRound },
    { id: "peer-review", label: "Audit Quality & Peer Review", shortLabel: "Peer Review", icon: Award }
  ],
  "billing-wip": [
    { id: "billing-matrix", label: "Practice Billing & Realization Matrix", shortLabel: "Billing Matrix", icon: DollarSign },
    { id: "pillar-eight-desktop", label: "Pillar 8 Tally Desktop Bridge (Port 9000)", shortLabel: "Tally Bridge", icon: Sparkles },
    { id: "bank-parser", label: "Bank Statement OCR to Tally", shortLabel: "Bank Parser", icon: FileSpreadsheet },
    { id: "bank-audit", label: "Bank Audit & Working Capital", shortLabel: "Bank Audit", icon: Layers },
    { id: "pay-to-release", label: "Fee Release Gate (Pay-to-Release)", shortLabel: "Fee Gate", icon: Lock },
    { id: "anti-poaching", label: "Firm Realization & Insights", shortLabel: "Realization", icon: Fingerprint }
  ],
  "client-master": [
    { id: "client-master", label: "Entity DNA & Client Master", shortLabel: "Client Master", icon: Layers },
    { id: "whatsapp-ai", label: "1-Tap WhatsApp Communication Desk", shortLabel: "WhatsApp Desk", icon: MessageSquare },
    { id: "pillar-seven-governance", label: "Pillar 7 SQC-1 Peer Review Dossier", shortLabel: "Pillar 7 Dossier", icon: Award },
    { id: "vcfo", label: "vCFO Advisory Cockpit", shortLabel: "vCFO Cockpit", icon: TrendingUp },
    { id: "growth-engine", label: "Diagnostic Onboarding & Practice Growth", shortLabel: "Growth Engine", icon: TrendingUp },
    { id: "dsc", label: "Portal Credentials & DSC Tokens", shortLabel: "Keys & DSC Vault", icon: KeyRound },
    { id: "content-studio", label: "CA Creator Content Studio", shortLabel: "Creator Studio", icon: Video }
  ]
};

interface DomainSubTabHeaderProps {
  activeDomain: DomainId;
  activeSubTab: string;
  onSelectDomain: (domain: DomainId) => void;
  onSelectSubTab: (subTabId: string) => void;
  taskCount?: number;
}

export const DomainSubTabHeader: React.FC<DomainSubTabHeaderProps> = ({
  activeDomain,
  activeSubTab,
  onSelectDomain,
  onSelectSubTab,
  taskCount = 0
}) => {
  const currentDomainInfo = DOMAINS.find((d) => d.id === activeDomain) || DOMAINS[0];
  const subTabs = DOMAIN_SUBTABS[activeDomain] || [];

  return (
    <div className="w-full space-y-3">
      {/* Mobile Domain Selector (visible only < lg) */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {DOMAINS.map((dom) => {
          const isSelected = activeDomain === dom.id;
          const Icon = dom.icon;
          return (
            <button
              key={dom.id}
              onClick={() => onSelectDomain(dom.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
                isSelected
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{dom.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tabs Navigation Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-2 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none touch-pan-x flex-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectSubTab(tab.id)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-btred-logo text-white shadow-sm shadow-red-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-600 border-l border-slate-200 pl-3 pr-2 shrink-0">
          <span className="font-semibold text-slate-800">{currentDomainInfo.label}</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
            {subTabs.length} Tools
          </span>
        </div>
      </div>
    </div>
  );
};
