import { Router } from "express";
import { sharedMemoryService } from "../services/shared-memory.js";

export const memoryRouter = Router();

memoryRouter.get("/", (_req, res) => {
  res.json({ content: sharedMemoryService.read() });
});

memoryRouter.put("/", (req, res) => {
  const { content } = req.body as { content: string };
  if (typeof content !== "string") {
    res.status(400).json({ error: "content must be string" });
    return;
  }
  sharedMemoryService.write(content);
  res.json({ ok: true });
});
