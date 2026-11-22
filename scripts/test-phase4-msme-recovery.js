/**
 * Verification Test Suite for Phase 4: Statutory MSME Section 43B(h) & Section 16 Recovery Radar
 * Tests compounded monthly interest at 3x RBI rate, Section 43B(h) disallowance risk, 4-stage progressive escalation,
 * formal MSME legal demand notices, multi-bank statement reconciliation, and live API endpoints.
 */

const http = require("http");

async function runTestSuite() {
  console.log("\n=======================================================================");
  console.log("   PHASE 4: STATUTORY MSME 43B(h) & BANK RECONCILIATION TEST SUITE    ");
  console.log("=======================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- UNIT TESTS 1: MSME Section 16 Compounded Interest ---
  console.log("\n▶ [Test Group 1]: MSME Section 16 Compounded Interest (3x RBI Rate)");
  const {
    computeMsmeStatutoryInterest,
    calculateSection43BhDisallowanceRisk,
    formatMsmeWhatsAppEscalationMessage,
    generateMsmeLegalDemandNoticeText,
    SAMPLE_MSME_OVERDUE_INVOICES
  } = require("../src/lib/billing/msmeRecoveryEngine");

  // 1.1 Invoice within 45 days (30 days overdue) -> 0 interest
  const interestWithin45 = computeMsmeStatutoryInterest(100000, 30);
  assert(interestWithin45.accruedInterestInr === 0, `Within 45 days: 0 accrued interest (got: ₹${interestWithin45.accruedInterestInr})`);
  assert(interestWithin45.statutoryRatePct === 19.5, `Statutory rate is 3x RBI rate (6.5% * 3 = 19.5% p.a.)`);

  // 1.2 Invoice 82 days overdue (37 days past 45) -> Compounded interest calculated
  const interestPast45 = computeMsmeStatutoryInterest(118000, 82);
  assert(interestPast45.accruedInterestInr > 0, `Past 45 days: Compounded interest accrued (₹${interestPast45.accruedInterestInr})`);
  assert(interestPast45.monthsCompounded > 1, `Calculates fractional months compounded (> 1 month, got: ${interestPast45.monthsCompounded})`);

  // --- UNIT TESTS 2: Section 43B(h) Tax Disallowance Risk ---
  console.log("\n▶ [Test Group 2]: Income Tax Section 43B(h) Disallowance Risk");

  // 2.1 Invoice within 45 days -> Protected
  const disallowanceSafe = calculateSection43BhDisallowanceRisk(50000, 35);
  assert(disallowanceSafe.isDisallowanceTriggered === false, `Within 45 days: Disallowance is not triggered`);
  assert(disallowanceSafe.taxLossInr === 0, `Tax loss is ₹0 when within 45 days`);
  assert(disallowanceSafe.clause22Mandatory === false, `Form 3CD Clause 22 reporting not mandatory yet`);

  // 2.2 Invoice past 45 days -> Disallowed u/s 43B(h)
  const disallowanceTriggered = calculateSection43BhDisallowanceRisk(118000, 82);
  assert(disallowanceTriggered.isDisallowanceTriggered === true, `Past 45 days: Section 43B(h) disallowance triggered`);
  assert(disallowanceTriggered.taxLossInr === 36816, `Client tax deduction loss calculated @ 31.2% (Expected ₹36,816, got: ₹${disallowanceTriggered.taxLossInr})`);
  assert(disallowanceTriggered.clause22Mandatory === true, `Form 3CD Clause 22 auditor reporting mandatory`);

  // --- UNIT TESTS 3: 4-Stage Progressive Escalation WhatsApp ---
  console.log("\n▶ [Test Group 3]: 4-Stage Progressive Escalation Ladder");

  // Stage 1 (0-15d)
  const msg1 = formatMsmeWhatsAppEscalationMessage({
    evaluation: SAMPLE_MSME_OVERDUE_INVOICES[3],
    upiPaymentLink: "upi://pay?pa=test"
  });
  assert(msg1.includes("Pranam"), `Stage 1 includes courteous Indian Pranam`);
  assert(msg1.includes("Within agreed 15-day credit period"), `Stage 1 confirms within grace terms`);

  // Stage 2 (16-30d)
  const msg2 = formatMsmeWhatsAppEscalationMessage({
    evaluation: SAMPLE_MSME_OVERDUE_INVOICES[2],
    upiPaymentLink: "upi://pay?pa=test"
  });
  assert(msg2.includes("MSME Section 43B(h) Window Closing"), `Stage 2 alerts MSME window closing`);
  assert(msg2.includes("Days Remaining"), `Stage 2 shows countdown to Day 45`);

  // Stage 3 (31-44d)
  const msg3 = formatMsmeWhatsAppEscalationMessage({
    evaluation: SAMPLE_MSME_OVERDUE_INVOICES[1],
    upiPaymentLink: "upi://pay?pa=test"
  });
  assert(msg3.includes("URGENT: STATUTORY TAX AUDIT ALERT"), `Stage 3 issues urgent tax audit alert`);
  assert(msg3.includes("Section 43B(h) Disallowance"), `Stage 3 warns of tax disallowance loss`);
  assert(msg3.includes("Section 16 Compound Interest"), `Stage 3 warns of 3x RBI interest`);

  // Stage 4 (45d+)
  const msg4 = formatMsmeWhatsAppEscalationMessage({
    evaluation: SAMPLE_MSME_OVERDUE_INVOICES[0],
    upiPaymentLink: "upi://pay?pa=test"
  });
  assert(msg4.includes("FORMAL STATUTORY NOTICE UNDER MSMED ACT"), `Stage 4 issues formal statutory notice`);
  assert(msg4.includes("Section 18"), `Stage 4 cites MSMED Act Section 18 Samadhaan`);
  assert(msg4.includes("Form 3CD Clause 22"), `Stage 4 mentions Clause 22 audit queue`);

  // --- UNIT TESTS 4: Legal Demand Notice on Letterhead ---
  console.log("\n▶ [Test Group 4]: Full Formal Statutory Demand Letter on Letterhead");
  const legalNotice = generateMsmeLegalDemandNoticeText({
    evaluation: SAMPLE_MSME_OVERDUE_INVOICES[0],
    partnerName: "CA Gunjan Jain, FCA, DISA"
  });

  assert(legalNotice.includes("GPA & CO."), `Notice displays firm letterhead header`);
  assert(legalNotice.includes("Udyam Registration No."), `Notice cites official Udyam MSME number`);
  assert(legalNotice.includes("SECTION 15 OF MSMED ACT"), `Cites Section 15 45-day statutory obligation`);
  assert(legalNotice.includes("LIABILITY FOR COMPOUNDED INTEREST UNDER SECTION 16"), `Cites Section 16 compounded interest`);
  assert(legalNotice.includes("SECTION 43B(h) & CLAUSE 22 REPORTING"), `Cites Income Tax 43B(h) disallowance and Clause 22`);
  assert(legalNotice.includes("MSEFC Samadhaan"), `Warns of filing before MSEFC Samadhaan Council`);

  // --- UNIT TESTS 5: Multi-Bank Statement Reconciler Logic ---
  console.log("\n▶ [Test Group 5]: Multi-Bank Statement 3-Way Reconciler Engine");
  const { reconcileFirmBankStatement } = require("../src/lib/billing/bankReceiptReconciler");

  const sampleCsvBankFeed = `Date,Narration,ChqRefNo,Withdrawal,Deposit,Balance
2026-10-24,UPI/229810481920/APEX AUTOTECH/FEE,,0,118000,542100
2026-10-25,NEFT/ICICN99281048/KUBER LOGISTICS/INV104,,0,31500,573600
2026-10-26,CHARGES/SMS ALERT,,15,0,573585`;

  const testInvoices = [
    { id: "INV-01", invoiceNo: "INV-2026-089", entityId: "CLI-APEX-01", entityName: "Apex AutoTech Private Limited", amount: 118000, status: "PENDING" },
    { id: "INV-02", invoiceNo: "INV-2026-104", entityId: "CLI-KUBER-01", entityName: "Kuber Logistics Private Limited", amount: 35000, status: "PENDING" }
  ];

  const testClients = [
    { id: "CLI-APEX-01", name: "Apex AutoTech Private Limited" },
    { id: "CLI-KUBER-01", name: "Kuber Logistics Private Limited" }
  ];

  const bankReport = reconcileFirmBankStatement(sampleCsvBankFeed, testInvoices, testClients);
  assert(bankReport.totalCreditsProcessed === 2, `Filters out debits/charges, processes 2 credit deposits`);
  assert(bankReport.reconciledInvoices.length >= 1, `Matches bank deposits against pending invoices`);
  assert(bankReport.totalGatewayFeesSavedInr > 0, `Computes 0% gateway fee savings vs 2.36% (Saved: ₹${bankReport.totalGatewayFeesSavedInr})`);

  // --- INTEGRATION TESTS 6: Live API Endpoints ---
  console.log("\n▶ [Test Group 6]: Live API Integration (/api/billing/msme-recovery)");

  function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "localhost",
        port: 3000,
        path: path,
        method: method,
        headers: {
          "Content-Type": "application/json"
        }
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      });

      req.on("error", (e) => reject(e));
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  try {
    // 6.1 GET /api/billing/msme-recovery
    const getRes = await makeRequest("GET", "/api/billing/msme-recovery");
    assert(getRes.statusCode === 200, `GET /api/billing/msme-recovery returns 200 OK`);
    assert(getRes.body && getRes.body.success === true, `API reports success: true`);
    assert(Array.isArray(getRes.body.evaluations), `Returns evaluations list`);
    assert(Boolean(getRes.body.summary), `Returns portfolio risk summary`);
    assert(getRes.body.summary.totalOverdueAmountInr > 0, `Summary calculates total overdue amount`);
    assert(getRes.body.summary.totalClientTaxDisallowanceRiskInr > 0, `Summary calculates client tax disallowance exposure`);

    // 6.2 GET with Stage Filter
    const stage4Res = await makeRequest("GET", "/api/billing/msme-recovery?stage=STAGE_4_STATUTORY_DEMAND");
    assert(stage4Res.statusCode === 200, `GET with ?stage=STAGE_4_STATUTORY_DEMAND returns 200 OK`);
    const allStage4 = stage4Res.body.evaluations.every(e => e.stage === "STAGE_4_STATUTORY_DEMAND");
    assert(allStage4, `All filtered items are STAGE_4_STATUTORY_DEMAND`);

    // 6.3 POST GENERATE_LEGAL_DEMAND_NOTICE
    const legalNoticeRes = await makeRequest("POST", "/api/billing/msme-recovery", {
      action: "GENERATE_LEGAL_DEMAND_NOTICE",
      invoiceNo: "INV-2026-089",
      partnerName: "CA Gunjan Jain, FCA, DISA"
    });
    assert(legalNoticeRes.statusCode === 200, `POST GENERATE_LEGAL_DEMAND_NOTICE returns 200 OK`);
    assert(legalNoticeRes.body.success === true, `Notice generation reports success`);
    assert(legalNoticeRes.body.noticeText.includes("SECTION 43B(h)"), `Generated notice cites Section 43B(h)`);

    // 6.4 POST DISPATCH_ESCALATION_WHATSAPP
    const waRes = await makeRequest("POST", "/api/billing/msme-recovery", {
      action: "DISPATCH_ESCALATION_WHATSAPP",
      invoiceNo: "INV-2026-089",
      partnerName: "CA Gunjan Jain"
    });
    assert(waRes.statusCode === 200, `POST DISPATCH_ESCALATION_WHATSAPP returns 200 OK`);
    assert(Boolean(waRes.body.whatsappText), `Generated stage-appropriate WhatsApp text`);
    assert(waRes.body.upiLink.startsWith("upi://pay"), `Embeds dynamic zero-fee UPI link`);

    // 6.5 POST RECORD_PROMISSORY
    const promRes = await makeRequest("POST", "/api/billing/msme-recovery", {
      action: "RECORD_PROMISSORY",
      invoiceNo: "INV-2026-089",
      promissoryDate: "2026-11-28",
      partnerName: "CA Gunjan Jain"
    });
    assert(promRes.statusCode === 200, `POST RECORD_PROMISSORY returns 200 OK`);
    assert(promRes.body.success === true, `Promissory settlement note recorded`);

  } catch (apiErr) {
    console.error("  ❌ Live API request error:", apiErr.message);
    failed++;
  }

  // --- FINAL SUMMARY ---
  console.log("\n=======================================================================");
  console.log(`   TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=======================================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
