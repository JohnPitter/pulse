import { Router } from "express";
import type { Request, Response } from "express";
import { readdir, mkdir, stat } from "node:fs/promises";
import { resolve, normalize, dirname, sep } from "node:path";
import { homedir } from "node:os";

import { requireAuth } from "../middleware/auth.js";
import * as logger from "../lib/logger.js";

const CONTEXT = "filesystem";

const router = Router();

router.use(requireAuth);

/**
 * GET /browse?path=/some/path
 * Lists subdirectories at the given path (defaults to home directory).
 */
router.get("/browse", async (req: Request, res: Response) => {
  try {
    const rawPath = typeof req.query.path === "string" ? req.query.path : "";
    const targetPath = rawPath ? resolve(normalize(rawPath)) : homedir();

    let entries: { name: string; path: string }[];
    try {
      const dirents = await readdir(targetPath, { withFileTypes: true });
      entries = dirents
        .filter((d) => d.isDirectory() && !d.name.startsWith("."))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({
          name: d.name,
          path: resolve(targetPath, d.name),
        }));
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EACCES") {
        res.status(403).json({ error: "Permission denied" });
        return;
      }
      if (code === "ENOENT" || code === "ENOTDIR") {
        res.status(400).json({ error: "Directory not found" });
        return;
      }
      throw err;
    }

    const parentPath = dirname(targetPath);

    res.json({
      currentPath: targetPath,
      parentPath: parentPath !== targetPath ? parentPath : null,
      separator: sep,
      directories: entries,
    });
  } catch (error) {
    logger.error(`Failed to browse filesystem: ${error}`, CONTEXT);
    res.status(500).json({ error: "Failed to browse directory" });
  }
});

/**
 * POST /mkdir
 * Creates a new directory at the given absolute path.
 */
router.post("/mkdir", async (req: Request, res: Response) => {
  try {
    const rawPath = req.body?.path;
    if (!rawPath || typeof rawPath !== "string") {
      res.status(400).json({ error: "Path is required" });
      return;
    }

    const targetPath = resolve(normalize(rawPath));
    logger.debug(`mkdir request: raw="${rawPath}" resolved="${targetPath}"`, CONTEXT);

    const existing = await stat(targetPath).catch(() => null);
    if (existing) {
      if (existing.isDirectory()) {
        res.status(409).json({ error: "Directory already exists" });
        return;
      }
      res.status(400).json({ error: "A file already exists at this path" });
      return;
    }

    // Validate that the parent path is a reachable directory
    const parent = dirname(targetPath);
    const parentStat = await stat(parent).catch(() => null);
    if (parentStat && !parentStat.isDirectory()) {
      res.status(400).json({ error: `Parent path is not a directory: ${parent}` });
      return;
    }

    try {
      await mkdir(targetPath, { recursive: true });
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      logger.error(`mkdir failed: code=${code} path=${targetPath}`, CONTEXT, { error: String(err) });
      if (code === "EACCES") {
        res.status(403).json({ error: "Permission denied" });
        return;
      }
      if (code === "ENOENT") {
        res.status(400).json({ error: `Parent directory does not exist or path is invalid: ${parent}` });
        return;
      }
      res.status(400).json({ error: `Failed to create directory: ${code ?? "unknown error"}` });
      return;
    }

    logger.info(`Created directory: ${targetPath}`, CONTEXT);
    res.status(201).json({ path: targetPath });
  } catch (error) {
    logger.error(`Failed to create directory: ${error}`, CONTEXT);
    res.status(500).json({ error: "Failed to create directory" });
  }
});

export { router as filesystemRouter };
