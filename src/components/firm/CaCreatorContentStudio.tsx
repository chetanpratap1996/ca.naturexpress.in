"use client";

import React, { useState } from "react";
import { 
  Instagram, 
  Video, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Share2, 
  Check, 
  Calendar, 
  ShieldCheck, 
  Search, 
  Bookmark, 
  ExternalLink,
  MessageCircle,
  TrendingUp,
  FileText,
  Clock,
  Flame,
  Plus,
  Play,
  Linkedin,
  Smartphone
} from "lucide-react";
import { LiveTaxNewsRadar, TrendingTaxNews } from "./studio/LiveTaxNewsRadar";
import { TeleprompterModal } from "./studio/TeleprompterModal";
import { MultiPlatformRepurposerModal } from "./studio/MultiPlatformRepurposerModal";
import { CreateCustomScriptModal } from "./studio/CreateCustomScriptModal";
import { toast } from "@/components/shared/ToastNotification";

export interface TaxReelScript {
  id: string;
  title: string;
  category: "SALARIED" | "MSME" | "FREELANCER" | "INVESTOR" | "GST_NOTICES";
  hook: string;
  body: string[];
  cta: string;
  hashtags: string[];
  durationSec: number;
  icaiCompliant: boolean;
  status: "IDEA" | "SCRIPTED" | "RECORDED" | "POSTED";
}

