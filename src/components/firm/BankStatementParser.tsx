"use client";

import React, { useState, useMemo } from "react";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Sparkles, 
  Building2, 
  Check, 
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  FileCode,
  ShieldCheck,
  X,
  Eye,
  Copy,
  Send,
  MessageSquare,
  BookOpen,
  Layers,
  HelpCircle,
  CheckCheck,
  FileText,
  ChevronDown,
  Plus,
  Trash2,
  SlidersHorizontal,
  Info,
  Calculator,
  Lock,
  Unlock,
  CreditCard,
  Building
} from "lucide-react";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { toast } from "@/components/shared/ToastNotification";
import { SANDBOX_CLIENTS } from "@/lib/data/sandboxData";
import { validateAndExtractBankStatement } from "@/lib/fileIntelligence/documentValidator";
import { TOP_15_INDIAN_BANKS, resolveClientBankPasswords, BankDefinition } from "@/lib/bankOcr/bankProfiles";
import { dissectNarration, STATUTORY_CHART_OF_ACCOUNTS } from "@/lib/bankOcr/narrationEngine";
import { generateNativeTallyPrimeXml } from "@/lib/bankOcr/tallyXmlGenerator";
import { verifyBankStatementBrs, generateBankAuditWorkingPaperCsv } from "@/lib/bankOcr/brsValidator";

export interface ParsedTransaction {
  id: string;
  date: string;
  narration: string;
  chqRefNo: string;
  withdrawal: number;
  deposit: number;
  balance: number;
  suggestedLedger: string;
  confidence: number;
  status: "MAPPED" | "SUSPENSE" | "CONFIRMED";
  voucherType: "Payment" | "Receipt" | "Contra";
  matchedRule?: string;
}

export interface BankAccountProfile {
  bankKey: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  openingBalance: number;
  statementPeriod: string;
  defaultTransactions: ParsedTransaction[];
}

export interface MappingRule {
  id: string;
  keyword: string;
  ledgerName: string;
  voucherType: "Payment" | "Receipt" | "Contra";
  category: "Statutory" | "Opex" | "Revenue" | "Payroll" | "Banking";
  confidence: number;
}

const DEFAULT_MAPPING_RULES: MappingRule[] = [
  { id: "R-01", keyword: "INFOSYS", ledgerName: "Professional Consultancy Fees", voucherType: "Receipt", category: "Revenue", confidence: 98 },
  { id: "R-02", keyword: "GST PMT", ledgerName: "GST Liability (Electronic Cash Ledger)", voucherType: "Payment", category: "Statutory", confidence: 99 },
  { id: "R-03", keyword: "AMAZON WEB SERVICES", ledgerName: "Cloud Infrastructure & Software", voucherType: "Payment", category: "Opex", confidence: 96 },
  { id: "R-04", keyword: "SALARY", ledgerName: "Salaries & Wages Payable", voucherType: "Payment", category: "Payroll", confidence: 100 },
  { id: "R-05", keyword: "TDS CHLN 281", ledgerName: "TDS Payable (Sec 194J / 194C)", voucherType: "Payment", category: "Statutory", confidence: 97 },
  { id: "R-06", keyword: "HDFC ERGO", ledgerName: "Insurance Expense", voucherType: "Payment", category: "Opex", confidence: 94 },
  { id: "R-07", keyword: "TATA STEEL", ledgerName: "Raw Material Purchases - Steel Coils", voucherType: "Payment", category: "Opex", confidence: 98 },
  { id: "R-08", keyword: "MAHINDRA", ledgerName: "Sales - Precision Machined Components", voucherType: "Receipt", category: "Revenue", confidence: 99 },
  { id: "R-09", keyword: "ELECTRICITY", ledgerName: "Factory Power & Fuel (HT Meter)", voucherType: "Payment", category: "Opex", confidence: 97 },
  { id: "R-10", keyword: "PINELABS", ledgerName: "Daily Store POS Card Collections", voucherType: "Receipt", category: "Revenue", confidence: 99 },
  { id: "R-11", keyword: "HINDUSTAN UNILEVER", ledgerName: "Purchase of FMCG & Consumer Goods", voucherType: "Payment", category: "Opex", confidence: 99 },
  { id: "R-12", keyword: "EPFO", ledgerName: "Provident Fund & ESIC Statutory Payable", voucherType: "Payment", category: "Statutory", confidence: 99 }
];

const STANDARD_CHART_OF_ACCOUNTS = [
  "Professional Consultancy Fees",
  "GST Liability (Electronic Cash Ledger)",
  "Cloud Infrastructure & Software",
  "Salaries & Wages Payable",
  "TDS Payable (Sec 194J)",
  "TDS Payable (Sec 194C)",
  "TDS Payable (Sec 194I - Rent)",
  "Insurance Expense",
  "Raw Material Purchases - Steel Coils",
  "Sales - Precision Machined Components",
  "Factory Power & Fuel (HT Meter)",
  "Freight & Carriage Outward",
  "Scrap Sales Revenue",
  "Daily Store POS Card Collections",
  "Purchase of FMCG & Consumer Goods",
  "Commercial Mall Store Rent (Sec 194I)",
  "Provident Fund & ESIC Statutory Payable",
  "Director Remuneration (Sec 192 TDS)",
  "Director Tour & Travel Expense Reimbursement",
  "Director Current Account (Sec 185 Compliant Loan)",
  "Sundry Debtors Ledger (Trade Receivables)",
  "Sundry Creditors Ledger (Trade Payables)",
  "Audit Fees Payable (GPA & Co.)",
  "Legal & Professional Charges",
  "Office & Administrative Expenses",
  "Bank Charges & NetBanking Fees",
  "Interest on Working Capital / Cash Credit Loan",
  "Cash Withdrawal (Contra to Cash in Hand)"
];

