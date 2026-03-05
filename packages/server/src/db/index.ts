import fs from "node:fs";
import path from "node:path";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const DB_PATH = process.env.PULSE_DB_PATH ?? path.join(process.cwd(), "data", "pulse.db");

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite: DatabaseType = new Database(DB_PATH);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const createAgents = `
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
    started_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`;

const createAgentsIndex = `CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)`;

const createChatMessages = `
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    metadata TEXT
  )`;

const createChatIndex = `CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_timestamp ON chat_messages(agent_id, timestamp)`;

const createSettings = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )`;

const createSkills = `
  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL,
    config TEXT NOT NULL DEFAULT '{}',
    enabled_by_default INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`;

const createAgentSkills = `
  CREATE TABLE IF NOT EXISTS agent_skills (
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (agent_id, skill_id)
  )`;

const createSharedMemory = `
  CREATE TABLE IF NOT EXISTS shared_memory (
    id INTEGER PRIMARY KEY DEFAULT 1,
    content TEXT NOT NULL DEFAULT '# Shared Memory\n\nWrite notes here that all agents will read.\n',
    updated_at INTEGER NOT NULL
  )`;

// Auto-create tables if they don't exist
sqlite.prepare(createAgents).run();
sqlite.prepare(createAgentsIndex).run();
sqlite.prepare(createChatMessages).run();
sqlite.prepare(createChatIndex).run();
sqlite.prepare(createSettings).run();
sqlite.prepare(createSkills).run();
sqlite.prepare(createAgentSkills).run();
sqlite.prepare(createSharedMemory).run();

// Migration guard: add started_at column if missing (for existing DBs created before this column was inlined above)
try {
  sqlite.prepare(`ALTER TABLE agents ADD COLUMN started_at TEXT`).run();
} catch {
  // Column already exists — safe to ignore
}

// Ensure shared_memory singleton row exists
const sharedMemoryDefault = "# Shared Memory\n\nWrite notes here that all agents will read.\n";
sqlite
  .prepare(`INSERT OR IGNORE INTO shared_memory (id, content, updated_at) VALUES (1, ?, ?)`)
  .run(sharedMemoryDefault, Date.now());

export const db = drizzle(sqlite, { schema });
export { sqlite };
