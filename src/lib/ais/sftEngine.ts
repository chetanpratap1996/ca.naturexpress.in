/**
 * Brains & Taxes — Enterprise SFT (Statement of Financial Transactions) Intelligence Engine
 * 
 * Statutory Authority:
 * - Section 285BA of Income-tax Act, 1961: Obligation to furnish statement of financial transaction
 * - Rule 114E of Income-tax Rules, 1962: Specified reporting thresholds and SFT codes
 * - Section 269ST of Income-tax Act, 1961: Restriction on cash transactions of INR 2,00,000 or more
 * - Section 271DA of Income-tax Act, 1961: Penalty equal to 100% of amount received in violation of Sec 269ST
 * - Section 68 / 69A of Income-tax Act, 1961: Unexplained cash credits and money taxed @ 78% (60% + 25% surcharge + 4% cess)
 */

export type SftTransactionCode =
  | "SFT-001" // Cash deposit in savings a/c >= 10 Lakhs
  | "SFT-002" // Cash deposit/withdrawal in current a/c >= 50 Lakhs
  | "SFT-003" // Bank drafts / pay orders in cash >= 10 Lakhs
  | "SFT-004" // Term deposits (FDs/RDs) >= 10 Lakhs
  | "SFT-005" // Credit card payments (Cash >= 1L, Other >= 10L)
  | "SFT-006" // Bonds / Debentures purchase or sale >= 10 Lakhs
  | "SFT-007" // Mutual fund units investment/redemption >= 10 Lakhs
  | "SFT-008" // Buyback of shares >= 10 Lakhs
  | "SFT-009" // Foreign currency / Overseas travel >= 10 Lakhs
  | "SFT-010" // Immovable property purchase or sale >= 30 Lakhs / Stamp Duty >= 30L
  | "SFT-011" // Cash receipt for goods/services >= 2 Lakhs (Sec 269ST violation)
  | "SFT-012" // Dividend / Interest reporting
  | "SFT-017"; // Listed equity shares & securities turnover

export interface SftRuleThreshold {
  code: SftTransactionCode;
  nature: string;
  thresholdInr: number;
  statutoryRule: string;
  reportingEntities: string;
  primaryRiskSection: string;
  highScrutinyPenaltyDescription: string;
}

