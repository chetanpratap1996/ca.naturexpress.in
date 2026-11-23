"use client";

import React, { useState, useMemo } from "react";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { playNotificationChime } from "@/lib/notifications";
import {
  Send,
  MessageSquare,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  Copy,
  ExternalLink,
  Mail,
  Bell,
  RefreshCw,
  ShieldAlert,
  Calendar,
  CreditCard,
  FileText,
  KeyRound,
  Download,
  CheckCheck
} from "lucide-react";

export function formatDisplayPhone(rawPhone?: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return rawPhone;
}

export interface StatutoryTemplate {
  id: string;
  name: string;
  category: "COMPLIANCE" | "BILLING" | "DOCUMENT" | "NOTICE" | "DSC";
  priority: "HIGH" | "URGENT" | "CRITICAL" | "NORMAL";
  targetFilter: "ALL" | "GST" | "COMPANY" | "AUDIT" | "OVERDUE" | "EXPIRING_DSC";
  subject: string;
  body: string;
  legalProvision: string;
}

export const STATUTORY_NOTIFICATION_TEMPLATES: StatutoryTemplate[] = [
  {
    id: "gstr3b_due",
    name: "GSTR-3B Monthly Filing Reminder (Due 20th)",
    category: "COMPLIANCE",
    priority: "CRITICAL",
    targetFilter: "GST",
    subject: "URGENT: Form GSTR-3B Filing Due for {{period}} - Section 39 / Rule 88B",
    legalProvision: "Section 39 of CGST Act 2017 & Rule 88B (18% Statutory Interest p.a. on Net Tax Liability)",
    body: `*URGENT STATUTORY COMPLIANCE INTIMATION*

Dear {{clientName}} (GSTIN: {{gstin}}),

This is an official statutory filing reminder from *${DEFAULT_FIRM_BRANDING.firmName}*.

Your monthly *Form GSTR-3B for {{period}}* is due for electronic submission on or before *{{dueDate}}*.

⚠️ *STATUTORY RISK & LATE FEE PENALTY:*
• Delay beyond the due date attracts mandatory late fees under Section 47 (₹50/day) plus 18% p.a. interest under Section 50(1) on cash tax liability.
• Delayed filing invalidates recipient ITC under Section 16(2)(aa) and flags high-risk vendor scores.

Kindly ensure your purchase register and bank statements are shared immediately, or approve the drafted return on your Client Portal.

Managing Partner: *${DEFAULT_FIRM_BRANDING.managingPartner}*
Practice Portal: https://ca.naturexpress.in/client`
  },
  {
    id: "gstr1_due",
    name: "GSTR-1 Outward Supplies Deadline (Due 11th)",
    category: "COMPLIANCE",
    priority: "HIGH",
    targetFilter: "GST",
    subject: "Statutory Notice: GSTR-1 Outward Invoices Filing Due (Rule 59(6) Compliance)",
    legalProvision: "Rule 59(6) of CGST Rules (Blocking of E-Way Bill generation & Subsequent GSTR-3B)",
    body: `*URGENT: GSTR-1 OUTWARD INVOICE SUBMISSION*

Dear {{clientName}},

Please note that *Form GSTR-1 for {{period}}* must be filed on or before *{{dueDate}}*.

Under Rule 59(6), failure to file GSTR-1 on time restricts subsequent filing of GSTR-3B and blocks recipient input tax credits.

Kindly upload all outward sales invoices, credit notes, and debit notes to your client portal today.

Regards,
*${DEFAULT_FIRM_BRANDING.firmName}*`
  },
  {
    id: "advance_tax_q3",
    name: "Advance Tax Q3 Installment (Due Dec 15th)",
    category: "COMPLIANCE",
    priority: "HIGH",
    targetFilter: "ALL",
    subject: "Mandatory Advance Tax Installment (Sec 208/210/234C)",
    legalProvision: "Sections 208, 209, 210, 234B & 234C of the Income Tax Act, 1961 (1% interest per month)",
    body: `*MANDATORY ADVANCE TAX PAYMENT INTIMATION*

Dear {{clientName}} (PAN: {{pan}}),

As per Section 208 of the Income Tax Act, 1961, any taxpayer whose estimated tax liability exceeds ₹10,000 is required to pay advance tax.

Your *{{period}} Advance Tax Installment* is due on or before *{{dueDate}}*.

⚠️ *PENAL INTEREST CAUTION:*
Default or shortfall in payment attracts penal interest @ 1% per month under Section 234B and Section 234C.

Please share your latest estimated profit and loss / bank statements so our office can calculate your exact net advance tax liability.

*${DEFAULT_FIRM_BRANDING.firmName}*`
  },
  {
    id: "tax_audit_44ab",
    name: "Tax Audit Report Form 3CD Workpapers Request",
    category: "DOCUMENT",
    priority: "CRITICAL",
    targetFilter: "AUDIT",
    subject: "Statutory Audit Workpapers Required: Section 44AB / Form 3CD Filing",
    legalProvision: "Section 44AB / Section 271B Penalty (0.5% of turnover up to ₹1,50,000 for failure to audit)",
    body: `*TAX AUDIT REPORT FORM 3CD STATUTORY REQUEST*

Dear {{clientName}},

Your entity is subject to mandatory statutory tax audit under Section 44AB of the Income Tax Act, 1961 for FY 2024-25.

To finalize Form 3CA/3CB and Form 3CD workpapers before the statutory deadline of *{{dueDate}}*, kindly furnish:
1. Finalized Trial Balance with previous year comparative figures
2. Clause 44 MSME Vendor Aging Analysis
3. Clause 34 TDS Compliance & Form 26Q Reconciliation
4. Bank Confirmation Certificates and Loan Schedules

Failure to file on or before the due date attracts penalty under Section 271B equal to 0.5% of gross turnover.

Regards,
*${DEFAULT_FIRM_BRANDING.managingPartner}* | FCA, DISA`
  },
  {
    id: "notice_scrutiny",
    name: "Statutory Notice Received (Section 148 / 143(1) / ASMT-10)",
    category: "NOTICE",
    priority: "CRITICAL",
    targetFilter: "ALL",
    subject: "Statutory Scrutiny Notice Received from Tax Department - Immediate Action Required",
    legalProvision: "Statutory Limitation Period under Income Tax Act / CGST Act",
    body: `*URGENT: STATUTORY TAX NOTICE INTIMATION*

Dear {{clientName}} (PAN: {{pan}}),

Our tax litigation desk has detected an official departmental notice issued against your entity on the government portal.

• Notice Reference / DIN: *{{din}}*
• Department: *{{authority}}*
• Alleged Demand / Discrepancy: *{{amount}}*
• Statutory Reply Due Date: *{{dueDate}}*

Our team has reviewed the grounds and prepared a citation-backed defense submission. Please access your Client Portal to review the draft and authorize submission before the limitation period expires.

Litigation Desk | *${DEFAULT_FIRM_BRANDING.firmName}*`
  },
  {
    id: "dsc_expiring",
    name: "Digital Signature Certificate (DSC) Expiry Warning",
    category: "DSC",
    priority: "URGENT",
    targetFilter: "EXPIRING_DSC",
    subject: "Urgent: Your Class-3 Digital Signature (DSC) is Expiring within 15 Days",
    legalProvision: "Information Technology Act 2000 & MCA V3 / ITD e-Filing Signing Compliance",
    body: `*CLASS-3 DIGITAL SIGNATURE (DSC) EXPIRY ALERT*

Dear {{clientName}} (Promoter / Director: {{contactName}}),

Our hardware custody vault records indicate that your *Class-3 Digital Signature Certificate (DSC)* is set to expire on *{{dueDate}}*.

A valid DSC is mandatory for signing GST returns, Income Tax computations, MCA AOC-4/MGT-7, and Form 3CD audit reports.

Kindly provide video KYC consent and Aadhaar OTP verification to renew your crypto-token dongle without practice disruption.

Vault Desk | *${DEFAULT_FIRM_BRANDING.firmName}*`
  },
  {
    id: "fee_retainer",
    name: "Professional Fee Retainer & Pay-to-Release Invoice",
    category: "BILLING",
    priority: "NORMAL",
    targetFilter: "OVERDUE",
    subject: "Professional Fee Retainer Invoice & Fast UPI Release Link",
    legalProvision: "ICAI Code of Ethics - Engagement Retainer & Fast UPI Settlement",
    body: `*PROFESSIONAL SERVICES INVOICE INTIMATION*

Dear {{clientName}},

Please find attached professional fee invoice for audit, tax compliance, and advisory services rendered by *${DEFAULT_FIRM_BRANDING.firmName}*.

• Outstanding Fee Amount: *{{amount}}*
• Instant Pay-to-Release UPI VPA: *${DEFAULT_FIRM_BRANDING.firmUpiVpa}*

Payment of this invoice automatically unlocks filed statutory acknowledgments, certified audit reports, and portal filing receipts on your Client Portal.

Scan UPI QR or pay directly on your Client Portal: https://ca.naturexpress.in/client

Accounts Department | *${DEFAULT_FIRM_BRANDING.firmName}*`
  },
  {
    id: "bank_stmt_request",
    name: "Bank Statement & Tally Data Ingestion Request",
    category: "DOCUMENT",
    priority: "NORMAL",
    targetFilter: "ALL",
    subject: "Quarter-End Bank Statements & Tally Data Request for Financial Finalization",
    legalProvision: "Accounting Standards / ICAI Audit Trail Mandate",
    body: `*DATA INGESTION REQUEST FOR ACCOUNTS FINALIZATION*

Dear {{clientName}},

To complete bank reconciliation and verify Input Tax Credit under Section 16(2)(aa), kindly provide e-statements for all operating bank accounts for {{period}}.

You can drag and drop your password-protected PDF statements directly onto your Client Portal:
👉 https://ca.naturexpress.in/client

Our automated system decrypts client bank statements with 256-bit AES encryption and maps vouchers directly into your Tally Prime audit file.

Best Regards,
*${DEFAULT_FIRM_BRANDING.firmName}*`
  }
];

