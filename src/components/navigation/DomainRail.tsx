"use client";

import React from "react";
import {
  CalendarCheck2,
  Receipt,
  Calculator,
  Scale,
  WalletCards,
  Building2,
  ChevronRight,
  LayoutDashboard,
  Grid
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
    icon: CalendarCheck2,
    description: "Statutory calendar, batch return dispatcher & records",
    defaultTab: "tasks-matrix",
    shortcut: "Alt+1"
  },
  {
    id: "gst",
    label: "GST Suite",
    shortLabel: "GST",
    icon: Receipt,
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
    icon: WalletCards,
    description: "Pay-to-Release fee gate, unbilled WIP & collections",
    defaultTab: "billing-matrix",
    shortcut: "Alt+5"
  },
  {
    id: "client-master",
    label: "Client Master & Desk",
    shortLabel: "Clients",
    icon: Building2,
    description: "Entity DNA, WhatsApp communication & DSC vault",
    defaultTab: "client-master",
    shortcut: "Alt+6"
  }
];

interface DomainRailProps {
  activeDomain: DomainId;
  activeTab?: string;
  onSelectDomain: (domainId: DomainId) => void;
  onSelectTab?: (tabId: string) => void;
  onOpenDirectory?: () => void;
  isCollapsed?: boolean;
  urgentTaskCount?: number;
  activeNoticeCount?: number;
}

export const DomainRail: React.FC<DomainRailProps> = ({
  activeDomain,
  activeTab,
  onSelectDomain,
  onSelectTab,
  onOpenDirectory,
  isCollapsed = false,
  urgentTaskCount = 0,
  activeNoticeCount = 0
}) => {
  return (
    <aside 
      aria-label="Practice Navigation"
      className={`hidden lg:flex flex-col bg-white border-r border-slate-200 shrink-0 select-none py-3 transition-all duration-200 ease-in-out ${
        isCollapsed ? "w-16 px-2" : "w-56 xl:w-60 px-2.5"
      }`}
    >
      <nav className="space-y-1">
        {/* Executive Dashboard Master Link */}
        <button
          onClick={() => onSelectTab ? onSelectTab("dashboard") : onSelectDomain("tasks")}
          className={`w-full group text-left rounded-xl transition-all flex items-center relative ${
            isCollapsed 
              ? "justify-center p-2.5" 
              : "px-3 py-2.5 justify-between"
          } ${
            activeTab === "dashboard"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-bold"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-medium"
          }`}
          title="Dashboard: Firm-wide KPIs & Overview"
        >
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
            <div 
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                activeTab === "dashboard" 
                  ? "bg-white/10 text-white" 
                  : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <span className="text-xs truncate font-bold leading-snug">
                Dashboard
              </span>
            )}
          </div>

          {!isCollapsed && (
            <ChevronRight 
              className={`w-3.5 h-3.5 transition-transform ${
                activeTab === "dashboard" ? "text-white opacity-100 translate-x-0.5" : "text-slate-400 opacity-0 group-hover:opacity-100"
              }`} 
            />
          )}
        </button>

        <div className="my-1.5 h-px bg-slate-100" />

        {/* Section Header */}
        {!isCollapsed && (
          <div className="px-2.5 py-1 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Practice Domains
            </span>
          </div>
        )}

        {/* The 6 Domains (Single-line, clean, no redundant taglines) */}
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const isActive = activeTab !== "dashboard" && activeDomain === domain.id;

          // Compute dynamic badges
          let badge = domain.badgeCount;
          let badgeColor = "bg-slate-100 text-slate-600";
          if (domain.id === "tasks" && urgentTaskCount > 0) {
            badge = urgentTaskCount;
            badgeColor = "bg-red-500 text-white";
          } else if (domain.id === "notices-udin" && activeNoticeCount > 0) {
            badge = activeNoticeCount;
            badgeColor = "bg-amber-500 text-white";
          }

          return (
            <button
              key={domain.id}
              onClick={() => onSelectDomain(domain.id)}
              className={`w-full group text-left rounded-xl transition-all flex items-center relative ${
                isCollapsed 
                  ? "justify-center p-2.5" 
                  : "px-3 py-2 justify-between"
              } ${
                isActive
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-bold"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-medium"
              }`}
              title={`${domain.label} (${domain.shortcut})`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
                <div 
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <span className="text-xs truncate font-semibold leading-none">
                    {domain.label}
                  </span>
                )}
              </div>

              {/* Badges */}
              {isCollapsed ? (
                badge !== undefined && badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )
              ) : (
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
              )}
            </button>
          );
        })}

        {/* Directory (Positioned directly below the domains - no large blank space) */}
        {onOpenDirectory && (
          <div className="pt-2 mt-1 border-t border-slate-100">
            <button
              onClick={onOpenDirectory}
              className={`w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition font-medium text-xs group shadow-2xs flex items-center ${
                isCollapsed 
                  ? "justify-center p-2.5" 
                  : "justify-between px-3 py-2"
              }`}
              title="All Modules & Tools Directory (⌘M)"
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
                <Grid className="w-4 h-4 text-btred-logo shrink-0" />
                {!isCollapsed && (
                  <span className="truncate text-xs font-semibold">Directory</span>
                )}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1 py-0.5 rounded">
                  ⌘M
                </span>
              )}
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
};
