/**
 * Foreign Asset (Schedule FA), Foreign Source Income (Schedule FSI) & Form 67 Engine
 * 
 * Statutory Authority:
 * - Black Money (Undisclosed Foreign Income and Assets) and Imposition of Tax Act, 2015 (Section 43 & 50: Rs. 10 Lakh penalty for non-disclosure in Schedule FA)
 * - Section 90 & 91 of Income Tax Act (Double Taxation Relief under DTAA)
 * - Rule 128 of Income Tax Rules (Mandatory filing of Form 67 for Foreign Tax Credit claim)
 * - Reporting of foreign stock plans (US tech RSU / ESPP from Google, Amazon, Microsoft, Meta)
 */

export interface ForeignAssetItem {
  id: string;
  countryCode: string; // ISO 2-letter (e.g. US, UK, SG)
  countryName: string;
  assetCategory: 'EQUITY_STOCK_RSU_ESPP' | 'DEPOSITORY_BANK_ACCOUNT' | 'CUSTODIAL_SECURITIES' | 'IMMOVABLE_PROPERTY' | 'OTHER_CAPITAL_ASSET';
  foreignEntityName: string;
  addressOfEntity: string;
  initialInvestmentDate: string;
  peakBalanceOrValueInr: number;
  closingBalanceOrValueInr: number;
  grossForeignIncomeInr: number;
  foreignTaxPaidInr: number;
  dtaaReliefClaimedSec90: number;
  isReportedInScheduleFa: boolean;
  form67Filed: boolean;
  form67AckNumber?: string;
  blackMoneyActRiskFlag?: boolean;
}

export class ForeignAssetFsiEngine {
  /**
   * Computes Section 90 / 91 Foreign Tax Credit under DTAA
   * Relief = Lower of (Foreign Tax Paid, Indian Tax on Doubly Taxed Income)
   */
  public static computeFtcRelief(foreignIncome: number, foreignTaxPaid: number, indianMarginalTaxRatePercent: number): {
    indianTaxOnForeignIncome: number;
    eligibleReliefAmount: number;
    form67Required: boolean;
  } {
    const indianTax = Math.round(foreignIncome * (indianMarginalTaxRatePercent / 100));
    const eligibleRelief = Math.min(foreignTaxPaid, indianTax);

    return {
      indianTaxOnForeignIncome: indianTax,
      eligibleReliefAmount: eligibleRelief,
      form67Required: eligibleRelief > 0
    };
  }

  /**
   * Evaluates Schedule FA disclosure compliance and flags Black Money Act penalty exposure
   */
  public static evaluateScheduleFaCompliance(assets: ForeignAssetItem[]): {
    totalPeakValueInr: number;
    totalClosingValueInr: number;
    totalForeignIncomeInr: number;
    totalDtaaReliefInr: number;
    blackMoneyPenaltyExposure: number; // ₹10,00,000 per undisclosed asset u/s 43
    assets: ForeignAssetItem[];
  } {
    let peakSum = 0;
    let closingSum = 0;
    let foreignIncomeSum = 0;
    let reliefSum = 0;
    let penalty = 0;

    const evaluated = assets.map(a => {
      peakSum += a.peakBalanceOrValueInr;
      closingSum += a.closingBalanceOrValueInr;
      foreignIncomeSum += a.grossForeignIncomeInr;
      reliefSum += a.dtaaReliefClaimedSec90;

      // Section 43 of Black Money Act: Failure to furnish in return of income information about an asset located outside India
      const isRisk = !a.isReportedInScheduleFa;
      if (isRisk) {
        penalty += 1000000; // Flat ₹10 Lakhs statutory penalty
      }

      return {
        ...a,
        blackMoneyActRiskFlag: isRisk
      };
    });

    return {
      totalPeakValueInr: peakSum,
      totalClosingValueInr: closingSum,
      totalForeignIncomeInr: foreignIncomeSum,
      totalDtaaReliefInr: reliefSum,
      blackMoneyPenaltyExposure: penalty,
      assets: evaluated
    };
  }
}

export const SAMPLE_FOREIGN_ASSETS: ForeignAssetItem[] = [
  {
    id: 'FA-01',
    countryCode: 'US',
    countryName: 'United States of America',
    assetCategory: 'EQUITY_STOCK_RSU_ESPP',
    foreignEntityName: 'Alphabet Inc. (Google LLC)',
    addressOfEntity: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
    initialInvestmentDate: '2021-03-25',
    peakBalanceOrValueInr: 8500000,
    closingBalanceOrValueInr: 7850000,
    grossForeignIncomeInr: 450000, // Dividend + Vesting
    foreignTaxPaidInr: 112500, // 25% US Withholding Tax (W-8BEN)
    dtaaReliefClaimedSec90: 112500,
    isReportedInScheduleFa: true,
    form67Filed: true,
    form67AckNumber: 'F67-2026-891024'
  },
  {
    id: 'FA-02',
    countryCode: 'US',
    countryName: 'United States of America',
    assetCategory: 'CUSTODIAL_SECURITIES',
    foreignEntityName: 'Charles Schwab & Co., Inc.',
    addressOfEntity: '3000 Schwab Way, Westlake, TX 76262',
    initialInvestmentDate: '2022-07-10',
    peakBalanceOrValueInr: 2400000,
    closingBalanceOrValueInr: 2150000,
    grossForeignIncomeInr: 65000,
    foreignTaxPaidInr: 16250,
    dtaaReliefClaimedSec90: 16250,
    isReportedInScheduleFa: true,
    form67Filed: true,
    form67AckNumber: 'F67-2026-891025'
  }
];
