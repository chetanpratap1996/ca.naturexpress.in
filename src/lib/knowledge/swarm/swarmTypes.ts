/**
 * Brains & Taxes — Enterprise 3-Tier Maker-Checker Multi-Agent Swarm
 * 
 * Part 1: Swarm State Machine & Workflow Contracts
 * 
 * Multi-Billion Dollar Architecture:
 * Implements ICAI Standard on Quality Control (SQC 1) & SA 220 practice governance.
 * Enforces strict segregation of duties between Maker (Article Trainee),
 * Checker (Tax Manager), and Signatory (FCA Partner).
 */

export type SwarmRole = 
  | 'ARTICLE_TRAINEE_MAKER'
  | 'TAX_MANAGER_CHECKER'
  | 'FCA_PARTNER_SIGNATORY';

export type SwarmWorkflowState =
  | 'INGESTION_PENDING'
  | 'MAKER_PREPARATION'
  | 'CHECKER_REVIEW'
  | 'REVISION_REQUIRED'
  | 'PARTNER_ADJUDICATION'
  | 'PAY_TO_RELEASE_LOCKED'
  | 'RELEASED_AND_UDIN_ACTIVE';

export interface SourceDocumentReference {
  documentId: string;
  documentTitle: string;
  sourceType: 'INVOICE' | 'BANK_STATEMENT' | 'NOTICE' | 'UDYAM_CERT' | 'AGREEMENT';
  lineReferenceOrPage?: string;
  sha256VerificationHash: string;
}

export interface MakerWorkpaper {
  workpaperId: string;
  preparedBy: {
    traineeName: string;
    articleshipRegNo: string;
    timestamp: string;
  };
  clientEntityName: string;
  targetSubject: string;
  targetFinancialYear: string;
  targetAssessmentYear?: string;
  extractedFactualSchedule: Record<string, any>;
  primarySourcesReferenced: SourceDocumentReference[];
  draftMathematicalCalculations: {
    calculationType: string;
    computedAmountInr: number;
    roundingRuleApplied: string;
    formulaDetails: string;
  }[];
  initialStatutoryFindings: string[];
  isLockedForReview: boolean;
}

export interface CheckerAuditReport {
  auditReportId: string;
  reviewedBy: {
    managerName: string;
    membershipNumber: string;
    timestamp: string;
  };
  workpaperId: string;
  verdict: 'APPROVED_FOR_PARTNER_REVIEW' | 'RETURNED_TO_MAKER_WITH_DEFECTS';
  checksCompleted: {
    checkName: string;
    passed: boolean;
    defectNotes?: string;
  }[];
  statutoryBugGuardsVerified: {
    guardName: string;
    isCompliant: boolean;
  }[];
  defectInstructions?: string;
}

export interface LitigatorSubmissionBrief {
  part1_PreliminaryJurisdictionalObjections: string;
  part2_StatementOfRelevantCommercialFacts: string;
  part3_SubstantiveMeritsAndPrecedents: string;
  part4_DeterministicNumericalReconciliation: string;
  part5_PrayerAndPersonalHearingRelief: string;
}

export interface PartnerSignedDocket {
  docketId: string;
  workpaperId: string;
  auditReportId: string;
  partnerSignoff: {
    partnerName: string;
    membershipNumber: string;
    firmRegistrationNumber: '022998C';
    copStatus: 'ACTIVE_FULL_TIME';
    signoffTimestamp: string;
  };
  udinMetadata: {
    udinNumber: string;               // 18-digit official format: YYMMMMMRRRRRRRRR
    generatedTimestamp: string;
    validityWindowDays: 60;
    udinStatus: 'ACTIVE_STAMPED';
  };
  litigatorBrief: LitigatorSubmissionBrief;
  litigationRiskRating: 'CONSERVATIVE_SAFE' | 'ARGUABLE_DEFENSIBLE' | 'AGGRESSIVE_HIGH_EXPOSURE';
  payToReleaseStatus: {
    isEscrowLocked: boolean;
    invoiceNumber: string;
    outstandingFeeInr: number;
    isReleasedToClient: boolean;
    icaiEthicsDisclaimer: 'Strict compliance with ICAI Code of Ethics: No lien exercised over client primary books of accounts.';
  };
}

export interface SwarmSessionAuditTrail {
  sessionId: string;
  clientName: string;
  currentState: SwarmWorkflowState;
  stateHistory: {
    state: SwarmWorkflowState;
    transitionedBy: string;
    role: SwarmRole;
    timestamp: string;
    notes: string;
  }[];
  makerWorkpaper?: MakerWorkpaper;
  checkerReport?: CheckerAuditReport;
  partnerDocket?: PartnerSignedDocket;
}
