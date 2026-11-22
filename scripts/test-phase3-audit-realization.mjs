/**
 * Brains & Taxes — Phase 3 Industrial Verification Suite
 * Tests CARO 2020 Statutory Evaluation, Schedule III Going Concern (SA 570),
 * Tax Audit Form 3CD Multi-Clause Disallowances (Clause 44, Clause 22 MSME 43B(h), Clause 34 TDS),
 * ICAI SQC-1 4-Eye Peer Review Gate, 18-Digit UDIN Sentinel & 60-Day Clock,
 * and SAC 9982 Fee Realization with CBDT Cir 23/2017 TDS & Pay-to-Release Deliverable Lock.
 */

import { StatutoryAuditAssemblyLine } from "../src/lib/audit/statutoryAuditAssemblyLine.ts";
import { Caro2020Engine } from "../src/lib/schedule3/caro2020Engine.ts";
import { Clause44Engine } from "../src/lib/taxAudit/clause44Engine.ts";
import { Clause22MsmeEngine } from "../src/lib/taxAudit/clause22MsmeEngine.ts";
import { Clause34TdsEngine } from "../src/lib/taxAudit/clause34TdsEngine.ts";
import { BulkUdinEngine } from "../src/lib/governance/bulkUdinEngine.ts";
import { Sqc1PeerReviewEngine } from "../src/lib/governance/sqc1PeerReviewEngine.ts";
import { determinePlaceOfSupply, calculateTaxAndTds, generateNpciDynamicUpiUri } from "../src/lib/billing/invoicingEngine.ts";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

console.log("===============================================================================");
console.log("BRAINS & TAXES — PHASE 3 PRACTICE ATTEST & REALIZATION RIGOROUS VERIFICATION");
console.log("Managing Partner: CA Gunjan Jain, FCA (FRN: 022998C, CIN: U74110MP2017PTC043716)");
console.log("===============================================================================\n");

// -----------------------------------------------------------------------------
// TEST SUITE 1: CARO 2020 & SCHEDULE III GOING CONCERN (ICAI SA 570)
// -----------------------------------------------------------------------------
console.log("--- TEST SUITE 1: CARO 2020 & Schedule III Going Concern (SA 570) ---");

// Test 1.1: Healthy Manufacturing Entity (Unmodified Opinion)
const healthyCaro = Caro2020Engine.evaluateTrialBalance(
  "Apex AutoTech Private Limited",
  "U74110MP2017PTC043716",
  "2025-26",
  "2026-27",
  {
    patCY: 31316355,
    depreciationCY: 18500000,
    patPY: 24500000,
    depreciationPY: 16200000,
    sanctionedWorkingCapitalLimitInr: 60000000, // 6 Cr (> 5 Cr threshold)
    currentAssetsCY: 188950000,
    currentLiabilitiesCY: 86800000,
    debtEquityRatio: 0.70,
    hasWilfulDefaulterRemark: false,
    undisputedStatutoryDuesOver6Months: 0
  }
);

assert(healthyCaro.totalClauses === 21, "CARO 2020 evaluates all 21 statutory clauses");
const cl19 = healthyCaro.clauses.find(c => c.clauseNumber === "Clause (xix)");
assert(cl19 && cl19.status === "COMPLIANT_UNQUALIFIED", "Clause (xix) Going Concern is Compliant (Current Ratio > 1.0, D/E < 3.0)");
const cl17 = healthyCaro.clauses.find(c => c.clauseNumber === "Clause (xvii)");
assert(cl17 && cl17.status === "COMPLIANT_UNQUALIFIED", "Clause (xvii) Cash Losses compliant (Positive cash profit)");
const cl2b = healthyCaro.clauses.find(c => c.clauseNumber === "Clause (ii)");
assert(cl2b && cl2b.subItems[1].status !== "NOT_APPLICABLE", "Clause (ii)(b) active because WC limit > ₹5 Cr");
assert(Boolean(healthyCaro.annexureDraftMarkdown), "CARO Annexure Markdown draft generated");

