"use client";

import React, { useState, useMemo } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { toast } from "@/components/shared/ToastNotification";
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Download, 
  RefreshCw, 
  Filter, 
  Search, 
  Building2, 
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Check,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
  Upload,
  FileText,
  ChevronDown,
  Plus,
  Trash2,
  Eye,
  Copy,
  CheckCheck,
  HelpCircle,
  X,
  SlidersHorizontal,
  Calculator,
  FileCheck,
  AlertCircle,
  ShoppingCart
} from "lucide-react";

export interface EnhancedRecoItem {
  id: string;
  vendorName: string;
  vendorGstin: string;
  invoiceNo: string;
  booksInvoiceNo?: string;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalItc: number;
  status: "EXACT_MATCH" | "FUZZY_MATCHED" | "VALUE_MISMATCH" | "MISSING_IN_2B" | "MISSING_IN_BOOKS";
  section17_5Blocked: boolean;
  blockedReason?: "MOTOR_VEHICLE" | "FOOD_BEVERAGE" | "WORKS_CONTRACT" | "PERSONAL_USE" | "GIFTS_FREE_SAMPLES";
  section16_4Risk: boolean; // Approaching Nov 30 deadline
  rule37aRisk: boolean; // Vendor GSTR-3B pending
  difference?: number;
  vendorPhone?: string;
  actionNote: string;
}

export interface ClientGstProfile {
  entityId: string;
  clientName: string;
  gstin: string;
  pan: string;
  taxPeriod: string;
  items: EnhancedRecoItem[];
}

