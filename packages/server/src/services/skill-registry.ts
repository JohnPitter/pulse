import { db } from "../db/index.js";
import { skills, agentSkills } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export type SkillType = "tool" | "prompt" | "mcp";

export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  config: Record<string, unknown>;
  enabledByDefault: boolean;
}

export interface CompiledSkills {
  systemPromptAdditions: string[];
  mcpServers: Record<string, { command: string; args: string[] }>;
  toolSkills: SkillRecord[];
}

export const skillRegistry = {
  list(): SkillRecord[] {
    return db.select().from(skills).all().map(parseSkill);
  },

  getForAgent(agentId: string): SkillRecord[] {
    const rows = db
      .select({ skill: skills })
      .from(agentSkills)
      .innerJoin(skills, eq(agentSkills.skillId, skills.id))
      .where(eq(agentSkills.agentId, agentId))
      .all();
    return rows.map((r) => parseSkill(r.skill));
  },

  create(input: Omit<SkillRecord, "id">): SkillRecord {
    const id = uuidv4();
    db.insert(skills).values({
      id,
      name: input.name,
      description: input.description,
      type: input.type,
      config: JSON.stringify(input.config),
      enabledByDefault: input.enabledByDefault,
    }).run();
    return { id, ...input };
  },

  delete(id: string): void {
    db.delete(skills).where(eq(skills.id, id)).run();
  },

  setAgentSkills(agentId: string, skillIds: string[]): void {
    db.delete(agentSkills).where(eq(agentSkills.agentId, agentId)).run();
    if (skillIds.length === 0) return;
    db.insert(agentSkills).values(
      skillIds.map((skillId) => ({ agentId, skillId }))
    ).run();
  },

  compile(agentSkillList: SkillRecord[]): CompiledSkills {
    const systemPromptAdditions: string[] = [];
    const mcpServers: Record<string, { command: string; args: string[] }> = {};
    const toolSkills: SkillRecord[] = [];

    for (const skill of agentSkillList) {
      if (skill.type === "prompt") {
        const cfg = skill.config as { promptText?: string };
        if (cfg.promptText) systemPromptAdditions.push(cfg.promptText);
      } else if (skill.type === "mcp") {
        const cfg = skill.config as { command?: string; args?: string[] };
        if (cfg.command) {
          mcpServers[skill.name] = { command: cfg.command, args: cfg.args ?? [] };
        }
      } else if (skill.type === "tool") {
        toolSkills.push(skill);
      }
    }

    return { systemPromptAdditions, mcpServers, toolSkills };
  },
};

function parseSkill(row: typeof skills.$inferSelect): SkillRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type as SkillType,
    config: JSON.parse(row.config) as Record<string, unknown>,
    enabledByDefault: row.enabledByDefault,
  };
}
