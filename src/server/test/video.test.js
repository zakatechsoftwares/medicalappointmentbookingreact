// Video consultations (Daily.co) against a real PostgreSQL, with Daily itself faked.
//   TEST_DATABASE_URL=postgresql://postgres@localhost:5432/stayhealthy_test PGSSL=disable npm test
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../app.js";
import { getPool, closePool } from "../db.js";
import { migrate } from "../migrate.js";
import { seedDoctors } from "../seed.js";
import { appointmentStart, dayOfWeek, nowInClinic, videoWindow } from "../utils/time.js";

const TEST_DB = process.env.TEST_DATABASE_URL;
const base = {
  jwtSecret: "test-secret-that-is-definitely-longer-than-32-chars",
  jwtExpiresIn: "1h",
  clientOrigins: [],
  isProduction: false,
};

/** Records every call and answers like Daily's REST API would */
function fakeDaily({ failRooms = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method: init.method, path: url.replace("https://api.daily.co/v1", ""), body, auth: init.headers.Authorization });
    const json = (status, data) => ({ ok: status < 300, status, json: async () => data });
    if (init.method === "POST" && url.endsWith("/rooms")) {
      if (failRooms) return json(500, { error: "server-error" });
      return json(200, { name: body.name, url: `https://stayhealthy.daily.co/${body.name}` });
    }
    if (init.method === "POST" && url.endsWith("/meeting-tokens")) {
      return json(200, { token: `tok-${body.properties.user_name}-${body.properties.is_owner}` });
    }
    if (init.method === "DELETE") return json(200, { deleted: true });
    return json(404, { error: "not-found" });
  };
  return { calls, fetchImpl };
}

