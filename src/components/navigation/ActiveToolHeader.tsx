"use client";

import React, { useState } from "react";
import { getNavItemById, NAV_CATEGORIES } from "@/lib/navigation/navigationItems";
import { ClientEntity } from "@/lib/types";
import { 
  ArrowLeft, 
  Grid, 
  Building2, 
  Calendar, 
  Sparkles, 
  ChevronRight,
  Maximize2,
  Minimize2,
  ExternalLink
} from "lucide-react";

interface ActiveToolHeaderProps {
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
  onOpenAppLauncher: () => void;
  clients?: ClientEntity[];
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
}

export const ActiveToolHeader: React.FC<ActiveToolHeaderProps> = ({
  activeTab,
  onNavigateTab,
  onOpenAppLauncher,
  clients = [],
  selectedClientId,
  onSelectClient
}) => {
  const item = getNavItemById(activeTab);
  const category = NAV_CATEGORIES.find((c) => c.id === item?.categoryId);
  const Icon = item?.icon || Building2;
  const CategoryIcon = category?.icon || Sparkles;

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
      {/* Left: Breadcrumbs & Active Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap sm:flex-nowrap">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => onNavigateTab("dashboard")}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition shrink-0 group shadow-2xs"
          title="Return to Master Executive Dashboard (⌘H)"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0" />

        {/* Category Pill */}
        {category && (
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200 shrink-0">
            <CategoryIcon className="w-3 h-3 text-slate-500" />
            <span>{category.shortName}</span>
          </span>
        )}

        {category && <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden lg:block shrink-0" />}

        {/* Active Tool Label & Icon */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-red-50 text-btred-logo border border-red-200 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <h1 className="text-sm sm:text-base font-black text-slate-900 truncate tracking-tight">
            {item?.label || activeTab}
          </h1>

          {item?.badge && (
            <span
              className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 hidden sm:inline ${
                item.badgeColor || "bg-red-50 text-btred-logo border border-red-200"
              }`}
            >
              {item.badge}
            </span>
          )}
        </div>
      </div>

      {/* Right: Context Switcher & Workspace Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap sm:flex-nowrap">
        {/* Quick Client Entity Selector if multiple clients exist */}
        {clients.length > 0 && onSelectClient && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedClientId || clients[0]?.id}
              onChange={(e) => onSelectClient(e.target.value)}
              className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none max-w-[140px] sm:max-w-[200px] truncate"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Fullscreen Focus Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition hidden sm:flex items-center justify-center shrink-0"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Focus Mode"}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>

        {/* 6-Column Mega Menu Quick Launch Button */}
        <button
          onClick={onOpenAppLauncher}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-btred-logo border border-red-200 text-xs font-black transition shadow-2xs shrink-0"
          title="Open 6-Column Panoramic App Launcher (⌘M)"
        >
          <Grid className="w-3.5 h-3.5 text-btred-logo" />
          <span className="hidden sm:inline">All Workspaces</span>
          <span className="sm:hidden">Launcher</span>
        </button>
      </div>
    </div>
  );
};
