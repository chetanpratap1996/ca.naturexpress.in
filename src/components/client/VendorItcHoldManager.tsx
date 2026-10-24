"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  IndianRupee, 
  ExternalLink, 
  Phone, 
  FileSpreadsheet, 
  Lock,
  Plus,
  X,
  Check
} from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";

export interface VendorHoldItem {
  id: string;
  vendorName: string;
  vendorGstin: string;
  invoiceNo: string;
  invoiceDate: string;
  taxableAmount: number;
  blockedItc: number;
  totalInvoiceValue: number;
  recommendedWithholdAmount: number;
  vendorContactPhone: string;
  vendorAccountEmail: string;
  status: "PAYMENT_HELD" | "NOTICE_SENT" | "RESOLVED_IN_2B";
}

const INITIAL_VENDOR_HOLDS: VendorHoldItem[] = [
  {
    id: "VHOLD-1",
    vendorName: "Singhal Industrial Lubricants & Oils",
    vendorGstin: "27AAYPS9901M1ZQ",
    invoiceNo: "SIL/0926/771",
    invoiceDate: "25-Sep-2026",
    taxableAmount: 185000,
    blockedItc: 33300,
    totalInvoiceValue: 218300,
    recommendedWithholdAmount: 33300, // Hold back the GST component
    vendorContactPhone: "+91 98210 55412",
    vendorAccountEmail: "accounts@singhalindustrial.com",
    status: "PAYMENT_HELD"
  },
  {
    id: "VHOLD-2",
    vendorName: "Bajaj Electrical Transformers & Spares",
    vendorGstin: "27AAACB4410K1ZX",
    invoiceNo: "BET/SEP/2026/019",
    invoiceDate: "28-Sep-2026",
    taxableAmount: 240000,
    blockedItc: 43200,
    totalInvoiceValue: 283200,
    recommendedWithholdAmount: 43200,
    vendorContactPhone: "+91 98900 88219",
    vendorAccountEmail: "billing@bajajelectricals.co.in",
    status: "PAYMENT_HELD"
  }
];

