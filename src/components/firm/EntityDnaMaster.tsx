"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ClientEntity,
  ClientGroup,
  EntityType,
  GstinRecordItem,
} from "@/lib/types";
import {
  ENTITY_DNA_REGISTRY,
  evaluateEntityThresholds,
  inferConstitutionFromPan,
  calculateEntityHealthScore,
  GST_STATE_CODES,
} from "@/lib/config/entityDna";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { gstFetchJson, getQrmpGroupForState } from "@/lib/gst/gstClientFetch";
import {
  Building2,
  ShieldCheck,
  Layers,
  Sparkles,
  CheckCircle2,
  Scale,
  Users,
  CreditCard,
  KeyRound,
  Calendar,
  Plus,
  Edit3,
  Lock,
  Unlock,
  ClipboardCheck,
  RefreshCw,
  Trash2,
  X,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";

interface EntityDnaMasterProps {
  clients: ClientEntity[];
  groups?: ClientGroup[];
  selectedClientId?: string;
  initialTab?: "overview" | "gstins" | "mca" | "banking" | "dsc" | "baselines";
  onSelectClient?: (clientId: string) => void;
  onUpdateClient?: (clientId: string, data: Partial<ClientEntity>) => Promise<any> | void;
  onOpenDiagnosticModal?: () => void;
}

interface GstinFormState {
  gstin: string;
  tradeName: string;
  legalName: string;
  registrationType: GstinRecordItem["registrationType"];
  filingFrequency: GstinRecordItem["filingFrequency"];
  qrmpStateGroup: "22ND" | "24TH";
  status: GstinRecordItem["status"];
  registrationDate: string;
  cancellationDate: string;
  principalAddress: string;
  jurisdictionCenter: string;
  jurisdictionState: string;
  eWayBillEnabled: boolean;
  eInvoiceApplicable: boolean;
  isdEnabled: boolean;
  authorizedSignatory: string;
  otpMobile: string;
  creditIgst: number;
  creditCgst: number;
  creditSgst: number;
  creditCess: number;
  cashIgst: number;
  cashCgst: number;
  cashSgst: number;
  cashCess: number;
}

const EMPTY_GSTIN_FORM: GstinFormState = {
  gstin: "",
  tradeName: "",
  legalName: "",
  registrationType: "REGULAR",
  filingFrequency: "MONTHLY",
  qrmpStateGroup: "22ND",
  status: "ACTIVE",
  registrationDate: "",
  cancellationDate: "",
  principalAddress: "",
  jurisdictionCenter: "",
  jurisdictionState: "",
  eWayBillEnabled: true,
  eInvoiceApplicable: false,
  isdEnabled: false,
  authorizedSignatory: "",
  otpMobile: "",
  creditIgst: 0,
  creditCgst: 0,
  creditSgst: 0,
  creditCess: 0,
  cashIgst: 0,
  cashCgst: 0,
  cashSgst: 0,
  cashCess: 0,
};

export const EntityDnaMaster: React.FC<EntityDnaMasterProps> = ({
  clients = [],
  selectedClientId,
  initialTab,
  onUpdateClient,
  onOpenDiagnosticModal,
}) => {
  const isGstMasterMode = initialTab === "gstins";
  const [activeTab, setActiveTab] = useState<
    "overview" | "gstins" | "mca" | "banking" | "dsc" | "baselines"
  >(initialTab || "overview");

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const { selectedClient, selectedFy, selectGstin, selectClient } = useClientContext();

  const currentClient = useMemo(() => {
    if (selectedClient) {
      return clients.find((c) => c.id === selectedClient.id) || selectedClient;
    }
    if (selectedClientId) {
      return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
    }
    return clients[0] || null;
  }, [clients, selectedClientId, selectedClient]);

  const activeType: EntityType = currentClient?.type || "PVT_LTD";
  const dnaProfile = ENTITY_DNA_REGISTRY[activeType] || ENTITY_DNA_REGISTRY.PVT_LTD;

  const panInfo = useMemo(
    () => inferConstitutionFromPan(currentClient?.pan || ""),
    [currentClient?.pan]
  );

  const thresholds = useMemo(
    () =>
      evaluateEntityThresholds(
        currentClient?.turnoverCr || 0,
        100 - (currentClient?.digitalTxnPct || 96),
        false,
        activeType
      ),
    [currentClient?.turnoverCr, currentClient?.digitalTxnPct, activeType]
  );

  const healthScore = useMemo(() => {
    if (!currentClient) return 100;
    return currentClient.healthScore || calculateEntityHealthScore(currentClient);
  }, [currentClient]);

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const togglePasswordReveal = (id: string) =>
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  // Normalized GSTIN list from gstinRecords or primary client.gstin
  const clientGstins = useMemo<GstinRecordItem[]>(() => {
    if (!currentClient) return [];
    if (currentClient.gstinRecords && currentClient.gstinRecords.length > 0) {
      return currentClient.gstinRecords;
    }
    if (currentClient.gstin) {
      const code = currentClient.gstin.substring(0, 2);
      return [
        {
          gstin: currentClient.gstin,
          stateCode: code,
          stateName: GST_STATE_CODES[code] || "India",
          tradeName: currentClient.tradeName || currentClient.name,
          legalName: currentClient.name,
          registrationType: "REGULAR",
          filingFrequency: "MONTHLY",
          qrmpStateGroup: getQrmpGroupForState(code),
          status: "ACTIVE",
          eWayBillEnabled: true,
          eInvoiceApplicable: (currentClient.turnoverCr || 0) >= 5,
          authorizedSignatory: currentClient.primaryContact?.name,
          otpMobile: currentClient.primaryContact?.phone,
        },
      ];
    }
    return [];
  }, [currentClient]);

  // GSTIN Add / Edit Modal State
  const [isGstinModalOpen, setIsGstinModalOpen] = useState(false);
  const [editingGstin, setEditingGstin] = useState<string | null>(null);
  const [gstinForm, setGstinForm] = useState<GstinFormState>(EMPTY_GSTIN_FORM);
  const [isVerifyingGstn, setIsVerifyingGstn] = useState(false);
  const [isBatchVerifyingGstins, setIsBatchVerifyingGstins] = useState(false);
  const [isSavingGstin, setIsSavingGstin] = useState(false);
  const [verifyingRowGstin, setVerifyingRowGstin] = useState<string | null>(null);
  const [returnsHistoryByGstin, setReturnsHistoryByGstin] = useState<
    Record<string, Array<{ returnType: string; returnPeriod: string; filingStatus: string; filingDate: string; arn: string }>>
  >({});
  const [activeReturnsGstin, setActiveReturnsGstin] = useState<string | null>(null);

  const gstinValidation = useMemo(
    () => (gstinForm.gstin.trim() ? validateGstinDetailed(gstinForm.gstin) : null),
    [gstinForm.gstin]
  );

  const handleVerifyAllGstins = async () => {
    const gstins = clientGstins.map((g) => g.gstin).filter(Boolean);
    if (gstins.length === 0) return;
    setIsBatchVerifyingGstins(true);
    try {
      const { ok, data } = await gstFetchJson<any>("/api/gst/sync-portal", {
        method: "POST",
        body: JSON.stringify({ action: "BATCH_VENDOR_VERIFY", gstins, fy: selectedFy }),
      });
      if (!ok || !data?.success || !data.results) {
        toast.warning("Batch Verify Unavailable", data?.error || "Could not verify GSTINs against GSTN API.");
        return;
      }
      const results = data.results;
      if (onUpdateClient && currentClient) {
        const updatedList = clientGstins.map((g) => {
          const r = results[g.gstin];
          if (!r) return g;
          return {
            ...g,
            status: (r.status || g.status) as GstinRecordItem["status"],
            legalName: r.legalName || g.legalName,
            registrationDate: r.regDate || g.registrationDate,
          };
        });
        await onUpdateClient(currentClient.id, { gstinRecords: updatedList });
      }
      toast.success("Batch GSTIN Check Complete", `Verified ${Object.keys(results).length} GSTIN(s) live on GSTN.`);
    } finally {
      setIsBatchVerifyingGstins(false);
    }
  };

  const openAddGstinModal = () => {
    if (!currentClient) return;
    setEditingGstin(null);
    setGstinForm({
      ...EMPTY_GSTIN_FORM,
      tradeName: currentClient.tradeName || currentClient.name,
      legalName: currentClient.name,
      eInvoiceApplicable: (currentClient.turnoverCr || 0) >= 5,
      authorizedSignatory: currentClient.primaryContact?.name || "",
      otpMobile: currentClient.primaryContact?.phone || "",
    });
    setIsGstinModalOpen(true);
  };

  const openEditGstinModal = (rec: GstinRecordItem) => {
    setEditingGstin(rec.gstin);
    setGstinForm({
      gstin: rec.gstin,
      tradeName: rec.tradeName || "",
      legalName: rec.legalName || currentClient?.name || "",
      registrationType: rec.registrationType || "REGULAR",
      filingFrequency: rec.filingFrequency || "MONTHLY",
      qrmpStateGroup: rec.qrmpStateGroup || getQrmpGroupForState(rec.stateCode),
      status: rec.status || "ACTIVE",
      registrationDate: rec.registrationDate || "",
      cancellationDate: rec.cancellationDate || "",
      principalAddress: rec.principalAddress || "",
      jurisdictionCenter: rec.jurisdictionCenter || "",
      jurisdictionState: rec.jurisdictionState || "",
      eWayBillEnabled: rec.eWayBillEnabled ?? true,
      eInvoiceApplicable: rec.eInvoiceApplicable ?? (currentClient?.turnoverCr || 0) >= 5,
      isdEnabled: rec.isdEnabled ?? rec.registrationType === "ISD",
      authorizedSignatory: rec.authorizedSignatory || currentClient?.primaryContact?.name || "",
      otpMobile: rec.otpMobile || currentClient?.primaryContact?.phone || "",
      creditIgst: rec.openingCreditLedger?.igst || 0,
      creditCgst: rec.openingCreditLedger?.cgst || 0,
      creditSgst: rec.openingCreditLedger?.sgst || 0,
      creditCess: rec.openingCreditLedger?.cess || 0,
      cashIgst: rec.openingCashLedger?.igst || 0,
      cashCgst: rec.openingCashLedger?.cgst || 0,
      cashSgst: rec.openingCashLedger?.sgst || 0,
      cashCess: rec.openingCashLedger?.cess || 0,
    });
    setIsGstinModalOpen(true);
  };

  const handleVerifyGstinLive = async (targetGstin: string, applyToForm: boolean) => {
    const check = validateGstinDetailed(targetGstin);
    if (!check.isValid) {
      toast.error("Invalid GSTIN", check.error || "GSTIN failed Mod-36 checksum verification.");
      return;
    }

    if (applyToForm) setIsVerifyingGstn(true);
    else setVerifyingRowGstin(check.cleanGstin);

    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/lookup?gstin=${encodeURIComponent(check.cleanGstin)}&returns=true&fy=${encodeURIComponent(selectedFy)}`
      );

      if (!ok || !data?.success || !data?.data) {
        toast.warning(
          "GSTN Lookup Unavailable",
          data?.error || "Offline Mod-36 checksum is valid. Live GSTN API returned no data."
        );
        return;
      }

      const profile = data.data;
      const mappedStatus: GstinRecordItem["status"] =
        String(profile.status || "").toUpperCase().includes("CANCEL")
          ? "CANCELLED"
          : String(profile.status || "").toUpperCase().includes("SUSPEND")
          ? "SUSPENDED"
          : "ACTIVE";

      const mappedType: GstinRecordItem["registrationType"] =
        String(profile.taxpayerType || "").toUpperCase().includes("COMP")
          ? "COMPOSITION"
          : String(profile.taxpayerType || "").toUpperCase().includes("ISD")
          ? "ISD"
          : String(profile.taxpayerType || "").toUpperCase().includes("SEZ")
          ? "SEZ"
          : String(profile.taxpayerType || "").toUpperCase().includes("CASUAL")
          ? "CASUAL"
          : "REGULAR";

      if (Array.isArray(data.returnsData?.returns || data.returns)) {
        const retRows = data.returnsData?.returns || data.returns;
        setReturnsHistoryByGstin((prev) => ({ ...prev, [check.cleanGstin]: retRows }));
        setActiveReturnsGstin(check.cleanGstin);
      }

      if (applyToForm) {
        setGstinForm((prev) => ({
          ...prev,
          gstin: check.cleanGstin,
          legalName: profile.legalName || prev.legalName,
          tradeName: profile.tradeName || prev.tradeName,
          status: mappedStatus,
          registrationType: mappedType,
          registrationDate: profile.registrationDate || prev.registrationDate,
          cancellationDate: profile.cancellationDate || prev.cancellationDate,
          principalAddress: profile.address || prev.principalAddress,
          qrmpStateGroup: getQrmpGroupForState(check.stateCode || check.cleanGstin.substring(0, 2)),
        }));
        toast.success("GSTN Verified", `${profile.legalName} (${mappedStatus})`);
      } else if (currentClient && onUpdateClient) {
        const nextRecords = clientGstins.map((g) =>
          g.gstin === check.cleanGstin
            ? {
                ...g,
                tradeName: profile.tradeName || g.tradeName,
                legalName: profile.legalName || g.legalName,
                status: mappedStatus,
                registrationType: mappedType,
                registrationDate: profile.registrationDate || g.registrationDate,
                cancellationDate: profile.cancellationDate || g.cancellationDate,
                principalAddress: profile.address || g.principalAddress,
                lastGstnVerifiedAt: new Date().toISOString(),
              }
            : g
        );
        const updatedClient = await onUpdateClient(currentClient.id, {
          gstinRecords: nextRecords,
        });
        if (updatedClient) selectClient(updatedClient, check.cleanGstin);
        toast.success("GSTN Synced", `${check.cleanGstin} verified (${mappedStatus}).`);
      }
    } catch (err: any) {
      toast.error("Verification Error", err?.message || "Failed to reach GSTN lookup endpoint.");
    } finally {
      setIsVerifyingGstn(false);
      setVerifyingRowGstin(null);
    }
  };

  const handleSaveGstin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient || !onUpdateClient) return;

    const check = validateGstinDetailed(gstinForm.gstin);
    if (!check.isValid) {
      toast.error("Invalid GSTIN", check.error || "Enter a valid 15-character GSTIN.");
      return;
    }

    if (currentClient.pan && check.pan !== currentClient.pan.toUpperCase()) {
      toast.error(
        "PAN Mismatch",
        `GSTIN PAN (${check.pan}) does not match client PAN (${currentClient.pan}).`
      );
      return;
    }

    const stateCode = check.stateCode || check.cleanGstin.substring(0, 2);
    const newRecord: GstinRecordItem = {
      gstin: check.cleanGstin,
      stateCode,
      stateName: check.stateName || GST_STATE_CODES[stateCode] || "India",
      tradeName: gstinForm.tradeName.trim() || currentClient.name,
      legalName: gstinForm.legalName.trim() || currentClient.name,
      registrationType: gstinForm.registrationType,
      filingFrequency: gstinForm.filingFrequency,
      qrmpStateGroup: gstinForm.qrmpStateGroup,
      status: gstinForm.status,
      registrationDate: gstinForm.registrationDate || undefined,
      cancellationDate: gstinForm.cancellationDate || undefined,
      principalAddress: gstinForm.principalAddress.trim() || undefined,
      jurisdictionCenter: gstinForm.jurisdictionCenter.trim() || undefined,
      jurisdictionState: gstinForm.jurisdictionState.trim() || undefined,
      eWayBillEnabled: gstinForm.eWayBillEnabled,
      eInvoiceApplicable: gstinForm.eInvoiceApplicable,
      isdEnabled: gstinForm.isdEnabled,
      authorizedSignatory: gstinForm.authorizedSignatory.trim() || undefined,
      otpMobile: gstinForm.otpMobile.trim() || undefined,
      lastGstnVerifiedAt: new Date().toISOString(),
      openingCreditLedger: {
        igst: Number(gstinForm.creditIgst) || 0,
        cgst: Number(gstinForm.creditCgst) || 0,
        sgst: Number(gstinForm.creditSgst) || 0,
        cess: Number(gstinForm.creditCess) || 0,
      },
      openingCashLedger: {
        igst: Number(gstinForm.cashIgst) || 0,
        cgst: Number(gstinForm.cashCgst) || 0,
        sgst: Number(gstinForm.cashSgst) || 0,
        cess: Number(gstinForm.cashCess) || 0,
      },
    };

    const filtered = clientGstins.filter(
      (g) => g.gstin !== (editingGstin || check.cleanGstin)
    );
    const nextRecords = [...filtered, newRecord];
    const primaryActive =
      nextRecords.find((g) => g.status === "ACTIVE")?.gstin || nextRecords[0]?.gstin;

    setIsSavingGstin(true);
    try {
      const updated = await onUpdateClient(currentClient.id, {
        gstin: primaryActive,
        gstinRecords: nextRecords,
      });
      if (updated) selectClient(updated, newRecord.gstin);
      selectGstin(newRecord.gstin);
      setIsGstinModalOpen(false);
      toast.success(
        editingGstin ? "GSTIN Updated" : "GSTIN Added",
        `${newRecord.gstin} saved for ${currentClient.name}.`
      );
    } catch (err: any) {
      toast.error("Save Failed", err?.message || "Could not persist GSTIN changes.");
    } finally {
      setIsSavingGstin(false);
    }
  };

  const handleDeleteGstin = async (targetGstin: string) => {
    if (!currentClient || !onUpdateClient) return;
    if (clientGstins.length <= 1) {
      toast.warning("Primary GSTIN", "Edit this GSTIN instead of deleting the only registration.");
      return;
    }
    const nextRecords = clientGstins.filter((g) => g.gstin !== targetGstin);
    const primaryActive =
      nextRecords.find((g) => g.status === "ACTIVE")?.gstin || nextRecords[0]?.gstin;

    try {
      const updated = await onUpdateClient(currentClient.id, {
        gstin: primaryActive,
        gstinRecords: nextRecords,
      });
      if (updated) selectClient(updated, primaryActive);
      toast.success("GSTIN Removed", `${targetGstin} removed from directory.`);
    } catch (err: any) {
      toast.error("Remove Failed", err?.message || "Failed to remove GSTIN.");
    }
  };

  if (!currentClient) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Client Entities Onboarded</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Onboard a client entity to configure GSTIN registrations, filing frequencies, and opening ledgers.
        </p>
        {onOpenDiagnosticModal && (
          <button
            onClick={onOpenDiagnosticModal}
            className="px-5 py-2.5 rounded-xl bg-btred-logo text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Onboard Client
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              {isGstMasterMode ? "GSTIN Master Directory • Multi-State" : "Client Master • Statutory Profile"}
            </span>
            {!isGstMasterMode && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Health: {healthScore}%
                </span>
              </>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {currentClient.tradeName || currentClient.name}
          </h2>

          <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-500 flex-wrap">
            <span className="font-mono font-bold text-slate-800">PAN: {currentClient.pan}</span>
            <span>•</span>
            <span>Turnover: ₹{currentClient.turnoverCr} Cr</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{panInfo.legalConstitution}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <UniversalClientSelector variant="full" />

          {isGstMasterMode && onUpdateClient && (
            <button
              onClick={openAddGstinModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add GSTIN</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation: Focused in GSTIN Master mode; full in Client Master mode */}
      {!isGstMasterMode && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
          {[
            { id: "overview", label: "Constitution & Limits", icon: Scale },
            { id: "gstins", label: `GSTINs (${clientGstins.length})`, icon: Layers },
            { id: "mca", label: `Directors & DINs (${currentClient.directors?.length || 0})`, icon: Users },
            { id: "banking", label: `Bank & Logins (${currentClient.bankAccounts?.length || 0})`, icon: CreditCard },
            { id: "dsc", label: `DSC Tokens (${currentClient.dscVault?.length || 0})`, icon: KeyRound },
            { id: "baselines", label: "3-Yr Financials", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeTab === tab.id
                    ? "bg-btred-logo text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* GSTINs TAB (Primary view in GSTIN Master) */}
      {(activeTab === "gstins" || isGstMasterMode) && (
        <div className="space-y-5">
          {/* GST Statutory Applicability Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">E-Invoicing (Rule 48(4))</span>
              <span className={`text-sm font-bold mt-1 block ${currentClient.turnoverCr >= 5 ? "text-purple-700" : "text-slate-600"}`}>
                {currentClient.turnoverCr >= 5 ? "Mandatory (₹5 Cr+)" : "Exempt (< ₹5 Cr)"}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">QRMP Scheme Eligibility</span>
              <span className={`text-sm font-bold mt-1 block ${currentClient.turnoverCr <= 5 ? "text-emerald-700" : "text-slate-600"}`}>
                {currentClient.turnoverCr <= 5 ? "Eligible (≤ ₹5 Cr)" : "Monthly Mandatory"}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">GSTR-9 Annual Return</span>
              <span className={`text-sm font-bold mt-1 block ${currentClient.turnoverCr > 2 ? "text-amber-700" : "text-emerald-700"}`}>
                {currentClient.turnoverCr > 2 ? "Mandatory (> ₹2 Cr)" : "Optional (≤ ₹2 Cr)"}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">GSTR-9C Reconciliation</span>
              <span className={`text-sm font-bold mt-1 block ${currentClient.turnoverCr > 5 ? "text-red-700" : "text-slate-600"}`}>
                {currentClient.turnoverCr > 5 ? "Mandatory (> ₹5 Cr)" : "Exempt (≤ ₹5 Cr)"}
              </span>
            </div>
          </div>

          {/* Multi-State GSTIN Directory Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Registered GSTINs under PAN {currentClient.pan}
                </h3>
                <p className="text-xs text-slate-500">
                  Click any GSTIN to set it active across Filing Desk, 2B Matcher, IMS, and Annual Audit.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {clientGstins.length > 0 && (
                  <button
                    onClick={handleVerifyAllGstins}
                    disabled={isBatchVerifyingGstins}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBatchVerifyingGstins ? "animate-spin" : ""}`} />
                    <span>{isBatchVerifyingGstins ? "Verifying..." : `Verify All (${clientGstins.length})`}</span>
                  </button>
                )}
                {onUpdateClient && !isGstMasterMode && (
                  <button
                    onClick={openAddGstinModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add GSTIN
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">State</th>
                    <th className="p-3">GSTIN &amp; Trade Name</th>
                    <th className="p-3">Scheme / Frequency</th>
                    <th className="p-3">Opening Credit / Cash</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientGstins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No GSTIN registered for {currentClient.name}. Click &ldquo;Add GSTIN&rdquo; to add and verify one.
                      </td>
                    </tr>
                  ) : (
                    clientGstins.map((g) => {
                      const creditTotal =
                        (g.openingCreditLedger?.igst || 0) +
                        (g.openingCreditLedger?.cgst || 0) +
                        (g.openingCreditLedger?.sgst || 0) +
                        (g.openingCreditLedger?.cess || 0);
                      const cashTotal =
                        (g.openingCashLedger?.igst || 0) +
                        (g.openingCashLedger?.cgst || 0) +
                        (g.openingCashLedger?.sgst || 0) +
                        (g.openingCashLedger?.cess || 0);

                      return (
                        <tr key={g.gstin} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-semibold text-slate-900">
                            {g.stateName} ({g.stateCode})
                            {g.isdEnabled && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                                ISD
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                selectGstin(g.gstin);
                                toast.success("Active GSTIN Switched", `${g.gstin} (${g.stateName})`);
                              }}
                              className="font-mono font-bold text-blue-700 hover:underline block"
                            >
                              {g.gstin}
                            </button>
                            <span className="text-[11px] text-slate-600 block">{g.tradeName}</span>
                            {g.principalAddress && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                                {g.principalAddress}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{g.registrationType}</div>
                            <div className="text-[11px] text-slate-500">
                              {g.filingFrequency === "QRMP"
                                ? `QRMP (Due ${g.qrmpStateGroup === "24TH" ? "24th" : "22nd"})`
                                : "Monthly (11th / 20th)"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              E-Inv: {g.eInvoiceApplicable ? "Applicable" : "Exempt"}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <div className="text-emerald-700 font-semibold">
                              Credit: ₹{creditTotal.toLocaleString("en-IN")}
                            </div>
                            {creditTotal > 0 && (
                              <div className="text-[10px] text-slate-500">
                                I:{g.openingCreditLedger?.igst || 0} C:{g.openingCreditLedger?.cgst || 0} S:{g.openingCreditLedger?.sgst || 0}
                              </div>
                            )}
                            <div className="text-slate-600">
                              Cash: ₹{cashTotal.toLocaleString("en-IN")}
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                g.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : g.status === "SUSPENDED"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {g.status}
                            </span>
                            {g.lastGstnVerifiedAt && (
                              <span className="block text-[9px] text-slate-400 mt-1">
                                Verified {g.lastGstnVerifiedAt.split("T")[0]}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleVerifyGstinLive(g.gstin, false)}
                                disabled={verifyingRowGstin === g.gstin}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] inline-flex items-center gap-1 transition"
                                title="Verify status & filing history from GSTN"
                              >
                                <RefreshCw
                                  className={`w-3 h-3 ${
                                    verifyingRowGstin === g.gstin ? "animate-spin" : ""
                                  }`}
                                />
                                <span>Verify GSTN</span>
                              </button>
                              {onUpdateClient && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditGstinModal(g)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    title="Edit GSTIN configuration"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {clientGstins.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteGstin(g.gstin)}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                                      title="Remove GSTIN"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Live GSTN Filing History Panel (shown after clicking Verify GSTN) */}
            {activeReturnsGstin && returnsHistoryByGstin[activeReturnsGstin]?.length > 0 && (
              <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      GSTN Return Filing History — {activeReturnsGstin} (FY {selectedFy})
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveReturnsGstin(null)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px]">
                  {returnsHistoryByGstin[activeReturnsGstin].slice(0, 12).map((ret, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2">
                      <div className="font-bold text-slate-900">{ret.returnType}</div>
                      <div className="font-mono text-slate-600">{ret.returnPeriod}</div>
                      <div className="text-emerald-700 font-semibold">{ret.filingStatus}</div>
                      <div className="text-[10px] text-slate-400">{ret.filingDate}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-GST Client Master Tabs (Only shown when opened outside GST Suite) */}
      {!isGstMasterMode && activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-btred-logo">
                  Statutory Constitution
                </span>
                <h3 className="text-xl font-black text-slate-900">{dnaProfile.label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Governing Authority: <strong>{dnaProfile.governingBody}</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Tax Return</span>
                  <span className="text-sm font-black text-emerald-700">{dnaProfile.taxReturnForm}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Statutory Audit</span>
                  <span className="text-sm font-black text-slate-700">
                    {dnaProfile.statutoryAuditMandatory ? "Mandatory" : "Turnover Based"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Tax Audit u/s 44AB</span>
                <div className="text-sm font-black mt-1 text-slate-900">
                  {thresholds.taxAuditApplicable ? "Mandatory (3CD)" : "Exempt"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Limit: ₹{thresholds.auditThresholdCr} Cr
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">e-Invoicing Mandate</span>
                <div className="text-sm font-black mt-1 text-slate-900">
                  {thresholds.eInvoicingMandatory ? "Active (₹5 Cr+)" : "Exempt"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Turnover: ₹{currentClient.turnoverCr} Cr
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">CARO 2020</span>
                <div className="text-sm font-black mt-1 text-slate-900">
                  {thresholds.caroApplicable ? "Mandatory" : "Exempt"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Schedule III</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">MSME Sec 43B(h)</span>
                <div className="text-sm font-black mt-1 text-rose-800">15 / 45 Day Rule</div>
                <div className="text-[10px] text-slate-500 mt-1">Clause 22 Audit</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-btred-logo" /> Statutory Filing Obligations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dnaProfile.mandatoryRequirements.map((req) => (
                <div key={req.code} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      {req.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{req.frequency}</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">{req.title}</h5>
                  <p className="text-[11px] text-slate-500">{req.governingAct}</p>
                  <p className="text-[11px] text-slate-700 font-medium">Due: {req.dueDateDescription}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isGstMasterMode && activeTab === "mca" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">MCA / ROC Directors &amp; Secretarial Register</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentClient.directors && currentClient.directors.length > 0 ? (
              currentClient.directors.map((d) => (
                <div key={d.din} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">DIN: {d.din}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {d.dir3KycStatus}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{d.name}</h4>
                  <div className="text-xs text-slate-500">{d.designation}</div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No MCA directors recorded for {currentClient.name}.
              </div>
            )}
          </div>
        </div>
      )}

      {!isGstMasterMode && activeTab === "banking" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Assessee Bank Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentClient.bankAccounts && currentClient.bankAccounts.length > 0 ? (
              currentClient.bankAccounts.map((b) => {
                const isRevealed = revealedPasswords[b.id];
                return (
                  <div key={b.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{b.bankName}</span>
                      {b.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Account Number</span>
                        <span className="font-bold text-slate-800">{b.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">IFSC</span>
                        <span className="font-bold text-slate-800">{b.ifsc}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">
                        {isRevealed ? b.statementPassword || "None" : "••••••••"}
                      </span>
                      <button type="button" onClick={() => togglePasswordReveal(b.id)} className="p-1 text-slate-500">
                        {isRevealed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No bank accounts registered.
              </div>
            )}
          </div>
        </div>
      )}

      {!isGstMasterMode && activeTab === "dsc" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">DSC Token Register</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentClient.dscVault && currentClient.dscVault.length > 0 ? (
              currentClient.dscVault.map((dsc) => (
                <div key={dsc.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-700">{dsc.lockerSlot}</span>
                    <span className="text-[10px] font-bold text-emerald-700">{dsc.custodyStatus}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{dsc.holderName}</h4>
                  <div className="text-xs text-slate-500 font-mono">PAN: {dsc.holderPan}</div>
                  <div className="text-[11px] text-slate-600">Expires: {dsc.expiryDate}</div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No physical DSC tokens assigned.
              </div>
            )}
          </div>
        </div>
      )}

      {!isGstMasterMode && activeTab === "baselines" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Past Statutory Filings</h3>
          {currentClient.complianceBaselines && currentClient.complianceBaselines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">AY</th>
                    <th className="p-3">Form</th>
                    <th className="p-3">Ack No.</th>
                    <th className="p-3">Filing Date</th>
                    <th className="p-3">Tax Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentClient.complianceBaselines.map((b) => (
                    <tr key={b.assessmentYear}>
                      <td className="p-3 font-bold">AY {b.assessmentYear}</td>
                      <td className="p-3 font-mono">{b.formType}</td>
                      <td className="p-3 font-mono">{b.acknowledgementNo}</td>
                      <td className="p-3">{b.filingDate}</td>
                      <td className="p-3 font-mono">₹{b.taxPaidAmount.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              No historical baselines imported yet.
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT GSTIN */}
      {isGstinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingGstin ? `Edit GSTIN — ${editingGstin}` : "Add & Verify State GSTIN"}
                </h3>
                <p className="text-xs text-slate-500">
                  PAN: <strong className="font-mono">{currentClient.pan}</strong> • Mod-36 checksum &amp; live GSTN verification
                </p>
              </div>
              <button type="button" onClick={() => setIsGstinModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGstin} className="space-y-4 text-xs">
              {/* GSTIN + Verify */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <label className="font-bold text-slate-700 block mb-1">15-Digit GSTIN *</label>
                  <input
                    type="text"
                    maxLength={15}
                    required
                    disabled={Boolean(editingGstin)}
                    value={gstinForm.gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const code = val.length >= 2 ? val.substring(0, 2) : "";
                      setGstinForm((p) => ({
                        ...p,
                        gstin: val,
                        ...(code ? { qrmpStateGroup: getQrmpGroupForState(code) } : {}),
                      }));
                    }}
                    placeholder={`e.g. 23${currentClient.pan}1Z5`}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold uppercase disabled:bg-slate-100"
                  />
                  {gstinValidation && (
                    <span
                      className={`text-[11px] mt-1 block font-medium ${
                        gstinValidation.isValid ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {gstinValidation.isValid
                        ? `Valid Checksum • ${gstinValidation.stateName} (${gstinValidation.stateCode})`
                        : gstinValidation.error}
                    </span>
                  )}
                </div>
                <div className="sm:pt-5">
                  <button
                    type="button"
                    disabled={isVerifyingGstn || !gstinValidation?.isValid}
                    onClick={() => handleVerifyGstinLive(gstinForm.gstin, true)}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-semibold flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingGstn ? "animate-spin" : ""}`} />
                    <span>{isVerifyingGstn ? "Fetching..." : "Verify via GSTN"}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trade Name</label>
                  <input
                    type="text"
                    value={gstinForm.tradeName}
                    onChange={(e) => setGstinForm((p) => ({ ...p, tradeName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration Type</label>
                  <select
                    value={gstinForm.registrationType}
                    onChange={(e) =>
                      setGstinForm((p) => ({
                        ...p,
                        registrationType: e.target.value as GstinRecordItem["registrationType"],
                        isdEnabled: e.target.value === "ISD" ? true : p.isdEnabled,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="COMPOSITION">Composition</option>
                    <option value="ISD">Input Service Distributor (ISD)</option>
                    <option value="SEZ">SEZ Unit / Developer</option>
                    <option value="TDS_TCS">TDS / TCS Deductor</option>
                    <option value="CASUAL">Casual Taxable Person</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Filing Frequency</label>
                  <select
                    value={gstinForm.filingFrequency}
                    onChange={(e) =>
                      setGstinForm((p) => ({
                        ...p,
                        filingFrequency: e.target.value as GstinRecordItem["filingFrequency"],
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="MONTHLY">Monthly (GSTR-1 11th / 3B 20th)</option>
                    <option value="QRMP">Quarterly QRMP (IFF 13th / 3B 22nd or 24th)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTN Status</label>
                  <select
                    value={gstinForm.status}
                    onChange={(e) =>
                      setGstinForm((p) => ({
                        ...p,
                        status: e.target.value as GstinRecordItem["status"],
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Authorized Signatory</label>
                  <input
                    type="text"
                    value={gstinForm.authorizedSignatory}
                    onChange={(e) => setGstinForm((p) => ({ ...p, authorizedSignatory: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Portal OTP Mobile</label>
                  <input
                    type="text"
                    value={gstinForm.otpMobile}
                    onChange={(e) => setGstinForm((p) => ({ ...p, otpMobile: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={gstinForm.eInvoiceApplicable}
                    onChange={(e) => setGstinForm((p) => ({ ...p, eInvoiceApplicable: e.target.checked }))}
                  />
                  E-Invoicing Mandatory
                </label>
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={gstinForm.eWayBillEnabled}
                    onChange={(e) => setGstinForm((p) => ({ ...p, eWayBillEnabled: e.target.checked }))}
                  />
                  E-Way Bill Enabled
                </label>
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={gstinForm.isdEnabled}
                    onChange={(e) => setGstinForm((p) => ({ ...p, isdEnabled: e.target.checked }))}
                  />
                  ISD Pool Enabled
                </label>
              </div>

              {/* Opening Electronic Credit & Cash Ledger Balances */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                <span className="font-bold text-slate-800 block">
                  Opening Electronic Ledger Balances (₹)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Credit IGST</label>
                    <input
                      type="number"
                      min={0}
                      value={gstinForm.creditIgst}
                      onChange={(e) => setGstinForm((p) => ({ ...p, creditIgst: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Credit CGST</label>
                    <input
                      type="number"
                      min={0}
                      value={gstinForm.creditCgst}
                      onChange={(e) => setGstinForm((p) => ({ ...p, creditCgst: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Credit SGST</label>
                    <input
                      type="number"
                      min={0}
                      value={gstinForm.creditSgst}
                      onChange={(e) => setGstinForm((p) => ({ ...p, creditSgst: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Credit Cess</label>
                    <input
                      type="number"
                      min={0}
                      value={gstinForm.creditCess}
                      onChange={(e) => setGstinForm((p) => ({ ...p, creditCess: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Cash IGST</label>
                    <input
                      type="number"
                      min={0}
                      value={gstinForm.cashIgst}
                      onChange={(e) => setGstinForm((p) => ({ ...p, cashIgst: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Cash CGST</label>
                    <input
                      type="number"
                      min={0}
                      value={gstinForm.cashCgst}
                      onChange={(e) => setGstinForm((p) => ({ ...p, cashCgst: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Cash SGST</label>
                    <input
                      type="number"
                      min={0}
                      value={gstinForm.cashSgst}
                      onChange={(e) => setGstinForm((p) => ({ ...p, cashSgst: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Cash Cess</label>
                    <input
                      type="number"
                      min={0}
                      value={gstinForm.cashCess}
                      onChange={(e) => setGstinForm((p) => ({ ...p, cashCess: Number(e.target.value) || 0 }))}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGstinModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGstin || !gstinValidation?.isValid}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold"
                >
                  {isSavingGstin ? "Saving..." : "Save GSTIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
