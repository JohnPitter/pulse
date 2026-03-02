import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { agents } from "../db/schema.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "agent-manager";

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
}
