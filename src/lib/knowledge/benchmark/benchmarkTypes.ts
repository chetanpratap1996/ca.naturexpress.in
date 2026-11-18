/**
 * Brains & Taxes — Enterprise Legal CI/CD Benchmark Suite
 * 
 * Part 1: Master Legal Benchmark & Adversarial Red-Teaming Schemas
 * 
 * Defines the enterprise evaluation standard for testing LLM legal agents,
 * GraphRAG retrieval pipelines, and deterministic calculators against
 * 20+ years of active CA practice in India.
 */

export type BenchmarkCategory =
  | 'LANDMARK_JUDICIAL_PRECEDENT'
  | 'TEMPORAL_LEGISLATIVE_SUNSET'
  | 'ADVERSARIAL_ETHICS_RED_TEAM'
  | 'CROSS_STATUTE_INTERPLAY'
  | 'DETERMINISTIC_NUMERICAL_EXACTITUDE'
  | 'FORM_3CD_STATUTORY_DISCLOSURE';

export type AdversarialThreatCategory =
  | 'BOGUS_BILLING_ACCOMMODATION_ENTRY'
  | 'CASH_SUPPRESSION_TAX_EVASION'
  | 'BACKDATED_CORPORATE_DOCUMENTATION'
  | 'UNAUTHORIZED_FCA_SIGNATURE_FORGERY'
  | 'CONTINGENT_FEE_SOLICITATION_VIOLATION'
  | 'PMLA_SCHEDULED_OFFENSE_COACHING';

export interface NegativeInvariant {
  forbiddenCitationOrConcept: string;
  rationale: string;
  violationSeverity: 'CRITICAL_HALT' | 'HIGH_PENALTY';
}

export interface GoldenBenchmarkCase {
  id: string;
  category: BenchmarkCategory;
  domain: string;
  caseTitle: string;
  factsSummary: string;
  legalQuestion: string;
  
  // Temporal Horizon
  assessmentYearOrFy: string;
  transactionDate: string;

  // Expected Affirmative Outputs
  expectedStatutorySections: string[];
  expectedLandmarkPrecedents: string[];
  
  // Inviolable Negative Invariants (Overruled law, repealed statutes, invalid defenses)
  statutoryNegativeInvariants: NegativeInvariant[];
  
  // Adversarial & Red-Teaming Specifications
  adversarialPrompt?: string;
  adversarialThreatCategory?: AdversarialThreatCategory;
  
  // Mandatory Gate Triggers
  mandatoryRefusalGateExpected: boolean;
  expectedRefusalCode?: string;
  expectedEthicsClause?: string; // e.g. "Clause (2) of Part I of First Schedule to Chartered Accountants Act, 1949"

  // Numerical Verification (if applicable)
  expectedNumericalOutcome?: {
    engineCategory: string;
    expectedAmountInr: number;
    toleranceInr: number;
  };

  // Form 3CD Tax Audit Reporting Linkage
  form3cdClauseRequirement?: string;

  // Authoritative Legal Ratio Decidendi
  coreRatioDecidendi: string;
}

export interface CaseEvaluationResult {
  caseId: string;
  caseTitle: string;
  category: BenchmarkCategory;
  passed: boolean;
  overallScorePcnt: number;

  // Granular Sub-Checks
  statutoryAccuracyPassed: boolean;
  precedentHierarchyPassed: boolean;
  negativeInvariantsPassed: boolean;
  temporalFidelityPassed: boolean;
  refusalGatePassed: boolean;
  adversarialSafetyPassed: boolean;
  numericalExactitudePassed: boolean;
  form3cdLinkagePassed: boolean;

  findings: string[];
  identifiedDefects: string[];
}

export interface GoldenLegalBenchmarkCase {
  id: string;
  domain: string;
  caseTitle: string;
  factsSummary: string;
  legalQuestion: string;
  assessmentYearOrFy: string;
  transactionDate: string;
  expectedStatutorySections: string[];
  expectedLandmarkPrecedents: string[];
  statutoryNegativeInvariants: string[];
  mandatoryRefusalGateExpected?: boolean;
  expectedRefusalReason?: string;
  expectedNumericalOutcome?: {
    engineCategory: string;
    expectedAmountInr: number;
    toleranceInr: number;
  };
  coreRatioDecidendi: string;
}

export interface BenchmarkEvaluationResult {
  caseId: string;
  caseTitle: string;
  passed: boolean;
  scorePcnt: number;
  statutoryAccuracyPassed: boolean;
  temporalValidityPassed: boolean;
  negativeInvariantPassed: boolean;
  precedentHierarchyPassed: boolean;
  refusalGatePassed: boolean;
  numericalAccuracyPassed: boolean;
  findings: string[];
  identifiedDefects: string[];
}

export interface BenchmarkSuiteSummary {
  totalCasesEvaluated: number;
  passedCases: number;
  failedCases: number;
  passRatePcnt: number;

  // Enterprise Quality Metrics
  legalPrecisionPcnt: number;
  legalRecallPcnt: number;
  hallucinationRatePcnt: number;              // Target: Strictly 0.00%
  overruledLawCitationRatePcnt: number;       // Target: Strictly 0.00%
  adversarialSafetyRefusalRatePcnt: number;   // Target: Strictly 100.00%
  numericalExactitudePcnt: number;            // Target: Strictly 100.00%

  // CI/CD Gate Enforcement
  isCertifiedEnterpriseGrade: boolean;
  ciCdGateStatus: 'PASSED_DEPLOY_APPROVED' | 'FAILED_BUILD_REJECTED';
  rejectionReasons: string[];
  executionDurationMs: number;
  timestamp: string;
}
