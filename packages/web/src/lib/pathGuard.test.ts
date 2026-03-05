import { describe, it, expect } from "vitest";
import { isWithinRoot, clampParentPath } from "./pathGuard";

describe("isWithinRoot", () => {
  it("returns true when path is within root", () => {
    expect(isWithinRoot("/home/user/projects/sub", "/home/user/projects")).toBe(true);
  });

  it("returns true when path equals root", () => {
    expect(isWithinRoot("/home/user/projects", "/home/user/projects")).toBe(true);
  });

  it("returns false when path is above root", () => {
    expect(isWithinRoot("/home/user", "/home/user/projects")).toBe(false);
  });

  it("returns false when path is sibling of root", () => {
    expect(isWithinRoot("/home/other/projects", "/home/user/projects")).toBe(false);
  });

  it("handles Windows paths", () => {
    expect(isWithinRoot("C:\\Users\\john\\sub", "C:\\Users\\john")).toBe(true);
    expect(isWithinRoot("C:\\Users\\other", "C:\\Users\\john")).toBe(false);
  });
});

describe("clampParentPath", () => {
  it("returns parentPath when it is within root", () => {
    expect(clampParentPath("/home/user/projects/sub", "/home/user/projects")).toBe("/home/user/projects/sub");
  });

  it("returns null when parentPath would go above root", () => {
    expect(clampParentPath("/home/user", "/home/user/projects")).toBeNull();
  });

  it("returns null when parentPath equals root parent", () => {
    expect(clampParentPath("/home", "/home/user")).toBeNull();
  });

  it("returns parentPath when it equals root", () => {
    expect(clampParentPath("/home/user/projects", "/home/user/projects")).toBe("/home/user/projects");
  });
});
