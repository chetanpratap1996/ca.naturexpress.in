/**
 * Bank Revenue Leakage Inspector & Interest Audit Engine
 * 
 * Statutory Authority:
 * - RBI Master Circular on Interest Rates on Advances (RBI/2021-2022/104)
 * - External Benchmark Based Lending Rates (EBLR) & Marginal Cost of Funds based Lending Rate (MCLR) guidelines
 * - Guidelines on Penal Charges in Loan Accounts (RBI/2023-24/53 - Effective April 2024)
 * - ICAI Guidance Note on Bank Audit: Audit of Income and Revenue Leakage Detection
 */

export interface LoanPricingAuditItem {
  id: string;
  accountNumber: string;
  borrowerName: string;
  facilityType: 'CASH_CREDIT' | 'TERM_LOAN' | 'HOUSING_LOAN' | 'AUTO_LOAN';
  sanctionedLimit: number;
  averageOutstanding: number;
  
  // Sanctioned Terms
  sanctionedBenchmark: 'REPO_EBLR' | '1Y_MCLR' | '3M_MCLR' | 'BASE_RATE';
  benchmarkRatePercent: number; // e.g. 6.50% Repo
  sanctionedSpreadPercent: number; // e.g. 2.75%
  sanctionedEffectiveRatePercent: number; // 9.25%
  
  // Actual CBS System Charging
  cbsAppliedRatePercent: number; // e.g. 8.75% (0.50% undercharge!)
  rateDifferentialPercent: number; // 0.50%
  isInterestUndercharged: boolean;
  interestLeakageAmount: number; // Annualized revenue loss
  
  // Penal Charges
  isStockStatementDelayed: boolean;
  stockDelayMonths: number;
  penalInterestRatePercent: number; // Standard 2.0% p.a.
  penalInterestUnrecovered: number;
  
  // Limit Renewal & Commitment Charges
  isLimitExpiredOver180Days: boolean;
  limitExpiryPenalExposure: number;
  unutilizedLimitAverage: number;
  commitmentChargesUnderrecovered: number;
  
  totalAuditorDetectedLeakage: number;
  recoveryNoticeDrafted: boolean;
}

export class RevenueLeakageEngine {
  /**
   * Audits interest rates, benchmark resets, and unrecovered penal charges
   */
  public static auditLoanAccount(data: {
    accountNumber: string;
    borrowerName: string;
    facilityType: 'CASH_CREDIT' | 'TERM_LOAN' | 'HOUSING_LOAN' | 'AUTO_LOAN';
    sanctionedLimit: number;
    averageOutstanding: number;
    sanctionedBenchmark: 'REPO_EBLR' | '1Y_MCLR' | '3M_MCLR' | 'BASE_RATE';
    benchmarkRatePercent: number;
    sanctionedSpreadPercent: number;
    cbsAppliedRatePercent: number;
    isStockStatementDelayed: boolean;
    stockDelayMonths: number;
    isLimitExpiredOver180Days: boolean;
    averageUtilizationPercent: number;
  }): LoanPricingAuditItem {
    const sanctionedEffectiveRate = Number((data.benchmarkRatePercent + data.sanctionedSpreadPercent).toFixed(2));
    const rateDiff = Number((sanctionedEffectiveRate - data.cbsAppliedRatePercent).toFixed(2));
    const isUndercharged = rateDiff > 0.05; // > 0.05% tolerance

    // Interest Leakage = Average Outstanding * Rate Differential / 100
    const interestLeakage = isUndercharged 
      ? Math.round(data.averageOutstanding * (rateDiff / 100))
      : 0;

    // Penal interest on delayed stock statements @ 2.0% p.a.
    const penalRate = 2.0;
    const penalUnrecovered = data.isStockStatementDelayed && data.stockDelayMonths > 0
      ? Math.round((data.averageOutstanding * (penalRate / 100) * (data.stockDelayMonths / 12)))
      : 0;

    // Limit expiry penal @ 2% p.a. if expired > 180 days
    const limitExpiryPenal = data.isLimitExpiredOver180Days
      ? Math.round(data.averageOutstanding * 0.02 * (6 / 12)) // 6 months penal
      : 0;

    // Commitment charges on unutilized limit (0.50% if utilization < 70%)
    let commitmentCharge = 0;
    const unutilized = Math.max(0, data.sanctionedLimit - data.averageOutstanding);
    if (data.facilityType === 'CASH_CREDIT' && data.averageUtilizationPercent < 70) {
      commitmentCharge = Math.round(unutilized * 0.005); // 0.50%
    }

    const totalLeakage = interestLeakage + penalUnrecovered + limitExpiryPenal + commitmentCharge;

    return {
      id: `LEAK-${data.accountNumber.slice(-4)}`,
      accountNumber: data.accountNumber,
      borrowerName: data.borrowerName,
      facilityType: data.facilityType,
      sanctionedLimit: data.sanctionedLimit,
      averageOutstanding: data.averageOutstanding,
      sanctionedBenchmark: data.sanctionedBenchmark,
      benchmarkRatePercent: data.benchmarkRatePercent,
      sanctionedSpreadPercent: data.sanctionedSpreadPercent,
      sanctionedEffectiveRatePercent: sanctionedEffectiveRate,
      cbsAppliedRatePercent: data.cbsAppliedRatePercent,
      rateDifferentialPercent: rateDiff,
      isInterestUndercharged: isUndercharged,
      interestLeakageAmount: interestLeakage,
      isStockStatementDelayed: data.isStockStatementDelayed,
      stockDelayMonths: data.stockDelayMonths,
      penalInterestRatePercent: penalRate,
      penalInterestUnrecovered: penalUnrecovered,
      isLimitExpiredOver180Days: data.isLimitExpiredOver180Days,
      limitExpiryPenalExposure: limitExpiryPenal,
      unutilizedLimitAverage: unutilized,
      commitmentChargesUnderrecovered: commitmentCharge,
      totalAuditorDetectedLeakage: totalLeakage,
      recoveryNoticeDrafted: totalLeakage > 50000
    };
  }

