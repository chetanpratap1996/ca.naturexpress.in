export type EntityType = 
  | "PVT_LTD"
  | "PUBLIC_LTD"
  | "LLP"
  | "PARTNERSHIP"
  | "PROPRIETORSHIP"
  | "INDIVIDUAL_HNI"
  | "TRUST_NGO";

export type ComplianceCategory = 
  | "GST"
  | "INCOME_TAX"
  | "TAX_AUDIT"
  | "TDS"
  | "ROC_MCA"
  | "TRANSFER_PRICING";

export type WorkflowStatus = 
  | "DOCUMENTS_AWAITED"
  | "IN_PREPARATION"
  | "MANAGER_REVIEW"
  | "PARTNER_SIGN_OFF"
  | "FILED_AND_COMPLETED";

export interface ClientGroup {
  id: string;
  name: string;
  promoterName: string;
  promoterPhone: string;
  promoterEmail: string;
  totalEntities: number;
  totalTurnoverCr: number;
  unbilledWipTotal: number;
  overdueFeesTotal: number;
  entityIds: string[];
}

export interface ClientEntity {
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  type: EntityType;
  pan: string;
  gstin?: string;
  cin?: string;
  tan?: string;
  turnoverCr: number;
  partnerInCharge: string;
  assignedArticle: string;
  incorporationYear: number;
  penaltyRiskAccrued: number;
  primaryContact: {
    name: string;
    phone: string;
    email: string;
    designation: string;
  };
}

export interface ComplianceTask {
  id: string;
  entityId: string;
  entityName: string;
  groupId: string;
  category: ComplianceCategory;
  title: string;
  period: string; // e.g., "September 2026" or "FY 2025-26"
  dueDate: string;
  status: WorkflowStatus;
  assignedTo: string;
  reviewedBy: string;
  priority: "HIGH" | "CRITICAL" | "MEDIUM" | "LOW";
  penaltyRisk: number; // Potential penalty in INR if delayed
  accruingDailyPenalty: number; // e.g. ₹50/day for GST, ₹200/day TDS
  missingDocumentsCount: number;
  missingDocumentsList?: string[];
  chaseCount: number;
  lastChaseDate?: string;
  arnNumber?: string;
  officialUdin?: string;
  udinGeneratedAt?: string;
  filingDate?: string;
}

export interface NoticeRecord {
  id: string;
  entityId: string;
  entityName: string;
  groupId: string;
  authority: "INCOME_TAX" | "GST_DEPT" | "MCA_ROC" | "DGGI";
  section: string; // e.g., "Section 142(1)", "Section 148", "ASMT-10", "DRC-01A"
  dinNumber: string; // CBDT/CBIC Document Identification Number
  demandAmount: number;
  issueDate: string;
  statutoryDeadline: string;
  daysRemaining: number;
  status: "PENDING_TRIAGE" | "DRAFTING_RESPONSE" | "PARTNER_REVIEW" | "SUBMITTED" | "CLOSED";
  riskLevel: "HIGH" | "CRITICAL" | "MEDIUM";
  assignedPartner: string;
  summary: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNo: string;
  entityId: string;
  entityName: string;
  groupId: string;
  serviceDescription: string;
  taxableAmount: number;
  gstRate: number; // e.g. 18
  gstAmount: number;
  amount: number; // Total amount inclusive of GST
  dueDate: string;
  status: "PENDING" | "UTR_SUBMITTED" | "PAID" | "OVERDUE";
  sacCode: string; // e.g., "998231"
  clientUtrNumber?: string;
  clientPaymentMode?: "UPI" | "NEFT_RTGS" | "IMPS" | "CHEQUE";
  clientPaymentDate?: string;
  clientPayerNote?: string;
  reconciledBy?: string;
  reconciledAt?: string;
}

export interface DscRecord {
  id: string;
  entityId: string;
  entityName: string;
  groupId: string;
  holderName: string;
  pan: string;
  serialNumber: string;
  tokenType: "ePass2003" | "ProxKey" | "mToken" | "Cloud-DSC";
  validTill: string;
  daysToExpiry: number;
  expiryStatus: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
  currentCustodian: string;
  vaultSlot: string;
  checkedOutAt?: string;
  checkedOutPurpose?: string;
}

export interface DocumentItem {
  id: string;
  entityId: string;
  entityName: string;
  category: "BANK_STATEMENT" | "GST_INVOICES" | "TAX_COMPUTATION" | "AUDIT_REPORT" | "NOTICE_REPLY" | "CHALLAN";
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: "CLIENT_PWA" | "WHATSAPP_LINK" | "FIRM_STAFF";
  isPasswordProtected: boolean;
  isUnlocked: boolean;
  financialYear: string;
  taskId?: string;
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "CORRECTION_NEEDED";
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  fileContentBase64?: string;
}

