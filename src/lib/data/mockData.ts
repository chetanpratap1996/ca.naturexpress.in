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
  NotificationItem
} from "../types";

export const FIRM_METRICS = {
  name: "GPA & Co., Chartered Accountants",
  companyName: "Brains & Taxes Private Limited",
  frn: "022998C",
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
    branch: "Y.N. Road Branch, Indore",
    accountNumber: "50200088921842",
    accountName: "GPA & Co., Chartered Accountants",
    ifsc: "ICIC0000041"
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
    id: "notif-1",
    recipientRole: "ALL",
    title: "GSTR-3B Statutory Deadline Approaching",
    message: "GSTR-3B for September 2026 is due within 48 hours for Apex AutoTech Private Limited. Review pending workpapers.",
    category: "COMPLIANCE",
    priority: "URGENT",
    targetTab: "calendar",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "notif-2",
    recipientRole: "PARTNER",
    title: "New UTR Submitted for Verification",
    message: "Apex AutoTech submitted bank payment UTR UPI982341982 for ₹29,500. Pay-to-Release fee gatekeeper ready for settlement.",
    category: "BILLING",
    priority: "HIGH",
    targetTab: "billing",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "notif-3",
    recipientRole: "ARTICLE",
    title: "Bank Statement Uploaded by Client",
    message: "Client uploaded ICICI Bank Current A/c Statement (Oct 2026). Decryption verified via Password Vault.",
    category: "DOCUMENT",
    priority: "NORMAL",
    targetTab: "workbench",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "notif-4",
    recipientRole: "PARTNER",
    title: "GST Scrutiny Notice ASMT-10 Triaged",
    message: "GST Portal sync detected ASMT-10 notice for DRC-01A discrepancy under section 61. Statutory response due in 14 days.",
    category: "NOTICE",
    priority: "HIGH",
    targetTab: "notices",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "notif-5",
    recipientRole: "CLIENT",
    title: "Tax Audit Report Form 3CD Certified",
    message: "Managing Partner CA Gunjan Jain has certified your Form 3CD with official ICAI UDIN. Available in banker docket.",
    category: "COMPLIANCE",
    priority: "NORMAL",
    targetTab: "progress",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  }
];
