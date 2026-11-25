/**
 * GSTR-9 & 9C Annual Reconciliation & Form GST DRC-03 Engine
 *
 * Statutory Authority:
 * - Section 44 of CGST Act read with Rule 80 of CGST Rules
 * - Official GSTR-9 Table 8A - [8B (6B+6H) + 8C] = 8D reconciliation
 * - GSTR-9C Table 5 (Audited Financial Turnover vs GSTR-9 Turnover)
 * - Section 73(5) / Rule 88B voluntary payment via DRC-03 with exact day-count Sec 50(1) interest
 */

export interface Gstr9Table8aReconciliation {
  financialYear: string;
  table8aGstr2bItc: number;
  table6bAnd6hItc3b: number; // Table 8B = Sum of 6(B) + 6(H)
  table8cItcClaimedNextFy: number; // Availed in Apr-Nov of next FY
  table8dVariance: number; // 8A - (8B + 8C)
  table8eAvailableNotAvailed: number;
  table8fIneligible17_5: number;
  table8dStatus: "EXCESS_CLAIMED" | "UNAVAILED_OR_INELIGIBLE" | "RECONCILED";
  suggestedAction: string;
}

export interface Gstr9cTurnoverReconciliation {
  financialYear: string;
  auditedTurnoverPnl: number;
  unbilledRevenueOpening: number;
  unbilledRevenueClosing: number;
  advancesReceivedTaxable: number;
  tradeDiscountsCreditNotes: number;
  exemptSuppliesNilRated: number;
  adjustedTurnover: number;
  annualTurnoverGstr9: number;
  unreconciledTurnoverVariance: number;
  reasonForVariance: string[];
}

export interface Gstr9cRateWiseRow {
  rateLabel: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface Gstr9cItcBooksReco {
  itcPerAuditedFinancials: number;
  itcAvailedInSubsequentFy: number;
  itcClaimedInGstr9: number;
  unreconciledItcDiff: number;
}

export interface Gstr9CompiledData {
  monthsCompiled: number;
  outwardTaxableSupplies: number;
  outwardZeroRatedExports: number;
  outwardExemptNil: number;
  outwardTaxPayable: { igst: number; cgst: number; sgst: number; cess: number };
  table6bInputsItc: number;
  table6hReclaimedItc: number;
  table7ReversalsRule42_43: number;
  table7ReversalsSec17_5: number;
  table8aGstr2bItc: number;
  table9TaxPaidCash: number;
  table9TaxPaidItc: number;
  rateWiseTable9C: Gstr9cRateWiseRow[];
}

export interface Drc03VoluntaryPaymentChallan {
  challanDraftId: string;
  causeOfPayment: "GSTR_9_RECONCILIATION" | "SECTION_73_5_VOLUNTARY" | "RULE_88C_DISCREPANCY" | "RULE_88D_DISCREPANCY";
  taxPeriod: string;
  financialYear: string;
  igstLiability: number;
  cgstLiability: number;
  sgstLiability: number;
  cessLiability: number;
  totalTaxLiability: number;
  daysDelay: number;
  interestSec50: number;
  penaltyApplicable: number;
  totalPaymentAmount: number;
  paymentMode: "CASH_LEDGER" | "CREDIT_LEDGER";
  statutoryDeclaration: string;
}

export class Gstr9AnnualRecoEngine {
  /**
   * Official GSTR-9 Table 8A-8F Reconciliation:
   * Table 8D = 8A - (8B + 8C), where 8B = 6B + 6H.
   */
  public static reconcileTable8A(params: {
    financialYear: string;
    table8aGstr2bItc: number;
    table6bAnd6hItc3b: number;
    table8cItcClaimedNextFy: number;
    table8eAvailableNotAvailed?: number;
    table8fIneligible17_5?: number;
  }): Gstr9Table8aReconciliation {
    const t8a = Math.round((params.table8aGstr2bItc || 0) * 100) / 100;
    const t8b = Math.round((params.table6bAnd6hItc3b || 0) * 100) / 100;
    const t8c = Math.round((params.table8cItcClaimedNextFy || 0) * 100) / 100;
    const t8e = Math.round((params.table8eAvailableNotAvailed || 0) * 100) / 100;
    const t8f = Math.round((params.table8fIneligible17_5 || 0) * 100) / 100;

    const variance = Math.round((t8a - (t8b + t8c)) * 100) / 100;

    let status: Gstr9Table8aReconciliation["table8dStatus"] = "RECONCILED";
    let action = "Table 8A matches ITC availed in 3B (6B+6H) and next-FY claims (8C).";

    if (variance < -5) {
      status = "EXCESS_CLAIMED";
      action = `Negative Table 8D (₹${Math.abs(variance).toLocaleString("en-IN")}): Excess ITC claimed in GSTR-3B over GSTR-2B. Reconcile imports/ISD/carry-forward or discharge via DRC-03.`;
    } else if (variance > 5) {
      const unexplained = Math.round((variance - t8e - t8f) * 100) / 100;
      status = "UNAVAILED_OR_INELIGIBLE";
      action =
        Math.abs(unexplained) <= 5
          ? `Table 8D (₹${variance.toLocaleString("en-IN")}) fully accounted in Table 8E (Unavailed) + 8F (Ineligible 17(5)).`
          : `Table 8D (₹${variance.toLocaleString("en-IN")}): Classify ₹${unexplained.toLocaleString("en-IN")} between Table 8E (Lapsed/Unavailed) and Table 8F (Ineligible u/s 17(5)).`;
    }

    return {
      financialYear: params.financialYear,
      table8aGstr2bItc: t8a,
      table6bAnd6hItc3b: t8b,
      table8cItcClaimedNextFy: t8c,
      table8dVariance: variance,
      table8eAvailableNotAvailed: t8e,
      table8fIneligible17_5: t8f,
      table8dStatus: status,
      suggestedAction: action,
    };
  }

