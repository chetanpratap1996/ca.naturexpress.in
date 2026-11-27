"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  ShieldAlert,
  Layers,
  Search,
  Upload,
  Download,
  Building2,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  ImsInvoiceItem,
  Rule37ARecord,
  GstImsEngine,
  ImsActionType,
} from "@/lib/gst/imsEngine";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { useClientContext } from "@/lib/context/ClientContext";
import { resolveActiveGstCycle } from "@/lib/gst/gstComplianceEngine";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
import {
  gstFetchJson,
  getPeriodsForFy,
  toGstnReturnPeriod,
  deriveIndianFy,
  getRule37aDeadlineForFy,
} from "@/lib/gst/gstClientFetch";
import { getActiveSession } from "@/lib/auth/session";
import { readExcelSheetsFromBuffer, autoDetectColumnMapping, downloadWorkbookXlsx } from "@/lib/parsers/excelGstParser";

export function GstImsWorkbench() {
  const {
    selectedClient,
    selectedGstin,
    selectedFy,
    selectedPeriod,
    selectPeriod,
    isFirmWideView,
    openCommandPalette,
  } = useClientContext();

  const fyPeriods = useMemo(() => getPeriodsForFy(selectedFy), [selectedFy]);
  const activePeriod = selectedPeriod || resolveActiveGstCycle().periodLabel || fyPeriods[0] || "November 2026";
  const activeGstin = useMemo(() => {
    if (isFirmWideView || !selectedClient) return "";
    return selectedGstin || selectedClient.gstin || selectedClient.gstinRecords?.[0]?.gstin || "";
  }, [isFirmWideView, selectedClient, selectedGstin]);

  const currentActorName = useMemo(() => {
    const s = getActiveSession();
    return s?.name || "Practice Staff";
  }, []);

  const [activeTab, setActiveTab] = useState<"IMS_INVOICES" | "RULE_37A">("IMS_INVOICES");
  const [invoices, setInvoices] = useState<ImsInvoiceItem[]>([]);
  const [rule37List, setRule37List] = useState<Rule37ARecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "NO_ACTION" | "PENDING" | "ACCEPT" | "REJECT" | "MISMATCH"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing2b, setIsSyncing2b] = useState(false);
  const [isVerifyingRule37, setIsVerifyingRule37] = useState(false);

  // Manual Rule 37 / 37A add state
  const [showAddRule37, setShowAddRule37] = useState(false);
  const [newR37Gstin, setNewR37Gstin] = useState("");
  const [newR37Name, setNewR37Name] = useState("");
  const [newR37Inv, setNewR37Inv] = useState("");
  const [newR37Date, setNewR37Date] = useState("");
  const [newR37Amt, setNewR37Amt] = useState("");
  const [newR37Type, setNewR37Type] = useState<"RULE_37A" | "RULE_37_180D">("RULE_37A");

  const persistImsState = useCallback(
    async (nextInvoices: ImsInvoiceItem[], nextRule37: Rule37ARecord[]) => {
      if (!activeGstin) return;
      await gstFetchJson("/api/gst/ims", {
        method: "POST",
        body: JSON.stringify({
          clientGstin: activeGstin,
          taxPeriod: activePeriod,
          invoices: nextInvoices,
          rule37Records: nextRule37,
        }),
      });
    },
    [activeGstin, activePeriod]
  );

  const loadImsData = useCallback(async () => {
    if (!activeGstin) {
      setInvoices([]);
      setRule37List([]);
      return;
    }
    setIsLoading(true);
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/ims?clientGstin=${encodeURIComponent(activeGstin)}&taxPeriod=${encodeURIComponent(activePeriod)}`
      );
      if (ok && data?.success) {
        setInvoices(data.invoices || []);
        setRule37List(
          GstImsEngine.evaluateRule37A(data.rule37Records || [], new Date().toISOString().split("T")[0])
        );
      } else {
        setInvoices([]);
        setRule37List([]);
      }
    } catch {
      setInvoices([]);
      setRule37List([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeGstin, activePeriod]);

  useEffect(() => {
    loadImsData();
  }, [loadImsData]);

  const stats = useMemo(
    () => GstImsEngine.computeSummary(invoices, rule37List),
    [invoices, rule37List]
  );

  // Sync directly from saved 2B Reconciliation
  const handleSyncFrom2bMatcher = async () => {
    if (!activeGstin) return;
    setIsSyncing2b(true);
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/reconciliation?clientGstin=${encodeURIComponent(activeGstin)}&taxPeriod=${encodeURIComponent(activePeriod)}`
      );
      if (!ok || !data?.found || !data?.report) {
        toast.warning("No 2B Data Found", `Upload GSTR-2B & Books in 2B Matcher for ${activePeriod} first.`);
        return;
      }

      const records: any[] = data.report.records || [];
      const derivedInvoices: ImsInvoiceItem[] = [];
      const derivedRule37: Rule37ARecord[] = [...rule37List];
      const existingR37Keys = new Set(derivedRule37.map((r) => `${r.supplierGstin}|${r.invoiceNumber}`));

      for (const r of records) {
        if (r.gstr2bId) {
          const matchingStatus: ImsInvoiceItem["matchingStatus"] =
            r.matchStatus === "MISSING_IN_BOOKS"
              ? "NOT_IN_BOOKS"
              : r.matchStatus === "VALUE_MISMATCH"
              ? "VALUE_MISMATCH"
              : "EXACT_MATCH";
          const itcEligibility: ImsInvoiceItem["itcEligibility"] = r.section17_5Blocked
            ? "INELIGIBLE_17_5"
            : r.posMismatch
            ? "POS_MISMATCH"
            : "ELIGIBLE";
          const docType = r.isCreditNote ? "CDNR" : r.isIsd ? "ISD" : "B2B";
          const rec = GstImsEngine.evaluateRecommendation({
            invoiceType: docType,
            matchingStatus,
            itcEligibility,
            varianceAmount: r.taxVariance,
          });
          const prevExisting = invoices.find(
            (i) => i.supplierGstin === r.vendorGstin && i.invoiceNumber === r.gstr2bInvoiceNo
          );

          derivedInvoices.push({
            id: `IMS-${r.id}`,
            supplierGstin: r.vendorGstin,
            supplierTradeName: r.vendorName,
            invoiceNumber: r.gstr2bInvoiceNo || "",
            invoiceType: docType,
            invoiceDate: r.gstr2bDate || "",
            taxableValue: r.gstr2bTaxableValue,
            igst: r.gstr2bIgst,
            cgst: r.gstr2bCgst,
            sgst: r.gstr2bSgst,
            cess: r.gstr2bCess || 0,
            totalTax: r.gstr2bTotalTax,
            posStateCode: activeGstin.substring(0, 2),
            itcEligibility,
            matchingStatus,
            bookInvoiceNumber: r.booksInvoiceNo,
            bookTaxableValue: r.booksTaxableValue,
            bookTotalTax: r.booksTotalTax,
            varianceAmount: r.taxVariance,
            currentAction: prevExisting?.currentAction || "NO_ACTION",
            recommendedAction: rec.action,
            recommendationReason: rec.reason,
            actionTimestamp: prevExisting?.actionTimestamp,
            actionBy: prevExisting?.actionBy,
          });
        }

        // Populate Rule 37A or Rule 37 180-Day tracker
        if ((r.rule37aRisk && r.gstr2bId) || r.rule37_180DayRisk) {
          const invNo = r.gstr2bInvoiceNo || r.booksInvoiceNo || "INV";
          const key = `${r.vendorGstin}|${invNo}`;
          if (!existingR37Keys.has(key)) {
            existingR37Keys.add(key);
            const invDt = r.gstr2bDate || r.booksDate || "";
            const fy = `FY ${deriveIndianFy(invDt || activePeriod)}`;
            const is180 = Boolean(r.rule37_180DayRisk && !r.rule37aRisk);
            derivedRule37.push({
              id: `R37-${Date.now()}-${derivedRule37.length}`,
              ruleType: is180 ? "RULE_37_180D" : "RULE_37A",
              supplierGstin: r.vendorGstin,
              supplierName: r.vendorName,
              invoiceNumber: invNo,
              financialYear: fy,
              invoiceDate: invDt,
              itcClaimedAmount: r.gstr2bTotalTax || r.booksTotalTax,
              supplierGstr1FiledDate: r.gstr2bDate || "",
              supplierGstr3bStatus: r.gstr3bFilingStatus === "NOT_FILED" ? "NOT_FILED" : "FILED",
              reversalDeadline: is180 && invDt
                ? new Date(new Date(invDt).getTime() + 180 * 86400000).toISOString().split("T")[0]
                : getRule37aDeadlineForFy(fy),
              reversalStatus: "PENDING_REVERSAL",
              interestExposure: 0,
              vendorNotified: false,
            });
          }
        }
      }

      const evaluated = GstImsEngine.evaluateRule37A(derivedRule37);
      setInvoices(derivedInvoices);
      setRule37List(evaluated);
      await persistImsState(derivedInvoices, evaluated);
      toast.success(
        "Synced from 2B Matcher",
        `Loaded ${derivedInvoices.length} IMS documents and ${evaluated.length} Rule 37/37A tracker items.`
      );
    } catch (err: any) {
      toast.error("Sync Failed", err?.message || "Failed to sync from 2B Matcher.");
    } finally {
      setIsSyncing2b(false);
    }
  };

  const handleImportImsJson = async (file: File) => {
    try {
      const lower = file.name.toLowerCase();
      let parsed: ImsInvoiceItem[] = [];
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        const sheets = readExcelSheetsFromBuffer(buf);
        const first = sheets[0];
        if (first && first.rows.length > 0) {
          const m = autoDetectColumnMapping(first.headers);
          parsed = first.rows
            .map((row, idx): ImsInvoiceItem | null => {
              const gstin = String(m.gstinCol >= 0 ? row[m.gstinCol] || "" : "").trim().toUpperCase();
              const invNo = String(m.invNoCol >= 0 ? row[m.invNoCol] || "" : "").trim();
              if (!gstin || !invNo) return null;
              const num = (c: number) => (c >= 0 ? Number(String(row[c] || 0).replace(/[^0-9.-]/g, "")) || 0 : 0);
              const igst = num(m.igstCol);
              const cgst = num(m.cgstCol);
              const sgst = num(m.sgstCol);
              const cess = num(m.cessCol);
              const taxableValue = num(m.taxableCol);
              const totalTax = Math.round((igst + cgst + sgst + cess) * 100) / 100;
              const vt = String(m.vtypeCol >= 0 ? row[m.vtypeCol] || "" : "").toUpperCase();
              const invoiceType: ImsInvoiceItem["invoiceType"] =
                vt.includes("CREDIT") || vt.includes("DEBIT") || vt.includes("CDNR")
                  ? "CDNR"
                  : vt.includes("ISD")
                  ? "ISD"
                  : "B2B";
              const posVal = m.posCol >= 0 && row[m.posCol] ? String(row[m.posCol]).trim().slice(0, 2) : "";
              return {
                id: `ims-xlsx-${idx + 1}`,
                supplierGstin: gstin,
                supplierTradeName: String(m.nameCol >= 0 ? row[m.nameCol] || gstin : gstin).trim(),
                invoiceNumber: invNo,
                invoiceDate: String(m.dateCol >= 0 ? row[m.dateCol] || "" : "").trim(),
                invoiceType,
                taxableValue,
                igst,
                cgst,
                sgst,
                cess,
                totalTax,
                posStateCode: posVal || activeGstin.slice(0, 2) || gstin.slice(0, 2) || "27",
                matchingStatus: "NOT_IN_BOOKS",
                itcEligibility: "ELIGIBLE",
                recommendedAction: "NO_ACTION",
                recommendationReason: "Imported from GSTN IMS Excel; verify in Purchase Register.",
                currentAction: "NO_ACTION",
              };
            })
            .filter((x): x is ImsInvoiceItem => x !== null);
        }
      } else {
        const text = await file.text();
        parsed = GstImsEngine.parseImsJson(text);
      }
      if (parsed.length === 0) {
        toast.error("Empty IMS File", "No IMS invoice items found in JSON/Excel.");
        return;
      }
      setInvoices(parsed);
      await persistImsState(parsed, rule37List);
      toast.success("IMS Imported", `Loaded and saved ${parsed.length} portal invoices.`);
    } catch (err: any) {
      toast.error("Import Failed", err?.message || "Invalid GSTN IMS JSON/Excel file.");
    }
  };

  const handleVerifyRule37Suppliers = async () => {
    const gstins = Array.from(new Set(rule37List.map((r) => r.supplierGstin).filter((g) => g && g.length === 15)));
    if (gstins.length === 0) return;
    setIsVerifyingRule37(true);
    try {
      const { ok, data } = await gstFetchJson<any>("/api/gst/sync-portal", {
        method: "POST",
        body: JSON.stringify({ action: "BATCH_VENDOR_VERIFY", gstins, fy: selectedFy }),
      });
      if (!ok || !data?.success || !data.results) {
        toast.warning("GSTN Check Unavailable", data?.error || "Could not verify Rule 37A suppliers.");
        return;
      }
      let filedCount = 0;
      const updated = rule37List.map((rec) => {
        const info = data.results[rec.supplierGstin];
        if (info && info.gstr3bFiled > 0 && rec.ruleType === "RULE_37A") {
          filedCount++;
          return { ...rec, supplierGstr3bStatus: "FILED" as const };
        }
        return rec;
      });
      setRule37List(updated);
      await persistImsState(invoices, updated);
      toast.success(
        "Rule 37A Suppliers Verified",
        filedCount > 0
          ? `${filedCount} supplier(s) have now filed GSTR-3B — ITC eligible for 4(A)(5) re-claim!`
          : `Checked ${gstins.length} suppliers against GSTN.`
      );
    } finally {
      setIsVerifyingRule37(false);
    }
  };

  const handleExportImsActionJson = () => {
    if (!activeGstin || invoices.length === 0) return;
    const payload = GstImsEngine.buildGstnActionUploadPayload(
      activeGstin,
      toGstnReturnPeriod(activePeriod) || activePeriod,
      invoices
    );
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GST_IMS_Actions_${activeGstin}_${activePeriod.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("IMS Action JSON Exported", "Ready for GSTN IMS portal upload.");
  };

  const handleExportImsExcel = () => {
    if (!activeGstin || invoices.length === 0) return;
    downloadWorkbookXlsx(
      `GST_IMS_Audit_Workpaper_${activeGstin}_${activePeriod.replace(/\s+/g, "_")}.xlsx`,
      [
        {
          name: "IMS_Invoices",
          rows: invoices.map((inv) => ({
            SupplierGSTIN: inv.supplierGstin,
            SupplierName: inv.supplierTradeName,
            InvoiceNumber: inv.invoiceNumber,
            InvoiceDate: inv.invoiceDate,
            Type: inv.invoiceType,
            POS: inv.posStateCode,
            TaxableValue: inv.taxableValue,
            IGST: inv.igst,
            CGST: inv.cgst,
            SGST: inv.sgst,
            Cess: inv.cess,
            TotalTax: inv.totalTax,
            MatchingStatus: inv.matchingStatus,
            ITCEligibility: inv.itcEligibility,
            CurrentAction: inv.currentAction,
            RecommendedAction: inv.recommendedAction,
            RecommendationReason: inv.recommendationReason,
          })),
        },
        {
          name: "Rule37A_Suppliers",
          rows: rule37List.map((r) => ({
            SupplierGSTIN: r.supplierGstin,
            SupplierName: r.supplierName,
            InvoiceNumber: r.invoiceNumber,
            FinancialYear: r.financialYear,
            InvoiceDate: r.invoiceDate,
            ITCClaimed: r.itcClaimedAmount,
            Gstr3bStatus: r.supplierGstr3bStatus,
            ReversalDeadline: r.reversalDeadline,
            ReversalStatus: r.reversalStatus,
            InterestExposure: r.interestExposure,
          })),
        },
        {
          name: "Action_Summary",
          rows: [
            { Status: "Accepted ITC", Amount: stats.acceptedItc, Count: stats.acceptedCount },
            { Status: "Rejected ITC", Amount: stats.rejectedItc, Count: stats.rejectedCount },
            { Status: "Pending ITC", Amount: stats.pendingItc, Count: stats.pendingCount },
            { Status: "No Action / Deemed Accept", Amount: stats.noActionItc, Count: stats.noActionCount },
          ],
        },
      ]
    );
    toast.success("IMS Excel Downloaded", "Multi-sheet IMS audit workpaper spreadsheet generated.");
  };

  const handleActionChange = async (id: string, action: ImsActionType) => {
    const target = invoices.find((i) => i.id === id);
    if (target && action === "PENDING") {
      const constraint = GstImsEngine.getActionConstraint(target.invoiceType);
      if (!constraint.allowPending) {
        toast.warning("Action Restricted", constraint.warning || "Pending is not permitted for this document type.");
        return;
      }
    }

    const next = invoices.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            currentAction: action,
            actionTimestamp: new Date().toISOString(),
            actionBy: currentActorName,
          }
        : inv
    );
    setInvoices(next);
    await persistImsState(next, rule37List);
    toast.success(`IMS Action Saved: ${action}`);
  };

  const handleBatchAcceptClean = async () => {
    let count = 0;
    const next = invoices.map((inv) => {
      if (inv.matchingStatus === "EXACT_MATCH" && inv.currentAction !== "ACCEPT") {
        count++;
        return {
          ...inv,
          currentAction: "ACCEPT" as ImsActionType,
          actionTimestamp: new Date().toISOString(),
          actionBy: `${currentActorName} (Batch)`,
        };
      }
      return inv;
    });
    setInvoices(next);
    await persistImsState(next, rule37List);
    toast.success(`Accepted ${count} exact-matched invoices`);
  };

  const handleBatchRejectMismatches = async () => {
    let count = 0;
    const next = invoices.map((inv) => {
      if (inv.matchingStatus === "VALUE_MISMATCH" && inv.currentAction !== "REJECT") {
        count++;
        return {
          ...inv,
          currentAction: "REJECT" as ImsActionType,
          actionTimestamp: new Date().toISOString(),
          actionBy: `${currentActorName} (Batch)`,
        };
      }
      return inv;
    });
    setInvoices(next);
    await persistImsState(next, rule37List);
    toast.success(`Rejected ${count} value-mismatched invoices`);
  };

  // Rule 37 / 37A State Transitions
  const handleUpdateRule37Status = async (
    recordId: string,
    nextStatus: Rule37ARecord["reversalStatus"]
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const next = GstImsEngine.evaluateRule37A(
      rule37List.map((r) =>
        r.id === recordId
          ? {
              ...r,
              reversalStatus: nextStatus,
              ...(nextStatus === "REVERSED_TABLE_4B2" ? { reversalDate: today } : {}),
              ...(nextStatus === "RE_CLAIMED_TABLE_4A5"
                ? { reClaimDate: today, supplierGstr3bStatus: "FILED" }
                : {}),
            }
          : r
      )
    );
    setRule37List(next);
    await persistImsState(invoices, next);
    toast.success(
      nextStatus === "REVERSED_TABLE_4B2" ? "Marked Reversed in Table 4(B)(2)" : "Re-claimed in Table 4(A)(5)"
    );
  };

  const handleSendVendorNotice = async (rec: Rule37ARecord) => {
    const { ok, data } = await gstFetchJson<any>("/api/gst/vendor-notice", {
      method: "POST",
      body: JSON.stringify({
        buyerEntityName: selectedClient?.tradeName || selectedClient?.name || "Client Assessee",
        buyerGstin: activeGstin,
        vendorTradeName: rec.supplierName,
        vendorGstin: rec.supplierGstin,
        taxPeriod: activePeriod,
        invoices: [
          {
            invoiceNumber: rec.invoiceNumber,
            invoiceDate: rec.invoiceDate,
            taxableValue: Math.round(rec.itcClaimedAmount / 0.18),
            igst: rec.itcClaimedAmount,
            cgst: 0,
            sgst: 0,
            totalTax: rec.itcClaimedAmount,
            totalInvoiceValue: Math.round(rec.itcClaimedAmount / 0.18) + rec.itcClaimedAmount,
            reason: "GSTR_3B_UNFILED",
          },
        ],
      }),
    });

    const next = rule37List.map((r) =>
      r.id === rec.id
        ? { ...r, vendorNotified: true, vendorLastReminderDate: new Date().toISOString().split("T")[0] }
        : r
    );
    setRule37List(next);
    await persistImsState(invoices, next);

    if (ok && data?.notice?.whatsappUrl) {
      window.open(data.notice.whatsappUrl, "_blank", "noopener,noreferrer");
    }
    toast.success("Rule 37A Notice Saved", `Archived and opened WhatsApp for ${rec.supplierName}.`);
  };

  const handleAddRule37Record = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newR37Gstin || !newR37Inv || !newR37Amt) return;
    const fy = `FY ${deriveIndianFy(newR37Date || activePeriod)}`;
    const newRec: Rule37ARecord = {
      id: `R37-${Date.now()}`,
      ruleType: newR37Type,
      supplierGstin: newR37Gstin.trim().toUpperCase(),
      supplierName: newR37Name.trim() || newR37Gstin.trim().toUpperCase(),
      invoiceNumber: newR37Inv.trim(),
      financialYear: fy,
      invoiceDate: newR37Date || new Date().toISOString().split("T")[0],
      itcClaimedAmount: parseFloat(newR37Amt) || 0,
      supplierGstr1FiledDate: newR37Date || "",
      supplierGstr3bStatus: newR37Type === "RULE_37A" ? "NOT_FILED" : "FILED",
      reversalDeadline:
        newR37Type === "RULE_37_180D" && newR37Date
          ? new Date(new Date(newR37Date).getTime() + 180 * 86400000).toISOString().split("T")[0]
          : getRule37aDeadlineForFy(fy),
      reversalStatus: "PENDING_REVERSAL",
      interestExposure: 0,
      vendorNotified: false,
    };
    const next = GstImsEngine.evaluateRule37A([newRec, ...rule37List]);
    setRule37List(next);
    await persistImsState(invoices, next);
    setShowAddRule37(false);
    setNewR37Gstin("");
    setNewR37Name("");
    setNewR37Inv("");
    setNewR37Amt("");
    toast.success("Tracker Entry Added");
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter === "NO_ACTION" && inv.currentAction !== "NO_ACTION") return false;
      if (statusFilter === "PENDING" && inv.currentAction !== "PENDING") return false;
      if (statusFilter === "ACCEPT" && inv.currentAction !== "ACCEPT") return false;
      if (statusFilter === "REJECT" && inv.currentAction !== "REJECT") return false;
      if (statusFilter === "MISMATCH" && inv.matchingStatus !== "VALUE_MISMATCH") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inv.supplierTradeName.toLowerCase().includes(q) ||
          inv.supplierGstin.toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
              Invoice Management System &bull; 14th Cutoff (Deemed Accept on No Action)
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              GST IMS &amp; Rule 37 / 37A Desk
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <UniversalClientSelector variant="full" />

            <select
              value={activePeriod}
              onChange={(e) => selectPeriod(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
            >
              {fyPeriods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {activeGstin && (
              <>
                <button
                  onClick={handleSyncFrom2bMatcher}
                  disabled={isSyncing2b}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing2b ? "animate-spin" : ""}`} />
                  <span>Sync from 2B</span>
                </button>

                <label className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import IMS (.json/.xlsx)</span>
                  <input
                    type="file"
                    accept=".json,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImportImsJson(e.target.files[0])}
                  />
                </label>

                {invoices.length > 0 && (
                  <>
                    <button
                      onClick={handleExportImsExcel}
                      className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Download multi-sheet IMS workpaper Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export IMS (.xlsx)</span>
                    </button>
                    <button
                      onClick={handleExportImsActionJson}
                      className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export IMS JSON</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Exact INR KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Accepted ITC</span>
            <span className="text-base font-bold text-emerald-900 font-mono block mt-0.5">
              {formatCurrencyINR(stats.acceptedItc)}
            </span>
            <span className="text-[10px] text-emerald-700">{stats.acceptedCount} Docs</span>
          </div>

          <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">No Action (Deemed 2B)</span>
            <span className="text-base font-bold text-blue-900 font-mono block mt-0.5">
              {formatCurrencyINR(stats.noActionItc)}
            </span>
            <span className="text-[10px] text-blue-700">{stats.noActionCount} Docs</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Kept Pending</span>
            <span className="text-base font-bold text-amber-900 font-mono block mt-0.5">
              {formatCurrencyINR(stats.pendingItc)}
            </span>
            <span className="text-[10px] text-amber-700">{stats.pendingCount} Docs</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3">
            <span className="text-[10px] font-bold text-rose-700 uppercase block">Rejected</span>
            <span className="text-base font-bold text-rose-900 font-mono block mt-0.5">
              {formatCurrencyINR(stats.rejectedItc)}
            </span>
            <span className="text-[10px] text-rose-700">{stats.rejectedCount} Docs</span>
          </div>

          <div className="bg-red-50/60 border border-red-200 rounded-lg p-3">
            <span className="text-[10px] font-bold text-red-700 uppercase block">Rule 37 / 37A Pending</span>
            <span className="text-base font-bold text-red-800 font-mono block mt-0.5">
              {formatCurrencyINR(stats.rule37aAtRiskAmount)}
            </span>
            <span className="text-[10px] text-red-700">{stats.rule37aAtRiskCount} Defaulting</span>
          </div>
        </div>
      </div>

      {!activeGstin ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Select a Client &amp; GSTIN</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            IMS Actions and Rule 37 / 37A reversal ledgers are tracked per GSTIN and return period.
          </p>
          <button
            onClick={() => openCommandPalette("CLIENTS")}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
          >
            Select Client
          </button>
        </div>
      ) : (
        <>
          {/* Sub-Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("IMS_INVOICES")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "IMS_INVOICES"
                    ? "bg-red-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>IMS Invoices ({invoices.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("RULE_37A")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "RULE_37A"
                    ? "bg-red-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Rule 37 &amp; 37A Reversal Ledger ({rule37List.length})</span>
              </button>
            </div>

            {activeTab === "IMS_INVOICES" && invoices.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchAcceptClean}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept Exact Matches
                </button>
                <button
                  onClick={handleBatchRejectMismatches}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Mismatches
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: IMS INVOICES */}
          {activeTab === "IMS_INVOICES" && (
            <div className="space-y-4">
              {!isLoading && invoices.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">
                    No IMS Records for {activeGstin} ({activePeriod})
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Click &ldquo;Sync from 2B&rdquo; to populate documents from your saved 2B Matcher reconciliation, or import a GSTN IMS JSON file.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search supplier, GSTIN, invoice..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-0 text-xs text-slate-900 focus:outline-none w-full sm:w-64"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                      {(["ALL", "NO_ACTION", "ACCEPT", "PENDING", "REJECT", "MISMATCH"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setStatusFilter(f)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            statusFilter === f
                              ? "bg-red-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {f === "ALL" ? "All" : f === "NO_ACTION" ? "No Action" : f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredInvoices.map((inv) => {
                      const constraint = GstImsEngine.getActionConstraint(inv.invoiceType);
                      return (
                        <div
                          key={inv.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900">{inv.supplierTradeName}</h4>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {inv.invoiceType}
                                </span>
                                {inv.itcEligibility === "INELIGIBLE_17_5" && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                                    Sec 17(5) Blocked
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-mono text-slate-500 mt-0.5">
                                {inv.supplierGstin} • Inv: {inv.invoiceNumber} • Date: {inv.invoiceDate}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                              <button
                                onClick={() => handleActionChange(inv.id, "ACCEPT")}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                                  inv.currentAction === "ACCEPT"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                              </button>
                              <button
                                onClick={() => handleActionChange(inv.id, "REJECT")}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                                  inv.currentAction === "REJECT"
                                    ? "bg-red-600 text-white border-red-600"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                              <button
                                onClick={() => handleActionChange(inv.id, "PENDING")}
                                disabled={!constraint.allowPending}
                                title={constraint.warning || "Keep Pending"}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border disabled:opacity-40 ${
                                  inv.currentAction === "PENDING"
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" /> Pending
                              </button>
                              <button
                                onClick={() => handleActionChange(inv.id, "NO_ACTION")}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                                  inv.currentAction === "NO_ACTION"
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                                title="Deemed Accepted on 14th"
                              >
                                <RotateCcw className="w-3 h-3" /> No Action
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
                              <span className="font-sans text-[10px] text-slate-500 block">Portal Value (IGST / CGST / SGST)</span>
                              <span className="text-slate-800">
                                Taxable: {formatCurrencyINR(inv.taxableValue)} | Tax: <strong>{formatCurrencyINR(inv.totalTax)}</strong>
                              </span>
                              <span className="block text-[10px] text-slate-500">
                                I:{inv.igst} C:{inv.cgst} S:{inv.sgst}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono">
                              <span className="font-sans text-[10px] text-slate-500 block">Purchase Register Cross-Check</span>
                              {inv.bookTaxableValue !== undefined && inv.bookTaxableValue > 0 ? (
                                <span>
                                  Taxable: {formatCurrencyINR(inv.bookTaxableValue)} | Diff:{" "}
                                  <strong className={inv.varianceAmount === 0 ? "text-emerald-700" : "text-rose-600"}>
                                    ₹{inv.varianceAmount}
                                  </strong>
                                </span>
                              ) : (
                                <span className="font-sans text-amber-800 font-bold">
                                  Not in Books — Record Tally Purchase Entry before Accepting
                                </span>
                              )}
                              {(inv.invoiceType === "CDNR" || inv.invoiceType === "CDNRA") && inv.currentAction === "REJECT" && (
                                <span className="mt-1 block font-sans text-[10px] font-bold text-rose-700">
                                  Warning: Rejecting supplier Credit Note increases your Output Tax Liability!
                                </span>
                              )}
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-800 block">
                                Recommended: {inv.recommendedAction}
                              </span>
                              <p className="text-[11px] text-slate-600">{inv.recommendationReason}</p>
                              {constraint.warning && (
                                <p className="text-[10px] text-amber-700 font-semibold mt-0.5">{constraint.warning}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: RULE 37A & RULE 37 REVERSAL TRACKER */}
          {activeTab === "RULE_37A" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Rule 37A (Vendor 3B Default) &amp; Rule 37 (180-Day Unpaid) Reversal Ledger
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reverse ITC in GSTR-3B Table 4(B)(2) by 30th November of the subsequent FY (or 180 days from invoice) to avoid 18% p.a. Sec 50 interest; re-claim in Table 4(A)(5) once regularized.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleVerifyRule37Suppliers}
                    disabled={isVerifyingRule37 || rule37List.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingRule37 ? "animate-spin" : ""}`} />
                    <span>{isVerifyingRule37 ? "Checking GSTN..." : "Verify Suppliers on GSTN"}</span>
                  </button>
                  <button
                    onClick={() => setShowAddRule37((v) => !v)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Entry
                  </button>
                </div>
              </div>

              {showAddRule37 && (
                <form
                  onSubmit={handleAddRule37Record}
                  className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                >
                  <select
                    value={newR37Type}
                    onChange={(e) => setNewR37Type(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-semibold"
                  >
                    <option value="RULE_37A">Rule 37A (3B Unfiled)</option>
                    <option value="RULE_37_180D">Rule 37 (180d Unpaid)</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Supplier GSTIN"
                    value={newR37Gstin}
                    onChange={(e) => setNewR37Gstin(e.target.value.toUpperCase())}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    value={newR37Name}
                    onChange={(e) => setNewR37Name(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1.5"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Invoice No"
                    value={newR37Inv}
                    onChange={(e) => setNewR37Inv(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono"
                  />
                  <input
                    type="date"
                    value={newR37Date}
                    onChange={(e) => setNewR37Date(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono"
                  />
                  <input
                    type="number"
                    required
                    placeholder="ITC Claimed (₹)"
                    value={newR37Amt}
                    onChange={(e) => setNewR37Amt(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono"
                  />
                  <button type="submit" className="bg-red-600 text-white font-bold rounded-lg px-3 py-1.5">
                    Save
                  </button>
                </form>
              )}

              {rule37List.length === 0 ? (
                <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-xl">
                  No Rule 37A or 180-day Rule 37 exposures recorded for {activeGstin}. Sync from 2B Matcher or add an entry manually.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
                    <thead className="bg-slate-100 text-slate-700 text-[10px]">
                      <tr>
                        <th className="p-3">Supplier</th>
                        <th className="p-3">Rule &amp; Invoice</th>
                        <th className="p-3 text-right">ITC Claimed</th>
                        <th className="p-3">Deadline</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Sec 50 Int.</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rule37List.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <span className="font-sans font-semibold text-slate-900 block">{rec.supplierName}</span>
                            <span className="text-[10px] text-slate-500">{rec.supplierGstin}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-1">
                              {rec.ruleType === "RULE_37_180D" ? "180D" : "37A"}
                            </span>
                            <span className="text-slate-800">{rec.invoiceNumber}</span>
                            <span className="text-[10px] text-slate-500 block">{rec.financialYear}</span>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatCurrencyINR(rec.itcClaimedAmount)}
                          </td>
                          <td className="p-3">{rec.reversalDeadline}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rec.reversalStatus === "RE_CLAIMED_TABLE_4A5"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : rec.reversalStatus === "REVERSED_TABLE_4B2"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {rec.reversalStatus.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className={rec.interestExposure > 0 ? "font-bold text-red-600" : "text-emerald-700 font-bold"}>
                              {formatCurrencyINR(rec.interestExposure)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-sans">
                            <div className="flex items-center justify-end gap-1.5">
                              {rec.reversalStatus === "PENDING_REVERSAL" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateRule37Status(rec.id, "REVERSED_TABLE_4B2")}
                                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                                  >
                                    Mark Reversed 4B(2)
                                  </button>
                                  <button
                                    onClick={() => handleSendVendorNotice(rec)}
                                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
                                  >
                                    <Send className="w-3 h-3" /> Notice
                                  </button>
                                </>
                              )}
                              {rec.reversalStatus === "REVERSED_TABLE_4B2" && (
                                <button
                                  onClick={() => handleUpdateRule37Status(rec.id, "RE_CLAIMED_TABLE_4A5")}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                                >
                                  Re-claim in 4A(5)
                                </button>
                              )}
                              {rec.reversalStatus === "RE_CLAIMED_TABLE_4A5" && (
                                <span className="text-emerald-700 text-[11px] font-semibold">Re-claimed {rec.reClaimDate}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
