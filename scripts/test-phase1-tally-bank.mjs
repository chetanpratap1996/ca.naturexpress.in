/**
 * Brains & Taxes — Phase 1 Industrial Verification Suite
 * Tests Bank Statement Parsing, Narration Disassembly, Canonical Merchants,
 * ICAI SA 500/505 BRS Mathematical Verification, and Native Tally Prime XML Generation.
 */

import { parseBankStatementCsv } from "../src/lib/parsers/bankStatementParser.ts";
import { dissectNarration, STATUTORY_CHART_OF_ACCOUNTS } from "../src/lib/bankOcr/narrationEngine.ts";
import { generateNativeTallyPrimeXml } from "../src/lib/bankOcr/tallyXmlGenerator.ts";
import { verifyBankStatementBrs } from "../src/lib/bankOcr/brsValidator.ts";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

console.log("===============================================================================");
console.log("BRAINS & TAXES — PHASE 1 PRACTICE AUTOMATION RIGOROUS VERIFICATION");
console.log("Managing Partner: CA Gunjan Jain, FCA (FRN: 022998C, CIN: U74110MP2017PTC043716)");
console.log("===============================================================================\n");

// -----------------------------------------------------------------------------
// TEST SUITE 1: CANONICAL MERCHANT ENGINE & STATUTORY CHALLAN DISASSEMBLY
// -----------------------------------------------------------------------------
console.log("--- TEST SUITE 1: Indian Banking Narration Disassembly & Merchant Mapping ---");

const testNarrations = [
  {
    raw: "UPI/412389123012/DR/SWIGGY/HDFC/ORD-881923",
    isWithdrawal: true,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.STAFF_WELFARE,
    expectedMode: "UPI",
    expectedRef: "412389123012"
  },
  {
    raw: "POS 401928374619 AMAZON WEB SERVICES MUMBAI IN",
    isWithdrawal: true,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.CLOUD_SOFTWARE,
    expectedMode: "CARD_POS"
  },
  {
    raw: "NEFT-HDFCN26102938475-UBER INDIA TECHNOLOGY-RIDE-091",
    isWithdrawal: true,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.TRAVEL_CONVEYANCE,
    expectedMode: "NEFT"
  },
  {
    raw: "ACH D- BAJAJ FINANCE LTD-MANDATE-99210238",
    isWithdrawal: true,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.LOAN_EMI_CLEARING,
    expectedMode: "ACH"
  },
  {
    raw: "GST PMT-06 CPIN 26109928172635 23AABCP1332L1ZX",
    isWithdrawal: true,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.GST_CASH_LEDGER,
    expectedMode: "TAX_GOVT",
    expectedRef: "26109928172635"
  },
  {
    raw: "ITNS 280 BSR 0210043 CHLN 99201 ADV TAX AY 2027-28",
    isWithdrawal: true,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.ADVANCE_TAX_PAID,
    expectedMode: "TAX_GOVT"
  },
  {
    raw: "ITNS 281 TDS CHLN SEC 194J BSR 0210043 CHLN 88129",
    isWithdrawal: true,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.TDS_PAYABLE_194J,
    expectedMode: "TAX_GOVT"
  },
  {
    raw: "CONSOL CHRG WITHDRAWAL CARD AMC 2026-27",
    isWithdrawal: true,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.BANK_CHARGES,
    expectedMode: "BANK_CHARGES"
  },
  {
    raw: "INTEREST CR FOR QUARTER ENDED SEP 2026",
    isWithdrawal: false,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.INTEREST_INCOME,
    expectedMode: "INTEREST"
  },
  {
    raw: "TRANSFER FROM 501002391029 UPI/CR/519283746501/RAZORPAY/PAYTM/SETTLE-881",
    isWithdrawal: false,
    expectedLedger: STATUTORY_CHART_OF_ACCOUNTS.POS_COLLECTIONS,
    expectedMode: "UPI"
  }
];

testNarrations.forEach((test, idx) => {
  const result = dissectNarration(test.raw, test.isWithdrawal);
  assert(result.suggestedLedger === test.expectedLedger, `Case #${idx + 1}: ${test.raw.slice(0, 30)}... maps to ${test.expectedLedger}`);
  if (test.expectedMode) {
    assert(result.mode === test.expectedMode, `  Mode detected as ${result.mode}`);
  }
  if (test.expectedRef) {
    assert(result.referenceNo === test.expectedRef, `  Extracted reference ${result.referenceNo}`);
  }
});

// -----------------------------------------------------------------------------
// TEST SUITE 2: MULTI-LINE ROW HEALING & CSV SPATIAL PARSING
// -----------------------------------------------------------------------------
console.log("\n--- TEST SUITE 2: Bank Statement Multi-Line Row Healing ---");

const multiLineBankCsv = `
HDFC BANK LTD - CURRENT ACCOUNT STATEMENT
A/C NO: 50200049182394 | IFSC: HDFC0000043
Date,Narration,Chq/Ref No,Value Date,Withdrawal,Deposit,Closing Balance
01/10/2026,UPI/412389123012/DR/Apex AutoTech,412389123012,01/10/2026,118000.00,,882000.00
,Private Limited/ICIC/GPA-2026-27-089,,,,
05/10/2026,GST PMT-06 E-Payment,CPIN-26109921,05/10/2026,62500.00,,819500.00
,CPIN 26109921448192 Electronic Cash Ledger,,,,
10/10/2026,NEFT INWARD-PRATWI SOLUTIONS,N10293847561,10/10/2026,,240000.00,1059500.00
,CA RETAINER & STATUTORY AUDIT ADVANCE,,,,
15/10/2026,SMS ALERT AND FOLIO CHARGES,CHRG-8812,15/10/2026,118.00,,1059382.00
31/10/2026,INTEREST CR FOR QUARTER,INT-CREDIT,31/10/2026,,12450.00,1071832.00
`;

