// Vercel serverless entry point: runs the Express API.
// api/index.js re-exports this; vercel.json sends every /api/* request there.
import { config } from "./config.js";
import { getPool } from "./db.js";
import { createApp } from "./app.js";

// Created once per warm function instance and reused across requests.
// Connections are opened lazily, so a database outage returns errors, not a crash.
const app = createApp(config, getPool(config.databaseUrl));

export default function handler(req, res) {
  return app(req, res);
}
