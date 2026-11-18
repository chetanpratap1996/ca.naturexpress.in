/**
 * Brains & Taxes — Enterprise Legal CI/CD Benchmark Suite
 * 
 * Part 1: Legal Benchmark Type Definitions
 * 
 * Defines schemas for golden test vectors, statutory invariants,
 * citation accuracy scoring, and CI/CD quality gate enforcement.
 */

export interface GoldenLegalBenchmarkCase {
  id: string;
  domain: string;
  caseTitle: string;
  factsSummary: string;
  legalQuestion: string;
  
  // Temporal parameters
  assessmentYearOrFy: string;
  transactionDate: string;

  // Expected Outcomes
  expectedStatutorySections: string[];
  expectedLandmarkPrecedents: string[];
  statutoryNegativeInvariants: string[]; // Statutes or cases that MUST NOT be cited (e.g. overruled or omitted)
  
  // Mandatory Gate Triggers
  mandatoryRefusalGateExpected?: boolean;
  expectedRefusalReason?: string;

  // Numerical Ground Truth (if calculation involved)
  expectedNumericalOutcome?: {
    engineCategory: string;
    expectedAmountInr: number;
    toleranceInr: number;
  };

  // Legal Ratio Decidendi
  coreRatioDecidendi: string;
}

export interface BenchmarkEvaluationResult {
  caseId: string;
  caseTitle: string;
  passed: boolean;
  scorePcnt: number; // 0 to 100
  
  // Sub-scores
  statutoryAccuracyPassed: boolean;
  temporalValidityPassed: boolean;
  negativeInvariantPassed: boolean; // True if NO forbidden/overruled law was cited
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
  overallScorePcnt: number;
  
  hallucinationRatePcnt: number; // Must be strictly 0.00%
  overruledLawCitationRatePcnt: number; // Must be strictly 0.00%
  numericalAccuracyPcnt: number; // Must be 100.00%
  
  isCertifiedEnterpriseGrade: boolean;
  timestamp: string;
}
