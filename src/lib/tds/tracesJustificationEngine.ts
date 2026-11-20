/**
 * TRACES Justification Report (Default Sheet) Analyzer & C1-C9 Online Correction Engine
 * 
 * Statutory Authority:
 * - Section 200A of Income Tax Act (Processing of statements of tax deducted at source)
 * - Section 201(1A): Penal interest for failure to deduct (1% p.m.) or pay (1.5% p.m.)
 * - Section 234E: Fee for default in furnishing statements (₹200 per day)
 * - Section 206AA: Higher 20% rate for invalid / missing PAN
 * - Section 206AB: Special provision for deduction of tax at higher rate for non-filers
 * - TRACES Online Correction Categories (C1, C2, C3, C9)
 */

export type TracesDefaultCategory = 
  | 'SHORT_DEDUCTION_206AA'
  | 'SHORT_DEDUCTION_206AB'
  | 'SHORT_DEDUCTION_RATE_MISMATCH'
  | 'SHORT_PAYMENT_UNMATCHED_CHALLAN'
  | 'INTEREST_201_1A_DEDUCTION_DELAY'
  | 'INTEREST_201_1A_DEPOSIT_DELAY'
  | 'LATE_FILING_FEE_234E';

export type TracesCorrectionType = 'C1_CHALLAN_UPDATE' | 'C2_PAN_CORRECTION' | 'C3_DEDUCTEE_MODIFICATION' | 'C9_ADD_NEW_CHALLAN';

export interface TracesDefaultRecord {
  id: string;
  panOfDeductee: string;
  nameOfDeductee: string;
  sectionCode: string;
  challanSerialNo: string;
  defaultCategory: TracesDefaultCategory;
  defaultDescription: string;
  amountUnderDefault: number;
  penalInterestOrFee: number;
  recommendedCorrection: TracesCorrectionType;
  correctionActionSteps: string;
  isCured: boolean;
  curedDetails?: string;
}

export interface TracesJustificationSummary {
  tan: string;
  financialYear: string;
  quarter: string;
  formType: string;
  totalDefaultsCount: number;
  totalShortDeductionAmount: number;
  totalShortPaymentAmount: number;
  totalInterest201_1A: number;
  totalLateFee234E: number;
  totalDemandAmount: number;
  c1ChallanCorrectionsCount: number;
  c2PanCorrectionsCount: number;
  c3DeducteeCorrectionsCount: number;
  c9AddChallanCount: number;
}

export class TracesJustificationEngine {
  /**
   * Parses raw justification report text stream and categorizes defaults
   */
  public static parseJustificationText(lines: string[]): TracesDefaultRecord[] {
    const defaults: TracesDefaultRecord[] = [];

    // Mock/Simulated parsing of standard TRACES justification structure
    lines.forEach((line, idx) => {
      if (line.includes('206AA') || line.includes('INVALID PAN')) {
        defaults.push({
          id: `DEF-00${idx + 1}`,
          panOfDeductee: 'PANNOTAVBL',
          nameOfDeductee: 'Apex Fabrication Works',
          sectionCode: '194C',
          challanSerialNo: '00412',
          defaultCategory: 'SHORT_DEDUCTION_206AA',
          defaultDescription: 'Deducted @ 2% instead of mandated 20% due to invalid/missing PAN u/s 206AA.',
          amountUnderDefault: 45000,
          penalInterestOrFee: 4050,
          recommendedCorrection: 'C2_PAN_CORRECTION',
          correctionActionSteps: 'Obtain valid PAN from contractor and submit Online Correction C2 on TRACES portal to cancel ₹45,000 demand.',
          isCured: false
        });
      } else if (line.includes('234E') || line.includes('LATE FEE')) {
        defaults.push({
          id: `DEF-00${idx + 1}`,
          panOfDeductee: 'N/A',
          nameOfDeductee: 'System Late Filing Demand',
          sectionCode: '234E',
          challanSerialNo: 'N/A',
          defaultCategory: 'LATE_FILING_FEE_234E',
          defaultDescription: 'Return filed 14 days after statutory quarterly due date. Late fee computed @ ₹200/day.',
          amountUnderDefault: 2800,
          penalInterestOrFee: 2800,
          recommendedCorrection: 'C9_ADD_NEW_CHALLAN',
          correctionActionSteps: 'Deposit ₹2,800 under Minor Head 200 fee u/s 234E and tag via C9 correction.',
          isCured: false
        });
      }
    });

    return defaults;
  }

