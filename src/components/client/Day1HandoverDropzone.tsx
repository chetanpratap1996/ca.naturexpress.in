"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  ClientEntity,
  DocumentItem,
  DscRecord,
  PortalCredential,
  PortalType,
} from "@/lib/types";
import { evaluateClientOnboardingReadiness } from "@/lib/config/clientOnboardingMatrix";
import { toast } from "@/components/shared/ToastNotification";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  KeyRound,
  Landmark,
  UploadCloud,
} from "lucide-react";

interface Day1HandoverDropzoneProps {
  client: ClientEntity;
  credentials: PortalCredential[];
  dscTokens: DscRecord[];
  uploadDocument: (doc: {
    entityId: string;
    entityName: string;
    category: DocumentItem["category"];
    fileName: string;
    fileSize: string;
    financialYear: string;
    uploadedBy: DocumentItem["uploadedBy"];
    fileContentBase64?: string;
  }) => Promise<any>;
  onRefreshData?: () => Promise<void> | void;
}

const DOC_SLOTS = [
  { id: "COI_DEED", label: "COI / Partnership Deed", dbCategory: "AUDIT_REPORT" },
  { id: "PAN_CARD", label: "Company / Entity PAN Card", dbCategory: "TAX_COMPUTATION" },
  { id: "GST_REG06", label: "GST Registration Certificate (REG-06)", dbCategory: "GST_INVOICES" },
  { id: "LAST_ITR_3CD", label: "Last Filed ITR / Form 3CD", dbCategory: "TAX_COMPUTATION" },
  { id: "OPEN_NOTICE", label: "Pending Notice / ASMT-10 PDF", dbCategory: "NOTICE_REPLY" },
] as const;

