import type { Socket, Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

import { db } from "../db/index.js";
import { chatMessages } from "../db/schema.js";
import type { AgentManager } from "../services/agent-manager.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "socket:chat";

/**
 * Registers chat and agent lifecycle event handlers on the given socket.
 *
 * Events handled:
 * - `chat:send`       — sends a user message to the agent stdin
 * - `agent:start`     — spawns the agent process
 * - `agent:stop`      — stops the agent process
 * - `agent:subscribe` — joins the socket to the agent's room for events
 */
export function setupChatHandlers(
  socket: Socket,
  io: Server,
  agentManager: AgentManager,
): void {
  socket.on("chat:send", async (data: { agentId: string; content: string }) => {
    logger.info("Chat message received", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });

    try {
      // Save user message to chat_messages
      await db.insert(chatMessages).values({
        id: uuidv4(),
        agentId: data.agentId,
        role: "user",
        content: data.content,
        timestamp: new Date().toISOString(),
      });

      // Send to agent stdin
      agentManager.sendMessage(data.agentId, data.content);
    } catch (err) {
      logger.error("Failed to send chat message", CONTEXT, {
        agentId: data.agentId,
        error: String(err),
      });
      socket.emit("error", { message: `Failed to send message: ${String(err)}` });
    }
  });

  socket.on("agent:start", async (data: { agentId: string }) => {
    logger.info("Agent start requested", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });

    try {
      await agentManager.startAgent(data.agentId, io);
    } catch (err) {
      logger.error("Failed to start agent", CONTEXT, {
        agentId: data.agentId,
        error: String(err),
      });
      socket.emit("error", { message: `Failed to start agent: ${String(err)}` });
    }
  });

  socket.on("agent:stop", async (data: { agentId: string }) => {
    logger.info("Agent stop requested", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });

    try {
      await agentManager.stopAgent(data.agentId, io);
    } catch (err) {
      logger.error("Failed to stop agent", CONTEXT, {
        agentId: data.agentId,
        error: String(err),
      });
      socket.emit("error", { message: `Failed to stop agent: ${String(err)}` });
    }
  });

  socket.on("agent:subscribe", (data: { agentId: string }) => {
    socket.join(data.agentId);
    logger.info("Socket subscribed to agent room", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });
  });
}
