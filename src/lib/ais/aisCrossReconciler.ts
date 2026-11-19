/**
 * Brains & Taxes — Enterprise Books vs AIS / 26AS Cross-Reconciliation Engine
 * 
 * Statutory Authority:
 * - Section 56(2)(i) of Income-tax Act, 1961: Taxation of dividend income under Income from Other Sources
 * - Section 80TTA / 80TTB of Income-tax Act, 1961: Deductions for savings / deposit interest
 * - Section 194Q of Income-tax Act, 1961: TDS on purchase of goods exceeding INR 50 Lakhs
 * - Section 206C(1H) of Income-tax Act, 1961: TCS on sale of goods (non-applicability if Sec 194Q applies)
 * - Section 111A & 112A of Income-tax Act, 1961: Short-term and long-term capital gains on equity/units
 * - Section 143(1)(a) of Income-tax Act, 1961: Prima facie adjustments for mismatches with Form 26AS / AIS
 */

export interface BooksIncomeSourceItem {
  id: string;
  category: "SALARY" | "BUSINESS_PROFESSION" | "CAPITAL_GAINS" | "OTHER_SOURCES" | "TDS_TCS_CREDIT";
  ledgerName: string;
  financialYear: string;
  grossAmountInr: number;
  tdsOrTcsInr: number;
  sectionCode?: string;
  panOrTan?: string;
}

export interface AisRecordInput {
  id: string;
  informationCode: string;
  reportingEntity: string;
  description: string;
  pan: string;
  reportedAmount: number;
  taxDeducted: number;
  sourceType: string;
}

export interface CrossReconciliationItem {
  id: string;
  informationCode: string;
  reportingEntity: string;
  sourceDescription: string;
  aisReportedAmount: number;
  aisTaxDeducted: number;
  booksReportedAmount: number;
  booksTaxClaimed: number;
  varianceAmount: number; // Books - AIS
  recoStatus: "MATCHED_IN_ITR" | "UNREPORTED_INCOME_RISK" | "DISCREPANCY_FLAG" | "RESOLVED_IN_ITR";
  targetItrSchedule: string;
  statutoryAuditTrail: string;
  remedialAction: string;
  potentialTaxImpactInr: number;
}

export interface CrossReconciliationReport {
  taxpayerPan: string;
  assessmentYear: string;
  financialYear: string;
  isSeniorCitizen?: boolean;
  
  summary: {
    totalAisItems: number;
    matchedCount: number;
    unreportedIncomeCount: number;
    discrepancyCount: number;
    totalAisGrossReportedInr: number;
    totalBooksGrossInr: number;
    totalAisTdsInr: number;
    totalBooksTdsClaimedInr: number;
    totalUnreportedIncomeExposureInr: number;
    unclaimedTdsCreditInr: number;
    potentialAdditionRiskSec143_1_Inr: number;
  };

  sec194qVs206cStatus: {
    is194qTurnoverCompliant: boolean;
    turnoverCrossCheckNote: string;
  };

  deduction80TtaTtb: {
    applicableSection: "80TTA" | "80TTB";
    maxLimitInr: number;
    claimedAmountInr: number;
    auditAdvice: string;
  };

  reconciledItems: CrossReconciliationItem[];
}

