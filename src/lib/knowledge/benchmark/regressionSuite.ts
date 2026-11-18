/**
 * Brains & Taxes — Enterprise Legal CI/CD Benchmark Suite
 * 
 * Part 4: Master Regression Suite & CI/CD Runner
 * 
 * Executes full golden benchmark corpus across the unified CA Knowledge Engine.
 * Generates automated enterprise compliance reports for CI/CD gates.
 */

import { GOLDEN_LEGAL_BENCHMARK_CASES } from './goldenDataset';
import { LegalBenchmarkEvaluator, EvaluatorEngineOutput } from './legalEvaluator';
import { BenchmarkEvaluationResult, BenchmarkSuiteSummary } from './benchmarkTypes';

export class LegalBenchmarkRegressionSuite {
  /**
   * Executes benchmark against a collection of engine outputs or runner functions
   */
  public static runFullBenchmark(
    engineResolver: (caseId: string) => EvaluatorEngineOutput
  ): {
    summary: BenchmarkSuiteSummary;
    results: BenchmarkEvaluationResult[];
  } {
    const results: BenchmarkEvaluationResult[] = [];
    let passedCount = 0;
    let hallucinatedCount = 0;
    let overruledLawCount = 0;
    let numericalTestedCount = 0;
    let numericalPassedCount = 0;

    for (const goldCase of GOLDEN_LEGAL_BENCHMARK_CASES) {
      const output = engineResolver(goldCase.id);
      const evalResult = LegalBenchmarkEvaluator.evaluate(goldCase, output);
      results.push(evalResult);

      if (evalResult.passed) {
        passedCount++;
      }

      if (!evalResult.negativeInvariantPassed) {
        overruledLawCount++;
      }

      if (!evalResult.statutoryAccuracyPassed || !evalResult.temporalValidityPassed) {
        hallucinatedCount++;
      }

      if (goldCase.expectedNumericalOutcome) {
        numericalTestedCount++;
        if (evalResult.numericalAccuracyPassed) {
          numericalPassedCount++;
        }
      }
    }

    const total = GOLDEN_LEGAL_BENCHMARK_CASES.length;
    const overallScorePcnt = Math.round((passedCount / total) * 100);
    const hallucinationRatePcnt = Math.round((hallucinatedCount / total) * 10000) / 100;
    const overruledLawCitationRatePcnt = Math.round((overruledLawCount / total) * 10000) / 100;
    const numericalAccuracyPcnt = numericalTestedCount > 0 ? Math.round((numericalPassedCount / numericalTestedCount) * 10000) / 100 : 100.0;

    const summary: BenchmarkSuiteSummary = {
      totalCasesEvaluated: total,
      passedCases: passedCount,
      failedCases: total - passedCount,
      overallScorePcnt,
      hallucinationRatePcnt,
      overruledLawCitationRatePcnt,
      numericalAccuracyPcnt,
      isCertifiedEnterpriseGrade: overallScorePcnt === 100 && hallucinationRatePcnt === 0 && overruledLawCitationRatePcnt === 0,
      timestamp: new Date().toISOString()
    };

    return { summary, results };
  }
}
