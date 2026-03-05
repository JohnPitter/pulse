import { Router } from "express";
import { agentSessionManager } from "../services/agent-session.js";
import type { SessionEvent } from "../services/agent-session.js";

export const streamRouter = Router();

streamRouter.get("/:id/stream", (req, res) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // Client disconnected
    }
  };

  send("connected", { agentId: id });

  const unsub = agentSessionManager.subscribe(id, (event: SessionEvent) => {
    send(event.type, event);
  });

  req.on("close", () => {
    unsub();
  });
});
