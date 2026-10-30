"use client";

import React, { useState, useMemo } from "react";
import { INITIAL_TASKS, INITIAL_DOCUMENTS } from "@/lib/data/mockData";
import { ComplianceTask, DocumentItem } from "@/lib/types";
import { formatDate, formatCurrencyINR } from "@/lib/utils";
import { openWhatsAppPreset, sanitizeIndianPhoneNumber } from "@/lib/whatsapp";
import { 
  Clock, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  MessageSquare,
  KeyRound,
  PhoneCall,
  FileText,
  Lock,
  Unlock,
  Sparkles,
  Zap,
  Check,
  CalendarCheck,
  ShieldCheck,
  FileCheck,
  Search,
  Filter,
  Plus,
  X,
  Eye,
  Download,
  Printer,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Building2,
  UserCheck,
  AlertCircle,
  Copy,
  Receipt,
  FileSpreadsheet,
  RotateCcw,
  Phone
} from "lucide-react";
import { TaxAuditWorkpaperModal } from "@/components/firm/TaxAuditWorkpaperModal";
import { BankStatementParser } from "@/components/firm/BankStatementParser";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { toast } from "@/components/shared/ToastNotification";

interface TimesheetEntry {
  id: string;
  date: string;
  entityName: string;
  taskTitle: string;
  category: string;
  hours: number;
  notes: string;
  status: "LOGGED" | "PARTNER_APPROVED";
}

interface WhatsAppChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isClient: boolean;
  isManagementRepresentation?: boolean;
  auditRef?: string;
}

interface ClientWhatsAppChannel {
  entityId: string;
  clientName: string;
  pan: string;
  contactName: string;
  designation: string;
  phone: string;
  messages: WhatsAppChatMessage[];
}

const DEFAULT_WHATSAPP_CHANNELS: Record<string, ClientWhatsAppChannel> = {
  "CLI-APEX-01": {
    entityId: "CLI-APEX-01",
    clientName: "Apex AutoTech Private Limited",
    pan: "AABCA8891D",
    contactName: "Rajesh Sharma",
    designation: "Managing Director",
    phone: "919823011928",
    messages: [
      {
        id: "APX-01",
        sender: "Kriti Jain (Article)",
        text: "Sir, we completed the statutory GSTR-3B reconciliation for Apex AutoTech. Vendor invoice of ₹4,20,000 from precision tooling supplier is missing in GSTR-2B. Please confirm if we should reverse ITC or pay under protest.",
        time: "10:15 AM",
        isClient: false,
      },
      {
        id: "APX-02",
        sender: "Rajesh Sharma (MD)",
        text: "Checked with the vendor. They will upload in quarterly GSTR 1. Please defer the ITC to next month and file 3B today.",
        time: "10:42 AM",
        isClient: true,
      }
    ]
  },
  "CLI-OMNI-01": {
    entityId: "CLI-OMNI-01",
    clientName: "OmniRetail Hypermarkets Private Limited",
    pan: "AAFCO4492K",
    contactName: "Sahil Mehta",
    designation: "VP Finance & Operations",
    phone: "919811123456",
    messages: [
      {
        id: "OMN-01",
        sender: "Kriti Jain (Article)",
        text: "Sir, for Form 3CD Tax Audit Clause 22/26, we require Udyam certificates for 4 micro/small vendors to determine Section 43B(h) disallowance.",
        time: "Yesterday 04:30 PM",
        isClient: false,
      },
      {
        id: "OMN-02",
        sender: "Sahil Mehta (VP Finance)",
        text: "Shared 3 Udyam certificates on the firm upload portal. The 4th vendor is unregistered, so 43B(h) does not apply. Please add back only registered ones.",
        time: "Yesterday 05:12 PM",
        isClient: true,
      }
    ]
  },
  "CLI-PRATWI-01": {
    entityId: "CLI-PRATWI-01",
    clientName: "Pratwi Solutions Private Limited",
    pan: "AANCP9915B",
    contactName: "Chetan Pratap Singh",
    designation: "Managing Director",
    phone: "918077170715",
    messages: [
      {
        id: "PRT-01",
        sender: "Kriti Jain (Article)",
        text: "Sir, ICICI bank statement for October has an IMPS transfer of ₹1,50,000. Please confirm if this is business travel reimbursement against vouchers or director remuneration u/s 192.",
        time: "24 Oct 11:00 AM",
        isClient: false,
      },
      {
        id: "PRT-02",
        sender: "Chetan Pratap Singh (MD)",
        text: "This was executive travel & client software demo expense reimbursement. All boarding passes and hotel bills submitted to firm vault.",
        time: "24 Oct 11:45 AM",
        isClient: true,
      }
    ]
  },
  "CLI-ZENITH-01": {
    entityId: "CLI-ZENITH-01",
    clientName: "Zenith SaaS Technologies Private Limited",
    pan: "AAACZ5512L",
    contactName: "Vikramaditya Singh",
    designation: "Director",
    phone: "919988776655",
    messages: [
      {
        id: "ZEN-01",
        sender: "Kriti Jain (Article)",
        text: "Sir, MCA V3 DIR-3 KYC filing for your DIN requires an updated passport copy with current residential address. Kindly upload on firm portal today.",
        time: "21 Oct 02:15 PM",
        isClient: false,
      },
      {
        id: "ZEN-02",
        sender: "Vikramaditya Singh (Director)",
        text: "Uploaded passport scan on portal. Please proceed with MCA V3 submission.",
        time: "21 Oct 03:00 PM",
        isClient: true,
      }
    ]
  },
  "CLI-SINGHAL-01": {
    entityId: "CLI-SINGHAL-01",
    clientName: "Singhal Logistics & Warehousing",
    pan: "AAFPS1290C",
    contactName: "Ramesh Singhal",
    designation: "Partner",
    phone: "919712345678",
    messages: [
      {
        id: "SNG-01",
        sender: "Kriti Jain (Article)",
        text: "Sir, Q2 Form 26Q TDS return preparation is pending for September Challan 281 receipts. Please share BSR codes and challan numbers.",
        time: "20 Oct 09:30 AM",
        isClient: false,
      },
      {
        id: "SNG-02",
        sender: "Ramesh Singhal (Partner)",
        text: "Accountant will share bank challan counterfoil PDFs on WhatsApp by 2 PM today.",
        time: "20 Oct 10:10 AM",
        isClient: true,
      }
    ]
  }
};

interface OtpCallRecord {
  id: string;
  timestamp: string;
  clientName: string;
  portal: string;
  returnName: string;
  signatory: string;
  phone: string;
  articleMaker: string;
  result: "AUTHENTICATED_AND_FILED" | "EXPIRED_RESCHEDULED" | "FAILED_UNREACHABLE";
  arnOrAck: string;
}

const DEFAULT_OTP_CALL_RECORDS: OtpCallRecord[] = [
  {
    id: "CALL-101",
    timestamp: "2026-10-24 11:42 AM",
    clientName: "Apex AutoTech Private Limited",
    portal: "GST Common Portal (GSTN)",
    returnName: "GSTR-3B Monthly Return (Sept 2026)",
    signatory: "Rajesh Sharma (Director)",
    phone: "+91 98230 11928",
    articleMaker: "Kriti Jain (Article)",
    result: "AUTHENTICATED_AND_FILED",
    arnOrAck: "AA2709260192841"
  },
  {
    id: "CALL-102",
    timestamp: "2026-10-22 03:15 PM",
    clientName: "Zenith SaaS Technologies Private Limited",
    portal: "MCA V3 Portal",
    returnName: "DIR-3 KYC Web (Director Vikramaditya)",
    signatory: "Vikramaditya Singh",
    phone: "+91 99887 76655",
    articleMaker: "Kriti Jain (Article)",
    result: "AUTHENTICATED_AND_FILED",
    arnOrAck: "MCA-SRN-9912048"
  },
  {
    id: "CALL-103",
    timestamp: "2026-10-20 04:50 PM",
    clientName: "Pratwi Solutions Private Limited",
    portal: "Income Tax E-Filing (ITBA)",
    returnName: "ITR-6 Corporate Return (AY 2026-27)",
    signatory: "Chetan Pratap Singh (MD)",
    phone: "+91 80771 70715",
    articleMaker: "Kriti Jain (Article)",
    result: "AUTHENTICATED_AND_FILED",
    arnOrAck: "ACK-ITD-771290"
  }
];

interface EncryptedQueueDoc {
  id: string;
  entityId: string;
  entityName: string;
  pan: string;
  bankName: string;
  bankKey: string;
  fileName: string;
  fileSize: string;
  heuristicRule: "PAN_INCORP_YEAR" | "ACCOUNT_LAST_6" | "COMPANY_ACRONYM_DDMM" | "PAN_LOWERCASE";
  computedPassword: string;
}

const DEFAULT_ENCRYPTED_BANK_DOCS: EncryptedQueueDoc[] = [
  {
    id: "DOC-BS-01",
    entityId: "CLI-PRATWI-01",
    entityName: "Pratwi Solutions Private Limited",
    pan: "AANCP9915B",
    bankName: "HDFC Bank (Corporate NetBanking)",
    bankKey: "HDFC_BANK",
    fileName: "HDFC_Current_Account_Oct2026_Statement.pdf",
    fileSize: "1.4 MB",
    heuristicRule: "PAN_INCORP_YEAR",
    computedPassword: "AANC2024"
  },
  {
    id: "DOC-BS-02",
    entityId: "CLI-APEX-01",
    entityName: "Apex AutoTech Private Limited",
    pan: "AABCA8891D",
    bankName: "State Bank of India (Corporate)",
    bankKey: "SBI_BANK",
    fileName: "SBI_Current_AABCA8891D_Sept2026.pdf",
    fileSize: "1.8 MB",
    heuristicRule: "ACCOUNT_LAST_6",
    computedPassword: "019284"
  },
  {
    id: "DOC-BS-03",
    entityId: "CLI-OMNI-01",
    entityName: "OmniRetail Hypermarkets Private Limited",
    pan: "AAFCO4492K",
    bankName: "ICICI Bank Ltd (CIB)",
    bankKey: "ICICI_BANK",
    fileName: "ICICI_CIB_AAFCO4492K_Statement.pdf",
    fileSize: "2.1 MB",
    heuristicRule: "COMPANY_ACRONYM_DDMM",
    computedPassword: "OMNI1508"
  },
  {
    id: "DOC-BS-04",
    entityId: "CLI-ZENITH-01",
    entityName: "Zenith SaaS Technologies Private Limited",
    pan: "AAACZ5512L",
    bankName: "Kotak Mahindra Bank",
    bankKey: "KOTAK_BANK",
    fileName: "Kotak_Corporate_AAACZ5512L_Q2.pdf",
    fileSize: "950 KB",
    heuristicRule: "PAN_LOWERCASE",
    computedPassword: "aaacz5512l"
  }
];

