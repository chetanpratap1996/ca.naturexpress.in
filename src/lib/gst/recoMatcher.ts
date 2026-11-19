/**
 * Brains & Taxes — Enterprise Deterministic GSTR-2B vs Books Reconciliation Engine
 * 
 * Statutory Authority:
 * - Section 16(2)(aa) of CGST Act, 2017: ITC available only if invoice is uploaded by supplier in GSTR-1 and communicated in GSTR-2B
 * - Section 16(4) of CGST Act, 2017: Cut-off date for claiming ITC (30th November following end of FY)
 * - Rule 37A of CGST Rules, 2017: Mandatory ITC reversal where supplier failed to furnish GSTR-3B
 * - Section 170 of CGST Act, 2017: Permissible rounding of tax to nearest Rupee (+/- INR 1 to 5)
 */

export type RecoMatchStatus = 
  | "EXACT_MATCH"
  | "FUZZY_MATCHED"
  | "ROUNDING_MATCHED"
  | "DATE_LEEWAY_MATCHED"
  | "VALUE_MISMATCH"
  | "MISSING_IN_2B"
  | "MISSING_IN_BOOKS";

export interface Gstr2bInvoice {
  id: string;
  vendorGstin: string;
  vendorTradeName: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceType: "R" | "SEWP" | "SEWOP" | "DE" | "CRN" | "DBN"; // Regular, SEZ, Deemed Export, Credit/Debit Note
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
  confidenceScore: number; // 0 to 100
  
  // 2B Data
  gstr2bId?: string;
  gstr2bInvoiceNo?: string;
  gstr2bDate?: string;
  gstr2bTaxableValue: number;
  gstr2bIgst: number;
  gstr2bCgst: number;
  gstr2bSgst: number;
  gstr2bTotalTax: number;
  gstr1FilingStatus: "FILED" | "NOT_FILED";
  gstr3bFilingStatus: "FILED" | "NOT_FILED" | "PENDING";

  // Books Data
  booksId?: string;
  booksInvoiceNo?: string;
  booksDate?: string;
  booksTaxableValue: number;
  booksIgst: number;
  booksCgst: number;
  booksSgst: number;
  booksTotalTax: number;
  hsnCode?: string;
  itemDescription?: string;

  // Variances & Tolerances
  taxableVariance: number; // Books - 2B
  taxVariance: number;     // Books - 2B
  
  // Statutory Risk Flags
  section17_5Blocked: boolean;
  blockedCategory?: string;
  section16_4Risk: boolean; // Overdue past Nov 30 deadline
  rule37aRisk: boolean;     // Supplier GSTR-3B unfiled
  rule37_180DayRisk: boolean; // Payment unpaid > 180 days
  
  statutoryAuditTrail: string;
  recommendedAction: string;
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
    
    // Values
    totalBooksItc: number;
    total2bItc: number;
    matchedEligibleItc: number;
    ineligibleSec17_5Itc: number;
    atRiskRule37aItc: number;
    unclaimed2bItc: number;
    provisionalMissing2bItc: number;
  };
  
  records: ReconciledRecord[];
}

export class RecoMatcher {
  /**
   * Normalizes an invoice number by removing common prefix words,
   * financial year patterns, leading zeros, and all non-alphanumeric punctuation.
   */
  public static normalizeInvoiceNumber(raw: string): string {
    if (!raw) return "";
    let clean = raw.trim().toUpperCase();

    // 1. Remove financial year patterns like /2025-26, /25-26, /2024-2025, -25-26, etc.
    clean = clean.replace(/[/_-]?(20\d{2}[-_/]?\d{2,4}|\d{2}[-_/]\d{2})/gi, "");

    // 2. Remove common accounting prefixes
    clean = clean.replace(/^(INV|BILL|TAX[-_]?INV|TI|GST|PB|EXP|SL|SALES|PUR|PI)[-_/.]?/i, "");

    // 3. Remove all non-alphanumeric characters
    clean = clean.replace(/[^A-Z0-9]/gi, "");

    // 4. Strip leading zeros
    clean = clean.replace(/^0+/, "");

    return clean || raw.trim().toUpperCase().replace(/[^A-Z0-9]/gi, "");
  }

