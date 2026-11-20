/**
 * Quarterly TDS Return Engine (Forms 24Q, 26Q, 27Q, 27EQ) & CSI Challan Auto-Matcher
 * 
 * Statutory Authority:
 * - Section 200(3) of Income Tax Act read with Rule 31A of Income Tax Rules
 * - NSDL e-TDS / e-TCS File Validation Utility (FVU) Data Structure Specifications
 * - OLTAS (Online Tax Accounting System) Challan Status Inquiry (.csi file format)
 * - Forms:
 *   - Form 24Q: Salary TDS (Annexure I quarterly, Annexure II in Q4 with Sec 115BAC choice)
 *   - Form 26Q: Domestic non-salary TDS (194C, 194J, 194I, 194Q, 194H, 194A, 194R)
 *   - Form 27Q: Non-resident foreign payments (Section 195, DTAA relief)
 *   - Form 27EQ: Tax Collected at Source (Section 206C(1), 206C(1H), 206C(1G) LRS)
 */

export type TdsFormType = '24Q' | '26Q' | '27Q' | '27EQ';
export type TdsQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface CsiChallanRecord {
  bsrCode: string; // 7 digits
  tenderDate: string; // YYYY-MM-DD
  challanSerialNo: string; // 5 digits
  challanAmount: number; // Total amount in OLTAS
  matchedStatus: 'MATCHED' | 'AMOUNT_MISMATCH' | 'NOT_IN_BOOKS';
  bookChallanId?: string;
  divergenceAmount: number;
}

export interface FvuBatchHeader {
  batchNumber: number;
  totalChallansCount: number;
  totalDeducteesCount: number;
  totalTaxDeducted: number;
  totalTaxDeposited: number;
  tan: string;
  panOfEmployer: string;
  financialYear: string;
  assessmentYear: string;
  quarter: TdsQuarter;
  formType: TdsFormType;
  deductorType: 'COMPANY' | 'FIRM' | 'INDIVIDUAL_HUF' | 'GOVERNMENT';
}

export interface FvuChallanItem {
  id: string;
  challanIndex: number;
  bsrCode: string;
  tenderDate: string;
  challanSerialNo: string;
  sectionCode: string;
  tdsAmount: number;
  surcharge: number;
  cess: number;
  interest: number;
  fee234E: number;
  totalDeposit: number;
  minorHead: '200' | '400';
  chequeNo?: string;
  csiMatched: boolean;
  unconsumedBalance: number;
}

export interface FvuDeducteeItem {
  id: string;
  challanIndex: number;
  deducteePan: string;
  deducteeName: string;
  sectionCode: string;
  paymentDate: string;
  amountPaidOrCredited: number;
  taxDeductible: number;
  tdsDeducted: number;
  dateOfDeduction: string;
  reasonForLowerOrNonDeduction?: 'A' | 'B' | 'C' | 'Y' | 'Z'; // A: 197 Cert, B: 197A, C: Transporter, Y: 206AA, Z: 206AB
  certificate197No?: string;
  panStatus: 'VALID' | 'INVALID_206AA' | 'NON_FILER_206AB';
}

export class FvuCsiEngine {
  /**
   * Matches OLTAS .csi file against internal book challans
   */
  public static matchCsiFile(
    csiLines: string[], 
    bookChallans: FvuChallanItem[]
  ): {
    matchedChallans: CsiChallanRecord[];
    totalMatchedAmount: number;
    unmatchedCount: number;
    divergenceTotal: number;
  } {
    const matched: CsiChallanRecord[] = [];
    let totalMatchedAmt = 0;
    let unmatched = 0;
    let divTotal = 0;

    for (const line of csiLines) {
      if (!line || line.startsWith('^') || line.trim().length === 0) continue;
      const parts = line.split('^');
      if (parts.length < 4) continue;

      const bsr = parts[0].trim();
      const date = parts[1].trim();
      const serial = parts[2].trim();
      const amt = parseFloat(parts[3].trim()) || 0;

      // Find in book challans
      const bookMatch = bookChallans.find(
        bc => bc.bsrCode === bsr && bc.challanSerialNo === serial
      );

      if (bookMatch) {
        const divergence = Math.abs(bookMatch.totalDeposit - amt);
        const status = divergence === 0 ? 'MATCHED' : 'AMOUNT_MISMATCH';
        if (status === 'MATCHED') {
          bookMatch.csiMatched = true;
          totalMatchedAmt += amt;
        } else {
          divTotal += divergence;
        }

        matched.push({
          bsrCode: bsr,
          tenderDate: date,
          challanSerialNo: serial,
          challanAmount: amt,
          matchedStatus: status,
          bookChallanId: bookMatch.id,
          divergenceAmount: divergence
        });
      } else {
        unmatched++;
        matched.push({
          bsrCode: bsr,
          tenderDate: date,
          challanSerialNo: serial,
          challanAmount: amt,
          matchedStatus: 'NOT_IN_BOOKS',
          divergenceAmount: amt
        });
      }
    }

    return {
      matchedChallans: matched,
      totalMatchedAmount: totalMatchedAmt,
      unmatchedCount: unmatched,
      divergenceTotal: divTotal
    };
  }

