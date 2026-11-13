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
  FileSpreadsheet,
  Send,
  ExternalLink,
  Plus,
  Clock,
  Lock,
  Copy,
  Check,
  Smartphone,
  Eye,
  FileText
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";
import { ClientAcceptanceModal, EngagementRecord } from "./engagement/ClientAcceptanceModal";
import { NewEngagementModal } from "./engagement/NewEngagementModal";

const DEFAULT_REALISTIC_ENGAGEMENTS: EngagementRecord[] = [
  {
    id: "eng-1",
    refNo: "GPA/ENG/2026/042",
    clientId: "CL-01",
    clientName: "Apex AutoTech Private Limited",
    clientPan: "AABCA8891D",
    clientGstin: "23AABCA8891D1Z2",
    groupName: "The Apex Industrial Group",
    scopeType: "TAX_AUDIT_44AB",
    scopeTitle: "Tax Audit under Section 44AB of the Income Tax Act, 1961 (Form 3CA/3CB and Form 3CD)",
    financialYear: "FY 2025-26 (AY 2026-27)",
    professionalFee: 45000,
    status: "COUNTERSIGNED_VALID",
    issueDate: "2026-10-10",
    acceptedDate: "2026-10-12 14:22:05 IST",
    signatoryName: "Rajesh Sharma",
    signatoryDesignation: "Managing Director",
    signatoryIp: "103.21.144.18 (Mumbai, Maharashtra)"
  },
  {
    id: "eng-2",
    refNo: "GPA/ENG/2026/038",
    clientId: "CL-02",
    clientName: "Pratwi Solutions Private Limited",
    clientPan: "AABCP8819E",
    clientGstin: "23AABCP8819E1Z4",
    groupName: "Pratwi Technologies",
    scopeType: "STATUTORY_AUDIT_COMPANIES_ACT",
    scopeTitle: "Statutory Audit of Financial Statements under Section 139 of the Companies Act, 2013 & CARO 2020",
    financialYear: "FY 2025-26 (AY 2026-27)",
    professionalFee: 65000,
    status: "COUNTERSIGNED_VALID",
    issueDate: "2026-09-15",
    acceptedDate: "2026-09-18 11:05:40 IST",
    signatoryName: "Sunil Verma",
    signatoryDesignation: "Director",
    signatoryIp: "49.207.211.54 (Indore, Madhya Pradesh)"
  },
  {
    id: "eng-3",
    refNo: "GPA/ENG/2026/049",
    clientId: "CL-03",
    clientName: "OmniRetail Supermarkets Private Limited",
    clientPan: "AABCO4412L",
    clientGstin: "23AABCO4412L1Z8",
    groupName: "OmniRetail Retail Chain",
    scopeType: "GST_RETAINER",
    scopeTitle: "GST Compliance Retainer, GSTR-2B vs Books Reconciliation & GSTR-9/9C Audit",
    financialYear: "FY 2026-27",
    professionalFee: 36000,
    status: "AWAITING_CLIENT_ACCEPTANCE",
    issueDate: "2026-11-05",
    signatoryName: "Mahesh Agrawal",
    signatoryDesignation: "Finance Director"
  },
  {
    id: "eng-4",
    refNo: "GPA/ENG/2026/051",
    clientId: "CL-04",
    clientName: "Zenith Infra Projects Limited",
    clientPan: "AABCZ9941M",
    clientGstin: "23AABCZ9941M1Z1",
    groupName: "Zenith Infrastructure",
    scopeType: "TRANSFER_PRICING_92E",
    scopeTitle: "Transfer Pricing Audit under Section 92E of Income Tax Act (Form 3CEB)",
    financialYear: "FY 2025-26 (AY 2026-27)",
    professionalFee: 50000,
    status: "AWAITING_CLIENT_ACCEPTANCE",
    issueDate: "2026-11-10",
    signatoryName: "Kailash Zenith",
    signatoryDesignation: "Director"
  }
];

interface EngagementLetterGeneratorProps {
  clients?: ClientEntity[];
  initialClient?: ClientEntity | null;
}

