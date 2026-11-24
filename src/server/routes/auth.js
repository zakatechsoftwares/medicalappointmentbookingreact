import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { requireAuth, sendValidationErrors } from "../middleware/auth.js";

// Nigerian numbers: 0XXXXXXXXXX (11 digits) or +234XXXXXXXXXX
const PHONE_REGEX = /^(\+234\d{10}|0\d{10})$/;

export default function authRouter(config) {
  const router = express.Router();
  const auth = requireAuth(config.jwtSecret);

  // Slow down password guessing: 10 attempts per 15 minutes per IP
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.isProduction ? 10 : 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many attempts. Please wait a few minutes and try again" },
  });

  const signToken = (user) =>
    jwt.sign({ user: { id: user.id } }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

  const profileRules = [
    body("name", "Name should be at least 4 characters").trim().isLength({ min: 4, max: 80 }),
    body("phone", "Enter a valid Nigerian phone number, e.g. 08012345678")
      .trim()
      .matches(PHONE_REGEX),
  ];

  // POST /api/auth/register
  router.post(
    "/register",
    loginLimiter,
    [
      body("email", "Please enter a valid email").isEmail().normalizeEmail(),
      body("password", "Password should be at least 8 characters").isLength({ min: 8, max: 128 }),
      ...profileRules,
    ],
    async (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) return sendValidationErrors(res, result);

      try {
        const existing = await User.findOne({ email: req.body.email });
        if (existing) {
          return res.status(409).json({ error: "An account with this email already exists" });
        }
        const hash = await bcrypt.hash(req.body.password, 10);
        const user = await User.create({
          email: req.body.email,
          name: req.body.name,
          phone: req.body.phone,
          password: hash,
        });
        return res.status(201).json({ authtoken: signToken(user), user: user.toPublic() });
      } catch (error) {
        return next(error);
      }
    }
  );

  // POST /api/auth/login
  router.post(
    "/login",
    loginLimiter,
    [
      body("email", "Please enter a valid email").isEmail().normalizeEmail(),
      body("password", "Please enter your password").isString().notEmpty(),
    ],
    async (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) return sendValidationErrors(res, result);

      try {
        const user = await User.findOne({ email: req.body.email }).select("+password");
        const ok = user && (await bcrypt.compare(req.body.password, user.password));
        if (!ok) {
          return res.status(401).json({ error: "Incorrect email or password" });
        }
        return res.json({ authtoken: signToken(user), user: user.toPublic() });
      } catch (error) {
        return next(error);
      }
    }
  );

  // GET /api/auth/me — the logged-in user's profile
  router.get("/me", auth, async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(401).json({ error: "Account no longer exists" });
      return res.json(user.toPublic());
    } catch (error) {
      return next(error);
    }
  });

  // PUT /api/auth/me — update name and phone of the logged-in user
  router.put("/me", auth, profileRules, async (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) return sendValidationErrors(res, result);

    try {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { name: req.body.name, phone: req.body.phone },
        { new: true }
      );
      if (!user) return res.status(401).json({ error: "Account no longer exists" });
      return res.json(user.toPublic());
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
