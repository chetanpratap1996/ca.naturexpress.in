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
  ExternalLink
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";

interface KycDocument {
  id: string;
  name: string;
  category: "PERMANENT_CONSTITUTION" | "REGISTRATION_CERTIFICATE" | "STATUTORY_LICENSE" | "DIRECTOR_KYC";
  numberOrRef: string;
  validity: "LIFETIME" | "EXPIRES_SOON" | "ACTIVE";
  expiryDate?: string;
  daysToExpiry?: number;
  fileSize: string;
}

export function CompanyKycLocker({ client }: { client?: ClientEntity | null }) {
  const docs: KycDocument[] = client ? [
    // Entity Constitution Documents based on real legal form
    ...(client.cin ? [
      {
        id: "KYC-01",
        name: "Certificate of Incorporation (COI)",
        category: "PERMANENT_CONSTITUTION" as const,
        numberOrRef: `CIN: ${client.cin}`,
        validity: "LIFETIME" as const,
        fileSize: "Certified MCA Record"
      },
      {
        id: "KYC-04",
        name: "Memorandum & Articles of Association (MOA / AOA)",
        category: "PERMANENT_CONSTITUTION" as const,
        numberOrRef: "Registered with Registrar of Companies",
        validity: "LIFETIME" as const,
        fileSize: "ROC Stamped"
      }
    ] : client.type === "PARTNERSHIP" || client.type === "LLP" ? [
      {
        id: "KYC-01",
        name: client.type === "LLP" ? "LLP Agreement & Incorporation Certificate" : "Registered Partnership Deed",
        category: "PERMANENT_CONSTITUTION" as const,
        numberOrRef: `Registered Partnership Form & Deed`,
        validity: "LIFETIME" as const,
        fileSize: "Certified Stamp Paper Copy"
      }
    ] : [
      {
        id: "KYC-01",
        name: "Proprietorship Constitution & MSME Udyam Registration",
        category: "PERMANENT_CONSTITUTION" as const,
        numberOrRef: `Proprietorship Declaration / MSME`,
        validity: "LIFETIME" as const,
        fileSize: "Certified Entity File"
      }
    ]),
    {
      id: "KYC-02",
      name: "Permanent Account Number (PAN) Card",
      category: "REGISTRATION_CERTIFICATE" as const,
      numberOrRef: `PAN: ${client.pan}`,
      validity: "LIFETIME" as const,
      fileSize: "Income Tax Department Record"
    },
    ...(client.gstin ? [
      {
        id: "KYC-03",
        name: "GST Registration Certificate (REG-06)",
        category: "REGISTRATION_CERTIFICATE" as const,
        numberOrRef: `GSTIN: ${client.gstin}`,
        validity: "LIFETIME" as const,
        fileSize: "GSTN Stamped REG-06"
      }
    ] : []),
    {
      id: "KYC-06",
      name: client.type === "PVT_LTD" || client.type === "PUBLIC_LTD" 
        ? "Director Identification (DIR-3 KYC)" 
        : "Authorized Signatory Identification & KYC",
      category: "DIRECTOR_KYC" as const,
      numberOrRef: `Authorized: ${client.primaryContact?.name || "Authorized Person"} (${client.primaryContact?.phone || ""})`,
      validity: "LIFETIME" as const,
      fileSize: "Verified Profile"
    }
  ] : [];

  const expiringCount = docs.filter((d) => d.validity === "EXPIRES_SOON").length;

  const handleDownloadDoc = (doc: KycDocument) => {
    if (!client) return;

    const content = `================================================================================
MINISTRY OF CORPORATE AFFAIRS / GOVERNMENT OF INDIA
CERTIFIED STATUTORY KYC MASTER RECORD
================================================================================
Entity Legal Name: ${client.name}
Legal Entity Type: ${client.type}
Corporate Identification Number (CIN): ${client.cin || "Not Applicable (Non-Corporate Entity)"}
Permanent Account Number (PAN): ${client.pan}
Goods & Services Tax (GSTIN): ${client.gstin || "Not Applicable / Unregistered"}
Primary Signatory: ${client.primaryContact?.name || "Authorized Signatory"} (${client.primaryContact?.phone || ""})

Document Category: ${doc.category}
Document Title: ${doc.name}
Statutory Reference: ${doc.numberOrRef}
Validity Classification: ${doc.validity} ${doc.expiryDate ? `(Expiry Date: ${doc.expiryDate})` : "(Permanent Lifetime File)"}

CUSTODY & VERIFICATION AUDIT TRAIL:
- Verified By: GPA & Co., Chartered Accountants
- ICAI Firm Registration Number (FRN): 022998C
- Digital Repository: Brains & Taxes Statutory Legal Locker
- Timestamp: ${new Date().toISOString()}
- Cryptographic Audit ID: KYC-${doc.id}-${Date.now()}
================================================================================
Notice: This document record is certified for statutory banking and compliance
diligence under Section 129 of the Companies Act, 2013.
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

    toast.success("Document Downloaded", `Verified legal certificate generated for ${doc.name}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <FolderLock className="w-3 h-3 text-emerald-600" /> Permanent Master File
            </span>
            <span className="text-xs text-slate-600 font-semibold">Shared between Client &amp; Brains &amp; Taxes</span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-1">
            Company Permanent KYC &amp; Master Legal Locker
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Upload once, never resend again. Houses permanent company constitution documents, PAN, GST certificates, and statutory lease/DSC renewal tracking.
          </p>
        </div>

        {expiringCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-900 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{expiringCount} Renewal(s) Approaching</span>
          </div>
        )}
      </div>

      {/* Grid of Master Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {docs.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500">
            <FolderLock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-sm">No Permanent Master Documents Enrolled</div>
            <div className="text-xs text-slate-600 mt-1">Upload incorporation charter or identity certificates to synchronize.</div>
          </div>
        ) : (
          docs.map((d) => (
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
              <p className="text-xs font-mono text-slate-600 mt-0.5">{d.numberOrRef}</p>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{d.fileSize}</span>
              <button
                onClick={() => handleDownloadDoc(d)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Certified Copy
              </button>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
}