  /**
   * Compiles e-TDS FVU structured text stream
   * Format: File Header (FH) -> Batch Header (BH) -> Challan Detail (CD) -> Deductee Detail (DD)
   */
  public static generateFvuTextStream(
    header: FvuBatchHeader, 
    challans: FvuChallanItem[], 
    deductees: FvuDeducteeItem[]
  ): string {
    const lines: string[] = [];

    // 1. File Header (FH)
    lines.push(`1^FH^NSDL-TDS-FVU-8.6^1^${new Date().toISOString().slice(0, 10).replace(/-/g, '')}^${header.tan}^${header.formType}^^`);

    // 2. Batch Header (BH)
    lines.push(
      `2^BH^1^${header.totalChallansCount}^${header.formType}^${header.tan}^${header.panOfEmployer}^${header.assessmentYear}^${header.financialYear}^${header.quarter}^` +
      `M/s PRATWI SOLUTIONS PRIVATE LIMITED^O^LIMITED COMPANY^101 TECH PARK INDORE MP 452001^chetan@firm.com^9826012345^` +
      `${header.totalTaxDeducted.toFixed(2)}^${header.totalTaxDeposited.toFixed(2)}^0.00^0.00^N^`
    );

    // 3. Challans (CD) and Deductees (DD)
    let lineIdx = 3;
    challans.forEach((ch, cIdx) => {
      lines.push(
        `${lineIdx}^CD^1^${cIdx + 1}^${header.formType}^${ch.bsrCode}^${ch.tenderDate.replace(/-/g, '')}^${ch.challanSerialNo}^` +
        `${ch.sectionCode}^${ch.tdsAmount.toFixed(2)}^${ch.surcharge.toFixed(2)}^${ch.cess.toFixed(2)}^${ch.interest.toFixed(2)}^` +
        `${ch.fee234E.toFixed(2)}^${ch.totalDeposit.toFixed(2)}^${ch.minorHead}^N^`
      );
      lineIdx++;

      // Deductees linked to this challan
      const chDeductees = deductees.filter(d => d.challanIndex === cIdx + 1);
      chDeductees.forEach((dd, dIdx) => {
        lines.push(
          `${lineIdx}^DD^1^${cIdx + 1}^${dIdx + 1}^${dd.deducteePan}^${dd.deducteeName}^${dd.sectionCode}^` +
          `${dd.paymentDate.replace(/-/g, '')}^${dd.dateOfDeduction.replace(/-/g, '')}^${dd.amountPaidOrCredited.toFixed(2)}^` +
          `${dd.tdsDeducted.toFixed(2)}^0.00^${dd.tdsDeducted.toFixed(2)}^${dd.reasonForLowerOrNonDeduction || ''}^${dd.certificate197No || ''}^`
        );
        lineIdx++;
      });
    });

    return lines.join('\n');
  }
}

export const SAMPLE_FVU_CHALLANS: FvuChallanItem[] = [
  {
    id: 'CH-01',
    challanIndex: 1,
    bsrCode: '0210041',
    tenderDate: '2026-08-05',
    challanSerialNo: '00412',
    sectionCode: '194J',
    tdsAmount: 65000,
    surcharge: 0,
    cess: 0,
    interest: 0,
    fee234E: 0,
    totalDeposit: 65000,
    minorHead: '200',
    csiMatched: true,
    unconsumedBalance: 0
  },
  {
    id: 'CH-02',
    challanIndex: 2,
    bsrCode: '0210041',
    tenderDate: '2026-09-06',
    challanSerialNo: '00591',
    sectionCode: '194C',
    tdsAmount: 42000,
    surcharge: 0,
    cess: 0,
    interest: 0,
    fee234E: 0,
    totalDeposit: 42000,
    minorHead: '200',
    csiMatched: true,
    unconsumedBalance: 0
  }
];

export const SAMPLE_FVU_DEDUCTEES: FvuDeducteeItem[] = [
  {
    id: 'DED-01',
    challanIndex: 1,
    deducteePan: 'AAACB1234D',
    deducteeName: 'BluePeak Cloud Consulting LLP',
    sectionCode: '194J',
    paymentDate: '2026-07-28',
    amountPaidOrCredited: 650000,
    taxDeductible: 65000,
    tdsDeducted: 65000,
    dateOfDeduction: '2026-07-28',
    panStatus: 'VALID'
  },
  {
    id: 'DED-02',
    challanIndex: 2,
    deducteePan: 'AABCS9821K',
    deducteeName: 'Swift Logistics & Facilities Pvt Ltd',
    sectionCode: '194C',
    paymentDate: '2026-08-25',
    amountPaidOrCredited: 2100000,
    taxDeductible: 42000,
    tdsDeducted: 42000,
    dateOfDeduction: '2026-08-25',
    panStatus: 'VALID'
  }
];

export const SAMPLE_CSI_RAW_DATA = [
  '0210041^2026-08-05^00412^65000.00^PRATWI SOLUTIONS PVT LTD',
  '0210041^2026-09-06^00591^42000.00^PRATWI SOLUTIONS PVT LTD'
];
