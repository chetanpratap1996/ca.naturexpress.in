"use client";

import React, { useState } from "react";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  ShieldAlert, 
  ArrowRight, 
  IndianRupee, 
  Building2, 
  Sparkles,
  ExternalLink,
  HelpCircle,
  FileText
} from "lucide-react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { ClientEntity } from "@/lib/types";

interface MsmeInvoiceItem {
  id: string;
  vendorName: string;
  udyamNumber: string;
  category: "MICRO" | "SMALL";
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  daysElapsed: number;
  maxDaysAllowed: number; // 45 or 15
  paymentStatus: "PENDING" | "PAID_ON_TIME" | "DISALLOWED_RISK";
}

const SAMPLE_MSME_INVOICES: MsmeInvoiceItem[] = [];

export interface Msme43bhWatchdogProps {
  client?: ClientEntity | null;
}

export const Msme43bhWatchdog: React.FC<Msme43bhWatchdogProps> = ({ client }) => {
  const [invoices, setInvoices] = useState<MsmeInvoiceItem[]>(SAMPLE_MSME_INVOICES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalAtRiskAmount = invoices
    .filter(i => i.paymentStatus !== "PAID_ON_TIME")
    .reduce((acc, curr) => acc + curr.invoiceAmount, 0);

  const potentialTaxHit = Math.round(totalAtRiskAmount * 0.312); // 30% tax + 4% cess

  const handleMarkPaid = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, paymentStatus: "PAID_ON_TIME" } : inv));
    setToastMessage("Invoice marked as paid on time! Tax disallowance risk eliminated.");
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Direct Tax Penalty Guard
            </span>
            <span className="text-xs text-slate-500 font-medium">Income Tax Act Section 43B(h)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Section 43B(h) MSME 45-Day Payment Watchdog
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Track registered Micro &amp; Small vendor invoices. Invoices unpaid beyond 45 days are disallowed from business expenses and taxed at 31.2%.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:underline text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Financial Exposure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Unpaid MSME Invoices</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900">{formatCurrencyINR(totalAtRiskAmount)}</div>
          <p className="text-xs text-slate-500 mt-2">
            Across {invoices.filter(i => i.paymentStatus !== "PAID_ON_TIME").length} active registered suppliers
          </p>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Potential Tax Disallowance Hit</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">{formatCurrencyINR(potentialTaxHit)}</div>
          <p className="text-xs text-rose-700 mt-2 font-medium">
            Added to taxable profit at 31.2% if unpaid within statutory window
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          {invoices.length > 0 ? (
            <>
              <div>
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Most Critical Deadline</span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    {Math.max(0, invoices[0].maxDaysAllowed - invoices[0].daysElapsed)} Days Left
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 truncate">
                  {invoices[0].vendorName} ({formatCurrencyINR(invoices[0].invoiceAmount)})
                </div>
                <p className="text-xs text-slate-500 mt-1">Due within statutory window</p>
              </div>
              <button 
                onClick={() => handleMarkPaid(invoices[0].id)}
                className="w-full mt-3 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                Mark Paid via NetBanking
              </button>
            </>
          ) : (
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Most Critical Deadline</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">All Clear</span>
              </div>
              <div className="text-base font-bold text-emerald-700">Zero Pending MSME Dues</div>
              <p className="text-xs text-slate-400 mt-1">No supplier payments are approaching the 45-day statutory limit.</p>
              <div className="mt-3 py-1.5 px-3 bg-emerald-50 text-emerald-700 rounded-xl text-center text-xs font-bold">
                100% Tax Compliant
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Table with Days Remaining Countdown */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-700" />
          Active MSME Invoices &amp; 45-Day Countdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/60">
                <th className="p-3">Vendor &amp; Udyam Reg</th>
                <th className="p-3">Category</th>
                <th className="p-3">Invoice Details</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Days Elapsed</th>
                <th className="p-3">Compliance Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">Zero MSME Disallowance Risks</div>
                    <div className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      All supplier dues are compliant with the statutory 45-day window under Section 43B(h). No overdue Micro or Small enterprise invoices detected.
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                const daysRemaining = inv.maxDaysAllowed - inv.daysElapsed;
                const isCritical = daysRemaining <= 5 && inv.paymentStatus !== "PAID_ON_TIME";

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{inv.vendorName}</div>
                      <div className="text-[10px] text-indigo-600 font-mono flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {inv.udyamNumber}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        inv.category === "MICRO" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {inv.category} Enterprise
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400">Date: {formatDate(inv.invoiceDate)}</div>
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      {formatCurrencyINR(inv.invoiceAmount)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full ${isCritical ? "bg-rose-500" : daysRemaining <= 15 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (inv.daysElapsed / 45) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {inv.daysElapsed}d / 45d
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {inv.paymentStatus === "PAID_ON_TIME" ? (
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Paid on Time
                        </span>
                      ) : isCritical ? (
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Critical: {daysRemaining}d Left!
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg text-[10px] flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3 text-amber-600" /> {daysRemaining} days remaining
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {inv.paymentStatus !== "PAID_ON_TIME" && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              openWhatsAppPreset("919823011928", "MSME_43BH_ALERT", {
                                clientName: client?.name || "Client Accounts Department",
                                vendorName: inv.vendorName,
                                overdueAmount: inv.invoiceAmount,
                                daysRemaining: daysRemaining
                              });
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 transition flex items-center gap-1"
                            title="1-Tap WhatsApp Alert to Accounts"
                          >
                            <Send className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp Alert</span>
                          </button>
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-lg transition"
                          >
                            Mark Paid
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
