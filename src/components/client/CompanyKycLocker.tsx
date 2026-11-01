"use client";

import React, { useState } from "react";
import { 
  FolderLock, 
  FileCheck, 
  Clock, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  KeyRound, 
  Building, 
  ShieldCheck,
  Calendar,
  ExternalLink,
  Copy,
  Plus,
  X,
  Search,
  Filter,
  FileText,
  Sparkles,
  Check
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export interface KycDocument {
  id: string;
  name: string;
  category: "CONSTITUTION" | "TAX_REGISTRATIONS" | "LICENSES_PERMITS" | "DIRECTOR_KYC";
  numberOrRef: string;
  validity: "LIFETIME" | "EXPIRES_SOON" | "ACTIVE" | "EXPIRED";
  expiryDate?: string;
  daysToExpiry?: number;
  fileSize: string;
}

export function CompanyKycLocker({ client }: { client?: ClientEntity | null }) {
  const initialDocs: KycDocument[] = client ? [
    {
      id: "KYC-01",
      name: "Certificate of Incorporation (COI)",
      category: "CONSTITUTION",
      numberOrRef: `CIN: ${client.cin || "U72900UP2024PTC199821"}`,
      validity: "LIFETIME",
      fileSize: "2.4 MB PDF"
    },
    {
      id: "KYC-02",
      name: "Permanent Account Number (PAN) Card",
      category: "TAX_REGISTRATIONS",
      numberOrRef: `PAN: ${client.pan}`,
      validity: "LIFETIME",
      fileSize: "1.1 MB PDF"
    },
    {
      id: "KYC-03",
      name: "GST Registration Certificate (REG-06)",
      category: "TAX_REGISTRATIONS",
      numberOrRef: `GSTIN: ${client.gstin || "09AANCP9915B1Z4"}`,
      validity: "LIFETIME",
      fileSize: "3.8 MB PDF"
    },
    {
      id: "KYC-04",
      name: "Memorandum & Articles of Association (MOA / AOA)",
      category: "CONSTITUTION",
      numberOrRef: "Form INC-33 & INC-34 Registered under ROC",
      validity: "LIFETIME",
      fileSize: "8.2 MB PDF"
    },
    {
      id: "KYC-05",
      name: "Tax Deduction Account Number (TAN) Allotment",
      category: "TAX_REGISTRATIONS",
      numberOrRef: "TAN: KNP129482F (Income Tax Dept)",
      validity: "LIFETIME",
      fileSize: "850 KB PDF"
    },
    {
      id: "KYC-06",
      name: "MSME Udyam Registration Certificate",
      category: "LICENSES_PERMITS",
      numberOrRef: "UDYAM-UP-08-0019284 (Micro Enterprise)",
      validity: "LIFETIME",
      fileSize: "1.4 MB PDF"
    },
    {
      id: "KYC-07",
      name: "Commercial Office Registered Lease Agreement",
      category: "LICENSES_PERMITS",
      numberOrRef: "Registered Sub-Registrar Lease Deed",
      validity: "EXPIRES_SOON",
      expiryDate: "2026-12-31",
      daysToExpiry: 61,
      fileSize: "4.5 MB PDF"
    },
    {
      id: "KYC-08",
      name: "Director Identification Number (DIR-3 KYC)",
      category: "DIRECTOR_KYC",
      numberOrRef: `Director DIN KYC Active • ${client.primaryContact?.phone || ""}`,
      validity: "LIFETIME",
      fileSize: "MCA V3 Synced"
    },
    {
      id: "KYC-09",
      name: "Class 3 eMudhra Digital Signature (DSC)",
      category: "DIRECTOR_KYC",
      numberOrRef: "eMudhra 2048-bit USB Cryptographic Token",
      validity: "EXPIRES_SOON",
      expiryDate: "2027-01-15",
      daysToExpiry: 76,
      fileSize: "Hardware Safe"
    }
  ] : [];

  const [docs, setDocs] = useState<KycDocument[]>(initialDocs);
  const [activeCategory, setActiveCategory] = useState<"ALL" | "CONSTITUTION" | "TAX_REGISTRATIONS" | "LICENSES_PERMITS" | "DIRECTOR_KYC">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Doc Form State
  const [newDocName, setNewDocName] = useState("");
  const [newCategory, setNewCategory] = useState<KycDocument["category"]>("LICENSES_PERMITS");
  const [newRef, setNewRef] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");

  const expiringCount = docs.filter((d) => d.validity === "EXPIRES_SOON").length;

  const filteredDocs = docs.filter((d) => {
    const matchesCategory = activeCategory === "ALL" || d.category === activeCategory;
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.numberOrRef.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to Clipboard", text);
      setTimeout(() => setCopiedKey(null), 3000);
    }
  };

  const handleDownloadDoc = (doc: KycDocument) => {
    if (!client) return;

    const content = `================================================================================
MINISTRY OF CORPORATE AFFAIRS / GOVERNMENT OF INDIA
CERTIFIED STATUTORY KYC MASTER RECORD
================================================================================
Entity Legal Name: ${client.name}
Corporate Identification Number (CIN): ${client.cin || "U72900UP2024PTC199821"}
Permanent Account Number (PAN): ${client.pan}
Goods & Services Tax (GSTIN): ${client.gstin || "Not Applicable"}

Document Category: ${doc.category.replace(/_/g, " ")}
Document Title: ${doc.name}
Statutory Reference / Ref No: ${doc.numberOrRef}
Validity Classification: ${doc.validity} ${doc.expiryDate ? `(Expiry Date: ${doc.expiryDate})` : "(Permanent Lifetime File)"}

CUSTODY & VERIFICATION AUDIT TRAIL:
- Certified By: ${DEFAULT_FIRM_BRANDING.firmName}
- ICAI Firm Registration Number (FRN): ${DEFAULT_FIRM_BRANDING.frn}
- Digital Repository: Brains & Taxes Statutory Legal Locker
- Timestamp: ${new Date().toISOString()}
- Cryptographic Audit ID: KYC-${doc.id}-${Date.now()}
================================================================================
Notice: This document record is certified for statutory banking, credit appraisal,
and compliance diligence under Section 129 of the Companies Act, 2013.
================================================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/[^a-zA-Z0-9]/g, "_")}_${doc.name.replace(/[^a-zA-Z0-9]/g, "_")}_CERTIFIED.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Certified Document Downloaded", `Generated verified master file for ${doc.name}`);
  };

  const handleDownloadAllKycDossier = () => {
    if (!client) return;
    const manifest = `OFFICIAL ALL-IN-ONE COMPANY MASTER KYC DOSSIER
================================================================================
Applicant Legal Entity: ${client.name}
CIN: ${client.cin || "U72900UP2024PTC199821"}
PAN: ${client.pan}
GSTIN: ${client.gstin || "N/A"}
Certifying Practice: ${DEFAULT_FIRM_BRANDING.firmName} (FRN: ${DEFAULT_FIRM_BRANDING.frn})
Date of Dossier Compilation: ${new Date().toLocaleDateString("en-IN")}

INCLUDED STATUTORY CONSTITUTION & REGISTRATION CERTIFICATES:
${docs.map((d, i) => `${i + 1}. [${d.category}] ${d.name} (${d.numberOrRef}) - Status: ${d.validity}`).join("\n")}

================================================================================
Verified under ICAI SQC-1 standard. Valid for Bank Account Opening & Vendor KYC.`;

    const blob = new Blob([manifest], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.name.replace(/[^a-zA-Z0-9]/g, "_")}_Complete_Master_KYC_Dossier.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Master KYC Pack Downloaded", "All 9 statutory identity records compiled.");
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newRef) {
      toast.error("Missing Details", "Please provide Document Title and Statutory Number.");
      return;
    }

    const newDoc: KycDocument = {
      id: `KYC-${Date.now().toString().slice(-4)}`,
      name: newDocName.trim(),
      category: newCategory,
      numberOrRef: newRef.trim(),
      validity: newExpiryDate ? "EXPIRES_SOON" : "LIFETIME",
      expiryDate: newExpiryDate || undefined,
      daysToExpiry: newExpiryDate ? Math.max(1, Math.round((new Date(newExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : undefined,
      fileSize: "Uploaded Verified PDF"
    };

    setDocs([newDoc, ...docs]);
    setIsAddModalOpen(false);
    setNewDocName("");
    setNewRef("");
    setNewExpiryDate("");
    toast.success("Document Added", `${newDoc.name} registered in legal locker.`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <FolderLock className="w-3 h-3 text-emerald-600" /> Permanent Master File
            </span>
            <span className="text-xs text-slate-500 font-semibold">Shared with GPA &amp; Co. Audit Safe</span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-1">
            Company Permanent KYC &amp; Master Legal Locker &bull; {client?.name}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Upload once, never resend again. Houses permanent company constitution documents, PAN, GST certificates, and statutory license expiry tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAllKycDossier}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Download complete bundle for bank account opening or vendor onboarding"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download Master KYC Pack</span>
            <span className="sm:hidden">KYC Pack</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 bg-red-50 hover:bg-red-100 text-btred-logo border border-red-200 rounded-xl transition"
            title="Add Document to Locker"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Identifier Copy Bar */}
      {client && (
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">PAN Number</span>
              <span className="font-mono font-black text-slate-900 text-xs">{client.pan}</span>
            </div>
            <button
              onClick={() => handleCopy(client.pan, "pan")}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition"
              title="Copy PAN"
            >
              {copiedKey === "pan" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">GSTIN Number</span>
              <span className="font-mono font-black text-slate-900 text-xs truncate max-w-[120px]">{client.gstin || "N/A"}</span>
            </div>
            <button
              onClick={() => handleCopy(client.gstin || "", "gstin")}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition"
              title="Copy GSTIN"
            >
              {copiedKey === "gstin" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Corporate CIN</span>
              <span className="font-mono font-black text-slate-900 text-xs truncate max-w-[120px]">{client.cin || "U72900UP2024PTC199821"}</span>
            </div>
            <button
              onClick={() => handleCopy(client.cin || "U72900UP2024PTC199821", "cin")}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition"
              title="Copy CIN"
            >
              {copiedKey === "cin" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">MSME Udyam</span>
              <span className="font-mono font-black text-slate-900 text-xs truncate max-w-[120px]">UDYAM-UP-08-0019284</span>
            </div>
            <button
              onClick={() => handleCopy("UDYAM-UP-08-0019284", "udyam")}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition"
              title="Copy Udyam"
            >
              {copiedKey === "udyam" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold scrollbar-none">
          {[
            { id: "ALL", label: "All Master Files" },
            { id: "CONSTITUTION", label: "Constitution / COI" },
            { id: "TAX_REGISTRATIONS", label: "PAN / GST / TAN" },
            { id: "LICENSES_PERMITS", label: "Udyam & Leases" },
            { id: "DIRECTOR_KYC", label: "Director KYC / DSC" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap border ${
                activeCategory === cat.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document or reference..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Grid of Master Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500">
            <FolderLock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-sm">No Matching Statutory Documents Found</div>
            <div className="text-xs text-slate-500 mt-1">Try another category or click + to add a permanent certificate.</div>
          </div>
        ) : (
          filteredDocs.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {d.category.replace(/_/g, " ")}
                  </span>
                  {d.validity === "EXPIRES_SOON" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Expires in {d.daysToExpiry}d
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lifetime Master
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 mt-1.5">{d.name}</h4>
                <p className="text-xs font-mono text-slate-600 mt-0.5 truncate" title={d.numberOrRef}>{d.numberOrRef}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium text-[11px]">{d.fileSize}</span>
                <button
                  onClick={() => handleDownloadDoc(d)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Certified Copy
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FolderLock className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">Add Permanent Statutory Document</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Factory License / Import Export Code (IEC)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Classification Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-red-600"
                >
                  <option value="CONSTITUTION">Permanent Constitution / Charter</option>
                  <option value="TAX_REGISTRATIONS">Tax Registrations (PAN, GST, TAN, PT)</option>
                  <option value="LICENSES_PERMITS">Statutory Licenses, Udyam &amp; Leases</option>
                  <option value="DIRECTOR_KYC">Director KYC, DIN &amp; Digital Signatures</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Registration / Certificate Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IEC081294819 / License No. IND/2026/01"
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expiry / Renewal Date (Optional)</label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-red-600"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Leave empty if lifetime permanent certificate (e.g. PAN, COI, MOA).
                </span>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm"
                >
                  Save to Master Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
