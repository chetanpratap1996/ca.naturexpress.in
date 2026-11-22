import { 
  ClientGroup, 
  ClientEntity, 
  ComplianceTask, 
  NoticeRecord, 
  InvoiceItem, 
  DscRecord, 
  DocumentItem,
  AuditTrailLog,
  ClientPasswordVault,
  PayToReleaseConfig,
  NotificationItem,
  PortalCredential,
  StaffMember
} from "../types";

export const FIRM_METRICS = {
  name: "GPA & Co., Chartered Accountants",
  companyName: "Brains & Taxes Private Limited",
  frn: "024310C",
  peerReviewStatus: "Compliant (ICAI Certified Validity till 2028)",
  totalClients: 0,
  activeEntities: 0,
  partnersCount: 6,
  articleTrainees: 28,
  criticalDeadlinesNext72h: 0,
  openScrutinyNotices: 0,
  totalDemandRiskINR: 0,
  unbilledWipAmount: 0,
  pendingCollections: 0,
  complianceHealthScore: 100,
  dailyAccruingPenaltyRisk: 0,
  firmUpiVpa: "BRAINSANDTAXES@icici",
  firmBankDetails: {
    bankName: "ICICI Bank",
    branch: "New Palasia, Indore",
    accountType: "Current Account",
    accountNumber: "657005601799",
    accountName: "Brains & Taxes Private Limited",
    ifsc: "ICIC0006570"
  }
};

export const INITIAL_GROUPS: ClientGroup[] = [];

export const INITIAL_CLIENTS: ClientEntity[] = [];

export const INITIAL_TASKS: ComplianceTask[] = [];

export const INITIAL_INVOICES: InvoiceItem[] = [];

export const INITIAL_NOTICES: NoticeRecord[] = [];

export const INITIAL_DSC_TOKENS: DscRecord[] = [];

export const INITIAL_DOCUMENTS: DocumentItem[] = [];

export const INITIAL_AUDIT_TRAIL: AuditTrailLog[] = [
  {
    id: "AUD-001",
    timestamp: new Date().toISOString(),
    actorName: "System Admin",
    actorRole: "SYSTEM",
    entityName: "GPA & Co.",
    action: "Platform Initialized",
    details: "Clean SaaS instance initialized. 0 dummy records. Ready for live client onboarding.",
    category: "SYSTEM"
  }
];

export const INITIAL_PASSWORD_VAULTS: ClientPasswordVault[] = [];
export const INITIAL_PORTAL_CREDENTIALS: PortalCredential[] = [];

export const INITIAL_PARSED_STATEMENTS = [];

export const INITIAL_PAY_TO_RELEASE_CONFIGS: PayToReleaseConfig[] = [];

export const INITIAL_PORTAL_SYNC_PROFILES = [
  {
    portal: "INCOME_TAX_2_0",
    lastSuccessfulSync: new Date().toISOString(),
    syncStatus: "CONNECTED",
    lastScrapedNoticesCount: 0
  },
  {
    portal: "GST_COMMON_PORTAL",
    lastSuccessfulSync: new Date().toISOString(),
    syncStatus: "CONNECTED",
    lastScrapedNoticesCount: 0
  }
];

