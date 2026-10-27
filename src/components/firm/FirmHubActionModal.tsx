"use client";

import React from "react";
import { 
  Building2, 
  CalendarPlus, 
  Receipt, 
  FileSpreadsheet, 
  MessageSquare, 
  KeyRound, 
  Globe, 
  Award, 
  X, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Users,
  Calculator,
  Video,
  FileCheck
} from "lucide-react";

interface FirmHubActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClientMaster: () => void;
  onOpenNewTask: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const FirmHubActionModal: React.FC<FirmHubActionModalProps> = ({
  isOpen,
  onClose,
  onOpenClientMaster,
  onOpenNewTask,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      title: "Onboard New Client Entity",
      subtitle: "Add Private Ltd, LLP, Trust or HNWI to master list",
      icon: Building2,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      badge: "Master Data",
      onClick: () => {
        onClose();
        onOpenClientMaster();
      }
    },
    {
      title: "Schedule Compliance Filing",
      subtitle: "Assign GSTR-3B, Tax Audit 3CD, ITR, or AOC-4 return",
      icon: CalendarPlus,
      color: "bg-btred-logo/10 text-btred-logo border-btred-logo/20",
      badge: "Engagement",
      onClick: () => {
        onClose();
        onOpenNewTask();
      }
    },
    {
      title: "Generate Professional Tax Invoice",
      subtitle: "Bill client retainer or audit fees with dynamic UPI QR",
      icon: Receipt,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      badge: "Fee Collections",
      onClick: () => {
        onClose();
        onNavigateTab("billing");
      }
    },
    {
      title: "Convert Bank Statement to Tally XML",
      subtitle: "Auto-decrypt statement passwords & export native vouchers",
      icon: FileSpreadsheet,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      badge: "Article Workhorse",
      onClick: () => {
        onClose();
        onNavigateTab("bank-parser");
      }
    },
    {
      title: "1-Tap WhatsApp Chase Desk",
      subtitle: "Dispatch zero-password magic links for missing docs",
      icon: MessageSquare,
      color: "bg-teal-50 text-teal-700 border-teal-200",
      badge: "Zero-API wa.me",
      onClick: () => {
        onClose();
        onNavigateTab("whatsapp-ai");
      }
    },
    {
      title: "Register Physical DSC Token",
      subtitle: "Log USB dongle serial number and vault safe locker slot",
      icon: KeyRound,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      badge: "Hardware Custody",
      onClick: () => {
        onClose();
        onNavigateTab("dsc");
      }
    },
    {
      title: "Run Govt Portal Sync & Scraper",
      subtitle: "Poll GSTN, ITD 2.0 & MCA for verified DIN notices",
      icon: Globe,
      color: "bg-cyan-50 text-cyan-700 border-cyan-200",
      badge: "Portal Scraper",
      onClick: () => {
        onClose();
        onNavigateTab("notices");
      }
    },
    {
      title: "Virtual CFO Advisory Cockpit",
      subtitle: "Runway stress simulator, working capital & debtor aging",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      badge: "High-Margin",
      onClick: () => {
        onClose();
        onNavigateTab("vcfo");
      }
    },
    {
      title: "Compute ITR-1 & 4 (Sec 115BAC)",
      subtitle: "Dual-regime calculator with revised ₹75k standard deduction",
      icon: Calculator,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      badge: "AY 25-26",
      onClick: () => {
        onClose();
        onNavigateTab("itr-calc");
      }
    },
    {
      title: "CA Creator Instagram Studio",
      subtitle: "Viral tax reel scripts & ICAI Rule 7 compliance scanner",
      icon: Video,
      color: "bg-pink-50 text-pink-700 border-pink-200",
      badge: "Social Media",
      onClick: () => {
        onClose();
        onNavigateTab("content-studio");
      }
    },
    {
      title: "Generate SA-210 Engagement Letter",
      subtitle: "Official audit & tax representation retainer agreement",
      icon: FileCheck,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: "ICAI Mandate",
      onClick: () => {
        onClose();
        onNavigateTab("engagement-letter");
      }
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95 max-h-[90dvh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Firm Action Hub"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-btred-logo text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                CA Firm Action Hub
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-btred-logo border border-red-200">
                  Partner Level
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                High-frequency daily practice workflows &amp; instant actions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={act.onClick}
                className="group p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50/70 transition-all text-left flex items-start gap-3 relative shadow-xs"
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-btred-logo transition truncate">
                      {act.title}
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-600 shrink-0">
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {act.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-medium">
            Active Firm: <strong>GPA &amp; Co., Chartered Accountants</strong> (FRN 022998C)
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
