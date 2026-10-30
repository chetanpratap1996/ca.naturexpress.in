"use client";

import React, { useState, useEffect } from "react";
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
  Calendar,
  Send,
  Edit3,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { toast } from "@/components/shared/ToastNotification";

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

Authorized Representative / Chartered Accountant
[FIRM_NAME] (FRN: [FIRM_FRN])`
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
An invoice of taxable value [DEMAND_AMOUNT] was punched twice due to ERP transmission glitch in GSTR-1. In GSTR-3B, actual tax liability was correctly computed and discharged in cash/credit ledger. The excess invoice was formally cancelled / credit note was issued in the subsequent tax return.

Hence, no short payment of tax has occurred and no recovery under Section 79 is warranted.

Authorized Signatory / Tax Practitioner
For [CLIENT_NAME]`
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
[FIRM_NAME]
Chartered Accountants for Assessee`
  },
  {
    id: "ITD_139_9_DEFECTIVE",
    title: "Income Tax Section 139(9) Notice of Defective Return",
    authority: "Centralized Processing Centre (CPC), Bengaluru / NFAC",
    applicableLaw: "Section 139(9) of the Income Tax Act, 1961",
    statutoryCitations: [
      "CBDT Circular No. 9/2006 on defective return rectifications",
      "Mangalam Organics Ltd vs. DCIT (ITAT Mumbai)",
      "Section 44AB read with Rule 12(2)"
    ],
    defaultGrounds: [
      "Tax Audit Report in Form 3CA/3CD or 3CB/3CD was successfully filed and accepted with valid UDIN prior to filing return.",
      "Balance Sheet and Profit & Loss particulars entered in Schedule Part A-BS and Part A-P&L agree with audited financials.",
      "Gross receipts under Section 44AD/44ADA do not exceed statutory turnover ceiling."
    ],
    replyBodyDraft: `To,
The Assessing Officer / CPC,
Income Tax Department, Bengaluru.

SUBJECT: Compliance & Rectification in Response to Defective Return Notice u/s 139(9) for AY [AY] - PAN: [CLIENT_PAN]

Respected Sir / Madam,

In reference to notice issued under Section 139(9) stating the return of income filed by [CLIENT_NAME] for AY [AY] is defective:

1. DEFECT CODE & CLARIFICATION:
The notice points out an alleged omission regarding tax audit report particulars or Schedule BS/PL disclosure. 
We submit that the Tax Audit Report under Section 44AB was duly uploaded with ICAI UDIN and acknowledged by the system.

2. SUBMISSION:
The return of income contains complete and true particulars of income. The audited accounts, along with Notes and Form 3CD, are attached hereto. The alleged defect stands rectified in its entirety.

3. PRAYER:
It is prayed that the defect be treated as cured and the return of income be processed under Section 143(1).

Yours faithfully,
For [CLIENT_NAME]

Authorized Signatory / Chartered Accountant`
  },
  {
    id: "ITD_148_REASSESSMENT",
    title: "Income Tax Section 148 / 148A(b) Notice for Escaped Income Reassessment",
    authority: "National Faceless Assessment Centre (NFAC) / Jurisdictional AO",
    applicableLaw: "Section 148 read with Section 148A(b) of the Income Tax Act, 1961 (as amended)",
    statutoryCitations: [
      "Union of India vs. Ashish Agarwal (2022) 444 ITR 1 (Supreme Court)",
      "Rajiv Bansal vs. Union of India (2023 Allahabad HC / Supreme Court)",
      "Section 149 time limitations and Section 151 sanction mandates"
    ],
    defaultGrounds: [
      "No tangible material suggests income chargeable to tax exceeding ₹50 Lakh has escaped assessment under Section 149(1)(b).",
      "Approval under Section 151 was not obtained from the specified authority competent for the relevant assessment year.",
      "Transactions flagged in Insight Portal represent routine banking and capital asset sales already disclosed in audited books."
    ],
    replyBodyDraft: `To,
The Assessing Officer,
National Faceless Assessment Centre (NFAC),
Income Tax Department, New Delhi.

SUBJECT: Detailed Objections in Response to Notice under Section 148A(b) for AY [AY] - PAN: [CLIENT_PAN]

Respected Sir / Madam,

The Assessee [CLIENT_NAME] (PAN: [CLIENT_PAN]) strongly objects to the proposed initiation of reassessment proceedings under Section 148 on the following statutory and constitutional grounds:

1. JURISDICTIONAL OBJECTIONS:
(a) The notice is barred by limitation under Section 149 of the Act. As established by the Hon'ble Supreme Court in Union of India vs. Ashish Agarwal, reassessment beyond 3 years can only proceed if the AO possesses tangible material proving escapement of income represented in the form of asset exceeding ₹50,00,000.
(b) Sanction under Section 151 must be obtained from the specified authority (CCIT/DGIT) and not lower ranking authorities.

2. FACTUAL CLARIFICATION:
The alleged unexplained transaction of [DEMAND_AMOUNT] represents commercial banking transactions from the assessee's regular audited bank account, which was completely reflected in the audited balance sheet and return of income.

3. PRAYER:
It is respectfully prayed that the proceedings under Section 148A(b) be dropped and an order under Section 148A(d) holding that this is NOT a fit case for issuance of notice under Section 148 be passed.

Yours faithfully,
For [CLIENT_NAME]

