import { Router } from "express";
import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { encrypt } from "../lib/encryption.js";
import * as logger from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";
import { hashPassword, verifyPassword } from "../services/auth.js";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthUrl,
  exchangeCode,
} from "../services/oauth.js";

const CONTEXT = "settings";

const router = Router();

// All settings routes require authentication
router.use(requireAuth);

/**
 * Helper to get a setting value by key.
 */
async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

/**
 * Helper to upsert a setting value.
 */
async function upsertSetting(key: string, value: string): Promise<void> {
  const existing = await getSetting(key);
  if (existing !== null) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

/**
 * Helper to delete a setting by key.
 */
async function deleteSetting(key: string): Promise<void> {
  await db.delete(settings).where(eq(settings.key, key));
}

// --------------------------------------------------------------------------
// POST /claude-auth — Save OAuth token or API key (encrypted)
// --------------------------------------------------------------------------
router.post("/claude-auth", async (req: Request, res: Response) => {
  try {
    const { type, token, refreshToken } = req.body as {
      type?: string;
      token?: string;
      refreshToken?: string;
    };

    if (!type || !token) {
      res.status(400).json({ error: "type and token are required" });
      return;
    }

    if (type !== "oauth" && type !== "apikey") {
      res.status(400).json({ error: "type must be 'oauth' or 'apikey'" });
      return;
    }

    if (type === "apikey" && !token.startsWith("sk-ant-")) {
      res.status(400).json({ error: "API key must start with sk-ant-" });
      return;
    }

    // Encrypt and store the token
    const encryptedToken = encrypt(token);
    await upsertSetting("claude_auth_type", type);
    await upsertSetting("claude_auth_token", encryptedToken);

    // Store refresh token if OAuth
    if (type === "oauth" && refreshToken) {
      const encryptedRefresh = encrypt(refreshToken);
      await upsertSetting("claude_oauth_refresh", encryptedRefresh);
    } else {
      // Clean up refresh token if switching to API key
      await deleteSetting("claude_oauth_refresh");
    }

    // Clean up temporary PKCE verifier
    await deleteSetting("oauth_code_verifier");

    logger.info(`Claude auth configured with type: ${type}`, CONTEXT);
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to save Claude auth", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to save authentication" });
  }
});

// --------------------------------------------------------------------------
// GET /claude-auth/status — Returns auth status without exposing tokens
// --------------------------------------------------------------------------
router.get("/claude-auth/status", async (_req: Request, res: Response) => {
  try {
    const authType = await getSetting("claude_auth_type");
    const authToken = await getSetting("claude_auth_token");

    const configured = authType !== null && authToken !== null;

    res.json({
      configured,
      type: configured ? authType : null,
    });
  } catch (err) {
    logger.error("Failed to get Claude auth status", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to get auth status" });
  }
});

// --------------------------------------------------------------------------
// POST /password — Change admin password
// --------------------------------------------------------------------------
router.post("/password", async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    // Verify current password
    const storedHash = await getSetting("admin_password_hash");
    if (!storedHash) {
      logger.warn("Password change attempted but no admin password is configured", CONTEXT);
      res.status(400).json({ error: "No admin password configured" });
      return;
    }

    const isValid = await verifyPassword(currentPassword, storedHash);
    if (!isValid) {
      logger.warn("Password change attempted with incorrect current password", CONTEXT);
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Hash and store new password
    const newHash = await hashPassword(newPassword);
    await upsertSetting("admin_password_hash", newHash);

    logger.info("Admin password changed successfully", CONTEXT);
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to change password", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to change password" });
  }
});

// --------------------------------------------------------------------------
// GET /oauth-url — Generate PKCE and return OAuth URL
// --------------------------------------------------------------------------
router.get("/oauth-url", async (_req: Request, res: Response) => {
  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = randomBytes(16).toString("base64url");

    // Store code verifier temporarily for the token exchange step
    await upsertSetting("oauth_code_verifier", codeVerifier);

    const url = buildAuthUrl(codeChallenge, state);

    logger.info("Generated OAuth URL with PKCE", CONTEXT);
    res.json({ url, state });
  } catch (err) {
    logger.error("Failed to generate OAuth URL", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to generate OAuth URL" });
  }
});

// --------------------------------------------------------------------------
// POST /oauth-exchange — Exchange authorization code for tokens
// --------------------------------------------------------------------------
router.post("/oauth-exchange", async (req: Request, res: Response) => {
  try {
    const { code } = req.body as { code?: string };

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    // Retrieve stored code verifier
    const codeVerifier = await getSetting("oauth_code_verifier");
    if (!codeVerifier) {
      logger.warn("OAuth exchange attempted but no code verifier found", CONTEXT);
      res.status(400).json({ error: "No OAuth session found. Please generate a new OAuth URL first." });
      return;
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code, codeVerifier);

    // Encrypt and store tokens
    const encryptedToken = encrypt(tokens.accessToken);
    await upsertSetting("claude_auth_type", "oauth");
    await upsertSetting("claude_auth_token", encryptedToken);

    if (tokens.refreshToken) {
      const encryptedRefresh = encrypt(tokens.refreshToken);
      await upsertSetting("claude_oauth_refresh", encryptedRefresh);
    }

    // Clean up temporary verifier
    await deleteSetting("oauth_code_verifier");

    logger.info("OAuth token exchange completed successfully", CONTEXT);
    res.json({ success: true });
  } catch (err) {
    logger.error("OAuth token exchange failed", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to exchange authorization code. Please try again." });
  }
});

export { router as settingsRouter };
