// Vercel serverless entry point: runs the Express API from src/server.
// api/index.js re-exports this; vercel.json sends every /api/* request there.
import mongoose from "mongoose";
import { config } from "./config.js";
import { createApp } from "./app.js";

const app = createApp(config);

// Reuse one database connection across requests on the same warm instance
let connecting = null;
function ensureDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(config.mongoUri, { dbName: config.dbName, serverSelectionTimeoutMS: 8000 })
      .catch((error) => {
        connecting = null;
        throw error;
      });
  }
  return connecting;
}

export default async function handler(req, res) {
  try {
    await ensureDb();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Service temporarily unavailable. Please try again" }));
    return;
  }
  return app(req, res);
}
