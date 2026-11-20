"use client";

import React, { useState, useMemo } from "react";
import { ClientEntity } from "@/lib/types";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import {
  ImprestTransactionItem,
  ImprestDisbursementCategory,
  ImprestTransactionType,
  STATUTORY_CATEGORY_LABELS,
  DEFAULT_IMPREST_TRANSACTIONS,
  calculateClientImprestSummary,
  generateRule33PureAgentCertificate,
  prepareImprestTopUpWhatsAppMessage,
} from "@/lib/billing/pureAgentImprest";
import { generateWhatsAppUrl } from "@/lib/whatsapp/templates";
import {
  ShieldCheck,
  Building2,
  Receipt,
  Plus,
  Send,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Search,
  Filter,
  CreditCard,
  QrCode,
  X,
  Sparkles,
  ExternalLink,
  Layers,
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface ImprestLedgerDeskProps {
  clients: ClientEntity[];
  initialTransactions?: ImprestTransactionItem[];
  firmUpiVpa?: string;
  firmName?: string;
  onRefresh?: () => void;
}

export function ImprestLedgerDesk({
  clients,
  initialTransactions = DEFAULT_IMPREST_TRANSACTIONS,
  firmUpiVpa = DEFAULT_FIRM_BRANDING.firmUpiVpa,
  firmName = DEFAULT_FIRM_BRANDING.firmName,
  onRefresh,
}: ImprestLedgerDeskProps) {
  const [transactions, setTransactions] = useState<ImprestTransactionItem[]>(initialTransactions);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modals
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certContent, setCertContent] = useState("");

  // Form States
  const [formEntityId, setFormEntityId] = useState(() => clients[0]?.id || "CLI-001");
  const [formCategory, setFormCategory] = useState<ImprestDisbursementCategory>("MCA_ROC_FEES");
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formGovtRef, setFormGovtRef] = useState("");
  const [formChallanNo, setFormChallanNo] = useState("");
  const [formBsrCode, setFormBsrCode] = useState("");
  const [formPaymentMode, setFormPaymentMode] = useState<
    "NET_BANKING_FIRM_ESCROW" | "CORPORATE_CREDIT_CARD" | "NEFT_RTGS"
  >("NET_BANKING_FIRM_ESCROW");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Client Context
  const activeClient = useMemo(() => {
    if (selectedEntityId === "ALL") return clients[0] || null;
    return clients.find((c) => c.id === selectedEntityId) || null;
  }, [selectedEntityId, clients]);

  // Client Summaries
  const clientSummaries = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateClientImprestSummary>> = {};
    clients.forEach((c) => {
      map[c.id] = calculateClientImprestSummary(c.id, c.name, transactions);
    });
    return map;
  }, [clients, transactions]);

  // Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    let advances = 0;
    let disbursed = 0;
    Object.values(clientSummaries).forEach((s) => {
      advances += s.totalAdvancesReceived;
      disbursed += s.totalDisbursedToGovt;
    });
    const net = advances - disbursed;
    const deficitClients = Object.values(clientSummaries).filter((s) => s.isDeficit);
    return {
      advances,
      disbursed,
      net,
      deficitCount: deficitClients.length,
      deficitList: deficitClients,
    };
  }, [clientSummaries]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchEntity = selectedEntityId === "ALL" || t.entityId === selectedEntityId;
      const matchCategory = categoryFilter === "ALL" || t.category === categoryFilter;
      const matchSearch =
        searchTerm === "" ||
        t.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.govtPortalRef && t.govtPortalRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.challanNumber && t.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchEntity && matchCategory && matchSearch;
    });
  }, [transactions, selectedEntityId, categoryFilter, searchTerm]);

  // Handle Recording New Disbursement or Advance
  const handleSaveTransaction = async (type: ImprestTransactionType) => {
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error("Invalid Amount", "Please enter a valid rupee amount");
      return;
    }
    const targetClient = clients.find((c) => c.id === formEntityId);
    if (!targetClient) return;

    setIsSubmitting(true);
    try {
      const payload = {
        entityId: targetClient.id,
        entityName: targetClient.name,
        transactionType: type,
        category: formCategory,
        amount: Number(formAmount),
        date: new Date().toISOString().split("T")[0],
        description: formDesc || (type === "ADVANCE_RECEIVED" ? "Statutory Advance Received" : "Statutory Government Disbursement"),
        govtPortalRef: formGovtRef || undefined,
        challanNumber: formChallanNo || undefined,
        bsrCode: formBsrCode || undefined,
        paymentMode: formPaymentMode,
      };

      const res = await fetch("/api/billing/imprest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setTransactions((prev) => [data.transaction, ...prev]);
        toast.success(
          type === "ADVANCE_RECEIVED" ? "Imprest Advance Recorded" : "Statutory Disbursement Logged",
          `₹${Number(formAmount).toLocaleString("en-IN")} recorded under Rule 33 Pure Agent Ledger for ${targetClient.name}`
        );
        setIsDisbursementModalOpen(false);
        setIsAdvanceModalOpen(false);
        setFormAmount("");
        setFormDesc("");
        setFormGovtRef("");
        setFormChallanNo("");
        setFormBsrCode("");
        if (onRefresh) onRefresh();
      } else {
        toast.error("Operation Failed", data.error || "Unable to save transaction");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to record transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Certificate Modal
  const handleViewCertificate = (client: ClientEntity) => {
    const summary = clientSummaries[client.id] || calculateClientImprestSummary(client.id, client.name, transactions);
    const cert = generateRule33PureAgentCertificate(client.name, client.pan, summary, firmName);
    setCertContent(cert);
    setIsCertModalOpen(true);
  };

  // WhatsApp Top-up dispatch
  const handleSendTopUp = (client: ClientEntity) => {
    const summary = clientSummaries[client.id] || calculateClientImprestSummary(client.id, client.name, transactions);
    const { text } = prepareImprestTopUpWhatsAppMessage(
      client.name,
      client.primaryContact?.name || "Managing Director",
      summary,
      firmUpiVpa,
      firmName
    );
    const phone = client.primaryContact?.phone || (client as any).phone || "9820044101";
    const link = generateWhatsAppUrl(phone, text);
    if (typeof window !== "undefined") {
      window.open(link, "_blank", "noopener,noreferrer");
    }
    toast.success("WhatsApp Opened", `Imprest replenishment message prepared for ${client.name}`);
    setIsTopUpModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Rule 33 Pure Agent Statutory Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Rule 33 CGST Pure Agent Framework
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-white/10 text-slate-300 rounded-full">
                0% GST Pass-Through
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Statutory Imprest & Client Government Advance Ledger
            </h2>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Segregates client government advances (MCA-21 ROC fees, Income Tax Challans, TDS deposits, and Stamp Duty) from taxable CA professional fees (SAC 9982). Guarantees zero GST exposure on client government reimbursements under Rule 33 of CGST Rules, 2017.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4 text-slate-950" />
              Deposit Client Advance
            </button>
            <button
              onClick={() => setIsDisbursementModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Record Govt Disbursement
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Total Advances Received</span>
            <div className="text-xl font-black text-white mt-0.5">
              {formatCurrencyINR(aggregateMetrics.advances)}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Client Escrow Deposits
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Total Govt Disbursed</span>
            <div className="text-xl font-black text-white mt-0.5">
              {formatCurrencyINR(aggregateMetrics.disbursed)}
            </div>
            <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3" /> MCA, CBDT, GSTN Portals
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Net Escrow Balance</span>
            <div className={`text-xl font-black mt-0.5 ${aggregateMetrics.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {aggregateMetrics.net < 0 ? "-" : ""}{formatCurrencyINR(Math.abs(aggregateMetrics.net))}
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">
              {aggregateMetrics.net >= 0 ? "Surplus funds available" : "Deficit (Firm funded pass-through)"}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-400 font-medium">Deficit Alert Clients</span>
            <div className={`text-xl font-black mt-0.5 ${aggregateMetrics.deficitCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {aggregateMetrics.deficitCount} Entities
            </div>
            <span className="text-[10px] text-amber-300 font-medium mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> WhatsApp Requisition Needed
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar & Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Client Entity Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="ALL">All Clients ({clients.length} Entities)</option>
              {clients.map((c) => {
                const s = clientSummaries[c.id];
                const badge = s?.isDeficit ? " [DEFICIT]" : s?.currentAvailableBalance ? ` [Bal: ₹${s.currentAvailableBalance.toLocaleString("en-IN")}]` : "";
                return (
                  <option key={c.id} value={c.id}>
                    {c.name}{badge}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Statutory Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statutory Categories</option>
              {Object.entries(STATUTORY_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search SRN, CIN, Challan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {activeClient && selectedEntityId !== "ALL" && (
            <button
              onClick={() => handleViewCertificate(activeClient)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-all flex items-center gap-1.5 whitespace-nowrap"
              title="View Rule 33 Pure Agent Certificate"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Rule 33 Certificate
            </button>
          )}

          {activeClient && selectedEntityId !== "ALL" && (
            <button
              onClick={() => handleSendTopUp(activeClient)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp Requisition
            </button>
          )}
        </div>
      </div>

      {/* Selected Client Specific Snapshot (If single client chosen) */}
      {selectedEntityId !== "ALL" && activeClient && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                {activeClient.name}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                PAN: {activeClient.pan}
              </span>
              {clientSummaries[activeClient.id]?.isDeficit && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Deficit: Advance Exhausted
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              Primary Contact: {activeClient.primaryContact?.name || "Managing Director"} ({activeClient.primaryContact?.phone || "+91 98200 44101"})
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Available Imprest Balance</span>
              <span className={`text-lg font-black ${clientSummaries[activeClient.id]?.currentAvailableBalance < 0 ? "text-red-600" : "text-emerald-700"}`}>
                {clientSummaries[activeClient.id]?.currentAvailableBalance < 0 ? "-" : ""}
                {formatCurrencyINR(Math.abs(clientSummaries[activeClient.id]?.currentAvailableBalance || 0))}
              </span>
            </div>
            <button
              onClick={() => handleSendTopUp(activeClient)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              Request UPI Top-Up
            </button>
          </div>
        </div>
      )}

      {/* Imprest Transaction Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Pure Agent Transaction Ledger ({filteredTransactions.length} records)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Audit Standard: ICAI SA 500 &amp; CGST Rule 33
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Statutory Purpose</th>
                <th className="py-3 px-4">Govt Ref / Challan</th>
                <th className="py-3 px-4">Payment Channel</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Rule 33</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No statutory imprest transactions found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const catConfig = STATUTORY_CATEGORY_LABELS[txn.category] || STATUTORY_CATEGORY_LABELS.GENERAL_GOVT_CHALLAN;
                  const isAdvance = txn.transactionType === "ADVANCE_RECEIVED";

                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDate(txn.date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-[200px] truncate">
                        {txn.entityName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAdvance ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            Client Advance
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowUpRight className="w-3 h-3 text-blue-600" />
                            Govt Disbursement
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${catConfig.badgeColor}`}>
                            {catConfig.authority}
                          </span>
                          <p className="text-xs text-slate-700 truncate max-w-xs" title={txn.description}>
                            {txn.description}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {txn.govtPortalRef ? (
                          <span className="text-slate-900 font-semibold block">{txn.govtPortalRef}</span>
                        ) : null}
                        {txn.challanNumber ? (
                          <span className="text-slate-500 block text-[10px]">Challan: {txn.challanNumber}</span>
                        ) : null}
                        {!txn.govtPortalRef && !txn.challanNumber && (
                          <span className="text-slate-400">Escrow Direct</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {txn.paymentMode.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-xs whitespace-nowrap">
                        <span className={isAdvance ? "text-emerald-600" : "text-slate-900"}>
                          {isAdvance ? "+" : "-"}{formatCurrencyINR(txn.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800"
                          title="Verified Rule 33 Pure Agent Pass-through (0% GST)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Statutory Government Disbursement */}
      {isDisbursementModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Record Statutory Disbursement</h3>
                  <p className="text-xs text-slate-500">Rule 33 CGST Pure Agent Pass-Through</p>
                </div>
              </div>
              <button
                onClick={() => setIsDisbursementModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Client Entity</label>
                <select
                  value={formEntityId}
                  onChange={(e) => setFormEntityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (PAN: {c.pan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Statutory Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {Object.entries(STATUTORY_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disbursed Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 14400"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Channel</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="NET_BANKING_FIRM_ESCROW">Net Banking (Firm Escrow)</option>
                    <option value="CORPORATE_CREDIT_CARD">Corporate Credit Card</option>
                    <option value="NEFT_RTGS">NEFT / RTGS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Govt Portal Ref / SRN</label>
                  <input
                    type="text"
                    placeholder="e.g. SRN AA9201948"
                    value={formGovtRef}
                    onChange={(e) => setFormGovtRef(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Challan / CIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CH-88192 / CIN-0291"
                    value={formChallanNo}
                    onChange={(e) => setFormChallanNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. MCA-21 ROC filing fees for Form AOC-4 & MGT-7"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800">
                <span className="font-bold flex items-center gap-1 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Rule 33 Statutory Warranty:
                </span>
                Disbursement will be logged as pure agent pass-through. No 18% GST will be levied on this reimbursable government fee.
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsDisbursementModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveTransaction("STATUTORY_DISBURSEMENT")}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? "Recording..." : "Record Disbursement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Deposit Client Advance */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Deposit Client Statutory Advance</h3>
                  <p className="text-xs text-slate-500">Replenish Client Pure Agent Escrow</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Client Entity</label>
                <select
                  value={formEntityId}
                  onChange={(e) => setFormEntityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (PAN: {c.pan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Advance Amount Received (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deposit Description / UTR Ref</label>
                <input
                  type="text"
                  placeholder="e.g. NEFT UTR AXSK291048 - Statutory Advance for FY 2026-27 filings"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveTransaction("ADVANCE_RECEIVED")}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? "Saving..." : "Record Advance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rule 33 Pure Agent Certificate Preview */}
      {isCertModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-slate-900">Rule 33 CGST Pure Agent Certificate</h3>
              </div>
              <button
                onClick={() => setIsCertModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 text-slate-800 p-4 rounded-xl font-mono text-xs overflow-y-auto max-h-96 leading-relaxed whitespace-pre-wrap border border-slate-200">
              {certContent}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500">ICAI SA 500 Audit Evidence Standard</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(certContent);
                    toast.success("Copied to Clipboard", "Pure Agent certificate copy ready");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
