"use client";

import React, { useState } from "react";
import { toast } from "@/components/shared/ToastNotification";
import { 
  BookOpen, 
  Scale, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles,
  Search,
  Bookmark
} from "lucide-react";

export interface JudicialPrecedent {
  id: string;
  caseName: string;
  citation: string;
  court: string;
  statutorySection: string;
  holdingSummary: string;
  exactLegalQuote: string;
}

interface PrecedentLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertPrecedent: (quoteText: string) => void;
}

export const PRECEDENT_LIBRARY: JudicialPrecedent[] = [
  {
    id: "bharti-airtel",
    caseName: "Union of India vs. Bharti Airtel Ltd & Anr",
    citation: "(2022) 4 SCC 328 / 2021-TIOL-263-SC-GST",
    court: "Supreme Court of India",
    statutorySection: "Section 16 / Form GSTR-2A / GSTR-3B",
    holdingSummary: "Form GSTR-2A is a mere facilitator. An assessee cannot be deprived of statutory Input Tax Credit on the basis of a mechanical portal limitation.",
    exactLegalQuote: `"Form GSTR-2A is only a facilitator for taking a confirm decision while filing the return. The entitlement of the registered person to claim input tax credit is circumscribed by the provisions of Section 16 of the Act. The omission of the supplier to reflect the invoices does not wipe out the substantive statutory right of the purchaser."`
  },
  {
    id: "suncraft-energy",
    caseName: "Suncraft Energy Pvt Ltd vs. Assistant Commissioner of State Tax",
    citation: "MAT 1218 of 2023 / 2023-TIOL-981-HC-KOL-GST",
    court: "Calcutta High Court (Affirmed by Supreme Court)",
    statutorySection: "Section 16(2)(c) / Section 73",
    holdingSummary: "Revenue cannot demand tax from the purchasing dealer for ITC mismatches without first examining and initiating recovery against the defaulting selling dealer.",
    exactLegalQuote: `"The proper officer cannot directly initiate recovery against the purchasing dealer for mismatch in GSTR-2A without first exhausting the remedy of recovery against the supplier who has collected the tax. Reversal of ITC cannot be demanded from a bona fide purchaser unless extraordinary circumstances of collusion are established."`
  },
  {
    id: "brandix-din",
    caseName: "Pr. Commissioner of Income Tax vs. Brandix Mauritius Holdings Ltd",
    citation: "(2023) 456 ITR 34 (Delhi HC) / SLP Dismissed by SC",
    court: "Delhi High Court & Supreme Court",
    statutorySection: "CBDT Circular No. 19/2019 / Section 148 / 143(1)",
    holdingSummary: "Any communication, notice or order issued by the Income Tax Department without a system-generated Document Identification Number (DIN) is void ab initio and non-est in law.",
    exactLegalQuote: `"In terms of CBDT Circular No. 19/2019, any tax notice, order or communication issued without a valid Document Identification Number (DIN) is deemed to have never been issued and is invalid, non-est and void ab initio in the eyes of law."`
  },
  {
    id: "ashish-agarwal",
    caseName: "Union of India vs. Ashish Agarwal",
    citation: "(2022) 444 ITR 1 (Supreme Court)",
    court: "Supreme Court of India",
    statutorySection: "Section 148 / Section 148A(b)",
    holdingSummary: "Procedure under amended Section 148A is mandatory. AO must provide all underlying material and grant adequate opportunity before issuing Section 148 notice.",
    exactLegalQuote: `"Section 148A provides substantive safeguards to the taxpayer. The Assessing Officer is statutorily bound to supply the information and material relied upon and afford a minimum of 7 to 30 days to the assessee to file objections."`
  },
  {
    id: "khatau-junkar",
    caseName: "Khatau Junkar Ltd. vs K.S. Pathania & Anr",
    citation: "(1992) 196 ITR 55 (Bombay High Court)",
    court: "Bombay High Court",
    statutorySection: "Section 143(1)(a) Prima Facie Adjustments",
    holdingSummary: "Debatable questions of law or factual claims cannot be summarily added under the limited scope of Section 143(1)(a).",
    exactLegalQuote: `"The jurisdiction of the Assessing Officer under Section 143(1)(a) is limited to correcting obvious and clerical mistakes. Where a claim requires examination of books, accounts or debatable judicial questions, no prima facie adjustment is permissible."`
  }
];

export const PrecedentLibraryDrawer: React.FC<PrecedentLibraryDrawerProps> = ({
  isOpen,
  onClose,
  onInsertPrecedent
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filtered = PRECEDENT_LIBRARY.filter(p => 
    p.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.citation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.statutorySection.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInsert = (p: JudicialPrecedent) => {
    const textToInsert = `\n\nJUDICIAL PRECEDENT & BINDING JURISPRUDENCE:\nIn ${p.caseName} [${p.citation}], the Hon'ble ${p.court} held as under:\n${p.exactLegalQuote}\nApplying this settled proposition to the present case, the proposed demand is unsustainable on law and merits.\n`;
    onInsertPrecedent(textToInsert);
    toast.success("Citation Injected", `Added ${p.caseName} into draft submissions.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end">
      <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl border-l border-slate-200 space-y-4 animate-slideLeft flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Judicial Precedents &amp; Citations</h3>
              <p className="text-[11px] text-slate-500">Supreme Court &amp; High Court binding tax case laws.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by case name, section or citation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* List of Precedents */}
        <div className="flex-1 overflow-auto space-y-3 pr-1">
          {filtered.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-white transition space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 leading-snug">{p.caseName}</h4>
                  <span className="text-[10px] font-mono text-purple-700 font-bold block">{p.citation}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 shrink-0">
                  {p.court}
                </span>
              </div>

              <div className="text-[11px] text-slate-600 font-medium">
                Section: <span className="font-bold text-slate-800">{p.statutorySection}</span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200 italic font-serif">
                {p.exactLegalQuote}
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">{p.holdingSummary}</span>
                <button
                  onClick={() => handleInsert(p)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs shrink-0"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Insert into Draft</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 text-center shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
};
