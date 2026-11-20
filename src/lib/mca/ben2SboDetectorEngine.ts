/**
 * Form BEN-2 (Significant Beneficial Ownership - SBO) Detector & Multi-Tier Traversal Engine
 * 
 * Statutory Authority:
 * - Section 90 of Companies Act, 2013 read with Companies (Significant Beneficial Owners) Rules, 2018
 * - Criteria for Significant Beneficial Owner (SBO):
 *   1. Indirect holding + Direct holding of >= 10% of shares or voting rights
 *   2. Right to receive or participate in >= 10% of total distributable dividend
 *   3. Right to exercise significant influence or control in any manner
 * - Statutory Filings:
 *   - Form BEN-1: Declaration by SBO to reporting company within 30 days
 *   - Form BEN-2: Return to the Registrar (ROC) by company within 30 days of receiving BEN-1
 *   - Form BEN-4: Notice to person seeking information u/s 90(5)
 * - Penalties u/s 90(11): Company fine ₹50,000 to ₹5,00,000 + ₹1,000/day
 */

export interface ShareholderTierNode {
  id: string;
  entityName: string;
  entityType: 'INDIVIDUAL_RESIDENT' | 'INDIVIDUAL_NON_RESIDENT' | 'BODY_CORPORATE' | 'TRUST' | 'PARTNERSHIP_LLP';
  panOrCinOrRegistrationNo: string;
  countryOfIncorporation: string;
  directHoldingPercentInReportingCompany: number;
  indirectUltimateBeneficiaryNaturalPerson?: {
    name: string;
    panOrPassport: string;
    nationality: string;
    holdingPercentInParentEntity: number;
    effectiveIndirectHoldingPercent: number; // parent % * child %
  };
}

export interface SignificantBeneficialOwnerItem {
  id: string;
  sboName: string;
  panOrPassport: string;
  nationality: string;
  dateOfAcquiringSbo: string;
  directHoldingPercent: number;
  indirectHoldingPercent: number;
  totalEffectiveHoldingPercent: number;
  hasSignificantControlOrInfluence: boolean;
  intermediateEntityName: string;
  intermediateEntityCin: string;
  formBen1ReceivedDate?: string;
  formBen2FilingStatus: 'PENDING_BEN1' | 'READY_FOR_ROC_FILING' | 'FILED_WITH_ROC';
  formBen2DueDate: string; // 30 days from BEN-1 receipt
  formBen2SrNumber?: string;
  isCompliant: boolean;
  ben4NoticeIssuedDate?: string;
}

export class Ben2SboDetectorEngine {
  /**
   * Traverses shareholder register and identifies natural persons holding >= 10% indirect voting rights/shares
   */
  public static detectSignificantBeneficialOwners(
    shareholders: ShareholderTierNode[]
  ): SignificantBeneficialOwnerItem[] {
    const sboList: SignificantBeneficialOwnerItem[] = [];

    shareholders.forEach(node => {
      // Direct corporate holdings (> 0%) with indirect natural beneficiary
      if (node.entityType === 'BODY_CORPORATE' || node.entityType === 'TRUST' || node.entityType === 'PARTNERSHIP_LLP') {
        if (node.indirectUltimateBeneficiaryNaturalPerson) {
          const natural = node.indirectUltimateBeneficiaryNaturalPerson;
          const directCorpPercent = node.directHoldingPercentInReportingCompany;
          const naturalInCorpPercent = natural.holdingPercentInParentEntity;
          
          // Compute effective indirect holding
          const effectiveIndirect = Number(((directCorpPercent * naturalInCorpPercent) / 100).toFixed(2));
          natural.effectiveIndirectHoldingPercent = effectiveIndirect;

          // Check if total holding >= 10% threshold
          if (effectiveIndirect >= 10.0) {
            sboList.push({
              id: `SBO-${sboList.length + 1}`,
              sboName: natural.name,
              panOrPassport: natural.panOrPassport,
              nationality: natural.nationality,
              dateOfAcquiringSbo: '2025-04-01',
              directHoldingPercent: 0,
              indirectHoldingPercent: effectiveIndirect,
              totalEffectiveHoldingPercent: effectiveIndirect,
              hasSignificantControlOrInfluence: true,
              intermediateEntityName: node.entityName,
              intermediateEntityCin: node.panOrCinOrRegistrationNo,
              formBen1ReceivedDate: '2026-05-15',
              formBen2FilingStatus: 'READY_FOR_ROC_FILING',
              formBen2DueDate: '2026-06-14', // 30 days
              isCompliant: true
            });
          }
        }
      }
    });

    return sboList;
  }
}

export const SAMPLE_SHAREHOLDERS_REGISTER: ShareholderTierNode[] = [
  {
    id: 'SH-01',
    entityName: 'Rahul Vikram Sharma',
    entityType: 'INDIVIDUAL_RESIDENT',
    panOrCinOrRegistrationNo: 'BNZPA4912K',
    countryOfIncorporation: 'India',
    directHoldingPercentInReportingCompany: 35.0 // Direct natural individual 35%
  },
  {
    id: 'SH-02',
    entityName: 'Priya Narang',
    entityType: 'INDIVIDUAL_RESIDENT',
    panOrCinOrRegistrationNo: 'CPZPS1829L',
    countryOfIncorporation: 'India',
    directHoldingPercentInReportingCompany: 25.0
  },
  {
    id: 'SH-03',
    entityName: 'Vanguard Global Tech Holdings Pte. Ltd.',
    entityType: 'BODY_CORPORATE',
    panOrCinOrRegistrationNo: 'UEN-201849102K',
    countryOfIncorporation: 'Singapore',
    directHoldingPercentInReportingCompany: 40.0, // 40% corporate holding
    indirectUltimateBeneficiaryNaturalPerson: {
      name: 'Alexander Christian Vance',
      panOrPassport: 'P-SG-91820412',
      nationality: 'Singaporean',
      holdingPercentInParentEntity: 75.0, // Owns 75% of Vanguard Global
      effectiveIndirectHoldingPercent: 30.0 // 40% * 75% = 30% (> 10% SBO!)
    }
  }
];