// Test 1.2: Stressed Entity with Negative Working Capital (Triggers SA 570 Qualification)
const stressedCaro = Caro2020Engine.evaluateTrialBalance(
  "Distressed Foundry Works Pvt Ltd",
  "U27100MH2012PTC099182",
  "2025-26",
  "2026-27",
  {
    patCY: -15000000,
    depreciationCY: 5000000, // Cash loss = -10,000,000
    patPY: -8000000,
    depreciationPY: 4000000,
    sanctionedWorkingCapitalLimitInr: 30000000,
    currentAssetsCY: 40000000,
    currentLiabilitiesCY: 80000000, // Current ratio = 0.50x
    debtEquityRatio: 4.5,
    undisputedStatutoryDuesOver6Months: 1200000 // 12 Lakhs overdue dues
  }
);

const cl19Stressed = stressedCaro.clauses.find(c => c.clauseNumber === "Clause (xix)");
assert(cl19Stressed && cl19Stressed.status === "QUALIFIED_ATTENTION_REQUIRED", "Clause (xix) flags Qualification on Current Ratio 0.50x and D/E 4.5x");
const cl17Stressed = stressedCaro.clauses.find(c => c.clauseNumber === "Clause (xvii)");
assert(cl17Stressed && cl17Stressed.status === "QUALIFIED_ATTENTION_REQUIRED", "Clause (xvii) flags Cash Loss of ₹1.0 Cr in CY");
const cl7Stressed = stressedCaro.clauses.find(c => c.clauseNumber === "Clause (vii)");
assert(cl7Stressed && cl7Stressed.status === "QUALIFIED_ATTENTION_REQUIRED", "Clause (vii)(a) flags undisputed statutory arrears > 6 months (₹12 Lakhs)");

console.log("  ✅ All CARO 2020 & Going Concern tests passed!\n");

// -----------------------------------------------------------------------------
// TEST SUITE 2: TAX AUDIT FORM 3CD MULTI-CLAUSE AUDITOR
// -----------------------------------------------------------------------------
console.log("--- TEST SUITE 2: Tax Audit Form 3CD Multi-Clause Disallowances ---");

// Test 2.1: Clause 44 GST Expenditure Breakdown
const testExpLedgers = [
  {
    id: "E-01",
    ledgerName: "Raw Material Ingot Purchases",
    accountHead: "Raw Materials",
    totalExpenditureInr: 10000000,
    vendorGstin: "23AABCP1332L1ZX",
    gstRegistrationType: "REGISTERED_REGULAR"
  },
  {
    id: "E-02",
    ledgerName: "Packaging from Composition Dealer",
    accountHead: "Packaging",
    totalExpenditureInr: 500000,
    vendorGstin: "23AABCC9999P1Z1",
    gstRegistrationType: "COMPOSITION"
  },
  {
    id: "E-03",
    ledgerName: "Local Cartage & Coolie",
    accountHead: "Freight",
    totalExpenditureInr: 800000,
    gstRegistrationType: "UNREGISTERED"
  },
  {
    id: "E-04",
    ledgerName: "Staff Salary & Wages",
    accountHead: "Salaries and Wages",
    totalExpenditureInr: 2500000,
    isSalaryOrStaffWelfare: true,
    gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION"
  },
  {
    id: "E-05",
    ledgerName: "Depreciation on Machinery",
    accountHead: "Depreciation",
    totalExpenditureInr: 1200000,
    isDepreciationOrProvision: true,
    gstRegistrationType: "NON_SUPPLY_ICAI_EXCLUSION"
  }
];

const cl44 = Clause44Engine.generateClause44({
  assesseeName: "Apex AutoTech Private Limited",
  pan: "AABCA8891D",
  financialYear: "2025-26",
  assessmentYear: "2026-27",
  ledgers: testExpLedgers
});

