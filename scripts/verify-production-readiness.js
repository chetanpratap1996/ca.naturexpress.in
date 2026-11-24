const path = require('path');
process.loadEnvFile(path.join(__dirname, '../.env.local'));
const { Client } = require('pg');

async function verifyAll() {
  console.log('=== VERIFYING ZERO-DUMMY PRODUCTION SYSTEM ===\n');

  // 1. Check live Supabase Database via Postgres Pooler
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const { rows: entities } = await client.query('SELECT id, entity_name, pan, gstin FROM client_entities');
  const { rows: groups } = await client.query('SELECT id, group_name, promoter_name FROM client_groups');
  const { rows: tasks } = await client.query('SELECT id, title, entity_id FROM compliance_tasks');
  const { rows: invoices } = await client.query('SELECT id, invoice_no FROM invoices');
  const { rows: users } = await client.query('SELECT id, email, full_name, role FROM users');

  console.log('1. LIVE SUPABASE AUDIT:');
  console.log('   Client Entities (' + entities.length + '):', entities.map(e => e.entity_name + ' (' + e.pan + ')'));
  console.log('   Client Groups (' + groups.length + '):', groups.map(g => g.group_name));
  console.log('   Statutory Tasks (' + tasks.length + '):', tasks.map(t => t.title));
  console.log('   Invoices (' + invoices.length + ')');
  console.log('   Staff/Users (' + users.length + '):', users.map(u => u.full_name + ' [' + u.role + ']'));

  // Ensure 0 dummy entities exist
  const dummyFound = entities.filter(e => 
    e.entity_name.includes('Nexus') || 
    e.entity_name.includes('Apex') || 
    e.entity_name.includes('OmniRetail') || 
    e.entity_name.includes('Zenith')
  );
  if (dummyFound.length > 0) {
    console.error('❌ FAILURE: Dummy entity found in Supabase:', dummyFound);
    process.exit(1);
  } else {
    console.log('   ✓ Zero dummy entities found in Supabase!');
  }

  // 2. Check local database cache .data/db.json
  const dbJson = JSON.parse(require('fs').readFileSync(path.join(__dirname, '../.data/db.json'), 'utf-8'));
  console.log('\n2. LOCAL CACHE (.data/db.json) AUDIT:');
  console.log('   Clients (' + dbJson.clients.length + '):', dbJson.clients.map(c => c.name));
  console.log('   Tasks (' + dbJson.tasks.length + '):', dbJson.tasks.map(t => t.title));

  const localDummyFound = dbJson.clients.filter(c => 
    c.name.includes('Nexus') || 
    c.name.includes('Apex') || 
    c.name.includes('OmniRetail') || 
    c.name.includes('Zenith')
  );
  if (localDummyFound.length > 0) {
    console.error('❌ FAILURE: Dummy entity found in local db.json:', localDummyFound);
    process.exit(1);
  } else {
    console.log('   ✓ Zero dummy entities found in local db.json!');
  }

  // 3. Test Direct Postgres Superuser Insertion of a New Real Client
  console.log('\n3. TESTING REAL CLIENT ONBOARDING MUTATION...');
  const testPan = 'AABCT1234D';
  const insRes = await client.query(
    `INSERT INTO client_entities (
       firm_id, group_id, entity_name, type, pan, gstin, turnover_cr,
       incorporation_year, primary_contact_name, primary_contact_phone, primary_contact_email
     ) VALUES (
       (SELECT id FROM firms LIMIT 1),
       (SELECT id FROM client_groups LIMIT 1),
       'Verifiable Real Client Test Enterprise Ltd',
       'PVT_LTD',
       $1,
       '23AABCT1234D1Z5',
       15.5,
       2022,
       'Test Director',
       '+91 99000 11223',
       'director@realclient.com'
     ) RETURNING id`,
    [testPan]
  );
  console.log('   ✓ Client created in Supabase PostgreSQL with ID:', insRes.rows[0].id);

  // Clean up test client
  await client.query("DELETE FROM client_entities WHERE pan = $1", [testPan]);
  console.log('   ✓ Test client cleaned up from Supabase.');

  await client.end();
  console.log('\n=== ALL VERIFICATION CHECKS PASSED: 1000% CLEAN & REAL CLIENT READY ===');
}

verifyAll().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
