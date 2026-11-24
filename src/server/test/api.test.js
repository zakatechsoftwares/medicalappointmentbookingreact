// Tests for the parts of the API that don't need a database:
// token checks, input validation and the date/slot rules.
// Run with: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "../app.js";
import { isPast, isValidDateString, dayOfWeek, nowInClinic } from "../utils/time.js";

// Fail fast instead of waiting for a database that isn't there
mongoose.set("bufferCommands", false);

const config = {
  jwtSecret: "test-secret-that-is-definitely-longer-than-32-chars",
  jwtExpiresIn: "1h",
  clientOrigins: ["http://localhost:5173"],
  isProduction: false,
};
const app = createApp(config);
const token = jwt.sign({ user: { id: new mongoose.Types.ObjectId().toString() } }, config.jwtSecret);

describe("authentication", () => {
  test("profile requires a token", async () => {
    const res = await request(app).get("/api/auth/me");
    assert.equal(res.status, 401);
  });

  test("the old email-header trick no longer works", async () => {
    const res = await request(app).get("/api/auth/me").set("email", "someone@example.com");
    assert.equal(res.status, 401);
  });

  test("a token signed with another secret is rejected", async () => {
    const forged = jwt.sign({ user: { id: "abc" } }, "some-other-secret");
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${forged}`);
    assert.equal(res.status, 401);
  });

  test("expired tokens are rejected", async () => {
    const expired = jwt.sign({ user: { id: "abc" } }, config.jwtSecret, { expiresIn: -10 });
    const res = await request(app).get("/api/appointments").set("Authorization", `Bearer ${expired}`);
    assert.equal(res.status, 401);
  });

  test("appointments and writing reviews require a token", async () => {
    assert.equal((await request(app).get("/api/appointments")).status, 401);
    assert.equal((await request(app).post("/api/appointments").send({})).status, 401);
    assert.equal((await request(app).post("/api/reviews").send({})).status, 401);
  });
});

describe("validation", () => {
  test("register rejects short passwords and bad phone numbers", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.com", name: "Abdul", phone: "123", password: "short" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  test("booking rejects a malformed date", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        doctorId: new mongoose.Types.ObjectId().toString(),
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
      .send({ doctorId: new mongoose.Types.ObjectId().toString(), rating: 9, comment: "Great" });
    assert.equal(res.status, 400);
  });

  test("unknown doctor id returns 404 without touching the database", async () => {
    const res = await request(app).get("/api/doctors/not-an-id");
    assert.equal(res.status, 404);
  });

  test("unknown API routes return JSON 404", async () => {
    const res = await request(app).get("/api/nothing-here");
    assert.equal(res.status, 404);
    assert.equal(res.body.error, "Not found");
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
    // 23:30 UTC on 24 Nov is 00:30 on 25 Nov in Lagos
    const now = new Date("2026-11-24T23:30:00Z");
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
