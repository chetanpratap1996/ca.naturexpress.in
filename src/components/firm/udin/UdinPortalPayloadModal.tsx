"use client";

import React, { useState } from "react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { 
  KeyRound, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Building2, 
  Layers,
  Sparkles,
  ArrowRight,
  ClipboardCheck
} from "lucide-react";
import { UdinEntry } from "../UdinVault";

interface UdinPortalPayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: UdinEntry | null;
  onUdinGenerated: (id: string, udinCode: string) => void;
}

export const UdinPortalPayloadModal: React.FC<UdinPortalPayloadModalProps> = ({
  isOpen,
  onClose,
  entry,
  onUdinGenerated
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatedUdinInput, setGeneratedUdinInput] = useState("");

  if (!isOpen || !entry) return null;

  const handleCopy = (fieldKey: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(fieldKey);
    toast.success("Copied to Clipboard", `Copied "${fieldKey}" for ICAI portal.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const payload = `ICAI UDIN GENERATION PAYLOAD:
Document Type: ${entry.documentType}
Document Title: ${entry.documentTitle}
Client Name: ${entry.clientName}
Client PAN: ${entry.clientPan}
Date of Signing: ${entry.signingDate}
Financial Figures: ${entry.financialFigures}
Member Reg No: ${entry.membershipNo}
Signing Partner: ${entry.partnerName}`;

    navigator.clipboard.writeText(payload);
    setCopiedField("ALL");
    toast.success("All Fields Copied", "Copied complete payload for ICAI portal form filling.");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveGeneratedUdin = () => {
    const clean = generatedUdinInput.trim().toUpperCase();
    if (clean.length !== 18) {
      toast.error("Invalid UDIN", "UDIN must be exactly 18 characters long.");
      return;
    }
    onUdinGenerated(entry.id, clean);
    toast.success("UDIN Saved", `Linked 18-digit UDIN ${clean} to report.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">ICAI Portal Form Assistant</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                  udin.icai.org
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                1-Click copy fields to generate UDIN on ICAI portal without manual retyping errors.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy All Button */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Fast Track Generation</span>
            <span className="text-[10px] text-slate-500">Copy pre-formatted payload directly into ICAI portal</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyAll}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-xs"
            >
              {copiedField === "ALL" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy All</span>
            </button>
            <a
              href="https://udin.icai.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-xs"
            >
              <span>Open ICAI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Fields List */}
        <div className="flex-1 overflow-auto space-y-2.5 pr-1 text-xs">
          
          {/* Field 1 */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Document Category</span>
              <strong className="text-slate-900">{entry.documentType}</strong>
            </div>
            <button
              onClick={() => handleCopy("Category", entry.documentType)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Copy"
            >
              {copiedField === "Category" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Field 2 */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Document Title / Description</span>
              <strong className="text-slate-900">{entry.documentTitle}</strong>
            </div>
            <button
              onClick={() => handleCopy("Title", entry.documentTitle)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Copy"
            >
              {copiedField === "Title" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Field 3 */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Client Name &amp; PAN</span>
              <strong className="text-slate-900">{entry.clientName} ({entry.clientPan})</strong>
            </div>
            <button
              onClick={() => handleCopy("PAN", entry.clientPan)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Copy PAN"
            >
              {copiedField === "PAN" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Field 4 */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Signing</span>
              <strong className="text-slate-900 font-mono">{entry.signingDate}</strong>
            </div>
            <button
              onClick={() => handleCopy("SigningDate", entry.signingDate)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Copy"
            >
              {copiedField === "SigningDate" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Field 5 */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Key Certified Figures</span>
              <strong className="text-btred-logo">{entry.financialFigures}</strong>
            </div>
            <button
              onClick={() => handleCopy("Figures", entry.financialFigures)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Copy"
            >
              {copiedField === "Figures" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Enter Generated UDIN Immediately */}
        <div className="pt-2 border-t border-slate-200 space-y-2 shrink-0">
          <label className="text-xs font-bold text-slate-700 block">
            Generated UDIN on ICAI Portal? Paste 18-digit code here:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={18}
              placeholder="e.g. 26518492BKX9081294"
              value={generatedUdinInput}
              onChange={(e) => setGeneratedUdinInput(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 uppercase"
            />
            <button
              onClick={handleSaveGeneratedUdin}
              disabled={generatedUdinInput.length !== 18}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                generatedUdinInput.length === 18
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Save UDIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
