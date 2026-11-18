/**
 * Brains & Taxes — Enterprise Statutory Refusal & Evidence Requisition
 * 
 * Part 1: Ontological Types & Conditions Precedent
 * 
 * Multi-Billion Dollar Architecture:
 * Enforces the professional standard of a 20+ Year Senior CA Partner.
 * The engine actively REFUSES to hallucinate or advise when statutory
 * conditions precedent or primary evidentiary proofs are missing.
 */

export type RefusalSeverity = 
  | 'STRICT_HALT_REFUSAL'             // Execution halted; no advice can be rendered legally
  | 'CONDITIONAL_ESCALATION_WARNING' // Advice rendered with heavy caveats & qualification
  | 'REQUISITION_REQUIRED';          // Pauses pipeline to demand primary documents from client

export type StatutoryGateCategory =
  | 'MSME_SECTION_43BH'
  | 'CASH_CREDIT_SECTION_68'
  | 'GST_ITC_SECTION_16'
  | 'CORPORATE_LOAN_SECTION_185'
  | 'NOTICE_JURISDICTION_DIN'
  | 'REASSESSMENT_SANCTION_151'
  | 'CAPITAL_GAINS_50C_56_2'
  | 'ICAI_UDIN_ETHICS';

export interface ConditionPrecedent {
  id: string;
  fieldKey: string;
  fieldDescription: string;
  statutoryBasis: string;
  mandatoryProofDocument: string;
  whyRequired: string;
  consequenceOfAbsence: string;
}

export interface FactPayload {
  domainId: string;
  targetSection?: string;
  entityType?: string;
  clientJurisdiction?: string;
  
  // MSME / Section 43B(h) Inputs
  supplierUdyamNumber?: string;
  supplierUdyamRegistrationDate?: string; // ISO Date
  invoiceDate?: string;                  // ISO Date
  paymentDate?: string;                  // ISO Date
  hasWrittenCreditAgreement?: boolean;
  agreedCreditDays?: number;
  supplierEnterpriseType?: 'MICRO' | 'SMALL' | 'MEDIUM';
  supplierMajorActivity?: 'MANUFACTURING' | 'SERVICES' | 'TRADING';

  // Section 68 Cash Credit Inputs
  lenderPan?: string;
  lenderItrAcknowledgmentInPossession?: boolean;
  lenderAuditedBalanceSheetInPossession?: boolean;
  bankingChannelDebitProofInPossession?: boolean;
  lenderCreditworthinessEstablished?: boolean;

  // GST Section 16 Inputs
  hasTaxInvoice?: boolean;
  invoiceAppearsInGstr2B?: boolean;
  goodsOrServicesActuallyReceived?: boolean;
  supplierFiledGstr3B?: boolean;
  recipientPaidSupplierWithin180Days?: boolean;

  // Corporate Loans Section 185 Inputs
  borrowerIsDirectorOrRelative?: boolean;
  specialResolutionPassedUnder185_2?: boolean;
  borrowerPrincipalBusinessEndUseCertified?: boolean;

  // Notice & Litigation Inputs
  noticeHasDin?: boolean;
  noticeDinString?: string;
  manualIssuanceHasPriorCcitApproval?: boolean;
  manualApprovalDate?: string;
  regularizedWithDinWithin15Days?: boolean;
  section151SanctionObtained?: boolean;
}

export interface StatutoryGateViolation {
  gateCategory: StatutoryGateCategory;
  severity: RefusalSeverity;
  conditionId: string;
  missingParameterName: string;
  legalRationale: string;
  statutoryCitation: string;
  remedialDocumentNeeded: string;
  penalRiskIfIgnored: string;
}

export interface EvidenceRequisitionDocket {
  docketId: string;
  generatedAt: string;
  clientEntityName: string;
  targetComplianceSubject: string;
  refusalVerdict: 'HALTED_PENDING_PRIMARY_EVIDENCE' | 'ADVICE_BLOCKED_UNLAWFUL';
  seniorPartnerMemorandum: string;
  requiredDocumentsList: {
    itemNumber: number;
    documentTitle: string;
    acceptedFormats: string[];
    issuingAuthority: string;
    criticalVerificationPoints: string[];
    statutoryMandate: string;
  }[];
  regulatoryCaveat: string;
}

export interface GateEvaluationOutcome {
  isCleared: boolean;
  severity: 'CLEARED' | RefusalSeverity;
  violations: StatutoryGateViolation[];
  requisitionDocket?: EvidenceRequisitionDocket;
  partnerAdvisoryNotes?: string;
}