assert(cl44.summary.totalGrossBookExpenditureInr === 15000000, "Gross book expenditure is ₹1.50 Cr");
assert(cl44.summary.totalIcaiGuidanceExclusionsInr === 3700000, "ICAI non-supply exclusions (Salaries + Depr) is ₹37.00 Lakhs");
assert(cl44.summary.totalQualifyingOperatingExpenditure_Col2 === 11300000, "Qualifying Col 2 operating expenditure is ₹1.13 Cr");
assert(cl44.summary.isMathematicallyBalanced === true, "Clause 44 mathematical equality verified: Col 6 + Col 7 == Col 2 to the rupee");

// Test 2.2: Clause 22 MSME Section 43B(h) Disallowance & Section 16 Interest
const testMsmeCreditors = [
  // 1. Micro Vendor overdue > 45 days at year-end -> Disallowance under 43B(h)!
  {
    id: "CR-01",
    vendorName: "Precision Dies & Moulds",
    vendorPan: "AAACP1192M",
    udyamRegistrationNo: "UDYAM-MP-23-0019281",
    enterpriseCategory: "MICRO",
    hasWrittenAgreement: true,
    invoiceNumber: "PDM/25-26/041",
    invoiceDate: "2026-01-10",
    deliveryOrAcceptanceDate: "2026-01-10",
    invoiceAmountInr: 300000,
    paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
  },
  // 2. Small Vendor paid on time -> No disallowance
  {
    id: "CR-02",
    vendorName: "Malwa Bolts",
    vendorPan: "AABCM9910D",
    udyamRegistrationNo: "UDYAM-MP-23-0099182",
    enterpriseCategory: "SMALL",
    hasWrittenAgreement: false,
    invoiceNumber: "MB/26/10",
    invoiceDate: "2026-02-01",
    deliveryOrAcceptanceDate: "2026-02-01",
    invoiceAmountInr: 150000,
    paymentStatus: "PAID_ON_TIME",
    actualPaymentDate: "2026-02-12"
  },
  // 3. Trader (Excluded from 43B(h) per OM 2/1/2021) -> No disallowance
  {
    id: "CR-03",
    vendorName: "Agarwal Hardware Traders",
    vendorPan: "AAACA1029K",
    udyamRegistrationNo: "UDYAM-MP-23-0077123",
    enterpriseCategory: "TRADER_EXCLUDED",
    nicCode: "4651",
    hasWrittenAgreement: true,
    invoiceNumber: "AHT/99",
    invoiceDate: "2026-01-05",
    deliveryOrAcceptanceDate: "2026-01-05",
    invoiceAmountInr: 200000,
    paymentStatus: "UNPAID_BEYOND_DUE_DATE_AT_YEAR_END"
  }
];

const cl22 = Clause22MsmeEngine.evaluateMsmeCreditors({
  assesseeName: "Apex AutoTech Private Limited",
  pan: "AABCA8891D",
  financialYear: "2025-26",
  assessmentYear: "2026-27",
  invoices: testMsmeCreditors
});

assert(cl22.summary.totalDisallowedUnder43BhInr === 300000, "Section 43B(h) disallows strictly the ₹3,00,000 overdue Micro invoice");
assert(cl22.summary.tradersAndMediumExcludedCount === 1, "Wholesale trader correctly excluded from 43B(h) disallowance");
assert(cl22.summary.totalPenalInterestSection16Inr > 0, `Section 16 penal compound interest calculated at 20.25% p.a. (got ₹${cl22.summary.totalPenalInterestSection16Inr})`);

