import { describe, it, expect, vi, afterEach } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats seconds ago", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const tenSecondsAgo = new Date(now - 10_000).toISOString();
    const result = formatRelativeTime(tenSecondsAgo);
    expect(result).toMatch(/10/);
  });

  it("formats minutes ago", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const fiveMinutesAgo = new Date(now - 5 * 60_000).toISOString();
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(result).toMatch(/5/);
  });

  it("formats hours ago", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const twoHoursAgo = new Date(now - 2 * 3600_000).toISOString();
    const result = formatRelativeTime(twoHoursAgo);
    expect(result).toMatch(/2/);
  });

  it("returns at least 1 second for very recent dates", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const justNow = new Date(now).toISOString();
    const result = formatRelativeTime(justNow);
    expect(result).toMatch(/1/);
  });
});
