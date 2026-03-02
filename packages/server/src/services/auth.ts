import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { loadConfig } from "../lib/config.js";
import * as logger from "../lib/logger.js";

const BCRYPT_ROUNDS = 10;
const AUTH_CONTEXT = "auth";

export interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  logger.debug("Password hashed successfully", AUTH_CONTEXT);
  return hash;
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 * Returns true if the password matches, false otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hash);
  logger.debug("Password verification completed", AUTH_CONTEXT, { isValid });
  return isValid;
}

/**
 * Generates a signed JWT token from the given payload.
 * Uses the JWT_SECRET from config for signing.
 */
export function generateToken(payload: Record<string, unknown>, expiresIn: SignOptions["expiresIn"] = "24h"): string {
  const config = loadConfig();
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn });
  logger.debug("JWT token generated", AUTH_CONTEXT);
  return token;
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Returns null if the token is invalid, expired, or tampered with.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const config = loadConfig();
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    return decoded;
  } catch {
    logger.debug("JWT token verification failed", AUTH_CONTEXT);
    return null;
  }
}