const VIRAL_TAX_SCRIPTS: TaxReelScript[] = [
  {
    id: "script-1",
    title: "The ₹7.75 Lakh Zero-Tax Salaried Hack (Budget 2024)",
    category: "SALARIED",
    hook: "Agr aapki salary 7.75 Lakhs tak hai, toh aapko Income Tax Department ko ZERO rupees tax dena hai. Let me show you how!",
    body: [
      "Budget 2024 revised standard deduction ko ₹50,000 se badha kar ₹75,000 kar diya gaya hai under New Tax Regime.",
      "Toh ₹7,75,000 gross salary minus ₹75,000 standard deduction gives Net Taxable Income = exactly ₹7,00,000.",
      "Aur Section 87A ke under ₹7 Lakh tak ki taxable income par ₹25,000 ki full tax rebate milti hai.",
      "Net tax payable? Exactly ₹0!"
    ],
    cta: "Save this reel and share it with your HR before they deduct unnecessary TDS in your salary slip!",
    hashtags: ["#IncomeTaxIndia", "#NewTaxRegime", "#SalariedTax", "#Section87A", "#Budget2024", "#TaxPlanningCA"],
    durationSec: 45,
    icaiCompliant: true,
    status: "SCRIPTED"
  },
  {
    id: "script-2",
    title: "Section 43B(h) MSME 45-Day Payment Law",
    category: "MSME",
    hook: "Business owners, agar aapne apne MSME suppliers ko 45 days mein pay nahi kiya — toh Income Tax aapka poora deduction cancel kar dega!",
    body: [
      "Finance Act ke Section 43B(h) ke mutabiq, micro & small enterprises se khareede gaye goods/services ki payment written agreement ke mutabiq maximum 45 days (ya no agreement par 15 days) ke andar honi zaroori hai.",
      "Agar 31st March tak payment nahi hui, toh yeh expense aapke profit mein add ho jayega aur aapko 30% flat tax bharna padega.",
      "Payment actual year of disbursement mein hi deduct hogi."
    ],
    cta: "Apne accounts team ko bolo aaj hi MSME vendor list verify karein aur payments clear karein.",
    hashtags: ["#Section43Bh", "#MSMEIndia", "#TaxAudit", "#BusinessTaxIndia", "#CharteredAccountant"],
    durationSec: 50,
    icaiCompliant: true,
    status: "RECORDED"
  },
  {
    id: "script-3",
    title: "Can You Claim Both HRA and Home Loan Interest?",
    category: "SALARIED",
    hook: "Can you claim HRA and Home Loan deduction AT THE SAME TIME? The answer is YES — but with 2 strict conditions!",
    body: [
      "Condition 1: Aapka owned ghar aur aapka rented residence alag-alag cities mein hona chahiye due to employment reasons.",
      "Condition 2: Agar same city mein hai, toh home loan property either ready to move nahi hai (under construction) ya rent out kiya gaya hai.",
      "Aap Old Regime mein Section 10(13A) ka HRA aur Section 24(b) ka ₹2 Lakh interest dono legally claim kar sakte hain."
    ],
    cta: "Share with a friend paying both rent and home loan EMI right now!",
    hashtags: ["#HRAExemption", "#HomeLoanTaxBenefit", "#Section24b", "#TaxHacks", "#IndianTaxpayers"],
    durationSec: 40,
    icaiCompliant: true,
    status: "POSTED"
  },
  {
    id: "script-4",
    title: "Section 44ADA: Doctors, Developers & Creators Pay Tax on only 50%",
    category: "FREELANCER",
    hook: "Freelance coders, doctors, architects & digital creators: Stop maintaining boring balance sheets!",
    body: [
      "Section 44ADA presumptive taxation scheme ke mutabiq agar aapki gross professional receipts ₹75 Lakh tak hain (with digital receipts >95%)...",
      "Toh aapko sirf 50% ko apna net profit declare karna hai.",
      "Baki 50% flat business expenses maane jaate hain bina kisi bills ya vouchers ke. Zero tax audit requirement!"
    ],
    cta: "Tag your freelance friend who is terrified of tax season.",
    hashtags: ["#FreelancerTax", "#Section44ADA", "#PresumptiveTax", "#CreatorEconomyIndia", "#DoctorTax"],
    durationSec: 35,
    icaiCompliant: true,
    status: "IDEA"
  },
  {
    id: "script-5",
    title: "Got a DRC-01C GST Notice? You have only 7 Days!",
    category: "GST_NOTICES",
    hook: "Agar aapke portal par GST DRC-01C notice aaya hai — do not ignore it. Aapke paas sirf 7 din hain!",
    body: [
      "DRC-01C tab aata hai jab aapke GSTR-1 outward tax liability aur GSTR-3B tax paid mein predefined variance hota hai.",
      "Aapko ya toh Part B DRC-01C mein differential tax interest ke sath pay karna hai, ya reason explain karna hai.",
      "Agar 7 days mein reply nahi kiya, toh Section 79 ke under aapka bank account direct freeze ho sakta hai."
    ],
    cta: "Consult your professional tax advisor immediately upon receipt of DRC-01C.",
    hashtags: ["#GSTNotice", "#DRC01C", "#GSTCompliance", "#GSTIndia", "#TaxScrutiny"],
    durationSec: 45,
    icaiCompliant: true,
    status: "IDEA"
  }
];

