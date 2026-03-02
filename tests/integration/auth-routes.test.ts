import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
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

let app: express.Express;

const TEST_PASSWORD = "test-admin-password";

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
});

afterAll(() => {
  sqlite.close();
});

describe("Auth Routes Integration", () => {
  describe("POST /api/auth/login", () => {
    it("should return 400 when password is missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Password is required");
    });

    it("should return 401 for invalid password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid password");
    });

    it("should return 200 and set cookie for valid password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Check that the Set-Cookie header contains the token cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("token="))
        : (cookies as string);
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain("HttpOnly");
      expect(tokenCookie).toContain("SameSite=Strict");
    });

    it("should return 401 when no admin password is configured", async () => {
      // Remove the admin password from settings
      sqlite.prepare(`DELETE FROM settings WHERE key = ?`).run("admin_password_hash");

      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("not configured");

      // Restore the password for subsequent tests
      const hashedPassword = await hashPassword(TEST_PASSWORD);
      sqlite.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run("admin_password_hash", hashedPassword);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear the token cookie and return success", async () => {
      const res = await request(app)
        .post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // The Set-Cookie header should clear the token
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("token="))
        : (cookies as string);
      expect(tokenCookie).toBeDefined();
    });
  });

  describe("GET /api/auth/check", () => {
    it("should return 401 when no token is provided", async () => {
      const res = await request(app)
        .get("/api/auth/check");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should return 401 with invalid token cookie", async () => {
      const res = await request(app)
        .get("/api/auth/check")
        .set("Cookie", "token=invalid.jwt.token");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid or expired token");
    });

    it("should return authenticated true with valid token", async () => {
      // First login to get a valid token
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ password: TEST_PASSWORD });

      expect(loginRes.status).toBe(200);

      // Extract the token cookie
      const cookies = loginRes.headers["set-cookie"];
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("token="))
        : (cookies as string);

      // Use the token cookie in the check request
      const checkRes = await request(app)
        .get("/api/auth/check")
        .set("Cookie", tokenCookie!);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.authenticated).toBe(true);
      expect(checkRes.body.user.userId).toBe("admin");
      expect(checkRes.body.user.role).toBe("admin");
    });
  });

  describe("Rate limiting on login", () => {
    it("should block after 5 failed login attempts", async () => {
      // Make 5 requests (the rate limiter allows 5 per window)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/auth/login")
          .send({ password: "wrong-password" });
      }

      // The 6th request should be rate limited
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "wrong-password" });

      expect(res.status).toBe(429);
      expect(res.body.error).toContain("Too many login attempts");
    });
  });
});
