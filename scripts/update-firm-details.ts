import fs from "fs";
import path from "path";

const filesToUpdate = [
  "src/lib/config/branding.ts",
  "src/lib/data/mockData.ts",
  "src/lib/data/sandboxData.ts",
  "src/lib/billing/msmeRecoveryEngine.ts",
  "src/lib/billing/tieredGatekeeper.ts",
  "src/lib/billing/pureAgentImprest.ts",
  "src/lib/server/db.ts",
  "src/lib/auth/session.ts",
  "src/lib/auth/serverAuth.ts",
  "src/lib/auth/enterpriseAuth.ts",
  "src/components/firm/schedule3/StatutorySignoffModal.tsx",
  "src/components/firm/ArticleWorkbench.tsx",
  ".data/db.json"
];

const OLD_FRN = "022998C";
const NEW_FRN = "024310C";

const OLD_MEMBERSHIP = "034912";
const NEW_MEMBERSHIP = "419751";

const OLD_FIRM_GSTIN = "23AABCU9821F1ZX";
const NEW_FIRM_GSTIN = "23AAICB0900D1ZI";

let totalReplacements = 0;

for (const relPath of filesToUpdate) {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, "utf8");
  let fileChanges = 0;

  if (content.includes(OLD_FRN)) {
    content = content.replaceAll(OLD_FRN, NEW_FRN);
    fileChanges++;
  }
  if (content.includes(OLD_MEMBERSHIP)) {
    content = content.replaceAll(OLD_MEMBERSHIP, NEW_MEMBERSHIP);
    fileChanges++;
  }
  // For branding.ts and db.json, update firm GSTIN
  if (relPath.includes("branding.ts") || relPath.includes("db.json")) {
    if (content.includes(OLD_FIRM_GSTIN)) {
      content = content.replaceAll(OLD_FIRM_GSTIN, NEW_FIRM_GSTIN);
      fileChanges++;
    }
  }

  if (fileChanges > 0) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`✅ Updated ${relPath}`);
    totalReplacements++;
  }
}

console.log(`\nSuccessfully updated real firm details across ${totalReplacements} key files.`);
console.log(` - ICAI FRN: ${NEW_FRN}`);
console.log(` - CA Gunjan Jain Membership: ${NEW_MEMBERSHIP}`);
console.log(` - Firm GSTIN: ${NEW_FIRM_GSTIN}`);
console.log(` - Signature asset: /signatures/ca_gunjan_jain_sign.png`);
