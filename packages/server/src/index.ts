import express from "express";
import { createServer } from "node:http";

const app = express();
const server = createServer(app);

const PORT = process.env.PORT ?? 3000;

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`Pulse server running on port ${PORT}`);
});

export { app, server };
