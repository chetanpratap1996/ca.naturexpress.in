/**
 * Outward GSTR-1 Preparation, Validation & Official GSTN JSON Engine
 *
 * Statutory Authority:
 * - Section 37 of CGST Act read with Rule 59 of CGST Rules
 * - B2B (4A/4B/6B/6C), B2CL (5A: Inter-state unregistered > threshold), B2CS (7),
 *   CDNR (9B Registered), CDNUR (9B Unregistered), EXP (6A), NIL/EXEMPT (8),
 *   Table 12 HSN Summary (4-digit <= 5Cr; 6-digit > 5Cr), Table 13 Document Summary.
 */

import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { HSN_SAC_REGISTRY } from "@/lib/gst/hsnMaster";
import {
  readExcelSheetsFromBuffer,
  parseDelimitedTextToTable,
  autoDetectColumnMapping,
} from "@/lib/parsers/excelGstParser";

export type OutwardDocType = "INV" | "CRN" | "DBN" | "EXP_WPAY" | "EXP_WOPAY" | "NIL_EXEMPT";

export interface OutwardSalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  docType: OutwardDocType;
  recipientGstin?: string;
  recipientName: string;
  placeOfSupply: string; // 2-digit state code e.g. "23"
  reverseCharge: boolean;
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  totalInvoiceValue: number;
  hsnCode?: string;
  uqc?: string;
  quantity?: number;
  irn?: string;
  shippingBillNumber?: string;
  shippingBillDate?: string;
  status?: "ACTIVE" | "CANCELLED";
}

export interface Gstr1ValidationIssue {
  invoiceId: string;
  invoiceNumber: string;
  severity: "ERROR" | "WARNING";
  message: string;
}

export interface Gstr1HsnSummaryRow {
  hsnCode: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  taxRate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  digitWarning?: string;
}

export interface Gstr1SummaryReport {
  gstin: string;
  returnPeriod: string;
  supplierStateCode: string;
  turnoverCr: number;
  b2bInvoices: OutwardSalesInvoice[];
  b2clInvoices: OutwardSalesInvoice[];
  b2csBuckets: Array<{
    pos: string;
    supplyType: "INTRA" | "INTER";
    taxRate: number;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  }>;
  cdnrNotes: OutwardSalesInvoice[];
  cdnurNotes: OutwardSalesInvoice[];
  exports: OutwardSalesInvoice[];
  nilExemptTotal: number;
  hsnSummary: Gstr1HsnSummaryRow[];
  docSummary: {
    fromSerial: string;
    toSerial: string;
    totalIssued: number;
    cancelled: number;
    netIssued: number;
  };
  totals: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    totalTax: number;
  };
  issues: Gstr1ValidationIssue[];
}

function r2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

