import { create } from "zustand";
import { getSocket, emitEvent } from "./socket";

export interface Agent {
  id: string;
  name: string;
  projectPath: string;
  claudeMd: string | null;
  initialPrompt: string | null;
  model: string;
  thinkingEnabled: number;
  permissionMode: string;
  status: string;
  tmuxSession: string | null;
  pid: number | null;
  lastMessage: string | null;
  lastActiveAt: string | null;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentPayload {
  name: string;
  projectPath: string;
  model?: string;
  thinkingEnabled?: boolean;
  permissionMode?: string;
  claudeMd?: string;
  initialPrompt?: string;
}

interface AgentStatusEvent {
  agentId: string;
  status: string;
  lastMessage?: string;
  lastActiveAt?: string;
}

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  fetchAgents: () => Promise<void>;
  createAgent: (payload: CreateAgentPayload) => Promise<Agent | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  startAgent: (id: string) => void;
  stopAgent: (id: string) => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  loading: false,
  error: null,
  connected: false,

  fetchAgents: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/agents", { credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        set({ error: data.error || "Failed to fetch agents", loading: false });
        return;
      }
      const agents: Agent[] = await res.json();
      set({ agents, loading: false });
    } catch {
      set({ error: "Connection failed", loading: false });
    }
  },

  createAgent: async (payload: CreateAgentPayload) => {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        set({ error: data.error || "Failed to create agent" });
        return null;
      }
      const agent: Agent = await res.json();
      set((state) => ({ agents: [...state.agents, agent] }));
      return agent;
    } catch {
      set({ error: "Connection failed" });
      return null;
    }
  },

  deleteAgent: async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) return false;
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
      }));
      return true;
    } catch {
      return false;
    }
  },

  startAgent: (id: string) => {
    emitEvent("agent:start", { agentId: id });
  },

  stopAgent: (id: string) => {
    emitEvent("agent:stop", { agentId: id });
  },

  connectSocket: () => {
    if (get().connected) return;
    const socket = getSocket();

    socket.on("agent:status", (data: AgentStatusEvent) => {
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === data.agentId
            ? {
                ...a,
                status: data.status,
                lastMessage: data.lastMessage ?? a.lastMessage,
                lastActiveAt: data.lastActiveAt ?? a.lastActiveAt,
              }
            : a,
        ),
      }));
    });

    socket.on("connect", () => {
      set({ connected: true });
    });

    socket.on("disconnect", () => {
      set({ connected: false });
    });

    set({ connected: socket.connected });
  },

  disconnectSocket: () => {
    // Don't disconnect the singleton — other components may need it.
    // Just mark this store as not listening.
    set({ connected: false });
  },
}));
