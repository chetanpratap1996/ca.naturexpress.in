"use client";

import React, { useState } from "react";
import { INITIAL_TASKS, INITIAL_DOCUMENTS } from "@/lib/data/mockData";
import { ComplianceTask, DocumentItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { openWhatsAppPreset, sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { 
  Clock, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  MessageSquare,
  KeyRound,
  PhoneCall,
  FileText,
  Lock,
  Unlock,
  Sparkles,
  Zap,
  Check,
  CalendarCheck,
  ShieldCheck,
  FileCheck
} from "lucide-react";
import { TaxAuditWorkpaperModal } from "@/components/firm/TaxAuditWorkpaperModal";
import { BankStatementParser } from "@/components/firm/BankStatementParser";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { toast } from "@/components/shared/ToastNotification";

export const ArticleWorkbench: React.FC = () => {
  const { tasks: hookTasks, documents: hookDocs, clients, updateTask } = useTaxoData();
  const [tasks, setTasks] = useState<ComplianceTask[]>(hookTasks.length > 0 ? hookTasks : INITIAL_TASKS);
  const [documents, setDocuments] = useState<DocumentItem[]>(hookDocs.length > 0 ? hookDocs : INITIAL_DOCUMENTS);

  React.useEffect(() => {
    if (hookTasks.length > 0) setTasks(hookTasks);
  }, [hookTasks]);

  React.useEffect(() => {
    if (hookDocs.length > 0) setDocuments(hookDocs);
  }, [hookDocs]);
  const [activeTab, setActiveTab] = useState<"tasks" | "doc-review" | "bank-decryptor" | "chat-hub" | "timesheet" | "otp-relay" | "icai-register">("tasks");
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<{ id: string; sender: string; text: string; time: string; isClient: boolean }[]>([
    {
      id: "1",
      sender: "Kriti Jain (Article)",
      text: "Sir, we completed the statutory GSTR-3B reconciliation. Vendor invoice is missing in GSTR-2B. Please confirm if we should reverse ITC or pay under protest.",
      time: "10:15 AM",
      isClient: false,
    },
    {
      id: "2",
      sender: "Client Authorized Signatory",
      text: "Checked with the vendor. They will upload in quarterly GSTR-1. Please defer the ITC to next month and file 3B today.",
      time: "10:42 AM",
      isClient: true,
    },
  ]);

  // Signatory OTP Call Coordination State (No in-app secret OTP storage)
  const [otpCoordinationState, setOtpCoordinationState] = useState<"idle" | "heads_up_sent" | "director_ready" | "filing_authorized">("idle");
  const [otpNotes, setOtpNotes] = useState("");

  // Bank Statement Decryption State
  const [decryptingFileId, setDecryptingFileId] = useState<string | null>(null);
  const [decryptedFiles, setDecryptedFiles] = useState<string[]>([]);
  const [decryptRule, setDecryptRule] = useState<string>("PAN_INCORP_YEAR");

  // Timesheet State
  const [loggedHours, setLoggedHours] = useState<number>(35.5);
  const [isSubmittingTimesheet, setIsSubmittingTimesheet] = useState<boolean>(false);
  const [timesheetSubmitted, setTimesheetSubmitted] = useState<boolean>(false);

  // Workpaper Modal State
  const [workpaperModalOpen, setWorkpaperModalOpen] = useState(false);
  const [selectedWorkpaperEntity, setSelectedWorkpaperEntity] = useState(clients[0]?.name || "");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const myTasks = tasks.filter(
    (t) => t.assignedTo.includes("Kriti") || t.assignedTo.includes("Article")
  );

  const handleTaskWhatsAppChase = (task: ComplianceTask) => {
    openWhatsAppPreset(
      "919823011928",
      "DOC_CHASE",
      {
        clientName: task.entityName,
        serviceName: task.title,
        period: task.period,
        deadline: formatDate(task.dueDate),
        missingDocs: task.missingDocumentsList || ["Statutory bank statements", "Purchase register"],
      }
    );
    updateTask(task.id, { 
      chaseCount: task.chaseCount + 1, 
      lastChaseDate: new Date().toISOString().split("T")[0] 
    }).catch(console.error);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, chaseCount: t.chaseCount + 1, lastChaseDate: new Date().toISOString().split("T")[0] } : t
      )
    );
    setToastMessage(`Opened 1-tap WhatsApp chase for ${task.entityName}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDecryptStatement = (docId: string) => {
    setDecryptingFileId(docId);
    setTimeout(() => {
      setDecryptingFileId(null);
      setDecryptedFiles((prev) => [...prev, docId]);
    }, 1800);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: "Kriti Jain (Article)",
        text: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isClient: false,
      },
    ]);
    // Also trigger wa.me with custom text
    const sanitized = sanitizeIndianPhoneNumber("919823011928");
    window.open(`https://wa.me/${sanitized}?text=${encodeURIComponent(chatMessage)}`, "_blank");
    setChatMessage("");
  };

  const handleTriggerOtpHeadsUp = () => {
    openWhatsAppPreset(
      "919823011928",
      "OTP_CALL_NOTICE",
      {
        clientName: selectedWorkpaperEntity || (clients[0]?.name ? `${clients[0]?.primaryContact?.name || "Authorized"} (${clients[0].name})` : "Authorized Signatory"),
        portalName: "Income Tax E-filing Portal (ITR-6)",
        serviceName: "Form 3CD Tax Audit & Return Filing",
        callTime: new Date(Date.now() + 10 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    );
    setOtpCoordinationState("heads_up_sent");
    toast.info(
      "OTP Heads-Up Dispatched",
      "Signatory notified via WhatsApp for upcoming authentication call."
    );
  };

  const handleApproveDoc = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              reviewStatus: "APPROVED",
              reviewedBy: "Kriti Jain (Article)",
              reviewedAt: new Date().toISOString(),
            }
          : d
      )
    );
    const targetDoc = documents.find((d) => d.id === docId);
    setTasks((prev) =>
      prev.map((t) =>
        ((targetDoc && t.id === targetDoc.taskId) ||
          (targetDoc && t.entityId === targetDoc.entityId) ||
          (targetDoc && t.entityName.toLowerCase() === targetDoc.entityName.toLowerCase())) &&
        t.status === "DOCUMENTS_AWAITED"
          ? { ...t, status: "IN_PREPARATION", missingDocumentsCount: Math.max(0, (t.missingDocumentsCount || 1) - 1) }
          : t
      )
    );
    toast.success(
      "Workpaper Approved",
      "Document verified by Kriti Jain. Engagement advanced to In Preparation."
    );
    setToastMessage("Document verified & marked APPROVED. Engagement moved to In Preparation!");
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRejectDocWithWhatsApp = (doc: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, reviewStatus: "CORRECTION_NEEDED" } : d))
    );
    openWhatsAppPreset("919823011928", "DOC_CHASE", {
      clientName: doc.entityName,
      serviceName: "Statutory Verification",
      missingDocs: [`Correction needed on ${doc.fileName} (Unclear scan or statement incomplete)`],
    });
    toast.warning(
      "Clarification Requested",
      `WhatsApp message triggered to ${doc.entityName} for ${doc.fileName}.`
    );
    setToastMessage(`Marked correction needed and opened 1-tap WhatsApp chase for ${doc.fileName}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSubmitTimesheet = () => {
    setIsSubmittingTimesheet(true);
    setTimeout(() => {
      setIsSubmittingTimesheet(false);
      setTimesheetSubmitted(true);
      toast.success(
        "Timesheet Submitted",
        "Daily article timesheet logged for Partner review."
      );
      setTimeout(() => setTimesheetSubmitted(false), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black text-white">{toastMessage}</span>
          </div>
          <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded">WHATSAPP DISPATCHED</span>
        </div>
      )}

      {/* Article Header (Crisp White Theme) */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black px-2.5 py-0.5 rounded-full bg-red-50 text-btred-logo border border-red-200">
              Active Article Trainee
            </span>
            <span className="text-xs text-slate-500 font-semibold">Kriti Jain &bull; Assigned Article Assistant &bull; Reg: CRO022998</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
            Article Execution Workbench &amp; Automation Hub
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Handles statutory filing workpapers, encrypted bank statement cracking, 1-tap client WhatsApp nudges, and ICAI Form 102/103 timesheets.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto scrollbar-none touch-pan-x w-full md:w-auto">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap shrink-0 ${
              activeTab === "tasks" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Returns ({myTasks.length})
          </button>
          <button
            onClick={() => setActiveTab("bank-decryptor")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "bank-decryptor" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Bank OCR &amp; Tally XML
          </button>
          <button
            onClick={() => setActiveTab("chat-hub")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "chat-hub" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-500" />
            1-Tap WhatsApp Desk
          </button>
          <button
            onClick={() => setActiveTab("doc-review")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "doc-review" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-blue-500" />
            Client Doc Intake ({documents.filter(d => d.reviewStatus === "PENDING_REVIEW").length})
          </button>
          <button
            onClick={() => setActiveTab("otp-relay")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "otp-relay" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-btred-logo" />
            Signatory OTP
          </button>
          <button
            onClick={() => setActiveTab("timesheet")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "timesheet" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Timesheet (102/103)
          </button>
          <button
            onClick={() => setActiveTab("icai-register")}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === "icai-register" ? "bg-btblack text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            ICAI Form 102/103/108 &amp; Stipend
          </button>
        </div>
      </div>

      {/* TAB 1: ARTICLE TASKS TABLE */}
      {activeTab === "tasks" && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">
              Assigned Compliance Engagements &bull; Ready for Workpapers &amp; Review
            </h3>
            <span className="text-xs text-slate-500 font-medium">Sorted by Statutory Deadline Priority</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-black">
                <tr>
                  <th className="py-3.5 px-4">Entity &amp; Task</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Statutory Due Date</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4">Missing Docs</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {myTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      No statutory returns assigned. All client engagements are currently clean.
                    </td>
                  </tr>
                ) : (
                myTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{task.entityName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{task.title}</div>
                      {task.officialUdin && (
                        <div className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                          ICAI UDIN: {task.officialUdin}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 font-semibold">{task.period}</td>

                    <td className="py-3.5 px-4">
                      <span className="text-btred-logo font-black">{formatDate(task.dueDate)}</span>
                      <span className="block text-[10px] text-slate-400 font-bold">Priority: {task.priority}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {task.missingDocumentsCount > 0 ? (
                        <div className="space-y-0.5">
                          <span className="text-amber-700 font-black text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            {task.missingDocumentsCount} Docs Pending
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                            {task.missingDocumentsList?.[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Complete
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {task.category === "TAX_AUDIT" && (
                        <button
                          onClick={() => {
                            setSelectedWorkpaperEntity(task.entityName);
                            setWorkpaperModalOpen(true);
                          }}
                          className="bg-btblack hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition text-[11px] inline-flex items-center gap-1 shadow-sm"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
                          Form 3CD Workpaper
                        </button>
                      )}

                      {task.missingDocumentsCount > 0 && (
                        <button
                          onClick={() => handleTaskWhatsAppChase(task)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black px-3 py-1.5 rounded-xl transition text-[11px] inline-flex items-center gap-1 border border-emerald-300"
                        >
                          <Send className="w-3 h-3" />
                          WhatsApp Chase ({task.chaseCount})
                        </button>
                      )}
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CLIENT DOC INTAKE & VERIFICATION */}
      {activeTab === "doc-review" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Client Document Intake &amp; Statutory Audit Verification
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verify incoming mobile and portal uploads. Approving a document advances the compliance engagement and links it to the permanent audit file.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
              {documents.filter(d => d.reviewStatus === "PENDING_REVIEW").length} Awaiting Verification
            </span>
          </div>

          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No client documents pending verification. Intake vault is clean.
              </div>
            ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 shrink-0">
                    <FileText className="w-5 h-5 text-btred-logo" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-sm block">{doc.fileName}</span>
                    <span className="text-slate-500 text-[11px] font-medium">
                      Entity: <strong>{doc.entityName}</strong> &bull; Category: {doc.category.replace(/_/g, " ")} &bull; {doc.fileSize}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono text-slate-600">
                        Uploaded by: {doc.uploadedBy}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          doc.reviewStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : doc.reviewStatus === "CORRECTION_NEEDED"
                            ? "bg-red-100 text-btred-logo border-red-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {doc.reviewStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  {doc.reviewStatus !== "APPROVED" && (
                    <button
                      onClick={() => handleApproveDoc(doc.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl transition text-[11px] inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve &amp; Start Work
                    </button>
                  )}

                  {doc.reviewStatus !== "CORRECTION_NEEDED" && (
                    <button
                      onClick={() => handleRejectDocWithWhatsApp(doc)}
                      className="bg-red-50 hover:bg-red-100 text-btred-logo font-bold px-3 py-2 rounded-xl transition text-[11px] inline-flex items-center gap-1 border border-red-200"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Request Resubmission (WhatsApp)
                    </button>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BANK DECRYPTOR */}
      {activeTab === "bank-decryptor" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Automated Password-Protected Bank Statement Cracker
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Eliminates the #1 article headache: calling clients for statement passwords. Uses deterministic rule engine based on Company PAN, Date of Incorporation &amp; Director DOB.
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black">
              100% On-Device Decryption
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <span className="text-xs font-black text-slate-900 block">Select Active Decryption Heuristic:</span>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="rule"
                    checked={decryptRule === "PAN_INCORP_YEAR"}
                    onChange={() => setDecryptRule("PAN_INCORP_YEAR")}
                    className="accent-btred-logo"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Rule A: First 4 PAN chars + Incorp Year</span>
                    <span className="text-[11px] text-slate-500 font-mono">e.g. AABC2012 (Standard HDFC/ICICI Corporate format)</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="rule"
                    checked={decryptRule === "ACCOUNT_LAST_6"}
                    onChange={() => setDecryptRule("ACCOUNT_LAST_6")}
                    className="accent-btred-logo"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Rule B: Last 6 digits of Account Number</span>
                    <span className="text-[11px] text-slate-500 font-mono">e.g. 002914 (Standard SBI &amp; Kotak format)</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <span className="text-xs font-black text-slate-900 block">Encrypted Document Queue</span>
              {INITIAL_DOCUMENTS.filter((d) => d.category === "BANK_STATEMENT").map((doc) => {
                const isDecrypted = decryptedFiles.includes(doc.id);
                const isProcessing = decryptingFileId === doc.id;

                return (
                  <div
                    key={doc.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{doc.fileName}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{doc.fileSize} &bull; {doc.entityName || "Client Entity"}</span>
                    </div>

                    {isDecrypted ? (
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 border border-emerald-300">
                        <Unlock className="w-3 h-3 text-emerald-600" /> Decrypted &amp; OCR Ready
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDecryptStatement(doc.id)}
                        disabled={isProcessing}
                        className="bg-btblack hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Cracking PDF...
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-400" /> Crack &amp; Ingest
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Bank Statement OCR & Tally XML Suite */}
          <div className="pt-6 border-t border-slate-200">
            <BankStatementParser />
          </div>
        </div>
      )}

      {/* TAB 3: WHATSAPP DESK (1-Tap Zero-API Links) */}
      {activeTab === "chat-hub" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Firm-Controlled Client WhatsApp Channel: {selectedWorkpaperEntity || (clients[0]?.name ?? "Client Direct Desk")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Uses 1-tap WhatsApp deep links (wa.me). Zero Meta Cloud API fees, zero template bans, opens directly on your desktop WhatsApp Web or phone.
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-[10px] font-black">
              1-Tap Zero-API wa.me Active
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                openWhatsAppPreset("919823011928", "DOC_CHASE", {
                  clientName: selectedWorkpaperEntity || (clients[0]?.name ?? "Client Direct Desk"),
                  serviceName: "GSTR-3B & Tax Audit",
                  period: "September 2026",
                  missingDocs: ["Bank Statement", "Purchase Register with E-Way Bill Nos"],
                });
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            >
              <Send className="w-3 h-3 text-emerald-600" />
              Chase Pending Docs
            </button>
            <button
              onClick={() => {
                openWhatsAppPreset("919823011928", "ADVANCE_TAX_REMINDER", {
                  clientName: selectedWorkpaperEntity || (clients[0]?.name ?? "Client Direct Desk"),
                  period: "Q2 FY 2026-27",
                  deadline: "15th Sept",
                  invoiceAmount: 450000,
                });
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            >
              <Send className="w-3 h-3 text-emerald-600" />
              Advance Tax Advisory
            </button>
            <button
              onClick={() => {
                openWhatsAppPreset("919823011928", "FILING_ACKNOWLEDGEMENT", {
                  clientName: selectedWorkpaperEntity || (clients[0]?.name ?? "Client Direct Desk"),
                  serviceName: "GSTR-1 Monthly Return",
                  period: "September 2026",
                  arnNumber: "AA2709260192841",
                });
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            >
              <Send className="w-3 h-3 text-emerald-600" />
              Filing Ack (ARN)
            </button>
          </div>

          <div className="space-y-3 min-h-[200px] max-h-[260px] overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.isClient ? "items-start" : "items-end"}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                    m.isClient
                      ? "bg-white border border-slate-200 text-slate-800 shadow-sm"
                      : "bg-btblack text-white shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-80 font-bold">
                    <span>{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="font-medium">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Type message to open directly on WhatsApp with Client CFO (+91 98230 11928)..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-slate-50 border border-slate-300 text-xs text-slate-900 px-4 py-2.5 rounded-2xl focus:outline-none focus:border-btred-logo font-medium"
            />
            <button
              onClick={handleSendMessage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl transition flex items-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" />
              Open WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SIGNATORY OTP CALL COORDINATION (REPLACING REGULATORY HAZARD OTP RELAY) */}
      {activeTab === "otp-relay" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-btred-logo" />
              Department Filing Signatory Call Coordination (ITBA / GSTN / MCA V3)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Secure CA practice workflow: avoids collecting or storing sensitive Aadhaar EVC or direct portal OTPs. Dispatches an advance 1-tap WhatsApp alert to the authorized signatory to prepare them for the live filing verification call.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Client Entity</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">{selectedWorkpaperEntity || (clients[0]?.name ?? "No Client Selected")}</span>
                <span className="text-[11px] text-slate-500 font-mono">PAN: {clients[0]?.pan ?? "N/A"}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Department Filing</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">ITR-6 &amp; Form 3CD Filing</span>
                <span className="text-[11px] text-slate-500">Portal: Income Tax E-filing (ITBA)</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Authorized Signatory</span>
                <span className="font-black text-slate-900 text-sm mt-0.5 block">{clients[0]?.primaryContact?.name ?? "Key Signatory"}</span>
                <span className="text-[11px] text-slate-500 font-mono">Mobile: {clients[0]?.primaryContact?.phone ?? "+91 98000 00000"}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Coordination Status:</span>
                {otpCoordinationState === "idle" && (
                  <span className="text-xs text-slate-500 font-medium">Ready to dispatch 10-minute heads-up notice</span>
                )}
                {otpCoordinationState === "heads_up_sent" && (
                  <span className="text-xs text-amber-700 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    Heads-Up Dispatched to CFO WhatsApp &bull; Ready for Call
                  </span>
                )}
                {otpCoordinationState === "filing_authorized" && (
                  <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Signatory Verified on Call &bull; Department E-Filing Completed!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {otpCoordinationState === "idle" && (
                  <button
                    onClick={handleTriggerOtpHeadsUp}
                    className="bg-btred-logo hover:bg-btred-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    1-Tap WhatsApp Call Alert (10 Min Heads-Up)
                  </button>
                )}

                {otpCoordinationState === "heads_up_sent" && (
                  <button
                    onClick={() => setOtpCoordinationState("filing_authorized")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Mark Call Completed &amp; Return Filed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ICAI ARTICLESHIP LOGBOOK */}
      {activeTab === "timesheet" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ICAI Form 102/103
                </span>
                <span className="text-xs text-slate-500 font-semibold">Trainee Training Hours Tracker</span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1">Weekly Statutory Work Hours Log</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-bold">Week Ending 24 Oct 2026: </span>
              <strong className="text-slate-900 text-sm font-black">{loggedHours} Hours</strong>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Tax Audit Form 3CD Clause Reconciliation</span>
                <span className="text-[11px] text-slate-500">Sec 43B(h) MSME payables &amp; Sec 40(a)(ia) TDS vouchers</span>
              </div>
              <span className="font-mono font-bold text-slate-800">18.5 hrs</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">GSTR-3B Filing &amp; GSTR-2B Matching</span>
                <span className="text-[11px] text-slate-500">Statutory Return Computations &amp; ITC Verifications</span>
              </div>
              <span className="font-mono font-bold text-slate-800">12.0 hrs</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Direct Tax Scrutiny Draft Submissions u/s 142(1)</span>
                <span className="text-[11px] text-slate-500">Compilation of export contracts &amp; inward remittance advices</span>
              </div>
              <span className="font-mono font-bold text-slate-800">5.0 hrs</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Principal in Charge: <strong>CA Gunjan Jain (GPA &amp; Co., FRN: 022998C)</strong>
            </span>
            <button
              onClick={handleSubmitTimesheet}
              disabled={isSubmittingTimesheet}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              {isSubmittingTimesheet ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging to ICAI Journal...
                </>
              ) : timesheetSubmitted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Logged to Partner Diary!
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  Sign &amp; Submit Weekly Log (35.5 hrs)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tax Audit Form 3CD Workpaper Modal with real UDIN tracking */}
      {/* TAB 7: ICAI REGULATION 48 ARTICLES REGISTER & STIPEND DESK */}
      {activeTab === "icai-register" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                ICAI Regulation 48 &amp; Training Mandate
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Articleship Training, Leaves &amp; Regulation 48 Stipend Register
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracks Form 102 (Articleship Deed), Form 103 (30-day ICAI Registration countdown), Form 108 (Completion), and permissible leave limits.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block">Total Active Trainees</span>
              <span className="text-xl font-black text-slate-900">4 Enrolled</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "Kriti Jain",
                croNo: "CRO-0651289",
                commencement: "2024-08-15",
                year: "Year 2 (Intermediate Both Groups Passed)",
                minStipend: 4000,
                leavesTaken: 18,
                maxPermissibleLeaves: 52,
                form108Due: "2026-08-14"
              },
              {
                name: "Aman Sharma",
                croNo: "CRO-0699412",
                commencement: "2025-02-01",
                year: "Year 1 (Direct Entry Graduate)",
                minStipend: 3000,
                leavesTaken: 6,
                maxPermissibleLeaves: 52,
                form108Due: "2027-01-31"
              },
              {
                name: "Pooja Agrawal",
                croNo: "WRO-0741289",
                commencement: "2026-09-20",
                year: "Year 1 (Foundation Route)",
                minStipend: 3000,
                leavesTaken: 0,
                maxPermissibleLeaves: 52,
                form108Due: "2028-09-19"
              },
              {
                name: "Rahul Verma",
                croNo: "CRO-0588211",
                commencement: "2023-11-10",
                year: "Final Year (Approaching Completion)",
                minStipend: 5000,
                leavesTaken: 38,
                maxPermissibleLeaves: 52,
                form108Due: "2025-11-09"
              }
            ].map((art, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{art.name}</h4>
                    <span className="text-[11px] font-mono font-bold text-slate-500">{art.croNo} &bull; {art.year}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Form 103 OK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Regulation 48 Stipend</span>
                    <strong className="text-emerald-700 font-mono text-xs">₹{art.minStipend.toLocaleString()}/mo</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Leave Balance</span>
                    <strong className="text-slate-800">{art.leavesTaken} / {art.maxPermissibleLeaves} Days Used</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Deed Start</span>
                    <span>{art.commencement}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Form 108 Due Date</span>
                    <span className="font-mono">{art.form108Due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Audit Form 3CD Workpaper Modal with real UDIN tracking */}
      <TaxAuditWorkpaperModal
        isOpen={workpaperModalOpen}
        onClose={() => setWorkpaperModalOpen(false)}
        entityName={selectedWorkpaperEntity}
        onUdinSaved={(newUdin) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.category === "TAX_AUDIT"
                ? { ...t, officialUdin: newUdin, status: "PARTNER_SIGN_OFF" }
                : t
            )
          );
          setToastMessage(`Official ICAI UDIN ${newUdin} linked to engagement workpapers!`);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />
    </div>
  );
};
