"use client";

import React, { useState } from "react";
import { 
  X, 
  Linkedin, 
  MessageSquare, 
  Twitter, 
  Instagram, 
  Copy, 
  Check, 
  Share2, 
  Sparkles,
  Smartphone
} from "lucide-react";
import { TaxReelScript } from "../CaCreatorContentStudio";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

interface MultiPlatformRepurposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: TaxReelScript | null;
}

export const MultiPlatformRepurposerModal: React.FC<MultiPlatformRepurposerModalProps> = ({
  isOpen,
  onClose,
  script
}) => {
  const [platform, setPlatform] = useState<"LINKEDIN" | "WHATSAPP" | "TWITTER" | "INSTAGRAM">("LINKEDIN");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !script) return null;

  // Generate platform-specific repurposed formats
  const generateLinkedinPost = () => {
    return `🚨 Critical Statutory Tax Update for Indian CFOs & Taxpayers: ${script.title}\n\n` +
      `Most individuals and business owners overlook this key provision until a scrutiny notice or tax penalty lands on their desk.\n\n` +
      `Here is the executive legal breakdown:\n\n` +
      script.body.map((b, i) => `🔹 Point ${i + 1}: ${b}`).join("\n\n") + "\n\n" +
      `💡 Key Takeaway:\n${script.cta}\n\n` +
      `---\n` +
      `Published for corporate awareness and educational compliance under ICAI guidelines.\n\n` +
      `#CharteredAccountant #TaxCompliance #FinanceIndia #DirectTax #CFOInsights ${script.hashtags.slice(0, 3).join(" ")}`;
  };

  const generateWhatsAppBroadcast = () => {
    return `*📢 URGENT TAX ALERT | ${DEFAULT_FIRM_BRANDING.firmName}*\n\n` +
      `*Subject:* ${script.title}\n\n` +
      `Dear Clients & Friends,\n\n` +
      `Please note this essential statutory update regarding your tax and compliance filing:\n\n` +
      script.body.map((b, i) => `• *${i + 1}.* ${b}`).join("\n") + "\n\n" +
      `*Action Required:* ${script.cta}\n\n` +
      `For any clarifications, reach out to our tax advisory desk at ${DEFAULT_FIRM_BRANDING.partnerPhone}.\n\n` +
      `_Issued in public interest for regulatory awareness._`;
  };

  const generateTwitterThread = () => {
    return `1/4 🧵 What you need to know about "${script.title}":\n\n` +
      `"${script.hook}"\n\n` +
      `Let's break down the exact statutory facts 👇\n\n` +
      `---\n\n` +
      `2/4 📌 The Rule:\n` +
      `${script.body[0] || ''}\n\n` +
      `---\n\n` +
      `3/4 📌 Practical Application:\n` +
      `${script.body.slice(1).join("\n\n")}\n\n` +
      `---\n\n` +
      `4/4 🎯 Action Step:\n` +
      `${script.cta}\n\n` +
      `Retweet to save a taxpayer from unnecessary tax penalties! 🔄\n` +
      `${script.hashtags.slice(0, 4).join(" ")}`;
  };

  const generateInstagramCaption = () => {
    return `🔥 ${script.hook}\n\n` +
      `Swipe or read below for the complete breakdown 👇\n\n` +
      script.body.map((b, i) => `✅ ${i + 1}. ${b}`).join("\n\n") + "\n\n" +
      `📌 ${script.cta}\n\n` +
      `.\n.\n` +
      `⚠️ Disclaimer: Informational & educational content under ICAI Code of Ethics. Consult your CA for specific case facts.\n\n` +
      script.hashtags.join(" ");
  };

  const currentContent = {
    LINKEDIN: generateLinkedinPost(),
    WHATSAPP: generateWhatsAppBroadcast(),
    TWITTER: generateTwitterThread(),
    INSTAGRAM: generateInstagramCaption()
  }[platform];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    toast.success("Content Copied!", `Ready to paste directly into ${platform}.`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-700">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Multi-Platform Content Repurposer
              </h3>
              <p className="text-xs text-slate-500">
                1 Reel Script &rarr; 4 High-Authority Formats (LinkedIn, WhatsApp, X &amp; Insta)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setPlatform("LINKEDIN")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              platform === "LINKEDIN"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Linkedin className="w-4 h-4" />
            <span>LinkedIn Post</span>
          </button>

          <button
            onClick={() => setPlatform("WHATSAPP")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              platform === "WHATSAPP"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>WhatsApp Broadcast</span>
          </button>

          <button
            onClick={() => setPlatform("INSTAGRAM")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              platform === "INSTAGRAM"
                ? "bg-pink-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram Caption</span>
          </button>

          <button
            onClick={() => setPlatform("TWITTER")}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              platform === "TWITTER"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Twitter className="w-4 h-4" />
            <span>X / Twitter Thread</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Repurposed Copy for {platform}:</span>
            <span className="font-mono">{currentContent.length} characters</span>
          </div>

          <textarea
            rows={14}
            readOnly
            value={currentContent}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-[13px] font-sans text-slate-900 focus:outline-none leading-relaxed select-all"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
          >
            Close
          </button>

          <button
            onClick={handleCopy}
            className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied to Clipboard!" : `Copy for ${platform}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
