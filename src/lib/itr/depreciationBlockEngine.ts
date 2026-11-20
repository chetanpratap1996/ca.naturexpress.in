/**
 * Section 32 Depreciation Block-of-Assets & Additional Depreciation Engine
 * 
 * Statutory Authority:
 * - Section 32(1) of Income Tax Act (Depreciation on Block of Assets)
 * - Section 32(1)(iia) (Additional Depreciation @ 20% on new plant & machinery in manufacturing)
 * - Second Proviso to Section 32(1)(ii) (Asset put to use < 180 days eligible for only 50% of prescribed rate)
 * - Section 32(1)(iii) (Terminal depreciation on standalone assets / power units)
 * - Form 3CD Clause 18 Annexure generation
 */

export interface AssetBlockItem {
  blockId: string;
  assetClass: 'BUILDINGS_RESIDENTIAL' | 'BUILDINGS_COMMERCIAL' | 'FURNITURE_FIXTURES' | 'PLANT_MACHINERY_GENERAL' | 'COMPUTERS_LAPTOPS' | 'MOTOR_CARS';
  ratePercent: number; // 5%, 10%, 15%, 40%
  openingWdv: number;
  additionsMoreThan180Days: number;
  additionsLessThan180Days: number;
  isEligibleForAdditionalDepreciation: boolean; // Sec 32(1)(iia)
  additionalDepreciationAdditionsMoreThan180: number;
  additionalDepreciationAdditionsLessThan180: number;
  moneysRealizedDeletions: number; // Sale price / insurance scrap
  
  // Computed Results
  totalCostAvailableForDepreciation: number;
  normalDepreciationAllowed: number;
  additionalDepreciationAllowed: number;
  totalDepreciationClaimed: number;
  closingWdv: number;
  capitalGainSec50: number; // Deemed STCG if deletions > (opening + additions)
  isBlockCeasedToExist: boolean;
}

export class Section32DepreciationEngine {
  /**
   * Computes depreciation on a single block of assets under Section 32
   */
  public static computeBlock(b: {
    blockId: string;
    assetClass: 'BUILDINGS_RESIDENTIAL' | 'BUILDINGS_COMMERCIAL' | 'FURNITURE_FIXTURES' | 'PLANT_MACHINERY_GENERAL' | 'COMPUTERS_LAPTOPS' | 'MOTOR_CARS';
    ratePercent: number;
    openingWdv: number;
    additionsMoreThan180Days: number;
    additionsLessThan180Days: number;
    isEligibleForAdditionalDepreciation: boolean;
    additionalDepreciationAdditionsMoreThan180?: number;
    additionalDepreciationAdditionsLessThan180?: number;
    moneysRealizedDeletions: number;
  }): AssetBlockItem {
    const totalAdditions = b.additionsMoreThan180Days + b.additionsLessThan180Days;
    const pool = b.openingWdv + totalAdditions;

    // Check Section 50: If sale consideration exceeds pool, block becomes NIL and difference is deemed STCG
    if (b.moneysRealizedDeletions >= pool) {
      const stcg = b.moneysRealizedDeletions - pool;
      return {
        ...b,
        additionalDepreciationAdditionsMoreThan180: b.additionalDepreciationAdditionsMoreThan180 || 0,
        additionalDepreciationAdditionsLessThan180: b.additionalDepreciationAdditionsLessThan180 || 0,
        totalCostAvailableForDepreciation: 0,
        normalDepreciationAllowed: 0,
        additionalDepreciationAllowed: 0,
        totalDepreciationClaimed: 0,
        closingWdv: 0,
        capitalGainSec50: stcg,
        isBlockCeasedToExist: true
      };
    }

    const netCostBeforeDepreciation = pool - b.moneysRealizedDeletions;

    // Second Proviso to Section 32(1): Put to use for < 180 days gets 50% rate
    // If deletions exist, they are first adjusted against Opening WDV + Additions > 180 days
    const eligibleFullRateBase = Math.max(0, b.openingWdv + b.additionsMoreThan180Days - b.moneysRealizedDeletions);
    const eligibleHalfRateBase = Math.min(netCostBeforeDepreciation - eligibleFullRateBase, b.additionsLessThan180Days);

    const normalDepreciationFull = Math.round(eligibleFullRateBase * (b.ratePercent / 100));
    const normalDepreciationHalf = Math.round(eligibleHalfRateBase * (b.ratePercent / 100) * 0.50);
    const totalNormalDepn = normalDepreciationFull + normalDepreciationHalf;

    // Section 32(1)(iia) Additional Depreciation @ 20% on new plant and machinery
    let additionalDepn = 0;
    if (b.isEligibleForAdditionalDepreciation && b.assetClass === 'PLANT_MACHINERY_GENERAL') {
      const addMore = b.additionalDepreciationAdditionsMoreThan180 || 0;
      const addLess = b.additionalDepreciationAdditionsLessThan180 || 0;
      const addDepnFull = Math.round(addMore * 0.20);
      const addDepnHalf = Math.round(addLess * 0.20 * 0.50); // 10% this year, remaining 10% in next year
      additionalDepn = addDepnFull + addDepnHalf;
    }

    const totalDepn = Math.min(netCostBeforeDepreciation, totalNormalDepn + additionalDepn);
    const closingWdv = netCostBeforeDepreciation - totalDepn;

    return {
      ...b,
      additionalDepreciationAdditionsMoreThan180: b.additionalDepreciationAdditionsMoreThan180 || 0,
      additionalDepreciationAdditionsLessThan180: b.additionalDepreciationAdditionsLessThan180 || 0,
      totalCostAvailableForDepreciation: netCostBeforeDepreciation,
      normalDepreciationAllowed: totalNormalDepn,
      additionalDepreciationAllowed: additionalDepn,
      totalDepreciationClaimed: totalDepn,
      closingWdv,
      capitalGainSec50: 0,
      isBlockCeasedToExist: false
    };
  }
}

export const SAMPLE_DEPRECIATION_BLOCKS: AssetBlockItem[] = [
  Section32DepreciationEngine.computeBlock({
    blockId: 'BLK-01',
    assetClass: 'PLANT_MACHINERY_GENERAL',
    ratePercent: 15,
    openingWdv: 14500000,
    additionsMoreThan180Days: 2500000,
    additionsLessThan180Days: 1200000,
    isEligibleForAdditionalDepreciation: true,
    additionalDepreciationAdditionsMoreThan180: 2500000,
    additionalDepreciationAdditionsLessThan180: 1200000,
    moneysRealizedDeletions: 0
  }),
  Section32DepreciationEngine.computeBlock({
    blockId: 'BLK-02',
    assetClass: 'COMPUTERS_LAPTOPS',
    ratePercent: 40,
    openingWdv: 450000,
    additionsMoreThan180Days: 150000,
    additionsLessThan180Days: 0,
    isEligibleForAdditionalDepreciation: false,
    moneysRealizedDeletions: 50000
  }),
  Section32DepreciationEngine.computeBlock({
    blockId: 'BLK-03',
    assetClass: 'BUILDINGS_COMMERCIAL',
    ratePercent: 10,
    openingWdv: 28000000,
    additionsMoreThan180Days: 1800000,
    additionsLessThan180Days: 0,
    isEligibleForAdditionalDepreciation: false,
    moneysRealizedDeletions: 0
  })
];
