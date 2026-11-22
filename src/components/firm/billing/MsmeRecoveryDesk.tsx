"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Sparkles,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Copy,
  TrendingUp,
  RefreshCw,
  Send,
  HelpCircle,
  Percent,
  FileText,
  FileCheck,
  ShieldAlert,
  Building2,
  X,
  FileWarning
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import {
  MsmeInvoiceEvaluation,
  MsmePortfolioRiskSummary,
  MsmeEscalationStage
} from "@/lib/billing/msmeRecoveryEngine";
import { generateNpciDynamicUpiUri, generateUpiQrDataUrl } from "@/lib/billing/npciUpiEngine";

export function MsmeRecoveryDesk() {
  const [evaluations, setEvaluations] = useState<MsmeInvoiceEvaluation[]>([]);
  const [summary, setSummary] = useState<MsmePortfolioRiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageFilter, setSelectedStageFilter] = useState<"ALL" | MsmeEscalationStage>("ALL");
  const [legalNoticeModalData, setLegalNoticeModalData] = useState<{
    noticeText: string;
    evaluation: MsmeInvoiceEvaluation;
  } | null>(null);
  const [qrModalInvoice, setQrModalInvoice] = useState<MsmeInvoiceEvaluation | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [upiUri, setUpiUri] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchMsmeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/msme-recovery");
      const data = await res.json();
      if (data?.success) {
        setEvaluations(data.evaluations || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load MSME recovery data:", err);
      toast.error("Network Error", "Could not load MSME recovery radar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMsmeData();
  }, []);

  const filtered = evaluations.filter((e) => {
    if (selectedStageFilter === "ALL") return true;
    return e.stage === selectedStageFilter;
  });

  // Action: Open Legal Demand Notice Modal
  const handleOpenLegalNotice = async (evalItem: MsmeInvoiceEvaluation) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/billing/msme-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_LEGAL_DEMAND_NOTICE",
          invoiceNo: evalItem.invoiceNo,
          partnerName: "CA Gunjan Jain, FCA, DISA"
        })
      });
      const data = await res.json();
      if (data?.success && data?.noticeText) {
        setLegalNoticeModalData({
          noticeText: data.noticeText,
          evaluation: evalItem
        });
      } else {
        toast.error("Error", data?.error || "Could not generate demand notice");
      }
    } catch (err: any) {
      toast.error("Notice Generation Error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: WhatsApp Escalation Dispatch
  const handleWhatsAppEscalation = async (evalItem: MsmeInvoiceEvaluation) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/billing/msme-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPATCH_ESCALATION_WHATSAPP",
          invoiceNo: evalItem.invoiceNo,
          partnerName: "CA Gunjan Jain"
        })
      });
      const data = await res.json();
      if (data?.success && data?.whatsappText) {
        const encoded = encodeURIComponent(data.whatsappText);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
        toast.success(
          "Escalation Dispatch Opened",
          `WhatsApp advisory generated for ${evalItem.clientName} (${evalItem.stage})`
        );
      } else {
        toast.error("Error", data?.error || "Could not generate escalation message");
      }
    } catch (err: any) {
      toast.error("Dispatch Error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Open Dynamic UPI QR
  const handleOpenQr = async (evalItem: MsmeInvoiceEvaluation) => {
    setQrModalInvoice(evalItem);
    const totalToCollect = evalItem.amount + evalItem.accruedCompoundedInterestInr;
    const uri = generateNpciDynamicUpiUri({
      vpa: "BRAINSANDTAXES@icici",
      payeeName: "GPA & Co., Chartered Accountants",
      amount: totalToCollect,
      invoiceNo: evalItem.invoiceNo,
      note: `MSME Settlement ${evalItem.invoiceNo}`
    });
    setUpiUri(uri);
    try {
      const qr = await generateUpiQrDataUrl(uri);
      setQrDataUrl(qr);
    } catch (err) {
      console.error("QR Code generation error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER (Clean White surfaces, zero dark blue or black) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 text-btred-logo rounded-xl border border-red-200">
                <Scale className="w-5 h-5 text-btred-logo" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Statutory MSME Section 43B(h) &amp; Section 16 Recovery Radar
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Flips the psychological balance from awkward fee chasing to statutory tax preservation. Under
              Section 43B(h) of the Income Tax Act read with Section 15 &amp; 16 of the MSMED Act, unpaid professional
              fees past 45 days are <strong>disallowed in the client’s tax computation</strong> and accrue
              compound interest @ <strong>3x the RBI Bank Rate (19.5% p.a.)</strong> with mandatory disclosure in Form 3CD Clause 22.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMsmeData}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-btred-logo" : "text-slate-500"}`} />
              Sync MSME Radar
            </button>
          </div>
        </div>

        {/* 2. SUMMARY METRICS */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Overdue at Disallowance Risk</span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatCurrencyINR(summary.totalOverdueAmountInr)}</div>
              <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> {summary.totalEvaluatedInvoices} invoices in portfolio
              </span>
            </div>

            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Client Tax Deduction Loss</span>
              <div className="text-xl font-black text-rose-700 mt-1">{formatCurrencyINR(summary.totalClientTaxDisallowanceRiskInr)}</div>
              <span className="text-[11px] text-rose-700 font-medium flex items-center gap-1 mt-1">
                <FileWarning className="w-3 h-3 text-rose-600" /> 31.2% tax penalty client suffers u/s 43B(h)
              </span>
            </div>

            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Accrued Sec 16 Interest (3x RBI)</span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatCurrencyINR(summary.totalAccruedInterestInr)}</div>
              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-btred-logo" /> 19.5% p.a. compounded monthly
              </span>
            </div>

            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Stage 4 Legal Demands</span>
              <div className="text-xl font-black text-btred-logo mt-1">{summary.invoicesCountByStage.stage4} Invoices</div>
              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-1">
                <Scale className="w-3 h-3 text-btred-logo" /> Past 45 days &bull; Ready for MSEFC Samadhaan
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. 4-STAGE ESCALATION LADDER TABS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedStageFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              selectedStageFilter === "ALL"
                ? "bg-btred-logo text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Invoices ({evaluations.length})
          </button>

          <button
            onClick={() => setSelectedStageFilter("STAGE_1_COURTESY")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              selectedStageFilter === "STAGE_1_COURTESY"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            🟢 Stage 1: Courteous (0-15d)
          </button>

          <button
            onClick={() => setSelectedStageFilter("STAGE_2_COUNTDOWN")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              selectedStageFilter === "STAGE_2_COUNTDOWN"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            🟡 Stage 2: 45-Day Countdown (16-30d)
          </button>

          <button
            onClick={() => setSelectedStageFilter("STAGE_3_INTEREST_RISK")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              selectedStageFilter === "STAGE_3_INTEREST_RISK"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            🟠 Stage 3: Pre-Disallowance Warning (31-44d)
          </button>

          <button
            onClick={() => setSelectedStageFilter("STAGE_4_STATUTORY_DEMAND")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              selectedStageFilter === "STAGE_4_STATUTORY_DEMAND"
                ? "bg-rose-700 text-white shadow-sm"
                : "text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            🔴 Stage 4: Formal MSME Notice (45d+)
          </button>
        </div>

        <div className="text-xs text-slate-500 px-2 font-medium">
          Showing {filtered.length} statutory records
        </div>
      </div>

      {/* 4. INVOICES RISK LISTING */}
      <div className="space-y-4">
        {filtered.map((evalItem) => (
          <div
            key={evalItem.invoiceId}
            className={`bg-white border rounded-3xl p-6 shadow-sm transition hover:shadow-md ${
              evalItem.stage === "STAGE_4_STATUTORY_DEMAND"
                ? "border-rose-300"
                : evalItem.stage === "STAGE_3_INTEREST_RISK"
                ? "border-orange-300"
                : "border-slate-200"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Client & Compliance Status */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base">{evalItem.clientName}</span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    PAN: {evalItem.pan}
                  </span>

                  {/* Stage Badges */}
                  {evalItem.stage === "STAGE_1_COURTESY" && (
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Stage 1 &bull; Within Agreed Terms
                    </span>
                  )}
                  {evalItem.stage === "STAGE_2_COUNTDOWN" && (
                    <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Stage 2 &bull; {evalItem.daysRemainingIn45DayWindow} Days to MSME 45-Day Deadline
                    </span>
                  )}
                  {evalItem.stage === "STAGE_3_INTEREST_RISK" && (
                    <span className="text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-orange-600" /> Stage 3 &bull; Section 43B(h) Disallowance Risk Imminent ({evalItem.daysRemainingIn45DayWindow}d left)
                    </span>
                  )}
                  {evalItem.stage === "STAGE_4_STATUTORY_DEMAND" && (
                    <span className="text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3 text-rose-600" /> Stage 4 &bull; Disallowed u/s 43B(h) + 19.5% Compound Interest Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-btred-logo shrink-0" />
                    Invoice No: {evalItem.invoiceNo} &bull; Outstanding Age: <strong>{evalItem.daysPastInvoice} Days</strong>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Due Date: <strong className="text-slate-700">{evalItem.dueDate}</strong></span>
                    <span>&bull;</span>
                    <span>Udyam Reg: <strong className="text-slate-700">{evalItem.udyamRegistrationNo}</strong></span>
                  </div>
                </div>

                {/* Statutory Matrix Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Section 16 Statutory Interest:</span>
                    <div className="font-black text-slate-900 mt-0.5">
                      {formatCurrencyINR(evalItem.accruedCompoundedInterestInr)}
                      <span className="text-[11px] font-normal text-slate-500 ml-1">(@19.5% p.a.)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Client Direct Tax Penalty u/s 43B(h):</span>
                    <div className={`font-black mt-0.5 ${evalItem.potentialTaxDisallowanceLossInr > 0 ? "text-rose-700 font-extrabold" : "text-slate-700"}`}>
                      {evalItem.potentialTaxDisallowanceLossInr > 0
                        ? `${formatCurrencyINR(evalItem.potentialTaxDisallowanceLossInr)} (Tax Disallowed)`
                        : "Protected (<45d)"}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Form 3CD Clause 22 Disclosure:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {evalItem.form3cdClause22DisclosureRequired ? (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Mandatory Auditor Reporting
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">Compliant</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Principal & Action Buttons */}
              <div className="lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0 space-y-3">
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 font-semibold">Principal Fee:</span>
                    <span className="text-lg font-black text-slate-900">{formatCurrencyINR(evalItem.amount)}</span>
                  </div>

                  {evalItem.accruedCompoundedInterestInr > 0 && (
                    <div className="flex justify-between items-baseline text-xs text-slate-500 mt-0.5">
                      <span>Accrued MSME Interest:</span>
                      <span className="text-amber-800 font-bold">
                        + {formatCurrencyINR(evalItem.accruedCompoundedInterestInr)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline text-xs font-black pt-1 border-t border-slate-100 mt-1">
                    <span className="text-slate-700">Total Statutory Claim:</span>
                    <span className="text-btred-logo text-base font-extrabold">
                      {formatCurrencyINR(evalItem.amount + evalItem.accruedCompoundedInterestInr)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenLegalNotice(evalItem)}
                      disabled={isProcessing}
                      className="w-full px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                      title="Inspect Legal Demand Notice Draft under MSMED Act"
                    >
                      <Scale className="w-3.5 h-3.5 text-slate-600" />
                      Legal Notice
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWhatsAppEscalation(evalItem)}
                      disabled={isProcessing}
                      className="w-full px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                      title="Send WhatsApp Statutory Warning"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-700" />
                      WhatsApp
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenQr(evalItem)}
                    className="w-full py-2.5 bg-btred-logo hover:bg-red-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Settle via Dynamic UPI
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. MODAL: FORMAL STATUTORY LEGAL DEMAND NOTICE INSPECTOR */}
      {legalNoticeModalData && (
        <div className="fixed inset-0 z-50 bg-slate-700/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-btred-logo">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Statutory Legal Demand Notice Draft (MSMED Act Section 18)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Official GPA &amp; Co. letterhead notice with statutory interest &amp; Section 43B(h) citation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLegalNoticeModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice Draft Text Presentation */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
              {legalNoticeModalData.noticeText}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Ready for Registered Speed Post, Email, or WhatsApp dispatch
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(legalNoticeModalData.noticeText);
                    toast.success("Notice Copied", "Pasted to clipboard ready for dispatch");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Notice
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Print Letterhead Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: DYNAMIC NPCI UPI QR CODE */}
      {qrModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-700/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-btred-logo">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Zero-Cost Dynamic UPI Settle</h3>
                  <p className="text-[11px] text-slate-500">Clear statutory invoice instantly</p>
                </div>
              </div>
              <button
                onClick={() => setQrModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs space-y-1">
              <div className="text-slate-500">Client: <strong className="text-slate-800">{qrModalInvoice.clientName}</strong></div>
              <div className="text-slate-500">Invoice: <strong className="text-slate-800">{qrModalInvoice.invoiceNo}</strong></div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 text-center space-y-2">
              <div className="w-44 h-44 mx-auto p-2 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="NPCI Dynamic UPI QR" className="w-40 h-40 object-contain" />
                ) : (
                  <div className="animate-spin w-8 h-8 border-2 border-btred-logo border-t-transparent rounded-full" />
                )}
              </div>

              <div className="text-xs">
                <span className="text-slate-500">Payable Amount:</span>
                <div className="text-xl font-black text-slate-900">
                  {formatCurrencyINR(qrModalInvoice.amount + qrModalInvoice.accruedCompoundedInterestInr)}
                </div>
                <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                  VPA: BRAINSANDTAXES@icici
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={upiUri}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open PhonePe / GPay
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(upiUri);
                  toast.success("UPI Link Copied", "Paste in any payment app");
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy UPI URI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