export const Day1HandoverDropzone: React.FC<Day1HandoverDropzoneProps> = ({
  client,
  credentials,
  dscTokens,
  uploadDocument,
  onRefreshData,
}) => {
  const readiness = useMemo(
    () => evaluateClientOnboardingReadiness({ client, credentials, dscTokens }),
    [client, credentials, dscTokens]
  );

  const [isExpanded, setIsExpanded] = useState(readiness.pct < 75);
  const [activeSubPanel, setActiveSubPanel] = useState<"DOCS" | "PORTAL" | "BANK">("DOCS");

  // Upload state
  const [selectedDocSlot, setSelectedDocSlot] = useState<string>(DOC_SLOTS[0].id);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Portal credential state
  const [portalType, setPortalType] = useState<PortalType>(
    (readiness.missingPortals[0] as PortalType) || "INCOME_TAX"
  );
  const [portalUsername, setPortalUsername] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [isSavingPortal, setIsSavingPortal] = useState(false);

  // Bank account state
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [statementPassword, setStatementPassword] = useState("");
  const [isSavingBank, setIsSavingBank] = useState(false);

  if (readiness.pct >= 100) return null;

  const handleUploadHandoverFile = async (file: File) => {
    setIsUploadingDoc(true);
    try {
      const slot = DOC_SLOTS.find((s) => s.id === selectedDocSlot) || DOC_SLOTS[0];
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.includes(",") ? result.split(",")[1] : result);
        };
        reader.onerror = () => reject(new Error("Could not read file."));
        reader.readAsDataURL(file);
      });

      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".pdf";
      const safeName = `${slot.id}_${client.pan}_${file.name.replace(/\s+/g, "_")}`;
      await uploadDocument({
        entityId: client.id,
        entityName: client.name,
        category: slot.dbCategory,
        fileName: safeName.endsWith(ext) ? safeName : `${safeName}${ext}`,
        fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        fileContentBase64: base64,
        financialYear: "Permanent / Handover",
        uploadedBy: "CLIENT_PWA",
      });

      toast.success("Handover File Uploaded", `${slot.label} stored safely in your Firm KYC Vault.`);
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      toast.error("Upload Failed", err?.message || "Could not upload document.");
    } finally {
      setIsUploadingDoc(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSavePortalKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUsername.trim() || !portalPassword.trim() || isSavingPortal) return;
    setIsSavingPortal(true);
    try {
      const res = await fetch("/api/client/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          entityId: client.id,
          action: "SAVE_PORTAL_KEY",
          portalType,
          username: portalUsername.trim(),
          password: portalPassword.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to store portal access.");
      }
      toast.success("Portal Key Stored", `${portalType.replace(/_/g, " ")} credentials shared with your CA team.`);
      setPortalUsername("");
      setPortalPassword("");
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      toast.error("Save Failed", err?.message || "Could not store portal access.");
    } finally {
      setIsSavingPortal(false);
    }
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNo.trim() || isSavingBank) return;
    setIsSavingBank(true);
    try {
      const res = await fetch("/api/client/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          entityId: client.id,
          action: "SAVE_BANK_ACCOUNT",
          bankName: bankName.trim(),
          accountNo: accountNo.trim(),
          ifsc: ifsc.trim().toUpperCase(),
          statementPassword: statementPassword.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save bank account.");
      }
      toast.success("Bank Account Saved", `${bankName} added to your Entity DNA.`);
      setBankName("");
      setAccountNo("");
      setIfsc("");
      setStatementPassword("");
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      toast.error("Save Failed", err?.message || "Could not save bank details.");
    } finally {
      setIsSavingBank(false);
    }
  };

  return (
    <div className="bg-white border border-amber-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-slate-900">Complete Your Firm Setup &amp; Handover</h4>
              <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                {readiness.pct}% Ready
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {readiness.missingItems.length > 0
                ? `Pending: ${readiness.missingItems.slice(0, 3).join(" • ")}`
                : "Upload KYC files, portal passwords, or bank statement decryption details once."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <span>{isExpanded ? "Hide Setup" : "Upload Pending Items"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 space-y-4">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActiveSubPanel("DOCS")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeSubPanel === "DOCS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-btred-logo" />
              <span>1. Upload KYC / Past ITR</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubPanel("PORTAL")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeSubPanel === "PORTAL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Portal Passwords ({readiness.missingPortals.length} missing)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubPanel("BANK")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeSubPanel === "BANK" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Bank &amp; PDF Password</span>
            </button>
          </div>

          {activeSubPanel === "DOCS" && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Document Type</label>
                  <select
                    value={selectedDocSlot}
                    onChange={(e) => setSelectedDocSlot(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  >
                    {DOC_SLOTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.json,.xlsx,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadHandoverFile(f);
                    }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingDoc}
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-2 px-4 bg-btred-logo hover:bg-red-700 text-white font-black rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploadingDoc ? "Uploading..." : "Choose File & Upload to Vault"}</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Permanent files (COI, PAN, REG-06) remain stored in your Legal Locker and do not need to be re-sent every month.
              </p>
            </div>
          )}

          {activeSubPanel === "PORTAL" && (
            <form onSubmit={handleSavePortalKey} autoComplete="off" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Government Portal</label>
                  <select
                    value={portalType}
                    onChange={(e) => setPortalType(e.target.value as PortalType)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  >
                    <option value="INCOME_TAX">Income Tax (e-Filing)</option>
                    <option value="GST">GST Common Portal</option>
                    <option value="MCA_V3">MCA V3 Portal</option>
                    <option value="TRACES">TRACES TDS Portal</option>
                    <option value="EPFO">EPFO Employer</option>
                    <option value="ESIC">ESIC Employer</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Login ID / Username *</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={portalUsername}
                    onChange={(e) => setPortalUsername(e.target.value)}
                    placeholder="e.g. PAN / GST username"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="Portal password"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  {client.bankAccounts?.length ? `${client.bankAccounts.length} bank account(s) saved` : "Encrypted storage for your CA compliance desk"}
                </span>
                <button
                  type="submit"
                  disabled={isSavingPortal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSavingPortal ? "Saving..." : "Save Portal Key"}</span>
                </button>
              </div>
            </form>
          )}

          {activeSubPanel === "BANK" && (
            <form onSubmit={handleSaveBankAccount} autoComplete="off" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    placeholder="e.g. 502000..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0000240"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Statement PDF Password</label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={statementPassword}
                    onChange={(e) => setStatementPassword(e.target.value)}
                    placeholder="If monthly PDF locked"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-semibold"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition disabled:opacity-50"
                >
                  {isSavingBank ? "Saving..." : "Save Bank Account"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
