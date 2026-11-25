/**
 * Multi-GSTIN & Input Service Distributor (ISD) Engine
 *
 * Statutory Authority:
 * - Section 20 of CGST Act read with Rule 39 of CGST Rules (Mandatory ISD mechanism)
 * - Rule 39(1)(e)/(f): CGST/SGST distributed to a distinct person in a DIFFERENT state MUST be distributed as IGST;
 *   only recipients in the SAME state as the ISD receive CGST + SGST (and IGST always remains IGST).
 */

export interface StateGstinProfile {
  gstin: string;
  stateName: string;
  stateCode: string;
  tradeName: string;
  turnoverRatioPercent: number;
  annualTurnoverInr: number;
  gstr1Status: "FILED" | "PENDING" | "OVERDUE";
  gstr3bStatus: "FILED" | "PENDING" | "OVERDUE";
  isdCreditAllocated: number;
}

export interface IsdDistributionCycle {
  cycleId: string;
  isdGstin: string;
  isdStateCode: string;
  taxPeriod: string;
  totalCommonItcIgst: number;
  totalCommonItcCgst: number;
  totalCommonItcSgst: number;
  totalCommonItcPool: number;
  allocations: Array<{
    recipientGstin: string;
    stateCode: string;
    stateName: string;
    isInterState: boolean;
    turnoverSharePercent: number;
    allocatedIgst: number;
    allocatedCgst: number;
    allocatedSgst: number;
    totalAllocated: number;
  }>;
}

export class MultiGstinIsdEngine {
  /**
   * Distributes common input service tax credit pro-rata under Section 20 & Rule 39.
   */
  public static distributeIsdCredit(
    branches: StateGstinProfile[],
    commonPool: { igst: number; cgst: number; sgst: number },
    taxPeriod: string,
    isdGstin: string = ""
  ): IsdDistributionCycle {
    const isdStateCode = isdGstin.length >= 2 ? isdGstin.substring(0, 2) : (branches[0]?.stateCode || "");
    const totalTurnover = branches.reduce((sum, b) => sum + Math.max(0, b.annualTurnoverInr), 0);
    const totalCommonPool = Math.round((commonPool.igst + commonPool.cgst + commonPool.sgst) * 100) / 100;

    let runningIgstAllocated = 0;
    let runningCgstAllocated = 0;
    let runningSgstAllocated = 0;

    const allocations = branches.map((b, idx) => {
      const share = totalTurnover > 0 ? Math.max(0, b.annualTurnoverInr) / totalTurnover : branches.length > 0 ? 1 / branches.length : 0;
      const sharePercent = Number((share * 100).toFixed(2));
      const isInterState = Boolean(isdStateCode && b.stateCode && b.stateCode !== isdStateCode);

      let allocIgst = 0;
      let allocCgst = 0;
      let allocSgst = 0;

      if (isInterState) {
        // Rule 39: Inter-state recipients receive ALL CGST + SGST converted into IGST
        allocIgst = Math.round((commonPool.igst + commonPool.cgst + commonPool.sgst) * share);
      } else {
        allocIgst = Math.round(commonPool.igst * share);
        allocCgst = Math.round(commonPool.cgst * share);
        allocSgst = Math.round(commonPool.sgst * share);
      }

      // Adjust last recipient for exact rupee rounding parity
      if (idx === branches.length - 1 && branches.length > 0) {
        const expectedTotalAllocated = totalCommonPool;
        const soFar = runningIgstAllocated + runningCgstAllocated + runningSgstAllocated;
        const targetThis = Math.round((expectedTotalAllocated - soFar) * 100) / 100;
        if (isInterState) {
          allocIgst = Math.max(0, targetThis);
        } else {
          const currentThis = allocIgst + allocCgst + allocSgst;
          const diff = Math.round(targetThis - currentThis);
          allocIgst = Math.max(0, allocIgst + diff);
        }
      }

      runningIgstAllocated += allocIgst;
      runningCgstAllocated += allocCgst;
      runningSgstAllocated += allocSgst;

      return {
        recipientGstin: b.gstin,
        stateCode: b.stateCode,
        stateName: b.stateName,
        isInterState,
        turnoverSharePercent: sharePercent,
        allocatedIgst: allocIgst,
        allocatedCgst: allocCgst,
        allocatedSgst: allocSgst,
        totalAllocated: allocIgst + allocCgst + allocSgst,
      };
    });

    return {
      cycleId: `ISD-${taxPeriod.replace(/\s+/g, "_")}`,
      isdGstin,
      isdStateCode,
      taxPeriod,
      totalCommonItcIgst: commonPool.igst,
      totalCommonItcCgst: commonPool.cgst,
      totalCommonItcSgst: commonPool.sgst,
      totalCommonItcPool: totalCommonPool,
      allocations,
    };
  }
}
