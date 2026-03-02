import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../packages/server/src/db/schema.js";
import { hashPassword } from "../../packages/server/src/services/auth.js";

// Mock config before importing routes
vi.mock("../../packages/server/src/lib/config.js", () => ({
  loadConfig: () => ({
    port: 3000,
    nodeEnv: "test",
    encryptionKey: "",
    jwtSecret: "integration-test-jwt-secret",
    dbPath: ":memory:",
    corsOrigin: "http://localhost:5173",
  }),
}));

// Mock logger to suppress output during tests
vi.mock("../../packages/server/src/lib/logger.js", () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

// Create in-memory SQLite for tests
const sqlite = new Database(":memory:");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const testDb = drizzle(sqlite, { schema });

// Mock the db module to use our in-memory database
vi.mock("../../packages/server/src/db/index.js", () => ({
  db: testDb,
  sqlite,
}));

// Import routes AFTER mocks are set up
const { authRouter } = await import("../../packages/server/src/routes/auth.js");
const { createAgentRouter } = await import("../../packages/server/src/routes/agents.js");
const { AgentManager } = await import("../../packages/server/src/services/agent-manager.js");

let app: express.Express;

const TEST_PASSWORD = "test-admin-password";
let authCookie: string;

beforeAll(async () => {
  // Create tables in the in-memory DB
  sqlite.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )
  `).run();

  sqlite.prepare(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      project_path TEXT NOT NULL,
      claude_md TEXT,
      initial_prompt TEXT,
      model TEXT NOT NULL DEFAULT 'sonnet',
      thinking_enabled INTEGER NOT NULL DEFAULT 0,
      permission_mode TEXT NOT NULL DEFAULT 'bypassPermissions',
      status TEXT NOT NULL DEFAULT 'stopped',
      tmux_session TEXT,
      pid INTEGER,
      last_message TEXT,
      last_active_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  sqlite.prepare(`
    CREATE INDEX IF NOT EXISTS idx_agents_status ON agents (status)
  `).run();

  sqlite.prepare(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      metadata TEXT
    )
  `).run();

  sqlite.prepare(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_timestamp ON chat_messages (agent_id, timestamp)
  `).run();

  // Hash the test password and insert it
  const hashedPassword = await hashPassword(TEST_PASSWORD);
  sqlite.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run("admin_password_hash", hashedPassword);

  // Create Express app for testing
  const agentManager = new AgentManager(testDb);

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/agents", createAgentRouter(agentManager));

  // Login to get an auth cookie for authenticated requests
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ password: TEST_PASSWORD });

  const cookies = loginRes.headers["set-cookie"];
  const tokenCookie = Array.isArray(cookies)
    ? cookies.find((c: string) => c.startsWith("token="))
    : (cookies as string);

  authCookie = tokenCookie!;
});

beforeEach(() => {
  // Clean agents table before each test
  sqlite.prepare("DELETE FROM agents").run();
});

afterAll(() => {
  sqlite.close();
});

describe("Agents Routes Integration", () => {
  describe("Authentication required", () => {
    it("GET /api/agents should return 401 without auth cookie", async () => {
      const res = await request(app).get("/api/agents");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("POST /api/agents should return 401 without auth cookie", async () => {
      const res = await request(app)
        .post("/api/agents")
        .send({ name: "test", projectPath: "/tmp" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("GET /api/agents/:id should return 401 without auth cookie", async () => {
      const res = await request(app).get("/api/agents/some-id");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("PATCH /api/agents/:id should return 401 without auth cookie", async () => {
      const res = await request(app)
        .patch("/api/agents/some-id")
        .send({ name: "updated" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("DELETE /api/agents/:id should return 401 without auth cookie", async () => {
      const res = await request(app).delete("/api/agents/some-id");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });
  });

  describe("GET /api/agents", () => {
    it("should return empty list initially", async () => {
      const res = await request(app)
        .get("/api/agents")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return list of created agents", async () => {
      // Create two agents first
      await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "agent-1", projectPath: "/home/user/project1" });

      await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "agent-2", projectPath: "/home/user/project2" });

      const res = await request(app)
        .get("/api/agents")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);

      const names = res.body.map((a: { name: string }) => a.name).sort();
      expect(names).toEqual(["agent-1", "agent-2"]);
    });
  });

  describe("POST /api/agents", () => {
    it("should create an agent with required fields", async () => {
      const res = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "new-agent", projectPath: "/home/user/project" });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("new-agent");
      expect(res.body.projectPath).toBe("/home/user/project");
      expect(res.body.model).toBe("sonnet");
      expect(res.body.permissionMode).toBe("bypassPermissions");
      expect(res.body.thinkingEnabled).toBe(0);
      expect(res.body.status).toBe("stopped");
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it("should create an agent with all optional fields", async () => {
      const res = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({
          name: "full-agent",
          projectPath: "/home/user/project",
          claudeMd: "# Instructions",
          initialPrompt: "You are helpful",
          model: "opus",
          thinkingEnabled: 1,
          permissionMode: "acceptEdits",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("full-agent");
      expect(res.body.claudeMd).toBe("# Instructions");
      expect(res.body.initialPrompt).toBe("You are helpful");
      expect(res.body.model).toBe("opus");
      expect(res.body.thinkingEnabled).toBe(1);
      expect(res.body.permissionMode).toBe("acceptEdits");
    });

    it("should return 400 when name is missing", async () => {
      const res = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ projectPath: "/home/user/project" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("name and projectPath are required");
    });

    it("should return 400 when projectPath is missing", async () => {
      const res = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "no-path-agent" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("name and projectPath are required");
    });

    it("should return 409 when agent name already exists", async () => {
      await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "duplicate-agent", projectPath: "/home/user/project" });

      const res = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "duplicate-agent", projectPath: "/home/user/other" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Agent name already exists");
    });
  });

  describe("GET /api/agents/:id", () => {
    it("should return a created agent by id", async () => {
      const createRes = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "find-me", projectPath: "/home/user/project" });

      const agentId = createRes.body.id;

      const res = await request(app)
        .get(`/api/agents/${agentId}`)
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(agentId);
      expect(res.body.name).toBe("find-me");
      expect(res.body.projectPath).toBe("/home/user/project");
    });

    it("should return 404 for non-existent agent", async () => {
      const res = await request(app)
        .get("/api/agents/non-existent-id")
        .set("Cookie", authCookie);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Agent not found");
    });
  });

  describe("PATCH /api/agents/:id", () => {
    it("should update an agent's fields", async () => {
      const createRes = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "update-me", projectPath: "/home/user/project", model: "sonnet" });

      const agentId = createRes.body.id;

      const res = await request(app)
        .patch(`/api/agents/${agentId}`)
        .set("Cookie", authCookie)
        .send({ model: "opus", thinkingEnabled: 1 });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(agentId);
      expect(res.body.model).toBe("opus");
      expect(res.body.thinkingEnabled).toBe(1);
      expect(res.body.name).toBe("update-me");
    });

    it("should update the updatedAt timestamp", async () => {
      const createRes = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "timestamp-agent", projectPath: "/home/user/project" });

      const agentId = createRes.body.id;
      const originalUpdatedAt = createRes.body.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const res = await request(app)
        .patch(`/api/agents/${agentId}`)
        .set("Cookie", authCookie)
        .send({ model: "haiku" });

      expect(res.status).toBe(200);
      expect(res.body.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("should return 404 when updating non-existent agent", async () => {
      const res = await request(app)
        .patch("/api/agents/non-existent-id")
        .set("Cookie", authCookie)
        .send({ model: "opus" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Agent not found");
    });
  });

  describe("DELETE /api/agents/:id", () => {
    it("should delete an agent and return 204", async () => {
      const createRes = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "delete-me", projectPath: "/home/user/project" });

      const agentId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/agents/${agentId}`)
        .set("Cookie", authCookie);

      expect(res.status).toBe(204);
    });

    it("should return 404 when getting a deleted agent", async () => {
      const createRes = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({ name: "gone-agent", projectPath: "/home/user/project" });

      const agentId = createRes.body.id;

      // Delete it
      await request(app)
        .delete(`/api/agents/${agentId}`)
        .set("Cookie", authCookie);

      // Try to fetch it
      const res = await request(app)
        .get(`/api/agents/${agentId}`)
        .set("Cookie", authCookie);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Agent not found");
    });

    it("should return 404 when deleting non-existent agent", async () => {
      const res = await request(app)
        .delete("/api/agents/non-existent-id")
        .set("Cookie", authCookie);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Agent not found");
    });
  });

  describe("CRUD lifecycle", () => {
    it("should support full create -> read -> update -> delete cycle", async () => {
      // CREATE
      const createRes = await request(app)
        .post("/api/agents")
        .set("Cookie", authCookie)
        .send({
          name: "lifecycle-agent",
          projectPath: "/home/user/project",
          model: "sonnet",
        });

      expect(createRes.status).toBe(201);
      const agentId = createRes.body.id;

      // READ
      const getRes = await request(app)
        .get(`/api/agents/${agentId}`)
        .set("Cookie", authCookie);

      expect(getRes.status).toBe(200);
      expect(getRes.body.name).toBe("lifecycle-agent");

      // UPDATE
      const updateRes = await request(app)
        .patch(`/api/agents/${agentId}`)
        .set("Cookie", authCookie)
        .send({ model: "opus", claudeMd: "# Updated instructions" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.model).toBe("opus");
      expect(updateRes.body.claudeMd).toBe("# Updated instructions");

      // Verify update persisted
      const verifyRes = await request(app)
        .get(`/api/agents/${agentId}`)
        .set("Cookie", authCookie);

      expect(verifyRes.body.model).toBe("opus");
      expect(verifyRes.body.claudeMd).toBe("# Updated instructions");

      // DELETE
      const deleteRes = await request(app)
        .delete(`/api/agents/${agentId}`)
        .set("Cookie", authCookie);

      expect(deleteRes.status).toBe(204);

      // Verify delete
      const notFoundRes = await request(app)
        .get(`/api/agents/${agentId}`)
        .set("Cookie", authCookie);

      expect(notFoundRes.status).toBe(404);

      // List should be empty
      const listRes = await request(app)
        .get("/api/agents")
        .set("Cookie", authCookie);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(0);
    });
  });
});
