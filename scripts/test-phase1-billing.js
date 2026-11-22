/**
 * Autonomous Tax Autopilot - Phase 1 Tier-2 India Billing & Value Realization Verification Suite
 * Tests:
 * 1. Deterministic NPCI UPI v2.0 Deep Link Generation (GPay, PhonePe, Paytm)
 * 2. Offline Pure QR Code Data URL Generator
 * 3. "Paisa Bachaya Kitna" Value Delivered & Dual-Ledger Calculations
 * 4. Live API Route /api/billing/value-statement (GET & POST)
 * 5. Tier-2 India WhatsApp Value Statement Formatting
 */

const http = require("http");

async function runTests() {
  console.log("================================================================================");
  console.log(" 💎 TAXOBRAIN PHASE 1 BILLING & VALUE REALIZATION AUTOMATED TEST SUITE");
  console.log("================================================================================\n");

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

  // -------------------------------------------------------------------------
  // TEST 1: Unit Level Tests (NPCI UPI & Value Calculation)
  // -------------------------------------------------------------------------
  console.log("▶ TEST 1: Testing NPCI Dynamic UPI Deep Links & Offline QR Generation");
  try {
    const { generateNpciUpiDeepLinks, generateUpiQrDataUrl } = require("../src/lib/billing/npciUpiEngine.ts");
    const { computeValueDeliveredSummary, generateWhatsAppValueCard } = require("../src/lib/billing/valueDeliveredEngine.ts");

    const upiLinks = generateNpciUpiDeepLinks({
      firmVpa: "ca.gunjan@icici",
      merchantName: "Brains & Taxes",
      amount: 4130,
      invoiceNo: "INV-2026-001",
      clientName: "Apex AutoTech"
    });

    assert(upiLinks.universalUri.startsWith("upi://pay?"), `Generated valid universal NPCI UPI URI: ${upiLinks.universalUri.slice(0, 35)}...`);
    assert(upiLinks.phonePeUri.startsWith("phonepe://pay?"), "Generated 1-Tap PhonePe Direct URI");
    assert(upiLinks.gPayUri.startsWith("gpay://upi/pay?"), "Generated 1-Tap Google Pay Direct URI");
    assert(upiLinks.paytmUri.startsWith("paytmmp://pay?"), "Generated 1-Tap Paytm Direct URI");
    assert(upiLinks.universalUri.includes("am=4130.00"), "Exact rupee amount encoded with 2 decimal precision");
    assert(upiLinks.universalUri.includes("pa=ca.gunjan%40icici") || upiLinks.universalUri.includes("pa=ca.gunjan@icici"), "Firm VPA encoded properly");

    // Offline QR Data URL test
    const qrUrl = await generateUpiQrDataUrl(upiLinks.universalUri, { width: 200 });
    assert(qrUrl.startsWith("data:image/png;base64,"), "Generated valid base64 PNG QR code offline (0ms, 0 API fee)");

    // Value Engine Test
    console.log("\n▶ TEST 2: Testing 'Paisa Bachaya Kitna' Value Delivered Ledger Logic");
    const summary = computeValueDeliveredSummary({
      clientId: "CLI-TEST",
      clientName: "Test Lala Traders",
      clientPan: "AABCT1234F",
      billingPeriod: "October 2026",
      invoiceNo: "INV/TEST/01",
      invoiceDate: "2026-11-20",
      pureAgentGovtFeesInr: 3000,
      caProfessionalFeeInr: 4000,
      benefits: [
        {
          id: "B1",
          category: "ITC_RECONCILED",
          title: "ITC Match",
          description: "Matched GSTR-2B",
          statutoryReference: "Sec 16(2)",
          financialBenefitInr: 80000,
          badgeLabel: "ITC"
        },
        {
          id: "B2",
          category: "PENALTY_SAVED",
          title: "Late Fee Saved",
          description: "Filed on time",
          statutoryReference: "Sec 47",
          financialBenefitInr: 5000,
          badgeLabel: "Late Fee"
        }
      ]
    });

    assert(summary.totalValueDeliveredInr === 85000, `Calculated total value delivered: ₹${summary.totalValueDeliveredInr} (Expected: ₹85,000)`);
    assert(summary.gstOnProfessionalFeeInr === 720, `GST 18% computed on CA fee only: ₹${summary.gstOnProfessionalFeeInr} (CBDT Cir 23/2017 compliant)`);
    assert(summary.netTotalPayableInr === 7720, `Net bill ₹7,720 (Govt Challan ₹3,000 + CA Fee ₹4,000 + GST ₹720)`);
    assert(summary.roiMultiplier === 21.3, `Calculated ROI Multiplier: ${summary.roiMultiplier}x of fee`);
    assert(summary.netClientSavingsInr === 77280, `Net savings ₹${summary.netClientSavingsInr}`);

    // WhatsApp Message test
    const waText = generateWhatsAppValueCard(summary, upiLinks, "GPA & Co.");
    assert(waText.includes("PAISA BACHAYA KITNA"), "WhatsApp message leads with Value Delivered summary");
    assert(waText.includes("Govt Challan (At Cost, 0% CA Margin)"), "Separates Government challan from CA fee");
    assert(waText.includes("upi://pay?"), "Embeds 1-Tap UPI payment link in WhatsApp message");

  } catch (err) {
    console.error("Local Unit Test Error:", err);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 3: Live API Server Tests (/api/billing/value-statement)
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 3: Testing Live API Server Endpoint (/api/billing/value-statement)");

  function httpRequest(options, postData) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      });
      req.on("error", reject);
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  try {
    // 1. GET all value statements
    const resGet = await httpRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/billing/value-statement",
      method: "GET"
    });

    assert(resGet.statusCode === 200, `API GET returned 200 OK (got ${resGet.statusCode})`);
    assert(resGet.data?.success === true, "GET returned success: true");
    assert(resGet.data?.count >= 4, `Loaded ${resGet.data?.count} pre-calculated client value statements`);
    
    const apex = resGet.data?.summaries?.find(s => s.clientId === "CLI-001");
    assert(apex?.clientName === "Apex AutoTech Private Limited", "Apex AutoTech value record present");
    assert(apex?.upiLinks?.universalUri.startsWith("upi://pay?"), "Apex AutoTech has live NPCI UPI universal URI");
    assert(apex?.qrDataUrl?.startsWith("data:image/png;base64,"), "Apex AutoTech has pre-generated offline QR code data URL");
    assert(apex?.roiMultiplier > 10, `Apex AutoTech value ROI: ${apex?.roiMultiplier}x multiplier`);

    // 2. POST dynamic value statement
    console.log("\n▶ TEST 4: Testing Dynamic Generation via POST");
    const postPayload = JSON.stringify({
      clientId: "CLI-NEW-99",
      clientName: "Surat Saree Sansar",
      clientPan: "AABCS9988D",
      billingPeriod: "November 2026",
      invoiceNo: "INV/2026-27/5555",
      pureAgentGovtFeesInr: 2000,
      caProfessionalFeeInr: 3000,
      benefits: [
        {
          id: "B-SURAT-1",
          category: "ITC_RECONCILED",
          title: "Yarn Inward ITC Reconciled",
          description: "Matched with 8 spinning mills",
          statutoryReference: "Section 16(2)",
          financialBenefitInr: 65000,
          badgeLabel: "ITC"
        }
      ]
    });

    const resPost = await httpRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/billing/value-statement",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postPayload)
      }
    }, postPayload);

    assert(resPost.statusCode === 200, `API POST returned 200 OK (got ${resPost.statusCode})`);
    assert(resPost.data?.success === true, "POST successfully created dynamic value statement");
    assert(resPost.data?.summary?.clientName === "Surat Saree Sansar", "Client name matched");
    assert(resPost.data?.summary?.netTotalPayableInr === 5540, `Net total ₹5,540 (Govt ₹2,000 + Fee ₹3,000 + GST ₹540)`);
    assert(resPost.data?.summary?.roiMultiplier === 21.7, `Calculated ROI multiplier: ${resPost.data?.summary?.roiMultiplier}x`);
    assert(resPost.data?.summary?.upiLinks?.phonePeUri.includes("am=5540.00"), "PhonePe URI contains ₹5540.00 exact amount");

  } catch (err) {
    console.error("HTTP Request Error:", err.message);
    failed++;
  }

  console.log("\n================================================================================");
  console.log(` 🏁 TEST RUN COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
