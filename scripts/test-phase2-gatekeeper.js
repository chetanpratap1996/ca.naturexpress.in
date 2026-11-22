/**
 * Verification Test Suite for Phase 2: Relationship-Tiered Gatekeeper (Soft-Nudge vs Hard-Lock)
 * Tests client tiering, deliverable gating, Section 194J TDS calculation, 48h partner overrides, and instant UPI unlock.
 */

const http = require("http");

async function runTestSuite() {
  console.log("\n=======================================================================");
  console.log("   PHASE 2: RELATIONSHIP-TIERED GATEKEEPER & PAY-TO-RELEASE SUITE     ");
  console.log("=======================================================================\n");

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

  // --- UNIT TESTS 1: Tier Evaluation Logic ---
  console.log("▶ [Test Group 1]: Client Relationship Tier Classification");
  const { evaluateClientRelationshipTier, computeTds194jSettlement, formatTieredGatekeeperWhatsAppMessage } = require("../src/lib/billing/tieredGatekeeper");

  // 1.1 Tier A Trusted Retainer Client
  const tierAClient = { id: "CLI-APEX-01", name: "Apex AutoTech Private Limited", incorporationYear: 2018, healthScore: 95 };
  const tierAInvoices = [{ id: "INV-01", amount: 4500, status: "PENDING", dueDate: new Date(Date.now() + 86400000 * 5).toISOString() }];
  const evalA = evaluateClientRelationshipTier(tierAClient, tierAInvoices);

  assert(evalA.tier === "TIER_A_TRUSTED", `Apex AutoTech classified as TIER_A_TRUSTED (got: ${evalA.tier})`);
  assert(evalA.recommendedPolicy === "SOFT_NUDGE", `Tier A policy is SOFT_NUDGE (got: ${evalA.recommendedPolicy})`);
  assert(evalA.trustScore >= 80, `Tier A trust score is high (got: ${evalA.trustScore})`);
  assert(evalA.lihaazFactor.includes("Lihaaz"), `Tier A lihaazFactor accounts for relational courtesy`);

  // 1.2 Tier B Ad-Hoc / Bank CMA / Scrutiny Client
  const tierBClient = { id: "CLI-KUBER-01", name: "Kuber Logistics Private Limited", incorporationYear: 2025, healthScore: 80 };
  const tierBInvoices = [{ id: "INV-02", amount: 35000, status: "PENDING", serviceCategory: "CMA_REPORT", dueDate: new Date(Date.now() - 86400000 * 5).toISOString() }];
  const evalB = evaluateClientRelationshipTier(tierBClient, tierBInvoices);

  assert(evalB.tier === "TIER_B_ADHOC", `Kuber Logistics classified as TIER_B_ADHOC (got: ${evalB.tier})`);
  assert(evalB.recommendedPolicy === "HARD_LOCK", `Tier B policy is HARD_LOCK (got: ${evalB.recommendedPolicy})`);
  assert(evalB.rationale.includes("Ad-hoc") || evalB.rationale.includes("high-stakes"), `Tier B rationale flags ad-hoc delivery`);

  // 1.3 Tier C Chronic Defaulter (>60 days overdue)
  const tierCClient = { id: "CLI-DEFAULTER-01", name: "Sticky Trade Corporation", incorporationYear: 2020, healthScore: 60 };
  const tierCInvoices = [
    { id: "INV-03", amount: 28000, status: "OVERDUE", dueDate: new Date(Date.now() - 86400000 * 75).toISOString() },
    { id: "INV-04", amount: 15000, status: "OVERDUE", dueDate: new Date(Date.now() - 86400000 * 65).toISOString() }
  ];
  const evalC = evaluateClientRelationshipTier(tierCClient, tierCInvoices);

  assert(evalC.tier === "TIER_C_DEFAULTER", `Sticky Trade classified as TIER_C_DEFAULTER (got: ${evalC.tier})`);
  assert(evalC.recommendedPolicy === "PRE_SERVICE_ADVANCE", `Tier C policy is PRE_SERVICE_ADVANCE (got: ${evalC.recommendedPolicy})`);
  assert(evalC.oldestOverdueDays >= 60, `Tier C detects overdue days >= 60 (got: ${evalC.oldestOverdueDays})`);

  // --- UNIT TESTS 2: Section 194J TDS Settlement ---
  console.log("\n▶ [Test Group 2]: Section 194J TDS Deduction Calculations");
  const tds10 = computeTds194jSettlement(50000, 10);
  assert(tds10.grossAmount === 50000, `Gross amount is 50,000`);
  assert(tds10.tdsAmount === 5000, `10% TDS is 5,000`);
  assert(tds10.netPayableAmount === 45000, `Net payable is 45,000`);
  assert(tds10.tdsRuleCitation.includes("194J"), `Cites Section 194J statutory provision`);

  const tds2 = computeTds194jSettlement(100000, 2);
  assert(tds2.tdsAmount === 2000, `2% TDS is 2,000`);
  assert(tds2.netPayableAmount === 98000, `Net payable is 98,000`);

  // --- UNIT TESTS 3: Tiered WhatsApp Message Formatting ---
  console.log("\n▶ [Test Group 3]: Tier-Appropriate WhatsApp Dispatch Formatting");
  const msgA = formatTieredGatekeeperWhatsAppMessage({
    clientName: "Apex AutoTech",
    deliverableTitle: "Form 3CD Tax Audit",
    deliverableType: "FORM_3CD_TAX_AUDIT",
    invoiceNo: "INV-2026-089",
    grossAmount: 118000,
    netAmount: 106200,
    tier: "TIER_A_TRUSTED",
    upiPaymentLink: "upi://pay?pa=test",
    previewUrl: "https://brains-and-taxes.in/client/preview/1"
  });
  assert(msgA.includes("Pranam"), `Tier A includes polite Indian Pranam`);
  assert(msgA.includes("UNLOCKED"), `Tier A confirms unlocked deliverable access`);

  const msgB = formatTieredGatekeeperWhatsAppMessage({
    clientName: "Kuber Logistics",
    deliverableTitle: "Bank CMA Data Report",
    deliverableType: "BANK_CMA_REPORT",
    invoiceNo: "INV-2026-104",
    grossAmount: 35000,
    netAmount: 31500,
    tier: "TIER_B_ADHOC",
    upiPaymentLink: "upi://pay?pa=test",
    previewUrl: "https://brains-and-taxes.in/client/preview/2"
  });
  assert(msgB.includes("Draft Preview"), `Tier B provides draft preview link`);
  assert(msgB.includes("UDIN"), `Tier B notes ICAI UDIN unlocks upon payment`);

  const msgC = formatTieredGatekeeperWhatsAppMessage({
    clientName: "Brains & Taxes",
    deliverableTitle: "GSTR-9C Annual Audit",
    deliverableType: "GST_ANNUAL_GSTR9C",
    invoiceNo: "INV-2026-094",
    grossAmount: 45000,
    netAmount: 40500,
    tier: "TIER_C_DEFAULTER",
    upiPaymentLink: "upi://pay?pa=test",
    previewUrl: "https://brains-and-taxes.in/client/preview/3"
  });
  assert(msgC.includes("outstanding balance"), `Tier C mentions existing outstanding balance`);
  assert(msgC.includes("commitment advance"), `Tier C requests commitment advance`);

  // --- INTEGRATION TESTS 4: Live API `/api/pay-to-release` ---
  console.log("\n▶ [Test Group 4]: Live API /api/pay-to-release Verification");

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
    // 4.1 GET /api/pay-to-release
    const getRes = await makeRequest("GET", "/api/pay-to-release");
    assert(getRes.statusCode === 200, `GET /api/pay-to-release returns 200 OK`);
    assert(getRes.body && getRes.body.success === true, `API reports success: true`);
    assert(Array.isArray(getRes.body.deliverables), `Deliverables list returned`);
    assert(getRes.body.deliverables.length >= 4, `At least 4 deliverables in practice catalog (got: ${getRes.body.deliverables.length})`);

    // Verify dynamic tier fields in returned deliverables
    const sampleD = getRes.body.deliverables[0];
    assert(Boolean(sampleD.clientTier), `Deliverable includes clientTier (${sampleD.clientTier})`);
    assert(Boolean(sampleD.gatePolicy), `Deliverable includes gatePolicy (${sampleD.gatePolicy})`);
    assert(typeof sampleD.netPayableAmount === "number", `Deliverable includes netPayableAmount`);

    // 4.2 GET with Tier Filter
    const filterRes = await makeRequest("GET", "/api/pay-to-release?tier=TIER_B_ADHOC");
    assert(filterRes.statusCode === 200, `GET with ?tier=TIER_B_ADHOC returns 200 OK`);
    const allTierB = filterRes.body.deliverables.every(d => d.clientTier === "TIER_B_ADHOC");
    assert(allTierB, `All returned items are TIER_B_ADHOC`);

    // 4.3 POST PARTNER_OVERRIDE_UNLOCK (48 Hours Grace)
    const overrideRes = await makeRequest("POST", "/api/pay-to-release", {
      action: "PARTNER_OVERRIDE_UNLOCK",
      entityId: "CLI-KUBER-01",
      partnerName: "CA Gunjan Jain",
      reason: "Urgent Bank CC Limit Sanction Committee meeting today",
      durationHours: 48
    });
    assert(overrideRes.statusCode === 200, `POST PARTNER_OVERRIDE_UNLOCK returns 200 OK`);
    assert(overrideRes.body.success === true, `Override success is true`);
    assert(overrideRes.body.config.isLocked === false, `Entity is temporarily unlocked under override`);
    assert(Boolean(overrideRes.body.config.partnerOverrideUntil), `partnerOverrideUntil timestamp is set`);

    // 4.4 POST APPLY_TDS_SETTLEMENT
    const tdsRes = await makeRequest("POST", "/api/pay-to-release", {
      action: "APPLY_TDS_SETTLEMENT",
      entityId: "CLI-KUBER-01",
      amountPaid: 35000,
      tdsRate: 10
    });
    assert(tdsRes.statusCode === 200, `POST APPLY_TDS_SETTLEMENT returns 200 OK`);
    assert(tdsRes.body.settlement.netPayableAmount === 31500, `TDS 10% settlement computes net payable ₹31,500`);

    // 4.5 POST INSTANT_PAYMENT_RELEASE (NPCI Auto-Unlock in 0.8s)
    const instantRes = await makeRequest("POST", "/api/pay-to-release", {
      action: "INSTANT_PAYMENT_RELEASE",
      entityId: "CLI-KUBER-01",
      amountPaid: 31500,
      paymentMode: "UPI_DYNAMIC",
      utrRef: "NPCI-TEST-992182"
    });
    assert(instantRes.statusCode === 200, `POST INSTANT_PAYMENT_RELEASE returns 200 OK`);
    assert(instantRes.body.success === true, `Payment release reports success`);
    assert(instantRes.body.receipt && instantRes.body.receipt.utrRef === "NPCI-TEST-992182", `Receipt created with UTR reference`);
    assert(instantRes.body.config.isLocked === false, `Entity locked status permanently released`);

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
