import express from "express";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import { requireAuth, sendValidationErrors } from "../middleware/auth.js";
import {
  dayOfWeek,
  isPast,
  isTooFarAhead,
  isValidDateString,
  MAX_DAYS_AHEAD,
} from "../utils/time.js";

const PHONE_REGEX = /^(\+234\d{10}|0\d{10})$/;

export default function appointmentsRouter(config) {
  const router = express.Router();
  router.use(requireAuth(config.jwtSecret));

  // GET /api/appointments — the logged-in user's appointments, soonest first
  router.get("/", async (req, res, next) => {
    try {
      const filter = { user: req.userId };
      if (typeof req.query.status === "string") filter.status = req.query.status;
      const list = await Appointment.find(filter)
        .populate("doctor")
        .sort({ date: 1, timeSlot: 1 });
      return res.json(list.map((a) => a.toPublic()));
    } catch (error) {
      return next(error);
    }
  });

  // POST /api/appointments
  router.post(
    "/",
    [
      body("doctorId", "Choose a doctor").custom((v) => mongoose.isValidObjectId(v)),
      body("patientName", "Enter the patient's name").trim().isLength({ min: 2, max: 80 }),
      body("phoneNumber", "Enter a valid Nigerian phone number, e.g. 08012345678")
        .trim()
        .matches(PHONE_REGEX),
      body("date", "Pick a valid date").custom(isValidDateString),
      body("timeSlot", "Pick a time slot").matches(/^\d{2}:\d{2}$/),
    ],
    async (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) return sendValidationErrors(res, result);

      const { doctorId, patientName, phoneNumber, date, timeSlot } = req.body;
      try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ error: "Doctor not found" });

        if (!doctor.timeSlots.includes(timeSlot)) {
          return res.status(400).json({ error: "That time slot isn't offered by this doctor" });
        }
        if (!doctor.workingDays.includes(dayOfWeek(date))) {
          return res.status(400).json({ error: "The doctor doesn't consult on that day" });
        }
        if (isPast(date, timeSlot)) {
          return res.status(400).json({ error: "That time has already passed" });
        }
        if (isTooFarAhead(date)) {
          return res
            .status(400)
            .json({ error: `You can book at most ${MAX_DAYS_AHEAD} days ahead` });
        }

        const alreadyWithDoctor = await Appointment.exists({
          user: req.userId,
          doctor: doctorId,
          status: "booked",
        });
        if (alreadyWithDoctor) {
          return res.status(409).json({
            error: "You already have an upcoming appointment with this doctor. Cancel it to book a new one",
          });
        }

        const appointment = await Appointment.create({
          user: req.userId,
          doctor: doctorId,
          patientName,
          phoneNumber,
          date,
          timeSlot,
        });
        await appointment.populate("doctor");
        return res.status(201).json(appointment.toPublic());
      } catch (error) {
        if (error.code === 11000) {
          return res
            .status(409)
            .json({ error: "Sorry, that slot was just taken. Please pick another time" });
        }
        return next(error);
      }
    }
  );

  // PATCH /api/appointments/:id/cancel
  router.patch("/:id/cancel", async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      // Only the owner can cancel: the query includes the user id from the token
      const appointment = await Appointment.findOne({ _id: req.params.id, user: req.userId });
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });
      if (appointment.status !== "booked") {
        return res.status(400).json({ error: `This appointment is already ${appointment.status}` });
      }
      appointment.status = "cancelled";
      await appointment.save();
      await appointment.populate("doctor");
      return res.json(appointment.toPublic());
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
