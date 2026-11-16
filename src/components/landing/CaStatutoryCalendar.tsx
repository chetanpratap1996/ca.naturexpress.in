"use client";

import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ShieldAlert,
  ArrowRight,
  Filter,
  ExternalLink,
  PlusCircle,
  Bell
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaStatutoryCalendarProps {
  onOpenBooking: (serviceName?: string) => void;
}

interface StatutoryDeadline {
  category: "it" | "gst" | "mca" | "msme";
  month: number; // 0-indexed month (0 = Jan, 2 = Mar, etc.)
  day: number;
  dateLabel: string;
  title: string;
  desc: string;
  penaltyImpact: string;
  priority: "Critical" | "Mandatory" | "Standard";
  statute: string;
  calSummary: string;
}

export const CaStatutoryCalendar: React.FC<CaStatutoryCalendarProps> = ({
  onOpenBooking,
}) => {
  const [filter, setFilter] = useState<"all" | "it" | "gst" | "mca">("all");

  const deadlines: StatutoryDeadline[] = [
    {
      category: "it",
      month: 2, // March
      day: 15,
      dateLabel: "15th March",
      title: "Advance Tax Q4 (Final 100% Installment)",
      desc: "Mandatory 100% advance tax payment for all corporate and non-corporate assessees to avoid interest u/s 234B & 234C.",
      penaltyImpact: "Interest @ 1% per month u/s 234B & 234C on shortfall",
      priority: "Critical",
      statute: "Section 208–211 Income Tax Act",
      calSummary: "Pay Q4 Final Advance Tax - Brains & Taxes Advisory",
    },
    {
      category: "gst",
      month: 2, // Monthly recurring
      day: 20,
      dateLabel: "20th Monthly",
      title: "GSTR-3B Summary Return & Cash Tax Payment",
      desc: "Mandatory return of outward supplies, input tax credit availed, and net cash GST payment across states.",
      penaltyImpact: "Late fee ₹50/day (CGST+SGST) + 18% p.a. interest u/s 50(1)",
      priority: "Mandatory",
      statute: "Section 39 CGST Act",
      calSummary: "File GSTR-3B Monthly Return - Brains & Taxes",
    },
    {
      category: "gst",
      month: 2, // Monthly recurring
      day: 11,
      dateLabel: "11th Monthly",
      title: "GSTR-1 Outward B2B Supply Reporting",
      desc: "Invoice-level reporting of B2B sales and exports to enable recipient credit reflection in GSTR-2B.",
      penaltyImpact: "Late fee ₹50/day + Recipient credit blocked in GSTR-2B",
      priority: "Standard",
      statute: "Rule 59 CGST Rules",
      calSummary: "File GSTR-1 Outward Supplies - Brains & Taxes",
    },
    {
      category: "it",
      month: 2, // March
      day: 31,
      dateLabel: "31st March",
      title: "Section 43B(h) MSME Vendor Payment Cutoff",
      desc: "Strict deadline to settle all outstanding payments to Micro & Small vendors within 15/45 days to prevent disallowance.",
      penaltyImpact: "100% Disallowance from profits + 25.17% to 31.2% tax increase",
      priority: "Critical",
      statute: "Section 43B(h) IT Act",
      calSummary: "Settle MSME 43B(h) Vendor Outstandings - Brains & Taxes",
    },
    {
      category: "mca",
      month: 3, // April
      day: 30,
      dateLabel: "30th April",
      title: "MSME-1 Half-Yearly MCA Return",
      desc: "Mandatory reporting by all companies of outstanding dues exceeding 45 days to micro and small enterprises with reasons.",
      penaltyImpact: "Penalty ₹20,000 + ₹1,000/day on company and directors",
      priority: "Mandatory",
      statute: "MCA Order u/s 405 Companies Act",
      calSummary: "File Form MSME-1 with MCA - Brains & Taxes",
    },
    {
      category: "mca",
      month: 5, // June
      day: 30,
      dateLabel: "30th June",
      title: "Form DPT-3 (Return of Deposits / Exempt Loans)",
      desc: "Mandatory annual disclosure by every company of all loans, advances, directors' loans, and exempt deposits received.",
      penaltyImpact: "Penalty ₹50,000 + ₹500/day u/s 76A on officers in default",
      priority: "Standard",
      statute: "Rule 16 Companies (Acceptance of Deposits) Rules",
      calSummary: "File Form DPT-3 Return of Deposits - Brains & Taxes",
    },
    {
      category: "it",
      month: 8, // September
      day: 30,
      dateLabel: "30th September",
      title: "Form 3CD Tax Audit & Transfer Pricing",
      desc: "Filing of Tax Audit Report u/s 44AB for companies with business turnover exceeding ₹1 Cr (Cash >5%) or ₹10 Cr (Cash <5%).",
      penaltyImpact: "Penalty u/s 271B: 0.5% of turnover (capped at ₹1,50,000)",
      priority: "Critical",
      statute: "Section 44AB Income Tax Act",
      calSummary: "Sign & File Form 3CD Tax Audit with UDIN - GPA & Co.",
    },
    {
      category: "mca",
      month: 9, // October
      day: 30,
      dateLabel: "30th October",
      title: "MCA Form AOC-4 (Financial Statements Filing)",
      desc: "Filing of audited Balance Sheet, P&L, Directors' Report, and Auditors' Report with the Registrar of Companies.",
      penaltyImpact: "Statutory late fee of ₹100 per day without upper ceiling",
      priority: "Mandatory",
      statute: "Section 137 Companies Act 2013",
      calSummary: "File Form AOC-4 Audited Accounts with ROC - Brains & Taxes",
    },
  ];

  const now = new Date();
  const currentYear = now.getFullYear();

  // Calculate dynamic days remaining
  const enrichedDeadlines = useMemo(() => {
    return deadlines.map((d) => {
      let targetDate = new Date(currentYear, d.month, d.day, 23, 59, 59);
      if (targetDate.getTime() < now.getTime()) {
        targetDate = new Date(currentYear + 1, d.month, d.day, 23, 59, 59);
      }
      const diffTime = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Construct Google Calendar link
      const startStr = targetDate.toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 15) + "Z";
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(d.calSummary)}&dates=${startStr}/${startStr}&details=${encodeURIComponent(d.desc + " | Statutory Impact: " + d.penaltyImpact)}&add=${encodeURIComponent(DEFAULT_FIRM_BRANDING.email)}`;

      return {
        ...d,
        daysRemaining: diffDays,
        gcalUrl,
      };
    });
  }, [now, currentYear]);

  const filtered = filter === "all" ? enrichedDeadlines : enrichedDeadlines.filter((d) => d.category === filter);

  return (
    <section id="tax-deadlines" className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50 border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3 shadow-2xs">
              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Statutory Compliance Tracking &bull; FY 2024-25 &bull; AY 2025-26</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Statutory Tax &amp; Corporate Deadlines
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
              Never miss a regulatory milestone. Our corporate practice monitors every statutory cutoff with automated advance warning protocols.
            </p>
          </div>

          {/* Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 self-start md:self-auto shadow-2xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Due Dates
            </button>
            <button
              onClick={() => setFilter("it")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === "it" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Income Tax
            </button>
            <button
              onClick={() => setFilter("gst")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === "gst" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              GST
            </button>
            <button
              onClick={() => setFilter("mca")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === "mca" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              MCA / ROC
            </button>
          </div>
        </div>

        {/* Deadlines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-btred-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                    {item.dateLabel}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.daysRemaining} days left
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.priority === "Critical"
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-btred-600 transition-colors">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {item.desc}
                </p>

                {/* Financial Consequence of Delay */}
                <div className="mt-3 p-2 bg-red-50/50 rounded-xl border border-red-100 text-[11px] text-red-900 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-btred-600 shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong>Consequence:</strong> {item.penaltyImpact}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <a
                  href={item.gcalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium transition"
                  title="Add this due date to your Google Calendar"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Google Cal</span>
                </a>

                <button
                  onClick={() => onOpenBooking(item.title)}
                  className="text-btred-600 hover:text-btred-700 font-extrabold flex items-center gap-1 transition"
                >
                  <span>File with CA &rarr;</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Retainer Assurance Callout */}
        <div className="mt-8 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm">
                100% On-Time Statutory Retainer Guarantee
              </div>
              <p className="text-slate-600 mt-0.5">
                Retained corporate clients of GPA &amp; Co. are completely insulated from late filing fees, penal interest, and director disqualification through dual-partner sign-off controls.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenBooking("Annual Corporate Retainer (Statutory & Tax)")}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-xs"
          >
            <span>Retain Our Practice for FY 2024-25</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
