import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { agents, chatMessages, settings } from "../../packages/server/src/db/schema.js";

describe("Database Schema", () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle>;

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

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY NOT NULL,
        agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_timestamp ON chat_messages (agent_id, timestamp);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  });

  afterEach(() => {
    sqlite.close();
  });

  it("should insert and retrieve an agent with all fields", async () => {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.insert(agents).values({
      id,
      name: "test-agent",
      projectPath: "/home/user/project",
      claudeMd: "# Agent Instructions",
      initialPrompt: "You are a helpful assistant",
      model: "opus",
      thinkingEnabled: 1,
      permissionMode: "askPermission",
      status: "running",
      tmuxSession: "tmux-123",
      pid: 12345,
      lastMessage: "Hello world",
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const result = await db.select().from(agents).where(eq(agents.id, id));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id,
      name: "test-agent",
      projectPath: "/home/user/project",
      claudeMd: "# Agent Instructions",
      initialPrompt: "You are a helpful assistant",
      model: "opus",
      thinkingEnabled: 1,
      permissionMode: "askPermission",
      status: "running",
      tmuxSession: "tmux-123",
      pid: 12345,
      lastMessage: "Hello world",
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    });
  });

  it("should use default values for optional agent fields", async () => {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.insert(agents).values({
      id,
      name: "default-agent",
      projectPath: "/home/user/project",
      createdAt: now,
      updatedAt: now,
    });

    const result = await db.select().from(agents).where(eq(agents.id, id));

    expect(result).toHaveLength(1);
    expect(result[0].model).toBe("sonnet");
    expect(result[0].thinkingEnabled).toBe(0);
    expect(result[0].permissionMode).toBe("bypassPermissions");
    expect(result[0].status).toBe("stopped");
    expect(result[0].claudeMd).toBeNull();
    expect(result[0].initialPrompt).toBeNull();
    expect(result[0].tmuxSession).toBeNull();
    expect(result[0].pid).toBeNull();
    expect(result[0].lastMessage).toBeNull();
    expect(result[0].lastActiveAt).toBeNull();
  });

  it("should insert and retrieve chat messages by agentId", async () => {
    const agentId = uuidv4();
    const now = new Date().toISOString();

    await db.insert(agents).values({
      id: agentId,
      name: "chat-agent",
      projectPath: "/home/user/project",
      createdAt: now,
      updatedAt: now,
    });

    const msg1Id = uuidv4();
    const msg2Id = uuidv4();
    const ts1 = "2025-01-01T10:00:00.000Z";
    const ts2 = "2025-01-01T10:01:00.000Z";

    await db.insert(chatMessages).values([
      {
        id: msg1Id,
        agentId,
        role: "user",
        content: "Hello",
        timestamp: ts1,
      },
      {
        id: msg2Id,
        agentId,
        role: "assistant",
        content: "Hi there!",
        timestamp: ts2,
        metadata: JSON.stringify({ tokens: 10 }),
      },
    ]);

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.agentId, agentId))
      .orderBy(chatMessages.timestamp);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      id: msg1Id,
      agentId,
      role: "user",
      content: "Hello",
      timestamp: ts1,
      metadata: null,
    });
    expect(messages[1]).toMatchObject({
      id: msg2Id,
      agentId,
      role: "assistant",
      content: "Hi there!",
      timestamp: ts2,
      metadata: JSON.stringify({ tokens: 10 }),
    });
  });

  it("should store and retrieve settings", async () => {
    await db.insert(settings).values([
      { key: "theme", value: "dark" },
      { key: "language", value: "en" },
    ]);

    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "theme"));

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ key: "theme", value: "dark" });

    // Update a setting
    await db
      .update(settings)
      .set({ value: "light" })
      .where(eq(settings.key, "theme"));

    const updated = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "theme"));

    expect(updated[0].value).toBe("light");
  });

  it("should enforce unique agent names", async () => {
    const now = new Date().toISOString();

    await db.insert(agents).values({
      id: uuidv4(),
      name: "unique-agent",
      projectPath: "/home/user/project",
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      db.insert(agents).values({
        id: uuidv4(),
        name: "unique-agent",
        projectPath: "/home/user/other-project",
        createdAt: now,
        updatedAt: now,
      })
    ).rejects.toThrow(/UNIQUE constraint failed/);
  });

  it("should cascade delete chat messages when agent is deleted", async () => {
    const agentId = uuidv4();
    const now = new Date().toISOString();

    await db.insert(agents).values({
      id: agentId,
      name: "deletable-agent",
      projectPath: "/home/user/project",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(chatMessages).values([
      {
        id: uuidv4(),
        agentId,
        role: "user",
        content: "Message 1",
        timestamp: now,
      },
      {
        id: uuidv4(),
        agentId,
        role: "assistant",
        content: "Message 2",
        timestamp: now,
      },
    ]);

    // Verify messages exist
    const beforeDelete = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(eq(chatMessages.agentId, agentId));
    expect(beforeDelete[0].count).toBe(2);

    // Delete the agent
    await db.delete(agents).where(eq(agents.id, agentId));

    // Verify messages are cascade deleted
    const afterDelete = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(eq(chatMessages.agentId, agentId));
    expect(afterDelete[0].count).toBe(0);
  });
});
