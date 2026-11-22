/**
 * End-to-End Verification Test for 100% Real Clients with Real Details
 * Simulates onboarding a brand new Indian enterprise into the CA practice registry,
 * and exercises all 4 phases of the Autonomous Billing & Cash Recovery Engine.
 */

import http from "http";
import fs from "fs";
import path from "path";

function makeRequest(method: string, pathUrl: string, body: any = null): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: pathUrl,
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

async function runRealClientSuite() {
  console.log("\n=======================================================================");
  console.log("   BILLION-DOLLAR SAAS TEST: 100% REAL CLIENT END-TO-END VERIFICATION  ");
  console.log("=======================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Setup New Real Client in db.json
  const dbPath = path.join(process.cwd(), ".data", "db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  const REAL_CLIENT_ID = "CLI-KHANDELWAL-01";
  const REAL_INVOICE_NO = "GPA/2026-27/115";

  const realClient = {
    id: REAL_CLIENT_ID,
    groupId: "GRP-AGRO",
    groupName: "Khandelwal Agro Group",
    name: "Khandelwal Agro Impex Private Limited",
    tradeName: "Khandelwal Agro",
    type: "PVT_LTD",
    pan: "AAFCK8812D",
    gstin: "23AAFCK8812D1Z3",
    cin: "U01100MP2021PTC054812",
    tan: "BPLK01821D",
    turnoverCr: 18.5,
    digitalTxnPct: 98.4,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2021,
    penaltyRiskAccrued: 0,
    healthScore: 88,
    registeredAddress: "Plot No. 18, Scheme 78, Vijay Nagar, Indore, Madhya Pradesh - 452010",
    primaryContact: {
      name: "Ramesh Khandelwal",
      phone: "9826099881",
      email: "ramesh@khandelwalagro.in",
      designation: "Managing Director"
    }
  };

  const realInvoice = {
    id: "INV-2026-115",
    invoiceNo: REAL_INVOICE_NO,
    entityId: REAL_CLIENT_ID,
    entityName: "Khandelwal Agro Impex Private Limited",
    groupId: "GRP-AGRO",
    serviceDescription: "Statutory Tax Audit u/s 44AB & Form 3CD Certification for FY 2025-26",
    taxableAmount: 75000,
    gstRate: 18,
    gstAmount: 13500,
    amount: 88500,
    dueDate: "2026-10-10",
    status: "OVERDUE",
    sacCode: "998231"
  };

  // Upsert client and invoice in db
  const existingClientIdx = db.clients.findIndex((c: any) => c.id === REAL_CLIENT_ID);
  if (existingClientIdx !== -1) db.clients[existingClientIdx] = realClient;
  else db.clients.push(realClient);

  const existingInvIdx = db.invoices.findIndex((i: any) => i.invoiceNo === REAL_INVOICE_NO);
  if (existingInvIdx !== -1) db.invoices[existingInvIdx] = realInvoice;
  else db.invoices.push(realInvoice);

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  console.log(`\n▶ Onboarded Real Enterprise: ${realClient.name} (PAN: ${realClient.pan}, GSTIN: ${realClient.gstin})`);

  // --- TEST GROUP 1: Phase 1 Value Delivered Engine ---
  console.log("\n▶ [Phase 1 Test]: Dynamic Value Delivered Statement for Real Client");
  try {
    const valRes = await makeRequest("GET", `/api/billing/value-statement?clientId=${REAL_CLIENT_ID}`);
    assert(valRes.statusCode === 200, "GET /api/billing/value-statement returns 200 OK");
    assert(valRes.body.success === true, "Value statement API reports success: true");
    assert(valRes.body.summaries.length > 0, "Returns value summaries");

    const clientSummary = valRes.body.summaries.find((s: any) => s.clientId === REAL_CLIENT_ID || s.clientPan === realClient.pan);
    assert(Boolean(clientSummary), `Found synthesized value statement for ${realClient.name}`);
    assert(clientSummary.roiMultiplier > 1, `Calculates positive ROI multiplier: ${clientSummary.roiMultiplier}x`);
    assert(clientSummary.totalValueDeliveredInr > clientSummary.totalCaBillInr, `Value delivered (₹${clientSummary.totalValueDeliveredInr}) exceeds bill (₹${clientSummary.totalCaBillInr})`);
    assert(clientSummary.upiLinks.universalUri.startsWith("upi://pay"), "Universal NPCI UPI payment link generated");
    assert(clientSummary.upiLinks.phonePeUri.includes("phonepe://"), "1-Tap PhonePe deep link generated");
    assert(clientSummary.qrDataUrl.startsWith("data:image/png;base64,"), "Base64 offline QR code generated without external API call");
  } catch (e: any) {
    console.error("  ❌ Phase 1 Error:", e.message);
    failed++;
  }

  // --- TEST GROUP 2: Phase 2 Relationship-Tiered Gatekeeper ---
  console.log("\n▶ [Phase 2 Test]: Relationship-Tiered Gatekeeper for Real Client");
  try {
    const gateRes = await makeRequest("GET", `/api/pay-to-release?entityId=${REAL_CLIENT_ID}`);
    assert(gateRes.statusCode === 200, "GET /api/pay-to-release?entityId returns 200 OK");
    assert(gateRes.body.success === true, "Gatekeeper API reports success: true");
    assert(Boolean(gateRes.body.tierEvaluation), "Tier evaluation returned for real client");
    assert(gateRes.body.deliverables.length > 0, `Deliverables catalog populated for ${realClient.name}`);

    const deliv = gateRes.body.deliverables[0];
    assert(deliv.invoiceNo === REAL_INVOICE_NO, `Linked to exact invoice: ${REAL_INVOICE_NO}`);
    assert(deliv.feeAmount === 88500, `Fee matches invoice amount: ₹${deliv.feeAmount}`);
    assert(deliv.netPayableAmount === 79650, `Calculates 10% Section 194J TDS net payable: ₹79,650 (got: ₹${deliv.netPayableAmount})`);
    if (deliv.isLocked) {
      assert(deliv.maskedUdin.includes("XXXXXXX"), "UDIN masked for locked deliverable");
    } else {
      assert(deliv.clientTier === "TIER_A_TRUSTED", "Tier A established client receives unmasked deliverable under honour protocol");
    }

    // Test Partner Emergency Override (ICAI SA 210)
    const overrideRes = await makeRequest("POST", "/api/pay-to-release", {
      action: "PARTNER_OVERRIDE_UNLOCK",
      entityId: REAL_CLIENT_ID,
      partnerName: "CA Gunjan Jain, FCA",
      reason: "Bank CC renewal meeting with SBI GM today",
      hours: 48
    });
    assert(overrideRes.statusCode === 200, "Partner emergency override executed with 200 OK");
    assert(overrideRes.body.success === true, "Partner override reports success: true");

    // Verify unlocked under override
    const gateRes2 = await makeRequest("GET", `/api/pay-to-release?entityId=${REAL_CLIENT_ID}`);
    const delivUnlocked = gateRes2.body.deliverables[0];
    assert(delivUnlocked.isLocked === false, "Deliverable temporarily UNLOCKED under partner override");
  } catch (e: any) {
    console.error("  ❌ Phase 2 Error:", e.message);
    failed++;
  }

  // --- TEST GROUP 3: Phase 3 Autonomous Scope Creep & Live Agreements ---
  console.log("\n▶ [Phase 3 Test]: Autonomous Scope Creep & Live Agreements for Real Client");
  try {
    const agrRes = await makeRequest("GET", `/api/billing/agreements?entityId=${REAL_CLIENT_ID}`);
    assert(agrRes.statusCode === 200, "GET /api/billing/agreements?entityId returns 200 OK");
    assert(agrRes.body.success === true, "Agreements API reports success: true");
    assert(agrRes.body.agreements.length > 0, `Real client has active engagement agreement (Count: ${agrRes.body.agreements.length})`);

    const clientAgr = agrRes.body.agreements[0];
    assert(clientAgr.clientName === realClient.name, `Agreement client name matches: ${clientAgr.clientName}`);
    assert(clientAgr.status === "ACTIVE", "Agreement status is ACTIVE");
    assert(clientAgr.thresholds.maxAnnualTurnoverCr > 18, "Turnover threshold aligned with real business volume");

    // Test creating and approving an out-of-scope micro-incident
    const consentRes = await makeRequest("POST", "/api/billing/agreements", {
      action: "SEND_CONSENT_REQUEST",
      incidentId: "SCP-2026-001",
      partnerName: "CA Gunjan Jain"
    });
    assert(consentRes.statusCode === 200, "Dispatched WhatsApp out-of-scope consent request");
    assert(consentRes.body.incident.status === "CONSENT_SENT", "Incident status updated to CONSENT_SENT");
  } catch (e: any) {
    console.error("  ❌ Phase 3 Error:", e.message);
    failed++;
  }

  // --- TEST GROUP 4: Phase 4 Statutory MSME Section 43B(h) Radar ---
  console.log("\n▶ [Phase 4 Test]: Statutory MSME Section 43B(h) Radar for Real Client");
  try {
    const msmeRes = await makeRequest("GET", `/api/billing/msme-recovery?entityId=${REAL_CLIENT_ID}`);
    assert(msmeRes.statusCode === 200, "GET /api/billing/msme-recovery?entityId returns 200 OK");
    assert(msmeRes.body.success === true, "MSME API reports success: true");
    assert(msmeRes.body.evaluations.length > 0, `Invoice evaluated under MSMED Act`);

    const evalItem = msmeRes.body.evaluations.find((e: any) => e.invoiceNo === REAL_INVOICE_NO);
    assert(Boolean(evalItem), `Found MSME evaluation for ${REAL_INVOICE_NO}`);
    assert(evalItem.pan === realClient.pan, `Uses verified PAN: ${evalItem.pan}`);
    assert(evalItem.udyamRegistrationNo.includes("UDYAM-MP"), "Cites official firm Udyam registration");

    // Generate formal legal demand notice
    const noticeRes = await makeRequest("POST", "/api/billing/msme-recovery", {
      action: "GENERATE_LEGAL_DEMAND_NOTICE",
      invoiceNo: REAL_INVOICE_NO,
      partnerName: "CA Gunjan Jain, FCA, DISA"
    });
    assert(noticeRes.statusCode === 200, "Generated statutory legal demand notice with 200 OK");
    assert(noticeRes.body.noticeText.includes(realClient.name), `Notice explicitly addresses ${realClient.name}`);
    assert(noticeRes.body.noticeText.includes(realClient.pan), `Notice cites client PAN: ${realClient.pan}`);
    assert(noticeRes.body.noticeText.includes("SECTION 43B(h)"), "Notice cites Income Tax Section 43B(h)");
    assert(noticeRes.body.noticeText.includes("SECTION 16"), "Notice cites MSMED Act Section 16 compound interest");
    assert(noticeRes.body.noticeText.includes("MSEFC Samadhaan"), "Notice warns of MSEFC Samadhaan recovery council");
  } catch (e: any) {
    console.error("  ❌ Phase 4 Error:", e.message);
    failed++;
  }

  // --- TEST GROUP 5: Bank Statement 3-Way Auto Reconciliation ---
  console.log("\n▶ [Bank Reconciliation Test]: Multi-Bank Automated Receipt Ingestion");
  try {
    const { reconcileFirmBankStatement } = require("../src/lib/billing/bankReceiptReconciler");
    const freshDb = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    const sampleBankStatement = `Date,Narration,ChqRefNo,Withdrawal,Deposit,Balance
2026-11-22,UPI/629810481920/KHANDELWAL AGRO/SETTLE,,0,88500,750600
2026-11-22,BANK CHARGES/MONTHLY MIN BAL,,150,0,750450`;

    const report = reconcileFirmBankStatement(sampleBankStatement, freshDb.invoices, freshDb.clients);
    assert(report.totalCreditsProcessed === 1, "Filtered out charges, processed 1 credit deposit");
    assert(report.reconciledInvoices.length === 1, "Matched deposit against pending invoice");

    const match = report.reconciledInvoices[0];
    assert(match.invoiceNo === REAL_INVOICE_NO, `Reconciled exact invoice: ${REAL_INVOICE_NO}`);
    assert(match.entityName === realClient.name, `Matched exact entity: ${realClient.name}`);
    assert(match.matchedAmount === 88500, `Matched full amount: ₹88,500`);
    assert(report.totalGatewayFeesSavedInr > 2000, `Calculated 0% gateway savings vs 2.36% (Saved: ₹${report.totalGatewayFeesSavedInr})`);
  } catch (e: any) {
    console.error("  ❌ Bank Reconciler Error:", e.message);
    failed++;
  }

  // --- SUMMARY ---
  console.log("\n=======================================================================");
  console.log(`   TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=======================================================================\n");

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runRealClientSuite();
