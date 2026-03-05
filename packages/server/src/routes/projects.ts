import { Router } from "express";
import type { Request, Response } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "projects-route";
export const projectsRouter = Router();
projectsRouter.use(requireAuth);

projectsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error("Failed to list projects", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to list projects" });
  }
});

projectsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body as Record<string, string | undefined>;
    if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }
    const now = new Date().toISOString();
    const project = {
      id: randomUUID(),
      name: name.trim(),
      description: description?.trim() ?? null,
      color: color ?? "#FF9A3C",
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(projects).values(project);
    res.status(201).json(project);
  } catch (err) {
    logger.error("Failed to create project", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to create project" });
  }
});

projectsRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const body = req.body as Record<string, unknown>;
    await db.update(projects).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(projects.id, id));
    const updated = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!updated.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

projectsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(projects).where(eq(projects.id, String(req.params.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});
