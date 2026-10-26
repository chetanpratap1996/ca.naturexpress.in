const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.uesllnkjrbpmynihvlvy:Chetan9759%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function applyPolicies() {
  await client.connect();
  const sql = `
    DROP POLICY IF EXISTS anon_read_firms ON firms;
    DROP POLICY IF EXISTS anon_read_groups ON client_groups;
    DROP POLICY IF EXISTS anon_read_entities ON client_entities;
    DROP POLICY IF EXISTS anon_read_tasks ON compliance_tasks;
    DROP POLICY IF EXISTS anon_read_invoices ON invoices;
    DROP POLICY IF EXISTS anon_read_dsc ON dsc_vault;
    DROP POLICY IF EXISTS anon_read_docs ON documents;
    DROP POLICY IF EXISTS anon_read_audit ON audit_logs;

    CREATE POLICY anon_read_firms ON firms FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY anon_read_groups ON client_groups FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY anon_read_entities ON client_entities FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY anon_read_tasks ON compliance_tasks FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY anon_read_invoices ON invoices FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY anon_read_dsc ON dsc_vault FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY anon_read_docs ON documents FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY anon_read_audit ON audit_logs FOR SELECT TO anon, authenticated USING (true);
  `;
  await client.query(sql);
  console.log('Successfully enabled read policies for anon/authenticated roles on Supabase!');
  await client.end();
}

applyPolicies().catch(err => {
  console.error('Error applying policies:', err);
  process.exit(1);
});