  public static reconcileGstr9cTurnover(params: {
    financialYear: string;
    auditedTurnoverPnl: number;
    unbilledRevenueOpening: number;
    unbilledRevenueClosing: number;
    advancesReceivedTaxable: number;
    tradeDiscountsCreditNotes: number;
    exemptSuppliesNilRated: number;
    annualTurnoverGstr9: number;
  }): Gstr9cTurnoverReconciliation {
    const adjusted = Math.round(
      (params.auditedTurnoverPnl -
        params.unbilledRevenueClosing +
        params.unbilledRevenueOpening +
        params.advancesReceivedTaxable -
        params.tradeDiscountsCreditNotes) *
        100
    ) / 100;
    const variance = Math.round((adjusted - params.annualTurnoverGstr9) * 100) / 100;

    const reasons: string[] = [];
    if (params.advancesReceivedTaxable > 0) {
      reasons.push(`Taxable advances of ₹${params.advancesReceivedTaxable.toLocaleString("en-IN")} added.`);
    }
    if (params.tradeDiscountsCreditNotes > 0) {
      reasons.push(`Sec 15(3)(b) trade discounts of ₹${params.tradeDiscountsCreditNotes.toLocaleString("en-IN")} reduced.`);
    }
    if (Math.abs(variance) > 5) {
      reasons.push(`Unreconciled variance of ₹${variance.toLocaleString("en-IN")} to be disclosed in GSTR-9C Part B.`);
    } else if (adjusted > 0 || params.annualTurnoverGstr9 > 0) {
      reasons.push("Audited P&L turnover reconciled with GSTR-9 within ₹5 rounding tolerance.");
    }

    return {
      financialYear: params.financialYear,
      auditedTurnoverPnl: params.auditedTurnoverPnl,
      unbilledRevenueOpening: params.unbilledRevenueOpening,
      unbilledRevenueClosing: params.unbilledRevenueClosing,
      advancesReceivedTaxable: params.advancesReceivedTaxable,
      tradeDiscountsCreditNotes: params.tradeDiscountsCreditNotes,
      exemptSuppliesNilRated: params.exemptSuppliesNilRated,
      adjustedTurnover: adjusted,
      annualTurnoverGstr9: params.annualTurnoverGstr9,
      unreconciledTurnoverVariance: variance,
      reasonForVariance: reasons,
    };
  }

  public static generateDrc03Challan(params: {
    financialYear: string;
    taxPeriod: string;
    cause: Drc03VoluntaryPaymentChallan["causeOfPayment"];
    igst: number;
    cgst: number;
    sgst: number;
    cess?: number;
    daysDelay: number;
    paymentMode?: "CASH_LEDGER" | "CREDIT_LEDGER";
  }): Drc03VoluntaryPaymentChallan {
    const cess = params.cess || 0;
    const totalTax = Math.round((params.igst + params.cgst + params.sgst + cess) * 100) / 100;
    const days = Math.max(0, Math.round(params.daysDelay || 0));
    const interest = Math.round((totalTax * 0.18 * (days / 365)) * 100) / 100;

    return {
      challanDraftId: `DRC03-${Date.now()}`,
      causeOfPayment: params.cause,
      taxPeriod: params.taxPeriod,
      financialYear: params.financialYear,
      igstLiability: params.igst,
      cgstLiability: params.cgst,
      sgstLiability: params.sgst,
      cessLiability: cess,
      totalTaxLiability: totalTax,
      daysDelay: days,
      interestSec50: interest,
      penaltyApplicable: 0,
      totalPaymentAmount: Math.round((totalTax + interest) * 100) / 100,
      paymentMode: params.paymentMode || "CASH_LEDGER",
      statutoryDeclaration:
        "Voluntary discharge of tax liability u/s 73(5) of CGST Act, 2017 with interest u/s 50(1) read with Rule 88B.",
    };
  }
}
