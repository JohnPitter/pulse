/**
 * Terminal service — stubbed. node-pty removed; terminal I/O is now handled
 * by the Agent SDK session in agent-session.ts.
 *
 * This file is preserved for API compatibility while socket/terminal.ts is
 * fully cleaned up in Task 8 (Socket.io cleanup).
 */

export function writeToTerminal(_agentId: string, _data: string): boolean {
  return false;
}

export function resizeTerminal(_agentId: string, _cols: number, _rows: number): boolean {
  return false;
}
