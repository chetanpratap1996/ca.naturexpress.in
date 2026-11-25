/**
 * GST IMS (Invoice Management System) & Rule 37 / 37A Reversal Engine
 *
 * Statutory Authority:
 * - GSTN IMS Advisory (Accept / Reject / Pending / Deemed Accepted on 14th cutoff)
 * - Section 16(2)(c) & Rule 37A (ITC reversal where supplier GSTR-3B unfiled past 30th Nov)
 * - Second Proviso to Section 16(2) & Rule 37 (ITC reversal if supplier unpaid > 180 days)
 */

import { getRule37aDeadlineForFy } from "@/lib/gst/gstClientFetch";

export type ImsActionType = "ACCEPT" | "REJECT" | "PENDING" | "NO_ACTION";
export type InvoiceType = "B2B" | "B2BA" | "CDNR" | "CDNRA" | "ISD" | "ISDA";

export interface ImsInvoiceItem {
  id: string;
  supplierGstin: string;
  supplierTradeName: string;
  invoiceNumber: string;
  originalInvoiceNumber?: string;
  invoiceType: InvoiceType;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  posStateCode: string;
  itcEligibility: "ELIGIBLE" | "INELIGIBLE_17_5" | "POS_MISMATCH";

  matchingStatus: "EXACT_MATCH" | "VALUE_MISMATCH" | "NOT_IN_BOOKS" | "DUPLICATE_IN_PORTAL";
  bookInvoiceNumber?: string;
  bookTaxableValue?: number;
  bookTotalTax?: number;
  varianceAmount?: number;

  currentAction: ImsActionType;
  recommendedAction: ImsActionType;
  recommendationReason: string;
  actionTimestamp?: string;
  actionBy?: string;
}

export interface Rule37ARecord {
  id: string;
  ruleType?: "RULE_37A" | "RULE_37_180D";
  supplierGstin: string;
  supplierName: string;
  invoiceNumber: string;
  financialYear: string;
  invoiceDate: string;
  itcClaimedAmount: number;
  supplierGstr1FiledDate: string;
  supplierGstr3bStatus: "FILED" | "NOT_FILED";
  reversalDeadline: string; // 30th November of subsequent FY (or 180 days from invoice)
  reversalStatus: "PENDING_REVERSAL" | "REVERSED_TABLE_4B2" | "RE_CLAIMED_TABLE_4A5";
  reversalDate?: string;
  reClaimDate?: string;
  interestExposure: number;
  vendorNotified: boolean;
  vendorLastReminderDate?: string;
}

export interface ImsSummaryStats {
  totalInvoices: number;
  acceptedCount: number;
  acceptedItc: number;
  rejectedCount: number;
  rejectedItc: number;
  pendingCount: number;
  pendingItc: number;
  noActionCount: number;
  noActionItc: number;
  deemed2bItc: number; // Accepted + No Action (Deemed Accepted)
  rule37aAtRiskCount: number;
  rule37aAtRiskAmount: number;
}

export class GstImsEngine {
  /**
   * Returns allowed GSTN IMS actions and advisory note per document type.
   */
  public static getActionConstraint(invoiceType: InvoiceType): {
    allowPending: boolean;
    warning?: string;
  } {
    if (invoiceType === "ISD" || invoiceType === "ISDA") {
      return {
        allowPending: false,
        warning: "ISD credits cannot be kept Pending in IMS (Accept or Reject only).",
      };
    }
    if (invoiceType === "CDNR") {
      return {
        allowPending: false,
        warning: "Original Credit Notes cannot be kept Pending if ITC was already claimed; Reject increases supplier liability.",
      };
    }
    return { allowPending: true };
  }

