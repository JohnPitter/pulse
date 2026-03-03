import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { Server as SocketIOServer } from "socket.io";

import { agents, chatMessages } from "../db/schema.js";
import * as logger from "../lib/logger.js";
import { ChatParser } from "./chat-parser.js";
import {
  registerTerminalSession,
  getTerminalSession,
  destroyTerminalSession,
  writeToTerminal,
} from "./terminal.js";
import {
  tmuxSessionName,
  sessionExists,
  createTmuxSession,
  captureTmuxPane,
  killTmuxSession,
  attachToSession,
} from "./tmux.js";

const CONTEXT = "agent-manager";
const INITIAL_PROMPT_DELAY_MS = 2000;

const PERMISSION_MODE_FLAGS: Record<string, string> = {
  bypassPermissions: "--dangerously-skip-permissions",
  acceptEdits: "--acceptEdits",
  plan: "--plan",
};

export interface CreateAgentInput {
  name: string;
  projectPath: string;
  claudeMd?: string;
  initialPrompt?: string;
  model?: string;
  thinkingEnabled?: number;
  permissionMode?: string;
}

export interface UpdateAgentInput {
  name?: string;
  projectPath?: string;
  claudeMd?: string;
  initialPrompt?: string;
  model?: string;
  thinkingEnabled?: number;
  permissionMode?: string;
  status?: string;
  tmuxSession?: string | null;
  pid?: number | null;
  lastMessage?: string | null;
  lastActiveAt?: string | null;
  startedAt?: string | null;
}

export interface ClaudeCommandOptions {
  model: string;
  thinkingEnabled: number;
  permissionMode: string;
}