export const INITIAL_MSME_43BH_RECORDS = [];
export const INITIAL_SECTION_40A2B_SAMPLES = [];
export const INITIAL_STAFF_SECURITY_LOGS = [];
export const INITIAL_PARTNER_METRICS = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-gstr1-pratwi",
    recipientRole: "CLIENT",
    recipientEntityId: "client-pratwi",
    title: "GSTR-1 Outward Supplies Filing Due (Statutory Cutoff: 11 Nov 2026)",
    message: "Form GSTR-1 for October 2026 is due on 11 Nov 2026 for Pratwi Solutions Private Limited (GSTIN: 09AANCP9915B1Z4). Sales data mapped under Rule 59(6) compliance protocol.",
    category: "COMPLIANCE",
    priority: "HIGH",
    targetTab: "progress",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "notif-gstr3b-pratwi",
    recipientRole: "CLIENT",
    recipientEntityId: "client-pratwi",
    title: "GSTR-3B Statutory Summary & ITC Reconciliation (Cutoff: 20 Nov 2026)",
    message: "Mandatory monthly return GSTR-3B for October 2026 is due on 20 Nov 2026. Input Tax Credit (ITC) electronic matching vs GSTR-2B underway by GPA & Co.",
    category: "COMPLIANCE",
    priority: "URGENT",
    targetTab: "progress",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "notif-tds-pratwi",
    recipientRole: "CLIENT",
    recipientEntityId: "client-pratwi",
    title: "TDS Challan 281 Deposit Intimation (October 2026)",
    message: "Statutory cutoff for monthly TDS deposit under Section 200(1) is 07 Nov 2026. Advance payment advice and calculation verified by Lead CA.",
    category: "COMPLIANCE",
    priority: "HIGH",
    targetTab: "progress",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "notif-shield-pratwi",
    recipientRole: "CLIENT",
    recipientEntityId: "client-pratwi",
    title: "Executive Statutory Shield Active (98% Compliant)",
    message: "Official compliance health verified by GPA & Co., Chartered Accountants (FRN 022990C). All company KYC documents and director risk profiles are up to date.",
    category: "NOTICE",
    priority: "NORMAL",
    targetTab: "director-risk",
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "notif-partner-utr",
    recipientRole: "PARTNER",
    title: "New UTR Submitted for Fee Release",
    message: "Client submitted bank payment UTR UPI982341982 for ₹29,500. Pay-to-Release fee gatekeeper ready for settlement.",
    category: "BILLING",
    priority: "HIGH",
    targetTab: "billing",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "notif-staff-stmt",
    recipientRole: "ARTICLE",
    title: "Bank Statement Uploaded by Client",
    message: "Client uploaded bank current account statement. Auto-parser and reconciliation active.",
    category: "DOCUMENT",
    priority: "NORMAL",
    targetTab: "workbench",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: "STF-PARTNER-01",
    firmId: "FRM-024310C",
    fullName: "CA Gunjan Jain",
    email: "partner@brainsandtaxes.com",
    phone: "+91 98000 00001",
    icaiRegistrationNo: "024310C",
    role: "MANAGING_PARTNER",
    competencyTier: 4,
    specializations: ["GST", "INCOME_TAX", "TAX_AUDIT", "MCA_ROC", "TDS", "BOOKKEEPING"],
    maxDailyTaskCapacity: 20,
    status: "ACTIVE",
    tempPin: "0001",
    joinedDate: "2018-04-01",
    activeOpenTasksCount: 0,
    completedTasksThisMonth: 14,
    averageVelocityMinutes: 45
  },
  {
    id: "STF-CA-01",
    firmId: "FRM-024310C",
    fullName: "Priya Mehta",
    email: "priya.mehta@brainsandtaxes.com",
    phone: "+91 98000 00004",
    icaiRegistrationNo: "489211",
    role: "PAID_CHARTERED_ACCOUNTANT",
    competencyTier: 4,
    specializations: ["INCOME_TAX", "TAX_AUDIT", "MCA_ROC"],
    maxDailyTaskCapacity: 16,
    status: "ACTIVE",
    tempPin: "0004",
    joinedDate: "2024-01-15",
    activeOpenTasksCount: 0,
    completedTasksThisMonth: 19,
    averageVelocityMinutes: 60
  },
  {
    id: "STF-ARTICLE-01",
    firmId: "FRM-024310C",
    fullName: "Kriti Jain",
    email: "audit.trainee@brainsandtaxes.com",
    phone: "+91 98000 00002",
    icaiRegistrationNo: "CRO-0689123",
    role: "ARTICLE_TRAINEE",
    competencyTier: 3,
    specializations: ["GST", "INCOME_TAX", "TAX_AUDIT"],
    maxDailyTaskCapacity: 14,
    status: "ACTIVE",
    tempPin: "0002",
    joinedDate: "2024-06-01",
    articleshipEndDate: "2026-06-01",
    activeOpenTasksCount: 0,
    completedTasksThisMonth: 27,
    averageVelocityMinutes: 52
  },
  {
    id: "STF-ARTICLE-02",
    firmId: "FRM-024310C",
    fullName: "Aman Verma",
    email: "aman.verma@brainsandtaxes.com",
    phone: "+91 98000 00005",
    icaiRegistrationNo: "CRO-0712490",
    role: "ARTICLE_TRAINEE",
    competencyTier: 2,
    specializations: ["GST", "TDS", "BOOKKEEPING"],
    maxDailyTaskCapacity: 10,
    status: "ACTIVE",
    tempPin: "0005",
    joinedDate: "2025-02-10",
    articleshipEndDate: "2027-02-10",
    activeOpenTasksCount: 0,
    completedTasksThisMonth: 18,
    averageVelocityMinutes: 65
  },
  {
    id: "STF-ARTICLE-03",
    firmId: "FRM-024310C",
    fullName: "Rahul Sharma",
    email: "rahul.sharma@brainsandtaxes.com",
    phone: "+91 98000 00006",
    icaiRegistrationNo: "CRO-0744182",
    role: "ARTICLE_TRAINEE",
    competencyTier: 1,
    specializations: ["BOOKKEEPING", "GST", "TDS"],
    maxDailyTaskCapacity: 8,
    status: "ACTIVE",
    tempPin: "0006",
    joinedDate: "2025-08-01",
    articleshipEndDate: "2027-08-01",
    activeOpenTasksCount: 0,
    completedTasksThisMonth: 12,
    averageVelocityMinutes: 80
  },
  {
    id: "STF-ARTICLE-04",
    firmId: "FRM-024310C",
    fullName: "Pooja Mehta",
    email: "pooja.mehta@brainsandtaxes.com",
    phone: "+91 98000 00007",
    icaiRegistrationNo: "CRO-0759914",
    role: "ARTICLE_TRAINEE",
    competencyTier: 1,
    specializations: ["MCA_ROC", "INCOME_TAX"],
    maxDailyTaskCapacity: 8,
    status: "ACTIVE",
    tempPin: "0007",
    joinedDate: "2025-09-15",
    articleshipEndDate: "2027-09-15",
    activeOpenTasksCount: 0,
    completedTasksThisMonth: 9,
    averageVelocityMinutes: 75
  }
];

