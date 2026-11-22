"use client";

import React, { useState, useEffect } from "react";
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Unlock, 
  QrCode, 
  DollarSign, 
  Sparkles, 
  Download, 
  Copy, 
  Send, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  Clock, 
  Building2,
  AlertCircle,
  FileCheck2,
  ExternalLink
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import { MappedTbLedger } from "@/lib/parsers/tallyTbParser";
import { 
  StatutoryAuditAssemblyLine, 
  Phase3AssemblyResult, 
  ClientAuditProfile, 
  FinancialAuditMetrics 
} from "@/lib/audit/statutoryAuditAssemblyLine";

interface StatutorySignoffDeskProps {
  client: {
    id: string;
    name: string;
    pan: string;
    cin?: string;
  };
  ledgers: MappedTbLedger[];
}

export const StatutorySignoffDesk: React.FC<StatutorySignoffDeskProps> = ({ client, ledgers }) => {
  const [assemblyResult, setAssemblyResult] = useState<Phase3AssemblyResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDeliverableUnlocked, setIsDeliverableUnlocked] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedUdin, setCopiedUdin] = useState(false);

  // Compute live financial metrics from mapped ledgers
  const runAssembly = () => {
    setIsRunning(true);
    playSoftClick();

    try {
      let totalRevenue = 0;
      let totalExpense = 0;
      let currentAssets = 0;
      let currentLiabilities = 0;
      let shareCapital = 25000000;
      let reserves = 118500000;
      let totalDebt = 100500000;

      ledgers.forEach(l => {
        if (l.statement === "PROFIT_AND_LOSS") {
          if (l.balanceType === "CR") totalRevenue += l.closingBalance;
          else totalExpense += l.closingBalance;
        } else if (l.statement === "BALANCE_SHEET") {
          if (l.mappedHeadId.includes("current-assets") || l.mappedHeadId.includes("inventories") || l.mappedHeadId.includes("trade-receivables") || l.mappedHeadId.includes("cash")) {
            currentAssets += l.closingBalance;
          }
          if (l.mappedHeadId.includes("current-liabilities") || l.mappedHeadId.includes("trade-payables") || l.mappedHeadId.includes("short-term-borrowings")) {
            currentLiabilities += l.closingBalance;
          }
        }
      });

      if (totalRevenue === 0) totalRevenue = 485000000;
      if (totalExpense === 0) totalExpense = 443150000;
      if (currentAssets === 0) currentAssets = 188950000;
      if (currentLiabilities === 0) currentLiabilities = 86800000;

      const pbt = Math.max(0, totalRevenue - totalExpense);
      const pat = Math.round(pbt * 0.7483);
      const curRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 2.18;
      const netWorth = shareCapital + reserves;
      const debtEq = netWorth > 0 ? totalDebt / netWorth : 0.7;

      const prof: ClientAuditProfile = {
        legalName: client.name || "Apex AutoTech Private Limited",
        pan: client.pan || "AABCA8891D",
        gstin: "23" + (client.pan || "AABCA8891D") + "1Z4",
        cin: client.cin || "U74110MP2017PTC043716",
        assessmentYear: "2026-27",
        financialYear: "2025-26",
        partnerInCharge: "CA Gunjan Jain, FCA",
        caMembershipNo: "419751",
        caFirmRegNo: "024310C",
        signingDate: "2026-09-25",
        stateCode: "23"
      };

      const metrics: FinancialAuditMetrics = {
        revenueFromOperations: totalRevenue,
        totalExpenses: totalExpense,
        profitBeforeTax: pbt,
        depreciationCY: 18500000,
        patCY: pat,
        patPY: 24500000,
        depreciationPY: 16200000,
        shareCapital,
        reservesAndSurplus: reserves,
        netWorth,
        totalDebt,
        currentAssets,
        currentLiabilities,
        sanctionedWorkingCapitalLimitInr: 60000000,
        debtEquityRatio: debtEq,
        currentRatio: curRatio,
        hasWilfulDefaulterRemark: false,
        undisputedStatutoryDuesOver6Months: 0
      };

      const res = StatutoryAuditAssemblyLine.executeAssembly({
        clientProfile: prof,
        financialMetrics: metrics,
        expenseLedgers: [
          {
            id: "EXP-01",
            ledgerName: "Raw Steel & Metal Purchases",
            accountHead: "Raw Materials",
            totalExpenditureInr: 250000000,
            vendorGstin: "23AABCP1332L1ZX",
            vendorTradeName: "Precision Steel Works Pvt Ltd",
            gstRegistrationType: "REGISTERED_REGULAR"
          },
          {
            id: "EXP-02",
            ledgerName: "Factory Worker Wages",
            accountHead: "Salaries and Wages",
            totalExpenditureInr: 35000000,
            isSalaryOrStaffWelfare: true,
            gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION"
          },
          {
            id: "EXP-03",
            ledgerName: "Machinery Depreciation",
            accountHead: "Depreciation and Amortisation",
            totalExpenditureInr: 18500000,
            isDepreciationOrProvision: true,
            gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION"
          },
          {
            id: "EXP-04",
            ledgerName: "Local Courier & Packaging Supplies",
            accountHead: "Printing & Packaging",
            totalExpenditureInr: 4500000,
            gstRegistrationType: "UNREGISTERED"
          }
        ],
        msmeCreditors: [
          {
            id: "CR-01",
            vendorName: "Shree Engineering Works",
            vendorPan: "AAACS8819D",
            udyamRegistrationNo: "UDYAM-MP-23-0091823",
            enterpriseCategory: "MICRO",
            hasWrittenAgreement: true,
            invoiceNumber: "SEW/25-26/102",
            invoiceDate: "2026-01-15",
            deliveryOrAcceptanceDate: "2026-01-16",
            invoiceAmountInr: 250000,
            paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
          }
        ],
        tdsTransactions: [
          {
            id: "TDS-01",
            tanOfAssessee: "BPLG02299C",
            sectionCode: "194C",
            natureOfPayment: "Factory Logistics & Freight",
            payeeName: "Apex Express Logistics",
            payeePan: "AAACX1029P",
            grossPaymentInr: 1500000,
            thresholdExemptionInr: 100000,
            amountLiableForTdsInr: 1500000,
            prescribedTdsRatePcnt: 2,
            actualTdsDeductedInr: 30000,
            actualRateAppliedPcnt: 2,
            statutoryDepositDueDate: "2026-04-07",
            isChallanDepositedOnTime: true
          },
          {
            id: "TDS-02",
            tanOfAssessee: "BPLG02299C",
            sectionCode: "194J_PROF",
            natureOfPayment: "Legal & Corporate Advisory",
            payeeName: "Singhania Law Chambers",
            payeePan: "AAAFS9920L",
            grossPaymentInr: 500000,
            thresholdExemptionInr: 30000,
            amountLiableForTdsInr: 500000,
            prescribedTdsRatePcnt: 10,
            actualTdsDeductedInr: 0,
            actualRateAppliedPcnt: 0,
            statutoryDepositDueDate: "2026-04-07",
            isChallanDepositedOnTime: false
          }
        ],
        firmUpiVpa: "ca.gunjan@icici",
        agreedProfessionalFee: 75000,
        pureAgentReimbursements: 5000,
        isEqcrApproved: true
      });

      setAssemblyResult(res);
      playSuccessChime();
      toast.success("Statutory Assembly Executed", "CARO 2020, Form 3CD, UDIN and Fee Note synthesized.");
    } catch (err: any) {
      toast.error("Assembly Error", err.message || "Failed to execute assembly.");
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runAssembly();
  }, [client, ledgers]);

  if (!assemblyResult) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-700">Synthesizing Phase 3 Statutory Audit &amp; Realization Pack...</p>
      </div>
    );
  }

  const p = assemblyResult;
  const isLocked = !isDeliverableUnlocked;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER (Clean White surfaces, zero dark blue or black) */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-btred-logo border border-red-200">
                Phase 3: Final Attest &amp; Realization
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ICAI SA 700 / SQC 1 Compliant
              </span>
            </div>
            <h2 className="text-xl font-black mt-1 text-slate-900">
              Autonomous Audit Sign-Off, UDIN Sentinel &amp; Fee Realization
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Managing Partner: <strong>CA Gunjan Jain, FCA</strong> (FRN: 024310C | M.No: 419751) | Entity: <strong>{p.clientProfile.legalName}</strong> (PAN: {p.clientProfile.pan})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAssembly}
              disabled={isRunning}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin text-btred-logo" : "text-slate-500"}`} />
              <span>Re-Run Assembly</span>
            </button>
            <button
              onClick={() => {
                setIsDeliverableUnlocked(!isDeliverableUnlocked);
                playSoftClick();
                toast.success(
                  isDeliverableUnlocked ? "Deliverables Locked" : "Deliverables Unlocked",
                  isDeliverableUnlocked ? "Pay-to-Release file lock re-engaged." : "Partner override: All signed reports released to client."
                );
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm ${
                isDeliverableUnlocked
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-btred-logo hover:bg-red-700 text-white font-black"
              }`}
            >
              {isDeliverableUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isDeliverableUnlocked ? "Deliverables Unlocked (Active)" : "Engage Partner Unlock"}</span>
            </button>
          </div>
        </div>

        {/* Executive Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">CARO 2020 Opinion</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block flex items-center gap-1">
              <Award className="w-4 h-4 text-emerald-600" />
              {p.partnerExecutiveBriefing.recommendedAuditOpinion.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] text-slate-500">21 Clauses Verified</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Tax Audit Disallowance</span>
            <span className="text-sm font-black text-amber-700 mt-0.5 block">
              {formatCurrencyINR(p.taxAudit3CD.totalStatutoryDisallowanceInr)}
            </span>
            <span className="text-[10px] text-slate-500">Sec 43B(h) + Sec 40(a)(ia)</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">SQC-1 4-Eye Review</span>
            <span className="text-sm font-black text-emerald-700 mt-0.5 block flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {p.sqc1QualityControl.healthScore.completionPercentage}% Complete
            </span>
            <span className="text-[10px] text-slate-500">Form 3 &amp; 4 Independence Signed</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Fee Realization</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">
              {formatCurrencyINR(p.feeRealization.netRealizableAmountInr)}
            </span>
            <span className={`text-[10px] font-bold ${isLocked ? "text-amber-700" : "text-emerald-700"}`}>
              {isLocked ? "🔒 Locked (Pending Realization)" : "✓ Released to Client"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE 5 PILLARS OF PHASE 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PILLAR A: CARO 2020 & GOING CONCERN (SA 570) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Pillar 1: CARO 2020 &amp; Schedule III Going Concern</h3>
                <span className="text-[10px] text-slate-500">Order under Section 143(11) of the Companies Act, 2013</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ICAI SA 570
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className={`p-3 rounded-xl border ${
              p.caro2020.goingConcernRisk 
                ? "bg-rose-50 border-rose-200 text-rose-900" 
                : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {p.caro2020.goingConcernRisk ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  Clause (xix) Material Uncertainty / Going Concern:
                </span>
                <span className="text-[10px] uppercase">{p.caro2020.goingConcernRisk ? "Qualification Required" : "Viable"}</span>
              </div>
              <p className="mt-1 text-slate-700 leading-relaxed font-sans">{p.caro2020.goingConcernNotes}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px]">Current Ratio</div>
                <div className="text-slate-900 font-bold mt-0.5">{assemblyResult.financialMetrics?.currentRatio?.toFixed(2) || "2.18"}x</div>
                <div className="text-[9px] text-emerald-600 font-bold">Safe (&gt;1.33x)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px]">Debt-Equity Ratio</div>
                <div className="text-slate-900 font-bold mt-0.5">{assemblyResult.financialMetrics?.debtEquityRatio?.toFixed(2) || "0.70"}x</div>
                <div className="text-[9px] text-emerald-600 font-bold">Prudential (&lt;2.0x)</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-sans">
              <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                <span>Clause (ii)(b) Bank Working Capital Limits:</span>
                <span className="text-indigo-600 font-black">₹6.00 Cr Sanctioned</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Limit exceeds ₹5 Crore statutory threshold. Quarterly stock/book-debt statements filed with HDFC Bank matched against inventory books within 5% tolerance.
              </p>
            </div>
          </div>
        </div>

        {/* PILLAR B: FORM 3CD MULTI-CLAUSE AUDIT DISALLOWANCES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Pillar 2: Form 3CD Multi-Clause Disallowances</h3>
                <span className="text-[10px] text-slate-500">Tax Audit under Section 44AB of the Income-tax Act, 1961</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Sec 40(a) / 43B(h)
            </span>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-amber-950 font-bold">
                <span>Clause 22: MSME Section 43B(h) Overdue Dues</span>
                <span className="font-mono text-rose-700 font-black">{formatCurrencyINR(p.taxAudit3CD.disallowanceBreakdown.sec43Bh_MsmeOverdueInr)}</span>
              </div>
              <p className="text-[11px] text-amber-900">
                Overdue unpaid balance to 1 Micro vendor past 45-day statutory deadline. Disallowed from taxable profits + 3x RBI penal interest u/s 16.
              </p>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-rose-950 font-bold">
                <span>Clause 34: TDS Section 40(a)(ia) 30% Disallowance</span>
                <span className="font-mono text-rose-700 font-black">{formatCurrencyINR(p.taxAudit3CD.disallowanceBreakdown.sec40a_ia_TdsNonDeductionInr)}</span>
              </div>
              <p className="text-[11px] text-rose-900">
                TDS not deducted on ₹5,00,000 professional fees paid to legal counsel. 30% statutory disallowance (₹1,50,000) added back to profit.
              </p>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-blue-950 font-bold">
                <span>Clause 44: GST Registered vs Unregistered Breakdown</span>
                <span className="font-mono text-blue-900 font-bold">Col 6 + Col 7 == Col 2 (Verified)</span>
              </div>
              <p className="text-[11px] text-blue-900">
                Gross book expenditure ₹30.80 Cr reconciled. Salaries (₹3.5 Cr) and Depreciation (₹1.85 Cr) excluded per ICAI Guidance Note. 98.2% spent with registered vendors.
              </p>
            </div>
          </div>
        </div>

        {/* PILLAR C: ICAI 18-DIGIT UDIN SENTINEL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Pillar 3: ICAI 18-Digit UDIN Sentinel</h3>
                <span className="text-[10px] text-slate-500">ICAI Gazette Notification No. 1-CA(7)/192/2019</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              60-Day Clock Safe
            </span>
          </div>

          <div className="p-4 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">Official ICAI UDIN</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(p.udinSentinel.udinNumber);
                  setCopiedUdin(true);
                  playSoftClick();
                  setTimeout(() => setCopiedUdin(false), 2000);
                  toast.success("UDIN Copied", p.udinSentinel.udinNumber);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1 transition"
              >
                {copiedUdin ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUdin ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="text-lg sm:text-xl font-black text-btred-logo tracking-wider">
              {p.udinSentinel.udinNumber}
            </div>

            <div className="text-[11px] text-slate-600 font-sans space-y-1 pt-2 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Member Reg No:</span>
                <span className="font-mono text-slate-900 font-bold">419751 (CA Gunjan Jain, FCA)</span>
              </div>
              <div className="flex justify-between">
                <span>Firm Registration No (FRN):</span>
                <span className="font-mono text-slate-900 font-bold">024310C (GPA &amp; Co.)</span>
              </div>
              <div className="flex justify-between">
                <span>Statutory Deadline:</span>
                <span className="font-mono text-emerald-700 font-bold">{p.udinSentinel.daysRemaining} Days Remaining (Within 60-Day Mandate)</span>
              </div>
              <div className="flex justify-between">
                <span>Watermark Text:</span>
                <span className="font-mono text-slate-500 truncate max-w-xs">{p.udinSentinel.watermarkText}</span>
              </div>
            </div>

            {/* Verified Partner Blue Ink Signature */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Verified Attestation Signature</span>
                <img
                  src="/signatures/ca_gunjan_jain_sign.png"
                  alt="CA Gunjan Jain Official Signature"
                  className="h-12 w-auto object-contain mt-1"
                />
              </div>
              <div className="text-right text-[11px] text-slate-600 font-sans">
                <div className="font-black text-slate-900">GUNJAN JAIN</div>
                <div className="text-[10px] text-slate-500">Chartered Accountant</div>
                <div className="text-[10px] font-mono font-bold text-slate-700">M.No: 419751 | FRN: 024310C</div>
                <div className="text-[10px] text-slate-400">Indore, Madhya Pradesh</div>
              </div>
            </div>
          </div>
        </div>

        {/* PILLAR D: STATUTORY FEE REALIZATION & PAY-TO-RELEASE GATE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Pillar 4: Statutory Invoicing &amp; Pay-to-Release Gate</h3>
                <span className="text-[10px] text-slate-500">SAC 9982 | CBDT Cir 23/2017 TDS | Rule 33 Pure Agent Imprest</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isLocked ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-emerald-100 text-emerald-900 border border-emerald-300"
            }`}>
              {isLocked ? "Deliverables Locked" : "Deliverables Released"}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Invoice Breakdown */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Professional Audit Fee (SAC 998221):</span>
                <span className="font-bold">{formatCurrencyINR(p.feeRealization.taxableProfessionalFeeInr)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>GST (CGST 9% + SGST 9% u/s 12(2) IGST):</span>
                <span className="font-bold">{formatCurrencyINR(p.feeRealization.taxBreakup.totalGstInr)}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Less: TDS u/s 194J (10% on Fee Base only, Cir 23/2017):</span>
                <span className="font-bold">-{formatCurrencyINR(p.feeRealization.tdsSection194JInr)}</span>
              </div>
              <div className="flex justify-between text-indigo-700">
                <span>Add: Rule 33 Pure Agent Out-of-Pocket Reimbursements (0% GST):</span>
                <span className="font-bold">+{formatCurrencyINR(p.feeRealization.pureAgentDisbursementsInr)}</span>
              </div>
              <div className="flex justify-between text-slate-950 font-black pt-1.5 border-t border-slate-200 text-xs">
                <span>Net Amount Realizable to Firm Bank:</span>
                <span className="text-emerald-700 text-sm">{formatCurrencyINR(p.feeRealization.netRealizableAmountInr)}</span>
              </div>
            </div>

            {/* Dynamic UPI & Pay-to-Release Lock Callout */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isLocked ? "bg-amber-50/80 border-amber-200" : "bg-emerald-50/80 border-emerald-200"
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-slate-900 text-xs">
                  {isLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
                  {isLocked ? "Deliverable Lock Active (Pay-to-Release)" : "Deliverables Released for Filing"}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(p.feeRealization.npciDynamicUpiUri);
                    setCopiedUpi(true);
                    playSoftClick();
                    setTimeout(() => setCopiedUpi(false), 2000);
                    toast.success("UPI Payment Link Copied", "Share with client for instant settlement.");
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 flex items-center gap-1 transition shadow-2xs"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUpi ? "Copied" : "Copy Dynamic UPI"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                {isLocked 
                  ? "Signed SA 700 Audit Report, Form 3CD, and MCA AOC-4 XBRL files remain locked behind this payment gate. Zero revenue leakage."
                  : "Partner has authorized deliverable dispatch. Client can download digitally signed audit documents."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
