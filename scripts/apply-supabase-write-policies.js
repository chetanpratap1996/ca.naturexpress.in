const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.uesllnkjrbpmynihvlvy:Chetan9759%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function applyWritePolicies() {
  await client.connect();
  const sql = `
    DROP POLICY IF EXISTS anon_insert_tasks ON compliance_tasks;
    DROP POLICY IF EXISTS anon_update_tasks ON compliance_tasks;
    DROP POLICY IF EXISTS anon_insert_docs ON documents;
    DROP POLICY IF EXISTS anon_update_docs ON documents;
    DROP POLICY IF EXISTS anon_insert_invoices ON invoices;
    DROP POLICY IF EXISTS anon_update_invoices ON invoices;
    DROP POLICY IF EXISTS anon_insert_audit ON audit_logs;

    CREATE POLICY anon_insert_tasks ON compliance_tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
    CREATE POLICY anon_update_tasks ON compliance_tasks FOR UPDATE TO anon, authenticated USING (true);

    CREATE POLICY anon_insert_docs ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
    CREATE POLICY anon_update_docs ON documents FOR UPDATE TO anon, authenticated USING (true);

    CREATE POLICY anon_insert_invoices ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
    CREATE POLICY anon_update_invoices ON invoices FOR UPDATE TO anon, authenticated USING (true);

    CREATE POLICY anon_insert_audit ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
  `;
  await client.query(sql);
  console.log('Successfully enabled write policies for anon/authenticated roles on Supabase!');
  await client.end();
}

applyWritePolicies().catch(err => {
  console.error('Error applying write policies:', err);
  process.exit(1);
});
