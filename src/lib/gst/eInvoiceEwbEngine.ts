/**
 * E-Invoicing & E-Way Bill Engine
 *
 * Statutory Authority:
 * - Rule 48(4) of CGST Rules (Mandatory e-Invoicing for aggregate turnover >= Rs. 5 Cr)
 * - Rule 138 & 138A of CGST Rules (E-Way Bill distance validity & Part-B extension)
 * - 64-character SHA-256 Invoice Reference Number (IRN) format validation
 */

import { parseDelimitedRow } from "@/lib/parsers/gstr2bParser";

export interface EInvoiceRecord {
  invoiceNumber: string;
  invoiceDate: string;
  supplierGstin: string;
  recipientGstin: string;
  taxableValue: number;
  totalTax: number;
  totalInvoiceValue: number;
  irn: string;
  irnStatus: "VALID_ACTIVE" | "CANCELLED" | "HASH_INVALID";
  signedQrVerified: boolean;
  ackNumber: string;
  ackDate: string;
  eWayBillNumber?: string;
  ewbValidTill?: string;
  ewbStatus?: "ACTIVE" | "EXPIRED" | "EXTENDED";
  distanceKm: number;
  cargoType: "NORMAL" | "OVER_DIMENSIONAL";
  transporterId?: string;
  vehicleNumber?: string;
  hoursRemaining?: number;
  isExtensionAlertActive: boolean;
}

export class EInvoiceEwbEngine {
  public static validateIrnStructure(irn: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test((irn || "").trim());
  }

  public static calculateEwbValidityDays(
    distanceKm: number,
    cargoType: "NORMAL" | "OVER_DIMENSIONAL"
  ): number {
    const kmPerDay = cargoType === "NORMAL" ? 200 : 20;
    return Math.max(1, Math.ceil(distanceKm / kmPerDay));
  }

  public static evaluateEwbStatus(
    validTillDateStr: string,
    currentDateStr: string = new Date().toISOString()
  ): {
    status: "ACTIVE" | "EXPIRED" | "EXTENDED";
    hoursRemaining: number;
    isExtensionAlertActive: boolean;
  } {
    const validTill = new Date(validTillDateStr);
    const curr = new Date(currentDateStr);
    if (isNaN(validTill.getTime())) {
      return { status: "ACTIVE", hoursRemaining: 0, isExtensionAlertActive: false };
    }
    const hoursRemaining = Math.round((validTill.getTime() - curr.getTime()) / (1000 * 60 * 60));

    if (hoursRemaining < 0) {
      return {
        status: "EXPIRED",
        hoursRemaining,
        isExtensionAlertActive: Math.abs(hoursRemaining) <= 8,
      };
    }

    return {
      status: "ACTIVE",
      hoursRemaining,
      isExtensionAlertActive: hoursRemaining <= 8,
    };
  }

  public static draftEwbExtension(
    record: EInvoiceRecord,
    reason: "VEHICLE_BREAKDOWN" | "TRAFFIC_JAM" | "TRANSSHIPMENT",
    updatedVehicleNumber?: string
  ) {
    const currentExpiry = new Date(record.ewbValidTill || new Date().toISOString());
    const newExpiry = new Date(currentExpiry.getTime() + 24 * 60 * 60 * 1000);

    return {
      ewbNumber: record.eWayBillNumber || "",
      newVehicleNumber: updatedVehicleNumber || record.vehicleNumber || "",
      extensionReason: reason,
      newValidTill: newExpiry.toISOString(),
      statutoryAnnexure: `Form GST EWB-01 Part B extended under Rule 138(10) due to ${reason}.`,
    };
  }

