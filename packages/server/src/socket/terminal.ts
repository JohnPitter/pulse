import type { Socket, Server } from "socket.io";
import * as logger from "../lib/logger.js";

const CONTEXT = "socket:terminal";

/**
 * Registers terminal event handlers on the given socket.
 * Listens for `terminal:input` events with `{ agentId, data }` payload.
 * Will be wired to agent pty in Task 8.
 */
export function setupTerminalHandlers(socket: Socket, _io: Server): void {
  socket.on("terminal:input", (data: { agentId: string; data: string }) => {
    logger.debug("Terminal input received", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });
    // Will be wired to agent pty in Task 8
  });
}
