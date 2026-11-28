import express from "express";
import { body, validationResult } from "express-validator";
import { requireAdmin, requireAuth, sendValidationErrors } from "../middleware/auth.js";
import { isUuid, toClinicAppointment } from "../utils/mappers.js";
import { isValidDateString, nowInClinic, videoWindow } from "../utils/time.js";
import { videoJoinProblem } from "./appointments.js";

// Appointment + doctor + the account that booked it
const SELECT_FOR_DESK = `
  SELECT a.*, d."title" AS "doctorTitle", d."firstName" AS "doctorFirstName",
         d."lastName" AS "doctorLastName", d."speciality" AS "doctorSpeciality",
         u."firstName" AS "userFirstName", u."lastName" AS "userLastName", u."email" AS "userEmail"
  FROM booking.appointments a
  JOIN booking.doctors d ON d."id" = a."doctorId"
  JOIN booking.portal_users u ON u."id" = a."userId"`;

/**
 * The clinic desk: staff see the day's bookings, confirm or complete them,
 * and the doctor joins video consultations from here.
 */
export default function clinicRouter(config, db, daily) {
  const router = express.Router();
  router.use(requireAuth(config.jwtSecret), requireAdmin(db));

  const findOne = async (id) => {
    const { rows } = await db.query(`${SELECT_FOR_DESK} WHERE a."id" = $1`, [id]);
    return rows[0];
  };

  // GET /api/clinic/appointments?date=YYYY-MM-DD (default: today)
  router.get("/appointments", async (req, res, next) => {
    try {
      const date = typeof req.query.date === "string" ? req.query.date : nowInClinic().date;
      if (!isValidDateString(date)) return res.status(400).json({ error: "Pick a valid date" });
      const { rows } = await db.query(
        `${SELECT_FOR_DESK} WHERE a."date" = $1 ORDER BY a."timeSlot", d."lastName"`,
        [date]
      );
      return res.json({ date, appointments: rows.map(toClinicAppointment) });
    } catch (error) {
      return next(error);
    }
  });

  // PATCH /api/clinic/appointments/:id/status  { status: "confirmed" | "completed" | "cancelled" }
  router.patch(
    "/appointments/:id/status",
    [body("status", "Choose confirmed, completed or cancelled").isIn(["confirmed", "completed", "cancelled"])],
    async (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) return sendValidationErrors(res, result);
      try {
        if (!isUuid(req.params.id)) return res.status(404).json({ error: "Appointment not found" });
        const appt = await findOne(req.params.id);
        if (!appt) return res.status(404).json({ error: "Appointment not found" });

        const next = req.body.status.toUpperCase();
        const allowed = { PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["COMPLETED", "CANCELLED"] };
        if (!(allowed[appt.status] || []).includes(next)) {
          return res
            .status(400)
            .json({ error: `A ${appt.status.toLowerCase()} appointment can't be marked ${req.body.status}` });
        }
        await db.query(
          `UPDATE booking.appointments SET "status" = $2, "updatedAt" = now() WHERE "id" = $1`,
          [appt.id, next]
        );
        if (next === "CANCELLED" && appt.videoRoomName && daily) {
          daily.deleteRoom(appt.videoRoomName).catch((e) => console.error(e.message));
        }
        return res.json(toClinicAppointment(await findOne(appt.id)));
      } catch (error) {
        return next(error);
      }
    }
  );

  // POST /api/clinic/appointments/:id/join — the doctor's way in (owner token: can admit the patient)
  router.post("/appointments/:id/join", async (req, res, next) => {
    try {
      if (!isUuid(req.params.id)) return res.status(404).json({ error: "Appointment not found" });
      const appt = await findOne(req.params.id);
      if (!appt) return res.status(404).json({ error: "Appointment not found" });
      const problem = videoJoinProblem(appt, daily);
      if (problem) return res.status(problem.status).json({ error: problem.error, opensAt: problem.opensAt });

      const doctorName = `${appt.doctorTitle} ${appt.doctorFirstName} ${appt.doctorLastName}`;
      const token = await daily.createToken({
        roomName: appt.videoRoomName,
        userName: doctorName,
        userId: `doctor-${appt.doctorId}`,
        isOwner: true,
        expiresAt: videoWindow(appt.date, appt.timeSlot).closesAt,
      });
      return res.json({ roomUrl: appt.videoRoomUrl, token, patientName: appt.patientName });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
