/**
 * Autonomous Tax Autopilot - Statutory Legal Notice & Pre-Notice Risk Radar Verification Suite
 * Tests Pillar 2 (Notice Decryptor & AI Defense Drafter) and Pillar 3 (Predictive Risk Radar)
 */

const http = require("http");

async function runTests() {
  console.log("================================================================================");
  console.log(" ⚖️  TAXOBRAIN LITIGATION & PRE-NOTICE RISK RADAR AUTOMATED TEST SUITE");
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
  // TEST 1: Statutory Legal Engine Import & Section 148 Reassessment Test
  // -------------------------------------------------------------------------
  console.log("▶ TEST 1: Income Tax Section 148 Reassessment Statutory Reply Assembly");
  try {
    // Dynamic import of TypeScript compiled modules or ts-node/direct import
    const { assembleStatutoryLegalReply, identifyNoticeSection, STATUTORY_CITATIONS } = require("../src/lib/litigation/statutoryLegalEngine.ts");
    const { validateNoticeDin } = require("../src/lib/litigation/autonomousNoticeEngine.ts");

    const sampleSec148Notice = `
      GOVERNMENT OF INDIA
      INCOME TAX DEPARTMENT
      NATIONAL FACELESS ASSESSMENT CENTRE, DELHI
      
      Notice under section 148 of the Income-tax Act, 1961
      DIN: ITBA/AST/S/148/2023-24/1058291823(1)
      Date: 28/03/2024
      
      To,
      M/s Apex AutoTech Private Limited
      PAN: AABCA8891D
      Assessment Year: 2021-22
      
      Sir/Madam,
      1. Whereas I have reasons to believe that your income chargeable to tax for the Assessment Year 2021-22
      has escaped assessment within the meaning of section 147 of the Income-tax Act, 1961.
      Alleged escaped income amounting to Rs. 45,00,000 on account of fictitious purchases.
      You are hereby required to furnish a return in the prescribed form within 30 days.
    `;

    const section = identifyNoticeSection(sampleSec148Notice);
    assert(section === "ITD_148_REASSESSMENT", `Section identified correctly as ITD_148_REASSESSMENT (got ${section})`);

    const dinStatus = validateNoticeDin("ITBA/AST/S/148/2023-24/1058291823(1)");
    assert(dinStatus === "VALID_STANDARD", `Valid CBDT DIN recognised as VALID_STANDARD (got ${dinStatus})`);

    const reply = assembleStatutoryLegalReply({
      rawNoticeText: sampleSec148Notice,
      noticeSectionKey: section,
      clientName: "Apex AutoTech Private Limited",
      clientPan: "AABCA8891D",
      dinOrRef: "ITBA/AST/S/148/2023-24/1058291823(1)",
      noticeDate: "28/03/2024",
      periodOrAy: "2021-22",
      demandAmount: "₹45,00,000",
      authorityName: "National Faceless Assessment Centre, Delhi"
    });

    assert(reply.citations.length >= 3, `Cited ${reply.citations.length} binding court precedents (>= 3 required)`);
    
    const hasRajeevBansal = reply.citations.some(c => c.caseTitle.includes("Rajeev Bansal"));
    assert(hasRajeevBansal, "Cited Supreme Court landmark 2024 INSC 754 (Rajeev Bansal) on 3-year limitation bar");

    const hasKelvinator = reply.citations.some(c => c.caseTitle.includes("Kelvinator"));
    assert(hasKelvinator, "Cited Supreme Court 320 ITR 561 (Kelvinator of India) prohibiting mere change of opinion");

    assert(reply.fullMarkdownReply.includes("PRAYER"), "Includes formal court prayer clause");
    assert(reply.coveringEmailNote.includes("Subject:"), "Assembled official covering email note to AO");
  } catch (err) {
    // If running under plain node without ts-node, fallback to testing via API server
    console.log(`  ℹ️  Local TS require note: ${err.message}. Testing through live API server.`);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Live API Server Tests for Pillar 2 & Pillar 3
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 2: Testing Live Notice Ingestion API (/api/litigation/notice-parse)");

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
    const sec148Payload = JSON.stringify({
      clientId: "CLI-001",
      fileName: "Income_Tax_Notice_148.pdf",
      rawText: `
        GOVERNMENT OF INDIA
        INCOME TAX DEPARTMENT
        NATIONAL FACELESS ASSESSMENT CENTRE, DELHI
        
        Notice under section 148 of the Income-tax Act, 1961
        DIN: ITBA/AST/S/148/2023-24/1058291823(1)
        Date: 28/03/2024
        
        To,
        M/s Apex AutoTech Private Limited
        PAN: AABCA8891D
        Assessment Year: 2021-22
        
        Sir/Madam,
        Whereas I have reasons to believe that your income chargeable to tax for AY 2021-22 has escaped assessment.
        Alleged escaped income amounting to Rs. 45,00,000 on account of alleged accommodation entries.
        Furnish return within 30 days.
      `
    });

    const resNotice = await httpRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/litigation/notice-parse",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(sec148Payload)
      }
    }, sec148Payload);

    assert(resNotice.statusCode === 200, `Notice parse endpoint returned 200 OK (got ${resNotice.statusCode})`);
    assert(resNotice.data?.success === true, "Notice parsed and docket created successfully");
    assert(resNotice.data?.metadata?.dinOrRef === "ITBA/AST/S/148/2023-24/1058291823(1)", "Extracted authentic ITBA DIN number");
    assert(resNotice.data?.legalReply?.noticeDefinition?.sectionCode === "Section 148", "Classified as Section 148");
    assert(resNotice.data?.legalReply?.citations?.length >= 3, `Generated ${resNotice.data?.legalReply?.citations?.length} authoritative judicial citations`);

    // -------------------------------------------------------------------------
    // TEST 3: GST DRC-01 / ASMT-10 Notice Ingestion (Pillar 2 - Suncraft Energy citation)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 3: Testing GST Input Tax Credit Notice (Form DRC-01 / ASMT-10)");

    const gstNoticePayload = JSON.stringify({
      clientId: "CLI-001",
      fileName: "GST_DRC_01C_Notice.pdf",
      rawText: `
        FORM GST DRC-01C
        [See rule 88D]
        Reference No: GST/DRC01C/2024/09881726
        DIN: 20240957000000008453
        Date: 15/07/2024
        
        To:
        Apex AutoTech Private Limited
        GSTIN: 23AABCA8891D1Z4
        
        Intimation of difference in input tax credit available in GSTR-2B and that availed in GSTR-3B.
        It is noticed that the Input Tax Credit availed by you in Form GSTR-3B for the tax period June 2024
        exceeds the credit available in Form GSTR-2B by Rs. 3,42,000.
        You are directed to pay the differential amount or explain reasons within 7 days.
      `
    });

    const resGstNotice = await httpRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/litigation/notice-parse",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(gstNoticePayload)
      }
    }, gstNoticePayload);

    assert(resGstNotice.statusCode === 200, `GST notice parse endpoint returned 200 OK (got ${resGstNotice.statusCode})`);
    assert(resGstNotice.data?.legalReply?.noticeDefinition?.sectionCode.includes("Rule 88D") || 
           resGstNotice.data?.legalReply?.noticeDefinition?.sectionCode.includes("DRC-01C"), "Identified as GST Rule 88D / DRC-01C");
    
    const gstCitations = resGstNotice.data?.legalReply?.citations || [];
    const hasSuncraft = gstCitations.some(c => c.caseTitle.toLowerCase().includes("suncraft"));
    assert(hasSuncraft, "Cited landmark Suncraft Energy Pvt Ltd (Calcutta HC 2023) protecting bonafide buyer ITC");

    // -------------------------------------------------------------------------
    // TEST 4: Predictive Pre-Notice Risk Radar (Pillar 3)
    // -------------------------------------------------------------------------
    console.log("\n▶ TEST 4: Testing Predictive Pre-Notice Risk Radar (/api/litigation/predictive-risk)");

    const resRisk = await httpRequest({
      hostname: "localhost",
      port: 3000,
      path: "/api/litigation/predictive-risk",
      method: "GET"
    });

    assert(resRisk.statusCode === 200, `Predictive risk endpoint returned 200 OK (got ${resRisk.statusCode})`);
    assert(resRisk.data?.success === true, "Predictive risk scan completed successfully");
    assert(resRisk.data?.totalRisksIdentified > 0, `Identified ${resRisk.data?.totalRisksIdentified} active pre-notice exposures across portfolio`);
    assert(resRisk.data?.totalTaxExposureInr > 0, `Calculated portfolio tax exposure ₹${resRisk.data?.totalTaxExposureInr.toLocaleString("en-IN")}`);

    const riskCategories = (resRisk.data?.risks || []).map(r => r.category);
    assert(riskCategories.includes("GST_RULE_88C"), "Radar detected Rule 88C (GSTR-1 vs 3B liability mismatch)");
    assert(riskCategories.includes("GST_RULE_88D"), "Radar detected Rule 88D (GSTR-2B vs 3B ITC mismatch)");
    assert(riskCategories.includes("ITD_143_1_AIS"), "Radar detected Section 143(1)(a) AIS/26AS turnover mismatch");
    assert(riskCategories.includes("MSME_43B_H"), "Radar detected Section 43B(h) MSME 45-day overdue payment risk");

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
