import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (!pool) {
    const connectionString = 
      process.env.DATABASE_URL || 
      process.env.DIRECT_URL || 
      process.env.POSTGRES_URL || 
      process.env.POSTGRES_PRISMA_URL || 
      process.env.SUPABASE_DB_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL, DIRECT_URL, or POSTGRES_URL is required in server environment.');
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 8000,
      keepAlive: true,
    });

    // Prevent idle client network drops from crashing the Node.js server process
    pool.on("error", (err) => {
      console.error("[PG_POOL_IDLE_ERROR]", err?.message || err);
    });
  }
  return pool;
}