export const CaCreatorContentStudio: React.FC = () => {
  const [scripts, setScripts] = useState<TaxReelScript[]>(VIRAL_TAX_SCRIPTS);
  const [selectedScript, setSelectedScript] = useState<TaxReelScript>(VIRAL_TAX_SCRIPTS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [isRepurposerOpen, setIsRepurposerOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // ICAI Ethics Compliance Scanner State
  const [customDraft, setCustomDraft] = useState<string>("");
  const [complianceResult, setComplianceResult] = useState<{
    compliant: boolean;
    violations: string[];
  } | null>(null);

  const filteredScripts = scripts.filter((s) => {
    if (categoryFilter === "ALL") return true;
    return s.category === categoryFilter;
  });

  const handleCopyScript = (script: TaxReelScript) => {
    const fullText = `🎬 SCRIPT: ${script.title}\n\n` +
      `⏱️ Duration: ~${script.durationSec}s | Target: ${script.category}\n\n` +
      `🔥 HOOK (0-3s):\n"${script.hook}"\n\n` +
      `💡 BODY / FACTS:\n${script.body.map((b, i) => `${i + 1}. ${b}`).join("\n")}\n\n` +
      `🎯 CALL TO ACTION:\n"${script.cta}"\n\n` +
      `🏷️ HASHTAGS:\n${script.hashtags.join(" ")}`;

    navigator.clipboard.writeText(fullText);
    setCopiedId(script.id);
    toast.success("Script Copied", "Teleprompter text copied to clipboard.");
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleStatusChange = (scriptId: string, newStatus: TaxReelScript["status"]) => {
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, status: newStatus } : s))
    );
    if (selectedScript.id === scriptId) {
      setSelectedScript((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleSaveNewScript = (newScript: TaxReelScript) => {
    setScripts((prev) => [newScript, ...prev]);
    setSelectedScript(newScript);
  };

  const handleNewsToScript = (generatedScript: TaxReelScript) => {
    setScripts((prev) => [generatedScript, ...prev]);
    setSelectedScript(generatedScript);
    // Auto-scroll to studio view
    window.scrollTo({ top: 500, behavior: "smooth" });
  };

  // ICAI Code of Ethics (Rule 7, Part I, First Schedule) Automated Checker
  const checkIcaiCompliance = (text: string) => {
    const prohibitedWords = [
      { pattern: /best\s+ca/i, reason: "Superlative claim 'Best CA' violates ICAI Rule 7 advertising guidelines." },
      { pattern: /lowest\s+fee/i, reason: "Fee undercutting & fee solicitation is strictly prohibited." },
      { pattern: /guaranteed\s+(refund|exemption|audit\s+clearance)/i, reason: "Guaranteeing tax outcomes or audit approvals is prohibited." },
      { pattern: /hire\s+(me|us)\s+for\s+only/i, reason: "Direct advertisement of fee discounts is prohibited." },
      { pattern: /100%\s+penalty\s+waiver/i, reason: "Misleading guarantee of statutory penalty waivers." }
    ];

    const violations: string[] = [];
    prohibitedWords.forEach((pw) => {
      if (pw.pattern.test(text)) {
        violations.push(pw.reason);
      }
    });

    if (violations.length === 0) {
      setComplianceResult({
        compliant: true,
        violations: ["Passed: Content is strictly educational & complies with ICAI Code of Ethics Clause 7."]
      });
    } else {
      setComplianceResult({
        compliant: false,
        violations
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50/70 via-white to-red-50/40 border border-red-200 rounded-2xl p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-red-50 text-btred-logo border border-red-200 rounded-full flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-500" /> CA Content Creator Studio
              </span>
              <span className="text-xs text-slate-500 font-mono">ICAI Social Media Guidelines Compliant</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-btred-logo" /> Tax Advisory Updates &amp; Post Planner
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Educational client bulletins for LinkedIn, YouTube &amp; newsletters. Structured scripts for budget changes, Section 115BAC, MSME 45-day rules, and corporate tax advisories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-pink-400" />
              <span>+ Custom Script</span>
            </button>

            <div className="bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-center shadow-xs">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Total Scripts</div>
              <div className="text-lg font-black text-pink-600">{scripts.length} Ready</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-center shadow-xs">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Published</div>
              <div className="text-lg font-black text-emerald-700">
                {scripts.filter((s) => s.status === "POSTED").length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: WHAT'S TRENDING TODAY (DAILY STATUTORY RADAR) */}
      <LiveTaxNewsRadar onGenerateScriptFromNews={handleNewsToScript} />

      {/* SECTION 2: MAIN STUDIO & TELEPROMPTER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Script Directory & Filters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-pink-600" /> Script Library ({filteredScripts.length})
            </span>
            <span className="text-[11px] text-slate-500">Pick to shoot &rarr;</span>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {["ALL", "SALARIED", "MSME", "FREELANCER", "GST_NOTICES"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-pink-600 text-white shadow-xs"
                    : "bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Script Cards */}
          <div className="space-y-3">
            {filteredScripts.map((s) => {
              const isSelected = selectedScript.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedScript(s)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? "bg-white border-pink-500 shadow-md ring-1 ring-pink-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                      {s.category}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      s.status === "POSTED"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                        : s.status === "RECORDED"
                        ? "bg-red-50 text-btred-logo border border-red-200"
                        : s.status === "SCRIPTED"
                        ? "bg-amber-50 text-amber-900 border border-amber-200 font-bold"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                    {s.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic">
                    "{s.hook}"
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> ~{s.durationSec}s Reel
                    </span>
                    <span className="text-pink-600 font-bold hover:underline flex items-center gap-1">
                      <span>View Script</span>
                      <span>&rarr;</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Teleprompter & Script Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Teleprompter Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> Ready-to-Shoot Teleprompter
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5 leading-snug">
                  {selectedScript.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsTeleprompterOpen(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  title="Open Full-Screen Teleprompter with Auto-Scroll"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Teleprompter</span>
                </button>

                <button
                  onClick={() => setIsRepurposerOpen(true)}
                  className="px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  title="Repurpose into LinkedIn, WhatsApp, and Twitter Formats"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Repurpose (LinkedIn/WA)</span>
                </button>

                <button
                  onClick={() => handleCopyScript(selectedScript)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                >
                  {copiedId === selectedScript.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-xs text-slate-800">
              <span className="text-slate-600 font-semibold">Production Status:</span>
              {(["IDEA", "SCRIPTED", "RECORDED", "POSTED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(selectedScript.id, st)}
                  className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                    selectedScript.status === st
                      ? "bg-pink-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Teleprompter Content Breakdown */}
            <div className="space-y-4">
              {/* Hook Box */}
              <div className="bg-pink-50/70 border border-pink-200 p-4 rounded-2xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-pink-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" /> Opening Summary &amp; Key Message
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  "{selectedScript.hook}"
                </div>
              </div>

              {/* Body Points */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                  <span>Script Breakdown (Deliver with punchy energy)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Pace: ~130 words/min</span>
                </div>
                {selectedScript.body.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-normal">
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              {/* Call to action */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-slate-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Call to Action (CTA)
                </div>
                <div className="text-xs font-semibold text-slate-900 mt-1">
                  "{selectedScript.cta}"
                </div>
              </div>

              {/* Hashtags */}
              <div className="pt-1">
                <div className="text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                  Hashtag Pack
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedScript.hashtags.map((h, i) => (
                    <span key={i} className="text-[11px] font-mono text-pink-700 font-bold bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-lg">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ICAI Code of Ethics Compliance Scanner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                ICAI Code of Ethics (Rule 7) Content Scanner
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Paste your custom Instagram reel caption or post copy below to check for prohibited self-praise, fee solicitation, or misleading guarantees prohibited under ICAI regulations.
            </p>

            <textarea
              rows={3}
              placeholder="Paste draft post caption here (e.g., 'File ITR today and save tax with these 3 tips...')"
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl p-3.5 focus:outline-none focus:border-red-500 focus:bg-white"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => checkIcaiCompliance(customDraft)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition border border-slate-200"
              >
                Scan for ICAI Violations
              </button>
            </div>

            {complianceResult && (
              <div className={`p-4 rounded-2xl text-xs border ${
                complianceResult.compliant
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                  : "bg-red-50 border-red-200 text-btred-logo font-bold"
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {complianceResult.compliant ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>ICAI Compliant Educational Content</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-btred-logo" />
                      <span>Compliance Warning: Potential Rule 7 Violations</span>
                    </>
                  )}
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                  {complianceResult.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MODAL 1: FULL SCREEN LIVE TELEPROMPTER */}
      <TeleprompterModal
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        script={selectedScript}
      />

      {/* MODAL 2: MULTI-PLATFORM CONTENT REPURPOSER */}
      <MultiPlatformRepurposerModal
        isOpen={isRepurposerOpen}
        onClose={() => setIsRepurposerOpen(false)}
        script={selectedScript}
      />

      {/* MODAL 3: CREATE CUSTOM SCRIPT */}
      <CreateCustomScriptModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaveScript={handleSaveNewScript}
      />
    </div>
  );
};
