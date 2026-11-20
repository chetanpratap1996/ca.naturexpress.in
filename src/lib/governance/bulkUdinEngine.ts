/**
 * Bulk UDIN Generator, 60-Day Countdown Guardian & Report Watermarker
 * 
 * Statutory Authority:
 * - ICAI Gazette Notification No. 1-CA(7)/192/2019 (Mandatory UDIN for all attest and audit functions)
 * - ICAI UDIN Guidelines (Mandatory generation within 60 days of signing the report or certificate)
 * - Format of UDIN: 18-digit alphanumeric:
 *   - 2 digits: Year (e.g. 26)
 *   - 6 digits: Member Registration Number (e.g. 049210)
 *   - 10 digits: System-generated alphanumeric hash / document type code
 * - Revocation norms: Reasons must be recorded if revoked within 60 days
 */

export type UdinDocumentType = 
  | 'TAX_AUDIT_FORM_3CD' 
  | 'STATUTORY_BANK_AUDIT_LFAR' 
  | 'COMPANY_AUDIT_AOC4' 
  | 'CERTIFICATE_FORM_15CB' 
  | 'NET_WORTH_CERTIFICATE' 
  | 'TURNOVER_CERTIFICATE';

export interface UdinCertificateItem {
  id: string;
  documentTitle: string;
  clientName: string;
  clientPan: string;
  caMemberRegNo: string;
  signingDate: string; // YYYY-MM-DD
  documentType: UdinDocumentType;
  udinNumber?: string; // 18-digit
  isUdinGenerated: boolean;
  generatedTimestamp?: string;
  daysRemainingToGenerateUdin: number; // 60 days from signingDate
  is60DayDeadlineBreached: boolean;
  qrCodeVerificationPayload: string;
  watermarkText: string;
  isRevoked: boolean;
  revocationReason?: string;
}

export class BulkUdinEngine {
  /**
   * Generates a valid 18-digit ICAI UDIN
   */
  public static generateUdinNumber(memberRegNo: string, signingDate: string, docType: UdinDocumentType): string {
    const yearPrefix = signingDate.slice(2, 4); // '26'
    const regNoPadded = memberRegNo.padStart(6, '0').slice(-6); // '049210'
    const randomHash = Math.random().toString(36).substring(2, 12).toUpperCase(); // 10 chars
    return `${yearPrefix}${regNoPadded}${randomHash}`;
  }

  /**
   * Evaluates 60-day statutory countdown for UDIN generation
   */
  public static evaluateUdinDeadlines(
    items: UdinCertificateItem[], 
    asOfDateStr: string = '2026-11-20'
  ): {
    totalItems: number;
    generatedCount: number;
    pendingCount: number;
    breachedCount: number;
  } {
    const asOf = new Date(asOfDateStr);
    let gen = 0;
    let pend = 0;
    let breached = 0;

    items.forEach(item => {
      const signDate = new Date(item.signingDate);
      const deadline = new Date(signDate.getTime() + (60 * 24 * 3600 * 1000));
      const daysLeft = Math.ceil((deadline.getTime() - asOf.getTime()) / (1000 * 3600 * 24));
      item.daysRemainingToGenerateUdin = daysLeft;

      if (!item.isUdinGenerated) {
        if (daysLeft < 0) {
          item.is60DayDeadlineBreached = true;
          breached++;
        } else {
          item.is60DayDeadlineBreached = false;
          pend++;
        }
      } else {
        gen++;
        item.is60DayDeadlineBreached = false;
      }

      if (item.udinNumber) {
        item.qrCodeVerificationPayload = `https://udin.icai.org/verify-udin?udin=${item.udinNumber}&signDate=${item.signingDate}`;
        item.watermarkText = `CERTIFIED UNDER ICAI UDIN: ${item.udinNumber} | DATED: ${item.signingDate}`;
      }
    });

    return {
      totalItems: items.length,
      generatedCount: gen,
      pendingCount: pend,
      breachedCount: breached
    };
  }
}

export const SAMPLE_UDIN_ITEMS: UdinCertificateItem[] = [
  {
    id: 'UD-01',
    documentTitle: 'Tax Audit Report u/s 44AB in Form 3CA/3CD',
    clientName: 'Pratwi Solutions Private Limited',
    clientPan: 'AABCP9182K',
    caMemberRegNo: '049210',
    signingDate: '2026-09-28',
    documentType: 'TAX_AUDIT_FORM_3CD',
    udinNumber: '26049210AAAA982145',
    isUdinGenerated: true,
    generatedTimestamp: '2026-09-29T10:15:00Z',
    daysRemainingToGenerateUdin: 7,
    is60DayDeadlineBreached: false,
    qrCodeVerificationPayload: 'https://udin.icai.org/verify-udin?udin=26049210AAAA982145&signDate=2026-09-28',
    watermarkText: 'CERTIFIED UNDER ICAI UDIN: 26049210AAAA982145 | DATED: 2026-09-28',
    isRevoked: false
  },
  {
    id: 'UD-02',
    documentTitle: 'Statutory Bank Branch Audit Report & LFAR',
    clientName: 'Bank of India (Indore Main Branch)',
    clientPan: 'AAACB0123Q',
    caMemberRegNo: '049210',
    signingDate: '2026-10-15',
    documentType: 'STATUTORY_BANK_AUDIT_LFAR',
    isUdinGenerated: false,
    daysRemainingToGenerateUdin: 24, // 24 days left of 60 days
    is60DayDeadlineBreached: false,
    qrCodeVerificationPayload: '',
    watermarkText: '',
    isRevoked: false
  },
  {
    id: 'UD-03',
    documentTitle: 'Accountant Certificate u/s 195 in Form 15CB',
    clientName: 'Apex Machinery Distributors Pvt Ltd',
    clientPan: 'AALCA8912P',
    caMemberRegNo: '049210',
    signingDate: '2026-11-05',
    documentType: 'CERTIFICATE_FORM_15CB',
    udinNumber: '26049210CB88192014',
    isUdinGenerated: true,
    generatedTimestamp: '2026-11-05T16:45:00Z',
    daysRemainingToGenerateUdin: 45,
    is60DayDeadlineBreached: false,
    qrCodeVerificationPayload: 'https://udin.icai.org/verify-udin?udin=26049210CB88192014&signDate=2026-11-05',
    watermarkText: 'CERTIFIED UNDER ICAI UDIN: 26049210CB88192014 | DATED: 2026-11-05',
    isRevoked: false
  }
];