[FIRM_NAME]
Chartered Accountants`
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
  const [isEditing, setIsEditing] = useState(false);
  const [customDraft, setCustomDraft] = useState("");

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0] || null;
  const currentTemplate = STATUTORY_NOTICE_TEMPLATES.find(t => t.id === selectedNoticeType) || STATUTORY_NOTICE_TEMPLATES[0];

  // Generate dynamic draft
  const defaultInterpolated = currentTemplate.replyBodyDraft
    .replace(/\[CLIENT_NAME\]/g, selectedClient?.name || "Apex Laboratories Private Limited")
    .replace(/\[CLIENT_PAN\]/g, selectedClient?.pan || "AABCA9182K")
    .replace(/\[CLIENT_GSTIN\]/g, selectedClient?.gstin || "23AABCA9182K1Z5")
    .replace(/\[NOTICE_DATE\]/g, noticeDate)
    .replace(/\[DEMAND_AMOUNT\]/g, demandAmount)
    .replace(/\[PERIOD\]/g, period)
    .replace(/\[AY\]/g, "2025-26")
    .replace(/\[NOTICE_REF\]/g, "2026/IND/8842")
    .replace(/\[FIRM_NAME\]/g, DEFAULT_FIRM_BRANDING.firmName)
    .replace(/\[FIRM_FRN\]/g, DEFAULT_FIRM_BRANDING.frn);

  useEffect(() => {
    setCustomDraft(defaultInterpolated);
    setIsEditing(false);
  }, [selectedNoticeType, selectedClientId, noticeDate, demandAmount, period]);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(customDraft);
    setCopied(true);
    toast.success("Draft Copied", "Legal notice submissions copied to clipboard.");
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const rawPhone = selectedClient?.primaryContact?.phone || "9820044101";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    const text = encodeURIComponent(
      `Dear ${selectedClient?.primaryContact?.name || selectedClient?.name || "Client"},\n\n` +
      `We have finalized the legal reply submissions for your ${currentTemplate.title} (Demand: ${demandAmount}).\n\n` +
      `Key Judicial Precedents Cited: ${currentTemplate.statutoryCitations[0]}\n\n` +
      `Please review the draft submissions on your client portal before we file on the government portal.\n\n` +
      `Regards,\n${DEFAULT_FIRM_BRANDING.firmName}`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50/70 via-white to-red-50/40 border border-red-200 rounded-2xl p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-red-50 text-btred-logo border border-red-200 rounded-full flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-btred-logo" /> High-Margin Litigation Desk
              </span>
              <span className="text-xs text-slate-500 font-mono">Supreme Court &amp; High Court Grounded</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-btred-logo" /> Statutory Tax Scrutiny Legal Reply Drafter
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Turn ₹5,000–₹50,000 notice representation into a 2-minute workflow. Automatically drafts citation-backed legal responses for GST ASMT-10, DRC-01C, Income Tax 143(1)(a), 139(9) defective returns, and Section 148 reassessment notices.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span>{isEditing ? "Preview Mode" : "Edit Draft"}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              title="Share draft with client via WhatsApp for approval"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Client</span>
            </button>

            <button
              onClick={handleCopyDraft}
              className="px-4 py-2.5 bg-btred-logo hover:bg-red-700 text-white shadow-sm font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Legal Submissions"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Letter</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Notice Category</label>
            <select
              value={selectedNoticeType}
              onChange={(e) => setSelectedNoticeType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500"
            >
              <option value="GST_ASMT_10_MISMATCH">GST ASMT-10 (2B vs 3B ITC)</option>
              <option value="GST_DRC_01C_LIABILITY">GST DRC-01C (GSTR-1 vs 3B)</option>
              <option value="ITD_143_1_A_PRIMA_FACIE">Income Tax 143(1)(a) Defect</option>
              <option value="ITD_139_9_DEFECTIVE">Income Tax 139(9) Defective Return</option>
              <option value="ITD_148_REASSESSMENT">Income Tax 148 Reassessment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Client Entity</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500"
            >
              {clients.length === 0 ? (
                <option value="">No clients</option>
              ) : (
                clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.pan})</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Notice / Demand Amount</label>
            <input
              type="text"
              value={demandAmount}
              onChange={(e) => setDemandAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Assessment Period / AY</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Case Laws & Citations Ribbon */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2 text-slate-900">
        <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" /> Built-in Judicial Precedents &amp; Statutory Defenses
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {currentTemplate.statutoryCitations.map((cite, i) => (
            <span key={i} className="text-xs font-serif bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-xl">
              ⚖️ {cite}
            </span>
          ))}
        </div>
      </div>

      {/* Draft Document Display / Editor */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-3xl p-8 sm:p-12 shadow-sm font-serif max-w-4xl mx-auto space-y-4 text-xs sm:text-sm leading-relaxed">
        {/* Letterhead Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
          <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">{DEFAULT_FIRM_BRANDING.firmName}</h1>
          <p className="text-xs text-slate-600 font-sans font-medium">Chartered Accountants &bull; FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; Peer Review: {DEFAULT_FIRM_BRANDING.peerReviewNo}</p>
          <p className="text-[11px] text-slate-500 font-sans">{DEFAULT_FIRM_BRANDING.headOffice}</p>
        </div>

        {isEditing ? (
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-sans">
              <span className="text-slate-600 font-semibold">Editing Legal Draft:</span>
              <button
                onClick={() => setCustomDraft(defaultInterpolated)}
                className="text-btred-logo hover:underline flex items-center gap-1 font-bold text-[11px]"
              >
                <RefreshCw className="w-3 h-3" /> Reset to Statutory Template
              </button>
            </div>
            <textarea
              rows={24}
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-serif text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-normal leading-relaxed"
            />
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{customDraft}</div>
        )}
      </div>
    </div>
  );
};
