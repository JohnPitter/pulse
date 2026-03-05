import { create } from "zustand";

export type TaskStatus = "backlog" | "scheduled" | "running" | "completed" | "failed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  scheduledAt: string | null;
  agentId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: string;
  scheduledAt?: string;
  agentId?: string;
  projectId?: string;
}

interface TasksState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<Task | null>;
  updateTask: (id: string, payload: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (res.ok) set({ tasks: await res.json() as Task[] });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (payload) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const task = await res.json() as Task;
      set((s) => ({ tasks: [task, ...s.tasks] }));
      return task;
    } catch { return null; }
  },

  updateTask: async (id, payload) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const task = await res.json() as Task;
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
      return task;
    } catch { return null; }
  },

  deleteTask: async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) return false;
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      return true;
    } catch { return false; }
  },
}));
