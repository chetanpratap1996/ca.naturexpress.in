import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (!pool) {
    const connectionString = 
      process.env.DATABASE_URL || 
      process.env.DIRECT_URL || 
      process.env.SUPABASE_DB_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL or DIRECT_URL is required in server environment.');
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}
