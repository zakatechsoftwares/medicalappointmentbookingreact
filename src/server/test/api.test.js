// API tests. The "date and slot rules" and "without a database" tests always run.
// The full booking flow runs against a real PostgreSQL when TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://postgres@localhost:5432/stayhealthy_test PGSSL=disable npm test
// It wipes and recreates the "booking" schema in that database, so never point it at production.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";
import jwt from "jsonwebtoken";
import pg from "pg";
import { createApp } from "../app.js";
import { getPool, closePool } from "../db.js";
import { migrate } from "../migrate.js";
import { seedDoctors } from "../seed.js";
import { isPast, isValidDateString, dayOfWeek, nowInClinic } from "../utils/time.js";

const config = {
  jwtSecret: "test-secret-that-is-definitely-longer-than-32-chars",
  jwtExpiresIn: "1h",
  clientOrigins: ["http://localhost:5173"],
  isProduction: false,
};
const signFor = (id) => jwt.sign({ user: { id } }, config.jwtSecret);

describe("without a database", () => {
  // A pool pointing nowhere: these requests must be rejected before any query runs
  const deadDb = new pg.Pool({ connectionString: "postgres://x@127.0.0.1:1/x", connectionTimeoutMillis: 500 });
  const app = createApp(config, deadDb);
  const token = signFor(randomUUID());
  after(() => deadDb.end());

  test("profile requires a token", async () => {
    assert.equal((await request(app).get("/api/auth/me")).status, 401);
  });

  test("the old email-header trick no longer works", async () => {
    const res = await request(app).get("/api/auth/me").set("email", "someone@example.com");
    assert.equal(res.status, 401);
  });

  test("forged, expired and malformed tokens are rejected", async () => {
    const forged = jwt.sign({ user: { id: randomUUID() } }, "some-other-secret");
    const expired = jwt.sign({ user: { id: randomUUID() } }, config.jwtSecret, { expiresIn: -10 });
    const oldMongoStyle = signFor("660d1ab3c424240288e6743e");
    for (const t of [forged, expired, oldMongoStyle]) {
      const res = await request(app).get("/api/appointments").set("Authorization", `Bearer ${t}`);
      assert.equal(res.status, 401);
    }
  });

  test("appointments and writing reviews require a token", async () => {
    assert.equal((await request(app).get("/api/appointments")).status, 401);
    assert.equal((await request(app).post("/api/appointments").send({})).status, 401);
    assert.equal((await request(app).post("/api/reviews").send({})).status, 401);
  });

  test("register rejects short passwords and bad phone numbers", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.com", name: "Abdul", phone: "123", password: "short" });
    assert.equal(res.status, 400);
  });

  test("booking rejects a malformed date", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        doctorId: randomUUID(),
        patientName: "Abdul",
        phoneNumber: "08012345678",
        date: "2026-02-30",
        timeSlot: "09:00",
      });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /date/i);
  });

  test("review rejects ratings outside 1-5", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ doctorId: randomUUID(), rating: 9, comment: "Great" });
    assert.equal(res.status, 400);
  });

  test("a non-UUID doctor id is a 404", async () => {
    assert.equal((await request(app).get("/api/doctors/not-an-id")).status, 404);
  });

  test("unknown API routes return JSON 404", async () => {
    const res = await request(app).get("/api/nothing-here");
    assert.equal(res.status, 404);
    assert.equal(res.body.error, "Not found");
  });

  test("database errors don't leak details", async () => {
    const res = await request(app).get("/api/doctors");
    assert.equal(res.status, 500);
    assert.equal(res.body.error, "Something went wrong. Please try again");
  });
});

describe("date and slot rules", () => {
  test("validates real calendar dates", () => {
    assert.equal(isValidDateString("2026-12-01"), true);
    assert.equal(isValidDateString("2026-02-30"), false);
    assert.equal(isValidDateString("01/12/2026"), false);
  });

  test("works out the day of the week", () => {
    assert.equal(dayOfWeek("2026-11-24"), 2); // Tuesday
  });

  test("uses Lagos time for 'now'", () => {
    const now = new Date("2026-11-24T23:30:00Z"); // 00:30 on 25 Nov in Lagos
    assert.deepEqual(nowInClinic(now), { date: "2026-11-25", time: "00:30" });
  });

  test("past slots are detected", () => {
    const now = new Date("2026-11-24T10:15:00Z"); // 11:15 in Lagos
    assert.equal(isPast("2026-11-23", "15:00", now), true);
    assert.equal(isPast("2026-11-24", "11:00", now), true);
    assert.equal(isPast("2026-11-24", "11:30", now), false);
    assert.equal(isPast("2026-11-25", "09:00", now), false);
  });
});

const TEST_DB = process.env.TEST_DATABASE_URL;

