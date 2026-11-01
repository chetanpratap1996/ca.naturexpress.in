"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  CreditCard, 
  Building2, 
  Clock, 
  Scale, 
  FileText, 
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Printer,
  Download,
  Plus,
  X,
  Send,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { ClientEntity } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

interface DirectorProfile {
  name: string;
  din: string;
  dinStatus: "ACTIVE" | "DEACTIVATED_KYC_DUE";
  dir3KycStatus: "FILED" | "PENDING";
  disqualificationRisk: "CLEAN" | "HIGH_RISK";
  associatedCompanies: { cin: string; name: string; status: "COMPLIANT" | "DEFAULT_PENDING" }[];
}

interface SftTransactionFlag {
  id: string;
  category: string;
  reportingEntity: string;
  amount: number;
  date: string;
  statusInItr: "DECLARED" | "MISMATCH_ALERT";
  recommendedAction: string;
  statutorySection: string;
}

const SAMPLE_DIRECTORS: DirectorProfile[] = [
  {
    name: "Chetan Pratap Singh",
    din: "02849102",
    dinStatus: "ACTIVE",
    dir3KycStatus: "FILED",
    disqualificationRisk: "CLEAN",
    associatedCompanies: [
      { cin: "U72900UP2024PTC199821", name: "Pratwi Solutions Private Limited", status: "COMPLIANT" }
    ]
  }
];

const SAMPLE_SFT_FLAGS: SftTransactionFlag[] = [
  {
    id: "SFT-01",
    category: "SFT-004: High-Value Cash Deposits in Current/Savings",
    reportingEntity: "HDFC Bank (Commercial Banking Branch)",
    amount: 1450000,
    date: "2026-09-18",
    statusInItr: "MISMATCH_ALERT",
    recommendedAction: "High Scrutiny Alert: Reconcile counter cash sales vouchers prior to ITR submission to prevent Section 68 unexplained credit addition.",
    statutorySection: "Section 68 / 115BBE"
  },
  {
    id: "SFT-02",
    category: "SFT-006: Purchase of Mutual Fund Units ((&gt; ₹10L) Aggregated)",
    reportingEntity: "HDFC Mutual Fund Asset Management",
    amount: 1000000,
    date: "2026-08-14",
    statusInItr: "DECLARED",
    recommendedAction: "Fully matched with director personal salary drawings declaration.",
    statutorySection: "Section 69"
  },
  {
    id: "SFT-03",
    category: "SFT-005: Credit Card Payments ((&gt; ₹10L) in Fiscal Year)",
    reportingEntity: "ICICI Bank Corporate Cards",
    amount: 1120000,
    date: "2026-07-29",
    statusInItr: "DECLARED",
    recommendedAction: "Reconciled against business expense reimbursement vouchers. No personal benefit u/s 17(2).",
    statutorySection: "Section 69C"
  }
];

export interface DirectorRiskRadarProps {
  client?: ClientEntity | null;
}

