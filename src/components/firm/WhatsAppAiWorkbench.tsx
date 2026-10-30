"use client";

import React, { useState } from "react";
import { toast } from "@/components/shared/ToastNotification";
import { 
  ParsedBankStatement, 
  ClientPasswordVault, 
  ClientEntity 
} from "@/lib/types";
import { 
  MessageSquare, 
  Key, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  Download, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  Clock, 
  Search, 
  FileText,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

interface WhatsAppAiWorkbenchProps {
  clients: ClientEntity[];
  initialStatements?: ParsedBankStatement[];
  initialVaults?: ClientPasswordVault[];
  onTaskUpdated?: () => void;
}

export function WhatsAppAiWorkbench({
  clients,
  initialStatements = [],
  initialVaults = [],
  onTaskUpdated,
}: WhatsAppAiWorkbenchProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>(() => clients[0]?.id || "");
  const [activeStatementIndex, setActiveStatementIndex] = useState<number>(0);

  React.useEffect(() => {
    if (clients.length > 0 && (!selectedEntityId || selectedEntityId === "CLI-001" || !clients.some(c => c.id === selectedEntityId))) {
      setSelectedEntityId(clients[0].id);
    }
  }, [clients, selectedEntityId]);
  const [mobileView, setMobileView] = useState<"chat" | "statement">("chat");
  const [escalationLevel, setEscalationLevel] = useState<"GENTLE" | "PENALTY_WARNING" | "PARTNER_ESCALATION">("PENALTY_WARNING");
  const [isSimulatingIntake, setIsSimulatingIntake] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [customChatInput, setCustomChatInput] = useState("");

  // New Decryption Pattern Modal State
  const [isAddVaultOpen, setIsAddVaultOpen] = useState(false);
  const [newBankName, setNewBankName] = useState("Axis Bank Ltd");
  const [newAccMask, setNewAccMask] = useState("XXXX-XXXX-7712");
  const [newPasswordPattern, setNewPasswordPattern] = useState("PAN (uppercase) + INC_YEAR");

  const [statements, setStatements] = useState<ParsedBankStatement[]>(initialStatements);
  const [vaults, setVaults] = useState<ClientPasswordVault[]>(initialVaults);

  const selectedClient = clients.find((c) => c.id === selectedEntityId) || clients[0] || null;
  const clientStatements = selectedClient ? statements.filter((s) => s.entityId === selectedClient.id) : [];
  const activeStatement = clientStatements[activeStatementIndex] || clientStatements[0] || statements[0] || null;
  const clientVaults = selectedClient ? vaults.filter((v) => v.entityId === selectedClient.id) : [];

  // Simulated WhatsApp conversation history
  const [chatMessages, setChatMessages] = useState([
    {
      id: "MSG-1",
      sender: "BOT",
      text: `Hello ${selectedClient?.primaryContact?.name || "Client Promoter"} ji, this is Brains & Taxes on behalf of GPA & Co., Chartered Accountants. Statutory deadline for GST & TDS is approaching. Please provide HDFC Bank statements for the period.`,
      time: "22-Oct, 10:15 AM",
      status: "READ"
    },
    {
      id: "MSG-2",
      sender: "CLIENT",
      text: "Yes, sending statement now. It is password protected.",
      time: "24-Oct, 02:20 PM",
      status: "DELIVERED"
    },
    {
      id: "MSG-3",
      sender: "CLIENT",
      text: "📄 HDFC_Current_stmt.pdf (Encrypted)",
      attachment: true,
      time: "24-Oct, 02:21 PM",
      status: "RECEIVED"
    },
    {
      id: "MSG-4",
      sender: "BOT",
      text: `✅ Document Received & Auto-Decrypted via Firm Vault! Bypassed using Company PAN (${selectedClient?.pan || "Registered PAN"}). 8 transactions extracted & categorized into Sales/Tax Challans. Task moved to In-Preparation.`,
      time: "24-Oct, 02:22 PM",
      status: "SENT"
    }
  ]);

  const handleSendReminder = (level: "GENTLE" | "PENALTY_WARNING" | "PARTNER_ESCALATION") => {
    let text = "";
    if (level === "GENTLE") {
      text = `Gentle reminder: Please share your Bank Statement & Purchase Invoices so we can finalize GSTR-3B well before the rush.`;
    } else if (level === "PENALTY_WARNING") {
      text = `⚠️ Urgent: GST portal late fee of ₹50/day and TDS Section 234E late fee of ₹200/day will accrue starting midnight. Avoid statutory penalties by uploading today.`;
    } else {
      text = `🚨 Final Notice from CA Gunjan Jain (Managing Partner): Your audit file is pending sign-off due to missing statements. Please provide immediately or reply here.`;
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: `MSG-${Date.now()}`,
        sender: "BOT",
        text,
        time: "Just now",
        status: "SENT"
      }
    ]);
    setSuccessToast(`Automated WhatsApp dispatch sent to ${selectedClient?.primaryContact?.phone || "Client"}!`);
    toast.success(
      "WhatsApp Dispatch Sent",
      `Automated ${level.replace(/_/g, " ")} notification delivered to client phone.`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSendCustomMessage = () => {
    if (!customChatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `MSG-${Date.now()}`,
        sender: "BOT",
        text: customChatInput.trim(),
        time: "Just now",
        status: "SENT"
      }
    ]);
    setCustomChatInput("");
    setSuccessToast(`Message sent to ${selectedClient?.primaryContact?.name || "Client"} on WhatsApp!`);
    toast.success("Message Delivered", `WhatsApp sent to ${selectedClient?.primaryContact?.name || "Client"}.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSimulateNewUpload = async () => {
    setIsSimulatingIntake(true);
    try {
      const res = await fetch("/api/whatsapp/parser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TEST_DECRYPT_AND_PARSE",
          entityId: selectedEntityId,
          fileName: `WhatsApp_HDFC_Current_A_c_${Date.now().toString().slice(-4)}.pdf`
        })
      });
      const data = await res.json();
      if (data.success && data.statement) {
        setStatements((prev) => [data.statement, ...prev]);
        setActiveStatementIndex(0);
        setSuccessToast(`New PDF received on WhatsApp: Password bypassed & 6 transactions parsed!`);
        toast.success(
          "Statement Decrypted & Parsed",
          "Automated parser bypassed password & extracted transactions into firm ledger."
        );
        setTimeout(() => setSuccessToast(null), 5000);
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (e) {
      toast.error("Intake Error", "Failed to parse incoming WhatsApp statement.");
      console.error(e);
    } finally {
      setIsSimulatingIntake(false);
    }
  };

  const handleAddVaultPattern = async () => {
    try {
      const res = await fetch("/api/whatsapp/parser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PASSWORD_VAULT_RULE",
          entityId: selectedEntityId,
          bankName: newBankName,
          accountNumberMasked: newAccMask,
          pdfPasswordPattern: newPasswordPattern,
          notes: "Configured via WhatsApp AI Workbench"
        })
      });
      const data = await res.json();
      if (data.success && data.vault) {
        setVaults((prev) => [...prev, data.vault]);
        setIsAddVaultOpen(false);
        setSuccessToast(`Saved decryption rule for ${newBankName}!`);
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50/70 via-white to-red-50/40 border border-red-200 rounded-2xl p-6 text-slate-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-red-50 text-btred-logo border border-red-200 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-800" /> WhatsApp Bot + Statement OCR
              </span>
              <span className="text-xs text-slate-600">Zero-Friction Document Ingestion</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-700" /> WhatsApp AI Collector &amp; Auto-Decryption Engine
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Clients send password-protected bank PDFs on WhatsApp. Brains &amp; Taxes automatically matches client password patterns, bypasses PDF encryption, parses ledger transactions, and tags them for 3CD and GST filing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateNewUpload}
              disabled={isSimulatingIntake}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isSimulatingIntake ? "Decrypting & Parsing..." : "Simulate Incoming WhatsApp PDF"}
            </button>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="bg-white border-l-4 border-l-emerald-600 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Entity Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs text-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 uppercase">Selected Entity:</span>
          <select
            value={selectedEntityId || selectedClient?.id || ""}
            onChange={(e) => {
              setSelectedEntityId(e.target.value);
              setActiveStatementIndex(0);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-red-500 focus:bg-white font-semibold"
          >
            {clients.length === 0 ? (
              <option value="">No clients onboarded</option>
            ) : (
              clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.pan})
                </option>
              ))
            )}
          </select>
        </div>
        <div className="text-xs text-slate-600 flex items-center gap-3">
          <span>Promoter: <strong className="text-white">{selectedClient?.primaryContact?.name || "No Client Selected"}</strong></span>
          <span>WhatsApp: <strong className="text-emerald-700 font-mono">{selectedClient?.primaryContact?.phone || "N/A"}</strong></span>
        </div>
      </div>

      {/* Mobile View Toggle (screens < lg) */}
      <div className="flex lg:hidden items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold w-full">
        <button
          onClick={() => setMobileView("chat")}
          className={`flex-1 py-2 text-center rounded-xl transition ${
            mobileView === "chat" ? "bg-emerald-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          WhatsApp Chat &amp; Rules
        </button>
        <button
          onClick={() => setMobileView("statement")}
          className={`flex-1 py-2 text-center rounded-xl transition ${
            mobileView === "statement" ? "bg-teal-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Extracted Ledger ({activeStatement?.transactions?.length || 0})
        </button>
      </div>

      {/* Two Column Grid: Left WhatsApp Thread, Right Parsed Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live WhatsApp Escalation Bot (5 cols) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileView === "chat" ? "block" : "hidden lg:block"}`}>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg flex flex-col h-[640px]">
            {/* Chat Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {selectedClient?.primaryContact?.name ? selectedClient.primaryContact.name.slice(0, 2).toUpperCase() : "CL"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedClient?.primaryContact?.name || "Client Contact"}</h4>
                  <p className="text-[11px] text-emerald-700 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified WhatsApp Line
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono">Brains &amp; Taxes Assistant</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "CLIENT" ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs ${
                      msg.sender === "CLIENT"
                        ? "bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40"
                        : "bg-[#005c4b] text-white rounded-tr-none shadow-md"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-600">
                      <span>{msg.time}</span>
                      {msg.sender === "BOT" && <Check className="w-3 h-3 text-teal-700" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Input & Automated Escalation Dispatchers */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type custom WhatsApp message to client..."
                  value={customChatInput}
                  onChange={(e) => setCustomChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customChatInput.trim()) {
                      handleSendCustomMessage();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={handleSendCustomMessage}
                  className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-xl transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Automated Escalation Triggers
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleSendReminder("GENTLE")}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-lg transition text-center"
                >
                  L1: Gentle
                </button>
                <button
                  onClick={() => handleSendReminder("PENALTY_WARNING")}
                  className="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[11px] font-medium rounded-lg border border-amber-500/30 transition text-center"
                >
                  L2: Penalty
                </button>
                <button
                  onClick={() => handleSendReminder("PARTNER_ESCALATION")}
                  className="px-2 py-1.5 bg-rose-500/20 hover:bg-red-50 text-btred-logo border border-red-200 font-bold text-[11px] font-medium rounded-lg border border-rose-500/30 transition text-center"
                >
                  L3: Partner
                </button>
              </div>
            </div>
          </div>

          {/* Decryption Vault Summary for this Client */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Client Password Vault</h4>
              </div>
              <button
                onClick={() => setIsAddVaultOpen(true)}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800"
              >
                + Add Bank Pattern
              </button>
            </div>
            <div className="space-y-2">
              {clientVaults.map((v) => (
                <div key={v.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-800">
                  <div>
                    <span className="font-semibold text-white block">{v.bankName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{v.accountNumberMasked}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 font-bold rounded font-mono text-[10px] block">
                      {v.pdfPasswordPattern}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Pattern Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Statement Parser & AI Ledger (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileView === "statement" ? "block" : "hidden lg:block"}`}>
          {activeStatement ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-5">
              {/* Statement Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded text-[10px] font-bold uppercase flex items-center gap-1">
                      <Unlock className="w-3 h-3 text-emerald-700" /> Auto-Decrypted via Vault
                    </span>
                    <span className="text-xs text-slate-600">{activeStatement.parsedAt.slice(0, 10)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{activeStatement.bankName}</h3>
                  <p className="text-xs text-slate-500 font-mono">File: {activeStatement.sourceFile} • Period: {activeStatement.statementPeriod}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert("Exported TallyPrime XML Voucher Batch successfully!")}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Push to Tally XML
                  </button>
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-900">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase">Opening Balance</span>
                  <div className="text-sm font-bold text-slate-800 mt-1">₹{activeStatement.openingBalance.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-900">
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase">Total Inward (Credits)</span>
                  <div className="text-sm font-bold text-emerald-700 mt-1">+₹{activeStatement.totalDeposits.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-900">
                  <span className="text-[10px] font-semibold text-btred-logo uppercase">Total Outward (Debits)</span>
                  <div className="text-sm font-bold text-btred-logo mt-1">-₹{activeStatement.totalWithdrawals.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-900">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase">Closing Balance</span>
                  <div className="text-sm font-bold text-indigo-300 mt-1">₹{activeStatement.closingBalance.toLocaleString("en-IN")}</div>
                </div>
              </div>

              {/* Extracted Transactions Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Extracted &amp; AI-Tagged Tax Transactions ({activeStatement.transactions.length})
                  </h4>
                  <span className="text-[11px] text-slate-600">Heuristics: TDS 281, PMT-06, B2B</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-semibold text-slate-700">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Description / Narration</th>
                        <th className="py-2.5 px-3">AI Tax Tag</th>
                        <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                        <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-mono text-slate-900">
                      {activeStatement.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{tx.date}</td>
                          <td className="py-2 px-3 text-slate-800 font-sans max-w-[200px] truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.aiSuggestedCategory === "GST_CHALLAN"
                                ? "bg-amber-50 text-amber-900 border border-amber-200 font-bold"
                                : tx.aiSuggestedCategory === "SALES_RECEIPT"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                                : tx.aiSuggestedCategory === "DIRECTOR_REMUNERATION"
                                ? "bg-purple-50 text-purple-900 border border-purple-200 font-bold"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {tx.aiSuggestedCategory.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-btred-logo font-semibold">
                            {tx.withdrawal > 0 ? `₹${tx.withdrawal.toLocaleString("en-IN")}` : "-"}
                          </td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                            {tx.deposit > 0 ? `₹${tx.deposit.toLocaleString("en-IN")}` : "-"}
                          </td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className="inline-flex items-center text-[10px] text-teal-700 font-semibold gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-600">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No statements parsed yet for this client.</p>
              <button
                onClick={handleSimulateNewUpload}
                className="mt-3 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold"
              >
                Simulate Statement Intake
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Password Vault Modal */}
      {isAddVaultOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-white">Add Bank Decryption Rule</h3>
              </div>
              <button onClick={() => setIsAddVaultOpen(false)} className="text-slate-600 hover:text-slate-900">✕</button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Masked Account Number</label>
                <input
                  type="text"
                  value={newAccMask}
                  onChange={(e) => setNewAccMask(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">PDF Password Rule / Decryption Key</label>
                <input
                  type="text"
                  value={newPasswordPattern}
                  onChange={(e) => setNewPasswordPattern(e.target.value)}
                  placeholder="e.g. PAN in caps + DDMM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-red-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Brains &amp; Taxes will evaluate this pattern automatically whenever the client uploads a statement.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setIsAddVaultOpen(false)} className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs">
                Cancel
              </button>
              <button
                onClick={handleAddVaultPattern}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Save Decryption Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
