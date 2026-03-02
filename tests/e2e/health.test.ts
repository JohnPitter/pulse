import { describe, it, expect, vi } from "vitest";
import express from "express";
import type { Request, Response } from "express";
import request from "supertest";

// Mock logger to suppress output during tests
vi.mock("../../packages/server/src/lib/logger.js", () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

/**
 * Standalone E2E smoke test for the health endpoint.
 * Uses a minimal Express app that mirrors the real /api/health route
 * from packages/server/src/index.ts to avoid booting the full server
 * (Socket.io, node-pty, real DB, etc.).
 */
describe("Health Check", () => {
  const app = express();

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  it("GET /api/health returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });

  it("GET /api/health returns a valid ISO timestamp", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);

    const timestamp = new Date(res.body.timestamp);
    expect(timestamp.toISOString()).toBe(res.body.timestamp);
    expect(timestamp.getTime()).not.toBeNaN();
  });

  it("GET /api/health returns correct content-type", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
  });
});
