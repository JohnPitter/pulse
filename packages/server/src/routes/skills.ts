import { Router } from "express";
import { skillRegistry } from "../services/skill-registry.js";

export const skillsRouter = Router();

skillsRouter.get("/", (_req, res) => {
  res.json(skillRegistry.list());
});

skillsRouter.post("/", (req, res) => {
  const { name, description, type, config, enabledByDefault } = req.body as {
    name: string;
    description?: string;
    type: string;
    config?: Record<string, unknown>;
    enabledByDefault?: boolean;
  };
  if (!name || !type) {
    res.status(400).json({ error: "name and type required" });
    return;
  }
  const skill = skillRegistry.create({
    name,
    description: description ?? "",
    type: type as "tool" | "prompt" | "mcp",
    config: config ?? {},
    enabledByDefault: enabledByDefault ?? false,
  });
  res.status(201).json(skill);
});

skillsRouter.delete("/:id", (req, res) => {
  skillRegistry.delete(req.params.id);
  res.json({ ok: true });
});

skillsRouter.get("/agent/:agentId", (req, res) => {
  res.json(skillRegistry.getForAgent(req.params.agentId));
});

skillsRouter.put("/agent/:agentId", (req, res) => {
  const { skillIds } = req.body as { skillIds: string[] };
  if (!Array.isArray(skillIds)) {
    res.status(400).json({ error: "skillIds must be array" });
    return;
  }
  skillRegistry.setAgentSkills(req.params.agentId, skillIds);
  res.json({ ok: true });
});
