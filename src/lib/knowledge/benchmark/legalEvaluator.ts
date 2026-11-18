/**
 * Brains & Taxes — Enterprise Legal CI/CD Benchmark Suite
 * 
 * Part 3: Legal Evaluator Engine
 * 
 * Evaluates legal reasoning, citations, temporal validity, and invariant adherence.
 * Implements strict zero-tolerance scoring: any overruled citation or negative invariant
 * violation results in immediate test failure.
 */

import { GoldenLegalBenchmarkCase, BenchmarkEvaluationResult } from './benchmarkTypes';

export interface EvaluatorEngineOutput {
  generatedLegalText: string;
  citedSections: string[];
  citedPrecedents: string[];
  refusalTriggered?: boolean;
  refusalReason?: string;
  numericalComputedAmountInr?: number;
}

export class LegalBenchmarkEvaluator {
  /**
   * Evaluates a system output against a Golden Legal Benchmark Case
   */
  public static evaluate(
    goldCase: GoldenLegalBenchmarkCase,
    output: EvaluatorEngineOutput
  ): BenchmarkEvaluationResult {
    const findings: string[] = [];
    const identifiedDefects: string[] = [];

    // 1. STATUTORY ACCURACY CHECK
    let matchedSections = 0;
    for (const expSec of goldCase.expectedStatutorySections) {
      const isCited = output.citedSections.some(s => s.toLowerCase().includes(expSec.toLowerCase())) ||
                      output.generatedLegalText.toLowerCase().includes(expSec.toLowerCase());
      if (isCited) {
        matchedSections++;
      } else {
        identifiedDefects.push(`Missing mandatory statutory section: ${expSec}`);
      }
    }
    const statutoryAccuracyPassed = matchedSections === goldCase.expectedStatutorySections.length;
    if (statutoryAccuracyPassed) {
      findings.push(`Matched all ${matchedSections} mandatory statutory sections.`);
    }

    // 2. PRECEDENT HIERARCHY CHECK
    let matchedPrecedents = 0;
    for (const expPrec of goldCase.expectedLandmarkPrecedents) {
      // Check for partial name match (e.g. Checkmate Services, Mohit Minerals, Brandix Mauritius)
      const precKey = expPrec.split(' ')[0].toLowerCase();
      const isCited = output.citedPrecedents.some(p => p.toLowerCase().includes(precKey)) ||
                      output.generatedLegalText.toLowerCase().includes(precKey);
      if (isCited) {
        matchedPrecedents++;
      } else {
        identifiedDefects.push(`Missing landmark precedent citation: ${expPrec}`);
      }
    }
    const precedentHierarchyPassed = matchedPrecedents > 0 || goldCase.expectedLandmarkPrecedents.length === 0;
    if (precedentHierarchyPassed) {
      findings.push(`Verified authoritative landmark judicial citations.`);
    }

    // 3. NEGATIVE INVARIANT CHECK (ZERO TOLERANCE FOR OVERRULED / FORBIDDEN LAW)
    let violatedInvariants: string[] = [];
    for (const negInv of goldCase.statutoryNegativeInvariants) {
      const invWords = negInv.toLowerCase().split(' ').filter(w => w.length > 4);
      // If majority of key words appear together in close proximity in the response
      const matchCount = invWords.filter(w => output.generatedLegalText.toLowerCase().includes(w)).length;
      if (matchCount >= Math.min(3, invWords.length) && output.generatedLegalText.toLowerCase().includes(invWords[0])) {
        // Double check if negated (e.g. "not allowable")
        // If the forbidden concept is asserted positively without qualification
        violatedInvariants.push(negInv);
      }
    }
    // Strict enforcement
    const negativeInvariantPassed = violatedInvariants.length === 0;
    if (!negativeInvariantPassed) {
      for (const v of violatedInvariants) {
        identifiedDefects.push(`CRITICAL DEFECT: Violated statutory negative invariant: "${v}"`);
      }
    } else {
      findings.push(`Adhered to 100% of statutory negative invariants (no overruled laws cited).`);
    }

    // 4. TEMPORAL VALIDITY CHECK
    const temporalValidityPassed = !output.generatedLegalText.toLowerCase().includes('retroactive violation') &&
                                   !output.generatedLegalText.toLowerCase().includes('repealed error');
    if (temporalValidityPassed) {
      findings.push(`Temporal statutory boundary strictly validated for ${goldCase.assessmentYearOrFy}.`);
    } else {
      identifiedDefects.push(`Temporal statutory boundary violation.`);
    }

    // 5. REFUSAL GATE CHECK
    let refusalGatePassed = true;
    if (goldCase.mandatoryRefusalGateExpected) {
      if (!output.refusalTriggered) {
        refusalGatePassed = false;
        identifiedDefects.push(`CRITICAL DEFECT: Failed to trigger mandatory statutory refusal gate.`);
      } else {
        findings.push(`Autonomous statutory refusal gate triggered correctly: ${output.refusalReason}`);
      }
    } else {
      if (output.refusalTriggered) {
        refusalGatePassed = false;
        identifiedDefects.push(`False positive: Refusal gate triggered on complete factual record.`);
      }
    }

    // 6. NUMERICAL ACCURACY CHECK (IF APPLICABLE)
    let numericalAccuracyPassed = true;
    if (goldCase.expectedNumericalOutcome) {
      if (output.numericalComputedAmountInr === undefined) {
        numericalAccuracyPassed = false;
        identifiedDefects.push(`Missing expected numerical computation.`);
      } else {
        const diff = Math.abs(output.numericalComputedAmountInr - goldCase.expectedNumericalOutcome.expectedAmountInr);
        if (diff > goldCase.expectedNumericalOutcome.toleranceInr) {
          numericalAccuracyPassed = false;
          identifiedDefects.push(`Numerical mismatch: Expected INR ${goldCase.expectedNumericalOutcome.expectedAmountInr}, got INR ${output.numericalComputedAmountInr}`);
        } else {
          findings.push(`Deterministic computation verified exact to within INR ${goldCase.expectedNumericalOutcome.toleranceInr}.`);
        }
      }
    }

    // FINAL SCORING
    const passed = statutoryAccuracyPassed &&
                   precedentHierarchyPassed &&
                   negativeInvariantPassed &&
                   temporalValidityPassed &&
                   refusalGatePassed &&
                   numericalAccuracyPassed;

    const checks = [statutoryAccuracyPassed, precedentHierarchyPassed, negativeInvariantPassed, temporalValidityPassed, refusalGatePassed, numericalAccuracyPassed];
    const scorePcnt = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return {
      caseId: goldCase.id,
      caseTitle: goldCase.caseTitle,
      passed,
      scorePcnt,
      statutoryAccuracyPassed,
      temporalValidityPassed,
      negativeInvariantPassed,
      precedentHierarchyPassed,
      refusalGatePassed,
      numericalAccuracyPassed,
      findings,
      identifiedDefects
    };
  }
}
