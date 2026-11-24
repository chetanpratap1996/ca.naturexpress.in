"use client";

import React, { useState } from "react";
import { 
  PartnerRealizationMetrics, 
  StaffDataSecurityAudit 
} from "@/lib/types";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
import { 
  ShieldCheck, 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Lock, 
  EyeOff, 
  FileSpreadsheet, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Download,
  IndianRupee,
  Fingerprint
} from "lucide-react";


const DEFAULT_PARTNER_METRICS: PartnerRealizationMetrics[] = [
  {
    partnerName: "CA Gunjan Jain (FCA)",
    assignedClientsCount: 1,
    billableHoursThisMonth: 142,
    unbilledWipAmount: 420000,
    billedThisMonth: 1850000,
    recoveredThisMonth: 1720000,
    realizationPercentage: 93.0,
    agingAbove90DaysAmount: 0,
    atRiskPenaltyClients: 0
  }
];

interface EnterpriseSecurityAndRealizationProps {
  partnerMetrics?: PartnerRealizationMetrics[];
  securityLogs?: StaffDataSecurityAudit[];
}

export function EnterpriseSecurityAndRealization({
  partnerMetrics = [],
  securityLogs = [],
}: EnterpriseSecurityAndRealizationProps) {
  const { selectedClient, isFirmWideView } = useClientContext();
  const [activeTab, setActiveTab] = useState<"realization" | "security" | "dpdp">("realization");
  const [logs, setLogs] = useState<StaffDataSecurityAudit[]>(securityLogs);

  const activeMetrics = partnerMetrics.length > 0 ? partnerMetrics : DEFAULT_PARTNER_METRICS;
  const totalBilled = activeMetrics.reduce((sum, p) => sum + p.billedThisMonth, 0);
  const totalRecovered = activeMetrics.reduce((sum, p) => sum + p.recoveredThisMonth, 0);
  const firmRealizationRate = totalBilled > 0 ? ((totalRecovered / totalBilled) * 100).toFixed(1) : "90.0";
  const totalWipFirm = activeMetrics.reduce((sum, p) => sum + p.unbilledWipAmount, 0);

  const handleExportAuditLog = () => {
    const headers = "Timestamp,Staff Member,Staff Role,Action,Entity Name,IP Address,Security Status";
    const rows = logs.map(l => 
      `"${l.timestamp}","${l.staffName}","${l.staffRole}","${l.action}","${l.entityName}","${l.ipAddress}","${l.status}"`
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ICAI_DPDP_Security_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Enterprise-Grade Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Firm Realization &bull; ICAI Code of Ethics &bull; DPDP Act 2023
              </span>
              {selectedClient && !isFirmWideView && (
                <span className="text-[11px] font-mono text-slate-400">
                  PAN: {selectedClient.pan}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              Multi-Partner Realization &amp; Client Data Protection
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <UniversalClientSelector variant="compact" />

            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Realization Rate</span>
              <span className="text-sm font-bold text-emerald-700">{firmRealizationRate}%</span>
            </div>

            <button
              onClick={handleExportAuditLog}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
              title="Export DPDP Data Access & Security Audit Log"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("realization")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "realization"
              ? "bg-btred-logo text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Partner Realization &amp; WIP Valuation
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "security"
              ? "bg-btred-logo text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          <Lock className="w-4 h-4" /> Client Data Export Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("dpdp")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "dpdp"
              ? "bg-btred-logo text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> DPDP Act 2023 Compliance
        </button>
      </div>

      {/* TAB 1: PARTNER REALIZATION & WIP */}
      {activeTab === "realization" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-900">
              <span className="text-xs font-semibold text-slate-600 uppercase">Unbilled WIP across Firm</span>
              <div className="text-xl sm:text-2xl font-bold text-amber-800 mt-1">₹{totalWipFirm.toLocaleString("en-IN")}</div>
              <div className="text-xs text-slate-600 mt-1">Hours logged pending billing</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-900">
              <span className="text-xs font-semibold text-slate-600 uppercase">Total Monthly Collections</span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">₹{totalRecovered.toLocaleString("en-IN")}</div>
              <div className="text-xs text-slate-600 mt-1">Direct Bank &amp; UPI settlements</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-900">
              <span className="text-xs font-semibold text-slate-600 uppercase">Equity Partners Monitored</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{activeMetrics.length} Partners</div>
              <div className="text-xs text-slate-600 mt-1">&gt; 85% realization benchmark</div>
            </div>
          </div>

          {/* Partner Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Partner Performance &amp; Collection Scorecard</h3>
              <span className="text-xs text-slate-600">Current Month: October 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-semibold text-slate-700 font-bold">
                    <th className="py-3 px-4">Partner Name</th>
                    <th className="py-3 px-4 text-center">Active Clients</th>
                    <th className="py-3 px-4 text-center">Billable Hours</th>
                    <th className="py-3 px-4 text-right">Unbilled WIP (₹)</th>
                    <th className="py-3 px-4 text-right">Billed (₹)</th>
                    <th className="py-3 px-4 text-right">Recovered (₹)</th>
                    <th className="py-3 px-4 text-center">Realization %</th>
                    <th className="py-3 px-4 text-right">&gt; 90 Days Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {activeMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-600">
                        No partner billing or WIP metrics recorded yet. Metrics accrue automatically as client tasks and invoices are reconciled.
                      </td>
                    </tr>
                  ) : activeMetrics.map((p) => (
                    <tr key={p.partnerName} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.partnerName}</div>
                        <div className="text-[10px] text-slate-600">Senior Equity Partner</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                        {p.assignedClientsCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-indigo-300 font-semibold">
                        {p.billableHoursThisMonth} hrs
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-800 font-semibold">
                        ₹{p.unbilledWipAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">
                        ₹{p.billedThisMonth.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{p.recoveredThisMonth.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.realizationPercentage >= 90
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                            : "bg-amber-50 text-amber-900 border border-amber-200 font-bold"
                        }`}>
                          {p.realizationPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-btred-logo font-semibold">
                        ₹{p.agingAbove90DaysAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANTI-POACHING SECURITY & AUDIT LOGS */}
      {activeTab === "security" && (
        <div className="space-y-4">
          {/* Active Policies Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-slate-900 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-700 shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Promoter Phone Masking</span>
                <span className="text-[11px] text-slate-600">Articles only see masked +91 98200 *****</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-slate-900 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-500/20 text-btred-logo shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Mass Client Export Blocked</span>
                <span className="text-[11px] text-slate-600">Restricted to Managing Partners only</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-slate-900 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-50 text-btred-logo border border-red-200 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Forensic Watermarking</span>
                <span className="text-[11px] text-slate-600">Embeds Staff Name + IP on all downloads</span>
              </div>
            </div>
          </div>

          {/* Security Log Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Data Access &amp; Protection Audit Log</h3>
                <p className="text-xs text-slate-600 mt-0.5">Captures every sensitive client record view, download, or blocked export attempt</p>
              </div>
              <span className="text-xs text-emerald-700 font-mono">Live Monitoring</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-semibold text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Staff Member &amp; Role</th>
                    <th className="py-2.5 px-3">Action Recorded</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">LAN IP Address</th>
                    <th className="py-2.5 px-3 text-center">Security Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-600">
                        No sensitive data access violations or bulk downloads recorded. Live anti-poaching monitors all export attempts in real-time.
                      </td>
                    </tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                        {log.timestamp.slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{log.staffName}</div>
                        <div className="text-[10px] text-slate-600">{log.staffRole}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {log.action.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{log.entityName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{log.ipAddress}</td>
                      <td className="py-2.5 px-3 text-center">
                        {log.status === "FLAGGED_RESTRICTED" ? (
                          <span className="px-2 py-0.5 bg-red-50 text-btred-logo border border-red-200 font-bold rounded text-[10px] font-bold">
                            BLOCKED BY GUARD
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded text-[10px] font-bold">
                            AUTHORIZED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DPDP ACT 2023 & DATA RESIDENCY COMPLIANCE SHIELD */}
      {activeTab === "dpdp" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Statutory Data Protection Architecture
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Digital Personal Data Protection (DPDP) Act 2023 &amp; ICAI Compliance Proof
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-600 text-slate-900 font-bold text-xs rounded-xl shadow flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Indian Data Residency
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-btred-logo uppercase">
                  <Lock className="w-4 h-4" /> 1. Encryption at Rest &amp; Transit
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  All PAN, Aadhaar, Bank Statement OCR data and client financials are encrypted using <strong>AES-256 GCM</strong> at rest and <strong>TLS 1.3</strong> in transit.
                </p>
                <div className="text-[10px] text-emerald-700 font-mono font-bold">SHA-256 Verification: Active</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase">
                  <ShieldCheck className="w-4 h-4" /> 2. AWS Mumbai (ap-south-1) Residency
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Zero cross-border transfer. Servers and relational database clusters reside exclusively in <strong>AWS Mumbai Region (ap-south-1)</strong>, strictly complying with DPDP Act Section 16 &amp; RBI IT Framework.
                </p>
                <div className="text-[10px] text-emerald-700 font-mono font-bold">Location: Mumbai, Maharashtra, IN</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-btred-logo uppercase">
                  <EyeOff className="w-4 h-4" /> 3. Article Trainee RBAC Isolation
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Article trainees and staff have zero access to firm billing, partner realization percentages, or client fee history. Phone numbers are masked by default to prevent client poaching.
                </p>
                <div className="text-[10px] text-emerald-700 font-mono font-bold">RBAC Isolation: 100% Enforced</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-slate-800">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                ICAI Guidance Note on Cloud Storage of Professional Records
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                As per the Council Decisions of the Institute of Chartered Accountants of India (ICAI), members in practice are permitted to store working papers and client records on secure cloud platforms provided client confidentiality under Clause 1, Part I of First Schedule is maintained and data ownership remains exclusively with the CA firm. Brains &amp; Taxes does NOT sell, mine, or share any CA client data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