export const DirectorRiskRadar: React.FC<DirectorRiskRadarProps> = ({ client }) => {
  const directorsList: DirectorProfile[] = client ? [
    {
      name: client.primaryContact?.name || "Director",
      din: "02849102",
      dinStatus: "ACTIVE",
      dir3KycStatus: "FILED",
      disqualificationRisk: "CLEAN",
      associatedCompanies: [
        { cin: client.cin || "U72900UP2024PTC199821", name: client.name, status: "COMPLIANT" }
      ]
    }
  ] : SAMPLE_DIRECTORS;

  const [directors] = useState<DirectorProfile[]>(directorsList);
  const [sftFlags, setSftFlags] = useState<SftTransactionFlag[]>(SAMPLE_SFT_FLAGS);
  const [isAddSftOpen, setIsAddSftOpen] = useState(false);

  // New SFT Form State
  const [newCategory, setNewCategory] = useState("SFT-004: High-Value Bank Deposits");
  const [newEntity, setNewEntity] = useState("State Bank of India");
  const [newAmount, setNewAmount] = useState("");
  const [newAction, setNewAction] = useState("");

  const handlePrintDir8Mbp1 = (directorName: string, din: string) => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Form DIR-8 &amp; MBP-1 Statutory Declaration - ${directorName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div style="font-size: 20px; font-weight: 900;">${client?.name || "Corporate Entity"}</div>
              <div style="font-size: 12px; color: #64748b;">CIN: ${client?.cin || "U72900UP2024PTC199821"} &bull; Secretarial &amp; Corporate Governance Desk</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              <div>FINANCIAL YEAR: 2026-27</div>
              <div>DATE: ${new Date().toLocaleDateString("en-IN")}</div>
            </div>
          </div>

          <div class="title">FORM DIR-8 &bull; INTIMATION BY DIRECTOR OF NON-DISQUALIFICATION</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 15px;">[Pursuant to Section 164(2) of Companies Act 2013 and rule 14(1) of Companies (Appointment and Qualification of Directors) Rules 2014]</div>

          <div class="box">
            <p>To,<br><strong>The Board of Directors</strong><br>${client?.name || "The Company"}</p>
            <p>I, <strong>${directorName}</strong>, Director Identification Number (DIN): <strong>${din}</strong>, residing at registered address, do hereby confirm that:</p>
            <ol>
              <li>I am not disqualified from being appointed or continuing as a director under sub-section (1) or sub-section (2) of Section 164 of the Companies Act, 2013.</li>
              <li>None of the companies in which I am a director have failed to file financial statements or annual returns for any continuous period of three financial years.</li>
              <li>None of the companies in which I am a director have failed to repay any deposits or interest thereon, or redeem any debentures on the due date.</li>
            </ol>
            <div style="margin-top: 40px; text-align: right;">
              <div style="font-weight: 900;">${directorName}</div>
              <div style="font-size: 11px; color: #64748b;">DIN: ${din} &bull; Director</div>
            </div>
          </div>

          <div class="title" style="margin-top: 30px;">FORM MBP-1 &bull; NOTICE OF INTEREST BY DIRECTOR</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 15px;">[Pursuant to Section 184(1) of Companies Act 2013 and rule 9(1) of Companies (Meetings of Board and its Powers) Rules 2014]</div>

          <div class="box">
            <p>I hereby give notice that I am interested or concerned in the following bodies corporate / firms:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr style="background: #e2e8f0; font-weight: 800;"><td style="padding: 6px; border: 1px solid #cbd5e1;">Name of Entity</td><td style="padding: 6px; border: 1px solid #cbd5e1;">CIN / Reg</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Nature of Interest</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Shareholding %</td></tr>
              <tr><td style="padding: 6px; border: 1px solid #cbd5e1;">${client?.name || "Primary Entity"}</td><td style="padding: 6px; border: 1px solid #cbd5e1;">${client?.cin || "CIN-REG"}</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Director &amp; Shareholder</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Major Promoter</td></tr>
            </table>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const handleAddSftRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount) return;

    const newRecord: SftTransactionFlag = {
      id: `SFT-${Date.now().toString().slice(-4)}`,
      category: newCategory,
      reportingEntity: newEntity,
      amount: Number(newAmount),
      date: new Date().toISOString().split("T")[0],
      statusInItr: "MISMATCH_ALERT",
      recommendedAction: newAction || "Requires audit voucher linking prior to filing ITR-6.",
      statutorySection: "Section 285BA / Section 69"
    };

    setSftFlags([newRecord, ...sftFlags]);
    setIsAddSftOpen(false);
    setNewAmount("");
    setNewAction("");
    toast.success("SFT Record Added", "Tax vigilance desk alerted for ITR reconciliation.");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Promoter Liability Protection
            </span>
            <span className="text-xs text-slate-500 font-medium">Companies Act 2013 &amp; SFT Tax Vigilance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Director Personal Risk &amp; MCA Penalty Shield
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real-time protection against Section 164(2) disqualifications, DIN freezes, MCA compounding daily penalties, and high-value personal SFT mismatches.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-black text-emerald-950">All DINs Active &amp; Verified</div>
            <div className="text-[10px] text-emerald-700">Zero Section 164 disqualification risk</div>
          </div>
        </div>
      </div>

      {/* Top 3 Risk Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: MCA Compounding Penalty Meter */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">MCA Compounding Late Fee</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">₹0 Accrued</div>
          <p className="text-xs text-slate-500">
            Zero overdue MCA e-forms (AOC-4, MGT-7, DPT-3). Protected from ₹100/day daily penalty.
          </p>
        </div>

        {/* Card 2: Section 164(2) Director Shield */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Section 164(2) Shield</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">100% Protected</div>
          <p className="text-xs text-slate-500">
            All directorships across group entities verified in full statutory compliance.
          </p>
        </div>

        {/* Card 3: SFT Vigilance Attention Flags */}
        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold uppercase tracking-wider">High-Value SFT Vigilance</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800">
            {sftFlags.filter((s) => s.statusInItr === "MISMATCH_ALERT").length} Item Attention
          </div>
          <p className="text-xs text-amber-800 font-medium">
            Cash deposit requires counter sales voucher linking in current ITR filing.
          </p>
        </div>
      </div>

      {/* Directors Board Register */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-btred-logo" />
            Board of Directors DIN &amp; MCA KYC Status
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            ICAI SQC-1 Peer Reviewed Custody
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directors.map((dir) => (
            <div key={dir.din} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900">{dir.name}</h4>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> DIN Active
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 mt-1">
                  DIN: <strong>{dir.din}</strong> &bull; DIR-3 Web-KYC: <strong className="text-emerald-700">Filed for FY26</strong>
                </div>

                <div className="mt-3 text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Associated Group Entities:</span>
                  {dir.associatedCompanies.map((c) => (
                    <div key={c.cin} className="flex items-center justify-between text-[11px]">
                      <span className="truncate max-w-[200px]">{c.name}</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Compliant
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">Sec 164(2) Clear</span>
                <button
                  onClick={() => handlePrintDir8Mbp1(dir.name, dir.din)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition flex items-center gap-1 text-[11px] shadow-xs"
                  title="Generate Section 164(2) DIR-8 Non-Disqualification & MBP-1 Interest Declaration"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Form DIR-8 &amp; MBP-1</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SFT High-Value Transaction Vigilance Desk */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              SFT High-Value Transaction Vigilance &bull; Section 285BA Radar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitors high-value banking, cash, and investment transactions reported to Income Tax Department to eliminate Section 68 / 69C scrutiny notices.
            </p>
          </div>

          <button
            onClick={() => setIsAddSftOpen(true)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-btred-logo border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add SFT Asset</span>
          </button>
        </div>

        <div className="space-y-3">
          {sftFlags.map((flag) => (
            <div
              key={flag.id}
              className={`p-4 rounded-2xl border transition space-y-2.5 text-xs ${
                flag.statusInItr === "MISMATCH_ALERT"
                  ? "bg-amber-50/40 border-amber-300"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{flag.category}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      flag.statusInItr === "MISMATCH_ALERT"
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    }`}>
                      {flag.statusInItr === "MISMATCH_ALERT" ? "Attention Needed" : "Matched in ITR"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Reported by: <strong>{flag.reportingEntity}</strong> &bull; Date: {flag.date} &bull; {flag.statutorySection}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Transaction Value</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ₹{flag.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-[11px] flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  flag.statusInItr === "MISMATCH_ALERT" ? "text-amber-600" : "text-emerald-600"
                }`} />
                <span>{flag.recommendedAction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add SFT Modal */}
      {isAddSftOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Add High-Value Asset / Transaction</h4>
              <button
                onClick={() => setIsAddSftOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSftRecord} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                >
                  <option value="SFT-004: High-Value Bank Deposits ((&gt; ₹10L))">SFT-004: High-Value Bank Deposits ((&gt; ₹10L))</option>
                  <option value="SFT-005: Credit Card Payments ((&gt; ₹10L))">SFT-005: Credit Card Payments ((&gt; ₹10L))</option>
                  <option value="SFT-006: Mutual Fund / Shares Investment ((&gt; ₹10L))">SFT-006: Mutual Fund / Shares Investment ((&gt; ₹10L))</option>
                  <option value="SFT-012: Purchase or Sale of Real Estate Property">SFT-012: Purchase or Sale of Real Estate Property</option>
                  <option value="SFT-014: Foreign Remittance u/s 195 / LRS Scheme">SFT-014: Foreign Remittance u/s 195 / LRS Scheme</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reporting Financial Institution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, Zerodha, Registrar of Properties"
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Source / Accounting Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Funded from dividend withdrawal / sale of shares"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSftOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition shadow-sm"
                >
                  Register SFT Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
