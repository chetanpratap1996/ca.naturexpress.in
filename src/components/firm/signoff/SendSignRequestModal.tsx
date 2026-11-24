"use client";

import React, { useState } from "react";
import { 
  X, 
  Send, 
  Smartphone, 
  Building2, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Link2
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { ApprovalRecord } from "../AssesseeApprovalDesk";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

interface SendSignRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientEntity[];
  onCreateRequest: (record: ApprovalRecord, openWhatsApp: boolean) => void;
}

export const SendSignRequestModal: React.FC<SendSignRequestModalProps> = ({
  isOpen,
  onClose,
  clients,
  onCreateRequest
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [filingType, setFilingType] = useState<ApprovalRecord["filingType"]>("ITR_COMPUTATION_139");
  const [docTitle, setDocTitle] = useState("ITR-V & Statement of Computation of Total Income for AY 2026-27");
  const [signatoryName, setSignatoryName] = useState("Chetan Pratap Singh (Director)");
  const [phone, setPhone] = useState("+91 98200 11223");
  const [figures, setFigures] = useState("Taxable Income: ₹14,80,000 | Net Tax Payable: ₹1,85,400");
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const fallbackClient: ClientEntity = {
    id: "CL-DEFAULT",
    groupId: "GRP-01",
    groupName: "Direct Practice Clients",
    name: "Pratwi Solutions Private Limited",
    type: "PVT_LTD",
    pan: "AANCP9915B",
    incorporationYear: 2026,
    turnoverCr: 1.2,
    penaltyRiskAccrued: 0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    primaryContact: {
      name: "Chetan Pratap Singh",
      phone: "+91 80771 70715",
      email: "chetanpratap1996@gmail.com",
      designation: "Director"
    }
  };

  const currentClient: ClientEntity = (clients && clients.length > 0)
    ? (clients.find(c => c.id === selectedClientId) || clients[0])
    : fallbackClient;

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const c = clients.find(cl => cl.id === clientId);
    if (c) {
      if (c.primaryContact?.name) {
        setSignatoryName(`${c.primaryContact.name} (${c.primaryContact.designation || 'Director'})`);
      } else if (c.type === "INDIVIDUAL_HNI" || c.type === "PROPRIETORSHIP") {
        setSignatoryName(`${c.name} (Assessee)`);
      } else {
        setSignatoryName("Authorized Director / Partner");
      }
      if (c.primaryContact?.phone) {
        setPhone(c.primaryContact.phone);
      }
    }
  };

  const handleTypeChange = (type: ApprovalRecord["filingType"]) => {
    setFilingType(type);
    if (type === "ITR_COMPUTATION_139") {
      setDocTitle("ITR-V & Statement of Computation of Total Income for AY 2026-27");
      setFigures("Taxable Income: ₹14,80,000 | Net Tax Payable: ₹1,85,400");
    } else if (type === "GSTR_3B_MONTHLY") {
      setDocTitle("Form GSTR-3B Outward & Inward Tax Return for October 2026");
      setFigures("Outward Tax: ₹8,40,000 | ITC Claimed: ₹6,12,000 | Cash Paid: ₹2,28,000");
    } else if (type === "TAX_AUDIT_3CD") {
      setDocTitle("Tax Audit Report Form 3CB/3CD & Disallowance Annexures for FY 2025-26");
      setFigures("Turnover: ₹48.20 Cr | Total Disallowances u/s 40(a)(ia) & 43B(h): ₹4,43,000");
    } else {
      setDocTitle("Schedule III Balance Sheet, P&L Statement & CARO 2020 for FY 2025-26");
      setFigures("Total Assets: ₹24.50 Cr | Net Profit: ₹3.24 Cr | Net Worth: ₹14.80 Cr");
    }
  };

  const generatedToken = `sec-sign-${Date.now().toString().slice(-6)}`;
  const magicLink = `https://portal.gpa-firm.in/sign/${generatedToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(magicLink);
    setCopiedLink(true);
    toast.success("Magic Link Copied", "Client authorization link copied to clipboard.");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmit = (sendWhatsApp: boolean) => {
    if (!docTitle.trim() || !signatoryName.trim()) {
      toast.error("Missing Information", "Please provide document title and signatory name.");
      return;
    }

    const newRecord: ApprovalRecord = {
      id: `appr-${Date.now()}`,
      documentTitle: docTitle,
      filingType: filingType,
      clientName: currentClient.name,
      clientPan: currentClient.pan,
      signatoryName: signatoryName,
      signatoryPhone: phone,
      signatoryIp: "Pending Assessee Mobile/Desktop Connection",
      timestamp: "Awaiting Client Sign",
      status: "AWAITING_CLIENT_SIGN",
      legalDeclarationText: `I hereby confirm that I have verified the particulars and financial figures in ${docTitle}. I formally authorize ${DEFAULT_FIRM_BRANDING.firmName} to e-file and verify the return on our behalf.`
    };

    onCreateRequest(newRecord, sendWhatsApp);
    onClose();

    if (sendWhatsApp) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const waText = `*IMPORTANT: Statutory E-Sign & Filing Authorization (ICAI SA 580)*%0A%0ADear *${signatoryName}*,%0A%0AYour statutory filing *"${docTitle}"* for *${currentClient.name}* (PAN: ${currentClient.pan}) has been prepared and verified by *${DEFAULT_FIRM_BRANDING.firmName}*.%0A%0A*Certified Figures:*%0A${figures}%0A%0APursuant to ICAI SA 580 and statutory IT/GST guidelines, please review the computation and authorize filing via our secure encrypted link:%0A👉 ${magicLink}%0A%0A_Note: Filing will be initiated on government portals immediately upon receipt of your digital authorization._`;
      window.open(`https://wa.me/${cleanPhone}?text=${waText}`, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Issue Assessee E-Sign Request
              </h3>
              <p className="text-xs text-slate-500">
                ICAI SA 580 Written Representation &amp; Direct Filing Authorization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-900">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Target Client Entity *</label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold focus:outline-none focus:border-red-500"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.pan})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Filing Category</label>
              <select
                value={filingType}
                onChange={(e) => handleTypeChange(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-medium focus:outline-none focus:border-red-500"
              >
                <option value="ITR_COMPUTATION_139">Income Tax Return (ITR-1/2/3/4/6)</option>
                <option value="GSTR_3B_MONTHLY">GST Return (GSTR-3B / GSTR-1)</option>
                <option value="TAX_AUDIT_3CD">Tax Audit Report (Form 3CA/3CB/3CD)</option>
                <option value="BALANCE_SHEET_AUDIT">Schedule III Audited Financials</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Signatory Mobile (WhatsApp) *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono font-bold focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Document Title *</label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-medium focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Authorized Signatory Name &amp; Designation *</label>
            <input
              type="text"
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Certified Financial Highlights</label>
            <input
              type="text"
              value={figures}
              onChange={(e) => setFigures(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-medium focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Generated Magic Link Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-teal-700 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" /> Client Magic Link (Expiring in 48 Hours)
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? "Copied" : "Copy URL"}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-600 truncate">
              {magicLink}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
            >
              Save as Pending
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Smartphone className="w-4 h-4" />
              <span>Send 1-Click WhatsApp Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
