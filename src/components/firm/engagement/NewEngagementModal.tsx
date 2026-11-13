"use client";

import React, { useState } from "react";
import { 
  X, 
  Send, 
  Building2, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Smartphone, 
  Copy, 
  Check, 
  Calendar,
  Plus
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { EngagementRecord } from "./ClientAcceptanceModal";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

interface NewEngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientEntity[];
  onCreateEngagement: (newRecord: EngagementRecord, sendWhatsApp: boolean) => void;
}

export const NewEngagementModal: React.FC<NewEngagementModalProps> = ({
  isOpen,
  onClose,
  clients,
  onCreateEngagement
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [scopeType, setScopeType] = useState<EngagementRecord["scopeType"]>("TAX_AUDIT_44AB");
  const [fy, setFy] = useState("FY 2025-26 (AY 2026-27)");
  const [baseFee, setBaseFee] = useState<number>(45000);
  const [phone, setPhone] = useState("+91 98200 44101");
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0] || {
    id: "CL-APEX",
    name: "Apex AutoTech Private Limited",
    pan: "AABCA8891D",
    gstin: "23AABCA8891D1Z2",
    groupName: "The Apex Industrial Group"
  };

  const getScopeTitle = (type: EngagementRecord["scopeType"]) => {
    switch (type) {
      case "TAX_AUDIT_44AB":
        return "Tax Audit under Section 44AB of the Income Tax Act, 1961 (Form 3CA/3CB and Form 3CD)";
      case "STATUTORY_AUDIT_COMPANIES_ACT":
        return "Statutory Audit of Financial Statements under Section 139 of the Companies Act, 2013 & CARO 2020";
      case "GST_RETAINER":
        return "GST Compliance Retainer, GSTR-2B vs Books Reconciliation & GSTR-9/9C Audit";
      case "ITR_AND_TAX_PLANNING":
        return "Preparation, Verification & E-Filing of Income Tax Return & Scrutiny Representation";
      case "TRANSFER_PRICING_92E":
        return "Transfer Pricing Audit under Section 92E of Income Tax Act (Form 3CEB)";
      case "IFC_AUDIT":
        return "Audit of Internal Financial Controls (IFC) over Financial Reporting u/s 143(3)(i)";
    }
  };

  const gstAmount = Math.round(baseFee * 0.18);
  const totalFee = baseFee + gstAmount;

  const refNo = `GPA/ENG/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`;
  const magicLink = `https://portal.gpa-firm.in/engagement/accept/${refNo.replace(/\//g, "-")}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(magicLink);
    setCopiedLink(true);
    toast.success("Magic Link Copied", "Client acceptance link copied to clipboard.");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmit = (sendWhatsApp: boolean) => {
    const newRecord: EngagementRecord = {
      id: `eng-${Date.now()}`,
      refNo: refNo,
      clientId: currentClient.id,
      clientName: currentClient.name,
      clientPan: currentClient.pan,
      clientGstin: currentClient.gstin || "23AABCA8891D1Z2",
      groupName: currentClient.groupName || "Corporate Group",
      scopeType: scopeType,
      scopeTitle: getScopeTitle(scopeType),
      financialYear: fy,
      professionalFee: baseFee,
      status: "AWAITING_CLIENT_ACCEPTANCE",
      issueDate: new Date().toLocaleDateString("en-IN"),
      signatoryName: currentClient.primaryContact?.name || "Managing Director",
      signatoryDesignation: currentClient.primaryContact?.designation || "Director"
    };

    onCreateEngagement(newRecord, sendWhatsApp);
    onClose();

    if (sendWhatsApp) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const waText = `*OFFICIAL ENGAGEMENT LETTER (ICAI SA 210)*%0A%0ADear *${newRecord.signatoryName}*,%0A%0APlease find our formal Engagement Letter and Retainer Agreement for *${newRecord.clientName}* for *${fy}* issued by *${DEFAULT_FIRM_BRANDING.firmName}*.%0A%0A*Scope:* ${newRecord.scopeTitle}%0A*Agreed Retainer:* ₹${baseFee.toLocaleString("en-IN")} + 18% GST (Total: ₹${totalFee.toLocaleString("en-IN")})%0A%0APursuant to ICAI SA 210 mandates, please review the scope and provide digital countersignature:%0A👉 ${magicLink}%0A%0A_Regards,%0A${DEFAULT_FIRM_BRANDING.firmName}_`;
      window.open(`https://wa.me/${cleanPhone}?text=${waText}`, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-btred-logo">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Issue New SA 210 Engagement Letter
              </h3>
              <p className="text-xs text-slate-500">
                Standard on Auditing (SA) 210 Bilateral Retainer Agreement
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-900">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Target Client Entity *</label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                const c = clients.find(cl => cl.id === e.target.value);
                if (c?.primaryContact?.phone) setPhone(c.primaryContact.phone);
              }}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold focus:outline-none focus:border-red-500"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.pan})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Engagement Scope *</label>
              <select
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-medium focus:outline-none focus:border-red-500"
              >
                <option value="TAX_AUDIT_44AB">Tax Audit (Sec 44AB - 3CD)</option>
                <option value="STATUTORY_AUDIT_COMPANIES_ACT">Statutory Audit (Co. Act 2013)</option>
                <option value="GST_RETAINER">GST Retainer &amp; GSTR-9/9C</option>
                <option value="ITR_AND_TAX_PLANNING">ITR Filing &amp; Representation</option>
                <option value="TRANSFER_PRICING_92E">Transfer Pricing (Form 3CEB)</option>
                <option value="IFC_AUDIT">Internal Financial Controls (IFC)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Financial Year</label>
              <input
                type="text"
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Agreed Base Fee (₹) *</label>
              <input
                type="number"
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Signatory WhatsApp Mobile</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Fee Breakdown Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>Base Professional Retainer:</span>
              <span className="font-mono font-bold text-slate-900">₹{baseFee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Applicable GST (18%):</span>
              <span className="font-mono text-slate-600">+₹{gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
              <span>Total Retainer Contract Value:</span>
              <span className="font-mono text-emerald-700">₹{totalFee.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Milestone Schedule Preview */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-white space-y-1.5 text-[11px] text-slate-600">
            <span className="font-bold text-slate-800 uppercase text-[10px] block">Standard Retainer Milestones:</span>
            <div className="flex justify-between">
              <span>• 30% Mobilization Advance on Signing:</span>
              <span className="font-mono font-bold">₹{Math.round(totalFee * 0.3).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>• 40% on Draft Report &amp; Fieldwork:</span>
              <span className="font-mono font-bold">₹{Math.round(totalFee * 0.4).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>• 30% on Final UDIN &amp; Portal Upload:</span>
              <span className="font-mono font-bold">₹{Math.round(totalFee * 0.3).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
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
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Smartphone className="w-4 h-4" />
              <span>Issue &amp; Send WhatsApp Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
