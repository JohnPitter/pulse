import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as pty from "node-pty";
import * as logger from "../lib/logger.js";

const execFileAsync = promisify(execFile);
const CONTEXT = "tmux";
const SESSION_PREFIX = "pulse-";

/**
 * Derives the tmux session name from an agent ID.
 * Uses the first 8 characters prefixed with "pulse-".
 */
export function tmuxSessionName(agentId: string): string {
  return `${SESSION_PREFIX}${agentId.slice(0, 8)}`;
}

/**
 * Checks whether a tmux session with the given name exists.
 */
export async function sessionExists(name: string): Promise<boolean> {
  try {
    await execFileAsync("tmux", ["has-session", "-t", name]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a detached tmux session that runs the Claude CLI.
 * Uses tmux new-session -d + send-keys (CWE-78 safe: execFile with args array).
 */
export async function createTmuxSession(
  name: string,
  cwd: string,
  claudeArgs: string[],
  env?: Record<string, string>,
): Promise<void> {
  // Create detached session with a shell
  await execFileAsync("tmux", [
    "new-session",
    "-d",
    "-s", name,
    "-x", "120",
    "-y", "40",
  ], { cwd, env: { ...process.env, ...env } as NodeJS.ProcessEnv });

  // Build the claude command string for send-keys
  const claudeCmd = claudeArgs
    .map((arg) => {
      // Quote args that contain spaces
      if (arg.includes(" ")) return `"${arg}"`;
      return arg;
    })
    .join(" ");

  // Send the command to the session
  await execFileAsync("tmux", [
    "send-keys",
    "-t", name,
    claudeCmd,
    "Enter",
  ]);

  logger.info(`tmux session created: ${name}`, CONTEXT, { cwd, command: claudeCmd });
}

/**
 * Captures the visible pane content of a tmux session.
 * Returns the raw text (may include ANSI codes).
 */
export async function captureTmuxPane(
  name: string,
  lines = 10000,
): Promise<string> {
  try {
    const { stdout } = await execFileAsync("tmux", [
      "capture-pane",
      "-t", name,
      "-p",
      "-S", `-${lines}`,
    ]);
    return stdout;
  } catch (err) {
    logger.warn(`Failed to capture tmux pane: ${name}`, CONTEXT, { error: String(err) });
    return "";
  }
}

/**
 * Kills a tmux session by name.
 */
export async function killTmuxSession(name: string): Promise<void> {
  try {
    await execFileAsync("tmux", ["kill-session", "-t", name]);
    logger.info(`tmux session killed: ${name}`, CONTEXT);
  } catch (err) {
    logger.warn(`Failed to kill tmux session: ${name}`, CONTEXT, { error: String(err) });
  }
}

/**
 * Lists all alive tmux sessions that match the pulse- prefix.
 * Returns an array of session names.
 */
export async function listAliveSessions(): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("tmux", [
      "list-sessions",
      "-F", "#{session_name}",
    ]);
    return stdout
      .trim()
      .split("\n")
      .filter((name) => name.startsWith(SESSION_PREFIX));
  } catch {
    // No tmux server running or no sessions
    return [];
  }
}

/**
 * Attaches a node-pty process to an existing tmux session.
 * Returns the IPty instance for streaming output to the frontend.
 */
export function attachToSession(name: string, cwd: string): pty.IPty {
  const home = process.env.HOME ?? "";
  const localBin = home ? `${home}/.local/bin` : "";
  const currentPath = process.env.PATH ?? "";
  const envPath =
    localBin && !currentPath.includes(localBin)
      ? `${localBin}:${currentPath}`
      : currentPath;

  const ptyProcess = pty.spawn("tmux", ["attach-session", "-t", name], {
    name: "xterm-256color",
    cols: 120,
    rows: 40,
    cwd,
    env: { ...process.env, PATH: envPath } as Record<string, string>,
  });

  logger.info(`Attached pty to tmux session: ${name}`, CONTEXT, { pid: ptyProcess.pid });

  return ptyProcess;
}
