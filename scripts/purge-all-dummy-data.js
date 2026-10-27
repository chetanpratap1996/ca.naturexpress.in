const { getDatabaseClient } = require('./db-client');

const client = getDatabaseClient();

async function purgeAllDummyData() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL. Purging all dummy data...');

  await client.query('DELETE FROM compliance_tasks;');
  await client.query('DELETE FROM documents;');
  await client.query('DELETE FROM invoices;');
  await client.query('DELETE FROM dsc_vault;');
  await client.query('DELETE FROM audit_logs;');
  await client.query('DELETE FROM client_entities;');
  await client.query('DELETE FROM client_groups;');

  // Log initial system creation event
  await client.query(`
    INSERT INTO audit_logs (id, firm_id, actor_name, actor_role, entity_name, action, details, category)
    SELECT 
      uuid_generate_v4(),
      id,
      'System Admin',
      'SYSTEM',
      'Brains & Taxes Platform',
      'System Initialized',
      'SaaS platform initialized clean for live production client onboarding with 0 dummy records.',
      'SECURITY'
    FROM firms LIMIT 1;
  `);

  console.log('Verifying table row counts:');
  const ent = await client.query('SELECT count(*) FROM client_entities;');
  const grp = await client.query('SELECT count(*) FROM client_groups;');
  const tsk = await client.query('SELECT count(*) FROM compliance_tasks;');
  const inv = await client.query('SELECT count(*) FROM invoices;');
  const dsc = await client.query('SELECT count(*) FROM dsc_vault;');
  const doc = await client.query('SELECT count(*) FROM documents;');

  console.log({
    client_entities: ent.rows[0].count,
    client_groups: grp.rows[0].count,
    compliance_tasks: tsk.rows[0].count,
    invoices: inv.rows[0].count,
    dsc_vault: dsc.rows[0].count,
    documents: doc.rows[0].count
  });

  await client.end();
  console.log('Purge completed successfully! All dummy records removed.');
}

purgeAllDummyData().catch(err => {
  console.error('Error during purge:', err);
  process.exit(1);
});
