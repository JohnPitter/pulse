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

// Auto-create tables if they don't exist
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

  CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    metadata TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_timestamp ON chat_messages(agent_id, timestamp);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
export { sqlite };
