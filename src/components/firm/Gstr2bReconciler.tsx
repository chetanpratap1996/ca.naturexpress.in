"use client";

import React, { useState, useMemo } from "react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { toast } from "@/components/shared/ToastNotification";
import { SANDBOX_CLIENTS } from "@/lib/data/sandboxData";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import { RecoMatcher, Gstr2bInvoice, BooksPurchaseInvoice, ReconciledRecord, RecoMatchStatus } from "@/lib/gst/recoMatcher";
import { parseOfficialGstr2bJson, parsePurchaseRegisterCsv } from "@/lib/parsers/gstr2bParser";
import { ItcClassifier } from "@/lib/gst/itcClassifier";
import { Rule42And43Engine, Rule42CalculationResult, Rule43MonthlyResult, Rule42AnnualTrueUpResult } from "@/lib/gst/rule42And43Engine";
import { VendorRiskEngine, VendorComplianceProfile } from "@/lib/gst/vendorRiskEngine";
import { VendorNoticeGenerator, GeneratedNotice } from "@/lib/gst/vendorNoticeGenerator";

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
  Mail,
  Scale,
  Zap,
  Info,
  Layers,
  ArrowUpRight
} from "lucide-react";

// Initial Seed Data for Pratwi Solutions
const INITIAL_2B_PRATWI: Gstr2bInvoice[] = [
  {
    id: "2b-1",
    vendorGstin: "27AAACT2727Q1ZW",
    vendorTradeName: "Tata Steel Limited",
    invoiceNumber: "TSL/2026/0491",
    invoiceDate: "2026-09-14",
    invoiceType: "R",
    placeOfSupply: "27-Maharashtra",
    reverseCharge: false,
    taxableValue: 480000,
    igst: 86400,
    cgst: 0,
    sgst: 0,
    totalTax: 86400,
    totalInvoiceValue: 566400,
    gstr1FilingDate: "2026-10-10",
    gstr1Period: "092026",
    gstr3bFilingStatus: "FILED",
    itcAvailable: true
  },
  {
    id: "2b-2",
    vendorGstin: "27AABCM1888G1ZQ",
    vendorTradeName: "Mahindra & Mahindra Financial Services",
    invoiceNumber: "MMFSL/MUM/8821",
    invoiceDate: "2026-09-18",
    invoiceType: "R",
    placeOfSupply: "27-Maharashtra",
    reverseCharge: false,
    taxableValue: 1250000,
    igst: 350000,
    cgst: 0,
    sgst: 0,
    totalTax: 350000,
    totalInvoiceValue: 1600000,
    gstr1FilingDate: "2026-10-09",
    gstr1Period: "092026",
    gstr3bFilingStatus: "FILED",
    itcAvailable: true
  },
  {
    id: "2b-3",
    vendorGstin: "23AAGCR4421L1ZB",
    vendorTradeName: "Radisson Blu Hospitality LLP",
    invoiceNumber: "RBL/IND/773",
    invoiceDate: "2026-09-22",
    invoiceType: "R",
    placeOfSupply: "23-Madhya Pradesh",
    reverseCharge: false,
    taxableValue: 65000,
    igst: 0,
    cgst: 1625,
    sgst: 1625,
    totalTax: 3250,
    totalInvoiceValue: 68250,
    gstr1FilingDate: "2026-10-11",
    gstr1Period: "092026",
    gstr3bFilingStatus: "FILED",
    itcAvailable: true
  },
  {
    id: "2b-4",
    vendorGstin: "29AABCC9941H1Z4",
    vendorTradeName: "Cloudbyte Technologies Pvt Ltd",
    invoiceNumber: "CBT/2026/089",
    invoiceDate: "2026-09-25",
    invoiceType: "R",
    placeOfSupply: "29-Karnataka",
    reverseCharge: false,
    taxableValue: 180000,
    igst: 32400,
    cgst: 0,
    sgst: 0,
    totalTax: 32400,
    totalInvoiceValue: 212400,
    gstr1FilingDate: "2026-10-08",
    gstr1Period: "092026",
    gstr3bFilingStatus: "FILED",
    itcAvailable: true
  },
  {
    id: "2b-5",
    vendorGstin: "29AAACD1029F1Z1",
    vendorTradeName: "Dell India Private Limited",
    invoiceNumber: "DEL/2026/99120",
    invoiceDate: "2026-09-28",
    invoiceType: "R",
    placeOfSupply: "29-Karnataka",
    reverseCharge: false,
    taxableValue: 360000,
    igst: 64800,
    cgst: 0,
    sgst: 0,
    totalTax: 64800,
    totalInvoiceValue: 424800,
    gstr1FilingDate: "2026-10-10",
    gstr1Period: "092026",
    gstr3bFilingStatus: "FILED",
    itcAvailable: true
  },
  {
    id: "2b-6",
    vendorGstin: "06AAACJ5512E1Z2",
    vendorTradeName: "Jindal Infra Projects Pvt Ltd",
    invoiceNumber: "JIP/HR/1044",
    invoiceDate: "2025-11-20",
    invoiceType: "R",
    placeOfSupply: "06-Haryana",
    reverseCharge: false,
    taxableValue: 560000,
    igst: 100800,
    cgst: 0,
    sgst: 0,
    totalTax: 100800,
    totalInvoiceValue: 660800,
    gstr1FilingDate: "2026-10-10",
    gstr1Period: "092026",
    gstr3bFilingStatus: "NOT_FILED",
    itcAvailable: true
  }
];

