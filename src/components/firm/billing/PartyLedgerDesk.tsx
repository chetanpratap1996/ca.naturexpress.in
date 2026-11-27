"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ClientEntity, InvoiceItem } from "@/lib/types";
import { useClientContext } from "@/lib/context/ClientContext";
import { toast } from "@/components/shared/ToastNotification";
import { Download, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";

interface PartyLedgerDeskProps {
  clients: ClientEntity[];
  invoices: InvoiceItem[];
  onRefresh?: () => void;
}

export const PartyLedgerDesk: React.FC<PartyLedgerDeskProps> = ({ clients, invoices, onRefresh }) => {
  const { selectedClient, isFirmWideView } = useClientContext();
  const [entityId, setEntityId] = useState<string>(() =>
    selectedClient && !isFirmWideView ? selectedClient.id : clients[0]?.id || ""
  );
  const [entries, setEntries] = useState<any[]>([]);
  const [closingBalance, setClosingBalance] = useState(0);
  const [dsoDays, setDsoDays] = useState(0);
  const [paymentGrade, setPaymentGrade] = useState("A");
  const [suspenseCredits, setSuspenseCredits] = useState<any[]>([]);
  const [assignInvoiceByAlloc, setAssignInvoiceByAlloc] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClient && !isFirmWideView) setEntityId(selectedClient.id);
  }, [selectedClient, isFirmWideView]);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const qs = entityId ? `?entityId=${encodeURIComponent(entityId)}` : "";
      const res = await fetch(`/api/billing/ledger${qs}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
        setClosingBalance(Number(data.closingBalance || 0));
        setDsoDays(Number(data.dsoDays || 0));
        setPaymentGrade(data.paymentGrade || "A");
        setSuspenseCredits(data.suspenseCredits || []);
      }
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const handleAssignSuspense = async (allocationId: string) => {
    const invoiceId = assignInvoiceByAlloc[allocationId];
    if (!invoiceId) {
      toast.error("Select Invoice", "Choose an open invoice to apply this bank credit.");
      return;
    }
    const res = await fetch("/api/billing/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ allocationId, invoiceId }),
    });
    if (res.ok) {
      toast.success("Credit Applied", "Suspense credit matched to invoice.");
      await loadLedger();
      if (onRefresh) onRefresh();
    }
  };

  const handleVerify26as = async (invoiceId: string) => {
    const res = await fetch("/api/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ invoiceId, action: "VERIFY_26AS_TDS" }),
    });
    if (res.ok) {
      toast.success("26AS Verified", "TDS 194J credit marked verified against Form 26AS.");
      if (onRefresh) onRefresh();
    }
  };

  const handleExportStatement = () => {
    const headers = "Date,Ref No,Type,Particulars,Debit,Credit,Balance";
    const rows = entries.map(
      (e) => `"${e.date}","${e.refNo}","${e.type}","${e.particulars}",${e.debit},${e.credit},${e.balance}`
    );
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Party_Ledger_${entityId || "CLIENT"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tdsInvoices = invoices.filter(
    (i) => (!entityId || i.entityId === entityId) && Number(i.tdsClaimedAmount || 0) > 0
  );
  const openInvoices = invoices.filter((i) => i.status !== "PAID");

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold bg-slate-50"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.pan})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
              DSO: <strong>{dsoDays}d</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-700">
              Pay Grade: {paymentGrade}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 font-bold text-red-700 font-mono">
              Closing: ₹{closingBalance.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportStatement}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Statement CSV
          </button>
          <button
            onClick={loadLedger}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Chronological Party Statement */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Ref #</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Particulars</th>
              <th className="px-4 py-2.5 text-right">Debit (₹)</th>
              <th className="px-4 py-2.5 text-right">Credit (₹)</th>
              <th className="px-4 py-2.5 text-right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  No ledger entries for this client yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono">{e.date}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold">{e.refNo}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold">{e.type}</span>
                  </td>
                  <td className="px-4 py-2.5">{e.particulars}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{e.debit > 0 ? e.debit.toLocaleString("en-IN") : "-"}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{e.credit > 0 ? e.credit.toLocaleString("en-IN") : "-"}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{e.balance.toLocaleString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 26AS / AIS TDS Reconciliation */}
      {tdsInvoices.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-900">TDS u/s 194J / 26AS Verification</h4>
          <div className="divide-y divide-slate-100 text-xs">
            {tdsInvoices.map((inv) => (
              <div key={inv.id} className="py-2 flex items-center justify-between">
                <div>
                  <strong className="font-mono">{inv.invoiceNo}</strong> — TDS Deducted:{" "}
                  <strong className="font-mono">₹{Number(inv.tdsClaimedAmount || 0).toLocaleString("en-IN")}</strong>
                </div>
                {inv.tds26asVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Matched in 26AS
                  </span>
                ) : (
                  <button
                    onClick={() => handleVerify26as(inv.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-semibold"
                  >
                    Mark 26AS Verified
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspense Credits Queue */}
      {suspenseCredits.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Unidentified Bank Credits (Suspense Queue — {suspenseCredits.length})
          </h4>
          <div className="space-y-2 text-xs">
            {suspenseCredits.map((s) => (
              <div key={s.id} className="bg-white border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="font-mono">₹{s.cashAmount.toLocaleString("en-IN")}</strong> &bull;{" "}
                  <span className="font-mono text-slate-500">{s.receiptRef}</span> ({s.allocationDate})
                  <p className="text-[11px] text-slate-500 truncate max-w-md">{s.notes}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={assignInvoiceByAlloc[s.id] || ""}
                    onChange={(e) => setAssignInvoiceByAlloc((p) => ({ ...p, [s.id]: e.target.value }))}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
                  >
                    <option value="">Assign to invoice...</option>
                    {openInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNo} — {inv.entityName} (₹{inv.amount.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssignSuspense(s.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold inline-flex items-center gap-1"
                  >
                    Apply <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
