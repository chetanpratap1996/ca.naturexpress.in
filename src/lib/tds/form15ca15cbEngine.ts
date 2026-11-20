/**
 * Form 15CA & 15CB Foreign Remittance Engine & DTAA Treaty Optimizer
 * 
 * Statutory Authority:
 * - Section 195 of Income Tax Act (TDS on payment to non-residents)
 * - Section 195(6) read with Rule 37BB of Income Tax Rules
 * - Section 90 / 90A (Double Taxation Avoidance Agreement - DTAA)
 * - Section 115A (Tax on dividends, royalties, and technical service fees)
 * - Mandatory prerequisites for DTAA relief: TRC (Tax Residency Certificate), Form 10F, No-PE Declaration
 */

export type Form15caPart = 'PART_A' | 'PART_B' | 'PART_C' | 'PART_D';

export interface ForeignRemittanceRequest {
  id: string;
  remitterName: string;
  remitterPan: string;
  beneficiaryName: string;
  beneficiaryCountry: string; // e.g., 'United States', 'Singapore', 'Germany'
  remittanceCurrency: string; // e.g., 'USD', 'EUR', 'GBP'
  remittanceAmountForeign: number;
  inrExchangeRate: number; // SBI TT Buying/Selling rate
  remittanceAmountInr: number;
  natureOfRemittance: 'ROYALTY_SOFTWARE' | 'FEES_FOR_TECHNICAL_SERVICES' | 'IMPORT_OF_GOODS' | 'MANAGEMENT_FEES' | 'INTEREST_DEBT';
  isChargeableToTax: boolean;
  hasAoOrderUnder195: boolean;
  aoOrderNumber?: string;
  aggregateRemittanceFyInr: number;
  
  // DTAA Relief Documentation
  isTrcAvailable: boolean;
  isForm10fFiled: boolean;
  isNoPeDeclarationObtained: boolean;
  isBeneficialOwnerConfirmed: boolean;
  
  // Tax Rates
  domesticActRatePercent: number; // e.g. 20% + Cess = 20.8%
  dtaaTreatyRatePercent: number; // e.g. 10% or 15%
  
  // Engine Evaluation
  determined15caPart: Form15caPart;
  effectiveTdsRatePercent: number;
  grossTdsAmountInr: number;
  netRemittancePayableForeign: number;
  is15cbMandatory: boolean;
  dtaaReliefGranted: boolean;
  udinNumber?: string;
}

