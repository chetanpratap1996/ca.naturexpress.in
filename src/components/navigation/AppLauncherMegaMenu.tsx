"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  NAV_CATEGORIES, 
  ALL_NAV_ITEMS, 
  NavItem, 
  NavCategory 
} from "@/lib/navigation/navigationItems";
import { 
  Search, 
  X, 
  Grid, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Command,
  LayoutDashboard
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface AppLauncherMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const AppLauncherMegaMenu: React.FC<AppLauncherMegaMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Global ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return ALL_NAV_ITEMS;
    const q = searchQuery.toLowerCase().trim();
    return ALL_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.shortLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
      />

      {/* Modal Container */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="CA Practice App Launcher"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-btred-logo text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Workspaces Directory
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  All Modules
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {DEFAULT_FIRM_BRANDING.firmName} &bull; Practice Navigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input in Header */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to any tool..."
                className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6-Column Panoramic Matrix Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
            {NAV_CATEGORIES.map((category) => {
              const categoryItems = filteredItems.filter(
                (item) => item.categoryId === category.id
              );

              if (categoryItems.length === 0) return null;

              const CategoryIcon = category.icon;

              return (
                <div 
                  key={category.id}
                  className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    {/* Category Column Title */}
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        <CategoryIcon className="w-3.5 h-3.5 text-slate-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-black text-slate-900 truncate">
                          {category.shortName}
                        </h3>
                        <p className="text-[10px] text-slate-500 truncate">
                          {categoryItems.length} workspaces
                        </p>
                      </div>
                    </div>

                    {/* Tools in this Column */}
                    <div className="pt-2 space-y-1.5">
                      {categoryItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onSelectTab(item.id);
                              onClose();
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all duration-150 group flex flex-col gap-1 ${
                              isActive
                                ? "bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/20"
                                : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : item.iconColor}`} />
                                <span className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-900 group-hover:text-btred-logo"}`}>
                                  {item.shortLabel}
                                </span>
                              </div>

                              {item.badge && (
                                <span
                                  className={`text-[8px] font-extrabold uppercase px-1 py-0.5 rounded shrink-0 ${
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : item.badgeColor || "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            <p className={`text-[10px] line-clamp-2 leading-tight ${isActive ? "text-red-100" : "text-slate-500"}`}>
                              {item.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              Tip: Press <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold text-slate-600">Esc</kbd> to close
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">
              Press <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold text-slate-600">⌘K</kbd> for Universal Search
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
