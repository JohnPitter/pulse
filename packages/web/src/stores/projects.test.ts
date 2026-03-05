import { describe, it, expect, beforeEach, vi } from "vitest";
import { useProjectsStore } from "./projects";

describe("useProjectsStore", () => {
  beforeEach(() => {
    useProjectsStore.setState({ projects: [], loading: false });
    vi.restoreAllMocks();
  });

  it("fetchProjects populates projects from API", async () => {
    const mockProjects = [
      { id: "p1", name: "Alpha", description: "Desc", color: "#FF0000", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    } as Response);

    await useProjectsStore.getState().fetchProjects();

    expect(useProjectsStore.getState().projects).toEqual(mockProjects);
    expect(useProjectsStore.getState().loading).toBe(false);
  });

  it("does not fetch while already loading", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    useProjectsStore.setState({ loading: true });

    await useProjectsStore.getState().fetchProjects();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
