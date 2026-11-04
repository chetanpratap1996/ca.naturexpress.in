"use client";

import React from "react";
import { Phone, MessageSquare, Calendar, KeyRound } from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaMobileStickyBarProps {
  onOpenBooking: () => void;
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
}

export const CaMobileStickyBar: React.FC<CaMobileStickyBarProps> = ({
  onOpenBooking,
  onOpenLogin,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-3 py-2 sm:hidden pb-safe">
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {/* 1. Call Office */}
        <a
          href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200/80 active:bg-slate-100"
        >
          <Phone className="w-4 h-4 text-btred-600 mb-0.5" />
          <span className="text-[10px] font-bold">Call</span>
        </a>

        {/* 2. WhatsApp */}
        <a
          href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I would like to consult regarding company accounts & tax.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 active:bg-emerald-100"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600 mb-0.5" />
          <span className="text-[10px] font-bold">WhatsApp</span>
        </a>

        {/* 3. Book Consultation */}
        <button
          onClick={onOpenBooking}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-btred-600 text-white shadow-xs active:bg-btred-700"
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold">Book</span>
        </button>

        {/* 4. Client Login */}
        <button
          onClick={() => onOpenLogin("client")}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 text-white shadow-xs active:bg-black"
        >
          <KeyRound className="w-4 h-4 text-btred-400 mb-0.5" />
          <span className="text-[10px] font-bold">Portal</span>
        </button>
      </div>
    </div>
  );
};
