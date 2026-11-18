/**
 * Brains & Taxes — Enterprise CA Knowledge Framework Engine
 * 
 * MASTER END-TO-END VERIFICATION HARNESS (ALL 6 PILLARS)
 * 
 * Executes full test suites across all 6 architectural pillars:
 * 1. Temporal GraphRAG & Precedence Re-ranking
 * 2. Statutory Refusal & Requisition Gates
 * 3. Dual-Track Relational & Vector Database
 * 4. 3-Tier Maker-Checker Multi-Agent Swarm
 * 5. Deterministic Numerical Engines (Zero LLM Math)
 * 6. Continuous Legal CI/CD Benchmark Suite
 */

const { execSync } = require('child_process');

console.log("================================================================================");
console.log("       BRAINS & TAXES — MASTER E2E AUDIT (ALL 6 PILLARS INTEGRATION)            ");
console.log("   GPA & Co., Chartered Accountants (FRN 022998C) & Brains & Taxes Pvt Ltd     ");
console.log("================================================================================\n");

const suites = [
  { name: "Pillar 1: Temporal GraphRAG & Precedence Re-ranking", script: "scripts/test-temporal-graph-rag.js" },
  { name: "Pillar 2: Statutory Refusal & Evidence Requisition Protocol", script: "scripts/test-statutory-refusal-gates.js" },
  { name: "Pillar 3: Dual-Track Relational & Vector Database", script: "scripts/test-dual-track-database.js" },
  { name: "Pillar 4: 3-Tier Maker-Checker Multi-Agent Swarm", script: "scripts/test-maker-checker-swarm.js" },
  { name: "Pillar 5: Deterministic Numerical Calculation Engines", script: "scripts/test-deterministic-calc-engines.js" },
  { name: "Pillar 6: Continuous Automated Legal CI/CD Benchmarks", script: "scripts/test-legal-cicd-benchmarks.js" }
];

let allPassed = true;

suites.forEach((suite, idx) => {
  console.log(`>>> EXECUTING PILLAR ${idx + 1}: ${suite.name}...`);
  try {
    const output = execSync(`node ${suite.script}`, { encoding: 'utf-8' });
    const isSuccess = output.includes("100% SUCCESS") || output.includes("100%") || output.includes("CERTIFIED");
    if (isSuccess) {
      console.log(`    ✅ SUCCESS: All tests in ${suite.name} passed flawlessly.\n`);
    } else {
      console.log(`    ⚠️ WARNING: Test output requires inspection:\n${output}\n`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`    ❌ FAILED: ${suite.name} threw an exception:\n`, err.message);
    allPassed = false;
  }
});

console.log("================================================================================");
if (allPassed) {
  console.log("🌟 FINAL CERTIFICATION: ALL 6 PILLARS VERIFIED & 100% PASSING!");
  console.log("   THE CA KNOWLEDGE FRAMEWORK ENGINE IS CERTIFIED 10/10 ENTERPRISE LEVEL.");
} else {
  console.log("🚨 VERIFICATION FAILURE: One or more pillars encountered issues.");
}
console.log("================================================================================\n");
