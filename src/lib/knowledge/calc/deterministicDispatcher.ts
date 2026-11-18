/**
 * Brains & Taxes — Enterprise Deterministic Numerical Engines
 * 
 * Part 5: Master Calculator Dispatcher
 * 
 * Orchestrates calculation execution across Direct Tax, GST, and Corporate Law.
 * Injects verified numerical tables into agent workpapers and litigator briefs.
 */

import { DirectTaxCalculators } from './directTaxEngines';
import { GstCalculators } from './gstEngines';
import { CorporateAlliedCalculators } from './corporateAlliedEngines';
import { CalculationCategory, CalculationResult } from './calcTypes';

export class DeterministicCalculationDispatcher {
  /**
   * Executes calculation based on engine type and inputs
   */
  public static execute(
    category: CalculationCategory,
    params: Record<string, any>
  ): CalculationResult {
    switch (category) {
      case 'ADVANCE_TAX_234ABC':
        return DirectTaxCalculators.calculateInterest234ABC(params as any);

      case 'PARTNER_REMUNERATION_SEC_40B':
        return DirectTaxCalculators.calculatePartnerRemuneration40b(params as any);

      case 'GST_SECTION_50_NET_CASH':
        return GstCalculators.calculateSection50NetCashInterest(params as any);

      case 'RULE_42_COMMON_CREDIT_REVERSAL':
        return GstCalculators.calculateRule42CommonCreditReversal(params as any);

      case 'SECTION_186_INTERCORPORATE_CAP':
        return CorporateAlliedCalculators.calculateSection186Cap(params as any);

      case 'MSME_COMPOUND_INTEREST_SEC16':
        return CorporateAlliedCalculators.calculateMsmedSection16Interest(params as any);

      default:
        throw new Error(`Unsupported calculation engine category: ${category}`);
    }
  }

  /**
   * Formats a calculation result into a Markdown table for workpaper inclusion
   */
  public static formatToWorkpaperMarkdown(result: CalculationResult): string {
    let md = `### ${result.calculationTitle}\n`;
    md += `**Statutory Authority:** ${result.statutoryAuthority}\n`;
    md += `**Rounding Applied:** ${result.statutoryRoundingApplied}\n\n`;

    md += `| Step | Description | Statutory Basis | Inputs | Rate/Formula | Computed (INR) |\n`;
    md += `|:---:|---|---|---|---|:---:|\n`;

    for (const item of result.auditTrailSchedule) {
      md += `| ${item.stepNumber} | ${item.stepDescription} | ${item.statutoryBasis} | ${item.inputValue} | ${item.appliedRateOrFormula} | ${typeof item.outputValue === 'number' ? item.outputValue.toLocaleString('en-IN') : item.outputValue} |\n`;
    }

    md += `\n**Reconciliation Summary:** ${result.reconciliationSummary}\n`;

    if (result.disallowanceAlert) {
      md += `\n> [!CAUTION] **STATUTORY TAX DISALLOWANCE ALERT**\n`;
      md += `> Amount disallowed under **${result.disallowanceAlert.disallowanceSection}**. Mandatory reporting required in **Form 3CD ${result.disallowanceAlert.form3cdClause}**.\n`;
    }

    return md;
  }
}
