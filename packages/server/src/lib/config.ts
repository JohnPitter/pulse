export interface Config {
  port: number;
  nodeEnv: string;
  encryptionKey: string;
  jwtSecret: string;
  dbPath: string;
  corsOrigin: string;
}

/**
 * Loads configuration from environment variables with sensible defaults.
 */
export function loadConfig(): Config {
  const parsedPort = parseInt(process.env.PORT ?? '', 10);

  return {
    port: Number.isNaN(parsedPort) ? 3000 : parsedPort,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    encryptionKey: process.env.ENCRYPTION_KEY ?? '',
    jwtSecret: process.env.JWT_SECRET ?? 'pulse-dev-secret',
    dbPath: process.env.DB_PATH ?? './data/pulse.db',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  };
}
