"use client";

import React, { useState, useRef } from "react";
import { ClientEntity, ClientGroup } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { 
  normalizePhone10, 
  DEMO_USERS 
} from "@/lib/auth/session";
import { 
  sanitizeIndianPhoneNumber 
} from "@/lib/whatsapp";
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
  ArrowRight,
  Send,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  Smartphone,
  ExternalLink,
  MessageSquare
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
  const [activeTab, setActiveTab] = useState<"directory" | "credentials" | "bulk" | "add">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Single Client
  const [entityName, setEntityName] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [type, setType] = useState<ClientEntity["type"]>("PVT_LTD");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [assignedArticle, setAssignedArticle] = useState("Kriti Jain (Article)");
  const [assignedPartner, setAssignedPartner] = useState("CA Gunjan Jain");
  const [turnoverCr, setTurnoverCr] = useState("10.0");
  const [successToast, setSuccessToast] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate 1-Tap WhatsApp Link for a client
  const generateClientWhatsAppUrl = (client: ClientEntity) => {
    const phone = client.primaryContact?.phone || "";
    const cleanPhone = sanitizeIndianPhoneNumber(phone);
    const message = `Hello ${client.primaryContact?.name || ""}, ${client.name} has been added to the CA firm's client workspace. Portal: https://ca.naturexpress.in/. Secure account activation must be sent separately by the firm. Do not use PAN, phone number, or a shared password to sign in.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Generate 1-Tap WhatsApp Link for Staff (Partner / Article)
  const generateStaffWhatsAppUrl = (role: "partner" | "article") => {
    const user = DEMO_USERS[role];
    const cleanPhone = sanitizeIndianPhoneNumber(user.phone);
    const message = `Hello ${user.name}, please use the CA practice portal at https://ca.naturexpress.in/. Secure account activation must be issued separately by the firm administrator. Do not share passwords over WhatsApp.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyMessage = (client: ClientEntity) => {
    const phone = client.primaryContact?.phone || "";
    const message = `Hello ${client.primaryContact?.name || ""}, ${client.name} has been added to the CA firm's client workspace. Portal: https://ca.naturexpress.in/. Secure account activation must be sent separately by the firm. Do not use PAN, phone number, or a shared password to sign in.`;

    navigator.clipboard.writeText(message);
    setCopiedId(client.id);
    toast.info("Onboarding Message Copied", `Copied customized WhatsApp text for ${client.name}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyStaffMessage = (role: "partner" | "article") => {
    const user = DEMO_USERS[role];
    const message = `Hello ${user.name}, please use the CA practice portal at https://ca.naturexpress.in/. Secure account activation must be issued separately by the firm administrator. Do not share passwords over WhatsApp.`;

    navigator.clipboard.writeText(message);
    setCopiedId(user.id);
    toast.info("Secure Setup Message Copied", `Copied a password-free setup message for ${user.name}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Download a client directory without authentication secrets.
  const handleExportAllCredentialsCsv = () => {
    if (clients.length === 0) {
      toast.warning("No Clients Registered", "Please enroll or import clients first.");
      return;
    }

    const headers = ["Entity Name", "Entity Type", "PAN", "GSTIN", "Director / Signatory", "Mobile Number", "Email", "Portal URL"];
    const rows = clients.map((c) => {
      const director = c.primaryContact?.name || "Director";
      const phone = c.primaryContact?.phone || "";
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        c.type,
        c.pan,
        c.gstin || "",
        `"${director.replace(/"/g, '""')}"`,
        `"${normalizePhone10(phone)}"`,
        `"${c.primaryContact?.email || ""}"`,
        "https://ca.naturexpress.in/"
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GPA_Client_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export Complete", `Exported a password-free directory for ${clients.length} clients.`);
  };

  // HIGH-THROUGHPUT 100+ CLIENT CSV IMPORTER
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length <= 1) {
          alert("CSV is empty or missing data rows.");
          setIsImporting(false);
          return;
        }

        const batchPayload: Partial<ClientEntity>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          const cols = matches 
            ? matches.map((m) => m.replace(/^"|"$/g, "").trim()) 
            : row.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          
          if (cols.length >= 3 && cols[0] && cols[2]) {
            const rawPhone = cols[5] || "+91 98000 00000";
            const directorName = cols[4] || "Promoter";

            batchPayload.push({
              name: cols[0],
              type: (cols[1] as any) || "PVT_LTD",
              pan: cols[2].toUpperCase().trim(),
              gstin: cols[3] ? cols[3].toUpperCase().trim() : undefined,
              turnoverCr: parseFloat(cols[7]) || 5.0,
              incorporationYear: 2024,
              partnerInCharge: "CA Gunjan Jain",
              assignedArticle: cols[8] || "Kriti Jain (Article)",
              primaryContact: {
                name: directorName,
                phone: rawPhone,
                email: cols[6] || "accounts@client.com",
                designation: "Director / Authorized Signatory",
              },
            });
          }
        }

        if (batchPayload.length === 0) {
          toast.error("No Valid Rows", "Could not parse any client rows with Name and PAN.");
          setIsImporting(false);
          return;
        }

        // Send high-throughput batch to /api/clients
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch: batchPayload, actorName: "CA Gunjan Jain" }),
        });

        const resData = await response.json();
        if (resData.success) {
          toast.success(
            "Bulk Import Successful",
            `Successfully saved ${resData.count || batchPayload.length} client profiles. Portal accounts require separate provisioning.`
          );
          setSuccessToast(`✓ Onboarded ${resData.count || batchPayload.length} clients! Switching to 1-Tap Broadcast Desk...`);
          
          // Re-sync local client state if available
          if (resData.clients && Array.isArray(resData.clients)) {
            resData.clients.forEach((c: ClientEntity) => onAddClient(c));
          } else {
            batchPayload.forEach((b) => onAddClient(b as ClientEntity));
          }

          setTimeout(() => {
            setSuccessToast("");
            setActiveTab("credentials");
          }, 1200);
        } else {
          toast.error("Import Error", resData.error || "Failed to persist batch");
        }
      } catch (err: any) {
        toast.error("Import Failed", "Failed to parse CSV file: " + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = `entity_name,legal_type,pan,gstin,contact_name,contact_phone,contact_email,turnover_cr,assigned_article
"Pratwi Solutions Private Limited","PVT_LTD","AANCP9915B","09AANCP9915B1Z4","Chetan Pratap Singh","+91 80771 70715","chetanpratap1996@gmail.com",10.0,"Kriti Jain"
"Apex Logistics & Freight LLP","LLP","AABFA8812L","27AABFA8812L1Z8","Amitabh Verma","+91 98200 44101","amitabh@apexlogistics.in",14.5,"Kriti Jain"
"Sharma Infrastructure Works","PROPRIETORSHIP","AAFPS1290C","23AAFPS1290C1Z2","Ramesh Sharma","+91 94250 88912","sharma.infra@gmail.com",4.2,"Kriti Jain"`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "GPA_100_Client_Master_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.primaryContact?.name && c.primaryContact.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.primaryContact?.phone && c.primaryContact.phone.includes(searchQuery));
    
    const matchesGroup = selectedGroupFilter === "ALL" || c.groupId === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim() || !pan.trim() || isSubmittingForm) return;

    setIsSubmittingForm(true);
    const savedName = entityName.trim();
    const savedPan = pan.trim().toUpperCase();

    const newClient: ClientEntity = {
      id: `CLI-${Date.now().toString().slice(-4)}`,
      groupId: groups?.[0]?.id || "GRP-DIRECT",
      groupName: groups?.[0]?.name || "Direct Practice Clients",
      name: savedName,
      type,
      pan: savedPan,
      gstin: gstin.trim().toUpperCase() || undefined,
      turnoverCr: parseFloat(turnoverCr) || 5.0,
      incorporationYear: 2024,
      penaltyRiskAccrued: 0,
      partnerInCharge: assignedPartner,
      assignedArticle,
      primaryContact: {
        name: contactName.trim() || "Promoter",
        phone: contactPhone.trim() || "+91 98000 00000",
        email: contactEmail.trim() || "accounts@client.com",
        designation: "Director / Authorized Signatory",
      },
    };

    try {
      await onAddClient(newClient);
      toast.success(
        "Client Successfully Onboarded",
        `"${savedName}" (${savedPan}) is saved. Secure portal access must be provisioned separately.`
      );
      setSuccessToast(`✓ Client "${savedName}" registered! Switching to 1-Tap Broadcast Desk...`);
      
      setEntityName("");
      setPan("");
      setGstin("");
      setContactName("");
      setContactPhone("");
      setContactEmail("");

      setTimeout(() => {
        setSuccessToast("");
        setActiveTab("credentials");
      }, 900);
    } catch (err: any) {
      toast.error("Onboarding Failed", err.message || "Failed to onboard client");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 selection:bg-red-500 selection:text-white">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition z-10"
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
                <h3 className="text-sm sm:text-base font-black text-slate-900">Client Master &amp; WhatsApp Onboarding Desk</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200">
                  {clients.length} Clients Registered
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                GPA &amp; Co. Master Directory &bull; Portal: <strong className="font-mono text-slate-700">https://ca.naturexpress.in/</strong>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto scrollbar-none w-full md:w-auto">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === "directory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Directory ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab("credentials")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "credentials" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1-Tap WhatsApp Desk</span>
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap ${
                activeTab === "bulk" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload 100+ CSV</span>
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap ${
                activeTab === "add" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Single</span>
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
                <span className="text-[11px] text-emerald-700">Client profile saved. Portal access must be provisioned through Supabase Auth.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: 1-TAP WHATSAPP ONBOARDING BROADCAST DESK */}
        {activeTab === "credentials" && (
          <div className="space-y-4 text-xs">
            {/* Top Action Utility Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-black text-sm text-white">Client Portal Access Desk</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Share password-free portal details. Secure accounts must be provisioned separately by the firm administrator.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportAllCredentialsCsv}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px]"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Client Directory</span>
                </button>
              </div>
            </div>

            {/* Staff Credentials Section (CA Partners & Employees) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-btred-logo" />
                <span>CA Firm Partners &amp; Employees Access (1-Tap Share)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Managing Partner */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-sm">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900 font-extrabold">{DEMO_USERS.partner.name}</strong>
                      <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">Managing Partner</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{DEMO_USERS.partner.email} &bull; Secure account activation required</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyStaffMessage("partner")}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Copy password-free setup message"
                    >
                      {copiedId === DEMO_USERS.partner.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={generateStaffWhatsAppUrl("partner")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition flex items-center gap-1 text-[10px] font-bold shadow-sm"
                      title="Send on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Article Assistant */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-sm">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900 font-extrabold">{DEMO_USERS.article.name}</strong>
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">Article Assistant</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{DEMO_USERS.article.email} &bull; Secure account activation required</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyStaffMessage("article")}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Copy password-free setup message"
                    >
                      {copiedId === DEMO_USERS.article.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={generateStaffWhatsAppUrl("article")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition flex items-center gap-1 text-[10px] font-bold shadow-sm"
                      title="Send on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Clients Credentials List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[380px] overflow-y-auto bg-white">
              {filteredClients.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600">No client entities found</p>
                  <p className="text-[11px] text-slate-400">Upload a CSV of 100+ clients using the CSV Import tab.</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const director = client.primaryContact?.name || "Director";
                  const phone = client.primaryContact?.phone || "";
                  const isCopied = copiedId === client.id;

                  return (
                    <div key={client.id} className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-bold text-slate-900 text-xs truncate max-w-[200px] sm:max-w-xs">{client.name}</strong>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">PAN: {client.pan}</span>
                          <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{director}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>Portal access: <strong className="text-amber-700">Invitation required</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Copy Text Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(client)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition"
                          title="Copy Ready-to-Paste WhatsApp Message"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy Msg"}</span>
                        </button>

                        {/* 1-Tap WhatsApp Link */}
                        <a
                          href={generateClientWhatsAppUrl(client)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 transition shadow-sm active:scale-95"
                          title="1-Tap Direct WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>1-Tap WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DIRECTORY */}
        {activeTab === "directory" && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by company name, PAN, mobile number, or director..."
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
                  <p className="text-[11px] text-slate-400">Click <strong>Upload 100+ CSV</strong> above to populate your practice.</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const director = client.primaryContact?.name || "Director";
                  const phone = client.primaryContact?.phone || "";
                  return (
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
                          {(() => {
                            // Client Health & Churn Risk Algorithm (0 - 100)
                            const penaltyDeduction = Math.min(30, (client.penaltyRiskAccrued || 0) > 0 ? 25 : 0);
                            const baseScore = 100 - penaltyDeduction;
                            const isHealthy = baseScore >= 80;
                            const isAttention = baseScore >= 60 && baseScore < 80;
                            return (
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                                  isHealthy
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : isAttention
                                    ? "bg-amber-50 text-amber-700 border-amber-300"
                                    : "bg-rose-50 text-rose-700 border-rose-300"
                                }`}
                                title={`Client Health Score: ${baseScore}/100. Computed based on pending penalty risks and return filing status.`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? "bg-emerald-500" : isAttention ? "bg-amber-500" : "bg-rose-500"}`} />
                                Health: {baseScore}/100 {isHealthy ? "(Stable)" : "(At Risk)"}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>Signatory: <strong className="text-slate-800">{director}</strong> ({phone})</span>
                          <span>&bull;</span>
                          <span>Turnover: <strong className="text-slate-800">₹{client.turnoverCr} Cr</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={generateClientWhatsAppUrl(client)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1"
                          title="Send password-free portal setup message"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden md:inline">WhatsApp</span>
                        </a>

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
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CSV BULK IMPORT FOR 100+ CLIENTS */}
        {activeTab === "bulk" && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Bulk 100+ Client Onboarding Pipeline</h4>
                  <p className="text-slate-500 mt-0.5 text-xs">
                    Instantly import 100+ client entities with legal names, PAN, GSTIN, directors, and phones.
                    Client profiles are imported; user accounts must be separately provisioned in Supabase Auth.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download Sample CSV Template</span>
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
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-white rounded-2xl p-8 text-center space-y-2.5 cursor-pointer transition group"
              >
                {isImporting ? (
                  <div className="py-4 space-y-3">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="font-black text-indigo-700 text-sm">Ingesting 100+ Client Entities into Practice Registry...</p>
                    <p className="text-slate-400 text-[11px]">Saving client profiles and groups...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-9 h-9 text-indigo-500 group-hover:scale-110 transition mx-auto" />
                    <p className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition">
                      Click to Select or Drop Client CSV File
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Supports comma-delimited CSV format containing: <br/>
                      <strong className="font-mono text-slate-700">entity_name, legal_type, pan, gstin, contact_name, contact_phone, contact_email, turnover_cr</strong>
                    </p>
                  </>
                )}
              </div>

              {/* Guidance Box */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-[11px] space-y-1 text-indigo-950">
                <span className="font-extrabold flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  What happens when you upload 100 clients?
                </span>
                <p className="text-slate-600 leading-relaxed">
                  1. Each company profile is registered with their legal PAN and promoter details.<br/>
                  2. No password is created or exported from client contact details.<br/>
                  3. Secure portal accounts must be provisioned by the firm administrator before clients can sign in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADD SINGLE CLIENT */}
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
                  <label className="font-bold text-slate-700 block mb-1">Entity Constitution / Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="PVT_LTD">Private Limited Company</option>
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
                2. Primary Signatory &amp; WhatsApp Contact
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Mukesh Parekh"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp / Mobile Number *</label>
                  <input
                    type="tel"
                    required
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
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                3. Firm Assignment
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Article Assistant</label>
                  <select
                    value={assignedArticle}
                    onChange={(e) => setAssignedArticle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Kriti Jain (Article)">Kriti Jain (CRO022998)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Managing Partner in Charge</label>
                  <select
                    value={assignedPartner}
                    onChange={(e) => setAssignedPartner(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="CA Gunjan Jain">CA Gunjan Jain (Managing Partner)</option>
                  </select>
                </div>
              </div>
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
                disabled={isSubmittingForm}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isSubmittingForm ? "Saving..." : "Save Client Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
