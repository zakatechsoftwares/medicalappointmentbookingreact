import express from "express";
import { body, validationResult } from "express-validator";
import { requireAuth, sendValidationErrors } from "../middleware/auth.js";
import { withTransaction } from "../db.js";
import { fullName, isUuid, toPublicReview } from "../utils/mappers.js";

export default function reviewsRouter(config, db) {
  const router = express.Router();
  const auth = requireAuth(config.jwtSecret);

  // GET /api/reviews/mine — reviews written by the logged-in user
  router.get("/mine", auth, async (req, res, next) => {
    try {
      const { rows } = await db.query(`SELECT * FROM booking.reviews WHERE "userId" = $1`, [
        req.userId,
      ]);
      return res.json(rows.map(toPublicReview));
    } catch (error) {
      return next(error);
    }
  });

  // POST /api/reviews — add or update your review of a doctor
  router.post(
    "/",
    auth,
    [
      body("doctorId", "Choose a doctor").custom(isUuid),
      body("rating", "Give a rating from 1 to 5 stars").isInt({ min: 1, max: 5 }).toInt(),
      body("comment", "Write a short review (up to 1000 characters)")
        .trim()
        .isLength({ min: 3, max: 1000 }),
    ],
    async (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) return sendValidationErrors(res, result);

      try {
        const review = await withTransaction(db, async (client) => {
          const { rows: users } = await client.query(
            `SELECT * FROM booking.portal_users WHERE "id" = $1`,
            [req.userId]
          );
          if (!users[0]) return { status: 401, error: "Account no longer exists" };
          const { rows: doctors } = await client.query(
            `SELECT "id" FROM booking.doctors WHERE "id" = $1 FOR UPDATE`,
            [req.body.doctorId]
          );
          if (!doctors[0]) return { status: 404, error: "Doctor not found" };

          const { rows } = await client.query(
            `INSERT INTO booking.reviews ("userId", "doctorId", "authorName", "rating", "comment")
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT ("userId", "doctorId") DO UPDATE
               SET "rating" = EXCLUDED."rating", "comment" = EXCLUDED."comment",
                   "authorName" = EXCLUDED."authorName", "updatedAt" = now()
             RETURNING *`,
            [req.userId, req.body.doctorId, fullName(users[0]), req.body.rating, req.body.comment]
          );

          // Keep the doctor's average rating in step, in the same transaction
          await client.query(
            `UPDATE booking.doctors d
             SET "ratingAverage" = s.avg, "ratingCount" = s.count, "updatedAt" = now()
             FROM (SELECT COALESCE(AVG("rating"), 0) AS avg, COUNT(*)::int AS count
                   FROM booking.reviews WHERE "doctorId" = $1) s
             WHERE d."id" = $1`,
            [req.body.doctorId]
          );
          return { review: rows[0] };
        });

        if (review.error) return res.status(review.status).json({ error: review.error });
        return res.status(201).json(toPublicReview(review.review));
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
