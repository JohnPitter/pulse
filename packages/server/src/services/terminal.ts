import * as pty from "node-pty";
import * as logger from "../lib/logger.js";

const CONTEXT = "terminal";

export interface TerminalSession {
  pty: pty.IPty;
  agentId: string;
}

const sessions = new Map<string, TerminalSession>();

/**
 * Spawns a new terminal session for the given agent.
 * Uses node-pty with xterm-256color, 120x40 dimensions.
 */
export function createTerminalSession(
  agentId: string,
  command: string[],
  cwd: string,
): TerminalSession {
  const shell = command[0];
  const args = command.slice(1);

  // Build env with HOME/.local/bin in PATH (for Claude CLI binary)
  const home = process.env.HOME ?? "";
  const localBin = home ? `${home}/.local/bin` : "";
  const currentPath = process.env.PATH ?? "";
  const envPath = localBin && !currentPath.includes(localBin)
    ? `${localBin}:${currentPath}`
    : currentPath;

  const ptyProcess = pty.spawn(shell, args, {
    name: "xterm-256color",
    cols: 120,
    rows: 40,
    cwd,
    env: { ...process.env, PATH: envPath } as Record<string, string>,
  });

  const session: TerminalSession = {
    pty: ptyProcess,
    agentId,
  };

  sessions.set(agentId, session);

  logger.info(`Terminal session created`, CONTEXT, {
    agentId,
    pid: ptyProcess.pid,
    shell,
    cwd,
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
