import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";

import { loadConfig } from "./lib/config.js";
import * as logger from "./lib/logger.js";
import { listAliveSessions, tmuxSessionName } from "./services/tmux.js";
import { encrypt } from "./lib/encryption.js";
import { db } from "./db/index.js";
import { AgentManager } from "./services/agent-manager.js";
import { exchangeCode } from "./services/oauth.js";
import { authRouter } from "./routes/auth.js";
import { createAgentRouter } from "./routes/agents.js";
import { settingsRouter, getSetting, upsertSetting, deleteSetting } from "./routes/settings.js";
import { filesystemRouter } from "./routes/filesystem.js";
import { setupSocket } from "./socket/index.js";
import { initTokenRefresh, startAutoRefresh } from "./services/token-refresh.js";

const config = loadConfig();

const app = express();
const server = createServer(app);

// --- Shared service instances ---
const agentManager = new AgentManager(db);

// --- Middleware pipeline ---

// 1. CORS
app.use(cors({ origin: config.corsOrigin, credentials: true }));

// 2. JSON body parser
app.use(express.json());

// 3. Cookie parser
app.use(cookieParser());

// 4. Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.path} ${res.statusCode}`, "http", {
      duration: Date.now() - start,
    });
  });
  next();
});

// --- Serve frontend static files in production ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDistPath = path.join(__dirname, "../../web/dist");
app.use(express.static(webDistPath));

// --- OAuth result page helper ---
function oauthResultPage(success: boolean, message: string): string {
  const icon = success ? "&#10004;" : "&#10006;";
  const color = success ? "#22c55e" : "#ef4444";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pulse OAuth</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0c0a09;color:#fff">
<div style="text-align:center;max-width:360px;padding:24px"><div style="font-size:48px;color:${color};margin-bottom:16px">${icon}</div>
<p style="font-size:18px;font-weight:600;margin:0 0 8px">${message}</p>
${success ? '<p style="font-size:13px;color:#a8a29e">Return to the Pulse app.</p>' : '<p style="font-size:13px;color:#a8a29e">Go back to Pulse settings and try again.</p>'}
</div></body></html>`;
}

// --- Routes ---

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- System info (no auth required) ---
app.get("/api/system/version", (_req: Request, res: Response) => {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const localBin = home ? `${home}/.local/bin` : "";
  const currentPath = process.env.PATH ?? "";
  const envPath = localBin ? `${localBin}:${currentPath}` : currentPath;

  execFile("claude", ["--version"], { timeout: 5000, env: { ...process.env, PATH: envPath } }, (error, stdout) => {
    if (error) {
      logger.warn(`Failed to get Claude CLI version: ${error.message}`, "system");
      res.json({ version: "unknown" });
      return;
    }
    res.json({ version: stdout.trim() || "unknown" });
  });
});

// --- OAuth callback (NO auth required — called by browser redirect from Anthropic) ---
app.get("/api/oauth/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code) {
    res.status(400).send(oauthResultPage(false, "No authorization code received."));
    return;
  }

  try {
    // Verify state parameter
    const storedState = await getSetting("oauth_state");
    if (storedState && state !== storedState) {
      logger.warn("OAuth callback state mismatch", "oauth");
      res.status(400).send(oauthResultPage(false, "Invalid state parameter. Please try again."));
      return;
    }

    // Retrieve stored PKCE verifier and redirect URI
    const codeVerifier = await getSetting("oauth_code_verifier");
    const redirectUri = await getSetting("oauth_redirect_uri");
    if (!codeVerifier || !redirectUri) {
      res.status(400).send(oauthResultPage(false, "No pending OAuth session. Please start again from Pulse settings."));
      return;
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code, codeVerifier, redirectUri);

    // Encrypt and store
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

    logger.info("OAuth callback: tokens exchanged and stored successfully", "oauth");
    res.send(oauthResultPage(true, "Authentication successful! You can close this tab."));
  } catch (err) {
    logger.error("OAuth callback failed", "oauth", { error: String(err) });
    res.status(500).send(oauthResultPage(false, "Token exchange failed. Please try again."));
  }
});

app.use("/api/auth", authRouter);
app.use("/api/agents", createAgentRouter(agentManager));
app.use("/api/settings", settingsRouter);
app.use("/api/filesystem", filesystemRouter);

// --- SPA fallback (must come after API routes, before error handler) ---
// Express 5 uses path-to-regexp v8+ which requires named wildcards
app.get("/{*path}", (_req: Request, res: Response) => {
  res.sendFile(path.join(webDistPath, "index.html"));
});

// --- Error handler (Express 5 requires 4 params) ---

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message, "http", { stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

// --- Socket.io ---

const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
});

setupSocket(io, agentManager);

// --- Start server ---

server.listen(config.port, async () => {
  logger.info(`Pulse server running on port ${config.port}`, "server");

  // Start OAuth token auto-refresh
  initTokenRefresh(getSetting, upsertSetting);
  startAutoRefresh();

  // Reconcile tmux sessions with DB state
  try {
    const aliveSessions = await listAliveSessions();
    const aliveSet = new Set(aliveSessions);
    const allAgents = await agentManager.listAgents();

    for (const agent of allAgents) {
      const tmuxName = tmuxSessionName(agent.id);
      const isAlive = aliveSet.has(tmuxName);
      const isMarkedRunning = agent.status === "running" || agent.status === "waiting";

      if (isMarkedRunning && !isAlive) {
        // DB says running but tmux is dead → set stopped
        logger.warn(`Reconcile: agent '${agent.name}' marked ${agent.status} but tmux dead → stopped`, "reconcile");
        await agentManager.updateAgent(agent.id, { status: "stopped", pid: null, tmuxSession: null });
      } else if (!isMarkedRunning && isAlive && agent.status === "stopped") {
        // DB says stopped but tmux is alive → set idle (survived restart)
        logger.info(`Reconcile: agent '${agent.name}' marked stopped but tmux alive → idle`, "reconcile");
        await agentManager.updateAgent(agent.id, { status: "idle", tmuxSession: tmuxName });
      }
    }

    logger.info(`Reconciliation complete: ${aliveSessions.length} alive tmux sessions`, "reconcile");
  } catch (err) {
    logger.warn(`tmux reconciliation failed (tmux may not be installed)`, "reconcile", { error: String(err) });
  }
});

export { app, server, io };