describe("video consultations (PostgreSQL)", { skip: !TEST_DB && "set TEST_DATABASE_URL to run" }, () => {
  let db;
  let daily;
  let app;
  let noVideoApp;
  let patient;
  let admin;
  let doctor;

  const nextWeekday = (ahead = 2) => {
    for (let i = ahead; i < ahead + 7; i++) {
      const d = nowInClinic(new Date(Date.now() + i * 86_400_000)).date;
      if ([1, 2, 3, 4, 5].includes(dayOfWeek(d))) return d;
    }
    throw new Error("unreachable");
  };
  const authed = (a, method, url, token) => request(a)[method](url).set("Authorization", `Bearer ${token}`);
  const register = async (email, name) => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, name, phone: "08012345678", password: "a-strong-password" });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body;
  };

  /** An appointment whose video room is open right now (inserted directly, since real slots are in the future) */
  const insertOpenVideoVisit = async (userId) => {
    const now = nowInClinic();
    const { rows } = await db.query(
      `INSERT INTO booking.appointments ("userId","doctorId","patientName","phoneNumber","date","timeSlot","visitType","videoRoomName","videoRoomUrl")
       VALUES ($1,$2,'Video Patient','08012345678',$3,$4,'VIDEO',$5,$6) RETURNING "id"`,
      [userId, doctor.id, now.date, now.time, `sh-open-${Date.now()}`, "https://stayhealthy.daily.co/open"]
    );
    return rows[0].id;
  };

  before(async () => {
    db = getPool(TEST_DB);
    await db.query("DROP SCHEMA IF EXISTS booking CASCADE");
    assert.deepEqual(await migrate(db), ["001_init.sql", "002_video_consultations.sql"]);
    await seedDoctors(db);
    daily = fakeDaily();
    app = createApp({ ...base, dailyApiKey: "test-key", dailyFetch: daily.fetchImpl }, db);
    noVideoApp = createApp({ ...base, dailyApiKey: "" }, db);
    patient = await register("video.patient@example.com", "Video Patient");
    admin = await register("desk@example.com", "Clinic Desk");
    await db.query(`UPDATE booking.portal_users SET "role" = 'ADMIN' WHERE "email" = 'desk@example.com'`);
    doctor = (await request(app).get("/api/doctors?search=Okafor")).body[0];
  });

  after(() => closePool());

  test("the app says whether video is available", async () => {
    assert.deepEqual((await request(app).get("/api/config")).body, { video: true });
    assert.deepEqual((await request(noVideoApp).get("/api/config")).body, { video: false });
    assert.equal(doctor.offersVideo, true);
  });

  test("the video window is in clinic time", () => {
    // 09:30 in Lagos (UTC+1) is 08:30 UTC
    assert.equal(appointmentStart("2026-12-01", "09:30").toISOString(), "2026-12-01T08:30:00.000Z");
    const w = videoWindow("2026-12-01", "09:30");
    assert.equal(w.opensAt.toISOString(), "2026-12-01T08:20:00.000Z");
    assert.equal(w.closesAt.toISOString(), "2026-12-01T09:30:00.000Z");
  });

  test("a video booking gets its own private room", async () => {
    const date = nextWeekday();
    const res = await authed(app, "post", "/api/appointments", patient.authtoken).send({
      doctorId: doctor.id, patientName: "Video Patient", phoneNumber: "08012345678", date, timeSlot: "10:00", visitType: "video",
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.visitType, "video");
    assert.equal(res.body.videoOpensAt, videoWindow(date, "10:00").opensAt.toISOString());
    assert.equal(res.body.videoRoomUrl, undefined, "the room link is never sent to the browser in the list");

    const created = daily.calls.find((c) => c.method === "POST" && c.path === "/rooms");
    assert.equal(created.auth, "Bearer test-key");
    assert.equal(created.body.privacy, "private");
    assert.equal(created.body.name, `sh-${res.body.id.replace(/-/g, "")}`);
    assert.equal(created.body.properties.nbf * 1000, videoWindow(date, "10:00").opensAt.getTime());
    assert.equal(created.body.properties.enable_knocking, true);

    // Too early to join
    const early = await authed(app, "post", `/api/appointments/${res.body.id}/join`, patient.authtoken).send({ consent: true });
    assert.equal(early.status, 425);
    assert.ok(early.body.opensAt);

    // Cancelling deletes the room
    const cancel = await authed(app, "patch", `/api/appointments/${res.body.id}/cancel`, patient.authtoken);
    assert.equal(cancel.status, 200);
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(daily.calls.some((c) => c.method === "DELETE" && c.path === `/rooms/${created.body.name}`));
  });

  test("video can't be booked when Daily isn't set up", async () => {
    const res = await authed(noVideoApp, "post", "/api/appointments", patient.authtoken).send({
      doctorId: doctor.id, patientName: "Video Patient", phoneNumber: "08012345678", date: nextWeekday(), timeSlot: "11:00", visitType: "video",
    });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /aren't available/);
  });

  test("if Daily fails, the booking is undone and the slot stays free", async () => {
    const broken = createApp({ ...base, dailyApiKey: "k", dailyFetch: fakeDaily({ failRooms: true }).fetchImpl }, db);
    const date = nextWeekday(3);
    const res = await authed(broken, "post", "/api/appointments", patient.authtoken).send({
      doctorId: doctor.id, patientName: "Video Patient", phoneNumber: "08012345678", date, timeSlot: "13:00", visitType: "video",
    });
    assert.equal(res.status, 502);
    const slots = await request(app).get(`/api/doctors/${doctor.id}/slots?date=${date}`);
    assert.equal(slots.body.slots.find((s) => s.time === "13:00").available, true);
  });

  test("joining needs consent once, then gives a patient token", async () => {
    const id = await insertOpenVideoVisit(patient.user.id);
    const noConsent = await authed(app, "post", `/api/appointments/${id}/join`, patient.authtoken).send({});
    assert.equal(noConsent.status, 428);
    assert.equal(noConsent.body.needsConsent, true);

    const ok = await authed(app, "post", `/api/appointments/${id}/join`, patient.authtoken).send({ consent: true });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.roomUrl, "https://stayhealthy.daily.co/open");
    assert.equal(ok.body.token, "tok-Video Patient-false");

    const tokenCall = daily.calls.filter((c) => c.path === "/meeting-tokens").pop();
    assert.equal(tokenCall.body.properties.is_owner, false);
    assert.equal(tokenCall.body.properties.enable_recording, false);

    // Consent is remembered
    const again = await authed(app, "post", `/api/appointments/${id}/join`, patient.authtoken).send({});
    assert.equal(again.status, 200);

    // Someone else can't join this visit
    const other = await register("nosy@example.com", "Nosy Person");
    const nosy = await authed(app, "post", `/api/appointments/${id}/join`, other.authtoken).send({ consent: true });
    assert.equal(nosy.status, 404);

    // Finish it, freeing the slot for the next test
    await db.query(`UPDATE booking.appointments SET "status" = 'COMPLETED' WHERE "id" = $1`, [id]);
    const ended = await authed(app, "post", `/api/appointments/${id}/join`, patient.authtoken).send({});
    assert.equal(ended.status, 400);
  });

  test("the clinic desk is for staff only", async () => {
    const res = await authed(app, "get", "/api/clinic/appointments", patient.authtoken);
    assert.equal(res.status, 403);
  });

  test("staff see the day, confirm visits, and the doctor joins as host", async () => {
    const id = await insertOpenVideoVisit(patient.user.id);
    const list = await authed(app, "get", "/api/clinic/appointments", admin.authtoken);
    assert.equal(list.status, 200);
    const row = list.body.appointments.find((a) => a.id === id);
    assert.equal(row.accountEmail, "video.patient@example.com");
    assert.equal(row.hasVideoRoom, true);

    const confirm = await authed(app, "patch", `/api/clinic/appointments/${id}/status`, admin.authtoken).send({ status: "confirmed" });
    assert.equal(confirm.status, 200);
    assert.equal(confirm.body.status, "confirmed");

    const backwards = await authed(app, "patch", `/api/clinic/appointments/${id}/status`, admin.authtoken).send({ status: "confirmed" });
    assert.equal(backwards.status, 400);

    const join = await authed(app, "post", `/api/clinic/appointments/${id}/join`, admin.authtoken);
    assert.equal(join.status, 200, JSON.stringify(join.body));
    assert.equal(join.body.token, "tok-Dr. Ngozi Okafor-true");

    const done = await authed(app, "patch", `/api/clinic/appointments/${id}/status`, admin.authtoken).send({ status: "completed" });
    assert.equal(done.body.status, "completed");
    const afterDone = await authed(app, "post", `/api/clinic/appointments/${id}/join`, admin.authtoken);
    assert.equal(afterDone.status, 400);
  });
});