  /**
   * Summarizes total TRACES defaults and required corrections
   */
  public static summarizeJustification(
    records: TracesDefaultRecord[], 
    meta: { tan: string; financialYear: string; quarter: string; formType: string }
  ): TracesJustificationSummary {
    let shortDed = 0;
    let shortPay = 0;
    let interest = 0;
    let fee = 0;
    let c1 = 0;
    let c2 = 0;
    let c3 = 0;
    let c9 = 0;

    records.forEach(r => {
      if (r.defaultCategory.startsWith('SHORT_DEDUCTION')) {
        shortDed += r.amountUnderDefault;
        interest += r.penalInterestOrFee;
      } else if (r.defaultCategory.startsWith('SHORT_PAYMENT')) {
        shortPay += r.amountUnderDefault;
        interest += r.penalInterestOrFee;
      } else if (r.defaultCategory.startsWith('INTEREST')) {
        interest += r.penalInterestOrFee;
      } else if (r.defaultCategory === 'LATE_FILING_FEE_234E') {
        fee += r.penalInterestOrFee;
      }

      if (r.recommendedCorrection === 'C1_CHALLAN_UPDATE') c1++;
      if (r.recommendedCorrection === 'C2_PAN_CORRECTION') c2++;
      if (r.recommendedCorrection === 'C3_DEDUCTEE_MODIFICATION') c3++;
      if (r.recommendedCorrection === 'C9_ADD_NEW_CHALLAN') c9++;
    });

    return {
      tan: meta.tan,
      financialYear: meta.financialYear,
      quarter: meta.quarter,
      formType: meta.formType,
      totalDefaultsCount: records.length,
      totalShortDeductionAmount: shortDed,
      totalShortPaymentAmount: shortPay,
      totalInterest201_1A: interest,
      totalLateFee234E: fee,
      totalDemandAmount: shortDed + shortPay + interest + fee,
      c1ChallanCorrectionsCount: c1,
      c2PanCorrectionsCount: c2,
      c3DeducteeCorrectionsCount: c3,
      c9AddChallanCount: c9
    };
  }
}

export const SAMPLE_TRACES_DEFAULTS: TracesDefaultRecord[] = [
  {
    id: 'TRC-DEF-01',
    panOfDeductee: 'PANNOTAVBL',
    nameOfDeductee: 'Apex Fabrication & Engineering Works',
    sectionCode: '194C',
    challanSerialNo: '00412',
    defaultCategory: 'SHORT_DEDUCTION_206AA',
    defaultDescription: 'Deducted @ 2% instead of mandated 20% due to invalid/missing PAN u/s 206AA.',
    amountUnderDefault: 45000,
    penalInterestOrFee: 4050,
    recommendedCorrection: 'C2_PAN_CORRECTION',
    correctionActionSteps: 'Obtain valid PAN from contractor and submit Online Correction C2 on TRACES portal to cancel ₹45,000 demand.',
    isCured: false
  },
  {
    id: 'TRC-DEF-02',
    panOfDeductee: 'AAACI9912M',
    nameOfDeductee: 'Narmada Logistics Pvt Ltd',
    sectionCode: '194C',
    challanSerialNo: '00591',
    defaultCategory: 'INTEREST_201_1A_DEPOSIT_DELAY',
    defaultDescription: 'Tax deducted on 15-Jul-2026 but deposited on 12-Sep-2026 (delay of 2 months). Interest charged @ 1.5% p.m.',
    amountUnderDefault: 0,
    penalInterestOrFee: 1890,
    recommendedCorrection: 'C9_ADD_NEW_CHALLAN',
    correctionActionSteps: 'Deposit ₹1,890 penal interest via Challan 281 and tag to deductee via C9 online correction.',
    isCured: false
  },
  {
    id: 'TRC-DEF-03',
    panOfDeductee: 'N/A',
    nameOfDeductee: 'Statutory Filing Delay Demand',
    sectionCode: '234E',
    challanSerialNo: 'N/A',
    defaultCategory: 'LATE_FILING_FEE_234E',
    defaultDescription: 'Return filed 12 days past due date (Due: 31-Jul-2026, Filed: 12-Aug-2026). Fee: 12 x ₹200 = ₹2,400.',
    amountUnderDefault: 2400,
    penalInterestOrFee: 2400,
    recommendedCorrection: 'C9_ADD_NEW_CHALLAN',
    correctionActionSteps: 'Pay ₹2,400 under Minor Head 200 (Fee u/s 234E) to extinguish portal demand notice.',
    isCured: false
  }
];
