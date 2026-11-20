/**
 * Section 115BBH Crypto / Virtual Digital Asset (VDA) Forensic Ledger
 * 
 * Statutory Authority:
 * - Section 115BBH of Income Tax Act (Tax on transfer of virtual digital assets @ 30%)
 * - Section 115BBH(2)(a) (No deduction in respect of any expenditure other than cost of acquisition)
 * - Section 115BBH(2)(b) (No set-off of loss from transfer of VDA against any other income, nor carry-forward)
 * - Section 194S (TDS @ 1% on transfer of VDA)
 * - Schedule VDA reporting in ITR-2 / ITR-3
 */

export interface VdaTransactionRecord {
  id: string;
  cryptoSymbol: 'BTC' | 'ETH' | 'SOL' | 'USDT' | 'NFT';
  cryptoName: string;
  exchangeName: string; // CoinDCX, WazirX, Binance
  dateOfAcquisition: string;
  dateOfTransfer: string;
  costOfAcquisitionInr: number;
  saleConsiderationInr: number;
  grossGainOrLossInr: number;
  taxableIncomeInr: number; // Only gains taxed; losses cannot be set off
  taxLiability30Percent: number;
  tdsDeductedSec194S: number;
  tdsChallanMatched26As: boolean;
}

export interface VdaAnnualAuditReport {
  assessmentYear: string;
  totalVdaSalesConsideration: number;
  totalCostOfAcquisition: number;
  totalGrossGains: number;
  totalGrossLosses: number; // Cannot be set off against gains!
  netTaxableVdaIncome: number;
  totalTaxLiability30Percent: number;
  totalTdsCreditSec194S: number;
  netTaxPayableOrRefund: number;
  statutoryRuleWarning: string;
  transactions: VdaTransactionRecord[];
}

export class Section115BbhVdaEngine {
  /**
   * Computes individual VDA trade and enforces statutory ring-fencing
   */
  public static evaluateVdaTrade(trade: {
    id: string;
    cryptoSymbol: 'BTC' | 'ETH' | 'SOL' | 'USDT' | 'NFT';
    cryptoName: string;
    exchangeName: string;
    dateOfAcquisition: string;
    dateOfTransfer: string;
    costOfAcquisitionInr: number;
    saleConsiderationInr: number;
    tdsDeductedSec194S: number;
    tdsChallanMatched26As: boolean;
  }): VdaTransactionRecord {
    const gainOrLoss = trade.saleConsiderationInr - trade.costOfAcquisitionInr;
    // Section 115BBH: Only gains are taxed; losses cannot reduce other gains or income
    const taxableIncome = Math.max(0, gainOrLoss);
    const tax = Math.round(taxableIncome * 0.30); // 30% flat rate

    return {
      ...trade,
      grossGainOrLossInr: gainOrLoss,
      taxableIncomeInr: taxableIncome,
      taxLiability30Percent: tax
    };
  }

  /**
   * Computes Annual Schedule VDA Tax Liability
   * Enforces Section 115BBH(2)(b): Loss in one crypto coin cannot even be set off against gain in another coin!
   */
  public static computeAnnualVdaSummary(trades: VdaTransactionRecord[]): VdaAnnualAuditReport {
    let totalSales = 0;
    let totalCost = 0;
    let totalGains = 0;
    let totalLosses = 0;
    let totalTds = 0;

    for (const t of trades) {
      totalSales += t.saleConsiderationInr;
      totalCost += t.costOfAcquisitionInr;
      totalTds += t.tdsDeductedSec194S;

      if (t.grossGainOrLossInr > 0) {
        totalGains += t.grossGainOrLossInr;
      } else {
        totalLosses += Math.abs(t.grossGainOrLossInr);
      }
    }

    // Under Section 115BBH(2)(b), intra-asset loss set-off is prohibited by CBDT circulars!
    const netTaxableIncome = totalGains;
    const taxLiability = Math.round(netTaxableIncome * 0.30);
    const netPayable = taxLiability - totalTds;

    return {
      assessmentYear: 'AY 2025-26',
      totalVdaSalesConsideration: totalSales,
      totalCostOfAcquisition: totalCost,
      totalGrossGains: totalGains,
      totalGrossLosses: totalLosses,
      netTaxableVdaIncome: netTaxableIncome,
      totalTaxLiability30Percent: taxLiability,
      totalTdsCreditSec194S: totalTds,
      netTaxPayableOrRefund: netPayable,
      statutoryRuleWarning: `Per Section 115BBH(2)(b), loss of ₹${totalLosses.toLocaleString('en-IN')} is completely ring-fenced and disallowed from set-off against gains of ₹${totalGains.toLocaleString('en-IN')}. Tax @ 30% is payable on gross gains.`,
      transactions: trades
    };
  }
}

export const SAMPLE_VDA_TRADES: VdaTransactionRecord[] = [
  Section115BbhVdaEngine.evaluateVdaTrade({
    id: 'VDA-01',
    cryptoSymbol: 'BTC',
    cryptoName: 'Bitcoin',
    exchangeName: 'CoinDCX India',
    dateOfAcquisition: '2024-04-10',
    dateOfTransfer: '2026-07-15',
    costOfAcquisitionInr: 3200000,
    saleConsiderationInr: 5800000,
    tdsDeductedSec194S: 58000,
    tdsChallanMatched26As: true
  }),
  Section115BbhVdaEngine.evaluateVdaTrade({
    id: 'VDA-02',
    cryptoSymbol: 'ETH',
    cryptoName: 'Ethereum',
    exchangeName: 'WazirX India',
    dateOfAcquisition: '2025-01-18',
    dateOfTransfer: '2026-08-20',
    costOfAcquisitionInr: 950000,
    saleConsiderationInr: 650000, // ₹3,00,000 LOSS
    tdsDeductedSec194S: 6500,
    tdsChallanMatched26As: true
  })
];

export const SAMPLE_VDA_SUMMARY = Section115BbhVdaEngine.computeAnnualVdaSummary(SAMPLE_VDA_TRADES);
