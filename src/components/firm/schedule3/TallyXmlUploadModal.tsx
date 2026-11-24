"use client";

import React, { useState, useRef } from "react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  FileSearch, 
  Check, 
  X, 
  Building2, 
  Layers, 
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  FolderSync,
  HelpCircle,
  Copy
} from "lucide-react";
import { 
  TbParseResult, 
  parseTallyXmlContent, 
  parseTabularTbContent, 
  getMockTrialBalanceResult,
  MOCK_REALISTIC_TALLY_TB,
  cleanTbNumber
} from "@/lib/parsers/tallyTbParser";
import { MappedTbLedger } from "@/lib/parsers/tallyTbParser";
import { validateTallyXmlOrTb } from "@/lib/fileIntelligence/documentValidator";
import { parseXbrlFinancials } from "@/lib/parsers/xbrlParser";

export interface TallyUploadPreset {
  id: string;
  clientName: string;
  cin: string;
  pan: string;
  industry: string;
  ledgerCount: number;
  totalTurnoverCr: number;
  isBalanced: boolean;
  varianceAmount: number;
  description: string;
  dataGenerator: () => TbParseResult;
}

interface TallyXmlUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTbData: (result: TbParseResult, clientMeta?: { name: string; pan: string; cin: string }) => void;
  currentClientName?: string;
  currentPan?: string;
}

