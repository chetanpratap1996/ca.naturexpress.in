"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useClientContext } from "@/lib/context/ClientContext";
import { toast } from "@/components/shared/ToastNotification";
import {
  gstFetchJson,
  getPeriodsForFy,
  toGstnReturnPeriod,
} from "@/lib/gst/gstClientFetch";
import {
  Gstr1Engine,
  OutwardSalesInvoice,
  OutwardDocType,
} from "@/lib/gst/gstr1Engine";
import { pullSalesVouchersFromTallyPrime } from "@/lib/gst/tallyConnector";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  RefreshCw,
  Building2,
  Ban,
  RotateCcw,
  FileCode2,
} from "lucide-react";

type Gstr1Tab = "B2B" | "B2CL" | "B2CS" | "NOTES" | "EXP_NIL" | "HSN_DOC" | "ISSUES";

function fmtInr(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n || 0);
}

function getPeriodDateRange(period: string): { from: string; to: string } {
  const months: Record<string, string> = {
    jan: "01", january: "01",
    feb: "02", february: "02",
    mar: "03", march: "03",
    apr: "04", april: "04",
    may: "05",
    jun: "06", june: "06",
    jul: "07", july: "07",
    aug: "08", august: "08",
    sep: "09", september: "09",
    oct: "10", october: "10",
    nov: "11", november: "11",
    dec: "12", december: "12",
  };
  const m = period.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  const mm = m ? months[m[1].toLowerCase()] : undefined;
  if (m && mm) {
    const yr = Number(m[2]);
    const mo = Number(mm);
    const lastDay = new Date(yr, mo, 0).getDate();
    return {
      from: `${yr}${mm}01`,
      to: `${yr}${mm}${String(lastDay).padStart(2, "0")}`,
    };
  }
  const now = new Date();
  const yr = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  return { from: `${yr}${mo}01`, to: `${yr}${mo}28` };
}

