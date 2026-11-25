/**
 * Native Excel (.xlsx / .xls) & Multi-Sheet Workpaper Engine powered by SheetJS (xlsx)
 * Handles:
 * - Tally / Busy / Zoho / Marg Purchase & Sales Registers (.xlsx / .xls)
 * - Official GSTN GSTR-2B Excel Downloads (multi-sheet B2B, B2BA, CDNR, CDNRA, IMPG, ISD)
 * - Official GSTN IMS Excel Downloads
 * - Multi-sheet Audit Workpaper .xlsx Exports
 */

import * as XLSX from "xlsx";
import { Gstr2bInvoice, BooksPurchaseInvoice } from "@/lib/gst/recoMatcher";
import { parseDelimitedRow } from "@/lib/parsers/gstr2bParser";

function cleanNum(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (val === undefined || val === null) return 0;
  const s = String(val).trim();
  if (!s) return 0;
  const neg = s.startsWith("(") && s.endsWith(")");
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) return 0;
  return neg ? -Math.abs(n) : n;
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

function normalizeDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number" && val > 20000 && val < 80000) {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
  }
  const s = String(val).trim();
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
  const monthAbbr: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const dMmmY = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{2,4})$/);
  if (dMmmY && monthAbbr[dMmmY[2].toLowerCase()]) {
    const yr = dMmmY[3].length === 2 ? `20${dMmmY[3]}` : dMmmY[3];
    return `${yr}-${monthAbbr[dMmmY[2].toLowerCase()]}-${dMmmY[1].padStart(2, "0")}`;
  }
  return s;
}

export interface TabularSheetPreview {
  sheetName: string;
  headers: string[];
  rows: any[][];
}

export function readExcelSheetsFromBuffer(buffer: ArrayBuffer): TabularSheetPreview[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    // Find first header-like row (at least 3 non-empty cells)
    let headerIdx = aoa.findIndex((r) => r.filter((c) => String(c).trim() !== "").length >= 3);
    if (headerIdx === -1) headerIdx = 0;
    const headers = (aoa[headerIdx] || []).map((h) => String(h).trim());
    const rows = aoa.slice(headerIdx + 1).filter((r) => r.some((c) => String(c).trim() !== ""));
    return { sheetName: name, headers, rows };
  });
}

export interface ColumnMapping {
  gstinCol: number;
  nameCol: number;
  invNoCol: number;
  dateCol: number;
  taxableCol: number;
  igstCol: number;
  cgstCol: number;
  sgstCol: number;
  cessCol: number;
  totalTaxCol: number;
  totalValCol: number;
  hsnCol: number;
  descCol: number;
  posCol: number;
  rateCol: number;
  vtypeCol: number;
  daysCol: number;
  irnCol: number;
}

export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const norm = headers.map((h) => h.toLowerCase().trim());
  const find = (patterns: string[]) =>
    norm.findIndex((h) => patterns.some((p) => h.includes(p)));

  return {
    gstinCol: find(["gstin", "gst no", "uin", "ctin"]),
    nameCol: find(["party", "vendor", "supplier", "customer", "buyer", "trade name", "particulars", "name"]),
    invNoCol: find(["inv", "bill", "voucher no", "doc no", "note no", "document"]),
    dateCol: find(["date", "dt"]),
    taxableCol: find(["taxable", "assessable", "basic", "net amount"]),
    igstCol: find(["igst", "integrated"]),
    cgstCol: find(["cgst", "central"]),
    sgstCol: find(["sgst", "utgst", "state tax"]),
    cessCol: find(["cess"]),
    totalTaxCol: norm.findIndex((h) => h === "tax" || h.includes("total tax") || h.includes("gst amount")),
    totalValCol: find(["invoice value", "grand total", "total value", "gross total"]),
    hsnCol: find(["hsn", "sac"]),
    descCol: find(["item", "description", "narration", "goods"]),
    posCol: find(["pos", "place of supply", "state"]),
    rateCol: find(["rate", "gst %", "tax %"]),
    vtypeCol: find(["voucher type", "doc type", "note type", "type"]),
    daysCol: find(["days", "ageing", "overdue"]),
    irnCol: find(["irn"]),
  };
}

/**
 * Parses an Excel Purchase Register using auto-detected or user-adjusted column mapping.
 */
