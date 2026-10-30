"use client";

import React, { useState, useRef } from "react";
import { ClientEntity, ClientGroup } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { isValidPan, isValidGstin } from "@/lib/utils";
import { 
  normalizePhone10, 
  DEMO_USERS 
} from "@/lib/auth/session";
import { 
  buildTemplateMessage, 
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
  MessageSquare,
  Edit2,
  Trash2,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCheck,
  Filter,
  DollarSign
} from "lucide-react";

interface ClientMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientEntity[];
  groups?: ClientGroup[];
  onAddClient: (newClient: ClientEntity) => Promise<void> | void;
  onUpdateClient?: (clientId: string, data: Partial<ClientEntity>) => Promise<void> | void;
  onDeleteClient?: (clientId: string) => Promise<void> | void;
}

export const ClientMasterModal: React.FC<ClientMasterModalProps> = ({
  isOpen,
  onClose,
  clients,
  groups = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [activeTab, setActiveTab] = useState<"directory" | "credentials" | "bulk" | "add">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedHealthFilter, setSelectedHealthFilter] = useState("ALL");
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Broadcast Queue Modal State
  const [isBroadcastQueueOpen, setIsBroadcastQueueOpen] = useState(false);
  const [broadcastIndex, setBroadcastIndex] = useState(0);
  const [dispatchedIds, setDispatchedIds] = useState<Set<string>>(new Set());

  // Edit Client Modal State
  const [editingClient, setEditingClient] = useState<ClientEntity | null>(null);
  const [editEntityName, setEditEntityName] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editGstin, setEditGstin] = useState("");
  const [editType, setEditType] = useState<ClientEntity["type"]>("PVT_LTD");
  const [editContactName, setEditContactName] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editTurnoverCr, setEditTurnoverCr] = useState("10.0");
  const [editAssignedArticle, setEditAssignedArticle] = useState("Kriti Jain (Article)");
  const [editAssignedPartner, setEditAssignedPartner] = useState("CA Gunjan Jain");
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);

  // Delete Confirmation State
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

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

  // Generate 1-Tap WhatsApp Link for a client with 4-Digit Access PIN
  const generateClientWhatsAppUrl = (client: ClientEntity) => {
    const director = client.primaryContact?.name || "Director";
    const phone = client.primaryContact?.phone || "";
    const cleanPhone = sanitizeIndianPhoneNumber(phone);
    const phone10 = normalizePhone10(phone);
    const pin = phone10.length >= 4 ? phone10.slice(-4) : "0715";

    const message = buildTemplateMessage("CLIENT_CREDENTIALS", {
      clientName: client.name,
      loginId: `${phone10 || client.pan}`,
      loginPassword: pin,
      portalUrl: `https://ca.naturexpress.in/?phone=${phone10}`,
      firmName: DEFAULT_FIRM_BRANDING.firmName,
    });

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Generate WhatsApp Message string for a client
  const getClientWhatsAppMessage = (client: ClientEntity) => {
    const director = client.primaryContact?.name || "Director";
    const phone = client.primaryContact?.phone || "";
    const phone10 = normalizePhone10(phone);
    const pin = phone10.length >= 4 ? phone10.slice(-4) : "0715";

    return buildTemplateMessage("CLIENT_CREDENTIALS", {
      clientName: client.name,
      loginId: `${phone10 || client.pan}`,
      loginPassword: pin,
      portalUrl: `https://ca.naturexpress.in/?phone=${phone10}`,
      firmName: DEFAULT_FIRM_BRANDING.firmName,
    });
  };

  // Generate 1-Tap WhatsApp Link for Staff (Partner / Article)
  const generateStaffWhatsAppUrl = (role: "partner" | "article") => {
    const user = DEMO_USERS[role];
    const cleanPhone = sanitizeIndianPhoneNumber(user.phone);

    const message = buildTemplateMessage("STAFF_CREDENTIALS", {
      clientName: user.name,
      loginId: user.email,
      loginPassword: role === "partner" ? "Partner@2026" : "Article@2026",
      portalUrl: "https://ca.naturexpress.in/",
      firmName: DEFAULT_FIRM_BRANDING.firmName,
      serviceName: user.designation,
    });

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleCopyMessage = (client: ClientEntity) => {
    const message = getClientWhatsAppMessage(client);
    const phone = client.primaryContact?.phone || "";
    const phone10 = normalizePhone10(phone);
    const pin = phone10.length >= 4 ? phone10.slice(-4) : "0715";

    navigator.clipboard.writeText(message);
    setCopiedId(client.id);
    toast.info("Onboarding Message Copied", `Copied credentials message (PIN: ${pin}) for ${client.name}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyPin = (client: ClientEntity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const phone = client.primaryContact?.phone || "";
    const phone10 = normalizePhone10(phone);
    const pin = phone10.length >= 4 ? phone10.slice(-4) : "0715";

    navigator.clipboard.writeText(pin);
    setCopiedPinId(client.id);
    toast.success("PIN Copied", `4-Digit PIN (${pin}) copied to clipboard.`);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const handleCopyStaffMessage = (role: "partner" | "article") => {
    const user = DEMO_USERS[role];
    const message = buildTemplateMessage("STAFF_CREDENTIALS", {
      clientName: user.name,
      loginId: user.email,
      loginPassword: role === "partner" ? "Partner@2026" : "Article@2026",
      portalUrl: "https://ca.naturexpress.in/",
      firmName: DEFAULT_FIRM_BRANDING.firmName,
      serviceName: user.designation,
    });

    navigator.clipboard.writeText(message);
    setCopiedId(user.id);
    toast.info("Staff Access Copied", `Copied credentials text for ${user.name}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Download Master Credentials CSV for all clients
  const handleExportAllCredentialsCsv = () => {
    if (clients.length === 0) {
      toast.warning("No Clients Registered", "Please enroll or import clients first.");
      return;
    }

    const headers = [
      "Entity Name", 
      "Entity Type", 
      "PAN", 
      "GSTIN", 
      "Director / Signatory", 
      "Mobile Number", 
      "Email", 
      "4-Digit Access PIN", 
      "Direct Portal Link", 
      "1-Tap WhatsApp Link"
    ];
    const rows = clients.map((c) => {
      const director = c.primaryContact?.name || "Director";
      const phone = c.primaryContact?.phone || "";
      const phone10 = normalizePhone10(phone);
      const pin = phone10.length >= 4 ? phone10.slice(-4) : "0715";
      const portalLink = `https://ca.naturexpress.in/?phone=${phone10}`;
      const waLink = generateClientWhatsAppUrl(c);
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        c.type,
        c.pan,
        c.gstin || "",
        `"${director.replace(/"/g, '""')}"`,
        `"${phone10}"`,
        `"${c.primaryContact?.email || ""}"`,
        `"${pin}"`,
        `"${portalLink}"`,
        `"${waLink}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GPA_Clients_Credentials_Master_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export Complete", `Exported credentials sheet for ${clients.length} clients.`);
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
          body: JSON.stringify({ batch: batchPayload, actorName: DEFAULT_FIRM_BRANDING.managingPartner }),
        });

        const resData = await response.json();
        if (resData.success) {
          toast.success(
            "Bulk Import Successful",
            `Successfully onboarded ${resData.count || batchPayload.length} clients! Passwords generated & ready.`
          );
          setSuccessToast(`✓ Onboarded ${resData.count || batchPayload.length} clients! Switching to 1-Tap Broadcast Desk...`);
          
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

  // Instant 1-Click Load 10 Practice Clients Demo
  const handleLoadDemoClients = async () => {
    setIsImporting(true);
    const demoClientsPayload: Partial<ClientEntity>[] = [
      {
        name: "Zenith Precision Robotics India Pvt Ltd",
        type: "PVT_LTD",
        pan: "AAACZ9941K",
        gstin: "27AAACZ9941K1Z4",
        turnoverCr: 42.5,
        incorporationYear: 2020,
        partnerInCharge: "CA Gunjan Jain",
        assignedArticle: "Kriti Jain (Article)",
        primaryContact: {
          name: "Siddharth Deshmukh",
          phone: "+91 98201 10099",
          email: "siddharth@zenithrobotics.in",
          designation: "Managing Director"
        }
      },
      {
        name: "Bharat AgriLogistics & Warehousing LLP",
        type: "LLP",
        pan: "AAHFB7712M",
        gstin: "23AAHFB7712M1Z2",
        turnoverCr: 18.0,
        incorporationYear: 2021,
        partnerInCharge: "CA Gunjan Jain",
        assignedArticle: "Kriti Jain (Article)",
        primaryContact: {
          name: "Gopal Patidar",
          phone: "+91 94250 18822",
          email: "gopal@bharatwarehouse.com",
          designation: "Designated Partner"
        }
      },
      {
        name: "Paramount Solar Infra Solutions Pvt Ltd",
        type: "PVT_LTD",
        pan: "AABCP8831R",
        gstin: "24AABCP8831R1Z9",
        turnoverCr: 65.0,
        incorporationYear: 2018,
        partnerInCharge: "CA Gunjan Jain",
        assignedArticle: "Kriti Jain (Article)",
        primaryContact: {
          name: "Ravi Teja",
          phone: "+91 98490 22314",
          email: "ravi@paramountsolar.co.in",
          designation: "Director"
        }
      },
      {
        name: "Khandelwal Steels & Hardware Traders",
        type: "PARTNERSHIP",
        pan: "AAAFK3321L",
        gstin: "23AAAFK3321L1Z0",
        turnoverCr: 8.5,
        incorporationYear: 2015,
        partnerInCharge: "CA Gunjan Jain",
        assignedArticle: "Kriti Jain (Article)",
        primaryContact: {
          name: "Ashok Khandelwal",
          phone: "+91 98270 44510",
          email: "ashok.steels@gmail.com",
          designation: "Managing Partner"
        }
      },
      {
        name: "CloudNexus Cloud Systems Pvt Ltd",
        type: "PVT_LTD",
        pan: "AABCC4490Q",
        gstin: "29AABCC4490Q1Z8",
        turnoverCr: 28.0,
        incorporationYear: 2022,
        partnerInCharge: "CA Gunjan Jain",
        assignedArticle: "Kriti Jain (Article)",
        primaryContact: {
          name: "Ananya Swaminathan",
          phone: "+91 99000 81223",
          email: "ananya@cloudnexus.io",
          designation: "Director & CTO"
        }
      }
    ];

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: demoClientsPayload, actorName: DEFAULT_FIRM_BRANDING.managingPartner }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Demo Clients Loaded", `Successfully ingested 5 corporate client entities into practice registry.`);
        if (data.clients && Array.isArray(data.clients)) {
          data.clients.forEach((c: ClientEntity) => onAddClient(c));
        } else {
          demoClientsPayload.forEach((b) => onAddClient(b as ClientEntity));
        }
        setActiveTab("directory");
      }
    } catch (e: any) {
      toast.error("Failed", e.message);
    } finally {
      setIsImporting(false);
    }
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

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.primaryContact?.name && c.primaryContact.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.primaryContact?.phone && c.primaryContact.phone.includes(searchQuery));
    
    const matchesGroup = selectedGroupFilter === "ALL" || c.groupId === selectedGroupFilter;
    const matchesType = selectedTypeFilter === "ALL" || c.type === selectedTypeFilter;

    let matchesHealth = true;
    const penaltyDeduction = Math.min(30, (c.penaltyRiskAccrued || 0) > 0 ? 25 : 0);
    const baseScore = 100 - penaltyDeduction;
    if (selectedHealthFilter === "STABLE") {
      matchesHealth = baseScore >= 80;
    } else if (selectedHealthFilter === "AT_RISK") {
      matchesHealth = baseScore < 80;
    }

    return matchesSearch && matchesGroup && matchesType && matchesHealth;
  });

  // Aggregate Metrics for Practice Overview
  const totalTurnover = clients.reduce((sum, c) => sum + (c.turnoverCr || 0), 0).toFixed(1);
  const stableCount = clients.filter((c) => (c.penaltyRiskAccrued || 0) === 0).length;
  const atRiskCount = clients.length - stableCount;

  // Handle single client creation
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim() || !pan.trim() || isSubmittingForm) return;

    // Statutory PAN and GSTIN format & checksum validation
    const panClean = pan.trim().toUpperCase();
    if (!isValidPan(panClean)) {
      toast.error("Invalid PAN Format", "Permanent Account Number must be 10 characters with valid entity code (e.g. AABCM1234A).");
      return;
    }
    const gstinClean = gstin.trim().toUpperCase();
    if (gstinClean && !isValidGstin(gstinClean)) {
      toast.error("Invalid GSTIN", "Please enter a valid 15-character GSTIN with valid state code.");
      return;
    }

    setIsSubmittingForm(true);
    const savedName = entityName.trim();

    const newClient: ClientEntity = {
      id: `CLI-${Date.now().toString().slice(-4)}`,
      groupId: groups?.[0]?.id || "GRP-DIRECT",
      groupName: groups?.[0]?.name || "Direct Practice Clients",
      name: savedName,
      type,
      pan: panClean,
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
        `"${savedName}" (${panClean}) is now active. Credentials ready to share.`
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

  // Open Edit Client Modal
  const handleOpenEdit = (client: ClientEntity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingClient(client);
    setEditEntityName(client.name);
    setEditPan(client.pan);
    setEditGstin(client.gstin || "");
    setEditType(client.type);
    setEditContactName(client.primaryContact?.name || "");
    setEditContactPhone(client.primaryContact?.phone || "");
    setEditContactEmail(client.primaryContact?.email || "");
    setEditTurnoverCr(String(client.turnoverCr || "10.0"));
    setEditAssignedArticle(client.assignedArticle || "Kriti Jain (Article)");
    setEditAssignedPartner(client.partnerInCharge || "CA Gunjan Jain");
  };

  // Save Edit Client Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || isUpdatingClient) return;

    const cleanEditPan = editPan.trim().toUpperCase();
    if (!isValidPan(cleanEditPan)) {
      toast.error("Invalid PAN Format", "Please provide a valid 10-character PAN with legal entity code.");
      return;
    }
    const cleanEditGstin = editGstin.trim().toUpperCase();
    if (cleanEditGstin && !isValidGstin(cleanEditGstin)) {
      toast.error("Invalid GSTIN", "Please provide a valid 15-character GSTIN.");
      return;
    }

    setIsUpdatingClient(true);
    const updatedData: Partial<ClientEntity> = {
      name: editEntityName.trim(),
      pan: cleanEditPan,
      gstin: cleanEditGstin || undefined,
      type: editType,
      turnoverCr: parseFloat(editTurnoverCr) || 5.0,
      assignedArticle: editAssignedArticle,
      partnerInCharge: editAssignedPartner,
      primaryContact: {
        name: editContactName.trim() || "Promoter",
        phone: editContactPhone.trim() || "+91 98000 00000",
        email: editContactEmail.trim() || "accounts@client.com",
        designation: editingClient.primaryContact?.designation || "Director",
      },
    };

    try {
      if (onUpdateClient) {
        await onUpdateClient(editingClient.id, updatedData);
      } else {
        await fetch("/api/clients", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingClient.id, ...updatedData }),
        });
      }
      toast.success("Client Updated", `Profile for "${editEntityName}" saved successfully.`);
      setEditingClient(null);
    } catch (err: any) {
      toast.error("Update Failed", err.message || "Could not update client");
    } finally {
      setIsUpdatingClient(false);
    }
  };

  // Delete Client
  const handleConfirmDelete = async () => {
    if (!deletingClientId) return;
    try {
      if (onDeleteClient) {
        await onDeleteClient(deletingClientId);
      } else {
        await fetch(`/api/clients?id=${deletingClientId}`, { method: "DELETE" });
      }
      toast.success("Client Archived", "Client entity removed from active directory.");
      setDeletingClientId(null);
    } catch (e: any) {
      toast.error("Delete Failed", e.message);
    }
  };

  // Live 4-digit PIN preview for single add form
  const rawCleanPhone = contactPhone.replace(/\D/g, "");
  const dynamicPinPreview = rawCleanPhone.length >= 4 ? rawCleanPhone.slice(-4) : "0715";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 selection:bg-red-500 selection:text-white">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        
        {/* Top Close Button (Cleanly isolated) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-2 rounded-2xl hover:bg-slate-100 transition z-20"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3 pr-12 lg:pr-14">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-red-50 border border-red-200 text-btred-logo flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Client Master &amp; WhatsApp Onboarding Desk
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200">
                  {clients.length} Clients Registered
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {DEFAULT_FIRM_BRANDING.firmName} &bull; Portal: <strong className="font-mono text-slate-700">https://ca.naturexpress.in/</strong>
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Clean, no truncate, no double plus */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold overflow-x-auto scrollbar-none w-full lg:w-auto shrink-0">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap shrink-0 ${
                activeTab === "directory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Directory ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab("credentials")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "credentials" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1-Tap WhatsApp Desk</span>
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "bulk" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload 100+ CSV</span>
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "add" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* Global Confirmation Banner */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-300 p-3 sm:p-3.5 rounded-2xl text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs block text-emerald-900">{successToast}</span>
                <span className="text-[11px] text-emerald-700">Client profile and Zero-DLT credentials successfully initialized.</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: DIRECTORY
           ========================================================================= */}
        {activeTab === "directory" && (
          <div className="space-y-3.5 text-xs">
            {/* Search, Filter Bar, and Practice Metrics Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
              <div className="flex flex-col md:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by company name, PAN, GSTIN, mobile, or director..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-btred-logo shrink-0"
                  >
                    <option value="ALL">All Groups</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-btred-logo shrink-0"
                  >
                    <option value="ALL">All Entity Types</option>
                    <option value="PVT_LTD">Private Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="PARTNERSHIP">Partnership</option>
                    <option value="PROPRIETORSHIP">Proprietorship</option>
                    <option value="INDIVIDUAL_HNI">Individual / HNI</option>
                    <option value="TRUST_NGO">Trust / NGO</option>
                  </select>

                  <select
                    value={selectedHealthFilter}
                    onChange={(e) => setSelectedHealthFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-btred-logo shrink-0"
                  >
                    <option value="ALL">All Health</option>
                    <option value="STABLE">Stable (80-100)</option>
                    <option value="AT_RISK">At Risk (&lt;80)</option>
                  </select>
                </div>
              </div>

              {/* Fast Stats Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 pt-1 border-t border-slate-200/80 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span>Showing: <strong className="text-slate-900">{filteredClients.length}</strong> of {clients.length} Entities</span>
                  <span>&bull;</span>
                  <span>Stable: <strong className="text-emerald-700">{stableCount}</strong></span>
                  <span>&bull;</span>
                  <span>At Risk: <strong className="text-amber-700">{atRiskCount}</strong></span>
                </div>
                <div>
                  Practice Managed Turnover: <strong className="text-slate-900 font-mono">₹{totalTurnover} Cr</strong>
                </div>
              </div>
            </div>

            {/* Client Cards List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[460px] overflow-y-auto bg-white">
              {filteredClients.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-3">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No client entities match your filter</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Try clearing your search query or click <strong>Upload 100+ CSV</strong> to populate realistic client entities.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedGroupFilter("ALL"); setSelectedTypeFilter("ALL"); setSelectedHealthFilter("ALL"); }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const director = client.primaryContact?.name || "Director";
                  const phone = client.primaryContact?.phone || "";
                  const phone10 = normalizePhone10(phone);
                  const pin = phone10.length >= 4 ? phone10.slice(-4) : "0715";
                  const isCopiedPin = copiedPinId === client.id;

                  // Health & Churn Risk Algorithm
                  const penaltyDeduction = Math.min(30, (client.penaltyRiskAccrued || 0) > 0 ? 25 : 0);
                  const baseScore = 100 - penaltyDeduction;
                  const isHealthy = baseScore >= 80;

                  return (
                    <div key={client.id} className="p-3.5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      {/* Left: Entity Info & Identifiers */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-extrabold text-slate-900 text-sm truncate">{client.name}</strong>
                          
                          <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {client.type.replace(/_/g, " ")}
                          </span>

                          <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            PAN: {client.pan}
                          </span>

                          {client.gstin ? (
                            <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                              GST: {client.gstin}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                              GST: Unregistered
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                              isHealthy
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                            title={`Health Score: ${baseScore}/100 based on statutory compliance and penalty exposure.`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />
                            Health: {baseScore}/100 {isHealthy ? "(Stable)" : "(At Risk)"}
                          </span>
                        </div>

                        {/* Signatory, PIN, and Assigned In-Charge Strip */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>
                            Signatory: <strong className="text-slate-800">{director}</strong> ({phone})
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            PIN:{" "}
                            <strong className="font-mono text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                              {pin}
                            </strong>
                            <button
                              onClick={(e) => handleCopyPin(client, e)}
                              className="text-slate-400 hover:text-emerald-700 p-0.5 transition"
                              title="Copy 4-Digit PIN"
                            >
                              {isCopiedPin ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </span>
                          <span>&bull;</span>
                          <span>Turnover: <strong className="text-slate-800">₹{client.turnoverCr} Cr</strong></span>
                          <span>&bull;</span>
                          <span className="text-slate-500">
                            Partner: <strong className="text-slate-700">{client.partnerInCharge || "CA Gunjan Jain"}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {/* 1-Tap WhatsApp */}
                        <a
                          href={generateClientWhatsAppUrl(client)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1"
                          title="Send Credentials via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Open Portal */}
                        <a
                          href={`/?view=client&id=${client.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition text-[11px] flex items-center gap-1"
                          title="Open Client View Portal"
                        >
                          <span>Open Portal</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>

                        {/* Edit Button */}
                        <button
                          onClick={(e) => handleOpenEdit(client, e)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                          title="Edit Client Information"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeletingClientId(client.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Archive Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: 1-TAP WHATSAPP ONBOARDING BROADCAST DESK
           ========================================================================= */}
        {activeTab === "credentials" && (
          <div className="space-y-4 text-xs">
            {/* Top Action Utility Banner */}
            <div className="bg-slate-50 text-slate-800 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span className="font-black text-sm text-slate-900">1-Tap WhatsApp Client Onboarding Hub</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Send tailored onboarding kits with username, password, portal link &amp; business reasons to log in.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastIndex(0);
                    setIsBroadcastQueueOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-black flex items-center gap-1.5 transition text-[11px] shadow-sm active:scale-95"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start 1-Tap Broadcast Queue ({clients.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAllCredentialsCsv}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px]"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download Credentials Sheet</span>
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
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {DEMO_USERS.partner.email} &bull; Pass: <strong className="text-slate-800">Partner@2026</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyStaffMessage("partner")}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Copy Staff Credentials"
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
                      <span className="text-[9px] bg-red-50 text-btred-logo border border-red-200 font-bold px-1.5 py-0.5 rounded">Article Assistant</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {DEMO_USERS.article.email} &bull; Pass: <strong className="text-slate-800">Article@2026</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyStaffMessage("article")}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Copy Staff Credentials"
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
                <div className="py-12 text-center text-slate-600 space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-600">No client entities found</p>
                  <p className="text-[11px] text-slate-500">Upload a CSV of 100+ clients using the CSV Import tab.</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const director = client.primaryContact?.name || "Director";
                  const phone = client.primaryContact?.phone || "";
                  const phone10 = normalizePhone10(phone);
                  const pin = phone10.length >= 4 ? phone10.slice(-4) : "0715";
                  const isCopied = copiedId === client.id;
                  const isDispatched = dispatchedIds.has(client.id);

                  return (
                    <div key={client.id} className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-bold text-slate-900 text-xs truncate max-w-[200px] sm:max-w-xs">{client.name}</strong>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">PAN: {client.pan}</span>
                          <span className="text-[10px] text-btred-logo font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">{director}</span>
                          {isDispatched && (
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                              <CheckCheck className="w-3 h-3 text-emerald-600" /> Dispatched
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>User ID: <strong className="text-slate-800">{normalizePhone10(phone) || client.pan}</strong></span>
                          <span>&bull;</span>
                          <span>PIN: <strong className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">{pin}</strong></span>
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
                          onClick={() => {
                            setDispatchedIds((prev) => new Set([...prev, client.id]));
                          }}
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

        {/* =========================================================================
            TAB 3: CSV BULK IMPORT FOR 100+ CLIENTS & DEMO GENERATOR
           ========================================================================= */}
        {activeTab === "bulk" && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Bulk 100+ Client Onboarding Pipeline</h4>
                  <p className="text-slate-500 mt-0.5 text-xs">
                    Instantly import 100+ client entities with legal names, PAN, GSTIN, directors, and phones.
                    Profiles and Zero-DLT passwords are automatically created in 1 second.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleLoadDemoClients}
                    disabled={isImporting}
                    className="bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Load 5 Practice Demo Clients</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-btred-logo" />
                    <span>Download CSV Template</span>
                  </button>
                </div>
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
                    <p className="font-black text-indigo-700 text-sm">Ingesting Client Entities into Practice Registry...</p>
                    <p className="text-slate-500 text-[11px]">Generating deterministic passwords and linking promoter groups...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-9 h-9 text-indigo-500 group-hover:scale-110 transition mx-auto" />
                    <p className="font-black text-slate-900 text-sm group-hover:text-btred-logo transition">
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
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] space-y-1 text-slate-800">
                <span className="font-extrabold flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-btred-logo" />
                  What happens when you upload 100 clients?
                </span>
                <p className="text-slate-600 leading-relaxed">
                  1. Each company profile is registered with their legal PAN and promoter details.<br/>
                  2. A 4-digit PIN is generated: last 4 digits of the promoter mobile number.<br/>
                  3. You can immediately switch to the <strong className="text-indigo-900">1-Tap WhatsApp Desk</strong> tab to share login credentials individually or run the step-by-step broadcast queue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: ADD SINGLE CLIENT
           ========================================================================= */}
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Entity Constitution / Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
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
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email ID</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. accounts@acmetech.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-btred-logo"
                  />
                </div>
              </div>

              {/* Dynamic PIN & Onboarding Preview Chip */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] text-slate-600 font-medium">
                    Automated 4-Digit Access PIN:{" "}
                    <strong className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      {dynamicPinPreview}
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Login Link: <span className="font-mono">https://ca.naturexpress.in/?phone={rawCleanPhone.slice(-10)}</span>
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                3. Firm Assignment &amp; Financials
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Turnover (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={turnoverCr}
                    onChange={(e) => setTurnoverCr(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Article Assistant</label>
                  <select
                    value={assignedArticle}
                    onChange={(e) => setAssignedArticle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  >
                    <option value="Kriti Jain (Article)">Kriti Jain (CRO022998)</option>
                    <option value="Aman Verma (Article)">Aman Verma (CRO023101)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Managing Partner in Charge</label>
                  <select
                    value={assignedPartner}
                    onChange={(e) => setAssignedPartner(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                  >
                    <option value="CA Gunjan Jain">CA Gunjan Jain (Managing Partner)</option>
                    <option value="CA Rohit Sharma">CA Rohit Sharma (Partner)</option>
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
                className="bg-btred-logo hover:bg-red-700 text-white font-black px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isSubmittingForm ? "Saving..." : "Save Client & Generate Credentials"}
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            MODAL 1: 1-TAP BROADCAST TO ALL INTERACTIVE CONSOLE
           ========================================================================= */}
        {isBroadcastQueueOpen && clients.length > 0 && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95">
              <button
                onClick={() => setIsBroadcastQueueOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Broadcast Progress Header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Client {broadcastIndex + 1} of {clients.length} in Queue
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {dispatchedIds.size} / {clients.length} Dispatched
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${((broadcastIndex + 1) / clients.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Active Client in Queue */}
              {(() => {
                const current = clients[broadcastIndex];
                if (!current) return null;
                const phone = current.primaryContact?.phone || "";
                const phone10 = normalizePhone10(phone);
                const pin = phone10.length >= 4 ? phone10.slice(-4) : "0715";
                const waUrl = generateClientWhatsAppUrl(current);
                const messageText = getClientWhatsAppMessage(current);
                const isDispatched = dispatchedIds.has(current.id);

                return (
                  <div className="space-y-3.5">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{current.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                          <span>Signatory: <strong className="text-slate-800">{current.primaryContact?.name}</strong></span>
                          <span>&bull;</span>
                          <span>Mobile: <strong className="font-mono text-slate-800">{phone10}</strong></span>
                          <span>&bull;</span>
                          <span>PIN: <strong className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1 rounded">{pin}</strong></span>
                        </div>
                      </div>
                      {isDispatched ? (
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shrink-0">
                          <CheckCheck className="w-3 h-3 text-emerald-600" /> Sent
                        </span>
                      ) : (
                        <span className="bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* WhatsApp Message Preview Box */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px] block">
                        Prepared WhatsApp Broadcast Message:
                      </label>
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 text-[11px] font-sans text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                        {messageText}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (broadcastIndex > 0) setBroadcastIndex(broadcastIndex - 1);
                          }}
                          disabled={broadcastIndex === 0}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40"
                        >
                          &larr; Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (broadcastIndex < clients.length - 1) setBroadcastIndex(broadcastIndex + 1);
                          }}
                          disabled={broadcastIndex >= clients.length - 1}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40"
                        >
                          Skip &rarr;
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(current)}
                          className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </button>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            setDispatchedIds((prev) => new Set([...prev, current.id]));
                            if (broadcastIndex < clients.length - 1) {
                              setBroadcastIndex(broadcastIndex + 1);
                            } else {
                              toast.success("Broadcast Finished", "All clients in the queue reviewed!");
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Open WhatsApp &amp; Send</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 2: EDIT CLIENT DETAILS DRAWER/MODAL
           ========================================================================= */}
        {editingClient && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95">
              <button
                onClick={() => setEditingClient(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Client Entity</h3>
                  <p className="text-xs text-slate-500">Update PAN, GSTIN, Signatory and Contact numbers.</p>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company / Entity Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={editEntityName}
                    onChange={(e) => setEditEntityName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Permanent Account Number (PAN) *</label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={editPan}
                      onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GSTIN</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={editGstin}
                      onChange={(e) => setEditGstin(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Constitution</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo"
                    >
                      <option value="PVT_LTD">Private Limited</option>
                      <option value="LLP">LLP</option>
                      <option value="PARTNERSHIP">Partnership</option>
                      <option value="PROPRIETORSHIP">Proprietorship</option>
                      <option value="INDIVIDUAL_HNI">Individual / HNI</option>
                      <option value="TRUST_NGO">Trust / NGO</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Turnover (₹ Cr)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editTurnoverCr}
                      onChange={(e) => setEditTurnoverCr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Signatory / Director Name</label>
                    <input
                      type="text"
                      value={editContactName}
                      onChange={(e) => setEditContactName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp / Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-btred-logo"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingClient}
                    className="bg-btred-logo hover:bg-red-700 text-white font-black px-5 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {isUpdatingClient ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: DELETE CONFIRMATION
           ========================================================================= */}
        {deletingClientId && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3 relative text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Archive Client Entity?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will remove the client from active practice tracking. Historical invoices and audit papers remain intact in statutory archives.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setDeletingClientId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm"
                >
                  Yes, Archive Client
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