export function Gstr1OutwardWorkbench() {
  const {
    selectedClient,
    selectedGstin,
    selectedFy,
    selectedPeriod,
    selectPeriod,
    isFirmWideView,
    openCommandPalette,
    recentClients,
    selectClient,
  } = useClientContext();

  const fyPeriods = useMemo(() => getPeriodsForFy(selectedFy), [selectedFy]);
  const [localPeriod, setLocalPeriod] = useState(selectedPeriod || fyPeriods[0] || "Apr 2025");
  const activePeriod = selectedPeriod || localPeriod;

  const activeGstin = selectedGstin || selectedClient?.gstin || "";
  const supplierStateCode = activeGstin.slice(0, 2) || "27";

  const [turnoverCr, setTurnoverCr] = useState<number>(3.5);
  const [b2clThreshold, setB2clThreshold] = useState<number>(100000);
  const [invoices, setInvoices] = useState<OutwardSalesInvoice[]>([]);
  const [isNilGstr1, setIsNilGstr1] = useState(false);
  const [activeTab, setActiveTab] = useState<Gstr1Tab>("B2B");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTallyPulling, setIsTallyPulling] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Client Docs modal
  const [showClientDocs, setShowClientDocs] = useState(false);
  const [clientDocs, setClientDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Manual entry modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [draftInv, setDraftInv] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    docType: "INV" as OutwardDocType,
    recipientGstin: "",
    recipientName: "",
    placeOfSupply: supplierStateCode,
    taxRate: 18,
    taxableValue: 0,
    hsnCode: "9983",
    irn: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved GSTR-1 when GSTIN / period changes
  useEffect(() => {
    if (!activeGstin || !activePeriod || isFirmWideView) {
      setInvoices([]);
      setLastSavedAt(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    gstFetchJson<any>(
      `/api/gst/gstr1?clientGstin=${encodeURIComponent(activeGstin)}&taxPeriod=${encodeURIComponent(activePeriod)}`
    )
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && data?.found && Array.isArray(data.invoices)) {
          setInvoices(data.invoices);
          if (typeof data.turnoverCr === "number") setTurnoverCr(data.turnoverCr);
          if (typeof data.b2clThresholdInr === "number") setB2clThreshold(data.b2clThresholdInr);
          setLastSavedAt(data.updatedAt || null);
        } else {
          setInvoices([]);
          setLastSavedAt(null);
        }
      })
      .catch(() => {
        if (!cancelled) setInvoices([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeGstin, activePeriod, isFirmWideView]);

  const summary = useMemo(() => {
    return Gstr1Engine.compileSummary({
      gstin: activeGstin || "27AAAAA0000A1Z5",
      returnPeriod: activePeriod,
      turnoverCr,
      invoices,
      b2clThresholdInr: b2clThreshold,
    });
  }, [activeGstin, activePeriod, turnoverCr, invoices, b2clThreshold]);

  const errorCount = useMemo(
    () => summary.issues.filter((i) => i.severity === "ERROR").length,
    [summary.issues]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const lower = file.name.toLowerCase();
      let parsed: OutwardSalesInvoice[] = [];
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        parsed = Gstr1Engine.parseSalesRegister({ buffer, supplierStateCode });
      } else {
        const text = await file.text();
        parsed = Gstr1Engine.parseSalesRegister({ text, supplierStateCode });
      }
      if (parsed.length === 0) {
        toast.error("No valid sales invoice rows detected in uploaded file.");
      } else {
        setInvoices((prev) => [...prev, ...parsed]);
        toast.success(`Imported ${parsed.length} outward voucher rows from ${file.name}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to parse Sales Register file");
    } finally {
      e.target.value = "";
    }
  };

  const handleOpenClientDocs = async () => {
    if (!selectedClient?.id) {
      toast.error("Select a client first to view uploaded documents.");
      return;
    }
    setShowClientDocs(true);
    setIsLoadingDocs(true);
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/client-docs?entityId=${encodeURIComponent(selectedClient.id)}`
      );
      if (!ok) throw new Error(data?.error || "Could not load documents");
      setClientDocs(data?.documents || []);
    } catch (err: any) {
      toast.error(err?.message || "Could not load client documents");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleImportClientDoc = async (doc: any) => {
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/client-docs?documentId=${encodeURIComponent(doc.id)}`
      );
      if (!ok || !data?.base64) throw new Error(data?.error || "Empty document content");
      const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
      const lower = String(data.fileName || "").toLowerCase();
      let parsed: OutwardSalesInvoice[] = [];
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        parsed = Gstr1Engine.parseSalesRegister({ buffer: bytes.buffer, supplierStateCode });
      } else {
        const text = new TextDecoder().decode(bytes);
        parsed = Gstr1Engine.parseSalesRegister({ text, supplierStateCode });
      }
      if (parsed.length === 0) {
        toast.error(`No sales register rows found in ${data.fileName}`);
      } else {
        setInvoices((prev) => [...prev, ...parsed]);
        setShowClientDocs(false);
        toast.success(`Imported ${parsed.length} sales rows from Client Doc: ${data.fileName}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to import client document");
    }
  };

  const handlePullTally = async () => {
    if (!activeGstin) return;
    setIsTallyPulling(true);
    try {
      const range = getPeriodDateRange(activePeriod);
      const res = await pullSalesVouchersFromTallyPrime({
        companyName: selectedClient?.name,
        fromDateYYYYMMDD: range.from,
        toDateYYYYMMDD: range.to,
        supplierStateCode,
      });
      if (!res.ok) {
        toast.error(res.error || "Failed to pull from TallyPrime");
      } else if (res.invoices.length === 0) {
        toast.error("TallyPrime responded with 0 Sales vouchers for this period.");
      } else {
        setInvoices((prev) => [...prev, ...res.invoices]);
        toast.success(`Pulled ${res.invoices.length} Sales vouchers live from TallyPrime`);
      }
    } catch (err: any) {
      toast.error(err?.message || "TallyPrime connection failed");
    } finally {
      setIsTallyPulling(false);
    }
  };

  const handleSaveGstr1 = async () => {
    if (!activeGstin) {
      toast.error("Select a client GSTIN first.");
      return;
    }
    setIsSaving(true);
    try {
      const { ok, data } = await gstFetchJson<any>("/api/gst/gstr1", {
        method: "POST",
        body: JSON.stringify({
          clientGstin: activeGstin,
          taxPeriod: activePeriod,
          turnoverCr,
          b2clThresholdInr: b2clThreshold,
          invoices,
        }),
      });
      if (!ok || !data?.success) throw new Error(data?.error || "Save failed");
      setLastSavedAt(new Date().toISOString());
      toast.success(`GSTR-1 saved & synced for GSTR-3B outward liability (${activePeriod})`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save GSTR-1");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const fp = toGstnReturnPeriod(activePeriod);
    const payload = Gstr1Engine.buildGstnGstr1Json(summary, fp);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR1_${activeGstin}_${fp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported official GSTN GSTR-1 JSON (${fp})`);
  };

  const handleExportExcel = async () => {
    const { downloadWorkbookXlsx } = await import("@/lib/parsers/excelGstParser");
    downloadWorkbookXlsx(`GSTR1_Workpaper_${activeGstin}_${activePeriod.replace(/\s+/g, "_")}.xlsx`, [
      {
        name: "B2B_Invoices",
        rows: summary.b2bInvoices.map((i) => ({
          GSTIN: i.recipientGstin,
          ReceiverName: i.recipientName,
          InvoiceNo: i.invoiceNumber,
          Date: i.invoiceDate,
          POS: i.placeOfSupply,
          Rate: i.taxRate,
          TaxableValue: i.taxableValue,
          IGST: i.igst,
          CGST: i.cgst,
          SGST: i.sgst,
          Cess: i.cess,
          InvoiceValue: i.totalInvoiceValue,
          HSN: i.hsnCode || "",
          IRN: i.irn || "",
        })),
      },
      {
        name: "B2CL_Large",
        rows: summary.b2clInvoices.map((i) => ({
          InvoiceNo: i.invoiceNumber,
          Date: i.invoiceDate,
          POS: i.placeOfSupply,
          Rate: i.taxRate,
          TaxableValue: i.taxableValue,
          IGST: i.igst,
          InvoiceValue: i.totalInvoiceValue,
        })),
      },
      {
        name: "B2CS_Summary",
        rows: summary.b2csBuckets.map((b) => ({
          POS: b.pos,
          SupplyType: b.supplyType,
          Rate: b.taxRate,
          TaxableValue: b.taxableValue,
          IGST: b.igst,
          CGST: b.cgst,
          SGST: b.sgst,
          Cess: b.cess,
        })),
      },
      {
        name: "CDNR_CDNUR",
        rows: [...summary.cdnrNotes, ...summary.cdnurNotes].map((n) => ({
          Type: n.docType,
          GSTIN: n.recipientGstin || "Unregistered",
          Party: n.recipientName,
          NoteNo: n.invoiceNumber,
          Date: n.invoiceDate,
          POS: n.placeOfSupply,
          Rate: n.taxRate,
          TaxableValue: n.taxableValue,
          IGST: n.igst,
          CGST: n.cgst,
          SGST: n.sgst,
        })),
      },
      {
        name: "Table12_HSN",
        rows: summary.hsnSummary.map((h) => ({
          HSN: h.hsnCode,
          Description: h.description,
          UQC: h.uqc,
          Qty: h.totalQuantity,
          Rate: h.taxRate,
          TaxableValue: h.taxableValue,
          IGST: h.igst,
          CGST: h.cgst,
          SGST: h.sgst,
          Cess: h.cess,
          Validation: h.digitWarning || "OK",
        })),
      },
    ]);
    toast.success("Downloaded Multi-Sheet GSTR-1 Excel Workpaper");
  };

  const handleAddManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftInv.invoiceNumber.trim()) {
      toast.error("Invoice number is required.");
      return;
    }
    const taxable = Number(draftInv.taxableValue) || 0;
    const rate = Number(draftInv.taxRate) || 0;
    const pos = (draftInv.placeOfSupply || supplierStateCode).slice(0, 2);
    const totalTax = Math.round(((taxable * rate) / 100) * 100) / 100;
    const isInter = pos !== supplierStateCode || draftInv.docType === "EXP_WPAY";
    const igst = draftInv.docType === "EXP_WOPAY" || draftInv.docType === "NIL_EXEMPT" ? 0 : isInter ? totalTax : 0;
    const cgst = draftInv.docType === "EXP_WOPAY" || draftInv.docType === "NIL_EXEMPT" || isInter ? 0 : Math.round((totalTax / 2) * 100) / 100;
    const sgst = draftInv.docType === "EXP_WOPAY" || draftInv.docType === "NIL_EXEMPT" || isInter ? 0 : Math.round((totalTax - cgst) * 100) / 100;

    const newRow: OutwardSalesInvoice = {
      id: `g1-man-${Date.now()}`,
      invoiceNumber: draftInv.invoiceNumber.trim(),
      invoiceDate: draftInv.invoiceDate,
      docType: draftInv.docType,
      recipientGstin: draftInv.recipientGstin.trim().toUpperCase() || undefined,
      recipientName: draftInv.recipientName.trim() || "Customer",
      placeOfSupply: pos,
      reverseCharge: false,
      taxRate: rate,
      taxableValue: taxable,
      igst,
      cgst,
      sgst,
      cess: 0,
      totalTax: igst + cgst + sgst,
      totalInvoiceValue: Math.round((taxable + igst + cgst + sgst) * 100) / 100,
      hsnCode: draftInv.hsnCode.trim() || undefined,
      irn: draftInv.irn.trim() || undefined,
      status: "ACTIVE",
    };

    setInvoices((prev) => [newRow, ...prev]);
    setShowAddModal(false);
    setDraftInv((d) => ({ ...d, invoiceNumber: "", recipientGstin: "", recipientName: "", taxableValue: 0, irn: "" }));
    toast.success(`Added ${newRow.invoiceNumber}`);
  };

  const toggleCancelInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, status: inv.status === "CANCELLED" ? "ACTIVE" : "CANCELLED" }
          : inv
      )
    );
  };

  const removeInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  if (isFirmWideView || !activeGstin) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Building2 className="mx-auto h-10 w-10 text-purple-600 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Select a Client GSTIN for GSTR-1 Preparation</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Choose an active client from the top switcher to upload their Sales Register, pull TallyPrime Sales vouchers, validate Table 12 HSN &amp; E-Invoice IRNs, and export GSTN GSTR-1 JSON.
        </p>
        <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
          <button
            onClick={() => openCommandPalette("CLIENTS")}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Select Client GSTIN (Cmd+K)
          </button>
        </div>
        {recentClients && recentClients.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 max-w-lg mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Quick Select Recent Client
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {recentClients.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectClient(c, c.gstin || c.gstinRecords?.[0]?.gstin)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-xs text-slate-700 font-semibold transition text-left"
                >
                  <span className="block truncate max-w-[140px] font-bold">{c.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{c.gstin || c.gstinRecords?.[0]?.gstin || "No GSTIN"}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700">
            <span>Sec 37 & Rule 59 • Outward Return</span>
            {lastSavedAt && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-700">
                Synced to 3B
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            GSTR-1 Outward Workbench — {selectedClient?.name || activeGstin}
          </h1>
          <p className="text-xs text-slate-500">
            GSTIN: <span className="font-mono font-semibold text-slate-700">{activeGstin}</span> • Home State: {supplierStateCode}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activePeriod}
            onChange={(e) => {
              setLocalPeriod(e.target.value);
              selectPeriod(e.target.value);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            {fyPeriods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={turnoverCr > 5 ? "ABOVE5" : "UPTO5"}
            onChange={(e) => setTurnoverCr(e.target.value === "ABOVE5" ? 8 : 3.5)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            title="Controls Table 12 HSN Digit Mandate (4 vs 6) & E-Invoice IRN validation"
          >
            <option value="UPTO5">Turnover ≤ ₹5 Cr (4-digit HSN)</option>
            <option value="ABOVE5">Turnover &gt; ₹5 Cr (6-digit HSN + E-Invoice)</option>
          </select>

          <select
            value={b2clThreshold}
            onChange={(e) => setB2clThreshold(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            title="B2CL Inter-State Unregistered Threshold"
          >
            <option value={100000}>B2CL &gt; ₹1,00,000 (Notif. 12/2024)</option>
            <option value={250000}>B2CL &gt; ₹2,50,000 (Legacy)</option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.xml"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Sales (.xlsx/.csv)
          </button>

          <button
            onClick={handleOpenClientDocs}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
            Client Docs
          </button>

          <button
            onClick={handlePullTally}
            disabled={isTallyPulling}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTallyPulling ? "animate-spin" : ""}`} />
            {isTallyPulling ? "Pulling..." : "TallyPrime (9000)"}
          </button>

          <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={isNilGstr1}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsNilGstr1(checked);
                if (checked && invoices.length > 0) {
                  setInvoices([]);
                  toast.info("Nil GSTR-1 Set", "Sales vouchers cleared for Nil outward return.");
                }
              }}
              className="rounded text-purple-600"
            />
            <span>Nil Return</span>
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Entry
          </button>

          <button
            onClick={handleSaveGstr1}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save & Sync 3B"}
          </button>

          <button
            onClick={handleExportJson}
            disabled={!isNilGstr1 && invoices.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 disabled:opacity-40"
            title={invoices.length === 0 ? "Download Nil GSTR-1 JSON" : "Download GSTN GSTR-1 JSON"}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            {invoices.length === 0 ? "Nil GSTN JSON" : "GSTN JSON"}
          </button>

          <button
            onClick={handleExportExcel}
            disabled={invoices.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            .XLSX
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Taxable Turnover</div>
          <div className="text-lg font-bold text-slate-900 mt-1">₹{fmtInr(summary.totals.taxableValue)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{summary.docSummary.netIssued} Active / {summary.docSummary.cancelled} Cancelled</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Output Tax</div>
          <div className="text-lg font-bold text-purple-700 mt-1">₹{fmtInr(summary.totals.totalTax)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cess: ₹{fmtInr(summary.totals.cess)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">IGST / CGST / SGST</div>
          <div className="text-xs font-bold text-slate-800 mt-1.5 space-y-0.5">
            <div>IGST: ₹{fmtInr(summary.totals.igst)}</div>
            <div>C+S: ₹{fmtInr(summary.totals.cgst)} + ₹{fmtInr(summary.totals.sgst)}</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Table Split</div>
          <div className="text-xs font-semibold text-slate-700 mt-1.5">
            B2B: {summary.b2bInvoices.length} • B2CL: {summary.b2clInvoices.length} • B2CS: {summary.b2csBuckets.length} • Notes: {summary.cdnrNotes.length + summary.cdnurNotes.length}
          </div>
        </div>
        <div className={`rounded-xl border p-3.5 ${errorCount > 0 ? "border-red-200 bg-red-50/70" : "border-emerald-200 bg-emerald-50/60"}`}>
          <div className="text-[11px] font-semibold uppercase text-slate-600">Validation Gate</div>
          <div className="flex items-center gap-1.5 mt-1">
            {errorCount > 0 ? (
              <>
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-bold text-red-700">{errorCount} Errors / {summary.issues.length} Flags</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">{summary.issues.length === 0 ? "Ready for GSTN" : `${summary.issues.length} Warnings`}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
          {[
            { id: "B2B", label: `B2B (${summary.b2bInvoices.length})` },
            { id: "B2CL", label: `B2CL (${summary.b2clInvoices.length})` },
            { id: "B2CS", label: `B2CS (${summary.b2csBuckets.length})` },
            { id: "NOTES", label: `CDNR / CDNUR (${summary.cdnrNotes.length + summary.cdnurNotes.length})` },
            { id: "EXP_NIL", label: `EXP & NIL (${summary.exports.length})` },
            { id: "HSN_DOC", label: `Table 12 HSN (${summary.hsnSummary.length}) & Docs` },
            { id: "ISSUES", label: `Validation (${summary.issues.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Gstr1Tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === t.id
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {invoices.length > 0 && (
          <button
            onClick={() => setInvoices([])}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Clear Register ({invoices.length})
          </button>
        )}
      </div>

      {/* Main Content Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading saved GSTR-1 data...</div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center">
            <FileSpreadsheet className="mx-auto h-9 w-9 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-800">No outward sales vouchers loaded for {activePeriod}</p>
            <p className="text-xs text-slate-500 mt-1">
              Upload a Tally/Busy/Zoho Excel or CSV Sales Register, pull from Client Docs, or connect live to TallyPrime Port 9000.
            </p>
          </div>
        ) : activeTab === "B2CS" ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Place of Supply</th>
                <th className="px-4 py-2.5">Supply Type</th>
                <th className="px-4 py-2.5 text-right">Rate %</th>
                <th className="px-4 py-2.5 text-right">Taxable Value</th>
                <th className="px-4 py-2.5 text-right">IGST</th>
                <th className="px-4 py-2.5 text-right">CGST</th>
                <th className="px-4 py-2.5 text-right">SGST</th>
                <th className="px-4 py-2.5 text-right">Cess</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.b2csBuckets.map((b, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold">State {b.pos}</td>
                  <td className="px-4 py-2.5">{b.supplyType}</td>
                  <td className="px-4 py-2.5 text-right">{b.taxRate}%</td>
                  <td className="px-4 py-2.5 text-right font-mono">₹{fmtInr(b.taxableValue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">₹{fmtInr(b.igst)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">₹{fmtInr(b.cgst)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">₹{fmtInr(b.sgst)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">₹{fmtInr(b.cess)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === "HSN_DOC" ? (
          <div className="space-y-4 p-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex flex-wrap gap-6 text-xs">
              <div><span className="text-slate-500">Table 13 From:</span> <span className="font-mono font-bold">{summary.docSummary.fromSerial}</span></div>
              <div><span className="text-slate-500">To:</span> <span className="font-mono font-bold">{summary.docSummary.toSerial}</span></div>
              <div><span className="text-slate-500">Total Issued:</span> <span className="font-bold">{summary.docSummary.totalIssued}</span></div>
              <div><span className="text-slate-500">Cancelled:</span> <span className="font-bold text-red-600">{summary.docSummary.cancelled}</span></div>
              <div><span className="text-slate-500">Net Issued:</span> <span className="font-bold text-emerald-700">{summary.docSummary.netIssued}</span></div>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">HSN / SAC</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">UQC</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Taxable</th>
                  <th className="px-3 py-2 text-right">Total Tax</th>
                  <th className="px-3 py-2">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.hsnSummary.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono font-bold">{h.hsnCode}</td>
                    <td className="px-3 py-2 text-slate-600">{h.description}</td>
                    <td className="px-3 py-2">{h.uqc}</td>
                    <td className="px-3 py-2 text-right font-mono">{h.totalQuantity}</td>
                    <td className="px-3 py-2 text-right">{h.taxRate}%</td>
                    <td className="px-3 py-2 text-right font-mono">₹{fmtInr(h.taxableValue)}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">₹{fmtInr(h.totalTax)}</td>
                    <td className="px-3 py-2">
                      {h.digitWarning ? (
                        <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{h.digitWarning}</span>
                      ) : (
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Compliant</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "ISSUES" ? (
          <div className="p-4 space-y-2">
            {summary.issues.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-700 font-semibold">
                Zero validation errors or E-Invoice warnings detected.
              </div>
            ) : (
              summary.issues.map((iss, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                    iss.severity === "ERROR"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <div>
                    <span className="font-mono font-bold mr-2">{iss.invoiceNumber}</span>
                    <span>{iss.message}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase">{iss.severity}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Doc No & Date</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Recipient & GSTIN</th>
                <th className="px-3 py-2.5">POS</th>
                <th className="px-3 py-2.5 text-right">Taxable (₹)</th>
                <th className="px-3 py-2.5 text-right">IGST</th>
                <th className="px-3 py-2.5 text-right">CGST</th>
                <th className="px-3 py-2.5 text-right">SGST</th>
                <th className="px-3 py-2.5">HSN / IRN</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === "B2B"
                ? summary.b2bInvoices
                : activeTab === "B2CL"
                ? summary.b2clInvoices
                : activeTab === "NOTES"
                ? [...summary.cdnrNotes, ...summary.cdnurNotes]
                : summary.exports.length > 0
                ? summary.exports
                : invoices.filter((i) => i.docType === "NIL_EXEMPT")
              ).map((inv) => (
                <tr key={inv.id} className={`hover:bg-slate-50 ${inv.status === "CANCELLED" ? "opacity-50 line-through" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="font-mono font-semibold text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-500">{inv.invoiceDate}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">{inv.docType}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-800">{inv.recipientName}</div>
                    <div className="font-mono text-[10px] text-slate-500">{inv.recipientGstin || "Unregistered"}</div>
                  </td>
                  <td className="px-3 py-2 font-mono">{inv.placeOfSupply}</td>
                  <td className="px-3 py-2 text-right font-mono">₹{fmtInr(inv.taxableValue)}</td>
                  <td className="px-3 py-2 text-right font-mono">₹{fmtInr(inv.igst)}</td>
                  <td className="px-3 py-2 text-right font-mono">₹{fmtInr(inv.cgst)}</td>
                  <td className="px-3 py-2 text-right font-mono">₹{fmtInr(inv.sgst)}</td>
                  <td className="px-3 py-2 text-[10px]">
                    <div className="font-mono">{inv.hsnCode || "-"}</div>
                    {inv.irn && <div className="text-emerald-700 truncate max-w-[90px]">IRN ✓</div>}
                  </td>
                  <td className="px-3 py-2 text-right space-x-1">
                    <button
                      onClick={() => toggleCancelInvoice(inv.id)}
                      title={inv.status === "CANCELLED" ? "Restore Invoice" : "Mark Cancelled (Table 13)"}
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-amber-700"
                    >
                      {inv.status === "CANCELLED" ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => removeInvoice(inv.id)}
                      title="Delete Row"
                      className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Client Docs Modal */}
      {showClientDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Client Uploaded Sales Documents</h3>
              <button onClick={() => setShowClientDocs(false)} className="text-xs font-semibold text-slate-500">Close</button>
            </div>
            {isLoadingDocs ? (
              <div className="py-6 text-center text-xs text-slate-500">Loading documents...</div>
            ) : clientDocs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No Excel/CSV/XML files found in Client Vault for this entity.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {clientDocs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{d.file_name}</div>
                      <div className="text-[10px] text-slate-500">{d.category} • FY {d.financial_year || selectedFy}</div>
                    </div>
                    <button
                      onClick={() => handleImportClientDoc(d)}
                      className="rounded-lg bg-purple-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-purple-800"
                    >
                      Import
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleAddManualInvoice} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add Outward Invoice / Credit Note</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-xs font-semibold text-slate-500">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="font-semibold text-slate-600">Invoice / Note No *</label>
                <input
                  required
                  value={draftInv.invoiceNumber}
                  onChange={(e) => setDraftInv({ ...draftInv, invoiceNumber: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Date</label>
                <input
                  type="date"
                  value={draftInv.invoiceDate}
                  onChange={(e) => setDraftInv({ ...draftInv, invoiceDate: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Doc Type</label>
                <select
                  value={draftInv.docType}
                  onChange={(e) => setDraftInv({ ...draftInv, docType: e.target.value as OutwardDocType })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5"
                >
                  <option value="INV">Tax Invoice</option>
                  <option value="CRN">Credit Note (CRN)</option>
                  <option value="DBN">Debit Note (DBN)</option>
                  <option value="EXP_WPAY">Export (With Tax)</option>
                  <option value="EXP_WOPAY">Export (LUT / Without Tax)</option>
                  <option value="NIL_EXEMPT">Nil / Exempt</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-600">POS State Code</label>
                <input
                  maxLength={2}
                  value={draftInv.placeOfSupply}
                  onChange={(e) => setDraftInv({ ...draftInv, placeOfSupply: e.target.value.replace(/\D/g, "") })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Recipient GSTIN (Optional)</label>
                <input
                  value={draftInv.recipientGstin}
                  onChange={(e) => setDraftInv({ ...draftInv, recipientGstin: e.target.value.toUpperCase() })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Recipient Name</label>
                <input
                  value={draftInv.recipientName}
                  onChange={(e) => setDraftInv({ ...draftInv, recipientName: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">Taxable Value (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={draftInv.taxableValue}
                  onChange={(e) => setDraftInv({ ...draftInv, taxableValue: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">GST Rate %</label>
                <select
                  value={draftInv.taxRate}
                  onChange={(e) => setDraftInv({ ...draftInv, taxRate: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5"
                >
                  {[0, 5, 12, 18, 28].map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-600">HSN / SAC</label>
                <input
                  value={draftInv.hsnCode}
                  onChange={(e) => setDraftInv({ ...draftInv, hsnCode: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">E-Invoice IRN (Optional)</label>
                <input
                  value={draftInv.irn}
                  onChange={(e) => setDraftInv({ ...draftInv, irn: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">Cancel</button>
              <button type="submit" className="rounded-lg bg-purple-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-800">Add to Register</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
