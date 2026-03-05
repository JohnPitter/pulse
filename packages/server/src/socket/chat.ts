import type { Socket, Server } from "socket.io";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { chatMessages } from "../db/schema.js";
import type { AgentManager } from "../services/agent-manager.js";
import { agentSessionManager } from "../services/agent-session.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "socket:chat";

/**
 * Registers chat and agent lifecycle event handlers on the given socket.
 *
 * Events handled:
 * - `chat:send`       — sends a user message to the agent via agentSessionManager
 * - `agent:start`     — no-op (sessions started via REST/SSE endpoint)
 * - `agent:stop`      — stops the agent SDK session
 * - `agent:subscribe` — joins the socket to the agent's room + sends DB chat history
 */
export function setupChatHandlers(
  socket: Socket,
  _io: Server,
  _agentManager: AgentManager,
): void {
  socket.on("chat:send", async (data: { agentId: string; content: string; imageBase64?: string }) => {
    logger.info("Chat message received", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });

    try {
      // Delegate to agentSessionManager — stops any running session and starts a new one
      await agentSessionManager.sendMessage(data.agentId, data.content, data.imageBase64);
    } catch (err) {
      logger.error("Failed to send chat message", CONTEXT, {
        agentId: data.agentId,
        error: String(err),
      });
      socket.emit("error", { message: `Failed to send message: ${String(err)}` });
    }
  });

  socket.on("agent:start", async (data: { agentId: string }) => {
    logger.info("Agent start requested (no-op, use REST/SSE)", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });
    // Sessions are now started via the REST+SSE endpoint
  });

  socket.on("agent:stop", async (data: { agentId: string }) => {
    logger.info("Agent stop requested", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });

    try {
      await agentSessionManager.stop(data.agentId);
    } catch (err) {
      logger.error("Failed to stop agent", CONTEXT, {
        agentId: data.agentId,
        error: String(err),
      });
      socket.emit("error", { message: `Failed to stop agent: ${String(err)}` });
    }
  });

  socket.on("agent:subscribe", async (data: { agentId: string }) => {
    socket.join(data.agentId);
    logger.info("Socket subscribed to agent room", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });

    // Send DB chat history for this agent as a fallback for clients that miss SSE events
    try {
      const agentHistory = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.agentId, data.agentId))
        .all();
      if (agentHistory.length > 0) {
        socket.emit("chat:history", { agentId: data.agentId, messages: agentHistory });
      }
    } catch (err) {
      logger.debug("Failed to send chat history on subscribe", CONTEXT, {
        agentId: data.agentId,
        error: String(err),
      });
    }
  });
}
