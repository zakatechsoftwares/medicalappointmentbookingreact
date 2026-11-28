import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import doctorsRouter from "./routes/doctors.js";
import appointmentsRouter from "./routes/appointments.js";
import reviewsRouter from "./routes/reviews.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** db: a pg Pool (or anything with .query and .connect) */
export function createApp(config, db) {
  const app = express();

  app.disable("x-powered-by");
  // Behind Vercel/Railway proxies: needed so rate limiting sees the real client IP
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server requests (no Origin header) and listed frontends
        if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", async (_req, res) => {
    try {
      await db.query("SELECT 1");
      res.json({ ok: true, database: "up" });
    } catch {
      res.status(503).json({ ok: false, database: "down" });
    }
  });
  app.use("/api/auth", authRouter(config, db));
  app.use("/api/doctors", doctorsRouter(config, db));
  app.use("/api/appointments", appointmentsRouter(config, db));
  app.use("/api/reviews", reviewsRouter(config, db));
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  // Serve the built React app (npm run build in the project root) with SPA fallback
  const distDir = path.join(__dirname, "../../dist");
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
  }

  // Last-resort error handler: log details, never leak them to the client
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again" });
  });

  return app;
}