export const TallyXmlUploadModal: React.FC<TallyXmlUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyTbData,
  currentClientName = "Pratwi Solutions Private Limited",
  currentPan = "AABCA8891D"
}) => {
  const [activeTab, setActiveTab] = useState<"PRESETS" | "UPLOAD" | "PASTE" | "TALLY_GUIDE">("PRESETS");
  const [isDragging, setIsDragging] = useState(false);
  const [pastedContent, setPastedContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<TbParseResult | null>(null);
  const [detectedClientMeta, setDetectedClientMeta] = useState<{ name: string; pan: string; cin: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Realistic Presets for CA Firm Audits
  const presets: TallyUploadPreset[] = [
    {
      id: "pratwi_solutions",
      clientName: "Pratwi Solutions Private Limited",
      cin: "U29100MP2015PTC034120",
      pan: "AABCA8891D",
      industry: "Auto Components Manufacturing",
      ledgerCount: 65,
      totalTurnoverCr: 48.5,
      isBalanced: false,
      varianceAmount: 18750400,
      description: "Auto-ancillary vendor. TB contains unadjusted closing inventory variance (₹1.87 Cr) & 1 customer advance credit balance.",
      dataGenerator: () => {
        return getMockTrialBalanceResult();
      }
    },
    {
      id: "pratwi_infotech",
      clientName: "Pratwi Solutions Private Limited",
      cin: "U24231MP2018PTC045812",
      pan: "AABCA9182K",
      industry: "Pharmaceutical Formulations",
      ledgerCount: 48,
      totalTurnoverCr: 73.4,
      isBalanced: true,
      varianceAmount: 0,
      description: "Pharma exporter. Perfectly balanced trial balance (₹14.85 Cr) with high confidence Schedule III head mappings.",
      dataGenerator: () => {
        // Balanced Pharma Dataset
        const pharmaRows = [
          ...MOCK_REALISTIC_TALLY_TB.filter((r) => !r.ledgerName.includes("Miscellaneous Office")),
          // Adjusted balanced item
          { ledgerName: "Closing Stock of Formulations (Inventory Double Entry)", tallyParent: "Stock-in-hand", openingBalance: 0, debit: 18750400, credit: 0, closingBalance: 18750400, balanceType: "DR" as const },
          { ledgerName: "Change in Finished Inventories Accrual", tallyParent: "Direct Expenses", openingBalance: 0, debit: 0, credit: 18750400, closingBalance: 18750400, balanceType: "CR" as const }
        ];
        // Build balanced result
        return parseTabularTbContent(
          pharmaRows.map(r => `${r.ledgerName}\t${r.tallyParent}\t${r.debit}\t${r.credit}`).join("\n")
        );
      }
    },
    {
      id: "symphony_saas",
      clientName: "Symphony Cloud Technologies Pvt Ltd",
      cin: "U72200MH2020PTC345612",
      pan: "AAGCS7712M",
      industry: "IT SaaS & Software Development",
      ledgerCount: 36,
      totalTurnoverCr: 18.2,
      isBalanced: true,
      varianceAmount: 0,
      description: "Software exporter with zero inventory, high export receipts, software capitalisation WIP, and ESOP provisions.",
      dataGenerator: () => {
        const saasData = `
Equity Share Capital (5,00,000 shares @ ₹10)\tCapital Account\t0\t5000000
Securities Premium Reserve\tReserves & Surplus\t0\t45000000
Surplus in Statement of Profit & Loss (Opening)\tReserves & Surplus\t0\t12000000
HDFC Venture Debt Term Loan\tSecured Loans\t0\t15000000
Provision for Employee Gratuity\tProvisions\t0\t1450000
Trade Payables - AWS Cloud Infrastructure\tSundry Creditors\t0\t3850000
Trade Payables - MongoDB & Datadog SaaS\tSundry Creditors\t0\t1200000
Provident Fund & Professional Tax Payable\tDuties & Taxes\t0\t480000
TDS Payable u/s 194J\tDuties & Taxes\t0\t650000
Salaries Payable - March 2026\tCurrent Liabilities\t0\t4200000
Customer Advances - Annual Subscription\tSundry Debtors\t0\t2800000
Intellectual Property & Proprietary Algorithms\tFixed Assets\t35000000\t0
Computers, MacBooks & High-End Servers\tFixed Assets\t6500000\t0
Office Interior & Acoustical Booths\tFixed Assets\t1800000\t0
Capital WIP - AI LLM Engine Development\tFixed Assets\t8500000\t0
Security Deposit for Bandra Kurla Office\tDeposits (Asset)\t2400000\t0
Trade Receivables - Stripe Payments In Transit\tSundry Debtors\t7800000\t0
Trade Receivables - US Enterprise Clients (B2B)\tSundry Debtors\t14200000\t0
HDFC Bank Current Account 50200088912\tBank Accounts\t9500000\t0
Silicon Valley Bank (SVB USD Operating A/c)\tBank Accounts\t12400000\t0
Fixed Deposit with HDFC Bank (Bank Guarantee)\tBank Accounts\t5000000\t0
Prepaid Annual AWS Enterprise Support\tCurrent Assets\t850000\t0
GST Electronic Cash & Credit Ledger\tDuties & Taxes\t1200000\t0
Advance Tax Paid (FY 2025-26)\tCurrent Assets\t2500000\t0
Export SaaS Subscription Revenue (USD)\tSales Accounts\t0\t68000000
Domestic Enterprise SaaS Licenses\tSales Accounts\t0\t14200000
Interest on Sweep Fixed Deposits\tIndirect Incomes\t0\t650000
Software Engineer & DevOps Salaries\tDirect Expenses\t38500000\t0
AWS Cloud Hosting & Datacenter Compute\tDirect Expenses\t14200000\t0
Directors Remuneration\tIndirect Expenses\t7200000\t0
Office Rent - BKC Mumbai\tIndirect Expenses\t2880000\t0
Legal & Professional Fees (US Patent Filing)\tIndirect Expenses\t1450000\t0
Marketing, Google Ads & LinkedIn Campaigns\tIndirect Expenses\t4800000\t0
Software Subscriptions (Figma, GitHub, Slack)\tIndirect Expenses\t1250000\t0
Depreciation & Amortisation\tIndirect Expenses\t2400000\t0
Audit Fees (GPA & Co.)\tIndirect Expenses\t350000\t0
Bank & Wire Transfer Charges\tIndirect Expenses\t120000\t0
`.trim();
        return parseTabularTbContent(saasData);
      }
    },
    {
      id: "bharat_fmcg",
      clientName: "Bharat Agro-Trading LLP",
      cin: "AAV-8891",
      pan: "AAFFB8891L",
      industry: "FMCG & Agro-Commodities Trading",
      ledgerCount: 42,
      totalTurnoverCr: 34.6,
      isBalanced: true,
      varianceAmount: 0,
      description: "High-volume commodity distributor with multiple warehouse locations, grain stocks, and agricultural mandi cess.",
      dataGenerator: () => {
        const fmcgData = `
Partners Capital - Shri Rameshwar Patel\tCapital Account\t0\t15000000
Partners Capital - Shri Suresh Patel\tCapital Account\t0\t15000000
Partners Current A/c - Profit Sharing\tReserves & Surplus\t0\t8500000
State Bank of India Warehouse Term Loan\tSecured Loans\t0\t18500000
SBI Cash Credit / Mandi Pledge Limit\tBank OD A/c\t0\t24000000
Unsecured Loan from Relatives\tUnsecured Loans\t0\t4500000
Sundry Creditors - MP Mandi Farmers\tSundry Creditors\t0\t8400000
Sundry Creditors - Packaging & Jute Bags\tSundry Creditors\t0\t1250000
Mandi Tax & Krishi Upaj Mandi Cess Payable\tDuties & Taxes\t0\t420000
TDS Payable u/s 194Q / 206C(1H)\tDuties & Taxes\t0\t280000
Warehouse Labour Charges Payable\tCurrent Liabilities\t0\t650000
Commercial Grain Silo & Cold Storage\tFixed Assets\t28000000\t0
Grain Sorting & Weighbridge Machinery\tFixed Assets\t4500000\t0
Commercial Delivery Trucks (Tata 1613)\tFixed Assets\t3800000\t0
Office Computers & CCTV Security\tFixed Assets\t450000\t0
Wheat & Soybean Stock in Silos\tStock-in-hand\t18500000\t0
Gram & Pulses Stock in Cold Storage\tStock-in-hand\t12400000\t0
Sundry Debtors - ITC Limited (Agri Div)\tSundry Debtors\t16800000\t0
Sundry Debtors - Adani Wilmar Limited\tSundry Debtors\t14200000\t0
Sundry Debtors - Regional Wholesalers\tSundry Debtors\t8900000\t0
Cash in Hand (Mandi Imprest)\tCash-in-hand\t480000\t0
State Bank of India Mandi Branch Current A/c\tBank Accounts\t4200000\t0
Punjab National Bank Current A/c\tBank Accounts\t1850000\t0
Mandi Board Security Deposit\tDeposits (Asset)\t1500000\t0
TCS Receivable u/s 206C\tCurrent Assets\t320000\t0
Advance Income Tax Paid\tCurrent Assets\t1200000\t0
Sales - Wheat & Grain Formulations\tSales Accounts\t0\t185000000
Sales - Soybean & Oilseeds\tSales Accounts\t0\t145000000
Sales - Pulses & Agro Byproducts\tSales Accounts\t0\t16000000
Warehousing & Cold Storage Rental Income\tIndirect Incomes\t0\t1850000
Mandi Purchase - Wheat\tPurchase Accounts\t172000000\t0
Mandi Purchase - Soybean\tPurchase Accounts\t134000000\t0
Mandi Purchase - Pulses\tPurchase Accounts\t14800000\t0
Labour & Hamali Charges\tDirect Expenses\t3450000\t0
Jute Gunny Bags & Packaging\tDirect Expenses\t1850000\t0
Mandi Tax & Market Cess\tDirect Expenses\t4800000\t0
Freight Inward & Truck Transport\tDirect Expenses\t6200000\t0
Electricity & Silo Refrigeration\tDirect Expenses\t2450000\t0
Interest on SBI Cash Credit Limit\tIndirect Expenses\t2150000\t0
Partners Remuneration (Sec 40(b))\tIndirect Expenses\t3600000\t0
Audit & Legal Fees (GPA & Co.)\tIndirect Expenses\t200000\t0
`.trim();
        return parseTabularTbContent(fmcgData);
      }
    }
  ];

  // Handle Preset Selection
  const handleSelectPreset = (preset: TallyUploadPreset) => {
    const res = preset.dataGenerator();
    setParsedPreview(res);
    setDetectedClientMeta({
      name: preset.clientName,
      pan: preset.pan,
      cin: preset.cin
    });
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        // Validate format & reject unrelated documents (e.g. dummy PDFs, images)
        const formatCheck = validateTallyXmlOrTb(content, file.name);
        if (!formatCheck.isValid) {
          toast.error("Document Rejected", formatCheck.diagnostics.errorMessage || "File is not a valid Tally XML or Trial Balance export.");
          setParsedPreview(null);
          return;
        }

        let res: TbParseResult;
        const upperContent = content.toUpperCase();
        const isXbrl = upperContent.includes("<XBRL") || upperContent.includes("IN-GAAP") || upperContent.includes("IND-AS") || upperContent.includes("REVENUEFROMOPERATIONS");

        if (isXbrl) {
          const xbrlResult = parseXbrlFinancials(content);
          if (!xbrlResult.success || xbrlResult.schedule3Ledgers.length === 0) {
            toast.error("XBRL Parsing Error", xbrlResult.errors.join("; ") || "Could not extract financial schedules from XBRL.");
            setParsedPreview(null);
            return;
          }

          let totalDebit = 0;
          let totalCredit = 0;
          xbrlResult.schedule3Ledgers.forEach(l => {
            if (l.balanceType === "DR") totalDebit += l.closingBalance;
            else totalCredit += l.closingBalance;
          });

          res = {
            success: true,
            totalLedgers: xbrlResult.schedule3Ledgers.length,
            totalDebit,
            totalCredit,
            netDifference: Math.abs(totalDebit - totalCredit),
            isBalanced: Math.abs(totalDebit - totalCredit) < 1,
            ledgers: xbrlResult.schedule3Ledgers,
            errors: xbrlResult.errors,
            anomaliesSummary: {
              negativeCash: 0,
              suspenseAccounts: 0,
              debtorCreditBalances: 0,
              creditorDebitBalances: 0,
              inadmissiblePenalties: 0
            }
          };

          setDetectedClientMeta({
            name: xbrlResult.financials.companyName,
            pan: currentPan,
            cin: xbrlResult.financials.cin
          });

          setParsedPreview(res);
          toast.success("MCA AOC-4 XBRL Ingested", `Extracted ${res.totalLedgers} Schedule III heads for ${xbrlResult.financials.companyName} (${xbrlResult.financials.cin}).`);
          return;
        }

        if (file.name.endsWith(".xml") || content.trim().startsWith("<")) {
          res = parseTallyXmlContent(content);

          // Extract Company Name / PAN if present in Tally XML tags
          const compMatch = /<SVCURRENTCOMPANY>([\s\S]*?)<\/SVCURRENTCOMPANY>/i.exec(content) ||
                            /<COMPANY>([\s\S]*?)<\/COMPANY>/i.exec(content);
          const panMatch = /<INCOMETAXNUMBER>([\s\S]*?)<\/INCOMETAXNUMBER>/i.exec(content) ||
                           /<PAN>([\s\S]*?)<\/PAN>/i.exec(content);

          if (compMatch || panMatch) {
            setDetectedClientMeta({
              name: compMatch ? compMatch[1].trim() : currentClientName,
              pan: panMatch ? panMatch[1].trim() : currentPan,
              cin: "Auto-detected from Tally XML"
            });
          }
        } else {
          res = parseTabularTbContent(content);
        }

        if (res.ledgers.length === 0) {
          toast.error("Parsing Failed", "No valid ledger rows detected in file. Ensure format contains Ledger Name and Amounts.");
          setParsedPreview(null);
          return;
        }

        setParsedPreview(res);
        toast.success("File Parsed", `Extracted ${res.totalLedgers} ledgers from ${file.name}`);
      } catch (err: any) {
        toast.error("Parsing Error", err.message || "Failed to parse trial balance file");
        setParsedPreview(null);
      }
    };

    reader.readAsText(file);
  };

  // Handle Tabular Paste Parsing
  const handleParsePasted = () => {
    if (!pastedContent.trim()) {
      toast.error("Empty Data", "Please paste tabular columns copied from Excel or Tally.");
      return;
    }

    const upperPasted = pastedContent.toUpperCase();
    if (upperPasted.includes("<XBRL") || upperPasted.includes("IN-GAAP") || upperPasted.includes("REVENUEFROMOPERATIONS")) {
      const xbrlResult = parseXbrlFinancials(pastedContent);
      if (xbrlResult.success && xbrlResult.schedule3Ledgers.length > 0) {
        let totalDebit = 0;
        let totalCredit = 0;
        xbrlResult.schedule3Ledgers.forEach(l => {
          if (l.balanceType === "DR") totalDebit += l.closingBalance;
          else totalCredit += l.closingBalance;
        });

        const res: TbParseResult = {
          success: true,
          totalLedgers: xbrlResult.schedule3Ledgers.length,
          totalDebit,
          totalCredit,
          netDifference: Math.abs(totalDebit - totalCredit),
          isBalanced: Math.abs(totalDebit - totalCredit) < 1,
          ledgers: xbrlResult.schedule3Ledgers,
          errors: xbrlResult.errors,
          anomaliesSummary: {
            negativeCash: 0,
            suspenseAccounts: 0,
            debtorCreditBalances: 0,
            creditorDebitBalances: 0,
            inadmissiblePenalties: 0
          }
        };

        setDetectedClientMeta({
          name: xbrlResult.financials.companyName,
          pan: currentPan,
          cin: xbrlResult.financials.cin
        });

        setParsedPreview(res);
        toast.success("Pasted MCA XBRL Parsed", `Extracted ${res.totalLedgers} Schedule III ledgers from AOC-4 XBRL.`);
        return;
      }
    }

    const res = parseTabularTbContent(pastedContent);
    if (res.ledgers.length === 0) {
      toast.error("Parsing Failed", "Could not identify columns. Expected: [Ledger Name] [Debit] [Credit]");
      setParsedPreview(null);
      return;
    }

    setParsedPreview(res);
    toast.success("Pasted Data Parsed", `Successfully extracted ${res.totalLedgers} ledgers.`);
  };

  // Confirm and Apply Data to Parent Workbench
  const handleConfirmApply = () => {
    if (!parsedPreview) return;
    onApplyTbData(parsedPreview, detectedClientMeta || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-btred-logo text-white flex items-center justify-center font-bold shadow-md">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Tally XML &amp; Trial Balance Ingestion Desk</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                  Companies Act Sec 129
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Deterministic ingestion of Tally Prime XML, Excel tabular dumps, and General Ledger closing balances.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab("PRESETS")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === "PRESETS" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CA Firm Industry Presets (4)</span>
          </button>

          <button
            onClick={() => setActiveTab("UPLOAD")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === "UPLOAD" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Tally XML / File</span>
          </button>

          <button
            onClick={() => setActiveTab("PASTE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === "PASTE" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Paste Tabular Excel TB</span>
          </button>

          <button
            onClick={() => setActiveTab("TALLY_GUIDE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === "TALLY_GUIDE" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tally Prime Export Guide</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-auto space-y-4 pr-1">
          
          {/* TAB 1: PRESETS */}
          {activeTab === "PRESETS" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Select a production-grade statutory client preset to simulate real audit scenarios with mathematical and anomaly verification:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presets.map((p) => {
                  const isSelected = parsedPreview && detectedClientMeta?.pan === p.pan;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer text-left space-y-2 ${
                        isSelected 
                          ? "border-btred-logo bg-red-50/40 shadow-sm" 
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black tracking-wider text-btred-logo bg-red-100/70 px-2 py-0.5 rounded-lg">
                          {p.industry}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          p.isBalanced ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {p.isBalanced ? "Balanced (₹0 Var)" : `Unbalanced (₹${(p.varianceAmount / 10000000).toFixed(2)} Cr)`}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{p.clientName}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{p.description}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <span>PAN: <strong>{p.pan}</strong></span>
                        <span>{p.ledgerCount} Ledgers</span>
                        <span>Turnover: <strong>₹{p.totalTurnoverCr} Cr</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === "UPLOAD" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition ${
                  isDragging 
                    ? "border-btred-logo bg-red-50/50" 
                    : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,.csv,.txt,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-btred-logo flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedFile ? selectedFile.name : "Drag & Drop Tally XML, CSV or Tabular TB File"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Tally Prime 3.0/4.0 XML exports, SAP Business One Trial Balances, and Excel CSV formats.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Click to Browse Computer</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PASTE EXCEL TB */}
          {activeTab === "PASTE" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Paste Columns Copied Directly from Excel or Tally:
                </span>
                <span className="text-[11px] text-slate-500">
                  Recognized columns: <code>Ledger Name</code>, <code>Tally Parent</code>, <code>Debit</code>, <code>Credit</code>
                </span>
              </div>
              <textarea
                rows={9}
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="Ledger Name&#9;Parent Group&#9;Debit&#9;Credit&#10;Equity Share Capital&#9;Capital Account&#9;0&#9;10000000&#10;HDFC Bank Current A/c&#9;Bank Accounts&#9;4500000&#9;0&#10;Factory Plant & Machinery&#9;Fixed Assets&#9;12500000&#9;0&#10;Domestic Sales&#9;Sales Accounts&#9;0&#9;48500000"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-logo"
              />
              <button
                onClick={handleParsePasted}
                className="px-4 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse &amp; Auto-Map Tabular Data</span>
              </button>
            </div>
          )}

          {/* TAB 4: TALLY EXPORT GUIDE */}
          {activeTab === "TALLY_GUIDE" && (
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 text-xs text-slate-700 space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-btred-logo" />
                How to Export XML Trial Balance from Tally Prime (3-Step Guide)
              </h4>
              <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                <li>
                  <strong>Navigate to Trial Balance in Tally Prime:</strong><br />
                  From Gateway of Tally, press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">D</kbd> &gt; <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">T</kbd> (Display More Reports &gt; Trial Balance).
                </li>
                <li>
                  <strong>Set Detailed View (Alt + F5):</strong><br />
                  Press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">Alt + F5</kbd> to expand all primary sub-groups and child ledgers.
                </li>
                <li>
                  <strong>Export in XML Format (Alt + E):</strong><br />
                  Press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">Alt + E</kbd> &gt; Select <strong>Current</strong> &gt; Press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">C</kbd> (Configure).<br />
                  Set <strong>File Format</strong> to <code>XML (Data Interchange)</code>.<br />
                  Set <strong>Show Opening Balances</strong> to <code>Yes</code> and <strong>Show Transactions</strong> to <code>Yes</code>.<br />
                  Press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">Ctrl + A</kbd> to save and press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">E</kbd> (Send).
                </li>
              </ol>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>CA Audit Tip:</strong> Always verify that Closing Stock is included in the export. If Tally stores Closing Stock in the Stock Summary without ledger double-entry, use our 1-click <em>"Trial Balance Balancing Assistant"</em> to incorporate inventory into Current Assets (Note 16).
              </div>
            </div>
          )}

          {/* PARSED PREVIEW SUMMARY CARD */}
          {parsedPreview && (
            <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-xs">
                    Ingestion Pre-flight Verification Digest
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {detectedClientMeta ? `${detectedClientMeta.name} (${detectedClientMeta.pan})` : currentClientName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Ledgers</span>
                  <span className="text-base font-black text-slate-900">{parsedPreview.totalLedgers}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Debit (Dr)</span>
                  <span className="text-base font-black text-slate-900">{formatCurrencyINR(parsedPreview.totalDebit)}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Credit (Cr)</span>
                  <span className="text-base font-black text-slate-900">{formatCurrencyINR(parsedPreview.totalCredit)}</span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  parsedPreview.isBalanced 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}>
                  <span className="text-[10px] block uppercase font-bold">TB Balance Status</span>
                  <span className="text-base font-black">
                    {parsedPreview.isBalanced ? "Balanced (₹0)" : formatCurrencyINR(parsedPreview.netDifference)}
                  </span>
                </div>
              </div>

              {/* Anomaly Watchdog Summary */}
              {parsedPreview.anomaliesSummary && (
                <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                  <span className="font-bold text-slate-600">Audit Flags:</span>
                  {parsedPreview.anomaliesSummary.negativeCash > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                      {parsedPreview.anomaliesSummary.negativeCash} Negative Cash Balance
                    </span>
                  )}
                  {parsedPreview.anomaliesSummary.debtorCreditBalances > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                      {parsedPreview.anomaliesSummary.debtorCreditBalances} Customer Advance (Credit Balance)
                    </span>
                  )}
                  {parsedPreview.anomaliesSummary.inadmissiblePenalties > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                      {parsedPreview.anomaliesSummary.inadmissiblePenalties} Penalty Ledger (Sec 37(1))
                    </span>
                  )}
                  {parsedPreview.anomaliesSummary.suspenseAccounts === 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      0 Suspense Balances
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmApply}
            disabled={!parsedPreview}
            className={`px-5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              parsedPreview
                ? "bg-btred-logo hover:bg-red-700 text-white shadow-md cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Apply to Schedule III Workbench</span>
          </button>
        </div>
      </div>
    </div>
  );
};
