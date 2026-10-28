const { getDatabaseClient } = require('./db-client');
const crypto = require('crypto');

// Enterprise Hash helper: Salted SHA-256 with 10,000 PBKDF2 iterations
function hashSecret(secret, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(secret, salt, 10000, 64, 'sha256').toString('hex');
  return { hash, salt };
}

async function runPhase1Migration() {
  const client = getDatabaseClient();
  await client.connect();
  console.log('--- Starting Phase 1 Enterprise Auth Migration ---');

  try {
    await client.query('BEGIN');

    // 1. Upgrade client_entities table with auth and indexing
    console.log('1. Upgrading client_entities table...');
    await client.query(`
      ALTER TABLE client_entities
      ADD COLUMN IF NOT EXISTS auth_pin VARCHAR(10) DEFAULT '0000',
      ADD COLUMN IF NOT EXISTS auth_pin_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS auth_pin_salt VARCHAR(64),
      ADD COLUMN IF NOT EXISTS is_pin_customized BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS primary_contact_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS primary_contact_designation VARCHAR(100);
    `);

    // High performance indexing for sub-millisecond lookup at scale
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_client_entities_pan ON client_entities(pan);
      CREATE INDEX IF NOT EXISTS idx_client_entities_phone ON client_entities(primary_contact_phone);
      CREATE INDEX IF NOT EXISTS idx_client_entities_firm_id ON client_entities(firm_id);
    `);

    // 2. Upgrade users table (CA Practice Staff)
    console.log('2. Upgrading users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS password_salt VARCHAR(64),
      ADD COLUMN IF NOT EXISTS temp_password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_firm_role ON users(firm_id, role);
    `);

    // 3. Create enterprise auth audit log table
    console.log('3. Creating auth_audit_log table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier VARCHAR(255) NOT NULL,
        role VARCHAR(50),
        status VARCHAR(50) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_auth_audit_id ON auth_audit_log(identifier, created_at DESC);
    `);

    // 4. Populate primary contacts and default PINs from client_groups
    console.log('4. Syncing client contacts and initial 4-digit PINs (Last 4 digits of phone)...');
    const { rows: entities } = await client.query(`
      SELECT ce.id, ce.entity_name, ce.pan, cg.promoter_name, cg.promoter_phone, cg.promoter_email
      FROM client_entities ce
      LEFT JOIN client_groups cg ON ce.group_id = cg.id
    `);

    for (const ent of entities) {
      const rawPhone = ent.promoter_phone || '8077170715';
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const defaultPin = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '0715';
      const { hash, salt } = hashSecret(defaultPin);

      await client.query(`
        UPDATE client_entities
        SET 
          primary_contact_name = COALESCE(primary_contact_name, $1),
          primary_contact_phone = COALESCE(primary_contact_phone, $2),
          primary_contact_email = COALESCE(primary_contact_email, $3),
          primary_contact_designation = COALESCE(primary_contact_designation, 'Director / Authorized Signatory'),
          auth_pin = $4,
          auth_pin_hash = $5,
          auth_pin_salt = $6
        WHERE id = $7
      `, [
        ent.promoter_name || 'Chetan Pratap Singh',
        rawPhone,
        ent.promoter_email || 'chetanpratap1996@gmail.com',
        defaultPin,
        hash,
        salt,
        ent.id
      ]);

      console.log(`  ✓ Client "${ent.entity_name}": Phone=${rawPhone}, Default PIN=${defaultPin}`);
    }

    // 5. Seed / Update CA Staff credentials
    console.log('5. Setting up CA Practice Staff passwords...');
    // Partner (CA Gunjan Jain)
    const partnerCreds = hashSecret('Partner@2026');
    await client.query(`
      UPDATE users
      SET 
        password_hash = $1,
        password_salt = $2,
        temp_password = 'Partner@2026'
      WHERE LOWER(email) = 'brainsandtaxes@gmail.com' OR role = 'PARTNER'
    `, [partnerCreds.hash, partnerCreds.salt]);

    // Also ensure partner@brainsandtaxes.com is an alias or primary
    await client.query(`
      INSERT INTO users (firm_id, email, phone, full_name, role, membership_number, password_hash, password_salt, temp_password, is_active)
      SELECT id, 'partner@brainsandtaxes.com', '+91 98937 23639', 'CA Gunjan Jain', 'PARTNER', '022998C', $1, $2, 'Partner@2026', true
      FROM firms LIMIT 1
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, password_salt = $2, temp_password = 'Partner@2026';
    `, [partnerCreds.hash, partnerCreds.salt]);

    // Article Trainee (Kriti Jain)
    const articleCreds = hashSecret('Article@2026');
    await client.query(`
      UPDATE users
      SET 
        password_hash = $1,
        password_salt = $2,
        temp_password = 'Article@2026'
      WHERE LOWER(email) = 'audit.trainee@brainsandtaxes.com' OR role = 'ARTICLE_TRAINEE'
    `, [articleCreds.hash, articleCreds.salt]);

    // Ensure RLS permissions allow select for anonymous login verification
    await client.query(`
      GRANT SELECT ON client_entities TO anon, authenticated;
      GRANT SELECT ON users TO anon, authenticated;
      GRANT INSERT ON auth_audit_log TO anon, authenticated;
    `);

    await client.query('COMMIT');
    console.log('--- Phase 1 Migration Completed Successfully! ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err);
    throw err;
  } finally {
    await client.end();
  }
}

runPhase1Migration().catch(console.error);
