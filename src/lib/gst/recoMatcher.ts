/**
 * Deterministic GSTR-2B vs Books Reconciliation Engine
 *
 * Statutory Authority:
 * - Section 16(2)(aa) of CGST Act, 2017
 * - Section 16(4) of CGST Act, 2017 (30th November cutoff following end of FY)
 * - Section 17(5) & CBIC Circular 170/02/2022-GST (Table 4(A) / 4(B) reporting)
 * - Rule 37 (180-day payment) & Rule 37A (Supplier GSTR-3B non-filing)
 * - Section 170 of CGST Act, 2017 (Permissible rounding tolerance)
 */

export type RecoMatchStatus =
  | "EXACT_MATCH"
  | "FUZZY_MATCHED"
  | "ROUNDING_MATCHED"
  | "DATE_LEEWAY_MATCHED"
  | "VALUE_MISMATCH"
  | "MISSING_IN_2B"
  | "MISSING_IN_BOOKS";

export type RecoManualOverride =
  | "DEFAULT"
  | "FORCE_BLOCKED_17_5"
  | "ALLOW_EXCEPTION"
  | "HOLD_NEXT_PERIOD";

export interface Gstr2bInvoice {
  id: string;
  vendorGstin: string;
  vendorTradeName: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceType: "R" | "SEWP" | "SEWOP" | "DE" | "CRN" | "DBN" | "IMPG" | "ISD";
  placeOfSupply: string;
  reverseCharge: boolean;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess?: number;
  totalTax: number;
  totalInvoiceValue: number;
  gstr1FilingDate?: string;
  gstr1Period?: string;
  gstr3bFilingStatus?: "FILED" | "NOT_FILED" | "PENDING";
  itcAvailable: boolean;
  itcIneligibilityReason?: string;
  sectionSource?: "B2B" | "B2BA" | "CDNR" | "CDNRA" | "IMPG" | "IMPGSEZ" | "ISD" | "ISDA";
}

export interface BooksPurchaseInvoice {
  id: string;
  voucherNumber?: string;
  vendorGstin: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess?: number;
  totalTax: number;
  totalInvoiceValue: number;
  hsnCode?: string;
  itemDescription?: string;
  paymentStatus?: "PAID" | "UNPAID" | "PARTIAL";
  paymentDate?: string;
  daysOutstanding?: number;
  voucherType?: "PURCHASE" | "DEBIT_NOTE" | "CREDIT_NOTE";
  tallyVoucherGuid?: string;
}

export interface ReconciledRecord {
  id: string;
  vendorGstin: string;
  vendorName: string;
  vendorPhone?: string;
  matchStatus: RecoMatchStatus;
  confidenceScore: number;

  // 2B Data
  gstr2bId?: string;
  gstr2bInvoiceNo?: string;
  gstr2bDate?: string;
  gstr2bTaxableValue: number;
  gstr2bIgst: number;
  gstr2bCgst: number;
  gstr2bSgst: number;
  gstr2bCess: number;
  gstr2bTotalTax: number;
  gstr1FilingStatus: "FILED" | "NOT_FILED";
  gstr3bFilingStatus: "FILED" | "NOT_FILED" | "PENDING";
  itcAvailableIn2b: boolean;
  itcIneligibilityReason?: string;
  sectionSource?: string;

  // Books Data
  booksId?: string;
  booksInvoiceNo?: string;
  booksDate?: string;
  booksTaxableValue: number;
  booksIgst: number;
  booksCgst: number;
  booksSgst: number;
  booksCess: number;
  booksTotalTax: number;
  hsnCode?: string;
  itemDescription?: string;

  // Variances
  taxableVariance: number;
  taxVariance: number;

  // Statutory Flags
  isCreditNote: boolean;
  netSign: 1 | -1;
  isRcm: boolean;
  isImport: boolean;
  isIsd: boolean;
  taxHeadMismatch: boolean;
  posMismatch: boolean;
  section17_5Blocked: boolean;
  blockedCategory?: string;
  section16_4Risk: boolean;
  rule37aRisk: boolean;
  rule37_180DayRisk: boolean;
  manualOverride?: RecoManualOverride;