export function VendorItcHoldManager({ clientName = "Apex Precision Technologies Pvt Ltd" }: { clientName?: string }) {
  const [holds, setHolds] = useState<VendorHoldItem[]>(INITIAL_VENDOR_HOLDS);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Hold Form State
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorGstin, setNewVendorGstin] = useState("");
  const [newInvoiceNo, setNewInvoiceNo] = useState("");
  const [newBlockedItc, setNewBlockedItc] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const totalBlockedItc = holds
    .filter((h) => h.status !== "RESOLVED_IN_2B")
    .reduce((acc, h) => acc + h.blockedItc, 0);

  const handleSendHoldNotice = (item: VendorHoldItem) => {
    const text = `*PAYMENT WITHHOLDING NOTICE: GSTR-1 UPLOAD PENDING*\n\n` +
      `Dear ${item.vendorName} Accounts Team,\n\n` +
      `This is from Accounts Dept of *${clientName}*.\n\n` +
      `Your Invoice #${item.invoiceNo} dated ${item.invoiceDate} (GST: ₹${item.blockedItc.toLocaleString("en-IN")}) is *NOT REFLECTING* in our official departmental GSTR-2B.\n\n` +
      `Under Section 16(2)(aa) of CGST Act, we cannot claim Input Tax Credit without your return filing. Hence, payment of *₹${item.recommendedWithholdAmount.toLocaleString("en-IN")}* is put on HOLD until you file GSTR-1 and provide filing ARN.\n\n` +
      `Regards,\n*Accounts & Finance Dept*\n${clientName}`;

    const phoneClean = item.vendorContactPhone.replace(/[^0-9]/g, "");
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, "_blank");
    }

    setHolds((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, status: "NOTICE_SENT" } : h))
    );

    setSuccessToast(`Dispatched payment withholding notice to ${item.vendorName}!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleMarkResolved = (id: string) => {
    setHolds((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status: "RESOLVED_IN_2B" } : h))
    );
    setSuccessToast("Vendor filed GSTR-1! ITC unlocked in GSTR-2B; payment released.");
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleAddHold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newBlockedItc) return;

    const itcVal = Number(newBlockedItc);
    const newHold: VendorHoldItem = {
      id: `VHOLD-${Date.now().toString().slice(-4)}`,
      vendorName: newVendorName.trim(),
      vendorGstin: newVendorGstin.trim().toUpperCase() || "27XXXXX0000X1ZX",
      invoiceNo: newInvoiceNo.trim() || `INV-${Date.now().toString().slice(-4)}`,
      invoiceDate: new Date().toLocaleDateString("en-IN"),
      taxableAmount: Math.round(itcVal / 0.18),
      blockedItc: itcVal,
      totalInvoiceValue: Math.round(itcVal / 0.18) + itcVal,
      recommendedWithholdAmount: itcVal,
      vendorContactPhone: newPhone.trim() || "+91 98000 00000",
      vendorAccountEmail: "accounts@vendor.com",
      status: "PAYMENT_HELD",
    };

    setHolds([newHold, ...holds]);
    setIsAddModalOpen(false);
    setNewVendorName("");
    setNewVendorGstin("");
    setNewInvoiceNo("");
    setNewBlockedItc("");
    setNewPhone("");
    setSuccessToast(`Created payment hold for ${newHold.vendorName}!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-600" /> Cash Protection System
            </span>
            <span className="text-xs text-slate-400 font-semibold">Section 16(2)(aa) Defense</span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-1">
            Supplier ITC Hold &amp; Cash Recovery Register
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Stop losing money to non-compliant vendors. Brains &amp; Taxes identifies suppliers whose invoices are missing in GSTR-2B so your accounts team can hold payment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-2xl text-right shrink-0">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Blocked ITC to Withhold</span>
            <span className="text-xl font-black text-rose-700">₹{totalBlockedItc.toLocaleString("en-IN")}</span>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-3 bg-btblack hover:bg-slate-800 text-white rounded-2xl shadow transition shrink-0"
            title="Add Defaulting Vendor"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Holds Table */}
      <div className="space-y-3">
        {holds.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border transition space-y-3 ${
              item.status === "RESOLVED_IN_2B"
                ? "bg-emerald-50/40 border-emerald-200 opacity-75"
                : "bg-slate-50/70 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">{item.vendorName}</h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    item.status === "RESOLVED_IN_2B"
                      ? "bg-emerald-100 text-emerald-800"
                      : item.status === "NOTICE_SENT"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}>
                    {item.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                  <span>GSTIN: <strong>{item.vendorGstin}</strong></span>
                  <span>&bull;</span>
                  <span>Invoice: <strong>{item.invoiceNo}</strong> ({item.invoiceDate})</span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 font-medium block">Withhold from Vendor Cheque:</span>
                <span className="text-base font-black text-rose-700 flex items-center sm:justify-end gap-1">
                  <IndianRupee className="w-4 h-4" />
                  {item.recommendedWithholdAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Contact: <strong className="text-slate-900">{item.vendorContactPhone}</strong> &bull; {item.vendorAccountEmail}
              </div>

              <div className="flex items-center gap-2">
                {item.status === "RESOLVED_IN_2B" ? (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved in 2B &bull; Payment Cleared
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleSendHoldNotice(item)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" /> Send WhatsApp Demand
                    </button>
                    <button
                      onClick={() => handleMarkResolved(item.id)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Mark Resolved
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddHold}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95"
          >
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
              Record Missing 2B Vendor Hold
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor Trading Name *</label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="e.g. Apex Industrial Steel Corp"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor GSTIN</label>
                <input
                  type="text"
                  value={newVendorGstin}
                  onChange={(e) => setNewVendorGstin(e.target.value)}
                  placeholder="27AXXXX0000X1ZX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={newInvoiceNo}
                    onChange={(e) => setNewInvoiceNo(e.target.value)}
                    placeholder="INV/2026/09"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Blocked GST/ITC (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newBlockedItc}
                    onChange={(e) => setNewBlockedItc(e.target.value)}
                    placeholder="36000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor WhatsApp Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-btblack hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition"
              >
                Save Payment Hold
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