describe("full booking flow (PostgreSQL)", { skip: !TEST_DB && "set TEST_DATABASE_URL to run" }, () => {
  let app;
  let db;

  /** Next weekday (Mon–Fri) at least `daysAhead` days from now, as YYYY-MM-DD */
  const nextWeekday = (daysAhead = 2) => {
    for (let i = daysAhead; i < daysAhead + 7; i++) {
      const d = nowInClinic(new Date(Date.now() + i * 86_400_000)).date;
      if ([1, 2, 3, 4, 5].includes(dayOfWeek(d))) return d;
    }
    throw new Error("unreachable");
  };
  const nextSunday = () => {
    for (let i = 1; i <= 7; i++) {
      const d = nowInClinic(new Date(Date.now() + i * 86_400_000)).date;
      if (dayOfWeek(d) === 0) return d;
    }
    throw new Error("unreachable");
  };

  const register = async (email, name = "Amina Bello Okoro") => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, name, phone: "08012345678", password: "a-strong-password" });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body;
  };
  const authed = (method, url, token) =>
    request(app)[method](url).set("Authorization", `Bearer ${token}`);

  before(async () => {
    db = getPool(TEST_DB);
    await db.query("DROP SCHEMA IF EXISTS booking CASCADE");
    const applied = await migrate(db);
    assert.deepEqual(applied, ["001_init.sql"]);
    assert.equal(await seedDoctors(db), 12);
    assert.equal(await seedDoctors(db), 0, "seeding twice adds nothing");
    app = createApp(config, db);
  });

  after(() => closePool());

  test("migrations are idempotent", async () => {
    assert.deepEqual(await migrate(db), []);
  });

  test("health check reports the database is up", async () => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.database, "up");
  });

  test("register, log in, read and update the profile", async () => {
    const { authtoken, user } = await register("Amina@Example.com");
    assert.equal(user.email, "amina@example.com");
    assert.equal(user.name, "Amina Bello Okoro");
    assert.equal(user.role, "patient");
    assert.equal(user.passwordHash, undefined, "never send the password hash");

    const { rows } = await db.query(`SELECT "firstName", "lastName" FROM booking.portal_users WHERE "id" = $1`, [user.id]);
    assert.deepEqual(rows[0], { firstName: "Amina Bello", lastName: "Okoro" });

    const dup = await request(app)
      .post("/api/auth/register")
      .send({ email: "amina@example.com", name: "Someone Else", phone: "08012345678", password: "another-password" });
    assert.equal(dup.status, 409);

    const bad = await request(app).post("/api/auth/login").send({ email: "amina@example.com", password: "wrong-password" });
    assert.equal(bad.status, 401);

    const login = await request(app).post("/api/auth/login").send({ email: "AMINA@example.com", password: "a-strong-password" });
    assert.equal(login.status, 200);

    const me = await authed("get", "/api/auth/me", authtoken);
    assert.equal(me.body.id, user.id);

    const upd = await authed("put", "/api/auth/me", login.body.authtoken).send({ name: "Amina Okoro", phone: "+2348098765432" });
    assert.equal(upd.status, 200);
    assert.equal(upd.body.name, "Amina Okoro");
    assert.equal(upd.body.phone, "+2348098765432");
  });

  test("list doctors and specialities", async () => {
    const all = await request(app).get("/api/doctors");
    assert.equal(all.body.length, 12);
    assert.equal(typeof all.body[0].consultationFee, "number");

    const dentists = await request(app).get("/api/doctors?speciality=dentist");
    assert.equal(dentists.body.length, 2);
    assert.ok(dentists.body.every((d) => d.name.startsWith("Dr. ")));

    const search = await request(app).get("/api/doctors?search=okafor");
    assert.equal(search.body.length, 1);

    const specs = await request(app).get("/api/doctors/specialities");
    assert.equal(specs.body.length, 6);
    assert.ok(specs.body.includes("Paediatrician"));
  });

  test("book, block double booking, cancel and rebook", async () => {
    const a = await register("patient.a@example.com", "Patient A");
    const b = await register("patient.b@example.com", "Patient B");
    const { body: doctors } = await request(app).get("/api/doctors?speciality=Dentist");
    const doctor = doctors.find((d) => d.name.includes("Ogunleye")); // Mon–Fri
    const date = nextWeekday();

    const slots = await request(app).get(`/api/doctors/${doctor.id}/slots?date=${date}`);
    assert.equal(slots.body.worksThisDay, true);
    assert.ok(slots.body.slots.find((s) => s.time === "10:00").available);

    const booking = { doctorId: doctor.id, patientName: "Patient A", phoneNumber: "08012345678", date, timeSlot: "10:00", reason: "Toothache" };
    const ok = await authed("post", "/api/appointments", a.authtoken).send(booking);
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.equal(ok.body.status, "pending");
    assert.equal(ok.body.date, date, "date comes back unchanged (no time-zone shift)");
    assert.equal(ok.body.reason, "Toothache");
    assert.match(ok.body.doctorName, /Ogunleye/);

    // Same slot for someone else → taken
    const taken = await authed("post", "/api/appointments", b.authtoken).send({ ...booking, patientName: "Patient B" });
    assert.equal(taken.status, 409);
    assert.match(taken.body.error, /just taken/);

    // Same patient, same doctor, another slot → one active booking per doctor
    const second = await authed("post", "/api/appointments", a.authtoken).send({ ...booking, timeSlot: "11:00" });
    assert.equal(second.status, 409);

    const after = await request(app).get(`/api/doctors/${doctor.id}/slots?date=${date}`);
    assert.equal(after.body.slots.find((s) => s.time === "10:00").available, false);

    // B can't cancel A's appointment
    const steal = await authed("patch", `/api/appointments/${ok.body.id}/cancel`, b.authtoken);
    assert.equal(steal.status, 404);

    const cancel = await authed("patch", `/api/appointments/${ok.body.id}/cancel`, a.authtoken);
    assert.equal(cancel.status, 200);
    assert.equal(cancel.body.status, "cancelled");
    const again = await authed("patch", `/api/appointments/${ok.body.id}/cancel`, a.authtoken);
    assert.equal(again.status, 400);

    // Slot is free again
    const rebook = await authed("post", "/api/appointments", b.authtoken).send({ ...booking, patientName: "Patient B" });
    assert.equal(rebook.status, 201);

    const mine = await authed("get", "/api/appointments", a.authtoken);
    assert.equal(mine.body.length, 1);
    assert.equal(mine.body[0].status, "cancelled");
  });

  test("two people booking the same slot at once: exactly one wins", async () => {
    const users = await Promise.all(
      [1, 2, 3, 4, 5].map((i) => register(`race${i}@example.com`, `Racer ${i}`))
    );
    const { body: doctors } = await request(app).get("/api/doctors?search=Musa");
    const date = nextWeekday(3);
    const results = await Promise.all(
      users.map((u) =>
        authed("post", "/api/appointments", u.authtoken).send({
          doctorId: doctors[0].id, patientName: "Racer", phoneNumber: "08012345678", date, timeSlot: "14:00",
        })
      )
    );
    const statuses = results.map((r) => r.status).sort();
    assert.deepEqual(statuses, [201, 409, 409, 409, 409]);
  });

  test("rejects off-days, unknown slots, past and far-future dates", async () => {
    const { authtoken } = await register("rules@example.com", "Rule Tester");
    const { body: doctors } = await request(app).get("/api/doctors?search=Okafor"); // Mon–Fri
    const base = { doctorId: doctors[0].id, patientName: "Rule Tester", phoneNumber: "08012345678", timeSlot: "09:00" };

    const sunday = await authed("post", "/api/appointments", authtoken).send({ ...base, date: nextSunday() });
    assert.match(sunday.body.error, /doesn't consult/);

    const odd = await authed("post", "/api/appointments", authtoken).send({ ...base, date: nextWeekday(), timeSlot: "08:15" });
    assert.match(odd.body.error, /isn't offered/);

    const past = await authed("post", "/api/appointments", authtoken).send({ ...base, date: "2025-01-06" });
    assert.match(past.body.error, /passed/);

    const far = nowInClinic(new Date(Date.now() + 90 * 86_400_000)).date;
    const tooFar = await authed("post", "/api/appointments", authtoken).send({ ...base, date: far });
    assert.equal(tooFar.status, 400);

    const ghost = await authed("post", "/api/appointments", authtoken).send({ ...base, doctorId: randomUUID(), date: nextWeekday() });
    assert.equal(ghost.status, 404);

    const sundaySlots = await request(app).get(`/api/doctors/${doctors[0].id}/slots?date=${nextSunday()}`);
    assert.equal(sundaySlots.body.worksThisDay, false);
    assert.ok(sundaySlots.body.slots.every((s) => !s.available));
  });

  test("reviews update the doctor's average rating", async () => {
    const r1 = await register("reviewer1@example.com", "Reviewer One");
    const r2 = await register("reviewer2@example.com", "Reviewer Two");
    const { body: doctors } = await request(app).get("/api/doctors?search=Alabi");
    const doctorId = doctors[0].id;

    assert.equal((await authed("post", "/api/reviews", r1.authtoken).send({ doctorId, rating: 5, comment: "Excellent care" })).status, 201);
    assert.equal((await authed("post", "/api/reviews", r2.authtoken).send({ doctorId, rating: 2, comment: "Long wait" })).status, 201);
    // Editing replaces the first review instead of adding another
    assert.equal((await authed("post", "/api/reviews", r1.authtoken).send({ doctorId, rating: 4, comment: "Very good" })).status, 201);

    const doc = await request(app).get(`/api/doctors/${doctorId}`);
    assert.equal(doc.body.ratingCount, 2);
    assert.equal(doc.body.ratings, 3);

    const list = await request(app).get(`/api/doctors/${doctorId}/reviews`);
    assert.equal(list.body.length, 2);
    assert.ok(list.body.some((r) => r.author === "Reviewer One" && r.comment === "Very good"));

    const mine = await authed("get", "/api/reviews/mine", r1.authtoken);
    assert.equal(mine.body.length, 1);
  });

  test("a token for a deleted account is refused", async () => {
    const { authtoken, user } = await register("gone@example.com", "Gone User");
    await db.query(`DELETE FROM booking.portal_users WHERE "id" = $1`, [user.id]);
    assert.equal((await authed("get", "/api/auth/me", authtoken)).status, 401);
  });
});
