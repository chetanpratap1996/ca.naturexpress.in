"use client";

import React from "react";
import {
  Calendar,
  FileSpreadsheet,
  Calculator,
  Scale,
  CreditCard,
  Users,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export type DomainId = 
  | "tasks" 
  | "gst" 
  | "tax-audit" 
  | "notices-udin" 
  | "billing-wip" 
  | "client-master";

export interface DomainItem {
  id: DomainId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badgeCount?: number;
  badgeColor?: string;
  description: string;
  defaultTab: string;
  shortcut: string;
}

export const DOMAINS: DomainItem[] = [
  {
    id: "tasks",
    label: "Tasks & Deadlines",
    shortLabel: "Tasks",
    icon: Calendar,
    description: "Statutory calendar, batch return dispatcher & records",
    defaultTab: "tasks-matrix",
    shortcut: "Alt+1"
  },
  {
    id: "gst",
    label: "GST Suite",
    shortLabel: "GST",
    icon: FileSpreadsheet,
    description: "GSTR-2B matcher, vendor ITC watchdog & bank OCR",
    defaultTab: "gst-filing",
    shortcut: "Alt+2"
  },
  {
    id: "tax-audit",
    label: "Income Tax & Audit",
    shortLabel: "Tax & Audit",
    icon: Calculator,
    description: "ITR 115BAC, Form 3CD workpapers & Schedule III",
    defaultTab: "itr-matrix",
    shortcut: "Alt+3"
  },
  {
    id: "notices-udin",
    label: "Notices & UDIN",
    shortLabel: "Notices",
    icon: Scale,
    description: "Scrutiny defense, assessee approvals & 60-day UDIN",
    defaultTab: "notices",
    shortcut: "Alt+4"
  },
  {
    id: "billing-wip",
    label: "Billing & WIP",
    shortLabel: "Billing",
    icon: CreditCard,
    description: "Pay-to-Release fee gate, unbilled WIP & collections",
    defaultTab: "billing-matrix",
    shortcut: "Alt+5"
  },
  {
    id: "client-master",
    label: "Client Master & Desk",
    shortLabel: "Clients",
    icon: Users,
    description: "Entity DNA, WhatsApp communication & DSC vault",
    defaultTab: "client-master",
    shortcut: "Alt+6"
  }
];

interface DomainRailProps {
  activeDomain: DomainId;
  onSelectDomain: (domainId: DomainId) => void;
  urgentTaskCount?: number;
  activeNoticeCount?: number;
}

export const DomainRail: React.FC<DomainRailProps> = ({
  activeDomain,
  onSelectDomain,
  urgentTaskCount = 0,
  activeNoticeCount = 0
}) => {
  return (
    <aside 
      aria-label="Practice Domains"
      className="hidden lg:flex flex-col w-56 xl:w-64 bg-white border-r border-slate-200 shrink-0 select-none py-3 px-2.5 space-y-1.5"
    >
      <div className="px-2.5 py-1.5 mb-1 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
          Practice Domains
        </span>
        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
          6 Hubs
        </span>
      </div>

      <nav className="space-y-1 flex-1">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const isActive = activeDomain === domain.id;

          // Compute dynamic badges
          let badge = domain.badgeCount;
          let badgeColor = "bg-slate-100 text-slate-600";
          if (domain.id === "tasks" && urgentTaskCount > 0) {
            badge = urgentTaskCount;
            badgeColor = "bg-red-500 text-white animate-pulse";
          } else if (domain.id === "notices-udin" && activeNoticeCount > 0) {
            badge = activeNoticeCount;
            badgeColor = "bg-amber-500 text-white";
          }

          return (
            <button
              key={domain.id}
              onClick={() => onSelectDomain(domain.id)}
              className={`w-full group text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between relative ${
                isActive
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-bold"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-medium"
              }`}
              title={`${domain.label} (${domain.shortcut}): ${domain.description}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs truncate block leading-snug">
                    {domain.label}
                  </span>
                  <span className={`text-[10px] truncate block ${isActive ? "text-slate-300" : "text-slate-600"}`}>
                    {domain.shortLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1.5">
                {badge !== undefined && badge > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                    {badge}
                  </span>
                )}
                <ChevronRight 
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? "text-white opacity-100 translate-x-0.5" : "text-slate-400 opacity-0 group-hover:opacity-100"
                  }`} 
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Practice Quick Status */}
      <div className="pt-2 border-t border-slate-100 px-2 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-slate-800">GSTN / ITD Live</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-600 font-bold">100% OK</span>
        </div>
      </div>
    </aside>
  );
};
