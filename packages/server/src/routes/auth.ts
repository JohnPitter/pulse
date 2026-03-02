import { Router } from "express";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { hashPassword, verifyPassword, generateToken } from "../services/auth.js";
import * as logger from "../lib/logger.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

const AUTH_CONTEXT = "auth";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function isSecureRequest(req: Request): boolean {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

function cookieOptions(req: Request, maxAge?: number) {
  return {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "strict" as const,
    ...(maxAge !== undefined && { maxAge }),
  };
}

/**
 * Rate limiter for login endpoint: 5 requests per 15 minutes per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});

const router = Router();

/**
 * GET /status
 * Returns whether the admin password has been configured.
 * Used by the frontend to decide between login and setup screens.
 */
router.get("/status", async (_req: Request, res: Response) => {
  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "admin_password_hash"))
    .limit(1);

  res.json({ configured: result.length > 0 });
});

/**
 * POST /setup
 * Sets the initial admin password. Only works when no password is configured.
 */
router.post("/setup", loginLimiter, async (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };

  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  // Check if password is already configured
  const existing = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "admin_password_hash"))
    .limit(1);

  if (existing.length > 0) {
    logger.warn("Setup attempted but admin password already exists", AUTH_CONTEXT);
    res.status(409).json({ error: "Admin password is already configured" });
    return;
  }

  const hash = await hashPassword(password);
  await db.insert(settings).values({ key: "admin_password_hash", value: hash });

  // Auto-login after setup
  const token = generateToken({ userId: "admin", role: "admin" });

  res.cookie("token", token, cookieOptions(req, TWENTY_FOUR_HOURS_MS));

  logger.info("Admin password configured via setup", AUTH_CONTEXT);
  res.json({ success: true });
});

/**
 * POST /login
 * Authenticates with the admin password.
 * Reads the admin_password_hash from the settings table.
 * On success, sets an httpOnly JWT cookie.
 */
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };

  if (!password) {
    logger.warn("Login attempt without password", AUTH_CONTEXT);
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "admin_password_hash"))
    .limit(1);

  const row = result[0];

  if (!row) {
    logger.warn("Login attempt but no admin password is configured", AUTH_CONTEXT);
    res.status(401).json({ error: "Admin password not configured. Please complete setup first." });
    return;
  }

  const isValid = await verifyPassword(password, row.value);

  if (!isValid) {
    logger.warn("Login attempt with invalid password", AUTH_CONTEXT);
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = generateToken({ userId: "admin", role: "admin" });

  res.cookie("token", token, cookieOptions(req, TWENTY_FOUR_HOURS_MS));

  logger.info("Admin logged in successfully", AUTH_CONTEXT);
  res.json({ success: true });
});

/**
 * POST /logout
 * Clears the authentication cookie.
 */
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token", cookieOptions(req));

  logger.info("User logged out", AUTH_CONTEXT);
  res.json({ success: true });
});

/**
 * GET /check
 * Returns whether the current request is authenticated.
 */
router.get("/check", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ authenticated: true, user: req.user });
});

export { router as authRouter };
