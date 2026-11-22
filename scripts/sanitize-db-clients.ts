import fs from "fs";
import path from "path";
import { SANDBOX_CLIENTS } from "../src/lib/data/sandboxData";

const dbPath = path.join(process.cwd(), ".data", "db.json");
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  // Find Pratwi
  const existingPratwi = db.clients?.find((c: any) => c.id === "CLI-PRATWI-01");

  // Clean real clients
  const cleanedClients = SANDBOX_CLIENTS.map((c: any) => ({ ...c }));
  if (existingPratwi && !cleanedClients.some((c: any) => c.id === "CLI-PRATWI-01")) {
    cleanedClients.push(existingPratwi);
  }

  db.clients = cleanedClients;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  console.log("Successfully sanitized db.clients. Total pristine clients:", db.clients.length);
  db.clients.forEach((c: any) => {
    console.log(` - [${c.id}] ${c.name} (PAN: ${c.pan}, GSTIN: ${c.gstin})`);
  });
} else {
  console.log("db.json not found at", dbPath);
}
