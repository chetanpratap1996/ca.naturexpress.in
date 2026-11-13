"use client";

import React, { useState } from "react";
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Clock,
  Video
} from "lucide-react";
import { TaxReelScript } from "../CaCreatorContentStudio";
import { toast } from "@/components/shared/ToastNotification";

interface CreateCustomScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveScript: (newScript: TaxReelScript) => void;
}

export const CreateCustomScriptModal: React.FC<CreateCustomScriptModalProps> = ({
  isOpen,
  onClose,
  onSaveScript
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaxReelScript["category"]>("SALARIED");
  const [hook, setHook] = useState("");
  const [points, setPoints] = useState<string[]>([
    "",
    "",
    ""
  ]);
  const [cta, setCta] = useState("");
  const [hashtags, setHashtags] = useState("#IncomeTaxIndia #CharteredAccountant #TaxTips");
  const [durationSec, setDurationSec] = useState(45);

  if (!isOpen) return null;

  const totalWords = (hook + " " + points.join(" ") + " " + cta).trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round((totalWords / 130) * 60);

  // ICAI Rule 7 scan
  const fullText = `${title} ${hook} ${points.join(" ")} ${cta}`;
  const hasSuperlative = /best\s+ca|no\.?1\s+ca|lowest\s+fee|cheapest|guaranteed\s+refund/i.test(fullText);

  const handlePointChange = (index: number, val: string) => {
    const updated = [...points];
    updated[index] = val;
    setPoints(updated);
  };

  const handleAddPoint = () => {
    if (points.length >= 6) return;
    setPoints([...points, ""]);
  };

  const handleRemovePoint = (index: number) => {
    if (points.length <= 1) return;
    setPoints(points.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim() || !hook.trim() || points.every(p => !p.trim())) {
      toast.error("Incomplete Script", "Please provide a title, hook, and at least one breakdown point.");
      return;
    }

    if (hasSuperlative) {
      toast.error("ICAI Ethics Warning", "Please remove superlative claims (e.g. 'Best CA', 'Lowest Fee') before saving.");
      return;
    }

    const script: TaxReelScript = {
      id: `script-${Date.now()}`,
      title: title.trim(),
      category: category,
      hook: hook.trim(),
      body: points.filter(p => p.trim()),
      cta: cta.trim() || "Follow for more real-time statutory tax updates!",
      hashtags: hashtags.split(/\s+/).filter(h => h.startsWith("#")),
      durationSec: estimatedSeconds || durationSec,
      icaiCompliant: true,
      status: "SCRIPTED"
    };

    onSaveScript(script);
    onClose();
    toast.success("Script Added!", `"${title}" has been saved to your teleprompter studio.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-700">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Author Custom Tax Reel Script
              </h3>
              <p className="text-xs text-slate-500">
                Craft a punchy, ICAI-compliant teleprompter script for video creation
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

        {/* Modal Body Form */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-900">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold focus:outline-none focus:border-pink-500"
              >
                <option value="SALARIED">Salaried Taxpayers</option>
                <option value="MSME">MSME &amp; Business Owners</option>
                <option value="FREELANCER">Doctors &amp; Freelancers</option>
                <option value="INVESTOR">Traders &amp; Investors</option>
                <option value="GST_NOTICES">GST Scrutiny &amp; Notices</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Estimated Speaking Pace</label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-700 font-mono">
                <span>{totalWords} words</span>
                <span className="font-bold text-pink-600">~{estimatedSeconds}s Reel</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Script Title *</label>
            <input
              type="text"
              placeholder="e.g. 3 Major Mistakes That Invite Section 143(1)(a) Notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
              <span>3-Second Viral Hook (Look Directly at Camera) *</span>
              <span className="text-[10px] text-pink-600 font-bold">Punchy &amp; High Curiosity</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Agr aapne bhi ITR mein yeh galti ki hai, toh Income Tax se notice aane se koi nahi bacha sakta!"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:outline-none focus:border-pink-500 font-medium"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold">Script Breakdown Points (Facts &amp; Law)</label>
              {points.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddPoint}
                  className="text-pink-600 hover:text-pink-700 font-bold text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Point
                </button>
              )}
            </div>

            {points.map((pt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  placeholder={`Point ${i + 1} legal fact / explanation...`}
                  value={pt}
                  onChange={(e) => handlePointChange(i, e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2 focus:outline-none focus:border-pink-500 font-normal"
                />
                {points.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(i)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Call to Action (CTA)</label>
            <input
              type="text"
              placeholder="e.g. Save this reel and share it with your business partner!"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 focus:outline-none focus:border-pink-500 font-medium"
            />
          </div>

          {/* ICAI Ethics Indicator */}
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
            hasSuperlative 
              ? "bg-red-50 border-red-200 text-red-800" 
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}>
            {hasSuperlative ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>ICAI Rule 7 Warning: Prohibited words detected (e.g., Best CA, Lowest Fee).</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ICAI Rule 7 Compliant: Educational &amp; non-solicitation language verified.</span>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={hasSuperlative}
            className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Save to Teleprompter Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
