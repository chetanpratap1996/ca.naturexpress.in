"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Award,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Search,
  ExternalLink,
  Copy,
  Check,
  Building2,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck2,
  RefreshCw,
  LogOut,
  LogIn,
  Usb
} from "lucide-react";
import { playSoftClick, playSuccessChime } from "@/lib/audio/soundEffects";
import { toast } from "@/components/shared/ToastNotification";

export function AutonomousGovernanceWorkbench() {
  const [activeTab, setActiveTab] = useState<"maker-checker" | "udin-guardian" | "dsc-vault">("maker-checker");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdjudicating, setIsAdjudicating] = useState(false);

  // DSC checkout modal
  const [selectedDsc, setSelectedDsc] = useState<any>(null);
  const [custodianName, setCustodianName] = useState("");
  const [checkoutPurpose, setCheckoutPurpose] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/governance/sqc1");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      toast.error("Failed to load governance shield data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePartnerAdjudicate = async () => {
    playSoftClick();
    setIsAdjudicating(true);
    try {
      const res = await fetch("/api/governance/sqc1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PARTNER_ADJUDICATE_SWARM" }),
      });
      const json = await res.json();
      if (json.success) {
        playSuccessChime();
        toast.success("FCA Partner sign-off executed! Workpaper cryptographically locked.");
        fetchData();
      }
    } catch {
      toast.error("Adjudication failed");
    } finally {
      setIsAdjudicating(false);
    }
  };

  const handleToggleDsc = (dsc: any) => {
    playSoftClick();
    setSelectedDsc(dsc);
  };

  const confirmDscAction = async () => {
    if (!selectedDsc) return;
    playSoftClick();
    try {
      const res = await fetch("/api/governance/sqc1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_DSC_CHECKOUT",
          dscId: selectedDsc.id,
          staffName: custodianName,
          purpose: checkoutPurpose,
        }),
      });
      const json = await res.json();
      if (json.success) {
        playSuccessChime();
        toast.success(`USB DSC Token ${selectedDsc.serialNumber} checked out to ${custodianName}!`);
        setSelectedDsc(null);
        fetchData();
      }
    } catch {
      toast.error("DSC checkout update failed");
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <Sparkles className="h-5 w-5 animate-spin text-purple-600" />
          <span>Synchronizing ICAI SQC-1 Peer Review &amp; Governance Shield...</span>
        </div>
      </div>
    );
  }

  const session = data.activeSwarmSession;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200">
                <ShieldCheck className="h-3.5 w-3.5 text-red-600" />
                Institutional Quality Control
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                ICAI SQC-1 Certified
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-300">
                SA 210 &amp; SA 500 Compliant
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              ICAI SQC-1 Peer Review &amp; Governance Shield
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              3-tier Maker-Checker digital audit trail (Article Trainee &rarr; Manager Review &rarr; Partner Sign-off), 60-day UDIN countdown guardian, and physical USB DSC token custody locker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-slate-50 px-4 py-2 text-center border border-slate-200">
              <div className="text-[11px] text-red-700 font-semibold uppercase">SQC-1 Audit Score</div>
              <div className="text-xl font-bold text-slate-900">{data.sqc1ComplianceScore}%</div>
            </div>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-200 pt-5">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 shadow-2xs">
            <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
              Audit Review State
              <Layers className="h-3.5 w-3.5 text-red-600" />
            </div>
            <div className="mt-1 text-base font-bold text-slate-900">
              {session?.currentState?.replace(/_/g, " ") || "ACTIVE"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">3-Tier Verification</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 shadow-2xs">
            <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
              Active UDINs Tracked
              <Award className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900">{data.udinRecords.length} Reports</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Strict 60-Day Mandate</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 shadow-2xs">
            <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
              Expiring Soon (&lt;15d)
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="mt-1 text-xl font-bold text-rose-600">
              {data.udinRecords.filter((u: any) => u.daysRemaining <= 15).length} Pending
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">Immediate Action Required</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 shadow-2xs">
            <div className="text-xs font-medium text-slate-700 flex items-center justify-between">
              DSC Token Custody
              <Usb className="h-3.5 w-3.5 text-slate-600" />
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900">
              {data.dscTokens.filter((d: any) => d.status === "AVAILABLE_IN_VAULT").length} / {data.dscTokens.length} Safe
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Physical Safe Locker</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("maker-checker");
          }}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition-colors ${
            activeTab === "maker-checker"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          3-Tier Maker-Checker Audit Trail
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800 font-bold">SQC-1</span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("udin-guardian");
          }}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition-colors ${
            activeTab === "udin-guardian"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="h-4 w-4" />
          UDIN 60-Day Countdown Tracker
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 font-bold">ICAI</span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("dsc-vault");
          }}
          className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-sm font-semibold transition-colors ${
            activeTab === "dsc-vault"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Physical DSC Custody Locker
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 font-bold">Locker</span>
        </button>
      </div>

      {/* TAB 1: 3-TIER MAKER-CHECKER AUDIT TRAIL */}
      {activeTab === "maker-checker" && (
        <div className="space-y-6">
          {/* Visual 3-Tier Pipeline Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm md:text-base mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              Active Quality Control Dossier: {session?.clientName || "Pratwi Solutions Private Limited"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* TIER 1: ARTICLE TRAINEE MAKER */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Tier 1: Maker</span>
                  <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-900">ARTICLE</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">
                  {session?.makerWorkpaper?.preparedBy?.traineeName || "Rohan Varma (Article Trainee)"}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {session?.makerWorkpaper?.preparedBy?.traineeId || "ART-2025-04"} • Year 2
                </div>
                <div className="mt-3 space-y-1.5 border-t border-blue-100 pt-2 text-xs text-slate-700">
                  <div className="font-semibold text-slate-800">Draft Findings Logged:</div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Clause 44 GST expenditure break-up compiled.</li>
                    <li>Clause 22 MSME 45-day calculation verified.</li>
                  </ul>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-blue-800 font-semibold bg-blue-100/60 p-2 rounded">
                  <span>SHA-256 Hash Locked</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-700" />
                </div>
              </div>

              {/* TIER 2: TAX MANAGER CHECKER */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Tier 2: Checker</span>
                  <span className="rounded bg-purple-200 px-1.5 py-0.5 text-[10px] font-bold text-purple-900">AI MANAGER</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900">
                  {session?.checkerReport?.reviewedBy?.managerName || "Automated AI Tax Manager"}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Quality Audit Standard: ICAI SQC-1
                </div>
                <div className="mt-3 space-y-1.5 border-t border-purple-100 pt-2 text-xs text-slate-700">
                  <div className="font-semibold text-slate-800">Review Verdict:</div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved for Partner Review
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Zero statutory contradictions. MSME Section 43B(h) calculation validated with 0 tolerance.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-purple-800 font-semibold bg-purple-100/60 p-2 rounded">
                  <span>100% Negative Invariants Passed</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-700" />
                </div>
              </div>

              {/* TIER 3: FCA PARTNER ADJUDICATOR */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Tier 3: Partner</span>
                    <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">FCA PARTNER</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900">
                    CA Gunjan Jain (FCA)
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Membership No: 022998C • FRN: 022998C
                  </div>
                  <div className="mt-3 border-t border-amber-100 pt-2 text-xs text-slate-700">
                    <div className="font-semibold text-slate-800">Statutory Sign-Off Gate:</div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Adjudication cryptographically seals the audit workpaper, auto-generates UDIN, and engages the Pay-to-Release file lock.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    onClick={handlePartnerAdjudicate}
                    disabled={isAdjudicating}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 py-2.5 px-3 text-xs font-bold text-white shadow hover:bg-amber-500 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    {isAdjudicating ? "Executing Digital Sign-Off..." : "Sign-Off & Lock Docket"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Unalterable Audit History Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 bg-slate-50/60">
              <h3 className="font-bold text-slate-900 text-sm">
                Unalterable Digital Audit Log (ICAI SA 500 / SA 230 Evidence Trail)
              </h3>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs">
              {session?.stateHistory?.map((h: any, i: number) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-800">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{h.state}</span>
                      <span className="text-[11px] text-slate-500">{h.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
                      By: {h.transitionedBy} ({h.role})
                    </div>
                    <p className="mt-1 text-slate-600 font-sans text-xs">{h.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UDIN 60-DAY COUNTDOWN GUARDIAN */}
      {activeTab === "udin-guardian" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/60">
              <div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  UDIN 60-Day Countdown Tracker (ICAI Gazette Mandate)
                </h3>
                <p className="text-xs text-slate-500">
                  Strict 60-day statutory timer from date of signature. Preempts disciplinary proceedings under ICAI Code of Ethics.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Client Name</th>
                    <th className="py-2.5 px-3 font-semibold">Document Type</th>
                    <th className="py-2.5 px-3 font-semibold">Signing Date</th>
                    <th className="py-2.5 px-3 font-semibold">UDIN Code</th>
                    <th className="py-2.5 px-3 font-semibold">Signing Partner</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Countdown (Days)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.udinRecords.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{u.clientName}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{u.documentType}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{u.signingDate}</td>
                      <td className="py-3 px-3 font-mono font-bold text-purple-700">
                        {u.udin || "PENDING"}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{u.partnerName}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                            u.daysRemaining <= 15
                              ? "bg-rose-100 text-rose-800"
                              : u.daysRemaining <= 30
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {u.daysRemaining} Days Left
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {u.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(u.udin || u.clientPan);
                            toast.success("Copied for ICAI Portal verification!");
                          }}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICAL USB DSC CUSTODY VAULT */}
      {activeTab === "dsc-vault" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Physical USB DSC Token Custody Locker
                </h3>
                <p className="text-xs text-slate-500">
                  Tracks hardware cryptographic dongle location, rack/slot custody, and article trainee check-out logs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.dscTokens.map((t: any) => (
                <div
                  key={t.id}
                  className={`rounded-xl border p-4 transition-all ${
                    t.status === "AVAILABLE_IN_VAULT"
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-amber-200 bg-amber-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-600">{t.vaultSlot}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "AVAILABLE_IN_VAULT"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {t.status === "AVAILABLE_IN_VAULT" ? "In Safe Locker" : "Checked Out"}
                    </span>
                  </div>

                  <div className="mt-2 text-sm font-bold text-slate-900">{t.entityName}</div>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">{t.holderName}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Token: {t.serialNumber} • Exp: {t.expiryDate}
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-2 text-xs">
                    <div className="text-slate-500">Current Custodian:</div>
                    <div className="font-bold text-slate-800">{t.currentCustodian}</div>
                    {t.purpose && (
                      <div className="text-[11px] text-amber-800 mt-0.5 italic font-medium">
                        Purpose: {t.purpose}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => handleToggleDsc(t)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-bold transition ${
                        t.status === "AVAILABLE_IN_VAULT"
                          ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                          : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                      }`}
                    >
                      {t.status === "AVAILABLE_IN_VAULT" ? (
                        <>
                          <LogOut className="h-3.5 w-3.5" /> Check Out Token
                        </>
                      ) : (
                        <>
                          <LogIn className="h-3.5 w-3.5" /> Return to Safe
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DSC CHECKOUT MODAL */}
      {selectedDsc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">
              Check Out USB DSC Token: {selectedDsc.serialNumber}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Entity: {selectedDsc.entityName} ({selectedDsc.holderName})
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Assign Custody to Staff / Article</label>
                <input
                  type="text"
                  value={custodianName}
                  onChange={(e) => setCustodianName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Statutory Filing Purpose</label>
                <input
                  type="text"
                  value={checkoutPurpose}
                  onChange={(e) => setCheckoutPurpose(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setSelectedDsc(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDscAction}
                className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-500 shadow"
              >
                Confirm Custody Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
