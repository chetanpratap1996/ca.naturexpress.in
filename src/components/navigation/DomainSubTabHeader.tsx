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
  Users,
  Building2,
  LayoutDashboard
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
    { id: "tasks-matrix", label: "Task Center", shortLabel: "Tasks", icon: ClipboardCheck },
    { id: "calendar", label: "Deadlines", shortLabel: "Deadlines", icon: Calendar },
    { id: "batch-dispatch", label: "Batch Dispatch", shortLabel: "Batch", icon: Sparkles },
    { id: "inward-outward", label: "Registers", shortLabel: "Registers", icon: Package },
    { id: "autonomous-orchestrator", label: "Automation & Rules", shortLabel: "Automation", icon: Sparkles },
    { id: "staff-master", label: "Employees", shortLabel: "Employees", icon: Users }
  ],
  gst: [
    { id: "gst-filing", label: "Filing Desk", shortLabel: "Filing", icon: FileCheck },
    { id: "gstr2b", label: "2B Matcher", shortLabel: "2B", icon: FileSpreadsheet },
    { id: "gst-ims", label: "IMS Desk", shortLabel: "IMS", icon: ClipboardCheck },
    { id: "pillar-one-gst", label: "Annual & Audit", shortLabel: "Annual", icon: Layers },
    { id: "entity-dna", label: "GSTIN Master", shortLabel: "GSTINs", icon: Building2 }
  ],
  "tax-audit": [
    { id: "itr-matrix", label: "ITR Matrix", shortLabel: "ITR", icon: FileCheck },
    { id: "ais-analyzer", label: "AIS / 26AS", shortLabel: "AIS", icon: FileSearch },
    { id: "pillar-five-tds", label: "TDS & TRACES", shortLabel: "TDS", icon: FileSpreadsheet },
    { id: "pillar-three-audit", label: "Form 3CD Audit", shortLabel: "3CD", icon: ClipboardCheck },
    { id: "schedule3-audit", label: "Schedule III", shortLabel: "Sched III", icon: Layers },
    { id: "pillar-two-tax", label: "Capital Gains & Schedules", shortLabel: "Schedules", icon: Calculator },
    { id: "engagement-letter", label: "Engagement Letters", shortLabel: "Letters", icon: FileCheck }
  ],
  "notices-udin": [
    { id: "notices", label: "Notice Docket", shortLabel: "Notices", icon: ShieldAlert },
    { id: "notice-drafter", label: "Reply Drafter", shortLabel: "Replies", icon: Scale },
    { id: "udin-vault", label: "UDIN Vault", shortLabel: "UDIN", icon: KeyRound },
    { id: "assessee-approval", label: "Assessee Sign", shortLabel: "Sign-off", icon: FileCheck },
    { id: "pillar-six-mca", label: "MCA & Secretarial", shortLabel: "MCA", icon: Building2 },
    { id: "peer-review", label: "Peer Review", shortLabel: "Peer Review", icon: Award }
  ],
  "billing-wip": [
    { id: "billing-matrix", label: "Billing Matrix", shortLabel: "Billing", icon: DollarSign },
    { id: "pillar-eight-desktop", label: "Tally Bridge", shortLabel: "Tally", icon: Sparkles },
    { id: "bank-parser", label: "Bank Parser", shortLabel: "Parser", icon: FileSpreadsheet },
    { id: "bank-audit", label: "Bank Audit", shortLabel: "Audit", icon: Layers },
    { id: "pay-to-release", label: "Pay-to-Release", shortLabel: "Pay Gate", icon: Lock },
    { id: "anti-poaching", label: "Insights", shortLabel: "Insights", icon: Fingerprint }
  ],
  "client-master": [
    { id: "client-master", label: "Client Master", shortLabel: "Clients", icon: Layers },
    { id: "whatsapp-ai", label: "WhatsApp Desk", shortLabel: "WhatsApp", icon: MessageSquare },
    { id: "pillar-seven-governance", label: "SQC-1 Dossier", shortLabel: "SQC-1", icon: Award },
    { id: "vcfo", label: "vCFO Cockpit", shortLabel: "vCFO", icon: TrendingUp },
    { id: "growth-engine", label: "Growth Engine", shortLabel: "Growth", icon: TrendingUp },
    { id: "dsc", label: "DSC & Keys Vault", shortLabel: "Vault", icon: KeyRound },
    { id: "content-studio", label: "Content Studio", shortLabel: "Studio", icon: Video }
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
        <button
          onClick={() => onSelectSubTab("dashboard")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
            activeSubTab === "dashboard"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

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
      </div>
    </div>
  );
};
