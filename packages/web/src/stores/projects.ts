import { create } from "zustand";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (res.ok) set({ projects: await res.json() as Project[] });
    } finally {
      set({ loading: false });
    }
  },
}));