export function parsePurchaseExcelBuffer(
  buffer: ArrayBuffer,
  customMapping?: Partial<ColumnMapping>,
  sheetIndex: number = 0
): {
  success: boolean;
  invoices: BooksPurchaseInvoice[];
  headers: string[];
  mapping: ColumnMapping;
  errors: string[];
} {
  const sheets = readExcelSheetsFromBuffer(buffer);
  const sheet = sheets[sheetIndex];
  if (!sheet || sheet.rows.length === 0) {
    return {
      success: false,
      invoices: [],
      headers: [],
      mapping: autoDetectColumnMapping([]),
      errors: ["Excel sheet is empty."],
    };
  }

  const mapping: ColumnMapping = {
    ...autoDetectColumnMapping(sheet.headers),
    ...(customMapping || {}),
  };

  const invoices: BooksPurchaseInvoice[] = [];
  let rowIdx = 1;

  for (const row of sheet.rows) {
    const get = (idx: number) => (idx >= 0 && idx < row.length ? row[idx] : "");
    const vendorGstin = String(get(mapping.gstinCol) || "").trim().toUpperCase();
    const vendorName = String(get(mapping.nameCol) || "Vendor").trim();
    const invoiceNumber = String(get(mapping.invNoCol) || `BK-${rowIdx}`).trim();

    if (!invoiceNumber || /^(grand\s*)?(sub)?total$/i.test(invoiceNumber) || /^total$/i.test(vendorName)) {
      continue;
    }

    const rawTaxable = cleanNum(get(mapping.taxableCol));
    const rawIgst = cleanNum(get(mapping.igstCol));
    const rawCgst = cleanNum(get(mapping.cgstCol));
    const rawSgst = cleanNum(get(mapping.sgstCol));
    const rawCess = cleanNum(get(mapping.cessCol));
    const rawTotalTax =
      mapping.totalTaxCol >= 0 ? cleanNum(get(mapping.totalTaxCol)) : round2(rawIgst + rawCgst + rawSgst + rawCess);

    if (rawTaxable === 0 && rawTotalTax === 0 && !vendorGstin) continue;

    const vTypeStr = String(get(mapping.vtypeCol) || "").toUpperCase();
    const isCreditNote =
      vTypeStr.includes("CREDIT") || vTypeStr === "CRN" || vTypeStr === "CN" || rawTaxable < 0 || rawTotalTax < 0;

    const taxableValue = Math.abs(round2(rawTaxable));
    const igst = Math.abs(round2(rawIgst));
    const cgst = Math.abs(round2(rawCgst));
    const sgst = Math.abs(round2(rawSgst));
    const cess = Math.abs(round2(rawCess));
    const totalTax = Math.abs(round2(rawTotalTax || igst + cgst + sgst + cess));
    const totalInvoiceValue =
      mapping.totalValCol >= 0 && cleanNum(get(mapping.totalValCol)) !== 0
        ? Math.abs(round2(cleanNum(get(mapping.totalValCol))))
        : round2(taxableValue + totalTax);

    const daysOutstanding =
      mapping.daysCol >= 0 ? Math.max(0, Math.round(cleanNum(get(mapping.daysCol)))) : undefined;

    invoices.push({
      id: `bk-xlsx-${rowIdx++}`,
      voucherNumber: `XLSX-${rowIdx}`,
      vendorGstin,
      vendorName,
      invoiceNumber,
      invoiceDate: normalizeDate(get(mapping.dateCol)),
      taxableValue,
      igst,
      cgst,
      sgst,
      cess,
      totalTax,
      totalInvoiceValue,
      hsnCode: mapping.hsnCol >= 0 ? String(get(mapping.hsnCol) || "").trim() : undefined,
      itemDescription: mapping.descCol >= 0 ? String(get(mapping.descCol) || "").trim() : undefined,
      voucherType: isCreditNote ? "CREDIT_NOTE" : vTypeStr.includes("DEBIT") ? "DEBIT_NOTE" : "PURCHASE",
      daysOutstanding,
      paymentStatus: daysOutstanding && daysOutstanding > 0 ? "UNPAID" : "PAID",
    });
  }

  return {
    success: invoices.length > 0,
    invoices,
    headers: sheet.headers,
    mapping,
    errors: invoices.length === 0 ? ["No valid purchase rows extracted. Check column mapping."] : [],
  };
}

/**
 * Parses Official GSTN GSTR-2B Excel (.xlsx) download (multi-sheet B2B, B2BA, CDNR, CDNRA, IMPG, ISD).
 */
