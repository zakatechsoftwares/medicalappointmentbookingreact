import { config } from "./config.js";
import { getPool } from "./db.js";
import { createApp } from "./app.js";

const db = getPool(config.databaseUrl);
try {
  await db.query("SELECT 1");
  console.info("Connected to PostgreSQL");
} catch (error) {
  console.error("Can't reach PostgreSQL:", error.message);
  process.exit(1);
}

const app = createApp(config, db);
app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});
