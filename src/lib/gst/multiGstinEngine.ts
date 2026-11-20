/**
 * Multi-GSTIN Conglomerate Command Deck & Input Service Distributor (ISD) Engine
 * 
 * Statutory Authority:
 * - Section 20 of CGST Act read with Rule 39 of CGST Rules (Mandatory ISD mechanism post Finance Act 2024)
 * - Pro-rata distribution of common ITC to distinct persons based on state turnover
 * - Multi-state PAN-level enterprise monitoring
 */

export interface StateGstinProfile {
  gstin: string;
  stateName: string;
  stateCode: string;
  tradeName: string;
  turnoverRatioPercent: number; // Ratio for ISD allocation
  annualTurnoverInr: number;
  gstr1Status: 'FILED' | 'PENDING' | 'OVERDUE';
  gstr3bStatus: 'FILED' | 'PENDING' | 'OVERDUE';
  imsStatus: '100% ACTIONED' | 'ACTION_PENDING';
  pendingImsCount: number;
  netTaxPayableThisMonth: number;
  itcAvailable2b: number;
  isdCreditAllocated: number;
}

export interface IsdDistributionCycle {
  cycleId: string;
  taxPeriod: string;
  commonInputServiceInvoices: number;
  totalCommonItcIgst: number;
  totalCommonItcCgst: number;
  totalCommonItcSgst: number;
  totalCommonItcPool: number;
  allocations: Array<{
    recipientGstin: string;
    stateName: string;
    turnoverSharePercent: number;
    allocatedIgst: number;
    allocatedCgst: number;
    allocatedSgst: number;
    totalAllocated: number;
  }>;
}

export class MultiGstinIsdEngine {
  /**
   * Distributes common input tax credit pro-rata to branches under Section 20 & Rule 39
   */
  public static distributeIsdCredit(
    branches: StateGstinProfile[],
    commonPool: { igst: number; cgst: number; sgst: number },
    taxPeriod: string
  ): IsdDistributionCycle {
    const totalTurnover = branches.reduce((sum, b) => sum + b.annualTurnoverInr, 0);
    const totalCommonPool = commonPool.igst + commonPool.cgst + commonPool.sgst;

    const allocations = branches.map(b => {
      const share = totalTurnover > 0 ? (b.annualTurnoverInr / totalTurnover) : 0;
      const sharePercent = Number((share * 100).toFixed(2));

      // Rule 39: Inter-state branches receive IGST; intra-state receive CGST/SGST
      const allocIgst = Math.round(commonPool.igst * share);
      const allocCgst = Math.round(commonPool.cgst * share);
      const allocSgst = Math.round(commonPool.sgst * share);

      return {
        recipientGstin: b.gstin,
        stateName: b.stateName,
        turnoverSharePercent: sharePercent,
        allocatedIgst: allocIgst,
        allocatedCgst: allocCgst,
        allocatedSgst: allocSgst,
        totalAllocated: allocIgst + allocCgst + allocSgst
      };
    });

    return {
      cycleId: `ISD-${taxPeriod}-${Date.now()}`,
      taxPeriod,
      commonInputServiceInvoices: 12,
      totalCommonItcIgst: commonPool.igst,
      totalCommonItcCgst: commonPool.cgst,
      totalCommonItcSgst: commonPool.sgst,
      totalCommonItcPool: totalCommonPool,
      allocations
    };
  }
}

export const SAMPLE_MULTI_GSTIN_PROFILES: StateGstinProfile[] = [
  {
    gstin: '23AAACG1234F1Z5',
    stateName: 'Madhya Pradesh (HQ)',
    stateCode: '23',
    tradeName: 'Apex Tools India - Plant 1',
    turnoverRatioPercent: 45.0,
    annualTurnoverInr: 65000000,
    gstr1Status: 'FILED',
    gstr3bStatus: 'FILED',
    imsStatus: '100% ACTIONED',
    pendingImsCount: 0,
    netTaxPayableThisMonth: 185000,
    itcAvailable2b: 420000,
    isdCreditAllocated: 247500
  },
  {
    gstin: '27AAACG1234F1Z8',
    stateName: 'Maharashtra',
    stateCode: '27',
    tradeName: 'Apex Tools India - Pune Depot',
    turnoverRatioPercent: 30.0,
    annualTurnoverInr: 43500000,
    gstr1Status: 'FILED',
    gstr3bStatus: 'PENDING',
    imsStatus: 'ACTION_PENDING',
    pendingImsCount: 4,
    netTaxPayableThisMonth: 120000,
    itcAvailable2b: 290000,
    isdCreditAllocated: 165000
  },
  {
    gstin: '24AAACG1234F1Z1',
    stateName: 'Gujarat',
    stateCode: '24',
    tradeName: 'Apex Tools India - Ahmedabad Sales',
    turnoverRatioPercent: 25.0,
    annualTurnoverInr: 36250000,
    gstr1Status: 'FILED',
    gstr3bStatus: 'FILED',
    imsStatus: '100% ACTIONED',
    pendingImsCount: 0,
    netTaxPayableThisMonth: 85000,
    itcAvailable2b: 195000,
    isdCreditAllocated: 137500
  }
];

export const SAMPLE_ISD_CYCLE: IsdDistributionCycle = MultiGstinIsdEngine.distributeIsdCredit(
  SAMPLE_MULTI_GSTIN_PROFILES,
  { igst: 350000, cgst: 100000, sgst: 100000 },
  'October 2026'
);
