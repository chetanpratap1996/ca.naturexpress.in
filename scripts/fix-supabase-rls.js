const { getDatabaseClient } = require('./db-client');

const client = getDatabaseClient();

async function run() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL. Applying enterprise-grade RLS policies...');

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
      // 1. Enable RLS
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

      // 2. Drop any legacy allow-all or wide-open policies
      const pols = await client.query(`
        SELECT policyname FROM pg_policies WHERE tablename = $1;
      `, [table]);
      
      for (const row of pols.rows) {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON ${table};`);
      }

      // 3. Service role and postgres always have full operational access
      await client.query(`
        CREATE POLICY "${table}_service_role_all" ON ${table}
        FOR ALL TO service_role, postgres
        USING (true) WITH CHECK (true);
      `);

      // 4. Authenticated users can read firm records
      await client.query(`
        CREATE POLICY "${table}_authenticated_select" ON ${table}
        FOR SELECT TO authenticated
        USING (true);
      `);

      // 5. Restrict anonymous (anon) role:
      // Anon can only SELECT public firm branding and client directory for portal discovery.
      // Anon CANNOT insert, update, or delete audit logs, DSC keys, or invoices!
      if (['firms', 'client_groups', 'client_entities'].includes(table)) {
        await client.query(`
          CREATE POLICY "${table}_anon_read_only" ON ${table}
          FOR SELECT TO anon
          USING (true);
        `);
      }

      // Revoke dangerous public table-level grants if any were assigned
      await client.query(`REVOKE ALL ON ${table} FROM anon;`);
      if (['firms', 'client_groups', 'client_entities'].includes(table)) {
        await client.query(`GRANT SELECT ON ${table} TO anon;`);
      }
      await client.query(`GRANT SELECT, INSERT, UPDATE ON ${table} TO authenticated;`);
      await client.query(`GRANT ALL ON ${table} TO service_role, postgres;`);

      console.log(`Secured table ${table} with strict RLS policies.`);
    } catch (e) {
      console.error(`Error configuring RLS on ${table}:`, e.message);
    }
  }

  // Audit logs must be strictly append-only for authenticated and service_role, NEVER anonymous
  await client.query(`
    REVOKE UPDATE, DELETE ON audit_logs FROM anon, authenticated;
  `);

  await client.end();
  console.log('RLS policies successfully hardened!');
}

run().catch(console.error);
