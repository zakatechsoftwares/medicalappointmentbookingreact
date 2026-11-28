// Thin client for Daily.co's REST API (https://docs.daily.co/reference/rest-api).
// Only two things are needed: private rooms (one per video booking) and short-lived
// meeting tokens, so a room link alone is never enough to get into a consultation.

const API = "https://api.daily.co/v1";

export class DailyError extends Error {}

/**
 * @param {{ apiKey?: string, fetchImpl?: typeof fetch }} options
 * Returns null when no API key is set: video consultations are then switched off.
 */
export function createDailyClient({ apiKey, fetchImpl = globalThis.fetch } = {}) {
  if (!apiKey) return null;

  async function call(method, path, body) {
    let res;
    try {
      res = await fetchImpl(`${API}${path}`, {
        method,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      throw new DailyError(`Can't reach Daily: ${error.message}`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new DailyError(`Daily ${method} ${path} failed (${res.status}): ${data.info || data.error || ""}`);
    }
    return data;
  }

  return {
    /** Private room usable from `opensAt` until `closesAt` (Date objects). */
    async createRoom(name, opensAt, closesAt) {
      const room = await call("POST", "/rooms", {
        name,
        privacy: "private",
        properties: {
          nbf: Math.floor(opensAt.getTime() / 1000),
          exp: Math.floor(closesAt.getTime() / 1000),
          eject_at_room_exp: true,
          max_participants: 4, // patient, doctor, and room for a relative or interpreter
          enable_prejoin_ui: true, // camera and mic check before entering
          enable_knocking: true, // patient waits until the doctor lets them in
          enable_chat: true,
          enable_screenshare: true,
          lang: "en",
        },
      });
      return { name: room.name, url: room.url };
    },

    async deleteRoom(name) {
      try {
        await call("DELETE", `/rooms/${encodeURIComponent(name)}`);
      } catch (error) {
        // Already gone is fine; it expires on its own anyway
        if (!/\(404\)/.test(error.message)) throw error;
      }
    },

    /** Token for one person. The doctor's token is an owner token (can admit and remove people). */
    async createToken({ roomName, userName, userId, isOwner, expiresAt }) {
      const { token } = await call("POST", "/meeting-tokens", {
        properties: {
          room_name: roomName,
          user_name: userName,
          user_id: userId,
          is_owner: Boolean(isOwner),
          exp: Math.floor(expiresAt.getTime() / 1000),
          eject_at_token_exp: true,
          enable_recording: false,
        },
      });
      return token;
    },
  };
}
