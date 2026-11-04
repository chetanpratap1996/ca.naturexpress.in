"use client";

import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ShieldAlert,
  ArrowRight,
  Filter
} from "lucide-react";

interface CaStatutoryCalendarProps {
  onOpenBooking: (serviceName?: string) => void;
}

export const CaStatutoryCalendar: React.FC<CaStatutoryCalendarProps> = ({
  onOpenBooking,
}) => {
  const [filter, setFilter] = useState<"all" | "it" | "gst" | "mca">("all");

  const deadlines = [
    {
      category: "it",
      date: "15th March",
      title: "Advance Tax Q4 (Final Installment)",
      desc: "Mandatory 100% advance tax payment for all corporate and non-corporate assessees to avoid interest u/s 234B & 234C.",
      priority: "Critical",
      statute: "Income Tax Act, 1961",
    },
    {
      category: "gst",
      date: "20th Monthly",
      title: "GSTR-3B Monthly Return & Tax Payment",
      desc: "Summary return of outward supplies, input tax credit availed, and net cash GST payment across states.",
      priority: "Mandatory",
      statute: "CGST / SGST Acts",
    },
    {
      category: "gst",
      date: "11th Monthly",
      title: "GSTR-1 Outward Supply Reporting",
      desc: "Invoice-level reporting of B2B sales and exports to enable recipient credit in GSTR-2B.",
      priority: "Standard",
      statute: "CGST Rules",
    },
    {
      category: "it",
      date: "31st March",
      title: "Section 43B(h) MSME Dues Settlement",
      desc: "Strict deadline to settle all outstanding payments to Micro & Small vendors within 15/45 days to prevent disallowance.",
      priority: "Critical",
      statute: "Section 43B(h) IT Act",
    },
    {
      category: "mca",
      date: "30th April",
      title: "MSME-1 Half-Yearly MCA Return",
      desc: "Reporting of outstanding dues exceeding 45 days to micro and small enterprises with reasons for delay.",
      priority: "Mandatory",
      statute: "MCA Companies Act",
    },
    {
      category: "mca",
      date: "30th June",
      title: "Form DPT-3 (Return of Deposits)",
      desc: "Mandatory annual disclosure by every company of all loans, advances, and exempt deposits received.",
      priority: "Standard",
      statute: "MCA Rules",
    },
    {
      category: "it",
      date: "30th September",
      title: "Form 3CD Tax Audit & Transfer Pricing",
      desc: "Filing of Tax Audit Report u/s 44AB for companies with business turnover exceeding ₹1 Cr / ₹10 Cr.",
      priority: "Critical",
      statute: "Section 44AB IT Act",
    },
    {
      category: "mca",
      date: "30th October",
      title: "MCA Form AOC-4 (Financial Statements)",
      desc: "Filing of audited Balance Sheet, P&L, Directors' Report, and Auditors' Report with the Registrar of Companies.",
      priority: "Mandatory",
      statute: "Section 137 Companies Act",
    },
  ];

  const filtered = filter === "all" ? deadlines : deadlines.filter((d) => d.category === filter);

  return (
    <section id="tax-deadlines" className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50 border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Real-Time Compliance Sentinel</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Statutory Tax &amp; Corporate Deadlines
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Stay ahead of mandatory due dates. Our automated practice monitors every compliance milestone to ensure 100% on-time execution.
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
              All Deadlines
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
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-btred-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                    {item.date}
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

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 truncate max-w-[140px] font-medium">{item.statute}</span>
                <button
                  onClick={() => onOpenBooking(item.title)}
                  className="text-btred-600 hover:text-btred-700 font-bold flex items-center gap-1"
                >
                  <span>File &rarr;</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Retainer Assurance Callout */}
        <div className="mt-8 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-700">
              <strong>100% Timeliness Guarantee:</strong> Retained clients of Brains &amp; Taxes are insulated from late filing fees and penal interest through automated advance warnings.
            </span>
          </div>

          <button
            onClick={() => onOpenBooking("Annual Statutory Retainer")}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Retain Our Practice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
};
