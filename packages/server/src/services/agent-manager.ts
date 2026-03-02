import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { Server as SocketIOServer } from "socket.io";

import { agents, chatMessages } from "../db/schema.js";
import * as logger from "../lib/logger.js";
import { ChatParser } from "./chat-parser.js";
import {
  createTerminalSession,
  getTerminalSession,
  destroyTerminalSession,
  writeToTerminal,
} from "./terminal.js";

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
   * Starts an agent: spawns the Claude CLI process via node-pty,
   * wires output to socket events and ChatParser, updates DB status.
   */
  async startAgent(id: string, io: SocketIOServer): Promise<void> {
    const agent = await this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    // If DB says running but no terminal session exists (e.g. server restart),
    // reset status and allow re-start
    if (agent.status === "running" || agent.status === "waiting") {
      const existingSession = getTerminalSession(id);
      if (existingSession) {
        logger.info(`Agent already running with active session`, CONTEXT, { agentId: id });
        return;
      }
      logger.warn(`Agent status is '${agent.status}' but no terminal session found — resetting`, CONTEXT, { agentId: id });
      await this.updateAgent(id, { status: "stopped", pid: null, tmuxSession: null });
    }

    const command = this.buildClaudeCommand({
      model: agent.model,
      thinkingEnabled: agent.thinkingEnabled,
      permissionMode: agent.permissionMode,
    });

    logger.info(`Starting agent: ${agent.name}`, CONTEXT, { agentId: id, command: command.join(" ") });

    const session = createTerminalSession(id, command, agent.projectPath);
    const parser = new ChatParser();
    this.parsers.set(id, parser);

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

    // Wire pty exit -> update status to idle or error
    session.pty.onExit(({ exitCode }) => {
      const status = exitCode === 0 ? "idle" : "error";
      logger.info(`Agent process exited`, CONTEXT, {
        agentId: id,
        exitCode,
        status,
      });

      // Log recent output on error for debugging
      if (exitCode !== 0 && recentOutput.trim()) {
        logger.error(`Agent stderr/output before exit`, CONTEXT, {
          agentId: id,
          output: recentOutput.trim().slice(-500),
        });
      }

      this.parsers.delete(id);

      this.updateAgent(id, {
        status,
        pid: null,
        tmuxSession: null,
      }).catch((err: unknown) => {
        logger.error(`Failed to update agent on exit`, CONTEXT, {
          agentId: id,
          error: String(err),
        });
      });

      io.to(id).emit("agent:status", { agentId: id, status });
    });

    // Update DB: running status with pid
    await this.updateAgent(id, {
      status: "running",
      pid: session.pty.pid,
      tmuxSession: `pulse-${id.slice(0, 8)}`,
    });

    io.to(id).emit("agent:status", { agentId: id, status: "running" });

    // If agent has an initialPrompt, send it after a short delay
    if (agent.initialPrompt) {
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
    });
  }

  /**
   * Stops an agent: destroys the terminal session and updates DB status.
   */
  async stopAgent(id: string, io: SocketIOServer): Promise<void> {
    const agent = await this.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    logger.info(`Stopping agent: ${agent.name}`, CONTEXT, { agentId: id });

    destroyTerminalSession(id);
    this.parsers.delete(id);

    await this.updateAgent(id, {
      status: "stopped",
      pid: null,
      tmuxSession: null,
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
}