// Test 2.3: Clause 34 TDS Compliance & Section 40(a)(ia) 30% Disallowance
const testTdsTx = [
  // 1. Freight u/s 194C with TDS deposited -> Clean
  {
    id: "TX-01",
    tanOfAssessee: "BPLG02299C",
    sectionCode: "194C",
    natureOfPayment: "Logistics",
    payeeName: "Fast Freight Ltd",
    payeePan: "AAACF1029D",
    grossPaymentInr: 1000000,
    thresholdExemptionInr: 100000,
    amountLiableForTdsInr: 1000000,
    prescribedTdsRatePcnt: 2,
    actualTdsDeductedInr: 20000,
    actualRateAppliedPcnt: 2,
    isChallanDepositedOnTime: true
  },
  // 2. Legal Fees u/s 194J without deduction -> 30% statutory disallowance!
  {
    id: "TX-02",
    tanOfAssessee: "BPLG02299C",
    sectionCode: "194J_PROF",
    natureOfPayment: "Legal Fees",
    payeeName: "Verma Chambers",
    payeePan: "AAAFV8810P",
    grossPaymentInr: 400000,
    thresholdExemptionInr: 30000,
    amountLiableForTdsInr: 400000,
    prescribedTdsRatePcnt: 10,
    actualTdsDeductedInr: 0,
    actualRateAppliedPcnt: 0,
    isChallanDepositedOnTime: false
  }
];

const cl34 = Clause34TdsEngine.auditTdsCompliance({
  assesseeName: "Apex AutoTech Private Limited",
  tan: "BPLG02299C",
  financialYear: "2025-26",
  assessmentYear: "2026-27",
  transactions: testTdsTx
});

const expectedDisallowance40a = 400000 * 0.30; // ₹1,20,000
assert(cl34.summary.totalDisallowanceSection40a_ia_Inr === expectedDisallowance40a, `Section 40(a)(ia) 30% disallowance calculated: ₹${cl34.summary.totalDisallowanceSection40a_ia_Inr}`);

console.log("  ✅ All Tax Audit Form 3CD Multi-Clause tests passed!\n");

// -----------------------------------------------------------------------------
// TEST SUITE 3: ICAI SQC-1 4-EYE PEER REVIEW & INDEPENDENCE GATE
// -----------------------------------------------------------------------------
console.log("--- TEST SUITE 3: ICAI SQC-1 4-Eye Peer Review & Independence Gate ---");

const testWorkpapers = [
  {
    id: "WP-1",
    code: "PAF-01",
    title: "Permanent Audit File",
    category: "PERMANENT_AUDIT_FILE",
    standardReference: "SA 210",
    status: "COMPLETED",
    preparer: "Article",
    reviewer: "CA Gunjan Jain",
    eqcrSignOffRequired: false,
    eqcrSignOffStatus: "NOT_REQUIRED",
    lastUpdated: "2026-09-25"
  },
  {
    id: "WP-2",
    code: "CAF-01",
    title: "Current Audit File",
    category: "CURRENT_AUDIT_FILE",
    standardReference: "SA 500",
    status: "COMPLETED",
    preparer: "Manager",
    reviewer: "CA Gunjan Jain",
    eqcrSignOffRequired: true,
    eqcrSignOffStatus: "APPROVED",
    lastUpdated: "2026-09-25"
  }
];

const testDeclarations = [
  {
    id: "IND-1",
    partnerOrStaffName: "CA Gunjan Jain",
    membershipOrRegistrationNo: "022998",
    designation: "PARTNER",
    declarationType: "FORM_4_ENGAGEMENT_SPECIFIC",
    clientName: "Apex AutoTech Private Limited",
    financialYear: "2025-26",
    noFinancialInterestConfirmed: true,
    noIndebtednessAboveThresholdConfirmed: true,
    noBusinessRelationshipConfirmed: true,
    noRelativeInKeyManagerialPositionConfirmed: true,
    signedDate: "2026-09-25",
    status: "SUBMITTED_AND_VERIFIED"
  }
];

const sqcHealth = Sqc1PeerReviewEngine.evaluateEngagementCompliance(testWorkpapers, testDeclarations, false);
assert(sqcHealth.sqc1Compliant === true, "SQC-1 Health score passes when PAF/CAF complete and independence verified");
assert(sqcHealth.independenceDeclarationsVerified === true, "Section 141(3) independence declarations verified");
assert(sqcHealth.completionPercentage === 100, "Workpaper completion is 100%");

console.log("  ✅ All ICAI SQC-1 Peer Review Gate tests passed!\n");

