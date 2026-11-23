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
  ChevronRight,
  Sparkles
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

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

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
        className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="CA Practice Workspaces Directory"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-btred-logo text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Workspaces Directory
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                  {ALL_NAV_ITEMS.length} Modules
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {DEFAULT_FIRM_BRANDING.firmName} &bull; Practice Navigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-56 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools by name, return or law..."
                className="w-full pl-9 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Spacious 3-Column Grid Body (Plenty of room for un-truncated titles) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {NAV_CATEGORIES.map((category) => {
              const categoryItems = filteredItems.filter(
                (item) => item.categoryId === category.id
              );

              if (categoryItems.length === 0) return null;

              const CategoryIcon = category.icon;

              return (
                <div 
                  key={category.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-2xs space-y-3"
                >
                  <div>
                    {/* Category Title Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                          {category.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {categoryItems.length} tools
                      </span>
                    </div>

                    {/* Tools in this Category */}
                    <div className="pt-2.5 space-y-2">
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
                            className={`w-full p-2.5 rounded-xl border text-left transition-all duration-150 group flex items-start justify-between gap-3 ${
                              isActive
                                ? "bg-red-50 border-red-300 text-red-950 shadow-xs"
                                : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                isActive 
                                  ? "bg-btred-logo text-white" 
                                  : "bg-slate-50 group-hover:bg-white text-slate-600 border border-slate-100 group-hover:border-slate-200"
                              }`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-xs font-bold ${
                                    isActive ? "text-btred-logo" : "text-slate-900 group-hover:text-btred-logo"
                                  }`}>
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <span
                                      className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                        item.badgeColor || "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-1 transition ${
                              isActive ? "text-btred-logo" : "text-slate-300 group-hover:text-slate-500"
                            }`} />
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
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-600">
              Tip: Press <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold text-slate-600">Esc</kbd> to close
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline text-slate-500">
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
