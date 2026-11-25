"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Truck,
  Building2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  Plus,
  Save,
  Copy,
  Trash2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Gstr9AnnualRecoEngine, type Gstr9CompiledData } from "@/lib/gst/gstr9Engine";
import { downloadWorkbookXlsx } from "@/lib/parsers/excelGstParser";
import { EInvoiceRecord, EInvoiceEwbEngine } from "@/lib/gst/eInvoiceEwbEngine";
import { StateGstinProfile, MultiGstinIsdEngine } from "@/lib/gst/multiGstinEngine";
import { DrcIntimationNotice, Drc01b01cEngine } from "@/lib/gst/drc01b01cEngine";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
import { gstFetchJson } from "@/lib/gst/gstClientFetch";
import { getActiveSession } from "@/lib/auth/session";
import { GST_STATE_CODES } from "@/lib/config/entityDna";

export function PillarOneGstEnterpriseWorkbench() {
  const {
    selectedClient,
    selectedGstin,
    selectedFy,
    selectedPeriod,
    isFirmWideView,
    openCommandPalette,
  } = useClientContext();

  const activeGstin = useMemo(() => {
    if (isFirmWideView || !selectedClient) return "";
    return selectedGstin || selectedClient.gstin || selectedClient.gstinRecords?.[0]?.gstin || "";
  }, [isFirmWideView, selectedClient, selectedGstin]);

  const currentActor = useMemo(() => {
    const s = getActiveSession();
    return {
      name: s?.name || "Practice Partner",
      firmName: s?.firmName || "Chartered Accountants",
      frn: s?.firmFrn || "",
    };
  }, []);

  const [activeTab, setActiveTab] = useState<
    "GSTR9_9C" | "EINVOICE_EWB" | "MULTI_GSTIN_ISD" | "DRC01B_01C"
  >("GSTR9_9C");
  const [isSaving, setIsSaving] = useState(false);
  const [isCompilingAnnual, setIsCompilingAnnual] = useState(false);
  const [isScanning88, setIsScanning88] = useState(false);
  const [compiledAnnual, setCompiledAnnual] = useState<Gstr9CompiledData | null>(null);
  const [booksItcLedger, setBooksItcLedger] = useState(0);

  // TAB 1: GSTR-9 Table 8A-8F & GSTR-9C Table 5 & DRC-03 Editable State
  const [t8aGstr2b, setT8aGstr2b] = useState(0);
  const [t8b6bAnd6h, setT8b6bAnd6h] = useState(0);
  const [t8cNextFy, setT8cNextFy] = useState(0);
  const [t8eNotAvailed, setT8eNotAvailed] = useState(0);
  const [t8fIneligible17_5, setT8fIneligible17_5] = useState(0);

  const [pnlTurnover, setPnlTurnover] = useState(0);
  const [unbilledOpen, setUnbilledOpen] = useState(0);
  const [unbilledClose, setUnbilledClose] = useState(0);
  const [advancesTaxable, setAdvancesTaxable] = useState(0);
  const [tradeDiscounts, setTradeDiscounts] = useState(0);
  const [exemptSupplies, setExemptSupplies] = useState(0);
  const [gstr9Turnover, setGstr9Turnover] = useState(0);

  const [drcIgst, setDrcIgst] = useState(0);
  const [drcCgst, setDrcCgst] = useState(0);
  const [drcSgst, setDrcSgst] = useState(0);
  const [drcCess, setDrcCess] = useState(0);
  const [drcDaysDelay, setDrcDaysDelay] = useState(0);
  const [drcCause, setDrcCause] = useState<"GSTR_9_RECONCILIATION" | "SECTION_73_5_VOLUNTARY" | "RULE_88C_DISCREPANCY" | "RULE_88D_DISCREPANCY">("GSTR_9_RECONCILIATION");
  const [drcPaymentMode, setDrcPaymentMode] = useState<"CASH_LEDGER" | "CREDIT_LEDGER">("CASH_LEDGER");

  // TAB 2: E-Invoice & E-Way Bill State
  const [eInvoices, setEInvoices] = useState<EInvoiceRecord[]>([]);
  const [newIrnInput, setNewIrnInput] = useState("");
  const [newEwbInvNo, setNewEwbInvNo] = useState("");
  const [newEwbNo, setNewEwbNo] = useState("");
  const [newEwbVeh, setNewEwbVeh] = useState("");
  const [newEwbDist, setNewEwbDist] = useState("");

  // TAB 3: Multi-GSTIN & ISD State
  const [branchTurnovers, setBranchTurnovers] = useState<Record<string, number>>({});
  const [isdSourceGstin, setIsdSourceGstin] = useState("");
  const [isdPoolIgst, setIsdPoolIgst] = useState(0);
  const [isdPoolCgst, setIsdPoolCgst] = useState(0);
  const [isdPoolSgst, setIsdPoolSgst] = useState(0);

  // TAB 4: DRC-01B / DRC-01C Notices
  const [drcNotices, setDrcNotices] = useState<DrcIntimationNotice[]>([]);
  const [selectedNoticeArn, setSelectedNoticeArn] = useState<string>("");
  const [replyDraft, setReplyDraft] = useState<string | null>(null);
  const [showAddDrc, setShowAddDrc] = useState(false);
  const [newDrcArn, setNewDrcArn] = useState("");
  const [newDrcType, setNewDrcType] = useState<"DRC_01B_RULE_88C" | "DRC_01C_RULE_88D">("DRC_01B_RULE_88C");
  const [newDrcPeriod, setNewDrcPeriod] = useState("");
  const [newDrcDate, setNewDrcDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDrcFig1, setNewDrcFig1] = useState("");
  const [newDrcFig2, setNewDrcFig2] = useState("");

  // Derived Computations
  const reco8a = useMemo(
    () =>
      Gstr9AnnualRecoEngine.reconcileTable8A({
        financialYear: `FY ${selectedFy}`,
        table8aGstr2bItc: t8aGstr2b,
        table6bAnd6hItc3b: t8b6bAnd6h,
        table8cItcClaimedNextFy: t8cNextFy,
        table8eAvailableNotAvailed: t8eNotAvailed,
        table8fIneligible17_5: t8fIneligible17_5,
      }),
    [selectedFy, t8aGstr2b, t8b6bAnd6h, t8cNextFy, t8eNotAvailed, t8fIneligible17_5]
  );

  const recoTurnover = useMemo(
    () =>
      Gstr9AnnualRecoEngine.reconcileGstr9cTurnover({
        financialYear: `FY ${selectedFy}`,
        auditedTurnoverPnl: pnlTurnover,
        unbilledRevenueOpening: unbilledOpen,
        unbilledRevenueClosing: unbilledClose,
        advancesReceivedTaxable: advancesTaxable,
        tradeDiscountsCreditNotes: tradeDiscounts,
        exemptSuppliesNilRated: exemptSupplies,
        annualTurnoverGstr9: gstr9Turnover,
      }),
    [selectedFy, pnlTurnover, unbilledOpen, unbilledClose, advancesTaxable, tradeDiscounts, exemptSupplies, gstr9Turnover]
  );

  const drc03Challan = useMemo(
    () =>
      Gstr9AnnualRecoEngine.generateDrc03Challan({
        financialYear: `FY ${selectedFy}`,
        taxPeriod: selectedPeriod || `FY ${selectedFy}`,
        cause: drcCause,
        igst: drcIgst,
        cgst: drcCgst,
        sgst: drcSgst,
        cess: drcCess,
        daysDelay: drcDaysDelay,
        paymentMode: drcPaymentMode,
      }),
    [selectedFy, selectedPeriod, drcCause, drcIgst, drcCgst, drcSgst, drcCess, drcDaysDelay, drcPaymentMode]
  );

  // Derive Multi-GSTIN profiles from selectedClient
  const gstinProfiles = useMemo<StateGstinProfile[]>(() => {
    if (!selectedClient || isFirmWideView) return [];
    const recs =
      selectedClient.gstinRecords && selectedClient.gstinRecords.length > 0
        ? selectedClient.gstinRecords
        : selectedClient.gstin
        ? [
            {
              gstin: selectedClient.gstin,
              stateCode: selectedClient.gstin.substring(0, 2),
              stateName: GST_STATE_CODES[selectedClient.gstin.substring(0, 2)] || "India",
              tradeName: selectedClient.tradeName || selectedClient.name,
              registrationType: "REGULAR" as const,
              filingFrequency: "MONTHLY" as const,
              status: "ACTIVE" as const,
            },
          ]
        : [];

    const totalT = recs.reduce(
      (sum, g) => sum + (branchTurnovers[g.gstin] ?? ((selectedClient.turnoverCr * 10000000) / Math.max(1, recs.length))),
      0
    );

    return recs.map((g) => {
      const turn = branchTurnovers[g.gstin] ?? Math.round((selectedClient.turnoverCr * 10000000) / Math.max(1, recs.length));
      return {
        gstin: g.gstin,
        stateName: g.stateName || GST_STATE_CODES[g.stateCode] || "India",
        stateCode: g.stateCode || g.gstin.substring(0, 2),
        tradeName: g.tradeName || selectedClient.name,
        turnoverRatioPercent: totalT > 0 ? Number(((turn / totalT) * 100).toFixed(2)) : 0,
        annualTurnoverInr: turn,
        gstr1Status: "PENDING",
        gstr3bStatus: "PENDING",
        isdCreditAllocated: 0,
      };
    });
  }, [selectedClient, isFirmWideView, branchTurnovers]);

  const effectiveIsdGstin = isdSourceGstin || gstinProfiles[0]?.gstin || activeGstin;
  const isdCycle = useMemo(
    () =>
      MultiGstinIsdEngine.distributeIsdCredit(
        gstinProfiles,
        { igst: isdPoolIgst, cgst: isdPoolCgst, sgst: isdPoolSgst },
        selectedPeriod || `FY ${selectedFy}`,
        effectiveIsdGstin
      ),
    [gstinProfiles, isdPoolIgst, isdPoolCgst, isdPoolSgst, selectedPeriod, selectedFy, effectiveIsdGstin]
  );

  const selectedNotice = useMemo(
    () => drcNotices.find((n) => n.arn === selectedNoticeArn) || drcNotices[0] || null,
    [drcNotices, selectedNoticeArn]
  );

  // Load persisted Annual Audit state
  const loadAnnualAudit = useCallback(async () => {
    if (!activeGstin) {
      setEInvoices([]);
      setDrcNotices([]);
      return;
    }
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/annual-audit?clientGstin=${encodeURIComponent(activeGstin)}&fy=${encodeURIComponent(selectedFy)}`
      );
      if (ok && data?.found && data?.data) {
        const d = data.data;
        if (d.gstr9) {
          setT8aGstr2b(Number(d.gstr9.t8aGstr2b || 0));
          setT8b6bAnd6h(Number(d.gstr9.t8b6bAnd6h || 0));
          setT8cNextFy(Number(d.gstr9.t8cNextFy || 0));
          setT8eNotAvailed(Number(d.gstr9.t8eNotAvailed || 0));
          setT8fIneligible17_5(Number(d.gstr9.t8fIneligible17_5 || 0));
          if (d.gstr9.compiledAnnual) setCompiledAnnual(d.gstr9.compiledAnnual);
          if (typeof d.gstr9.booksItcLedger === "number") setBooksItcLedger(d.gstr9.booksItcLedger);
        }
        if (d.gstr9c) {
          setPnlTurnover(Number(d.gstr9c.pnlTurnover || 0));
          setUnbilledOpen(Number(d.gstr9c.unbilledOpen || 0));
          setUnbilledClose(Number(d.gstr9c.unbilledClose || 0));
          setAdvancesTaxable(Number(d.gstr9c.advancesTaxable || 0));
          setTradeDiscounts(Number(d.gstr9c.tradeDiscounts || 0));
          setExemptSupplies(Number(d.gstr9c.exemptSupplies || 0));
          setGstr9Turnover(Number(d.gstr9c.gstr9Turnover || 0));
        }
        if (d.drc03) {
          setDrcIgst(Number(d.drc03.igst || 0));
          setDrcCgst(Number(d.drc03.cgst || 0));
          setDrcSgst(Number(d.drc03.sgst || 0));
          setDrcCess(Number(d.drc03.cess || 0));
          setDrcDaysDelay(Number(d.drc03.daysDelay || 0));
          if (d.drc03.cause) setDrcCause(d.drc03.cause);
          if (d.drc03.paymentMode) setDrcPaymentMode(d.drc03.paymentMode);
        }
        setEInvoices(Array.isArray(d.eInvoices) ? d.eInvoices : []);
        if (d.isd) {
          setBranchTurnovers(d.isd.branchTurnovers || {});
          setIsdSourceGstin(d.isd.isdSourceGstin || "");
          setIsdPoolIgst(Number(d.isd.isdPoolIgst || 0));
          setIsdPoolCgst(Number(d.isd.isdPoolCgst || 0));
          setIsdPoolSgst(Number(d.isd.isdPoolSgst || 0));
        }
        const loadedNotices: DrcIntimationNotice[] = Array.isArray(d.drcNotices) ? d.drcNotices : [];
        setDrcNotices(
          loadedNotices.map((n) => ({
            ...n,
            daysRemaining: Drc01b01cEngine.evaluateNoticeUrgency(n).daysRemaining,
          }))
        );
        if (loadedNotices[0]) setSelectedNoticeArn(loadedNotices[0].arn);
      } else {
        setT8aGstr2b(0);
        setT8b6bAnd6h(0);
        setT8cNextFy(0);
        setT8eNotAvailed(0);
        setT8fIneligible17_5(0);
        setPnlTurnover(Math.round((selectedClient?.turnoverCr || 0) * 10000000));
        setGstr9Turnover(Math.round((selectedClient?.turnoverCr || 0) * 10000000));
        setEInvoices([]);
        setDrcNotices([]);
      }
    } catch {
      // ignore
    }
  }, [activeGstin, selectedFy, selectedClient?.turnoverCr]);

  useEffect(() => {
    loadAnnualAudit();
  }, [loadAnnualAudit]);

  const handleSaveAllWorkpapers = async (overrides?: {
    eInvoices?: EInvoiceRecord[];
    drcNotices?: DrcIntimationNotice[];
  }) => {
    if (!activeGstin) {
      toast.error("Select GSTIN", "Select a client & GSTIN before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const { ok, data } = await gstFetchJson<any>("/api/gst/annual-audit", {
        method: "POST",
        body: JSON.stringify({
          clientGstin: activeGstin,
          fy: selectedFy,
          gstr9: { t8aGstr2b, t8b6bAnd6h, t8cNextFy, t8eNotAvailed, t8fIneligible17_5, compiledAnnual, booksItcLedger },
          gstr9c: { pnlTurnover, unbilledOpen, unbilledClose, advancesTaxable, tradeDiscounts, exemptSupplies, gstr9Turnover },
          drc03: { igst: drcIgst, cgst: drcCgst, sgst: drcSgst, cess: drcCess, daysDelay: drcDaysDelay, cause: drcCause, paymentMode: drcPaymentMode },
          eInvoices: overrides?.eInvoices ?? eInvoices,
          isd: { branchTurnovers, isdSourceGstin: effectiveIsdGstin, isdPoolIgst, isdPoolCgst, isdPoolSgst },
          drcNotices: overrides?.drcNotices ?? drcNotices,
        }),
      });
      if (ok && data?.success) {
        toast.success("Annual Workpaper Saved", `Saved for ${activeGstin} (FY ${selectedFy}).`);
      } else {
        toast.error("Save Failed", data?.error || "Could not save Annual Audit record.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoCompileAnnual = async () => {
    if (!activeGstin) return;
    setIsCompilingAnnual(true);
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/annual-audit?action=compile&clientGstin=${encodeURIComponent(activeGstin)}&fy=${encodeURIComponent(selectedFy)}`
      );
      if (!ok || !data?.success || !data.compiled) {
        toast.error("Compile Failed", data?.error || "Could not compile 12-month data.");
        return;
      }
      const c = data.compiled as Gstr9CompiledData;
      setCompiledAnnual(c);
      setT8aGstr2b(c.table8aGstr2bItc);
      setT8b6bAnd6h(c.table6bInputsItc);
      setT8fIneligible17_5(c.table7ReversalsSec17_5);
      setGstr9Turnover(c.outwardTaxableSupplies);
      setExemptSupplies(c.outwardExemptNil);
      toast.success(
        "12-Month GSTR-9 Compiled",
        `Aggregated ${c.monthsCompiled} active period(s) across GSTR-1, 2B Reco, Rule 42/43 & 3B.`
      );
    } finally {
      setIsCompilingAnnual(false);
    }
  };

  const handleScanRule88Variances = async () => {
    if (!activeGstin) return;
    setIsScanning88(true);
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/annual-audit?action=compile&clientGstin=${encodeURIComponent(activeGstin)}&fy=${encodeURIComponent(selectedFy)}`
      );
      if (!ok || !data?.success) {
        toast.error("Scan Failed", data?.error || "Could not scan FY returns.");
        return;
      }
      const detected: DrcIntimationNotice[] = Array.isArray(data.detected88C_88D) ? data.detected88C_88D : [];
      if (detected.length === 0) {
        toast.success("Zero Rule 88C / 88D Variances", "All saved GSTR-1, 2B and 3B periods are within tolerance.");
        return;
      }
      const existingArns = new Set(drcNotices.map((n) => n.arn));
      const newOnes = detected.filter((n) => !existingArns.has(n.arn));
      const merged = [...newOnes, ...drcNotices];
      setDrcNotices(merged);
      if (merged[0]) setSelectedNoticeArn(merged[0].arn);
      await handleSaveAllWorkpapers({ drcNotices: merged });
      toast.warning("Pre-Notice Variances Detected", `Added ${newOnes.length} Rule 88C/88D variance alert(s) to docket.`);
    } finally {
      setIsScanning88(false);
    }
  };

  const handleExportAnnualExcel = () => {
    if (!activeGstin) return;
    const netItcGstr9 = Math.max(
      0,
      t8b6bAnd6h - ((compiledAnnual?.table7ReversalsRule42_43 || 0) + t8fIneligible17_5)
    );
    const itcDiff = Math.round((booksItcLedger - netItcGstr9) * 100) / 100;

    downloadWorkbookXlsx(`GSTR9_9C_Annual_Pack_${activeGstin}_${selectedFy}.xlsx`, [
      {
        name: "GSTR9_Tables_4_to_9",
        rows: [
          { Table: "4A-4G", Description: "Taxable Outward Supplies", Amount: compiledAnnual?.outwardTaxableSupplies ?? gstr9Turnover },
          { Table: "4H/6", Description: "Zero Rated Exports", Amount: compiledAnnual?.outwardZeroRatedExports ?? 0 },
          { Table: "5", Description: "Exempt / Nil / Non-GST", Amount: compiledAnnual?.outwardExemptNil ?? exemptSupplies },
          { Table: "6B", Description: "ITC Availed in GSTR-3B", Amount: t8b6bAnd6h },
          { Table: "7A-7E", Description: "Rule 42/43 Reversals", Amount: compiledAnnual?.table7ReversalsRule42_43 ?? 0 },
          { Table: "7H", Description: "Sec 17(5) Blocked Reversals", Amount: t8fIneligible17_5 },
          { Table: "8A", Description: "ITC as per GSTR-2B (Auto-populated)", Amount: t8aGstr2b },
          { Table: "8D", Description: "Table 8 Difference (8A - 8B - 8C)", Amount: reco8a.table8dVariance },
          { Table: "9 (Cash)", Description: "Tax Paid in Cash", Amount: compiledAnnual?.table9TaxPaidCash ?? 0 },
          { Table: "9 (ITC)", Description: "Tax Paid through ITC", Amount: compiledAnnual?.table9TaxPaidItc ?? 0 },
        ],
      },
      {
        name: "GSTR9C_Table5_Turnover",
        rows: [
          { Field: "5A Audited Financials Turnover", Value: pnlTurnover },
          { Field: "5B Add Unbilled Revenue (Opening)", Value: unbilledOpen },
          { Field: "5H Less Unbilled Revenue (Closing)", Value: unbilledClose },
          { Field: "5I Add Taxable Advances", Value: advancesTaxable },
          { Field: "5J Less Trade Discounts / CNs", Value: tradeDiscounts },
          { Field: "5P Adjusted Audited Turnover", Value: recoTurnover.adjustedTurnover },
          { Field: "5Q Turnover Declared in GSTR-9", Value: gstr9Turnover },
          { Field: "5R Unreconciled Turnover Variance", Value: recoTurnover.unreconciledTurnoverVariance },
        ],
      },
      {
        name: "GSTR9C_Table9_RateWise",
        rows:
          compiledAnnual?.rateWiseTable9C.map((r) => ({
            TaxRate: r.rateLabel,
            TaxableValue: r.taxableValue,
            IGST: r.igst,
            CGST: r.cgst,
            SGST: r.sgst,
            Cess: r.cess,
          })) || [],
      },
      {
        name: "GSTR9C_Table12_14_ITC",
        rows: [
          { Line: "12A ITC Availed per Audited Financials (Books)", Value: booksItcLedger },
          { Line: "12E Net ITC Claimed in GSTR-9 (Table 6 - Table 7)", Value: netItcGstr9 },
          { Line: "12F Unreconciled ITC Difference (Books - GSTR-9)", Value: itcDiff },
        ],
      },
      {
        name: "DRC03_Summary",
        rows: [
          {
            Cause: drcCause,
            Mode: drcPaymentMode,
            IGST: drcIgst,
            CGST: drcCgst,
            SGST: drcSgst,
            Cess: drcCess,
            DelayDays: drcDaysDelay,
            InterestSec50: drc03Challan.interestSec50,
            TotalChallan: drc03Challan.totalPaymentAmount,
          },
        ],
      },
    ]);
    toast.success("Annual Pack Downloaded", "Multi-sheet GSTR-9, 9C & DRC-03 Excel workbook generated.");
  };

  const handleExportDrc03Json = () => {
    if (!activeGstin) return;
    const fyParts = selectedFy.split("-");
    const payload = {
      gstin: activeGstin,
      legalName: selectedClient?.name || "",
      tradeName: selectedClient?.tradeName || selectedClient?.name || "",
      financialYear: selectedFy,
      formType: "FORM_GST_DRC_03",
      causeOfPayment: drcCause,
      paymentSection: "73(5)",
      paymentMode: drcPaymentMode,
      statutoryTaxPeriod: {
        from: `01-04-${fyParts[0] || "2025"}`,
        to: `31-03-20${fyParts[1] || "26"}`,
      },
      taxLiabilityBreakup: {
        igst: drc03Challan.igstLiability,
        cgst: drc03Challan.cgstLiability,
        sgst: drc03Challan.sgstLiability,
        cess: drc03Challan.cessLiability,
        totalTax: drc03Challan.totalTaxLiability,
      },
      interestBreakup: {
        section: "50(1)",
        daysDelay: drc03Challan.daysDelay,
        ratePercentage: 18.0,
        interestAmount: drc03Challan.interestSec50,
      },
      totalChallanAmount: drc03Challan.totalPaymentAmount,
      preparedBy: {
        user: currentActor.name,
        firm: currentActor.firmName,
        ...(currentActor.frn ? { frn: currentActor.frn } : {}),
        timestamp: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GST_DRC03_${activeGstin}_FY_${selectedFy}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("DRC-03 JSON Exported", `Downloaded GST_DRC03_${activeGstin}_FY_${selectedFy}.json`);
  };

  const handleImportEInvoiceFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = EInvoiceEwbEngine.parseEInvoiceCsvOrJson(text);
      if (parsed.length === 0) {
        toast.error("No Records Found", "Could not extract E-Invoice / EWB records from file.");
        return;
      }
      setEInvoices(parsed);
      await handleSaveAllWorkpapers({ eInvoices: parsed });
      toast.success("E-Invoices Imported", `Loaded ${parsed.length} IRN / EWB records.`);
    } catch (err: any) {
      toast.error("Import Failed", err?.message || "Invalid E-Invoice file.");
    }
  };

  const handleExtendEwb = async (invNum: string) => {
    const next = eInvoices.map((inv) =>
      inv.invoiceNumber === invNum
        ? {
            ...inv,
            ewbStatus: "EXTENDED" as const,
            hoursRemaining: (inv.hoursRemaining || 0) + 24,
            isExtensionAlertActive: false,
          }
        : inv
    );
    setEInvoices(next);
    await handleSaveAllWorkpapers({ eInvoices: next });
    toast.success("E-Way Bill Extended", `Extended ${invNum} Part-B validity by 24 hours under Rule 138(10).`);
  };

  const handleAddEInvoiceManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEwbInvNo.trim()) return;
    const validIrn = EInvoiceEwbEngine.validateIrnStructure(newIrnInput);
    const dist = parseFloat(newEwbDist) || 0;
    const rec: EInvoiceRecord = {
      invoiceNumber: newEwbInvNo.trim(),
      invoiceDate: new Date().toISOString().split("T")[0],
      supplierGstin: activeGstin,
      recipientGstin: "",
      taxableValue: 0,
      totalTax: 0,
      totalInvoiceValue: 0,
      irn: newIrnInput.trim(),
      irnStatus: newIrnInput ? (validIrn ? "VALID_ACTIVE" : "HASH_INVALID") : "HASH_INVALID",
      signedQrVerified: validIrn,
      ackNumber: "",
      ackDate: new Date().toISOString().split("T")[0],
      eWayBillNumber: newEwbNo.trim() || undefined,
      ewbStatus: "ACTIVE",
      distanceKm: dist,
      cargoType: "NORMAL",
      vehicleNumber: newEwbVeh.trim().toUpperCase() || undefined,
      isExtensionAlertActive: false,
    };
    const next = [rec, ...eInvoices];
    setEInvoices(next);
    await handleSaveAllWorkpapers({ eInvoices: next });
    setNewIrnInput("");
    setNewEwbInvNo("");
    setNewEwbNo("");
    setNewEwbVeh("");
    setNewEwbDist("");
  };

  const handleAddDrcNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrcArn.trim() || !activeGstin) return;
    const f1 = parseFloat(newDrcFig1) || 0;
    const f2 = parseFloat(newDrcFig2) || 0;
    const varAmt = Math.round(Math.abs(f1 - f2) * 100) / 100;
    const varPct = f1 > 0 ? Number(((varAmt / f1) * 100).toFixed(1)) : 0;
    const dt = new Date(newDrcDate || new Date().toISOString().split("T")[0]);
    const deadline = new Date(dt.getTime() + 7 * 86400000).toISOString().split("T")[0];

    const notice: DrcIntimationNotice = {
      arn: newDrcArn.trim().toUpperCase(),
      intimationType: newDrcType,
      financialYear: `FY ${selectedFy}`,
      taxPeriod: newDrcPeriod.trim() || selectedPeriod || "Current Period",
      gstin: activeGstin,
      taxpayerName: selectedClient?.name || activeGstin,
      dateOfIntimation: dt.toISOString().split("T")[0],
      statutoryDeadlineDate: deadline,
      daysRemaining: Drc01b01cEngine.evaluateNoticeUrgency({ statutoryDeadlineDate: deadline, status: "PENDING_REPLY" } as any).daysRemaining,
      portalFigure1: f1,
      portalFigure2: f2,
      varianceAmount: varAmt,
      variancePercentage: varPct,
      status: "PENDING_REPLY",
      selectedReasonCode: newDrcType === "DRC_01B_RULE_88C" ? "B_01" : "C_01",
      factualExplanation: "",
      attachedSupportingDocs: [],
    };
    const next = [notice, ...drcNotices];
    setDrcNotices(next);
    setSelectedNoticeArn(notice.arn);
    await handleSaveAllWorkpapers({ drcNotices: next });
    setShowAddDrc(false);
    setNewDrcArn("");
    setNewDrcFig1("");
    setNewDrcFig2("");
  };

  const handleUpdateNoticeField = (arn: string, patch: Partial<DrcIntimationNotice>) => {
    setDrcNotices((prev) => prev.map((n) => (n.arn === arn ? { ...n, ...patch } : n)));
  };

  const handleDraftReply = (notice: DrcIntimationNotice) => {
    const draft = Drc01b01cEngine.draftPartBReply(
      notice,
      notice.selectedReasonCode,
      notice.factualExplanation
    );
    setReplyDraft(draft.formalLegalSubmission);
    toast.success("Part B Draft Generated");
  };

  const turnoverCr = selectedClient?.turnoverCr || 0;
  const gstr9Applicability =
    turnoverCr > 5
      ? "GSTR-9 + GSTR-9C Mandatory (> ₹5 Cr)"
      : turnoverCr > 2
      ? "GSTR-9 Mandatory; 9C Exempt (₹2–5 Cr)"
      : "GSTR-9 Optional (≤ ₹2 Cr)";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                GSTR-9 &bull; GSTR-9C &bull; DRC-03 &bull; E-Invoice &bull; ISD &bull; Rule 88C/88D
              </span>
              {selectedClient && !isFirmWideView && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  {gstr9Applicability}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              GST Annual Audit, E-Invoicing, ISD &amp; DRC Notices
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <UniversalClientSelector variant="full" />

            {activeGstin && (
              <>
                <button
                  onClick={handleAutoCompileAnnual}
                  disabled={isCompilingAnnual}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-semibold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCompilingAnnual ? "animate-spin" : ""}`} />
                  <span>{isCompilingAnnual ? "Compiling 12M..." : "Auto-Compile 12M"}</span>
                </button>
                <button
                  onClick={handleExportAnnualExcel}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>9/9C .xlsx</span>
                </button>
                <button
                  onClick={() => handleSaveAllWorkpapers()}
                  disabled={isSaving}
                  className="px-3 py-2 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Workpaper"}</span>
                </button>
                <button
                  onClick={handleExportDrc03Json}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export DRC-03 JSON</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {!activeGstin ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Select a Client &amp; GSTIN</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            GSTR-9/9C annual reconciliations, E-Invoice registers, ISD distributions, and DRC-01B/01C replies are stored per GSTIN and Financial Year.
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
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {[
              { id: "GSTR9_9C", label: "GSTR-9 & 9C / DRC-03", icon: FileSpreadsheet },
              { id: "EINVOICE_EWB", label: `E-Invoice & EWB (${eInvoices.length})`, icon: Truck },
              { id: "MULTI_GSTIN_ISD", label: `Multi-GSTIN & ISD (${gstinProfiles.length})`, icon: Building2 },
              { id: "DRC01B_01C", label: `Rule 88C/88D Notices (${drcNotices.length})`, icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                    activeTab === tab.id
                      ? "bg-red-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: GSTR-9 & 9C & DRC-03 */}
          {activeTab === "GSTR9_9C" && (
            <div className="space-y-6">
              {compiledAnnual && (
                <div className="bg-white border border-indigo-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        12-Month Auto-Compiled GSTR-9 &amp; 9C Workpaper (Tables 4, 5, 6, 7, 8A &amp; 9)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Aggregated from {compiledAnnual.monthsCompiled} saved month(s) across GSTR-1, 2B Matcher, Rule 42/43 &amp; 3B Filings.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                      FY {selectedFy}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Table 4 Taxable</span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatCurrencyINR(compiledAnnual.outwardTaxableSupplies)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Table 4/5 Exports &amp; Nil</span>
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatCurrencyINR(compiledAnnual.outwardZeroRatedExports + compiledAnnual.outwardExemptNil)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Table 7 Reversals</span>
                      <span className="font-mono font-bold text-sm text-amber-700">
                        {formatCurrencyINR(compiledAnnual.table7ReversalsRule42_43 + compiledAnnual.table7ReversalsSec17_5)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Table 9 Paid (Cash / ITC)</span>
                      <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                        Cash: {formatCurrencyINR(compiledAnnual.table9TaxPaidCash)}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700">
                        ITC: {formatCurrencyINR(compiledAnnual.table9TaxPaidItc)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                        9C Table 12 Books ITC (₹)
                      </span>
                      <input
                        type="number"
                        value={booksItcLedger}
                        onChange={(e) => setBooksItcLedger(parseFloat(e.target.value) || 0)}
                        placeholder="Books ITC ₹"
                        className="w-full rounded border border-emerald-300 bg-white px-2 py-1 font-mono text-xs font-bold text-slate-900"
                      />
                      <span className="text-[10px] font-mono font-bold text-emerald-900 mt-1 block">
                        Diff (12F): {formatCurrencyINR(booksItcLedger - Math.max(0, t8b6bAnd6h - (compiledAnnual.table7ReversalsRule42_43 + t8fIneligible17_5)))}
                      </span>
                    </div>
                  </div>

                  {compiledAnnual.rateWiseTable9C.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
                        <thead className="bg-slate-50 text-slate-600 text-[10px]">
                          <tr>
                            <th className="p-2.5">9C Table 9 Rate Slab</th>
                            <th className="p-2.5 text-right">Taxable Value</th>
                            <th className="p-2.5 text-right">IGST</th>
                            <th className="p-2.5 text-right">CGST</th>
                            <th className="p-2.5 text-right">SGST</th>
                            <th className="p-2.5 text-right">Cess</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {compiledAnnual.rateWiseTable9C.map((row) => (
                            <tr key={row.rateLabel}>
                              <td className="p-2.5 font-bold">{row.rateLabel}</td>
                              <td className="p-2.5 text-right">{formatCurrencyINR(row.taxableValue)}</td>
                              <td className="p-2.5 text-right">{formatCurrencyINR(row.igst)}</td>
                              <td className="p-2.5 text-right">{formatCurrencyINR(row.cgst)}</td>
                              <td className="p-2.5 text-right">{formatCurrencyINR(row.sgst)}</td>
                              <td className="p-2.5 text-right">{formatCurrencyINR(row.cess)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table 8A-8F */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <h3 className="text-sm font-bold text-slate-900">
                      GSTR-9 Table 8A–8F ITC Reconciliation
                    </h3>
                    <span className="text-xs font-mono font-bold text-red-600">FY {selectedFy}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { label: "Table 8A: ITC as per GSTR-2B (₹)", val: t8aGstr2b, set: setT8aGstr2b },
                      { label: "Table 8B: ITC per 6(B) + 6(H) in 3B (₹)", val: t8b6bAnd6h, set: setT8b6bAnd6h },
                      { label: "Table 8C: ITC availed Apr–Nov Next FY (₹)", val: t8cNextFy, set: setT8cNextFy },
                      { label: "Table 8E: Available but Not Availed (₹)", val: t8eNotAvailed, set: setT8eNotAvailed },
                      { label: "Table 8F: Available but Ineligible 17(5) (₹)", val: t8fIneligible17_5, set: setT8fIneligible17_5 },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">{f.label}</label>
                        <input
                          type="number"
                          value={f.val}
                          onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm font-mono font-bold">
                    <span>Table 8D = 8A - (8B + 8C):</span>
                    <span className={reco8a.table8dVariance < 0 ? "text-red-600" : "text-emerald-700"}>
                      {formatCurrencyINR(reco8a.table8dVariance)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong>Auditor Note:</strong> {reco8a.suggestedAction}
                  </div>
                </div>

                {/* GSTR-9C Table 5 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <h3 className="text-sm font-bold text-slate-900">
                      GSTR-9C Table 5: Audited Financials vs GSTR-9
                    </h3>
                    <span className="text-xs font-mono font-bold text-red-600">Exact ₹</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { label: "Turnover as per Audited Financials (₹)", val: pnlTurnover, set: setPnlTurnover },
                      { label: "Add: Unbilled Revenue Opening (₹)", val: unbilledOpen, set: setUnbilledOpen },
                      { label: "Less: Unbilled Revenue Closing (₹)", val: unbilledClose, set: setUnbilledClose },
                      { label: "Add: Taxable Advances Closing (₹)", val: advancesTaxable, set: setAdvancesTaxable },
                      { label: "Less: Trade Discounts / CNs u/s 15(3) (₹)", val: tradeDiscounts, set: setTradeDiscounts },
                      { label: "Turnover Declared in GSTR-9 (₹)", val: gstr9Turnover, set: setGstr9Turnover },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">{f.label}</label>
                        <input
                          type="number"
                          value={f.val}
                          onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span>Adjusted Audited Turnover (5P):</span>
                      <strong>{formatCurrencyINR(recoTurnover.adjustedTurnover)}</strong>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Unreconciled Variance (5R):</span>
                      <span className={Math.abs(recoTurnover.unreconciledTurnoverVariance) > 5 ? "text-red-600" : "text-emerald-700"}>
                        {formatCurrencyINR(recoTurnover.unreconciledTurnoverVariance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form GST DRC-03 Calculator */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Form GST DRC-03 Voluntary Payment Workpaper (Sec 73(5) &amp; Rule 88B)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Interest computed @ 18% p.a. on exact delay days.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={drcCause}
                      onChange={(e) => setDrcCause(e.target.value as any)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold"
                    >
                      <option value="GSTR_9_RECONCILIATION">Annual Return (GSTR-9/9C)</option>
                      <option value="SECTION_73_5_VOLUNTARY">Voluntary u/s 73(5)</option>
                      <option value="RULE_88C_DISCREPANCY">Rule 88C (DRC-01B)</option>
                      <option value="RULE_88D_DISCREPANCY">Rule 88D (DRC-01C)</option>
                    </select>
                    <select
                      value={drcPaymentMode}
                      onChange={(e) => setDrcPaymentMode(e.target.value as any)}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold"
                    >
                      <option value="CASH_LEDGER">Electronic Cash Ledger</option>
                      <option value="CREDIT_LEDGER">Electronic Credit Ledger</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs font-mono">
                  {[
                    { label: "IGST (₹)", val: drcIgst, set: setDrcIgst },
                    { label: "CGST (₹)", val: drcCgst, set: setDrcCgst },
                    { label: "SGST (₹)", val: drcSgst, set: setDrcSgst },
                    { label: "Cess (₹)", val: drcCess, set: setDrcCess },
                    { label: "Delay (Days)", val: drcDaysDelay, set: setDrcDaysDelay },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="font-sans text-[10px] font-bold text-slate-500 block mb-1">{f.label}</label>
                      <input
                        type="number"
                        min={0}
                        value={f.val}
                        onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                      />
                    </div>
                  ))}
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                    <span className="font-sans text-[10px] font-bold text-red-700 block">Total + Sec 50 Int.</span>
                    <span className="font-bold text-red-900 text-sm block">
                      {formatCurrencyINR(drc03Challan.totalPaymentAmount)}
                    </span>
                    <span className="text-[10px] text-amber-800">Int: {formatCurrencyINR(drc03Challan.interestSec50)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: E-INVOICE & E-WAY BILL */}
          {activeTab === "EINVOICE_EWB" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    B2B E-Invoice (IRN) &amp; E-Way Bill Validity Register
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validate 64-char SHA-256 IRNs and track Rule 138(10) EWB extensions.
                  </p>
                </div>
                <label className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import E-Invoice CSV / JSON</span>
                  <input
                    type="file"
                    accept=".json,.csv,.tsv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImportEInvoiceFile(e.target.files[0])}
                  />
                </label>
              </div>

              <form
                onSubmit={handleAddEInvoiceManual}
                className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
              >
                <input
                  type="text"
                  required
                  placeholder="Invoice No"
                  value={newEwbInvNo}
                  onChange={(e) => setNewEwbInvNo(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                />
                <input
                  type="text"
                  placeholder="64-char SHA-256 IRN"
                  value={newIrnInput}
                  onChange={(e) => setNewIrnInput(e.target.value)}
                  className="sm:col-span-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                />
                <input
                  type="text"
                  placeholder="EWB No (12-digit)"
                  value={newEwbNo}
                  onChange={(e) => setNewEwbNo(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                />
                <input
                  type="text"
                  placeholder="Vehicle & KM (e.g. MP09AB1234)"
                  value={newEwbVeh}
                  onChange={(e) => setNewEwbVeh(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono uppercase"
                />
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-3 py-1.5">
                  + Add / Validate
                </button>
              </form>

              {eInvoices.length === 0 ? (
                <p className="text-xs text-slate-500 p-8 text-center bg-slate-50 rounded-xl">
                  No E-Invoice or E-Way Bill records imported for {activeGstin} (FY {selectedFy}).
                </p>
              ) : (
                <div className="space-y-2.5">
                  {eInvoices.map((inv) => (
                    <div
                      key={inv.invoiceNumber}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{inv.invoiceNumber}</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                              inv.irnStatus === "VALID_ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {inv.irnStatus === "VALID_ACTIVE" ? "IRN Verified (64-char)" : "IRN Invalid / Missing"}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">
                          IRN: {inv.irn ? `${inv.irn.slice(0, 24)}...` : "N/A"} | EWB: {inv.eWayBillNumber || "N/A"} | Veh: {inv.vehicleNumber || "N/A"} ({inv.distanceKm} km)
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {formatCurrencyINR(inv.totalInvoiceValue)}
                        </span>
                        {inv.eWayBillNumber && inv.ewbStatus !== "EXTENDED" ? (
                          <button
                            onClick={() => handleExtendEwb(inv.invoiceNumber)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5" /> Extend Part-B (24h)
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> {inv.ewbStatus || "ACTIVE"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MULTI-GSTIN & ISD */}
          {activeTab === "MULTI_GSTIN_ISD" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900">
                  PAN-Level State GSTIN Matrix — {selectedClient?.name} ({selectedClient?.pan})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gstinProfiles.map((p) => (
                    <div key={p.gstin} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{p.stateName} ({p.stateCode})</span>
                        <span className="font-mono font-bold text-red-700">{p.turnoverRatioPercent}%</span>
                      </div>
                      <p className="font-mono text-[11px] text-slate-600">{p.gstin}</p>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">State Turnover (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={p.annualTurnoverInr}
                          onChange={(e) =>
                            setBranchTurnovers((prev) => ({
                              ...prev,
                              [p.gstin]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Rule 39 Input Service Distributor (ISD) Pro-Rata Allocation
                    </h3>
                    <p className="text-xs text-slate-500">
                      CGST/SGST distributed to out-of-state branches automatically converts to IGST.
                    </p>
                  </div>
                  <select
                    value={effectiveIsdGstin}
                    onChange={(e) => setIsdSourceGstin(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                  >
                    {gstinProfiles.map((p) => (
                      <option key={p.gstin} value={p.gstin}>
                        ISD Source: {p.gstin} ({p.stateName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <label className="font-sans text-[10px] font-bold text-slate-600 block mb-1">Common Pool IGST (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={isdPoolIgst}
                      onChange={(e) => setIsdPoolIgst(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] font-bold text-slate-600 block mb-1">Common Pool CGST (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={isdPoolCgst}
                      onChange={(e) => setIsdPoolCgst(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] font-bold text-slate-600 block mb-1">Common Pool SGST (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={isdPoolSgst}
                      onChange={(e) => setIsdPoolSgst(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden font-mono">
                    <thead className="bg-slate-50 text-slate-700 text-[10px]">
                      <tr>
                        <th className="p-3">Recipient GSTIN</th>
                        <th className="p-3">State &amp; Supply Type</th>
                        <th className="p-3 text-center">Share %</th>
                        <th className="p-3 text-right">IGST (₹)</th>
                        <th className="p-3 text-right">CGST (₹)</th>
                        <th className="p-3 text-right">SGST (₹)</th>
                        <th className="p-3 text-right">Total ISD Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isdCycle.allocations.map((a) => (
                        <tr key={a.recipientGstin}>
                          <td className="p-3 font-semibold text-slate-900">{a.recipientGstin}</td>
                          <td className="p-3 font-sans">
                            {a.stateName}{" "}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {a.isInterState ? "Inter-State (→IGST)" : "Intra-State"}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-red-700">{a.turnoverSharePercent}%</td>
                          <td className="p-3 text-right">{a.allocatedIgst.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right">{a.allocatedCgst.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right">{a.allocatedSgst.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">
                            {formatCurrencyINR(a.totalAllocated)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RULE 88C (DRC-01B) & RULE 88D (DRC-01C) */}
          {activeTab === "DRC01B_01C" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={handleScanRule88Variances}
                  disabled={isScanning88}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isScanning88 ? "Scanning FY..." : "Scan FY for Rule 88C/88D Variances"}</span>
                </button>
                <button
                  onClick={() => setShowAddDrc((v) => !v)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log DRC-01B / DRC-01C Intimation
                </button>
              </div>

              {showAddDrc && (
                <form
                  onSubmit={handleAddDrcNotice}
                  className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-white p-4 rounded-xl border border-slate-200 text-xs"
                >
                  <input
                    type="text"
                    required
                    placeholder="Portal ARN"
                    value={newDrcArn}
                    onChange={(e) => setNewDrcArn(e.target.value.toUpperCase())}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                  <select
                    value={newDrcType}
                    onChange={(e) => setNewDrcType(e.target.value as any)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold"
                  >
                    <option value="DRC_01B_RULE_88C">DRC-01B (88C: 1 vs 3B)</option>
                    <option value="DRC_01C_RULE_88D">DRC-01C (88D: 2B vs 3B)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Tax Period"
                    value={newDrcPeriod}
                    onChange={(e) => setNewDrcPeriod(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                  <input
                    type="date"
                    value={newDrcDate}
                    onChange={(e) => setNewDrcDate(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                  <input
                    type="number"
                    required
                    placeholder="GSTR-1 / 2B Fig"
                    value={newDrcFig1}
                    onChange={(e) => setNewDrcFig1(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                  <input
                    type="number"
                    required
                    placeholder="GSTR-3B Fig"
                    value={newDrcFig2}
                    onChange={(e) => setNewDrcFig2(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                  <button type="submit" className="bg-red-600 text-white font-bold rounded-lg px-3 py-1.5">
                    Add Notice
                  </button>
                </form>
              )}

              {drcNotices.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
                  No Rule 88C (DRC-01B) or Rule 88D (DRC-01C) intimations logged for {activeGstin}.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Intimations (7-Day Clock)
                    </h3>
                    {drcNotices.map((notice) => (
                      <div
                        key={notice.arn}
                        onClick={() => {
                          setSelectedNoticeArn(notice.arn);
                          setReplyDraft(null);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedNotice?.arn === notice.arn
                            ? "bg-red-50 border-red-300"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 font-mono">{notice.arn}</h4>
                            <p className="text-[11px] text-slate-500">{notice.taxPeriod}</p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 font-bold">
                            {notice.status === "PENDING_REPLY" ? `${notice.daysRemaining}d Left` : notice.status}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] font-mono">
                          <span>Var: {notice.variancePercentage}%</span>
                          <strong className="text-red-600">{formatCurrencyINR(notice.varianceAmount)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedNotice && (
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 font-mono">{selectedNotice.arn}</h3>
                          <p className="text-xs text-slate-500">
                            Deadline: <strong>{selectedNotice.statutoryDeadlineDate}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedNotice.status}
                            onChange={(e) =>
                              handleUpdateNoticeField(selectedNotice.arn, { status: e.target.value as any })
                            }
                            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                          >
                            <option value="PENDING_REPLY">Pending Reply</option>
                            <option value="REPLIED_PART_B">Replied (Part B)</option>
                            <option value="PAID_DRC_03">Paid via DRC-03</option>
                          </select>
                          <button
                            onClick={() => handleDraftReply(selectedNotice)}
                            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                          >
                            Generate Part-B Reply
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="font-sans text-[10px] text-slate-500 block">
                            {selectedNotice.intimationType === "DRC_01B_RULE_88C" ? "GSTR-1 Liability" : "GSTR-2B ITC"}
                          </span>
                          <strong className="text-sm">{formatCurrencyINR(selectedNotice.portalFigure1)}</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="font-sans text-[10px] text-slate-500 block">
                            {selectedNotice.intimationType === "DRC_01B_RULE_88C" ? "GSTR-3B Paid" : "GSTR-3B Claimed"}
                          </span>
                          <strong className="text-sm">{formatCurrencyINR(selectedNotice.portalFigure2)}</strong>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Statutory Part-B Reason Code</label>
                          <select
                            value={selectedNotice.selectedReasonCode}
                            onChange={(e) =>
                              handleUpdateNoticeField(selectedNotice.arn, { selectedReasonCode: e.target.value })
                            }
                            className="w-full border border-slate-300 rounded-lg px-3 py-2"
                          >
                            {(selectedNotice.intimationType === "DRC_01B_RULE_88C"
                              ? Drc01b01cEngine.DRC_01B_REASONS
                              : Drc01b01cEngine.DRC_01C_REASONS
                            ).map((r) => (
                              <option key={r.code} value={r.code}>
                                {r.code}: {r.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Factual Reconciliation Explanation</label>
                          <textarea
                            rows={3}
                            value={selectedNotice.factualExplanation}
                            onChange={(e) =>
                              handleUpdateNoticeField(selectedNotice.arn, { factualExplanation: e.target.value })
                            }
                            placeholder="Enter invoice numbers, credit notes, or ICEGATE Bill of Entry details..."
                            className="w-full border border-slate-300 rounded-lg p-2.5"
                          />
                        </div>
                      </div>

                      {replyDraft && (
                        <div className="space-y-2 pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">Part-B Reply Preview</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(replyDraft);
                                toast.success("Copied Part-B Reply");
                              }}
                              className="text-xs text-red-600 font-bold flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {replyDraft}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
