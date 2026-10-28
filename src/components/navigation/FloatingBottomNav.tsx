"use client";

import React from "react";
import {
  CalendarDays,
  CheckSquare,
  FileCheck2,
  UploadCloud,
  FolderOpen,
  Home,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  Wallet,
  MessageSquare,
} from "lucide-react";

interface FloatingBottomNavProps {
  currentView: "partner" | "article" | "client-pwa";
  activeTab: string;
  onTabChange: (tab: string) => void;
  onQuickAction?: () => void;
  onOpenClients?: () => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: "quick" | "clients";
};

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  currentView,
  activeTab,
  onTabChange,
  onQuickAction,
  onOpenClients,
}) => {
  const items: NavItem[] = currentView === "client-pwa"
    ? [
        { id: "progress", label: "Filings", icon: FileCheck2 },
        { id: "requests", label: "Requests", icon: CheckSquare },
        { id: "upload", label: "Upload", icon: UploadCloud, action: "quick" },
        { id: "vault", label: "Vault", icon: FolderOpen },
        { id: "pay-tools", label: "Pay & Tools", icon: Wallet },
      ]
    : currentView === "article"
      ? [
        { id: "my-day", label: "My Day", icon: Home },
        { id: "tasks", label: "Tasks", icon: CheckSquare },
        { id: "quick-actions", label: "Add", icon: Plus, action: "quick" },
        { id: "chat-hub", label: "WhatsApp", icon: MessageSquare },
        { id: "staff-tools", label: "More", icon: MoreHorizontal },
      ]
      : [
        { id: "pulse", label: "Pulse", icon: Home },
        { id: "calendar", label: "Work", icon: CalendarDays },
        { id: "firm-hub", label: "Quick Action", icon: Plus, action: "quick" },
        { id: "clients-home", label: "Clients", icon: Users, action: "clients" },
        { id: "tools", label: "More", icon: Search },
      ];

  const isActive = (item: NavItem) => {
    if (item.id === "pay-tools") return activeTab === "pay-tools" || activeTab === "billing";
    if (item.id === "vault") return activeTab === "vault" || activeTab === "kyc-locker";
    if (item.id === "clients-home") return activeTab === "clients-home" || activeTab === "entity-dna";
    if (item.id === "tools") return activeTab === "tools";
    if (item.id === "firm-hub") return false;
    return activeTab === item.id;
  };

  const handleClick = (item: NavItem) => {
    if (item.action === "quick") {
      onQuickAction?.();
      return;
    }
    if (item.action === "clients") {
      if (onOpenClients) onOpenClients();
      else onTabChange(item.id);
      return;
    }
    onTabChange(item.id);
  };

  return (
    <nav
      aria-label={`${currentView === "client-pwa" ? "Client" : currentView === "article" ? "Staff" : "Partner"} navigation`}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 px-1 sm:px-3 w-full max-w-full select-none"
    >
      <div className="max-w-md md:max-w-xl mx-auto grid grid-cols-5 items-end justify-items-center">
        {items.map((item, index) => {
          const Icon = item.icon;
          const elevated = index === 2;
          const active = isActive(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item)}
              aria-label={item.action === "quick" ? (currentView === "client-pwa" ? "Upload document" : currentView === "article" ? "Open staff quick actions" : "Open Firm Hub") : item.label}
              aria-current={active ? "page" : undefined}
              className={elevated
                ? "relative -top-3.5 flex flex-col items-center justify-center gap-1 w-full max-w-[72px] touch-manipulation group focus:outline-none"
                : `w-full flex flex-col items-center justify-center gap-1 py-1 px-0.5 min-h-[50px] touch-manipulation focus:outline-none transition-colors ${active ? "text-btred-logo font-black" : "text-slate-500 hover:text-slate-900 font-medium"}`}
            >
              {elevated ? (
                <span className="w-[50px] h-[50px] sm:w-[54px] sm:h-[54px] rounded-full bg-gradient-to-tr from-btred-700 via-btred-logo to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/35 ring-4 ring-white active:scale-95 group-hover:scale-105 transition-all duration-150">
                  <Icon className="w-6 h-6 sm:w-6.5 sm:h-6.5 stroke-[2.5]" />
                </span>
              ) : (
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${active ? "stroke-[2.5] scale-105" : "stroke-[2]"}`} />
              )}
              <span className={`${elevated ? "text-[10px] sm:text-[11px] text-slate-800 font-black" : "text-[10px] sm:text-[11px]"} tracking-tight leading-tight text-center truncate max-w-full`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
