/**
 * Verification Test Suite for Phase 3: Autonomous Scope-Creep & Live Engagement Agreements (Anchor Style)
 * Tests volume capacity audit, out-of-scope incident handling, 1-tap WhatsApp consent, dynamic micro-billing, and goodwill waivers.
 */

const http = require("http");

async function runTestSuite() {
  console.log("\n=======================================================================");
  console.log("   PHASE 3: AUTONOMOUS SCOPE-CREEP & LIVE AGREEMENTS TEST SUITE       ");
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

  // --- UNIT TESTS 1: Volume Capacity Overages ---
  console.log("▶ [Test Group 1]: Volume Capacity & Retainer Tier Scaling (Anchor Engine)");
  const { calculateVolumeOverageBilling, generateMicroApprovalWhatsAppMessage, SAMPLE_ENGAGEMENT_AGREEMENTS, SAMPLE_SCOPE_CREEP_INCIDENTS } = require("../src/lib/billing/scopeCreepEngine");

  // 1.1 Over-capacity client (+223% surge)
  const apexAgreement = SAMPLE_ENGAGEMENT_AGREEMENTS[0];
  const overageApex = calculateVolumeOverageBilling(apexAgreement);

  assert(overageApex.isOverCapacity === true, `Apex AutoTech correctly flagged as over capacity`);
  assert(overageApex.overagePercentage >= 200, `Overage percentage calculated (>200%, got: ${overageApex.overagePercentage}%)`);
  assert(overageApex.recommendedAdjustment > apexAgreement.baseRetainerFee, `Recommended adjustment increases retainer (₹${apexAgreement.baseRetainerFee} -> ₹${overageApex.recommendedAdjustment})`);
  assert(overageApex.rationale.includes("transaction volume"), `Rationale explains transaction volume surge`);

  // 1.2 Within-capacity client (Maheshwari Textiles)
  const maheshAgreement = SAMPLE_ENGAGEMENT_AGREEMENTS[2];
  const overageMahesh = calculateVolumeOverageBilling(maheshAgreement);

  assert(overageMahesh.isOverCapacity === false, `Maheshwari Textiles within capacity (isOverCapacity: false)`);
  assert(overageMahesh.overagePercentage === 0, `Overage percentage is 0%`);
  assert(overageMahesh.recommendedAdjustment === maheshAgreement.baseRetainerFee, `Retainer adjustment remains base fee`);

  // --- UNIT TESTS 2: WhatsApp Micro-Approval Formatting ---
  console.log("\n▶ [Test Group 2]: WhatsApp Micro-Approval Card Formatting");
  const sampleIncident = SAMPLE_SCOPE_CREEP_INCIDENTS[0];
  const waMsg = generateMicroApprovalWhatsAppMessage({
    incident: sampleIncident,
    agreement: apexAgreement,
    approvalUrl: "https://brains-and-taxes.in/client/approval/tok_apex_123",
    partnerName: "CA Gunjan Jain"
  });

  assert(waMsg.includes("Pranam"), `WhatsApp message starts with respectful Pranam`);
  assert(waMsg.includes(sampleIncident.title), `Embeds ad-hoc service title`);
  assert(waMsg.includes(apexAgreement.id), `Cites base agreement ID reference`);
  assert(waMsg.includes("₹" + sampleIncident.standardIcaiTariff.toLocaleString("en-IN")), `Shows standard ICAI tariff`);
  assert(waMsg.includes("₹" + sampleIncident.proposedMicroBillFee.toLocaleString("en-IN")), `Shows preferred partner discounted fee`);
  assert(waMsg.includes("https://brains-and-taxes.in/client/approval/tok_apex_123"), `Includes 1-Tap client confirmation link`);

  // --- INTEGRATION TESTS 3: Live API `/api/billing/agreements` ---
  console.log("\n▶ [Test Group 3]: Live API /api/billing/agreements Integration");

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
    // 3.1 GET /api/billing/agreements
    const getRes = await makeRequest("GET", "/api/billing/agreements");
    assert(getRes.statusCode === 200, `GET /api/billing/agreements returns 200 OK`);
    assert(getRes.body && getRes.body.success === true, `API reports success: true`);
    assert(Array.isArray(getRes.body.agreements), `Returns live agreements list`);
    assert(Array.isArray(getRes.body.incidents), `Returns scope creep incidents list`);
    assert(Array.isArray(getRes.body.microBills), `Returns micro-bills list`);
    assert(Array.isArray(getRes.body.volumeAlerts), `Returns volume capacity alerts`);
    assert(getRes.body.metrics.volumeAlertsCount >= 1, `Detects at least 1 client overage alert`);
    assert(getRes.body.metrics.recoverableUnbilled > 0, `Calculates recoverable unbilled scope creep`);

    // 3.2 POST SEND_CONSENT_REQUEST
    const consentRes = await makeRequest("POST", "/api/billing/agreements", {
      action: "SEND_CONSENT_REQUEST",
      incidentId: "SCP-2026-001",
      partnerName: "CA Gunjan Jain"
    });
    assert(consentRes.statusCode === 200, `POST SEND_CONSENT_REQUEST returns 200 OK`);
    assert(consentRes.body.success === true, `Consent request dispatched successfully`);
    assert(consentRes.body.incident.status === "CONSENT_SENT", `Incident status updated to CONSENT_SENT`);
    assert(Boolean(consentRes.body.whatsappText), `Generated ready-to-dispatch WhatsApp text`);

    // 3.3 POST CLIENT_APPROVE_INCIDENT
    const approveRes = await makeRequest("POST", "/api/billing/agreements", {
      action: "CLIENT_APPROVE_INCIDENT",
      incidentId: "SCP-2026-001"
    });
    assert(approveRes.statusCode === 200, `POST CLIENT_APPROVE_INCIDENT returns 200 OK`);
    assert(approveRes.body.incident.status === "CLIENT_APPROVED", `Incident status updated to CLIENT_APPROVED`);
    assert(Boolean(approveRes.body.incident.approvedAt), `Recorded approval timestamp`);

    // 3.4 POST CONVERT_TO_MICRO_BILL
    const microBillRes = await makeRequest("POST", "/api/billing/agreements", {
      action: "CONVERT_TO_MICRO_BILL",
      incidentId: "SCP-2026-001",
      partnerName: "CA Gunjan Jain"
    });
    assert(microBillRes.statusCode === 200, `POST CONVERT_TO_MICRO_BILL returns 200 OK`);
    assert(microBillRes.body.success === true, `Micro-bill generated successfully`);
    assert(Boolean(microBillRes.body.microBill.id), `Generated unique micro-bill ID (${microBillRes.body.microBill.id})`);
    assert(microBillRes.body.microBill.totalPayable === 4130, `Total payable computed with 18% GST (₹3500 + 18% = ₹4130)`);
    assert(microBillRes.body.microBill.upiPaymentLink.startsWith("upi://pay"), `Generated universal NPCI UPI URI`);
    assert(microBillRes.body.microBill.qrDataUrl.startsWith("data:image/png;base64"), `Generated offline base64 QR code`);
    assert(microBillRes.body.incident.status === "INVOICED", `Incident status updated to INVOICED`);

    // 3.5 POST WAIVE_AS_GOODWILL
    const waiveRes = await makeRequest("POST", "/api/billing/agreements", {
      action: "WAIVE_AS_GOODWILL",
      incidentId: "SCP-2026-002",
      partnerName: "CA Gunjan Jain",
      reason: "Waived for Kuber Logistics SBI CC Limit (Logged to Paisa Bachaya Kitna ledger)"
    });
    assert(waiveRes.statusCode === 200, `POST WAIVE_AS_GOODWILL returns 200 OK`);
    assert(waiveRes.body.incident.status === "WAIVED_BY_PARTNER", `Incident status updated to WAIVED_BY_PARTNER`);

    // 3.6 POST UPDATE_VOLUME_TIER
    const tierRes = await makeRequest("POST", "/api/billing/agreements", {
      action: "UPDATE_VOLUME_TIER",
      agreementId: "AGR-APEX-2026",
      newMonthlyFee: 7500,
      partnerName: "CA Gunjan Jain"
    });
    assert(tierRes.statusCode === 200, `POST UPDATE_VOLUME_TIER returns 200 OK`);
    assert(tierRes.body.agreement.baseRetainerFee === 7500, `Monthly retainer updated to ₹7,500/mo`);
    assert(tierRes.body.agreement.status === "ACTIVE", `Agreement status reset to ACTIVE`);

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