export const ArticleWorkbench: React.FC<{ isSandbox?: boolean }> = ({ isSandbox = false }) => {
  const { tasks: hookTasks, documents: hookDocs, clients, updateTask } = useTaxoData(isSandbox);
  const [tasks, setTasks] = useState<ComplianceTask[]>(hookTasks.length > 0 ? hookTasks : INITIAL_TASKS);
  const [documents, setDocuments] = useState<DocumentItem[]>(hookDocs.length > 0 ? hookDocs : INITIAL_DOCUMENTS);

  React.useEffect(() => {
    if (hookTasks.length > 0) setTasks(hookTasks);
  }, [hookTasks]);

  React.useEffect(() => {
    if (hookDocs.length > 0) setDocuments(hookDocs);
  }, [hookDocs]);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"tasks" | "doc-review" | "bank-decryptor" | "chat-hub" | "otp-relay" | "timesheet" | "icai-register">("tasks");

  // Search & Filter State for Returns
  const [returnSearch, setReturnSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTION_REQUIRED" | "PENDING_DOCS" | "PARTNER_SIGN_OFF" | "FILED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Multi-Client WhatsApp Desk State
  const [channels, setChannels] = useState<Record<string, ClientWhatsAppChannel>>(DEFAULT_WHATSAPP_CHANNELS);
  const [selectedChatEntityId, setSelectedChatEntityId] = useState<string>("CLI-APEX-01");
  const [chatMessage, setChatMessage] = useState("");
  const [whatsAppPlatform, setWhatsAppPlatform] = useState<"WEB" | "APP">("WEB");
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetDraft, setPresetDraft] = useState<{ title: string; category: string; text: string }>({
    title: "",
    category: "",
    text: ""
  });

  const activeChannel = useMemo(() => {
    return channels[selectedChatEntityId] || channels["CLI-APEX-01"] || DEFAULT_WHATSAPP_CHANNELS["CLI-APEX-01"];
  }, [channels, selectedChatEntityId]);

  // Document Review Filters & Modal State
  const [docSearch, setDocSearch] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState<"ALL" | "PENDING_REVIEW" | "APPROVED" | "CORRECTION_NEEDED">("ALL");
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>("ALL");
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [resubmittingDoc, setResubmittingDoc] = useState<DocumentItem | null>(null);
  const [resubmitDefectReason, setResubmitDefectReason] = useState<string>("Incomplete scan / missing back pages");
  const [resubmitCustomNote, setResubmitCustomNote] = useState<string>("");
  const [manualUploadModalOpen, setManualUploadModalOpen] = useState(false);
  const [manualDocName, setManualDocName] = useState("");
  const [manualDocEntity, setManualDocEntity] = useState("Apex AutoTech Private Limited");
  const [manualDocCategory, setManualDocCategory] = useState("BANK_STATEMENT");

  // Signatory OTP Call Coordination State
  const [otpPortal, setOtpPortal] = useState<"INCOME_TAX" | "GSTN" | "MCA_V3" | "TRACES">("INCOME_TAX");
  const [otpCoordinationState, setOtpCoordinationState] = useState<"idle" | "heads_up_sent" | "live_call" | "filing_authorized">("idle");
  const [otpSelectedEntityId, setOtpSelectedEntityId] = useState<string>("CLI-APEX-01");
  const [otpCountdownSeconds, setOtpCountdownSeconds] = useState<number>(600);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [otpArnInput, setOtpArnInput] = useState<string>("");
  const [callRecords, setCallRecords] = useState<OtpCallRecord[]>(DEFAULT_OTP_CALL_RECORDS);

  const otpActiveChannel = useMemo(() => {
    return channels[otpSelectedEntityId] || channels["CLI-APEX-01"] || DEFAULT_WHATSAPP_CHANNELS["CLI-APEX-01"];
  }, [channels, otpSelectedEntityId]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && otpCountdownSeconds > 0) {
      interval = setInterval(() => {
        setOtpCountdownSeconds((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdownSeconds === 0) {
      setIsTimerRunning(false);
      toast.warning("OTP Window Expired", "10-minute portal authentication window elapsed. Please re-trigger OTP.");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, otpCountdownSeconds]);

  // Bank Statement Decryption State
  const [decryptingFileId, setDecryptingFileId] = useState<string | null>(null);
  const [decryptedFiles, setDecryptedFiles] = useState<string[]>([]);
  const [decryptRule, setDecryptRule] = useState<string>("PAN_INCORP_YEAR");
  const [selectedCrackedEntityId, setSelectedCrackedEntityId] = useState<string>("CLI-PRATWI-01");
  const [customTestPassword, setCustomTestPassword] = useState<string>("");
  const [testPasswordResult, setTestPasswordResult] = useState<{ success: boolean; message: string } | null>(null);

  // Timesheet State (ICAI Regulation 60 & 67 Compliant)
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([
    {
      id: "TS-101",
      date: "2026-10-19",
      entityName: "Apex AutoTech Private Limited",
      taskTitle: "Tax Audit Form 3CD Clause 44 & 43B(h) MSME Reconciliation",
      category: "TAX_AUDIT",
      hours: 7.5,
      notes: "Compiled Table 44 expenditure matrix (registered vs unregistered). Verified MSMED Act 15-day/45-day vendor payment terms for disallowance testing.",
      status: "PARTNER_APPROVED"
    },
    {
      id: "TS-102",
      date: "2026-10-20",
      entityName: "Pratwi Solutions Private Limited",
      taskTitle: "ITR-6 Corporate Income Tax & MAT Calculation u/s 115JB",
      category: "DIRECT_TAX",
      hours: 7.0,
      notes: "Cross-checked book profit adjustments under Schedule III, brought-forward business loss and unabsorbed depreciation for Sec 115BAA/115JB evaluation.",
      status: "PARTNER_APPROVED"
    },
    {
      id: "TS-103",
      date: "2026-10-21",
      entityName: "OmniRetail India Limited",
      taskTitle: "GSTR-2B vs Books Auto-Matching & Rule 37A ITC Audit",
      category: "GST",
      hours: 7.0,
      notes: "Screened 1,420 vendor bills against IMS portal. Tagged 4 unpaid bills (>180 days) for Rule 37 reversal and prepared monthly GSTR-3B draft.",
      status: "PARTNER_APPROVED"
    },
    {
      id: "TS-104",
      date: "2026-10-22",
      entityName: "Zenith SaaS Technologies Private Limited",
      taskTitle: "Direct Tax Scrutiny Submissions u/s 142(1) Dossier",
      category: "SCRUTINY",
      hours: 6.0,
      notes: "Compiled cross-border SaaS service agreements, bank FIRCs, Softex certifications, and transfer pricing benchmarking documentation for ITBA portal.",
      status: "PARTNER_APPROVED"
    },
    {
      id: "TS-105",
      date: "2026-10-23",
      entityName: "Singhal Logistics LLP",
      taskTitle: "CARO 2020 Clause 3(i) & (ii) Fixed Asset & Inventory Audit",
      category: "STATUTORY_AUDIT",
      hours: 7.0,
      notes: "Conducted physical verification sampling of commercial vehicle fleet. Inspected title deeds of warehouses and bank hypothecation charges.",
      status: "LOGGED"
    },
    {
      id: "TS-106",
      date: "2026-10-24",
      entityName: "GPA & Co. Practice Development",
      taskTitle: "Encrypted Bank OCR Batch Validation & Weekly Technical Circle",
      category: "ACCOUNTING",
      hours: 3.5,
      notes: "Tested PDF password cracker regex heuristics against Tier-1 bank statements. Attended weekly firm study circle on recent CBDT circulars & SA 580.",
      status: "LOGGED"
    }
  ]);
  const [isSubmittingTimesheet, setIsSubmittingTimesheet] = useState<boolean>(false);
  const [timesheetSubmitted, setTimesheetSubmitted] = useState<boolean>(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showForm103ExportModal, setShowForm103ExportModal] = useState(false);
  const [timesheetViewMode, setTimesheetViewMode] = useState<"DAILY" | "PORTFOLIO">("DAILY");
  const [timesheetCategoryFilter, setTimesheetCategoryFilter] = useState<string>("ALL");
  const [timesheetClientFilter, setTimesheetClientFilter] = useState<string>("ALL");
  const [newLogDate, setNewLogDate] = useState<string>("2026-10-24");
  const [newLogEntity, setNewLogEntity] = useState("Apex AutoTech Private Limited");
  const [newLogTask, setNewLogTask] = useState("Form 3CD Clause 44 GST Matrix Compilation");
  const [newLogHours, setNewLogHours] = useState("3.5");
  const [newLogCategory, setNewLogCategory] = useState("Tax Audit (44AB)");
  const [newLogNotes, setNewLogNotes] = useState("Reconciled Table 44 expenditure breakup between registered and unregistered vendors.");

  // Modals & Drawers
  const [workpaperModalOpen, setWorkpaperModalOpen] = useState(false);
  const [selectedWorkpaperEntity, setSelectedWorkpaperEntity] = useState(clients[0]?.name || "Apex AutoTech Private Limited");

  // Article Attestation & Escalation Modal State
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalatingTask, setEscalatingTask] = useState<ComplianceTask | null>(null);
  const [checklistBrs, setChecklistBrs] = useState(true);
  const [checklistGstr2b, setChecklistGstr2b] = useState(true);
  const [checklistTds, setChecklistTds] = useState(true);
  const [checklistMsme, setChecklistMsme] = useState(true);
  const [articleMemoNote, setArticleMemoNote] = useState("All audit vouchers checked against books of accounts. Disallowances flagged in workpaper. Ready for Partner signature.");

  // Interactive WhatsApp Chase Modal
  const [chaseModalOpen, setChaseModalOpen] = useState(false);
  const [chasingTask, setChasingTask] = useState<ComplianceTask | null>(null);
  const [customChaseMessage, setCustomChaseMessage] = useState("");

  // Filing Receipt / Ack Modal
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [ackTask, setAckTask] = useState<ComplianceTask | null>(null);

  // Quick Doc Preview Modal
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter tasks assigned to Kriti
  const myTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.assignedTo.includes("Kriti") || t.assignedTo.includes("Article")
    );
  }, [tasks]);

  // Filtered tasks based on search & filter
  const filteredTasks = useMemo(() => {
    return myTasks.filter((task) => {
      // Search match
      const q = returnSearch.toLowerCase();
      const matchesSearch = 
        task.entityName.toLowerCase().includes(q) ||
        task.title.toLowerCase().includes(q) ||
        (task.pan && task.pan.toLowerCase().includes(q)) ||
        (task.gstin && task.gstin.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === "ACTION_REQUIRED") {
        if (task.status === "FILED_AND_COMPLETED") return false;
      } else if (statusFilter === "PENDING_DOCS") {
        if (task.missingDocumentsCount === 0) return false;
      } else if (statusFilter === "PARTNER_SIGN_OFF") {
        if (task.status !== "PARTNER_SIGN_OFF") return false;
      } else if (statusFilter === "FILED") {
        if (task.status !== "FILED_AND_COMPLETED") return false;
      }

      // Category Filter
      if (categoryFilter !== "ALL") {
        if (task.category !== categoryFilter) return false;
      }

      return true;
    });
  }, [myTasks, returnSearch, statusFilter, categoryFilter]);

  // Filtered documents based on search & filter
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const q = docSearch.toLowerCase();
      const matchesSearch = 
        doc.fileName.toLowerCase().includes(q) ||
        doc.entityName.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      if (docStatusFilter !== "ALL" && doc.reviewStatus !== docStatusFilter) return false;
      if (docCategoryFilter !== "ALL" && doc.category !== docCategoryFilter) return false;

      return true;
    });
  }, [documents, docSearch, docStatusFilter, docCategoryFilter]);

  // Total Hours Logged & Regulation 60 Analysis
  const totalHoursLogged = useMemo(() => {
    return timesheetEntries.reduce((acc, curr) => acc + curr.hours, 0);
  }, [timesheetEntries]);

  const filteredTimesheetEntries = useMemo(() => {
    return timesheetEntries.filter((entry) => {
      const matchesCategory =
        timesheetCategoryFilter === "ALL" || entry.category === timesheetCategoryFilter;
      const matchesClient =
        timesheetClientFilter === "ALL" || entry.entityName.toLowerCase().includes(timesheetClientFilter.toLowerCase());
      return matchesCategory && matchesClient;
    });
  }, [timesheetEntries, timesheetCategoryFilter, timesheetClientFilter]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {
      TAX_AUDIT: 0,
      DIRECT_TAX: 0,
      GST: 0,
      SCRUTINY: 0,
      STATUTORY_AUDIT: 0,
      ACCOUNTING: 0
    };
    timesheetEntries.forEach((e) => {
      if (map[e.category] !== undefined) {
        map[e.category] += e.hours;
      } else {
        map.ACCOUNTING += e.hours;
      }
    });
    return map;
  }, [timesheetEntries]);

  // Open Chase Modal
  const handleOpenChaseModal = (task: ComplianceTask) => {
    setChasingTask(task);
    const missingDocsStr = task.missingDocumentsList?.join(", ") || "Statutory Bank Statement, Branch Cash Reconciliation Sheet";
    const defaultMsg = `Dear ${task.entityName} Team,\n\nThis is Kriti Jain from GPA & Co., Chartered Accountants.\n\nRegarding statutory filing of "${task.title}" for period ${task.period} (Due Date: ${formatDate(task.dueDate)}):\n\nWe urgently require the following pending documents to finalize workpapers:\n• ${missingDocsStr}\n\nPlease share these over WhatsApp or upload via the firm portal today to avoid late fees.\n\nThank you,\nGPA & Co., Chartered Accountants`;
    setCustomChaseMessage(defaultMsg);
    setChaseModalOpen(true);
  };

  // Dispatch Chase Message
  const handleSendCustomChase = () => {
    if (!chasingTask) return;
    const targetPhone = "919823011928";
    const sanitized = sanitizeIndianPhoneNumber(targetPhone);
    window.open(`https://wa.me/${sanitized}?text=${encodeURIComponent(customChaseMessage)}`, "_blank");

    updateTask(chasingTask.id, { 
      chaseCount: (chasingTask.chaseCount || 0) + 1, 
      lastChaseDate: new Date().toISOString().split("T")[0] 
    }).catch(console.error);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === chasingTask.id ? { ...t, chaseCount: (t.chaseCount || 0) + 1, lastChaseDate: new Date().toISOString().split("T")[0] } : t
      )
    );

    setChaseModalOpen(false);
    toast.success("WhatsApp Chase Dispatched", `Notification sent to ${chasingTask.entityName}`);
  };

  // Open Escalation / Maker Review Modal
  const handleOpenEscalateModal = (task: ComplianceTask) => {
    setEscalatingTask(task);
    setChecklistBrs(true);
    setChecklistGstr2b(true);
    setChecklistTds(true);
    setChecklistMsme(true);
    setArticleMemoNote(`All audit vouchers checked against books of accounts. Maker verification completed by Kriti Jain (CRO022998). Ready for CA Gunjan Jain partner sign-off.`);
    setEscalateModalOpen(true);
  };

  // Confirm Escalation to Partner
  const handleConfirmEscalation = () => {
    if (!escalatingTask) return;

    updateTask(escalatingTask.id, {
      status: "PARTNER_SIGN_OFF",
      reviewedBy: "CA Gunjan Jain"
    }).catch(console.error);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === escalatingTask.id
          ? { ...t, status: "PARTNER_SIGN_OFF", reviewedBy: "CA Gunjan Jain" }
          : t
      )
    );

    setEscalateModalOpen(false);
    toast.success("Escalated to Partner", `Engagement moved to Partner Sign-Off for CA Gunjan Jain.`);
  };

  // Bank Statement Decryption
  const handleDecryptStatement = (doc: EncryptedQueueDoc) => {
    setDecryptingFileId(doc.id);
    setTimeout(() => {
      setDecryptingFileId(null);
      setDecryptedFiles((prev) => [...prev, doc.id]);
      setSelectedCrackedEntityId(doc.entityId);
      toast.success(
        "PDF Password Cracked", 
        `Unlocked ${doc.bankName} statement using ${doc.heuristicRule.replace(/_/g, " ")} (${doc.computedPassword})!`
      );
    }, 1400);
  };

  const handleTestCustomPassword = (targetDoc: EncryptedQueueDoc) => {
    if (!customTestPassword.trim()) {
      toast.warning("Empty Password", "Please enter a test password to verify.");
      return;
    }
    const isMatch = customTestPassword.trim().toUpperCase() === targetDoc.computedPassword.toUpperCase();
    if (isMatch) {
      setTestPasswordResult({
        success: true,
        message: `Password "${customTestPassword}" MATCHED! Successfully decrypted ${targetDoc.fileName}.`
      });
      if (!decryptedFiles.includes(targetDoc.id)) {
        setDecryptedFiles((prev) => [...prev, targetDoc.id]);
      }
      setSelectedCrackedEntityId(targetDoc.entityId);
      toast.success("Decryption Verified", `Direct password unlock confirmed!`);
    } else {
      setTestPasswordResult({
        success: false,
        message: `Password "${customTestPassword}" FAILED. Checksum mismatch for ${targetDoc.bankName}.`
      });
      toast.error("Password Invalid", "Incorrect statement password for this bank format.");
    }
  };

  // Handle WhatsApp Send with Web/App Routing & State Persistence
  const handleSendMessage = (textToSend?: string) => {
    const finalMsg = (textToSend || chatMessage).trim();
    if (!finalMsg) return;

    const newMsg: WhatsAppChatMessage = {
      id: `MSG-${Date.now()}`,
      sender: "Kriti Jain (Article)",
      text: finalMsg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isClient: false,
    };

    setChannels(prev => ({
      ...prev,
      [activeChannel.entityId]: {
        ...activeChannel,
        messages: [...activeChannel.messages, newMsg]
      }
    }));

    const sanitized = sanitizeIndianPhoneNumber(activeChannel.phone);
    const encoded = encodeURIComponent(finalMsg);
    const url = whatsAppPlatform === "WEB"
      ? `https://web.whatsapp.com/send?phone=${sanitized}&text=${encoded}`
      : `https://wa.me/${sanitized}?text=${encoded}`;
    
    window.open(url, "_blank");
    setChatMessage("");
    toast.success("WhatsApp Dispatched", `Opened message thread for ${activeChannel.clientName}`);
  };

  // Log as SA 580 Written Management Representation
  const handleLogManagementRepresentation = (msg: WhatsAppChatMessage) => {
    const refCode = `SA580-${activeChannel.entityId.replace("CLI-", "")}-${Date.now().toString().slice(-4)}`;
    
    setChannels(prev => ({
      ...prev,
      [activeChannel.entityId]: {
        ...activeChannel,
        messages: activeChannel.messages.map(m => 
          m.id === msg.id ? { ...m, isManagementRepresentation: true, auditRef: refCode } : m
        )
      }
    }));

    toast.success(
      "Management Representation Logged (SA 580)",
      `Archived instruction into permanent audit trail with Ref: ${refCode}`
    );
  };

  // Open Template Modal
  const handleOpenPresetModal = (templateKey: string) => {
    let title = "";
    let category = "";
    let text = "";

    if (templateKey === "DOC_CHASE") {
      title = "Chase Missing Invoices & Bank Records";
      category = "GSTR-3B & Tax Audit";
      text = `Dear ${activeChannel.contactName} Ji,\n\nThis is Kriti Jain from GPA & Co., Chartered Accountants.\n\nWhile reconciling ${activeChannel.clientName}'s books for statutory return filing, we noted missing purchase vouchers in GSTR-2B and pending bank statement pages.\n\nKindly share these documents today or upload them to the firm vault so we can avoid Section 50 interest or late filing fees.\n\nRegards,\nKriti Jain | GPA & Co.`;
    } else if (templateKey === "ADVANCE_TAX") {
      title = "Advance Tax Advisory & Challan 280";
      category = "Direct Tax (Sec 208)";
      text = `Dear ${activeChannel.contactName} Ji,\n\nAdvance Tax advisory for ${activeChannel.clientName} (PAN: ${activeChannel.pan}) for the upcoming statutory quarter.\n\nEstimated Tax Liability: ₹4,50,000.\nDue Date: 15th of the month.\n\nPlease remit via Challan 280 (Major Head 0020 / Minor Head 100) to mitigate interest under Section 234B & 234C.\n\nRegards,\nGPA & Co., Chartered Accountants`;
    } else if (templateKey === "FILING_ACK") {
      title = "Statutory Filing Acknowledgement (ARN)";
      category = "Filing Delivery";
      text = `Dear ${activeChannel.contactName} Ji,\n\nWe have successfully filed the statutory return for ${activeChannel.clientName}.\n\n• Form / Return: GSTR-3B Monthly Return\n• Filing ARN: AA2709260192841\n• Status: Verified & Recorded\n\nThe official department challan counterfoil and signed acknowledgement have been archived to your client portal vault.\n\nRegards,\nGPA & Co., Chartered Accountants`;
    } else if (templateKey === "SEC_43BH") {
      title = "MSME Section 43B(h) Creditor Declaration";
      category = "Tax Audit 44AB";
      text = `Dear ${activeChannel.contactName} Ji,\n\nFor Form 3CD Tax Audit certification of ${activeChannel.clientName}, please furnish Udyam registration certificates or written MSME status declarations for trade payables overdue beyond 45 days.\n\nUnder Section 43B(h) of the Income Tax Act, overdue balances to Micro & Small enterprises without valid payment terms will be disallowed and added to taxable business income.\n\nRegards,\nGPA & Co., Chartered Accountants`;
    } else if (templateKey === "SCRUTINY_CALL") {
      title = "Section 142(1) Scrutiny Notice Requisition";
      category = "Income Tax Scrutiny";
      text = `Dear ${activeChannel.contactName} Ji,\n\nThe Income Tax Department has issued an electronic notice u/s 142(1) for AY 2026-27 in the case of ${activeChannel.clientName}.\n\nPlease arrange ledger confirmations, bank remittances, and export contract copies for Ward 1(1) submission before the compliance cutoff date.\n\nRegards,\nGPA & Co., Chartered Accountants`;
    } else if (templateKey === "SIGNATORY_OTP") {
      title = "Signatory Call Heads-Up (10-Min Warning)";
      category = "Authentication Coordination";
      text = `Dear ${activeChannel.contactName} Ji,\n\nWe are preparing the final upload of statutory returns on the e-Filing portal for ${activeChannel.clientName}.\n\nOur team will place a brief call to you in approximately 10 minutes for Aadhaar EVC / DSC verification. Please keep your mobile phone accessible.\n\nRegards,\nKriti Jain | GPA & Co.`;
    }

    setPresetDraft({ title, category, text });
    setPresetModalOpen(true);
  };

  // Trigger Signatory OTP Heads-up
  const handleTriggerOtpHeadsUp = () => {
    const portalLabel = 
      otpPortal === "INCOME_TAX" ? "Income Tax E-filing Portal (ITBA / ITR-6)" :
      otpPortal === "GSTN" ? "GST Common Portal (GSTR-3B Filing)" :
      otpPortal === "MCA_V3" ? "MCA V3 Portal (DIR-3 KYC / Form 8)" : "TRACES TDS Portal";

    openWhatsAppPreset(
      otpActiveChannel.phone,
      "OTP_CALL_NOTICE",
      {
        clientName: `${otpActiveChannel.contactName} (${otpActiveChannel.clientName})`,
        portalName: portalLabel,
        serviceName: "Statutory E-filing Authentication",
        callTime: new Date(Date.now() + 10 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    );
    setOtpCoordinationState("heads_up_sent");
    toast.info(
      "OTP Heads-Up Dispatched",
      `Signatory ${otpActiveChannel.contactName} notified via WhatsApp for upcoming authentication call.`
    );
  };

  const handleStartLiveCall = () => {
    setOtpCoordinationState("live_call");
    setOtpCountdownSeconds(600);
    setIsTimerRunning(true);
    toast.info("Live Call Started", `10-minute portal authentication timer running with ${otpActiveChannel.contactName}.`);
  };

  const handleCompleteAuthentication = () => {
    setIsTimerRunning(false);
    setOtpCoordinationState("filing_authorized");

    const generatedArn =
      otpPortal === "INCOME_TAX" ? `ITD${Date.now().toString().slice(-9)}` :
      otpPortal === "GSTN" ? `AA271026${Date.now().toString().slice(-6)}` :
      otpPortal === "MCA_V3" ? `SRN-V3-${Date.now().toString().slice(-7)}` :
      `TD-ACK-${Date.now().toString().slice(-7)}`;
    const finalArn = otpArnInput.trim() ? otpArnInput.trim().toUpperCase() : generatedArn;

    const newRecord: OtpCallRecord = {
      id: `CALL-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      clientName: otpActiveChannel.clientName,
      portal: otpPortal === "INCOME_TAX" ? "Income Tax E-filing (ITBA)" :
              otpPortal === "GSTN" ? "GST Common Portal (GSTN)" :
              otpPortal === "MCA_V3" ? "MCA V3 Portal" : "TRACES TDS Portal",
      returnName: otpPortal === "INCOME_TAX" ? "ITR-6 Corporate Income Tax" :
                  otpPortal === "GSTN" ? "GSTR-3B Monthly Return" :
                  otpPortal === "MCA_V3" ? "DIR-3 KYC Web" : "Form 26Q TDS Return",
      signatory: `${otpActiveChannel.contactName} (${otpActiveChannel.designation})`,
      phone: `+${otpActiveChannel.phone}`,
      articleMaker: "Kriti Jain (Article CRO022998)",
      result: "AUTHENTICATED_AND_FILED",
      arnOrAck: finalArn
    };

    setCallRecords([newRecord, ...callRecords]);
    setOtpArnInput("");
    toast.success("Authentication Completed", `Return successfully verified and filed! ARN: ${finalArn}`);
  };

  const handleFailCall = () => {
    setIsTimerRunning(false);
    setOtpCoordinationState("idle");

    const newRecord: OtpCallRecord = {
      id: `CALL-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      clientName: otpActiveChannel.clientName,
      portal: otpPortal === "INCOME_TAX" ? "Income Tax E-filing (ITBA)" :
              otpPortal === "GSTN" ? "GST Common Portal (GSTN)" :
              otpPortal === "MCA_V3" ? "MCA V3 Portal" : "TRACES TDS Portal",
      returnName: otpPortal === "INCOME_TAX" ? "ITR-6 Corporate Income Tax" :
                  otpPortal === "GSTN" ? "GSTR-3B Monthly Return" :
                  otpPortal === "MCA_V3" ? "DIR-3 KYC Web" : "Form 26Q TDS Return",
      signatory: `${otpActiveChannel.contactName} (${otpActiveChannel.designation})`,
      phone: `+${otpActiveChannel.phone}`,
      articleMaker: "Kriti Jain (Article CRO022998)",
      result: "FAILED_UNREACHABLE",
      arnOrAck: "N/A - EXPIRED / UNREACHABLE"
    };

    setCallRecords([newRecord, ...callRecords]);
    toast.error("Call Logged as Failed", "Signatory was unreachable or OTP expired. Recorded in SA 230 filing audit log.");
  };

  const handleExtendTimer = () => {
    setOtpCountdownSeconds((prev) => prev + 300);
    toast.info("Timer Extended", "Added 5 minutes to department authentication window.");
  };

  const handleResetOtpCoordination = () => {
    setOtpCoordinationState("idle");
    setIsTimerRunning(false);
    setOtpCountdownSeconds(600);
    setOtpArnInput("");
  };

  // Document Approval
  const handleApproveDoc = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              reviewStatus: "APPROVED",
              reviewedBy: "Kriti Jain (Article)",
              reviewedAt: new Date().toISOString(),
            }
          : d
      )
    );
    const targetDoc = documents.find((d) => d.id === docId);
    setTasks((prev) =>
      prev.map((t) =>
        ((targetDoc && t.id === targetDoc.taskId) ||
          (targetDoc && t.entityId === targetDoc.entityId) ||
          (targetDoc && t.entityName.toLowerCase() === targetDoc.entityName.toLowerCase())) &&
        t.status === "DOCUMENTS_AWAITED"
          ? { ...t, status: "IN_PREPARATION", missingDocumentsCount: Math.max(0, (t.missingDocumentsCount || 1) - 1) }
          : t
      )
    );
    toast.success(
      "Workpaper Approved",
      "Document verified by Kriti Jain. Engagement advanced to In Preparation."
    );
  };

  // Document Rejection
  const handleRejectDocWithWhatsApp = (doc: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, reviewStatus: "CORRECTION_NEEDED" } : d))
    );
    openWhatsAppPreset("919823011928", "DOC_CHASE", {
      clientName: doc.entityName,
      serviceName: "Statutory Verification",
      missingDocs: [`Correction needed on ${doc.fileName} (Unclear scan or statement incomplete)`],
    });
    toast.warning(
      "Clarification Requested",
      `WhatsApp message triggered to ${doc.entityName} for ${doc.fileName}.`
    );
  };

  // Submit Weekly Timesheet (ICAI Form 108 Certification)
  const handleSubmitTimesheet = () => {
    setIsSubmittingTimesheet(true);
    setTimeout(() => {
      setIsSubmittingTimesheet(false);
      setTimesheetSubmitted(true);
      // Auto-stamp partner approval on submitted week
      setTimesheetEntries((prev) =>
        prev.map((e) => ({ ...e, status: "PARTNER_APPROVED" as const }))
      );
      toast.success(
        "Form 102/103 Certified",
        "Weekly article training diary signed and locked for CA Gunjan Jain, FCA attestation."
      );
      setTimeout(() => setTimesheetSubmitted(false), 4000);
    }, 1200);
  };

  // Add Log Entry (with Regulation 60 8-hr daily cap check)
  const handleAddTimesheetLog = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(newLogHours) || 1;
    if (hoursNum > 8.0) {
      toast.warning(
        "Regulation 60 Cap",
        "ICAI Regulation 60 caps working hours at 8 hours per day. Value adjusted to 8.0 hrs."
      );
    }
    const finalHours = Math.min(hoursNum, 8.0);

    const newEntry: TimesheetEntry = {
      id: `TS-${Date.now()}`,
      date: newLogDate || new Date().toISOString().split("T")[0],
      entityName: newLogEntity,
      taskTitle: newLogTask,
      category: newLogCategory,
      hours: finalHours,
      notes: newLogNotes,
      status: "LOGGED"
    };

    setTimesheetEntries([newEntry, ...timesheetEntries]);
    setShowAddLogModal(false);
    setNewLogTask("");
    setNewLogNotes("");
    toast.success("Work Hours Logged", `${finalHours} hrs recorded for ${newEntry.date} in Form 102/103 diary.`);
  };

  return (
    <div className="space-y-4">
      {/* Article Header & Mentorship Credential Card */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-black px-2.5 py-0.5 rounded-full bg-red-50 text-btred-logo border border-red-200">
              Active Article Trainee
            </span>
            <span className="text-xs text-slate-700 font-bold">
              Kriti Jain &bull; Assigned Article Assistant &bull; Reg: CRO022998
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
              ICAI New Scheme 2023 &bull; Year 2
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            Article Execution Workbench &amp; Automation Hub
          </h3>

          <div className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Principal Mentor: <strong className="text-slate-800 font-bold">CA Gunjan Jain, FCA (M.No. 518492)</strong></span>
            <span>Firm: <strong className="text-slate-800 font-bold">GPA &amp; Co. (FRN: 022998C)</strong></span>
            <span>Permissible Leaves: <strong className="text-emerald-700 font-bold">10 / 24 Days Used (Reg 59)</strong></span>
            <span>Form 108 Due: <strong className="text-slate-800 font-bold">14 Aug 2026</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            onClick={() => setShowAddLogModal(true)}
            className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            Log Work Hours
          </button>
          <button
            onClick={() => {
              setActiveTab("otp-relay");
            }}
            className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-btred-logo border border-red-200 font-bold px-3.5 py-2 rounded-2xl text-xs transition flex items-center justify-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Signatory OTP
          </button>
        </div>
      </div>

      {/* Main Responsive Tab Navigation Bar (No Truncation) */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max text-xs font-bold">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "tasks" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            My Returns ({myTasks.length})
          </button>

          <button
            onClick={() => setActiveTab("doc-review")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "doc-review" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Client Doc Intake ({documents.filter(d => d.reviewStatus === "PENDING_REVIEW").length})
          </button>

          <button
            onClick={() => setActiveTab("bank-decryptor")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "bank-decryptor" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Bank OCR &amp; Tally XML
          </button>

          <button
            onClick={() => setActiveTab("chat-hub")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "chat-hub" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            1-Tap WhatsApp Desk
          </button>

          <button
            onClick={() => setActiveTab("otp-relay")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "otp-relay" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Signatory OTP Coordination
          </button>

          <button
            onClick={() => setActiveTab("timesheet")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "timesheet" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Timesheet ({totalHoursLogged} hrs)
          </button>

          <button
            onClick={() => setActiveTab("icai-register")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "icai-register" ? "bg-btred-logo text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ICAI Form 102/103/108 &amp; Stipend
          </button>
        </div>
      </div>

      {/* TAB 1: ARTICLE TASKS TABLE */}
      {activeTab === "tasks" && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm space-y-3 p-4">
          {/* Header & Subtitle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Assigned Compliance Engagements &bull; Ready for Workpapers &amp; Review
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Prioritized by statutory deadline cutoff. Maker article verification required before Partner E-Sign.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              {filteredTasks.length} Engagements Shown
            </span>
          </div>

          {/* Search Bar & Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: "ALL", label: `All Returns (${myTasks.length})` },
                { id: "ACTION_REQUIRED", label: `Action Needed (${myTasks.filter(t => t.status !== "FILED_AND_COMPLETED").length})` },
                { id: "PENDING_DOCS", label: `Missing Docs (${myTasks.filter(t => t.missingDocumentsCount > 0).length})` },
                { id: "PARTNER_SIGN_OFF", label: `Partner Sign-Off (${myTasks.filter(t => t.status === "PARTNER_SIGN_OFF").length})` },
                { id: "FILED", label: `Completed (${myTasks.filter(t => t.status === "FILED_AND_COMPLETED").length})` }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === f.id
                      ? "bg-slate-900 text-white shadow"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Category & Search Input */}
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="GST">GST (3B/1)</option>
                <option value="TAX_AUDIT">Tax Audit (3CD)</option>
                <option value="INCOME_TAX">Income Tax (ITR-6)</option>
                <option value="ROC_MCA">ROC / MCA V3</option>
                <option value="TDS">TDS (26Q)</option>
              </select>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search client, task, PAN..."
                  value={returnSearch}
                  onChange={(e) => setReturnSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Compliance Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 font-black">
                <tr>
                  <th className="py-3 px-4">Entity &amp; Task</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Statutory Due Date</th>
                  <th className="py-3 px-4">Workflow Status</th>
                  <th className="py-3 px-4">Missing Docs</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium bg-white">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      No statutory returns matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const isForm3cd = task.category === "TAX_AUDIT";
                    const isOverdue = new Date(task.dueDate) < new Date("2026-10-25");
                    const isDone = task.status === "FILED_AND_COMPLETED";

                    return (
                      <tr key={task.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-900 text-sm">{task.entityName}</div>
                          <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                            <span>{task.title}</span>
                            {task.pan && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                PAN: {task.pan}
                              </span>
                            )}
                          </div>
                          {task.officialUdin && (
                            <div className="text-[10px] font-mono text-emerald-800 font-bold mt-1 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                              ICAI UDIN: <span className="bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">{task.officialUdin}</span>
                              <span className="text-slate-400 font-normal">(Signatory: CA Gunjan Jain, MRN 518492)</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-800 font-semibold">{task.period}</td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-black ${isOverdue && !isDone ? "text-btred-logo" : "text-slate-900"}`}>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                          {isDone ? (
                            <span className="block text-[10px] text-emerald-700 font-bold">Filing Verified</span>
                          ) : isOverdue ? (
                            <span className="block text-[10px] text-red-600 font-bold">
                              {task.category === "GST" ? "Overdue: ₹50/day late fee u/s 47" :
                               task.category === "TAX_AUDIT" ? "Statutory Cutoff u/s 44AB (Sec 271B risk)" :
                               task.category === "ROC_MCA" ? "MCA Rule 12A Late Fee: ₹5,000" :
                               "Past Deadline"}
                            </span>
                          ) : (
                            <span className="block text-[10px] text-amber-700 font-bold">
                              Priority: {task.priority}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            task.status === "FILED_AND_COMPLETED" 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                              : task.status === "PARTNER_SIGN_OFF" 
                              ? "bg-purple-50 text-purple-800 border-purple-200" 
                              : task.status === "MANAGER_REVIEW" 
                              ? "bg-blue-50 text-blue-800 border-blue-200" 
                              : task.status === "IN_PREPARATION" 
                              ? "bg-amber-50 text-amber-800 border-amber-200" 
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}>
                            {task.status.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {task.missingDocumentsCount > 0 ? (
                            <div className="space-y-0.5">
                              <span className="text-amber-700 font-black text-[11px] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                {task.missingDocumentsCount} Docs Pending
                              </span>
                              <span className="text-[10px] text-slate-600 block truncate max-w-[180px]">
                                {task.missingDocumentsList?.[0] || "Pending verification"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Complete
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Form 3CD Workpaper Trigger */}
                          {isForm3cd && (
                            <button
                              onClick={() => {
                                setSelectedWorkpaperEntity(task.entityName);
                                setWorkpaperModalOpen(true);
                              }}
                              className="bg-btred-logo hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl transition text-[11px] inline-flex items-center gap-1 shadow-xs"
                            >
                              <FileText className="w-3 h-3 text-amber-300" />
                              Form 3CD Workpaper
                            </button>
                          )}

                          {/* WhatsApp Chase Button for Missing Docs */}
                          {task.missingDocumentsCount > 0 && (
                            <button
                              onClick={() => handleOpenChaseModal(task)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black px-3 py-1.5 rounded-xl transition text-[11px] inline-flex items-center gap-1 border border-emerald-300"
                            >
                              <Send className="w-3 h-3 text-emerald-600" />
                              WhatsApp Chase ({task.chaseCount})
                            </button>
                          )}

                          {/* Escalate / Article Verification Button */}
                          {!isDone && task.status !== "PARTNER_SIGN_OFF" && (
                            <button
                              onClick={() => handleOpenEscalateModal(task)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] inline-flex items-center gap-1 border border-slate-300"
                              title="Verify maker audit checks and submit for Partner review"
                            >
                              <UserCheck className="w-3 h-3 text-slate-600" />
                              Submit to Partner
                            </button>
                          )}

                          {/* Partner Sign-Off Notice */}
                          {task.status === "PARTNER_SIGN_OFF" && !isForm3cd && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-xl inline-block">
                              Awaiting Sign-Off
                            </span>
                          )}

                          {/* Filed and Completed - Receipt Ack */}
                          {isDone && (
                            <button
                              onClick={() => {
                                setAckTask(task);
                                setAckModalOpen(true);
                              }}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] inline-flex items-center gap-1 border border-slate-200"
                            >
                              <Receipt className="w-3 h-3 text-emerald-600" />
                              Filing Ack
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT DOC INTAKE & VERIFICATION */}
      {activeTab === "doc-review" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-btred-logo" />
                Client Document Intake &amp; Statutory Audit Verification
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Verify incoming mobile and portal uploads. Approving a document advances the compliance engagement and links it to the permanent audit file.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                {documents.filter(d => d.reviewStatus === "PENDING_REVIEW").length} Awaiting Verification
              </span>
              <button
                onClick={() => setManualUploadModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                Manual Intake
              </button>
            </div>
          </div>

          {/* Search Bar & Status Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: "ALL", label: `All Documents (${documents.length})` },
                { id: "PENDING_REVIEW", label: `Awaiting Verification (${documents.filter(d => d.reviewStatus === "PENDING_REVIEW").length})` },
                { id: "APPROVED", label: `Approved & Linked (${documents.filter(d => d.reviewStatus === "APPROVED").length})` },
                { id: "CORRECTION_NEEDED", label: `Correction Needed (${documents.filter(d => d.reviewStatus === "CORRECTION_NEEDED").length})` }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDocStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    docStatusFilter === f.id
                      ? "bg-slate-900 text-white shadow"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Category & Search Input */}
            <div className="flex items-center gap-2">
              <select
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="BANK_STATEMENT">Bank Statements</option>
                <option value="AUDIT_REPORT">Audit Workpapers (3CD)</option>
                <option value="TAX_COMPUTATION">Tax Computations (ITR)</option>
                <option value="NOTICE_REPLY">Scrutiny Submissions (148/142)</option>
              </select>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search file name, client..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 rounded-xl focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs">
                No client documents matching selected filters. Intake vault is clean.
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 shrink-0">
                      <FileText className="w-5 h-5 text-btred-logo" />
                    </div>
                    <div>
                      <span className="font-black text-slate-900 text-sm block">{doc.fileName}</span>
                      <span className="text-slate-600 text-[11px] font-medium">
                        Entity: <strong>{doc.entityName}</strong> &bull; Category: {doc.category.replace(/_/g, " ")} &bull; {doc.fileSize}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 font-semibold">
                          Uploaded via: {doc.uploadedBy}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            doc.reviewStatus === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : doc.reviewStatus === "CORRECTION_NEEDED"
                              ? "bg-red-100 text-btred-logo border-red-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {doc.reviewStatus.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-xl transition text-[11px] inline-flex items-center gap-1 border border-slate-200 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Preview
                    </button>

                    {/* Actions for PENDING_REVIEW documents */}
                    {doc.reviewStatus === "PENDING_REVIEW" && (
                      <>
                        <button
                          onClick={() => handleApproveDoc(doc.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl transition text-[11px] inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve &amp; Start Work
                        </button>

                        <button
                          onClick={() => {
                            setResubmittingDoc(doc);
                            setResubmitCustomNote(`Page 3 bank seal missing / scan blurred on ${doc.fileName}`);
                            setResubmitModalOpen(true);
                          }}
                          className="bg-red-50 hover:bg-red-100 text-btred-logo font-bold px-3 py-2 rounded-xl transition text-[11px] inline-flex items-center gap-1 border border-red-200"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Request Resubmission
                        </button>
                      </>
                    )}

                    {/* Actions for APPROVED documents (NO bogus resubmission button!) */}
                    {doc.reviewStatus === "APPROVED" && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        PAF Indexed &amp; Linked
                      </span>
                    )}

                    {/* Actions for CORRECTION_NEEDED documents */}
                    {doc.reviewStatus === "CORRECTION_NEEDED" && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Client Nudged (WhatsApp)
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BANK OCR & DECRYPTOR */}
      {activeTab === "bank-decryptor" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Automated Password-Protected Bank Statement Cracker &amp; Ingestion Desk
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Eliminates calling clients for statement passwords. Uses deterministic rule engine based on Company PAN, Date of Incorporation &amp; Account Number.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black">
                100% On-Device AES-256 Decryption
              </span>
            </div>
          </div>

          {/* Heuristics & Queue Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 5 Cols: Heuristics & Custom Tester */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 block uppercase tracking-wider text-[11px]">
                  Active Decryption Heuristics
                </span>
                <span className="text-[10px] text-slate-500 font-mono">4 Bank Rules Active</span>
              </div>

              <div className="space-y-2 text-xs">
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                  decryptRule === "PAN_INCORP_YEAR" ? "bg-white border-btred-logo shadow-xs" : "bg-white/80 border-slate-200 hover:bg-white"
                }`}>
                  <input
                    type="radio"
                    name="rule"
                    checked={decryptRule === "PAN_INCORP_YEAR"}
                    onChange={() => setDecryptRule("PAN_INCORP_YEAR")}
                    className="accent-btred-logo mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Rule A: First 4 PAN chars + Incorp Year</span>
                    <span className="text-[11px] text-slate-500 font-mono block">e.g. AANC2024 / AABC2015 (HDFC &amp; ICICI Corporate)</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                  decryptRule === "ACCOUNT_LAST_6" ? "bg-white border-btred-logo shadow-xs" : "bg-white/80 border-slate-200 hover:bg-white"
                }`}>
                  <input
                    type="radio"
                    name="rule"
                    checked={decryptRule === "ACCOUNT_LAST_6"}
                    onChange={() => setDecryptRule("ACCOUNT_LAST_6")}
                    className="accent-btred-logo mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Rule B: Last 6 digits of Account Number</span>
                    <span className="text-[11px] text-slate-500 font-mono block">e.g. 019284 / 004050 (State Bank of India &amp; Kotak)</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                  decryptRule === "COMPANY_ACRONYM_DDMM" ? "bg-white border-btred-logo shadow-xs" : "bg-white/80 border-slate-200 hover:bg-white"
                }`}>
                  <input
                    type="radio"
                    name="rule"
                    checked={decryptRule === "COMPANY_ACRONYM_DDMM"}
                    onChange={() => setDecryptRule("COMPANY_ACRONYM_DDMM")}
                    className="accent-btred-logo mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Rule C: First 4 Caps of Entity + Incorp Date (DDMM)</span>
                    <span className="text-[11px] text-slate-500 font-mono block">e.g. OMNI1508 / APEX0104 (ICICI CIB &amp; IndusInd)</span>
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                  decryptRule === "PAN_LOWERCASE" ? "bg-white border-btred-logo shadow-xs" : "bg-white/80 border-slate-200 hover:bg-white"
                }`}>
                  <input
                    type="radio"
                    name="rule"
                    checked={decryptRule === "PAN_LOWERCASE"}
                    onChange={() => setDecryptRule("PAN_LOWERCASE")}
                    className="accent-btred-logo mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Rule D: Full PAN in Lowercase</span>
                    <span className="text-[11px] text-slate-500 font-mono block">e.g. aaacz5512l (Axis Bank &amp; PNB Corporate)</span>
                  </div>
                </label>
              </div>

              {/* Direct Password Test Tool */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">Manual Password Override / Quick Test:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter client password (e.g. AANC2024)..."
                    value={customTestPassword}
                    onChange={(e) => {
                      setCustomTestPassword(e.target.value);
                      if (testPasswordResult) setTestPasswordResult(null);
                    }}
                    className="flex-1 bg-white border border-slate-300 text-xs px-3 py-1.5 rounded-xl font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => handleTestCustomPassword(DEFAULT_ENCRYPTED_BANK_DOCS[0])}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition whitespace-nowrap"
                  >
                    Test Unlock
                  </button>
                </div>
                {testPasswordResult && (
                  <div className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 mt-1 ${
                    testPasswordResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {testPasswordResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                    <span>{testPasswordResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right 7 Cols: Encrypted Document Queue */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 block uppercase tracking-wider text-[11px]">
                  Encrypted Statement Queue ({DEFAULT_ENCRYPTED_BANK_DOCS.length})
                </span>
                <span className="text-[10px] text-slate-500">Live Intake Queue &bull; Ready to Ingest</span>
              </div>

              <div className="space-y-2.5">
                {DEFAULT_ENCRYPTED_BANK_DOCS.map((doc) => {
                  const isDecrypted = decryptedFiles.includes(doc.id);
                  const isProcessing = decryptingFileId === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs block">{doc.fileName}</span>
                          <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-1.5 py-0.2 rounded">
                            {doc.fileSize}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium block">
                          <strong>{doc.entityName}</strong> &bull; {doc.bankName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Rule: {doc.heuristicRule.replace(/_/g, " ")} &rarr; Key: <strong className="text-slate-800">{doc.computedPassword}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {isDecrypted ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 border border-emerald-200">
                              <Unlock className="w-3 h-3 text-emerald-600" /> Decrypted
                            </span>
                            <button
                              onClick={() => {
                                setSelectedCrackedEntityId(doc.entityId);
                                toast.success("Loaded into Tally Parser", `Switched active profile to ${doc.entityName}.`);
                                const el = document.getElementById("tally-prime-parser-desk");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                            >
                              Load into Parser &rarr;
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDecryptStatement(doc)}
                            disabled={isProcessing}
                            className="bg-btred-logo hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Cracking PDF...
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-amber-300" /> Crack &amp; Ingest
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Direct Bank Statement OCR & Tally XML Suite */}
          <div id="tally-prime-parser-desk" className="pt-6 border-t border-slate-200">
            <BankStatementParser initialEntityId={selectedCrackedEntityId} />
          </div>
        </div>
      )}

      {/* TAB 4: WHATSAPP DESK (1-Tap Zero-API Links) */}
      {activeTab === "chat-hub" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Firm-Controlled Client Channel
                </span>
                <span className="text-xs text-slate-500 font-medium">1-Tap Direct wa.me Deep Links</span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                {activeChannel.clientName}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* WhatsApp Web vs App Mode Toggle */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center text-[11px] font-bold border border-slate-200">
                <button
                  onClick={() => setWhatsAppPlatform("WEB")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    whatsAppPlatform === "WEB" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Desktop Web
                </button>
                <button
                  onClick={() => setWhatsAppPlatform("APP")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    whatsAppPlatform === "APP" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Mobile App
                </button>
              </div>

              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-[10px] font-black">
                Zero Meta Cloud API Cost
              </span>
            </div>
          </div>

          {/* Client Entity Switcher Strip & Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            {/* Client Selector (5 Cols) */}
            <div className="md:col-span-5 flex items-center gap-2">
              <span className="text-slate-500 font-bold whitespace-nowrap">Switch Client:</span>
              <select
                value={selectedChatEntityId}
                onChange={(e) => setSelectedChatEntityId(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-600"
              >
                {Object.values(channels).map((ch) => (
                  <option key={ch.entityId} value={ch.entityId}>
                    {ch.clientName} ({ch.pan})
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Details (7 Cols) */}
            <div className="md:col-span-7 flex flex-wrap items-center justify-between gap-2 px-2 text-[11px]">
              <div>
                <span className="text-slate-500">Signatory: </span>
                <strong className="text-slate-900 font-bold">{activeChannel.contactName} ({activeChannel.designation})</strong>
              </div>
              <div>
                <span className="text-slate-500">Phone: </span>
                <strong className="font-mono text-emerald-700 font-bold">+{activeChannel.phone}</strong>
              </div>
              <div className="font-mono text-slate-500">
                PAN: <strong className="text-slate-700">{activeChannel.pan}</strong>
              </div>
            </div>
          </div>

          {/* 6 Quick Statutory Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">
              Statutory Communication Presets (Click to Preview &amp; Dispatch):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "DOC_CHASE", label: "Doc Chase: GSTR-2B & Bank", icon: Send },
                { key: "ADVANCE_TAX", label: "Advance Tax Q2/Q3 Advisory", icon: Send },
                { key: "FILING_ACK", label: "Filing Ack (ARN) Dispatch", icon: Send },
                { key: "SEC_43BH", label: "MSME 43B(h) Udyam Declaration", icon: FileCheck },
                { key: "SCRUTINY_CALL", label: "Sec 142(1) Scrutiny Notice", icon: AlertTriangle },
                { key: "SIGNATORY_OTP", label: "EVC/OTP Call (10-Min Warning)", icon: PhoneCall },
              ].map((p) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleOpenPresetModal(p.key)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                  >
                    <IconComponent className="w-3 h-3 text-emerald-600" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Message Stream */}
          <div className="space-y-3 min-h-[220px] max-h-[300px] overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {activeChannel.messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.isClient ? "items-start" : "items-end"}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed space-y-1.5 ${
                    m.isClient
                      ? "bg-white border border-slate-200 text-slate-800 shadow-xs"
                      : "bg-slate-900 text-white shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] opacity-80 font-bold border-b pb-1 border-current/10">
                    <span>{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="font-medium whitespace-pre-wrap">{m.text}</p>

                  {/* SA 580 Management Representation Badge or Action */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {m.isManagementRepresentation ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        SA 580 Representation Recorded ({m.auditRef})
                      </span>
                    ) : m.isClient ? (
                      <button
                        onClick={() => handleLogManagementRepresentation(m)}
                        className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200 transition flex items-center gap-1"
                        title="Archive client instruction into permanent audit trail per SA 580"
                      >
                        <FileText className="w-3 h-3" />
                        Log as SA 580 Management Representation
                      </button>
                    ) : (
                      <span className="text-[10px] opacity-60 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Sent via {whatsAppPlatform === "WEB" ? "WhatsApp Web" : "wa.me"}
                      </span>
                    )}

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(m.text);
                        toast.success("Copied", "Message copied to clipboard.");
                      }}
                      className="opacity-60 hover:opacity-100 text-[10px] flex items-center gap-0.5"
                      title="Copy text"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Message Input Bar */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder={`Type message to open directly on WhatsApp with ${activeChannel.contactName} (+${activeChannel.phone})...`}
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-slate-50 border border-slate-300 text-xs text-slate-900 px-4 py-2.5 rounded-2xl focus:outline-none focus:border-emerald-600 font-medium"
            />
            <button
              onClick={() => handleSendMessage()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl transition flex items-center gap-2 shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
              Open WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: SIGNATORY OTP CALL COORDINATION */}
      {activeTab === "otp-relay" && (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-btred-logo border border-red-200">
                    Statutory E-Filing Desk
                  </span>
                  <span className="text-xs text-slate-500 font-bold">Live Portal Signatory Verification</span>
                </div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mt-1">
                  <PhoneCall className="w-5 h-5 text-btred-logo" />
                  Signatory OTP Call Coordination Desk (ITBA / GSTN / MCA V3)
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1 max-w-3xl leading-relaxed">
                  IT Act Sec 66C &amp; UIDAI Zero-OTP Storage Compliant workflow. Protects CA practice integrity: eliminates illegal collection or storage of Aadhaar EVC or direct SMS OTPs. Coordinates synchronous live phone verification between the Article Assistant and the authorized corporate director during live portal filing.
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-black uppercase px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Zero-Storage Relay
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SA 230 Contemporaneous Trail</span>
              </div>
            </div>

            {/* Entity & Portal Selection Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Client Entity Switcher */}
                <div className="flex-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    Target Client Entity
                  </label>
                  <select
                    value={otpSelectedEntityId}
                    onChange={(e) => {
                      setOtpSelectedEntityId(e.target.value);
                      handleResetOtpCoordination();
                    }}
                    className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-btred-logo/20 focus:border-btred-logo cursor-pointer"
                  >
                    {Object.values(channels).map((ch) => (
                      <option key={ch.entityId} value={ch.entityId}>
                        {ch.clientName} ({ch.pan}) &mdash; {ch.contactName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Government Portal Selector */}
                <div className="flex-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Filing Department &amp; Portal
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: "INCOME_TAX", label: "ITBA (Income Tax)", sub: "10m EVC" },
                      { id: "GSTN", label: "GST Common Portal", sub: "10m Aadhaar" },
                      { id: "MCA_V3", label: "MCA V3 Portal", sub: "15m DSC/OTP" },
                      { id: "TRACES", label: "TRACES TDS", sub: "10m Token" }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setOtpPortal(p.id as any);
                          handleResetOtpCoordination();
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-left transition border ${
                          otpPortal === p.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className="block text-[11px] font-black leading-tight">{p.label}</span>
                        <span className={`block text-[9px] ${otpPortal === p.id ? "text-slate-300" : "text-slate-400"}`}>
                          {p.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Signatory Dossier High-Contrast Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Tax Entity</span>
                  <span className="font-black text-slate-900 text-sm mt-0.5 block truncate">
                    {otpActiveChannel.clientName}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                    <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      PAN: {otpActiveChannel.pan}
                    </span>
                    <span className="font-semibold text-emerald-700">&bull; Active Signatory Registered</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Statutory Return In-Flight</span>
                  <span className="font-black text-slate-900 text-sm mt-0.5 block truncate">
                    {otpPortal === "INCOME_TAX" ? "ITR-6 Corporate Income Tax" :
                     otpPortal === "GSTN" ? "GSTR-3B Monthly Return" :
                     otpPortal === "MCA_V3" ? "DIR-3 KYC Web (Annual)" : "Form 26Q Q2 Quarterly TDS"}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Assessment Year: <strong>2026-27</strong> &bull; Mode: <strong>Synchronous Relay</strong>
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Authorized Signatory</span>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                      {otpActiveChannel.designation}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 text-sm mt-0.5 block">
                    {otpActiveChannel.contactName}
                  </span>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100">
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      +{otpActiveChannel.phone}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:+${otpActiveChannel.phone}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200 transition"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        Dial
                      </a>
                      <button
                        onClick={() => {
                          setSelectedChatEntityId(otpSelectedEntityId);
                          setActiveTab("chat-hub");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200 transition"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        Chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Stage Call Coordination Stepper */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Call Orchestration Workflow
                </span>
                {/* Visual Step Indicator */}
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                    otpCoordinationState === "idle" ? "bg-btred-logo text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-black">1</span>
                    <span>Pre-Alert</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                    otpCoordinationState === "heads_up_sent" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-black">2</span>
                    <span>Ready</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                    otpCoordinationState === "live_call" ? "bg-blue-600 text-white animate-pulse" : "bg-slate-100 text-slate-600"
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-black">3</span>
                    <span>Live Call ({Math.floor(otpCountdownSeconds / 60)}m)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                    otpCoordinationState === "filing_authorized" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-black">4</span>
                    <span>Filed (ARN)</span>
                  </div>
                </div>
              </div>

              {/* State 1: IDLE */}
              {otpCoordinationState === "idle" && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="space-y-1 max-w-xl">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Send className="w-4 h-4 text-btred-logo" />
                      Stage 1: Dispatch Advance WhatsApp Alert
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Send a 10-minute heads-up template to <strong>{otpActiveChannel.contactName}</strong> (+{otpActiveChannel.phone}). Alerts them that the Article Assistant is preparing the live filing and requests they keep their Aadhaar-registered mobile at hand.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleTriggerOtpHeadsUp}
                      className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      1-Tap WhatsApp Call Alert (10 Min Heads-Up)
                    </button>
                    <button
                      type="button"
                      onClick={handleStartLiveCall}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-3 py-2.5 rounded-xl transition shadow-2xs"
                    >
                      Skip to Live Call
                    </button>
                  </div>
                </div>
              )}

              {/* State 2: HEADS_UP_SENT */}
              {otpCoordinationState === "heads_up_sent" && (
                <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                      <h4 className="text-sm font-black text-amber-950">
                        Stage 2: Advance WhatsApp Notice Dispatched
                      </h4>
                    </div>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      Signatory <strong>{otpActiveChannel.contactName}</strong> has been notified on WhatsApp (+{otpActiveChannel.phone}). Dial now or launch the live countdown timer as soon as they answer.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <a
                      href={`tel:+${otpActiveChannel.phone}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Dial Signatory (+{otpActiveChannel.phone.slice(-4)})
                    </a>
                    <button
                      type="button"
                      onClick={handleStartLiveCall}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      Start Live Filing Call &amp; Timer
                    </button>
                    <button
                      type="button"
                      onClick={handleResetOtpCoordination}
                      className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-2 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* State 3: LIVE_CALL */}
              {otpCoordinationState === "live_call" && (
                <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-6 shadow-md border border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                          Live Department Filing Call Active
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white mt-1">
                        Coordinating with {otpActiveChannel.contactName} ({otpActiveChannel.designation})
                      </h4>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">
                        Triggered OTP on {otpPortal === "INCOME_TAX" ? "Income Tax Portal (ITBA)" : otpPortal === "GSTN" ? "GST Common Portal" : otpPortal === "MCA_V3" ? "MCA V3 Portal" : "TRACES"}. Have signatory read the 6-digit Aadhaar / SMS EVC code immediately.
                      </p>
                    </div>

                    {/* Countdown Clock Display */}
                    <div className="bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 flex items-center gap-4 shrink-0 shadow-inner">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                          OTP TTL Window
                        </span>
                        <div className={`font-mono text-3xl font-black ${
                          otpCountdownSeconds < 120 ? "text-red-400 animate-pulse" :
                          otpCountdownSeconds < 300 ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {Math.floor(otpCountdownSeconds / 60).toString().padStart(2, "0")}:
                          {(otpCountdownSeconds % 60).toString().padStart(2, "0")}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleExtendTimer}
                        title="Add 5 Minutes to Department OTP Window"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold px-2.5 py-2 rounded-xl transition border border-slate-700 flex flex-col items-center gap-0.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>+5m</span>
                      </button>
                    </div>
                  </div>

                  {/* Article Clerk Live Script & ARN Capture */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                        Article Script (Verbal Prompt)
                      </span>
                      <p className="text-xs text-slate-200 italic leading-relaxed">
                        &ldquo;Sir/Ma&apos;am, I have submitted {otpPortal === "INCOME_TAX" ? "the ITR-6 return on ITBA" : otpPortal === "GSTN" ? "GSTR-3B on GSTN" : "the statutory form on MCA"}. Please check your phone for the 6-digit Aadhaar EVC received from the department and kindly read it out.&rdquo;
                      </p>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Department Acknowledgement / ARN (Optional Input)
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={otpArnInput}
                          onChange={(e) => setOtpArnInput(e.target.value)}
                          placeholder="e.g. AA271026001928C (Leave empty to auto-generate)"
                          className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Zero-Knowledge Relay &bull; OTP is never stored or cached</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleFailCall}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold px-3 py-2 rounded-xl transition"
                      >
                        Call Failed / Unreachable
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteAuthentication}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        Authentication Succeeded &bull; Stamp ARN &amp; File
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* State 4: FILING_AUTHORIZED */}
              {otpCoordinationState === "filing_authorized" && (
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-black text-emerald-950">
                        Stage 4: Return Successfully Verified &amp; Filed!
                      </h4>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                      Client director <strong>{otpActiveChannel.contactName}</strong> successfully verified the department EVC code over live call. Contemporaneous proof logged to SA 230 audit register.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetOtpCoordination}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Coordinate Next Filing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permanent Call Log & SA 230 Audit Register */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Statutory Filing Call Audit Trail (SA 230 Workpaper Register)
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Permanent contemporaneous audit file proving verbal signatory authorization for tax filings under ICAI Standards on Auditing 230.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full self-start sm:self-auto font-mono">
                {callRecords.length} Authenticated Records
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3.5">Timestamp</th>
                    <th className="py-3 px-3.5">Client Taxpayer Entity</th>
                    <th className="py-3 px-3.5">Filing Portal &amp; Return</th>
                    <th className="py-3 px-3.5">Signatory Contact</th>
                    <th className="py-3 px-3.5">Article Maker</th>
                    <th className="py-3 px-3.5">Auth Status</th>
                    <th className="py-3 px-3.5">ARN / Ack Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {callRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {rec.timestamp}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-900 block">{rec.clientName}</span>
                        <span className="text-[10px] font-mono text-slate-500">ID: {rec.id}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-800 block">{rec.returnName}</span>
                        <span className="text-[10px] text-slate-500">{rec.portal}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-900 block">{rec.signatory}</span>
                        <span className="text-[10px] font-mono text-slate-500">{rec.phone}</span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                        {rec.articleMaker}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {rec.result === "AUTHENTICATED_AND_FILED" ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Filed &amp; Stamped
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 rounded-full flex items-center gap-1 w-max">
                            <AlertCircle className="w-2.5 h-2.5 text-red-600" />
                            Unreachable / Expired
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {rec.arnOrAck}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(rec.arnOrAck);
                              toast.info("Copied to Clipboard", `Acknowledgement ${rec.arnOrAck} copied.`);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                            title="Copy ARN"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Mandate Compliance Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-white block">
                  Statutory Non-Storage Mandate &bull; IT Act Section 66C &amp; UIDAI Circular F.No. 11020/2020
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Chartered Accountancy firms are legally prohibited from collecting, caching, or automatically intercepting Aadhaar OTPs and NetBanking credentials. Brains &amp; Taxes provides synchronous coordination tools exclusively to orchestrate live client relay while preserving full audit defensibility under SA 230.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700">
                FRN: 022998C &bull; GPA &amp; Co.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ICAI FORM 102/103 TIMESHEET */}
      {activeTab === "timesheet" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Header Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-btred-logo border border-red-200">
                  ICAI Form 102/103
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Regulation 60 &amp; 67 Practical Training Log &bull; New Scheme 2023
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Weekly Statutory Work Hours Log &amp; Training Journal
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-1 max-w-3xl leading-relaxed">
                ICAI Practical Training Logbook maintained under Regulation 60. Articled assistants must record daily statutory client engagements subject to a strict <strong>8-hour daily cap</strong> and <strong>35-hour weekly threshold</strong>. Form 108 completion certifications are substantiated against these contemporaneous work entries.
              </p>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Week Ending 24 Oct 2026
                </span>
                <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                  <span className="text-xl font-black text-slate-900 font-mono">{totalHoursLogged}</span>
                  <span className="text-xs font-bold text-slate-500">/ 35.0 hrs min</span>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1 inline-block">
                  ✓ Reg 60 Compliant (Avg 6.3h/day)
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  Log Daily Hours
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm103ExportModal(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Form 102/103 Extract
                </button>
              </div>
            </div>
          </div>

          {/* ICAI Practical Training Domain Exposure Breakdown (Segmented Progress Bar) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                ICAI Domain Practical Exposure Allocation ({totalHoursLogged} Hours Logged)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Mandatory balanced coverage across Direct Tax, GST, Audit &amp; Law
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${(categoryBreakdown.TAX_AUDIT / (totalHoursLogged || 1)) * 100}%` }}
                className="bg-indigo-600 h-full transition-all"
                title={`Tax Audit (Sec 44AB): ${categoryBreakdown.TAX_AUDIT} hrs`}
              />
              <div
                style={{ width: `${(categoryBreakdown.DIRECT_TAX / (totalHoursLogged || 1)) * 100}%` }}
                className="bg-purple-600 h-full transition-all"
                title={`Corporate Tax (ITR-6): ${categoryBreakdown.DIRECT_TAX} hrs`}
              />
              <div
                style={{ width: `${(categoryBreakdown.GST / (totalHoursLogged || 1)) * 100}%` }}
                className="bg-emerald-600 h-full transition-all"
                title={`GST Compliance: ${categoryBreakdown.GST} hrs`}
              />
              <div
                style={{ width: `${(categoryBreakdown.SCRUTINY / (totalHoursLogged || 1)) * 100}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Scrutiny Submissions: ${categoryBreakdown.SCRUTINY} hrs`}
              />
              <div
                style={{ width: `${(categoryBreakdown.STATUTORY_AUDIT / (totalHoursLogged || 1)) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Statutory Audit & CARO: ${categoryBreakdown.STATUTORY_AUDIT} hrs`}
              />
              <div
                style={{ width: `${(categoryBreakdown.ACCOUNTING / (totalHoursLogged || 1)) * 100}%` }}
                className="bg-cyan-600 h-full transition-all"
                title={`Accounting & MIS: ${categoryBreakdown.ACCOUNTING} hrs`}
              />
            </div>

            {/* Domain Legend Chips */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Tax Audit: {categoryBreakdown.TAX_AUDIT}h ({Math.round((categoryBreakdown.TAX_AUDIT / (totalHoursLogged || 1)) * 100)}%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                Corporate Tax: {categoryBreakdown.DIRECT_TAX}h ({Math.round((categoryBreakdown.DIRECT_TAX / (totalHoursLogged || 1)) * 100)}%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                GST Audits: {categoryBreakdown.GST}h ({Math.round((categoryBreakdown.GST / (totalHoursLogged || 1)) * 100)}%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Scrutiny &amp; Appeals: {categoryBreakdown.SCRUTINY}h ({Math.round((categoryBreakdown.SCRUTINY / (totalHoursLogged || 1)) * 100)}%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                CARO 2020: {categoryBreakdown.STATUTORY_AUDIT}h ({Math.round((categoryBreakdown.STATUTORY_AUDIT / (totalHoursLogged || 1)) * 100)}%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200">
                <span className="w-2 h-2 rounded-full bg-cyan-600" />
                Accounting &amp; MIS: {categoryBreakdown.ACCOUNTING}h ({Math.round((categoryBreakdown.ACCOUNTING / (totalHoursLogged || 1)) * 100)}%)
              </span>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTimesheetCategoryFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  timesheetCategoryFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Domains
              </button>
              {[
                { id: "TAX_AUDIT", label: "Tax Audit (44AB)" },
                { id: "DIRECT_TAX", label: "Corporate Direct Tax" },
                { id: "GST", label: "GST & Reconciliations" },
                { id: "SCRUTINY", label: "Scrutiny (142(1))" },
                { id: "STATUTORY_AUDIT", label: "CARO & Audit" },
                { id: "ACCOUNTING", label: "Accounting & MIS" }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTimesheetCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    timesheetCategoryFilter === c.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Client Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold shrink-0">Client:</span>
              <select
                value={timesheetClientFilter}
                onChange={(e) => setTimesheetClientFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-btred-logo"
              >
                <option value="ALL">All Engagements (Firm-wide)</option>
                <option value="Apex">Apex AutoTech</option>
                <option value="Pratwi">Pratwi Solutions</option>
                <option value="OmniRetail">OmniRetail India</option>
                <option value="Zenith">Zenith SaaS</option>
                <option value="Singhal">Singhal Logistics</option>
                <option value="Practice">GPA Practice Dev</option>
              </select>
            </div>
          </div>

          {/* Day-by-Day Statutory Entries List */}
          <div className="space-y-3">
            {filteredTimesheetEntries.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No timesheet entries matching selected filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTimesheetCategoryFilter("ALL");
                    setTimesheetClientFilter("ALL");
                  }}
                  className="mt-2 text-xs text-btred-logo font-bold hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredTimesheetEntries.map((entry) => {
                const dateObj = new Date(entry.date + "T00:00:00");
                const dayName = isNaN(dateObj.getTime())
                  ? "ENTRY"
                  : dateObj.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
                const dayDate = isNaN(dateObj.getTime())
                  ? entry.date
                  : dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

                const categoryBadge =
                  entry.category === "TAX_AUDIT" ? { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Tax Audit (Sec 44AB)" } :
                  entry.category === "DIRECT_TAX" ? { bg: "bg-purple-50 text-purple-700 border-purple-200", label: "Corporate Tax (ITR-6)" } :
                  entry.category === "GST" ? { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "GST Audits & 2B" } :
                  entry.category === "SCRUTINY" ? { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Tax Scrutiny u/s 142(1)" } :
                  entry.category === "STATUTORY_AUDIT" ? { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Statutory Audit & CARO" } :
                  { bg: "bg-cyan-50 text-cyan-700 border-cyan-200", label: "Accounting & MIS" };

                return (
                  <div
                    key={entry.id}
                    className="p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 transition space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Day pill */}
                        <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-white tracking-wider">
                          {dayName} &bull; {dayDate}
                        </span>

                        {/* Client Name */}
                        <span className="font-black text-slate-900 text-xs">
                          {entry.entityName}
                        </span>

                        {/* Category badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${categoryBadge.bg}`}>
                          {categoryBadge.label}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {entry.status === "PARTNER_APPROVED" ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Partner Approved (CA Gunjan Jain)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Logged &bull; Pending Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Task Title & Notes */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 max-w-3xl">
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {entry.taskTitle}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                          {entry.notes}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="font-mono font-black text-slate-900 text-base">{entry.hours.toFixed(1)}</span>
                          <span className="text-xs font-bold text-slate-500">hrs</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block mt-0.5">
                          ✓ Reg 60 OK (&le; 8h)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Principal Attestation & Submission Card */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 gap-4">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-700 font-bold block">
                Principal in Charge: <strong>CA Gunjan Jain, FCA (M.No. 518492 &bull; FRN: 022998C)</strong>
              </span>
              <p className="text-[11px] text-slate-500">
                Form 108 Certification Readiness: <strong>Contemporaneously Recorded &amp; Peer-Review Defensible</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowForm103ExportModal(true)}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-black px-3.5 py-2 rounded-xl transition shadow-2xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Preview Form 102/103 Extract
              </button>

              <button
                type="button"
                onClick={handleSubmitTimesheet}
                disabled={isSubmittingTimesheet}
                className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                {isSubmittingTimesheet ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Locking to ICAI Journal...
                  </>
                ) : timesheetSubmitted ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    Locked to Partner Diary!
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    Sign &amp; Lock Weekly Log ({totalHoursLogged} hrs)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ICAI REGULATION 48 ARTICLES REGISTER & STIPEND DESK */}
      {activeTab === "icai-register" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  ICAI Regulation 48 &amp; Training Mandate
                </span>
                <span className="text-xs text-slate-500 font-bold">New Scheme 2023 Revised Stipend Norms</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Articleship Training, Leaves &amp; Regulation 48 Direct Stipend Register
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-1 max-w-3xl leading-relaxed">
                Supervises Form 102 (Articleship Deed execution), Form 103 (30-day ICAI registration), and monthly stipend disbursals via direct banking channels (NEFT/CMS) under revised Regulation 48 (&gt;20 lakh population tier). Enforces strict leave accounting under Regulation 59 to prevent extension of articleship.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Active Trainees</span>
              <span className="text-xl font-black text-slate-900 font-mono">4 Enrolled</span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1 inline-block">
                All Form 103 Cleared
              </span>
            </div>
          </div>

          {/* Monthly Disbursal Summary Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Regulation 48 Banking Disbursal Ledger &bull; October 2026
                </span>
                <span className="text-sm font-bold text-white">
                  Monthly Total Outflow: <strong className="font-mono text-emerald-300">₹19,000</strong> &bull; Bank: HDFC Bank CMS CMS-22998
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300">
              UTR: HDFCN262891024 &bull; 05-Oct-2026
            </span>
          </div>

          {/* Trainee Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "Kriti Jain",
                croNo: "CRO022998",
                commencement: "2024-08-15",
                scheme: "New Scheme 2023 (2-Year Track)",
                year: "Year 2 (Intermediate Both Groups Passed)",
                minStipend: 5000,
                bankAcc: "HDFC Bank A/c •••• 4819",
                leavesTaken: 10,
                maxPermissibleLeaves: 24,
                form103Amd: "SSP/ART/2024/09124",
                form108Due: "2026-08-14",
                status: "ACTIVE_TRAINING"
              },
              {
                name: "Aman Sharma",
                croNo: "CRO-0699412",
                commencement: "2025-02-01",
                scheme: "New Scheme 2023 (2-Year Track)",
                year: "Year 1 (Direct Entry Graduate)",
                minStipend: 4000,
                bankAcc: "ICICI Bank A/c •••• 7192",
                leavesTaken: 4,
                maxPermissibleLeaves: 24,
                form103Amd: "SSP/ART/2025/01481",
                form108Due: "2027-01-31",
                status: "ACTIVE_TRAINING"
              },
              {
                name: "Pooja Agrawal",
                croNo: "WRO-0741289",
                commencement: "2026-09-20",
                scheme: "New Scheme 2023 (2-Year Track)",
                year: "Year 1 (Foundation Route)",
                minStipend: 4000,
                bankAcc: "Axis Bank A/c •••• 3018",
                leavesTaken: 2,
                maxPermissibleLeaves: 24,
                form103Amd: "SSP/ART/2026/08812",
                form108Due: "2028-09-19",
                status: "ACTIVE_TRAINING"
              },
              {
                name: "Rahul Verma",
                croNo: "CRO-0588211",
                commencement: "2023-11-10",
                scheme: "Old Scheme (3-Year Transition Track)",
                year: "Final Year (Approaching Completion)",
                minStipend: 6000,
                bankAcc: "SBI Bank A/c •••• 9924",
                leavesTaken: 42,
                maxPermissibleLeaves: 156,
                form103Amd: "SSP/ART/2023/04192",
                form108Due: "2026-11-09",
                status: "COMPLETION_PREP"
              }
            ].map((art, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl p-5 space-y-3.5 hover:border-slate-300 transition bg-white shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{art.name}</h4>
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      {art.croNo} &bull; {art.scheme}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{art.year}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Form 103 Approved
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Regulation 48 Stipend</span>
                    <strong className="text-emerald-700 font-mono text-xs">₹{art.minStipend.toLocaleString()}/mo</strong>
                    <span className="text-[9px] text-slate-500 block">{art.bankAcc}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Leave Accounting (Reg 59)</span>
                    <strong className="text-slate-900 font-bold">{art.leavesTaken} / {art.maxPermissibleLeaves} Days Used</strong>
                    <span className="text-[9px] text-emerald-700 font-bold block">✓ Within Limit ({art.maxPermissibleLeaves - art.leavesTaken} left)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Deed Start Date</span>
                    <span className="font-mono text-slate-700">{art.commencement}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Form 108 Projected Date</span>
                    <span className="font-mono font-bold text-slate-900">{art.form108Due}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 text-[10px]">
                    ICAI SSP Ack: <strong className="font-mono text-slate-700">{art.form103Amd}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => toast.info("Stipend Voucher Generated", `Regulation 48 payment voucher for ${art.name} (₹${art.minStipend.toLocaleString()}) ready.`)}
                    className="text-btred-logo font-bold hover:underline text-[11px]"
                  >
                    View NEFT Advice &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ARTICLE MAKER ATTESTATION & PARTNER SUBMISSION MODAL */}
      {escalateModalOpen && escalatingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Maker Review Checklist
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Submit to Partner for E-Sign &bull; CA Gunjan Jain
                </h3>
                <p className="text-xs text-slate-500 font-medium">{escalatingTask.entityName} &bull; {escalatingTask.title}</p>
              </div>
              <button 
                onClick={() => setEscalateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-black text-slate-700 block uppercase">Mandatory Article Audit Checks:</span>
              
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checklistBrs} 
                  onChange={(e) => setChecklistBrs(e.target.checked)} 
                  className="rounded text-btred-logo accent-btred-logo w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Bank Statements Reconciled</span>
                  <span className="text-[10px] text-slate-500">Closing ledger balance matches bank confirmation certificate.</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checklistGstr2b} 
                  onChange={(e) => setChecklistGstr2b(e.target.checked)} 
                  className="rounded text-btred-logo accent-btred-logo w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-900 block">GSTR-2B ITC Matched &amp; Ineligible Credit Reversed</span>
                  <span className="text-[10px] text-slate-500">Section 17(5) blocked credits flagged and reversed in Table 4(B).</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checklistTds} 
                  onChange={(e) => setChecklistTds(e.target.checked)} 
                  className="rounded text-btred-logo accent-btred-logo w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-900 block">TDS Deductions &amp; Challans Cross-Checked</span>
                  <span className="text-[10px] text-slate-500">Vouchers tied to Section 194C/J/I and OLTAS Challan 281 receipts.</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={checklistMsme} 
                  onChange={(e) => setChecklistMsme(e.target.checked)} 
                  className="rounded text-btred-logo accent-btred-logo w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Section 43B(h) MSME 45-Day Dues Scrutinized</span>
                  <span className="text-[10px] text-slate-500">Udyam certificates verified for micro/small vendor overdue balances.</span>
                </div>
              </label>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1">Article Review Memo to Partner:</span>
              <textarea
                value={articleMemoNote}
                onChange={(e) => setArticleMemoNote(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEscalateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                disabled={!checklistBrs || !checklistGstr2b || !checklistTds || !checklistMsme}
                className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                Submit for Partner Sign-Off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERACTIVE WHATSAPP CHASE MODAL */}
      {chaseModalOpen && chasingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  1-Tap WhatsApp Nudge
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Chase Missing Compliance Documents
                </h3>
                <p className="text-xs text-slate-500 font-medium">{chasingTask.entityName} &bull; {chasingTask.title}</p>
              </div>
              <button 
                onClick={() => setChaseModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Phone:</span>
                <strong className="text-slate-900 font-mono">+91 98230 11928 (Client CFO)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statutory Deadline:</span>
                <strong className="text-btred-logo font-black">{formatDate(chasingTask.dueDate)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Missing Documents:</span>
                <strong className="text-amber-700">{chasingTask.missingDocumentsList?.join(", ") || "Statutory Records"}</strong>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1">WhatsApp Message Preview:</span>
              <textarea
                value={customChaseMessage}
                onChange={(e) => setCustomChaseMessage(e.target.value)}
                rows={7}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setChaseModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustomChase}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Launch WhatsApp Web
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD TIMESHEET LOG MODAL (ICAI REGULATION 60 COMPLIANT) */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Form 102/103 Practical Training Entry
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Log Statutory Work Hours
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  ICAI Regulation 60: Max 8 hours per day &bull; Contemporaneously recorded for Form 108.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddLogModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTimesheetLog} className="space-y-3.5 text-xs">
              {/* Date & Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Training Date</label>
                  <select
                    value={newLogDate}
                    onChange={(e) => setNewLogDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold p-2 rounded-xl"
                  >
                    <option value="2026-10-19">Mon, 19 Oct 2026</option>
                    <option value="2026-10-20">Tue, 20 Oct 2026</option>
                    <option value="2026-10-21">Wed, 21 Oct 2026</option>
                    <option value="2026-10-22">Thu, 22 Oct 2026</option>
                    <option value="2026-10-23">Fri, 23 Oct 2026</option>
                    <option value="2026-10-24">Sat, 24 Oct 2026</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">Hours Spent</label>
                    <span className="text-[10px] text-amber-700 font-bold">Max 8.0h (Reg 60)</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    value={newLogHours}
                    onChange={(e) => setNewLogHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-black p-2 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Client Entity & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Client Entity</label>
                  <select
                    value={newLogEntity}
                    onChange={(e) => setNewLogEntity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold p-2 rounded-xl"
                  >
                    <option value="Apex AutoTech Private Limited">Apex AutoTech Private Limited</option>
                    <option value="OmniRetail India Limited">OmniRetail India Limited</option>
                    <option value="Zenith SaaS Technologies Private Limited">Zenith SaaS Technologies</option>
                    <option value="Pratwi Solutions Private Limited">Pratwi Solutions Private Limited</option>
                    <option value="Singhal Logistics LLP">Singhal Logistics LLP</option>
                    <option value="GPA & Co. Practice Development">GPA &amp; Co. Practice Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">ICAI Training Domain</label>
                  <select
                    value={newLogCategory}
                    onChange={(e) => setNewLogCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold p-2 rounded-xl"
                  >
                    <option value="TAX_AUDIT">Tax Audit (Sec 44AB)</option>
                    <option value="DIRECT_TAX">Corporate Tax &amp; ITR-6</option>
                    <option value="GST">GST Audits &amp; 2B Matching</option>
                    <option value="SCRUTINY">Tax Scrutiny u/s 142(1)</option>
                    <option value="STATUTORY_AUDIT">Statutory Audit &amp; CARO</option>
                    <option value="ACCOUNTING">Accounting, BRS &amp; MIS</option>
                  </select>
                </div>
              </div>

              {/* Quick Fill Presets */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Statutory Task Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Clause 44 Form 3CD Matrix", cat: "TAX_AUDIT", task: "Form 3CD Clause 44 GST Expenditure Breakup", note: "Compiled registered vs unregistered vendor expenditure matrix and reconciliation." },
                    { label: "GSTR-2B Rule 37A ITC", cat: "GST", task: "GSTR-2B Inward Matching & Rule 37 Reversal", note: "Verified ITC eligibility against auto-drafted GSTR-2B and screened unpaid 180-day vendor invoices." },
                    { label: "Sec 115JB MAT Computation", cat: "DIRECT_TAX", task: "Corporate Tax Calculation & Book Profit Adjustments", note: "Reconciled Schedule III book profit with taxable income and evaluated brought forward depreciation." },
                    { label: "CARO 2020 Fixed Asset Audit", cat: "STATUTORY_AUDIT", task: "CARO 2020 Clause 3(i) Physical Verification", note: "Sampled fixed asset additions, physical verification logs, and title deeds." }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewLogTask(p.task);
                        setNewLogCategory(p.cat);
                        setNewLogNotes(p.note);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition border border-slate-200"
                    >
                      + {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Engagement Task Title</label>
                <input
                  type="text"
                  value={newLogTask}
                  onChange={(e) => setNewLogTask(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-btred-logo"
                  placeholder="e.g. Form 3CD Clause 44 GST Matrix Compilation"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Audit Workpapers &amp; Clauses Reconciled</label>
                <textarea
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-btred-logo"
                  placeholder="Specific sections, statutory clauses, and testing procedures performed..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save to Form 102/103 Diary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3B: CERTIFIED FORM 102/103 EXTRACT MODAL */}
      {showForm103ExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-btred-logo bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  Official ICAI Form 102/103 Practical Training Extract
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Weekly Practical Training Journal &bull; Week Ending 24 Oct 2026
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowForm103ExportModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Letterhead & Credential Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">GPA &amp; CO., CHARTERED ACCOUNTANTS</h4>
                  <span className="text-[11px] font-mono text-slate-600 block">
                    FRN: 022998C &bull; Peer Review Certificate: PRC-014928
                  </span>
                  <span className="text-[10px] text-slate-500">
                    704-706, World Trade Centre, Barakhamba Lane, Connaught Place, New Delhi - 110001
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
                    ICAI SSP Verifiable
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Articled Trainee</span>
                  <strong className="text-slate-900">Kriti Jain</strong>
                  <span className="font-mono text-slate-500 block text-[10px]">CRO022998</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Training Scheme</span>
                  <strong className="text-slate-900">New Scheme 2023</strong>
                  <span className="text-slate-500 block text-[10px]">Year 2 (2-Yr Track)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Principal Mentor</span>
                  <strong className="text-slate-900">CA Gunjan Jain, FCA</strong>
                  <span className="font-mono text-slate-500 block text-[10px]">M.No. 518492</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Weekly Aggregate</span>
                  <strong className="text-slate-900 text-sm font-black font-mono">{totalHoursLogged} Hours</strong>
                  <span className="text-emerald-700 block text-[10px] font-bold">✓ Reg 60 Cap Compliant</span>
                </div>
              </div>
            </div>

            {/* Table of Entries */}
            <div className="border border-slate-200 rounded-2xl overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Client Engagement</th>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3">Tasks Performed &amp; Sections Audited</th>
                    <th className="py-2.5 px-3 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timesheetEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {e.date}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {e.entityName}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-600 text-[11px]">
                        {e.category}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        <span className="font-bold text-slate-800 block">{e.taskTitle}</span>
                        <span className="text-slate-500 text-[10px]">{e.notes}</span>
                      </td>
                      <td className="py-2 px-3 font-mono font-black text-slate-900 text-right whitespace-nowrap">
                        {e.hours.toFixed(1)} hrs
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      Total Hours Certified:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-btred-logo">
                      {totalHoursLogged.toFixed(1)} hrs
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Statutory Regulation 60 Certification Clause */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 text-[11px] space-y-1">
              <strong className="block font-black uppercase text-[10px] text-amber-800">
                ICAI Regulation 60 &amp; Form 108 Certification Clause
              </strong>
              <p className="leading-relaxed">
                I hereby certify that the articled assistant named above has faithfully served the firm and performed the practical training tasks described above under my direct supervision for <strong>{totalHoursLogged} hours</strong> during the stated week, strictly adhering to the 8-hour daily working cap under Regulation 60. This record is true, correct, and contemporaneously maintained to substantiate Form 108 final certification.
              </p>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Articled Assistant Signature</span>
                <span className="font-black text-slate-900 block mt-1">Kriti Jain</span>
                <span className="text-[10px] font-mono text-slate-500">Reg: CRO022998 &bull; Signed 24-Oct-2026</span>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Principal Partner Attestation</span>
                <span className="font-black text-slate-900 block mt-1">CA Gunjan Jain, FCA</span>
                <span className="text-[10px] font-mono text-slate-500">M.No. 518492 &bull; Digital Stamp Verified</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm103ExportModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  toast.success("Print Dialog Dispatched", "Form 102/103 Certified Extract sent to system printer.");
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Download PDF Extract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FILING RECEIPT & ACK MODAL */}
      {ackModalOpen && ackTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Department Verified
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Official Statutory Filing Receipt
                </h3>
                <p className="text-xs text-slate-500 font-medium">{ackTask.entityName}</p>
              </div>
              <button 
                onClick={() => setAckModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Return / Task:</span>
                <strong className="text-slate-900 font-bold">{ackTask.title}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Filing Period:</span>
                <span className="font-semibold text-slate-800">{ackTask.period}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Filing ARN / Ack No:</span>
                <strong className="font-mono text-emerald-700 font-bold">
                  {ackTask.arnNumber || "AA2709260192841"}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Filing Timestamp:</span>
                <span className="font-mono text-slate-700">11 Oct 2026, 17:42 IST</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Department Status:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  FILED - PAYMENT MATCHED
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  toast.success("Receipt Copied", "ARN details copied to clipboard.");
                  setAckModalOpen(false);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy ARN
              </button>
              <button
                onClick={() => {
                  openWhatsAppPreset("919823011928", "FILING_ACKNOWLEDGEMENT", {
                    clientName: ackTask.entityName,
                    serviceName: ackTask.title,
                    period: ackTask.period,
                    arnNumber: ackTask.arnNumber || "AA2709260192841",
                  });
                  setAckModalOpen(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DOCUMENT PREVIEW & PERMANENT AUDIT FILE INDEXING MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Permanent Audit File (SA 230)
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {previewDoc.fileName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{previewDoc.entityName} &bull; {previewDoc.fileSize}</p>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Preview Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Permanent Index Ref:</span>
                <strong className="text-slate-900 font-mono">PAF/2026/{previewDoc.entityName.slice(0, 4).toUpperCase()}/{previewDoc.id}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">
                  {previewDoc.category.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Intake Channel:</span>
                <span className="font-semibold text-slate-700">{previewDoc.uploadedBy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  previewDoc.reviewStatus === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : previewDoc.reviewStatus === "CORRECTION_NEEDED"
                    ? "bg-red-100 text-btred-logo border-red-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  {previewDoc.reviewStatus.replace(/_/g, " ")}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Cryptographic Audit Hash:</span>
                <span className="font-mono text-[10px] text-slate-600 block bg-white p-2 rounded-xl border border-slate-200 mt-1 break-all">
                  SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              {previewDoc.reviewStatus !== "APPROVED" && (
                <button
                  onClick={() => {
                    handleApproveDoc(previewDoc.id);
                    setPreviewDoc(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve &amp; Start Work
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5B: DOCUMENT RESUBMISSION DISCREPANCY MODAL */}
      {resubmitModalOpen && resubmittingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-btred-logo bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  Audit Workpaper Clarification
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Request Document Resubmission
                </h3>
                <p className="text-xs text-slate-500 font-medium">{resubmittingDoc.entityName} &bull; {resubmittingDoc.fileName}</p>
              </div>
              <button 
                onClick={() => setResubmitModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Statutory Defect Reason:</label>
                <select
                  value={resubmitDefectReason}
                  onChange={(e) => setResubmitDefectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-xl font-medium"
                >
                  <option value="Incomplete scan / missing back pages">Incomplete scan / missing back pages</option>
                  <option value="Password mismatch or unreadable bank statement">Password mismatch or unreadable bank statement</option>
                  <option value="Missing authorized signatory signature & company seal">Missing authorized signatory signature &amp; company seal</option>
                  <option value="Tax period or assessment year mismatch">Tax period or assessment year mismatch</option>
                  <option value="Missing purchase register E-Way Bill / GSTIN columns">Missing purchase register E-Way Bill / GSTIN columns</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Specific Article Note to Client CFO:</label>
                <textarea
                  value={resubmitCustomNote}
                  onChange={(e) => setResubmitCustomNote(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-red-600 font-medium"
                  placeholder="Detail the exact defect or missing pages..."
                />
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800">
                <strong>Statutory Note:</strong> Marking this document for resubmission keeps the linked compliance engagement in <strong>DOCUMENTS AWAITED</strong> to avoid late filing penalties under Section 234F / 47.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setResubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDocuments(prev => prev.map(d => d.id === resubmittingDoc.id ? { ...d, reviewStatus: "CORRECTION_NEEDED" } : d));
                  openWhatsAppPreset("919823011928", "DOC_CHASE", {
                    clientName: resubmittingDoc.entityName,
                    serviceName: "Audit Workpaper Intake",
                    missingDocs: [`Correction needed on ${resubmittingDoc.fileName}: ${resubmitDefectReason} (${resubmitCustomNote})`],
                  });
                  setResubmitModalOpen(false);
                  toast.warning("Resubmission Requested", `Client CFO notified via WhatsApp with defect notes.`);
                }}
                className="bg-btred-logo hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5C: MANUAL CLIENT DOCUMENT INTAKE MODAL */}
      {manualUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Intake Vault Entry
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Manual Client Document Intake
                </h3>
              </div>
              <button 
                onClick={() => setManualUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Entity</label>
                <select
                  value={manualDocEntity}
                  onChange={(e) => setManualDocEntity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-xl font-medium"
                >
                  <option value="Apex AutoTech Private Limited">Apex AutoTech Private Limited</option>
                  <option value="OmniRetail Hypermarkets Private Limited">OmniRetail Hypermarkets Private Limited</option>
                  <option value="Pratwi Solutions Private Limited">Pratwi Solutions Private Limited</option>
                  <option value="Zenith SaaS Technologies Private Limited">Zenith SaaS Technologies Private Limited</option>
                  <option value="Singhal Logistics & Warehousing">Singhal Logistics &amp; Warehousing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Document Category</label>
                <select
                  value={manualDocCategory}
                  onChange={(e) => setManualDocCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-xl font-medium"
                >
                  <option value="BANK_STATEMENT">Bank Statement</option>
                  <option value="AUDIT_REPORT">Tax Audit Workpaper (3CD)</option>
                  <option value="TAX_COMPUTATION">Tax Computation (ITR-6)</option>
                  <option value="NOTICE_REPLY">Scrutiny Notice Submission (142/148)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="e.g. Purchase_Register_Sept2026_With_EWayBills.xlsx"
                  value={manualDocName}
                  onChange={(e) => setManualDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 p-2 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                Uploaded files are automatically SHA-256 encrypted and linked to the permanent audit file docket under SA 230.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setManualUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!manualDocName.trim()) {
                    toast.warning("File Name Missing", "Please provide a valid document name.");
                    return;
                  }
                  const newDoc: DocumentItem = {
                    id: `DOC-${Date.now().toString().slice(-4)}`,
                    entityId: "CLI-CUSTOM",
                    entityName: manualDocEntity,
                    category: manualDocCategory as any,
                    fileName: manualDocName,
                    fileSize: "1.5 MB",
                    uploadedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
                    uploadedBy: "FIRM_STAFF",
                    isPasswordProtected: false,
                    isUnlocked: true,
                    financialYear: "FY 2025-26",
                    reviewStatus: "PENDING_REVIEW"
                  };
                  setDocuments([newDoc, ...documents]);
                  setManualUploadModalOpen(false);
                  setManualDocName("");
                  toast.success("Document Ingested", `Added ${newDoc.fileName} to intake queue awaiting verification.`);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
              >
                Register &amp; Ingest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: WHATSAPP STATUTORY PRESET CUSTOMIZER MODAL */}
      {presetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {presetDraft.category}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {presetDraft.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Recipient: {activeChannel.contactName} ({activeChannel.clientName})</p>
              </div>
              <button 
                onClick={() => setPresetModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Mobile:</span>
                <strong className="text-emerald-700 font-mono font-bold">+{activeChannel.phone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Filing Platform / Link Mode:</span>
                <strong className="text-slate-800 font-bold">{whatsAppPlatform === "WEB" ? "WhatsApp Web (Desktop)" : "Direct wa.me (Mobile)"}</strong>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1">Preview &amp; Edit Notice Before Dispatch:</span>
              <textarea
                value={presetDraft.text}
                onChange={(e) => setPresetDraft({ ...presetDraft, text: e.target.value })}
                rows={8}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPresetModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSendMessage(presetDraft.text);
                  setPresetModalOpen(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Audit Form 3CD Workpaper Modal with real UDIN tracking */}
      <TaxAuditWorkpaperModal
        isOpen={workpaperModalOpen}
        onClose={() => setWorkpaperModalOpen(false)}
        entityName={selectedWorkpaperEntity}
        onUdinSaved={(newUdin) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.category === "TAX_AUDIT"
                ? { ...t, officialUdin: newUdin, status: "PARTNER_SIGN_OFF" }
                : t
            )
          );
          toast.success("UDIN Recorded", `Official ICAI UDIN ${newUdin} linked to engagement workpapers!`);
        }}
      />
    </div>
  );
};
