/**
 * Bank Audit Suite Unified Orchestrator & Master Facade Engine
 * 
 * Statutory Authority:
 * - RBI Master Circular on IRAC Norms (Income Recognition, Asset Classification and Provisioning)
 * - RBI LFAR (Long Form Audit Report) Format for Statutory Bank Branch Audits
 * - Tandon & Nayak Committee Guidelines for Drawing Power (DP) Computations
 * - Ghosh & Jilani Committee Directives for Bank Internal Controls & EWS
 * - RBI Master Direction on Penal Charges & Revenue Leakage Prevention (RBI/2023-24/53)
 */

import { 
  BankAdvanceAccount, 
  SAMPLE_BANK_ADVANCES, 
  SAMPLE_DP_COMPUTATION, 
  IracNpaEngine,
  DrawingPowerComputation
} from './iracNpaEngine';

import { 
  LfarQuestionItem, 
  LfarMasterEngine, 
  LfarAuditPackSummary 
} from './lfarMasterEngine';

import { 
  HighValueTransactionItem, 
  CashRetentionAuditItem, 
  LockerOperationAuditItem, 
  ConcurrentAuditEngine,
  SAMPLE_HIGH_VALUE_TRANSACTIONS,
  SAMPLE_CASH_RETENTION_RECORDS,
  SAMPLE_LOCKER_AUDIT_RECORDS
} from './concurrentAuditEngine';

import { 
  GhoshJilaniControlItem, 
  EarlyWarningSignalItem, 
  GhoshJilaniEwsEngine 
} from './ghoshJilaniEwsEngine';

import { 
  LoanPricingAuditItem, 
  RevenueLeakageEngine, 
  SAMPLE_PRICING_AUDIT_DATA 
} from './revenueLeakageEngine';

export type AdvanceAccount = BankAdvanceAccount;

export const MOCK_ADVANCE_ACCOUNTS: AdvanceAccount[] = SAMPLE_BANK_ADVANCES;
export const MOCK_DP_RECORD = SAMPLE_DP_COMPUTATION;
export const MOCK_LFAR_QUESTIONS: LfarQuestionItem[] = LfarMasterEngine.getMandatedLfarQuestions();
export const MOCK_HIGH_VALUE_TXNS: HighValueTransactionItem[] = SAMPLE_HIGH_VALUE_TRANSACTIONS;
export const MOCK_CASH_RETENTION_RECORDS: CashRetentionAuditItem[] = SAMPLE_CASH_RETENTION_RECORDS;
export const MOCK_LOCKER_AUDIT_RECORDS: LockerOperationAuditItem[] = SAMPLE_LOCKER_AUDIT_RECORDS;
export const MOCK_GHOSH_JILANI_ITEMS: GhoshJilaniControlItem[] = GhoshJilaniEwsEngine.getGhoshJilaniChecklist();
export const MOCK_EWS_ITEMS: EarlyWarningSignalItem[] = GhoshJilaniEwsEngine.scanEarlyWarningSignals();
export const MOCK_PRICING_AUDIT_RECORDS: LoanPricingAuditItem[] = SAMPLE_PRICING_AUDIT_DATA;

export class BankAuditSuiteEngine {
  /**
   * Compiles the official LFAR audit package and computes completion & risk metrics
   */
  public static compileLfarReport(
    bankName: string,
    branchName: string,
    financialYear: string,
    questions: LfarQuestionItem[]
  ): LfarAuditPackSummary {
    return LfarMasterEngine.summarizeLfar(questions, {
      branchName,
      branchCode: '04921',
      bankName,
      financialYear
    });
  }

  /**
   * Synthesizes Concurrent Audit records across CTR, Cash Retention, and Locker Operations
   */
  public static summarizeConcurrentAudit(
    highValueTxns: HighValueTransactionItem[],
    cashRetention: CashRetentionAuditItem[],
    lockerRecords: LockerOperationAuditItem[]
  ) {
    const txnSummary = ConcurrentAuditEngine.auditHighValueTransactions(highValueTxns);
    const cashSummary = ConcurrentAuditEngine.auditCashRetention(cashRetention);
    return {
      ...txnSummary,
      ...cashSummary,
      totalLockersAudited: lockerRecords.length
    };
  }

  /**
   * Computes comprehensive interest and penal fee revenue leakage across loan accounts
   */
  public static computeRevenueLeakageSummary(pricingAuditRecords: LoanPricingAuditItem[]) {
    return RevenueLeakageEngine.summarizeLeakage(pricingAuditRecords);
  }
}

// Re-export constituent engines and types for full suite accessibility
export {
  IracNpaEngine,
  LfarMasterEngine,
  ConcurrentAuditEngine,
  GhoshJilaniEwsEngine,
  RevenueLeakageEngine
};
export type {
  BankAdvanceAccount,
  DrawingPowerComputation,
  LfarQuestionItem,
  LfarAuditPackSummary,
  HighValueTransactionItem,
  CashRetentionAuditItem,
  LockerOperationAuditItem,
  GhoshJilaniControlItem,
  EarlyWarningSignalItem,
  LoanPricingAuditItem
};