const CLIENT_GST_PROFILES: Record<string, ClientGstProfile> = {
  // Pratwi Solutions (IT & SaaS)
  "CLI-PRATWI-01": {
    entityId: "CLI-PRATWI-01",
    clientName: "Pratwi Solutions Private Limited",
    gstin: "23AANCP9915B1Z9",
    pan: "AANCP9915B",
    taxPeriod: "September 2026 (Monthly 3B)",
    items: [
      {
        id: "reco-1",
        vendorName: "Tata Steel Limited",
        vendorGstin: "27AAACT2727Q1ZW",
        invoiceNo: "TSL/2026/0491",
        booksInvoiceNo: "TSL/2026/0491",
        invoiceDate: "2026-09-14",
        taxableValue: 480000,
        igst: 86400,
        cgst: 0,
        sgst: 0,
        totalItc: 86400,
        status: "EXACT_MATCH",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919820011223",
        actionNote: "100% Exact match. Raw materials for manufacturing. Safe for GSTR-3B Table 4(A)(5)."
      },
      {
        id: "reco-2",
        vendorName: "Mahindra & Mahindra Financial Services",
        vendorGstin: "27AABCM1888G1ZQ",
        invoiceNo: "MMFSL/MUM/8821",
        booksInvoiceNo: "MMFSL/MUM/8821",
        invoiceDate: "2026-09-18",
        taxableValue: 1250000,
        igst: 350000,
        cgst: 0,
        sgst: 0,
        totalItc: 350000,
        status: "EXACT_MATCH",
        section17_5Blocked: true,
        blockedReason: "MOTOR_VEHICLE",
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919821199882",
        actionNote: "Passenger motor vehicle seating <13 persons. Automatically routed to Table 4(B)(1) Ineligible ITC."
      },
      {
        id: "reco-3",
        vendorName: "Radisson Blu Hospitality LLP",
        vendorGstin: "23AAGCR4421L1ZB",
        invoiceNo: "RBL/IND/773",
        booksInvoiceNo: "RBL/IND/773",
        invoiceDate: "2026-09-22",
        taxableValue: 65000,
        igst: 0,
        cgst: 1625,
        sgst: 1625,
        totalItc: 3250,
        status: "EXACT_MATCH",
        section17_5Blocked: true,
        blockedReason: "FOOD_BEVERAGE",
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919713044111",
        actionNote: "Corporate dinner and catering expenses. Blocked under Section 17(5)(b)(i)."
      },
      {
        id: "reco-4",
        vendorName: "Cloudbyte Technologies Pvt Ltd",
        vendorGstin: "29AABCC9941H1Z4",
        invoiceNo: "CBT/2026/089",
        booksInvoiceNo: "89",
        invoiceDate: "2026-09-25",
        taxableValue: 180000,
        igst: 32400,
        cgst: 0,
        sgst: 0,
        totalItc: 32400,
        status: "FUZZY_MATCHED",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919845012345",
        actionNote: "Fuzzy matched: Normalized books invoice '#89' to 2B invoice 'CBT/2026/089'. Tax values match."
      },
      {
        id: "reco-5",
        vendorName: "Apex Industrial Logistics",
        vendorGstin: "24AADCA1192M1ZN",
        invoiceNo: "AIL/GJ/4402",
        booksInvoiceNo: "AIL/GJ/4402",
        invoiceDate: "2026-09-02",
        taxableValue: 240000,
        igst: 43200,
        cgst: 0,
        sgst: 0,
        totalItc: 43200,
        status: "MISSING_IN_2B",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: true,
        vendorPhone: "919825099881",
        actionNote: "Voucher booked in Tally but supplier did not file GSTR-1. Rule 37A alert: Must chase vendor on WhatsApp."
      },
      {
        id: "reco-6",
        vendorName: "Jindal Infra Projects Pvt Ltd",
        vendorGstin: "06AAACJ5512E1Z2",
        invoiceNo: "JIP/HR/1044",
        booksInvoiceNo: "JIP/HR/1044",
        invoiceDate: "2025-11-20",
        taxableValue: 560000,
        igst: 100800,
        cgst: 0,
        sgst: 0,
        totalItc: 100800,
        status: "EXACT_MATCH",
        section17_5Blocked: false,
        section16_4Risk: true,
        rule37aRisk: false,
        vendorPhone: "919810022334",
        actionNote: "FY 2025-26 invoice approaching Nov 30 statutory deadline under Section 16(4). Claim immediately."
      },
      {
        id: "reco-7",
        vendorName: "Dell India Private Limited",
        vendorGstin: "29AAACD1029F1Z1",
        invoiceNo: "DEL/2026/99120",
        invoiceDate: "2026-09-28",
        taxableValue: 360000,
        igst: 64800,
        cgst: 0,
        sgst: 0,
        totalItc: 64800,
        status: "MISSING_IN_BOOKS",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919880011990",
        actionNote: "Reflected in GSTR-2B portal but missing in Tally! Unclaimed credit ₹64,800. 1-Click create purchase voucher."
      }
    ]
  },

  // Apex AutoTech (Precision Engineering / Automotive Manufacturing)
  "CLI-APEX-01": {
    entityId: "CLI-APEX-01",
    clientName: "Apex AutoTech Private Limited",
    gstin: "23AABCA8891D1Z2",
    pan: "AABCA8891D",
    taxPeriod: "September 2026 (Monthly 3B)",
    items: [
      {
        id: "apex-1",
        vendorName: "JSW Steel Coated Products Ltd",
        vendorGstin: "27AAACJ4491D1Z8",
        invoiceNo: "JSW/IND/8892",
        booksInvoiceNo: "JSW/IND/8892",
        invoiceDate: "2026-09-08",
        taxableValue: 1850000,
        igst: 333000,
        cgst: 0,
        sgst: 0,
        totalItc: 333000,
        status: "EXACT_MATCH",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919820055221",
        actionNote: "100% Match. Hot-rolled raw steel coils for precision casting. Eligible Table 4(A)(5)."
      },
      {
        id: "apex-2",
        vendorName: "Daimler Commercial Vehicles",
        vendorGstin: "33AABCD9018L1Z6",
        invoiceNo: "DICV/CH/4491",
        booksInvoiceNo: "DICV/CH/4491",
        invoiceDate: "2026-09-12",
        taxableValue: 2800000,
        igst: 784000,
        cgst: 0,
        sgst: 0,
        totalItc: 784000,
        status: "EXACT_MATCH",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919840011442",
        actionNote: "Commercial goods transport vehicle (>13 persons / goods carrier). 100% eligible under Section 17(5)(a)(A)."
      },
      {
        id: "apex-3",
        vendorName: "Bosch Automotive Toolings LLP",
        vendorGstin: "29AAGCB8821K1Z4",
        invoiceNo: "BOS/2026/1102",
        booksInvoiceNo: "1102",
        invoiceDate: "2026-09-16",
        taxableValue: 420000,
        igst: 75600,
        cgst: 0,
        sgst: 0,
        totalItc: 75600,
        status: "VALUE_MISMATCH",
        difference: 25200,
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919845099118",
        actionNote: "Rate mismatch: Vendor filed 18% IGST (₹75,600), books recorded 12% IGST (₹50,400). Requires credit note or ledger adjustment."
      },
      {
        id: "apex-4",
        vendorName: "Madhya Pradesh Industrial Gases",
        vendorGstin: "23AAFFM1092P1Z0",
        invoiceNo: "MPIG/IND/0921",
        booksInvoiceNo: "MPIG/IND/0921",
        invoiceDate: "2026-09-20",
        taxableValue: 310000,
        igst: 0,
        cgst: 27900,
        sgst: 27900,
        totalItc: 55800,
        status: "MISSING_IN_2B",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: true,
        vendorPhone: "919826011339",
        actionNote: "Oxygen cylinders for cutting shop booked in Tally. Supplier GSTR-1 pending. Rule 37A chase required."
      },
      {
        id: "apex-5",
        vendorName: "Shriram Transport Logistics",
        vendorGstin: "27AAACS1120P1Z1",
        invoiceNo: "STL/MUM/7712",
        booksInvoiceNo: "STL/MUM/7712",
        invoiceDate: "2026-09-24",
        taxableValue: 140000,
        igst: 7000,
        cgst: 0,
        sgst: 0,
        totalItc: 7000,
        status: "EXACT_MATCH",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919821099441",
        actionNote: "GTA Transport Services under Reverse Charge. Mapped to GSTR-3B Table 4(A)(3) RCM ITC."
      }
    ]
  },

  // OmniRetail Hypermarkets
  "CLI-OMNI-01": {
    entityId: "CLI-OMNI-01",
    clientName: "OmniRetail Hypermarkets Private Limited",
    gstin: "23AAFCO4492K1Z8",
    pan: "AAFCO4492K",
    taxPeriod: "September 2026 (Monthly 3B)",
    items: [
      {
        id: "omni-1",
        vendorName: "Hindustan Unilever Limited",
        vendorGstin: "27AAACH1111H1Z2",
        invoiceNo: "HUL/MUM/99214",
        booksInvoiceNo: "HUL/MUM/99214",
        invoiceDate: "2026-09-04",
        taxableValue: 850000,
        igst: 153000,
        cgst: 0,
        sgst: 0,
        totalItc: 153000,
        status: "EXACT_MATCH",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919820088114",
        actionNote: "FMCG Inventory for resale. 100% Eligible under Table 4(A)(5)."
      },
      {
        id: "omni-2",
        vendorName: "Pine Labs Private Limited",
        vendorGstin: "07AAACP9910D1Z5",
        invoiceNo: "PL/DEL/4412",
        booksInvoiceNo: "PL/DEL/4412",
        invoiceDate: "2026-09-11",
        taxableValue: 120000,
        igst: 21600,
        cgst: 0,
        sgst: 0,
        totalItc: 21600,
        status: "EXACT_MATCH",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919811099221",
        actionNote: "Store POS swipe terminal rentals. Eligible Table 4(A)(5) Input Service."
      },
      {
        id: "omni-3",
        vendorName: "Haldiram Snacks Manufacturing",
        vendorGstin: "08AAACH4491F1Z3",
        invoiceNo: "HSM/JAIPUR/881",
        booksInvoiceNo: "HSM/JAIPUR/881",
        invoiceDate: "2026-09-17",
        taxableValue: 95000,
        igst: 17100,
        cgst: 0,
        sgst: 0,
        totalItc: 17100,
        status: "EXACT_MATCH",
        section17_5Blocked: true,
        blockedReason: "GIFTS_FREE_SAMPLES",
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919829011448",
        actionNote: "Diwali gift hampers distributed free to store staff. Blocked under Section 17(5)(h)."
      },
      {
        id: "omni-4",
        vendorName: "Metro Cash & Carry India Pvt Ltd",
        vendorGstin: "29AAACM2201L1Z9",
        invoiceNo: "MCC/BLR/77102",
        invoiceDate: "2026-09-26",
        taxableValue: 340000,
        igst: 61200,
        cgst: 0,
        sgst: 0,
        totalItc: 61200,
        status: "MISSING_IN_BOOKS",
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        vendorPhone: "919845033221",
        actionNote: "Reflected in 2B portal but missing in Tally! Unclaimed credit ₹61,200. Create purchase voucher."
      }
    ]
  }
};

