import { create } from "zustand";
import type { Block } from "../components/canvas/CanvasBlock";
import type { Message } from "../components/chat/ChatSidebar";

interface AgentSessionState {
  blocks: Record<string, Block[]>;
  streamingText: Record<string, string>;
  messages: Record<string, Message[]>;
  isStreaming: Record<string, boolean>;
  eventSources: Record<string, EventSource>;

  connectSSE: (agentId: string) => void;
  disconnectSSE: (agentId: string) => void;
  sendMessage: (agentId: string, content: string, imageBase64?: string) => Promise<void>;
  loadMessages: (agentId: string) => Promise<void>;
  stopAgent: (agentId: string) => Promise<void>;
}

export const useSessionStore = create<AgentSessionState>((set, get) => ({
  blocks: {},
  streamingText: {},
  messages: {},
  isStreaming: {},
  eventSources: {},

  connectSSE(agentId) {
    if (get().eventSources[agentId]) return;

    const es = new EventSource(`/api/agents/${agentId}/stream`, { withCredentials: true });

    es.addEventListener("text_delta", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { delta: string };
      set((s) => ({
        streamingText: {
          ...s.streamingText,
          [agentId]: (s.streamingText[agentId] ?? "") + data.delta,
        },
        isStreaming: { ...s.isStreaming, [agentId]: true },
      }));
    });

    es.addEventListener("tool_use", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { name: string; input: unknown };
      set((s) => {
        const existing = s.blocks[agentId] ?? [];
        return {
          blocks: {
            ...s.blocks,
            [agentId]: [...existing, { type: "tool_use", name: data.name, input: data.input }],
          },
        };
      });
    });

    es.addEventListener("tool_result", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { name: string; output: string };
      set((s) => {
        const existing = s.blocks[agentId] ?? [];
        return {
          blocks: {
            ...s.blocks,
            [agentId]: [...existing, { type: "tool_result", name: data.name, output: data.output }],
          },
        };
      });
    });

    es.addEventListener("done", () => {
      set((s) => {
        const text = s.streamingText[agentId] ?? "";
        const existing = s.blocks[agentId] ?? [];
        const newBlocks = text
          ? [...existing, { type: "text" as const, content: text }]
          : existing;
        return {
          blocks: { ...s.blocks, [agentId]: newBlocks },
          streamingText: { ...s.streamingText, [agentId]: "" },
          isStreaming: { ...s.isStreaming, [agentId]: false },
        };
      });
      get().loadMessages(agentId);
    });

    es.addEventListener("status", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { status: string };
      if (data.status === "stopped" || data.status === "error") {
        set((s) => ({
          isStreaming: { ...s.isStreaming, [agentId]: false },
          streamingText: { ...s.streamingText, [agentId]: "" },
        }));
      }
    });

    set((s) => ({ eventSources: { ...s.eventSources, [agentId]: es } }));
  },

  disconnectSSE(agentId) {
    const es = get().eventSources[agentId];
    if (es) {
      es.close();
      set((s) => {
        const { [agentId]: _removed, ...rest } = s.eventSources;
        return { eventSources: rest };
      });
    }
  },

  async sendMessage(agentId, content, imageBase64) {
    set((s) => ({
      blocks: { ...s.blocks, [agentId]: [] },
      streamingText: { ...s.streamingText, [agentId]: "" },
      isStreaming: { ...s.isStreaming, [agentId]: true },
    }));

    await fetch(`/api/agents/${agentId}/message`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageBase64 }),
    });
  },

  async loadMessages(agentId) {
    const res = await fetch(`/api/agents/${agentId}/messages?limit=50`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json() as Array<{ id: string; role: string; content: string; createdAt: number }>;
    const messages: Message[] = data.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
    }));
    set((s) => ({ messages: { ...s.messages, [agentId]: messages } }));
  },

  async stopAgent(agentId) {
    await fetch(`/api/agents/${agentId}/stop`, { method: "POST", credentials: "include" });
    set((s) => ({
      isStreaming: { ...s.isStreaming, [agentId]: false },
      streamingText: { ...s.streamingText, [agentId]: "" },
    }));
  },
}));
