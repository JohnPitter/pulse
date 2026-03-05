import { create } from "zustand";

export interface TaskStats {
  counts: Record<string, number>;
  completionRate: number;
  total: number;
}

export interface LastExecution {
  id: string;
  taskId: string;
  agentId: string;
  result: string | null;
  summary: string | null;
  logsCount: number;
  startedAt: string;
  endedAt: string | null;
  task: { id: string; title: string } | null;
}

interface DashboardState {
  stats: TaskStats | null;
  lastExecution: LastExecution | null;
  loading: boolean;
  fetch: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  lastExecution: null,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const [statsRes, lastRes] = await Promise.all([
        fetch("/api/tasks/stats", { credentials: "include" }),
        fetch("/api/tasks/last-execution", { credentials: "include" }),
      ]);
      const stats = statsRes.ok ? (await statsRes.json() as TaskStats) : null;
      const lastExecution = lastRes.ok ? (await lastRes.json() as LastExecution | null) : null;
      set({ stats, lastExecution });
    } finally {
      set({ loading: false });
    }
  },
}));
