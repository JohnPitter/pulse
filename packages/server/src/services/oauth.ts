import { randomBytes, createHash } from "node:crypto";
import * as logger from "../lib/logger.js";

const OAUTH_CONTEXT = "oauth";

const AUTH_URL = "https://claude.ai/oauth/authorize";
const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
const REDIRECT_URI = "https://platform.claude.com/oauth/code/callback";
const CLIENT_ID = "claude-cli";
const SCOPES = "org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers";

/**
 * Generates a cryptographically random PKCE code verifier.
 * Returns a 32-byte random value encoded as base64url.
 */
export function generateCodeVerifier(): string {
  const verifier = randomBytes(32).toString("base64url");
  logger.debug("Generated PKCE code verifier", OAUTH_CONTEXT);
  return verifier;
}

/**
 * Generates a PKCE code challenge from a code verifier.
 * Uses SHA-256 hash encoded as base64url (S256 method).
 */
export function generateCodeChallenge(verifier: string): string {
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  logger.debug("Generated PKCE code challenge", OAUTH_CONTEXT);
  return challenge;
}

/**
 * Builds the OAuth authorization URL with PKCE parameters.
 * The URL is used to redirect the user to Claude's OAuth consent page.
 */
export function buildAuthUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  const url = `${AUTH_URL}?${params.toString()}`;
  logger.debug("Built OAuth authorization URL", OAUTH_CONTEXT);
  return url;
}

interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Exchanges an authorization code for access and refresh tokens.
 * Uses JSON content-type as required by Claude's OAuth implementation.
 * Timeout: 30 seconds to prevent hanging requests.
 */
export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenResponse> {
  logger.info("Exchanging authorization code for tokens", OAUTH_CONTEXT);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const statusText = response.statusText || "Unknown error";
      logger.error(`Token exchange failed: ${response.status} ${statusText}`, OAUTH_CONTEXT);
      throw new Error(`Token exchange failed: ${response.status} ${statusText}`);
    }

    const data = (await response.json()) as { access_token: string; refresh_token?: string };

    logger.info("Token exchange completed successfully", OAUTH_CONTEXT);
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } finally {
    clearTimeout(timeout);
  }
}
