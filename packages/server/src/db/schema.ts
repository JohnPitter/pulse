import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";

export const agents = sqliteTable(
  "agents",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull().unique(),
    projectPath: text("project_path").notNull(),
    claudeMd: text("claude_md"),
    initialPrompt: text("initial_prompt"),
    model: text("model").notNull().default("sonnet"),
    thinkingEnabled: integer("thinking_enabled").notNull().default(0),
    permissionMode: text("permission_mode").notNull().default("bypassPermissions"),
    status: text("status").notNull().default("stopped"),
    tmuxSession: text("tmux_session"),
    pid: integer("pid"),
    lastMessage: text("last_message"),
    lastActiveAt: text("last_active_at"),
    startedAt: text("started_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_agents_status").on(table.status),
  ]
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey().notNull(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    timestamp: text("timestamp").notNull(),
    metadata: text("metadata"),
  },
  (table) => [
    index("idx_chat_messages_agent_timestamp").on(table.agentId, table.timestamp),
  ]
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey().notNull(),
  value: text("value").notNull(),
});

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull(), // "tool" | "prompt" | "mcp"
  config: text("config").notNull().default("{}"), // JSON string
  enabledByDefault: integer("enabled_by_default", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const agentSkills = sqliteTable("agent_skills", {
  agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  skillId: text("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.agentId, t.skillId] }),
}));

export const sharedMemory = sqliteTable("shared_memory", {
  id: integer("id").primaryKey().default(1),
  content: text("content").notNull().default("# Shared Memory\n\nWrite notes here that all agents will read.\n"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
