/**
 * Brains & Taxes — Enterprise Legal Knowledge Graph
 * 
 * Part 3: Deterministic Temporal Statutory Filter
 * 
 * Eliminates temporal contamination before semantic retrieval.
 * Resolves AY vs Tax Year, statutory omissions, and retrospective validations.
 */

import { LegalGraphNode, ParsedQueryContext } from './legalGraphTypes';

export interface TemporalEvaluationResult {
  isValidForQuery: boolean;
  status: 'CURRENTLY_ACTIVE' | 'RETROSPECTIVELY_VALIDATED' | 'OMITTED_SUNSET' | 'FUTURE_INOPERATIVE';
  explanation: string;
  statutoryWarning?: string;
}

export class TemporalStatutoryFilter {
  /**
   * Filters and validates a legal node against the query's temporal target
   */
  public static evaluateTemporalFitness(
    node: LegalGraphNode,
    context: ParsedQueryContext
  ): TemporalEvaluationResult {
    const temp = node.temporal;
    const targetDate = context.transactionDate || (context.targetFinancialYear ? this.extractDateFromFY(context.targetFinancialYear) : '2026-04-01');

    // ------------------------------------------------------------------------
    // CHECK 1: OMISSION & SUNSET BOUNDARY (e.g. Sec 206AB, 206CCA, 206C(1H))
    // ------------------------------------------------------------------------
    if (temp.isOmitted && temp.omissionDate) {
      if (targetDate >= temp.omissionDate) {
        return {
          isValidForQuery: false,
          status: 'OMITTED_SUNSET',
          explanation: `Provision omitted w.e.f. ${temp.omissionDate} by ${temp.omissionStatute || 'amending Act'}. Inoperative for target date ${targetDate}.`,
          statutoryWarning: `CRITICAL STATUTORY ALERT: ${node.statutoryReference} was OMITTED w.e.f. ${temp.omissionDate} by ${temp.omissionStatute || 'Parliament'}. It cannot be applied to transactions on or after this date.`
        };
      }
    }

    // ------------------------------------------------------------------------
    // CHECK 2: RETROSPECTIVE STATUTORY VALIDATION (e.g. CGST Sec 16(5)/(6))
    // ------------------------------------------------------------------------
    if (temp.isRetrospective && temp.retrospectiveFrom) {
      if (context.targetFinancialYear && temp.applicablePreviousYears.includes(context.targetFinancialYear)) {
        return {
          isValidForQuery: true,
          status: 'RETROSPECTIVELY_VALIDATED',
          explanation: `Statutory relief inserted with retrospective effect from ${temp.retrospectiveFrom}. Valid and active for ${context.targetFinancialYear}.`,
          statutoryWarning: `RETROSPECTIVE STATUTORY BENEFIT: Applied via retrospective amendment enacted by Parliament.`
        };
      }
    }

    // ------------------------------------------------------------------------
    // CHECK 3: INCOME TAX 1961 VS 2025 ACT TRANSITION
    // ------------------------------------------------------------------------
    if (node.id === 'IT-ACT-2025') {
      const isAY2026OrEarlier = context.targetAssessmentYear && context.targetAssessmentYear <= 'AY 2026-27';
      const isFY2025OrEarlier = context.targetFinancialYear && context.targetFinancialYear <= 'FY 2025-26';

      if (isAY2026OrEarlier || isFY2025OrEarlier) {
        return {
          isValidForQuery: false,
          status: 'FUTURE_INOPERATIVE',
          explanation: `Income-tax Act, 2025 commences 1 April 2026 for Tax Year 2026-27 onwards. AY 2026-27 corresponds to FY 2025-26 governed strictly by Income-tax Act, 1961.`,
          statutoryWarning: `TEMPORAL MISROUTING PREVENTED: Cannot apply 2025 Act to AY 2026-27 / FY 2025-26.`
        };
      }
    }

    if (node.id === 'IT-ACT-1961') {
      if (context.targetTaxYear && context.targetTaxYear >= 'Tax Year 2026-27') {
        return {
          isValidForQuery: false,
          status: 'OMITTED_SUNSET',
          explanation: `Income-tax Act, 1961 is replaced by Income-tax Act, 2025 from Tax Year 2026-27 onwards.`,
          statutoryWarning: `TEMPORAL TRANSITION: Substantive direct tax law transitioned to 2025 Act.`
        };
      }
    }

    // ------------------------------------------------------------------------
    // CHECK 4: GENERAL PREVIOUS YEAR / ASSESSMENT YEAR FIT
    // ------------------------------------------------------------------------
    if (context.targetFinancialYear && temp.applicablePreviousYears.length > 0) {
      const matchesFY = temp.applicablePreviousYears.includes(context.targetFinancialYear) ||
        temp.applicablePreviousYears.includes('All Years') ||
        temp.applicablePreviousYears.includes('All GST Years') ||
        temp.applicablePreviousYears.some(fy => fy.includes('onwards') && context.targetFinancialYear! >= fy.split(' ')[0]);

      if (!matchesFY && !temp.isRetrospective) {
        return {
          isValidForQuery: false,
          status: 'FUTURE_INOPERATIVE',
          explanation: `Provision applicable only to: ${temp.applicablePreviousYears.join(', ')}. Target FY was ${context.targetFinancialYear}.`
        };
      }
    }

    return {
      isValidForQuery: true,
      status: 'CURRENTLY_ACTIVE',
      explanation: `Provision is valid, operative, and current for target period.`
    };
  }

  private static extractDateFromFY(fyString: string): string {
    // "FY 2025-26" -> "2025-07-01" (mid financial year representative date)
    const match = fyString.match(/\b(20\d\d)-(\d\d)\b/);
    if (match) {
      return `${match[1]}-07-01`;
    }
    return '2025-07-01';
  }
}