const INITIAL_BOOKS_PRATWI: BooksPurchaseInvoice[] = [
  {
    id: "bk-1",
    voucherNumber: "PUR-2026-011",
    vendorGstin: "27AAACT2727Q1ZW",
    vendorName: "Tata Steel Limited",
    invoiceNumber: "TSL/2026/0491",
    invoiceDate: "2026-09-14",
    taxableValue: 480000,
    igst: 86400,
    cgst: 0,
    sgst: 0,
    totalTax: 86400,
    totalInvoiceValue: 566400,
    hsnCode: "7208",
    itemDescription: "Hot rolled flat steel coils for fabrication",
    paymentStatus: "PAID"
  },
  {
    id: "bk-2",
    voucherNumber: "PUR-2026-012",
    vendorGstin: "27AABCM1888G1ZQ",
    vendorName: "Mahindra & Mahindra Financial Services",
    invoiceNumber: "MMFSL/MUM/8821",
    invoiceDate: "2026-09-18",
    taxableValue: 1250000,
    igst: 350000,
    cgst: 0,
    sgst: 0,
    totalTax: 350000,
    totalInvoiceValue: 1600000,
    hsnCode: "8703",
    itemDescription: "Mahindra XUV700 company staff car",
    paymentStatus: "PAID"
  },
  {
    id: "bk-3",
    voucherNumber: "PUR-2026-013",
    vendorGstin: "23AAGCR4421L1ZB",
    vendorName: "Radisson Blu Hospitality LLP",
    invoiceNumber: "RBL/IND/773",
    invoiceDate: "2026-09-22",
    taxableValue: 65000,
    igst: 0,
    cgst: 1625,
    sgst: 1625,
    totalTax: 3250,
    totalInvoiceValue: 68250,
    hsnCode: "9963",
    itemDescription: "Annual general meeting dinner buffet catering",
    paymentStatus: "PAID"
  },
  {
    id: "bk-4",
    voucherNumber: "PUR-2026-014",
    vendorGstin: "29AABCC9941H1Z4",
    vendorName: "Cloudbyte Technologies Pvt Ltd",
    invoiceNumber: "89", // Normalized match with CBT/2026/089
    invoiceDate: "2026-09-25",
    taxableValue: 180000,
    igst: 32400,
    cgst: 0,
    sgst: 0,
    totalTax: 32400,
    totalInvoiceValue: 212400,
    hsnCode: "9983",
    itemDescription: "Cloud hosting and server infrastructure maintenance",
    paymentStatus: "PAID"
  },
  {
    id: "bk-5",
    voucherNumber: "PUR-2026-015",
    vendorGstin: "24AADCA1192M1ZN",
    vendorName: "Pratwi Cloud Infrastructure Logistics",
    invoiceNumber: "AIL/GJ/4402",
    invoiceDate: "2026-09-02",
    taxableValue: 240000,
    igst: 43200,
    cgst: 0,
    sgst: 0,
    totalTax: 43200,
    totalInvoiceValue: 283200,
    hsnCode: "9965",
    itemDescription: "Goods transport agency freight charges",
    paymentStatus: "UNPAID",
    daysOutstanding: 28
  },
  {
    id: "bk-6",
    voucherNumber: "PUR-2026-016",
    vendorGstin: "06AAACJ5512E1Z2",
    vendorName: "Jindal Infra Projects Pvt Ltd",
    invoiceNumber: "JIP/HR/1044",
    invoiceDate: "2025-11-20",
    taxableValue: 560000,
    igst: 100800,
    cgst: 0,
    sgst: 0,
    totalTax: 100800,
    totalInvoiceValue: 660800,
    hsnCode: "9954",
    itemDescription: "Warehouse structural civil works",
    paymentStatus: "UNPAID",
    daysOutstanding: 310
  }
];

