import { Router } from "express";
import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
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
  buildRedirectUri,
} from "../services/oauth.js";
import { refreshNow } from "../services/token-refresh.js";

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

// Exports for use by oauth callback route
export { getSetting, upsertSetting, deleteSetting };

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

    if (type === "apikey" && !token.startsWith("sk-ant-api")) {
      res.status(400).json({ error: "API key must start with sk-ant-api" });
      return;
    }

    if (type === "oauth" && !token.startsWith("sk-ant-oat")) {
      res.status(400).json({ error: "OAuth token must start with sk-ant-oat" });
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
// POST /claude-auth/refresh — Manually trigger token refresh
// --------------------------------------------------------------------------
router.post("/claude-auth/refresh", async (_req: Request, res: Response) => {
  try {
    const ok = await refreshNow();
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Refresh failed. Ensure OAuth is configured with a valid refresh token." });
    }
  } catch (err) {
    logger.error("Manual token refresh failed", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to refresh token" });
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
// POST /import-cli-token — Import tokens from Claude Code CLI credentials
// --------------------------------------------------------------------------
router.post("/import-cli-token", async (_req: Request, res: Response) => {
  try {
    const credPath = join(homedir(), ".claude", ".credentials.json");
    let raw: string;
    try {
      raw = await readFile(credPath, "utf-8");
    } catch {
      res.status(404).json({
        error: "Claude CLI credentials not found on server. SSH into the server and run: claude login",
      });
      return;
    }

    const creds = JSON.parse(raw) as {
      claudeAiOauth?: {
        accessToken?: string;
        refreshToken?: string;
      };
    };

    const accessToken = creds.claudeAiOauth?.accessToken;
    if (!accessToken) {
      res.status(400).json({ error: "No access token found in CLI credentials. Run: claude login" });
      return;
    }

    // Encrypt and store
    const encryptedToken = encrypt(accessToken);
    await upsertSetting("claude_auth_type", "oauth");
    await upsertSetting("claude_auth_token", encryptedToken);

    const refreshToken = creds.claudeAiOauth?.refreshToken;
    if (refreshToken) {
      const encryptedRefresh = encrypt(refreshToken);
      await upsertSetting("claude_oauth_refresh", encryptedRefresh);
    }

    logger.info("Imported Claude auth from CLI credentials", CONTEXT);
    res.json({ success: true });
  } catch (err) {
    logger.error("Failed to import CLI token", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to import CLI credentials" });
  }
});

// --------------------------------------------------------------------------
// GET /oauth-url — Generate PKCE and return OAuth URL
// --------------------------------------------------------------------------
router.get("/oauth-url", async (req: Request, res: Response) => {
  try {
    const port = parseInt(req.query.port as string, 10) || 3000;
    const redirectUri = buildRedirectUri(port);

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = randomBytes(16).toString("base64url");

    // Store code verifier and redirect URI for the callback step
    await upsertSetting("oauth_code_verifier", codeVerifier);
    await upsertSetting("oauth_state", state);
    await upsertSetting("oauth_redirect_uri", redirectUri);

    const url = buildAuthUrl(codeChallenge, state, redirectUri);

    logger.info("Generated OAuth URL with PKCE", CONTEXT);
    res.json({ url, state });
  } catch (err) {
    logger.error("Failed to generate OAuth URL", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to generate OAuth URL" });
  }
});

// --------------------------------------------------------------------------
// POST /oauth-exchange — Exchange authorization code for tokens (manual fallback)
// --------------------------------------------------------------------------
router.post("/oauth-exchange", async (req: Request, res: Response) => {
  try {
    const { code, redirectUrl } = req.body as { code?: string; redirectUrl?: string };

    // Extract code from redirect URL if provided
    let authCode = code;
    if (!authCode && redirectUrl) {
      try {
        const url = new URL(redirectUrl);
        authCode = url.searchParams.get("code") ?? undefined;
      } catch {
        res.status(400).json({ error: "Invalid redirect URL" });
        return;
      }
    }

    if (!authCode) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    // Retrieve stored code verifier and redirect URI
    const codeVerifier = await getSetting("oauth_code_verifier");
    const redirectUri = await getSetting("oauth_redirect_uri");
    if (!codeVerifier || !redirectUri) {
      logger.warn("OAuth exchange attempted but no session found", CONTEXT);
      res.status(400).json({ error: "No OAuth session found. Please generate a new OAuth URL first." });
      return;
    }

    // Exchange code for tokens (import dynamically to use updated function)
    const { exchangeCode } = await import("../services/oauth.js");
    const tokens = await exchangeCode(authCode, codeVerifier, redirectUri);

    // Encrypt and store tokens
    const encryptedToken = encrypt(tokens.accessToken);
    await upsertSetting("claude_auth_type", "oauth");
    await upsertSetting("claude_auth_token", encryptedToken);

    if (tokens.refreshToken) {
      const encryptedRefresh = encrypt(tokens.refreshToken);
      await upsertSetting("claude_oauth_refresh", encryptedRefresh);
    }

    // Clean up temporary state
    await deleteSetting("oauth_code_verifier");
    await deleteSetting("oauth_state");
    await deleteSetting("oauth_redirect_uri");

    logger.info("OAuth token exchange completed successfully", CONTEXT);
    res.json({ success: true });
  } catch (err) {
    logger.error("OAuth token exchange failed", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to exchange authorization code. Please try again." });
  }
});

// --------------------------------------------------------------------------
// GET /plugins — List Claude Code plugins installed on the server
// --------------------------------------------------------------------------
router.get("/plugins", async (_req: Request, res: Response) => {
  try {
    const installedPath = join(homedir(), ".claude", "plugins", "installed_plugins.json");
    let raw: string;
    try {
      raw = await readFile(installedPath, "utf-8");
    } catch {
      // File doesn't exist — no plugins
      res.json({ plugins: [] });
      return;
    }

    const data = JSON.parse(raw) as {
      plugins?: Record<string, Array<{ version: string; installedAt: string }>>;
    };

    if (!data.plugins) {
      res.json({ plugins: [] });
      return;
    }

    // Parse "pluginName@marketplace" keys into structured objects
    const plugins = Object.entries(data.plugins).map(([key, installs]) => {
      const atIdx = key.indexOf("@");
      const name = atIdx > 0 ? key.slice(0, atIdx) : key;
      const marketplace = atIdx > 0 ? key.slice(atIdx + 1) : "unknown";
      const latest = installs[0];
      return {
        name,
        marketplace,
        version: latest?.version ?? "unknown",
        installedAt: latest?.installedAt ?? null,
      };
    });

    logger.info(`Found ${plugins.length} Claude Code plugins`, CONTEXT);
    res.json({ plugins });
  } catch (err) {
    logger.error("Failed to list plugins", CONTEXT, { error: String(err) });
    res.json({ plugins: [] });
  }
});

export { router as settingsRouter };