const parseResult = parseBankStatementCsv(multiLineBankCsv, { fallbackOpeningBalance: 1000000 });

assert(parseResult.success, "Bank Statement parsed successfully");
assert(parseResult.bankName.includes("HDFC Bank"), `Detected Bank as ${parseResult.bankName}`);
assert(parseResult.accountNumber === "50200049182394", `Extracted Account Number: ${parseResult.accountNumber}`);
assert(parseResult.ifsc === "HDFC0000043", `Extracted IFSC: ${parseResult.ifsc}`);
assert(parseResult.transactions.length === 5, `Expected 5 transactions, got ${parseResult.transactions.length}`);

// Verify Row 1 was healed (continuation text attached)
const txn1 = parseResult.transactions[0];
assert(txn1.narration.includes("Apex AutoTech") && txn1.narration.includes("Private Limited"), 
  `Row 1 multi-line healed: "${txn1.narration}"`);

// Verify Row 2 was healed
const txn2 = parseResult.transactions[1];
assert(txn2.narration.includes("CPIN 26109921448192"), 
  `Row 2 multi-line healed: "${txn2.narration}"`);

// -----------------------------------------------------------------------------
// TEST SUITE 3: ICAI SA 500 / SA 505 BRS MATHEMATICAL EQUILIBRIUM
// -----------------------------------------------------------------------------
console.log("\n--- TEST SUITE 3: ICAI SA 500/505 BRS Mathematical Verification ---");

const brs = parseResult.brsReport;
console.log(`  Opening Balance:          ₹${brs.openingBalance.toLocaleString("en-IN")}`);
console.log(`  + Total Deposits:         ₹${brs.totalDeposits.toLocaleString("en-IN")}`);
console.log(`  - Total Withdrawals:      ₹${brs.totalWithdrawals.toLocaleString("en-IN")}`);
console.log(`  = Calculated Closing Bal: ₹${brs.calculatedClosingBalance.toLocaleString("en-IN")}`);
console.log(`  Statement Closing Bal:    ₹${brs.statementClosingBalance.toLocaleString("en-IN")}`);
console.log(`  Discrepancy:              ₹${brs.discrepancy.toFixed(2)}`);

assert(brs.isBalanced, "BRS is 100% Mathematically Balanced");
assert(brs.discrepancy === 0, "Discrepancy strictly equals ₹0.00");
assert(brs.statutorySummary.gstPaid === 62500, `Statutory GST Paid correctly totaled: ₹${brs.statutorySummary.gstPaid}`);

// -----------------------------------------------------------------------------
// TEST SUITE 4: NATIVE TALLY PRIME XML GENERATION & DOUBLE-ENTRY EQUILIBRIUM
// -----------------------------------------------------------------------------
console.log("\n--- TEST SUITE 4: Native Tally Prime XML Double-Entry Verification ---");

const { xml, validation } = generateNativeTallyPrimeXml({
  companyName: "Pratwi Solutions Private Limited",
  bankLedgerName: "HDFC Bank Current A/c - 2394",
  transactions: parseResult.transactions,
  openingBalance: parseResult.openingBalance,
  statementPeriod: "October 2026",
  clientPan: "AABCP1332L",
  splitGstOnBankCharges: true
});

assert(validation.isValid, "Tally XML Validation Passed");
assert(validation.totalVouchers === 5, `Total vouchers generated: ${validation.totalVouchers}`);
assert(validation.discrepancy === 0, "Double-entry imbalance is ₹0.00");
assert(validation.masterLedgersCount >= 5, `Master Ledgers generated: ${validation.masterLedgersCount}`);
assert(xml.includes("<ENVELOPE>"), "XML Envelope present");
assert(xml.includes("<TALLYREQUEST>Import Data</TALLYREQUEST>"), "Tally Request header valid");
assert(xml.includes("<SVCURRENTCOMPANY>Pratwi Solutions Private Limited</SVCURRENTCOMPANY>"), "Target Company configured");

// Verify 18% GST split on bank charges (Rs 118 = Rs 100 base + Rs 9 CGST + Rs 9 SGST)
assert(xml.includes("<LEDGERNAME>Input CGST Ledger</LEDGERNAME>"), "Input CGST Ledger split created");
assert(xml.includes("<LEDGERNAME>Input SGST Ledger</LEDGERNAME>"), "Input SGST Ledger split created");
assert(xml.includes("<AMOUNT>-100.00</AMOUNT>"), "Base bank charge ₹100.00 debit computed");
assert(xml.includes("<AMOUNT>-9.00</AMOUNT>"), "CGST ₹9.00 debit computed");

// Verify that for EVERY voucher, sum of all amounts is 0.00
const voucherBlocks = xml.split("<VOUCHER ").slice(1);
voucherBlocks.forEach((vBlock, idx) => {
  const amountMatches = [...vBlock.matchAll(/<AMOUNT>(-?[0-9\.]+)<\/AMOUNT>/g)];
  let sum = 0;
  amountMatches.forEach(m => {
    sum += parseFloat(m[1]);
  });
  const diff = Math.abs(sum);
  assert(diff < 0.01, `Voucher #${idx + 1}: Algebraic sum of ALLLEDGERENTRIES is 0.00 (got ${sum.toFixed(4)})`);
});

console.log("\n===============================================================================");
console.log("✨ ALL 25 PHASE 1 INTEGRATION TESTS PASSED WITH 100% MATHEMATICAL PRECISION!");
console.log("===============================================================================");