export const Gstr2bReconciler: React.FC = () => {
  const { clients: hookClients } = useTaxoData();
  const clients = useMemo(() => {
    return (hookClients && hookClients.length > 0) ? hookClients : SANDBOX_CLIENTS;
  }, [hookClients]);

  const [selectedEntityId, setSelectedEntityId] = useState<string>(clients[0]?.id || "CLI-PRATWI-01");
  const [activeTab, setActiveTab] = useState<"matrix" | "sec17_5" | "rule42_43" | "notices">("matrix");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [toleranceInr, setToleranceInr] = useState<number>(5.0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Raw Datasets
  const [gstr2bList, setGstr2bList] = useState<Gstr2bInvoice[]>(INITIAL_2B_PRATWI);
  const [booksList, setBooksList] = useState<BooksPurchaseInvoice[]>(INITIAL_BOOKS_PRATWI);

  // Modals & Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [json2bFile, setJson2bFile] = useState<File | null>(null);
  const [booksFile, setBooksFile] = useState<File | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isTable4DrawerOpen, setIsTable4DrawerOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<GeneratedNotice | null>(null);

  // Active Client
  const currentEntity = useMemo(() => {
    return clients.find(c => c.id === selectedEntityId) || clients[0];
  }, [clients, selectedEntityId]);

  const handleProcessUploadedFiles = async () => {
    if (!json2bFile && !booksFile) {
      toast.error("Files Required", "Please select either a GSTR-2B JSON or Purchase Register CSV file.");
      return;
    }
    setIsProcessingUpload(true);
    try {
      let next2bList = gstr2bList;
      let nextBooksList = booksList;

      if (json2bFile) {
        const text = await json2bFile.text();
        const res2b = parseOfficialGstr2bJson(text);
        if (res2b.success && res2b.invoices.length > 0) {
          next2bList = res2b.invoices;
          setGstr2bList(res2b.invoices);
          toast.success("GSTR-2B Loaded", `Extracted ${res2b.totalInvoices} invoices (Tax: ₹${res2b.totalTax.toLocaleString('en-IN')})`);
        } else {
          toast.error("GSTR-2B Parse Error", res2b.errors[0] || "Could not parse JSON format");
        }
      }

      if (booksFile) {
        const text = await booksFile.text();
        const resBooks = parsePurchaseRegisterCsv(text);
        if (resBooks.success && resBooks.invoices.length > 0) {
          nextBooksList = resBooks.invoices;
          setBooksList(resBooks.invoices);
          toast.success("Purchase Register Loaded", `Extracted ${resBooks.totalInvoices} vouchers (Tax: ₹${resBooks.totalTax.toLocaleString('en-IN')})`);
        } else {
          toast.error("Books Parse Error", resBooks.errors[0] || "Could not parse CSV format");
        }
      }

      // Persist to Server Database
      await fetch("/api/gst/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxPeriod: "September 2026",
          clientGstin: currentEntity?.gstin || "23AANCP9915B1Z9",
          gstr2bInvoices: next2bList,
          booksInvoices: nextBooksList,
          toleranceInr
        })
      });

      playSuccessChime();
      setIsUploadModalOpen(false);
      setJson2bFile(null);
      setBooksFile(null);
      window.dispatchEvent(new CustomEvent("bt_autopilot_sweep_completed"));
      toast.success("Reconciliation Synced", "Live records updated and registered in CA firm audit database.");
    } catch (e: any) {
      toast.error("Upload Error", e.message || "Failed to process files");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Execute Deterministic Multi-Rule Reconciliation
  const recoReport = useMemo(() => {
    const report = RecoMatcher.reconcile({
      taxPeriod: "September 2026 (Monthly 3B)",
      clientGstin: currentEntity?.gstin || "23AANCP9915B1Z9",
      gstr2bInvoices: gstr2bList,
      booksInvoices: booksList,
      toleranceInr
    });

    // Run Section 17(5) classifier on each record
    let blockedSum = 0;
    for (const record of report.records) {
      const cls = ItcClassifier.classify({
        hsnOrSacCode: record.hsnCode,
        itemDescription: record.itemDescription,
        vendorTradeName: record.vendorName
      });
      if (cls.isBlocked) {
        record.section17_5Blocked = true;
        record.blockedCategory = cls.categoryTitle;
        record.statutoryAuditTrail = `${record.statutoryAuditTrail} [BLOCKED: ${cls.reason}]`;
        record.recommendedAction = cls.auditRecommendation;
        blockedSum += (record.gstr2bTotalTax || record.booksTotalTax);
      }
    }
    report.summary.ineligibleSec17_5Itc = Math.round(blockedSum * 100) / 100;

    return report;
  }, [gstr2bList, booksList, currentEntity, toleranceInr]);

  // Filtered Records for Table
  const filteredRecords = useMemo(() => {
    return recoReport.records.filter(r => {
      let matchesFilter = true;
      if (filterStatus === "EXACT") matchesFilter = r.matchStatus === "EXACT_MATCH" && !r.section17_5Blocked;
      else if (filterStatus === "FUZZY") matchesFilter = (r.matchStatus === "FUZZY_MATCHED" || r.matchStatus === "DATE_LEEWAY_MATCHED") && !r.section17_5Blocked;
      else if (filterStatus === "ROUNDING") matchesFilter = r.matchStatus === "ROUNDING_MATCHED";
      else if (filterStatus === "MISMATCH") matchesFilter = r.matchStatus === "VALUE_MISMATCH";
      else if (filterStatus === "MISSING_2B") matchesFilter = r.matchStatus === "MISSING_IN_2B";
      else if (filterStatus === "MISSING_BOOKS") matchesFilter = r.matchStatus === "MISSING_IN_BOOKS";
      else if (filterStatus === "SEC_17_5") matchesFilter = r.section17_5Blocked;
      else if (filterStatus === "RULE_37A") matchesFilter = r.rule37aRisk;

      const q = search.toLowerCase();
      const matchesSearch = 
        r.vendorName.toLowerCase().includes(q) ||
        r.vendorGstin.toLowerCase().includes(q) ||
        (r.gstr2bInvoiceNo && r.gstr2bInvoiceNo.toLowerCase().includes(q)) ||
        (r.booksInvoiceNo && r.booksInvoiceNo.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [recoReport.records, filterStatus, search]);

  // Vendor Risk Profiles
  const vendorProfiles = useMemo<VendorComplianceProfile[]>(() => {
    const map = new Map<string, { gstin: string; name: string; taxable: number; itc: number; invoices: any[] }>();
    
    for (const r of recoReport.records) {
      if (!map.has(r.vendorGstin)) {
        map.set(r.vendorGstin, {
          gstin: r.vendorGstin,
          name: r.vendorName,
          taxable: 0,
          itc: 0,
          invoices: []
        });
      }
      const entry = map.get(r.vendorGstin)!;
      entry.taxable += (r.gstr2bTaxableValue || r.booksTaxableValue);
      entry.itc += (r.gstr2bTotalTax || r.booksTotalTax);
      entry.invoices.push(r);
    }

    return Array.from(map.values()).map(v => {
      // Assess simulated portal compliance
      const hasMissing2b = v.invoices.some(i => i.matchStatus === "MISSING_IN_2B");
      const hasUnfiled3b = v.invoices.some(i => i.rule37aRisk);
      const isSuspended = v.gstin.startsWith("24AADCA");

      return VendorRiskEngine.evaluateRisk({
        vendorGstin: v.gstin,
        tradeName: v.name,
        gstnStatus: isSuspended ? "SUSPENDED" : "ACTIVE",
        gstr1FiledCount: hasMissing2b ? 4 : 6,
        gstr1TotalCount: 6,
        gstr3bFiledCount: hasUnfiled3b ? 4 : 6,
        gstr3bTotalCount: 6,
        totalTaxableValueInr: v.taxable,
        totalItcInr: v.itc,
        invoicesOver180DaysUnpaid: v.invoices
          .filter(i => i.rule37_180DayRisk)
          .map(i => ({
            invoiceNo: i.booksInvoiceNo || "UNKNOWN",
            taxableValue: i.booksTaxableValue,
            itcAmount: i.booksTotalTax,
            daysOld: 310
          }))
      });
    });
  }, [recoReport.records]);

  // Rule 42 Interactive State
  const [r42TotalInputTax, setR42TotalInputTax] = useState<number>(688050);
  const [r42NonBusiness, setR42NonBusiness] = useState<number>(0);
  const [r42ExemptInput, setR42ExemptInput] = useState<number>(0);
  const [r42BlockedInput, setR42BlockedInput] = useState<number>(454050); // Sec 17(5)
  const [r42TaxableInput, setR42TaxableInput] = useState<number>(150000);
  const [r42ExemptTurnover, setR42ExemptTurnover] = useState<number>(2400000);
  const [r42TotalTurnover, setR42TotalTurnover] = useState<number>(12000000);

  const r42Result = useMemo<Rule42CalculationResult>(() => {
    return Rule42And43Engine.calculateMonthlyRule42({
      taxPeriod: "September 2026",
      totalInputTaxInr: r42TotalInputTax,
      nonBusinessInputTaxInr: r42NonBusiness,
      exemptSuppliesInputTaxInr: r42ExemptInput,
      blockedInputTaxInr: r42BlockedInput,
      taxableSuppliesInputTaxInr: r42TaxableInput,
      exemptTurnoverInr: r42ExemptTurnover,
      totalTurnoverInr: r42TotalTurnover
    });
  }, [r42TotalInputTax, r42NonBusiness, r42ExemptInput, r42BlockedInput, r42TaxableInput, r42ExemptTurnover, r42TotalTurnover]);

  // Rule 43 Capital Goods State
  const [r43CapitalCredit, setR43CapitalCredit] = useState<number>(81000); // e.g. MacBook Pro
  const r43Result = useMemo<Rule43MonthlyResult>(() => {
    return Rule42And43Engine.calculateMonthlyRule43({
      taxPeriod: "September 2026",
      capitalAssets: [
        {
          id: "cap-1",
          assetDescription: "High Performance CAD Engineering Servers",
          invoiceNumber: "APL/2026/4402",
          invoiceDate: "2026-09-20",
          capitalCostInr: 450000,
          totalInputTaxInr: r43CapitalCredit,
          monthsElapsed: 1
        }
      ],
      exemptTurnoverInr: r42ExemptTurnover,
      totalTurnoverInr: r42TotalTurnover
    });
  }, [r43CapitalCredit, r42ExemptTurnover, r42TotalTurnover]);

  // Notice Dispatcher Action
  const handleGenerateNotice = (record: ReconciledRecord) => {
    playSoftClick();
    const notice = VendorNoticeGenerator.generateNotice({
      buyerEntityName: currentEntity?.tradeName || "Pratwi Solutions Private Limited",
      buyerGstin: currentEntity?.gstin || "23AANCP9915B1Z9",
      vendorTradeName: record.vendorName,
      vendorGstin: record.vendorGstin,
      vendorContactPhone: record.vendorPhone || "919820011223",
      taxPeriod: "September 2026",
      invoices: [
        {
          invoiceNumber: record.booksInvoiceNo || record.gstr2bInvoiceNo || "INV-001",
          invoiceDate: record.booksDate || record.gstr2bDate || "2026-09-15",
          taxableValue: record.booksTaxableValue || record.gstr2bTaxableValue,
          igst: record.booksIgst || record.gstr2bIgst,
          cgst: record.booksCgst || record.gstr2bCgst,
          sgst: record.booksSgst || record.gstr2bSgst,
          totalTax: record.booksTotalTax || record.gstr2bTotalTax,
          totalInvoiceValue: (record.booksTaxableValue || record.gstr2bTaxableValue) + (record.booksTotalTax || record.gstr2bTotalTax),
          reason: record.matchStatus === "MISSING_IN_2B" ? "NOT_IN_GSTR_2B" : record.rule37aRisk ? "GSTR_3B_UNFILED" : "TAX_MISMATCH",
          discrepancyDetails: record.statutoryAuditTrail
        }
      ]
    });
    setSelectedNotice(notice);
    setIsNoticeModalOpen(true);
  };

  // 1-Click Tally Purchase Voucher XML Export
  const handleExportTallyMissingXml = (record: ReconciledRecord) => {
    playSuccessChime();
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${currentEntity?.tradeName || "Client Entity"}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create">
            <DATE>${(record.gstr2bDate || "2026-09-28").replace(/-/g, "")}</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <REFERENCE>${record.gstr2bInvoiceNo}</REFERENCE>
            <PARTYLEDGERNAME>${record.vendorName}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice View</PERSISTEDVIEW>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${record.vendorName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${(record.gstr2bTaxableValue + record.gstr2bTotalTax).toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Purchase Ledger (GST Eligible)</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${record.gstr2bTaxableValue.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Input IGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${record.gstr2bTotalTax.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tally_Purchase_${record.gstr2bInvoiceNo?.replace(/[^a-zA-Z0-9]/g, "_")}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Tally Prime XML Generated", `Purchase voucher XML for ${record.gstr2bInvoiceNo} ready for Alt+O import.`);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* HEADER: Enterprise Practice Control & Client Context                     */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-200">
                Statutory ITC Reconciliation
              </span>
              <span className="text-xs text-slate-400 font-medium font-mono">CGST Sec 16(2)(aa) &amp; Rule 37A</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              GSTR-2B vs Books Reconciliation Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Multi-pass invoice matching, Section 17(5) blocked credit classification, and 1-click vendor notice generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Entity Picker */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <select
                value={selectedEntityId}
                onChange={(e) => {
                  playSoftClick();
                  setSelectedEntityId(e.target.value);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.tradeName} ({c.gstin?.substring(0, 5)}...)</option>
                ))}
              </select>
            </div>

            {/* Tolerance Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
              <Scale className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Tolerance:</span>
              <select
                value={toleranceInr}
                onChange={(e) => {
                  playSoftClick();
                  setToleranceInr(parseFloat(e.target.value));
                  toast.info("Tolerance Updated", `Matching tolerance set to ±₹${e.target.value} u/s 170 CGST Act.`);
                }}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value={1.0}>± ₹1.00</option>
                <option value={2.0}>± ₹2.00</option>
                <option value={5.0}>± ₹5.00 (Std)</option>
                <option value={10.0}>± ₹10.00</option>
              </select>
            </div>

            {/* Real File Upload Trigger */}
            <button
              onClick={() => {
                playSoftClick();
                setIsUploadModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm transition"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              Upload 2B &amp; Books
            </button>

            {/* Table 4 Summary Button */}
            <button
              onClick={() => {
                playSoftClick();
                setIsTable4DrawerOpen(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm transition"
            >
              <FileCheck className="w-4 h-4 text-white" />
              GSTR-3B Table 4 Values
            </button>
          </div>
        </div>

        {/* Real-Time Statutory Telemetry Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Books Total ITC</span>
            <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">{formatCurrencyINR(recoReport.summary.totalBooksItc)}</span>
            <span className="text-[10px] text-slate-500 font-medium">{booksList.length} Vouchers</span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GSTR-2B Total ITC</span>
            <span className="text-sm font-black text-blue-900 font-mono mt-0.5 block">{formatCurrencyINR(recoReport.summary.total2bItc)}</span>
            <span className="text-[10px] text-blue-600 font-medium">{gstr2bList.length} Invoices</span>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Eligible ITC 4(A)(5)</span>
            <span className="text-sm font-black text-emerald-900 font-mono mt-0.5 block">{formatCurrencyINR(recoReport.summary.matchedEligibleItc)}</span>
            <span className="text-[10px] text-emerald-600 font-bold">{recoReport.summary.exactMatches + recoReport.summary.fuzzyMatches + recoReport.summary.roundingMatches} Matched</span>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Sec 17(5) Blocked</span>
            <span className="text-sm font-black text-amber-900 font-mono mt-0.5 block">{formatCurrencyINR(recoReport.summary.ineligibleSec17_5Itc)}</span>
            <span className="text-[10px] text-amber-600 font-bold">Auto Table 4(B)(1)</span>
          </div>

          <div className="bg-rose-50/60 rounded-2xl p-3 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Missing in 2B</span>
            <span className="text-sm font-black text-rose-900 font-mono mt-0.5 block">{formatCurrencyINR(recoReport.summary.provisionalMissing2bItc)}</span>
            <span className="text-[10px] text-rose-600 font-bold">{recoReport.summary.missingIn2b} Invoices (Sec 16(2)(aa))</span>
          </div>

          <div className="bg-indigo-50/60 rounded-2xl p-3 border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Unclaimed in Books</span>
            <span className="text-sm font-black text-indigo-900 font-mono mt-0.5 block">{formatCurrencyINR(recoReport.summary.unclaimed2bItc)}</span>
            <span className="text-[10px] text-indigo-600 font-bold">{recoReport.summary.missingInBooks} In 2B (Tally XML Ready)</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 MODE TABS NAVIGATION                                                   */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("matrix");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "matrix"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          Reconciliation Matrix
          <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
            {recoReport.records.length}
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("sec17_5");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "sec17_5"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          Blocked ITC &amp; Vendor Risk
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 text-[10px] rounded-full font-bold">
            {vendorProfiles.length} Vendors
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("rule42_43");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "rule42_43"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
          }`}
        >
          <Calculator className="w-4 h-4 text-slate-600" />
          Rule 42 &amp; 43 Reversals
          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded-full font-bold">
            Workpaper
          </span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            setActiveTab("notices");
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "notices"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          Vendor Notices
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 text-[10px] rounded-full font-bold">
            Sec 16(2)(aa)
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 7-PASS RECONCILIATION MATRIX                                       */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Items", count: recoReport.records.length },
                { id: "EXACT", label: "Exact (0.00)", count: recoReport.summary.exactMatches },
                { id: "FUZZY", label: "Fuzzy / Leeway", count: recoReport.summary.fuzzyMatches },
                { id: "ROUNDING", label: `Rounding (±₹${toleranceInr})`, count: recoReport.summary.roundingMatches },
                { id: "MISMATCH", label: "Value Mismatch", count: recoReport.summary.valueMismatches },
                { id: "MISSING_2B", label: "Missing in 2B", count: recoReport.summary.missingIn2b },
                { id: "MISSING_BOOKS", label: "Missing in Books", count: recoReport.summary.missingInBooks },
                { id: "SEC_17_5", label: "17(5) Blocked", count: recoReport.records.filter(r => r.section17_5Blocked).length },
                { id: "RULE_37A", label: "Rule 37A Alert", count: recoReport.records.filter(r => r.rule37aRisk).length }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    playSoftClick();
                    setFilterStatus(f.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    filterStatus === f.id
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                  }`}
                >
                  {f.label}
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                    filterStatus === f.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor, invoice, GSTIN..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          {/* Matrix Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Vendor &amp; GSTIN</th>
                    <th className="p-3.5">2B Ref / Books Inv</th>
                    <th className="p-3.5 text-right">Taxable (₹)</th>
                    <th className="p-3.5 text-right">ITC Amount (₹)</th>
                    <th className="p-3.5 text-center">Match Status</th>
                    <th className="p-3.5">Statutory Audit Classification</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition group">
                      <td className="p-3.5">
                        <strong className="block font-bold text-slate-900">{r.vendorName}</strong>
                        <span className="font-mono text-[11px] text-slate-500">{r.vendorGstin}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <span className="text-[10px] font-bold text-slate-400">2B:</span>
                            <span className={r.gstr2bInvoiceNo ? "font-bold text-slate-800" : "text-rose-500 italic font-medium"}>
                              {r.gstr2bInvoiceNo || "MISSING"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <span className="text-[10px] font-bold text-slate-400">BK:</span>
                            <span className={r.booksInvoiceNo ? "font-medium text-slate-700" : "text-indigo-500 italic font-medium"}>
                              {r.booksInvoiceNo || "MISSING"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className="text-slate-900 font-bold">
                          {formatCurrencyINR(r.gstr2bTaxableValue || r.booksTaxableValue)}
                        </div>
                        {r.taxableVariance !== 0 && (
                          <span className={`text-[10px] font-bold ${r.taxableVariance > 0 ? "text-rose-600" : "text-blue-600"}`}>
                            Var: {r.taxableVariance > 0 ? `+${r.taxableVariance}` : r.taxableVariance}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className={`font-black ${r.section17_5Blocked ? "text-amber-600" : r.matchStatus === "MISSING_IN_2B" ? "text-rose-600" : "text-emerald-700"}`}>
                          {formatCurrencyINR(r.gstr2bTotalTax || r.booksTotalTax)}
                        </div>
                        {r.taxVariance !== 0 && (
                          <span className="text-[10px] font-bold text-slate-500 block">
                            Diff: ₹{r.taxVariance}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {r.matchStatus === "EXACT_MATCH" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> 100% Exact
                          </span>
                        )}
                        {r.matchStatus === "FUZZY_MATCHED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                            <Sparkles className="w-3 h-3" /> Fuzzy ({r.confidenceScore}%)
                          </span>
                        )}
                        {r.matchStatus === "ROUNDING_MATCHED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200">
                            <Scale className="w-3 h-3" /> Round-Off
                          </span>
                        )}
                        {r.matchStatus === "DATE_LEEWAY_MATCHED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-50 text-cyan-700 text-[10px] font-bold rounded-full border border-cyan-200">
                            <Clock className="w-3 h-3" /> Date Leeway
                          </span>
                        )}
                        {r.matchStatus === "VALUE_MISMATCH" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Mismatch
                          </span>
                        )}
                        {r.matchStatus === "MISSING_IN_2B" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200">
                            <AlertCircle className="w-3 h-3" /> Missing in 2B
                          </span>
                        )}
                        {r.matchStatus === "MISSING_IN_BOOKS" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-200">
                            <Plus className="w-3 h-3" /> Unclaimed in BK
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1 max-w-sm">
                          {r.section17_5Blocked ? (
                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                              Sec 17(5) Blocked: {r.blockedCategory}
                            </span>
                          ) : r.rule37aRisk ? (
                            <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-900 text-[10px] font-bold rounded">
                              Rule 37A Alert: Supplier GSTR-3B Unfiled
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded">
                              Table 4(A)(5) Eligible All Other ITC
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {r.recommendedAction}
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        {r.matchStatus === "MISSING_IN_BOOKS" ? (
                          <button
                            onClick={() => handleExportTallyMissingXml(r)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-xl border border-indigo-200 flex items-center gap-1 ml-auto transition"
                          >
                            <Download className="w-3 h-3" /> Tally XML
                          </button>
                        ) : (r.matchStatus === "MISSING_IN_2B" || r.rule37aRisk || r.matchStatus === "VALUE_MISMATCH") ? (
                          <button
                            onClick={() => handleGenerateNotice(r)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1 ml-auto shadow-sm transition"
                          >
                            <Send className="w-3 h-3" /> Notice
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Reconciled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECTION 17(5) & VENDOR RISK DECK                                   */}
      {/* ========================================================================= */}
      {activeTab === "sec17_5" && (
        <div className="space-y-6">
          {/* Statutory Overview Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Section 17(5) Statutory Guardrails &amp; GSTR-3B Table 4(B)(1) Routing
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                  Under CBIC Circular No. 170/02/2022-GST, all ineligible ITC under Section 17(5) must be mandatorily reported in Table 4(B)(1) of Form GSTR-3B. Claiming blocked input tax credit attracts a 100% tax penalty plus 18% simple interest per annum under Section 50(1).
                </p>
              </div>
            </div>
          </div>

          {/* Vendor Compliance Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendorProfiles.map(v => (
              <div key={v.vendorGstin} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4 hover:border-slate-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 text-sm">{v.vendorTradeName}</h4>
                    <span className="font-mono text-xs text-slate-500">{v.vendorGstin}</span>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                    v.gstnStatus === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                    {v.gstnStatus}
                  </span>
                </div>

                {/* Score Meter */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">Compliance Risk Score:</span>
                    <strong className={`font-mono font-bold ${
                      v.riskLevel === "LOW" ? "text-emerald-700" : v.riskLevel === "MEDIUM" ? "text-amber-700" : "text-rose-700"
                    }`}>
                      {v.compositeRiskScore}/100 ({v.riskLevel})
                    </strong>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        v.riskLevel === "LOW" ? "bg-emerald-500" : v.riskLevel === "MEDIUM" ? "bg-amber-500" : "bg-rose-600"
                      }`}
                      style={{ width: `${v.compositeRiskScore}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTR-1 Filed</span>
                    <strong className="text-slate-800 font-mono">{v.gstr1FilingRatePercentage}%</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTR-3B Filed</span>
                    <strong className="text-slate-800 font-mono">{v.gstr3bFilingRatePercentage}%</strong>
                  </div>
                </div>

                {/* Violations */}
                {v.statutoryViolations.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Statutory Exposure:</span>
                    <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                      {v.statutoryViolations.map((violation, i) => (
                        <li key={i}>{violation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">ITC: {formatCurrencyINR(v.totalItcAtRiskInr)}</span>
                  <button
                    onClick={() => {
                      const rec = recoReport.records.find(r => r.vendorGstin === v.vendorGstin);
                      if (rec) handleGenerateNotice(rec);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Chase Vendor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RULE 42 & RULE 43 PRO-RATA REVERSAL WORKPAPER                     */}
      {/* ========================================================================= */}
      {activeTab === "rule42_43" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Rule 42 &amp; 43 CGST Pro-Rata Reversal Mathematical Simulator
                </h3>
                <p className="text-xs text-slate-500">
                  Apportionment of common credit between taxable, zero-rated and exempt supplies for GSTR-3B Table 4(B)(2).
                </p>
              </div>

              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 self-start sm:self-auto">
                Rule 42(1)(i) &amp; Rule 43
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Total Input Tax (T)</label>
                <input
                  type="number"
                  value={r42TotalInputTax}
                  onChange={(e) => setR42TotalInputTax(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Sec 17(5) Blocked (T3)</label>
                <input
                  type="number"
                  value={r42BlockedInput}
                  onChange={(e) => setR42BlockedInput(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Exempt Turnover (E)</label>
                <input
                  type="number"
                  value={r42ExemptTurnover}
                  onChange={(e) => setR42ExemptTurnover(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Total State Turnover (F)</label>
                <input
                  type="number"
                  value={r42TotalTurnover}
                  onChange={(e) => setR42TotalTurnover(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Common Credit (C2)</span>
                <span className="text-lg font-black text-blue-950 font-mono mt-1 block">
                  {formatCurrencyINR(r42Result.commonCredit_C2)}
                </span>
                <span className="text-[11px] text-blue-700 font-medium">C2 = C1 - T4</span>
              </div>

              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Exempt Reversal (D1)</span>
                <span className="text-lg font-black text-amber-950 font-mono mt-1 block">
                  {formatCurrencyINR(r42Result.exemptReversal_D1)}
                </span>
                <span className="text-[11px] text-amber-700 font-medium">Ratio: {(r42Result.turnoverRatio_E_by_F * 100).toFixed(2)}% of C2</span>
              </div>

              <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Non-Business 5% (D2)</span>
                <span className="text-lg font-black text-purple-950 font-mono mt-1 block">
                  {formatCurrencyINR(r42Result.nonBusinessReversal_D2)}
                </span>
                <span className="text-[11px] text-purple-700 font-medium">Mandatory 5% attribution</span>
              </div>

              <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Total Monthly Reversal</span>
                <span className="text-lg font-black text-rose-950 font-mono mt-1 block">
                  {formatCurrencyINR(r42Result.totalMonthlyReversal)}
                </span>
                <span className="text-[11px] text-rose-700 font-bold">Route to Table 4(B)(2)</span>
              </div>
            </div>

            {/* Audit Trail Steps */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ICAI SQC-1 Audit Trail Schedule</h4>
              <div className="space-y-2">
                {r42Result.auditSteps.map((step) => (
                  <div key={step.stepNo} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <strong className="text-slate-900 block">Step {step.stepNo}: {step.title}</strong>
                      <span className="text-slate-500 text-[11px]">{step.explanation}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrencyINR(step.valueInr)}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{step.statutoryRef}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DEFAULTING VENDOR CHASER DESK                                      */}
      {/* ========================================================================= */}
      {activeTab === "notices" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  1-Click Defaulting Vendor Demand Notice Dispatcher
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-approved legal notices under Section 16(2)(aa) &amp; Rule 37A with formatted invoice tables and 7-day payment withholding warnings.
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 self-start sm:self-auto">
                WhatsApp &amp; Email Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recoReport.records
                .filter(r => r.matchStatus === "MISSING_IN_2B" || r.rule37aRisk || r.matchStatus === "VALUE_MISMATCH")
                .map(r => (
                  <div key={r.id} className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{r.vendorName}</h4>
                        <span className="font-mono text-xs text-slate-500">{r.vendorGstin}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        r.matchStatus === "MISSING_IN_2B" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {r.matchStatus === "MISSING_IN_2B" ? "GSTR-1 Omitted" : "Rule 37A GSTR-3B Pending"}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Invoice:</span>
                        <strong className="font-mono text-slate-800">{r.booksInvoiceNo || r.gstr2bInvoiceNo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Taxable:</span>
                        <span className="font-mono text-slate-800">{formatCurrencyINR(r.booksTaxableValue || r.gstr2bTaxableValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Blocked ITC at Risk:</span>
                        <strong className="font-mono text-rose-600">{formatCurrencyINR(r.booksTotalTax || r.gstr2bTotalTax)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleGenerateNotice(r)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Launch WhatsApp Notice
                      </button>
                      <button
                        onClick={() => handleGenerateNotice(r)}
                        className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition"
                        title="View Email Notice"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: GSTR-3B TABLE 4 STATUTORY SUMMARY                                 */}
      {/* ========================================================================= */}
      {isTable4DrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">GSTR-3B Table 4 Eligible &amp; Ineligible ITC</h3>
                  <p className="text-xs text-slate-500">Statutory breakdown conforming to CBIC Circular No. 170/02/2022-GST</p>
                </div>
              </div>
              <button onClick={() => setIsTable4DrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">GSTR-3B Table Description</th>
                    <th className="p-3 text-right">Eligible Amount (₹)</th>
                    <th className="p-3">Statutory Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium text-slate-800">4(A)(5) All Other ITC</td>
                    <td className="p-3 text-right font-mono font-black text-emerald-700">
                      {formatCurrencyINR(recoReport.summary.matchedEligibleItc)}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">Matched GSTR-2B Invoices</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">4(B)(1) Ineligible as per Section 17(5)</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700">
                      {formatCurrencyINR(recoReport.summary.ineligibleSec17_5Itc)}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">Motor cars, catering, works contracts</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">4(B)(2) Reversals - Others (Rule 42/43)</td>
                    <td className="p-3 text-right font-mono font-bold text-purple-700">
                      {formatCurrencyINR(r42Result.totalMonthlyReversal)}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">Exempt turnover common credit ratio</td>
                  </tr>
                  <tr className="bg-red-50 text-red-950 font-bold border-y-2 border-red-500">
                    <td className="p-3">Net ITC Available [4(A) - 4(B)]</td>
                    <td className="p-3 text-right font-mono text-emerald-700 font-black">
                      {formatCurrencyINR(recoReport.summary.matchedEligibleItc - r42Result.totalMonthlyReversal)}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">Credited to Electronic Credit Ledger</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Values ready for GST portal offline JSON import</span>
              <button
                onClick={() => {
                  playSuccessChime();
                  navigator.clipboard.writeText(`GSTR-3B Table 4 for ${currentEntity?.tradeName}: 4(A)(5)=₹${recoReport.summary.matchedEligibleItc}, 4(B)(1)=₹${recoReport.summary.ineligibleSec17_5Itc}, 4(B)(2)=₹${r42Result.totalMonthlyReversal}`);
                  toast.success("Copied to Clipboard", "Table 4 values copied for GST portal.");
                  setIsTable4DrawerOpen(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Values
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UNIVERSAL GSTR-2B & BOOKS FILE INGESTION DROPZONE                  */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Universal GSTR-2B &amp; Purchase Register Ingestion</h3>
                  <p className="text-[11px] text-slate-500">Official GSTN JSON + Tally / ERP Purchase Register CSV</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dropzone 1: GSTR-2B JSON */}
              <div className="border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-2xl p-4 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 cursor-pointer hover:underline block">
                    {json2bFile ? (
                      <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" /> {json2bFile.name} ({(json2bFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      "Select or Drop Official GSTR-2B JSON"
                    )}
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setJson2bFile(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-0.5">Government GSTR-2B download from GST Portal (.json)</p>
                </div>
              </div>

              {/* Dropzone 2: Purchase Register CSV */}
              <div className="border-2 border-dashed border-slate-300 bg-slate-50/60 rounded-2xl p-4 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 cursor-pointer hover:underline block">
                    {booksFile ? (
                      <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" /> {booksFile.name} ({(booksFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      "Select or Drop Tally Purchase Register CSV"
                    )}
                    <input
                      type="file"
                      accept=".csv,.txt,.tsv"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setBooksFile(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-0.5">Exported from Tally Prime / Busy / Zoho (Columns: GSTIN, Inv No, Date, Tax)</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Client-Side Ingestion
                </div>
                <p>Data stays securely within your CA firm boundary. Sanitizes Indian commas, dates, and currency symbols down to the paisa.</p>
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
                disabled={isProcessingUpload || (!json2bFile && !booksFile)}
                onClick={handleProcessUploadedFiles}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                {isProcessingUpload ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting &amp; Reconciling...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" /> Execute 7-Pass Matcher
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STATUTORY VENDOR NOTICE PREVIEW                                    */}
      {/* ========================================================================= */}
      {isNoticeModalOpen && selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Statutory Requisition under Section 16(2)(aa)</h3>
                  <p className="text-[11px] text-slate-500">Ref: {selectedNotice.noticeRef}</p>
                </div>
              </div>
              <button onClick={() => setIsNoticeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor:</span>
                <strong className="text-slate-900">{selectedNotice.vendorTradeName} ({selectedNotice.vendorGstin})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exposure ITC:</span>
                <strong className="text-rose-600 font-mono">{formatCurrencyINR(selectedNotice.totalTaxAtRiskInr)}</strong>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Notice Preview (WhatsApp / Email)</label>
              <textarea
                rows={9}
                readOnly
                value={selectedNotice.whatsappMessageText}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono text-slate-800 leading-relaxed outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  playSuccessChime();
                  navigator.clipboard.writeText(selectedNotice.whatsappMessageText);
                  toast.success("Text Copied", "Notice copied to clipboard.");
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </button>
              <a
                href={selectedNotice.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  playSuccessChime();
                  toast.success("Dispatched via WhatsApp", `Notice opened for ${selectedNotice.vendorTradeName}.`);
                  setIsNoticeModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Open in WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
