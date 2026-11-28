import pg from "pg";

// Return NUMERIC (e.g. consultation fees) as JS numbers instead of strings
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
// Return DATE columns as plain "YYYY-MM-DD" strings, never shifted by time zones
pg.types.setTypeParser(1082, (v) => v);

let pool = null;

/**
 * One shared connection pool. On Vercel each warm function instance keeps its own
 * small pool, so `max` stays low; use Supabase's pooler URL (port 6543) in production.
 */
export function getPool(connectionString) {
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX) || 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      // Supabase requires SSL. Set PGSSL=disable for a local database.
      ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
    });
    pool.on("error", (err) => console.error("Postgres pool error:", err.message));
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/** Runs fn inside a transaction, rolling back if it throws. */
export async function withTransaction(db, fn) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
