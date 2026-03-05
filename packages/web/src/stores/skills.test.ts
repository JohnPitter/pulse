import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSkillsStore } from "./skills";

describe("useSkillsStore", () => {
  beforeEach(() => {
    useSkillsStore.setState({ skills: [], loading: false });
    vi.restoreAllMocks();
  });

  it("fetchSkills populates skills from API", async () => {
    const mockSkills = [
      { id: "s1", name: "Batch Scheduler", description: "Plans executions", type: "tool" as const, config: {}, enabledByDefault: false },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockSkills,
    } as Response);

    await useSkillsStore.getState().fetchSkills();

    expect(useSkillsStore.getState().skills).toEqual(mockSkills);
  });

  it("does not fetch while already loading", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    useSkillsStore.setState({ loading: true });

    await useSkillsStore.getState().fetchSkills();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
