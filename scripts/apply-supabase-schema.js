const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('@next/env').loadEnvConfig(process.cwd());

const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const migrationTable = 'public.app_schema_migrations';
const migrationLock = [2147482000, 147853];

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readMigrations() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => {
      if (!/^\d{8}_[a-z0-9_-]+\.sql$/i.test(file)) {
        throw new Error(`Migration filename must start with YYYYMMDD_: ${file}`);
      }
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      if (!/^\s*--[\s\S]*?\bBEGIN;[\s\S]*\bCOMMIT;\s*$/i.test(content)) {
        throw new Error(`Migration must contain its own BEGIN/COMMIT transaction: ${file}`);
      }
      return { version: file.slice(0, -4), file, content, checksum: checksum(content) };
    });
}

async function getRecordedMigration(client, version) {
  const result = await client.query(
    `SELECT checksum FROM ${migrationTable} WHERE version = $1`,
    [version],
  );
  return result.rows[0]?.checksum || null;
}

async function recordMigration(client, version, digest) {
  await client.query(
    `INSERT INTO ${migrationTable} (version, checksum) VALUES ($1, $2)`,
    [version, digest],
  );
}

async function run() {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const schemaDigest = checksum(schemaSql);
  const migrations = readMigrations();
  if (process.argv.includes('--check')) {
    if (!schemaSql.trim()) throw new Error('The baseline schema file is empty.');
    console.log(`Read-only preflight: baseline schema ${schemaDigest}`);
    for (const migration of migrations) {
      console.log(`${migration.file}  sha256:${migration.checksum}`);
    }
    console.log(`Validated ${migrations.length} transactional migration file(s). No database connection was opened.`);
    return;
  }

  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const caPath = process.env.DATABASE_SSL_CA_PATH;
  if (!connectionString) {
    throw new Error('Set DIRECT_URL or DATABASE_URL in the environment before applying the schema.');
  }
  if (!caPath) {
    throw new Error('Set DATABASE_SSL_CA_PATH to the Supabase database root certificate.');
  }
  const client = new Client({
    connectionString,
    ssl: { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true },
    connectionTimeoutMillis: 10000,
    application_name: 'ca-firm-schema-migrator',
  });
  let lockAcquired = false;

  try {
    await client.connect();
    await client.query('SELECT pg_advisory_lock($1, $2)', migrationLock);
    lockAcquired = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${migrationTable} (
        version TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE ${migrationTable} ENABLE ROW LEVEL SECURITY;
      REVOKE ALL ON ${migrationTable} FROM PUBLIC, anon, authenticated, service_role;
    `);

    const baseVersion = '00000000_schema';
    const recordedSchemaDigest = await getRecordedMigration(client, baseVersion);
    if (!recordedSchemaDigest) {
      console.log('Applying baseline schema...');
      await client.query('BEGIN');
      try {
        await client.query(schemaSql);
        await recordMigration(client, baseVersion, schemaDigest);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } else if (recordedSchemaDigest !== schemaDigest) {
      throw new Error('The applied base schema file has changed. Add a forward migration instead of rewriting schema.sql.');
    } else {
      console.log('Baseline schema already recorded; skipping.');
    }

    const applied = await client.query(`SELECT version, checksum FROM ${migrationTable} ORDER BY version`);
    const appliedByVersion = new Map(applied.rows.map((row) => [row.version, row.checksum]));
    const highestAppliedVersion = applied.rows.reduce(
      (highest, row) => row.version > highest ? row.version : highest,
      baseVersion,
    );

    for (const migration of migrations) {
      const priorChecksum = appliedByVersion.get(migration.version);
      if (priorChecksum) {
        if (priorChecksum !== migration.checksum) {
          throw new Error(`Applied migration ${migration.file} was edited. Add a new forward migration instead.`);
        }
        console.log(`Already applied: ${migration.file}`);
        continue;
      }
      if (migration.version < highestAppliedVersion) {
        throw new Error(`Migration ${migration.file} is out of order. Use a new, later migration version.`);
      }

      console.log(`Applying ${migration.file}...`);
      await client.query(migration.content);
      await recordMigration(client, migration.version, migration.checksum);
    }

    console.log('Schema and migrations are up to date.');
  } finally {
    if (lockAcquired) {
      await client.query('SELECT pg_advisory_unlock($1, $2)', migrationLock).catch(() => undefined);
    }
    await client.end().catch(() => undefined);
  }
}

run().catch((error) => {
  console.error('Migration error:', error.message);
  process.exit(1);
});