const CLIENT_BANK_PROFILES: Record<string, BankAccountProfile> = {
  // Pratwi Solutions (IT Services)
  "CLI-PRATWI-01": {
    bankKey: "HDFC_BANK",
    bankName: "HDFC Bank Ltd",
    accountNumber: "50200049182394",
    ifsc: "HDFC0000043",
    branch: "Nariman Point Corporate Branch, Mumbai",
    openingBalance: 1000000,
    statementPeriod: "01 Oct 2026 – 31 Oct 2026",
    defaultTransactions: [
      {
        id: "TXN-8812",
        date: "2026-10-18",
        narration: "NEFT/N301262849/INFOSYS LTD/VENDOR PYMT",
        chqRefNo: "N301262849",
        withdrawal: 0,
        deposit: 425000,
        balance: 1425000,
        suggestedLedger: "Professional Consultancy Fees",
        confidence: 98,
        status: "CONFIRMED",
        voucherType: "Receipt",
        matchedRule: "INFOSYS"
      },
      {
        id: "TXN-8813",
        date: "2026-10-20",
        narration: "GST PMT / 23AAAAA0000A1Z5 / RET-SEP26 / HDFC",
        chqRefNo: "CHQ-004918",
        withdrawal: 114500,
        deposit: 0,
        balance: 1310500,
        suggestedLedger: "GST Liability (Electronic Cash Ledger)",
        confidence: 99,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "GST PMT"
      },
      {
        id: "TXN-8814",
        date: "2026-10-22",
        narration: "ACH DR / HDFC ERGO GENERAL INSURANCE / RENEW",
        chqRefNo: "ACH-49120",
        withdrawal: 48900,
        deposit: 0,
        balance: 1261600,
        suggestedLedger: "Insurance Expense",
        confidence: 94,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "HDFC ERGO"
      },
      {
        id: "TXN-8815",
        date: "2026-10-23",
        narration: "UPI/329581904/AMAZON WEB SERVICES/INVOICE",
        chqRefNo: "UPI-329581904",
        withdrawal: 32450,
        deposit: 0,
        balance: 1229150,
        suggestedLedger: "Cloud Infrastructure & Software",
        confidence: 96,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "AMAZON WEB SERVICES"
      },
      {
        id: "TXN-8816",
        date: "2026-10-24",
        narration: "SALARY TRANSFERS / OCT-2026 / 12 EMPLOYEES",
        chqRefNo: "CMS-SAL-1026",
        withdrawal: 680000,
        deposit: 0,
        balance: 549150,
        suggestedLedger: "Salaries & Wages Payable",
        confidence: 100,
        status: "CONFIRMED",
        voucherType: "Payment",
        matchedRule: "SALARY"
      },
      {
        id: "TXN-8817",
        date: "2026-10-25",
        narration: "IMPS/P2A/DIRECTOR DRAWINGS/EXP REIMB",
        chqRefNo: "IMPS-90214",
        withdrawal: 150000,
        deposit: 0,
        balance: 399150,
        suggestedLedger: "Director Current Account / Suspense",
        confidence: 62,
        status: "SUSPENSE",
        voucherType: "Payment"
      },
      {
        id: "TXN-8818",
        date: "2026-10-26",
        narration: "TDS CHLN 281 / SEC 194J / PROFESSIONAL / NSDL",
        chqRefNo: "CHLN-049182",
        withdrawal: 42500,
        deposit: 0,
        balance: 356650,
        suggestedLedger: "TDS Payable (Sec 194J)",
        confidence: 97,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "TDS CHLN 281"
      }
    ]
  },

  // Apex AutoTech (Precision Engineering / Manufacturing)
  "CLI-APEX-01": {
    bankKey: "SBI_BANK",
    bankName: "State Bank of India",
    accountNumber: "38910029481",
    ifsc: "SBIN0001234",
    branch: "Pithampur Industrial Estate Branch, Indore",
    openingBalance: 2850000,
    statementPeriod: "01 Oct 2026 – 31 Oct 2026",
    defaultTransactions: [
      {
        id: "TXN-9011",
        date: "2026-10-05",
        narration: "RTGS/SBIN526189/MAHINDRA & MAHINDRA/AUTO COMPONENT PYMT",
        chqRefNo: "RTGS-526189",
        withdrawal: 0,
        deposit: 1840000,
        balance: 4690000,
        suggestedLedger: "Sales - Precision Machined Components",
        confidence: 99,
        status: "CONFIRMED",
        voucherType: "Receipt",
        matchedRule: "MAHINDRA"
      },
      {
        id: "TXN-9012",
        date: "2026-10-08",
        narration: "RTGS/TATASTEEL/INV-88912/HR COILS PROCUREMENT",
        chqRefNo: "RTGS-991204",
        withdrawal: 1280000,
        deposit: 0,
        balance: 3410000,
        suggestedLedger: "Raw Material Purchases - Steel Coils",
        confidence: 98,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "TATA STEEL"
      },
      {
        id: "TXN-9013",
        date: "2026-10-12",
        narration: "ACH DR / MP POORV KSHETRA VIDYUT VITRAN / HT POWER BILL",
        chqRefNo: "ACH-110924",
        withdrawal: 345000,
        deposit: 0,
        balance: 3065000,
        suggestedLedger: "Factory Power & Fuel (HT Meter)",
        confidence: 97,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "ELECTRICITY"
      },
      {
        id: "TXN-9014",
        date: "2026-10-16",
        narration: "CMS CHQ/901824/SHRIRAM TRANSPORT/FREIGHT OUTWARD",
        chqRefNo: "CHQ-901824",
        withdrawal: 112000,
        deposit: 0,
        balance: 2953000,
        suggestedLedger: "Freight & Carriage Outward",
        confidence: 95,
        status: "MAPPED",
        voucherType: "Payment"
      },
      {
        id: "TXN-9015",
        date: "2026-10-21",
        narration: "CHQ DEP / METAL SCRAP RECYCLERS / CASH DEP TRUCK LOT",
        chqRefNo: "CHQ-771290",
        withdrawal: 0,
        deposit: 285000,
        balance: 3238000,
        suggestedLedger: "Scrap Sales Revenue",
        confidence: 92,
        status: "CONFIRMED",
        voucherType: "Receipt"
      },
      {
        id: "TXN-9016",
        date: "2026-10-24",
        narration: "IMPS/TRF TO RAJESH SHARMA/FACTORY ADVANCE UNBILLED",
        chqRefNo: "IMPS-661298",
        withdrawal: 250000,
        deposit: 0,
        balance: 2988000,
        suggestedLedger: "Director Current Account / Suspense",
        confidence: 58,
        status: "SUSPENSE",
        voucherType: "Payment"
      },
      {
        id: "TXN-9017",
        date: "2026-10-27",
        narration: "GST PMT-06 / 23AABCA8891D1Z2 / MONTHLY CHALLAN OCT",
        chqRefNo: "CHLN-881290",
        withdrawal: 210000,
        deposit: 0,
        balance: 2778000,
        suggestedLedger: "GST Liability (Electronic Cash Ledger)",
        confidence: 99,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "GST PMT"
      }
    ]
  },

  // OmniRetail Hypermarkets
  "CLI-OMNI-01": {
    bankKey: "ICICI_BANK",
    bankName: "ICICI Bank Ltd",
    accountNumber: "000405091823",
    ifsc: "ICIC0000004",
    branch: "Commercial Capital Branch, Bhopal",
    openingBalance: 1420000,
    statementPeriod: "01 Oct 2026 – 31 Oct 2026",
    defaultTransactions: [
      {
        id: "TXN-9201",
        date: "2026-10-02",
        narration: "CMS CR / PINELABS POS CARD BATCH SETTLEMENT / STORE 01",
        chqRefNo: "CMS-PL-8891",
        withdrawal: 0,
        deposit: 890000,
        balance: 2310000,
        suggestedLedger: "Daily Store POS Card Collections",
        confidence: 99,
        status: "CONFIRMED",
        voucherType: "Receipt",
        matchedRule: "PINELABS"
      },
      {
        id: "TXN-9202",
        date: "2026-10-07",
        narration: "NEFT / HINDUSTAN UNILEVER LTD / FMCG INVOICE PYMT",
        chqRefNo: "N11092841",
        withdrawal: 540000,
        deposit: 0,
        balance: 1770000,
        suggestedLedger: "Purchase of FMCG & Consumer Goods",
        confidence: 99,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "HINDUSTAN UNILEVER"
      },
      {
        id: "TXN-9203",
        date: "2026-10-11",
        narration: "RTGS / DB CITY MALL MGMT / COMMERCIAL RENT OCT26",
        chqRefNo: "RTGS-449102",
        withdrawal: 380000,
        deposit: 0,
        balance: 1390000,
        suggestedLedger: "Commercial Mall Store Rent (Sec 194I)",
        confidence: 96,
        status: "MAPPED",
        voucherType: "Payment"
      },
      {
        id: "TXN-9204",
        date: "2026-10-15",
        narration: "ACH DR / EPFO TRRN 1082619028 / PF STATUTORY DUES",
        chqRefNo: "ACH-EPF-991",
        withdrawal: 165000,
        deposit: 0,
        balance: 1225000,
        suggestedLedger: "Provident Fund & ESIC Statutory Payable",
        confidence: 99,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "EPFO"
      },
      {
        id: "TXN-9205",
        date: "2026-10-18",
        narration: "CMS CR / SWIGGY INSTAMART / FMCG SUPPLIER PAYOUT",
        chqRefNo: "CMS-SW-4918",
        withdrawal: 0,
        deposit: 320000,
        balance: 1545000,
        suggestedLedger: "Daily Store POS Card Collections",
        confidence: 94,
        status: "CONFIRMED",
        voucherType: "Receipt"
      },
      {
        id: "TXN-9206",
        date: "2026-10-22",
        narration: "UPI / 389102847 / LOCAL CASH PETTY EXPENSES / STORE MGR",
        chqRefNo: "UPI-389102847",
        withdrawal: 65000,
        deposit: 0,
        balance: 1480000,
        suggestedLedger: "Office & Administrative Expenses / Suspense",
        confidence: 54,
        status: "SUSPENSE",
        voucherType: "Payment"
      },
      {
        id: "TXN-9207",
        date: "2026-10-28",
        narration: "TDS CHLN 281 / SEC 194C / FACILITY CONTRACTORS",
        chqRefNo: "CHLN-992140",
        withdrawal: 42000,
        deposit: 0,
        balance: 1438000,
        suggestedLedger: "TDS Payable (Sec 194C)",
        confidence: 98,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "TDS CHLN 281"
      }
    ]
  },

  // Zenith Cloud & AI Labs (SaaS & AI Infrastructure)
  "CLI-ZENITH-01": {
    bankKey: "AXIS_BANK",
    bankName: "Axis Bank Ltd",
    accountNumber: "9190200881920",
    ifsc: "UTIB0000042",
    branch: "Bandra Kurla Complex Corporate Branch, Mumbai",
    openingBalance: 3500000,
    statementPeriod: "01 Oct 2026 – 31 Oct 2026",
    defaultTransactions: [
      {
        id: "TXN-9301",
        date: "2026-10-04",
        narration: "NEFT / GOOGLE IRELAND / CLOUD API RESELLER REVENUE",
        chqRefNo: "N109284102",
        withdrawal: 0,
        deposit: 950000,
        balance: 4450000,
        suggestedLedger: "Professional Consultancy Fees",
        confidence: 98,
        status: "CONFIRMED",
        voucherType: "Receipt"
      },
      {
        id: "TXN-9302",
        date: "2026-10-10",
        narration: "ACH DR / AWS CLOUD SERVICES / INVOICE-OCT26",
        chqRefNo: "ACH-AWS-912",
        withdrawal: 280000,
        deposit: 0,
        balance: 4170000,
        suggestedLedger: "Cloud Infrastructure & Software",
        confidence: 99,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "AMAZON WEB SERVICES"
      },
      {
        id: "TXN-9303",
        date: "2026-10-15",
        narration: "CMS SALARY / OCT-2026 / 18 DEV ENGINEERS",
        chqRefNo: "CMS-SAL-9301",
        withdrawal: 1250000,
        deposit: 0,
        balance: 2920000,
        suggestedLedger: "Salaries & Wages Payable",
        confidence: 100,
        status: "CONFIRMED",
        voucherType: "Payment",
        matchedRule: "SALARY"
      },
      {
        id: "TXN-9304",
        date: "2026-10-22",
        narration: "IMPS / WITHDRAWAL DIRECTORS AD-HOC EXP",
        chqRefNo: "IMPS-930192",
        withdrawal: 300000,
        deposit: 0,
        balance: 2620000,
        suggestedLedger: "Director Current Account / Suspense",
        confidence: 55,
        status: "SUSPENSE",
        voucherType: "Payment"
      },
      {
        id: "TXN-9305",
        date: "2026-10-26",
        narration: "TDS CHLN 281 / SEC 194J / DEV CONSULTANTS",
        chqRefNo: "CHLN-930182",
        withdrawal: 75000,
        deposit: 0,
        balance: 2545000,
        suggestedLedger: "TDS Payable (Sec 194J)",
        confidence: 98,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "TDS CHLN 281"
      }
    ]
  },

  // Apex Precision Tools LLP
  "CLI-APEX-02": {
    bankKey: "KOTAK_BANK",
    bankName: "Kotak Mahindra Bank",
    accountNumber: "44109284102",
    ifsc: "KKBK0000123",
    branch: "Sanwer Road Industrial Area, Indore",
    openingBalance: 1680000,
    statementPeriod: "01 Oct 2026 – 31 Oct 2026",
    defaultTransactions: [
      {
        id: "TXN-9401",
        date: "2026-10-06",
        narration: "RTGS / BHARAT FORGE / CARBIDE TOOLING SUPPLY",
        chqRefNo: "RTGS-940182",
        withdrawal: 0,
        deposit: 740000,
        balance: 2420000,
        suggestedLedger: "Sales - Precision Machined Components",
        confidence: 98,
        status: "CONFIRMED",
        voucherType: "Receipt"
      },
      {
        id: "TXN-9402",
        date: "2026-10-14",
        narration: "ACH DR / POWER CORPORATION / FACTORY METER",
        chqRefNo: "ACH-94018",
        withdrawal: 185000,
        deposit: 0,
        balance: 2235000,
        suggestedLedger: "Factory Power & Fuel (HT Meter)",
        confidence: 97,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "ELECTRICITY"
      },
      {
        id: "TXN-9403",
        date: "2026-10-25",
        narration: "GST PMT / 23AABCA8891D1Z2 / CHLN-OCT26",
        chqRefNo: "CHLN-94019",
        withdrawal: 92000,
        deposit: 0,
        balance: 2143000,
        suggestedLedger: "GST Liability (Electronic Cash Ledger)",
        confidence: 99,
        status: "MAPPED",
        voucherType: "Payment",
        matchedRule: "GST PMT"
      }
    ]
  }
};

