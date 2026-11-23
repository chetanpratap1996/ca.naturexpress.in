"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  FileSpreadsheet, 
  FileSearch, 
  Calculator, 
  ClipboardCheck, 
  Layers, 
  Lock, 
  DollarSign, 
  MessageSquare, 
  Scale, 
  KeyRound, 
  Award, 
  Building2, 
  Calendar,
  Download,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  TrendingUp,
  Cpu,
  Zap,
  Check,
  Command,
  X
} from "lucide-react";
import { playSoftClick, playSuccessChime } from "@/lib/audio/soundEffects";
import { toast } from "@/components/shared/ToastNotification";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "AUTOPILOT" | "SUITES" | "CLIENTS" | "STATUTORY_TOOLS";
  icon: any;
  action: () => void;
  shortcut?: string;
  badge?: string;
}

interface UniversalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onTriggerAutopilot: () => void;
  clients?: Array<{ id: string; name: string; pan: string }>;
}

export const UniversalCommandPalette: React.FC<UniversalCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onTriggerAutopilot,
  clients = []
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery("");
    }
  }, [isOpen]);

  // Master List of Commands
  const allCommands: CommandItem[] = [
    // Practice Actions
    {
      id: "cmd-autopilot",
      title: "Run Practice Autopilot Sweep",
      subtitle: "Execute automated verification (GST 2B, AIS, Form 3CD, CARO, ITR, Billing)",
      category: "AUTOPILOT",
      icon: Sparkles,
      shortcut: "⌘P",
      badge: "Sweep",
      action: () => {
        onTriggerAutopilot();
        onClose();
      }
    },
    {
      id: "cmd-practice-cockpit",
      title: "Partner Practice Cockpit",
      subtitle: "Practice pulse, statutory filings summary & 1-click approvals",
      category: "AUTOPILOT",
      icon: Sparkles,
      shortcut: "P P",
      badge: "Cockpit",
      action: () => {
        onNavigateTab("practice-cockpit");
        onClose();
      }
    },
    {
      id: "cmd-gst-assembly",
      title: "GST Monthly Return Assembly",
      subtitle: "Automated GSTR-3B reconciliation & exceptions review desk",
      category: "AUTOPILOT",
      icon: Sparkles,
      shortcut: "G A",
      badge: "GST",
      action: () => {
        onNavigateTab("gst-assembly");
        onClose();
      }
    },
    {
      id: "cmd-tds-assembly",
      title: "TDS / TCS & TRACES Pipeline",
      subtitle: "Form 24Q/26Q generation, Sec 206AB scan, and TRACES correction desk",
      category: "AUTOPILOT",
      icon: Sparkles,
      shortcut: "T A",
      badge: "TDS",
      action: () => {
        onNavigateTab("tds-assembly");
        onClose();
      }
    },
    {
      id: "cmd-mca-assembly",
      title: "Corporate MCA / ROC Desk",
      subtitle: "Form AOC-4 & MGT-7, DPT-3 loan audit, and Sec 164(2) DIN verification",
      category: "AUTOPILOT",
      icon: Sparkles,
      shortcut: "M A",
      badge: "MCA",
      action: () => {
        onNavigateTab("mca-assembly");
        onClose();
      }
    },
    {
      id: "cmd-governance-assembly",
      title: "ICAI SQC-1 Peer Review & Governance",
      subtitle: "3-tier Maker-Checker digital audit trail, UDIN 60-day guardian, and USB DSC vault",
      category: "AUTOPILOT",
      icon: ShieldCheck,
      shortcut: "S Q",
      badge: "SQC-1",
      action: () => {
        onNavigateTab("governance-assembly");
        onClose();
      }
    },
    {
      id: "cmd-notice-assembly",
      title: "Faceless Notice Defense Desk",
      subtitle: "Circular 19/2019 DIN verification, limitation period tracker & reply drafter",
      category: "AUTOPILOT",
      icon: ShieldAlert,
      shortcut: "N A",
      badge: "Notices",
      action: () => {
        onNavigateTab("notice-assembly");
        onClose();
      }
    },
    {
      id: "cmd-vcfo-assembly",
      title: "Virtual CFO & Advisory Engine",
      subtitle: "1-Click Banker's Docket (CMA Pack), 13-week cash flow & SA 210 scope alerts",
      category: "AUTOPILOT",
      icon: TrendingUp,
      shortcut: "V A",
      badge: "vCFO",
      action: () => {
        onNavigateTab("vcfo-assembly");
        onClose();
      }
    },
    {
      id: "cmd-cicd-assembly",
      title: "Practice Benchmark & Verification Suite",
      subtitle: "Statutory validation tests, zero-divergence tax math & audit trail verification",
      category: "AUTOPILOT",
      icon: Terminal,
      shortcut: "C I",
      badge: "Tests",
      action: () => {
        onNavigateTab("cicd-assembly");
        onClose();
      }
    },
    {
      id: "cmd-legacy-migration",
      title: "Legacy Software Migrator (Winman / CompuTax / Tally)",
      subtitle: "Import data from Winman CA-ERP, CompuTax & TallyPrime with verification",
      category: "AUTOPILOT",
      icon: Sparkles,
      shortcut: "L M",
      badge: "Migrate",
      action: () => {
        onNavigateTab("legacy-migration");
        onClose();
      }
    },
    {
      id: "cmd-autonomous-orchestrator",
      title: "Practice Module Orchestrator",
      subtitle: "Unified cross-module coordination across GST, Direct Tax, MCA & Audit",
      category: "AUTOPILOT",
      icon: Cpu,
      shortcut: "A U T O",
      badge: "Modules",
      action: () => {
        onNavigateTab("autonomous-orchestrator");
        onClose();
      }
    },
    {
      id: "cmd-pillar-one-gst",
      title: "GST Command Center",
      subtitle: "IMS disposition, Rule 37A reversals, GSTR-9/9C DRC-03 & DRC-01B/C replies",
      category: "AUTOPILOT",
      icon: Sparkles,
      shortcut: "P 1",
      badge: "GST",
      action: () => {
        onNavigateTab("pillar-one-gst");
        onClose();
      }
    },
    {
      id: "cmd-pillar-two-tax",
      title: "Direct Tax & Capital Gains Suite",
      subtitle: "Budget 2024 STCG/LTCG computation, Sec 32 depreciation & 115BAC comparison",
      category: "AUTOPILOT",
      icon: Calculator,
      shortcut: "P 2",
      badge: "Income Tax",
      action: () => {
        onNavigateTab("pillar-two-tax");
        onClose();
      }
    },
    {
      id: "cmd-pillar-three-audit",
      title: "Form 3CD Tax Audit Suite",
      subtitle: "ICDS I-X adjustments, Clause 21 disallowances (40a/40A3), Sec 43B dues & Clause 40 ratios",
      category: "AUTOPILOT",
      icon: ClipboardCheck,
      shortcut: "P 3",
      badge: "Tax Audit",
      action: () => {
        onNavigateTab("pillar-three-audit");
        onClose();
      }
    },
    {
      id: "cmd-pillar-four-bank",
      title: "Statutory Bank Audit & LFAR Suite",
      subtitle: "RBI IRAC 90-day NPAs, drawing power calculation & LFAR master pack",
      category: "AUTOPILOT",
      icon: Building2,
      shortcut: "P 4",
      badge: "Bank Audit",
      action: () => {
        onNavigateTab("bank-audit");
        onClose();
      }
    },
    {
      id: "cmd-pillar-five-tds",
      title: "TDS, TRACES & Remittance Suite",
      subtitle: "Forms 24Q/26Q/27Q/27EQ FVU matcher, TRACES defaults & Form 15CA/CB",
      category: "AUTOPILOT",
      icon: Sparkles,
      shortcut: "P 5",
      badge: "TDS",
      action: () => {
        onNavigateTab("pillar-five-tds");
        onClose();
      }
    },
    {
      id: "cmd-pillar-six-mca",
      title: "Company Law, MCA V3 & Secretarial Suite",
      subtitle: "Form DPT-3 return of deposits, Form MSME-1 dues & DIR-3 KYC director filings",
      category: "AUTOPILOT",
      icon: Building2,
      shortcut: "P 6",
      badge: "MCA",
      action: () => {
        onNavigateTab("pillar-six-mca");
        onClose();
      }
    },
    {
      id: "cmd-pillar-seven-governance",
      title: "ICAI SQC-1 Peer Review & Governance",
      subtitle: "UDIN generator with 60-day clock, SQC-1 workpapers, article diary & DSC vault",
      category: "AUTOPILOT",
      icon: ShieldCheck,
      shortcut: "P 7",
      badge: "Governance",
      action: () => {
        onNavigateTab("pillar-seven-governance");
        onClose();
      }
    },
    {
      id: "cmd-pillar-eight-desktop",
      title: "Tally Integration & Bridge",
      subtitle: "TallyPrime XML voucher sync, pure agent billing & daily WhatsApp digest",
      category: "AUTOPILOT",
      icon: Terminal,
      shortcut: "P 8",
      badge: "Tally",
      action: () => {
        onNavigateTab("pillar-eight-desktop");
        onClose();
      }
    },
    // Tax & Audit Suites
    {
      id: "cmd-gstr2b",
      title: "GSTR-2B vs Books Reconciliation Engine",
      subtitle: "Multi-rule fuzzy matcher, Rule 42/43 reversals, and vendor default notices",
      category: "SUITES",
      icon: FileSpreadsheet,
      shortcut: "G",
      action: () => {
        onNavigateTab("gstr2b");
        onClose();
      }
    },
    {
      id: "cmd-gst-ims",
      title: "GST IMS (Invoice Management System) & Rule 37A",
      subtitle: "2024/2025 Mandate: Accept/Reject/Pending incoming invoices before 14th cutoff & Rule 37A tracker",
      category: "SUITES",
      icon: Sparkles,
      shortcut: "G I",
      badge: "2025 Mandate",
      action: () => {
        onNavigateTab("gst-ims");
        onClose();
      }
    },
    {
      id: "cmd-bank-audit",
      title: "Statutory Bank Audit (RBI IRAC & LFAR)",
      subtitle: "RBI IRAC 90-day NPA classification, MOC P&L adjustments, Drawing Power (DP) & LFAR Pack",
      category: "SUITES",
      icon: Building2,
      shortcut: "B A",
      badge: "RBI Audit",
      action: () => {
        onNavigateTab("bank-audit");
        onClose();
      }
    },
    {
      id: "cmd-form3cd-clause31",
      title: "Form 3CD Clause 31 (269SS/T Cash Loans)",
      subtitle: "Forensic scanner for cash loans >= ₹20,000 attracting 100% penalty u/s 271D & 271E",
      category: "SUITES",
      icon: ShieldAlert,
      shortcut: "C 3 1",
      badge: "100% Penalty",
      action: () => {
        onNavigateTab("form3cd-clause31");
        onClose();
      }
    },
    {
      id: "cmd-tally-data-grid",
      title: "Tally-Speed Voucher Grid Entry",
      subtitle: "100% Keyboard data entry: Enter to advance, Alt+C to create ledger, Ctrl+A to save",
      category: "SUITES",
      icon: Zap,
      shortcut: "T G",
      badge: "Tally Speed",
      action: () => {
        onNavigateTab("tally-data-grid");
        onClose();
      }
    },
    {
      id: "cmd-ais",
      title: "AIS / 26AS SFT Forensic Inspector",
      subtitle: "Rule 114E high-value transactions, 194Q dominance, and notice probability",
      category: "SUITES",
      icon: FileSearch,
      shortcut: "A",
      action: () => {
        onNavigateTab("ais-analyzer");
        onClose();
      }
    },
    {
      id: "cmd-form3cd",
      title: "Tax Audit Form 3CD Workpapers",
      subtitle: "Clause 44 GST breakdown, Clause 22 MSME 43B(h) 3x RBI interest, and Clause 34 TDS",
      category: "SUITES",
      icon: ClipboardCheck,
      shortcut: "T",
      action: () => {
        onNavigateTab("tax-audit-3cd");
        onClose();
      }
    },
    {
      id: "cmd-schedule3",
      title: "Schedule III & CARO 2020 Balance Sheet Engine",
      subtitle: "11 MCA ratios, 21 CARO clauses, and quarterly stock bank statement reconciler",
      category: "SUITES",
      icon: Layers,
      shortcut: "S",
      action: () => {
        onNavigateTab("schedule3-audit");
        onClose();
      }
    },
    {
      id: "cmd-itr",
      title: "ITR Dual-Regime Optimization Engine (115BAC)",
      subtitle: "Budget 2024 slabs, Form 10-IEA gatekeeper, and CompuTax/Winman pre-filing bridge",
      category: "SUITES",
      icon: Calculator,
      shortcut: "I",
      action: () => {
        onNavigateTab("itr-calc");
        onClose();
      }
    },
    {
      id: "cmd-billing",
      title: "Billing & Pay-to-Release Gatekeeper",
      subtitle: "SAC 9982 invoices, Imprest statutory advance ledger, and UPI file lock",
      category: "SUITES",
      icon: DollarSign,
      action: () => {
        onNavigateTab("billing");
        onClose();
      }
    },
    {
      id: "cmd-notices",
      title: "Statutory Notice Drafter",
      subtitle: "AI response drafter for 143(1)(a), 148, and GST ASMT-10 notices",
      category: "SUITES",
      icon: Scale,
      action: () => {
        onNavigateTab("notice-drafter");
        onClose();
      }
    },
    {
      id: "cmd-udin",
      title: "UDIN 60-Day Vault",
      subtitle: "ICAI UDIN countdown timer and revocation tracking",
      category: "SUITES",
      icon: KeyRound,
      action: () => {
        onNavigateTab("udin-vault");
        onClose();
      }
    },
    // Clients
    ...clients.slice(0, 4).map(c => ({
      id: `client-${c.id}`,
      title: c.name,
      subtitle: `PAN: ${c.pan} • Open in Entity DNA Client Master`,
      category: "CLIENTS" as const,
      icon: Building2,
      action: () => {
        onNavigateTab("entity-dna");
        toast.info("Assessee Focused", `Activated ${c.name} in universal client spine.`);
        onClose();
      }
    }))
  ];

  // Filtered Commands
  const filteredCommands = allCommands.filter(c => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q);
  });

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          playSoftClick();
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-red-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, tool, or client name (e.g. 'GSTR', 'CARO', 'Autopilot', 'Apex')..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-600">
              ESC
            </kbd>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto divide-y divide-slate-100">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands or clients found.
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playSoftClick();
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                    isSelected 
                      ? "bg-red-50 text-slate-900 border border-red-200" 
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.category === "AUTOPILOT"
                        ? "bg-red-600 text-white"
                        : isSelected
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{item.title}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-100 text-red-800 border border-red-200">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono font-bold">↑</kbd> <kbd className="font-mono font-bold">↓</kbd></span>
            <span>Execute: <kbd className="font-mono font-bold">↵ Enter</kbd></span>
          </div>
          <span className="text-[10px] font-mono text-red-600 font-bold">
            Universal Statutory Command Palette
          </span>
        </div>
      </div>
    </div>
  );
};
