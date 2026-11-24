// Where the API lives.
// - Set VITE_API_URL in a .env file (e.g. VITE_API_URL=https://your-api.up.railway.app) when the
//   frontend and API are hosted separately.
// - In local development it defaults to the Express server on port 8181.
// - In production with no VITE_API_URL it uses the same origin (the Express server serves the build).
export const API_URL: string =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:8181" : "");
