import { randomBytes, createHash } from "node:crypto";
import * as logger from "../lib/logger.js";

const OAUTH_CONTEXT = "oauth";

const AUTH_URL = "https://claude.ai/oauth/authorize";
const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const SCOPES = "user:profile user:inference user:sessions:claude_code user:mcp_servers";

/**
 * Builds the redirect URI for OAuth callback.
 * Uses Anthropic's official callback endpoint for the native client_id.
 * After authorization, the user is redirected to console.anthropic.com
 * which displays the authorization code for manual copy.
 */
export function buildRedirectUri(_port: number): string {
  return "https://console.anthropic.com/oauth/code/callback";
}

/**
 * Generates a cryptographically random PKCE code verifier.
 */
export function generateCodeVerifier(): string {
  const verifier = randomBytes(32).toString("base64url");
  logger.debug("Generated PKCE code verifier", OAUTH_CONTEXT);
  return verifier;
}

/**
 * Generates a PKCE code challenge from a code verifier (S256).
 */
export function generateCodeChallenge(verifier: string): string {
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  logger.debug("Generated PKCE code challenge", OAUTH_CONTEXT);
  return challenge;
}

/**
 * Builds the OAuth authorization URL with PKCE parameters.
 */
export function buildAuthUrl(codeChallenge: string, state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    code: "true",
  });

  const url = `${AUTH_URL}?${params.toString()}`;
  logger.debug("Built OAuth authorization URL", OAUTH_CONTEXT);
  return url;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Exchanges an authorization code for access and refresh tokens.
 */
export async function exchangeCode(code: string, codeVerifier: string, redirectUri: string): Promise<TokenResponse> {
  logger.info("Exchanging authorization code for tokens", OAUTH_CONTEXT);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const cleanCode = code.split("#")[0].split("&")[0];

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: "https://claude.ai/",
        Origin: "https://claude.ai",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: cleanCode,
        redirect_uri: redirectUri,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      logger.error(`Token exchange failed: ${response.status} ${errorBody}`, OAUTH_CONTEXT);
      throw new Error(`Token exchange failed: ${response.status} ${errorBody || response.statusText}`);
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
