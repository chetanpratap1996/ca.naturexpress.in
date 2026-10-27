"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ShieldAlert, 
  Building2, 
  BookOpen, 
  Sparkles,
  Scale,
  Calendar
} from "lucide-react";
import { ClientEntity } from "@/lib/types";

export type NoticeType = 
  | "GST_ASMT_10_MISMATCH" 
  | "GST_DRC_01C_LIABILITY" 
  | "ITD_143_1_A_PRIMA_FACIE" 
  | "ITD_139_9_DEFECTIVE" 
  | "ITD_148_REASSESSMENT";

export interface NoticeReplyTemplate {
  id: NoticeType;
  title: string;
  authority: string;
  applicableLaw: string;
  defaultGrounds: string[];
  statutoryCitations: string[];
  replyBodyDraft: string;
}

const STATUTORY_NOTICE_TEMPLATES: NoticeReplyTemplate[] = [
  {
    id: "GST_ASMT_10_MISMATCH",
    title: "GST ASMT-10 / DRC-01A (ITC Discrepancy between GSTR-2B and GSTR-3B)",
    authority: "Proper Officer / State GST Authority / Range Superintendent",
    applicableLaw: "Section 61 / Section 73 of the CGST Act, 2017 read with Rule 99",
    statutoryCitations: [
      "Union of India vs. Bharti Airtel Ltd (Supreme Court of India)",
      "Suncraft Energy Pvt Ltd vs. Assistant Commissioner (Calcutta HC)",
      "Section 16(2)(aa) and Rule 37A proviso"
    ],
    defaultGrounds: [
      "GSTR-2B is a dynamic statement and certain genuine invoices were uploaded late by suppliers in subsequent tax periods.",
      "ITC was availed strictly in terms of valid tax invoices and proof of receipt of goods/services under Section 16(2).",
      "Supplier has discharged outward GST liability in subsequent GSTR-3B, hence no loss has been caused to the government exchequer."
    ],
    replyBodyDraft: `To,
The Proper Officer / Superintendent of Central & State GST,
Indore Range / Division, Madhya Pradesh.

SUBJECT: Comprehensive Written Submissions in Response to Scrutiny Notice in Form GST ASMT-10 dated [NOTICE_DATE] for Tax Period [PERIOD]

Respected Sir / Madam,

We, on behalf of the registered taxpayer [CLIENT_NAME], holding GSTIN: [CLIENT_GSTIN], respectfully submit our reply to the scrutiny notice under Section 61 of the CGST Act, 2017 as under:

1. BRIEF FACTS OF THE CASE:
The learned Proper Officer has observed an alleged discrepancy between the Input Tax Credit (ITC) reflected in auto-drafted Form GSTR-2B and ITC availed in Form GSTR-3B amounting to [DEMAND_AMOUNT].

2. STATUTORY SUBMISSIONS & JUDICIAL PRECEDENTS:
(a) Reliance is placed on the landmark judgment of the Hon'ble Calcutta High Court in Suncraft Energy Private Limited [MAT 1218 of 2023], wherein the Hon'ble Court categorically held that no demand can be raised on the purchasing dealer for ITC mismatches without first examining and initiating recovery against the defaulting supplier.
(b) All underlying transactions represent genuine commercial purchases supported by original tax invoices, lorry receipts / e-way bills, and payments settled through normal banking channels under Section 16(2).
(c) The difference of [DEMAND_AMOUNT] arose purely due to timing differences where vendors uploaded their Form GSTR-1 in subsequent tax periods.

3. PRAYER:
In view of the above factual submissions and settled jurisprudence, it is respectfully prayed that:
(a) The proposed discrepancy in Form ASMT-10 be dropped in its entirety.
(b) An order dropping proceedings under Form GST ASMT-12 be issued to the assessee.

Yours faithfully,
For [CLIENT_NAME]

Authorized Representative / Chartered Accountant`
  },
  {
    id: "ITD_143_1_A_PRIMA_FACIE",
    title: "Income Tax Section 143(1)(a) Intimation of Proposed Prima Facie Adjustment",
    authority: "National Faceless Assessment Centre (NFAC), New Delhi",
    applicableLaw: "Section 143(1)(a) of the Income Tax Act, 1961",
    statutoryCitations: [
      "Section 143(1)(a)(ii) incorrect claim apparent from return",
      "CBDT Circular No. 3/2021 on processing of returns",
      "Khatau Junkar Ltd. vs K.S. Pathania (Bombay High Court)"
    ],
    defaultGrounds: [
      "The proposed addition of uncredited receipts was already declared under Schedule OS.",
      "TDS deducted under Section 194J/194C matches Form 26AS / AIS records.",
      "The adjustment is outside the limited scope of Section 143(1)(a) as it involves a debatable question of law and fact."
    ],
    replyBodyDraft: `To,
The Assessing Officer / Commissioner of Income Tax,
National Faceless Assessment Centre (NFAC),
Income Tax Department, New Delhi.

SUBJECT: Formal Response to Communication under Section 143(1)(a) for Assessment Year [AY] - PAN: [CLIENT_PAN]

Respected Sir / Madam,

The Assessee [CLIENT_NAME] (PAN: [CLIENT_PAN]) respectfully submits this response to the communication proposing prima facie adjustment to total income:

1. REASON FOR VARIANCE:
The system proposed an adjustment of [DEMAND_AMOUNT] on account of mismatch between Gross Receipts reported in Form 26AS/AIS and total turnover reported in the Return of Income.

2. SUBMISSION ON MERITS:
(a) Under Section 143(1)(a), the scope of adjustment is confined strictly to arithmetical errors or claims where required audit reports were omitted. A debatable issue requiring examination of accounts cannot be summarily added under Section 143(1)(a) as held in CIT vs. Eicher Goodearth Ltd.
(b) The difference represents gross client reimbursements / exempt income which has been fully reconciled in the attached reconciliation sheet.

3. PRAYER:
It is most respectfully prayed that the proposed prima facie adjustment be deleted and the return of income be accepted as filed.

Yours faithfully,
Chartered Accountants for Assessee`
  },
  {
    id: "GST_DRC_01C_LIABILITY",
    title: "Form GST DRC-01C (Part B Reply: GSTR-1 vs GSTR-3B Tax Difference)",
    authority: "Automated GST Portal System / State Jurisdictional Officer",
    applicableLaw: "Rule 88C of the Central Goods and Services Tax Rules, 2017",
    statutoryCitations: [
      "Rule 88C(2) Explanation for tax differential",
      "Circular No. 170/02/2022-GST on GSTR-1 vs 3B reporting"
    ],
    defaultGrounds: [
      "Differential liability was caused by typographical data entry error in Table 4 of GSTR-1, corrected in subsequent month.",
      "Credit note inadvertently reported under forward charge.",
      "Advance payment received against supply adjusted in the subsequent return."
    ],
    replyBodyDraft: `PART B - REPLY BY ASSESSEE UNDER RULE 88C TO FORM GST DRC-01C

Reference No: DRC-01C/[NOTICE_REF]
Taxpayer: [CLIENT_NAME] | GSTIN: [CLIENT_GSTIN]

1. REASON FOR DIFFERENCE BETWEEN GSTR-1 AND GSTR-3B:
We refer to the intimation under Rule 88C regarding excess tax liability declared in Form GSTR-1 compared to Form GSTR-3B for [PERIOD].

2. SPECIFIC REASON CODE UNDER RULE 88C:
The reason for the difference falls under Category: "Typographical / Data Entry Error in GSTR-1 amended in subsequent period".

3. FACTUAL CLARIFICATION:
An invoice of taxable value ₹[DEMAND_AMOUNT] was punched twice due to ERP transmission glitch in GSTR-1. In GSTR-3B, actual tax liability was correctly computed and discharged in cash/credit ledger. The excess invoice was formally cancelled / credit note was issued in the subsequent tax return.

Hence, no short payment of tax has occurred.

Authorized Signatory / Tax Practitioner`
  }
];

