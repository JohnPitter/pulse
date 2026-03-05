import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDashboardStore } from "./dashboard";

describe("useDashboardStore", () => {
  beforeEach(() => {
    useDashboardStore.setState({ stats: null, lastExecution: null, loading: false });
    vi.restoreAllMocks();
  });

  it("fetch populates stats and lastExecution", async () => {
    const mockStats = { counts: { backlog: 5, scheduled: 3, running: 2, completed: 10, failed: 1 }, completionRate: 82, total: 21 };
    const mockExecution = { id: "e1", taskId: "t1", agentId: "a1", result: "success", summary: "OK", logsCount: 14, startedAt: "2026-01-01", endedAt: "2026-01-01", task: { id: "t1", title: "Task" } };

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockExecution } as Response);

    await useDashboardStore.getState().fetch();

    expect(useDashboardStore.getState().stats).toEqual(mockStats);
    expect(useDashboardStore.getState().lastExecution).toEqual(mockExecution);
    expect(useDashboardStore.getState().loading).toBe(false);
  });

  it("handles failed API calls gracefully", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);

    await useDashboardStore.getState().fetch();

    expect(useDashboardStore.getState().stats).toBeNull();
    expect(useDashboardStore.getState().lastExecution).toBeNull();
  });
});
