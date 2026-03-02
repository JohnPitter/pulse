import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth.js";
import type { TokenPayload } from "../services/auth.js";
import * as logger from "../lib/logger.js";

const AUTH_CONTEXT = "auth";

/**
 * Extends Express Request to include the authenticated user payload.
 */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware that requires a valid JWT token in the `token` cookie.
 * If the token is missing or invalid, returns 401 Unauthorized.
 * If valid, attaches the decoded payload to `req.user` and calls next().
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    logger.warn("Auth attempt with no token", AUTH_CONTEXT, { path: req.path });
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    logger.warn("Auth attempt with invalid token", AUTH_CONTEXT, { path: req.path });
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
}
