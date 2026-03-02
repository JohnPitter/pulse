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

// Mock the encryption module to avoid needing ENCRYPTION_KEY in tests
vi.mock("../../packages/server/src/lib/encryption.js", () => ({
  encrypt: (plaintext: string) => `encrypted:${plaintext}`,
  decrypt: (ciphertext: string) => ciphertext.replace("encrypted:", ""),
}));

// Import routes AFTER mocks are set up
const { authRouter } = await import("../../packages/server/src/routes/auth.js");
const { settingsRouter } = await import("../../packages/server/src/routes/settings.js");

let app: express.Express;

const TEST_PASSWORD = "test-admin-password";
let authCookie: string;

beforeAll(async () => {
  // Create settings table in the in-memory DB
  sqlite.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )
  `).run();

  // Hash the test password and insert it
  const hashedPassword = await hashPassword(TEST_PASSWORD);
  sqlite.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run("admin_password_hash", hashedPassword);

  // Create Express app for testing
  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/settings", settingsRouter);

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

beforeEach(async () => {
  // Clean settings except admin_password_hash (needed for auth)
  sqlite.prepare("DELETE FROM settings WHERE key != 'admin_password_hash'").run();

  // Restore the password hash in case a test changed it
  const hashedPassword = await hashPassword(TEST_PASSWORD);
  sqlite.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run("admin_password_hash", hashedPassword);
});

afterAll(() => {
  sqlite.close();
});

describe("Settings Routes Integration", () => {
  describe("Authentication required", () => {
    it("GET /api/settings/claude-auth/status should return 401 without auth cookie", async () => {
      const res = await request(app).get("/api/settings/claude-auth/status");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("POST /api/settings/claude-auth should return 401 without auth cookie", async () => {
      const res = await request(app)
        .post("/api/settings/claude-auth")
        .send({ type: "apikey", token: "sk-ant-test123" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("POST /api/settings/password should return 401 without auth cookie", async () => {
      const res = await request(app)
        .post("/api/settings/password")
        .send({ currentPassword: TEST_PASSWORD, newPassword: "new-password" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("GET /api/settings/oauth-url should return 401 without auth cookie", async () => {
      const res = await request(app).get("/api/settings/oauth-url");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });
  });

  describe("GET /api/settings/claude-auth/status", () => {
    it("should return not configured when no auth is set", async () => {
      const res = await request(app)
        .get("/api/settings/claude-auth/status")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(false);
      expect(res.body.type).toBeNull();
    });

    it("should return configured with type when auth is set", async () => {
      // Insert claude auth settings directly
      sqlite.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`).run("claude_auth_type", "apikey");
      sqlite.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`).run("claude_auth_token", "encrypted:sk-ant-test");

      const res = await request(app)
        .get("/api/settings/claude-auth/status")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(true);
      expect(res.body.type).toBe("apikey");
    });

    it("should return not configured when only type exists but not token", async () => {
      sqlite.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`).run("claude_auth_type", "apikey");

      const res = await request(app)
        .get("/api/settings/claude-auth/status")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(false);
      expect(res.body.type).toBeNull();
    });
  });

  describe("POST /api/settings/claude-auth", () => {
    it("should save API key auth", async () => {
      const res = await request(app)
        .post("/api/settings/claude-auth")
        .set("Cookie", authCookie)
        .send({ type: "apikey", token: "sk-ant-test-token-123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it was saved by checking status
      const statusRes = await request(app)
        .get("/api/settings/claude-auth/status")
        .set("Cookie", authCookie);

      expect(statusRes.body.configured).toBe(true);
      expect(statusRes.body.type).toBe("apikey");
    });

    it("should save OAuth auth with refresh token", async () => {
      const res = await request(app)
        .post("/api/settings/claude-auth")
        .set("Cookie", authCookie)
        .send({ type: "oauth", token: "oauth-access-token", refreshToken: "oauth-refresh-token" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const statusRes = await request(app)
        .get("/api/settings/claude-auth/status")
        .set("Cookie", authCookie);

      expect(statusRes.body.configured).toBe(true);
      expect(statusRes.body.type).toBe("oauth");
    });

    it("should return 400 when type is missing", async () => {
      const res = await request(app)
        .post("/api/settings/claude-auth")
        .set("Cookie", authCookie)
        .send({ token: "sk-ant-test" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("type and token are required");
    });

    it("should return 400 when token is missing", async () => {
      const res = await request(app)
        .post("/api/settings/claude-auth")
        .set("Cookie", authCookie)
        .send({ type: "apikey" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("type and token are required");
    });

    it("should return 400 for invalid type", async () => {
      const res = await request(app)
        .post("/api/settings/claude-auth")
        .set("Cookie", authCookie)
        .send({ type: "invalid", token: "some-token" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("type must be 'oauth' or 'apikey'");
    });

    it("should return 400 when API key does not start with sk-ant-", async () => {
      const res = await request(app)
        .post("/api/settings/claude-auth")
        .set("Cookie", authCookie)
        .send({ type: "apikey", token: "invalid-key-format" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("API key must start with sk-ant-");
    });
  });

  describe("POST /api/settings/password", () => {
    it("should change password successfully", async () => {
      const newPassword = "new-secure-password";

      const res = await request(app)
        .post("/api/settings/password")
        .set("Cookie", authCookie)
        .send({ currentPassword: TEST_PASSWORD, newPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify new password works by logging in
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ password: newPassword });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it("should return 400 when currentPassword is missing", async () => {
      const res = await request(app)
        .post("/api/settings/password")
        .set("Cookie", authCookie)
        .send({ newPassword: "new-password" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("currentPassword and newPassword are required");
    });

    it("should return 400 when newPassword is missing", async () => {
      const res = await request(app)
        .post("/api/settings/password")
        .set("Cookie", authCookie)
        .send({ currentPassword: TEST_PASSWORD });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("currentPassword and newPassword are required");
    });

    it("should return 400 when newPassword is too short", async () => {
      const res = await request(app)
        .post("/api/settings/password")
        .set("Cookie", authCookie)
        .send({ currentPassword: TEST_PASSWORD, newPassword: "short" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("New password must be at least 6 characters");
    });

    it("should return 401 when currentPassword is incorrect", async () => {
      const res = await request(app)
        .post("/api/settings/password")
        .set("Cookie", authCookie)
        .send({ currentPassword: "wrong-password", newPassword: "new-valid-password" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Current password is incorrect");
    });
  });

  describe("GET /api/settings/oauth-url", () => {
    it("should return an OAuth URL with state", async () => {
      const res = await request(app)
        .get("/api/settings/oauth-url")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
      expect(res.body.url).toContain("https://claude.ai/oauth/authorize");
      expect(res.body.url).toContain("code_challenge=");
      expect(res.body.url).toContain("state=");
      expect(res.body.state).toBeDefined();
    });
  });
});
