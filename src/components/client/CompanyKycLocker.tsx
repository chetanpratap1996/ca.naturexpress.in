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

const INITIAL_KYC_DOCS: KycDocument[] = [
  {
    id: "KYC-01",
    name: "Certificate of Incorporation (COI) & CIN",
    category: "PERMANENT_CONSTITUTION",
    numberOrRef: "U29100MH2012PTC229104",
    validity: "LIFETIME",
    fileSize: "1.2 MB"
  },
  {
    id: "KYC-02",
    name: "Memorandum & Articles of Association (MOA / AOA)",
    category: "PERMANENT_CONSTITUTION",
    numberOrRef: "Stamped ROC Mumbai Master Copy",
    validity: "LIFETIME",
    fileSize: "4.8 MB"
  },
  {
    id: "KYC-03",
    name: "GST Registration Certificate (Form REG-06)",
    category: "REGISTRATION_CERTIFICATE",
    numberOrRef: "27AAACA1294F1Z8",
    validity: "LIFETIME",
    fileSize: "850 KB"
  },
  {
    id: "KYC-04",
    name: "MSME Udyam Registration Certificate",
    category: "REGISTRATION_CERTIFICATE",
    numberOrRef: "UDYAM-MH-12-0049182 (Small Enterprise)",
    validity: "LIFETIME",
    fileSize: "920 KB"
  },
  {
    id: "KYC-05",
    name: "Director Class-3 DSC (Rajesh Singhania)",
    category: "DIRECTOR_KYC",
    numberOrRef: "ProxKey Token SN: 981240182",
    validity: "EXPIRES_SOON",
    expiryDate: "2026-11-15",
    daysToExpiry: 22,
    fileSize: "Token Vault Ref"
  },
  {
    id: "KYC-06",
    name: "Registered Office Commercial Lease Agreement",
    category: "STATUTORY_LICENSE",
    numberOrRef: "Registered at Sub-Registrar Andheri",
    validity: "EXPIRES_SOON",
    expiryDate: "2026-12-31",
    daysToExpiry: 68,
    fileSize: "3.4 MB"
  }
];

export function CompanyKycLocker({ client }: { client: ClientEntity }) {
  const [docs, setDocs] = useState<KycDocument[]>(INITIAL_KYC_DOCS);

  const expiringCount = docs.filter((d) => d.validity === "EXPIRES_SOON").length;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <FolderLock className="w-3 h-3 text-emerald-600" /> Permanent Master File
            </span>
            <span className="text-xs text-slate-400 font-semibold">Shared between Client &amp; Brains &amp; Taxes</span>
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
        {docs.map((d) => (
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
              <span className="text-slate-400 font-medium">{d.fileSize}</span>
              <button
                onClick={() => alert(`Downloading verified master: ${d.name}`)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
