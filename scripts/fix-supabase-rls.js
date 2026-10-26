const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.uesllnkjrbpmynihvlvy:Chetan9759%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL (Tokyo)!');

  const tables = [
    'firms',
    'users',
    'client_groups',
    'client_entities',
    'compliance_tasks',
    'invoices',
    'documents',
    'dsc_vault',
    'audit_logs'
  ];

  for (const table of tables) {
    try {
      // Drop all existing restrictive policies
      const pols = await client.query(`
        SELECT policyname FROM pg_policies WHERE tablename = $1;
      `, [table]);
      
      for (const row of pols.rows) {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON ${table};`);
      }

      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      await client.query(`CREATE POLICY "${table}_allow_all" ON ${table} FOR ALL TO anon, authenticated, postgres, service_role USING (true) WITH CHECK (true);`);
      await client.query(`GRANT ALL ON ${table} TO anon, authenticated, postgres, service_role;`);
      console.log(`Granted full ALL policy on ${table}!`);
    } catch (e) {
      console.error(`Error on ${table}:`, e.message);
    }
  }

  await client.end();
  console.log('RLS policies updated successfully!');
}

run().catch(console.error);