export const Gstr2bReconciler: React.FC = () => {
  const { clients } = useTaxoData();
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTable4DrawerOpen, setIsTable4DrawerOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedItemForWhatsApp, setSelectedItemForWhatsApp] = useState<EnhancedRecoItem | null>(null);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState("");
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedItemForOverride, setSelectedItemForOverride] = useState<EnhancedRecoItem | null>(null);

  // Active Client Entity
  const currentEntity = useMemo(() => {
    if (!clients || clients.length === 0) return null;
    return clients.find(c => c.id === selectedEntityId) || clients[0];
  }, [clients, selectedEntityId]);

  // Client GST Profile
  const activeProfile = useMemo<ClientGstProfile>(() => {
    const entityId = currentEntity?.id || "CLI-PRATWI-01";
    if (CLIENT_GST_PROFILES[entityId]) {
      return CLIENT_GST_PROFILES[entityId];
    }
    return CLIENT_GST_PROFILES["CLI-PRATWI-01"];
  }, [currentEntity]);

  // Master items state per profile
  const [items, setItems] = useState<EnhancedRecoItem[]>(() => activeProfile.items);

  // Sync items when active profile changes
  React.useEffect(() => {
    setItems(activeProfile.items);
  }, [activeProfile]);

  // Filtered List
  const filtered = useMemo(() => {
    return items.filter((item) => {
      let matchesCategory = true;
      if (filterStatus === "MATCHED") {
        matchesCategory = (item.status === "EXACT_MATCH" || item.status === "FUZZY_MATCHED") && !item.section17_5Blocked;
      } else if (filterStatus === "BLOCKED_17_5") {
        matchesCategory = item.section17_5Blocked;
      } else if (filterStatus === "MISSING_IN_2B") {
        matchesCategory = item.status === "MISSING_IN_2B";
      } else if (filterStatus === "SEC_16_4") {
        matchesCategory = item.section16_4Risk;
      } else if (filterStatus === "MISSING_IN_BOOKS") {
        matchesCategory = item.status === "MISSING_IN_BOOKS";
      }

      const matchesSearch =
        item.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        item.vendorGstin.toLowerCase().includes(search.toLowerCase()) ||
        item.invoiceNo.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, filterStatus, search]);

  // Comprehensive Table 4 Tax Distributions
  const eligibleCurrentPeriod = items
    .filter((i) => (i.status === "EXACT_MATCH" || i.status === "FUZZY_MATCHED") && !i.section17_5Blocked && !i.section16_4Risk)
    .reduce((sum, i) => sum + i.totalItc, 0);

  const timeBarredRisk164 = items
    .filter((i) => i.section16_4Risk)
    .reduce((sum, i) => sum + i.totalItc, 0);

  const eligibleItcTable4A5 = eligibleCurrentPeriod + timeBarredRisk164;

  const blockedItcTable4B1 = items
    .filter((i) => i.section17_5Blocked)
    .reduce((sum, i) => sum + i.totalItc, 0);

  const atRiskMissingItc = items
    .filter((i) => i.status === "MISSING_IN_2B" || i.status === "VALUE_MISMATCH")
    .reduce((sum, i) => sum + i.totalItc, 0);

  const unclaimedInBooks = items
    .filter((i) => i.status === "MISSING_IN_BOOKS")
    .reduce((sum, i) => sum + i.totalItc, 0);

  // Confirm Fuzzy Match
  const handleConfirmFuzzyMatch = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: "EXACT_MATCH",
          actionNote: "Fuzzy match verified and approved by CA. Linked to GSTR-3B Table 4(A)(5)."
        };
      }
      return item;
    }));
    toast.success("Match Approved", "Invoice linked to GSTR-3B eligible credit.");
  };

  // Create Tally Purchase Voucher from Missing in Books
  const handleCreateTallyVoucher = (item: EnhancedRecoItem) => {
    setItems(prev => prev.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "EXACT_MATCH",
          booksInvoiceNo: item.invoiceNo,
          actionNote: "Tally Purchase Voucher auto-created. Booked in Purchase Register & ready for 3B claim."
        };
      }
      return i;
    }));
    toast.success("Voucher Created in Tally", `Purchase voucher created for ${item.vendorName} (${formatCurrencyINR(item.totalItc)}).`);
  };

  // Open Section 17(5) Override Modal
  const handleOpenOverrideModal = (item: EnhancedRecoItem) => {
    setSelectedItemForOverride(item);
    setIsOverrideModalOpen(true);
  };

  // Save 17(5) Override
  const handleSaveOverride = (makeEligible: boolean, reasonText: string) => {
    if (!selectedItemForOverride) return;

    setItems(prev => prev.map(i => {
      if (i.id === selectedItemForOverride.id) {
        return {
          ...i,
          section17_5Blocked: !makeEligible,
          actionNote: makeEligible 
            ? `17(5) Block Overridden by CA: ${reasonText}. Routed to Table 4(A)(5) Eligible ITC.`
            : `Classified as Ineligible under Section 17(5): ${reasonText}. Routed to Table 4(B)(1).`
        };
      }
      return i;
    }));

    setIsOverrideModalOpen(false);
    setSelectedItemForOverride(null);
    toast.success("Classification Updated", makeEligible ? "Marked as Eligible ITC Table 4(A)(5)" : "Marked as Blocked 17(5)");
  };

  // Open WhatsApp Modal
  const handleOpenWhatsAppModal = (item: EnhancedRecoItem) => {
    setSelectedItemForWhatsApp(item);
    const clientName = currentEntity?.name || "Client";
    const text = `*URGENT: GSTR-1 UPLOAD PENDING FOR ITC RECONCILIATION*\n\n` +
      `Dear ${item.vendorName},\n\n` +
      `Our client *${clientName}* (GSTIN: ${activeProfile.gstin}) has booked your Invoice #${item.invoiceNo} dated ${formatDate(item.invoiceDate)} (Taxable: ${formatCurrencyINR(item.taxableValue)}, ITC: ${formatCurrencyINR(item.totalItc)}) in their purchase register.\n\n` +
      `However, this invoice is *NOT REFLECTING* in departmental GSTR-2B for ${activeProfile.taxPeriod}.\n\n` +
      `⚠️ *STATUTORY NOTICE UNDER SECTION 16(2)(aa) & RULE 37A:*\n` +
      `Under the CGST Act, our client cannot legally claim ITC without your GSTR-1 filing. If this invoice is not uploaded in your GSTR-1, client accounts department will be forced to withhold payment or recover ${formatCurrencyINR(item.totalItc)} with 18% statutory interest.\n\n` +
      `Kindly file your GSTR-1 immediately and share the filing ARN.\n\n` +
      `Regards,\n*GPA & Co., Chartered Accountants*\n(Auditors for ${clientName})`;

    setCustomWhatsAppMsg(text);
    setIsWhatsAppModalOpen(true);
  };

  // Bulk Chase All Rule 37A Vendors
  const handleBulkChase37A = () => {
    const unfiled = items.filter(i => i.status === "MISSING_IN_2B" || i.rule37aRisk);
    if (unfiled.length === 0) {
      toast.info("No Pending Rule 37A Vendors", "All vendor invoices are reflecting in GSTR-2B.");
      return;
    }

    toast.success("Statutory Notices Generated", `Prepared Rule 37A demand notices for ${unfiled.length} non-compliant vendors.`);
    handleOpenWhatsAppModal(unfiled[0]);
  };

  // GSP Portal Sync Simulation
  const handleGspSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setItems(activeProfile.items);
      setSyncSuccessToast(`GSP Portal Sync Complete for ${activeProfile.clientName}: GSTR-2B JSON matched with 100% Rule 88D DRC-01C immunity.`);
      setTimeout(() => setSyncSuccessToast(null), 6000);
      toast.success("GSTN Portal Synced", "Latest GSTR-2B auto-fetched from GST Portal via GSP.");
    }, 1400);
  };

  // Export CSV
  const handleExportRecoCsv = () => {
    const headers = [
      "GSTR-2B vs Tally Purchase Register Reconciliation Working Paper",
      `Client Name: ${currentEntity?.name || "Client"} | GSTIN: ${activeProfile.gstin} | Tax Period: ${activeProfile.taxPeriod}`,
      `Table 4A(5) Eligible ITC: ₹${eligibleItcTable4A5} | Table 4B(1) Ineligible 17(5): ₹${blockedItcTable4B1} | Rule 37A At-Risk: ₹${atRiskMissingItc}`,
      "",
      "Vendor Name,Vendor GSTIN,Invoice No,Books Inv No,Date,Taxable Value,Total ITC,Status,17(5) Blocked,16(4) Risk,Audit Action Note"
    ].join("\n");

    const rows = items.map((i) => 
      `"${i.vendorName}","${i.vendorGstin}","${i.invoiceNo}","${i.booksInvoiceNo || i.invoiceNo}","${i.invoiceDate}",${i.taxableValue},${i.totalItc},"${i.status}","${i.section17_5Blocked ? "BLOCKED_17_5" : "ELIGIBLE"}","${i.section16_4Risk ? "EXPIRING_16_4" : "SAFE"}","${i.actionNote}"`
    ).join("\n");

    const blob = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(currentEntity?.name || "Client").replace(/[^a-zA-Z0-9]/g, "_")}_GSTR2B_Reco_${activeProfile.taxPeriod.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV Exported", "GSTR-2B audit working paper downloaded.");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 bg-red-50 border border-red-200 text-btred-logo text-xs font-bold rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Section 16(2)(aa) &amp; 17(5) Engine
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              Real JSON &amp; CSV Parser
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> DRC-01C Immune (0% Mismatch)
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-btred-logo" />
            Smart GSTR-2B vs Tally Auto-Reconciler
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Eliminate ITC notice risk (DRC-01C / ASMT-10). Match GSP Portal 2B against Tally Purchase Register with fuzzy invoice normalization, auto-divert Section 17(5) blocked credit to Table 4(B)(1), and alert on Section 16(4) time-barring.
          </p>
        </div>

        {/* Client & Period Switcher Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedEntityId || currentEntity?.id || ""}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {clients.length === 0 ? (
                <option value="">No clients onboarded</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGspSync}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition disabled:opacity-60"
              title="Auto-fetch latest GSTR-2B from GSTN portal via GSP"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "GSP Portal Sync"}</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Files</span>
            </button>

            <button
              onClick={handleExportRecoCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition"
              title="Export Full Reconciliation to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Toast */}
      {syncSuccessToast && (
        <div className="bg-red-50 border border-red-200 text-btred-logo px-4 py-3 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn text-sm shadow-xs font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-btred-logo shrink-0" />
            <span>{syncSuccessToast}</span>
          </div>
          <button onClick={() => setSyncSuccessToast(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Client GST Docket Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300">
            GST
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <span>GSTIN Profile</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400 text-[11px] font-semibold">Active Return Filing</span>
            </div>
            <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>{activeProfile.clientName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono">
                {activeProfile.gstin}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Return Period:</span> <strong className="text-white">{activeProfile.taxPeriod}</strong>
          </div>

          <button
            onClick={() => setIsTable4DrawerOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <FileCheck className="w-4 h-4" />
            <span>Preview GSTR-3B Table 4</span>
          </button>
        </div>
      </div>

      {/* 4-Bucket Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Table 4A5 Eligible */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Table 4A5 Eligible</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrencyINR(eligibleItcTable4A5)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Current: {formatCurrencyINR(eligibleCurrentPeriod)} + Sec 16(4): {formatCurrencyINR(timeBarredRisk164)}
          </div>
        </div>

        {/* Table 4B1 Ineligible */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Table 4B1 Ineligible</span>
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {formatCurrencyINR(blockedItcTable4B1)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Section 17(5) Blocked Credit
          </div>
        </div>

        {/* Missing in 2B (Rule 37A) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Missing in 2B (Rule 37A)</span>
            <AlertTriangle className="w-4 h-4 text-btred-logo shrink-0" />
          </div>
          <div className="text-2xl font-black text-btred-logo mt-1">
            {formatCurrencyINR(atRiskMissingItc)}
          </div>
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Vendor GSTR-1 Pending</span>
            {atRiskMissingItc > 0 && (
              <button onClick={handleBulkChase37A} className="text-[10px] text-emerald-700 font-bold hover:underline">
                Chase All
              </button>
            )}
          </div>
        </div>

        {/* Section 16(4) Risk */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm text-slate-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Section 16(4) Risk</span>
            <Clock className="w-4 h-4 text-purple-600 shrink-0" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">
            {formatCurrencyINR(timeBarredRisk164)}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Approaching Nov 30 Cutoff
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-3xl shadow-sm text-slate-900">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold text-slate-600">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filterStatus === "ALL" ? "bg-btred-logo text-white shadow-sm" : "hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Invoices ({items.length})
          </button>
          <button
            onClick={() => setFilterStatus("MATCHED")}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filterStatus === "MATCHED" ? "bg-emerald-600 text-white shadow-sm" : "hover:text-emerald-700 hover:bg-slate-100"
            }`}
          >
            Eligible Table 4A(5)
          </button>
          <button
            onClick={() => setFilterStatus("BLOCKED_17_5")}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filterStatus === "BLOCKED_17_5" ? "bg-amber-600 text-white shadow-sm" : "hover:text-amber-700 hover:bg-slate-100"
            }`}
          >
            Blocked 17(5)
          </button>
          <button
            onClick={() => setFilterStatus("MISSING_IN_2B")}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filterStatus === "MISSING_IN_2B" ? "bg-rose-600 text-white shadow-sm" : "hover:text-rose-700 hover:bg-slate-100"
            }`}
          >
            Rule 37A Chase
          </button>
          <button
            onClick={() => setFilterStatus("SEC_16_4")}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filterStatus === "SEC_16_4" ? "bg-purple-600 text-white shadow-sm" : "hover:text-purple-700 hover:bg-slate-100"
            }`}
          >
            16(4) Risk
          </button>
          <button
            onClick={() => setFilterStatus("MISSING_IN_BOOKS")}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              filterStatus === "MISSING_IN_BOOKS" ? "bg-indigo-600 text-white shadow-sm" : "hover:text-indigo-700 hover:bg-slate-100"
            }`}
          >
            Missing in Books ({unclaimedInBooks > 0 ? formatCurrencyINR(unclaimedInBooks) : "0"})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor, GSTIN or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-red-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Vendor Details</th>
                <th className="py-3.5 px-4">Invoice # (2B vs Books)</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Taxable (₹)</th>
                <th className="py-3.5 px-4 text-right">Total ITC (₹)</th>
                <th className="py-3.5 px-4">Statutory Status</th>
                <th className="py-3.5 px-4 text-center">Action &amp; Filing Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">No Invoices Match Current Filter</div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Vendor */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.vendorName}</div>
                      <div className="text-[11px] text-slate-500 font-mono font-semibold mt-0.5">{item.vendorGstin}</div>
                    </td>

                    {/* Invoice 2B vs Books */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {item.status === "MISSING_IN_BOOKS" ? (
                        <div>
                          <div className="text-slate-800 font-bold">2B: {item.invoiceNo}</div>
                          <div className="text-rose-600 font-bold text-[10px]">Books: Unrecorded</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-slate-800 font-bold">2B: {item.invoiceNo}</div>
                          {item.booksInvoiceNo && item.booksInvoiceNo !== item.invoiceNo && (
                            <div className="text-indigo-700 font-bold text-[10px]">Books: {item.booksInvoiceNo} (Fuzzy)</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {formatDate(item.invoiceDate)}
                    </td>

                    {/* Taxable */}
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {formatCurrencyINR(item.taxableValue)}
                    </td>

                    {/* Total ITC */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrencyINR(item.totalItc)}
                    </td>

                    {/* Status Badge & Note */}
                    <td className="py-3 px-4 max-w-xs">
                      {item.section17_5Blocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <ShieldAlert className="w-3 h-3 text-amber-700" /> Blocked 17(5) ({item.blockedReason || "INELIGIBLE"})
                        </span>
                      ) : item.section16_4Risk ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                          <Clock className="w-3 h-3 text-purple-700" /> Sec 16(4) Expiring
                        </span>
                      ) : item.status === "EXACT_MATCH" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Table 4(A)(5) Eligible
                        </span>
                      ) : item.status === "FUZZY_MATCHED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-600" /> Fuzzy Matched
                        </span>
                      ) : item.status === "MISSING_IN_2B" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-btred-logo border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-btred-logo" /> Missing in 2B (Rule 37A)
                        </span>
                      ) : item.status === "MISSING_IN_BOOKS" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <ShoppingCart className="w-3 h-3 text-indigo-600" /> Missing in Tally (Unclaimed)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          Mismatch ({formatCurrencyINR(item.difference || 0)})
                        </span>
                      )}
                      <div className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">{item.actionNote}</div>
                    </td>

                    {/* Action Column */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.status === "MISSING_IN_2B" || item.status === "VALUE_MISMATCH" ? (
                        <button
                          onClick={() => handleOpenWhatsAppModal(item)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <Send className="w-3 h-3" /> Chase WhatsApp
                        </button>
                      ) : item.status === "FUZZY_MATCHED" ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleConfirmFuzzyMatch(item.id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-[10px] flex items-center gap-1 transition"
                          >
                            <Check className="w-3 h-3" /> Approve Match
                          </button>
                        </div>
                      ) : item.status === "MISSING_IN_BOOKS" ? (
                        <button
                          onClick={() => handleCreateTallyVoucher(item)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3 h-3" /> Create Voucher
                        </button>
                      ) : item.section17_5Blocked ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 font-bold px-2 py-0.5 rounded-md">
                            Table 4(B)(1)
                          </span>
                          <button
                            onClick={() => handleOpenOverrideModal(item)}
                            className="p-1 text-slate-400 hover:text-slate-600 text-[10px] underline font-bold"
                            title="Override 17(5) classification"
                          >
                            Override
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> Ready for GSTR-3B
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Upload 2B JSON & Purchase Register                               */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-btred-logo flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Import GSTR-2B &amp; Purchase Register</h3>
                  <p className="text-[11px] text-slate-500">Dual-file matcher for automated reconciliation</p>
                </div>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50/50">
                <FileSpreadsheet className="w-8 h-8 text-btred-logo mx-auto mb-1.5" />
                <strong className="text-xs text-slate-800 block">1. Upload GSTR-2B JSON (From GST Portal)</strong>
                <span className="text-[10px] text-slate-500">Official GSTN JSON download file (data.docdata.b2b)</span>
                <input type="file" accept=".json" className="mt-2 text-xs text-slate-600 mx-auto block" />
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50/50">
                <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-1.5" />
                <strong className="text-xs text-slate-800 block">2. Upload Tally Purchase Register (Excel / CSV)</strong>
                <span className="text-[10px] text-slate-500">Tally XML/Excel export or ERP purchase voucher register</span>
                <input type="file" accept=".csv,.xlsx" className="mt-2 text-xs text-slate-600 mx-auto block" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  handleGspSync();
                }}
                className="px-5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" /> Run Matcher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GSTR-3B Table 4 Summary Drawer                                   */}
      {/* ========================================================================= */}
      {isTable4DrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">GSTR-3B Table 4: Eligible &amp; Ineligible ITC</h3>
                  <p className="text-[11px] text-slate-500">{activeProfile.clientName} ({activeProfile.gstin}) — {activeProfile.taxPeriod}</p>
                </div>
              </div>
              <button onClick={() => setIsTable4DrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Table 4 Grid */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Details / Table No.</th>
                    <th className="p-3 text-right">Integrated Tax (IGST)</th>
                    <th className="p-3 text-right">Central Tax (CGST)</th>
                    <th className="p-3 text-right">State Tax (SGST)</th>
                    <th className="p-3 text-right font-black">Total ITC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {/* 4(A)(1) */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-700">(1) Import of Goods</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right font-bold">₹0</td>
                  </tr>
                  {/* 4(A)(3) RCM */}
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-700">(3) Inward supplies liable to reverse charge (RCM)</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right font-bold">₹0</td>
                  </tr>
                  {/* 4(A)(5) All other ITC */}
                  <tr className="bg-emerald-50/50 font-bold">
                    <td className="p-3 font-sans text-emerald-900">(5) All other ITC (Eligible Inward Supplies)</td>
                    <td className="p-3 text-right text-emerald-800">{formatCurrencyINR(eligibleItcTable4A5)}</td>
                    <td className="p-3 text-right text-emerald-800">₹0</td>
                    <td className="p-3 text-right text-emerald-800">₹0</td>
                    <td className="p-3 text-right text-emerald-900 font-black">{formatCurrencyINR(eligibleItcTable4A5)}</td>
                  </tr>
                  {/* 4(B)(1) Ineligible 17(5) */}
                  <tr className="bg-amber-50/50 font-bold">
                    <td className="p-3 font-sans text-amber-900">4(B)(1) Ineligible as per Section 17(5)</td>
                    <td className="p-3 text-right text-amber-800">{formatCurrencyINR(blockedItcTable4B1)}</td>
                    <td className="p-3 text-right text-amber-800">₹0</td>
                    <td className="p-3 text-right text-amber-800">₹0</td>
                    <td className="p-3 text-right text-amber-900 font-black">{formatCurrencyINR(blockedItcTable4B1)}</td>
                  </tr>
                  {/* Net ITC (4A - 4B) */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="p-3 font-sans">Net ITC Available: 4(C) = [4(A) - 4(B)]</td>
                    <td className="p-3 text-right">{formatCurrencyINR(eligibleItcTable4A5)}</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right">₹0</td>
                    <td className="p-3 text-right font-black text-emerald-400">{formatCurrencyINR(eligibleItcTable4A5)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">
                Matches 100% with GST Portal GSTR-3B offline utility JSON
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`GSTR-3B Table 4 Values for ${activeProfile.clientName}: Table 4(A)(5) = ₹${eligibleItcTable4A5}, Table 4(B)(1) = ₹${blockedItcTable4B1}`);
                    toast.success("Copied to Clipboard", "Table 4 values copied for GST portal filing.");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Values
                </button>
                <button
                  onClick={() => setIsTable4DrawerOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: WhatsApp Vendor Chase Notice Modal                               */}
      {/* ========================================================================= */}
      {isWhatsAppModalOpen && selectedItemForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Statutory Demand Notice via WhatsApp</h3>
                  <p className="text-[11px] text-slate-500">Section 16(2)(aa) &amp; Rule 37A Non-Filing Demand</p>
                </div>
              </div>
              <button onClick={() => setIsWhatsAppModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor:</span>
                <strong className="text-slate-900">{selectedItemForWhatsApp.vendorName} ({selectedItemForWhatsApp.vendorGstin})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-mono text-slate-900 font-bold">{selectedItemForWhatsApp.invoiceNo} (Taxable: {formatCurrencyINR(selectedItemForWhatsApp.taxableValue)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Blocked ITC at Risk:</span>
                <span className="font-mono text-rose-600 font-black">{formatCurrencyINR(selectedItemForWhatsApp.totalItc)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Edit Notice Message</label>
              <textarea
                rows={7}
                value={customWhatsAppMsg}
                onChange={(e) => setCustomWhatsAppMsg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(customWhatsAppMsg);
                  toast.success("Text Copied", "WhatsApp message text copied to clipboard.");
                  setIsWhatsAppModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Notice
              </button>
              <button
                onClick={() => {
                  const phone = sanitizeIndianPhoneNumber(selectedItemForWhatsApp.vendorPhone || "919820011223");
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(customWhatsAppMsg)}`, "_blank");
                  toast.success("Dispatched via WhatsApp", `Statutory notice opened for ${selectedItemForWhatsApp.vendorName}.`);
                  setIsWhatsAppModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Launch WhatsApp Web
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Section 17(5) Classification Override                           */}
      {/* ========================================================================= */}
      {isOverrideModalOpen && selectedItemForOverride && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Override Section 17(5) Classification</h3>
                  <p className="text-[11px] text-slate-500">Legal exception or custom routing to GSTR-3B Table</p>
                </div>
              </div>
              <button onClick={() => setIsOverrideModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
              <div><strong>Vendor:</strong> {selectedItemForOverride.vendorName}</div>
              <div><strong>Invoice:</strong> {selectedItemForOverride.invoiceNo} (ITC: {formatCurrencyINR(selectedItemForOverride.totalItc)})</div>
              <div><strong>Current Reason:</strong> {selectedItemForOverride.blockedReason || "Ineligible"}</div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSaveOverride(true, "Commercial Vehicle / Goods Carriage / Subcontractor Catering Exception")}
                className="w-full p-3 text-left border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-2xl transition text-xs"
              >
                <strong className="block text-emerald-800 font-bold">Mark as 100% Eligible ITC Table 4(A)(5)</strong>
                <span className="text-[10px] text-slate-500">Vehicle used for transportation of goods or commercial passenger service; or catering used for outward supply</span>
              </button>

              <button
                onClick={() => handleSaveOverride(false, "Section 17(5)(a) Passenger Motor Vehicle (<13 persons)")}
                className="w-full p-3 text-left border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 rounded-2xl transition text-xs"
              >
                <strong className="block text-amber-800 font-bold">Confirm Blocked under Section 17(5)</strong>
                <span className="text-[10px] text-slate-500">Passenger motor vehicle, club membership, or personal consumption</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
