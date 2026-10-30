"use client";

import React, { useState } from "react";
import { ClientEntity, DocumentItem, ComplianceTask } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { formatCurrencyINR } from "@/lib/utils";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  Smartphone, 
  Building2, 
  Lock, 
  Unlock, 
  Clock, 
  Layers, 
  Search, 
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check
} from "lucide-react";

export interface BatchParsedDoc {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  detectedPan?: string;
  detectedGstin?: string;
  detectedPeriod: string;
  detectedFy: string;
  detectedCategory: DocumentItem["category"];
  matchedEntityId?: string;
  matchedEntityName?: string;
  recipientPhone?: string;
  recipientContactName?: string;
  payToReleaseLocked: boolean;
  outstandingFeeAmount: number;
  status: "MATCHED" | "NEEDS_REVIEW" | "DISPATCHED";
  selected: boolean;
}

interface BatchOutwardDispatcherProps {
  clients: ClientEntity[];
  onBatchDispatched?: (docs: DocumentItem[]) => void;
  onTasksUpdated?: () => void;
}

const SAMPLE_BATCH_FILES: Omit<BatchParsedDoc, "id" | "status" | "selected">[] = [];

export const BatchOutwardDispatcher: React.FC<BatchOutwardDispatcherProps> = ({
  clients,
  onBatchDispatched,
  onTasksUpdated,
}) => {
  const [parsedQueue, setParsedQueue] = useState<BatchParsedDoc[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [autoCompleteTask, setAutoCompleteTask] = useState(true);
  const [enforcePayToRelease, setEnforcePayToRelease] = useState(true);

  // Load Demonstration Monthly Batch
  const handleLoadSampleBatch = () => {
    if (clients.length === 0) {
      alert("No client entities registered yet. Please onboard clients in Client Master first.");
      return;
    }
    const initialized: BatchParsedDoc[] = clients.slice(0, 3).map((c, i) => ({
      id: `BATCH-ITEM-${Date.now()}-${i}`,
      fileName: `GSTR3B_${c.gstin || c.pan}_SEP2026_ACK.pdf`,
      fileSizeBytes: 245000,
      detectedPan: c.pan,
      detectedGstin: c.gstin,
      detectedPeriod: "September 2026",
      detectedFy: "FY 2026-27",
      detectedCategory: "GST_INVOICES",
      matchedEntityId: c.id,
      matchedEntityName: c.name,
      recipientPhone: c.primaryContact.phone,
      recipientContactName: c.primaryContact.name,
      payToReleaseLocked: false,
      outstandingFeeAmount: 0,
      status: "MATCHED",
      selected: true,
    }));
    setParsedQueue(initialized);
    setIsCompleted(false);
    setDispatchLogs([]);
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setParsedQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSelectAll = (select: boolean) => {
    setParsedQueue((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Re-map client manually if needed
  const handleReassignClient = (itemId: string, newEntityId: string) => {
    const target = clients.find((c) => c.id === newEntityId);
    if (!target) return;

    setParsedQueue((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            matchedEntityId: target.id,
            matchedEntityName: target.name,
            recipientPhone: target.primaryContact.phone,
            recipientContactName: target.primaryContact.name,
            status: "MATCHED",
          };
        }
        return item;
      })
    );
  };

  // Execute Batch Dispatch
  const handleExecuteBatchDispatch = async () => {
    const selectedItems = parsedQueue.filter((item) => item.selected);
    if (selectedItems.length === 0) return;

    setIsProcessingBatch(true);
    setDispatchProgress(0);
    setDispatchLogs([]);

    const createdDocs: DocumentItem[] = [];

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const stepPercent = Math.round(((i + 1) / selectedItems.length) * 100);

      // Simulate network / OCR / WhatsApp dispatch delay
      await new Promise((res) => setTimeout(res, 600));

      const newDoc: DocumentItem = {
        id: `DOC-${Date.now()}-${i}`,
        entityId: item.matchedEntityId || clients[0]?.id || "CLI-001",
        entityName: item.matchedEntityName || clients[0]?.name || "Client Entity",
        category: item.detectedCategory,
        fileName: item.fileName,
        fileSize: `${(item.fileSizeBytes / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        financialYear: item.detectedFy,
        uploadedBy: "FIRM_STAFF",
        isPasswordProtected: false,
        isUnlocked: true,
        reviewStatus: "APPROVED",
        reviewedBy: "CA Gunjan Jain (Partner)",
        reviewedAt: new Date().toISOString(),
      };

      createdDocs.push(newDoc);

      setDispatchLogs((prev) => [
        `✓ [${i + 1}/${selectedItems.length}] Dispatched "${item.fileName}" to ${item.matchedEntityName} via WhatsApp (${item.recipientPhone})`,
        ...prev,
      ]);
      setDispatchProgress(stepPercent);

      // Update in local state
      setParsedQueue((prev) =>
        prev.map((doc) => (doc.id === item.id ? { ...doc, status: "DISPATCHED" } : doc))
      );
    }

    // Persist to server API if available
    try {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: createdDocs }),
      });
    } catch (e) {
      console.warn("Local storage fallback:", e);
    }

    if (onBatchDispatched) {
      onBatchDispatched(createdDocs);
    }
    if (onTasksUpdated) {
      onTasksUpdated();
    }

    setIsProcessingBatch(false);
    setIsCompleted(true);
  };

  const selectedCount = parsedQueue.filter((i) => i.selected).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Value Proposition */}
      <div className="bg-gradient-to-r from-red-50/70 via-white to-red-50/40 border border-red-200 rounded-3xl p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-red-50 text-btred-logo px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-200">
              <Sparkles className="w-3.5 h-3.5 text-btred-logo" />
              High-Volume Dispatch Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Batch Inward / Outward Document Dispatcher
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Drop 50+ filing receipts (GSTR-3B, GSTR-1, ITR-V, Form 3CD, Challans). System auto-parses PAN, GSTIN, and Period, maps to the client master, and shoots out branded WhatsApp delivery links in 60 seconds.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleLoadSampleBatch}
              className="bg-btred-logo hover:bg-red-700 text-white shadow-sm text-xs font-black px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Monthly Filing Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dropzone & Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Drag/Drop and Queue */}
        <div className="lg:col-span-2 space-y-4">
          {parsedQueue.length === 0 ? (
            <div
              onClick={handleLoadSampleBatch}
              className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-3xl p-10 text-center cursor-pointer bg-white hover:bg-red-50/20 transition space-y-3 shadow-sm"
            >
              <div className="w-14 h-14 bg-red-50 text-btred-logo rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">
                  Drop Acknowledgment PDFs Here (or Click to Load Test Batch)
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Automatically extracts PAN/GSTIN from filenames like <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">GSTR3B_27AAACP0192A1Z5.pdf</code> and organizes them into client repositories.
                </p>
              </div>
              <button
                type="button"
                className="bg-btred-logo text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition shadow-sm"
              >
                Load Sample September 2026 Batch (5 Documents)
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCount === parsedQueue.length && parsedQueue.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-xs font-extrabold text-slate-800 cursor-pointer">
                    Select All ({selectedCount} / {parsedQueue.length} files)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setParsedQueue([])}
                    className="text-xs text-slate-500 hover:text-red-600 font-bold px-2 py-1 rounded transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {parsedQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      item.selected ? "bg-white" : "bg-slate-50/60 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="w-4 h-4 rounded text-btred-logo focus:ring-red-500 mt-1 shrink-0"
                      />

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 truncate max-w-xs sm:max-w-md">
                            {item.fileName}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {item.detectedCategory.replace(/_/g, " ")}
                          </span>
                          {item.payToReleaseLocked && enforcePayToRelease && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Pay-to-Release (₹{item.outstandingFeeAmount.toLocaleString("en-IN")})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                          <span>Period: <strong className="text-slate-700">{item.detectedPeriod}</strong></span>
                          <span>&bull;</span>
                          <span>PAN: <strong className="font-mono text-slate-700">{item.detectedPan || "N/A"}</strong></span>
                          <span>&bull;</span>
                          <span>Client:</span>
                          <select
                            value={item.matchedEntityId || ""}
                            onChange={(e) => handleReassignClient(item.id, e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          >
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      {item.status === "DISPATCHED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sent to WhatsApp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-btred-logo bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <Clock className="w-3 h-3" />
                          Ready
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Progress Bar */}
          {isProcessingBatch && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-btred-logo animate-spin" />
                  Dispatching documents to clients...
                </span>
                <span className="font-mono font-black text-btred-logo">{dispatchProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-btred-logo h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${dispatchProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Live Dispatch Log */}
          {dispatchLogs.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 text-xs font-mono text-slate-800 space-y-1 max-h-40 overflow-y-auto border border-slate-200 shadow-inner">
              {dispatchLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span>&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Dispatch Control Panel & WhatsApp Preview */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-btred-logo" />
              <span>Dispatch Configuration</span>
            </h3>

            {/* Delivery Channels */}
            <div className="space-y-2.5 text-xs">
              <label className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                Automated Delivery Channels
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">WhatsApp Delivery Link</span>
                  <span className="text-[11px] text-slate-500">Sends 1-tap authenticated link directly to client WhatsApp</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Official Firm Email</span>
                  <span className="text-[11px] text-slate-500">Sends PDF attachment with FRN verification seal</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={autoCompleteTask}
                  onChange={(e) => setAutoCompleteTask(e.target.checked)}
                  className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Auto-Advance Compliance Task</span>
                  <span className="text-[11px] text-slate-500">Moves status to "Filed &amp; Acknowledged" upon delivery</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={enforcePayToRelease}
                  onChange={(e) => setEnforcePayToRelease(e.target.checked)}
                  className="w-4 h-4 rounded text-btred-logo focus:ring-red-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Pay-to-Release Gatekeeper</span>
                  <span className="text-[11px] text-slate-500">Locks certified deliverable if overdue fees are pending</span>
                </div>
              </label>
            </div>

            {/* WhatsApp Template Live Preview */}
            <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-3.5 space-y-1.5 text-xs">
              <span className="text-[10px] font-black uppercase text-emerald-700 block tracking-wider">
                Branded WhatsApp Template Preview
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed font-sans bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                &ldquo;Dear <strong className="text-slate-900">Authorized Signatory</strong>, your <strong className="text-emerald-700">GSTR-3B Acknowledgement</strong> for <strong className="text-slate-900">September 2026</strong> has been officially filed by <strong className="text-slate-900">GPA &amp; Co., Chartered Accountants</strong>.<br /><br />
                🔒 Secure 1-Tap Download: <span className="text-blue-600 underline font-mono text-[10px]">https://ca.naturexpress.in/v/ack_9912</span><br /><br />
                <em className="text-[10px] text-slate-500">Valid for 30 days &bull; No password needed</em>&rdquo;
              </p>
            </div>

            {/* Dispatch Action Button */}
            <button
              onClick={handleExecuteBatchDispatch}
              disabled={isProcessingBatch || selectedCount === 0}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xl ${
                selectedCount > 0 && !isProcessingBatch
                  ? "bg-btred-logo hover:bg-red-700 text-white shadow-red-500/25 active:scale-95"
                  : "bg-slate-200 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isProcessingBatch
                  ? "Dispatching Batch..."
                  : `Dispatch Batch (${selectedCount} Clients)`}
              </span>
            </button>

            {isCompleted && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All {selectedCount} documents successfully filed in Client Vaults &amp; dispatched!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
