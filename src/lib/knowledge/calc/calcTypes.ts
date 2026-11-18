/**
 * Brains & Taxes — Enterprise Deterministic Numerical Engines
 * 
 * Part 1: Calculation Engine Types & Contracts
 * 
 * Multi-Billion Dollar Architecture:
 * Zero-hallucination arithmetic. LLMs are strictly barred from token-based math.
 * Every calculation runs in pure, deterministic code complying with statutory
 * rounding rules (Rule 119A, Section 288A/B, Section 50(1) Proviso).
 */

export type CalculationCategory =
  | 'ADVANCE_TAX_234ABC'
  | 'GST_SECTION_50_NET_CASH'
  | 'MSME_COMPOUND_INTEREST_SEC16'
  | 'PARTNER_REMUNERATION_SEC_40B'
  | 'SECTION_186_INTERCORPORATE_CAP'
  | 'RULE_42_COMMON_CREDIT_REVERSAL'
  | 'SLUMP_SALE_50B_NET_WORTH';

export interface CalculationScheduleItem {
  stepNumber: number;
  stepDescription: string;
  statutoryBasis: string;
  inputValue: string | number;
  appliedRateOrFormula: string;
  outputValue: number;
  auditorNotes: string;
}

export interface CalculationResult {
  engineType: CalculationCategory;
  calculationTitle: string;
  statutoryAuthority: string;
  inputParameters: Record<string, any>;
  primaryComputedAmountInr: number;
  statutoryRoundingApplied: string;
  auditTrailSchedule: CalculationScheduleItem[];
  reconciliationSummary: string;
  disallowanceAlert?: {
    isDisallowedUnderTax: boolean;
    disallowanceSection: string;
    form3cdClause: string;
  };
}