  /**
   * Summarizes total branch revenue leakage across all audited accounts
   */
  public static summarizeLeakage(records: LoanPricingAuditItem[]): {
    totalLeakageAmount: number;
    interestUnderchargeTotal: number;
    penalChargesTotal: number;
    commitmentChargesTotal: number;
    accountsWithLeakageCount: number;
  } {
    const total = records.reduce((sum, r) => sum + r.totalAuditorDetectedLeakage, 0);
    const intUnder = records.reduce((sum, r) => sum + r.interestLeakageAmount, 0);
    const penal = records.reduce((sum, r) => sum + r.penalInterestUnrecovered + r.limitExpiryPenalExposure, 0);
    const comm = records.reduce((sum, r) => sum + r.commitmentChargesUnderrecovered, 0);
    const count = records.filter(r => r.totalAuditorDetectedLeakage > 0).length;

    return {
      totalLeakageAmount: total,
      interestUnderchargeTotal: intUnder,
      penalChargesTotal: penal,
      commitmentChargesTotal: comm,
      accountsWithLeakageCount: count
    };
  }
}

export const SAMPLE_PRICING_AUDIT_DATA: LoanPricingAuditItem[] = [
  RevenueLeakageEngine.auditLoanAccount({
    accountNumber: '3819002100088123',
    borrowerName: 'Khandelwal Steel & Tube Mills',
    facilityType: 'CASH_CREDIT',
    sanctionedLimit: 40000000, // ₹4.0 Cr
    averageOutstanding: 38500000,
    sanctionedBenchmark: 'REPO_EBLR',
    benchmarkRatePercent: 6.50,
    sanctionedSpreadPercent: 3.25, // Sanctioned: 9.75%
    cbsAppliedRatePercent: 9.00, // Charged: 9.00% (0.75% undercharge!)
    isStockStatementDelayed: true,
    stockDelayMonths: 3,
    isLimitExpiredOver180Days: false,
    averageUtilizationPercent: 96
  }),
  RevenueLeakageEngine.auditLoanAccount({
    accountNumber: '3819002100049210',
    borrowerName: 'Malwa Agro Processing Industries Pvt Ltd',
    facilityType: 'CASH_CREDIT',
    sanctionedLimit: 25000000, // ₹2.5 Cr
    averageOutstanding: 24850000,
    sanctionedBenchmark: '1Y_MCLR',
    benchmarkRatePercent: 8.40,
    sanctionedSpreadPercent: 1.50, // Sanctioned: 9.90%
    cbsAppliedRatePercent: 9.90, // Correctly charged
    isStockStatementDelayed: true,
    stockDelayMonths: 4, // 4 months delayed = penal 2%
    isLimitExpiredOver180Days: true, // Expired > 180 days = penal 2%
    averageUtilizationPercent: 99
  }),
  RevenueLeakageEngine.auditLoanAccount({
    accountNumber: '3819003500010945',
    borrowerName: 'Rajdhani Logistics & Transport Corp',
    facilityType: 'TERM_LOAN',
    sanctionedLimit: 12000000,
    averageOutstanding: 9400000,
    sanctionedBenchmark: 'REPO_EBLR',
    benchmarkRatePercent: 6.50,
    sanctionedSpreadPercent: 2.50, // 9.00%
    cbsAppliedRatePercent: 8.50, // 0.50% undercharge
    isStockStatementDelayed: false,
    stockDelayMonths: 0,
    isLimitExpiredOver180Days: false,
    averageUtilizationPercent: 78
  })
];
