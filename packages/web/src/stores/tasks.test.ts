import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTasksStore } from "./tasks";

describe("useTasksStore", () => {
  beforeEach(() => {
    useTasksStore.setState({ tasks: [], loading: false });
    vi.restoreAllMocks();
  });

  it("fetchTasks populates tasks from API", async () => {
    const mockTasks = [
      { id: "t1", title: "Test task", status: "backlog", priority: "medium", description: null, dueAt: null, scheduledAt: null, agentId: null, projectId: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockTasks,
    } as Response);

    await useTasksStore.getState().fetchTasks();

    expect(useTasksStore.getState().tasks).toEqual(mockTasks);
    expect(useTasksStore.getState().loading).toBe(false);
  });

  it("createTask sends POST and adds task to state", async () => {
    const newTask = {
      id: "t2", title: "New task", status: "backlog", priority: "high",
      description: null, dueAt: null, scheduledAt: null, agentId: null,
      projectId: null, createdAt: "2026-01-01", updatedAt: "2026-01-01",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => newTask,
    } as Response);

    const result = await useTasksStore.getState().createTask({ title: "New task", priority: "high" });

    expect(result).toEqual(newTask);
    expect(useTasksStore.getState().tasks).toContainEqual(newTask);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/tasks", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ title: "New task", priority: "high" }),
    }));
  });

  it("createTask returns null on failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "bad request" }),
    } as Response);

    const result = await useTasksStore.getState().createTask({ title: "" });
    expect(result).toBeNull();
  });

  it("deduplicates concurrent fetchTasks calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    useTasksStore.setState({ loading: true });

    await useTasksStore.getState().fetchTasks();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("updateTask sends PATCH and updates state", async () => {
    useTasksStore.setState({
      tasks: [{ id: "t1", title: "Old", status: "backlog", priority: "low", description: null, dueAt: null, scheduledAt: null, agentId: null, projectId: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" }],
    });
    const updated = { id: "t1", title: "Old", status: "scheduled", priority: "low", description: null, dueAt: null, scheduledAt: "2026-03-05T10:00:00Z", agentId: null, projectId: null, createdAt: "2026-01-01", updatedAt: "2026-03-05" };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => updated,
    } as Response);

    const result = await useTasksStore.getState().updateTask("t1", { status: "scheduled", scheduledAt: "2026-03-05T10:00:00Z" });

    expect(result).toEqual(updated);
    expect(useTasksStore.getState().tasks[0].status).toBe("scheduled");
  });

  it("deleteTask removes task from state", async () => {
    useTasksStore.setState({
      tasks: [{ id: "t1", title: "To delete", status: "backlog", priority: "low", description: null, dueAt: null, scheduledAt: null, agentId: null, projectId: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" }],
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
    } as Response);

    const result = await useTasksStore.getState().deleteTask("t1");

    expect(result).toBe(true);
    expect(useTasksStore.getState().tasks).toHaveLength(0);
  });
});