  statutoryAuditTrail: string;
  recommendedAction: string;
}

export interface TaxHeadTotals {
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  total: number;
}

export interface ReconciliationReport {
  taxPeriod: string;
  clientGstin: string;
  reconciliationDate: string;
  toleranceLimitInr: number;

  summary: {
    totalRecords: number;
    exactMatches: number;
    fuzzyMatches: number;
    roundingMatches: number;
    valueMismatches: number;
    missingIn2b: number;
    missingInBooks: number;

    totalBooksItc: number;
    total2bItc: number;
    matchedEligibleItc: number; // Net eligible 4(A)(5) after excluding 17(5) / held / ineligible
    ineligibleSec17_5Itc: number;
    atRiskRule37aItc: number;
    unclaimed2bItc: number;
    provisionalMissing2bItc: number;
    heldForNextPeriodItc: number;

    // CBIC Circular 170 GSTR-3B Table 4 Breakdown
    table4A1_ImportGoods: TaxHeadTotals;
    table4A3_Rcm: TaxHeadTotals;
    table4A4_Isd: TaxHeadTotals;
    table4A5_AllOtherGross: TaxHeadTotals;
    table4B1_PermanentReversal: TaxHeadTotals;
    table4B2_TemporaryReversal: TaxHeadTotals;
    netItc4C: TaxHeadTotals;
  };

  records: ReconciledRecord[];
}

function r2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

function emptyHeads(): TaxHeadTotals {
  return { igst: 0, cgst: 0, sgst: 0, cess: 0, total: 0 };
}

function addHeads(target: TaxHeadTotals, igst: number, cgst: number, sgst: number, cess: number, sign: number) {
  target.igst = r2(target.igst + igst * sign);
  target.cgst = r2(target.cgst + cgst * sign);
  target.sgst = r2(target.sgst + sgst * sign);
  target.cess = r2(target.cess + cess * sign);
  target.total = r2(target.igst + target.cgst + target.sgst + target.cess);
}

export class RecoMatcher {
  public static normalizeInvoiceNumber(raw: string): string {
    if (!raw) return "";
    let clean = raw.trim().toUpperCase();
    clean = clean.replace(/[/_-]?(20\d{2}[-_/]?\d{2,4}|\d{2}[-_/]\d{2})/gi, "");
    clean = clean.replace(/^(INV|BILL|TAX[-_]?INV|TI|GST|PB|EXP|SL|SALES|PUR|PI)[-_/.]?/i, "");
    clean = clean.replace(/[^A-Z0-9]/gi, "");
    clean = clean.replace(/^0+/, "");
    return clean || raw.trim().toUpperCase().replace(/[^A-Z0-9]/gi, "");
  }

  public static stringSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeInvoiceNumber(str1);
    const s2 = this.normalizeInvoiceNumber(str2);
    if (s1 === s2) return 1.0;
    if (s1.length < 2 || s2.length < 2) return 0.0;

    const getBigrams = (str: string) => {
      const bigrams = new Map<string, number>();
      for (let i = 0; i < str.length - 1; i++) {
        const bigram = str.substring(i, i + 2);
        bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
      }
      return bigrams;
    };