export const RULE_114E_THRESHOLDS: Record<SftTransactionCode, SftRuleThreshold> = {
  "SFT-001": {
    code: "SFT-001",
    nature: "Cash deposit in savings bank accounts",
    thresholdInr: 1000000,
    statutoryRule: "Rule 114E(2) Item 1",
    reportingEntities: "Banking companies and Co-operative banks",
    primaryRiskSection: "Section 68 / 69A (Unexplained Cash)",
    highScrutinyPenaltyDescription: "Special tax @ 78% u/s 115BBE if sources are not substantiated in cash book or books of account."
  },
  "SFT-002": {
    code: "SFT-002",
    nature: "Cash deposits or cash withdrawals in current accounts",
    thresholdInr: 5000000,
    statutoryRule: "Rule 114E(2) Item 2",
    reportingEntities: "Banking companies and Co-operative banks",
    primaryRiskSection: "Section 44AB (Audit) & Section 68",
    highScrutinyPenaltyDescription: "Scrutiny check to ensure turnover declared in ITR reconciles with aggregate bank turnover."
  },
  "SFT-003": {
    code: "SFT-003",
    nature: "Purchase of bank drafts / pay orders in cash",
    thresholdInr: 1000000,
    statutoryRule: "Rule 114E(2) Item 3",
    reportingEntities: "Banking companies and Co-operative banks",
    primaryRiskSection: "Section 269ST & Section 69A",
    highScrutinyPenaltyDescription: "High-risk anti-money laundering trigger. Requires source documentation."
  },
  "SFT-004": {
    code: "SFT-004",
    nature: "Term / Fixed deposits in banking or postal entities",
    thresholdInr: 1000000,
    statutoryRule: "Rule 114E(2) Item 4",
    reportingEntities: "Banking companies, Post Master General, Nidhi companies",
    primaryRiskSection: "Section 69 (Unexplained Investments)",
    highScrutinyPenaltyDescription: "Source of investment must be reconciled with tax-paid savings or withdrawals."
  },
  "SFT-005": {
    code: "SFT-005",
    nature: "Credit card payments (Cash >= 1L or Other Mode >= 10L)",
    thresholdInr: 1000000,
    statutoryRule: "Rule 114E(2) Item 5",
    reportingEntities: "Banking companies and credit card issuing institutions",
    primaryRiskSection: "Section 69C (Unexplained Expenditure)",
    highScrutinyPenaltyDescription: "CBDT RMS lifestyle discrepancy flag: Credit card spends exceeding returned income."
  },
  "SFT-006": {
    code: "SFT-006",
    nature: "Acquisition or sale of bonds or debentures",
    thresholdInr: 1000000,
    statutoryRule: "Rule 114E(2) Item 6",
    reportingEntities: "Companies and institutions issuing debentures or bonds",
    primaryRiskSection: "Section 69 (Unexplained Investments) & Capital Gains",
    highScrutinyPenaltyDescription: "Audit check on source of capital and capital gains computation."
  },
  "SFT-007": {
    code: "SFT-007",
    nature: "Mutual fund units investment or redemption",
    thresholdInr: 1000000,
    statutoryRule: "Rule 114E(2) Item 7",
    reportingEntities: "Mutual Fund Asset Management Companies (AMCs) and RTAs",
    primaryRiskSection: "Section 111A / 112 / 112A (Capital Gains)",
    highScrutinyPenaltyDescription: "Mandatory capital gains reconciliation in Schedule CG (LTCG / STCG)."
  },
  "SFT-008": {
    code: "SFT-008",
    nature: "Buy-back of shares from existing shareholders",
    thresholdInr: 1000000,
    statutoryRule: "Rule 114E(2) Item 8",
    reportingEntities: "Companies buying back their own shares",
    primaryRiskSection: "Section 46A / Section 115QA",
    highScrutinyPenaltyDescription: "Verification of buyback distribution tax or shareholder capital gains treatment."
  },
  "SFT-009": {
    code: "SFT-009",
    nature: "Foreign currency purchase, LRS remittance or overseas travel",
    thresholdInr: 1000000,
    statutoryRule: "Rule 114E(2) Item 9",
    reportingEntities: "Authorized Dealers (AD Banks) under FEMA",
    primaryRiskSection: "Section 206C(1G) (TCS) & Section 69C",
    highScrutinyPenaltyDescription: "Reconciliation of TCS credit in Schedule TCS and source of foreign remittance."
  },
  "SFT-010": {
    code: "SFT-010",
    nature: "Purchase or sale of immovable property or stamp valuation >= 30L",
    thresholdInr: 3000000,
    statutoryRule: "Rule 114E(2) Item 10",
    reportingEntities: "Inspector-General of Registration / Sub-Registrars",
    primaryRiskSection: "Section 50C / 43CA / 56(2)(x) (Stamp Duty vs Consideration)",
    highScrutinyPenaltyDescription: "Stamp duty circle rate variance beyond permissible 10% safe harbor triggers deeming additions."
  },
  "SFT-011": {
    code: "SFT-011",
    nature: "Cash receipt for sale of goods/services >= 2 Lakhs (Sec 269ST)",
    thresholdInr: 200000,
    statutoryRule: "Rule 114E(2) Item 11 r/w Section 269ST",
    reportingEntities: "Taxpayers liable to tax audit under Section 44AB",
    primaryRiskSection: "Section 269ST & Section 271DA (100% Penalty)",
    highScrutinyPenaltyDescription: "STRICT STATUTORY VIOLATION: 100% penalty of transacted cash amount leviable u/s 271DA."
  },
  "SFT-012": {
    code: "SFT-012",
    nature: "Dividend, Interest, and Securities transactions reporting",
    thresholdInr: 1, // Any amount reported
    statutoryRule: "Rule 114E(5)",
    reportingEntities: "Companies, RTAs, Depositories, Banks",
    primaryRiskSection: "Section 56(2)(i) (Schedule OS) & Sec 194/194A",
    highScrutinyPenaltyDescription: "Omission in Schedule OS leads to automated Section 143(1)(a) adjustments."
  },
  "SFT-017": {
    code: "SFT-017",
    nature: "Sale of listed securities / equity mutual funds (Depository Turnover)",
    thresholdInr: 1,
    statutoryRule: "CBDT Notification 16/2021",
    reportingEntities: "Recognised Stock Exchanges, Depositories (NSDL / CDSL), RTAs",
    primaryRiskSection: "Schedule CG (Section 111A / 112A)",
    highScrutinyPenaltyDescription: "Gross turnover reported by broker; must be reconciled with purchase cost to avoid gross tax demand."
  }
};

export interface RawAisTransactionItem {
  id: string;
  pan: string;
  informationCode: string; // e.g. SFT-004, SFT-017, 194J, 194A
  reportingEntity: string;
  sourceDescription: string;
  transactionDate?: string;
  reportedAmount: number;
  taxDeductedOrCollected: number;
  financialYear: string;
  assessmentYear: string;
}

