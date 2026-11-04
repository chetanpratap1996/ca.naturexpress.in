"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, ArrowRight, MessageSquare } from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaFaqSectionProps {
  onOpenBooking: () => void;
}

export const CaFaqSection: React.FC<CaFaqSectionProps> = ({
  onOpenBooking,
}) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does our company switch from our existing CA to Brains & Taxes without disrupting ongoing filings?",
      a: "The transition is fully managed by our team in strict compliance with the ICAI Code of Ethics. We initiate the professional courtesy NOC letter to the outgoing auditor, migrate your historical Tally/ERP ledgers, verify your GST and Income Tax portal credentials, and reconcile pending ITC balances. The entire migration is executed with zero downtime or missed filing deadlines.",
    },
    {
      q: "Do you represent clients in Income Tax and GST faceless appeals before CIT(A) and ITAT?",
      a: "Yes. Direct tax and indirect tax litigation defense is one of our flagship practice disciplines. Managing Partner CA Gunjan Jain and our litigation associates draft exhaustive grounds of appeal, prepare factual paper-books, and conduct video conference appellate hearings before National Faceless Appellate Centers (NFAC), CIT(Appeals), and the Income Tax Appellate Tribunal (ITAT).",
    },
    {
      q: "Can clients located outside Indore or overseas NRIs work with your firm seamlessly?",
      a: "Absolutely. While our physical practice is anchored in Indore, more than 40% of our corporate and HNI assessees operate out of Mumbai, Delhi NCR, Bangalore, the UAE, and the United States. All documents, digital signatures (DSC), bank statements, and draft workpapers are managed via our encrypted 24/7 Client Portal with video conferences on Google Meet.",
    },
    {
      q: "How do you protect companies against Section 43B(h) 45-day MSME disallowances?",
      a: "We conduct a continuous monthly audit of your vendor aging ledger. We cross-verify vendor Udyam certificates to accurately classify Micro vs Small vs Medium enterprises (Medium enterprises are exempt from 43B(h)), ensure compliant bilateral written agreements are executed, and compute precise disallowance buffers before your tax audit is signed.",
    },
    {
      q: "How does your 24/7 Digital Client Portal work, and is our financial data secure?",
      a: "Every client receives instant, passwordless access to their own secure portal via a 4-digit biometric PIN or magic link. From the portal, directors can download bank-ready dockets (ITR acknowledgments, Form 3CD, audited financials) in 60 seconds, monitor live tax filing statuses, and securely upload bank statements. All data is protected with 256-bit encryption and strict access logs.",
    },
    {
      q: "What are your fee models for corporate statutory audit and tax advisory engagements?",
      a: "We operate on transparent, value-driven retainers and project-specific statutory fees aligned with ICAI minimum fee recommendations. Engagements are scoped upfront with detailed engagement letters (SA 210) covering statutory audits, monthly compliance, or litigation defense with zero hidden surprises.",
    },
  ];

  return (
    <section id="faqs" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-slate-200/90">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Clear Answers for Corporate Leaders &amp; Promoters
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Have questions about retaining a new Chartered Accountancy practice or resolving an urgent tax notice? Find direct answers below.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl border border-slate-200/90 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-xs sm:text-sm hover:text-btred-600 transition"
                >
                  <span>{faq.q}</span>
                  <div className={`w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-btred-600" : "text-slate-400"}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div className="mt-10 p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="text-sm font-bold text-slate-900">
              Have a specific question regarding your company’s audit or notice?
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Speak directly with Managing Partner CA Gunjan Jain on phone or WhatsApp.
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenBooking}
              className="px-5 py-2.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-sm transition"
            >
              Book Consultation
            </button>
            <a
              href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I have an inquiry regarding our company's taxation & audit.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
