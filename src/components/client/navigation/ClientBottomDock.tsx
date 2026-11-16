"use client";

import React from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  MessageCircle, 
  Menu, 
  Briefcase 
} from "lucide-react";
import { ClientTabType } from "@/components/client/ClientPortalPwa";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";

interface ClientBottomDockProps {
  activeTab: ClientTabType;
  onNavigateTab: (tabId: ClientTabType) => void;
  onOpenMobileDrawer: () => void;
  onOpenQuickAction: () => void;
  clientName?: string;
}

export const ClientBottomDock: React.FC<ClientBottomDockProps> = ({
  activeTab,
  onNavigateTab,
  onOpenMobileDrawer,
  onOpenQuickAction,
  clientName = "Practice Client",
}) => {
  const handleOpenWhatsApp = () => {
    toast.info("WhatsApp Connected", "Opening firm compliance desk...");
    openWhatsAppPreset(
      DEFAULT_FIRM_BRANDING.whatsappNumber,
      "DOC_CHASE",
      {
        clientName,
        serviceName: "Compliance Desk",
        period: "Current Statutory Period",
      }
    );
  };

  return (
    <nav 
      aria-label="Mobile Navigation Dock"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg select-none"
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. Risk Radar */}
        <button
          onClick={() => onNavigateTab("director-risk")}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === "director-risk"
              ? "text-btred-logo font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5" />
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 absolute -top-0.5 -right-0.5"></span>
          </div>
          <span className="text-[10px] mt-0.5">Risk Shield</span>
        </button>

        {/* 2. Filings & Receipts */}
        <button
          onClick={() => onNavigateTab("progress")}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === "progress"
              ? "text-btred-logo font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5">Filings</span>
        </button>

        {/* 3. Center FAB: 1-Tap Quick Action */}
        <div className="relative -top-3">
          <button
            onClick={onOpenQuickAction}
            aria-label="Quick Actions"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-btred-logo to-red-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition"
          >
            <Sparkles className="w-5 h-5 text-amber-200" />
          </button>
        </div>

        {/* 4. WhatsApp CA Line */}
        <button
          onClick={handleOpenWhatsApp}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-emerald-700 transition"
        >
          <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600/20" />
          <span className="text-[10px] mt-0.5">CA Chat</span>
        </button>

        {/* 5. More Menu Drawer Trigger */}
        <button
          onClick={onOpenMobileDrawer}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
};
