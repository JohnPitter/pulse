import type { Socket, Server } from "socket.io";
import * as logger from "../lib/logger.js";

const CONTEXT = "socket:chat";

/**
 * Registers chat event handlers on the given socket.
 * Listens for `chat:send` events with `{ agentId, content }` payload.
 * Will be wired to agent stdin in Task 8.
 */
export function setupChatHandlers(socket: Socket, _io: Server): void {
  socket.on("chat:send", (data: { agentId: string; content: string }) => {
    logger.info("Chat message received", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });
    // Will be wired to agent stdin in Task 8
  });
}