export class Form15ca15cbEngine {
  /**
   * Evaluates Rule 37BB Part A/B/C/D Decision Tree & Optimizes DTAA Treaty Rate
   */
  public static evaluateForeignRemittance(data: {
    remitterName: string;
    remitterPan: string;
    beneficiaryName: string;
    beneficiaryCountry: string;
    remittanceCurrency: string;
    remittanceAmountForeign: number;
    inrExchangeRate: number;
    natureOfRemittance: 'ROYALTY_SOFTWARE' | 'FEES_FOR_TECHNICAL_SERVICES' | 'IMPORT_OF_GOODS' | 'MANAGEMENT_FEES' | 'INTEREST_DEBT';
    isChargeableToTax: boolean;
    hasAoOrderUnder195: boolean;
    aoOrderNumber?: string;
    aggregateRemittanceFyInr: number;
    isTrcAvailable: boolean;
    isForm10fFiled: boolean;
    isNoPeDeclarationObtained: boolean;
    isBeneficialOwnerConfirmed: boolean;
    domesticActRatePercent: number;
    dtaaTreatyRatePercent: number;
  }): ForeignRemittanceRequest {
    const amountInr = Math.round(data.remittanceAmountForeign * data.inrExchangeRate);
    const totalFyInr = data.aggregateRemittanceFyInr + amountInr;

    // 1. Evaluate Rule 37BB Part
    let determinedPart: Form15caPart = 'PART_C';
    let is15cbReq = false;

    if (!data.isChargeableToTax || data.natureOfRemittance === 'IMPORT_OF_GOODS') {
      determinedPart = 'PART_D';
      is15cbReq = false;
    } else if (data.hasAoOrderUnder195) {
      determinedPart = 'PART_B';
      is15cbReq = false;
    } else if (totalFyInr <= 500000) {
      determinedPart = 'PART_A';
      is15cbReq = false;
    } else {
      determinedPart = 'PART_C';
      is15cbReq = true;
    }

    // 2. Evaluate DTAA vs Domestic Tax Rate
    let effectiveRate = data.domesticActRatePercent;
    let dtaaGranted = false;

    if (data.isChargeableToTax && data.natureOfRemittance !== 'IMPORT_OF_GOODS') {
      const dtaaEligible = 
        data.isTrcAvailable && 
        data.isForm10fFiled && 
        data.isNoPeDeclarationObtained && 
        data.isBeneficialOwnerConfirmed;

      if (dtaaEligible && data.dtaaTreatyRatePercent < data.domesticActRatePercent) {
        effectiveRate = data.dtaaTreatyRatePercent;
        dtaaGranted = true;
      } else {
        effectiveRate = data.domesticActRatePercent;
        dtaaGranted = false;
      }
    } else {
      effectiveRate = 0;
      dtaaGranted = false;
    }

    const tdsInr = Math.round(amountInr * (effectiveRate / 100));
    const tdsForeign = tdsInr / data.inrExchangeRate;
    const netForeign = Number((data.remittanceAmountForeign - tdsForeign).toFixed(2));

    return {
      id: `REM-${Math.floor(1000 + Math.random() * 9000)}`,
      remitterName: data.remitterName,
      remitterPan: data.remitterPan,
      beneficiaryName: data.beneficiaryName,
      beneficiaryCountry: data.beneficiaryCountry,
      remittanceCurrency: data.remittanceCurrency,
      remittanceAmountForeign: data.remittanceAmountForeign,
      inrExchangeRate: data.inrExchangeRate,
      remittanceAmountInr: amountInr,
      natureOfRemittance: data.natureOfRemittance,
      isChargeableToTax: data.isChargeableToTax,
      hasAoOrderUnder195: data.hasAoOrderUnder195,
      aoOrderNumber: data.aoOrderNumber,
      aggregateRemittanceFyInr: totalFyInr,
      isTrcAvailable: data.isTrcAvailable,
      isForm10fFiled: data.isForm10fFiled,
      isNoPeDeclarationObtained: data.isNoPeDeclarationObtained,
      isBeneficialOwnerConfirmed: data.isBeneficialOwnerConfirmed,
      domesticActRatePercent: data.domesticActRatePercent,
      dtaaTreatyRatePercent: data.dtaaTreatyRatePercent,
      determined15caPart: determinedPart,
      effectiveTdsRatePercent: effectiveRate,
      grossTdsAmountInr: tdsInr,
      netRemittancePayableForeign: netForeign,
      is15cbMandatory: is15cbReq,
      dtaaReliefGranted: dtaaGranted,
      udinNumber: is15cbReq ? '26049210AAAA9821' : undefined
    };
  }
}

export const SAMPLE_FOREIGN_REMITTANCES: ForeignRemittanceRequest[] = [
  Form15ca15cbEngine.evaluateForeignRemittance({
    remitterName: 'Pratwi Solutions Private Limited',
    remitterPan: 'AABCP9182K',
    beneficiaryName: 'Amazon Web Services Inc.',
    beneficiaryCountry: 'United States',
    remittanceCurrency: 'USD',
    remittanceAmountForeign: 45000, // $45,000 (~₹37.8 Lakhs)
    inrExchangeRate: 84.15,
    natureOfRemittance: 'ROYALTY_SOFTWARE',
    isChargeableToTax: true,
    hasAoOrderUnder195: false,
    aggregateRemittanceFyInr: 1200000,
    isTrcAvailable: true,
    isForm10fFiled: true,
    isNoPeDeclarationObtained: true,
    isBeneficialOwnerConfirmed: true,
    domesticActRatePercent: 20.8, // 20% + 4% cess
    dtaaTreatyRatePercent: 10.0 // Indo-US DTAA Article 12 (10%)
  }),
  Form15ca15cbEngine.evaluateForeignRemittance({
    remitterName: 'Pratwi Solutions Private Limited',
    remitterPan: 'AABCP9182K',
    beneficiaryName: 'Shenzhen Precision Machinery Co.',
    beneficiaryCountry: 'China',
    remittanceCurrency: 'USD',
    remittanceAmountForeign: 18000,
    inrExchangeRate: 84.15,
    natureOfRemittance: 'IMPORT_OF_GOODS',
    isChargeableToTax: false, // Import of goods not chargeable
    hasAoOrderUnder195: false,
    aggregateRemittanceFyInr: 2500000,
    isTrcAvailable: false,
    isForm10fFiled: false,
    isNoPeDeclarationObtained: false,
    isBeneficialOwnerConfirmed: false,
    domesticActRatePercent: 0,
    dtaaTreatyRatePercent: 0
  })
];