export function parseGstr2bExcelBuffer(buffer: ArrayBuffer): {
  success: boolean;
  invoices: Gstr2bInvoice[];
  errors: string[];
} {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const invoices: Gstr2bInvoice[] = [];
  let idx = 1;

  for (const sheetName of wb.SheetNames) {
    const upper = sheetName.toUpperCase();
    if (upper.includes("READ ME") || upper.includes("SUMMARY") || upper.includes("ITC AVAILABLE")) continue;

    const ws = wb.Sheets[sheetName];
    const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const headerIdx = aoa.findIndex((r) =>
      r.some((c) => /gstin|invoice|note|boe/i.test(String(c)))
    );
    if (headerIdx === -1) continue;

    const headers = aoa[headerIdx].map((h) => String(h).toLowerCase().trim());
    const col = (kws: string[]) => headers.findIndex((h) => kws.some((k) => h.includes(k)));

    const cGstin = col(["gstin of supplier", "gstin", "ctin"]);
    const cName = col(["trade/legal name", "trade name", "supplier name", "name"]);
    const cInv = col(["invoice number", "note number", "boe number", "doc number"]);
    const cDt = col(["invoice date", "note date", "boe date", "date"]);
    const cType = col(["invoice type", "note type", "supply type"]);
    const cPos = col(["place of supply", "pos"]);
    const cRcm = col(["reverse charge", "rcm"]);
    const cTaxable = col(["taxable value", "taxable"]);
    const cIgst = col(["integrated tax", "igst"]);
    const cCgst = col(["central tax", "cgst"]);
    const cSgst = col(["state/ut tax", "state tax", "sgst"]);
    const cCess = col(["cess"]);
    const cVal = col(["invoice value", "note value"]);
    const cAvail = col(["itc availability", "itc available"]);
    const cRsn = col(["reason"]);

    const isCdnr = upper.includes("CDNR");
    const isImpg = upper.includes("IMPG");
    const isIsd = upper.includes("ISD");

    for (let r = headerIdx + 1; r < aoa.length; r++) {
      const row = aoa[r];
      const get = (i: number) => (i >= 0 && i < row.length ? row[i] : "");
      const invNo = String(get(cInv) || "").trim();
      const vendorGstin = String(get(cGstin) || "").trim().toUpperCase();
      if (!invNo || /^(total|grand)/i.test(invNo)) continue;
      if (!vendorGstin && !isImpg) continue;

      const taxableValue = Math.abs(round2(cleanNum(get(cTaxable))));
      const igst = Math.abs(round2(cleanNum(get(cIgst))));
      const cgst = Math.abs(round2(cleanNum(get(cCgst))));
      const sgst = Math.abs(round2(cleanNum(get(cSgst))));
      const cess = Math.abs(round2(cleanNum(get(cCess))));
      const totalTax = round2(igst + cgst + sgst + cess);
      if (taxableValue === 0 && totalTax === 0) continue;

      const typeStr = String(get(cType) || "").toUpperCase();
      const invType: Gstr2bInvoice["invoiceType"] = isCdnr
        ? typeStr.includes("DEBIT") || typeStr === "D"
          ? "DBN"
          : "CRN"
        : isImpg
        ? "IMPG"
        : isIsd
        ? "ISD"
        : "R";

      const availStr = String(get(cAvail) || "YES").toUpperCase();
      const itcAvailable = !availStr.startsWith("N");

      invoices.push({
        id: `2b-xlsx-${idx++}`,
        vendorGstin: vendorGstin || "ICEGATE-IMPORT",
        vendorTradeName: String(get(cName) || vendorGstin || "Vendor").trim(),
        invoiceNumber: invNo,
        invoiceDate: normalizeDate(get(cDt)),
        invoiceType: invType,
        placeOfSupply: String(get(cPos) || ""),
        reverseCharge: String(get(cRcm) || "").toUpperCase().startsWith("Y"),
        taxableValue,
        igst,
        cgst,
        sgst,
        cess,
        totalTax,
        totalInvoiceValue: cleanNum(get(cVal)) || round2(taxableValue + totalTax),
        gstr3bFilingStatus: "FILED",
        itcAvailable,
        itcIneligibilityReason: !itcAvailable ? String(get(cRsn) || "Marked No in GSTR-2B Excel") : undefined,
        sectionSource: upper.includes("B2BA")
          ? "B2BA"
          : upper.includes("CDNRA")
          ? "CDNRA"
          : isCdnr
          ? "CDNR"
          : isImpg
          ? "IMPG"
          : isIsd
          ? "ISD"
          : "B2B",
      });
    }
  }

  return {
    success: invoices.length > 0,
    invoices,
    errors: invoices.length === 0 ? ["No GSTR-2B invoice rows found in Excel workbook."] : [],
  };
}

/**
 * Parses CSV/TSV text into a TabularSheetPreview for column mapping or Sales Register parsing.
 */
export function parseDelimitedTextToTable(text: string): TabularSheetPreview {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { sheetName: "CSV", headers: [], rows: [] };
  const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = parseDelimitedRow(lines[0], delim);
  const rows = lines.slice(1).map((l) => parseDelimitedRow(l, delim));
  return { sheetName: "CSV", headers, rows };
}

/**
 * Exports multi-sheet .xlsx workbook in browser.
 */
export function downloadWorkbookXlsx(
  filename: string,
  sheets: Array<{ name: string; rows: Record<string, any>[] }>
) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows.length > 0 ? s.rows : [{ Status: "No Records" }]);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}
