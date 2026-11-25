"use client";

import React, { useState, useMemo } from "react";
import { ClientEntity, ClientGroup } from "@/lib/types";
import { 
  inferConstitutionFromPan, 
  evaluateEntityThresholds, 
  GST_STATE_CODES, 
  calculateEntityHealthScore 
} from "@/lib/config/entityDna";
import { 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  FileText, 
  Users, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Scale,
  KeyRound,
  CreditCard
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { getQrmpGroupForState } from "@/lib/gst/gstClientFetch";

interface DiagnosticOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: ClientGroup[];
  onAddClient: (newClient: ClientEntity) => Promise<void> | void;
}

export const DiagnosticOnboardingModal: React.FC<DiagnosticOnboardingModalProps> = ({
  isOpen,
  onClose,
  groups = [],
  onAddClient
}) => {
  const [panInput, setPanInput] = useState("");
  const [entityNameInput, setEntityNameInput] = useState("");
  const [tradeNameInput, setTradeNameInput] = useState("");
  const [turnoverInput, setTurnoverInput] = useState("12.5");
  const [digitalPctInput, setDigitalPctInput] = useState("96.5");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [primaryStateCode, setPrimaryStateCode] = useState("23"); // Madhya Pradesh
  const [primaryGstinInput, setPrimaryGstinInput] = useState("");
  const [secondaryStateCode, setSecondaryStateCode] = useState("27"); // Maharashtra
  const [secondaryGstinInput, setSecondaryGstinInput] = useState("");
  const [hasSecondaryState, setHasSecondaryState] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("+91 98200 11223");
  const [contactEmail, setContactEmail] = useState("");
  const [partnerInCharge, setPartnerInCharge] = useState("CA Gunjan Jain");
  const [assignedArticle, setAssignedArticle] = useState("Kriti Jain (Article)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Statutory PAN Inference
  const panInference = useMemo(() => {
    return inferConstitutionFromPan(panInput);
  }, [panInput]);

  // Live Statutory Thresholds
  const turnoverNum = parseFloat(turnoverInput) || 0;
  const digitalPctNum = parseFloat(digitalPctInput) || 0;
  const thresholds = useMemo(() => {
    return evaluateEntityThresholds(
      turnoverNum,
      100 - digitalPctNum,
      true, // has MSME suppliers
      panInference.entityType
    );
  }, [turnoverNum, digitalPctNum, panInference.entityType]);

  // Validated real GSTINs (never fabricated)
  const primaryGstinCheck = useMemo(() => {
    const clean = primaryGstinInput.trim().toUpperCase();
    return clean ? validateGstinDetailed(clean) : null;
  }, [primaryGstinInput]);

  const secondaryGstinCheck = useMemo(() => {
    const clean = secondaryGstinInput.trim().toUpperCase();
    return clean && hasSecondaryState ? validateGstinDetailed(clean) : null;
  }, [secondaryGstinInput, hasSecondaryState]);

  const derivedPrimaryGstin = primaryGstinCheck?.isValid ? primaryGstinCheck.cleanGstin : "";
  const derivedSecondaryGstin = secondaryGstinCheck?.isValid ? secondaryGstinCheck.cleanGstin : "";

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panInference.isValid) {
      toast.error("Invalid PAN", "Please enter a valid 10-character Indian PAN.");
      return;
    }

    const legalName = (entityNameInput || `${tradeNameInput || "New Corporate Entity"} ${panInference.entityType === "PVT_LTD" ? "Private Limited" : panInference.entityType === "LLP" ? "LLP" : ""}`).trim();
    if (!legalName) {
      toast.error("Name Required", "Please enter legal entity name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const clientId = `CLI-${panInference.pan}-${Date.now().toString().slice(-4)}`;
      const targetGroupId = selectedGroupId || (groups[0]?.id || "GRP-DIRECT");
      const targetGroupName = groups.find((g) => g.id === targetGroupId)?.name || "Direct Practice Clients";
      const resolvedContactName = contactName || (panInference.entityType === "INDIVIDUAL_HNI" ? legalName : "Authorized Director");
      const resolvedEmail = contactEmail || `accounts@${legalName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

      if (primaryGstinInput.trim() && !primaryGstinCheck?.isValid) {
        toast.error("Invalid Primary GSTIN", primaryGstinCheck?.error || "Check 15-digit GSTIN format & checksum.");
        setIsSubmitting(false);
        return;
      }
      if (hasSecondaryState && secondaryGstinInput.trim() && !secondaryGstinCheck?.isValid) {
        toast.error("Invalid Secondary GSTIN", secondaryGstinCheck?.error || "Check 15-digit GSTIN format & checksum.");
        setIsSubmitting(false);
        return;
      }

      const gstinRecords = [];
      if (derivedPrimaryGstin && primaryGstinCheck?.stateCode) {
        const sc = primaryGstinCheck.stateCode;
        gstinRecords.push({
          gstin: derivedPrimaryGstin,
          stateCode: sc,
          stateName: primaryGstinCheck.stateName || GST_STATE_CODES[sc] || "Primary State",
          tradeName: tradeNameInput || legalName,
          legalName,
          registrationType: "REGULAR" as const,
          filingFrequency: "MONTHLY" as const,
          qrmpStateGroup: getQrmpGroupForState(sc),
          status: "ACTIVE" as const,
          eWayBillEnabled: true,
          eInvoiceApplicable: thresholds.eInvoicingMandatory
        });
      }
      if (hasSecondaryState && derivedSecondaryGstin && secondaryGstinCheck?.stateCode) {
        const sc = secondaryGstinCheck.stateCode;
        gstinRecords.push({
          gstin: derivedSecondaryGstin,
          stateCode: sc,
          stateName: secondaryGstinCheck.stateName || GST_STATE_CODES[sc] || "Secondary State",
          tradeName: `${tradeNameInput || legalName} - Branch`,
          legalName,
          registrationType: "REGULAR" as const,
          filingFrequency: "MONTHLY" as const,
          qrmpStateGroup: getQrmpGroupForState(sc),
          status: "ACTIVE" as const,
          eWayBillEnabled: true,
          eInvoiceApplicable: thresholds.eInvoicingMandatory
        });
      }

      const directors: any[] = [];
      const bankAccounts: any[] = [];
      const dscVault: any[] = [];
      const complianceBaselines: any[] = [];

      const newEntity: ClientEntity = {
        id: clientId,
        groupId: targetGroupId,
        groupName: targetGroupName,
        name: legalName,
        tradeName: tradeNameInput || legalName,
        type: panInference.entityType,
        pan: panInference.pan,
        gstin: derivedPrimaryGstin || undefined,
        cin: undefined,
        tan: undefined,
        turnoverCr: turnoverNum,
        digitalTxnPct: digitalPctNum,
        partnerInCharge,
        assignedArticle,
        incorporationYear: new Date().getFullYear(),
        penaltyRiskAccrued: 0,
        healthScore: 100,
        registeredAddress: GST_STATE_CODES[primaryStateCode] || "India",
        authorizedCapitalCr: Math.max(1.0, Math.round(turnoverNum * 0.1 * 10) / 10),
        paidUpCapitalCr: Math.max(0.5, Math.round(turnoverNum * 0.05 * 10) / 10),
        primaryContact: {
          name: resolvedContactName,
          phone: contactPhone,
          email: resolvedEmail,
          designation: panInference.entityType === "LLP" ? "Designated Partner" : "Director / Authorized Signatory"
        },
        gstinRecords,
        directors,
        bankAccounts,
        dscVault,
        complianceBaselines
      };

      await onAddClient(newEntity);
      toast.success(
        "Diagnostic Onboarding Completed",
        `${legalName} (${panInference.pan}) initialized across all 5 Suites with statutory baseline.`
      );
      onClose();
    } catch (err: any) {
      toast.error("Onboarding Error", err?.message || "Failed to onboard client entity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
      />

      {/* Modal Container */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="1-Tap Corporate Diagnostic Onboarding"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-red-50 via-white to-purple-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-btred-logo text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  1-Tap Corporate Diagnostic Onboarding
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-btred-logo border border-red-200">
                  Universal Spine
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Enter PAN $\rightarrow$ Auto-decode constitution, statutory thresholds, GSTINs &amp; ROC requirements.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Step 1: PAN & Algorithmic Constitution Decoder */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-btred-logo" /> 1. Algorithmic PAN Decoder (CBDT Standards)
              </span>
              {panInference.isValid && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid Statutory PAN
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  10-Digit Indian PAN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  autoFocus
                  required
                  value={panInput}
                  onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                  placeholder="e.g. AABCA8891D"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-sm font-black text-slate-900 tracking-wider focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  4th char: C=Company, F=Firm/LLP, P=Individual, H=HUF, T=Trust
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Legal Entity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={entityNameInput}
                  onChange={(e) => setEntityNameInput(e.target.value)}
                  placeholder="e.g. Pratwi Solutions Private Limited"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trade / Brand Name
                </label>
                <input
                  type="text"
                  value={tradeNameInput}
                  onChange={(e) => setTradeNameInput(e.target.value)}
                  placeholder="e.g. Pratwi Tech"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Live Constitution Diagnostic Card */}
            {panInference.isValid && (
              <div className="bg-white border border-purple-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in fade-in">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Constitution</span>
                  <span className="font-black text-purple-900">{panInference.legalConstitution}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">ITR Form</span>
                  <span className="font-black text-emerald-700">{panInference.statutoryTaxReturnForm}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Governing Body</span>
                  <span className="font-bold text-slate-700 truncate block">{panInference.governingAct.split("&")[0]}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">ROC Mandate</span>
                  <span className={`font-black ${panInference.rocApplicable ? "text-amber-800" : "text-slate-500"}`}>
                    {panInference.rocApplicable ? "Mandatory (MCA)" : "Not Applicable"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Financial Thresholds & Statutory Evaluation */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> 2. Turnover &amp; Statutory Threshold Evaluation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Annual Turnover (₹ Crores)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={turnoverInput}
                  onChange={(e) => setTurnoverInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Digital Transactions % (Banking)
                </label>
                <input
                  type="number"
                  step="0.5"
                  max={100}
                  min={0}
                  value={digitalPctInput}
                  onChange={(e) => setDigitalPctInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  &gt;95% digital unlocks ₹10 Cr limit for 44AB
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Promoter Business Group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                >
                  <option value="">Default (Direct Practice Clients)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Threshold Evaluation Results */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div className="bg-white border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tax Audit 44AB</span>
                <span className={`font-black ${thresholds.taxAuditApplicable ? "text-amber-800" : "text-emerald-700"}`}>
                  {thresholds.taxAuditApplicable ? "⚠️ Mandatory" : "✅ Exempt"}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Limit: ₹{thresholds.auditThresholdCr} Cr</span>
              </div>

              <div className="bg-white border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">e-Invoicing</span>
                <span className={`font-black ${thresholds.eInvoicingMandatory ? "text-purple-800" : "text-slate-500"}`}>
                  {thresholds.eInvoicingMandatory ? "⚡ Active (₹5 Cr+)" : "⚪ Exempt"}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Turnover: ₹{turnoverNum} Cr</span>
              </div>

              <div className="bg-white border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">CARO 2020</span>
                <span className={`font-black ${thresholds.caroApplicable ? "text-blue-800" : "text-slate-500"}`}>
                  {thresholds.caroApplicable ? "Mandatory" : "Exempt"}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Schedule III</span>
              </div>

              <div className="bg-white border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">MSME 43B(h)</span>
                <span className="font-black text-rose-800">
                  Strict 15/45 Days
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Clause 22 Audit</span>
              </div>
            </div>
          </div>

          {/* Step 3: Multi-State GSTINs & Operations */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" /> 3. Multi-State GSTIN Architecture
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary GSTIN (Optional, 15-Digit)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={primaryGstinInput}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setPrimaryGstinInput(val);
                    if (val.length >= 2 && GST_STATE_CODES[val.substring(0, 2)]) {
                      setPrimaryStateCode(val.substring(0, 2));
                    }
                  }}
                  placeholder={panInference.isValid ? `e.g. 23${panInference.pan}1Z5` : "Enter actual 15-digit GSTIN"}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-red-500"
                />
                {primaryGstinCheck && (
                  <span className={`text-[10px] font-medium mt-1 block ${primaryGstinCheck.isValid ? "text-emerald-700" : "text-rose-600"}`}>
                    {primaryGstinCheck.isValid ? `Valid: ${primaryGstinCheck.stateName}` : primaryGstinCheck.error}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Secondary State GSTIN (Optional)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSecondaryState}
                      onChange={(e) => setHasSecondaryState(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>Multi-State</span>
                  </label>
                </div>
                {hasSecondaryState ? (
                  <>
                    <input
                      type="text"
                      maxLength={15}
                      value={secondaryGstinInput}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setSecondaryGstinInput(val);
                        if (val.length >= 2 && GST_STATE_CODES[val.substring(0, 2)]) {
                          setSecondaryStateCode(val.substring(0, 2));
                        }
                      }}
                      placeholder="Enter secondary 15-digit GSTIN"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-mono text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-red-500"
                    />
                    {secondaryGstinCheck && (
                      <span className={`text-[10px] font-medium mt-1 block ${secondaryGstinCheck.isValid ? "text-emerald-700" : "text-rose-600"}`}>
                        {secondaryGstinCheck.isValid ? `Valid: ${secondaryGstinCheck.stateName}` : secondaryGstinCheck.error}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-400 py-2">Single state registration (add more later in GSTIN Master).</div>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Responsible CA Team & Communication */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-btred-logo" /> 4. CA Firm Assignment &amp; Primary Assessee Contact
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assessee Contact Person
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Director Chetan Pratap Singh"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Contact Mobile
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Partner-in-Charge
                </label>
                <input
                  type="text"
                  value={partnerInCharge}
                  onChange={(e) => setPartnerInCharge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Article Trainee
                </label>
                <input
                  type="text"
                  value={assignedArticle}
                  onChange={(e) => setAssignedArticle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !panInference.isValid}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-btred-logo hover:from-red-700 hover:to-red-800 text-white text-xs font-black shadow-md shadow-red-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Initializing Spine...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ 1-Tap Onboard Entity &amp; Bind All 5 Suites</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
