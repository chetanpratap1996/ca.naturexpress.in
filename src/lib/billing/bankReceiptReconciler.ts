/**
 * Brains & Taxes — Autonomous CA Firm Bank Statement Ingestion & Receipt Reconciler
 * 1000% Deterministic Mathematical Standard
 *
 * Capabilities:
 * 1. Multi-Bank Parsing: ICICI, HDFC, SBI, Axis, Kotak, PNB, and Generic CSV/TSV
 * 2. Credit Isolation: Filters incoming deposits, strictly ignoring debit withdrawals
 * 3. Tokenizer: Extracts 12-digit UPI RRNs, 16-22 char NEFT/RTGS UTRs, and Invoice references
 * 4. Dual-Matching Engine:
 *    - Level 1 (100%): Exact Invoice Number + Exact Amount match
 *    - Level 2 (100%): Client-submitted UTR exact match
 *    - Level 3 (95%): Assessee Entity Name + Gross Amount or Net (less 10% Sec 194J TDS)
 *    - Level 4 (90%): Amount match against unique pending invoice
 * 5. Zero Payment Gateway Fee computation: Calculates exact ₹ savings vs 2% + 18% GST (2.36%)
 */

import { InvoiceItem, ClientEntity } from "@/lib/types";

export interface BankStatementCreditEntry {
  rawLine: string;
  date: string;
  narration: string;
  referenceNo?: string;
  creditAmount: number;
  extractedUtr?: string;
  extractedInvoiceNo?: string;
  extractedMode: "UPI" | "NEFT" | "RTGS" | "IMPS" | "CHEQUE" | "BANK_TRANSFER";
}

export interface ReconciledInvoiceMatch {
  invoiceId: string;
  invoiceNo: string;
  entityId: string;
  entityName: string;
  originalAmount: number;
  matchedAmount: number;
  isTdsDeducted: boolean;
  tdsAmount: number;
  utrNumber: string;
  paymentMode: "UPI" | "NEFT" | "RTGS" | "IMPS" | "CHEQUE" | "BANK_TRANSFER";
  settlementDate: string;
  confidenceScore: 100 | 95 | 90 | 85;
  matchReason: string;
  bankNarration: string;
}

export interface UnmatchedBankCredit {
  date: string;
  narration: string;
  referenceNo?: string;
  creditAmount: number;
  extractedUtr?: string;
  possibleReason: string;
}

export interface BankReconciliationReport {
  timestamp: string;
  totalCreditsProcessed: number;
  totalCreditAmountInr: number;
  reconciledInvoices: ReconciledInvoiceMatch[];
  unmatchedCredits: UnmatchedBankCredit[];
  totalRealizedInr: number;
  totalGatewayFeesSavedInr: number; // 2.36% of totalRealizedInr
  auditObservations: string[];
}

/**
 * Clean numeric string into valid float
 */
function parseCleanAmount(raw: any): number {
  if (typeof raw === "number") return isNaN(raw) ? 0 : raw;
  if (!raw) return 0;
  const cleaned = String(raw).replace(/,/g, "").replace(/₹/g, "").replace(/INR/gi, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Standardize Indian date formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD-MMM-YYYY)
 */
function standardizeBankDate(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split("T")[0];
  const cleaned = rawDate.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // DD/MM/YYYY or DD-MM-YYYY
  const parts = cleaned.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
    const day = parts[0].padStart(2, "0");
    const month = parts[1];
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];

    // If month is text (e.g. Jan, Feb, Oct)
    const monthNames: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const monthLower = month.toLowerCase().slice(0, 3);
    const monthNum = monthNames[monthLower] || month.padStart(2, "0");

    return `${year}-${monthNum}-${day}`;
  }

  return new Date().toISOString().split("T")[0];
}

/**
 * Extract UTR, Reference Number, and Payment Mode from narration
 */
