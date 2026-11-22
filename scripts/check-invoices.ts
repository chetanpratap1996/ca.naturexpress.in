import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), ".data", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

console.log("Checking all invoices against db.clients...");
let hasErrors = false;

db.invoices.forEach((inv: any) => {
  const client = db.clients.find((c: any) => c.id === inv.entityId);
  if (!client) {
    console.error(`❌ INVOICE ORPHAN: Invoice ${inv.invoiceNo} has entityId ${inv.entityId} not in db.clients!`);
    hasErrors = true;
  } else {
    console.log(`✅ [${inv.invoiceNo}] ₹${inv.amount.toLocaleString("en-IN")} (${inv.status}) -> ${client.name} (PAN: ${client.pan})`);
  }
});

if (!hasErrors) {
  console.log("All invoices 100% mapped to valid clients!");
}
