import type { Server } from "socket.io";

import { verifyToken } from "../services/auth.js";
import type { AgentManager } from "../services/agent-manager.js";
import { setupChatHandlers } from "./chat.js";
import { setupTerminalHandlers } from "./terminal.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "socket";

/**
 * Parses the `token` value from a raw cookie header string.
 * Returns undefined if not found.
 */
function parseCookieToken(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/token=([^;]+)/);
  return match?.[1];
}

/**
 * Configures Socket.io authentication middleware and event handlers.
 *
 * Auth flow:
 * 1. Extract token from `socket.handshake.auth.token` (client-provided) or
 *    from the `token` cookie in the handshake headers.
 * 2. Verify JWT via `verifyToken()`.
 * 3. Reject connection if token is missing or invalid.
 * 4. Attach decoded payload to `socket.data.user`.
 *
 * On connection: registers chat and terminal handlers.
 * On disconnect: logs the event.
 */
export function setupSocket(io: Server, agentManager: AgentManager): void {
  // Auth middleware
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth.token as string | undefined) ??
      parseCookieToken(socket.handshake.headers.cookie);

    if (!token) {
      logger.warn("Socket connection rejected: no token", CONTEXT, {
        address: socket.handshake.address,
      });
      return next(new Error("Authentication required"));
    }

    const payload = verifyToken(token);

    if (!payload) {
      logger.warn("Socket connection rejected: invalid token", CONTEXT, {
        address: socket.handshake.address,
      });
      return next(new Error("Invalid token"));
    }

    socket.data.user = payload;
    next();
  });

  // Connection handler
  io.on("connection", (socket) => {
    logger.info("Socket connected", CONTEXT, {
      socketId: socket.id,
      userId: socket.data.user?.userId,
    });

    setupChatHandlers(socket, io, agentManager);
    setupTerminalHandlers(socket, io);

    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", CONTEXT, {
        socketId: socket.id,
        userId: socket.data.user?.userId,
        reason,
      });
    });
  });
}
