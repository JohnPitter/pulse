import type { Socket, Server } from "socket.io";

import { writeToTerminal } from "../services/terminal.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "socket:terminal";

/**
 * Registers terminal event handlers on the given socket.
 *
 * Events handled:
 * - `terminal:input` — writes raw data to the agent's pty stdin
 */
export function setupTerminalHandlers(socket: Socket, _io: Server): void {
  socket.on("terminal:input", (data: { agentId: string; data: string }) => {
    logger.debug("Terminal input received", CONTEXT, {
      agentId: data.agentId,
      socketId: socket.id,
    });

    const written = writeToTerminal(data.agentId, data.data);
    if (!written) {
      socket.emit("error", {
        message: `No active terminal session for agent: ${data.agentId}`,
      });
    }
  });
}
