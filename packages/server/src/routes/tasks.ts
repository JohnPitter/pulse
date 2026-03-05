import { Router } from "express";
import type { Request, Response } from "express";
import { eq, desc, and, gte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { tasks, taskExecutions } from "../db/schema.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "tasks-route";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

// GET / — list all tasks, optional ?status= filter
tasksRouter.get("/", async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const rows = statusFilter
      ? await db.select().from(tasks).where(eq(tasks.status, statusFilter)).orderBy(desc(tasks.createdAt))
      : await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error("Failed to list tasks", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

// GET /stats — counts by status + completion rate today
tasksRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const allTasks = await db.select({ status: tasks.status }).from(tasks);

    const counts: Record<string, number> = {
      backlog: 0, scheduled: 0, running: 0, completed: 0, failed: 0,
    };
    for (const t of allTasks) {
      if (t.status in counts) counts[t.status]++;
    }

    const completedToday = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.status, "completed"), gte(tasks.updatedAt, todayStart)));

    const totalToday = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(gte(tasks.createdAt, todayStart));

    const completionRate = totalToday.length > 0
      ? Math.round((completedToday.length / totalToday.length) * 100)
      : 0;

    res.json({ counts, completionRate, total: allTasks.length });
  } catch (err) {
    logger.error("Failed to get task stats", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to get task stats" });
  }
});

// GET /last-execution — most recent task execution
tasksRouter.get("/last-execution", async (_req: Request, res: Response) => {
  try {
    const row = await db
      .select()
      .from(taskExecutions)
      .orderBy(desc(taskExecutions.startedAt))
      .limit(1);
    if (row.length === 0) { res.json(null); return; }

    const exec = row[0];
    const taskRow = await db.select().from(tasks).where(eq(tasks.id, exec.taskId)).limit(1);
    res.json({ ...exec, task: taskRow[0] ?? null });
  } catch (err) {
    logger.error("Failed to get last execution", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to get last execution" });
  }
});

// POST / — create task
tasksRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { title, description, priority, dueAt, scheduledAt, agentId, projectId } =
      req.body as Record<string, string | undefined>;

    if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }

    const now = new Date().toISOString();
    const task = {
      id: randomUUID(),
      title: title.trim(),
      description: description?.trim() ?? null,
      status: scheduledAt ? "scheduled" : "backlog",
      priority: (priority as string) ?? "medium",
      dueAt: dueAt ?? null,
      scheduledAt: scheduledAt ?? null,
      agentId: agentId ?? null,
      projectId: projectId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(task);
    res.status(201).json(task);
  } catch (err) {
    logger.error("Failed to create task", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PATCH /:id — update task
tasksRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const body = req.body as Record<string, unknown>;
    await db.update(tasks).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(tasks.id, id));
    const updated = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!updated.length) { res.status(404).json({ error: "Task not found" }); return; }
    res.json(updated[0]);
  } catch (err) {
    logger.error("Failed to update task", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /:id
tasksRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(tasks).where(eq(tasks.id, String(req.params.id)));
    res.status(204).send();
  } catch (err) {
    logger.error("Failed to delete task", CONTEXT, { error: String(err) });
    res.status(500).json({ error: "Failed to delete task" });
  }
});