  public static parseEInvoiceCsvOrJson(content: string): EInvoiceRecord[] {
    const trimmed = content.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed : parsed.data || parsed.records || [parsed];
      return arr.map((r: any, i: number) => {
        const irn = String(r.irn || r.Irn || "");
        const validIrn = this.validateIrnStructure(irn);
        const evalEwb = r.ewbValidTill ? this.evaluateEwbStatus(r.ewbValidTill) : null;
        return {
          invoiceNumber: String(r.invoiceNumber || r.DocNo || `INV-${i + 1}`),
          invoiceDate: String(r.invoiceDate || r.DocDt || ""),
          supplierGstin: String(r.supplierGstin || r.SellerGstin || "").toUpperCase(),
          recipientGstin: String(r.recipientGstin || r.BuyerGstin || "").toUpperCase(),
          taxableValue: Number(r.taxableValue || r.AssVal || 0),
          totalTax: Number(r.totalTax || (Number(r.IgstVal || 0) + Number(r.CgstVal || 0) + Number(r.SgstVal || 0))),
          totalInvoiceValue: Number(r.totalInvoiceValue || r.TotInvVal || 0),
          irn,
          irnStatus: validIrn ? (r.irnStatus === "CANCELLED" ? "CANCELLED" : "VALID_ACTIVE") : "HASH_INVALID",
          signedQrVerified: validIrn,
          ackNumber: String(r.ackNumber || r.AckNo || ""),
          ackDate: String(r.ackDate || r.AckDt || ""),
          eWayBillNumber: r.eWayBillNumber || r.EwbNo || undefined,
          ewbValidTill: r.ewbValidTill || r.EwbValidTill || undefined,
          ewbStatus: evalEwb?.status || "ACTIVE",
          distanceKm: Number(r.distanceKm || r.Distance || 0),
          cargoType: r.cargoType === "OVER_DIMENSIONAL" ? "OVER_DIMENSIONAL" : "NORMAL",
          vehicleNumber: r.vehicleNumber || r.VehNo || undefined,
          hoursRemaining: evalEwb?.hoursRemaining,
          isExtensionAlertActive: Boolean(evalEwb?.isExtensionAlertActive),
        };
      });
    }

    const lines = trimmed.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const headers = parseDelimitedRow(lines[0], delimiter).map((h) => h.toLowerCase());
    const idx = (kw: string[]) => headers.findIndex((h) => kw.some((k) => h.includes(k)));

    const iInv = idx(["inv", "doc no", "docno"]);
    const iDt = idx(["date", "docdt"]);
    const iSupp = idx(["supplier", "seller"]);
    const iRec = idx(["recipient", "buyer"]);
    const iTaxable = idx(["taxable", "assval"]);
    const iTax = idx(["tax", "gst"]);
    const iTot = idx(["total", "totinv"]);
    const iIrn = idx(["irn"]);
    const iAck = idx(["ack"]);
    const iEwb = idx(["ewb", "way"]);
    const iVeh = idx(["veh"]);
    const iDist = idx(["dist"]);

    const records: EInvoiceRecord[] = [];
    for (let r = 1; r < lines.length; r++) {
      const cols = parseDelimitedRow(lines[r], delimiter);
      if (cols.length < 3) continue;
      const irn = iIrn !== -1 ? cols[iIrn] : "";
      const validIrn = this.validateIrnStructure(irn);
      const taxableValue = iTaxable !== -1 ? parseFloat(cols[iTaxable].replace(/[^0-9.-]/g, "")) || 0 : 0;
      const totalTax = iTax !== -1 ? parseFloat(cols[iTax].replace(/[^0-9.-]/g, "")) || 0 : 0;
      const totalInvoiceValue = iTot !== -1 ? parseFloat(cols[iTot].replace(/[^0-9.-]/g, "")) || taxableValue + totalTax : taxableValue + totalTax;

      records.push({
        invoiceNumber: iInv !== -1 ? cols[iInv] : `INV-${r}`,
        invoiceDate: iDt !== -1 ? cols[iDt] : "",
        supplierGstin: iSupp !== -1 ? cols[iSupp].toUpperCase() : "",
        recipientGstin: iRec !== -1 ? cols[iRec].toUpperCase() : "",
        taxableValue,
        totalTax,
        totalInvoiceValue,
        irn,
        irnStatus: validIrn ? "VALID_ACTIVE" : "HASH_INVALID",
        signedQrVerified: validIrn,
        ackNumber: iAck !== -1 ? cols[iAck] : "",
        ackDate: iDt !== -1 ? cols[iDt] : "",
        eWayBillNumber: iEwb !== -1 ? cols[iEwb] : undefined,
        ewbStatus: "ACTIVE",
        distanceKm: iDist !== -1 ? parseFloat(cols[iDist]) || 0 : 0,
        cargoType: "NORMAL",
        vehicleNumber: iVeh !== -1 ? cols[iVeh] : undefined,
        isExtensionAlertActive: false,
      });
    }
    return records;
  }
}
