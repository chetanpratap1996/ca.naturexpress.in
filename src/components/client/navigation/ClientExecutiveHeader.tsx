"use client";

import React from "react";
import { 
  Menu, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  Download, 
  MessageCircle, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Layers,
  ArrowUpRight,
  Bell
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";

interface ClientExecutiveHeaderProps {
  currentClient: ClientEntity;
  siblingEntities: ClientEntity[];
  selectedEntityId: string;
  onSelectEntity: (entityId: string) => void;
  onOpenMobileDrawer: () => void;
  onOpenQuickAction: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  complianceHealthScore?: number;
  isAppInstalled?: boolean;
  hideNotificationBell?: boolean;
}

export const ClientExecutiveHeader: React.FC<ClientExecutiveHeaderProps> = ({
  currentClient,
  siblingEntities,
  selectedEntityId,
  onSelectEntity,
  onOpenMobileDrawer,
  onOpenQuickAction,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  complianceHealthScore = 98,
  isAppInstalled = false,
  hideNotificationBell = false,
}) => {
  const handleOpenWhatsApp = () => {
    toast.info("WhatsApp Connected", "Opening firm compliance desk...");
    openWhatsAppPreset(
      DEFAULT_FIRM_BRANDING.whatsappNumber,
      "DOC_CHASE",
      {
        clientName: currentClient?.name || "Practice Client",
        serviceName: "Compliance Desk",
        period: "Current Statutory Period",
      }
    );
  };

  const handleTriggerInstall = () => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("trigger-app-install");
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Single Row Executive Bar */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Mobile Menu Button + Entity Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Drawer Hamburger Trigger */}
          <button
            onClick={onOpenMobileDrawer}
            aria-label="Open Navigation Menu"
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Active Company Name & CIN */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate tracking-tight">
                {currentClient.name}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Portal
              </span>
            </div>

            {/* Sub-line: CIN & Promoter Group */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium truncate">
              {currentClient.cin && (
                <span className="font-mono text-slate-600 truncate">
                  CIN: {currentClient.cin}
                </span>
              )}
              {currentClient.cin && siblingEntities.length > 1 && (
                <span>•</span>
              )}
              {siblingEntities.length > 1 && (
                <span className="text-slate-600 hidden md:inline">
                  Group: <strong>{currentClient.groupName}</strong> ({siblingEntities.length} entities)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right Side: Compliance Meter & High-Value Action Triggers */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Statutory Health Chip */}
          <div className="hidden md:flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="leading-tight text-left">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Statutory Shield
              </span>
              <span className="text-xs font-black text-emerald-950">
                {complianceHealthScore}% Compliant
              </span>
            </div>
          </div>

          {/* WhatsApp Direct Line */}
          <button
            onClick={handleOpenWhatsApp}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition active:scale-95"
            title="Chat directly with assigned CA on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>CA WhatsApp</span>
          </button>

          {/* CA Firm Intimations Bell (Only shown when not handled by global top nav) */}
          {!hideNotificationBell && onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center shrink-0"
              title="CA Firm Intimations & Updates"
              aria-label="View notifications from CA firm"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-btred-logo text-white font-mono text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Actions Primary Trigger */}
          <button
            onClick={onOpenQuickAction}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-btred-logo to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Quick Actions</span>
          </button>

          {/* 1-Tap App Install Trigger (Enterprise zero-irritation: compact & informative) */}
          {!isAppInstalled ? (
            <button
              onClick={handleTriggerInstall}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shrink-0"
              title="Install Mobile PWA App"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">App</span>
            </button>
          ) : (
            <span
              className="hidden lg:inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-bold shrink-0"
              title="Running verified client app"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Installed</span>
            </span>
          )}
        </div>
      </div>

      {/* Sibling Entities Strip (Only if multi-entity group has > 1 entity) */}
      {siblingEntities.length > 1 && (
        <div className="px-3 sm:px-6 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            Switch Group Entity:
          </span>
          {siblingEntities.map((ent) => {
            const isSelected = ent.id === selectedEntityId;
            return (
              <button
                key={ent.id}
                onClick={() => onSelectEntity(ent.id)}
                className={`px-2.5 py-0.5 rounded-lg font-bold transition shrink-0 whitespace-nowrap flex items-center gap-1 ${
                  isSelected
                    ? "bg-btred-logo text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{ent.name}</span>
                <span className="text-[9px] opacity-70 font-mono">({ent.pan})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