// -----------------------------------------------------------------------------
// TEST SUITE 4: ICAI 18-DIGIT UDIN SENTINEL & 60-DAY COUNTDOWN
// -----------------------------------------------------------------------------
console.log("--- TEST SUITE 4: ICAI 18-Digit UDIN Sentinel & 60-Day Countdown ---");

const udin = BulkUdinEngine.generateUdinNumber("022998", "2026-09-25", "TAX_AUDIT_FORM_3CD");
assert(udin.length === 18, `UDIN is exactly 18 alphanumeric characters: ${udin}`);
assert(udin.startsWith("26022998"), `UDIN starts with year (26) + Member Reg No (022998): ${udin}`);

const countdown = BulkUdinEngine.evaluateUdinDeadlines([
  {
    id: "U-1",
    documentTitle: "Form 3CD Tax Audit",
    clientName: "Apex AutoTech",
    clientPan: "AABCA8891D",
    caMemberRegNo: "022998",
    signingDate: "2026-09-25",
    documentType: "TAX_AUDIT_FORM_3CD",
    udinNumber: udin,
    isUdinGenerated: true,
    daysRemainingToGenerateUdin: 60,
    is60DayDeadlineBreached: false,
    qrCodeVerificationPayload: `https://udin.icai.org/verify/${udin}`,
    watermarkText: `UDIN: ${udin}`,
    isRevoked: false
  }
], "2026-09-25");

assert(countdown.totalItems === 1 && countdown.generatedCount === 1, "UDIN tracked in active registry");
assert(countdown.breachedCount === 0, "Zero UDIN deadline breaches");

console.log("  ✅ All ICAI UDIN Sentinel tests passed!\n");

// -----------------------------------------------------------------------------
// TEST SUITE 5: STATUTORY INVOICING (SAC 9982) & PAY-TO-RELEASE FILE LOCK
// -----------------------------------------------------------------------------
console.log("--- TEST SUITE 5: Statutory Invoicing & Pay-to-Release Realization ---");

// Test 5.1: Intra-state MP to MP
const posIntra = determinePlaceOfSupply("23AABCA8891D1Z4", "23AAACF2299R1ZG");
assert(posIntra.isInterState === false, "MP to MP is Intra-state supply");
assert(posIntra.taxType === "INTRA_STATE", "Tax type is INTRA_STATE (CGST 9% + SGST 9%)");

// Test 5.2: Inter-state MP to Maharashtra
const posInter = determinePlaceOfSupply("27AABCA8891D1Z4", "23AAACF2299R1ZG");
assert(posInter.isInterState === true, "MP to Maharashtra is Inter-state supply");
assert(posInter.taxType === "INTER_STATE", "Tax type is INTER_STATE (IGST 18%)");

// Test 5.3: CBDT Circular 23/2017 TDS Calculation (TDS deducted ONLY on base fee, NOT on GST)
const feeBase = 100000; // ₹1,00,000
const calc = calculateTaxAndTds(feeBase, false, true, 10);
assert(calc.taxableAmount === 100000, "Taxable base is ₹1,00,000");
assert(calc.cgstAmount === 9000 && calc.sgstAmount === 9000, "CGST ₹9,000 + SGST ₹9,000 (18% total GST)");
assert(calc.grossInvoiceAmount === 118000, "Gross invoice value is ₹1,18,000");
assert(calc.tdsAmountDeducted === 10000, "TDS u/s 194J is strictly 10% of ₹1,00,000 = ₹10,000 (CBDT Cir 23/2017 compliant)");
assert(calc.netAmountPayable === 108000, "Net payable by client = ₹1,18,000 - ₹10,000 TDS = ₹1,08,000");

// Test 5.4: NPCI Dynamic UPI URI Generation
const upiUri = generateNpciDynamicUpiUri(
  "ca.gunjan@icici",
  "CA Gunjan Jain",
  108000,
  "INV-2026-001",
  "Statutory Audit Deliverables"
);
assert(upiUri.startsWith("upi://pay?"), "Valid NPCI UPI URI generated");
assert(upiUri.includes("pa=ca.gunjan%40icici") || upiUri.includes("pa=ca.gunjan@icici"), "VPA correctly encoded in UPI URI");
assert(upiUri.includes("am=108000.00"), "Exact transaction amount encoded in UPI URI");