export interface CategorizedSftItem {
  id: string;
  pan: string;
  sftCode?: SftTransactionCode;
  nature: string;
  reportingEntity: string;
  reportedAmount: number;
  taxDeducted: number;
  thresholdBreached: boolean;
  thresholdLimitInr: number;
  statutoryRuleCitation: string;
  scrutinyRiskSection: string;
  riskSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  auditActionRecommendation: string;
  targetItrSchedule: string;
}

export class SftEngine {
  /**
   * Evaluates and categorizes raw AIS transactions against Rule 114E thresholds
   */
  public static categorizeTransaction(item: RawAisTransactionItem): CategorizedSftItem {
    const rawCode = (item.informationCode || "").toUpperCase().trim();
    
    // Check if it matches an SFT code
    let sftKey: SftTransactionCode | undefined;
    for (const key of Object.keys(RULE_114E_THRESHOLDS) as SftTransactionCode[]) {
      if (rawCode.includes(key)) {
        sftKey = key;
        break;
      }
    }

    if (sftKey) {
      const config = RULE_114E_THRESHOLDS[sftKey];
      const breached = item.reportedAmount >= config.thresholdInr;

      let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      if (sftKey === "SFT-011") {
        severity = "CRITICAL"; // Sec 269ST violation
      } else if (sftKey === "SFT-001" || sftKey === "SFT-010") {
        severity = breached ? "CRITICAL" : "HIGH";
      } else if (sftKey === "SFT-005" || sftKey === "SFT-002") {
        severity = breached ? "HIGH" : "MEDIUM";
      } else if (sftKey === "SFT-007" || sftKey === "SFT-017") {
        severity = "HIGH"; // Capital gains audit
      }

      let targetSchedule = "Schedule OS";
      if (sftKey === "SFT-007" || sftKey === "SFT-017" || sftKey === "SFT-006") targetSchedule = "Schedule CG";
      else if (sftKey === "SFT-001" || sftKey === "SFT-002") targetSchedule = "Schedule BP & Cash Book";
      else if (sftKey === "SFT-010") targetSchedule = "Schedule CG & 50C Register";
      else if (sftKey === "SFT-009") targetSchedule = "Schedule TCS (Foreign Remittance)";

      return {
        id: item.id,
        pan: item.pan,
        sftCode: sftKey,
        nature: config.nature,
        reportingEntity: item.reportingEntity,
        reportedAmount: item.reportedAmount,
        taxDeducted: item.taxDeductedOrCollected,
        thresholdBreached: breached,
        thresholdLimitInr: config.thresholdInr,
        statutoryRuleCitation: config.statutoryRule,
        scrutinyRiskSection: config.primaryRiskSection,
        riskSeverity: severity,
        auditActionRecommendation: breached 
          ? `THRESHOLD BREACH: Reported INR ${item.reportedAmount.toLocaleString('en-IN')} exceeds Rule 114E threshold of INR ${config.thresholdInr.toLocaleString('en-IN')}. ${config.highScrutinyPenaltyDescription}`
          : `Monitored under ${config.statutoryRule}. Ensure proper reconciliation in ${targetSchedule}.`,
        targetItrSchedule: targetSchedule
      };
    }

    // Default for non-SFT (TDS/TCS items)
    let nonSftSchedule = "Schedule TDS-2";
    let nonSftNature = item.sourceDescription || "Tax Deduction at Source";
    if (rawCode.includes("194A")) {
      nonSftSchedule = "Schedule OS & 80TTA";
      nonSftNature = "Interest other than interest on securities (Sec 194A)";
    } else if (rawCode.includes("194J")) {
      nonSftSchedule = "Schedule TDS-2 / BP";
      nonSftNature = "Fees for Professional or Technical Services (Sec 194J)";
    } else if (rawCode.includes("194Q")) {
      nonSftSchedule = "Schedule TDS-3";
      nonSftNature = "TDS on Purchase of Goods (Sec 194Q)";
    } else if (rawCode.includes("206C")) {
      nonSftSchedule = "Schedule TCS";
      nonSftNature = "Tax Collected at Source (Sec 206C)";
    }

    return {
      id: item.id,
      pan: item.pan,
      nature: nonSftNature,
      reportingEntity: item.reportingEntity,
      reportedAmount: item.reportedAmount,
      taxDeducted: item.taxDeductedOrCollected,
      thresholdBreached: false,
      thresholdLimitInr: 0,
      statutoryRuleCitation: "Section 192-206C / Part A & B of 26AS",
      scrutinyRiskSection: "Prepaid Taxes & Gross Receipts Reconciliation",
      riskSeverity: "LOW",
      auditActionRecommendation: "Cross-check TDS credit in 26AS ledger and verify receipt in books.",
      targetItrSchedule: nonSftSchedule
    };
  }
}