    const b1 = getBigrams(s1);
    const b2 = getBigrams(s2);
    let intersection = 0;
    b1.forEach((count, bigram) => {
      if (b2.has(bigram)) intersection += Math.min(count, b2.get(bigram)!);
    });
    return (2.0 * intersection) / (s1.length - 1 + (s2.length - 1));
  }

  private static hasTaxHeadMismatch(g: Gstr2bInvoice, b: BooksPurchaseInvoice, tol: number): boolean {
    const igstDiff = Math.abs((g.igst || 0) - (b.igst || 0));
    const cgstDiff = Math.abs((g.cgst || 0) - (b.cgst || 0));
    const sgstDiff = Math.abs((g.sgst || 0) - (b.sgst || 0));
    return igstDiff > tol || cgstDiff > tol || sgstDiff > tol;
  }

  private static hasPosMismatch(g: Gstr2bInvoice, clientGstin: string): boolean {
    if (!g.placeOfSupply || !clientGstin || clientGstin.length < 2) return false;
    const posCode = g.placeOfSupply.replace(/[^0-9]/g, "").slice(0, 2);
    const clientState = clientGstin.substring(0, 2);
    if (!posCode || posCode.length !== 2) return false;
    // Intra-state CGST+SGST charged in a state different from buyer's GSTIN state is ineligible u/s 16
    if ((g.cgst > 0 || g.sgst > 0) && posCode !== clientState) return true;
    return false;
  }

  private static isSameCreditPolarity(g: Gstr2bInvoice, b: BooksPurchaseInvoice): boolean {
    const gCr = g.invoiceType === "CRN";
    const bCr = b.voucherType === "CREDIT_NOTE";
    return gCr === bCr;
  }

  public static reconcile(params: {
    taxPeriod: string;
    clientGstin: string;
    gstr2bInvoices: Gstr2bInvoice[];
    booksInvoices: BooksPurchaseInvoice[];
    toleranceInr?: number;
    statutoryCutoffDate?: string;
    overrides?: Record<string, RecoManualOverride>;
  }): ReconciliationReport {
    const tolerance = params.toleranceInr !== undefined ? params.toleranceInr : 5.0;
    const cutoffDate = params.statutoryCutoffDate ? new Date(params.statutoryCutoffDate) : new Date("2026-11-30");
    const cleanGstin = (g: string) => (g || "").trim().toUpperCase();

    const matched2bIds = new Set<string>();
    const matchedBooksIds = new Set<string>();
    const records: ReconciledRecord[] = [];

    const buildMatchedRecord = (
      matchStatus: RecoMatchStatus,
      confidenceScore: number,
      g: Gstr2bInvoice,
      b: BooksPurchaseInvoice,
      trail: string,
      action: string
    ): ReconciledRecord => {
      const taxHeadMismatch = this.hasTaxHeadMismatch(g, b, tolerance);
      const posMismatch = this.hasPosMismatch(g, params.clientGstin);
      const effectiveStatus: RecoMatchStatus =
        taxHeadMismatch && matchStatus !== "VALUE_MISMATCH" ? "VALUE_MISMATCH" : matchStatus;
      const isCreditNote = g.invoiceType === "CRN" || b.voucherType === "CREDIT_NOTE";
      const netSign: 1 | -1 = isCreditNote ? -1 : 1;
      const isImport = g.invoiceType === "IMPG" || g.sectionSource === "IMPG" || g.sectionSource === "IMPGSEZ";
      const isIsd = g.invoiceType === "ISD" || g.sectionSource === "ISD" || g.sectionSource === "ISDA";
      const isRcm = Boolean(g.reverseCharge);
      const isRule37a = g.gstr3bFilingStatus === "NOT_FILED";
      const invDate = new Date(b.invoiceDate || g.invoiceDate);
      const isSec16_4 =
        !isNaN(invDate.getTime()) &&
        invDate < cutoffDate &&
        new Date().getTime() - invDate.getTime() > 300 * 24 * 3600 * 1000;
      const isRule37_180 = (b.daysOutstanding || 0) > 180 && b.paymentStatus !== "PAID";

      let finalTrail = trail;
      let finalAction = action;
      if (taxHeadMismatch) {
        finalTrail = `TAX HEAD MISMATCH: 2B (IGST ₹${g.igst}, CGST ₹${g.cgst}, SGST ₹${g.sgst}) vs Books (IGST ₹${b.igst}, CGST ₹${b.cgst}, SGST ₹${b.sgst}).`;
        finalAction = "Verify IGST vs CGST/SGST accounting head and Place of Supply before claiming.";
      }
      if (posMismatch) {
        finalTrail += " [POS MISMATCH: Intra-state CGST/SGST charged in another state]";
        finalAction = "Ineligible ITC due to wrong Place of Supply (different state CGST/SGST).";
      }
      if (g.itcAvailable === false) {
        finalTrail += ` [PORTAL BLOCKED: ${g.itcIneligibilityReason || "itcavl=N"}]`;
        finalAction = "Marked ineligible by GSTN in GSTR-2B. Do not claim in Table 4(A)(5).";
      }

      return {
        id: `REC-${b.id}-${g.id}`,
        vendorGstin: b.vendorGstin || g.vendorGstin,
        vendorName: g.vendorTradeName || b.vendorName,
        matchStatus: effectiveStatus,
        confidenceScore: taxHeadMismatch ? Math.min(confidenceScore, 75) : confidenceScore,
        gstr2bId: g.id,
        gstr2bInvoiceNo: g.invoiceNumber,
        gstr2bDate: g.invoiceDate,
        gstr2bTaxableValue: g.taxableValue,
        gstr2bIgst: g.igst,
        gstr2bCgst: g.cgst,
        gstr2bSgst: g.sgst,
        gstr2bCess: g.cess || 0,
        gstr2bTotalTax: g.totalTax,
        gstr1FilingStatus: "FILED",
        gstr3bFilingStatus: g.gstr3bFilingStatus || "FILED",
        itcAvailableIn2b: g.itcAvailable !== false,
        itcIneligibilityReason: g.itcIneligibilityReason,
        sectionSource: g.sectionSource,
        booksId: b.id,
        booksInvoiceNo: b.invoiceNumber,
        booksDate: b.invoiceDate,
        booksTaxableValue: b.taxableValue,
        booksIgst: b.igst,
        booksCgst: b.cgst,
        booksSgst: b.sgst,
        booksCess: b.cess || 0,
        booksTotalTax: b.totalTax,
        hsnCode: b.hsnCode,
        itemDescription: b.itemDescription,
        taxableVariance: r2(b.taxableValue - g.taxableValue),
        taxVariance: r2(b.totalTax - g.totalTax),
        isCreditNote,
        netSign,
        isRcm,
        isImport,
        isIsd,
        taxHeadMismatch,
        posMismatch,
        section17_5Blocked: false,
        section16_4Risk: isSec16_4,
        rule37aRisk: isRule37a,
        rule37_180DayRisk: isRule37_180,
        statutoryAuditTrail: finalTrail,
        recommendedAction: finalAction,
      };
    };

    // PASS 1: EXACT MATCH
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);
      const bNormInv = this.normalizeInvoiceNumber(b.invoiceNumber);

      const match2b = params.gstr2bInvoices.find(
        (g) =>
          !matched2bIds.has(g.id) &&
          this.isSameCreditPolarity(g, b) &&
          cleanGstin(g.vendorGstin) === bGstin &&
          this.normalizeInvoiceNumber(g.invoiceNumber) === bNormInv &&
          Math.abs(g.taxableValue - b.taxableValue) < 0.01 &&
          Math.abs(g.totalTax - b.totalTax) < 0.01
      );

      if (match2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(match2b.id);
        records.push(
          buildMatchedRecord(
            "EXACT_MATCH",
            100,
            match2b,
            b,
            "Exact match between GSTR-2B and Books (Variance = ₹0.00).",
            match2b.gstr3bFilingStatus === "NOT_FILED"
              ? "Flagged under Rule 37A (Supplier GSTR-3B unfiled)."
              : "Eligible for GSTR-3B Table 4(A)."
          )
        );
      }
    }

    // PASS 2: ROUNDING / TOLERANCE MATCH
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);
      const bNormInv = this.normalizeInvoiceNumber(b.invoiceNumber);

      const match2b = params.gstr2bInvoices.find(
        (g) =>
          !matched2bIds.has(g.id) &&
          this.isSameCreditPolarity(g, b) &&
          cleanGstin(g.vendorGstin) === bGstin &&
          this.normalizeInvoiceNumber(g.invoiceNumber) === bNormInv &&
          Math.abs(g.taxableValue - b.taxableValue) <= tolerance &&
          Math.abs(g.totalTax - b.totalTax) <= tolerance
      );

      if (match2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(match2b.id);
        records.push(
          buildMatchedRecord(
            "ROUNDING_MATCHED",
            95,
            match2b,
            b,
            `Matched within ±₹${tolerance} rounding tolerance u/s 170 CGST Act.`,
            "Claim GSTR-2B value in Table 4(A); adjust rounding difference in Books."
          )
        );
      }
    }

    // PASS 3: FUZZY INVOICE MATCH
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);

      let best2b: Gstr2bInvoice | null = null;
      let highestSimilarity = 0;

      for (const g of params.gstr2bInvoices) {
        if (matched2bIds.has(g.id)) continue;
        if (!this.isSameCreditPolarity(g, b)) continue;
        if (cleanGstin(g.vendorGstin) !== bGstin) continue;

        if (
          Math.abs(g.taxableValue - b.taxableValue) <= tolerance &&
          Math.abs(g.totalTax - b.totalTax) <= tolerance
        ) {
          const sim = this.stringSimilarity(g.invoiceNumber, b.invoiceNumber);
          if (sim > highestSimilarity && sim >= 0.7) {
            highestSimilarity = sim;
            best2b = g;
          }
        }
      }

      if (best2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(best2b.id);
        records.push(
          buildMatchedRecord(
            "FUZZY_MATCHED",
            Math.round(highestSimilarity * 100),
            best2b,
            b,
            `Normalized invoice match: 2B '${best2b.invoiceNumber}' vs Books '${b.invoiceNumber}' (${Math.round(highestSimilarity * 100)}%).`,
            "Verify invoice number prefix/FY typo in Tally; eligible in Table 4(A)."
          )
        );
      }
    }

    // PASS 4: DATE LEEWAY MATCH (+/- 30 days, only when invoice similarity >= 0.5 OR unique GSTIN+amount candidate)
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);
      const bDate = new Date(b.invoiceDate);

      const candidates = params.gstr2bInvoices.filter((g) => {
        if (matched2bIds.has(g.id)) return false;
        if (!this.isSameCreditPolarity(g, b)) return false;
        if (cleanGstin(g.vendorGstin) !== bGstin) return false;
        if (Math.abs(g.taxableValue - b.taxableValue) > tolerance) return false;
        if (Math.abs(g.totalTax - b.totalTax) > tolerance) return false;

        const gDate = new Date(g.invoiceDate);
        const dayDiff = Math.abs((gDate.getTime() - bDate.getTime()) / (1000 * 3600 * 24));
        if (dayDiff > 30) return false;

        const sim = this.stringSimilarity(g.invoiceNumber, b.invoiceNumber);
        return sim >= 0.5 || !b.invoiceNumber;
      });

      const match2b = candidates.length === 1 ? candidates[0] : candidates.sort(
        (a, c) =>
          this.stringSimilarity(c.invoiceNumber, b.invoiceNumber) -
          this.stringSimilarity(a.invoiceNumber, b.invoiceNumber)
      )[0];

      if (match2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(match2b.id);
        records.push(
          buildMatchedRecord(
            "DATE_LEEWAY_MATCHED",
            82,
            match2b,
            b,
            `Matched within 30-day date leeway (2B: ${match2b.invoiceDate}, Books: ${b.invoiceDate}).`,
            "Verify invoice date in Tally purchase voucher."
          )
        );
      }
    }

    // PASS 5: VALUE MISMATCH
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);
      const bNormInv = this.normalizeInvoiceNumber(b.invoiceNumber);

      const match2b = params.gstr2bInvoices.find(
        (g) =>
          !matched2bIds.has(g.id) &&
          this.isSameCreditPolarity(g, b) &&
          cleanGstin(g.vendorGstin) === bGstin &&
          this.normalizeInvoiceNumber(g.invoiceNumber) === bNormInv
      );

      if (match2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(match2b.id);
        const taxDiff = r2(b.totalTax - match2b.totalTax);
        records.push(
          buildMatchedRecord(
            "VALUE_MISMATCH",
            70,
            match2b,
            b,
            `Monetary variance: Books Tax ₹${b.totalTax} vs 2B Tax ₹${match2b.totalTax} (Diff ₹${taxDiff}).`,
            taxDiff > 0
              ? "Restrict ITC to lower GSTR-2B amount; request supplier amendment or CN/DN."
              : "Claim Books lower amount or reconcile excess in 2B."
          )
        );
      }
    }

    // PASS 6: MISSING IN GSTR-2B
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const isCreditNote = b.voucherType === "CREDIT_NOTE";
      records.push({
        id: `REC-MISSING-2B-${b.id}`,
        vendorGstin: b.vendorGstin,
        vendorName: b.vendorName,
        matchStatus: "MISSING_IN_2B",
        confidenceScore: 0,
        gstr2bTaxableValue: 0,
        gstr2bIgst: 0,
        gstr2bCgst: 0,
        gstr2bSgst: 0,
        gstr2bCess: 0,
        gstr2bTotalTax: 0,
        gstr1FilingStatus: "NOT_FILED",
        gstr3bFilingStatus: "NOT_FILED",
        itcAvailableIn2b: false,
        booksId: b.id,
        booksInvoiceNo: b.invoiceNumber,
        booksDate: b.invoiceDate,
        booksTaxableValue: b.taxableValue,
        booksIgst: b.igst,
        booksCgst: b.cgst,
        booksSgst: b.sgst,
        booksCess: b.cess || 0,
        booksTotalTax: b.totalTax,
        hsnCode: b.hsnCode,
        itemDescription: b.itemDescription,
        taxableVariance: b.taxableValue,
        taxVariance: b.totalTax,
        isCreditNote,
        netSign: isCreditNote ? -1 : 1,
        isRcm: false,
        isImport: false,
        isIsd: false,
        taxHeadMismatch: false,
        posMismatch: false,
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: true,
        rule37_180DayRisk: (b.daysOutstanding || 0) > 180 && b.paymentStatus !== "PAID",
        statutoryAuditTrail:
          "Booked in Purchase Register but absent from GSTR-2B. Barred u/s 16(2)(aa).",
        recommendedAction:
          "Do NOT claim in GSTR-3B. Send Sec 16(2)(aa) notice to vendor or mark Pending in IMS.",
      });
    }

    // PASS 7: MISSING IN BOOKS
    for (const g of params.gstr2bInvoices) {
      if (matched2bIds.has(g.id)) continue;
      const isCreditNote = g.invoiceType === "CRN";
      const isImport = g.invoiceType === "IMPG" || g.sectionSource === "IMPG" || g.sectionSource === "IMPGSEZ";
      const isIsd = g.invoiceType === "ISD" || g.sectionSource === "ISD" || g.sectionSource === "ISDA";
      records.push({
        id: `REC-MISSING-BOOKS-${g.id}`,
        vendorGstin: g.vendorGstin,
        vendorName: g.vendorTradeName || "Unknown Vendor",
        matchStatus: "MISSING_IN_BOOKS",
        confidenceScore: 0,
        gstr2bId: g.id,
        gstr2bInvoiceNo: g.invoiceNumber,
        gstr2bDate: g.invoiceDate,
        gstr2bTaxableValue: g.taxableValue,
        gstr2bIgst: g.igst,
        gstr2bCgst: g.cgst,
        gstr2bSgst: g.sgst,
        gstr2bCess: g.cess || 0,
        gstr2bTotalTax: g.totalTax,
        gstr1FilingStatus: "FILED",
        gstr3bFilingStatus: g.gstr3bFilingStatus || "FILED",
        itcAvailableIn2b: g.itcAvailable !== false,
        itcIneligibilityReason: g.itcIneligibilityReason,
        sectionSource: g.sectionSource,
        booksTaxableValue: 0,
        booksIgst: 0,
        booksCgst: 0,
        booksSgst: 0,
        booksCess: 0,
        booksTotalTax: 0,
        taxableVariance: -g.taxableValue,
        taxVariance: -g.totalTax,
        isCreditNote,
        netSign: isCreditNote ? -1 : 1,
        isRcm: Boolean(g.reverseCharge),
        isImport,
        isIsd,
        taxHeadMismatch: false,
        posMismatch: this.hasPosMismatch(g, params.clientGstin),
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: g.gstr3bFilingStatus === "NOT_FILED",
        rule37_180DayRisk: false,
        statutoryAuditTrail:
          "Reflected in GSTR-2B portal but missing from Purchase Register.",
        recommendedAction:
          "Verify receipt of goods/services; import into Tally via XML or mark Pending in IMS.",
      });
    }

    if (params.overrides) {
      for (const rec of records) {
        const ov = params.overrides[rec.id];
        if (ov) rec.manualOverride = ov;
      }
    }

    return this.recomputeSummary({
      taxPeriod: params.taxPeriod,
      clientGstin: params.clientGstin,
      reconciliationDate: new Date().toISOString(),
      toleranceLimitInr: tolerance,
      summary: {} as any,
      records,
    });
  }

  /**
   * Recomputes all summary KPIs and CBIC Circular 170 Table 4 values after classifiers & manual overrides.
   */
  public static recomputeSummary(report: ReconciliationReport): ReconciliationReport {
    let totalBooksItc = 0;
    let total2bItc = 0;
    let matchedEligibleItc = 0;
    let ineligibleSec17_5Itc = 0;
    let atRiskRule37aItc = 0;
    let unclaimed2bItc = 0;
    let provisionalMissing2bItc = 0;
    let heldForNextPeriodItc = 0;

    let exactMatches = 0;
    let fuzzyMatches = 0;
    let roundingMatches = 0;
    let valueMismatches = 0;
    let missingIn2b = 0;
    let missingInBooks = 0;

    const table4A1_ImportGoods = emptyHeads();
    const table4A3_Rcm = emptyHeads();
    const table4A4_Isd = emptyHeads();
    const table4A5_AllOtherGross = emptyHeads();
    const table4B1_PermanentReversal = emptyHeads();
    const table4B2_TemporaryReversal = emptyHeads();

    for (const rec of report.records) {
      const sign = rec.netSign || (rec.isCreditNote ? -1 : 1);
      totalBooksItc += rec.booksTotalTax * sign;
      total2bItc += rec.gstr2bTotalTax * sign;

      const isBlockedEffective =
        rec.manualOverride === "FORCE_BLOCKED_17_5" ||
        (rec.section17_5Blocked && rec.manualOverride !== "ALLOW_EXCEPTION");
      const isHeld = rec.manualOverride === "HOLD_NEXT_PERIOD";

      if (rec.matchStatus === "EXACT_MATCH") exactMatches++;
      else if (rec.matchStatus === "FUZZY_MATCHED" || rec.matchStatus === "DATE_LEEWAY_MATCHED") fuzzyMatches++;
      else if (rec.matchStatus === "ROUNDING_MATCHED") roundingMatches++;
      else if (rec.matchStatus === "VALUE_MISMATCH") valueMismatches++;
      else if (rec.matchStatus === "MISSING_IN_2B") missingIn2b++;
      else if (rec.matchStatus === "MISSING_IN_BOOKS") missingInBooks++;

      if (rec.matchStatus === "MISSING_IN_2B") {
        provisionalMissing2bItc += rec.booksTotalTax * sign;
      } else if (rec.matchStatus === "MISSING_IN_BOOKS") {
        unclaimed2bItc += rec.gstr2bTotalTax * sign;
      } else {
        // Matched or Value Mismatch -> Lower of 2B / Books when value differs
        const useBooksLower =
          rec.matchStatus === "VALUE_MISMATCH" && rec.booksTotalTax < rec.gstr2bTotalTax;
        const igst = useBooksLower ? rec.booksIgst : rec.gstr2bIgst;
        const cgst = useBooksLower ? rec.booksCgst : rec.gstr2bCgst;
        const sgst = useBooksLower ? rec.booksSgst : rec.gstr2bSgst;
        const cess = useBooksLower ? rec.booksCess : rec.gstr2bCess;
        const tax = useBooksLower ? rec.booksTotalTax : rec.gstr2bTotalTax;

        if (isHeld) {
          heldForNextPeriodItc += tax * sign;
        } else {
          // Route to Table 4(A) bucket
          if (rec.isImport) {
            addHeads(table4A1_ImportGoods, igst, cgst, sgst, cess, sign);
          } else if (rec.isRcm) {
            addHeads(table4A3_Rcm, igst, cgst, sgst, cess, sign);
          } else if (rec.isIsd) {
            addHeads(table4A4_Isd, igst, cgst, sgst, cess, sign);
          } else {
            addHeads(table4A5_AllOtherGross, igst, cgst, sgst, cess, sign);
          }

          if (isBlockedEffective || !rec.itcAvailableIn2b || rec.posMismatch) {
            ineligibleSec17_5Itc += tax * sign;
            addHeads(table4B1_PermanentReversal, igst, cgst, sgst, cess, sign);
          } else if (rec.rule37_180DayRisk) {
            addHeads(table4B2_TemporaryReversal, igst, cgst, sgst, cess, sign);
          } else {
            matchedEligibleItc += tax * sign;
          }
        }
      }

      if (rec.rule37aRisk && rec.matchStatus !== "MISSING_IN_2B") {
        atRiskRule37aItc += (rec.gstr2bTotalTax || rec.booksTotalTax) * sign;
      }
    }

    const netItc4C: TaxHeadTotals = {
      igst: r2(
        table4A1_ImportGoods.igst +
          table4A3_Rcm.igst +
          table4A4_Isd.igst +
          table4A5_AllOtherGross.igst -
          table4B1_PermanentReversal.igst -
          table4B2_TemporaryReversal.igst
      ),
      cgst: r2(
        table4A1_ImportGoods.cgst +
          table4A3_Rcm.cgst +
          table4A4_Isd.cgst +
          table4A5_AllOtherGross.cgst -
          table4B1_PermanentReversal.cgst -
          table4B2_TemporaryReversal.cgst
      ),
      sgst: r2(
        table4A1_ImportGoods.sgst +
          table4A3_Rcm.sgst +
          table4A4_Isd.sgst +
          table4A5_AllOtherGross.sgst -
          table4B1_PermanentReversal.sgst -
          table4B2_TemporaryReversal.sgst
      ),
      cess: r2(
        table4A1_ImportGoods.cess +
          table4A3_Rcm.cess +
          table4A4_Isd.cess +
          table4A5_AllOtherGross.cess -
          table4B1_PermanentReversal.cess -
          table4B2_TemporaryReversal.cess
      ),
      total: 0,
    };
    netItc4C.total = r2(netItc4C.igst + netItc4C.cgst + netItc4C.sgst + netItc4C.cess);

    return {
      ...report,
      summary: {
        totalRecords: report.records.length,
        exactMatches,
        fuzzyMatches,
        roundingMatches,
        valueMismatches,
        missingIn2b,
        missingInBooks,
        totalBooksItc: r2(totalBooksItc),
        total2bItc: r2(total2bItc),
        matchedEligibleItc: r2(matchedEligibleItc),
        ineligibleSec17_5Itc: r2(ineligibleSec17_5Itc),
        atRiskRule37aItc: r2(atRiskRule37aItc),
        unclaimed2bItc: r2(unclaimed2bItc),
        provisionalMissing2bItc: r2(provisionalMissing2bItc),
        heldForNextPeriodItc: r2(heldForNextPeriodItc),
        table4A1_ImportGoods,
        table4A3_Rcm,
        table4A4_Isd,
        table4A5_AllOtherGross,
        table4B1_PermanentReversal,
        table4B2_TemporaryReversal,
        netItc4C,
      },
    };
  }
}