  public static evaluateRecommendation(inv: Partial<ImsInvoiceItem>): {
    action: ImsActionType;
    reason: string;
  } {
    if (inv.matchingStatus === "EXACT_MATCH" && inv.itcEligibility === "ELIGIBLE") {
      return {
        action: "ACCEPT",
        reason: "Exact match with Purchase Register. Safe to accept into GSTR-2B.",
      };
    }
    if (inv.matchingStatus === "NOT_IN_BOOKS") {
      const constraint = this.getActionConstraint((inv.invoiceType as InvoiceType) || "B2B");
      if (!constraint.allowPending) {
        return {
          action: "REJECT",
          reason: `Not in Books and ${inv.invoiceType} cannot be kept Pending under GSTN IMS rules.`,
        };
      }
      return {
        action: "PENDING",
        reason: "Not in Purchase Register. Keep Pending to defer ITC until receipt/verification.",
      };
    }
    if (inv.matchingStatus === "VALUE_MISMATCH" && Math.abs(inv.varianceAmount || 0) > 5) {
      return {
        action: "REJECT",
        reason: `Variance of ₹${Math.abs(inv.varianceAmount || 0).toFixed(2)} exceeds tolerance. Reject for supplier amendment.`,
      };
    }
    if (inv.itcEligibility === "INELIGIBLE_17_5") {
      return {
        action: "ACCEPT",
        reason: "Valid invoice blocked u/s 17(5). Accept in IMS and reverse in GSTR-3B Table 4(B)(1).",
      };
    }
    return {
      action: "NO_ACTION",
      reason: "Review before 14th cutoff; No Action is Deemed Accepted by GSTN.",
    };
  }