function cleanNum(v: any): number {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export class Gstr1Engine {
  /**
   * Parses Sales Register from .xlsx buffer or .csv/.tsv/.xml text
   */
  public static parseSalesRegister(params: {
    buffer?: ArrayBuffer;
    text?: string;
    supplierStateCode: string;
  }): OutwardSalesInvoice[] {
    const table = params.buffer
      ? readExcelSheetsFromBuffer(params.buffer)[0]
      : params.text
      ? parseDelimitedTextToTable(params.text)
      : null;

    if (!table || table.rows.length === 0) return [];
    const m = autoDetectColumnMapping(table.headers);
    const out: OutwardSalesInvoice[] = [];
    let idx = 1;

    for (const row of table.rows) {
      const get = (c: number) => (c >= 0 && c < row.length ? row[c] : "");
      const invNo = String(get(m.invNoCol) || `SAL-${idx}`).trim();
      const recipientName = String(get(m.nameCol) || "Customer").trim();
      if (!invNo || /^(grand\s*)?(sub)?total$/i.test(invNo) || /^total$/i.test(recipientName)) continue;

      const recipientGstin = String(get(m.gstinCol) || "").trim().toUpperCase();
      const rawTaxable = cleanNum(get(m.taxableCol));
      const rawIgst = cleanNum(get(m.igstCol));
      const rawCgst = cleanNum(get(m.cgstCol));
      const rawSgst = cleanNum(get(m.sgstCol));
      const rawCess = cleanNum(get(m.cessCol));
      const rawTotalTax =
        m.totalTaxCol >= 0 ? cleanNum(get(m.totalTaxCol)) : r2(rawIgst + rawCgst + rawSgst + rawCess);

      if (rawTaxable === 0 && rawTotalTax === 0) continue;

      const vtype = String(get(m.vtypeCol) || "").toUpperCase();
      const isCreditNote = vtype.includes("CREDIT") || vtype === "CRN" || rawTaxable < 0;
      const isDebitNote = vtype.includes("DEBIT") || vtype === "DBN";
      const isExportWpay = vtype.includes("EXP") && vtype.includes("WPAY");
      const isExportWopay = vtype.includes("EXP") && !isExportWpay;

      const taxableValue = Math.abs(r2(rawTaxable));
      const igst = Math.abs(r2(rawIgst));
      const cgst = Math.abs(r2(rawCgst));
      const sgst = Math.abs(r2(rawSgst));
      const cess = Math.abs(r2(rawCess));
      const totalTax = Math.abs(r2(rawTotalTax || igst + cgst + sgst + cess));

      const posRaw = String(get(m.posCol) || "").replace(/[^0-9]/g, "");
      const pos =
        posRaw.length >= 2
          ? posRaw.slice(0, 2)
          : recipientGstin.length >= 2
          ? recipientGstin.slice(0, 2)
          : igst > 0
          ? "99"
          : params.supplierStateCode;

      const inferredRate =
        m.rateCol >= 0 && cleanNum(get(m.rateCol)) > 0
          ? cleanNum(get(m.rateCol))
          : taxableValue > 0
          ? Math.round((totalTax / taxableValue) * 100)
          : 0;

      const docType: OutwardDocType = isCreditNote
        ? "CRN"
        : isDebitNote
        ? "DBN"
        : isExportWpay
        ? "EXP_WPAY"
        : isExportWopay
        ? "EXP_WOPAY"
        : totalTax === 0 && inferredRate === 0
        ? "NIL_EXEMPT"
        : "INV";

      out.push({
        id: `g1-${idx++}`,
        invoiceNumber: invNo,
        invoiceDate: String(get(m.dateCol) || new Date().toISOString().split("T")[0]).trim(),
        docType,
        recipientGstin: recipientGstin || undefined,
        recipientName,
        placeOfSupply: pos,
        reverseCharge: false,
        taxRate: inferredRate,
        taxableValue,
        igst,
        cgst,
        sgst,
        cess,
        totalTax,
        totalInvoiceValue: r2(taxableValue + totalTax),
        hsnCode: m.hsnCol >= 0 ? String(get(m.hsnCol) || "").trim() : undefined,
        irn: m.irnCol >= 0 ? String(get(m.irnCol) || "").trim() : undefined,
        status: "ACTIVE",
      });
    }

    return out;
  }

  /**
   * Classifies, validates, and summarizes Outward Invoices into official GSTR-1 tables.
   */
  public static compileSummary(params: {
    gstin: string;
    returnPeriod: string;
    turnoverCr: number;
    invoices: OutwardSalesInvoice[];
    b2clThresholdInr?: number; // ₹1,00,000 post Notification 12/2024
  }): Gstr1SummaryReport {
    const supplierState = (params.gstin || "").substring(0, 2);
    const b2clLimit = params.b2clThresholdInr ?? 100000;
    const minHsnDigits = params.turnoverCr > 5 ? 6 : 4;

    const b2bInvoices: OutwardSalesInvoice[] = [];
    const b2clInvoices: OutwardSalesInvoice[] = [];
    const b2csMap = new Map<string, Gstr1SummaryReport["b2csBuckets"][number]>();
    const cdnrNotes: OutwardSalesInvoice[] = [];
    const cdnurNotes: OutwardSalesInvoice[] = [];
    const exports: OutwardSalesInvoice[] = [];
    let nilExemptTotal = 0;

    const hsnMap = new Map<string, Gstr1HsnSummaryRow>();
    const issues: Gstr1ValidationIssue[] = [];

    let totTaxable = 0;
    let totIgst = 0;
    let totCgst = 0;
    let totSgst = 0;
    let totCess = 0;

    const hsnDescLookup = new Map(HSN_SAC_REGISTRY.map((h) => [h.code, h.description]));

    for (const inv of params.invoices) {
      if (inv.status === "CANCELLED") continue;
      const sign = inv.docType === "CRN" ? -1 : 1;
      const pos = (inv.placeOfSupply || supplierState).slice(0, 2);
      const hasValidGstin = inv.recipientGstin ? validateGstinDetailed(inv.recipientGstin).isValid : false;

      if (inv.recipientGstin && !hasValidGstin) {
        issues.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          severity: "ERROR",
          message: `Invalid recipient GSTIN '${inv.recipientGstin}' (Mod-36 checksum failed).`,
        });
      }

      // POS vs Tax Head validation
      if (inv.docType !== "EXP_WPAY" && inv.docType !== "EXP_WOPAY" && inv.docType !== "NIL_EXEMPT") {
        const isInter = pos !== supplierState;
        if (isInter && (inv.cgst > 0 || inv.sgst > 0)) {
          issues.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            severity: "ERROR",
            message: `Inter-state POS (${pos} vs ${supplierState}) has CGST/SGST instead of IGST.`,
          });
        } else if (!isInter && inv.igst > 0) {
          issues.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            severity: "ERROR",
            message: `Intra-state POS (${pos}) has IGST instead of CGST/SGST.`,
          });
        }
      }

      // E-Invoicing mandate check (> 5 Cr B2B/Exports)
      if (
        params.turnoverCr >= 5 &&
        (hasValidGstin || inv.docType.startsWith("EXP")) &&
        (!inv.irn || !/^[a-fA-F0-9]{64}$/.test(inv.irn))
      ) {
        issues.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          severity: "WARNING",
          message: `Turnover ≥ ₹5 Cr: Missing/invalid 64-char E-Invoice IRN for B2B/Export invoice.`,
        });
      }

      totTaxable += inv.taxableValue * sign;
      totIgst += inv.igst * sign;
      totCgst += inv.cgst * sign;
      totSgst += inv.sgst * sign;
      totCess += inv.cess * sign;

      if (inv.docType === "EXP_WPAY" || inv.docType === "EXP_WOPAY") {
        exports.push(inv);
      } else if (inv.docType === "NIL_EXEMPT") {
        nilExemptTotal += inv.taxableValue;
      } else if (inv.docType === "CRN" || inv.docType === "DBN") {
        if (inv.recipientGstin) cdnrNotes.push(inv);
        else cdnurNotes.push(inv);
      } else if (inv.recipientGstin) {
        b2bInvoices.push(inv);
      } else if (pos !== supplierState && inv.totalInvoiceValue > b2clLimit) {
        b2clInvoices.push(inv);
      } else {
        const supplyType = pos === supplierState ? "INTRA" : "INTER";
        const key = `${pos}|${inv.taxRate}`;
        const existing = b2csMap.get(key) || {
          pos,
          supplyType,
          taxRate: inv.taxRate,
          taxableValue: 0,
          igst: 0,
          cgst: 0,
          sgst: 0,
          cess: 0,
        };
        existing.taxableValue = r2(existing.taxableValue + inv.taxableValue);
        existing.igst = r2(existing.igst + inv.igst);
        existing.cgst = r2(existing.cgst + inv.cgst);
        existing.sgst = r2(existing.sgst + inv.sgst);
        existing.cess = r2(existing.cess + inv.cess);
        b2csMap.set(key, existing);
      }

      // HSN Table 12 aggregation
      const hsn = (inv.hsnCode || "UNSPECIFIED").trim();
      const hsnKey = `${hsn}|${inv.taxRate}`;
      const hRow = hsnMap.get(hsnKey) || {
        hsnCode: hsn,
        description: hsnDescLookup.get(hsn.slice(0, 4)) || "Goods / Services",
        uqc: inv.uqc || "NOS",
        totalQuantity: 0,
        taxRate: inv.taxRate,
        taxableValue: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
        totalTax: 0,
        digitWarning:
          hsn === "UNSPECIFIED" || hsn.replace(/[^0-9]/g, "").length < minHsnDigits
            ? `Requires ${minHsnDigits}-digit HSN`
            : undefined,
      };
      hRow.totalQuantity += (inv.quantity || 1) * sign;
      hRow.taxableValue = r2(hRow.taxableValue + inv.taxableValue * sign);
      hRow.igst = r2(hRow.igst + inv.igst * sign);
      hRow.cgst = r2(hRow.cgst + inv.cgst * sign);
      hRow.sgst = r2(hRow.sgst + inv.sgst * sign);
      hRow.cess = r2(hRow.cess + inv.cess * sign);
      hRow.totalTax = r2(hRow.igst + hRow.cgst + hRow.sgst + hRow.cess);
      hsnMap.set(hsnKey, hRow);
    }

    const serials = params.invoices.map((i) => i.invoiceNumber).filter(Boolean);
    const cancelledCount = params.invoices.filter((i) => i.status === "CANCELLED").length;

    return {
      gstin: params.gstin,
      returnPeriod: params.returnPeriod,
      supplierStateCode: supplierState,
      turnoverCr: params.turnoverCr,
      b2bInvoices,
      b2clInvoices,
      b2csBuckets: Array.from(b2csMap.values()),
      cdnrNotes,
      cdnurNotes,
      exports,
      nilExemptTotal: r2(nilExemptTotal),
      hsnSummary: Array.from(hsnMap.values()),
      docSummary: {
        fromSerial: serials[0] || "-",
        toSerial: serials[serials.length - 1] || "-",
        totalIssued: params.invoices.length,
        cancelled: cancelledCount,
        netIssued: params.invoices.length - cancelledCount,
      },
      totals: {
        taxableValue: r2(totTaxable),
        igst: r2(totIgst),
        cgst: r2(totCgst),
        sgst: r2(totSgst),
        cess: r2(totCess),
        totalTax: r2(totIgst + totCgst + totSgst + totCess),
      },
      issues,
    };
  }

  /**
   * Builds GSTN Offline Tool Compatible GSTR-1 JSON Payload.
   */
  public static buildGstnGstr1Json(summary: Gstr1SummaryReport, fpMMYYYY: string) {
    const b2bByGstin = new Map<string, OutwardSalesInvoice[]>();
    for (const inv of summary.b2bInvoices) {
      const ctin = inv.recipientGstin || "";
      if (!b2bByGstin.has(ctin)) b2bByGstin.set(ctin, []);
      b2bByGstin.get(ctin)!.push(inv);
    }

    const b2b = Array.from(b2bByGstin.entries()).map(([ctin, invs]) => ({
      ctin,
      inv: invs.map((i) => ({
        inum: i.invoiceNumber,
        idt: i.invoiceDate.split("-").reverse().join("-"),
        val: i.totalInvoiceValue,
        pos: i.placeOfSupply,
        rchrg: i.reverseCharge ? "Y" : "N",
        inv_typ: "R",
        itms: [
          {
            num: 1,
            itm_det: {
              rt: i.taxRate,
              txval: i.taxableValue,
              iamt: i.igst,
              camt: i.cgst,
              samt: i.sgst,
              csamt: i.cess,
            },
          },
        ],
      })),
    }));

    const b2cs = summary.b2csBuckets.map((b) => ({
      sply_ty: b.supplyType,
      pos: b.pos,
      typ: "OE",
      rt: b.taxRate,
      txval: b.taxableValue,
      iamt: b.igst,
      camt: b.cgst,
      samt: b.sgst,
      csamt: b.cess,
    }));

    const cdnrByGstin = new Map<string, OutwardSalesInvoice[]>();
    for (const nt of summary.cdnrNotes) {
      const ctin = nt.recipientGstin || "";
      if (!cdnrByGstin.has(ctin)) cdnrByGstin.set(ctin, []);
      cdnrByGstin.get(ctin)!.push(nt);
    }

    const cdnr = Array.from(cdnrByGstin.entries()).map(([ctin, notes]) => ({
      ctin,
      nt: notes.map((n) => ({
        ntty: n.docType === "CRN" ? "C" : "D",
        nt_num: n.invoiceNumber,
        nt_dt: n.invoiceDate.split("-").reverse().join("-"),
        val: n.totalInvoiceValue,
        pos: n.placeOfSupply,
        rchrg: n.reverseCharge ? "Y" : "N",
        itms: [
          {
            num: 1,
            itm_det: {
              rt: n.taxRate,
              txval: n.taxableValue,
              iamt: n.igst,
              camt: n.cgst,
              samt: n.sgst,
              csamt: n.cess,
            },
          },
        ],
      })),
    }));

    // Table 5: B2CL (Inter-State Invoices > Threshold to Unregistered)
    const b2clByPos = new Map<string, OutwardSalesInvoice[]>();
    for (const inv of summary.b2clInvoices) {
      const pos = inv.placeOfSupply;
      if (!b2clByPos.has(pos)) b2clByPos.set(pos, []);
      b2clByPos.get(pos)!.push(inv);
    }
    const b2cl = Array.from(b2clByPos.entries()).map(([pos, invs]) => ({
      pos,
      inv: invs.map((i) => ({
        inum: i.invoiceNumber,
        idt: i.invoiceDate.split("-").reverse().join("-"),
        val: i.totalInvoiceValue,
        inv_typ: "R",
        itms: [
          {
            num: 1,
            itm_det: {
              rt: i.taxRate,
              txval: i.taxableValue,
              iamt: i.igst,
              csamt: i.cess,
            },
          },
        ],
      })),
    }));

    // Table 9B: CDNUR (Credit / Debit Notes to Unregistered Persons)
    const cdnur = summary.cdnurNotes.map((n) => ({
      typ: n.placeOfSupply !== summary.supplierStateCode ? "B2CL" : "B2CS",
      ntty: n.docType === "CRN" ? "C" : "D",
      nt_num: n.invoiceNumber,
      nt_dt: n.invoiceDate.split("-").reverse().join("-"),
      val: n.totalInvoiceValue,
      pos: n.placeOfSupply,
      itms: [
        {
          num: 1,
          itm_det: {
            rt: n.taxRate,
            txval: n.taxableValue,
            iamt: n.igst,
            camt: n.cgst,
            samt: n.sgst,
            csamt: n.cess,
          },
        },
      ],
    }));

    // Table 6A: Exports (with or without payment of tax)
    const exp = summary.exports.length > 0
      ? [
          {
            exp_typ: summary.exports.some((e) => e.docType === "EXP_WPAY") ? "WPAY" : "WOPAY",
            inv: summary.exports.map((e) => ({
              inum: e.invoiceNumber,
              idt: e.invoiceDate.split("-").reverse().join("-"),
              val: e.totalInvoiceValue,
              sbnum: e.shippingBillNumber || "",
              sbdt: e.shippingBillDate ? e.shippingBillDate.split("-").reverse().join("-") : "",
              itms: [
                {
                  txval: e.taxableValue,
                  rt: e.taxRate,
                  iamt: e.igst,
                  csamt: e.cess,
                },
              ],
            })),
          },
        ]
      : [];

    // Table 8: Nil rated / Exempted supplies
    const nil = summary.nilExemptTotal > 0
      ? {
          inv: [
            {
              nil_amt: 0,
              expt_amt: summary.nilExemptTotal,
              ngsup_amt: 0,
              sply_ty: "INTRAB2B",
            },
          ],
        }
      : undefined;

    // Table 13: Documents issued during the tax period
    const doc_issue = summary.docSummary.totalIssued > 0
      ? {
          doc_det: [
            {
              doc_num: 1,
              doc_typ: "Invoices for outward supply",
              docs: [
                {
                  num: 1,
                  from: summary.docSummary.fromSerial,
                  to: summary.docSummary.toSerial,
                  totnum: summary.docSummary.totalIssued,
                  canc: summary.docSummary.cancelled,
                  net_issue: summary.docSummary.netIssued,
                },
              ],
            },
          ],
        }
      : undefined;

    return {
      gstin: summary.gstin,
      fp: fpMMYYYY,
      gt: summary.turnoverCr * 10000000,
      cur_gt: summary.totals.taxableValue,
      b2b,
      b2cl,
      b2cs,
      cdnr,
      cdnur,
      exp,
      nil,
      doc_issue,
      hsn: {
        data: summary.hsnSummary.map((h, idx) => ({
          num: idx + 1,
          hsn_sc: h.hsnCode,
          desc: h.description,
          uqc: h.uqc,
          qty: h.totalQuantity,
          rt: h.taxRate,
          txval: h.taxableValue,
          iamt: h.igst,
          camt: h.cgst,
          samt: h.sgst,
          csamt: h.cess,
        })),
      },
    };
  }
}
