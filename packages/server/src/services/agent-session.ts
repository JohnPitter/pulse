import { query } from "@anthropic-ai/claude-agent-sdk";
import { db } from "../db/index.js";
import { agents, chatMessages } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { sharedMemoryService } from "./shared-memory.js";
import { skillRegistry } from "./skill-registry.js";
import * as logger from "../lib/logger.js";
import { v4 as uuidv4 } from "uuid";

export type SessionEventCallback = (event: SessionEvent) => void;

export type SessionEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_use"; name: string; input: unknown }
  | { type: "tool_result"; name: string; output: string }
  | { type: "status"; status: AgentStatus }
  | { type: "error"; message: string }
  | { type: "done" };

export type AgentStatus = "running" | "waiting" | "idle" | "stopped" | "error";

interface ActiveSession {
  agentId: string;
  abortController: AbortController;
  subscribers: Set<SessionEventCallback>;
  status: AgentStatus;
}

const sessions = new Map<string, ActiveSession>();

export const agentSessionManager = {
  subscribe(agentId: string, cb: SessionEventCallback): () => void {
    const session = sessions.get(agentId);
    if (session) {
      session.subscribers.add(cb);
      cb({ type: "status", status: session.status });
    }
    return () => {
      sessions.get(agentId)?.subscribers.delete(cb);
    };
  },

  isRunning(agentId: string): boolean {
    return sessions.has(agentId);
  },

  async sendMessage(agentId: string, content: string, imageBase64?: string): Promise<void> {
    const agent = db.select().from(agents).where(eq(agents.id, agentId)).limit(1).get();
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    db.insert(chatMessages).values({
      id: uuidv4(),
      agentId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }).run();

    await this.stop(agentId);
    await this.start(agentId, content, imageBase64);
  },

  async start(agentId: string, prompt: string, imageBase64?: string): Promise<void> {
    if (sessions.has(agentId)) await this.stop(agentId);

    const agent = db.select().from(agents).where(eq(agents.id, agentId)).limit(1).get();
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    const agentSkillList = skillRegistry.getForAgent(agentId);
    const compiled = skillRegistry.compile(agentSkillList);
    const memory = sharedMemoryService.read();

    const systemPrompt = buildSystemPrompt(
      agent.initialPrompt ?? "You are a helpful AI assistant.",
      memory,
      compiled.systemPromptAdditions,
    );

    const abortController = new AbortController();
    const subscribers = new Set<SessionEventCallback>();

    const session: ActiveSession = {
      agentId,
      abortController,
      subscribers,
      status: "running",
    };
    sessions.set(agentId, session);

    emitToSession(session, { type: "status", status: "running" });
    updateAgentStatus(agentId, "running");

    // Run async without awaiting
    runSession(session, agent, systemPrompt, prompt, imageBase64, compiled).catch((err: unknown) => {
      logger.error(`Session error for ${agentId}: ${String(err)}`, "agent");
      emitToSession(session, { type: "error", message: String(err) });
      emitToSession(session, { type: "status", status: "error" });
      updateAgentStatus(agentId, "error");
      sessions.delete(agentId);
    });
  },

  async stop(agentId: string): Promise<void> {
    const session = sessions.get(agentId);
    if (!session) return;
    session.abortController.abort();
    sessions.delete(agentId);
    emitToSession(session, { type: "status", status: "stopped" });
    updateAgentStatus(agentId, "stopped");
  },
};

async function runSession(
  session: ActiveSession,
  agent: typeof agents.$inferSelect,
  systemPrompt: string,
  prompt: string,
  imageBase64: string | undefined,
  compiled: ReturnType<typeof skillRegistry.compile>,
): Promise<void> {
  let assistantText = "";

  try {
    const fullPrompt = imageBase64
      ? `${prompt}\n\n[User attached an image]`
      : prompt;

    const stream = query({
      prompt: fullPrompt,
      options: {
        abortController: session.abortController,
        cwd: agent.projectPath ?? process.cwd(),
        allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        systemPrompt,
        mcpServers: compiled.mcpServers,
        model: "claude-opus-4-6",
        maxTurns: 50,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        includePartialMessages: false,
      },
    });

    for await (const message of stream) {
      if (session.abortController.signal.aborted) break;

      const msgType = (message as Record<string, unknown>).type as string | undefined;

      if (msgType === "result") {
        // SDKResultSuccess — final result
        const resultMsg = message as { type: string; result?: string; subtype?: string };
        if (resultMsg.result) {
          assistantText = resultMsg.result;
        }
      } else if (msgType === "assistant") {
        // SDKAssistantMessage — assistant response with content blocks
        const assistantMsg = message as {
          type: string;
          message?: { content?: Array<{ type: string; text?: string; name?: string; input?: unknown; id?: string }> };
        };
        const content = assistantMsg.message?.content ?? [];
        for (const block of content) {
          if (block.type === "text" && block.text) {
            assistantText += block.text;
            emitToSession(session, { type: "text_delta", delta: block.text });
          } else if (block.type === "tool_use") {
            emitToSession(session, {
              type: "tool_use",
              name: block.name ?? "tool",
              input: block.input ?? {},
            });
          }
        }
      } else if (msgType === "tool_result") {
        const tm = message as { type: string; name?: string; content?: unknown };
        const output = typeof tm.content === "string" ? tm.content : JSON.stringify(tm.content);
        emitToSession(session, { type: "tool_result", name: tm.name ?? "", output });
      }
    }

    if (assistantText) {
      db.insert(chatMessages).values({
        id: uuidv4(),
        agentId: session.agentId,
        role: "assistant",
        content: assistantText,
        timestamp: new Date().toISOString(),
      }).run();
    }

    emitToSession(session, { type: "status", status: "idle" });
    emitToSession(session, { type: "done" });
    updateAgentStatus(session.agentId, "idle");
  } finally {
    sessions.delete(session.agentId);
  }
}

function emitToSession(session: ActiveSession, event: SessionEvent): void {
  for (const cb of session.subscribers) {
    try { cb(event); } catch { /* ignore */ }
  }
}

function updateAgentStatus(agentId: string, status: AgentStatus): void {
  db.update(agents).set({ status }).where(eq(agents.id, agentId)).run();
}

function buildSystemPrompt(role: string, memory: string, additions: string[]): string {
  const parts = [role, `## Shared Memory\n\n${memory}`];
  if (additions.length > 0) {
    parts.push("## Active Skills\n\n" + additions.join("\n\n"));
  }
  return parts.join("\n\n");
}
