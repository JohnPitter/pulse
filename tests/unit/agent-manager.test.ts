import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { AgentManager } from "../../packages/server/src/services/agent-manager.js";
import type { ClaudeCommandOptions } from "../../packages/server/src/services/agent-manager.js";

describe("AgentManager", () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle>;
  let manager: AgentManager;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    db = drizzle(sqlite);

    sqlite.exec(`
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
      );

      CREATE INDEX IF NOT EXISTS idx_agents_status ON agents (status);
    `);

    manager = new AgentManager(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe("createAgent", () => {
    it("should create an agent with all fields including model and permissionMode", async () => {
      const agent = await manager.createAgent({
        name: "test-agent",
        projectPath: "/home/user/project",
        model: "opus",
        thinkingEnabled: 1,
        permissionMode: "acceptEdits",
        claudeMd: "# Instructions",
        initialPrompt: "You are helpful",
      });

      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe("test-agent");
      expect(agent.projectPath).toBe("/home/user/project");
      expect(agent.model).toBe("opus");
      expect(agent.thinkingEnabled).toBe(1);
      expect(agent.permissionMode).toBe("acceptEdits");
      expect(agent.claudeMd).toBe("# Instructions");
      expect(agent.initialPrompt).toBe("You are helpful");
      expect(agent.status).toBe("stopped");
      expect(agent.createdAt).toBeDefined();
      expect(agent.updatedAt).toBeDefined();
    });

    it("should use default values when optional fields are omitted", async () => {
      const agent = await manager.createAgent({
        name: "default-agent",
        projectPath: "/home/user/project",
      });

      expect(agent.model).toBe("sonnet");
      expect(agent.thinkingEnabled).toBe(0);
      expect(agent.permissionMode).toBe("bypassPermissions");
      expect(agent.status).toBe("stopped");
      expect(agent.claudeMd).toBeNull();
      expect(agent.initialPrompt).toBeNull();
    });

    it("should reject duplicate agent names", async () => {
      await manager.createAgent({
        name: "unique-agent",
        projectPath: "/home/user/project",
      });

      await expect(
        manager.createAgent({
          name: "unique-agent",
          projectPath: "/home/user/other-project",
        })
      ).rejects.toThrow();
    });
  });

  describe("listAgents", () => {
    it("should list all agents", async () => {
      await manager.createAgent({
        name: "agent-1",
        projectPath: "/home/user/project1",
      });
      await manager.createAgent({
        name: "agent-2",
        projectPath: "/home/user/project2",
      });

      const agents = await manager.listAgents();

      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.name).sort()).toEqual(["agent-1", "agent-2"]);
    });

    it("should return empty array when no agents exist", async () => {
      const agents = await manager.listAgents();
      expect(agents).toHaveLength(0);
    });
  });

  describe("getAgent", () => {
    it("should get an agent by id", async () => {
      const created = await manager.createAgent({
        name: "find-me",
        projectPath: "/home/user/project",
        model: "haiku",
      });

      const found = await manager.getAgent(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe("find-me");
      expect(found!.model).toBe("haiku");
    });

    it("should return undefined for non-existent id", async () => {
      const found = await manager.getAgent("non-existent-id");
      expect(found).toBeUndefined();
    });
  });

  describe("updateAgent", () => {
    it("should update agent fields (model, thinkingEnabled)", async () => {
      const created = await manager.createAgent({
        name: "update-me",
        projectPath: "/home/user/project",
        model: "sonnet",
        thinkingEnabled: 0,
      });

      // Ensure timestamp difference by waiting a small amount
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await manager.updateAgent(created.id, {
        model: "opus",
        thinkingEnabled: 1,
      });

      expect(updated).toBeDefined();
      expect(updated!.model).toBe("opus");
      expect(updated!.thinkingEnabled).toBe(1);
      expect(updated!.name).toBe("update-me");
      expect(updated!.updatedAt).not.toBe(created.updatedAt);
    });

    it("should return undefined when updating non-existent agent", async () => {
      const result = await manager.updateAgent("non-existent-id", {
        model: "opus",
      });
      expect(result).toBeUndefined();
    });
  });

  describe("deleteAgent", () => {
    it("should delete an agent by id", async () => {
      const created = await manager.createAgent({
        name: "delete-me",
        projectPath: "/home/user/project",
      });

      const deleted = await manager.deleteAgent(created.id);
      expect(deleted).toBe(true);

      const found = await manager.getAgent(created.id);
      expect(found).toBeUndefined();
    });

    it("should return false when deleting non-existent agent", async () => {
      const deleted = await manager.deleteAgent("non-existent-id");
      expect(deleted).toBe(false);
    });
  });

  describe("buildClaudeCommand", () => {
    it("should build command with sonnet + thinking + bypassPermissions", () => {
      const options: ClaudeCommandOptions = {
        model: "sonnet",
        thinkingEnabled: 1,
        permissionMode: "bypassPermissions",
      };

      const command = manager.buildClaudeCommand(options);

      expect(command).toEqual([
        "claude",
        "--model",
        "sonnet",
        "--thinking",
        "--dangerously-skip-permissions",
      ]);
    });

    it("should build command with opus + no thinking + acceptEdits", () => {
      const options: ClaudeCommandOptions = {
        model: "opus",
        thinkingEnabled: 0,
        permissionMode: "acceptEdits",
      };

      const command = manager.buildClaudeCommand(options);

      expect(command).toEqual([
        "claude",
        "--model",
        "opus",
        "--acceptEdits",
      ]);
    });

    it("should build command with haiku + no thinking + default (no permission flag)", () => {
      const options: ClaudeCommandOptions = {
        model: "haiku",
        thinkingEnabled: 0,
        permissionMode: "default",
      };

      const command = manager.buildClaudeCommand(options);

      expect(command).toEqual(["claude", "--model", "haiku"]);
    });

    it("should build command with sonnet + no thinking + plan", () => {
      const options: ClaudeCommandOptions = {
        model: "sonnet",
        thinkingEnabled: 0,
        permissionMode: "plan",
      };

      const command = manager.buildClaudeCommand(options);

      expect(command).toEqual([
        "claude",
        "--model",
        "sonnet",
        "--plan",
      ]);
    });
  });
});
