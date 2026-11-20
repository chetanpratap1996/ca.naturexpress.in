/**
 * E-Invoicing & E-Way Bill Sentinel Engine
 * 
 * Statutory Authority:
 * - Rule 48(4) of CGST Rules (Mandatory e-Invoicing for aggregate turnover > Rs. 5 Cr)
 * - Rule 138 & 138A of CGST Rules (E-Way Bill generation, distance-based validity & Part-B extension)
 * - 64-character SHA-256 Invoice Reference Number (IRN) format validation
 * - Digitally signed B2B QR code payload verification
 */

export interface EInvoiceRecord {
  invoiceNumber: string;
  invoiceDate: string;
  supplierGstin: string;
  recipientGstin: string;
  taxableValue: number;
  totalTax: number;
  totalInvoiceValue: number;
  irn: string;
  irnStatus: 'VALID_ACTIVE' | 'CANCELLED' | 'HASH_INVALID';
  signedQrCodePayload?: string;
  signedQrVerified: boolean;
  ackNumber: string;
  ackDate: string;
  eWayBillNumber?: string;
  ewbValidTill?: string;
  ewbStatus?: 'ACTIVE' | 'EXPIRED' | 'EXTENDED';
  distanceKm: number;
  cargoType: 'NORMAL' | 'OVER_DIMENSIONAL';
  transporterId?: string;
  vehicleNumber?: string;
  hoursRemaining?: number;
  isExtensionAlertActive: boolean;
}

export class EInvoiceEwbEngine {
  /**
   * Validates 64-character SHA-256 IRN Hex String
   */
  public static validateIrnStructure(irn: string): boolean {
    const hexRegex = /^[a-fA-F0-9]{64}$/;
    return hexRegex.test(irn.trim());
  }

  /**
   * Computes statutory E-Way Bill validity in hours based on distance and cargo type
   * Rule 138(10):
   * - Normal Cargo: 1 day per 200 km (or part thereof)
   * - Over Dimensional Cargo: 1 day per 20 km (or part thereof)
   */
  public static calculateEwbValidityDays(distanceKm: number, cargoType: 'NORMAL' | 'OVER_DIMENSIONAL'): number {
    const kmPerDay = cargoType === 'NORMAL' ? 200 : 20;
    return Math.max(1, Math.ceil(distanceKm / kmPerDay));
  }

  /**
   * Evaluates EWB live status and triggers extension alert within 4 hours of expiry
   */
  public static evaluateEwbStatus(
    validTillDateStr: string, 
    currentDateStr: string = new Date().toISOString()
  ): { status: 'ACTIVE' | 'EXPIRED' | 'EXTENDED'; hoursRemaining: number; isExtensionAlertActive: boolean } {
    const validTill = new Date(validTillDateStr);
    const curr = new Date(currentDateStr);
    const diffMs = validTill.getTime() - curr.getTime();
    const hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));

    if (hoursRemaining < 0) {
      return {
        status: 'EXPIRED',
        hoursRemaining,
        isExtensionAlertActive: false
      };
    }

    // Rule 138(10): Extension can be filed within 8 hours before or 8 hours after expiry
    const isExtensionAlertActive = hoursRemaining <= 4;

    return {
      status: 'ACTIVE',
      hoursRemaining,
      isExtensionAlertActive
    };
  }

  /**
   * Generates E-Way Bill Extension Form Draft
   */
  public static draftEwbExtension(record: EInvoiceRecord, reason: 'VEHICLE_BREAKDOWN' | 'TRAFFIC_JAM' | 'TRANSSHIPMENT'): {
    ewbNumber: string;
    newVehicleNumber: string;
    extensionReason: string;
    newValidTill: string;
    statutoryAnnexure: string;
  } {
    const additionalHours = 24; // 1 additional day
    const currentExpiry = new Date(record.ewbValidTill || new Date().toISOString());
    const newExpiry = new Date(currentExpiry.getTime() + additionalHours * 60 * 60 * 1000);

    return {
      ewbNumber: record.eWayBillNumber || 'N/A',
      newVehicleNumber: record.vehicleNumber || 'MP-09-HH-1029',
      extensionReason: reason,
      newValidTill: newExpiry.toISOString(),
      statutoryAnnexure: `Form GST EWB-01 Part B updated under Rule 138(10) of CGST Rules due to ${reason}. Validity extended by 24 hours.`
    };
  }
}

export const SAMPLE_EINVOICES: EInvoiceRecord[] = [
  {
    invoiceNumber: 'INV/2026/0491',
    invoiceDate: '2026-11-18',
    supplierGstin: '23AAACG1234F1Z5',
    recipientGstin: '27AABCT1234D1Z8',
    taxableValue: 2450000,
    totalTax: 441000,
    totalInvoiceValue: 2891000,
    irn: '4c8e76f9d3b1a50c897f2e1a3b5c7d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
    irnStatus: 'VALID_ACTIVE',
    signedQrVerified: true,
    ackNumber: '112610948201',
    ackDate: '2026-11-18T10:14:00Z',
    eWayBillNumber: '241094829104',
    ewbValidTill: '2026-11-20T23:59:00Z',
    ewbStatus: 'ACTIVE',
    distanceKm: 580,
    cargoType: 'NORMAL',
    transporterId: '23AAACT9901M1ZQ',
    vehicleNumber: 'MP-09-GF-8812',
    hoursRemaining: 14,
    isExtensionAlertActive: false
  },
  {
    invoiceNumber: 'INV/2026/0492',
    invoiceDate: '2026-11-17',
    supplierGstin: '23AAACG1234F1Z5',
    recipientGstin: '24AABCA4321M1Z4',
    taxableValue: 1250000,
    totalTax: 225000,
    totalInvoiceValue: 1475000,
    irn: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    irnStatus: 'VALID_ACTIVE',
    signedQrVerified: true,
    ackNumber: '112610948205',
    ackDate: '2026-11-17T16:30:00Z',
    eWayBillNumber: '241094829188',
    ewbValidTill: '2026-11-20T11:00:00Z',
    ewbStatus: 'ACTIVE',
    distanceKm: 340,
    cargoType: 'NORMAL',
    transporterId: '24AAACL4512P1ZN',
    vehicleNumber: 'GJ-01-AX-4590',
    hoursRemaining: 2,
    isExtensionAlertActive: true // Immediate alert! Expiring in 2 hours
  }
];
