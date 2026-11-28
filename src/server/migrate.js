// Applies any SQL files in ./migrations that haven't run yet, in name order.
// Each file runs in its own transaction and is recorded in booking.schema_migrations.
// Usage: npm run migrate   (uses DIRECT_URL if set, otherwise DATABASE_URL)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { getPool, closePool } from "./db.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

export async function migrate(db) {
  await db.query(`CREATE SCHEMA IF NOT EXISTS booking`);
  await db.query(`CREATE TABLE IF NOT EXISTS booking.schema_migrations (
    name TEXT PRIMARY KEY,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  const { rows } = await db.query(`SELECT name FROM booking.schema_migrations`);
  const done = new Set(rows.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const applied = [];

  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO booking.schema_migrations (name) VALUES ($1)`, [file]);
      await client.query("COMMIT");
      applied.push(file);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${error.message}`);
    } finally {
      client.release();
    }
  }
  return applied;
}

if (process.argv[1] && process.argv[1].endsWith("migrate.js")) {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL (or DIRECT_URL) first.");
    process.exit(1);
  }
  try {
    const applied = await migrate(getPool(url));
    console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Database is up to date.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
