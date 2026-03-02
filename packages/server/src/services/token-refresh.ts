import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import * as logger from "../lib/logger.js";
import { encrypt, decrypt } from "../lib/encryption.js";
import { CLIENT_ID, TOKEN_URL } from "./oauth.js";

const CONTEXT = "token-refresh";

/** Refresh interval: 50 minutes (OAuth tokens typically expire in 60 min). */
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

/** Maximum consecutive failures before stopping auto-refresh. */
const MAX_FAILURES = 3;

// ---- helpers for DB settings (injected to avoid circular deps) ----------

type GetSettingFn = (key: string) => Promise<string | null>;
type UpsertSettingFn = (key: string, value: string) => Promise<void>;

let _getSetting: GetSettingFn;
let _upsertSetting: UpsertSettingFn;

/**
 * Must be called once at startup to wire in the settings helpers
 * (avoids circular import with settings route).
 */
export function initTokenRefresh(getSetting: GetSettingFn, upsertSetting: UpsertSettingFn): void {
  _getSetting = getSetting;
  _upsertSetting = upsertSetting;
}

// ---- core refresh logic -------------------------------------------------

/**
 * Calls the Anthropic token endpoint with `grant_type=refresh_token`.
 * Returns new access + refresh tokens on success.
 */
async function callRefreshEndpoint(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: "https://claude.ai/",
        Origin: "https://claude.ai",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Refresh failed: ${response.status} ${errorBody || response.statusText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Updates `~/.claude/.credentials.json` with the new tokens so the CLI
 * picks them up on next invocation.
 */
async function updateCliCredentials(accessToken: string, refreshToken?: string): Promise<void> {
  const credPath = join(homedir(), ".claude", ".credentials.json");

  try {
    const raw = await readFile(credPath, "utf-8");
    const creds = JSON.parse(raw) as Record<string, unknown>;

    const oauthSection = (creds.claudeAiOauth ?? {}) as Record<string, unknown>;
    oauthSection.accessToken = accessToken;
    if (refreshToken) {
      oauthSection.refreshToken = refreshToken;
    }
    creds.claudeAiOauth = oauthSection;

    await writeFile(credPath, JSON.stringify(creds, null, 2), "utf-8");
    logger.debug("Updated CLI credentials file", CONTEXT);
  } catch {
    // File may not exist (user used API key or manual paste). Non-fatal.
    logger.debug("CLI credentials file not found — skipping update", CONTEXT);
  }
}

/**
 * Performs a single token refresh cycle:
 * 1. Read encrypted refresh token from DB
 * 2. Call Anthropic token endpoint
 * 3. Update DB with new encrypted tokens
 * 4. Update CLI credentials file
 *
 * Returns true on success, false if no refresh token available or on error.
 */
export async function refreshNow(): Promise<boolean> {
  if (!_getSetting || !_upsertSetting) {
    logger.warn("Token refresh not initialized — call initTokenRefresh() first", CONTEXT);
    return false;
  }

  const authType = await _getSetting("claude_auth_type");
  if (authType !== "oauth") {
    logger.debug("Auth type is not OAuth — skipping refresh", CONTEXT);
    return false;
  }

  const encryptedRefresh = await _getSetting("claude_oauth_refresh");
  if (!encryptedRefresh) {
    logger.debug("No refresh token stored — skipping", CONTEXT);
    return false;
  }

  let refreshToken: string;
  try {
    refreshToken = decrypt(encryptedRefresh);
  } catch (err) {
    logger.error(`Failed to decrypt refresh token: ${err}`, CONTEXT);
    return false;
  }

  try {
    logger.info("Refreshing OAuth access token...", CONTEXT);
    const tokens = await callRefreshEndpoint(refreshToken);

    // Store new access token
    await _upsertSetting("claude_auth_token", encrypt(tokens.accessToken));

    // Rotate refresh token if a new one was provided
    if (tokens.refreshToken) {
      await _upsertSetting("claude_oauth_refresh", encrypt(tokens.refreshToken));
    }

    // Update CLI credentials file
    await updateCliCredentials(tokens.accessToken, tokens.refreshToken);

    logger.info("OAuth token refreshed successfully", CONTEXT);
    return true;
  } catch (err) {
    logger.error(`Token refresh failed: ${err}`, CONTEXT);
    return false;
  }
}

// ---- periodic auto-refresh ----------------------------------------------

let intervalId: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;

/**
 * Starts the automatic token refresh timer.
 * Runs immediately on start, then every REFRESH_INTERVAL_MS.
 */
export function startAutoRefresh(): void {
  if (intervalId) return; // already running

  consecutiveFailures = 0;

  logger.info(`Auto-refresh started (interval: ${REFRESH_INTERVAL_MS / 60_000}min)`, CONTEXT);

  // Fire first refresh immediately
  refreshNow().then((ok) => {
    if (!ok) {
      logger.debug("Initial refresh skipped or failed (may be API key mode)", CONTEXT);
    }
  });

  intervalId = setInterval(async () => {
    const ok = await refreshNow();
    if (ok) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_FAILURES) {
        logger.warn(
          `Token refresh failed ${MAX_FAILURES} times in a row — stopping auto-refresh. Re-authenticate to resume.`,
          CONTEXT,
        );
        stopAutoRefresh();
      }
    }
  }, REFRESH_INTERVAL_MS);
}

/**
 * Stops the automatic token refresh timer.
 */
export function stopAutoRefresh(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info("Auto-refresh stopped", CONTEXT);
  }
}
