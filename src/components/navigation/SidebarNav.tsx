"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  NAV_CATEGORIES, 
  ALL_NAV_ITEMS, 
  NavItem, 
  NavCategory 
} from "@/lib/navigation/navigationItems";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Grid, 
  Users, 
  PhoneCall, 
  Sparkles,
  ChevronDown,
  LayoutDashboard
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface SidebarNavProps {
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  onOpenAppLauncher?: () => void;
  onOpenClientMaster?: () => void;
  clientCount?: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onNavigateTab,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  onOpenAppLauncher,
  onOpenClientMaster,
  clientCount = 0
}) => {
  // Desktop collapsed/expanded state (defaults to expanded, saved in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("bt_ca_sidebar_collapsed");
        return stored === "true";
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  // Filter query in sidebar
  const [searchQuery, setSearchQuery] = useState("");

  // Category collapsed state for accordion (all open by default)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("bt_ca_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  // Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar collapse & Custom Event from TopNav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    const handleExternalToggle = () => {
      handleToggleCollapse();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("bt-toggle-sidebar", handleExternalToggle);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("bt-toggle-sidebar", handleExternalToggle);
    };
  }, []);

  // Filtered items based on search query
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

  const handleSelectTab = (tabId: string) => {
    onNavigateTab(tabId);
    onCloseMobileDrawer();
  };

  // Content for both Desktop and Mobile Drawer
  const renderSidebarContent = (isMobile: boolean = false) => {
    const collapsedMode = !isMobile && isCollapsed;

    return (
      <div className="flex flex-col h-full select-none bg-white border-r border-slate-200">
        {/* Top Header */}
        <div className="h-14 sm:h-16 px-3 flex items-center justify-between border-b border-slate-200 shrink-0">
          {!collapsedMode ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-btred-logo text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                CA
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-900 block truncate leading-tight">
                  Workspaces
                </span>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  Practice Navigation
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-btred-logo text-white flex items-center justify-center font-black text-xs shadow-sm">
                CA
              </div>
            </div>
          )}

          {/* Toggle Button for Desktop */}
          {!isMobile && (
            <button
              onClick={handleToggleCollapse}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
              title={isCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
              aria-label="Toggle Sidebar"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Close Button for Mobile Drawer */}
          {isMobile && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick App Launcher Button */}
        {onOpenAppLauncher && (
          <div className="p-2 border-b border-slate-100 shrink-0">
            <button
              onClick={() => {
                onOpenAppLauncher();
                if (isMobile) onCloseMobileDrawer();
              }}
              className={`w-full flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold transition text-xs ${
                collapsedMode ? "p-2.5 justify-center" : "px-3 py-2"
              }`}
              title="Open Workspaces Directory (⌘M)"
            >
              <Grid className="w-4 h-4 shrink-0 text-btred-logo" />
              {!collapsedMode && (
                <div className="flex items-center justify-between w-full">
                  <span>Directory &amp; Mega Menu</span>
                  <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                    ⌘M
                  </span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Search Bar (Only when expanded) */}
        {!collapsedMode && (
          <div className="p-2.5 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tools..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Categories & Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 scrollbar-thin">
          {NAV_CATEGORIES.map((category) => {
            const categoryItems = filteredItems.filter((i) => i.categoryId === category.id);
            if (categoryItems.length === 0) return null;

            const isCatCollapsed = !searchQuery && collapsedCategories[category.id];

            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                {!collapsedMode ? (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 transition group"
                  >
                    <span className="truncate">{category.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600">
                        {categoryItems.length}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 text-slate-400 transition-transform ${
                          isCatCollapsed ? "-rotate-90" : ""
                        }`}
                      />
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-px bg-slate-200 my-2" />
                )}

                {/* Items in Category */}
                {(!isCatCollapsed || collapsedMode) && (
                  <div className="space-y-0.5">
                    {categoryItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      if (collapsedMode) {
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full flex justify-center items-center py-2.5 rounded-xl transition group relative ${
                              isActive
                                ? "bg-btred-logo text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                            title={`${item.label} - ${item.description}`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.iconColor}`} />
                            {/* Hover tooltip */}
                            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50">
                              {item.label}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition text-left relative ${
                            isActive
                              ? "bg-gradient-to-r from-red-600 to-btred-logo text-white shadow-sm shadow-red-600/20 font-black"
                              : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : item.iconColor}`} />
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : item.badgeColor || "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2 border-t border-slate-200 shrink-0 bg-slate-50/70">
          {!collapsedMode ? (
            <div className="space-y-1">
              {onOpenClientMaster && (
                <button
                  onClick={() => {
                    onOpenClientMaster();
                    if (isMobile) onCloseMobileDrawer();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Client Master</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {clientCount} Entities
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              {onOpenClientMaster && (
                <button
                  onClick={onOpenClientMaster}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                  title="Client Master"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ======================================================= */}
      {/* 1. DESKTOP PERMANENT / COLLAPSIBLE SIDEBAR (lg and up)   */}
      {/* ======================================================= */}
      <aside
        className={`hidden lg:block shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 transition-all duration-300 z-30 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* ======================================================= */}
      {/* 2. MOBILE & TABLET SLIDE-OVER DRAWER (< lg)              */}
      {/* ======================================================= */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobileDrawer}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in"
          />

          {/* Drawer content */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
