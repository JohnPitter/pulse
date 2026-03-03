import { Router } from "express";
import type { Request, Response } from "express";
import { eq, desc } from "drizzle-orm";

import type { AgentManager } from "../services/agent-manager.js";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { chatMessages } from "../db/schema.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "agents-route";
const DEFAULT_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LIMIT = 200;

function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

/**
 * Creates an Express Router for agent CRUD endpoints.
 * Accepts a shared AgentManager instance for consistency
 * with the socket layer.
 */
export function createAgentRouter(agentManager: AgentManager): Router {
  const router = Router();

  router.use(requireAuth);

  /**
   * GET / — list all agents
   */
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const agents = await agentManager.listAgents();
      res.json(agents);
    } catch (err) {
      logger.error("Failed to list agents", CONTEXT, { error: String(err) });
      res.status(500).json({ error: "Failed to list agents" });
    }
  });

  /**
   * GET /:id — get agent by id
   */
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const id = getParamId(req);
      const agent = await agentManager.getAgent(id);
      if (!agent) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }
      res.json(agent);
    } catch (err) {
      logger.error("Failed to get agent", CONTEXT, { error: String(err), agentId: getParamId(req) });
      res.status(500).json({ error: "Failed to get agent" });
    }
  });

  /**
   * POST / — create agent
   * Required: name, projectPath
   * Defaults: model=sonnet, permissionMode=bypassPermissions
   */
  router.post("/", async (req: Request, res: Response) => {
    try {
      const { name, projectPath, claudeMd, initialPrompt, model, thinkingEnabled, permissionMode } = req.body as Record<string, unknown>;

      if (!name || !projectPath) {
        res.status(400).json({ error: "name and projectPath are required" });
        return;
      }

      const agent = await agentManager.createAgent({
        name: name as string,
        projectPath: projectPath as string,
        claudeMd: claudeMd as string | undefined,
        initialPrompt: initialPrompt as string | undefined,
        model: (model as string) ?? "sonnet",
        thinkingEnabled: thinkingEnabled ? 1 : 0,
        permissionMode: (permissionMode as string) ?? "bypassPermissions",
      });

      res.status(201).json(agent);
    } catch (err) {
      const message = String(err);
      if (message.includes("UNIQUE constraint failed")) {
        res.status(409).json({ error: "Agent name already exists" });
        return;
      }
      logger.error("Failed to create agent", CONTEXT, { error: message });
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  /**
   * PATCH /:id — update agent
   */
  router.patch("/:id", async (req: Request, res: Response) => {
    try {
      const id = getParamId(req);
      const body = req.body as Record<string, unknown>;
      if ("thinkingEnabled" in body) {
        body.thinkingEnabled = body.thinkingEnabled ? 1 : 0;
      }
      const agent = await agentManager.updateAgent(id, body);
      if (!agent) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }
      res.json(agent);
    } catch (err) {
      logger.error("Failed to update agent", CONTEXT, { error: String(err), agentId: getParamId(req) });
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  /**
   * GET /:id/messages — get chat history for an agent
   * Query params: limit (default 100, max 200)
   */
  router.get("/:id/messages", async (req: Request, res: Response) => {
    try {
      const id = getParamId(req);
      const agent = await agentManager.getAgent(id);
      if (!agent) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }

      const rawLimit = parseInt(req.query.limit as string, 10);
      const limit = Math.min(
        Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_MESSAGE_LIMIT,
        MAX_MESSAGE_LIMIT,
      );

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.agentId, id))
        .orderBy(desc(chatMessages.timestamp))
        .limit(limit);

      // Return in chronological order (oldest first)
      res.json(messages.reverse());
    } catch (err) {
      logger.error("Failed to get agent messages", CONTEXT, {
        error: String(err),
        agentId: getParamId(req),
      });
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  /**
   * DELETE /:id — delete agent
   */
  router.delete("/:id", async (req: Request, res: Response) => {
    try {
      const id = getParamId(req);
      const deleted = await agentManager.deleteAgent(id);
      if (!deleted) {
        res.status(404).json({ error: "Agent not found" });
        return;
      }
      res.status(204).send();
    } catch (err) {
      logger.error("Failed to delete agent", CONTEXT, { error: String(err), agentId: getParamId(req) });
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });

  return router;
}
