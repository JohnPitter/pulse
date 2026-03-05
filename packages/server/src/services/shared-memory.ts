import { db } from "../db/index.js";
import { sharedMemory } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import * as logger from "../lib/logger.js";

const MEMORY_FILE = join(process.cwd(), "data", "shared-memory.md");

function ensureDataDir(): void {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export const sharedMemoryService = {
  read(): string {
    try {
      ensureDataDir();
      if (existsSync(MEMORY_FILE)) {
        return readFileSync(MEMORY_FILE, "utf-8");
      }
      const row = db.select().from(sharedMemory).where(eq(sharedMemory.id, 1)).limit(1).get();
      return row?.content ?? "# Shared Memory\n\nWrite notes here.\n";
    } catch (err) {
      logger.error("Failed to read shared memory", "memory");
      return "# Shared Memory\n\nWrite notes here.\n";
    }
  },

  write(content: string): void {
    ensureDataDir();
    writeFileSync(MEMORY_FILE, content, "utf-8");
    db.update(sharedMemory)
      .set({ content, updatedAt: new Date() })
      .where(eq(sharedMemory.id, 1))
      .run();
    logger.info("Shared memory updated", "memory");
  },
};