  /**
   * Calculates Sørensen–Dice string similarity coefficient (0.0 to 1.0)
   */
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
      if (b2.has(bigram)) {
        intersection += Math.min(count, b2.get(bigram)!);
      }
    });

    return (2.0 * intersection) / ((s1.length - 1) + (s2.length - 1));
  }

  /**
   * Executes the 7-pass multi-rule reconciliation engine
   */
  public static reconcile(params: {
    taxPeriod: string;
    clientGstin: string;
    gstr2bInvoices: Gstr2bInvoice[];
    booksInvoices: BooksPurchaseInvoice[];
    toleranceInr?: number; // Default +/- 5.00
    statutoryCutoffDate?: string; // e.g. "2026-11-30" for Sec 16(4)
  }): ReconciliationReport {
    const tolerance = params.toleranceInr !== undefined ? params.toleranceInr : 5.00;
    const cutoffDate = params.statutoryCutoffDate ? new Date(params.statutoryCutoffDate) : new Date("2026-11-30");

    const matched2bIds = new Set<string>();
    const matchedBooksIds = new Set<string>();
    const records: ReconciledRecord[] = [];

    // Helper to format GSTIN
    const cleanGstin = (g: string) => (g || "").trim().toUpperCase();

    // -------------------------------------------------------------
    // PASS 1: EXACT MATCH (GSTIN + Normalized Inv + Taxable + Tax)
    // -------------------------------------------------------------
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);
      const bNormInv = this.normalizeInvoiceNumber(b.invoiceNumber);

      const match2b = params.gstr2bInvoices.find(g => 
        !matched2bIds.has(g.id) &&
        cleanGstin(g.vendorGstin) === bGstin &&
        this.normalizeInvoiceNumber(g.invoiceNumber) === bNormInv &&
        Math.abs(g.taxableValue - b.taxableValue) < 0.01 &&
        Math.abs(g.totalTax - b.totalTax) < 0.01
      );

      if (match2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(match2b.id);

        const isRule37a = match2b.gstr3bFilingStatus === "NOT_FILED";
        const invDate = new Date(b.invoiceDate);
        const isSec16_4 = invDate < cutoffDate && (new Date().getTime() - invDate.getTime()) > (300 * 24 * 3600 * 1000);
        const isRule37_180 = (b.daysOutstanding || 0) > 180 && b.paymentStatus !== "PAID";

        records.push({
          id: `REC-${b.id}-${match2b.id}`,
          vendorGstin: b.vendorGstin,
          vendorName: match2b.vendorTradeName || b.vendorName,
          matchStatus: "EXACT_MATCH",
          confidenceScore: 100,
          gstr2bId: match2b.id,
          gstr2bInvoiceNo: match2b.invoiceNumber,
          gstr2bDate: match2b.invoiceDate,
          gstr2bTaxableValue: match2b.taxableValue,
          gstr2bIgst: match2b.igst,
          gstr2bCgst: match2b.cgst,
          gstr2bSgst: match2b.sgst,
          gstr2bTotalTax: match2b.totalTax,
          gstr1FilingStatus: "FILED",
          gstr3bFilingStatus: match2b.gstr3bFilingStatus || "FILED",
          booksId: b.id,
          booksInvoiceNo: b.invoiceNumber,
          booksDate: b.invoiceDate,
          booksTaxableValue: b.taxableValue,
          booksIgst: b.igst,
          booksCgst: b.cgst,
          booksSgst: b.sgst,
          booksTotalTax: b.totalTax,
          hsnCode: b.hsnCode,
          itemDescription: b.itemDescription,
          taxableVariance: Math.round((b.taxableValue - match2b.taxableValue) * 100) / 100,
          taxVariance: Math.round((b.totalTax - match2b.totalTax) * 100) / 100,
          section17_5Blocked: false,
          section16_4Risk: isSec16_4,
          rule37aRisk: isRule37a,
          rule37_180DayRisk: isRule37_180,
          statutoryAuditTrail: "100% exact match between GSTR-2B and Books purchase voucher. Difference = INR 0.00.",
          recommendedAction: isRule37a 
            ? "Claim credit in Table 4(A)(5) but flag vendor for Rule 37A monitoring (supplier GSTR-3B pending)."
            : "Safe to claim in GSTR-3B Table 4(A)(5) All Other ITC."
        });
      }
    }

    // -------------------------------------------------------------
    // PASS 2: ROUNDING / TOLERANCE MATCH (+/- INR 1 to 5)
    // -------------------------------------------------------------
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);
      const bNormInv = this.normalizeInvoiceNumber(b.invoiceNumber);

      const match2b = params.gstr2bInvoices.find(g => 
        !matched2bIds.has(g.id) &&
        cleanGstin(g.vendorGstin) === bGstin &&
        this.normalizeInvoiceNumber(g.invoiceNumber) === bNormInv &&
        Math.abs(g.taxableValue - b.taxableValue) <= tolerance &&
        Math.abs(g.totalTax - b.totalTax) <= tolerance
      );

      if (match2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(match2b.id);

        const taxDiff = Math.round((b.totalTax - match2b.totalTax) * 100) / 100;
        const taxableDiff = Math.round((b.taxableValue - match2b.taxableValue) * 100) / 100;

        records.push({
          id: `REC-${b.id}-${match2b.id}`,
          vendorGstin: b.vendorGstin,
          vendorName: match2b.vendorTradeName || b.vendorName,
          matchStatus: "ROUNDING_MATCHED",
          confidenceScore: 95,
          gstr2bId: match2b.id,
          gstr2bInvoiceNo: match2b.invoiceNumber,
          gstr2bDate: match2b.invoiceDate,
          gstr2bTaxableValue: match2b.taxableValue,
          gstr2bIgst: match2b.igst,
          gstr2bCgst: match2b.cgst,
          gstr2bSgst: match2b.sgst,
          gstr2bTotalTax: match2b.totalTax,
          gstr1FilingStatus: "FILED",
          gstr3bFilingStatus: match2b.gstr3bFilingStatus || "FILED",
          booksId: b.id,
          booksInvoiceNo: b.invoiceNumber,
          booksDate: b.invoiceDate,
          booksTaxableValue: b.taxableValue,
          booksIgst: b.igst,
          booksCgst: b.cgst,
          booksSgst: b.sgst,
          booksTotalTax: b.totalTax,
          hsnCode: b.hsnCode,
          itemDescription: b.itemDescription,
          taxableVariance: taxableDiff,
          taxVariance: taxDiff,
          section17_5Blocked: false,
          section16_4Risk: false,
          rule37aRisk: match2b.gstr3bFilingStatus === "NOT_FILED",
          rule37_180DayRisk: (b.daysOutstanding || 0) > 180 && b.paymentStatus !== "PAID",
          statutoryAuditTrail: `Matched within permissible statutory rounding limit of INR ${tolerance}. Variance: Taxable INR ${taxableDiff}, Tax INR ${taxDiff}. Permissible u/s 170 of CGST Act.`,
          recommendedAction: "Claim 2B amount in GSTR-3B Table 4(A)(5). Auto-adjust fractional paise in Books expense ledger."
        });
      }
    }

    // -------------------------------------------------------------
    // PASS 3: FUZZY INVOICE MATCHER (Normalized/Levenshtein Match)
    // -------------------------------------------------------------
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);

      let best2b: Gstr2bInvoice | null = null;
      let highestSimilarity = 0;

      for (const g of params.gstr2bInvoices) {
        if (matched2bIds.has(g.id)) continue;
        if (cleanGstin(g.vendorGstin) !== bGstin) continue;

        // Check tax and taxable match within tolerance
        if (Math.abs(g.taxableValue - b.taxableValue) <= tolerance && Math.abs(g.totalTax - b.totalTax) <= tolerance) {
          const sim = this.stringSimilarity(g.invoiceNumber, b.invoiceNumber);
          if (sim > highestSimilarity && sim >= 0.70) {
            highestSimilarity = sim;
            best2b = g;
          }
        }
      }

      if (best2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(best2b.id);

        records.push({
          id: `REC-${b.id}-${best2b.id}`,
          vendorGstin: b.vendorGstin,
          vendorName: best2b.vendorTradeName || b.vendorName,
          matchStatus: "FUZZY_MATCHED",
          confidenceScore: Math.round(highestSimilarity * 100),
          gstr2bId: best2b.id,
          gstr2bInvoiceNo: best2b.invoiceNumber,
          gstr2bDate: best2b.invoiceDate,
          gstr2bTaxableValue: best2b.taxableValue,
          gstr2bIgst: best2b.igst,
          gstr2bCgst: best2b.cgst,
          gstr2bSgst: best2b.sgst,
          gstr2bTotalTax: best2b.totalTax,
          gstr1FilingStatus: "FILED",
          gstr3bFilingStatus: best2b.gstr3bFilingStatus || "FILED",
          booksId: b.id,
          booksInvoiceNo: b.invoiceNumber,
          booksDate: b.invoiceDate,
          booksTaxableValue: b.taxableValue,
          booksIgst: b.igst,
          booksCgst: b.cgst,
          booksSgst: b.sgst,
          booksTotalTax: b.totalTax,
          hsnCode: b.hsnCode,
          itemDescription: b.itemDescription,
          taxableVariance: Math.round((b.taxableValue - best2b.taxableValue) * 100) / 100,
          taxVariance: Math.round((b.totalTax - best2b.totalTax) * 100) / 100,
          section17_5Blocked: false,
          section16_4Risk: false,
          rule37aRisk: best2b.gstr3bFilingStatus === "NOT_FILED",
          rule37_180DayRisk: (b.daysOutstanding || 0) > 180 && b.paymentStatus !== "PAID",
          statutoryAuditTrail: `Fuzzy matched invoice number: 2B '${best2b.invoiceNumber}' vs Books '${b.invoiceNumber}' (${Math.round(highestSimilarity * 100)}% similarity). Taxable & tax values match.`,
          recommendedAction: "Auto-harmonized. Safe to claim in GSTR-3B Table 4(A)(5)."
        });
      }
    }

    // -------------------------------------------------------------
    // PASS 4: DATE LEEWAY MATCHER (+/- 30 Days within same GSTIN & values)
    // -------------------------------------------------------------
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);
      const bDate = new Date(b.invoiceDate);

      const match2b = params.gstr2bInvoices.find(g => {
        if (matched2bIds.has(g.id)) return false;
        if (cleanGstin(g.vendorGstin) !== bGstin) return false;
        if (Math.abs(g.taxableValue - b.taxableValue) > tolerance) return false;
        if (Math.abs(g.totalTax - b.totalTax) > tolerance) return false;

        const gDate = new Date(g.invoiceDate);
        const dayDiff = Math.abs((gDate.getTime() - bDate.getTime()) / (1000 * 3600 * 24));
        return dayDiff <= 30;
      });

      if (match2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(match2b.id);

        records.push({
          id: `REC-${b.id}-${match2b.id}`,
          vendorGstin: b.vendorGstin,
          vendorName: match2b.vendorTradeName || b.vendorName,
          matchStatus: "DATE_LEEWAY_MATCHED",
          confidenceScore: 82,
          gstr2bId: match2b.id,
          gstr2bInvoiceNo: match2b.invoiceNumber,
          gstr2bDate: match2b.invoiceDate,
          gstr2bTaxableValue: match2b.taxableValue,
          gstr2bIgst: match2b.igst,
          gstr2bCgst: match2b.cgst,
          gstr2bSgst: match2b.sgst,
          gstr2bTotalTax: match2b.totalTax,
          gstr1FilingStatus: "FILED",
          gstr3bFilingStatus: match2b.gstr3bFilingStatus || "FILED",
          booksId: b.id,
          booksInvoiceNo: b.invoiceNumber,
          booksDate: b.invoiceDate,
          booksTaxableValue: b.taxableValue,
          booksIgst: b.igst,
          booksCgst: b.cgst,
          booksSgst: b.sgst,
          booksTotalTax: b.totalTax,
          hsnCode: b.hsnCode,
          itemDescription: b.itemDescription,
          taxableVariance: Math.round((b.taxableValue - match2b.taxableValue) * 100) / 100,
          taxVariance: Math.round((b.totalTax - match2b.totalTax) * 100) / 100,
          section17_5Blocked: false,
          section16_4Risk: false,
          rule37aRisk: match2b.gstr3bFilingStatus === "NOT_FILED",
          rule37_180DayRisk: (b.daysOutstanding || 0) > 180 && b.paymentStatus !== "PAID",
          statutoryAuditTrail: `Matched on GSTIN & exact values with date leeway (2B: ${match2b.invoiceDate}, Books: ${b.invoiceDate}).`,
          recommendedAction: "Review date alignment in Tally purchase entry. Safe to claim in Table 4(A)(5)."
        });
      }
    }

    // -------------------------------------------------------------
    // PASS 5: VALUE MISMATCH (GSTIN & Inv Match, but values differ)
    // -------------------------------------------------------------
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;
      const bGstin = cleanGstin(b.vendorGstin);
      const bNormInv = this.normalizeInvoiceNumber(b.invoiceNumber);

      const match2b = params.gstr2bInvoices.find(g => 
        !matched2bIds.has(g.id) &&
        cleanGstin(g.vendorGstin) === bGstin &&
        this.normalizeInvoiceNumber(g.invoiceNumber) === bNormInv
      );

      if (match2b) {
        matchedBooksIds.add(b.id);
        matched2bIds.add(match2b.id);

        const taxableDiff = Math.round((b.taxableValue - match2b.taxableValue) * 100) / 100;
        const taxDiff = Math.round((b.totalTax - match2b.totalTax) * 100) / 100;

        records.push({
          id: `REC-${b.id}-${match2b.id}`,
          vendorGstin: b.vendorGstin,
          vendorName: match2b.vendorTradeName || b.vendorName,
          matchStatus: "VALUE_MISMATCH",
          confidenceScore: 70,
          gstr2bId: match2b.id,
          gstr2bInvoiceNo: match2b.invoiceNumber,
          gstr2bDate: match2b.invoiceDate,
          gstr2bTaxableValue: match2b.taxableValue,
          gstr2bIgst: match2b.igst,
          gstr2bCgst: match2b.cgst,
          gstr2bSgst: match2b.sgst,
          gstr2bTotalTax: match2b.totalTax,
          gstr1FilingStatus: "FILED",
          gstr3bFilingStatus: match2b.gstr3bFilingStatus || "FILED",
          booksId: b.id,
          booksInvoiceNo: b.invoiceNumber,
          booksDate: b.invoiceDate,
          booksTaxableValue: b.taxableValue,
          booksIgst: b.igst,
          booksCgst: b.cgst,
          booksSgst: b.sgst,
          booksTotalTax: b.totalTax,
          hsnCode: b.hsnCode,
          itemDescription: b.itemDescription,
          taxableVariance: taxableDiff,
          taxVariance: taxDiff,
          section17_5Blocked: false,
          section16_4Risk: false,
          rule37aRisk: match2b.gstr3bFilingStatus === "NOT_FILED",
          rule37_180DayRisk: (b.daysOutstanding || 0) > 180 && b.paymentStatus !== "PAID",
          statutoryAuditTrail: `Invoice numbers match but monetary difference exceeds tolerance. Tax discrepancy: INR ${taxDiff}. Supplier reported taxable INR ${match2b.taxableValue} vs Books INR ${b.taxableValue}.`,
          recommendedAction: taxDiff > 0 
            ? "RESTRICT ITC CLAIM: Claim only lower 2B amount in GSTR-3B Table 4(A)(5). Issue debit note or requisition amendment from supplier."
            : "Claim 2B amount in GSTR-3B and reconcile book expense."
        });
      }
    }

    // -------------------------------------------------------------
    // PASS 6: MISSING IN GSTR-2B (Booked in Tally, absent in 2B)
    // -------------------------------------------------------------
    for (const b of params.booksInvoices) {
      if (matchedBooksIds.has(b.id)) continue;

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
        gstr2bTotalTax: 0,
        gstr1FilingStatus: "NOT_FILED",
        gstr3bFilingStatus: "NOT_FILED",
        booksId: b.id,
        booksInvoiceNo: b.invoiceNumber,
        booksDate: b.invoiceDate,
        booksTaxableValue: b.taxableValue,
        booksIgst: b.igst,
        booksCgst: b.cgst,
        booksSgst: b.sgst,
        booksTotalTax: b.totalTax,
        hsnCode: b.hsnCode,
        itemDescription: b.itemDescription,
        taxableVariance: b.taxableValue,
        taxVariance: b.totalTax,
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: true,
        rule37_180DayRisk: (b.daysOutstanding || 0) > 180 && b.paymentStatus !== "PAID",
        statutoryAuditTrail: "Purchase booked in Tally but omitted from GSTR-2B. Claiming ITC strictly barred u/s 16(2)(aa) of CGST Act.",
        recommendedAction: "DO NOT CLAIM IN GSTR-3B. Dispatch 1-click statutory demand notice to supplier via WhatsApp/Email."
      });
    }

    // -------------------------------------------------------------
    // PASS 7: MISSING IN BOOKS (Present in 2B, missing in Tally)
    // -------------------------------------------------------------
    for (const g of params.gstr2bInvoices) {
      if (matched2bIds.has(g.id)) continue;

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
        gstr2bTotalTax: g.totalTax,
        gstr1FilingStatus: "FILED",
        gstr3bFilingStatus: g.gstr3bFilingStatus || "FILED",
        booksTaxableValue: 0,
        booksIgst: 0,
        booksCgst: 0,
        booksSgst: 0,
        booksTotalTax: 0,
        taxableVariance: -g.taxableValue,
        taxVariance: -g.totalTax,
        section17_5Blocked: false,
        section16_4Risk: false,
        rule37aRisk: false,
        rule37_180DayRisk: false,
        statutoryAuditTrail: "Invoice reflected in GSTR-2B portal but missing from client purchase register. Unclaimed eligible credit.",
        recommendedAction: "1-Click generate purchase voucher XML for import into Tally Prime (`Alt+O`). Claim in Table 4(A)(5)."
      });
    }

    // Calculate Summary Metrics
    let totalBooksItc = 0;
    let total2bItc = 0;
    let matchedEligibleItc = 0;
    let ineligibleSec17_5Itc = 0;
    let atRiskRule37aItc = 0;
    let unclaimed2bItc = 0;
    let provisionalMissing2bItc = 0;

    let exactMatches = 0;
    let fuzzyMatches = 0;
    let roundingMatches = 0;
    let valueMismatches = 0;
    let missingIn2b = 0;
    let missingInBooks = 0;

    for (const r of records) {
      totalBooksItc += r.booksTotalTax;
      total2bItc += r.gstr2bTotalTax;

      if (r.matchStatus === "EXACT_MATCH") {
        exactMatches++;
        matchedEligibleItc += r.gstr2bTotalTax;
      } else if (r.matchStatus === "FUZZY_MATCHED" || r.matchStatus === "DATE_LEEWAY_MATCHED") {
        fuzzyMatches++;
        matchedEligibleItc += r.gstr2bTotalTax;
      } else if (r.matchStatus === "ROUNDING_MATCHED") {
        roundingMatches++;
        matchedEligibleItc += r.gstr2bTotalTax;
      } else if (r.matchStatus === "VALUE_MISMATCH") {
        valueMismatches++;
        matchedEligibleItc += Math.min(r.gstr2bTotalTax, r.booksTotalTax);
      } else if (r.matchStatus === "MISSING_IN_2B") {
        missingIn2b++;
        provisionalMissing2bItc += r.booksTotalTax;
      } else if (r.matchStatus === "MISSING_IN_BOOKS") {
        missingInBooks++;
        unclaimed2bItc += r.gstr2bTotalTax;
      }

      if (r.rule37aRisk) {
        atRiskRule37aItc += (r.gstr2bTotalTax || r.booksTotalTax);
      }
    }

    return {
      taxPeriod: params.taxPeriod,
      clientGstin: params.clientGstin,
      reconciliationDate: new Date().toISOString(),
      toleranceLimitInr: tolerance,
      summary: {
        totalRecords: records.length,
        exactMatches,
        fuzzyMatches,
        roundingMatches,
        valueMismatches,
        missingIn2b,
        missingInBooks,
        totalBooksItc: Math.round(totalBooksItc * 100) / 100,
        total2bItc: Math.round(total2bItc * 100) / 100,
        matchedEligibleItc: Math.round(matchedEligibleItc * 100) / 100,
        ineligibleSec17_5Itc: Math.round(ineligibleSec17_5Itc * 100) / 100,
        atRiskRule37aItc: Math.round(atRiskRule37aItc * 100) / 100,
        unclaimed2bItc: Math.round(unclaimed2bItc * 100) / 100,
        provisionalMissing2bItc: Math.round(provisionalMissing2bItc * 100) / 100
      },
      records
    };
  }
}
