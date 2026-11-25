/**
 * Enterprise GSTR-2B & Purchase Register File Parser
 * Supports:
 * - Official GSTN GSTR-2B JSON (b2b, b2ba, cdnr, cdnra, impg, impgsez, isd, isda)
 * - RFC-4180 CSV / TSV Purchase Registers (Tally, Busy, Zoho, Marg, Excel CSV)
 * - Tally Prime Purchase Voucher XML exports
 */

import { Gstr2bInvoice, BooksPurchaseInvoice } from "@/lib/gst/recoMatcher";

export interface Gstr2bParseResult {
  success: boolean;
  gstin?: string;
  returnPeriod?: string;
  totalInvoices: number;
  totalTaxableValue: number;
  totalTax: number;
  invoices: Gstr2bInvoice[];
  errors: string[];
}

export interface PurchaseRegisterParseResult {
  success: boolean;
  totalInvoices: number;
  totalTaxableValue: number;
  totalTax: number;
  invoices: BooksPurchaseInvoice[];
  errors: string[];
}

function cleanNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (val === undefined || val === null) return 0;
  const raw = String(val).trim();
  if (!raw) return 0;
  const isParenNeg = raw.startsWith("(") && raw.endsWith(")");
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return isParenNeg ? -Math.abs(num) : num;
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

function standardizeDate(val: string): string {
  if (!val) return "";
  const s = String(val).trim();

  // Tally YYYYMMDD
  const tallyMatch = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (tallyMatch) {
    return `${tallyMatch[1]}-${tallyMatch[2]}-${tallyMatch[3]}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }

  // DD-MMM-YYYY or DD-MMM-YY (e.g., 14-Sep-2026 or 14-Sep-26)
  const monthAbbr: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const dMmmY = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{2,4})$/);
  if (dMmmY) {
    const mm = monthAbbr[dMmmY[2].toLowerCase()];
    if (mm) {
      const yr = dMmmY[3].length === 2 ? `20${dMmmY[3]}` : dMmmY[3];
      return `${yr}-${mm}-${dMmmY[1].padStart(2, "0")}`;
    }
  }

  // YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[3].padStart(2, "0")}`;
  }

  return s;
}

function sumTaxItems(items: any[], directObj?: any) {
  let taxableValue = 0;
  let igst = 0;
  let cgst = 0;
  let sgst = 0;
  let cess = 0;

  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      taxableValue += cleanNumber(item.txval);
      igst += cleanNumber(item.igst ?? item.iamt);
      cgst += cleanNumber(item.cgst ?? item.camt);
      sgst += cleanNumber(item.sgst ?? item.samt);
      cess += cleanNumber(item.cess ?? item.csamt);
    }
  } else if (directObj) {
    taxableValue = cleanNumber(directObj.txval);
    igst = cleanNumber(directObj.igst ?? directObj.iamt);
    cgst = cleanNumber(directObj.cgst ?? directObj.camt);
    sgst = cleanNumber(directObj.sgst ?? directObj.samt);
    cess = cleanNumber(directObj.cess ?? directObj.csamt);
  }

  const totalTax = round2(igst + cgst + sgst + cess);
  return {
    taxableValue: round2(taxableValue),
    igst: round2(igst),
    cgst: round2(cgst),
    sgst: round2(sgst),
    cess: round2(cess),
    totalTax,
  };
}

/**
 * Parse Official Government GSTN GSTR-2B JSON
 * Handles b2b, b2ba, cdnr, cdnra, impg, impgsez, isd, isda
 */