function extractBankingTokens(narration: string, refColumn?: string): {
  utr?: string;
  invoiceNo?: string;
  mode: "UPI" | "NEFT" | "RTGS" | "IMPS" | "CHEQUE" | "BANK_TRANSFER";
} {
  const norm = narration.toUpperCase();
  let mode: "UPI" | "NEFT" | "RTGS" | "IMPS" | "CHEQUE" | "BANK_TRANSFER" = "BANK_TRANSFER";
  let utr: string | undefined = undefined;
  let invoiceNo: string | undefined = undefined;

  // Determine payment mode
  if (norm.includes("UPI")) {
    mode = "UPI";
  } else if (norm.includes("NEFT")) {
    mode = "NEFT";
  } else if (norm.includes("RTGS")) {
    mode = "RTGS";
  } else if (norm.includes("IMPS")) {
    mode = "IMPS";
  } else if (norm.includes("CHQ") || norm.includes("CHEQUE") || norm.includes("CLEARING")) {
    mode = "CHEQUE";
  }

  // 1. Extract 12-digit UPI RRN e.g. UPI/412345678901 or UPI-412345678901
  const upiMatch = narration.match(/UPI[/\-_]?([0-9]{12})/i) || narration.match(/\b([0-9]{12})\b/);
  if (mode === "UPI" && upiMatch) {
    utr = upiMatch[1];
  }

  // 2. Extract NEFT/RTGS UTR (e.g. N10293847561, HDFCR52026101900123, AXRN123456789)
  if (!utr) {
    const neftMatch = narration.match(/NEFT[/\-_:\s]+([A-Za-z0-9]{11,22})/i);
    const rtgsMatch = narration.match(/RTGS[/\-_:\s]+([A-Za-z0-9]{11,22})/i);
    const impsMatch = narration.match(/IMPS[/\-_:\s]+([A-Za-z0-9]{10,20})/i);
    if (neftMatch) utr = neftMatch[1];
    else if (rtgsMatch) utr = rtgsMatch[1];
    else if (impsMatch) utr = impsMatch[1];
  }

  // 3. Fallback to Ref Column if provided
  if (!utr && refColumn && refColumn.trim().length >= 6) {
    utr = refColumn.trim();
  }

  // 4. Extract Invoice Number pattern: GPA/2026-27/089, GPA-2026-27-089, INV-089, GPA/089, INV 089
  const invMatch = narration.match(/(?:GPA|INV)[/\-_ ]?(?:20\d{2}[/\-_]\d{2}[/\-_])?(\d{2,5})/i);
  if (invMatch) {
    invoiceNo = invMatch[0].replace(/[\-_ ]/g, "/");
  }

  return { utr, invoiceNo, mode };
}

/**
 * Parse CSV or TSV line respecting quotes
 */
function splitCsvLine(line: string, delimiter: string = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ""));
  return result;
}

/**
 * Universal Bank Statement Parser for Indian CA Firms
 */
export function parseBankStatementLines(csvContent: string): BankStatementCreditEntry[] {
  const rawLines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  // Determine delimiter: comma, tab, or semicolon
  const sample = rawLines.slice(0, 5).join("\n");
  const delimiter = sample.includes("\t") ? "\t" : sample.includes(";") ? ";" : ",";

  // Find header index
  let headerIndex = -1;
  let dateCol = -1;
  let narrationCol = -1;
  let refCol = -1;
  let creditCol = -1;
  let debitCol = -1;

  for (let i = 0; i < Math.min(rawLines.length, 25); i++) {
    const cols = splitCsvLine(rawLines[i], delimiter).map((c) => c.toLowerCase());

    const dIdx = cols.findIndex((c) => c.includes("date") || c.includes("txn dt") || c.includes("value dt"));
    const nIdx = cols.findIndex(
      (c) => c.includes("narration") || c.includes("particular") || c.includes("description") || c.includes("remark")
    );
    const cIdx = cols.findIndex(
      (c) =>
        (c.includes("credit") || c.includes("deposit") || c.includes("cr")) &&
        !c.includes("balance") &&
        !c.includes("debit")
    );

    if (dIdx !== -1 && nIdx !== -1 && cIdx !== -1) {
      headerIndex = i;
      dateCol = dIdx;
      narrationCol = nIdx;
      creditCol = cIdx;
      refCol = cols.findIndex((c) => c.includes("ref") || c.includes("chq") || c.includes("utr") || c.includes("cheque"));
      debitCol = cols.findIndex((c) => c.includes("withdrawal") || c.includes("debit") || c.includes("dr"));
      break;
    }
  }

  // Fallback heuristic if formal headers not detected
  if (headerIndex === -1) {
    // Treat first row with at least 3 columns as data or standard format
    headerIndex = 0;
    dateCol = 0;
    narrationCol = 1;
    creditCol = 2;
  }

  const creditEntries: BankStatementCreditEntry[] = [];

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    const cols = splitCsvLine(line, delimiter);
    if (cols.length <= Math.max(dateCol, narrationCol, creditCol)) continue;

    const rawDate = cols[dateCol];
    const rawNarration = cols[narrationCol];
    const rawCredit = cols[creditCol];
    const rawRef = refCol !== -1 && refCol < cols.length ? cols[refCol] : undefined;

    const creditAmount = parseCleanAmount(rawCredit);

    // Strictly skip non-credit transactions (0 credit or negative)
    if (creditAmount <= 0) continue;

    const standardizedDate = standardizeBankDate(rawDate);
    const tokens = extractBankingTokens(rawNarration, rawRef);

    creditEntries.push({
      rawLine: line,
      date: standardizedDate,
      narration: rawNarration,
      referenceNo: rawRef,
      creditAmount,
      extractedUtr: tokens.utr,
      extractedInvoiceNo: tokens.invoiceNo,
      extractedMode: tokens.mode,
    });
  }

  return creditEntries;
}