interface NoticeReplyDrafterProps {
  clients?: ClientEntity[];
}

export const NoticeReplyDrafter: React.FC<NoticeReplyDrafterProps> = ({ clients = [] }) => {
  const [selectedNoticeType, setSelectedNoticeType] = useState<NoticeType>("GST_ASMT_10_MISMATCH");
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [noticeDate, setNoticeDate] = useState("2026-10-15");
  const [demandAmount, setDemandAmount] = useState("₹2,45,000");
  const [period, setPeriod] = useState("FY 2024-25 / Q2");
  const [copied, setCopied] = useState(false);

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;
  const currentTemplate = STATUTORY_NOTICE_TEMPLATES.find(t => t.id === selectedNoticeType) || STATUTORY_NOTICE_TEMPLATES[0];

  // Dynamic interpolation of draft
  const generatedDraft = currentTemplate.replyBodyDraft
    .replace(/\[CLIENT_NAME\]/g, selectedClient?.name || "Messrs ABC Enterprises Ltd")
    .replace(/\[CLIENT_PAN\]/g, selectedClient?.pan || "AAACB1234F")
    .replace(/\[CLIENT_GSTIN\]/g, selectedClient?.gstin || "23AAACB1234L1Z2")
    .replace(/\[NOTICE_DATE\]/g, noticeDate)
    .replace(/\[DEMAND_AMOUNT\]/g, demandAmount)
    .replace(/\[PERIOD\]/g, period)
    .replace(/\[AY\]/g, "2025-26")
    .replace(/\[NOTICE_REF\]/g, "2026/IND/8842");

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-rose-950 border border-red-700/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 rounded-full flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-red-300" /> High-Margin Litigation Desk
              </span>
              <span className="text-xs text-slate-400 font-mono">1-Click Legal Notice Reply Drafter</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-btred-logo" /> Statutory Tax Scrutiny Legal Reply Drafter
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Turn ₹5,000–₹25,000 notice representation into a 2-minute workflow. Automatically drafts citation-backed legal responses for GST ASMT-10, DRC-01C, and Income Tax 143(1)(a) defect intimations with Supreme Court &amp; High Court rulings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDraft}
              className="px-4 py-2.5 bg-btred-logo hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied Legal Draft!" : "Copy Legal Submissions"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Letter</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Notice Type</label>
            <select
              value={selectedNoticeType}
              onChange={(e) => setSelectedNoticeType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-red-400"
            >
              <option value="GST_ASMT_10_MISMATCH">GST ASMT-10 (2B vs 3B ITC)</option>
              <option value="GST_DRC_01C_LIABILITY">GST DRC-01C (GSTR-1 vs 3B)</option>
              <option value="ITD_143_1_A_PRIMA_FACIE">Income Tax 143(1)(a) Defect</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Select Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-red-400"
            >
              {clients.length === 0 ? (
                <option value="">No clients (Using Tata Steel sample)</option>
              ) : (
                clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.pan})</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Notice / Demand Amount</label>
            <input
              type="text"
              value={demandAmount}
              onChange={(e) => setDemandAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Assessment Period</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-red-400"
            />
          </div>
        </div>
      </div>

      {/* Case Laws & Citations Ribbon */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Built-in Judicial Precedents &amp; Statutory Defenses
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {currentTemplate.statutoryCitations.map((cite, i) => (
            <span key={i} className="text-xs font-serif bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1 rounded-xl">
              ⚖️ {cite}
            </span>
          ))}
        </div>
      </div>

      {/* Draft Document Display */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 sm:p-12 shadow-2xl font-serif max-w-4xl mx-auto space-y-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
        {generatedDraft}
      </div>
    </div>
  );
};