export interface AuditTrailLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: "PARTNER" | "ARTICLE" | "CLIENT" | "SYSTEM";
  entityName: string;
  action: string;
  details: string;
  category: "COMPLIANCE" | "DOCUMENT" | "INVOICE" | "UDIN" | "WHATSAPP" | "SECURITY" | "PEER_REVIEW" | "PAY_RELEASE" | "SYSTEM";
}

// -------------------------------------------------------------
// ENTERPRISE EXTENSIONS FOR CA FIRM OPERATING SYSTEM
// -------------------------------------------------------------

// 1. Pay-to-Release Fee Gatekeeper
export interface PayToReleaseConfig {
  entityId: string;
  isLocked: boolean;
  totalOutstandingAmount: number;
  oldestInvoiceDays: number;
  gracePeriodDays: number;
  blockedDeliverables: Array<"ITR_ACKNOWLEDGMENT" | "FORM_3CD_PDF" | "BALANCE_SHEET_SIGNED" | "GSTR_FILED_RECEIPT">;
  instantUpiVpa: string;
  merchantName: string;
  lockReason: string;
}

export interface PaymentReleaseReceipt {
  transactionId: string;
  invoiceIds: string[];
  amountPaid: number;
  paymentMode: "UPI_DYNAMIC" | "NET_BANKING" | "NEFT_IMPS";
  utrRef: string;
  releasedAt: string;
  releasedDeliverables: string[];
  autoReceiptPdfUrl: string;
}

// 2. WhatsApp Bot & Automated Bank Statement Parser
export interface ClientPasswordVault {
  id: string;
  entityId: string;
  bankName: string;
  accountNumberMasked: string; // e.g. "XXXX-XXXX-4819"
  pdfPasswordPattern: string; // e.g. "PAN(uppercase) + DOB(DDMM)" or custom password
  lastDecryptionSuccess: boolean;
  notes?: string;
}

export interface BankTransactionItem {
  id: string;
  date: string;
  description: string;
  refNo: string;
  withdrawal: number;
  deposit: number;
  balance: number;
  aiSuggestedCategory: "SALES_RECEIPT" | "VENDOR_PAYMENT" | "GST_CHALLAN" | "DIRECTOR_REMUNERATION" | "LOAN_REPAYMENT" | "INTEREST" | "UNIDENTIFIED";
  confidenceScore: number;
  verified: boolean;
}

export interface ParsedBankStatement {
  id: string;
  entityId: string;
  bankName: string;
  statementPeriod: string;
  openingBalance: number;
  closingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  transactionCount: number;
  transactions: BankTransactionItem[];
  parsedAt: string;
  passwordBypassed: boolean;
  sourceFile: string;
}

export interface WhatsAppMessageThread {
  id: string;
  entityId: string;
  entityName: string;
  promoterPhone: string;
  promoterName: string;
  messages: Array<{
    id: string;
    sender: "CLIENT" | "TAXOBRAIN_BOT" | "PARTNER";
    timestamp: string;
    text: string;
    attachmentType?: "PDF_BANK_STATEMENT" | "IMAGE_CHALLAN" | "EXCEL_PURCHASE";
    attachmentName?: string;
    status: "SENT" | "DELIVERED" | "READ" | "PROCESSING" | "COMPLETED";
    metadata?: Record<string, any>;
  }>;
  activeEscalationLevel: "NONE" | "REMINDER_1" | "PENALTY_WARNING" | "PARTNER_ESCALATION";
}

// 3. Govt Portal Sync & Headless Notice Engine
export interface GovtPortalSyncProfile {
  id: string;
  entityId: string;
  portal: "GST_COMMON_PORTAL" | "INCOME_TAX_2_0" | "MCA_V3_ROC" | "TRACES_TDS";
  portalUserId: string;
  lastSuccessfulSync: string;
  syncStatus: "CONNECTED" | "REQUIRES_OTP" | "SESSION_EXPIRED" | "FAILED";
  lastScrapedNoticesCount: number;
  pendingReturnsDetected: number;
  autoSyncEnabled: boolean;
}

