import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";

import { loadConfig } from "./lib/config.js";
import * as logger from "./lib/logger.js";
import { authRouter } from "./routes/auth.js";
import agentRouter from "./routes/agents.js";
import { setupSocket } from "./socket/index.js";

const config = loadConfig();

const app = express();
const server = createServer(app);

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

// --- Routes ---

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/agents", agentRouter);

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

setupSocket(io);

// --- Start server ---

server.listen(config.port, () => {
  logger.info(`Pulse server running on port ${config.port}`, "server");
});

export { app, server, io };
