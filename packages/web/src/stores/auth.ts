import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  needsSetup: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  login: (password: string) => Promise<boolean>;
  setup: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  needsSetup: false,
  error: null,

  checkAuth: async () => {
    try {
      // Check if password is configured
      const statusRes = await fetch("/api/auth/status");
      const statusData = await statusRes.json();

      if (!statusData.configured) {
        set({ isAuthenticated: false, needsSetup: true, isLoading: false });
        return;
      }

      // Check if already authenticated
      const res = await fetch("/api/auth/check", { credentials: "include" });
      set({ isAuthenticated: res.ok, needsSetup: false, isLoading: false });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  login: async (password: string) => {
    try {
      set({ error: null });
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        set({ error: data.error || "Login failed" });
        return false;
      }
      set({ isAuthenticated: true });
      return true;
    } catch {
      set({ error: "Connection failed" });
      return false;
    }
  },

  setup: async (password: string) => {
    try {
      set({ error: null });
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        set({ error: data.error || "Setup failed" });
        return false;
      }
      set({ isAuthenticated: true, needsSetup: false });
      return true;
    } catch {
      set({ error: "Connection failed" });
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Logout even if the request fails
    }
    set({ isAuthenticated: false });
  },
}));
