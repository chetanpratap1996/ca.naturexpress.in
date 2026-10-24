"use client";

import React, { useState } from "react";
import { 
  PartnerRealizationMetrics, 
  StaffDataSecurityAudit 
} from "@/lib/types";
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

interface EnterpriseSecurityAndRealizationProps {
  partnerMetrics?: PartnerRealizationMetrics[];
  securityLogs?: StaffDataSecurityAudit[];
}

export function EnterpriseSecurityAndRealization({
  partnerMetrics = [],
  securityLogs = [],
}: EnterpriseSecurityAndRealizationProps) {
  const [activeTab, setActiveTab] = useState<"realization" | "security">("realization");
  const [logs, setLogs] = useState<StaffDataSecurityAudit[]>(securityLogs);

  const totalBilled = partnerMetrics.reduce((sum, p) => sum + p.billedThisMonth, 0);
  const totalRecovered = partnerMetrics.reduce((sum, p) => sum + p.recoveredThisMonth, 0);
  const firmRealizationRate = totalBilled > 0 ? ((totalRecovered / totalBilled) * 100).toFixed(1) : "90.0";
  const totalWipFirm = partnerMetrics.reduce((sum, p) => sum + p.unbilledWipAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-rose-300" /> Data Leak Protection Active
              </span>
              <span className="text-xs text-slate-400">ICAI Code of Ethics Part I Clause 1</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" /> Multi-Partner Realization &amp; Anti-Poaching Guard
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Protect firm equity and client confidentiality. Monitor partner-wise fee realization and WIP conversion while preventing article trainees from mass-exporting client databases or promoter contact books.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl min-w-[220px] text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Firm Realization Rate</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">{firmRealizationRate}%</div>
            <span className="text-xs text-slate-400 mt-0.5 block">₹{totalRecovered.toLocaleString("en-IN")} collected / ₹{totalBilled.toLocaleString("en-IN")} billed</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("realization")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "realization"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Partner Realization &amp; WIP Valuation
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === "security"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Lock className="w-4 h-4" /> Anti-Poaching &amp; Staff Security Logs ({logs.length})
        </button>
      </div>

      {/* TAB 1: PARTNER REALIZATION & WIP */}
      {activeTab === "realization" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase">Unbilled WIP across Firm</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">₹{totalWipFirm.toLocaleString("en-IN")}</div>
              <div className="text-xs text-slate-400 mt-1">Hours logged pending invoice generation</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Monthly Collections</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">₹{totalRecovered.toLocaleString("en-IN")}</div>
              <div className="text-xs text-slate-400 mt-1">Direct Bank &amp; UPI settlements</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase">Equity Partners Monitored</span>
              <div className="text-2xl font-bold text-white mt-1">{partnerMetrics.length} Partners</div>
              <div className="text-xs text-slate-400 mt-1">Realization above 85% benchmark</div>
            </div>
          </div>

          {/* Partner Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Partner Performance &amp; Collection Scorecard</h3>
              <span className="text-xs text-slate-400">Current Month: October 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
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
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {partnerMetrics.map((p) => (
                    <tr key={p.partnerName} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{p.partnerName}</div>
                        <div className="text-[10px] text-slate-400">Senior Equity Partner</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-200">
                        {p.assignedClientsCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-indigo-300 font-semibold">
                        {p.billableHoursThisMonth} hrs
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold">
                        ₹{p.unbilledWipAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">
                        ₹{p.billedThisMonth.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ₹{p.recoveredThisMonth.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.realizationPercentage >= 90
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {p.realizationPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400 font-semibold">
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
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Promoter Phone Masking</span>
                <span className="text-[11px] text-slate-400">Articles only see masked +91 98200 *****</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Mass Client Export Blocked</span>
                <span className="text-[11px] text-slate-400">Restricted to Managing Partners only</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Forensic Watermarking</span>
                <span className="text-[11px] text-slate-400">Embeds Staff Name + IP on all downloads</span>
              </div>
            </div>
          </div>

          {/* Security Log Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Live Data Access &amp; Protection Audit Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">Captures every sensitive client record view, download, or blocked export attempt</p>
              </div>
              <span className="text-xs text-emerald-400 font-mono">Live Monitoring</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Staff Member &amp; Role</th>
                    <th className="py-2.5 px-3">Action Recorded</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">LAN IP Address</th>
                    <th className="py-2.5 px-3 text-center">Security Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                        {log.timestamp.slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{log.staffName}</div>
                        <div className="text-[10px] text-slate-400">{log.staffRole}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">
                        {log.action.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{log.entityName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{log.ipAddress}</td>
                      <td className="py-2.5 px-3 text-center">
                        {log.status === "FLAGGED_RESTRICTED" ? (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                            BLOCKED BY GUARD
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
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
    </div>
  );
}
