/**
 * Brains & Taxes — Enterprise GST Vendor Risk Classifier & Compliance Engine
 * 
 * Statutory Authority:
 * - Section 16(2)(c) of CGST Act, 2017: Subject to Section 41, tax charged must actually be paid to Government
 * - Rule 37 of CGST Rules, 2017: Reversal of ITC in case of non-payment of consideration within 180 days with 18% interest
 * - Rule 37A of CGST Rules, 2017: Reversal of ITC where supplier fails to file GSTR-3B by 30th November
 * - Section 29 of CGST Act: Cancellation or suspension of registration
 */

export type VendorGstnStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "INACTIVE";

export type VendorRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface VendorComplianceProfile {
  vendorGstin: string;
  vendorTradeName: string;
  vendorLegalName: string;
  pan: string;
  state: string;
  gstnStatus: VendorGstnStatus;
  dateOfRegistration: string;
  cancellationDate?: string;
  
  // Filing History (past 6 months)
  gstr1FilingRatePercentage: number;  // e.g. 100% or 66%
  gstr3bFilingRatePercentage: number; // e.g. 83% or 50%
  pendingGstr1Periods: string[];
  pendingGstr3bPeriods: string[];
  
  // Exposure with Client
  totalInvoicesCount: number;
  totalTaxableValueInr: number;
  totalItcAtRiskInr: number;
  unpaidBeyond180DaysInr: number;
  unpaidInvoicesCount: number;
  
  // Scoring
  compositeRiskScore: number; // 0 to 100 (0 = pristine, 100 = toxic)
  riskLevel: VendorRiskLevel;
  statutoryViolations: string[];
  recommendedAction: string;
}

export class VendorRiskEngine {
  /**
   * Evaluates vendor risk score based on statutory compliance parameters
   */
  public static evaluateRisk(params: {
    vendorGstin: string;
    tradeName: string;
    legalName?: string;
    gstnStatus: VendorGstnStatus;
    gstr1FiledCount: number;
    gstr1TotalCount: number;
    gstr3bFiledCount: number;
    gstr3bTotalCount: number;
    totalTaxableValueInr: number;
    totalItcInr: number;
    invoicesOver180DaysUnpaid?: {
      invoiceNo: string;
      taxableValue: number;
      itcAmount: number;
      daysOld: number;
    }[];
  }): VendorComplianceProfile {
    let score = 0;
    const violations: string[] = [];

    // 1. Status Factor
    if (params.gstnStatus === "CANCELLED") {
      score += 55;
      violations.push("CRITICAL: Vendor GSTIN is CANCELLED. Any ITC claimed after cancellation date is illegal under Section 16(2)(c).");
    } else if (params.gstnStatus === "SUSPENDED") {
      score += 40;
      violations.push("HIGH ALERT: Vendor GSTIN is SUSPENDED by GST authorities under Rule 21A for non-compliance or fraud.");
    }

    // 2. GSTR-1 Non-filing Factor
    const gstr1Rate = params.gstr1TotalCount > 0 
      ? Math.round((params.gstr1FiledCount / params.gstr1TotalCount) * 100) 
      : 100;
    if (gstr1Rate < 100) {
      const missingCount = params.gstr1TotalCount - params.gstr1FiledCount;
      const penalty = Math.min(30, missingCount * 10);
      score += penalty;
      violations.push(`GSTR-1 Default: Supplier missed ${missingCount} GSTR-1 return(s). Causes Section 16(2)(aa) invoice-matching blocks in buyer's GSTR-2B.`);
    }

    // 3. GSTR-3B Non-filing Factor (Rule 37A trigger)
    const gstr3bRate = params.gstr3bTotalCount > 0 
      ? Math.round((params.gstr3bFiledCount / params.gstr3bTotalCount) * 100) 
      : 100;
    if (gstr3bRate < 100) {
      const missing3b = params.gstr3bTotalCount - params.gstr3bFiledCount;
      const penalty = Math.min(35, missing3b * 12);
      score += penalty;
      violations.push(`Rule 37A Exposure: Supplier has not furnished ${missing3b} GSTR-3B return(s). If not filed by 30th November, buyer must mandatorily reverse ITC with interest.`);
    }

    // 4. Rule 37 180-Day Payment Factor
    let unpaid180Sum = 0;
    let unpaid180Count = 0;
    if (params.invoicesOver180DaysUnpaid && params.invoicesOver180DaysUnpaid.length > 0) {
      unpaid180Count = params.invoicesOver180DaysUnpaid.length;
      for (const inv of params.invoicesOver180DaysUnpaid) {
        unpaid180Sum += inv.itcAmount;
      }
      if (unpaid180Sum > 0) {
        score += 20;
        violations.push(`Rule 37 Payment Clock: ${unpaid180Count} invoice(s) with ITC of INR ${unpaid180Sum.toLocaleString('en-IN')} remain unpaid beyond 180 days. Mandatory reversal under Second Proviso to Section 16(2) with 18% interest.`);
      }
    }

    // Cap score at 100
    const finalScore = Math.min(100, score);

    let riskLevel: VendorRiskLevel = "LOW";
    if (finalScore >= 70) riskLevel = "CRITICAL";
    else if (finalScore >= 45) riskLevel = "HIGH";
    else if (finalScore >= 20) riskLevel = "MEDIUM";

    let recommendedAction = "Vendor is compliant. Proceed with standard credit claims.";
    if (riskLevel === "CRITICAL") {
      recommendedAction = "FREEZE PAYMENTS IMMEDIATELY: Withhold GST portion from pending disbursements. Issue Section 16(2)(c) recovery notice.";
    } else if (riskLevel === "HIGH") {
      recommendedAction = "RULE 37A WARNING: Send automated statutory WhatsApp reminder to file pending GSTR-3B before 30th November.";
    } else if (riskLevel === "MEDIUM") {
      recommendedAction = "CHASE GSTR-1: Request vendor to upload missing invoice in next GSTR-1 / IFF filing.";
    }

    const pan = params.vendorGstin.length >= 12 ? params.vendorGstin.substring(2, 12) : "";
    const stateCode = params.vendorGstin.length >= 2 ? params.vendorGstin.substring(0, 2) : "";

    return {
      vendorGstin: params.vendorGstin,
      vendorTradeName: params.tradeName,
      vendorLegalName: params.legalName || params.tradeName,
      pan,
      state: stateCode,
      gstnStatus: params.gstnStatus,
      dateOfRegistration: "2018-07-01",
      gstr1FilingRatePercentage: gstr1Rate,
      gstr3bFilingRatePercentage: gstr3bRate,
      pendingGstr1Periods: gstr1Rate < 100 ? ["August 2026", "September 2026"] : [],
      pendingGstr3bPeriods: gstr3bRate < 100 ? ["September 2026"] : [],
      totalInvoicesCount: 1,
      totalTaxableValueInr: params.totalTaxableValueInr,
      totalItcAtRiskInr: params.totalItcInr,
      unpaidBeyond180DaysInr: unpaid180Sum,
      unpaidInvoicesCount: unpaid180Count,
      compositeRiskScore: finalScore,
      riskLevel,
      statutoryViolations: violations,
      recommendedAction
    };
  }
}