export function parseOfficialGstr2bJson(jsonContent: string | object): Gstr2bParseResult {
  const errors: string[] = [];
  const invoices: Gstr2bInvoice[] = [];

  let data: any;
  try {
    data = typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;
  } catch (e: any) {
    return {
      success: false,
      totalInvoices: 0,
      totalTaxableValue: 0,
      totalTax: 0,
      invoices: [],
      errors: [`Invalid GSTR-2B JSON format: ${e.message}`],
    };
  }

  const gstin = (data.gstin || data.data?.gstin || "").toUpperCase();
  const returnPeriod = data.fp || data.data?.fp || data.rtnprd || data.data?.rtnprd || "";
  const docData = data.data?.docdata || data.docdata || data;

  let idx = 1;

  // 1. B2B & B2BA
  const processB2bSection = (list: any[], isAmended: boolean) => {
    if (!Array.isArray(list)) return;
    for (const vendor of list) {
      const vendorGstin = (vendor.ctin || vendor.gstin || "").trim().toUpperCase();
      const vendorTradeName = vendor.trdnm || vendor.legal_name || vendorGstin;
      const gstr1FilingDate = standardizeDate(vendor.supfildt || "");
      const gstr1Period = vendor.supprd || returnPeriod;

      for (const inv of vendor.inv || []) {
        const invoiceNumber = String(inv.inum || inv.inv_no || "").trim();
        const invoiceDate = standardizeDate(inv.dt || inv.inv_dt || "");
        const sums = sumTaxItems(inv.items, inv);
        const totalInvoiceValue = cleanNumber(inv.val || inv.inv_val) || round2(sums.taxableValue + sums.totalTax);
        const itcAvailable = inv.itcavl !== "N";
        const gstr3bFilingStatus =
          inv.filing_status === "N" || vendor.gstr3b_status === "N" ? "NOT_FILED" : "FILED";

        invoices.push({
          id: `2b-${isAmended ? "b2ba" : "b2b"}-${idx++}`,
          vendorGstin,
          vendorTradeName,
          invoiceNumber,
          invoiceDate,
          invoiceType: (inv.inv_typ || inv.typ || "R") as any,
          placeOfSupply: String(inv.pos || ""),
          reverseCharge: inv.rchrg === "Y" || inv.rev === "Y" || inv.rev_charge === true,
          taxableValue: sums.taxableValue,
          igst: sums.igst,
          cgst: sums.cgst,
          sgst: sums.sgst,
          cess: sums.cess,
          totalTax: sums.totalTax,
          totalInvoiceValue,
          gstr1FilingDate,
          gstr1Period,
          gstr3bFilingStatus,
          itcAvailable,
          itcIneligibilityReason: inv.rsn || (!itcAvailable ? "Marked ITC Not Available (itcavl=N) in GSTR-2B" : undefined),
          sectionSource: isAmended ? "B2BA" : "B2B",
        });
      }
    }
  };

  processB2bSection(docData.b2b || [], false);
  processB2bSection(docData.b2ba || [], true);

  // 2. CDNR & CDNRA
  const processCdnrSection = (list: any[], isAmended: boolean) => {
    if (!Array.isArray(list)) return;
    for (const vendor of list) {
      const vendorGstin = (vendor.ctin || vendor.gstin || "").trim().toUpperCase();
      const vendorTradeName = vendor.trdnm || vendorGstin;
      const gstr1FilingDate = standardizeDate(vendor.supfildt || "");
      const gstr1Period = vendor.supprd || returnPeriod;

      for (const nt of vendor.nt || []) {
        const noteNumber = String(nt.ntnum || nt.nt_num || nt.inum || "").trim();
        const noteDate = standardizeDate(nt.dt || nt.nt_dt || "");
        const noteType = nt.typ === "C" || nt.ntty === "C" ? "CRN" : "DBN";
        const sums = sumTaxItems(nt.items, nt);
        const totalNoteValue = cleanNumber(nt.val) || round2(sums.taxableValue + sums.totalTax);
        const itcAvailable = nt.itcavl !== "N";

        invoices.push({
          id: `2b-${isAmended ? "cdnra" : "cdnr"}-${idx++}`,
          vendorGstin,
          vendorTradeName,
          invoiceNumber: noteNumber,
          invoiceDate: noteDate,
          invoiceType: noteType,
          placeOfSupply: String(nt.pos || ""),
          reverseCharge: nt.rchrg === "Y" || nt.rev === "Y",
          taxableValue: sums.taxableValue,
          igst: sums.igst,
          cgst: sums.cgst,
          sgst: sums.sgst,
          cess: sums.cess,
          totalTax: sums.totalTax,
          totalInvoiceValue: totalNoteValue,
          gstr1FilingDate,
          gstr1Period,
          gstr3bFilingStatus: nt.filing_status === "N" ? "NOT_FILED" : "FILED",
          itcAvailable,
          itcIneligibilityReason: nt.rsn || (!itcAvailable ? "Marked ITC Not Available in GSTR-2B" : undefined),
          sectionSource: isAmended ? "CDNRA" : "CDNR",
        });
      }
    }
  };

  processCdnrSection(docData.cdnr || [], false);
  processCdnrSection(docData.cdnra || [], true);

  // 3. IMPG & IMPGSEZ (ICEGATE Imports of Goods / SEZ)
  const processImpgSection = (list: any[], isSez: boolean) => {
    if (!Array.isArray(list)) return;
    for (const boe of list) {
      const boeNum = String(boe.boenum || boe.refnum || `BOE-${idx}`).trim();
      const boeDate = standardizeDate(boe.boedt || boe.refdt || "");
      const vendorGstin = (boe.ctin || boe.sgstin || (isSez ? "SEZ-IMPORT" : "ICEGATE-IMPORT")).toUpperCase();
      const vendorTradeName = boe.trdnm || (isSez ? `SEZ Import (Port ${boe.portcd || "ICEGATE"})` : `Import BOE (Port ${boe.portcd || "ICEGATE"})`);
      const taxableValue = round2(cleanNumber(boe.txval));
      const igst = round2(cleanNumber(boe.igst ?? boe.iamt));
      const cess = round2(cleanNumber(boe.cess ?? boe.csamt));
      const totalTax = round2(igst + cess);

      invoices.push({
        id: `2b-${isSez ? "impgsez" : "impg"}-${idx++}`,
        vendorGstin,
        vendorTradeName,
        invoiceNumber: boeNum,
        invoiceDate: boeDate,
        invoiceType: isSez ? "SEWP" : "IMPG",
        placeOfSupply: gstin ? gstin.substring(0, 2) : "",
        reverseCharge: false,
        taxableValue,
        igst,
        cgst: 0,
        sgst: 0,
        cess,
        totalTax,
        totalInvoiceValue: round2(taxableValue + totalTax),
        gstr1Period: returnPeriod,
        gstr3bFilingStatus: "FILED",
        itcAvailable: boe.itcavl !== "N",
        sectionSource: isSez ? "IMPGSEZ" : "IMPG",
      });
    }
  };

  processImpgSection(docData.impg || [], false);
  processImpgSection(docData.impgsez || [], true);

  // 4. ISD & ISDA (Input Service Distributor credits)
  const processIsdSection = (list: any[], isAmended: boolean) => {
    if (!Array.isArray(list)) return;
    for (const sender of list) {
      const vendorGstin = (sender.ctin || "").trim().toUpperCase();
      const vendorTradeName = sender.trdnm || `ISD ${vendorGstin}`;
      for (const doc of sender.doclist || []) {
        const isdType = doc.isd_docty === "ISDCN" ? "CRN" : "ISD";
        const igst = round2(cleanNumber(doc.igst ?? doc.iamt));
        const cgst = round2(cleanNumber(doc.cgst ?? doc.camt));
        const sgst = round2(cleanNumber(doc.sgst ?? doc.samt));
        const cess = round2(cleanNumber(doc.cess ?? doc.csamt));
        const totalTax = round2(igst + cgst + sgst + cess);
        invoices.push({
          id: `2b-${isAmended ? "isda" : "isd"}-${idx++}`,
          vendorGstin,
          vendorTradeName,
          invoiceNumber: String(doc.docnum || `ISD-${idx}`).trim(),
          invoiceDate: standardizeDate(doc.docdt || ""),
          invoiceType: isdType as any,
          placeOfSupply: gstin ? gstin.substring(0, 2) : "",
          reverseCharge: false,
          taxableValue: 0,
          igst,
          cgst,
          sgst,
          cess,
          totalTax,
          totalInvoiceValue: totalTax,
          gstr1Period: returnPeriod,
          gstr3bFilingStatus: "FILED",
          itcAvailable: doc.itcavl !== "N",
          sectionSource: isAmended ? "ISDA" : "ISD",
        });
      }
    }
  };

  processIsdSection(docData.isd || [], false);
  processIsdSection(docData.isda || [], true);

  const signedTaxable = invoices.reduce(
    (acc, i) => acc + (i.invoiceType === "CRN" ? -i.taxableValue : i.taxableValue),
    0
  );
  const signedTax = invoices.reduce(
    (acc, i) => acc + (i.invoiceType === "CRN" ? -i.totalTax : i.totalTax),
    0
  );

  if (invoices.length === 0) {
    errors.push("No B2B, B2BA, CDNR, IMPG, or ISD records found in GSTR-2B JSON.");
  }

  return {
    success: invoices.length > 0,
    gstin,
    returnPeriod,
    totalInvoices: invoices.length,
    totalTaxableValue: round2(signedTaxable),
    totalTax: round2(signedTax),
    invoices,
    errors,
  };
}