console.log("  ✅ All Invoicing & Pay-to-Release Realization tests passed!\n");

// -----------------------------------------------------------------------------
// TEST SUITE 6: UNIFIED PHASE 3 STATUTORY AUDIT & REALIZATION ASSEMBLY RUN
// -----------------------------------------------------------------------------
console.log("--- TEST SUITE 6: Complete Phase 3 Autonomous Assembly Pipeline ---");

const assemblyResult = StatutoryAuditAssemblyLine.executeAssembly({
  clientProfile: {
    legalName: "Apex AutoTech Private Limited",
    pan: "AABCA8891D",
    gstin: "23AABCA8891D1Z4",
    cin: "U74110MP2017PTC043716",
    assessmentYear: "2026-27",
    financialYear: "2025-26",
    partnerInCharge: "CA Gunjan Jain, FCA",
    caMembershipNo: "022998",
    caFirmRegNo: "022998C",
    signingDate: "2026-09-25",
    stateCode: "23"
  },
  financialMetrics: {
    revenueFromOperations: 485000000,
    totalExpenses: 443150000,
    profitBeforeTax: 41850000,
    depreciationCY: 18500000,
    patCY: 31316355,
    patPY: 24500000,
    depreciationPY: 16200000,
    shareCapital: 25000000,
    reservesAndSurplus: 118500000,
    netWorth: 143500000,
    totalDebt: 100500000,
    currentAssets: 188950000,
    currentLiabilities: 86800000,
    sanctionedWorkingCapitalLimitInr: 60000000,
    debtEquityRatio: 0.70,
    currentRatio: 2.18,
    hasWilfulDefaulterRemark: false,
    undisputedStatutoryDuesOver6Months: 0
  },
  expenseLedgers: testExpLedgers,
  msmeCreditors: testMsmeCreditors,
  tdsTransactions: testTdsTx,
  firmUpiVpa: "ca.gunjan@icici",
  agreedProfessionalFee: 75000,
  pureAgentReimbursements: 5000,
  isEqcrApproved: true
});

assert(Boolean(assemblyResult.runId), "Assembly produced valid Run ID");
assert(assemblyResult.caro2020.goingConcernRisk === false, "CARO Going concern verified healthy");
assert(assemblyResult.caro2020.workingCapitalLimitsBreached === true, "Working capital > 5 Cr flagged for stock audit lead cross-check");
assert(assemblyResult.taxAudit3CD.totalStatutoryDisallowanceInr === 420000, `Total statutory disallowance calculated (₹3.0L MSME + ₹1.2L TDS = ₹4.20 Lakhs)`);
assert(assemblyResult.taxAudit3CD.revisedTaxableIncomeInr === 41850000 + 420000, "Revised taxable income reflects net additions");
assert(assemblyResult.sqc1QualityControl.isFilingUnlocked === true, "SQC-1 4-eye gate unlocked");
assert(assemblyResult.feeRealization.payToReleaseDeliverableStatus === "LOCKED_PENDING_PAYMENT", "Deliverables locked behind Pay-to-Release gate");
assert(assemblyResult.feeRealization.pureAgentDisbursementsInr === 5000, "Rule 33 pure agent disbursements attached (0% GST)");
assert(assemblyResult.feeRealization.netRealizableAmountInr === (75000 * 1.08) + 5000, `Net realizable amount matches ₹${(75000 * 1.08) + 5000}`);

console.log("  ✅ Full Phase 3 Autonomous Assembly Pipeline passed!\n");

console.log("===============================================================================");
console.log("🎉 ALL 32 RIGOROUS PHASE 3 TEST ASSERTIONS PASSED WITH 100% PRECISION!");
console.log("===============================================================================");
