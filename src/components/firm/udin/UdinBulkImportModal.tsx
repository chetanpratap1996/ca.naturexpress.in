"use client";

import React, { useState, useRef } from "react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Building2, 
  Sparkles, 
  Copy,
  Check,
  FolderSync,
  HelpCircle,
  KeyRound
} from "lucide-react";
import { UdinEntry } from "../UdinVault";
import { validateIcaUdin } from "@/lib/utils";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface UdinBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImportedEntries: (newEntries: UdinEntry[]) => void;
}

export const UdinBulkImportModal: React.FC<UdinBulkImportModalProps> = ({
  isOpen,
  onClose,
  onApplyImportedEntries
}) => {
  const [activeTab, setActiveTab] = useState<"PRESETS" | "UPLOAD" | "PASTE">("PRESETS");
  const [pastedContent, setPastedContent] = useState("");
  const [parsedEntries, setParsedEntries] = useState<UdinEntry[] | null>(null);

  if (!isOpen) return null;

  // Realistic Firm Presets for Tax & Corporate Audit Season
  const handleLoadPreset = (presetType: "TAX_AUDIT_BATCH" | "STATUTORY_AUDIT_BATCH" | "BANK_CERTIFICATES") => {
    let mockList: UdinEntry[] = [];

    if (presetType === "TAX_AUDIT_BATCH") {
      mockList = [
        {
          id: `udin-imp-1-${Date.now()}`,
          udin: "26518492BTAX901284",
          documentTitle: "Tax Audit Report Form 3CA/3CD u/s 44AB (Manufacturing)",
          documentType: "TAX_AUDIT_3CD",
          clientName: "Pratwi Solutions Private Limited",
          clientPan: "AABCA8891D",
          signingDate: "2026-09-29",
          generatedDate: "2026-09-30",
          financialFigures: "Turnover: ₹48.50 Cr | Disallowances: ₹4.43 Lakh",
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: "518492",
          status: "GENERATED_VALID",
          daysRemainingForGeneration: 60
        },
        {
          id: `udin-imp-2-${Date.now()}`,
          udin: "26518492BTAX771923",
          documentTitle: "Tax Audit Report Form 3CB/3CD u/s 44AB (Trading Firm)",
          documentType: "TAX_AUDIT_3CD",
          clientName: "Bharat Agro-Trading LLP",
          clientPan: "AAFFB8891L",
          signingDate: "2026-09-30",
          generatedDate: "2026-10-01",
          financialFigures: "Turnover: ₹34.60 Cr | Disallowances: ₹1.20 Lakh",
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: "518492",
          status: "GENERATED_VALID",
          daysRemainingForGeneration: 60
        },
        {
          id: `udin-imp-3-${Date.now()}`,
          udin: "PENDING_GENERATION",
          documentTitle: "Tax Audit Report Form 3CB/3CD u/s 44AB (Textile Processing)",
          documentType: "TAX_AUDIT_3CD",
          clientName: "Mahalaxmi Fabrics Private Limited",
          clientPan: "AABCM4419K",
          signingDate: "2026-10-15",
          financialFigures: "Turnover: ₹22.80 Cr | Disallowances: ₹2.15 Lakh",
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: "518492",
          status: "EXPIRING_SOON",
          daysRemainingForGeneration: 14
        }
      ];
    } else if (presetType === "STATUTORY_AUDIT_BATCH") {
      mockList = [
        {
          id: `udin-imp-4-${Date.now()}`,
          udin: "26518492BSTATU7701",
          documentTitle: "Independent Statutory Auditor's Report (Schedule III Division I)",
          documentType: "STATUTORY_AUDIT",
          clientName: "Pratwi Solutions Private Limited",
          clientPan: "AABCA8891D",
          signingDate: "2026-09-15",
          generatedDate: "2026-09-16",
          financialFigures: "Total Assets: ₹20.61 Cr | Net Profit: ₹1.87 Cr",
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: "518492",
          status: "GENERATED_VALID",
          daysRemainingForGeneration: 60
        },
        {
          id: `udin-imp-5-${Date.now()}`,
          udin: "26518492BSTATU8892",
          documentTitle: "Statutory Auditor Report under Companies Act 2013",
          documentType: "STATUTORY_AUDIT",
          clientName: "Symphony Cloud Technologies Pvt Ltd",
          clientPan: "AAGCS7712M",
          signingDate: "2026-09-20",
          generatedDate: "2026-09-21",
          financialFigures: "Total Assets: ₹8.20 Cr | Net Profit: ₹2.40 Cr",
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: "518492",
          status: "GENERATED_VALID",
          daysRemainingForGeneration: 60
        }
      ];
    } else {
      mockList = [
        {
          id: `udin-imp-6-${Date.now()}`,
          udin: "PENDING_GENERATION",
          documentTitle: "Net Worth Certificate for Working Capital Loan of ₹5 Crore",
          documentType: "NET_WORTH_CERTIFICATE",
          clientName: "Chetan Pratap Singh (Director)",
          clientPan: "ABFPS1234E",
          signingDate: "2026-10-25",
          financialFigures: "Certified Net Worth: ₹8.45 Cr as on 30-09-2026",
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: "518492",
          status: "PENDING_GENERATION",
          daysRemainingForGeneration: 48
        },
        {
          id: `udin-imp-7-${Date.now()}`,
          udin: "26518492BCERT09123",
          documentTitle: "Turnover Certificate for Government EPC Tender (NHAI)",
          documentType: "TURNOVER_CERTIFICATE",
          clientName: "Pratwi Solutions Private Limited",
          clientPan: "AABCZ9941M",
          signingDate: "2026-09-10",
          generatedDate: "2026-09-11",
          financialFigures: "Annual Average Turnover (3 Yrs): ₹28.5 Cr",
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: "518492",
          status: "GENERATED_VALID",
          daysRemainingForGeneration: 60
        }
      ];
    }

    setParsedEntries(mockList);
    toast.success("Batch Preset Loaded", `Prepared ${mockList.length} signed audit records for ingestion.`);
  };

  // Process Tabular / CSV Paste
  const handleProcessPasted = () => {
    if (!pastedContent.trim()) {
      toast.error("Empty Data", "Please paste tabular UDIN records or ICAI portal export CSV.");
      return;
    }

    const lines = pastedContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const result: UdinEntry[] = [];

    lines.forEach((line, idx) => {
      if (/^(title|document|client|sr|no|udin)/i.test(line)) return;
      const delimiter = line.includes("\t") ? "\t" : ",";
      const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ""));

      if (cols.length >= 3) {
        const title = cols[0] || "Audit Report";
        const client = cols[1] || "Client Entity";
        const rawUdin = cols[2] || "";
        const cleanUdin = rawUdin.length === 18 && validateIcaUdin(rawUdin).isValid ? rawUdin.toUpperCase() : "PENDING_GENERATION";
        const figures = cols[3] || "Audited Figures Documented";
        const signDate = cols[4] || new Date().toISOString().split("T")[0];

        result.push({
          id: `udin-pasted-${idx + 1}-${Date.now()}`,
          udin: cleanUdin,
          documentTitle: title,
          documentType: title.toLowerCase().includes("tax audit") ? "TAX_AUDIT_3CD" : "STATUTORY_AUDIT",
          clientName: client,
          clientPan: "AABCA9182K",
          signingDate: signDate,
          generatedDate: cleanUdin !== "PENDING_GENERATION" ? signDate : undefined,
          financialFigures: figures,
          partnerName: DEFAULT_FIRM_BRANDING.managingPartner,
          membershipNo: "518492",
          status: cleanUdin !== "PENDING_GENERATION" ? "GENERATED_VALID" : "PENDING_GENERATION",
          daysRemainingForGeneration: 60
        });
      }
    });

    if (result.length === 0) {
      toast.error("Parse Failed", "Could not recognize format. Expected: [Title] [Client] [UDIN] [Figures]");
      return;
    }

    setParsedEntries(result);
    toast.success("Pasted Data Parsed", `Extracted ${result.length} UDIN records.`);
  };

  const handleApply = () => {
    if (!parsedEntries || parsedEntries.length === 0) return;
    onApplyImportedEntries(parsedEntries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[90vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-btred-logo text-white flex items-center justify-center font-bold shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Bulk UDIN Ingestion &amp; ICAI Reconciliation</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                  Peer Review Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Import batches of signed reports or reconcile with official ICAI UDIN portal CSV downloads.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab("PRESETS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === "PRESETS" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Audit Season Batches</span>
          </button>

          <button
            onClick={() => setActiveTab("PASTE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === "PASTE" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Paste Tabular / CSV</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto space-y-4 pr-1">
          {activeTab === "PRESETS" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Select a standard CA firm batch to test statutory countdown tracking, validation, and verification slips:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => handleLoadPreset("TAX_AUDIT_BATCH")}
                  className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-btred-logo hover:bg-red-50/30 transition cursor-pointer text-left space-y-1.5"
                >
                  <span className="text-[10px] font-black uppercase text-btred-logo bg-red-100 px-2 py-0.5 rounded">
                    Sec 44AB
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">Tax Audit Batch (3CD)</h4>
                  <p className="text-[11px] text-slate-500">
                    Form 3CA/3CD reports for manufacturing &amp; trading clients with disallowances.
                  </p>
                </div>

                <div
                  onClick={() => handleLoadPreset("STATUTORY_AUDIT_BATCH")}
                  className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-btred-logo hover:bg-red-50/30 transition cursor-pointer text-left space-y-1.5"
                >
                  <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Companies Act
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">Statutory Audit Batch</h4>
                  <p className="text-[11px] text-slate-500">
                    Schedule III company auditor reports with total asset &amp; profit figures.
                  </p>
                </div>

                <div
                  onClick={() => handleLoadPreset("BANK_CERTIFICATES")}
                  className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-btred-logo hover:bg-red-50/30 transition cursor-pointer text-left space-y-1.5"
                >
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Certificates
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">Bank Net Worth &amp; Turnover</h4>
                  <p className="text-[11px] text-slate-500">
                    Loan enhancement net worth and EPC tender turnover certificates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "PASTE" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Paste Columns from Excel or ICAI Portal Export:
              </span>
              <textarea
                rows={7}
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="Document Title&#9;Client Name&#9;18-Digit UDIN&#9;Certified Figures&#10;Tax Audit Report Form 3CD&#9;Pratwi Solutions Pvt Ltd&#9;26518492BTAX901284&#9;Turnover: ₹48.5 Cr&#10;Net Worth Certificate&#9;Chetan Pratap Singh&#9;PENDING&#9;Net Worth: ₹8.45 Cr"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-logo"
              />
              <button
                onClick={handleProcessPasted}
                className="px-4 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse &amp; Validate Data</span>
              </button>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedEntries && parsedEntries.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ready to Ingest: {parsedEntries.length} Documents
                </span>
                <span className="text-slate-500 text-[11px]">
                  {parsedEntries.filter(e => e.status === "GENERATED_VALID").length} Active UDINs &bull; {parsedEntries.filter(e => e.status !== "GENERATED_VALID").length} Pending
                </span>
              </div>

              <div className="max-h-48 overflow-auto space-y-1.5">
                {parsedEntries.map((e, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block">{e.documentTitle}</strong>
                      <span className="text-[11px] text-slate-500">{e.clientName} &bull; {e.financialFigures}</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        e.status === "GENERATED_VALID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                      }`}>
                        {e.udin}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!parsedEntries || parsedEntries.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              parsedEntries && parsedEntries.length > 0
                ? "bg-btred-logo hover:bg-red-700 text-white shadow-md cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Apply to UDIN Vault</span>
          </button>
        </div>
      </div>
    </div>
  );
};
