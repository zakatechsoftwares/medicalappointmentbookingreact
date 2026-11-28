import jwt from "jsonwebtoken";
import { isUuid } from "../utils/mappers.js";

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * The user id is taken from the signed token, never from anything the client sends.
 */
export function requireAuth(jwtSecret) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Please log in to continue" });
    }
    try {
      const payload = jwt.verify(token, jwtSecret);
      if (!isUuid(payload?.user?.id)) throw new Error("bad token payload");
      req.userId = payload.user.id;
      return next();
    } catch {
      return res
        .status(401)
        .json({ error: "Your session has expired. Please log in again" });
    }
  };
}

/** Lets only clinic staff (role ADMIN) through. Checks the database, not just the token. */
export function requireAdmin(db) {
  return async (req, res, next) => {
    try {
      const { rows } = await db.query(`SELECT "role" FROM booking.portal_users WHERE "id" = $1`, [
        req.userId,
      ]);
      if (rows[0]?.role !== "ADMIN") {
        return res.status(403).json({ error: "Only clinic staff can do this" });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

/** Sends express-validator errors in one consistent shape. */
export function sendValidationErrors(res, result) {
  return res.status(400).json({
    error: result.array()[0].msg,
    errors: result.array(),
  });
}
