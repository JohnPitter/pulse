import { create } from "zustand";

export type SkillType = "tool" | "prompt" | "mcp";

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  config: Record<string, unknown>;
  enabledByDefault: boolean;
}

interface SkillsState {
  skills: Skill[];
  loading: boolean;
  fetchSkills: () => Promise<void>;
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  loading: false,

  fetchSkills: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/skills", { credentials: "include" });
      if (res.ok) set({ skills: await res.json() as Skill[] });
    } finally {
      set({ loading: false });
    }
  },
}));
