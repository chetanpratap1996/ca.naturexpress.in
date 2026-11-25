/**
 * GST Vendor Risk Classifier & Compliance Engine
 *
 * Evaluates vendor compliance strictly from observed reconciliation records,
 * verified GSTN filing history (when fetched), and Purchase Register payment ageing.
 */

export type VendorGstnStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "INACTIVE" | "UNVERIFIED";

export type VendorRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface VendorComplianceProfile {
  vendorGstin: string;
  vendorTradeName: string;
  vendorLegalName: string;
  pan: string;
  state: string;
  gstnStatus: VendorGstnStatus;
  verifiedViaGstn: boolean;
  dateOfRegistration?: string;
  cancellationDate?: string;

  gstr1FilingRatePercentage: number | null;
  gstr3bFilingRatePercentage: number | null;

  totalInvoicesCount: number;
  totalTaxableValueInr: number;
  totalItcAtRiskInr: number;
  unpaidBeyond180DaysInr: number;
  unpaidInvoicesCount: number;

  compositeRiskScore: number;
  riskLevel: VendorRiskLevel;
  statutoryViolations: string[];
  recommendedAction: string;
}

export class VendorRiskEngine {
  public static evaluateRisk(params: {
    vendorGstin: string;
    tradeName: string;
    legalName?: string;
    gstnStatus: VendorGstnStatus;
    verifiedViaGstn?: boolean;
    dateOfRegistration?: string;
    cancellationDate?: string;
    totalInvoicesCount: number;
    gstr1FiledCount?: number;
    gstr1TotalCount?: number;
    gstr3bFiledCount?: number;
    gstr3bTotalCount?: number;
    missingIn2bCount?: number;
    unfiled3bIn2bCount?: number;
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

    if (params.gstnStatus === "CANCELLED") {
      score += 55;
      violations.push("Vendor GSTIN is CANCELLED. ITC claimed post-cancellation is invalid u/s 16(2)(c).");
    } else if (params.gstnStatus === "SUSPENDED") {
      score += 40;
      violations.push("Vendor GSTIN is SUSPENDED under Rule 21A.");
    }

    const gstr1Rate =
      params.gstr1TotalCount && params.gstr1TotalCount > 0 && params.gstr1FiledCount !== undefined
        ? Math.round((params.gstr1FiledCount / params.gstr1TotalCount) * 100)
        : null;

    const gstr3bRate =
      params.gstr3bTotalCount && params.gstr3bTotalCount > 0 && params.gstr3bFiledCount !== undefined
        ? Math.round((params.gstr3bFiledCount / params.gstr3bTotalCount) * 100)
        : null;

    if ((params.missingIn2bCount || 0) > 0) {
      score += Math.min(30, (params.missingIn2bCount || 0) * 15);
      violations.push(
        `Sec 16(2)(aa): ${params.missingIn2bCount} invoice(s) booked in Purchase Register are missing in GSTR-2B.`
      );
    }

    if (gstr1Rate !== null && gstr1Rate < 100) {
      score += Math.min(20, Math.round((100 - gstr1Rate) * 0.4));
      violations.push(`Verified GSTN GSTR-1 filing rate: ${gstr1Rate}%.`);
    }

    if ((params.unfiled3bIn2bCount || 0) > 0) {
      score += Math.min(35, (params.unfiled3bIn2bCount || 0) * 18);
      violations.push(
        `Rule 37A: ${params.unfiled3bIn2bCount} invoice(s) reflect supplier GSTR-3B as unfiled.`
      );
    }

    if (gstr3bRate !== null && gstr3bRate < 100) {
      score += Math.min(25, Math.round((100 - gstr3bRate) * 0.4));
      violations.push(`Verified GSTN GSTR-3B filing rate: ${gstr3bRate}%.`);
    }

    let unpaid180Sum = 0;
    let unpaid180Count = 0;
    if (params.invoicesOver180DaysUnpaid && params.invoicesOver180DaysUnpaid.length > 0) {
      unpaid180Count = params.invoicesOver180DaysUnpaid.length;
      for (const inv of params.invoicesOver180DaysUnpaid) {
        unpaid180Sum += inv.itcAmount;
      }
      if (unpaid180Sum > 0) {
        score += 20;
        violations.push(
          `Rule 37: ${unpaid180Count} invoice(s) (ITC ₹${unpaid180Sum.toLocaleString("en-IN")}) unpaid > 180 days.`
        );
      }
    }

    const finalScore = Math.min(100, score);
    let riskLevel: VendorRiskLevel = "LOW";
    if (finalScore >= 70) riskLevel = "CRITICAL";
    else if (finalScore >= 45) riskLevel = "HIGH";
    else if (finalScore >= 20) riskLevel = "MEDIUM";

    let recommendedAction = "Compliant in current reconciliation.";
    if (riskLevel === "CRITICAL") {
      recommendedAction = "Withhold GST payment until GSTN status & returns are regularized.";
    } else if (riskLevel === "HIGH") {
      recommendedAction = "Issue Rule 37A / Sec 16(2)(aa) vendor notice and monitor before 30 Nov.";
    } else if (riskLevel === "MEDIUM") {
      recommendedAction = "Follow up with vendor for missing GSTR-1 / value mismatch.";
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
      verifiedViaGstn: Boolean(params.verifiedViaGstn),
      dateOfRegistration: params.dateOfRegistration,
      cancellationDate: params.cancellationDate,
      gstr1FilingRatePercentage: gstr1Rate,
      gstr3bFilingRatePercentage: gstr3bRate,
      totalInvoicesCount: params.totalInvoicesCount,
      totalTaxableValueInr: params.totalTaxableValueInr,
      totalItcAtRiskInr: params.totalItcInr,
      unpaidBeyond180DaysInr: unpaid180Sum,
      unpaidInvoicesCount: unpaid180Count,
      compositeRiskScore: finalScore,
      riskLevel,
      statutoryViolations: violations,
      recommendedAction,
    };
  }
}