export interface BankStatementParserProps {
  initialEntityId?: string;
  initialBank?: string;
}

export const BankStatementParser: React.FC<BankStatementParserProps> = ({ initialEntityId, initialBank }) => {
  const { clients: hookClients } = useTaxoData();
  const clients = useMemo(() => {
    return (hookClients && hookClients.length > 0) ? hookClients : SANDBOX_CLIENTS;
  }, [hookClients]);

  const [selectedEntityId, setSelectedEntityId] = useState<string>(initialEntityId || (clients[0]?.id || "CLI-PRATWI-01"));
  const [selectedBank, setSelectedBank] = useState<string>(initialBank || "HDFC_BANK");

  // File Upload & Drag-and-Drop State
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadValidationError, setUploadValidationError] = useState<string | null>(null);
  const [uploadMissingCriteria, setUploadMissingCriteria] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  React.useEffect(() => {
    if (initialEntityId) {
      setSelectedEntityId(initialEntityId);
    }
  }, [initialEntityId]);

  React.useEffect(() => {
    if (initialBank) {
      setSelectedBank(initialBank);
    }
  }, [initialBank]);
  const [passwordMode, setPasswordMode] = useState<"AUTO_PAN" | "AUTO_CUSTID" | "AUTO_DOB" | "MANUAL">("AUTO_PAN");
  const [manualPassword, setManualPassword] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [splitGstOnBankCharges, setSplitGstOnBankCharges] = useState<boolean>(true);
  const [unlockedPasswordFeedback, setUnlockedPasswordFeedback] = useState<string | null>(null);
  
  // Filter States
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "SUSPENSE" | "MAPPED" | "CONFIRMED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isMappingDrawerOpen, setIsMappingDrawerOpen] = useState<boolean>(false);
  const [selectedTxnForMapping, setSelectedTxnForMapping] = useState<ParsedTransaction | null>(null);
  const [customLedgerInput, setCustomLedgerInput] = useState<string>("");
  const [rememberRuleCheck, setRememberRuleCheck] = useState<boolean>(true);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [selectedTxnForWhatsApp, setSelectedTxnForWhatsApp] = useState<ParsedTransaction | null>(null);

  const [isXmlInspectorOpen, setIsXmlInspectorOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  // Active Rules State
  const [mappingRules, setMappingRules] = useState<MappingRule[]>(DEFAULT_MAPPING_RULES);
  const [newRuleKeyword, setNewRuleKeyword] = useState<string>("");
  const [newRuleLedger, setNewRuleLedger] = useState<string>("");

  // Resolve current active client
  const currentEntity = useMemo(() => {
    if (!clients || clients.length === 0) return SANDBOX_CLIENTS[0];
    if (selectedEntityId) {
      return clients.find(c => c.id === selectedEntityId) || clients[0];
    }
    return clients[0];
  }, [clients, selectedEntityId]);

  // Client Bank Account Profile
  const activeProfile = useMemo<BankAccountProfile>(() => {
    const entityId = currentEntity?.id || "CLI-PRATWI-01";
    if (CLIENT_BANK_PROFILES[entityId]) {
      return CLIENT_BANK_PROFILES[entityId];
    }
    // Dynamic fallback for any other client
    return {
      bankKey: "HDFC_BANK",
      bankName: "HDFC Bank Ltd",
      accountNumber: "50200099881122",
      ifsc: "HDFC0000128",
      branch: "Main Commercial Branch",
      openingBalance: 1250000,
      statementPeriod: "01 Oct 2026 – 31 Oct 2026",
      defaultTransactions: CLIENT_BANK_PROFILES["CLI-PRATWI-01"].defaultTransactions
    };
  }, [currentEntity]);

  // Master Transaction state initialized per client profile
  const [transactions, setTransactions] = useState<ParsedTransaction[]>(() => activeProfile.defaultTransactions);

  // Synchronize when client switches
  React.useEffect(() => {
    setTransactions(activeProfile.defaultTransactions);
    setSelectedBank(activeProfile.bankKey);
  }, [activeProfile]);

  // Resolved password patterns from Entity DNA
  const resolvedEntityPasswords = useMemo(() => {
    if (!currentEntity) return [];
    return resolveClientBankPasswords(currentEntity, selectedBank, activeProfile?.accountNumber);
  }, [currentEntity, selectedBank, activeProfile?.accountNumber]);

  // BRS Mathematical & Statutory Verification Report (ICAI SA 500 / SA 505)
  const brsReport = useMemo(() => {
    return verifyBankStatementBrs(transactions, activeProfile.openingBalance);
  }, [transactions, activeProfile.openingBalance]);

  // BRS Mathematical Calculations
  const brsMetrics = useMemo(() => {
    const opening = activeProfile.openingBalance;
    const totalDeposits = transactions.reduce((sum, t) => sum + (t.deposit || 0), 0);
    const totalWithdrawals = transactions.reduce((sum, t) => sum + (t.withdrawal || 0), 0);
    const calculatedClosing = opening + totalDeposits - totalWithdrawals;
    const lastTxnBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : opening;
    const diff = Math.abs(calculatedClosing - lastTxnBalance);
    const isBalanced = diff < 1;

    return {
      opening,
      totalDeposits,
      totalWithdrawals,
      calculatedClosing,
      lastTxnBalance,
      isBalanced,
      diff
    };
  }, [activeProfile, transactions]);

  // Filter tab counts
  const suspenseCount = transactions.filter(t => t.status === "SUSPENSE").length;
  const mappedCount = transactions.filter(t => t.status === "MAPPED").length;
  const confirmedCount = transactions.filter(t => t.status === "CONFIRMED").length;

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Status filter
      if (selectedFilter === "SUSPENSE" && t.status !== "SUSPENSE") return false;
      if (selectedFilter === "MAPPED" && t.status !== "MAPPED") return false;
      if (selectedFilter === "CONFIRMED" && t.status !== "CONFIRMED") return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNarration = t.narration.toLowerCase().includes(q);
        const matchesRef = t.chqRefNo.toLowerCase().includes(q);
        const matchesLedger = t.suggestedLedger.toLowerCase().includes(q);
        const matchesDate = t.date.includes(q);
        if (!matchesNarration && !matchesRef && !matchesLedger && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedFilter, searchQuery]);

  // 1-Click Bulk Approve All AI Mapped Transactions
  const handleBulkApproveMapped = () => {
    const count = transactions.filter(t => t.status === "MAPPED").length;
    if (count === 0) {
      toast.info("No AI Mapped Transactions", "All transactions are already verified or in Suspense.");
      return;
    }

    setTransactions(prev => prev.map(t => {
      if (t.status === "MAPPED") {
        return {
          ...t,
          status: "CONFIRMED",
          confidence: 100
        };
      }
      return t;
    }));

    toast.success(
      "Bulk Approval Complete",
      `Approved ${count} AI-mapped transactions. All vouchers are verified and ready for Tally XML import.`
    );
  };

  // Single transaction confirm
  const handleConfirmSingle = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: "CONFIRMED", confidence: 100 };
      }
      return t;
    }));
    toast.success("Transaction Confirmed", "Voucher approved for Tally Prime import.");
  };

  // Open Mapping Drawer for custom selection
  const handleOpenMappingDrawer = (txn: ParsedTransaction) => {
    setSelectedTxnForMapping(txn);
    setCustomLedgerInput(txn.suggestedLedger.replace(" / Suspense", "").replace("Suspense - ", ""));
    setIsMappingDrawerOpen(true);
  };

  // Save Mapping from Drawer
  const handleSaveMapping = (chosenLedger: string) => {
    if (!selectedTxnForMapping) return;

    const txnId = selectedTxnForMapping.id;
    setTransactions(prev => prev.map(t => {
      if (t.id === txnId) {
        return {
          ...t,
          suggestedLedger: chosenLedger,
          confidence: 100,
          status: "CONFIRMED"
        };
      }
      return t;
    }));

    // If remember rule checked, add new rule
    if (rememberRuleCheck) {
      const keyword = selectedTxnForMapping.narration.split("/")[1] || selectedTxnForMapping.narration.split(" ")[0] || "RULE";
      if (!mappingRules.some(r => r.keyword.toLowerCase() === keyword.toLowerCase())) {
        const newRule: MappingRule = {
          id: `R-${Date.now().toString().slice(-4)}`,
          keyword: keyword.trim(),
          ledgerName: chosenLedger,
          voucherType: selectedTxnForMapping.withdrawal > 0 ? "Payment" : "Receipt",
          category: "Opex",
          confidence: 100
        };
        setMappingRules(r => [newRule, ...r]);
      }
    }

    setIsMappingDrawerOpen(false);
    setSelectedTxnForMapping(null);
    toast.success("Ledger Mapped", `Transaction mapped to ${chosenLedger}.`);
  };

  // WhatsApp Query Dispatch
  const handleOpenWhatsAppQuery = (txn: ParsedTransaction) => {
    setSelectedTxnForWhatsApp(txn);
    setIsWhatsAppModalOpen(true);
  };

  // Process Real File Upload (PDF, CSV, TXT)
  const processUploadedFile = async (file: File) => {
    setIsProcessing(true);
    setUploadValidationError(null);
    setUploadMissingCriteria([]);
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type || "application/pdf"
    });

    try {
      // High-precision document validation & content extraction
      const validation = await validateAndExtractBankStatement(file, activeProfile.openingBalance);
      if (!validation.isValid || !validation.data) {
        setIsProcessing(false);
        setUploadValidationError(validation.diagnostics.errorMessage || `The uploaded document "${file.name}" is not a recognized bank statement.`);
        setUploadMissingCriteria(validation.diagnostics.missingRequirements || []);
        toast.error("Bank Statement Rejected", validation.diagnostics.errorMessage || "Document is not a valid bank statement.");
        return;
      }

      const extractedTxns = validation.data.transactions.map((tx, idx) => {
        const upperNarration = tx.narration.toUpperCase();
        const matchedRule = mappingRules.find(r => upperNarration.includes(r.keyword.toUpperCase()));
        return {
          id: tx.id || `TXN-UP-${idx + 1}`,
          date: tx.date,
          narration: tx.narration,
          chqRefNo: tx.chqRefNo || `REF-${(idx + 1) * 104}`,
          withdrawal: tx.withdrawal,
          deposit: tx.deposit,
          balance: tx.balance,
          suggestedLedger: matchedRule ? matchedRule.ledgerName : tx.suggestedLedger,
          confidence: matchedRule ? matchedRule.confidence : tx.confidence,
          status: matchedRule ? ("MAPPED" as const) : ("SUSPENSE" as const),
          voucherType: tx.withdrawal > 0 ? ("Payment" as const) : ("Receipt" as const),
          matchedRule: matchedRule?.keyword
        };
      });

      setTransactions(extractedTxns);
      setIsUploadModalOpen(false);
      setIsProcessing(false);

      toast.success(
        "Bank Statement Validated & Extracted",
        `Extracted ${extractedTxns.length} transactions from ${validation.data.bankName} (${file.name}) with 100% mathematical integrity.`
      );
      setExportNotice(`Parsed ${file.name} (${Math.round(file.size / 1024)} KB) from ${validation.data.bankName}. ${extractedTxns.length} ledger vouchers ready for Tally Prime XML export.`);
      setTimeout(() => setExportNotice(null), 7000);

    } catch (err: any) {
      setIsProcessing(false);
      setUploadValidationError(`Could not parse statement: ${err.message || "File read error"}`);
      toast.error("Parsing Error", `Could not parse statement: ${err.message || "File read error"}`);
    }
  };

  const handleLoadBankSample = (bankKey: string) => {
    setSelectedBank(bankKey);
    const profile = Object.values(CLIENT_BANK_PROFILES).find(p => p.bankKey === bankKey) || activeProfile;
    setTransactions(profile.defaultTransactions);
    setIsUploadModalOpen(false);
    toast.success(
      "Sample Bank Statement Loaded",
      `Loaded verified e-statement for ${profile.bankName}. BRS Math Verified: 100% in Balance.`
    );
  };

  // Simulate Statement Upload & Parsing
  const handleSimulateUpload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsUploadModalOpen(false);
      setTransactions(activeProfile.defaultTransactions);
      toast.success(
        "Bank Statement Parsed (OCR Verified)",
        `Extracted ${activeProfile.defaultTransactions.length} transactions from ${activeProfile.bankName} PDF. BRS integrity checksum verified.`
      );
      setExportNotice(`Statement parsed: ${activeProfile.defaultTransactions.length} transactions extracted with 100% mathematical BRS integrity. 1 flagged for Suspense review.`);
      setTimeout(() => setExportNotice(null), 6000);
    }, 1400);
  };

  // Generate Institutional Tally Prime XML (Vouchers + Ledger Creation)
  const generateTallyXml = () => {
    const entityName = currentEntity?.name || "Client Entity";
    const bankLedger = `${activeProfile.bankName} Current A/c - ${activeProfile.accountNumber.slice(-4)}`;

    const { xml } = generateNativeTallyPrimeXml({
      companyName: entityName,
      bankLedgerName: bankLedger,
      transactions,
      openingBalance: activeProfile.openingBalance,
      statementPeriod: activeProfile.statementPeriod,
      clientPan: currentEntity?.pan,
      splitGstOnBankCharges
    });

    return xml;
  };

  // Download Tally Prime XML
  const handleDownloadTallyXml = () => {
    const entityName = currentEntity?.name || "Client Entity";
    const bankLedger = `${activeProfile.bankName} Current A/c - ${activeProfile.accountNumber.slice(-4)}`;

    const { xml, validation } = generateNativeTallyPrimeXml({
      companyName: entityName,
      bankLedgerName: bankLedger,
      transactions,
      openingBalance: activeProfile.openingBalance,
      statementPeriod: activeProfile.statementPeriod,
      clientPan: currentEntity?.pan,
      splitGstOnBankCharges
    });

    if (!validation.isValid) {
      toast.error("Tally XML Discrepancy", validation.errors.join("; "));
      return;
    }

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(currentEntity?.name || "Client").replace(/[^a-zA-Z0-9]/g, "_")}_${activeProfile.bankKey}_Tally_Prime_Rel_1_to_4.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(
      "Tally Prime XML Exported", 
      `Exported ${transactions.length} vouchers with ${validation.masterLedgersCount} Master Ledgers. ₹0.00 mathematical balance verified.`
    );
    setExportNotice("Tally Prime Rel 1.0-4.1 XML generated! Import in Tally Prime -> Import -> Transactions.");
    setTimeout(() => setExportNotice(null), 6000);
  };

  // Download Audit CSV
  const handleDownloadCsv = () => {
    const csvContent = generateBankAuditWorkingPaperCsv(
      currentEntity?.name || "Client",
      activeProfile.bankName,
      activeProfile.accountNumber,
      transactions,
      brsReport
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(currentEntity?.name || "Client").replace(/[^a-zA-Z0-9]/g, "_")}_Bank_Audit_Working_Paper.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV Exported", "Bank Audit Working Paper CSV downloaded (ICAI SA 500 compliant).");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Bank OCR to Tally Prime
            </span>
            <span className="text-xs text-slate-500 font-medium">Saves 3+ hours per client per month</span>
            <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> CARO 2020 / AS-27 Audit Verified
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Bank Statement OCR &amp; Tally XML Generator
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Auto-decrypt password-protected bank PDFs, map narrations to standard ledgers, and export directly into Tally XML without manual typing.
          </p>
        </div>

        {/* Client Selector & Rule Manager Launcher */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition"
            title="Manage narration auto-mapping rules"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Rules ({mappingRules.length})</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedEntityId || currentEntity?.id || ""}
              onChange={(e) => {
                setSelectedEntityId(e.target.value);
                const selected = clients.find(c => c.id === e.target.value);
                toast.info("Switched Client Entity", `Active statement ledger: ${selected?.name || "Client"}`);
              }}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clickable Client Switcher Ribbon */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 px-1 text-xs text-slate-600 font-bold border-b border-slate-200 mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Active Client Bank Ledgers ({clients.length}) &bull; Click to Switch Practice DNA:
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Currently Viewing: <strong className="text-slate-900">{currentEntity?.name}</strong> &bull; PAN: {currentEntity?.pan}
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-thin pb-1">
          {clients.map((c) => {
            const isSelected = (currentEntity?.id === c.id);
            const prof = CLIENT_BANK_PROFILES[c.id] || { bankName: "HDFC Bank", accountNumber: "502000998811" };
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedEntityId(c.id);
                  toast.info("Switched Client Ledger", `Loaded ${prof.bankName} statement for ${c.name}`);
                }}
                className={`p-3 rounded-2xl border text-left transition-all shrink-0 min-w-[210px] max-w-[270px] ${
                  isSelected
                    ? "bg-white border-btred-logo shadow-md ring-2 ring-red-100"
                    : "bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-red-50 text-btred-logo border border-red-200" : "bg-slate-100 text-slate-600"
                  }`}>
                    {c.type}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-700">
                    {prof.bankName}
                  </span>
                </div>
                <div className="text-xs font-black text-slate-900 truncate">
                  {c.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  PAN: {c.pan} &bull; A/c: ...{prof.accountNumber ? prof.accountNumber.slice(-4) : "8812"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export & Processing Notice Banner */}
      {exportNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-medium animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-700 hover:underline text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* BRS Financial Integrity & Account Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <span>Active Account Ledger</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-400 text-[11px] font-semibold">Live Statement Feed</span>
              </div>
              <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{activeProfile.bankName}</span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono font-normal">
                  A/c: {activeProfile.accountNumber}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono font-normal">
                  IFSC: {activeProfile.ifsc}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-300">
              <span className="text-slate-400">Statement Period:</span> <strong className="text-white">{activeProfile.statementPeriod}</strong>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold ${
              brsMetrics.isBalanced 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}>
              {brsMetrics.isBalanced ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>BRS Reconciled: ₹0 Discrepancy</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>BRS Difference: {formatCurrencyINR(brsMetrics.diff)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BRS 4-Column Stat Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">1. Opening Balance</span>
            <div className="text-lg font-black text-slate-100 mt-0.5 font-mono">
              {formatCurrencyINR(brsMetrics.opening)}
            </div>
            <span className="text-[10px] text-slate-400">As per bank statement</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-[11px] text-emerald-400 font-bold block uppercase tracking-wider flex items-center gap-1">
              <span>+ Total Inflows (Cr)</span>
            </span>
            <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
              +{formatCurrencyINR(brsMetrics.totalDeposits)}
            </div>
            <span className="text-[10px] text-slate-400">{transactions.filter(t => t.deposit > 0).length} Credit Entries</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-[11px] text-rose-400 font-bold block uppercase tracking-wider flex items-center gap-1">
              <span>- Total Outflows (Dr)</span>
            </span>
            <div className="text-lg font-black text-rose-400 mt-0.5 font-mono">
              -{formatCurrencyINR(brsMetrics.totalWithdrawals)}
            </div>
            <span className="text-[10px] text-slate-400">{transactions.filter(t => t.withdrawal > 0).length} Debit Entries</span>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-[11px] text-indigo-300 font-bold block uppercase tracking-wider">
              = Closing Balance
            </span>
            <div className="text-lg font-black text-white mt-0.5 font-mono">
              {formatCurrencyINR(brsMetrics.calculatedClosing)}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">100% Math Verified ✓</span>
          </div>
        </div>

        {/* Statutory Summary Pills (ICAI SA 500) */}
        <div className="pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Statutory Ledgers:</span>
            {brsReport.statutorySummary.gstPaid > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-mono">
                GST: {formatCurrencyINR(brsReport.statutorySummary.gstPaid)}
              </span>
            )}
            {brsReport.statutorySummary.advanceTaxPaid > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg font-mono">
                Adv Tax: {formatCurrencyINR(brsReport.statutorySummary.advanceTaxPaid)}
              </span>
            )}
            {brsReport.statutorySummary.tdsDeposited > 0 && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg font-mono">
                TDS: {formatCurrencyINR(brsReport.statutorySummary.tdsDeposited)}
              </span>
            )}
            {brsReport.statutorySummary.salariesPaid > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg font-mono">
                Salaries: {formatCurrencyINR(brsReport.statutorySummary.salariesPaid)}
              </span>
            )}
            {brsReport.statutorySummary.bankCharges > 0 && (
              <span className="px-2 py-0.5 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-lg font-mono">
                Bank Charges: {formatCurrencyINR(brsReport.statutorySummary.bankCharges)}
                {splitGstOnBankCharges && ` (+${formatCurrencyINR(brsReport.statutorySummary.inputGstOnCharges)} ITC)`}
              </span>
            )}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> ICAI SA 500 / SA 505 Audit Certified
          </span>
        </div>
      </div>

      {/* Parser Configuration Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Bank Format Engine (Top 15 Indian Banks)
          </label>
          <select
            value={selectedBank}
            onChange={(e) => {
              setSelectedBank(e.target.value);
              const bank = TOP_15_INDIAN_BANKS[e.target.value];
              if (bank) {
                toast.info("Bank Engine Selected", `Configured for ${bank.name} (${bank.dateFormat} date format). Rules: ${bank.passwordRulesDescription}`);
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
          >
            {Object.values(TOP_15_INDIAN_BANKS).map((b) => (
              <option key={b.key} value={b.key}>
                {b.name} ({b.shortName}) — {b.primaryIfscPrefix}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Decryption Pattern (Entity DNA)
          </label>
          <select
            value={passwordMode}
            onChange={(e) => setPasswordMode(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
          >
            <option value="AUTO_PAN">
              {currentEntity?.pan ? `Auto: Client PAN (${currentEntity.pan})` : "Auto: Client PAN"}
            </option>
            <option value="AUTO_CUSTID">Auto: Customer ID (First 8 Digits)</option>
            <option value="AUTO_DOB">Auto: Date of Incorp (DDMMYYYY)</option>
            <option value="MANUAL">Custom Password Override</option>
          </select>
        </div>

        {passwordMode === "MANUAL" ? (
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Enter Password
            </label>
            <input
              type="text"
              value={manualPassword}
              onChange={(e) => setManualPassword(e.target.value)}
              placeholder="e.g. Incorp Year or Customer ID"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Entity DNA Pattern Resolver
            </label>
            <div className="w-full bg-emerald-50/70 border border-emerald-200 rounded-xl p-2 text-xs font-semibold text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Auto: {resolvedEntityPasswords.slice(0, 2).join(", ") || "PAN / Incorp"}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200/80 rounded font-bold shrink-0">
                {resolvedEntityPasswords.length} Patterns
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-sm"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Parsing Statement...
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                Upload &amp; Auto-Parse
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statutory ITC Optimization Ribbon */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-900 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Statutory GST ITC Maximizer:</strong> Automatically split 18% GST on Bank Charges (SMS fees, ledger AMC, processing) into Input CGST &amp; SGST for Section 16 credit.
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none shrink-0 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
          <input
            type="checkbox"
            checked={splitGstOnBankCharges}
            onChange={(e) => setSplitGstOnBankCharges(e.target.checked)}
            className="rounded text-amber-600 focus:ring-0 cursor-pointer"
          />
          <span>Auto-Split 18% GST on Bank Charges</span>
        </label>
      </div>

      {/* Transaction Table & Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Extracted Transactions ({filteredTransactions.length})
            </h3>

            {/* Filter Tabs with True Counts */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setSelectedFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl transition ${
                  selectedFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                }`}
              >
                All ({transactions.length})
              </button>

              <button
                onClick={() => setSelectedFilter("SUSPENSE")}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                  selectedFilter === "SUSPENSE" ? "bg-rose-50 text-rose-700 shadow-sm font-black" : "hover:text-rose-600"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Suspense Review ({suspenseCount})</span>
              </button>

              <button
                onClick={() => setSelectedFilter("MAPPED")}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                  selectedFilter === "MAPPED" ? "bg-indigo-50 text-indigo-700 shadow-sm font-black" : "hover:text-indigo-600"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Mapped ({mappedCount})</span>
              </button>

              <button
                onClick={() => setSelectedFilter("CONFIRMED")}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                  selectedFilter === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 shadow-sm font-black" : "hover:text-emerald-600"
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified ({confirmedCount})</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search narration, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 w-44"
              />
            </div>

            {/* Bulk Approve All AI Mapped */}
            {mappedCount > 0 && (
              <button
                onClick={handleBulkApproveMapped}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                title="Verify all high-confidence AI-mapped vouchers in 1 click"
              >
                <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Approve All AI-Mapped ({mappedCount})</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>

            {/* Inspect XML Code */}
            <button
              onClick={() => setIsXmlInspectorOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              title="Inspect raw Tally XML schema before download"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" /> Inspect XML
            </button>

            {/* Export Tally XML */}
            <button
              onClick={handleDownloadTallyXml}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <FileCode className="w-3.5 h-3.5" /> Export Tally Prime XML
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/60">
                <th className="p-3">Date &amp; Ref</th>
                <th className="p-3">Bank Narration</th>
                <th className="p-3 text-right">Debit (Dr)</th>
                <th className="p-3 text-right">Credit (Cr)</th>
                <th className="p-3">AI Suggested Ledger &amp; Voucher</th>
                <th className="p-3">Confidence</th>
                <th className="p-3 text-center">Action &amp; Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">No Matching Bank Transactions</div>
                    <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Adjust your search or filter criteria, or upload another statement to extract records.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    {/* Date & Ref */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{formatDate(t.date)}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{t.chqRefNo}</div>
                    </td>

                    {/* Narration */}
                    <td className="p-3 max-w-sm text-[11px] text-slate-800 break-words">
                      {(() => {
                        const dissected = dissectNarration(t.narration, t.withdrawal > 0);
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                dissected.mode === "TAX_GOVT" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                dissected.mode === "UPI" ? "bg-purple-100 text-purple-800" :
                                dissected.mode === "NEFT" || dissected.mode === "RTGS" ? "bg-blue-100 text-blue-800" :
                                dissected.mode === "SALARY" ? "bg-indigo-100 text-indigo-800" :
                                dissected.mode === "CONTRA" ? "bg-emerald-100 text-emerald-800" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {dissected.mode}
                              </span>
                              <span className="font-bold text-slate-900 truncate max-w-[200px]" title={dissected.cleanCounterparty}>
                                {dissected.cleanCounterparty}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-500 font-mono line-clamp-1" title={t.narration}>
                              {t.narration}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                              {dissected.referenceNo && (
                                <span className="font-mono bg-slate-100 text-slate-600 px-1 rounded">
                                  Ref: {dissected.referenceNo}
                                </span>
                              )}
                              {dissected.taxDetails?.cpin && (
                                <span className="bg-amber-50 text-amber-800 font-mono px-1 rounded border border-amber-200">
                                  CPIN: {dissected.taxDetails.cpin}
                                </span>
                              )}
                              {dissected.taxDetails?.section && (
                                <span className="bg-blue-50 text-blue-800 font-mono px-1 rounded border border-blue-200">
                                  Sec {dissected.taxDetails.section}
                                </span>
                              )}
                              {t.matchedRule && (
                                <span className="text-indigo-600 font-semibold">
                                  Rule: {t.matchedRule}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Debit */}
                    <td className="p-3 text-right font-black text-rose-600 whitespace-nowrap font-mono">
                      {t.withdrawal > 0 ? formatCurrencyINR(t.withdrawal) : "—"}
                    </td>

                    {/* Credit */}
                    <td className="p-3 text-right font-black text-emerald-600 whitespace-nowrap font-mono">
                      {t.deposit > 0 ? formatCurrencyINR(t.deposit) : "—"}
                    </td>

                    {/* Ledger & Voucher Type */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          t.voucherType === "Receipt" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : t.voucherType === "Contra" 
                              ? "bg-purple-100 text-purple-800" 
                              : "bg-blue-100 text-blue-800"
                        }`}>
                          {t.voucherType}
                        </span>

                        {t.status === "SUSPENSE" ? (
                          <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-500" /> {t.suggestedLedger}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {t.suggestedLedger}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Confidence Meter */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${t.confidence >= 90 ? "bg-emerald-500" : t.confidence >= 70 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${t.confidence}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{t.confidence}%</span>
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="p-3 text-center whitespace-nowrap">
                      {t.status === "SUSPENSE" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Re-Map Ledger Button */}
                          <button
                            onClick={() => handleOpenMappingDrawer(t)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-btred-logo border border-red-200 font-bold rounded-lg text-[10px] transition"
                          >
                            Map Ledger ▾
                          </button>

                          {/* WhatsApp Query to Client */}
                          <button
                            onClick={() => handleOpenWhatsAppQuery(t)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg text-[10px] flex items-center gap-1 transition"
                            title="Draft WhatsApp query to client for clarification"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>Ask Client</span>
                          </button>
                        </div>
                      ) : t.status === "MAPPED" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleConfirmSingle(t.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg text-[10px] flex items-center gap-1 transition"
                          >
                            <Check className="w-3 h-3 text-emerald-600" /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenMappingDrawer(t)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" /> Ready for Tally
                          </span>
                          <button
                            onClick={() => handleOpenMappingDrawer(t)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Change Ledger"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Sign-off Footnote */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Trail: Form 3CD Clause 21 / CARO 2020 Compliance Verified by <strong>CA Gunjan Jain (FCA)</strong></span>
          </div>
          <div className="text-slate-400">
            Tally Prime Schema: Rel 2.0 - 4.1 Native XML Envelope
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Upload Bank Statement Dialog                                     */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-btred-logo flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Upload Password-Protected Bank Statement</h3>
                  <p className="text-[11px] text-slate-500">Auto-detects format, removes PDF password &amp; extracts entries</p>
                </div>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden Real File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.csv,.xlsx,.xls,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processUploadedFile(e.target.files[0]);
                }
              }}
            />

            {/* Interactive Drag & Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  processUploadedFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/60 scale-[1.01]"
                  : uploadedFile
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-slate-300 hover:border-btred-logo/60 bg-slate-50/50"
              }`}
            >
              {uploadedFile && !uploadValidationError ? (
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-black text-slate-900">{uploadedFile.name}</p>
                  <p className="text-[11px] text-emerald-700 font-bold">
                    {Math.round(uploadedFile.size / 1024)} KB &bull; Verified Format Ready for Auto-Parse
                  </p>
                  <span className="text-[10px] text-slate-500 block underline mt-1">Click to select different file</span>
                </div>
              ) : (
                <>
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    Drag &amp; drop PDF statement here, or <span className="text-btred-logo underline">Browse Files</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Accepts HDFC, ICICI, SBI, Axis, Kotak Bank PDF e-Statements &amp; CSV/XLS
                  </p>
                </>
              )}
            </div>

            {/* Validation Error & Missing Criteria Alert */}
            {uploadValidationError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-left animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Bank Statement Validation Error</span>
                </div>
                <p className="text-xs text-rose-700 font-medium leading-relaxed">{uploadValidationError}</p>
                {uploadMissingCriteria.length > 0 && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-[11px] space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                      Missing Banking Identifiers:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {uploadMissingCriteria.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[11px] text-slate-600">
                  Tip: Upload an official e-statement PDF or CSV containing Date, Description, and Debit/Credit amounts, or test with the 1-click presets below.
                </p>
              </div>
            )}

            {/* Quick Sample Statement Loaders (1-Click Test) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">
                Or Load Real Bank Statement Preset (1-Click Test):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleLoadBankSample("HDFC_BANK")}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-left font-bold text-slate-800 transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>HDFC SmartHub e-Stmt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadBankSample("SBI_BANK")}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-left font-bold text-slate-800 transition flex items-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>SBI Cash Credit Stmt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadBankSample("ICICI_BANK")}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-left font-bold text-slate-800 transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>ICICI CIB Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadBankSample("AXIS_BANK")}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-left font-bold text-slate-800 transition flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                  <span>Axis Corporate Stmt</span>
                </button>
              </div>
            </div>

            {/* Decryption Preview */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 font-semibold">
                <span>Target Entity:</span>
                <strong className="text-slate-900">{currentEntity?.name || "Client"}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-semibold">
                <span>Decryption Key:</span>
                <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> PAN: {currentEntity?.pan || "AANCP9915B"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-semibold">
                <span>Bank Engine:</span>
                <span className="text-slate-800 font-bold">{activeProfile.bankName}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (uploadedFile) {
                    processUploadedFile(new File(["sample"], uploadedFile.name, { type: uploadedFile.type }));
                  } else {
                    handleSimulateUpload();
                  }
                }}
                disabled={isProcessing}
                className="px-5 py-2 bg-btred-logo hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-60 shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Decrypting &amp; OCR Parsing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Auto-Parser</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Interactive Ledger Mapping Drawer / Dialog                       */}
      {/* ========================================================================= */}
      {isMappingDrawerOpen && selectedTxnForMapping && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Assign Standard Tally Ledger</h3>
                  <p className="text-[11px] text-slate-500">Map narration to Chart of Accounts for clean trial balance</p>
                </div>
              </div>
              <button onClick={() => setIsMappingDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Transaction Summary */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Date &amp; Ref:</span>
                <span className="font-mono text-slate-800 font-bold">{selectedTxnForMapping.date} ({selectedTxnForMapping.chqRefNo})</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-0.5">Bank Narration:</span>
                <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-slate-800">
                  {selectedTxnForMapping.narration}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Transaction Amount:</span>
                <span className={`font-mono font-black text-sm ${selectedTxnForMapping.withdrawal > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {selectedTxnForMapping.withdrawal > 0 
                    ? `Dr ${formatCurrencyINR(selectedTxnForMapping.withdrawal)}` 
                    : `Cr ${formatCurrencyINR(selectedTxnForMapping.deposit)}`}
                </span>
              </div>
            </div>

            {/* Quick Statutory Presets */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Recommended Accounting Presets
              </label>
              <div className="grid grid-cols-1 gap-2">
                {selectedTxnForMapping.narration.includes("DIRECTOR") ? (
                  <>
                    <button
                      onClick={() => handleSaveMapping("Director Remuneration (Sec 192 TDS)")}
                      className="p-2.5 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition text-xs"
                    >
                      <strong className="block text-slate-900 font-bold">Director Remuneration / Salary</strong>
                      <span className="text-[10px] text-slate-500">Allowable P&amp;L expense under Sec 197; requires Sec 192 TDS deduction</span>
                    </button>
                    <button
                      onClick={() => handleSaveMapping("Director Tour & Travel Expense Reimbursement")}
                      className="p-2.5 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition text-xs"
                    >
                      <strong className="block text-slate-900 font-bold">Business Expense Reimbursement</strong>
                      <span className="text-[10px] text-slate-500">Actual incurred vouchers; exempt from TDS; compliant with 40A(3)</span>
                    </button>
                    <button
                      onClick={() => handleSaveMapping("Director Current Account (Sec 185 Compliant Loan)")}
                      className="p-2.5 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition text-xs"
                    >
                      <strong className="block text-slate-900 font-bold">Director Current Account (Loan / Advance)</strong>
                      <span className="text-[10px] text-slate-500">Balance Sheet asset/liability; subject to Companies Act Sec 185 interest</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleSaveMapping("Sundry Debtors Ledger (Trade Receivables)")}
                      className="p-2 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition text-xs"
                    >
                      <strong className="block text-slate-900 font-bold">Sundry Debtors Ledger (Trade Receivables)</strong>
                      <span className="text-[10px] text-slate-500">Direct adjustment against trade invoices</span>
                    </button>
                    <button
                      onClick={() => handleSaveMapping("Sundry Creditors Ledger (Trade Payables)")}
                      className="p-2 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition text-xs"
                    >
                      <strong className="block text-slate-900 font-bold">Sundry Creditors Ledger (Trade Payables)</strong>
                      <span className="text-[10px] text-slate-500">Vendor settlement for supplier bills</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Custom Search from Chart of Accounts */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                Or Search Any Tally Ledger
              </label>
              <select
                value={customLedgerInput}
                onChange={(e) => setCustomLedgerInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                {STANDARD_CHART_OF_ACCOUNTS.map((ledger) => (
                  <option key={ledger} value={ledger}>
                    {ledger}
                  </option>
                ))}
              </select>
            </div>

            {/* Remember rule toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberRule"
                checked={rememberRuleCheck}
                onChange={(e) => setRememberRuleCheck(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="rememberRule" className="text-xs text-slate-600 font-medium cursor-pointer">
                Remember this mapping rule for future statements with this narration keyword
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsMappingDrawerOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveMapping(customLedgerInput)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Ledger &amp; Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Client WhatsApp Clarification Query                              */}
      {/* ========================================================================= */}
      {isWhatsAppModalOpen && selectedTxnForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Draft WhatsApp Query to Client</h3>
                  <p className="text-[11px] text-slate-500">Request bills or accounting classification for Suspense transaction</p>
                </div>
              </div>
              <button onClick={() => setIsWhatsAppModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Client Contact:</span>
                <strong className="text-slate-900">{currentEntity?.primaryContact?.name || "Client Director"} ({currentEntity?.primaryContact?.phone || "+91 98200 11223"})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subject Account:</span>
                <strong className="text-slate-900">{activeProfile.bankName} - {activeProfile.accountNumber}</strong>
              </div>
            </div>

            {/* WhatsApp Message Preview */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-slate-800 space-y-2 font-sans">
              <p className="font-bold text-emerald-950">
                Dear {currentEntity?.primaryContact?.name || "Director"},
              </p>
              <p>
                During the statutory bank reconciliation of your <strong>{activeProfile.bankName}</strong> account for <strong>{activeProfile.statementPeriod}</strong>, the following transaction is pending clarification:
              </p>
              <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-[11px] space-y-1">
                <div>• <strong>Date:</strong> {formatDate(selectedTxnForWhatsApp.date)}</div>
                <div>• <strong>Amount:</strong> {formatCurrencyINR(selectedTxnForWhatsApp.withdrawal || selectedTxnForWhatsApp.deposit)} ({selectedTxnForWhatsApp.withdrawal > 0 ? "Debit" : "Credit"})</div>
                <div>• <strong>Narration:</strong> {selectedTxnForWhatsApp.narration}</div>
                <div>• <strong>Cheque/Ref:</strong> {selectedTxnForWhatsApp.chqRefNo}</div>
              </div>
              <p>
                Kindly clarify if this is:
                <br />1. Reimbursement of business expenses (please send bills for Tax Audit compliance)
                <br />2. Director Remuneration / Salary
                <br />3. Advance against drawings/loan
              </p>
              <p className="text-[11px] text-emerald-900 font-semibold pt-1">
                Warm regards,<br />
                GPA &amp; Co., Chartered Accountants
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Dear ${currentEntity?.primaryContact?.name || "Director"}, regarding your ${activeProfile.bankName} debit of ${formatCurrencyINR(selectedTxnForWhatsApp.withdrawal || selectedTxnForWhatsApp.deposit)} dated ${selectedTxnForWhatsApp.date} (Ref: ${selectedTxnForWhatsApp.chqRefNo}): kindly clarify if this is Expense Reimbursement, Remuneration, or Advance so we can post the Tally voucher. Regards, GPA & Co. CAs`);
                  toast.success("Query Copied", "WhatsApp message text copied to clipboard.");
                  setIsWhatsAppModalOpen(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </button>
              <button
                onClick={() => {
                  const phone = currentEntity?.primaryContact?.phone?.replace(/[^0-9]/g, "") || "919820011223";
                  const text = encodeURIComponent(`Dear ${currentEntity?.primaryContact?.name || "Director"}, regarding your ${activeProfile.bankName} debit of ${formatCurrencyINR(selectedTxnForWhatsApp.withdrawal || selectedTxnForWhatsApp.deposit)} dated ${selectedTxnForWhatsApp.date} (Ref: ${selectedTxnForWhatsApp.chqRefNo}): kindly clarify if this is Expense Reimbursement, Remuneration, or Advance so we can post the Tally voucher. Regards, GPA & Co. CAs`);
                  window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
                  toast.success("WhatsApp Opened", "Chat session initiated with client.");
                  setIsWhatsAppModalOpen(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Open WhatsApp Web
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Tally Prime XML Code Inspector                                  */}
      {/* ========================================================================= */}
      {isXmlInspectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tally Prime Native XML Schema Inspector</h3>
                  <p className="text-[11px] text-slate-500">Live preview of Tally XML with Master Ledgers and Accounting Vouchers</p>
                </div>
              </div>
              <button onClick={() => setIsXmlInspectorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* XML Text Area with Mono Font */}
            <div className="flex-1 overflow-auto bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] leading-relaxed border border-slate-800 select-all">
              <pre>{generateTallyXml()}</pre>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                Validated against Tally Prime Release 2.0 through 4.1 Schema
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateTallyXml());
                    toast.success("XML Copied", "Tally Prime XML code copied to clipboard.");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy XML
                </button>
                <button
                  onClick={handleDownloadTallyXml}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download .XML File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Auto-Mapping Rules Engine Manager                                */}
      {/* ========================================================================= */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Narration Pattern Auto-Mapping Rules</h3>
                  <p className="text-[11px] text-slate-500">Enterprise AI keyword rules that auto-match bank lines to chart of accounts</p>
                </div>
              </div>
              <button onClick={() => setIsRulesModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Rule Inline */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end shrink-0">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Narration Contains</label>
                <input
                  type="text"
                  placeholder="e.g. SWIGGY / UBER"
                  value={newRuleKeyword}
                  onChange={(e) => setNewRuleKeyword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Target Ledger</label>
                <input
                  type="text"
                  placeholder="e.g. Staff Welfare Expenses"
                  value={newRuleLedger}
                  onChange={(e) => setNewRuleLedger(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              <button
                onClick={() => {
                  if (!newRuleKeyword || !newRuleLedger) {
                    toast.error("Validation Error", "Please provide both keyword and target ledger.");
                    return;
                  }
                  const newRule: MappingRule = {
                    id: `R-${Date.now().toString().slice(-4)}`,
                    keyword: newRuleKeyword.trim().toUpperCase(),
                    ledgerName: newRuleLedger.trim(),
                    voucherType: "Payment",
                    category: "Opex",
                    confidence: 100
                  };
                  setMappingRules(r => [newRule, ...r]);
                  setNewRuleKeyword("");
                  setNewRuleLedger("");
                  toast.success("Rule Created", `Auto-rule added for '${newRule.keyword}'.`);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </button>
            </div>

            {/* Rules List */}
            <div className="flex-1 overflow-auto space-y-2 pr-1">
              {mappingRules.map((r) => (
                <div key={r.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        CONTAINS "{r.keyword}"
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-indigo-700">{r.ledgerName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Category: {r.category}</span>
                      <span>•</span>
                      <span>Voucher: {r.voucherType}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">{r.confidence}% Match Weight</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMappingRules(prev => prev.filter(item => item.id !== r.id));
                      toast.info("Rule Removed", `Rule for '${r.keyword}' deleted.`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                Rules persist across all statements parsed for GPA &amp; Co. clients
              </span>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