type AgentRow = typeof agents.$inferSelect;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AgentManager {
  private db: BetterSQLite3Database<any>;
  private parsers = new Map<string, ChatParser>();

  constructor(db: BetterSQLite3Database<any>) {
    this.db = db;
  }

  async createAgent(input: CreateAgentInput): Promise<AgentRow> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const values = {
      id,
      name: input.name,
      projectPath: input.projectPath,
      claudeMd: input.claudeMd ?? null,
      initialPrompt: input.initialPrompt ?? null,
      model: input.model ?? "sonnet",
      thinkingEnabled: input.thinkingEnabled ?? 0,
      permissionMode: input.permissionMode ?? "bypassPermissions",
      status: "stopped",
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(agents).values(values);

    logger.info(`Agent created: ${input.name}`, CONTEXT, { agentId: id });

    const [created] = await this.db
      .select()
      .from(agents)
      .where(eq(agents.id, id));

    return created;
  }

  async listAgents(): Promise<AgentRow[]> {
    return this.db.select().from(agents);
  }

  async getAgent(id: string): Promise<AgentRow | undefined> {
    const [agent] = await this.db
      .select()
      .from(agents)
      .where(eq(agents.id, id));

    return agent;
  }

  async updateAgent(id: string, input: UpdateAgentInput): Promise<AgentRow | undefined> {
    const existing = await this.getAgent(id);
    if (!existing) {
      return undefined;
    }

    const now = new Date().toISOString();

    await this.db
      .update(agents)
      .set({ ...input, updatedAt: now })
      .where(eq(agents.id, id));

    logger.info(`Agent updated: ${id}`, CONTEXT, { agentId: id });

    return this.getAgent(id);
  }

  async deleteAgent(id: string): Promise<boolean> {
    const existing = await this.getAgent(id);
    if (!existing) {
      return false;
    }

    // Kill tmux session if alive
    const tmuxName = tmuxSessionName(id);
    if (await sessionExists(tmuxName)) {
      await killTmuxSession(tmuxName);
    }

    // Destroy pty session
    destroyTerminalSession(id);
    this.destroyParser(id);

    await this.db.delete(agents).where(eq(agents.id, id));

    logger.info(`Agent deleted: ${id}`, CONTEXT, { agentId: id });

    return true;
  }

  buildClaudeCommand(options: ClaudeCommandOptions): string[] {
    const args: string[] = ["claude", "--model", options.model];

    if (options.thinkingEnabled === 1) {
      args.push("--thinking");
    }

    const permissionFlag = PERMISSION_MODE_FLAGS[options.permissionMode];
    if (permissionFlag) {
      args.push(permissionFlag);
    }

    return args;
  }

  /**
   * Starts an agent by creating (or reattaching to) a tmux session.
   *
   * Flow:
   * 1. Check if tmux session already exists → reattach pty only
   * 2. If not, create tmux session with Claude CLI
   * 3. Attach pty to tmux session
   * 4. Replay history via tmux capture-pane
   * 5. Wire pty output to socket events + ChatParser
   * 6. On pty exit: DON'T kill tmux, just detach listener
   */
  async startAgent(id: string, io: SocketIOServer): Promise<void> {
    const agent = await this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    const tmuxName = tmuxSessionName(id);
    const existingPty = getTerminalSession(id);

    // If we already have a pty attached, agent is truly running
    if (existingPty) {
      logger.info(`Agent already has active pty session`, CONTEXT, { agentId: id });
      return;
    }

    const tmuxAlive = await sessionExists(tmuxName);

    if (!tmuxAlive) {
      // No tmux session — create one with the Claude command
      const command = this.buildClaudeCommand({
        model: agent.model,
        thinkingEnabled: agent.thinkingEnabled,
        permissionMode: agent.permissionMode,
      });

      logger.info(`Creating tmux session for agent: ${agent.name}`, CONTEXT, {
        agentId: id,
        tmuxName,
        command: command.join(" "),
      });

      // Build env with HOME/.local/bin in PATH
      const home = process.env.HOME ?? "";
      const localBin = home ? `${home}/.local/bin` : "";
      const currentPath = process.env.PATH ?? "";
      const envPath =
        localBin && !currentPath.includes(localBin)
          ? `${localBin}:${currentPath}`
          : currentPath;

      await createTmuxSession(tmuxName, agent.projectPath, command, {
        ...process.env as Record<string, string>,
        PATH: envPath,
      });
    } else {
      logger.info(`Reattaching to existing tmux session: ${tmuxName}`, CONTEXT, { agentId: id });
    }

    // Attach pty to the tmux session
    const ptyProcess = attachToSession(tmuxName, agent.projectPath);
    const session = registerTerminalSession(id, ptyProcess, tmuxName);

    // Setup ChatParser
    const parser = new ChatParser();
    this.parsers.set(id, parser);

    // Send history replay from tmux capture
    const history = await captureTmuxPane(tmuxName);
    if (history.trim()) {
      io.to(id).emit("terminal:history", { agentId: id, data: history });
    }

    // Buffer recent output for debugging exit errors
    let recentOutput = "";

    // Wire pty output -> terminal:output event + feed ChatParser
    session.pty.onData((data: string) => {
      io.to(id).emit("terminal:output", { agentId: id, data });
      parser.feed(data);
      // Keep last 2KB of output for exit debugging
      recentOutput = (recentOutput + data).slice(-2048);
    });

    // Wire ChatParser message -> agent:message event + update lastMessage in DB
    parser.onMessage((content: string) => {
      io.to(id).emit("agent:message", { agentId: id, role: "assistant", content });

      // Save assistant message to chat_messages
      this.db
        .insert(chatMessages)
        .values({
          id: uuidv4(),
          agentId: id,
          role: "assistant",
          content,
          timestamp: new Date().toISOString(),
        })
        .catch((err: unknown) => {
          logger.error(`Failed to save assistant message`, CONTEXT, {
            agentId: id,
            error: String(err),
          });
        });

      // Update lastMessage in agent record
      this.updateAgent(id, {
        lastMessage: content,
        lastActiveAt: new Date().toISOString(),
      }).catch((err: unknown) => {
        logger.error(`Failed to update lastMessage`, CONTEXT, {
          agentId: id,
          error: String(err),
        });
      });
    });

    // Wire ChatParser waiting -> agent:waiting event + update status
    parser.onWaiting((content: string) => {
      io.to(id).emit("agent:waiting", { agentId: id, content });
      io.to(id).emit("agent:status", { agentId: id, status: "waiting" });

      this.updateAgent(id, { status: "waiting" }).catch((err: unknown) => {
        logger.error(`Failed to update status to waiting`, CONTEXT, {
          agentId: id,
          error: String(err),
        });
      });
    });

    // Wire pty exit -> DON'T kill tmux, just detach pty listener
    session.pty.onExit(({ exitCode }) => {
      logger.info(`Agent pty detached (tmux session preserved)`, CONTEXT, {
        agentId: id,
        exitCode,
        tmuxName,
      });

      // Log recent output on error for debugging
      if (exitCode !== 0 && recentOutput.trim()) {
        logger.error(`Agent output before pty exit`, CONTEXT, {
          agentId: id,
          output: recentOutput.trim().slice(-500),
        });
      }

      this.destroyParser(id);

      // Check if tmux session is still alive — determines status
      sessionExists(tmuxName).then((alive: boolean) => {
        const status = alive ? "idle" : (exitCode === 0 ? "idle" : "error");
        this.updateAgent(id, {
          status,
          pid: null,
        }).catch((err: unknown) => {
          logger.error(`Failed to update agent on pty exit`, CONTEXT, {
            agentId: id,
            error: String(err),
          });
        });
        io.to(id).emit("agent:status", { agentId: id, status });
      });
    });

    // Update DB: running status with pid and tmux session name
    const now = new Date().toISOString();
    await this.updateAgent(id, {
      status: "running",
      pid: session.pty.pid,
      tmuxSession: tmuxName,
      startedAt: tmuxAlive ? agent.startedAt : now,
    });

    io.to(id).emit("agent:status", { agentId: id, status: "running" });

    // If agent has an initialPrompt and this is a fresh session, send it after delay
    if (!tmuxAlive && agent.initialPrompt) {
      setTimeout(() => {
        const currentSession = getTerminalSession(id);
        if (currentSession) {
          logger.info(`Sending initial prompt`, CONTEXT, { agentId: id });
          currentSession.pty.write(agent.initialPrompt + "\n");
        }
      }, INITIAL_PROMPT_DELAY_MS);
    }

    logger.info(`Agent started: ${agent.name}`, CONTEXT, {
      agentId: id,
      pid: session.pty.pid,
      tmuxName,
      reattached: tmuxAlive,
    });
  }

  /**
   * Stops an agent: kills the tmux session, destroys pty, updates DB.
   */
  async stopAgent(id: string, io: SocketIOServer): Promise<void> {
    const agent = await this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    logger.info(`Stopping agent: ${agent.name}`, CONTEXT, { agentId: id });

    // Destroy pty first (detach from tmux)
    destroyTerminalSession(id);
    this.destroyParser(id);

    // Kill the tmux session
    const tmuxName = tmuxSessionName(id);
    await killTmuxSession(tmuxName);

    await this.updateAgent(id, {
      status: "stopped",
      pid: null,
      tmuxSession: null,
      startedAt: null,
    });

    io.to(id).emit("agent:status", { agentId: id, status: "stopped" });

    logger.info(`Agent stopped: ${agent.name}`, CONTEXT, { agentId: id });
  }

  /**
   * Sends a message to a running agent by writing to its terminal stdin.
   * Flushes the parser to process any buffered output before the new input.
   */
  sendMessage(id: string, content: string): void {
    const session = getTerminalSession(id);
    if (!session) {
      throw new Error(`No active terminal session for agent: ${id}`);
    }

    const parser = this.parsers.get(id);
    if (parser) {
      parser.flush();
    }

    writeToTerminal(id, content + "\n");

    logger.debug(`Message sent to agent`, CONTEXT, {
      agentId: id,
      contentLength: content.length,
    });
  }

  /**
   * Cleans up a parser for the given agent.
   */
  private destroyParser(id: string): void {
    const parser = this.parsers.get(id);
    if (parser) {
      parser.destroy();
      this.parsers.delete(id);
    }
  }
}
