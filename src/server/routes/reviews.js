import express from "express";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";
import Review from "../models/Review.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import { requireAuth, sendValidationErrors } from "../middleware/auth.js";

async function refreshDoctorRating(doctorId) {
  const [stats] = await Review.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Doctor.findByIdAndUpdate(doctorId, {
    ratingAverage: stats ? stats.avg : 0,
    ratingCount: stats ? stats.count : 0,
  });
}

export default function reviewsRouter(config) {
  const router = express.Router();
  const auth = requireAuth(config.jwtSecret);

  // GET /api/reviews/mine — reviews written by the logged-in user
  router.get("/mine", auth, async (req, res, next) => {
    try {
      const reviews = await Review.find({ user: req.userId });
      return res.json(reviews.map((r) => r.toPublic()));
    } catch (error) {
      return next(error);
    }
  });

  // POST /api/reviews — add or update your review of a doctor
  router.post(
    "/",
    auth,
    [
      body("doctorId", "Choose a doctor").custom((v) => mongoose.isValidObjectId(v)),
      body("rating", "Give a rating from 1 to 5 stars").isInt({ min: 1, max: 5 }).toInt(),
      body("comment", "Write a short review (up to 1000 characters)")
        .trim()
        .isLength({ min: 3, max: 1000 }),
    ],
    async (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) return sendValidationErrors(res, result);

      try {
        const doctor = await Doctor.findById(req.body.doctorId);
        if (!doctor) return res.status(404).json({ error: "Doctor not found" });
        const user = await User.findById(req.userId);
        if (!user) return res.status(401).json({ error: "Account no longer exists" });

        const review = await Review.findOneAndUpdate(
          { user: req.userId, doctor: doctor.id },
          {
            authorName: user.name,
            rating: req.body.rating,
            comment: req.body.comment,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        await refreshDoctorRating(doctor.id);
        return res.status(201).json(review.toPublic());
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
