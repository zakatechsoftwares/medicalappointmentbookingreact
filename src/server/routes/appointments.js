import express from "express";
import { body, validationResult } from "express-validator";
import { requireAuth, sendValidationErrors } from "../middleware/auth.js";
import {
  dayOfWeek,
  isPast,
  isTooFarAhead,
  isValidDateString,
  MAX_DAYS_AHEAD,
} from "../utils/time.js";
import { isUuid, toPublicAppointment } from "../utils/mappers.js";

const PHONE_REGEX = /^(\+234\d{10}|0\d{10})$/;

// Appointment columns plus the doctor's name and speciality
const SELECT_WITH_DOCTOR = `
  SELECT a.*, d."title" AS "doctorTitle", d."firstName" AS "doctorFirstName",
         d."lastName" AS "doctorLastName", d."speciality" AS "doctorSpeciality"
  FROM booking.appointments a
  JOIN booking.doctors d ON d."id" = a."doctorId"`;

export default function appointmentsRouter(config, db) {
  const router = express.Router();
  router.use(requireAuth(config.jwtSecret));

  const findOwn = async (id, userId) => {
    const { rows } = await db.query(`${SELECT_WITH_DOCTOR} WHERE a."id" = $1 AND a."userId" = $2`, [
      id,
      userId,
    ]);
    return rows[0];
  };

  // GET /api/appointments — the logged-in user's appointments, soonest first
  router.get("/", async (req, res, next) => {
    try {
      const { rows } = await db.query(
        `${SELECT_WITH_DOCTOR} WHERE a."userId" = $1 ORDER BY a."date", a."timeSlot"`,
        [req.userId]
      );
      return res.json(rows.map(toPublicAppointment));
    } catch (error) {
      return next(error);
    }
  });

  // POST /api/appointments
  router.post(
    "/",
    [
      body("doctorId", "Choose a doctor").custom(isUuid),
      body("patientName", "Enter the patient's name").trim().isLength({ min: 2, max: 80 }),
      body("phoneNumber", "Enter a valid Nigerian phone number, e.g. 08012345678")
        .trim()
        .matches(PHONE_REGEX),
      body("date", "Pick a valid date").custom(isValidDateString),
      body("timeSlot", "Pick a time slot").matches(/^\d{2}:\d{2}$/),
      body("reason", "Keep the reason under 300 characters")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 300 }),
    ],
    async (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) return sendValidationErrors(res, result);

      const { doctorId, patientName, phoneNumber, date, timeSlot } = req.body;
      const reason = req.body.reason || "Consultation";
      try {
        const { rows: doctors } = await db.query(
          `SELECT * FROM booking.doctors WHERE "id" = $1 AND "isActive"`,
          [doctorId]
        );
        const doctor = doctors[0];
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

        const { rows: existing } = await db.query(
          `SELECT 1 FROM booking.appointments
           WHERE "userId" = $1 AND "doctorId" = $2 AND "status" IN ('PENDING', 'CONFIRMED')`,
          [req.userId, doctorId]
        );
        if (existing.length) {
          return res.status(409).json({
            error:
              "You already have an upcoming appointment with this doctor. Cancel it to book a new one",
          });
        }

        const { rows } = await db.query(
          `INSERT INTO booking.appointments
             ("userId", "doctorId", "patientName", "phoneNumber", "date", "timeSlot", "reason")
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING "id"`,
          [req.userId, doctorId, patientName, phoneNumber, date, timeSlot, reason]
        );
        return res.status(201).json(toPublicAppointment(await findOwn(rows[0].id, req.userId)));
      } catch (error) {
        // Unique index on active bookings: someone else just took this slot
        if (error.code === "23505") {
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
      if (!isUuid(req.params.id)) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      // Only the owner can cancel: the query includes the user id from the token
      const appointment = await findOwn(req.params.id, req.userId);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });
      if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
        return res
          .status(400)
          .json({ error: `This appointment is already ${appointment.status.toLowerCase()}` });
      }
      await db.query(
        `UPDATE booking.appointments SET "status" = 'CANCELLED', "updatedAt" = now()
         WHERE "id" = $1 AND "userId" = $2`,
        [req.params.id, req.userId]
      );
      return res.json(toPublicAppointment(await findOwn(req.params.id, req.userId)));
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
