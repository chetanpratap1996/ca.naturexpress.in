"use client";

import React, { useState, useMemo } from "react";
import { 
  ClientEntity, 
  ClientGroup, 
  EntityType,
  GstinRecordItem,
  DirectorRecordItem,
  BankAccountRecordItem,
  DscVaultRecordItem
} from "@/lib/types";
import { 
  ENTITY_DNA_REGISTRY, 
  evaluateEntityThresholds, 
  inferConstitutionFromPan,
  calculateEntityHealthScore,
  GST_STATE_CODES
} from "@/lib/config/entityDna";
import { 
  Building2, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Users, 
  CreditCard, 
  KeyRound, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Check, 
  Edit3, 
  Lock, 
  Unlock,
  ExternalLink,
  ChevronRight,
  ClipboardCheck,
  ShieldAlert,
  Search,
  X
} from "lucide-react";
import { toast } from "@/components/shared/ToastNotification";

interface EntityDnaMasterProps {
  clients: ClientEntity[];
  groups?: ClientGroup[];
  selectedClientId?: string;
  initialTab?: "overview" | "gstins" | "mca" | "banking" | "dsc" | "baselines";
  onSelectClient?: (clientId: string) => void;
  onUpdateClient?: (clientId: string, data: Partial<ClientEntity>) => Promise<void> | void;
  onOpenDiagnosticModal?: () => void;
}

