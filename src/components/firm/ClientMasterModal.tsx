"use client";

import React, { useState } from "react";
import { ClientEntity, ClientGroup } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { 
  Users, 
  Building2, 
  Search, 
  Plus, 
  X, 
  Upload, 
  Download, 
  CheckCircle2, 
  UserCheck, 
  Phone, 
  Mail, 
  FileSpreadsheet,
  ShieldCheck,
  Building,
  ArrowRight
} from "lucide-react";

interface ClientMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientEntity[];
  groups?: ClientGroup[];
  onAddClient: (newClient: ClientEntity) => void;
}

export const ClientMasterModal: React.FC<ClientMasterModalProps> = ({
  isOpen,
  onClose,
  clients,
  groups = [],
  onAddClient,
}) => {
  const [activeTab, setActiveTab] = useState<"directory" | "add" | "bulk">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");

  // Form State
  const [entityName, setEntityName] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [type, setType] = useState<ClientEntity["type"] | "">("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [turnoverCr, setTurnoverCr] = useState("");
  const [incorporationYear, setIncorporationYear] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      let importedCount = 0;
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length <= 1) {
          alert("CSV is empty or missing data rows.");
          setIsImporting(false);
          return;
        }
        if (lines.length > 501) throw new Error("The CSV can contain a header and at most 500 client rows.");

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          const cols = matches 
            ? matches.map((m) => m.replace(/^"|"$/g, "").trim()) 
            : row.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          
          if (cols.length >= 9 && cols[0] && cols[1] && cols[2] && cols[7] !== "" && cols[8] && (cols[4] || cols[5] || cols[6])) {
            const legalTypes: ClientEntity["type"][] = ["PVT_LTD", "PUBLIC_LTD", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "INDIVIDUAL_HNI", "TRUST_NGO"];
            if (!legalTypes.includes(cols[1] as ClientEntity["type"])) throw new Error(`Row ${i + 1}: choose a valid legal type.`);
            const rowTurnover = Number(cols[7]);
            const rowYear = Number(cols[8]);
            if (!Number.isFinite(rowTurnover) || rowTurnover < 0 || !Number.isInteger(rowYear) || rowYear < 1800 || rowYear > new Date().getFullYear()) {
              throw new Error(`Row ${i + 1}: enter a valid turnover and incorporation year.`);
            }
            const clientPayload: ClientEntity = {
              id: "",
              groupId: "",
              groupName: "",
              name: cols[0],
              type: cols[1] as ClientEntity["type"],
              pan: cols[2].toUpperCase(),
              gstin: cols[3] ? cols[3].toUpperCase() : undefined,
              turnoverCr: rowTurnover,
              incorporationYear: rowYear,
              penaltyRiskAccrued: 0,
              partnerInCharge: "",
              assignedArticle: "",
              primaryContact: {
                name: cols[4] || "",
                phone: cols[5] || "",
                email: cols[6] || "",
                designation: "",
              },
            };
            await onAddClient(clientPayload);
            importedCount++;
          } else {
            throw new Error(`Row ${i + 1}: required columns are missing. Download a fresh CSV template and fill all required fields.`);
          }
        }
        toast.success(
          "Bulk Import Complete",
          `Successfully imported ${importedCount} client entities into practice master!`
        );
        setSuccessToast(`✓ Successfully imported ${importedCount} client entities into firm master!`);
        setTimeout(() => {
          setSuccessToast("");
          setActiveTab("directory");
        }, 1200);
      } catch (err: any) {
        toast.error("Import stopped", `${importedCount} rows were saved before the import stopped. ${err.message}`);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.primaryContact?.name && c.primaryContact.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGroup = selectedGroupFilter === "ALL" || c.groupId === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingForm) return;
    if (!entityName.trim() || !pan.trim() || !type || !contactName.trim() || !turnoverCr || !incorporationYear) return;
    if (!contactPhone.trim() && !contactEmail.trim()) {
      toast.error("Contact details required", "Enter a contact phone number or email address.");
      return;
    }

    setIsSubmittingForm(true);
    const savedName = entityName.trim();
    const savedPan = pan.trim().toUpperCase();

    const newClient: ClientEntity = {
      id: `CLI-${Date.now().toString().slice(-4)}`,
      groupId: groups?.[0]?.id || "",
      groupName: groups?.[0]?.name || "",
      name: savedName,
      type,
      pan: savedPan,
      gstin: gstin.trim().toUpperCase() || undefined,
      turnoverCr: Number(turnoverCr),
      incorporationYear: Number(incorporationYear),
      penaltyRiskAccrued: 0,
      partnerInCharge: "",
      assignedArticle: "",
      primaryContact: {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        email: contactEmail.trim(),
        designation: "",
      },
    };

    try {
      await onAddClient(newClient);

      // Enterprise Toast & Modal Feedback
      toast.success(
        "Client Successfully Onboarded",
        `"${savedName}" (${savedPan}) is now live in firm practice master.`
      );
      setSuccessToast(`✓ Client "${savedName}" onboarded! Switching to directory...`);
      
      // Reset form
      setEntityName("");
      setPan("");
      setGstin("");
      setType("");
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setTurnoverCr("");
      setIncorporationYear("");

      setTimeout(() => {
        setSuccessToast("");
        setActiveTab("directory");
      }, 900);
    } catch (err: any) {
      toast.error("Onboarding Failed", err.message || "Failed to onboard client");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = `entity_name,legal_type,pan,gstin,contact_name,contact_phone,contact_email,turnover_cr,incorporation_year\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CA_Client_Master_Import_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 pr-8 md:pr-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900">Client Directory &amp; Group Master</h3>
                <span className="bg-indigo-100 text-indigo-800 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  {clients.length} Accounts
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Centralized master for legal entities, promoter groups, and contacts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto scrollbar-none w-full md:w-auto">
            <button
              onClick={() => setActiveTab("directory")}
              className={`flex-1 md:flex-initial text-center px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === "directory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Directory ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`flex-1 md:flex-initial text-center px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === "add" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`flex-1 md:flex-initial text-center px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1 whitespace-nowrap ${
                activeTab === "bulk" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Import</span>
            </button>
          </div>
        </div>

        {/* Global Modal Confirmation Banner */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-300 p-3 sm:p-3.5 rounded-2xl text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs block text-emerald-900">{successToast}</span>
                <span className="text-[11px] text-emerald-700">Client entity successfully registered into practice directory.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: DIRECTORY */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by company name, PAN, GSTIN, or promoter..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>

              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 shrink-0"
              >
                <option value="ALL">All Promoter Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <p className="font-semibold text-slate-600">No client entities enrolled yet</p>
                  <p className="text-[11px] text-slate-400">Click <strong>+ Onboard Client</strong> above to add your first client.</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                <div key={client.id} className="p-3.5 hover:bg-slate-50/70 transition flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="font-extrabold text-slate-900 text-sm truncate">{client.name}</strong>
                      <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {client.type.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        PAN: {client.pan}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span>Contact: <strong className="text-slate-800">{client.primaryContact.name}</strong> ({client.primaryContact.phone})</span>
                      <span>&bull;</span>
                      <span>Assigned: <strong className="text-indigo-600">{client.assignedArticle}</strong></span>
                      <span>&bull;</span>
                      <span>Turnover: <strong className="text-slate-800">₹{client.turnoverCr} Cr</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/?view=client&id=${client.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1"
                    >
                      <span>Open Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ADD CLIENT */}
        {activeTab === "add" && (
          <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                1. Legal Entity Identification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Entity Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder="e.g. Acme Tech Solutions Private Limited"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                    <label className="font-bold text-slate-700 block mb-1">Entity Constitution / Type *</label>
                  <select
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value as ClientEntity["type"] | "")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- Select entity type --</option>
                    <option value="PVT_LTD">Private Limited Company</option>
                    <option value="PUBLIC_LTD">Public Limited Company</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="PARTNERSHIP">Partnership Firm</option>
                    <option value="PROPRIETORSHIP">Proprietorship Concern</option>
                    <option value="INDIVIDUAL_HNI">Individual / HNI Taxpayer</option>
                    <option value="TRUST_NGO">Trust / Section 8 NGO</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Permanent Account Number (PAN) *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="e.g. AABCM1234A"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AABCM1234A1Z5"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                2. Primary Promoter &amp; Contact Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label className="font-bold text-slate-700 block mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Mukesh Parekh"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp / Mobile Number</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 98230 11928"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                    <label className="font-bold text-slate-700 block mb-1">Email ID</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. accounts@acmetech.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">Business Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Turnover (₹ crore) *</label>
                  <input type="number" min="0" step="0.01" required value={turnoverCr} onChange={(e) => setTurnoverCr(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Incorporation Year *</label>
                  <input type="number" min="1800" max={new Date().getFullYear()} step="1" required value={incorporationYear} onChange={(e) => setIncorporationYear(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>
              {!contactPhone.trim() && !contactEmail.trim() && <p className="text-amber-800">Enter at least one contact phone number or email address.</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("directory")}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition"
              >
                Save Client to Master Directory
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: CSV BULK IMPORT */}
        {activeTab === "bulk" && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Bulk Client Onboarding via Excel / CSV</h4>
                  <p className="text-slate-500 mt-0.5">
                    Import client legal details, PAN, contact information, turnover, and incorporation year. Each row is validated before it is saved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download CSV Template</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,text/csv"
                className="hidden"
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-white space-y-2 cursor-pointer hover:border-indigo-500 transition group"
              >
                {isImporting ? (
                  <div className="py-2 space-y-2">
                    <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="font-black text-indigo-700">Importing Client Records to Supabase &amp; Local Master...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto transition" />
                    <p className="font-black text-slate-900 group-hover:text-indigo-600 transition">Choose CSV File from Computer</p>
                    <p className="text-[11px] text-slate-500">Supports .csv or UTF-8 formatted comma-separated files</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