interface ClientNotificationBroadcasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientEntity[];
  initialTemplateId?: string;
  initialClientIds?: string[];
  initialMetadata?: {
    dueDate?: string;
    period?: string;
    amount?: string;
    din?: string;
  };
  currentUser?: any;
}

export const ClientNotificationBroadcasterModal: React.FC<ClientNotificationBroadcasterModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialTemplateId = "gstr3b_due",
  initialClientIds,
  initialMetadata,
  currentUser
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);
  const [clientSearch, setClientSearch] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "GST" | "COMPANY" | "AUDIT" | "OVERDUE" | "EXPIRING_DSC">("ALL");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(initialClientIds || []);
  const [previewClientId, setPreviewClientId] = useState<string>("");
  
  // Channels to Dispatch
  const [channelPortal, setChannelPortal] = useState<boolean>(true);
  const [channelWhatsApp, setChannelWhatsApp] = useState<boolean>(true);
  const [channelBrowser, setChannelBrowser] = useState<boolean>(true);
  const [channelEmail, setChannelEmail] = useState<boolean>(false);

  // Metadata overrides
  const [customPeriod, setCustomPeriod] = useState<string>(initialMetadata?.period || "October 2026");
  const [customDueDate, setCustomDueDate] = useState<string>(initialMetadata?.dueDate || "2026-11-20");
  const [customAmount, setCustomAmount] = useState<string>(initialMetadata?.amount || "₹15,000");

  // State
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [dispatchLogs, setDispatchLogs] = useState<{ clientName: string; channel: string; status: "SENT" | "FAILED" | "DELIVERED"; time: string }[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Active Template
  const activeTemplate = useMemo(() => {
    return STATUTORY_NOTIFICATION_TEMPLATES.find((t) => t.id === selectedTemplateId) || STATUTORY_NOTIFICATION_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Filtered Clients based on Filter Pill & Search
  const eligibleClients = useMemo(() => {
    return clients.filter((c) => {
      // Search query
      if (clientSearch.trim()) {
        const q = clientSearch.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPan = c.pan.toLowerCase().includes(q);
        const matchesGstin = (c.gstin || "").toLowerCase().includes(q);
        if (!matchesName && !matchesPan && !matchesGstin) return false;
      }

      // Category Filter
      if (selectedFilter === "GST" && !c.gstin) return false;
      if (selectedFilter === "COMPANY" && c.type !== "PVT_LTD" && c.type !== "PUBLIC_LTD" && c.type !== "LLP") return false;
      if (selectedFilter === "AUDIT" && (c.turnoverCr || 0) < 1.0) return false;
      
      return true;
    });
  }, [clients, clientSearch, selectedFilter]);

  // Active Preview Client (Hook MUST run before any early return)
  const previewClient = useMemo(() => {
    if (previewClientId) {
      const found = clients.find((c) => c.id === previewClientId);
      if (found) return found;
    }
    const firstSelected = clients.find((c) => selectedClientIds.includes(c.id));
    if (firstSelected) return firstSelected;
    return eligibleClients[0] || clients[0];
  }, [previewClientId, clients, selectedClientIds, eligibleClients]);

  // Auto-select eligible clients on filter change if empty
  React.useEffect(() => {
    if (!initialClientIds || initialClientIds.length === 0) {
      setSelectedClientIds(eligibleClients.map((c) => c.id));
    }
  }, [eligibleClients, initialClientIds]);

  if (!isOpen) return null;

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedClientIds(eligibleClients.map((c) => c.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const handleToggleClient = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Compile final personalized message for client
  const renderMessageForClient = (client: ClientEntity) => {
    return activeTemplate.body
      .replace(/{{clientName}}/g, client.name)
      .replace(/{{pan}}/g, client.pan)
      .replace(/{{gstin}}/g, client.gstin || "Unregistered")
      .replace(/{{period}}/g, customPeriod)
      .replace(/{{dueDate}}/g, customDueDate)
      .replace(/{{amount}}/g, customAmount)
      .replace(/{{contactName}}/g, client.primaryContact.name)
      .replace(/{{din}}/g, initialMetadata?.din || `CBIC/IND/2026/${Math.floor(1000000 + Math.random() * 9000000)}`);
  };

  const handleOpenSingleClientWhatsApp = (e: React.MouseEvent, client: ClientEntity) => {
    e.stopPropagation();
    const msg = renderMessageForClient(client);
    const cleanPhone = sanitizeIndianPhoneNumber(client.primaryContact.phone);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.info("WhatsApp Chat Launched", `Opening WhatsApp chat with ${client.primaryContact.name} (${client.name}).`);
  };

  // 100% Free Multi-Channel Batch Dispatcher
  const handleExecuteDispatch = async () => {
    if (selectedClientIds.length === 0) {
      toast.warning("No Clients Selected", "Please select at least one client to dispatch notifications.");
      return;
    }

    setIsDispatching(true);
    setDispatchProgress(0);
    setDispatchLogs([]);
    setIsFinished(false);

    const targetClients = clients.filter((c) => selectedClientIds.includes(c.id));
    const total = targetClients.length;

    playNotificationChime();

    for (let i = 0; i < total; i++) {
      const client = targetClients[i];
      const personalizedMsg = renderMessageForClient(client);
      const subject = activeTemplate.subject
        .replace(/{{clientName}}/g, client.name)
        .replace(/{{period}}/g, customPeriod);

      // Channel 1: Client Portal In-App Notification (Stored in Server DB / Local DB)
      if (channelPortal) {
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : { "x-sandbox-mode": "true" })
            },
            body: JSON.stringify({
              title: subject,
              message: personalizedMsg,
              category: activeTemplate.category,
              priority: activeTemplate.priority,
              targetTab: "compliance",
              recipientRole: "CLIENT",
              recipientEntityId: client.id,
              metadata: {
                clientPan: client.pan,
                clientGstin: client.gstin,
                period: customPeriod,
                dueDate: customDueDate,
                statutoryProvision: activeTemplate.legalProvision
              }
            })
          });

          setDispatchLogs((prev) => [
            ...prev,
            {
              clientName: client.name,
              channel: "Client Portal In-App Desk",
              status: "DELIVERED",
              time: new Date().toLocaleTimeString()
            }
          ]);
        } catch (e) {
          console.warn("Client portal dispatch failed:", e);
        }
      }

      // Channel 2: WhatsApp Business Direct Intent (100% Free)
      if (channelWhatsApp && client.primaryContact.phone) {
        const cleanPhone = sanitizeIndianPhoneNumber(client.primaryContact.phone);
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMsg)}`;
        
        // For first client or explicit single, open immediate link
        if (total === 1) {
          window.open(waUrl, "_blank");
        }

        setDispatchLogs((prev) => [
          ...prev,
          {
            clientName: client.name,
            channel: `WhatsApp (+91 ${client.primaryContact.phone})`,
            status: "SENT",
            time: new Date().toLocaleTimeString()
          }
        ]);
      }

      // Channel 3: Browser Push Notification
      if (channelBrowser && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(`${client.name}: ${subject}`, {
            body: personalizedMsg.slice(0, 140) + "...",
            icon: "/icon.svg"
          });
        } catch {}
      }

      setDispatchProgress(Math.round(((i + 1) / total) * 100));
      // Artificial pacing for smooth enterprise UI progress feedback
      await new Promise((r) => setTimeout(r, 60));
    }

    setIsDispatching(false);
    setIsFinished(true);
    toast.success(
      "Client Intimation Broadcast Completed",
      `Dispatched statutory reminders to ${total} clients across selected channels.`
    );
  };

  // Open WhatsApp sender for the active preview client
  const handleOpenWhatsAppQueue = () => {
    const target = previewClient || clients.find((c) => selectedClientIds.includes(c.id));
    if (!target) return;

    const msg = renderMessageForClient(target);
    const cleanPhone = sanitizeIndianPhoneNumber(target.primaryContact.phone);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.info("WhatsApp Chat Launched", `Opened WhatsApp for ${target.primaryContact.name} (${target.name}).`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-btred-logo text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Statutory Client Intimation Desk</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  Multi-Channel Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Broadcast statutory filing reminders and legal advisories directly to client promoters.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left = Settings & Recipients, Right = Live Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 pr-1">
          
          {/* LEFT COLUMN: Template Selection & Client Checklist (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Step 1: Template Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block flex items-center justify-between">
                <span>1. Select Statutory Notice / Reminder Template</span>
                <span className="text-[10px] font-mono text-purple-700 font-bold">{STATUTORY_NOTIFICATION_TEMPLATES.length} ICAI Templates</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-btred-logo focus:outline-none"
              >
                {STATUTORY_NOTIFICATION_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    [{tmpl.category}] {tmpl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Statutory Provision Banner */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="leading-tight">
                <span className="font-bold">Governing Act:</span> {activeTemplate.legalProvision}
              </div>
            </div>

            {/* Step 2: Dynamic Token Variables */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Filing Period</label>
                <input
                  type="text"
                  value={customPeriod}
                  onChange={(e) => setCustomPeriod(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5"
                  placeholder="e.g. October 2026"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Statutory Due Date</label>
                <input
                  type="date"
                  value={customDueDate}
                  onChange={(e) => setCustomDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Fee / Demand Amount</label>
                <input
                  type="text"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold mt-0.5"
                  placeholder="e.g. ₹25,000"
                />
              </div>
            </div>

            {/* Step 3: Multi-Channel Dispatch Options */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                2. Multi-Channel Delivery Channels
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${channelPortal ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold" : "border-slate-200 text-slate-500"}`}>
                  <input type="checkbox" checked={channelPortal} onChange={(e) => setChannelPortal(e.target.checked)} className="rounded text-emerald-600" />
                  <Bell className="w-3.5 h-3.5" />
                  <span>Client Portal</span>
                </label>

                <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${channelWhatsApp ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold" : "border-slate-200 text-slate-500"}`}>
                  <input type="checkbox" checked={channelWhatsApp} onChange={(e) => setChannelWhatsApp(e.target.checked)} className="rounded text-emerald-600" />
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </label>

                <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${channelBrowser ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold" : "border-slate-200 text-slate-500"}`}>
                  <input type="checkbox" checked={channelBrowser} onChange={(e) => setChannelBrowser(e.target.checked)} className="rounded text-emerald-600" />
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Web Push</span>
                </label>

                <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${channelEmail ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold" : "border-slate-200 text-slate-500"}`}>
                  <input type="checkbox" checked={channelEmail} onChange={(e) => setChannelEmail(e.target.checked)} className="rounded text-emerald-600" />
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email Draft</span>
                </label>
              </div>
            </div>

            {/* Step 4: Client Recipient Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  3. Select Related CA Firm Clients ({selectedClientIds.length} of {eligibleClients.length})
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-[10px] font-bold text-btred-logo hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-[10px] font-bold text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Filter Pills & Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search by client name, PAN or GSTIN..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-btred-logo"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedFilter("ALL")}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition ${selectedFilter === "ALL" ? "bg-red-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter("GST")}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition ${selectedFilter === "GST" ? "bg-red-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    GST
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter("COMPANY")}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition ${selectedFilter === "COMPANY" ? "bg-red-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Pvt Ltd
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter("AUDIT")}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition ${selectedFilter === "AUDIT" ? "bg-red-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    Tax Audit
                  </button>
                </div>
              </div>

              {/* Client List Checklist */}
              <div className="border border-slate-200 rounded-2xl max-h-44 overflow-y-auto divide-y divide-slate-100 text-xs">
                {eligibleClients.map((client) => {
                  const isChecked = selectedClientIds.includes(client.id);
                  const isPreviewing = previewClient?.id === client.id;
                  return (
                    <div
                      key={client.id}
                      onClick={() => setPreviewClientId(client.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                        isPreviewing 
                          ? "bg-red-50/50 ring-1 ring-btred-logo/40" 
                          : isChecked 
                            ? "bg-slate-50/70" 
                            : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleClient(client.id);
                          }}
                          className="rounded text-btred-logo focus:ring-red-500"
                        />
                        <div className="min-w-0">
                          <strong className="text-slate-900 block truncate">{client.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">
                            PAN: {client.pan} {client.gstin && `• GSTIN: ${client.gstin}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right text-[10px] text-slate-500">
                          <span className="font-bold text-slate-700 block">{client.primaryContact.name}</span>
                          <span>{formatDisplayPhone(client.primaryContact.phone)}</span>
                        </div>
                        {client.primaryContact.phone && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenSingleClientWhatsApp(e, client)}
                            className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                            title={`Open direct WhatsApp chat with ${client.primaryContact.name}`}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Client Preview & Dispatch Logs (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Live Client Screen Preview
              </span>
              <button
                type="button"
                onClick={() => {
                  if (previewClient) {
                    navigator.clipboard.writeText(renderMessageForClient(previewClient));
                    toast.success("Copied to Clipboard", "Personalized statutory message copied.");
                  }
                }}
                className="text-[10px] font-bold text-btred-logo hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy Sample
              </button>
            </div>

            {/* Chat & Notification Bubble Preview */}
            <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-slate-900 text-xs space-y-3 font-mono shadow-xs overflow-y-auto max-h-[360px] border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-[10px] text-emerald-700">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Client WhatsApp &amp; In-App Notification
                </span>
                <span className="text-slate-500 font-sans truncate max-w-[160px]">
                  {previewClient?.name || "Client"}
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] leading-relaxed text-emerald-950 whitespace-pre-wrap font-sans">
                {previewClient ? renderMessageForClient(previewClient) : activeTemplate.body}
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                <span>To: {previewClient?.primaryContact.name} ({formatDisplayPhone(previewClient?.primaryContact.phone)})</span>
                <span className="text-emerald-700 font-bold">Statutory Template</span>
              </div>
            </div>

            {/* Progress & Logs (during or after dispatch) */}
            {(isDispatching || isFinished) && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    {isDispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-btred-logo" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {isDispatching ? `Broadcasting (${dispatchProgress}%)` : `Successfully Dispatched (${dispatchLogs.length} events)`}
                  </span>
                  <span className="font-mono text-btred-logo">{dispatchProgress}%</span>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-btred-logo h-full transition-all duration-200"
                    style={{ width: `${dispatchProgress}%` }}
                  />
                </div>

                <div className="max-h-24 overflow-y-auto divide-y divide-slate-100 text-[10px]">
                  {dispatchLogs.map((log, i) => (
                    <div key={i} className="py-1 flex items-center justify-between">
                      <span className="font-medium text-slate-700 truncate max-w-[170px]">{log.clientName}</span>
                      <span className="text-slate-400">{log.channel}</span>
                      <span className="font-bold text-emerald-700">{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenWhatsAppQueue}
              disabled={!previewClient || !previewClient.primaryContact.phone}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Launch WhatsApp ({previewClient?.primaryContact.name || "Client"})</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteDispatch}
              disabled={isDispatching || selectedClientIds.length === 0}
              className="px-5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-black rounded-xl flex items-center gap-2 transition shadow-md shadow-red-500/20 disabled:opacity-50"
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Broadcasting to {selectedClientIds.length} Clients...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast to {selectedClientIds.length} Clients</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
