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
  ParsedBankStatement,
  GovtPortalSyncProfile,
  Msme43BhClauseItem,
  Section40A2bSampleItem,
  StaffDataSecurityAudit,
  PartnerRealizationMetrics,
  PeerReviewDossier,
  PortalCredential
} from "../types";

export const SANDBOX_FIRM_METRICS = {
  name: "GPA & Co., Chartered Accountants",
  companyName: "Brains & Taxes Private Limited",
  frn: "022998C",
  peerReviewStatus: "Compliant (ICAI Certified Validity till 2028)",
  totalClients: 1,
  activeEntities: 1,
  partnersCount: 2,
  articleTrainees: 1,
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

export const SANDBOX_GROUPS: ClientGroup[] = [
  {
    id: "157e58d9-cc53-4e5d-9497-ec6d2ecbf59a",
    name: "Direct Practice Clients",
    promoterName: "Chetan Pratap Singh",
    promoterPhone: "+91 80771 70715",
    promoterEmail: "chetanpratap1996@gmail.com",
    totalEntities: 1,
    totalTurnoverCr: 1.2,
    unbilledWipTotal: 0,
    overdueFeesTotal: 0,
    entityIds: ["ddd33056-b6dc-46ca-b145-cd111045aff7"]
  }
];

export const SANDBOX_CLIENTS: ClientEntity[] = [
  {
    id: "ddd33056-b6dc-46ca-b145-cd111045aff7",
    groupId: "157e58d9-cc53-4e5d-9497-ec6d2ecbf59a",
    groupName: "Direct Practice Clients",
    name: "Pratwi Solutions Private Limited",
    type: "PVT_LTD",
    pan: "AANCP9915B",
    gstin: "09AANCP9915B1Z4",
    cin: "U72900UP2026PTC199821",
    turnoverCr: 1.2,
    incorporationYear: 2026,
    penaltyRiskAccrued: 0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    primaryContact: {
      name: "Chetan Pratap Singh",
      phone: "+91 80771 70715",
      email: "chetanpratap1996@gmail.com",
      designation: "Director"
    }
  }
];

export const SANDBOX_TASKS: ComplianceTask[] = [
  {
    id: "599e3085-849c-4934-9d1e-2405dda6632a",
    entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
    entityName: "Pratwi Solutions Private Limited",
    groupId: "157e58d9-cc53-4e5d-9497-ec6d2ecbf59a",
    category: "GST",
    title: "GSTR-1 (Monthly Outward Supplies)",
    period: "Nov 2026",
    dueDate: "2026-12-11",
    status: "IN_PREPARATION",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "HIGH",
    penaltyRisk: 0,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 0
  },
  {
    id: "2a5831b7-c327-4169-9dd5-9ab8cbdc609c",
    entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
    entityName: "Pratwi Solutions Private Limited",
    groupId: "157e58d9-cc53-4e5d-9497-ec6d2ecbf59a",
    category: "GST",
    title: "GSTR-3B (Monthly Summary & Tax Payment)",
    period: "Nov 2026",
    dueDate: "2026-12-20",
    status: "DOCUMENTS_AWAITED",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "CRITICAL",
    penaltyRisk: 0,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 0
  },
  {
    id: "9faa1031-ca10-4ff6-812f-7e14d31fcb90",
    entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
    entityName: "Pratwi Solutions Private Limited",
    groupId: "157e58d9-cc53-4e5d-9497-ec6d2ecbf59a",
    category: "TDS",
    title: "TDS Payment Deposit (Challan 281)",
    period: "Nov 2026",
    dueDate: "2026-12-07",
    status: "DOCUMENTS_AWAITED",
    assignedTo: "Kriti Jain (Article)",
    reviewedBy: "CA Gunjan Jain",
    priority: "HIGH",
    penaltyRisk: 0,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    chaseCount: 0
  }
];

export const SANDBOX_NOTICES: NoticeRecord[] = [];

export const SANDBOX_INVOICES: InvoiceItem[] = [];

export const SANDBOX_PAY_TO_RELEASE_CONFIGS: PayToReleaseConfig[] = [];

export const SANDBOX_DSC_TOKENS: DscRecord[] = [];

export const SANDBOX_DOCUMENTS: DocumentItem[] = [];

export const SANDBOX_AUDIT_TRAIL: AuditTrailLog[] = [
  {
    id: "AUD-001",
    timestamp: new Date().toISOString(),
    actorName: "CA Gunjan Jain",
    actorRole: "PARTNER",
    entityName: "GPA & Co., Chartered Accountants",
    action: "Platform Initialized",
    details: "100% production mode active with real clients.",
    category: "SYSTEM"
  }
];

export const SANDBOX_PASSWORD_VAULTS: ClientPasswordVault[] = [];

export const SANDBOX_PARSED_STATEMENTS: ParsedBankStatement[] = [];

export const SANDBOX_MSME_43BH_RECORDS: Msme43BhClauseItem[] = [];

export const SANDBOX_SECTION_40A2B_SAMPLES: Section40A2bSampleItem[] = [];

export const SANDBOX_STAFF_SECURITY_LOGS: StaffDataSecurityAudit[] = [];

export const SANDBOX_PARTNER_METRICS: PartnerRealizationMetrics[] = [];

export const SANDBOX_PORTAL_CREDENTIALS: PortalCredential[] = [];

export const SANDBOX_DATA = {
  firmMetrics: SANDBOX_FIRM_METRICS,
  groups: SANDBOX_GROUPS,
  clients: SANDBOX_CLIENTS,
  tasks: SANDBOX_TASKS,
  notices: SANDBOX_NOTICES,
  invoices: SANDBOX_INVOICES,
  dscTokens: SANDBOX_DSC_TOKENS,
  documents: SANDBOX_DOCUMENTS,
  auditTrail: SANDBOX_AUDIT_TRAIL,
  portalCredentials: SANDBOX_PORTAL_CREDENTIALS,
  payToReleaseConfigs: SANDBOX_PAY_TO_RELEASE_CONFIGS,
  passwordVaults: SANDBOX_PASSWORD_VAULTS,
  parsedStatements: SANDBOX_PARSED_STATEMENTS,
  msme43BhRecords: SANDBOX_MSME_43BH_RECORDS,
  section40a2bSamples: SANDBOX_SECTION_40A2B_SAMPLES,
  staffSecurityLogs: SANDBOX_STAFF_SECURITY_LOGS,
  partnerMetrics: SANDBOX_PARTNER_METRICS
};
