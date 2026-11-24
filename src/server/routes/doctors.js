import express from "express";
import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import Review from "../models/Review.js";
import { dayOfWeek, isPast, isValidDateString } from "../utils/time.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function doctorsRouter() {
  const router = express.Router();

  // GET /api/doctors?speciality=Dentist&search=ade
  router.get("/", async (req, res, next) => {
    try {
      const filter = {};
      if (typeof req.query.speciality === "string" && req.query.speciality) {
        filter.speciality = new RegExp(`^${escapeRegex(req.query.speciality)}$`, "i");
      }
      if (typeof req.query.search === "string" && req.query.search.trim()) {
        const term = new RegExp(escapeRegex(req.query.search.trim()), "i");
        filter.$or = [{ name: term }, { speciality: term }];
      }
      const doctors = await Doctor.find(filter).sort({ ratingAverage: -1, name: 1 });
      return res.json(doctors.map((d) => d.toPublic()));
    } catch (error) {
      return next(error);
    }
  });

  // GET /api/doctors/specialities
  router.get("/specialities", async (_req, res, next) => {
    try {
      const list = await Doctor.distinct("speciality");
      return res.json(list.sort());
    } catch (error) {
      return next(error);
    }
  });

  router.param("id", (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    return next();
  });

  // GET /api/doctors/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });
      return res.json(doctor.toPublic());
    } catch (error) {
      return next(error);
    }
  });

  // GET /api/doctors/:id/slots?date=YYYY-MM-DD — which time slots are free that day
  router.get("/:id/slots", async (req, res, next) => {
    try {
      const { date } = req.query;
      if (typeof date !== "string" || !isValidDateString(date)) {
        return res.status(400).json({ error: "Pick a valid date" });
      }
      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });

      const works = doctor.workingDays.includes(dayOfWeek(date));
      const taken = works
        ? await Appointment.find({ doctor: doctor.id, date, status: "booked" }).distinct("timeSlot")
        : [];

      const slots = doctor.timeSlots.map((time) => ({
        time,
        available: works && !taken.includes(time) && !isPast(date, time),
      }));
      return res.json({ date, worksThisDay: works, slots });
    } catch (error) {
      return next(error);
    }
  });

  // GET /api/doctors/:id/reviews
  router.get("/:id/reviews", async (req, res, next) => {
    try {
      const reviews = await Review.find({ doctor: req.params.id }).sort({ createdAt: -1 });
      return res.json(reviews.map((r) => r.toPublic()));
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