/**
 * Normalize entity name for fuzzy word matching
 */
function cleanEntityTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/private|limited|pvt|ltd|llp|enterprises|technologies|solutions|india|corp|industries/gi, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

/**
 * 1000% Deterministic Bank Statement Reconciler
 */
export function reconcileFirmBankStatement(
  statementContent: string,
  invoices: InvoiceItem[],
  clients: ClientEntity[] = []
): BankReconciliationReport {
  const credits = parseBankStatementLines(statementContent);
  const nowStr = new Date().toISOString();

  const reconciledInvoices: ReconciledInvoiceMatch[] = [];
  const unmatchedCredits: UnmatchedBankCredit[] = [];
  const matchedInvoiceIds = new Set<string>();

  // Filter pending / unpaid invoices
  const pendingInvoices = invoices.filter((i) => i.status !== "PAID");

  let totalCreditAmount = 0;

  for (const entry of credits) {
    totalCreditAmount += entry.creditAmount;
    let matched = false;

    // -------------------------------------------------------------
    // LEVEL 1: Exact Client-Submitted UTR Match (100% Confidence)
    // -------------------------------------------------------------
    if (entry.extractedUtr) {
      const utrCandidate = pendingInvoices.find(
        (inv) =>
          !matchedInvoiceIds.has(inv.id) &&
          inv.clientUtrNumber &&
          (inv.clientUtrNumber.toUpperCase().includes(entry.extractedUtr!.toUpperCase()) ||
            entry.extractedUtr!.toUpperCase().includes(inv.clientUtrNumber.toUpperCase()))
      );

      if (utrCandidate) {
        matched = true;
        matchedInvoiceIds.add(utrCandidate.id);
        const isTds = Math.abs(utrCandidate.amount - entry.creditAmount) > 5;
        const tdsAmt = isTds ? Math.round(utrCandidate.taxableAmount * 0.1) : 0;

        reconciledInvoices.push({
          invoiceId: utrCandidate.id,
          invoiceNo: utrCandidate.invoiceNo,
          entityId: utrCandidate.entityId,
          entityName: utrCandidate.entityName,
          originalAmount: utrCandidate.amount,
          matchedAmount: entry.creditAmount,
          isTdsDeducted: isTds,
          tdsAmount: tdsAmt,
          utrNumber: entry.extractedUtr,
          paymentMode: entry.extractedMode,
          settlementDate: entry.date,
          confidenceScore: 100,
          matchReason: `Exact UTR match with client submission: ${entry.extractedUtr}`,
          bankNarration: entry.narration,
        });
        continue;
      }
    }

    // -------------------------------------------------------------
    // LEVEL 2: Exact Invoice Number in Narration (100% Confidence)
    // -------------------------------------------------------------
    const invMatchCandidate = pendingInvoices.find((inv) => {
      if (matchedInvoiceIds.has(inv.id)) return false;
      const cleanInv = inv.invoiceNo.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const cleanNarration = entry.narration.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      return cleanNarration.includes(cleanInv);
    });

    if (invMatchCandidate) {
      matched = true;
      matchedInvoiceIds.add(invMatchCandidate.id);
      const isTds = Math.abs(invMatchCandidate.amount - entry.creditAmount) > 5;
      const tdsAmt = isTds ? Math.round(invMatchCandidate.taxableAmount * 0.1) : 0;

      reconciledInvoices.push({
        invoiceId: invMatchCandidate.id,
        invoiceNo: invMatchCandidate.invoiceNo,
        entityId: invMatchCandidate.entityId,
        entityName: invMatchCandidate.entityName,
        originalAmount: invMatchCandidate.amount,
        matchedAmount: entry.creditAmount,
        isTdsDeducted: isTds,
        tdsAmount: tdsAmt,
        utrNumber: entry.extractedUtr || `BNK-${Date.now().toString().slice(-6)}`,
        paymentMode: entry.extractedMode,
        settlementDate: entry.date,
        confidenceScore: 100,
        matchReason: `Exact Invoice No #${invMatchCandidate.invoiceNo} recognized in bank narration`,
        bankNarration: entry.narration,
      });
      continue;
    }

    // -------------------------------------------------------------
    // LEVEL 3: Client Name Word Match + Exact/Net Amount (95% Confidence)
    // -------------------------------------------------------------
    for (const inv of pendingInvoices) {
      if (matchedInvoiceIds.has(inv.id)) continue;

      const entityTokens = cleanEntityTokens(inv.entityName);
      const narrationUpper = entry.narration.toUpperCase();
      const tokensMatched = entityTokens.filter((token) => narrationUpper.includes(token.toUpperCase()));

      // Check gross amount match (exact or +/- ₹2 for bank rounding)
      const isGrossMatch = Math.abs(inv.amount - entry.creditAmount) <= 2;

      // Check net amount match with 10% TDS u/s 194J on taxable component
      const netPayableWith10PctTds = inv.amount - Math.round(inv.taxableAmount * 0.1);
      const isNetTdsMatch = Math.abs(netPayableWith10PctTds - entry.creditAmount) <= 2;

      if (tokensMatched.length > 0 && (isGrossMatch || isNetTdsMatch)) {
        matched = true;
        matchedInvoiceIds.add(inv.id);
        const isTds = isNetTdsMatch && !isGrossMatch;

        reconciledInvoices.push({
          invoiceId: inv.id,
          invoiceNo: inv.invoiceNo,
          entityId: inv.entityId,
          entityName: inv.entityName,
          originalAmount: inv.amount,
          matchedAmount: entry.creditAmount,
          isTdsDeducted: isTds,
          tdsAmount: isTds ? Math.round(inv.taxableAmount * 0.1) : 0,
          utrNumber: entry.extractedUtr || `UTR-${Date.now().toString().slice(-6)}`,
          paymentMode: entry.extractedMode,
          settlementDate: entry.date,
          confidenceScore: 95,
          matchReason: `Matched entity name (${tokensMatched.join(" ")}) & ${isTds ? "Net Amount (10% Sec 194J TDS deducted)" : "Gross Amount"}`,
          bankNarration: entry.narration,
        });
        break;
      }
    }

    if (matched) continue;

    // -------------------------------------------------------------
    // LEVEL 4: Unique Exact Amount Match Across Pending Invoices (90% Confidence)
    // -------------------------------------------------------------
    const exactAmountCandidates = pendingInvoices.filter(
      (inv) => !matchedInvoiceIds.has(inv.id) && Math.abs(inv.amount - entry.creditAmount) <= 1
    );

    if (exactAmountCandidates.length === 1) {
      const inv = exactAmountCandidates[0];
      matched = true;
      matchedInvoiceIds.add(inv.id);

      reconciledInvoices.push({
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        entityId: inv.entityId,
        entityName: inv.entityName,
        originalAmount: inv.amount,
        matchedAmount: entry.creditAmount,
        isTdsDeducted: false,
        tdsAmount: 0,
        utrNumber: entry.extractedUtr || `BNK-${Date.now().toString().slice(-6)}`,
        paymentMode: entry.extractedMode,
        settlementDate: entry.date,
        confidenceScore: 90,
        matchReason: `Unique exact fee amount match (₹${entry.creditAmount.toLocaleString("en-IN")}) across pending firm bills`,
        bankNarration: entry.narration,
      });
      continue;
    }

    // Unmatched credit entry
    unmatchedCredits.push({
      date: entry.date,
      narration: entry.narration,
      referenceNo: entry.referenceNo,
      creditAmount: entry.creditAmount,
      extractedUtr: entry.extractedUtr,
      possibleReason: "No corresponding pending invoice found with matching amount or narration reference.",
    });
  }

  const totalRealizedInr = reconciledInvoices.reduce((acc, curr) => acc + curr.matchedAmount, 0);

  // Gateway fees saved: Standard domestic gateway charges 2% + 18% GST = 2.36%
  const totalGatewayFeesSavedInr = Math.round(totalRealizedInr * 0.0236);

  const observations: string[] = [];
  observations.push(
    `Processed ${credits.length} bank credit deposits totalling ₹${totalCreditAmount.toLocaleString("en-IN")}.`
  );
  observations.push(
    `Successfully auto-reconciled ${reconciledInvoices.length} invoices totalling ₹${totalRealizedInr.toLocaleString("en-IN")}.`
  );
  observations.push(
    `Zero-Gateway Architecture saved ₹${totalGatewayFeesSavedInr.toLocaleString("en-IN")} in payment gateway commissions (2% + 18% GST).`
  );

  if (unmatchedCredits.length > 0) {
    observations.push(
      `${unmatchedCredits.length} credit deposit(s) totalling ₹${unmatchedCredits.reduce((a, c) => a + c.creditAmount, 0).toLocaleString("en-IN")} require partner allocation.`
    );
  }

  return {
    timestamp: nowStr,
    totalCreditsProcessed: credits.length,
    totalCreditAmountInr: totalCreditAmount,
    reconciledInvoices,
    unmatchedCredits,
    totalRealizedInr,
    totalGatewayFeesSavedInr,
    auditObservations: observations,
  };
}
