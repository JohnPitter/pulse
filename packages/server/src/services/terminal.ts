import * as pty from "node-pty";
import * as logger from "../lib/logger.js";

const CONTEXT = "terminal";

export interface TerminalSession {
  pty: pty.IPty;
  agentId: string;
  tmuxName: string;
}

const sessions = new Map<string, TerminalSession>();

/**
 * Registers a pty process (typically a tmux attach) as a terminal session.
 */
export function registerTerminalSession(
  agentId: string,
  ptyProcess: pty.IPty,
  tmuxName: string,
): TerminalSession {
  const session: TerminalSession = {
    pty: ptyProcess,
    agentId,
    tmuxName,
  };

  sessions.set(agentId, session);

  logger.info(`Terminal session registered`, CONTEXT, {
    agentId,
    pid: ptyProcess.pid,
    tmuxName,
  });

  return session;
}

/**
 * Retrieves an existing terminal session by agent ID.
 */
export function getTerminalSession(agentId: string): TerminalSession | undefined {
  return sessions.get(agentId);
}

/**
 * Destroys a terminal session: kills the pty process and removes from the map.
 */
export function destroyTerminalSession(agentId: string): boolean {
  const session = sessions.get(agentId);
  if (!session) {
    logger.warn(`No terminal session found for agent`, CONTEXT, { agentId });
    return false;
  }

  try {
    session.pty.kill();
  } catch (err) {
    logger.warn(`Failed to kill pty process`, CONTEXT, {
      agentId,
      error: String(err),
    });
  }

  sessions.delete(agentId);

  logger.info(`Terminal session destroyed`, CONTEXT, { agentId });

  return true;
}

/**
 * Writes data to the pty stdin of a running terminal session.
 */
export function writeToTerminal(agentId: string, data: string): boolean {
  const session = sessions.get(agentId);
  if (!session) {
    logger.warn(`Cannot write: no terminal session for agent`, CONTEXT, { agentId });
    return false;
  }

  session.pty.write(data);
  return true;
}

/**
 * Resizes the pty for a running terminal session.
 */
export function resizeTerminal(agentId: string, cols: number, rows: number): boolean {
  const session = sessions.get(agentId);
  if (!session) {
    return false;
  }

  try {
    session.pty.resize(cols, rows);
    return true;
  } catch (err) {
    logger.warn(`Failed to resize terminal`, CONTEXT, { agentId, error: String(err) });
    return false;
  }
}
