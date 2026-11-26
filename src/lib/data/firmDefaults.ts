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

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: "STF-PARTNER-01",
    firmId: "FRM-022998C",
    fullName: "CA Gunjan Jain",
    email: "partner@brainsandtaxes.com",
    phone: "+91 98937 23639",
    icaiRegistrationNo: "022998C",
    role: "MANAGING_PARTNER",
    competencyTier: 4,
    specializations: ["GST", "INCOME_TAX", "TAX_AUDIT", "MCA_ROC", "TDS", "BOOKKEEPING"],
    allowedTools: ["tasks", "gst", "tax-audit", "notices-udin", "billing-wip", "client-master"],
    maxDailyTaskCapacity: 25,
    status: "ACTIVE",
    tempPin: "3639",
    joinedDate: "2018-04-01",
    activeOpenTasksCount: 0,
    completedTasksThisMonth: 14,
    averageVelocityMinutes: 45
  }
];