  public static evaluateRule37A(
    records: Rule37ARecord[],
    currentDate: string = new Date().toISOString().split("T")[0]
  ): Rule37ARecord[] {
    const curr = new Date(currentDate);

    return records.map((rec) => {
      const computedDeadline =
        rec.reversalDeadline ||
        (rec.ruleType === "RULE_37_180D" && rec.invoiceDate
          ? new Date(new Date(rec.invoiceDate).getTime() + 180 * 86400000).toISOString().split("T")[0]
          : getRule37aDeadlineForFy(rec.financialYear));

      const deadline = new Date(computedDeadline);
      let interest = 0;

      const isActiveDefault =
        rec.ruleType === "RULE_37_180D"
          ? rec.reversalStatus === "PENDING_REVERSAL"
          : rec.supplierGstr3bStatus === "NOT_FILED" && rec.reversalStatus === "PENDING_REVERSAL";

      if (isActiveDefault && !isNaN(deadline.getTime()) && curr > deadline) {
        const daysLate = Math.floor((curr.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        interest = Math.round((rec.itcClaimedAmount * 0.18 * daysLate) / 365);
      }

      return {
        ...rec,
        reversalDeadline: computedDeadline,
        interestExposure: interest,
      };
    });
  }

  public static computeSummary(
    invoices: ImsInvoiceItem[],
    rule37aRecords: Rule37ARecord[]
  ): ImsSummaryStats {
    let acceptedItc = 0;
    let rejectedItc = 0;
    let pendingItc = 0;
    let noActionItc = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;
    let noActionCount = 0;

    for (const inv of invoices) {
      const sign = inv.invoiceType === "CDNR" ? -1 : 1;
      const amt = inv.totalTax * sign;
      if (inv.currentAction === "ACCEPT") {
        acceptedCount++;
        acceptedItc += amt;
      } else if (inv.currentAction === "REJECT") {
        rejectedCount++;
        rejectedItc += amt;
      } else if (inv.currentAction === "PENDING") {
        pendingCount++;
        pendingItc += amt;
      } else {
        noActionCount++;
        noActionItc += amt;
      }
    }

    const atRisk = rule37aRecords.filter(
      (r) => r.reversalStatus === "PENDING_REVERSAL" && (r.supplierGstr3bStatus === "NOT_FILED" || r.ruleType === "RULE_37_180D")
    );
    const atRiskAmount = atRisk.reduce((sum, r) => sum + r.itcClaimedAmount, 0);

    return {
      totalInvoices: invoices.length,
      acceptedCount,
      acceptedItc: Math.round(acceptedItc * 100) / 100,
      rejectedCount,
      rejectedItc: Math.round(rejectedItc * 100) / 100,
      pendingCount,
      pendingItc: Math.round(pendingItc * 100) / 100,
      noActionCount,
      noActionItc: Math.round(noActionItc * 100) / 100,
      deemed2bItc: Math.round((acceptedItc + noActionItc) * 100) / 100,
      rule37aAtRiskCount: atRisk.length,
      rule37aAtRiskAmount: Math.round(atRiskAmount * 100) / 100,
    };
  }

  /**
   * Parses GSTN IMS JSON export (supports b2b, b2ba, cdnr, cdnra, or normalized array).
   */
  public static parseImsJson(rawText: string): ImsInvoiceItem[] {
    const parsed = JSON.parse(rawText);
    const items: ImsInvoiceItem[] = [];
    const root = parsed?.data || parsed;

    const pushItem = (raw: any, docType: InvoiceType, idx: number, ctin?: string, trdnm?: string) => {
      const igst = Number(raw.igst ?? raw.iamt ?? 0);
      const cgst = Number(raw.cgst ?? raw.camt ?? 0);
      const sgst = Number(raw.sgst ?? raw.samt ?? 0);
      const cess = Number(raw.cess ?? raw.csamt ?? 0);
      const totalTax = Math.round((igst + cgst + sgst + cess) * 100) / 100;
      const actionMap: Record<string, ImsActionType> = {
        A: "ACCEPT",
        ACCEPT: "ACCEPT",
        R: "REJECT",
        REJECT: "REJECT",
        P: "PENDING",
        PENDING: "PENDING",
        N: "NO_ACTION",
        NO_ACTION: "NO_ACTION",
      };
      const curAction = actionMap[String(raw.action || raw.ims_action || "N").toUpperCase()] || "NO_ACTION";
      const rec = this.evaluateRecommendation({
        invoiceType: docType,
        matchingStatus: raw.matchingStatus || "NOT_IN_BOOKS",
        itcEligibility: raw.itcEligibility || "ELIGIBLE",
        varianceAmount: raw.varianceAmount || 0,
      });

      items.push({
        id: raw.id || `IMS-${docType}-${idx}`,
        supplierGstin: (raw.supplierGstin || raw.ctin || ctin || "").toUpperCase(),
        supplierTradeName: raw.supplierTradeName || raw.trdnm || trdnm || ctin || "Supplier",
        invoiceNumber: String(raw.invoiceNumber || raw.inum || raw.ntnum || `INV-${idx}`),
        invoiceType: docType,
        invoiceDate: raw.invoiceDate || raw.dt || "",
        taxableValue: Number(raw.taxableValue ?? raw.txval ?? 0),
        igst,
        cgst,
        sgst,
        cess,
        totalTax,
        posStateCode: String(raw.posStateCode || raw.pos || ""),
        itcEligibility: raw.itcEligibility || "ELIGIBLE",
        matchingStatus: raw.matchingStatus || "NOT_IN_BOOKS",
        bookTaxableValue: raw.bookTaxableValue,
        bookTotalTax: raw.bookTotalTax,
        varianceAmount: raw.varianceAmount,
        currentAction: curAction,
        recommendedAction: rec.action,
        recommendationReason: rec.reason,
      });
    };

    if (Array.isArray(root)) {
      root.forEach((r, idx) => pushItem(r, r.invoiceType || "B2B", idx + 1));
      return items;
    }

    let idx = 1;
    const sections: Array<[string, InvoiceType]> = [
      ["b2b", "B2B"],
      ["b2ba", "B2BA"],
      ["cdnr", "CDNR"],
      ["cdnra", "CDNRA"],
      ["isd", "ISD"],
    ];
    for (const [key, docType] of sections) {
      const list = root[key];
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        if (Array.isArray(entry.inv)) {
          for (const inv of entry.inv) pushItem(inv, docType, idx++, entry.ctin, entry.trdnm);
        } else if (Array.isArray(entry.nt)) {
          for (const nt of entry.nt) pushItem(nt, docType, idx++, entry.ctin, entry.trdnm);
        } else {
          pushItem(entry, docType, idx++, entry.ctin, entry.trdnm);
        }
      }
    }
    return items;
  }

  /**
   * Generates GSTN IMS Action Upload JSON payload.
   */
  public static buildGstnActionUploadPayload(
    gstin: string,
    returnPeriod: string,
    invoices: ImsInvoiceItem[]
  ) {
    const codeMap: Record<ImsActionType, string> = {
      ACCEPT: "A",
      REJECT: "R",
      PENDING: "P",
      NO_ACTION: "N",
    };

    const grouped: Record<string, any[]> = { b2b: [], b2ba: [], cdnr: [], cdnra: [], isd: [] };
    for (const inv of invoices) {
      const key = inv.invoiceType.toLowerCase();
      const bucket = grouped[key] || grouped.b2b;
      bucket.push({
        ctin: inv.supplierGstin,
        inum: inv.invoiceNumber,
        idt: inv.invoiceDate,
        txval: inv.taxableValue,
        iamt: inv.igst,
        camt: inv.cgst,
        samt: inv.sgst,
        csamt: inv.cess,
        action: codeMap[inv.currentAction],
      });
    }

    return {
      gstin,
      rtnprd: returnPeriod,
      generatedAt: new Date().toISOString(),
      imsActions: grouped,
    };
  }
}