export const EngagementLetterGenerator: React.FC<EngagementLetterGeneratorProps> = ({
  clients = [],
  initialClient = null,
}) => {
  const [engagements, setEngagements] = useState<EngagementRecord[]>(DEFAULT_REALISTIC_ENGAGEMENTS);
  const [activeTab, setActiveTab] = useState<"PREVIEW" | "REGISTER">("PREVIEW");
  const [selectedEngagementId, setSelectedEngagementId] = useState<string>("eng-1");

  // Modals
  const [acceptanceRecord, setAcceptanceRecord] = useState<EngagementRecord | null>(null);
  const [isNewEngagementOpen, setIsNewEngagementOpen] = useState(false);

  // Active Selected Engagement
  const activeEngagement = useMemo(() => {
    return engagements.find(e => e.id === selectedEngagementId) || engagements[0];
  }, [engagements, selectedEngagementId]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppDispatch = () => {
    const rawPhone = "9820044101";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    const text = encodeURIComponent(
      `*OFFICIAL ENGAGEMENT LETTER (ICAI SA 210)*\n\n` +
      `Dear ${activeEngagement.signatoryName},\n\n` +
      `Please find our official ICAI SA 210 Engagement Letter for *${activeEngagement.scopeTitle}* (${activeEngagement.financialYear}) for *${activeEngagement.clientName}*.\n\n` +
      `Agreed Professional Retainer: ₹${activeEngagement.professionalFee.toLocaleString("en-IN")} + 18% GST (Total: ₹${Math.round(activeEngagement.professionalFee * 1.18).toLocaleString("en-IN")}).\n` +
      `Managing Partner: ${DEFAULT_FIRM_BRANDING.managingPartner} (${DEFAULT_FIRM_BRANDING.firmName})\n\n` +
      `Please review and provide digital countersignature via our secure client link:\n` +
      `👉 https://portal.gpa-firm.in/engagement/accept/${activeEngagement.refNo.replace(/\//g, "-")}\n\n` +
      `Regards,\n${DEFAULT_FIRM_BRANDING.firmName}`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
    toast.success("Engagement Dispatched", `Sent SA 210 agreement link to ${activeEngagement.clientName} on WhatsApp.`);
  };

  const handleCreateEngagement = (newRec: EngagementRecord, sendWhatsApp: boolean) => {
    setEngagements(prev => [newRec, ...prev]);
    setSelectedEngagementId(newRec.id);
    setActiveTab("PREVIEW");
    toast.success("Engagement Created", `Generated SA 210 letter for ${newRec.clientName}.`);
  };

  const handleAcceptanceComplete = (updated: EngagementRecord) => {
    setEngagements(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleExportRegister = () => {
    const headers = "Ref No,Client Name,Client PAN,Scope,Financial Year,Base Fee,GST 18%,Total Fee,Status,Issue Date,Accepted Date\n";
    const rows = engagements.map(e => 
      `"${e.refNo}","${e.clientName}","${e.clientPan}","${e.scopeTitle}","${e.financialYear}",${e.professionalFee},${Math.round(e.professionalFee * 0.18)},${Math.round(e.professionalFee * 1.18)},"${e.status}","${e.issueDate}","${e.acceptedDate || 'Pending'}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ICAI_SA210_Engagement_Register_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Register Exported", "Downloaded CSV engagement register for ICAI Peer Review Board.");
  };

  const gstAmount = Math.round(activeEngagement.professionalFee * 0.18);
  const totalAmount = activeEngagement.professionalFee + gstAmount;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50/70 via-white to-red-50/40 border border-red-200 rounded-2xl p-6 text-slate-900 shadow-sm relative overflow-hidden print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-red-50 text-btred-logo border border-red-200 rounded-full flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" /> ICAI SA 210 Standard Compliant
              </span>
              <span className="text-xs text-slate-600 font-mono">FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; 1-Click Retainer Generator</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-btred-logo" /> Automated Engagement Letters &amp; Retainer Agreements
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Eliminate professional liability risk and satisfy ICAI Peer Review mandates. Generates official SA-210 letters of engagement with statutory clauses for CARO 2020, UDIN obligations, and Section 43B(h) payment schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportRegister}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              title="Export complete engagement ledger for ICAI Peer Review"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Export Register</span>
            </button>
            <button
              onClick={() => setIsNewEngagementOpen(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ New Engagement</span>
            </button>
            <button
              onClick={handleWhatsAppDispatch}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-btred-logo hover:bg-red-700 text-white shadow-sm font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Letter</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs & Active Client Selector */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("PREVIEW")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === "PREVIEW" ? "bg-slate-900 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"}`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Letterhead Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("REGISTER")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === "REGISTER" ? "bg-slate-900 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Engagement Register ({engagements.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-bold uppercase">Viewing Engagement:</span>
            <select
              value={selectedEngagementId}
              onChange={(e) => setSelectedEngagementId(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500"
            >
              {engagements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.clientName} ({e.refNo}) - {e.status === 'COUNTERSIGNED_VALID' ? '✅ Signed' : '⏳ Pending'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: ENGAGEMENT PIPELINE & REGISTER TABLE */}
      {activeTab === "REGISTER" ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">ICAI SA 210 Engagement Letter Register</h3>
              <p className="text-xs text-slate-500">Peer Review Audit Trail of All Contracted Client Retainers</p>
            </div>
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
              Total Contracted Pipeline: ₹{engagements.reduce((acc, curr) => acc + Math.round(curr.professionalFee * 1.18), 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref No &amp; Client</th>
                  <th className="py-3 px-4">Engagement Scope</th>
                  <th className="py-3 px-4">Financial Year</th>
                  <th className="py-3 px-4">Retainer Fee</th>
                  <th className="py-3 px-4">SA 210 Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {engagements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.clientName}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{item.refNo} &bull; PAN: {item.clientPan}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                      {item.scopeTitle}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {item.financialYear}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900">₹{item.professionalFee.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-slate-400 block">+18% GST</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === "COUNTERSIGNED_VALID" ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Countersigned
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full flex items-center gap-1 w-fit animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" /> Awaiting Acceptance
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedEngagementId(item.id);
                          setActiveTab("PREVIEW");
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition"
                      >
                        View Letter
                      </button>
                      {item.status === "AWAITING_CLIENT_ACCEPTANCE" ? (
                        <button
                          onClick={() => setAcceptanceRecord(item)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          <span>E-Sign</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold font-mono">
                          Locked u/s 210
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW 2: FORMAL LETTERHEAD & ANNEXURES */
        <div className="bg-white text-slate-900 border border-slate-300 rounded-3xl p-8 sm:p-14 shadow-sm font-serif max-w-4xl mx-auto space-y-6 text-xs sm:text-sm leading-relaxed">
          {/* Status Banner */}
          <div className="p-3 rounded-2xl border flex items-center justify-between text-xs font-sans print:hidden bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">Document Status:</span>
              {activeEngagement.status === "COUNTERSIGNED_VALID" ? (
                <span className="text-emerald-800 font-black flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> BILATERALLY COUNTERSIGNED &amp; LOCKED
                </span>
              ) : (
                <span className="text-amber-800 font-black flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600" /> AWAITING CLIENT DIGITAL ACCEPTANCE
                </span>
              )}
            </div>

            {activeEngagement.status === "AWAITING_CLIENT_ACCEPTANCE" && (
              <button
                onClick={() => setAcceptanceRecord(activeEngagement)}
                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simulate Client E-Sign Acceptance</span>
              </button>
            )}
          </div>

          {/* Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-slate-900 font-sans">
                {DEFAULT_FIRM_BRANDING.firmName}
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-0.5 font-bold">
                Chartered Accountants &bull; FRN: {DEFAULT_FIRM_BRANDING.frn} &bull; Peer Review: {DEFAULT_FIRM_BRANDING.peerReviewNo}
              </p>
              <p className="text-[11px] text-slate-500 font-sans">
                {DEFAULT_FIRM_BRANDING.headOffice} | Contact: {DEFAULT_FIRM_BRANDING.partnerPhone}
              </p>
            </div>
            <div className="text-right font-sans text-xs">
              <span className="font-bold text-slate-800">Ref: {activeEngagement.refNo}</span>
              <div className="text-slate-500 mt-1">Date: {activeEngagement.issueDate}</div>
            </div>
          </div>

          {/* Addressed To */}
          <div className="space-y-1 font-sans text-xs">
            <p className="font-bold text-slate-900">To,</p>
            <p className="font-bold text-base text-slate-900">{activeEngagement.clientName}</p>
            <p className="text-slate-700 font-medium">{activeEngagement.groupName}</p>
            <p className="text-slate-600 font-mono">PAN: {activeEngagement.clientPan} | GSTIN: {activeEngagement.clientGstin}</p>
          </div>

          {/* Subject */}
          <div className="bg-slate-50 border-l-4 border-slate-900 p-3.5 font-sans font-bold text-xs sm:text-sm">
            SUBJECT: Engagement Letter for {activeEngagement.scopeTitle} for {activeEngagement.financialYear}
          </div>

          {/* Body Paragraphs */}
          <div className="space-y-4 text-justify">
            <p>Dear Sir(s) / Madam,</p>

            <p>
              You have requested that we accept the appointment as the professional accountants / auditors to perform <strong>{activeEngagement.scopeTitle}</strong> for <strong>{activeEngagement.clientName}</strong> for <strong>{activeEngagement.financialYear}</strong>. We are pleased to confirm our acceptance and our understanding of this engagement by means of this letter, formulated in accordance with <strong>Standard on Auditing (SA) 210</strong> issued by the Institute of Chartered Accountants of India (ICAI).
            </p>

            <div>
              <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
                1. Scope of Professional Services
              </h4>
              <p>
                Our examination and verification will be conducted in accordance with the applicable Standards on Auditing and Guidance Notes issued by the ICAI, the Income Tax Act 1961, Companies Act 2013, and the Central Goods and Services Tax Act 2017. Those standards require that we comply with ethical requirements and plan and perform the engagement to obtain reasonable assurance whether the financial records and statutory disclosures are free from material misstatement.
              </p>
            </div>

            <div>
              <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
                2. Management Responsibilities (SA 210 Paragraph 10)
              </h4>
              <p>
                Our audit / compilation will be conducted on the basis that management acknowledges and understands that they have responsibility for:
              </p>
              <ul className="list-disc list-inside mt-1.5 space-y-1 pl-2">
                <li>The preparation and fair presentation of the financial statements in accordance with applicable Accounting Standards and Schedule III.</li>
                <li>Maintaining such internal control as management determines is necessary to enable the preparation of financial statements that are free from material misstatement, whether due to fraud or error.</li>
                <li>Providing us with unrestricted access to all information, bank statements, purchase bills, physical stock verification reports (AS-2), and vendor MSME classification under Section 15 of the MSMED Act, 2006 (Section 43B(h)).</li>
                <li>Providing written representations as required under <strong>ICAI SA 580</strong> confirming completeness of transactions.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
                3. Unique Document Identification Number (UDIN) Commitment
              </h4>
              <p>
                In compliance with mandatory ICAI Council Directives, all audit reports (Form 3CA/3CB/3CD, AOC-4, GSTR-9C) and certificates issued under this engagement will bear an authentic, system-generated 18-digit UDIN, verifiable by tax authorities and lending banks on <em>https://udin.icai.org</em>.
              </p>
            </div>

            <div>
              <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
                4. Professional Fees, Milestones &amp; Section 43B(h) Billing Terms
              </h4>
              <p>
                Our agreed professional retainer for the services described above is fixed at <strong>₹{activeEngagement.professionalFee.toLocaleString("en-IN")}</strong> (plus applicable GST @ 18% of ₹{gstAmount.toLocaleString("en-IN")}, making the total fee <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>).
              </p>
              <p className="mt-1">
                Fees are payable in accordance with the milestone schedule set out in Annexure B. Under Section 43B(h) of the Income Tax Act, 1961, professional fee invoices must be discharged within 15 days of presentation.
              </p>
            </div>

            <div>
              <h4 className="font-bold font-sans text-xs uppercase tracking-wide text-slate-900 mb-1">
                5. Limitation of Liability &amp; Indemnity
              </h4>
              <p>
                The audit opinion will be formulated based on test-checks and evidence provided by management. The company agrees to indemnify and hold harmless the auditors from any liabilities, claims, or regulatory penalties arising from intentional misrepresentation or suppression of facts by the company's directors, key managerial personnel, or employees.
              </p>
            </div>
          </div>

          {/* ANNEXURE A: CLIENT DELIVERABLES CHECKLIST */}
          <div className="pt-4 border-t border-slate-300 space-y-2 font-sans text-xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 p-2 rounded-lg">
              ANNEXURE A: Mandatory Client Deliverable Deadlines &amp; Documents Checklist
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-700 pl-2">
              <div>&bull; Final Tally / ERP Trial Balance (XML / Excel)</div>
              <div>&bull; Bank Statements &amp; BRS across all active accounts</div>
              <div>&bull; Form 26AS, AIS, and TIS downloaded statements</div>
              <div>&bull; GSTR-1, GSTR-3B &amp; GSTR-2B yearly reconciliation</div>
              <div>&bull; MSME Udyam classification register for Clause 22</div>
              <div>&bull; Fixed Asset Register &amp; Physical Stock Report</div>
            </div>
          </div>

          {/* ANNEXURE B: RETAINER MILESTONE & BANK PAYMENT SCHEDULE */}
          <div className="pt-2 border-t border-slate-300 space-y-2 font-sans text-xs">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 p-2 rounded-lg">
              ANNEXURE B: Agreed Retainer Payment Milestones &amp; Firm Bank Details
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-700">
              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50">
                <span className="font-bold block">Stage 1: Advance</span>
                <span>30% on Engagement Acceptance</span>
                <span className="font-bold text-slate-900 block mt-1">₹{Math.round(totalAmount * 0.3).toLocaleString("en-IN")}</span>
              </div>
              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50">
                <span className="font-bold block">Stage 2: Fieldwork</span>
                <span>40% on Circulation of Draft 3CD</span>
                <span className="font-bold text-slate-900 block mt-1">₹{Math.round(totalAmount * 0.4).toLocaleString("en-IN")}</span>
              </div>
              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50">
                <span className="font-bold block">Stage 3: Sign-off</span>
                <span>30% on UDIN &amp; Portal Upload</span>
                <span className="font-bold text-slate-900 block mt-1">₹{Math.round(totalAmount * 0.3).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-600 flex justify-between items-center font-mono">
              <div>Bank: {DEFAULT_FIRM_BRANDING.bankDetails.bankName} | A/C: {DEFAULT_FIRM_BRANDING.bankDetails.accountNumber} | IFSC: {DEFAULT_FIRM_BRANDING.bankDetails.ifsc}</div>
              <div className="font-bold text-slate-800">UPI VPA: {DEFAULT_FIRM_BRANDING.firmUpiVpa}</div>
            </div>
          </div>

          {/* BILATERAL COUNTERSIGNATURE BLOCKS */}
          <div className="pt-8 grid grid-cols-2 gap-8 font-sans text-xs">
            {/* Auditor Signature Block */}
            <div className="border-t-2 border-slate-900 pt-3">
              <p className="font-bold text-slate-900">For {DEFAULT_FIRM_BRANDING.firmName}</p>
              <p className="text-slate-600">Chartered Accountants (FRN: {DEFAULT_FIRM_BRANDING.frn})</p>
              <div className="mt-8">
                <p className="font-bold text-slate-900">{DEFAULT_FIRM_BRANDING.managingPartner}</p>
                <p className="text-slate-500">Partner | M. No. 518492</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date of Issue: {activeEngagement.issueDate}</p>
              </div>
            </div>

            {/* Client Countersignature Block */}
            <div className="border-t-2 border-slate-900 pt-3 text-right">
              <p className="font-bold text-slate-900">Acknowledged &amp; Accepted:</p>
              <p className="text-slate-600 font-bold">For {activeEngagement.clientName}</p>
              
              <div className="mt-4">
                {activeEngagement.status === "COUNTERSIGNED_VALID" ? (
                  <div className="space-y-1">
                    {activeEngagement.signatureDataUrl ? (
                      <img 
                        src={activeEngagement.signatureDataUrl} 
                        alt="Client Countersignature" 
                        className="h-10 ml-auto object-contain bg-slate-50 border border-slate-200 rounded px-2"
                      />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> DIGITALLY ACCEPTED
                      </span>
                    )}
                    <p className="font-bold text-slate-900">{activeEngagement.signatoryName}</p>
                    <p className="text-slate-500">{activeEngagement.signatoryDesignation}</p>
                    <p className="text-[10px] text-emerald-700 font-mono">{activeEngagement.acceptedDate}</p>
                  </div>
                ) : (
                  <div className="pt-4 space-y-1">
                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[11px] font-bold animate-pulse">
                      AWAITING CLIENT COUNTERSIGNATURE
                    </span>
                    <p className="font-bold text-slate-700 mt-2">{activeEngagement.signatoryName}</p>
                    <p className="text-slate-400">Authorized Signatory / Official Seal</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="text-center text-[10px] text-slate-400 font-sans pt-4 border-t border-slate-200">
            Formulated in strict adherence to ICAI Standard on Auditing (SA) 210 &bull; Retain permanently in Master Audit File under SA 230
          </div>
        </div>
      )}

      {/* MODAL 1: CLIENT ACCEPTANCE / E-SIGN SIMULATOR */}
      <ClientAcceptanceModal
        isOpen={!!acceptanceRecord}
        onClose={() => setAcceptanceRecord(null)}
        engagement={acceptanceRecord}
        onAccepted={handleAcceptanceComplete}
      />

      {/* MODAL 2: ISSUE NEW ENGAGEMENT LETTER */}
      <NewEngagementModal
        isOpen={isNewEngagementOpen}
        onClose={() => setIsNewEngagementOpen(false)}
        clients={clients}
        onCreateEngagement={handleCreateEngagement}
      />
    </div>
  );
};
