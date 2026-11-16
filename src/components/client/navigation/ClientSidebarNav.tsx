"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  CLIENT_NAV_CATEGORIES, 
  CLIENT_NAV_ITEMS, 
  ClientNavItem, 
  ClientNavCategory 
} from "@/lib/navigation/clientNavigationItems";
import { ClientTabType } from "@/components/client/ClientPortalPwa";
import { ClientEntity } from "@/lib/types";
import { AuthUser } from "@/lib/auth/session";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown,
  Layers,
  PhoneCall,
  UserCheck,
  Check,
  ExternalLink
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface ClientSidebarNavProps {
  activeTab: ClientTabType;
  onNavigateTab: (tabId: ClientTabType) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  entities: ClientEntity[];
  selectedEntityId: string;
  onSelectEntity: (entityId: string) => void;
  currentUser?: AuthUser | null;
  onOpenQuickAction?: () => void;
}

export const ClientSidebarNav: React.FC<ClientSidebarNavProps> = ({
  activeTab,
  onNavigateTab,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
  entities,
  selectedEntityId,
  onSelectEntity,
  currentUser,
  onOpenQuickAction,
}) => {
  // Desktop collapsed state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("bt_client_sidebar_collapsed");
        return stored === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);

  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) || entities[0];
  }, [entities, selectedEntityId]);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("bt_client_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl/Cmd + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return CLIENT_NAV_ITEMS;
    const q = searchQuery.toLowerCase().trim();
    return CLIENT_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.shortLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectTab = (tabId: ClientTabType) => {
    onNavigateTab(tabId);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const renderNavContent = (isMobile: boolean = false) => {
    const collapsedMode = !isMobile && isCollapsed;

    return (
      <div className="flex flex-col h-full bg-white select-none">
        {/* Top Header / Entity Switcher */}
        <div className="p-3.5 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
          {!collapsedMode ? (
            <div className="space-y-2.5">
              {/* Firm & Portal Branding */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-btred-logo flex items-center justify-center text-white font-black text-xs shadow-sm">
                    CA
                  </div>
                  <div className="leading-tight">
                    <span className="text-[11px] font-black tracking-tight text-slate-900 block">
                      CLIENT PORTAL
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Verified Shield Active
                    </span>
                  </div>
                </div>

                {!isMobile && (
                  <button
                    onClick={handleToggleCollapse}
                    title="Collapse Sidebar (Ctrl+B)"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                {isMobile && onCloseMobileDrawer && (
                  <button
                    onClick={onCloseMobileDrawer}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Active Entity Selector Dropdown */}
              {entities.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {selectedEntity?.name || "Select Entity"}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          PAN: {selectedEntity?.pan || "—"}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                        isEntityDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isEntityDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsEntityDropdownOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-40 max-h-56 overflow-y-auto p-1 text-xs">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Group Entities ({entities.length})
                        </div>
                        {entities.map((ent) => {
                          const isSelected = ent.id === selectedEntityId;
                          return (
                            <button
                              key={ent.id}
                              onClick={() => {
                                onSelectEntity(ent.id);
                                setIsEntityDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition ${
                                isSelected
                                  ? "bg-red-50 text-btred-logo font-bold"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="truncate text-xs">{ent.name}</p>
                                <p className="text-[10px] opacity-70 font-mono">
                                  {ent.pan} {ent.type ? `• ${ent.type.replace(/_/g, " ")}` : ""}
                                </p>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-btred-logo shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Collapsed Mode Top Icon */
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleToggleCollapse}
                title="Expand Sidebar (Ctrl+B)"
                className="w-9 h-9 rounded-xl bg-btred-logo flex items-center justify-center text-white shadow-sm hover:scale-105 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search Bar (When Expanded) */}
        {!collapsedMode && (
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tools, receipts, risk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-btred-logo focus:bg-white transition"
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

        {/* Navigation Categories and Items */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
          {CLIENT_NAV_CATEGORIES.map((category) => {
            const categoryItems = filteredItems.filter((i) => i.categoryId === category.id);
            if (categoryItems.length === 0) return null;

            const isCatCollapsed = !searchQuery && collapsedCategories[category.id];

            return (
              <div key={category.id} className="space-y-0.5">
                {/* Category Header */}
                {!collapsedMode && (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 rounded transition group"
                  >
                    <span>{category.name}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isCatCollapsed ? "-rotate-90" : ""
                      }`}
                    />
                  </button>
                )}

                {/* Items in Category */}
                {(!isCatCollapsed || collapsedMode) && (
                  <div className="space-y-0.5">
                    {categoryItems.map((item) => {
                      const isActive = activeTab === item.id;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          title={collapsedMode ? item.label : undefined}
                          className={`w-full text-left rounded-xl transition flex items-center gap-2.5 ${
                            collapsedMode
                              ? "justify-center p-2.5"
                              : "px-2.5 py-2"
                          } ${
                            isActive
                              ? "bg-red-50 text-btred-logo font-bold shadow-xs border border-red-100"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          {/* Item Icon */}
                          <div
                            className={`p-1.5 rounded-lg shrink-0 transition ${
                              isActive
                                ? "bg-btred-logo text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>

                          {/* Label and Badge (Expanded Mode Only) */}
                          {!collapsedMode && (
                            <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                              <span className="truncate text-xs font-semibold">
                                {item.shortLabel}
                              </span>

                              {item.badge && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border ${
                                    item.badgeVariant === "red"
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : item.badgeVariant === "emerald"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : item.badgeVariant === "amber"
                                      ? "bg-amber-100 text-amber-700 border-amber-200"
                                      : item.badgeVariant === "indigo"
                                      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
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

        {/* Bottom Signatory / Firm Line Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          {!collapsedMode ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="min-w-0 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {currentUser?.name?.slice(0, 2).toUpperCase() || "CP"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {currentUser?.name || "Authorized Director"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {currentUser?.phone ? `+91 ${currentUser.phone.slice(-10)}` : "Verified Access"}
                    </p>
                  </div>
                </div>
              </div>

              {onOpenQuickAction && (
                <button
                  onClick={onOpenQuickAction}
                  className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Tap Quick Action</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                title={currentUser?.name || "Director"}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
              >
                {currentUser?.name?.slice(0, 2).toUpperCase() || "CP"}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop / Tablet Left Sidebar (Static Column) */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] z-20 ${
          isCollapsed ? "w-18" : "w-64"
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer (Slide-out Overlay) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobileDrawer}
          />
          {/* Drawer Canvas */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-right">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
