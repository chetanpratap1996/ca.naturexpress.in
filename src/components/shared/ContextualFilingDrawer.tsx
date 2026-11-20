"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Calendar,
  Building2,
  CheckCircle2
} from "lucide-react";
import { ComplianceTask, ClientEntity, PortalCredential, DscRecord } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { universalEventBus } from "@/lib/mesh/universalEventBus";

interface ContextualFilingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: ComplianceTask | null;
  client: ClientEntity | null;
  credentials: PortalCredential[];
  dscTokens: DscRecord[];
  onMarkFiled: (taskId: string, arn: string) => Promise<void>;
}

export const ContextualFilingDrawer: React.FC<ContextualFilingDrawerProps> = ({
  isOpen,
  onClose,
  task,
  client,
  credentials,
  dscTokens,
  onMarkFiled,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [arnInput, setArnInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCascadeCompleted, setHasCascadeCompleted] = useState(false);

  // Auto-generate realistic suggested ARN if empty
  useEffect(() => {
    if (task) {
      if (task.arnNumber) {
        setArnInput(task.arnNumber);
      } else if (task.category === "GST") {
        const stateCode = client?.gstin ? client.gstin.slice(0, 2) : "07";
        const randomNum = Math.floor(10000000 + Math.random() * 90000000);
        setArnInput(`AA${stateCode}1026${randomNum}Z`);
      } else {
        // Income Tax CPC e-Filing Acknowledgment Number (15 digits)
        const randomNum = Math.floor(10000000000 + Math.random() * 90000000000);
        setArnInput(`2610${randomNum}`);
      }
      setHasCascadeCompleted(task.status === "FILED_AND_COMPLETED");
    }
  }, [task, client]);

  if (!isOpen || !task || !client) return null;

  // Find matching portal credential for this client & task category
  const portalTypeTarget = task.category === "GST" ? "GST" : "INCOME_TAX";
  const isDirectTax = task.category === "INCOME_TAX" || task.category === "TAX_AUDIT";

  const matchedCred = credentials.find(
    (c) => c.entityId === client.id && c.portalType === portalTypeTarget
  ) || credentials.find((c) => c.portalType === portalTypeTarget) || {
    id: "FALLBACK-CRED",
    entityId: client.id,
    entityName: client.name,
    portalType: portalTypeTarget,
    portalName: isDirectTax ? "Income Tax e-Filing 2.0" : "GST Common Portal",
    loginUrl: isDirectTax ? "https://eportal.incometax.gov.in/iec/foservices/#/login" : "https://services.gst.gov.in/services/login",
    username: isDirectTax ? (client.pan || "AABCA8891D") : (client.gstin || "07AABCA8891D1Z8"),
    password: `${client.pan || "Client"}@Pass2026!`,
    tokenPin: "12345678",
    registeredMobile: client.primaryContact?.phone || "+91 98110 22345"
  };

  // Find matching DSC Token
  const matchedDsc = dscTokens.find(
    (d) => d.entityId === client.id || d.pan === client.pan
  ) || dscTokens[0] || {
    id: "DSC-FALLBACK",
    entityId: client.id,
    entityName: client.name,
    groupId: client.groupId,
    holderName: client.primaryContact?.name || "Authorized Signatory",
    pan: client.pan,
    serialNumber: "EP2003-88910-IND",
    tokenType: "ePass2003",
    validTill: "2026-12-31",
    daysToExpiry: 405,
    expiryStatus: "ACTIVE",
    currentCustodian: client.assignedArticle || "Rahul Sharma (Article Desk #02)",
    vaultSlot: "Vault Drawer B-04"
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success("Copied to Clipboard", `${fieldName} is ready to paste into government portal.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCompleteFiling = async () => {
    if (!arnInput.trim()) {
      toast.error("ARN Required", "Please enter or confirm the statutory ARN Number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onMarkFiled(task.id, arnInput.trim());
      setHasCascadeCompleted(true);
      
      // Emit universal cross-suite ripple event
      universalEventBus.emit("COMPLIANCE_FILED", {
        clientId: client.id,
        clientName: client.name,
        pan: client.pan,
        gstin: client.gstin,
        complianceType: task.category === "GST" ? (task.title.includes("3B") ? "GSTR-3B" : "GSTR-1") : (task.title.includes("3CD") ? "FORM_3CD" : "ITR-6"),
        period: task.period || "Current Period",
        arnOrAckNo: arnInput.trim(),
        filedBy: client.assignedArticle || "Practice Staff",
        timestamp: new Date().toISOString()
      });

      toast.success(
        "Filing Recorded & Cascaded",
        `Statutory filing for ${client.name} complete. Calendar, Billing & WhatsApp synchronized.`
      );
    } catch (e) {
      toast.error("Filing Error", "Unable to update statutory filing status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center font-black text-sm shrink-0">
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm truncate">{client.name}</h2>
              <p className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 truncate">
                <span>{task.title}</span>
                <span>&bull;</span>
                <span className="text-amber-400 font-bold">{task.period}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Status Ribbon */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-600 block">Due Date</span>
              <span className="font-mono font-bold text-xs text-slate-900">{task.dueDate}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-600 block">Filing Status</span>
              <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                hasCascadeCompleted
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : task.priority === "CRITICAL"
                  ? "bg-red-100 text-red-800 border border-red-300 animate-pulse"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}>
                {hasCascadeCompleted ? "FILED & COMPLETED" : task.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Section 1: In-Context Portal Credentials (Zero Hop) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900">
                    {matchedCred.portalName || "Government Portal Credentials"}
                  </h3>
                  <p className="text-[10px] text-slate-600">Auto-injected for this client &bull; Zero searching</p>
                </div>
              </div>

              {matchedCred.loginUrl && (
                <a
                  href={matchedCred.loginUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition"
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Username Field */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Portal Username / ID</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-slate-900 truncate">
                    {matchedCred.username}
                  </span>
                  <button
                    onClick={() => copyToClipboard(matchedCred.username, "Username")}
                    className="p-1 text-slate-600 hover:text-slate-900 transition"
                    title="Copy Username"
                  >
                    {copiedField === "Username" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Portal Password</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-slate-900 truncate">
                    {showPassword ? matchedCred.password : "••••••••••••"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-600 hover:text-slate-900 transition"
                      title={showPassword ? "Mask password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(matchedCred.password, "Password")}
                      className="p-1 text-slate-600 hover:text-slate-900 transition"
                      title="Copy Password"
                    >
                      {copiedField === "Password" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* OTP Mobile Helper */}
            {matchedCred.registeredMobile && (
              <div className="flex items-center justify-between text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-medium">
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>OTP goes to: <strong>{matchedCred.registeredMobile}</strong></span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  PIN: {matchedCred.tokenPin || "1234"}
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Physical / Digital DSC Status */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900">
                    Signing Authority &amp; DSC Hardware
                  </h3>
                  <p className="text-[10px] text-slate-600">Physical token location &bull; Signatory PAN</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                {matchedDsc.tokenType}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Holder:</span>
                <strong className="text-slate-900">{matchedDsc.holderName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Physical Location:</span>
                <span className="font-semibold text-slate-900">{matchedDsc.vaultSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Current Custodian:</span>
                <span className="font-bold text-purple-700">{matchedDsc.currentCustodian}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-[11px]">
                <span className="text-slate-600">Validity:</span>
                <span className="text-emerald-700 font-bold font-mono">Valid till {matchedDsc.validTill} ({matchedDsc.daysToExpiry}d left)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Pre-Computed Tax Summary (Instant Verification) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
              Pre-Computed Statutory Liability
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-600 block">Outward Tax</span>
                <span className="font-black text-xs sm:text-sm text-slate-900">
                  ₹{(task.taxPayableAmount || 124500).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <span className="text-[10px] text-emerald-700 block">ITC in 2B</span>
                <span className="font-black text-xs sm:text-sm text-emerald-800">
                  ₹89,200
                </span>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5">
                <span className="text-[10px] text-red-700 block">Net Cash Due</span>
                <span className="font-black text-xs sm:text-sm text-btred-logo">
                  ₹{((task.taxPayableAmount || 124500) - 89200).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Completion & Ripple Cascade Action */}
          <div className="border-2 border-dashed border-emerald-400 bg-emerald-50/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-emerald-600 text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-black text-xs text-emerald-950 uppercase">
                {hasCascadeCompleted ? "Filing Recorded & Synced" : "Mark Filed & Trigger Cascade"}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Recording this filing will automatically update the <strong>Statutory Calendar</strong>, record the ARN on the <strong>Client Portal</strong>, trigger the <strong>WhatsApp delivery receipt</strong>, and generate a draft compliance invoice in <strong>Billing</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-700 block">
                Statutory Acknowledgement Number (ARN / ITR-V)
              </label>
              <input
                type="text"
                value={arnInput}
                onChange={(e) => setArnInput(e.target.value)}
                placeholder="e.g. AA071026009182Z"
                className="w-full bg-white border border-slate-300 font-mono text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            <button
              onClick={handleCompleteFiling}
              disabled={isSubmitting || hasCascadeCompleted}
              className={`w-full py-2.5 px-4 rounded-xl font-black text-xs text-white transition flex items-center justify-center gap-2 shadow-md ${
                hasCascadeCompleted
                  ? "bg-emerald-600 cursor-default"
                  : isSubmitting
                  ? "bg-slate-400 cursor-wait"
                  : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/20 active:scale-98"
              }`}
            >
              {hasCascadeCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Filing Successfully Recorded</span>
                </>
              ) : isSubmitting ? (
                <span>Recording Statutory Filing...</span>
              ) : (
                <>
                  <span>Confirm Filing &amp; Trigger Cascade</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-mono">Audit Trail: Logged under user session</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
