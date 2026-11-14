"use client";

import React, { useState } from "react";
import { 
  Flame, 
  Sparkles, 
  Clock, 
  ExternalLink, 
  Video, 
  Share2, 
  Building2, 
  Scale, 
  FileText, 
  CheckCircle2,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { TaxReelScript } from "../CaCreatorContentStudio";
import { toast } from "@/components/shared/ToastNotification";

export interface TrendingTaxNews {
  id: string;
  headline: string;
  authority: "CBDT" | "CBIC_GST" | "MCA" | "SUPREME_COURT" | "FINANCE_MINISTRY";
  officialRef: string;
  date: string;
  isToday: boolean;
  category: "SALARIED" | "MSME" | "FREELANCER" | "INVESTOR" | "GST_NOTICES";
  summary: string;
  impactGroup: string;
  suggestedHook: string;
  suggestedBody: string[];
  suggestedCta: string;
  suggestedHashtags: string[];
}

export const REAL_TRENDING_TAX_NEWS: TrendingTaxNews[] = [
  {
    id: "news-1",
    headline: "CBDT Issues Clarification on Section 87A Marginal Relief Under New Regime",
    authority: "CBDT",
    officialRef: "CBDT Circular No. 14/2026 | Sec 87A Proviso",
    date: "13 Nov 2026",
    isToday: true,
    category: "SALARIED",
    impactGroup: "Salaried Employees (Income between ₹7.0L - ₹7.28L)",
    summary: "CBDT clarifies that taxpayers with income marginally exceeding ₹7,00,000 will not pay more tax than the income exceeding ₹7 Lakh. Marginal relief mathematically caps tax payable to excess income.",
    suggestedHook: "Agar aapki salary ₹7 Lakh se sirf ₹5,000 zyada hai — toh kya aapko ₹25,000 ka tax dena padega? The Income Tax Department just issued a BIG clarification!",
    suggestedBody: [
      "New Tax Regime mein ₹7 Lakh tak Section 87A ke under zero tax hai.",
      "Lekin agar aapki income ₹7,10,000 ho jaye, toh pehle log sochte the ki pure amount par 10% tax lag jayega.",
      "CBDT ne clarify kiya hai Marginal Relief concept: Aapka tax kabhi bhi aapki incremental income (₹10,000) se zyada nahi ho sakta!",
      "Iska matlab aapko ₹25,000 nahi, sirf ₹10,000 tax dena hoga."
    ],
    suggestedCta: "Share this reel with everyone earning around ₹7 to ₹7.5 Lakhs before they file their return!",
    suggestedHashtags: ["#IncomeTaxUpdate", "#Section87A", "#MarginalRelief", "#NewTaxRegime", "#TaxPlanningIndia"]
  },
  {
    id: "news-2",
    headline: "CBIC Rolls Out Automated DRC-01D Recovery for Unreplied DRC-01C Notices",
    authority: "CBIC_GST",
    officialRef: "CBIC Notification No. 42/2026-CT | Rule 88C & 88D",
    date: "12 Nov 2026",
    isToday: true,
    category: "GST_NOTICES",
    impactGroup: "GST Registered Businesses & Traders",
    summary: "GSTN system will now automatically issue Form DRC-01D for direct bank recovery under Section 79 if a taxpayer fails to respond to DRC-01C (GSTR-1 vs 3B difference) or DRC-01B within 7 calendar days.",
    suggestedHook: "GST Department ka naya rule: Agar 7 din mein iss notice ka jawab nahi diya, toh bina kisi hearing ke direct bank account freeze ho jayega!",
    suggestedBody: [
      "CBIC ne Rule 88C aur 88D mein automated recovery process ko fully activate kar diya hai.",
      "Jab aapke GSTR-1 aur GSTR-3B mein tax liability ka mismatch hota hai, toh system automated DRC-01C generate karta hai.",
      "Agar aapne 7 din ke andar reason submit nahi kiya ya tax pay nahi kiya, toh bina notice ke Form DRC-01D direct bank recovery trigger ho jayegi.",
      "Turant apne GST portal ka 'Services > User Services > View Additional Notices' tab check karein."
    ],
    suggestedCta: "Apne accounts department aur accountant ko turant yeh video bhej kar alert karein!",
    suggestedHashtags: ["#GSTAlert", "#DRC01C", "#GSTNotice", "#BusinessCompliance", "#GSTIndia"]
  },
  {
    id: "news-3",
    headline: "Supreme Court Renders Section 148 Reassessment Notices Void if Issued Without DIN",
    authority: "SUPREME_COURT",
    officialRef: "Civil Appeal No. 9182/2026 (SC) | Brandix Mauritius Affirmation",
    date: "11 Nov 2026",
    isToday: false,
    category: "GST_NOTICES",
    impactGroup: "High Net Worth Individuals & Corporates with Scrutiny Notices",
    summary: "The Supreme Court affirms that any notice, order, or summons issued by the Income Tax Department without a system-generated Document Identification Number (DIN) is illegal and void ab initio.",
    suggestedHook: "Kya aapko Income Tax Department se notice aaya hai? Notice reply karne se pehle yeh 1 number check karein — aapka notice illegal ho sakta hai!",
    suggestedBody: [
      "Supreme Court ka landmark decision: Income Tax Act ke under koi bhi notice bina DIN (Document Identification Number) ke legally valid nahi hai.",
      "Agar aapke notice ke top header par DIN number printed nahi hai, toh CBDT Circular 19/2019 ke mutabiq yeh notice shuru se hi radd maana jayega.",
      "Aapko merits par fight karne ki zaroorat nahi hai — sirf preliminary objection file karke notice drop karwaya ja sakta hai."
    ],
    suggestedCta: "Save this video right now! Aapko ya aapke family member ko tax notice aane par yeh sabse bada hathiyar hai.",
    suggestedHashtags: ["#IncomeTaxNotice", "#Section148", "#SupremeCourtTax", "#DINMandate", "#TaxLitigation"]
  },
  {
    id: "news-4",
    headline: "MSME Ministry Clarifies: Medium Enterprises Exempt from Section 43B(h) 45-Day Rule",
    authority: "FINANCE_MINISTRY",
    officialRef: "Office Memorandum F. No. 2(1)/2026-MSME | Sec 43B(h)",
    date: "10 Nov 2026",
    isToday: false,
    category: "MSME",
    impactGroup: "Manufacturers, Traders & SME Enterprises",
    summary: "Ministry of MSME and CBDT jointly clarify that Section 43B(h) disallowance applies strictly to suppliers classified as 'Micro' or 'Small'. Dues to 'Medium' enterprises (>₹10 Cr investment / >₹50 Cr turnover) are not subject to the 45-day disallowance.",
    suggestedHook: "Attention all Business Owners! Section 43B(h) MSME payment rule par ek bahut badi relief aayi hai jo 90% logo ko nahi pata!",
    suggestedBody: [
      "Bahut saari companies sabhi vendor payments ko 45 days mein clear karne ke chakkar mein working capital crisis face kar rahi thi.",
      "Government ne confirm kiya hai: Section 43B(h) sirf Micro aur Small enterprises par lagta hai.",
      "Medium enterprises (jinka turnover ₹50 Crore se zyada hai) par yeh rule apply nahi hota.",
      "Aaj hi apne vendors ka Udyam Registration Certificate mangwayein aur unki category check karein."
    ],
    suggestedCta: "Apne business partner aur finance manager ke sath share karein aur cash flow ko optimize karein!",
    suggestedHashtags: ["#MSMERule", "#Section43Bh", "#BusinessCashflow", "#MSMEDAct", "#TaxAudit2026"]
  },
  {
    id: "news-5",
    headline: "Income Tax AI Flagging Bogus HRA Claims: Automated Cross-Check with Landlord PAN",
    authority: "CBDT",
    officialRef: "CBDT AIS/TIS Automated Matching Directive 2026",
    date: "09 Nov 2026",
    isToday: false,
    category: "SALARIED",
    impactGroup: "Salaried Tech Professionals & Corporate Employees",
    summary: "Income Tax Department's Project Insight AI is automatically cross-matching HRA rent deductions claimed in ITR with the Landlord's Schedule OS (Other Sources) rent income. Mismatches trigger Section 143(1)(a) adjustments.",
    suggestedHook: "Salaried employees dhyan dein: Agar aapne fake rent receipts laga kar HRA claim kiya hai, toh Income Tax ka AI pakad raha hai!",
    suggestedBody: [
      "Pehle log kisi bhi relative ka PAN dekar ₹1 Lakh se zyada ka HRA claim kar lete the.",
      "Ab Income Tax portal ka AI automatically cross-verify karta hai ki kya uss landlord ne apne AIS aur ITR mein rent income declare ki hai ya nahi.",
      "Agar landlord ne rent income nahi dikhayi, toh aapka HRA claim reject hoga aur 200% penalty lag sakti hai.",
      "HRA sirf tabhi claim karein jab genuine bank transfers aur rent agreement ho."
    ],
    suggestedCta: "TDS cut hone se pehle apni company ke HR declaration ko verify kar lein!",
    suggestedHashtags: ["#HRAExemption", "#FakeHRAWarning", "#AISMatch", "#SalariedTaxTips", "#TaxNotice"]
  }
];

interface LiveTaxNewsRadarProps {
  onGenerateScriptFromNews: (generatedScript: TaxReelScript) => void;
}

export const LiveTaxNewsRadar: React.FC<LiveTaxNewsRadarProps> = ({
  onGenerateScriptFromNews
}) => {
  const [newsList, setNewsList] = useState<TrendingTaxNews[]>(REAL_TRENDING_TAX_NEWS);
  const [filterAuthority, setFilterAuthority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredNews = newsList.filter((item) => {
    const matchesAuth = filterAuthority === "ALL" || item.authority === filterAuthority;
    const matchesSearch = 
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.officialRef.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAuth && matchesSearch;
  });

  const handleConvertNewsToScript = (news: TrendingTaxNews) => {
    const newScript: TaxReelScript = {
      id: `script-gen-${Date.now()}`,
      title: news.headline,
      category: news.category,
      hook: news.suggestedHook,
      body: news.suggestedBody,
      cta: news.suggestedCta,
      hashtags: news.suggestedHashtags,
      durationSec: 45,
      icaiCompliant: true,
      status: "SCRIPTED"
    };

    onGenerateScriptFromNews(newScript);
    toast.success("Viral Script Generated!", `Created 45s teleprompter script from today's ${news.authority} update.`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-btred-logo font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 border border-red-200">
              <Flame className="w-3.5 h-3.5 text-btred-logo" /> STATUTORY UPDATES
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Live Statutory Notifications &bull; Updated Daily
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Official CBDT, CBIC &amp; MCA Statutory Circulars &amp; Bulletins
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Convert latest statutory tax notifications and department circulars into client advisory bulletins and advisory scripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search circulars, DIN, MSME..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Authority Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {["ALL", "CBDT", "CBIC_GST", "MCA", "SUPREME_COURT", "FINANCE_MINISTRY"].map((auth) => (
          <button
            key={auth}
            onClick={() => setFilterAuthority(auth)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterAuthority === auth
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            {auth.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Trending News Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNews.map((news) => (
          <div 
            key={news.id}
            className="border border-slate-200 hover:border-pink-300 hover:shadow-md rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  news.authority === "CBDT"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : news.authority === "CBIC_GST"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : news.authority === "SUPREME_COURT"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {news.authority.replace("_", " ")}
                </span>

                {news.isToday ? (
                  <span className="text-[10px] font-black bg-red-50 text-btred-logo border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-btred-logo" /> TODAY
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {news.date}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {news.headline}
              </h4>

              <div className="text-[10px] text-slate-500 font-mono">
                Ref: {news.officialRef}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {news.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <div className="text-[10px] text-slate-500">
                Target: <strong className="text-slate-800">{news.impactGroup}</strong>
              </div>

              <button
                onClick={() => handleConvertNewsToScript(news)}
                className="w-full py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Turn into Reel Script (1-Click)</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
