import express from "express";
import { body, validationResult } from "express-validator";
import { requireAuth, sendValidationErrors } from "../middleware/auth.js";
import {
  dayOfWeek,
  isPast,
  isTooFarAhead,
  isValidDateString,
  MAX_DAYS_AHEAD,
  videoWindow,
} from "../utils/time.js";
import { isUuid, toPublicAppointment } from "../utils/mappers.js";

const PHONE_REGEX = /^(\+234\d{10}|0\d{10})$/;

// Appointment columns plus the doctor's name and speciality
const SELECT_WITH_DOCTOR = `
  SELECT a.*, d."title" AS "doctorTitle", d."firstName" AS "doctorFirstName",
         d."lastName" AS "doctorLastName", d."speciality" AS "doctorSpeciality"
  FROM booking.appointments a
  JOIN booking.doctors d ON d."id" = a."doctorId"`;

export default function appointmentsRouter(config, db, daily) {
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
      body("visitType", "Choose in person or video")
        .optional({ values: "falsy" })
        .isIn(["in_person", "video"]),
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
      const isVideo = req.body.visitType === "video";
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
        if (isVideo && !daily) {
          return res.status(400).json({ error: "Video consultations aren't available yet" });
        }
        if (isVideo && !doctor.offersVideo) {
          return res.status(400).json({ error: "This doctor only sees patients in person" });
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
             ("userId", "doctorId", "patientName", "phoneNumber", "date", "timeSlot", "reason", "visitType")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING "id"`,
          [
            req.userId,
            doctorId,
            patientName,
            phoneNumber,
            date,
            timeSlot,
            reason,
            isVideo ? "VIDEO" : "IN_PERSON",
          ]
        );
        const id = rows[0].id;

        if (isVideo) {
          // The slot is held first (the unique index decides races), then the room is made.
          // If Daily fails, the booking is removed so the slot isn't left half-booked.
          try {
            const { opensAt, closesAt } = videoWindow(date, timeSlot);
            const room = await daily.createRoom(`sh-${id.replace(/-/g, "")}`, opensAt, closesAt);
            await db.query(
              `UPDATE booking.appointments SET "videoRoomName" = $2, "videoRoomUrl" = $3 WHERE "id" = $1`,
              [id, room.name, room.url]
            );
          } catch (error) {
            await db.query(`DELETE FROM booking.appointments WHERE "id" = $1`, [id]);
            console.error(error);
            return res.status(502).json({
              error: "We couldn't set up the video room. Please try again, or book in person",
            });
          }
        }
        return res.status(201).json(toPublicAppointment(await findOwn(id, req.userId)));
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
      // Close the video room too, so the old link can't be used
      if (appointment.videoRoomName && daily) {
        daily.deleteRoom(appointment.videoRoomName).catch((e) => console.error(e.message));
      }
      return res.json(toPublicAppointment(await findOwn(req.params.id, req.userId)));
    } catch (error) {
      return next(error);
    }
  });

  // POST /api/appointments/:id/join — get into your own video consultation
  // Body: { consent: true } the first time, to record the patient's agreement.
  router.post("/:id/join", async (req, res, next) => {
    try {
      if (!isUuid(req.params.id)) return res.status(404).json({ error: "Appointment not found" });
      const appointment = await findOwn(req.params.id, req.userId);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });
      const problem = videoJoinProblem(appointment, daily);
      if (problem) return res.status(problem.status).json({ error: problem.error, opensAt: problem.opensAt });

      if (!appointment.videoConsentAt) {
        if (req.body?.consent !== true) {
          return res.status(428).json({ error: "Please agree to a video consultation first", needsConsent: true });
        }
        await db.query(`UPDATE booking.appointments SET "videoConsentAt" = now() WHERE "id" = $1`, [
          appointment.id,
        ]);
      }

      const { closesAt } = videoWindow(appointment.date, appointment.timeSlot);
      const token = await daily.createToken({
        roomName: appointment.videoRoomName,
        userName: appointment.patientName,
        userId: req.userId,
        isOwner: false,
        expiresAt: closesAt,
      });
      return res.json({ roomUrl: appointment.videoRoomUrl, token, doctorName: doctorName(appointment) });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

const doctorName = (a) => `${a.doctorTitle} ${a.doctorFirstName} ${a.doctorLastName}`.trim();

/** Why someone can't join this video call right now, or null if they can. Shared with the clinic desk. */
export function videoJoinProblem(appointment, daily, now = new Date()) {
  if (!daily) return { status: 400, error: "Video consultations aren't available" };
  if (appointment.visitType !== "VIDEO" || !appointment.videoRoomName) {
    return { status: 400, error: "This is an in-person appointment" };
  }
  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    return { status: 400, error: `This appointment is ${appointment.status.toLowerCase()}` };
  }
  const { opensAt, closesAt } = videoWindow(appointment.date, appointment.timeSlot);
  if (now < opensAt) {
    return {
      status: 425,
      error: "The video room opens 10 minutes before your appointment",
      opensAt: opensAt.toISOString(),
    };
  }
  if (now > closesAt) return { status: 410, error: "This video consultation has ended" };
  return null;
}
