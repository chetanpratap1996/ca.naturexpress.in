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
  Check,
  Download,
  Printer,
  Search,
  Filter,
  FileText,
  Mail,
  Building2
} from "lucide-react";
import { formatCurrencyINR, isValidGstin } from "@/lib/utils";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { toast } from "@/components/shared/ToastNotification";

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
  noticeDate?: string;
  arnNumber?: string;
}

const INITIAL_VENDOR_HOLDS: VendorHoldItem[] = [
  {
    id: "hold-1",
    vendorName: "Tata Projects Limited",
    vendorGstin: "27AAACT2727Q1ZW",
    invoiceNo: "TPL/2026/0921",
    invoiceDate: "2026-09-08",
    taxableAmount: 1027777,
    blockedItc: 185000,
    totalInvoiceValue: 1212777,
    recommendedWithholdAmount: 185000,
    vendorContactPhone: "+91 98200 44122",
    vendorAccountEmail: "accounts.payables@tataprojects.com",
    status: "PAYMENT_HELD",
    noticeDate: "2026-09-12"
  },
  {
    id: "hold-2",
    vendorName: "Shree Balaji Logistics & Warehousing",
    vendorGstin: "23AABFS7714C1Z1",
    invoiceNo: "SBL/IND/4819",
    invoiceDate: "2026-09-15",
    taxableAmount: 450000,
    blockedItc: 81000,
    totalInvoiceValue: 531000,
    recommendedWithholdAmount: 81000,
    vendorContactPhone: "+91 98110 44212",
    vendorAccountEmail: "billing@balajilogistics.in",
    status: "NOTICE_SENT",
    noticeDate: "2026-09-18"
  },
  {
    id: "hold-3",
    vendorName: "Aura Fasteners & Precision Engineering",
    vendorGstin: "27AABCA1294F1Z8",
    invoiceNo: "AFPE/26/1092",
    invoiceDate: "2026-08-28",
    taxableAmount: 280000,
    blockedItc: 50400,
    totalInvoiceValue: 330400,
    recommendedWithholdAmount: 50400,
    vendorContactPhone: "+91 98930 11992",
    vendorAccountEmail: "finance@aurafasteners.in",
    status: "RESOLVED_IN_2B",
    arnNumber: "AA2709260194821",
    noticeDate: "2026-09-02"
  }
];

