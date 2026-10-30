const { getDatabaseClient } = require('./db-client');
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../.data/db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

async function main() {
  const client = getDatabaseClient();
  await client.connect();

  console.log("Connected to Supabase Tokyo Pooler...");

  // Get GPA & Co. firm id
  let { rows: firms } = await client.query("SELECT id FROM firms LIMIT 1");
  let firmId = firms[0]?.id;

  if (!firmId) {
    const { rows: newFirm } = await client.query(
      `INSERT INTO firms (frn, firm_name, managing_partner, phone, email, upi_vpa)
       VALUES ('022998C', 'GPA & Co., Chartered Accountants', 'CA Gunjan Jain', '+91 98937 23639', 'brainsandtaxes@gmail.com', 'BRAINSANDTAXES@icici')
       RETURNING id`
    );
    firmId = newFirm[0].id;
  }

  console.log("Using Firm ID:", firmId);

  // Clear any leftover client_entities and client_groups before syncing real client
  await client.query("DELETE FROM client_entities");
  await client.query("DELETE FROM client_groups");

  for (const cl of db.clients) {
    const { rows: grpRows } = await client.query(
      `INSERT INTO client_groups (firm_id, group_name, promoter_name, promoter_phone, promoter_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        firmId,
        cl.groupName || `${cl.name} Group`,
        cl.primaryContact?.name || "Promoter",
        cl.primaryContact?.phone || "+91 98000 00000",
        cl.primaryContact?.email || "accounts@client.com",
      ]
    );

    const groupId = grpRows[0].id;

    await client.query(
      `INSERT INTO client_entities (firm_id, group_id, entity_name, type, pan, gstin, turnover_cr, incorporation_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        firmId,
        groupId,
        cl.name,
        cl.type,
        cl.pan,
        cl.gstin || null,
        cl.turnoverCr || 5.0,
        cl.incorporationYear || 2024,
      ]
    );

    console.log(`✓ Real Client Synced: "${cl.name}" (PAN: ${cl.pan})`);
  }

  const { rows: verifiedRows } = await client.query(
    "SELECT entity_name, pan, type, turnover_cr FROM client_entities"
  );
  console.log("Live Supabase client_entities count:", verifiedRows.length);
  console.log("Live Supabase records:", verifiedRows);

  await client.end();
}

main().catch(console.error);
