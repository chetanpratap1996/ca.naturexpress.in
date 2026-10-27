"use client";

import React, { useState, useMemo } from "react";
import { 
  FileCheck, 
  Printer, 
  Download, 
  Building2, 
  User, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign,
  FileSpreadsheet
} from "lucide-react";
import { ClientEntity } from "@/lib/types";

interface EngagementLetterGeneratorProps {
  clients?: ClientEntity[];
  initialClient?: ClientEntity | null;
}

export const EngagementLetterGenerator: React.FC<EngagementLetterGeneratorProps> = ({
  clients = [],
  initialClient = null,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClient?.id || (clients.length > 0 ? clients[0].id : "")
  );

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Engagement Details
  const [engagementType, setEngagementType] = useState<
    "TAX_AUDIT_44AB" | "STATUTORY_AUDIT_COMPANIES_ACT" | "GST_RETAINER" | "ITR_AND_TAX_PLANNING"
  >("TAX_AUDIT_44AB");

  const [financialYear, setFinancialYear] = useState<string>("FY 2025-26 (AY 2026-27)");
  const [professionalFee, setProfessionalFee] = useState<number>(45000);
  const [partnerSignatory, setPartnerSignatory] = useState<string>("CA Sahil Jain, FCA");
  const [membershipNo, setMembershipNo] = useState<string>("514289");
  const [firmRegNo, setFirmRegNo] = useState<string>("019284C");

  const handlePrint = () => {
    window.print();
  };

  const getEngagementScopeTitle = () => {
    switch (engagementType) {
      case "TAX_AUDIT_44AB":
        return "Tax Audit under Section 44AB of the Income Tax Act, 1961 (Form 3CA/3CB and Form 3CD)";
      case "STATUTORY_AUDIT_COMPANIES_ACT":
        return "Statutory Audit of Financial Statements under Section 139 of the Companies Act, 2013";
      case "GST_RETAINER":
        return "GST Compliance, ITC Reconciliation (GSTR-2B vs Books) & GSTR-9/9C Representation Retainer";
      case "ITR_AND_TAX_PLANNING":
        return "Preparation, Verification & E-Filing of Income Tax Return & Scrutiny Representation";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-700/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> ICAI SA 210 Standard Compliant
              </span>
              <span className="text-xs text-slate-400 font-mono">1-Click Legal Retainer Generator</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-emerald-400" /> Automated Engagement Letters &amp; Retainer Agreements
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Eliminate professional liability risk and satisfy ICAI Peer Review mandates. Generates official SA-210 letters of engagement with statutory clauses for CARO 2020, UDIN obligations, and fee payment schedules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Letter</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Select Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
            >
              {clients.length === 0 ? (
                <option value="">No clients loaded (Manual entry)</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.pan})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Engagement Scope</label>
            <select
              value={engagementType}
              onChange={(e) => setEngagementType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
            >
              <option value="TAX_AUDIT_44AB">Tax Audit (Sec 44AB - 3CD)</option>
              <option value="STATUTORY_AUDIT_COMPANIES_ACT">Statutory Audit (Co. Act 2013)</option>
              <option value="GST_RETAINER">GST Retainer &amp; GSTR-9/9C</option>
              <option value="ITR_AND_TAX_PLANNING">ITR Filing &amp; Representation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Financial Year</label>
            <input
              type="text"
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Agreed Fee (₹)</label>
            <input
              type="number"
              value={professionalFee}
              onChange={(e) => setProfessionalFee(Number(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Engagement Letter Preview Container */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 sm:p-12 shadow-2xl font-serif max-w-4xl mx-auto space-y-6 text-xs sm:text-sm leading-relaxed">
        {/* Letterhead Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 font-sans">
              BRAINS &amp; TAXES ASSOCIATES
            </h2>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Chartered Accountants | Firm Registration No: {firmRegNo}
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              305-A Anmol Tower, Old Palasia, Indore, MP 452001 | contact@brainsandtaxes.com
            </p>
          </div>
          <div className="text-right font-sans text-xs">
            <span className="font-bold text-slate-700">Ref: BTA/ENG/{new Date().getFullYear()}/042</span>
            <div className="text-slate-500 mt-1">Date: {new Date().toLocaleDateString("en-IN")}</div>
          </div>
        </div>

        {/* Addressed To */}
        <div className="space-y-1 font-sans text-xs">
          <p className="font-bold text-slate-900">To,</p>
          <p className="font-bold text-base text-slate-900">{selectedClient?.name || "The Board of Directors / Authorized Partner"}</p>
          <p className="text-slate-700">{selectedClient?.groupName || "Promoter Office"}</p>
          <p className="text-slate-700">PAN: {selectedClient?.pan || "ABCDE1234F"} | GSTIN: {selectedClient?.gstin || "23AAACB1234L1Z2"}</p>
        </div>

        {/* Subject */}
        <div className="bg-slate-50 border-l-4 border-slate-900 p-3 font-sans font-bold text-xs">
          SUBJECT: Engagement Letter for {getEngagementScopeTitle()} for {financialYear}
        </div>

        {/* Body Paragraphs */}
        <div className="space-y-4 text-justify">
          <p>Dear Sir(s) / Madam,</p>

          <p>
            You have requested that we accept the appointment as the professional accountants / auditors to perform <strong>{getEngagementScopeTitle()}</strong> for <strong>{selectedClient?.name || "the Client entity"}</strong> for <strong>{financialYear}</strong>. We are pleased to confirm our acceptance and our understanding of this engagement by means of this letter, formulated in accordance with <strong>Standard on Auditing (SA) 210</strong> issued by the Institute of Chartered Accountants of India (ICAI).
          </p>

          <div>
            <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
              1. Scope of Professional Services
            </h4>
            <p>
              Our examination and verification will be conducted in accordance with the applicable Standards on Auditing and Guidance Notes issued by the ICAI, the Income Tax Act 1961, and the Central Goods and Services Tax Act 2017. Those standards require that we comply with ethical requirements and plan and perform the engagement to obtain reasonable assurance whether the financial records and statutory disclosures are free from material misstatement.
            </p>
          </div>

          <div>
            <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
              2. Management Responsibilities
            </h4>
            <p>
              Our audit / compilation will be conducted on the basis that management acknowledges and understands that they have responsibility for:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
              <li>The preparation and fair presentation of the financial statements in accordance with applicable Accounting Standards.</li>
              <li>Such internal control as management determines is necessary to enable the preparation of tax returns that are free from material misstatement, whether due to fraud or error.</li>
              <li>Providing us with unrestricted access to all information, bank statements, purchase bills, and vendor MSME classification data (Section 43B(h)).</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
              3. Unique Document Identification Number (UDIN)
            </h4>
            <p>
              In compliance with ICAI Council Mandates, all tax audit reports (Form 3CA/3CB/3CD) and certificates generated under this engagement will carry a valid system-generated 18-digit UDIN, verifiable by statutory tax authorities on the official ICAI portal.
            </p>
          </div>

          <div>
            <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
              4. Professional Fees and Billing Terms
            </h4>
            <p>
              Our agreed professional fee for the services described above is fixed at <strong>₹{professionalFee.toLocaleString("en-IN")}</strong> (Rupees {professionalFee.toLocaleString("en-IN")} only), exclusive of applicable Goods &amp; Services Tax (GST @ 18%) and out-of-pocket expenses. Invoices are payable within 15 days of presentation.
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-8 font-sans text-xs">
          <div className="border-t border-slate-400 pt-3">
            <p className="font-bold text-slate-900">For Brains &amp; Taxes Associates</p>
            <p className="text-slate-600">Chartered Accountants (FRN: {firmRegNo})</p>
            <div className="mt-8">
              <p className="font-bold text-slate-900">{partnerSignatory}</p>
              <p className="text-slate-500">Partner | M. No. {membershipNo}</p>
            </div>
          </div>

          <div className="border-t border-slate-400 pt-3 text-right">
            <p className="font-bold text-slate-900">Acknowledged &amp; Accepted:</p>
            <p className="text-slate-600">For {selectedClient?.name || "Client Entity"}</p>
            <div className="mt-8">
              <p className="font-bold text-slate-900">Authorized Signatory</p>
              <p className="text-slate-500">Name &amp; Designation / Rubber Stamp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
