"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  FileCheck2,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  Calculator,
  AlertCircle,
  Download,
  Send,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { ComplianceTask, ClientEntity, PortalCredential, DscRecord } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { universalEventBus } from "@/lib/mesh/universalEventBus";
import {
  gstFetchJson,
  computeRule88aSetOff,
  isValidGstArn,
  toGstnReturnPeriod,
} from "@/lib/gst/gstClientFetch";
import { Gstr1Engine } from "@/lib/gst/gstr1Engine";
import { formatCurrencyINR } from "@/lib/utils";

interface ContextualFilingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: ComplianceTask | null;
  client: ClientEntity | null;
  credentials: PortalCredential[];
  dscTokens: DscRecord[];
  allTasks?: ComplianceTask[];
  onNavigateTab?: (tabId: string) => void;
  onMarkFiled: (taskId: string, arn: string, details?: Partial<ComplianceTask>) => Promise<void>;
}

export const ContextualFilingDrawer: React.FC<ContextualFilingDrawerProps> = ({
  isOpen,
  onClose,
  task,
  client,
  credentials,
  dscTokens,
  allTasks = [],
  onNavigateTab,
  onMarkFiled,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [arnInput, setArnInput] = useState("");
  const [filingDateInput, setFilingDateInput] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCascadeCompleted, setHasCascadeCompleted] = useState(false);

  // GST 3B / Return Computation State
  const [isNilReturn, setIsNilReturn] = useState(false);
  const [outIgst, setOutIgst] = useState(0);
  const [outCgst, setOutCgst] = useState(0);
  const [outSgst, setOutSgst] = useState(0);
  const [outCess, setOutCess] = useState(0);
  const [rcmTax, setRcmTax] = useState(0);
  const [itcIgst, setItcIgst] = useState(0);
  const [itcCgst, setItcCgst] = useState(0);
  const [itcSgst, setItcSgst] = useState(0);
  const [itcCess, setItcCess] = useState(0);
  const [openCredit, setOpenCredit] = useState({ igst: 0, cgst: 0, sgst: 0, cess: 0 });
  const [itcLoadedFrom2b, setItcLoadedFrom2b] = useState(false);
  const [outwardLoadedFromGstr1, setOutwardLoadedFromGstr1] = useState(false);
  const [challanCin, setChallanCin] = useState("");
  const [interestSec50, setInterestSec50] = useState(0);
  const [isSyncingGstr1, setIsSyncingGstr1] = useState(false);

  const isGstTask = task?.category === "GST";
  const isGstr3b = Boolean(isGstTask && /3b|cmp-?08/i.test(task?.title || ""));
  const isGstr1 = Boolean(isGstTask && /gstr-?1|outward|iff/i.test(task?.title || ""));
  const [savedGstr1Data, setSavedGstr1Data] = useState<any>(null);
  const activeGstin = task?.gstin || client?.gstin || client?.gstinRecords?.[0]?.gstin || "";

  // Auto-calculate statutory late fee u/s 47 if past due date
  const autoLateFee = useMemo(() => {
    if (!isGstTask || !task?.dueDate) return 0;
    const due = new Date(task.dueDate);
    const fil = new Date(filingDateInput || new Date().toISOString().split("T")[0]);
    if (isNaN(due.getTime()) || isNaN(fil.getTime()) || fil <= due) return 0;
    const daysLate = Math.ceil((fil.getTime() - due.getTime()) / 86400000);
    const perDay = isNilReturn ? 20 : 50; // ₹10 CGST + ₹10 SGST for Nil; ₹25 + ₹25 normal
    return Math.min(isNilReturn ? 500 : 10000, daysLate * perDay);
  }, [isGstTask, task?.dueDate, filingDateInput, isNilReturn]);

  // Initialize from task & fetch saved 2B Net ITC 4(C)
  useEffect(() => {
    if (!task) return;
    setArnInput(task.arnNumber || "");
    setFilingDateInput(task.filingDate || new Date().toISOString().split("T")[0]);
    setHasCascadeCompleted(task.status === "FILED_AND_COMPLETED");
    setIsNilReturn(Boolean(task.isNilReturn));
    setOutIgst(task.outwardTaxBreakdown?.igst || 0);
    setOutCgst(task.outwardTaxBreakdown?.cgst || 0);
    setOutSgst(task.outwardTaxBreakdown?.sgst || 0);
    setOutCess(task.outwardTaxBreakdown?.cess || 0);
    setRcmTax(task.rcmTax || 0);
    setChallanCin(task.challanCin || "");
    setInterestSec50(task.section50Interest || 0);
    setItcLoadedFrom2b(false);
    setOutwardLoadedFromGstr1(false);

    // Resolve opening credit ledger from prior month's closing ledger or GSTIN Master
    const priorClosing = allTasks
      .filter(
        (t) =>
          t.id !== task.id &&
          t.entityId === client?.id &&
          t.closingCreditLedger &&
          (!t.gstin || t.gstin.toUpperCase() === activeGstin.toUpperCase())
      )
      .sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""))[0]?.closingCreditLedger;

    const masterOpen = client?.gstinRecords?.find(
      (g) => g.gstin?.toUpperCase() === activeGstin.toUpperCase()
    )?.openingCreditLedger;

    setOpenCredit(
      priorClosing || masterOpen || { igst: 0, cgst: 0, sgst: 0, cess: 0 }
    );

    if (task.itcUtilized) {
      setItcIgst(task.itcUtilized.igst || 0);
      setItcCgst(task.itcUtilized.cgst || 0);
      setItcSgst(task.itcUtilized.sgst || 0);
      setItcCess(task.itcUtilized.cess || 0);
    } else {
      setItcIgst(0);
      setItcCgst(0);
      setItcSgst(0);
      setItcCess(0);
    }

    if (isOpen && task.category === "GST" && activeGstin && task.period) {
      Promise.all([
        gstFetchJson<any>(
          `/api/gst/reconciliation?clientGstin=${encodeURIComponent(activeGstin)}&taxPeriod=${encodeURIComponent(task.period)}`
        ),
        gstFetchJson<any>(
          `/api/gst/gstr1?clientGstin=${encodeURIComponent(activeGstin)}&taxPeriod=${encodeURIComponent(task.period)}`
        ),
      ]).then(([recoRes, g1Res]) => {
        if (recoRes.ok && recoRes.data?.found && recoRes.data?.report?.summary?.netItc4C) {
          const c = recoRes.data.report.summary.netItc4C;
          setItcIgst(Math.max(0, c.igst || 0));
          setItcCgst(Math.max(0, c.cgst || 0));
          setItcSgst(Math.max(0, c.sgst || 0));
          setItcCess(Math.max(0, c.cess || 0));
          setItcLoadedFrom2b(true);
        }
        if (g1Res.ok && g1Res.data?.found) {
          setSavedGstr1Data(g1Res.data);
          if (
            g1Res.data?.summary?.totals &&
            (!task.outwardTaxBreakdown ||
              (Number(task.outwardTaxBreakdown.igst || 0) === 0 &&
                Number(task.outwardTaxBreakdown.cgst || 0) === 0 &&
                Number(task.outwardTaxBreakdown.sgst || 0) === 0 &&
                Number(task.outwardTaxBreakdown.cess || 0) === 0))
          ) {
            const t = g1Res.data.summary.totals;
            setOutIgst(Math.max(0, t.igst || 0));
            setOutCgst(Math.max(0, t.cgst || 0));
            setOutSgst(Math.max(0, t.sgst || 0));
            setOutCess(Math.max(0, t.cess || 0));
            setOutwardLoadedFromGstr1(true);
          }
        } else {
          setSavedGstr1Data(null);
        }
      });
    }
  }, [task, isOpen, activeGstin, client, allTasks]);

  const setOff = useMemo(() => {
    if (isNilReturn) {
      return computeRule88aSetOff({
        liability: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
        itc: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
      });
    }
    return computeRule88aSetOff({
      liability: { igst: outIgst, cgst: outCgst, sgst: outSgst, cess: outCess },
      itc: {
        igst: itcIgst + (openCredit.igst || 0),
        cgst: itcCgst + (openCredit.cgst || 0),
        sgst: itcSgst + (openCredit.sgst || 0),
        cess: itcCess + (openCredit.cess || 0),
      },
      rcmTax: { igst: rcmTax, cgst: 0, sgst: 0, cess: 0 },
    });
  }, [isNilReturn, outIgst, outCgst, outSgst, outCess, itcIgst, itcCgst, itcSgst, itcCess, openCredit, rcmTax]);

  const totalOutwardTax = isNilReturn ? 0 : outIgst + outCgst + outSgst + outCess + rcmTax;
  const totalCashWithInterestAndFee = Math.round(
    (setOff.totalCashPayable + (isNilReturn ? 0 : interestSec50) + autoLateFee) * 100
  ) / 100;

  if (!isOpen || !task || !client) return null;

  // Strictly match ONLY this client's credentials and DSC (never fall back to another client!)
  const portalTypeTarget = task.category === "GST" ? "GST" : "INCOME_TAX";
  const matchedCred = credentials.find(
    (c) => c.entityId === client.id && c.portalType === portalTypeTarget
  );
  const matchedDsc = dscTokens.find(
    (d) => d.entityId === client.id || (client.pan && d.pan === client.pan)
  );

  const portalLoginUrl =
    matchedCred?.loginUrl ||
    (task.category === "GST"
      ? "https://services.gst.gov.in/services/login"
      : "https://eportal.incometax.gov.in/iec/foservices/#/login");

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success("Copied", `${fieldName} copied to clipboard.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportGstr3bJson = () => {
    const fp = toGstnReturnPeriod(task.period || "");
    const payload = {
      gstin: activeGstin,
      ret_period: fp,
      sup_details: {
        osup_det: {
          txval: 0,
          iamt: isNilReturn ? 0 : outIgst,
          camt: isNilReturn ? 0 : outCgst,
          samt: isNilReturn ? 0 : outSgst,
          csamt: isNilReturn ? 0 : outCess,
        },
        isup_rev: {
          txval: 0,
          iamt: isNilReturn ? 0 : rcmTax,
          camt: 0,
          samt: 0,
          csamt: 0,
        },
      },
      itc_elg: {
        itc_net: {
          iamt: isNilReturn ? 0 : itcIgst,
          camt: isNilReturn ? 0 : itcCgst,
          samt: isNilReturn ? 0 : itcSgst,
          csamt: isNilReturn ? 0 : itcCess,
        },
      },
      intr_ltfee: {
        intr_details: { iamt: 0, camt: interestSec50 / 2, samt: interestSec50 / 2, csamt: 0 },
        ltfee_details: { iamt: 0, camt: autoLateFee / 2, samt: autoLateFee / 2, csamt: 0 },
      },
      tx_pmt: {
        tx_py: {
          igst: setOff.cashPayable.igst,
          cgst: setOff.cashPayable.cgst,
          samt: setOff.cashPayable.sgst,
          csamt: setOff.cashPayable.cess,
        },
        pdc_credit_used: setOff.itcUsed,
        closing_credit_ledger: setOff.closingItcBalance,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR3B_${activeGstin}_${fp || "period"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("GSTR-3B JSON Exported", "Official GSTN 3B summary payload downloaded.");
  };

  const handleExportGstr1Json = () => {
    if (!savedGstr1Data?.summary) {
      toast.warning(
        "GSTR-1 Not Saved",
        "Compile and save GSTR-1 in the Outward Workbench before downloading JSON."
      );
      return;
    }
    const fp = toGstnReturnPeriod(task?.period || "");
    const payload = Gstr1Engine.buildGstnGstr1Json(savedGstr1Data.summary, fp);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR1_${activeGstin}_${fp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("GSTR-1 JSON Exported", `Official GSTN GSTR-1 JSON payload downloaded (${fp}).`);
  };

  const handleSendClientApprovalWhatsApp = () => {
    const phone = (client.primaryContact?.phone || "").replace(/\D/g, "");
    const msg = [
      `Dear ${client.primaryContact?.name || client.name},`,
      `GST Return Summary for *${task.period}* (${activeGstin}):`,
      isNilReturn
        ? `• Status: NIL Return`
        : `• Gross Output Tax + RCM: ${formatCurrencyINR(totalOutwardTax)}`,
      !isNilReturn
        ? `• Net ITC Utilized (incl. Opening Ledger): ${formatCurrencyINR(
            setOff.itcUsed.igst + setOff.itcUsed.cgst + setOff.itcUsed.sgst + setOff.itcUsed.cess
          )}`
        : "",
      `• Net Cash Challan + Interest/Late Fee Payable: *${formatCurrencyINR(totalCashWithInterestAndFee)}*`,
      challanCin ? `• PMT-06 CPIN: ${challanCin}` : "",
      `Kindly approve or remit the challan amount so we can complete filing before ${task.dueDate}.`,
    ]
      .filter(Boolean)
      .join("\n");
    const waUrl = phone
      ? `https://wa.me/${phone.startsWith("91") ? phone : `91${phone}`}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleSyncFromGstr1 = async () => {
    if (!activeGstin || !task?.period) {
      toast.warning("GSTIN & Period Required", "Ensure GSTIN and task period are present.");
      return;
    }
    setIsSyncingGstr1(true);
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/gstr1?clientGstin=${encodeURIComponent(activeGstin)}&taxPeriod=${encodeURIComponent(task.period)}`
      );
      if (!ok || !data?.found || !data?.summary?.totals) {
        toast.warning(
          "No GSTR-1 Data Found",
          `No compiled GSTR-1 outward records found for ${task.period}. Prepare and save GSTR-1 first.`
        );
        return;
      }
      const t = data.summary.totals;
      setOutIgst(Math.max(0, t.igst || 0));
      setOutCgst(Math.max(0, t.cgst || 0));
      setOutSgst(Math.max(0, t.sgst || 0));
      setOutCess(Math.max(0, t.cess || 0));
      setOutwardLoadedFromGstr1(true);
      toast.success(
        "Outward Liability Synced",
        `Pulled ₹${(t.totalTax || 0).toLocaleString("en-IN")} tax from saved GSTR-1 (${task.period}).`
      );
    } catch (err: any) {
      toast.error("GSTR-1 Sync Failed", err?.message || "Could not fetch GSTR-1 outward liability.");
    } finally {
      setIsSyncingGstr1(false);
    }
  };

  const handleSaveComputationOnly = async () => {
    setIsSubmitting(true);
    try {
      await onMarkFiled(task.id, arnInput.trim(), {
        status: task.status,
        gstin: activeGstin,
        isNilReturn,
        outwardTaxBreakdown: { igst: outIgst, cgst: outCgst, sgst: outSgst, cess: outCess },
        rcmTax,
        itcUtilized: setOff.itcUsed,
        closingCreditLedger: setOff.closingItcBalance,
        taxPayableAmount: totalOutwardTax,
        cashPaid: totalCashWithInterestAndFee,
        section50Interest: interestSec50,
        lateFeeAmount: autoLateFee,
        challanCin: challanCin.trim() || undefined,
      });
      toast.success("Computation Saved", "Tax liability, Rule 88A set-off & closing credit ledger saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteFiling = async () => {
    const cleanArn = arnInput.trim().toUpperCase();
    if (!cleanArn) {
      toast.error("ARN Required", "Enter the official portal ARN / Acknowledgement Number.");
      return;
    }
    if (isGstTask && !isValidGstArn(cleanArn)) {
      toast.error(
        "Invalid GST ARN Format",
        "GST ARN must be 15 alphanumeric characters (e.g. AA271026009182Z)."
      );
      return;
    }
    if (isGstr3b && totalCashWithInterestAndFee > 0 && !challanCin.trim()) {
      toast.warning(
        "Challan CPIN Recommended",
        "Cash payable > ₹0. Consider recording the PMT-06 Challan CPIN."
      );
    }

    setIsSubmitting(true);
    try {
      await onMarkFiled(task.id, cleanArn, {
        filingDate: filingDateInput,
        gstin: activeGstin,
        isNilReturn,
        outwardTaxBreakdown: { igst: outIgst, cgst: outCgst, sgst: outSgst, cess: outCess },
        rcmTax,
        itcUtilized: setOff.itcUsed,
        closingCreditLedger: setOff.closingItcBalance,
        taxPayableAmount: totalOutwardTax,
        cashPaid: totalCashWithInterestAndFee,
        section50Interest: interestSec50,
        lateFeeAmount: autoLateFee,
        challanCin: challanCin.trim() || undefined,
      });
      setHasCascadeCompleted(true);

      universalEventBus.emit("COMPLIANCE_FILED", {
        clientId: client.id,
        clientName: client.name,
        pan: client.pan,
        gstin: activeGstin,
        complianceType:
          task.category === "GST"
            ? task.title.includes("3B")
              ? "GSTR-3B"
              : "GSTR-1"
            : task.title.includes("3CD")
            ? "FORM_3CD"
            : "ITR-6",
        period: task.period || "Current Period",
        arnOrAckNo: cleanArn,
        filedBy: client.assignedArticle || "Practice Staff",
        timestamp: new Date().toISOString(),
      });

      toast.success(
        "Filing Recorded",
        `ARN ${cleanArn} saved for ${client.name} (${task.period}).`
      );
    } catch {
      toast.error("Filing Error", "Unable to update statutory filing status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="relative w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full z-10">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm truncate">{client.name}</h2>
              <p className="text-[11px] text-slate-300 font-mono truncate">
                {task.title} &bull; <span className="text-amber-400 font-bold">{task.period}</span>
                {activeGstin ? ` • ${activeGstin}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status Ribbon */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Statutory Due Date</span>
              <span className="font-mono font-bold text-xs text-slate-900">{task.dueDate}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Status</span>
              <span
                className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                  hasCascadeCompleted
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {hasCascadeCompleted ? "FILED & COMPLETED" : task.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Quick Context-Aware Action Banner */}
          {isGstr1 && (
            <div className="bg-gradient-to-r from-purple-50 via-purple-50/70 to-indigo-50 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <TrendingUp className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>GSTR-1 Outward Return Preparation</span>
                </div>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Upload Sales Register, pull TallyPrime vouchers &amp; check Table 12 HSN.
                </p>
                {savedGstr1Data?.summary?.totals && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-purple-900">
                    <span className="font-bold bg-purple-200/60 text-purple-900 px-2 py-0.5 rounded-md">
                      {savedGstr1Data.invoices?.length || 0} Invoices Prepared
                    </span>
                    <span>Taxable: {formatCurrencyINR(savedGstr1Data.summary.totals.taxableValue || 0)}</span>
                    <span>Tax: {formatCurrencyINR(savedGstr1Data.summary.totals.totalTax || 0)}</span>
                  </div>
                )}
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab("gstr1");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm transition"
                >
                  <span>Open Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {isGstr3b && (
            <div className="bg-gradient-to-r from-blue-50 via-blue-50/70 to-indigo-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Calculator className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>GSTR-3B Tax Settlement Desk</span>
                </div>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  {itcLoadedFrom2b ? "Eligible ITC loaded from 2B Matcher." : "Reconcile purchases in 2B Matcher to auto-fill ITC 4(A)(5)."}
                </p>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab("gstr2b");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-bold transition shrink-0"
                >
                  2B Matcher
                </button>
              )}
            </div>
          )}

          {/* Section 1: Portal Credentials (Strictly Scoped to Client) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">
                    {matchedCred?.portalName || (isGstTask ? "GST Common Portal" : "Income Tax Portal")}
                  </h3>
                  <p className="text-[10px] text-slate-500">Client Keys Vault</p>
                </div>
              </div>
              <a
                href={portalLoginUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg"
              >
                <span>Open Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {matchedCred ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Username</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono font-bold text-xs text-slate-900 truncate">
                        {matchedCred.username}
                      </span>
                      <button onClick={() => copyToClipboard(matchedCred.username, "Username")}>
                        {copiedField === "Username" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Password</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono font-bold text-xs text-slate-900 truncate">
                        {showPassword ? matchedCred.password : "••••••••••••"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                        </button>
                        <button onClick={() => copyToClipboard(matchedCred.password, "Password")}>
                          {copiedField === "Password" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {matchedCred.registeredMobile && (
                  <div className="flex items-center justify-between text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5" />
                      OTP Mobile: <strong>{matchedCred.registeredMobile}</strong>
                    </span>
                    {matchedCred.tokenPin && <span className="font-mono">PIN: {matchedCred.tokenPin}</span>}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No portal credentials stored for {client.name}. Add them in DSC &amp; Keys Vault.</span>
              </div>
            )}
          </div>

          {/* Section 2: DSC Token (Strictly Scoped to Client) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs text-slate-900">Signing Authority &amp; DSC</h3>
              </div>
              {matchedDsc && (
                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                  {matchedDsc.tokenType}
                </span>
              )}
            </div>

            {matchedDsc ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Holder:</span>
                  <strong>{matchedDsc.holderName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Location / Custodian:</span>
                  <span>{matchedDsc.vaultSlot} ({matchedDsc.currentCustodian})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Valid Till:</span>
                  <span className="font-mono font-bold text-emerald-700">{matchedDsc.validTill}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                No DSC token mapped to {client.name} (EVC via Aadhaar/OTP or add DSC in Vault).
              </div>
            )}
          </div>

          {/* Section 3: GSTR-3B Sec 49B / Rule 88A Liability & ITC Set-Off Calculator */}
          {isGstTask && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-xs text-slate-900">
                    {isGstr3b ? "GSTR-3B Sec 49B / Rule 88A Tax Set-Off" : "Outward Liability Summary"}
                  </h3>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNilReturn}
                    onChange={(e) => setIsNilReturn(e.target.checked)}
                  />
                  <span>Nil Return</span>
                </label>
              </div>

              {!isNilReturn && (
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        Outward Tax Liability (₹)
                      </span>
                      <div className="flex items-center gap-2">
                        {outwardLoadedFromGstr1 && (
                          <span className="text-[10px] font-semibold text-purple-700">
                            Auto-pulled from GSTR-1
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleSyncFromGstr1}
                          disabled={isSyncingGstr1}
                          className="text-[10px] font-bold text-purple-700 hover:text-purple-900 underline inline-flex items-center gap-1"
                          title="Re-fetch outward tax totals from saved GSTR-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncingGstr1 ? "animate-spin" : ""}`} />
                          <span>{isSyncingGstr1 ? "Syncing..." : "Sync from GSTR-1"}</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { l: "IGST", v: outIgst, s: setOutIgst },
                        { l: "CGST", v: outCgst, s: setOutCgst },
                        { l: "SGST", v: outSgst, s: setOutSgst },
                        { l: "Cess", v: outCess, s: setOutCess },
                      ].map((f) => (
                        <div key={f.l}>
                          <label className="text-[10px] text-slate-500 block">{f.l}</label>
                          <input
                            type="number"
                            min={0}
                            value={f.v}
                            onChange={(e) => f.s(parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {isGstr3b && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500">
                            Net Eligible ITC 4(C) (₹)
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700">
                            {itcLoadedFrom2b ? "Auto-loaded from 2B Matcher" : "Enter or run 2B Matcher"}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { l: "IGST", v: itcIgst, s: setItcIgst },
                            { l: "CGST", v: itcCgst, s: setItcCgst },
                            { l: "SGST", v: itcSgst, s: setItcSgst },
                            { l: "Cess", v: itcCess, s: setItcCess },
                          ].map((f) => (
                            <div key={f.l}>
                              <label className="text-[10px] text-slate-500 block">{f.l}</label>
                              <input
                                type="number"
                                min={0}
                                value={f.v}
                                onChange={(e) => f.s(parseFloat(e.target.value) || 0)}
                                className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-[10px] text-slate-600">
                          <span>
                            Opening Ledger: I ₹{openCredit.igst || 0} | C ₹{openCredit.cgst || 0} | S ₹{openCredit.sgst || 0}
                          </span>
                          <span className="font-semibold text-emerald-700">
                            Closing C/F: I ₹{setOff.closingItcBalance.igst} | C ₹{setOff.closingItcBalance.cgst} | S ₹{setOff.closingItcBalance.sgst}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">RCM Cash (3.1d)</label>
                          <input
                            type="number"
                            min={0}
                            value={rcmTax}
                            onChange={(e) => setRcmTax(parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Interest u/s 50</label>
                          <input
                            type="number"
                            min={0}
                            value={interestSec50}
                            onChange={(e) => setInterestSec50(parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">PMT-06 Challan CPIN</label>
                          <input
                            type="text"
                            value={challanCin}
                            onChange={(e) => setChallanCin(e.target.value.toUpperCase())}
                            placeholder="14-digit CPIN"
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Computed Summary Strip */}
              {isGstr3b ? (
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <span className="text-[10px] text-slate-500 block">Gross Liability</span>
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {formatCurrencyINR(totalOutwardTax)}
                    </span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                    <span className="text-[10px] text-emerald-700 block">ITC Set-Off</span>
                    <span className="font-mono font-bold text-xs text-emerald-800">
                      {formatCurrencyINR(
                        setOff.itcUsed.igst + setOff.itcUsed.cgst + setOff.itcUsed.sgst + setOff.itcUsed.cess
                      )}
                    </span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <span className="text-[10px] text-red-700 block">Cash + Fee ({autoLateFee})</span>
                    <span className="font-mono font-bold text-xs text-btred-logo">
                      {formatCurrencyINR(totalCashWithInterestAndFee)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">Total GSTR-1 Outward Tax</span>
                    <span className="font-mono font-bold text-base text-purple-950">{formatCurrencyINR(totalOutwardTax)}</span>
                  </div>
                  <span className="text-[10px] text-purple-800 font-bold bg-purple-100/80 border border-purple-200 px-2.5 py-1 rounded-full">
                    Table 4–13 Outward Supplies
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!hasCascadeCompleted && (
                  <button
                    type="button"
                    onClick={handleSaveComputationOnly}
                    disabled={isSubmitting}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                  >
                    Save Draft
                  </button>
                )}
                {isGstr1 && (
                  <button
                    type="button"
                    onClick={handleExportGstr1Json}
                    className="py-1.5 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold inline-flex items-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> GSTR-1 JSON
                  </button>
                )}
                {isGstr3b && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportGstr3bJson}
                      className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold inline-flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> 3B JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleSendClientApprovalWhatsApp}
                      className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold inline-flex items-center gap-1 transition"
                    >
                      <Send className="w-3.5 h-3.5" /> Client Cash WhatsApp
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Record Official ARN */}
          <div className="border border-emerald-300 bg-emerald-50/40 rounded-xl p-4 space-y-3">
            <span className="font-bold text-xs text-emerald-950 uppercase block">
              {hasCascadeCompleted ? "Filing Recorded" : "Confirm Portal Filing & Record ARN"}
            </span>
            <p className="text-[11px] text-slate-600">
              Records the official ARN, filing date, and computation in the Task Register &amp; Document Vault.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1">
                  Official Portal ARN / Ack No *
                </label>
                <input
                  type="text"
                  value={arnInput}
                  onChange={(e) => setArnInput(e.target.value.toUpperCase())}
                  placeholder={isGstTask ? "e.g. AA231026009182Z" : "15-digit Ack No"}
                  className="w-full bg-white border border-slate-300 font-mono text-xs font-bold px-3 py-2 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-700 block mb-1">
                  Filing Date
                </label>
                <input
                  type="date"
                  value={filingDateInput}
                  onChange={(e) => setFilingDateInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 font-mono text-xs px-2.5 py-2 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <button
              onClick={handleCompleteFiling}
              disabled={isSubmitting || hasCascadeCompleted}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white transition flex items-center justify-center gap-2 ${
                hasCascadeCompleted
                  ? "bg-emerald-600 cursor-default"
                  : isSubmitting
                  ? "bg-slate-400 cursor-wait"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              {hasCascadeCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Filing Recorded (ARN: {arnInput})</span>
                </>
              ) : (
                <>
                  <span>{isSubmitting ? "Recording..." : "Confirm Filing & Save ARN"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-mono">Audit Trail: Active User Session</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
