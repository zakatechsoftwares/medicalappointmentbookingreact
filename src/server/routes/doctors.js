import express from "express";
import { dayOfWeek, isPast, isValidDateString } from "../utils/time.js";
import { isUuid, toPublicDoctor, toPublicReview } from "../utils/mappers.js";

export default function doctorsRouter(_config, db) {
  const router = express.Router();

  // GET /api/doctors?speciality=Dentist&search=ade
  router.get("/", async (req, res, next) => {
    try {
      const where = [`"isActive"`];
      const params = [];
      if (typeof req.query.speciality === "string" && req.query.speciality) {
        params.push(req.query.speciality);
        where.push(`lower("speciality") = lower($${params.length})`);
      }
      if (typeof req.query.search === "string" && req.query.search.trim()) {
        params.push(`%${req.query.search.trim().replace(/[%_\\]/g, "\\$&")}%`);
        const p = `$${params.length}`;
        where.push(`("firstName" ILIKE ${p} OR "lastName" ILIKE ${p} OR "speciality" ILIKE ${p})`);
      }
      const { rows } = await db.query(
        `SELECT * FROM booking.doctors WHERE ${where.join(" AND ")}
         ORDER BY "ratingAverage" DESC, "lastName", "firstName"`,
        params
      );
      return res.json(rows.map(toPublicDoctor));
    } catch (error) {
      return next(error);
    }
  });

  // GET /api/doctors/specialities
  router.get("/specialities", async (_req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT DISTINCT "speciality" FROM booking.doctors WHERE "isActive" ORDER BY 1`
      );
      return res.json(rows.map((r) => r.speciality));
    } catch (error) {
      return next(error);
    }
  });

  router.param("id", (_req, res, next, id) => {
    if (!isUuid(id)) return res.status(404).json({ error: "Doctor not found" });
    return next();
  });

  const findDoctor = async (id) => {
    const { rows } = await db.query(`SELECT * FROM booking.doctors WHERE "id" = $1 AND "isActive"`, [id]);
    return rows[0];
  };

  // GET /api/doctors/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const doctor = await findDoctor(req.params.id);
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });
      return res.json(toPublicDoctor(doctor));
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
      const doctor = await findDoctor(req.params.id);
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });

      const works = doctor.workingDays.includes(dayOfWeek(date));
      let taken = [];
      if (works) {
        const { rows } = await db.query(
          `SELECT "timeSlot" FROM booking.appointments
           WHERE "doctorId" = $1 AND "date" = $2 AND "status" IN ('PENDING', 'CONFIRMED')`,
          [doctor.id, date]
        );
        taken = rows.map((r) => r.timeSlot);
      }

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
      const { rows } = await db.query(
        `SELECT * FROM booking.reviews WHERE "doctorId" = $1 ORDER BY "createdAt" DESC`,
        [req.params.id]
      );
      return res.json(rows.map(toPublicReview));
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
