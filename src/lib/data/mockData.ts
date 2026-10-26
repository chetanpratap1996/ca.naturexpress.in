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
  PayToReleaseConfig
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
  firmUpiVpa: "7999995897@upi",
  firmBankDetails: {
    bankName: "HDFC Bank",
    branch: "Y.N. Road Branch, Indore",
    accountNumber: "50200088921842",
    accountName: "GPA & Co., Chartered Accountants",
    ifsc: "HDFC0000281"
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
