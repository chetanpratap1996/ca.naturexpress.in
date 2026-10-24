"use client";

import React from "react";
import { 
  X, 
  UploadCloud, 
  Briefcase, 
  CreditCard, 
  PhoneCall, 
  TrendingUp, 
  Lock, 
  FileCheck2, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Send
} from "lucide-react";

interface ClientQuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenBankerDocket: () => void;
  onOpenUpload: () => void;
  onOpenWhatsApp: () => void;
  clientName: string;
}

export const ClientQuickActionModal: React.FC<ClientQuickActionModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenBankerDocket,
  onOpenUpload,
  onOpenWhatsApp,
  clientName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-btred-700 via-btred-logo to-red-500 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Client Quick Action Hub</h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                {clientName} &bull; Executive Fast Actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          {/* Action 1: Upload Documents */}
          <button
            onClick={() => {
              onClose();
              onOpenUpload();
            }}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/80 transition flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                  Upload Documents
                </h4>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bank statements, bills &amp; notices
              </p>
            </div>
          </button>

          {/* Action 2: Bank Loan Documents */}
          <button
            onClick={() => {
              onClose();
              onOpenBankerDocket();
            }}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/80 transition flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition">
                  Bank Loan Documents
                </h4>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                3-year audited reports &amp; ITRs pack
              </p>
            </div>
          </button>

          {/* Action 3: Settle & Release Vault */}
          <button
            onClick={() => {
              onClose();
              onNavigateTab("billing");
            }}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/80 transition flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  Pay Invoices
                </h4>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pay via UPI or submit bank UTR
              </p>
            </div>
          </button>

          {/* Action 4: Tax Outflow Radar */}
          <button
            onClick={() => {
              onClose();
              onNavigateTab("cash-forecast");
            }}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50/80 transition flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                  Tax &amp; Cashflow
                </h4>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upcoming advance tax &amp; GST liability
              </p>
            </div>
          </button>

          {/* Action 5: Supplier Tax Claims */}
          <button
            onClick={() => {
              onClose();
              onNavigateTab("vendor-hold");
            }}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50/80 transition flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition">
                  Vendor Tax Checks
                </h4>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hold payment until vendor files GST
              </p>
            </div>
          </button>

          {/* Action 6: Document Vault */}
          <button
            onClick={() => {
              onClose();
              onNavigateTab("vault");
            }}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-cyan-400 bg-cyan-50/40 hover:bg-cyan-50/80 transition flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-700 border border-cyan-200 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition">
                  Document Vault
                </h4>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Download govt filed receipts &amp; returns
              </p>
            </div>
          </button>
        </div>

        {/* Emergency CA Hotline Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-bold flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Priority CA Firm Desk
            </p>
            <p className="text-[11px] text-slate-300">
              Direct access to Managing Partner &amp; In-charge Article
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenWhatsApp();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" /> WhatsApp CA
          </button>
        </div>
      </div>
    </div>
  );
};
