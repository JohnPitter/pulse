/**
 * Tmux service — stubbed. Tmux is no longer used; agent execution is now
 * handled entirely by the Agent SDK session in agent-session.ts.
 *
 * This file is preserved for API compatibility while index.ts reconciliation
 * and other callers are fully cleaned up in Task 8 (Socket.io cleanup).
 */

export function tmuxSessionName(agentId: string): string {
  return `pulse-${agentId.slice(0, 8)}`;
}

export async function sessionExists(_name: string): Promise<boolean> {
  return false;
}

export async function listAliveSessions(): Promise<string[]> {
  return [];
}
