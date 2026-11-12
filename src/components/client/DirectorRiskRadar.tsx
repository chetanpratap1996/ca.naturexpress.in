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
  Sparkles
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { ClientEntity } from "@/lib/types";

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
}

const SAMPLE_DIRECTORS: DirectorProfile[] = [
  {
    name: "Rajesh Sharma",
    din: "02849102",
    dinStatus: "ACTIVE",
    dir3KycStatus: "FILED",
    disqualificationRisk: "CLEAN",
    associatedCompanies: [
      { cin: "U29100MP2015PTC034120", name: "Apex AutoTech Private Limited", status: "COMPLIANT" }
    ]
  }
];

const SAMPLE_SFT_FLAGS: SftTransactionFlag[] = [
  {
    id: "SFT-01",
    category: "SFT-004: High-Value Cash Deposits in Current/Savings",
    reportingEntity: "HDFC Bank (Palasia Branch, Indore)",
    amount: 1450000,
    date: "2026-09-18",
    statusInItr: "MISMATCH_ALERT",
    recommendedAction: "High Scrutiny Alert: Verify cash sales vouchers before filing ITR to prevent Section 68 unexplained cash credit addition."
  },
  {
    id: "SFT-02",
    category: "SFT-006: Purchase of Mutual Fund Units (> ₹10L)",
    reportingEntity: "HDFC Mutual Fund Asset Management",
    amount: 1000000,
    date: "2026-08-14",
    statusInItr: "DECLARED",
    recommendedAction: "Fully matched with director's capital source declaration."
  },
  {
    id: "SFT-03",
    category: "SFT-005: Credit Card Payments (> ₹10L Aggregated)",
    reportingEntity: "ICICI Bank Credit Cards",
    amount: 1120000,
    date: "2026-07-29",
    statusInItr: "DECLARED",
    recommendedAction: "Examined against personal drawings in firm accounts. No unexplained expenditure u/s 69C."
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
        { cin: client.cin || "U74110MH2024PTC043716", name: client.name, status: "COMPLIANT" }
      ]
    }
  ] : SAMPLE_DIRECTORS;

  const [directors] = useState<DirectorProfile[]>(directorsList);
  const [sftFlags] = useState<SftTransactionFlag[]>(SAMPLE_SFT_FLAGS);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Promoter Liability Protection
            </span>
            <span className="text-xs text-slate-500 font-medium">Companies Act 2013 &amp; SFT Tax Vigilance</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Director Personal Risk &amp; MCA Penalty Shield
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time vigilance against Section 164(2) disqualifications, DIN freezes, MCA compounding daily penalties, and personal tax mismatches.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-black text-emerald-900">All DINs Active &amp; Verified</div>
            <div className="text-[10px] text-emerald-700">Zero disqualification risk detected</div>
          </div>
        </div>
      </div>

      {/* Top 3 Risk Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: MCA Compounding Penalty Meter */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">MCA Compounding Late Fee</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">₹0 Accrued</div>
          <p className="text-xs text-slate-500 mt-2">
            Zero overdue MCA e-forms (AOC-4, MGT-7, DPT-3). Saved from ₹100/day daily penalty.
          </p>
        </div>

        {/* Card 2: Section 164(2) Director Shield */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Section 164(2) Shield</span>
            <Scale className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">100% Protected</div>
          <p className="text-xs text-slate-500 mt-2">
            All directorships across group entities in full statutory compliance.
          </p>
        </div>

        {/* Card 3: SFT Vigilance Attention Flags */}
        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">High-Value SFT Flags</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700">1 Item Mismatch</div>
          <p className="text-xs text-amber-800 mt-2 font-medium">
            ₹18.5L cash deposit requires sale voucher linking in current ITR.
          </p>
        </div>
      </div>

      {/* Directors Board Register */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-btred-logo" />
          Board of Directors DIN &amp; MCA KYC Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directors.map((dir) => (
            <div key={dir.din} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{dir.name}</h4>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> DIN Active
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 mt-1">
                  DIN: <strong>{dir.din}</strong> &bull; DIR-3 Web-KYC: <strong className="text-emerald-600">Filed for FY26</strong>
                </div>

                <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700 block">Associated Group Entities:</span>
                  {dir.associatedCompanies.map(c => (
                    <div key={c.cin} className="flex items-center justify-between text-[11px]">
                      <span>{c.name}</span>
                      <span className="text-emerald-600 font-semibold">Compliant</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
                <span>MCA V3 Portal Synced: 24-Oct-2026</span>
                <span className="text-btred-logo font-semibold cursor-pointer hover:underline">
                  View MCA Master Data &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SFT / High-Value Transaction Flags Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            Income Tax Department SFT &amp; AIS High-Value Transaction Feed
          </h3>
          <span className="text-xs text-slate-500">Source: CBDT Project Insight</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/60">
                <th className="p-3">SFT Transaction Category</th>
                <th className="p-3">Reporting Institution</th>
                <th className="p-3 text-right">Reported Value</th>
                <th className="p-3">ITR Reconciliation Status</th>
                <th className="p-3">CA Advisory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sftFlags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">Zero High-Value Transaction Mismatches</div>
                    <div className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      All high-value banking and financial transactions reported under AIS/TIS Project Insight are clean and reconciled with annual ITR disclosures.
                    </div>
                  </td>
                </tr>
              ) : (
                sftFlags.map((flag) => (
                <tr key={flag.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-slate-900">{flag.category}</td>
                  <td className="p-3 font-medium text-slate-600">{flag.reportingEntity}</td>
                  <td className="p-3 text-right font-black text-slate-900">
                    {formatCurrencyINR(flag.amount)}
                  </td>
                  <td className="p-3">
                    {flag.statusInItr === "DECLARED" ? (
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-md flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reconciled in Books
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] rounded-md flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Potential Mismatch
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-slate-700 max-w-xs">{flag.recommendedAction}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