export const EntityDnaMaster: React.FC<EntityDnaMasterProps> = ({
  clients = [],
  groups = [],
  selectedClientId,
  initialTab,
  onSelectClient,
  onUpdateClient,
  onOpenDiagnosticModal
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "gstins" | "mca" | "banking" | "dsc" | "baselines">(initialTab || "overview");
  const [clientSearch, setClientSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.pan.toLowerCase().includes(q) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
      (c.cin && c.cin.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Selected Client
  const currentClient = useMemo(() => {
    if (selectedClientId) {
      return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
    }
    return clients[0] || null;
  }, [clients, selectedClientId]);

  // Derived or Overridden Entity Type
  const [overrideType, setOverrideType] = useState<EntityType | "DEFAULT">("DEFAULT");
  const activeType: EntityType = overrideType !== "DEFAULT" 
    ? overrideType 
    : (currentClient?.type || "PVT_LTD");

  const dnaProfile = ENTITY_DNA_REGISTRY[activeType] || ENTITY_DNA_REGISTRY.PVT_LTD;

  // PAN inference
  const panInfo = useMemo(() => {
    return inferConstitutionFromPan(currentClient?.pan || "");
  }, [currentClient?.pan]);

  // Statutory Thresholds
  const thresholds = useMemo(() => {
    return evaluateEntityThresholds(
      currentClient?.turnoverCr || 5.0,
      100 - (currentClient?.digitalTxnPct || 96),
      true, // MSME suppliers
      activeType
    );
  }, [currentClient?.turnoverCr, currentClient?.digitalTxnPct, activeType]);

  // Health Score
  const healthScore = useMemo(() => {
    if (!currentClient) return 100;
    return currentClient.healthScore || calculateEntityHealthScore(currentClient);
  }, [currentClient]);

  // Password Reveal State for Bank Accounts
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!currentClient) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-black text-slate-800">No Client Entities Onboarded</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Start by onboarding an assessee to establish statutory profile and filing calendars.
        </p>
        {onOpenDiagnosticModal && (
          <button
            onClick={onOpenDiagnosticModal}
            className="px-5 py-2.5 rounded-xl bg-btred-logo text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> ⚡ Onboard Client
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Client Master Profile
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Compliance Health: {healthScore}%
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {currentClient.name}
          </h2>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
            <span className="font-mono font-bold text-slate-800">PAN: {currentClient.pan}</span>
            {currentClient.cin && (
              <>
                <span>•</span>
                <span className="font-mono text-slate-600">CIN: {currentClient.cin}</span>
              </>
            )}
            {currentClient.tan && (
              <>
                <span>•</span>
                <span className="font-mono text-slate-600">TAN: {currentClient.tan}</span>
              </>
            )}
            <span>•</span>
            <span className="font-bold text-slate-700">{panInfo.legalConstitution}</span>
          </div>
        </div>

        {/* Actions & Client Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Searchable Client Selector */}
          <div ref={searchRef} className="relative min-w-[240px] sm:min-w-[280px]">
            <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl px-3 py-2 transition">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={`Search ${clients.length} assessees...`}
                className="bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none w-full"
              />
              {clientSearch && (
                <button
                  onClick={() => {
                    setClientSearch("");
                    setIsDropdownOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1.5 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Select Entity ({filteredClients.length} of {clients.length})
                </div>
                {filteredClients.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-3">No assessees match &ldquo;{clientSearch}&rdquo;</div>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        if (onSelectClient) onSelectClient(c.id);
                        setIsDropdownOpen(false);
                        setClientSearch("");
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition ${
                        c.id === currentClient.id ? "bg-red-50 text-btred-logo font-black" : "hover:bg-slate-50 text-slate-800 font-semibold"
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate font-bold">{c.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">PAN: {c.pan} &bull; {c.type}</div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        ₹{c.turnoverCr || 5} Cr
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {onOpenDiagnosticModal && (
            <button
              onClick={onOpenDiagnosticModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-btred-logo text-white text-xs font-black shadow-xs hover:from-red-700 hover:to-red-800 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> + Onboard Client
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "overview"
              ? "bg-btred-logo text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Constitution &amp; Limits</span>
        </button>

        <button
          onClick={() => setActiveTab("gstins")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "gstins"
              ? "bg-btred-logo text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>GSTINs ({currentClient.gstinRecords?.length || 1})</span>
        </button>

        <button
          onClick={() => setActiveTab("mca")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "mca"
              ? "bg-btred-logo text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Directors &amp; DINs ({currentClient.directors?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("banking")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "banking"
              ? "bg-btred-logo text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Bank &amp; Logins ({currentClient.bankAccounts?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("dsc")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "dsc"
              ? "bg-btred-logo text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>DSC Tokens ({currentClient.dscVault?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("baselines")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "baselines"
              ? "bg-btred-logo text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>3-Yr Financials</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & THRESHOLDS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Statutory Constitution Profile */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-btred-logo">
                  Statutory Constitution
                </span>
                <h3 className="text-xl font-black text-slate-900">{dnaProfile.label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Governing Authority: <strong>{dnaProfile.governingBody}</strong></p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Mandatory Tax Return</span>
                  <span className="text-sm font-black text-emerald-700">{dnaProfile.taxReturnForm}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Statutory Audit</span>
                  <span className={`text-sm font-black ${dnaProfile.statutoryAuditMandatory ? "text-amber-800" : "text-slate-600"}`}>
                    {dnaProfile.statutoryAuditMandatory ? "Mandatory" : "Turnover Based"}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Statutory Threshold Evaluation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Tax Audit u/s 44AB</span>
                <div className="text-sm font-black mt-1 text-slate-900">
                  {thresholds.taxAuditApplicable ? "⚠️ Mandatory (3CD)" : "✅ Exempt"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Limit: ₹{thresholds.auditThresholdCr} Cr ({currentClient.digitalTxnPct || 96}% Digital)
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">e-Invoicing Mandate</span>
                <div className="text-sm font-black mt-1 text-slate-900">
                  {thresholds.eInvoicingMandatory ? "⚡ Active (₹5 Cr+)" : "⚪ Exempt"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Turnover: ₹{currentClient.turnoverCr} Cr
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">CARO 2020 Reporting</span>
                <div className="text-sm font-black mt-1 text-slate-900">
                  {thresholds.caroApplicable ? "Mandatory (11 Ratios)" : "Exempt"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Schedule III Division I
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">MSME Section 43B(h)</span>
                <div className="text-sm font-black mt-1 text-rose-800">
                  Strict 15/45 Day Rule
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Tax Audit Clause 22 Disallowance
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Annual Compliance Obligations */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-btred-logo" /> Statutory Filing Obligations &amp; Timelines
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dnaProfile.mandatoryRequirements.map((req) => (
                <div key={req.code} className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      {req.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {req.frequency}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">{req.title}</h5>
                  <p className="text-[11px] text-slate-500">{req.governingAct}</p>
                  <p className="text-[11px] text-slate-700 font-medium">Due: {req.dueDateDescription}</p>
                  <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 p-1.5 rounded-lg font-mono">
                    {req.penaltyClause}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-STATE GSTINs */}
      {activeTab === "gstins" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Multi-State GSTIN Directory</h3>
              <p className="text-xs text-slate-500">
                All state-level GSTINs under PAN {currentClient.pan}. Auto-syncs with GSTR-2B matcher and 3B calculator.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">State / Code</th>
                  <th className="p-3">GSTIN Number</th>
                  <th className="p-3">Trade Name / Branch</th>
                  <th className="p-3">Filing Frequency</th>
                  <th className="p-3">Jurisdiction (Centre / State)</th>
                  <th className="p-3">e-Invoice</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(currentClient.gstinRecords && currentClient.gstinRecords.length > 0) ? (
                  currentClient.gstinRecords.map((g) => (
                    <tr key={g.gstin} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">
                        {g.stateName} ({g.stateCode})
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-700">
                        {g.gstin}
                      </td>
                      <td className="p-3 text-slate-700">
                        {g.tradeName}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-800">
                          {g.filingFrequency}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        <div>{g.jurisdictionCenter || "CGST Division"}</div>
                        <div>{g.jurisdictionState || "SGST Ward"}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.eInvoiceApplicable ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-500"}`}>
                          {g.eInvoiceApplicable ? "Active (₹5 Cr+)" : "Exempt"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          g.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700"
                        }`}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 font-mono">
                      Single GSTIN on record: {currentClient.gstin || "None assigned"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MCA DIRECTORS & SECRETARIAL */}
      {activeTab === "mca" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">MCA / ROC Directors &amp; Secretarial Register</h3>
              <p className="text-xs text-slate-500">
                Official Ministry of Corporate Affairs director registry with DINs, DIR-3 KYC compliance status and appointments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(currentClient.directors && currentClient.directors.length > 0) ? (
              currentClient.directors.map((d) => (
                <div key={d.din} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-slate-800">
                      DIN: {d.din}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      d.dir3KycStatus === "COMPLIANT" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700"
                    }`}>
                      DIR-3 KYC: {d.dir3KycStatus}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{d.name}</h4>
                  <div className="text-xs text-slate-500">{d.designation}</div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Appointed: {d.appointmentDate}</span>
                    {d.dscValidityEnd && (
                      <span className="text-slate-600 font-mono">DSC: {d.dscValidityEnd}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                No MCA directors registered for this constitution profile ({currentClient.type}).
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BANK ACCOUNTS & PASSWORD VAULT */}
      {activeTab === "banking" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Assessee Bank Accounts &amp; Statement Password Vault</h3>
              <p className="text-xs text-slate-500">
                Encrypted statement passwords are automatically used by the Bank OCR parser to strip PDF locks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(currentClient.bankAccounts && currentClient.bankAccounts.length > 0) ? (
              currentClient.bankAccounts.map((b) => {
                const isRevealed = revealedPasswords[b.id];
                return (
                  <div key={b.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs text-slate-900">{b.bankName}</span>
                      </div>
                      {b.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                          Primary Operating A/c
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Account Number</span>
                        <span className="font-bold text-slate-800">{b.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">IFSC Code</span>
                        <span className="font-bold text-slate-800">{b.ifsc}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-500">PDF Password:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {isRevealed ? (b.statementPassword || "No Password") : "••••••••"}
                        </span>
                      </div>

                      <button
                        onClick={() => togglePasswordReveal(b.id)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title={isRevealed ? "Hide Password" : "Show Password"}
                      >
                        {isRevealed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                No bank accounts registered. Add accounts to enable zero-click Bank Statement OCR.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PHYSICAL DSC LOCKER */}
      {activeTab === "dsc" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Physical DSC Token Locker &amp; Rack Coordinates</h3>
              <p className="text-xs text-slate-500">
                Tracks USB hardware tokens in the firm safe locker with custody tracking for article trainees.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(currentClient.dscVault && currentClient.dscVault.length > 0) ? (
              currentClient.dscVault.map((dsc) => (
                <div key={dsc.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {dsc.lockerSlot}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {dsc.custodyStatus}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{dsc.holderName}</h4>
                  <div className="text-xs text-slate-500 font-mono">PAN: {dsc.holderPan}</div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Provider: {dsc.tokenProvider}</span>
                    <span className="font-mono font-bold text-slate-700">Expires: {dsc.expiryDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                No physical DSC tokens assigned to this client entity in the safe locker.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: 3-YEAR COMPLIANCE BASELINES */}
      {activeTab === "baselines" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Past 3-Year Statutory Compliance Baselines</h3>
              <p className="text-xs text-slate-500">
                Historical ITR and audit filing acknowledgements establishing the baseline compliance profile.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Assessment Year</th>
                  <th className="p-3">Form Type</th>
                  <th className="p-3">ITR-V Acknowledgement No.</th>
                  <th className="p-3">Filing Date</th>
                  <th className="p-3">Tax Paid (₹)</th>
                  <th className="p-3">Refund Claimed (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(currentClient.complianceBaselines && currentClient.complianceBaselines.length > 0) ? (
                  currentClient.complianceBaselines.map((b) => (
                    <tr key={b.assessmentYear} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">
                        AY {b.assessmentYear}
                      </td>
                      <td className="p-3 font-mono font-bold text-purple-700">
                        {b.formType}
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {b.acknowledgementNo}
                      </td>
                      <td className="p-3 text-slate-600">
                        {b.filingDate}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        ₹{b.taxPaidAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        ₹{b.refundClaimedAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 font-mono">
                      No past filing baselines imported yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
