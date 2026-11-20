/**
 * Bidirectional Tally Prime XML / ODBC Sync Bridge Engine
 * 
 * Technical Standard:
 * - TallyPrime XML Envelope (Tally Integration Format / TDL Request)
 * - Supports automatic generation of Audit MOCs (Management Overhaul Corrections / Audit Journals)
 * - Directly generates standard Tally `<VOUCHER>` XML payloads for import into TallyPrime
 * - Ingests and parses Tally Trial Balance XML dumps for instant import into Audit Workpapers
 */

export interface TallyMocEntry {
  id: string;
  voucherNumber: string;
  voucherDate: string; // YYYYMMDD e.g. "20260331"
  narration: string;
  companyName: string;
  debitLedger: string;
  creditLedger: string;
  amount: number;
  statutoryReason: string; // e.g. "Section 43B(h) MSME Disallowance"
  status: 'PENDING_EXPORT' | 'POSTED_TO_TALLY';
}

export interface TallyTrialBalanceItem {
  ledgerName: string;
  parentGroup: string; // "Current Assets", "Direct Expenses", "Sales Accounts"
  openingBalance: number;
  debitAmount: number;
  creditAmount: number;
  closingBalance: number;
  balanceType: 'DR' | 'CR';
}

export class TallySyncBridgeEngine {
  /**
   * Generates standard Tally XML Envelope for Audit MOC Journal Vouchers
   */
  public static generateTallyXmlForMocs(companyName: string, mocs: TallyMocEntry[]): string {
    const vouchersXml = mocs.map(moc => `
          <TALLYMESSAGE xmlns:UDF="TallyUDF">
            <VOUCHER VCHTYPE="Journal" ACTION="Create" OBJVIEW="Accounting Voucher View">
              <DATE>${moc.voucherDate}</DATE>
              <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
              <VOUCHERNUMBER>${moc.voucherNumber}</VOUCHERNUMBER>
              <NARRATION>${moc.narration} [Statutory Reference: ${moc.statutoryReason}]</NARRATION>
              <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>${moc.debitLedger}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>-${moc.amount.toFixed(2)}</AMOUNT>
              </ALLLEDGERENTRIES.LIST>
              <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>${moc.creditLedger}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>${moc.amount.toFixed(2)}</AMOUNT>
              </ALLLEDGERENTRIES.LIST>
            </VOUCHER>
          </TALLYMESSAGE>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${vouchersXml}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();
  }

  /**
   * Verifies mathematical equilibrium of imported Tally Trial Balance
   */
  public static verifyTrialBalanceEquality(items: TallyTrialBalanceItem[]): {
    totalDebit: number;
    totalCredit: number;
    difference: number;
    isBalanced: boolean;
  } {
    let totDebit = 0;
    let totCredit = 0;

    items.forEach(it => {
      totDebit += it.debitAmount;
      totCredit += it.creditAmount;
    });

    const diff = Math.abs(totDebit - totCredit);
    return {
      totalDebit: Math.round(totDebit * 100) / 100,
      totalCredit: Math.round(totCredit * 100) / 100,
      difference: Math.round(diff * 100) / 100,
      isBalanced: diff <= 1.0 // Within ₹1 rounding
    };
  }
}

export const SAMPLE_MOCS: TallyMocEntry[] = [
  {
    id: 'MOC-01',
    voucherNumber: 'AUDIT-MOC-2026-01',
    voucherDate: '20260331',
    narration: 'Being statutory disallowance u/s 43B(h) for unpaid MSME supplier invoices beyond 45 days',
    companyName: 'Pratwi Solutions Private Limited',
    debitLedger: 'Audit MOC Disallowance u/s 43B(h)',
    creditLedger: 'Sundry Creditors - Micro & Small',
    amount: 145000,
    statutoryReason: 'Income Tax Sec 43B(h) MSME Mandate',
    status: 'PENDING_EXPORT'
  },
  {
    id: 'MOC-02',
    voucherNumber: 'AUDIT-MOC-2026-02',
    voucherDate: '20260331',
    narration: 'Being adjustment for difference between depreciation as per Companies Act Schedule II vs Income Tax Rules',
    companyName: 'Pratwi Solutions Private Limited',
    debitLedger: 'Deferred Tax Asset / Liability Adjustment',
    creditLedger: 'Depreciation Reserve - Plant & Machinery',
    amount: 88500,
    statutoryReason: 'ICDS V / AS 22 Accounting for Taxes on Income',
    status: 'PENDING_EXPORT'
  },
  {
    id: 'MOC-03',
    voucherNumber: 'AUDIT-MOC-2026-03',
    voucherDate: '20260331',
    narration: 'Being reversal of inadmissible ITC on corporate club membership expenses u/s 17(5)(h)',
    companyName: 'Pratwi Solutions Private Limited',
    debitLedger: 'Staff Welfare & Entertainment Expense',
    creditLedger: 'Input Tax Credit - CGST & SGST',
    amount: 36000,
    statutoryReason: 'CGST Act Section 17(5) Blocked Credit',
    status: 'PENDING_EXPORT'
  }
];

export const SAMPLE_TALLY_TB: TallyTrialBalanceItem[] = [
  {
    ledgerName: 'Equity Share Capital',
    parentGroup: 'Capital Account',
    openingBalance: 10000000,
    debitAmount: 0,
    creditAmount: 0,
    closingBalance: 10000000,
    balanceType: 'CR'
  },
  {
    ledgerName: 'HDFC Cash Credit Account',
    parentGroup: 'Secured Loans (Bank OD/CC)',
    openingBalance: 2450000,
    debitAmount: 14200000,
    creditAmount: 15300000,
    closingBalance: 3550000,
    balanceType: 'CR'
  },
  {
    ledgerName: 'Sundry Debtors Control Account',
    parentGroup: 'Current Assets',
    openingBalance: 4800000,
    debitAmount: 48500000,
    creditAmount: 45200000,
    closingBalance: 8100000,
    balanceType: 'DR'
  },
  {
    ledgerName: 'Raw Material Inventory',
    parentGroup: 'Stock-in-Hand',
    openingBalance: 3200000,
    debitAmount: 2200000,
    creditAmount: 0,
    closingBalance: 5400000,
    balanceType: 'DR'
  },
  {
    ledgerName: 'Sales Turnover - Domestic',
    parentGroup: 'Sales Accounts',
    openingBalance: 0,
    debitAmount: 0,
    creditAmount: 48500000,
    closingBalance: 48500000,
    balanceType: 'CR'
  },
  {
    ledgerName: 'Raw Material Purchases',
    parentGroup: 'Purchase Accounts',
    openingBalance: 0,
    debitAmount: 34500000,
    creditAmount: 0,
    closingBalance: 34500000,
    balanceType: 'DR'
  },
  {
    ledgerName: 'Factory Power & Fuel',
    parentGroup: 'Direct Expenses',
    openingBalance: 0,
    debitAmount: 1450000,
    creditAmount: 0,
    closingBalance: 1450000,
    balanceType: 'DR'
  },
  {
    ledgerName: 'Staff Salaries & Wages',
    parentGroup: 'Indirect Expenses',
    openingBalance: 0,
    debitAmount: 4500000,
    creditAmount: 0,
    closingBalance: 4500000,
    balanceType: 'DR'
  },
  {
    ledgerName: 'Rent, Rates & Taxes',
    parentGroup: 'Indirect Expenses',
    openingBalance: 0,
    debitAmount: 850000,
    creditAmount: 0,
    closingBalance: 850000,
    balanceType: 'DR'
  },
  {
    ledgerName: 'Audit Fees Provision',
    parentGroup: 'Current Liabilities',
    openingBalance: 0,
    debitAmount: 0,
    creditAmount: 250000,
    closingBalance: 250000,
    balanceType: 'CR'
  }
];