/**
 * RFC-4180 compliant row splitter that safely handles quoted commas (e.g., "1,25,000.00")
 */
export function parseDelimitedRow(line: string, delimiter: string): string[] {
  if (delimiter !== ",") {
    return line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
  }
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Parse Tally Prime Purchase Voucher XML Export
 */
export function parseTallyPurchaseXml(xmlContent: string): PurchaseRegisterParseResult {
  const invoices: BooksPurchaseInvoice[] = [];
  const errors: string[] = [];
  const voucherMatches = xmlContent.match(/<VOUCHER\b[\s\S]*?<\/VOUCHER>/gi) || [];

  let rowIdx = 1;
  for (const v of voucherMatches) {
    const getTag = (tag: string) => {
      const m = v.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };
    const vType = getTag("VOUCHERTYPENAME").toUpperCase();
    if (vType && !vType.includes("PURCHASE") && !vType.includes("DEBIT") && !vType.includes("CREDIT") && !vType.includes("JOURNAL")) {
      continue;
    }
    const vendorGstin = (getTag("PARTYGSTIN") || getTag("BUYERPIN") || "").toUpperCase();
    const vendorName = getTag("PARTYLEDGERNAME") || getTag("PARTYNAME") || "Vendor";
    const invoiceNumber = getTag("REFERENCE") || getTag("VOUCHERNUMBER") || `TALLY-${rowIdx}`;
    const invoiceDate = standardizeDate(getTag("REFERENCEDATE") || getTag("DATE"));

    let igst = 0;
    let cgst = 0;
    let sgst = 0;
    let cess = 0;
    let taxableValue = 0;

    const ledgerBlocks = v.match(/<ALLLEDGERENTRIES\.LIST[\s\S]*?<\/ALLLEDGERENTRIES\.LIST>/gi) || [];
    for (const lb of ledgerBlocks) {
      const lname = (lb.match(/<LEDGERNAME[^>]*>([\s\S]*?)<\/LEDGERNAME>/i)?.[1] || "").toLowerCase();
      const amt = Math.abs(cleanNumber(lb.match(/<AMOUNT[^>]*>([\s\S]*?)<\/AMOUNT>/i)?.[1]));
      if (!amt) continue;
      if (lname.includes("igst")) igst += amt;
      else if (lname.includes("cgst")) cgst += amt;
      else if (lname.includes("sgst") || lname.includes("utgst")) sgst += amt;
      else if (lname.includes("cess")) cess += amt;
      else if (lname !== vendorName.toLowerCase()) taxableValue += amt;
    }

    const totalTax = round2(igst + cgst + sgst + cess);
    if (taxableValue === 0 && totalTax === 0) continue;

    invoices.push({
      id: `bk-xml-${rowIdx++}`,
      voucherNumber: getTag("VOUCHERNUMBER") || `VCH-${rowIdx}`,
      vendorGstin,
      vendorName,
      invoiceNumber,
      invoiceDate,
      taxableValue: round2(taxableValue),
      igst: round2(igst),
      cgst: round2(cgst),
      sgst: round2(sgst),
      cess: round2(cess),
      totalTax,
      totalInvoiceValue: round2(taxableValue + totalTax),
      voucherType: vType.includes("CREDIT") ? "CREDIT_NOTE" : vType.includes("DEBIT") ? "DEBIT_NOTE" : "PURCHASE",
      paymentStatus: "PAID",
    });
  }

  if (invoices.length === 0) {
    errors.push("No Purchase / Debit Note / Credit Note vouchers extracted from Tally XML.");
  }

  return {
    success: invoices.length > 0,
    totalInvoices: invoices.length,
    totalTaxableValue: round2(invoices.reduce((a, b) => a + b.taxableValue, 0)),
    totalTax: round2(invoices.reduce((a, b) => a + b.totalTax, 0)),
    invoices,
    errors,
  };
}

/**
 * Parse Purchase Register CSV, TSV, or Tally XML
 */
export function parsePurchaseRegisterCsv(content: string): PurchaseRegisterParseResult {
  const errors: string[] = [];
  const invoices: BooksPurchaseInvoice[] = [];

  if (!content || !content.trim()) {
    return { success: false, totalInvoices: 0, totalTaxableValue: 0, totalTax: 0, invoices: [], errors: ["File content is empty"] };
  }

  if (content.trim().startsWith("<") && content.toUpperCase().includes("<VOUCHER")) {
    return parseTallyPurchaseXml(content);
  }

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { success: false, totalInvoices: 0, totalTaxableValue: 0, totalTax: 0, invoices: [], errors: ["Insufficient rows in file"] };
  }

  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headerTokens = parseDelimitedRow(lines[0], delimiter).map((t) =>
    t.trim().toLowerCase().replace(/['"]/g, "")
  );

  const gstinIdx = headerTokens.findIndex((h) => h.includes("gstin") || h.includes("party gstin") || h.includes("tin"));
  const nameIdx = headerTokens.findIndex((h) => h.includes("party") || h.includes("vendor") || h.includes("supplier") || h.includes("name"));
  const inumIdx = headerTokens.findIndex((h) => h.includes("inv") || h.includes("bill") || h.includes("voucher") || h.includes("doc no") || h.includes("number"));
  const dtIdx = headerTokens.findIndex((h) => h.includes("date") || h.includes("dt"));
  const txvalIdx = headerTokens.findIndex((h) => h.includes("taxable") || h.includes("basic") || h.includes("gross") || h.includes("assessable"));
  const igstIdx = headerTokens.findIndex((h) => h.includes("igst") || h.includes("integrated"));
  const cgstIdx = headerTokens.findIndex((h) => h.includes("cgst") || h.includes("central"));
  const sgstIdx = headerTokens.findIndex((h) => h.includes("sgst") || h.includes("state") || h.includes("utgst"));
  const cessIdx = headerTokens.findIndex((h) => h.includes("cess"));
  const totalTaxIdx = headerTokens.findIndex((h) => h === "tax" || h.includes("total tax") || h.includes("gst amount"));
  const valIdx = headerTokens.findIndex((h) => h.includes("total") || h.includes("net") || h.includes("invoice value"));
  const hsnIdx = headerTokens.findIndex((h) => h.includes("hsn") || h.includes("sac"));
  const descIdx = headerTokens.findIndex((h) => h.includes("item") || h.includes("desc") || h.includes("particulars"));
  const vtypeIdx = headerTokens.findIndex((h) => h.includes("voucher type") || h.includes("doc type") || h === "type");
  const daysIdx = headerTokens.findIndex((h) => h.includes("days") || h.includes("overdue") || h.includes("ageing"));
  const payIdx = headerTokens.findIndex((h) => h.includes("payment") || h.includes("paid"));

  if (gstinIdx === -1 && inumIdx === -1) {
    errors.push("Could not identify GSTIN or Invoice Number columns in header row.");
  }

  let rowIdx = 1;
  for (let i = 1; i < lines.length; i++) {
    const rawCols = parseDelimitedRow(lines[i], delimiter);
    if (rawCols.length < 3) continue;

    const vendorGstin = gstinIdx !== -1 ? (rawCols[gstinIdx] || "").trim().toUpperCase() : "";
    const vendorName = nameIdx !== -1 ? rawCols[nameIdx] || "Vendor" : "Vendor";
    const invoiceNumber = inumIdx !== -1 ? (rawCols[inumIdx] || "").trim() : `BK-${rowIdx}`;
    const invoiceDate = standardizeDate(dtIdx !== -1 ? rawCols[dtIdx] : "");

    if (!invoiceNumber || /^(grand\s*)?(sub)?total$/i.test(invoiceNumber) || /^total$/i.test(vendorName)) {
      continue;
    }

    const rawTaxable = txvalIdx !== -1 ? cleanNumber(rawCols[txvalIdx]) : 0;
    const rawIgst = igstIdx !== -1 ? cleanNumber(rawCols[igstIdx]) : 0;
    const rawCgst = cgstIdx !== -1 ? cleanNumber(rawCols[cgstIdx]) : 0;
    const rawSgst = sgstIdx !== -1 ? cleanNumber(rawCols[sgstIdx]) : 0;
    const rawCess = cessIdx !== -1 ? cleanNumber(rawCols[cessIdx]) : 0;
    const rawTotalTax =
      totalTaxIdx !== -1 ? cleanNumber(rawCols[totalTaxIdx]) : round2(rawIgst + rawCgst + rawSgst + rawCess);

    const vTypeStr = vtypeIdx !== -1 ? (rawCols[vtypeIdx] || "").toUpperCase() : "";
    const isCreditNote =
      vTypeStr.includes("CREDIT") ||
      vTypeStr === "CRN" ||
      vTypeStr === "CN" ||
      rawTaxable < 0 ||
      rawTotalTax < 0;

    const taxableValue = Math.abs(round2(rawTaxable));
    const igst = Math.abs(round2(rawIgst));
    const cgst = Math.abs(round2(rawCgst));
    const sgst = Math.abs(round2(rawSgst));
    const cess = Math.abs(round2(rawCess));
    const totalTax = Math.abs(round2(rawTotalTax || igst + cgst + sgst + cess));
    const totalInvoiceValue =
      valIdx !== -1 && cleanNumber(rawCols[valIdx]) !== 0
        ? Math.abs(round2(cleanNumber(rawCols[valIdx])))
        : round2(taxableValue + totalTax);

    const daysOutstanding = daysIdx !== -1 ? Math.max(0, Math.round(cleanNumber(rawCols[daysIdx]))) : undefined;
    const payStr = payIdx !== -1 ? (rawCols[payIdx] || "").toUpperCase() : "";
    const paymentStatus: BooksPurchaseInvoice["paymentStatus"] = payStr.includes("UNPAID") || payStr.includes("PENDING")
      ? "UNPAID"
      : payStr.includes("PART")
      ? "PARTIAL"
      : daysOutstanding && daysOutstanding > 0
      ? "UNPAID"
      : "PAID";

    invoices.push({
      id: `bk-parsed-${rowIdx++}`,
      voucherNumber: `VCH-${rowIdx}`,
      vendorGstin,
      vendorName,
      invoiceNumber,
      invoiceDate,
      taxableValue,
      igst,
      cgst,
      sgst,
      cess,
      totalTax,
      totalInvoiceValue,
      hsnCode: hsnIdx !== -1 ? rawCols[hsnIdx] : undefined,
      itemDescription: descIdx !== -1 ? rawCols[descIdx] : undefined,
      voucherType: isCreditNote ? "CREDIT_NOTE" : vTypeStr.includes("DEBIT") ? "DEBIT_NOTE" : "PURCHASE",
      paymentStatus,
      daysOutstanding,
    });
  }

  const signedTaxable = invoices.reduce(
    (acc, i) => acc + (i.voucherType === "CREDIT_NOTE" ? -i.taxableValue : i.taxableValue),
    0
  );
  const signedTax = invoices.reduce(
    (acc, i) => acc + (i.voucherType === "CREDIT_NOTE" ? -i.totalTax : i.totalTax),
    0
  );

  return {
    success: invoices.length > 0,
    totalInvoices: invoices.length,
    totalTaxableValue: round2(signedTaxable),
    totalTax: round2(signedTax),
    invoices,
    errors,
  };
}