export function VendorItcHoldManager({ clientName = "Client Entity" }: { clientName?: string }) {
  const [holds, setHolds] = useState<VendorHoldItem[]>(INITIAL_VENDOR_HOLDS);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAYMENT_HELD" | "NOTICE_SENT" | "RESOLVED_IN_2B">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHoldForNotice, setSelectedHoldForNotice] = useState<VendorHoldItem | null>(null);

  // New Hold Form State
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorGstin, setNewVendorGstin] = useState("");
  const [newInvoiceNo, setNewInvoiceNo] = useState("");
  const [newBlockedItc, setNewBlockedItc] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const totalBlockedItc = holds
    .filter((h) => h.status !== "RESOLVED_IN_2B")
    .reduce((acc, h) => acc + h.blockedItc, 0);

  const totalResolvedItc = holds
    .filter((h) => h.status === "RESOLVED_IN_2B")
    .reduce((acc, h) => acc + h.blockedItc, 0);

  const filteredHolds = holds.filter((h) => {
    const matchesStatus = statusFilter === "ALL" || h.status === statusFilter;
    const matchesSearch = 
      h.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.vendorGstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSendHoldNotice = (item: VendorHoldItem) => {
    const text = `*PAYMENT WITHHOLDING STATUTORY DEMAND: SECTION 16(2)(aa) CGST ACT*\n\n` +
      `To: *${item.vendorName} Accounts Dept*\n` +
      `GSTIN: *${item.vendorGstin}*\n\n` +
      `This is an official communication from *${clientName}*.\n\n` +
      `Your Invoice *#${item.invoiceNo}* dated ${item.invoiceDate} for Taxable Value ₹${item.taxableAmount.toLocaleString("en-IN")} (GST ₹${item.blockedItc.toLocaleString("en-IN")}) is *NOT REFLECTING* in our official departmental GSTR-2B.\n\n` +
      `As mandated by Section 16(2)(aa) of the CGST Act 2017, input tax credit cannot be availed unless uploaded by the supplier in GSTR-1.\n\n` +
      `⚠️ *Action Taken:* Payment of *₹${item.recommendedWithholdAmount.toLocaleString("en-IN")}* is placed on HOLD.\n\n` +
      `Please file your GSTR-1 return and furnish the official ARN reference within 7 working days to unlock payment.\n\n` +
      `Issued under advice of *${DEFAULT_FIRM_BRANDING.firmName}*, Chartered Accountants.`;

    const phoneClean = item.vendorContactPhone.replace(/[^0-9]/g, "");
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, "_blank");
    }

    setHolds((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, status: "NOTICE_SENT", noticeDate: new Date().toISOString().split("T")[0] } : h))
    );

    toast.success("Withholding Demand Dispatched", `Statutory notice sent to ${item.vendorName}.`);
  };

  const handleMarkResolved = (id: string) => {
    setHolds((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status: "RESOLVED_IN_2B", arnNumber: `ARN${Date.now().toString().slice(-10)}` } : h))
    );
    toast.success("ITC Verified & Released", "Vendor return detected in GSTR-2B. Payment cleared.");
  };

  const handlePrintLegalNotice = (item: VendorHoldItem) => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Statutory Withholding Demand - ${item.vendorName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
            .header { border-bottom: 2px solid #e52320; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
            .firm-name { font-size: 20px; font-weight: 900; color: #0f172a; }
            .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin-bottom: 20px; }
            .alert-banner { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 20px; font-weight: 700; color: #991b1b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #f1f5f9; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="firm-name">${clientName}</div>
              <div style="font-size: 12px; color: #64748b;">Finance &amp; Accounts Payable Division &bull; GST Compliance Desk</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              <div>REF: BT/VHOLD-${item.id}</div>
              <div>DATE: ${new Date().toLocaleDateString("en-IN")}</div>
            </div>
          </div>

          <div class="alert-banner">
            FORMAL NOTICE OF PAYMENT WITHHOLDING UNDER SECTION 16(2)(aa) OF CGST ACT, 2017
          </div>

          <p>To,<br><strong>Accounts &amp; Tax Compliance Department</strong><br>${item.vendorName}<br>GSTIN: <strong>${item.vendorGstin}</strong><br>Contact: ${item.vendorContactPhone} / ${item.vendorAccountEmail}</p>

          <p>Dear Sir / Madam,</p>

          <p>On periodic reconciliation of our electronic purchase register against the Departmental Portal GSTR-2B, the following tax invoice raised by your organization was found <strong>UNREPORTED / MISSING</strong>:</p>

          <table>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Invoice Date</th>
                <th>Taxable Value (₹)</th>
                <th>CGST + SGST / IGST (₹)</th>
                <th>Total Value (₹)</th>
                <th>GSTR-2B Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${item.invoiceNo}</strong></td>
                <td>${item.invoiceDate}</td>
                <td>₹${item.taxableAmount.toLocaleString("en-IN")}</td>
                <td style="color: #ef4444; font-weight: 800;">₹${item.blockedItc.toLocaleString("en-IN")}</td>
                <td>₹${item.totalInvoiceValue.toLocaleString("en-IN")}</td>
                <td style="color: #ef4444; font-weight: 800;">NOT REFLECTED</td>
              </tr>
            </tbody>
          </table>

          <p>Pursuant to <strong>Section 16(2)(aa) of the Central Goods and Services Tax Act 2017</strong>, Input Tax Credit (ITC) can only be availed by a recipient if the details of the invoice have been furnished by the supplier in their Form GSTR-1 and communicated to the recipient in Form GSTR-2B.</p>

          <p>Consequently, our accounts department has been advised by our statutory auditors, <strong>${DEFAULT_FIRM_BRANDING.firmName}</strong>, to <strong>WITHHOLD PAYMENT OF ₹${item.recommendedWithholdAmount.toLocaleString("en-IN")}</strong> from your outstanding balance.</p>

          <p>You are hereby requested to upload this invoice in your upcoming GSTR-1 / IFF and furnish the filing Acknowledgement Reference Number (ARN) within <strong>7 business days</strong> to release the withheld remittance.</p>

          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div>
              <div style="font-weight: 800;">For ${clientName}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Authorized Signatory &bull; Accounts Payable</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: #64748b;">Statutory Auditor Reference:</div>
              <div style="font-weight: 800;">${DEFAULT_FIRM_BRANDING.firmName}</div>
              <div style="font-size: 11px; color: #059669; font-weight: 800;">ICAI FRN: ${DEFAULT_FIRM_BRANDING.frn}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const handleExportCsv = () => {
    const headers = "Vendor ID,Vendor Name,Vendor GSTIN,Invoice Number,Invoice Date,Taxable Value,Blocked ITC,Withheld Amount,Phone,Email,Status\n";
    const rows = holds.map((h) => 
      `"${h.id}","${h.vendorName}","${h.vendorGstin}","${h.invoiceNo}","${h.invoiceDate}",${h.taxableAmount},${h.blockedItc},${h.recommendedWithholdAmount},"${h.vendorContactPhone}","${h.vendorAccountEmail}","${h.status}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${clientName.replace(/\s+/g, "_")}_Vendor_ITC_Payment_Hold_Register.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV Exported", "Payment hold register ready for Accounts Payable / Tally.");
  };

  const handleAddHold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName || !newBlockedItc) {
      toast.error("Missing Details", "Please provide Vendor Name and Blocked ITC amount.");
      return;
    }

    const gstinClean = newVendorGstin.trim().toUpperCase();
    if (gstinClean && !isValidGstin(gstinClean)) {
      toast.error("Invalid GSTIN", "Please enter a valid 15-character Indian GSTIN.");
      return;
    }

    const itcVal = Number(newBlockedItc);
    const newHold: VendorHoldItem = {
      id: `VHOLD-${Date.now().toString().slice(-4)}`,
      vendorName: newVendorName.trim(),
      vendorGstin: gstinClean || "27XXXXX0000X1ZX",
      invoiceNo: newInvoiceNo.trim() || `INV-${Date.now().toString().slice(-4)}`,
      invoiceDate: new Date().toLocaleDateString("en-IN"),
      taxableAmount: Math.round(itcVal / 0.18),
      blockedItc: itcVal,
      totalInvoiceValue: Math.round(itcVal / 0.18) + itcVal,
      recommendedWithholdAmount: itcVal,
      vendorContactPhone: newPhone.trim() || "+91 98000 00000",
      vendorAccountEmail: newEmail.trim() || "accounts@vendor.com",
      status: "PAYMENT_HELD",
    };

    setHolds([newHold, ...holds]);
    setIsAddModalOpen(false);
    setNewVendorName("");
    setNewVendorGstin("");
    setNewInvoiceNo("");
    setNewBlockedItc("");
    setNewPhone("");
    setNewEmail("");
    toast.success("Payment Hold Activated", `Sec 16(2)(aa) hold placed on ${newHold.vendorName}.`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-600" /> Working Capital Protection
            </span>
            <span className="text-xs text-slate-500 font-semibold">Section 16(2)(aa) Defense Engine</span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-1">
            Supplier ITC Hold &amp; Cash Recovery Register &bull; {clientName}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Stop losing 18% liquidity to non-compliant vendors. Brains &amp; Taxes flags suppliers missing in GSTR-2B so your AP desk can freeze disbursements.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl text-right shrink-0">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Blocked ITC to Withhold</span>
            <span className="text-lg sm:text-xl font-black text-rose-700">₹{totalBlockedItc.toLocaleString("en-IN")}</span>
          </div>
          <button
            onClick={handleExportCsv}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl transition shrink-0"
            title="Export CSV for Tally / SAP Accounts Payable"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2.5 bg-btred-logo hover:bg-red-700 text-white rounded-2xl text-xs font-black shadow-sm transition shrink-0 flex items-center gap-1.5"
            title="Place Payment Hold on Defaulting Supplier"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Vendor Hold</span>
          </button>
        </div>
      </div>

      {/* KPI Ticker Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Active Payment Holds</span>
          <span className="text-base font-black text-rose-700 mt-0.5 block">
            {holds.filter((h) => h.status !== "RESOLVED_IN_2B").length} Suppliers
          </span>
          <span className="text-[10px] text-slate-500">Pending GSTR-1 Upload</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total ITC Protected</span>
          <span className="text-base font-black text-slate-900 mt-0.5 block">
            ₹{totalBlockedItc.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">Safe from Disallowance</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Resolved in GSTR-2B</span>
          <span className="text-base font-black text-emerald-700 mt-0.5 block">
            ₹{totalResolvedItc.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold">100% Tax Recovered</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Statutory Mandate</span>
          <span className="text-base font-black text-indigo-700 mt-0.5 block">Sec 16(2)(aa)</span>
          <span className="text-[10px] text-slate-500">CGST Compliance Shield</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {(["ALL", "PAYMENT_HELD", "NOTICE_SENT", "RESOLVED_IN_2B"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap border ${
                statusFilter === st
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st === "ALL" ? "All Suppliers" : st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor, GSTIN, invoice..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Holds Table */}
      <div className="space-y-3">
        {filteredHolds.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Matching Supplier Holds Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              All supplier records are either verified in GSTR-2B or match your search criteria.
            </p>
          </div>
        ) : (
          filteredHolds.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition space-y-3 ${
                item.status === "RESOLVED_IN_2B"
                  ? "bg-emerald-50/40 border-emerald-200 opacity-80"
                  : "bg-slate-50/70 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-sm">{item.vendorName}</h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.status === "RESOLVED_IN_2B"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : item.status === "NOTICE_SENT"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}>
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>GSTIN: <strong>{item.vendorGstin}</strong></span>
                    <span>&bull;</span>
                    <span>Invoice: <strong>{item.invoiceNo}</strong> ({item.invoiceDate})</span>
                    {item.arnNumber && (
                      <span className="text-emerald-700 font-bold">&bull; ARN: {item.arnNumber}</span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 font-medium block">Withhold from Vendor Disbursement:</span>
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
                  <button
                    onClick={() => handlePrintLegalNotice(item)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1 shadow-xs"
                    title="Print Formal Legal Withholding Demand Notice"
                  >
                    <Printer className="w-3.5 h-3.5" /> Notice PDF
                  </button>

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
                        <Send className="w-3.5 h-3.5" /> WhatsApp Demand
                      </button>
                      <button
                        onClick={() => handleMarkResolved(item.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Filed in 2B
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Add Hold Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Place Payment Hold on Supplier</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHold} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor / Supplier Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Industrial Supplies Pvt Ltd"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vendor GSTIN (15 Digits)</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27AABCA1294F1Z8"
                    value={newVendorGstin}
                    onChange={(e) => setNewVendorGstin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 uppercase font-bold focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice Number</label>
                  <input
                    type="text"
                    placeholder="INV/2026/041"
                    value={newInvoiceNo}
                    onChange={(e) => setNewInvoiceNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Blocked ITC Amount to Withhold (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 85000"
                  value={newBlockedItc}
                  onChange={(e) => setNewBlockedItc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-red-600"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Recommend withholding 100% of GST component until reflected in GSTR-2B.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vendor Contact Mobile</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vendor Accounts Email</label>
                  <input
                    type="email"
                    placeholder="accounts@vendor.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-sm"
                >
                  Activate Payment Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