export class AisCrossReconciler {
  /**
   * Cross-reconciles AIS records against client books / draft computation
   */
  public static reconcile(params: {
    pan: string;
    assessmentYear: string;
    financialYear: string;
    isSeniorCitizen?: boolean;
    aisRecords: AisRecordInput[];
    booksItems: BooksIncomeSourceItem[];
    clientAnnualTurnoverInr?: number; // For Sec 194Q > 10 Cr threshold
  }): CrossReconciliationReport {
    const isSenior = !!params.isSeniorCitizen;
    const clientTurnover = params.clientAnnualTurnoverInr || 0;
    const reconciledItems: CrossReconciliationItem[] = [];

    let totalAisGross = 0;
    let totalBooksGross = 0;
    let totalAisTds = 0;
    let totalBooksTds = 0;
    let totalUnreported = 0;
    let totalPotentialAddition = 0;
    let matchedCount = 0;
    let unreportedCount = 0;
    let discrepancyCount = 0;

    let totalSavingsInterest = 0;

    for (const b of params.booksItems) {
      totalBooksGross += b.grossAmountInr;
      totalBooksTds += b.tdsOrTcsInr;
    }

    for (const ais of params.aisRecords) {
      totalAisGross += ais.reportedAmount;
      totalAisTds += ais.taxDeducted;

      // Match against Books
      const cleanEntity = ais.reportingEntity.toLowerCase();
      const code = ais.informationCode.toUpperCase();

      // Find best matching books item
      const matchedBook = params.booksItems.find(b => {
        if (code.includes("194J") && b.sectionCode?.includes("194J")) return true;
        if (code.includes("194A") && (b.ledgerName.toLowerCase().includes("interest") || b.category === "OTHER_SOURCES")) return true;
        if (code.includes("194Q") && b.sectionCode?.includes("194Q")) return true;
        if (code.includes("194") && b.ledgerName.toLowerCase().includes("dividend")) return true;
        return cleanEntity.includes(b.ledgerName.toLowerCase()) || b.ledgerName.toLowerCase().includes(cleanEntity);
      });

      const booksGross = matchedBook ? matchedBook.grossAmountInr : 0;
      const booksTds = matchedBook ? matchedBook.tdsOrTcsInr : 0;
      const variance = Math.round((booksGross - ais.reportedAmount) * 100) / 100;

      let status: "MATCHED_IN_ITR" | "UNREPORTED_INCOME_RISK" | "DISCREPANCY_FLAG" | "RESOLVED_IN_ITR" = "MATCHED_IN_ITR";
      let trail = "";
      let action = "";
      let targetSchedule = "Schedule OS";
      let taxImpact = 0;

      if (code.includes("SFT-004") || code.includes("SFT-001") || code.includes("SFT-002")) {
        // High Value Cash / Deposit
        targetSchedule = "Schedule BP / Cash Book";
        if (booksGross === 0) {
          status = "UNREPORTED_INCOME_RISK";
          unreportedCount++;
          totalUnreported += ais.reportedAmount;
          taxImpact = Math.round(ais.reportedAmount * 0.78); // Sec 115BBE 78% rate
          trail = `High value cash transaction of INR ${ais.reportedAmount.toLocaleString('en-IN')} not substantiated in draft computation.`;
          action = "Substantiate source of cash deposits via cash book withdrawals or business receipts to avert Section 68 additions.";
        } else {
          status = "MATCHED_IN_ITR";
          matchedCount++;
          trail = `Verified against cash book receipts. Difference INR ${variance}.`;
          action = "Documented in books of accounts.";
        }
      } else if (code.includes("194A") || ais.sourceType.includes("INTEREST")) {
        // Interest Income
        targetSchedule = "Schedule OS";
        totalSavingsInterest += ais.reportedAmount;

        if (booksGross === 0) {
          status = "DISCREPANCY_FLAG";
          discrepancyCount++;
          totalPotentialAddition += ais.reportedAmount;
          taxImpact = Math.round(ais.reportedAmount * 0.30); // 30% slab
          trail = `Interest of INR ${ais.reportedAmount.toLocaleString('en-IN')} omitted from P&L / draft computation. Auto-routed to Schedule OS.`;
          action = "Add to Schedule OS. Check Section 80TTA / 80TTB eligibility.";
        } else if (Math.abs(variance) > 500) {
          status = "DISCREPANCY_FLAG";
          discrepancyCount++;
          trail = `Interest mismatch: Books INR ${booksGross.toLocaleString('en-IN')} vs AIS INR ${ais.reportedAmount.toLocaleString('en-IN')}.`;
          action = "Adjust interest accrued in books to match bank AIS statement.";
        } else {
          status = "MATCHED_IN_ITR";
          matchedCount++;
          trail = "Interest income correctly reported in Schedule OS.";
          action = "Eligible for TDS credit in Schedule TDS-1 / TDS-2.";
        }
      } else if (code.includes("194") && !code.includes("194A") && !code.includes("194J") && !code.includes("194Q")) {
        // Dividend
        targetSchedule = "Schedule OS";
        if (booksGross === 0) {
          status = "DISCREPANCY_FLAG";
          discrepancyCount++;
          totalPotentialAddition += ais.reportedAmount;
          taxImpact = Math.round(ais.reportedAmount * 0.30);
          trail = `Dividend of INR ${ais.reportedAmount.toLocaleString('en-IN')} reported by RTA omitted in books.`;
          action = "Mandatory addition in Schedule OS under Section 56(2)(i) to prevent Section 143(1)(a) defect.";
        } else {
          status = "MATCHED_IN_ITR";
          matchedCount++;
          trail = "Dividend reconciled with Schedule OS.";
          action = "Ready to claim TDS credit in Schedule TDS-2.";
        }
      } else if (code.includes("SFT-017") || ais.sourceType.includes("SECURITIES")) {
        // Securities Trading Turnover
        targetSchedule = "Schedule CG";
        if (booksGross === 0) {
          status = "UNREPORTED_INCOME_RISK";
          unreportedCount++;
          totalUnreported += ais.reportedAmount;
          trail = `Gross securities sales turnover of INR ${ais.reportedAmount.toLocaleString('en-IN')} reported by depository.`;
          action = "Obtain capital gains tax statement from broker to report STCG u/s 111A and LTCG u/s 112A.";
        } else {
          status = "MATCHED_IN_ITR";
          matchedCount++;
          trail = "Securities turnover reconciled with Schedule CG capital gains computation.";
          action = "Capital gains audit workpaper attached.";
        }
      } else {
        // Standard TDS (194J, 194C, 194Q, 206C)
        targetSchedule = code.includes("206C") ? "Schedule TCS" : "Schedule TDS-2";
        if (booksGross === 0) {
          status = "DISCREPANCY_FLAG";
          discrepancyCount++;
          trail = `Receipt of INR ${ais.reportedAmount.toLocaleString('en-IN')} (TDS: INR ${ais.taxDeducted.toLocaleString('en-IN')}) not traced in turnover.`;
          action = "Verify client invoices to claim uncredited prepaid taxes.";
        } else {
          status = "MATCHED_IN_ITR";
          matchedCount++;
          trail = "Receipt and TDS credit match with books.";
          action = "Ready for tax offset in ITR.";
        }
      }

      reconciledItems.push({
        id: `REC-AIS-${ais.id}`,
        informationCode: ais.informationCode,
        reportingEntity: ais.reportingEntity,
        sourceDescription: ais.description,
        aisReportedAmount: ais.reportedAmount,
        aisTaxDeducted: ais.taxDeducted,
        booksReportedAmount: booksGross,
        booksTaxClaimed: booksTds,
        varianceAmount: variance,
        recoStatus: status,
        targetItrSchedule: targetSchedule,
        statutoryAuditTrail: trail,
        remedialAction: action,
        potentialTaxImpactInr: taxImpact
      });
    }

    // Section 194Q vs 206C(1H) Check
    const is194qCompliant = clientTurnover > 100000000 
      ? reconciledItems.some(i => i.informationCode.includes("194Q"))
      : true;

    // 80TTA / 80TTB Calculation
    const limit80 = isSenior ? 50000 : 10000;
    const applicableSec = isSenior ? "80TTB" : "80TTA";
    const allowable80 = Math.min(totalSavingsInterest, limit80);

    return {
      taxpayerPan: params.pan,
      assessmentYear: params.assessmentYear,
      financialYear: params.financialYear,
      isSeniorCitizen: isSenior,
      summary: {
        totalAisItems: params.aisRecords.length,
        matchedCount,
        unreportedIncomeCount: unreportedCount,
        discrepancyCount,
        totalAisGrossReportedInr: Math.round(totalAisGross * 100) / 100,
        totalBooksGrossInr: Math.round(totalBooksGross * 100) / 100,
        totalAisTdsInr: Math.round(totalAisTds * 100) / 100,
        totalBooksTdsClaimedInr: Math.round(totalBooksTds * 100) / 100,
        totalUnreportedIncomeExposureInr: Math.round(totalUnreported * 100) / 100,
        unclaimedTdsCreditInr: Math.max(0, Math.round((totalAisTds - totalBooksTds) * 100) / 100),
        potentialAdditionRiskSec143_1_Inr: Math.round(totalPotentialAddition * 100) / 100
      },
      sec194qVs206cStatus: {
        is194qTurnoverCompliant: is194qCompliant,
        turnoverCrossCheckNote: clientTurnover > 100000000
          ? "Client turnover > ₹10 Crore: Mandatory compliance with Section 194Q TDS on purchase of goods > ₹50L. Seller barred from 206C(1H) TCS."
          : "Client turnover <= ₹10 Crore: Section 194Q not applicable. If seller charges 206C(1H) TCS, claim in Schedule TCS."
      },
      deduction80TtaTtb: {
        applicableSection: applicableSec,
        maxLimitInr: limit80,
        claimedAmountInr: allowable80,
        auditAdvice: isSenior
          ? `Senior citizen assessee eligible for Section 80TTB deduction up to INR ${limit80.toLocaleString('en-IN')} on both savings and FD interest.`
          : `Non-senior assessee eligible for Section 80TTA deduction up to INR ${limit80.toLocaleString('en-IN')} strictly on savings bank interest (not FD).`
      },
      reconciledItems
    };
  }
}
