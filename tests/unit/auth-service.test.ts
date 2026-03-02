import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock config before importing the service
vi.mock("../../packages/server/src/lib/config.js", () => ({
  loadConfig: () => ({
    port: 3000,
    nodeEnv: "test",
    encryptionKey: "",
    jwtSecret: "test-jwt-secret-key",
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

import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from "../../packages/server/src/services/auth.js";

describe("Auth Service", () => {
  describe("hashPassword", () => {
    it("should hash a password and return a bcrypt hash string", async () => {
      const password = "my-secure-password";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      // bcrypt hashes start with $2a$ or $2b$
      expect(hash).toMatch(/^\$2[ab]\$/);
      // bcrypt hash length is 60 characters
      expect(hash.length).toBe(60);
    });

    it("should produce different hashes for the same password", async () => {
      const password = "my-secure-password";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for a valid password/hash pair", async () => {
      const password = "my-secure-password";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should return false for an invalid password", async () => {
      const password = "my-secure-password";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("wrong-password", hash);

      expect(isValid).toBe(false);
    });
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token string", () => {
      const payload = { userId: "admin", role: "admin" };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      // JWT tokens have 3 parts separated by dots
      const parts = token.split(".");
      expect(parts.length).toBe(3);
    });

    it("should embed the payload in the token", () => {
      const payload = { userId: "admin", role: "admin" };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe("admin");
      expect(decoded!.role).toBe("admin");
    });
  });

  describe("verifyToken", () => {
    it("should return the payload for a valid token", () => {
      const payload = { userId: "admin", role: "admin" };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe("admin");
      expect(decoded!.role).toBe("admin");
    });

    it("should return null for an invalid token", () => {
      const decoded = verifyToken("invalid.token.here");

      expect(decoded).toBeNull();
    });

    it("should return null for a tampered token", () => {
      const payload = { userId: "admin", role: "admin" };
      const token = generateToken(payload);
      // Tamper with the token by changing the last character
      const tampered = token.slice(0, -1) + (token.slice(-1) === "a" ? "b" : "a");
      const decoded = verifyToken(tampered);

      expect(decoded).toBeNull();
    });

    it("should return null for an expired token", async () => {
      const payload = { userId: "admin", role: "admin" };
      // Generate token with 0 seconds expiry (immediately expired)
      const token = generateToken(payload, "0s");

      // Small delay to ensure the token is expired
      await new Promise((resolve) => setTimeout(resolve, 50));

      const decoded = verifyToken(token);
      expect(decoded).toBeNull();
    });
  });
});
