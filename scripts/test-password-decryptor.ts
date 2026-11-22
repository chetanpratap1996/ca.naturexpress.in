import { generatePasswordCandidates } from "../src/lib/litigation/noticeDecryptor";

console.log("================================================================================");
console.log(" 🔑 TESTING ITD NOTICE PDF PASSWORD DECRYPTION PERMUTATION ENGINE");
console.log("================================================================================\n");

const pan = "AABCA8891D";
const dob = "15/08/1985";
const incorporationYear = "2018";
const custom = "SecretPass123";

const candidates = generatePasswordCandidates({
  pan,
  dob,
  incorporationYear,
  customPassword: custom
});

console.log("Generated Candidates:", candidates);

let passed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
}

// 1. CBDT standard: lowercase(PAN) + ddmmyyyy
assert(candidates.includes("aabca8891d15081985"), "Includes CBDT standard: lowercase(PAN) + ddmmyyyy");

// 2. Uppercase PAN standard
assert(candidates.includes("AABCA8891D15081985"), "Includes uppercase standard: PAN + ddmmyyyy");

// 3. Raw date format
assert(candidates.includes("15081985"), "Includes raw ddmmyyyy");

// 4. Incorporation year format for corporate entities
assert(candidates.includes("aabca8891d2018"), "Includes corporate format: lowercase(PAN) + incYear");

// 5. Custom password provided by CA / Client
assert(candidates[0] === "SecretPass123", "Custom user-provided password is prioritised first");

console.log(`\nAll ${passed} password permutation tests passed with 1000% precision!`);
