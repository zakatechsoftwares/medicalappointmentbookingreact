import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

const JWT_SECRET = required("JWT_SECRET");
if (JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}

export const config = {
  port: Number(process.env.PORT) || 8181,
  // Postgres connection string. On Supabase use the pooler URL (port 6543).
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  // Video consultations are switched on only when a Daily.co API key is set
  dailyApiKey: process.env.DAILY_API_KEY || "",
  // Comma-separated list of allowed frontend origins, e.g. "http://localhost:5173,https://stayhealthy.vercel.app"
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  isProduction:
    process.env.NODE_ENV === "production" ||
    process.env.APP_ENV === "production" ||
    process.env.VERCEL_ENV === "production",
};
