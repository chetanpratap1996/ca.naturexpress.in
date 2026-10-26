"use client";

import React, { useState } from "react";
import { 
  Building2, 
  ShieldCheck, 
  FolderLock, 
  FileText, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  HelpCircle,
  Clock,
  Layers
} from "lucide-react";
import { ENTITY_DNA_REGISTRY, evaluateEntityThresholds } from "@/lib/config/entityDna";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { EntityType } from "@/lib/types";

export const EntityDnaMatrixViewer: React.FC = () => {
  const { clients } = useTaxoData();
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [overrideType, setOverrideType] = useState<EntityType | "DEFAULT">("DEFAULT");

  const currentClient = (clients && clients.length > 0)
    ? (clients.find(c => c.id === selectedEntityId) || clients[0])
    : null;
  const activeType: EntityType = overrideType !== "DEFAULT" 
    ? overrideType 
    : (currentClient?.type || "PVT_LTD");
  const dnaProfile = ENTITY_DNA_REGISTRY[activeType] || ENTITY_DNA_REGISTRY.PVT_LTD;

  // Threshold evaluation
  const thresholds = evaluateEntityThresholds(
    currentClient?.turnoverCr || 5.0,
    4, // 4% cash (96% digital)
    true, // has MSME suppliers
    activeType
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Entity DNA &amp; Compliance Matrix
            </span>
            <span className="text-xs text-slate-500 font-medium">Automatic Constitution-Driven Architecture</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Dynamic Entity Compliance Engine
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Dynamic forms, statutory thresholds, and vault taxonomies mapped to legal constitution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedEntityId || currentClient?.id || ""}
              onChange={(e) => {
                setSelectedEntityId(e.target.value);
                setOverrideType("DEFAULT");
              }}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {clients.length === 0 ? (
                <option value="">No clients onboarded</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-purple-50/70 border border-purple-200 rounded-2xl px-3 py-1.5">
            <Scale className="w-4 h-4 text-purple-600" />
            <select
              value={overrideType}
              onChange={(e) => setOverrideType(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-purple-900 outline-none cursor-pointer"
            >
              <option value="DEFAULT">Constitution: Auto ({currentClient?.type || "PVT_LTD"})</option>
              <option value="PVT_LTD">Test as: Private Limited (Pvt Ltd)</option>
              <option value="LLP">Test as: Limited Liability Partnership (LLP)</option>
              <option value="PARTNERSHIP">Test as: Partnership Firm</option>
              <option value="TRUST_NGO">Test as: Section 8 / Charitable Trust</option>
              <option value="PROPRIETORSHIP">Test as: Sole Proprietorship</option>
              <option value="INDIVIDUAL_HNI">Test as: Individual HNWI</option>
            </select>
          </div>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-300">
              Active Constitution Profile
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">{dnaProfile.label}</h3>
            <p className="text-xs text-slate-300 mt-1">
              Governed by: <strong>{dnaProfile.governingBody}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">Statutory Tax Return</span>
              <span className="text-sm font-black text-emerald-400">{dnaProfile.taxReturnForm}</span>
            </div>
            <div className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">CARO 2020</span>
              <span className={`text-sm font-black ${dnaProfile.caroApplicability ? "text-amber-400" : "text-slate-400"}`}>
                {dnaProfile.caroApplicability ? "Mandatory" : "Exempt"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Statutory Thresholds Live Evaluation */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Tax Audit u/s 44AB</span>
            <div className="text-sm font-black mt-1 text-white">
              {thresholds.taxAuditApplicable ? "⚠️ Mandatory" : "✅ Exempt"}
            </div>
            <div className="text-[10px] text-slate-300 mt-1">
              Threshold: ₹{thresholds.auditThresholdCr} Cr (96% Digital transactions)
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">e-Invoicing Mandate</span>
            <div className="text-sm font-black mt-1 text-white">
              {thresholds.eInvoicingMandatory ? "⚡ Active (₹5 Cr+)" : "⚪ Not Applicable"}
            </div>
            <div className="text-[10px] text-slate-300 mt-1">
              Turnover: ₹{currentClient?.turnoverCr || 0} Cr
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Sec 43B(h) MSME Risk</span>
            <div className="text-sm font-black mt-1 text-amber-400">
              {thresholds.msmeDisallowanceRisk ? "Active Watchdog" : "No MSME Suppliers"}
            </div>
            <div className="text-[10px] text-slate-300 mt-1">
              45-day payment tracking enforced
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Primary Identifier</span>
            <div className="text-xs font-black mt-1 text-indigo-300 truncate">
              {dnaProfile.primaryIdentifierLabel.split(" ")[0]}
            </div>
            <div className="text-[10px] text-slate-300 mt-1 font-mono">
              {currentClient?.cin || currentClient?.pan || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Statutory Requirements Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Mandatory Legal Compliances for {dnaProfile.label} ({dnaProfile.mandatoryRequirements.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/60">
                <th className="p-3">Compliance Code &amp; Title</th>
                <th className="p-3">Governing Statute</th>
                <th className="p-3">Frequency</th>
                <th className="p-3">Statutory Timeline</th>
                <th className="p-3">Default Penalty Clause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dnaProfile.mandatoryRequirements.map((req) => (
                <tr key={req.code} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-slate-900">
                    <span className="text-[10px] text-indigo-600 font-mono block">{req.code}</span>
                    {req.title}
                  </td>
                  <td className="p-3 font-medium text-slate-600">{req.governingAct}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[10px]">
                      {req.frequency}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{req.dueDateDescription}</td>
                  <td className="p-3 text-rose-600 font-semibold">{req.penaltyClause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Document Vault Taxonomies */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FolderLock className="w-5 h-5 text-emerald-600" />
          Dynamic Document Vault Taxonomy (Tailored for {dnaProfile.label})
        </h3>
        <p className="text-xs text-slate-500">
          The client upload portal and article audit trays adapt to display only these categories for this constitution.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dnaProfile.vaultCategories.map((vault) => (
            <div key={vault.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{vault.name}</span>
                {vault.mandatoryForFiling && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    Mandatory for Audit
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">{vault.description}</p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <span>Accepted Formats:</span>
                {vault.requiredFileTypes.map((ext) => (
                  <span key={ext} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-bold">
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
