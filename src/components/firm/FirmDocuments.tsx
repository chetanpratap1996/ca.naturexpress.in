"use client";

import React, { FormEvent, useState } from "react";
import { Download, FileText, UploadCloud } from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";
import { ClientEntity, DocumentItem } from "@/lib/types";

const CATEGORIES: DocumentItem["category"][] = [
  "BANK_STATEMENT", "GST_INVOICES", "TAX_COMPUTATION", "AUDIT_REPORT", "NOTICE_REPLY", "CHALLAN",
];

function currentFinancialYear() {
  const today = new Date();
  const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

interface FirmDocumentsProps {
  clients: ClientEntity[];
  documents: DocumentItem[];
  onUpload: (data: { entityId: string; category: DocumentItem["category"]; financialYear: string; file: File }) => Promise<DocumentItem | undefined>;
  onReview: (docId: string, status: DocumentItem["reviewStatus"], notes?: string) => Promise<DocumentItem | undefined>;
}

export function FirmDocuments({ clients, documents, onUpload, onReview }: FirmDocumentsProps) {
  const [entityId, setEntityId] = useState("");
  const [category, setCategory] = useState<DocumentItem["category"] | "">("");
  const [financialYear, setFinancialYear] = useState(currentFinancialYear);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!entityId || !category || !financialYear.trim() || !file || isUploading) return;
    setIsUploading(true);
    try {
      const saved = await onUpload({ entityId, category, financialYear: financialYear.trim(), file });
      if (!saved) throw new Error("The server did not confirm the document was stored.");
      setFile(null);
      const input = document.getElementById("firm-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
      toast.success("Document stored", `${saved.fileName} was saved in private firm storage.`);
    } catch (error) {
      toast.error("Upload failed", error instanceof Error ? error.message : "The document could not be stored.");
    } finally {
      setIsUploading(false);
    }
  };

  const download = async (doc: DocumentItem) => {
    setDownloadingId(doc.id);
    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(doc.id)}/download`);
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "The stored file is not available.");
      }
      const link = document.createElement("a");
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const result = await response.json().catch(() => null);
        if (typeof result?.url !== "string") throw new Error(result?.error || "The stored file is not available.");
        link.href = result.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.href = URL.createObjectURL(await response.blob());
        link.download = doc.fileName;
      }
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (link.href.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (error) {
      toast.error("Download failed", error instanceof Error ? error.message : "The file could not be prepared.");
    } finally {
      setDownloadingId(null);
    }
  };

  const review = async (doc: DocumentItem, status: DocumentItem["reviewStatus"]) => {
    try {
      await onReview(doc.id, status);
      toast.success("Review saved", `${doc.fileName} is now marked ${status.replace(/_/g, " ").toLowerCase()}.`);
    } catch (error) {
      toast.error("Review not saved", error instanceof Error ? error.message : "Refresh and try again.");
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Private firm documents</h2>
        <p className="mt-1 text-sm text-slate-600">Files are stored in a private bucket and download links expire after one minute. Maximum file size is 20 MB.</p>
      </header>

      <form onSubmit={upload} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Client entity
          <select required value={entityId} onChange={(e) => setEntityId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2">
            <option value="">Select a client</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Document category
          <select required value={category} onChange={(e) => setCategory(e.target.value as DocumentItem["category"] | "")} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2">
            <option value="">Select a category</option>
            {CATEGORIES.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Financial year
          <input required maxLength={20} value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          File
          <input id="firm-document-file" required type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.xls,.xlsx,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
        </label>
        <div className="md:col-span-2">
          <button type="submit" disabled={!clients.length || isUploading} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <UploadCloud className="h-4 w-4" />{isUploading ? "Storing file…" : "Upload to private storage"}
          </button>
          {!clients.length && <p className="mt-2 text-sm text-amber-800">Add a client entity before uploading a firm document.</p>}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 font-bold text-slate-800">Firm document list ({documents.length})</div>
        {documents.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No document records are stored for this firm yet.</p>
        ) : documents.map((doc) => (
          <article key={doc.id} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{doc.fileName}</p>
                <p className="text-xs text-slate-600">{doc.entityName} · {doc.category.replace(/_/g, " ")} · {doc.financialYear} · {doc.fileSize}</p>
                <p className="mt-1 text-xs text-slate-500">Review: {doc.reviewStatus.replace(/_/g, " ").toLowerCase()}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" disabled={!doc.storagePath || downloadingId === doc.id} onClick={() => void download(doc)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50">
                <Download className="h-3.5 w-3.5" />{downloadingId === doc.id ? "Preparing…" : "Download"}
              </button>
              {doc.reviewStatus === "PENDING_REVIEW" && <>
                <button type="button" onClick={() => void review(doc, "APPROVED")} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
                <button type="button" onClick={() => void review(doc, "CORRECTION_NEEDED")} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">Request correction</button>
              </>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