export interface AutomatedScrapedNotice {
  id: string;
  entityId: string;
  portal: "GST" | "INCOME_TAX" | "MCA";
  din: string;
  noticeSection: string;
  issueDate: string;
  replyDeadline: string;
  daysRemaining: number;
  allegedDiscrepancyAmount: number;
  autoDraftReplyUrl?: string;
  sourcePortalUrl: string;
  status: "DETECTED" | "TRIAGED" | "REPLY_IN_DRAFT" | "SUBMITTED";
}

// 4. Advanced GSTR-2B Reconciler & 17(5) / 16(4) Rules
export interface Gstr2bEnhancedRecord {
  id: string;
  supplierGstin: string;
  supplierTradeName: string;
  invoiceNumber: string;
  invoiceType: "REGULAR" | "CREDIT_NOTE" | "DEBIT_NOTE" | "ISD";
  invoiceDate: string;
  invoiceValue: number;
  taxableAmount: number;
  integratedTax: number;
  centralTax: number;
  stateTax: number;
  gstr2bPeriod: string;
  filingStatus2B: "FILED" | "NOT_FILED";
  matchingStatus: "EXACT_MATCH" | "FUZZY_MATCHED" | "ONLY_IN_2B" | "ONLY_IN_BOOKS" | "TAX_MISMATCH";
  section17_5Blocked: boolean;
  blockedReason?: "MOTOR_VEHICLE" | "FOOD_BEVERAGE" | "WORKS_CONTRACT_IMMOVABLE" | "PERSONAL_USE";
  section16_4TimeBarred: boolean; // Overdue beyond Nov 30 of next FY
  rule37aRisk: boolean; // Supplier did not file GSTR-3B
  vendorActionStatus: "NONE" | "CHASE_WHATSAPP_SENT" | "PAYMENT_HELD";
}

// 5. ICAI SQC-1 Peer Review & SA 230 Workpaper Dossier
export interface Msme43BhClauseItem {
  id: string;
  vendorName: string;
  udyamRegistrationNo: string;
  vendorCategory: "MICRO" | "SMALL" | "MEDIUM";
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  paymentDueDate: string; // 15 days if no agreement, max 45 days if written
  actualPaymentDate?: string;
  disallowedUnder43Bh: boolean;
  interestUnderMsmedAct: number; // 3x RBI bank rate compounded monthly
}

export interface Section40A2bSampleItem {
  id: string;
  relatedPartyName: string;
  relationship: "DIRECTOR" | "RELATIVE_OF_DIRECTOR" | "SUBSTANTIAL_INTEREST_ENTITY";
  natureOfPayment: "REMUNERATION" | "RENT" | "INTEREST" | "PURCHASE_OF_GOODS";
  amountPaid: number;
  fairMarketValueEstimated: number;
  excessPaymentDisallowable: number;
  justificationWorkpaperRef: string;
  articleVerifiedBy: string;
  partnerSigned: boolean;
}

export interface PeerReviewDossier {
  id: string;
  entityId: string;
  financialYear: string;
  sqc1ComplianceScore: number; // e.g. 98%
  permanentAuditFileStatus: "COMPLETE" | "DEFICIENT";
  currentAuditFileStatus: "COMPLETE" | "DEFICIENT";
  udinVerified: boolean;
  udinNumber: string;
  keyWorkpapers: Array<{
    title: string;
    standard: "SA_230" | "SA_315" | "SA_500" | "SA_505" | "SA_570";
    status: "ATTACHED_AND_SIGNED" | "PENDING_REVIEW";
    verifiedBy: string;
    signedDate: string;
  }>;
  mrlAttached: boolean; // Management Representation Letter
  samplingReportUrl: string;
}

// 6. Anti-Poaching Security & Partner Realization
export interface StaffDataSecurityAudit {
  id: string;
  staffName: string;
  staffRole: "ARTICLE" | "PAID_CA" | "MANAGER";
  action: "VIEW_PAN" | "EXPORT_CLIENT_LIST_BLOCKED" | "WATERMARKED_PDF_DOWNLOAD" | "UNMASK_PROMOTER_PHONE_ATTEMPT";
  entityName: string;
  timestamp: string;
  ipAddress: string;
  status: "AUTHORIZED" | "FLAGGED_RESTRICTED" | "CRITICAL_SECURITY_ALERT";
}

export interface PartnerRealizationMetrics {
  partnerName: string;
  assignedClientsCount: number;
  billableHoursThisMonth: number;
  unbilledWipAmount: number;
  billedThisMonth: number;
  recoveredThisMonth: number;
  realizationPercentage: number; // (Recovered / Billed) * 100
  agingAbove90DaysAmount: number;
  atRiskPenaltyClients: number;
}

